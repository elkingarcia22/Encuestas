/**
 * Los estados de cumplimiento con los que el simulador de la tarjeta de objetivo dice a qué estado cae un % de
 * ejemplo («Cumplido», «En progreso»…).
 *
 * En el prototipo vivían en `objetivosConfigStore.ts`, la configuración global del módulo, que el constructor solo
 * leía. Aquí no hay configuración del módulo todavía, así que se trae la lista por defecto tal cual, sin «Restó
 * (Negativo)»: ese estado solo existe cuando la configuración permite resultados negativos, y por defecto no lo
 * permite (`DEFAULT_ALLOW_NEGATIVE_RESULTS = false`). El orden importa: gana el primero cuyo rango contiene el %.
 */

export type ComplianceStateTone = 'neutral' | 'negative' | 'warning' | 'info' | 'positive'

export interface ComplianceState {
  id: string
  name: string
  min: number
  max: number
  tone: ComplianceStateTone
}

export const ALLOW_NEGATIVE_RESULTS = false

export const DEFAULT_COMPLIANCE_STATES: readonly ComplianceState[] = [
  { id: 'por-iniciar', name: 'Por iniciar', min: 0, max: 0, tone: 'neutral' },
  { id: 'no-cumplio', name: 'No cumplió', min: 0, max: 39, tone: 'negative' },
  { id: 'no-cumplio-parcialmente', name: 'No cumplió parcialmente', min: 40, max: 69, tone: 'warning' },
  { id: 'en-progreso', name: 'En progreso', min: 1, max: 99, tone: 'warning' },
  { id: 'cumplio-parcialmente', name: 'Cumplió parcialmente', min: 70, max: 99, tone: 'info' },
  { id: 'cumplido', name: 'Cumplido', min: 100, max: 100, tone: 'positive' },
  { id: 'sobrecumplio', name: 'Sobrecumplió', min: 101, max: 150, tone: 'positive' },
]

/** El estado en el que cae un porcentaje ya redondeado, o null si ninguno lo cubre. */
export function findComplianceState(percent: number, states: readonly ComplianceState[] = DEFAULT_COMPLIANCE_STATES): ComplianceState | null {
  return states.find((state) => percent >= state.min && percent <= state.max) ?? null
}
