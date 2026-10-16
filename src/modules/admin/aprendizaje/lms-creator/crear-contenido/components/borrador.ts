// Estado del asistente «Crear contenido»: lo que el creador va llenando en los cuatro pasos.
//
// Vive en la sesión del navegador (sessionStorage) y no en la pantalla, porque el flujo sale y vuelve: el video con IA,
// la presentación interactiva y los recursos con URL propia (/agregar-recurso/pdf…) son pantallas aparte que al
// terminar devuelven su resultado al asistente. Al cerrar la pestaña se pierde, como en el prototipo de referencia.

import { useSyncExternalStore } from 'react'
import { CONTENIDOS } from '@/shared/bd'
import type { SeccionPreguntas } from './evaluacion/secciones'

// ── Tipos ────────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Qué se está creando. El asistente es el mismo para los tres —mismos pasos, mismo marco, misma salida— y lo que
 * cambia es poco: el evento no elige tipo (va implícito) y la ruta, además, no pide tiempo —lo suma de sus
 * contenidos— y en el paso 2 arma una lista de contenidos en vez de páginas (HU-LMS-001, HU-LMS-020, HU-LMS-013).
 *
 * Son tres clases del mismo asistente y no tres asistentes: cuando dos piezas casi iguales viven separadas, se
 * desincronizan sin que nadie lo note (Dave, 2-oct).
 */
export type ClaseCreacion = 'contenido' | 'evento' | 'ruta'

export type Visibilidad = 'borrador' | 'publico' | 'privado' | 'oculto'
export type TipoNavegacion = 'lineal' | 'libre'
export type PanelAjustes = 'hub' | 'visibilidad' | 'pesos' | 'navegacion'

export type TipoRecurso =
  | 'video'
  | 'pdf'
  | 'texto'
  | 'embebido'
  | 'scorm'
  | 'presentacion-interactiva'
  | 'evaluacion-final'
  | 'encuesta-libre'
  | 'encuesta-satisfaccion'
  | 'roleplay'
  | 'asistencia'

export type TipoPregunta =
  | 'multiple_choice_single'
  | 'multiple_choice_multiple'
  | 'true_false'
  | 'instruction'
  | 'short_answer'
  | 'essay'
  | 'matching'
  | 'fill_blank'
  | 'rating_scale'
  /** Solo en encuestas: las estrellas. Reusa el objeto `escala` (su `maximo` es cuántas estrellas). */
  | 'rating_stars'
  /** Solo en encuestas: recomendabilidad de 0 a 10. */
  | 'nps'
  /** Solo en encuestas: cinco caras. */
  | 'emoji'
  /** Solo en encuestas: las opciones en una lista desplegable. */
  | 'dropdown'

export type Pregunta = {
  id: string
  tipo: TipoPregunta
  enunciado: string
  /** Instrucción: HTML del mini editor. */
  instruccion: string
  opciones: { texto: string; correcta: boolean }[]
  /** Verdadero / Falso: 'true', 'false' o '' sin elegir. */
  verdaderoFalso: string
  respuestaCorta: { respuesta: string; exactitud: 'exact' | 'ignore_accents' | 'any' }
  ensayo: { minimoPalabras: string }
  parejas: { a: string; b: string }[]
  palabraFaltante: { opciones: string[] }
  escala: { minimo: string; maximo: string; etiquetaMinimo: string; etiquetaMaximo: string }
  generadaConIA?: boolean
}

export type ConfigEvaluacion = {
  /** Porcentaje requerido para aprobar. */
  aprobacion: number
  preguntasAleatorias: boolean
  opcionesAleatorias: boolean
  limitarIntentos: boolean
  intentos: number
  tiempoLimite: boolean
  minutos: number
  limitarPreguntas: boolean
  preguntasPorIntento: number
}

export const CONFIG_EVALUACION: ConfigEvaluacion = {
  aprobacion: 70,
  preguntasAleatorias: false,
  opcionesAleatorias: false,
  limitarIntentos: false,
  intentos: 3,
  tiempoLimite: false,
  minutos: 30,
  limitarPreguntas: false,
  preguntasPorIntento: 5,
}

export type Recurso = {
  tipo: TipoRecurso
  /** Dirección del archivo o del enlace (video, PDF, SCORM, embebido). */
  src?: string
  /** Nombre del archivo que se subió (PDF, SCORM, video). */
  archivo?: string
  /** HTML del recurso Texto. */
  html?: string
  /** Código embebido (iframe pegado) cuando no es un enlace. */
  codigo?: string
  generadoConIA?: boolean
  /** Generándose en segundo plano (video o presentación con IA). */
  generando?: boolean
  /** PDF: los colaboradores lo pueden descargar. */
  permitirDescarga?: boolean
  /** Evaluación: preguntas y ajustes. */
  /**
   * Las preguntas en plano, en el orden en que se responden. Es el **espejo** de `secciones`: lo que leen la vista
   * del colaborador, el conteo del índice y la calificación, que no necesitan saber de secciones. Lo escribe siempre
   * el editor junto con el árbol; nadie lo toca por su cuenta.
   */
  preguntas?: Pregunta[]
  /** Las preguntas agrupadas por tema. Ver `evaluacion/secciones.ts`. */
  secciones?: SeccionPreguntas[]
  config?: ConfigEvaluacion
  /** Presentación interactiva: diapositivas generadas. */
  diapositivas?: Diapositiva[]
  /** Video con IA: id del proyecto en «Tus videos recientes». */
  proyectoVideoId?: string
  /** Video: cómo nació (para decidir qué abre «Reemplazar» o «Editar video»). */
  origenVideo?: 'enlace' | 'subido' | 'ia' | 'avatar'
  /** Roleplay: configuración del evaluador. */
  roleplay?: RoleplayConfig
  /** Roleplay armado con el asistente de IA (MLP, `agregar-roleplay`); sin esto es el MVP a mano. */
  /** @deprecated Quedó de cuando había dos roleplays (MVP y MLP). Se fusionaron el 5-oct; ya no decide nada. */
  roleplayIa?: boolean
  /** Presentación interactiva: los datos del editor (los define su flujo en agregar-presentacion-interactiva). */
  presentacion?: unknown
  /** Video con IA: el proyecto de escenas (lo define su flujo en agregar-video). */
  videoIA?: unknown
  /** Asistencia (solo en eventos): instrucciones y sesiones. */
  asistencia?: DatosAsistencia
}

export type Diapositiva = { id: string; tipo: string; titulo: string; texto: string; imagen?: string }

export type RoleplayConfig = {
  titulo: string
  escenario: string
  nombrePersonaje: string
  identidadPersonaje: string
  voz: string
  imagen: string
  personalidad: string
  mensajeBienvenida: string
  papelColaborador: string
  objetivos: { id: string; texto: string }[]
  modo: 'practica' | 'evaluacion'
  objetivosParaAprobar: number
  duracionMin: 3 | 5 | 10
  intentos: 1 | 2 | 3
  modoTexto: boolean
}

export type SesionAsistencia = { id: string; nombre: string; fecha: string; inicio: string; fin: string; descripcion: string }

export type DatosAsistencia = { instrucciones: string; autoasistencia: boolean; sesiones: SesionAsistencia[] }

export type Complementarios = {
  /** Orden en que se agregaron: texto y archivo descargable. */
  orden: ('texto' | 'archivo')[]
  texto: string
  archivo?: { nombre: string; peso: string }
}

export type Pagina = {
  id: string
  titulo: string
  recurso?: Recurso
  complementarios?: Complementarios
  /** Evaluaciones ocultas: pesan 0 % (HU-LMS-019). */
  oculta?: boolean
  ocultaDesde?: string
}

export type Seccion = { id: string; titulo: string; descripcion: string; paginas: Pagina[] }

export type Portada = {
  titulo: string
  imagen: string
  imagenIA: boolean
  promptIA: string
  trailer: string
  descripcion: string
  tipo: string
  nivel: string
  idioma: string
  tiempo: string
  unidad: 'min' | 'h'
  categoria: string
}

export type Borrador = {
  /** Crear evento reutiliza el asistente: sin tipo en la ficha y con Asistencia en Recursos. */
  evento: boolean
  /** Crear ruta reutiliza el asistente: sin tipo ni tiempo en la ficha y con contenidos en vez de páginas. */
  ruta: boolean
  /** Solo en una ruta: los contenidos del catálogo que la componen, **en el orden del recorrido** (RN-01, RN-03). */
  contenidos: string[]
  portada: Portada
  seccionesHabilitadas: boolean
  /** Con las secciones apagadas hay una sola, invisible, con id `default`. */
  secciones: Seccion[]
  paginaActiva: string | null
  certificado: { habilitado: boolean; plantilla: string }
  visibilidad: Visibilidad
  borradorBloqueado: boolean
  colaboradores: string[]
  pesos: Record<string, number>
  navegacion: TipoNavegacion
  tokens: number
  /** Proyectos de video con IA sin generar: «Tus videos recientes» y Recursos IA. */
  videosRecientes: VideoReciente[]
  /**
   * Lo que el setup del roleplay dejó listo para el paso a paso: la configuración y si vino de la IA. El formulario
   * lo consume al abrir y lo borra; no es parte del contenido.
   */
  roleplayPropuesto?: {
    cfg: RoleplayConfig
    conIA: boolean
    /** La idea que se escribió en la puerta. */
    idea?: string
    /** El borrador propio que se está retomando, para guardar encima y no duplicarlo. */
    guardadoId?: string
  } | null
  /** Configuración de evaluación: una sola para todo el contenido, como en el prototipo. */
  configEvaluacion: ConfigEvaluacion
  /** A qué sección va (o qué página llena) el recurso que se está creando en otra pantalla. */
  intencion: Intencion | null
  /** Al volver de un flujo con «Volver», el asistente reabre «Añadir página». */
  reabrirAnadir: boolean
  /** Generaciones en segundo plano (panel «Generando recursos») y avisos «Ver página». */
  trabajos: Trabajo[]
}

export type Intencion = { seccionId: string; titulo: string; tipo: TipoRecurso; paginaId?: string }

export type Trabajo = {
  id: string
  paginaId: string
  tipo: 'video' | 'presentacion'
  estado: 'cargando' | 'listo' | 'error'
  progreso: number
  /** Ya se mostró (o se descartó) su aviso «Ver página». */
  avisado: boolean
  inicio: number
  /** Cuánto tarda la generación simulada, en ms. */
  duracion: number
  /** Lo que se le aplica al recurso de la página al terminar (p. ej. `{ generando: false, src }`). */
  resultado: Partial<Recurso>
}

export type VideoReciente = {
  id: string
  titulo: string
  estado: 'editando' | 'listo'
  miniatura: string
  src?: string
  actualizado: string
}

// ── Valores ──────────────────────────────────────────────────────────────────────────────────────────────────────

export const TOKENS_INICIALES = 500_000

export const COSTO = { portada: 50, imagenAviso: 50, guion: 80, video: 320, evaluacion: 80, avatar: 100, presentacion: 320 }

export const PORTADA_VACIA: Portada = {
  titulo: '',
  imagen: '',
  imagenIA: false,
  promptIA: '',
  trailer: '',
  descripcion: '',
  tipo: 'tct-001',
  nivel: 'niv-001',
  idioma: 'es',
  tiempo: '30',
  unidad: 'min',
  categoria: '',
}

/**
 * Nada tocado: el borrador está igual que al abrir el asistente. Sirve para dejar salir sin preguntar a quien solo
 * entró a mirar. Se ignora lo que no escribe el creador: el saldo de tokens, los videos recientes, los trabajos de
 * IA en curso y cuál página está abierta.
 */
/** Qué clase de borrador es este: lo que decide los textos, los campos de la ficha y qué pasa en el paso 2. */
export function claseDe(b: Borrador): ClaseCreacion {
  return b.ruta ? 'ruta' : b.evento ? 'evento' : 'contenido'
}

export function sinTocar(b: Borrador, clase: ClaseCreacion = 'contenido'): boolean {
  const comparable = (x: Borrador) => {
    const { tokens: _tokens, videosRecientes: _videos, trabajos: _trabajos, paginaActiva: _pagina, roleplayPropuesto: _rp, ...resto } = x
    return JSON.stringify(resto)
  }
  return comparable(b) === comparable(borradorVacio(clase))
}

export function borradorVacio(clase: ClaseCreacion = 'contenido'): Borrador {
  return {
    evento: clase === 'evento',
    ruta: clase === 'ruta',
    contenidos: [],
    portada: { ...PORTADA_VACIA },
    seccionesHabilitadas: false,
    secciones: [{ id: 'default', titulo: '', descripcion: '', paginas: [] }],
    paginaActiva: null,
    certificado: { habilitado: true, plantilla: 'tpl-doble-firma' },
    visibilidad: 'borrador',
    borradorBloqueado: false,
    colaboradores: [],
    pesos: {},
    navegacion: 'lineal',
    tokens: TOKENS_INICIALES,
    videosRecientes: [],
    roleplayPropuesto: null,
    configEvaluacion: { ...CONFIG_EVALUACION },
    intencion: null,
    reabrirAnadir: false,
    trabajos: [],
  }
}

// ── Almacén ──────────────────────────────────────────────────────────────────────────────────────────────────────

const CLAVE = 'playground:lms-crear-contenido'
const oyentes = new Set<() => void>()
let actual: Borrador | null = null

/**
 * Un borrador guardado con el ejemplo viejo (28 sep): traía una página oculta —en la creación no se pueden ocultar
 * páginas, eso es de la edición— y un SCORM de diapositivas que no era un SCORM real. Nada de lo que hace el creador
 * produce eso, así que si aparece es el ejemplo de antes: se descarta y el asistente carga el ejemplo nuevo.
 */
function esEjemploViejo(b: Borrador) {
  return (b.secciones ?? []).some((s) => (s.paginas ?? []).some((p) => p.oculta || p.recurso?.src?.includes('thomas-kilmann-scorm')))
}

function leer(): Borrador {
  if (actual) return actual
  try {
    const guardado = window.sessionStorage.getItem(CLAVE)
    // El roleplay guardaba el papel de quien practica como `papelEstudiante`; al pasar todo a «colaborador» (Dave,
    // 8-oct) un borrador abierto habría perdido ese texto, así que al leerlo se acepta el nombre viejo.
    const crudo = guardado ? guardado.replaceAll('"papelEstudiante"', '"papelColaborador"') : null
    const previo = crudo ? { ...borradorVacio(), ...(JSON.parse(crudo) as Borrador) } : null
    actual = previo && !esEjemploViejo(previo) ? previo : borradorVacio()
  } catch {
    actual = borradorVacio()
  }
  return actual
}

function escribir(siguiente: Borrador) {
  actual = siguiente
  try {
    window.sessionStorage.setItem(CLAVE, JSON.stringify(siguiente))
  } catch {
    // Sin almacenamiento el asistente sigue funcionando; solo no sobrevive a una recarga.
  }
  oyentes.forEach((oyente) => oyente())
}

export function getBorrador() {
  return leer()
}

export function setBorrador(cambio: Partial<Borrador> | ((previo: Borrador) => Partial<Borrador>)) {
  const previo = leer()
  const parcial = typeof cambio === 'function' ? cambio(previo) : cambio
  escribir({ ...previo, ...parcial })
}

export function reemplazarBorrador(siguiente: Borrador) {
  escribir(siguiente)
}

export function useBorrador() {
  return useSyncExternalStore(
    (oyente) => {
      oyentes.add(oyente)
      return () => oyentes.delete(oyente)
    },
    leer,
    leer,
  )
}

// ── Ayudas sobre el índice ───────────────────────────────────────────────────────────────────────────────────────

let consecutivo = 0
export const nuevoId = (prefijo: string) => `${prefijo}-${Date.now().toString(36)}-${(consecutivo++).toString(36)}`

/** Secciones que se muestran en el índice: todas menos `default` si hay secciones; si no, solo `default`. */
export function seccionesVisibles(b: Borrador) {
  return b.seccionesHabilitadas ? b.secciones.filter((s) => s.id !== 'default') : b.secciones.filter((s) => s.id === 'default')
}

export function todasLasPaginas(b: Borrador) {
  return seccionesVisibles(b).flatMap((s) => s.paginas)
}

export function buscarPagina(b: Borrador, id: string | null) {
  if (!id) return undefined
  for (const seccion of b.secciones) {
    const pagina = seccion.paginas.find((p) => p.id === id)
    if (pagina) return { seccion, pagina }
  }
  return undefined
}

export function actualizarPagina(id: string, cambio: Partial<Pagina> | ((p: Pagina) => Partial<Pagina>)) {
  setBorrador((b) => ({
    secciones: b.secciones.map((s) => ({
      ...s,
      paginas: s.paginas.map((p) => (p.id === id ? { ...p, ...(typeof cambio === 'function' ? cambio(p) : cambio) } : p)),
    })),
  }))
}

export function gastarTokens(costo: number) {
  const b = leer()
  if (b.tokens < costo) return false
  setBorrador({ tokens: b.tokens - costo })
  return true
}

export const formatoTokens = (n: number) => n.toLocaleString('es-CO')

// ── Validaciones ─────────────────────────────────────────────────────────────────────────────────────────────────

export const textoPlano = (html: string) =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim()

export function faltantesPortada(p: Portada, clase: ClaseCreacion = 'contenido') {
  const faltan = new Set<string>()
  if (!p.titulo.trim()) faltan.add('titulo')
  if (!p.imagen) faltan.add('imagen')
  if (!textoPlano(p.descripcion)) faltan.add('descripcion')
  // En un evento el tipo va implícito; en una ruta, también —es una ruta—. La categoría nunca es obligatoria.
  if (clase === 'contenido' && !p.tipo) faltan.add('tipo')
  if (!p.nivel) faltan.add('nivel')
  if (!p.idioma) faltan.add('idioma')
  // La ruta no pide tiempo: lo suma de los contenidos que lleve dentro, y pedirlo a mano sería pedir un dato que el
  // sistema ya sabe y que se desactualiza al cambiar la lista.
  if (clase !== 'ruta') {
    const tiempo = Number(p.tiempo.replace(',', '.'))
    if (!(tiempo > 0)) faltan.add('tiempo')
    if (!p.unidad) faltan.add('unidad')
  }
  return faltan
}

/** Lo que dura una ruta: la suma de sus contenidos, en minutos (no se escribe a mano). */
export function minutosDeRuta(b: Borrador) {
  return b.contenidos.reduce((total, id) => total + (CONTENIDOS.find((c) => c.id === id)?.minutos ?? 0), 0)
}

export const esEvaluacion = (p: Pagina) => p.recurso?.tipo === 'evaluacion-final'

/** Las dos encuestas: comparten el editor y la forma de responderse, pero no se califican. */
export const esEncuesta = (p: Pagina) => p.recurso?.tipo === 'encuesta-libre' || p.recurso?.tipo === 'encuesta-satisfaccion'

/** Lo que se arma con preguntas: la evaluación y las dos encuestas. */
export const conPreguntas = (p: Pagina) => esEvaluacion(p) || esEncuesta(p)

/**
 * La página que no deja crear el contenido mientras no tenga preguntas: la evaluación y la encuesta libre (las dos las
 * escribe el creador). La de satisfacción no entra: sus preguntas son fijas de UBITS (Dave, 14-oct).
 */
export const faltanPreguntas = (p: Pagina) => (esEvaluacion(p) || p.recurso?.tipo === 'encuesta-libre') && !(p.recurso?.preguntas ?? []).length

/** Cómo se nombra una página sin título en los avisos de preguntas que faltan. */
export const nombreSinTitulo = (p: Pagina) => p.titulo.trim() || (p.recurso?.tipo === 'encuesta-libre' ? 'Encuesta libre' : 'Evaluación')

export const tituloValido = (t: string) => Boolean(t.trim()) && t.trim().toLowerCase() !== 'sin título'

export type ErrorRecursos = { mensaje: string; paginas: string[]; secciones: string[] } | null

export function validarRecursos(b: Borrador): ErrorRecursos {
  const secciones = seccionesVisibles(b)
  const paginas = secciones.flatMap((s) => s.paginas)
  if (!paginas.length) return { mensaje: 'Añade al menos una página para continuar.', paginas: [], secciones: [] }
  const sinTitulo = paginas.filter((p) => !tituloValido(p.titulo)).map((p) => p.id)
  if (sinTitulo.length)
    return { mensaje: 'Todas las páginas deben tener un título. Revisa las marcadas en rojo.', paginas: sinTitulo, secciones: [] }
  const sinRecurso = paginas.filter((p) => !p.recurso).map((p) => p.id)
  if (sinRecurso.length)
    return {
      mensaje: 'Todas las páginas deben tener al menos un recurso. Revisa las marcadas en rojo.',
      paginas: sinRecurso,
      secciones: [],
    }
  if (b.seccionesHabilitadas) {
    const vacias = secciones.filter((s) => !s.paginas.length).map((s) => s.id)
    if (vacias.length)
      return {
        mensaje: 'Toda sección debe tener al menos una página. Revisa las secciones marcadas en rojo.',
        paginas: [],
        secciones: vacias,
      }
  }
  return null
}

// ── Pesos de evaluación (HU-LMS-019) ─────────────────────────────────────────────────────────────────────────────

export type ItemPeso = { id: string; titulo: string; oculta: boolean; ocultaDesde?: string }

export function evaluaciones(b: Borrador): ItemPeso[] {
  return todasLasPaginas(b)
    .filter(esEvaluacion)
    .map((p) => ({ id: p.id, titulo: p.titulo.trim() || 'Evaluación', oculta: Boolean(p.oculta), ocultaDesde: p.ocultaDesde }))
}

/** Reparte 100 en partes enteras entre las visibles (el resto va a las primeras: 34/33/33). */
export function repartirPesos(items: ItemPeso[]) {
  const visibles = items.filter((i) => !i.oculta)
  const base = visibles.length ? Math.floor(100 / visibles.length) : 0
  let resto = visibles.length ? 100 - base * visibles.length : 0
  const pesos: Record<string, number> = {}
  for (const item of items) {
    if (item.oculta) pesos[item.id] = 0
    else {
      pesos[item.id] = base + (resto > 0 ? 1 : 0)
      resto -= 1
    }
  }
  return pesos
}

/** Si cambió el conjunto de evaluaciones (alta, baja, ocultar), se reparte de nuevo; si no, se conservan. */
export function pesosSincronizados(b: Borrador) {
  const items = evaluaciones(b)
  const claves = items.map((i) => `${i.id}:${i.oculta ? 1 : 0}`).sort().join('|')
  const previas = Object.keys(b.pesos)
    .map((id) => `${id}:${items.find((i) => i.id === id)?.oculta ? 1 : 0}`)
    .sort()
    .join('|')
  const mismas = claves === previas && items.every((i) => i.id in b.pesos)
  return { items, pesos: mismas ? b.pesos : repartirPesos(items) }
}

export function sumaPesos(items: ItemPeso[], pesos: Record<string, number>) {
  return items.filter((i) => !i.oculta).reduce((total, i) => total + (pesos[i.id] ?? 0), 0)
}

// ── Flujos de recurso ────────────────────────────────────────────────────────────────────────────────────────────
//
// Cada recurso se crea en su propia pantalla o modal y, al confirmarse, entrega su resultado aquí: si venía de «Añadir
// página» nace una página al final de su sección; si venía de «Reemplazar» o «Editar», se llena la página que ya
// existía. Si se abandona sin confirmar no nace nada (HU-LMS-001, RN-02).

export const BASE_LMS = '/admin/aprendizaje/lms-creator'
export const RUTA_CONTENIDOS = '/admin/aprendizaje/lms-creator/contenidos'

export const rutaAsistente = (b: Borrador = leer()) => `${BASE_LMS}/${b.evento ? 'crear-evento' : 'crear-contenido'}`

/** Nombre del recurso principal: el título de la página cuando el creador no escribió uno (RN-03c). */
export const NOMBRE_RECURSO: Record<TipoRecurso, string> = {
  video: 'Video',
  pdf: 'PDF',
  texto: 'Texto',
  embebido: 'Embebido',
  scorm: 'SCORM',
  'presentacion-interactiva': 'Presentación interactiva',
  'evaluacion-final': 'Evaluación',
  'encuesta-libre': 'Encuesta libre',
  'encuesta-satisfaccion': 'Encuesta de satisfacción',
  roleplay: 'Evaluador roleplay',
  asistencia: 'Asistencia',
}

/** El nombre de un recurso concreto. Hasta el 5-oct el roleplay decía «(MVP)» para distinguirlo del de IA; ya no hay dos. */
export const nombreRecurso = (r: Recurso) => NOMBRE_RECURSO[r.tipo]

/** La sección a la que va una página nueva: la pedida, o la primera visible. */
export function seccionDestino(b: Borrador, pedida?: string) {
  const visibles = seccionesVisibles(b)
  return visibles.find((s) => s.id === pedida)?.id ?? visibles[0]?.id ?? 'default'
}

export function abrirIntencion(intencion: Intencion) {
  setBorrador((b) => ({ intencion: { ...intencion, seccionId: seccionDestino(b, intencion.seccionId) }, reabrirAnadir: false }))
}

/**
 * Entrega el recurso confirmado. Devuelve el id de la página que lo recibió. Sin intención (se llegó directo por la
 * URL del recurso) la página nace en la primera sección.
 */
export function confirmarRecurso(recurso: Recurso, tituloSugerido?: string): string {
  const b = leer()
  const intencion = b.intencion
  const titulo = (intencion?.titulo || tituloSugerido || '').trim() || nombreRecurso(recurso)
  if (intencion?.paginaId && buscarPagina(b, intencion.paginaId)) {
    const id = intencion.paginaId
    setBorrador((previo) => ({
      intencion: null,
      paginaActiva: id,
      secciones: previo.secciones.map((s) => ({
        ...s,
        paginas: s.paginas.map((p) => (p.id === id ? { ...p, recurso } : p)),
      })),
    }))
    return id
  }
  const id = nuevoId('p')
  const destino = seccionDestino(b, intencion?.seccionId)
  setBorrador((previo) => ({
    intencion: null,
    paginaActiva: id,
    secciones: previo.secciones.map((s) => (s.id === destino ? { ...s, paginas: [...s.paginas, { id, titulo, recurso }] } : s)),
  }))
  return id
}

/** «Volver» desde un recurso: de regreso al asistente con «Añadir página» abierto, sin crear nada. */
export function volverAAnadirPagina() {
  setBorrador({ reabrirAnadir: true })
  return `${rutaAsistente()}#recursos`
}

/** Cerrar un recurso sin confirmar: no nace página y se olvida la intención. */
export function cancelarRecurso() {
  setBorrador({ intencion: null })
  return `${rutaAsistente()}#recursos`
}

export const hashPagina = (id: string) => `#recursos/page/${encodeURIComponent(id)}`

// ── Generaciones en segundo plano ────────────────────────────────────────────────────────────────────────────────

/**
 * Arranca una generación simulada para una página (video con IA, Video Avatar IA, presentación interactiva). El
 * asistente la hace avanzar aunque se haya salido y vuelto: al cumplirse `duracion` aplica `resultado` al recurso,
 * y aparece el aviso «Ver página» (HU-LMS-001, RN-09).
 */
export function iniciarTrabajo(paginaId: string, tipo: Trabajo['tipo'], duracion: number, resultado: Partial<Recurso>) {
  setBorrador((b) => ({
    trabajos: [
      ...b.trabajos.filter((t) => t.paginaId !== paginaId),
      { id: nuevoId('job'), paginaId, tipo, estado: 'cargando', progreso: 0, avisado: false, inicio: Date.now(), duracion, resultado },
    ],
  }))
}

export function avanzarTrabajo(paginaId: string, progreso: number) {
  setBorrador((b) => ({ trabajos: b.trabajos.map((t) => (t.paginaId === paginaId ? { ...t, progreso } : t)) }))
}

export function terminarTrabajo(paginaId: string, estado: 'listo' | 'error' = 'listo') {
  setBorrador((b) => ({
    trabajos: b.trabajos.map((t) => (t.paginaId === paginaId ? { ...t, estado, progreso: estado === 'listo' ? 100 : t.progreso } : t)),
  }))
}
