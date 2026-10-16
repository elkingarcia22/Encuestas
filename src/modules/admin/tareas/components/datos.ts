import { HOY, diasDesde, isoHaceDias } from '@/modules/design-system/patrones/formato'

// Datos de ejemplo de Herramientas › Tareas del administrador (empresa demo Meta Colombia).
// Fuente: HU «Seguimiento HR de tareas y planes» y «Detalle de tarea y subtarea».
// Solo entran tareas grupales o de seguimiento (RN-10); las fechas se cuentan desde HOY.

export type EstadoTarea = 'Por hacer' | 'Activo' | 'Finalizada' | 'Vencida'
export type EstadoPlan = 'Por hacer' | 'Activo' | 'Finalizado' | 'Vencido'
export type Prioridad = 'Alta' | 'Media' | 'Baja'
export type TipoTarea = 'Estándar' | 'Aprendizaje'

export type Subtarea = { id: string; titulo: string; hecha: boolean }

export type Evento = {
  id: string
  tipo: 'comentario' | 'cambio'
  autor: string
  texto: string
  cuando: string
}

export type Tarea = {
  id: string
  titulo: string
  descripcion: string
  plan: string
  asignado: string
  area: string
  prioridad: Prioridad
  estado: EstadoTarea
  tipo: TipoTarea
  contenido?: string
  finaliza: string
  creada: string
  subtareas: Subtarea[]
  historial: Evento[]
}

export type Plan = {
  id: string
  nombre: string
  descripcion: string
  responsable: string
  area: string
  estado: EstadoPlan
  inicio: string
  fin: string
  creada: string
}

export const ESTADOS_TAREA: EstadoTarea[] = ['Por hacer', 'Activo', 'Finalizada', 'Vencida']
export const ESTADOS_PLAN: EstadoPlan[] = ['Por hacer', 'Activo', 'Finalizado', 'Vencido']
export const PRIORIDADES: Prioridad[] = ['Alta', 'Media', 'Baja']

// Lo rojo va en destructive-outline: destructive-light no se lee en el tema claro.
type VarianteEstado = 'secondary' | 'info-light' | 'success-light' | 'destructive-outline'

export const BADGE_TAREA: Record<EstadoTarea, VarianteEstado> = {
  'Por hacer': 'secondary',
  Activo: 'info-light',
  Finalizada: 'success-light',
  Vencida: 'destructive-outline',
}

export const BADGE_PLAN: Record<EstadoPlan, VarianteEstado> = {
  'Por hacer': 'secondary',
  Activo: 'info-light',
  Finalizado: 'success-light',
  Vencido: 'destructive-outline',
}

export const BADGE_PRIORIDAD: Record<Prioridad, 'destructive-outline' | 'warning-light' | 'secondary'> = {
  Alta: 'destructive-outline',
  Media: 'warning-light',
  Baja: 'secondary',
}

// RN-05 y RN-06: periodos literales; por defecto «Últimos 7 días». Filtran por fecha de creación.
export const PERIODOS: { valor: string; etiqueta: string; dias: number }[] = [
  { valor: '7', etiqueta: 'Últimos 7 días', dias: 7 },
  { valor: '15', etiqueta: 'Últimos 15 días', dias: 15 },
  { valor: '30', etiqueta: 'Últimos 30 días', dias: 30 },
  { valor: '90', etiqueta: 'Últimos 3 meses', dias: 90 },
  { valor: '180', etiqueta: 'Últimos 6 meses', dias: 180 },
  { valor: '365', etiqueta: 'Último año', dias: 365 },
  { valor: 'personalizado', etiqueta: 'Personalizado', dias: 0 },
]

export const PERSONAS: { nombre: string; area: string }[] = [
  { nombre: 'Valentina Ríos', area: 'Talento Humano' },
  { nombre: 'Andrés Morales', area: 'Operaciones' },
  { nombre: 'Camila Herrera', area: 'Comercial' },
  { nombre: 'Julián Castaño', area: 'Tecnología' },
  { nombre: 'Daniela Pardo', area: 'Finanzas' },
  { nombre: 'Santiago Mejía', area: 'Servicio al cliente' },
  { nombre: 'Laura Quintero', area: 'Talento Humano' },
  { nombre: 'Mateo Salazar', area: 'Operaciones' },
  { nombre: 'Isabella Duarte', area: 'Mercadeo' },
  { nombre: 'Felipe Arango', area: 'Tecnología' },
]

const area = (nombre: string) => PERSONAS.find((p) => p.nombre === nombre)?.area ?? 'Talento Humano'

// Fechas relativas a HOY: negativos = hace N días, positivos = dentro de N días.
const dia = (desplazamiento: number) => isoHaceDias(-desplazamiento)
const hace = (dias: number, hora = '09:30') => `${isoHaceDias(dias)}T${hora}:00`

export const PLAN_ONBOARDING = 'Onboarding Comercial septiembre'
export const PLAN_CIERRE = 'Cierre de trimestre Q3'
export const PLAN_SST = 'Plan anual de seguridad y salud'
export const PLAN_LIDERES = 'Ruta de líderes 2026'
export const PLAN_CLIMA = 'Acciones de clima laboral'
export const PLAN_BIENESTAR = 'Semana de bienestar'
export const SIN_PLAN = 'Sin plan'

let secuencia = 0
const sub = (titulo: string, hecha = false): Subtarea => ({ id: `s${++secuencia}`, titulo, hecha })
const ev = (tipo: Evento['tipo'], autor: string, texto: string, cuando: string): Evento => ({
  id: `e${++secuencia}`,
  tipo,
  autor,
  texto,
  cuando,
})

function tarea(t: Omit<Tarea, 'area'>): Tarea {
  return { ...t, area: area(t.asignado) }
}

export const TAREAS_INICIALES: Tarea[] = [
  tarea({
    id: 't1',
    titulo: 'Preparar kit de bienvenida para nuevos asesores',
    descripcion:
      'Armar el kit físico y digital para los 8 asesores que ingresan el 21 de septiembre: carné, portátil, accesos y guía de la primera semana.',
    plan: PLAN_ONBOARDING,
    asignado: 'Valentina Ríos',
    prioridad: 'Alta',
    estado: 'Activo',
    tipo: 'Estándar',
    finaliza: dia(4),
    creada: isoHaceDias(2),
    subtareas: [
      sub('Pedir carnés a Seguridad', true),
      sub('Solicitar portátiles a Tecnología', true),
      sub('Crear accesos al CRM'),
      sub('Imprimir guía de la primera semana'),
    ],
    historial: [
      ev('cambio', 'Laura Quintero', 'creó la tarea y la asignó a Valentina Ríos', hace(2, '08:12')),
      ev('cambio', 'Valentina Ríos', 'cambió el estado de Por hacer a Activo', hace(2, '10:40')),
      ev('comentario', 'Laura Quintero', 'Los portátiles llegan el jueves; confirma con Julián que queden con la imagen de Comercial.', hace(1, '15:05')),
      ev('comentario', 'Valentina Ríos', 'Listo, ya hablé con él. Faltan los accesos al CRM.', hace(0, '09:02')),
    ],
  }),
  tarea({
    id: 't2',
    titulo: 'Completar curso «Técnicas de venta consultiva»',
    descripcion: 'Curso obligatorio para el equipo comercial antes de salir a campo. Dura 3 horas y tiene evaluación final.',
    plan: PLAN_ONBOARDING,
    asignado: 'Camila Herrera',
    prioridad: 'Media',
    estado: 'Activo',
    tipo: 'Aprendizaje',
    contenido: 'Técnicas de venta consultiva',
    finaliza: dia(9),
    creada: isoHaceDias(2),
    subtareas: [],
    historial: [
      ev('cambio', 'Laura Quintero', 'creó la tarea de aprendizaje con el curso «Técnicas de venta consultiva»', hace(2, '08:20')),
      ev('cambio', 'Camila Herrera', 'empezó el curso (35 % de avance)', hace(1, '11:48')),
    ],
  }),
  tarea({
    id: 't3',
    titulo: 'Consolidar reporte de ventas del trimestre',
    descripcion: 'Unir los reportes regionales en la plantilla de Gerencia y validar las cifras con Finanzas antes del comité.',
    plan: PLAN_CIERRE,
    asignado: 'Daniela Pardo',
    prioridad: 'Alta',
    estado: 'Vencida',
    tipo: 'Estándar',
    finaliza: dia(-2),
    creada: isoHaceDias(6),
    subtareas: [
      sub('Reporte región Andina', true),
      sub('Reporte región Caribe', true),
      sub('Reporte región Pacífico'),
      sub('Validación con Finanzas'),
      sub('Enviar a Gerencia'),
    ],
    historial: [
      ev('cambio', 'Andrés Morales', 'creó la tarea y la asignó a Daniela Pardo', hace(6, '07:55')),
      ev('comentario', 'Daniela Pardo', 'Me falta el reporte del Pacífico; Mateo lo envía mañana.', hace(3, '17:20')),
      ev('cambio', 'Sistema', 'cambió el estado a Vencida: pasó la fecha de finalización', hace(1, '00:00')),
    ],
  }),
  tarea({
    id: 't4',
    titulo: 'Actualizar matriz de riesgos de la planta',
    descripcion: 'Revisar los riesgos de la planta de Funza con el comité de SST e incluir los hallazgos de la última inspección.',
    plan: PLAN_SST,
    asignado: 'Mateo Salazar',
    prioridad: 'Media',
    estado: 'Por hacer',
    tipo: 'Estándar',
    finaliza: dia(12),
    creada: isoHaceDias(1),
    subtareas: [sub('Revisar hallazgos de la inspección'), sub('Reunión con el comité de SST'), sub('Publicar matriz actualizada')],
    historial: [ev('cambio', 'Laura Quintero', 'creó la tarea y la asignó a Mateo Salazar', hace(1, '14:10'))],
  }),
  tarea({
    id: 't5',
    titulo: 'Realizar curso de manejo defensivo',
    descripcion: 'Requisito para el personal que conduce vehículos de la compañía.',
    plan: PLAN_SST,
    asignado: 'Andrés Morales',
    prioridad: 'Baja',
    estado: 'Finalizada',
    tipo: 'Aprendizaje',
    contenido: 'Manejo defensivo y seguridad vial',
    finaliza: dia(3),
    creada: isoHaceDias(5),
    subtareas: [],
    historial: [
      ev('cambio', 'Laura Quintero', 'creó la tarea de aprendizaje con el curso «Manejo defensivo y seguridad vial»', hace(5, '09:00')),
      ev('cambio', 'Sistema', 'finalizó la tarea: Andrés Morales completó el curso', hace(1, '16:34')),
    ],
  }),
  tarea({
    id: 't6',
    titulo: 'Definir objetivos de desarrollo con el equipo',
    descripcion: 'Cada líder acuerda con su equipo dos objetivos de desarrollo para el segundo semestre y los registra en la plataforma.',
    plan: PLAN_LIDERES,
    asignado: 'Julián Castaño',
    prioridad: 'Alta',
    estado: 'Activo',
    tipo: 'Estándar',
    finaliza: dia(1),
    creada: isoHaceDias(4),
    subtareas: [sub('Agendar conversaciones 1 a 1', true), sub('Registrar objetivos', true), sub('Validar con Talento Humano')],
    historial: [
      ev('cambio', 'Valentina Ríos', 'creó la tarea y la asignó a Julián Castaño', hace(4, '10:00')),
      ev('cambio', 'Julián Castaño', 'cambió la prioridad de Media a Alta', hace(3, '09:15')),
      ev('comentario', 'Julián Castaño', 'Me faltan dos personas del equipo de datos, vuelven de vacaciones el lunes.', hace(0, '08:30')),
    ],
  }),
  tarea({
    id: 't7',
    titulo: 'Responder plan de acción de la encuesta de clima',
    descripcion: 'Proponer tres acciones concretas para los resultados más bajos de la encuesta de clima 2026 en Servicio al cliente.',
    plan: PLAN_CLIMA,
    asignado: 'Santiago Mejía',
    prioridad: 'Media',
    estado: 'Vencida',
    tipo: 'Estándar',
    finaliza: dia(-1),
    creada: isoHaceDias(3),
    subtareas: [sub('Revisar resultados por pregunta', true), sub('Taller con el equipo'), sub('Enviar propuesta')],
    historial: [
      ev('cambio', 'Valentina Ríos', 'creó la tarea y la asignó a Santiago Mejía', hace(3, '11:25')),
      ev('cambio', 'Sistema', 'cambió el estado a Vencida: pasó la fecha de finalización', hace(0, '00:00')),
    ],
  }),
  tarea({
    id: 't8',
    titulo: 'Firmar políticas de tratamiento de datos',
    descripcion: 'Leer y aceptar la política actualizada de tratamiento de datos personales.',
    plan: SIN_PLAN,
    asignado: 'Isabella Duarte',
    prioridad: 'Baja',
    estado: 'Finalizada',
    tipo: 'Estándar',
    finaliza: dia(2),
    creada: isoHaceDias(5),
    subtareas: [],
    historial: [
      ev('cambio', 'Laura Quintero', 'creó la tarea y la asignó a Isabella Duarte', hace(5, '08:00')),
      ev('cambio', 'Isabella Duarte', 'cambió el estado de Por hacer a Finalizada', hace(4, '13:12')),
    ],
  }),
  tarea({
    id: 't9',
    titulo: 'Cargar evidencias del simulacro de evacuación',
    descripcion: 'Subir fotos, lista de asistencia y tiempos del simulacro del 9 de septiembre.',
    plan: PLAN_SST,
    asignado: 'Felipe Arango',
    prioridad: 'Media',
    estado: 'Por hacer',
    tipo: 'Estándar',
    finaliza: dia(6),
    creada: isoHaceDias(2),
    subtareas: [sub('Lista de asistencia'), sub('Registro fotográfico')],
    historial: [ev('cambio', 'Mateo Salazar', 'creó la tarea y la asignó a Felipe Arango', hace(2, '16:45'))],
  }),
  tarea({
    id: 't10',
    titulo: 'Conciliar gastos de viaje de agosto',
    descripcion: 'Revisar los soportes de viáticos de agosto y reportar las diferencias a Contabilidad.',
    plan: PLAN_CIERRE,
    asignado: 'Daniela Pardo',
    prioridad: 'Media',
    estado: 'Activo',
    tipo: 'Estándar',
    finaliza: dia(5),
    creada: isoHaceDias(6),
    subtareas: [sub('Descargar reporte de tarjetas', true), sub('Cruzar con soportes'), sub('Reportar diferencias')],
    historial: [
      ev('cambio', 'Andrés Morales', 'creó la tarea y la asignó a Daniela Pardo', hace(6, '08:05')),
      ev('comentario', 'Andrés Morales', 'Prioriza los viajes a Medellín, ahí están las diferencias grandes.', hace(4, '12:00')),
    ],
  }),
  tarea({
    id: 't11',
    titulo: 'Completar curso «Liderazgo para nuevos jefes»',
    descripcion: 'Primer módulo de la Ruta de líderes. Incluye cuatro lecciones y una práctica.',
    plan: PLAN_LIDERES,
    asignado: 'Laura Quintero',
    prioridad: 'Media',
    estado: 'Por hacer',
    tipo: 'Aprendizaje',
    contenido: 'Liderazgo para nuevos jefes',
    finaliza: dia(14),
    creada: isoHaceDias(1),
    subtareas: [],
    historial: [ev('cambio', 'Valentina Ríos', 'creó la tarea de aprendizaje con el curso «Liderazgo para nuevos jefes»', hace(1, '09:40'))],
  }),
  tarea({
    id: 't12',
    titulo: 'Organizar pausas activas de la semana de bienestar',
    descripcion: 'Coordinar con la ARL las pausas activas de lunes a viernes para las tres sedes.',
    plan: PLAN_BIENESTAR,
    asignado: 'Laura Quintero',
    prioridad: 'Baja',
    estado: 'Activo',
    tipo: 'Estándar',
    finaliza: dia(8),
    creada: isoHaceDias(0),
    subtareas: [sub('Confirmar instructores con la ARL', true), sub('Reservar salas'), sub('Enviar invitación')],
    historial: [ev('cambio', 'Valentina Ríos', 'creó la tarea y la asignó a Laura Quintero', hace(0, '08:45'))],
  }),
  // Fuera de «Últimos 7 días»: aparecen al ampliar el periodo.
  tarea({
    id: 't13',
    titulo: 'Entregar dotación del segundo semestre',
    descripcion: 'Entregar la dotación a las personas de planta y registrar la firma de recibido.',
    plan: SIN_PLAN,
    asignado: 'Mateo Salazar',
    prioridad: 'Alta',
    estado: 'Vencida',
    tipo: 'Estándar',
    finaliza: dia(-6),
    creada: isoHaceDias(12),
    subtareas: [sub('Planta Funza', true), sub('Planta Cota')],
    historial: [
      ev('cambio', 'Andrés Morales', 'creó la tarea y la asignó a Mateo Salazar', hace(12, '07:30')),
      ev('cambio', 'Sistema', 'cambió el estado a Vencida: pasó la fecha de finalización', hace(5, '00:00')),
    ],
  }),
  tarea({
    id: 't14',
    titulo: 'Revisar descripciones de cargo de Tecnología',
    descripcion: 'Actualizar las descripciones de cargo con las nuevas responsabilidades del equipo de datos.',
    plan: SIN_PLAN,
    asignado: 'Julián Castaño',
    prioridad: 'Baja',
    estado: 'Finalizada',
    tipo: 'Estándar',
    finaliza: dia(-10),
    creada: isoHaceDias(25),
    subtareas: [sub('Analista de datos', true), sub('Ingeniero de datos', true)],
    historial: [
      ev('cambio', 'Valentina Ríos', 'creó la tarea y la asignó a Julián Castaño', hace(25, '10:00')),
      ev('cambio', 'Julián Castaño', 'cambió el estado de Activo a Finalizada', hace(11, '17:50')),
    ],
  }),
  tarea({
    id: 't15',
    titulo: 'Completar curso «Servicio con empatía»',
    descripcion: 'Curso para el equipo de Servicio al cliente.',
    plan: PLAN_CLIMA,
    asignado: 'Santiago Mejía',
    prioridad: 'Media',
    estado: 'Finalizada',
    tipo: 'Aprendizaje',
    contenido: 'Servicio con empatía',
    finaliza: dia(-20),
    creada: isoHaceDias(60),
    subtareas: [],
    historial: [
      ev('cambio', 'Valentina Ríos', 'creó la tarea de aprendizaje con el curso «Servicio con empatía»', hace(60, '09:00')),
      ev('cambio', 'Sistema', 'finalizó la tarea: Santiago Mejía completó el curso', hace(28, '15:10')),
    ],
  }),
]

export const PLANES_INICIALES: Plan[] = [
  {
    id: 'p1',
    nombre: PLAN_ONBOARDING,
    descripcion: 'Primeras dos semanas de los asesores que ingresan en septiembre.',
    responsable: 'Laura Quintero',
    area: 'Talento Humano',
    estado: 'Activo',
    inicio: dia(-2),
    fin: dia(12),
    creada: isoHaceDias(3),
  },
  {
    id: 'p2',
    nombre: PLAN_CIERRE,
    descripcion: 'Tareas de Finanzas y Operaciones para cerrar el tercer trimestre.',
    responsable: 'Andrés Morales',
    area: 'Operaciones',
    estado: 'Vencido',
    inicio: dia(-6),
    fin: dia(-1),
    creada: isoHaceDias(6),
  },
  {
    id: 'p3',
    nombre: PLAN_SST,
    descripcion: 'Actividades del Sistema de Gestión de Seguridad y Salud en el Trabajo.',
    responsable: 'Mateo Salazar',
    area: 'Operaciones',
    estado: 'Activo',
    inicio: dia(-5),
    fin: dia(30),
    creada: isoHaceDias(5),
  },
  {
    id: 'p4',
    nombre: PLAN_LIDERES,
    descripcion: 'Formación y acuerdos de desarrollo para quienes lideran equipos.',
    responsable: 'Valentina Ríos',
    area: 'Talento Humano',
    estado: 'Activo',
    inicio: dia(-4),
    fin: dia(45),
    creada: isoHaceDias(4),
  },
  {
    id: 'p5',
    nombre: PLAN_BIENESTAR,
    descripcion: 'Pausas activas, charlas y actividades de la semana de bienestar.',
    responsable: 'Laura Quintero',
    area: 'Talento Humano',
    estado: 'Por hacer',
    inicio: dia(7),
    fin: dia(11),
    creada: isoHaceDias(0),
  },
  {
    id: 'p6',
    nombre: PLAN_CLIMA,
    descripcion: 'Acciones derivadas de la encuesta de clima 2026.',
    responsable: 'Valentina Ríos',
    area: 'Talento Humano',
    estado: 'Activo',
    inicio: dia(-60),
    fin: dia(20),
    creada: isoHaceDias(60),
  },
  {
    id: 'p7',
    nombre: 'Inducción corporativa agosto',
    descripcion: 'Plan de inducción de las personas que ingresaron en agosto.',
    responsable: 'Laura Quintero',
    area: 'Talento Humano',
    estado: 'Finalizado',
    inicio: dia(-40),
    fin: dia(-15),
    creada: isoHaceDias(42),
  },
]

// ── Utilidades ──

export type Rango = { from: Date | undefined; to?: Date | undefined } | undefined

const aIso = (fecha: Date) => {
  const copia = new Date(fecha)
  copia.setMinutes(copia.getMinutes() - copia.getTimezoneOffset())
  return copia.toISOString().slice(0, 10)
}

// Periodo por fecha de creación (RN-06). Personalizado usa el rango elegido en el calendario.
export function dentroDelPeriodo(creada: string, periodo: string, rango: Rango) {
  if (periodo === 'personalizado') {
    if (!rango?.from) return true
    const desde = aIso(rango.from)
    const hasta = aIso(rango.to ?? rango.from)
    return creada >= desde && creada <= hasta
  }
  const dias = PERIODOS.find((p) => p.valor === periodo)?.dias ?? 7
  return creada >= isoHaceDias(dias)
}

export const aFechaIso = aIso

export function textoVencimiento(estado: string, finaliza: string) {
  if (estado === 'Finalizada') return 'Terminada'
  if (estado === 'Finalizado') return 'Terminado'
  const dias = -diasDesde(finaliza)
  if (dias < 0) return `Venció hace ${-dias} ${-dias === 1 ? 'día' : 'días'}`
  if (dias === 0) return 'Vence hoy'
  return `Faltan ${dias} ${dias === 1 ? 'día' : 'días'}`
}

export const esFutura = (iso: string) => diasDesde(iso) <= 0

export const HOY_ISO = aIso(HOY)
