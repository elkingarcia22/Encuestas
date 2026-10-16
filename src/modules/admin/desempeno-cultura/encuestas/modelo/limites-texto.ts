// Cuánto se puede escribir en cada texto de una encuesta (aprobado por Elkin el 14-oct). Todos se portan igual que la
// descripción de Datos generales (MAX_DESCRIPTION_LENGTH): el campo no deja pasar del máximo, lo pegado se corta ahí
// y debajo va «N de M caracteres». Los que tienen mínimo, con algo escrito que no llega, se cuentan como incompletos
// en la misma revisión que hoy marca el campo vacío.

export type Limite = { min?: number; max: number }

export const LIMITE_NOMBRE_ENCUESTA = { min: 5, max: 150 } as const satisfies Limite
export const LIMITE_TITULO_SECCION = { min: 3, max: 120 } as const satisfies Limite
export const LIMITE_ENUNCIADO = { min: 5, max: 300 } as const satisfies Limite
export const LIMITE_OPCION_PREGUNTA = { max: 80 } as const satisfies Limite
export const LIMITE_MENSAJE_PAGINA = { max: 1000 } as const satisfies Limite
export const LIMITE_NOMBRE_DEMOGRAFICO = { min: 3, max: 80 } as const satisfies Limite
export const LIMITE_OPCION_DEMOGRAFICO = { max: 60 } as const satisfies Limite

/** En los campos cortos (las opciones, el título de una sección) el contador sale solo desde aquí: el 80 % del tope. */
const UMBRAL_CONTADOR = 0.8

/** El largo que cuenta: el texto sin marcado y sin espacios en los extremos. */
export const largoDe = (texto: string) => texto.replace(/<[^>]*>/g, '').trim().length

/** Hay algo escrito, pero no llega al mínimo. Vacío no cuenta aquí: tiene su propio mensaje. */
export const cortoDeMinimo = (texto: string, min: number) => {
  const largo = largoDe(texto)
  return largo > 0 && largo < min
}

export const mensajeMinimo = (min: number) => `Escribe al menos ${min} caracteres.`

export const cercaDelTope = (largo: number, max: number) => largo >= Math.ceil(max * UMBRAL_CONTADOR)

const NUMERO = new Intl.NumberFormat('es-CO')

/** «N de M caracteres», con el punto de miles de los textos en español («1.000»). */
export const contador = (largo: number, max: number) => `${NUMERO.format(largo)} de ${NUMERO.format(max)} caracteres`
