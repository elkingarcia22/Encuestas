import type { Pregunta } from './borrador'
import { preguntaVacia } from './demo'

// **Las dos encuestas del Creator.** Comparten el editor y la forma de responderse con la evaluación —son preguntas—,
// pero no se califican: no hay respuesta correcta ni porcentaje de aprobación.
//
// - **Encuesta libre**: la arma el creador entera, con los diez tipos de pregunta (los ocho de la evaluación más las
//   dos escalas, que solo existen aquí).
// - **Encuesta de satisfacción**: la escribió UBITS y **no se edita**. Son siempre las mismas dos preguntas, para que
//   sus respuestas se puedan comparar entre contenidos y empresas en los reportes. Copiadas literalmente del Creator
//   de producción (7-oct).

/** Las ocho opciones de la segunda pregunta, tal cual las ofrece producción. */
const FACTORES = [
  'No, todo estuvo bien.',
  'Tuve problemas técnicos (audio, video o acceso).',
  'El contenido no es útil o es muy superficial.',
  'El contenido es demasiado complejo.',
  'El contenido está desactualizado.',
  'El formato no fue de mi agrado (pódcast, libro, artículo, etc.).',
  'El contenido está en otro idioma o no tiene subtítulos.',
  'Otro motivo.',
]

/** Las dos preguntas fijas de la encuesta de satisfacción. Nacen con la página y no se tocan. */
export function preguntasDeSatisfaccion(): Pregunta[] {
  const estrellas: Pregunta = {
    ...preguntaVacia('rating_stars'),
    id: 'sat-1',
    enunciado: '¿Cómo calificarías el contenido que acabas de ver?',
    // Los dos extremos tienen nombre y los dos responden a la pregunta. La escala mide **utilidad**, no calidad a
    // secas: es lo que de verdad se puede accionar y enlaza con la pregunta siguiente, la de qué factores afectaron
    // la experiencia. Además evita pedirle a quien responde que juzgue si el contenido está bien hecho, que no
    // siempre es algo sobre lo que se sienta con autoridad (Dave, 8-oct).
    escala: { minimo: '1', maximo: '5', etiquetaMinimo: 'Poco útil', etiquetaMaximo: 'Muy útil' },
  }
  const factores: Pregunta = {
    ...preguntaVacia('multiple_choice_multiple'),
    id: 'sat-2',
    enunciado:
      'Si tu experiencia con este contenido no fue satisfactoria, ¿cuáles fueron los principales factores que la afectaron? (Selecciona todas las opciones que apliquen)',
    opciones: FACTORES.map((texto) => ({ texto, correcta: false })),
  }
  return [estrellas, factores]
}
