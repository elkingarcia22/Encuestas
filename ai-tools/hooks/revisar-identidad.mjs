#!/usr/bin/env node
// Los commits de este repo se firman con herramientasubits@ubits.co (24 sep, Cristian): el proyecto de Vercel vive en la
// cuenta de herramientas de UBITS y solo publica los commits cuyo autor es de esa cuenta. Un commit firmado con otro
// correo llega a Bitbucket, pero Vercel no lo recibe, y nada lo dice hasta que alguien busca el enlace y no está.
//
// Dos momentos:
//   · Al abrir la sesión (sin entrada): si el correo de git de este repo es otro, lo avisa con el comando para
//     arreglarlo. Si está bien, no imprime nada.
//   · Antes de un comando de terminal (PreToolUse · Bash): si el comando hace un commit con otro correo —el del repo o
//     uno puesto con --author—, lo bloquea y dice por qué.
//
// Solo lee la configuración de git; no la cambia. Cambiar la identidad de otra persona sin que lo sepa no le toca a un
// gancho.

import { spawnSync } from 'node:child_process'
import { leerEntrada } from './reglas.mjs'

export const CORREO = 'herramientasubits@ubits.co'

const correoActual = () => spawnSync('git', ['config', 'user.email'], { encoding: 'utf8' }).stdout.trim()
const ARREGLO = `git config user.email ${CORREO}`

const entrada = process.stdin.isTTY ? {} : await leerEntrada()
const comando = entrada.tool_input?.command

if (typeof comando !== 'string') {
  // Inicio de sesión: aviso como contexto, en español y con el comando listo para copiar.
  const actual = correoActual()
  if (actual !== CORREO) {
    console.log(
      `Los commits de playground-ux se firman con ${CORREO} para que Vercel los publique, y el correo de git de este repo es ${actual || 'ninguno'}. ` +
        `Antes de hacer un commit, corre \`${ARREGLO}\` (solo cambia este repo; el nombre se queda como está).`,
    )
  }
  process.exit(0)
}

// Solo interesan los commits (también «git -c … commit»); un «git commit» dentro de un texto entre comillas no cuenta.
const hayCommit = /(^|[;&|]\s*|\s)git(\s+-c\s+\S+)*\s+commit\b/.test(comando.replace(/(['"])(?:\\.|(?!\1).)*\1/g, '""'))
if (!hayCommit) process.exit(0)

const autor = comando.match(/--author[=\s]+(['"])?[^<'"]*<([^>]+)>/)?.[2]
const correo = autor ?? correoActual()
if (correo === CORREO) process.exit(0)

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason:
        `Commit bloqueado: se firmaría con ${correo || 'ningún correo'} y en este repo todo se firma con ${CORREO}, ` +
        `que es la cuenta de Vercel; con otro correo Vercel no recibe el commit. ` +
        (autor ? `Quita el --author o pon ${CORREO}.` : `Corre \`${ARREGLO}\` y vuelve a intentarlo.`),
    },
  }),
)
