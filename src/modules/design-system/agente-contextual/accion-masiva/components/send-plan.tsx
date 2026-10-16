import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { AlertCircleIcon, Mail01Icon, Notification03Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { Alert, AlertDescription, AlertTitle, Button, Progress, Spinner, Textarea, Toggle, cn } from '@ubits/flux-ui'
import { AgentCard, AgentNote, UndoRow } from '../../components/agent-kit'
import { PILL, PILL_XS } from '../../components/agent-styles'
import styles from '../../components/agent.module.css'
import { impactText, type Channels, type Person } from './data'

const RowLabel = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span className={cn('pt-0.5 text-[13px] text-muted-foreground', className)}>{children}</span>
)

type PlanCardProps = {
  count: number
  nudgeTick: number
  channels: Channels
  onChannel: (key: keyof Channels, value: boolean) => void
  message: string
  onMessage: (value: string) => void
  editing: boolean
  onEditing: (value: boolean) => void
  invalid: Person[]
  fallback: boolean
  onFallback: () => void
  previewName: string
}

export function PlanCard({
  count,
  nudgeTick,
  channels,
  onChannel,
  message,
  onMessage,
  editing,
  onEditing,
  invalid,
  fallback,
  onFallback,
  previewName,
}: PlanCardProps) {
  const toggleClass = 'h-7! gap-1.5! rounded-full! px-3! text-[13px]! font-normal!'
  const missingEmail = channels.email && !channels.app && invalid.length > 0

  return (
    <>
      <AgentCard title="Plan de envío" className="mt-4">
        <div className="grid grid-cols-[92px_minmax(0,1fr)] items-start gap-x-3 gap-y-3.5">
          <RowLabel>Destinatarios</RowLabel>
          <div key={nudgeTick} className={cn('text-sm text-foreground/80', nudgeTick > 0 && styles.nudge)}>
            <span className="font-medium text-foreground tabular-nums">{count}</span> {count === 1 ? 'colaborador' : 'colaboradores'} con la
            evaluación vencida
          </div>

          <RowLabel className="pt-1">Canal</RowLabel>
          <div role="group" aria-label="Canal" className="flex flex-wrap gap-1.5">
            <Toggle variant="outline" size="sm" pressed={channels.email} onPressedChange={(value) => onChannel('email', value)} className={toggleClass}>
              <HugeiconsIcon icon={Mail01Icon} size={14} strokeWidth={1.5} aria-hidden="true" />
              Correo
            </Toggle>
            <Toggle variant="outline" size="sm" pressed={channels.app} onPressedChange={(value) => onChannel('app', value)} className={toggleClass}>
              <HugeiconsIcon icon={Notification03Icon} size={14} strokeWidth={1.5} aria-hidden="true" />
              Notificación en la app
            </Toggle>
          </div>

          <RowLabel className="pt-1">Mensaje</RowLabel>
          <div className="min-w-0">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">{editing ? 'Usa {nombre} para personalizar' : `Vista previa · ${previewName}`}</span>
              <Button variant="ghost" className={`${PILL_XS} h-6! px-2!`} onClick={() => onEditing(!editing)}>
                {editing ? 'Listo' : 'Editar'}
              </Button>
            </div>
            {editing ? (
              <Textarea value={message} onChange={(event) => onMessage(event.target.value)} rows={5} className="resize-none" aria-label="Mensaje del recordatorio" />
            ) : (
              <div className="rounded-xl bg-muted px-3.5 py-3 text-sm leading-normal text-foreground/80">
                {message.replaceAll('{nombre}', previewName.split(' ')[0])}
              </div>
            )}
          </div>

          <RowLabel>Impacto</RowLabel>
          <div className="text-sm leading-normal text-foreground/80">{impactText(count, invalid.length, channels, fallback)}</div>
        </div>
      </AgentCard>

      {missingEmail && !fallback ? (
        <Alert variant="warning" className="mt-3">
          <HugeiconsIcon icon={AlertCircleIcon} aria-hidden="true" />
          <AlertTitle>{invalid.length} sin correo válido</AlertTitle>
          <AlertDescription>
            <span>{invalid.map((person) => person.name).join(', ')} no recibirían el correo.</span>
            <Button variant="outline" className={`${PILL_XS} mt-2`} onClick={onFallback}>
              Enviarles solo notificación
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
      {missingEmail && fallback ? (
        <AgentNote className={cn('mt-3', styles.msgIn)}>
          Los {invalid.length} sin correo válido recibirán solo la notificación en la app.
        </AgentNote>
      ) : null}
    </>
  )
}

export function SendingCard({ steps, step }: { steps: string[]; step: number }) {
  return (
    <AgentCard title="Enviando" className={cn('mt-4', styles.propIn)}>
      <Progress value={Math.round((step / steps.length) * 100)} aria-label="Progreso del envío" className="**:data-[slot=progress-track]:h-1!" />
      <div className="mt-3.5 flex flex-col gap-2.5">
        {steps.map((label, index) => (
          <div key={label} className="flex items-center gap-2.5 text-sm">
            {/* El estado de cada paso se ve por el icono: para el lector va en texto. */}
            {index < step ? (
              <span aria-hidden="true" className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <HugeiconsIcon icon={Tick02Icon} size={12} strokeWidth={2} />
              </span>
            ) : index === step ? (
              <Spinner aria-hidden="true" className="size-4.5 shrink-0" />
            ) : (
              <span aria-hidden="true" className="size-4.5 shrink-0 rounded-full border" />
            )}
            <span className={index <= step ? 'text-foreground/80' : 'text-muted-foreground'}>
              {label}
              <span className="sr-only">{index < step ? ' · hecho' : index === step ? ' · en curso' : ' · pendiente'}</span>
            </span>
          </div>
        ))}
      </div>
    </AgentCard>
  )
}

export function SentBlock({
  reached,
  countdown,
  onUndo,
  onNew,
}: {
  reached: number
  countdown: number
  onUndo: () => void
  onNew: () => void
}) {
  return (
    <div className={cn('mt-4 flex flex-col gap-3', styles.msgIn)}>
      <AgentNote>Enviado a {reached} personas. Te aviso cuando completen la evaluación.</AgentNote>
      {countdown > 0 ? (
        <UndoRow onUndo={onUndo}>
          Recordatorio enviado · <span className="tabular-nums">{countdown} s</span> para deshacer
        </UndoRow>
      ) : (
        <AgentNote>Ya no se puede deshacer. Queda en el historial de cada persona.</AgentNote>
      )}
      <div>
        <Button variant="outline" className={PILL} onClick={onNew}>
          Preparar otro envío
        </Button>
      </div>
    </div>
  )
}
