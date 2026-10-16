import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Card, useSidebar } from '@ubits/flux-ui'
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
import { SIDEBAR_CASES, effectiveLevel, hasThirdLevel, sidebarParts, type SidebarConfig } from './components/sidebar-config'
import { SidebarPreview } from './components/sidebar-preview'
import { VerEnAccion } from '../patrones/piezas'

const NOTE = 'text-[13px] leading-snug text-muted-foreground'

const GUIDE = [
  { title: 'Abierta o plegada', text: 'Abierta (288px) para moverse con los nombres a la vista; plegada en riel (72px) para ganar espacio en tablas y editores. Cada persona elige y la app lo recuerda.' },
  { title: 'Hasta tres niveles', text: 'Producto › página en la misma barra. Si una sección tiene sus propias páginas, abre un panel con Volver. Si hace falta más, el menú del producto va arriba (ver Navegación).' },
  { title: 'En Orbit', text: 'La barra se vuelve historial: nueva conversación arriba y las conversaciones con su estado. Sin tarjeta del pie ni feedback.' },
]

// Design system › Barra lateral: configurador de la barra de la app. Se elige un caso de uso y se prende o apaga cada
// parte (estado, espacio, cabecera, nivel del menú, insignias, pie y lo que sale en el riel). La vista previa es una
// réplica fija de la barra real: marca con nombre lo que es del componente y deja la tarjeta del pie como slot.
// El configurador vive dentro de «Marco» (Fundamentos) como pestaña; `conCabecera` lo deja también como página propia.
export function ConfiguradorBarraLateral({ conCabecera = false }: { conCabecera?: boolean } = {}) {
  const navigate = useNavigate()
  const { setOpen } = useSidebar()
  const [caseId, setCaseId] = useState(SIDEBAR_CASES[0].id)
  const current = SIDEBAR_CASES.find((item) => item.id === caseId) ?? SIDEBAR_CASES[0]
  const [config, setConfig] = useState<SidebarConfig>(current.config)
  const [names, setNames] = useState(true)
  const [hot, setHot] = useState<string | null>(null)
  const [trying, setTrying] = useState(false)

  const change = (patch: Partial<SidebarConfig>) => setConfig((prev) => ({ ...prev, ...patch }))
  const set =
    <K extends keyof SidebarConfig>(key: K) =>
    (value: SidebarConfig[K]) =>
      change({ [key]: value } as Partial<SidebarConfig>)

  const pick = (id: string) => {
    const next = SIDEBAR_CASES.find((item) => item.id === id)
    if (!next) return
    setCaseId(next.id)
    setConfig(next.config)
  }

  // El tercer nivel hoy solo existe en Workspace (Aprendizaje › LMS Creator): en vez de esconder la opción, al elegirla
  // la vista previa se va a ese espacio para poder verlo.
  const setLevel = (next: SidebarConfig['level']) =>
    change(next === 'third' && !hasThirdLevel(config.space) ? { level: next, space: 'workspace' } : { level: next })

  const modified = (Object.keys(config) as (keyof SidebarConfig)[]).some((key) => config[key] !== current.config[key])
  const ai = config.space === 'ai'
  const open = config.state === 'open'
  const level = effectiveLevel(config)

  // La barra real queda como en el caso (abierta o plegada) y se va a su pantalla.
  const openInApp = () => {
    setOpen(current.config.state === 'open')
    navigate(current.route)
  }

  return (
    <>
      {conCabecera ? (
        <PageHeader
        kicker="Design system · Patrones"
        title="Barra lateral"
        description="La navegación de la izquierda, pieza por pieza. Lo azul con nombre es parte de la barra y se ve igual en todas las pantallas; lo gris rayado es un slot, un espacio donde el contenido cambia."
        actions={
          <>
            <VerEnAccion pagina="barra-lateral" />
            <TryButton onClick={() => setTrying(true)} />
          </>
        }
        />
      ) : null}

      <PageContent className="@container gap-6">
        <AnatomyLegend names={names} onNamesChange={setNames} />

        <section className="flex flex-col gap-3">
          <div role="heading" aria-level={2} className={KICKER}>
            Casos de uso
          </div>
          <CasePicker cases={SIDEBAR_CASES} value={caseId} onPick={pick} />
          <CaseSummary
            summary={current.summary}
            modified={modified}
            onReset={() => setConfig(current.config)}
            example={{ label: 'Ver el caso completo', onOpen: openInApp }}
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
                  { value: 'open', label: 'Abierta · 288px' },
                  { value: 'rail', label: 'Plegada en riel · 72px' },
                ]}
              />
            </ControlSection>

            <ControlSection title="Espacio">
              <Choice
                value={config.space}
                onChange={set('space')}
                options={[
                  { value: 'workspace', label: 'Workspace' },
                  { value: 'ai', label: 'Orbit' },
                  { value: 'portal', label: 'Portal colaborador' },
                  { value: 'docs', label: 'Design system' },
                ]}
              />
            </ControlSection>

            <ControlSection title="Cabecera">
              <SwitchRow label="Empresa" checked={config.account} onChange={set('account')} />
              <SwitchRow label="Selector de espacio" checked={config.switcher} onChange={set('switcher')} />
              {ai ? <SwitchRow label="Nueva conversación" checked={config.newChat} onChange={set('newChat')} /> : null}
            </ControlSection>

            {ai ? (
              <ControlSection title="Historial">
                <SwitchRow label="Punto de estado" checked={config.statuses} onChange={set('statuses')} />
                <SwitchRow label="Conversación abierta marcada" checked={config.active} onChange={set('active')} />
                {!open ? <span className={NOTE}>En el riel los estados se ven dentro del menú flotante.</span> : null}
              </ControlSection>
            ) : (
              <ControlSection title="Menú">
                <Choice
                  label="Nivel que se ve"
                  value={level}
                  onChange={setLevel}
                  options={[
                    { value: 'first', label: 'Primer nivel' },
                    { value: 'sub', label: 'Submenú abierto' },
                    { value: 'third', label: 'Tercer nivel' },
                  ]}
                />
                {!open ? <span className={NOTE}>En el riel el nivel cambia qué icono queda activo; las páginas se ven en el menú flotante.</span> : null}
                {open && level === 'third' ? (
                  <span className={NOTE}>
                    Una sección con páginas propias abre su panel dentro de la barra: Volver arriba, el nombre de la sección y solo
                    sus páginas. Hoy pasa en Workspace, en Aprendizaje › LMS Creator.
                  </span>
                ) : (
                  <>
                    <SwitchRow label="Inicio" checked={config.home} onChange={set('home')} />
                    {open ? <SwitchRow label="Títulos de grupo" checked={config.groupTitles} onChange={set('groupTitles')} /> : null}
                    <SwitchRow label="Insignia «Nuevo»" checked={config.badges} onChange={set('badges')} />
                  </>
                )}
                <SwitchRow label="Página activa marcada" checked={config.active} onChange={set('active')} />
              </ControlSection>
            )}

            {!open ? (
              <ControlSection title="Al pasar el cursor">
                <Choice
                  value={config.hover}
                  onChange={set('hover')}
                  options={[
                    { value: 'none', label: 'Nada' },
                    { value: 'tooltip', label: 'Tooltip' },
                    { value: 'menu', label: 'Menú flotante' },
                  ]}
                />
                <span className={NOTE}>En la app sale al pasar el cursor; aquí queda abierto para verlo.</span>
              </ControlSection>
            ) : null}

            <ControlSection title="Pie">
              {ai ? (
                <span className={NOTE}>En Orbit la barra queda solo con el historial: sin tarjeta ni feedback.</span>
              ) : (
                <>
                  {open ? (
                    <SwitchRow label="Tarjeta del pie" checked={config.invite} onChange={set('invite')} />
                  ) : (
                    <span className={NOTE}>La tarjeta del pie no va en el riel.</span>
                  )}
                  <SwitchRow label="Enviar feedback" checked={config.feedback} onChange={set('feedback')} />
                </>
              )}
            </ControlSection>
          </Card>

          <div className="flex min-w-0 flex-col gap-4">
            <AnatomyStage names={names} hot={hot} className="rounded-2xl border bg-muted/40 px-6 pt-10 pb-8">
              <SidebarPreview c={config} names={names} onChange={change} />
            </AnatomyStage>
            <PartsList parts={sidebarParts(config)} hot={hot} onHot={setHot} />
          </div>
        </div>

        {/* «Probar en pantalla»: la misma barra sin la anatomía, a tamaño real (288px abierta, 72px el riel).
            La maqueta toma el alto de la ventana menos la franja de la capa, para que llene la pantalla. */}
        <TryOnScreen open={trying} onOpenChange={setTrying} title={current.title}>
          <div className="flex h-full p-6">
            <SidebarPreview c={config} names={false} onChange={change} full />
          </div>
        </TryOnScreen>

        <section className="grid gap-3 md:grid-cols-3">
          {GUIDE.map((item) => (
            <div key={item.title} className="rounded-xl border bg-card px-4 py-3.5">
              <div className="text-sm font-medium">{item.title}</div>
              <div className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.text}</div>
            </div>
          ))}
        </section>
      </PageContent>
    </>
  )
}


export function Component() {
  return (
    <PageShell width="default">
      <ConfiguradorBarraLateral conCabecera />
    </PageShell>
  )
}

Component.displayName = 'DesignSystemConfiguradorBarraLateralPage'
