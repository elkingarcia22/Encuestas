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
} from '../components/anatomy/anatomy-kit'
import { KICKER } from '../drawers/components/drawer-styles'
import { HEADER_CASES, headerParts, headerView, type HeaderConfig, type HeaderOpen } from './components/header-config'
import { HeaderPreview } from './components/header-preview'
import { VerEnAccion } from '../patrones/piezas'

const NOTE = 'text-[13px] leading-snug text-muted-foreground'

const GUIDE = [
  { title: 'Siempre igual', text: 'El mismo header en Workspace, Orbit y portal colaborador: el botón del menú, la miga de pan y las acciones de la derecha. El nombre de la pantalla lo pone la página, no el header.' },
  { title: 'Pantalla enfocada', text: 'Cuando una tarea ocupa toda la pantalla, como el editor: la miga de pan y, a la derecha, las mismas acciones del header general (Novedades, Notificaciones y Perfil). «Orbit» va junto al botón primario de la pantalla.' },
  { title: 'Cuando falta espacio', text: 'Novedades queda solo con su icono (header de menos de 920px). El buscador quedó fuera del rediseño (7-oct): sigue en el encabezado actual y pasa a lupa en un header angosto, hasta que ingeniería lo retire.' },
]

// Design system › Header: configurador de la barra de arriba. Se elige un caso de uso y se prende o apaga cada parte
// (menú, migas, acciones, estados y ancho; el buscador queda marcado como fuera del rediseño). La vista previa va arriba
// a lo ancho porque el header es ancho y bajo; marca con nombre lo que es del header y deja como slot lo propio de cada
// pantalla. El configurador vive dentro de «Marco» (Patrones) como pestaña; `conCabecera` lo deja también como página propia.
export function ConfiguradorHeader({ conCabecera = false }: { conCabecera?: boolean } = {}) {
  const navigate = useNavigate()
  const [caseId, setCaseId] = useState(HEADER_CASES[0].id)
  const current = HEADER_CASES.find((item) => item.id === caseId) ?? HEADER_CASES[0]
  const [config, setConfig] = useState<HeaderConfig>(current.config)
  const [names, setNames] = useState(true)
  const [hot, setHot] = useState<string | null>(null)
  const [trying, setTrying] = useState(false)

  const set =
    <K extends keyof HeaderConfig>(key: K) =>
    (value: HeaderConfig[K]) =>
      setConfig((prev) => ({ ...prev, [key]: value }))

  const pick = (id: string) => {
    const next = HEADER_CASES.find((item) => item.id === id)
    if (!next) return
    setCaseId(next.id)
    setConfig(next.config)
  }

  const modified = (Object.keys(config) as (keyof HeaderConfig)[]).some((key) => config[key] !== current.config[key])
  const v = headerView(config)
  const general = config.kind === 'general'

  const openOptions: { value: HeaderOpen; label: string }[] = [{ value: 'none', label: 'Ninguno' }]
  if (v.right.includes('notifications')) openOptions.push({ value: 'notifications', label: 'Notificaciones' })
  if (v.profile) openOptions.push({ value: 'profile', label: 'Perfil' })

  return (
    <>
      {conCabecera ? (
        <PageHeader
        kicker="Design system · Patrones · Marco"
        title="Header"
        description="La barra de arriba de cada pantalla. Arma uno pieza por pieza: lo azul con nombre es parte del header y se ve igual en todo el producto; lo gris rayado es un slot, lo propio de cada pantalla. El header de verdad está arriba de esta página: pásale el cursor y ábrele los menús."
        actions={
          <>
            <VerEnAccion pagina="header" />
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
          <CasePicker cases={HEADER_CASES} value={caseId} onPick={pick} />
          <CaseSummary
            summary={current.summary}
            modified={modified}
            onReset={() => setConfig(current.config)}
            example={current.example ? { label: 'Ver el caso completo', onOpen: () => navigate(current.example ?? '/') } : undefined}
          />
        </section>

        {/* El header es ancho y bajo: la vista previa va arriba a lo ancho (así se ve a su tamaño real) y los controles debajo. */}
        <div className="flex min-w-0 flex-col gap-4">
          <AnatomyStage names={names} hot={hot} className="rounded-2xl border bg-muted/40 px-5 pt-8 pb-5 @min-[48rem]:px-8">
            <HeaderPreview config={config} sample={current.sample} names={names} onOpen={set('open')} />
          </AnatomyStage>

          <Card className="gap-0! py-0!">
            <div className="grid divide-y @min-[62rem]:grid-cols-3 @min-[62rem]:divide-x @min-[62rem]:divide-y-0">
              <div className="flex flex-col">
                <ControlSection title="Tipo de header">
                  <Choice
                    value={config.kind}
                    onChange={set('kind')}
                    options={[
                      { value: 'general', label: 'General' },
                      { value: 'focused', label: 'Pantalla enfocada' },
                    ]}
                  />
                  <span className={NOTE}>
                    {general
                      ? 'Workspace, Orbit y portal: el menú con su miga de pan a la izquierda y las acciones a la derecha.'
                      : 'Una tarea a pantalla completa, como el editor: todo en una fila y sin buscador.'}
                  </span>
                </ControlSection>

                <ControlSection title="Izquierda">
                  <SwitchRow label="Abrir o cerrar menú" checked={config.menu} onChange={set('menu')} />
                  <Choice
                    label="Junto al menú"
                    value={config.left}
                    onChange={set('left')}
                    options={[
                      { value: 'crumbs', label: 'Migas de pan' },
                      { value: 'back', label: 'Volver y título' },
                    ]}
                  />
                </ControlSection>

                <ControlSection title="Buscador (fuera del rediseño)">
                  {general ? (
                    <>
                      <span className={NOTE}>Quedó fuera del rediseño (7-oct): no se amplía ni se suma a pantallas nuevas. Se muestra solo porque el encabezado actual todavía lo trae.</span>
                      <Choice
                        value={config.search}
                        onChange={set('search')}
                        options={[
                          { value: 'wide', label: 'Ancho al centro' },
                          { value: 'icon', label: 'Solo lupa' },
                          { value: 'none', label: 'Sin buscador' },
                        ]}
                      />
                      {config.search === 'wide' ? (
                        <span className={NOTE}>Se achica solo cuando falta espacio y en un header angosto pasa a lupa.</span>
                      ) : null}
                    </>
                  ) : (
                    <span className={NOTE}>La pantalla enfocada no lleva buscador: todo el foco está en la tarea.</span>
                  )}
                </ControlSection>
              </div>

              <div className="flex flex-col">
                <ControlSection title="Acciones de la derecha">
                  {/* La pantalla enfocada lleva las mismas acciones que el general, como el editor real (auditoría, 5 oct). */}
                  {general ? null : <SwitchRow label="Acciones de la pantalla (slot)" checked={config.own} onChange={set('own')} />}
                  <SwitchRow label="Novedades" checked={config.news} onChange={set('news')} />
                  <SwitchRow label="Notificaciones" checked={config.notifications} onChange={set('notifications')} />
                  {config.notifications ? (
                    <div className="border-l-2 pl-3">
                      <SwitchRow label="Punto sin leer" checked={config.unread} onChange={set('unread')} />
                    </div>
                  ) : null}
                  <SwitchRow label="Centro de procesos" checked={config.processes} onChange={set('processes')} />
                  <SwitchRow label="Perfil" checked={config.profile} onChange={set('profile')} />
                  {general ? (
                    // 1 oct: ayuda pasó al menú de perfil. 13 oct: procesos vuelve a tener su botón (Charlie).
                    <span className={NOTE}>Centro de ayuda vive en el menú de perfil. El Centro de procesos tiene su botón a la derecha de Notificaciones y también se abre desde ellas.</span>
                  ) : (
                    <Text as="span" size="sm" variant="muted">
                      «Orbit» no va en el header: va al final de la fila de acciones, a la derecha del botón primario de la pantalla.
                    </Text>
                  )}
                </ControlSection>
              </div>

              <div className="flex flex-col">
                <ControlSection title="Estados">
                  <Choice label="Menú abierto" value={v.open} onChange={set('open')} options={openOptions} />
                  <SwitchRow label="Mostrar un tooltip" checked={config.tooltip} onChange={set('tooltip')} />
                  <span className={NOTE}>También puedes hacer clic en notificaciones o perfil dentro de la vista previa.</span>
                </ControlSection>

                <ControlSection title="Ancho del header">
                  <Choice
                    value={config.width}
                    onChange={set('width')}
                    options={[
                      { value: 'full', label: 'Completo' },
                      { value: 'panel', label: 'Con panel a la derecha' },
                      { value: 'narrow', label: 'Angosto · 576px' },
                      { value: 'phone', label: 'Celular · 390px' },
                    ]}
                  />
                  <span className={NOTE}>Mira debajo de la vista previa qué pasa con Novedades a cada ancho.</span>
                </ControlSection>
              </div>
            </div>
          </Card>

          <PartsList parts={headerParts(config)} hot={hot} onHot={setHot} />
        </div>

        {/* «Probar en pantalla»: el header sin la anatomía, arriba y a lo ancho, con la pantalla debajo.
            La maqueta toma el alto de la ventana menos la franja de la capa, para que llene la pantalla. */}
        <TryOnScreen open={trying} onOpenChange={setTrying} title={current.title}>
          <div className="flex h-full p-6">
            <HeaderPreview config={config} sample={current.sample} names={false} onOpen={set('open')} bare />
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
      <ConfiguradorHeader conCabecera />
    </PageShell>
  )
}

Component.displayName = 'DesignSystemConfiguradorHeaderPage'
