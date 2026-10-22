import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { Button, Card, Tabs, TabsContent, TabsList, TabsTrigger, Text } from '@ubits/flux-ui'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import {
  AnatomyLegend,
  AnatomyStage,
  CasePicker,
  CaseSummary,
  Choice,
  ControlSection,
  PartsList,
  TryButton,
  TryOnScreen,
  SwitchRow,
} from '../components/anatomy/anatomy-kit'
import { KICKER } from '../drawers/components/drawer-styles'
import { PAGE_CASES, pageParts, type PageConfig } from './components/page-config'
import { PagePreview } from './components/page-preview'
import { Demo, VerEnAccion } from '../patrones/piezas'
import { notify } from '@/shared/components/notify'
import { BotonSalirCreacion } from './boton-salir-creacion'

// Qué hace cada opción, en una frase, bajo el control que la elige.
const TOP_HINT: Record<PageConfig['top'], string> = {
  none: 'Lo normal: la miga de arriba ya dice dónde estás.',
  back: 'Para el detalle de un registro: una flecha junto al título regresa a la lista de donde viniste, sin quitar la miga de arriba. Nunca un enlace «‹ Volver» encima del título, ni la flecha en un asistente por pasos (ahí la salida es «Salir de la creación»).',
}

const CRUMBS_HINT: Record<PageConfig['crumbs'], string> = {
  off: 'Solo en pantallas de primer nivel o a pantalla completa: la barra deja el nombre de la pantalla a secas.',
  simple: 'Todos los niveles a la vista. Hasta 4 niveles.',
  collapsed: 'Rutas largas: los niveles del medio se esconden en «…» y se abren en un menú.',
  siblings: 'La última miga abre un menú para saltar a otra página del mismo nivel.',
}

const INNER_HINT: Record<PageConfig['inner'], string> = {
  none: 'El contenido ocupa todo el ancho.',
  menu: 'Secciones de una página larga, como Configuración.',
  tabs: 'Fichas con muchas secciones. Usa el tipo de la sección Pestañas.',
  toc: 'Lecturas largas: marca solo la sección que se está leyendo.',
  list: 'Revisar registros seguidos, uno al lado del otro.',
  chips: 'Acotar una lista con un clic, con cuántos hay en cada filtro.',
}

// La subrayada es la maestra (auditoría del 5-oct): pegada bajo el título, también para las vistas guardadas. Las demás
// quedan para casos especiales.
const TABS_HINT: Record<PageConfig['tabs'], string> = {
  line: 'La maestra: una línea bajo la activa, pegada bajo el título. Va en casi todas las pantallas, también para vistas guardadas.',
  default: 'Pastilla gris con la activa en blanco. Solo para casos especiales, como un filtro de estado dentro de un panel.',
  view: 'Como la pastilla gris, con la activa en azul. Solo para casos especiales.',
  page: 'La activa se rellena de azul. La más llamativa: casi nunca.',
}

function Hint({ children }: { children: ReactNode }) {
  return <p className="-mt-2 text-xs leading-snug text-muted-foreground">{children}</p>
}

// BotonSalirCreacion con `salida` (war room del 13-oct, regla «salir-con-cambios»): la única salida de una creación o
// edición trae su ventana, «¿Salir de la creación?» con «Seguir aquí» y «Salir de la creación». Con `alGuardarYSalir` hay
// borrador y salir lo guarda; sin él, la bajada avisa que se pierde; sin cambios, sale directo. El botón, siempre azul
// (war room del 15-oct). Aquí se
// prueba de verdad, con el interruptor de «hay cambios».
function SalidaDeCreacion() {
  const [conCambios, setConCambios] = useState(true)
  return (
    <section className="flex flex-col gap-3">
      <div role="heading" aria-level={2} className={KICKER}>
        Salir de una creación o edición
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Demo
          title="Sin borrador: lo que llevas se pierde"
          description="Crear una tarea o una evaluación no guarda nada hasta el final. Al salir con cambios pregunta «¿Salir de la creación?»: la bajada avisa que lo que llevas se pierde. «Salir de la creación» va en azul igual: salir no elimina nada."
        >
          <div className="flex flex-col items-start gap-4">
            <SwitchRow label="Hay cambios sin guardar" checked={conCambios} onChange={setConCambios} />
            <BotonSalirCreacion
              texto="Salir de la creación"
              onClick={() => notify('Saliste de la creación', 'No quedó nada guardado.', 'info')}
              salida={{ conCambios }}
            />
          </div>
        </Demo>
        <Demo
          // Pregunta antes: BotonSalirCreacion abre su ventana (VentanaSalir, hecha con DialogoConfirmar) y solo al
          // confirmar guarda y avisa.
          title="Con borrador: salir lo guarda"
          description="Si de verdad hay un borrador, se pasa `alGuardarYSalir` (y `retomarEn`): salir lo guarda y la bajada dice dónde retomarlo. Sin cambios, sale directo y no pregunta."
        >
          <div className="flex flex-col items-start gap-4">
            <SwitchRow label="Hay cambios sin guardar" checked={conCambios} onChange={setConCambios} />
            <BotonSalirCreacion
              texto="Salir de la edición"
              onClick={() => notify('Saliste de la edición', undefined, 'info')}
              salida={{
                conCambios,
                retomarEn: 'Planes de formación',
                alGuardarYSalir: () => notify('Borrador guardado', 'Lo retomas desde Planes de formación.', 'success'),
              }}
            />
          </div>
        </Demo>
      </div>
    </section>
  )
}

// Pestaña dentro de pestaña (regla «pestanas-anidadas», war room del 13-oct): la principal subrayada y la de adentro en
// píldora, como en Resultados de encuestas › Accionables. Nunca dos filas subrayadas.
function PestanasAnidadas() {
  return (
    <section className="flex flex-col gap-3">
      <div role="heading" aria-level={2} className={KICKER}>
        Pestaña dentro de pestaña
      </div>
      <Demo
        title="La principal subrayada, la de adentro en píldora"
        description="Cuando una pestaña tiene sus propias pestañas, la de arriba es la subrayada (TabsList variant=line) y la de adentro va en píldora (TabsList por defecto). Así se lee cuál manda. Las dos, solo texto."
      >
        <Tabs defaultValue="accionables" className="w-full">
          <TabsList variant="line">
            <TabsTrigger value="participacion" className="flex-none">
              Participación
            </TabsTrigger>
            <TabsTrigger value="preguntas" className="flex-none">
              Preguntas
            </TabsTrigger>
            <TabsTrigger value="accionables" className="flex-none">
              Accionables
            </TabsTrigger>
          </TabsList>
          {['participacion', 'preguntas'].map((valor) => (
            <TabsContent key={valor} value={valor} className="pt-4">
              <Text size="sm" variant="muted">
                Abre «Accionables» para ver la pestaña de adentro.
              </Text>
            </TabsContent>
          ))}
          <TabsContent value="accionables" className="flex flex-col items-start gap-4 pt-4">
            <Tabs defaultValue="todos">
              <TabsList aria-label="Estado de los accionables">
                <TabsTrigger value="todos">Todos</TabsTrigger>
                <TabsTrigger value="activos">Activos</TabsTrigger>
                <TabsTrigger value="sugeridos">Sugeridos</TabsTrigger>
              </TabsList>
            </Tabs>
            <Text size="sm" variant="muted">
              Aquí va la lista de accionables.
            </Text>
          </TabsContent>
        </Tabs>
      </Demo>
    </section>
  )
}

// Design system › Navegación: configurador de pantallas del Workspace. Se elige un caso de uso y se prende o apaga
// cada tipo de navegación, título, descripción, botones, pestañas y pie. La vista previa marca con nombre lo que es
// del componente y deja el contenido como slot (espacio libre).
export function Component() {
  const navigate = useNavigate()
  const [caseId, setCaseId] = useState(PAGE_CASES[0].id)
  const current = PAGE_CASES.find((item) => item.id === caseId) ?? PAGE_CASES[0]
  const [config, setConfig] = useState<PageConfig>(current.config)
  const [names, setNames] = useState(true)
  const [hot, setHot] = useState<string | null>(null)
  const [trying, setTrying] = useState(false)

  const set =
    <K extends keyof PageConfig>(key: K) =>
    (value: PageConfig[K]) =>
      setConfig((prev) => ({ ...prev, [key]: value }))

  const pick = (id: string) => {
    const next = PAGE_CASES.find((item) => item.id === id)
    if (!next) return
    setCaseId(next.id)
    setConfig(next.config)
  }

  const modified = (Object.keys(config) as (keyof PageConfig)[]).some((key) => config[key] !== current.config[key])
  const crumbs = config.crumbs !== 'off'
  const hasTabs = config.under === 'tabs' || config.inner === 'tabs'
  const example = current.example

  return (
    <PageShell width="default">
      <PageHeader
        kicker="Design system · Patrones"
        title="Estructura de página"
        description="Arma una pantalla del Workspace pieza por pieza. Lo azul con nombre es parte del componente y se ve igual en todas las pantallas; lo gris rayado es un slot, el espacio libre donde va el contenido de cada una."
        actions={
          <>
            <VerEnAccion pagina="navegacion" />
            <TryButton onClick={() => setTrying(true)} />
          </>
        }
      />

      <PageContent className="@container gap-6">
        <AnatomyLegend names={names} onNamesChange={setNames} />

        <section className="flex flex-col gap-3">
          <div role="heading" aria-level={2} className={KICKER}>
            Casos de uso
          </div>
          <CasePicker cases={PAGE_CASES} value={caseId} onPick={pick} />
          <CaseSummary
            summary={current.summary}
            modified={modified}
            onReset={() => setConfig(current.config)}
            example={example ? { label: 'Ver el caso completo', onOpen: () => navigate(example) } : undefined}
          />
        </section>

        {/* Panel al lado de la vista previa solo si el contenido es ancho (se mide la columna, no la ventana). */}
        <div className="grid items-start gap-6 @min-[54rem]:grid-cols-[17.5rem_minmax(0,1fr)]">
          {/* Controles fijos al lado de la vista previa: alto máximo de la ventana y scroll propio, así se cambian las
              opciones sin perder de vista el resultado. */}
          <Card className="gap-0! py-0! @min-[54rem]:sticky @min-[54rem]:top-6 @min-[54rem]:max-h-[calc(100svh-6.75rem)] @min-[54rem]:overflow-y-auto! @min-[54rem]:overscroll-contain">
            <ControlSection title="Miga de pan (en la barra de arriba)">
              <Choice
                value={config.crumbs}
                onChange={set('crumbs')}
                options={[
                  { value: 'simple', label: 'Simples' },
                  { value: 'collapsed', label: 'Con «…»' },
                  { value: 'siblings', label: 'Con hermanos' },
                  { value: 'off', label: 'Sin miga' },
                ]}
              />
              <Hint>{CRUMBS_HINT[config.crumbs]}</Hint>
              <Hint>
                Va siempre arriba, pegada al botón que abre y cierra el menú. Nunca encima del título: ahí se repetía
                con la de la barra y empujaba la pantalla hacia abajo.
              </Hint>
              {crumbs ? (
                <>
                  <Choice
                    label="Separador"
                    value={config.separator}
                    onChange={set('separator')}
                    options={[
                      { value: 'chevron', label: 'Flecha ›' },
                      { value: 'slash', label: 'Barra /' },
                    ]}
                  />
                  <SwitchRow label="Casita en vez de «Inicio»" checked={config.crumbHome} onChange={set('crumbHome')} />
                </>
              ) : null}
            </ControlSection>

            <ControlSection title="Volver">
              <Choice
                value={config.top}
                onChange={set('top')}
                options={[
                  { value: 'none', label: 'Ninguna' },
                  { value: 'back', label: 'Volver' },
                ]}
              />
              <Hint>{TOP_HINT[config.top]}</Hint>
            </ControlSection>

            <ControlSection title="Bajo el título">
              <Choice
                value={config.under}
                onChange={set('under')}
                options={[
                  { value: 'none', label: 'Nada' },
                  { value: 'tabs', label: 'Pestañas' },
                  { value: 'menu', label: 'Menú del producto' },
                ]}
              />
              <Hint>
                {config.under === 'tabs'
                  ? 'Grupos de la misma sección. Su aspecto se ajusta en Pestañas.'
                  : config.under === 'menu'
                    ? 'Páginas de un producto, cuando la barra lateral ya no alcanza.'
                    : 'Sin navegación bajo el título.'}
              </Hint>
              {config.under === 'menu' ? <SwitchRow label="Con submenú desplegable" checked={config.submenu} onChange={set('submenu')} /> : null}
              <SwitchRow label="Cambio de vista (tabla, tablero…)" checked={config.views} onChange={set('views')} />
              <Choice
                label="Pasos"
                value={config.steps}
                onChange={set('steps')}
                options={[
                  { value: 'none', label: 'Sin pasos' },
                  { value: 'horizontal', label: 'En fila' },
                  { value: 'vertical', label: 'Al costado' },
                ]}
              />
              {config.steps !== 'none' ? (
                <>
                  <Hint>
                    {config.steps === 'horizontal'
                      ? 'Hasta 5 pasos de nombre corto, en formularios angostos.'
                      : 'Pasos largos de explicar o más de 5: van en columna a la izquierda.'}
                  </Hint>
                  <Choice
                    label="Pasos ya hechos"
                    value={config.stepMarker}
                    onChange={set('stepMarker')}
                    options={[
                      { value: 'check', label: 'Con check' },
                      { value: 'number', label: 'Con número' },
                    ]}
                  />
                  <SwitchRow label="Con descripción" checked={config.stepText} onChange={set('stepText')} />
                </>
              ) : null}
            </ControlSection>

            <ControlSection title="Dentro del contenido">
              <Choice
                value={config.inner}
                onChange={set('inner')}
                options={[
                  { value: 'none', label: 'Nada' },
                  { value: 'menu', label: 'Menú interno' },
                  { value: 'tabs', label: 'Pestañas verticales' },
                  { value: 'toc', label: 'Índice' },
                  { value: 'list', label: 'Lista' },
                  { value: 'chips', label: 'Filtros rápidos' },
                ]}
              />
              <Hint>{INNER_HINT[config.inner]}</Hint>
              <Choice
                label="Paginación al final"
                value={config.pagination}
                onChange={set('pagination')}
                options={[
                  { value: 'none', label: 'Sin paginación' },
                  { value: 'numbers', label: 'Con paginación' },
                ]}
              />
              {config.pagination !== 'none' ? (
                <Hint>El paginador del sistema, el mismo de las tablas: filas por página, cuántos se ven y las páginas. No hay otro.</Hint>
              ) : null}
            </ControlSection>

            <ControlSection title="Título">
              <Choice
                label="Tamaño"
                value={config.titleSize}
                onChange={set('titleSize')}
                options={[
                  { value: 'lg', label: 'Grande' },
                  { value: 'md', label: 'Mediano' },
                  { value: 'sm', label: 'Compacto' },
                ]}
              />
              <Hint>
                {config.titleSize === 'lg'
                  ? 'El de siempre: para entrar a una sección.'
                  : config.titleSize === 'md'
                    ? 'Para fichas de un registro (una persona, un curso).'
                    : 'Para pantallas densas, carpetas o procesos: deja más alto para el contenido.'}
              </Hint>
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
              {config.media !== 'none' ? (
                <Choice
                  label="Tamaño de la imagen"
                  value={config.mediaSize}
                  onChange={set('mediaSize')}
                  options={[
                    { value: 'sm', label: 'Chica' },
                    { value: 'md', label: 'Mediana' },
                    { value: 'lg', label: 'Grande' },
                  ]}
                />
              ) : null}
              <Choice
                label="Junto al título"
                value={config.titleAction}
                onChange={set('titleAction')}
                options={[
                  { value: 'none', label: 'Nada' },
                  { value: 'favorite', label: 'Favorito' },
                  { value: 'edit', label: 'Editar nombre' },
                ]}
              />
              <SwitchRow label="Antetítulo" checked={config.kicker} onChange={set('kicker')} />
              <SwitchRow label="Estado" checked={config.badge} onChange={set('badge')} />
              <SwitchRow label="Metadatos" checked={config.meta} onChange={set('meta')} />
            </ControlSection>

            <ControlSection title="Descripción">
              <Choice
                value={config.description}
                onChange={set('description')}
                options={[
                  { value: 'none', label: 'Sin descripción' },
                  { value: 'short', label: 'Corta' },
                  { value: 'long', label: 'Larga' },
                ]}
              />
            </ControlSection>

            <ControlSection title="Botones">
              <Choice
                label="Anterior / siguiente"
                value={config.records}
                onChange={set('records')}
                options={[
                  { value: 'none', label: 'No' },
                  { value: 'counter', label: 'Con contador' },
                  { value: 'arrows', label: 'Solo flechas' },
                ]}
              />
              <SwitchRow label="Botón primario" checked={config.primary} onChange={set('primary')} />
              <SwitchRow label="Botón secundario" checked={config.secondary} onChange={set('secondary')} />
              <SwitchRow label="Más acciones" checked={config.more} onChange={set('more')} />
              <Choice
                label="Orbit (abre el panel del agente)"
                value={config.modoIa}
                onChange={set('modoIa')}
                options={[
                  { value: 'none', label: 'No' },
                  { value: 'full', label: 'Completo' },
                  { value: 'orb', label: 'Solo el orbe' },
                ]}
              />
              {config.modoIa !== 'none' ? (
                <span className="text-[13px] leading-snug text-muted-foreground">
                  Va al final de la fila de acciones, a la derecha del botón primario. Completo por defecto; solo el orbe cuando la fila tiene más de dos llamados a la acción, contando a Orbit y sin contar el «⋯» (regla del 5-oct).
                </span>
              ) : null}
              <Choice
                label="Forma"
                value={config.ai ? 'ai' : 'workspace'}
                onChange={(value) => set('ai')(value === 'ai')}
                options={[
                  { value: 'workspace', label: 'Workspace' },
                  { value: 'ai', label: 'Orbit' },
                ]}
              />
            </ControlSection>

            <ControlSection title="Pestañas">
              {hasTabs ? (
                <>
                  <Choice
                    label="Tipo"
                    value={config.tabs}
                    onChange={set('tabs')}
                    options={[
                      { value: 'line', label: 'Línea' },
                      { value: 'default', label: 'Segmentadas' },
                      { value: 'view', label: 'Vista' },
                      { value: 'page', label: 'Página' },
                    ]}
                  />
                  <Hint>{TABS_HINT[config.tabs]}</Hint>
                  {/* 13-oct: las pestañas llevan solo texto, sin icono (regla «pestanas-solo-texto», 5-oct); se quitó «Con iconos». */}
                  <SwitchRow label="Con conteo" checked={config.counts} onChange={set('counts')} />
                  {config.under === 'tabs' ? (
                    <SwitchRow label="Con «Más» si no caben" checked={config.tabMore} onChange={set('tabMore')} />
                  ) : null}
                </>
              ) : (
                <div className="flex flex-col items-start gap-2.5 text-sm text-muted-foreground">
                  Este caso no lleva pestañas.
                  <Button variant="outline" size="sm" onClick={() => set('under')('tabs')}>
                    Agregar pestañas
                  </Button>
                </div>
              )}
            </ControlSection>

            <ControlSection title="Pie">
              <Choice
                value={config.footer}
                onChange={set('footer')}
                options={[
                  { value: 'none', label: 'Sin pie' },
                  { value: 'save', label: 'Guardar cambios' },
                  { value: 'wizard', label: 'Atrás y siguiente' },
                  { value: 'legal', label: 'Legal del marco' },
                ]}
              />
              <Hint>El pie legal del marco solo sale en las páginas de inicio: nunca en creación, edición ni subvistas.</Hint>
            </ControlSection>

            <ControlSection title="Contenedor">
              <Choice
                value={config.width}
                onChange={set('width')}
                options={[
                  { value: 'narrow', label: '720px' },
                  { value: 'default', label: '1140px' },
                  { value: 'wide', label: '1600px' },
                  { value: 'full', label: 'Completo' },
                ]}
              />
            </ControlSection>
          </Card>

          <div className="flex min-w-0 flex-col gap-4">
            <AnatomyStage names={names} hot={hot} className="overflow-hidden rounded-2xl border bg-background px-8 pt-10 pb-8">
              <PagePreview config={config} sample={current.sample} />
            </AnatomyStage>
            <PartsList parts={pageParts(config)} hot={hot} onHot={setHot} />
          </div>
        </div>

        <SalidaDeCreacion />
        <PestanasAnidadas />

        {/* «Probar en pantalla»: la misma pantalla sin la anatomía, a tamaño real. */}
        <TryOnScreen open={trying} onOpenChange={setTrying} title={current.title}>
          <PagePreview config={config} sample={current.sample} real />
        </TryOnScreen>
      </PageContent>
    </PageShell>
  )
}

Component.displayName = 'DesignSystemNavigationPage'
