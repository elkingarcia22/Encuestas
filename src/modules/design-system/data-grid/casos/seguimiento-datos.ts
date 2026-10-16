import { generador, HOY, isoHaceDias } from '../../patrones/formato'
import { COLABORADORES } from '../data'

// Datos del caso Seguimiento (Herramientas › Tareas del administrador).
// Volumen de empresa mediana: unas 1.200 tareas y 160 planes en el último año, con más
// actividad reciente. Todo sale de un generador determinista: no cambia entre recargas.

export type EstadoTarea = 'Por hacer' | 'Activo' | 'Finalizada' | 'Vencida'
export type EstadoPlan = 'Por hacer' | 'Activo' | 'Finalizado' | 'Vencido'
export type Prioridad = 'Alta' | 'Media' | 'Baja'

export type Tarea = {
  id: string
  titulo: string
  plan: string
  responsable: string
  area: string
  prioridad: Prioridad
  estado: EstadoTarea
  vence: string
  creada: string
}

export type Plan = {
  id: string
  nombre: string
  responsable: string
  tareas: number
  avance: number
  estado: EstadoPlan
  inicio: string
  fin: string
  creada: string
}

// RN-05: periodos literales. El valor es cuántos días hacia atrás cubre.
export const PERIODOS: { valor: string; etiqueta: string; dias: number }[] = [
  { valor: '7', etiqueta: 'Últimos 7 días', dias: 7 },
  { valor: '15', etiqueta: 'Últimos 15 días', dias: 15 },
  { valor: '30', etiqueta: 'Últimos 30 días', dias: 30 },
  { valor: '90', etiqueta: 'Últimos 3 meses', dias: 90 },
  { valor: '180', etiqueta: 'Últimos 6 meses', dias: 180 },
  { valor: '365', etiqueta: 'Último año', dias: 365 },
]

const TAREAS_BASE = [
  'Completar el curso Seguridad de la información',
  'Firmar la política de datos personales',
  'Responder la encuesta de clima',
  'Hacer la autoevaluación 360°',
  'Subir el certificado de primeros auxilios',
  'Actualizar datos de contacto',
  'Agendar la reunión 1:1 con el líder',
  'Revisar el plan de onboarding',
  'Entregar evidencias del PDI',
  'Confirmar asistencia a Protocolos en sitio',
  'Terminar la ruta para nuevos líderes',
  'Validar objetivos del semestre',
  'Leer el reglamento interno',
  'Completar el diagnóstico de competencias',
]

const PLANES_BASE = [
  'Onboarding comercial Q3',
  'Cumplimiento normativo 2026',
  'Inducción cohorte agosto',
  'Cierre de ciclo de desempeño',
  'Plan de desarrollo de líderes',
  'Bienestar segundo semestre',
  'Apertura sucursal Omega',
  'Certificación en servicio al cliente',
]

const PRIORIDADES: Prioridad[] = ['Alta', 'Media', 'Media', 'Baja', 'Baja']

function sumarDias(iso: string, dias: number) {
  const fecha = new Date(`${iso}T00:00:00`)
  fecha.setDate(fecha.getDate() + dias)
  return fecha.toISOString().slice(0, 10)
}

const hoyIso = HOY.toISOString().slice(0, 10)

function crearTareas(total: number): Tarea[] {
  const azar = generador(20260911)
  return Array.from({ length: total }, (_, i) => {
    const persona = COLABORADORES[Math.floor(azar() * COLABORADORES.length)]
    // Elevar al cuadrado concentra las fechas cerca de hoy: hay más actividad reciente.
    const creada = isoHaceDias(Math.floor(azar() ** 2 * 365))
    const vence = sumarDias(creada, 3 + Math.floor(azar() * 28))
    const tirada = azar()
    const estado: EstadoTarea =
      tirada < 0.45 ? 'Finalizada' : vence < hoyIso ? 'Vencida' : tirada < 0.75 ? 'Activo' : 'Por hacer'
    return {
      id: `t-${i + 1}`,
      titulo: TAREAS_BASE[Math.floor(azar() * TAREAS_BASE.length)],
      plan: PLANES_BASE[Math.floor(azar() * PLANES_BASE.length)],
      responsable: persona.nombre,
      area: persona.area,
      prioridad: PRIORIDADES[Math.floor(azar() * PRIORIDADES.length)],
      estado,
      vence,
      creada,
    }
  })
}

function crearPlanes(total: number): Plan[] {
  const azar = generador(8092026)
  return Array.from({ length: total }, (_, i) => {
    const persona = COLABORADORES[Math.floor(azar() * COLABORADORES.length)]
    const creada = isoHaceDias(Math.floor(azar() ** 2 * 365))
    const fin = sumarDias(creada, 14 + Math.floor(azar() * 60))
    const avance = Math.round(azar() * 100)
    const estado: EstadoPlan =
      avance === 100 || (avance > 85 && azar() > 0.3)
        ? 'Finalizado'
        : fin < hoyIso
          ? 'Vencido'
          : avance > 0
            ? 'Activo'
            : 'Por hacer'
    const base = PLANES_BASE[i % PLANES_BASE.length]
    return {
      id: `p-${i + 1}`,
      nombre: i < PLANES_BASE.length ? base : `${base} · grupo ${Math.floor(i / PLANES_BASE.length) + 1}`,
      responsable: persona.nombre,
      tareas: 3 + Math.floor(azar() * 12),
      avance: estado === 'Finalizado' ? 100 : estado === 'Por hacer' ? 0 : avance,
      estado,
      inicio: creada,
      fin,
      creada,
    }
  })
}

export const TAREAS = crearTareas(1240)
export const PLANES = crearPlanes(164)
