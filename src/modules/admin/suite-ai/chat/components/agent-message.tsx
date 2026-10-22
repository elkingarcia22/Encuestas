import { useEffect, useRef, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Copy01Icon,
  Flag02Icon,
  MoreHorizontalIcon,
  PauseIcon,
  RefreshIcon,
  Share08Icon,
  StopIcon,
  TaskAdd01Icon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  Tick02Icon,
  VolumeHighIcon,
} from '@hugeicons/core-free-icons'
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, HoverCard, HoverCardContent, HoverCardTrigger, IconTile, Message, MessageContent, MessageFooter, Toggle, cn } from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { AiThinking } from '@/shared/components/AiThinking'
import { Orb } from '@/shared/components/Orb'
import { notify } from '@/shared/components/notify'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { detailsFor, type ReplyDetails } from '../../shared/reply-details'
import { MessageFeedback, type FeedbackReason } from './message-feedback'
import { MessageTip } from './message-tip'
import styles from './message.module.css'

type Vote = 'up' | 'down'

type AgentMessageProps = {
  text: string
  // Recién llegada: se escribe palabra por palabra.
  stream?: boolean
  // Última respuesta de la conversación: acciones siempre visibles y sugerencias para seguir.
  latest?: boolean
  onFollowup?: (text: string) => void
  onProgress?: () => void
  onStreamEnd?: () => void
  // Fuentes, sugerencias y versiones propias (p. ej. el agente contextual del editor). Sin esto se deducen del texto.
  details?: ReplyDetails
  // Algo que acompaña la respuesta, como la propuesta para un campo. Aparece cuando termina de escribirse.
  children?: ReactNode
  // Fila de acciones (copiar, útil, regenerar…). Por defecto va; el configurador del agente la puede apagar.
  actions?: boolean
  // Nombres de las piezas en la anatomía de los configuradores. Solo agrega atributos; no cambia cómo se ve.
  regions?: Partial<Record<'message' | 'sources' | 'actions' | 'followups', string>>
  // Una respuesta armada con piezas (listas, tablas, botones) en vez de texto: el agente contextual de la vacante. Va
  // en lugar del texto y sin escritura progresiva; copiar y leer en voz alta toman lo que se ve. `text` queda como
  // respaldo para copiar.
  body?: ReactNode
  // «Regenerar» propio: la respuesta se vuelve a pedir con los datos de ahora (sin `alternates`).
  onRegenerate?: () => void
  // Lo que acompaña la respuesta usa todo el ancho de la conversación (un tablero que arma la IA en «Habla con tus
  // datos»); la frase se queda en su ancho de lectura.
  wide?: boolean
  // Detener desde fuera (el botón de enviar convertido en «Detener»): cada vez que cambia, la escritura se corta donde va.
  // Con él, la respuesta no lleva su propio «Detener» debajo.
  stopSignal?: number
}

const ACTION = 'size-8! min-w-8! px-0! text-muted-foreground hover:text-foreground'

// Las acciones de la respuesta se muestran cuando no se está escribiendo ni generando otra versión.
const showActionsNow = (streaming: boolean, regenerating: boolean) => !streaming && !regenerating

// Respuesta del agente con todo lo que se espera de un asistente: escritura progresiva que se puede
// detener, fuentes del dato, copiar, útil / no útil (con motivos), regenerar con versiones «‹ 2/3 ›»,
// leer en voz alta y un menú con compartir, crear tarea y reportar.
export function AgentMessage({
  text,
  stream = false,
  latest = false,
  onFollowup,
  onProgress,
  onStreamEnd,
  details: customDetails,
  children,
  actions = true,
  regions,
  body,
  onRegenerate,
  wide = false,
  stopSignal,
}: AgentMessageProps) {
  const bodyRef = useRef<HTMLDivElement>(null)
  // Lo que dice la respuesta, para copiarla o leerla: con `body`, lo que se ve.
  const leido = () => (body !== undefined ? (bodyRef.current?.innerText.trim() ?? text) : current)
  const details = customDetails ?? detailsFor(text)
  const [versions, setVersions] = useState([text])
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(stream && body === undefined ? 0 : Number.POSITIVE_INFINITY)
  const [stopped, setStopped] = useState<Record<number, number>>({})
  const [regenerating, setRegenerating] = useState(false)
  const [votes, setVotes] = useState<Record<number, Vote>>({})
  const [feedbackFor, setFeedbackFor] = useState<number | null>(null)
  const [preset, setPreset] = useState<FeedbackReason | undefined>()
  const [sent, setSent] = useState<Record<number, boolean>>({})
  const [copied, setCopied] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  // Versiones que se escribieron en pantalla (la primera si llegó nueva y las regeneradas): son las que se anuncian.
  const [streamed, setStreamed] = useState<Record<number, boolean>>(stream ? { 0: true } : {})
  // Última respuesta que ya se anunció y se retiró del aviso.
  const [silenced, setSilenced] = useState<string | null>(null)
  // Regenerar y Detener desaparecen al usarse: al volver las acciones, el foco regresa a la fila en vez de perderse.
  const refocus = useRef<'regenerate' | 'actions' | null>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  const regenerateRef = useRef<HTMLButtonElement>(null)
  const downRef = useRef<HTMLButtonElement>(null)
  const progress = useRef(onProgress)
  const streamEnd = useRef(onStreamEnd)
  const ended = useRef(!stream)

  const current = versions[index]
  const words = current.split(' ')
  const limit = stopped[index] ?? words.length
  const shown = Math.min(visible, limit)
  const streaming = !regenerating && shown < limit
  const vote = votes[index]

  useEffect(() => {
    progress.current = onProgress
    streamEnd.current = onStreamEnd
  })

  // Escritura progresiva: dos palabras cada 40 ms, siguiendo el final del chat.
  useEffect(() => {
    if (regenerating || visible >= limit) return
    const id = window.setTimeout(() => {
      setVisible((v) => v + 2)
      progress.current?.()
    }, 40)
    return () => window.clearTimeout(id)
  }, [visible, limit, regenerating])

  useEffect(() => {
    if (!streaming && !ended.current) {
      ended.current = true
      streamEnd.current?.()
    }
  }, [streaming])

  // «Detener» desde fuera: solo cuenta un cambio después de montarse (el valor con el que llegó no detiene nada). Se
  // ajusta al dibujar, no en un efecto, para no pintar una palabra de más.
  const [stopSeen, setStopSeen] = useState(stopSignal)
  if (stopSignal !== stopSeen) {
    setStopSeen(stopSignal)
    if (streaming) setStopped((all) => ({ ...all, [index]: shown }))
  }

  // Lector de pantalla: la respuesta se anuncia completa cuando termina de escribirse (no palabra por palabra) y el
  // aviso se vacía después para que al recorrer el chat no se lea dos veces.
  const finished = Boolean(streamed[index]) && !streaming && !regenerating
  const spoken = words.slice(0, shown).join(' ')
  const announce = regenerating ? 'Generando otra versión' : finished && spoken !== silenced ? spoken : ''
  useEffect(() => {
    if (!finished) return
    const id = window.setTimeout(() => setSilenced(spoken), 4000)
    return () => window.clearTimeout(id)
  }, [finished, spoken])

  useEffect(() => {
    if (!showActionsNow(streaming, regenerating) || !refocus.current) return
    const target = refocus.current === 'regenerate' ? regenerateRef.current : footerRef.current?.querySelector('button')
    refocus.current = null
    target?.focus()
  }, [streaming, regenerating])

  // Si el mensaje desaparece mientras se lee en voz alta, se corta la lectura.
  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(leido())
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      notify('No se pudo copiar la respuesta', undefined, 'error')
    }
  }

  const toggleVote = (next: Vote, pressed: boolean) => {
    setVotes((all) => {
      const copyOf = { ...all }
      if (pressed) copyOf[index] = next
      else delete copyOf[index]
      return copyOf
    })
    if (next === 'up') {
      setFeedbackFor(null)
      if (pressed) notify('Gracias. Marcaste la respuesta como útil', undefined, 'success')
    } else {
      setPreset(undefined)
      setFeedbackFor(pressed && !sent[index] ? index : null)
    }
  }

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel()
    setSpeaking(false)
  }

  const speak = () => {
    const synth = window.speechSynthesis
    if (!synth) {
      notify('Tu navegador no puede leer en voz alta', undefined, 'error')
      return
    }
    if (speaking) {
      stopSpeaking()
      return
    }
    const utterance = new SpeechSynthesisUtterance(leido())
    utterance.lang = 'es-CO'
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    synth.cancel()
    synth.speak(utterance)
    setSpeaking(true)
  }

  const regenerate = () => {
    stopSpeaking()
    setFeedbackFor(null)
    if (onRegenerate) {
      onRegenerate()
      return
    }
    setRegenerating(true)
    refocus.current = 'regenerate'
    window.setTimeout(() => {
      const alternate = details.alternates[(versions.length - 1) % details.alternates.length]
      setVersions((all) => [...all, alternate])
      setStreamed((all) => ({ ...all, [versions.length]: true }))
      setIndex(versions.length)
      setVisible(0)
      setRegenerating(false)
    }, 1100)
  }

  const goTo = (next: number) => {
    stopSpeaking()
    setFeedbackFor(null)
    setIndex(next)
    setVisible(Number.POSITIVE_INFINITY)
  }

  const report = () => {
    setVotes((all) => ({ ...all, [index]: 'down' }))
    setSent((all) => ({ ...all, [index]: false }))
    setPreset('Contenido sensible o inapropiado')
    setFeedbackFor(index)
  }

  const showActions = showActionsNow(streaming, regenerating)
  const pinned = latest || Boolean(vote) || feedbackFor !== null || speaking || versions.length > 1

  return (
    <Message data-region={regions?.message} className="group/agent gap-3">
      <Orb className="mt-0.5 size-6 shrink-0" />
      <MessageContent className={cn('min-w-0 flex-1', !wide && 'max-w-2xl')}>
        {body !== undefined ? (
          <div ref={bodyRef}>{body}</div>
        ) : regenerating ? (
          <AiThinking orb={false} size="md" label="Generando otra versión…" />
        ) : (
          <div className={cn('text-base leading-relaxed text-pretty', wide && 'max-w-2xl')} aria-busy={streaming}>
            {words.slice(0, shown).join(' ')}
            {streaming ? <span aria-hidden="true" className={styles.caret} /> : null}
          </div>
        )}

        {showActions && limit < words.length ? (
          <div className="mt-1 text-[13px] text-muted-foreground">Respuesta detenida</div>
        ) : null}

        <span role="status" className="sr-only">
          {announce}
        </span>

        {streaming && stopSignal === undefined ? (
          <div className="mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refocus.current = 'actions'
                setStopped((all) => ({ ...all, [index]: shown }))
              }}
            >
              <HugeiconsIcon icon={StopIcon} className="size-3.5" />
              Detener
            </Button>
          </div>
        ) : null}

        {/* Lo que acompaña la respuesta espera a que termine de escribirse la primera vez; al regenerar se queda. */}
        {children && !(versions.length === 1 && streaming) ? children : null}

        {showActions && details.sources.length ? (
          <div data-region={regions?.sources} className={cn('mt-3 flex flex-wrap items-center gap-1.5', styles.fade)}>
            <span className="mr-0.5 text-[13px] text-muted-foreground">Fuentes</span>
            {details.sources.map((source) => (
              <HoverCard key={source.label}>
                {/* Fuentes en 13px y con el texto en gris oscuro: a 12px y gris claro costaba leerlas. */}
                <HoverCardTrigger render={<Button variant="outline" size="sm" className="h-8! gap-1.5 font-normal text-foreground/80" />}>
                  <HugeiconsIcon icon={source.icon} className="size-3.5" />
                  <span className="text-[13px]">{source.label}</span>
                </HoverCardTrigger>
                <HoverCardContent side="top" align="start" className="w-72">
                  <div className="flex items-start gap-3">
                    <IconTile variant="solid" className="size-8! rounded-lg! bg-muted! text-foreground!">
                      <HugeiconsIcon icon={source.icon} className="size-4" />
                    </IconTile>
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="text-sm font-medium">{source.label}</span>
                      <span className="text-[13px] text-muted-foreground">{source.detail}</span>
                    </div>
                  </div>
                  <div className="mt-3 border-t pt-2.5 text-[13px] text-muted-foreground">
                    El agente solo usa datos dentro de tus permisos.
                  </div>
                </HoverCardContent>
              </HoverCard>
            ))}
          </div>
        ) : null}

        {showActions && actions ? (
          <MessageFooter
            ref={footerRef}
            data-region={regions?.actions}
            className={cn(
              'mt-2 -ml-2 flex flex-wrap items-center gap-0.5 transition-opacity duration-200',
              !pinned && 'opacity-0 group-focus-within/agent:opacity-100 group-hover/agent:opacity-100',
            )}
          >
            <MessageTip
              label={copied ? 'Copiado' : 'Copiar'}
              render={<BotonIcono className={ACTION} aria-label="Copiar respuesta" onClick={copy} />}
            >
              <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} className="size-4" />
            </MessageTip>
            <span role="status" className="sr-only">
              {copied ? 'Respuesta copiada' : ''}
            </span>
            <MessageTip
              label="Útil"
              render={
                <Toggle
                  size="sm"
                  aria-label="Marcar como útil"
                  pressed={vote === 'up'}
                  onPressedChange={(pressed) => toggleVote('up', pressed)}
                  className={cn(ACTION, vote === 'up' && 'text-foreground')}
                />
              }
            >
              <HugeiconsIcon icon={ThumbsUpIcon} className={cn('size-4', vote === 'up' && '[&_path]:fill-foreground/20')} />
            </MessageTip>
            <MessageTip
              label="No útil"
              render={
                <Toggle
                  ref={downRef}
                  size="sm"
                  aria-label="Marcar como no útil"
                  pressed={vote === 'down'}
                  onPressedChange={(pressed) => toggleVote('down', pressed)}
                  className={cn(ACTION, vote === 'down' && 'text-foreground')}
                />
              }
            >
              <HugeiconsIcon icon={ThumbsDownIcon} className={cn('size-4', vote === 'down' && '[&_path]:fill-foreground/20')} />
            </MessageTip>
            {/* Sin otra versión que mostrar ni cómo pedirla de nuevo, no hay qué regenerar (las respuestas armadas con
                piezas del agente contextual). */}
            {onRegenerate || details.alternates.length ? (
              <MessageTip
                label="Regenerar"
                render={
                  <BotonIcono
                    ref={regenerateRef}
                    className={ACTION}
                    aria-label="Generar otra versión"
                    onClick={regenerate}
                  />
                }
              >
                <HugeiconsIcon icon={RefreshIcon} className="size-4" />
              </MessageTip>
            ) : null}

            {versions.length > 1 ? (
              <div role="group" aria-label="Versiones de la respuesta" className="flex items-center text-[13px] text-muted-foreground tabular-nums">
                <BotonIcono size="icon-xs" aria-label="Versión anterior" disabled={index === 0} onClick={() => goTo(index - 1)}>
                  <HugeiconsIcon icon={ArrowLeft01Icon} className="size-3.5" />
                </BotonIcono>
                <span aria-hidden="true" className="min-w-7 text-center">
                  {index + 1}/{versions.length}
                </span>
                <span aria-live="polite" className="sr-only">
                  Versión {index + 1} de {versions.length}
                </span>
                <BotonIcono
                  size="icon-xs"
                  aria-label="Versión siguiente"
                  disabled={index === versions.length - 1}
                  onClick={() => goTo(index + 1)}
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
                </BotonIcono>
              </div>
            ) : null}

            {/* Interruptor: nombre fijo y estado en aria-pressed (el tooltip sí cambia a «Detener lectura»). */}
            <MessageTip
              label={speaking ? 'Detener lectura' : 'Leer en voz alta'}
              render={
                <BotonIcono
                  aria-label="Leer en voz alta"
                  aria-pressed={speaking}
                  className={cn(ACTION, speaking && 'text-primary')}
                  onClick={speak}
                />
              }
            >
              <HugeiconsIcon icon={speaking ? PauseIcon : VolumeHighIcon} className={cn('size-4', speaking && styles.speaking)} />
            </MessageTip>

            <DropdownMenu>
              <DropdownMenuTrigger render={<BotonIcono className={ACTION} aria-label="Más acciones" />}>
                <HugeiconsIcon icon={MoreHorizontalIcon} className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-66">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => notify('Enlace a esta respuesta copiado', undefined, 'success')}>
                    <HugeiconsIcon icon={Share08Icon} className="size-4" />
                    Compartir respuesta
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => notify('Tarea creada en Herramientas › Tareas', undefined, 'success')}>
                    <HugeiconsIcon icon={TaskAdd01Icon} className="size-4" />
                    Crear tarea con esta respuesta
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={report}>
                    <HugeiconsIcon icon={Flag02Icon} className="size-4" />
                    Reportar un problema
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </MessageFooter>
        ) : null}

        {feedbackFor === index ? (
          <MessageFeedback
            key={`${index}-${preset ?? 'libre'}`}
            preset={preset}
            // Al cerrar el comentario el foco vuelve a «No útil», que sigue en la fila.
            onCancel={() => {
              downRef.current?.focus()
              setFeedbackFor(null)
            }}
            onSubmit={() => {
              downRef.current?.focus()
              setSent((all) => ({ ...all, [index]: true }))
              setFeedbackFor(null)
              notify('Comentario enviado', undefined, 'success')
            }}
          />
        ) : null}

        {sent[index] ? (
          <div className={cn('mt-2 flex items-center gap-2 text-sm text-muted-foreground', styles.fade)}>
            <HugeiconsIcon icon={Tick02Icon} className="size-4" />
            Gracias por el detalle. El equipo de producto lo revisará.
          </div>
        ) : null}

        {latest && showActions && onFollowup && details.followups.length ? (
          <div data-region={regions?.followups} className={cn('mt-4 flex flex-wrap gap-2', styles.rise)}>
            {details.followups.map((followup) => (
              <Button key={followup} variant="outline" size="sm" onClick={() => onFollowup(followup)}>
                {/* El orbe marca lo que propone la IA; nada de estrellas (auditoría, 5-oct). */}
                <IconoIA />
                {followup}
              </Button>
            ))}
          </div>
        ) : null}
      </MessageContent>
    </Message>
  )
}
