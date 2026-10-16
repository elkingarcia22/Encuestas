import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  BuildingIcon,
  GroupLayersIcon,
  MoreHorizontalIcon,
  PaintBrush01Icon,
  SecurityLockIcon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'

const SETTINGS_LINKS = [
  { title: 'Gestión de usuarios', icon: UserGroupIcon },
  { title: 'Personalización', icon: PaintBrush01Icon },
  { title: 'Organigrama', icon: GroupLayersIcon },
  { title: 'Datos de empresa', icon: BuildingIcon },
  { title: 'Roles y permisos', icon: SecurityLockIcon },
]

export function SidebarBrand() {
  return (
    <div className="flex min-w-0 items-center justify-between gap-1">
      <div className="flex min-w-0 items-center gap-3 py-1">
        <Avatar className="size-8 shrink-0 overflow-hidden rounded-[4px] border border-border/60 bg-background p-1">
          <AvatarImage src="/google-logo.svg" alt="Google" className="object-contain" />
          <AvatarFallback className="rounded-[4px] bg-background text-sm font-semibold">G</AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1 truncate text-base font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
          Google
        </span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <BotonIcono
              className="shrink-0 opacity-60 hover:opacity-100 group-data-[collapsible=icon]:hidden"
              aria-label="Más opciones de la empresa"
            />
          }
        >
          <HugeiconsIcon icon={MoreHorizontalIcon} size={16} aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Configuración</DropdownMenuLabel>
            {SETTINGS_LINKS.map((link) => (
              <DropdownMenuItem key={link.title}>
                <HugeiconsIcon icon={link.icon} size={16} aria-hidden="true" />
                {link.title}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Cerrar sesión</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
