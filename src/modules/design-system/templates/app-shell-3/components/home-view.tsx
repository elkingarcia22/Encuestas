import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowDownRight01Icon,
  ArrowRight01Icon,
  ArrowUpRight01Icon,
} from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Heading,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
  Progress,
  ProgressLabel,
  ProgressValue,
  Text,
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
  cn,
} from '@ubits/flux-ui'

import { PROGRAMAS, USUARIO } from './data'
import { ACTIVIDAD, FORMACION_POR_MES, INDICADORES, PENDIENTES } from './home-data'

function saludo() {
  const hora = new Date().getHours()
  if (hora < 12) return 'Buenos días'
  if (hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function Tendencia({ valor }: { valor: number }) {
  const sube = valor >= 0

  return (
    <Text
      as="span"
      size="xs"
      weight="medium"
      className={cn('flex items-center gap-0.5', sube ? 'text-success' : 'text-destructive')}
    >
      <HugeiconsIcon
        icon={sube ? ArrowUpRight01Icon : ArrowDownRight01Icon}
        size={14}
        strokeWidth={2.5}
        aria-hidden="true"
      />
      {Math.abs(valor)}%
    </Text>
  )
}

function Indicadores() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {INDICADORES.map((indicador) => (
        <Card key={indicador.id}>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <Text variant="muted" size="sm">
                {indicador.etiqueta}
              </Text>
              <span className="text-muted-foreground">
                <HugeiconsIcon icon={indicador.icono} size={18} aria-hidden="true" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <Text as="span" size="xl" weight="semibold">
                {indicador.valor}
              </Text>
              <Tendencia valor={indicador.tendencia} />
            </div>
            <Text variant="muted" size="sm">
              {indicador.contexto}
            </Text>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function GraficoFormacion() {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Avance de formación</CardTitle>
        <CardDescription>Personas que iniciaron y completaron, mes a mes.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* No usa ChartContainer: ese wrapper de flux-ui trae su propia copia de recharts
            y pasa la medida por un contexto que la copia del proyecto no ve, así que un
            gráfico dentro de su ResponsiveContainer no dibuja nada. Aquí todo sale de la
            copia del proyecto, con los colores tomados del tema. El patrón que sí usa
            ChartContainer (medida en números) está en Encuestas › components/graficos.tsx. */}
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={FORMACION_POR_MES} margin={{ left: 4, right: 4, top: 4 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="mes"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                interval={0}
                padding={{ left: 16, right: 16 }}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              />
              <Tooltip
                cursor={{ stroke: 'var(--border)' }}
                contentStyle={{
                  background: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: 'var(--popover-foreground)',
                }}
                labelStyle={{ color: 'var(--foreground)', fontWeight: 500 }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, paddingBottom: 12 }}
                formatter={(valor) => (
                  <span style={{ color: 'var(--muted-foreground)' }}>{valor}</span>
                )}
              />
              <Area
                dataKey="iniciado"
                name="Iniciaron"
                type="natural"
                stroke="var(--chart-4)"
                fill="var(--chart-4)"
                fillOpacity={0.15}
                strokeWidth={2}
              />
              <Area
                dataKey="completado"
                name="Completaron"
                type="natural"
                stroke="var(--chart-2)"
                fill="var(--chart-2)"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

function ProgramasActivos() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Programas activos</CardTitle>
        <CardDescription>Los mismos que ves en el menú lateral.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {PROGRAMAS.map((programa) => (
          <Progress key={programa.id} value={programa.avance}>
            <ProgressLabel className="text-sm">{programa.label}</ProgressLabel>
            <ProgressValue className="text-muted-foreground ms-auto text-sm" />
          </Progress>
        ))}
      </CardContent>
    </Card>
  )
}

function TuDia() {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Tu día</CardTitle>
        <CardDescription>Lo que espera una decisión tuya.</CardDescription>
      </CardHeader>
      <CardContent>
        <ItemGroup>
          {PENDIENTES.map((pendiente, indice) => (
            <div key={pendiente.id} className="contents">
              {indice > 0 ? <ItemSeparator /> : null}
              <Item className="items-start">
                <ItemMedia variant="icon">
                  <HugeiconsIcon icon={pendiente.icono} strokeWidth={2} aria-hidden="true" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>
                    {pendiente.titulo}
                    {pendiente.urgencia === 'alta' ? (
                      <Badge variant="destructive-outline" size="xs">
                        Hoy
                      </Badge>
                    ) : null}
                    {pendiente.urgencia === 'media' ? (
                      <Badge variant="warning-light" size="xs">
                        Esta semana
                      </Badge>
                    ) : null}
                  </ItemTitle>
                  <ItemDescription>{pendiente.detalle}</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button variant="ghost" size="sm">
                    Abrir
                  </Button>
                </ItemActions>
              </Item>
            </div>
          ))}
        </ItemGroup>
      </CardContent>
    </Card>
  )
}

function ActividadReciente() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad reciente</CardTitle>
        <CardDescription>Lo último que movió tu equipo.</CardDescription>
      </CardHeader>
      <CardContent>
        <Timeline orientation="vertical" value={ACTIVIDAD.length}>
          {ACTIVIDAD.map((entrada, indice) => (
            <TimelineItem key={entrada.id} step={indice + 1}>
              <TimelineHeader>
                <TimelineSeparator />
                <TimelineDate>{entrada.cuando}</TimelineDate>
                <TimelineTitle>{entrada.quien}</TimelineTitle>
                <TimelineIndicator />
              </TimelineHeader>
              <TimelineContent>
                <Text variant="muted" size="sm">
                  {entrada.que}
                </Text>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </CardContent>
    </Card>
  )
}

export function HomeView() {
  const nombre = USUARIO.nombre.split(' ')[0]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Heading as="h1" level={3}>
            {saludo()}, {nombre}
          </Heading>
          <Text variant="muted" size="sm">
            Tienes {PENDIENTES.length} cosas esperándote y dos ciclos por cerrar este mes.
          </Text>
        </div>
        <Button variant="outline" size="sm">
          Ver todos los reportes
          <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} aria-hidden="true" />
        </Button>
      </div>

      <Indicadores />

      <div className="grid gap-4 lg:grid-cols-3">
        <GraficoFormacion />
        <ProgramasActivos />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <TuDia />
        <ActividadReciente />
      </div>
    </div>
  )
}
