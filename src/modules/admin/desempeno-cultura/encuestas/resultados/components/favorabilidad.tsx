import { useMemo, useState } from 'react'
import { AnilloAvance } from '../../components/graficos'
import { FAVORABILITY_TARGET, formatPercent, formatScore, toneForFavorability } from '../../modelo/favorabilityScale'
import { heatmapBySegment, overallDistribution, type SegmentDefinition, type SurveyResults } from '../../modelo/surveyResults'
import { AvisoSinDemograficos } from './aviso-sin-demograficos'
import { CambioVista, type Vista } from './controles'
import { DetalleSecciones } from './detalle-secciones'
import { COLOR_POR_LECTURA, numero } from './escala'
import { useFiltrosResultados } from './filtros'
import { MapaCalor } from './mapa-calor'
import { TarjetaResumen } from './tarjeta-resumen'

// Favorabilidad: ¿qué tan bien salió, y dónde? Es el porcentaje de respuestas favorables en la
// escala de 1 a 5 (el 4 y el 5). Debajo, dos vistas con un mismo estado de filtros: «Secciones»
// y el mapa de calor. Tocar un anillo resalta ese grupo en «Secciones».

const LECTURA = { positive: 'Favorable', warning: 'Neutral', negative: 'Desfavorable' } as const

// Sin `segmento` la encuesta no recogió datos demográficos: se lee en total, sin «Área más desfavorable» ni mapa de calor.
type Props = { resultados: SurveyResults; segmento?: SegmentDefinition; onSegmento: (clave: string) => void }

export function Favorabilidad({ resultados, segmento, onSegmento }: Props) {
  const [vista, setVista] = useState<Vista>('secciones')
  // «Colaborador» no va aquí: una grilla con una persona por columna sería casi toda reservada.
  const segmentos = resultados.segments.filter((opcion) => !opcion.perPerson)
  const activo = segmentos.find((opcion) => opcion.key === segmento?.key) ?? segmentos[0] ?? segmento
  // El mapa de calor es por grupo: sin demográficos no tiene columnas, así que solo queda «Secciones».
  const sinDemograficos = segmentos.length === 0
  const estado = useFiltrosResultados(activo, segmentos, onSegmento)

  // Las tres áreas (o el primer demográfico por grupos) con el puntaje más bajo, sin las reservadas. Por área no hay
  // porcentaje de favorabilidad: se lee el puntaje de 1 a 5, el mismo del mapa de calor.
  const porArea = segmentos.find((opcion) => opcion.key === 'area') ?? segmentos[0]
  const desfavorables3 = useMemo(() => {
    if (!porArea) return []
    const mapa = heatmapBySegment(resultados, porArea)
    return mapa.columns
      .map((columna, indice) => ({ columna, puntaje: mapa.columnTotals[indice] }))
      .filter((fila): fila is { columna: (typeof mapa.columns)[number]; puntaje: number } => fila.puntaje !== null && fila.puntaje !== undefined)
      .sort((a, b) => a.puntaje - b.puntaje)
      .slice(0, 3)
  }, [resultados, porArea])

  const { distribution } = overallDistribution(resultados)
  const desfavorables = distribution[0] + distribution[1]
  const neutrales = distribution[2]
  const favorables = distribution[3] + distribution[4]
  const nsnr = resultados.rankedQuestions.reduce((suma, pregunta) => suma + pregunta.nsnr, 0)
  const total = favorables + neutrales + desfavorables + nsnr
  const porcentaje = (valor: number) => (total === 0 ? 0 : Math.round((valor / total) * 100))
  const tono = toneForFavorability(resultados.favorability)

  const anillo = (id: string, etiqueta: string, valor: number, color: string) => ({
    id,
    etiqueta,
    porcentaje: porcentaje(valor),
    color,
    cantidad: numero(valor),
    activo: estado.grupos.has(id),
    onAlternar: () => {
      estado.alternarGrupo(id)
      setVista('secciones')
    },
  })

  return (
    <div className="flex flex-col gap-6">
      <TarjetaResumen
        titulo="Favorabilidad general"
        ayuda="Es el porcentaje de respuestas favorables en la escala de 1 a 5, considerando favorables el 4 y el 5: respuestas favorables ÷ total de respuestas. Los NS/NR se cuentan aparte."
        cifra={formatPercent(resultados.favorability)}
        lectura={LECTURA[tono]}
        pie={`meta ${FAVORABILITY_TARGET} %`}
        tituloAnillos="Distribución de respuestas"
        totalAnillos={`${numero(total)} en total`}
        anillos={[
          anillo('favorable', 'Favorables', favorables, 'var(--success)'),
          anillo('neutral', 'Neutrales', neutrales, 'var(--warning)'),
          anillo('unfavorable', 'Desfavorables', desfavorables, 'var(--destructive)'),
          anillo('nsnr', 'NS/NR', nsnr, 'var(--muted-foreground)'),
        ]}
        tituloTop={sinDemograficos ? undefined : `${porArea ? porArea.label : 'Grupo'} más desfavorable`}
        top={desfavorables3.map(({ columna, puntaje }) => ({ id: columna.id, etiqueta: columna.label, valor: 5 - puntaje, texto: formatScore(puntaje) }))}
        // Como el detalle de «Estado de los invitados»: cada área con su puntaje, de la más baja a la más alta.
        pieTop={desfavorables3.length > 0 ? desfavorables3.map(({ columna, puntaje }) => `${columna.label} ${formatScore(puntaje)}`).join(' · ') : undefined}
        grafico={<AnilloAvance valor={resultados.favorability} color={COLOR_POR_LECTURA[tono]} etiqueta="Favorabilidad general" tamano={48} />}
      />

      {/* Las dos vistas se cambian con la pastilla, primer control de la cabecera de cada caja (Elkin, 9-oct, como el comparativo).
          Sin datos demográficos no hay mapa de calor (es por grupo): queda solo Secciones, con el aviso encima. */}
      {sinDemograficos ? <AvisoSinDemograficos /> : null}
      {vista === 'secciones' || !activo ? (
        <DetalleSecciones resultados={resultados} estado={estado} extra={sinDemograficos ? undefined : <CambioVista valor={vista} onCambio={setVista} />} />
      ) : (
        <MapaCalor resultados={resultados} segmentos={segmentos} segmento={activo} estado={estado} extra={<CambioVista valor={vista} onCambio={setVista} />} />
      )}
    </div>
  )
}
