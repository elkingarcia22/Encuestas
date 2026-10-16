import { dateValue } from '../../encuestas/modelo/surveyListDates'
import type { PuntoTendencia } from '@/modules/design-system/graficos/piezas'
import { tieneLectura, type Ciclo, type Lectura } from './ciclos'

// Las tres lecturas promedio del home, como el pulso de Encuestas: cada una es la media sobre los ciclos que ya tienen
// avance (en curso o finalizados) y se compara con la media de sus ciclos anteriores. Un borrador o un ciclo por iniciar
// no tiene nada que promediar, así que se deja fuera en vez de bajar la media a cero.

export interface MetricaPulso {
  valor: number | null
  anterior: number | null
  /** Sobre cuántos ciclos es la media. */
  ciclos: number
}

export interface PulsoObjetivos {
  avance: MetricaPulso
  cumplidos: MetricaPulso & { serie: readonly PuntoTendencia[] }
  reportando: MetricaPulso & { personas: number; reportan: number }
}

/** Cuántos ciclos alcanza la curva de objetivos cumplidos. */
const PROFUNDIDAD_SERIE = 10

const media = (valores: readonly number[]): number | null => (valores.length === 0 ? null : Math.round((valores.reduce((suma, valor) => suma + valor, 0) / valores.length) * 10) / 10)

function metrica(ciclos: readonly Ciclo[], campo: keyof Lectura): MetricaPulso {
  return {
    valor: media(ciclos.map((ciclo) => ciclo[campo])),
    anterior: media(ciclos.flatMap((ciclo) => (ciclo.anterior ? [ciclo.anterior[campo]] : []))),
    ciclos: ciclos.length,
  }
}

export function construirPulso(todos: readonly Ciclo[]): PulsoObjetivos {
  const ciclos = todos.filter(tieneLectura)
  const personas = ciclos.filter((ciclo) => ciclo.estado === 'En curso').reduce((suma, ciclo) => suma + ciclo.personas, 0)
  const reportan = ciclos.filter((ciclo) => ciclo.estado === 'En curso').reduce((suma, ciclo) => suma + Math.round((ciclo.personas * ciclo.reportando) / 100), 0)
  return {
    avance: metrica(ciclos, 'avance'),
    cumplidos: {
      ...metrica(ciclos, 'cumplidos'),
      // Del que cerró antes al más reciente, para que la curva se lea de izquierda a derecha como una línea de tiempo.
      serie: [...ciclos]
        .sort((a, b) => dateValue(a.cierre) - dateValue(b.cierre))
        .slice(-PROFUNDIDAD_SERIE)
        .map((ciclo) => ({ id: ciclo.id, name: ciclo.nombre, value: ciclo.cumplidos })),
    },
    reportando: { ...metrica(ciclos, 'reportando'), personas, reportan },
  }
}

/** «1 ciclo» / «13 ciclos». */
export const formatoCiclos = (cantidad: number) => `${cantidad.toLocaleString('es-CO')} ${cantidad === 1 ? 'ciclo' : 'ciclos'}`
