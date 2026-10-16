import { HugeiconsIcon } from '@hugeicons/react'
import { DashboardSquareAddIcon } from '@hugeicons/core-free-icons'
import { IconTile, cn } from '@ubits/flux-ui'
import styles from './slot.module.css'

// Espacio libre de muestra: rayado, con su nombre y qué suele ir ahí. No es parte de ningún componente.
// Lo usan la anatomía del design system (para señalar dónde va lo que cada pantalla necesite) y las pantallas
// que todavía no están maquetadas, para que las dos cosas se vean igual.
export function SlotArea({ name, hint, className }: { name: string; hint: string; className?: string }) {
  return (
    <div
      data-slot-region={name}
      data-slot-area=""
      className={cn(
        'flex min-w-0 flex-1 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-muted-foreground/35 bg-muted/30 px-6 py-8 text-center',
        styles.hatch,
        className,
      )}
    >
      <IconTile variant="outline" className="size-9! rounded-[10px]! bg-background! text-muted-foreground! shadow-xs">
        <HugeiconsIcon icon={DashboardSquareAddIcon} size={18} strokeWidth={1.6} />
      </IconTile>
      {/* Nombre y explicación van juntos a 4px, la separación de título y bajada de todo el sistema; los 8px de
          arriba separan el icono de ese bloque. Antes los tres iban sueltos a 8px y el nombre flotaba. */}
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Slot · {name}</span>
        <span className="max-w-72 text-[13px] leading-snug text-muted-foreground">{hint}</span>
      </div>
    </div>
  )
}
