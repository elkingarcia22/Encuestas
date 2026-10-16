#!/usr/bin/env node
// Stop: antes de dar la tarea por terminada, revisa todos los archivos cambiados en src/
// (también los escritos por terminal, que el hook de PreToolUse no ve).

import { execFileSync } from 'node:child_process'

import { RAIZ, cargarCatalogo, esArchivoVigilado, leerArchivo, leerEntrada, revisarCodigo } from './reglas.mjs'

const entrada = await leerEntrada()

let estado = ''
try {
  estado = execFileSync('git', ['status', '--porcelain', '-uall'], { cwd: RAIZ, encoding: 'utf8' })
} catch {
  process.exit(0)
}

const cambiados = estado
  .split('\n')
  .filter((linea) => linea && !linea.startsWith(' D') && !linea.startsWith('D '))
  .map((linea) => linea.slice(3).split(' -> ').pop())
  .filter(esArchivoVigilado)

const catalogo = cargarCatalogo()
const hallazgos = cambiados.flatMap((ruta) =>
  revisarCodigo(leerArchivo(ruta), catalogo, ruta).map((problema) => `${ruta}: ${problema}`),
)

if (hallazgos.length === 0) process.exit(0)

// Segunda vuelta: ya se le pidió corregir una vez. No se fuerza otra para no entrar
// en bucle; se deja el aviso a la vista de la persona.
if (entrada.stop_hook_active) {
  process.stdout.write(
    JSON.stringify({
      systemMessage: `Quedan imports fuera de flux-ui:\n- ${hallazgos.join('\n- ')}`,
    }),
  )
  process.exit(0)
}

process.stdout.write(
  JSON.stringify({
    decision: 'block',
    reason:
      `Antes de terminar, corrige estos imports fuera de las reglas del playground:\n- ${hallazgos.join('\n- ')}\n` +
      'Usa solo componentes de @ubits/flux-ui (ai-tools/flux-ui/flux-ui-para-ia.json), sin crear componentes propios, y cierra con npm run check.',
  }),
)
