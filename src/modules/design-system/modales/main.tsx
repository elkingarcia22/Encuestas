import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { PlayIcon } from '@hugeicons/core-free-icons'
import { Button, Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle, Text, cn } from '@ubits/flux-ui'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { TourDialog } from '@/shared/components/TourDialog'
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
import { KICKER, WS } from '../drawers/components/drawer-styles'
import { ExampleModals } from './components/example-modals'
import { VENTANA_CASES, ventanaParts, type VentanaConfig } from './components/ventana-config'
import { VentanaDePrueba, VentanaPreview } from './components/ventana-parts'
import { VerEnAccion } from '../patrones/piezas'

// «completo»: ocupa toda la fila de abajo (es una regla de cómo se comporta, no de cuándo usar la ventana).
const GUIDE: { title: string; text: string; completo?: boolean }[] = [
  {
    title: 'Usa ActionDialog para',
    text: 'lo que tiene contenido y no puede esperar: 2 o 3 campos, una lista para elegir, una vista previa, un detalle o un ajuste.',
  },
  {
    title: 'Para confirmar, la otra ventana',
    text: 'eliminar, salir sin guardar, activar, descartar o enviar van en DialogoConfirmar (Estados › Confirmaciones), aunque muestren lo que se pierde.',
  },
  {
    title: 'Que no se cierre sola cuando',
    text: 'perder lo escrito costaría: formularios largos, pasos, salir sin guardar. Con `dismissible={false}` el clic afuera no cierra; la X y Esc sí.',
  },
  {
    title: 'Mejor una página cuando',
    text: 'se crea o se edita algo con muchos campos: título fijo, formulario y barra de guardado abajo. Un drawer, para ver un registro sin perder la lista.',
  },
  {
    title: 'Mejor un aviso cuando',
    text: 'solo hay que contar que algo pasó y no hay nada que decidir: «Nota guardada», «Candidatos movidos». Corto: el título dice qué pasó y, si hace falta, una línea con lo que cambia; si falla, «No pudimos…» con «Reintentar».',
  },
  {
    title: 'Pedido desde un drawer',
    text: 'no se abre como ventana encima del panel: el mismo drawer cambia su contenido por el de la ventana, con «← título del panel» arriba para volver (VentanaDeAccion y DialogoConfirmar lo hacen solos al estar dentro de un drawer).',
    completo: true,
  },
  {
    title: 'Al confirmar',
    text: 'el botón dice qué está pasando («Moviendo…», «Guardando…») con su spinner mientras la acción corre (`pendingLabel`), y la ventana no se cierra ni se confirma dos veces. Después se cierra sola.',
    completo: true,
  },
]

const NOTE = 'text-[13px] leading-snug text-muted-foreground'

// El tour del nuevo UBITS (TourDialog), sumado por la auditoría del 5-oct (decisión 21): no cabe en el configurador
// porque no es un ActionDialog, así que se documenta aparte con sus medidas y se abre el de verdad.
const TOUR = [
  'Arriba y centrados: la insignia «Tour de plataforma», el título «Nos renovamos para ti» y una bajada.',
  'Los cuatro pasos como pestañas a la izquierda y, a la derecha, la captura de cada uno en 4:3 sobre el halo azul. En escritorio la fila mide 480 px.',
  'Avanza solo cada 6 s y se detiene con el cursor o el foco encima, con la pausa o con «reducir movimiento».',
  'Pie: pausa, «Paso n de 4», «Saltar el tour» y «Siguiente» («Empezar» en el último).',
]

// Design system › Modales: la ventana con contenido, ActionDialog (ConfiguredModal se retiró el 5-oct). Confirmar es de
// DialogoConfirmar, en Estados › Confirmaciones (acuerdo del 6-oct). Se elige un caso de uso y se prende o apaga lo que la pieza permite: tamaño, icono,
// volver, bajada, lo de junto a la X, el registro, pestañas o pasos, el cuerpo y el pie. La vista previa la dibuja con
// sus medidas reales y marca con nombre cada parte; «Probar en pantalla» abre el ActionDialog de verdad.
export function Component() {
  const [caseId, setCaseId] = useState(VENTANA_CASES[0].id)
  const current = VENTANA_CASES.find((item) => item.id === caseId) ?? VENTANA_CASES[0]
  const [config, setConfig] = useState<VentanaConfig>(current.config)
  const [names, setNames] = useState(true)
  const [hot, setHot] = useState<string | null>(null)
  const [trying, setTrying] = useState(false)
  const [example, setExample] = useState<string | null>(null)
  const [tour, setTour] = useState(false)

  const set =
    <K extends keyof VentanaConfig>(key: K) =>
    (value: VentanaConfig[K]) =>
      setConfig((prev) => ({ ...prev, [key]: value }))

  const pick = (id: string) => {
    const next = VENTANA_CASES.find((item) => item.id === id)
    if (!next) return
    setCaseId(next.id)
    setConfig(next.config)
  }

  const modified = (Object.keys(config) as (keyof VentanaConfig)[]).some((key) => config[key] !== current.config[key])
  const onOff = (value: boolean) => (value ? 'si' : 'no')

  return (
    <PageShell width="default">
      <PageHeader
        kicker="Design system · Patrones"
        title="Ventanas"
        description="ActionDialog es la ventana para todo lo que tiene contenido; para confirmar algo está DialogoConfirmar, en Estados › Confirmaciones. Arma una pieza por pieza: lo azul con nombre es parte de la ventana y se ve igual en todas; lo gris rayado es el cuerpo, un slot donde va el contenido de cada caso."
        actions={
          <>
            <VerEnAccion pagina="modales" />
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
          <CasePicker cases={VENTANA_CASES} value={caseId} onPick={pick} />
          <CaseSummary
            summary={current.summary}
            modified={modified}
            onReset={() => setConfig(current.config)}
            example={{ label: 'Ver el caso completo', onOpen: () => setExample(current.id) }}
          />
        </section>

        {/* Panel al lado de la vista previa solo si el contenido es ancho (se mide la columna, no la ventana). */}
        <div className="grid items-start gap-6 @min-[54rem]:grid-cols-[17.5rem_minmax(0,1fr)]">
          {/* Controles fijos al lado de la vista previa: alto máximo de la ventana y scroll propio, así se cambian las
              opciones sin perder de vista el resultado. Solo lo que ActionDialog permite, con el nombre de su prop. */}
          <Card className="gap-0! py-0! @min-[54rem]:sticky @min-[54rem]:top-6 @min-[54rem]:max-h-[calc(100svh-6.75rem)] @min-[54rem]:overflow-y-auto! @min-[54rem]:overscroll-contain">
            <ControlSection title="Tamaño">
              <Choice
                value={config.size}
                onChange={set('size')}
                options={[
                  { value: 'sm', label: '448 px' },
                  { value: 'default', label: '620 px' },
                  { value: 'wide', label: '736 px' },
                  { value: 'full', label: 'Completa' },
                ]}
              />
              <span className={NOTE}>
                {config.size === 'full'
                  ? 'Ocupa casi toda la pantalla, con 16 px de aire alrededor.'
                  : 'Sale a 120 px del borde de arriba. 448 para algo corto (confirmar con una lista), 620 con contenido, 736 para formularios largos.'}
              </span>
            </ControlSection>

            <ControlSection title="Cabecera">
              <Choice
                label="Icono (media)"
                value={config.media}
                onChange={set('media')}
                options={[
                  { value: 'none', label: 'Ninguno' },
                  { value: 'orbe', label: 'Orbe IA' },
                ]}
              />
              <SwitchRow label="Volver (onBack)" checked={config.back} onChange={set('back')} />
              <SwitchRow label="Bajada (sub)" checked={config.sub} onChange={set('sub')} />
              <SwitchRow label="Junto a la X (headerActions)" checked={config.headerActions} onChange={set('headerActions')} />
              <span className={NOTE}>El título es fijo y la X (CloseButton) va siempre.</span>
            </ControlSection>

            <ControlSection title="Cuerpo">
              <SwitchRow label="Registro (lead)" checked={config.lead} onChange={set('lead')} />
              <Choice
                label="Al empezar el cuerpo"
                value={config.under}
                onChange={set('under')}
                options={[
                  { value: 'none', label: 'Nada' },
                  { value: 'tabs', label: 'Pestañas' },
                  { value: 'steps', label: 'Pasos' },
                ]}
              />
              <SwitchRow label="Contenido (children)" checked={config.body} onChange={set('body')} />
            </ControlSection>

            <ControlSection title="Pie">
              <Choice
                value={config.footer}
                onChange={set('footer')}
                options={[
                  { value: 'estandar', label: 'Cancelar y acción' },
                  { value: 'propio', label: 'Propio (footer)' },
                  { value: 'ninguno', label: 'Sin pie' },
                ]}
              />
              {config.footer === 'ninguno' ? (
                <span className={NOTE}>Con `hideFooter` la ventana solo muestra algo y se cierra con la X.</span>
              ) : (
                <>
                  <SwitchRow label="Nota (note)" checked={config.note} onChange={set('note')} />
                  {config.footer === 'estandar' ? (
                    <SwitchRow label="Spinner al confirmar (pendingLabel)" checked={config.pending} onChange={set('pending')} />
                  ) : null}
                </>
              )}
            </ControlSection>

            <ControlSection title="Clic afuera">
              <Choice
                value={onOff(config.dismissible)}
                onChange={(value) => set('dismissible')(value === 'si')}
                options={[
                  { value: 'si', label: 'Cierra' },
                  { value: 'no', label: 'No cierra' },
                ]}
              />
            </ControlSection>
          </Card>

          <div className="flex min-w-0 flex-col gap-4">
            <AnatomyStage names={names} hot={hot}>
              <VentanaPreview config={config} sample={current.sample} />
            </AnatomyStage>
            <PartsList parts={ventanaParts(config)} hot={hot} onHot={setHot} />
          </div>
        </div>

        <section className="grid gap-3 md:grid-cols-2 @min-[62rem]:grid-cols-4">
          {GUIDE.map((item) => (
            <div key={item.title} className={cn('rounded-xl border bg-card px-4 py-3.5', item.completo && 'md:col-span-2 @min-[62rem]:col-span-4')}>
              <div className="text-sm font-medium">{item.title}</div>
              <div className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.text}</div>
            </div>
          ))}
        </section>

        {/* La única ventana fuera de las dos del sistema: el tour (decisión 21 de la auditoría, 5-oct). «Enviar feedback»
            es ActionDialog y está arriba, entre los casos de uso. */}
        <Card>
          <CardHeader>
            <CardTitle>Tour del nuevo UBITS · TourDialog</CardTitle>
            <CardDescription>
              Lo abren «Hacer el tour» en la tarjeta de la barra lateral y la primera entrada desde el inicio de sesión. Es la
              única ventana que no es ActionDialog ni DialogoConfirmar: un Dialog propio de 1.040 px, con la X estándar. Falta decidir si pasa a
              ActionDialog a pantalla completa.
            </CardDescription>
            <CardAction>
              <Button variant="outline" className={WS} onClick={() => setTour(true)}>
                <HugeiconsIcon icon={PlayIcon} size={16} />
                Abrir el tour
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ul className="flex list-disc flex-col gap-1.5 pl-5">
              {TOUR.map((linea) => (
                <li key={linea}>
                  <Text as="span" size="sm" variant="muted">
                    {linea}
                  </Text>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </PageContent>

      {/* «Probar en pantalla»: el ActionDialog configurado, de verdad, sobre una pantalla del Workspace con el marco real.
          Al cerrarlo se cierra la prueba entera. */}
      <TryOnScreen open={trying} onOpenChange={setTrying} title={current.title}>
        <PantallaDeFondo ruta="/admin/seleccion/vacantes" titulo="Vacantes" descripcion="Publica, sigue y cierra los procesos de selección de tu empresa." />
      </TryOnScreen>
      {/* Fuera de la capa y no dentro: una ventana dentro de otra no pinta su velo, y en la pantalla real sí oscurece el fondo. */}
      <VentanaDePrueba open={trying} onOpenChange={setTrying} config={config} sample={current.sample} />
      <ExampleModals open={example} onOpenChange={setExample} />
      <TourDialog open={tour} onOpenChange={setTour} />
    </PageShell>
  )
}

Component.displayName = 'DesignSystemModalsPage'
