import { useState } from 'react'
import { Badge, Button, Progress } from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { CaseFrame } from '../../navegacion/components/case-frame'
import {
  AgentCard,
  AgentList,
  AgentNote,
  AgentStage,
  AgentSuggestions,
  AgentThread,
  ContextPanel,
  SourcePills,
  UndoRow,
  UserBubble,
  type PanelState,
} from '../components/agent-kit'
import { KICKER, PILL } from '../components/agent-styles'
import { useAgentThread } from '../components/use-agent-thread'
import {
  INITIAL_NOTES,
  QUESTIONS,
  REQUIREMENTS,
  RISKS,
  SECTION_TAB,
  STRENGTHS,
  SUMMARY_NOTE,
  replyFor,
  type Note,
  type SectionId,
  type TabId,
} from './components/data'
import { Findings } from './components/findings'
import { ProfilePage, type Flash } from './components/profile-page'

const STATUS_VARIANT = { Cumple: 'success-outline', Parcial: 'warning-outline', 'Por validar': 'outline' } as const

// Caso · Resumen de un registro: el agente resume a una candidata con fuentes que se resaltan en la ficha.
export function Component() {
  const [panel, setPanel] = useState<PanelState>('open')
  const [tab, setTab] = useState<TabId>('cv')
  const [flash, setFlash] = useState<Flash>(null)
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES)
  const [savedId, setSavedId] = useState<number | null>(null)
  const thread = useAgentThread()

  // Lleva la ficha a la sección citada: cambia de pestaña, baja hasta ella y la resalta.
  const focusSection = (section: SectionId) => {
    setTab(SECTION_TAB[section])
    setFlash({ id: section, tick: Date.now() })
    window.setTimeout(() => document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
  }

  const saveNote = () => {
    if (savedId !== null) {
      focusSection('notas')
      return
    }
    const id = Date.now()
    setNotes((current) => [...current, { id, author: 'Orbit', date: 'Hoy, 10:24 a. m.', text: SUMMARY_NOTE, agent: true }])
    setSavedId(id)
    focusSection('notas')
  }

  const undoNote = () => {
    setNotes((current) => current.filter((note) => note.id !== savedId))
    setSavedId(null)
    notify('Nota eliminada de la ficha')
  }

  const reply = (question: string) => {
    const answer = replyFor(question)
    return (
      <>
        <div className="text-sm leading-[1.55] text-foreground/80">{answer.text}</div>
        {answer.sources.length ? (
          <SourcePills
            className="mt-2.5"
            sources={answer.sources.map((source) => ({ label: source.label, onClick: () => focusSection(source.section) }))}
          />
        ) : null}
      </>
    )
  }

  const agentPanel = (
    <ContextPanel
      context={
        <>
          <span className="text-foreground">Hoja de vida de Laura Méndez</span> · Analista de datos
        </>
      }
      onClose={() => setPanel('closed')}
      placeholder="Pregunta sobre esta candidata"
      onSend={(text) => thread.ask(text, () => reply(text))}
      // Al abrir, el panel arranca arriba (se lee el pedido); baja solo cuando llega algo nuevo.
      scrollKey={savedId !== null || thread.msgs.length ? `${thread.scrollKey}-${savedId}` : undefined}
    >
      <UserBubble>Resúmeme a esta candidata para el comité</UserBubble>
      <AgentNote className="mt-4.5">Leí la hoja de vida, la entrevista técnica y la prueba de SQL. Toca una fuente para verla en la ficha.</AgentNote>

      <AgentCard title="Resumen" className="mt-4">
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-foreground/80">Encaje con el cargo</span>
          <span className="font-medium tabular-nums">82%</span>
        </div>
        <Progress value={82} aria-label="Encaje con el cargo" className="mt-2 **:data-[slot=progress-track]:h-1.5!" />

        <h4 className={`${KICKER} mt-5 mb-3 text-muted-foreground`}>Fortalezas</h4>
        <Findings items={STRENGTHS} onSource={focusSection} />

        <h4 className={`${KICKER} mt-5 mb-3 text-muted-foreground`}>Riesgos</h4>
        <Findings items={RISKS} risk onSource={focusSection} />
      </AgentCard>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <Button className={PILL} onClick={() => notify('Resumen copiado · listo para pegar en el acta del comité')}>
          Copiar para el comité
        </Button>
        <Button data-undo-focus="" variant="outline" className={PILL} onClick={saveNote}>
          {savedId !== null ? 'Ver la nota' : 'Guardar como nota'}
        </Button>
      </div>
      {savedId !== null ? (
        <UndoRow className="mt-3" onUndo={undoNote}>
          Guardado en Notas de entrevista
        </UndoRow>
      ) : null}

      <AgentThread msgs={thread.msgs} thinking={thread.thinking} thinkingLabel="Buscando en la ficha…" />

      <AgentSuggestions
        title="Sobre esta candidata"
        className="mt-8.5"
        items={[
          {
            label: '¿Qué preguntar en la segunda entrevista?',
            onClick: () =>
              thread.ask(
                '¿Qué preguntar en la segunda entrevista?',
                <AgentCard title="Para la segunda entrevista">
                  <AgentList items={QUESTIONS} />
                </AgentCard>,
              ),
          },
          {
            label: 'Comparar con el perfil del cargo',
            onClick: () =>
              thread.ask(
                'Compárala con el perfil del cargo',
                <AgentCard title="Perfil del cargo · Analista de datos">
                  <div className="flex flex-col divide-y">
                    {REQUIREMENTS.map((requirement) => (
                      <div key={requirement.text} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                        <span className="text-sm text-foreground/80">{requirement.text}</span>
                        <Badge variant={STATUS_VARIANT[requirement.status]} className="shrink-0 font-normal">
                          {requirement.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </AgentCard>,
              ),
          },
        ]}
      />
    </ContextPanel>
  )

  return (
    <CaseFrame
      title="Resumen de un registro"
      hint="El agente resume con fuentes y señala en la ficha de dónde sale cada dato"
      width="default"
      anatomy={false}
      back={{ label: 'Casos de Orbit Flow', to: '/design-system/agente-contextual' }}
    >
      <AgentStage state={panel} onOpen={() => setPanel('open')} panel={agentPanel}>
        <div className="px-8 py-6">
          <ProfilePage
            tab={tab}
            onTabChange={setTab}
            flash={flash}
            notes={notes}
            agentClosed={panel === 'closed'}
            onOpenAgent={() => setPanel('open')}
          />
        </div>
      </AgentStage>
    </CaseFrame>
  )
}

Component.displayName = 'AgentSummaryCasePage'
