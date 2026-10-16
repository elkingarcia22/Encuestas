// Evaluador roleplay (MVP): reglas del formulario por pasos (HU-roleplay-mvp).
//
// Topes, textos de ejemplo, pasos y validación viven juntos para que la pantalla y la vista montada no se
// desincronicen: si un campo cambia de paso, se cambia aquí y en ningún otro lado.

import type { RoleplayConfig } from '../borrador'
// Un solo catálogo de voces para el video y el roleplay (decisión 21 de la auditoría, 5-oct).
import { VOZ_POR_DEFECTO } from '../video/datos'
import { plural } from '@/modules/design-system/patrones/formato'

/** Costo fijo por intento exitoso (RN-09). Solo lectura en la interfaz. */
export const COSTO_CREDITOS = 150

/** Entre 3 y 5 objetivos de aprendizaje (RN-02). */
export const MIN_OBJETIVOS = 3
export const MAX_OBJETIVOS = 5

/** Topes de caracteres (RN-03), alineados con el roleplay de Selección. */
export const LIMITES = {
  titulo: 80,
  escenario: 2000,
  personalidad: 400,
  papelColaborador: 400,
  mensajeBienvenida: 300,
  objetivo: 120,
  nombrePersonaje: 80,
  identidadPersonaje: 80,
} as const

/** Ejemplos concretos: la etiqueta dice qué es el campo y el ejemplo muestra cómo se ve lleno. */
export const EJEMPLOS = {
  titulo: 'Ej. Reunión con Andrea Guzmán',
  escenario: 'Describe el contexto de la reunión: qué está pasando, qué se espera del colaborador y cuál es el reto.',
  mensajeBienvenida: 'La primera frase con la que el evaluador abre la llamada.',
  papelColaborador: 'Ej. Eres responsable de explicar el avance y responder preguntas puntuales.',
  nombrePersonaje: 'Ej. Andrea Guzmán',
  identidadPersonaje: 'Ej. Directora de tu área',
  personalidad: 'Cómo se comporta: tono, temperamento, qué valora y qué le molesta.',
  objetivo: 'Ej. Responder de forma directa a la pregunta',
} as const

let consecutivo = 0
export function nuevoObjetivo(texto = '') {
  consecutivo += 1
  return { id: `obj-${Date.now().toString(36)}-${consecutivo}`, texto }
}

/** Alta en blanco: tres objetivos vacíos, modo Evaluación, 5 minutos, 3 intentos y modo texto encendido. */
export function roleplayVacio(): RoleplayConfig {
  return {
    titulo: '',
    escenario: '',
    nombrePersonaje: '',
    identidadPersonaje: '',
    voz: VOZ_POR_DEFECTO,
    imagen: '',
    personalidad: '',
    mensajeBienvenida: '',
    papelColaborador: '',
    objetivos: [nuevoObjetivo(), nuevoObjetivo(), nuevoObjetivo()],
    modo: 'evaluacion',
    objetivosParaAprobar: 3,
    duracionMin: 5,
    intentos: 3,
    modoTexto: true,
  }
}

export type Errores = Partial<Record<string, string>>

const lleno = (valor: string) => valor.trim().length > 0

export const objetivosConTexto = (cfg: RoleplayConfig) => cfg.objetivos.filter((o) => lleno(o.texto))

/** Validación de guardado (RN-01). Campo → mensaje; vacío cuando todo está bien. */
export function validarRoleplay(cfg: RoleplayConfig): Errores {
  const e: Errores = {}
  if (!lleno(cfg.titulo)) e.titulo = 'Escribe un título para la llamada'
  if (!lleno(cfg.escenario)) e.escenario = 'Describe el escenario de la reunión'
  if (!lleno(cfg.nombrePersonaje)) e.nombrePersonaje = 'Escribe el nombre del personaje'
  if (!lleno(cfg.identidadPersonaje)) e.identidadPersonaje = 'Escribe quién es el personaje'
  if (!lleno(cfg.personalidad)) e.personalidad = 'Describe la personalidad del evaluador'
  if (!lleno(cfg.mensajeBienvenida)) e.mensajeBienvenida = 'Escribe con qué frase abre la llamada'
  if (!lleno(cfg.papelColaborador)) e.papelColaborador = 'Describe el papel del colaborador'

  const conTexto = objetivosConTexto(cfg).length
  if (conTexto < MIN_OBJETIVOS) e.objetivos = `Define al menos ${MIN_OBJETIVOS} objetivos de aprendizaje`
  else if (conTexto !== cfg.objetivos.length) e.objetivos = 'Completa o elimina los objetivos vacíos'

  if (cfg.modo === 'evaluacion' && (cfg.objetivosParaAprobar < 1 || cfg.objetivosParaAprobar > conTexto))
    e.objetivosParaAprobar = 'Elige cuántos objetivos se necesitan para aprobar'
  return e
}

/** Los cuatro pasos y qué campos valida cada uno. */
export const PASOS = [
  {
    titulo: 'Planificación',
    ayuda: 'De qué trata la llamada y en qué situación ocurre.',
    campos: ['titulo', 'escenario'],
  },
  {
    titulo: 'Personaje',
    ayuda: 'Con quién habla el colaborador y cómo se comporta.',
    campos: ['nombrePersonaje', 'identidadPersonaje', 'personalidad', 'mensajeBienvenida'],
  },
  {
    titulo: 'Colaborador',
    ayuda: 'Qué papel cumple y qué debe lograr en la conversación.',
    campos: ['papelColaborador', 'objetivos'],
  },
  {
    titulo: 'Configuración',
    ayuda: 'Cómo se califica la llamada y cuánto dura.',
    campos: ['objetivosParaAprobar'],
  },
] as const

/** Los errores que le tocan a un paso (índice desde 0). */
export function erroresDelPaso(errores: Errores, paso: number): Errores {
  const salida: Errores = {}
  for (const campo of PASOS[paso]?.campos ?? []) if (errores[campo]) salida[campo] = errores[campo]
  return salida
}

export const nombreModo = (modo: RoleplayConfig['modo']) => (modo === 'evaluacion' ? 'Evaluación' : 'Práctica')

/** Resumen de una línea de la ficha: «Evaluación · 3 objetivos · 5 min · 3 intentos · aprueba con 3 de 3» (en singular con 1). */
export function resumenRoleplay(cfg: RoleplayConfig) {
  const n = objetivosConTexto(cfg).length
  const umbral = cfg.modo === 'evaluacion' ? ` · aprueba con ${cfg.objetivosParaAprobar} de ${n}` : ''
  return `${nombreModo(cfg.modo)} · ${n} ${plural(n, 'objetivo', 'objetivos')} · ${cfg.duracionMin} min · ${cfg.intentos} ${plural(cfg.intentos, 'intento', 'intentos')}${umbral}`
}

// ── Lo que falta ─────────────────────────────────────────────────────────────────────────────────────────────────

// Nombre de cada dato obligatorio, tal como se llama en el formulario: la vista previa dice qué falta con las mismas
// palabras que el creador acaba de leer, igual que el resumen de Crear contenido.
const NOMBRES: Record<string, string> = {
  titulo: 'Título de la llamada',
  escenario: 'Escenario',
  nombrePersonaje: 'Nombre del personaje',
  identidadPersonaje: 'Quién es',
  personalidad: 'Personalidad',
  mensajeBienvenida: 'Mensaje de bienvenida',
  papelColaborador: 'Papel del colaborador',
  objetivos: 'Objetivos de aprendizaje',
  objetivosParaAprobar: 'Objetivos para aprobar',
}

/**
 * Qué falta **en el paso en el que se está**, no en todo el roleplay: lo que se pide ahora, no lo que vendrá después.
 * La imagen del personaje no cuenta: es el único dato opcional. «Objetivos para aprobar» solo aplica en modo Evaluación.
 */
export function pendientesRoleplay(cfg: RoleplayConfig, paso: number) {
  const obligatorios = (PASOS[paso]?.campos ?? []).filter(
    (campo) => NOMBRES[campo] && (campo !== 'objetivosParaAprobar' || cfg.modo === 'evaluacion'),
  )
  const errores = validarRoleplay(cfg)
  const falta = obligatorios.filter((campo) => errores[campo]).map((campo) => NOMBRES[campo])
  return { falta, total: obligatorios.length, listos: obligatorios.length - falta.length }
}
