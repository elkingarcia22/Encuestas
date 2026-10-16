import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  SidebarTrigger,
  Tooltip,
  TooltipTrigger,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { HintContent } from '@/shared/components/Hint'
import { HugeiconsIcon } from '@hugeicons/react'
import { GridViewIcon, LogoutIcon, Notification03Icon, UserIcon } from '@hugeicons/core-free-icons'

function HeaderIconButton({ label, icon, dot }: { label: string; icon: typeof GridViewIcon; dot?: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<BotonIcono aria-label={label} className="relative" />}
      >
        <HugeiconsIcon icon={icon} size={16} aria-hidden="true" />
        {dot && (
          <span
            className="bg-foreground ring-background absolute top-1 right-1 size-2 rounded-full ring-2"
            aria-hidden="true"
          />
        )}
      </TooltipTrigger>
      <HintContent>{label}</HintContent>
    </Tooltip>
  )
}

export function AppHeader() {
  return (
    <header className="flex h-auto shrink-0 items-center justify-between gap-2 px-6 py-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 opacity-60 hover:opacity-100" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">Inicio</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Overview</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          Novedades
        </Button>
        <HeaderIconButton label="6 notificaciones sin leer" icon={Notification03Icon} dot />
        <HeaderIconButton label="Aplicaciones" icon={GridViewIcon} />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={<BotonIcono aria-label="Abrir menú de usuario" />}
          >
            <Avatar className="size-6 overflow-hidden rounded-full">
              <AvatarImage src="https://i.pravatar.cc/64?img=68" alt="Foto de perfil" />
              <AvatarFallback className="rounded-full text-xs font-semibold">U</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>
              <HugeiconsIcon icon={UserIcon} size={16} aria-hidden="true" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <HugeiconsIcon icon={LogoutIcon} size={16} aria-hidden="true" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
