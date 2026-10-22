import { useState } from 'react'
import { ArrowRight01Icon, Calendar03Icon } from '@hugeicons/core-free-icons'
import { Button, Text } from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { DialogoConfirmar, RegistroConfirmar } from '../../estados/confirmaciones'
import { CaseFrame } from '../../navegacion/components/case-frame'
import {
  AgentCard,
  AgentList,
  AgentNote,
  AgentStage,
  AgentThread,
  ContextPanel,
  UndoRow,
  UserBubble,
  type PanelState,
} from '../components/agent-kit'
import { KICKER, PILL } from '../components/agent-styles'
import { useAgentThread } from '../components/use-agent-thread'
import { ComparisonTable } from './components/comparison-table'
import { CANDIDATES, replyFor, type CandidateId } from './components/data'
import { FinalistsPage } from './components/finalists-page'

// Caso · Comparar opciones: comparar finalistas en una tabla y pasar a una a oferta con confirmación.
export function Component() {
  const [panel, setPanel] = useState<PanelState>('open')
  const [selected, setSelected] = useState<CandidateId[]>(['laura', 'andres', 'camila'])
  const [offer, setOffer] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [agendar, setAgendar] = useState(false)
  const [flash, setFlash] = useState<{ id: CandidateId; tick: number } | null>(null)
  const thread = useAgentThread()

  const compared = CANDIDATES.filter((candidate) => selected.includes(candidate.id))
  const withLaura = selected.includes('laura')

  const toggle = (id: CandidateId, checked: boolean) =>
    setSelected((current) =>
      checked ? CANDIDATES.map((candidate) => candidate.id).filter((item) => current.includes(item) || item === id) : current.filter((item) => item !== id),
    )

  // Lleva la página hasta la tarjeta de la finalista y la resalta.
  const focusCandidate = (id: CandidateId) => {
    setFlash({ id, tick: Date.now() })
    window.setTimeout(() => document.getElementById(`finalista-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80)
  }

  const sendOffer = () => {
    setConfirm(false)
    setOffer(true)
    focusCandidate('laura')
    notify('Laura Méndez pasó a Oferta', 'Se avisó a Andrés Pardo.', 'success')
  }

  const undoOffer = () => {
    setOffer(false)
    focusCandidate('laura')
    notify('Laura volvió a Entrevista final', undefined, 'info')
  }

  const agentPanel = (
    <ContextPanel
      context={
        <>
          <span className="text-foreground">Finalistas de Analista de datos</span> · {compared.length} en la comparación
        </>
      }
      onClose={() => setPanel('closed')}
      placeholder="Pregunta sobre las finalistas"
      onSend={(text) => thread.ask(text, replyFor(text))}
      // Al abrir, el panel arranca arriba (se ve la tabla); baja solo cuando llega algo nuevo.
      scrollKey={offer || thread.msgs.length ? `${thread.scrollKey}-${offer}` : undefined}
    >
      <UserBubble>Compara a las tres finalistas</UserBubble>
      <AgentNote className="mt-4.5">
        Las pongo lado a lado. Marca dos o tres para ver en qué se diferencian.
      </AgentNote>

      {compared.length < 2 ? (
        <AgentCard className="mt-4">
          <div className="text-sm leading-normal text-foreground/80">Marca al menos dos finalistas en la página para compararlas.</div>
        </AgentCard>
      ) : (
        <>
          <ComparisonTable candidates={compared} className="mt-4" />

          <AgentCard title="Recomendación" className="mt-4">
            {withLaura ? (
              <>
                <div className="text-sm font-medium">Laura Méndez</div>
                <div className="mt-1 text-sm leading-normal text-foreground/80">
                  Es la más equilibrada para el cargo: mejor prueba de SQL, mejor entrevista y referencias verificadas.
                </div>
                <AgentList
                  className="mt-3"
                  items={[
                    'Gana en 3 de 6 criterios y no queda última en ninguno.',
                    'Pide 11 % más que el tope del rango; Camila está dentro, pero tiene 2 años de experiencia.',
                    'Puede empezar en 15 días, antes del cierre del trimestre.',
                  ]}
                />
              </>
            ) : (
              <div className="text-sm leading-normal text-foreground/80">
                Sin Laura, Andrés queda primero por experiencia y Camila por costo. Con esta información no recomiendo a ninguno todavía.
              </div>
            )}
            <div className="mt-4 rounded-[12px] bg-muted px-3.5 py-3">
              <h4 className={`${KICKER} mb-2.5 text-muted-foreground`}>Lo que no sé</h4>
              <AgentList
                items={[
                  'Andrés no tiene referencias verificadas: su 4,1 en la entrevista podría cambiar.',
                  'La evaluación cultural de Camila sigue sin enviar.',
                ]}
              />
            </div>
          </AgentCard>

          {/* Orden de una fila (13-oct, I-464): primero el secundario y a la derecha el primario. */}
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <Button variant="outline" className={PILL} onClick={() => setAgendar(true)}>
              Agendar segunda entrevista
            </Button>
            {withLaura ? (
              offer ? (
                <Button data-undo-focus="" variant="outline" className={PILL} onClick={() => focusCandidate('laura')}>
                  Laura en oferta
                </Button>
              ) : (
                <Button data-undo-focus="" className={PILL} onClick={() => setConfirm(true)}>
                  Pasar a Laura a oferta
                </Button>
              )
            ) : null}
          </div>
          {offer ? (
            <UndoRow className="mt-3" onUndo={undoOffer}>
              Laura pasó a Oferta · se avisó a Andrés Pardo
            </UndoRow>
          ) : null}
        </>
      )}

      <AgentThread msgs={thread.msgs} thinking={thread.thinking} thinkingLabel="Revisando a las finalistas…" />
    </ContextPanel>
  )

  return (
    <CaseFrame
      title="Comparar opciones"
      hint="Compara en una tabla y lo que tiene impacto pide confirmación"
      width="default"
      anatomy={false}
      back={{ label: 'Casos de Orbit', to: '/design-system/agente-contextual' }}
    >
      <AgentStage state={panel} onOpen={() => setPanel('open')} panel={agentPanel}>
        <div className="px-8 py-6">
          <FinalistsPage
            selected={selected}
            onToggle={toggle}
            offer={offer}
            flash={flash}
            agentClosed={panel === 'closed'}
            onOpenAgent={() => setPanel('open')}
          />
        </div>
      </AgentStage>

      {/* Confirmar un cambio que avisa a otras personas va en DialogoConfirmar con RegistroConfirmar (regla «dos-ventanas»,
          13-oct; antes era un ActionDialog con la finalista en la primera línea): título fijo y la finalista en la tarjeta. */}
      <DialogoConfirmar
        abierto={confirm}
        onAbiertoChange={setConfirm}
        icono={ArrowRight01Icon}
        titulo="¿Pasar a oferta?"
        descripcion="Se mueve a la etapa Oferta, se avisa a Andrés Pardo (responsable de la vacante) y la candidata recibe un correo para agendar la llamada."
        cancelar="Todavía no"
        accion="Pasar a oferta"
        onConfirmar={sendOffer}
      >
        <RegistroConfirmar nombre="Laura Méndez" detalle="Analista de datos · Entrevista final" estado="Pasa a Oferta" tono="neutro" />
        <Text size="sm" variant="muted">
          Andrés Castaño y Camila Rojas siguen en Entrevista final.
        </Text>
      </DialogoConfirmar>

      {/* Agendar envía invitaciones a las finalistas: también pregunta antes (13-oct). */}
      <DialogoConfirmar
        abierto={agendar}
        onAbiertoChange={setAgendar}
        icono={Calendar03Icon}
        titulo="¿Agendar la segunda entrevista?"
        descripcion="Se envía la invitación para el 18 sept a las finalistas que compares."
        cancelar="Todavía no"
        accion={`Enviar ${compared.length} invitaciones`}
        onConfirmar={() => {
          setAgendar(false)
          notify('Invitaciones enviadas', `Segunda entrevista el 18 sept para ${compared.length} finalistas.`, 'success')
        }}
      >
        <RegistroConfirmar nombre="Analista de datos" detalle={`Segunda entrevista · ${compared.length} finalistas`} estado="18 sept" tono="neutro" icono={Calendar03Icon} />
      </DialogoConfirmar>
    </CaseFrame>
  )
}

Component.displayName = 'AgentCompareCasePage'
