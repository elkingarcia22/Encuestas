import type { OpcionEscala } from '../../../encuestas/resultados/components/controles'
import type { ScaleTone } from '../../../encuestas/modelo/favorabilityScale'
import type { Corte } from './lecturas'
import { MINIMO_GRUPO } from './ranking'
import type { TonoId } from '../configuracion'
import { OBJETIVOS_EMPRESA, riesgoDe, type NivelVista, type ObjetivoSeguido, type PersonaSeguida, type ResultadosCiclo, type Riesgo } from './seguimiento'

// Cumplimiento de un ciclo, objetivo por objetivo (portado del prototipo «configuración objetivos», 9-oct). Dos lecturas
// del mismo dato:
// - El árbol, que se recorre: objetivo de empresa → el grupo de «Ver por» → cada objetivo → cada persona. Un objetivo sin
//   objetivo de empresa va a su propia rama. Tiene la forma de las secciones de una encuesta para usar el mismo árbol.
// - El mapa de calor, que se compara: filas de objetivos de empresa y sus objetivos, una columna por grupo.
// El cumplimiento de un conjunto es el promedio del de sus objetivos; uno sin avance reportado cuenta como 0.

export type Entrada = { persona: PersonaSeguida; objetivo: ObjetivoSeguido }

const SIN_EMPRESA = 'sin-empresa'
const promedio = (entradas: readonly Entrada[]) => (entradas.length === 0 ? 0 : Math.round((entradas.reduce((s, e) => s + (e.objetivo.cumplimiento ?? 0), 0) / entradas.length) * 10) / 10)
const personasDe = (entradas: readonly Entrada[]) => new Set(entradas.map((entrada) => entrada.persona.id)).size
const grupoDe = (persona: PersonaSeguida, corte: Corte) => persona.colaborador[corte] ?? 'Sin líder'

function agrupar<T>(items: readonly T[], clave: (item: T) => string): Map<string, T[]> {
  const grupos = new Map<string, T[]>()
  for (const item of items) grupos.set(clave(item), [...(grupos.get(clave(item)) ?? []), item])
  return grupos
}

export const entradasDe = (r: ResultadosCiclo): Entrada[] => r.personas.flatMap((persona) => persona.objetivos.map((objetivo) => ({ persona, objetivo })))

/** Una fila del árbol con la forma de una sección de encuesta (id, title, numbering, questions, children). */
export interface NodoCumplimiento {
  id: string
  title: string
  numbering: string
  /** En los grupos, sus objetivos; en los objetivos de empresa, nada (todo cuelga de sus grupos). */
  questions: readonly ObjetivoAgrupado[]
  children: readonly NodoCumplimiento[]
  avance: number
  personas: number
  objetivos: number
  reportaron: number
  riesgo: Riesgo
}

/** Un mismo objetivo dentro de un grupo, con las personas que lo llevan. */
export interface ObjetivoAgrupado {
  id: string
  titulo: string
  avance: number
  entradas: readonly Entrada[]
}

const titulosEmpresa = new Map(OBJETIVOS_EMPRESA.map((objetivo) => [objetivo.id, objetivo.titulo]))

function nodo(r: ResultadosCiclo, id: string, title: string, numbering: string, entradas: readonly Entrada[], children: readonly NodoCumplimiento[], questions: readonly ObjetivoAgrupado[]): NodoCumplimiento {
  const avance = promedio(entradas)
  return {
    id,
    title,
    numbering,
    questions,
    children,
    avance,
    personas: personasDe(entradas),
    objetivos: entradas.length,
    reportaron: entradas.filter((entrada) => entrada.objetivo.cumplimiento !== null).length,
    riesgo: riesgoDe(avance, r.calendario, r.abierto),
  }
}

export function arbol(r: ResultadosCiclo, corte: Corte): NodoCumplimiento[] {
  const porEmpresa = agrupar(entradasDe(r), (entrada) => entrada.objetivo.empresa ?? SIN_EMPRESA)
  const orden = [...OBJETIVOS_EMPRESA.map((objetivo) => objetivo.id), SIN_EMPRESA].filter((id) => porEmpresa.has(id))
  return orden.map((empresa, i) => {
    const entradas = porEmpresa.get(empresa) ?? []
    const grupos = [...agrupar(entradas, (entrada) => grupoDe(entrada.persona, corte)).entries()]
      .map(([grupo, delGrupo]) => ({ grupo, delGrupo, avance: promedio(delGrupo) }))
      // Del más rezagado al más adelantado: lo que frena el objetivo de empresa aparece primero.
      .sort((a, b) => a.avance - b.avance)
      .map(({ grupo, delGrupo }, j) => {
        const objetivos = [...agrupar(delGrupo, (entrada) => entrada.objetivo.titulo).entries()]
          .map(([titulo, deEste]) => ({ id: `${empresa}-${grupo}-${titulo}`, titulo, avance: promedio(deEste), entradas: deEste }))
          .sort((a, b) => a.avance - b.avance)
        return nodo(r, `${empresa}-${grupo}`, grupo, `${i + 1}.${j + 1}`, delGrupo, [], objetivos)
      })
    return nodo(r, empresa, titulosEmpresa.get(empresa) ?? 'Sin objetivo de empresa', String(i + 1), entradas, grupos, [])
  })
}

// El tono del mapa de calor (la escala de colores de Encuestas) para el color que eligió cada nivel.
const TONO_ESCALA: Readonly<Record<TonoId, ScaleTone>> = { destructive: 'softer-negative', warning: 'warning', info: 'positive', success: 'positive', primary: 'deep-positive', neutral: 'nsnr' }

export type Escala = readonly (OpcionEscala & { desde: number; hasta: number })[]

/** La escala del cumplimiento: los niveles del ciclo (de su configuración, 21-oct) y, arriba, quien ya llegó a la meta. */
export function escalaDe(niveles: readonly NivelVista[]): Escala {
  const propios = niveles.filter((nivel) => nivel.id !== 'por-iniciar').sort((a, b) => b.desde - a.desde)
  return [
    { id: 'meta', label: 'En meta', range: '100 % o más', tone: 'deep-positive', desde: 100, hasta: Number.POSITIVE_INFINITY },
    ...propios.map((nivel) => ({ id: nivel.id, label: nivel.etiqueta, range: nivel.rango, tone: TONO_ESCALA[nivel.tono], desde: nivel.desde, hasta: Math.min(nivel.hasta, 99.9) })),
  ]
}

export function bandaDe(avance: number, escala: Escala): { id: string; label: string; tone: ScaleTone } {
  const banda = escala.find((tramo) => avance >= tramo.desde && avance <= tramo.hasta) ?? (avance >= 100 ? escala[0] : escala[escala.length - 1])
  return { id: banda.id, label: banda.label, tone: banda.tone as ScaleTone }
}

export type CeldaMapa = { avance: number | null; personas: number; reservada: boolean }
export interface FilaMapa {
  id: string
  etiqueta: string
  nivel: 1 | 2
  total: number
  celdas: readonly CeldaMapa[]
  hijas: readonly FilaMapa[]
}

/** El mapa de calor: una fila por objetivo de empresa y, dentro, sus objetivos; una columna por grupo del corte. Un cruce
 *  de menos de tres personas sale reservado, como en Encuestas: sería el resultado de una persona. */
export function mapa(r: ResultadosCiclo, corte: Corte): { columnas: string[]; filas: FilaMapa[] } {
  const entradas = entradasDe(r)
  const columnas = [...new Set(entradas.map((entrada) => grupoDe(entrada.persona, corte)))].sort((a, b) => a.localeCompare(b, 'es'))
  const celdas = (delaFila: readonly Entrada[]) => {
    const porGrupo = agrupar(delaFila, (entrada) => grupoDe(entrada.persona, corte))
    return columnas.map((columna): CeldaMapa => {
      const deEsta = porGrupo.get(columna) ?? []
      const personas = personasDe(deEsta)
      return { avance: deEsta.length ? promedio(deEsta) : null, personas, reservada: personas > 0 && personas < MINIMO_GRUPO }
    })
  }
  const porEmpresa = agrupar(entradas, (entrada) => entrada.objetivo.empresa ?? SIN_EMPRESA)
  const orden = [...OBJETIVOS_EMPRESA.map((objetivo) => objetivo.id), SIN_EMPRESA].filter((id) => porEmpresa.has(id))
  const filas = orden.map((empresa): FilaMapa => {
    const deEmpresa = porEmpresa.get(empresa) ?? []
    const hijas = [...agrupar(deEmpresa, (entrada) => entrada.objetivo.titulo).entries()]
      .sort(([a], [b]) => a.localeCompare(b, 'es'))
      .map(([titulo, deEste]): FilaMapa => ({ id: `${empresa}-${titulo}`, etiqueta: titulo, nivel: 2, total: promedio(deEste), celdas: celdas(deEste), hijas: [] }))
    return { id: empresa, etiqueta: titulosEmpresa.get(empresa) ?? 'Sin objetivo de empresa', nivel: 1, total: promedio(deEmpresa), celdas: celdas(deEmpresa), hijas }
  })
  return { columnas, filas }
}
