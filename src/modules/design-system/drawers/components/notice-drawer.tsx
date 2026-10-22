import { useState } from 'react'
import { Alert02Icon, Megaphone02Icon } from '@hugeicons/core-free-icons'
import { Button, Progress } from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { DialogoConfirmar, RegistroConfirmar } from '../../estados/confirmaciones'
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
  const [pregunta, setPregunta] = useState(false)
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
              notify('Te lo recordamos mañana a las 8:00', undefined, 'info')
              onOpenChange(false)
            }}
          >
            Recordármelo mañana
          </Button>
          <Button className={WS} onClick={() => setPregunta(true)}>
            Enviar recordatorio
          </Button>
          {/* 13-oct: enviar un recordatorio le llega a otras personas, así que pregunta antes con RegistroConfirmar. */}
          <DialogoConfirmar
            abierto={pregunta}
            onAbiertoChange={setPregunta}
            icono={Megaphone02Icon}
            titulo="¿Enviar el recordatorio?"
            descripcion="Les llega por correo a los líderes de los 3 equipos más atrasados. Un correo enviado no se puede recoger."
            cancelar="Todavía no"
            accion="Enviar a 3 líderes"
            onConfirmar={() => {
              setPregunta(false)
              onOpenChange(false)
              notify('Recordatorio enviado', 'Les llegó a los líderes de los 3 equipos.', 'success')
            }}
          >
            <RegistroConfirmar nombre="Ciclo de evaluaciones 360" detalle="238 de 312 completadas · cierra el viernes 18" estado="Correo a 3 líderes" />
          </DialogoConfirmar>
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
