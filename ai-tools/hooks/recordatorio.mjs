#!/usr/bin/env node
// UserPromptSubmit: en cada mensaje recuerda de dónde sale la UI y las reglas que más se rompen.
// Las reglas no se escriben aquí: salen de ai-tools/reglas/reglas.json (las que tienen "recordatorio" en «en», en su
// versión «corto»), igual que las piezas retiradas. Si reglas.json no se puede leer, queda el mínimo de siempre.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { cargarCatalogo, RAIZ } from './reglas.mjs'

const c = cargarCatalogo()
const version = c?.libreria?.version ?? '?'
const total = c?.totales?.disponibles ?? '?'
const noInstalados = (c?.soloEnStorybook ?? []).map((x) => x.titulo.split('/').pop()).join(', ')

let fuente = null
try {
  fuente = JSON.parse(readFileSync(join(RAIZ, 'ai-tools/reglas/reglas.json'), 'utf8'))
} catch {}

const partes = [
  'Playground UX. Antes de escribir UI, pregúntale al design system: con la herramienta ds-ubits (MCP del repo) usa buscar_pieza para cada pieza que necesites y reglas_para con el archivo que vas a tocar; si no la tienes, lee ai-tools/reglas/reglas.json y ai-tools/flux-ui/flux-ui-para-ia.json (piezas del proyecto primero, después los ' +
    `${total} componentes de @ubits/flux-ui ${version}) y sigue la skill flux-ui-storybook.`,
]
if (fuente) {
  const reglas = fuente.reglas.filter((r) => r.en?.includes('recordatorio') && r.corto)
  partes.push('Reglas vigentes: ' + reglas.map((r, i) => `${i + 1}) ${r.corto}`).join(' '))
  partes.push('Retiradas, no vuelven (sustituta en reglas.json): ' + fuente.retiradas.map((x) => x.pieza).join('; ') + '.')
  if (fuente.por_decidir?.length) {
    partes.push('Por decidir (pregunta, no elijas): ' + fuente.por_decidir.map((q) => q.id).join(', ') + '.')
  }
} else {
  partes.push(
    'PRIMERO las piezas que el proyecto ya resolvió (PageShell, BotonIcono, notify con tipo, DrawerShell, DialogoConfirmar para preguntar, ActionDialog para toda otra ventana, TablaDatos para toda tabla), DESPUÉS flux-ui; si nada encaja, detente y pregunta.',
  )
}
if (noInstalados) partes.push(`No uses ${noInstalados}: están en el Storybook pero no en la versión instalada.`)
partes.push('Iconos Hugeicons, colores solo tokens, className solo layout; cierra con npm run check.')

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: partes.join(' '),
    },
  }),
)
