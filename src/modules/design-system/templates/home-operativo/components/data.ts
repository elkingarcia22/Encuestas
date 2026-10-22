import type { IconSvgElement } from '@hugeicons/react'
import {
  AiBrain01Icon,
  Alert02Icon,
  Award01Icon,
  Briefcase01Icon,
  BuildingIcon,
  Clock01Icon,
  GroupLayersIcon,
  Home01Icon,
  Layers01Icon,
  Megaphone02Icon,
  PaintBrush01Icon,
  SecurityLockIcon,
  TaskDone01Icon,
  UserGroupIcon,
  UserRemove01Icon,
} from '@hugeicons/core-free-icons'

import { sidebarNavs } from '@/shared/layouts/nav-config'

// Template «Home operativo»: el inicio del administrador que propuso producto
// (admin-ubits.netlify.app), armado con flux-ui. El alcance y el copy salen de las historias
// HU-INI-001 (dashboard), HU-INI-002 (navegación del Workspace) y HU-INI-003 (pie) de
// docs/plataforma-ubits. Los números son ilustrativos (HU-INI-001, «Excluye»).
// Ajustado con la revisión de diseño del 2026-09-11: Google como cliente, pestaña «Suite AI» y
// tres tarjetas de métricas con gráfica.

export const BASE = '/design-system/templates/home-operativo'
export const ruta = (pantalla: string) => `${BASE}/${pantalla}`

// ─────────────────────────── Empresa y persona ───────────────────────────

// La marca protagonista es la del cliente que compró UBITS; Google es el cliente de ejemplo
// (UBITS queda en el pie). Alpha, Beta y Omega son las sucursales del grupo.
// Licencias y créditos: usadas / total (HU-INI-002, RN-11).
export type Empresa = {
  id: string
  nombre: string
  inicial: string
  logo?: string
  licencias: [number, number]
  creditos: [number, number]
}

export const EMPRESAS: Empresa[] = [
  { id: 'google', nombre: 'Google', inicial: 'G', logo: '/google-logo.svg', licencias: [940, 1000], creditos: [25000, 45000] },
  { id: 'alpha', nombre: 'Alpha', inicial: 'A', licencias: [128, 150], creditos: [4200, 10000] },
  { id: 'beta', nombre: 'Beta', inicial: 'B', licencias: [312, 400], creditos: [18500, 20000] },
  { id: 'omega', nombre: 'Omega', inicial: 'O', licencias: [76, 100], creditos: [1900, 5000] },
]

export const PERSONA = {
  nombre: 'Carolina Vargas',
  corto: 'Carolina',
  iniciales: 'CV',
  correo: 'carolina.vargas@google.com',
  rol: 'Administradora',
  foto: 'https://i.pravatar.cc/160?img=32',
}

export const cifra = (n: number) => n.toLocaleString('es-CO')

export function saludo(hora = new Date().getHours()) {
  if (hora < 12) return 'Buenos días'
  if (hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
}


// ─────────────────────────── Menú lateral ───────────────────────────
// Orden de HU-INI-002: Inicio → Productos (Selección, Aprendizaje, Desempeño y cultura) →
// Herramientas (Tareas, Avisos internos, Agente de tu empresa). Aprendizaje tiene tercer nivel.

const iconos = sidebarNavs.admin.groups.flatMap((g) => g.items)
const iconoDe = (titulo: string) => iconos.find((i) => i.title === titulo)?.icon ?? Layers01Icon

export type Pantalla = { titulo: string; slug?: string; hijos?: Pantalla[] }
export type SeccionMenu = { titulo: string; icono: IconSvgElement; slug?: string; badge?: string; hijos?: Pantalla[] }

export const INICIO = { titulo: 'Inicio', icono: Home01Icon }

export const MENU: { etiqueta: string; secciones: SeccionMenu[] }[] = [
  {
    etiqueta: 'Productos',
    secciones: [
      {
        titulo: 'Selección',
        icono: iconoDe('Selección'),
        badge: 'Nuevo',
        hijos: [
          { titulo: 'Dashboard', slug: 'dashboard-seleccion' },
          { titulo: 'Onboarding', slug: 'onboarding' },
          { titulo: 'Vacantes', slug: 'vacantes' },
          { titulo: 'Plantillas', slug: 'plantillas' },
        ],
      },
      {
        titulo: 'Aprendizaje',
        icono: iconoDe('Aprendizaje'),
        hijos: [
          {
            titulo: 'LMS Creator',
            hijos: [
              { titulo: 'Contenidos', slug: 'contenidos' },
              { titulo: 'Categorías', slug: 'categorias' },
              { titulo: 'Universidad corporativa', slug: 'universidad-corporativa' },
              { titulo: 'LMS AI', slug: 'lms-ai' },
            ],
          },
          {
            titulo: 'Planes de Formación',
            hijos: [
              { titulo: 'Planes', slug: 'planes' },
              { titulo: 'Grupos', slug: 'grupos' },
            ],
          },
          {
            titulo: 'Certificados',
            hijos: [
              { titulo: 'Descarga', slug: 'descarga-certificados' },
              { titulo: 'Configuración', slug: 'configuracion-certificados' },
            ],
          },
          { titulo: 'Diagnóstico', slug: 'diagnostico' },
          { titulo: 'Reportes', slug: 'reportes' },
          { titulo: 'Métricas', slug: 'metricas' },
        ],
      },
      {
        titulo: 'Desempeño y cultura',
        icono: iconoDe('Desempeño y cultura'),
        hijos: [
          { titulo: 'Evaluaciones 360', slug: 'evaluaciones-360' },
          { titulo: 'Objetivos', slug: 'objetivos' },
          { titulo: 'Matriz de talento', slug: 'matriz-de-talento' },
          { titulo: 'PDI', slug: 'pdi' },
          { titulo: 'Encuestas', slug: 'encuestas' },
        ],
      },
    ],
  },
  {
    etiqueta: 'Herramientas',
    secciones: [
      { titulo: 'Tareas', icono: TaskDone01Icon, slug: 'tareas' },
      { titulo: 'Avisos internos', icono: Megaphone02Icon, slug: 'avisos-internos' },
      { titulo: 'Agente de tu empresa', icono: AiBrain01Icon, slug: 'agente-de-tu-empresa' },
    ],
  },
]

// Configuración vive en el menú de empresa, no en el menú lateral (HU-INI-002, RN-05).
export const CONFIGURACION = [
  { titulo: 'Gestión de usuarios', slug: 'gestion-de-usuarios', icono: UserGroupIcon },
  { titulo: 'Personalización', slug: 'personalizacion', icono: PaintBrush01Icon },
  { titulo: 'Organigrama', slug: 'organigrama', icono: GroupLayersIcon },
  { titulo: 'Datos de empresa', slug: 'datos-de-empresa', icono: BuildingIcon },
  { titulo: 'Roles y permisos', slug: 'roles-y-permisos', icono: SecurityLockIcon },
]

// Destinos que no están en el menú: se llega desde el encabezado o el menú de cuenta.
const EXTRAS: Record<string, string> = {
  conectores: 'Conectores',
  'centro-de-ayuda': 'Centro de ayuda',
}

// Dónde queda cada pantalla: para las migas y para el título de las que aún no tienen template.
export function ubicacionDe(slug: string): { titulo: string; camino: string[] } | null {
  for (const bloque of MENU) {
    for (const seccion of bloque.secciones) {
      if (seccion.slug === slug) return { titulo: seccion.titulo, camino: [] }
      for (const hijo of seccion.hijos ?? []) {
        if (hijo.slug === slug) return { titulo: hijo.titulo, camino: [seccion.titulo] }
        const nieto = hijo.hijos?.find((n) => n.slug === slug)
        if (nieto) return { titulo: nieto.titulo, camino: [seccion.titulo, hijo.titulo] }
      }
    }
  }
  const ajuste = CONFIGURACION.find((c) => c.slug === slug)
  if (ajuste) return { titulo: ajuste.titulo, camino: ['Configuración'] }
  const extra = EXTRAS[slug]
  return extra ? { titulo: extra, camino: [] } : null
}

export function migasDe(pathname: string): { etiqueta: string; ruta?: string }[] {
  const slug = pathname.replace(BASE, '').replace(/^\//, '').split('/')[0] ?? ''
  if (!slug) return [{ etiqueta: 'Inicio' }]
  const donde = ubicacionDe(slug)
  return [
    { etiqueta: 'Inicio', ruta: BASE },
    ...(donde?.camino ?? []).map((etiqueta) => ({ etiqueta })),
    { etiqueta: donde?.titulo ?? 'Pantalla no encontrada' },
  ]
}

// ─────────────────────────── Top métricas ───────────────────────────
// Solo dos periodos (HU-INI-001, RN-03). Valores ya formateados con separador local (RN-02).

export type Periodo = '7' | '30'

export const PERIODOS: { valor: Periodo; etiqueta: string }[] = [
  { valor: '7', etiqueta: 'Últimos 7 días' },
  { valor: '30', etiqueta: 'Últimos 30 días' },
]

// Tres métricas en una sola tarjeta con divisores (reunión del 2026-09-14): usuarios con ingreso,
// usuarios activos y tasa de terminación. Estructura de los indicadores del Inicio de Nicolás (template
// Suite AI) con el icono de información y el detalle debajo. La variación se retiró (auditoría del 5-oct).
export type Metrica = {
  id: string
  titulo: string
  valor: string
  // Ya no se pinta ni viene en los datos. Se deja opcional solo porque el Inicio del admin
  // (admin/inicio/components/metricas-periodo.ts) aún la pasa; se borra cuando ese archivo deje de pasarla.
  // Contexto bajo la cifra y lo que explica el icono de información.
  detalle: string
  ayuda: string
  // Puntos de la minigráfica: 12 en la semana (dos por día hábil aprox.) y uno por día en el mes.
  serie: number[]
}

// Serie diaria determinista que sube con pequeñas ondas, como las minigráficas de los indicadores del
// Inicio de Nicolás: se ven movidas sin depender de datos al azar.
function subida(dias: number, base: number, amplitud: number, pendiente: number, fase = 0) {
  return Array.from({ length: dias }, (_, i) =>
    Math.round((base + amplitud * Math.sin((i + fase) / 2.2) + amplitud * 0.4 * Math.cos((i + fase) / 1.3) + pendiente * i) * 100) / 100,
  )
}

// Las tres del prototipo corto (admin-short-ubits.netlify.app), con sus cifras y sus textos de ayuda.
const AYUDA = {
  ingreso: 'Usuarios que han iniciado sesión en la plataforma, del total de usuarios registrados.',
  activos: 'Usuarios que tuvieron actividad o interactuaron con contenidos durante el periodo seleccionado.',
  terminacion: 'Porcentaje de contenidos iniciados que fueron completados por los usuarios en el periodo.',
}

export const METRICAS: Record<Periodo, Metrica[]> = {
  '7': [
    { id: 'ingreso', titulo: 'Usuarios con ingreso', valor: cifra(268), detalle: `de ${cifra(444)} usuarios registrados`, ayuda: AYUDA.ingreso, serie: subida(12, 240, 6, 2.4, 1) },
    { id: 'activos', titulo: 'Usuarios activos en el periodo', valor: cifra(41), detalle: `de ${cifra(118)} con ingreso en el periodo`, ayuda: AYUDA.activos, serie: subida(12, 34, 1.5, 0.6, 3) },
    { id: 'terminacion', titulo: 'Tasa de terminación', valor: '29,8\u00a0%', detalle: `${cifra(94)} contenidos finalizados`, ayuda: AYUDA.terminacion, serie: subida(12, 31, 0.5, -0.12, 2) },
  ],
  '30': [
    { id: 'ingreso', titulo: 'Usuarios con ingreso', valor: cifra(321), detalle: `de ${cifra(444)} usuarios registrados`, ayuda: AYUDA.ingreso, serie: subida(30, 280, 7, 1.4, 1) },
    { id: 'activos', titulo: 'Usuarios activos en el periodo', valor: cifra(54), detalle: `de ${cifra(152)} con ingreso en el periodo`, ayuda: AYUDA.activos, serie: subida(30, 44, 2, 0.35, 3) },
    { id: 'terminacion', titulo: 'Tasa de terminación', valor: '32,5\u00a0%', detalle: `${cifra(137)} contenidos finalizados`, ayuda: AYUDA.terminacion, serie: subida(30, 30, 0.7, 0.09, 2) },
  ],
}

// ─────────────────────────── Necesita tu atención ───────────────────────────
// Mezcla destinos maduros y no maduros: el enlace existe aunque la pantalla esté vacía (RN-04).

export type Tono = 'urgente' | 'pronto' | 'neutro'

export type Glass = { nombre: string; categoria: string }

export type Atencion = {
  id: string
  titulo: string
  modulo: string
  detalle: string
  icono: IconSvgElement
  tono: Tono
  accion: string
  destino: string
}

export const ATENCION: Atencion[] = [
  { id: 'evaluaciones', titulo: '14 evaluaciones vencidas', modulo: 'Desempeño', detalle: 'vencieron el 5 de septiembre', icono: Alert02Icon, tono: 'urgente', accion: 'Revisar', destino: 'evaluaciones-360' },
  { id: 'encuestas', titulo: '3 encuestas cierran en 48 horas', modulo: 'Encuestas', detalle: 'menos del 50 % de respuesta', icono: Clock01Icon, tono: 'pronto', accion: 'Ver', destino: 'encuestas' },
  { id: 'inactivos', titulo: '27 colaboradores inactivos', modulo: 'Plataforma', detalle: 'sin sesión este mes', icono: UserRemove01Icon, tono: 'neutro', accion: 'Ver lista', destino: 'gestion-de-usuarios' },
  { id: 'certificados', titulo: '8 certificados por vencer', modulo: 'Certificados', detalle: 'antes del 30 de septiembre', icono: Award01Icon, tono: 'pronto', accion: 'Ver', destino: 'descarga-certificados' },
  { id: 'vacantes', titulo: '5 vacantes por aprobar', modulo: 'Selección', detalle: 'en tu bandeja de entrada', icono: Briefcase01Icon, tono: 'neutro', accion: 'Aprobar', destino: 'vacantes' },
  { id: 'planes', titulo: '2 planes sin asignaciones', modulo: 'Formación', detalle: 'más de 15 días sin colaboradores', icono: Layers01Icon, tono: 'neutro', accion: 'Asignar', destino: 'planes' },
]

// ─────────────────────────── Quick actions ───────────────────────────
// El título va en inglés en pantalla (HU-INI-001, RN-05).

// Cuatro atajos del prototipo (el usuario pidió 4 el 2026-09-14) en tarjetas con solo imagen Glass y
// título (reunión del 2026-09-14). Glass es ilustración, no icono de interfaz: vive en public/iconos-glass
// (Design system › Icons).
// «lineas»: el título partido en dos renglones, para que las cuatro tarjetas se lean parejas.
export const ACCIONES_RAPIDAS: { titulo: string; lineas: [string, string]; glass: Glass; destino: string }[] = [
  { titulo: 'Crear encuesta', lineas: ['Crear', 'encuesta'], glass: { nombre: 'glass-document', categoria: 'archivos' }, destino: 'encuestas' },
  { titulo: 'Gestionar usuarios', lineas: ['Gestionar', 'usuarios'], glass: { nombre: 'glass-profile', categoria: 'cuenta-y-seguridad' }, destino: 'gestion-de-usuarios' },
  { titulo: 'Métricas de aprendizaje', lineas: ['Métricas de', 'aprendizaje'], glass: { nombre: 'glass-chart', categoria: 'datos' }, destino: 'metricas' },
  { titulo: 'Publicar aviso', lineas: ['Publicar', 'aviso'], glass: { nombre: 'glass-volume', categoria: 'multimedia' }, destino: 'avisos-internos' },
]

// Módulos del formulario de Feedback.
export const MODULOS_FEEDBACK = ['Inicio', 'Aprendizaje', 'Diagnóstico', 'Desempeño', 'Encuestas', 'Selección', 'Empresa / Configuración', 'Otro']

// ─────────────────────────── Pantallas sin template ───────────────────────────
// Lo que existe hoy en UBITS (docs/plataforma-ubits, marcos B, C y D) y qué historia la
// especifica en el nuevo UBITS, si ya hay una.

export type Hoy = { hoy: string; ruta: string; que: string; estado?: string; hu?: string }

export const PENDIENTES: Record<string, Hoy> = {
  'dashboard-seleccion': { hoy: 'Dashboard de reclutamiento', ruta: '/recruitment/dashboard', que: 'Filtros por vacante, estado, país, seniority, periodo y reclutador. Tiempo de contratación, tasa de éxito, candidatos por vacante, embudo por etapa y ranking de vacantes.' },
  onboarding: { hoy: 'Sin pantalla equivalente', ruta: '—', que: 'Ítem nuevo de Selección. Hoy no existe una pantalla de onboarding en el administrador.' },
  vacantes: { hoy: 'Vacantes', ruta: '/recruitment/job/dashboard', que: 'Saluda con nombre, correo y empresa, y lista las vacantes con su estado.', estado: 'Vacío en la cuenta recorrida: «Todavía no tienes ninguna vacante creada».' },
  plantillas: { hoy: 'Plantillas de flujos', ruta: '/recruitment/workflows', que: 'Guardar un flujo del candidato para reutilizarlo.', estado: 'Vacío en la cuenta recorrida.' },
  contenidos: { hoy: 'LMS · gestión de contenidos', ruta: '/creator/catalog/:empresa', que: 'Buscador, vista en lista o tarjetas. Por contenido: duplicar, archivar y eliminar, cada uno con confirmación. 1.507 contenidos en la cuenta.', hu: 'HU-LMS-004 (listado) y HU-LMS-001 (crear contenido)' },
  categorias: { hoy: 'Sin pantalla equivalente', ruta: '—', que: 'Tercer nivel nuevo de LMS Creator. La historia todavía está pendiente.' },
  'universidad-corporativa': { hoy: 'Personalizar la universidad', ruta: '/university-customization/:empresa', que: 'Nombre, título, descripción e imagen de la universidad corporativa, con vista previa en vivo.' },
  'lms-ai': { hoy: 'Ai Studio', ruta: '/ai-studio/home/resources', que: 'Recursos generados con IA: generar video y generador de guion, con créditos y días restantes.' },
  planes: { hoy: 'Planes de formación', ruta: '/creator/training-plan/content-plan', que: 'Planes de contenidos y de competencias con fechas, avance y estado vigente o no vigente. 86 planes en la cuenta.', hu: 'HU-LMS-005' },
  grupos: { hoy: 'Grupos de usuarios', ruta: '/creator/groups', que: 'Agregar grupo y asistente de IA. Grupos automáticos por ciudad, país y nombre de usuario. 13 grupos en la cuenta.', hu: 'HU-LMS-006 y HU-LMS-009 (chat IA de grupos)' },
  'descarga-certificados': { hoy: 'Certificados', ruta: '/certificate-management/:empresa', que: 'Plantillas de certificado (UBITS y de la empresa) y descarga masiva.', hu: 'HU-LMS-007' },
  'configuracion-certificados': { hoy: 'Certificados', ruta: '/certificate-management/:empresa', que: 'Crear, editar y eliminar plantillas de certificado.' },
  diagnostico: { hoy: 'Diagnóstico del administrador', ruta: '/assessments/admin', que: 'Assessments de competencias.', estado: 'Módulo inactivo en la empresa recorrida.' },
  reportes: { hoy: 'Reporte mensual', ruta: '/tracking-report-settings/:empresa/student-report', que: 'Envío automático del reporte de estudio el primer día de cada mes, con vista previa y variante para líderes.' },
  metricas: { hoy: 'UBITS Metrics', ruta: '/admin-hr/metrics', que: 'Tablero de Power BI incrustado. Los permisos se gestionan desde Intranalytics.' },
  'evaluaciones-360': { hoy: 'Evaluaciones 360 del administrador', ruta: '/talent/360/admin', que: 'Crear evaluación, lista con estado borrador, en progreso o finalizada, y resultados generales. 28 evaluaciones en la cuenta.', hu: 'HU-DES-001 y HU-DES-002' },
  objetivos: { hoy: 'Objetivos del administrador', ruta: '/talent/goals/admin', que: 'Configuración de ciclos de objetivos.', estado: 'Vacío en la cuenta recorrida.' },
  'matriz-de-talento': { hoy: 'Matriz de talento', ruta: '/talent-matrix', que: 'Cruza evaluaciones 360 con objetivos: lista de análisis y «Crear análisis».', estado: 'Vacío en la cuenta recorrida.' },
  pdi: { hoy: 'Sin pantalla equivalente', ruta: '—', que: 'Plan de desarrollo individual: ítem nuevo de Desempeño y cultura.' },
  encuestas: { hoy: 'Encuestas del administrador', ruta: '/surveys/admin', que: 'Crear y comparar encuestas de cultura, riesgo psicosocial y acontecimientos traumáticos (NOM-035). 78 encuestas en la cuenta.' },
  tareas: { hoy: 'Tareas · seguimiento', ruta: '/tasks/tracking', que: 'Indicadores y tabla con siete filtros. En el nuevo UBITS abre el seguimiento de toda la empresa.', hu: 'HU-TAR-003' },
  'avisos-internos': { hoy: 'Comunicaciones', ruta: '/admin-hr/comunications', que: 'Publicaciones internas con filtros por fecha, autor y estado. Al activar una, llega por correo a toda la empresa.' },
  'agente-de-tu-empresa': { hoy: 'Sin pantalla equivalente', ruta: '—', que: 'Producto nuevo: un agente por empresa que responde con las colecciones de documentos que carga el administrador.', hu: 'HU-TRA-001 (borrador)' },
  'gestion-de-usuarios': { hoy: 'Gestión de usuarios', ruta: '/admin-hr/users', que: 'Acciones individuales y masivas, recordatorios de inicio de sesión y lista de usuarios. Los cambios masivos llegan por correo.' },
  personalizacion: { hoy: 'Sin pantalla equivalente', ruta: '—', que: 'Hoy solo se personaliza la universidad corporativa desde el Creator.' },
  organigrama: { hoy: 'Sin pantalla equivalente', ruta: '—', que: 'Destino nuevo del menú de empresa.' },
  'datos-de-empresa': { hoy: 'Detalle de empresa', ruta: '/admin-hr/companies/:id', que: 'Datos de la empresa, cursos propios y suscripción (MAX + LMS, licencias). Hoy lo usa el equipo interno de UBITS.' },
  'roles-y-permisos': { hoy: 'Roles y permisos', ruta: '/access-control/home', que: 'Crear rol, lista de roles con los productos que toca cada uno y descarga de la lista de usuarios.' },
  conectores: { hoy: 'Sin pantalla equivalente', ruta: '—', que: 'Conexiones de Orbit con Gmail, Slack y Google Drive, según el concepto de producto.' },
  'centro-de-ayuda': { hoy: 'Centro de ayuda', ruta: '/admin-hr/help-center', que: 'Mesa de soporte (soporte@ubits.co), equipo de expertos con agenda y novedades del producto.' },
}
