import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon, Cancel01Icon, DragDropVerticalIcon, InformationCircleIcon, PencilEdit02Icon } from '@hugeicons/core-free-icons'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Frame,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
  MessageScrollerItem,
  Sortable,
  SortableItem,
  SortableItemHandle,
  Spinner,
  Text,
} from '@ubits/flux-ui'
import { UserBubble } from '@/modules/design-system/agente-contextual/components/agent-kit'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { BotonIcono } from '@/shared/components/BotonIcono'

import { Compositor } from '../components/compositor'
import { AUDIENCIAS_PLAN, FECHAS_PLAN, INDICADORES_EVALUACIONES } from '../components/data'
import { useSuite } from '../components/estado'
import { MensajeAgente } from '../components/piezas'
import { MensajesHilo, VistaChat } from '../components/vista-chat'

// Caso 02 del concepto: «Evaluaciones vencidas en Ventas». Indicadores con su fuente, y una
// propuesta de plan de formación que se edita ahí mismo (nombre, orden, audiencia y fechas) antes
// de asignarla con confirmación.

function Selector({ etiqueta, valor, opciones, onValor }: { etiqueta: string; valor: string; opciones: string[]; onValor: (valor: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Text as="span" variant="muted" size="sm">
        {etiqueta}
      </Text>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="secondary" size="sm" aria-label={`${etiqueta}: ${valor}`} />}>
          {valor}
          <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{etiqueta}</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={valor} onValueChange={(nuevo) => onValor(String(nuevo))}>
              {opciones.map((opcion) => (
                <DropdownMenuRadioItem key={opcion} value={opcion} closeOnClick>
                  {opcion}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export function Component() {
  const suite = useSuite()
  const [borrador, setBorrador] = useState('')
  const { plan } = suite
  const personas = Number.parseInt(plan.audiencia, 10) || 0
  const bloqueado = plan.estado !== 'borrador'
  const estado = plan.estado === 'asignado' ? `Asignado · ${personas} personas` : plan.estado === 'asignando' ? 'Asignando…' : 'Borrador, no asignado'
  const etiquetaAsignar = plan.estado === 'asignado' ? 'Ver el proceso' : plan.estado === 'asignando' ? 'Asignando…' : 'Asignar plan'

  const compositor = (
    <Compositor
      valor={borrador}
      onValor={setBorrador}
      onEnviar={(texto) => suite.preguntar('evaluaciones', texto)}
      placeholder="Pide un cambio o continúa con otra tarea"
      aviso={false}
      contexto={suite.contexto ? { etiqueta: `Plan · ${plan.titulo.split(' ').slice(0, 2).join(' ')}`, onQuitar: suite.quitarContexto } : undefined}
    />
  )

  return (
    <VistaChat compositor={compositor} seguir={(suite.chats.evaluaciones?.length ?? 0) * 2 + (suite.pensando === 'evaluaciones' ? 1 : 0)}>
      <MessageScrollerItem>
        <Frame>
          <FramePanel className="divide-border grid grid-cols-2 gap-5 sm:grid-cols-4 sm:gap-0 sm:divide-x">
            {INDICADORES_EVALUACIONES.map((indicador) => (
              <div key={indicador.etiqueta} className="flex flex-col gap-1 sm:px-5 sm:first:ps-0 sm:last:pe-0">
                <Text as="span" size="xl" weight="semibold">
                  {indicador.valor}
                </Text>
                <Text as="span" variant="muted" size="sm">
                  {indicador.etiqueta}
                </Text>
              </div>
            ))}
          </FramePanel>
          <FrameFooter className="flex flex-row flex-wrap items-center justify-between gap-3">
            <Text as="span" variant="muted" size="xs" className="max-w-sm">
              Fuente: Evaluaciones 360 · Periodo 1–10 sep · Actualizado hace 12 min
            </Text>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={suite.verParticipantes}>
                Ver 24 participantes
              </Button>
              <Button size="sm" disabled={suite.recordatorio} onClick={suite.enviarRecordatorio}>
                {suite.recordatorio ? 'Recordatorio enviado' : 'Enviar recordatorio'}
              </Button>
            </div>
          </FrameFooter>
        </Frame>
      </MessageScrollerItem>

      <MessageScrollerItem className="flex flex-wrap gap-2">
        {['Corregir los 5 sin líder', 'Comparar con Operaciones'].map((sugerencia) => (
          <Button key={sugerencia} variant="outline" size="sm" onClick={() => suite.preguntar('evaluaciones', sugerencia)}>
            {sugerencia}
          </Button>
        ))}
      </MessageScrollerItem>

      <MessageScrollerItem>
        <UserBubble>Prepárame un plan corto de feedback para los líderes de Ventas.</UserBubble>
      </MessageScrollerItem>
      <MessageScrollerItem>
        <MensajeAgente>
          <Frame>
            <FrameHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
              <FrameTitle className="flex items-center gap-2">
                <IconoIA />
                Propuesta editable · Plan de formación
              </FrameTitle>
              <Text as="span" variant={plan.estado === 'asignado' ? 'default' : 'muted'} size="xs" weight={plan.estado === 'asignado' ? 'medium' : 'normal'}>
                {estado}
              </Text>
            </FrameHeader>
            <FramePanel className="flex flex-col gap-3">
              <InputGroup>
                <InputGroupInput
                  aria-label="Nombre del plan"
                  value={plan.titulo}
                  disabled={bloqueado}
                  onChange={(e) => suite.cambiarPlan({ titulo: e.target.value })}
                />
                <InputGroupAddon align="inline-end">
                  <HugeiconsIcon icon={PencilEdit02Icon} aria-hidden="true" />
                </InputGroupAddon>
              </InputGroup>
              {/* Los contenidos se reordenan arrastrando el asidero y se quitan con la X. */}
              <Sortable value={plan.filas} onValueChange={suite.ordenarFilas} getItemValue={(fila) => fila.id} className="flex flex-col gap-2">
                {plan.filas.map((fila) => (
                  <SortableItem key={fila.id} value={fila.id} disabled={bloqueado}>
                    <Item variant="outline" size="sm">
                      <SortableItemHandle aria-label={`Mover ${fila.titulo}`}>
                        <HugeiconsIcon icon={DragDropVerticalIcon} aria-hidden="true" className="text-muted-foreground size-4" />
                      </SortableItemHandle>
                      <ItemContent className="min-w-0">
                        <ItemTitle className="w-full truncate">{fila.titulo}</ItemTitle>
                      </ItemContent>
                      <ItemActions>
                        <Text as="span" variant="muted" size="xs" className="whitespace-nowrap">
                          {fila.detalle}
                        </Text>
                        <BotonIcono size="icon-xs" aria-label={`Quitar ${fila.titulo}`} disabled={bloqueado} onClick={() => suite.quitarFila(fila.id)}>
                          <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" />
                        </BotonIcono>
                      </ItemActions>
                    </Item>
                  </SortableItem>
                ))}
              </Sortable>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <Selector etiqueta="Audiencia" valor={plan.audiencia} opciones={AUDIENCIAS_PLAN} onValor={(audiencia) => suite.cambiarPlan({ audiencia })} />
                <Selector etiqueta="Fechas" valor={plan.fechas} opciones={FECHAS_PLAN} onValor={(fechas) => suite.cambiarPlan({ fechas })} />
              </div>
            </FramePanel>
            <FrameFooter className="flex flex-row flex-wrap items-center gap-3">
              <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" className="text-muted-foreground size-4 shrink-0" />
              <Text as="span" variant="muted" size="sm" className="min-w-0 flex-1">
                Asignar notifica por correo a {personas} personas. Revisa la audiencia antes de continuar.
              </Text>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={suite.revisarAudiencia}>
                  Revisar audiencia
                </Button>
                <Button size="sm" disabled={plan.estado === 'asignando' || (!personas && plan.estado === 'borrador')} onClick={suite.asignarPlan}>
                  {plan.estado === 'asignando' ? <Spinner /> : null}
                  {etiquetaAsignar}
                </Button>
              </div>
            </FrameFooter>
          </Frame>
        </MensajeAgente>
      </MessageScrollerItem>

      <MensajesHilo mensajes={suite.chats.evaluaciones ?? []} pensando={suite.pensando === 'evaluaciones'} />
    </VistaChat>
  )
}

Component.displayName = 'DesignSystemTemplateSuiteAiPropuesta'
