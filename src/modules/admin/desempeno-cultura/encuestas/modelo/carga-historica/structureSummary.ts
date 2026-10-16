/**
 * Cifras y agrupaciones del paso «Estructura» (el resumen antes de cargar), sin React. Sale de
 * `StructureSummaryStep` del prototipo: la interfaz solo pinta lo que devuelve esto.
 */
import { buildQuestionGroups, classifyQuestions, splitRecognized, type ClassifiedQuestion, type QuestionGroup } from './questionGroups'
import type { DetectedParticipant, DetectedSurveyAnalysis, SectionDetail } from './types'
import { linkedUsernames, splitParticipantsByMatch, type ParticipantResolutions } from './visibility'

/** Tono semántico del grupo de participantes; la interfaz lo traduce a sus colores. */
export type ParticipantGroupTone = 'positive' | 'warning' | 'neutral'

export interface ParticipantGroup {
  value: 'participantes-match' | 'participantes-posibles' | 'participantes-nuevos'
  title: string
  tone: ParticipantGroupTone
  note: string
  people: DetectedParticipant[]
}

export interface StructureSummary {
  responded: number | null
  notResponded: number | null
  /** «88.2%», o el número de respuestas si no hay tasa, o «N/D». */
  participationHeadline: string
  /** Favorabilidad neta = % positivos − % negativos. */
  favorabilityNet: number | null
  /** eNPS = % promotores − % detractores, del mismo desglose que se muestra. */
  enpsScore: number | null
  /** El eNPS con «*» cuando es aproximado, o «N/D». */
  enpsHeadline: string
  sectionDetails: SectionDetail[]
  /** Null cuando los archivos no traían participantes individuales. */
  participantGroups: ParticipantGroup[] | null
  /** Usuarios de UBITS ya vinculados: el buscador no deja asociar uno a dos participantes. */
  takenUsernames: Set<string>
  recognizedQuestions: ClassifiedQuestion[]
  unrecognizedQuestions: ClassifiedQuestion[]
  questionGroups: QuestionGroup[]
}

const PARTICIPANT_GROUP_COPY: Record<ParticipantGroup['value'], Omit<ParticipantGroup, 'value' | 'people'>> = {
  'participantes-match': {
    title: 'Hacen match con UBITS',
    tone: 'positive',
    note: 'Su identificador coincide con el username o el correo de un usuario de UBITS, así que los vinculamos automáticamente. Sus respuestas suman a los reportes y segmentaciones de UBITS. Si alguno quedó mal vinculado, puedes corregirlo.',
  },
  'participantes-posibles': {
    title: 'Posibles match',
    tone: 'warning',
    note: 'Su identificador no coincide con el username ni con el correo de ningún usuario de UBITS, pero su nombre y apellido son idénticos a los de uno. No los vinculamos solos: decide si es el mismo usuario, si es otro, o si se crea sin usuario en la encuesta.',
  },
  'participantes-nuevos': {
    title: 'Sin match en UBITS',
    tone: 'neutral',
    note: 'Su identificador no coincide con el username ni con el correo de ningún usuario de UBITS, y tampoco hay un nombre igual, así que se crean como participantes solo de esta encuesta. Si sabes a qué usuario corresponden, usa "Asociar usuario".',
  },
}

const roundOne = (value: number): number => Math.round(value * 10) / 10

function participantGroupsFor(analysis: DetectedSurveyAnalysis, resolutions: ParticipantResolutions): ParticipantGroup[] | null {
  if (!analysis.participants) return null
  const split = splitParticipantsByMatch(analysis.participants.participants, resolutions)
  const people: Record<ParticipantGroup['value'], DetectedParticipant[]> = {
    'participantes-match': split.matched,
    'participantes-posibles': split.possible,
    'participantes-nuevos': split.unmatched,
  }
  return (Object.keys(PARTICIPANT_GROUP_COPY) as ParticipantGroup['value'][]).map((value) => ({ value, ...PARTICIPANT_GROUP_COPY[value], people: people[value] }))
}

/** Everything the structure summary shows, honoring the participant decisions already taken. */
export function buildStructureSummary(analysis: DetectedSurveyAnalysis, resolutions: ParticipantResolutions = {}): StructureSummary {
  const responded = analysis.totalRespondents
  const favorability = analysis.favorabilityBreakdown
  const nps = analysis.npsBreakdown
  const enpsScore = nps ? roundOne(nps.promotores - nps.detractores) : analysis.enps
  const { recognized, unrecognized } = splitRecognized(classifyQuestions(analysis))
  const sectionDetails = analysis.sectionDetails.length > 0 ? analysis.sectionDetails : analysis.sections.map((name) => ({ name, questionCount: 0 }))

  return {
    responded,
    notResponded: analysis.totalInvited != null && responded != null ? Math.max(0, analysis.totalInvited - responded) : null,
    participationHeadline: analysis.participationRate != null ? `${analysis.participationRate}%` : responded != null ? String(responded) : 'N/D',
    favorabilityNet: favorability ? roundOne(favorability.favorable - favorability.desfavorable) : null,
    enpsScore,
    enpsHeadline: enpsScore != null ? `${enpsScore}${analysis.enpsIsApproximate ? '*' : ''}` : 'N/D',
    sectionDetails,
    participantGroups: participantGroupsFor(analysis, resolutions),
    takenUsernames: linkedUsernames(analysis.participants?.participants ?? [], resolutions),
    recognizedQuestions: recognized,
    unrecognizedQuestions: unrecognized,
    questionGroups: buildQuestionGroups(
      recognized,
      sectionDetails.map((section) => section.name),
    ),
  }
}
