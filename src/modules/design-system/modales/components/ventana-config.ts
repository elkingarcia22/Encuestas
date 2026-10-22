import type { IconSvgElement } from '@hugeicons/react'
import {
  CheckListIcon,
  Edit02Icon,
  FileEditIcon,
  LayoutTwoColumnIcon,
  LookTopIcon,
  Maximize01Icon,
} from '@hugeicons/core-free-icons'
import type { PartInfo } from '../../components/anatomy/anatomy-kit'

// Design system › Modales: la ventana con contenido, `ActionDialog` (src/shared/components/ActionDialog.tsx;
// ConfiguredModal se retiró el 5-oct). Preguntar antes de hacer algo (eliminar, salir sin guardar, activar) es de la
// ventana de confirmar, DialogoConfirmar, en Estados › Confirmaciones (acuerdo del 6-oct). Aquí está lo que se puede
// prender o apagar en ActionDialog —solo lo que la pieza permite— y los casos de uso con sus textos de ejemplo.

// Lo que se puede prender o apagar, con el nombre de la prop de ActionDialog al lado.
export type VentanaConfig = {
  // `size`: sm 448 px · default 620 · wide 736 · full (casi a pantalla completa, con 16 px de aire).
  size: 'sm' | 'default' | 'wide' | 'full'
  // `media`: icono a la izquierda del título. Los de salir y eliminar son de la ventana de confirmar (DialogoConfirmar).
  media: 'none' | 'orbe'
  // `sub`: la bajada bajo el título.
  sub: boolean
  // `onBack`: flecha para volver al paso anterior dentro de la misma ventana.
  back: boolean
  // `headerActions`: una insignia o un botón de solo icono junto a la X.
  headerActions: boolean
  // `lead`: la primera línea del cuerpo, con el registro del que se habla.
  lead: boolean
  // Lo primero del cuerpo: pestañas subrayadas o pasos. No es una prop: va dentro de `children`.
  under: 'none' | 'tabs' | 'steps'
  // `children`: el cuerpo, con scroll propio.
  body: boolean
  // Pie gris: el de siempre («Cancelar» y la acción), uno propio (`footer`) o ninguno (`hideFooter`).
  footer: 'estandar' | 'propio' | 'ninguno'
  // `note`: el texto gris a la izquierda del pie.
  note: boolean
  // `pendingLabel`: al confirmar, el botón muestra el spinner y lo que está pasando.
  pending: boolean
  // `dismissible`: en false, el clic afuera no cierra.
  dismissible: boolean
}

// Textos de ejemplo de cada caso. El título es fijo (dice qué es la ventana); lo particular va en `lead`.
export type VentanaMuestra = {
  title: string
  sub: string
  lead: { titulo: string; detalle: string }
  headerAction: string
  tabs: string[]
  steps: string[]
  slot: string
  note: string
  cancel: string
  confirm: string
  pending: string
  // Pie propio: los botones en orden, el último es el principal (o el destructivo, si `destructiva`).
  propio: string[]
  destructiva?: boolean
}

export type CasoVentana = {
  id: string
  title: string
  summary: string
  icon: IconSvgElement
  config: VentanaConfig
  sample: VentanaMuestra
}

const BASE: VentanaConfig = {
  size: 'default',
  media: 'none',
  sub: true,
  back: false,
  headerActions: false,
  lead: false,
  under: 'none',
  body: true,
  footer: 'estandar',
  note: false,
  pending: true,
  dismissible: true,
}

const MUESTRA: VentanaMuestra = {
  title: 'Publicar vacante',
  sub: 'Se verá en el portal de empleo y llegará a quienes siguen a la empresa.',
  lead: { titulo: 'Analista de datos', detalle: 'Analítica · Bogotá · híbrida' },
  headerAction: 'Borrador',
  tabs: ['Resumen', 'Detalle', 'Historial'],
  steps: ['Datos', 'Requisitos', 'Publicación'],
  slot: 'El texto, el formulario o la lista que necesite el caso. Tiene su propio scroll.',
  note: '',
  cancel: 'Cancelar',
  confirm: 'Publicar',
  pending: 'Publicando…',
  propio: ['Cancelar', 'Publicar'],
}

export const VENTANA_CASES: CasoVentana[] = [
  {
    // 13-oct: «confirmar con la lista de a quiénes afecta» pasó a DialogoConfirmar con RegistroConfirmar (regla
    // «dos-ventanas»); aquí queda la lista para elegir, que sí tiene contenido para trabajar.
    id: 'elegir',
    title: 'Elegir de una lista',
    summary: 'Marcar a quiénes llega algo antes de seguir: la lista para elegir va en el cuerpo, por eso es ActionDialog. Si solo hay que confirmar (aunque afecte a muchas personas), es DialogoConfirmar con RegistroConfirmar (Estados › Confirmaciones).',
    icon: CheckListIcon,
    config: { ...BASE, lead: true, note: true },
    sample: {
      ...MUESTRA,
      title: 'Asignar contenido',
      sub: 'Quienes marques lo ven en su Zona de estudio desde hoy.',
      lead: { titulo: 'Onboarding comercial Q3', detalle: 'Curso · 8 páginas' },
      slot: 'La lista de personas para marcar.',
      note: 'Puedes quitarlo después desde el plan',
      confirm: 'Asignar',
      pending: 'Asignando…',
    },
  },
  {
    id: 'formulario',
    title: 'Formulario corto',
    summary: 'Pedir dos o tres datos sin sacar a la persona de la página, como una nota. Ancho normal; el clic afuera no cierra, para que un clic perdido no borre lo escrito. Crear o editar algo largo no va aquí: va en una página.',
    icon: Edit02Icon,
    config: { ...BASE, lead: true, dismissible: false },
    sample: {
      ...MUESTRA,
      title: 'Nueva nota',
      sub: 'Queda en la ficha del candidato y la ve el equipo del proceso.',
      lead: { titulo: 'Laura Méndez', detalle: 'Analista de datos · Evaluación técnica' },
      slot: 'Los campos del formulario: 2 o 3, no más.',
      confirm: 'Guardar nota',
      pending: 'Guardando…',
    },
  },
  {
    // 13-oct: los casos «Formulario ancho» (Editar datos de la vacante, 6 campos) y «Con pasos» (Configurar evaluación)
    // eran crear o editar dentro de una ventana, que la regla «crear-en-pagina» manda a una página. Este los reemplaza
    // con un ajuste de verdad corto.
    id: 'ajuste',
    title: 'Ajuste corto',
    summary: 'Un ajuste de pocas opciones, como las preferencias de avisos. El clic afuera no cierra. Lo largo, o crear algo, va en una página: nunca en una ventana.',
    icon: LayoutTwoColumnIcon,
    config: { ...BASE, lead: true, note: true, dismissible: false },
    sample: {
      ...MUESTRA,
      title: 'Preferencias de avisos',
      sub: 'Elige cuándo te escribimos sobre esta vacante.',
      lead: { titulo: 'Analista de datos', detalle: 'Publicada · 48 postulaciones' },
      slot: 'Dos o tres interruptores.',
      note: 'Solo cambia tus avisos, no los del equipo',
      confirm: 'Guardar cambios',
      pending: 'Guardando…',
    },
  },
  {
    id: 'pantalla-completa',
    title: 'A pantalla completa',
    summary: 'Revisar un documento o un editor antes de enviarlo. Ocupa casi toda la pantalla, con 16 px de aire.',
    icon: Maximize01Icon,
    config: { ...BASE, size: 'full', lead: true, headerActions: true, note: true },
    sample: {
      ...MUESTRA,
      title: 'Vista previa de la carta de oferta',
      sub: 'Así le llega al candidato. Revisa los datos antes de enviarla.',
      lead: { titulo: 'Laura Méndez', detalle: 'Analista de datos · PDF de 2 páginas' },
      headerAction: 'Borrador',
      slot: 'El documento o la pantalla, con su propio scroll.',
      note: 'Se envía al correo del candidato',
      confirm: 'Enviar carta',
      pending: 'Enviando…',
    },
  },
  {
    id: 'pestanas',
    title: 'Con pestañas',
    summary: 'Separar lo que se muestra en partes sin abrir otra ventana: pestañas subrayadas al empezar el cuerpo.',
    icon: FileEditIcon,
    config: { ...BASE, size: 'wide', lead: true, under: 'tabs' },
    sample: {
      ...MUESTRA,
      title: 'Detalle de la postulación',
      sub: 'Lo que respondió y lo que se evaluó en cada etapa.',
      lead: { titulo: 'Laura Méndez', detalle: 'Analista de datos · se postuló el 3 sept 2026' },
      tabs: ['Respuestas', 'Evaluaciones', 'Historial'],
      slot: 'Lo de la pestaña elegida, con su propio scroll.',
      confirm: 'Pasar a Entrevistas',
      pending: 'Moviendo…',
    },
  },
  {
    // La ventana de «Enviar feedback» de la barra lateral y del riel (FeedbackDialog, sobre ActionDialog), sumada como
    // caso por la auditoría del 5-oct (decisión 21). «Ver el caso completo» abre la de verdad.
    id: 'feedback',
    title: 'Enviar feedback',
    summary: 'La que abre «Enviar feedback» en la barra lateral: 620 px, tipo, comentario y hasta 5 pantallazos (capturar un área o subir imágenes); al enviar, el agradecimiento sale en la misma ventana.',
    icon: LookTopIcon,
    config: { ...BASE, note: true, footer: 'propio' },
    sample: {
      ...MUESTRA,
      title: 'Enviar feedback',
      sub: 'Cuéntanos qué funciona bien y qué podemos mejorar.',
      slot: 'Tipo (Mejora, Error o Idea), comentario de hasta 500 caracteres, pantallazos y las casillas de envío: incluir la página y dejar que te contacten.',
      note: 'Lo lee el equipo de producto de UBITS.',
      propio: ['Cancelar', 'Enviar feedback'],
    },
  },
]

export const TAMANO_VENTANA: Record<VentanaConfig['size'], string> = {
  sm: 'chica · 448 px',
  default: 'normal · 620 px',
  wide: 'ancha · 736 px',
  full: 'pantalla completa',
}

// Nombre del panel en la anatomía.
export const panelVentana = (c: VentanaConfig) =>
  c.size === 'full' ? 'Panel · pantalla completa' : `Panel · ${TAMANO_VENTANA[c.size]} · a 120 px del borde`

const MEDIA_LABEL: Record<Exclude<VentanaConfig['media'], 'none'>, string> = {
  orbe: 'Orbe IA',
}
export const mediaVentana = (c: VentanaConfig) => (c.media === 'none' ? '' : MEDIA_LABEL[c.media])

const TEXTO: Record<string, string> = {
  Volver: 'Flecha a la izquierda del título para volver al paso anterior sin cerrar la ventana (`onBack`).',
  'Orbe IA': 'Va arriba del título, alineado a la izquierda, cuando quien propone lo de la ventana es el agente (`media`).',
  Título: 'Fijo: dice qué es la ventana, no de qué registro habla. 20 px en peso 500.',
  Bajada: 'Una o dos líneas que explican qué pasa si se sigue (`sub`).',
  'Junto a la X': 'Una insignia o un botón de solo icono antes de cerrar (`headerActions`).',
  Cerrar: 'La X estándar (CloseButton). También cierran Esc y el clic afuera, salvo con `dismissible={false}`.',
  Registro: 'El nombre de lo que se toca y una línea gris: abre el cuerpo, por debajo del título (`lead`).',
  Pestañas: 'Pestañas subrayadas (`TabsList variant="line"`) al empezar el cuerpo.',
  Pasos: 'El avance de la ventana en partes, al empezar el cuerpo.',
  Cuerpo: 'Lo que el caso necesite: texto, formulario, lista o documento, con su propio scroll (`children`).',
  Pie: 'Gris pleno, pegado abajo. Por defecto «Cancelar» y la acción; con `footer`, botones propios; con `hideFooter`, sin pie.',
  Nota: 'Texto gris a la izquierda del pie: qué pasa después o cómo deshacerlo (`note`).',
  Acción: 'Siempre a la derecha. Al confirmar muestra el spinner y lo que está pasando (`pendingLabel`) y la ventana no se cierra dos veces.',
}

// Partes visibles con la configuración actual, de afuera hacia adentro y de arriba abajo.
export function ventanaParts(c: VentanaConfig): PartInfo[] {
  const parts: PartInfo[] = [
    {
      name: 'Fondo oscurecido',
      text: c.dismissible ? 'Oscurece la página. Un clic aquí cierra la ventana.' : 'Oscurece la página. Con `dismissible={false}` un clic aquí no cierra nada.',
    },
    {
      name: panelVentana(c),
      text:
        c.size === 'full'
          ? 'Para editores y vistas previas: casi toda la pantalla, con 16 px de aire.'
          : 'Sale a 120 px del borde de arriba con un rebote suave. sm para algo muy corto, default para una ventana con contenido, wide para listas o vistas con dos columnas. Un formulario largo no va aquí: va en una página.',
    },
  ]
  const names: string[] = []
  if (c.back) names.push('Volver')
  if (c.media !== 'none') names.push(mediaVentana(c))
  names.push('Título')
  if (c.sub) names.push('Bajada')
  if (c.headerActions) names.push('Junto a la X')
  names.push('Cerrar')
  if (c.lead) names.push('Registro')
  if (c.under === 'tabs') names.push('Pestañas')
  if (c.under === 'steps') names.push('Pasos')
  parts.push(...names.map((name) => ({ name, text: TEXTO[name] })))
  if (c.body) parts.push({ name: 'Cuerpo', text: TEXTO.Cuerpo, slot: true })
  if (c.footer !== 'ninguno') {
    parts.push({ name: 'Pie', text: TEXTO.Pie })
    if (c.note) parts.push({ name: 'Nota', text: TEXTO.Nota })
    parts.push({ name: 'Acción', text: TEXTO.Acción })
  }
  return parts
}
