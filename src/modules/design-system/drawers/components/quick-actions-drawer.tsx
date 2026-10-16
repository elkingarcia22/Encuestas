import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowRight01Icon,
  Calendar03Icon,
  Download04Icon,
  FlashIcon,
  Mail02Icon,
  UserRemove01Icon,
} from '@hugeicons/core-free-icons'
import { Avatar, AvatarFallback, Button, IconTile, Item, ItemContent, ItemDescription, ItemMedia, ItemTitle, cn } from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { DrawerShell } from './drawer-shell'
import { WS } from './drawer-styles'

type Props = { open: boolean; onOpenChange: (open: boolean) => void }

const ACTIONS = [
  { icon: ArrowRight01Icon, label: 'Mover a otra etapa', hint: 'Entrevista final u Oferta', toast: '3 candidatos movidos a Entrevista final' },
  { icon: Mail02Icon, label: 'Enviar correo', hint: 'Plantilla o mensaje propio', toast: 'Correo enviado a 3 candidatos' },
  { icon: Calendar03Icon, label: 'Programar entrevista', hint: 'Con disponibilidad del líder', toast: 'Invitaciones de entrevista enviadas' },
  { icon: Download04Icon, label: 'Exportar perfiles', hint: 'PDF con hoja de vida y notas', toast: 'Exportando 3 perfiles' },
  { icon: UserRemove01Icon, label: 'Rechazar', hint: 'Se les avisa por correo', toast: '3 candidatos descartados', danger: true },
]

// Caso: acciones sobre una selección, al estilo de hoja inferior de móvil (se arrastra para cerrar).
export function QuickActionsDrawer({ open, onOpenChange }: Props) {
  return (
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      direction="bottom"
      icon={FlashIcon}
      title="3 candidatos seleccionados"
      description="Analista de datos · etapa Entrevistas"
      footer={
        <Button variant="outline" className={`w-full ${WS}`} onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
      }
    >
      <div className="mb-4 flex gap-1.5">
        {['LM', 'AM', 'JR'].map((initials) => (
          <Avatar key={initials}>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        ))}
      </div>
      <div className="-mx-2 flex flex-col">
        {ACTIONS.map((action) => (
          <Item
            key={action.label}
            size="sm"
            render={<button type="button" />}
            onClick={() => {
              notify(action.toast)
              onOpenChange(false)
            }}
            className="rounded-xl! px-2! text-left hover:bg-muted!"
          >
            <ItemMedia variant="icon">
              <IconTile variant="outline" size="sm">
                <HugeiconsIcon icon={action.icon} className={cn(action.danger && 'text-destructive')} />
              </IconTile>
            </ItemMedia>
            <ItemContent>
              <ItemTitle className={cn(action.danger && 'text-destructive')}>{action.label}</ItemTitle>
              <ItemDescription className="text-xs!">{action.hint}</ItemDescription>
            </ItemContent>
          </Item>
        ))}
      </div>
    </DrawerShell>
  )
}
