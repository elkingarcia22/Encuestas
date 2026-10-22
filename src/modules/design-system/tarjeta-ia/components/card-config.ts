import type { IconSvgElement } from '@hugeicons/react'
import { Home02Icon, LayoutLeftIcon, Megaphone01Icon, NewReleasesIcon, TaskDone01Icon } from '@hugeicons/core-free-icons'
import type { PartInfo } from '../../components/anatomy/anatomy-kit'

// Todo lo que se puede prender o apagar en la tarjeta de invitación a la IA.
export type CardConfig = {
  orb: boolean
  badge: boolean
  description: boolean
  action: boolean
  // La luz de color del borde de arriba.
  halo: boolean
  // Compacta: sin bajada y con menos aire, para columnas estrechas.
  compact: boolean
}

export type CardSample = {
  title: string
  description: string
  action: string
  badge: string
}

export type CardCase = {
  id: string
  title: string
  summary: string
  icon: IconSvgElement
  // Pantalla real donde se ve este caso.
  route: string
  config: CardConfig
  sample: CardSample
}

// La tarjeta «Crear un curso» de la plantilla Home operativo tal cual: de ahí sale la configuración base (el Inicio del
// admin de hoy ya no la lleva; 13-oct).
const BASE: CardConfig = {
  orb: true,
  badge: false,
  description: true,
  action: true,
  halo: true,
  compact: false,
}

const MUESTRA: CardSample = {
  title: 'Crear un curso',
  description: 'Genera contenido de aprendizaje apoyado en IA en minutos.',
  action: 'Crear ahora',
  badge: 'Nuevo',
}

export const CARD_CASES: CardCase[] = [
  {
    id: 'inicio',
    title: 'Invitación de Home operativo',
    summary:
      'La tarjeta completa: el orbe dice que lo hace la IA, la bajada explica qué gana la persona y el botón lleva el degradado de marca. Se ve en la plantilla Home operativo; el Inicio del admin de hoy no la lleva.',
    icon: Home02Icon,
    route: '/design-system/templates/home-operativo',
    config: BASE,
    sample: MUESTRA,
  },
  {
    id: 'compacta',
    title: 'Columna estrecha',
    summary:
      'Sin bajada y con menos aire, para cuando la tarjeta vive en una columna angosta o junto a otras piezas. El título tiene que bastar.',
    icon: LayoutLeftIcon,
    route: '/design-system/templates/home-operativo',
    config: { ...BASE, compact: true, description: false },
    sample: { ...MUESTRA, title: 'Crear un curso con IA', action: 'Crear' },
  },
  {
    id: 'novedad',
    title: 'Función nueva',
    summary:
      'Con insignia junto al orbe, para presentar algo que acaba de salir. La insignia se quita cuando deja de ser noticia; no se queda de adorno.',
    // Icono del caso («algo nuevo»), no marca de IA: antes era la chispa (auditoría 5-oct, nada de estrellas).
    icon: NewReleasesIcon,
    route: '/design-system/templates/home-operativo',
    config: { ...BASE, badge: true },
    sample: { ...MUESTRA, title: 'Resume una encuesta', description: 'La IA lee las respuestas abiertas y te deja las conclusiones.' },
  },
  {
    id: 'anuncio',
    title: 'Solo anuncio',
    summary:
      'Sin botón: la tarjeta cuenta algo que la IA ya está haciendo y no hay nada que pulsar. Si no hay acción, no se pone un botón de relleno.',
    icon: Megaphone01Icon,
    route: '/design-system/templates/home-operativo',
    config: { ...BASE, action: false },
    sample: {
      ...MUESTRA,
      title: 'La IA revisa tus contenidos',
      description: 'Cada noche marca los cursos con baja satisfacción y te los deja en Tareas.',
    },
  },
  {
    id: 'sin-halo',
    title: 'Sin color',
    summary:
      'El mismo bloque con el resplandor apagado. Se usa cuando la pantalla ya tiene otra pieza de IA con color y dos focos competirían.',
    icon: TaskDone01Icon,
    route: '/design-system/templates/home-operativo',
    config: { ...BASE, halo: false },
    sample: MUESTRA,
  },
]

// Nombre exacto de cada parte, el mismo que se dibuja en la vista previa.
export const PART = {
  card: 'Tarjeta',
  halo: 'Halo',
  orb: 'Orbe',
  badge: 'Insignia',
  title: 'Título',
  description: 'Bajada',
  action: 'Botón de IA',
} as const

const TEXT: Record<string, string> = {
  [PART.card]: 'El bloque entero. Va dentro de una pantalla normal, nunca sola.',
  [PART.halo]: 'Luz pastel con los cuatro colores de la IA a lo ancho del borde de arriba, que se apaga hacia abajo. No rellena la tarjeta: el texto siempre va sobre fondo liso.',
  [PART.orb]: 'La marca de la IA. Es lo que dice, sin leer nada, que esto lo hace el agente.',
  [PART.badge]: 'Para presentar algo nuevo. Se quita cuando deja de serlo.',
  [PART.title]: 'Qué gana la persona, en verbo. «Crear un curso», no «Generador de cursos».',
  [PART.description]: 'Una línea que explica cómo. Se puede quitar si la tarjeta va en una columna estrecha.',
  [PART.action]: 'La acción, con el degradado de marca y en pastilla. Solo una por tarjeta.',
}

// Las partes que se ven con la configuración actual, en el orden en que aparecen.
export function cardParts(config: CardConfig): PartInfo[] {
  const parts: PartInfo[] = [{ name: PART.card, text: TEXT[PART.card] }]
  const add = (name: string) => parts.push({ name, text: TEXT[name] ?? '' })

  // El halo es el fondo de la tarjeta, no una pieza que se pueda señalar: se explica en el control y en la guía.
  if (config.orb) add(PART.orb)
  if (config.badge) add(PART.badge)
  add(PART.title)
  if (config.description && !config.compact) add(PART.description)
  if (config.action) add(PART.action)

  return parts
}
