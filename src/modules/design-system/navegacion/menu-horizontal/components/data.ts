import type { IconSvgElement } from '@hugeicons/react'
import {
  BookOpen01Icon,
  ChartLineData02Icon,
  Download04Icon,
  Folder01Icon,
  Mortarboard02Icon,
  Route01Icon,
  Settings02Icon,
  Target02Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import { ICONO_IA } from '@/shared/layouts/nav-config'

export type Leaf = { value: string; title: string; description: string; icon: IconSvgElement }

export type MenuEntry = { value: string; label: string; links?: Leaf[]; leaf?: Leaf }

// Navegación del producto Aprendizaje: tres grupos con submenú y dos enlaces directos.
export const MENU: MenuEntry[] = [
  {
    value: 'contenidos',
    label: 'Contenidos',
    links: [
      { value: 'cursos', title: 'Cursos', description: 'Crea, edita y publica cursos con el LMS Creator.', icon: BookOpen01Icon },
      { value: 'categorias', title: 'Categorías', description: 'Ordena el catálogo por temas y áreas.', icon: Folder01Icon },
      { value: 'universidad', title: 'Universidad corporativa', description: 'Escuelas y rutas de carrera de tu academia.', icon: Mortarboard02Icon },
      { value: 'lms-ai', title: 'LMS AI', description: 'Cursos armados por Orbit desde tus documentos.', icon: ICONO_IA },
    ],
  },
  {
    value: 'planes',
    label: 'Planes de formación',
    links: [
      { value: 'planes', title: 'Planes', description: 'Rutas obligatorias por cargo con fecha límite.', icon: Route01Icon },
      { value: 'grupos', title: 'Grupos', description: 'Audiencias por área, sede o nivel.', icon: UserGroupIcon },
    ],
  },
  {
    value: 'certificados',
    label: 'Certificados',
    links: [
      { value: 'descarga', title: 'Descarga', description: 'Certificados individuales o por lote.', icon: Download04Icon },
      { value: 'configuracion', title: 'Configuración', description: 'Plantilla, firmas y vigencia.', icon: Settings02Icon },
    ],
  },
  {
    value: 'diagnostico',
    label: 'Diagnóstico',
    leaf: { value: 'diagnostico', title: 'Diagnóstico', description: 'Brechas de conocimiento antes de asignar formación.', icon: Target02Icon },
  },
  {
    value: 'reportes',
    label: 'Reportes',
    leaf: { value: 'reportes', title: 'Reportes', description: 'Avance y cumplimiento por área.', icon: ChartLineData02Icon },
  },
]

export const LEAVES: (Leaf & { parent: string })[] = MENU.flatMap((entry) =>
  (entry.links ?? (entry.leaf ? [entry.leaf] : [])).map((leaf) => ({ ...leaf, parent: entry.value })),
)

export type Summary = {
  description: string
  cta: string
  stats: { label: string; value: string; note?: string }[]
  rows: { title: string; meta: string; status: string }[]
}

export const SUMMARIES: Record<string, Summary> = {
  cursos: {
    description: 'Crea, edita y publica los cursos de tu academia.',
    cta: 'Crear curso',
    stats: [
      { label: 'Publicados', value: '128', note: '6 publicados en septiembre' },
      { label: 'En borrador', value: '14', note: '3 con cambios de Orbit' },
      { label: 'Finalización promedio', value: '72%', note: 'De quienes empiezan un curso' },
    ],
    rows: [
      { title: 'Plan de onboarding para operarios', meta: 'Actualizado hoy · 12 lecciones', status: 'Borrador' },
      { title: 'Seguridad industrial básica', meta: 'Obligatorio · 1.180 inscritos', status: 'Publicado' },
      { title: 'Excel para análisis de datos', meta: 'Analítica · 342 inscritos', status: 'Publicado' },
      { title: 'Liderazgo de equipos remotos', meta: 'Líderes · 58 inscritos', status: 'Publicado' },
    ],
  },
  categorias: {
    description: 'Ordena el catálogo por temas para que cada persona encuentre lo suyo.',
    cta: 'Nueva categoría',
    stats: [
      { label: 'Categorías', value: '18', note: '4 con subcategorías' },
      { label: 'Cursos sin categoría', value: '9', note: 'Revisar antes de publicar' },
      { label: 'Más visitada', value: 'Tecnología', note: '2.310 visitas en septiembre' },
    ],
    rows: [
      { title: 'Tecnología', meta: '24 cursos', status: 'Visible' },
      { title: 'Liderazgo', meta: '16 cursos', status: 'Visible' },
      { title: 'Seguridad y salud en el trabajo', meta: '11 cursos', status: 'Visible' },
      { title: 'Idiomas', meta: '8 cursos', status: 'Oculta' },
    ],
  },
  universidad: {
    description: 'Escuelas y rutas que agrupan cursos por carrera dentro de la empresa.',
    cta: 'Nueva escuela',
    stats: [
      { label: 'Escuelas', value: '5', note: 'Comercial, Operaciones, Tecnología…' },
      { label: 'Rutas activas', value: '21' },
      { label: 'Personas en una ruta', value: '864', note: '71% de la empresa' },
    ],
    rows: [
      { title: 'Escuela Comercial', meta: '6 rutas · 212 personas', status: 'Activa' },
      { title: 'Escuela de Operaciones', meta: '5 rutas · 390 personas', status: 'Activa' },
      { title: 'Escuela de Tecnología', meta: '4 rutas · 146 personas', status: 'Activa' },
      { title: 'Escuela de Líderes', meta: '3 rutas · 58 personas', status: 'En diseño' },
    ],
  },
  'lms-ai': {
    description: 'Cursos que Orbit arma a partir de tus documentos, presentaciones y videos.',
    cta: 'Generar curso',
    stats: [
      { label: 'Generados', value: '23', note: 'Este trimestre' },
      { label: 'Esperando revisión', value: '4' },
      { label: 'Tiempo ahorrado', value: '96 h', note: 'Frente a crearlos desde cero' },
    ],
    rows: [
      { title: 'Política de vacaciones 2026', meta: 'Desde PDF · 6 lecciones', status: 'Por revisar' },
      { title: 'Protocolo de atención al cliente', meta: 'Desde presentación · 9 lecciones', status: 'Por revisar' },
      { title: 'Uso seguro de montacargas', meta: 'Desde video · 4 lecciones', status: 'Publicado' },
      { title: 'Código de ética', meta: 'Desde PDF · 5 lecciones', status: 'Publicado' },
    ],
  },
  planes: {
    description: 'Rutas obligatorias por cargo con fecha límite y seguimiento.',
    cta: 'Crear plan',
    stats: [
      { label: 'Planes activos', value: '12' },
      { label: 'Cumplimiento', value: '81%', note: 'Operaciones es la más atrasada' },
      { label: 'Vencen este mes', value: '3' },
    ],
    rows: [
      { title: 'Inducción corporativa 2026', meta: '1.212 personas · vence el 31 dic', status: '84% al día' },
      { title: 'Seguridad en planta', meta: '390 personas · vence el 30 sep', status: '67% al día' },
      { title: 'Ventas consultivas', meta: '212 personas · vence el 15 oct', status: '91% al día' },
      { title: 'Liderazgo para nuevos líderes', meta: '18 personas · vence el 30 nov', status: '40% al día' },
    ],
  },
  grupos: {
    description: 'Audiencias por área, sede o nivel para asignar planes y cursos.',
    cta: 'Nuevo grupo',
    stats: [
      { label: 'Grupos', value: '34' },
      { label: 'Se actualizan solos', value: '28', note: 'Sincronizados con Workday' },
      { label: 'Sin plan asignado', value: '6' },
    ],
    rows: [
      { title: 'Sede Bogotá', meta: '642 personas · automático', status: 'Sincronizado' },
      { title: 'Operarios de planta', meta: '390 personas · automático', status: 'Sincronizado' },
      { title: 'Líderes nuevos 2026', meta: '18 personas · manual', status: 'Manual' },
      { title: 'Equipo comercial Caribe', meta: '47 personas · automático', status: 'Sincronizado' },
    ],
  },
  descarga: {
    description: 'Genera certificados individuales o en lote para auditorías.',
    cta: 'Descargar lote',
    stats: [
      { label: 'Emitidos', value: '4.820', note: 'En 2026' },
      { label: 'Este mes', value: '312' },
      { label: 'Por vencer', value: '57', note: 'Vigencia de 1 año' },
    ],
    rows: [
      { title: 'Seguridad industrial básica', meta: '1.104 certificados', status: 'Vigentes' },
      { title: 'Manejo de alimentos', meta: '86 certificados', status: '57 por vencer' },
      { title: 'Inducción corporativa', meta: '1.020 certificados', status: 'Vigentes' },
      { title: 'Trabajo en alturas', meta: '64 certificados', status: 'Vigentes' },
    ],
  },
  configuracion: {
    description: 'Plantilla, firmas y vigencia de los certificados.',
    cta: 'Editar plantilla',
    stats: [
      { label: 'Plantillas', value: '3' },
      { label: 'Firmas', value: '2', note: 'Gestión humana y Presidencia' },
      { label: 'Vigencia por defecto', value: '1 año' },
    ],
    rows: [
      { title: 'Plantilla corporativa', meta: 'Usada en 96 cursos', status: 'Predeterminada' },
      { title: 'Plantilla SST', meta: 'Usada en 11 cursos', status: 'Activa' },
      { title: 'Plantilla para aliados', meta: 'Usada en 4 cursos', status: 'Activa' },
      { title: 'Firma de Presidencia', meta: 'Carlos Ortega', status: 'Activa' },
    ],
  },
  diagnostico: {
    description: 'Mide brechas de conocimiento antes de asignar formación.',
    cta: 'Nuevo diagnóstico',
    stats: [
      { label: 'Aplicados', value: '6' },
      { label: 'Participación', value: '88%' },
      { label: 'Brecha principal', value: 'Datos', note: 'Analítica y Finanzas' },
    ],
    rows: [
      { title: 'Habilidades digitales', meta: '1.004 respuestas', status: 'Cerrado' },
      { title: 'Conocimiento en SST', meta: '372 respuestas', status: 'Abierto' },
      { title: 'Inglés para ventas', meta: '96 respuestas', status: 'Abierto' },
      { title: 'Liderazgo 2026', meta: 'Programado para octubre', status: 'Borrador' },
    ],
  },
  reportes: {
    description: 'Avance, cumplimiento y horas de formación por área.',
    cta: 'Exportar reporte',
    stats: [
      { label: 'Horas de formación', value: '6.420 h', note: 'En 2026' },
      { label: 'Personas activas', value: '1.086', note: '90% de la empresa' },
      { label: 'Obligatorios al día', value: '81%' },
    ],
    rows: [
      { title: 'Avance por área', meta: 'Actualizado hoy', status: 'Diario' },
      { title: 'Cumplimiento de planes', meta: 'Actualizado hoy', status: 'Diario' },
      { title: 'Horas por persona', meta: 'Actualizado el lunes', status: 'Semanal' },
      { title: 'Satisfacción con los cursos', meta: 'Actualizado el 1 sep', status: 'Mensual' },
    ],
  },
}
