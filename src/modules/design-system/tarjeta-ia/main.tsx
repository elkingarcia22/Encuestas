import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Card } from '@ubits/flux-ui'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import {
  AnatomyLegend,
  AnatomyStage,
  CasePicker,
  CaseSummary,
  ControlSection,
  PartsList,
  SwitchRow,
  TryButton,
  TryOnScreen,
} from '../components/anatomy/anatomy-kit'
import { KICKER } from '../drawers/components/drawer-styles'
import { CARD_CASES, cardParts, type CardConfig } from './components/card-config'
import { CardPreview } from './components/card-preview'

const NOTE = 'text-[13px] leading-snug text-muted-foreground'

const GUIDE = [
  {
    title: 'Usa esta tarjeta para',
    text: 'ofrecer que la IA haga un trabajo que la persona iba a hacer a mano. Va dentro de una pantalla normal, como una opción más, nunca sola ni a pantalla completa.',
  },
  {
    title: 'Una por pantalla',
    text: 'Es una invitación, no un banner. Si hay dos, ninguna se ve. Cuando la pantalla ya tiene otra pieza de IA con color, esta va sin halo.',
  },
  {
    title: 'El color no rellena',
    text: 'El halo es luz pastel a lo ancho del borde de arriba (azul, morado, rosa y naranja) que se apaga antes de llegar al texto, así que el texto siempre queda sobre fondo liso. Al pasar el cursor crece: se mueve el fondo, no la tarjeta.',
  },
  {
    title: 'El texto promete algo concreto',
    text: 'Título en verbo y con el resultado («Crear un curso»), bajada con el cómo y cuánto cuesta en tiempo. Nada de «Potenciado por IA».',
  },
]

export function Component() {
  const [caseId, setCaseId] = useState(CARD_CASES[0].id)
  const current = CARD_CASES.find((item) => item.id === caseId) ?? CARD_CASES[0]
  const [config, setConfig] = useState<CardConfig>(current.config)
  const [names, setNames] = useState(true)
  const [hot, setHot] = useState<string | null>(null)
  const [tryOpen, setTryOpen] = useState(false)
  const navigate = useNavigate()

  const pickCase = (id: string) => {
    const next = CARD_CASES.find((item) => item.id === id)
    if (!next) return
    setCaseId(id)
    setConfig(next.config)
  }

  const set = <K extends keyof CardConfig>(key: K, value: CardConfig[K]) => setConfig((prev) => ({ ...prev, [key]: value }))
  const modified = JSON.stringify(config) !== JSON.stringify(current.config)

  return (
    <PageShell>
      <PageHeader
        kicker="Design system · Orbit"
        title="Tarjeta de IA"
        description="La invitación a que la IA haga el trabajo, dentro de una pantalla normal. Se ve en la plantilla Home operativo, como «Crear un curso»; el Inicio del admin de hoy ya no la lleva. Lo azul con nombre es parte del componente; lo gris rayado es el resto de la pantalla, que la tarjeta no debe tapar."
        actions={<TryButton onClick={() => setTryOpen(true)} />}
      />
      <PageContent className="flex flex-col gap-6">
        <AnatomyLegend names={names} onNamesChange={setNames} />

        <div className="flex flex-col gap-3">
          <span className={KICKER}>Casos de uso</span>
          <CasePicker cases={CARD_CASES} value={caseId} onPick={pickCase} label="Casos de uso de la tarjeta" />
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
            <ControlSection title="Qué lleva">
              <SwitchRow label="Orbe" checked={config.orb} onChange={(v) => set('orb', v)} />
              <p className={NOTE}>La marca de la IA. Sin él, la tarjeta no se distingue de una promo cualquiera.</p>
              <SwitchRow label="Insignia" checked={config.badge} onChange={(v) => set('badge', v)} />
              <p className={NOTE}>Solo mientras sea novedad. Después se quita.</p>
              <SwitchRow label="Bajada" checked={config.description} onChange={(v) => set('description', v)} />
              <SwitchRow label="Botón" checked={config.action} onChange={(v) => set('action', v)} />
              <p className={NOTE}>Si no hay nada que hacer, la tarjeta solo anuncia y no lleva botón.</p>
            </ControlSection>

            <ControlSection title="Cómo se ve">
              <SwitchRow label="Halo" checked={config.halo} onChange={(v) => set('halo', v)} />
              <p className={NOTE}>
                La luz de color del borde de arriba. Se apaga cuando la pantalla ya tiene otra pieza de IA con color.
              </p>
              <SwitchRow label="Compacta" checked={config.compact} onChange={(v) => set('compact', v)} />
              <p className={NOTE}>Menos aire y sin bajada, para columnas estrechas.</p>
            </ControlSection>
          </Card>

          <div className="flex min-w-0 flex-col gap-6">
            <AnatomyStage names={names} hot={hot} className="overflow-hidden rounded-xl border bg-card">
              <CardPreview config={config} sample={current.sample} />
            </AnatomyStage>
            <PartsList parts={cardParts(config)} hot={hot} onHot={setHot} />
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

      {/* «Probar en pantalla»: la tarjeta a tamaño real, sin nombres ni bordes punteados. */}
      <TryOnScreen open={tryOpen} onOpenChange={setTryOpen} title="Tarjeta de IA">
        <CardPreview config={config} sample={current.sample} real />
      </TryOnScreen>
    </PageShell>
  )
}

Component.displayName = 'DesignSystemTarjetaIaPage'
