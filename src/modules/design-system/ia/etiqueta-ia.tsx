import type { ComponentProps } from 'react'
import { Badge } from '@ubits/flux-ui'
import { IconoIA } from './icono-ia'

// La etiqueta de IA: la insignia que dice «esto lo hizo o lo hace la IA» (una etapa con IA, el ajuste que calculó,
// la nota que dejó el agente, el puntaje de Serena AI). Antes cada pantalla la armaba a su manera (azul, gris, con
// contorno, con la chispa) y en los tamaños chicos el orbe de 16 px se salía de la insignia. Ahora es una sola:
//
// - Gris (secondary): el color lo pone el orbe, así no compite con las insignias de estado (azul, verde, rojo).
//   Se comparó el 25 sep con contorno, azul claro y azul de marca; diseño eligió el gris. El azul de marca no pasa
//   AA en oscuro (3,1).
// - En pastilla: el radio completo es la marca de la IA, igual que en sus botones, y la separa de los conteos
//   grises («3 personas»), que van con las esquinas de la librería.
// - El orbe se ajusta al alto de la insignia, para que no se desborde en xs y sm.
const ORBE_POR_TAMANO = {
  xs: 'size-2.5',
  sm: 'size-3',
  default: 'size-3.5',
  lg: 'size-3.5',
  xl: 'size-4',
} as const

// El resto de props pasan a la Badge (aria-label, tabIndex…), para usarla dentro de un Hint o como disparador.
type EtiquetaIAProps = Omit<ComponentProps<typeof Badge>, 'variant' | 'radius' | 'size'> & {
  size?: keyof typeof ORBE_POR_TAMANO
}

export function EtiquetaIA({ children, size = 'sm', ...props }: EtiquetaIAProps) {
  return (
    <Badge variant="secondary" radius="full" size={size} {...props}>
      <IconoIA className={ORBE_POR_TAMANO[size]} />
      {children}
    </Badge>
  )
}
