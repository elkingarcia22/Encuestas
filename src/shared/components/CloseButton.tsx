import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon } from '@hugeicons/core-free-icons'
import { cn } from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'

type CloseButtonProps = {
  // Nombre accesible del botón (p. ej. «Cerrar invitación»): no hay texto visible.
  label: string
  onClick?: () => void
  // Solo para ubicarlo (absolute, top, right, ml-auto…), no para cambiar su apariencia.
  className?: string
}

// «X» de cerrar única para paneles, tarjetas, avisos, formularios y modales: un círculo claro de 32px (nunca ovalado).
// Fondo de la superficie casi opaco con un filo fino, icono gris que se oscurece al pasar el cursor: se lee igual
// sobre blanco, sobre gris o sobre la imagen de la tarjeta de invitación, sin el peso de la pastilla negra.
// No es para las «x» de quitar un elemento dentro de chips o filas: esas siguen siendo pequeñas y discretas.
export function CloseButton({ label, onClick, className }: CloseButtonProps) {
  return (
    <BotonIcono
      size="icon-xs"
      className={cn(
        'size-8! shrink-0 rounded-full! bg-background/90! text-muted-foreground! shadow-xs ring-1 ring-foreground/10 backdrop-blur-sm hover:bg-background! hover:text-foreground! dark:bg-background/85! dark:text-foreground/75! dark:ring-foreground/20 dark:hover:bg-background! dark:hover:text-foreground!',
        className,
      )}
      aria-label={label}
      onClick={onClick}
    >
      <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={2} />
    </BotonIcono>
  )
}
