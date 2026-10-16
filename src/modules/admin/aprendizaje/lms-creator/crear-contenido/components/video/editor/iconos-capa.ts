import {
  ChartUpIcon,
  CheckListIcon,
  Image01Icon,
  LeftToRightListBulletIcon,
  QuoteDownIcon,
  SquareIcon,
  Tag01Icon,
  TextFontIcon,
} from '@hugeicons/core-free-icons'
import type { TipoCapa } from '../capas'

// El icono de cada tipo de capa (lista de capas y botones de agregar). Aparte del panel para que la recarga en caliente
// de Vite no se pierda: un archivo de componentes que también exporta datos no se puede recargar solo.

export const ICONO_CAPA: Record<TipoCapa, typeof Image01Icon> = {
  texto: TextFontIcon,
  imagen: Image01Icon,
  forma: SquareIcon,
  badge: Tag01Icon,
  lista: LeftToRightListBulletIcon,
  dato: ChartUpIcon,
  cita: QuoteDownIcon,
  agenda: CheckListIcon,
}

