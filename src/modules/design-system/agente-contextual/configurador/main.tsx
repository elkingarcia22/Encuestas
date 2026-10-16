import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Card } from '@ubits/flux-ui'
import { Text } from '@ubits/flux-ui'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import {
  AnatomyLegend,
  AnatomyStage,
  CasePicker,
  CaseSummary,
  Choice,
  ControlSection,
  PartsList,
  SwitchRow,
  TryButton,
  TryOnScreen,
} from '../../components/anatomy/anatomy-kit'
import { KICKER } from '../../drawers/components/drawer-styles'
import { AGENT_CASES, agentParts, type AgentConfig, type AgentResult } from './components/agent-config'
import { AgentPreview } from './components/agent-preview'
import { VerEnAccion } from '../../patrones/piezas'

const NOTE = 'text-[13px] leading-snug text-muted-foreground'

const RESULTS: { value: AgentResult; label: string }[] = [
  { value: 'none', label: 'Nada' },
  { value: 'field', label: 'Actual / Propuesta' },
  { value: 'card', label: 'Propuesta editable' },
  { value: 'plan', label: 'Plan con impacto' },
  { value: 'metrics', label: 'Métricas' },
  { value: 'slot', label: 'Slot libre' },
]

const RESULT_NOTE: Record<AgentResult, string> = {
  none: 'Solo el texto de la respuesta, con sus fuentes y acciones. Para explicar o resumir.',
  field: 'La propuesta del editor: lo de hoy arriba y lo propuesto abajo, con Aplicar y Otra versión. Al aplicar sale la fila para deshacer.',
  card: 'La tarjeta de propuesta del chat: se edita ahí mismo (título, contenidos, audiencia y fechas) antes de confirmar.',
  plan: 'El plan de aprobación del chat: pasos, a quién le llega y qué no se puede deshacer, antes de confirmar.',
  metrics: 'La tarjeta de métricas del chat: números con su fuente y las acciones que salen de ellos.',
  slot: 'Lo arma cada pantalla: una tabla, un documento o una comparación.',
}

const GUIDE = [
  {
    title: 'Usa Orbit Flow para',
    text: 'trabajar sobre lo que ya está abierto: un registro, un campo, una selección o un dato. Nunca saca a la persona de su pantalla.',
  },
  {
    title: 'Mejor el chat de Orbit cuando',
    text: 'la pregunta es abierta, cruza varios módulos o todavía no se sabe en qué pantalla está la respuesta.',
  },
  {
    title: 'Reglas que no cambian',
    text: 'El panel dice qué está mirando · nada se guarda sin que lo apliques · todo se puede deshacer · lo que tiene impacto pide confirmación.',
  },
  {
    title: 'Abierto o cerrado',
    text: 'Abierto, 452px pegado a la derecha y debajo del header, que se queda donde está. Cerrado, «Orbit Flow» al final de la fila de acciones, a la derecha del botón primario: completo por defecto, o solo el orbe cuando la pantalla ya viene muy cargada. Entra y sale deslizándose por la derecha mientras la pantalla se ensancha con él (se ve en «Estados del panel» y en las pantallas reales); si la persona pidió menos movimiento, cambia sin animación.',
  },
  {
    title: 'La conversación',
    text: 'Sigue al cerrar el panel y al volver a abrirlo. Esc lo cierra con el foco dentro. Mientras responde, «Detener» la corta. «Nueva conversación» guarda la de ahora y deja volver a ella. Si el agente tiene algo urgente, «Orbit Flow» trae un punto azul hasta abrirlo.',
  },
]

// Design system › Agente contextual: configurador del agente. La vista previa usa las piezas reales del panel del
// editor de LMS y del chat de Suite AI (mensajes, tarjetas y caja del chat); se elige un caso de uso y se prende o
// apaga cada opción. Lo que es del agente va con nombre; la pantalla de trabajo y lo que arma cada pantalla, como slot.
export function Component() {
  const navigate = useNavigate()
  const [caseId, setCaseId] = useState(AGENT_CASES[0].id)
  const current = AGENT_CASES.find((item) => item.id === caseId) ?? AGENT_CASES[0]
  const [config, setConfig] = useState<AgentConfig>(current.config)
  const [names, setNames] = useState(true)
  const [hot, setHot] = useState<string | null>(null)
  const [trying, setTrying] = useState(false)
  // La propuesta «Actual / Propuesta» ya aplicada: suma la fila para deshacer a la vista previa y a la lista de partes.
  const [applied, setApplied] = useState(false)
  // Cambia al elegir o restablecer un caso: la vista previa vuelve a empezar (versión 1, nada enviado).
  const [round, setRound] = useState(0)

  const change = (patch: Partial<AgentConfig>) => setConfig((prev) => ({ ...prev, ...patch }))
  const set =
    <K extends keyof AgentConfig>(key: K) =>
    (value: AgentConfig[K]) =>
      change({ [key]: value } as Partial<AgentConfig>)

  const restart = (next: AgentConfig) => {
    setConfig(next)
    setApplied(false)
    setRound((value) => value + 1)
  }

  const pick = (id: string) => {
    const next = AGENT_CASES.find((item) => item.id === id)
    if (!next) return
    setCaseId(next.id)
    restart(next.config)
  }

  const modified = (Object.keys(config) as (keyof AgentConfig)[]).some((key) => config[key] !== current.config[key])
  const open = config.state === 'open'

  return (
    <PageShell width="default">
      <PageHeader
        kicker="Design system · Orbit"
        title="Configurador del agente"
        description="El panel que acompaña una pantalla desde el borde derecho, armado con las mismas piezas del chat de Orbit. Lo azul con nombre es parte del agente y se ve igual en todos los casos; lo gris rayado es un slot: ahí va lo que cada pantalla necesite."
        actions={
          <>
            <VerEnAccion pagina="agente-contextual" />
            <TryButton onClick={() => setTrying(true)} />
          </>
        }
      />

      <PageContent className="@container gap-6">
        <AnatomyLegend names={names} onNamesChange={setNames} />

        <section className="flex flex-col gap-3">
          <div className={KICKER}>Casos de uso</div>
          <CasePicker cases={AGENT_CASES} value={caseId} onPick={pick} />
          <CaseSummary
            summary={current.summary}
            modified={modified}
            onReset={() => restart(current.config)}
            example={{ label: 'Ver el caso completo', onOpen: () => navigate(current.route) }}
          />
        </section>

        {/* Panel al lado de la vista previa solo si el contenido es ancho (se mide la columna, no la ventana). */}
        <div className="grid items-start gap-6 @min-[54rem]:grid-cols-[17.5rem_minmax(0,1fr)]">
          {/* Controles fijos al lado de la vista previa: alto máximo de la ventana y scroll propio, así se cambian las
              opciones sin perder de vista el resultado. */}
          <Card className="gap-0! py-0! @min-[54rem]:sticky @min-[54rem]:top-6 @min-[54rem]:max-h-[calc(100svh-6.75rem)] @min-[54rem]:overflow-y-auto! @min-[54rem]:overscroll-contain">
            <ControlSection title="Estado">
              <Choice
                value={config.state}
                onChange={set('state')}
                options={[
                  { value: 'open', label: 'Abierto · 452px' },
                  { value: 'closed', label: 'Cerrado' },
                ]}
              />
              {open ? null : (
                <>
                  <Choice
                    label="Orbit Flow"
                    value={config.reopen}
                    onChange={set('reopen')}
                    options={[
                      { value: 'full', label: 'Completo' },
                      { value: 'orb', label: 'Solo el orbe' },
                    ]}
                  />
                  <span className={NOTE}>
                    Va al final de la fila de acciones, a la derecha del botón primario. Completo por defecto; solo el orbe cuando la pantalla ya viene muy cargada (cabecera larga o botones con mucho texto). Lo
                    demás se vuelve a ver al abrir el panel.
                  </span>
                </>
              )}
            </ControlSection>

            <ControlSection title="Cabecera">
              <SwitchRow label="Cerrar" checked={config.close} onChange={set('close')} />
              <Text as="span" size="sm" variant="muted">
                El orbe y el nombre «Orbit Flow» van siempre.
              </Text>
            </ControlSection>

            <ControlSection title="Contexto">
              <SwitchRow label="Franja de contexto" checked={config.context} onChange={set('context')} />
            </ControlSection>

            <ControlSection title="Conversación">
              <SwitchRow label="Pedido" checked={config.request} onChange={set('request')} />
              <SwitchRow label="Respuesta" checked={config.answer} onChange={set('answer')} />
              <SwitchRow label="Razonando…" checked={config.typing} onChange={set('typing')} />
              {config.answer ? (
                <>
                  <SwitchRow label="Fuentes" checked={config.sources} onChange={set('sources')} />
                  <SwitchRow label="Acciones del mensaje" checked={config.actions} onChange={set('actions')} />
                  <SwitchRow label="Seguimientos" checked={config.followups} onChange={set('followups')} />
                  {config.typing ? (
                    <span className={NOTE}>
                      Con «Razonando…» la respuesta deja de ser la última: sus acciones salen al pasar el cursor y los
                      seguimientos se esconden, como en el chat.
                    </span>
                  ) : null}
                </>
              ) : (
                <span className={NOTE}>Fuentes, acciones y seguimientos van dentro de la respuesta: prende «Respuesta» para verlos.</span>
              )}
            </ControlSection>

            <ControlSection title="Resultado">
              <Choice value={config.result} onChange={set('result')} options={RESULTS} />
              <span className={NOTE}>
                {config.result === 'field' && !config.answer
                  ? 'La propuesta del editor va dentro de la respuesta: prende «Respuesta» para verla.'
                  : RESULT_NOTE[config.result]}
              </span>
            </ControlSection>

            <ControlSection title="Atajos">
              <SwitchRow label="«Sobre este contenido»" checked={config.shortcuts} onChange={set('shortcuts')} />
            </ControlSection>

            <ControlSection title="Caja del chat">
              <SwitchRow label="Novedad" checked={config.news} onChange={set('news')} />
              <SwitchRow label="Pastilla de contexto" checked={config.chip} onChange={set('chip')} />
              <SwitchRow label="Menú «+»" checked={config.attach} onChange={set('attach')} />
              <SwitchRow label="Voz" checked={config.voice} onChange={set('voice')} />
              <span className={NOTE}>La caja de texto y Enviar van siempre.</span>
            </ControlSection>
          </Card>

          <div className="flex min-w-0 flex-col gap-4">
            {/* Con la columna angosta (1024px) el escenario pierde aire a los lados para que el panel quepa en 452px. */}
            <AnatomyStage names={names} hot={hot} className="rounded-2xl border bg-muted/40 px-6 pt-10 pb-8 @max-[62rem]:px-3">
              <AgentPreview
                key={`${caseId}-${round}`}
                c={config}
                s={current.sample}
                names={names}
                applied={applied}
                onApplied={setApplied}
                onChange={change}
              />
            </AnatomyStage>
            {/* Los nombres necesitan sitio: se avisa para que nadie lea mal las medidas. */}
            {names ? (
              <span className={NOTE}>
                Con los nombres visibles algunas piezas ganan aire para que las pastillas no se encimen. Apágalos arriba para ver
                las medidas reales.
              </span>
            ) : null}
            <PartsList parts={agentParts(config, applied)} hot={hot} onHot={setHot} />
          </div>
        </div>

        {/* «Probar en pantalla»: el panel sobre la pantalla de trabajo, sin la anatomía y a tamaño real (452px).
            La maqueta toma el alto de la ventana menos la franja de la capa: así el hilo hace scroll dentro del panel. */}
        <TryOnScreen open={trying} onOpenChange={setTrying} title={current.title}>
          {/* Las rutas de ejemplo del design system no son del producto: esas se prueban sobre el Inicio. */}
          <AgentPreview
            key={`probar-${caseId}-${round}`}
            c={config}
            s={current.sample}
            names={false}
            applied={applied}
            onApplied={setApplied}
            onChange={change}
            bare
            ruta={current.route.startsWith('/admin') ? current.route : '/admin'}
          />
        </TryOnScreen>

        <section className="grid gap-3 md:grid-cols-2 @min-[62rem]:grid-cols-4">
          {GUIDE.map((item) => (
            <div key={item.title} className="rounded-xl border bg-card px-4 py-3.5">
              <div className="text-sm font-medium">{item.title}</div>
              <div className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.text}</div>
            </div>
          ))}
        </section>
      </PageContent>
    </PageShell>
  )
}

Component.displayName = 'DesignSystemAgentConfigPage'
