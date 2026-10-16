import { Fragment, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, Download01Icon, MoreHorizontalIcon } from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Heading,
  IconTile,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
  TrafficLight,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { plural } from '@/modules/design-system/patrones/formato'

import {
  ACTIVIDAD,
  EVALUACIONES,
  FORMACION_POR_MES,
  FORMACION_TOTALES,
  INDICADORES,
  PENDIENTES,
  PERIODOS,
  PROGRAMAS,
  SIN_EMPEZAR,
  USUARIO,
  VACANTES,
  iniciales,
  type Vacante,
} from './data'
import { Dona, GraficoArea } from './graficos'
import { TarjetaIndicador, Variacion } from './piezas'

// Estructura tomada de los bloques Solutions de ReUI (analytics, CRM e inventory): indicadores
// con minigráfico y, debajo, marcos con cabecera y panel para cada tema del día.

function saludo() {
  const hora = new Date().getHours()
  if (hora < 12) return 'Buenos días'
  if (hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

/* ------------------------------------------------------- cabecera de página */

function EncabezadoDePagina() {
  const [periodo, setPeriodo] = useState('30d')

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <Heading as="h1" level={3}>
          Dashboard
        </Heading>
        <Text variant="muted" size="sm">
          {saludo()}, {USUARIO.nombre.split(' ')[0]}. Esto es lo que pasa hoy en tu empresa.
        </Text>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={periodo} onValueChange={(valor) => setPeriodo(String(valor ?? '30d'))}>
          <SelectTrigger size="sm" className="w-40" aria-label="Periodo del dashboard">
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
        <Button variant="outline" size="sm">
          <HugeiconsIcon icon={Download01Icon} aria-hidden="true" />
          Exportar
        </Button>
        <Button size="sm">
          <HugeiconsIcon icon={Add01Icon} aria-hidden="true" />
          Nuevo reporte
        </Button>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- tu día */

function TuDia() {
  return (
    <Frame className="h-full">
      <FrameHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <FrameTitle>Tu día</FrameTitle>
            <Badge variant="secondary" size="sm" radius="full">
              {PENDIENTES.length}
            </Badge>
          </div>
          <FrameDescription>Lo que te toca hoy y esta semana</FrameDescription>
        </div>
        <Button variant="outline" size="xs">
          Ver todo
        </Button>
      </FrameHeader>
      <FramePanel className="flex-1">
        <ItemGroup>
          {PENDIENTES.map((pendiente, indice) => (
            <Fragment key={pendiente.id}>
              {indice > 0 ? <ItemSeparator /> : null}
              <Item size="sm">
                <ItemMedia>
                  <IconTile variant="soft" size="sm">
                    <HugeiconsIcon icon={pendiente.icono} aria-hidden="true" />
                  </IconTile>
                </ItemMedia>
                <ItemContent className="min-w-0">
                  <ItemTitle>
                    {pendiente.titulo}
                    {pendiente.urgencia === 'hoy' ? (
                      <Badge variant="destructive-outline" size="xs">
                        Hoy
                      </Badge>
                    ) : null}
                    {pendiente.urgencia === 'semana' ? (
                      <Badge variant="warning-light" size="xs">
                        Esta semana
                      </Badge>
                    ) : null}
                  </ItemTitle>
                  <ItemDescription>{pendiente.detalle}</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button variant="outline" size="sm">
                    {pendiente.accion}
                  </Button>
                </ItemActions>
              </Item>
            </Fragment>
          ))}
        </ItemGroup>
      </FramePanel>
    </Frame>
  )
}

/* ------------------------------------------------------- evaluaciones 360 */

function Evaluaciones() {
  const [completadas, enProgreso, sinEmpezar] = EVALUACIONES.reparto
  const porcentaje = Math.round((completadas.respuestas / EVALUACIONES.total) * 100)

  return (
    <Frame className="h-full">
      <FrameHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <FrameTitle>Evaluaciones 360</FrameTitle>
          <FrameDescription>El ciclo cierra el {EVALUACIONES.cierre}</FrameDescription>
        </div>
        <Badge variant="warning-light" size="sm">
          {enProgreso.respuestas + sinEmpezar.respuestas} pendientes
        </Badge>
      </FrameHeader>
      <FramePanel className="flex flex-1 flex-col gap-3">
        <Dona datos={EVALUACIONES.reparto} total={`${porcentaje} %`} alto={170} />
        <TrafficLight
          className="justify-center"
          data={{
            label: 'Estado de las evaluaciones',
            items: EVALUACIONES.reparto.map((parte) => ({ label: parte.area, value: String(parte.respuestas), color: parte.color })),
          }}
        />
        <Separator />
        <div className="flex flex-col gap-1">
          <Text as="span" size="sm" weight="medium">
            Aún no la empiezan
          </Text>
          <ItemGroup>
            {SIN_EMPEZAR.map((persona) => (
              <Item key={persona.id} size="xs">
                <ItemMedia>
                  <Avatar size="sm">
                    <AvatarFallback>{iniciales(persona.nombre)}</AvatarFallback>
                  </Avatar>
                </ItemMedia>
                <ItemContent className="min-w-0">
                  <ItemTitle className="truncate">{persona.nombre}</ItemTitle>
                  <ItemDescription className="truncate">
                    {persona.area} · {persona.evaluadores} evaluadores
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button variant="ghost" size="xs">
                    Recordar
                  </Button>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        </div>
      </FramePanel>
      <FrameFooter>
        <Button variant="outline" size="sm" className="w-full">
          Ver las {sinEmpezar.respuestas} personas
        </Button>
      </FrameFooter>
    </Frame>
  )
}

/* -------------------------------------------------------------- formación */

function Formacion() {
  return (
    <Frame className="h-full">
      <FrameHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <FrameTitle>Formación</FrameTitle>
          <FrameDescription>Personas que iniciaron y completaron un curso, mes a mes</FrameDescription>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <Badge variant="primary-light" size="sm">
            Iniciaron
          </Badge>
          <Badge variant="success-light" size="sm">
            Completaron
          </Badge>
        </div>
      </FrameHeader>
      <FramePanel className="flex flex-1 flex-col gap-4">
        <div className="flex flex-wrap gap-x-5 gap-y-3">
          {FORMACION_TOTALES.map((total, indice) => (
            <Fragment key={total.id}>
              {indice > 0 ? <Separator orientation="vertical" className="hidden h-10 sm:block" /> : null}
              <div className="flex flex-col gap-1">
                <Text as="span" variant="muted" size="xs">
                  {total.etiqueta}
                </Text>
                <div className="flex items-center gap-1.5">
                  <Text as="span" size="lg" weight="semibold">
                    {total.valor}
                  </Text>
                  <Variacion valor={total.variacion} sufijo={total.sufijo} />
                </div>
              </div>
            </Fragment>
          ))}
        </div>
        <GraficoArea
          datos={FORMACION_POR_MES}
          eje="mes"
          alto={260}
          series={[
            { clave: 'iniciaron', nombre: 'Iniciaron', color: 'var(--primary)' },
            { clave: 'completaron', nombre: 'Completaron', color: 'var(--success)' },
          ]}
        />
      </FramePanel>
    </Frame>
  )
}

function Programas() {
  return (
    <Frame className="h-full">
      <FrameHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <FrameTitle>Programas activos</FrameTitle>
          <FrameDescription>Avance de cada plan de formación</FrameDescription>
        </div>
        <Button variant="outline" size="xs">
          Ver todo
        </Button>
      </FrameHeader>
      <FramePanel className="flex flex-1 flex-col gap-3">
        {PROGRAMAS.map((programa, indice) => (
          <Fragment key={programa.id}>
            {indice > 0 ? <Separator /> : null}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <IconTile variant="soft" size="sm">
                  <HugeiconsIcon icon={programa.icono} aria-hidden="true" />
                </IconTile>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Text as="span" size="sm" weight="medium" className="truncate">
                    {programa.nombre}
                  </Text>
                  <Text as="span" variant="muted" size="xs">
                    {programa.personas.toLocaleString('es-CO')} personas · cierra el {programa.cierre}
                  </Text>
                </div>
                <Text as="span" size="sm" weight="medium">
                  {programa.avance} %
                </Text>
              </div>
              <Progress value={programa.avance} aria-label={`Avance de ${programa.nombre}: ${programa.avance} %`} />
            </div>
          </Fragment>
        ))}
      </FramePanel>
    </Frame>
  )
}

/* --------------------------------------------------------------- vacantes */

const ETAPA: Record<Vacante['etapa'], 'secondary' | 'info-light' | 'primary-light' | 'warning-light' | 'success-light'> = {
  Nueva: 'secondary',
  'Evaluación CV': 'info-light',
  Entrevistas: 'primary-light',
  Antecedentes: 'warning-light',
  Oferta: 'success-light',
}

const PASOS = 5

function Vacantes() {
  return (
    <Frame className="h-full">
      <FrameHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <FrameTitle>Vacantes abiertas</FrameTitle>
            <Badge variant="secondary" size="sm" radius="full">
              {VACANTES.length}
            </Badge>
          </div>
          <FrameDescription>En qué etapa va cada proceso y quién lo lleva</FrameDescription>
        </div>
        <Button variant="outline" size="sm">
          Ver todas
        </Button>
      </FrameHeader>
      <FramePanel className="flex-1">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cargo</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Candidatos</TableHead>
                <TableHead>Avance</TableHead>
                <TableHead>Reclutador</TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {VACANTES.map((vacante) => (
                <TableRow key={vacante.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Text as="span" size="sm" weight="medium">
                        {vacante.cargo}
                      </Text>
                      <Text as="span" variant="muted" size="xs">
                        {vacante.area} · {vacante.diasAbierta} {plural(vacante.diasAbierta, 'día', 'días')} abierta
                      </Text>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={ETAPA[vacante.etapa]} size="sm">
                      {vacante.etapa}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Text as="span" size="sm">
                        {vacante.candidatos}
                      </Text>
                      <Text as="span" variant="muted" size="xs">
                        {vacante.nuevos === 0 ? 'Sin nuevos' : `${vacante.nuevos} ${plural(vacante.nuevos, 'nuevo', 'nuevos')}`}
                      </Text>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={Math.round((vacante.paso / PASOS) * 100)}
                        className="w-16"
                        aria-label={`Etapa ${vacante.paso} de ${PASOS}`}
                      />
                      <Text as="span" variant="muted" size="xs">
                        {vacante.paso} de {PASOS}
                      </Text>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar size="sm">
                        <AvatarFallback>{iniciales(vacante.reclutador)}</AvatarFallback>
                      </Avatar>
                      <Text as="span" size="sm">
                        {vacante.reclutador}
                      </Text>
                    </div>
                  </TableCell>
                  <TableCell className="text-end">
                    <BotonIcono aria-label={`Más acciones de ${vacante.cargo}`}>
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

/* -------------------------------------------------------------- actividad */

function ActividadReciente() {
  return (
    <Frame className="h-full">
      <FrameHeader className="[--frame-panel-header-gap:--spacing(1)]">
        <FrameTitle>Actividad reciente</FrameTitle>
        <FrameDescription>Lo último que pasó en tu equipo</FrameDescription>
      </FrameHeader>
      <FramePanel className="flex-1">
        <Timeline orientation="vertical" value={ACTIVIDAD.length}>
          {ACTIVIDAD.map((entrada, indice) => (
            <TimelineItem key={entrada.id} step={indice + 1}>
              <TimelineHeader>
                <TimelineSeparator />
                <TimelineDate>{entrada.cuando}</TimelineDate>
                <TimelineTitle className="flex items-center gap-2">
                  <Avatar size="sm">
                    <AvatarFallback>{iniciales(entrada.quien)}</AvatarFallback>
                  </Avatar>
                  {entrada.quien}
                </TimelineTitle>
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
      </FramePanel>
    </Frame>
  )
}

export function DashboardView() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <EncabezadoDePagina />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {INDICADORES.map((indicador) => (
          <TarjetaIndicador key={indicador.id} {...indicador} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TuDia />
        </div>
        <Evaluaciones />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Formacion />
        </div>
        <Programas />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Vacantes />
        </div>
        <ActividadReciente />
      </div>
    </div>
  )
}
