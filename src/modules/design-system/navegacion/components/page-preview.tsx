import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Building03Icon,
  InformationCircleIcon,
  Link02Icon,
  MoreHorizontalIcon,
  PencilEdit02Icon,
  Settings02Icon,
  Shield01Icon,
  SidebarLeftIcon,
  StarIcon,
} from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconTile,
  Separator,
  cn,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { AppFooter } from '@/shared/components/AppFooter'
import { ChipGuardado } from '@/shared/components/ChipGuardado'
import { Orb } from '@/shared/components/Orb'
import { notify } from '@/shared/components/notify'
import { PageActionBar, PageHeader, PageShell } from '@/shared/components/PageShell'
import { ReopenAgentButton } from '../../agente-contextual/components/agent-kit'
import { SlotArea } from '../../components/anatomy/anatomy-kit'
import { AgentDrawer } from '../../drawers/components/agent-drawer'
import { PILL, WS } from '../../drawers/components/drawer-styles'
import {
  DocumentWithToc,
  PreviewBreadcrumbs,
  PreviewPagination,
  PreviewSteps,
  PreviewTabs,
  ProductMenu,
  QuickFilters,
  RecordNav,
  VerticalTabs,
  ViewSwitch,
} from './nav-parts'
import { SLOT_NAME, type PageConfig, type PageSample } from './page-config'
import { PantallaReal } from '../../components/anatomy/pantalla-real'

const INNER_MENU = [
  { label: 'Empresa', icon: Building03Icon },
  { label: 'Accesos', icon: Shield01Icon },
  { label: 'Integraciones', icon: Link02Icon },
  { label: 'Avanzado', icon: Settings02Icon },
]

const LIST = [
  { title: 'Vacaciones · Sara Gómez', meta: '5 días · desde el 21 sept' },
  { title: 'Permiso · Andrés Pardo', meta: 'Medio día · mañana' },
  { title: 'Certificado laboral', meta: 'Laura Méndez · hoy' },
  { title: 'Vacaciones · Juan Rincón', meta: '10 días · en octubre' },
]

const ICON_TILE = { sm: 'sm', md: 'default', lg: 'lg' } as const
const AVATAR = { sm: 'sm', md: 'default', lg: 'lg' } as const
const ORB = { sm: 'size-8', md: 'size-10', lg: 'size-12' } as const

// Vista previa del configurador de navegación: una pantalla armada con el marco de página real (PageShell,
// PageHeader, PageActionBar y el pie del marco). Cada parte del componente trae su nombre (data-region); el
// contenido es un slot. Las regiones no llevan overflow-hidden para no recortar la pastilla con su nombre.
// Bloques grises tenues en lugar del slot rayado: en «Probar en pantalla» la maqueta debe verse como contenido real.
function ContentBehind({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn('flex min-w-0 flex-1 flex-col gap-3 self-stretch', className)}>
      <div className="h-9 w-64 max-w-full shrink-0 rounded-lg bg-foreground/8" />
      <div className="grid min-h-72 flex-1 grid-cols-3 gap-3">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="rounded-xl border bg-foreground/4" />
        ))}
      </div>
    </div>
  )
}

// `real`: «Probar en pantalla» dentro del marco real del Workspace. La miga del caso la pinta la barra de arriba de
// verdad (se le registra), así que no se dibuja la franja gris de la vista previa. Implica `bare`.
export function PagePreview({
  config: c,
  sample: s,
  bare: bareProp,
  real = false,
}: {
  config: PageConfig
  sample: PageSample
  bare?: boolean
  real?: boolean
}) {
  const bare = bareProp || real
  const [favorite, setFavorite] = useState(false)
  const [agent, setAgent] = useState(false)
  const shape = c.ai ? PILL : WS

  const media =
    c.media === 'icon' ? (
      <IconTile variant="soft" size={ICON_TILE[c.mediaSize]}>
        <HugeiconsIcon icon={s.icon} />
      </IconTile>
    ) : c.media === 'avatar' ? (
      <Avatar size={AVATAR[c.mediaSize]}>
        <AvatarFallback>{s.initials}</AvatarFallback>
      </Avatar>
    ) : c.media === 'orb' ? (
      <Orb className={ORB[c.mediaSize]} />
    ) : undefined

  const titleAction =
    c.titleAction === 'favorite' ? (
      <BotonIcono
        data-region="Favorito"
        className={cn(shape, 'text-muted-foreground!')}
        aria-pressed={favorite}
        aria-label={favorite ? 'Quitar de favoritos' : 'Marcar como favorito'}
        onClick={() => setFavorite((value) => !value)}
      >
        <HugeiconsIcon icon={StarIcon} size={18} className={favorite ? 'text-warning' : undefined} />
      </BotonIcono>
    ) : c.titleAction === 'edit' ? (
      <BotonIcono data-region="Editar nombre" className={cn(shape, 'text-muted-foreground!')} aria-label="Editar nombre" onClick={() => notify('Editar nombre', undefined, 'info')}>
        <HugeiconsIcon icon={PencilEdit02Icon} size={17} />
      </BotonIcono>
    ) : undefined

  const buttons = c.modoIa !== 'none' || c.more || c.secondary || c.primary

  const actions =
    c.records !== 'none' || buttons ? (
      <>
        {c.records !== 'none' ? (
          <>
            <RecordNav counter={c.records === 'counter'} />
            {buttons ? <Separator orientation="vertical" className="mx-3 h-6!" /> : null}
          </>
        ) : null}
        {c.more ? (
          <DropdownMenu>
            <DropdownMenuTrigger render={<BotonIcono data-region="Más acciones" data-chip="top" size="icon" className={shape} aria-label="Más acciones" />}>
              <HugeiconsIcon icon={MoreHorizontalIcon} size={18} />
            </DropdownMenuTrigger>
            {/* Primero de la fila, con su menú abriendo hacia adentro (decisión 15 de la auditoría). */}
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuItem onClick={() => notify('Duplicado', undefined, 'success')}>Duplicar</DropdownMenuItem>
              <DropdownMenuItem onClick={() => notify('Enlace copiado', undefined, 'success')}>Copiar enlace</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
        {c.secondary ? (
          <Button data-region="Botón secundario" variant="outline" className={shape} onClick={() => notify(s.secondary, undefined, 'info')}>
            {s.secondaryIcon ? <HugeiconsIcon icon={s.secondaryIcon} size={16} /> : null}
            {s.secondary}
          </Button>
        ) : null}
        {c.primary ? (
          <Button data-region="Botón primario" className={shape} onClick={() => notify(s.primary, undefined, 'info')}>
            {s.primaryIcon ? <HugeiconsIcon icon={s.primaryIcon} size={16} /> : null}
            {s.primary}
          </Button>
        ) : null}
        {/* Orbit: siempre el último de la fila, a la derecha del primario (18 sep); abre el agente contextual de verdad. */}
        {c.modoIa !== 'none' ? <ReopenAgentButton region="Orbit" chip="top" compact={c.modoIa === 'orb'} onClick={() => setAgent(true)} /> : null}
      </>
    ) : undefined

  // Franja bajo el título: pestañas o menú del producto y, a la derecha, el cambio de vista. Cada pieza trae su nombre.
  const under =
    c.under !== 'none' || c.views ? (
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        {c.under === 'tabs' ? <PreviewTabs config={c} sample={s} /> : null}
        {c.under === 'menu' ? (
          <div className="min-w-0 flex-1">
            <ProductMenu config={c} sample={s} />
          </div>
        ) : null}
        {c.views ? <ViewSwitch /> : null}
      </div>
    ) : undefined

  const vista = (
    <>
      {/* La miga de pan vive arriba, en la barra del marco, pegada al botón que abre y cierra el menú. Aquí se
          dibuja esa franja para poder verla en su sitio: no es parte del marco de página (va en gris de slot). */}
      {c.crumbs !== 'off' && !real ? (
        <div data-slot-region="Barra superior" className="mb-6 flex h-15 items-center gap-2 rounded-xl border border-dashed px-3">
          <BotonIcono aria-label="Abrir o cerrar el menú" onClick={() => notify('Abrir o cerrar el menú', undefined, 'info')}>
            <HugeiconsIcon icon={SidebarLeftIcon} size={17} />
          </BotonIcono>
          <PreviewBreadcrumbs config={c} sample={s} />
        </div>
      ) : null}
    <PageShell width={c.width}>
      <PageHeader
        breadcrumbs={real && c.crumbs !== 'off' ? s.crumbs.map((label) => ({ label })) : false}
        back={c.top === 'back' ? { label: s.back, variant: c.back, onClick: () => notify(`Volver a ${s.back}`, undefined, 'info') } : undefined}
        kicker={c.kicker ? s.kicker : undefined}
        media={media}
        title={s.title}
        titleSize={c.titleSize}
        titleAction={titleAction}
        badge={c.badge ? <Badge variant={s.badgeVariant ?? 'secondary'}>{s.badge}</Badge> : undefined}
        description={c.description === 'short' ? s.short : c.description === 'long' ? s.long : undefined}
        meta={
          c.meta
            ? s.meta.map((item) => (
                <span key={item.text} className="flex items-center gap-1.5">
                  <HugeiconsIcon icon={item.icon} size={15} />
                  {item.text}
                </span>
              ))
            : undefined
        }
        actions={actions}
        tabs={under}
        tabsRegion={false}
      />

      {c.steps === 'horizontal' ? <PreviewSteps config={c} /> : null}

      <div className="mt-6 flex flex-1 items-start gap-8">
        {c.steps === 'vertical' ? <PreviewSteps config={c} /> : null}

        {c.inner === 'menu' ? (
          <nav data-region="Menú interno" aria-label="Secciones" className="flex w-48 shrink-0 flex-col gap-0.5">
            {INNER_MENU.map((item, index) => (
              <Button
                key={item.label}
                variant={index === 0 ? 'secondary' : 'ghost'}
                aria-current={index === 0 ? 'page' : undefined}
                className={cn('h-9 w-full justify-start gap-2 px-3', WS, index !== 0 && 'text-muted-foreground!')}
                onClick={() => notify(item.label, undefined, 'info')}
              >
                <HugeiconsIcon icon={item.icon} size={17} />
                {item.label}
              </Button>
            ))}
          </nav>
        ) : null}

        {c.inner === 'tabs' ? <VerticalTabs config={c} sample={s} /> : null}

        {c.inner === 'list' ? (
          <div data-region="Lista" className="w-64 shrink-0">
            <div className="flex flex-col overflow-hidden rounded-xl border">
              {LIST.map((row, index) => (
                <div key={row.title} className={cn('flex flex-col gap-1 border-b px-3.5 py-2.5 last:border-b-0', index === 0 && 'bg-muted')}>
                  <span className="truncate text-sm font-medium">{row.title}</span>
                  <span className="truncate text-xs text-muted-foreground">{row.meta}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {c.inner === 'toc' ? (
          <DocumentWithToc hint={s.slot} bare={bare} />
        ) : c.inner === 'chips' ? (
          <div className="flex min-w-0 flex-1 flex-col gap-4 self-stretch">
            <QuickFilters sample={s} />
            {bare ? <ContentBehind className="min-h-72" /> : <SlotArea name={SLOT_NAME[c.inner]} hint={s.slot} className="min-h-72" />}
          </div>
        ) : bare ? (
          <ContentBehind className="min-h-80" />
        ) : (
          <SlotArea name={SLOT_NAME[c.inner]} hint={s.slot} className="min-h-80 self-stretch" />
        )}
      </div>

      {c.pagination !== 'none' ? <PreviewPagination /> : null}

      {/* En la vista previa la barra no se pega al fondo de la ventana: queda en su lugar, bajo el contenido. */}
      {c.footer === 'save' ? (
        <PageActionBar className="relative! bottom-auto! mt-6 shadow-sm">
          <HugeiconsIcon icon={InformationCircleIcon} size={18} className="text-primary" />
          <span className="text-sm">Tienes 2 cambios sin guardar</span>
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" className={shape} onClick={() => notify('Cambios descartados', undefined, 'info')}>
              Descartar
            </Button>
            <Button className={shape} onClick={() => notify('Cambios guardados', undefined, 'success')}>
              Guardar cambios
            </Button>
          </div>
        </PageActionBar>
      ) : null}

      {c.footer === 'wizard' ? (
        <PageActionBar className="relative! bottom-auto! mt-6 shadow-sm">
          {/* Como en Crear vacante (5-oct): el estado del guardado a la izquierda (informa, no se pulsa). A mitad del
              asistente y sin borrador real dice «Cambios sin guardar», no «Guardado» (13-oct, «guardado-honesto»). */}
          <ChipGuardado estado="editando" />
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" className={shape} onClick={() => notify('Paso anterior', undefined, 'info')}>
              <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
              Atrás
            </Button>
            <Button className={shape} onClick={() => notify('Siguiente paso', undefined, 'info')}>
              Siguiente
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            </Button>
          </div>
        </PageActionBar>
      ) : null}

      {/* Con el marco real el pie ya lo pone el marco: no se repite. */}
      {c.footer === 'legal' && !real ? (
        <div data-region="Pie" className="mt-10 [&>footer]:m-0! [&>footer]:p-0!">
          <AppFooter siempre />
        </div>
      ) : null}

      <AgentDrawer open={agent} onOpenChange={setAgent} />
    </PageShell>
    </>
  )

  return real ? <PantallaReal ruta="/admin/seleccion/vacantes">{vista}</PantallaReal> : vista
}
