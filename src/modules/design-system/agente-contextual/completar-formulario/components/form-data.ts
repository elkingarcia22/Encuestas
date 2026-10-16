// Formulario «Nueva vacante» y lo que el agente infiere de la descripción de ejemplo.

export type FieldKey = 'name' | 'area' | 'city' | 'mode' | 'description' | 'salary' | 'owner'

// empty: sin valor · suggested: lo llenó el agente y falta revisarlo · accepted: aceptado · manual: escrito a mano
export type FieldStatus = 'empty' | 'suggested' | 'accepted' | 'manual'

export const LABELS: Record<FieldKey, string> = {
  name: 'Nombre de la vacante',
  area: 'Área',
  city: 'Ciudad',
  mode: 'Modalidad',
  description: 'Descripción del cargo',
  salary: 'Salario mensual',
  owner: 'Responsable del proceso',
}

export const AREAS = [
  { value: 'analitica', label: 'Analítica' },
  { value: 'ventas', label: 'Ventas' },
  { value: 'operaciones', label: 'Operaciones' },
  { value: 'tecnologia', label: 'Tecnología' },
]

export const MODES = [
  { value: 'presencial', label: 'Presencial' },
  { value: 'hibrido', label: 'Híbrido' },
  { value: 'remoto', label: 'Remoto' },
]

export const OWNERS = [
  { value: 'laura', label: 'Laura Méndez' },
  { value: 'andres', label: 'Andrés Pardo' },
  { value: 'sara', label: 'Sara Gómez' },
]

export const EMPTY: Record<FieldKey, string> = { name: '', area: '', city: '', mode: '', description: '', salary: '', owner: '' }

export const INITIAL_STATUS: Record<FieldKey, FieldStatus> = {
  name: 'empty',
  area: 'empty',
  city: 'empty',
  mode: 'empty',
  description: 'empty',
  salary: 'empty',
  owner: 'empty',
}

export const EXAMPLE =
  'Buscamos Analista de datos para el equipo de Analítica en Bogotá, con modalidad híbrida (tres días en oficina). Va a construir tableros en Power BI, automatizar reportes con SQL y Python y acompañar a Ventas y Operaciones a tomar decisiones con datos. Pedimos 2 años de experiencia, SQL avanzado y buena comunicación.'

export const INFERRED: { key: FieldKey; value: string }[] = [
  { key: 'name', value: 'Analista de datos' },
  { key: 'area', value: 'analitica' },
  { key: 'city', value: 'Bogotá' },
  { key: 'mode', value: 'hibrido' },
  {
    key: 'description',
    value:
      'Construirás tableros en Power BI, automatizarás reportes con SQL y Python y acompañarás a Ventas y Operaciones a decidir con datos. Buscamos 2 años de experiencia, SQL avanzado y buena comunicación.',
  },
]

export const MISSING: { key: FieldKey; reason: string; cta: string }[] = [
  { key: 'salary', reason: 'La descripción no dice el rango salarial.', cta: 'Completar salario' },
  { key: 'owner', reason: 'No sé quién va a llevar el proceso.', cta: 'Elegir responsable' },
]

export function display(key: FieldKey, value: string) {
  if (!value) return 'Vacío'
  const options = key === 'area' ? AREAS : key === 'mode' ? MODES : key === 'owner' ? OWNERS : null
  return options?.find((option) => option.value === value)?.label ?? value
}
