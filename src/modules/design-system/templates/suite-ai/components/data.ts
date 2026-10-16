import type { IconSvgElement } from '@hugeicons/react'
import {
  AnalyticsUpIcon,
  Briefcase01Icon,
  Building03Icon,
  ChartAverageIcon,
  CheckmarkSquare02Icon,
  HierarchyIcon,
  Home01Icon,
  LockPasswordIcon,
  Megaphone02Icon,
  Mortarboard01Icon,
  PaintBrush01Icon,
  Refresh01Icon,
  Shield01Icon,
  UserCircleIcon,
  UserGroupIcon,
  UserSearch01Icon,
} from '@hugeicons/core-free-icons'

// Datos del template «Suite AI»: el concepto de Nicolás García («Agente IA Ubits - Prototipo»,
// Claude Design) con sus textos tal cual. Todo es ilustrativo.

export const BASE = '/design-system/templates/suite-ai'
export const ruta = (slug = '') => (slug ? `${BASE}/${slug}` : BASE)

/* --------------------------------------------------------------- empresa */

export const ORGANIZACIONES = ['Meta Colombia', 'Meta México']
export const ESPACIOS = ['Administración', 'Colaborador']
export const LICENCIAS = { usadas: 940, total: 1000 }

export const PERSONA = {
  nombre: 'Carolina Vargas',
  primerNombre: 'Carolina',
  correo: 'carolina.vargas@meta.com',
  iniciales: 'CV',
  rol: 'Admin',
}

export const CONFIGURACION: { titulo: string; slug: string; icono: IconSvgElement }[] = [
  { titulo: 'Gestión de usuarios', slug: 'gestion-de-usuarios', icono: UserGroupIcon },
  { titulo: 'Personalización', slug: 'personalizacion', icono: PaintBrush01Icon },
  { titulo: 'Organigrama', slug: 'organigrama', icono: HierarchyIcon },
  { titulo: 'Datos de empresa', slug: 'datos-de-empresa', icono: Building03Icon },
  { titulo: 'Roles y permisos', slug: 'roles-y-permisos', icono: LockPasswordIcon },
]

/* ------------------------------------------------------ menú del Workspace */

export type Pantalla = { titulo: string; slug?: string; hijos?: Pantalla[] }
type Seccion = Pantalla & { icono: IconSvgElement; badge?: string }

export const INICIO = { titulo: 'Inicio', icono: Home01Icon }

export const MENU: { etiqueta: string; secciones: Seccion[] }[] = [
  {
    etiqueta: 'Productos',
    secciones: [
      {
        titulo: 'Selección',
        icono: UserSearch01Icon,
        badge: 'Nuevo',
        hijos: [
          { titulo: 'Dashboard', slug: 'seleccion' },
          { titulo: 'Onboarding', slug: 'onboarding' },
          { titulo: 'Vacantes', slug: 'vacantes' },
          { titulo: 'Plantillas', slug: 'plantillas' },
        ],
      },
      {
        titulo: 'Aprendizaje',
        icono: Mortarboard01Icon,
        hijos: [
          // Como en el concepto: LMS Creator abre el editor de contenido con el agente.
          { titulo: 'LMS Creator', slug: 'editor' },
          { titulo: 'Planes de Formación', slug: 'planes-de-formacion' },
          { titulo: 'Certificados', slug: 'certificados' },
          { titulo: 'Diagnóstico', slug: 'diagnostico' },
          { titulo: 'Reportes', slug: 'reportes' },
          { titulo: 'Métricas', slug: 'metricas' },
        ],
      },
      {
        titulo: 'Desempeño y cultura',
        icono: AnalyticsUpIcon,
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
      { titulo: 'Tareas', icono: CheckmarkSquare02Icon, slug: 'tareas' },
      { titulo: 'Avisos internos', icono: Megaphone02Icon, slug: 'avisos-internos' },
    ],
  },
]

// Dónde está cada pantalla del menú, para las migas y la pantalla «pendiente».
export function ubicacionDe(slug: string): { seccion?: string; titulo: string } | null {
  const ajuste = CONFIGURACION.find((a) => a.slug === slug)
  if (ajuste) return { seccion: 'Configuración', titulo: ajuste.titulo }
  for (const bloque of MENU) {
    for (const seccion of bloque.secciones) {
      if (seccion.slug === slug) return { titulo: seccion.titulo }
      const hijo = seccion.hijos?.find((h) => h.slug === slug)
      if (hijo) return { seccion: seccion.titulo, titulo: hijo.titulo }
    }
  }
  return null
}

/* ------------------------------------------------- historial de Suite AI */

export type Chat = { id: string; titulo: string; ruta: string }

export const HISTORIAL: { etiqueta: string; chats: Chat[] }[] = [
  {
    etiqueta: 'Hoy',
    chats: [
      { id: 'vacaciones', titulo: 'Política de vacaciones', ruta: ruta('chat/vacaciones') },
      { id: 'evaluaciones', titulo: 'Evaluaciones vencidas en Ventas', ruta: ruta('chat/evaluaciones') },
      // En el concepto este chat abre el editor del contenido con el agente al lado.
      { id: 'onboarding', titulo: 'Plan de onboarding para operarios', ruta: ruta('editor') },
      { id: 'rotacion', titulo: 'Riesgo de rotación Q3', ruta: ruta('chat/rotacion') },
    ],
  },
  {
    etiqueta: 'Esta semana',
    chats: [
      { id: 'clima', titulo: 'Resumen encuesta de clima', ruta: ruta('chat/clima') },
      { id: 'cursos', titulo: 'Cursos con baja satisfacción', ruta: ruta('chat/cursos') },
      { id: 'matriz', titulo: 'Matriz de talento de liderazgo', ruta: ruta('chat/matriz') },
    ],
  },
]

export type Mensaje = { id: string; autor: 'persona' | 'agente'; texto: string }

// Las respuestas del agente en el concepto, por palabra clave.
export function respuestaDe(texto: string, organizacion: string) {
  const t = texto.toLowerCase()
  if (t.includes('recordatorio'))
    return 'Preparé el recordatorio para las 24 evaluaciones vencidas. Se envía a los líderes, no a los evaluados. ¿Lo programo para mañana 8:00?'
  if (t.includes('líder') || t.includes('lider'))
    return 'Los 5 casos sin líder quedaron asignados al jefe de área. Actualicé la matriz y no envié notificaciones todavía.'
  if (t.includes('operaciones'))
    return 'Operaciones va en 84% de terminación con 12 vencidas. Ventas está 14 puntos abajo, concentrado en la sede Bogotá.'
  if (t.includes('rotación') || t.includes('rotacion'))
    return 'El riesgo de rotación Q3 se concentra en Ventas Bogotá: 18 personas con dos señales o más. Puedo preparar un plan de retención con foco en liderazgo.'
  if (t.includes('clima'))
    return 'La encuesta de clima cerró con 76% de participación. El puntaje más bajo es «reconocimiento» (3,1 de 5) en operaciones.'
  return `Listo. Revisé los datos de ${organizacion} dentro de tus permisos y preparé una respuesta corta. Puedo convertirlo en un plan asignable si lo necesitas.`
}

const par = (id: string, pregunta: string): Mensaje[] => [
  { id: `${id}-1`, autor: 'persona', texto: pregunta },
  { id: `${id}-2`, autor: 'agente', texto: respuestaDe(pregunta, ORGANIZACIONES[0]) },
]

// Chats del historial que no tienen un caso propio: arrancan con su primera pregunta.
export const CONVERSACIONES: Record<string, Mensaje[]> = {
  rotacion: par('rotacion', '¿Dónde está el mayor riesgo de rotación este trimestre?'),
  clima: par('clima', 'Resume la encuesta de clima de este mes.'),
  cursos: par('cursos', '¿Qué cursos tienen la satisfacción más baja?'),
  matriz: par('matriz', 'Muéstrame la matriz de talento de liderazgo.'),
}

export const ATAJOS_CHAT: { etiqueta: string; borrador?: string; ruta?: string; tono: 'primary' | 'muted' | 'warning' }[] = [
  { etiqueta: 'Plan de formación para Ventas', borrador: 'Prepárame un plan corto de feedback para los líderes de Ventas.', tono: 'primary' },
  { etiqueta: 'Evaluaciones vencidas', ruta: ruta('chat/evaluaciones'), tono: 'muted' },
  { etiqueta: 'Riesgo de rotación Q3', borrador: '¿Dónde está el mayor riesgo de rotación este trimestre?', tono: 'warning' },
]

export const CONECTORES = ['Gmail', 'Slack', 'Google Drive']

/* -------------------------------------------------------- notificaciones */

export type Notificacion = {
  id: string
  icono: IconSvgElement
  titulo: string
  texto: string
  cuando: string
  accion?: string
  destino: 'vacaciones' | 'procesos' | 'evaluaciones' | 'vacantes'
  nueva: boolean
}

export const NOTIFICACIONES: Notificacion[] = [
  { id: 'n1', icono: Megaphone02Icon, titulo: 'Aviso publicado', texto: '312 personas recibieron la política de vacaciones.', cuando: 'hace 8 min', accion: 'Ver el aviso', destino: 'vacaciones', nueva: true },
  { id: 'n2', icono: Refresh01Icon, titulo: 'Importación al 78%', texto: '234 de 300 filas cargadas, sin errores por ahora.', cuando: 'hace 22 min', accion: 'Abrir procesos', destino: 'procesos', nueva: true },
  { id: 'n3', icono: ChartAverageIcon, titulo: 'Ventas bajó a 70%', texto: 'La terminación de evaluaciones cayó 6 puntos esta semana.', cuando: 'hace 1 h', accion: 'Revisar', destino: 'evaluaciones', nueva: true },
  { id: 'n4', icono: UserCircleIcon, titulo: 'Andrés Malo aplicó', texto: 'Nuevo candidato para Analista de datos.', cuando: 'ayer', destino: 'vacantes', nueva: false },
]

/* -------------------------------------------------------------- novedades */

export const CAMBIO_SELECCION: { icono: IconSvgElement; texto: string }[] = [
  { icono: Briefcase01Icon, texto: 'Publica vacantes y mueve candidatos de etapa sin salir del chat.' },
  { icono: Shield01Icon, texto: 'Cada acción con efecto real te pide confirmación y dice a quién afecta.' },
  { icono: Refresh01Icon, texto: 'Los procesos largos siguen corriendo aunque cierres la conversación.' },
]

/* ------------------------------------------ caso 02: evaluaciones vencidas */

export const INDICADORES_EVALUACIONES = [
  { valor: '24', etiqueta: 'Vencidas' },
  { valor: '80', etiqueta: 'Asignadas' },
  { valor: '70%', etiqueta: 'Terminación' },
  { valor: '18 sep', etiqueta: 'Cierre del ciclo' },
]

export type FilaPlan = { id: string; titulo: string; detalle: string }

export const PLAN_INICIAL = {
  titulo: 'Feedback efectivo para líderes de Ventas',
  filas: [
    { id: 'f1', titulo: 'Conversaciones difíciles con el equipo', detalle: 'Curso · 45 min' },
    { id: 'f2', titulo: 'Retroalimentación basada en evidencia', detalle: 'Ruta · 2 h' },
    { id: 'f3', titulo: 'Taller práctico: sesión 1 a 1', detalle: 'Tarea · evidencia' },
  ] as FilaPlan[],
}

export const AUDIENCIAS_PLAN = ['14 líderes de Ventas', '32 líderes de toda la empresa', 'Selección manual · 0 personas']
export const FECHAS_PLAN = ['15 sep → 10 oct', '22 sep → 31 oct', '1 oct → 30 nov']

export const NOMBRES = [
  'Ana Ruiz', 'Carlos Peña', 'Diana Mora', 'Esteban Ríos', 'Felipe Cano', 'Gina Salas', 'Hugo Vélez',
  'Irene Prada', 'Jorge Amaya', 'Karen Ospina', 'Luis Tapia', 'Marta Quintero', 'Nicolás Ferro', 'Olga Bermúdez',
]

export const iniciales = (nombre: string) =>
  nombre
    .split(' ')
    .map((parte) => parte[0])
    .slice(0, 2)
    .join('')

/* ------------------------------------------ caso 05: política de vacaciones */

export type EstadoPaso = 'hecho' | 'ahora' | 'espera'
export type Paso = { titulo: string; detalle: string; estado: EstadoPaso; borrador?: boolean }
export type Actividad = { titulo: string; detalle: string; hora?: string; estado: EstadoPaso }

export const PASOS_INICIALES: Paso[] = [
  { titulo: 'Identificar la audiencia autorizada', detalle: '312 personas · sede Bogotá', estado: 'hecho' },
  { titulo: 'Redactar el aviso interno', detalle: 'Ver borrador', estado: 'hecho', borrador: true },
  { titulo: 'Publicar y notificar por correo', detalle: 'Requiere tu confirmación', estado: 'ahora' },
  { titulo: 'Asignar el curso «Política de vacaciones»', detalle: 'En espera', estado: 'espera' },
]

export const ACTIVIDAD_INICIAL: Actividad[] = [
  { titulo: 'Buscó la audiencia', detalle: 'Usuarios · filtro sede = Bogotá · 312 resultados', hora: '9:41 · 1,2 s', estado: 'hecho' },
  { titulo: 'Redactó el aviso', detalle: 'Tomó la política v3 del repositorio de la empresa', hora: '9:41 · 3,4 s', estado: 'hecho' },
  { titulo: 'Esperando confirmación', detalle: 'Publicar envía correo a 312 personas', estado: 'ahora' },
  { titulo: 'Asignación del curso', detalle: 'Se ejecuta después de publicar', estado: 'espera' },
]

export const BORRADOR_AVISO =
  'Desde el 1 de octubre cambia la forma de pedir vacaciones: la solicitud se hace con 15 días de anticipación y la aprueba tu líder directo en la plataforma. Los días acumulados no se pierden y puedes dividirlos en dos periodos al año. El curso «Política de vacaciones» explica el paso a paso en 8 minutos.'

export const SIN_CORREO = [
  { nombre: 'Julián Mena', detalle: 'correo rebotado' },
  { nombre: 'Rocío Cárdenas', detalle: 'sin correo' },
  { nombre: 'Tomás Pardo', detalle: 'correo inválido' },
]

/* ------------------------------------------------ caso 03: editor + agente */

export const CONTENIDO = {
  nombre: 'Onboarding operativo',
  descripcion: 'Curso de inducción para el área operativa. Incluye normas de seguridad y uso de equipos.',
}

export const PROPUESTAS = [
  'En seis lecciones cortas vas a reconocer los riesgos de tu área, aplicar el protocolo de seguridad y operar los equipos del turno sin supervisión. Al terminar recibes tu certificado de inducción.',
  'Seis lecciones de diez minutos para entrar a planta con criterio: qué puede fallar en tu línea, cómo se reporta y qué equipos puedes operar solo. Cierras con el certificado de inducción.',
  'Aprende, en seis lecciones, a identificar los riesgos de tu puesto, seguir el protocolo de seguridad y usar los equipos de tu turno. Al final validas todo con una práctica corta y tu certificado.',
]

export type Leccion = { id: string; titulo: string; detalle: string }

export const LECCIONES: Leccion[] = [
  { id: 'l1', titulo: 'Bienvenida y reglas del turno', detalle: 'Video · 6 min' },
  { id: 'l2', titulo: 'Riesgos de tu línea', detalle: 'Video · 9 min' },
  { id: 'l3', titulo: 'Protocolo de seguridad', detalle: 'Lectura · 12 min' },
  { id: 'l4', titulo: 'Uso de equipos', detalle: 'Video · 11 min' },
  { id: 'l5', titulo: 'Reporte de incidentes', detalle: 'Lectura · 8 min' },
  { id: 'l6', titulo: 'Práctica final', detalle: 'Tarea · evidencia' },
]

export const COMPETENCIAS = ['Seguridad operativa', 'Trabajo en equipo']
export const OTRAS_COMPETENCIAS = ['Comunicación', 'Orientación al detalle', 'Prevención de riesgos', 'Liderazgo de turno']

export const AUDIENCIAS_CONTENIDO = [
  { titulo: 'Operarios de planta', personas: 128, activa: true },
  { titulo: 'Turno tarde', personas: 46, activa: true },
  { titulo: 'Nuevos ingresos', personas: 12, activa: false },
]

export const EXTRAS = {
  resumen: {
    titulo: 'Resumen en 3 puntos',
    lineas: [
      'Reconocer los riesgos de tu línea antes de operar.',
      'Aplicar el protocolo de seguridad y reportar incidentes.',
      'Operar los equipos del turno sin supervisión.',
    ],
  },
  evaluacion: {
    titulo: 'Evaluación de 5 preguntas',
    lineas: [
      '¿Qué haces si un equipo suena distinto al arrancar?',
      '¿Cuándo se reporta un incidente menor?',
      '¿Qué EPP exige la línea 3?',
      '¿Quién autoriza operar sin supervisión?',
      '¿Dónde queda el registro del turno?',
    ],
  },
}

export const TONOS = ['claro', 'directo', 'cercano']

/* ----------------------------------------------------- caso 04: modo voz */

export const PREGUNTA_VOZ = 'Dime cómo va la participación de Ventas Bogotá este mes y qué debería hacer.'

export const TURNOS = [
  { turno: 'Mañana', valor: 71 },
  { turno: 'Tarde', valor: 46 },
  { turno: 'Noche', valor: 58 },
]

/* ---------------------------------------------------- vacantes y buscador */

export type VacanteSeleccion = { cargo: string; etapa: string; responsable: string; abierta: boolean }

export const VACANTES_SELECCION: VacanteSeleccion[] = [
  { cargo: 'Analista de datos', etapa: 'Entrevistas', responsable: 'Laura M.', abierta: true },
  { cargo: 'Analista financiero', etapa: 'Filtro inicial', responsable: 'Andrés P.', abierta: true },
  { cargo: 'Coordinador de turno', etapa: 'Oferta', responsable: 'Laura M.', abierta: true },
  { cargo: 'Auxiliar de bodega', etapa: 'Publicada', responsable: 'Sara G.', abierta: true },
  { cargo: 'Jefe de planta', etapa: 'Cerrada', responsable: 'Sara G.', abierta: false },
]

export const CANDIDATOS = [
  { nombre: 'Andrés Malo', detalle: 'Entrevista técnica' },
  { nombre: 'Lucía Cifuentes', detalle: 'Filtro inicial' },
  { nombre: 'Julián Rey', detalle: 'Prueba enviada' },
]

export const ESTADOS_VACANTE = ['abiertas', 'cerradas', 'todas'] as const
export type EstadoVacante = (typeof ESTADOS_VACANTE)[number]

/* -------------------------------------------------------- casos de uso */

// Los siete casos del concepto, para saltar entre ellos como en la barra de su prototipo.
export const CASOS = [
  { numero: '00', titulo: 'Inicio', ruta: ruta() },
  { numero: '01', titulo: 'Orbit Flow', ruta: ruta('chat') },
  { numero: '02', titulo: 'Propuesta editable', ruta: ruta('chat/evaluaciones') },
  { numero: '03', titulo: 'Editor + agente', ruta: ruta('editor') },
  { numero: '04', titulo: 'Modo voz', ruta: ruta('voz') },
  { numero: '05', titulo: 'Aprobación', ruta: ruta('chat/vacaciones') },
  { numero: '06', titulo: 'Buscador', ruta: ruta('vacantes'), buscador: 'vacantes de analista' },
]
