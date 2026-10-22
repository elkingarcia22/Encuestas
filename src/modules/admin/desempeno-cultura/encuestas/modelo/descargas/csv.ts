import { fileStamp, saveBlob, slugify } from './libro'

// Un CSV con lo que muestra la pantalla (13-oct, I-012): las descargas de Encuestas bajan un archivo de verdad en vez de
// avisar que descargaron. Separado por comas y con BOM, para que Excel abra bien las tildes; sale con la fecha de hoy.

const celda = (valor: string | number) => {
  const texto = String(valor)
  return /[",\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

export function descargarCsv(nombre: string, filas: readonly (readonly (string | number)[])[]) {
  const csv = filas.map((fila) => fila.map(celda).join(',')).join('\n')
  saveBlob(`${slugify(nombre)}-${fileStamp()}.csv`, 'text/csv;charset=utf-8', `﻿${csv}`)
}
