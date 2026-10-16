import type { Objective } from '../../../modelo/constructor/cicloBuilderTypes'

/**
 * Lo que se le pide al agente de IA acoplado («Crear objetivos con IA»): para qué nivel, para quién y qué hacer con lo
 * que proponga. El agente no sabe dónde viven los objetivos —en el borrador (empresa) o en el panel de una asignación
 * que todavía no se guarda—, así que quien lo abre le pasa cómo meter, quitar o conservar la tanda. Una tanda nueva
 * reemplaza a la anterior: quien pide lleva la cuenta de qué ids son de la propuesta.
 */
export interface PedidoIa {
  alcance: 'empresa' | 'grupo' | 'individual'
  /** Para quién son, en palabras: «Marketing», «Laura Méndez», «3 grupos». Sin él, «el grupo» o «la persona». */
  audiencia?: string
  /** Cuántos objetivos hay ya en el destino: el agente no propone más de 10 entre todos. */
  existentes: number
  /** Solo asignados: el peso libre del set, que se reparte entre las propuestas. */
  pesoLibre?: number
  /** Mete la tanda propuesta (reemplaza la anterior si la había). */
  onAplicar: (objetivos: Objective[]) => void
  /** Quita la tanda propuesta. */
  onDescartar: () => void
  /** Se queda con la tanda: deja de ser propuesta. */
  onConservar: () => void
}
