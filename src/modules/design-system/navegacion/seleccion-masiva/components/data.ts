// Directorio de colaboradores generado para la demo de selección masiva.

export type Person = {
  id: number
  name: string
  email: string
  role: string
  area: string
  site: string
  status: 'Activo' | 'En vacaciones' | 'Incapacidad'
  joined: string
  // La misma fecha como número (aaaammdd), para ordenar la columna «Ingreso».
  joinedOrder: number
}

const FIRST = ['Valentina', 'Julián', 'Mariana', 'Santiago', 'Camila', 'Daniel', 'Laura', 'Andrés', 'Paula', 'Felipe', 'Natalia', 'Sebastián', 'Isabela', 'Mateo', 'Sofía', 'Tomás']
const LAST = ['Rojas', 'Castro', 'López', 'Herrera', 'Torres', 'Moreno', 'Vargas', 'Gil', 'Ramírez', 'Duarte', 'Pineda', 'Ortiz', 'Cárdenas', 'Suárez', 'Mejía', 'Rincón']
const ROLES: [string, string][] = [
  ['Analista de datos', 'Analítica'],
  ['Ejecutivo comercial', 'Ventas'],
  ['Diseñador de producto', 'Tecnología'],
  ['Coordinador de bodega', 'Operaciones'],
  ['Analista contable', 'Finanzas'],
  ['Desarrollador backend', 'Tecnología'],
  ['Líder de nómina', 'Gestión humana'],
  ['Asesor de servicio', 'Ventas'],
]
const SITES = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla']
const STATUSES: Person['status'][] = ['Activo', 'Activo', 'Activo', 'En vacaciones', 'Activo', 'Incapacidad']
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic']

const slug = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

export const PEOPLE: Person[] = Array.from({ length: 32 }, (_, i) => {
  const first = FIRST[i % FIRST.length]
  const last = LAST[(i * 7 + 3) % LAST.length]
  const [role, area] = ROLES[(i * 5) % ROLES.length]
  const [day, month, year] = [((i * 11) % 28) + 1, (i * 5) % 12, 2019 + (i % 7)]
  return {
    id: i + 1,
    name: `${first} ${last}`,
    email: `${slug(first)}.${slug(last)}@meta.co`,
    role,
    area,
    site: SITES[(i * 3) % SITES.length],
    status: STATUSES[i % STATUSES.length],
    joined: `${day} ${MONTHS[month]} ${year}`,
    joinedOrder: year * 10000 + (month + 1) * 100 + day,
  }
})

export const AREA_OPTIONS = [
  { value: 'todas', label: 'Todas las áreas' },
  ...[...new Set(ROLES.map(([, area]) => area))].sort().map((area) => ({ value: area, label: area })),
]

export const initials = (name: string) =>
  name
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
