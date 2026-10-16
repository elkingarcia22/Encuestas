import { Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Text, cn } from '@ubits/flux-ui'
import { ColumnaIndicador, DetalleIndicador, FilaIndicadores } from '@/modules/design-system/graficos/fila-indicadores'
import { Hint } from '@/shared/components/Hint'
import { QueMide } from '../../components/que-mide'
import { Tendencia } from '../../components/graficos'
import type { Comparativo, Titular } from '../../modelo/comparativo/lectura'
import { FAVORABILITY_TARGET, formatPercent } from '../../modelo/favorabilityScale'
import { MarcaBase, decimalesDe, type Unidad } from './variacion'
import { Cambio } from '@/modules/admin/seleccion/propuestas/components/cifras'

// El resumen ejecutivo del comparativo, con las piezas del home de Encuestas:
// - arriba, la fila de indicadores (FilaIndicadores): la cifra de la base, su cambio frente a la medición anterior y el
//   gráfico de la esquina: la curva de todas las mediciones con su meta, igual en las tres lecturas (también en el eNPS);
// - debajo, en su marco, la evolución por medición: una fila por lectura y una columna por medición, cada una con su
//   diferencia frente a la base. Antes eran tres tarjetas con un gráfico por medición, y los medidores se encimaban.

const META_PARTICIPACION = 80
const META_ENPS = 20

type Metrica = {
  id: 'favorabilidad' | 'participacion' | 'nps'
  titulo: string
  ayuda: string
  unidad: Unidad
  meta: number
  valor: (titular: Titular) => number | null
  formato: (valor: number) => string
}

const conSigno = (valor: number) => `${valor > 0 ? '+' : ''}${Math.round(valor)}`

const METRICAS: readonly Metrica[] = [
  {
    id: 'favorabilidad',
    titulo: 'Favorabilidad',
    ayuda: 'El porcentaje de respuestas de acuerdo o totalmente de acuerdo en las preguntas de escala. La de la base es la misma de su pantalla de Resultados.',
    unidad: 'pp',
    meta: FAVORABILITY_TARGET,
    valor: (titular) => titular.favorabilidad,
    formato: formatPercent,
  },
  {
    id: 'participacion',
    titulo: 'Participación',
    ayuda: 'Cuántas de las personas invitadas completaron cada medición.',
    unidad: 'pp',
    meta: META_PARTICIPACION,
    valor: (titular) => titular.participacion,
    formato: formatPercent,
  },
  {
    id: 'nps',
    titulo: 'eNPS',
    ayuda: 'Promotores menos detractores, de −100 a +100. Desde +20 se considera favorable.',
    unidad: 'pts',
    meta: META_ENPS,
    valor: (titular) => titular.nps,
    formato: conSigno,
  },
]

function Indicador({ metrica, comparativo }: { metrica: Metrica; comparativo: Comparativo }) {
  const { columnas, olas, titulares } = comparativo
  const base = metrica.valor(titulares[olas[0].id])
  const previa = metrica.valor(titulares[olas[1].id])
  // La curva va de la más antigua a la base, de izquierda a derecha, como una línea de tiempo.
  const puntos = [...columnas]
    .reverse()
    .map((columna) => ({ id: columna.id, name: columna.shortLabel, value: metrica.valor(titulares[columna.id]) }))
    .filter((punto): punto is { id: string; name: string; value: number } => punto.value !== null)

  return (
    <ColumnaIndicador
      titulo={metrica.titulo}
      ayuda={<QueMide etiqueta={metrica.titulo.toLowerCase()} texto={metrica.ayuda} />}
      cifra={base === null ? '—' : metrica.formato(base)}
      variacion={base !== null && previa !== null ? <Cambio valor={base - previa} sufijo={` ${metrica.unidad}`} decimales={decimalesDe(metrica.unidad)} frente={olas[1].shortLabel} enCelda ayuda={`Frente a ${olas[1].shortLabel}`} /> : undefined}
      grafico={
        base === null ? undefined : (
          <div className="h-9 w-24 xl:w-28">
            <Tendencia etiqueta={metrica.titulo} puntos={puntos} meta={metrica.meta} color="var(--primary)" formato={metrica.formato} />
          </div>
        )
      }
      pie={
        <DetalleIndicador>
          Base {olas[0].shortLabel} · frente a {olas[1].shortLabel}
        </DetalleIndicador>
      }
    />
  )
}

// Un comparativo de eNPS no tiene favorabilidad: se leen participación y eNPS.
const metricasDe = (comparativo: Comparativo) => (comparativo.tipo === 'NPS' ? METRICAS.filter((metrica) => metrica.id !== 'favorabilidad') : METRICAS)

function Evolucion({ comparativo }: { comparativo: Comparativo }) {
  const { columnas, titulares } = comparativo
  const baseId = columnas.find((columna) => columna.isBase)?.id ?? columnas[0].id
  return (
    <Frame>
      <FrameHeader className="[--frame-panel-header-gap:--spacing(1)]">
        <FrameTitle>Evolución por medición</FrameTitle>
        <FrameDescription>Cada medición con su diferencia frente a la base.</FrameDescription>
      </FrameHeader>
      <FramePanel className="p-0!">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-36 ps-4">Lectura</TableHead>
              {columnas.map((columna) => (
                <TableHead key={columna.id}>
                  {/* El nombre completo de la medición en el globo del producto (Hint), no en el del navegador (decisión 16). */}
                  <Hint label={columna.label}>
                    <div className="flex items-center gap-1.5" tabIndex={0}>
                      {columna.shortLabel}
                      {columna.isBase ? <MarcaBase /> : null}
                    </div>
                  </Hint>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {metricasDe(comparativo).map((metrica) => {
              const base = metrica.valor(titulares[baseId])
              return (
                <TableRow key={metrica.id}>
                  <TableCell className="ps-4">
                    <Text as="span" size="sm" weight="medium">
                      {metrica.titulo}
                    </Text>
                  </TableCell>
                  {columnas.map((columna) => {
                    const valor = metrica.valor(titulares[columna.id])
                    return (
                      <TableCell key={columna.id}>
                        {valor === null ? (
                          <Text as="span" size="sm" variant="muted">
                            —
                          </Text>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Text as="span" size="sm" weight="semibold" className={cn('tabular-nums', columna.isBase && 'text-primary')}>
                              {metrica.formato(valor)}
                            </Text>
                            {!columna.isBase && base !== null ? <Cambio valor={valor - base} sufijo={` ${metrica.unidad}`} decimales={decimalesDe(metrica.unidad)} frente="la base" enCelda ayuda="Diferencia frente a la base" /> : null}
                          </div>
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </FramePanel>
    </Frame>
  )
}

export function ResumenComparativo({ comparativo }: { comparativo: Comparativo }) {
  return (
    <section aria-label="Resumen ejecutivo" className="flex flex-col gap-4">
      <FilaIndicadores etiqueta="Resumen ejecutivo" columnas={metricasDe(comparativo).length}>
        {metricasDe(comparativo).map((metrica) => (
          <Indicador key={metrica.id} metrica={metrica} comparativo={comparativo} />
        ))}
      </FilaIndicadores>
      <Evolucion comparativo={comparativo} />
    </section>
  )
}
