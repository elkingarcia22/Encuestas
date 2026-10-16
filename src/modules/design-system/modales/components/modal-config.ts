import type { IconSvgElement } from '@hugeicons/react'
import { File01Icon } from '@hugeicons/core-free-icons'

// SE RETIRA (decisión 4 de la auditoría, 5-oct): la ventana del sistema es una sola, ActionDialog
// (src/shared/components/ActionDialog.tsx), y la página Modales ya solo documenta esa (ver ventana-config.ts).
// Lo que queda aquí es lo que todavía necesita ConfiguredModal (modal-parts.tsx) mientras las pantallas que lo usan
// pasan a ActionDialog. Equivalencias: sm/md → `sm`, lg → `default`, xl → `wide`, full → `full`. Cuando nadie
// importe ConfiguredModal, este archivo y modal-parts.tsx se borran.

// Todo lo que se podía prender o apagar en el modal configurable.
export type ModalConfig = {
  // Ventana normal (Dialog) o de alerta (AlertDialog): la de alerta no se cierra con clic afuera.
  kind: 'dialog' | 'alert'
  size: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  position: 'center' | 'top'
  // Superficie de Suite AI: botones en pastilla.
  ai: boolean
  align: 'left' | 'center'
  media: 'none' | 'icon' | 'danger' | 'success' | 'orb' | 'image'
  kicker: boolean
  badge: boolean
  description: boolean
  close: boolean
  under: 'none' | 'steps' | 'progress' | 'tabs'
  notice: boolean
  body: boolean
  dontShow: boolean
  footer: 'none' | 'one' | 'two' | 'destructive' | 'split' | 'stacked'
}

// Textos de ejemplo del modal configurable.
export type ModalSample = {
  icon: IconSvgElement
  kicker: string
  title: string
  badge: string
  description: string
  steps: string[]
  // `right`: lo que se lee a la derecha de la barra (si no, el porcentaje).
  progress: { label: string; value: number; right?: string }
  tabs: string[]
  notice: { tone: 'warning' | 'destructive' | 'info' | 'success'; title: string; text: string }
  slot: string
  one: string
  secondary: string
  primary: string
  danger: string
  left: string
}

const BASE: ModalConfig = {
  kind: 'dialog',
  size: 'md',
  position: 'center',
  ai: false,
  align: 'left',
  media: 'none',
  kicker: false,
  badge: false,
  description: true,
  close: true,
  under: 'none',
  notice: false,
  body: true,
  dontShow: false,
  footer: 'two',
}

// Nombre de la imagen de la cabecera según lo elegido.
export function mediaLabel(c: ModalConfig) {
  if (c.media === 'image') return 'Ilustración'
  if (c.media === 'orb') return 'Orbe IA'
  return 'Icono'
}

// ── Uso en pantallas reales ──
// Para pantallas que arman su propio contenido y botones (ConfiguredModal con `real`): la base del sistema, con la
// descripción solo para el lector de pantalla y sin los botones del ejemplo. El tamaño se cambia con `size`.
export const MODAL_REAL: ModalConfig = { ...BASE, description: false, footer: 'none' }

// Pantalla completa para flujos largos (p. ej. los modales de recurso de LMS Creator).
export const PANTALLA_COMPLETA: ModalConfig = { ...MODAL_REAL, size: 'full' }

// Ejemplo vacío: con `real`, los textos los pone la pantalla.
export const SIN_EJEMPLO: ModalSample = {
  icon: File01Icon,
  kicker: '',
  title: '',
  badge: '',
  description: '',
  steps: [],
  progress: { label: '', value: 0 },
  tabs: [],
  notice: { tone: 'info', title: '', text: '' },
  slot: '',
  one: '',
  secondary: '',
  primary: '',
  danger: '',
  left: '',
}
