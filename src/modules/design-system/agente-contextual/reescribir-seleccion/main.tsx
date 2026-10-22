import { useEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Calendar03Icon, TextSelectionIcon } from '@hugeicons/core-free-icons'
import { Badge, Button, cn } from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { WS } from '../../drawers/components/drawer-styles'
import { DialogoConfirmar, RegistroConfirmar } from '../../estados/confirmaciones'
import { CaseFrame } from '../../navegacion/components/case-frame'
import {
  AgentCard,
  AgentList,
  AgentNote,
  AgentStage,
  AgentSuggestions,
  AgentThinking,
  AgentThread,
  ContextPanel,
  ProposalCard,
  ReopenAgentButton,
  UndoRow,
  UserBubble,
  type PanelState,
} from '../components/agent-kit'
import { PILL } from '../components/agent-styles'
import styles from '../components/agent.module.css'
import { useAgentThread } from '../components/use-agent-thread'
import { PARAGRAPHS, REQUESTS, TONES, VERSIONS, type RewriteKind } from './components/data'
import { RewriteToolbar } from './components/rewrite-toolbar'

type Job = {
  index: number
  group: 'mejorar' | 'acortar' | 'tono'
  request: string
  version: number
  original: string
  status: 'thinking' | 'ready' | 'applied'
  tick: number
}

// Caso · Reescribir una selección: barra flotante sobre el párrafo y propuesta con antes y después en el panel.
export function Component() {
  const [panel, setPanel] = useState<PanelState>('open')
  const [paragraphs, setParagraphs] = useState(PARAGRAPHS)
  const [selected, setSelected] = useState<number | null>(null)
  const [job, setJob] = useState<Job | null>(null)
  const [programando, setProgramando] = useState(false)
  const [programado, setProgramado] = useState(false)
  const [pulse, setPulse] = useState<{ index: number; tick: number } | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const articleRef = useRef<HTMLElement>(null)
  // Con «Seleccionar párrafo» (teclado o clic) el foco pasa a la barra flotante; seleccionando texto con el ratón no se
  // mueve, para no perder la selección.
  const focusToolbar = useRef(false)
  const thread = useAgentThread()

  useEffect(() => () => window.clearTimeout(timer.current), [])

  useEffect(() => {
    if (selected === null || !focusToolbar.current) return
    focusToolbar.current = false
    articleRef.current?.querySelector<HTMLElement>('[role="toolbar"] button')?.focus()
  }, [selected])

  const selectParagraph = (index: number) => {
    focusToolbar.current = true
    setSelected(index)
  }

  // Quitar la selección se lleva la barra: si el foco estaba en ella, vuelve al «Seleccionar párrafo» de ese párrafo.
  const clearSelection = () => {
    const index = selected
    const hadFocus = articleRef.current?.contains(document.activeElement)
    setSelected(null)
    if (index === null || !hadFocus) return
    window.requestAnimationFrame(() => articleRef.current?.querySelector<HTMLElement>(`[data-select-paragraph="${index}"]`)?.focus())
  }

  // Esc quita la selección, salvo que cierre el menú de Tono (ese Esc es del menú).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || selected === null || document.querySelector('[data-slot="dropdown-menu-content"]')) return
      clearSelection()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const run = (kind: RewriteKind, request?: string) => {
    if (selected === null) return
    const group = kind === 'mejorar' || kind === 'acortar' ? kind : 'tono'
    const tick = Date.now()
    setPanel('open')
    setJob({
      index: selected,
      group,
      request: request ?? REQUESTS[kind],
      version: group === 'tono' ? Math.max(0, TONES.findIndex((tone) => tone.kind === kind)) : 0,
      original: paragraphs[selected],
      status: 'thinking',
      tick,
    })
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setJob((current) => (current?.tick === tick ? { ...current, status: 'ready' } : current)), 1100)
  }

  const versions = job ? VERSIONS[job.index][job.group] : []
  const proposal = job ? versions[job.version] : ''
  const applied = job?.status === 'applied'

  const setParagraph = (index: number, text: string) => {
    setParagraphs((current) => current.map((item, i) => (i === index ? text : item)))
    setPulse({ index, tick: Date.now() })
  }

  const replace = () => {
    if (!job) return
    setParagraph(job.index, proposal)
    setJob({ ...job, status: 'applied' })
  }

  const undo = () => {
    if (!job) return
    setParagraph(job.index, job.original)
    setJob({ ...job, status: 'ready' })
  }

  const otherVersion = () => {
    if (!job) return
    setJob({ ...job, version: (job.version + 1) % versions.length, tick: Date.now() })
  }

  const ask = () => {
    if (selected === null) return
    setPanel('open')
    setJob(null)
    thread.push('agent', `¿Qué quieres saber o cambiar del párrafo ${selected + 1}? Escríbelo abajo y trabajo sobre ese texto.`)
    // El agente pide escribir abajo: el foco va a la caja del panel.
    window.requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-agent-panel] textarea')?.focus())
  }

  const send = (text: string) => {
    if (selected !== null) run('mejorar', text)
    else thread.ask(text, 'Selecciona primero el párrafo sobre el que quieres trabajar y lo hago ahí mismo.')
  }

  const onParagraphMouseUp = (index: number) => {
    if (window.getSelection()?.toString().trim()) setSelected(index)
  }

  const label = job ? (job.group === 'tono' ? `Tono ${TONES[job.version].label.toLowerCase()}` : `Propuesta ${job.version + 1}/${versions.length}`) : ''

  const spelling = (
    <AgentCard title="Ortografía y puntuación">
      <AgentList items={['Párrafo 2: «los dias» → «los días».', 'Párrafo 1: la frase «esto debido a…» queda mejor como una frase aparte.']} />
      <div className="mt-3 text-sm text-muted-foreground">Selecciona el párrafo y pulsa «Mejorar» para corregirlo.</div>
    </AgentCard>
  )

  const agentPanel = (
    <ContextPanel
      context={
        <span className="text-foreground">
          {selected !== null ? `Párrafo ${selected + 1} del aviso` : 'Aviso «Cambios en el horario de diciembre»'}
        </span>
      }
      onClose={() => setPanel('closed')}
      placeholder={selected !== null ? 'Pide un cambio sobre este párrafo' : 'Pregunta sobre el aviso'}
      onSend={send}
      scrollKey={`${job?.tick ?? 0}-${job?.status ?? ''}-${thread.scrollKey}`}
    >
      {!job ? (
        selected === null ? (
          <>
            <AgentNote>Selecciona un texto del aviso o usa «Seleccionar párrafo». Te propongo cambios y tú decides si reemplazas.</AgentNote>
            <AgentSuggestions
              className="mt-7"
              title="Sobre este aviso"
              items={[
                { label: 'Revisar ortografía de todo el aviso', onClick: () => thread.ask('Revisa la ortografía de todo el aviso.', spelling) },
                {
                  label: 'Hacerlo la mitad de largo',
                  onClick: () =>
                    thread.ask(
                      'Hazlo la mitad de largo.',
                      'Para acortarlo sin perder fechas ni horarios voy párrafo por párrafo: selecciona el primero y pulsa «Acortar».',
                    ),
                },
              ]}
            />
          </>
        ) : (
          <AgentNote>Tienes seleccionado el párrafo {selected + 1}. Usa la barra sobre el texto o pídeme algo aquí abajo.</AgentNote>
        )
      ) : (
        <>
          <UserBubble className={styles.msgIn}>{job.request}</UserBubble>
          {job.status === 'thinking' ? (
            <AgentThinking className="mt-4" label={`Reescribiendo el párrafo ${job.index + 1}…`} />
          ) : (
            <>
              <AgentNote className="mt-4">
                {applied ? 'Reemplacé el párrafo. Puedes deshacerlo cuando quieras.' : 'Propuse un cambio. El aviso no cambia hasta que lo reemplaces.'}
              </AgentNote>
              <ProposalCard key={job.tick} className="mt-4" current={job.original} proposal={proposal} proposalLabel={label} anim="in" />
              <div className="mt-4 flex items-center gap-2.5">
                {applied ? (
                  <Button data-undo-focus="" variant="outline" className={PILL} onClick={() => notify('El cambio ya está en el aviso', undefined, 'info')}>
                    Reemplazado
                  </Button>
                ) : (
                  <Button data-undo-focus="" className={PILL} onClick={replace}>
                    Reemplazar
                  </Button>
                )}
                <Button variant="outline" className={PILL} disabled={applied} onClick={otherVersion}>
                  Otra versión
                </Button>
              </div>
              {applied ? (
                <UndoRow className={cn('mt-3', styles.msgIn)} onUndo={undo}>
                  Reemplazado en el párrafo {job.index + 1}
                </UndoRow>
              ) : null}
            </>
          )}
        </>
      )}

      <AgentThread msgs={thread.msgs} thinking={thread.thinking} />
    </ContextPanel>
  )

  return (
    <CaseFrame
      title="Reescribir una selección"
      hint="Selecciona un párrafo: barra flotante y antes / después en el panel"
      width="default"
      anatomy={false}
      back={{ label: 'Casos de Orbit', to: '/design-system/agente-contextual' }}
    >
      <AgentStage state={panel} onOpen={() => setPanel('open')} pending={applied} panel={agentPanel}>
        <div className="px-8 py-6">
          <PageShell>
            <PageHeader
              breadcrumbs={[{ label: 'Inicio', path: '/admin' }, { label: 'Avisos internos', path: '/admin/avisos-internos' }, { label: 'Horario de diciembre' }]}
              title="Horario de diciembre"
              badge={
                <Badge variant="outline" className="font-normal">
                  Borrador
                </Badge>
              }
              meta={
                <>
                  <span>Para: todas las sedes · 1.240 personas</span>
                  <span>Programado: 1 dic, 8:00 a. m.</span>
                </>
              }
              actions={
                <>
                  <Button variant="outline" className={WS} onClick={() => notify('Vista previa del aviso', undefined, 'info')}>
                    Vista previa
                  </Button>
                  {/* Programar un envío a 1.240 personas pregunta antes (13-oct, regla «preguntar-antes»). */}
                  <Button className={WS} disabled={programado} onClick={() => setProgramando(true)}>
                    {programado ? 'Envío programado' : 'Programar envío'}
                  </Button>
                  {panel === 'closed' ? <ReopenAgentButton onClick={() => setPanel('open')} /> : null}
                </>
              }
            />

            <PageContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <HugeiconsIcon icon={TextSelectionIcon} size={16} aria-hidden="true" />
                Selecciona un texto o pasa el cursor por un párrafo para trabajarlo con el agente.
              </div>

              {/* Separación de 40px: la barra flotante cabe entre párrafos sin tapar el texto de arriba. */}
              <article ref={articleRef} className="flex max-w-170 flex-col gap-10 pt-6 pb-10">
                {paragraphs.map((text, index) => {
                  const isSelected = selected === index
                  const pulsing = pulse?.index === index
                  return (
                    <div key={index} className="group relative">
                      {isSelected ? (
                        <RewriteToolbar paragraph={index + 1} onRun={run} onAsk={ask} onClear={clearSelection} />
                      ) : (
                        <Button
                          data-select-paragraph={index}
                          aria-label={`Seleccionar párrafo ${index + 1}`}
                          variant="outline"
                          className="absolute -top-4 right-0 z-10 h-7! gap-1.5! rounded-full! px-2.5! text-xs font-normal! opacity-0 shadow-xs transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                          onClick={() => selectParagraph(index)}
                        >
                          <HugeiconsIcon icon={TextSelectionIcon} size={14} aria-hidden="true" />
                          Seleccionar párrafo
                        </Button>
                      )}
                      <div
                        data-paragraph={index}
                        onMouseUp={() => onParagraphMouseUp(index)}
                        className={cn('-mx-3 rounded-lg px-3 py-2 transition-colors duration-300', isSelected && 'bg-primary/10')}
                      >
                        <div className="text-[15px] leading-7">
                          <div key={pulsing ? pulse.tick : 'base'} className={cn('text-foreground/85', pulsing && styles.blurPulse)}>
                            {text}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div className="text-sm text-muted-foreground">Equipo de Gestión Humana · Meta Colombia</div>
              </article>
            </PageContent>
          </PageShell>
        </div>
      </AgentStage>

      <DialogoConfirmar
        abierto={programando}
        onAbiertoChange={setProgramando}
        icono={Calendar03Icon}
        titulo="¿Programar el envío?"
        descripcion="El aviso le llega por correo a todas las sedes el día programado. Hasta entonces puedes cambiarlo."
        cancelar="Todavía no"
        accion="Programar para 1.240 personas"
        onConfirmar={() => {
          setProgramando(false)
          setProgramado(true)
          notify('Envío programado', 'Sale el 1 de diciembre a las 8:00 a. m.', 'success')
        }}
      >
        <RegistroConfirmar nombre="Horario de diciembre" detalle="Aviso interno · todas las sedes" estado="1 dic, 8:00 a. m." tono="neutro" icono={Calendar03Icon} />
      </DialogoConfirmar>
    </CaseFrame>
  )
}

Component.displayName = 'AgentRewriteCasePage'
