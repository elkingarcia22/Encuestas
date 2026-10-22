import { useRef } from 'react'

// Al encender un interruptor que despliega algo (los recordatorios, una descripción, los límites del objetivo), lo que
// aparece puede quedar debajo de la barra fija de abajo y parece que no pasó nada (Elkin, 20-oct). `mostrar()` se llama
// al encenderlo: en cuanto lo nuevo se pinta, la pantalla baja lo justo para que se vea. Solo responde a quien lo enciende:
// al abrir un ciclo que ya trae algo encendido no se mueve nada. Lo que se muestra lleva la clase MARGEN_BARRA, para que
// no quede tapado por la barra de abajo ni por la cabecera.

export const MARGEN_BARRA = 'scroll-mt-24 scroll-mb-32'

export function useMostrarAlAbrir<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)
  const mostrar = () => {
    // Dos cuadros: uno para que React pinte lo nuevo y otro para que el navegador le dé su alto.
    requestAnimationFrame(() => requestAnimationFrame(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })))
  }
  return [ref, mostrar] as const
}
