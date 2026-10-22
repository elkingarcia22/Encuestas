import catalogo from '../../../../ai-tools/flux-ui/flux-ui-para-ia.json'
import { AJUSTES, REGLAS_GLOBALES } from '../ajustes/main'

// Componentes › Todos los componentes y fichas (7-oct, Cristian: «organizar bien el sistema de diseño … documentar de
// una mejor forma los componentes que son custom o que tienen modificaciones»). Dos niveles: «Así viene en flux» (el
// componente de @ubits/flux-ui tal cual) y «Así se customizó» (una pieza del equipo hecha con flux, con sus decisiones).
//
// Las piezas del equipo salen de dos lugares: el catálogo que usan la IA y el equipo (`piezas_del_proyecto.ya_resueltas`
// de ai-tools/flux-ui/flux-ui-para-ia.json) y los ajustes documentados (ajustes/main.tsx). La ficha de cada pieza es su
// ajuste: lo que cambió frente a la librería, por qué, cuándo usarla y dónde vive.

type PiezaCatalogo = { necesidad: string; usa: string; desde: string; en_vez_de?: string }

export type PiezaInventario = {
  id: string
  pieza: string
  nombre: string
  necesidad: string
  archivo: string
  hechaCon: string[]
  grupo: Grupo
  verEn: string
  ficha?: string
}

// Los grupos de la lista, en el orden en que se muestran (7-oct, Cristian: «ver todo organizado … en lista»).
export const GRUPOS = [
  { id: 'marco', nombre: 'Marco y navegación', detalle: 'Lo que rodea a cada pantalla: el marco, el buscador, los procesos.' },
  { id: 'ventanas', nombre: 'Ventanas y paneles', detalle: 'Lo que se abre encima de la pantalla.' },
  { id: 'botones', nombre: 'Botones y campos', detalle: 'Controles para actuar o escribir.' },
  { id: 'ayuda', nombre: 'Ayuda y textos', detalle: 'Globos de ayuda y textos que no caben.' },
  { id: 'datos', nombre: 'Tablas y listas', detalle: 'Mostrar registros, personas y pares de dato y valor.' },
  { id: 'metricas', nombre: 'Métricas y tableros', detalle: 'Cifras, gráficos y lo que pide atención.' },
  { id: 'estados', nombre: 'Estados y avisos', detalle: 'Vacíos, errores, cargas y avisos que van y vienen.' },
  { id: 'tarjetas', nombre: 'Tarjetas', detalle: 'Bloques sueltos con contenido propio.' },
  { id: 'ia', nombre: 'Inteligencia artificial', detalle: 'Todo lo que dice «esto lo hace la IA».' },
  { id: 'pantallas', nombre: 'Piezas de una pantalla', detalle: 'Hechas para una pantalla concreta: Selección › Vacantes, Encuestas e Inicio de sesión.' },
] as const

export type Grupo = (typeof GRUPOS)[number]['id']

type Detalle = { nombre: string; hechaCon: string[]; grupo: Grupo; verEn: string; ficha?: string }

// Con qué está hecha cada pieza (los componentes de flux que pone en pantalla), su nombre en palabras, su grupo y la
// página del design system donde se ve. La clave es el primer nombre de `usa` en el catálogo.
const DETALLE: Record<string, Detalle> = {
  PageShell: { nombre: 'Marco de página', hechaCon: ['Breadcrumb', 'Heading', 'Text'], grupo: 'marco', verEn: '/design-system/marco', ficha: 'pieza-pageshell' },
  // 13-oct: el buscador quedó fuera del rediseño (regla «sin-buscador-global»); sigue en la lista porque el encabezado actual lo trae.
  CommandPalette: { nombre: 'Buscador de comandos (fuera del rediseño)', hechaCon: ['Command', 'Dialog', 'Kbd'], grupo: 'marco', verEn: '/design-system/marco/header', ficha: 'buscador' },
  ProcessCenter: { nombre: 'Centro de procesos', hechaCon: ['Popover', 'Progress', 'Item'], grupo: 'marco', verEn: '/design-system/estados', ficha: 'pieza-process-center' },
  ChatStatusDot: { nombre: 'Punto de estado del chat', hechaCon: [], grupo: 'marco', verEn: '/design-system/suite-ai-chat', ficha: 'pensando' },

  DialogoConfirmar: { nombre: 'Ventana de confirmar', hechaCon: ['AlertDialog', 'Button', 'Spinner'], grupo: 'ventanas', verEn: '/design-system/estados', ficha: 'confirmar' },
  ConfirmarEliminar: { nombre: 'Eliminar escribiendo la palabra', hechaCon: ['AlertDialog', 'Field', 'Input'], grupo: 'ventanas', verEn: '/design-system/data-grid', ficha: 'confirmar' },
  ActionDialog: { nombre: 'Ventana con contenido', hechaCon: ['Dialog', 'Button', 'Spinner', 'Avatar'], grupo: 'ventanas', verEn: '/design-system/modales', ficha: 'dialogos' },
  DrawerShell: { nombre: 'Panel lateral', hechaCon: ['Drawer', 'Button'], grupo: 'ventanas', verEn: '/design-system/drawers', ficha: 'drawer' },
  FeatureDialog: { nombre: 'Novedades y bienvenida', hechaCon: ['Dialog', 'Button', 'Badge'], grupo: 'ventanas', verEn: '/design-system/modales', ficha: 'dialogos' },
  CloseButton: { nombre: 'Botón de cerrar', hechaCon: ['Button'], grupo: 'ventanas', verEn: '/design-system/drawers', ficha: 'cerrar' },
  // 13-oct: piezas que salían con su nombre de código en «Tarjetas» porque nadie las sumó a esta tabla.
  RegistroConfirmar: { nombre: 'Tarjeta de lo que se toca', hechaCon: ['IconTile', 'Heading', 'Badge'], grupo: 'ventanas', verEn: '/design-system/estados' },
  // 13-oct: es también la ventana de salir (VentanaSalir); va con las ventanas y se ve en Ventanas.
  BotonSalirCreacion: { nombre: 'Ventana de salir de una creación', hechaCon: ['AlertDialog', 'Button'], grupo: 'ventanas', verEn: '/design-system/modales' },
  DialogoEscribir: { nombre: 'Ventana para escribir un correo', hechaCon: ['Dialog', 'Select', 'Textarea'], grupo: 'pantallas', verEn: '/design-system/componentes' },
  DialogoCompartirVacante: { nombre: 'Ventana para compartir una vacante', hechaCon: ['Dialog', 'Input', 'Button'], grupo: 'pantallas', verEn: '/design-system/componentes' },
  pedirMover: { nombre: 'Mover de etapa', hechaCon: ['Dialog', 'Select'], grupo: 'pantallas', verEn: '/design-system/componentes' },

  BotonIcono: { nombre: 'Botón de solo icono', hechaCon: ['Button'], grupo: 'botones', verEn: '/design-system/botones', ficha: 'boton-icono' },
  // 13-oct: el chip de filtro y el de guardado se ven en Navegación (y Navegación › Pasos), no en Tablas ni Formularios.
  FiltroChip: { nombre: 'Chip de filtro rápido', hechaCon: ['Button', 'Badge'], grupo: 'botones', verEn: '/design-system/navegacion', ficha: 'pieza-filtro-chip' },
  ChipGuardado: { nombre: 'Chip de guardado', hechaCon: ['Badge', 'Spinner'], grupo: 'botones', verEn: '/design-system/navegacion/pasos', ficha: 'save-indicator' },
  Badge: { nombre: 'Insignia del proyecto', hechaCon: ['Badge'], grupo: 'botones', verEn: '/design-system/componentes/reglas', ficha: 'insignias' },
  SelectorMultiple: { nombre: 'Selector múltiple', hechaCon: ['Combobox', 'Badge'], grupo: 'botones', verEn: '/design-system/formularios', ficha: 'pieza-selector-multiple' },
  SelectorColor: { nombre: 'Selector de color', hechaCon: ['Popover', 'Slider', 'Select', 'Input', 'Button'], grupo: 'botones', verEn: '/design-system/formularios', ficha: 'pieza-selector-color' },
  EdicionEnLinea: { nombre: 'Edición en línea', hechaCon: ['Input', 'Textarea'], grupo: 'botones', verEn: '/design-system/formularios', ficha: 'edicion-en-linea' },
  AdjuntoCsv: { nombre: 'Cargador de archivos', hechaCon: ['Attachment', 'Progress'], grupo: 'botones', verEn: '/design-system/formularios', ficha: 'file-upload' },

  Hint: { nombre: 'Ayuda en globo', hechaCon: ['Tooltip'], grupo: 'ayuda', verEn: '/design-system/metricas', ficha: 'vacantes-ayuda' },
  TextoCompleto: { nombre: 'Texto que se corta', hechaCon: ['Tooltip'], grupo: 'ayuda', verEn: '/design-system/data-grid', ficha: 'pieza-texto-completo' },

  TablaDatos: { nombre: 'Tabla de datos', hechaCon: ['DataGridList', 'Frame', 'Pagination'], grupo: 'datos', verEn: '/design-system/data-grid', ficha: 'pieza-tabla-datos' },
  Persona: { nombre: 'Persona en una celda', hechaCon: ['Avatar', 'Text'], grupo: 'datos', verEn: '/design-system/data-grid', ficha: 'pieza-persona' },
  Filas: { nombre: 'Lista de dato y valor', hechaCon: ['Item', 'Text'], grupo: 'datos', verEn: '/design-system/navegacion/detalle', ficha: 'pieza-filas' },
  Marco: { nombre: 'Bloque con título', hechaCon: ['Frame'], grupo: 'datos', verEn: '/design-system/navegacion/detalle', ficha: 'pieza-marco' },
  ListaElegible: { nombre: 'Lista para elegir', hechaCon: ['Frame', 'Item', 'Checkbox', 'InputGroup', 'Pagination'], grupo: 'datos', verEn: '/design-system/componentes/reglas', ficha: 'pieza-lista-elegible' },

  Indicadores: { nombre: 'Cifras de un tablero', hechaCon: ['Frame', 'Text', 'Badge', 'Popover'], grupo: 'metricas', verEn: '/design-system/metricas', ficha: 'pieza-indicadores' },
  TableroAtencion: { nombre: 'Tablero «Lo que necesita tu atención»', hechaCon: ['Frame', 'Alert', 'Item', 'Button'], grupo: 'metricas', verEn: '/design-system/metricas', ficha: 'pieza-tablero-atencion' },
  BloqueAtencion: { nombre: 'Franja «N cosas necesitan tu atención»', hechaCon: ['Alert', 'Collapsible'], grupo: 'metricas', verEn: '/design-system/metricas', ficha: 'vacantes-alertas' },
  GraficoArea: { nombre: 'Gráficos de tablero', hechaCon: ['Chart'], grupo: 'metricas', verEn: '/design-system/metricas', ficha: 'encuestas-graficos' },

  notify: { nombre: 'Aviso', hechaCon: ['Toast'], grupo: 'estados', verEn: '/design-system/estados', ficha: 'avisos' },
  LluviaConfeti: { nombre: 'Confeti de cierre', hechaCon: [], grupo: 'estados', verEn: '/design-system/componentes/ficha/pieza-confeti', ficha: 'pieza-confeti' },
  PrimeraVez: { nombre: 'Estados vacíos', hechaCon: ['Empty', 'Button'], grupo: 'estados', verEn: '/design-system/estados', ficha: 'pieza-primera-vez' },
  PantallaDeError: { nombre: 'Pantalla de error', hechaCon: ['Empty', 'Button'], grupo: 'estados', verEn: '/design-system/estados', ficha: 'pieza-pantalla-error' },
  PantallaProximamente: { nombre: 'Pantalla que viene en camino', hechaCon: ['Empty', 'Badge'], grupo: 'estados', verEn: '/design-system/estados' },
  useCarga: { nombre: 'Esqueletos y espera', hechaCon: ['Skeleton'], grupo: 'estados', verEn: '/design-system/estados', ficha: 'pieza-carga' },
  ImagenGlass: { nombre: 'Ilustración Glass', hechaCon: [], grupo: 'estados', verEn: '/design-system/icons', ficha: 'pieza-imagen-glass' },

  TarjetaContenido: { nombre: 'Tarjeta de contenido', hechaCon: ['Card', 'Badge', 'Progress'], grupo: 'tarjetas', verEn: '/design-system/templates/colaborador', ficha: 'tarjeta-contenido' },
  InviteCard: { nombre: 'Tarjeta de invitar', hechaCon: ['Card', 'Avatar', 'Button'], grupo: 'tarjetas', verEn: '/design-system/marco/capturas', ficha: 'invitacion' },

  Orb: { nombre: 'Orbe del agente', hechaCon: [], grupo: 'ia', verEn: '/design-system/ia', ficha: 'pieza-orb' },
  IconoIA: { nombre: 'Marca de IA (orbe e insignia)', hechaCon: ['Badge'], grupo: 'ia', verEn: '/design-system/ia', ficha: 'pieza-icono-ia' },
  BotonIa: { nombre: 'Botones de IA', hechaCon: ['Button'], grupo: 'ia', verEn: '/design-system/ia/botones', ficha: 'ia' },
  AiCard: { nombre: 'Tarjeta de IA', hechaCon: ['Card', 'Button'], grupo: 'ia', verEn: '/design-system/tarjeta-ia', ficha: 'pieza-ai-card' },
  AiThinking: { nombre: 'Estado «Razonando»', hechaCon: ['Text'], grupo: 'ia', verEn: '/design-system/ia/estados', ficha: 'pieza-ai-thinking' },
  AgentStage: { nombre: 'Agente contextual (Orbit)', hechaCon: ['Frame', 'Item', 'Button', 'Badge'], grupo: 'ia', verEn: '/design-system/agente-contextual', ficha: 'rotulos-agente' },
  'issue-card': { nombre: 'Tarjeta de incidencia del agente', hechaCon: ['Card', 'Badge'], grupo: 'ia', verEn: '/design-system/agente-contextual', ficha: 'pieza-issue-card' },
}

// El primer nombre de `usa`, sin el punto o la comilla que a veces lo acompañan («CommandPalette.»).
const claveDe = (usa: string) => usa.split(/[\s,(:]/)[0].replace(/[.`]+$/, '')

const DEL_CATALOGO: PiezaInventario[] = (catalogo.piezas_del_proyecto.ya_resueltas as PiezaCatalogo[]).map((p) => {
  const pieza = claveDe(p.usa)
  const detalle = DETALLE[pieza]
  return {
    id: pieza,
    pieza,
    nombre: detalle?.nombre ?? pieza,
    necesidad: p.necesidad,
    archivo: (p.desde.match(/@\/[\w/.-]+/) ?? [p.desde])[0],
    hechaCon: detalle?.hechaCon ?? [],
    // Una pieza nueva del catálogo sin detalle todavía cae en «Tarjetas» hasta que se le asigne grupo.
    grupo: detalle?.grupo ?? 'tarjetas',
    verEn: detalle?.verEn ?? '/design-system/componentes',
    ficha: detalle?.ficha,
  }
})

// Los ajustes que no son una pieza del catálogo pero sí una pieza con ficha (la barra lateral, el encabezado, las de
// Vacantes…). Entran a la lista con el grupo que se les da aquí; los de un módulo van en «Piezas de una pantalla».
const GRUPO_DE_AJUSTE: Record<string, Grupo> = {
  novedades: 'marco',
  empresa: 'marco',
  espacio: 'marco',
  filas: 'marco',
  riel: 'marco',
  tema: 'marco',
  perfil: 'marco',
  anillos: 'marco',
  'marco-inmersivo': 'marco',
  notificaciones: 'ventanas',
  'fila-abierta': 'datos',
  'editor-texto': 'botones',
  // Hasta que el catálogo la sume a sus piezas (reglas.json, de Cristian): sin esto caería en «Piezas de una pantalla».
  'pieza-selector-color': 'botones',
  'pieza-confeti': 'estados',
  'insignia-pro': 'botones',
  'tokens-ia': 'ia',
  'panel-generacion': 'ia',
}

const CON_FICHA = new Set(DEL_CATALOGO.map((p) => p.ficha))
const DE_AJUSTES: PiezaInventario[] = AJUSTES.filter((a) => !CON_FICHA.has(a.id) && !REGLAS_GLOBALES.includes(a.id)).map((a) => ({
  id: a.id,
  pieza: '',
  nombre: a.titulo,
  necesidad: a.resumen,
  archivo: a.donde[0] ?? '',
  hechaCon: a.piezas.map((p) => p.nombre),
  grupo: GRUPO_DE_AJUSTE[a.id] ?? 'pantallas',
  verEn: `/design-system/componentes/ficha/${a.id}`,
  ficha: a.id,
}))

export const PIEZAS_CUSTOM: PiezaInventario[] = [...DEL_CATALOGO, ...DE_AJUSTES]

// Las piezas del código que cuenta una ficha (las del catálogo que apuntan a ese ajuste).
export const piezasDeFicha = (id: string) => DEL_CATALOGO.filter((p) => p.ficha === id)

type ComponenteFlux = { nombre: string; slug: string; usar_para: string; storybook?: { docs?: string } }

// Los componentes de flux-ui publicados en la versión instalada (los que se pueden usar tal cual).
export const COMPONENTES_FLUX = catalogo.componentes as ComponenteFlux[]

// La ficha del Storybook de un componente de flux, por su nombre («AlertDialog» → su página de docs).
export function storybookDe(nombre: string): string | undefined {
  return COMPONENTES_FLUX.find((c) => c.nombre === nombre)?.storybook?.docs
}
