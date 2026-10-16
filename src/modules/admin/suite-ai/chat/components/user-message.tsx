import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Copy01Icon, PencilEdit01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { Bubble, BubbleContent, Button, Message, MessageContent, MessageFooter, Textarea, cn } from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { notify } from '@/shared/components/notify'
import { MessageTip } from './message-tip'
import styles from './message.module.css'

type UserMessageProps = {
  text: string
  // Si llega, el mensaje se puede editar: el agente vuelve a responder desde ese punto.
  onEdit?: (text: string) => void
  // Nombre del mensaje en la anatomía de los configuradores. Solo agrega el atributo; no cambia cómo se ve.
  region?: string
}

// Mensaje de la persona: burbuja a la derecha; al pasar el cursor, copiar y editar.
export function UserMessage({ text, onEdit, region }: UserMessageProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(text)
  const [copied, setCopied] = useState(false)
  const changed = draft.trim().length > 0 && draft.trim() !== text
  // Al cancelar la edición el campo desaparece: el foco vuelve a «Editar mensaje».
  const editRef = useRef<HTMLButtonElement>(null)
  const backToEdit = useRef(false)

  useEffect(() => {
    if (editing || !backToEdit.current) return
    backToEdit.current = false
    editRef.current?.focus()
  }, [editing])

  const cancel = () => {
    backToEdit.current = true
    setEditing(false)
    setDraft(text)
  }

  const submit = () => {
    if (!changed) return
    setEditing(false)
    onEdit?.(draft.trim())
  }

  const onKey = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
    if (event.key === 'Escape') cancel()
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      notify('No se pudo copiar el mensaje')
    }
  }

  if (editing) {
    return (
      <Message data-region={region} className="justify-end">
        <MessageContent className={cn('w-full max-w-xl items-stretch', styles.fade)}>
          <Textarea
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onKey}
            rows={2}
            aria-label="Editar mensaje"
            className="min-h-16 resize-none text-base"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-[13px] text-muted-foreground">Al enviar, el agente vuelve a responder desde aquí.</span>
            <div className="flex shrink-0 gap-2">
              <Button variant="ghost" size="sm" onClick={cancel}>
                Cancelar
              </Button>
              <Button size="sm" disabled={!changed} onClick={submit}>
                Enviar
              </Button>
            </div>
          </div>
        </MessageContent>
      </Message>
    )
  }

  return (
    <Message data-region={region} className="group/user justify-end">
      <MessageContent className="max-w-xl items-end">
        <Bubble variant="muted">
          <BubbleContent className="text-base leading-relaxed">{text}</BubbleContent>
        </Bubble>
        <MessageFooter className="-mr-1 flex items-center gap-0.5 opacity-0 transition-opacity duration-200 group-focus-within/user:opacity-100 group-hover/user:opacity-100">
          <MessageTip
            label={copied ? 'Copiado' : 'Copiar'}
            render={
              <BotonIcono
                aria-label="Copiar mensaje"
                className="size-8! text-muted-foreground hover:text-foreground"
                onClick={copy}
              />
            }
          >
            <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} className="size-4" />
          </MessageTip>
          <span role="status" className="sr-only">
            {copied ? 'Mensaje copiado' : ''}
          </span>
          {onEdit ? (
            <MessageTip
              label="Editar"
              render={
                <BotonIcono
                  ref={editRef}
                  aria-label="Editar mensaje"
                  className="size-8! text-muted-foreground hover:text-foreground"
                  onClick={() => setEditing(true)}
                />
              }
            >
              <HugeiconsIcon icon={PencilEdit01Icon} className="size-4" />
            </MessageTip>
          ) : null}
        </MessageFooter>
      </MessageContent>
    </Message>
  )
}
