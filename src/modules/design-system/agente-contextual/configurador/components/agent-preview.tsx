import { useRef, useState } from 'react'
import { Button, MessageGroup, cn } from '@ubits/flux-ui'
import {
  AgentContextStrip,
  AgentPanelBody,
  AgentPanelFrame,
  AgentPanelHeader,
  AgentShortcuts,
  ComposerTray,
  FieldProposal,
  type CardAnim,
} from '@/modules/admin/aprendizaje/lms-creator/components/agent-panel'
import { useAgentPanelFocus } from '@/modules/admin/aprendizaje/lms-creator/components/agent-focus'
import { AgentMessage } from '@/modules/admin/suite-ai/chat/components/agent-message'
import { ApprovalPlan } from '@/modules/admin/suite-ai/chat/components/approval-plan'
import { MetricsCard } from '@/modules/admin/suite-ai/chat/components/metrics-card'
import { ProposalCard } from '@/modules/admin/suite-ai/chat/components/proposal-card'
import { TypingIndicator } from '@/modules/admin/suite-ai/chat/components/typing-indicator'
import { useApprovalFlow } from '@/modules/admin/suite-ai/chat/components/use-approval-flow'
import { UserMessage } from '@/modules/admin/suite-ai/chat/components/user-message'
import { Composer } from '@/modules/admin/suite-ai/shared/composer'
import { notify } from '@/shared/components/notify'
import { SlotArea } from '../../../components/anatomy/anatomy-kit'
import { WS } from '../../../drawers/components/drawer-styles'
import { ReopenAgentButton } from '../../components/agent-kit'
import { PART, type AgentConfig, type AgentSample } from './agent-config'
import { PantallaReal } from '../../../components/anatomy/pantalla-real'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import styles from './agent-preview.module.css'

// Vista previa del agente contextual armada con las piezas reales: el marco, la cabecera, el contexto, la propuesta,
// los atajos y la bandeja del panel del editor de LMS, y los mensajes, tarjetas y la caja del chat de Suite AI. Cada
// pieza recibe su nombre (data-region) sin cambiar cómo se ve. Las respuestas se muestran ya escritas (sin la
// escritura progresiva) para que la anatomía se lea.

type Props = {
  c: AgentConfig
  s: AgentSample
  names: boolean
  applied: boolean
  onApplied: (applied: boolean) => void
  onChange: (patch: Partial<AgentConfig>) => void
  // «Probar en pantalla»: sin rayado ni nombres. Los slots se cambian por bloques tenues, como el contenido real.
  bare?: boolean
  // «Probar en pantalla» dentro del marco real del Workspace, en esta ruta del producto: el panel va a la derecha,
  // debajo del header, que no se mueve al abrirlo (8 oct), como en el editor de LMS. Implica `bare`.
  ruta?: string
}

// La pantalla de trabajo cuando no se dibuja el slot: título, bajada y una lista, en gris muy suave.
function ScreenBehind() {
  return (
    <div aria-hidden="true" className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="h-7 w-56 max-w-full shrink-0 rounded-md bg-foreground/10" />
      <div className="h-2.5 w-80 max-w-full shrink-0 rounded-full bg-foreground/7" />
      <div className="mt-1 flex min-h-0 flex-1 flex-col gap-2.5 rounded-xl border bg-muted/30 p-4">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-7 shrink-0 rounded-md bg-foreground/5" />
        ))}
      </div>
    </div>
  )
}

// El resultado que arma cada pantalla, cuando no se dibuja el slot: el espacio que ocupa, sin contenido inventado.
function ResultBehind() {
  return (
    <div aria-hidden="true" className="flex min-h-40 flex-col gap-2.5 rounded-xl border bg-muted/30 p-4">
      {[0, 1, 2].map((row) => (
        <div key={row} className="h-6 rounded-md bg-foreground/5" />
      ))}
    </div>
  )
}

// Lo que se envía desde la vista previa no cambia el hilo, para no desarmar la anatomía: se avisa y listo.
const sent = (text: string) => notify(`Se enviaría «${text}». El hilo completo está en «Ver el caso completo».`)

// Estado de lo que se toca dentro del panel. Vive fuera del panel para que cerrarlo y abrirlo no lo pierda.
function usePanelState(s: AgentSample, onApplied: (applied: boolean) => void) {
  const approval = useApprovalFlow()
  const [request, setRequest] = useState(s.request)
  const [draft, setDraft] = useState('')
  const [propIdx, setPropIdx] = useState(0)
  const [cardAnim, setCardAnim] = useState<CardAnim>(null)
  const [cardTick, setCardTick] = useState(0)
  const [reminderSent, setReminderSent] = useState(false)

  const otherVersion = () => {
    setPropIdx((index) => (index + 1) % s.field.proposals.length)
    onApplied(false)
    setCardAnim('in')
    setCardTick((tick) => tick + 1)
  }

  return { approval, request, setRequest, draft, setDraft, propIdx, cardAnim, cardTick, otherVersion, reminderSent, setReminderSent }
}

type PanelProps = Props & { state: ReturnType<typeof usePanelState> }

function Panel({ c, s, names, applied, onApplied, onChange, state, bare, ruta }: PanelProps) {
  const proposals = s.field.proposals

  return (
    // El nombre del panel va en su borde de arriba, a la derecha; el de la cabecera, en la misma franja a la izquierda.
    // Se queda en 452px: más angosto, las tarjetas del chat se enciman. Solo cede si la columna es menor que eso.
    <AgentPanelFrame
      data-region={PART.panel}
      data-chip="inline"
      data-edge=""
      className={ruta ? 'h-full max-w-[calc(100%-6rem)]' : 'max-w-[calc(100%-6rem)] rounded-r-2xl'}
    >
      <AgentPanelHeader
        data-region={PART.header}
        data-chip="inline"
        orbRegion={PART.orb}
        closeRegion={PART.close}
        onClose={c.close ? () => onChange({ state: 'closed' }) : undefined}
      />

      {c.context ? (
        // El nombre cuelga por debajo: arriba ya están los de la cabecera.
        <AgentContextStrip data-region={PART.context} data-chip="under">
          <span className="text-foreground">{s.contextName}</span> · {s.contextDetail}
        </AgentContextStrip>
      ) : null}

      {/* Con los nombres visibles el hilo baja un poco para que el nombre de «Contexto» no pise el del primer mensaje. */}
      <AgentPanelBody className={cn(names && c.context && 'pt-8')}>
        <MessageGroup className="gap-6">
          {c.request ? (
            <UserMessage
              region={PART.request}
              text={state.request}
              onEdit={(text) => {
                state.setRequest(text)
                notify('En la pantalla real el agente vuelve a responder desde aquí')
              }}
            />
          ) : null}

          {c.answer ? (
            <AgentMessage
              text={s.answer}
              // Con «Razonando…» viene otra respuesta en camino: esta deja de ser la última, como en el chat.
              latest={!c.typing}
              actions={c.actions}
              details={{ ...s.details, sources: c.sources ? s.details.sources : [] }}
              onFollowup={c.followups ? sent : undefined}
              regions={{ message: PART.answer, sources: PART.sources, actions: PART.actions, followups: PART.followups }}
            >
              {c.result === 'field' ? (
                <FieldProposal
                  current={s.field.current}
                  proposal={proposals[state.propIdx]}
                  label={`PROPUESTA ${state.propIdx + 1}/${proposals.length}`}
                  applied={applied}
                  cardAnim={state.cardAnim}
                  cardTick={state.cardTick}
                  applyLabel={s.field.applyLabel}
                  appliedNote={s.field.appliedNote}
                  onApply={() => {
                    onApplied(true)
                    notify(s.field.appliedNote)
                  }}
                  onUndo={() => {
                    onApplied(false)
                    notify('Cambio deshecho')
                  }}
                  onOtherVersion={state.otherVersion}
                  regions={{ root: PART.field, actions: PART.fieldActions, undo: PART.undo }}
                />
              ) : null}
            </AgentMessage>
          ) : null}

          {/* Las tarjetas del chat van sueltas bajo la respuesta, como en Suite AI. Envueltas: traen bordes y
              recortes propios que taparían su nombre. */}
          {c.result === 'card' ? (
            <div data-region={PART.card}>
              <ProposalCard onOpenProcesses={() => notify('Centro de procesos de Orbit')} />
            </div>
          ) : null}
          {c.result === 'plan' ? (
            <div data-region={PART.plan}>
              <ApprovalPlan {...state.approval} />
            </div>
          ) : null}
          {c.result === 'metrics' ? (
            <div data-region={PART.metrics}>
              <MetricsCard
                reminderSent={state.reminderSent}
                onSendReminder={() => {
                  state.setReminderSent(true)
                  notify('Recordatorio enviado a 24 personas')
                }}
              />
            </div>
          ) : null}
          {c.result === 'slot' ? bare ? <ResultBehind /> : <SlotArea name={PART.slot} hint={s.slot} className="min-h-40" /> : null}

          {c.typing ? <TypingIndicator region={PART.typing} /> : null}
        </MessageGroup>

        {c.shortcuts ? <AgentShortcuts region={PART.shortcuts} items={s.shortcuts} onPick={sent} /> : null}
      </AgentPanelBody>

      <ComposerTray data-region={PART.tray}>
        <Composer
          value={state.draft}
          onChange={state.setDraft}
          onSend={() => {
            sent(state.draft.trim())
            state.setDraft('')
          }}
          placeholder={s.placeholder}
          onVoice={() => notify('El modo voz se abre desde el chat de Orbit')}
          news={c.news}
          onDismissNews={() => onChange({ news: false })}
          onOpenNews={() => notify('Novedades de Orbit')}
          contextChip={c.chip ? s.chip : undefined}
          // Sin nota junto a la pastilla, como en el editor: a 452px no cabe y la franja «Contexto» ya lo explica.
          contextNote=""
          onRemoveContext={() => onChange({ chip: false })}
          attach={c.attach}
          voice={c.voice}
          regions={{
            news: PART.news,
            context: PART.chip,
            input: PART.input,
            attach: PART.attach,
            voice: PART.voice,
            send: PART.send,
          }}
        />
      </ComposerTray>
    </AgentPanelFrame>
  )
}

// Escenario completo: la pantalla de trabajo a la izquierda (slot) y el agente acoplado a la derecha. Cerrado, arriba
// de la pantalla queda «Orbit Flow», al final de la fila, a la derecha de su botón primario.
export function AgentPreview(props: Props) {
  const { c, s, names, onApplied, onChange, bare } = props
  const state = usePanelState(s, onApplied)
  const open = c.state === 'open'
  // Cerrar con la X o reabrir con «Orbit Flow» dentro de la vista previa: el foco pasa al botón o al panel que aparece.
  const previewRef = useRef<HTMLDivElement>(null)
  useAgentPanelFocus(previewRef, c.state)

  if (props.ruta) {
    // La pantalla de trabajo con la cabecera de página real: sus botones y, con el panel cerrado, «Orbit Flow» al final.
    const acciones = (
      <>
        <Button variant="outline" className={WS} onClick={() => notify(s.screenActions[0])}>
          {s.screenActions[0]}
        </Button>
        <Button className={WS} onClick={() => notify(s.screenActions[1])}>
          {s.screenActions[1]}
        </Button>
        {c.state === 'closed' ? (
          <ReopenAgentButton compact={c.reopen === 'orb'} onClick={() => onChange({ state: 'open' })} />
        ) : null}
      </>
    )
    return (
      <PantallaReal ruta={props.ruta} agente={open ? <Panel {...props} bare state={state} /> : null}>
        <div ref={previewRef} className="contents">
          <PageShell>
            <PageHeader
              breadcrumbs={props.ruta === '/admin' ? [{ label: 'Inicio', path: '/admin' }, { label: s.contextName }] : undefined}
              title={s.contextName}
              actions={acciones}
            />
            <PageContent>
              <ScreenBehind />
            </PageContent>
          </PageShell>
        </div>
      </PantallaReal>
    )
  }

  return (
    // `@container`: con poco ancho (portátil de 1024px) la pantalla de trabajo se aprieta para que el panel siga en 452px.
    <div
      ref={previewRef}
      className={cn(
        styles.preview,
        names && styles.named,
        open && styles.split,
        '@container flex rounded-2xl border bg-background text-foreground shadow-xs',
        bare ? 'min-w-0 flex-1' : 'min-h-176',
      )}
    >
      {/* Con los nombres visibles el slot baja 22px para su pastilla: se compensa abajo para que no quede descuadrado. */}
      <div className={cn('flex min-w-0 flex-1 flex-col gap-4 p-5 @max-[40rem]:p-3', names && 'pb-10.5 @max-[40rem]:pb-8.5')}>
        {c.state === 'closed' ? (
          // Alineados abajo: con los nombres visibles los botones de la pantalla bajan 22px para su pastilla.
          <div className="flex flex-wrap items-end justify-end gap-2.5">
            {/* Los botones de la pantalla no son del agente; «Orbit Flow» va siempre el último, a la derecha del primario. */}
            <div data-slot-region={PART.screenActions} className="flex items-center gap-2.5">
              <Button variant="outline" className={WS} onClick={() => notify(s.screenActions[0])}>
                {s.screenActions[0]}
              </Button>
              <Button className={WS} onClick={() => notify(s.screenActions[1])}>
                {s.screenActions[1]}
              </Button>
              <ReopenAgentButton region={PART.reopen} compact={c.reopen === 'orb'} onClick={() => onChange({ state: 'open' })} />
            </div>
          </div>
        ) : null}
        {bare ? <ScreenBehind /> : <SlotArea name={PART.screen} hint={s.screen} className="@max-[40rem]:px-2" />}
      </div>

      {open ? <Panel {...props} state={state} /> : null}
    </div>
  )
}
