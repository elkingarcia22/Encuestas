import { useEffect, useRef, useState, type RefObject } from 'react'

// La tarjeta del tour del pie de la barra lateral se oculta sola cuando el menú ya no cabe con ella (Elkin, 20-oct): al
// abrir una sección larga, o en una pantalla baja, dejaba el menú cortado y con scroll detrás de la tarjeta. Vuelve sola
// cuando hay sitio otra vez. No es cerrarla: la X sigue siendo lo único que la quita de verdad.
//
// Para no parpadear (ocultarla da sitio y entonces «cabría»), mientras está oculta solo vuelve si el menú cabe con el
// alto que ocupaba la tarjeta.

/** El aire entre la tarjeta y «Enviar feedback», que también se libera al ocultarla. */
const AIRE = 10

export function useCabeTarjeta(menu: RefObject<HTMLElement | null>, tarjeta: RefObject<HTMLElement | null>, activa: boolean): boolean {
  const [cabe, setCabe] = useState(true)
  const alto = useRef(0)

  useEffect(() => {
    const contenedor = menu.current
    if (!activa || !contenedor) return
    const medir = () => {
      if (tarjeta.current) alto.current = tarjeta.current.offsetHeight + AIRE
      const sobra = contenedor.clientHeight - contenedor.scrollHeight
      setCabe((visible) => (visible ? sobra >= 0 : sobra >= alto.current))
    }
    // El menú cambia de alto al abrir o cerrar una sección (sus hijos) y la barra, al cambiar la ventana (el contenedor).
    const observador = new ResizeObserver(medir)
    const observarHijos = () => {
      observador.disconnect()
      observador.observe(contenedor)
      Array.from(contenedor.children).forEach((hijo) => observador.observe(hijo))
    }
    observarHijos()
    const cambios = new MutationObserver(() => {
      observarHijos()
      medir()
    })
    cambios.observe(contenedor, { childList: true })
    medir()
    return () => {
      observador.disconnect()
      cambios.disconnect()
    }
  }, [menu, tarjeta, activa])

  return cabe
}
