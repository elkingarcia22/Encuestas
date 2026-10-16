import type { IconSvgElement } from '@hugeicons/react'
import { Comment01Icon, File01Icon, Pdf01Icon, Table01Icon, UserAccountIcon, Xls01Icon } from '@hugeicons/core-free-icons'
import type { Nom035Variant } from '../nom035'
import type { Sentiment } from '../questionResponses'
import type { SegmentFilter } from '../surveyResults'

/**
 * Every report the download center can produce.
 *
 * Las cinco primeras son las de una medición de clima o cultura. Las de la NOM
 * 035 van aparte y no se mezclan con ellas: la norma no produce favorabilidad
 * ni eNPS, produce niveles de riesgo y —en la Guía I— una lista de personas a
 * canalizar, así que un "Reporte general" con las secciones de siempre saldría
 * lleno de cifras que ahí no significan nada.
 */
export type ReportKind = 'pdf' | 'xlsx' | 'comments' | 'questions-csv' | 'answers-csv' | Nom035ReportKind

/** Los reportes de la NOM 035, tres por la Guía III y dos por la Guía I. */
export type Nom035ReportKind = 'nom035-xlsx' | 'nom035-pdf' | 'nom035-individual' | 'nom035-letters' | 'nom035-cases'

/**
 * Quien avala la aplicación e interpretación de la NOM 035.
 *
 * La norma exige que el reporte lleve nombre: no es un dato decorativo de la
 * portada, es la persona responsable ante una inspección. Por eso viaja con la
 * solicitud y se imprime en la portada y al cierre del PDF.
 */
export interface Nom035Responsible {
  name: string
  /** Cédula profesional o identificación con la que firma. */
  id: string
}

/**
 * Las secciones del reporte general, en el orden en que se imprimen.
 *
 * El orden es fijo — responde la secuencia de preguntas que se hace quien lee —
 * pero cada sección se puede apagar. Lo que no cambia es la numeración relativa:
 * las que sobreviven se renumeran, así que un reporte de siete secciones nunca
 * salta del 3 al 5.
 *
 * El documento alterna dos clases de sección. Las generales — verificación,
 * favorabilidad por secciones, análisis IA — son la lectura de la encuesta
 * completa y salen iguales para todo lector: es contra ellas que se leen los
 * cortes. Las configurables despliegan los demográficos que el lector eligió, y
 * cada una elige los suyos: el comité de gente corta por área y el de operación
 * por sede sin pelearse por un único selector.
 */
export type PdfSectionId = 'verification' | 'participation' | 'sections' | 'heatmap' | 'questions' | 'nps' | 'gaps' | 'ai'

/** Los bloques que despliegan demográficos, cada uno con su propia selección. */
export type PdfSegmentSlot = 'participation' | 'heatmap' | 'nps' | 'gaps'

export interface PdfSectionDefinition {
  id: PdfSectionId
  label: string
  description: string
  /** El bloque abre un multi-select de demográficos con esta llave. */
  segmentSlot?: PdfSegmentSlot
  /** El bloque abre un multi-select de secciones de la encuesta. */
  picksSections?: boolean
  /** Rótulo sobre el selector, cuando el bloque tiene uno. */
  pickerLabel?: string
  /**
   * Qué pasa si el lector deja el selector vacío. No es el mismo destino para
   * todos: participación y eNPS conservan su lectura general, mientras que
   * heatmap y brechas no existen sin un corte, así que el panel tiene que decir
   * cuál de los dos es antes de que el lector descargue.
   */
  pickerEmptyHint?: string
  needsSegments?: boolean
  needsNps?: boolean
}

export const PDF_SECTIONS: readonly PdfSectionDefinition[] = [
  {
    id: 'verification',
    label: 'Verificación de la medición',
    description: 'Si la medición se sostiene, en cuatro cifras',
  },
  {
    id: 'participation',
    label: 'Participación',
    description: 'Cobertura general y por demográfico',
    segmentSlot: 'participation',
    pickerLabel: 'Desglosar por',
    pickerEmptyHint: 'Sin demográficos solo se imprime la cobertura general.',
  },
  {
    id: 'sections',
    label: 'Favorabilidad por secciones',
    description: 'Cada sección y subsección con su porcentaje',
  },
  {
    id: 'heatmap',
    label: 'Heatmap por demográficos',
    description: 'La grilla de la herramienta, por demográfico',
    segmentSlot: 'heatmap',
    pickerLabel: 'Una grilla por cada',
    pickerEmptyHint: 'Elige al menos un demográfico o este bloque no se imprime.',
    needsSegments: true,
  },
  {
    id: 'questions',
    label: 'Detalle de preguntas',
    description: 'Pregunta por pregunta de las secciones que elijas',
    picksSections: true,
    pickerLabel: 'Secciones a incluir',
    pickerEmptyHint: 'Elige al menos una sección o este bloque no se imprime.',
  },
  {
    id: 'nps',
    label: 'eNPS',
    description: 'Puntaje y mezcla, por sección y demográfico',
    segmentSlot: 'nps',
    pickerLabel: 'Desglosar además por',
    pickerEmptyHint: 'Sin demográficos solo se imprime el puntaje y el desglose por secciones.',
    needsNps: true,
  },
  {
    id: 'gaps',
    label: 'Brechas entre grupos',
    description: 'Polarización y grupos rezagados',
    segmentSlot: 'gaps',
    pickerLabel: 'Buscar brechas por',
    pickerEmptyHint: 'Elige al menos un demográfico o este bloque no se imprime.',
    needsSegments: true,
  },
  {
    id: 'ai',
    label: 'Análisis de IA',
    description: 'Resumen, hallazgos, riesgos y recomendaciones',
  },
]

/**
 * Demográficos cuyos grupos son personas con nombre.
 *
 * Un PDF viaja por correo y no tiene control de acceso: desplegar resultados
 * por líder en un archivo expone a personas identificables en grupos pequeños.
 * El corte existe — vive en la herramienta y en el XLSX, con su umbral — pero no
 * viaja en el ejecutivo.
 */
export const PERSON_NAMED_SEGMENT_KEYS: readonly string[] = ['leader']

/**
 * La clave de catálogo detrás de la clave del segmento.
 *
 * Un demográfico del catálogo viaja con su clave tal cual ("area"); uno que la
 * plataforma construye contra el directorio — Líder, Colaborador — no tiene
 * entrada de catálogo y termina identificado por el id del campo
 * ("cultura-2026-dem-leader"). Ambos nombran lo mismo, así que la comparación
 * se hace sobre el último tramo.
 */
const catalogKeyOf = (key: string): string => key.split('-dem-').pop() ?? key

/** Los demográficos que el reporte ejecutivo puede leer y desplegar. */
export const reportableSegments = <T extends { key: string; perPerson: boolean }>(segments: readonly T[]): readonly T[] => segments.filter((segment) => !segment.perPerson && !PERSON_NAMED_SEGMENT_KEYS.includes(catalogKeyOf(segment.key)))

/**
 * Hojas que el libro "Resultados generales" puede incluir o dejar fuera.
 *
 * Las tres que terminan en `-by` no son una hoja sino una tanda: producen una
 * hoja por cada demográfico elegido. Están en la lista igual que las demás
 * porque para quien configura son lo mismo — contenido que entra o no entra —
 * y porque así el panel puede enumerarlas en el orden real de las pestañas.
 */
export type XlsxSheetId = 'summary' | 'demographics' | 'sections' | 'questions' | 'question-detail' | 'nps' | 'participation-by' | 'heatmap-by' | 'nps-by' | 'depth' | 'ai'

/** Las tandas del libro que se despliegan por demográfico. */
export type XlsxSegmentSlot = 'participation' | 'heatmap' | 'nps'

export interface XlsxSheetDefinition {
  id: XlsxSheetId
  label: string
  description: string
  /** La hoja abre un multi-select de demográficos con esta llave. */
  segmentSlot?: XlsxSegmentSlot
  /** Rótulo sobre el selector, cuando la hoja tiene uno. */
  pickerLabel?: string
  /** Qué pasa si el lector deja el selector vacío. */
  pickerEmptyHint?: string
  /** Sheets that only make sense when the survey collected demographics. */
  needsSegments?: boolean
  /** Sheets that only make sense when the survey asked an NPS question. */
  needsNps?: boolean
  /** Sheets that only make sense when some question asks a follow-up. */
  needsDepth?: boolean
}

export const XLSX_SHEETS: readonly XlsxSheetDefinition[] = [
  {
    id: 'summary',
    label: 'Resumen',
    description: 'Indicadores, lectura ejecutiva y prioridades',
  },
  {
    id: 'demographics',
    label: 'Demográficos',
    description: 'Los demográficos usados, con su participación',
    needsSegments: true,
  },
  { id: 'sections', label: 'Secciones', description: 'Puntaje y favorabilidad de cada sección' },
  { id: 'questions', label: 'Preguntas', description: 'Una fila por pregunta con su distribución 1 a 5' },
  {
    id: 'question-detail',
    label: 'Detalle de preguntas',
    description: 'Conteo y porcentaje de cada opción',
  },
  { id: 'nps', label: 'eNPS', description: 'Puntaje, mezcla y detalle por dimensión y pregunta', needsNps: true },
  {
    id: 'participation-by',
    label: 'Participación por demográficos',
    description: 'Participación de cada demográfico elegido',
    segmentSlot: 'participation',
    pickerLabel: 'Una hoja por cada',
    pickerEmptyHint: 'Elige al menos un demográfico o estas hojas no se generan.',
    needsSegments: true,
  },
  {
    id: 'heatmap-by',
    label: 'Heatmaps por demográficos',
    description: 'Una hoja de heatmap por cada demográfico elegido',
    segmentSlot: 'heatmap',
    pickerLabel: 'Una hoja por cada',
    pickerEmptyHint: 'Elige al menos un demográfico o estas hojas no se generan.',
    needsSegments: true,
  },
  {
    id: 'nps-by',
    label: 'eNPS por demográficos',
    description: 'Una hoja de eNPS por cada demográfico elegido',
    segmentSlot: 'nps',
    pickerLabel: 'Una hoja por cada',
    pickerEmptyHint: 'Elige al menos un demográfico o estas hojas no se generan.',
    needsSegments: true,
    needsNps: true,
  },
  {
    id: 'depth',
    label: 'Preguntas de profundidad',
    description: 'Respuestas abiertas de cada banda',
    needsDepth: true,
  },
  { id: 'ai', label: 'Análisis IA', description: 'Resumen, hallazgos, riesgos y acciones sugeridas' },
]

/**
 * Everything a "Descargar" click carries: what to produce and how the reader
 * configured it. Kinds ignore the knobs that don't apply to them — a CSV of
 * preguntas has nothing demographic to break down.
 */
export interface ReportRequest {
  kind: ReportKind
  /** XLSX: demographics to expand into "Participación por …" sheets. */
  participationSegments: readonly string[]
  /** XLSX: demographics to expand into "Heatmap por …" sheets. */
  heatmapSegments: readonly string[]
  /** XLSX: demographics to expand into "eNPS por …" sheets. */
  npsSegments: readonly string[]
  /** XLSX: which sheets print, in `XLSX_SHEETS` order. */
  xlsxSheets: readonly XlsxSheetId[]
  /** PDF: las secciones que se imprimen, en el orden de `PDF_SECTIONS`. */
  pdfSections: readonly PdfSectionId[]
  /**
   * PDF: los demográficos que despliega cada bloque configurable.
   *
   * Uno por bloque y no uno global: participación se lee por la unidad que
   * convoca — sede, contrato — y el heatmap por la unidad donde se actúa, y
   * obligarlas al mismo corte convierte una de las dos en relleno.
   */
  pdfSegments: Readonly<Record<PdfSegmentSlot, readonly string[]>>
  /**
   * PDF: las secciones de la encuesta cuyo detalle de preguntas se imprime.
   * Vacío significa ninguna, y entonces el bloque no sale: el panel arranca con
   * todas marcadas, así que llegar aquí sin ninguna es una decisión del lector.
   */
  pdfQuestionSections: readonly string[]
  /** Comentarios: which sentiments make it into the file. All three = todos. */
  commentSentiments: readonly Sentiment[]
  /**
   * Comentarios: the themes that make it into the file. Empty means every
   * theme — a survey can pick up a new one between measurements, and a report
   * that silently dropped it would be worse than one that grew a row.
   */
  commentTopics: readonly string[]
  /**
   * Narrow the population to one or more values of a single demographic —
   * every entry shares the same `key`. Empty means everyone.
   */
  filters: readonly SegmentFilter[]
  /**
   * NOM 035: quien avala el reporte, o null si el lector no lo declaró.
   *
   * Es opcional en el panel y obligatorio en cuanto se enciende: un bloque de
   * responsable a medio llenar en un documento que se entrega a una inspección
   * es peor que no tenerlo.
   */
  responsible: Nom035Responsible | null
  /**
   * NOM 035: los colaboradores cuyo reporte individual se imprime. Uno por
   * página; vacío no produce documento.
   */
  individualIds: readonly string[]
}

export interface ReportTypeDefinition {
  kind: ReportKind
  title: string
  description: string
  /** Short format chip and the word the footer CTA uses: "Descargar PDF". */
  format: 'PDF' | 'XLSX'
  icon: IconSvgElement
  /** Slug the generated file name starts with. */
  fileSlug: string
  /**
   * Rótulo del botón del pie, cuando "Descargar PDF" no describe lo que pasa:
   * el reporte general de la NOM 035 abre un visor antes de imprimir y las
   * cartas de canalización salen en tanda.
   */
  ctaLabel?: string
  /** Rough size of the simulated preparation, in milliseconds. */
  prepareMs: number
}

export const REPORT_TYPES: readonly ReportTypeDefinition[] = [
  {
    kind: 'pdf',
    title: 'Reporte general (PDF)',
    description: 'Visual: favorabilidad, heatmaps, eNPS e IA',
    format: 'PDF',
    icon: Pdf01Icon,
    fileSlug: 'reporte-general',
    prepareMs: 7000,
  },
  {
    kind: 'xlsx',
    title: 'Resultados generales (XLSX)',
    description: 'Todos los datos: secciones, preguntas e IA',
    format: 'XLSX',
    icon: Xls01Icon,
    fileSlug: 'resultados-generales',
    prepareMs: 5500,
  },
  {
    kind: 'comments',
    title: 'Comentarios (XLSX)',
    description: 'Respuestas abiertas con tema y sentimiento',
    format: 'XLSX',
    icon: Comment01Icon,
    fileSlug: 'comentarios',
    prepareMs: 3000,
  },
  {
    kind: 'questions-csv',
    title: 'Preguntas (XLSX)',
    description: 'Una hoja por pregunta con sus respuestas',
    format: 'XLSX',
    icon: Table01Icon,
    fileSlug: 'preguntas',
    prepareMs: 2500,
  },
  {
    kind: 'answers-csv',
    title: 'Respuestas (XLSX)',
    description: 'Una fila por participante con todo lo que respondió',
    format: 'XLSX',
    icon: File01Icon,
    fileSlug: 'respuestas',
    prepareMs: 4000,
  },
]

/**
 * Los reportes de la Guía de Referencia III — riesgo psicosocial.
 *
 * El mismo trío del prototipo de la norma: el libro con toda la data, el
 * documento visual de la empresa, y el reporte que se le entrega a una persona
 * con su propio nivel de riesgo.
 */
export const NOM035_RIESGO_REPORT_TYPES: readonly ReportTypeDefinition[] = [
  {
    kind: 'nom035-xlsx',
    title: 'Resultados generales (XLSX)',
    description: 'Todos los resultados, en todos los niveles',
    format: 'XLSX',
    icon: Xls01Icon,
    fileSlug: 'resultados-riesgo-psicosocial-nom035',
    prepareMs: 5500,
    ctaLabel: 'Descargar XLSX',
  },
  {
    kind: 'nom035-pdf',
    title: 'Resultados generales (PDF)',
    description: 'Visual: gráficos, heatmaps y resultados',
    format: 'PDF',
    icon: Pdf01Icon,
    fileSlug: 'reporte-riesgo-psicosocial-nom035',
    prepareMs: 7000,
    ctaLabel: 'Ver y descargar PDF',
  },
  {
    kind: 'nom035-individual',
    title: 'Reporte individual (PDF)',
    description: 'Por colaborador: riesgo y dimensiones',
    format: 'PDF',
    icon: UserAccountIcon,
    fileSlug: 'reportes-individuales-nom035',
    prepareMs: 5000,
    ctaLabel: 'Descargar PDF individual',
  },
]

/**
 * Los reportes de la Guía de Referencia I — acontecimientos traumáticos.
 *
 * Esta medición no produce puntajes, produce casos: por eso su reporte principal
 * no es un documento de resultados sino la carta que cada persona canalizada
 * tiene que recibir y firmar.
 */
export const NOM035_ACONTECIMIENTOS_REPORT_TYPES: readonly ReportTypeDefinition[] = [
  {
    kind: 'nom035-letters',
    title: 'Cartas de canalización (PDF)',
    description: 'Una carta con firma por cada canalizado',
    format: 'PDF',
    icon: Pdf01Icon,
    fileSlug: 'cartas-canalizacion-nom035',
    prepareMs: 6000,
    ctaLabel: 'Ver y descargar PDF',
  },
  {
    kind: 'nom035-cases',
    title: 'Datos XLSX (Excel)',
    description: 'Lista de colaboradores con estado, área y líder',
    format: 'XLSX',
    icon: Xls01Icon,
    fileSlug: 'acontecimientos-traumaticos-nom035',
    prepareMs: 3500,
    ctaLabel: 'Descargar XLSX',
  },
]

/** El catálogo que le corresponde a cada guía de la norma. */
export const nom035ReportTypes = (variant: Nom035Variant): readonly ReportTypeDefinition[] => (variant === 'riesgo' ? NOM035_RIESGO_REPORT_TYPES : NOM035_ACONTECIMIENTOS_REPORT_TYPES)

const ALL_REPORT_TYPES: readonly ReportTypeDefinition[] = [...REPORT_TYPES, ...NOM035_RIESGO_REPORT_TYPES, ...NOM035_ACONTECIMIENTOS_REPORT_TYPES]

export const reportTypeFor = (kind: ReportKind): ReportTypeDefinition => ALL_REPORT_TYPES.find((candidate) => candidate.kind === kind) ?? REPORT_TYPES[0]

/**
 * What a report card promises, read off the survey rather than fixed in the
 * catalogue. Anonymity is a setting of the measurement, not a property of the
 * file: the same "Respuestas" export carries names on a public survey and a
 * numbered participant on an anonymous one, so the copy that promises either
 * has to follow the draft.
 */
export const reportDescriptionFor = (kind: ReportKind, isAnonymous: boolean): string => {
  if (kind === 'answers-csv') {
    return isAnonymous ? 'Una fila por participante, sin identidad' : 'Una fila por participante, con su identidad'
  }
  return reportTypeFor(kind).description
}

/** The long explanation the configuration panel shows for a report. */
export const reportDetailFor = (kind: ReportKind, isAnonymous: boolean): string => {
  if (kind === 'questions-csv') {
    return isAnonymous
      ? 'Una hoja por pregunta, sin identidad.'
      : 'Una hoja por pregunta, con quién respondió.'
  }
  return isAnonymous
    ? 'Una fila por persona, sin identidad.'
    : 'Una fila por persona, con su identidad.'
}

/** One entry of the "Descargas" list and the floating widget. */
export interface DownloadEntry {
  id: string
  kind: ReportKind
  fileName: string
  format: 'PDF' | 'XLSX'
  status: 'preparing' | 'ready'
  /** 0–100 while `preparing`; pinned at 100 once `ready`. */
  progress: number
  startedAt: number
  /**
   * True once the file actually reached the browser. Delivery is automatic when
   * the preparation ends, so this is normally `true` the moment `status` turns
   * `ready` — it only stays `false` when the browser refused the handoff (a
   * blocked popup for the PDF print view), which is what surfaces "Reintentar".
   */
  delivered: boolean
  /** Generates and hands the actual file to the browser. `false` when it failed. */
  deliver: () => boolean
  /** The configuration used to build the file, so it can be shown in details. */
  request: ReportRequest
}
