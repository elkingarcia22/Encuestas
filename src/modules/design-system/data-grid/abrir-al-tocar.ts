import type { MouseEvent } from 'react'

// ── Toda la fila abre ──
// Tocar cualquier parte de la fila abre su detalle, salvo lo que ya hace algo (la casilla, un enlace, el «⋯») o si se
// estaba seleccionando texto para copiarlo. El nombre sigue siendo un enlace o un botón: con el teclado se llega con Tab.
export const abrirAlTocar = (abrir: () => void) => (evento: MouseEvent) => {
  const destino = evento.target as HTMLElement
  if (destino.closest('a, button, input, label, [role="checkbox"], [role="menuitem"], [aria-haspopup]')) return
  if (window.getSelection()?.toString()) return
  abrir()
}
