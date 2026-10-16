import type { IconSvgElement } from '@hugeicons/react'
import {
  AiMagicIcon,
  Analytics01Icon,
  Briefcase01Icon,
  BuildingIcon,
  GroupLayersIcon,
  Home01Icon,
  MortarboardIcon,
  Megaphone02Icon,
  Notification03Icon,
  PaintBrushIcon,
  SecurityLockIcon,
  TaskDone01Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'

// ── Modelo de datos de navegación ──

export type NavCategory = { type: 'category'; label: string }

export type NavLeaf = {
  type: 'leaf'
  id: string
  label: string
  icon: IconSvgElement
  href: string
  badge?: string
}

export type NavChild = { id: string; label: string; href: string }

export type NavSection = {
  type: 'section'
  id: string
  label: string
  icon: IconSvgElement
  badge?: string
  defaultOpen?: boolean
  children: NavChild[]
}

export type NavNode = NavCategory | NavLeaf | NavSection

// ── Árbol "Workspace" (refleja la estructura real de admin/nav-config.ts) ──

export const NAV_TREE: NavNode[] = [
  { type: 'leaf', id: 'inicio', label: 'Inicio', icon: Home01Icon, href: '#inicio' },
  { type: 'category', label: 'Productos' },
  {
    type: 'section',
    id: 'seleccion',
    label: 'Selección',
    icon: Briefcase01Icon,
    badge: 'Nuevo',
    children: [
      { id: 'dashboard', label: 'Dashboard', href: '#seleccion/dashboard' },
      { id: 'onboarding', label: 'Onboarding', href: '#seleccion/onboarding' },
      { id: 'vacantes', label: 'Vacantes', href: '#seleccion/vacantes' },
      { id: 'plantillas', label: 'Plantillas', href: '#seleccion/plantillas' },
    ],
  },
  {
    type: 'section',
    id: 'aprendizaje',
    label: 'Aprendizaje',
    icon: MortarboardIcon,
    children: [
      { id: 'lms-creator', label: 'LMS Creator', href: '#aprendizaje/lms-creator' },
      { id: 'planes-formacion', label: 'Planes de Formación', href: '#aprendizaje/planes-de-formacion' },
      { id: 'certificados', label: 'Certificados', href: '#aprendizaje/certificados' },
      { id: 'diagnostico', label: 'Diagnóstico', href: '#aprendizaje/diagnostico' },
      { id: 'reportes', label: 'Reportes', href: '#aprendizaje/reportes' },
    ],
  },
  {
    type: 'section',
    id: 'desempeno-cultura',
    label: 'Desempeño y cultura',
    icon: Analytics01Icon,
    children: [
      { id: 'evaluaciones-360', label: 'Evaluaciones 360', href: '#desempeno/evaluaciones-360' },
      { id: 'objetivos', label: 'Objetivos', href: '#desempeno/objetivos' },
      { id: 'matriz-talento', label: 'Matriz de talento', href: '#desempeno/matriz-talento' },
      { id: 'pdi', label: 'PDI', href: '#desempeno/pdi' },
      { id: 'encuestas', label: 'Encuestas', href: '#desempeno/encuestas' },
    ],
  },
  { type: 'category', label: 'Herramientas' },
  { type: 'leaf', id: 'tareas', label: 'Tareas', icon: TaskDone01Icon, href: '#tareas' },
  { type: 'leaf', id: 'avisos', label: 'Avisos internos', icon: Megaphone02Icon, href: '#avisos' },
]

// ── Árbol "Orbit Flow" ──

export const AGENT_TREE: NavNode[] = [
  { type: 'category', label: 'Agentes disponibles' },
  {
    type: 'leaf',
    id: 'agente-seleccion',
    label: 'Agente de Selección',
    icon: Briefcase01Icon,
    href: '#agente/seleccion',
    badge: 'Nuevo',
  },
  { type: 'leaf', id: 'agente-aprendizaje', label: 'Agente de Aprendizaje', icon: MortarboardIcon, href: '#agente/aprendizaje' },
  { type: 'leaf', id: 'agente-desempeno', label: 'Agente de Desempeño', icon: Analytics01Icon, href: '#agente/desempeno' },
]

// ── Selector de empresa ──

export const COMPANY = { name: 'Ubits', initial: 'U' }

export const LICENSE_USAGE = { used: 940, total: 1000 }
export const CREDITS_USAGE = { used: 3200, total: 5000 }

export type SettingsLink = { title: string; icon: IconSvgElement }

export const SETTINGS_LINKS: SettingsLink[] = [
  { title: 'Gestión de usuarios', icon: UserGroupIcon },
  { title: 'Personalización', icon: PaintBrushIcon },
  { title: 'Organigrama', icon: GroupLayersIcon },
  { title: 'Datos de empresa', icon: BuildingIcon },
  { title: 'Roles y permisos', icon: SecurityLockIcon },
]

// ── Card promocional ──

export const PROMO_CARD = {
  icon: AiMagicIcon,
  title: 'Automatiza tu gestión de personas',
  description: 'Descubre los nuevos agentes de IA para HR.',
  actionLabel: 'Conocer más',
}

// ── Pie del sidebar ──

export const FEEDBACK_ITEM = { label: 'Feedback', icon: Notification03Icon }
