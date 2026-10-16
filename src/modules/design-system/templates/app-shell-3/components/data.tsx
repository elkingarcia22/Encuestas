import type { IconSvgElement } from '@hugeicons/react'
import {
  Analytics01Icon,
  Briefcase01Icon,
  Chart01Icon,
  Home01Icon,
  Mortarboard01Icon,
  TaskDone01Icon,
} from '@hugeicons/core-free-icons'

// ── Navegación ──

export type NavLeaf = {
  id: string
  label: string
  icon: IconSvgElement
  badge?: string
  children?: { id: string; label: string }[]
}

export const PLATAFORMA: NavLeaf[] = [
  { id: 'inicio', label: 'Inicio', icon: Home01Icon },
  { id: 'seleccion', label: 'Selección', icon: Briefcase01Icon, badge: 'Nuevo' },
  {
    id: 'aprendizaje',
    label: 'Aprendizaje',
    icon: Mortarboard01Icon,
    children: [
      { id: 'lms-creator', label: 'LMS Creator' },
      { id: 'planes', label: 'Planes de formación' },
      { id: 'certificados', label: 'Certificados' },
    ],
  },
  {
    id: 'desempeno',
    label: 'Desempeño y cultura',
    icon: Analytics01Icon,
    children: [
      { id: 'evaluaciones', label: 'Evaluaciones 360' },
      { id: 'objetivos', label: 'Objetivos' },
      { id: 'encuestas', label: 'Encuestas' },
    ],
  },
  { id: 'tareas', label: 'Tareas', icon: TaskDone01Icon },
  { id: 'reportes', label: 'Reportes', icon: Chart01Icon },
]

// ── Programas activos ──
// El aro de color muestra el avance del programa. El tono sale de los tokens
// de gráfico del tema, así que sigue funcionando en claro y en oscuro.

export type Programa = {
  id: string
  label: string
  avance: number
  tono: 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'
}

export const PROGRAMAS: Programa[] = [
  { id: 'onboarding', label: 'Onboarding 2026', avance: 72, tono: 'chart-2' },
  { id: 'liderazgo', label: 'Liderazgo', avance: 45, tono: 'chart-3' },
  { id: 'cultura', label: 'Cultura Ubits', avance: 90, tono: 'chart-1' },
  { id: 'ventas', label: 'Ventas B2B', avance: 33, tono: 'chart-4' },
  { id: 'seguridad', label: 'Seguridad de la información', avance: 58, tono: 'chart-5' },
]

// ── Consumo de licencias (la tarjeta del pie del sidebar) ──

export const LICENCIAS = {
  titulo: 'Licencias',
  descripcion: 'El consumo se reinicia el 1 de octubre.',
  usadas: 82,
}

// ── Persona conectada ──

export const USUARIO = {
  nombre: 'Cristian Muñoz',
  correo: 'cristian@ubits.com',
  inicial: 'C',
}

export const MARCA = { nombre: 'Ubits', inicial: 'U' }
