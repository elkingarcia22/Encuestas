import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDownRight01Icon, ArrowUpRight01Icon } from '@hugeicons/core-free-icons'
import { useNavigate } from 'react-router'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts'
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ubits/flux-ui'
import { EVAL_PENDING, EVAL_SEGMENTS, TRAINING_SERIES, TRAINING_STATS } from './data'
import { notify } from '@/shared/components/notify'

// Los gráficos usan recharts directo (no el ChartContainer de flux-ui): la
// librería trae internamente otra versión de recharts y al mezclarlas no se
// pinta nada. Los colores salen del primary del tema (y aclarados de ese mismo azul), no de la escala --chart.
const SERIES = [
  // La serie principal va en el primary exacto; la secundaria es el mismo azul aclarado (no otro tono de la escala).
  { key: 'iniciaron', label: 'Iniciaron', color: 'color-mix(in oklab, var(--primary) 35%, var(--background))' },
  { key: 'completaron', label: 'Completaron', color: 'var(--primary)' },
]

const tooltipStyle = {
  contentStyle: {
    background: 'var(--popover)',
    color: 'var(--popover-foreground)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    fontSize: 12,
  },
  itemStyle: { color: 'var(--popover-foreground)' },
  labelStyle: { color: 'var(--muted-foreground)' },
  cursor: { fill: 'var(--muted)' },
}

// Formación: 3 cifras + barras mes a mes.
export function TrainingCard() {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <CardTitle role="heading" aria-level={2}>Formación</CardTitle>
        <CardDescription>Personas que iniciaron y completaron un curso, mes a mes</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-3 divide-x divide-border border-b">
          {TRAINING_STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1 px-5 py-4">
              <span className="text-xs text-muted-foreground">{stat.label}</span>
              <span className="text-2xl font-light tracking-tight">{stat.value}</span>
              {/* Lo que baja va en destructive-outline: destructive-light deja el texto blanco sobre rosa. */}
              <Badge variant={stat.up ? 'success-light' : 'destructive-outline'} size="xs" className="w-fit tabular-nums">
                <HugeiconsIcon icon={stat.up ? ArrowUpRight01Icon : ArrowDownRight01Icon} size={12} aria-hidden="true" />
                {stat.delta}
              </Badge>
            </div>
          ))}
        </div>
        {/* El gráfico es solo visual: el lector de pantalla recibe los mismos datos en la tabla oculta de abajo. */}
        <div className="h-60 w-full px-4 pt-4 pb-2 text-xs" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={TRAINING_SERIES} margin={{ left: 0, right: 0, top: 4 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} stroke="var(--muted-foreground)" />
              <Tooltip {...tooltipStyle} />
              {/* El punto lleva el color de la serie; el texto va en gris legible (el azul aclarado no se leía). */}
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 13 }}
                formatter={(value) => <span style={{ color: 'var(--muted-foreground)' }}>{value}</span>}
              />
              {SERIES.map((s) => (
                <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={4} isAnimationActive={false} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Los mismos datos del gráfico en una tabla para el lector de pantalla, con la Table de la librería. */}
        <div className="sr-only">
          <Table>
            <caption>Personas que iniciaron y completaron un curso, por mes</caption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Mes</TableHead>
                {SERIES.map((s) => (
                  <TableHead key={s.key} scope="col">{s.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {TRAINING_SERIES.map((row) => (
                <TableRow key={row.month}>
                  <TableHead scope="row">{row.month}</TableHead>
                  <TableCell>{row.iniciaron}</TableCell>
                  <TableCell>{row.completaron}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

// Completadas en primary, en progreso en el mismo azul aclarado y sin empezar en gris visible (el `--muted` casi no se veía).
// La leyenda usa estos mismos colores para que cada punto coincida con su tramo de la dona.
const EVAL_COLORS = [
  'var(--primary)',
  'color-mix(in oklab, var(--primary) 35%, var(--background))',
  'color-mix(in oklab, var(--foreground) 14%, var(--background))',
]

// Evaluaciones 360: donut del ciclo + quienes aún no empiezan.
export function EvaluationsCard() {
  const navigate = useNavigate()
  const total = EVAL_SEGMENTS.reduce((n, s) => n + s.value, 0)
  const done = EVAL_SEGMENTS[0].value
  const pct = Math.round((done / total) * 100)

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <CardTitle role="heading" aria-level={2}>Evaluaciones 360</CardTitle>
        <CardDescription>El ciclo cierra el 30 de septiembre</CardDescription>
        <CardAction>
          <Badge variant="warning-light" size="xs">{total - done} pendientes</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 py-5">
        <div className="flex items-center gap-6">
          <div className="relative size-32 shrink-0">
            {/* La dona es solo visual (los tramos ya están en texto en la leyenda); sin tab propio para no dejar un foco sin nombre. */}
            <div className="size-full" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip {...tooltipStyle} />
                  <Pie
                    rootTabIndex={-1}
                    data={EVAL_SEGMENTS}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={44}
                    outerRadius={60}
                    paddingAngle={3}
                    stroke="none"
                    isAnimationActive={false}
                  >
                    {EVAL_SEGMENTS.map((segment, i) => (
                      <Cell key={segment.key} fill={EVAL_COLORS[i]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1">
              <span className="text-xl font-light tracking-tight">{pct} %</span>
              <span className="text-xs text-muted-foreground">completado</span>
            </div>
          </div>
          <ul className="flex flex-1 flex-col gap-2">
            {EVAL_SEGMENTS.map((segment, i) => (
              <li key={segment.key} className="flex items-center gap-2 text-sm">
                <span className="size-2 shrink-0 rounded-full" style={{ background: EVAL_COLORS[i] }} aria-hidden="true" />
                <span className="flex-1 text-muted-foreground">{segment.label}</span>
                <span className="tabular-nums text-xs">{segment.value}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <span role="heading" aria-level={3} className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Aún no la empiezan</span>
          {EVAL_PENDING.map((person) => (
            <div key={person.name} className="flex items-center gap-3">
              <Avatar className="size-8" aria-hidden="true">
                <AvatarFallback>{person.initials}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate text-sm font-medium">{person.name}</span>
                <span className="text-xs text-muted-foreground break-words">{person.meta}</span>
              </div>
              <Button variant="outline" size="sm" aria-label={`Recordar a ${person.name}`} onClick={() => notify(`Recordatorio enviado a ${person.name}`)}>
                Recordar
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="border-t py-3">
        <Button variant="link" size="sm" className="h-auto p-0" onClick={() => navigate('/admin/desempeno-cultura/evaluaciones-360')}>
          Ver las 14 personas
        </Button>
      </CardFooter>
    </Card>
  )
}
