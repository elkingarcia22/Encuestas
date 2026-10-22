import { useState } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
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
import { DialogoConfirmar, RegistroConfirmar } from '../../estados/confirmaciones'
import { DrawerShell } from './drawer-shell'
import { WS } from './drawer-styles'

type Props = { open: boolean; onOpenChange: (open: boolean) => void }

// Cada acción con efecto sobre otras personas pregunta antes (13-oct, regla «preguntar-antes»): la pregunta se abre
// dentro del mismo panel con «← 3 candidatos seleccionados» para volver. Exportar no afecta a nadie: va directo.
type Accion = {
  icon: IconSvgElement
  label: string
  hint: string
  danger?: boolean
  // Lo que pregunta la ventana (sin esto, la acción va directo).
  pregunta?: { titulo: string; descripcion: string; accion: string; cancelar: string; aviso: string; detalle?: string; estado: string }
}

const ACTIONS: Accion[] = [
  {
    icon: ArrowRight01Icon,
    label: 'Mover a otra etapa',
    hint: 'Entrevista final u Oferta',
    pregunta: {
      titulo: '¿Mover a otra etapa?',
      descripcion: 'Los 3 candidatos pasan a Entrevista final. Quien lleva la vacante lo ve en su tablero.',
      accion: 'Mover 3 candidatos',
      cancelar: 'Todavía no',
      aviso: '3 candidatos movidos a Entrevista final',
      estado: 'Pasan a Entrevista final',
    },
  },
  {
    icon: Mail02Icon,
    label: 'Enviar correo',
    hint: 'Plantilla o mensaje propio',
    pregunta: {
      titulo: '¿Enviar el correo?',
      descripcion: 'Les llega a los 3 candidatos con la plantilla elegida. Un correo enviado no se puede recoger.',
      accion: 'Enviar a 3 personas',
      cancelar: 'Todavía no',
      aviso: 'Correo enviado a 3 candidatos',
      estado: 'Correo a 3 personas',
    },
  },
  {
    icon: Calendar03Icon,
    label: 'Programar entrevista',
    hint: 'Con disponibilidad del líder',
    pregunta: {
      titulo: '¿Programar las entrevistas?',
      descripcion: 'Se envían las invitaciones a los 3 candidatos con la disponibilidad del líder.',
      accion: 'Enviar 3 invitaciones',
      cancelar: 'Todavía no',
      aviso: 'Invitaciones de entrevista enviadas',
      estado: '3 invitaciones',
    },
  },
  { icon: Download04Icon, label: 'Exportar perfiles', hint: 'PDF con hoja de vida y notas' },
  {
    icon: UserRemove01Icon,
    label: 'Rechazar',
    hint: 'Se les avisa por correo',
    danger: true,
    pregunta: {
      titulo: '¿Rechazar a los candidatos?',
      descripcion: 'Salen del proceso de la vacante y se les avisa por correo.',
      accion: 'Rechazar 3 candidatos',
      cancelar: 'Seguir en el proceso',
      aviso: '3 candidatos rechazados',
      detalle: 'Se les avisó por correo.',
      estado: 'Se les avisa por correo',
    },
  },
]

// Caso: acciones sobre una selección, al estilo de hoja inferior de móvil (se arrastra para cerrar).
export function QuickActionsDrawer({ open, onOpenChange }: Props) {
  const [pidiendo, setPidiendo] = useState<Accion | null>(null)

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
              if (action.pregunta) return setPidiendo(action)
              notify('Exportando 3 perfiles', undefined, 'info')
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

      {/* Una sola ventana, con lo de la acción elegida: dentro del panel se abre como vista del mismo panel. */}
      <DialogoConfirmar
        abierto={pidiendo !== null}
        onAbiertoChange={(abrir) => {
          if (!abrir) setPidiendo(null)
        }}
        icono={pidiendo?.icon}
        titulo={pidiendo?.pregunta?.titulo ?? ''}
        descripcion={pidiendo?.pregunta?.descripcion ?? ''}
        cancelar={pidiendo?.pregunta?.cancelar}
        accion={pidiendo?.pregunta?.accion ?? ''}
        destructiva={pidiendo?.danger}
        onConfirmar={() => {
          const pregunta = pidiendo?.pregunta
          setPidiendo(null)
          onOpenChange(false)
          if (pregunta) notify(pregunta.aviso, pregunta.detalle, 'success')
        }}
      >
        <RegistroConfirmar nombre="3 candidatos seleccionados" detalle="Analista de datos · etapa Entrevistas" estado={pidiendo?.pregunta?.estado} />
      </DialogoConfirmar>
    </DrawerShell>
  )
}
