import { HugeiconsIcon } from '@hugeicons/react'
import { PartyIcon } from '@hugeicons/core-free-icons'
import { Button } from '@ubits/flux-ui'
import { Hint } from '@/shared/components/Hint'

// Botón Novedades del header, en azul suave como en el prototipo: el botón outline toma borde y fondo del primario, y al
// pasar el cursor se refuerza el mismo azul (el gris de la librería lo apagaba). Vive aparte para que el design system
// (Componentes › Ajustes propios) muestre este mismo botón y no una copia.
export function NovedadesButton({ onClick }: { onClick: () => void }) {
  return (
    <Hint label="Lo nuevo en Ubits">
      <Button
        variant="outline"
        size="sm"
        aria-label="Novedades"
        className="relative text-primary [--background:color-mix(in_oklch,var(--primary)_10%,transparent)] [--border:color-mix(in_oklch,var(--primary)_28%,transparent)] hover:bg-primary/15! hover:text-primary! @max-[55rem]:w-8! @max-[55rem]:px-0!"
        onClick={onClick}
      >
        <HugeiconsIcon icon={PartyIcon} size={17} className="size-4.25" />
        <span className="@max-[55rem]:hidden">Novedades</span>
      </Button>
    </Hint>
  )
}
