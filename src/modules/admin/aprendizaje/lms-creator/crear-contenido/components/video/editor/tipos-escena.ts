import { ClapperboardIcon, Image01Icon, Presentation01Icon, UserIcon } from '@hugeicons/core-free-icons'
import type { TipoEscena } from '../proyecto'

// Los tipos de escena con su icono: los usan el selector de Propiedades de la escena y el menú «Añadir escena».

export const TIPOS: { id: TipoEscena; label: string; icono: typeof Image01Icon }[] = [
  { id: 'imagen', label: 'Imagen', icono: Image01Icon },
  { id: 'video', label: 'Video', icono: ClapperboardIcon },
  { id: 'avatar', label: 'Avatar completo', icono: UserIcon },
  { id: 'canvas', label: 'Canvas', icono: Presentation01Icon },
]
