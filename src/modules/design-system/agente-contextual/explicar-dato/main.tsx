import { useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Calendar03Icon, ChartUpIcon, Download04Icon } from '@hugeicons/core-free-icons'
import { Button } from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { WS } from '../../drawers/components/drawer-styles'
import { CaseFrame } from '../../navegacion/components/case-frame'
import {
  AgentNote,
  AgentStage,
  AgentSuggestions,
  AgentThinking,
  AgentThread,
  ContextPanel,
  ReopenAgentButton,
  UserBubble,
  type PanelState,
} from '../components/agent-kit'
import styles from '../components/agent.module.css'
import { useAgentThread } from '../components/use-agent-thread'
import { AreaCard, KpiGrid, RotationChart } from './components/dashboard'
import { topicFor } from './components/data'
import { AreaAnswer, DatumAnswer } from './components/datum-answer'

// Cada dato preguntado abre un tema; lo que se escribe en la caja queda debajo del tema de ese momento.
type Entry = { key: number; id: string; question: string; msgStart: number; ready: boolean }

// Caso · Explicar un dato: el panel toma como contexto el indicador o la barra que tocas.
export function Component() {
  const [panel, setPanel] = useState<PanelState>('open')
  const [selected, setSelected] = useState<string | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [alerts, setAlerts] = useState<Record<number, boolean>>({})
  const thread = useAgentThread()
  const seq = useRef(0)

  const current = entries.at(-1)
  const topic = current ? topicFor(current.id) : null

  const ask = (id: string, question?: string) => {
    setPanel('open')
    setSelected(id)
    if (current?.id === id) return
    seq.current += 1
    const key = seq.current
    setEntries((list) => [...list, { key, id, question: question ?? topicFor(id).question, msgStart: thread.msgs.length, ready: false }])
    window.setTimeout(() => setEntries((list) => list.map((entry) => (entry.key === key ? { ...entry, ready: true } : entry))), 1300)
  }

  const send = (text: string) =>
    thread.ask(text, () =>
      topic
        ? `Sobre ${topic.label.toLowerCase()}: ${topic.lead} Si quieres, lo abro por área o preparo una conversación con el líder de Operaciones.`
        : 'Toca un dato del tablero o dime cuál te interesa, y te explico qué lo mueve.',
    )

  const readyCount = entries.filter((entry) => entry.ready).length
  const alertCount = Object.values(alerts).filter(Boolean).length

  const agentPanel = (
    <ContextPanel
      context={<span className="text-foreground">{topic ? topic.label : 'Tablero Rotación y clima'}</span>}
      contextIcon={ChartUpIcon}
      onClose={() => setPanel('closed')}
      placeholder="Pregunta sobre este dato"
      onSend={send}
      scrollKey={`${entries.length}-${readyCount}-${alertCount}-${thread.scrollKey}`}
    >
      <AgentNote>Toca cualquier dato del tablero y te explico qué lo mueve.</AgentNote>
      {entries.length === 0 ? (
        <AgentSuggestions
          className="mt-6"
          title="Para empezar"
          items={[
            { label: '¿Por qué subió la rotación en agosto?', onClick: () => ask('mes-ago') },
            { label: '¿Qué área preocupa más?', onClick: () => thread.ask('¿Qué área preocupa más?', () => <AreaAnswer />) },
          ]}
        />
      ) : null}
      <AgentThread msgs={thread.msgs.slice(0, entries[0]?.msgStart)} />

      {entries.map((entry, index) => {
        const entryTopic = topicFor(entry.id)
        return (
          <div key={entry.key}>
            {index > 0 ? (
              <div className={`my-6 flex items-center gap-3 text-xs text-muted-foreground ${styles.msgIn}`}>
                <span aria-hidden="true" className="h-px flex-1 bg-border" />
                Cambiaste a {entryTopic.label.toLowerCase()}
                <span aria-hidden="true" className="h-px flex-1 bg-border" />
              </div>
            ) : (
              <div className="h-5" />
            )}
            <UserBubble className={styles.msgIn}>{entry.question}</UserBubble>
            <div className="mt-3.5">
              {entry.ready ? (
                <DatumAnswer
                  topic={entryTopic}
                  alertOn={Boolean(alerts[entry.key])}
                  onAlert={() => setAlerts((current) => ({ ...current, [entry.key]: true }))}
                  onUndoAlert={() => setAlerts((current) => ({ ...current, [entry.key]: false }))}
                />
              ) : (
                <AgentThinking label="Revisando retiros, encuestas y nómina…" />
              )}
            </div>
            <AgentThread msgs={thread.msgs.slice(entry.msgStart, entries[index + 1]?.msgStart)} />
          </div>
        )
      })}
      {thread.thinking ? <AgentThinking className="mt-4" /> : null}
    </ContextPanel>
  )

  return (
    <CaseFrame
      title="Explicar un dato"
      hint="El panel toma como contexto el indicador o la barra que tocas"
      width="default"
      anatomy={false}
      back={{ label: 'Casos de Orbit Flow', to: '/design-system/agente-contextual' }}
    >
      <AgentStage state={panel} onOpen={() => setPanel('open')} panel={agentPanel}>
        <div className="@container px-8 py-6">
          <PageShell>
            <PageHeader
              breadcrumbs={[{ label: 'Inicio', path: '/admin' }, { label: 'Desempeño y cultura' }, { label: 'Rotación y clima' }]}
              title="Rotación y clima"
              description="Cómo se mueve la gente en Meta Colombia. Pasa el cursor por un dato y pregúntale al agente."
              actions={
                <>
                  <Button variant="outline" className={WS} onClick={() => notify('Periodo: marzo a septiembre 2026')}>
                    <HugeiconsIcon icon={Calendar03Icon} size={16} />
                    Mar – Sep 2026
                  </Button>
                  <Button variant="outline" className={WS} onClick={() => notify('Exportando el tablero a Excel')}>
                    <HugeiconsIcon icon={Download04Icon} size={16} />
                    Exportar
                  </Button>
                  {panel === 'closed' ? <ReopenAgentButton onClick={() => setPanel('open')} /> : null}
                </>
              }
            />
            <PageContent className="gap-4">
              <KpiGrid selected={selected} onAsk={ask} />
              <div className="grid gap-4 @4xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
                <RotationChart selected={selected} onAsk={ask} />
                <AreaCard />
              </div>
            </PageContent>
          </PageShell>
        </div>
      </AgentStage>
    </CaseFrame>
  )
}

Component.displayName = 'AgentExplainCasePage'
