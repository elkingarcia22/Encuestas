import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Briefcase06Icon,
  ChartLineData02Icon,
  Note05Icon,
  Home09Icon,
  Megaphone01Icon,
  Mortarboard02Icon,
} from '@hugeicons/core-free-icons'
import { Avatar, AvatarFallback, Badge, Button, Separator, cn } from '@ubits/flux-ui'
import metaLogo from '@/shared/assets/meta.png'
import { notify } from '@/shared/components/notify'
import { DrawerShell } from './drawer-shell'
import { KICKER } from './drawer-styles'

type Props = { open: boolean; onOpenChange: (open: boolean) => void }

const NAV = [
  { label: 'Inicio', icon: Home09Icon },
  { label: 'Selección', icon: Briefcase06Icon, badge: 'Nuevo' },
  { label: 'Aprendizaje', icon: Mortarboard02Icon },
  { label: 'Desempeño y cultura', icon: ChartLineData02Icon },
]

const TOOLS = [
  { label: 'Tareas', icon: Note05Icon },
  { label: 'Avisos internos', icon: Megaphone01Icon },
]

// Caso: navegación en pantallas pequeñas. Único drawer que sale desde la izquierda.
export function NavDrawer({ open, onOpenChange }: Props) {
  const [active, setActive] = useState('Inicio')

  const go = (label: string) => {
    setActive(label)
    notify(`Ir a ${label}`)
    onOpenChange(false)
  }

  const row = (item: { label: string; icon: typeof Home09Icon; badge?: string }) => (
    <Button
      key={item.label}
      variant="ghost"
      aria-current={active === item.label ? 'page' : undefined}
      className={cn('h-10! w-full justify-start gap-3 rounded-lg! px-2.5! font-normal', active === item.label && 'bg-muted font-medium')}
      onClick={() => go(item.label)}
    >
      <HugeiconsIcon icon={item.icon} className={cn('size-4.5', active === item.label ? 'text-primary' : 'text-muted-foreground')} />
      <span className="flex-1 text-left">{item.label}</span>
      {item.badge ? <Badge variant="secondary">{item.badge}</Badge> : null}
    </Button>
  )

  return (
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      direction="left"
      size="sm"
      media={
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background">
          <img src={metaLogo} alt="" className="h-4 w-auto" />
        </span>
      }
      title="Meta Colombia"
      description="Espacio de Administración"
    >
      <div className="-mx-2 flex flex-col gap-0.5">{NAV.map(row)}</div>
      <div role="heading" aria-level={3} className={`${KICKER} mt-6 mb-2`}>Herramientas</div>
      <div className="-mx-2 flex flex-col gap-0.5">{TOOLS.map(row)}</div>
      <Separator className="my-5" />
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarFallback>CV</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-sm font-medium">Carolina Vélez</span>
          <span className="text-xs text-muted-foreground">Administradora · RH</span>
        </div>
      </div>
    </DrawerShell>
  )
}
