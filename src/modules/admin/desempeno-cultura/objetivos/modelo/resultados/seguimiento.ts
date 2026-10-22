import { COLLABORATORS, type Collaborator } from '../../../encuestas/modelo/collaborators'
import { parseSurveyDate, startOfToday } from '../../../encuestas/modelo/surveyListDates'
import { avanceEsperado, diasParaCierre, type Ciclo } from '../ciclos'
import { CONFIG_INICIAL, nivelPara, nivelesEfectivos, tonoDe, type TonoId } from '../configuracion'
import { SIN_AJUSTES, type AjustesCiclo } from '../../components/ajustes-ciclo'

// El seguimiento de un ciclo para sus resultados (portado del prototipo «configuración objetivos», 9-oct): quiénes
// están en el ciclo, qué objetivos tiene cada uno, cuánto llevan, si reportaron y si conversaron sobre ellos. La lista
// de ciclos solo guarda una lectura resumida (avance, cumplidos, reportando), así que el detalle se siembra a partir de
// esa lectura con un azar fijo por ciclo: abrir el mismo ciclo muestra siempre las mismas personas y las mismas cifras,
// y su promedio cae cerca del avance que dice la lista.

export type Medida = 'porcentaje' | 'numero' | 'dinero' | 'hito'

export interface ObjetivoSeguido {
  id: string
  titulo: string
  medida: Medida
  /** Peso dentro de los objetivos de la persona, en %. Los de cada persona suman 100. */
  peso: number
  /** Cumplimiento en %, o null si todavía no tiene avance reportado. Puede pasar de 100. */
  cumplimiento: number | null
  comentarios: number
  ultimaActualizacion: Date | null
  /** Si el líder ya lo aprobó, si está esperando visto bueno o si lo devolvió para ajustar. */
  etapa: Etapa
  /** El objetivo de empresa del que cuelga, o null si no está alineado. */
  empresa: string | null
  /** Los días en que se reportó avance, para el ritmo de actividad. */
  avances: readonly Date[]
  /** Inactivo (desde Resultados): no cuenta para la persona ni entra al ponderado; su avance se conserva. */
  activo: boolean
}

export type Etapa = 'aprobado' | 'por-aprobar' | 'por-ajustar'
export type Riesgo = 'alto' | 'medio' | 'bajo' | 'sin'

/** Los objetivos de empresa de los ciclos sembrados: el norte del que cuelgan los de cada persona. */
export const OBJETIVOS_EMPRESA: readonly { id: string; titulo: string }[] = [
  { id: 'emp-crecer', titulo: 'Crecer los ingresos un 15 %' },
  { id: 'emp-clientes', titulo: 'Ser la marca preferida de los clientes' },
  { id: 'emp-eficiencia', titulo: 'Operar con más eficiencia' },
]

export interface PersonaSeguida {
  id: string
  colaborador: Collaborator
  objetivos: readonly ObjetivoSeguido[]
  /** Salió del ciclo pero su avance sigue contando en el progreso (eligieron conservarlo al sacarla). */
  retirado: boolean
  /** Avance ponderado: Σ peso × cumplimiento de sus objetivos. null si no reportó nada. */
  avance: number | null
  nivel: NivelVista
  /** Qué tan atrás va frente al calendario (solo con el ciclo abierto). */
  riesgo: Riesgo
}

/** Riesgo como en el prototipo: brecha = calendario corrido − avance. ≥25 alto, ≥12 medio, >0 bajo. Cerrado o ≥100, sin riesgo. */
export function riesgoDe(avance: number | null, calendario: number, abierto: boolean): Riesgo {
  const valor = avance ?? 0
  if (!abierto || valor >= 100) return 'sin'
  const brecha = calendario - valor
  return brecha >= 25 ? 'alto' : brecha >= 12 ? 'medio' : brecha > 0 ? 'bajo' : 'sin'
}

/** Un nivel de desempeño como lo pinta el reporte: su nombre, su color, su insignia y el rango que cubre. */
export interface NivelVista {
  id: string
  etiqueta: string
  color: string
  badge: ReturnType<typeof tonoDe>['badge']
  tono: TonoId
  rango: string
  desde: number
  hasta: number
}

const vista = (id: string, etiqueta: string, tono: TonoId, desde: number, hasta: number, rango = `${desde} a ${hasta} %`): NivelVista => ({ id, etiqueta, color: tonoDe(tono).color, badge: tonoDe(tono).badge, tono, rango, desde, hasta })

/** «Por iniciar» es fijo, para quien no ha reportado (como en el prototipo); los demás son los que configuró el ciclo. */
export const POR_INICIAR = vista('por-iniciar', 'Por iniciar', 'neutral', 0, 0, 'Sin reportes')

/** Los niveles de un ciclo, de su configuración (21-oct): «Por iniciar» primero y luego los suyos, de menor a mayor. */
export function nivelesDe(ciclo: Ciclo): readonly NivelVista[] {
  const config = ciclo.draft?.config ?? CONFIG_INICIAL
  const propios = [...nivelesEfectivos(config)].sort((a, b) => a.desde - b.desde)
  return [POR_INICIAR, ...propios.map((nivel) => vista(nivel.id, nivel.nombre, nivel.tono, nivel.desde, nivel.hasta))]
}

/** El nivel de un avance entre los del ciclo: sin avance, «Por iniciar». */
export function nivelDe(avance: number | null, niveles: readonly NivelVista[]): NivelVista {
  if (avance === null) return POR_INICIAR
  const propios = niveles.filter((nivel) => nivel.id !== POR_INICIAR.id)
  const elegido = nivelPara(avance, propios.map((nivel) => ({ id: nivel.id, nombre: nivel.etiqueta, desde: nivel.desde, hasta: nivel.hasta, tono: 'neutral' as const })))
  return propios.find((nivel) => nivel.id === elegido.id) ?? POR_INICIAR
}

export interface ResultadosCiclo {
  ciclo: Ciclo
  abierto: boolean
  personas: readonly PersonaSeguida[]
  objetivos: number
  /** Promedio simple del avance de las personas que reportaron. */
  avanceGeneral: number
  /** Los niveles del ciclo, en orden, y cuántas personas cayeron en cada uno (por id). */
  niveles: readonly NivelVista[]
  porNivel: Readonly<Record<string, number>>
  /** Qué parte del calendario ya pasó, en %, y cuántos días quedan (solo con el ciclo abierto). */
  calendario: number
  diasRestantes: number
  reportaron: number
  enMeta: number
  conConversacion: number
  /** El avance promedio de cada área, de la más baja a la más alta. */
  porArea: readonly { area: string; avance: number; personas: number }[]
  /** El avance a cada cierre de mes desde el inicio hasta hoy, para la curva. */
  serie: readonly { etiqueta: string; valor: number }[]
}

// Un azar determinista (mulberry32) sembrado con el id del ciclo: las mismas cifras cada vez que se abre.
function azar(semilla: string) {
  let h = 2166136261
  for (const letra of semilla) h = Math.imul(h ^ letra.charCodeAt(0), 16777619)
  let a = h >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const OBJETIVOS_BASE: readonly { titulo: string; medida: Medida }[] = [
  { titulo: 'Aumentar la satisfacción de clientes', medida: 'porcentaje' },
  { titulo: 'Cumplir el presupuesto de ventas del periodo', medida: 'dinero' },
  { titulo: 'Reducir el tiempo de respuesta a solicitudes', medida: 'numero' },
  { titulo: 'Lanzar el nuevo proceso de onboarding', medida: 'hito' },
  { titulo: 'Mejorar la calidad de las entregas', medida: 'porcentaje' },
  { titulo: 'Completar la ruta de formación del equipo', medida: 'porcentaje' },
  { titulo: 'Reducir los costos operativos', medida: 'dinero' },
  { titulo: 'Documentar los procesos críticos del área', medida: 'hito' },
  { titulo: 'Subir la adopción de la plataforma', medida: 'porcentaje' },
  { titulo: 'Cerrar las incidencias abiertas', medida: 'numero' },
]

const MAXIMO_PERSONAS = 80
const MESES = new Intl.DateTimeFormat('es', { month: 'short' })

/** Siembra las personas del ciclo y arma su reporte completo. */
export function construirResultados(ciclo: Ciclo, ajustes: AjustesCiclo = SIN_AJUSTES, hoy: Date = startOfToday()): ResultadosCiclo {
  const r = azar(ciclo.id)
  const abierto = ciclo.estado === 'En curso'
  const total = Math.max(6, Math.min(MAXIMO_PERSONAS, ciclo.personas))
  const desde = Math.floor(r() * (COLLABORATORS.length - total))
  const sinReporte = abierto ? Math.max(0, 1 - ciclo.reportando / 100) : 0
  const hace = (dias: number) => new Date(hoy.getTime() - dias * 86_400_000)

  const crudas = COLLABORATORS.slice(desde, desde + total).map((colaborador, indice) => {
    const cuantos = 2 + Math.floor(r() * 4)
    const pesosCrudos = Array.from({ length: cuantos }, () => 1 + r() * 3)
    const suma = pesosCrudos.reduce((a, b) => a + b, 0)
    const pesos = pesosCrudos.map((peso) => Math.round((peso / suma) * 100))
    pesos[0] += 100 - pesos.reduce((a, b) => a + b, 0)
    const reporto = r() >= sinReporte
    const tendencia = ciclo.avance + (r() - 0.5) * 60
    // Sin repetir objetivo en la misma persona: si sale uno que ya tiene, se toma el siguiente de la lista.
    const usados = new Set<number>()
    const objetivos: ObjetivoSeguido[] = pesos.map((peso, n) => {
      let indice = Math.floor(r() * OBJETIVOS_BASE.length)
      while (usados.has(indice)) indice = (indice + 1) % OBJETIVOS_BASE.length
      usados.add(indice)
      const base = OBJETIVOS_BASE[indice]
      const conAvance = reporto && r() > 0.12
      const crudo = Math.max(0, tendencia + (r() - 0.5) * 50)
      const cumplimiento = conAvance ? (base.medida === 'hito' ? (crudo >= 70 ? 100 : 0) : Math.round(Math.min(150, crudo))) : null
      const etapa: Etapa = abierto && r() < 0.08 ? 'por-aprobar' : abierto && r() < 0.05 ? 'por-ajustar' : 'aprobado'
      const empresa = r() < 0.75 ? OBJETIVOS_EMPRESA[Math.floor(r() * OBJETIVOS_EMPRESA.length)].id : null
      const avances = conAvance ? Array.from({ length: 1 + Math.floor(r() * 4) }, () => hace(Math.floor(r() * 60))) : []
      return {
        id: `${colaborador.id}-${n}`,
        titulo: base.titulo,
        etapa,
        empresa,
        avances,
        medida: base.medida,
        peso,
        cumplimiento,
        comentarios: r() < 0.55 ? Math.floor(1 + r() * 5) : 0,
        ultimaActualizacion: conAvance ? hace(Math.floor(r() * 25)) : null,
        activo: true,
      }
    })
    return { id: `${ciclo.id}-p${indice}`, colaborador, objetivos, retirado: false }
  })

  // Calibración: se escala el cumplimiento sembrado para que el promedio de las personas caiga en el avance que dice la
  // lista de ciclos. Así la fila de la lista y sus resultados cuentan la misma historia.
  const avanceDe = (objetivos: readonly ObjetivoSeguido[]) =>
    objetivos.some((objetivo) => objetivo.cumplimiento !== null) ? objetivos.reduce((s, o) => s + (o.peso / 100) * Math.min(o.cumplimiento ?? 0, 150), 0) : null
  const crudos = crudas.map((persona) => avanceDe(persona.objetivos)).filter((valor): valor is number => valor !== null)
  const promedioCrudo = crudos.length ? crudos.reduce((a, b) => a + b, 0) / crudos.length : 0
  const factor = promedioCrudo > 0 ? ciclo.avance / promedioCrudo : 1
  const niveles = nivelesDe(ciclo)
  const personas: PersonaSeguida[] = crudas.map((persona) => {
    const objetivos = persona.objetivos.map((objetivo) =>
      objetivo.cumplimiento === null || objetivo.medida === 'hito' ? objetivo : { ...objetivo, cumplimiento: Math.round(Math.min(150, objetivo.cumplimiento * factor)) },
    )
    const crudo = avanceDe(objetivos)
    const avance = crudo === null ? null : Math.round(crudo * 10) / 10
    return { ...persona, objetivos, avance, nivel: nivelDe(avance, niveles), riesgo: riesgoDe(avance, avanceEsperado(ciclo, hoy), abierto) }
  })

  return resumir(ciclo, ajustar(personas, ajustes, niveles, ciclo, hoy, abierto), hoy)
}

/** Aplica lo cambiado desde Resultados: quien salió sin conservar su avance deja de contar; quien lo conservó queda
 *  marcado; un objetivo inactivo sale del ponderado de su persona (los pesos de los activos se reparten el 100 %). */
function ajustar(personas: readonly PersonaSeguida[], ajustes: AjustesCiclo, niveles: readonly NivelVista[], ciclo: Ciclo, hoy: Date, abierto: boolean): PersonaSeguida[] {
  if (Object.keys(ajustes.retirados).length === 0 && ajustes.inactivos.length === 0) return [...personas]
  const inactivos = new Set(ajustes.inactivos)
  return personas
    .filter((persona) => ajustes.retirados[persona.id] !== 'descartar')
    .map((persona) => {
      const objetivos = persona.objetivos.map((objetivo) => ({ ...objetivo, activo: !inactivos.has(objetivo.id) }))
      const activos = objetivos.filter((objetivo) => objetivo.activo)
      const pesoActivo = activos.reduce((suma, objetivo) => suma + objetivo.peso, 0)
      const conAvance = activos.some((objetivo) => objetivo.cumplimiento !== null)
      const crudo = conAvance && pesoActivo > 0 ? activos.reduce((suma, objetivo) => suma + (objetivo.peso / pesoActivo) * Math.min(objetivo.cumplimiento ?? 0, 150), 0) : null
      const avance = inactivos.size === 0 || !persona.objetivos.some((objetivo) => inactivos.has(objetivo.id)) ? persona.avance : crudo === null ? null : Math.round(crudo * 10) / 10
      return { ...persona, objetivos, avance, nivel: nivelDe(avance, niveles), riesgo: riesgoDe(avance, avanceEsperado(ciclo, hoy), abierto), retirado: ajustes.retirados[persona.id] === 'conservar' }
    })
}

/** Las cifras del reporte a partir de las personas que se miran: todas las del ciclo o solo las que dejan los filtros. */
export function resumir(ciclo: Ciclo, personas: readonly PersonaSeguida[], hoy: Date = startOfToday()): ResultadosCiclo {
  const abierto = ciclo.estado === 'En curso'
  const conAvance = personas.filter((persona) => persona.avance !== null)
  const avanceGeneral = conAvance.length ? Math.round((conAvance.reduce((s, p) => s + (p.avance ?? 0), 0) / conAvance.length) * 10) / 10 : 0
  const todos = personas.flatMap((persona) => persona.objetivos)
  const niveles = nivelesDe(ciclo)
  const porNivel = Object.fromEntries(niveles.map((nivel) => [nivel.id, personas.filter((persona) => persona.nivel.id === nivel.id).length])) as Record<string, number>

  const areas = new Map<string, number[]>()
  for (const persona of conAvance) areas.set(persona.colaborador.area, [...(areas.get(persona.colaborador.area) ?? []), persona.avance ?? 0])
  const porArea = [...areas.entries()]
    .map(([area, valores]) => ({ area, personas: valores.length, avance: Math.round((valores.reduce((a, b) => a + b, 0) / valores.length) * 10) / 10 }))
    .sort((a, b) => a.avance - b.avance)

  // La curva: del inicio a hoy (o al cierre) por meses, subiendo hasta el avance de hoy.
  const inicio = parseSurveyDate(ciclo.inicio) ?? hoy
  const fin = abierto ? hoy : (parseSurveyDate(ciclo.cierre) ?? hoy)
  const cortes: Date[] = []
  for (let fecha = new Date(inicio.getFullYear(), inicio.getMonth(), 1); fecha <= fin; fecha = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 1)) cortes.push(fecha)
  if (cortes.length < 2) cortes.push(fin)
  const serie = cortes.map((fecha, n) => ({ etiqueta: MESES.format(fecha).replace('.', ''), valor: Math.round((avanceGeneral * (n + 1)) / cortes.length) }))

  return {
    ciclo,
    abierto,
    personas,
    objetivos: todos.length,
    avanceGeneral,
    niveles,
    porNivel,
    calendario: avanceEsperado(ciclo, hoy),
    diasRestantes: Math.max(0, diasParaCierre(ciclo, hoy)),
    reportaron: conAvance.length,
    enMeta: todos.filter((objetivo) => (objetivo.cumplimiento ?? 0) >= 100).length,
    conConversacion: todos.filter((objetivo) => objetivo.comentarios > 0).length,
    porArea,
    serie,
  }
}
