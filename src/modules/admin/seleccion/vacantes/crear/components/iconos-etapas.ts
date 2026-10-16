import type { IconSvgElement } from '@hugeicons/react'
import {
  Chat01Icon,
  MoneyBag02Icon,
  PuzzleIcon,
  SecurityCheckIcon,
  SignatureIcon,
  UserSearch01Icon,
} from '@hugeicons/core-free-icons'

// Cada categoría de etapa se reconoce por su icono; el tono es el mismo azul para todas (la clase de texto
// tiñe el IconTile «soft»): con un color por categoría el flujo se veía como un arcoíris.
type Tono = 'text-primary'

const POR_CATEGORIA: Record<string, { icono: IconSvgElement; tono: Tono }> = {
  'Filtro inicial': { icono: UserSearch01Icon, tono: 'text-primary' },
  'Entrevista con liderazgo': { icono: Chat01Icon, tono: 'text-primary' },
  'Prueba técnica': { icono: PuzzleIcon, tono: 'text-primary' },
  'Antecedentes judiciales': { icono: SecurityCheckIcon, tono: 'text-primary' },
  Contratación: { icono: SignatureIcon, tono: 'text-primary' },
  Oferta: { icono: MoneyBag02Icon, tono: 'text-primary' },
}

export function iconoDeCategoria(categoria: string) {
  return POR_CATEGORIA[categoria] ?? POR_CATEGORIA['Filtro inicial']
}
