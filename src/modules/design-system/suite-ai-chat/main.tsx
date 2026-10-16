import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Card } from '@ubits/flux-ui'
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
} from '../components/anatomy/anatomy-kit'
import { KICKER } from '../drawers/components/drawer-styles'
import { CHAT_CASES, chatParts, type ChatConfig, type ChatResult } from './components/chat-config'
import { ChatPreview } from './components/chat-preview'

const NOTE = 'text-[13px] leading-snug text-muted-foreground'

const RESULTS: { value: ChatResult; label: string }[] = [
  { value: 'none', label: 'Nada' },
  { value: 'proposal', label: 'Propuesta editable' },
  { value: 'plan', label: 'Plan con impacto' },
  { value: 'metrics', label: 'Métricas' },
  { value: 'slot', label: 'Slot libre' },
]

const RESULT_NOTE: Record<ChatResult, string> = {
  none: 'Solo el texto de la respuesta, con sus fuentes y acciones. Es el caso más común.',
  proposal: 'Un borrador que se ajusta ahí mismo (título, contenidos, audiencia y fechas) antes de confirmarlo.',
  plan: 'Los pasos, a quién le llega y qué no se puede deshacer. Lo que tiene efecto real pide confirmación.',
  metrics: 'Números con su fuente y las acciones que salen de ellos.',
  slot: 'Lo arma cada conversación: una tabla, un documento o una comparación.',
}

const ACTIVITY: { value: ChatConfig['activity']; label: string }[] = [
  { value: 'open', label: 'Abierto' },
  { value: 'closed', label: 'Cerrado' },
  { value: 'none', label: 'Sin panel' },
]

const ACTIVITY_NOTE: Record<ChatConfig['activity'], string> = {
  open: 'Ocupa la derecha de arriba abajo y empuja la conversación. Solo cuando el agente está haciendo algo que tarda.',
  closed: 'Una pastilla arriba a la derecha lo vuelve a abrir. El trabajo sigue corriendo aunque no se vea.',
  none: 'La conversación sola, a todo el ancho. Es lo normal cuando la respuesta es inmediata.',
}

const GUIDE = [
  {
    title: 'Usa el chat de Orbit para',
    text: 'preguntas abiertas, que cruzan varios módulos o cuando todavía no se sabe en qué pantalla está la respuesta.',
  },
  {
    title: 'Mejor Orbit Flow cuando',
    text: 'el trabajo es sobre lo que ya está abierto: un registro, un campo o una selección. Ahí no conviene sacar a nadie de su pantalla.',
  },
  {
    title: 'Reglas que no cambian',
    text: 'La respuesta dice de dónde salió · nada con efecto real se ejecuta sin confirmación · se ve en qué va el agente · todo mensaje se puede editar y repetir.',
  },
  {
    title: 'El saludo',
    text: 'Uno por día y solo en una conversación nueva. Entra animado una vez; no se repite al volver, para no distraer.',
  },
]

export function Component() {
  const [caseId, setCaseId] = useState(CHAT_CASES[0].id)
  const current = CHAT_CASES.find((item) => item.id === caseId) ?? CHAT_CASES[0]
  const [config, setConfig] = useState<ChatConfig>(current.config)
  const [names, setNames] = useState(true)
  const [hot, setHot] = useState<string | null>(null)
  const [tryOpen, setTryOpen] = useState(false)
  const navigate = useNavigate()

  const pickCase = (id: string) => {
    const next = CHAT_CASES.find((item) => item.id === id)
    if (!next) return
    setCaseId(id)
    setConfig(next.config)
  }

  const set = <K extends keyof ChatConfig>(key: K, value: ChatConfig[K]) => setConfig((prev) => ({ ...prev, [key]: value }))
  const modified = JSON.stringify(config) !== JSON.stringify(current.config)

  return (
    <PageShell>
      <PageHeader
        kicker="Design system · Orbit"
        title="Chat"
        description="La conversación de Orbit pieza por pieza. Lo azul con nombre es parte del componente y se ve igual en todas las conversaciones; lo gris rayado es un slot, el espacio libre donde va lo que cada respuesta necesite."
        actions={<TryButton onClick={() => setTryOpen(true)} />}
      />
      <PageContent className="flex flex-col gap-6">
        <AnatomyLegend names={names} onNamesChange={setNames} />

        <div className="flex flex-col gap-3">
          <span className={KICKER}>Casos de uso</span>
          <CasePicker cases={CHAT_CASES} value={caseId} onPick={pickCase} label="Casos de uso del chat" />
          <CaseSummary
            summary={current.summary}
            modified={modified}
            onReset={() => setConfig(current.config)}
            example={{ label: 'Ver pantalla completa', onOpen: () => navigate(current.route) }}
          />
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
          {/* Panel de controles, fijo al lado de la vista previa. */}
          <Card className="flex max-h-[calc(100svh-6rem)] flex-col gap-0 overflow-y-auto p-0 lg:sticky lg:top-20">
            <ControlSection title="La conversación">
              <SwitchRow label="Saludo del día" checked={config.greeting} onChange={(v) => set('greeting', v)} />
              <p className={NOTE}>Solo en una conversación nueva, en vez de mensajes.</p>
              <SwitchRow label="Mensaje de la persona" checked={config.request} onChange={(v) => set('request', v)} />
              <SwitchRow label="Respuesta del agente" checked={config.answer} onChange={(v) => set('answer', v)} />
              <SwitchRow label="Razonando" checked={config.typing} onChange={(v) => set('typing', v)} />
              <p className={NOTE}>Mientras trabaja: el orbe, el texto con brillo y los segundos. Sustituye a la respuesta: no se muestran las dos a la vez.</p>
            </ControlSection>

            <ControlSection title="Qué trae la respuesta">
              <SwitchRow label="Fuentes" checked={config.sources} onChange={(v) => set('sources', v)} />
              <SwitchRow label="Acciones" checked={config.actions} onChange={(v) => set('actions', v)} />
              <SwitchRow label="Le sirvió o no" checked={config.feedback} onChange={(v) => set('feedback', v)} />
              <SwitchRow label="Seguimientos" checked={config.followups} onChange={(v) => set('followups', v)} />
              <p className={NOTE}>Preguntas que propone el agente para seguir sin escribir de cero.</p>
            </ControlSection>

            <ControlSection title="Resultado">
              <Choice value={config.result} onChange={(v) => set('result', v)} options={RESULTS} label="Tipo de resultado" />
              <p className={NOTE}>{RESULT_NOTE[config.result]}</p>
              <SwitchRow label="Atajos" checked={config.chips} onChange={(v) => set('chips', v)} />
              <p className={NOTE}>A lo que quedó pendiente o a lo que se suele preguntar.</p>
            </ControlSection>

            <ControlSection title="Caja de escribir">
              <SwitchRow label="Contexto" checked={config.composerChip} onChange={(v) => set('composerChip', v)} />
              <p className={NOTE}>Sobre qué va la conversación. Se puede quitar.</p>
              <SwitchRow label="Adjuntar" checked={config.attach} onChange={(v) => set('attach', v)} />
              <SwitchRow label="Voz" checked={config.voice} onChange={(v) => set('voice', v)} />
            </ControlSection>

            <ControlSection title="Actividad del agente">
              <Choice value={config.activity} onChange={(v) => set('activity', v)} options={ACTIVITY} label="Panel de actividad" />
              <p className={NOTE}>{ACTIVITY_NOTE[config.activity]}</p>
            </ControlSection>
          </Card>

          <div className="flex min-w-0 flex-col gap-6">
            <AnatomyStage names={names} hot={hot} className="overflow-hidden rounded-xl border bg-card">
              <ChatPreview config={config} sample={current.sample} />
            </AnatomyStage>
            <PartsList parts={chatParts(config)} hot={hot} onHot={setHot} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {GUIDE.map((item) => (
            <Card key={item.title} className="gap-1! p-4!">
              <span className="text-sm font-medium">{item.title}</span>
              <span className={NOTE}>{item.text}</span>
            </Card>
          ))}
        </div>
      </PageContent>

      {/* «Probar en pantalla»: el chat a tamaño real, sin nombres ni bordes punteados. */}
      <TryOnScreen open={tryOpen} onOpenChange={setTryOpen} title="Chat de Orbit">
        <ChatPreview config={config} sample={current.sample} real />
      </TryOnScreen>
    </PageShell>
  )
}

Component.displayName = 'DesignSystemSuiteAiChatPage'
