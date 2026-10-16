import type { Collaborator } from './collaborators'

// Filtrar personas por líder, rol, área, país y ciudad: los campos con los valores que existen en una lista, si alguien
// pasa los filtros y cómo se aplica un cambio. Lo usan Participantes › Por persona y Objetivos › Objetivos asignados.

const SIN_LIDER = 'Sin líder'

/** Un campo del botón «Filtros»: `valor` vacío es «sin filtrar». */
export type CampoFiltro = { id: string; etiqueta: string; valor: string; opciones: readonly string[]; todos: string }

/** Los campos por los que se filtra a una persona. */
const CAMPOS = [
  { id: 'leader', etiqueta: 'Líder', todos: 'Todos los líderes' },
  { id: 'role', etiqueta: 'Rol', todos: 'Todos los roles' },
  { id: 'area', etiqueta: 'Área', todos: 'Todas las áreas' },
  { id: 'country', etiqueta: 'País', todos: 'Todos los países' },
  { id: 'city', etiqueta: 'Ciudad', todos: 'Todas las ciudades' },
] as const

type ClavePersona = (typeof CAMPOS)[number]['id']
export type FiltrosPersona = Partial<Record<ClavePersona, string>>

const valorDe = (persona: Collaborator, clave: ClavePersona) => (clave === 'leader' ? (persona.leader ?? SIN_LIDER) : persona[clave])

export const cumpleFiltros = (persona: Collaborator, filtros: FiltrosPersona) =>
  CAMPOS.every(({ id }) => !filtros[id] || valorDe(persona, id) === filtros[id])

/** Los cinco campos con los valores que hay en `personas`. La ciudad se acota al país elegido. */
export function camposDePersona(personas: readonly Collaborator[], filtros: FiltrosPersona): CampoFiltro[] {
  return CAMPOS.map(({ id, etiqueta, todos }) => {
    const base = id === 'city' && filtros.country ? personas.filter((persona) => persona.country === filtros.country) : personas
    const opciones = [...new Set(base.map((persona) => valorDe(persona, id)))].sort((a, b) => a.localeCompare(b, 'es'))
    return { id, etiqueta, todos, valor: filtros[id] ?? '', opciones }
  })
}

/** Aplica un cambio de campo. Cambiar de país suelta la ciudad, que podría no estar en el nuevo. */
export function conFiltro(filtros: FiltrosPersona, id: string, valor: string): FiltrosPersona {
  const siguiente = { ...filtros, [id]: valor || undefined }
  if (id === 'country') siguiente.city = undefined
  return siguiente
}
