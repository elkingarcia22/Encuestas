import { AI_FOCUSES } from '../../../modelo/aiSectionThemes'
import { RATING_STEPS, buildOption, buildQuestion } from '../../../modelo/questionCatalog'
import { flattenSections, type SectionTreeEntry } from '../../../modelo/sectionTree'
import type { RatingType, SurveyKind, SurveyQuestion, SurveySection } from '../../../modelo/surveyBuilderTypes'

// Lo que el agente del constructor sabe hacer con la encuesta, sin pantalla: armar la lista de pasos con que la va
// creando a la vista, leer un ajuste pedido en el chat («quita Bienestar», «agrega una pregunta abierta en Liderazgo»,
// «cambia la escala a frecuencia») y aplicarlo sobre el árbol tal como está ahora, con lo que la persona cambió a mano.

export const normalizar = (texto: string) =>
  texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()

// ── Crear a la vista ──

/** Un paso de la creación en vivo: una sección (vacía) que entra en su sitio, o una pregunta que entra en su sección. */
export type PasoCreacion =
  | { tipo: 'seccion'; padre: string | null; seccion: SurveySection; raiz: string }
  | { tipo: 'pregunta'; seccionId: string; pregunta: SurveyQuestion; raiz: string }
  | { tipo: 'cuenta'; raiz: SurveySection }

/** La propuesta, desarmada en el orden en que se ve aparecer: cada sección, sus subsecciones y sus preguntas una a una. */
export function pasosDe(secciones: readonly SurveySection[]): PasoCreacion[] {
  const desarmar = (seccion: SurveySection, padre: string | null, raiz: string): PasoCreacion[] => [
    { tipo: 'seccion', padre, seccion: { ...seccion, questions: [], children: [] }, raiz },
    ...seccion.questions.map((pregunta): PasoCreacion => ({ tipo: 'pregunta', seccionId: seccion.id, pregunta, raiz })),
    ...seccion.children.flatMap((hija) => desarmar(hija, seccion.id, raiz)),
  ]
  return secciones.flatMap((seccion): PasoCreacion[] => [...desarmar(seccion, null, seccion.id), { tipo: 'cuenta', raiz: seccion }])
}

/** Todas las preguntas de un árbol. */
export const preguntasDe = (secciones: readonly SurveySection[]) => flattenSections(secciones).flatMap((entrada) => entrada.section.questions)

// ── El tipo de encuesta que se deduce del pedido (solo si el paso 1 no tiene uno) ──

export function tipoDelPedido(texto: string, temas: readonly string[]): SurveyKind {
  const t = normalizar(texto)
  if (/\bclima\b/.test(t)) return 'clima'
  if (/\bcultura\b/.test(t)) return 'cultura'
  if (/\bnps\b|recomendar/.test(t)) return 'enps'
  if (/\bia\b|inteligencia artificial|adopcion/.test(t) || temas.includes('ia')) return 'ia'
  if (temas.includes('cultura')) return 'cultura'
  return 'clima'
}

// ── Ajustes por chat ──

export type Respuesta = 'open' | 'single' | 'dropdown' | 'scale'

export type Ajuste =
  | { tipo: 'quitar'; entrada: SectionTreeEntry }
  | { tipo: 'agregarPregunta'; entrada: SectionTreeEntry; abierta: boolean }
  | { tipo: 'escala'; escala: RatingType }
  | { tipo: 'respuesta'; respuesta: Respuesta }
  | { tipo: 'agregarSeccion' }
  | { tipo: 'noEncuentro'; nombre: string }

const ESCALAS: readonly { escala: RatingType; palabras: RegExp }[] = [
  { escala: 'frequency', palabras: /frecuencia/ },
  { escala: 'satisfaction', palabras: /satisfaccion/ },
  { escala: 'importance', palabras: /importancia/ },
  { escala: 'agreement', palabras: /acuerdo/ },
]

export const NOMBRE_ESCALA: Record<RatingType, string> = { agreement: 'grado de acuerdo', frequency: 'frecuencia', satisfaction: 'satisfacción', importance: 'importancia' }
export const NOMBRE_RESPUESTA: Record<Respuesta, string> = { open: 'abiertas', single: 'de opción única', dropdown: 'con lista desplegable', scale: 'en escala' }

/** La sección que nombra el texto («quita Bienestar», «en Liderazgo»): gana el título más largo que aparezca entero. */
function seccionNombrada(texto: string, secciones: readonly SurveySection[]): SectionTreeEntry | null {
  const t = normalizar(texto)
  const candidatas = flattenSections(secciones).filter((entrada) => {
    const titulo = normalizar(entrada.section.title)
    return titulo.length >= 3 && t.includes(titulo)
  })
  return [...candidatas].sort((a, b) => b.section.title.length - a.section.title.length || a.depth - b.depth)[0] ?? null
}

/** Lo que va después de «quita», «en»…: con eso se dice qué sección no se encontró. */
const loQueNombra = (texto: string, despues: RegExp) => texto.split(despues).slice(1).join(' ').replace(/[«»"'.]/g, '').trim()

const QUITAR = /\b(quita|quitar|elimina|eliminar|borra|borrar|saca|sacar)\b/
const AGREGAR = /\b(agrega|agregar|anade|anadir|suma|sumar|pon|poner|mete|otra)\b/

export function leerAjuste(texto: string, secciones: readonly SurveySection[]): Ajuste | null {
  const t = normalizar(texto)
  if (QUITAR.test(t)) {
    const entrada = seccionNombrada(texto, secciones)
    return entrada ? { tipo: 'quitar', entrada } : { tipo: 'noEncuentro', nombre: loQueNombra(t, QUITAR) }
  }
  if (AGREGAR.test(t) && /\bpregunta/.test(t)) {
    const entrada = seccionNombrada(texto, secciones)
    return entrada ? { tipo: 'agregarPregunta', entrada, abierta: /abierta/.test(t) } : { tipo: 'noEncuentro', nombre: loQueNombra(t, /\ben\b/) }
  }
  if (AGREGAR.test(t) && /\bseccion/.test(t)) return { tipo: 'agregarSeccion' }
  const escala = ESCALAS.find((item) => item.palabras.test(t))
  if (/\bescala\b/.test(t) && escala) return { tipo: 'escala', escala: escala.escala }
  if (/\b(cambia|cambiar|pasa|pasar|convierte|convertir|que sean|hazlas|ponlas)\b/.test(t)) {
    if (/abierta/.test(t)) return { tipo: 'respuesta', respuesta: 'open' }
    if (/desplegable/.test(t)) return { tipo: 'respuesta', respuesta: 'dropdown' }
    if (/unica/.test(t)) return { tipo: 'respuesta', respuesta: 'single' }
    if (escala) return { tipo: 'escala', escala: escala.escala }
    if (/escala/.test(t)) return { tipo: 'respuesta', respuesta: 'scale' }
  }
  return null
}

// ── Cómo queda cada pregunta con el ajuste ──

const OPCIONES_ACUERDO = [...RATING_STEPS.agreement].reverse()
const PASOS_ACUERDO = RATING_STEPS.agreement

const escalaDeAcuerdo = (): SurveyQuestion['scale'] => ({
  kind: 'likert',
  ratingType: 'agreement',
  minLabel: PASOS_ACUERDO[0],
  maxLabel: PASOS_ACUERDO[PASOS_ACUERDO.length - 1],
  allowDontKnow: false,
  followUpEnabled: false,
  followUps: { detractors: '', neutrals: '', promoters: '' },
})

/** La pregunta con otra escala; las que no son de escala de acuerdo o frecuencia (likert) quedan igual. */
export function conEscala(pregunta: SurveyQuestion, escala: RatingType): SurveyQuestion {
  if (pregunta.type !== 'scale' || pregunta.scale.kind !== 'likert' || pregunta.scale.ratingType === escala) return pregunta
  const pasos = RATING_STEPS[escala]
  return { ...pregunta, scale: { ...pregunta.scale, ratingType: escala, minLabel: pasos[0], maxLabel: pasos[pasos.length - 1] } }
}

export function conRespuesta(pregunta: SurveyQuestion, respuesta: Respuesta): SurveyQuestion {
  if (pregunta.type === respuesta) return pregunta
  if (respuesta === 'open') return { ...pregunta, type: 'open', options: [] }
  if (respuesta === 'scale') return { ...pregunta, type: 'scale', options: [], scale: escalaDeAcuerdo() }
  return { ...pregunta, type: respuesta, options: OPCIONES_ACUERDO.map((texto) => buildOption(texto)) }
}

/** Dónde caen las preguntas de una sección que tiene subsecciones: en la última hoja de su rama. */
export const ultimaHoja = (seccion: SurveySection): SurveySection => (seccion.children.length > 0 ? ultimaHoja(seccion.children[seccion.children.length - 1]) : seccion)

/** Una pregunta nueva sobre el tema de la sección: sale del banco de temas de la IA si lo reconoce. */
export function preguntaPara(seccion: SurveySection, raiz: SurveySection, abierta: boolean): SurveyQuestion {
  const titulos = [normalizar(seccion.title), normalizar(raiz.title)]
  const tema = AI_FOCUSES.flatMap((foco) => foco.themes.map((item) => ({ ...item, foco: foco.label }))).find(
    (item) => titulos.includes(normalizar(item.title)) || titulos.includes(normalizar(item.foco)),
  )
  const asunto = (seccion.title.trim() || raiz.title.trim() || 'este tema').toLowerCase()
  if (abierta) return buildQuestion({ statement: tema?.openPrompts[0] ?? `¿Qué cambiarías para mejorar ${asunto}?`, type: 'open', required: false, isAiGenerated: true })
  return buildQuestion({ statement: tema?.statements[tema.statements.length - 1] ?? `Estoy conforme con ${asunto} en mi equipo.`, isAiGenerated: true, scale: escalaDeAcuerdo() })
}
