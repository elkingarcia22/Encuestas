import type { IconSvgElement } from '@hugeicons/react'
import {
  Add01Icon,
  Analytics01Icon,
  BookOpen01Icon,
  Briefcase06Icon,
  Building03Icon,
  Calendar03Icon,
  Certificate01Icon,
  CheckmarkSquare02Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  DashboardSquare01Icon,
  Download04Icon,
  File02Icon,
  FileAttachmentIcon,
  Folder01Icon,
  LayoutTopIcon,
  LayoutTwoColumnIcon,
  Location01Icon,
  Logout01Icon,
  Mail01Icon,
  Menu01Icon,
  Mortarboard01Icon,
  Note01Icon,
  Rocket01Icon,
  Settings02Icon,
  Task01Icon,
  UserAccountIcon,
  UserIcon,
  UserMultiple02Icon,
  WorkflowSquare10Icon,
} from '@hugeicons/core-free-icons'
import { ICONO_IA } from '@/shared/layouts/nav-config'
import type { PageWidth } from '@/shared/components/page-width'
import type { PageTitleSize } from '@/shared/components/PageShell'
import type { PartInfo } from '../../components/anatomy/anatomy-kit'

// Todo lo que se puede prender o apagar en una pantalla del Workspace (marco de página).
export type PageConfig = {
  // Navegación arriba del título. La miga NO va aquí: vive en la barra de arriba (ver `crumbs`).
  top: 'none' | 'back'
  // Miga de pan, en la barra de arriba: apagada, todos los niveles, los del medio escondidos en «…»
  // o con desplegable de páginas hermanas al final.
  crumbs: 'off' | 'simple' | 'collapsed' | 'siblings'
  crumbHome: boolean
  separator: 'chevron' | 'slash'
  // «Volver»: siempre la flecha junto al título (22 sep). El enlace de texto encima del título se retiró porque se leía
  // como una segunda miga de pan. Se deja el campo para no reescribir los casos.
  back: 'text' | 'icon'
  // Título.
  titleSize: PageTitleSize
  media: 'none' | 'icon' | 'avatar' | 'orb'
  mediaSize: 'sm' | 'md' | 'lg'
  kicker: boolean
  badge: boolean
  meta: boolean
  titleAction: 'none' | 'favorite' | 'edit'
  description: 'none' | 'short' | 'long'
  // Botones.
  records: 'none' | 'counter' | 'arrows'
  primary: boolean
  secondary: boolean
  more: boolean
  // Botón que abre el agente contextual («Orbit Flow»), siempre el último de la fila: pastilla completa o solo el orbe.
  modoIa: 'none' | 'full' | 'orb'
  // Botones en pastilla, como en Suite AI.
  ai: boolean
  // Navegación bajo el título.
  under: 'none' | 'tabs' | 'menu'
  submenu: boolean
  views: boolean
  steps: 'none' | 'horizontal' | 'vertical'
  stepMarker: 'check' | 'number'
  stepText: boolean
  // Pestañas (bajo el título o verticales dentro del contenido).
  tabs: 'line' | 'default' | 'view' | 'page'
  tabIcons: boolean
  counts: boolean
  tabMore: boolean
  // Navegación dentro del contenido.
  inner: 'none' | 'menu' | 'tabs' | 'toc' | 'list' | 'chips'
  // Un solo paginador en el sistema (decisión 2 de la auditoría, 5-oct): el de las tablas. La versión «compacta» se retiró.
  pagination: 'none' | 'numbers'
  footer: 'legal' | 'save' | 'wizard' | 'none'
  width: PageWidth
}

// Textos de ejemplo de cada caso, para que la vista previa se lea como una pantalla de verdad.
export type PageSample = {
  crumbs: string[]
  // Páginas del mismo nivel que la última miga (desplegable «hermanos»).
  siblings: string[]
  back: string
  kicker: string
  title: string
  badge: string
  badgeVariant?: 'secondary' | 'success-light'
  short: string
  long: string
  icon: IconSvgElement
  initials: string
  meta: { icon: IconSvgElement; text: string }[]
  primary: string
  primaryIcon?: IconSvgElement
  secondary: string
  secondaryIcon?: IconSvgElement
  tabs: { label: string; count?: number; icon: IconSvgElement }[]
  menu: string[]
  chips: { label: string; count: number }[]
  slot: string
}

export type PageCase = {
  id: string
  title: string
  summary: string
  icon: IconSvgElement
  // Pantalla completa del patrón, con contenido real (no todos los casos la tienen).
  example?: string
  config: PageConfig
  sample: PageSample
}

const BASE: PageConfig = {
  top: 'none',
  crumbs: 'simple',
  crumbHome: false,
  separator: 'chevron',
  back: 'icon',
  titleSize: 'lg',
  media: 'none',
  mediaSize: 'lg',
  kicker: false,
  badge: false,
  meta: false,
  titleAction: 'none',
  description: 'short',
  records: 'none',
  primary: true,
  secondary: true,
  more: false,
  modoIa: 'none',
  ai: false,
  under: 'none',
  submenu: true,
  views: false,
  steps: 'none',
  stepMarker: 'check',
  stepText: false,
  tabs: 'line',
  tabIcons: false,
  counts: true,
  tabMore: false,
  inner: 'none',
  pagination: 'none',
  footer: 'legal',
  width: 'default',
}

const SAMPLE: PageSample = {
  crumbs: ['Inicio', 'Selección', 'Vacantes'],
  siblings: ['Vacantes', 'Candidatos', 'Entrevistas', 'Ofertas'],
  back: 'Vacantes',
  kicker: 'Selección',
  title: 'Vacantes',
  badge: 'Abierta',
  short: 'Publica, sigue y cierra los procesos de selección de tu empresa.',
  long: 'Publica, sigue y cierra los procesos de selección de tu empresa. Cada cambio queda guardado y todo el equipo ve el mismo estado.',
  icon: Briefcase06Icon,
  initials: 'LM',
  meta: [
    { icon: Building03Icon, text: 'Analítica' },
    { icon: UserIcon, text: 'Laura Méndez' },
    { icon: Location01Icon, text: 'Bogotá' },
    { icon: Calendar03Icon, text: 'Publicada el 2 sep' },
  ],
  primary: 'Nueva vacante',
  primaryIcon: Add01Icon,
  secondary: 'Exportar',
  secondaryIcon: Download04Icon,
  tabs: [
    { label: 'Abiertas', count: 4, icon: Folder01Icon },
    { label: 'Borradores', count: 1, icon: Note01Icon },
    { label: 'Cerradas', count: 2, icon: CheckmarkCircle02Icon },
    { label: 'Todas', count: 7, icon: Task01Icon },
  ],
  menu: ['Resumen', 'Cursos', 'Planes de formación', 'Certificados'],
  // Sin chip «Todas»: sin ningún filtro puesto ya se ve todo (FiltroChip).
  chips: [
    { label: 'Mías', count: 6 },
    { label: 'Urgentes', count: 3 },
    { label: 'Sin responsable', count: 2 },
  ],
  slot: 'La tabla de vacantes, los filtros o lo que necesite esta pantalla.',
}

export const PAGE_CASES: PageCase[] = [
  {
    id: 'lista',
    title: 'Lista de registros',
    summary: 'Entrada a una sección: dónde estás, qué es, qué puedes hacer y cómo cambiar de grupo.',
    icon: LayoutTopIcon,
    example: '/design-system/navegacion/basica',
    config: { ...BASE, more: true, under: 'tabs' },
    sample: SAMPLE,
  },
  {
    id: 'detalle',
    title: 'Detalle de registro',
    summary: 'Trabajar un registro y pasar al siguiente sin volver a la lista.',
    icon: FileAttachmentIcon,
    example: '/design-system/navegacion/detalle',
    config: { ...BASE, top: 'back', records: 'counter', media: 'icon', badge: true, meta: true, description: 'none', more: true, under: 'tabs' },
    sample: {
      ...SAMPLE,
      title: 'Analista de datos',
      primary: 'Mover de etapa',
      primaryIcon: undefined,
      secondary: 'Editar',
      secondaryIcon: undefined,
      tabs: [
        { label: 'Resumen', icon: File02Icon },
        { label: 'Candidatos', count: 18, icon: UserMultiple02Icon },
        { label: 'Actividad', count: 9, icon: Clock01Icon },
      ],
      slot: 'La ficha del registro: resumen, candidatos, actividad…',
    },
  },
  {
    id: 'perfil',
    title: 'Ficha de persona',
    summary: 'Un registro con muchas secciones: flecha para volver junto al título y pestañas verticales al costado.',
    icon: UserAccountIcon,
    config: {
      ...BASE,
      top: 'back',
      back: 'icon',
      titleSize: 'md',
      media: 'avatar',
      badge: true,
      meta: true,
      titleAction: 'favorite',
      description: 'none',
      primary: false,
      secondary: true,
      more: true,
      records: 'arrows',
      inner: 'tabs',
      tabIcons: true,
      counts: false,
    },
    sample: {
      ...SAMPLE,
      back: 'Colaboradores',
      title: 'Laura Méndez',
      badge: 'Activa',
      badgeVariant: 'success-light',
      meta: [
        { icon: Briefcase06Icon, text: 'Analista de datos' },
        { icon: Building03Icon, text: 'Analítica' },
        { icon: Mail01Icon, text: 'laura.mendez@meta.co' },
      ],
      secondary: 'Enviar mensaje',
      secondaryIcon: Mail01Icon,
      tabs: [
        { label: 'Datos personales', icon: UserIcon },
        { label: 'Aprendizaje', count: 12, icon: Mortarboard01Icon },
        { label: 'Desempeño', icon: Analytics01Icon },
        { label: 'Documentos', count: 4, icon: File02Icon },
      ],
      slot: 'Los datos de la sección elegida en las pestañas verticales.',
    },
  },
  {
    id: 'tablero',
    title: 'Tablero con vistas',
    summary: 'Los mismos datos en vistas guardadas, con más ancho para tablas y tableros densos.',
    icon: DashboardSquare01Icon,
    example: '/design-system/navegacion/tablero',
    // Las vistas guardadas van en la pestaña maestra, subrayada bajo el título, como en el caso completo.
    config: { ...BASE, under: 'tabs', tabs: 'line', views: true, width: 'wide' },
    sample: {
      ...SAMPLE,
      crumbs: ['Inicio', 'Selección', 'Onboarding'],
      siblings: ['Onboarding', 'Offboarding', 'Periodo de prueba'],
      title: 'Onboarding',
      short: 'Sigue a las personas que ingresan este mes y lo que les falta para empezar.',
      primary: 'Nuevo ingreso',
      tabs: [
        { label: 'Todos los ingresos', count: 24, icon: UserMultiple02Icon },
        { label: 'Esta semana', count: 6, icon: Calendar03Icon },
        { label: 'Con pendientes', count: 3, icon: Clock01Icon },
      ],
      slot: 'Indicadores, filtros y la tabla, el tablero o el calendario.',
    },
  },
  {
    id: 'catalogo',
    title: 'Catálogo con filtros',
    summary: 'Muchos elementos para explorar: filtros rápidos arriba, cambio de vista y paginación al final.',
    icon: BookOpen01Icon,
    config: {
      ...BASE,
      crumbs: 'siblings',
      titleSize: 'md',
      secondary: false,
      under: 'tabs',
      tabIcons: true,
      tabMore: true,
      views: true,
      inner: 'chips',
      pagination: 'numbers',
      width: 'wide',
    },
    sample: {
      ...SAMPLE,
      crumbs: ['Inicio', 'Aprendizaje', 'Cursos'],
      siblings: ['Cursos', 'Planes de formación', 'Certificados', 'Rutas'],
      title: 'Cursos',
      short: 'Todo el contenido disponible para los colaboradores de Meta Colombia.',
      primary: 'Crear curso',
      tabs: [
        { label: 'Publicados', count: 128, icon: BookOpen01Icon },
        { label: 'Borradores', count: 9, icon: Note01Icon },
        { label: 'Certificables', count: 42, icon: Certificate01Icon },
        { label: 'Archivados', count: 15, icon: Folder01Icon },
      ],
      chips: [
        { label: 'Obligatorios', count: 18 },
        { label: 'Nuevos', count: 7 },
        { label: 'Con certificado', count: 42 },
      ],
      slot: 'Las tarjetas o la tabla de cursos que coinciden con los filtros.',
    },
  },
  {
    id: 'carpetas',
    title: 'Carpetas anidadas',
    summary: 'Muchos niveles de profundidad: las migas esconden los niveles del medio en «…» y el título es compacto.',
    icon: Folder01Icon,
    config: {
      ...BASE,
      crumbs: 'collapsed',
      crumbHome: true,
      separator: 'slash',
      titleSize: 'sm',
      media: 'icon',
      mediaSize: 'sm',
      titleAction: 'edit',
      description: 'none',
      secondary: true,
      more: true,
      pagination: 'numbers',
    },
    sample: {
      ...SAMPLE,
      crumbs: ['Inicio', 'Documentos', 'Gestión humana', 'Contratos', '2026'],
      title: 'Contratos 2026',
      icon: Folder01Icon,
      primary: 'Subir archivo',
      secondary: 'Nueva carpeta',
      secondaryIcon: undefined,
      slot: 'Los archivos y subcarpetas de esta carpeta.',
    },
  },
  {
    id: 'configuracion',
    title: 'Configuración',
    summary: 'Una página larga partida en secciones, con barra para guardar cuando hay cambios.',
    icon: Settings02Icon,
    example: '/design-system/navegacion/configuracion',
    config: { ...BASE, description: 'long', primary: false, secondary: false, inner: 'menu', footer: 'save' },
    sample: {
      ...SAMPLE,
      crumbs: ['Inicio', 'Configuración', 'Empresa'],
      siblings: ['Empresa', 'Usuarios', 'Facturación'],
      title: 'Configuración de la empresa',
      short: 'Datos, marca, accesos e integraciones de Meta Colombia en UBITS.',
      long: 'Datos, marca, accesos e integraciones de Meta Colombia en UBITS. Los cambios aplican para todos los colaboradores.',
      slot: 'Los campos de la sección elegida en el menú interno.',
    },
  },
  {
    id: 'menu',
    title: 'Menú del producto',
    summary: 'Un producto con muchas páginas: el menú va arriba, en vez de un tercer nivel en la barra lateral.',
    icon: Menu01Icon,
    example: '/design-system/navegacion/menu-horizontal',
    config: { ...BASE, kicker: true, primary: false, under: 'menu' },
    sample: {
      ...SAMPLE,
      crumbs: ['Inicio', 'Aprendizaje'],
      kicker: 'Producto',
      title: 'Aprendizaje',
      short: 'Cursos, planes de formación y certificados de Meta Colombia.',
      secondary: 'Ver como colaborador',
      secondaryIcon: undefined,
      slot: 'La página del producto que se eligió en el menú.',
    },
  },
  {
    id: 'documento',
    title: 'Documento con índice',
    summary: 'Una lectura larga: el índice acompaña y marca la sección que se está leyendo.',
    icon: File02Icon,
    example: '/design-system/navegacion/documento',
    config: { ...BASE, kicker: true, badge: true, meta: true, inner: 'toc' },
    sample: {
      ...SAMPLE,
      crumbs: ['Inicio', 'Avisos internos', 'Política de vacaciones 2026'],
      siblings: ['Política de vacaciones 2026', 'Reglamento interno', 'Código de conducta'],
      kicker: 'Política · Gestión humana',
      title: 'Política de vacaciones 2026',
      badge: 'Vigente',
      badgeVariant: 'success-light',
      short: 'Cómo se ganan, se piden y se aprueban las vacaciones en Meta Colombia.',
      meta: [
        { icon: UserIcon, text: 'Gestión humana' },
        { icon: Calendar03Icon, text: 'Actualizada el 1 sep' },
      ],
      primary: 'Confirmar lectura',
      primaryIcon: undefined,
      secondary: 'Descargar PDF',
      slot: 'El texto del documento, dividido en secciones.',
    },
  },
  {
    id: 'maestro',
    title: 'Maestro-detalle',
    summary: 'Revisar muchos registros seguidos: la lista a la izquierda y el elegido a la derecha.',
    icon: LayoutTwoColumnIcon,
    example: '/design-system/navegacion/maestro-detalle',
    config: { ...BASE, secondary: false, inner: 'list', width: 'full' },
    sample: {
      ...SAMPLE,
      crumbs: ['Inicio', 'Gestión humana', 'Solicitudes'],
      siblings: ['Solicitudes', 'Ausencias', 'Certificados'],
      title: 'Solicitudes',
      short: 'Vacaciones, permisos y certificados que esperan tu respuesta.',
      primary: 'Nueva solicitud',
      slot: 'El detalle de la solicitud elegida en la lista.',
    },
  },
  {
    id: 'pasos',
    title: 'Asistente por pasos',
    summary: 'Crear algo largo en partes, con avance visible y salida segura.',
    icon: WorkflowSquare10Icon,
    example: '/design-system/navegacion/pasos',
    config: { ...BASE, top: 'none', kicker: true, primary: false, steps: 'horizontal', footer: 'wizard', width: 'narrow' },
    sample: {
      ...SAMPLE,
      kicker: 'Planes de formación',
      title: 'Crear plan de formación',
      short: 'Paso 2 de 4 · Audiencia',
      long: 'Paso 2 de 4 · Audiencia. Puedes salir cuando quieras: el borrador queda guardado.',
      // Una sola salida a la derecha del título, como en Crear vacante (5-oct): contorno, icono de salir y este texto.
      secondary: 'Salir de la creación',
      secondaryIcon: Logout01Icon,
      slot: 'Los campos del paso actual.',
    },
  },
  {
    id: 'solicitud',
    title: 'Proceso con pasos al costado',
    summary:
      'Un trámite con pasos largos de explicar: los pasos van a la izquierda, con descripción, y se puede volver a uno anterior. La salida es «Salir de la creación», sin flecha junto al título.',
    icon: CheckmarkCircle02Icon,
    config: {
      ...BASE,
      // Es un asistente por pasos: sin flecha de volver junto al título (se leía como «paso anterior»).
      top: 'none',
      titleSize: 'sm',
      description: 'short',
      primary: false,
      secondary: true,
      steps: 'vertical',
      stepMarker: 'number',
      stepText: true,
      footer: 'wizard',
    },
    sample: {
      ...SAMPLE,
      crumbs: ['Inicio', 'Gestión humana', 'Solicitudes', 'Nueva solicitud'],
      back: 'Solicitudes',
      title: 'Solicitud de vacaciones',
      short: 'Completa los pasos; puedes salir y retomar cuando quieras.',
      secondary: 'Salir de la creación',
      secondaryIcon: Logout01Icon,
      slot: 'Los campos del paso actual.',
    },
  },
  {
    id: 'suite-ai',
    title: 'Resultado de Orbit',
    summary: 'Una página que armó el agente: se revisa, se ajusta y se aprueba. Botones en pastilla y orbe.',
    icon: ICONO_IA,
    example: '/design-system/navegacion/suite-ai',
    config: { ...BASE, kicker: true, media: 'orb', badge: true, ai: true },
    sample: {
      ...SAMPLE,
      crumbs: ['Inicio', 'Orbit', 'Resultado'],
      siblings: ['Resultado', 'Historial', 'Fuentes'],
      kicker: 'Generado por Orbit · hace 2 min',
      title: 'Plan de onboarding para operarios',
      badge: 'Por revisar',
      short: 'Seis semanas de inducción para el área operativa, armadas con la política vigente.',
      primary: 'Aprobar y publicar',
      primaryIcon: undefined,
      secondary: 'Pedir ajustes',
      secondaryIcon: undefined,
      slot: 'La propuesta del agente, sus fuentes y el historial de cambios.',
    },
  },
  {
    id: 'seleccion-masiva',
    title: 'Selección masiva',
    summary: 'Una lista donde se eligen varias filas: al marcarlas aparece abajo una barra con lo que se puede hacer con todas.',
    icon: CheckmarkSquare02Icon,
    example: '/design-system/navegacion/seleccion-masiva',
    config: { ...BASE, description: 'long', inner: 'chips' },
    sample: {
      ...SAMPLE,
      crumbs: ['Inicio', 'Personas', 'Colaboradores'],
      siblings: ['Colaboradores', 'Áreas', 'Cargos'],
      title: 'Colaboradores',
      short: 'Todas las personas de Meta Colombia, con su área, su cargo y su avance.',
      long: 'Todas las personas de Meta Colombia. Selecciona varias para asignarles cursos, escribirles o moverlas de grupo.',
      primary: 'Agregar colaborador',
      secondary: 'Importar',
      chips: [
        { label: 'Activas', count: 231 },
        { label: 'Sin área', count: 12 },
        { label: 'Invitadas', count: 5 },
      ],
      slot: 'La tabla con casilla en cada fila y la barra que aparece cuando hay filas marcadas.',
    },
  },
  {
    id: 'primer-uso',
    title: 'Sección sin datos todavía',
    summary: 'La primera vez que se entra a una sección: se explica para qué sirve, se dan los primeros pasos y se ofrecen atajos.',
    icon: Rocket01Icon,
    example: '/design-system/navegacion/primer-uso',
    config: { ...BASE, description: 'long' },
    sample: {
      ...SAMPLE,
      crumbs: ['Inicio', 'Desempeño y cultura', 'Evaluaciones 360'],
      siblings: ['Evaluaciones 360', 'Objetivos', 'Matriz de talento'],
      title: 'Evaluaciones 360',
      short: 'Recoge la mirada de jefes, pares y equipo sobre cada colaborador.',
      long: 'Recoge la mirada de jefes, pares y equipo sobre cada colaborador y conviértela en planes de desarrollo.',
      primary: 'Crear evaluación',
      secondary: 'Importar desde Excel',
      slot: 'El estado vacío con los primeros pasos y las preguntas frecuentes; cuando ya hay datos, la lista.',
    },
  },
]

// Etiqueta del contenedor: la misma que pone PageShell en su data-region.
export const CONTAINER_LABEL: Record<PageWidth, string> = {
  narrow: 'Contenedor · 720px',
  default: 'Contenedor · 1140px máx.',
  wide: 'Contenedor · 1600px máx.',
  full: 'Contenedor · ancho completo',
}

export const SLOT_NAME: Record<PageConfig['inner'], string> = {
  none: 'Contenido',
  menu: 'Sección',
  tabs: 'Sección',
  toc: 'Documento',
  list: 'Detalle del registro',
  chips: 'Resultados',
}

const PART_TEXT: Record<string, string> = {
  Contenedor: 'Ancho máximo de la página: 720px para formularios, 1140px por defecto y 1600px para datos densos.',
  'Migas de pan':
    'Van arriba, en la barra, pegadas al botón que abre y cierra el menú: nunca encima del título. Dicen dónde estás y dejan subir de nivel; salen solas del menú y la última es la página actual, que no es enlace. Si la pantalla está más adentro de lo que el menú conoce, se le pasan a «breadcrumbs» y la barra las muestra.',
  'Niveles ocultos': 'Cuando la ruta es muy larga, los niveles del medio se esconden en «…» y se abren en un menú.',
  Hermanos: 'Desplegable en la última miga para saltar a otra página del mismo nivel sin subir.',
  Volver:
    'En pantallas de detalle, junto al título: regresa a la lista de donde viniste. Acompaña a la miga de arriba, no la reemplaza. Nunca en un asistente por pasos: ahí la única salida es «Salir de la creación», a la derecha (en LMS Creator, BotonSalirCreacion: «Salir de la creación», «Volver a añadir página» o «Salir de la edición», según a dónde lleve).',
  'Barra superior': 'La pone el marco, no la pantalla: el botón que abre y cierra el menú, la miga de pan, el buscador y las acciones de la derecha. Se documenta en /design-system/header.',
  Imagen: 'Icono, avatar u orbe que identifica lo que estás viendo. Viene en tres tamaños.',
  Antetítulo: 'Palabra corta sobre el título que da contexto: producto, tipo u origen.',
  Título: 'El nombre de la pantalla o del registro. Siempre va, en tamaño grande, mediano o compacto.',
  Favorito: 'Estrella junto al título para guardar el registro en tus favoritos.',
  'Editar nombre': 'Lápiz junto al título para cambiarle el nombre sin abrir un formulario.',
  Estado: 'Insignia junto al título: abierta, vigente, por revisar…',
  Descripción: 'Una o dos líneas que explican para qué sirve la pantalla.',
  Metadatos: 'Datos cortos del registro: área, responsable, lugar, fechas.',
  Acciones: 'Grupo de botones en la fila del título, a la derecha. No bajan con la descripción: si no caben, saltan debajo del título.',
  'Anterior / siguiente': 'Pasa al registro de al lado sin volver a la lista. Puede decir en cuál vas («2 de 12»).',
  'Orbit Flow': 'Abre Orbit Flow sobre esta pantalla. Va al final de la fila de acciones, a la derecha del botón primario: completo por defecto; solo el orbe cuando la pantalla ya viene muy cargada.',
  'Más acciones':
    'Menú de tres puntos con lo que se usa poco. Va primero, a la izquierda de todos los botones, y su menú abre hacia la derecha: ⋯ · terciario · secundario · primario · IA y Orbit Flow.',
  'Botón secundario': 'Acción de apoyo, con contorno. Va antes del primario.',
  'Botón primario': 'La acción principal. Solo una; a su derecha solo van los botones de IA y Orbit Flow, siempre al final.',
  Pestañas:
    'Cambian entre grupos de la misma sección sin salir de la página. La maestra es la subrayada, pegada bajo el título; la pastilla gris queda para casos especiales. Pueden llevar icono y conteo.',
  'Más pestañas': 'Cuando no caben todas, las últimas se guardan en «Más».',
  'Menú del producto': 'Las páginas de un producto arriba, cuando el menú lateral ya no alcanza.',
  Submenú: 'Opción del menú que abre un panel con más páginas agrupadas.',
  'Cambio de vista': 'Muestra los mismos datos como tabla, tablero o calendario. No cambia de página.',
  Pasos: 'Muestran en qué parte de un proceso largo vas y cuánto falta.',
  'Menú interno': 'Las secciones de una página larga, a la izquierda del contenido.',
  'Pestañas verticales': 'Pestañas en columna al costado: para fichas con muchas secciones.',
  'Filtros rápidos':
    'Chips para acotar la lista con un clic (FiltroChip, el único chip de filtro del sistema), con cuántos resultados hay en cada uno. Sin ninguno puesto se ve todo; el puesto lleva su «x» para quitarlo.',
  Índice: 'Acompaña la lectura y marca sola la sección que está a la vista. Al tocar una, baja hasta ella.',
  Lista: 'Los registros a la izquierda; el elegido se abre al lado.',
  Paginación:
    'Al final del contenido, para pasar de página cuando hay muchos resultados. Es el paginador del sistema, el mismo de las tablas: filas por página, cuántos se ven y «Anterior / Siguiente».',
  'Barra de acciones':
    'Barra fija abajo para guardar cambios o avanzar de paso. En un asistente lleva a la izquierda el estado del guardado («Guardado», la pieza ChipGuardado, la misma en todos los flujos) y a la derecha «Atrás» con contorno y seguir. Sin «Cancelar»: la única salida es la de junto al título (regla de creación, 6-oct). En los flujos de LMS Creator a pantalla completa es la misma barra (BarraEditor), fija al pie del marco.',
  Pie: 'Lo pone el marco al final de cada pantalla: tecnología de UBITS y legales.',
  Slot: 'Todo lo que la pantalla necesite: tablas, tarjetas, formularios. No es parte del componente.',
}

// Partes visibles con la configuración actual, en el orden en que aparecen de arriba abajo.
export function pageParts(c: PageConfig): PartInfo[] {
  const names: string[] = []
  if (c.top === 'back') names.push('Volver')
  if (c.media !== 'none') names.push('Imagen')
  if (c.kicker) names.push('Antetítulo')
  names.push('Título')
  if (c.titleAction === 'favorite') names.push('Favorito')
  if (c.titleAction === 'edit') names.push('Editar nombre')
  if (c.badge) names.push('Estado')
  if (c.description !== 'none') names.push('Descripción')
  if (c.meta) names.push('Metadatos')
  if (c.records !== 'none' || c.modoIa !== 'none' || c.more || c.secondary || c.primary) names.push('Acciones')
  if (c.records !== 'none') names.push('Anterior / siguiente')
  if (c.modoIa !== 'none') names.push('Orbit Flow')
  if (c.more) names.push('Más acciones')
  if (c.secondary) names.push('Botón secundario')
  if (c.primary) names.push('Botón primario')
  if (c.under === 'tabs') names.push('Pestañas')
  if (c.under === 'tabs' && c.tabMore) names.push('Más pestañas')
  if (c.under === 'menu') names.push('Menú del producto')
  if (c.under === 'menu' && c.submenu) names.push('Submenú')
  if (c.views) names.push('Cambio de vista')
  if (c.steps !== 'none') names.push('Pasos')
  if (c.inner === 'chips') names.push('Filtros rápidos')
  if (c.inner === 'menu') names.push('Menú interno')
  if (c.inner === 'tabs') names.push('Pestañas verticales')
  if (c.inner === 'list') names.push('Lista')

  // La barra de arriba no es parte del marco de página (la pone el marco general), pero la miga se documenta aquí
  // porque es la que dice dónde está la pantalla.
  const parts: PartInfo[] = []
  if (c.crumbs !== 'off') {
    parts.push({ name: 'Barra superior', text: PART_TEXT['Barra superior'], slot: true })
    parts.push({ name: 'Migas de pan', text: PART_TEXT['Migas de pan'] })
    if (c.crumbs === 'collapsed') parts.push({ name: 'Niveles ocultos', text: PART_TEXT['Niveles ocultos'] })
    if (c.crumbs === 'siblings') parts.push({ name: 'Hermanos', text: PART_TEXT.Hermanos })
  }
  parts.push({ name: CONTAINER_LABEL[c.width], text: PART_TEXT.Contenedor })
  parts.push(...names.map((name) => ({ name, text: PART_TEXT[name] })))
  parts.push({ name: SLOT_NAME[c.inner], text: PART_TEXT.Slot, slot: true })
  if (c.inner === 'toc') parts.push({ name: 'Índice', text: PART_TEXT['Índice'] })
  if (c.pagination !== 'none') parts.push({ name: 'Paginación', text: PART_TEXT['Paginación'] })
  if (c.footer === 'save' || c.footer === 'wizard') parts.push({ name: 'Barra de acciones', text: PART_TEXT['Barra de acciones'] })
  if (c.footer === 'legal') parts.push({ name: 'Pie', text: PART_TEXT.Pie })
  return parts
}
