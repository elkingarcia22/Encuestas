import { Fragment, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { Activity01Icon } from '@hugeicons/core-free-icons'
import { useNavigate, useSearchParams } from 'react-router'
import {
  Button,
  MessageGroup,
  ScrollArea,
  TooltipProvider,
  cn,
} from '@ubits/flux-ui'
import { FeatureDialog } from '@/shared/components/Announcements'
import { Orb } from '@/shared/components/Orb'
import { ProcessCenter } from '@/shared/components/ProcessCenter'
import { setRightPanelOpen } from '@/shared/components/right-panel-store'
import { notify } from '@/shared/components/notify'
import { Composer } from '../../shared/composer'
import {
  SEED_MESSAGES,
  STARTERS,
  replyFor,
  type ChatMessage,
  type ConvoId,
} from '../../shared/data'
import { ActivityPanel } from './activity-panel'
import { AgentMessage } from './agent-message'
import { ApprovalPlan } from './approval-plan'
import { MetricsCard } from './metrics-card'
import { ProposalCard } from './proposal-card'
import { TypingIndicator } from './typing-indicator'
import { UserMessage } from './user-message'
import greet from './greeting.module.css'
import { useApprovalFlow } from './use-approval-flow'

type ChatViewProps = {
  convo: ConvoId
}

const EVAL_CHIPS = [
  { label: 'Corregir los 5 sin líder', text: 'Corregir los 5 sin líder' },
  { label: 'Comparar con Operaciones', text: 'Comparar con Operaciones' },
]

// Saludo de bienvenida: uno por día (cambia con la fecha, no en pantalla). Entra animado palabra por palabra cada vez
// que se llega a la conversación nueva (greeting.module.css) y después se queda quieto.
const GREETINGS = ['¡Hola Carolina! ¿Qué quieres hacer hoy?', '¡Buenas tardes, Carolina!', 'Bienvenida de nuevo, Carolina']

function greetingOfTheDay() {
  return GREETINGS[Math.floor(Date.now() / 86400000) % GREETINGS.length]
}

function placeholderFor(convo: ConvoId) {
  if (convo === 'new') return 'Escribe una tarea o una pregunta'
  if (convo === 'vacaciones') return 'Escribe un ajuste antes de publicar'
  return 'Pide un cambio o continúa con otra tarea'
}

export function ChatView({ convo }: ChatViewProps) {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const approval = useApprovalFlow()

  const [greeting] = useState(greetingOfTheDay)
  const [messages, setMessages] = useState<Partial<Record<ConvoId, ChatMessage[]>>>(() => ({ ...SEED_MESSAGES }))
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const [news, setNews] = useState(true)
  const [context, setContext] = useState(true)
  const [reminderSent, setReminderSent] = useState(false)
  const [processes, setProcesses] = useState(false)
  const [feature, setFeature] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const seq = useRef(100)
  // Hueco del marco general para paneles a toda la altura (ver RootLayout). Existe tras el primer montaje.
  const [rightSlot, setRightSlot] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setRightSlot(document.getElementById('right-panel-slot'))
  }, [])

  // El panel de actividad se puede cerrar y volver a abrir; el header se entera para compactar o no el buscador.
  const [activityOpen, setActivityOpen] = useState(true)
  const showActivity = convo === 'vacaciones' && activityOpen
  // Al abrir o cerrar el panel, el botón que se usó desaparece: el foco pasa a su pareja (cerrar ↔ pastilla).
  const reopenRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const moveFocus = useRef(false)

  const toggleActivity = (open: boolean) => {
    moveFocus.current = true
    setActivityOpen(open)
  }

  useEffect(() => {
    if (!moveFocus.current) return
    moveFocus.current = false
    if (activityOpen) panelRef.current?.querySelector('button')?.focus()
    else reopenRef.current?.focus()
  }, [activityOpen, rightSlot])

  useEffect(() => {
    setRightPanelOpen(showActivity)
    return () => setRightPanelOpen(false)
  }, [showActivity])

  const thread = messages[convo] ?? []
  const lastAgentId = [...thread].reverse().find((message) => message.role === 'agent')?.id

  const say = (role: ChatMessage['role'], text: string, target: ConvoId = convo) => {
    seq.current += 1
    const message: ChatMessage = { id: seq.current, role, text, stream: role === 'agent' }
    setMessages((current) => ({ ...current, [target]: [...(current[target] ?? []), message] }))
  }

  const ask = (text: string) => {
    say('user', text)
    setTyping(true)
    window.setTimeout(() => {
      setTyping(false)
      say('agent', replyFor(text))
    }, 2800)
  }

  // Editar un mensaje propio: se descarta lo que venía después y el agente responde de nuevo. El mensaje editado se
  // vuelve a crear, así que el foco pasa al composer en vez de perderse.
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const editMessage = (id: number, text: string) => {
    inputRef.current?.focus()
    setMessages((current) => {
      const list = current[convo] ?? []
      const position = list.findIndex((message) => message.id === id)
      return position < 0 ? current : { ...current, [convo]: list.slice(0, position) }
    })
    ask(text)
  }

  // Una respuesta que ya terminó de escribirse no se vuelve a animar al cambiar de conversación.
  const endStream = (id: number) => {
    setMessages((current) => ({
      ...current,
      [convo]: (current[convo] ?? []).map((message) => (message.id === id ? { ...message, stream: false } : message)),
    }))
  }

  const follow = () => endRef.current?.scrollIntoView({ block: 'end' })

  // El buscador y el modo voz llegan con ?q= (pregunta) o ?draft= (texto para el composer).
  useEffect(() => {
    const q = params.get('q')
    const d = params.get('draft')
    if (q) {
      ask(q)
      setParams({}, { replace: true })
    } else if (d) {
      setDraft(d)
      setParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [thread.length, typing])

  // Al cambiar de conversación se limpia el borrador; los mensajes se conservan.
  useEffect(() => {
    setDraft('')
    setTyping(false)
  }, [convo])

  const send = () => {
    const text = draft.trim()
    if (!text) return
    setDraft('')
    if (convo === 'new') {
      // Un chat nuevo se convierte en conversación libre al primer mensaje.
      say('user', text, 'libre')
      navigate('/suite-ai/chat/libre')
      setTyping(true)
      window.setTimeout(() => {
        setTyping(false)
        say('agent', replyFor(text), 'libre')
      }, 2800)
      return
    }
    ask(text)
  }

  const isNew = convo === 'new'

  return (
    <TooltipProvider delay={300}>
      {/* Dos columnas: a la izquierda el chat (mensajes + composer, centrados en el espacio que queda) y, cuando hay
          panel de actividad, este ocupa toda la derecha de arriba abajo y empuja el chat. */}
      <div className="-m-6 flex h-[calc(100%+3rem)] min-h-0 flex-1 [&_button]:rounded-full!">
        <ProcessCenter open={processes} onOpenChange={setProcesses} />
        <FeatureDialog open={feature} onOpenChange={setFeature} />

        {/* La conversación se queda dentro del ancho de diseño (1140) para escalar igual que el resto de pantallas; los
            mensajes y el composer van en la columna de lectura de 768 centrada. */}
        <div className="relative mx-auto flex min-h-0 w-full max-w-285 min-w-0 flex-1 flex-col">
          {/* Con el panel cerrado, una pastilla arriba a la derecha lo vuelve a abrir. */}
          {convo === 'vacaciones' && !activityOpen ? (
            <Button
              ref={reopenRef}
              variant="outline"
              size="sm"
              className="absolute top-4 right-6 z-10 hidden h-9! gap-2 bg-background shadow-xs lg:inline-flex"
              onClick={() => toggleActivity(true)}
            >
              <HugeiconsIcon icon={Activity01Icon} size={16} />
              Actividad del agente
            </Button>
          ) : null}
          <ScrollArea className="min-h-0 flex-1">
            <div className={cn('mx-auto flex w-full max-w-3xl flex-col gap-6 px-8 py-8', isNew && 'min-h-full justify-center')}>
              {isNew ? (
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <span className={greet.orb}>
                    <Orb className="size-14" />
                  </span>
                  {/* Las palabras entran escalonadas al llegar a la pantalla. El lector de pantalla lee la frase
                      completa (oculta a la vista), no palabra por palabra. */}
                  <h2 className="text-3xl font-semibold tracking-tight text-balance">
                    <span className="sr-only">{greeting}</span>
                    {greeting.split(' ').map((word, index, words) => (
                      <Fragment key={index}>
                        <span aria-hidden="true" className={greet.word} style={{ animationDelay: `${index * 60}ms` }}>
                          {word}
                        </span>
                        {index < words.length - 1 ? ' ' : null}
                      </Fragment>
                    ))}
                  </h2>
                </div>
              ) : null}

              {convo === 'evaluaciones' ? (
                <>
                  <MetricsCard
                    reminderSent={reminderSent}
                    onSendReminder={() => {
                      setReminderSent(true)
                      notify('Recordatorio enviado a 24 personas')
                      say('agent', 'Recordatorio enviado. Vuelvo a medir la terminación mañana a las 9:00 y te aviso si no se mueve.')
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    {EVAL_CHIPS.map((chip) => (
                      <Button key={chip.label} variant="outline" size="sm" onClick={() => ask(chip.text)}>
                        {chip.label}
                      </Button>
                    ))}
                  </div>
                  <UserMessage text="Prepárame un plan corto de feedback para los líderes de Ventas." />
                  <ProposalCard
                    onOpenProcesses={() => setProcesses(true)}
                    onAssigned={() =>
                      say('agent', 'Plan asignado y notificado. Creé un proceso de seguimiento: te aviso cuando la mitad del grupo termine la primera lección.')
                    }
                  />
                </>
              ) : null}

              {convo === 'vacaciones' ? (
                <>
                  <UserMessage text="Publica el aviso de la nueva política de vacaciones para la sede Bogotá y asigna el curso de la política." />
                  <AgentMessage text="Son dos acciones con efecto real, así que las separé. Ya tengo la audiencia y el borrador; el envío del correo requiere tu confirmación antes de salir." />
                  <ApprovalPlan {...approval} />
                </>
              ) : null}

              <MessageGroup className="gap-6">
                {thread.map((message) =>
                  message.role === 'user' ? (
                    <UserMessage key={message.id} text={message.text} onEdit={(text) => editMessage(message.id, text)} />
                  ) : (
                    <AgentMessage
                      key={message.id}
                      text={message.text}
                      stream={message.stream}
                      latest={message.id === lastAgentId && !typing}
                      onFollowup={ask}
                      onProgress={follow}
                      onStreamEnd={() => endStream(message.id)}
                    />
                  ),
                )}
                {typing ? <TypingIndicator /> : null}
              </MessageGroup>
              <div ref={endRef} />
            </div>
          </ScrollArea>

          {/* Bandeja del composer */}
          <div className="flex shrink-0 flex-col items-center gap-3 px-8 pt-2 pb-5">
            <div className="flex w-full max-w-3xl flex-col gap-2 rounded-[1.75rem] bg-muted p-2">
              {isNew ? (
                <div className="flex flex-wrap gap-2 px-1 pt-1">
                  {STARTERS.map((starter) => (
                    <Button
                      key={starter.label}
                      variant="outline"
                      size="sm"
                      onClick={() => (starter.convo ? navigate(`/suite-ai/chat/${starter.convo}`) : setDraft(starter.draft ?? ''))}
                    >
                      {starter.label}
                    </Button>
                  ))}
                </div>
              ) : null}
              <Composer
                inputRef={inputRef}
                value={draft}
                onChange={setDraft}
                onSend={send}
                placeholder={placeholderFor(convo)}
                onVoice={() => navigate('/suite-ai/voz')}
                news={isNew && news}
                onDismissNews={() => setNews(false)}
                onOpenNews={() => setFeature(true)}
                contextChip={convo === 'evaluaciones' && context ? 'Plan · Feedback efectivo' : undefined}
                onRemoveContext={() => {
                  setContext(false)
                  notify('El agente ya no responde sobre el plan')
                }}
              />
            </div>
            <p className="w-full max-w-3xl text-center text-sm text-muted-foreground">
              El agente puede cometer errores. Antes de ejecutar verás el impacto.
            </p>
          </div>
        </div>

        {/* El panel de actividad va en el hueco derecho del marco: sube hasta arriba, junto al header, y el header
            y el chat se acortan. */}
        {showActivity && rightSlot
          ? createPortal(
              <aside
                ref={panelRef}
                aria-labelledby="activity-panel-title"
                className="hidden h-svh w-90 shrink-0 border-l bg-background lg:flex"
              >
                <ActivityPanel
                  titleId="activity-panel-title"
                  activity={approval.activity}
                  onOpenProcesses={() => setProcesses(true)}
                  onClose={() => toggleActivity(false)}
                />
              </aside>,
              rightSlot,
            )
          : null}
      </div>
    </TooltipProvider>
  )
}
