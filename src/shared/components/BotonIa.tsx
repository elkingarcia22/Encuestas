import type { ComponentProps } from 'react'
import { Button, cn } from '@ubits/flux-ui'
import newChat from '@/shared/layouts/new-chat.module.css'

// El único primario de IA del sistema (decisión 10 de la auditoría, 5-oct): el Button de la librería con el degradado
// de marca de «Nueva conversación» y en pastilla, el mismo de Design system › IA › Jerarquía de IA y de Marco › Ajustes
// propios › Botones de IA. Vivía en LMS Creator (BotonIa) y tenía una copia en Crear vacante (BotonIaPrimario); el
// AiButton copiado del Storybook, con otro degradado y estrella, nunca se usó. Los tres se juntaron aquí.
// Una sola acción principal de IA por vista; la segunda va con BotonIaSecundario. Va al final de su fila.
// Sin icono: el degradado ya es la marca de la IA (y nada de estrellas: Design system › IA, 23 sep).
type Props = Omit<ComponentProps<typeof Button>, 'variant' | 'size'> & {
  size?: 'sm' | 'md'
}

export function BotonIa({ size = 'md', className, children, ...props }: Props) {
  return (
    <span className={cn(newChat.wrap, 'inline-flex w-fit shrink-0')}>
      {/* Más aire a los lados que un botón normal (15 oct, Carlos): 20px y 16px en el pequeño. Va con «!» porque el tema
          de la librería pone 10px y le gana a la clase (ficha: Ajustes propios › Botones de IA). */}
      <Button size={size === 'sm' ? 'sm' : 'default'} className={cn(newChat.button, 'rounded-full!', size === 'sm' ? 'px-4!' : 'px-5!', className)} {...props}>
        {children}
      </Button>
    </span>
  )
}
