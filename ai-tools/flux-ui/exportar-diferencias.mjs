#!/usr/bin/env node
// Arma el documento para el dev que mantiene @ubits/flux-ui a partir de ai-tools/flux-ui/diferencias.json: una sección
// por pieza con qué hace hoy, qué esperamos, qué se pide y cómo reproducirlo. Es el mismo documento que descarga el
// botón de /design-system/componentes/dev (las dos salidas usan src/modules/design-system/diferencias/markdown.ts).
//
//   node ai-tools/flux-ui/exportar-diferencias.mjs            → ai-tools/flux-ui/diferencias-para-libreria.md
//   node ai-tools/flux-ui/exportar-diferencias.mjs --salida=x → otro archivo
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { aMarkdown } from '../../src/modules/design-system/diferencias/markdown.ts'

const aqui = path.dirname(fileURLToPath(import.meta.url))
const datos = JSON.parse(fs.readFileSync(path.join(aqui, 'diferencias.json'), 'utf8'))
const opcion = process.argv.find((a) => a.startsWith('--salida='))
const salida = opcion ? path.resolve(opcion.slice('--salida='.length)) : path.join(aqui, 'diferencias-para-libreria.md')
fs.writeFileSync(salida, aMarkdown(datos) + '\n')
console.log(`${datos.entradas.length} diferencias → ${path.relative(process.cwd(), salida)}`)
