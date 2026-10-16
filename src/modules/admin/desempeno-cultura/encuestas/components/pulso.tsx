import { useMemo, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDownRight01Icon, ArrowRight01Icon, ArrowUpRight01Icon } from '@hugeicons/core-free-icons'
import { Badge } from '@ubits/flux-ui'
import { ColumnaIndicador, DetalleIndicador, FilaIndicadores } from '@/modules/design-system/graficos/fila-indicadores'
import { deltaTone, formatDelta, formatPercent } from '../modelo/favorabilityScale'
import { OPEN_STATUS } from '../modelo/homeMetrics'
import { buildHomePulse, formatSurveyCount, type PulseMetric } from '../modelo/homePulse'
import { COVERAGE_DAYS, companyCoverage } from '../modelo/cobertura'
import { CLOSING_SOON_DAYS, PARTICIPATION_TARGET, closeBucketOf } from '../modelo/surveyListFilters'
import type { SurveyListItem } from '../modelo/types'
import { AnilloAvance, Tendencia } from './graficos'
import { DonaEstados } from './graficos-pulso'
import { QueMide } from './que-mide'

// Las tres lecturas del home: cuántas encuestas están en marcha, cómo va la participación frente a
// la medición anterior y qué parte de la empresa recibió al menos una encuesta en los últimos 90 días. Ni la
// favorabilidad ni el eNPS van aquí: no todas las empresas los miden (el eNPS solo existe si la encuesta
// trae la pregunta de recomendación), y un promedio sobre las que sí se leería como si fuera de todas.
// La participación la tienen todas. Sale del mismo cálculo que la pantalla de resultados, así el número
// de aquí y el que se ve al abrir una encuesta vienen de la misma fuente.
//
// La fila es la pieza compartida del design system (FilaIndicadores, bloque chart-2 de ReUI), con la
// estructura de las top métricas del Inicio operativo: la cifra con su insignia de cambio, el gráfico
// a la derecha y, debajo, el detalle. Cada gráfico cuenta lo mismo que la cifra: las encuestas se
// reparten por estado en una dona; la participación de cada encuesta lanzada va en una curva con la
// meta punteada, y la cobertura es un anillo de avance sobre toda la empresa. Nada de series inventadas.

// La diferencia contra la medición anterior. Lo que empeora va en destructive-outline:
// destructive-light no se lee en el tema claro.
export function Diferencia({ valor, texto }: { valor: number; texto: string }) {
  const tono = deltaTone(valor)
  const icono = tono === 'positive' ? ArrowUpRight01Icon : tono === 'negative' ? ArrowDownRight01Icon : ArrowRight01Icon
  const variante = tono === 'positive' ? 'success-light' : tono === 'negative' ? 'destructive-outline' : 'outline'
  return (
    <Badge variant={variante} size="sm">
      <HugeiconsIcon icon={icono} aria-hidden="true" />
      {texto}
    </Badge>
  )
}

function TarjetaPulso({
  etiqueta,
  ayuda,
  metrica,
  formato,
  formatoDiferencia,
  grafico,
}: {
  etiqueta: string
  ayuda: string
  metrica: PulseMetric
  formato: (valor: number) => string
  formatoDiferencia: (valor: number) => string
  grafico: ReactNode
}) {
  const valor = metrica.value
  const diferencia = valor !== null && metrica.previous !== null ? valor - metrica.previous : null
  const titulo = `${etiqueta} promedio`

  return (
    <ColumnaIndicador
      titulo={titulo}
      ayuda={<QueMide etiqueta={titulo} texto={ayuda} />}
      cifra={valor === null ? '—' : formato(valor)}
      variacion={diferencia !== null ? <Diferencia valor={diferencia} texto={formatoDiferencia(diferencia)} /> : undefined}
      grafico={valor !== null ? grafico : undefined}
      pie={<DetalleIndicador>{valor === null ? 'Sin encuestas lanzadas' : `${formatSurveyCount(metrica.count)} · vs medición anterior`}</DetalleIndicador>}
    />
  )
}

// Cobertura de la empresa: qué parte de los colaboradores recibió al menos una encuesta en los últimos 90 días. Mide
// alcance, no respuesta (eso lo dice Participación, al lado): a quién se ha escuchado y a quién no se le ha preguntado.
// La insignia compara con los 90 días anteriores, en puntos porcentuales.
function TarjetaCobertura({ encuestas }: { encuestas: readonly SurveyListItem[] }) {
  const cobertura = useMemo(() => companyCoverage(encuestas, new Date()), [encuestas])
  const diferencia = cobertura.previous !== null ? cobertura.value - cobertura.previous : null
  const titulo = 'Cobertura de la empresa'
  return (
    <ColumnaIndicador
      titulo={titulo}
      ayuda={
        <QueMide
          etiqueta={titulo}
          texto={`Qué parte de los colaboradores recibió al menos una encuesta en los últimos ${COVERAGE_DAYS} días. Quien estuvo en dos encuestas cuenta una vez. Mide a quién se ha escuchado, no quién respondió: eso es Participación. La insignia compara con los ${COVERAGE_DAYS} días anteriores.`}
        />
      }
      cifra={formatPercent(cobertura.value)}
      variacion={diferencia !== null ? <Diferencia valor={diferencia} texto={formatDelta(diferencia)} /> : undefined}
      grafico={<AnilloAvance valor={cobertura.value} color="var(--primary)" etiqueta={titulo} tamano={48} texto={`${cobertura.reached.toLocaleString('es-CO')} de ${cobertura.total.toLocaleString('es-CO')}`} />}
      pie={
        <DetalleIndicador>
          {cobertura.reached.toLocaleString('es-CO')} de {cobertura.total.toLocaleString('es-CO')} personas · últimos {COVERAGE_DAYS} días
        </DetalleIndicador>
      }
    />
  )
}

// Encuestas en marcha: cuántas están en curso y, en una dona, cómo se reparten entre las que ya corren y las que aún no
// empiezan. La dona sigue los estados de la lista y toma los colores de sus etiquetas (En progreso en azul, Por iniciar en
// ámbar); cuáles cierran pronto no es un estado, así que va solo en el detalle de abajo. Cuenta filas de la lista con los
// mismos criterios de sus filtros.
function TarjetaEnCurso({ encuestas }: { encuestas: readonly SurveyListItem[] }) {
  const { porIniciar, enCurso, cierranPronto } = useMemo(() => {
    const hoy = new Date()
    const corriendo = encuestas.filter((encuesta) => encuesta.status === OPEN_STATUS)
    return {
      porIniciar: encuestas.filter((encuesta) => encuesta.status === 'Por iniciar').length,
      enCurso: corriendo.length,
      cierranPronto: corriendo.filter((encuesta) => closeBucketOf(encuesta, hoy) === 'Cierra en 7 días o menos').length,
    }
  }, [encuestas])

  return (
    <ColumnaIndicador
      titulo="Encuestas en curso"
      ayuda={
        <QueMide
          etiqueta="Encuestas en curso"
          texto={`Encuestas abiertas hoy. La dona reparte las que están en progreso y las que están por iniciar, con los mismos colores del estado en la lista. Abajo se cuenta cuántas cierran en ${CLOSING_SOON_DAYS} días o menos.`}
        />
      }
      cifra={String(enCurso)}
      grafico={
        <DonaEstados
          tramos={[
            { clave: 'enCurso', etiqueta: 'En progreso', valor: enCurso, color: 'var(--info)' },
            { clave: 'porIniciar', etiqueta: 'Por iniciar', valor: porIniciar, color: 'var(--warning)' },
          ]}
        />
      }
      pie={
        <DetalleIndicador>
          {porIniciar} por iniciar · {cierranPronto} {cierranPronto === 1 ? 'cierra' : 'cierran'} en {CLOSING_SOON_DAYS} días o menos
        </DetalleIndicador>
      }
    />
  )
}

export function PulsoEncuestas({ encuestas }: { encuestas: readonly SurveyListItem[] }) {
  const pulso = useMemo(() => buildHomePulse(encuestas), [encuestas])

  return (
    <FilaIndicadores etiqueta="Pulso de encuestas">
      <TarjetaEnCurso encuestas={encuestas} />
      <TarjetaPulso
        etiqueta="Participación"
        ayuda={`Promedio de la tasa de respuesta de las encuestas lanzadas, en curso o finalizadas. La curva sigue la participación de cada una, de la que cerró antes a la más reciente, y la línea punteada es la meta del ${PARTICIPATION_TARGET}%. La insignia compara el promedio con la medición anterior.`}
        metrica={pulso.participation}
        formato={formatPercent}
        formatoDiferencia={formatDelta}
        grafico={
          <div className="h-9 w-24 xl:w-28">
            <Tendencia etiqueta="Participación" puntos={pulso.participation.series} meta={PARTICIPATION_TARGET} color="var(--primary)" formato={formatPercent} />
          </div>
        }
      />
      <TarjetaCobertura encuestas={encuestas} />
    </FilaIndicadores>
  )
}
