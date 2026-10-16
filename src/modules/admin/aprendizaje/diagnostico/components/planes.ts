import { BD_PLANES_FORMACION } from '@/shared/bd'

// Los planes de formación, leídos de la base compartida —la misma que importamos del playground anterior— y no de
// los datos de demo de Planes de formación, que son de otra persona y usan nombres de competencia escritos a mano.
//
// Aquí solo interesan los **planes de competencias**: son los únicos que un assessment puede medir, porque un plan de
// contenidos no asigna competencias sino cursos. De los 72 planes de la base, 9 lo son.
//
// Las competencias llegan **por id** (`comp-024`), que resuelve contra `shared/bd/competencias.ts`. Eso es lo que
// mantiene el vocabulario unido: si mañana la empresa renombra una competencia, se renombra en un solo sitio.

/** Lo que la base guarda de cada plan; solo se declara lo que usamos. */
type PlanCrudo = {
  id: string
  tipo: 'competencias' | 'contenidos'
  nombre: string
  estado: EstadoPlan
  fechaInicioIso: string
  fechaFinIso: string
  asignaciones?: { colaboradorId: string }[]
  competenciaPorUsuario?: Record<string, { id: string; nombre: string }[]>
}

/** Los tres estados que trae la base. «Procesando» no existe aquí: dura segundos y no se lista (30-sep-2026). */
export type EstadoPlan = 'Planeado' | 'Vigente' | 'No vigente'

export type Plan = {
  id: string
  nombre: string
  estado: EstadoPlan
  /** ISO, `2026-08-01`. */
  inicio: string
  fin: string
  personas: number
  /** Las competencias del plan, sin repetir. El id resuelve contra `shared/bd/competencias.ts`. */
  competencias: { id: string; nombre: string }[]
}

/** Los mismos colores que usa Diagnóstico para sus propios estados, para que la palabra y el color vayan juntos. */
export const BADGE_ESTADO: Record<EstadoPlan, 'secondary' | 'success-light' | 'outline'> = {
  Planeado: 'secondary',
  Vigente: 'success-light',
  'No vigente': 'outline',
}

function aPlan(crudo: PlanCrudo): Plan {
  const todas = Object.values(crudo.competenciaPorUsuario ?? {}).flatMap((items) => items)
  const vistas = new Set<string>()
  const competencias = todas.filter((c) => !vistas.has(c.nombre) && vistas.add(c.nombre)).map((c) => ({ id: c.id, nombre: c.nombre }))
  return {
    id: crudo.id,
    nombre: crudo.nombre,
    estado: crudo.estado,
    inicio: crudo.fechaInicioIso,
    fin: crudo.fechaFinIso,
    personas: (crudo.asignaciones ?? []).length,
    competencias,
  }
}

/** Los planes que pueden tener assessment: los de competencias, del más reciente al más viejo. */
export const PLANES: Plan[] = (BD_PLANES_FORMACION as { planes: PlanCrudo[] }).planes
  .filter((plan) => plan.tipo === 'competencias')
  .map(aPlan)
  .sort((a, b) => b.inicio.localeCompare(a.inicio))

export const totalPersonas = (plan: Plan) => plan.personas
