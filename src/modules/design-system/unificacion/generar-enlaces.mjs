// Genera enlaces.ts: para cada variante que la auditoría compara, en qué archivos aparece y a qué pantalla lleva cada
// uno. Las pantallas salen de los routes.ts (se leen con el compilador de TypeScript, sin ejecutar nada) y sus nombres
// del menú (nav-config.ts). Correr después de cambiar pantallas:
//   node src/modules/design-system/unificacion/generar-enlaces.mjs
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'

const RAIZ = path.resolve(import.meta.dirname, '../../../..')
const SRC = path.join(RAIZ, 'src')
const aqui = import.meta.dirname

// ── Qué se busca. Cada clave la usa datos.ts en la variante que corresponde. ─────────────────────────────────────
const DETECTORES = {
  card: /<CardHeader\b/g,
  item: /<ItemContent\b/g,
  frame: /<FrameHeader\b|<FramePanel\b/g,
  table: /<TableHeader\b|<TableBody\b/g,
  datagrid: /<DataGridList\b/g,
  dialog: /<DialogContent\b/g,
  sheet: /<DrawerShell\b/g,
  'texto-crudo': /<(h1|h2|h3|h4)[\s>]|<p className=/g,
  field: /<Field\b/g,
  label: /<Label\b/g,
  select: /<SelectTrigger\b/g,
  combobox: /<Combobox\b/g,
  'badge-solido': /<Badge[^>]*variant="(success|warning|info|destructive)"/g,
  'badge-suave': /<Badge[^>]*variant="(success|warning|info|destructive)-(light|outline)"/g,
  'color-estado': /\b(bg|text|border)-(success|warning|info)\b/g,
  'gap-escala': /\bgap-(1|2|3|4|6)\b/g,
  'gap-paralela': /\bgap-(1\.5|2\.5|5)\b/g,
  'icono-size': /size=\{\d+\}/g,
  'icono-size-clase': /<HugeiconsIcon[^>]*className="[^"]*\bsize-\d/g,
  'icono-fuera-escala': /size=\{(9|10|12|13|15|17|18|22|24)\}/g,
  'icono-trazo': /strokeWidth=/g,
  'ancho-fuera': /\bw-\[1400px\]|\bmax-w-2xl\b|\bmax-w-3xl\b/g,
  // Desde el 28-sep, con el trabajo de los cuatro junto en staging.
  'alert-dialog': /<AlertDialogContent\b/g,
  'action-dialog': /<ActionDialog\b/g,
  'boton-icono': /<BotonIcono\b/g,
  'boton-icono-mano': /<Button\b[^>]*size="icon[^"]*"/g,
  'icono-ia': /<IconoIA\b|<BotonIaSecundario\b|<AiButton\b/g,
  'etiqueta-ia': /<EtiquetaIA\b/g,
  'ia-estrellas': /\b(SparklesIcon|AiMagicIcon|MagicWand01Icon|StarsIcon|AiBrain01Icon)\b/g,
  'ancho-mano': /\bmax-w-(?:[2-7]xl|screen-\w+|\[\d{3,4}px\])/g,
  // Clases con «!» (antes o después): pisan el estilo del componente de la librería.
  forzado: /(?<![\w)\]])!(?:[a-z0-9-]+:)*-?[a-z]+-[\w\-[\]./%#]+|\b[a-z]+-[\w\-[\]./%]+!(?=[\s"'`])/g,
  'control-crudo': /<(button|input|select|textarea|table)[\s>]/g,
}

const ICONOS = [
  'PlusSignIcon', 'Add01Icon', 'Tick02Icon', 'CheckmarkCircle02Icon', 'TaskDone01Icon', 'UserGroupIcon',
  'UserMultiple02Icon', 'SparklesIcon', 'AiMagicIcon', 'Mortarboard01Icon', 'MortarboardIcon', 'Alert02Icon',
  'Alert01Icon', 'DashboardSquare02Icon', 'DashboardSquare01Icon', 'CheckmarkBadge01Icon', 'UserMultipleIcon',
  'Mortarboard02Icon', 'MagicWand01Icon', 'AiBrain01Icon', 'Edit02Icon', 'PencilEdit02Icon', 'PencilEdit01Icon',
  'MoreHorizontalIcon', 'MoreVerticalIcon', 'InformationCircleIcon', 'AlertCircleIcon',
]
for (const icono of ICONOS) DETECTORES[`icono:${icono}`] = new RegExp(`\\b${icono}\\b`, 'g')

// Listas que no salen de un patrón de texto sino de la auditoría.
const FIJOS = {
  encabezados: [
    'src/modules/design-system/templates/admin-compartido/piezas.tsx',
    'src/modules/design-system/templates/colaborador/components/piezas.tsx',
    'src/modules/design-system/templates/dashboard/components/dashboard-view.tsx',
    'src/modules/design-system/templates/dashboard-rrhh/components/rrhh-view.tsx',
    'src/modules/design-system/templates/app-shell-3/components/home-view.tsx',
    'src/modules/design-system/templates/shell-test/components/page-header.tsx',
  ],
  'marco-producto': ['src/shared/layouts/RootLayout.tsx', 'src/shared/components/PageShell.tsx'],
  'marco-vivo': ['src/modules/design-system/templates/admin-compartido/marco-plantilla.tsx'],
  'marco-shellubits': [
    'src/modules/design-system/shell/shell-ubits.tsx',
    'src/modules/design-system/templates/admin-compartido/marco-admin.tsx',
  ],
  'marco-propio': [
    'src/modules/design-system/templates/suite-ai/components/marco.tsx',
  ],
  'marco-archivo': [
    'src/modules/design-system/templates/app-shell-2/components/app-shell.tsx',
    'src/modules/design-system/templates/app-shell-3/components/app-shell.tsx',
    'src/modules/design-system/templates/shell-test/components/app-shell.tsx',
  ],
  'a-mano-boton': ['src/modules/design-system/templates/app-shell-2/components/company-switcher.tsx'],
  // La barra de consumo de App shell 3 pasó a Progress el 29-sep.
  'a-mano-progreso': [],
  'a-mano-avatar': [
    'src/modules/design-system/templates/app-shell-2/components/promo-card.tsx',
    'src/shared/layouts/AppSidebar.tsx',
  ],
}

// ── Rutas: carpeta (o archivo) de cada pantalla → URL. ──────────────────────────────────────────────────────────────
const destino = new Map() // ruta absoluta del módulo importado (sin extensión) → URL
const rutasConParametro = new Map() // mismo módulo → URL con :parámetros

function leer(archivo) {
  return ts.createSourceFile(archivo, fs.readFileSync(archivo, 'utf8'), ts.ScriptTarget.Latest, true)
}

function resolver(desde, especificador) {
  if (especificador.startsWith('@/')) return path.join(SRC, especificador.slice(2))
  return path.resolve(path.dirname(desde), especificador)
}

function unir(base, tramo) {
  const url = [base, tramo].filter(Boolean).join('/').replace(/\/+/g, '/')
  return url.startsWith('/') ? url : `/${url}`
}

function recorrerRuta(nodo, base, archivo, fuente) {
  if (ts.isIdentifier(nodo)) {
    // Rutas importadas de otro archivo (p. ej. suiteAiRoutes).
    for (const sentencia of fuente.statements) {
      if (!ts.isImportDeclaration(sentencia)) continue
      const nombres = sentencia.importClause?.namedBindings
      if (!nombres || !ts.isNamedImports(nombres)) continue
      if (!nombres.elements.some((e) => e.name.text === nodo.text)) continue
      let otro = resolver(archivo, sentencia.moduleSpecifier.text)
      otro = fs.existsSync(`${otro}.ts`) ? `${otro}.ts` : otro
      const otraFuente = leer(otro)
      ts.forEachChild(otraFuente, function buscar(n) {
        if (ts.isVariableDeclaration(n) && n.name.getText() === nodo.text && n.initializer) {
          recorrerRuta(n.initializer, base, otro, otraFuente)
        } else ts.forEachChild(n, buscar)
      })
    }
    return
  }
  if (ts.isArrayLiteralExpression(nodo)) {
    for (const el of nodo.elements) recorrerRuta(ts.isSpreadElement(el) ? el.expression : el, base, archivo, fuente)
    return
  }
  if (!ts.isObjectLiteralExpression(nodo)) return
  let tramo = ''
  let importa = null
  let hijos = null
  for (const prop of nodo.properties) {
    if (!ts.isPropertyAssignment(prop)) continue
    const nombre = prop.name.getText()
    if (nombre === 'path' && ts.isStringLiteral(prop.initializer)) tramo = prop.initializer.text
    if (nombre === 'children') hijos = prop.initializer
    if (nombre === 'lazy') {
      prop.initializer.forEachChild(function buscar(n) {
        if (ts.isCallExpression(n) && n.expression.kind === ts.SyntaxKind.ImportKeyword) importa = n.arguments[0].text
        else n.forEachChild(buscar)
      })
    }
  }
  // Los parámetros opcionales se quitan; los obligatorios dejan la ruta sin enlace directo.
  const limpio = tramo.replace(/\/?:[\w-]+\?/g, '')
  const url = unir(base, limpio)
  if (importa) {
    const modulo = resolver(archivo, importa)
    if (!destino.has(modulo)) destino.set(modulo, /:\w/.test(url) ? null : url)
    if (/:\w/.test(url) && !rutasConParametro.has(modulo)) rutasConParametro.set(modulo, url)
  }
  if (hijos) recorrerRuta(hijos, url, archivo, fuente)
}

for (const archivo of ['admin', 'design-system', 'portal-colaborador'].map((m) => path.join(SRC, 'modules', m, 'routes.ts'))) {
  const fuente = leer(archivo)
  ts.forEachChild(fuente, function buscar(n) {
    if (ts.isPropertyAssignment(n) && n.name.getText() === 'routes') recorrerRuta(n.initializer, '', archivo, fuente)
    else ts.forEachChild(n, buscar)
  })
}

// Nombres del menú: la última aparición de cada ruta gana (el menú del design system va al final).
const navTexto = fs.readFileSync(path.join(SRC, 'shared/layouts/nav-config.ts'), 'utf8')
const nombreDeRuta = new Map()
for (const m of navTexto.matchAll(/title: '([^']+)',\s*path: '([^']+)'/g)) nombreDeRuta.set(m[2], m[1])

// Ejemplos reales para rutas cuyo parámetro sale de los datos del template (no hay un enlace literal que copiar).
const EJEMPLOS = {
  '/design-system/templates/colaborador/contenido/:id': '/design-system/templates/colaborador/contenido/onboarding-comercial',
  '/design-system/templates/colaborador/estudio/:id': '/design-system/templates/colaborador/estudio/onboarding-comercial',
  '/design-system/templates/planes-formacion/:id': '/design-system/templates/planes-formacion/p-01',
  '/design-system/templates/gestion-usuarios/carga-masiva/:accion': '/design-system/templates/gestion-usuarios/carga-masiva/crear',
}

// Rutas con parámetro obligatorio (p. ej. vacantes/:id): se toma un enlace real que ya exista en el proyecto y que
// no sea otra pantalla conocida. Las «pendiente» (comodín :pantalla) se quedan sin enlace: cualquier URL las abre.
const literales = new Set()
for (const a of listarTodo(SRC)) {
  for (const m of fs.readFileSync(a, 'utf8').matchAll(/['`"](\/[\w\-/]+)['`"]/g)) literales.add(m[1])
}
const fijas = new Set([...destino.values()].filter(Boolean))
for (const [modulo, url] of destino) {
  if (url !== null) continue
  const patron = [...destino.entries()].find(([m]) => m === modulo)
  const plantilla = rutasConParametro.get(modulo)
  if (!plantilla || /\/:pantalla$/.test(plantilla)) continue
  if (EJEMPLOS[plantilla]) {
    destino.set(modulo, EJEMPLOS[plantilla])
    continue
  }
  const re = new RegExp(`^${plantilla.replace(/:[\w-]+/g, '[^/]+')}$`)
  const ejemplo = [...literales].find((l) => re.test(l) && !fijas.has(l))
  if (ejemplo && patron) destino.set(modulo, ejemplo)
}

function pantallaDe(absoluto) {
  const sinExt = absoluto.replace(/\.tsx?$/, '')
  if (destino.has(sinExt)) return sinExt
  let dir = path.dirname(absoluto)
  while (dir.startsWith(SRC)) {
    const main = path.join(dir, 'main')
    if (destino.has(main)) return main
    dir = path.dirname(dir)
  }
  return null
}

// Carpetas que llevan el nombre viejo de un agente: la dirección no cambia, pero en pantalla va el nombre nuevo (1 oct).
const NOMBRE_DE_CARPETA = { 'suite-ai': 'Orbit', 'home-suite-ai': 'Home Orbit', 'agente-contextual': 'Orbit Flow' }

function titulo(url, modulo) {
  if (url && nombreDeRuta.has(url)) return nombreDeRuta.get(url)
  const tramos = (url ?? path.relative(SRC, modulo)).split('/').filter(Boolean).filter((t) => t !== 'main')
  const ultimo = tramos.at(-1) ?? 'Inicio'
  if (NOMBRE_DE_CARPETA[ultimo]) return NOMBRE_DE_CARPETA[ultimo]
  return ultimo.charAt(0).toUpperCase() + ultimo.slice(1).replaceAll('-', ' ')
}

function listarTodo(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) return listarTodo(p)
    return /\.tsx?$/.test(e.name) ? [p] : []
  })
}

// ── Quién hizo cada archivo: la persona con más líneas añadidas en él según git. Los commits firmados con la cuenta
// de Vercel conservan el nombre de cada quien, así que el nombre basta. ────────────────────────────────────────────
const PERSONAS = {
  tiangrupify: 'Cristian',
  'Cristian Muñoz': 'Cristian',
  'Nicolas Garcia': 'Nicolás',
  DavidVegaM91: 'David',
  'Elkin Garcia': 'Elkin',
}
const lineas = new Map() // archivo relativo → Map(persona → líneas)
try {
  let quien = null
  const log = execFileSync('git', ['log', '--no-merges', '--numstat', '--format=@@%an', '--', 'src'], {
    cwd: RAIZ,
    encoding: 'utf8',
    maxBuffer: 1 << 28,
  })
  for (const linea of log.split('\n')) {
    if (linea.startsWith('@@')) {
      quien = PERSONAS[linea.slice(2)] ?? 'Ingeniería'
      continue
    }
    const [mas, , archivo] = linea.split('\t')
    if (!archivo || !/^\d+$/.test(mas) || archivo.includes('=>')) continue
    const cuenta = lineas.get(archivo) ?? new Map()
    cuenta.set(quien, (cuenta.get(quien) ?? 0) + Number(mas))
    lineas.set(archivo, cuenta)
  }
} catch {
  // Sin git (p. ej. en una copia descargada) no hay autor; la página lo muestra como «Sin dato».
}
function autorDe(relativo) {
  const cuenta = lineas.get(relativo)
  if (!cuenta) return 'Sin dato'
  return [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0][0]
}

// Los imports no cuentan como uso: un icono importado y usado una vez es un uso, no dos.
const sinImports = (texto) => texto.replace(/^import[\s\S]*?from\s+['"][^'"]+['"]/gm, '')

// ── Recorrido de archivos. ─────────────────────────────────────────────────────────────────────────────────────────
function listar(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) return listar(p)
    return /\.tsx$/.test(e.name) ? [p] : []
  })
}

const PROPIOS = path.join(SRC, 'modules/design-system/unificacion')
const archivos = listar(SRC).filter((a) => !a.startsWith(PROPIOS))

// Piezas compartidas: se enlaza la primera pantalla que las importa (hasta tres saltos).
const importadores = new Map()
for (const a of listarTodo(SRC)) {
  for (const m of fs.readFileSync(a, 'utf8').matchAll(/from '((?:@\/|\.)[^']+)'/g)) {
    const objetivo = resolver(a, m[1]).replace(/\.tsx?$/, '')
    if (!importadores.has(objetivo)) importadores.set(objetivo, [])
    importadores.get(objetivo).push(a)
  }
}

function pantallaConEnlace(absoluto, saltos = 0) {
  const modulo = pantallaDe(absoluto)
  if (modulo && destino.get(modulo)) return modulo
  if (saltos > 3) return modulo
  for (const quien of importadores.get(absoluto.replace(/\.tsx?$/, '')) ?? []) {
    const encontrado = pantallaConEnlace(quien, saltos + 1)
    if (encontrado && destino.get(encontrado)) return encontrado
  }
  return modulo
}

function entrada(absoluto, usos) {
  const propia = pantallaDe(absoluto)
  const modulo = pantallaConEnlace(absoluto)
  const compartido = !propia || propia !== modulo
  // Piezas del marco general (header, barra lateral, riel): se ven en todas las pantallas; se enlaza el inicio del admin.
  const delMarco = !modulo && absoluto.startsWith(path.join(SRC, 'shared'))
  const ruta = modulo ? destino.get(modulo) : delMarco ? '/admin' : null
  return {
    pantalla: modulo ? titulo(ruta, modulo) : delMarco ? 'Marco general' : 'Compartido',
    compartido,
    ruta,
    archivo: path.relative(RAIZ, absoluto),
    autor: autorDe(path.relative(RAIZ, absoluto)),
    usos,
  }
}

const ENLACES = {}
for (const [clave, patron] of Object.entries(DETECTORES)) {
  ENLACES[clave] = archivos
    .map((a) => entrada(a, (sinImports(fs.readFileSync(a, 'utf8')).match(patron) ?? []).length))
    .filter((e) => e.usos > 0)
}
for (const [clave, lista] of Object.entries(FIJOS)) {
  ENLACES[clave] = lista.map((relativo) => entrada(path.join(RAIZ, relativo), 1))
}
for (const lista of Object.values(ENLACES)) {
  lista.sort((a, b) => a.pantalla.localeCompare(b.pantalla, 'es') || b.usos - a.usos)
}

const cabecera = `// Generado por generar-enlaces.mjs el ${new Date().toISOString().slice(0, 10)}. No editar a mano.\n\n`
const tipo = `export type Enlace = {\n  pantalla: string\n  ruta: string | null\n  archivo: string\n  autor: string\n  usos: number\n  compartido: boolean\n}\n\n`
fs.writeFileSync(
  path.join(aqui, 'enlaces.ts'),
  `${cabecera}${tipo}export const ENLACES: Record<string, Enlace[]> = ${JSON.stringify(ENLACES, null, 2)}\n`,
)
const sinRuta = new Set(Object.values(ENLACES).flat().filter((e) => !e.ruta).map((e) => e.archivo))
console.log(`${Object.keys(ENLACES).length} variantes · ${destino.size} pantallas con ruta · ${sinRuta.size} archivos sin enlace directo`)
for (const [clave, lista] of Object.entries(ENLACES)) console.log(clave.padEnd(28), lista.length)
