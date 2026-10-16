import type { CicloDraft } from '../../../modelo/constructor/cicloBuilderTypes'
import type { ObjectiveModelRules } from '../../../modelo/constructor/objectiveModel'

// Las preguntas de la metodología que no son del borrador sino de la conversación: si ya se contestó el norte, los
// recordatorios y su frecuencia. Una tarjeta ya marcada no distingue «todavía no se preguntó» de «ya contestó», así que
// el paso lleva la cuenta aparte.

/** Lo que ya se contestó en este bloque. Vive en el paso y no aquí: el bloque se desmonta al plegarse. */
export interface Contestadas {
  norte: boolean
  recordatorios: boolean
  frecuencia: boolean
}

/** El norte que deja un modelo: apagado u obligatorio lo decide el modelo; opcional, lo que el autor ya tenía. */
export const norteSegun = (reglas: ObjectiveModelRules, actual: boolean | null, contestado: boolean) => (reglas.companyObjectives === 'off' ? false : reglas.companyObjectives === 'required' ? true : contestado ? actual : null)

export const preguntaNortePendiente = (borrador: CicloDraft, contestadas: Contestadas) => borrador.objectiveModel !== null && borrador.modelRules.companyObjectives === 'optional' && !contestadas.norte
export const preguntaRecordatoriosPendiente = (borrador: CicloDraft, contestadas: Contestadas) => borrador.objectiveModel !== null && (!contestadas.recordatorios || (borrador.remindersEnabled && !contestadas.frecuencia))

