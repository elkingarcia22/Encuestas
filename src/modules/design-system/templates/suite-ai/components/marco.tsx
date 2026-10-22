import { Fragment, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUpRight01Icon,
  Clock01Icon,
  Comment01Icon,
  DashboardSquare02Icon,
  File01Icon,
  HelpCircleIcon,
  LockPasswordIcon,
  Logout03Icon,
  Megaphone02Icon,
  Menu01Icon,
  Moon02Icon,
  Notification02Icon,
  Notification03Icon,
  PreferenceHorizontalIcon,
  Refresh01Icon,
  Search01Icon,
  Settings02Icon,
  Sun03Icon,
} from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  ButtonGroup,
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
  IconTile,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
  Kbd,
  KbdGroup,
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
  Progress,
  Separator,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  Spinner,
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
  ToggleGroup,
  ToggleGroupItem,
  toast,
  useTheme,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { CloseButton } from '@/shared/components/CloseButton'
import { Hint } from '@/shared/components/Hint'
import { Orb } from '@/shared/components/Orb'

import textura from '../assets/textura.jpg'
import { CASOS, CONFIGURACION, ESPACIOS, HISTORIAL, LICENCIAS, ORGANIZACIONES, PERSONA, ruta } from './data'
import { useSuite } from './estado'
import { LogoEmpresa } from './piezas'

// Piezas del marco de Suite AI que van dentro de ShellUbits: logo y organización arriba del
// menú, historial de chats, pie del menú y botones del encabezado. Todo con flux-ui.

/* ------------------------------------------------ logo y organización */

export function FilaMarca() {
  const suite = useSuite()
  const navigate = useNavigate()
  const disponibles = LICENCIAS.total - LICENCIAS.usadas

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex h-8 items-center px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
        <LogoEmpresa className="h-6 group-data-[collapsible=icon]:h-4" />
      </div>
      <SidebarMenu className="group-data-[collapsible=icon]:hidden">
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<SidebarMenuButton size="lg" variant="outline" aria-label={`${suite.organizacion}, espacio de ${suite.espacio}`} className="min-w-0" />}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Text as="span" size="sm" weight="medium" className="truncate">
                  {suite.organizacion}
                </Text>
                <Text as="span" variant="muted" size="xs" className="truncate">
                  Espacio de {suite.espacio}
                </Text>
              </div>
              <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" className="ml-auto size-4 shrink-0" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuGroup>
                <div className="flex items-center gap-3 px-2 pt-2">
                  <LogoEmpresa />
                  <div className="flex min-w-0 flex-col gap-1">
                    <Text as="span" size="sm" weight="medium" className="truncate">
                      {suite.organizacion}
                    </Text>
                    <Text as="span" variant="muted" size="xs">
                      Licencias: {LICENCIAS.usadas} / {LICENCIAS.total.toLocaleString('es-CO')}
                    </Text>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 px-2 py-2">
                  <Progress
                    value={(LICENCIAS.usadas / LICENCIAS.total) * 100}
                    aria-label={`Licencias usadas: ${LICENCIAS.usadas} de ${LICENCIAS.total.toLocaleString('es-CO')}`}
                  />
                  <Text as="span" variant="muted" size="xs">
                    {disponibles} licencias disponibles
                  </Text>
                </div>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Configuración</DropdownMenuLabel>
                {CONFIGURACION.map((ajuste) => (
                  <DropdownMenuItem key={ajuste.slug} onClick={() => navigate(ruta(ajuste.slug))}>
                    <HugeiconsIcon icon={ajuste.icono} aria-hidden="true" />
                    {ajuste.titulo}
                    <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" className="ml-auto" />
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Organización</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={suite.organizacion} onValueChange={(valor) => suite.elegirOrganizacion(String(valor))}>
                  {ORGANIZACIONES.map((nombre) => (
                    <DropdownMenuRadioItem key={nombre} value={nombre} closeOnClick>
                      {nombre}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Espacio</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={suite.espacio} onValueChange={(valor) => suite.elegirEspacio(String(valor))}>
                  {ESPACIOS.map((nombre) => (
                    <DropdownMenuRadioItem key={nombre} value={nombre} closeOnClick>
                      {nombre}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </div>
  )
}

/* ------------------------------------------------ menú de Suite AI */

export function MenuSuite() {
  const suite = useSuite()
  const { pathname } = useLocation()
  // El chat nuevo (o el que salió del modo voz o del buscador) queda arriba en «Hoy».
  const grupos = suite.tituloLibre
    ? HISTORIAL.map((grupo, i) =>
        i === 0 ? { ...grupo, chats: [{ id: 'libre', titulo: suite.tituloLibre ?? '', ruta: ruta('chat/libre') }, ...grupo.chats] } : grupo,
      )
    : HISTORIAL

  return (
    <>
      <SidebarGroup>
        <SidebarGroupContent>
          <Button className="w-full group-data-[collapsible=icon]:hidden" onClick={suite.nuevoChat}>
            <HugeiconsIcon icon={Add01Icon} aria-hidden="true" />
            Nuevo chat
          </Button>
          <SidebarMenu className="hidden group-data-[collapsible=icon]:flex">
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Nuevo chat" onClick={suite.nuevoChat}>
                <HugeiconsIcon icon={Add01Icon} aria-hidden="true" />
                <span>Nuevo chat</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      {grupos.map((grupo) => (
        <SidebarGroup key={grupo.etiqueta} className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>{grupo.etiqueta}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {grupo.chats.map((chat) => {
                const activo = pathname === chat.ruta
                return (
                  <SidebarMenuItem key={chat.id}>
                    <SidebarMenuButton isActive={activo} aria-current={activo ? 'page' : undefined} render={<Link to={chat.ruta} />} className="min-w-0">
                      <span className="min-w-0 flex-1 truncate">{chat.titulo}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
      {/* En la conversación de la política de vacaciones se ven los procesos que dejó andando. */}
      {pathname === ruta('chat/vacaciones') ? (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel className="gap-2">
            Procesos
            <Badge variant="secondary" size="xs" radius="full">
              2
            </Badge>
          </SidebarGroupLabel>
          <SidebarGroupContent className="flex flex-col gap-2">
            <Item variant="outline" size="xs">
              <ItemMedia variant="icon">
                <Spinner />
              </ItemMedia>
              <ItemContent className="min-w-0">
                <ItemTitle className="truncate">Importación de usuarios</ItemTitle>
                <ItemDescription>
                  {suite.avance}% · {suite.avance * 3} de 300
                </ItemDescription>
              </ItemContent>
            </Item>
            <Item variant="outline" size="xs">
              <ItemMedia variant="icon">
                <HugeiconsIcon icon={Clock01Icon} aria-hidden="true" />
              </ItemMedia>
              <ItemContent className="min-w-0">
                <ItemTitle className="truncate">Reporte mensual</ItemTitle>
                <ItemDescription>En espera · inicia 22:00</ItemDescription>
              </ItemContent>
            </Item>
          </SidebarGroupContent>
        </SidebarGroup>
      ) : null}
    </>
  )
}

/* ------------------------------------------------------ pie del menú */

export function PieSuite({ onFeedback }: { onFeedback: () => void }) {
  const suite = useSuite()
  const navigate = useNavigate()

  return (
    <>
      {suite.invitacion ? (
        <Card size="sm" className="mb-1 group-data-[collapsible=icon]:hidden">
          {/* La imagen es el primer hijo de la tarjeta para que vaya a sangre. */}
          <img src={textura} alt="" className="h-16 w-full object-cover" />
          <CardHeader>
            <CardTitle>Nos renovamos para ti</CardTitle>
            <CardDescription>Una experiencia más simple, rápida e intuitiva. Conócela en 2 minutos.</CardDescription>
            <CardAction>
              <CloseButton label="Cerrar tarjeta del tour" onClick={() => suite.setInvitacion(false)} />
            </CardAction>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" size="sm" onClick={() => toast.add({ title: 'Empieza el tour por la plataforma' })}>
              Hacer el tour
            </Button>
          </CardFooter>
        </Card>
      ) : null}
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton variant="outline" tooltip="Enviar feedback" onClick={onFeedback} className="min-w-0">
            <HugeiconsIcon icon={Comment01Icon} aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">Enviar feedback</span>
            <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" className="ml-auto size-4 shrink-0 group-data-[collapsible=icon]:hidden" />
          </SidebarMenuButton>
        </SidebarMenuItem>
        {/* Los siete casos del concepto, como la barra de pestañas de su prototipo. */}
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger render={<SidebarMenuButton tooltip="Casos de uso" className="min-w-0" />}>
              <HugeiconsIcon icon={DashboardSquare02Icon} aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">Casos de uso</span>
              <Badge variant="secondary" size="xs" radius="full" className="shrink-0 group-data-[collapsible=icon]:hidden">
                {CASOS.length}
              </Badge>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" className="w-60">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Casos del concepto</DropdownMenuLabel>
                {CASOS.map((caso) => (
                  <DropdownMenuItem
                    key={caso.numero}
                    onClick={() => {
                      navigate(caso.ruta)
                      if (caso.buscador) suite.abrirBuscador(caso.buscador)
                    }}
                  >
                    <Kbd>{caso.numero}</Kbd>
                    {caso.titulo}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton tooltip="Volver a Templates" render={<Link to="/design-system/templates" />} className="min-w-0">
            <HugeiconsIcon icon={ArrowLeft01Icon} aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">Volver a Templates</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
      <div className="flex items-center gap-2 px-2 pt-2 group-data-[collapsible=icon]:hidden">
        <Text as="span" variant="muted" size="xs">
          Powered by
        </Text>
        <img src="/ubits-logo.svg" alt="UBITS" className="h-3.5 w-auto shrink-0 dark:hidden" />
        <img src="/ubits-logo-white.svg" alt="UBITS" className="hidden h-3.5 w-auto shrink-0 dark:block" />
      </div>
    </>
  )
}

/* ------------------------------------------------------ encabezado */

export function BotonBuscar({ forma }: { forma: 'icono' | 'campo' | 'amplio' }) {
  const suite = useSuite()

  if (forma === 'icono') {
    return (
      <Hint label="Buscar · ⌘K">
        <Button variant="outline" size="icon-sm" aria-label="Buscar o preguntar" onClick={() => suite.abrirBuscador()}>
          <HugeiconsIcon icon={Search01Icon} aria-hidden="true" />
        </Button>
      </Hint>
    )
  }

  return (
    <Button variant="outline" size="sm" className={forma === 'amplio' ? 'w-72 justify-start' : 'w-40 justify-start'} onClick={() => suite.abrirBuscador()}>
      <HugeiconsIcon icon={Search01Icon} aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate text-start">{forma === 'amplio' ? 'Buscar o preguntar' : 'Buscar'}</span>
      <KbdGroup aria-hidden="true">
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </KbdGroup>
    </Button>
  )
}

export function BotonNovedades({ compacto = false }: { compacto?: boolean }) {
  const suite = useSuite()
  return (
    <Button
      variant="outline"
      size={compacto ? 'icon-sm' : 'sm'}
      aria-label="Novedades: 3 mejoras nuevas"
      className="relative"
      onClick={() => suite.setPromo('novedades')}
    >
      <HugeiconsIcon icon={Megaphone02Icon} aria-hidden="true" />
      {compacto ? null : 'Novedades'}
      <Badge variant="destructive" size="xs" radius="full" className="absolute -top-1.5 -right-1.5" aria-hidden="true">
        3
      </Badge>
    </Button>
  )
}

export function BotonAyuda() {
  return (
    <Hint label="Centro de ayuda">
      <Button variant="outline" size="icon-sm" aria-label="Centro de ayuda" onClick={() => toast.add({ title: 'Centro de ayuda · guías y soporte' })}>
        <HugeiconsIcon icon={HelpCircleIcon} aria-hidden="true" />
      </Button>
    </Hint>
  )
}

const PROCESO_BARRA = [
  { icono: PreferenceHorizontalIcon, etiqueta: 'Filtrar procesos' },
  { icono: Refresh01Icon, etiqueta: 'Actualizando estado' },
  { icono: File01Icon, etiqueta: 'Exportar informe' },
  { icono: Notification02Icon, etiqueta: 'Avisarme al terminar' },
]

export function CentroProcesos() {
  const suite = useSuite()
  const abierto = suite.panel === 'procesos'
  const avisar = (titulo: string, cerrar = false) => {
    toast.add({ title: titulo })
    if (cerrar) suite.setPanel(null)
  }

  return (
    <Popover open={abierto} onOpenChange={(abrir) => suite.setPanel(abrir ? 'procesos' : null)}>
      <PopoverTrigger render={<Button variant={abierto ? 'default' : 'outline'} size="icon-sm" aria-label="Centro de procesos: 2 en curso" />}>
        <HugeiconsIcon icon={Menu01Icon} aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96">
        <div className="flex items-start gap-3">
          <IconTile variant="soft" size="sm">
            <HugeiconsIcon icon={Menu01Icon} aria-hidden="true" />
          </IconTile>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <PopoverTitle>Centro de procesos</PopoverTitle>
            <Text as="span" variant="muted" size="xs">
              2 en curso · 1 en espera
            </Text>
          </div>
          <BotonIcono size="icon-xs" aria-label="Ver todos los procesos" onClick={suite.verProcesos}>
            <HugeiconsIcon icon={ArrowUpRight01Icon} aria-hidden="true" />
          </BotonIcono>
          <CloseButton label="Cerrar" onClick={() => suite.setPanel(null)} />
        </div>
        <div className="flex flex-col gap-2">
          <Item variant="outline" size="sm">
            <ItemMedia variant="icon">
              <Spinner />
            </ItemMedia>
            <ItemContent className="min-w-0 gap-2">
              <div className="flex flex-col gap-1">
                <ItemTitle>Importación de usuarios</ItemTitle>
                <ItemDescription>
                  {suite.avance}% · {suite.avance * 3} de 300 filas
                </ItemDescription>
              </div>
              <Progress value={suite.avance} aria-label={`Importación de usuarios: ${suite.avance} %`} />
            </ItemContent>
            <ItemActions>
              <Button variant="link" size="xs" onClick={() => avisar('Detalle de la importación', true)}>
                Ver
              </Button>
            </ItemActions>
          </Item>
          <Item variant="outline" size="sm">
            <ItemMedia variant="icon">
              <HugeiconsIcon icon={File01Icon} aria-hidden="true" />
            </ItemMedia>
            <ItemContent className="min-w-0 gap-2">
              <div className="flex flex-col gap-1">
                <ItemTitle>Revisión sin terminar</ItemTitle>
                <ItemDescription>10 de 33 listos · faltan 13 usuarios</ItemDescription>
              </div>
              <Progress value={30} aria-label="Revisión: 10 de 33 listos" />
            </ItemContent>
            <ItemActions>
              <Button variant="link" size="xs" onClick={() => avisar('Retomando la revisión', true)}>
                Retomar
              </Button>
            </ItemActions>
          </Item>
          <Item variant="outline" size="sm">
            <ItemMedia variant="icon">
              <HugeiconsIcon icon={Clock01Icon} aria-hidden="true" />
            </ItemMedia>
            <ItemContent className="min-w-0">
              <ItemTitle>Reporte mensual</ItemTitle>
              <ItemDescription>En espera · inicia 22:00</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button variant="link" size="xs" onClick={() => avisar('Proceso cancelado', true)}>
                Cancelar
              </Button>
            </ItemActions>
          </Item>
        </div>
        <div className="flex items-center justify-between gap-2">
          <Text as="span" variant="muted" size="xs">
            Siguen corriendo si cierras el chat
          </Text>
          <Button variant="link" size="xs" onClick={suite.verProcesos}>
            Historial
          </Button>
        </div>
        <Separator />
        <div className="flex items-center gap-2">
          <ButtonGroup>
            {PROCESO_BARRA.map((accion) => (
              <Hint key={accion.etiqueta} label={accion.etiqueta}>
                <Button variant="outline" size="icon-sm" aria-label={accion.etiqueta} onClick={() => avisar(accion.etiqueta)}>
                  <HugeiconsIcon icon={accion.icono} aria-hidden="true" />
                </Button>
              </Hint>
            ))}
          </ButtonGroup>
          <Button size="sm" className="ml-auto" onClick={() => avisar('Nuevo proceso · importación, reporte o aviso', true)}>
            <HugeiconsIcon icon={Add01Icon} aria-hidden="true" />
            Nuevo proceso
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function PanelNotificaciones() {
  const suite = useSuite()
  const [pestana, setPestana] = useState('todas')
  const abierto = suite.panel === 'notificaciones'
  const nuevas = suite.notificaciones.filter((n) => n.nueva).length
  const visibles = pestana === 'todas' ? suite.notificaciones : suite.notificaciones.filter((n) => n.nueva)

  return (
    <Popover open={abierto} onOpenChange={(abrir) => suite.setPanel(abrir ? 'notificaciones' : null)}>
      <PopoverTrigger
        render={<Button variant="outline" size="icon-sm" aria-label={nuevas ? `Notificaciones: ${nuevas} sin leer` : 'Notificaciones'} className="relative" />}
      >
        <HugeiconsIcon icon={Notification03Icon} aria-hidden="true" />
        {nuevas ? (
          <Badge variant="destructive" size="xs" radius="full" className="absolute -top-1.5 -right-1.5" aria-hidden="true">
            {nuevas}
          </Badge>
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96">
        <div className="flex items-center gap-2">
          <PopoverTitle>Notificaciones</PopoverTitle>
          {nuevas ? (
            <Badge size="xs" radius="full">
              {nuevas}
            </Badge>
          ) : null}
          <Button variant="link" size="xs" className="ml-auto" disabled={!nuevas} onClick={suite.marcarLeidas}>
            Marcar todas
          </Button>
          <CloseButton label="Cerrar" onClick={() => suite.setPanel(null)} />
        </div>
        <Tabs value={pestana} onValueChange={(valor) => setPestana(String(valor))}>
          <TabsList>
            <TabsTrigger value="todas">Todas</TabsTrigger>
            <TabsTrigger value="sin-leer">Sin leer · {nuevas}</TabsTrigger>
          </TabsList>
        </Tabs>
        <ItemGroup>
          {pestana === 'todas' ? (
            <Item
              size="sm"
              variant="muted"
              render={
                <Link
                  to="#"
                  onClick={(e) => {
                    e.preventDefault()
                    suite.setPanel(null)
                    suite.setPromo('novedades')
                  }}
                />
              }
            >
              <ItemMedia>
                <Orb className="size-8" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Novedades de la v4.2</ItemTitle>
                <ItemDescription>Cuatro mejoras nuevas esta semana</ItemDescription>
              </ItemContent>
              <ItemActions>
                <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" className="size-4" />
              </ItemActions>
            </Item>
          ) : null}
          {visibles.map((notificacion, indice) => (
            <Fragment key={notificacion.id}>
              {indice > 0 || pestana === 'todas' ? <ItemSeparator /> : null}
              <Item size="sm">
                <ItemMedia variant="icon">
                  <HugeiconsIcon icon={notificacion.icono} aria-hidden="true" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>
                    {notificacion.titulo}
                    {notificacion.nueva ? (
                      <Badge variant="primary-light" size="xs">
                        Nueva
                      </Badge>
                    ) : null}
                  </ItemTitle>
                  <Text variant="muted" size="sm">
                    {notificacion.texto}
                  </Text>
                  <div className="flex items-center gap-2">
                    <Text as="span" variant="muted" size="xs">
                      {notificacion.cuando}
                    </Text>
                    {notificacion.accion ? (
                      <Button variant="link" size="xs" onClick={() => suite.abrirNotificacion(notificacion)}>
                        {notificacion.accion}
                      </Button>
                    ) : null}
                  </div>
                </ItemContent>
              </Item>
            </Fragment>
          ))}
        </ItemGroup>
        {!visibles.length ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Todo al día</EmptyTitle>
              <EmptyDescription>No tienes notificaciones sin leer.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}
        <Separator />
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="xs" onClick={() => toast.add({ title: 'Preferencias de notificación' })}>
            <HugeiconsIcon icon={Settings02Icon} aria-hidden="true" />
            Configurar avisos
          </Button>
          <Button variant="link" size="xs" onClick={() => toast.add({ title: 'Bandeja completa de notificaciones' })}>
            Ver todas
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function MenuPerfil() {
  const { mode, setMode } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<BotonIcono size="icon" aria-label={`Cuenta de ${PERSONA.nombre}`} />}>
        <Avatar size="sm">
          <AvatarFallback>{PERSONA.iniciales}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuGroup>
          <div className="flex items-start gap-3 px-2 py-2">
            <Avatar>
              <AvatarFallback>{PERSONA.iniciales}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col items-start gap-1.5">
              <div className="flex min-w-0 flex-col gap-1">
                <Text as="span" size="sm" weight="medium" className="truncate">
                  {PERSONA.nombre}
                </Text>
                <Text as="span" variant="muted" size="xs" className="truncate">
                  {PERSONA.correo}
                </Text>
              </div>
              <Badge variant="secondary" size="xs">
                {PERSONA.rol}
              </Badge>
            </div>
          </div>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem render={<Link to="/design-system/templates/colaborador" />}>
            <HugeiconsIcon icon={ArrowUpRight01Icon} aria-hidden="true" />
            Portal colaborador
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => toast.add({ title: 'Cambiar contraseña' })}>
            <HugeiconsIcon icon={LockPasswordIcon} aria-hidden="true" />
            Cambiar contraseña
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <div className="px-2 py-1.5">
          <ToggleGroup
            variant="outline"
            size="sm"
            value={[mode === 'dark' ? 'oscuro' : 'claro']}
            onValueChange={(valor) => valor[0] && setMode(valor[0] === 'oscuro' ? 'dark' : 'light')}
            aria-label="Tema"
          >
            <ToggleGroupItem value="claro" aria-label="Tema claro">
              <HugeiconsIcon icon={Sun03Icon} aria-hidden="true" />
            </ToggleGroupItem>
            <ToggleGroupItem value="oscuro" aria-label="Tema oscuro">
              <HugeiconsIcon icon={Moon02Icon} aria-hidden="true" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <DropdownMenuSeparator />
        {/* Sin variant="destructive": en los menús translúcidos queda casi blanco sobre blanco. */}
        <DropdownMenuItem render={<Link to="/design-system/templates/auth" />}>
          <HugeiconsIcon icon={Logout03Icon} aria-hidden="true" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
