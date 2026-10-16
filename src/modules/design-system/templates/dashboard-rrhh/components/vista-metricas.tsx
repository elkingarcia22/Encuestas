import { Fragment, useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  AlertCircleIcon,
  CheckmarkCircle02Icon,
  Download01Icon,
  PieChartIcon,
  Settings02Icon,
} from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  DataGridList,
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
  IconTile,
  Progress,
  ProgressLabel,
  ProgressValue,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
  TrafficLight,
  type DataGridListConfig,
} from '@ubits/flux-ui'

import {
  EMBUDO_SEMANAL,
  EMBUDO_TOTALES,
  ETAPAS,
  PERIODOS,
  RESULTADOS_POR_AREA,
  SALUD,
  TENDENCIA_PARTICIPACION,
  iniciales,
  type ResultadoArea,
} from './data'
import { Dona, GraficoArea } from '../../dashboard/components/graficos'
import { Variacion } from '../../dashboard/components/piezas'

// Estructura tomada de los bloques Solutions · Analytics de ReUI: salud con indicadores y
// actividad, tendencia, embudo por etapas con su mezcla y el desglose en una tabla.

function SelectorDePeriodo({ inicial = '30d', etiqueta }: { inicial?: string; etiqueta: string }) {
  const [periodo, setPeriodo] = useState(inicial)
  return (
    <Select value={periodo} onValueChange={(valor) => setPeriodo(String(valor ?? inicial))}>
      <SelectTrigger size="sm" className="w-40" aria-label={etiqueta}>
        <SelectValue>{(valor) => PERIODOS[String(valor)]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(PERIODOS).map(([valor, texto]) => (
          <SelectItem key={valor} value={valor}>
            {texto}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function SaludDelTalento() {
  return (
    <Frame className="h-full">
      <FrameHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <FrameTitle>Salud del talento</FrameTitle>
          <FrameDescription>646 personas · actualizado a las 09:40</FrameDescription>
        </div>
        <div className="flex items-center gap-2">
          <SelectorDePeriodo etiqueta="Periodo de la salud del talento" />
          <Button variant="outline" size="icon-sm" aria-label="Configurar indicadores">
            <HugeiconsIcon icon={Settings02Icon} aria-hidden="true" />
          </Button>
        </div>
      </FrameHeader>
      <FramePanel className="flex flex-1 flex-col gap-5">
        <div className="grid grid-cols-3 gap-4">
          {SALUD.indicadores.map((indicador) => (
            <div key={indicador.etiqueta} className="flex flex-col gap-1">
              <Text as="span" size="xl" weight="semibold">
                {indicador.valor}
              </Text>
              <Text as="span" variant="muted" size="sm">
                {indicador.etiqueta}
              </Text>
              <div>
                <Variacion valor={indicador.variacion} sufijo={indicador.sufijo} menosEsMejor={indicador.menosEsMejor} />
              </div>
            </div>
          ))}
        </div>
        <Separator />
        <Progress value={SALUD.cicloDesempeno}>
          <ProgressLabel>Avance del ciclo de desempeño 2026-S2</ProgressLabel>
          <ProgressValue className="ms-auto" />
        </Progress>
        <Separator />
        <div className="flex flex-col gap-3">
          <Text as="span" size="sm" weight="medium">
            Actividad reciente
          </Text>
          {SALUD.actividad.map((evento) => (
            <div key={evento.id} className="flex items-center gap-2">
              <HugeiconsIcon
                icon={evento.tono === 'ok' ? CheckmarkCircle02Icon : AlertCircleIcon}
                size={16}
                className={evento.tono === 'ok' ? 'shrink-0 text-success' : 'shrink-0 text-destructive'}
                aria-hidden="true"
              />
              <Text as="span" size="sm" className="min-w-0 flex-1">
                {evento.texto}
              </Text>
              <Badge variant={evento.tono === 'ok' ? 'info-light' : 'warning-light'} size="sm">
                {evento.hora}
              </Badge>
            </div>
          ))}
        </div>
      </FramePanel>
      <FrameFooter className="grid grid-cols-2 gap-2">
        <Button variant="outline">Revisar alertas</Button>
        <Button>Informe completo</Button>
      </FrameFooter>
    </Frame>
  )
}

function TendenciaDeParticipacion() {
  return (
    <Frame className="h-full">
      <FrameHeader className="flex flex-row items-center justify-between gap-3">
        <FrameTitle>Tendencia de participación</FrameTitle>
        <SelectorDePeriodo inicial="12m" etiqueta="Periodo de la tendencia" />
      </FrameHeader>
      <FramePanel className="flex flex-1 flex-col gap-1">
        <Text as="span" variant="muted" size="xs">
          Último dato (1 ago – 11 sep)
        </Text>
        <div className="flex items-center gap-2">
          <Text as="span" size="xl" weight="semibold">
            74 %
          </Text>
          <Variacion valor={13} sufijo=" pts" />
        </div>
        <div className="mt-2 flex-1">
          <GraficoArea
            datos={TENDENCIA_PARTICIPACION}
            eje="mes"
            unidad=" %"
            alto={300}
            series={[{ clave: 'participacion', nombre: 'Participación', color: 'var(--chart-2)' }]}
          />
        </div>
      </FramePanel>
    </Frame>
  )
}

function EmbudoDeSeleccion() {
  // Capas de abajo arriba: la etapa más chica al fondo, la más grande encima.
  const series = [...ETAPAS].reverse().map((etapa) => ({ clave: etapa.id, nombre: etapa.titulo, color: etapa.color }))

  return (
    <Frame className="h-full">
      <FrameHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <FrameTitle>Embudo de selección</FrameTitle>
          <FrameDescription>Candidatos por etapa, semana a semana</FrameDescription>
        </div>
        <SelectorDePeriodo etiqueta="Periodo del embudo" />
      </FrameHeader>
      <FramePanel className="flex flex-1 flex-col gap-4">
        <div className="flex flex-wrap gap-x-4 gap-y-3">
          {EMBUDO_TOTALES.map((etapa, indice) => (
            <Fragment key={etapa.id}>
              {indice > 0 ? <Separator orientation="vertical" className="hidden h-10 sm:block" /> : null}
              <div className="flex min-w-24 flex-col gap-1">
                <Text as="span" variant="muted" size="xs">
                  {etapa.etiqueta}
                </Text>
                <div className="flex items-center gap-1.5">
                  <Text as="span" size="lg" weight="semibold">
                    {etapa.valor}
                  </Text>
                  <Variacion valor={etapa.variacion} />
                </div>
              </div>
            </Fragment>
          ))}
        </div>
        <GraficoArea datos={EMBUDO_SEMANAL} eje="semana" series={series} apilado alto={330} />
      </FramePanel>
    </Frame>
  )
}

// Por nombre de área, para que no dependa del orden de la tabla. Personas coincide con la tabla.
const MEZCLAS: Record<'personas' | 'clima' | 'formacion', { etiqueta: string; valores: Record<string, number> }> = {
  personas: {
    etiqueta: 'Personas en la empresa',
    valores: { Comercial: 184, Operaciones: 152, Tecnología: 118, 'Servicio al cliente': 86, Finanzas: 64, Talento: 42 },
  },
  clima: {
    etiqueta: 'Respondieron clima 2026',
    valores: { Comercial: 110, Operaciones: 84, Tecnología: 79, 'Servicio al cliente': 45, Finanzas: 30, Talento: 27 },
  },
  formacion: {
    etiqueta: 'En algún plan de formación',
    valores: { Comercial: 131, Operaciones: 97, Tecnología: 91, 'Servicio al cliente': 50, Finanzas: 31, Talento: 37 },
  },
}

// Cinco tonos del tema de mayor a menor, y gris para la porción más chica.
const COLORES_AREA = ['var(--chart-2)', 'var(--chart-1)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--muted-foreground)']

function MezclaPorArea() {
  const [mezcla, setMezcla] = useState<keyof typeof MEZCLAS>('personas')
  const actual = MEZCLAS[mezcla]
  const datos = RESULTADOS_POR_AREA.map((area) => ({ area: area.area, respuestas: actual.valores[area.area] ?? 0 }))
    .sort((a, b) => b.respuestas - a.respuestas)
    .map((dato, indice) => ({ ...dato, color: COLORES_AREA[indice] }))
  const total = datos.reduce((suma, dato) => suma + dato.respuestas, 0)

  return (
    <Frame className="h-full">
      <FrameHeader className="flex flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FrameTitle>Por área</FrameTitle>
          <Variacion valor={8.6} />
        </div>
        <Button variant="outline" size="xs">
          Exportar
        </Button>
      </FrameHeader>
      <FramePanel className="flex flex-1 flex-col gap-4">
        <div className="flex items-center gap-3">
          <IconTile variant="soft">
            <HugeiconsIcon icon={PieChartIcon} aria-hidden="true" />
          </IconTile>
          <div className="flex flex-col gap-1">
            <Text as="span" variant="muted" size="sm">
              {actual.etiqueta}
            </Text>
            <Text as="span" size="xl" weight="semibold">
              {total.toLocaleString('es-CO')}
            </Text>
          </div>
        </div>
        <Tabs value={mezcla} onValueChange={(valor) => setMezcla(valor as keyof typeof MEZCLAS)}>
          <TabsList className="w-full">
            <TabsTrigger value="personas">Personas</TabsTrigger>
            <TabsTrigger value="clima">Clima</TabsTrigger>
            <TabsTrigger value="formacion">Formación</TabsTrigger>
          </TabsList>
        </Tabs>
        <Dona datos={datos} total={total.toLocaleString('es-CO')} />
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {datos.map((dato) => (
            <TrafficLight
              key={dato.area}
              data={{ label: dato.area, items: [{ label: dato.area, value: dato.respuestas.toLocaleString('es-CO'), color: dato.color }] }}
            />
          ))}
        </div>
      </FramePanel>
    </Frame>
  )
}

// ── Desglose por área ──

type Filtro = { id: string; value: unknown }

const RIESGO: Record<ResultadoArea['riesgo'], 'success-light' | 'warning-light' | 'destructive-outline'> = {
  Saludable: 'success-light',
  'En observación': 'warning-light',
  Crítico: 'destructive-outline',
}

// La tabla lee enableColumnOrdering en cada columna para pintar el asidero de arrastre, pero el
// tipo de las columnas no lo declara: por eso va en una constante aparte que se esparce en cada una.
const SIN_ARRASTRE = { enableColumnOrdering: false }

// Columnas y filtros fuera del componente (ver trampas_conocidas en flux-ui-para-ia.json).
const COLUMNAS: DataGridListConfig<ResultadoArea>['columns'] = [
  {
    accessorKey: 'area',
    header: 'Área',
    size: 220,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        <Text as="span" size="sm" weight="medium">
          {row.original.area}
        </Text>
        <Text as="span" variant="muted" size="xs">
          {row.original.personas} personas
        </Text>
      </div>
    ),
  },
  {
    accessorKey: 'lider',
    header: 'Líder',
    size: 180,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <div className="flex min-w-0 items-center gap-2">
        <Avatar size="sm">
          <AvatarFallback>{iniciales(row.original.lider)}</AvatarFallback>
        </Avatar>
        <Text as="span" size="sm" className="truncate">
          {row.original.lider}
        </Text>
      </div>
    ),
  },
  {
    accessorKey: 'clima',
    header: 'Clima',
    size: 110,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        <Text as="span" size="sm" weight="medium">
          {row.original.clima}
        </Text>
        <Text as="span" variant="muted" size="xs">
          de 100
        </Text>
      </div>
    ),
  },
  {
    accessorKey: 'enps',
    header: 'eNPS',
    size: 100,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        <Text as="span" size="sm" weight="medium">
          {row.original.enps}
        </Text>
        <Text as="span" variant="muted" size="xs">
          de −100 a 100
        </Text>
      </div>
    ),
  },
  {
    accessorKey: 'formacion',
    header: 'Formación',
    size: 170,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Progress value={row.original.formacion} className="w-24" aria-label={`Formación completada: ${row.original.formacion} %`} />
        <Text as="span" variant="muted" size="xs">
          {row.original.formacion} %
        </Text>
      </div>
    ),
  },
  {
    accessorKey: 'riesgo',
    header: 'Riesgo',
    size: 140,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <Badge variant={RIESGO[row.original.riesgo]} size="sm">
        {row.original.riesgo}
      </Badge>
    ),
  },
  {
    accessorKey: 'actualizado',
    header: 'Actualizado',
    size: 120,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <Text as="span" variant="muted" size="sm">
        {row.original.actualizado}
      </Text>
    ),
  },
]

const FILTROS: DataGridListConfig<ResultadoArea>['columnFilters'] = [
  {
    id: 'riesgo',
    label: 'Riesgo',
    type: 'select',
    multiple: true,
    options: (Object.keys(RIESGO) as ResultadoArea['riesgo'][]).map((r) => ({ label: r, value: r })),
  },
]

function resolver(filas: ResultadoArea[], busqueda: string, filtros: Filtro[], orden?: string) {
  const q = busqueda.trim().toLowerCase()
  let resultado = filas.filter((fila) => {
    if (q && ![fila.area, fila.lider].some((c) => c.toLowerCase().includes(q))) return false
    for (const { id, value } of filtros) {
      if (Array.isArray(value) && value.length > 0 && !value.map(String).includes(String(fila[id as keyof ResultadoArea]))) {
        return false
      }
    }
    return true
  })

  if (orden) {
    const desc = orden.startsWith('-')
    const campo = (desc ? orden.slice(1) : orden) as keyof ResultadoArea
    resultado = [...resultado].sort((a, b) => {
      const va = a[campo]
      const vb = b[campo]
      const r = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'es')
      return desc ? -r : r
    })
  }

  return resultado
}

function DesglosePorArea() {
  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState<Filtro[]>([])
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const resultado = useMemo(() => resolver(RESULTADOS_POR_AREA, busqueda, filtros, orden), [busqueda, filtros, orden])

  const config: DataGridListConfig<ResultadoArea> = {
    columns: COLUMNAS,
    columnFilters: FILTROS,
    onColumnFiltersChange: setFiltros,
    sort: { onSortChange: (nuevo) => setOrden(nuevo) },
    search: { placeholder: 'Buscar área o líder…', onSearch: setBusqueda },
    actions: {
      secondary: [
        { id: 'exportar', label: 'Exportar', icon: <HugeiconsIcon icon={Download01Icon} aria-hidden="true" />, onClick: () => undefined },
      ],
    },
    emptyState: { type: 'no-results', title: 'Ningún área coincide', description: 'Prueba con otro nombre o nivel de riesgo.' },
    frame: {
      title: 'Resultados por área',
      description: 'Clima, eNPS y formación de cada área, con su nivel de riesgo',
      toolbar: 'header',
    },
    cardVariant: 'borderless',
    layout: { reorderable: false, dense: true, resizable: false },
  }

  return <DataGridList config={config} data={resultado} />
}

export function VistaMetricas() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <SaludDelTalento />
        <TendenciaDeParticipacion />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EmbudoDeSeleccion />
        </div>
        <MezclaPorArea />
      </div>
      <DesglosePorArea />
    </div>
  )
}
