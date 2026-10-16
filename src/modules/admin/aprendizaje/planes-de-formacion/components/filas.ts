import type { MouseEvent } from 'react'

// Como en UBITS, toda la fila responde al clic, no solo el nombre o la casilla. DataGridList no avisa del clic en una
// fila, así que el contenedor de la tabla se lo pasa al control principal de esa fila: su casilla, o su enlace (el
// primer botón, que es el nombre). Lo demás que se toque dentro de la fila (menú ⋯, otro botón) sigue haciendo lo suyo.
const INTERACTIVOS = 'button, a, input, [role="checkbox"], [role="menu"]'
const alTocar = (selector: string) => (evento: MouseEvent<HTMLElement>) => {
  const tocado = evento.target as HTMLElement
  if (tocado.closest(INTERACTIVOS)) return
  tocado.closest('tbody tr')?.querySelector<HTMLElement>(selector)?.click()
}

export const marcarAlTocarFila = alTocar('[role="checkbox"]')
export const abrirAlTocarFila = alTocar('td button:not([role="checkbox"])')

// Cuando la fila no tiene un enlace que tocar (la persona va con la pieza Persona del sistema, que es texto), la celda
// marca su fila con `data-fila` y el contenedor le pasa ese id a quien abre.
export const abrirFilaConId = (abrir: (id: string) => void) => (evento: MouseEvent<HTMLElement>) => {
  const tocado = evento.target as HTMLElement
  if (tocado.closest(INTERACTIVOS)) return
  const id = tocado.closest('tbody tr')?.querySelector<HTMLElement>('[data-fila]')?.dataset.fila
  if (id) abrir(id)
}
// Para el contenedor: el cursor dice que la fila se puede tocar.
export const FILAS_CLICABLES = '[&_tbody_tr]:cursor-pointer'
