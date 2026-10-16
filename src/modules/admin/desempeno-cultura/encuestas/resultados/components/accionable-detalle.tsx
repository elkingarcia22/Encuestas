import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle02Icon, Clock01Icon, Task01Icon, UserGroupIcon } from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
  FramePanel,
  IconTile,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  Progress,
  RadioGroup,
  RadioGroupItem,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
} from '@ubits/flux-ui'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { TARJETA_OPCION } from '@/shared/components/estilos-propios'
import { TextoCompleto } from '@/shared/components/TextoCompleto'
import { FilasSeparadas, MarcoLista } from '../../components/marco-lista'
import { TEXTO_POR_TONO } from '../../components/tonos'
import {
  CADENCE_BY_ID,
  LAUNCH_BY_ID,
  LAUNCH_OPTIONS,
  MODULE_BY_ID,
  REMINDER_CADENCES,
  actionableTone,
  defaultActivation,
  describeScore,
  type Actionable,
  type ActivationConfig,
  type LaunchTiming,
  type ReminderCadence,
} from '../../modelo/actionables/actionableCatalog'
import { PROGRESS_STATUS_LABEL, buildProgress, type ProgressStatus } from '../../modelo/actionables/actionableProgress'
import { numero, varianteImpacto } from './escala'

// El detalle de un accionable: qué señal lo dispara, a quién alcanza, qué queda montado en el otro módulo, cuándo sale
// y cada cuánto se recuerda. Activarlo crea una tarea para quien debe actuar, que solo queda en check cuando el
// entregable está completo. Ya activo, suma «Cómo va».
// Tiene la forma de los drawers del módulo (Crear con plantilla, banco de preguntas): cada sección es un marco con su
// título y su descripción, y dentro una tarjeta con las filas separadas por una línea.

const VARIANTE_ESTADO: Record<ProgressStatus, 'success-light' | 'info-light' | 'outline'> = {
  done: 'success-light',
  doing: 'info-light',
  todo: 'outline',
}

const iniciales = (nombre: string) =>
  nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0] ?? '')
    .join('')
    .toUpperCase()

/** Un título de marco con su recuento, como «Organizacional 4» en Crear con plantilla. */
function TituloConCuenta({ titulo, cuenta }: { titulo: string; cuenta?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      {titulo}
      {cuenta !== undefined ? (
        <Badge variant="secondary" size="xs" radius="full" className="tabular-nums">
          {numero(cuenta)}
        </Badge>
      ) : null}
    </span>
  )
}

/** Una opción de un grupo de radios como las del asistente de comparar (tipos de encuesta): tarjetas apiladas en una
 *  columna, con título, «Sugerido» si toca, la explicación y el radio a la derecha. Sin icono. */
function OpcionRadio({ id, valor, titulo, ayuda, sugerido }: { id: string; valor: string; titulo: string; ayuda: string; sugerido: boolean }) {
  return (
    <FieldLabel htmlFor={id} className={TARJETA_OPCION}>
      <Field orientation="horizontal" className="items-center!">
        <RadioGroupItem value={valor} id={id} />
        <FieldContent>
          <FieldTitle>
            {titulo}
            {sugerido ? (
              <Badge variant="info-outline" size="xs">
                Sugerido
              </Badge>
            ) : null}
          </FieldTitle>
          <FieldDescription>{ayuda}</FieldDescription>
        </FieldContent>
      </Field>
    </FieldLabel>
  )
}

type Props = {
  accionable: Actionable | null
  abierto: boolean
  onAbiertoChange: (abierto: boolean) => void
  activacion: ActivationConfig | null
  onActivar: (config: ActivationConfig) => void
  onDesactivar: () => void
}

export function AccionableDetalle({ accionable, ...resto }: Props) {
  if (!accionable) return null
  // Un accionable nuevo arranca con su propia configuración sugerida.
  return <Detalle key={`${accionable.id}-${resto.activacion ? 'activo' : 'sugerido'}`} accionable={accionable} {...resto} />
}

function Detalle({ accionable, abierto, onAbiertoChange, activacion, onActivar, onDesactivar }: Props & { accionable: Actionable }) {
  const [config, setConfig] = useState<ActivationConfig>(() => activacion ?? defaultActivation(accionable))
  const modulo = MODULE_BY_ID[accionable.module]
  const tono = actionableTone(accionable)
  const activo = activacion !== null
  const avance = activo ? buildProgress(accionable, activacion) : null
  const miembros = accionable.audience.members.slice(0, 6)

  return (
    <DrawerShell
      open={abierto}
      onOpenChange={onAbiertoChange}
      size="lg"
      kicker={`${modulo.label} · ${accionable.feature}`}
      title={accionable.title}
      badge={
        <div className="flex items-center gap-1.5">
          <Badge variant={varianteImpacto(accionable.score)}>
            {describeScore(accionable.score)} · {accionable.score}
          </Badge>
          {activo ? <Badge variant="success-light">Activo · {LAUNCH_BY_ID[activacion.launch].label}</Badge> : null}
        </div>
      }
      media={
        <IconTile variant="soft" size="sm" className={TEXTO_POR_TONO[tono]}>
          {accionable.ai ? <IconoIA /> : <HugeiconsIcon icon={accionable.icon} aria-hidden="true" />}
        </IconTile>
      }
      footer={
        activo ? (
          <>
            <Button variant="outline" onClick={onDesactivar}>
              Desactivar
            </Button>
            <Button onClick={() => onActivar(config)}>Guardar cambios</Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={() => onAbiertoChange(false)}>
              Cancelar
            </Button>
            <Button onClick={() => onActivar(config)}>Activar accionable</Button>
          </>
        )
      }
    >
      <Tabs defaultValue={activo ? 'avance' : 'senal'} className="flex flex-col gap-5">
        <TabsList variant="line" className="w-full justify-start">
          <TabsTrigger value="senal" className="flex-none">
            Por qué
          </TabsTrigger>
          <TabsTrigger value="accion" className="flex-none">
            Qué hace
          </TabsTrigger>
          <TabsTrigger value="cuando" className="flex-none">
            Cuándo
          </TabsTrigger>
          {avance ? (
            <TabsTrigger value="avance" className="flex-none">
              Cómo va
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="senal" className="flex flex-col gap-6">
          <MarcoLista titulo={<TituloConCuenta titulo="Qué lo dispara en esta medición" cuenta={accionable.evidence.length} />} descripcion={accionable.trigger}>
            <FramePanel className="py-1!">
              <FilasSeparadas>
                {accionable.evidence.map((evidencia) => (
                  <Item key={evidencia.label} size="sm">
                    <ItemContent className="min-w-0">
                      <TextoCompleto texto={evidencia.label}>
                        <ItemTitle className="truncate">{evidencia.label}</ItemTitle>
                      </TextoCompleto>
                    </ItemContent>
                    <ItemActions>
                      <Badge variant="outline" size="sm" className="tabular-nums">
                        {evidencia.value}
                      </Badge>
                    </ItemActions>
                  </Item>
                ))}
              </FilasSeparadas>
            </FramePanel>
          </MarcoLista>
          {accionable.topics.length > 0 ? (
            <MarcoLista titulo={<TituloConCuenta titulo="Temas que trabaja" cuenta={accionable.topics.length} />} descripcion="Las secciones de la encuesta que esta acción busca mover.">
              <FramePanel>
                <div className="flex flex-wrap gap-1.5">
                  {accionable.topics.map((tema) => (
                    <Badge key={tema} variant="secondary">
                      {tema}
                    </Badge>
                  ))}
                </div>
              </FramePanel>
            </MarcoLista>
          ) : null}
          <MarcoLista titulo="Por qué vale la pena">
            <FramePanel>
              <Text as="p" size="sm" className="text-pretty">
                {accionable.rationale}
              </Text>
            </FramePanel>
          </MarcoLista>
        </TabsContent>

        <TabsContent value="accion" className="flex flex-col gap-6">
          <MarcoLista titulo={<TituloConCuenta titulo="A quién alcanza" cuenta={accionable.audience.people} />} descripcion={accionable.audience.source}>
            <FramePanel className="py-1!">
              <FilasSeparadas>
                <Item size="sm">
                  <ItemMedia variant="icon">
                    <HugeiconsIcon icon={UserGroupIcon} aria-hidden="true" />
                  </ItemMedia>
                  <ItemContent className="min-w-0">
                    <TextoCompleto texto={accionable.audience.label}>
                      <ItemTitle className="truncate">{accionable.audience.label}</ItemTitle>
                    </TextoCompleto>
                  </ItemContent>
                  <ItemActions>
                    <Badge variant="outline" size="sm" className="tabular-nums">
                      {numero(accionable.audience.people)} {accionable.audience.people === 1 ? 'persona' : 'personas'}
                    </Badge>
                  </ItemActions>
                </Item>
                {miembros.map((miembro) => (
                  <Item key={miembro.id} size="sm">
                    <ItemMedia>
                      <Avatar size="sm">
                        <AvatarFallback>{iniciales(miembro.name)}</AvatarFallback>
                      </Avatar>
                    </ItemMedia>
                    <ItemContent className="min-w-0">
                      <TextoCompleto texto={miembro.name}>
                        <ItemTitle className="truncate">{miembro.name}</ItemTitle>
                      </TextoCompleto>
                      <ItemDescription>{miembro.meta}</ItemDescription>
                    </ItemContent>
                  </Item>
                ))}
              </FilasSeparadas>
              {accionable.audience.members.length > miembros.length ? (
                <Text as="p" size="xs" variant="muted" className="py-2">
                  Y {accionable.audience.members.length - miembros.length} {accionable.audience.memberNoun} más.
                </Text>
              ) : null}
            </FramePanel>
          </MarcoLista>
          <MarcoLista titulo={`Qué queda en ${modulo.label}`} descripcion={accionable.outcome}>
            <FramePanel className="py-1!">
              <Item size="sm">
                <ItemMedia variant="icon">
                  <HugeiconsIcon icon={accionable.deliverable.icon} aria-hidden="true" />
                </ItemMedia>
                <ItemContent className="min-w-0">
                  <TextoCompleto texto={accionable.deliverable.title}>
                    <ItemTitle className="truncate">{accionable.deliverable.title}</ItemTitle>
                  </TextoCompleto>
                  <ItemDescription className="line-clamp-none">{accionable.deliverable.items.map((item) => item.label).join(' · ')}</ItemDescription>
                </ItemContent>
              </Item>
            </FramePanel>
          </MarcoLista>
          <MarcoLista titulo="La tarea que se crea" descripcion={accionable.task.completion}>
            <FramePanel className="py-1!">
              <Item size="sm">
                <ItemMedia variant="icon">
                  <HugeiconsIcon icon={Task01Icon} aria-hidden="true" />
                </ItemMedia>
                <ItemContent className="min-w-0">
                  <TextoCompleto texto={accionable.task.title}>
                    <ItemTitle className="truncate">{accionable.task.title}</ItemTitle>
                  </TextoCompleto>
                  <ItemDescription>Asignada a {accionable.task.assignee}</ItemDescription>
                </ItemContent>
              </Item>
            </FramePanel>
          </MarcoLista>
        </TabsContent>

        <TabsContent value="cuando" className="flex flex-col gap-6">
          <MarcoLista titulo="Cuándo se lanza" descripcion="Desde cuándo empiezan a crearse las tareas.">
            <FramePanel>
              <RadioGroup value={config.launch} onValueChange={(valor) => setConfig({ ...config, launch: valor as LaunchTiming })} className="grid gap-2" aria-label="Cuándo se lanza">
                {LAUNCH_OPTIONS.map((opcion) => (
                  <OpcionRadio key={opcion.id} id={`lanzamiento-${opcion.id}`} valor={opcion.id} titulo={opcion.label} ayuda={opcion.hint} sugerido={opcion.id === accionable.suggestedLaunch} />
                ))}
              </RadioGroup>
            </FramePanel>
          </MarcoLista>
          <MarcoLista titulo="Antes de ejecutar">
            <FramePanel>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel htmlFor="accionable-revision">Pedir confirmación antes de ejecutar</FieldLabel>
                  <FieldDescription>Antes de crear las tareas te llega un aviso para revisar a quién alcanza. Sin él, sale solo en la fecha elegida.</FieldDescription>
                </FieldContent>
                <Switch id="accionable-revision" checked={config.requiresReview} onCheckedChange={(valor) => setConfig({ ...config, requiresReview: valor })} />
              </Field>
            </FramePanel>
          </MarcoLista>
          <MarcoLista titulo="Cada cuánto se recuerda" descripcion="Hasta que la tarea quede en check, el recordatorio sigue llegando.">
            <FramePanel>
              <RadioGroup value={config.cadence} onValueChange={(valor) => setConfig({ ...config, cadence: valor as ReminderCadence })} className="grid gap-2" aria-label="Cada cuánto se recuerda">
                {REMINDER_CADENCES.map((opcion) => (
                  <OpcionRadio key={opcion.id} id={`cadencia-${opcion.id}`} valor={opcion.id} titulo={opcion.label} ayuda={opcion.hint} sugerido={opcion.id === accionable.suggestedCadence} />
                ))}
              </RadioGroup>
            </FramePanel>
          </MarcoLista>
          <Text as="p" size="xs" variant="muted" className="inline-flex items-center gap-1.5">
            <HugeiconsIcon icon={Clock01Icon} size={14} aria-hidden="true" />
            Sale {LAUNCH_BY_ID[config.launch].label.toLowerCase()} y se recuerda {CADENCE_BY_ID[config.cadence].label.toLowerCase()} hasta que la tarea quede en check.
          </Text>
        </TabsContent>

        {avance ? (
          <TabsContent value="avance" className="flex flex-col gap-6">
            <MarcoLista titulo="Cómo va" descripcion={avance.launchedLine}>
              <FramePanel>
                <div className="flex flex-col gap-3">
                  <Text as="p" size="sm" weight="semibold">
                    {avance.headline}
                  </Text>
                  <Progress value={avance.percent} aria-label="Avance del accionable" />
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="success-light">
                      {avance.done} {PROGRESS_STATUS_LABEL.done.toLowerCase()}
                    </Badge>
                    <Badge variant="warning-light">
                      {avance.doing} {PROGRESS_STATUS_LABEL.doing.toLowerCase()}
                    </Badge>
                    <Badge variant="outline">
                      {avance.todo} {PROGRESS_STATUS_LABEL.todo.toLowerCase()}
                    </Badge>
                  </div>
                </div>
              </FramePanel>
            </MarcoLista>
            <MarcoLista titulo={<TituloConCuenta titulo={`Estado por ${avance.rowsNoun}`} cuenta={avance.rows.length} />} descripcion={`El detalle vive en ${modulo.label}: desde ahí se abre cada entregable.`}>
              <FramePanel className="py-1!">
                <FilasSeparadas>
                  {avance.rows.map((fila) => (
                    <Item key={fila.id} size="sm">
                      <ItemMedia variant="icon">
                        <HugeiconsIcon icon={fila.status === 'done' ? CheckmarkCircle02Icon : Task01Icon} aria-hidden="true" />
                      </ItemMedia>
                      <ItemContent className="min-w-0">
                        <ItemTitle>{fila.label}</ItemTitle>
                        {fila.meta ? <ItemDescription>{fila.meta}</ItemDescription> : null}
                      </ItemContent>
                      <ItemActions>
                        <Badge variant={VARIANTE_ESTADO[fila.status]} size="sm">
                          {PROGRESS_STATUS_LABEL[fila.status]}
                        </Badge>
                      </ItemActions>
                    </Item>
                  ))}
                </FilasSeparadas>
              </FramePanel>
            </MarcoLista>
          </TabsContent>
        ) : null}
      </Tabs>
    </DrawerShell>
  )
}
