export type Audience = 'empresa' | 'area' | 'personas'

export type PlanForm = {
  name: string
  goal: string
  category: string
  audience: Audience
  area: string
  people: string
  courses: string[]
  deadline: string
  reminders: boolean
  notifyManagers: boolean
}

export const EMPTY_PLAN: PlanForm = {
  name: '',
  goal: '',
  category: 'liderazgo',
  audience: 'area',
  area: '',
  people: '',
  courses: [],
  deadline: '',
  reminders: true,
  notifyManagers: true,
}

export const STEPS = [
  { label: 'Datos básicos', description: 'Ponle un nombre claro y cuenta para qué sirve el plan.' },
  { label: 'Audiencia', description: 'Elige quién debe completar el plan.' },
  { label: 'Contenido', description: 'Suma los cursos y define hasta cuándo hay plazo.' },
  { label: 'Revisión', description: 'Confirma que todo esté bien antes de crear el plan.' },
]

export const CATEGORIES = [
  { value: 'liderazgo', label: 'Liderazgo' },
  { value: 'normativo', label: 'Normativo y cumplimiento' },
  { value: 'tecnico', label: 'Técnico' },
  { value: 'onboarding', label: 'Onboarding' },
]

export const AREAS = [
  { value: 'comercial', label: 'Comercial', people: 186 },
  { value: 'operaciones', label: 'Operaciones', people: 412 },
  { value: 'tecnologia', label: 'Tecnología', people: 94 },
  { value: 'gestion-humana', label: 'Gestión humana', people: 38 },
]

export const COURSES = [
  { id: 'feedback', title: 'Conversaciones de feedback', provider: 'UBITS', minutes: 45 },
  { id: 'delegar', title: 'Delegar sin perder el control', provider: 'UBITS', minutes: 60 },
  { id: 'equipos', title: 'Liderar equipos híbridos', provider: 'UBITS', minutes: 90 },
  { id: 'sagrilaft', title: 'SAGRILAFT para líderes', provider: 'Meta Colombia', minutes: 30 },
  { id: 'datos', title: 'Decisiones con datos', provider: 'UBITS', minutes: 75 },
]

export const COMPANY_PEOPLE = 1240

export function audienceCount(form: PlanForm) {
  if (form.audience === 'empresa') return COMPANY_PEOPLE
  if (form.audience === 'area') return AREAS.find((a) => a.value === form.area)?.people ?? 0
  return form.people.split(/[\n,;]+/).filter((line) => line.trim()).length
}

// Siguiente se habilita solo cuando el paso tiene lo obligatorio.
export function isStepValid(step: number, form: PlanForm) {
  if (step === 1) return Boolean(form.name.trim() && form.goal.trim())
  if (step === 2) return form.audience === 'empresa' || (form.audience === 'area' ? Boolean(form.area) : Boolean(form.people.trim()))
  if (step === 3) return form.courses.length > 0 && Boolean(form.deadline)
  return true
}
