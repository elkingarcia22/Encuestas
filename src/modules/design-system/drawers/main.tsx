import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { PlayIcon } from '@hugeicons/core-free-icons'
import { Button, Card } from '@ubits/flux-ui'
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
  TryOnScreen,
} from '../components/anatomy/anatomy-kit'
import { PantallaDeFondo } from '../components/anatomy/pantalla-real'
import { AgentDrawer } from './components/agent-drawer'
import { CandidateDrawer } from './components/candidate-drawer'
import { DRAWER_CASES, drawerParts, type DrawerConfig, type ExampleDrawer } from './components/drawer-config'
import { ConfiguredDrawer, DrawerPreview } from './components/drawer-parts'
import { KICKER, WS } from './components/drawer-styles'
import { FiltersDrawer } from './components/filters-drawer'
import { NavDrawer } from './components/nav-drawer'
import { NoticeDrawer } from './components/notice-drawer'
import { NotesDrawer } from './components/notes-drawer'
import { NotificationsDrawer } from './components/notifications-drawer'
import { PreviewDrawer } from './components/preview-drawer'
import { ProcessDrawer } from './components/process-drawer'
import { QuickActionsDrawer } from './components/quick-actions-drawer'
import { VerEnAccion } from '../patrones/piezas'

const GUIDE = [
  { title: 'Usa un drawer para', text: 'ver el detalle de un registro sin salir de la lista, filtrar, seguir un proceso, escribir una nota corta o hablar con el agente sobre lo que tienes abierto.' },
  { title: 'Mejor una ventana cuando', text: 'la decisión bloquea el trabajo: publicar, eliminar o confirmar algo con efecto real (DialogoConfirmar). Crear o editar algo largo no va ni en un drawer ni en una ventana: va en una página (13-oct).' },
  {
    title: 'Desde un drawer, nunca una ventana ni otro drawer encima',
    text: 'Lo que se pide dentro de un drawer (confirmar, escribir, mover, otro detalle) se abre en el mismo drawer: su contenido cambia por el de la ventana y arriba queda «← título del panel» para volver. Nada de otro drawer encima. DrawerShell, VentanaDeAccion y DialogoConfirmar lo hacen solos.',
  },
  { title: 'Con algo escrito', text: 'Pásale conCambios a DrawerShell: no se cierra al tocar fuera y, al cerrar con la X, Escape o «Cancelar», pregunta «Seguir editando · Descartar» dentro del mismo panel. Si el panel tiene su propio «Cancelar», debe llamar a lo mismo que la X (cerrarPanel), no cerrar directo.' },
  { title: 'Borde', text: 'Derecha: detalle de un registro · Izquierda: navegación · Abajo: acciones rápidas y celular · Arriba: avisos del sistema.' },
]

// Design system › Drawers: configurador del Drawer de flux-ui. Se elige un caso de uso y se prende o apaga cada parte
// (borde, navegación, título, lo que va bajo la cabecera y el pie). La vista previa marca con nombre lo que es del
// drawer y deja el cuerpo como slot; «Probar en pantalla» abre el mismo drawer de verdad.
export function Component() {
  const [caseId, setCaseId] = useState(DRAWER_CASES[0].id)
  const current = DRAWER_CASES.find((item) => item.id === caseId) ?? DRAWER_CASES[0]
  const [config, setConfig] = useState<DrawerConfig>(current.config)
  const [names, setNames] = useState(true)
  const [hot, setHot] = useState<string | null>(null)
  const [trying, setTrying] = useState(false)
  const [example, setExample] = useState<ExampleDrawer | null>(null)

  const set =
    <K extends keyof DrawerConfig>(key: K) =>
    (value: DrawerConfig[K]) =>
      setConfig((prev) => ({ ...prev, [key]: value }))

  const pick = (id: string) => {
    const next = DRAWER_CASES.find((item) => item.id === id)
    if (!next) return
    setCaseId(next.id)
    setConfig(next.config)
  }

  const modified = (Object.keys(config) as (keyof DrawerConfig)[]).some((key) => config[key] !== current.config[key])
  const side = config.direction === 'right' || config.direction === 'left'
  const bind = (id: ExampleDrawer) => ({ open: example === id, onOpenChange: (next: boolean) => setExample(next ? id : null) })

  return (
    <PageShell width="default">
      <PageHeader
        kicker="Design system · Componentes"
        title="Paneles laterales"
        description="Paneles que salen desde un borde para trabajar sin perder la página. Arma uno pieza por pieza: lo azul con nombre es parte del drawer y se ve igual en todos; lo gris rayado es el cuerpo, un slot donde va el contenido de cada caso."
        actions={
          <>
            <VerEnAccion pagina="drawers" />
            <Button className={WS} onClick={() => setTrying(true)}>
              <HugeiconsIcon icon={PlayIcon} size={16} />
              Probar en pantalla
            </Button>
          </>
        }
      />

      <PageContent className="@container gap-6">
        <AnatomyLegend names={names} onNamesChange={setNames} />

        <section className="flex flex-col gap-3">
          <div role="heading" aria-level={2} className={KICKER}>
            Casos de uso
          </div>
          <CasePicker cases={DRAWER_CASES} value={caseId} onPick={pick} />
          <CaseSummary
            summary={current.summary}
            modified={modified}
            onReset={() => setConfig(current.config)}
            example={{ label: 'Ver el caso completo', onOpen: () => setExample(current.example) }}
          />
        </section>

        {/* Panel al lado de la vista previa solo si el contenido es ancho (se mide la columna, no la ventana). */}
        <div className="grid items-start gap-6 @min-[54rem]:grid-cols-[17.5rem_minmax(0,1fr)]">
          {/* Controles fijos al lado de la vista previa: alto máximo de la ventana y scroll propio, así se cambian las
              opciones sin perder de vista el resultado. */}
          <Card className="gap-0! py-0! @min-[54rem]:sticky @min-[54rem]:top-6 @min-[54rem]:max-h-[calc(100svh-6.75rem)] @min-[54rem]:overflow-y-auto! @min-[54rem]:overscroll-contain">
            <ControlSection title="Borde y ancho">
              <Choice
                label="Sale desde"
                value={config.direction}
                onChange={set('direction')}
                options={[
                  { value: 'right', label: 'Derecha' },
                  { value: 'left', label: 'Izquierda' },
                  { value: 'bottom', label: 'Abajo' },
                  { value: 'top', label: 'Arriba' },
                ]}
              />
              {side ? (
                <Choice
                  label="Ancho"
                  value={config.size}
                  onChange={set('size')}
                  options={[
                    { value: 'sm', label: '24rem' },
                    { value: 'md', label: '30rem' },
                    { value: 'lg', label: '36rem' },
                  ]}
                />
              ) : (
                <span className="text-[13px] text-muted-foreground">Abajo y arriba ocupan el ancho de la pantalla, hasta 672px.</span>
              )}
            </ControlSection>

            <ControlSection title="Navegación">
              <Choice
                value={config.nav}
                onChange={set('nav')}
                options={[
                  { value: 'none', label: 'Ninguna' },
                  { value: 'back', label: 'Volver' },
                  { value: 'records', label: 'Anterior / siguiente' },
                ]}
              />
            </ControlSection>

            <ControlSection title="Título">
              <Choice
                label="Imagen"
                value={config.media}
                onChange={set('media')}
                options={[
                  { value: 'none', label: 'Ninguna' },
                  { value: 'icon', label: 'Icono' },
                  { value: 'avatar', label: 'Avatar' },
                  { value: 'orb', label: 'Orbe IA' },
                ]}
              />
              <SwitchRow label="Antetítulo" checked={config.kicker} onChange={set('kicker')} />
              <SwitchRow label="Estado" checked={config.badge} onChange={set('badge')} />
              <SwitchRow label="Descripción" checked={config.description} onChange={set('description')} />
            </ControlSection>

            <ControlSection title="Bajo la cabecera">
              <SwitchRow label="Contexto" checked={config.context} onChange={set('context')} />
              <Choice
                value={config.under}
                onChange={set('under')}
                options={[
                  { value: 'none', label: 'Nada' },
                  { value: 'tabs', label: 'Pestañas' },
                  { value: 'progress', label: 'Progreso' },
                ]}
              />
              {config.under === 'tabs' ? (
                <Choice
                  label="Tipo de pestañas"
                  value={config.tabs}
                  onChange={set('tabs')}
                  options={[
                    { value: 'line', label: 'Línea' },
                    { value: 'default', label: 'Segmentadas' },
                  ]}
                />
              ) : null}
            </ControlSection>

            <ControlSection title="Pie">
              <Choice
                value={config.footer}
                onChange={set('footer')}
                options={[
                  { value: 'none', label: 'Sin pie' },
                  { value: 'one', label: 'Un botón' },
                  { value: 'two', label: 'Dos botones' },
                  { value: 'split', label: 'Acción a la izquierda' },
                  { value: 'composer', label: 'Conversación' },
                ]}
              />
            </ControlSection>

            <ControlSection title="Forma">
              <Choice
                value={config.ai ? 'ai' : 'workspace'}
                onChange={(value) => set('ai')(value === 'ai')}
                options={[
                  { value: 'workspace', label: 'Workspace' },
                  { value: 'ai', label: 'Orbit' },
                ]}
              />
            </ControlSection>
          </Card>

          <div className="flex min-w-0 flex-col gap-4">
            <AnatomyStage names={names} hot={hot}>
              <DrawerPreview config={config} sample={current.sample} />
            </AnatomyStage>
            <PartsList parts={drawerParts(config)} hot={hot} onHot={setHot} />
          </div>
        </div>

        <section className="grid gap-3 md:grid-cols-3">
          {GUIDE.map((item) => (
            <div key={item.title} className="rounded-xl border bg-card px-4 py-3.5">
              <div className="text-sm font-medium">{item.title}</div>
              <div className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.text}</div>
            </div>
          ))}
        </section>
      </PageContent>

      {/* «Probar en pantalla»: el drawer configurado, de verdad, sobre una pantalla del Workspace con el marco real. Al cerrarlo
          se cierra la prueba entera. */}
      <TryOnScreen open={trying} onOpenChange={setTrying} title={current.title}>
        <PantallaDeFondo ruta="/admin/seleccion/vacantes" titulo="Vacantes" descripcion="Publica, sigue y cierra los procesos de selección de tu empresa." />
      </TryOnScreen>
      {/* Fuera de la capa y no dentro: una ventana dentro de otra no pinta su velo, y en la pantalla real sí oscurece el fondo. */}
      <ConfiguredDrawer open={trying} onOpenChange={setTrying} config={config} sample={current.sample} bare />

      <CandidateDrawer {...bind('candidato')} />
      <FiltersDrawer {...bind('filtros')} />
      <NotesDrawer {...bind('notas')} />
      <NotificationsDrawer {...bind('avisos')} />
      <AgentDrawer {...bind('agente')} />
      <ProcessDrawer {...bind('proceso')} />
      <NavDrawer {...bind('menu')} />
      <QuickActionsDrawer {...bind('acciones')} />
      <PreviewDrawer {...bind('vista-previa')} />
      <NoticeDrawer {...bind('aviso')} />
    </PageShell>
  )
}

Component.displayName = 'DesignSystemDrawersPage'
