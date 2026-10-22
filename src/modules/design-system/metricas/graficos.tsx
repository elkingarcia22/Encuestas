import { useId } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

// Gráficos de recharts pintados solo con tokens del tema. Se usa recharts directo, sin el
// ChartContainer de flux-ui (ver trampas_conocidas en ai-tools/flux-ui/flux-ui-para-ia.json:
// la librería trae su propia copia de recharts). El patrón con ChartContainer está en
// src/modules/admin/desempeno-cultura/encuestas/components/graficos.tsx.

// Sparkline, Anillo y Dona se retiraron el 13-oct (reglas.json): solo los usa el Archivo congelado. En su lugar,
// Tendencia, AnilloAvance y DonaReparto de design-system/graficos/piezas.

const EJE = { fill: 'var(--muted-foreground)', fontSize: 12 }

const TOOLTIP = {
  cursor: { stroke: 'var(--border)' },
  contentStyle: {
    background: 'var(--popover)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    fontSize: 12,
    color: 'var(--popover-foreground)',
  },
  labelStyle: { color: 'var(--foreground)', fontWeight: 500 },
}

/** Minigráfico de tendencia, sin ejes: para tarjetas de indicadores. */
export function Sparkline({ datos, color = 'var(--chart-2)' }: { datos: number[]; color?: string }) {
  const puntos = datos.map((valor, indice) => ({ indice, valor }))
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={puntos} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
        <Area
          dataKey="valor"
          type="monotone"
          stroke={color}
          strokeWidth={2}
          fill={color}
          fillOpacity={0.06}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/**
 * Tendencia de una tarjeta de indicador, como el bloque dashboard-2 de ReUI: línea ondulada de
 * 2 px con relleno degradado y animación al cargar. Sin ejes; el color es un token del tema.
 */
export function Tendencia({ datos, color }: { datos: number[]; color: string }) {
  // Un id por gráfico: hay varias tarjetas en pantalla y cada una necesita su degradado.
  const degradado = `tendencia-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const puntos = datos.map((valor, indice) => ({ indice, valor }))
  const minimo = Math.min(...datos)
  const holgura = (Math.max(...datos) - minimo) * 0.25 || 1

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={puntos} margin={{ top: 4, right: 2, bottom: 0, left: 2 }}>
        <defs>
          <linearGradient id={degradado} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <YAxis hide domain={[minimo - holgura, 'dataMax']} />
        <Area dataKey="valor" type="natural" stroke={color} strokeWidth={2} fill={`url(#${degradado})`} animationDuration={1200} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

type Serie = { clave: string; nombre: string; color: string }

/** Área con una o varias series. `apilado` las superpone como capas (embudo por semana). */
export function GraficoArea({
  datos,
  eje,
  series,
  apilado = false,
  alto = 240,
  unidad = '',
}: {
  datos: object[]
  eje: string
  series: Serie[]
  apilado?: boolean
  alto?: number
  unidad?: string
}) {
  return (
    <ResponsiveContainer width="100%" height={alto}>
      <AreaChart data={datos} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey={eje} tickLine={false} axisLine={false} tickMargin={10} minTickGap={24} tick={EJE} />
        <YAxis hide domain={apilado ? [0, 'auto'] : ['dataMin - 10', 'dataMax + 10']} />
        <Tooltip {...TOOLTIP} formatter={(valor) => `${valor}${unidad}`} />
        {series.map((serie) => (
          <Area
            key={serie.clave}
            dataKey={serie.clave}
            name={serie.nombre}
            type="natural"
            stackId={apilado ? 'embudo' : undefined}
            stroke={serie.color}
            strokeWidth={apilado ? 1.5 : 2}
            fill={serie.color}
            fillOpacity={apilado ? 0.5 : 0.12}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}

/** Barra horizontal partida en segmentos: el reparto de un total (p. ej. estado de licencias). */
export function BarraSegmentada({ segmentos }: { segmentos: { id: string; etiqueta: string; valor: number; color: string }[] }) {
  const fila = Object.fromEntries(segmentos.map((segmento) => [segmento.id, segmento.valor]))
  const total = segmentos.reduce((suma, segmento) => suma + segmento.valor, 0)
  const ultimo = segmentos.length - 1

  return (
    <ResponsiveContainer width="100%" height={12}>
      {/* Decorativa: las cifras van al lado en texto. Sin la capa de teclado de recharts, que la volvía enfocable dentro
          de un contenedor aria-hidden (fallo AA «aria-hidden-focus», 5 oct). */}
      <BarChart data={[fila]} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barSize={10} accessibilityLayer={false}>
        <XAxis type="number" hide domain={[0, total]} />
        <YAxis type="category" hide />
        {segmentos.map((segmento, indice) => (
          <Bar
            key={segmento.id}
            dataKey={segmento.id}
            name={segmento.etiqueta}
            stackId="reparto"
            fill={segmento.color}
            stroke="var(--card)"
            strokeWidth={2}
            radius={indice === 0 ? [6, 0, 0, 6] : indice === ultimo ? [0, 6, 6, 0] : 0}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

/** Anillo de avance con el porcentaje en el centro, para celdas de tabla. */
export function Anillo({ valor, color }: { valor: number; color: string }) {
  const datos = [
    { clave: 'hecho', valor },
    { clave: 'resto', valor: Math.max(0, 100 - valor) },
  ]
  return (
    <PieChart width={40} height={40}>
      <Pie
        data={datos}
        dataKey="valor"
        innerRadius={15}
        outerRadius={19}
        startAngle={90}
        endAngle={-270}
        stroke="none"
        isAnimationActive={false}
      >
        <Cell fill={color} />
        <Cell fill="var(--muted)" />
        <Label value={`${valor}%`} position="center" fill="var(--foreground)" fontSize={9} fontWeight={500} />
      </Pie>
    </PieChart>
  )
}

/**
 * (David, 29 sep) Anillo por segmentos, el medidor de las tarjetas de indicador (ReUI chart-8): una corona de rayitas donde se pintan
 * las que corresponden al porcentaje y el resto quedan apagadas. Frente al anillo continuo, se puede *contar* cuánto
 * lleva de un vistazo, que es lo que lo hace legible a 36 px.
 */
export function AnilloSegmentado({ valor, color, tamano = 36, segmentos = 24 }: { valor: number; color: string; tamano?: number; segmentos?: number }) {
  const llenos = Math.round((Math.min(100, Math.max(0, valor)) / 100) * segmentos)
  const datos = Array.from({ length: segmentos }, (_, i) => ({ id: i, valor: 1 }))
  const radio = tamano / 2
  return (
    <PieChart width={tamano} height={tamano}>
      <Pie
        data={datos}
        dataKey="valor"
        innerRadius={radio - 5}
        outerRadius={radio}
        startAngle={90}
        endAngle={-270}
        // El aire entre rayitas es lo que hace que se vean segmentos y no un anillo continuo.
        paddingAngle={4}
        stroke="none"
        isAnimationActive={false}
      >
        {datos.map((segmento) => (
          <Cell key={segmento.id} fill={segmento.id < llenos ? color : 'var(--muted)'} />
        ))}
      </Pie>
    </PieChart>
  )
}

/** Dona con el total en el centro; la leyenda va aparte, debajo. */
export function Dona({
  datos,
  total,
  alto = 220,
}: {
  datos: { area: string; respuestas: number; color: string }[]
  total: string
  alto?: number
}) {
  const radio = Math.round(alto / 2.2)
  return (
    <ResponsiveContainer width="100%" height={alto}>
      <PieChart>
        <Tooltip {...TOOLTIP} />
        <Pie
          data={datos}
          dataKey="respuestas"
          nameKey="area"
          innerRadius={Math.round(radio * 0.62)}
          outerRadius={radio}
          paddingAngle={2}
          cornerRadius={6}
          stroke="var(--card)"
          strokeWidth={2}
        >
          {datos.map((dato) => (
            <Cell key={dato.area} fill={dato.color} />
          ))}
          <Label value={total} position="center" fill="var(--foreground)" fontSize={20} fontWeight={600} />
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  )
}
