import { startOfToday } from '../../../encuestas/modelo/surveyListDates'
import type { Etapa, Medida, PersonaSeguida, Riesgo } from './seguimiento'

// Lo que la pestaña Colaboradores y la ficha de cada persona necesitan leer de una persona del ciclo (portado del
// prototipo «configuración objetivos», 9-oct): los tonos de su estado y su riesgo, su última actualización, los tramos
// por los que se filtra la tabla y el orden por columna.

type Tono = 'success-light' | 'warning-light' | 'destructive-light' | 'info-light' | 'outline'


export const RIESGOS: readonly { id: Riesgo; etiqueta: string; tono: Tono }[] = [
  { id: 'alto', etiqueta: 'Alto', tono: 'destructive-light' },
  { id: 'medio', etiqueta: 'Medio', tono: 'warning-light' },
  { id: 'bajo', etiqueta: 'Bajo', tono: 'info-light' },
  { id: 'sin', etiqueta: 'Sin riesgo', tono: 'success-light' },
]
export const riesgoDePersona = (riesgo: Riesgo) => RIESGOS.find((opcion) => opcion.id === riesgo) ?? RIESGOS[3]

export const ETAPAS: Record<Etapa, { etiqueta: string; tono: Tono }> = {
  aprobado: { etiqueta: 'Aprobado', tono: 'success-light' },
  'por-aprobar': { etiqueta: 'Por aprobar', tono: 'warning-light' },
  'por-ajustar': { etiqueta: 'Devuelto', tono: 'destructive-light' },
}

export const MEDIDAS: Record<Medida, string> = { porcentaje: 'Porcentaje', numero: 'Número', dinero: 'Dinero', hito: 'Hito (sí o no)' }

/** La fecha del último avance reportado en cualquiera de sus objetivos, o null si nunca reportó. */
export function ultimaDe(persona: PersonaSeguida): Date | null {
  const fechas = persona.objetivos.map((objetivo) => objetivo.ultimaActualizacion).filter((fecha): fecha is Date => fecha !== null)
  return fechas.length ? new Date(Math.max(...fechas.map((fecha) => fecha.getTime()))) : null
}

/** «Hoy», «Ayer», «Hace 5 días»: cuánto hace del último reporte, como en el prototipo. */
export function haceCuanto(fecha: Date | null, hoy: Date = startOfToday()): string {
  if (!fecha) return 'Sin reportes'
  const dias = Math.max(0, Math.round((hoy.getTime() - fecha.getTime()) / 86_400_000))
  if (dias === 0) return 'Hoy'
  if (dias === 1) return 'Ayer'
  if (dias < 30) return `Hace ${dias} días`
  const meses = Math.round(dias / 30)
  return meses === 1 ? 'Hace 1 mes' : `Hace ${meses} meses`
}

/** Los tramos de la columna «Última actualización», para filtrarla. */
export const TRAMOS_ACTUALIZACION = ['Esta semana', 'Hace 1 a 2 semanas', 'Hace más de 2 semanas', 'Sin reportes'] as const
export function tramoActualizacion(fecha: Date | null, hoy: Date = startOfToday()): (typeof TRAMOS_ACTUALIZACION)[number] {
  if (!fecha) return 'Sin reportes'
  const dias = (hoy.getTime() - fecha.getTime()) / 86_400_000
  return dias < 7 ? 'Esta semana' : dias <= 14 ? 'Hace 1 a 2 semanas' : 'Hace más de 2 semanas'
}

/** Lo que se ordena en cada columna: la fila de la tabla ya con sus datos a la vista. */
export interface FilaPersona {
  id: string
  persona: PersonaSeguida
  nombre: string
  objetivos: number
  avance: number
  estado: string
  lider: string
  riesgo: number
  actualizacion: number
}

const PESO_RIESGO: Record<Riesgo, number> = { alto: 3, medio: 2, bajo: 1, sin: 0 }

export function filaDe(persona: PersonaSeguida): FilaPersona {
  const ultima = ultimaDe(persona)
  return {
    id: persona.id,
    persona,
    nombre: persona.colaborador.name,
    objetivos: persona.objetivos.length,
    avance: persona.avance ?? -1,
    estado: persona.nivel.etiqueta,
    lider: persona.colaborador.leader ?? 'Sin líder',
    riesgo: PESO_RIESGO[persona.riesgo],
    actualizacion: ultima?.getTime() ?? 0,
  }
}

export function ordenar(filas: readonly FilaPersona[], orden: string | undefined): FilaPersona[] {
  if (!orden) return [...filas]
  const desc = orden.startsWith('-')
  const campo = (desc ? orden.slice(1) : orden) as keyof Omit<FilaPersona, 'persona'>
  return [...filas].sort((a, b) => {
    const va = a[campo]
    const vb = b[campo]
    const r = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'es')
    return desc ? -r : r
  })
}
