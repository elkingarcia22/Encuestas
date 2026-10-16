#!/usr/bin/env node
// Verificación en navegador de pantallas reales y páginas del design system después de un cambio.
//
// Uso (con el local corriendo en http://localhost:5173):
//   node .claude/skills/sincronizar-design-system/scripts/verificar.mjs /design-system/header /admin/seleccion/vacantes
//
// Opciones:
//   --base=http://localhost:5173   servidor
//   --modos=light,dark             modos de color
//   --anchos=1440,1920             anchos de ventana (contenido: 1104 en 1440 con la barra abierta, 1140 a 1920)
//   --alto=1600                    alto de ventana (más alto = axe revisa más contenido)
//   --sin-axe                      no correr el escaneo AA
//   --salida=<carpeta>             dónde guardar capturas y el informe (por defecto en la carpeta temporal)
//
// Por cada ruta, modo y ancho: captura de pantalla, errores de consola, ancho real del contenido, scroll horizontal y
// fallos WCAG 2.2 A/AA de axe-core. Las capturas hay que MIRARLAS: axe no ve nombres de anatomía encimados, cortes
// visuales ni si la réplica se parece al componente real.

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const opts = Object.fromEntries(
  process.argv
    .slice(2)
    .filter((a) => a.startsWith('--'))
    .map((a) => {
      const [k, v] = a.slice(2).split('=')
      return [k, v ?? true]
    }),
)
const rutas = process.argv.slice(2).filter((a) => !a.startsWith('--'))
if (!rutas.length) {
  console.error('Pasa al menos una ruta, por ejemplo: /design-system/navegacion')
  process.exit(1)
}
const base = opts.base ?? 'http://localhost:5173'
const modos = String(opts.modos ?? 'light,dark').split(',')
const anchos = String(opts.anchos ?? '1440,1920').split(',').map(Number)
const alto = Number(opts.alto ?? 1600)
const salida = opts.salida ?? path.join(os.tmpdir(), 'verificar-design-system', new Date().toISOString().replace(/[:.]/g, '-'))
fs.mkdirSync(salida, { recursive: true })

// Playwright: el del proyecto no está instalado; se busca uno global.
async function cargarPlaywright() {
  const candidatos = [
    process.env.PLAYWRIGHT_MODULE,
    '/opt/homebrew/lib/node_modules/gsd-pi/node_modules/playwright/index.mjs',
    '/opt/homebrew/lib/node_modules/playwright/index.mjs',
    '/usr/local/lib/node_modules/playwright/index.mjs',
    'playwright',
  ].filter(Boolean)
  for (const c of candidatos) {
    try {
      return await import(c)
    } catch {}
  }
  console.error('No encontré Playwright. Instálalo con: npm i -g playwright && npx playwright install chromium')
  console.error('o indica la ruta con PLAYWRIGHT_MODULE=/ruta/a/playwright/index.mjs')
  process.exit(1)
}

// axe-core desde cdnjs, guardado en caché.
async function cargarAxe() {
  const cache = path.join(os.homedir(), '.cache', 'playground-ux', 'axe-4.10.2.min.js')
  if (!fs.existsSync(cache)) {
    const res = await fetch('https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js')
    if (!res.ok) throw new Error(`No se pudo descargar axe-core (${res.status})`)
    fs.mkdirSync(path.dirname(cache), { recursive: true })
    fs.writeFileSync(cache, await res.text())
  }
  return fs.readFileSync(cache, 'utf8')
}

const { chromium } = await cargarPlaywright()
const axe = opts['sin-axe'] ? null : await cargarAxe()

try {
  const res = await fetch(base)
  if (!res.ok) throw new Error(String(res.status))
} catch {
  console.error(`El local no responde en ${base}. Pídele a Nicolás que lo levante o levántalo suelto:`)
  console.error('(nohup npm start -- --port 5173 --strictPort > ~/Library/Logs/playground-ux-local.log 2>&1 &)')
  process.exit(1)
}

const browser = await chromium.launch()
const informe = []
let totalFallos = 0

for (const modo of modos) {
  for (const ancho of anchos) {
    const ctx = await browser.newContext({ viewport: { width: ancho, height: alto }, deviceScaleFactor: 1 })
    await ctx.addInitScript((m) => {
      try {
        localStorage.setItem('flux-ui-mode', m)
      } catch {}
    }, modo)
    const page = await ctx.newPage()
    let errores = []
    page.on('pageerror', (e) => errores.push(e.message.slice(0, 160)))
    page.on('console', (m) => {
      if (m.type() === 'error') errores.push(m.text().slice(0, 160))
    })

    for (const ruta of rutas) {
      errores = []
      await page.goto(base + ruta, { waitUntil: 'networkidle', timeout: 45000 })
      await page.waitForTimeout(1200)
      const medidas = await page.evaluate(() => {
        // Borde izquierdo y derecho de lo visible dentro del contenido (sin header, pie, barra lateral ni avisos).
        const barra = document.querySelector('[data-slot=sidebar-container]')?.getBoundingClientRect().right ?? 0
        let izq = Infinity
        let der = -Infinity
        for (const el of document.querySelectorAll('body *')) {
          if (el.closest('header, footer, [data-slot=sidebar], nav[aria-label="Menú plegado"], [data-sonner-toaster], [role=dialog]')) continue
          const r = el.getBoundingClientRect()
          const s = getComputedStyle(el)
          if (r.width < 8 || r.height < 8 || r.left < barra - 1 || s.visibility === 'hidden' || r.top > innerHeight) continue
          if (r.width > innerWidth - barra - 2 || r.right > innerWidth + 1) continue
          // Solo lo que se ve: texto propio, imagen, control, o caja con fondo o borde. Los envoltorios invisibles no
          // cuentan (si no, un div a todo el ancho haría parecer que la pantalla no respeta los 1140).
          const texto = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
          const control = /^(IMG|SVG|BUTTON|INPUT|TEXTAREA|SELECT|CANVAS|VIDEO)$/i.test(el.tagName)
          const caja = !/rgba\(0, 0, 0, 0\)|transparent/.test(s.backgroundColor) || parseFloat(s.borderLeftWidth) > 0 || parseFloat(s.borderRightWidth) > 0
          if (!texto && !control && !caja) continue
          izq = Math.min(izq, r.left)
          der = Math.max(der, r.right)
        }
        return {
          modoReal: document.documentElement.dataset.mode ?? 'light',
          contenido: Number.isFinite(izq) ? { izquierda: Math.round(izq), derecha: Math.round(der), ancho: Math.round(der - izq) } : null,
          scrollHorizontal: document.documentElement.scrollWidth > innerWidth + 1,
        }
      })
      let fallos = []
      if (axe) {
        await page.addScriptTag({ content: axe })
        fallos = await page.evaluate(async () => {
          const r = await window.axe.run(document, {
            runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
            resultTypes: ['violations'],
          })
          return r.violations.map((v) => ({
            regla: v.id,
            impacto: v.impact,
            cantidad: v.nodes.length,
            ejemplos: v.nodes.slice(0, 3).map((n) => ({ selector: n.target.join(' '), detalle: (n.failureSummary ?? '').slice(-200) })),
          }))
        })
      }
      const nombre = `${modo}-${ancho}-${ruta.replace(/\//g, '_') || 'inicio'}.png`
      await page.screenshot({ path: path.join(salida, nombre) })
      const n = fallos.reduce((acc, f) => acc + f.cantidad, 0)
      totalFallos += n
      informe.push({ ruta, modo, ancho, ...medidas, errores: [...new Set(errores)], fallosAA: fallos, captura: nombre })
      const c = medidas.contenido
      console.log(
        [
          modo.padEnd(5),
          String(ancho).padEnd(4),
          ruta.padEnd(48),
          c ? `contenido ${c.izquierda}→${c.derecha} (${c.ancho})` : 'contenido —',
          medidas.scrollHorizontal ? 'SCROLL HORIZONTAL' : '',
          errores.length ? `errores ${errores.length}` : '',
          axe ? `AA ${n ? `✗ ${n}` : '✓'}` : '',
          medidas.modoReal !== modo ? `(modo real: ${medidas.modoReal})` : '',
        ]
          .filter(Boolean)
          .join('  '),
      )
    }
    await ctx.close()
  }
}

await browser.close()
fs.writeFileSync(path.join(salida, 'informe.json'), JSON.stringify(informe, null, 2))
console.log(`\nCapturas e informe: ${salida}`)
if (axe) console.log(totalFallos ? `Fallos AA en total: ${totalFallos} (detalle en informe.json)` : 'AA: 0 fallos')
