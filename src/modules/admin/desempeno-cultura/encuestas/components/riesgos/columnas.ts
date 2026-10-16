import type { RiskGroup } from '../../modelo/riesgos'

// Las prioridades del panel de riesgos: alta, media y baja. La baja es lo de acción manual (borradores por terminar,
// encuestas que abren pronto, respuestas atrasadas, comentarios por revisar): no es urgente, pero alguien tiene que
// hacerlo (Elkin, 13-oct: «una alta, una media y otra baja»). Cada caso lleva su prioridad en una insignia, con los
// colores de los estados de Data grid: alta con contorno rojo, media en amarillo claro y baja en azul claro.

export type Grupo = { grupo: RiskGroup; titulo: string; insignia: 'destructive-outline' | 'warning-light' | 'info-light'; resumen: string }

export const GRUPOS: readonly Grupo[] = [
  { grupo: 'critico', titulo: 'Alta', insignia: 'destructive-outline', resumen: 'NOM 035, resultados negativos y metas perdidas' },
  { grupo: 'atencion', titulo: 'Media', insignia: 'warning-light', resumen: 'Brechas entre áreas, anonimato y metas en riesgo' },
  { grupo: 'manual', titulo: 'Baja', insignia: 'info-light', resumen: 'Borradores por terminar, encuestas que abren pronto y respuestas atrasadas' },
]

export const grupoDe = (grupo: RiskGroup): Grupo => GRUPOS.find((opcion) => opcion.grupo === grupo) ?? GRUPOS[1]

/** Lo que entra al panel: alta, media y baja. */
export const esRiesgo = (grupo: RiskGroup) => GRUPOS.some((opcion) => opcion.grupo === grupo)
