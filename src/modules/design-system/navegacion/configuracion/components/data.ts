import type { IconSvgElement } from '@hugeicons/react'
import {
  Building03Icon,
  Invoice01Icon,
  Notification03Icon,
  PaintBoardIcon,
  PlugSocketIcon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'

export type Settings = {
  name: string
  legalName: string
  nit: string
  country: string
  timezone: string
  language: string
  dateFormat: string
  academy: string
  logoInEmails: boolean
  welcome: string
  sso: boolean
  twoFactor: boolean
  invites: string
  digest: string
  notifyEvaluations: boolean
  notifyCandidates: boolean
  notifyCourses: boolean
  slack: boolean
  teams: boolean
  workday: boolean
  calendar: boolean
  billingEmail: string
  cycle: string
}

export const INITIAL: Settings = {
  name: 'Meta Colombia',
  legalName: 'Meta Platforms Colombia S.A.S.',
  nit: '901.234.567-8',
  country: 'co',
  timezone: 'bogota',
  language: 'es',
  dateFormat: 'dmy',
  academy: 'Meta Academy',
  logoInEmails: true,
  welcome: 'Bienvenido a Meta Academy. Aquí encuentras tus cursos, evaluaciones y objetivos del año.',
  sso: true,
  twoFactor: true,
  invites: 'leaders',
  digest: 'weekly',
  notifyEvaluations: true,
  notifyCandidates: true,
  notifyCourses: false,
  slack: true,
  teams: false,
  workday: true,
  calendar: false,
  billingEmail: 'facturacion@meta.com.co',
  cycle: 'annual',
}

export type SectionId = 'general' | 'marca' | 'usuarios' | 'notificaciones' | 'integraciones' | 'facturacion'

export const SECTIONS: { value: SectionId; label: string; icon: IconSvgElement; keys: (keyof Settings)[] }[] = [
  { value: 'general', label: 'General', icon: Building03Icon, keys: ['name', 'legalName', 'nit', 'country', 'timezone', 'language', 'dateFormat'] },
  { value: 'marca', label: 'Marca', icon: PaintBoardIcon, keys: ['academy', 'logoInEmails', 'welcome'] },
  { value: 'usuarios', label: 'Usuarios y permisos', icon: UserGroupIcon, keys: ['sso', 'twoFactor', 'invites'] },
  { value: 'notificaciones', label: 'Notificaciones', icon: Notification03Icon, keys: ['digest', 'notifyEvaluations', 'notifyCandidates', 'notifyCourses'] },
  { value: 'integraciones', label: 'Integraciones', icon: PlugSocketIcon, keys: ['slack', 'teams', 'workday', 'calendar'] },
  { value: 'facturacion', label: 'Facturación', icon: Invoice01Icon, keys: ['billingEmail', 'cycle'] },
]

export type Option = { value: string; label: string; description?: string }

export const COUNTRIES: Option[] = [
  { value: 'co', label: 'Colombia' },
  { value: 'mx', label: 'México' },
  { value: 'pe', label: 'Perú' },
  { value: 'cl', label: 'Chile' },
]

export const TIMEZONES: Option[] = [
  { value: 'bogota', label: '(GMT-5) Bogotá, Lima, Quito' },
  { value: 'mexico', label: '(GMT-6) Ciudad de México' },
  { value: 'santiago', label: '(GMT-4) Santiago' },
]

export const LANGUAGES: Option[] = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'Inglés' },
  { value: 'pt', label: 'Portugués' },
]

export const DATE_FORMATS: Option[] = [
  { value: 'dmy', label: '14/09/2026', description: 'Día, mes y año' },
  { value: 'mdy', label: '09/14/2026', description: 'Mes, día y año' },
  { value: 'long', label: '14 de septiembre de 2026', description: 'Fecha escrita' },
]

export const INVITES: Option[] = [
  { value: 'admins', label: 'Solo administradores', description: '4 personas pueden invitar.' },
  { value: 'leaders', label: 'Administradores y líderes', description: '42 personas pueden invitar.' },
  { value: 'all', label: 'Cualquier colaborador', description: 'Las invitaciones quedan pendientes de aprobación.' },
]

export const DIGESTS: Option[] = [
  { value: 'daily', label: 'Todos los días', description: 'A las 7:00 a. m.' },
  { value: 'weekly', label: 'Cada lunes', description: 'Resumen de la semana anterior.' },
  { value: 'never', label: 'No enviar resumen' },
]

export const CYCLES: Option[] = [
  { value: 'monthly', label: 'Mensual' },
  { value: 'annual', label: 'Anual', description: 'Ahorras 12% frente al pago mensual.' },
]

export const ROLES = [
  { name: 'Administradores', description: 'Configuran la empresa y ven todos los módulos.', count: '4' },
  { name: 'Líderes', description: 'Gestionan a su equipo: evaluaciones, vacaciones y objetivos.', count: '38' },
  { name: 'Colaboradores', description: 'Ven sus cursos, evaluaciones y solicitudes.', count: '1.212' },
]
