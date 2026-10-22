import { Building06Icon, Layers01Icon, Target02Icon, UserGroupIcon, UserIcon } from '@hugeicons/core-free-icons'
import type { AlignmentLevel, AlignmentNodeKind } from '../../../modelo/constructor/alignmentGraph'

// Cómo se ve cada familia de tarjeta del mapa: su icono, el color de su icono (clase de texto que tiñe el IconTile
// «soft») y la insignia de su cifra. Un acento por familia, para que el nivel se lea sin mirar la leyenda; la leyenda
// usa estos mismos iconos e insignias, así que tarjeta y leyenda no se pueden desincronizar.

type VarianteInsignia = 'primary-light' | 'info-light' | 'warning-light' | 'success-light' | 'secondary'

export interface VisualNodo {
  icono: typeof Target02Icon
  tono: string
  insignia: VarianteInsignia
  etiqueta: string
}

export const VISUAL_NODO: Readonly<Record<AlignmentNodeKind, VisualNodo>> = {
  company: { icono: Building06Icon, tono: 'text-primary', insignia: 'primary-light', etiqueta: 'Empresa' },
  objective: { icono: Target02Icon, tono: 'text-info', insignia: 'info-light', etiqueta: 'Objetivo asignado' },
  target: { icono: UserGroupIcon, tono: 'text-warning', insignia: 'warning-light', etiqueta: 'Destinatario' },
  person: { icono: UserIcon, tono: 'text-success', insignia: 'success-light', etiqueta: 'Persona' },
  origin: { icono: Layers01Icon, tono: 'text-muted-foreground', insignia: 'secondary', etiqueta: 'Origen' },
}

/** Qué familias aparecen en cada nivel, en el orden de la leyenda. */
export const LEYENDA: Readonly<Record<AlignmentLevel, readonly AlignmentNodeKind[]>> = {
  objetivos: ['company', 'objective'],
  agrupacion: ['company', 'target'],
  colaboradores: ['company', 'person', 'origin'],
}
