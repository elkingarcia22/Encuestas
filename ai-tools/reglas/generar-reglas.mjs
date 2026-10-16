#!/usr/bin/env node
// Lleva ai-tools/reglas/reglas.json (la fuente única de las reglas) a donde la leen las personas y la IA:
//   AGENTS.md                              la tabla de piezas, las reglas vigentes, las retiradas y lo que falta decidir,
//                                          entre marcas <!-- generado:… --> (lo de fuera de las marcas no se toca)
//   ai-tools/flux-ui/flux-ui-para-ia.json  reglas y piezas del catálogo (lo regenera generar-catalogo.mjs, que lee reglas.json)
//   ai-tools/grafo/grafo.json              reglas y retiradas en el grafo (lo regenera generar-grafo.mjs)
// El recordatorio de cada mensaje (ai-tools/hooks/recordatorio.mjs) lee reglas.json directamente.
//
// Uso:
//   node ai-tools/reglas/generar-reglas.mjs              # regenera todo
//   node ai-tools/reglas/generar-reglas.mjs --verificar  # no escribe; sale con 1 si AGENTS.md no está al día

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))
const RAIZ = resolve(AQUI, '../..')
const FUENTE = join(AQUI, 'reglas.json')
const AGENTS = join(RAIZ, 'AGENTS.md')
const verificar = process.argv.includes('--verificar')

const datos = JSON.parse(readFileSync(FUENTE, 'utf8'))

// ── Validación: lo mínimo para que una regla sirva ──────────────────────────────────────────────
const errores = []
const ids = new Set()
for (const r of datos.reglas) {
  if (!r.id || !r.fecha || !r.texto) errores.push(`regla sin id, fecha o texto: ${JSON.stringify(r).slice(0, 80)}`)
  if (ids.has(r.id)) errores.push(`id repetido: ${r.id}`)
  ids.add(r.id)
  if (r.en?.includes('recordatorio') && !r.corto) errores.push(`la regla «${r.id}» va en el recordatorio y no tiene «corto»`)
}
for (const x of datos.retiradas) {
  if (!x.pieza || !x.fecha || !x.usa) errores.push(`retirada sin pieza, fecha o sustituto: ${x.pieza ?? '?'}`)
  if (x.patron) {
    try { new RegExp(x.patron) } catch { errores.push(`patrón inválido en la retirada «${x.pieza}»: ${x.patron}`) }
  }
}
for (const p of datos.piezas) if (!p.necesidad || !p.usa || !p.desde) errores.push(`pieza incompleta: ${p.necesidad ?? '?'}`)
if (errores.length) {
  console.error('reglas.json tiene errores:\n- ' + errores.join('\n- '))
  process.exit(1)
}

// ── Bloques de AGENTS.md ───────────────────────────────────────────────────────────────────────
const fecha = (iso) => {
  const [a, m, d] = iso.split('-').map(Number)
  return `${d}-${['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][m - 1]}`
}
const celda = (t) => String(t ?? '').replace(/\|/g, '\\|')
const AVISO = 'sale de ai-tools/reglas/reglas.json; se cambia ahí y se corre node ai-tools/reglas/generar-reglas.mjs'

const bloques = {
  piezas: [
    '| Si necesitas | Ya existe | No uses |',
    '| --- | --- | --- |',
    ...datos.tabla_agents.map((f) => `| ${celda(f.necesidad)} | ${celda(f.usa)} | ${celda(f.no_uses)} |`),
  ].join('\n'),
  reglas: [
    '### Las reglas que más se rompen',
    '',
    'Cada una salió de una decisión del equipo o de una auditoría, y cada una tiene su pantalla modelo. Antes de',
    'inventar una forma distinta, copia la del modelo.',
    '',
    ...datos.reglas
      .filter((r) => r.en?.includes('agents') && r.id !== 'orden')
      .map((r) => {
        const [primera, ...resto] = r.texto.split(/(?<=[.:])\s/)
        const modelo = r.ejemplo ? `Modelo: \`${r.ejemplo.split(' (')[0]}\`.` : ''
        return ['-', `**${primera}**`, resto.join(' '), modelo, `_(${fecha(r.fecha)})_`].filter(Boolean).join(' ')
      }),
  ].join('\n'),
  retiradas: [
    '### Piezas retiradas: no vuelven',
    '',
    'Si unes una rama o copias de una pantalla vieja y aparece una de estas, se cambia por su sustituta antes del commit.',
    '',
    '| Retirada | Desde | Usa en su lugar |',
    '| --- | --- | --- |',
    ...datos.retiradas.map((x) => `| ${celda(x.pieza)} | ${fecha(x.fecha)} | ${celda(x.usa)} |`),
  ].join('\n'),
  'por-decidir': [
    '### Por decidir: pregunta, no elijas',
    '',
    'Estas preguntas siguen abiertas. Si tu pantalla depende de una, pregunta en vez de elegir por tu cuenta.',
    '',
    ...datos.por_decidir.map((q) => `- **${q.id}:** ${q.pregunta} Decide: ${q.decide}.`),
  ].join('\n'),
}

const marca = (nombre, cuerpo) => `<!-- generado:${nombre} · ${AVISO} -->\n${cuerpo}\n<!-- /generado:${nombre} -->`

let agents = readFileSync(AGENTS, 'utf8')
const original = agents

// Primera vez: la tabla escrita a mano se cambia por su bloque, y los demás bloques entran antes de «No sobrescribir».
if (!agents.includes('<!-- generado:piezas')) {
  const lineas = agents.split('\n')
  const ini = lineas.findIndex((l) => l.startsWith('| Si necesitas'))
  if (ini < 0) throw new Error('No encontré la tabla de piezas de AGENTS.md («| Si necesitas …»).')
  let fin = ini
  while (fin + 1 < lineas.length && lineas[fin + 1].startsWith('|')) fin++
  lineas.splice(ini, fin - ini + 1, marca('piezas', ''))
  agents = lineas.join('\n')
}
for (const nombre of ['reglas', 'retiradas', 'por-decidir']) {
  if (!agents.includes(`<!-- generado:${nombre}`)) {
    const ancla = '### No sobrescribir la apariencia'
    if (!agents.includes(ancla)) throw new Error(`No encontré «${ancla}» en AGENTS.md para poner el bloque ${nombre}.`)
    agents = agents.replace(ancla, `${marca(nombre, '')}\n\n${ancla}`)
  }
}
for (const [nombre, cuerpo] of Object.entries(bloques)) {
  const re = new RegExp(`<!-- generado:${nombre}[^>]*-->[\\s\\S]*?<!-- /generado:${nombre} -->`)
  agents = agents.replace(re, marca(nombre, cuerpo))
}

if (verificar) {
  if (agents !== original) {
    console.error('AGENTS.md no está al día con ai-tools/reglas/reglas.json: corre node ai-tools/reglas/generar-reglas.mjs')
    process.exit(1)
  }
  console.log('AGENTS.md al día con reglas.json')
  process.exit(0)
}

if (agents !== original) writeFileSync(AGENTS, agents)
console.log(`AGENTS.md ${agents !== original ? 'actualizado' : 'sin cambios'}: ${datos.tabla_agents.length} piezas, ${datos.reglas.filter((r) => r.en?.includes('agents')).length} reglas, ${datos.retiradas.length} retiradas, ${datos.por_decidir.length} por decidir`)

// ── Lo que se genera a partir de aquí ─────────────────────────────────────────────────────────
for (const script of ['ai-tools/flux-ui/generar-catalogo.mjs', 'ai-tools/grafo/generar-grafo.mjs']) {
  if (!existsSync(join(RAIZ, script))) continue
  try {
    const salida = execFileSync(process.execPath, [join(RAIZ, script)], { cwd: RAIZ, encoding: 'utf8' })
    console.log(salida.trim().split('\n').pop())
  } catch (e) {
    console.error(`Falló ${script}: ${e.message.split('\n')[0]}`)
    process.exitCode = 1
  }
}
