import { useMemo, type ReactNode } from 'react'
import { ColumnaIndicador, DetalleIndicador, FilaIndicadores } from '@/modules/design-system/graficos/fila-indicadores'
import { AnilloAvance, Tendencia } from '@/modules/design-system/graficos/piezas'
import { formatDelta } from '../../encuestas/modelo/favorabilityScale'
import { Diferencia } from '../../encuestas/components/pulso'
import { QueMide } from '../../encuestas/components/que-mide'
import { formatoAvance, type Ciclo } from '../modelo/ciclos'
import { META_REPORTE } from '../modelo/alertas'
import { construirPulso, formatoCiclos, type MetricaPulso } from '../modelo/pulso'

// Las tres lecturas del home de Objetivos, en la misma fila de indicadores que el pulso de Encuestas (FilaIndicadores,
// bloque chart-2 de ReUI): la cifra con su insignia de cambio contra los ciclos anteriores, el gráfico a la derecha y el
// detalle debajo. Cada gráfico cuenta lo mismo que la cifra: el avance es un anillo, los objetivos cumplidos van en una
// curva por ciclo con la meta punteada y las personas reportando, en un anillo sobre quienes están en ciclos en curso.

/** La parte de objetivos cumplidos que la empresa espera por ciclo: la línea punteada de la curva. */
const META_CUMPLIDOS = 50

function Lectura({ titulo, ayuda, metrica, grafico, pie }: { titulo: string; ayuda: string; metrica: MetricaPulso; grafico: ReactNode; pie?: string }) {
  const { valor, anterior } = metrica
  const diferencia = valor !== null && anterior !== null ? valor - anterior : null
  return (
    <ColumnaIndicador
      titulo={titulo}
      ayuda={<QueMide etiqueta={titulo} texto={ayuda} />}
      cifra={valor === null ? '—' : formatoAvance(valor)}
      variacion={diferencia !== null ? <Diferencia valor={diferencia} texto={formatDelta(diferencia)} /> : undefined}
      grafico={valor !== null ? grafico : undefined}
      pie={<DetalleIndicador>{valor === null ? 'Sin ciclos en marcha' : (pie ?? `${formatoCiclos(metrica.ciclos)} · vs ciclos anteriores`)}</DetalleIndicador>}
    />
  )
}

export function PulsoObjetivos({ ciclos }: { ciclos: readonly Ciclo[] }) {
  const pulso = useMemo(() => construirPulso(ciclos), [ciclos])

  return (
    <FilaIndicadores etiqueta="Pulso de objetivos">
      <Lectura
        titulo="Avance promedio"
        ayuda="Promedio del avance de los objetivos de cada ciclo en curso o finalizado. Un ciclo que supera su meta cuenta por encima del 100%. La insignia compara con el promedio de sus ciclos anteriores."
        metrica={pulso.avance}
        grafico={<AnilloAvance valor={pulso.avance.valor ?? 0} color="var(--primary)" etiqueta="Avance promedio" tamano={48} />}
      />
      <Lectura
        titulo="Objetivos cumplidos promedio"
        ayuda={`Qué parte de los objetivos de cada ciclo ya llegó a su meta, en promedio. La curva sigue cada ciclo, del que cerró antes al más reciente, y la línea punteada es la meta del ${META_CUMPLIDOS}%.`}
        metrica={pulso.cumplidos}
        grafico={
          <div className="h-9 w-24 xl:w-28">
            <Tendencia etiqueta="Objetivos cumplidos" puntos={pulso.cumplidos.serie} meta={META_CUMPLIDOS} color="var(--primary)" formato={formatoAvance} />
          </div>
        }
      />
      <Lectura
        titulo="Personas reportando promedio"
        ayuda={`Qué parte de las personas de cada ciclo reportó avance en el último corte, en promedio. El anillo cuenta a las personas de los ciclos en curso. Por debajo del ${META_REPORTE}%, el ciclo aparece en «Para atender».`}
        metrica={pulso.reportando}
        grafico={
          <AnilloAvance
            valor={pulso.reportando.personas ? (pulso.reportando.reportan / pulso.reportando.personas) * 100 : 0}
            color="var(--success)"
            etiqueta="Personas reportando"
            tamano={48}
            texto={`${pulso.reportando.reportan.toLocaleString('es-CO')} de ${pulso.reportando.personas.toLocaleString('es-CO')}`}
          />
        }
      />
    </FilaIndicadores>
  )
}
