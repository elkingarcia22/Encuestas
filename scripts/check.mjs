#!/usr/bin/env node
// Valida que las maquetas respeten las reglas de AGENTS.md.
// Uso: npm run check

import { execFileSync, spawnSync } from 'node:child_process'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'src')

const ALLOWED_PACKAGES = [
  '@ubits/flux-ui',
  '@hugeicons/react',
  '@hugeicons/core-free-icons',
  '@base-ui/react',
  'recharts',
  'react',
  'react-dom',
  'react-router',
]

// Paquetes con un mensaje propio, más útil que "librería no permitida".
const BANNED_PACKAGES = new Map([
  [
    'lucide-react',
    'Los iconos del proyecto son Hugeicons. Busca el equivalente con search_icons del MCP flux-ui y úsalo con <HugeiconsIcon icon={NombreIcon} />.',
  ],
])

const PROTECTED_PATHS = [
  'src/app/',
  'src/shared/layouts/RootLayout.tsx',
  'src/shared/layouts/RootLayout.module.css',
  'src/shared/layouts/AppSidebar.tsx',
  'src/shared/components/LayoutSlot.tsx',
  'src/index.css',
  'package.json',
  'package-lock.json',
  'vite.config.ts',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'scripts/',
  'AGENTS.md',
]

const TAILWIND_PALETTE =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose'

const problems = []

function fail(rule, file, detail, howToFix) {
  problems.push({ rule, file, detail, howToFix })
}

function listFiles(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...listFiles(full))
    else if (/\.(tsx?|css)$/.test(entry.name)) out.push(full)
  }
  return out
}

const files = statSync(SRC, { throwIfNoEntry: false }) ? listFiles(SRC) : []

// 1. Librerías fuera de flux-ui.
for (const file of files) {
  if (!/\.tsx?$/.test(file)) continue
  const rel = relative(ROOT, file)
  const source = readFileSync(file, 'utf8')

  for (const match of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    const spec = match[1]
    if (spec.startsWith('.') || spec.startsWith('@/') || spec.startsWith('node:')) continue

    const pkg = spec.startsWith('@')
      ? spec.split('/').slice(0, 2).join('/')
      : spec.split('/')[0]

    if (ALLOWED_PACKAGES.includes(pkg)) continue

    fail(
      'Librería no permitida',
      rel,
      `importa "${pkg}"`,
      BANNED_PACKAGES.get(pkg) ??
        'Toda la UI sale de @ubits/flux-ui. Busca el componente con el MCP flux-ui (search_components) antes de traer otra librería.',
    )
  }
}

// 2. Colores hardcodeados en las maquetas.
for (const file of files) {
  const rel = relative(ROOT, file)
  if (!rel.startsWith('src/modules/')) continue
  const source = readFileSync(file, 'utf8')

  const literal = source.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|oklch\(/)
  if (literal) {
    fail(
      'Color hardcodeado',
      rel,
      `usa "${literal[0]}"`,
      'Usa los tokens del tema (bg-background, text-muted-foreground, bg-primary…). Consúltalos con get_theme_tokens del MCP.',
    )
  }

  const palette = source.match(
    new RegExp(`\\b(?:bg|text|border|ring|from|to)-(?:${TAILWIND_PALETTE})-\\d{2,3}\\b`),
  )
  if (palette) {
    fail(
      'Color crudo de Tailwind',
      rel,
      `usa "${palette[0]}"`,
      'Cámbialo por un token del tema para que funcione en modo claro y oscuro.',
    )
  }
}

// 3. No sobrescribir estilos de foco de flux-ui en CSS global.
for (const file of files) {
  const rel = relative(ROOT, file)
  if (!rel.endsWith('.css') || rel.startsWith('src/modules/')) continue
  const source = readFileSync(file, 'utf8')

  if (/:focus(?:-visible)?\s*\{[^}]*\boutline\b/i.test(source)) {
    fail(
      'Estilos de flux-ui sobrescritos',
      rel,
      'define outline en :focus o :focus-visible',
      'flux-ui ya maneja el foco de sus componentes. Quita reglas globales de outline/focus (ver AGENTS.md).',
    )
  }
}

// 4. Scaffolding intacto.
function git(...args) {
  try {
    return execFileSync('git', args, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return ''
  }
}

if (git('rev-parse', '--is-inside-work-tree') === 'true') {
  const base =
    git('merge-base', 'HEAD', 'origin/main') ||
    git('merge-base', 'HEAD', 'origin/master') ||
    'HEAD'

  const changed = new Set(
    [
      ...git('diff', '--name-only', base).split('\n'),
      ...git('status', '--porcelain')
        .split('\n')
        .map((line) => line.slice(3)),
    ].filter(Boolean),
  )

  for (const rel of changed) {
    const hit = PROTECTED_PATHS.find((p) =>
      p.endsWith('/') ? rel.startsWith(p) : rel === p,
    )
    if (hit) {
      fail(
        'Scaffolding modificado',
        rel,
        'este archivo es parte del andamiaje del proyecto',
        'Escríbele a ingeniería antes de cambiarlo. Las maquetas van en src/modules/<modulo>/<pantalla>/.',
      )
    }
  }
}

// 5. Módulos registrados.
const modulesDir = join(SRC, 'modules')
if (statSync(modulesDir, { throwIfNoEntry: false })) {
  const registry = readFileSync(join(SRC, 'app/register-modules.ts'), 'utf8')

  for (const entry of readdirSync(modulesDir, { withFileTypes: true })) {
    // archive es un contenedor de módulos retirados de la navegación (incluye
    // not-found, la ruta comodín que el router carga directo, sin AppModule).
    const skipEntries = ['archive']
    if (!entry.isDirectory() || skipEntries.includes(entry.name)) continue
    const rel = `src/modules/${entry.name}`

    if (!statSync(join(modulesDir, entry.name, 'routes.ts'), { throwIfNoEntry: false })) {
      fail(
        'Módulo incompleto',
        rel,
        'le falta routes.ts',
        'Crea routes.ts exportando un AppModule (mira src/modules/talent/routes.ts como ejemplo).',
      )
      continue
    }

    if (!registry.includes(`@/modules/${entry.name}/routes`)) {
      fail(
        'Módulo sin registrar',
        rel,
        'no aparece en register-modules.ts',
        'Impórtalo y agrégalo al array appModules de src/app/register-modules.ts.',
      )
    }
  }
}

// Reporte.
if (problems.length > 0) {
  console.error('\n\u001b[1mHay cosas por corregir antes de entregar\u001b[0m\n')
  for (const { rule, file, detail, howToFix } of problems) {
    console.error(`  ✗ ${rule} — ${file}`)
    console.error(`    ${detail}`)
    console.error(`    → ${howToFix}\n`)
  }
  console.error(`${problems.length} problema(s). Revisa AGENTS.md para el detalle.\n`)
  process.exit(1)
}

console.log('  ✓ Reglas del playground: todo en orden')

// El `--` es obligatorio: sin él npm se queda con el `-b` de tsc («Unknown cli config»)
// y el typecheck pasa siempre, aunque haya errores de tipo.
for (const [label, command, args] of [
  ['Lint', 'npm', ['exec', '--', 'oxlint']],
  ['Typecheck', 'npm', ['exec', '--', 'tsc', '-b', '--force']],
]) {
  const result = spawnSync(command, args, { cwd: ROOT, stdio: 'inherit' })
  if (result.status !== 0) {
    console.error(`\n${label} falló. Arréglalo antes de entregar.\n`)
    process.exit(result.status ?? 1)
  }
  console.log(`  ✓ ${label} sin errores`)
}

console.log('\nListo, la maqueta cumple las reglas.\n')
