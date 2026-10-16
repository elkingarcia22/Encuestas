#!/usr/bin/env node
// ds-ubits: el design system del Playground UX como herramienta para la IA (servidor MCP por stdio, sin dependencias).
// Responde con lo que ya está decidido, no con lo que la IA recuerda:
//   ai-tools/reglas/reglas.json          reglas vigentes, piezas del proyecto, retiradas y lo que falta decidir
//   ai-tools/flux-ui/flux-ui-para-ia.json los componentes de la librería con sus variantes
//   ai-tools/grafo/indice-archivos.json  dueño, rutas, imports y reglas de cada archivo (si existe)
//   src/                                 los usos reales, leídos en el momento
//
// Como MCP: lo registra .cursor/mcp.json (y .mcp.json, que apunta ahí) con `node ai-tools/mcp/ds-ubits.mjs`.
// Desde la terminal, para probar o para quien no tenga MCP:
//   node ai-tools/mcp/ds-ubits.mjs buscar_pieza "confirmar antes de eliminar"
//   node ai-tools/mcp/ds-ubits.mjs pieza DialogoConfirmar
//   node ai-tools/mcp/ds-ubits.mjs reglas_para src/modules/admin/tareas/crear-tarea/main.tsx
//   node ai-tools/mcp/ds-ubits.mjs revisar src/modules/admin/tareas/crear-tarea/main.tsx
//   node ai-tools/mcp/ds-ubits.mjs usos TablaDatos
//   node ai-tools/mcp/ds-ubits.mjs retiradas_en_uso
//   node ai-tools/mcp/ds-ubits.mjs por_decidir

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInterface } from 'node:readline'

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const rel = (p) => relative(RAIZ, p).split(sep).join('/')
const leerJSON = (p) => {
  try {
    return JSON.parse(readFileSync(join(RAIZ, p), 'utf8'))
  } catch {
    return null
  }
}

// ── Datos (se recargan si cambian en disco) ─────────────────────────────────────────────────────
let cache = { firma: '', datos: null }
function datos() {
  const fuentes = ['ai-tools/reglas/reglas.json', 'ai-tools/flux-ui/flux-ui-para-ia.json', 'ai-tools/grafo/indice-archivos.json']
  const firma = fuentes.map((f) => (existsSync(join(RAIZ, f)) ? statSync(join(RAIZ, f)).mtimeMs : 0)).join('|')
  if (cache.firma === firma && cache.datos) return cache.datos
  const reglas = leerJSON(fuentes[0]) ?? { reglas: [], piezas: [], retiradas: [], por_decidir: [], carpetas_congeladas: [] }
  const catalogo = leerJSON(fuentes[1]) ?? { componentes: [] }
  const indiceCrudo = leerJSON(fuentes[2])
  // indice-archivos.json guarda { archivos: { "<ruta>": {...} } }; se acepta también una lista.
  const crudos = Array.isArray(indiceCrudo) ? indiceCrudo : (indiceCrudo?.archivos ?? [])
  const lista = Array.isArray(crudos) ? crudos : Object.values(crudos)
  const indice = new Map(lista.map((a) => [a.ruta, a]))
  cache = { firma, datos: { reglas, catalogo, indice } }
  return cache.datos
}

// ── Archivos de src (para usos y retiradas) ─────────────────────────────────────────────────────
let archivosCache = null
function archivosSrc() {
  if (archivosCache) return archivosCache
  const salida = []
  const recorrer = (dir) => {
    for (const n of readdirSync(dir)) {
      if (n === 'node_modules' || n.startsWith('.')) continue
      const r = join(dir, n)
      if (statSync(r).isDirectory()) recorrer(r)
      else if (/\.(tsx?|jsx?)$/.test(n)) salida.push(rel(r))
    }
  }
  recorrer(join(RAIZ, 'src'))
  archivosCache = salida
  return salida
}
const leerArchivo = (ruta) => {
  try {
    return readFileSync(join(RAIZ, ruta), 'utf8')
  } catch {
    return null
  }
}
const congelado = (ruta) => (datos().reglas.carpetas_congeladas ?? []).some((c) => ruta.startsWith(c))
const historico = (ruta) => (datos().reglas.historicos ?? []).some((c) => ruta.startsWith(c))
const exento = (ruta, r) => congelado(ruta) || historico(ruta) || (r.exentas ?? []).some((e) => ruta.startsWith(e))

// El código sin comentarios, con las mismas líneas: un comentario que cuenta que algo se retiró no es un uso.
function sinComentarios(texto) {
  return texto
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .split('\n')
    .map((l) => (/^\s*(\/\/|\*|\{\s*\/\*)/.test(l) ? '' : l.replace(/(^|[^:'"`])\/\/.*$/, '$1')))
    .join('\n')
}
// Dónde aparece un patrón (también los que ocupan varias líneas, como un import partido).
function lineasDe(texto, patron) {
  const limpio = sinComentarios(texto)
  const re = new RegExp(patron, 'g')
  const salida = []
  for (const m of limpio.matchAll(re)) salida.push(limpio.slice(0, m.index).split('\n').length)
  return [...new Set(salida)]
}

// ── Búsqueda en español ─────────────────────────────────────────────────────────────────────────
const normal = (t) => String(t ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const SINONIMOS = {
  confirmar: ['preguntar', 'eliminar', 'borrar', 'desactivar', 'descartar', 'enviar', 'salir sin guardar'],
  borrar: ['eliminar', 'preguntar'],
  eliminar: ['borrar', 'preguntar'],
  salir: ['salida', 'salir de la creacion', 'cancelar', 'volver'],
  cancelar: ['salir', 'salida'],
  modal: ['ventana', 'dialogo'],
  dialogo: ['ventana', 'modal'],
  ventana: ['dialogo', 'modal'],
  popup: ['ventana'],
  tabla: ['listado', 'lista', 'datos', 'grid'],
  lista: ['tabla', 'listado'],
  toast: ['aviso'],
  notificacion: ['aviso'],
  aviso: ['notify', 'toast'],
  panel: ['drawer', 'lateral'],
  drawer: ['panel lateral'],
  sheet: ['panel lateral'],
  vacio: ['estado vacio', 'sin resultados', 'primera vez'],
  empty: ['vacio'],
  cargando: ['esqueleto', 'carga', 'skeleton'],
  ia: ['orbe', 'agente', 'inteligencia artificial'],
  agente: ['orbit flow', 'ia'],
  boton: ['button'],
  icono: ['boton de solo icono'],
  ayuda: ['hint', 'tooltip'],
  tooltip: ['ayuda', 'hint'],
  fecha: ['calendario', 'rango'],
  persona: ['avatar', 'usuario'],
  avatar: ['persona'],
  guardado: ['chip guardado', 'guardar'],
  insignia: ['badge', 'etiqueta'],
  badge: ['insignia'],
  cifras: ['indicadores', 'metricas', 'kpi'],
  kpi: ['cifras', 'indicadores'],
  subir: ['archivo', 'adjunto', 'cargar'],
  correo: ['escribir', 'email', 'enviar'],
  compartir: ['enlace'],
  mover: ['etapa'],
  filtro: ['filtros', 'chip'],
  crear: ['creacion', 'pagina', 'formulario'],
  formulario: ['crear', 'campo'],
  pagina: ['marco', 'pageshell'],
}
function terminos(consulta) {
  const base = normal(consulta).split(/[^a-z0-9ñ]+/).filter((t) => t.length > 2)
  const extra = base.flatMap((t) => SINONIMOS[t] ?? [])
  return [...new Set([...base, ...extra.flatMap((e) => normal(e).split(/\s+/))])]
}
function puntuar(texto, ts) {
  const n = normal(texto)
  return ts.reduce((s, t) => s + (n.includes(t) ? (t.length > 4 ? 2 : 1) : 0), 0)
}

// ── Ayudas comunes ──────────────────────────────────────────────────────────────────────────────
function reglasDePieza(nombre) {
  return datos().reglas.reglas.filter((r) => (r.piezas ?? []).includes(nombre))
}
function usosDe(nombre, max = 200) {
  const re = new RegExp(`\\b${nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`)
  const imp = new RegExp(`import[^;]*\\b${nombre}\\b[^;]*from`)
  const salida = []
  for (const ruta of archivosSrc()) {
    const t = leerArchivo(ruta)
    if (!t || !re.test(t)) continue
    if (imp.test(t)) salida.push(ruta)
    if (salida.length >= max) break
  }
  return salida
}
function ejemploReal(nombre) {
  const us = usosDe(nombre, 40).filter((r) => !r.startsWith('src/modules/design-system/') && !congelado(r))
  return us.find((r) => /\/main\.tsx$/.test(r)) ?? us[0] ?? null
}
const dueno = (ruta) => datos().indice.get(ruta)?.dueno ?? null
const ZONA_PROTEGIDA = ['src/shared/', 'src/app/', 'src/index.css', 'scripts/', 'AGENTS.md', 'package.json']
const protegida = (ruta) => ZONA_PROTEGIDA.some((z) => ruta.startsWith(z)) && ruta !== 'src/shared/layouts/nav-config.ts'

// ── Herramientas ────────────────────────────────────────────────────────────────────────────────
const HERRAMIENTAS = {
  buscar_pieza: {
    descripcion:
      'Antes de poner algo en pantalla: describe en español lo que necesitas («confirmar antes de eliminar», «tabla de personas», «salir de una creación», «aviso de éxito») y devuelve la pieza que ya resolvió el proyecto (con su import, qué no usar, una pantalla real que la usa y sus reglas). Si no hay pieza del proyecto, los componentes de @ubits/flux-ui que encajan.',
    parametros: { necesidad: { type: 'string', description: 'Lo que necesitas, en español' } },
    requeridos: ['necesidad'],
    ejecutar({ necesidad }) {
      const { reglas, catalogo } = datos()
      const ts = terminos(necesidad)
      const piezas = reglas.piezas
        .map((p) => ({ p, s: puntuar(p.necesidad, ts) * 3 + puntuar(p.usa, ts) + puntuar((p.nombres ?? []).join(' '), ts) * 2 }))
        .filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s)
        .slice(0, 3)
      // Solo se avisa de una retirada si la consulta la nombra (ConfiguredModal, toast, Sheet…), no por un sinónimo.
      const consulta = normal(necesidad)
      const retirada = reglas.retiradas.find((r) =>
        [...r.pieza.matchAll(/[A-Za-z][A-Za-z0-9.]{3,}/g)].some((m) => /[A-Z.]/.test(m[0].slice(1)) && consulta.includes(normal(m[0]))),
      )
      const lineas = []
      if (retirada) lineas.push(`⚠ «${retirada.pieza}» está retirada desde ${retirada.fecha}: usa ${retirada.usa}.`, '')
      if (piezas.length) {
        lineas.push('Piezas del proyecto (úsalas antes que la librería):')
        for (const { p } of piezas) {
          const nombre = p.nombres?.[0]
          const ej = nombre ? ejemploReal(nombre) : null
          lineas.push(
            '',
            `■ ${p.necesidad}`,
            `  Usa: ${p.usa}`,
            `  Import: ${p.desde}`,
            `  No uses: ${p.en_vez_de}`,
            ...(ej ? [`  Ya la usa: ${ej}`] : []),
            ...(nombre ? reglasDePieza(nombre).map((r) => `  Regla «${r.id}» (${r.fecha}): ${r.corto ?? r.texto}`) : []),
          )
        }
      }
      const comps = (catalogo.componentes ?? [])
        .map((c) => ({ c, s: puntuar(`${c.nombre} ${c.usar_para} ${(c.buscar ?? []).join(' ')}`, ts) }))
        .filter((x) => x.s > 1)
        .sort((a, b) => b.s - a.s)
        .slice(0, 3)
      if (comps.length) {
        lineas.push('', piezas.length ? 'Si ninguna de esas sirve, en la librería:' : 'No hay pieza del proyecto; en @ubits/flux-ui:')
        for (const { c } of comps) lineas.push(`■ ${c.nombre}: ${c.usar_para}${c.variantes ? ` · variantes ${JSON.stringify(c.variantes)}` : ''}${c.storybook?.docs ? ` · ${c.storybook.docs}` : ''}`)
      }
      if (!piezas.length && !comps.length) lineas.push('No encontré nada para eso. No lo dibujes a mano: pregunta si se pide a la librería o se resuelve con una pieza existente.')
      return lineas.join('\n')
    },
  },
  pieza: {
    descripcion: 'La ficha de una pieza por su nombre exacto (DialogoConfirmar, TablaDatos, BotonSalirCreacion…): para qué es, import, qué no usar, reglas, cuántas pantallas la usan y ejemplos. Si está retirada, dice por cuál cambiarla.',
    parametros: { nombre: { type: 'string', description: 'Nombre exacto del componente o función' } },
    requeridos: ['nombre'],
    ejecutar({ nombre }) {
      const { reglas, catalogo } = datos()
      const retirada = reglas.retiradas.find((r) => r.pieza === nombre || (r.patron && new RegExp(r.patron).test(nombre)))
      const p = reglas.piezas.find((x) => (x.nombres ?? []).includes(nombre))
      const c = (catalogo.componentes ?? []).find((x) => x.nombre === nombre || (x.exports ?? []).includes(nombre))
      const usos = usosDe(nombre)
      const lineas = []
      if (retirada) lineas.push(`⚠ Retirada desde ${retirada.fecha}: usa ${retirada.usa}.`)
      if (p) lineas.push(`${nombre} — ${p.necesidad}`, `Usa: ${p.usa}`, `Import: ${p.desde}`, `No uses: ${p.en_vez_de}`)
      else if (c) lineas.push(`${nombre} — componente de @ubits/flux-ui: ${c.usar_para}`, `Variantes: ${JSON.stringify(c.variantes ?? {})}`, `Storybook: ${c.storybook?.docs ?? '—'}`)
      else if (!retirada) lineas.push(`No conozco «${nombre}» ni en las piezas del proyecto ni en la librería. Prueba buscar_pieza con lo que necesitas.`)
      for (const r of reglasDePieza(nombre)) lineas.push(`Regla «${r.id}» (${r.fecha}): ${r.texto}${r.ejemplo ? ` Modelo: ${r.ejemplo}` : ''}`)
      if (usos.length) lineas.push(`La importan ${usos.length} archivos. Ejemplos: ${usos.filter((u) => !congelado(u)).slice(0, 5).join(', ')}`)
      return lineas.join('\n')
    },
  },
  reglas_para: {
    descripcion: 'Antes de tocar un archivo: las reglas que le aplican (por su carpeta y por las piezas que usa), su dueño, si es zona protegida o de otra persona, y las piezas retiradas que ya tiene.',
    parametros: { ruta: { type: 'string', description: 'Ruta desde la raíz del repo, p. ej. src/modules/admin/tareas/crear-tarea/main.tsx' } },
    requeridos: ['ruta'],
    ejecutar({ ruta }) {
      const { reglas, indice } = datos()
      ruta = ruta.replace(/^\.?\//, '')
      const texto = leerArchivo(ruta) ?? ''
      const ids = new Set(['orden', 'medidas-del-tema', 'archivos-ajenos'])
      const entrada = indice.get(ruta)
      for (const id of entrada?.reglas ?? []) ids.add(id)
      if (/(crear|editar|nuevo|nueva|agregar|alta)/.test(ruta) || /PageActionBar/.test(texto)) ['crear-en-pagina', 'salir-con-cambios', 'guardado-honesto'].forEach((i) => ids.add(i))
      if (/TablaDatos|DataGridList|<Table\b/.test(texto)) ids.add('tabla-cabe')
      if (/DrawerShell|Sheet/.test(texto)) ids.add('panel-con-datos')
      if (/notify|toast/.test(texto)) ['avisos-con-tipo', 'preguntar-antes'].forEach((i) => ids.add(i))
      if (/Dialog|Modal/.test(texto)) ['dos-ventanas', 'preguntar-antes'].forEach((i) => ids.add(i))
      if (/IconoIA|BotonIa|Orb|ReopenAgentButton|Agent/.test(texto)) ids.add('ia-orbe')
      if (/!\s|[a-z0-9\]]!/.test(texto)) ids.add('forzados-con-ficha')
      const lineas = [`Reglas para ${ruta}:`]
      for (const r of reglas.reglas.filter((x) => ids.has(x.id))) lineas.push(`- «${r.id}» (${r.fecha}): ${r.texto}${r.ejemplo ? ` Modelo: ${r.ejemplo}` : ''}`)
      const d = entrada?.dueno ?? dueno(ruta)
      if (d) lineas.push('', `Dueño: ${d}.${d !== 'Cristian' ? ' Si no eres tú: cambia solo la línea exacta, sin Prettier, conserva sus «!» y dilo en la respuesta.' : ''}`)
      if (protegida(ruta)) lineas.push('⚠ Zona protegida: no se toca sin permiso.')
      if (congelado(ruta)) lineas.push('Carpeta congelada: es archivo histórico, no se copia de aquí ni se barre.')
      const ret = reglas.retiradas.filter((r) => r.patron && !exento(ruta, r) && lineasDe(texto, r.patron).length)
      if (ret.length) lineas.push('', 'Ya tiene piezas retiradas (cámbialas si tocas esa parte):', ...ret.map((r) => `- ${r.pieza} → ${r.usa}`))
      return lineas.join('\n')
    },
  },
  revisar: {
    descripcion: 'Después de escribir: revisa un archivo contra las reglas del equipo y devuelve, por línea, lo que rompe y con qué pieza se arregla (retiradas, confirmaciones que faltan, ventana equivocada, salida de creación, avisos sin tipo, letra chica, anchos a mano, colores literales, «!» sin explicar). No reemplaza a npm run check.',
    parametros: { ruta: { type: 'string', description: 'Ruta desde la raíz del repo' } },
    requeridos: ['ruta'],
    ejecutar({ ruta }) {
      const { reglas } = datos()
      ruta = ruta.replace(/^\.?\//, '')
      const texto = leerArchivo(ruta)
      if (texto == null) return `No encuentro ${ruta}.`
      if (congelado(ruta)) return `${ruta} está en una carpeta congelada: no se revisa.`
      const lineas = texto.split('\n')
      const hallazgos = []
      const marca = (i, regla, que, arreglo) => hallazgos.push(`L${i + 1} · ${regla}: ${que} → ${arreglo}`)
      for (const r of reglas.retiradas) {
        if (!r.patron || exento(ruta, r)) continue
        for (const n of lineasDe(texto, r.patron)) marca(n - 1, 'retirada', `usa ${r.pieza} (retirada el ${r.fecha})`, r.usa)
      }
      const esCreacion = /(crear|editar|nuevo|nueva|agregar|alta)/.test(ruta) || /PageActionBar/.test(texto)
      const tieneConfirmar = /DialogoConfirmar/.test(texto)
      lineas.forEach((l, i) => {
        if (/<ActionDialog\b/.test(l) || /ActionDialog/.test(l)) {
          const tramo = lineas.slice(i, i + 12).join(' ')
          if (/title=\{?["'`]¿(Eliminar|Borrar|Salir|Desactivar|Descartar|Enviar|Quitar|Archivar|Publicar)/.test(tramo)) marca(i, 'dos-ventanas', 'ActionDialog usado para preguntar', 'DialogoConfirmar con RegistroConfirmar')
        }
        if (/notify(Action)?\(\s*['"`][^'"`]*(enviad|recordatorio|eliminad|borrad|desactivad|descartad|movid)/i.test(l) && !tieneConfirmar) marca(i, 'preguntar-antes', 'avisa de una acción hecha sin haber preguntado (no hay DialogoConfirmar en el archivo)', 'preguntar antes con DialogoConfirmar, o notifyAction con «Deshacer» si es simple y se puede deshacer')
        if (/\bnotify\(/.test(l)) {
          const llamada = lineas.slice(i, i + 4).join(' ')
          const args = llamada.slice(llamada.indexOf('notify(')).split(')')[0]
          if (!/['"](success|info|warning|error)['"]/.test(args)) marca(i, 'avisos-con-tipo', 'notify sin tipo', "notify(título, detalle, 'success' | 'info' | 'warning' | 'error')")
        }
        if (esCreacion && />\s*Cancelar\s*</.test(l)) marca(i, 'crear-en-pagina', '«Cancelar» en una creación', 'BotonSalirCreacion en las acciones de PageHeader y nada de «Cancelar» en la barra')
        if (esCreacion && /ArrowLeft\d*Icon/.test(l) && /PageHeader|volver|onBack/i.test(lineas.slice(Math.max(0, i - 5), i + 5).join(' '))) marca(i, 'crear-en-pagina', 'flecha para volver junto al título de una creación', 'BotonSalirCreacion')
        for (const m of l.matchAll(/text-\[(\d+(?:\.\d+)?)px\]/g)) if (Number(m[1]) < 10.5) marca(i, 'medidas-del-tema', `letra de ${m[1]} px`, 'Text/Heading del tema; nunca menos de 10,5 px')
        if (/\bmax-w-(\[|\d|xs|sm|md|lg|xl|\dxl|screen)/.test(l) && !/Dialog|Popover|Hint|Tooltip|Dropdown/.test(l)) marca(i, 'medidas-del-tema', 'ancho máximo a mano', 'el ancho lo pone PageShell (narrow, default, wide, full)')
        if (/(#[0-9a-fA-F]{3,8}\b|rgba?\(|oklch\()/.test(l) && /className|style/.test(l)) marca(i, 'medidas-del-tema', 'color literal', 'un token del tema (bg-card, text-muted-foreground…)')
        if (/className=.*\b[\w:[\]-]+!(\s|["'`])/.test(l)) {
          const previo = lineas.slice(Math.max(0, i - 4), i).join(' ')
          if (!/\/\/|\/\*|\{\/\*/.test(previo + l)) marca(i, 'forzados-con-ficha', 'una clase con «!» sin comentario', 'explica por qué en un comentario y apúntalo en Ajustes propios o diferencias.json')
        }
        if (/<DrawerShell\b/.test(l)) {
          const tramo = lineas.slice(i, i + 15).join(' ')
          if (/onOpenChange=\{?\s*set\w+\s*\}?/.test(tramo) && /(Input|Textarea|Field|Select)/.test(texto)) marca(i, 'panel-con-datos', 'el panel se cierra directo aunque tenga campos', 'si hay cambios, preguntar antes de cerrar y no cerrar al tocar fuera')
        }
      })
      const d = dueno(ruta)
      const cabecera = [`${ruta}${d ? ` (dueño: ${d})` : ''}${protegida(ruta) ? ' · zona protegida' : ''}`]
      if (!hallazgos.length) return [...cabecera, 'Sin problemas de las reglas que reviso. Igual corre npm run check y mira la pantalla a 1440×900.'].join('\n')
      return [...cabecera, `${hallazgos.length} cosas por revisar:`, ...hallazgos.slice(0, 60)].join('\n')
    },
  },
  usos: {
    descripcion: 'Qué archivos importan una pieza (para barrer todos sus usos cuando cambia una regla).',
    parametros: { nombre: { type: 'string', description: 'Nombre exacto del componente o función' } },
    requeridos: ['nombre'],
    ejecutar({ nombre }) {
      const us = usosDe(nombre, 2000)
      if (!us.length) return `Nadie importa ${nombre}.`
      const vivos = us.filter((u) => !congelado(u))
      return [`${nombre}: ${vivos.length} archivos (sin contar carpetas congeladas)`, ...vivos.map((u) => `- ${u}${dueno(u) ? ` · ${dueno(u)}` : ''}`)].join('\n')
    },
  },
  retiradas_en_uso: {
    descripcion: 'Las piezas retiradas que todavía aparecen en src/, con archivo y línea. Útil antes de unir una rama y para barrer.',
    parametros: {},
    requeridos: [],
    ejecutar() {
      const { reglas } = datos()
      const salida = []
      for (const r of reglas.retiradas.filter((x) => x.patron)) {
        const re = new RegExp(r.patron)
        const donde = []
        for (const ruta of archivosSrc()) {
          if (exento(ruta, r)) continue
          const t = leerArchivo(ruta)
          if (!t || !re.test(t)) continue
          const n = lineasDe(t, r.patron)
          if (!n.length) continue
          donde.push(`${ruta}:${n.join(',')}${dueno(ruta) ? ` · ${dueno(ruta)}` : ''}`)
        }
        if (donde.length) salida.push(`■ ${r.pieza} (retirada el ${r.fecha}, usa ${r.usa}): ${donde.length}`, ...donde.slice(0, 15).map((d) => `  - ${d}`), ...(donde.length > 15 ? [`  … y ${donde.length - 15} más`] : []))
      }
      return salida.length ? salida.join('\n') : 'Ninguna pieza retirada sigue en uso fuera de las carpetas congeladas.'
    },
  },
  por_decidir: {
    descripcion: 'Las preguntas de diseño que siguen abiertas. Si tu pantalla depende de una, pregunta en vez de elegir.',
    parametros: {},
    requeridos: [],
    ejecutar() {
      return datos().reglas.por_decidir.map((q) => `- ${q.id}: ${q.pregunta} (decide: ${q.decide})`).join('\n')
    },
  },
}

const INSTRUCCIONES =
  'Design system del Playground UX (UBITS). Antes de escribir interfaz: buscar_pieza por cada cosa que vas a poner en pantalla y reglas_para con el archivo que vas a tocar. Al terminar: revisar sobre ese archivo. Las respuestas salen de las decisiones vigentes del equipo (ai-tools/reglas/reglas.json), no de la memoria: si contradicen lo que recuerdas, manda la herramienta.'

function llamar(nombre, args = {}) {
  const h = HERRAMIENTAS[nombre]
  if (!h) throw new Error(`No existe la herramienta «${nombre}». Hay: ${Object.keys(HERRAMIENTAS).join(', ')}`)
  for (const r of h.requeridos) if (args[r] == null || args[r] === '') throw new Error(`Falta «${r}».`)
  return h.ejecutar(args)
}

// ── Terminal ────────────────────────────────────────────────────────────────────────────────────
const [, , comando, ...resto] = process.argv
if (comando) {
  const h = HERRAMIENTAS[comando]
  const clave = h?.requeridos[0]
  try {
    console.log(llamar(comando, clave ? { [clave]: resto.join(' ') } : {}))
  } catch (e) {
    console.error(e.message)
    process.exit(1)
  }
} else {
  // ── MCP por stdio: JSON-RPC 2.0, un mensaje por línea ──────────────────────────────────────────
  const responder = (id, result) => process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n')
  const fallar = (id, code, message) => process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }) + '\n')
  const rl = createInterface({ input: process.stdin })
  rl.on('line', (linea) => {
    if (!linea.trim()) return
    let msg
    try {
      msg = JSON.parse(linea)
    } catch {
      return fallar(null, -32700, 'JSON inválido')
    }
    const { id, method, params } = msg
    if (id === undefined) return // notificaciones (notifications/initialized, cancelled…)
    if (method === 'initialize') {
      return responder(id, {
        protocolVersion: params?.protocolVersion ?? '2025-06-18',
        capabilities: { tools: {} },
        serverInfo: { name: 'ds-ubits', version: '1.0.0' },
        instructions: INSTRUCCIONES,
      })
    }
    if (method === 'ping') return responder(id, {})
    if (method === 'tools/list') {
      return responder(id, {
        tools: Object.entries(HERRAMIENTAS).map(([name, h]) => ({
          name,
          description: h.descripcion,
          inputSchema: { type: 'object', properties: h.parametros, required: h.requeridos },
        })),
      })
    }
    if (method === 'tools/call') {
      try {
        const texto = llamar(params?.name, params?.arguments ?? {})
        return responder(id, { content: [{ type: 'text', text: texto }] })
      } catch (e) {
        return responder(id, { content: [{ type: 'text', text: e.message }], isError: true })
      }
    }
    return fallar(id, -32601, `Método no soportado: ${method}`)
  })
}
