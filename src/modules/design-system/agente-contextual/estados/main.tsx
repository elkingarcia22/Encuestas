import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, CircleLock01Icon, Megaphone02Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  IconTile,
  Progress,
  Spinner,
  ToggleGroup,
  ToggleGroupItem,
  cn,
} from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { PageContent, PageHeader, PageSection, PageShell } from '@/shared/components/PageShell'
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
import { KICKER, PILL, PILL_XS } from '../components/agent-styles'
import styles from '../components/agent.module.css'
import { useAgentThread } from '../components/use-agent-thread'

type AgentState = 'pensando' | 'aclarar' | 'confianza' | 'permiso' | 'error' | 'creditos' | 'listo'
// El panel se abre y se cierra (22 sep): ampliar y minimizar salieron, como en el editor de LMS y en el configurador.
type Mode = 'abierto' | 'cerrado'

const STATES: { value: AgentState; label: string }[] = [
  { value: 'pensando', label: 'Razonando' },
  { value: 'aclarar', label: 'Pregunta para aclarar' },
  { value: 'confianza', label: 'Poca confianza' },
  { value: 'permiso', label: 'Sin permiso' },
  { value: 'error', label: 'Error' },
  { value: 'creditos', label: 'Sin créditos' },
  { value: 'listo', label: 'Propuesta lista' },
]

const MODES: { value: Mode; label: string }[] = [
  { value: 'abierto', label: 'Abierto · 452px' },
  { value: 'cerrado', label: 'Cerrado' },
]

const THINK_STEPS = [
  'Leí el perfil del cargo Operario de planta',
  'Revisando 14 cursos del catálogo de seguridad',
  'Ordenando las lecciones por turno',
  'Armando la propuesta',
]

const CURRENT_LESSONS = ['Bienvenida a Planta Funza', 'Recorrido por la línea 3']

const PLANS = [
  ['Bienvenida a Planta Funza', 'Riesgos de tu línea y cómo reportarlos', 'Protocolo de seguridad y EPP', 'Operación de equipos del turno', 'Práctica guiada con tu líder', 'Evaluación y certificado de inducción'],
  ['Bienvenida y recorrido por la línea 3', 'Seguridad en planta: EPP, riesgos y reportes', 'Equipos del turno paso a paso', 'Semana acompañada con tu líder', 'Cierre: práctica corta y certificado'],
]

const REQUEST = 'Arma un plan de inducción para los operarios nuevos de planta'

// Caso · Estados del panel: lo que pasa cuando el agente piensa, duda, no puede o falla, y los modos del panel.
export function Component() {
  const [state, setState] = useState<AgentState>('pensando')
  const [mode, setMode] = useState<Mode>('abierto')
  const [tick, setTick] = useState(0)
  const [step, setStep] = useState(0)
  const [stopped, setStopped] = useState(false)
  const [requested, setRequested] = useState(false)
  const [version, setVersion] = useState(0)
  const [applied, setApplied] = useState(false)
  const [lessonsTick, setLessonsTick] = useState(0)
  const [publicando, setPublicando] = useState(false)
  const [publicado, setPublicado] = useState(false)
  const thread = useAgentThread()

  const panel: PanelState = mode === 'cerrado' ? 'closed' : 'open'

  const go = (next: AgentState) => {
    setState(next)
    setTick((t) => t + 1)
    setStopped(false)
    setRequested(false)
    if (next === 'pensando') setStep(0)
  }

  // Pensando: cada paso tarda un momento; al terminar pasa solo a la propuesta.
  useEffect(() => {
    if (state !== 'pensando' || stopped) return
    const done = step >= THINK_STEPS.length
    const id = window.setTimeout(
      () => {
        if (done) {
          setState('listo')
          setTick((t) => t + 1)
        } else {
          setStep((s) => s + 1)
        }
      },
      done ? 500 : 1300,
    )
    return () => window.clearTimeout(id)
  }, [state, step, stopped])

  const apply = () => {
    setApplied(true)
    setLessonsTick((t) => t + 1)
    notify('Plan aplicado al borrador', undefined, 'success')
  }

  const undo = () => {
    setApplied(false)
    setLessonsTick((t) => t + 1)
  }

  const lessons = applied ? PLANS[version] : CURRENT_LESSONS

  const actions = (primary: { label: string; onClick: () => void }, secondary?: { label: string; onClick: () => void }) => (
    // 13-oct: el orden de una fila es secundario y después primario, con el primario a la derecha.
    <div className="mt-4 flex flex-wrap items-center gap-2.5">
      {secondary ? (
        <Button variant="outline" className={PILL} onClick={secondary.onClick}>
          {secondary.label}
        </Button>
      ) : null}
      <Button data-undo-focus="" className={PILL} onClick={primary.onClick}>
        {primary.label}
      </Button>
    </div>
  )

  const body = {
    pensando: stopped ? (
      <>
        <AgentNote className="mt-4.5">Lo detuve. Lo que ya revisé se queda guardado en esta conversación.</AgentNote>
        {actions({ label: 'Continuar', onClick: () => setStopped(false) }, { label: 'Empezar de nuevo', onClick: () => go('pensando') })}
      </>
    ) : (
      <>
        <AgentThinking label={`${THINK_STEPS[Math.min(step, THINK_STEPS.length - 1)]}…`} className="mt-4.5" />
        <div className="mt-4 flex flex-col gap-3 rounded-[16px] border px-4 py-3.5">
          {THINK_STEPS.map((item, index) => (
            <div key={item} className="flex items-center gap-2.5">
              {/* El estado de cada paso se ve por el icono: para el lector va en texto. */}
              {index < step ? (
                <HugeiconsIcon icon={Tick02Icon} size={16} aria-hidden="true" className="shrink-0 text-primary" />
              ) : index === step ? (
                <Spinner aria-hidden="true" className="size-4 shrink-0" />
              ) : (
                <span aria-hidden="true" className="size-4 shrink-0 rounded-full border" />
              )}
              <span className={cn('text-sm', index <= step ? 'text-foreground/80' : 'text-muted-foreground')}>
                {item}
                <span className="sr-only">{index < step ? ' · hecho' : index === step ? ' · en curso' : ' · pendiente'}</span>
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Button variant="outline" className={PILL} onClick={() => setStopped(true)}>
            Detener
          </Button>
        </div>
      </>
    ),
    aclarar: (
      <>
        <div className="mt-4.5 text-sm leading-[1.55] text-foreground/80">
          Antes de armarlo necesito un dato: ¿para qué sede es la inducción? Cambian los equipos y el protocolo de seguridad.
        </div>
        <div className="mt-3.5 flex flex-wrap gap-2">
          {['Planta Funza', 'Planta Cota', 'Las dos sedes'].map((option) => (
            <Button key={option} variant="outline" className={PILL_XS} onClick={() => go('pensando')}>
              {option}
            </Button>
          ))}
        </div>
        <div className="mt-2.5 text-[13px] text-muted-foreground">O escríbelo en la caja de abajo.</div>
      </>
    ),
    confianza: (
      <>
        <AgentNote className="mt-4.5">Armé una propuesta, pero con poca información.</AgentNote>
        <div className="mt-4 flex items-start gap-2.5 rounded-[12px] bg-muted px-3.5 py-3">
          <HugeiconsIcon icon={Alert02Icon} size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-muted-foreground" />
          <span className="text-[13px] leading-normal text-muted-foreground">
            <span className="font-medium text-foreground">Confianza baja.</span> Solo encontré 2 cursos sobre montacargas y ninguno está
            actualizado a 2026. Revisa las lecciones 4 y 5 antes de aplicar.
          </span>
        </div>
        <ProposalCard className="mt-3" proposalLabel="Propuesta · confianza baja" proposal={<AgentList items={PLANS[1]} />} />
        {actions({ label: 'Buscar en otras fuentes', onClick: () => go('pensando') }, { label: 'Aplicar igual', onClick: () => { go('listo'); apply() } })}
      </>
    ),
    permiso: (
      <>
        <AgentCard className="mt-4.5" title="Sin acceso a un dato">
          <div className="flex items-start gap-3">
            <IconTile variant="soft" size="sm">
              <HugeiconsIcon icon={CircleLock01Icon} />
            </IconTile>
            <div className="text-sm leading-normal text-foreground/80">
              Para priorizar lecciones necesito las evaluaciones de desempeño de Planta Funza, y tu rol no puede verlas.
            </div>
          </div>
        </AgentCard>
        {requested ? (
          <UndoRow className="mt-4" onUndo={() => setRequested(false)}>
            Solicitud enviada a Laura Méndez · administradora
          </UndoRow>
        ) : (
          actions(
            { label: 'Pedir acceso a Laura Méndez', onClick: () => setRequested(true) },
            { label: 'Seguir sin ese dato', onClick: () => go('confianza') },
          )
        )}
      </>
    ),
    error: (
      <>
        <Alert variant="destructive" className="mt-4.5">
          <HugeiconsIcon icon={Alert02Icon} />
          <AlertTitle>No pude conectar con el catálogo de cursos</AlertTitle>
          <AlertDescription>Lo que llevaba no se perdió. Suele resolverse en unos segundos.</AlertDescription>
        </Alert>
        {actions({ label: 'Reintentar', onClick: () => go('pensando') }, { label: 'Reportar el problema', onClick: () => notify('Reporte enviado · código CAT-504', undefined, 'success') })}
        <div className="mt-3 tabular-nums text-[11px] text-muted-foreground">Código CAT-504 · 14 sept, 10:42</div>
      </>
    ),
    creditos: (
      <>
        <AgentCard className="mt-4.5" title="Créditos de Orbit">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm text-foreground/80">Usados este mes</span>
            <span className="tabular-nums text-[13px] tabular-nums">1.000 / 1.000</span>
          </div>
          <Progress value={100} aria-label="Créditos usados este mes" className="mt-2.5" />
          <div className="mt-2.5 text-[13px] leading-normal text-muted-foreground">
            Se renuevan el 1 de octubre. Mientras tanto puedes seguir editando el plan a mano.
          </div>
        </AgentCard>
        {requested ? (
          <UndoRow className="mt-4" onUndo={() => setRequested(false)}>
            Pediste 500 créditos a la administradora
          </UndoRow>
        ) : (
          actions({ label: 'Pedir más créditos', onClick: () => setRequested(true) }, { label: 'Ver consumo', onClick: () => notify('Consumo de créditos por persona', undefined, 'info') })
        )}
      </>
    ),
    listo: (
      <>
        <AgentNote className="mt-4.5">
          {applied ? 'Apliqué el plan. Puedes deshacerlo o pedir otra versión.' : 'Propuse un plan. Nada se guarda hasta que lo apliques.'}
        </AgentNote>
        <ProposalCard
          key={version}
          className="mt-4"
          anim="in"
          current={<AgentList items={CURRENT_LESSONS} />}
          proposalLabel={`Propuesta ${version + 1}/${PLANS.length}`}
          proposal={<AgentList items={PLANS[version]} />}
        />
        {applied ? (
          <UndoRow className="mt-4" onUndo={undo}>
            Aplicado a las lecciones del plan
          </UndoRow>
        ) : (
          actions(
            { label: 'Aplicar al plan', onClick: apply },
            { label: 'Otra versión', onClick: () => setVersion((v) => (v + 1) % PLANS.length) },
          )
        )}
        <AgentSuggestions
          className="mt-8"
          title="Sobre este plan"
          items={[
            { label: 'Agregar una evaluación final', onClick: () => thread.ask('Agrega una evaluación final', 'Sumé una evaluación de 5 preguntas al cierre. La ves en la lección 6.') },
            { label: 'Ajustar para el turno de noche', onClick: () => thread.ask('Ajústalo para el turno de noche', 'Moví la práctica guiada al inicio del turno y dejé el recorrido para el primer día hábil.') },
          ]}
        />
      </>
    ),
  }[state]

  return (
    <CaseFrame
      title="Estados del panel"
      hint="Razonando, dudas, límites y errores; abierto y cerrado"
      width="default"
      anatomy={false}
      back={{ label: 'Casos de Orbit', to: '/design-system/agente-contextual' }}
    >
      <AgentStage
        state={panel}
        onOpen={() => setMode('abierto')}
        pending={state === 'listo' && !applied}
        panel={
          <ContextPanel
            context={
              <>
                <span className="text-foreground">Inducción para operarios de planta</span> · lecciones
              </>
            }
            onClose={() => setMode('cerrado')}
            placeholder="Pide un cambio sobre el plan"
            onSend={(text) =>
              state === 'creditos'
                ? notify('Sin créditos hasta el 1 de octubre', undefined, 'warning')
                : thread.ask(text, 'Lo tengo en cuenta: ajusto la propuesta y te la muestro arriba.')
            }
            scrollKey={`${tick}-${thread.scrollKey}`}
          >
            <UserBubble>{REQUEST}</UserBubble>
            <div key={tick} className={styles.msgIn}>
              {body}
            </div>
            <AgentThread msgs={thread.msgs} thinking={thread.thinking} />
          </ContextPanel>
        }
      >
        <div className="px-8 py-6">
          <PageShell>
            <PageHeader
              breadcrumbs={[{ label: 'Aprendizaje', path: '/admin' }, { label: 'Planes de formación' }, { label: 'Inducción operarios' }]}
              title="Inducción de operarios"
              badge={<Badge variant="outline">Borrador</Badge>}
              description="Plan de tres semanas para quienes entran a Planta Funza."
              actions={
                <>
                  <Button variant="outline" className={WS} onClick={() => notify('Vista previa del plan', undefined, 'info')}>
                    Previsualizar
                  </Button>
                  {/* Publicar le llega a las personas del plan: pregunta antes (13-oct, regla «preguntar-antes»). */}
                  <Button className={WS} disabled={publicado} onClick={() => setPublicando(true)}>
                    {publicado ? 'Publicado' : 'Publicar'}
                  </Button>
                  {panel === 'closed' ? <ReopenAgentButton onClick={() => setMode('abierto')} /> : null}
                </>
              }
            />

            <PageContent>
              <Card className="gap-0! py-0!">
                <CardContent className="flex flex-col gap-4 px-5! py-4!">
                  <div className="flex flex-col gap-2">
                    <div id="estado-agente" className={`${KICKER} text-muted-foreground`}>
                      Qué le pasa al agente
                    </div>
                    <ToggleGroup
                      aria-labelledby="estado-agente"
                      value={[state]}
                      onValueChange={(value) => value[0] && go(value[0] as AgentState)}
                      variant="outline"
                      size="sm"
                      spacing={2}
                      className="flex-wrap justify-start"
                    >
                      {STATES.map((item) => (
                        <ToggleGroupItem key={item.value} value={item.value}>
                          {item.label}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div id="estado-panel" className={`${KICKER} text-muted-foreground`}>
                      Panel
                    </div>
                    <ToggleGroup
                      aria-labelledby="estado-panel"
                      value={[mode]}
                      onValueChange={(value) => value[0] && setMode(value[0] as Mode)}
                      variant="outline"
                      size="sm"
                      spacing={2}
                      className="flex-wrap justify-start"
                    >
                      {MODES.map((item) => (
                        <ToggleGroupItem key={item.value} value={item.value}>
                          {item.label}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </div>
                </CardContent>
              </Card>

              <PageSection title="Lecciones" description={applied ? 'Aplicadas desde la propuesta del agente.' : 'Borrador inicial, antes de pedir ayuda al agente.'}>
                <Card key={lessonsTick} className={cn('gap-0! py-0!', lessonsTick > 0 && styles.blurPulse)}>
                  {lessons.map((lesson, index) => (
                    <div key={lesson} className="flex items-center gap-4 border-b px-5 py-3.5 last:border-b-0">
                      <span className="tabular-nums text-[13px] text-muted-foreground tabular-nums">{String(index + 1).padStart(2, '0')}</span>
                      <span className="flex-1 text-sm">{lesson}</span>
                      <span className="text-[13px] text-muted-foreground">{10 + index * 5} min</span>
                    </div>
                  ))}
                </Card>
              </PageSection>
            </PageContent>
          </PageShell>
        </div>
      </AgentStage>

      <DialogoConfirmar
        abierto={publicando}
        onAbiertoChange={setPublicando}
        icono={Megaphone02Icon}
        titulo="¿Publicar el plan?"
        descripcion="Lo ven las personas a las que se asigna y deja de ser un borrador."
        cancelar="Todavía no"
        accion="Publicar plan"
        onConfirmar={() => {
          setPublicando(false)
          setPublicado(true)
          notify('Plan publicado', undefined, 'success')
        }}
      >
        <RegistroConfirmar nombre="Inducción de operarios" detalle={`Plan de tres semanas · ${lessons.length} lecciones`} estado="Borrador" tono="neutro" icono={Megaphone02Icon} />
      </DialogoConfirmar>
    </CaseFrame>
  )
}

Component.displayName = 'AgentStatesCasePage'
