// Ref para un cuerpo con scroll propio (drawers y modales): si el contenido no cabe, el cuerpo se vuelve enfocable
// (tabIndex 0) para poder recorrerlo con las flechas del teclado aunque no tenga nada enfocable adentro. Si cabe, no
// agrega una parada de Tab de más. Se recalcula al cambiar el tamaño o el contenido.
export function scrollFocus(element: HTMLElement | null) {
  if (!element) return
  const update = () => {
    if (element.scrollHeight > element.clientHeight + 1) element.tabIndex = 0
    else element.removeAttribute('tabindex')
  }
  const resize = new ResizeObserver(update)
  resize.observe(element)
  const mutation = new MutationObserver(update)
  mutation.observe(element, { childList: true, subtree: true })
  update()
  return () => {
    resize.disconnect()
    mutation.disconnect()
  }
}
