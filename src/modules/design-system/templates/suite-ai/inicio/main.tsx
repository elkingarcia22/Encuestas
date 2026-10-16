import { Fragment, useState } from 'react'
import { useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, Download01Icon } from '@hugeicons/core-free-icons'
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
  TrafficLight,
  toast,
} from '@ubits/flux-ui'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'

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
  VACANTES,
  iniciales,
  type Vacante,
} from '../../dashboard/components/data'
import { Dona, GraficoArea, Tendencia } from '../../dashboard/components/graficos'
import { Variacion } from '../../dashboard/components/piezas'
import { PERSONA, ruta } from '../components/data'
import { useSuite } from '../components/estado'

// Caso 00 del concepto: el Dashboard del Workspace. Mismos datos que el template Dashboard
// (se importan de ahí, sin tocarlo) con el orden y los bloques del prototipo de Nicolás.

function saludo() {
  const hora = new Date().getHours()
  if (hora < 12) return 'Buenos días'
  if (hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

const ETAPA: Record<Vacante['etapa'], 'secondary' | 'info-light' | 'primary-light' | 'warning-light' | 'success-light'> = {
  Nueva: 'secondary',
  'Evaluación CV': 'info-light',
  Entrevistas: 'primary-light',
  Antecedentes: 'warning-light',
  Oferta: 'success-light',
}

// En el concepto la dona va en azul (completadas) y naranja (en progreso).
const REPARTO = EVALUACIONES.reparto.map((parte, i) => (i === 0 ? { ...parte, color: 'var(--primary)' } : parte))

export function Component() {
  const suite = useSuite()
  const navigate = useNavigate()
  const [periodo, setPeriodo] = useState('30d')
  const hoy = PENDIENTES.filter((p) => p.urgencia === 'hoy')
  const semana = PENDIENTES.filter((p) => p.urgencia !== 'hoy')
  const [completadas, enProgreso, sinEmpezar] = EVALUACIONES.reparto
  const porcentaje = Math.round((completadas.respuestas / EVALUACIONES.total) * 100)

  // Qué hace cada pendiente del día, como en el prototipo.
  const resolver = (id: string) => {
    const acciones: Record<string, [string, string?]> = {
      calibracion: ['Calibración de Producto', ruta('chat/evaluaciones')],
      vacante: ['Vacante aprobada', ruta('vacantes')],
      recordatorio: ['Recordatorio enviado a 12 personas'],
      onboarding: ['Onboarding de Diego Ferrer', ruta('editor')],
      encuesta: ['Encuesta de clima programada'],
    }
    const [aviso, destino] = acciones[id] ?? ['Listo']
    toast.add({ title: aviso })
    if (destino) navigate(destino)
  }

  return (
    <div className="flex flex-1 flex-col gap-6 pt-2">
      {/* Encabezado de la página */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Heading as="h1" level={2}>
            Dashboard
          </Heading>
          <Text variant="muted">
            {saludo()}, {PERSONA.primerNombre}. Esto es lo que pasa hoy en tu empresa.
          </Text>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={periodo} onValueChange={(valor) => setPeriodo(String(valor ?? '30d'))}>
            <SelectTrigger className="w-44" aria-label="Periodo del dashboard">
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
          <Button variant="outline" onClick={() => toast.add({ title: 'Exportando el dashboard a Excel' })}>
            <HugeiconsIcon icon={Download01Icon} aria-hidden="true" />
            Exportar
          </Button>
          {/* El agente redacta el reporte: abre un chat nuevo con la petición escrita. */}
          <Button
            onClick={() => {
              suite.setBorrador('Prepárame el resumen quincenal de talento para dirección: prioridades, avance de iniciativas y hallazgos.')
              navigate(ruta('chat'))
              toast.add({ title: 'El agente redacta el reporte contigo' })
            }}
          >
            <HugeiconsIcon icon={Add01Icon} aria-hidden="true" />
            Nuevo reporte
          </Button>
        </div>
      </div>

      {/* Indicadores en una sola franja */}
      <Frame>
        <FramePanel className="divide-border grid gap-5 sm:grid-cols-2 xl:grid-cols-4 xl:gap-0 xl:divide-x">
          {INDICADORES.map((indicador) => (
            <div key={indicador.id} className="flex min-w-0 flex-col gap-2 xl:px-5 xl:first:ps-0 xl:last:pe-0">
              <Text as="span" variant="muted" size="sm">
                {indicador.titulo}
              </Text>
              <div className="flex items-end justify-between gap-3">
                <Text as="span" size="xl" weight="semibold">
                  {indicador.valor}
                </Text>
                <div className="h-9 w-20 shrink-0" aria-hidden="true">
                  <Tendencia datos={indicador.serie} color="var(--primary)" />
                </div>
              </div>
              <div className="flex min-w-0 items-center gap-1.5">
                <Variacion valor={indicador.variacion} sufijo={indicador.sufijo} />
                <Text as="span" variant="muted" size="xs" className="truncate">
                  {indicador.comparacion}
                </Text>
              </div>
            </div>
          ))}
        </FramePanel>
      </Frame>

      {/* Tu día: hoy a la izquierda, esta semana a la derecha */}
      <Frame>
        <FrameHeader className="flex flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <FrameTitle>Tu día</FrameTitle>
            <FrameDescription>
              {PENDIENTES.length} pendientes · {hoy.length} para hoy
            </FrameDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => toast.add({ title: 'Todas tus tareas' })}>
            Ver todo
          </Button>
        </FrameHeader>
        <FramePanel className="divide-border grid gap-6 md:grid-cols-2 md:gap-0 md:divide-x">
          <div className="flex min-w-0 flex-col gap-2 md:pe-6">
            <Text as="span" variant="muted" size="xs" weight="medium">
              Hoy
            </Text>
            <ItemGroup>
              {hoy.map((pendiente, indice) => (
                <Fragment key={pendiente.id}>
                  {indice > 0 ? <ItemSeparator /> : null}
                  <Item size="sm">
                    <ItemMedia>
                      <IconTile variant="soft" size="sm">
                        <HugeiconsIcon icon={pendiente.icono} aria-hidden="true" />
                      </IconTile>
                    </ItemMedia>
                    <ItemContent className="min-w-0">
                      <ItemTitle>{pendiente.titulo}</ItemTitle>
                      <ItemDescription>{pendiente.detalle}</ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <Button size="sm" onClick={() => resolver(pendiente.id)}>
                        {pendiente.accion}
                      </Button>
                    </ItemActions>
                  </Item>
                </Fragment>
              ))}
            </ItemGroup>
          </div>
          <div className="flex min-w-0 flex-col gap-2 md:ps-6">
            <Text as="span" variant="muted" size="xs" weight="medium">
              Esta semana
            </Text>
            <ItemGroup>
              {semana.map((pendiente, indice) => (
                <Fragment key={pendiente.id}>
                  {indice > 0 ? <ItemSeparator /> : null}
                  <Item size="xs">
                    <ItemMedia variant="icon">
                      <HugeiconsIcon icon={pendiente.icono} aria-hidden="true" />
                    </ItemMedia>
                    <ItemContent className="min-w-0">
                      <ItemTitle className="w-full truncate">{pendiente.titulo}</ItemTitle>
                    </ItemContent>
                    <ItemActions>
                      <Button variant="link" size="sm" onClick={() => resolver(pendiente.id)}>
                        {pendiente.accion}
                      </Button>
                    </ItemActions>
                  </Item>
                </Fragment>
              ))}
            </ItemGroup>
          </div>
        </FramePanel>
      </Frame>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* Formación */}
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
              <Badge variant="secondary" size="sm">
                Completaron
              </Badge>
            </div>
          </FrameHeader>
          <FramePanel className="flex flex-1 flex-col gap-4">
            <div className="flex flex-wrap gap-x-5 gap-y-3">
              {FORMACION_TOTALES.map((total, indice) => (
                <Fragment key={total.id}>
                  {indice > 0 ? <Separator orientation="vertical" className="hidden h-12 sm:block" /> : null}
                  <div className="flex flex-col gap-1">
                    <Text as="span" variant="muted" size="xs">
                      {total.etiqueta}
                    </Text>
                    <Text as="span" size="lg" weight="semibold">
                      {total.valor}
                    </Text>
                    <Variacion valor={total.variacion} sufijo={total.sufijo} />
                  </div>
                </Fragment>
              ))}
            </div>
            <GraficoArea
              datos={FORMACION_POR_MES}
              eje="mes"
              alto={240}
              series={[
                { clave: 'iniciaron', nombre: 'Iniciaron', color: 'var(--primary)' },
                { clave: 'completaron', nombre: 'Completaron', color: 'var(--foreground)' },
              ]}
            />
          </FramePanel>
        </Frame>

        {/* Programas activos */}
        <Frame className="h-full">
          <FrameHeader className="flex flex-row items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <FrameTitle>Programas activos</FrameTitle>
              <FrameDescription>Avance de cada plan de formación</FrameDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate(ruta('editor'))}>
              Ver todo
            </Button>
          </FrameHeader>
          <FramePanel className="flex flex-1 flex-col gap-3">
            {PROGRAMAS.map((programa, indice) => (
              <Fragment key={programa.id}>
                {indice > 0 ? <Separator /> : null}
                <div className="flex items-center gap-3">
                  <IconTile variant="soft" size="sm">
                    <HugeiconsIcon icon={programa.icono} aria-hidden="true" />
                  </IconTile>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    {/* Nombre y detalle son un par: van juntos a 4px, y la barra queda a 8px del bloque. */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <Text as="span" size="sm" weight="medium" className="truncate">
                          {programa.nombre}
                        </Text>
                        <Text as="span" size="sm" weight="medium">
                          {programa.avance}&nbsp;%
                        </Text>
                      </div>
                      <Text as="span" variant="muted" size="xs">
                        {programa.personas.toLocaleString('es-CO')} personas · cierra el {programa.cierre}
                      </Text>
                    </div>
                    <Progress value={programa.avance} aria-label={`Avance de ${programa.nombre}: ${programa.avance} %`} />
                  </div>
                </div>
              </Fragment>
            ))}
          </FramePanel>
        </Frame>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* Vacantes abiertas */}
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
            <div className="flex flex-wrap justify-end gap-2">
              <BotonIaSecundario
                size="sm"
                onClick={() => {
                  toast.add({ title: 'Priorizando candidatos' })
                  navigate(ruta('vacantes'))
                }}
              >
                Preguntar
              </BotonIaSecundario>
              <Button variant="outline" size="sm" onClick={() => navigate(ruta('vacantes'))}>
                Ver todas
              </Button>
            </div>
          </FrameHeader>
          <FramePanel className="flex-1">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Etapa y avance</TableHead>
                    <TableHead>Candidatos</TableHead>
                    <TableHead>
                      <span className="sr-only">Reclutador</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {VACANTES.map((vacante) => (
                    <TableRow key={vacante.id}>
                      <TableCell className="max-w-44">
                        <div className="flex min-w-0 flex-col gap-1">
                          <Text as="span" size="sm" weight="medium" className="truncate">
                            {vacante.cargo}
                          </Text>
                          <Text as="span" variant="muted" size="xs" className="truncate">
                            {vacante.area} · {vacante.diasAbierta} {vacante.diasAbierta === 1 ? 'día' : 'días'} abierta
                          </Text>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-1.5">
                          <Badge variant={ETAPA[vacante.etapa]} size="sm">
                            {vacante.etapa}
                          </Badge>
                          <div className="flex items-center gap-2">
                            <Progress value={(vacante.paso / 5) * 100} className="w-20" aria-label={`Etapa ${vacante.paso} de 5`} />
                            <Text as="span" variant="muted" size="xs">
                              {vacante.paso} de 5
                            </Text>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Text as="span" size="sm">
                            {vacante.candidatos}
                          </Text>
                          <Text as="span" variant="muted" size="xs">
                            {vacante.nuevos === 0 ? 'Sin nuevos' : `${vacante.nuevos} ${vacante.nuevos === 1 ? 'nuevo' : 'nuevos'}`}
                          </Text>
                        </div>
                      </TableCell>
                      <TableCell className="text-end">
                        <Avatar size="sm" aria-label={`Reclutador: ${vacante.reclutador}`}>
                          <AvatarFallback>{iniciales(vacante.reclutador)}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </FramePanel>
        </Frame>

        {/* Evaluaciones 360 */}
        <Frame className="h-full">
          <FrameHeader className="flex flex-row items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <FrameTitle>Evaluaciones 360</FrameTitle>
              <FrameDescription>El ciclo cierra el {EVALUACIONES.cierre}</FrameDescription>
            </div>
            <Badge variant="secondary" size="sm">
              {enProgreso.respuestas + sinEmpezar.respuestas} pendientes
            </Badge>
          </FrameHeader>
          <FramePanel className="flex flex-1 flex-col gap-3">
            <Dona datos={REPARTO} total={`${porcentaje} %`} alto={170} />
            <TrafficLight
              className="justify-center"
              data={{
                label: 'Estado de las evaluaciones',
                items: REPARTO.map((parte) => ({ label: parte.area, value: String(parte.respuestas), color: parte.color })),
              }}
            />
            <Separator />
            <Text as="span" variant="muted" size="xs" weight="medium">
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
                    <Button variant="link" size="xs" onClick={() => toast.add({ title: `Recordatorio enviado a ${persona.nombre}` })}>
                      Recordar
                    </Button>
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          </FramePanel>
          <FrameFooter>
            <Button variant="outline" size="sm" className="w-full" onClick={() => toast.add({ title: '14 personas sin empezar' })}>
              Ver las {sinEmpezar.respuestas} personas
            </Button>
          </FrameFooter>
        </Frame>
      </div>

      {/* Actividad reciente */}
      <Frame>
        <FrameHeader className="[--frame-panel-header-gap:--spacing(1)]">
          <div className="flex flex-col gap-1">
            <FrameTitle>Actividad reciente</FrameTitle>
            <FrameDescription>Lo último que pasó en tu equipo</FrameDescription>
          </div>
        </FrameHeader>
        <FramePanel>
          <ItemGroup className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {ACTIVIDAD.map((entrada) => (
              <Item key={entrada.id} size="sm">
                <ItemMedia>
                  <Avatar size="sm">
                    <AvatarFallback>{iniciales(entrada.quien)}</AvatarFallback>
                  </Avatar>
                </ItemMedia>
                <ItemContent className="min-w-0">
                  <Text as="span" variant="muted" size="xs">
                    {entrada.cuando}
                  </Text>
                  <ItemTitle>{entrada.quien}</ItemTitle>
                  <ItemDescription>{entrada.que}</ItemDescription>
                </ItemContent>
              </Item>
            ))}
          </ItemGroup>
        </FramePanel>
      </Frame>
    </div>
  )
}

Component.displayName = 'DesignSystemTemplateSuiteAiInicio'
