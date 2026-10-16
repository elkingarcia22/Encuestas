import type { IconSvgElement } from '@hugeicons/react'
import {
  BrowserIcon,
  LayoutDashboardIcon,
  PencilEdit02Icon,
  SidebarRightIcon,
  SmartPhone01Icon,
} from '@hugeicons/core-free-icons'
import { ICONO_IA } from '@/shared/layouts/nav-config'
import type { PartInfo } from '../../components/anatomy/anatomy-kit'

// General: el del marco (Workspace, Suite AI y portal). Pantalla enfocada: la cabecera propia del editor.
export type HeaderKind = 'general' | 'focused'

// Menú o panel que se ve abierto en la vista previa.
export type HeaderOpen = 'none' | 'notifications' | 'profile'

// Acciones de la derecha del header general, en su orden real. Desde el 1 oct ya no van Centro de ayuda (pasó al menú
// de perfil) ni Centro de procesos (se abre desde Notificaciones).
export const RIGHT_ACTIONS = ['news', 'notifications', 'profile'] as const
export type RightAction = (typeof RIGHT_ACTIONS)[number]

// Todo lo que se puede prender o apagar en el header.
export type HeaderConfig = {
  kind: HeaderKind
  menu: boolean
  left: 'title' | 'crumbs' | 'back'
  search: 'wide' | 'icon' | 'none'
  news: boolean
  notifications: boolean
  unread: boolean
  profile: boolean
  // Solo en pantalla enfocada.
  own: boolean
  open: HeaderOpen
  tooltip: boolean
  // Ancho del header: completo, con un panel a toda la derecha, angosto o celular.
  width: 'full' | 'panel' | 'narrow' | 'phone'
}

// Textos de ejemplo de cada caso.
export type HeaderSample = {
  title: string
  crumbs: string[]
  back: string
}

export type HeaderCase = {
  id: string
  title: string
  summary: string
  icon: IconSvgElement
  // Pantalla real donde se ve este header.
  example?: string
  config: HeaderConfig
  sample: HeaderSample
}

const GENERAL: HeaderConfig = {
  kind: 'general',
  menu: true,
  left: 'title',
  search: 'wide',
  news: true,
  notifications: true,
  unread: true,
  profile: true,
  own: false,
  open: 'none',
  tooltip: false,
  width: 'full',
}

// Pantalla enfocada (editor de LMS): sin buscador, pero con las mismas acciones de la derecha que el header general
// (18 sep, Nicolás: «que no falte nada y que sí se sientan reales»). Antes solo llevaba el perfil. Sin sello de estado:
// el editor real no lo tiene (auditoría, 5 oct).
const FOCUSED: HeaderConfig = {
  ...GENERAL,
  kind: 'focused',
  left: 'crumbs',
  search: 'none',
}

const SAMPLE: HeaderSample = {
  title: 'Vacantes',
  crumbs: ['Selección', 'Vacantes'],
  back: 'Selección',
}

export const HEADER_CASES: HeaderCase[] = [
  {
    id: 'workspace',
    title: 'Workspace',
    summary: 'El header de todas las pantallas del Workspace: título a la izquierda, buscador al centro y las acciones a la derecha.',
    icon: LayoutDashboardIcon,
    example: '/admin/seleccion/vacantes',
    config: GENERAL,
    sample: SAMPLE,
  },
  {
    id: 'suite-ai',
    title: 'Orbit',
    summary: 'Es el mismo header: el título es la conversación abierta y el buscador también le pregunta al agente.',
    icon: ICONO_IA,
    example: '/suite-ai',
    config: GENERAL,
    sample: { ...SAMPLE, title: 'Política de vacaciones', crumbs: ['Orbit', 'Política de vacaciones'], back: 'Orbit' },
  },
  {
    id: 'panel',
    title: 'Con panel del agente abierto',
    summary: 'Con «Actividad del agente» a toda la derecha el header se acorta: Novedades queda solo con su icono y el buscador se achica.',
    icon: SidebarRightIcon,
    example: '/suite-ai/chat/vacaciones',
    config: { ...GENERAL, width: 'panel' },
    sample: { ...SAMPLE, title: 'Política de vacaciones', crumbs: ['Orbit', 'Política de vacaciones'], back: 'Orbit' },
  },
  {
    id: 'editor',
    title: 'Pantalla enfocada (editor)',
    summary: 'El editor ocupa toda la pantalla: migas en vez de título y, a la derecha, las mismas acciones del header general: Novedades, Notificaciones y Perfil. «Orbit Flow» no va en el header: va al final de la fila de acciones de la pantalla, a la derecha del botón primario de la pantalla.',
    icon: PencilEdit02Icon,
    example: '/admin/aprendizaje/lms-creator/contenidos/onboarding-operativo',
    config: FOCUSED,
    sample: {
      title: 'Onboarding operativo',
      crumbs: ['Aprendizaje', 'Contenidos', 'Onboarding operativo'],
      back: 'Contenidos',
    },
  },
  {
    id: 'portal',
    title: 'Portal colaborador',
    summary: 'El colaborador ve el mismo header del Workspace; el título sale del menú del portal.',
    icon: BrowserIcon,
    example: '/portal-colaborador/aprendizaje',
    config: GENERAL,
    sample: { ...SAMPLE, title: 'Aprendizaje', crumbs: ['Inicio', 'Aprendizaje'], back: 'Inicio' },
  },
  {
    id: 'movil',
    title: 'Móvil o angosto',
    summary: 'Propuesta para celular: el buscador pasa a lupa y solo quedan notificaciones y perfil. Hoy el header real no esconde acciones.',
    icon: SmartPhone01Icon,
    config: { ...GENERAL, news: false, width: 'phone' },
    sample: SAMPLE,
  },
]

// Nombres de las partes: los mismos en la vista previa (data-region) y en la lista.
export const PART = {
  header: 'Header · 60px de alto',
  menu: 'Abrir o cerrar menú',
  title: 'Título',
  crumbs: 'Migas de pan',
  back: 'Volver',
  search: 'Buscador',
  own: 'Acciones de la pantalla',
  tooltip: 'Tooltip',
  panel: 'Panel a la derecha',
} as const

export const RIGHT_NAME: Record<RightAction, string> = {
  news: 'Novedades',
  notifications: 'Notificaciones',
  profile: 'Perfil',
}

export const OPEN_NAME: Record<Exclude<HeaderOpen, 'none'>, string> = {
  notifications: 'Notificaciones abiertas',
  profile: 'Menú de perfil abierto',
}

export type TipTarget = 'menu' | RightAction

// Lo que se ve de verdad con la configuración: el tipo de header deja fuera algunas piezas.
export function headerView(c: HeaderConfig) {
  const general = c.kind === 'general'
  // Las mismas acciones de la derecha en los dos tipos: el editor real lleva las del header general (HeaderActions).
  const right: RightAction[] = RIGHT_ACTIONS.filter((id) => c[id])
  const has: Record<Exclude<HeaderOpen, 'none'>, boolean> = {
    notifications: right.includes('notifications'),
    profile: c.profile,
  }
  const open: HeaderOpen = c.open !== 'none' && has[c.open] ? c.open : 'none'
  // El tooltip fijo va en el botón de menú; si no hay, en la primera acción de la derecha.
  const tip: TipTarget | null = !c.tooltip ? null : c.menu ? 'menu' : (right[0] ?? null)

  return {
    general,
    right,
    search: general ? c.search : 'none',
    unread: right.includes('notifications') && c.unread,
    profile: c.profile,
    own: !general && c.own,
    open,
    tip,
  }
}

const TEXT = {
  header: 'La barra de arriba de cada pantalla: 60px de alto y una línea abajo. Siempre va.',
  menu: 'Abre o cierra la barra lateral. Siempre es lo primero a la izquierda.',
  title: 'El nombre de la pantalla. Sale solo del menú y se corta con «…» si no cabe.',
  crumbs: 'Dicen dónde estás y dejan subir de nivel. Reemplazan al título en pantallas enfocadas.',
  back: 'Regresa a la pantalla de donde vienes cuando la actual es un paso de algo más grande.',
  searchWide: 'Busca o le pregunta al agente en todo el producto; también se abre con ⌘K. Siempre al centro exacto: se achica si falta espacio y en un header angosto queda solo la lupa.',
  searchIcon: 'El buscador en su forma mínima: una lupa que abre lo mismo que ⌘K.',
  own: 'Algo propio de esta pantalla, como «Guardado hace 1 min» o deshacer. No es parte del header.',
  tooltip: 'El nombre de la acción al pasar el cursor. Lo llevan todas menos el buscador, que ya dice qué hace.',
  open: 'Se abre justo debajo, alineado a la derecha, y su botón se pinta azul como la opción activa de la barra lateral. Se cierra con clic afuera o Esc.',
  openProfile: 'Se abre justo debajo, alineado a la derecha, y la foto se rodea de un anillo azul. Se cierra con clic afuera o Esc.',
  panel: 'Un panel de 360px a toda la altura, como «Actividad del agente» en el chat de Orbit. No es parte del header: el header se acorta a su lado. Orbit Flow no lo acorta: abre debajo del header.',
}

const RIGHT_TEXT: Record<RightAction, string> = {
  news: 'Lo nuevo de la plataforma, en azul para que se note. Con poco espacio queda solo el icono.',
  notifications:
    'Avisos de lo que pasó; se abren en un panel debajo. Desde aquí también se abre el Centro de procesos (importaciones, revisiones y reportes que corren en segundo plano), que ya no tiene botón propio.',
  profile: 'La foto de la persona. Abre su menú: arriba, una tarjeta con quién eres y otra con la vista actual, que cambia al Portal colaborador; debajo, centro de ayuda, contraseña, tema y cerrar sesión.',
}

// Partes visibles con la configuración actual, de izquierda a derecha.
export function headerParts(c: HeaderConfig): PartInfo[] {
  const v = headerView(c)
  const parts: PartInfo[] = [{ name: PART.header, text: TEXT.header }]
  const add = (name: string, text: string, slot?: boolean) => parts.push({ name, text, slot })

  if (c.menu) add(PART.menu, TEXT.menu)
  if (c.left === 'back') add(PART.back, TEXT.back)
  if (c.left === 'crumbs') add(PART.crumbs, TEXT.crumbs)
  else add(PART.title, TEXT.title)
  if (v.search !== 'none') add(PART.search, v.search === 'wide' ? TEXT.searchWide : TEXT.searchIcon)
  // En la pantalla enfocada las acciones propias van antes que las del header.
  if (v.own) add(PART.own, TEXT.own, true)

  for (const id of v.right) {
    const unread = id === 'notifications' && v.unread ? ' El punto azul dice que hay avisos sin leer.' : ''
    add(RIGHT_NAME[id], RIGHT_TEXT[id] + unread)
  }

  if (v.tip) add(PART.tooltip, TEXT.tooltip)
  if (v.open !== 'none') add(OPEN_NAME[v.open], v.open === 'profile' ? TEXT.openProfile : TEXT.open)
  if (c.width === 'panel') add(PART.panel, TEXT.panel, true)
  return parts
}
