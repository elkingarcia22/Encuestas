import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Tick02Icon } from '@hugeicons/core-free-icons'
import { Button, Checkbox, Label, Textarea, ToggleGroup, ToggleGroupItem, cn } from '@ubits/flux-ui'
import styles from './message.module.css'
import { CloseButton } from '@/shared/components/CloseButton'

const FEEDBACK_REASONS = [
  'Datos incorrectos',
  'Información desactualizada',
  'No era lo que pedí',
  'Respuesta incompleta',
  'Tono o formato',
  'Contenido sensible o inapropiado',
  'Otro',
] as const

export type FeedbackReason = (typeof FEEDBACK_REASONS)[number]

type MessageFeedbackProps = {
  preset?: FeedbackReason
  onCancel: () => void
  onSubmit: () => void
}

// Comentario al marcar «No útil»: motivos en pastillas (uno o varios), detalle opcional y permiso
// para que el equipo revise la conversación. Positivo en un toque; negativo con estructura.
export function MessageFeedback({ preset, onCancel, onSubmit }: MessageFeedbackProps) {
  const [reasons, setReasons] = useState<string[]>(preset ? [preset] : [])
  const [comment, setComment] = useState('')
  const [share, setShare] = useState(false)
  const canSend = reasons.length > 0 || comment.trim().length > 0

  return (
    <div
      role="group"
      aria-label="Comentario sobre la respuesta"
      className={cn('mt-3 rounded-2xl border bg-card p-4 text-card-foreground shadow-xs', styles.rise)}
    >
      <div className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-sm font-medium">¿Qué podemos mejorar?</span>
          <span className="text-[13px] text-muted-foreground">Elige una o varias opciones. Nos ayuda a mejorar las respuestas del agente.</span>
        </div>
        <CloseButton label="Cerrar comentario" onClick={onCancel} />
      </div>

      <ToggleGroup
        multiple
        value={reasons}
        onValueChange={(value) => setReasons(value as string[])}
        variant="outline"
        size="sm"
        spacing={2}
        className="mt-3 flex-wrap justify-start"
      >
        {FEEDBACK_REASONS.map((reason) => (
          <ToggleGroupItem key={reason} value={reason} className="font-normal">
            {reasons.includes(reason) ? <HugeiconsIcon icon={Tick02Icon} className="size-3.5" /> : null}
            {reason}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <Textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        rows={2}
        placeholder="¿Qué esperabas? (opcional)"
        aria-label="Qué esperabas de la respuesta"
        className="mt-3 min-h-16 resize-none"
      />

      <Label className="mt-3 flex items-center gap-2 text-sm font-normal">
        <Checkbox checked={share} onCheckedChange={(checked) => setShare(Boolean(checked))} />
        Incluir esta conversación para que el equipo la revise
      </Label>
      <div className="mt-1 pl-6 text-[13px] text-muted-foreground">
        Los datos personales de colaboradores se anonimizan antes de revisarse.
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Omitir
        </Button>
        <Button size="sm" disabled={!canSend} onClick={onSubmit}>
          Enviar comentario
        </Button>
      </div>
    </div>
  )
}
