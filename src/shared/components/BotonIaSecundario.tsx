import type { ComponentProps } from 'react'
import { Button, cn } from '@ubits/flux-ui'
import { Orb } from '@/shared/components/Orb'

// Secundario de IA: el botón con contorno de la librería, con el orbe al inicio y en pastilla (la pastilla es la marca
// de la IA; el resto del producto usa la esquina de la librería). Acompaña al primario de IA, el del degradado, cuando
// hay una segunda acción de IA en la misma vista. El Button de flux-ui todavía no trae la propiedad de radio, así que
// se fuerza con rounded-full!, como en el primario: redefinir --radius no alcanza en size="sm", que la librería topa
// en 10 px (13-oct; ficha button-radio-pastilla en ai-tools/flux-ui/diferencias.json).
export function BotonIaSecundario({ className, children, ...props }: Omit<ComponentProps<typeof Button>, 'variant'>) {
  return (
    <Button variant="outline" className={cn('rounded-full!', className)} {...props}>
      <span data-icon="inline-start" className="flex">
        <Orb className="size-4.5" />
      </span>
      {children}
    </Button>
  )
}
