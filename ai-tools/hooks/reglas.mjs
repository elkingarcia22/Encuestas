// Reglas compartidas por los hooks. Todo sale de ai-tools/flux-ui/catalogo.json,
// que a su vez toma la lista de paquetes permitidos de scripts/check.mjs.

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const RUTA_CATALOGO = join(RAIZ, 'ai-tools/flux-ui/catalogo.json')

export function cargarCatalogo() {
  try {
    return JSON.parse(readFileSync(RUTA_CATALOGO, 'utf8'))
  } catch {
    return null
  }
}

const aPascal = (s) => s.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('')

// Solo se vigilan maquetas de React dentro de src/.
export function esArchivoVigilado(ruta) {
  if (!ruta) return false
  const relativa = ruta.startsWith(RAIZ) ? ruta.slice(RAIZ.length + 1) : ruta
  return /^src\/.+\.(tsx?|jsx?)$/.test(relativa)
}

// Elementos HTML que duplican un componente de la librería. Solo se vigilan en
// src/modules/ (las pantallas); el andamiaje de src/shared es de ingeniería.
const NATIVOS = {
  button: 'Button',
  input: 'Input, Checkbox, Switch o RadioGroup',
  select: 'Select o NativeSelect',
  textarea: 'Textarea',
  table: 'TablaDatos (@/modules/design-system/data-grid/tabla-datos), la única tabla del sistema',
  dialog: 'DialogoConfirmar para preguntar o ActionDialog para toda otra ventana',
  svg: '<HugeiconsIcon icon={…} /> para iconos',
}

export function revisarCodigo(texto, catalogo, ruta = '') {
  if (!texto || !catalogo) return []

  const permitidos = new Set(catalogo.paquetesPermitidos ?? [])
  const prohibidos = (catalogo.importsProhibidos ?? []).map((p) => ({ ...p, re: new RegExp(p.patron) }))
  const noInstalados = new Map(
    (catalogo.soloEnStorybook ?? []).map((c) => [aPascal(c.slug), c.titulo]),
  )
  const problemas = []

  const imports = [
    ...texto.matchAll(/import\s+(?:type\s+)?([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g),
    ...texto.matchAll(/import\s+['"]([^'"]+)['"]/g),
  ]

  for (const m of imports) {
    const spec = m[2] ?? m[1]
    const nombres = m[2] ? m[1] : ''
    if (spec.startsWith('.') || spec.startsWith('node:')) continue

    const prohibido = prohibidos.find((p) => p.re.test(spec))
    if (prohibido) {
      problemas.push(`importa "${spec}": ${prohibido.motivo}`)
      continue
    }
    if (spec.startsWith('@/')) continue

    const paquete = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]
    if (!permitidos.has(paquete)) {
      problemas.push(
        `importa "${paquete}", que no está permitido. Toda la UI sale de @ubits/flux-ui (búscala en ai-tools/flux-ui/flux-ui-para-ia.json).`,
      )
      continue
    }

    if (paquete === '@ubits/flux-ui') {
      const importados = nombres
        .replace(/[{}]/g, ' ')
        .split(',')
        .map((n) => n.replace(/^\s*type\s+/, '').split(/\s+as\s+/)[0].trim())
        .filter(Boolean)
      for (const nombre of importados) {
        if (noInstalados.has(nombre)) {
          problemas.push(
            `usa ${nombre}, que aparece en el Storybook (${noInstalados.get(nombre)}) pero no está en la versión instalada de @ubits/flux-ui. Elige otro del catálogo o pídelo al equipo de librería.`,
          )
        }
      }
    }
  }

  const relativa = ruta.startsWith(RAIZ) ? ruta.slice(RAIZ.length + 1) : ruta
  if (/^src\/modules\/.+\.[jt]sx$/.test(relativa)) {
    // `render={<button …/>}` no es una etiqueta a mano: es la forma que da flux-ui para elegir sobre qué elemento se
    // apoya uno de sus componentes (SidebarMenuSubButton, NavigationMenuLink…). Se saca antes de buscar nativos para
    // no dar un falso aviso; un `<button className=…>` de verdad sigue saltando.
    const sinRender = texto.replace(/render=\{\s*<[a-z][\w-]*[^>]*\/?>\s*\}/g, '')
    for (const [etiqueta, alternativa] of Object.entries(NATIVOS)) {
      if (new RegExp(`<${etiqueta}[\\s>/]`).test(sinRender)) {
        problemas.push(`dibuja un <${etiqueta}> a mano; la librería ya lo resuelve con ${alternativa}.`)
      }
    }
  }

  return [...new Set(problemas)]
}

export async function leerEntrada() {
  let datos = ''
  for await (const trozo of process.stdin) datos += trozo
  try {
    return JSON.parse(datos || '{}')
  } catch {
    return {}
  }
}

export function leerArchivo(ruta) {
  const absoluta = ruta.startsWith('/') ? ruta : join(RAIZ, ruta)
  return existsSync(absoluta) ? readFileSync(absoluta, 'utf8') : ''
}
