import { isoHaceDias } from '@/modules/design-system/patrones/formato'
import type { Plan, Tarea } from './datos'

// Un plan armado con IA desde otra pantalla (hoy, desde el panel de riesgos de Encuestas): el plan y las tareas con las
// que arranca. Llega a Tareas › Planes por el estado de la navegación, con el plan ya elegido, y ahí se ajusta como
// cualquier otro: responsable, fechas y tareas quedan por asignar.

export type PlanConIa = { plan: Plan; tareas: Tarea[] }

export type PedidoPlan = {
  /** Identifica el plan: el mismo pedido no crea dos. */
  id: string
  /** Sobre qué es: una pregunta, un área, una dimensión. */
  sujeto: string
  /** De dónde sale, para el historial: «NPS Clientes Premium Q3 2026». */
  origen: string
  area?: string
}

const SIN_ASIGNAR = 'Por asignar'
const corto = (texto: string, largo: number) => (texto.length > largo ? `${texto.slice(0, largo - 1).trimEnd()}…` : texto)
// Mismo formato de las fechas de la pantalla: días desde hoy.
const dia = (desplazamiento: number) => isoHaceDias(-desplazamiento)

export function planConIa({ id, sujeto, origen, area = 'Talento Humano' }: PedidoPlan): PlanConIa {
  const nombre = `Plan para «${corto(sujeto, 56)}»`
  const hoy = isoHaceDias(0)
  const tarea = (indice: number, titulo: string, descripcion: string, vence: number): Tarea => ({
    id: `${id}-t${indice}`,
    titulo,
    descripcion,
    plan: nombre,
    asignado: SIN_ASIGNAR,
    area,
    prioridad: indice === 1 ? 'Alta' : 'Media',
    estado: 'Por hacer',
    tipo: 'Estándar',
    finaliza: dia(vence),
    creada: hoy,
    subtareas: [],
    historial: [{ id: `${id}-t${indice}-e1`, tipo: 'cambio', autor: 'IA', texto: `creó la tarea a partir de «${origen}»`, cuando: `${hoy}T09:00:00` }],
  })
  return {
    plan: {
      id,
      nombre,
      descripcion: `Generado con IA a partir de «${origen}». Revisa las tareas y asigna responsables.`,
      responsable: SIN_ASIGNAR,
      area,
      estado: 'Por hacer',
      inicio: dia(0),
      fin: dia(30),
      creada: hoy,
    },
    tareas: [
      tarea(1, `Revisar los resultados de «${corto(sujeto, 48)}»`, 'Leer cómo se reparten las respuestas y por dónde se concentra el problema.', 5),
      tarea(2, 'Definir con los líderes qué cambia', 'Acordar acciones concretas, responsables y fechas con quienes lideran las áreas.', 12),
      tarea(3, 'Comunicar el plan y medir de nuevo', 'Contar al equipo qué se hará y revisar el avance en la próxima encuesta.', 30),
    ],
  }
}
