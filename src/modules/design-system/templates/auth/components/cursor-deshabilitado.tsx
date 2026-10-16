import type { ReactNode } from 'react'
import { cn } from '@ubits/flux-ui'

// La librería deja el botón deshabilitado sin eventos del puntero (disabled:pointer-events-none), así que el cursor no
// cambia al pasar encima. El «no permitido» va en este envoltorio: si se lo diéramos al botón, este volvería a
// reaccionar al hover y parecería que se puede pulsar.
export function CursorDeshabilitado({
  disabled,
  className,
  children,
}: {
  disabled: boolean
  className?: string
  children: ReactNode
}) {
  return <div className={cn('flex', disabled && 'cursor-not-allowed', className)}>{children}</div>
}
