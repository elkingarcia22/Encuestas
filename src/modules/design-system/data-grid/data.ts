export type EstadoColaborador = 'Activo' | 'En onboarding' | 'Inactivo'

export type Colaborador = {
  id: string
  nombre: string
  cargo: string
  area: string
  estado: EstadoColaborador
  progreso: number
  ingreso: string
}

export const AREAS = [
  'Producto',
  'Ingeniería',
  'Personas',
  'Comercial',
  'Operaciones',
  'Marketing',
] as const

export const ESTADOS: EstadoColaborador[] = ['Activo', 'En onboarding', 'Inactivo']

// [nombre, cargo, área, estado, avance del plan de formación, fecha de ingreso]
type Fila = [string, string, string, EstadoColaborador, number, string]

const FILAS: Fila[] = [
  ['Ana Restrepo', 'Diseñadora de producto', 'Producto', 'Activo', 82, '2023-03-14'],
  ['Carlos Medina', 'Ingeniero backend', 'Ingeniería', 'Activo', 64, '2022-08-01'],
  ['Lucía Ortega', 'Analista de personas', 'Personas', 'Activo', 100, '2021-11-22'],
  ['Diego Ferrer', 'Ejecutivo comercial', 'Comercial', 'En onboarding', 18, '2026-07-06'],
  ['Marta Salas', 'Coordinadora de operaciones', 'Operaciones', 'Activo', 71, '2023-01-09'],
  ['Javier Núñez', 'Ingeniero frontend', 'Ingeniería', 'Activo', 45, '2024-02-19'],
  ['Paula Iglesias', 'Content manager', 'Marketing', 'Activo', 93, '2022-05-30'],
  ['Andrés Cabrera', 'Product manager', 'Producto', 'Activo', 57, '2023-09-11'],
  ['Sofía Duarte', 'Reclutadora', 'Personas', 'En onboarding', 25, '2026-06-15'],
  ['Tomás Herrera', 'Ingeniero de datos', 'Ingeniería', 'Activo', 88, '2021-04-05'],
  ['Valeria Ponce', 'Diseñadora UX', 'Producto', 'Activo', 76, '2024-01-08'],
  ['Ignacio Rueda', 'Key account', 'Comercial', 'Inactivo', 34, '2020-10-12'],
  ['Camila Bravo', 'Especialista en cultura', 'Personas', 'Activo', 100, '2022-02-28'],
  ['Rodrigo Vera', 'Ingeniero de plataforma', 'Ingeniería', 'Activo', 52, '2023-06-20'],
  ['Elena Márquez', 'Growth marketer', 'Marketing', 'Activo', 67, '2023-11-02'],
  ['Sebastián Rojas', 'Analista de operaciones', 'Operaciones', 'En onboarding', 12, '2026-08-24'],
  ['Natalia Vargas', 'Product designer', 'Producto', 'Activo', 89, '2022-07-18'],
  ['Felipe Cárdenas', 'Ingeniero QA', 'Ingeniería', 'Activo', 41, '2024-04-03'],
  ['Daniela Soto', 'Business partner', 'Personas', 'Activo', 95, '2021-09-27'],
  ['Mateo Aguirre', 'Ejecutivo comercial', 'Comercial', 'Activo', 60, '2023-04-17'],
  ['Isabel Fuentes', 'Jefa de operaciones', 'Operaciones', 'Activo', 78, '2020-06-01'],
  ['Nicolás Peña', 'Ingeniero móvil', 'Ingeniería', 'Inactivo', 29, '2021-12-13'],
  ['Carolina Ríos', 'Community manager', 'Marketing', 'En onboarding', 8, '2026-09-01'],
  ['Emilio Castro', 'Product owner', 'Producto', 'Activo', 73, '2022-10-25'],
  ['Julia Moreno', 'Analista de nómina', 'Personas', 'Activo', 84, '2023-02-06'],
  ['Álvaro Guzmán', 'Arquitecto de software', 'Ingeniería', 'Activo', 97, '2019-08-19'],
  ['Renata Lozano', 'Diseñadora visual', 'Producto', 'Activo', 38, '2024-05-14'],
  ['Óscar Delgado', 'Gerente comercial', 'Comercial', 'Activo', 81, '2020-03-09'],
  ['Bruno Salazar', 'Especialista en logística', 'Operaciones', 'Inactivo', 22, '2021-07-26'],
  ['Adriana Campos', 'Performance marketer', 'Marketing', 'Activo', 69, '2023-08-07'],
  ['Martín Escobar', 'Ingeniero de seguridad', 'Ingeniería', 'Activo', 55, '2024-03-11'],
  ['Gabriela Nieto', 'Coordinadora de formación', 'Personas', 'Activo', 100, '2022-01-17'],
]

export const COLABORADORES: Colaborador[] = FILAS.map(
  ([nombre, cargo, area, estado, progreso, ingreso], index) => ({
    id: String(index + 1),
    nombre,
    cargo,
    area,
    estado,
    progreso,
    ingreso,
  }),
)
