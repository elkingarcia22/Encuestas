import { cn } from '@ubits/flux-ui'
import orb from '@/shared/assets/orb.png'

type OrbProps = {
  className?: string
}

// Orbe del agente: es una imagen aportada por diseño, se muestra de 16px a 180px.
export function Orb({ className }: OrbProps) {
  return (
    <img
      src={orb}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={cn('size-10 shrink-0 rounded-full object-cover select-none', className)}
    />
  )
}
