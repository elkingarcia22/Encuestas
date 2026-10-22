import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { ChartContainer, ChartTooltipContent, Text, type ChartConfig } from '@ubits/flux-ui'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, PolarAngleAxis, RadialBar, RadialBarChart, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts'

// Las piezas de gráfico del playground, armadas con el marco de gráficos de la librería
// (ChartContainer y ChartTooltipContent, los mismos de los bloques «chart» de ReUI) sobre
// recharts 3. Cada lectura lleva el gráfico que pide su escala: una parte de un todo es un
// anillo radial (chart-8) o una dona con sus tramos (chart-13); una comparación entre elementos
// son barras (chart-29); una lectura que se mira moverse entre mediciones es una línea con su
// meta y tooltip (chart-2, chart-4). Los colores entran por el
// `config` del marco, como variables `--color-*`, y salen siempre de los tokens del tema.
//
// La librería trae su propia copia de recharts dentro de `dist`, y su ResponsiveContainer pasa
// la medida por un contexto que la copia del proyecto no ve. Por eso cada gráfico recibe su
// ancho y alto en números (los fijos, directo; los que llenan, midiendo el marco) y el
// `Tooltip` va importado de "recharts", la misma copia del gráfico; solo el contenido del
// tooltip es de la librería. Está documentado en Design system › Marco › Ajustes propios.
//
// Los gráficos de tamaño fijo (anillo, dona, medidor) abren el tooltip hacia la izquierda: casi siempre
// van en el borde derecho de su fila y hacia la derecha se cortarían con el marco.

const ID_SEGURO = /[^a-zA-Z0-9_-]/g

export const numero = (valor: number) => Math.round(valor).toLocaleString('es-CO')

/** El tamaño real del marco del gráfico, para pasárselo al gráfico en números. */
export function useTamano() {
  const ref = useRef<HTMLDivElement>(null)
  const [tamano, setTamano] = useState({ ancho: 0, alto: 0 })
  useEffect(() => {
    const nodo = ref.current
    if (!nodo) return
    const medir = () => {
      const caja = nodo.getBoundingClientRect()
      setTamano((previo) => (previo.ancho === Math.round(caja.width) && previo.alto === Math.round(caja.height) ? previo : { ancho: Math.round(caja.width), alto: Math.round(caja.height) }))
    }
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(nodo)
    return () => observador.disconnect()
  }, [])
  return { ref, ...tamano }
}

/** Una fila del tooltip como la dibujan los ejemplos de la librería: muestra, nombre y cifra. */
export function FilaTooltip({ color, etiqueta, valor }: { color: string; etiqueta: ReactNode; valor: ReactNode }) {
  return (
    <div className="flex w-full items-center justify-between gap-3">
      <div className="flex items-center gap-1.5">
        <div className="size-2.5 shrink-0 rounded-xs" style={{ background: color }} aria-hidden="true" />
        <Text as="span" size="xs" variant="muted" className="whitespace-nowrap">
          {etiqueta}
        </Text>
      </div>
      <Text as="span" size="xs" weight="semibold" className="whitespace-nowrap tabular-nums">
        {valor}
      </Text>
    </div>
  )
}

export type PuntoTendencia = { id: string; name: string; value: number }

/**
 * Línea de las últimas mediciones, con la meta como guía punteada y el nombre de cada medición
 * al pasar el cursor. Llena el alto y el ancho que le dé quien la usa. `conEje` pinta la
 * cuadrícula y las etiquetas de abajo para el tamaño grande.
 */
export function Tendencia({
  puntos,
  meta,
  color,
  formato,
  etiqueta,
  conEje = false,
}: {
  puntos: readonly PuntoTendencia[]
  meta: number
  color: string
  formato: (valor: number) => string
  /** Cómo se llama la lectura en el tooltip: «Favorabilidad», «Participación»… */
  etiqueta: string
  conEje?: boolean
}) {
  const relleno = `tendencia-${useId().replace(ID_SEGURO, '')}`
  const { ref, ancho, alto } = useTamano()
  const config = { valor: { label: etiqueta, color } } satisfies ChartConfig
  const datos = puntos.map((punto) => ({ nombre: punto.name, valor: punto.value }))
  const valores = datos.map((dato) => dato.valor)
  const minimo = Math.min(meta, ...valores) - 5
  const maximo = Math.max(meta, ...valores) + 5

  return (
    <ChartContainer ref={ref} config={config} className="aspect-auto h-full w-full">
      <AreaChart width={ancho} height={alto} data={datos} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
        <defs>
          <linearGradient id={relleno} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-valor)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--color-valor)" stopOpacity={0} />
          </linearGradient>
        </defs>
        {conEje ? <CartesianGrid vertical={false} strokeDasharray="3 3" /> : null}
        {conEje ? <XAxis dataKey="nombre" tickLine={false} axisLine={false} tickMargin={8} /> : null}
        <YAxis hide domain={[minimo, maximo]} />
        <Tooltip
          allowEscapeViewBox={{ x: true, y: true }}
          content={
            <ChartTooltipContent
              indicator="dot"
              labelFormatter={(_etiqueta, carga) => (carga?.[0]?.payload as { nombre?: string } | undefined)?.nombre}
              formatter={(valor) => <FilaTooltip color="var(--color-valor)" etiqueta={etiqueta} valor={formato(Number(valor))} />}
            />
          }
        />
        <ReferenceLine y={meta} stroke="var(--muted-foreground)" strokeDasharray="4 4" strokeOpacity={0.6} />
        <Area dataKey="valor" type="monotone" stroke="var(--color-valor)" strokeWidth={2} fill={`url(#${relleno})`} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--background)' }} isAnimationActive={false} />
      </AreaChart>
    </ChartContainer>
  )
}

/**
 * Anillo radial de avance: la parte cumplida en el color de su lectura y el resto en la pista
 * gris. `texto` es lo que dice el tooltip; sin él, el porcentaje. `centro` va escrito en el medio
 * (la cifra grande de Créditos, 13 oct) y `grosor` engruesa el trazo en los anillos grandes.
 */
export function AnilloAvance({
  valor,
  color,
  etiqueta,
  tamano = 64,
  texto,
  globo = true,
  centro,
  grosor = 7,
}: {
  valor: number
  color: string
  etiqueta: string
  tamano?: number
  texto?: string
  /**
   * Si el globo aporta algo. En Encuestas y en Vacantes sí: enseña los números crudos detrás del porcentaje
   * («1.231 de 1.847», «12 de 30 días»). Donde la cifra ya está escrita al lado, repetirla sobra y se apaga.
   */
  globo?: boolean
  centro?: ReactNode
  grosor?: number
}) {
  const config = { valor: { label: etiqueta, color } } satisfies ChartConfig
  const radio = tamano / 2
  const anillo = (
    <ChartContainer config={config} className="aspect-square shrink-0" style={{ width: tamano, height: tamano }}>
      <RadialBarChart width={tamano} height={tamano} data={[{ valor: Math.max(0, Math.min(100, valor)) }]} startAngle={90} endAngle={-270} innerRadius={radio - grosor - 2} outerRadius={radio - 2} barSize={grosor}>
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
        {globo ? (
          <Tooltip
            cursor={false}
            allowEscapeViewBox={{ x: true, y: true }}
            reverseDirection={{ x: true, y: false }}
            content={<ChartTooltipContent hideLabel formatter={(cifra) => <FilaTooltip color="var(--color-valor)" etiqueta={etiqueta} valor={texto ?? `${Math.round(Number(cifra))}%`} />} />}
          />
        ) : null}
        <RadialBar dataKey="valor" fill="var(--color-valor)" background={{ fill: 'var(--muted)' }} cornerRadius={Math.max(4, grosor / 2)} isAnimationActive={false} />
      </RadialBarChart>
    </ChartContainer>
  )
  if (!centro) return anillo
  return (
    <span className="relative grid shrink-0 place-items-center" style={{ width: tamano, height: tamano }}>
      {anillo}
      <span className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">{centro}</span>
    </span>
  )
}

export type SegmentoReparto = {
  id: string
  etiqueta: string
  valor: number
  color: string
  /** Lo que dice el tooltip en vez de la cifra, p. ej. la cantidad cuando el tramo se mide en %. */
  texto?: string
}

/**
 * Dona pequeña con los tramos de un total, como el bloque chart-13 de ReUI sin su leyenda: cómo
 * se reparte algo que se cuenta (las vacantes por estado). Al pasar el cursor por un tramo dice
 * su nombre, su cantidad y su parte del total.
 */
export function DonaReparto({ segmentos, etiqueta, tamano = 44, formato = numero }: { segmentos: readonly SegmentoReparto[]; etiqueta: string; tamano?: number; formato?: (valor: number) => string }) {
  const conValor = segmentos.filter((segmento) => segmento.valor > 0)
  const config = Object.fromEntries(conValor.map((segmento) => [segmento.id, { label: segmento.etiqueta, color: segmento.color }])) satisfies ChartConfig
  const total = conValor.reduce((suma, segmento) => suma + segmento.valor, 0)
  const radio = tamano / 2

  return (
    <ChartContainer config={config} className="aspect-square shrink-0" style={{ width: tamano, height: tamano }} aria-label={etiqueta}>
      <PieChart width={tamano} height={tamano} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <Tooltip
          cursor={false}
          allowEscapeViewBox={{ x: true, y: true }}
          reverseDirection={{ x: true, y: false }}
          content={
            <ChartTooltipContent
              hideLabel
              nameKey="id"
              formatter={(valor, _nombre, item) => {
                const segmento = item.payload as SegmentoReparto
                const parte = total > 0 ? Math.round((Number(valor) / total) * 100) : 0
                return <FilaTooltip color={segmento.color} etiqueta={segmento.etiqueta} valor={`${segmento.texto ?? formato(Number(valor))} · ${parte}%`} />
              }}
            />
          }
        />
        {/* Sin foco propio: recharts 3 hace enfocable la dona (`rootTabIndex` 0) y aquí la lee la etiqueta del contenedor.
            Dentro de un bloque decorativo (`aria-hidden`), un foco escondido es un fallo AA (30 sep). */}
        <Pie data={conValor} dataKey="valor" nameKey="id" innerRadius={radio - 9} outerRadius={radio - 2} paddingAngle={conValor.length > 1 ? 4 : 0} cornerRadius={3} startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false} rootTabIndex={-1}>
          {conValor.map((segmento) => (
            <Cell key={segmento.id} fill={`var(--color-${segmento.id})`} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}

export type Barra = { id: string; nombre: string; valor: number }

/**
 * Barras verticales pequeñas, sin ejes, como el bloque chart-29 de ReUI en tamaño de indicador:
 * compara cuánto tiene cada elemento (los candidatos nuevos de cada vacante), de mayor a menor.
 * Llena el alto y el ancho que le den; al pasar el cursor dice el nombre y la cifra.
 */
export function BarrasMini({ barras, etiqueta, color, formato = numero }: { barras: readonly Barra[]; etiqueta: string; color: string; formato?: (valor: number) => string }) {
  const { ref, ancho, alto } = useTamano()
  const config = { valor: { label: etiqueta, color } } satisfies ChartConfig
  const datos = barras.map((barra) => ({ ...barra }))

  return (
    <ChartContainer ref={ref} config={config} className="aspect-auto h-full w-full">
      <BarChart width={ancho} height={alto} data={datos} margin={{ top: 2, right: 0, bottom: 0, left: 0 }} barCategoryGap="18%">
        <XAxis dataKey="nombre" hide />
        <YAxis hide domain={[0, 'dataMax']} />
        <Tooltip
          cursor={{ fill: 'var(--muted)' }}
          allowEscapeViewBox={{ x: true, y: true }}
          reverseDirection={{ x: false, y: true }}
          content={
            <ChartTooltipContent
              labelFormatter={(_etiqueta, carga) => (carga?.[0]?.payload as Barra | undefined)?.nombre}
              formatter={(valor) => <FilaTooltip color="var(--color-valor)" etiqueta={etiqueta} valor={formato(Number(valor))} />}
            />
          }
        />
        <Bar dataKey="valor" fill="var(--color-valor)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ChartContainer>
  )
}
