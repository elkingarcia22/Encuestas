// Anchos del contenedor de página: 720px (formularios y pasos), 1140px (ancho de diseño),
// 1600px (tableros densos) o todo el ancho (paneles divididos).
export type PageWidth = 'narrow' | 'default' | 'wide' | 'full'

export const PAGE_WIDTH: Record<PageWidth, string> = {
  narrow: 'max-w-180',
  default: 'max-w-285',
  wide: 'max-w-400',
  full: 'max-w-none',
}

// Columna del acceso (login y sus pasos): 360 px, como login.ubitslearning.com (Cristian, 7-oct: medida oficial, no
// un número a mano). Solo para las pantallas de acceso, que no llevan PageShell.
export const ANCHO_ACCESO = 'max-w-90'
