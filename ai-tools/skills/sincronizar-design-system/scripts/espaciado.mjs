#!/usr/bin/env node
// Revisa en el navegador que el ritmo de espaciado sea el mismo en toda la interfaz.
//
// Uso (con el local corriendo en http://localhost:5173):
//   node .claude/skills/sincronizar-design-system/scripts/espaciado.mjs            # todas las rutas del menú
//   node .claude/skills/sincronizar-design-system/scripts/espaciado.mjs /admin     # solo unas rutas
//
// Opciones:
//   --base=http://localhost:5173   servidor
//   --detalle                      lista cada caso fuera de norma (por defecto solo el resumen)
//   --salida=<archivo.json>        guarda todo lo medido
//
// Qué mide, sobre lo que de verdad se pinta (no sobre el código):
//   · Un título y su bajada → deben quedar a 4px.
//   · Un icono (hasta 20px) y su texto en una fila → 8px.
//   · Una baldosa o un avatar (24px o más) y su texto → 12px.
//
// Las tres salen del CSS de la librería (`style-vega.css`: item-content, card-header, field-content y popover-header
// usan 4px; dropdown-menu-item y sidebar-menu-button, 8px). La regla está en `/design-system/espacio`.
//
// Ojo: mide lo que está a la vista. Lo que vive dentro de un menú o un panel cerrado no se cuenta; para eso hay que
// abrirlo a mano y mirar la captura.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const aqui = path.dirname(fileURLToPath(import.meta.url))
const raiz = path.resolve(aqui, '../../../..')

const args = process.argv.slice(2)
const opt = (nombre, porDefecto) => {
  const encontrado = args.find((a) => a.startsWith(`--${nombre}=`))
  return encontrado ? encontrado.slice(nombre.length + 3) : porDefecto
}
const base = opt('base', 'http://localhost:5173')
const detalle = args.includes('--detalle')
const salida = opt('salida', null)
const rutasPedidas = args.filter((a) => a.startsWith('/'))

// Las rutas del menú: es la lista que ya mantiene nav-config.
const navConfig = fs.readFileSync(path.join(raiz, 'src/shared/layouts/nav-config.ts'), 'utf8')
const rutas = rutasPedidas.length
  ? rutasPedidas
  : [...new Set([...navConfig.matchAll(/path: '(\/[^']*)'/g)].map((m) => m[1]))].sort()

// Playwright: el del proyecto si está, si no el que haya instalado globalmente.
const CANDIDATOS = [
  path.join(raiz, 'node_modules/playwright/index.mjs'),
  '/opt/homebrew/lib/node_modules/gsd-pi/node_modules/playwright/index.mjs',
  '/opt/homebrew/lib/node_modules/playwright/index.mjs',
  '/usr/local/lib/node_modules/playwright/index.mjs',
]
let chromium
for (const ruta of CANDIDATOS) {
  if (!fs.existsSync(ruta)) continue
  ;({ chromium } = await import(ruta))
  break
}
if (!chromium) {
  console.error('No encontré Playwright. Instálalo con «npm i -D playwright» o usa el global.')
  process.exit(2)
}

// ── Lo que se ejecuta dentro de la página ──────────────────────────────────────
const MEDIR = () => {
  const visible = (el) => {
    const b = el.getBoundingClientRect()
    // Lo que solo existe para el lector de pantalla (`sr-only`) mide 1px: no cuenta como algo que se vea.
    return b.width > 2 && b.height > 2 && getComputedStyle(el).visibility !== 'hidden'
  }
  const clase = (el) => (typeof el.className === 'string' ? el.className : '')
  const slot = (el) => el.getAttribute?.('data-slot') || ''
  const texto = (el) => (el.textContent || '').trim()

  const esBajada = (el) => {
    if (/-description$/.test(slot(el))) return true
    return /text-muted-foreground/.test(clase(el)) && texto(el).length > 0
  }
  const esTitulo = (el) => {
    // Un título es texto. Si lo de arriba lleva controles (un campo, botones, una caja de escribir) no es un título
    // con su bajada, es un bloque con una nota debajo: eso no entra en la regla.
    const CONTROL = 'input,textarea,button,select,[role="button"],[data-slot$="-trigger"]'
    if (el.matches(CONTROL) || el.querySelector(CONTROL)) return false
    if (texto(el).length < 2) return false
    if (/-title$/.test(slot(el))) return true
    if (/^H[1-6]$/.test(el.tagName)) return true
    const cs = getComputedStyle(el)
    return parseInt(cs.fontWeight, 10) >= 500 || parseFloat(cs.fontSize) >= 16
  }

  const pares = []
  for (const bajada of document.querySelectorAll('span,p,div,h1,h2,h3,h4,h5,h6')) {
    if (!esBajada(bajada) || !visible(bajada)) continue
    const previo = bajada.previousElementSibling
    if (!previo || !esTitulo(previo) || !visible(previo)) continue
    const padre = bajada.parentElement
    if (!padre) continue
    const cs = getComputedStyle(padre)
    if (cs.display !== 'flex' || cs.flexDirection !== 'column') continue
    // Lo que la propia librería decide con otro aire no se cuenta: el Item en su tamaño más compacto (xs) junta las
    // líneas a 0, y el Alert, el Empty y las ventanas traen el suyo (2 y 8px).
    if (bajada.closest('[data-slot="item"][data-size="xs"]')) continue
    if (/^(alert|alert-dialog|dialog|empty|field)-description$/.test(slot(bajada))) continue
    if (bajada.closest('[data-slot="timeline-item"]')) continue
    const hueco = cs.rowGap === 'normal' ? 0 : Math.round(parseFloat(cs.rowGap))
    pares.push({ tipo: 'titulo-bajada', px: hueco, titulo: texto(previo).slice(0, 40), bajada: texto(bajada).slice(0, 40) })
  }

  const filas = []
  for (const fila of document.querySelectorAll('[data-slot$="-item"],[data-slot="sidebar-menu-button"],[data-slot$="-sub-trigger"]')) {
    if (!visible(fila)) continue
    const cs = getComputedStyle(fila)
    if (cs.display !== 'flex' || cs.flexDirection === 'column') continue
    // La pieza de la izquierda es el PRIMER hijo de la fila (baldosa, avatar, icono o casilla). Se mide ese, no el
    // dibujo que lleve dentro: una baldosa de 28px con un icono de 16px adentro sigue siendo una baldosa.
    const media = fila.firstElementChild
    if (!media || !visible(media)) continue
    if (!media.querySelector('svg,img') && media.tagName !== 'SVG' && media.tagName !== 'IMG') continue
    if (texto(media).length > 2) continue
    const alto = Math.round(media.getBoundingClientRect().height)
    const hueco = cs.columnGap === 'normal' ? 0 : Math.round(parseFloat(cs.columnGap))
    filas.push({ tipo: alto <= 20 ? 'icono-texto' : 'baldosa-texto', px: hueco, alto, texto: texto(fila).slice(0, 40) })
  }

  return [...pares, ...filas]
}

const ESPERADO = { 'titulo-bajada': 4, 'icono-texto': 8, 'baldosa-texto': 12 }
const NOMBRE = {
  'titulo-bajada': 'Un título y su bajada',
  'icono-texto': 'Un icono y su texto',
  'baldosa-texto': 'Una baldosa o avatar y su texto',
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })

const todo = []
let fallos = 0
for (const ruta of rutas) {
  try {
    await page.goto(base + ruta, { waitUntil: 'domcontentloaded', timeout: 20000 })
    await page.waitForTimeout(600)
    const medidas = await page.evaluate(MEDIR)
    todo.push({ ruta, medidas })
    process.stdout.write(medidas.some((m) => m.px !== ESPERADO[m.tipo]) ? '·' : '.')
  } catch (e) {
    todo.push({ ruta, error: String(e).slice(0, 80) })
    process.stdout.write('x')
  }
}
await browser.close()
console.log('\n')

const resumen = {}
for (const r of todo) {
  for (const m of r.medidas ?? []) {
    const k = m.tipo
    resumen[k] ??= { total: 0, bien: 0, otros: {} }
    resumen[k].total++
    if (m.px === ESPERADO[k]) resumen[k].bien++
    else {
      resumen[k].otros[m.px] = (resumen[k].otros[m.px] || 0) + 1
      fallos++
    }
  }
}

console.log(`Rutas revisadas: ${todo.filter((t) => t.medidas).length}${todo.some((t) => t.error) ? ` (${todo.filter((t) => t.error).length} con error)` : ''}\n`)
for (const [tipo, datos] of Object.entries(resumen)) {
  const ok = datos.bien === datos.total
  console.log(`${ok ? '✓' : '✗'} ${NOMBRE[tipo]} · esperado ${ESPERADO[tipo]}px`)
  console.log(`   ${datos.bien} de ${datos.total} bien`)
  const fuera = Object.entries(datos.otros).sort((a, b) => b[1] - a[1])
  if (fuera.length) console.log('   fuera de norma: ' + fuera.map(([px, n]) => `${n} a ${px}px`).join(', '))
}

if (detalle) {
  console.log('\nCasos fuera de norma:')
  for (const r of todo) {
    for (const m of r.medidas ?? []) {
      if (m.px === ESPERADO[m.tipo]) continue
      console.log(`  ${String(m.px).padStart(3)}px  ${r.ruta}  ${m.titulo ?? m.texto ?? ''}`)
    }
  }
}

if (salida) {
  fs.writeFileSync(salida, JSON.stringify(todo, null, 1))
  console.log('\nMedidas guardadas en ' + salida)
}

console.log(`\n${fallos === 0 ? 'Todo en su sitio.' : `${fallos} caso(s) fuera de norma.`}`)
process.exit(fallos === 0 ? 0 : 1)
