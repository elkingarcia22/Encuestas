import { useSyncExternalStore } from 'react'

// Lo que necesitan el tablero y el expediente para acoplar el agente contextual a la derecha.

// Ancho del agente acoplado (ContextPanel: 452 px; desde el 22 sep ya no se amplía); la ficha se corre esa distancia.
export const ANCHO_AGENTE = '28.25rem'

// El agente se acopla solo en pantallas grandes (como el panel de actividad de Suite AI).
const PANTALLA_GRANDE = '(min-width: 64rem)'
export function usePantallaGrande() {
  return useSyncExternalStore(
    (avisar) => {
      const consulta = window.matchMedia(PANTALLA_GRANDE)
      consulta.addEventListener('change', avisar)
      return () => consulta.removeEventListener('change', avisar)
    },
    () => window.matchMedia(PANTALLA_GRANDE).matches,
  )
}

// Hueco del marco general para Orbit: debajo del header, a la derecha del contenido (ver RootLayout; desde el 8 oct
// el header no se acorta al abrirlo). React vuelve a leerlo tras montar, así que aparece aunque el marco y la pantalla
// se monten a la vez.
const sinSuscripcion = () => () => {}
export function useHuecoDerecho() {
  return useSyncExternalStore(sinSuscripcion, () => document.getElementById('agent-panel-slot'))
}
