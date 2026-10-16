// Colaboradores con la evaluación 360 del ciclo Q3 vencida.

export type Person = { id: string; name: string; role: string; area: string; days: number; email: string | null }

const RAW: [string, string, string, number, boolean][] = [
  ['Laura Méndez', 'Analista de datos', 'Analítica', 12, true],
  ['Andrés Pardo', 'Ejecutivo comercial', 'Ventas', 9, true],
  ['Sara Gómez', 'Coordinadora de bodega', 'Operaciones', 15, true],
  ['Julián Rincón', 'Técnico de mantenimiento', 'Operaciones', 21, false],
  ['Camila Torres', 'Diseñadora de producto', 'Tecnología', 6, true],
  ['Felipe Ospina', 'Líder de nómina', 'Gestión humana', 8, true],
  ['Valentina Ruiz', 'Analista contable', 'Finanzas', 11, true],
  ['Diego Castaño', 'Operario de línea', 'Operaciones', 18, false],
  ['Natalia Herrera', 'Ejecutiva de cuenta', 'Ventas', 7, true],
  ['Mateo Vargas', 'Desarrollador', 'Tecnología', 5, true],
  ['Luisa Cárdenas', 'Supervisora de turno', 'Operaciones', 14, false],
  ['Santiago Moreno', 'Analista de compras', 'Finanzas', 10, true],
  ['Daniela Quintero', 'Asistente administrativa', 'Administración', 4, true],
  ['Carlos Beltrán', 'Jefe de planta', 'Operaciones', 3, true],
  ['Paula Jiménez', 'Especialista en selección', 'Gestión humana', 6, true],
  ['Sebastián Rojas', 'Analista de BI', 'Analítica', 2, true],
  ['Mariana López', 'Ejecutiva comercial', 'Ventas', 5, true],
  ['Tomás Arango', 'Técnico eléctrico', 'Operaciones', 9, true],
  ['Isabella Cruz', 'Contadora', 'Finanzas', 3, true],
  ['Juan Esteban Gil', 'Soporte TI', 'Tecnología', 7, true],
  ['Manuela Salazar', 'Coordinadora de bienestar', 'Gestión humana', 2, true],
  ['Alejandro Duque', 'Operario de línea', 'Operaciones', 13, true],
  ['Gabriela Peña', 'Analista de mercadeo', 'Ventas', 4, true],
  ['Nicolás Franco', 'Auditor interno', 'Finanzas', 1, true],
]

const slug = (name: string) =>
  name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/ /g, '.')

export const PEOPLE: Person[] = RAW.map(([name, role, area, days, hasEmail], index) => ({
  id: `p${index + 1}`,
  name,
  role,
  area,
  days,
  email: hasEmail ? `${slug(name)}@metacolombia.co` : null,
}))

export const PRESELECTED = PEOPLE.slice(0, 12).map((person) => person.id)

export const DEFAULT_MESSAGE =
  'Hola {nombre}, tu evaluación 360 del ciclo Q3 sigue pendiente: cerraba el 5 de septiembre. Te toma unos 15 minutos. Complétala antes del viernes 19 para que tu líder la tenga en cuenta. Gracias.'

export const SHORT_MESSAGE = 'Hola {nombre}: te falta la evaluación 360 del Q3. Son 15 minutos; complétala antes del viernes 19.'

export type Channels = { email: boolean; app: boolean }

// Resumen del impacto real: a quién le llega y por dónde.
export function impactText(count: number, invalid: number, channels: Channels, fallback: boolean) {
  const valid = count - invalid
  if (channels.email && channels.app) {
    return invalid
      ? `Llega a ${count} personas: ${valid} por correo y notificación, ${invalid} solo por notificación · no usa créditos`
      : `Llega a ${count} personas por correo y notificación · no usa créditos`
  }
  if (channels.email) {
    if (!invalid) return `Llega a ${count} personas por correo · no usa créditos`
    return fallback
      ? `Llega a ${count} personas: ${valid} por correo, ${invalid} solo por notificación · no usa créditos`
      : `Llega a ${valid} de ${count} personas por correo · ${invalid} no lo reciben · no usa créditos`
  }
  return `Llega a ${count} personas por notificación en la app · no usa créditos`
}
