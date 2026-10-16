import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, ArrowDown01Icon, ArrowUp01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Timeline,
  TimelineContent,
  TimelineDate,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from '@ubits/flux-ui'
import { KICKER, WS } from '../../../drawers/components/drawer-styles'
import { STATUS_LABEL, initials, type TimeOffRequest } from './data'

type Props = {
  request: TimeOffRequest
  position: string
  canPrev: boolean
  canNext: boolean
  onPrev: () => void
  onNext: () => void
  onRespond: (status: 'aprobada' | 'rechazada') => void
  onUndo: () => void
}

// Panel derecho del maestro-detalle: la solicitud elegida con su contexto y la respuesta.
export function RequestDetail({ request, position, canPrev, canNext, onPrev, onNext, onRespond, onUndo }: Props) {
  const pending = request.status === 'pendiente'
  const firstName = request.name.split(' ')[0]

  const facts = [
    { label: 'Tipo', value: request.type },
    { label: 'Fechas', value: request.dates },
    { label: 'Días hábiles', value: String(request.days) },
    { label: 'Saldo después', value: request.type === 'Vacaciones' ? `${Math.max(request.balance - request.days, 0)} días` : 'No descuenta' },
    { label: 'Reemplazo', value: request.backup },
    { label: 'Solicitada', value: request.requested },
  ]

  const journey = [
    { date: request.requested, title: 'Solicitud enviada', text: `${request.type} · ${request.days} ${request.days === 1 ? 'día' : 'días'}` },
    { date: 'Automático', title: 'Saldo verificado', text: `${firstName} tiene ${request.balance} días disponibles.` },
    {
      date: pending ? 'Ahora' : 'Hoy',
      title: pending ? 'Esperando tu respuesta' : request.status === 'aprobada' ? 'Aprobada por ti' : 'Rechazada por ti',
      text: pending ? `${firstName} recibe la respuesta por correo y en UBITS.` : `Se avisó a ${firstName} por correo.`,
    },
  ]

  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="flex items-center gap-4 border-b px-6 py-4">
        <Avatar size="lg">
          <AvatarFallback>{initials(request.name)}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-base font-semibold">{request.name}</span>
            {/* Rechazada en variante suave: la roja sólida lleva texto blanco y en modo oscuro no llega a 4.5:1. */}
            <Badge variant={pending ? 'outline' : request.status === 'aprobada' ? 'secondary' : 'destructive-light'} className="font-normal">
              {STATUS_LABEL[request.status]}
            </Badge>
          </div>
          <span className="truncate text-sm text-muted-foreground">
            {request.role} · {request.area}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className="mr-2 text-sm text-muted-foreground tabular-nums">{position}</span>
          <Button variant="outline" size="icon-sm" className={WS} disabled={!canPrev} onClick={onPrev} aria-label="Solicitud anterior">
            <HugeiconsIcon icon={ArrowUp01Icon} size={16} />
          </Button>
          <Button variant="outline" size="icon-sm" className={WS} disabled={!canNext} onClick={onNext} aria-label="Solicitud siguiente">
            <HugeiconsIcon icon={ArrowDown01Icon} size={16} />
          </Button>
        </div>
      </div>

      {/* Se desplaza por dentro: enfocable para poder leerla con las flechas del teclado. */}
      <div tabIndex={0} role="region" aria-label={`Solicitud de ${request.name}`} className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
        <div className="flex max-w-2xl flex-col gap-6">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border bg-border xl:grid-cols-3">
            {facts.map((fact) => (
              <div key={fact.label} className="flex flex-col gap-1 bg-card px-4 py-3">
                <span className="text-xs text-muted-foreground">{fact.label}</span>
                <span className="truncate text-sm font-medium">{fact.value}</span>
              </div>
            ))}
          </div>

          {request.overlap ? (
            <Alert variant="warning">
              <HugeiconsIcon icon={Alert02Icon} />
              <AlertTitle>Cruce con el equipo</AlertTitle>
              <AlertDescription>{request.overlap}</AlertDescription>
            </Alert>
          ) : null}

          {request.note ? (
            <div className="flex flex-col gap-2">
              <div role="heading" aria-level={2} className={KICKER}>
                Mensaje de {firstName}
              </div>
              <div className="rounded-xl bg-muted px-4 py-3 text-sm leading-relaxed">{request.note}</div>
            </div>
          ) : null}

          <div className="flex flex-col gap-3">
            <div role="heading" aria-level={2} className={KICKER}>
              Recorrido
            </div>
            <Timeline value={pending ? 2 : 3}>
              {journey.map((step, index) => (
                <TimelineItem key={step.title} step={index + 1}>
                  <TimelineHeader>
                    <TimelineSeparator />
                    <TimelineDate>{step.date}</TimelineDate>
                    <TimelineTitle>{step.title}</TimelineTitle>
                    <TimelineIndicator />
                  </TimelineHeader>
                  <TimelineContent>{step.text}</TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t bg-muted/40 px-6 py-3">
        {pending ? (
          <>
            <span className="mr-auto text-sm text-muted-foreground">Usa ↑ y ↓ para pasar de una solicitud a otra</span>
            <Button variant="outline" className={WS} onClick={() => onRespond('rechazada')}>
              Rechazar
            </Button>
            <Button className={WS} onClick={() => onRespond('aprobada')}>
              <HugeiconsIcon icon={Tick02Icon} size={16} />
              Aprobar
            </Button>
          </>
        ) : (
          <>
            <span className="mr-auto text-sm text-muted-foreground">
              {request.status === 'aprobada' ? 'Esta solicitud está aprobada.' : 'Esta solicitud fue rechazada.'}
            </span>
            <Button variant="ghost" className={WS} onClick={onUndo}>
              Volver a pendiente
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
