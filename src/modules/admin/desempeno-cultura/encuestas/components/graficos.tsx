import { ChartContainer, ChartTooltipContent, Text, type ChartConfig } from '@ubits/flux-ui'
import { Cell, Pie, PieChart, Tooltip } from 'recharts'
import { FilaTooltip, numero } from '@/modules/design-system/graficos/piezas'
import { NPS_SCORE_BANDS, npsBandForScore } from '../modelo/favorabilityScale'
import { COLOR_POR_TONO } from '../resultados/components/escala'

// Los gráficos de Encuestas. El anillo y la línea con meta son las piezas compartidas del design
// system (src/modules/design-system/graficos/piezas.tsx); aquí vive solo el medidor de eNPS,
// que conoce las bandas del puntaje. Mismo marco de la librería (ChartContainer y
// ChartTooltipContent) y misma manera de medirse: ver la nota en piezas.tsx.

export { AnilloAvance, Tendencia, type PuntoTendencia } from '@/modules/design-system/graficos/piezas'

// Las bandas del eNPS en el orden en que se leen de izquierda a derecha: promotores, neutros y
// detractores, con el tramo de la escala (de −100 a +100) que cubre cada una.
const BANDAS_ENPS = [...NPS_SCORE_BANDS]
  .sort((a, b) => b.min - a.min)
  .map((banda, indice, bandas) => {
    const desde = Math.max(-100, banda.min)
    const hasta = indice === 0 ? 100 : bandas[indice - 1].min
    return { clave: banda.id, etiqueta: banda.label, rango: banda.range, tramo: hasta - desde, color: COLOR_POR_TONO[banda.tone] }
  })

const CONFIG_ENPS = Object.fromEntries(BANDAS_ENPS.map((banda) => [banda.clave, { label: banda.etiqueta, color: banda.color }])) satisfies ChartConfig

export type RepartoEnps = Readonly<Record<'promotores' | 'neutros' | 'detractores', number>>

/**
 * Medidor semicircular de eNPS, como el bloque chart-12 de ReUI: las tres bandas como tramos
 * gruesos y la cifra en el centro. Con `reparto`, cada tramo mide cuántas personas cayeron en
 * esa banda (así se ve de dónde sale el puntaje); sin él, los tramos son la escala de −100 a
 * +100 y se enciende solo la banda en que cae el puntaje.
 */
export function MedidorEnps({ valor, reparto, ancho = 200, cifra = true }: { valor: number; reparto?: RepartoEnps; ancho?: number; cifra?: boolean }) {
  const banda = npsBandForScore(valor).id
  const total = reparto ? reparto.promotores + reparto.neutros + reparto.detractores : 0
  const datos = BANDAS_ENPS.map((tramo) => ({
    ...tramo,
    valor: reparto ? reparto[tramo.clave as keyof RepartoEnps] : tramo.tramo,
    porcentaje: reparto && total > 0 ? Math.round((reparto[tramo.clave as keyof RepartoEnps] / total) * 100) : null,
    apagado: !reparto && tramo.clave !== banda,
  }))
  const radio = ancho / 2 - 2
  const alto = Math.round(radio) + 6
  const centro = alto - 4

  return (
    <div className="relative shrink-0" style={{ width: ancho, height: alto }}>
      <ChartContainer config={CONFIG_ENPS} className="aspect-auto" style={{ width: ancho, height: alto }}>
        <PieChart width={ancho} height={alto} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <Tooltip
            cursor={false}
            allowEscapeViewBox={{ x: true, y: true }}
            reverseDirection={{ x: true, y: false }}
            content={
              <ChartTooltipContent
                hideLabel
                nameKey="clave"
                formatter={(_cifra, _nombre, item) => {
                  const tramo = item.payload as (typeof datos)[number]
                  return <FilaTooltip color={tramo.color} etiqueta={tramo.etiqueta} valor={tramo.porcentaje === null ? tramo.rango : `${numero(tramo.valor)} · ${tramo.porcentaje}%`} />
                }}
              />
            }
          />
          <Pie data={datos} dataKey="valor" nameKey="clave" cx="50%" cy={centro} startAngle={180} endAngle={0} innerRadius={Math.round(radio * 0.62)} outerRadius={radio} paddingAngle={3} cornerRadius={Math.max(3, Math.round(radio * 0.06))} stroke="none" isAnimationActive={false}>
            {datos.map((tramo) => (
              <Cell key={tramo.clave} fill={`var(--color-${tramo.clave})`} fillOpacity={tramo.apagado ? 0.25 : 1} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      {cifra ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center">
          <Text as="span" size="xs" variant="muted">
            eNPS
          </Text>
          <Text as="span" size="xl" weight="bold" className="tabular-nums">
            {`${valor > 0 ? '+' : ''}${Math.round(valor)}`}
          </Text>
        </div>
      ) : null}
    </div>
  )
}
