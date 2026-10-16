import { formatSurveyDate, parseSurveyDate, startOfToday } from '../../encuestas/modelo/surveyListDates'
import type { CicloDraft } from './constructor/cicloBuilderTypes'

// Los ciclos de objetivos de la empresa: el periodo en que un grupo de personas reporta avance sobre sus objetivos.
// Las fechas usan el mismo formato corto que la lista de Encuestas («03 ago 2026»), así se ordenan, se filtran y se
// editan con las mismas utilidades. Los ciclos abiertos se fechan contra hoy, para que las alertas del home
// (avance bajo, cierra pronto) signifiquen algo el día que se abra la maqueta.

export type EstadoCiclo = 'En curso' | 'Por iniciar' | 'Finalizado' | 'Borrador'
export type Periodo = 'Mes' | 'Bimestre' | 'Trimestre' | 'Semestre' | 'Año' | 'Personalizado'

export interface Lectura {
  /** Avance promedio de los objetivos del ciclo, en %. Puede pasar de 100 cuando se supera la meta. */
  avance: number
  /** Qué parte de los objetivos ya llegó a su meta, en %. */
  cumplidos: number
  /** Qué parte de las personas del ciclo reportó avance en el último corte, en %. */
  reportando: number
}

export interface Ciclo extends Lectura {
  id: string
  nombre: string
  periodo: Periodo
  inicio: string
  cierre: string
  estado: EstadoCiclo
  objetivos: number
  personas: number
  /** La lectura del ciclo anterior equivalente: la base de las insignias de cambio. */
  anterior: Lectura | null
  /** El borrador del constructor, si el ciclo nació o se editó ahí: con él se reabre tal cual se dejó. */
  draft?: CicloDraft
}

const dia = (desplazamiento: number): string => {
  const fecha = startOfToday()
  fecha.setDate(fecha.getDate() + desplazamiento)
  return formatSurveyDate(fecha)
}

const SIN_LECTURA: Lectura = { avance: 0, cumplidos: 0, reportando: 0 }

export const CICLOS: readonly Ciclo[] = [
  // En curso: dos con avance bajo y cierre cercano, uno a mitad de camino y dos que van bien.
  { id: 'kpis-corporativos-2026', nombre: 'KPIs corporativos 2026', periodo: 'Trimestre', inicio: dia(-85), cierre: dia(5), estado: 'En curso', objetivos: 3, personas: 42, avance: 7.5, cumplidos: 0, reportando: 88, anterior: { avance: 62, cumplidos: 33, reportando: 95 } },
  { id: 'metas-comerciales-q4', nombre: 'Metas comerciales Q4', periodo: 'Trimestre', inicio: dia(-6), cierre: dia(85), estado: 'En curso', objetivos: 5, personas: 64, avance: 12, cumplidos: 0, reportando: 97, anterior: { avance: 18, cumplidos: 0, reportando: 98 } },
  { id: 'metas-comerciales-q3', nombre: 'Metas comerciales Q3', periodo: 'Personalizado', inicio: dia(-42), cierre: dia(3), estado: 'En curso', objetivos: 3, personas: 38, avance: 125, cumplidos: 100, reportando: 100, anterior: { avance: 96, cumplidos: 67, reportando: 100 } },
  { id: 'compania-ii-semestre', nombre: 'Objetivos de compañía · II semestre', periodo: 'Semestre', inicio: dia(-47), cierre: dia(137), estado: 'En curso', objetivos: 10, personas: 310, avance: 85, cumplidos: 40, reportando: 99, anterior: { avance: 71, cumplidos: 30, reportando: 98 } },
  { id: 'crecimiento-oct', nombre: 'Objetivos de crecimiento · Octubre', periodo: 'Mes', inicio: dia(-5), cierre: dia(25), estado: 'En curso', objetivos: 4, personas: 26, avance: 33.3, cumplidos: 25, reportando: 92, anterior: { avance: 58, cumplidos: 50, reportando: 96 } },
  { id: 'servicio-cliente-q4', nombre: 'Servicio al cliente Q4', periodo: 'Trimestre', inicio: dia(-6), cierre: dia(85), estado: 'En curso', objetivos: 3, personas: 55, avance: 21, cumplidos: 0, reportando: 81, anterior: { avance: 24, cumplidos: 0, reportando: 90 } },
  { id: 'operaciones-ii-semestre', nombre: 'Eficiencia operativa · II semestre', periodo: 'Semestre', inicio: dia(-97), cierre: dia(87), estado: 'En curso', objetivos: 6, personas: 120, avance: 28, cumplidos: 17, reportando: 94, anterior: { avance: 52, cumplidos: 33, reportando: 97 } },
  { id: 'gente-cultura-2026', nombre: 'Gente y cultura 2026', periodo: 'Año', inicio: dia(-278), cierre: dia(86), estado: 'En curso', objetivos: 4, personas: 18, avance: 41, cumplidos: 25, reportando: 100, anterior: { avance: 77, cumplidos: 50, reportando: 100 } },
  { id: 'marketing-sep', nombre: 'Lanzamiento de marca · Septiembre', periodo: 'Mes', inicio: dia(-36), cierre: dia(2), estado: 'En curso', objetivos: 3, personas: 12, avance: 19, cumplidos: 0, reportando: 75, anterior: { avance: 70, cumplidos: 33, reportando: 100 } },
  // Por iniciar y borradores: sin lectura todavía.
  { id: 'kpis-2027', nombre: 'KPIs corporativos 2027', periodo: 'Año', inicio: dia(87), cierre: dia(451), estado: 'Por iniciar', objetivos: 6, personas: 42, ...SIN_LECTURA, anterior: null },
  { id: 'tecnologia-q1-2027', nombre: 'Tecnología Q1 2027', periodo: 'Trimestre', inicio: dia(87), cierre: dia(177), estado: 'Por iniciar', objetivos: 4, personas: 35, ...SIN_LECTURA, anterior: null },
  { id: 'onboarding-nov', nombre: 'Objetivos de onboarding · Noviembre', periodo: 'Mes', inicio: dia(26), cierre: dia(55), estado: 'Borrador', objetivos: 2, personas: 0, ...SIN_LECTURA, anterior: null },
  // Finalizados: la historia que alimenta la curva de objetivos cumplidos.
  { id: 'metas-comerciales-q2', nombre: 'Metas comerciales Q2', periodo: 'Trimestre', inicio: '01 abr 2026', cierre: '30 jun 2026', estado: 'Finalizado', objetivos: 4, personas: 37, avance: 96, cumplidos: 75, reportando: 100, anterior: { avance: 88, cumplidos: 50, reportando: 97 } },
  { id: 'servicio-cliente-q2', nombre: 'Servicio al cliente Q2', periodo: 'Trimestre', inicio: '01 abr 2026', cierre: '30 jun 2026', estado: 'Finalizado', objetivos: 3, personas: 52, avance: 74, cumplidos: 33, reportando: 96, anterior: { avance: 70, cumplidos: 33, reportando: 92 } },
  { id: 'compania-i-semestre', nombre: 'Objetivos de compañía · I semestre', periodo: 'Semestre', inicio: '01 ene 2026', cierre: '30 jun 2026', estado: 'Finalizado', objetivos: 10, personas: 305, avance: 71, cumplidos: 30, reportando: 98, anterior: { avance: 66, cumplidos: 30, reportando: 95 } },
  { id: 'metas-comerciales-q1', nombre: 'Metas comerciales Q1', periodo: 'Trimestre', inicio: '01 ene 2026', cierre: '31 mar 2026', estado: 'Finalizado', objetivos: 4, personas: 36, avance: 88, cumplidos: 50, reportando: 97, anterior: { avance: 81, cumplidos: 50, reportando: 94 } },
  { id: 'eficiencia-i-semestre', nombre: 'Eficiencia operativa · I semestre', periodo: 'Semestre', inicio: '01 ene 2026', cierre: '30 jun 2026', estado: 'Finalizado', objetivos: 6, personas: 118, avance: 62, cumplidos: 33, reportando: 95, anterior: { avance: 58, cumplidos: 17, reportando: 93 } },
]

/** Lo que ya está en marcha o terminó: lo único con lectura de avance. */
export const tieneLectura = (ciclo: Pick<Ciclo, 'estado'>) => ciclo.estado === 'En curso' || ciclo.estado === 'Finalizado'

/** Días que faltan para el cierre (negativo si ya pasó). */
export function diasParaCierre(ciclo: Pick<Ciclo, 'cierre'>, hoy: Date = startOfToday()): number {
  const cierre = parseSurveyDate(ciclo.cierre)
  return cierre ? Math.round((cierre.getTime() - hoy.getTime()) / 86_400_000) : Number.POSITIVE_INFINITY
}

/** Qué parte del calendario del ciclo ya pasó, en %: el avance que se esperaría hoy si fuera parejo. */
export function avanceEsperado(ciclo: Pick<Ciclo, 'inicio' | 'cierre'>, hoy: Date = startOfToday()): number {
  const inicio = parseSurveyDate(ciclo.inicio)
  const cierre = parseSurveyDate(ciclo.cierre)
  if (!inicio || !cierre || cierre <= inicio) return 0
  const transcurrido = (hoy.getTime() - inicio.getTime()) / (cierre.getTime() - inicio.getTime())
  return Math.round(Math.min(1, Math.max(0, transcurrido)) * 100)
}

/** `125` → `"125%"`, `7.5` → `"7,5%"`. */
export const formatoAvance = (valor: number) => `${valor.toLocaleString('es-CO', { maximumFractionDigits: 1 })}%`
