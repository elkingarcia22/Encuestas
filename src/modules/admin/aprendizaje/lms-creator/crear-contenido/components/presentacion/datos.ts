// Presentación interactiva: los datos que comparten el setup, el editor de diapositivas y el reproductor que muestra
// el asistente cuando la página ya está generada (HU-presentacion-interactiva).
//
// Aquí vive: el catálogo de los 32 tipos de diapositiva, los cuatro estilos, la paleta de color, el contenido de
// ejemplo de cada tipo (el «pool» del prototipo), las plantillas vacías, el borrador de estructura (outline) y la
// derivación del título. Todo es mock local: no hay IA real.

import { CLASES_COLOR_LIBRE, esColorLibre } from '../color-libre'
import type { IconSvgElement } from '@hugeicons/react'
import {
  BalanceScaleIcon,
  Bookmark01Icon,
  CardExchange01Icon,
  ChartIncreaseIcon,
  CheckListIcon,
  CheckmarkCircle02Icon,
  Cursor01Icon,
  DashboardSquare01Icon,
  Flag02Icon,
  FolderOpenIcon,
  GameController01Icon,
  GitBranchIcon,
  Heading01Icon,
  Idea01Icon,
  Image01Icon,
  Image02Icon,
  ImageCompositionIcon,
  Layers01Icon,
  LayoutTwoColumnIcon,
  LeftToRightListBulletIcon,
  LeftToRightListNumberIcon,
  Link01Icon,
  MapsLocation01Icon,
  MenuCollapseIcon,
  PencilEdit02Icon,
  Presentation01Icon,
  QuizIcon,
  QuoteDownIcon,
  Route01Icon,
  ShapesIcon,
  SlidersHorizontalIcon,
  SortByDown01Icon,
  Target02Icon,
  TaskDone01Icon,
  TextAlignLeftIcon,
} from '@hugeicons/core-free-icons'
import { DECKS_ONBOARDING } from './deck-onboarding'

// ── Tipos ────────────────────────────────────────────────────────────────────────────────────────────────────────

export type PosicionImagen = 'left' | 'right' | 'top' | 'bottom' | 'background'

export type ItemDiapositiva = {
  num?: string
  title?: string
  desc?: string
  targetSlide?: number
  label?: string
  body?: string
  id?: number | string
  text?: string
  category?: string
}

export type OpcionReto = { text: string; correct: boolean }

/**
 * Una diapositiva. Cada tipo usa un subconjunto de campos (los mismos nombres del prototipo de referencia, para que el
 * contenido curado entre tal cual).
 */
export type DatosDiapositiva = {
  type: string
  /** Identificador estable para el editor (se asigna al crearla). */
  id?: string
  icon?: string
  tagLabel?: string
  title?: string
  subtitle?: string
  body?: string
  image?: string
  imagePosition?: PosicionImagen | string
  badgeTitle?: string
  badgeSubtitle?: string
  number?: string
  bullets?: string[]
  items?: ItemDiapositiva[]
  quoteHighlight?: string
  col1Title?: string
  col1Body?: string
  col2Title?: string
  col2Body?: string
  author?: string
  stat?: string
  statement?: string
  desc?: string
  label?: string
  source?: string
  caption?: string
  leftTag?: string
  rightTag?: string
  leftTitle?: string
  leftBody?: string
  rightTitle?: string
  rightBody?: string
  rows?: { left: string; right: string }[]
  hotspots?: { x: number; y: number; title: string; body: string }[]
  imageBefore?: string
  imageAfter?: string
  labelBefore?: string
  labelAfter?: string
  regions?: { id: string; title: string; x: number; y: number; body: string }[]
  tabs?: { label: string; body: string }[]
  cards?: { front: string; back: string }[]
  questions?: { question: string; options: string[]; correctIndex: number }[]
  isTrue?: boolean
  explanation?: string
  textBefore?: string
  blankValue?: string
  textAfter?: string
  /** Rellenar espacios: palabras; Reto gamificado: alternativas con su respuesta. */
  options?: (string | OpcionReto)[]
  left?: string[]
  right?: string[]
  pairs?: number[][]
  categories?: { id: string; label: string }[]
  choices?: { text: string; outcomeTitle: string; outcomeBody: string; isOptimal: boolean }[]
  timeSeconds?: number
  challenge?: string
  scorePoints?: number
  /** Idea con la que se regeneró por última vez (modal «Regenerar diapositiva»). */
  regenPrompt?: string
}

// ── Catálogo de tipos (SCORM_SLIDE_TYPE_CATALOG) ─────────────────────────────────────────────────────────────────

export type TipoDiapositiva = { type: string; label: string; icon: IconSvgElement }

export const CATALOGO_TIPOS: TipoDiapositiva[] = [
  // Estructura y navegación
  { type: 'intro', label: 'Portada', icon: Presentation01Icon },
  { type: 'section', label: 'Divisor de sección', icon: Bookmark01Icon },
  { type: 'title_only', label: 'Afirmación', icon: Heading01Icon },
  { type: 'main_point', label: 'Punto principal', icon: Target02Icon },
  { type: 'agenda', label: 'Agenda / Índice', icon: CheckListIcon },
  { type: 'summary', label: 'Cierre / Resumen', icon: Flag02Icon },
  // Contenido textual
  { type: 'content', label: 'Lista de viñetas', icon: LeftToRightListBulletIcon },
  { type: 'steps', label: 'Lista ordenada', icon: LeftToRightListNumberIcon },
  { type: 'one_column', label: 'Una columna', icon: TextAlignLeftIcon },
  { type: 'two_columns', label: 'Dos columnas', icon: LayoutTwoColumnIcon },
  { type: 'quote', label: 'Cita', icon: QuoteDownIcon },
  { type: 'keypoint', label: 'Dato clave', icon: Idea01Icon },
  { type: 'big_number', label: 'Número grande', icon: ChartIncreaseIcon },
  // Contenido mixto
  { type: 'split', label: 'Texto e imagen', icon: ImageCompositionIcon },
  { type: 'caption', label: 'Imagen + leyenda', icon: Image01Icon },
  { type: 'compare', label: 'Comparativa', icon: BalanceScaleIcon },
  // Exploración visual
  { type: 'media', label: 'Imagen interactiva', icon: Image02Icon },
  { type: 'slider', label: 'Antes / Después', icon: SlidersHorizontalIcon },
  { type: 'map', label: 'Mapa interactivo', icon: MapsLocation01Icon },
  // Organización del contenido
  { type: 'accordion', label: 'Acordeón', icon: MenuCollapseIcon },
  { type: 'tabs', label: 'Pestañas', icon: FolderOpenIcon },
  { type: 'flashcards', label: 'Tarjetas', icon: CardExchange01Icon },
  { type: 'timeline', label: 'Línea de tiempo', icon: Route01Icon },
  // Evaluación y gamificación
  { type: 'quiz_mc', label: 'Quiz', icon: QuizIcon },
  { type: 'quiz_tf', label: 'Verdadero / Falso', icon: CheckmarkCircle02Icon },
  { type: 'quiz_fill', label: 'Rellenar espacios', icon: PencilEdit02Icon },
  { type: 'match', label: 'Emparejamiento', icon: Link01Icon },
  { type: 'sort', label: 'Ordenar secuencia', icon: SortByDown01Icon },
  { type: 'dragdrop', label: 'Clasificar', icon: Layers01Icon },
  { type: 'branching', label: 'Escenario ramificado', icon: GitBranchIcon },
  { type: 'game', label: 'Reto gamificado', icon: GameController01Icon },
  // Lienzo libre
  { type: 'blank', label: 'Lienzo libre', icon: ShapesIcon },
]

export const tipoDiapositiva = (type: string) => CATALOGO_TIPOS.find((t) => t.type === type)
export const etiquetaTipo = (type: string) => tipoDiapositiva(type)?.label ?? type

// ── Estilos de la presentación (sustituyen la elección manual de tipos) ──────────────────────────────────────────

export type EstiloId = 'equilibrado' | 'muy-visual' | 'interactivo' | 'evaluativo'

export type Estilo = { id: EstiloId; label: string; descripcion: string; icon: IconSvgElement; tipos: string[] }

export const ESTILOS: Estilo[] = [
  {
    id: 'equilibrado',
    label: 'Equilibrado',
    descripcion: 'Texto, visual e interacción a partes iguales',
    icon: DashboardSquare01Icon,
    tipos: ['content', 'steps', 'split', 'one_column', 'two_columns', 'section', 'main_point', 'keypoint', 'accordion', 'quiz_mc', 'summary'],
  },
  {
    id: 'muy-visual',
    label: 'Muy visual',
    descripcion: 'Prioriza imágenes, diagramas y datos clave',
    icon: Image01Icon,
    tipos: ['split', 'caption', 'media', 'slider', 'map', 'keypoint', 'big_number', 'quote', 'timeline', 'compare', 'summary'],
  },
  {
    id: 'interactivo',
    label: 'Interactivo',
    descripcion: 'Acordeones, pestañas y elementos para explorar',
    icon: Cursor01Icon,
    tipos: ['accordion', 'tabs', 'flashcards', 'media', 'slider', 'map', 'timeline', 'agenda', 'branching', 'summary'],
  },
  {
    id: 'evaluativo',
    label: 'Evaluativo',
    descripcion: 'Refuerza con quiz, emparejamiento y retos',
    icon: TaskDone01Icon,
    tipos: ['quiz_mc', 'quiz_tf', 'quiz_fill', 'match', 'sort', 'dragdrop', 'game', 'compare', 'keypoint', 'summary'],
  },
]

export const ESTILO_POR_DEFECTO: EstiloId = 'equilibrado'
export const estilo = (id: EstiloId | null | undefined) => ESTILOS.find((e) => e.id === id) ?? ESTILOS[0]

/** El estilo que corresponde a un conjunto de tipos (la Portada no cuenta). Sin coincidencia exacta, `null`. */
export function estiloDeTipos(tipos: string[]): EstiloId | null {
  const activos = [...new Set(tipos.filter((t) => t !== 'intro'))].sort().join(',')
  return ESTILOS.find((e) => [...e.tipos].sort().join(',') === activos)?.id ?? null
}

// ── Color de la presentación ─────────────────────────────────────────────────────────────────────────────────────
//
// En el prototipo el color se elige libre (selector de color con hex). En el playground los colores salen solo de los
// tokens del tema (así el modo oscuro y los cambios de marca funcionan solos, y el check no admite colores literales),
// por eso el selector ofrece una paleta con nombre: cada opción es un token del tema. Las clases van escritas enteras
// para que Tailwind las genere. `frente` es el texto sobre el fondo de color; `texto`, el color de acento sobre la
// superficie de la diapositiva.

/** Un token del tema (ACENTOS) o el hex que eligió el creador con el input de color (ver color-libre). */
export type AcentoId = 'primary' | 'success' | 'warning' | 'destructive' | 'invert' | (string & {})

export type Acento = { id: AcentoId; nombre: string; fondo: string; frente: string; texto: string; suave: string; borde: string }

export const ACENTOS: Acento[] = [
  {
    id: 'primary',
    nombre: 'Azul UBITS',
    fondo: 'bg-primary',
    frente: 'text-primary-foreground',
    texto: 'text-primary',
    suave: 'bg-primary/10',
    borde: 'border-primary',
  },
  {
    id: 'success',
    nombre: 'Verde',
    fondo: 'bg-success',
    frente: 'text-foreground dark:text-background',
    texto: 'text-success',
    suave: 'bg-success/10',
    borde: 'border-success',
  },
  {
    id: 'warning',
    nombre: 'Amarillo',
    fondo: 'bg-warning',
    frente: 'text-foreground dark:text-background',
    texto: 'text-warning-foreground',
    suave: 'bg-warning/15',
    borde: 'border-warning',
  },
  {
    id: 'destructive',
    nombre: 'Rojo',
    fondo: 'bg-destructive',
    frente: 'text-primary-foreground dark:text-background',
    texto: 'text-destructive',
    suave: 'bg-destructive/10',
    borde: 'border-destructive',
  },
  {
    id: 'invert',
    nombre: 'Grafito',
    fondo: 'bg-invert',
    frente: 'text-invert-foreground',
    texto: 'text-foreground',
    suave: 'bg-muted',
    borde: 'border-foreground',
  },
]

export const ACENTO_POR_DEFECTO: AcentoId = 'primary'
export const acento = (id: string | null | undefined): Acento =>
  id && esColorLibre(id) ? { id, nombre: id.toUpperCase(), ...CLASES_COLOR_LIBRE } : (ACENTOS.find((a) => a.id === id) ?? ACENTOS[0])

// ── Contenido de ejemplo por tipo (el «pool» del prototipo) ──────────────────────────────────────────────────────
//
// Es el deck de muestra «Conversaciones difíciles» (Thomas-Kilmann). Sirve de base para las plantillas vacías y para
// regenerar. Las imágenes son las del pack de fotografía que ya trae el playground.

const FOTO = (n: number) => `/images/lms-creator/video-ia-escenas/fotografia/escena-${String(n).padStart(2, '0')}.png`
const FOTO_PORTADA = FOTO(2)
const FOTO_DEMO = FOTO(5)

export const POOL: DatosDiapositiva[] = [
  { type: 'intro', tagLabel: 'Presentación', title: 'Conversaciones difíciles', subtitle: 'Modelo Thomas-Kilmann', body: 'Elige el modo de respuesta ante el conflicto', image: FOTO_PORTADA, imagePosition: 'right', badgeTitle: 'Thomas-Kilmann', badgeSubtitle: 'Cinco modos de respuesta' },
  { type: 'section', tagLabel: 'Módulo 01', number: '01', title: 'Fundamentos del Conflicto', subtitle: 'Entendiendo la cooperación y la asertividad', body: 'Las dimensiones clave para abordar desacuerdos en el equipo de forma constructiva.', image: FOTO_DEMO, imagePosition: 'background' },
  { type: 'title_only', tagLabel: 'Principio central', title: 'El conflicto no es el problema: el silencio sí lo es.', body: 'Nombrar la tensión a tiempo transforma desacuerdos en acuerdos sólidos.' },
  { type: 'main_point', tagLabel: 'Idea clave', title: 'El contexto define el modo útil', subtitle: 'Flexibilidad estratégica', body: 'Un líder adaptable utiliza los cinco modos según el valor de la relación y la urgencia del resultado.', image: FOTO_DEMO, imagePosition: 'left' },
  {
    type: 'agenda',
    tagLabel: 'Contenido',
    title: 'Agenda de la sesión',
    body: 'Explora los cuatro bloques temáticos del módulo:',
    items: [
      { num: '01', title: 'Diagnóstico inicial', desc: 'Identificar el estilo propio y del equipo', targetSlide: 1 },
      { num: '02', title: 'Los 5 Modos TK', desc: 'Cuándo competir, colaborar o ceder', targetSlide: 6 },
      { num: '03', title: 'Estrategias prácticas', desc: 'Técnicas de conversación difícil', targetSlide: 13 },
      { num: '04', title: 'Evaluación y plan', desc: 'Simulaciones y compromisos', targetSlide: 23 },
    ],
  },
  {
    type: 'summary',
    tagLabel: 'Cierre',
    title: 'Lo que aprendiste',
    image: FOTO_DEMO,
    imagePosition: 'right',
    bullets: ['Cinco modos de respuesta al conflicto', 'El contexto elige el modo útil', 'Prepararse cambia el resultado', 'Flexibilidad entre modos se entrena'],
  },
  {
    type: 'content',
    tagLabel: 'Fundamentos',
    title: 'Cinco modos de respuesta',
    body: 'Asertividad × cooperación. El contexto define cuál conviene.',
    image: FOTO_DEMO,
    imagePosition: 'right',
    bullets: ['Competir — ganar ya, límites claros', 'Colaborar — resultado y relación', 'Comprometer — ceder un poco cada uno', 'Evitar — pausa, no es hábito', 'Acomodar — priorizar al otro'],
  },
  {
    type: 'steps',
    title: 'Antes de conversar',
    tagLabel: 'Preparación',
    image: FOTO_DEMO,
    imagePosition: 'left',
    bullets: ['Define el resultado que necesitas', 'Revisa tu modo natural', 'Anticipa emociones del otro', 'Elige momento y espacio'],
  },
  {
    type: 'one_column',
    tagLabel: 'Profundización',
    title: 'La regla de las 24 horas',
    body: 'Abordar una conversación difícil en las primeras 24 horas previene que las emociones se distorsionen y que los desacuerdos escalen silenciosamente.',
    quoteHighlight: 'Nombrar los hechos en frío reduce el 70% del desgaste posterior en los equipos.',
    image: FOTO_DEMO,
    imagePosition: 'top',
  },
  {
    type: 'two_columns',
    tagLabel: 'Comparativa de impacto',
    title: 'Efectos de la cooperación',
    col1Title: 'Alta Cooperación',
    col1Body: 'Construye confianza duradera, integra perspectivas diversas y fomenta soluciones innovadoras y sostenibles.',
    col2Title: 'Baja Cooperación',
    col2Body: 'Genera silos de trabajo, desmotivación silenciosa y desgaste innecesario en la retención del talento.',
  },
  { type: 'quote', tagLabel: 'Reflexión', title: '¿Por qué evitamos?', body: 'El silencio pospone el conflicto y lo agranda.', author: 'Hallazgo Thomas-Kilmann', image: FOTO_DEMO, imagePosition: 'bottom' },
  {
    type: 'keypoint',
    tagLabel: 'Dato clave',
    title: 'Por qué importa',
    stat: '85%',
    statement: 'de los equipos agravó un conflicto al no hablar a tiempo',
    desc: 'Actuar pronto reduce desgaste y recupera ritmo.',
    image: FOTO_DEMO,
    imagePosition: 'right',
  },
  {
    type: 'big_number',
    tagLabel: 'Métrica global',
    title: 'Impacto en productividad',
    number: '85%',
    label: 'de los colaboradores',
    body: 'enfrentan desacuerdos en su entorno laboral. La clave está en cómo se gestionan.',
    source: 'Estudio Global de Gestión de Talento',
  },
  { type: 'split', tagLabel: 'En contexto', title: 'Señales antes del choque', body: 'Correos fríos, silencio en reuniones, plazos que se resbalan. Nómbralo a tiempo.', image: FOTO_PORTADA, imagePosition: 'left' },
  {
    type: 'caption',
    tagLabel: 'Observación',
    title: 'Dinámica de reunión en tensión',
    caption: 'Identificar el lenguaje no verbal defensivo permite intervenir antes de que se bloqueen los acuerdos clave.',
    image: FOTO_DEMO,
    imagePosition: 'bottom',
  },
  {
    type: 'compare',
    tagLabel: 'Dos enfoques',
    title: 'Relacional vs transaccional',
    leftTag: 'Relacional',
    rightTag: 'Transaccional',
    leftTitle: 'Relacional',
    leftBody: 'Confianza y escucha antes de negociar.',
    rightTitle: 'Transaccional',
    rightBody: 'Acuerdos y entregables primero.',
    rows: [
      { left: 'Alineación emocional primero', right: 'Plazos y alcance ya' },
      { left: 'Conflictos sensibles o largos', right: 'Urgencia o poca historia' },
      { left: 'Riesgo: demora sin cerrar', right: 'Riesgo: tono frío' },
    ],
  },
  {
    type: 'media',
    tagLabel: 'Mapa del equipo',
    title: 'Mapa del equipo',
    body: 'Explora los puntos sobre la imagen: cada uno resume una práctica para bajar la tensión y cerrar acuerdos.',
    image: FOTO_DEMO,
    hotspots: [
      { x: 26, y: 44, title: 'Hablar del tema', body: 'Hechos y necesidades, no etiquetas. Describe impacto y pide lo que necesitas.' },
      { x: 74, y: 52, title: 'Acuerdos visibles', body: 'Quién, qué y hasta cuándo. Lo no escrito se diluye en días.' },
      { x: 48, y: 24, title: 'Presión del contexto', body: 'Plazos, cambios y silos pesan en el estrés. Nómbralos antes de negociar.' },
    ],
  },
  {
    type: 'slider',
    tagLabel: 'Evolución',
    title: 'Antes y después de intervenir',
    body: 'Desliza el control central para comparar la dinámica del equipo:',
    imageBefore: FOTO_DEMO,
    imageAfter: FOTO_PORTADA,
    labelBefore: 'Antes: Tensión y silos',
    labelAfter: 'Después: Colaboración abierta',
  },
  {
    type: 'map',
    tagLabel: 'Distribución',
    title: 'Mapa de impacto organizacional',
    body: 'Haz clic en cada área para conocer cómo influye el estilo de gestión:',
    regions: [
      { id: 'liderazgo', title: 'Liderazgo', x: 25, y: 30, body: 'Establece la pauta cultural y los estándares de transparencia en la comunicación.' },
      { id: 'operaciones', title: 'Operaciones', x: 70, y: 35, body: 'Agiliza la resolución de bloqueos y dependencias críticas entre áreas.' },
      { id: 'cultura', title: 'Cultura y Personas', x: 48, y: 70, body: 'Reduce la rotación involuntaria y fortalece la confianza entre equipos.' },
    ],
  },
  {
    type: 'accordion',
    tagLabel: 'Profundiza',
    title: 'Profundiza por temas',
    items: [
      { title: 'Preparación', body: 'Anticipa objeciones, define el resultado que necesitas y elige el modo Thomas-Kilmann según contexto.' },
      { title: 'Durante la conversación', body: 'Escucha activa: valida emoción y hechos antes de proponer. Evita etiquetas; habla de impacto y necesidad.' },
      { title: 'Cierre y seguimiento', body: 'Deja acuerdos visibles (quién, qué, cuándo) y agenda una revisión en 7–14 días.' },
      { title: 'Si se tensa el tono', body: 'Nombra la tensión, pide una pausa corta y retoma con un objetivo compartido.' },
    ],
  },
  {
    type: 'tabs',
    tagLabel: 'Tres lecturas',
    title: 'Tres lecturas',
    tabs: [
      { label: 'Conflicto útil', body: 'El desacuerdo suele señalar prioridades desalineadas o expectativas poco claras. Nombrar el tema a tiempo protege la relación, reduce rumores y evita que el silencio agrande el problema.' },
      { label: 'TK en la rutina', body: 'Los cinco modos no son tipos de persona: son opciones situacionales. Pregúntate cuánto tiempo tienes, cuánto importa la relación y cuánto el resultado.' },
      { label: 'Entrenar en bajo riesgo', body: 'Practica un modo distinto en temas chicos (reuniones, correos, prioridades semanales) antes del choque fuerte. Anota qué funcionó y qué escaló.' },
    ],
  },
  {
    type: 'flashcards',
    tagLabel: 'Repaso',
    title: 'Repaso rápido',
    cards: [
      { front: 'Competidor', back: 'Prioriza ganar ya: útil con urgencia y límites claros.' },
      { front: 'Colaborador', back: 'Busca integrar relación y resultado cuando ambos importan.' },
      { front: 'Compromiso', back: 'Cada parte cede un poco para avanzar sin perder del todo.' },
      { front: 'Evadir', back: 'Pausa táctica ante tensión; riesgoso si se vuelve hábito.' },
      { front: 'Acomodar', back: 'Cede contenido para cuidar la relación o el tiempo.' },
      { front: 'Contexto', back: 'El modo útil lo define tiempo, relación y resultado — no el ego.' },
    ],
  },
  {
    type: 'timeline',
    tagLabel: 'Ruta sugerida',
    title: 'Flujo sugerido',
    image: FOTO_DEMO,
    items: [
      { label: 'Día 0', title: 'Detectar la señal', body: 'Identifica el modo por defecto del equipo y el costo de no hablar.' },
      { label: 'Día 1–2', title: 'Preparar la conversación', body: 'Agenda clara, objetivo medible y definición de éxito para ambas partes.' },
      { label: 'Día 3', title: 'Conversar con intención', body: 'Hechos, impacto y necesidad. Elige el modo TK según el contexto.' },
      { label: 'Día 3+', title: 'Cerrar y revisar', body: 'Acuerdos visibles y seguimiento en 7–14 días para sostener el cambio.' },
    ],
  },
  {
    type: 'quiz_mc',
    tagLabel: 'Autoevaluación',
    title: 'Quiz de Opción Múltiple',
    questions: [
      { question: '¿Cuándo priorizar colaborar?', options: ['Siempre', 'Cuando importan relación y resultado', 'Solo si el otro cede'], correctIndex: 1 },
      { question: '¿Qué es «evitar»?', options: ['Ganar a toda costa', 'Posponer la tensión', 'Integrar todas las partes'], correctIndex: 1 },
      { question: 'El mapa TK sirve para…', options: ['Eliminar el conflicto', 'Nombrar el estilo y elegir con intención', 'Medir IQ'], correctIndex: 1 },
    ],
  },
  {
    type: 'quiz_tf',
    tagLabel: 'Chequeo rápido',
    title: '¿Verdadero o Falso?',
    statement: 'El modo «Colaborar» siempre es la mejor alternativa independientemente del tiempo disponible.',
    isTrue: false,
    explanation: 'Falso. Si la situación requiere una decisión urgente e inmediata, colaborar puede consumir tiempo excesivo innecesariamente.',
  },
  {
    type: 'quiz_fill',
    tagLabel: 'Completar',
    title: 'Completa la afirmación',
    textBefore: 'El modo Thomas-Kilmann que prioriza la relación cediendo en el contenido se denomina',
    blankValue: 'Acomodar',
    textAfter: 'y resulta útil cuando el asunto tiene mucho más peso para la otra parte.',
    options: ['Acomodar', 'Competir', 'Evadir', 'Negociar'],
    explanation: 'Acomodar antepone el bienestar de la relación al resultado particular inmediato.',
  },
  {
    type: 'match',
    tagLabel: 'Modos TK',
    title: 'Relaciona cada modo',
    left: ['Competidor', 'Colaborador', 'Compromiso', 'Evadir', 'Acomodar'],
    right: ['Ganar con urgencia', 'Integrar ambas partes', 'Ceder un poco cada uno', 'Posponer la tensión', 'Priorizar la relación'],
    pairs: [[0, 0], [1, 1], [2, 2], [3, 3], [4, 4]],
  },
  {
    type: 'sort',
    tagLabel: 'Secuencia',
    title: 'Ordena los pasos de la conversación',
    body: 'Organiza cronológicamente los pasos recomendados:',
    items: [
      { id: 1, text: 'Definir el objetivo y recopilar hechos objetivos' },
      { id: 2, text: 'Validar la perspectiva y emociones del interlocutor' },
      { id: 3, text: 'Explorar opciones conjuntas de beneficio mutuo' },
      { id: 4, text: 'Formalizar acuerdos y agendar fecha de revisión' },
    ],
  },
  {
    type: 'dragdrop',
    tagLabel: 'Clasificación',
    title: 'Clasifica las conductas',
    body: 'Ubica cada comportamiento en su categoría correspondiente:',
    categories: [
      { id: 'constructivo', label: 'Constructivo' },
      { id: 'destructivo', label: 'Destructivo' },
    ],
    items: [
      { text: 'Hablar de hechos y necesidades', category: 'constructivo' },
      { text: 'Generalizar con «siempre» o «nunca»', category: 'destructivo' },
      { text: 'Acordar plazos y responsables visibles', category: 'constructivo' },
      { text: 'Interrumpir y descalificar posturas', category: 'destructivo' },
    ],
  },
  {
    type: 'branching',
    tagLabel: 'Toma de decisiones',
    title: 'Dilema: Entrega en riesgo',
    body: 'Tu equipo no llegará a la fecha acordada con el cliente. ¿Qué decisión tomas?',
    choices: [
      { text: 'A. Negociar una prórroga transparente y acordar entregables parciales.', outcomeTitle: 'Resultado: Confianza y Realismo', outcomeBody: 'El cliente valora la honestidad temprana y el equipo entrega con alta calidad sin quemarse.', isOptimal: true },
      { text: 'B. Exigir horas extras obligatorias sin consultar al equipo.', outcomeTitle: 'Resultado: Desgaste y Errores', outcomeBody: 'Se cumple la fecha formalmente pero con fallas de calidad y descontento interno.', isOptimal: false },
    ],
  },
  {
    type: 'game',
    tagLabel: 'Desafío interactivo',
    title: 'Reto de Gestión de Conflictos',
    body: 'Responde antes de que se agote el tiempo:',
    timeSeconds: 30,
    challenge: '¿Cuál es la primera acción recomendada ante una reunión donde la tensión escala?',
    options: [
      { text: 'Nombrar la tensión y proponer una pausa corta de 5 minutos', correct: true },
      { text: 'Elevar el tono para imponer autoridad', correct: false },
      { text: 'Dar por cancelado el proyecto sin consultar', correct: false },
    ],
    scorePoints: 100,
  },
  {
    type: 'blank',
    tagLabel: 'Lienzo libre',
    title: 'Espacio personalizado',
    subtitle: 'Composición flexible',
    body: 'Este lienzo te permite integrar bloques de texto, citas destacadas y elementos visuales con total libertad de diseño.',
    image: FOTO_DEMO,
    imagePosition: 'right',
  },
]

// ── Ayudas ───────────────────────────────────────────────────────────────────────────────────────────────────────

let consecutivo = 0
export const nuevoIdDiapositiva = () => `d-${Date.now().toString(36)}-${(consecutivo++).toString(36)}`

export const clonar = <T,>(valor: T): T => JSON.parse(JSON.stringify(valor)) as T

/** Asegura que cada diapositiva tenga su id (el editor los usa como clave). */
export const conIds = (diapositivas: DatosDiapositiva[]) => diapositivas.map((d) => (d.id ? d : { ...d, id: nuevoIdDiapositiva() }))

/** Diapositiva de ejemplo (con contenido) de un tipo. */
export function diapositivaDeEjemplo(type: string): DatosDiapositiva {
  const base = POOL.find((d) => d.type === type) ?? { type, title: 'Título de la diapositiva' }
  return { ...clonar(base), id: nuevoIdDiapositiva() }
}

/**
 * Plantilla vacía de un tipo (applyPlaceholderSlidesForPreview del prototipo): la estructura del ejemplo con textos
 * de relleno, para que el creador escriba el contenido. La usan «Añadir diapositiva» y el cambio de tipo.
 */
export function plantillaVacia(type: string): DatosDiapositiva {
  const x = diapositivaDeEjemplo(type)
  const t = 'Título de la diapositiva'
  const b = 'Texto de ejemplo sobre el tema para la vista previa.'
  const bl = 'Bullet informativo sobre el tema a tratar'
  if (x.title != null) x.title = t
  if (x.subtitle != null) x.subtitle = 'Subtítulo de ejemplo'
  if (x.body) x.body = 'Párrafo descriptivo sobre el tema a tratar.'
  if (x.author != null) x.author = 'Autor de ejemplo'
  if (x.number != null) x.number = '01'
  if (x.badgeTitle != null) x.badgeTitle = 'Tema de la diapositiva'
  if (x.badgeSubtitle != null) x.badgeSubtitle = 'Idea clave sobre el contenido'
  if (x.statement != null) x.statement = b
  if (x.desc != null) x.desc = 'Descripción breve de apoyo.'
  if (x.stat != null) x.stat = '00%'
  if (x.type === 'big_number') x.number = '85%'
  if (x.label != null) x.label = 'de los participantes'
  if (x.source != null) x.source = 'Fuente del indicador'
  if (x.quoteHighlight != null) x.quoteHighlight = 'Cita destacada sobre el punto principal.'
  if (x.caption != null) x.caption = 'Leyenda descriptiva de la imagen.'
  if (x.col1Title != null) x.col1Title = 'Columna A'
  if (x.col1Body != null) x.col1Body = b
  if (x.col2Title != null) x.col2Title = 'Columna B'
  if (x.col2Body != null) x.col2Body = b
  if (x.labelBefore != null) x.labelBefore = 'Antes'
  if (x.labelAfter != null) x.labelAfter = 'Después'
  if (x.challenge != null) x.challenge = 'Pregunta o reto a resolver en tiempo límite:'
  if (x.textBefore != null) x.textBefore = 'Texto previo al espacio en blanco'
  if (x.blankValue != null) x.blankValue = 'Palabra clave'
  if (x.textAfter != null) x.textAfter = 'texto posterior que complementa la idea.'
  if (x.explanation != null) x.explanation = 'Retroalimentación explicativa sobre la respuesta correcta.'
  if (x.bullets?.length) x.bullets = x.bullets.map(() => bl)
  if (x.items?.length) {
    x.items = x.items.map((it, i) => {
      if (x.type === 'agenda') return { num: String(i + 1).padStart(2, '0'), title: `Tema ${i + 1}`, desc: 'Descripción del bloque temático', targetSlide: i + 1 }
      if (x.type === 'sort') return { id: i + 1, text: `${i + 1}. Paso de la secuencia` }
      if (x.type === 'dragdrop') return { text: `Elemento ${i + 1}`, category: it.category }
      return { label: 'Etiqueta', title: t, body: b }
    })
  }
  if (x.regions?.length) x.regions = x.regions.map((r, i) => ({ id: r.id, title: `Zona ${i + 1}`, x: r.x, y: r.y, body: b }))
  if (x.choices?.length)
    x.choices = x.choices.map((_, i) => ({
      text: `Opción ${i === 0 ? 'A' : 'B'}: Decisión estratégica`,
      outcomeTitle: 'Resultado de la decisión',
      outcomeBody: b,
      isOptimal: i === 0,
    }))
  if (x.tabs?.length) x.tabs = x.tabs.map(() => ({ label: 'Pestaña', body: b }))
  // Una tarjeta no es una diapositiva: su relleno nombra lo que va en cada cara —delante el concepto, detrás la
  // respuesta—, no «Título de la diapositiva», que dejaba las seis caras iguales y no decía qué escribir (Dave, 7-oct).
  if (x.cards?.length) x.cards = x.cards.map(() => ({ front: 'Concepto o término', back: 'Definición o respuesta de la tarjeta.' }))
  if (x.rows?.length) x.rows = x.rows.map(() => ({ left: bl, right: bl }))
  if (x.leftTag) x.leftTag = 'Opción A'
  if (x.rightTag) x.rightTag = 'Opción B'
  if (x.leftTitle) x.leftTitle = t
  if (x.rightTitle) x.rightTitle = t
  if (x.leftBody) x.leftBody = b
  if (x.rightBody) x.rightBody = b
  if (x.questions?.length) x.questions = x.questions.map(() => ({ question: t, options: ['Opción A', 'Opción B', 'Opción C'], correctIndex: 0 }))
  if (x.options?.length)
    x.options = x.options.map((o, i) => (typeof o === 'object' ? { text: `Alternativa ${i + 1}`, correct: i === 0 } : o))
  if (x.type === 'quiz_fill') x.options = ['Palabra clave', 'Opción B', 'Opción C', 'Opción D']
  if (x.left?.length) x.left = x.left.map((_, i) => `Concepto ${i + 1}`)
  if (x.right?.length) x.right = x.right.map((_, i) => `Definición ${i + 1}`)
  if (x.hotspots?.length) x.hotspots = x.hotspots.map((h) => ({ x: h.x, y: h.y, title: t, body: b }))
  return x
}

// ── Borrador de estructura (outline) ─────────────────────────────────────────────────────────────────────────────

export const DURACION_ESTRUCTURA_MS = 6000
export const DURACION_DIAPOSITIVA_MS = 420
export const DURACION_REGENERAR_MS = 600
export const COSTO_REGENERAR = 50

export const MAX_TITULO_ESCENA = 80
export const MAX_IDEA = 120
export const MAX_IDEAS = 8

export type Escena = { id: string; tipo: string; titulo: string; ideas: string[] }

export type Estructura = { estado: 'vacio' | 'listo'; escenas: Escena[] }

export const ESTRUCTURA_VACIA: Estructura = { estado: 'vacio', escenas: [] }

export const deckDeEstilo = (id: EstiloId) => DECKS_ONBOARDING.find((d) => d.estilo === id) ?? DECKS_ONBOARDING[0]

/** Ideas del borrador a partir del contenido curado de una diapositiva. */
function ideasDeDiapositiva(d: DatosDiapositiva): string[] {
  if (d.bullets?.length) return d.bullets.slice(0, 4)
  const items = (d.items ?? []).map((it) => String(it.title || it.text || it.desc || '').trim()).filter(Boolean)
  if (items.length) return items.slice(0, 4)
  return [String(d.body || d.statement || d.caption || '').trim(), String(d.subtitle || d.desc || '').trim()].filter(Boolean).slice(0, 3)
}

/** Estructura mock a partir del setup: el deck curado del estilo elegido. */
export function generarEstructura(id: EstiloId): Escena[] {
  return deckDeEstilo(id).diapositivas.map((d, i) => ({
    id: `escena-${i}-${Date.now().toString(36)}`,
    tipo: d.type,
    titulo: String(d.title ?? '').trim() || etiquetaTipo(d.type),
    ideas: ideasDeDiapositiva(d),
  }))
}

/** Aplica las ideas editadas del borrador a una diapositiva (cuando el texto no viene de un deck curado). */
function aplicarIdeas(d: DatosDiapositiva, ideas: string[]): DatosDiapositiva {
  const limpias = ideas.map((i) => i.trim()).filter(Boolean)
  if (['intro', 'section', 'title_only', 'main_point'].includes(d.type)) return { ...d, body: limpias[0] || d.body, subtitle: limpias[1] || d.subtitle }
  if (['content', 'steps', 'summary', 'one_column', 'two_columns'].includes(d.type)) return { ...d, bullets: limpias.length ? limpias : d.bullets }
  if (d.type === 'agenda' && limpias.length)
    return { ...d, items: limpias.map((idea, i) => ({ num: String(i + 1).padStart(2, '0'), title: idea, desc: '', targetSlide: i + 1 })) }
  return { ...d, body: limpias.join(' · ') || d.body }
}

/**
 * Diapositiva que se ve en la miniatura de una escena del borrador. Con el deck curado se usa su contenido tal cual
 * (solo cambia el título); la portada lleva el título de la presentación.
 */
export function diapositivaDeEscena(escena: Escena, estiloId: EstiloId, tituloPresentacion: string, indice?: number): DatosDiapositiva {
  const deck = deckDeEstilo(estiloId).diapositivas
  const curada = (indice != null && deck[indice]?.type === escena.tipo ? deck[indice] : undefined) ?? deck.find((d) => d.type === escena.tipo)
  const base = clonar(curada ?? diapositivaDeEjemplo(escena.tipo))
  base.type = escena.tipo
  base.title = escena.tipo === 'intro' ? tituloPresentacion || escena.titulo : escena.titulo.trim() || base.title
  return curada ? base : aplicarIdeas(base, escena.ideas)
}

/** Convierte el borrador aprobado en las diapositivas del editor. */
export function escenasADiapositivas(escenas: Escena[], estiloId: EstiloId, tituloPresentacion: string): DatosDiapositiva[] {
  return escenas.map((escena, i) => ({ ...diapositivaDeEscena(escena, estiloId, tituloPresentacion, i), id: nuevoIdDiapositiva() }))
}

/** Huella del setup: si cambia después de estructurar, el borrador queda desactualizado (color y logo no cuentan). */
export const huellaSetup = (partes: { idea: string; contexto: string; estilo: EstiloId; objetivo: string; objetivoOtro: string }) =>
  [partes.idea.trim(), partes.contexto, partes.estilo, `objetivo:${partes.objetivo}`, partes.objetivo === 'otro' ? partes.objetivoOtro.trim() : ''].join('::')

// ── Idea, contexto y objetivo ────────────────────────────────────────────────────────────────────────────────────

export const IDEAS_EJEMPLO = [
  {
    id: 'onboarding',
    label: 'Onboarding comercial 30 días',
    prompt:
      'Onboarding comercial de treinta días para un vendedor nuevo: de conocer la empresa a cerrar las primeras oportunidades con autonomía. Cuatro semanas — contexto, discurso, práctica y autonomía — con calificación, CRM y objeciones.',
  },
  {
    id: 'compliance',
    label: 'Política de compliance',
    prompt: 'Explica una política de compliance con dos casos reales: uno bien resuelto y otro con consecuencias. Cierra con qué debe hacer la persona si tiene dudas.',
  },
  {
    id: 'producto',
    label: 'Capacitación de producto',
    prompt: 'Capacitación de producto en diapositivas: presenta el problema del cliente, 3 beneficios concretos y un error frecuente al usarlo.',
  },
  {
    id: 'seguridad',
    label: 'Seguridad en el trabajo',
    prompt: 'Presentación de seguridad en el trabajo: reglas clave, un escenario de riesgo y la acción correcta paso a paso.',
  },
  {
    id: 'cambio',
    label: 'Cambio organizacional',
    prompt: 'Comunica un cambio organizacional al equipo: qué cambia, qué no cambia y qué se espera de cada persona en las próximas 2 semanas.',
  },
]

export const IDEA_PERSONALIZADA = 'custom'
export const chipDeIdea = (idea: string) => IDEAS_EJEMPLO.find((i) => i.prompt === idea)?.id ?? IDEA_PERSONALIZADA

export type ModoContexto = 'internet' | 'files' | 'both'

export const OPCIONES_CONTEXTO: { value: ModoContexto; label: string }[] = [
  { value: 'internet', label: 'Información de internet' },
  { value: 'files', label: 'Archivos adjuntos' },
  { value: 'both', label: 'Archivos e información de internet' },
]

export const contextoUsaArchivos = (modo: ModoContexto) => modo === 'files' || modo === 'both'

export const ACEPTA_CONTEXTO = '.pdf,.txt,.md,application/pdf,text/plain,text/markdown'

export const OPCIONES_OBJETIVO = [
  { id: 'comprender', label: 'Comprender un concepto o proceso' },
  { id: 'aplicar', label: 'Aplicar un procedimiento en el trabajo' },
  { id: 'cambiar-conducta', label: 'Cambiar una conducta o hábito' },
  { id: 'sensibilizar', label: 'Sensibilizar o generar conciencia' },
  { id: 'onboarding', label: 'Onboarding o inducción' },
  { id: 'politica', label: 'Reforzar una política o norma' },
  { id: 'otro', label: 'Otro' },
]

// ── Título ───────────────────────────────────────────────────────────────────────────────────────────────────────

export const TITULO_POR_DEFECTO = 'Presentación interactiva'

/**
 * Título de la presentación (RN-01): el que se escribió en «Añadir página»; si la idea es un ejemplo, el nombre del
 * ejemplo; si no, la primera línea de la idea (recortada para que quepa en la portada); sin idea, «Presentación
 * interactiva».
 */
export function derivarTitulo(idea: string, tituloPagina?: string) {
  const dePagina = String(tituloPagina ?? '').trim()
  if (dePagina) return dePagina
  const limpia = idea.trim()
  const ejemplo = IDEAS_EJEMPLO.find((i) => i.prompt === limpia)
  if (ejemplo) return ejemplo.label
  const linea = limpia.split('\n')[0]?.trim()
  if (!linea) return TITULO_POR_DEFECTO
  return linea.length > 42 ? `${linea.slice(0, 41).trim()}…` : linea
}

// ── Datos que guarda la página (Recurso.presentacion) ────────────────────────────────────────────────────────────

export type DatosPresentacion = {
  titulo: string
  diapositivas: DatosDiapositiva[]
  acento: AcentoId
  logo: string | null
  estilo: EstiloId
}

/** Lee los datos guardados en la página; `null` si no hay diapositivas editables. */
export function leerDatosPresentacion(datos: unknown): DatosPresentacion | null {
  if (!datos || typeof datos !== 'object') return null
  const d = datos as Partial<DatosPresentacion>
  if (!Array.isArray(d.diapositivas) || !d.diapositivas.length) return null
  const diapositivas = conIds(d.diapositivas.filter((x): x is DatosDiapositiva => Boolean(x && typeof x === 'object' && typeof x.type === 'string')))
  if (!diapositivas.length) return null
  return {
    titulo: String(d.titulo ?? '').trim() || TITULO_POR_DEFECTO,
    diapositivas,
    acento: acento(d.acento).id,
    logo: typeof d.logo === 'string' ? d.logo : null,
    estilo: estilo(d.estilo ?? estiloDeTipos(diapositivas.map((x) => x.type))).id,
  }
}
