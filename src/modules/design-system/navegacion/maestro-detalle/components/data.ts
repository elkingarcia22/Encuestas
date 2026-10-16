export type RequestStatus = 'pendiente' | 'aprobada' | 'rechazada'

export type TimeOffRequest = {
  id: string
  name: string
  role: string
  area: string
  type: string
  dates: string
  days: number
  balance: number
  backup: string
  requested: string
  note?: string
  overlap?: string
  status: RequestStatus
}

export const STATUS_LABEL: Record<RequestStatus, string> = {
  pendiente: 'Pendiente',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
}

export const initials = (name: string) =>
  name
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')

export const REQUESTS: TimeOffRequest[] = [
  { id: 'r1', name: 'Carolina Ruiz', role: 'Analista de datos', area: 'Analítica', type: 'Vacaciones', dates: '22 sep – 3 oct', days: 10, balance: 14, backup: 'Andrés Pardo', requested: 'Hoy, 8:12', note: 'Viaje familiar a Cartagena. Dejo listo el tablero de ventas del tercer trimestre antes de salir.', overlap: 'Otras 2 personas de Analítica están fuera el 29 y 30 de septiembre.', status: 'pendiente' },
  { id: 'r2', name: 'Julián Torres', role: 'Ejecutivo comercial', area: 'Ventas', type: 'Día de la familia', dates: '25 sep', days: 1, balance: 1, backup: 'Mariana López', requested: 'Hoy, 7:50', status: 'pendiente' },
  { id: 'r3', name: 'Valentina Castro', role: 'Diseñadora de producto', area: 'Tecnología', type: 'Vacaciones', dates: '6 – 17 oct', days: 10, balance: 20, backup: 'Tomás Rincón', requested: 'Ayer, 5:31 p. m.', note: 'Aprovecho el cierre del sprint 18; el equipo ya conoce el plan.', status: 'pendiente' },
  { id: 'r4', name: 'Santiago Morales', role: 'Coordinador de bodega', area: 'Operaciones', type: 'Vacaciones', dates: '13 – 16 oct', days: 4, balance: 9, backup: 'Luis Herrera', requested: 'Ayer, 11:02 a. m.', overlap: 'Coincide con la semana de inventario trimestral.', status: 'pendiente' },
  { id: 'r5', name: 'Daniela Vargas', role: 'Líder de nómina', area: 'Gestión humana', type: 'Licencia no remunerada', dates: '2 – 6 nov', days: 5, balance: 0, backup: 'Paula Ramírez', requested: 'Hace 2 días', note: 'Trámite de visa en Bogotá; necesito estar disponible para las citas.', status: 'pendiente' },
  { id: 'r6', name: 'Felipe Rojas', role: 'Analista contable', area: 'Finanzas', type: 'Vacaciones', dates: '20 – 31 oct', days: 10, balance: 15, backup: 'Camila Suárez', requested: 'Hace 2 días', status: 'pendiente' },
  { id: 'r7', name: 'Laura Méndez', role: 'Gerente de selección', area: 'Gestión humana', type: 'Día de la familia', dates: '9 oct', days: 1, balance: 1, backup: 'Sara Gómez', requested: 'Hace 3 días', status: 'aprobada' },
  { id: 'r8', name: 'Andrés Pardo', role: 'Analista sénior', area: 'Analítica', type: 'Vacaciones', dates: '1 – 5 sep', days: 5, balance: 10, backup: 'Carolina Ruiz', requested: '20 ago', status: 'aprobada' },
  { id: 'r9', name: 'Camila Suárez', role: 'Ejecutiva de cuenta', area: 'Ventas', type: 'Vacaciones', dates: '15 – 26 sep', days: 10, balance: 5, backup: 'Julián Torres', requested: '18 ago', status: 'aprobada' },
  { id: 'r10', name: 'Mateo Jiménez', role: 'Técnico de mantenimiento', area: 'Operaciones', type: 'Vacaciones', dates: '28 sep – 2 oct', days: 5, balance: 3, backup: 'Santiago Morales', requested: '15 ago', note: 'Si no es posible, puedo moverlas a noviembre.', status: 'rechazada' },
  { id: 'r11', name: 'Isabella Gómez', role: 'Desarrolladora', area: 'Tecnología', type: 'Vacaciones', dates: '23 – 27 nov', days: 5, balance: 12, backup: 'Valentina Castro', requested: 'Hace 4 días', status: 'pendiente' },
  { id: 'r12', name: 'Tomás Rincón', role: 'Desarrollador', area: 'Tecnología', type: 'Día de cumpleaños', dates: '30 sep', days: 1, balance: 1, backup: 'Isabella Gómez', requested: '12 ago', status: 'aprobada' },
  { id: 'r13', name: 'Mariana López', role: 'Ejecutiva comercial', area: 'Ventas', type: 'Vacaciones', dates: '14 – 24 dic', days: 8, balance: 15, backup: 'Julián Torres', requested: 'Hace 5 días', note: 'Fin de año con la familia en Medellín.', status: 'pendiente' },
  { id: 'r14', name: 'Luis Herrera', role: 'Auxiliar de bodega', area: 'Operaciones', type: 'Vacaciones', dates: '21 dic – 8 ene', days: 12, balance: 18, backup: 'Santiago Morales', requested: 'Hace 6 días', overlap: 'Operaciones ya tiene 5 personas aprobadas en esas fechas.', status: 'pendiente' },
  { id: 'r15', name: 'Paula Ramírez', role: 'Analista de formación', area: 'Gestión humana', type: 'Vacaciones', dates: '3 – 7 nov', days: 5, balance: 11, backup: 'Daniela Vargas', requested: '10 ago', status: 'rechazada' },
]
