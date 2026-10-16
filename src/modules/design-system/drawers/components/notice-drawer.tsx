import { Alert02Icon } from '@hugeicons/core-free-icons'
import { Button, Progress } from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { DrawerShell } from './drawer-shell'
import { KICKER, WS } from './drawer-styles'

type Props = { open: boolean; onOpenChange: (open: boolean) => void }

const BEHIND = [
  { team: 'Ventas Bogotá', done: 58 },
  { team: 'Operaciones Medellín', done: 64 },
  { team: 'Servicio al cliente', done: 71 },
]

// Caso: aviso del sistema que baja desde arriba; importante pero no bloquea el trabajo.
export function NoticeDrawer({ open, onOpenChange }: Props) {
  return (
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      direction="top"
      icon={Alert02Icon}
      title="El ciclo de evaluaciones cierra en 4 días"
      description="Viernes 18 de septiembre · después no se pueden registrar evaluaciones 360."
      footer={
        <>
          <Button
            variant="ghost"
            className={WS}
            onClick={() => {
              notify('Te lo recordamos mañana a las 8:00')
              onOpenChange(false)
            }}
          >
            Recordármelo mañana
          </Button>
          <Button
            className={WS}
            onClick={() => {
              notify('Recordatorio enviado a los líderes de los 3 equipos')
              onOpenChange(false)
            }}
          >
            Enviar recordatorio
          </Button>
        </>
      }
    >
      <div className="flex items-center justify-between text-sm">
        <span id="notice-drawer-progress" className="font-medium">
          238 de 312 evaluaciones completadas
        </span>
        <span className="text-muted-foreground tabular-nums">76%</span>
      </div>
      <Progress value={76} aria-labelledby="notice-drawer-progress" className="mt-2.5 **:data-[slot=progress-track]:h-1.5!" />
      <div role="heading" aria-level={3} className={`${KICKER} mt-5`}>Equipos más atrasados</div>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        {BEHIND.map((row) => (
          <div key={row.team} className="rounded-xl border px-3.5 py-3">
            <div className="text-2xl font-light tracking-tight tabular-nums">{row.done}%</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{row.team}</div>
          </div>
        ))}
      </div>
    </DrawerShell>
  )
}
