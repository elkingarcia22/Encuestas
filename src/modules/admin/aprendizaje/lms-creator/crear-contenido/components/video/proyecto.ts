// El proyecto de un video con IA: el setup que lo pidió, sus escenas y los ajustes globales (subtítulos, logo,
// música). Lo arman el setup («Preparar escenas») y el editor, y se guarda en la sesión del navegador junto al borrador
// del asistente: así «Tus videos recientes» puede reabrir un borrador y «Editar video» encuentra el proyecto de la
// página (queda en `recurso.videoIA`).
//
// Todo lo que tarda (la cola inicial de escenas, regenerar imagen, canvas o audio, sincronizar el avatar) se guarda
// como un plazo con fecha de fin y el cambio que aplica al cumplirse. Así sigue corriendo aunque se salga del editor y
// se vuelva, como en el prototipo.

import { useSyncExternalStore } from 'react'
import { getBorrador, nuevoId, setBorrador, type VideoReciente } from '../borrador'
import {
  AVATARES,
  CANVAS_CORPORATIVO,
  ESCENAS_AVATAR,
  GUIONES,
  MOVIMIENTO_POR_DEFECTO,
  PISTAS,
  SECTOR_POR_DEFECTO,
  TITULO_DEMO,
  TRANSICION_POR_DEFECTO,
  VOZ_POR_DEFECTO,
  admiteAvatar,
  audioLocucion,
  avatarPorDefecto,
  avatarPorId,
  camposVacios,
  duracionEstimada,
  duracionLocucionPack,
  imagenPack,
  miniaturaAvatar,
  vozPorId,
  type Acento,
  type CamposCanvas,
  type PosicionImagen,
  type DuracionId,
  type EstiloId,
  type MezclaAudio,
  type ModoContexto,
  type MovimientoId,
  type PlantillaCanvas,
  type TransicionId,
} from './datos'
import type { Capa, FondoCanvas } from './capas'

// ── Tipos ────────────────────────────────────────────────────────────────────────────────────────────────────────

export type TipoEscena = 'imagen' | 'video' | 'avatar' | 'canvas'

export type Setup = {
  idea: string
  contexto: ModoContexto
  adjuntos: string[]
  objetivo: string
  objetivoOtro: string
  audiencia: string
  audienciaOtro: string
  tono: string
  tonoOtro: string
  sector: string
  evitar: string
  duracion: DuracionId
  estilo: EstiloId
  voz: string
  /** Avatar del video (solo Corporativo y Fotografía Real); null = apagado. */
  avatarId: number | null
}

export const SETUP_VACIO: Setup = {
  idea: '',
  contexto: 'internet',
  adjuntos: [],
  objetivo: 'comprender',
  objetivoOtro: '',
  audiencia: 'empresa',
  audienciaOtro: '',
  tono: 'cercano',
  tonoOtro: '',
  sector: SECTOR_POR_DEFECTO,
  evitar: '',
  duracion: '1-3',
  estilo: 'corporativa',
  voz: VOZ_POR_DEFECTO,
  avatarId: null,
}

/** Un trabajo simulado sobre la escena: al llegar `hasta` se le aplica `parche`. */
export type Ocupacion = {
  motivo: 'cola' | 'imagen' | 'canvas' | 'audio' | 'sincronizar'
  hasta: number
  parche: Partial<Escena>
}

export type Escena = {
  id: string
  /** Número del pack de medios y locución (1–30); 0 = escena en blanco. */
  pack: number
  /** Sin tipo = escena nueva, todavía en blanco. */
  tipo?: TipoEscena
  guion: string
  /** Guion y voz con los que se generó la última locución; null = aún no hay locución. */
  guionLocucion: string | null
  vozLocucion: string | null
  /** Voz propia de la escena; si falta, la del proyecto. */
  voz?: string
  duracion: number
  /** Duración de la locución vigente (0 sin locución). */
  duracionLocucion: number
  imagen: string
  imagenAlterna: string
  /** Si alguna vez se generó la imagen con IA (el botón dice «Regenerar»). */
  imagenGenerada: boolean
  clip?: { src: string; nombre: string; duracion: number }
  mezcla: MezclaAudio
  /**
   * La locución de esta escena no suena, aunque esté generada: se conserva y no se vuelve a cobrar (14-oct). Reemplaza
   * a la mezcla «solo el audio del video».
   */
  locucionSilenciada?: boolean
  /** El sonido del video cargado no suena (escenas tipo video). Reemplaza a la mezcla «solo la voz en off». */
  videoSilenciado?: boolean
  canvas?: {
    plantilla: PlantillaCanvas
    campos: CamposCanvas
    acento: Acento
    idea: string | null
    /**
     * Dónde va la foto en las plantillas que la reparten en dos (ver `REPARTO_IMAGEN`). Sin esto, la que traiga la
     * plantilla. Es el `imagePosition` de playground-react.
     */
    posicionImagen?: PosicionImagen
    /**
     * Dónde quedó cada capa después de arrastrarla, en % de la diapositiva. Lo que no está aquí usa la posición de la
     * plantilla. Es el `slide.layout` de playground-react: la composición es del creador, no fija.
     */
    capas?: Record<string, { left: number; top: number; width: number; height: number }>
    /** El fondo de la diapositiva; sin él, el que trae la plantilla (14-oct). */
    fondo?: FondoCanvas
    /**
     * Las capas, en cuanto el creador toca una (las mueve, las edita, agrega o borra). Sin esto se generan de la
     * plantilla y sus campos (ver capas.ts). Reemplaza a `capas` y a `posicionImagen`, que quedan para lo ya guardado.
     */
    capasLibres?: Capa[]
  }
  avatarId?: number | null
  /** Con qué guion, voz y avatar se sincronizó; null = hace falta sincronizar. */
  sync: { guion: string; voz: string; avatarId: number } | null
  transicion: TransicionId
  movimiento: MovimientoId
  ocupada?: Ocupacion
}

export type Proyecto = {
  id: string
  titulo: string
  setup: Setup
  escenas: Escena[]
  subtitulos: boolean
  /** Logo de la empresa (data URL), arriba a la derecha al 70 %. */
  logo: string | null
  musica: { pista: string; volumen: string }
  creado: string
}

export type Fase = 'borrador' | 'editor' | 'renderizando' | 'listo'

/** Lo que se guarda de cada video en curso, con el mismo id de «Tus videos recientes». */
export type Sesion = { id: string; fase: Fase; setup: Setup; proyecto: Proyecto | null; snapshot: string | null }

// ── Consultas sobre una escena ───────────────────────────────────────────────────────────────────────────────────

export const vozDe = (e: Escena, p: Proyecto) => e.voz ?? p.setup.voz

/** La locución canónica suena con su MP3; un guion propio se simula con su duración estimada. */
export function audioDe(e: Escena, p: Proyecto) {
  if (e.guionLocucion == null || e.pack < 1) return undefined
  if (e.guionLocucion.trim() !== GUIONES[e.pack - 1]) return undefined
  return audioLocucion(e.vozLocucion ?? vozDe(e, p), e.pack)
}

export const tieneLocucionVigente = (e: Escena, p: Proyecto) =>
  e.guionLocucion != null && e.guionLocucion === e.guion && (e.vozLocucion ?? '') === vozDe(e, p)

export const avatarDeEscena = (e: Escena, p: Proyecto) =>
  avatarPorId(e.avatarId ?? p.setup.avatarId) ?? avatarPorDefecto(p.setup.sector, vozPorId(vozDe(e, p)).genero)

export const sincronizada = (e: Escena, p: Proyecto) => {
  if (!e.sync) return false
  const avatar = avatarDeEscena(e, p)
  return e.sync.guion === e.guionLocucion && e.sync.voz === (e.vozLocucion ?? vozDe(e, p)) && e.sync.avatarId === avatar.id
}

/** La imagen que se ve: la del avatar en escenas con presentador. */
export const imagenDe = (e: Escena, p: Proyecto) => (e.tipo === 'avatar' ? miniaturaAvatar(avatarDeEscena(e, p)) : e.imagen)

export const ocupada = (e: Escena, ahora: number) => Boolean(e.ocupada && e.ocupada.hasta > ahora)
export const enCola = (e: Escena, ahora: number) => Boolean(e.ocupada?.motivo === 'cola' && e.ocupada.hasta > ahora)

/** Título corto de la escena en el rail: hasta 10 palabras de la primera oración. */
/** Cómo se llama una escena en la interfaz: por su número, «Escena 01». */
export const nombreEscena = (i: number) => `Escena ${String(i + 1).padStart(2, '0')}`

/** El arranque del guion, para dar contexto donde no cabe el guion entero (el nombre accesible de la tarjeta). */
export function tituloCorto(e: Escena, i: number) {
  const primera = e.guion.trim().split(/(?<=[.!?])\s/)[0] ?? ''
  const palabras = primera.split(/\s+/).filter(Boolean)
  if (!palabras.length) return `Escena ${i + 1}`
  return palabras.length > 10 ? `${palabras.slice(0, 10).join(' ')}…` : palabras.join(' ')
}

export const duracionTotal = (p: Proyecto) => p.escenas.reduce((t, e) => t + e.duracion, 0)

// ── Fábrica ──────────────────────────────────────────────────────────────────────────────────────────────────────

function escenaDelPack(pack: number, n: number, setup: Setup, conAvatar: boolean): Escena {
  const guion = GUIONES[pack - 1]
  const imagen = imagenPack(setup.estilo, pack)
  const duracion = Math.round(duracionLocucionPack(setup.voz, pack) * 1000) / 1000
  const base: Escena = {
    id: `scene-${String(n).padStart(2, '0')}`,
    pack,
    tipo: 'imagen',
    guion,
    guionLocucion: guion,
    vozLocucion: setup.voz,
    duracion,
    duracionLocucion: duracion,
    imagen,
    imagenAlterna: imagenPack(setup.estilo, (pack % 30) + 1),
    imagenGenerada: true,
    mezcla: 'both',
    sync: null,
    transicion: TRANSICION_POR_DEFECTO,
    movimiento: MOVIMIENTO_POR_DEFECTO,
  }
  const canvas = setup.estilo === 'corporativa' ? CANVAS_CORPORATIVO[pack] : undefined
  if (canvas) return { ...base, tipo: 'canvas', canvas: { plantilla: canvas.plantilla, campos: { ...canvas.campos }, acento: 'primary', idea: base.guion } }
  if (conAvatar && ESCENAS_AVATAR.includes(pack)) return { ...base, tipo: 'avatar', avatarId: setup.avatarId }
  return base
}

/**
 * El demo «Onboarding comercial — 30 días»: la idea no cambia el contenido (el prototipo no tiene IA real). 1-3 min
 * da las 30 escenas; los rangos largos, 36 (se repiten escenas del pack).
 */
export function crearProyecto(setup: Setup, titulo?: string): Proyecto {
  const conAvatar = admiteAvatar(setup.estilo) && setup.avatarId != null
  const cantidad = setup.duracion === '1-3' ? 30 : 36
  const paso = 30 / cantidad
  const escenas = Array.from({ length: cantidad }, (_, i) => escenaDelPack(Math.min(30, Math.floor(i * paso) + 1), i + 1, setup, conAvatar))
  // Con 36 escenas, el avatar cae en la segunda, a mitad y en la última (proporción del demo canónico).
  if (conAvatar && cantidad !== 30) {
    const huecos = [1, Math.round(((cantidad - 1) * 14) / 29), cantidad - 1]
    escenas.forEach((e, i) => {
      if (e.tipo === 'avatar' && !huecos.includes(i)) Object.assign(e, { tipo: 'imagen', avatarId: undefined })
      if (huecos.includes(i) && e.tipo === 'imagen') Object.assign(e, { tipo: 'avatar', avatarId: setup.avatarId })
    })
  }
  return {
    id: nuevoId('video'),
    titulo: titulo?.trim() || TITULO_DEMO,
    setup: { ...setup },
    escenas,
    subtitulos: true,
    logo: null,
    musica: { pista: 'groove', volumen: 'estandar' },
    creado: new Date().toISOString(),
  }
}

/** El proyecto listo del editor cuando se llega por la URL sin nada: Corporativo (con escenas canvas), voz femenina de Colombia. */
export function proyectoDemoEditor(titulo?: string): Proyecto {
  // Corporativo y no Origami (14-oct): es el estilo que trae escenas canvas, así quien entra directo al editor llega a
  // revisar plantillas y capas sin pasar por el setup (Dave: «no hay una forma directa de llegar al editor»).
  return crearProyecto({ ...SETUP_VACIO, estilo: 'corporativa', voz: 'co-f-cercano', idea: '' }, titulo)
}

export function escenaEnBlanco(): Escena {
  return {
    id: nuevoId('scene'),
    pack: 0,
    guion: '',
    guionLocucion: null,
    vozLocucion: null,
    duracion: 5,
    duracionLocucion: 0,
    imagen: '',
    imagenAlterna: '',
    imagenGenerada: false,
    mezcla: 'both',
    sync: null,
    transicion: TRANSICION_POR_DEFECTO,
    movimiento: MOVIMIENTO_POR_DEFECTO,
  }
}

/**
 * Cambiar el tipo conserva la imagen de la escena (nunca guarda la del avatar como imagen). Avatar sin avatar en el
 * proyecto toma el del género de la voz; Canvas nace con la portada vacía.
 */
export function cambiarTipo(e: Escena, tipo: TipoEscena, p: Proyecto): Escena {
  const siguiente: Escena = { ...e, tipo }
  if (tipo === 'avatar') {
    siguiente.avatarId = e.avatarId ?? p.setup.avatarId ?? avatarPorDefecto(p.setup.sector, vozPorId(vozDe(e, p)).genero).id
    siguiente.sync = null
  }
  if (tipo === 'canvas' && !e.canvas) siguiente.canvas = { plantilla: 'intro', campos: camposVacios('intro'), acento: 'primary', idea: null }
  if ((tipo === 'imagen' || tipo === 'canvas') && !e.imagen && e.pack > 0) {
    siguiente.imagen = imagenPack(p.setup.estilo, e.pack)
    siguiente.imagenAlterna = imagenPack(p.setup.estilo, (e.pack % 30) + 1)
  }
  if (tipo === 'video' && e.clip) siguiente.duracion = e.clip.duracion
  return siguiente
}

/** Duración de la locución de un guion con una voz: el MP3 real si es el guion del pack, si no la estimada. */
export function duracionDeLocucion(e: Escena, voz: string) {
  if (e.pack > 0 && e.guion.trim() === GUIONES[e.pack - 1] && audioLocucion(voz, e.pack)) return duracionLocucionPack(voz, e.pack)
  return duracionEstimada(e.guion)
}

/**
 * «Continuar»: cada escena con contenido entra a la cola y se completa en cascada por tipo. Imagen y video
 * 280 ms + 160 ms por escena; canvas 720 + 380; avatar 30 s + 8 s (incluye el lipsync).
 */
export function encolar(p: Proyecto, ahora = Date.now()): Proyecto {
  const cuenta: Record<string, number> = {}
  const escenas = p.escenas.map((e) => {
    if (!e.tipo) return e
    const clave = e.tipo === 'avatar' ? 'avatar' : e.tipo === 'canvas' ? 'canvas' : 'imagen'
    const n = cuenta[clave] ?? 0
    cuenta[clave] = n + 1
    const espera = clave === 'avatar' ? 30_000 + 8000 * n : clave === 'canvas' ? 720 + 380 * n : 280 + 160 * n
    const avatar = e.tipo === 'avatar' ? avatarDeEscena(e, p) : null
    const parche: Partial<Escena> = avatar ? { sync: { guion: e.guion, voz: vozDe(e, p), avatarId: avatar.id } } : {}
    return { ...e, ocupada: { motivo: 'cola' as const, hasta: ahora + espera, parche } }
  })
  return { ...p, escenas }
}

/** Aplica los plazos cumplidos. Devuelve el mismo objeto si no cambió nada. */
export function aplicarPlazos(p: Proyecto, ahora = Date.now()): Proyecto {
  if (!p.escenas.some((e) => e.ocupada && e.ocupada.hasta <= ahora)) return p
  return {
    ...p,
    escenas: p.escenas.map((e) => (e.ocupada && e.ocupada.hasta <= ahora ? { ...e, ...e.ocupada.parche, ocupada: undefined } : e)),
  }
}

export const proximoPlazo = (p: Proyecto) => Math.min(...p.escenas.map((e) => e.ocupada?.hasta ?? Infinity))

/** Lo que cuenta para «Cambiaste el setup»: todo menos el avatar apagado/prendido sin elegir. */
export const huellaSetup = (s: Setup) => JSON.stringify({ ...s })

export const pistaPorId = (id: string) => PISTAS.find((t) => t.id === id) ?? PISTAS[1]

export const primerAvatar = AVATARES[0]

// ── Sesiones (sessionStorage) ────────────────────────────────────────────────────────────────────────────────────

const CLAVE_SESIONES = 'playground:lms-video-ia'
const CLAVE_ACTIVA = 'playground:lms-video-ia-activa'
const CLAVE_SETUP = 'playground:lms-video-ia-setup'

type Almacen = Record<string, Sesion>

const oyentes = new Set<() => void>()
let cache: Almacen | null = null

function leer(): Almacen {
  if (cache) return cache
  try {
    cache = JSON.parse(window.sessionStorage.getItem(CLAVE_SESIONES) ?? '{}') as Almacen
  } catch {
    cache = {}
  }
  return cache
}

function escribir(siguiente: Almacen) {
  cache = siguiente
  try {
    window.sessionStorage.setItem(CLAVE_SESIONES, JSON.stringify(siguiente))
  } catch {
    // Los clips y logos subidos pueden pasar del cupo del navegador: el flujo sigue en memoria.
  }
  oyentes.forEach((o) => o())
}

export const leerSesion = (id: string | null | undefined) => (id ? leer()[id] : undefined)

export function guardarSesion(sesion: Sesion) {
  escribir({ ...leer(), [sesion.id]: sesion })
  sincronizarReciente(sesion)
}

export function useSesion(id: string | null) {
  return useSyncExternalStore(
    (o) => {
      oyentes.add(o)
      return () => oyentes.delete(o)
    },
    () => (id ? leer()[id] : undefined),
    () => undefined,
  )
}

export function sesionActiva(): string | null {
  try {
    return window.sessionStorage.getItem(CLAVE_ACTIVA)
  } catch {
    return null
  }
}

export function marcarActiva(id: string | null) {
  try {
    if (id) window.sessionStorage.setItem(CLAVE_ACTIVA, id)
    else window.sessionStorage.removeItem(CLAVE_ACTIVA)
  } catch {
    // Sin almacenamiento solo se pierde la reanudación tras recargar.
  }
}

/** El formulario del setup sin borrador todavía: se autoguarda y se rehidrata al volver (menos el avatar). */
export function leerSetupGuardado(): Setup | null {
  try {
    const guardado = window.sessionStorage.getItem(CLAVE_SETUP)
    return guardado ? { ...SETUP_VACIO, ...(JSON.parse(guardado) as Partial<Setup>), avatarId: null } : null
  } catch {
    return null
  }
}

export function guardarSetup(setup: Setup | null) {
  try {
    if (setup) window.sessionStorage.setItem(CLAVE_SETUP, JSON.stringify(setup))
    else window.sessionStorage.removeItem(CLAVE_SETUP)
  } catch {
    // Igual que arriba.
  }
}

/** «Crear video con IA» empieza de cero: sin borrador activo ni formulario guardado. */
export function nuevoVideo() {
  marcarActiva(null)
  guardarSetup(null)
}

const fechaCorta = () => new Date().toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })

/** Mantiene «Tus videos recientes» del asistente al día con la sesión: mismo id, título y miniatura. */
function sincronizarReciente(sesion: Sesion) {
  const p = sesion.proyecto
  const primera = p?.escenas.find((e) => e.imagen)
  const reciente: VideoReciente = {
    id: sesion.id,
    titulo: (sesion.setup.idea.trim().slice(0, 72) || p?.titulo || 'Video con IA').trim(),
    estado: sesion.fase === 'listo' ? 'listo' : 'editando',
    miniatura: primera && p ? imagenDe(primera, p) : imagenPack(sesion.setup.estilo, 1),
    src: sesion.fase === 'listo' ? '/videos/preview-video-generado.mp4' : undefined,
    actualizado: fechaCorta(),
  }
  if (p?.titulo && p.titulo !== TITULO_DEMO) reciente.titulo = p.titulo
  const lista = getBorrador().videosRecientes ?? []
  const otros = lista.filter((v) => v.id !== sesion.id)
  setBorrador({ videosRecientes: [reciente, ...otros] })
}

/**
 * Lo que le falta a la escena para verse, cuando el tipo elegido pide una acción: un video que nadie cargó, un avatar
 * sin sincronizar, una imagen vacía o una escena sin tipo. Como en el editor de AI Studio, la vista previa lo dice en
 * vez de enseñar una foto cualquiera; aquí con el estado vacío oficial y su icono glass (Dave, 14-oct). Al reproducir,
 * la escena a la que le falta algo se salta (la vista previa solo pasa por las que se pueden ver).
 */
export function faltaEnEscena(e: Escena, p: Proyecto) {
  if (!e.tipo) return { icono: 'glass-edit', titulo: 'Elige el tipo de escena', descripcion: 'Escribe el guion, genera la locución y elige en Propiedades de la escena si es imagen, video, avatar o canvas.' }
  if (e.tipo === 'video' && !e.clip) return { icono: 'glass-video', titulo: 'Sube un video para esta escena', descripcion: 'Cárgalo en Media, en Propiedades de la escena.' }
  if (e.tipo === 'imagen' && !e.imagen) return { icono: 'glass-gallery', titulo: 'Sube una imagen para esta escena', descripcion: 'Súbela o genérala en Media, en Propiedades de la escena.' }
  if (e.tipo === 'avatar' && !sincronizada(e, p)) {
    return tieneLocucionVigente(e, p)
      ? { icono: 'glass-profile', titulo: 'Sincroniza el avatar con la locución', descripcion: 'Usa «Sincronizar avatar» en Propiedades de la escena para que hable con su voz.' }
      : { icono: 'glass-profile', titulo: 'Genera la locución del avatar', descripcion: 'El avatar habla con la locución de la escena: genérala y después sincronízalo.', locucion: true }
  }
  return null
}
