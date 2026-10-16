import type { IconSvgElement } from '@hugeicons/react'
import {
  AnalyticsDownIcon,
  Briefcase01Icon,
  Calendar03Icon,
  DocumentValidationIcon,
  FileImportIcon,
  MarketingIcon,
  Moon02Icon,
  Queue02Icon,
  RefreshIcon,
  Shield01Icon,
  UserAdd01Icon,
} from '@hugeicons/core-free-icons'

// Datos de ejemplo del marco: procesos, notificaciones, anuncios y buscador.

export type Process = {
  title: string
  meta: string
  cta: string
  icon: IconSvgElement
  progress?: number
  toast: string
}

export const PROCESSES: Process[] = [
  { title: 'Importación de usuarios', meta: '234 de 300 filas', cta: 'Ver', icon: FileImportIcon, progress: 78, toast: 'Detalle de la importación' },
  { title: 'Revisión sin terminar', meta: '10 de 33 listos', cta: 'Retomar', icon: DocumentValidationIcon, progress: 30, toast: 'Retomando la revisión' },
  { title: 'Reporte mensual', meta: 'En espera · inicia 22:00', cta: 'Cancelar', icon: Calendar03Icon, toast: 'Proceso cancelado' },
]

export type Notification = {
  id: number
  icon: IconSvgElement
  title: string
  text: string
  time: string
  cta: string
  fresh: boolean
  to?: string
}

export const NOTIFICATIONS: Notification[] = [
  { id: 1, icon: MarketingIcon, title: 'Aviso publicado', text: '312 personas recibieron la política de vacaciones.', time: 'hace 8 min', cta: 'Ver el aviso', fresh: true, to: '/suite-ai/chat/vacaciones' },
  { id: 2, icon: FileImportIcon, title: 'Importación al 78%', text: '234 de 300 filas cargadas, sin errores por ahora.', time: 'hace 22 min', cta: 'Abrir procesos', fresh: true },
  { id: 3, icon: AnalyticsDownIcon, title: 'Ventas bajó a 70%', text: 'La terminación de evaluaciones cayó 6 puntos esta semana.', time: 'hace 1 h', cta: 'Revisar', fresh: true, to: '/suite-ai/chat/evaluaciones' },
  { id: 4, icon: UserAdd01Icon, title: 'Andrés Malo aplicó', text: 'Nuevo candidato para Analista de datos.', time: 'ayer', cta: '', fresh: false, to: '/admin/seleccion/exploraciones/uno/analista-de-datos' },
]

export type PaletteEntry = {
  title: string
  meta: string
  action: string
  to?: string
  toast?: string
}

export const PALETTE_OBJECTS: PaletteEntry[] = [
  { title: 'Analista de datos', meta: 'vacante · Entrevistas · 12 candidatos', action: 'Abrir', to: '/admin/seleccion/exploraciones/uno/analista-de-datos' },
  { title: 'Andrés Malo', meta: 'candidato · Analista de datos', action: 'Abrir', toast: 'Perfil de Andrés Malo' },
  { title: 'Onboarding operativo', meta: 'contenido · borrador · 6 lecciones', action: 'Abrir', to: '/admin/aprendizaje/lms-creator/contenidos/onboarding-operativo' },
]

export const PROMO_BULLETS = [
  { icon: Briefcase01Icon, text: 'Publica vacantes y mueve candidatos de etapa sin salir del chat.' },
  { icon: Shield01Icon, text: 'Cada acción con efecto real te pide confirmación y dice a quién afecta.' },
  { icon: RefreshIcon, text: 'Los procesos largos siguen corriendo aunque cierres la conversación.' },
]

export const PROMO_NEWS = [
  { icon: Briefcase01Icon, tag: 'Selección', title: 'Acciones en vacantes', text: 'Publicar, mover de etapa y avisar al responsable, con confirmación previa.' },
  { icon: Queue02Icon, tag: 'Procesos', title: 'Centro de procesos', text: 'Un panel flotante con todo lo que está corriendo y lo que quedó a medias.' },
  { icon: Moon02Icon, tag: 'Interfaz', title: 'Tema oscuro', text: 'Toda la plataforma en oscuro, con el mismo contraste de lectura.' },
]

export const PROMO_STEPS = [
  { n: '1', title: 'Pide la tarea', text: 'Escríbela como se la dirías a un analista del equipo.' },
  { n: '2', title: 'Revisa el impacto', text: 'Antes de ejecutar verás a quién afecta y qué cambia.' },
  { n: '3', title: 'Sigue en otra cosa', text: 'El proceso corre en segundo plano y te avisa al terminar.' },
]
