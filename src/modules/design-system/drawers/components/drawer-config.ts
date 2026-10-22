import type { IconSvgElement } from '@hugeicons/react'
import {
  Alert02Icon,
  Briefcase06Icon,
  FilterHorizontalIcon,
  FlashIcon,
  SmartPhone01Icon,
  Layers01Icon,
  Menu01Icon,
  Notification03Icon,
  PencilEdit02Icon,
  UserSearch01Icon,
  WorkflowSquare10Icon,
} from '@hugeicons/core-free-icons'
import { ICONO_IA } from '@/shared/layouts/nav-config'
import type { PartInfo } from '../../components/anatomy/anatomy-kit'
import type { DrawerDirection } from './drawer-shell'

// Drawers de ejemplo con contenido real (se abren desde «Ver ejemplo con contenido»).
export type ExampleDrawer = 'candidato' | 'filtros' | 'notas' | 'avisos' | 'agente' | 'proceso' | 'menu' | 'acciones' | 'vista-previa' | 'aviso'

// Todo lo que se puede prender o apagar en un drawer.
export type DrawerConfig = {
  direction: DrawerDirection
  size: 'sm' | 'md' | 'lg'
  // Superficie de Suite AI: botones en pastilla.
  ai: boolean
  nav: 'none' | 'back' | 'records'
  media: 'none' | 'icon' | 'avatar' | 'orb'
  kicker: boolean
  badge: boolean
  description: boolean
  context: boolean
  under: 'none' | 'tabs' | 'steps' | 'progress'
  tabs: 'line' | 'default'
  footer: 'none' | 'one' | 'two' | 'split' | 'composer'
}

// Textos de ejemplo de cada caso.
export type DrawerSample = {
  icon: IconSvgElement
  initials: string
  kicker: string
  title: string
  badge: string
  description: string
  back: string
  context: string
  tabs: string[]
  steps: string[]
  progress: { label: string; value: number }
  one: string
  secondary: string
  primary: string
  left: string
  composer: string
  slot: string
}

export type DrawerCase = {
  id: string
  title: string
  summary: string
  icon: IconSvgElement
  example: ExampleDrawer
  config: DrawerConfig
  sample: DrawerSample
}

const BASE: DrawerConfig = {
  direction: 'right',
  size: 'md',
  ai: false,
  nav: 'none',
  media: 'icon',
  kicker: false,
  badge: false,
  description: true,
  context: false,
  under: 'none',
  tabs: 'line',
  footer: 'two',
}

const SAMPLE: DrawerSample = {
  icon: Briefcase06Icon,
  initials: 'LM',
  kicker: 'Selección',
  title: 'Analista de datos',
  badge: 'Abierta',
  description: 'Vacante de Analítica · publicada hace 12 días',
  back: 'Laura Méndez',
  context: 'Analista de datos · 12 candidatos',
  tabs: ['Resumen', 'Recorrido', 'Documentos'],
  steps: ['Datos', 'Requisitos', 'Publicación'],
  progress: { label: 'Paso 2 de 4', value: 45 },
  one: 'Listo',
  secondary: 'Cancelar',
  primary: 'Guardar',
  left: 'Limpiar',
  composer: 'Pregunta algo sobre esta vacante',
  slot: 'La ficha, el formulario o la lista que necesite el caso. Tiene su propio scroll.',
}

export const DRAWER_CASES: DrawerCase[] = [
  {
    id: 'detalle',
    title: 'Detalle de registro',
    summary: 'Ver y trabajar un registro sin salir de la lista, y pasar al siguiente.',
    icon: UserSearch01Icon,
    example: 'candidato',
    config: { ...BASE, nav: 'records', media: 'avatar', badge: true, under: 'tabs', footer: 'split' },
    sample: {
      ...SAMPLE,
      title: 'Laura Méndez',
      badge: 'En entrevista',
      description: 'Analista de datos · postuló hace 12 días',
      left: 'Rechazar',
      primary: 'Avanzar etapa',
      slot: 'La ficha del candidato: datos, recorrido y documentos.',
    },
  },
  {
    id: 'filtros',
    title: 'Filtros',
    summary: 'Afinar una lista con varios criterios y ver cuántos resultados quedan.',
    icon: FilterHorizontalIcon,
    example: 'filtros',
    config: { ...BASE, size: 'sm', footer: 'split' },
    sample: {
      ...SAMPLE,
      icon: FilterHorizontalIcon,
      title: 'Filtros de vacantes',
      description: 'Combina criterios; la lista se actualiza al aplicar.',
      primary: 'Ver 24 resultados',
      slot: 'Los criterios: casillas, opciones, rangos y responsables.',
    },
  },
  {
    id: 'con-cambios',
    title: 'Panel con algo escrito',
    // 13-oct: el caso «Formulario por pasos» (Nueva vacante) se retiró: crear y editar viven en una página, nunca en un
    // panel (regla «crear-en-pagina»). En su lugar va lo que sí cabe: una nota o un ajuste corto, con `conCambios`.
    summary:
      'Una nota o un ajuste corto. Con algo escrito (conCambios) no se cierra al tocar fuera y, al cerrarlo con la X, «Cancelar» o Escape, pregunta «Seguir editando · Descartar» dentro del mismo panel. Crear o editar algo largo no va aquí: va en una página.',
    icon: PencilEdit02Icon,
    example: 'notas',
    config: { ...BASE },
    sample: {
      ...SAMPLE,
      icon: PencilEdit02Icon,
      title: 'Nota para el candidato',
      description: 'Se guarda en su ficha y la ve todo el equipo de la vacante.',
      secondary: 'Cancelar',
      primary: 'Guardar nota',
      slot: 'El campo para escribir la nota.',
    },
  },
  {
    id: 'bandeja',
    title: 'Bandeja',
    // Igual que la campana del header (NotificationsPopover), auditoría del 5 oct: «Notificaciones», Todas / Sin leer · N,
    // «Marcar todas» arriba, fila gris de novedades y pie con «Configurar avisos» y «Ver todas». Sin «Menciones».
    summary: 'La campana del header en un panel: filtro Todas / Sin leer, «Marcar todas» arriba, las novedades en una fila gris y el pie con Configurar avisos y Ver todas.',
    icon: Notification03Icon,
    example: 'avisos',
    config: { ...BASE, size: 'sm', under: 'tabs', tabs: 'default', footer: 'split' },
    sample: {
      ...SAMPLE,
      icon: Notification03Icon,
      title: 'Notificaciones',
      description: '3 sin leer',
      tabs: ['Todas', 'Sin leer · 3'],
      left: 'Configurar avisos',
      primary: 'Ver todas',
      slot: 'La fila gris de novedades y los avisos, o el estado vacío cuando está al día.',
    },
  },
  {
    id: 'anidado',
    title: 'Vista dentro del drawer',
    summary: 'Lo que se abre desde un drawer (otro detalle, una ventana, una confirmación) cambia su contenido en el mismo drawer, con «←» arriba para volver. Nada de otro drawer encima.',
    icon: Layers01Icon,
    example: 'candidato',
    config: { ...BASE, nav: 'back' },
    sample: {
      ...SAMPLE,
      icon: UserSearch01Icon,
      title: 'Entrevista con líder',
      description: 'Juan Rincón · hoy 3:00 p. m.',
      secondary: 'Volver',
      primary: 'Registrar evaluación',
      slot: 'La evaluación de la entrevista.',
    },
  },
  {
    id: 'agente',
    title: 'Orbit',
    summary: 'Conversar con el agente sobre lo que está abierto. Botones en pastilla y orbe.',
    icon: ICONO_IA,
    example: 'agente',
    config: { ...BASE, ai: true, media: 'orb', context: true, footer: 'composer' },
    sample: {
      ...SAMPLE,
      title: 'Orbit',
      description: 'Trabaja sobre la vacante abierta',
      slot: 'La conversación con el agente y sus propuestas.',
    },
  },
  {
    id: 'proceso',
    title: 'Proceso en curso',
    summary: 'Seguir un proceso que avanza en vivo; sigue aunque se cierre el drawer.',
    icon: WorkflowSquare10Icon,
    example: 'proceso',
    config: { ...BASE, ai: true, size: 'sm', media: 'orb', under: 'progress', footer: 'split' },
    sample: {
      ...SAMPLE,
      title: 'Publicar política de vacaciones',
      description: 'Corre en segundo plano · iniciado 9:42',
      left: 'Cancelar proceso',
      primary: 'Seguir en segundo plano',
      slot: 'Los pasos del proceso y lo que va pasando.',
    },
  },
  {
    id: 'menu',
    title: 'Menú en celular',
    summary: 'La barra lateral en pantallas pequeñas. Es el único drawer que sale por la izquierda.',
    icon: Menu01Icon,
    example: 'menu',
    config: { ...BASE, direction: 'left', size: 'sm', footer: 'none' },
    sample: {
      ...SAMPLE,
      icon: Menu01Icon,
      title: 'Meta Colombia',
      description: 'Espacio de Administración',
      slot: 'Las secciones del menú, las herramientas y la cuenta.',
    },
  },
  {
    id: 'acciones',
    title: 'Acciones rápidas',
    summary: 'Hoja inferior con acciones sobre una selección. Se arrastra hacia abajo para cerrar.',
    icon: FlashIcon,
    example: 'acciones',
    config: { ...BASE, direction: 'bottom', footer: 'one' },
    sample: {
      ...SAMPLE,
      icon: FlashIcon,
      title: '3 candidatos seleccionados',
      description: 'Analista de datos · etapa Entrevistas',
      one: 'Cancelar',
      slot: 'Las acciones que se pueden hacer con la selección.',
    },
  },
  {
    id: 'vista-previa',
    title: 'Vista previa en celular',
    summary: 'Abre a media pantalla y se arrastra hacia arriba para verla completa.',
    icon: SmartPhone01Icon,
    example: 'vista-previa',
    config: { ...BASE, direction: 'bottom', description: true, footer: 'none' },
    sample: {
      ...SAMPLE,
      icon: SmartPhone01Icon,
      title: 'Así lo ve el colaborador',
      description: 'Vacante Analista de datos · portal en celular',
      slot: 'La pantalla tal como se ve en el celular.',
    },
  },
  {
    id: 'aviso',
    title: 'Aviso del sistema',
    summary: 'Un aviso importante baja desde arriba con dos acciones claras.',
    icon: Alert02Icon,
    example: 'aviso',
    config: { ...BASE, direction: 'top', badge: true },
    sample: {
      ...SAMPLE,
      icon: Alert02Icon,
      title: 'El ciclo de evaluaciones cierra en 4 días',
      badge: 'Importante',
      description: 'Viernes 18 de septiembre · después no se pueden registrar evaluaciones.',
      secondary: 'Recordármelo mañana',
      primary: 'Enviar recordatorio',
      slot: 'El detalle del aviso y a quién afecta.',
    },
  },
]

export const DIRECTION_LABEL: Record<DrawerDirection, string> = {
  right: 'derecha',
  left: 'izquierda',
  bottom: 'abajo',
  top: 'arriba',
}

export const SIZE_LABEL: Record<DrawerConfig['size'], string> = {
  sm: '24rem',
  md: '30rem',
  lg: '36rem',
}

// Nombre del panel en la anatomía: borde y, en los laterales, ancho.
export function panelLabel(c: DrawerConfig) {
  const side = c.direction === 'right' || c.direction === 'left'
  return `Panel · ${DIRECTION_LABEL[c.direction]}${side ? ` · ${SIZE_LABEL[c.size]}` : ''}`
}

const PART_TEXT: Record<string, string> = {
  Panel: 'Sale desde un borde: derecha para ver el detalle de un registro, izquierda para navegar, abajo para acciones y arriba para avisos. Crear o editar algo largo no va en un panel.',
  Tirador: 'En los drawers de abajo y arriba: se arrastra para abrir más o para cerrar.',
  Volver: 'En una vista abierta dentro del drawer: regresa a lo que mostraba antes, sin cerrarlo.',
  'Anterior / siguiente': 'Pasa al registro de al lado sin cerrar el drawer.',
  Imagen: 'Icono, avatar u orbe que identifica lo que está abierto.',
  Antetítulo: 'Palabra corta sobre el título: producto o tipo de registro.',
  Título: 'El nombre de lo que está abierto. Siempre va.',
  Estado: 'Insignia junto al título: en entrevista, importante, por revisar…',
  Descripción: 'Una línea con el dato que más ayuda a ubicarse.',
  Cerrar: 'La X estándar (CloseButton): círculo claro de 32 px con filo fino, la misma de ventanas y tarjetas. Siempre arriba a la derecha. También se cierra con Esc o con clic afuera.',
  Contexto: 'Franja que dice sobre qué registro se trabaja; clave con el agente.',
  Pestañas: 'Separan la información del registro en partes.',
  Pasos: 'Las partes de algo con avance a la vista. Un asistente de creación por pasos no va en un panel: va en una página.',
  Progreso: 'El avance de un proceso que corre en vivo.',
  Pie: 'Los botones del drawer: el principal siempre a la derecha.',
  'Caja de conversación': 'Donde se le escribe al agente sin salir del drawer.',
  Slot: 'Lo que el caso necesite: ficha, nota corta, lista o conversación. No es parte del componente.',
}

// Partes visibles con la configuración actual, de arriba abajo.
export function drawerParts(c: DrawerConfig): PartInfo[] {
  const vertical = c.direction === 'bottom' || c.direction === 'top'
  const names: string[] = []
  if (vertical && c.direction === 'bottom') names.push('Tirador')
  if (c.nav === 'back') names.push('Volver')
  if (c.nav === 'records') names.push('Anterior / siguiente')
  if (c.media !== 'none') names.push('Imagen')
  if (c.kicker) names.push('Antetítulo')
  names.push('Título')
  if (c.badge) names.push('Estado')
  if (c.description) names.push('Descripción')
  names.push('Cerrar')
  if (c.context) names.push('Contexto')
  if (c.under === 'tabs') names.push('Pestañas')
  if (c.under === 'steps') names.push('Pasos')
  if (c.under === 'progress') names.push('Progreso')

  const parts: PartInfo[] = [{ name: panelLabel(c), text: PART_TEXT.Panel }]
  parts.push(...names.map((name) => ({ name, text: PART_TEXT[name] })))
  parts.push({ name: 'Cuerpo', text: PART_TEXT.Slot, slot: true })
  if (c.footer === 'composer') parts.push({ name: 'Caja de conversación', text: PART_TEXT['Caja de conversación'] })
  else if (c.footer !== 'none') parts.push({ name: 'Pie', text: PART_TEXT.Pie })
  if (vertical && c.direction === 'top') parts.push({ name: 'Tirador', text: PART_TEXT.Tirador })
  return parts
}
