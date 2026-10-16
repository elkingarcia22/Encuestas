import { Fragment, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, Download01Icon, MoreHorizontalIcon, Settings02Icon } from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  IconTile,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Progress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
  TrafficLight,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { plural } from '@/modules/design-system/patrones/formato'

import {
  ACTIVIDAD,
  ESTADO_LICENCIAS,
  KPIS_INICIO,
  LICENCIAS,
  MODULOS,
  PENDIENTES,
  TAREAS,
  type Modulo,
} from './data'
import { BarraSegmentada, GraficoArea } from '../../dashboard/components/graficos'
import { TarjetaIndicador } from '../../dashboard/components/piezas'

const numero = (n: number) => n.toLocaleString('es-CO')

// Estructura tomada de los bloques Solutions · Inventory de ReUI: indicadores con minigráfico,
// reparto de un total en barra, ritmo diario junto a lo que necesita atención y un listado
// filtrable con pestañas.

function EstadoDeLicencias() {
  const porcentaje = Math.round((LICENCIAS.enUso / LICENCIAS.contratadas) * 100)

  return (
    <Frame>
      <FrameHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <FrameTitle>Estado de las licencias</FrameTitle>
          <FrameDescription>
            {numero(LICENCIAS.enUso)} de {numero(LICENCIAS.contratadas)} en uso ({porcentaje} %) · vigentes hasta{' '}
            {LICENCIAS.vigencia}
          </FrameDescription>
        </div>
        <Button variant="outline" size="sm">
          <HugeiconsIcon icon={Settings02Icon} aria-hidden="true" />
          Gestionar
        </Button>
      </FrameHeader>
      <FramePanel className="flex flex-col gap-5">
        <BarraSegmentada segmentos={ESTADO_LICENCIAS} />
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
          {ESTADO_LICENCIAS.map((estado) => (
            <div key={estado.id} className="flex flex-col gap-1">
              <TrafficLight
                data={{
                  label: estado.etiqueta,
                  items: [
                    {
                      label: estado.etiqueta,
                      value: `${Math.round((estado.valor / LICENCIAS.enUso) * 100)} %`,
                      color: estado.color,
                    },
                  ],
                }}
              />
              <Text as="span" size="lg" weight="semibold">
                {numero(estado.valor)}
              </Text>
              <Text as="span" variant="muted" size="xs">
                {estado.detalle}
              </Text>
            </div>
          ))}
        </div>
      </FramePanel>
    </Frame>
  )
}

function Actividad() {
  return (
    <Frame className="h-full">
      <FrameHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <FrameTitle>Actividad en la plataforma</FrameTitle>
          <FrameDescription>Personas por día en los últimos 30 días</FrameDescription>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <Badge variant="success-light" size="sm">
            Ingresaron
          </Badge>
          <Badge variant="info-light" size="sm">
            Completaron algo
          </Badge>
        </div>
      </FrameHeader>
      <FramePanel className="flex-1">
        <GraficoArea
          datos={ACTIVIDAD}
          eje="dia"
          alto={336}
          series={[
            { clave: 'ingresaron', nombre: 'Ingresaron', color: 'var(--success)' },
            { clave: 'completaron', nombre: 'Completaron algo', color: 'var(--info)' },
          ]}
        />
      </FramePanel>
    </Frame>
  )
}

// Hallazgo del recorrido: crear no es activar, y cada módulo lo avisa distinto.
function NecesitaAtencion() {
  return (
    <Frame className="h-full">
      <FrameHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <FrameTitle>Necesita atención</FrameTitle>
          <FrameDescription>Creado, pero sin llegar a nadie</FrameDescription>
        </div>
        <Button variant="outline" size="xs">
          Ver todo
        </Button>
      </FrameHeader>
      <FramePanel className="flex-1">
        <ItemGroup>
          {PENDIENTES.map((pendiente) => (
            <Fragment key={pendiente.id}>
              <Item size="xs">
                <ItemMedia>
                  <IconTile variant="soft" size="sm">
                    <HugeiconsIcon icon={pendiente.icono} aria-hidden="true" />
                  </IconTile>
                </ItemMedia>
                <ItemContent className="min-w-0">
                  <ItemTitle className="truncate">{pendiente.titulo}</ItemTitle>
                  <ItemDescription className="truncate">{pendiente.detalle}</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Badge variant={pendiente.estado.variante} size="sm">
                    {pendiente.estado.texto}
                  </Badge>
                </ItemActions>
              </Item>
            </Fragment>
          ))}
        </ItemGroup>
      </FramePanel>
    </Frame>
  )
}

const BADGE_DE_MODULO: Record<Modulo['estado'], { variante: 'success-light' | 'secondary' | 'destructive-outline'; texto: string }> = {
  activo: { variante: 'success-light', texto: 'Activo' },
  inactivo: { variante: 'secondary', texto: 'Inactivo' },
  vencido: { variante: 'destructive-outline', texto: 'Vencido' },
}

const FILTROS_MODULO = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'activo', etiqueta: 'Activos' },
  { valor: 'inactivo', etiqueta: 'Inactivos' },
  { valor: 'vencido', etiqueta: 'Vencidos' },
] as const

// Hallazgo del recorrido: hay módulos apagados o vencidos que igual aparecen en el menú.
function ModulosContratados() {
  const [filtro, setFiltro] = useState<string>('todos')
  const visibles = filtro === 'todos' ? MODULOS : MODULOS.filter((modulo) => modulo.estado === filtro)

  return (
    <Frame>
      <FrameHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <FrameTitle>Módulos contratados</FrameTitle>
          <FrameDescription>Qué tiene la empresa, cuánto se usa y cuándo se renueva</FrameDescription>
        </div>
        <Button variant="outline" size="sm">
          <HugeiconsIcon icon={Download01Icon} aria-hidden="true" />
          Exportar
        </Button>
      </FrameHeader>
      <FramePanel className="flex flex-col gap-2">
        <Tabs value={filtro} onValueChange={(valor) => setFiltro(String(valor))}>
          <TabsList variant="view">
            {FILTROS_MODULO.map((opcion) => {
              const cuantos =
                opcion.valor === 'todos' ? MODULOS.length : MODULOS.filter((modulo) => modulo.estado === opcion.valor).length
              return (
                <TabsTrigger key={opcion.valor} value={opcion.valor} className="flex-none">
                  {opcion.etiqueta}
                  <Badge variant="secondary" size="xs" radius="full">
                    {cuantos}
                  </Badge>
                </TabsTrigger>
              )
            })}
          </TabsList>
        </Tabs>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Módulo</TableHead>
                <TableHead>Qué hay</TableHead>
                <TableHead>Uso</TableHead>
                <TableHead>Renovación</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibles.map((modulo) => (
                <TableRow key={modulo.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <IconTile variant="soft" size="sm">
                        <HugeiconsIcon icon={modulo.icono} aria-hidden="true" />
                      </IconTile>
                      <div className="flex flex-col gap-1">
                        <Text as="span" size="sm" weight="medium">
                          {modulo.nombre}
                        </Text>
                        <Text as="span" variant="muted" size="xs">
                          Plan {modulo.plan}
                        </Text>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Text as="span" size="sm">
                      {modulo.contenido}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={modulo.uso} className="w-24" aria-label={`Uso de ${modulo.nombre}: ${modulo.uso} %`} />
                      <Text as="span" variant="muted" size="xs">
                        {modulo.uso} %
                      </Text>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Text as="span" variant="muted" size="sm">
                      {modulo.renovacion}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Badge variant={BADGE_DE_MODULO[modulo.estado].variante} size="sm">
                      {BADGE_DE_MODULO[modulo.estado].texto}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-end">
                    <BotonIcono aria-label={`Más acciones de ${modulo.nombre}`}>
                      <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
                    </BotonIcono>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </FramePanel>
    </Frame>
  )
}

// Hallazgo del recorrido: la navegación está ordenada por producto; el trabajo, por tarea.
function EmpiezaPorLaTarea() {
  return (
    <Frame>
      <FrameHeader className="[--frame-panel-header-gap:--spacing(1)]">
        <FrameTitle>Empieza por la tarea</FrameTitle>
        <FrameDescription>Cada atajo encadena las pantallas que ya existen. La etiqueta dice lo que cuesta hoy.</FrameDescription>
      </FrameHeader>
      <FramePanel>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {TAREAS.map((tarea) => (
            <Item key={tarea.id} variant="outline" className="h-full items-start">
              <ItemMedia>
                <IconTile variant="soft" size="sm">
                  <HugeiconsIcon icon={tarea.icono} aria-hidden="true" />
                </IconTile>
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{tarea.titulo}</ItemTitle>
                <ItemDescription>{tarea.descripcion}</ItemDescription>
                <Badge variant="secondary" size="xs">
                  Hoy: {tarea.pantallas} pantallas · {tarea.cambios} {plural(tarea.cambios, 'cambio', 'cambios')} de navegación
                </Badge>
              </ItemContent>
              <ItemActions>
                <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />
              </ItemActions>
            </Item>
          ))}
        </div>
      </FramePanel>
    </Frame>
  )
}

export function VistaInicio() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS_INICIO.map((kpi) => (
          <TarjetaIndicador key={kpi.id} {...kpi} />
        ))}
      </div>
      <EstadoDeLicencias />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Actividad />
        </div>
        <NecesitaAtencion />
      </div>
      <ModulosContratados />
      <EmpiezaPorLaTarea />
    </div>
  )
}
