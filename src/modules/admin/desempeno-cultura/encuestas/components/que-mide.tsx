import type { ReactNode } from 'react'
import { BotonAyuda } from '@/shared/components/BotonAyuda'

// La ayuda «Qué mide» junto a una cifra: abre con clic (un tooltip solo abre con hover).
// Desde el 5-oct es el botón de ayuda del sistema (BotonAyuda, globo oscuro), no un globo blanco propio (auditoría, decisión 16).
export function QueMide({ etiqueta, texto }: { etiqueta: string; texto: ReactNode }) {
  return <BotonAyuda etiqueta={`Qué mide ${etiqueta}`}>{texto}</BotonAyuda>
}
