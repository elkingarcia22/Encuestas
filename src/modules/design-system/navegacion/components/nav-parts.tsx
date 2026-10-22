import { Fragment, useId, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  BookOpen01Icon,
  Calendar03Icon,
  Certificate01Icon,
  Home03Icon,
  KanbanIcon,
  Mortarboard01Icon,
  Table01Icon,
  Tick02Icon,
} from '@hugeicons/core-free-icons'
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  ButtonGroup,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconTile,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  Scrollspy,
  Separator,
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
  Tabs,
  TabsList,
  TabsTrigger,
  ToggleGroup,
  ToggleGroupItem,
  cn,
  navigationMenuTriggerStyle,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { FiltroChip } from '@/modules/design-system/navegacion/filtro-chip'
import { PiePaginacion } from '@/modules/admin/seleccion/propuestas/components/paginacion'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { notify } from '@/shared/components/notify'
import styles from '../../components/anatomy/anatomy.module.css'
import { KICKER, STEP_INDICATOR, STEP_LINE } from '../../drawers/components/drawer-styles'
import type { PageConfig, PageSample } from './page-config'

// Piezas de navegación de la vista previa del configurador. Cada una trae su nombre (data-region) y usa solo
// componentes de flux-ui; los textos salen del caso de uso elegido.

type Props = { config: PageConfig; sample: PageSample }

// Migas de pan: simples, con los niveles del medio en «…» o con desplegable de páginas hermanas en la última.
export function PreviewBreadcrumbs({ config: c, sample: s }: Props) {
  const all = s.crumbs
  const last = all[all.length - 1]
  const collapse = c.crumbs === 'collapsed' && all.length > 2
  // Con «…» quedan a la vista el primero y los dos últimos (o solo el último si la ruta es corta).
  const tail = collapse ? all.slice(all.length > 3 ? -2 : -1) : all.slice(1)
  const hidden = collapse ? all.slice(1, all.length - tail.length) : []
  const lead = tail.slice(0, -1)

  const separator = () => (c.separator === 'slash' ? <BreadcrumbSeparator>/</BreadcrumbSeparator> : <BreadcrumbSeparator />)

  return (
    <Breadcrumb data-region="Migas de pan">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink render={<button type="button" />} aria-label={c.crumbHome ? all[0] : undefined} onClick={() => notify(all[0], undefined, 'info')}>
            {c.crumbHome ? <HugeiconsIcon icon={Home03Icon} size={16} /> : all[0]}
          </BreadcrumbLink>
        </BreadcrumbItem>
        {collapse ? (
          <>
            {separator()}
            <BreadcrumbItem>
              {/* Nombre en un contenedor y colgando abajo: arriba está el nombre de las migas de pan. */}
              <span data-region="Niveles ocultos" data-chip="under" className="inline-flex">
                <DropdownMenu>
                  <DropdownMenuTrigger render={<BotonIcono className="-my-1.5" aria-label="Ver niveles ocultos" />}>
                    <BreadcrumbEllipsis />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    {hidden.map((label) => (
                      <DropdownMenuItem key={label} onClick={() => notify(label, undefined, 'info')}>
                        {label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </span>
            </BreadcrumbItem>
          </>
        ) : null}
        {lead.map((label) => (
          <Fragment key={label}>
            {separator()}
            <BreadcrumbItem>
              <BreadcrumbLink render={<button type="button" />} onClick={() => notify(label, undefined, 'info')}>
                {label}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </Fragment>
        ))}
        {all.length > 1 ? (
          <>
            {separator()}
            <BreadcrumbItem>
              {c.crumbs === 'siblings' ? (
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button data-region="Hermanos" variant="ghost" size="sm" className="-mx-2" />}>
                    <BreadcrumbPage>{last}</BreadcrumbPage>
                    <HugeiconsIcon icon={ArrowDown01Icon} size={14} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    {s.siblings.map((label) => (
                      <DropdownMenuItem key={label} onClick={() => notify(label, undefined, 'info')}>
                        {label}
                        {label === last ? <HugeiconsIcon icon={Tick02Icon} size={16} className="ml-auto" /> : null}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <BreadcrumbPage>{last}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </>
        ) : null}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

// Volver + migas en una sola fila: la flecha regresa a la lista y las migas dicen dónde estás.
export function BackWithCrumbs(props: Props) {
  return (
    <div className="flex items-end gap-2">
      {/* Nombre en un contenedor: queda arriba, a la altura del de las migas, y no se encima con el del título. */}
      <span data-region="Volver" data-chip="inline" className="-ml-1.5 inline-flex">
        <BotonIcono
          className="-my-1.5 text-muted-foreground!"
          aria-label={`Volver a ${props.sample.back}`}
          onClick={() => notify(`Volver a ${props.sample.back}`, undefined, 'info')}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
        </BotonIcono>
      </span>
      <Separator orientation="vertical" className="mr-1 mb-0.5 h-4!" />
      <PreviewBreadcrumbs {...props} />
    </div>
  )
}

// Anterior / siguiente entre registros, con o sin «2 de 12».
export function RecordNav({ counter }: { counter: boolean }) {
  return (
    // Ancho mínimo para que el nombre no pase por encima del de «Más acciones».
    <div data-region="Anterior / siguiente" className="flex min-w-28 items-center justify-end gap-2.5">
      {counter ? <span className="text-sm text-muted-foreground tabular-nums">2 de 12</span> : null}
      <ButtonGroup>
        <Button variant="outline" size="icon-sm" aria-label="Registro anterior" onClick={() => notify('Registro anterior', undefined, 'info')}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
        </Button>
        <Button variant="outline" size="icon-sm" aria-label="Registro siguiente" onClick={() => notify('Registro siguiente', undefined, 'info')}>
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
        </Button>
      </ButtonGroup>
    </div>
  )
}

const MORE_TABS = ['Archivadas', 'Plantillas', 'Papelera']

// Contenido de cada pestaña: icono, texto y conteo según lo que esté prendido.
function TabLabel({ config: c, item }: { config: PageConfig; item: PageSample['tabs'][number] }) {
  return (
    <>
      {c.tabIcons ? <HugeiconsIcon icon={item.icon} size={15} /> : null}
      {item.label}
      {c.counts && item.count !== undefined ? (
        <Badge variant="secondary" size="xs" className="tabular-nums">
          {item.count}
        </Badge>
      ) : null}
    </>
  )
}

// Pestañas bajo el título (cualquier variante de la librería), con «Más» si no caben.
export function PreviewTabs({ config: c, sample: s }: Props) {
  const [tab, setTab] = useState('0')
  const value = Number(tab) < s.tabs.length ? tab : '0'

  return (
    // Sin min-w-0: si no caben junto al cambio de vista, bajan a su propia fila en vez de encogerse.
    <div data-region="Pestañas" className="flex-1">
      {/* «Más» va al lado de la lista y no adentro (un botón no puede ser hijo de un tablist). En las de línea, su fila
          sigue la línea de la lista hasta el borde. */}
      <Tabs value={value} onValueChange={(next) => setTab(String(next))} className={c.tabMore ? 'flex-row! gap-0!' : undefined}>
        <TabsList variant={c.tabs} className={c.tabMore && c.tabs === 'line' ? 'w-auto!' : undefined}>
          {s.tabs.map((item, index) => (
            <TabsTrigger key={item.label} value={String(index)} className="flex-none gap-2 px-3">
              <TabLabel config={c} item={item} />
            </TabsTrigger>
          ))}
        </TabsList>
        {c.tabMore ? (
          <div className={cn('flex h-9 items-center', c.tabs === 'line' && 'flex-1 border-b border-border')}>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button data-region="Más pestañas" variant="ghost" size="sm" className="ml-1" />}>
                Más
                <HugeiconsIcon icon={ArrowDown01Icon} size={14} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                {MORE_TABS.map((label) => (
                  <DropdownMenuItem key={label} onClick={() => notify(label, undefined, 'info')}>
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}
      </Tabs>
    </div>
  )
}

// Pestañas verticales al costado del contenido (orientación vertical de la librería).
export function VerticalTabs({ config: c, sample: s }: Props) {
  const [tab, setTab] = useState('0')
  const value = Number(tab) < s.tabs.length ? tab : '0'

  return (
    <div data-region="Pestañas verticales" className="w-52 shrink-0">
      <Tabs value={value} onValueChange={(next) => setTab(String(next))} orientation="vertical">
        <TabsList variant={c.tabs} className="w-full">
          {s.tabs.map((item, index) => (
            <TabsTrigger key={item.label} value={String(index)} className="w-full justify-start gap-2 px-3 py-2">
              <TabLabel config={c} item={item} />
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}

const SUBMENU = [
  { title: 'Catálogo', description: 'Todos los cursos publicados.', icon: BookOpen01Icon },
  { title: 'Rutas de aprendizaje', description: 'Cursos en orden, por cargo.', icon: Mortarboard01Icon },
  { title: 'Obligatorios', description: 'Lo que toda la empresa debe tomar.', icon: Certificate01Icon },
  { title: 'Calendario', description: 'Sesiones en vivo del mes.', icon: Calendar03Icon },
]

// Menú del producto: páginas del producto bajo el título; una de ellas puede abrir un submenú.
export function ProductMenu({ config: c, sample: s }: Props) {
  const [active, setActive] = useState(s.menu[0])

  return (
    <div data-region="Menú del producto" className="border-b">
      <NavigationMenu>
        <NavigationMenuList className="gap-1">
          {s.menu.map((label, index) => (
            <NavigationMenuItem key={label} value={label}>
              {c.submenu && index === 1 ? (
                <>
                  <NavigationMenuTrigger data-region="Submenú">{label}</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-120 grid-cols-2 gap-1 p-1">
                      {SUBMENU.map((link) => (
                        <NavigationMenuLink
                          key={link.title}
                          render={<button type="button" />}
                          onClick={() => {
                            setActive(label)
                            notify(link.title, undefined, 'info')
                          }}
                          className="flex w-full cursor-pointer items-start gap-3 text-left"
                        >
                          <IconTile variant="soft" size="sm">
                            <HugeiconsIcon icon={link.icon} />
                          </IconTile>
                          <span className="flex min-w-0 flex-col gap-1">
                            <span className="text-sm font-medium">{link.title}</span>
                            <span className="text-sm text-muted-foreground">{link.description}</span>
                          </span>
                        </NavigationMenuLink>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </>
              ) : (
                <NavigationMenuLink
                  render={<button type="button" />}
                  active={active === label}
                  onClick={() => setActive(label)}
                  className={navigationMenuTriggerStyle()}
                >
                  {label}
                </NavigationMenuLink>
              )}
              {active === label ? <span aria-hidden className="pointer-events-none absolute inset-x-2.5 -bottom-px h-0.5 rounded-full bg-primary" /> : null}
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  )
}

const VIEWS = [
  { value: 'table', label: 'Tabla', icon: Table01Icon },
  { value: 'board', label: 'Tablero', icon: KanbanIcon },
  { value: 'calendar', label: 'Calendario', icon: Calendar03Icon },
]

// Cambio de vista: los mismos datos como tabla, tablero o calendario (grupo de botones de la librería).
export function ViewSwitch() {
  const [view, setView] = useState('table')

  return (
    <div data-region="Cambio de vista" className="shrink-0">
      <ToggleGroup aria-label="Cambio de vista" value={[view]} onValueChange={(next) => next[0] && setView(next[0])} variant="outline" size="sm" spacing={0}>
        {VIEWS.map((item) => (
          <ToggleGroupItem key={item.value} value={item.value} className="gap-1.5 px-2.5">
            <HugeiconsIcon icon={item.icon} size={15} />
            {item.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

const STEPS = [
  { title: 'Datos básicos', description: 'Nombre y fechas' },
  { title: 'Audiencia', description: 'Quién lo recibe' },
  { title: 'Contenido', description: 'Cursos y sesiones' },
  { title: 'Revisión', description: 'Confirmar y publicar' },
]

// Pasos: en fila bajo el título o en columna al costado; los hechos llevan check o su número.
export function PreviewSteps({ config: c }: { config: PageConfig }) {
  const vertical = c.steps === 'vertical'
  const indicators = c.stepMarker === 'check' ? { completed: <HugeiconsIcon icon={Tick02Icon} className="size-3.5" /> } : undefined

  return (
    <div data-region="Pasos" className={vertical ? 'w-56 shrink-0' : 'mt-6'}>
      <Stepper value={2} orientation={vertical ? 'vertical' : 'horizontal'} indicators={indicators}>
        <StepperNav className={vertical ? undefined : 'w-full'}>
          {STEPS.map((step, index) => (
            <StepperItem
              key={step.title}
              step={index + 1}
              completed={index + 1 < 2}
              className={vertical ? 'relative items-start' : 'flex-1 last:flex-none'}
            >
              {/* De muestra: sin panel asociado, así que sin el aria-controls que la librería apunta a un panel que no existe. */}
              <StepperTrigger className={cn('items-start gap-2 text-left', vertical && 'pb-7 last:pb-0')} tabIndex={-1} aria-controls={undefined}>
                <StepperIndicator className={STEP_INDICATOR}>{index + 1}</StepperIndicator>
                <span className="flex flex-col gap-1 pt-1">
                  <StepperTitle className="whitespace-nowrap">{step.title}</StepperTitle>
                  {c.stepText ? <StepperDescription>{step.description}</StepperDescription> : null}
                </span>
              </StepperTrigger>
              {index < STEPS.length - 1 ? (
                <StepperSeparator
                  className={cn(
                    STEP_LINE,
                    vertical
                      ? 'absolute top-7 left-3 m-0 -translate-x-1/2 group-data-[orientation=vertical]/stepper-nav:h-[calc(100%-2rem)]'
                      : 'mx-3 mt-3 min-w-8 flex-1 self-start',
                  )}
                />
              ) : null}
            </StepperItem>
          ))}
        </StepperNav>
      </Stepper>
    </div>
  )
}

// Filtros rápidos sobre la lista: el chip de filtro del sistema (FiltroChip, decisión 21 de la auditoría), con cuántos
// resultados hay en cada uno. Sin ninguno puesto se ve todo; el puesto lleva su «x» para quitarlo.
export function QuickFilters({ sample: s }: { sample: PageSample }) {
  const [chip, setChip] = useState<string | null>(null)

  return (
    <div data-region="Filtros rápidos" role="group" aria-label="Filtros rápidos" className="flex w-fit flex-wrap gap-2">
      {s.chips.map((item) => (
        <FiltroChip
          key={item.label}
          size="sm"
          activo={chip === item.label}
          onCambiar={(activo) => setChip(activo ? item.label : null)}
          texto={item.label}
          cuenta={item.count}
          ayuda={`Ver solo «${item.label.toLowerCase()}»`}
        />
      ))}
    </div>
  )
}

const TOC = ['Quién tiene derecho', 'Cómo se acumulan', 'Cómo pedirlas', 'Aprobación', 'Casos especiales']

// Documento con índice: el índice de ReUI (Scrollspy) sigue el desplazamiento del documento y marca la sección.
// El documento es un slot; se desplaza dentro de su caja para que el índice se pueda probar en la vista previa.
export function DocumentWithToc({ hint, bare }: { hint: string; bare?: boolean }) {
  const scroller = useRef<HTMLDivElement>(null)
  const prefix = useId().replace(/[^a-zA-Z0-9]/g, '')
  const [current, setCurrent] = useState('')

  return (
    <>
      <div
        data-slot-region={bare ? undefined : 'Documento'}
        data-slot-area={bare ? undefined : ''}
        className={cn(
          'min-w-0 flex-1 self-stretch rounded-xl',
          !bare && cn('border border-dashed border-muted-foreground/35 bg-muted/30', styles.hatch),
        )}
      >
        {/* Se desplaza por dentro y no tiene nada enfocable: con tabIndex se puede recorrer con las flechas. */}
        <div ref={scroller} tabIndex={0} role="region" aria-label="Documento de muestra" className="relative h-80 overflow-y-auto px-6 py-5">
          <p className="max-w-96 text-sm text-muted-foreground">{hint} Desplázate aquí para ver cómo el índice marca la sección.</p>
          {TOC.map((title, index) => (
            <section key={title} id={`${prefix}-doc-${index}`} className="flex flex-col gap-2.5 pt-8">
              <span className="text-sm font-medium">{title}</span>
              {[92, 100, 84, 96, 60].map((width, line) => (
                <span key={line} className="h-2 rounded-full bg-muted-foreground/15" style={{ width: `${width}%` }} />
              ))}
            </section>
          ))}
        </div>
      </div>
      <nav data-region="Índice" aria-labelledby={`${prefix}-toc`} className="flex w-44 shrink-0 flex-col">
        <div id={`${prefix}-toc`} className={KICKER}>
          En esta página
        </div>
        <Scrollspy targetRef={scroller} history={false} offset={24} onUpdate={setCurrent} className="mt-3 flex flex-col border-l">
          {TOC.map((title, index) => (
            <Button
              key={title}
              variant="ghost"
              aria-current={current === `${prefix}-doc-${index}` ? 'location' : undefined}
              data-scrollspy-anchor={`${prefix}-doc-${index}`}
              // El botón de la librería con su filo y su fondo apagados: aquí lo que marca la sección activa es la
              // línea azul de la izquierda, no un relleno.
              className="h-auto! justify-start! -ml-px rounded-none! border-y-0! border-r-0! border-l-2! border-transparent! py-1.5! pr-0! pl-3! text-left font-normal! whitespace-normal! text-muted-foreground! hover:bg-transparent! hover:text-foreground! data-[active=true]:border-primary! data-[active=true]:font-medium! data-[active=true]:text-foreground!"
            >
              {title}
            </Button>
          ))}
        </Scrollspy>
      </nav>
    </>
  )
}

// Paginación al final del contenido: el paginador del sistema (PiePaginacion, decisión 2 de la auditoría, 5-oct), el
// mismo que va dentro de la tabla: filas por página, cuántos se ven y las páginas. La versión compacta se retiró.
export function PreviewPagination() {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const total = 120
  const paginas = Math.ceil(total / porPagina)
  const actual = Math.min(pagina, paginas)

  return (
    <div data-region="Paginación" className="mt-6">
      <PiePaginacion
        estado={{ pagina: actual, setPagina, porPagina, setPorPagina, paginas, desde: (actual - 1) * porPagina + 1, hasta: Math.min(actual * porPagina, total), total }}
        nombre="resultados"
        id={`${id}-paginacion`}
        enMarco
      />
    </div>
  )
}
