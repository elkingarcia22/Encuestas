import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { File01Icon } from '@hugeicons/core-free-icons'
import { Button, MessageGroup, TooltipProvider, cn } from '@ubits/flux-ui'
import { AgentMessage } from '@/modules/admin/suite-ai/chat/components/agent-message'
import { TypingIndicator } from '@/modules/admin/suite-ai/chat/components/typing-indicator'
import { UserMessage } from '@/modules/admin/suite-ai/chat/components/user-message'
import { Composer } from '@/modules/admin/suite-ai/shared/composer'
import type { ChatMessage } from '@/modules/admin/suite-ai/shared/data'
import { Orb } from '@/shared/components/Orb'
import { notify } from '@/shared/components/notify'
import {
  FIELD_SHORTCUTS,
  FIRST_PROPOSAL_REPLY,
  FIRST_REQUEST,
  PROPOSALS,
  fieldDetailsFor,
  fieldReplyFor,
} from './agent-replies'
import { keepFocusNear } from './agent-focus'
import styles from './editor.module.css'
import { CloseButton } from '@/shared/components/CloseButton'
import { AvisoOrbit } from '@/modules/design-system/ia/aviso-orbit'

export type CardAnim = 'in' | 'nudge' | null

// Mensaje del hilo: el mismo del chat de Suite AI, más la marca de si la respuesta trae propuesta para el campo.
type PanelMessage = ChatMessage & { proposal?: boolean }

const SEED: PanelMessage[] = [
  { id: 1, role: 'user', text: FIRST_REQUEST },
  { id: 2, role: 'agent', text: FIRST_PROPOSAL_REPLY, proposal: true },
]

// Rótulos en mayúscula a 13px (a 11px costaba leerlos); `text-[length:…]` para que cn no lo descarte junto al color.
const KICKER = 'text-[length:13px] font-medium tracking-[0.08em]'
const PILL = 'h-9! rounded-full! px-4! text-sm font-medium'

// ── Piezas del panel ────────────────────────────────────────────────────────────────────────────────────────────
// Se exportan para que el configurador del agente contextual arme su vista previa con estas mismas piezas y no con
// copias. Los atributos extra (data-region…) solo sirven para nombrarlas en la anatomía: no cambian cómo se ven.

// Marco: columna de 452px a la derecha de la pantalla, con los botones en pastilla como en el chat de Suite AI.
// Región con nombre y enfocable por código (no con Tab): al abrirlo el foco llega aquí y el lector anuncia el panel.
export function AgentPanelFrame({ className, children, ...props }: ComponentProps<'aside'>) {
  return (
    <TooltipProvider delay={300}>
      <aside
        aria-label="Orbit"
        data-agent-panel=""
        tabIndex={-1}
        {...props}
        className={cn('flex w-113 shrink-0 flex-col border-l bg-background outline-none [&_button]:rounded-full!', className)}
      >
        {children}
      </aside>
    </TooltipProvider>
  )
}

type HeaderProps = ComponentProps<'div'> & {
  // Sin esto la cabecera va sin la X.
  onClose?: () => void
  // Nombres del orbe y la X en la anatomía. Van envueltos: una imagen no muestra su nombre y CloseButton no recibe
  // atributos. El nombre cuelga por debajo porque arriba ya está el de la cabecera.
  orbRegion?: string
  closeRegion?: string
}

// Cabecera de 58px: orbe, «Orbit» y cerrar.
export function AgentPanelHeader({ onClose, orbRegion, closeRegion, ...props }: HeaderProps) {
  const orb = <Orb className="size-6.5" />
  const close = onClose ? <CloseButton label="Cerrar" onClick={onClose} /> : null

  return (
    <div {...props} className="flex h-14.5 shrink-0 items-center gap-2.75 border-b px-4.5">
      {orbRegion ? (
        <span data-region={orbRegion} data-chip="under" className="flex">
          {orb}
        </span>
      ) : (
        orb
      )}
      <h2 className="flex-1 text-[15px] font-medium">Orbit</h2>
      {close && closeRegion ? (
        <span data-region={closeRegion} data-chip="under" className="flex">
          {close}
        </span>
      ) : (
        close
      )}
    </div>
  )
}

// Franja gris «Contexto: …» con lo que está mirando el agente.
// `icon`: lo que se está mirando (una persona, un gráfico, un aviso). Por defecto, un documento.
export function AgentContextStrip({ children, icon = File01Icon, ...props }: ComponentProps<'div'> & { icon?: IconSvgElement }) {
  return (
    <div {...props} className="flex items-center gap-2.25 border-b bg-muted px-4.5 py-2.75 text-[13px] text-foreground/70">
      <HugeiconsIcon icon={icon} size={18} strokeWidth={1.5} aria-hidden="true" className="shrink-0" />
      <span className="min-w-0 truncate">Contexto: {children}</span>
    </div>
  )
}

// Hilo con scroll propio entre la franja de contexto y la bandeja del chat.
export function AgentPanelBody({ className, children, ...props }: ComponentProps<'div'>) {
  return (
    <div {...props} className={cn('min-h-0 flex-1 overflow-auto p-4.5', className)}>
      {children}
    </div>
  )
}

// Atajos «Sobre este contenido». Con `region` van envueltos para nombrarlos juntos en la anatomía.
export function AgentShortcuts({ items, onPick, region }: { items: string[]; onPick: (text: string) => void; region?: string }) {
  const content = (
    <>
      <div className={cn(KICKER, 'mt-8.5 text-muted-foreground')}>SOBRE ESTE CONTENIDO</div>
      <div className="mt-3 flex flex-col items-start gap-2.5">
        {items.map((item) => (
          <Button
            key={item}
            variant="outline"
            className="h-auto! rounded-full! px-4! py-2.25! text-sm font-normal!"
            onClick={() => onPick(item)}
          >
            {item}
          </Button>
        ))}
      </div>
    </>
  )
  return region ? <div data-region={region}>{content}</div> : content
}

// Bandeja gris del composer, como en el chat de Suite AI. Los atributos extra van en la bandeja.
export function ComposerTray({ children, ...props }: ComponentProps<'div'>) {
  return (
    <div className="shrink-0 px-4.5 pt-2 pb-3">
      <div {...props} className="rounded-[1.75rem] bg-muted p-2">
        {children}
      </div>
      {/* Debajo del campo, siempre (regla «aviso-de-orbit», 13-oct): vale para el Orbit de todas las pantallas. */}
      <AvisoOrbit className="mt-2" />
    </div>
  )
}

type FieldProposalProps = {
  current: ReactNode
  proposal: ReactNode
  // «PROPUESTA 1/3».
  label: string
  applied: boolean
  cardAnim: CardAnim
  cardTick: number
  onApply: () => void
  onUndo: () => void
  onOtherVersion: () => void
  // Textos del editor por defecto; otros casos (un formulario, un párrafo) cambian a qué se aplica.
  applyLabel?: string
  appliedNote?: string
  // Nombres de las partes en la anatomía: la propuesta entera, sus botones y la fila para deshacer.
  regions?: Partial<Record<'root' | 'actions' | 'undo', string>>
}

// Propuesta «Actual / Propuesta» con Aplicar al campo, Otra versión y, al aplicar, la fila para deshacer.
export function FieldProposal({
  current,
  proposal,
  label,
  applied,
  cardAnim,
  cardTick,
  onApply,
  onUndo,
  onOtherVersion,
  applyLabel = 'Aplicar al campo',
  appliedNote = 'Aplicado al campo Descripción',
  regions,
}: FieldProposalProps) {
  return (
    <div data-region={regions?.root} className="mt-3">
      {/* «Otra versión» cambia la propuesta sin mover el foco: el lector la lee desde aquí. */}
      <div role="status" className="sr-only">
        {cardTick > 0 ? (
          <>
            {label}: {proposal}
          </>
        ) : null}
      </div>
      <div
        key={cardTick}
        className={cn(
          'overflow-hidden rounded-[16px] border',
          cardAnim === 'in' && styles.propIn,
          cardAnim === 'nudge' && styles.nudge,
        )}
      >
        <div className="bg-muted px-4 py-3.5">
          <div className={cn(KICKER, 'text-foreground/70')}>ACTUAL</div>
          <div className="mt-2 text-sm leading-normal text-foreground/70">{current}</div>
        </div>
        <div className="border-t bg-background px-4 py-3.5">
          <div className={KICKER}>{label}</div>
          <div className="mt-2 text-sm leading-[1.55] text-pretty text-foreground/80">{proposal}</div>
        </div>
      </div>

      <div data-region={regions?.actions} className="mt-3 flex flex-wrap items-center gap-2.5">
        {applied ? (
          <Button data-undo-focus="" variant="outline" className={PILL} onClick={() => notify('El cambio ya está aplicado', undefined, 'info')}>
            Aplicado
          </Button>
        ) : (
          <Button data-undo-focus="" className={PILL} onClick={onApply}>
            {applyLabel}
          </Button>
        )}
        <Button variant="outline" className={PILL} onClick={onOtherVersion}>
          Otra versión
        </Button>
      </div>

      {applied ? (
        <div
          data-region={regions?.undo}
          className={cn('mt-3 flex items-center gap-2.5 rounded-[12px] border py-1.5 pr-1.5 pl-3.5', styles.msgIn)}
        >
          <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-foreground" />
          <span className="flex-1 text-[13px] text-foreground/80">{appliedNote}</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-[length:13px] font-medium underline underline-offset-3"
            onClick={(event) => {
              keepFocusNear(event.currentTarget)
              onUndo()
            }}
          >
            Deshacer
          </Button>
        </div>
      ) : null}
    </div>
  )
}

// ── Panel del editor ────────────────────────────────────────────────────────────────────────────────────────────

type AgentPanelProps = {
  contentName: string
  description: string
  applied: boolean
  propIdx: number
  cardAnim: CardAnim
  cardTick: number
  onApply: () => void
  onUndo: () => void
  onOtherVersion: () => void
  onClose: () => void
  // Solo para ubicarlo en la pantalla (bordes de la columna), no para cambiar cómo se ve.
  className?: string
}

// Agente contextual: panel de 452px a la derecha de la pantalla con cabecera, franja de contexto y el mismo chat
// de Suite AI (mensajes, acciones, sugerencias y composer). Lo propio del editor es la propuesta
// «Actual / Propuesta» que acompaña la respuesta que la trae y los atajos sobre el contenido.
export function AgentPanel({
  contentName,
  description,
  applied,
  propIdx,
  cardAnim,
  cardTick,
  onApply,
  onUndo,
  onOtherVersion,
  onClose,
  className,
}: AgentPanelProps) {
  const [messages, setMessages] = useState<PanelMessage[]>(SEED)
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  // Con la pastilla del composer quitada, el agente responde sobre todo el contenido y no solo el campo.
  const [fieldContext, setFieldContext] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const seq = useRef(SEED.length)
  const lastLength = useRef(SEED.length)
  const timers = useRef<number[]>([])

  const lastAgentId = [...messages].reverse().find((message) => message.role === 'agent')?.id
  // La propuesta va solo bajo la última respuesta que la trae.
  const proposalId = [...messages].reverse().find((message) => message.proposal)?.id

  // Baja al final cuando llega algo nuevo; al abrir se queda arriba para leer el pedido inicial.
  useEffect(() => {
    if (messages.length === lastLength.current && !typing) return
    lastLength.current = messages.length
    const el = scrollRef.current
    el?.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages.length, typing])

  // Si el panel se cierra con una respuesta en camino, esa respuesta ya no llega.
  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((id) => window.clearTimeout(id))
  }, [])

  const follow = () => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }

  // Al terminar de escribirse aparecen la propuesta, las fuentes y las acciones: el panel baja para mostrarlas,
  // sin llegar a esconder el inicio de la respuesta.
  const reveal = () =>
    window.requestAnimationFrame(() => {
      const el = scrollRef.current
      const all = el?.querySelectorAll('[data-slot="message"]')
      const last = all?.[all.length - 1]
      if (!el || !last) return
      const view = el.getBoundingClientRect()
      const box = last.getBoundingClientRect()
      const below = box.bottom - view.bottom + 18
      const room = box.top - view.top - 18
      if (below > 0 && room > 0) el.scrollBy({ top: Math.min(below, room), behavior: 'smooth' })
    })

  const say = (role: PanelMessage['role'], text: string, proposal = false) => {
    seq.current += 1
    const message: PanelMessage = { id: seq.current, role, text, stream: role === 'agent', proposal }
    setMessages((current) => [...current, message])
  }

  const ask = (text: string) => {
    say('user', text)
    setTyping(true)
    const id = window.setTimeout(() => {
      const reply = fieldReplyFor(text, contentName)
      setTyping(false)
      say('agent', reply.text, reply.proposal)
      // Un pedido de cambio trae una propuesta nueva para el campo.
      if (reply.proposal) onOtherVersion()
    }, 2800)
    timers.current.push(id)
  }

  // Editar un mensaje propio: se descarta lo que venía después y el agente responde de nuevo.
  const editMessage = (id: number, text: string) => {
    setMessages((current) => {
      const position = current.findIndex((message) => message.id === id)
      return position < 0 ? current : current.slice(0, position)
    })
    ask(text)
  }

  const send = () => {
    const text = draft.trim()
    if (!text) return
    setDraft('')
    ask(text)
  }

  return (
    <AgentPanelFrame className={className}>
      <AgentPanelHeader onClose={onClose} />

      <AgentContextStrip>
        <span className="text-foreground">{contentName}</span> · {fieldContext ? 'campo Descripción' : 'todo el contenido'}
      </AgentContextStrip>

      <AgentPanelBody ref={scrollRef}>
        <MessageGroup className="gap-6">
          {messages.map((message) =>
            message.role === 'user' ? (
              <UserMessage key={message.id} text={message.text} onEdit={(text) => editMessage(message.id, text)} />
            ) : (
              <AgentMessage
                key={message.id}
                text={message.text}
                stream={message.stream}
                latest={message.id === lastAgentId && !typing}
                details={fieldDetailsFor(message.text)}
                onFollowup={ask}
                onProgress={follow}
                onStreamEnd={reveal}
              >
                {message.id === proposalId ? (
                  <FieldProposal
                    current={description}
                    proposal={PROPOSALS[propIdx]}
                    label={`PROPUESTA ${propIdx + 1}/${PROPOSALS.length}`}
                    applied={applied}
                    cardAnim={cardAnim}
                    cardTick={cardTick}
                    onApply={onApply}
                    onUndo={onUndo}
                    onOtherVersion={onOtherVersion}
                  />
                ) : null}
              </AgentMessage>
            ),
          )}
          {typing ? <TypingIndicator /> : null}
        </MessageGroup>

        <AgentShortcuts items={FIELD_SHORTCUTS} onPick={ask} />
      </AgentPanelBody>

      <ComposerTray>
        <Composer
          value={draft}
          onChange={setDraft}
          onSend={send}
          placeholder={fieldContext ? 'Pide un cambio sobre este campo' : 'Pregunta o pide un cambio sobre este contenido'}
          onVoice={() => notify('El modo voz se abre desde el chat de Orbit', undefined, 'info')}
          contextChip={fieldContext ? `${contentName} · Descripción` : undefined}
          // Sin nota junto a la pastilla: a 452px no cabe en una línea y la franja «Contexto:» ya lo explica.
          contextNote=""
          onRemoveContext={() => {
            setFieldContext(false)
            notify('El agente ahora responde sobre todo el contenido', undefined, 'info')
          }}
        />
      </ComposerTray>
    </AgentPanelFrame>
  )
}
