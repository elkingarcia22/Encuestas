import type { IconSvgElement } from '@hugeicons/react'
import {
  Analytics01Icon,
  Certificate01Icon,
  CheckmarkCircle02Icon,
  Home01Icon,
  Loading03Icon,
  LockIcon,
  MortarboardIcon,
  Pdf01Icon,
  PresentationBarChart02Icon,
  Quiz01Icon,
  TaskDone01Icon,
  TextIcon,
  Video01Icon,
} from '@hugeicons/core-free-icons'

// Datos del template Colaborador. Salen del recorrido «Estudiar un contenido asignado» del grafo
// de la plataforma (docs/plataforma-ubits) y de las historias de Aprendizaje del colaborador.
// Persona demo de la especificación: María Alejandra Sánchez Pardo (E006). La empresa es Google,
// el cliente de ejemplo que se decidió en la revisión de diseño del 2026-09-11 (la HU dice Google).

export const BASE = '/design-system/templates/colaborador'

export const EMPRESA = { nombre: 'Google', inicial: 'G', logo: '/google-logo.svg', licencias: 646 }

export const PERSONA = {
  nombre: 'María Alejandra Sánchez Pardo',
  corto: 'María Alejandra',
  codigo: 'E006',
  cargo: 'Líder de experiencia al cliente',
  area: 'Servicio al cliente',
  sede: 'Bogotá',
  correo: 'maria.sanchez@google.com',
  foto: 'https://i.pravatar.cc/160?img=47',
  lider: { nombre: 'Daniela Soto', cargo: 'Gerente de operaciones', foto: 'https://i.pravatar.cc/80?img=45' },
}

// ─────────────────────────── Menú lateral ───────────────────────────
// El del nuevo UBITS especificado: Inicio → Productos → Herramientas (docs 12).

export type ItemMenu = { titulo: string; ruta: string }
export type GrupoMenu = { titulo: string; icono: IconSvgElement; hijos: ItemMenu[] }

export const INICIO: ItemMenu & { icono: IconSvgElement } = { titulo: 'Inicio', ruta: '', icono: Home01Icon }

export const MENU: { etiqueta: string; grupos: GrupoMenu[] }[] = [
  {
    etiqueta: 'Productos',
    grupos: [
      {
        titulo: 'Aprendizaje',
        icono: MortarboardIcon,
        hijos: [
          { titulo: 'Modo estudio AI', ruta: 'modo-estudio-ai' },
          { titulo: 'Catálogo', ruta: 'catalogo' },
          { titulo: 'Universidad corporativa', ruta: 'universidad-corporativa' },
          { titulo: 'Zona de estudio', ruta: 'zona-de-estudio' },
          { titulo: 'Progreso', ruta: 'progreso' },
          { titulo: 'Métricas', ruta: 'metricas' },
          { titulo: 'Diagnóstico', ruta: 'diagnostico' },
        ],
      },
      {
        titulo: 'Desempeño y cultura',
        icono: Analytics01Icon,
        hijos: [
          { titulo: 'Evaluaciones 360', ruta: 'evaluaciones-360' },
          { titulo: 'Objetivos', ruta: 'objetivos' },
          { titulo: 'Matriz de talento', ruta: 'matriz-de-talento' },
          { titulo: 'Encuestas', ruta: 'encuestas' },
        ],
      },
    ],
  },
  {
    etiqueta: 'Herramientas',
    grupos: [
      {
        titulo: 'Tareas',
        icono: TaskDone01Icon,
        hijos: [
          { titulo: 'Tareas', ruta: 'tareas' },
          { titulo: 'Planes', ruta: 'tareas-planes' },
          { titulo: 'Plantillas', ruta: 'tareas-plantillas' },
          { titulo: 'Seguimiento', ruta: 'tareas-seguimiento' },
        ],
      },
    ],
  },
]

// Qué entrada del menú queda activa para cada pantalla. La ficha de un contenido se abre desde
// Zona de estudio (recorrido «Estudiar un contenido asignado»), así que la marca a ella.
export function seccionActual(pathname: string) {
  const primera = pathname.replace(BASE, '').replace(/^\//, '').split('/')[0] ?? ''
  return primera === 'contenido' ? 'zona-de-estudio' : primera
}

// Migas de pan: Inicio › grupo del menú › pantalla › contenido abierto.
export function migasDe(pathname: string): { etiqueta: string; ruta?: string }[] {
  const partes = pathname.replace(BASE, '').split('/').filter(Boolean)
  const lista: { etiqueta: string; ruta?: string }[] = [{ etiqueta: 'Inicio', ruta: partes.length ? BASE : undefined }]
  if (!partes.length) return lista
  if (partes[0] === 'contenido') {
    lista.push({ etiqueta: 'Aprendizaje' }, { etiqueta: 'Zona de estudio', ruta: `${BASE}/zona-de-estudio` })
    lista.push({ etiqueta: contenidoPorId(partes[1])?.titulo ?? 'Contenido' })
    return lista
  }
  for (const seccion of MENU) {
    for (const grupo of seccion.grupos) {
      const hijo = grupo.hijos.find((h) => h.ruta === partes[0])
      if (hijo) {
        lista.push({ etiqueta: grupo.titulo }, { etiqueta: hijo.titulo })
        return lista
      }
    }
  }
  return lista
}

// Pantallas del menú que todavía no tienen template: se muestra lo que el grafo sabe de ellas.
export const PENDIENTES: Record<string, { hoy: string; ruta: string; que: string; estado?: string; recorrido?: string }> = {
  'modo-estudio-ai': { hoy: 'Modo estudio IA', ruta: '/learn-ia', que: 'Tutor de IA en chat: quiz, flashcards y podcast.', estado: 'No cargaba en la cuenta recorrida.' },
  'universidad-corporativa': { hoy: 'Universidad corporativa', ruta: '/university', que: 'Catálogo con el nombre de la empresa: portada personalizable, filtros y 252 contenidos propios.' },
  metricas: { hoy: 'Métricas del colaborador', ruta: '—', que: 'Sin pantalla equivalente hoy; la especificación la deja sin historia.' },
  diagnostico: { hoy: 'Mis assessments', ruta: '/assessments', que: '«No tienes assessments disponibles».', estado: 'Módulo inactivo en esta empresa.' },
  'evaluaciones-360': { hoy: 'Evaluaciones 360 del colaborador', ruta: '/talent/360', que: 'Las evaluaciones por responder y los resultados.', estado: 'Vacío en la cuenta recorrida.', recorrido: 'Cerrar un ciclo de desempeño' },
  objetivos: { hoy: 'Objetivos del colaborador', ruta: '/talent/goals/own', que: 'Lista de objetivos del ciclo y ayuda.', estado: 'Vacío en la cuenta recorrida.', recorrido: 'Cerrar un ciclo de desempeño' },
  'matriz-de-talento': { hoy: 'Matriz de talento', ruta: '/talent-matrix', que: 'Cruza evaluaciones 360 con objetivos.', estado: 'Sin datos en la cuenta recorrida.', recorrido: 'Cerrar un ciclo de desempeño' },
  encuestas: { hoy: 'Mis encuestas', ruta: '/surveys', que: 'Encuestas asignadas por responder.', estado: 'Vacío en la cuenta recorrida.' },
  tareas: { hoy: 'Tareas · agenda', ruta: '/tasks/individual', que: 'Agenda día por día con «Agregar tarea» en línea.' },
  'tareas-planes': { hoy: 'Tareas · planes', ruta: '/tasks/group', que: 'Grupos de tareas. «¡Crea tu primer plan!».' },
  'tareas-plantillas': { hoy: 'Tareas · plantillas', ruta: '/tasks/templates', que: 'Planes reutilizables para procesos que se repiten.' },
  'tareas-seguimiento': { hoy: 'Tareas · seguimiento', ruta: '/tasks/tracking', que: 'Indicadores y tabla con siete filtros; vista líder.', recorrido: 'Cerrar un ciclo de desempeño' },
}

// ─────────────────────────── Contenidos ───────────────────────────

// Los 13 tipos del catálogo UBITS (marco A del recorrido).
export const TIPOS = [
  'Curso',
  'Short',
  'Charla',
  'Artículo',
  'Podcast',
  'Libro',
  'Ideas de libro',
  'Caso de estudio',
  'Documento técnico',
  'Práctica',
  'Juego',
  'Ruta',
  'Programa',
] as const

export type Tipo = (typeof TIPOS)[number]
export type Nivel = 'Básico' | 'Intermedio' | 'Avanzado'
export type EstadoContenido = 'Sin iniciar' | 'En progreso' | 'Completado'

export type Contenido = {
  id: string
  titulo: string
  tipo: Tipo
  nivel: Nivel
  duracion: string
  idioma: 'Español' | 'Inglés' | 'Portugués'
  proveedor: string
  imagen: string
  descripcion: string
  avance: number
  certificado: boolean
  origen: 'UBITS' | 'Google'
  valoracion: number
}

const foto = (semilla: string) => `https://picsum.photos/seed/ubits-${semilla}/640/360`

type Fila = [string, string, Tipo, Nivel, string, Contenido['idioma'], string, number, boolean, Contenido['origen'], number, string]

// [id, título, tipo, nivel, duración, idioma, proveedor, avance, certificado, origen, valoración, descripción]
const FILAS: Fila[] = [
  ['onboarding-comercial', 'Onboarding comercial Q3', 'Curso', 'Básico', '2 h 30 min', 'Español', 'Google', 62, true, 'Google', 4.7, 'El proceso comercial de Google de punta a punta: portafolio, etapas de la venta, casos de éxito y cómo responder las objeciones más frecuentes.'],
  ['seguridad-informacion', 'Seguridad de la información 2026', 'Curso', 'Básico', '45 min', 'Español', 'Google', 100, true, 'Google', 4.5, 'Contraseñas, phishing y manejo de datos de clientes. Obligatorio para toda la empresa.'],
  ['atencion-omnicanal', 'Atención al cliente omnicanal', 'Curso', 'Intermedio', '3 h', 'Español', 'UBITS', 0, true, 'UBITS', 4.8, 'Cómo sostener una conversación con el cliente entre chat, teléfono, correo y tienda sin que tenga que repetir su caso.'],
  ['comunicacion-remota', 'Comunicación asertiva en equipos remotos', 'Charla', 'Básico', '18 min', 'Español', 'TED', 40, false, 'UBITS', 4.6, 'Una charla corta sobre cómo decir lo difícil por escrito y en videollamada sin romper la confianza del equipo.'],
  ['negociacion-5', 'Negociación en 5 minutos', 'Short', 'Básico', '5 min', 'Español', 'Wobi', 100, false, 'UBITS', 4.4, 'Tres preguntas para entrar a cualquier negociación sabiendo qué puedes ceder y qué no.'],
  ['caso-sodimac', 'Caso Sodimac: servicio en tienda', 'Caso de estudio', 'Intermedio', '25 min', 'Español', 'UBITS', 0, false, 'UBITS', 4.7, 'Cómo una cadena de tiendas redujo los reclamos un 30 % cambiando el primer minuto de atención.'],
  ['excel-datos', 'Excel para análisis de datos', 'Curso', 'Intermedio', '4 h', 'Español', 'Microsoft', 0, true, 'UBITS', 4.9, 'Tablas dinámicas, BUSCARX y gráficos para responder preguntas del negocio con los datos que ya tienes.'],
  ['liderazgo-situacional', 'Liderazgo situacional', 'Ruta', 'Avanzado', '6 h', 'Español', 'Harvard ManageMentor', 15, true, 'UBITS', 4.8, 'Una ruta de cuatro contenidos para ajustar tu estilo de liderazgo a la madurez de cada persona del equipo.'],
  ['habitos-atomicos', 'Hábitos atómicos', 'Ideas de libro', 'Básico', '15 min', 'Español', 'UBITS', 100, false, 'UBITS', 4.6, 'Las ideas centrales del libro de James Clear en quince minutos: cómo los cambios pequeños se acumulan.'],
  ['nube-fundamentos', 'Fundamentos de la nube', 'Curso', 'Básico', '2 h', 'Inglés', 'AWS', 0, true, 'UBITS', 4.5, 'Qué es la nube, sus modelos de servicio y cómo se paga por lo que se usa.'],
  ['linux-intro', 'Introducción a Linux', 'Curso', 'Intermedio', '5 h', 'Inglés', 'The Linux Foundation', 0, true, 'UBITS', 4.7, 'La terminal, los permisos y los comandos que se usan todos los días en un servidor.'],
  ['futuro-trabajo', 'El futuro del trabajo', 'Podcast', 'Básico', '32 min', 'Español', 'Wobi', 0, false, 'UBITS', 4.3, 'Una conversación sobre qué tareas cambia la IA en los equipos de servicio y cuáles no.'],
  ['retroalimentacion', 'Cómo dar retroalimentación que sirva', 'Artículo', 'Básico', '8 min', 'Español', 'Harvard Business Review', 0, false, 'UBITS', 4.6, 'El modelo situación-comportamiento-impacto con ejemplos para conversaciones de uno a uno.'],
  ['ia-lideres', 'Inteligencia artificial para líderes', 'Programa', 'Avanzado', '8 semanas', 'Español', 'UBITS', 0, true, 'UBITS', 4.9, 'Un programa con sesiones en vivo para decidir dónde usar IA en tu área y cómo medir su impacto.'],
  ['simulador-ventas', 'Simulador de ventas consultivas', 'Práctica', 'Intermedio', '20 min', 'Español', 'UBITS', 0, false, 'UBITS', 4.5, 'Practica una llamada con un cliente difícil y recibe retroalimentación de cada respuesta.'],
  ['reto-ciberseguridad', 'Reto de ciberseguridad', 'Juego', 'Básico', '10 min', 'Español', 'UBITS', 0, false, 'UBITS', 4.4, 'Detecta los correos falsos antes de que se acabe el tiempo.'],
  ['guia-sql', 'Guía técnica de SQL', 'Documento técnico', 'Avanzado', '40 min', 'Inglés', 'Microsoft', 0, false, 'UBITS', 4.2, 'Consultas, uniones y funciones de ventana con ejemplos listos para copiar.'],
  ['inteligencia-emocional', 'Inteligencia emocional', 'Libro', 'Intermedio', '4 h', 'Español', 'UBITS', 0, false, 'UBITS', 4.7, 'El libro completo de Daniel Goleman en formato de lectura guiada.'],
  ['acoso-laboral', 'Prevención del acoso laboral', 'Curso', 'Básico', '1 h', 'Español', 'Google', 0, true, 'Google', 4.6, 'Qué es, cómo se reporta y qué protege a quien denuncia. Obligatorio por ley.'],
]

export const CONTENIDOS: Contenido[] = FILAS.map(
  ([id, titulo, tipo, nivel, duracion, idioma, proveedor, avance, certificado, origen, valoracion, descripcion]) => ({
    id,
    titulo,
    tipo,
    nivel,
    duracion,
    idioma,
    proveedor,
    imagen: foto(id),
    descripcion,
    avance,
    certificado,
    origen,
    valoracion,
  }),
)

export const contenidoPorId = (id: string | undefined) => CONTENIDOS.find((c) => c.id === id)

export const estadoDe = (contenido: Contenido): EstadoContenido =>
  contenido.avance >= 100 ? 'Completado' : contenido.avance > 0 ? 'En progreso' : 'Sin iniciar'

// Aliados destacados del catálogo (marco A).
export const ALIADOS = ['Harvard ManageMentor', 'TED', 'Wobi', 'AWS', 'Microsoft', 'The Linux Foundation']

export const MAS_BUSCADO = ['Excel', 'Liderazgo', 'Servicio al cliente', 'Inteligencia artificial', 'Negociación', 'Inglés']

// ─────────────────────────── Zona de estudio ───────────────────────────

export type Plan = {
  id: string
  nombre: string
  tipo: 'Plan de contenidos' | 'Plan de competencias'
  inicio: string
  cierre: string
  asignadoPor: string
  contenidos: string[]
}

export const PLANES: Plan[] = [
  {
    id: 'crecimiento-comercial',
    nombre: 'Ruta de crecimiento comercial 2026-II',
    tipo: 'Plan de contenidos',
    inicio: '2026-08-01',
    cierre: '2026-09-30',
    asignadoPor: 'Gabriela Nieto · Formación',
    contenidos: ['onboarding-comercial', 'seguridad-informacion', 'atencion-omnicanal', 'negociacion-5', 'comunicacion-remota', 'caso-sodimac'],
  },
  {
    id: 'cumplimiento-2026',
    nombre: 'Cumplimiento normativo 2026',
    tipo: 'Plan de contenidos',
    inicio: '2026-07-01',
    cierre: '2026-10-15',
    asignadoPor: 'Lucía Ortega · Recursos Humanos',
    contenidos: ['seguridad-informacion', 'acoso-laboral'],
  },
]

export const EXCLUSIVO = ['liderazgo-situacional', 'ia-lideres', 'retroalimentacion']

export type Terminado = { id: string; terminado: string; nota: number | null; certificado: boolean }

export const HISTORIAL: Terminado[] = [
  { id: 'negociacion-5', terminado: '2026-09-02', nota: null, certificado: false },
  { id: 'seguridad-informacion', terminado: '2026-08-20', nota: 92, certificado: true },
  { id: 'habitos-atomicos', terminado: '2026-07-15', nota: null, certificado: false },
]

// Plan de un contenido: completados sobre total.
export function avanceDePlan(plan: Plan) {
  const items = plan.contenidos.map((id) => contenidoPorId(id)).filter((c): c is Contenido => !!c)
  const hechos = items.filter((c) => c.avance >= 100).length
  const promedio = Math.round(items.reduce((suma, c) => suma + c.avance, 0) / Math.max(items.length, 1))
  return { items, hechos, total: items.length, promedio }
}

// ─────────────────────────── Experiencia de estudio ───────────────────────────

export type TipoPagina = 'Video' | 'PDF' | 'Presentación' | 'Evaluación' | 'Texto' | 'Fin'
export type Pagina = { titulo: string; tipo: TipoPagina; duracion: string; seccion: string }

// El contenido demo: 8 páginas, navegación lineal, con certificado. María va por la 5.
export const PAGINAS: Pagina[] = [
  { titulo: 'Bienvenida', tipo: 'Video', duracion: '4 min', seccion: 'Sección 1 · Conocer Google' },
  { titulo: 'Nuestro portafolio', tipo: 'PDF', duracion: '10 min', seccion: 'Sección 1 · Conocer Google' },
  { titulo: 'Proceso comercial', tipo: 'Presentación', duracion: '25 min', seccion: 'Sección 1 · Conocer Google' },
  { titulo: 'Evaluación Sección 1', tipo: 'Evaluación', duracion: '10 preguntas', seccion: 'Sección 1 · Conocer Google' },
  { titulo: 'Casos de éxito', tipo: 'Texto', duracion: '12 min', seccion: 'Sección 2 · Vender' },
  { titulo: 'Objeciones frecuentes', tipo: 'Video', duracion: '8 min', seccion: 'Sección 2 · Vender' },
  { titulo: 'Evaluación Sección 2', tipo: 'Evaluación', duracion: '3 preguntas', seccion: 'Sección 2 · Vender' },
  { titulo: 'Fin del contenido', tipo: 'Fin', duracion: 'Certificado', seccion: 'Cierre' },
]

export const PAGINAS_COMPLETADAS = 4

export const ICONO_TIPO: Record<TipoPagina, IconSvgElement> = {
  Video: Video01Icon,
  PDF: Pdf01Icon,
  Presentación: PresentationBarChart02Icon,
  Evaluación: Quiz01Icon,
  Texto: TextIcon,
  Fin: Certificate01Icon,
}

export type EstadoPagina = 'Visto' | 'Pendiente' | 'Bloqueado'

export const ICONO_ESTADO: Record<EstadoPagina, IconSvgElement> = {
  Visto: CheckmarkCircle02Icon,
  Pendiente: Loading03Icon,
  Bloqueado: LockIcon,
}

// Navegación lineal (por defecto): lo hecho se ve, la siguiente queda pendiente y el resto,
// bloqueado.
export const estadoPagina = (indice: number, completadas: number): EstadoPagina =>
  indice < completadas ? 'Visto' : indice === completadas ? 'Pendiente' : 'Bloqueado'

// Páginas de cualquier contenido: el demo tiene las suyas; al resto se le arma un recorrido
// corto según su tipo, y las completadas salen de su avance.
export function paginasDe(contenido: Contenido): { paginas: Pagina[]; completadas: number } {
  if (contenido.id === 'onboarding-comercial') return { paginas: PAGINAS, completadas: PAGINAS_COMPLETADAS }
  const principal: TipoPagina = ['Podcast', 'Charla', 'Short', 'Curso'].includes(contenido.tipo) ? 'Video' : contenido.tipo === 'Documento técnico' ? 'PDF' : 'Texto'
  const paginas: Pagina[] = [
    { titulo: 'Introducción', tipo: 'Video', duracion: '3 min', seccion: 'Contenido' },
    { titulo: contenido.titulo, tipo: principal, duracion: contenido.duracion, seccion: 'Contenido' },
    { titulo: 'Pon a prueba lo aprendido', tipo: 'Evaluación', duracion: '3 preguntas', seccion: 'Contenido' },
    { titulo: 'Fin del contenido', tipo: 'Fin', duracion: contenido.certificado ? 'Certificado' : 'Cierre', seccion: 'Cierre' },
  ]
  const completadas = contenido.avance >= 100 ? paginas.length : Math.floor((contenido.avance / 100) * (paginas.length - 1))
  return { paginas, completadas }
}

export const APRENDERAS = [
  'Presentar el portafolio de Google en menos de cinco minutos',
  'Llevar una oportunidad por las cinco etapas del proceso comercial',
  'Responder las cinco objeciones que más frenan una venta',
  'Registrar cada paso para que el equipo pueda retomarlo',
]

export const PREGUNTAS = [
  {
    enunciado: '¿Qué haces primero cuando un cliente dice «está muy caro»?',
    opciones: ['Ofrecer un descuento de inmediato', 'Preguntar con qué lo está comparando', 'Cambiar de tema a otro producto'],
    correcta: 1,
  },
  {
    enunciado: '¿Cuándo se registra una oportunidad en el CRM?',
    opciones: ['Al cerrar la venta', 'Después de la primera conversación con interés', 'Solo si el cliente lo pide'],
    correcta: 1,
  },
  {
    enunciado: 'Un cliente pide pensarlo. ¿Qué es lo más útil?',
    opciones: ['Acordar una fecha y qué va a revisar', 'Enviar el mismo correo cada día', 'Dar por perdida la oportunidad'],
    correcta: 0,
  },
]

// ─────────────────────────── Inicio ───────────────────────────

export const TAREAS = [
  { id: 't1', titulo: 'Firmar la política de datos personales', plan: 'Cumplimiento normativo 2026', vence: 'Vence hoy', urgente: true },
  { id: 't2', titulo: 'Hacer la autoevaluación 360°', plan: 'Evaluación de desempeño 2026-II', vence: 'Vence en 5 días', urgente: false },
  { id: 't3', titulo: 'Agendar la reunión 1:1 con Daniela', plan: 'Cierre de ciclo de desempeño', vence: '18 sept', urgente: false },
  { id: 't4', titulo: 'Entregar evidencias del PDI', plan: 'Plan de desarrollo de líderes', vence: '25 sept', urgente: false },
]

export const NOTICIAS = [
  {
    id: 'n1',
    autor: 'Lucía Ortega',
    rol: 'Recursos Humanos',
    foto: 'https://i.pravatar.cc/80?img=32',
    hace: 'Hace 2 horas',
    titulo: 'Cierre de año 2026: fechas clave',
    texto: 'Las evaluaciones 360° cierran el 30 de septiembre y la encuesta de clima el 20. Revisa en tu inicio lo que tienes pendiente.',
    imagen: foto('noticia-cierre'),
    meGusta: 24,
    celebrar: 8,
  },
  {
    id: 'n2',
    autor: 'Isabel Fuentes',
    rol: 'Operaciones',
    foto: 'https://i.pravatar.cc/80?img=44',
    hace: 'Ayer',
    titulo: 'Abrimos la sucursal Omega',
    texto: 'Desde el lunes atendemos en Medellín. Gracias a los 18 compañeros que se sumaron este mes.',
    imagen: null,
    meGusta: 51,
    celebrar: 33,
  },
]

export const PENDIENTES_DESEMPENO = [
  { id: 'p1', titulo: 'Evaluación de desempeño 2026-II', detalle: '2 de 5 evaluaciones respondidas', estado: 'Cierra el 30 sept', tono: 'warning-light' as const, tipo: '360' as const },
  { id: 'p2', titulo: 'Encuesta de clima 2026', detalle: '12 preguntas · 6 minutos', estado: 'Cierra el 20 sept', tono: 'info-light' as const, tipo: 'encuesta' as const },
  { id: 'p3', titulo: 'Objetivos del ciclo 2026-II', detalle: '3 objetivos · 45 % de avance', estado: 'En curso', tono: 'secondary' as const, tipo: 'objetivos' as const },
]

// ─────────────────────────── Progreso (vista líder) ───────────────────────────

export type Integrante = {
  id: string
  nombre: string
  cargo: string
  foto: string
  horasMes: number
  terminados: number
  certificados: number
  planes: { nombre: string; cierre: string; avance: number }[]
}

export const EQUIPO: Integrante[] = [
  {
    id: 'maria',
    nombre: PERSONA.nombre,
    cargo: PERSONA.cargo,
    foto: PERSONA.foto,
    horasMes: 12.5,
    terminados: 7,
    certificados: 5,
    planes: [
      { nombre: 'Ruta de crecimiento comercial 2026-II', cierre: '2026-09-30', avance: 50 },
      { nombre: 'Cumplimiento normativo 2026', cierre: '2026-10-15', avance: 50 },
    ],
  },
  { id: 'carlos', nombre: 'Carlos Pérez', cargo: 'Asesor comercial', foto: 'https://i.pravatar.cc/80?img=12', horasMes: 9, terminados: 4, certificados: 3, planes: [{ nombre: 'Ruta de crecimiento comercial 2026-II', cierre: '2026-09-30', avance: 62 }] },
  { id: 'laura', nombre: 'Laura Gómez', cargo: 'Asesora comercial', foto: 'https://i.pravatar.cc/80?img=5', horasMes: 6.5, terminados: 3, certificados: 2, planes: [{ nombre: 'Ruta de crecimiento comercial 2026-II', cierre: '2026-09-30', avance: 50 }] },
  { id: 'nicolas', nombre: 'Nicolás Peña', cargo: 'Analista de servicio', foto: 'https://i.pravatar.cc/80?img=13', horasMes: 4, terminados: 2, certificados: 1, planes: [{ nombre: 'Cumplimiento normativo 2026', cierre: '2026-10-15', avance: 50 }] },
  { id: 'diego', nombre: 'Diego Ferrer', cargo: 'Ejecutivo comercial', foto: 'https://i.pravatar.cc/80?img=15', horasMes: 2.5, terminados: 1, certificados: 0, planes: [{ nombre: 'Onboarding comercial Q3', cierre: '2026-09-20', avance: 25 }] },
  { id: 'carolina', nombre: 'Carolina Ríos', cargo: 'Community manager', foto: 'https://i.pravatar.cc/80?img=9', horasMes: 0, terminados: 0, certificados: 0, planes: [] },
]

export const RANKING_PERSONAS = [
  { nombre: 'Álvaro Guzmán', area: 'Ingeniería', horas: 21, foto: 'https://i.pravatar.cc/80?img=51' },
  { nombre: 'Gabriela Nieto', area: 'Personas', horas: 18.5, foto: 'https://i.pravatar.cc/80?img=26' },
  { nombre: PERSONA.nombre, area: PERSONA.area, horas: 12.5, foto: PERSONA.foto },
  { nombre: 'Paula Iglesias', area: 'Marketing', horas: 11, foto: 'https://i.pravatar.cc/80?img=29' },
  { nombre: 'Carlos Pérez', area: 'Servicio al cliente', horas: 9, foto: 'https://i.pravatar.cc/80?img=12' },
]

export const RANKING_AREAS = [
  { area: 'Personas', horas: 7.8 },
  { area: 'Ingeniería', horas: 6.9 },
  { area: 'Servicio al cliente', horas: 5.6 },
  { area: 'Marketing', horas: 4.2 },
  { area: 'Operaciones', horas: 3.1 },
]
