import type { IconSvgElement } from '@hugeicons/react'
import {
  Album02Icon,
  Analytics01Icon,
  BookOpen01Icon,
  BookOpen02Icon,
  Briefcase06Icon,
  BubbleChatIcon,
  Certificate01Icon,
  ChartIncreaseIcon,
  CircleLock01Icon,
  Comment01Icon,
  Cursor01Icon,
  DashboardSquare01Icon,
  Download04Icon,
  File02Icon,
  Folder01Icon,
  GitMergeIcon,
  GridViewIcon,
  Home02Icon,
  CheckmarkBadge01Icon,
  Layout01Icon,
  LayoutTable01Icon,
  LibraryIcon,
  Loading03Icon,
  LookTopIcon,
  MarketingIcon,
  Mortarboard02Icon,
  Navigation03Icon,
  Note05Icon,
  Notification03Icon,
  PaintBoardIcon,
  PaletteIcon,
  Plant02Icon,
  Rocket01Icon,
  Route01Icon,
  RulerIcon,
  ScrollTextIcon,
  Settings02Icon,
  SidebarLeftIcon,
  SidebarRightIcon,
  StethoscopeIcon,
  StudyDeskIcon,
  Target02Icon,
  TaskDone01Icon,
  TextFontIcon,
  TextSelectionIcon,
  UniversityIcon,
  UserGroupIcon,
  UserMultipleIcon,
  Wallet01Icon,
} from '@hugeicons/core-free-icons'

// El orbe de la IA en el menú (decisión 8 de la auditoría, 5-oct: nada de varitas ni estrellas para marcar la IA). El
// menú pinta iconos de Hugeicons y el orbe no lo es: esta es solo una marca. Donde la barra lateral, el riel o el
// buscador la encuentran, dibujan el `Orb`. El círculo de trazo solo se vería en una pieza que no la reconozca.
export const ICONO_IA: IconSvgElement = [['circle', { cx: 12, cy: 12, r: 9, stroke: 'currentColor', strokeWidth: 1.5, key: 'orbe' }]]

// Estado de una conversación de Suite AI (punto junto al título): leída, con respuesta sin leer o el agente pensando.
export type ChatStatus = 'read' | 'unread' | 'thinking'

export type NavLeaf = {
  title: string
  path: string
  icon?: IconSvgElement
  status?: ChatStatus
  // Bajada corta (para qué sirve), se muestra en el panel de una sección con tercer nivel.
  description?: string
  // Etiqueta junto al nombre, como el «Nuevo» de Selección. Hoy solo «Próximamente» (pantallas sin maquetar).
  badge?: string
}

// La etiqueta de las pantallas que todavía no están maquetadas (regla «pantallas-pendientes», 13-oct): abren
// PantallaProximamente. Va en el menú del producto; las plantillas del design system tienen sus propias pantallas.
const PROXIMAMENTE = 'Próximamente'

// Segundo nivel del menú: se despliega bajo su producto. Si tiene páginas propias (tercer nivel,
// p. ej. LMS Creator › Contenidos), en la barra abre su propio panel con «volver», como Vercel.
export type NavChild = NavLeaf & {
  children?: NavLeaf[]
}

export type NavItem = {
  title: string
  path: string
  icon: IconSvgElement
  badge?: string
  // Dato corto a la derecha de la fila (p. ej. la hora de una conversación).
  meta?: string
  status?: ChatStatus
  children?: NavChild[]
}

export type NavGroup = {
  label: string
  items: NavItem[]
}

// Las dos «plantilla-*» son las plantillas del design system (Home operativo, Gestión de usuarios, Planes,
// Encuestas y Colaborador): usan este mismo marco con el menú del admin o del colaborador apuntando a ellas.
export type SectionId =
  | 'portal-colaborador'
  | 'admin'
  | 'suite-ai'
  | 'design-system'
  | 'design-system-ai'
  | 'plantilla-admin'
  | 'plantilla-colaborador'

export type SidebarNav = {
  home: { title: string; path: string; icon: IconSvgElement }
  groups: NavGroup[]
  // Solo para secciones que no cuelgan de la raíz (las plantillas): desde dónde se arman las migas.
  base?: string
}

const navsBase: Record<Exclude<SectionId, 'plantilla-admin' | 'plantilla-colaborador' | 'design-system-ai'>, SidebarNav> = {
  'portal-colaborador': {
    home: { title: 'Inicio', path: '/portal-colaborador', icon: Home02Icon },
    groups: [
      {
        label: 'Productos',
        items: [
          {
            title: 'Aprendizaje',
            path: '/portal-colaborador/aprendizaje',
            icon: Mortarboard02Icon,
            children: [
              { title: 'Modo estudio AI', path: '/portal-colaborador/aprendizaje/modo-estudio-ai', icon: ICONO_IA, badge: PROXIMAMENTE },
              { title: 'Catálogo', path: '/portal-colaborador/aprendizaje/catalogo', icon: LibraryIcon, badge: PROXIMAMENTE },
              { title: 'Universidad corporativa', path: '/portal-colaborador/aprendizaje/universidad-corporativa', icon: UniversityIcon },
              { title: 'Zona de estudio', path: '/portal-colaborador/aprendizaje/zona-de-estudio', icon: StudyDeskIcon },
              { title: 'Progreso', path: '/portal-colaborador/aprendizaje/progreso', icon: ChartIncreaseIcon },
              { title: 'Métricas', path: '/portal-colaborador/aprendizaje/metricas', icon: Analytics01Icon, badge: PROXIMAMENTE },
              { title: 'Diagnóstico', path: '/portal-colaborador/aprendizaje/diagnostico', icon: StethoscopeIcon, badge: PROXIMAMENTE },
            ],
          },
          {
            title: 'Desempeño y cultura',
            path: '/portal-colaborador/desempeno-cultura',
            icon: Analytics01Icon,
            // Las cuatro pantallas están sin maquetar: el producto entero espera.
            badge: PROXIMAMENTE,
            children: [
              { title: 'Evaluaciones 360', path: '/portal-colaborador/desempeno-cultura/evaluaciones-360', icon: UserMultipleIcon, badge: PROXIMAMENTE },
              { title: 'Objetivos', path: '/portal-colaborador/desempeno-cultura/objetivos', icon: Target02Icon, badge: PROXIMAMENTE },
              { title: 'Matriz de talento', path: '/portal-colaborador/desempeno-cultura/matriz-de-talento', icon: GridViewIcon, badge: PROXIMAMENTE },
              { title: 'Encuestas', path: '/portal-colaborador/desempeno-cultura/encuestas', icon: Comment01Icon, badge: PROXIMAMENTE },
            ],
          },
        ],
      },
      {
        label: 'Herramientas',
        items: [{ title: 'Tareas', path: '/portal-colaborador/tareas', icon: Note05Icon, badge: PROXIMAMENTE }],
      },
    ],
  },
  'suite-ai': {
    home: { title: 'Nuevo chat', path: '/suite-ai', icon: ICONO_IA },
    // Historial en una sola lista, sin separar por fecha. Las filas no llevan icono: cada una muestra su estado con un
    // punto (ver ChatStatusDot). Ejemplo: el agente trabaja en vacaciones y hay dos respuestas sin leer.
    groups: [
      {
        // Sin título: la lista va directo bajo «Nueva conversación».
        label: '',
        items: [
          { title: 'Política de vacaciones', path: '/suite-ai/chat/vacaciones', icon: BubbleChatIcon, meta: 'Hoy, 9:40', status: 'thinking' },
          { title: 'Evaluaciones vencidas en Ventas', path: '/suite-ai/chat/evaluaciones', icon: BubbleChatIcon, meta: 'Hoy, 9:12', status: 'unread' },
          { title: 'Plan de onboarding para operarios', path: '/suite-ai/chat/onboarding', icon: BubbleChatIcon, meta: 'Ayer, 16:20', status: 'read' },
          { title: 'Riesgo de rotación Q3', path: '/suite-ai/chat/libre', icon: BubbleChatIcon, meta: 'Ayer, 11:05', status: 'unread' },
          { title: 'Resumen encuesta de clima', path: '/suite-ai/chat/clima', icon: BubbleChatIcon, meta: 'Viernes 11 sep', status: 'read' },
          { title: 'Cursos con baja satisfacción', path: '/suite-ai/chat/cursos', icon: BubbleChatIcon, meta: 'Viernes 11 sep', status: 'read' },
          { title: 'Matriz de talento de liderazgo', path: '/suite-ai/chat/matriz', icon: BubbleChatIcon, meta: 'Lunes 7 sep', status: 'read' },
        ],
      },
    ],
  },
  admin: {
    home: { title: 'Inicio', path: '/admin', icon: Home02Icon },
    groups: [
      {
        label: 'Productos',
        items: [
          {
            title: 'Selección',
            path: '/admin/seleccion',
            icon: Briefcase06Icon,
            badge: 'Nuevo',
            children: [
              // «Onboarding» salió del menú el 7 oct (Nicolás). El 8 oct «Dashboard» pasó a ser «AI Insights» y el 16 oct
              // «Orbit Data» (VP de producto: «AI Insights no es la palabra… que tú puedas hablar con tu data»): una
              // conversación con Orbit que arma los tableros que se le pidan. Las direcciones viejas llevan a ella.
              { title: 'Orbit Data', path: '/admin/seleccion/orbit-data', icon: DashboardSquare01Icon },
              // La exploración elegida del recorrido completo (30 sep). El 1 oct Nicolás dejó solo esta: se borraron la 2 y la
              // 3 (con sus «Candidatos») y salió del menú la «Vacantes» de Elkin (su pantalla sigue en `/admin/seleccion/vacantes`
              // y la 1 usa su creación por dentro). Desde el 27 sep, como en el producto, «Vacantes» y «Mis candidatos» son dos
              // entradas del menú. Desde la reunión con Elkin (29 sep) la 1 ya no es una bandeja: el inicio de Elkin
              // reorganizado y, dentro de cada vacante, el tablero.
              // Desde el 1 oct se llama solo «Vacantes» (Nicolás: «no se debe llamar vacantes 1 elegida»).
              { title: 'Vacantes', path: '/admin/seleccion/exploraciones/uno', icon: CheckmarkBadge01Icon },
              // «Mis candidatos» es la opción 2 (la tabla de toda la base) desde el 1 oct; la 1 y la 3 se borraron.
              { title: 'Mis candidatos', path: '/admin/seleccion/candidatos/dos', icon: UserGroupIcon },
              // Los créditos de IA (25 sep): saldo e historial. Eran tres exploraciones; el 1 oct Nicolás dejó la 1 y la
              // llamó solo «Créditos».
              { title: 'Créditos', path: '/admin/seleccion/creditos/uno', icon: Wallet01Icon },
            ],
          },
          {
            title: 'Aprendizaje',
            path: '/admin/aprendizaje',
            icon: Mortarboard02Icon,
            children: [
              {
                title: 'LMS Creator',
                path: '/admin/aprendizaje/lms-creator',
                icon: BookOpen02Icon,
                description: 'Crea y organiza tus cursos',
                children: [
                  { title: 'Contenidos', path: '/admin/aprendizaje/lms-creator/contenidos', icon: BookOpen01Icon },
                  { title: 'Categorías', path: '/admin/aprendizaje/lms-creator/categorias', icon: Folder01Icon, badge: PROXIMAMENTE },
                  { title: 'Universidad corporativa', path: '/admin/aprendizaje/lms-creator/universidad-corporativa', icon: UniversityIcon, badge: PROXIMAMENTE },
                  { title: 'LMS AI', path: '/admin/aprendizaje/lms-creator/lms-ai', icon: ICONO_IA, badge: PROXIMAMENTE },
                ],
              },
              {
                title: 'Planes de formación',
                path: '/admin/aprendizaje/planes-de-formacion',
                icon: Route01Icon,
                description: 'Rutas por cargo y grupos',
                children: [
                  { title: 'Planes', path: '/admin/aprendizaje/planes-de-formacion/planes', icon: Route01Icon },
                  { title: 'Grupos', path: '/admin/aprendizaje/planes-de-formacion/grupos', icon: UserGroupIcon },
                ],
              },
              {
                title: 'Certificados',
                path: '/admin/aprendizaje/certificados',
                icon: Certificate01Icon,
                description: 'Emite y descarga certificados',
                children: [
                  { title: 'Descarga', path: '/admin/aprendizaje/certificados/descarga', icon: Download04Icon },
                  { title: 'Configuración', path: '/admin/aprendizaje/certificados/configuracion', icon: Settings02Icon, badge: PROXIMAMENTE },
                ],
              },
              { title: 'Diagnóstico', path: '/admin/aprendizaje/diagnostico', icon: StethoscopeIcon },
              { title: 'Reportes', path: '/admin/aprendizaje/reportes', icon: File02Icon, badge: PROXIMAMENTE },
              { title: 'Métricas', path: '/admin/aprendizaje/metricas', icon: Analytics01Icon, badge: PROXIMAMENTE },
            ],
          },
          {
            title: 'Desempeño y cultura',
            path: '/admin/desempeno-cultura',
            icon: Analytics01Icon,
            children: [
              { title: 'Evaluaciones 360', path: '/admin/desempeno-cultura/evaluaciones-360', icon: UserMultipleIcon, badge: PROXIMAMENTE },
              { title: 'Objetivos', path: '/admin/desempeno-cultura/objetivos', icon: Target02Icon },
              { title: 'Matriz de talento', path: '/admin/desempeno-cultura/matriz-de-talento', icon: GridViewIcon, badge: PROXIMAMENTE },
              { title: 'PDI', path: '/admin/desempeno-cultura/pdi', icon: Plant02Icon, badge: PROXIMAMENTE },
              { title: 'Encuestas', path: '/admin/desempeno-cultura/encuestas', icon: Comment01Icon },
            ],
          },
        ],
      },
      {
        label: 'Herramientas',
        items: [
          { title: 'Tareas', path: '/admin/tareas', icon: Note05Icon },
          { title: 'Avisos internos', path: '/admin/avisos-internos', icon: MarketingIcon },
        ],
      },
    ],
  },
  'design-system': {
    home: { title: 'Inicio', path: '/design-system', icon: Home02Icon },
    // Ordenado por lo que se busca (7-oct, Cristian; reordenado el 13-oct): cómo arrancar, las bases, las piezas sueltas
    // (Componentes, con «Todos los componentes» primero), las piezas combinadas para armar una pantalla (Patrones), las
    // pantallas completas y la revisión pendiente. El grupo de cada página es el mismo que dice su antetítulo. Flux tal
    // cual, las reglas globales, lo del dev de flux y las fichas viven dentro de «Todos los componentes»; el Grafo, dentro
    // de «Trabajar con la IA»; la IA, en la pestaña Orbit.
    groups: [
      {
        label: 'Empezar',
        items: [
          { title: 'Manifiesto', path: '/design-system/manifiesto', icon: ScrollTextIcon },
          { title: 'Cómo usar el sistema', path: '/design-system/get-started', icon: Rocket01Icon },
          { title: 'Trabajar con la IA', path: '/design-system/trabajar-con-ia', icon: ICONO_IA },
        ],
      },
      {
        label: 'Fundamentos',
        items: [
          { title: 'Color', path: '/design-system/color', icon: PaletteIcon },
          { title: 'Tipografía', path: '/design-system/tipografia', icon: TextFontIcon },
          { title: 'Espacio y esquinas', path: '/design-system/espacio', icon: RulerIcon },
          { title: 'Iconos', path: '/design-system/icons', icon: PaintBoardIcon },
        ],
      },
      {
        label: 'Componentes',
        items: [
          { title: 'Todos los componentes', path: '/design-system/componentes', icon: Album02Icon },
          { title: 'Botones', path: '/design-system/botones', icon: Cursor01Icon },
          { title: 'Ventanas', path: '/design-system/modales', icon: Layout01Icon },
          { title: 'Paneles laterales', path: '/design-system/drawers', icon: SidebarRightIcon },
          { title: 'Tablas', path: '/design-system/data-grid', icon: LayoutTable01Icon },
          { title: 'Métricas', path: '/design-system/metricas', icon: Analytics01Icon },
        ],
      },
      {
        label: 'Patrones',
        items: [
          { title: 'Marco', path: '/design-system/marco', icon: SidebarLeftIcon },
          { title: 'Estructura de página', path: '/design-system/navegacion', icon: Navigation03Icon },
          { title: 'Formularios', path: '/design-system/formularios', icon: TaskDone01Icon },
          { title: 'Estados y avisos', path: '/design-system/estados', icon: Notification03Icon },
        ],
      },
      {
        label: 'Pantallas',
        items: [
          { title: 'Todas las pantallas', path: '/design-system/templates', icon: Album02Icon },
          {
            // «Admin» y «Archivo» solo agrupan: en la barra se despliegan y no tienen página propia.
            title: 'Admin',
            path: '/design-system/templates/admin',
            icon: DashboardSquare01Icon,
            children: [
              { title: 'Home operativo', path: '/design-system/templates/home-operativo', icon: Home02Icon },
              { title: 'Gestión de usuarios', path: '/design-system/templates/gestion-usuarios', icon: UserMultipleIcon },
              { title: 'Planes de formación', path: '/design-system/templates/planes-formacion', icon: Route01Icon },
              { title: 'Encuestas', path: '/design-system/templates/encuestas', icon: Comment01Icon },
            ],
          },
          // «En el producto» (Tareas, Avisos internos, vacante, Configuración) salió del menú el 13-oct: llevaba a /admin y
          // cambiaba el menú sin avisar. Sigue en «Todas las pantallas», que dice que esas se abren en el producto.
          { title: 'Colaborador', path: '/design-system/templates/colaborador', icon: Mortarboard02Icon },
          { title: 'Inicio de sesión', path: '/design-system/templates/auth', icon: CircleLock01Icon },
          // Los errores de sistema y la carga ocupando la pantalla entera, cada uno en su dirección:
          // la documentación de esos estados está en Patrones › Estados y avisos.
          { title: 'Estados a pantalla completa', path: '/design-system/templates/estados', icon: Loading03Icon },
          // «Archivo» (Dashboard, Dashboard RR.HH., App shell 2 y 3, Shell test) salió del menú el 22 sep: son marcos
          // viejos con su header de entonces y se leían como vigentes. Siguen en «Todas las pantallas», como archivo.
        ],
      },
      {
        label: 'Por revisar',
        items: [
          // Una sola entrada desde el 13-oct: sus partes son las pestañas de la página.
          { title: 'Unificación', path: '/design-system/unificacion', icon: GitMergeIcon },
        ],
      },
    ],
  },
}

// ── Plantillas del design system ──────────────────────────────────────────────────────────────────
// Copian el menú del admin y del colaborador: cada entrada lleva a la pantalla de la plantilla si existe
// y, si no, a su página «pendiente». Así, si cambia el menú del producto, las plantillas lo siguen solas.

const PLANTILLAS = '/design-system/templates'
const PLANTILLA_HOME = `${PLANTILLAS}/home-operativo`
const PLANTILLA_USUARIOS = `${PLANTILLAS}/gestion-usuarios`
const PLANTILLA_PLANES = `${PLANTILLAS}/planes-formacion`
const PLANTILLA_ENCUESTAS = `${PLANTILLAS}/encuestas`
const PLANTILLA_COLABORADOR = `${PLANTILLAS}/colaborador`

// Las pantallas propias; el resto cae en la página «pendiente» del Home con el nombre que usa la plantilla.
const PROPIAS_ADMIN: Record<string, string> = {
  '/admin': PLANTILLA_HOME,
  // La sección con tercer nivel también apunta a la pantalla: así la barra abre su panel y marca «Planes».
  '/admin/aprendizaje/planes-de-formacion': PLANTILLA_PLANES,
  '/admin/aprendizaje/planes-de-formacion/planes': PLANTILLA_PLANES,
  '/admin/desempeno-cultura/encuestas': PLANTILLA_ENCUESTAS,
  // Pantallas que ya existen en el producto: la plantilla lleva a ellas en vez de a «pendiente».
  '/admin/tareas': '/admin/tareas',
  '/admin/avisos-internos': '/admin/avisos-internos',
  '/admin/seleccion/vacantes': '/admin/seleccion/vacantes',
}
const NOMBRE_EN_PLANTILLA: Record<string, string> = {
  dashboard: 'dashboard-seleccion',
  'ai-insights': 'dashboard-seleccion',
  'tus-datos': 'dashboard-seleccion',
  'orbit-data': 'dashboard-seleccion',
  descarga: 'descarga-certificados',
  configuracion: 'configuracion-certificados',
}
const ultimo = (path: string) => path.split('/').filter(Boolean).at(-1) ?? ''
const rutaPlantillaAdmin = (path: string) =>
  PROPIAS_ADMIN[path] ?? `${PLANTILLA_HOME}/${NOMBRE_EN_PLANTILLA[ultimo(path)] ?? ultimo(path)}`
const rutaPlantillaColaborador = (path: string) =>
  path === '/portal-colaborador' ? PLANTILLA_COLABORADOR : `${PLANTILLA_COLABORADOR}/${ultimo(path)}`

function comoPlantilla(nav: SidebarNav, ruta: (path: string) => string, extra: NavGroup[]): SidebarNav {
  // «Próximamente» es del producto: en las plantillas cada entrada lleva a su pantalla de ejemplo, así que no se copia.
  const sinProximamente = (badge: string | undefined) => (badge === PROXIMAMENTE ? undefined : badge)
  const hoja = (leaf: NavLeaf): NavLeaf => ({ ...leaf, path: ruta(leaf.path), badge: sinProximamente(leaf.badge) })
  return {
    base: PLANTILLAS,
    home: { ...nav.home, path: ruta(nav.home.path) },
    groups: [
      ...nav.groups.map((group) => ({
        ...group,
        items: group.items.map((item) => ({
          ...item,
          path: ruta(item.path),
          badge: sinProximamente(item.badge),
          children: item.children?.map((child) => ({ ...hoja(child), children: child.children?.map(hoja) })),
        })),
      })),
      ...extra,
    ],
  }
}

// Configuración no va en la barra lateral: vive en el menú de empresa, como en el producto real
// (revisión del 2026-09-15). Estas son sus pantallas dentro de las plantillas.
export const CONFIGURACION_EMPRESA: Record<string, string> = {
  'Gestión de usuarios': PLANTILLA_USUARIOS,
  Personalización: '/admin/configuracion/personalizacion',
  Organigrama: `${PLANTILLA_HOME}/organigrama`,
  'Datos de empresa': '/admin/configuracion/datos-empresa',
  'Roles y permisos': `${PLANTILLA_HOME}/roles-y-permisos`,
}

// Las mismas opciones en el admin: solo las que ya tienen pantalla.
export const CONFIGURACION_ADMIN: Record<string, string> = {
  'Gestión de usuarios': PLANTILLA_USUARIOS,
  Personalización: '/admin/configuracion/personalizacion',
  'Datos de empresa': '/admin/configuracion/datos-empresa',
}

// ── Exploraciones fuera del menú ─────────────────────────────────────────────────────────────────────────────────
//
// Las exploraciones —las tres de Contenidos— no salen en la barra lateral: el menú enseña solo pantallas de producto.
// **No se borran**: siguen escritas arriba, con su comentario de quién las hizo y cuándo, se llega a ellas por URL y
// conservan su nombre en las migas. Selección no entra aquí: su menú (Vacantes, Mis candidatos y
// Créditos) se queda a la vista como lo dejó Nicolás (1 oct, al traer staging: «déjame selección como está»).
// 13-oct (I-402): las tres de Contenidos se quitaron (no tenían ruta); queda el mecanismo para la próxima exploración.
const EXPLORACIONES = new Set<string>([])

const enElMenu = (path: string) => !EXPLORACIONES.has(path)

function sinExploraciones(nav: SidebarNav): SidebarNav {
  return {
    ...nav,
    groups: nav.groups
      .map((group) => ({
        ...group,
        items: group.items
          .filter((item) => enElMenu(item.path))
          .map((item) => ({
            ...item,
            children: item.children
              ?.filter((child) => enElMenu(child.path))
              .map((child) => ({ ...child, children: child.children?.filter((leaf) => enElMenu(leaf.path)) })),
          })),
      }))
      .filter((group) => group.items.length > 0),
  }
}

const navs = Object.fromEntries(Object.entries(navsBase).map(([id, nav]) => [id, sinExploraciones(nav)])) as typeof navsBase

export const sidebarNavs: Record<SectionId, SidebarNav> = {
  ...navs,
  // Sin grupos extra: el menú de la plantilla se ve igual al del producto.
  // Sistema de diseño de la IA: se ve al pasar a «Suite AI» estando en el design system. Reúne lo que en el
  // producto dice «esto lo hace la IA»: piezas (una por pestaña de /design-system/ia), interacciones y pantallas.
  'design-system-ai': {
    home: { title: 'Inicio', path: '/design-system/ia', icon: Home02Icon },
    // Las migas se cuentan desde /design-system: el agente contextual no cuelga de /design-system/ia.
    base: '/design-system',
    groups: [
      {
        label: 'Piezas',
        items: [
          { title: 'Botones de IA', path: '/design-system/ia/botones', icon: ICONO_IA },
          { title: 'Superficies', path: '/design-system/ia/superficies', icon: Layout01Icon },
          { title: 'Tarjeta de IA', path: '/design-system/tarjeta-ia', icon: DashboardSquare01Icon },
          { title: 'Estados', path: '/design-system/ia/estados', icon: Loading03Icon },
          { title: 'Vocabulario', path: '/design-system/ia/vocabulario', icon: TextSelectionIcon },
          { title: 'Por resolver', path: '/design-system/ia/pendientes', icon: TaskDone01Icon },
        ],
      },
      {
        label: 'Interacciones',
        items: [
          {
            title: 'Chat',
            path: '/design-system/suite-ai-chat',
            icon: BubbleChatIcon,
          },
          {
            title: 'Orbit',
            path: '/design-system/agente-contextual/configurador',
            icon: ICONO_IA,
          },
        ],
      },
    ],
  },
  'plantilla-admin': comoPlantilla(navs.admin, rutaPlantillaAdmin, []),
  'plantilla-colaborador': comoPlantilla(navs['portal-colaborador'], rutaPlantillaColaborador, []),
}

// Qué plantilla corresponde a una dirección (antes de mirar el primer tramo).
const SECCION_PLANTILLA: [string, SectionId][] = [
  [PLANTILLA_HOME, 'plantilla-admin'],
  [PLANTILLA_USUARIOS, 'plantilla-admin'],
  [PLANTILLA_PLANES, 'plantilla-admin'],
  [PLANTILLA_ENCUESTAS, 'plantilla-admin'],
  [PLANTILLA_COLABORADOR, 'plantilla-colaborador'],
  // El design system de la IA (pestaña Suite AI estando en el design system).
  ['/design-system/ia', 'design-system-ai'],
  ['/design-system/tarjeta-ia', 'design-system-ai'],
  ['/design-system/suite-ai-chat', 'design-system-ai'],
  ['/design-system/agente-contextual', 'design-system-ai'],
  ['/design-system/templates/suite-ai', 'design-system-ai'],
  ['/design-system/templates/home-suite-ai', 'design-system-ai'],
]

export const feedbackItem = { title: 'Feedback', icon: LookTopIcon }

export type Crumb = {
  label: string
  path?: string
}

function buildPathLabels() {
  const entries: [string, string][] = []

  for (const nav of Object.values(sidebarNavs)) {
    entries.push([nav.home.path, nav.home.title])
    for (const group of nav.groups) {
      for (const item of group.items) {
        entries.push([item.path, item.title])
        for (const child of item.children ?? []) {
          // Un hijo que repite la ruta del padre («Todos los patrones») no le cambia el nombre en las migas.
          if (child.path !== item.path) entries.push([child.path, child.title])
          for (const leaf of child.children ?? []) {
            entries.push([leaf.path, leaf.title])
          }
        }
      }
    }
  }

  return new Map(entries)
}

// Pantallas que no están en la barra lateral pero sí tienen nombre propio en las migas.
const NOMBRES_SIN_MENU: [string, string][] = [
  ['/design-system/grafo', 'Grafo'],
  ['/design-system/unificacion/fundamentos', 'Fundamentos por revisar'],
  ['/design-system/unificacion/componentes', 'Componentes'],
  ['/design-system/unificacion/iconos', 'Iconos'],
  ['/design-system/unificacion/marcos', 'Marcos y espaciado'],
  ['/design-system/unificacion/check', 'Qué no revisa el check'],
  ['/design-system/unificacion/pendientes', 'Pendientes de otras personas'],
  ['/design-system/marco/barra-lateral', 'Barra lateral'],
  ['/design-system/marco/header', 'Header'],
  ['/design-system/marco/capturas', 'Piezas en vivo'],
  ['/design-system/marco/medidas', 'Medidas'],
  ['/design-system/marco/pendientes', 'Pendientes'],
  ['/design-system/componentes/customizados', 'Customizados'],
  ['/design-system/componentes/flux', 'Flux tal cual'],
  ['/design-system/componentes/reglas', 'Reglas globales'],
  ['/design-system/componentes/dev', 'Para el dev de flux'],
  // Las fichas no tienen índice propio: la miga lleva a la lista, que abre en Customizados.
  ['/design-system/componentes/ficha', 'Todos los componentes'],
  ['/admin/configuracion', 'Configuración'],
  ['/admin/configuracion/datos-empresa', 'Datos de empresa'],
  ['/admin/configuracion/personalizacion', 'Personalización'],
  ['/admin/avisos-internos/crear', 'Nuevo aviso'],
  ['/admin/aprendizaje/diagnostico/crear', 'Crear assessment'],
  ['/admin/desempeno-cultura/objetivos/crear', 'Crear ciclo'],
  // El editor de un contenido: cuelga de LMS Creator › Contenidos, que sí está en el menú.
  ['/admin/aprendizaje/lms-creator/contenidos/onboarding-operativo', 'Onboarding operativo'],
  // Las vacantes de ejemplo con detalle: su nombre gana al del acceso «Detalle de vacante» del design system.
  ['/admin/seleccion/vacantes/analista-de-datos', 'Analista de datos'],
  ['/admin/seleccion/vacantes/disenadora-de-producto', 'Diseñadora de producto'],
  ['/admin/seleccion/vacantes/coordinador-de-turno', 'Coordinador de turno'],
  ['/admin/seleccion/vacantes/ejecutivo-comercial', 'Ejecutivo(a) comercial'],
]

// Las exploraciones ya no están en `sidebarNavs`, así que sus nombres para las migas se leen del menú sin filtrar.
function nombresDeExploraciones(): [string, string][] {
  const entries: [string, string][] = []
  for (const nav of Object.values(navsBase)) {
    for (const group of nav.groups) {
      for (const item of group.items) {
        for (const child of item.children ?? []) {
          if (EXPLORACIONES.has(child.path)) entries.push([child.path, child.title])
          for (const leaf of child.children ?? []) {
            if (EXPLORACIONES.has(leaf.path)) entries.push([leaf.path, leaf.title])
          }
        }
      }
    }
  }
  return entries
}

const pathLabels = new Map([...buildPathLabels(), ...nombresDeExploraciones(), ...NOMBRES_SIN_MENU])

export function getSectionId(pathname: string): SectionId | null {
  const plantilla = SECCION_PLANTILLA.find(([prefijo]) => pathname === prefijo || pathname.startsWith(`${prefijo}/`))
  if (plantilla) return plantilla[1]

  const [, segment] = pathname.split('/')

  if (
    segment === 'portal-colaborador' ||
    segment === 'admin' ||
    segment === 'suite-ai' ||
    segment === 'design-system'
  ) {
    return segment
  }

  return null
}

export function getBreadcrumbs(pathname: string): Crumb[] {
  const section = getSectionId(pathname)

  if (!section) {
    return []
  }

  const nav = sidebarNavs[section]
  const home = nav.home
  const crumbs: Crumb[] = [{ label: home.title, path: home.path }]

  if (pathname === home.path) {
    return [{ label: home.title }]
  }

  // Las migas se arman tramo a tramo desde la raíz de la sección (o desde `base` en las plantillas, que
  // cuelgan de /design-system/templates); el tramo que coincide con el inicio no se repite.
  const base = nav.base ?? home.path
  const paths: string[] = []
  let acc = base
  for (const segment of pathname.slice(base.length).split('/').filter(Boolean)) {
    acc += `/${segment}`
    // En las plantillas, los tramos que no están en el menú (ids, «crear») no se muestran: cada plantilla
    // arma sus propias migas y la barra superior queda con el nombre de la sección («Planes», no «P 01»).
    if (acc !== home.path && (!nav.base || pathLabels.has(acc))) paths.push(acc)
  }

  // Los tramos intermedios que no son una pantalla del menú no se muestran: en el chat de Suite AI salía
  // «Nuevo chat › Chat › Política de vacaciones», y ese «Chat» no lleva a ninguna parte (18 sep).
  const visibles = paths.filter((acc, index) => index === paths.length - 1 || pathLabels.has(acc))

  for (const [index, acc] of visibles.entries()) {
    const segment = acc.split('/').at(-1) ?? ''
    const isLast = index === visibles.length - 1
    const label =
      pathLabels.get(acc) ??
      // Mayúscula solo al inicio, como el resto de la interfaz («Analista de datos», no «Analista De Datos»).
      segment.replace(/-/g, ' ').replace(/^\w/, (char) => char.toUpperCase())

    crumbs.push({
      label,
      path: isLast || !pathLabels.has(acc) ? undefined : acc,
    })
  }

  return crumbs
}

// Entradas del menú que tienen pantallas hijas sin entrada propia (detalle, editor): siguen marcadas dentro de ellas.
const CON_SUBPAGINAS = new Set([
  // Dentro del constructor de ciclos (crear y editar), «Objetivos» sigue marcado.
  '/admin/desempeno-cultura/objetivos',
  '/admin/tareas',
  '/admin/avisos-internos',
  '/admin/seleccion/vacantes',
  // La lista de vacantes es un recorrido: dentro de una vacante, su entrada sigue marcada.
  '/admin/seleccion/exploraciones/uno',
  '/admin/aprendizaje/lms-creator/contenidos',
  // Crear, editar y los resultados de una encuesta siguen marcando «Encuestas».
  '/admin/desempeno-cultura/encuestas',
])

export function isPathActive(pathname: string, path: string, end = false) {
  if (end && CON_SUBPAGINAS.has(path)) {
    return pathname === path || pathname.startsWith(`${path}/`)
  }

  if (end || path === '/') {
    return pathname === path
  }

  return pathname === path || pathname.startsWith(`${path}/`)
}

export function filterNavigation(section: SectionId, query: string) {
  const q = query.trim().toLowerCase()
  const nav = sidebarNavs[section]

  if (!q) {
    return nav.groups
  }

  return nav.groups
    .map((group) => ({
      ...group,
      items: group.items.flatMap((item) => {
        const titleMatch = item.title.toLowerCase().includes(q)
        const matches = (entry: NavLeaf) =>
          entry.title.toLowerCase().includes(q) || entry.path.toLowerCase().includes(q)
        const children = item.children?.flatMap((child) => {
          if (matches(child)) return [child]
          const leaves = child.children?.filter(matches)
          return leaves?.length ? [{ ...child, children: leaves }] : []
        })

        if (titleMatch) {
          return [item]
        }

        if (children?.length) {
          return [{ ...item, children }]
        }

        return []
      }),
    }))
    .filter((group) => group.items.length > 0)
}
