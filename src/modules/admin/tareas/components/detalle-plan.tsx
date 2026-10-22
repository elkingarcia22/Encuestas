import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, Delete02Icon, Link01Icon, MoreHorizontalIcon, Notification01Icon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Heading,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
  Progress,
  ProgressLabel,
  ProgressValue,
  Text,
} from '@ubits/flux-ui'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { Badge } from '@/shared/components/Badge'
import { BotonIcono } from '@/shared/components/BotonIcono'

import { Persona } from '@/modules/design-system/data-grid/casos/seguimiento'
import { fechaCorta, fechaSinAnio } from '@/modules/design-system/patrones/formato'
import { BADGE_PLAN, BADGE_TAREA, textoVencimiento, type Plan, type Tarea } from './datos'
import { CambiarFecha } from './piezas'

// Detalle del plan elegido: responsable, fechas, avance y sus tareas. Cada tarea abre su detalle
// en la pestaña Tareas. Un plan vencido se reabre cambiando la fecha de fin.

export type AccionesPlan = {
  onCambiarFecha: (plan: Plan, fecha: Date) => void
  onRecordatorio: (plan: Plan) => void
  onCopiarEnlace: (plan: Plan) => void
  onEliminar: (plan: Plan) => void
  onVerTarea: (tarea: Tarea) => void
}

export function DetallePlan({ plan, tareas, acciones }: { plan: Plan | undefined; tareas: Tarea[]; acciones: AccionesPlan }) {
  if (!plan) {
    return (
      <Frame>
        <FramePanel>
          {/* Vacío con su ilustración glass (13-oct). */}
          <PrimeraVez icono="glass-paper" titulo="Elige un plan" descripcion="Su avance y sus tareas aparecen aquí." />
        </FramePanel>
      </Frame>
    )
  }

  const finalizadas = tareas.filter((t) => t.estado === 'Finalizada').length
  const vencidas = tareas.filter((t) => t.estado === 'Vencida').length
  const avance = tareas.length ? Math.round((finalizadas / tareas.length) * 100) : 0
  const vencido = plan.estado === 'Vencido'
  const finalizado = plan.estado === 'Finalizado'

  return (
    <Frame stacked>
      <FrameHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={BADGE_PLAN[plan.estado]} size="sm">
              {plan.estado}
            </Badge>
            {vencidas ? (
              <Badge variant="destructive-outline" size="sm">
                {vencidas} {vencidas === 1 ? 'tarea vencida' : 'tareas vencidas'}
              </Badge>
            ) : null}
          </div>
          <div className="flex flex-col gap-1">
            <FrameTitle>
              <Heading as="h2" level={5}>
                {plan.nombre}
              </Heading>
            </FrameTitle>
            <FrameDescription>{plan.descripcion}</FrameDescription>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={<BotonIcono aria-label="Más acciones del plan" />}>
            <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => acciones.onRecordatorio(plan)} disabled={finalizado}>
                <HugeiconsIcon icon={Notification01Icon} aria-hidden="true" />
                Enviar recordatorio
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => acciones.onCopiarEnlace(plan)}>
                <HugeiconsIcon icon={Link01Icon} aria-hidden="true" />
                Copiar enlace
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => acciones.onEliminar(plan)}>
              <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
              Eliminar plan
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </FrameHeader>

      <FramePanel className="flex flex-col gap-3">
        {vencido ? (
          <Alert variant="warning">
            <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />
            <AlertTitle>Terminó el {fechaCorta(plan.fin)} con tareas abiertas</AlertTitle>
            <AlertDescription>
              <p>Para reabrirlo, cambia la fecha de fin.</p>
            </AlertDescription>
          </Alert>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {vencido ? <CambiarFecha variante="default" etiqueta="Cambiar fecha de fin" onElegir={(fecha) => acciones.onCambiarFecha(plan, fecha)} /> : null}
          {finalizado ? null : (
            <Button size="sm" variant="outline" onClick={() => acciones.onRecordatorio(plan)}>
              <HugeiconsIcon icon={Notification01Icon} aria-hidden="true" />
              Recordatorio
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => acciones.onCopiarEnlace(plan)}>
            <HugeiconsIcon icon={Link01Icon} aria-hidden="true" />
            Copiar enlace
          </Button>
        </div>
      </FramePanel>

      <FramePanel className="grid grid-cols-2 gap-4">
        <div className="col-span-2 flex flex-col gap-1">
          <Text as="span" variant="muted" size="xs">
            Responsable
          </Text>
          <Persona nombre={plan.responsable} detalle={plan.area} />
        </div>
        <div className="flex flex-col gap-1">
          <Text as="span" variant="muted" size="xs">
            Fechas
          </Text>
          <Text as="span" size="sm">
            {fechaSinAnio(plan.inicio)} – {fechaCorta(plan.fin)}
          </Text>
        </div>
        <div className="flex flex-col gap-1">
          <Text as="span" variant="muted" size="xs">
            Tiempo
          </Text>
          <Text as="span" size="sm" variant={vencido ? 'destructive' : 'default'}>
            {textoVencimiento(plan.estado, plan.fin)}
          </Text>
        </div>
      </FramePanel>

      <FramePanel className="flex flex-col gap-3">
        <Heading as="h3" level={6}>
          Tareas del plan
        </Heading>
        {tareas.length ? (
          <>
            <Progress value={avance}>
              <ProgressLabel>Avance</ProgressLabel>
              <ProgressValue className="ms-auto">{() => `${finalizadas} de ${tareas.length} finalizadas`}</ProgressValue>
            </Progress>
            <ItemGroup className="gap-1">
              {tareas.map((t) => (
                <Item key={t.id} size="xs" variant="outline">
                  <ItemContent>
                    <ItemTitle>{t.titulo}</ItemTitle>
                    <ItemDescription>
                      {t.asignado} · {fechaCorta(t.finaliza)}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions className="flex-col items-end">
                    <Badge variant={BADGE_TAREA[t.estado]} size="xs">
                      {t.estado}
                    </Badge>
                    <Button variant="link" size="xs" className="h-auto p-0" onClick={() => acciones.onVerTarea(t)}>
                      Ver tarea
                    </Button>
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          </>
        ) : (
          <Text as="p" variant="muted" size="sm">
            Este plan todavía no tiene tareas de seguimiento.
          </Text>
        )}
      </FramePanel>
    </Frame>
  )
}
