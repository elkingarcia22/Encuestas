import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@ubits/flux-ui'
import { Cell, Pie, PieChart, Tooltip } from 'recharts'
import { FilaTooltip, numero } from '@/modules/design-system/graficos/piezas'

// La dona de «Encuestas en curso» en el home de Encuestas: reparte las encuestas abiertas por estado. Mismo marco de la
// librería (ChartContainer y ChartTooltipContent) y misma manera de medirse que el medidor de eNPS: el gráfico recibe su
// ancho y alto en números (ver la nota en design-system/graficos/piezas.tsx).

export type Tramo = { clave: string; etiqueta: string; valor: number; color: string }

const configDe = (tramos: readonly Tramo[]) => Object.fromEntries(tramos.map((tramo) => [tramo.clave, { label: tramo.etiqueta, color: tramo.color }])) satisfies ChartConfig

/** Dona con un tramo por estado. Sin leyenda: el detalle de abajo ya dice las cifras y el tooltip nombra cada tramo. */
export function DonaEstados({ tramos, tamano = 48 }: { tramos: readonly Tramo[]; tamano?: number }) {
  const datos = tramos.filter((tramo) => tramo.valor > 0)
  return (
    <ChartContainer config={configDe(tramos)} className="aspect-auto shrink-0" style={{ width: tamano, height: tamano }}>
      <PieChart width={tamano} height={tamano} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <Tooltip
          cursor={false}
          allowEscapeViewBox={{ x: true, y: true }}
          content={
            <ChartTooltipContent
              hideLabel
              nameKey="clave"
              formatter={(_cifra, _nombre, item) => {
                const tramo = item.payload as Tramo
                return <FilaTooltip color={tramo.color} etiqueta={tramo.etiqueta} valor={`${numero(tramo.valor)} ${tramo.valor === 1 ? 'encuesta' : 'encuestas'}`} />
              }}
            />
          }
        />
        <Pie data={datos} dataKey="valor" nameKey="clave" innerRadius={Math.round(tamano * 0.3)} outerRadius={tamano / 2 - 2} paddingAngle={datos.length > 1 ? 4 : 0} cornerRadius={3} stroke="none" isAnimationActive={false}>
          {datos.map((tramo) => (
            <Cell key={tramo.clave} fill={tramo.color} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}
