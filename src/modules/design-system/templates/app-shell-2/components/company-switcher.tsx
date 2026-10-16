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
  Progress,
} from '@ubits/flux-ui'
import { HugeiconsIcon } from '@hugeicons/react'
import { MoreHorizontalIcon } from '@hugeicons/core-free-icons'

import { COMPANY, CREDITS_USAGE, LICENSE_USAGE, SETTINGS_LINKS } from './data'

function CompanyAvatar() {
  return (
    <Avatar className="size-8 shrink-0 rounded-md">
      <AvatarImage src="/favicon.svg" alt={COMPANY.name} />
      <AvatarFallback className="rounded-md text-sm font-semibold">{COMPANY.initial}</AvatarFallback>
    </Avatar>
  )
}

function UsageMeter({ label, used, total }: { label: string; used: number; total: number }) {
  return (
    <div className="px-2 pb-2">
      <div className="text-muted-foreground mb-1 flex items-center justify-between text-xs">
        <span>{label}</span>
        <span>
          {used}/{total}
        </span>
      </div>
      <Progress value={(used / total) * 100} aria-label={label} className="**:data-[slot=progress-track]:h-1.5" />
    </div>
  )
}

export function CompanySwitcher() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex min-w-0 items-center gap-2 rounded-md p-1 text-left transition-colors"
          />
        }
      >
        <CompanyAvatar />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
          {COMPANY.name}
        </span>
        <HugeiconsIcon
          icon={MoreHorizontalIcon}
          size={16}
          className="text-muted-foreground ml-auto shrink-0 group-data-[collapsible=icon]:hidden"
          aria-hidden="true"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuItem disabled>
            <CompanyAvatar />
            <span className="min-w-0 flex-1 truncate font-medium">{COMPANY.name}</span>
          </DropdownMenuItem>
          <UsageMeter label="Licencias" used={LICENSE_USAGE.used} total={LICENSE_USAGE.total} />
          <UsageMeter label="Créditos" used={CREDITS_USAGE.used} total={CREDITS_USAGE.total} />
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Configuración</DropdownMenuLabel>
          {SETTINGS_LINKS.map((link) => (
            <DropdownMenuItem key={link.title}>
              <HugeiconsIcon icon={link.icon} size={16} aria-hidden="true" />
              {link.title}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
