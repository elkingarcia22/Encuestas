#!/usr/bin/env node
// Impacto de un cambio en el design system.
//
// Uso (desde la raíz del repo):
//   node .claude/skills/sincronizar-design-system/scripts/impacto.mjs              → toma lo que cambió según git
//   node .claude/skills/sincronizar-design-system/scripts/impacto.mjs <archivo>…   → solo esos archivos
//   node .claude/skills/sincronizar-design-system/scripts/impacto.mjs --todo       → todos los componentes del mapa
//
// Para cada componente general tocado dice: qué páginas del design system lo documentan (y si son réplicas que hay
// que cambiar a mano), qué pantallas reales lo usan (para el barrido de consistencia) y dónde aparecen sus nombres
// y reglas en los textos del design system. También avisa si se tocó la documentación sin tocar el componente real
// (el cambio va en las dos direcciones) y si se tocó algo compartido que todavía no está en el mapa.

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const here = path.dirname(new URL(import.meta.url).pathname)
const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim()
const mapa = JSON.parse(fs.readFileSync(path.join(here, 'mapa.json'), 'utf8'))
const DS = 'src/modules/design-system/'

const args = process.argv.slice(2)
const todo = args.includes('--todo')

// Archivos cambiados: los que se pasan, o modificados + nuevos según git (sin carpetas de trabajo).
function cambiados() {
  const files = args.filter((a) => !a.startsWith('--'))
  if (files.length) return files.map((f) => path.relative(root, path.resolve(f)))
  const out = execFileSync('git', ['status', '--porcelain', '--untracked-files=all'], { cwd: root, encoding: 'utf8' })
  return out
    .split('\n')
    .filter(Boolean)
    .map((line) => line.slice(3).split(' -> ').pop())
    .filter((f) => f.startsWith('src/') || f === 'index.html')
}

// Patrón con * y ** a expresión regular.
const aRegex = (pattern) =>
  new RegExp('^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '§').replace(/\*/g, '[^/]*').replace(/§/g, '.*') + '$')
const coincide = (file, pattern) => (pattern.includes('*') ? aRegex(pattern).test(file) : file === pattern)

// grep -rlF que no falla si no encuentra nada.
function buscar(texto, carpetas) {
  try {
    return execFileSync('grep', ['-rlF', '--include=*.ts', '--include=*.tsx', '--include=*.css', texto, ...carpetas], {
      cwd: root,
      encoding: 'utf8',
    })
      .split('\n')
      .filter(Boolean)
  } catch {
    return []
  }
}

const archivos = todo ? [] : cambiados().filter((f) => !(mapa.ignorar ?? []).includes(f))
const tocados = new Map() // id → { comp, fuentes: Set, docs: Set }
const sinMapa = []

for (const file of archivos) {
  let hit = false
  for (const comp of mapa.componentes) {
    const entry = tocados.get(comp.id) ?? { comp, fuentes: new Set(), docs: new Set() }
    if (comp.fuentes.some((f) => coincide(file, f))) {
      entry.fuentes.add(file)
      hit = true
    }
    if (comp.designSystem.some((d) => d.archivos.some((a) => coincide(file, a)))) {
      entry.docs.add(file)
      hit = true
    }
    if (entry.fuentes.size || entry.docs.size) tocados.set(comp.id, entry)
  }
  const compartido =
    file.startsWith('src/shared/') ||
    file.startsWith('src/modules/admin/suite-ai/shared/') ||
    file.startsWith('src/modules/admin/suite-ai/chat/components/') ||
    file.startsWith(DS + 'agente-contextual/components/') ||
    file === 'src/index.css'
  if (!hit && compartido) sinMapa.push(file)
}
if (todo) for (const comp of mapa.componentes) tocados.set(comp.id, { comp, fuentes: new Set(comp.fuentes), docs: new Set() })

const linea = (s = '') => console.log(s)
linea('# Impacto en el design system')
linea()
if (!todo) {
  linea(`Archivos revisados: ${archivos.length}`)
  if (!archivos.length) linea('No hay cambios según git. Pasa los archivos a mano o usa --todo.')
  linea()
}

for (const { comp, fuentes, docs } of tocados.values()) {
  linea(`## ${comp.nombre}  [${comp.id}]`)
  const lista = (set) => [...set].slice(0, 8).join(', ') + (set.size > 8 ? ` … y ${set.size - 8} más` : '')
  if (fuentes.size) linea(`Componente real tocado: ${lista(fuentes)}`)
  if (docs.size) linea(`Documentación tocada: ${lista(docs)}`)
  if (docs.size && !fuentes.size && !todo) {
    linea('⚠️  Se cambió el design system pero no el componente real: si es una regla o un cambio de diseño, aplícalo')
    linea('   también en la interfaz real (ver «Usado en» abajo). Si solo es documentación, está bien.')
  }
  linea()
  if (comp.sinPagina) linea(`⚠️  ${comp.sinPagina}`)
  if (comp.designSystem.length) linea('Actualizar en el design system:')
  for (const d of comp.designSystem) {
    const tipo = { reutiliza: 'usa el componente real', replica: 'RÉPLICA: cambiar a mano', texto: 'solo textos' }[d.relacion] ?? d.relacion
    linea(`- ${d.ruta} (${tipo})`)
    linea(`  ${d.que}`)
    for (const a of d.archivos) linea(`  · ${a}`)
  }
  linea()

  // Barrido de consistencia: pantallas reales que importan o usan el componente.
  const usos = new Set()
  for (const imp of comp.importa) for (const f of buscar(imp, ['src/modules', 'src/shared'])) usos.add(f)
  for (const f of comp.fuentes) usos.delete(f)
  const reales = [...usos].filter((f) => !f.startsWith(DS)).sort()
  const enDs = [...usos].filter((f) => f.startsWith(DS)).sort()
  if (reales.length) {
    linea(`Usado en pantallas reales (${reales.length}) — revisar que todas sigan la misma regla:`)
    for (const f of reales.slice(0, 40)) linea(`  · ${f}`)
    if (reales.length > 40) linea(`  … y ${reales.length - 40} más`)
  }
  if (enDs.length) {
    linea(`Usado dentro del design system (${enDs.length}):`)
    for (const f of enDs.slice(0, 30)) linea(`  · ${f}`)
  }
  linea()

  // Copias de clases. Si la constante existe con el mismo nombre (o su equivalencia) en el original, se compara el
  // texto completo; si no, se busca clase por clase. Detecta tanto clases viejas como clases nuevas que faltan.
  for (const { copia, originales, equivalencias = {}, propias = [] } of comp.copias ?? []) {
    const fuentesTexto = originales.map((f) => fs.readFileSync(path.join(root, f), 'utf8'))
    const original = fuentesTexto.join('\n')
    const constantes = new Map()
    for (const t of fuentesTexto) for (const m of t.matchAll(/(?:export )?const (\w+)\s*=\s*\n?\s*'([^']*)'/g)) constantes.set(m[1], m[2])
    const normal = (v) => v.trim().split(/\s+/).sort().join(' ')
    const texto = fs.readFileSync(path.join(root, copia), 'utf8')
    const desfasadas = []
    for (const m of texto.matchAll(/export const (\w+)\s*=\s*\n?\s*'([^']*)'/g)) {
      if (propias.includes(m[1])) continue
      const par = constantes.get(equivalencias[m[1]] ?? m[1])
      if (par !== undefined) {
        if (normal(par) !== normal(m[2])) {
          const a = new Set(m[2].split(/\s+/))
          const b = new Set(par.split(/\s+/))
          const sobran = [...a].filter((c) => c && !b.has(c))
          const faltan = [...b].filter((c) => c && !a.has(c))
          desfasadas.push(`${m[1]}: sobran «${sobran.join(' ')}» · faltan «${faltan.join(' ')}»`)
        }
        continue
      }
      const faltan = m[2].split(/\s+/).filter((clase) => clase && !original.includes(clase))
      if (faltan.length) desfasadas.push(`${m[1]}: ya no aparecen «${faltan.join(' ')}»`)
    }
    if (desfasadas.length) {
      linea(`⚠️  Copia desfasada: ${copia} no coincide con ${originales.join(' / ')}:`)
      for (const d of desfasadas) linea(`  · ${d}`)
      linea('  Copia las clases actuales del componente real (o marca la constante como propia en mapa.json si es solo del design system).')
      linea()
    }
  }

  // Textos: dónde aparecen los nombres y reglas del componente en el design system.
  const textos = []
  for (const palabra of comp.palabras) {
    const files = buscar(palabra, [DS])
    if (files.length) textos.push(`«${palabra}»: ${files.length} archivo(s) → ${files.slice(0, 6).map((f) => f.replace(DS, '')).join(', ')}${files.length > 6 ? '…' : ''}`)
  }
  if (textos.length) {
    linea('Nombres y reglas en textos del design system (revisar que digan lo nuevo):')
    for (const t of textos) linea(`  · ${t}`)
    linea()
  }
}

if (sinMapa.length) {
  linea('## Compartido sin mapear')
  linea('Estos archivos parecen de uso general pero no están en mapa.json. Decide si son un componente general; si lo son,')
  linea('súmalos al mapa (y a referencias/mapa.md) con la página del design system que los documenta, o crea esa página.')
  for (const f of sinMapa) linea(`  · ${f}`)
  linea()
}

if (!tocados.size && !sinMapa.length && archivos.length) {
  linea('Ningún archivo tocado es un componente general del mapa ni su documentación.')
  linea('Si igual cambiaste una regla de diseño (orden, tamaño, color, texto), búscala con grep en src/modules/design-system.')
}
