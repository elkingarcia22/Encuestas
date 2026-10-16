import { HugeiconsIcon } from '@hugeicons/react'
import {
  MoreHorizontalIcon,
  Notification03Icon,
  Search01Icon,
} from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Kbd,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  Text,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'

import { MARCA, USUARIO } from './data'
import { NavMain } from './nav-main'
import { UsageCard } from './usage-card'

function Marca() {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Avatar className="shrink-0">
        <AvatarFallback>{MARCA.inicial}</AvatarFallback>
      </Avatar>
      <Text as="span" weight="semibold" className="min-w-0 flex-1 truncate group-data-[collapsible=icon]:hidden">
        {MARCA.nombre}
      </Text>
      <div className="flex shrink-0 items-center gap-0.5 group-data-[collapsible=icon]:hidden">
        <BotonIcono aria-label="Notificaciones" className="relative">
          <HugeiconsIcon icon={Notification03Icon} aria-hidden="true" />
          <span className="bg-destructive absolute top-1.5 right-1.5 size-1.5 rounded-full" />
        </BotonIcono>
        <SidebarTrigger />
      </div>
    </div>
  )
}

function Buscador() {
  return (
    <InputGroup className="group-data-[collapsible=icon]:hidden">
      <InputGroupAddon align="inline-start">
        <HugeiconsIcon icon={Search01Icon} aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput placeholder="Buscar…" aria-label="Buscar en la plataforma" />
      <InputGroupAddon align="inline-end">
        <Kbd>⌘K</Kbd>
      </InputGroupAddon>
    </InputGroup>
  )
}

function MenuUsuario() {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Avatar className="size-8 shrink-0">
        <AvatarFallback>{USUARIO.inicial}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col gap-1 group-data-[collapsible=icon]:hidden">
        <Text as="span" size="sm" weight="medium" className="truncate">
          {USUARIO.nombre}
        </Text>
        <Text as="span" variant="muted" size="xs" className="truncate">
          {USUARIO.correo}
        </Text>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <BotonIcono
              aria-label="Opciones de la cuenta"
              className="shrink-0 group-data-[collapsible=icon]:hidden"
            >
              <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
            </BotonIcono>
          }
        />
        <DropdownMenuContent align="end" side="top">
          <DropdownMenuItem>Mi perfil</DropdownMenuItem>
          <DropdownMenuItem>Preferencias</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Cerrar sesión</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="min-w-0 gap-3 overflow-hidden p-3">
        <Marca />
        <Buscador />
      </SidebarHeader>

      <SidebarContent className="overflow-x-hidden overflow-y-auto">
        <NavMain />
      </SidebarContent>

      <SidebarFooter className="min-w-0 gap-3 overflow-hidden p-3">
        <UsageCard />
        <MenuUsuario />
      </SidebarFooter>
    </Sidebar>
  )
}
