export type Readiness = 'ahora' | '12' | '24'

type Candidate = { name: string; role: string; readiness: Readiness; fit: number; why: string }

export type Role = { title: string; holder: string; risk: 'Riesgo alto' | 'Riesgo medio'; candidates: Candidate[] }

export const ROLES: Role[] = [
  {
    title: 'Gerente comercial regional',
    holder: 'Titular: Jorge Salcedo · se retira en marzo de 2027',
    risk: 'Riesgo alto',
    candidates: [
      { name: 'Valentina Ríos', role: 'Jefa de ventas · Norte', readiness: 'ahora', fit: 86, why: '360 de 4,6 · lideró el crecimiento de Ventas Norte' },
      { name: 'Camilo Herrera', role: 'Key account manager', readiness: '12', fit: 71, why: 'Matriz de talento: alto potencial · PDI en liderazgo' },
      { name: 'Daniela Ortiz', role: 'Coordinadora comercial', readiness: '24', fit: 58, why: 'Buen desempeño; le falta experiencia con equipos grandes' },
    ],
  },
  {
    title: 'Jefe de canal mayorista',
    holder: 'Titular: Martha López · puesto crítico sin reemplazo',
    risk: 'Riesgo medio',
    candidates: [
      { name: 'Andrés Pardo', role: 'Ejecutivo comercial B2B', readiness: 'ahora', fit: 81, why: 'Maneja 40 % de las cuentas del canal' },
      { name: 'Luisa Cárdenas', role: 'Analista de canal', readiness: '12', fit: 67, why: '360 de 4,3 · terminó el programa de líderes' },
    ],
  },
]

export const SOURCES = [
  { title: 'Evaluaciones 360 · 2025', meta: '412 respuestas · actualizado el 8 de septiembre', used: 'Promedio por competencia de liderazgo y comentarios de pares.', access: true },
  { title: 'Matriz de talento · Q2 2026', meta: '186 personas del área comercial', used: 'Cuadrante de desempeño y potencial de cada candidato.', access: true },
  { title: 'Planes de desarrollo (PDI)', meta: '64 planes activos', used: 'Avance en objetivos de liderazgo y cursos terminados.', access: true },
  { title: 'Estructura organizacional', meta: 'Sincronizada con nómina hoy, 7:00', used: 'Cargos críticos, titulares y fechas de retiro.', access: true },
  { title: 'Evaluaciones 360 · 2024', meta: 'Sin permiso de lectura para el agente', used: 'No se usó. Pide acceso para comparar la evolución de cada candidato.', access: false },
]
