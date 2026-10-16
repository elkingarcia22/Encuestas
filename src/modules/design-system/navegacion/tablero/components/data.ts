// Ingresos de septiembre 2026 para el tablero de onboarding.

export type Stage = 'Por iniciar' | 'En curso' | 'Por cerrar' | 'Completado'

export const STAGES: Stage[] = ['Por iniciar', 'En curso', 'Por cerrar', 'Completado']

export type Hire = {
  id: number
  name: string
  role: string
  area: string
  day: number
  stage: Stage
  progress: number
  owner: string
  myTeam: boolean
  risk: boolean
}

export const HIRES: Hire[] = [
  { id: 1, name: 'Valentina Rojas', role: 'Analista de datos', area: 'Analítica', day: 1, stage: 'Por cerrar', progress: 88, owner: 'Laura Méndez', myTeam: true, risk: false },
  { id: 2, name: 'Julián Castro', role: 'Ejecutivo comercial', area: 'Ventas', day: 1, stage: 'En curso', progress: 54, owner: 'Andrés Pardo', myTeam: false, risk: true },
  { id: 3, name: 'Mateo Suárez', role: 'Analista de riesgo', area: 'Finanzas', day: 1, stage: 'Completado', progress: 100, owner: 'Andrés Pardo', myTeam: false, risk: false },
  { id: 4, name: 'Mariana López', role: 'Diseñadora de producto', area: 'Tecnología', day: 3, stage: 'En curso', progress: 61, owner: 'Laura Méndez', myTeam: true, risk: false },
  { id: 5, name: 'Isabela Cárdenas', role: 'Diseñadora UX', area: 'Tecnología', day: 3, stage: 'Completado', progress: 100, owner: 'Laura Méndez', myTeam: true, risk: false },
  { id: 6, name: 'Santiago Herrera', role: 'Coordinador de bodega', area: 'Operaciones', day: 7, stage: 'En curso', progress: 35, owner: 'Sara Gómez', myTeam: false, risk: true },
  { id: 7, name: 'Camila Torres', role: 'Analista contable', area: 'Finanzas', day: 8, stage: 'Por cerrar', progress: 92, owner: 'Andrés Pardo', myTeam: false, risk: false },
  { id: 8, name: 'Daniel Moreno', role: 'Desarrollador backend', area: 'Tecnología', day: 8, stage: 'En curso', progress: 47, owner: 'Laura Méndez', myTeam: true, risk: false },
  { id: 9, name: 'Laura Vargas', role: 'Ejecutiva comercial', area: 'Ventas', day: 14, stage: 'En curso', progress: 22, owner: 'Andrés Pardo', myTeam: false, risk: true },
  { id: 10, name: 'Andrés Gil', role: 'Técnico de mantenimiento', area: 'Operaciones', day: 15, stage: 'Por iniciar', progress: 0, owner: 'Sara Gómez', myTeam: false, risk: false },
  { id: 11, name: 'Paula Ramírez', role: 'Líder de nómina', area: 'Gestión humana', day: 15, stage: 'Por iniciar', progress: 0, owner: 'Sara Gómez', myTeam: true, risk: false },
  { id: 12, name: 'Felipe Duarte', role: 'Analista BI', area: 'Analítica', day: 21, stage: 'Por iniciar', progress: 0, owner: 'Laura Méndez', myTeam: true, risk: false },
  { id: 13, name: 'Natalia Pineda', role: 'Asesora de servicio', area: 'Ventas', day: 22, stage: 'Por iniciar', progress: 0, owner: 'Andrés Pardo', myTeam: false, risk: false },
  { id: 14, name: 'Sebastián Ortiz', role: 'Operario de producción', area: 'Operaciones', day: 28, stage: 'Por iniciar', progress: 0, owner: 'Sara Gómez', myTeam: false, risk: false },
]

export const AREAS = [...new Set(HIRES.map((hire) => hire.area))].sort()

export const TODAY = 14

export const initials = (name: string) =>
  name
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
