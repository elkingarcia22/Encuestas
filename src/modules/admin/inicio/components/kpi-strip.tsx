import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDownRight01Icon, ArrowUpRight01Icon } from '@hugeicons/core-free-icons'
import { useNavigate } from 'react-router'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { Badge, Button, Card } from '@ubits/flux-ui'
import { KPIS, type Kpi } from './data'

// Sparkline de 80×32 con el color primario del tema. Se usa recharts directo
// (no el ChartContainer de flux-ui) porque la librería trae internamente otra
// versión de recharts y los gráficos no se pintan al mezclarlas.
function Sparkline({ values }: { values: number[] }) {
  const data = values.map((v, i) => ({ i, v }))
  return (
    <div className="h-8 w-20 shrink-0" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Area
            dataKey="v"
            type="monotone"
            stroke="var(--primary)"
            fill="var(--primary)"
            fillOpacity={0.15}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// Celda clicable con el Button de flux-ui como superficie. Las líneas entre celdas van en cada botón
// (el borde propio del Button tapaba el divide de la tarjeta) y la gráfica recupera su tamaño
// (el Button fuerza 16px a todo SVG sin clase de tamaño).
const CELL =
  'h-auto! min-w-0 flex-col! items-stretch! justify-start! gap-1! rounded-none! border-0! [border-color:var(--border)]! px-5! py-4! text-left font-normal! whitespace-normal! hover:bg-muted/50! dark:hover:bg-muted/50! max-lg:not-last:border-b! lg:not-last:border-r! [&_.recharts-surface]:size-full!'

function KpiCell({ kpi }: { kpi: Kpi }) {
  const navigate = useNavigate()
  return (
    <Button variant="ghost" onClick={() => navigate(kpi.to)} className={CELL}>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-muted-foreground">{kpi.title}</span>
        <div className="flex items-end justify-between gap-3">
          <span className="text-2xl font-light tracking-tight">{kpi.value}</span>
          <Sparkline values={kpi.spark} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/* Lo que baja va en destructive-outline: destructive-light deja el texto blanco sobre rosa. */}
        <Badge variant={kpi.up ? 'success-light' : 'destructive-outline'} size="xs" className="tabular-nums">
          <HugeiconsIcon icon={kpi.up ? ArrowUpRight01Icon : ArrowDownRight01Icon} size={12} className="size-3" aria-hidden="true" />
          {kpi.delta}
        </Badge>
        <span className="truncate text-xs text-muted-foreground">{kpi.deltaNote}</span>
      </div>
    </Button>
  )
}

// Franja de KPI: una sola tarjeta con 4 celdas clicables. En móvil va a una columna: a 320px, en dos,
// la gráfica se salía de la celda y la nota de variación se cortaba.
export function KpiStrip() {
  return (
    <Card className="grid grid-cols-1 gap-0 py-0 sm:grid-cols-2 lg:grid-cols-4">
      {KPIS.map((kpi) => (
        <KpiCell key={kpi.title} kpi={kpi} />
      ))}
    </Card>
  )
}
