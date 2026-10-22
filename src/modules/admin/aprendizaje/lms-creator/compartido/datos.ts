import type { IconSvgElement } from '@hugeicons/react'
import {
  Calendar03Icon,
  CheckListIcon,
  Comment01Icon,
  LinkSquare01Icon,
  PackageIcon,
  Pdf01Icon,
  PresentationBarChart01Icon,
  StarIcon,
  TextAlignLeftIcon,
  Video01Icon,
} from '@hugeicons/core-free-icons'
import { plural } from '@/modules/design-system/patrones/formato'

// LMS Creator — los datos que comparten las tres exploraciones (27 sep, Nicolás: «3 exploraciones para LMS creator, de
// como queda toda esta experiencia […] quiero algo MUUUUYY TOP»). Los mismos 20 contenidos, las mismas páginas y las
// mismas reglas en las tres, para que lo que cambie entre ellas sea la forma de crear y no el detalle.
//
// Las reglas salen de las historias de usuario del producto (docs/plataforma-ubits/fuentes/…/lms-creator):
// - HU-LMS-001 crear contenido: portada, recursos (páginas), certificado y ajustes; «Agregar página» con título opcional
//   (si va vacío, la página se llama como su recurso); tipos habilitados Video, PDF, Texto, Embebido, SCORM, Evaluación;
//   Encuesta libre y de satisfacción se ven pero no se pueden crear; Asistencia solo en eventos.
// - HU-LMS-002 editar publicado: en publicado no se elimina una página, se oculta; siempre queda al menos una visible; los
//   cambios de estructura piden la política de impacto (proteger a quien terminó o recalcular a todos).
// - HU-LMS-019 pesos: solo las evaluaciones visibles suman 100%; una oculta queda en 0% con su fecha.
// - HU-LMS-011 navegación: Lineal (por defecto) o Libre.
// - Costos de IA (RN-06): portada 50, guion de video 80, video 320, evaluación 80, SCORM con IA 15.

// «Hoy» fijo: los datos no envejecen al recargar.
export const HOY = new Date('2026-09-27T10:00:00')

/* Tipos --------------------------------------------------------------------------------------------------------- */

export type TipoContenido = 'Curso' | 'Charla' | 'Evento' | 'Ruta de aprendizaje'
export type Visibilidad = 'Borrador' | 'Público' | 'Privado' | 'Oculto' | 'Archivado'
export type Nivel = 'Básico' | 'Intermedio' | 'Avanzado'
export type Idioma = 'Español' | 'Inglés' | 'Portugués'
export type Navegacion = 'Lineal' | 'Libre'
export type Impacto = 'proteger' | 'recalcular'
export type TipoPagina = 'video' | 'pdf' | 'texto' | 'embebido' | 'scorm' | 'presentacion' | 'evaluacion' | 'asistencia' | 'encuesta' | 'satisfaccion'

export type Persona = { nombre: string; iniciales: string }

export type Pregunta = { id: string; enunciado: string; opciones: string[]; correcta: number }

export type Recurso =
  | { tipo: 'video'; fuente: 'archivo' | 'enlace' | 'ia'; nombre: string; minutos: number }
  | { tipo: 'pdf'; nombre: string; megas: number; hojas: number; descargable: boolean; extracto: string[] }
  | { tipo: 'texto'; texto: string }
  | { tipo: 'embebido'; url: string; proveedor: string }
  | { tipo: 'scorm'; nombre: string; megas: number; minutos: number }
  | { tipo: 'presentacion'; diapositivas: number; minutos: number }
  | { tipo: 'evaluacion'; preguntas: Pregunta[]; aprobarCon: number; intentos: number }
  | { tipo: 'asistencia'; sesion: string; fecha: string; horario: string; lugar: string }

export type Pagina = {
  id: string
  titulo: string
  recurso: Recurso
  // Solo en publicado: la página no se borra, se oculta (HU-LMS-002); la fecha va en su insignia.
  ocultaDesde?: string
  // Un texto corto bajo el recurso («Lee las páginas 3 a 6 antes de seguir»).
  nota?: string
}

export type Seccion = { id: string; titulo: string; paginas: Pagina[] }

// La portada es una ilustración de la librería de iconos de vidrio sobre un tono del tema; si se subió una imagen, su
// nombre. El producto usa fotos; aquí no hay fotos de cursos, y una portada inventada con colores sueltos rompería el tema.
export type TonoPortada = 'azul' | 'cielo' | 'verde' | 'indigo' | 'marino' | 'rosa'
export type Portada = { tono: TonoPortada; icono: string; imagen?: string; conIa?: boolean }

export type Contenido = {
  id: string
  titulo: string
  tipo: TipoContenido
  visibilidad: Visibilidad
  descripcion: string
  portada: Portada | null
  trailer?: string
  nivel: Nivel
  // Minutos que se declaran en la ficha técnica (el producto lo pide como número + unidad).
  duracion: number
  idioma: Idioma
  categoria: string | null
  competencias: string[]
  // Sin secciones, las páginas van en una sola lista: `secciones` tiene una sola, sin título que se muestre.
  usaSecciones: boolean
  secciones: Seccion[]
  certificado: { activo: boolean; plantilla: string }
  navegacion: Navegacion
  // Peso de cada evaluación visible en la nota final (id de página → %). Las ocultas no están.
  pesos: Record<string, number>
  impacto: Impacto
  // Privado: los grupos que lo ven.
  grupos: string[]
  // Solo rutas: los contenidos que la forman, en orden.
  contenidos: string[]
  autor: Persona
  creado: string
  actualizado: string
  publicado?: string
  inscritos: number
  finalizaron: number
  calificacion?: number
  // Cómo nació: a mano o armado con IA (la exploración 3).
  origen: 'manual' | 'ia'
}

/* Catálogos ----------------------------------------------------------------------------------------------------- */

export const YO: Persona = { nombre: 'Ana Rojas', iniciales: 'AR' }
const LAURA: Persona = { nombre: 'Laura Martínez', iniciales: 'LM' }
const ANDRES: Persona = { nombre: 'Andrés Pardo', iniciales: 'AP' }
const SARA: Persona = { nombre: 'Sara Gómez', iniciales: 'SG' }

export const TIPOS_CONTENIDO: { tipo: TipoContenido; descripcion: string; glass: string }[] = [
  { tipo: 'Curso', descripcion: 'Varias páginas con videos, lecturas y evaluación, a su ritmo.', glass: 'glass-play' },
  { tipo: 'Charla', descripcion: 'Una sola idea en pocas páginas: una conferencia, un tutorial, un anuncio.', glass: 'glass-video' },
  { tipo: 'Ruta de aprendizaje', descripcion: 'Varios contenidos en orden, para un recorrido más largo.', glass: 'glass-discovery' },
  { tipo: 'Evento', descripcion: 'Una formación en sitio o en vivo, con sesiones y asistencia.', glass: 'glass-calendar' },
]

export const CATEGORIAS = ['Cumplimiento', 'Habilidades blandas', 'Liderazgo', 'Onboarding', 'Seguridad y salud', 'Servicio al cliente', 'Tecnología', 'Ventas']
export const COMPETENCIAS = ['Comunicación', 'Liderazgo', 'Orientación al cliente', 'Pensamiento analítico', 'Trabajo en equipo', 'Adaptabilidad', 'Ética y cumplimiento']
export const NIVELES: Nivel[] = ['Básico', 'Intermedio', 'Avanzado']
export const IDIOMAS: Idioma[] = ['Español', 'Inglés', 'Portugués']
export const GRUPOS = ['Fuerza comercial', 'Líderes de primer nivel', 'Operaciones planta Funza', 'Nuevos ingresos', 'Área de tecnología']

export const PLANTILLAS_CERTIFICADO = [
  { id: 'empresa', nombre: 'Estándar de Meta Colombia', descripcion: 'Con el logo y la firma de la empresa.' },
  { id: 'ubits', nombre: 'Certificado UBITS', descripcion: 'El de la plataforma, sin marca propia.' },
  { id: 'formal', nombre: 'Formal con dos firmas', descripcion: 'Para cumplimiento: agrega a quien avala.' },
]
export const FIRMANTE = { nombre: 'Lola Vargas', cargo: 'Gerente de Capacitación' }
export const EMPRESA = 'Meta Colombia'

// Las cuatro visibilidades con lo que implican, con las palabras del producto (Ajustes › Visibilidad).
export const VISIBILIDADES: { valor: Exclude<Visibilidad, 'Archivado'>; descripcion: string }[] = [
  { valor: 'Borrador', descripcion: 'En construcción: solo lo ven otros creadores. Puedes cambiar todo.' },
  { valor: 'Público', descripcion: 'Todo tu equipo lo ve en el catálogo. Después solo se editan títulos y se reemplazan recursos.' },
  { valor: 'Privado', descripcion: 'Solo para los grupos que elijas. Después solo se editan títulos y se reemplazan recursos.' },
  { valor: 'Oculto', descripcion: 'Fuera del catálogo, pero lo siguen viendo quienes lo terminaron o lo tienen en curso.' },
]

// La insignia de cada visibilidad: el mismo color que el producto (verde público, ámbar privado, gris oculto).
export const INSIGNIA_VISIBILIDAD: Record<Visibilidad, 'secondary' | 'success-light' | 'warning-light' | 'outline' | 'info-light'> = {
  Borrador: 'info-light',
  Público: 'success-light',
  Privado: 'warning-light',
  Oculto: 'secondary',
  Archivado: 'outline',
}

export const NAVEGACIONES: { valor: Navegacion; descripcion: string }[] = [
  { valor: 'Lineal', descripcion: 'Se avanza en el orden del índice, sin saltar páginas. Para cumplimiento y cursos con evaluación.' },
  { valor: 'Libre', descripcion: 'Se abre cualquier página desde el índice. El final se desbloquea al completar todo.' },
]

export const IMPACTOS: { valor: Impacto; titulo: string; descripcion: string }[] = [
  {
    valor: 'proteger',
    titulo: 'Proteger a quienes ya finalizaron',
    descripcion: 'Quien lo completó al 100 % conserva su progreso y su certificado. Los cambios solo cuentan para quien sigue estudiando.',
  },
  {
    valor: 'recalcular',
    titulo: 'Recalcular el progreso de todos',
    descripcion: 'El avance se vuelve a calcular: quien había terminado puede quedar por debajo del 100 %, perder el certificado y bajar en rutas y planes.',
  },
]

// Cada tipo de página: cómo se llama, qué es, con qué se carga y si se puede crear. «Encuesta libre» y «de
// satisfacción» se ven pero están apagadas (RN-03); «Asistencia» solo existe en eventos.
export type MetaPagina = {
  nombre: string
  descripcion: string
  icono: IconSvgElement
  glass: string
  disponible: boolean
  soloEvento?: boolean
  conIa?: boolean
}

export const TIPOS_PAGINA: Record<TipoPagina, MetaPagina> = {
  video: { nombre: 'Video', descripcion: 'Sube un MP4, pega un enlace de YouTube o Vimeo, o créalo con IA por escenas.', icono: Video01Icon, glass: 'glass-video', disponible: true, conIa: true },
  pdf: { nombre: 'PDF', descripcion: 'Un documento para leer o descargar: manuales, guías y políticas.', icono: Pdf01Icon, glass: 'glass-document', disponible: true },
  texto: { nombre: 'Texto', descripcion: 'Una lectura escrita aquí mismo, con títulos, listas y enlaces.', icono: TextAlignLeftIcon, glass: 'glass-paper', disponible: true },
  embebido: { nombre: 'Embebido', descripcion: 'Una página de otra herramienta dentro del curso: Genially, Canva, Google Slides.', icono: LinkSquare01Icon, glass: 'glass-discovery', disponible: true },
  scorm: { nombre: 'SCORM', descripcion: 'Un paquete .zip de otra herramienta de autor, con su propio avance.', icono: PackageIcon, glass: 'glass-folder', disponible: true },
  presentacion: { nombre: 'Presentación interactiva', descripcion: 'Diapositivas con preguntas en medio, armadas con IA a partir de una idea.', icono: PresentationBarChart01Icon, glass: 'glass-gallery', disponible: true, conIa: true },
  evaluacion: { nombre: 'Evaluación', descripcion: 'Preguntas de opción múltiple que cuentan en la nota final.', icono: CheckListIcon, glass: 'glass-tick', disponible: true, conIa: true },
  asistencia: { nombre: 'Asistencia', descripcion: 'Una sesión en sitio o en vivo y quién asistió a ella.', icono: Calendar03Icon, glass: 'glass-calendar', disponible: true, soloEvento: true },
  encuesta: { nombre: 'Encuesta libre', descripcion: 'Preguntas abiertas que no califican.', icono: Comment01Icon, glass: 'glass-chat', disponible: false },
  satisfaccion: { nombre: 'Encuesta de satisfacción', descripcion: 'Cómo le pareció el contenido a quien lo terminó.', icono: StarIcon, glass: 'glass-star', disponible: false },
}

// En el orden en que se ofrecen al añadir una página.
export const ORDEN_TIPOS: TipoPagina[] = ['video', 'pdf', 'texto', 'evaluacion', 'presentacion', 'embebido', 'scorm', 'asistencia', 'encuesta', 'satisfaccion']

// Lo que cuesta cada acción con IA, en créditos (RN-06). «Armar la propuesta» de la exploración 3 es gratis, como
// preparar las escenas de un video: se cobra al construir.
export const COSTOS = {
  portada: 50,
  guion: 80,
  video: 320,
  evaluacion: 80,
  scorm: 15,
  presentacion: 120,
  texto: 20,
  propuesta: 0,
} as const

export const SALDO_INICIAL = 1240

/* Utilidades ---------------------------------------------------------------------------------------------------- */

export const paginasDe = (contenido: Contenido) => contenido.secciones.flatMap((seccion) => seccion.paginas)
export const paginasVisibles = (contenido: Contenido) => paginasDe(contenido).filter((pagina) => !pagina.ocultaDesde)
export const esPublicado = (contenido: Contenido) => ['Público', 'Privado', 'Oculto'].includes(contenido.visibilidad)

// Cuánto toma una página, en minutos: lo que dura el video; dos minutos por hoja de PDF; cinco por lectura; minuto y
// medio por pregunta.
export function minutosDe(pagina: Pagina) {
  const r = pagina.recurso
  switch (r.tipo) {
    case 'video':
    case 'scorm':
    case 'presentacion':
      return r.minutos
    case 'pdf':
      return Math.max(3, r.hojas * 2)
    case 'texto':
      return Math.max(3, Math.round(r.texto.split(/\s+/).length / 180))
    case 'embebido':
      return 8
    case 'evaluacion':
      return Math.max(2, Math.round(r.preguntas.length * 1.5))
    case 'asistencia':
      return 120
  }
}

export const minutosTotales = (contenido: Contenido) => paginasVisibles(contenido).reduce((suma, pagina) => suma + minutosDe(pagina), 0)

export function textoDuracion(minutos: number) {
  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  return resto ? `${horas} h ${resto} min` : `${horas} h`
}

// Qué dice una página debajo de su nombre: «Video · 6 min», «PDF · 12 hojas», «Evaluación · 5 preguntas».
export function resumenPagina(pagina: Pagina) {
  const r = pagina.recurso
  const nombre = TIPOS_PAGINA[r.tipo].nombre
  switch (r.tipo) {
    case 'video':
      return `${nombre} · ${r.minutos} min`
    case 'pdf':
      return `${nombre} · ${r.hojas} ${r.hojas === 1 ? 'hoja' : 'hojas'}`
    case 'texto':
      return `${nombre} · ${minutosDe(pagina)} min de lectura`
    case 'embebido':
      return `${nombre} · ${r.proveedor}`
    case 'scorm':
      return `${nombre} · ${r.minutos} min`
    case 'presentacion':
      return `${nombre} · ${r.diapositivas} ${plural(r.diapositivas, 'diapositiva', 'diapositivas')}`
    case 'evaluacion':
      return `${nombre} · ${r.preguntas.length} ${r.preguntas.length === 1 ? 'pregunta' : 'preguntas'}`
    case 'asistencia':
      return `${nombre} · ${r.sesion}`
  }
}

export const evaluacionesVisibles = (contenido: Contenido) => paginasVisibles(contenido).filter((pagina) => pagina.recurso.tipo === 'evaluacion')

// El reparto de pesos por defecto: parejo entre las evaluaciones visibles, lo que sobra a la última (HU-LMS-019).
export function pesosParejos(ids: string[]): Record<string, number> {
  if (!ids.length) return {}
  const base = Math.floor(100 / ids.length)
  return Object.fromEntries(ids.map((id, i) => [id, i === ids.length - 1 ? 100 - base * (ids.length - 1) : base]))
}

export const sumaPesos = (contenido: Contenido) => evaluacionesVisibles(contenido).reduce((suma, pagina) => suma + (contenido.pesos[pagina.id] ?? 0), 0)

// Lo que falta para publicar, en el orden de las cuatro partes del contenido. `obligatorio` impide publicar; lo demás
// es una recomendación que se dice pero no bloquea.
export type Parte = 'basico' | 'contenido' | 'certificado' | 'ajustes'
export type Revision = { id: string; parte: Parte; texto: string; ok: boolean; obligatorio: boolean }

export function revisar(contenido: Contenido, todos: Contenido[] = []): Revision[] {
  const esRuta = contenido.tipo === 'Ruta de aprendizaje'
  const paginas = paginasVisibles(contenido)
  const evaluaciones = evaluacionesVisibles(contenido)
  const vacias = evaluaciones.filter((pagina) => pagina.recurso.tipo === 'evaluacion' && !pagina.recurso.preguntas.length)
  const fichaCompleta = Boolean(contenido.categoria) && contenido.duracion > 0
  const lista: Revision[] = [
    { id: 'titulo', parte: 'basico', texto: 'Tiene un título', ok: contenido.titulo.trim().length > 2, obligatorio: true },
    { id: 'descripcion', parte: 'basico', texto: 'Tiene una descripción de al menos una frase', ok: contenido.descripcion.trim().length >= 30, obligatorio: true },
    { id: 'portada', parte: 'basico', texto: 'Tiene portada', ok: Boolean(contenido.portada), obligatorio: false },
    { id: 'ficha', parte: 'basico', texto: 'La ficha técnica está completa: categoría y duración', ok: fichaCompleta, obligatorio: true },
  ]
  if (esRuta) {
    const validos = contenido.contenidos.filter((id) => todos.length === 0 || todos.some((otro) => otro.id === id))
    lista.push({ id: 'contenidos', parte: 'contenido', texto: 'Tiene al menos un contenido', ok: validos.length > 0, obligatorio: true })
  } else {
    lista.push({ id: 'paginas', parte: 'contenido', texto: 'Tiene al menos una página', ok: paginas.length > 0, obligatorio: true })
    lista.push({
      id: 'preguntas',
      parte: 'contenido',
      texto: vacias.length ? `${vacias.map((pagina) => `«${pagina.titulo}»`).join(' y ')} no tiene preguntas` : 'Las evaluaciones tienen preguntas',
      ok: !vacias.length,
      obligatorio: false,
    })
    lista.push({
      id: 'evaluacion',
      parte: 'contenido',
      texto: 'Tiene una evaluación para saber qué aprendió cada persona',
      ok: evaluaciones.length > 0,
      obligatorio: false,
    })
  }
  lista.push({
    id: 'certificado',
    parte: 'certificado',
    texto: contenido.certificado.activo ? 'Entrega certificado al terminar' : 'No entrega certificado',
    ok: contenido.certificado.activo,
    obligatorio: false,
  })
  if (!esRuta && evaluaciones.length > 1)
    lista.push({ id: 'pesos', parte: 'ajustes', texto: `Los pesos de las evaluaciones suman ${sumaPesos(contenido)} %`, ok: sumaPesos(contenido) === 100, obligatorio: true })
  if (contenido.visibilidad === 'Privado')
    lista.push({ id: 'grupos', parte: 'ajustes', texto: 'Tiene al menos un grupo que lo ve', ok: contenido.grupos.length > 0, obligatorio: true })
  return lista
}

export const listoParaPublicar = (contenido: Contenido, todos: Contenido[] = []) => revisar(contenido, todos).every((item) => item.ok || !item.obligatorio)

// «hace 3 días», «hoy», «ayer», «hace 2 meses»: cuándo se tocó por última vez.
export function hace(iso: string) {
  const dias = Math.round((HOY.getTime() - new Date(iso).getTime()) / 86_400_000)
  if (dias <= 0) return 'hoy'
  if (dias === 1) return 'ayer'
  if (dias < 30) return `hace ${dias} ${plural(dias, 'día', 'días')}`
  const meses = Math.round(dias / 30)
  return meses === 1 ? 'hace un mes' : `hace ${meses} meses`
}

export const porcentajeFinalizacion = (contenido: Contenido) => (contenido.inscritos ? Math.round((contenido.finalizaron / contenido.inscritos) * 100) : 0)

/* Páginas de ejemplo -------------------------------------------------------------------------------------------- */

let siguiente = 0
export const nuevoId = (prefijo = 'p') => `${prefijo}-${Date.now().toString(36)}-${(siguiente++).toString(36)}`

const q = (id: string, enunciado: string, opciones: string[], correcta: number): Pregunta => ({ id, enunciado, opciones, correcta })
const video = (id: string, titulo: string, minutos: number, nombre: string, fuente: 'archivo' | 'enlace' | 'ia' = 'archivo'): Pagina => ({
  id,
  titulo,
  recurso: { tipo: 'video', fuente, nombre, minutos },
})
const pdf = (id: string, titulo: string, nombre: string, megas: number, hojas: number, extracto: string[], descargable = true): Pagina => ({
  id,
  titulo,
  recurso: { tipo: 'pdf', nombre, megas, hojas, descargable, extracto },
})
const texto = (id: string, titulo: string, contenido: string): Pagina => ({ id, titulo, recurso: { tipo: 'texto', texto: contenido } })
const embebido = (id: string, titulo: string, url: string, proveedor: string): Pagina => ({ id, titulo, recurso: { tipo: 'embebido', url, proveedor } })
const scorm = (id: string, titulo: string, nombre: string, megas: number, minutos: number): Pagina => ({ id, titulo, recurso: { tipo: 'scorm', nombre, megas, minutos } })
const presentacion = (id: string, titulo: string, diapositivas: number, minutos: number): Pagina => ({ id, titulo, recurso: { tipo: 'presentacion', diapositivas, minutos } })
const evaluacion = (id: string, titulo: string, preguntas: Pregunta[], aprobarCon = 70, intentos = 3): Pagina => ({
  id,
  titulo,
  recurso: { tipo: 'evaluacion', preguntas, aprobarCon, intentos },
})
const unaSeccion = (paginas: Pagina[]): Seccion[] => [{ id: 's-unica', titulo: '', paginas }]

const PREGUNTAS_DATOS = [
  q('d1', '¿Cuál de estos es un dato personal sensible?', ['El número de celular', 'El estado de salud', 'El cargo en la empresa', 'La ciudad de residencia'], 1),
  q('d2', 'Antes de guardar los datos de un cliente, lo primero es…', ['Pedir su autorización', 'Guardarlos en Excel', 'Enviarlos a Comercial', 'Borrar los anteriores'], 0),
  q('d3', 'Un cliente pide que borremos sus datos. ¿Qué hacemos?', ['Nada, ya aceptó', 'Lo remitimos a su asesor', 'Lo tramitamos en 15 días hábiles', 'Le pedimos que escriba un correo'], 2),
  q('d4', '¿Quién responde ante la SIC si hay una filtración?', ['Quien la causó', 'La empresa como responsable', 'El proveedor de nube', 'Nadie si fue un error'], 1),
  q('d5', '¿Dónde se guardan los formatos firmados de autorización?', ['En el escritorio', 'En la carpeta compartida de cumplimiento', 'En el correo', 'Impresos en el puesto'], 1),
  q('d6', '¿Cada cuánto se revisa la política de tratamiento?', ['Nunca', 'Una vez al año', 'Cuando la pide un cliente', 'Cada cinco años'], 1),
]
const PREGUNTAS_REPASO = [
  q('r1', 'La ley que regula los datos personales en Colombia es la…', ['1581 de 2012', '100 de 1993', '1010 de 2006', '2300 de 2023'], 0),
  q('r2', 'La autorización del titular debe ser…', ['Verbal', 'Previa, expresa e informada', 'Anual', 'Opcional si es cliente'], 1),
  q('r3', '¿Un correo corporativo es un dato personal?', ['No, es de la empresa', 'Sí, identifica a una persona', 'Solo si es de un gerente', 'Solo con foto'], 1),
]
const PREGUNTAS_COMERCIAL = [
  q('c1', '¿Cuál es el descuento máximo que un asesor puede aprobar solo?', ['5 %', '10 %', '15 %', 'No tiene tope'], 1),
  q('c2', 'Una cotización vence a los…', ['7 días', '15 días', '30 días', '60 días'], 2),
  q('c3', '¿Dónde se registra cada oportunidad?', ['En el CRM el mismo día', 'En un Excel semanal', 'En el chat del equipo', 'Al cerrar la venta'], 0),
  q('c4', 'El cliente pide un producto fuera del portafolio. ¿Qué haces?', ['Lo prometes igual', 'Lo escalas a Producto', 'Le dices que no', 'Le das otro sin avisar'], 1),
  q('c5', '¿Qué va primero en una visita?', ['El precio', 'Entender la necesidad', 'La demostración', 'El contrato'], 1),
]
const PREGUNTAS_FEEDBACK = [
  q('f1', 'Un buen feedback se centra en…', ['La persona', 'El comportamiento y su efecto', 'Lo que dicen los demás', 'El pasado lejano'], 1),
  q('f2', '¿Cuándo es mejor dar un feedback de mejora?', ['En la evaluación anual', 'Pronto y en privado', 'En la reunión de equipo', 'Por chat'], 1),
  q('f3', 'El modelo SCI significa…', ['Situación, comportamiento, impacto', 'Sugerir, corregir, insistir', 'Semana, cierre, informe', 'Ser claro e inmediato'], 0),
  q('f4', 'Después de dar feedback conviene…', ['Cambiar de tema', 'Acordar el siguiente paso', 'Repetirlo por correo', 'Esperar a que pregunte'], 1),
]
const PREGUNTAS_SISMOS = [
  q('s1', 'Durante un sismo dentro de la oficina, lo primero es…', ['Correr a la escalera', 'Agacharse, cubrirse y sujetarse', 'Usar el ascensor', 'Salir por la ventana'], 1),
  q('s2', 'El punto de encuentro de la sede Calle 100 es…', ['El sótano', 'El parque del costado norte', 'La recepción', 'El piso 12'], 1),
  q('s3', '¿Quién da la orden de evacuar?', ['Cualquier persona', 'La brigada de emergencias', 'Recursos Humanos', 'El vigilante'], 1),
]
const PREGUNTAS_ACOSO = [
  q('a1', '¿Cuál de estas conductas puede ser acoso laboral?', ['Una corrección en privado', 'Burlas repetidas frente al equipo', 'Una meta exigente', 'Un cambio de horario acordado'], 1),
  q('a2', '¿A dónde se reporta un caso?', ['Al jefe directo siempre', 'Al Comité de Convivencia', 'Por redes sociales', 'A nadie'], 1),
  q('a3', 'El reporte es…', ['Público', 'Confidencial', 'Anónimo solo si hay testigos', 'Obligatoriamente con abogado'], 1),
  q('a4', 'Quien reporta de buena fe…', ['Puede ser sancionado', 'Está protegido contra represalias', 'Pierde su cargo', 'Debe presentar pruebas escritas'], 1),
]
const PREGUNTAS_EXCEL = [
  q('e1', '¿Qué función busca un valor en otra tabla?', ['SUMA', 'BUSCARX', 'CONTAR', 'HOY'], 1),
  q('e2', 'Una tabla dinámica sirve para…', ['Dibujar gráficos 3D', 'Resumir datos sin fórmulas', 'Proteger la hoja', 'Imprimir mejor'], 1),
  q('e3', 'Para contar celdas que cumplen una condición se usa…', ['CONTAR.SI', 'SI.ERROR', 'CONCATENAR', 'REDONDEAR'], 0),
]
const PREGUNTAS_POWERBI = [
  q('b1', 'En Power BI, los datos se limpian en…', ['Power Query', 'El lienzo', 'El panel de filtros', 'La pestaña Ver'], 0),
  q('b2', 'Una medida se escribe en…', ['SQL', 'DAX', 'Python', 'VBA'], 1),
  q('b3', 'Para que dos tablas se filtren entre sí hace falta…', ['Una relación', 'Un gráfico', 'Un marcador', 'Una página nueva'], 0),
]
const PREGUNTAS_SERVICIO = [
  q('v1', 'Ante un cliente molesto, lo primero es…', ['Explicar la política', 'Escuchar sin interrumpir', 'Pasarlo con el jefe', 'Ofrecer un descuento'], 1),
  q('v2', 'Cerrar un caso significa…', ['Colgar la llamada', 'Confirmar que el cliente quedó resuelto', 'Enviar una encuesta', 'Registrar la hora'], 1),
  q('v3', 'El tiempo máximo para responder un correo de cliente es…', ['4 horas hábiles', '2 días', 'Una semana', 'No hay tope'], 0),
]

const PDF_DATOS = [
  'Esta guía explica cómo tratamos los datos personales de clientes, proveedores y colaboradores en Meta Colombia.',
  '1. Qué datos recogemos y para qué. Solo pedimos lo que necesitamos para prestar el servicio y lo decimos antes de pedirlo.',
  '2. La autorización. Todo dato se guarda con una autorización previa, expresa e informada, y la guardamos junto al registro.',
  '3. Derechos del titular. Conocer, actualizar, rectificar y suprimir sus datos, con respuesta en 15 días hábiles.',
]
const PDF_PORTAFOLIO = [
  'Portafolio comercial 2026. Tres líneas de producto, precios de lista y condiciones de pago para el segundo semestre.',
  'Línea Empresas: licencias anuales por usuario con soporte en horario hábil y un gerente de cuenta desde 200 usuarios.',
  'Línea Pymes: planes mensuales sin permanencia. El descuento por pago anual es del 15 % y no se suma a otros.',
]
const PDF_MONTACARGAS = [
  'Manual del operador. Antes de encender el equipo, haz la inspección de 12 puntos y regístrala en la tablet de la zona.',
  'La carga nunca supera la capacidad nominal de la placa. Con carga, la horquilla va baja y se avanza en reversa en rampas.',
]
const PDF_EXCEL = ['Cuaderno de ejercicios. Cada ejercicio trae la base de datos de ventas de ejemplo y la respuesta al final.', 'Ejercicio 1. Con BUSCARX, trae el nombre del asesor de cada venta desde la tabla de personal.']

/* Los 20 contenidos --------------------------------------------------------------------------------------------- */

type Semilla = Omit<Contenido, 'pesos' | 'impacto' | 'grupos' | 'contenidos' | 'origen' | 'trailer' | 'competencias' | 'usaSecciones' | 'navegacion'> &
  Partial<Pick<Contenido, 'pesos' | 'impacto' | 'grupos' | 'contenidos' | 'origen' | 'trailer' | 'competencias' | 'usaSecciones' | 'navegacion'>>

function contenido(semilla: Semilla): Contenido {
  const base: Contenido = {
    pesos: {},
    impacto: 'proteger',
    grupos: [],
    contenidos: [],
    origen: 'manual',
    competencias: [],
    usaSecciones: semilla.secciones.length > 1,
    navegacion: 'Lineal',
    ...semilla,
  }
  // Si no trae pesos, se reparten parejos entre las evaluaciones visibles.
  if (!semilla.pesos) base.pesos = pesosParejos(evaluacionesVisibles(base).map((pagina) => pagina.id))
  return base
}

const SIN_CERTIFICADO = { activo: false, plantilla: 'empresa' }
const CON_CERTIFICADO = { activo: true, plantilla: 'empresa' }

export const SEMILLA: Contenido[] = [
  contenido({
    id: 'proteccion-de-datos',
    titulo: 'Ley de protección de datos personales',
    tipo: 'Curso',
    visibilidad: 'Público',
    descripcion:
      'Qué es un dato personal, qué pide la ley 1581 y cómo cuidamos los datos de clientes y colaboradores en el día a día. Termina con una evaluación y un certificado de cumplimiento.',
    portada: { tono: 'marino', icono: 'glass-shield-done' },
    nivel: 'Intermedio',
    duracion: 45,
    idioma: 'Español',
    categoria: 'Cumplimiento',
    competencias: ['Ética y cumplimiento'],
    secciones: [
      {
        id: 's-datos-1',
        titulo: 'Lo básico de la ley',
        paginas: [
          video('p-datos-1', 'Qué es un dato personal', 6, 'youtube.com/watch?v=datos-basico', 'enlace'),
          texto(
            'p-datos-2',
            'Los principios de la ley 1581',
            'La ley 1581 de 2012 protege el derecho de toda persona a conocer, actualizar y rectificar la información que se tenga de ella. Para nosotros eso se traduce en ocho principios: legalidad, finalidad, libertad, veracidad, transparencia, acceso restringido, seguridad y confidencialidad. En la práctica: pedimos solo lo necesario, decimos para qué, pedimos permiso antes y guardamos todo con acceso restringido.',
          ),
        ],
      },
      {
        id: 's-datos-2',
        titulo: 'Tus obligaciones en el día a día',
        paginas: [
          { ...pdf('p-datos-3', 'Guía de tratamiento de datos', 'Guia-tratamiento-datos-2026.pdf', 2.4, 12, PDF_DATOS), nota: 'Lee las secciones 2 y 3 antes de seguir: la evaluación pregunta por ellas.' },
          embebido('p-datos-4', 'Casos reales para resolver', 'view.genially.com/casos-datos-meta', 'Genially'),
        ],
      },
      {
        id: 's-datos-3',
        titulo: 'Comprueba lo que aprendiste',
        paginas: [
          evaluacion('p-datos-5', 'Repaso rápido', PREGUNTAS_REPASO, 60, 5),
          { ...evaluacion('p-datos-6', 'Evaluación 2025', PREGUNTAS_REPASO.slice(0, 2)), ocultaDesde: '2026-09-02' },
          evaluacion('p-datos-7', 'Evaluación final', PREGUNTAS_DATOS, 80, 3),
        ],
      },
    ],
    certificado: { activo: true, plantilla: 'formal' },
    pesos: { 'p-datos-5': 30, 'p-datos-7': 70 },
    autor: LAURA,
    creado: '2026-05-20',
    actualizado: '2026-09-20T15:10:00',
    publicado: '2026-06-12',
    inscritos: 1284,
    finalizaron: 912,
    calificacion: 4.6,
  }),
  contenido({
    id: 'onboarding-comercial-q3',
    titulo: 'Onboarding comercial Q3',
    tipo: 'Curso',
    visibilidad: 'Público',
    descripcion:
      'Todo lo que un asesor nuevo necesita en su primera semana: el portafolio, cómo cotizar, el CRM y el simulador de cotización. Para la fuerza comercial que entró en el tercer trimestre.',
    portada: { tono: 'azul', icono: 'glass-buy' },
    nivel: 'Básico',
    duracion: 60,
    idioma: 'Español',
    categoria: 'Ventas',
    competencias: ['Orientación al cliente', 'Comunicación'],
    secciones: unaSeccion([
      video('p-com-1', 'Bienvenida del equipo comercial', 4, 'bienvenida-comercial.mp4'),
      pdf('p-com-2', 'Nuestro portafolio 2026', 'Portafolio-comercial-2026.pdf', 8.1, 24, PDF_PORTAFOLIO),
      texto(
        'p-com-3',
        'Cómo cotizar paso a paso',
        'Toda cotización sale del CRM, nunca de una plantilla suelta. Primero registras la oportunidad, después eliges la línea de producto y el plan. El sistema calcula el precio de lista; tú puedes aprobar hasta un 10 % de descuento. Más de eso lo aprueba tu líder desde el mismo CRM. La cotización vence a los 30 días.',
      ),
      scorm('p-com-4', 'Simulador de cotización', 'simulador-cotizacion.zip', 14.2, 15),
      evaluacion('p-com-5', 'Evaluación final', PREGUNTAS_COMERCIAL),
    ]),
    certificado: { activo: true, plantilla: 'ubits' },
    grupos: [],
    autor: ANDRES,
    creado: '2026-07-01',
    actualizado: '2026-09-24T09:30:00',
    publicado: '2026-07-08',
    inscritos: 86,
    finalizaron: 41,
    calificacion: 4.3,
  }),
  contenido({
    id: 'feedback-efectivo',
    titulo: 'Feedback efectivo',
    tipo: 'Curso',
    visibilidad: 'Público',
    descripcion: 'Cómo dar y recibir feedback con el modelo SCI (situación, comportamiento, impacto), con casos para practicar entre líderes.',
    portada: { tono: 'indigo', icono: 'glass-chat' },
    nivel: 'Intermedio',
    duracion: 40,
    idioma: 'Español',
    categoria: 'Liderazgo',
    competencias: ['Liderazgo', 'Comunicación'],
    secciones: unaSeccion([
      video('p-fb-1', 'Por qué el feedback se evita', 7, 'feedback-intro.mp4'),
      presentacion('p-fb-2', 'El modelo SCI con ejemplos', 14, 12),
      video('p-fb-3', 'Un feedback difícil, de principio a fin', 9, 'vimeo.com/feedback-caso', 'enlace'),
      evaluacion('p-fb-4', 'Evaluación final', PREGUNTAS_FEEDBACK),
    ]),
    certificado: CON_CERTIFICADO,
    autor: LAURA,
    creado: '2026-03-02',
    actualizado: '2026-08-30T11:00:00',
    publicado: '2026-03-15',
    inscritos: 342,
    finalizaron: 287,
    calificacion: 4.8,
  }),
  contenido({
    id: 'protocolos-sismos',
    titulo: 'Protocolos de seguridad ante sismos',
    tipo: 'Evento',
    visibilidad: 'Público',
    descripcion: 'Simulacro presencial de evacuación en la sede Calle 100, con la brigada de emergencias. Antes de ir, lee el protocolo; después, responde tres preguntas.',
    portada: { tono: 'rosa', icono: 'glass-danger' },
    nivel: 'Básico',
    duracion: 150,
    idioma: 'Español',
    categoria: 'Seguridad y salud',
    secciones: unaSeccion([
      texto(
        'p-sis-1',
        'Antes del simulacro',
        'Llega 10 minutos antes al piso 4. Lleva zapatos cerrados y deja el computador en tu puesto. La brigada te dirá el recorrido; nadie usa el ascensor. El punto de encuentro es el parque del costado norte.',
      ),
      { id: 'p-sis-2', titulo: 'Simulacro sede Calle 100', recurso: { tipo: 'asistencia', sesion: 'Simulacro sede Calle 100', fecha: '2026-10-08', horario: '9:00 a 11:00 a. m.', lugar: 'Piso 4, sala Andes' } },
      evaluacion('p-sis-3', 'Lo que aprendiste', PREGUNTAS_SISMOS),
    ]),
    certificado: SIN_CERTIFICADO,
    autor: SARA,
    creado: '2026-09-01',
    actualizado: '2026-09-18T16:00:00',
    publicado: '2026-09-05',
    inscritos: 64,
    finalizaron: 0,
  }),
  contenido({
    id: 'excel-analisis',
    titulo: 'Excel para análisis de datos',
    tipo: 'Curso',
    visibilidad: 'Privado',
    descripcion: 'De BUSCARX a las tablas dinámicas: lo que necesitas para cruzar, resumir y presentar datos de ventas sin rehacer todo a mano.',
    portada: { tono: 'verde', icono: 'glass-chart' },
    nivel: 'Intermedio',
    duracion: 180,
    idioma: 'Español',
    categoria: 'Tecnología',
    competencias: ['Pensamiento analítico'],
    secciones: [
      { id: 's-xl-1', titulo: 'Buscar y cruzar', paginas: [video('p-xl-1', 'BUSCARX sin miedo', 18, 'buscarx.mp4'), pdf('p-xl-2', 'Cuaderno de ejercicios', 'Cuaderno-Excel.pdf', 3.2, 18, PDF_EXCEL)] },
      { id: 's-xl-2', titulo: 'Resumir', paginas: [video('p-xl-3', 'Tablas dinámicas', 22, 'tablas-dinamicas.mp4'), video('p-xl-4', 'Segmentaciones y escalas de tiempo', 14, 'segmentaciones.mp4')] },
      { id: 's-xl-3', titulo: 'Presentar', paginas: [video('p-xl-5', 'Gráficos que se entienden', 16, 'graficos.mp4'), evaluacion('p-xl-6', 'Evaluación final', PREGUNTAS_EXCEL)] },
    ],
    certificado: CON_CERTIFICADO,
    grupos: ['Área de tecnología', 'Fuerza comercial'],
    autor: ANDRES,
    creado: '2026-04-10',
    actualizado: '2026-09-10T10:00:00',
    publicado: '2026-04-28',
    inscritos: 158,
    finalizaron: 73,
    calificacion: 4.5,
  }),
  contenido({
    id: 'servicio-al-cliente',
    titulo: 'Servicio al cliente que fideliza',
    tipo: 'Curso',
    visibilidad: 'Público',
    descripcion: 'Escuchar, resolver y cerrar bien: el protocolo de servicio de Meta Colombia con llamadas reales analizadas.',
    portada: { tono: 'cielo', icono: 'glass-heart' },
    nivel: 'Básico',
    duracion: 35,
    idioma: 'Español',
    categoria: 'Servicio al cliente',
    competencias: ['Orientación al cliente'],
    secciones: unaSeccion([
      video('p-sc-1', 'El protocolo en 5 pasos', 8, 'protocolo-servicio.mp4'),
      embebido('p-sc-2', 'Escucha tres llamadas', 'docs.google.com/presentation/llamadas', 'Google Slides'),
      evaluacion('p-sc-3', 'Evaluación final', PREGUNTAS_SERVICIO),
    ]),
    certificado: SIN_CERTIFICADO,
    autor: SARA,
    creado: '2026-02-14',
    actualizado: '2026-07-22T14:00:00',
    publicado: '2026-02-20',
    inscritos: 611,
    finalizaron: 540,
    calificacion: 4.4,
  }),
  contenido({
    id: 'ruta-lideres',
    titulo: 'Liderazgo de primer nivel',
    tipo: 'Ruta de aprendizaje',
    visibilidad: 'Público',
    descripcion: 'El recorrido para quien lidera un equipo por primera vez: feedback, presentaciones, trabajo en equipo y convivencia.',
    portada: { tono: 'indigo', icono: 'glass-ticket-star' },
    nivel: 'Intermedio',
    duracion: 140,
    idioma: 'Español',
    categoria: 'Liderazgo',
    secciones: [],
    contenidos: ['feedback-efectivo', 'presentaciones', 'trabajo-en-equipo', 'prevencion-acoso'],
    certificado: CON_CERTIFICADO,
    autor: LAURA,
    creado: '2026-05-02',
    actualizado: '2026-09-12T08:00:00',
    publicado: '2026-05-10',
    inscritos: 58,
    finalizaron: 19,
    calificacion: 4.7,
  }),
  contenido({
    id: 'como-cargar-cursos',
    titulo: '¿Cómo cargar cursos en LMS?',
    tipo: 'Charla',
    visibilidad: 'Borrador',
    descripcion: 'Un recorrido corto por LMS Creator para quien va a crear su primer curso.',
    portada: { tono: 'azul', icono: 'glass-paper-plus' },
    nivel: 'Básico',
    duracion: 15,
    idioma: 'Español',
    categoria: 'Onboarding',
    secciones: unaSeccion([video('p-lms-1', 'Recorrido por LMS Creator', 9, 'recorrido-lms.mp4')]),
    certificado: SIN_CERTIFICADO,
    autor: YO,
    creado: '2026-09-22',
    actualizado: '2026-09-26T17:40:00',
    inscritos: 0,
    finalizaron: 0,
  }),
  contenido({
    id: 'actualizacion-modulos',
    titulo: 'Actualización de módulos',
    tipo: 'Curso',
    visibilidad: 'Oculto',
    descripcion: 'Qué cambió en los módulos de la plataforma interna este año, para quien ya usaba la versión anterior.',
    portada: { tono: 'cielo', icono: 'glass-setting' },
    nivel: 'Básico',
    duracion: 30,
    idioma: 'Español',
    categoria: 'Tecnología',
    secciones: unaSeccion([video('p-mod-1', 'Lo nuevo en 10 minutos', 10, 'novedades-modulos.mp4'), pdf('p-mod-2', 'Notas de la versión', 'Notas-version-4.pdf', 1.1, 6, ['Notas de la versión 4.0 de la plataforma interna.'])]),
    certificado: SIN_CERTIFICADO,
    autor: ANDRES,
    creado: '2026-01-10',
    actualizado: '2026-06-02T10:00:00',
    publicado: '2026-01-15',
    inscritos: 402,
    finalizaron: 377,
  }),
  contenido({
    id: 'trabajo-en-equipo',
    titulo: 'Trabajo en equipo',
    tipo: 'Curso',
    visibilidad: 'Privado',
    descripcion: 'Acuerdos, roles y conversaciones difíciles: cómo trabajan mejor los equipos que se reparten un mismo objetivo.',
    portada: { tono: 'verde', icono: 'glass-profile' },
    nivel: 'Básico',
    duracion: 30,
    idioma: 'Español',
    categoria: 'Habilidades blandas',
    competencias: ['Trabajo en equipo'],
    secciones: unaSeccion([video('p-te-1', 'Qué hace funcionar a un equipo', 8, 'equipos.mp4'), presentacion('p-te-2', 'Acuerdos de equipo', 10, 10)]),
    certificado: CON_CERTIFICADO,
    grupos: ['Líderes de primer nivel'],
    autor: SARA,
    creado: '2026-04-01',
    actualizado: '2026-08-11T09:00:00',
    publicado: '2026-04-05',
    inscritos: 97,
    finalizaron: 64,
    calificacion: 4.2,
  }),
  contenido({
    id: 'montacargas',
    titulo: 'Manejo seguro de montacargas',
    tipo: 'Curso',
    visibilidad: 'Borrador',
    descripcion: 'La inspección de 12 puntos, la carga segura y las reglas de circulación en planta para operadores nuevos de la planta Funza.',
    portada: { tono: 'rosa', icono: 'glass-danger' },
    nivel: 'Básico',
    duracion: 50,
    idioma: 'Español',
    categoria: 'Seguridad y salud',
    secciones: unaSeccion([video('p-mc-1', 'La inspección de 12 puntos', 11, 'inspeccion-montacargas.mp4'), pdf('p-mc-2', 'Manual del operador', 'Manual-operador-montacargas.pdf', 5.6, 32, PDF_MONTACARGAS)]),
    certificado: SIN_CERTIFICADO,
    autor: YO,
    creado: '2026-09-15',
    actualizado: '2026-09-25T12:20:00',
    inscritos: 0,
    finalizaron: 0,
  }),
  contenido({
    id: 'ruta-induccion',
    titulo: 'Inducción a la cultura Meta',
    tipo: 'Ruta de aprendizaje',
    visibilidad: 'Público',
    descripcion: 'La ruta que toma toda persona nueva en su primer mes: quiénes somos, cómo cuidamos los datos, la convivencia y el bienestar.',
    portada: { tono: 'azul', icono: 'glass-home' },
    nivel: 'Básico',
    duracion: 125,
    idioma: 'Español',
    categoria: 'Onboarding',
    secciones: [],
    contenidos: ['onboarding-comercial-q3', 'proteccion-de-datos', 'prevencion-acoso', 'pausas-activas'],
    certificado: CON_CERTIFICADO,
    autor: YO,
    creado: '2026-02-01',
    actualizado: '2026-09-02T10:00:00',
    publicado: '2026-02-03',
    inscritos: 212,
    finalizaron: 133,
    calificacion: 4.5,
  }),
  contenido({
    id: 'negociacion-proveedores',
    titulo: 'Negociación con proveedores',
    tipo: 'Curso',
    visibilidad: 'Borrador',
    descripcion: '',
    portada: null,
    nivel: 'Intermedio',
    duracion: 0,
    idioma: 'Español',
    categoria: null,
    secciones: unaSeccion([]),
    certificado: SIN_CERTIFICADO,
    autor: YO,
    creado: '2026-09-26',
    actualizado: '2026-09-26T18:05:00',
    inscritos: 0,
    finalizaron: 0,
  }),
  contenido({
    id: 'prevencion-acoso',
    titulo: 'Prevención del acoso laboral',
    tipo: 'Curso',
    visibilidad: 'Público',
    descripcion: 'Qué es y qué no es acoso laboral, cómo se reporta al Comité de Convivencia y cómo te protege la ley 1010 si lo haces.',
    portada: { tono: 'marino', icono: 'glass-shield-done' },
    nivel: 'Básico',
    duracion: 25,
    idioma: 'Español',
    categoria: 'Cumplimiento',
    competencias: ['Ética y cumplimiento'],
    secciones: unaSeccion([video('p-ac-1', 'Qué dice la ley 1010', 7, 'ley-1010.mp4'), texto('p-ac-2', 'Cómo reportar un caso', 'El reporte va al Comité de Convivencia por el formulario confidencial de la intranet o por correo a convivencia@meta.co. El comité responde en diez días hábiles y quien reporta de buena fe está protegido contra represalias.'), evaluacion('p-ac-3', 'Evaluación final', PREGUNTAS_ACOSO)]),
    certificado: CON_CERTIFICADO,
    autor: LAURA,
    creado: '2025-11-20',
    actualizado: '2026-08-20T10:00:00',
    publicado: '2025-12-01',
    inscritos: 1311,
    finalizaron: 1180,
    calificacion: 4.1,
  }),
  contenido({
    id: 'presentaciones',
    titulo: 'Presentaciones que convencen',
    tipo: 'Charla',
    visibilidad: 'Público',
    descripcion: 'Una charla de 20 minutos sobre cómo armar una presentación de resultados que tu jefe entienda en la primera diapositiva.',
    portada: { tono: 'cielo', icono: 'glass-gallery' },
    nivel: 'Básico',
    duracion: 20,
    idioma: 'Español',
    categoria: 'Habilidades blandas',
    competencias: ['Comunicación'],
    secciones: unaSeccion([video('p-pr-1', 'La charla completa', 20, 'presentaciones-charla.mp4')]),
    certificado: SIN_CERTIFICADO,
    autor: SARA,
    creado: '2026-06-01',
    actualizado: '2026-06-03T10:00:00',
    publicado: '2026-06-03',
    inscritos: 233,
    finalizaron: 201,
    calificacion: 4.9,
  }),
  contenido({
    id: 'seguridad-informacion-2024',
    titulo: 'Seguridad de la información 2024',
    tipo: 'Curso',
    visibilidad: 'Archivado',
    descripcion: 'La versión 2024 del curso de seguridad de la información. Reemplazado por la versión 2026.',
    portada: { tono: 'marino', icono: 'glass-lock' },
    nivel: 'Básico',
    duracion: 30,
    idioma: 'Español',
    categoria: 'Tecnología',
    secciones: unaSeccion([video('p-si-1', 'Contraseñas y phishing', 12, 'seguridad-2024.mp4')]),
    certificado: CON_CERTIFICADO,
    autor: ANDRES,
    creado: '2024-02-01',
    actualizado: '2026-01-05T10:00:00',
    publicado: '2024-02-10',
    inscritos: 988,
    finalizaron: 901,
  }),
  contenido({
    id: 'primeros-auxilios',
    titulo: 'Primeros auxilios básicos',
    tipo: 'Evento',
    visibilidad: 'Privado',
    descripcion: 'Taller práctico con la Cruz Roja para la brigada de la planta Funza: reanimación, heridas y cómo actuar mientras llega la ayuda.',
    portada: { tono: 'rosa', icono: 'glass-heart' },
    nivel: 'Básico',
    duracion: 240,
    idioma: 'Español',
    categoria: 'Seguridad y salud',
    secciones: unaSeccion([
      { id: 'p-pa-1', titulo: 'Taller en planta', recurso: { tipo: 'asistencia', sesion: 'Taller con la Cruz Roja', fecha: '2026-10-15', horario: '8:00 a. m. a 12:00 m.', lugar: 'Planta Funza, auditorio' } },
    ]),
    certificado: CON_CERTIFICADO,
    grupos: ['Operaciones planta Funza'],
    autor: SARA,
    creado: '2026-09-10',
    actualizado: '2026-09-21T10:00:00',
    publicado: '2026-09-12',
    inscritos: 24,
    finalizaron: 0,
  }),
  contenido({
    id: 'power-bi',
    titulo: 'Power BI desde cero',
    tipo: 'Curso',
    visibilidad: 'Público',
    descripcion: 'De la hoja de Excel al tablero: cargar, limpiar, relacionar y publicar tus datos en Power BI.',
    portada: { tono: 'verde', icono: 'glass-graph' },
    nivel: 'Avanzado',
    duracion: 240,
    idioma: 'Español',
    categoria: 'Tecnología',
    competencias: ['Pensamiento analítico'],
    secciones: [
      { id: 's-bi-1', titulo: 'Cargar y limpiar', paginas: [video('p-bi-1', 'Power Query', 25, 'power-query.mp4')] },
      { id: 's-bi-2', titulo: 'Modelar', paginas: [video('p-bi-2', 'Relaciones y DAX', 30, 'dax.mp4')] },
      { id: 's-bi-3', titulo: 'Publicar', paginas: [video('p-bi-3', 'Tu primer tablero', 28, 'tablero.mp4'), evaluacion('p-bi-4', 'Evaluación final', PREGUNTAS_POWERBI)] },
    ],
    certificado: CON_CERTIFICADO,
    autor: ANDRES,
    creado: '2026-03-20',
    actualizado: '2026-09-15T10:00:00',
    publicado: '2026-04-01',
    inscritos: 276,
    finalizaron: 88,
    calificacion: 4.6,
  }),
  contenido({
    id: 'atencion-reclamos',
    titulo: 'Atención de reclamos',
    tipo: 'Curso',
    visibilidad: 'Borrador',
    descripcion: 'Cómo recibir, registrar y resolver un reclamo en los tiempos de ley, sin que el cliente tenga que repetir su historia.',
    portada: null,
    nivel: 'Básico',
    duracion: 30,
    idioma: 'Español',
    categoria: 'Servicio al cliente',
    secciones: unaSeccion([
      video('p-rc-1', 'Qué es un reclamo y qué no', 6, 'reclamos-intro.mp4'),
      texto('p-rc-2', 'Los tiempos de respuesta', 'Un reclamo se responde en máximo 15 días hábiles. Si necesitas más tiempo, avisas al cliente antes del día 15 y le dices cuándo tendrá respuesta. Cada contacto queda registrado en el caso.'),
      embebido('p-rc-3', 'El flujo de un reclamo', 'www.canva.com/design/flujo-reclamos', 'Canva'),
      evaluacion('p-rc-4', 'Evaluación final', []),
    ]),
    certificado: SIN_CERTIFICADO,
    autor: YO,
    creado: '2026-09-18',
    actualizado: '2026-09-23T11:15:00',
    inscritos: 0,
    finalizaron: 0,
  }),
  contenido({
    id: 'pausas-activas',
    titulo: 'Bienestar y pausas activas',
    tipo: 'Charla',
    visibilidad: 'Oculto',
    descripcion: 'Cinco pausas de dos minutos para hacer en el puesto, guiadas por la fisioterapeuta de la ARL.',
    portada: { tono: 'verde', icono: 'glass-activity' },
    nivel: 'Básico',
    duracion: 12,
    idioma: 'Español',
    categoria: 'Seguridad y salud',
    secciones: unaSeccion([video('p-pa-v', 'Pausas guiadas', 12, 'pausas-activas.mp4')]),
    certificado: SIN_CERTIFICADO,
    autor: SARA,
    creado: '2026-01-20',
    actualizado: '2026-05-10T10:00:00',
    publicado: '2026-01-22',
    inscritos: 745,
    finalizaron: 690,
    calificacion: 4.0,
  }),
]

// Un contenido nuevo, en borrador, con todo por hacer: lo crean las tres exploraciones al elegir qué crear.
export function contenidoNuevo(tipo: TipoContenido, parcial: Partial<Contenido> = {}): Contenido {
  const ahora = new Date().toISOString()
  return {
    id: nuevoId('c'),
    titulo: '',
    tipo,
    visibilidad: 'Borrador',
    descripcion: '',
    portada: null,
    nivel: 'Básico',
    duracion: 0,
    idioma: 'Español',
    categoria: null,
    competencias: [],
    usaSecciones: false,
    secciones: tipo === 'Ruta de aprendizaje' ? [] : unaSeccion([]),
    certificado: { activo: false, plantilla: 'empresa' },
    navegacion: 'Lineal',
    pesos: {},
    impacto: 'proteger',
    grupos: [],
    contenidos: [],
    autor: YO,
    creado: ahora,
    actualizado: ahora,
    inscritos: 0,
    finalizaron: 0,
    origen: 'manual',
    ...parcial,
  }
}

// Una página nueva con su recurso: si no trae título, se llama como el recurso (RN-03c).
export const paginaNueva = (recurso: Recurso, titulo = ''): Pagina => ({ id: nuevoId('p'), titulo: titulo.trim() || TIPOS_PAGINA[recurso.tipo].nombre, recurso })
