import type { SurveyDraft } from '../surveyBuilderTypes'
import { createPublishedSurveyDraft } from '../surveyPreviewMocks'
import { buildOpenComments, buildRespondents, type OpenComment } from '../questionResponses'
import { jitter, participationBySegment, sectionResultsForFilters, buildSurveyResults, type SectionResult, type SegmentOption, type SurveyResults } from '../surveyResults'
import type { SurveyListItem } from '../types'
import { buildColumns, sortByRecency, type ComparativeColumn } from './comparativeHelpers'
import { buildComparativeTree, type ComparativeTreeNode } from './comparativeSectionTree'

// La lectura de un comparativo, armada una sola vez para todas las pestañas.
//
// Cómo se leen los números, para que ninguna vista contradiga a otra ni a la pantalla de Resultados:
// - La base es la encuesta real: su favorabilidad, su participación, sus grupos y sus comentarios son
//   los mismos que muestra su pantalla de Resultados.
// - Las mediciones comparadas no comparten el cuestionario de la base (cada una tiene el suyo), así
//   que, como en el prototipo, su lectura por sección se deriva de la base: un escalón por medición
//   más un ruido estable por rama. Su participación y su eNPS, que son de toda la encuesta, sí son los
//   suyos.

export type Titular = { favorabilidad: number; participacion: number; nps: number | null; invitados: number; respondieron: number }

export type Comparativo = {
  tipo: string
  base: SurveyListItem
  columnas: readonly ComparativeColumn[]
  /** Las columnas en el orden en que se derivan: la base primero y luego de la más reciente a la más antigua. */
  olas: readonly ComparativeColumn[]
  encuestas: ReadonlyMap<string, SurveyListItem>
  /** Secciones y subsecciones (sin preguntas), para Comentarios y el mapa de calor. */
  arbol: readonly ComparativeTreeNode[]
  /** El mismo árbol con las preguntas colgando de su sección, para la tabla de Secciones. */
  arbolConPreguntas: readonly ComparativeTreeNode[]
  borradorBase: SurveyDraft
  resultadosBase: SurveyResults
  titulares: Readonly<Record<string, Titular>>
}

const borradorDe = (encuesta: SurveyListItem): SurveyDraft => encuesta.draft ?? createPublishedSurveyDraft(encuesta)
const participantesDe = (encuesta: SurveyListItem) => Number.parseInt(String(encuesta.participants), 10) || 0

/** La favorabilidad de una columna: el promedio de sus secciones raíz, ponderado por respuestas. */
function favorabilidadDeColumna(arbol: readonly ComparativeTreeNode[], columna: string): number {
  let suma = 0
  let n = 0
  for (const nodo of arbol) {
    const medida = nodo.measures[columna]
    if (!medida || medida.favorability === null) continue
    suma += medida.favorability * medida.n
    n += medida.n
  }
  return n === 0 ? 0 : Math.round((suma / n) * 10) / 10
}

/** Arma el comparativo, o `null` si la base no está entre las encuestas o no hay con qué compararla. */
export function armarComparativo(lista: readonly SurveyListItem[], baseId: string, otrasIds: readonly string[]): Comparativo | null {
  const base = lista.find((encuesta) => encuesta.id === baseId)
  if (!base) return null
  const otras = otrasIds.map((id) => lista.find((encuesta) => encuesta.id === id)).filter((encuesta): encuesta is SurveyListItem => encuesta !== undefined && encuesta.id !== base.id && encuesta.type === base.type)
  if (otras.length === 0) return null

  const columnas = buildColumns(base, otras)
  const olas = [...columnas].sort((a, b) => Number(b.isBase) - Number(a.isBase))
  const encuestas = new Map([base, ...otras].map((encuesta) => [encuesta.id, encuesta]))
  const todas = [base, ...otras]
  const arbol = buildComparativeTree({ columns: columnas, surveys: todas })
  const arbolConPreguntas = buildComparativeTree({ columns: columnas, surveys: todas, includeQuestions: true })
  const borradorBase = borradorDe(base)
  const resultadosBase = buildSurveyResults({ draft: borradorBase, item: base })

  const titulares: Record<string, Titular> = {}
  for (const columna of columnas) {
    const encuesta = encuestas.get(columna.id)
    if (!encuesta) continue
    const resultados = columna.isBase ? resultadosBase : buildSurveyResults({ draft: borradorDe(encuesta), item: encuesta })
    titulares[columna.id] = {
      favorabilidad: columna.isBase ? resultadosBase.favorability : favorabilidadDeColumna(arbol, columna.id),
      participacion: resultados.participation.rate,
      nps: resultados.nps?.score ?? null,
      invitados: resultados.participation.invited,
      respondieron: resultados.participation.completed,
    }
  }
  return { tipo: base.type, base, columnas, olas, encuestas, arbol, arbolConPreguntas, borradorBase, resultadosBase, titulares }
}

/** Las encuestas que se pueden comparar, de la más reciente a la más antigua. */
export const ordenarPorFecha = sortByRecency

// --- Mapa de calor por grupo (solo la base) -------------------------------------------------------

export type CeldaMapa = { grupo: string; delta: number | null; favorabilidad: number | null; n: number; reservada: boolean }
export type FilaMapa = { id: string; label: string; numbering: string; depth: number; favorabilidad: number; celdas: readonly CeldaMapa[] }
export type MapaGrupos = { grupos: readonly SegmentOption[]; filas: readonly FilaMapa[]; umbral: number }

const aplanar = (secciones: readonly SectionResult[]): SectionResult[] => secciones.flatMap((seccion) => [seccion, ...aplanar(seccion.children)])

/**
 * Cuánto se aparta cada grupo de la favorabilidad de toda la empresa en cada sección, en puntos
 * porcentuales, en la encuesta base. Comparar mediciones es cosa de la tabla; el mapa responde
 * «¿dónde está la brecha hoy?». Los grupos por debajo del umbral de anonimato no se leen.
 */
export function mapaPorGrupo(comparativo: Comparativo, claveSegmento: string): MapaGrupos {
  const resultados = comparativo.resultadosBase
  const segmento = resultados.segments.find((candidato) => candidato.key === claveSegmento)
  if (!segmento) return { grupos: [], filas: [], umbral: resultados.threshold }
  const participacion = new Map(participationBySegment(resultados, segmento, []).map((fila) => [fila.id, fila]))
  const grupos = segmento.options.filter((opcion) => participacion.has(opcion.id))
  const porGrupo = grupos.map((grupo) => {
    const fila = participacion.get(grupo.id)
    const reservada = !fila || fila.belowThreshold || fila.completed < resultados.threshold
    const secciones = reservada ? new Map<string, SectionResult>() : new Map(aplanar(sectionResultsForFilters(resultados, [{ key: segmento.key, optionId: grupo.id }])).map((seccion) => [seccion.id, seccion]))
    return { grupo, reservada, secciones }
  })
  const filas = aplanar(resultados.sections)
    .filter((seccion) => seccion.n > 0)
    .map((seccion) => ({
      id: seccion.id,
      label: seccion.title,
      numbering: seccion.numbering,
      depth: seccion.depth,
      favorabilidad: seccion.favorability,
      celdas: porGrupo.map(({ grupo, reservada, secciones }) => {
        const propia = secciones.get(seccion.id)
        const conDato = !reservada && propia !== undefined && propia.n > 0
        return {
          grupo: grupo.id,
          favorabilidad: conDato ? propia.favorability : null,
          delta: conDato ? Math.round((propia.favorability - seccion.favorability) * 10) / 10 : null,
          n: propia?.n ?? 0,
          reservada,
        }
      }),
    }))
  return { grupos, filas, umbral: resultados.threshold }
}

// --- Comentarios por sección ----------------------------------------------------------------------

export type Reparto = { positivo: number; neutral: number; negativo: number; n: number }
export type ComentariosSeccion = { numbering: string; label: string; porColumna: Readonly<Record<string, Reparto>>; comentarios: readonly OpenComment[] }

const acotar = (valor: number, minimo: number, maximo: number) => Math.max(minimo, Math.min(maximo, valor))
// Cuánto se aparta cada medición anterior del tono de la base: un escalón por ola, como la tabla.
const DERIVA_POR_OLA = 2.4

/**
 * El tono de los comentarios abiertos por sección raíz. La base se lee de sus comentarios reales (los
 * mismos de Resultados › Preguntas); las mediciones anteriores se derivan de ella con el mismo
 * criterio que la tabla, y su número de comentarios se escala a su participación.
 */
export function comentariosPorSeccion(comparativo: Comparativo): ComentariosSeccion[] {
  const { borradorBase, resultadosBase, olas, encuestas, base } = comparativo
  const comentarios = buildOpenComments(borradorBase, resultadosBase, buildRespondents(borradorBase, resultadosBase))
  const porRaiz = new Map<string, OpenComment[]>()
  for (const comentario of comentarios) {
    const raiz = comentario.sectionNumbering.split('.')[0]
    porRaiz.set(raiz, [...(porRaiz.get(raiz) ?? []), comentario])
  }
  const participantesBase = participantesDe(base)
  return resultadosBase.sections
    .filter((seccion) => (porRaiz.get(seccion.numbering)?.length ?? 0) > 0)
    .map((seccion) => {
      const propios = porRaiz.get(seccion.numbering) ?? []
      const cuenta = (sentimiento: OpenComment['aiSentiment']) => propios.filter((comentario) => comentario.aiSentiment === sentimiento).length
      const positivoBase = (cuenta('positive') / propios.length) * 100
      const negativoBase = (cuenta('negative') / propios.length) * 100
      const porColumna: Record<string, Reparto> = {}
      olas.forEach((columna, ola) => {
        const encuesta = encuestas.get(columna.id)
        const escala = participantesBase === 0 || !encuesta ? 1 : participantesDe(encuesta) / participantesBase
        const positivo = ola === 0 ? positivoBase : acotar(jitter(`${seccion.id}:${columna.id}:pos`, positivoBase - ola * DERIVA_POR_OLA, 3), 0, 100)
        const negativo = ola === 0 ? negativoBase : acotar(jitter(`${seccion.id}:${columna.id}:neg`, negativoBase + ola * (DERIVA_POR_OLA / 2), 2.5), 0, 100 - positivo)
        const redondeo = (valor: number) => Math.round(valor)
        porColumna[columna.id] = { positivo: redondeo(positivo), negativo: redondeo(negativo), neutral: Math.max(0, 100 - redondeo(positivo) - redondeo(negativo)), n: Math.round(propios.length * escala) }
      })
      return { numbering: seccion.numbering, label: seccion.title, porColumna, comentarios: propios }
    })
}
