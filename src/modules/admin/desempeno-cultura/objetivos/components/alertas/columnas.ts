import type { Prioridad } from '../../modelo/alertas'

// Las prioridades del panel «Para atender»: alta, media y baja, con los mismos colores que en Encuestas (alta con
// contorno rojo, media en amarillo claro y baja en azul claro). La baja es lo que no urge pero alguien tiene que
// hacer: un borrador por terminar o un ciclo que cierra y hay que revisar.

export type Grupo = { grupo: Prioridad; titulo: string; insignia: 'destructive-outline' | 'warning-light' | 'info-light'; resumen: string }

export const GRUPOS: readonly Grupo[] = [
  { grupo: 'alta', titulo: 'Alta', insignia: 'destructive-outline', resumen: 'Avance bajo a pocos días del cierre' },
  { grupo: 'media', titulo: 'Media', insignia: 'warning-light', resumen: 'Avance por debajo de lo esperado y personas sin reportar' },
  { grupo: 'baja', titulo: 'Baja', insignia: 'info-light', resumen: 'Borradores por terminar y ciclos que cierran pronto' },
]

export const grupoDe = (prioridad: Prioridad): Grupo => GRUPOS.find((opcion) => opcion.grupo === prioridad) ?? GRUPOS[1]
