#!/usr/bin/env node
// Avisa al abrir la sesión si caducó el acceso a la librería interna (@ubits/flux-ui).
//
// El token de AWS CodeArtifact dura unas 12 horas. Cuando vence, el MCP de flux-ui deja de
// responder y `npm install` falla, pero nada lo dice: el error aparece más tarde y despista.
// Este aviso lo detecta al empezar y da el comando exacto para reconectar.
//
// Le pregunta al registro por la versión publicada de la librería usando la propia
// configuración de npm, así que nunca lee ni guarda el token.
// Si el acceso está bien, no imprime nada para no ensuciar el arranque.

import { spawnSync } from 'node:child_process'

const ESPERA_MS = 10000

const consulta = spawnSync('npm', ['view', '@ubits/flux-ui', 'version'], {
  encoding: 'utf8',
  timeout: ESPERA_MS,
})

const salida = `${consulta.stderr ?? ''}${consulta.stdout ?? ''}`
const sinAcceso = /E401|E403|ENEEDAUTH|401 Unauthorized|403 Forbidden|Unable to authenticate/i.test(salida)
const sinRegistro = /E404|not found/i.test(salida) && !/@ubits/.test(consulta.stdout ?? '')

if (consulta.status !== 0 && (sinAcceso || sinRegistro)) {
  // El texto va a la sesión como contexto: en español y con el comando listo para copiar.
  console.log(
    [
      'Acceso a la librería interna caducado o sin configurar: el registro de @ubits no responde.',
      'Pídele al equipo que corra `npm run aws-login` y reinicie el editor (el acceso dura unas 12 horas).',
      'Mientras tanto el MCP de flux-ui no responde y `npm install` falla;',
      'para elegir componentes usa ai-tools/flux-ui/flux-ui-para-ia.json, que no necesita conexión.',
    ].join(' '),
  )
}
