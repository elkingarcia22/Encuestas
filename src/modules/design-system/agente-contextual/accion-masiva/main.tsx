import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Download04Icon, UserMultipleIcon } from '@hugeicons/core-free-icons'
import { Button, Heading, Text } from '@ubits/flux-ui'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { notify } from '@/shared/components/notify'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { WS } from '../../drawers/components/drawer-styles'
import { CaseFrame } from '../../navegacion/components/case-frame'
import { AgentNote, AgentStage, AgentThread, ContextPanel, ReopenAgentButton, UserBubble, type PanelState } from '../components/agent-kit'
import { PILL } from '../components/agent-styles'
import { useAgentThread } from '../components/use-agent-thread'
import { DEFAULT_MESSAGE, PEOPLE, PRESELECTED, SHORT_MESSAGE, impactText, type Channels } from './components/data'
import { PeopleTable } from './components/people-table'
import { PlanCard, SendingCard, SentBlock } from './components/send-plan'

type Phase = 'plan' | 'sending' | 'sent'

// Caso · Actuar sobre una selección: con personas elegidas en la tabla, el agente arma el envío,
// muestra el impacto real, pide confirmación, envía y deja deshacer por 30 segundos.
export function Component() {
  const [panel, setPanel] = useState<PanelState>('open')
  const [selected, setSelected] = useState(() => new Set(PRESELECTED))
  const [sent, setSent] = useState<Set<string>>(() => new Set())
  const [flashKey, setFlashKey] = useState(0)
  const [nudge, setNudge] = useState(0)
  const [channels, setChannels] = useState<Channels>({ email: true, app: false })
  const [message, setMessage] = useState(DEFAULT_MESSAGE)
  const [editing, setEditing] = useState(false)
  const [fallback, setFallback] = useState(false)
  const [phase, setPhase] = useState<Phase>('plan')
  const [step, setStep] = useState(0)
  const [countdown, setCountdown] = useState(30)
  const [confirm, setConfirm] = useState(false)
  const [undone, setUndone] = useState(false)
  const [snapshot, setSnapshot] = useState<{ ids: string[]; reached: number; steps: string[] } | null>(null)
  const thread = useAgentThread()
  // El panel solo baja con lo que pasa después de abrir: al montar se queda arriba mostrando el pedido.
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 0)
    return () => window.clearTimeout(id)
  }, [])

  const chosen =PEOPLE.filter((person) => selected.has(person.id))
  const invalid = chosen.filter((person) => !person.email)
  const reached = channels.email && !channels.app && !fallback ? chosen.length - invalid.length : chosen.length
  const impact = impactText(chosen.length, invalid.length, channels, fallback)

  // Envío: cada paso tarda 600 ms; al terminar marca a las personas y arranca la cuenta para deshacer.
  useEffect(() => {
    if (phase !== 'sending' || !snapshot) return
    const id = window.setTimeout(() => {
      if (step < snapshot.steps.length - 1) {
        setStep(step + 1)
        return
      }
      setSent((current) => new Set([...current, ...snapshot.ids]))
      setFlashKey((key) => key + 1)
      setCountdown(30)
      setPhase('sent')
    }, 600)
    return () => window.clearTimeout(id)
  }, [phase, step, snapshot])

  useEffect(() => {
    if (phase !== 'sent' || countdown <= 0) return
    const id = window.setTimeout(() => setCountdown((value) => value - 1), 1000)
    return () => window.clearTimeout(id)
  }, [phase, countdown])

  const changeSelection = (next: Set<string>) => {
    setSelected(next)
    setNudge((value) => value + 1)
  }

  const toggleAll = () => changeSelection(selected.size === PEOPLE.length ? new Set() : new Set(PEOPLE.map((person) => person.id)))

  const setChannel = (key: keyof Channels, value: boolean) => {
    const next = { ...channels, [key]: value }
    if (!next.email && !next.app) {
      notify('Deja al menos un canal')
      return
    }
    setChannels(next)
  }

  const startSend = () => {
    const steps = [
      `Preparando ${chosen.length} mensajes`,
      ...(channels.email ? ['Enviando correos'] : []),
      ...(channels.app || fallback ? ['Publicando notificaciones en la app'] : []),
      'Guardando en el historial de cada persona',
    ]
    setConfirm(false)
    setEditing(false)
    setUndone(false)
    setSnapshot({ ids: chosen.map((person) => person.id), reached, steps })
    setStep(0)
    setPhase('sending')
  }

  const undo = () => {
    if (snapshot) {
      setSent((current) => new Set([...current].filter((id) => !snapshot.ids.includes(id))))
    }
    setPhase('plan')
    setUndone(true)
  }

  const send = (text: string) => {
    const lower = text.toLowerCase()
    if (/corto|breve|resum|short/.test(lower)) {
      thread.ask(text, () => {
        setMessage(SHORT_MESSAGE)
        return 'Lo dejé más corto, con la fecha límite al final. Revísalo en el plan antes de enviar.'
      })
      return
    }
    if (/correo|quién|quien|faltan/.test(lower)) {
      thread.ask(
        text,
        invalid.length
          ? `${invalid.map((person) => person.name).join(', ')} no tienen correo válido. Puedes enviarles solo la notificación en la app.`
          : 'Todas las personas seleccionadas tienen correo válido.',
      )
      return
    }
    thread.ask(text, `Tomé nota para el envío a ${chosen.length} personas. Si quieres cambiar el mensaje, dime cómo o toca «Editar».`)
  }

  const contextLabel =
    chosen.length === 0 ? 'Ningún colaborador seleccionado' : `${chosen.length} ${chosen.length === 1 ? 'colaborador seleccionado' : 'colaboradores seleccionados'}`

  const agentPanel = (
    <ContextPanel
      context={
        <>
          <span className="text-foreground">{contextLabel}</span> · Evaluación 360 Q3
        </>
      }
      contextIcon={UserMultipleIcon}
      onClose={() => setPanel('closed')}
      placeholder="Pide un cambio sobre este envío"
      onSend={send}
      scrollKey={ready ? `${phase}-${step}-${countdown > 0}-${thread.scrollKey}-${undone}` : undefined}
    >
      <UserBubble>Recuérdales que completen la evaluación</UserBubble>

      {phase === 'plan' && chosen.length === 0 ? (
        <div className="mt-4.5 flex flex-col items-start gap-3">
          <AgentNote>Selecciona en la tabla a quién quieres recordarle y armo el envío.</AgentNote>
          <Button variant="outline" className={PILL} onClick={toggleAll}>
            Seleccionar a los {PEOPLE.length}
          </Button>
        </div>
      ) : null}

      {phase === 'plan' && chosen.length > 0 ? (
        <>
          <AgentNote className="mt-4.5">
            {undone
              ? 'Deshice el envío: retiré las notificaciones y cancelé los correos que aún no salían. Ajusta el plan y vuelve a enviar.'
              : 'Armé el envío para las personas que elegiste. Nada sale hasta que lo confirmes.'}
          </AgentNote>
          <PlanCard
            count={chosen.length}
            nudgeTick={nudge}
            channels={channels}
            onChannel={setChannel}
            message={message}
            onMessage={setMessage}
            editing={editing}
            onEditing={setEditing}
            invalid={invalid}
            fallback={fallback}
            onFallback={() => setFallback(true)}
            previewName={chosen[0].name}
          />
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <Button data-undo-focus="" className={PILL} onClick={() => setConfirm(true)}>
              Enviar recordatorio
            </Button>
            <Button variant="outline" className={PILL} onClick={() => notify('Recordatorio programado para mañana a las 8:00')}>
              Programar para mañana
            </Button>
          </div>
        </>
      ) : null}

      {phase === 'sending' && snapshot ? (
        <>
          <AgentNote className="mt-4.5">Enviando. Puedes seguir trabajando; te aviso al terminar.</AgentNote>
          <SendingCard steps={snapshot.steps} step={step} />
        </>
      ) : null}

      {phase === 'sent' && snapshot ? (
        <SentBlock
          reached={snapshot.reached}
          countdown={countdown}
          onUndo={undo}
          onNew={() => {
            setPhase('plan')
            setUndone(false)
          }}
        />
      ) : null}

      <AgentThread msgs={thread.msgs} thinking={thread.thinking} />
    </ContextPanel>
  )

  return (
    <CaseFrame
      title="Actuar sobre una selección"
      hint="El agente arma el envío, muestra el impacto y pide confirmación"
      width="default"
      anatomy={false}
      back={{ label: 'Casos de Orbit Flow', to: '/design-system/agente-contextual' }}
    >
      <AgentStage state={panel} onOpen={() => setPanel('open')} panel={agentPanel}>
        <div className="@container px-8 py-6">
          <PageShell>
            <PageHeader
              breadcrumbs={[{ label: 'Inicio', path: '/admin' }, { label: 'Desempeño y cultura' }, { label: 'Evaluaciones 360' }]}
              title="Evaluaciones vencidas"
              description="Ciclo Q3 2026 · cerraba el 5 de septiembre. Elige a quién recordarle y pídeselo al agente."
              actions={
                <>
                  <Button variant="outline" className={WS} onClick={() => notify('Exportando la lista a Excel')}>
                    <HugeiconsIcon icon={Download04Icon} size={16} />
                    Exportar
                  </Button>
                  {panel === 'closed' ? <ReopenAgentButton onClick={() => setPanel('open')} /> : null}
                </>
              }
            />
            <PageContent className="gap-4">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="tabular-nums">
                  <span className="font-medium">{selected.size}</span> de {PEOPLE.length} seleccionados
                </span>
                <Button variant="ghost" size="sm" className={`${WS} text-muted-foreground!`} disabled={phase === 'sending'} onClick={toggleAll}>
                  {selected.size === PEOPLE.length ? 'Quitar selección' : 'Seleccionar a todos'}
                </Button>
                <span className="ml-auto text-muted-foreground tabular-nums">
                  {sent.size ? `${sent.size} recordados hoy` : 'Nadie recibió recordatorio esta semana'}
                </span>
              </div>
              <PeopleTable
                people={PEOPLE}
                selected={selected}
                sent={sent}
                locked={phase === 'sending'}
                flashKey={flashKey}
                onChange={changeSelection}
              />
            </PageContent>
          </PageShell>
        </div>
      </AgentStage>

      {/* Confirmación corta en la ventana única (auditoría 5-oct): título fijo; a cuántos y por dónde, en la primera línea. */}
      <ActionDialog
        open={confirm}
        onOpenChange={setConfirm}
        size="sm"
        title="Enviar recordatorio"
        sub="Sale a nombre de Talento Humano · Meta Colombia y queda en el historial de cada persona. Tendrás 30 segundos para deshacerlo."
        lead={
          <>
            <Heading as="h3" level={6}>
              {reached} {reached === 1 ? 'persona' : 'personas'} · Evaluación 360 Q3
            </Heading>
            <Text as="span" variant="muted" size="sm">
              {impact}
            </Text>
          </>
        }
        cancelLabel="Revisar"
        confirmLabel="Enviar ahora"
        onConfirm={startSend}
      />
    </CaseFrame>
  )
}

Component.displayName = 'AgentBulkActionCasePage'
