import {
  avancePlan,
  conteoContenidos,
  fechaCorta,
  horasMinutos,
  minutosCompetencia,
  persona,
  PLANES,
  REGISTROS,
  USUARIO_ID,
  type Plan,
  type Registro,
} from '../../zona-de-estudio/components/datos'
import { plural } from '@/modules/design-system/patrones/formato'

// Datos de Progreso (HU-progreso): el equipo de María Alejandra, sus planes vigentes, los indicadores y los rankings.
// Salen de la misma base de planes que la Zona de estudio.

export type Demo = 'normal' | 'equipo-grande' | 'sin-planes'
export const leerDemo = (valor: string | null): Demo =>
  valor === 'equipo-grande' ? valor : valor === 'sin-planes' || valor === 'vacio' ? 'sin-planes' : 'normal'

export const LIDER = persona(USUARIO_ID) as Registro
const AREA_LIDER = LIDER?.area ?? 'Logística'

/** El equipo: la líder primero y luego sus reportes directos; en los demos grandes, 25 personas. */
export function equipo(demo: Demo): Registro[] {
  const base = [LIDER, ...REGISTROS.filter((r) => r.jefe === LIDER.nombre && !r.esGerenteGeneral)]
  if (demo === 'normal') return base
  const ids = new Set(base.map((r) => r.id))
  const extra = REGISTROS.filter((r) => !r.esGerenteGeneral && r.cargo !== 'Gerente General' && !ids.has(r.id))
  return [...base, ...extra].slice(0, 25)
}

export const VISIBLES = 10

export const planesVigentes = (id: string, vacio: boolean) => (vacio ? [] : PLANES.getPlanesParaColaborador(id, { estados: ['Vigente'] }))

export function indicadores(planes: Plan[], id: string) {
  const pcts = planes.map((p) => avancePlan(p, id))
  return {
    vigentes: planes.length,
    completados: pcts.filter((p) => p >= 100).length,
    enCurso: pcts.filter((p) => p > 0 && p < 100).length,
    sinIniciar: pcts.filter((p) => p <= 0).length,
    promedio: pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0,
  }
}

/** Lo que se lee en la tarjeta de cada plan vigente. */
export function resumenPlan(plan: Plan, id: string) {
  const pct = avancePlan(plan, id)
  let etiqueta: string
  if (plan.tipo === 'competencias') {
    const { hechos, total } = minutosCompetencia(plan, id)
    etiqueta = `${horasMinutos(hechos)} de ${horasMinutos(total)}`
  } else {
    const { hechos, total } = conteoContenidos(plan, id)
    etiqueta = `${hechos}/${total} ${plural(total, 'contenido', 'contenidos')}`
  }
  return { pct, etiqueta, cierre: `Cierre: ${fechaCorta(plan.fechaFinIso)}` }
}

// ── Tiempo de estudio ────────────────────────────────────────────────────────────────────────────────────────────

const aMinutos = (duracion?: string) => {
  if (!duracion) return 60
  const n = parseFloat(duracion.replace(',', '.'))
  if (Number.isNaN(n)) return 60
  return /h/.test(duracion) ? n * 60 : n
}

/** Minutos estudiados por una persona en sus planes vigentes. */
export function minutosDe(id: string) {
  return planesVigentes(id, false).reduce((total, plan) => {
    if (plan.tipo === 'competencias') return total + Math.round((plan.consumoPorUsuario?.[id]?.horas ?? 0) * 60)
    return total + (plan.contenidoPorUsuario?.[id] ?? []).reduce((s, i) => s + Math.round((aMinutos(i.duration) * (i.progress ?? 0)) / 100), 0)
  }, 0)
}

/** Una fila de ranking: `valor` ordena y `texto` es lo que se lee (tiempo de estudio o cursos por persona). */
export type Fila = { clave: string; etiqueta: string; valor: number; texto: string }

const ordenar = (filas: Omit<Fila, 'texto'>[]): Fila[] =>
  [...filas].sort((a, b) => b.valor - a.valor).map((f) => ({ ...f, texto: horasMinutos(f.valor) }))

export const rankingEquipo = (personas: Registro[]) => ordenar(personas.map((p) => ({ clave: p.id, etiqueta: p.nombre, valor: minutosDe(p.id) })))

export const rankingEmpresa = () => ordenar(REGISTROS.map((p) => ({ clave: p.id, etiqueta: p.nombre, valor: minutosDe(p.id) })))

const PROMEDIO = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 })

/**
 * Ranking entre áreas: cursos finalizados dividido entre las personas del área, para que un área grande no gane solo
 * por tener más gente. Cuenta los cursos terminados en todos sus planes de contenidos (vigentes y ya vencidos; los que
 * aún no empiezan no tienen avance) y a todas las personas del área, hayan estudiado o no.
 */
export function rankingAreas(): Fila[] {
  const planes = PLANES.getPlanesVisiblesCreator().filter((p) => p.tipo === 'contenidos' && (p.estado === 'Vigente' || p.estado === 'No vigente'))
  const cursosDe = (id: string) =>
    planes.reduce((t, plan) => t + (plan.contenidoPorUsuario?.[id] ?? []).filter((i) => (i.progress ?? 0) >= 100).length, 0)
  const porArea = new Map<string, { cursos: number; personas: number }>()
  REGISTROS.forEach((r) => {
    const a = porArea.get(r.area) ?? { cursos: 0, personas: 0 }
    porArea.set(r.area, { cursos: a.cursos + cursosDe(r.id), personas: a.personas + 1 })
  })
  return [...porArea]
    .filter(([, a]) => a.cursos > 0)
    .map(([area, a]) => {
      const promedio = a.cursos / a.personas
      return { clave: area, etiqueta: area, valor: promedio, texto: `${PROMEDIO.format(promedio)} ${promedio === 1 ? 'curso' : 'cursos'}` }
    })
    .sort((a, b) => b.valor - a.valor)
}

export const AREA_PROPIA = AREA_LIDER

/** ¿Alguien del equipo tiene un plan vigente sin terminar? Si no, el recordatorio no tiene a quién llegar. */
export const hayPendientes = (personas: Registro[], vacio: boolean) =>
  !vacio && personas.some((p) => planesVigentes(p.id, false).some((plan) => avancePlan(plan, p.id) < 100))
