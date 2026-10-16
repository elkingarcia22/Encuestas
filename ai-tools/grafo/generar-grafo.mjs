#!/usr/bin/env node
// Genera el grafo del playground (ai-tools/grafo/grafo.json y GRAFO.md) para que una IA entienda rápido qué hay:
// los componentes de flux, las piezas del equipo, sus fichas, las pantallas del playground y qué usa cada una, las
// trampas y diferencias con la librería, y el producto real (el grafo de docs/plataforma-ubits), enlazado por los
// códigos de historia de usuario (HU-XXX-000) que citan las pantallas.
//
// Además cubre todo el proyecto: cada archivo de src/ con sus imports y su dueño (git), las rutas, las reglas y retiradas de
// ai-tools/reglas/reglas.json, las skills, los hooks, los scripts y los documentos (con sus citas rotas), y escribe
// indice-archivos.json, la consulta por archivo.
//
// Todo sale de lo que ya existe; no se escribe nada a mano aquí:
//   ai-tools/flux-ui/flux-ui-para-ia.json     componentes, piezas del equipo y trampas
//   ai-tools/flux-ui/diferencias.json         lo que se le pide a la librería
//   src/modules/design-system/ajustes/*.tsx   las fichas (qué se customizó y por qué)
//   src/modules/design-system/componentes/inventario-datos.ts   nombre, grupo y ficha de cada pieza
//   src/modules/**/main.tsx                   las pantallas, y sus imports para saber qué usan
//   src/shared/layouts/nav-config.ts          el nombre de cada pantalla en el menú
//   docs/plataforma-ubits/graphify-out/graph.json   el producto real
//
// Uso:
//   node ai-tools/grafo/generar-grafo.mjs              # regenera siempre
//   node ai-tools/grafo/generar-grafo.mjs --si-cambio  # solo si cambió algo de lo de arriba (hook SessionStart)

import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join, posix, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))
const RAIZ = resolve(AQUI, '../..')
const SALIDA = join(AQUI, 'grafo.json')
const RESUMEN = join(AQUI, 'GRAFO.md')
const MODULOS = join(RAIZ, 'src/modules')
const SHARED = join(RAIZ, 'src/shared')
const rel = (p) => relative(RAIZ, p).split(sep).join('/')
const leer = (p) => readFileSync(p, 'utf8')

// ── Archivos ──────────────────────────────────────────────────────────────────────────────────
// Recorre una carpeta y devuelve los archivos que cumplen `patron` (por defecto el código: ts, tsx, mjs).
// Usa los tipos que da readdirSync: en WSL 1 un statSync por archivo es lo que más tarda.
function recorrer(dir, salida = [], patron = /\.(tsx?|mjs)$/, saltar = null) {
  if (!existsSync(dir)) return salida
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue
    const ruta = join(dir, e.name)
    if (e.isDirectory()) {
      if (!saltar || !saltar.test(rel(ruta))) recorrer(ruta, salida, patron, saltar)
    } else if (patron.test(e.name)) salida.push(ruta)
  }
  return salida
}

const FUENTES_FIJAS = [
  'ai-tools/flux-ui/flux-ui-para-ia.json',
  'ai-tools/flux-ui/diferencias.json',
  'src/shared/layouts/nav-config.ts',
  'docs/plataforma-ubits/graphify-out/graph.json',
].map((p) => join(RAIZ, p))
const ARCHIVOS_SRC = [...recorrer(MODULOS), ...recorrer(SHARED)]

// Fuentes del grafo de todo el proyecto: todo el código de src/, las reglas, las skills, los hooks, los scripts y los documentos.
const TODO_SRC = recorrer(join(RAIZ, 'src'))
const REGLAS_JSON = join(RAIZ, 'ai-tools/reglas/reglas.json')
const SKILLS = existsSync(join(RAIZ, 'ai-tools/skills'))
  ? readdirSync(join(RAIZ, 'ai-tools/skills')).map((n) => join(RAIZ, 'ai-tools/skills', n, 'SKILL.md')).filter(existsSync)
  : []
const HOOKS = recorrer(join(RAIZ, 'ai-tools/hooks'), [], /\.mjs$/)
const SCRIPTS = existsSync(join(RAIZ, 'scripts')) ? readdirSync(join(RAIZ, 'scripts')).filter((n) => n.endsWith('.mjs')).map((n) => join(RAIZ, 'scripts', n)) : []
const DOCS_RAIZ = ['AGENTS.md', 'CLAUDE.md'].map((n) => join(RAIZ, n)).filter(existsSync)
const DOCS = recorrer(join(RAIZ, 'docs'), [], /\.md$/, /^docs\/plataforma-ubits\/graphify-out$/)
// Los commits también cambian los dueños: el registro de HEAD se mueve con cada commit o cambio de rama.
const REGISTRO_GIT = join(RAIZ, '.git/logs/HEAD')

// Huella de todo lo que entra: si no cambió, --si-cambio no hace nada.
const huella = createHash('sha1')
for (const archivo of [...FUENTES_FIJAS, ...ARCHIVOS_SRC, ...TODO_SRC, REGLAS_JSON, ...SKILLS, ...HOOKS, ...SCRIPTS, ...DOCS_RAIZ, ...DOCS, REGISTRO_GIT]) {
  if (!existsSync(archivo)) continue
  huella.update(rel(archivo))
  huella.update(String(statSync(archivo).mtimeMs))
}
const HUELLA = huella.digest('hex')
if (process.argv.includes('--si-cambio') && existsSync(SALIDA)) {
  try {
    if (JSON.parse(leer(SALIDA)).huella === HUELLA) process.exit(0)
  } catch {}
}

const catalogo = JSON.parse(leer(join(RAIZ, 'ai-tools/flux-ui/flux-ui-para-ia.json')))
const diferencias = JSON.parse(leer(join(RAIZ, 'ai-tools/flux-ui/diferencias.json')))

// ── Nodos y aristas ───────────────────────────────────────────────────────────────────────────
const nodos = new Map()
const aristas = []
const claveArista = new Set()
function nodo(id, datos) {
  if (!nodos.has(id)) nodos.set(id, { id, ...datos })
  return nodos.get(id)
}
function arista(de, a, relacion, extra) {
  if (!nodos.has(de) || !nodos.has(a) || de === a) return
  const clave = `${de}|${a}|${relacion}`
  if (claveArista.has(clave)) return
  claveArista.add(clave)
  aristas.push(extra ? { de, a, relacion, ...extra } : { de, a, relacion })
}

// 1. Componentes de flux. Cada export (FrameHeader, FrameTitle…) apunta a su componente (Frame).
const exportAComponente = new Map()
for (const c of catalogo.componentes) {
  nodo(`flux:${c.nombre}`, { tipo: 'componente-flux', nombre: c.nombre, descripcion: c.usar_para, storybook: c.storybook?.docs })
  for (const e of c.exports ?? [c.nombre]) exportAComponente.set(e, c.nombre)
}

// 2. Piezas del equipo (el catálogo) con su nombre, grupo y ficha (inventario-datos.ts).
const inventario = leer(join(MODULOS, 'design-system/componentes/inventario-datos.ts'))
const detalle = new Map()
for (const m of inventario.matchAll(/^ {2}'?([\w-]+)'?: \{ nombre: '([^']+)', hechaCon: \[([^\]]*)\], grupo: '([\w-]+)', verEn: '([^']+)'(?:, ficha: '([\w-]+)')? \}/gm)) {
  detalle.set(m[1], { nombre: m[2], grupo: m[4], verEn: m[5], ficha: m[6] })
}
const nombreAPieza = new Map()
const archivoDePieza = new Map()
for (const p of catalogo.piezas_del_proyecto.ya_resueltas) {
  const clave = p.usa.split(/[\s,(:]/)[0]
  const d = detalle.get(clave)
  const desde = (p.desde.match(/@\/[\w/.-]+/) ?? [p.desde])[0]
  nodo(`pieza:${clave}`, {
    tipo: 'pieza',
    nombre: d?.nombre ?? clave,
    codigo: clave,
    descripcion: p.necesidad,
    usa: p.usa,
    en_vez_de: p.en_vez_de,
    archivo: desde,
    grupo: d?.grupo,
    ruta: d?.verEn,
  })
  for (const nombre of p.usa.match(/\b[A-Za-z][\w]*\b/g) ?? []) {
    if (/^[A-Z]/.test(nombre) || /^(notify|notifyAction|use[A-Z]\w*)$/.test(nombre)) if (!nombreAPieza.has(nombre)) nombreAPieza.set(nombre, clave)
  }
  if (desde.startsWith('@/')) archivoDePieza.set(clave, desde.replace('@/', 'src/'))
}

// 3. Fichas: cada ajuste documentado (ajustes/*.tsx). Se leen id, título, estado, resumen y de qué está hecho.
const fichas = []
for (const archivo of readdirSync(join(MODULOS, 'design-system/ajustes')).filter((n) => n.endsWith('.tsx'))) {
  const texto = leer(join(MODULOS, 'design-system/ajustes', archivo))
  const re = /\n {4}id: '([\w-]+)',\s*\n {4}titulo: '((?:[^'\\]|\\.)+)',\s*\n {4}estado: '(\w+)',\s*\n {4}resumen:\s*'((?:[^'\\]|\\.)+)',\s*\n {4}piezas: \[([\s\S]*?)\],/g
  for (const m of texto.matchAll(re)) {
    const hechaCon = [...m[5].matchAll(/nombre: '([^']+)'/g)].map((x) => x[1])
    fichas.push({ id: m[1], titulo: m[2].replace(/\\'/g, "'"), estado: m[3], resumen: m[4].replace(/\\'/g, "'"), hechaCon })
  }
}
const REGLAS_GLOBALES = new Set((leer(join(MODULOS, 'design-system/ajustes/main.tsx')).match(/REGLAS_GLOBALES = \[([^\]]*)\]/)?.[1] ?? '').match(/[\w-]+/g) ?? [])
const ESTADO_FICHA = { variante: 'Variante UBITS', pedido: 'Pedido a la librería', decidir: 'Por decidir' }
for (const f of fichas) {
  const regla = REGLAS_GLOBALES.has(f.id)
  nodo(`ficha:${f.id}`, {
    tipo: regla ? 'regla-global' : 'ficha',
    nombre: f.titulo,
    descripcion: f.resumen,
    estado: ESTADO_FICHA[f.estado] ?? f.estado,
    ruta: regla ? `/design-system/componentes/reglas#${f.id}` : `/design-system/componentes/ficha/${f.id}`,
  })
  for (const flux of f.hechaCon) arista(`ficha:${f.id}`, `flux:${flux}`, 'hecha con')
}
for (const [clave, d] of detalle) if (d.ficha) arista(`pieza:${clave}`, `ficha:${d.ficha}`, 'tiene ficha')

// 4. Imports de un archivo: qué componentes de flux y qué piezas del equipo usa.
function usosDe(texto) {
  const flux = new Set()
  const piezas = new Set()
  for (const m of texto.matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+['"]([^'"]+)['"]/g)) {
    const nombres = m[1].split(',').map((n) => n.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0]).filter(Boolean)
    for (const n of nombres) {
      if (m[2] === '@ubits/flux-ui') {
        const c = exportAComponente.get(n)
        if (c) flux.add(c)
      } else if (nombreAPieza.has(n)) piezas.add(nombreAPieza.get(n))
    }
  }
  return { flux, piezas }
}

// Las piezas también usan flux por dentro: «hecha con», leído de su propio archivo.
for (const [clave, archivo] of archivoDePieza) {
  const candidato = [`${archivo}.tsx`, `${archivo}.ts`, join(archivo, 'index.tsx')].map((p) => join(RAIZ, p)).find(existsSync)
  if (!candidato) continue
  const { flux, piezas } = usosDe(leer(candidato))
  for (const c of flux) arista(`pieza:${clave}`, `flux:${c}`, 'hecha con')
  for (const p of piezas) if (p !== clave) arista(`pieza:${clave}`, `pieza:${p}`, 'usa')
}

// 5. Pantallas: cada carpeta con main.tsx. Su ruta sale de la carpeta; su nombre, del menú si está en él.
const nav = leer(join(SHARED, 'layouts/nav-config.ts'))
const nombreEnMenu = new Map()
for (const m of nav.matchAll(/title: '([^']+)',\s*path: '([^']+)'/g)) if (!nombreEnMenu.has(m[2])) nombreEnMenu.set(m[2], m[1])
for (const m of nav.matchAll(/\['(\/[^']+)', '([^']+)'\]/g)) if (!nombreEnMenu.has(m[1])) nombreEnMenu.set(m[1], m[2])

const carpetasPantalla = ARCHIVOS_SRC.filter((a) => a.endsWith(`${sep}main.tsx`) && a.startsWith(MODULOS)).map((a) => dirname(a))
const esPantalla = new Set(carpetasPantalla)
const MODULO_RUTA = { admin: '/admin', 'portal-colaborador': '/portal-colaborador', 'design-system': '/design-system', auth: '' }
const humano = (s) => s.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase())

for (const carpeta of carpetasPantalla) {
  const partes = rel(carpeta).split('/').slice(2) // tras src/modules
  const modulo = partes[0]
  const resto = partes.slice(1).filter((p) => p !== 'pages')
  const ruta = `${MODULO_RUTA[modulo] ?? `/${modulo}`}${resto.length ? `/${resto.join('/')}` : ''}`
  const tipo = ruta.startsWith('/design-system/templates/') ? 'plantilla' : modulo === 'design-system' ? 'pagina-ds' : 'pantalla'
  const id = `pantalla:${ruta}`
  nodo(id, { tipo, nombre: nombreEnMenu.get(ruta) ?? humano(resto.at(-1) ?? modulo), ruta, modulo, archivo: rel(join(carpeta, 'main.tsx')) })

  // Los archivos de la pantalla: los de su carpeta y subcarpetas que no son otra pantalla.
  const propios = []
  const juntar = (dir) => {
    for (const n of readdirSync(dir)) {
      const r = join(dir, n)
      if (statSync(r).isDirectory()) {
        if (!esPantalla.has(r)) juntar(r)
      } else if (/\.tsx?$/.test(n)) propios.push(r)
    }
  }
  juntar(carpeta)
  const hus = new Set()
  for (const archivo of propios) {
    const texto = leer(archivo)
    const { flux, piezas } = usosDe(texto)
    for (const c of flux) arista(id, `flux:${c}`, 'usa')
    for (const p of piezas) arista(id, `pieza:${p}`, 'usa')
    for (const hu of texto.match(/HU-[A-Z]+-\d+/g) ?? []) hus.add(hu)
  }
  nodos.get(id).hus = [...hus].sort()
}
// Jerarquía: cada pantalla cuelga de la más cercana por encima.
for (const n of nodos.values()) {
  if (!n.id.startsWith('pantalla:')) continue
  const tramos = n.ruta.split('/')
  for (let i = tramos.length - 1; i > 1; i--) {
    const padre = `pantalla:${tramos.slice(0, i).join('/')}`
    if (nodos.has(padre)) {
      arista(n.id, padre, 'parte de')
      break
    }
  }
}

// 6. Trampas conocidas y diferencias con la librería, colgadas del componente de flux que nombran.
catalogo.trampas_conocidas.forEach((texto, i) => {
  const id = `trampa:${i + 1}`
  const nombrados = [...new Set((texto.match(/\b[A-Z][A-Za-z]+\b/g) ?? []).map((n) => exportAComponente.get(n)).filter(Boolean))]
  nodo(id, { tipo: 'trampa', nombre: texto.split(/[.:]/)[0].slice(0, 90), descripcion: texto })
  for (const c of nombrados) arista(id, `flux:${c}`, 'sobre')
})
for (const d of diferencias.entradas) {
  const id = `diferencia:${d.id}`
  // Hay entradas sin «pedido» (las propuestas de variante cuentan lo que esperamos): se usa lo que haya.
  const limpio = (texto) => String(texto ?? '').replace(/`/g, '')
  nodo(id, { tipo: 'diferencia', nombre: limpio(d.titulo), descripcion: limpio(d.pedido ?? d.esperado ?? d.hoy), estado: d.estado, prioridad: d.prioridad, ruta: '/design-system/componentes/dev' })
  const c = exportAComponente.get(d.pieza) ?? (nodos.has(`flux:${d.pieza}`) ? d.pieza : null)
  if (c) arista(id, `flux:${c}`, 'sobre')
  if (d.ajuste) arista(id, `ficha:${d.ajuste}`, 'se ve en')
}

// 7. El producto real (docs/plataforma-ubits). Se suma tal cual y se enlaza a las pantallas por HU.
const producto = JSON.parse(leer(join(RAIZ, 'docs/plataforma-ubits/graphify-out/graph.json')))
const huANodo = new Map()
for (const p of producto.nodes) {
  const id = `producto:${p.id}`
  nodo(id, {
    tipo: p.file_type === 'document' ? 'producto-documento' : 'producto',
    nombre: p.label,
    descripcion: p.rationale ?? p.cifra,
    archivo: `docs/plataforma-ubits/${p.source_file}`,
  })
  const hu = p.label.match(/^(HU-[A-Z]+-\d+)/)?.[1]
  if (hu) {
    nodos.get(id).tipo = 'historia'
    huANodo.set(hu, id)
  }
}
for (const e of producto.links) arista(`producto:${e.source}`, `producto:${e.target}`, e.relation)
for (const n of [...nodos.values()]) for (const hu of n.hus ?? []) if (huANodo.has(hu)) arista(n.id, huANodo.get(hu), 'implementa')

// 8. Todo el proyecto: cada archivo de código, sus imports, las rutas, los dueños, las reglas, las herramientas y los documentos.
//    Es una capa que se suma sobre lo anterior: no cambia ningún nodo ni arista que ya existía.
const base = (r) => r.split('/').pop()
const moduloDe = (r) => {
  const p = r.split('/')
  if (p.length < 3) return 'raiz'
  return p[1] === 'modules' ? p[2] : p[1]
}
const linea = (texto, indice) => {
  let n = 1
  for (let i = texto.indexOf('\n'); i !== -1 && i < indice; i = texto.indexOf('\n', i + 1)) n++
  return n
}

// 8.1 Los archivos y sus imports (el alias @/ vale src/; los relativos, con o sin extensión o con index).
const textos = new Map()
for (const abs of TODO_SRC) textos.set(rel(abs), leer(abs))
const ARCHIVOS = [...textos.keys()].sort()
const existe = new Set(ARCHIVOS)
const SUFIJOS = ['', '.ts', '.tsx', '.mjs', '.js', '/index.ts', '/index.tsx']
function resolverImport(spec, desde) {
  let ruta
  if (spec.startsWith('@/')) ruta = `src/${spec.slice(2)}`
  else if (spec.startsWith('.')) ruta = posix.normalize(posix.join(posix.dirname(desde), spec))
  else return null
  ruta = ruta.replace(/[?#].*$/, '')
  for (const s of SUFIJOS) if (existe.has(ruta + s)) return ruta + s
  return null
}

const RE_IMPORT = /\b(?:import|export)\s+(?:type\s+)?([\w*$\s{},]*?)\s*from\s*['"]([^'"\n]+)['"]/g
const RE_IMPORT_SOLO = /\bimport\s*['"]([^'"\n]+)['"]/g
const RE_IMPORT_DINAMICO = /\bimport\(\s*['"]([^'"\n]+)['"]\s*\)/g
const RE_EXPORT_DEF = /\bexport\s+(?:declare\s+)?(?:default\s+)?(?:async\s+)?(?:function\*?|const|let|var|class|abstract\s+class|type|interface|enum)\s+([A-Za-z_$][\w$]*)/g
const RE_EXPORT_LISTA = /\bexport\s*(?:type\s*)?\{([^}]*)\}\s*(from\s*['"][^'"]+['"])?/g
const nombresDeLlaves = (clausula, alias = false) => {
  const llaves = clausula.match(/\{([^}]*)\}/)?.[1]
  if (!llaves) return []
  return llaves
    .split(',')
    .map((n) => n.trim().replace(/^type\s+/, ''))
    .filter(Boolean)
    .map((n) => {
      const [antes, despues] = n.split(/\s+as\s+/)
      return alias ? (despues ?? antes) : antes
    })
}

const info = new Map() // ruta -> { importa: Map(ruta->{lazy}), nombresImportados: Set, defs: Set, reexporta: Set }
for (const [ruta, texto] of textos) {
  const importa = new Set()
  const importados = new Set()
  for (const m of texto.matchAll(RE_IMPORT)) {
    const destino = resolverImport(m[2], ruta)
    if (destino) {
      importa.add(destino)
      for (const n of nombresDeLlaves(m[1])) importados.add(n)
    }
  }
  for (const re of [RE_IMPORT_SOLO, RE_IMPORT_DINAMICO]) {
    for (const m of texto.matchAll(re)) {
      const destino = resolverImport(m[1], ruta)
      if (destino) importa.add(destino)
    }
  }
  importa.delete(ruta)
  const defs = new Set()
  const reexporta = new Set()
  for (const m of texto.matchAll(RE_EXPORT_DEF)) defs.add(m[1])
  for (const m of texto.matchAll(RE_EXPORT_LISTA)) {
    for (const n of nombresDeLlaves(`{${m[1]}}`, true)) (m[2] ? reexporta : defs).add(n)
  }
  info.set(ruta, { importa, importados, defs, reexporta })
}
const importadoPor = new Map(ARCHIVOS.map((r) => [r, new Set()]))
for (const [ruta, i] of info) for (const d of i.importa) importadoPor.get(d).add(ruta)
const definidoEn = new Map() // nombre exportado -> archivos que lo definen
for (const [ruta, i] of info) for (const n of i.defs) definidoEn.set(n, [...(definidoEn.get(n) ?? []), ruta])

// 8.2 Las piezas, con todos los nombres que las nombran: las del catálogo más las de ai-tools/reglas/reglas.json.
let reglasJson = { reglas: [], piezas: [], retiradas: [], carpetas_congeladas: [] }
try {
  if (existsSync(REGLAS_JSON)) reglasJson = { ...reglasJson, ...JSON.parse(leer(REGLAS_JSON)) }
} catch (e) {
  console.warn(`No se pudo leer reglas.json (${e.message}); el grafo sigue sin reglas.`)
}
const claveDe = (usa) => String(usa ?? '').split(/[\s,(:]/)[0]
const piezasConocidas = new Map() // clave -> { nombres:Set, desde:[rutas] }
const sumarPieza = (clave, nombres, desdeTexto) => {
  if (!clave) return
  const p = piezasConocidas.get(clave) ?? { nombres: new Set([clave]), desde: new Set() }
  for (const n of nombres) p.nombres.add(n)
  for (const d of String(desdeTexto ?? '').match(/@\/[\w/-]+/g) ?? []) p.desde.add(d)
  piezasConocidas.set(clave, p)
}
for (const p of catalogo.piezas_del_proyecto.ya_resueltas) sumarPieza(claveDe(p.usa), [], p.desde)
for (const p of reglasJson.piezas ?? []) sumarPieza(claveDe(p.usa), p.nombres ?? [], p.desde)
const nombreAClave = new Map()
for (const clave of piezasConocidas.keys()) nombreAClave.set(clave, clave)
for (const [n, c] of nombreAPieza) if (!nombreAClave.has(n)) nombreAClave.set(n, c)
for (const [clave, p] of piezasConocidas) for (const n of p.nombres) if (!nombreAClave.has(n)) nombreAClave.set(n, clave)

// Qué archivo exporta cada nombre de pieza: primero el que dice «desde», si no el único que lo define.
const exportadoresDe = new Map() // nombre -> [archivos]
for (const [clave, p] of piezasConocidas) {
  const desdeArchivos = [...p.desde].map((d) => resolverImport(d, 'src/x.ts')).filter(Boolean)
  for (const nombre of p.nombres) {
    if (nombreAClave.get(nombre) !== clave) continue
    const exportan = (r) => info.get(r).defs.has(nombre) || info.get(r).reexporta.has(nombre)
    let archivos = desdeArchivos.filter(exportan)
    if (!archivos.length) {
      const unicos = definidoEn.get(nombre) ?? []
      if (unicos.length === 1) archivos = unicos
    }
    if (archivos.length) exportadoresDe.set(nombre, archivos)
  }
}
const exportaPiezas = new Map() // archivo -> [{ nombre, clave }]
for (const [nombre, archivos] of exportadoresDe)
  for (const a of archivos) exportaPiezas.set(a, [...(exportaPiezas.get(a) ?? []), { nombre, clave: nombreAClave.get(nombre) }])

// Qué piezas usa cada archivo (por los nombres que importa), sin contar las que define él mismo.
const piezasDe = new Map()
for (const [ruta, i] of info) {
  const usadas = new Set()
  for (const n of i.importados) {
    const clave = nombreAClave.get(n)
    if (clave && !i.defs.has(n)) usadas.add(clave)
  }
  piezasDe.set(ruta, [...usadas].sort())
}

// 8.3 Dueños: un solo git log para todo el repositorio.
const PERSONAS = {
  tiangrupify: 'Cristian',
  'cristian munoz': 'Cristian',
  davidvegam91: 'David',
  'david vega': 'David',
  'nicolas garcia': 'Nicolás',
  'elkin garcia': 'Elkin',
  'carlos light': 'Carlos',
  'herramientas ubits': 'cuenta compartida',
  'christian burbano': 'Christian Burbano',
}
const sinTildes = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const autoresDe = new Map() // ruta -> Map(persona -> { n, ultimo })
let hayGit = false
try {
  const salida = execFileSync(
    'git',
    ['-c', 'core.quotepath=off', 'log', '--no-merges', '--format=@@%an', '--name-only', '--', 'src', 'ai-tools', 'scripts', 'docs', 'AGENTS.md', 'CLAUDE.md'],
    { cwd: RAIZ, encoding: 'utf8', maxBuffer: 512 * 1024 * 1024, timeout: 12000, stdio: ['ignore', 'pipe', 'ignore'] },
  )
  let persona = null
  let orden = 0
  for (const l of salida.split('\n')) {
    if (!l) continue
    if (l.startsWith('@@')) {
      const nombre = l.slice(2).trim()
      persona = PERSONAS[sinTildes(nombre)] ?? nombre
      orden++
      continue
    }
    if (!persona) continue
    const m = autoresDe.get(l) ?? new Map()
    const a = m.get(persona) ?? { n: 0, ultimo: orden }
    a.n++
    m.set(persona, a)
    autoresDe.set(l, m)
  }
  hayGit = autoresDe.size > 0
} catch {
  // Sin git (o muy lento): el grafo sigue, solo que sin dueños.
}
function duenoDe(ruta) {
  const m = autoresDe.get(ruta)
  if (!m) return null
  const orden = [...m].sort((a, b) => b[1].n - a[1].n || a[1].ultimo - b[1].ultimo)
  return { dueno: orden[0][0], autores: Object.fromEntries(orden.map(([p, a]) => [p, a.n])) }
}
const poner = (n, ruta) => {
  const d = duenoDe(ruta)
  if (d) {
    n.dueno = d.dueno
    n.autores = d.autores
  }
}

// 8.4 Las rutas: se leen de los routes.ts de cada módulo y de src/app/router.ts (un lector pequeño de objetos literales).
function tokenizar(texto) {
  const tk = []
  const n = texto.length
  let i = 0
  while (i < n) {
    const c = texto[i]
    if (/\s/.test(c)) {
      i++
      continue
    }
    if (c === '/' && texto[i + 1] === '/') {
      while (i < n && texto[i] !== '\n') i++
      continue
    }
    if (c === '/' && texto[i + 1] === '*') {
      const f = texto.indexOf('*/', i + 2)
      i = f < 0 ? n : f + 2
      continue
    }
    if (c === "'" || c === '"' || c === '`') {
      let j = i + 1
      let v = ''
      while (j < n && texto[j] !== c) {
        if (texto[j] === '\\') {
          v += texto[j + 1]
          j += 2
        } else v += texto[j++]
      }
      tk.push({ t: 's', v })
      i = j + 1
      continue
    }
    if (/[A-Za-z_$]/.test(c)) {
      let j = i + 1
      while (j < n && /[\w$]/.test(texto[j])) j++
      tk.push({ t: 'i', v: texto.slice(i, j) })
      i = j
      continue
    }
    if (texto.startsWith('...', i)) {
      tk.push({ t: 'p', v: '...' })
      i += 3
      continue
    }
    if (c === '=' && texto[i + 1] === '>') {
      tk.push({ t: 'p', v: '=>' })
      i += 2
      continue
    }
    if ('{}[]():,=;'.includes(c)) tk.push({ t: 'p', v: c })
    i++
  }
  return tk
}
const esP = (t, v) => t && t.t === 'p' && t.v === v
function parseValor(tk, i) {
  const t = tk[i]
  if (!t) return [{ k: 'expr', tokens: [] }, i]
  if (esP(t, '{')) return parseObjeto(tk, i)
  if (esP(t, '[')) return parseArray(tk, i)
  if (t.t === 's' && (!tk[i + 1] || [',', '}', ']'].some((v) => esP(tk[i + 1], v)))) return [{ k: 's', v: t.v }, i + 1]
  const ini = i
  let prof = 0
  while (i < tk.length) {
    const x = tk[i]
    if (x.t === 'p') {
      if (['(', '[', '{'].includes(x.v)) prof++
      else if ([')', ']', '}'].includes(x.v)) {
        if (prof === 0) break
        prof--
      } else if (x.v === ',' && prof === 0) break
    }
    i++
  }
  return [{ k: 'expr', tokens: tk.slice(ini, i) }, i]
}
function parseObjeto(tk, i) {
  const obj = { k: 'o', props: new Map(), spreads: [] }
  i++
  while (i < tk.length && !esP(tk[i], '}')) {
    const t = tk[i]
    if (esP(t, ',')) i++
    else if (esP(t, '...')) {
      const [v, j] = parseValor(tk, i + 1)
      obj.spreads.push(v)
      i = Math.max(j, i + 1)
    } else if (t.t === 'i' || t.t === 's') {
      if (esP(tk[i + 1], ':')) {
        const [v, j] = parseValor(tk, i + 2)
        obj.props.set(t.v, v)
        i = Math.max(j, i + 2)
      } else {
        obj.props.set(t.v, { k: 'expr', tokens: [t] })
        i++
      }
    } else i++
  }
  return [obj, i + 1]
}
function parseArray(tk, i) {
  const arr = { k: 'a', items: [] }
  i++
  while (i < tk.length && !esP(tk[i], ']')) {
    if (esP(tk[i], ',')) {
      i++
      continue
    }
    const espar = esP(tk[i], '...')
    const [v, j] = parseValor(tk, espar ? i + 1 : i)
    arr.items.push(espar ? { k: 'spread', v } : v)
    i = Math.max(j, i + 1)
  }
  return [arr, i + 1]
}
const cacheExportes = new Map()
function exportesDe(archivo) {
  if (cacheExportes.has(archivo)) return cacheExportes.get(archivo)
  const tk = tokenizar(textos.get(archivo) ?? '')
  const ex = new Map()
  for (let i = 0; i < tk.length - 3; i++) {
    if (tk[i].v === 'const' && tk[i + 1].t === 'i') {
      let j = i + 2
      while (j < tk.length && !esP(tk[j], '=') && !esP(tk[j], ';')) j++
      if (esP(tk[j], '=')) ex.set(tk[i + 1].v, parseValor(tk, j + 1)[0])
    }
  }
  cacheExportes.set(archivo, ex)
  return ex
}
function contextoDe(archivo) {
  const imports = new Map()
  for (const m of (textos.get(archivo) ?? '').matchAll(/import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g)) {
    const destino = resolverImport(m[2], archivo)
    if (destino) for (const n of nombresDeLlaves(`{${m[1]}}`, true)) imports.set(n, destino)
  }
  return { archivo, imports }
}
const unirRuta = (padre, p) => {
  if (p == null) return padre || '/'
  if (p.startsWith('/')) return p
  return `${padre === '/' || !padre ? '' : padre}/${p}`
}
const rutasApp = [] // { ruta, archivo, marco, redirige, padre }
function procesarLista(items, padre, ctx, marcoPadre, modulosShell) {
  for (const item of items) {
    if (item.k === 'o') procesarRuta(item, padre, ctx, marcoPadre, modulosShell)
    else if (item.k === 'spread') {
      // «...shellModules.flatMap((mod) => mod.routes)» de src/app/router.ts: las rutas de todos los módulos menos auth.
      if (item.v.tokens?.some((t) => t.v === 'shellModules')) {
        for (const mod of modulosShell) procesarLista(mod.rutas, padre, mod.ctx, marcoPadre, modulosShell)
      }
    } else if (item.k === 'expr' && item.tokens.length === 1 && item.tokens[0].t === 'i') {
      // Una ruta importada de otro archivo (suiteAiRoutes).
      const nombre = item.tokens[0].v
      const destino = ctx.imports.get(nombre)
      const ast = destino ? exportesDe(destino).get(nombre) : exportesDe(ctx.archivo).get(nombre)
      if (ast?.k === 'o') procesarRuta(ast, padre, destino ? contextoDe(destino) : ctx, marcoPadre, modulosShell)
    }
  }
}
function procesarRuta(obj, padre, ctx, marcoPadre, modulosShell) {
  const p = obj.props.get('path')
  const completa = unirRuta(padre, p?.k === 's' ? p.v : null)
  const tokens = (n) => obj.props.get(n)?.tokens ?? []
  const lazy = tokens('lazy')
  const iLazy = lazy.findIndex((t, i) => t.v === 'import' && esP(lazy[i + 1], '(') && lazy[i + 2]?.t === 's')
  const destino = iLazy >= 0 ? resolverImport(lazy[iLazy + 2].v, ctx.archivo) : null
  const loader = tokens('loader')
  const iRedirect = loader.findIndex((t, i) => t.v === 'redirect' && esP(loader[i + 1], '(') && loader[i + 2]?.t === 's')
  const redirige = iRedirect >= 0 ? loader[iRedirect + 2].v : null
  const hijos = obj.props.get('children')
  let marcoId = marcoPadre
  if (destino || redirige) {
    const marco = Boolean(destino && hijos?.k === 'a')
    rutasApp.push({ ruta: completa, archivo: destino, marco, redirige, padre: marcoPadre })
    if (marco) marcoId = `ruta:${completa}#marco`
  }
  if (hijos?.k === 'a') procesarLista(hijos.items, completa, ctx, marcoId, modulosShell)
}
try {
  // Los módulos que registra src/app/register-modules.ts (sin auth, como en el router).
  const registro = contextoDe('src/app/register-modules.ts')
  const modulosShell = []
  const lista = exportesDe('src/app/register-modules.ts').get('appModules')
  for (const item of lista?.items ?? []) {
    const nombre = item.tokens?.[0]?.v
    const archivo = registro.imports.get(nombre)
    const mod = archivo ? exportesDe(archivo).get(nombre) : null
    if (mod?.k === 'o' && mod.props.get('id')?.v !== 'auth') modulosShell.push({ rutas: mod.props.get('routes')?.items ?? [], ctx: contextoDe(archivo) })
  }
  const router = exportesDe('src/app/router.ts').get('router')
  const iArray = router?.tokens?.findIndex((t) => esP(t, '[')) ?? -1
  if (iArray >= 0) procesarLista(parseArray(router.tokens, iArray)[0].items, '', contextoDe('src/app/router.ts'), null, modulosShell)
} catch (e) {
  console.warn(`No se pudieron leer las rutas (${e.message}).`)
}

// 8.5 Los nodos de archivo, de ruta y de pieza/pantalla ya existentes: se enlazan, no se duplican.
const pantallaDeArchivo = new Map()
for (const n of nodos.values()) if (n.archivo && n.id.startsWith('pantalla:')) pantallaDeArchivo.set(n.archivo, n.id)
const rutaDeArchivo = new Map() // archivo -> [rutas que lo cargan directo]
for (const r of rutasApp) if (r.archivo) rutaDeArchivo.set(r.archivo, [...(rutaDeArchivo.get(r.archivo) ?? []), r.ruta])

const importadores = (r) => importadoPor.get(r)
const CARPETAS_CONGELADAS = (reglasJson.carpetas_congeladas ?? []).map((c) => c.replace(/\/$/, ''))
const congelado = (r) => CARPETAS_CONGELADAS.some((c) => r === c || r.startsWith(`${c}/`))
// Las carpetas históricas (cuentan la historia de una pieza retirada) tampoco cuentan como uso.
const HISTORICOS = (reglasJson.historicos ?? []).map((c) => c.replace(/\/$/, ''))
const fueraDeRetiradas = (r) => congelado(r) || HISTORICOS.some((c) => r === c || r.startsWith(`${c}/`))
// Código sin comentarios, con las mismas líneas: así un patrón no salta por algo que solo está comentado.
const sinComentarios = (texto) =>
  texto
    .replace(/(?<![\w'"`/*])\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ''))
    .replace(/^[ \t]*(?:\/\/|\*).*$/gm, '')
const limpios = new Map()
const enModulosOShared = (r) => r.startsWith('src/modules/') || r.startsWith('src/shared/')
const rutasDeRoutes = new Set(rutasApp.filter((r) => r.archivo).map((r) => r.archivo))

for (const ruta of ARCHIVOS) {
  const n = nodo(`archivo:${ruta}`, { tipo: 'archivo', nombre: base(ruta), archivo: ruta, modulo: moduloDe(ruta), lineas: textos.get(ruta).split('\n').length })
  poner(n, ruta)
  if (congelado(ruta)) n.congelado = true
  if (enModulosOShared(ruta) && !ruta.endsWith('.d.ts') && !ruta.endsWith('.mjs') && base(ruta) !== 'routes.ts' && !rutasDeRoutes.has(ruta) && importadores(ruta).size === 0) n.huerfano = true
}
for (const ruta of ARCHIVOS) for (const destino of info.get(ruta).importa) arista(`archivo:${ruta}`, `archivo:${destino}`, 'importa')
// Los nodos que ya existían apuntan a su archivo y heredan el dueño.
for (const [archivo, id] of pantallaDeArchivo) {
  if (!nodos.has(`archivo:${archivo}`)) continue
  arista(id, `archivo:${archivo}`, 'define')
  poner(nodos.get(id), archivo)
}
for (const [nombre, archivos] of exportadoresDe) {
  const clave = nombreAClave.get(nombre)
  for (const a of archivos) {
    arista(`archivo:${a}`, `pieza:${clave}`, 'exporta', { nombre })
    if (nombre === clave) {
      arista(`pieza:${clave}`, `archivo:${a}`, 'define')
      if (nodos.has(`pieza:${clave}`)) poner(nodos.get(`pieza:${clave}`), a)
    }
  }
}
for (const clave of piezasConocidas.keys()) {
  // Piezas cuyo nombre no coincide con ningún export: se enlazan con el primer archivo que exporta alguno de sus nombres.
  const id = `pieza:${clave}`
  if (nodos.has(id) && !aristas.some((e) => e.de === id && e.relacion === 'define' && e.a.startsWith('archivo:'))) {
    const primero = [...piezasConocidas.get(clave).nombres].map((nombre) => exportadoresDe.get(nombre)?.[0]).find(Boolean)
    if (primero) {
      arista(id, `archivo:${primero}`, 'define')
      poner(nodos.get(id), primero)
    }
  }
}
for (const [ruta, claves] of piezasDe) for (const clave of claves) arista(`archivo:${ruta}`, `pieza:${clave}`, 'usa')

// Las rutas.
const idRuta = (r) => (r.marco ? `ruta:${r.ruta}#marco` : `ruta:${r.ruta}`)
for (const r of rutasApp) {
  const id = idRuta(r)
  nodo(id, {
    tipo: 'ruta',
    nombre: r.marco ? `${r.ruta} (marco)` : r.ruta,
    ruta: r.ruta,
    archivo: r.archivo ?? undefined,
    descripcion: r.redirige ? `Redirige a ${r.redirige}` : r.marco ? `Marco que envuelve las pantallas de ${r.ruta}` : undefined,
    marco: r.marco || undefined,
    redirige: r.redirige ?? undefined,
  })
  if (r.archivo) {
    arista(id, `archivo:${r.archivo}`, 'muestra')
    if (pantallaDeArchivo.has(r.archivo)) arista(id, pantallaDeArchivo.get(r.archivo), 'muestra')
  }
  if (r.padre) arista(id, r.padre, 'parte de')
}

// Qué rutas toca cada archivo: las que lo cargan directo y las que lo traen por sus imports.
const rutasQueTocan = new Map() // archivo -> { directas:Set, todas:Set }
for (const r of rutasApp) {
  if (!r.archivo) continue
  const vistos = new Set([r.archivo])
  const cola = [r.archivo]
  while (cola.length) {
    const actual = cola.pop()
    for (const d of info.get(actual).importa) if (!vistos.has(d)) (vistos.add(d), cola.push(d))
  }
  for (const f of vistos) {
    const e = rutasQueTocan.get(f) ?? { directas: new Set(), todas: new Set() }
    e.todas.add(r.ruta)
    if (f === r.archivo) e.directas.add(r.ruta)
    rutasQueTocan.set(f, e)
  }
}

// 8.6 Reglas y retiradas (ai-tools/reglas/reglas.json).
const reglasPorId = new Map()
for (const r of reglasJson.reglas ?? []) {
  const id = `regla:${r.id}`
  reglasPorId.set(r.id, r)
  nodo(id, {
    tipo: 'regla',
    nombre: `${r.id}: ${String(r.texto ?? '').split(/(?<=[.:])\s/)[0].slice(0, 80)}`,
    codigo: r.id,
    descripcion: r.texto,
    fecha: r.fecha,
    tema: r.tema,
    ejemplo: r.ejemplo,
    hallazgos: r.hallazgos,
  })
  for (const nombre of r.piezas ?? []) {
    const clave = nombreAClave.get(nombre)
    if (clave && nodos.has(`pieza:${clave}`)) arista(id, `pieza:${clave}`, 'rige')
    else for (const a of exportadoresDe.get(nombre) ?? []) arista(id, `archivo:${a}`, 'rige')
  }
  const ejemplo = String(r.ejemplo ?? '').match(/src\/[^\s`'"()]+\.\w+/)?.[0]
  if (ejemplo) arista(id, `archivo:${ejemplo}`, 'ejemplo')
}
const RETIRADAS = reglasJson.retiradas ?? []
const retiradasDe = new Map() // archivo -> [{ id, lineas }]
const retiradaId = (r, i) => `retirada:${String(r.pieza).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || i}`
RETIRADAS.forEach((r, i) => {
  const id = retiradaId(r, i)
  r.$id = id
  nodo(id, { tipo: 'retirada', nombre: r.pieza, descripcion: `Se usa en su lugar: ${r.usa}`, fecha: r.fecha, usa: r.usa, patron: r.patron ?? undefined, exentas: r.exentas?.length ? r.exentas : undefined })
  const sustitutas = new Set()
  for (const nombre of String(r.usa ?? '').match(/[A-Za-z][\w]*/g) ?? []) {
    const clave = nombreAClave.get(nombre)
    if (clave && nodos.has(`pieza:${clave}`)) sustitutas.add(clave)
    if (sustitutas.size >= 2) break
  }
  for (const clave of sustitutas) arista(id, `pieza:${clave}`, 'reemplazada por')
  if (!r.patron) return
  let re
  try {
    re = new RegExp(r.patron, 'g')
  } catch {
    return
  }
  const exentas = (r.exentas ?? []).filter(Boolean)
  for (const [ruta, texto] of textos) {
    if (fueraDeRetiradas(ruta) || exentas.some((e) => ruta === e || ruta.startsWith(e))) continue
    if (!limpios.has(ruta)) limpios.set(ruta, sinComentarios(texto))
    const limpio = limpios.get(ruta)
    const lineas = new Set()
    for (const m of limpio.matchAll(re)) lineas.add(linea(limpio, m.index))
    if (!lineas.size) continue
    const ordenadas = [...lineas].sort((a, b) => a - b)
    arista(`archivo:${ruta}`, id, 'usa_retirada', { lineas: ordenadas.slice(0, 20), veces: ordenadas.length })
    retiradasDe.set(ruta, [...(retiradasDe.get(ruta) ?? []), { id, lineas: ordenadas }])
  }
})

// 8.7 Herramientas y documentos: skills, hooks, scripts, AGENTS.md, CLAUDE.md y docs/.
const documentos = [] // { id, ruta, texto }
const primerasLineas = (texto) => {
  const l = []
  for (const x of texto.split('\n')) {
    if (x.startsWith('#!')) continue
    if (/^\s*\/\/\s?/.test(x)) l.push(x.replace(/^\s*\/\/\s?/, '').trim())
    else if (l.length) break
    else if (x.trim()) break
    if (l.length >= 3) break
  }
  return l.join(' ').slice(0, 300)
}
const sumarDocumento = (ruta, tipo, extra) => {
  const texto = leer(join(RAIZ, ruta))
  const id = `${tipo}:${ruta}`
  const n = nodo(id, { tipo, nombre: base(ruta) === 'SKILL.md' ? ruta.split('/').at(-2) : base(ruta), archivo: ruta, ...extra?.(texto) })
  poner(n, ruta)
  documentos.push({ id, ruta, texto })
}
for (const abs of SKILLS) {
  sumarDocumento(rel(abs), 'skill', (t) => ({
    descripcion: t.match(/^description:\s*(.+)$/m)?.[1]?.replace(/^["']|["']$/g, '').slice(0, 400),
  }))
}
for (const abs of HOOKS) sumarDocumento(rel(abs), 'hook', (t) => ({ descripcion: primerasLineas(t) }))
for (const abs of SCRIPTS) sumarDocumento(rel(abs), 'script', (t) => ({ descripcion: primerasLineas(t) }))
for (const abs of [...DOCS_RAIZ, ...DOCS]) {
  sumarDocumento(rel(abs), 'documento', (t) => ({ descripcion: t.match(/^#\s+(.+)$/m)?.[1]?.slice(0, 200) }))
}
// Una cita rota apunta a un nodo «perdido»: el archivo que el documento nombra y ya no existe.
const RE_CITA_SRC = /(?<![\w/.-])src\/[^\s`'"()[\]<>,;:|*{}#…\\«»“”‘’]+/g
const RE_CITA_PIEZA = /`([A-Za-z_][\w]*)(?:\(\))?`/g
const existeEnDisco = new Map()
const hayEnDisco = (r) => {
  if (!existeEnDisco.has(r)) existeEnDisco.set(r, existsSync(join(RAIZ, r)))
  return existeEnDisco.get(r)
}
const citasRotas = [] // { documento, ruta, linea }
for (const d of documentos) {
  if (d.ruta === 'ai-tools/grafo/GRAFO.md') continue
  const vistas = new Set()
  for (const m of d.texto.matchAll(RE_CITA_SRC)) {
    const sig = d.texto[m.index + m[0].length]
    if (sig && '*<{[…'.includes(sig)) continue
    const ruta = m[0].replace(/[./]+$/, '')
    if (ruta === 'src' || ruta.includes('..') || vistas.has(ruta)) continue
    vistas.add(ruta)
    const destino = SUFIJOS.map((s) => ruta + s).find((r) => existe.has(r))
    if (destino) arista(d.id, `archivo:${destino}`, 'cita', { linea: linea(d.texto, m.index) })
    else if (!hayEnDisco(ruta)) {
      const idPerdido = `perdido:${ruta}`
      nodo(idPerdido, { tipo: 'archivo-perdido', nombre: base(ruta), archivo: ruta, descripcion: 'Un documento lo nombra, pero ya no existe en el proyecto' })
      arista(d.id, idPerdido, 'cita', { rota: true, linea: linea(d.texto, m.index) })
      citasRotas.push({ documento: d.ruta, ruta, linea: linea(d.texto, m.index) })
    }
  }
  const nombradas = new Set()
  for (const m of d.texto.matchAll(RE_CITA_PIEZA)) {
    const clave = nombreAClave.get(m[1])
    if (clave && !nombradas.has(clave)) {
      nombradas.add(clave)
      arista(d.id, `pieza:${clave}`, 'cita', { linea: linea(d.texto, m.index) })
    }
  }
}
const huerfanos = lista_huerfanos()
function lista_huerfanos() {
  return ARCHIVOS.filter((r) => nodos.get(`archivo:${r}`).huerfano)
}

// 8.8 El índice por archivo, pensado para la herramienta de consulta (indice-archivos.json).
const REGLAS_POR_USO = {
  creacion: ['crear-en-pagina', 'salir-con-cambios', 'guardado-honesto'],
  TablaDatos: ['tabla-cabe'],
  DrawerShell: ['panel-con-datos'],
  notify: ['avisos-con-tipo', 'preguntar-antes'],
  todos: ['orden', 'medidas-del-tema'],
}
const reglasDePieza = new Map() // clave -> [ids]
for (const r of reglasJson.reglas ?? []) {
  for (const nombre of r.piezas ?? []) {
    const clave = nombreAClave.get(nombre)
    if (clave) reglasDePieza.set(clave, [...new Set([...(reglasDePieza.get(clave) ?? []), r.id])])
  }
}
const tipoDeArchivo = (ruta) => {
  const pantalla = pantallaDeArchivo.get(ruta)
  if (pantalla) return nodos.get(pantalla).tipo
  if (ruta.endsWith('.d.ts')) return 'tipos'
  if (base(ruta) === 'routes.ts' || ruta === 'src/app/router.ts') return 'rutas'
  if (exportaPiezas.has(ruta) && [...exportaPiezas.get(ruta)].some((e) => e.nombre === e.clave)) return 'pieza'
  if (rutasDeRoutes.has(ruta)) return 'pagina'
  if (ruta.startsWith('src/shared/layouts/')) return 'layout'
  return ruta.endsWith('.tsx') ? 'componente' : 'logica'
}
const MAX_RUTAS = 15
const indiceArchivos = {}
for (const ruta of ARCHIVOS) {
  const n = nodos.get(`archivo:${ruta}`)
  const piezas = piezasDe.get(ruta)
  const reglasDeArchivo = new Set(['orden', 'medidas-del-tema'])
  for (const clave of piezas) for (const id of reglasDePieza.get(clave) ?? []) reglasDeArchivo.add(id)
  if (/(crear|editar|nuevo|agregar)/i.test(ruta)) for (const id of REGLAS_POR_USO.creacion) reglasDeArchivo.add(id)
  for (const clave of ['TablaDatos', 'DrawerShell', 'notify']) if (piezas.includes(clave)) for (const id of REGLAS_POR_USO[clave]) reglasDeArchivo.add(id)
  const tocan = rutasQueTocan.get(ruta)
  const todas = tocan ? [...tocan.directas, ...[...tocan.todas].filter((r) => !tocan.directas.has(r)).sort()] : []
  const entrada = {
    ruta,
    tipo: tipoDeArchivo(ruta),
    dueno: n.dueno ?? null,
    autores: n.autores ?? {},
    rutas: todas.slice(0, MAX_RUTAS),
    importa: [...info.get(ruta).importa].sort(),
    importadoPor: [...importadores(ruta)].sort(),
    exporta: [...new Set([...info.get(ruta).defs, ...info.get(ruta).reexporta])].sort(),
    piezasQueUsa: piezas,
    reglas: [...reglasDeArchivo].filter((id) => reglasPorId.has(id)),
    retiradas: (retiradasDe.get(ruta) ?? []).map((r) => r.id),
  }
  if (todas.length > MAX_RUTAS) entrada.rutasTotal = todas.length
  if (n.huerfano) entrada.huerfano = true
  if (n.congelado) entrada.congelado = true
  indiceArchivos[ruta] = entrada
}

// ── Salidas ───────────────────────────────────────────────────────────────────────────────────
const lista = [...nodos.values()]
const porTipo = {}
for (const n of lista) porTipo[n.tipo] = (porTipo[n.tipo] ?? 0) + 1
const entrantes = (id, relacion) => aristas.filter((e) => e.a === id && (!relacion || e.relacion === relacion))
const salientes = (id, relacion) => aristas.filter((e) => e.de === id && (!relacion || e.relacion === relacion))

const TIPOS = {
  'componente-flux': 'Componente de la librería (@ubits/flux-ui), tal cual',
  pieza: 'Pieza del equipo hecha con flux: se usa antes que el componente suelto',
  ficha: 'Lo que se customizó de una pieza frente a la librería, con el porqué',
  'regla-global': 'Ajuste que cambia toda la librería (no una pieza)',
  pantalla: 'Pantalla del producto maquetada en el playground (/admin, /portal-colaborador)',
  plantilla: 'Pantalla completa de referencia en el design system (/design-system/templates)',
  'pagina-ds': 'Página de documentación del design system',
  trampa: 'Trampa conocida de un componente de flux (cómo no romperlo)',
  diferencia: 'Lo que el playground hace distinto de flux y se le pide a la librería',
  historia: 'Historia de usuario del producto real (HU-XXX-000)',
  producto: 'Concepto, pantalla o regla del producto real (docs/plataforma-ubits)',
  'producto-documento': 'Documento de docs/plataforma-ubits',
  archivo: 'Archivo de código de src/ (con su dueño, y huerfano: true si nadie lo importa ni lo muestra una ruta)',
  ruta: 'Dirección de la aplicación (router) y el archivo que carga',
  regla: 'Regla del equipo (ai-tools/reglas/reglas.json), enlazada a las piezas que rige',
  retirada: 'Pieza o patrón retirado: los archivos que todavía lo usan cuelgan de aquí con usa_retirada',
  skill: 'Skill de ai-tools/skills (SKILL.md)',
  hook: 'Hook de ai-tools/hooks',
  script: 'Script de scripts/',
  documento: 'Documento: AGENTS.md, CLAUDE.md o un .md de docs/ (sus citas rotas se marcan)',
  'archivo-perdido': 'Archivo que un documento nombra y ya no existe',
}

mkdirSync(AQUI, { recursive: true })
// Un nodo y una arista por línea: el JSON sigue siendo válido y pesa mucho menos que con sangrado por propiedad.
const cabecera = JSON.stringify(
  {
    $para_que:
      'El mapa del Playground UX para una IA: componentes de flux, piezas del equipo y sus fichas, pantallas y qué usa cada una, trampas, diferencias con la librería y el producto real enlazado por historias de usuario; además cada archivo de src/ con sus imports y su dueño, las rutas, las reglas y retiradas de ai-tools/reglas, las skills, hooks, scripts y documentos. Lo genera ai-tools/grafo/generar-grafo.mjs; no se edita a mano. Resumen legible en GRAFO.md; consulta por archivo en indice-archivos.json.',
    generado: new Date().toISOString().slice(0, 10),
    huella: HUELLA,
    tipos: TIPOS,
    totales: { nodos: lista.length, aristas: aristas.length, por_tipo: porTipo },
  },
  null,
  1,
)
const unaPorLinea = (xs) => xs.map((x) => `  ${JSON.stringify(x)}`).join(',\n')
writeFileSync(SALIDA, `${cabecera.slice(0, -2)},\n "nodos": [\n${unaPorLinea(lista)}\n ],\n "aristas": [\n${unaPorLinea(aristas)}\n ]\n}\n`)
writeFileSync(
  join(AQUI, 'indice-archivos.json'),
  `{\n "$para_que": ${JSON.stringify('Consulta por archivo de src/: dueño, qué importa y quién lo importa, qué exporta, qué piezas del equipo usa, qué reglas le aplican, qué retiradas usa todavía y en qué rutas se ve. Lo genera ai-tools/grafo/generar-grafo.mjs; no se edita a mano.')},\n "generado": ${JSON.stringify(new Date().toISOString().slice(0, 10))},\n "huella": ${JSON.stringify(HUELLA)},\n "total": ${Object.keys(indiceArchivos).length},\n "archivos": {\n${Object.entries(indiceArchivos)
    .map(([r, e]) => `  ${JSON.stringify(r)}: ${JSON.stringify(e)}`)
    .join(',\n')}\n }\n}\n`,
)

// GRAFO.md: lo justo para orientarse sin abrir el JSON.
const usosDePieza = (clave) => entrantes(`pieza:${clave}`, 'usa').filter((e) => e.de.startsWith('pantalla:') && nodos.get(e.de).tipo === 'pantalla')
const piezas = lista.filter((n) => n.tipo === 'pieza').sort((a, b) => usosDePieza(b.codigo).length - usosDePieza(a.codigo).length)
const flux = lista.filter((n) => n.tipo === 'componente-flux').map((n) => ({ n, usos: entrantes(n.id, 'usa').filter((e) => nodos.get(e.de).tipo === 'pantalla').length }))
const pantallas = lista.filter((n) => n.tipo === 'pantalla').sort((a, b) => a.ruta.localeCompare(b.ruta))
const fila = (celdas) => `| ${celdas.join(' | ')} |`
const md = [
  '# Grafo del Playground UX',
  '',
  `> Generado el ${new Date().toISOString().slice(0, 10)} por \`ai-tools/grafo/generar-grafo.mjs\` (no se edita a mano). El grafo completo está en \`ai-tools/grafo/grafo.json\` y se explora en \`/design-system/grafo\`.`,
  '',
  '## Cómo leerlo',
  '',
  '- **Antes de armar algo**, busca la pieza del equipo (tabla de abajo): se usa antes que el componente de flux suelto. Si tiene ficha, la ficha dice qué cambió y cuándo usarla.',
  '- **Para copiar cómo se resolvió algo**, busca una pantalla que use la misma pieza.',
  '- **Para el contexto del producto**, sigue `implementa` desde una pantalla hasta su historia de usuario y de ahí al resto del producto real.',
  '- En el JSON: `nodos` (`id`, `tipo`, `nombre`, `descripcion`, `ruta`, `archivo`) y `aristas` (`de`, `a`, `relacion`).',
  '- **Por archivo** (dueño, quién lo importa, piezas y reglas que le tocan, retiradas que usa): `ai-tools/grafo/indice-archivos.json`, una entrada por ruta de `src/`.',
  '',
  `## Totales (${lista.length} nodos, ${aristas.length} aristas)`,
  '',
  fila(['Tipo', 'Qué es', 'Cuántos']),
  fila(['---', '---', '---:']),
  ...Object.entries(TIPOS).map(([t, d]) => fila([`\`${t}\``, d, String(porTipo[t] ?? 0)])),
  '',
  '## Relaciones',
  '',
  '- `usa`: una pantalla (o pieza) importa ese componente o pieza.',
  '- `hecha con`: una pieza o ficha está construida con ese componente de flux.',
  '- `tiene ficha`: la pieza tiene documentado qué se customizó.',
  '- `parte de`: una pantalla cuelga de otra.',
  '- `implementa`: la pantalla cita esa historia de usuario.',
  '- `sobre`: una trampa o diferencia afecta a ese componente de flux.',
  '- `importa`: un archivo de `src/` importa a otro. `define`: la pantalla o pieza vive en ese archivo. `exporta`: el archivo exporta esa pieza.',
  '- `muestra`: una ruta de la aplicación carga esa pantalla o archivo. `rige`: una regla del equipo afecta a esa pieza. `reemplazada por`: una retirada se sustituye por esa pieza.',
  '- `usa_retirada`: el archivo todavía usa algo retirado (con las líneas). `cita`: un documento nombra una ruta de `src/` o una pieza (`rota: true` si la ruta ya no existe).',
  '- El resto (`navega a`, `especifica`, `regula`…) viene del grafo del producto real.',
  '',
  '## Piezas del equipo, de más a menos usada',
  '',
  fila(['Pieza', 'Código', 'Para qué', 'Pantallas que la usan', 'Ficha']),
  fila(['---', '---', '---', '---:', '---']),
  ...piezas.map((p) => {
    const ficha = salientes(p.id, 'tiene ficha')[0]
    return fila([p.nombre, `\`${p.codigo}\``, p.descripcion.replace(/\|/g, '/'), String(usosDePieza(p.codigo).length), ficha ? `\`${ficha.a}\`` : '—'])
  }),
  '',
  '## Componentes de flux más usados en pantallas',
  '',
  fila(['Componente', 'Pantallas', 'Trampas']),
  fila(['---', '---:', '---:']),
  ...flux
    .filter((f) => f.usos)
    .sort((a, b) => b.usos - a.usos)
    .slice(0, 30)
    .map((f) => fila([f.n.nombre, String(f.usos), String(entrantes(f.n.id, 'sobre').filter((e) => e.de.startsWith('trampa:')).length)])),
  '',
  `Sin usar en ninguna pantalla: ${flux.filter((f) => !f.usos).map((f) => f.n.nombre).join(', ') || 'ninguno'}.`,
  '',
  '## Pantallas del producto',
  '',
  fila(['Ruta', 'Nombre', 'Piezas del equipo', 'Historias']),
  fila(['---', '---', '---', '---']),
  ...pantallas.map((p) =>
    fila([
      `\`${p.ruta}\``,
      p.nombre,
      salientes(p.id, 'usa').filter((e) => e.a.startsWith('pieza:')).map((e) => nodos.get(e.a).codigo).join(', ') || '—',
      (p.hus ?? []).join(', ') || '—',
    ]),
  ),
  '',
  `## Archivos por dueño (${ARCHIVOS.length} archivos de código en src/)`,
  '',
  hayGit ? 'El dueño es quien más commits tiene en el archivo.' : 'No se pudo leer git: el grafo salió sin dueños.',
  '',
  fila(['Dueño', 'Archivos']),
  fila(['---', '---:']),
  ...Object.entries(
    ARCHIVOS.reduce((c, r) => {
      const d = nodos.get(`archivo:${r}`).dueno ?? 'sin commits'
      c[d] = (c[d] ?? 0) + 1
      return c
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .map(([d, n]) => fila([d, String(n)])),
  '',
  '## Retiradas que todavía se usan',
  '',
  'Cada fila es algo que el equipo retiró (ai-tools/reglas/reglas.json) y todavía aparece en el código, sin contar comentarios, carpetas congeladas ni históricas. Las líneas por archivo están en las aristas `usa_retirada`.',
  '',
  fila(['Retirada', 'Se usa en su lugar', 'Archivos', 'Ejemplos']),
  fila(['---', '---', '---:', '---']),
  ...RETIRADAS.map((r) => {
    const usan = aristas.filter((e) => e.a === r.$id && e.relacion === 'usa_retirada').map((e) => e.de.replace('archivo:', ''))
    return { r, usan }
  })
    .filter((x) => x.usan.length)
    .sort((a, b) => b.usan.length - a.usan.length)
    .map(({ r, usan }) => fila([r.pieza.replace(/\|/g, '/'), r.usa.replace(/\|/g, '/'), String(usan.length), usan.slice(0, 3).map((u) => `\`${u}\``).join(', ')])),
  '',
  `Sin patrón para buscar (se revisan a mano): ${RETIRADAS.filter((r) => !r.patron).map((r) => r.pieza).join('; ') || 'ninguna'}.`,
  '',
  `## Archivos huérfanos (${huerfanos.length})`,
  '',
  'Archivos de `src/modules` y `src/shared` que ninguna ruta carga y nadie importa (sin contar `routes.ts` ni `.d.ts`). Candidatos a borrar o a conectar.',
  '',
  ...huerfanos.slice(0, 80).map((r) => `- \`${r}\`${nodos.get(`archivo:${r}`).dueno ? ` (${nodos.get(`archivo:${r}`).dueno})` : ''}`),
  ...(huerfanos.length > 80 ? [`- … y ${huerfanos.length - 80} más: están marcados con \`huerfano: true\` en el grafo y en indice-archivos.json.`] : []),
  '',
  `## Citas rotas en documentos (${citasRotas.length})`,
  '',
  'Documentos que nombran una ruta de `src/` que ya no existe: están desfasados. Las aristas `cita` con `rota: true` lo dicen.',
  '',
  ...Object.entries(
    citasRotas.reduce((c, x) => {
      ;(c[x.documento] ??= []).push(x)
      return c
    }, {}),
  )
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 40)
    .map(([d, xs]) => `- \`${d}\` (${xs.length}): ${xs.slice(0, 3).map((x) => `\`${x.ruta}\``).join(', ')}${xs.length > 3 ? ', …' : ''}`),
  '',
].join('\n')
writeFileSync(RESUMEN, md)

console.log(`Grafo: ${lista.length} nodos, ${aristas.length} aristas → ${rel(SALIDA)} y ${rel(RESUMEN)}`)
