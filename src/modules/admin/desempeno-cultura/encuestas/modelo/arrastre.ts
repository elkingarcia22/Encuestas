import type { SurveyQuestion, SurveySection } from './surveyBuilderTypes'

// El árbol del paso 4 visto como listas para el arrastre: las secciones raíz, las hijas de cada sección y las preguntas de
// cada sección. Con todas en un solo contexto de arrastre (el Kanban de la librería), una pregunta se puede soltar en la
// lista de otra sección. Aquí solo hay lógica: convertir el árbol a listas, validar el movimiento y volver a armar el árbol.

export type ElementoArbol = SurveySection | SurveyQuestion
export type Contenedores = Record<string, ElementoArbol[]>

export const RAIZ = 'raiz'
export const hijasDe = (seccionId: string) => `hijas:${seccionId}`
export const preguntasDe = (seccionId: string) => `preguntas:${seccionId}`

const esSeccion = (elemento: ElementoArbol): elemento is SurveySection => 'children' in elemento
const esPregunta = (elemento: ElementoArbol): elemento is SurveyQuestion => !esSeccion(elemento)
const llevaSecciones = (clave: string) => clave === RAIZ || clave.startsWith('hijas:')

export function contenedoresDe(secciones: readonly SurveySection[]): Contenedores {
  const contenedores: Contenedores = { [RAIZ]: [...secciones] }
  const recorrer = (seccion: SurveySection) => {
    contenedores[hijasDe(seccion.id)] = [...seccion.children]
    contenedores[preguntasDe(seccion.id)] = [...seccion.questions]
    seccion.children.forEach(recorrer)
  }
  secciones.forEach(recorrer)
  return contenedores
}

const conElemento = (lista: readonly ElementoArbol[], elemento: ElementoArbol, indice: number) => [...lista.slice(0, indice), elemento, ...lista.slice(indice)]

export type Soltado = {
  activoId: string
  /** Lista de la que sale y lista sobre la que se suelta (o la de la fila sobre la que se suelta). */
  origen: string
  destino: string
  /** Posición de la fila sobre la que se soltó; si se soltó sobre la lista vacía, el largo de la lista. */
  indice: number
  /** La fila o lista sobre la que se soltó. */
  sobreId: string
}

/**
 * Aplica lo que se soltó, o devuelve null si no vale. Las secciones solo cambian de orden entre hermanas (no de padre);
 * una pregunta va a cualquier sección que no tenga subsecciones (ahí las preguntas viven en las subsecciones). Soltar una
 * pregunta sobre el encabezado de una sección, que casi siempre está cerrada y no tiene lista, la deja al final de la suya.
 */
export function moverAlSoltar(contenedores: Contenedores, { activoId, origen, destino, indice, sobreId }: Soltado): Contenedores | null {
  const lista = contenedores[origen] ?? []
  const desde = lista.findIndex((elemento) => elemento.id === activoId)
  if (desde === -1) return null
  const activo = lista[desde]
  const sinActivo = lista.filter((elemento) => elemento.id !== activoId)

  if (llevaSecciones(origen)) {
    if (destino !== origen || !esSeccion(activo)) return null
    return { ...contenedores, [origen]: conElemento(sinActivo, activo, indice) }
  }
  if (!esPregunta(activo)) return null

  let listaDestino = destino
  let posicion = indice
  if (llevaSecciones(destino)) {
    const encabezado = (contenedores[destino] ?? []).find((elemento) => elemento.id === sobreId && esSeccion(elemento))
    if (!encabezado) return null
    listaDestino = preguntasDe(encabezado.id)
    posicion = (contenedores[listaDestino] ?? []).length
  }
  if (listaDestino === origen) return { ...contenedores, [origen]: conElemento(sinActivo, activo, posicion) }
  if ((contenedores[hijasDe(listaDestino.slice('preguntas:'.length))] ?? []).length > 0) return null
  return { ...contenedores, [origen]: sinActivo, [listaDestino]: conElemento(contenedores[listaDestino] ?? [], activo, posicion) }
}

export function arbolDesde(secciones: readonly SurveySection[], contenedores: Contenedores): SurveySection[] {
  const armar = (seccion: SurveySection): SurveySection => ({
    ...seccion,
    children: (contenedores[hijasDe(seccion.id)] ?? seccion.children).filter(esSeccion).map(armar),
    questions: (contenedores[preguntasDe(seccion.id)] ?? seccion.questions).filter(esPregunta),
  })
  return (contenedores[RAIZ] ?? secciones).filter(esSeccion).map(armar)
}

export const buscarPregunta = (contenedores: Contenedores, id: string): SurveyQuestion | undefined =>
  Object.values(contenedores).flat().filter(esPregunta).find((pregunta) => pregunta.id === id)
