import type { ComponentProps } from 'react'
import { Button, cn } from '@ubits/flux-ui'

// Terciario de solo icono: el Button ghost de la librería en círculo (follow up del 17-sep: «el terciario de solo icono
// debería ser 100 % redondo»; decisión del 18-sep). Filas de tabla, cerrar, más opciones, barras de herramientas. El
// resto de los botones usa la esquina de la librería; la pastilla con texto es solo para IA. Siempre con su nombre
// (aria-label) para lectores de pantalla. Tamaño por defecto icon-sm; se aceptan los demás icon-*.
type Props = Omit<ComponentProps<typeof Button>, 'variant' | 'size'> & {
  'aria-label': string
  size?: 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg'
}

export function BotonIcono({ className, size = 'icon-sm', ...props }: Props) {
  return <Button variant="ghost" size={size} className={cn('rounded-full!', className)} {...props} />
}
