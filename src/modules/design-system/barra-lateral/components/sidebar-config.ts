import type { IconSvgElement } from '@hugeicons/react'
import {
  BookOpen02Icon,
  BubbleChatIcon,
  Layers01Icon,
  LayoutDashboardIcon,
  SidebarLeft01Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import { ICONO_IA } from '@/shared/layouts/nav-config'
import { sidebarNavs, type SectionId } from '@/shared/layouts/nav-config'
import type { PartInfo } from '../../components/anatomy/anatomy-kit'

// Espacio que muestra la barra: cada uno trae su propio menú (nav-config).
export type SidebarSpace = 'workspace' | 'ai' | 'portal' | 'docs'

// Todo lo que se puede prender o apagar en la barra lateral.
export type SidebarConfig = {
  state: 'open' | 'rail'
  space: SidebarSpace
  // Qué nivel del menú se ve: el primero, un producto desplegado o el panel de tercer nivel.
  level: 'first' | 'sub' | 'third'
  account: boolean
  switcher: boolean
  newChat: boolean
  home: boolean
  groupTitles: boolean
  badges: boolean
  active: boolean
  statuses: boolean
  invite: boolean
  feedback: boolean
  // En el riel: qué se ve al pasar el cursor por un icono.
  hover: 'none' | 'tooltip' | 'menu'
}

// Props comunes de la barra abierta y del riel de la vista previa.
export type SidebarPartProps = {
  c: SidebarConfig
  names: boolean
  onChange: (patch: Partial<SidebarConfig>) => void
}

export type SidebarCase = {
  id: string
  title: string
  summary: string
  icon: IconSvgElement
  // Pantalla de la app donde se ve la barra así.
  route: string
  config: SidebarConfig
}

export const SPACE_SECTION: Record<SidebarSpace, SectionId> = {
  workspace: 'admin',
  ai: 'suite-ai',
  portal: 'portal-colaborador',
  docs: 'design-system',
}

const BASE: SidebarConfig = {
  state: 'open',
  space: 'workspace',
  level: 'first',
  account: true,
  switcher: true,
  newChat: true,
  home: true,
  groupTitles: true,
  badges: true,
  active: true,
  statuses: true,
  invite: true,
  feedback: true,
  hover: 'menu',
}

export const SIDEBAR_CASES: SidebarCase[] = [
  {
    id: 'workspace',
    title: 'Workspace',
    summary: 'La barra del día a día: empresa, productos que se despliegan, herramientas y el pie con tarjeta y feedback.',
    icon: LayoutDashboardIcon,
    route: '/admin/tareas',
    config: BASE,
  },
  {
    id: 'workspace-riel',
    title: 'Workspace plegado',
    summary: 'La misma barra cerrada en un riel de iconos: más espacio para la pantalla y el menú a un paso.',
    icon: SidebarLeft01Icon,
    route: '/admin/tareas',
    config: { ...BASE, state: 'rail' },
  },
  {
    id: 'tercer-nivel',
    title: 'Tercer nivel (LMS Creator)',
    summary: 'Una sección con páginas propias abre su panel en la barra, con Volver y un selector para saltar a las hermanas.',
    icon: BookOpen02Icon,
    route: '/admin/aprendizaje/lms-creator/contenidos',
    config: { ...BASE, level: 'third' },
  },
  {
    id: 'suite-ai',
    title: 'Orbit con historial',
    summary: 'La barra cambia a historial: nueva conversación arriba y cada conversación con su estado.',
    icon: BubbleChatIcon,
    route: '/suite-ai/chat/evaluaciones',
    config: { ...BASE, space: 'ai' },
  },
  {
    id: 'suite-ai-riel',
    title: 'Orbit plegado',
    summary: 'El riel de Orbit: nueva conversación y el historial en un menú flotante.',
    icon: ICONO_IA,
    route: '/suite-ai/chat/evaluaciones',
    config: { ...BASE, space: 'ai', state: 'rail' },
  },
  {
    id: 'portal',
    title: 'Portal colaborador',
    summary: 'Lo que ve cada colaborador: sus productos, con el submenú abierto, y sus tareas.',
    icon: UserGroupIcon,
    route: '/portal-colaborador/aprendizaje/catalogo',
    config: { ...BASE, space: 'portal', level: 'sub', badges: false },
  },
  {
    id: 'documentacion',
    title: 'Documentación',
    summary: 'El design system: un solo grupo largo y las páginas con variantes dentro de un submenú.',
    icon: Layers01Icon,
    route: '/design-system/barra-lateral',
    config: { ...BASE, space: 'docs', badges: false },
  },
]

// Página abierta de ejemplo en cada espacio y nivel (la que se marca como activa).
const FOCUS: Record<SidebarSpace, Record<SidebarConfig['level'], string>> = {
  workspace: {
    first: '/admin/tareas',
    sub: '/admin/aprendizaje/diagnostico',
    third: '/admin/aprendizaje/lms-creator/contenidos',
  },
  portal: {
    first: '/portal-colaborador/tareas',
    sub: '/portal-colaborador/aprendizaje/catalogo',
    third: '/portal-colaborador/aprendizaje/catalogo',
  },
  docs: {
    first: '/design-system/barra-lateral',
    sub: '/design-system/navegacion/basica',
    third: '/design-system/navegacion/basica',
  },
  ai: {
    first: '/suite-ai/chat/evaluaciones',
    sub: '/suite-ai/chat/evaluaciones',
    third: '/suite-ai/chat/evaluaciones',
  },
}

// Ítem que lleva la insignia «Nuevo» cuando se prende: el que la trae en el menú o uno de muestra.
const BADGE_ITEM: Record<SidebarSpace, string> = {
  workspace: '/admin/seleccion',
  portal: '/portal-colaborador/desempeno-cultura',
  docs: '/design-system/header',
  ai: '',
}

// Solo Workspace tiene secciones con tercer nivel (LMS Creator, Planes de formación, Certificados).
export const hasThirdLevel = (space: SidebarSpace) => space === 'workspace'

// Nivel que realmente se puede mostrar en el espacio elegido.
export function effectiveLevel(c: SidebarConfig): SidebarConfig['level'] {
  if (c.space === 'ai') return 'first'
  if (c.level === 'third' && !hasThirdLevel(c.space)) return 'sub'
  return c.level
}

// ¿La página `path` es `parent` o está dentro de él?
export function isInside(path: string | null, parent: string) {
  return path !== null && (path === parent || path.startsWith(`${parent}/`))
}

// Papel de cada fila en la anatomía. Cada nombre se marca una sola vez para que se lea claro.
export type RowRoles = {
  // Página abierta de ejemplo (aunque no se marque como activa).
  focus: string
  active: string | null
  // Ítem de primer nivel que contiene la página activa.
  activeItem: string | null
  // Producto desplegado (submenú) o, en el riel, el que abre el menú flotante.
  host: string | null
  badge: string | null
  // Primera fila sencilla sin otro papel: se marca como «Ítem».
  plain: string | null
}

export function rowRoles(c: SidebarConfig): RowRoles {
  const nav = sidebarNavs[SPACE_SECTION[c.space]]
  const level = effectiveLevel(c)
  const focus = FOCUS[c.space][level]
  const items = nav.groups.flatMap((group) => group.items)
  const active = c.active ? focus : null
  const badge = c.badges && BADGE_ITEM[c.space] ? BADGE_ITEM[c.space] : null

  if (c.space === 'ai') return { focus, active, activeItem: null, host: null, badge: null, plain: null }

  const withKids = items.filter((item) => item.children?.length)
  const host =
    (level !== 'first' ? withKids.find((item) => isInside(focus, item.path)) : undefined) ??
    withKids.find((item) => item.path !== BADGE_ITEM[c.space] && !isInside(focus, item.path)) ??
    null
  const activeItem = items.find((item) => isInside(active, item.path))?.path ?? null
  const plain =
    items.find((item) => !item.children?.length && item.path !== active && item.path !== badge && item.path !== host?.path)?.path ?? null
  return { focus, active, activeItem, host: host?.path ?? null, badge, plain }
}

// Nombre de un icono del riel según su papel.
export function railRegion(path: string, roles: RowRoles) {
  if (path === roles.host) return 'Ítem con menú'
  if (path === roles.activeItem) return 'Ítem activo'
  if (path === roles.badge) return 'Punto de nuevo'
  if (path === roles.plain) return 'Ítem'
  return undefined
}

export const WIDTH_LABEL: Record<SidebarConfig['state'], string> = {
  open: 'Barra lateral · 288px',
  rail: 'Riel plegado · 72px',
}

const PART_TEXT: Record<string, string> = {
  'Barra lateral · 288px': 'El contenedor de la navegación, a la izquierda de todas las pantallas. Abierta mide 288px.',
  'Riel plegado · 72px': 'La barra cerrada: solo iconos en 72px, con las mismas opciones. Gana espacio para tablas y editores.',
  'Botón de menú': 'Vive en el header, junto al título: abre y cierra la barra. La app recuerda cómo la dejó cada persona.',
  Empresa: 'Logo (28px), nombre y, debajo, el plan contratado en una insignia: Esencial en azul y Pro en violeta («Meta Colombia · Plan Pro»). Abre su menú: consumo, configuración y cambiar de empresa. En el riel queda solo el logo y el mismo menú sale a su derecha.',
  'Selector de espacio': 'Cambia entre Workspace y Orbit. La opción activa es la pastilla blanca.',
  'Nueva conversación': 'Botón con el degradado de la IA para empezar un chat. Solo aparece en Orbit.',
  Inicio: 'Primera fila, sola y sin título: lleva a la portada del espacio.',
  'Título de grupo': 'Nombre corto que separa bloques del menú (Productos, Herramientas). Se puede quitar.',
  Ítem: 'Una fila con icono y nombre. Lleva directo a una página.',
  'Ítem con submenú': 'Un producto con páginas adentro: la flecha hacia abajo lo despliega en la misma barra.',
  'Ítem con menú': 'Un producto con páginas: en el riel, al pasar el cursor abre su menú flotante.',
  Submenú: 'Segundo nivel: las páginas del producto, colgadas de una línea guía.',
  'Abre tercer nivel': 'La flecha a la derecha avisa que la sección tiene sus propias páginas: abre su panel.',
  'Ítem activo': 'La página en la que estás: fondo azul suave, texto azul y una marca azul pegada al borde.',
  Insignia: '«Nuevo» junto al nombre para avisar de algo recién llegado. Una sola a la vez.',
  'Punto de nuevo': 'En el riel la insignia se vuelve un punto azul sobre el icono.',
  Volver: 'Sale del panel de tercer nivel y regresa al menú completo, sin cambiar de página.',
  'Selector de sección': 'La sección abierta, con su icono y para qué sirve. Salta a las secciones hermanas.',
  Historial: 'Las conversaciones de Orbit en una sola lista, de la más reciente a la más antigua, con la fecha debajo.',
  'Punto de estado': 'Junto al título: anillo gris si ya se leyó, punto azul si hay respuesta sin leer y un cometa de colores mientras el agente trabaja.',
  'Conversación abierta': 'La conversación que está en pantalla, marcada igual que un ítem activo.',
  'Tarjeta del pie': 'Espacio para una tarjeta que se puede cerrar: hoy, el tour por la nueva experiencia; mañana, una novedad o el fin de una prueba. Cambia el contenido; el lugar no.',
  'Enviar feedback': 'Botón fijo al final para mandar comentarios al equipo de producto.',
  Tooltip: 'En el riel no hay textos: el nombre de cada icono sale a la derecha al pasar el cursor.',
  'Menú flotante': 'Se abre a la derecha del icono al pasar el cursor, con el nombre arriba y sus páginas.',
}

// Partes visibles con la configuración actual, de arriba abajo. Deben coincidir con los nombres de la vista previa.
export function sidebarParts(c: SidebarConfig): PartInfo[] {
  const ai = c.space === 'ai'
  const nav = sidebarNavs[SPACE_SECTION[c.space]]
  const level = effectiveLevel(c)
  const roles = rowRoles(c)
  const names: string[] = []
  const push = (name?: string | null) => {
    if (name && !names.includes(name)) names.push(name)
  }

  push(WIDTH_LABEL[c.state])
  push('Botón de menú')
  if (c.account) push('Empresa')
  if (c.switcher) push('Selector de espacio')

  if (ai) {
    if (c.newChat) push('Nueva conversación')
    push('Historial')
    if (c.state === 'open') {
      if (c.statuses) push('Punto de estado')
      if (c.active) push('Conversación abierta')
    }
  } else if (c.state === 'rail') {
    if (c.home) push('Inicio')
    nav.groups.forEach((group) => group.items.forEach((item) => push(railRegion(item.path, roles))))
    if (c.feedback) push('Enviar feedback')
  } else if (level === 'third') {
    push('Volver')
    push('Selector de sección')
    if (roles.active) push('Ítem activo')
    push('Ítem')
  } else {
    if (c.home) push('Inicio')
    nav.groups.forEach((group, index) => {
      if (c.groupTitles && group.label && index === 0) push('Título de grupo')
      group.items.forEach((item) => {
        push(roles.active === item.path ? 'Ítem activo' : roles.host === item.path ? 'Ítem con submenú' : roles.plain === item.path ? 'Ítem' : null)
        if (roles.badge === item.path) push('Insignia')
        if (level !== 'sub' || roles.host !== item.path) return
        push('Submenú')
        const firstDrill = item.children?.find((child) => child.children?.length)?.path
        item.children?.forEach((child) => {
          const active = child.children?.length ? isInside(roles.active, child.path) : roles.active === child.path
          push(active ? 'Ítem activo' : child.path === firstDrill ? 'Abre tercer nivel' : null)
        })
      })
    })
  }

  if (c.state === 'rail') {
    if (c.hover === 'tooltip') push('Tooltip')
    if (c.hover === 'menu' && (ai || roles.host)) push('Menú flotante')
  }

  const parts: PartInfo[] = names.map((name) => ({ name, text: PART_TEXT[name] }))
  if (!ai && c.state === 'open') {
    if (c.invite) parts.push({ name: 'Tarjeta del pie', text: PART_TEXT['Tarjeta del pie'], slot: true })
    if (c.feedback) parts.push({ name: 'Enviar feedback', text: PART_TEXT['Enviar feedback'] })
  }
  return parts
}
