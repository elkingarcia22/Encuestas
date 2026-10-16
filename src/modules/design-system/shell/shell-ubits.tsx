import { Fragment, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import type { IconSvgElement } from '@hugeicons/react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft01Icon,
  ChevronRightIcon,
  LogOutIcon,
  Notification03Icon,
  Search01Icon,
  UnfoldMoreIcon,
  UserIcon,
} from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  cn,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  Text,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { ImagenGlass } from '@/shared/components/ImagenGlass'
import { SinResultados } from '@/shared/components/SinResultados'

import { ThemeToggle } from '@/shared/components/ThemeToggle'
import { SidebarModeTabs, type SidebarMode } from '../templates/shell-test/components/sidebar-mode-tabs'

// El marco único del playground: lo usan las páginas del design system y los templates de
// producto, para que todo se vea con las mismas medidas. Menú lateral flotante de 264 px,
// encabezado con migas y el cuerpo centrado a 1.140 px.
//
// Se monta a pantalla completa por encima del layout general (que es zona de ingeniería y no se
// toca desde las maquetas), igual que ya lo hacían los templates.

const ANCHO_CUERPO = 'max-w-[1140px]'

// Un hijo con sus propios hijos es un tercer nivel (LMS Creator → Contenidos…): al tocarlo, el
// menú entero pasa a mostrar ese nivel, con una fila para volver.
export type HijoNav = { titulo: string; ruta?: string; hijos?: HijoNav[] }
export type ItemNav = {
  titulo: string
  icono: IconSvgElement
  ruta?: string
  badge?: string
  hijos?: HijoNav[]
  // Para entradas del pie que abren algo en vez de navegar (p. ej. el modal de Feedback).
  accion?: () => void
}
export type GrupoNav = { etiqueta: string; items: ItemNav[] }
export type Miga = { etiqueta: string; ruta?: string }

type Marca = {
  nombre: string
  inicial: string
  logo?: string
  menu?: ReactNode
  // Reemplaza toda la fila del logo: el menú de empresa del administrador se abre desde la fila
  // completa, no solo desde los tres puntos (HU-INI-002, RN-10).
  fila?: ReactNode
}
type Usuario = { nombre: string; detalle: string; foto?: string; correo?: string; iniciales: string }

type Props = {
  marca: Marca
  inicio: ItemNav
  grupos: GrupoNav[]
  migas: Miga[]
  usuario?: Usuario
  pie?: ItemNav[]
  buscador?: boolean
  acciones?: ReactNode
  notificaciones?: number
  // Si el template trae sus propias notificaciones y menú de cuenta en el encabezado, van aquí y
  // reemplazan la campana y el botón de tema por defecto.
  cuenta?: ReactNode
  // Tarjeta al pie del menú lateral, encima de las entradas del pie.
  promo?: ReactNode
  // Qué muestra la pestaña «Suite AI»: su propio menú lateral (historial de chats) y su vista.
  // Sin esto, la pestaña solo muestra un aviso en el menú. Sin vista, el cuerpo sigue mostrando
  // la ruta actual (templates donde cada chat es una ruta).
  agente?: { menu: ReactNode; vista?: ReactNode }
  // Por defecto una entrada está activa si la ruta actual es la suya. Se puede cambiar (p. ej.
  // la ficha de un contenido marca «Zona de estudio»).
  esActiva?: (ruta: string, pathname: string) => boolean
  // Opciones que por defecto no cambian nada (las usa el template Suite AI):
  // - modo / onModoChange: la pestaña Workspace o Suite AI la decide el template (p. ej. según la
  //   ruta). Sin esto, el marco la maneja solo y vuelve al Workspace al navegar.
  modo?: SidebarMode
  onModoChange?: (modo: SidebarMode) => void
  // - iconosModo: íconos de las dos pestañas.
  iconosModo?: { workspace?: ReactNode; agente?: ReactNode }
  // - variante: menú flotante (por defecto) o pegado al borde con una línea.
  variante?: 'floating' | 'sidebar'
  // - abierto / onAbiertoChange: menú abierto o plegado a íconos, decidido por el template.
  abierto?: boolean
  onAbiertoChange?: (abierto: boolean) => void
  // - lateral: panel acoplado a la derecha a toda la altura (agente contextual, actividad).
  lateral?: ReactNode
  children: ReactNode
}

type Profundo = { titulo: string; padre: string; hijos: HijoNav[] }

const activaPorDefecto = (ruta: string, pathname: string) => pathname === ruta

// El tercer nivel que contiene la pantalla actual, para mostrarlo abierto al llegar a ella.
function profundoDe(grupos: GrupoNav[], activa: (ruta?: string) => boolean): Profundo | null {
  for (const grupo of grupos) {
    for (const item of grupo.items) {
      for (const hijo of item.hijos ?? []) {
        if (hijo.hijos?.some((nieto) => activa(nieto.ruta))) {
          return { titulo: hijo.titulo, padre: item.titulo, hijos: hijo.hijos }
        }
      }
    }
  }
  return null
}

function filtrar(grupos: GrupoNav[], consulta: string) {
  const q = consulta.trim().toLowerCase()
  if (!q) return grupos
  return grupos
    .map((grupo) => ({
      ...grupo,
      items: grupo.items.flatMap((item) => {
        if (item.titulo.toLowerCase().includes(q)) return [item]
        const hijos = item.hijos?.filter((h) => h.titulo.toLowerCase().includes(q))
        return hijos?.length ? [{ ...item, hijos }] : []
      }),
    }))
    .filter((grupo) => grupo.items.length > 0)
}

// ── Menú lateral ──

function Entrada({
  item,
  activa,
  seleccion,
  onSeleccion,
  onProfundizar,
  forzarAbierto,
}: {
  item: ItemNav
  activa: (ruta?: string, titulo?: string) => boolean
  seleccion: string
  onSeleccion: (titulo: string) => void
  onProfundizar: (profundo: Profundo) => void
  forzarAbierto: boolean
}) {
  const hijoActivo =
    item.hijos?.some((h) => activa(h.ruta, h.titulo) || (h.hijos?.some((n) => activa(n.ruta, n.titulo)) ?? false)) ?? false
  const [abierto, setAbierto] = useState(hijoActivo)
  const abiertoReal = forzarAbierto || abierto

  if (!item.hijos?.length) {
    const esta = activa(item.ruta, item.titulo)
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={item.titulo}
          isActive={esta}
          aria-current={esta ? 'page' : undefined}
          render={item.ruta ? <Link to={item.ruta} /> : undefined}
          onClick={item.ruta ? undefined : () => onSeleccion(item.titulo)}
          className="min-w-0"
        >
          <HugeiconsIcon icon={item.icono} aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate">{item.titulo}</span>
          {item.badge ? (
            <Badge variant="primary-light" size="sm" radius="full" className="shrink-0 group-data-[collapsible=icon]:hidden">
              {item.badge}
            </Badge>
          ) : null}
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  return (
    <Collapsible open={abiertoReal} onOpenChange={setAbierto} className="group/collapsible min-w-0">
      <SidebarMenuItem>
        <CollapsibleTrigger
          render={<SidebarMenuButton tooltip={item.titulo} isActive={hijoActivo && !abiertoReal} className="min-w-0" />}
        >
          <HugeiconsIcon icon={item.icono} aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate">{item.titulo}</span>
          {item.badge ? (
            <Badge variant="primary-light" size="sm" radius="full" className="mr-1 shrink-0 group-data-[collapsible=icon]:hidden">
              {item.badge}
            </Badge>
          ) : null}
          <HugeiconsIcon
            icon={ChevronRightIcon}
            aria-hidden="true"
            className={cn('ml-auto size-4 shrink-0 transition-transform group-data-[collapsible=icon]:hidden', abiertoReal && 'rotate-90')}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="min-w-0 overflow-hidden">
          <SidebarMenuSub className="min-w-0 overflow-hidden">
            {item.hijos.map((hijo) => {
              const nietos = hijo.hijos
              if (nietos?.length) {
                const dentro = nietos.some((n) => activa(n.ruta, n.titulo))
                return (
                  <SidebarMenuSubItem key={hijo.titulo}>
                    <SidebarMenuSubButton
                      isActive={dentro}
                      render={
                        <Link
                          to="#"
                          onClick={(e) => {
                            e.preventDefault()
                            onProfundizar({ titulo: hijo.titulo, padre: item.titulo, hijos: nietos })
                          }}
                        />
                      }
                      className="min-w-0"
                    >
                      <span className="min-w-0 flex-1 truncate">{hijo.titulo}</span>
                      <HugeiconsIcon icon={ChevronRightIcon} aria-hidden="true" className="ml-auto size-4 shrink-0" />
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                )
              }
              const esta = activa(hijo.ruta, hijo.titulo) || (!hijo.ruta && seleccion === hijo.titulo)
              return (
                <SidebarMenuSubItem key={hijo.titulo}>
                  <SidebarMenuSubButton
                    isActive={esta}
                    aria-current={esta ? 'page' : undefined}
                    render={hijo.ruta ? <Link to={hijo.ruta} /> : <Link to="#" onClick={(e) => { e.preventDefault(); onSeleccion(hijo.titulo) }} />}
                    className="min-w-0"
                  >
                    <span className="min-w-0 truncate">{hijo.titulo}</span>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              )
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

// Tercer nivel abierto: reemplaza el menú completo, con una fila arriba para volver.
function Profundidad({
  profundo,
  activa,
  onVolver,
}: {
  profundo: Profundo
  activa: (ruta?: string, titulo?: string) => boolean
  onVolver: () => void
}) {
  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip={`Volver a ${profundo.padre}`} onClick={onVolver} className="min-w-0">
                <HugeiconsIcon icon={ArrowLeft01Icon} aria-hidden="true" />
                <span className="sr-only">Volver al menú: </span>
                <span className="min-w-0 flex-1 truncate">{profundo.titulo}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <SidebarSeparator />
      <SidebarGroup>
        <SidebarGroupLabel>{profundo.padre}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {profundo.hijos.map((nieto) => {
              const esta = activa(nieto.ruta, nieto.titulo)
              return (
                <SidebarMenuItem key={nieto.titulo}>
                  <SidebarMenuButton
                    tooltip={nieto.titulo}
                    isActive={esta}
                    aria-current={esta ? 'page' : undefined}
                    render={nieto.ruta ? <Link to={nieto.ruta} /> : undefined}
                    className="min-w-0"
                  >
                    <span className="min-w-0 flex-1 truncate">{nieto.titulo}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  )
}

function MenuUsuario({ usuario }: { usuario: Usuario }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<SidebarMenuButton size="lg" className="min-w-0" />}>
        <Avatar size="sm">
          {usuario.foto ? <AvatarImage src={usuario.foto} alt="" /> : null}
          <AvatarFallback>{usuario.iniciales}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-1 group-data-[collapsible=icon]:hidden">
          <Text as="span" size="sm" weight="medium" className="truncate">
            {usuario.nombre}
          </Text>
          <Text as="span" variant="muted" size="xs" className="truncate">
            {usuario.detalle}
          </Text>
        </div>
        <HugeiconsIcon icon={UnfoldMoreIcon} aria-hidden="true" className="ml-auto size-4 shrink-0 group-data-[collapsible=icon]:hidden" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-60">
        <DropdownMenuGroup>
          {usuario.correo ? <DropdownMenuLabel>{usuario.correo}</DropdownMenuLabel> : null}
          <DropdownMenuItem>
            <HugeiconsIcon icon={UserIcon} aria-hidden="true" />
            Mi perfil
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {/* Sin variant="destructive": en los menús translúcidos la librería le pone el color
            --accent-foreground, que en este tema es casi blanco y lo deja ilegible. */}
        <DropdownMenuItem>
          <HugeiconsIcon icon={LogOutIcon} aria-hidden="true" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ── Encabezado ──

function Encabezado({
  migas,
  acciones,
  cuenta,
  notificaciones,
}: {
  migas: Miga[]
  acciones?: ReactNode
  cuenta?: ReactNode
  notificaciones?: number
}) {
  return (
    <header className="flex shrink-0 items-center justify-between gap-2 px-6 py-5">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger />
        <Breadcrumb className="min-w-0">
          <BreadcrumbList>
            {migas.map((miga, indice) => {
              const ultima = indice === migas.length - 1
              // En pantallas angostas se esconden las migas del medio junto con su separador.
              const intermedia = indice > 0 && !ultima
              return (
                <Fragment key={`${miga.etiqueta}-${indice}`}>
                  {indice > 0 ? <BreadcrumbSeparator className={intermedia ? 'hidden md:inline-flex' : undefined} /> : null}
                  <BreadcrumbItem className={intermedia ? 'hidden md:inline-flex' : undefined}>
                    {ultima ? (
                      <BreadcrumbPage className="max-w-60 truncate">{miga.etiqueta}</BreadcrumbPage>
                    ) : miga.ruta ? (
                      <BreadcrumbLink render={<Link to={miga.ruta} />}>{miga.etiqueta}</BreadcrumbLink>
                    ) : (
                      miga.etiqueta
                    )}
                  </BreadcrumbItem>
                </Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {acciones}
        {cuenta ?? (
          <>
            <Hint label="Notificaciones">
              <BotonIcono aria-label={`${notificaciones ?? 0} notificaciones sin leer`} className="relative">
                <HugeiconsIcon icon={Notification03Icon} aria-hidden="true" />
                {notificaciones ? (
                  <Badge variant="destructive" size="xs" radius="full" className="absolute -top-1.5 -right-1.5" aria-hidden="true">
                    {notificaciones}
                  </Badge>
                ) : null}
              </BotonIcono>
            </Hint>
            <ThemeToggle />
          </>
        )}
      </div>
    </header>
  )
}

export function ShellUbits({
  marca,
  inicio,
  grupos,
  migas,
  usuario,
  pie = [],
  buscador = false,
  acciones,
  notificaciones = 3,
  cuenta,
  promo,
  agente,
  esActiva = activaPorDefecto,
  modo: modoControlado,
  onModoChange,
  iconosModo,
  variante = 'floating',
  abierto,
  onAbiertoChange,
  lateral,
  children,
}: Props) {
  const { pathname } = useLocation()
  const [modoPropio, setModoPropio] = useState<SidebarMode>('workspace')
  const modo = modoControlado ?? modoPropio
  const setModo = (siguiente: SidebarMode) => {
    onModoChange?.(siguiente)
    if (modoControlado === undefined) setModoPropio(siguiente)
  }
  const [consulta, setConsulta] = useState('')
  // Para menús sin rutas (templates que muestran el menú de un producto sin sus pantallas).
  const [seleccion, setSeleccion] = useState(inicio.titulo)

  const visibles = useMemo(() => filtrar(grupos, consulta), [grupos, consulta])
  const activa = (ruta?: string, titulo?: string) => (ruta ? esActiva(ruta, pathname) : !!titulo && seleccion === titulo)
  const activaRuta = (ruta?: string) => (ruta ? esActiva(ruta, pathname) : false)

  const [profundo, setProfundo] = useState<Profundo | null>(() => profundoDe(grupos, activaRuta))
  const [rutaVista, setRutaVista] = useState(pathname)
  if (rutaVista !== pathname) {
    // Al navegar se vuelve al Workspace y el menú muestra el nivel de la pantalla nueva.
    setRutaVista(pathname)
    if (modoControlado === undefined) setModoPropio('workspace')
    setProfundo(profundoDe(grupos, activaRuta))
  }

  const enAgente = modo === 'agente-ia'
  const migasVisibles = enAgente && agente?.vista ? [{ etiqueta: 'Orbit' }] : migas

  return (
    <div className="bg-background fixed inset-0 z-50 overflow-auto">
      <SidebarProvider open={abierto} onOpenChange={onAbiertoChange} style={{ '--sidebar-width': '264px' } as CSSProperties}>
        <Sidebar collapsible="icon" variant={variante}>
          <SidebarHeader className="min-w-0 gap-3 overflow-hidden p-3">
            {marca.fila ?? (
              <div className="flex min-w-0 items-center justify-between gap-1">
                <div className="flex min-w-0 items-center gap-2">
                  <Avatar className="shrink-0">
                    {marca.logo ? <AvatarImage src={marca.logo} alt="" /> : null}
                    <AvatarFallback>{marca.inicial}</AvatarFallback>
                  </Avatar>
                  <Text as="span" weight="semibold" className="min-w-0 flex-1 truncate group-data-[collapsible=icon]:hidden">
                    {marca.nombre}
                  </Text>
                </div>
                {marca.menu}
              </div>
            )}
            <SidebarModeTabs mode={modo} onModeChange={setModo} iconos={iconosModo} />
            {buscador ? (
              <InputGroup className="min-w-0 group-data-[collapsible=icon]:hidden">
                <InputGroupAddon>
                  <HugeiconsIcon icon={Search01Icon} aria-hidden="true" />
                </InputGroupAddon>
                <InputGroupInput value={consulta} onChange={(e) => setConsulta(e.target.value)} placeholder="Buscar en el menú…" aria-label="Buscar en el menú" />
              </InputGroup>
            ) : null}
          </SidebarHeader>

          <SidebarContent className="overflow-x-hidden overflow-y-auto">
            {enAgente ? (
              (agente?.menu ?? (
                <div className="px-2 py-6 group-data-[collapsible=icon]:hidden">
                  {/* Vacío con ilustración glass (decisión 14 de la auditoría, 5-oct): la del chat, que es la de Orbit. */}
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="default">
                        <ImagenGlass nombre="glass-chat" />
                      </EmptyMedia>
                      <EmptyTitle>Orbit</EmptyTitle>
                      <EmptyDescription>El chat de Orbit vive fuera del menú del Workspace.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </div>
              ))
            ) : profundo && !consulta ? (
              <Profundidad profundo={profundo} activa={activa} onVolver={() => setProfundo(null)} />
            ) : (
            <>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <Entrada
                    item={inicio}
                    activa={activa}
                    seleccion={seleccion}
                    onSeleccion={setSeleccion}
                    onProfundizar={setProfundo}
                    forzarAbierto={false}
                  />
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            {visibles.map((grupo) => (
              <SidebarGroup key={grupo.etiqueta}>
                <SidebarGroupLabel>{grupo.etiqueta}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {grupo.items.map((item) => (
                      <Entrada
                        key={`${item.titulo}-${consulta ? 'q' : ''}`}
                        item={item}
                        activa={activa}
                        seleccion={seleccion}
                        onSeleccion={setSeleccion}
                        onProfundizar={setProfundo}
                        forzarAbierto={Boolean(consulta)}
                      />
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
            {/* El buscador del menú sin coincidencias: la pieza del sistema, con su ilustración y el botón para limpiar. */}
            {!visibles.length ? (
              <div className="group-data-[collapsible=icon]:hidden">
                <SinResultados busqueda={consulta} onLimpiar={() => setConsulta('')} />
              </div>
            ) : null}
            </>
            )}
          </SidebarContent>

          <SidebarFooter className="min-w-0 gap-1 overflow-hidden p-3">
            {promo}
            <SidebarMenu>
              {pie.map((item) => (
                <SidebarMenuItem key={item.titulo}>
                  <SidebarMenuButton
                    tooltip={item.titulo}
                    render={item.ruta ? <Link to={item.ruta} /> : undefined}
                    onClick={item.accion}
                    className="min-w-0"
                  >
                    <HugeiconsIcon icon={item.icono} aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate">{item.titulo}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {usuario ? (
                <SidebarMenuItem>
                  <MenuUsuario usuario={usuario} />
                </SidebarMenuItem>
              ) : null}
            </SidebarMenu>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset>
          <Encabezado migas={migasVisibles} acciones={acciones} cuenta={cuenta} notificaciones={notificaciones} />
          {/* SidebarInset ya es el <main> de la página; el cuerpo solo limita el ancho. Si algo de
              la librería no se encoge en pantallas angostas (la cabecera del data-grid), se desliza
              dentro del cuerpo en vez de mover toda la página hacia los lados. */}
          <div className={cn('mx-auto flex w-full min-w-0 flex-1 flex-col overflow-x-auto px-6 pb-10', ANCHO_CUERPO)}>
            {enAgente && agente?.vista ? agente.vista : children}
          </div>
        </SidebarInset>
        {/* Panel acoplado: en pantallas angostas no cabe junto al cuerpo y se oculta. */}
        {lateral ? (
          <aside className="bg-background border-border sticky top-0 hidden h-svh w-[380px] shrink-0 flex-col border-l lg:flex">{lateral}</aside>
        ) : null}
      </SidebarProvider>
    </div>
  )
}
