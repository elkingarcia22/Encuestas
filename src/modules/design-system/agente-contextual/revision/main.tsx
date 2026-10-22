import { useEffect, useRef, useState } from 'react'
import { Megaphone02Icon } from '@hugeicons/core-free-icons'
import { Button, Progress, cn } from '@ubits/flux-ui'
import { keepFocusNear } from '@/modules/admin/aprendizaje/lms-creator/components/agent-focus'
import { Badge } from '@/shared/components/Badge'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'
import { notify } from '@/shared/components/notify'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { WS } from '../../drawers/components/drawer-styles'
import { DialogoConfirmar, RegistroConfirmar } from '../../estados/confirmaciones'
import { CaseFrame } from '../../navegacion/components/case-frame'
import {
  AgentNote,
  AgentStage,
  AgentThinking,
  AgentThread,
  ContextPanel,
  ReopenAgentButton,
  UserBubble,
  type PanelState,
} from '../components/agent-kit'
import { AGENT_CARD, KICKER, PILL } from '../components/agent-styles'
import styles from '../components/agent.module.css'
import { useAgentThread } from '../components/use-agent-thread'
import { BLOCKS, ISSUES, type Issue, type Severity } from './components/data'
import { IssueCard, IssueMarker, ResolvedRow, type IssueState } from './components/issue-card'

const INITIAL_STATES = Object.fromEntries(ISSUES.map((issue) => [issue.id, 'open'])) as Record<string, IssueState>

const GROUPS: { severity: Severity; label: string }[] = [
  { severity: 'importante', label: 'Importante' },
  { severity: 'sugerencia', label: 'Sugerencia' },
]

const isOpen = (state: IssueState) => state === 'open' || state === 'fixing'

// Caso · Revisar antes de publicar: marcas numeradas en el documento y hallazgos por gravedad en el panel.
export function Component() {
  const [panel, setPanel] = useState<PanelState>('open')
  const [blocks, setBlocks] = useState(BLOCKS)
  const [phase, setPhase] = useState<'reviewing' | 'done'>('reviewing')
  const [round, setRound] = useState(0)
  const [states, setStates] = useState(INITIAL_STATES)
  const [flash, setFlash] = useState<string | null>(null)
  const [pulse, setPulse] = useState<{ block: string; tick: number } | null>(null)
  const [fixAll, setFixAll] = useState<{ done: number; total: number } | null>(null)
  const [publicando, setPublicando] = useState(false)
  const [publicada, setPublicada] = useState(false)
  const timers = useRef<number[]>([])
  const ticks = useRef(0)
  const thread = useAgentThread()

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }

  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), [])

  // La revisión arranca sola al abrir la página y cada vez que se pide de nuevo.
  useEffect(() => {
    const id = window.setTimeout(() => setPhase('done'), 1800)
    return () => window.clearTimeout(id)
  }, [round])

  const openImportant = ISSUES.filter((issue) => issue.severity === 'importante' && isOpen(states[issue.id])).length
  const resolved = ISSUES.filter((issue) => !isOpen(states[issue.id])).length
  const unresolved = ISSUES.length - resolved

  // Resolver, ignorar o reabrir cambia la tarjeta por la fila compacta (o al revés) y el botón usado desaparece: el foco
  // pasa al primer botón de lo que quedó en su lugar.
  const setState = (id: string, state: IssueState) => {
    setStates((current) => ({ ...current, [id]: state }))
    const hadFocus = document.getElementById(`hallazgo-${id}`)?.contains(document.activeElement)
    if (!hadFocus) return
    window.requestAnimationFrame(() => {
      const active = document.activeElement
      if (active && active !== document.body && active.isConnected) return
      document.getElementById(`hallazgo-${id}`)?.querySelector<HTMLElement>('button')?.focus()
    })
  }

  const replaceIn = (blockId: string, from: string, to: string) => {
    setBlocks((current) => current.map((block) => (block.id === blockId ? { ...block, text: block.text.replace(from, to) } : block)))
    ticks.current += 1
    setPulse({ block: blockId, tick: ticks.current })
  }

  const view = (issue: Issue) => {
    document.getElementById(`bloque-${issue.block}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setFlash(null)
    window.requestAnimationFrame(() => setFlash(issue.block))
    later(() => setFlash((current) => (current === issue.block ? null : current)), 1900)
  }

  const apply = (issue: Issue) => {
    replaceIn(issue.block, issue.before, issue.after)
    setState(issue.id, 'fixed')
  }

  const revert = (issue: Issue) => {
    if (states[issue.id] === 'fixed') replaceIn(issue.block, issue.after, issue.before)
    setState(issue.id, 'open')
  }

  const correctAll = () => {
    const queue = ISSUES.filter((issue) => isOpen(states[issue.id]))
    if (!queue.length) return
    setFixAll({ done: 0, total: queue.length })
    queue.forEach((issue, index) =>
      later(() => {
        document.getElementById(`bloque-${issue.block}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        apply(issue)
        setFixAll({ done: index + 1, total: queue.length })
      }, 500 + index * 750),
    )
    later(() => setFixAll(null), 500 + queue.length * 750 + 300)
  }

  const review = () => {
    timers.current.forEach((id) => window.clearTimeout(id))
    timers.current = []
    setBlocks(BLOCKS)
    setStates(INITIAL_STATES)
    setFixAll(null)
    setPhase('reviewing')
    setPanel('open')
    setRound((current) => current + 1)
  }

  // Publicar le llega a 1.240 personas: pregunta antes con DialogoConfirmar y RegistroConfirmar (regla «preguntar-antes»,
  // 13-oct; el aviso de «publicada» salía sin haber preguntado).
  const publish = () => setPublicando(true)

  const agentPanel = (
    <ContextPanel
      context={
        <>
          <span className="text-foreground">Política de trabajo remoto 2026</span> · 8 secciones
        </>
      }
      onClose={() => setPanel('closed')}
      placeholder="Pregunta sobre la revisión"
      onSend={(text) =>
        thread.ask(text, 'Lo tengo en cuenta en la próxima revisión. Pulsa «Revisar con IA» cuando termines de editar.')
      }
      // Sin la fase: al llegar los hallazgos el panel no baja, así se lee el resumen primero.
      scrollKey={`${round}-${thread.scrollKey}`}
    >
      <UserBubble>Revisa la política antes de publicarla.</UserBubble>

      {phase === 'reviewing' ? (
        <AgentThinking className="mt-4" label="Revisando 8 secciones…" />
      ) : (
        <div className={styles.msgIn}>
          <AgentNote className="mt-4">
            Encontré 3 problemas importantes y 2 sugerencias. «Publicar» queda bloqueado hasta resolver los importantes.
          </AgentNote>

          <div className={`${AGENT_CARD} mt-4`}>
            <div className="flex items-center justify-between gap-3 text-[13px]">
              <span className="font-medium tabular-nums">
                {resolved} de {ISSUES.length} resueltos
              </span>
              <span className="text-muted-foreground">
                {openImportant ? `${openImportant} importantes pendientes` : 'Sin pendientes importantes'}
              </span>
            </div>
            <Progress value={(resolved / ISSUES.length) * 100} aria-label="Hallazgos resueltos" className="mt-2.5 **:data-[slot=progress-track]:h-1.5!" />
            {fixAll ? (
              <AgentThinking className="mt-3" label={`Corrigiendo ${Math.min(fixAll.done + 1, fixAll.total)} de ${fixAll.total}…`} />
            ) : null}
          </div>

          {GROUPS.map((group) => {
            const list = ISSUES.filter((issue) => issue.severity === group.severity)
            const openCount = list.filter((issue) => isOpen(states[issue.id])).length
            return (
              <div key={group.severity} className="mt-6">
                <div className="flex items-center gap-2">
                  <h3 className={`${KICKER} text-muted-foreground`}>{group.label}</h3>
                  <Badge variant={group.severity === 'importante' ? 'warning-outline' : 'outline'} size="xs" className="tabular-nums">
                    {openCount}
                    <span className="sr-only"> pendientes</span>
                  </Badge>
                </div>
                <div className="mt-3 flex flex-col gap-2.5">
                  {list.map((issue) =>
                    isOpen(states[issue.id]) ? (
                      <IssueCard
                        key={issue.id}
                        issue={issue}
                        state={states[issue.id]}
                        onView={() => view(issue)}
                        onFix={() => {
                          setState(issue.id, 'fixing')
                          view(issue)
                        }}
                        onApply={() => apply(issue)}
                        onCancel={() => setState(issue.id, 'open')}
                        onIgnore={() => setState(issue.id, 'ignored')}
                      />
                    ) : (
                      <ResolvedRow key={issue.id} issue={issue} state={states[issue.id]} onRevert={() => revert(issue)} />
                    ),
                  )}
                </div>
              </div>
            )
          })}

          {unresolved && !fixAll ? (
            <div className="mt-5 flex items-center gap-2.5">
              <Button
                className={PILL}
                onClick={(event) => {
                  // El botón se va mientras corrige: el foco pasa al panel.
                  keepFocusNear(event.currentTarget)
                  correctAll()
                }}
              >
                Corregir todo
              </Button>
            </div>
          ) : null}

          {openImportant === 0 && !fixAll ? (
            <div className={styles.msgIn}>
              <AgentNote className="mt-6">
                {unresolved ? 'Ya puedes publicar. Las sugerencias que quedan son opcionales.' : 'Todo listo para publicar.'}
              </AgentNote>
              <Button className={`${PILL} mt-3`} disabled={publicada} onClick={publish}>
                {publicada ? 'Publicada' : 'Publicar'}
              </Button>
            </div>
          ) : null}
        </div>
      )}

      <AgentThread msgs={thread.msgs} thinking={thread.thinking} />
    </ContextPanel>
  )

  return (
    <CaseFrame
      title="Revisar antes de publicar"
      hint="Marcas numeradas en el documento y hallazgos por gravedad"
      width="default"
      anatomy={false}
      back={{ label: 'Casos de Orbit', to: '/design-system/agente-contextual' }}
    >
      <AgentStage state={panel} onOpen={() => setPanel('open')} pending={phase === 'done' && openImportant > 0} panel={agentPanel}>
        <div className="px-8 py-6">
          <PageShell>
            <PageHeader
              breadcrumbs={[{ label: 'Inicio', path: '/admin' }, { label: 'Desempeño y cultura' }, { label: 'Políticas' }, { label: 'Trabajo remoto 2026' }]}
              title="Trabajo remoto 2026"
              badge={
                <Badge variant="outline" className="font-normal">
                  Borrador
                </Badge>
              }
              meta={
                <>
                  <span>Versión 3</span>
                  <span>Editada hoy por Sara Gómez</span>
                </>
              }
              actions={
                <>
                  <Button className={WS} disabled={phase === 'reviewing' || openImportant > 0 || publicada} onClick={publish}>
                    {publicada ? 'Publicada' : 'Publicar'}
                  </Button>
                  {/* Acción de IA: secundario de IA (orbe, sin chispa) después del primario y antes de «Orbit» (auditoría 5-oct). */}
                  <BotonIaSecundario onClick={review}>Revisar con IA</BotonIaSecundario>
                  {panel === 'closed' ? <ReopenAgentButton onClick={() => setPanel('open')} compact /> : null}
                </>
              }
            />

            <PageContent>
              {phase === 'done' && openImportant > 0 ? (
                <div className={cn('text-sm text-muted-foreground', styles.msgIn)}>
                  «Publicar» se activa cuando resuelvas {openImportant === 1 ? 'el problema importante' : `los ${openImportant} problemas importantes`}.
                </div>
              ) : null}

              <article className="flex max-w-180 flex-col gap-3 pb-10 pl-8">
                {blocks.map((block) => {
                  const markers = phase === 'done' ? ISSUES.filter((issue) => issue.block === block.id && isOpen(states[issue.id])) : []
                  const pulsing = pulse?.block === block.id
                  return (
                    <section
                      key={block.id}
                      id={`bloque-${block.id}`}
                      className={cn('relative -mx-3 rounded-lg px-3 py-2.5', flash === block.id && styles.flash)}
                    >
                      {markers.length ? (
                        <div className={cn('absolute top-3 -left-6 flex flex-col gap-1', styles.msgIn)}>
                          {markers.map((issue) => (
                            <IssueMarker key={issue.id} issue={issue} />
                          ))}
                        </div>
                      ) : null}
                      <h2 className="text-base font-semibold">{block.title}</h2>
                      <div className="mt-1 text-[15px] leading-7">
                        <div key={pulsing ? pulse.tick : 'base'} className={cn('text-foreground/85', pulsing && styles.blurPulse)}>
                          {block.text}
                        </div>
                      </div>
                    </section>
                  )
                })}
              </article>
            </PageContent>
          </PageShell>
        </div>
      </AgentStage>

      <DialogoConfirmar
        abierto={publicando}
        onAbiertoChange={setPublicando}
        icono={Megaphone02Icon}
        titulo="¿Publicar la política?"
        descripcion="Les llega a todas las personas de la empresa y deja de ser un borrador."
        cancelar="Todavía no"
        accion="Publicar para 1.240 personas"
        enCurso="Publicando…"
        onConfirmar={() => {
          setPublicando(false)
          setPublicada(true)
          notify('Política publicada', '1.240 personas notificadas.', 'success')
        }}
      >
        <RegistroConfirmar nombre="Política de trabajo remoto 2026" detalle="8 secciones · versión 3" estado="Borrador" tono="neutro" icono={Megaphone02Icon} />
      </DialogoConfirmar>
    </CaseFrame>
  )
}

Component.displayName = 'AgentReviewCasePage'
