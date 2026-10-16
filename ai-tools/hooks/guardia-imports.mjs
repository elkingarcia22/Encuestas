#!/usr/bin/env node
// PreToolUse (Write | Edit | MultiEdit): bloquea el cambio si mete en src/ una
// librería de UI que no es @ubits/flux-ui, o un componente que solo existe en el Storybook.

import { cargarCatalogo, esArchivoVigilado, leerEntrada, revisarCodigo } from './reglas.mjs'

const entrada = await leerEntrada()
const tool = entrada.tool_input ?? {}

if (!esArchivoVigilado(tool.file_path)) process.exit(0)

const textoNuevo = [tool.content, tool.new_string, ...(tool.edits ?? []).map((e) => e.new_string)]
  .filter(Boolean)
  .join('\n')

const problemas = revisarCodigo(textoNuevo, cargarCatalogo(), tool.file_path)
if (problemas.length === 0) process.exit(0)

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason:
        `Cambio bloqueado en ${tool.file_path}:\n- ${problemas.join('\n- ')}\n` +
        'Rehazlo con lo que ya existe: primero las piezas del proyecto ("piezas_del_proyecto" en ai-tools/flux-ui/flux-ui-para-ia.json, en src/shared/components y src/modules/design-system), después los componentes de @ubits/flux-ui del mismo archivo. No crees componentes propios.',
    },
  }),
)
