import type { IconSvgElement } from '@hugeicons/react'
import {
  AiBrain01Icon,
  Briefcase01Icon,
  Comment01Icon,
  Megaphone02Icon,
  Mortarboard01Icon,
  Target02Icon,
  UserAdd01Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons'
import { fechaSinAnio } from '@/modules/design-system/patrones/formato'

// Datos del dashboard de Recursos Humanos.
// Fuente: docs/plataforma-ubits (recorrido del 8 de septiembre de 2026, empresa QA PLAN PREMIUM).
// "Observado": se vio en producción. "Ilustrativo": completa lo que la cuenta no tenía o no se
// pudo ver, para que el dashboard se lea con datos creíbles.

// Serie determinista con ondas suaves: sirve para curvas y minigráficos sin datos aleatorios.
function serie(n: number, base: number, amplitud: number, pendiente: number, fase = 0) {
  return Array.from({ length: n }, (_, i) =>
    Math.round(base + amplitud * Math.sin((i + fase) / 2.2) + amplitud * 0.4 * Math.cos((i + fase) / 1.3) + pendiente * i),
  )
}

export const PERIODOS: Record<string, string> = {
  '7d': 'Últimos 7 días',
  '30d': 'Últimos 30 días',
  '90d': 'Últimos 90 días',
  '12m': 'Últimos 12 meses',
}

export { iniciales } from '@/modules/design-system/patrones/formato'

// ─────────────────────────── Inicio ───────────────────────────

export type Kpi = {
  id: string
  titulo: string
  detalle: string
  valor: string
  variacion: number
  comparacion: string
  serie: number[]
}

// Valores observados; variación y serie, ilustrativas.
export const KPIS_INICIO: Kpi[] = [
  { id: 'licencias', titulo: 'Licencias en uso', detalle: 'De 5.000 contratadas', valor: '646', variacion: 4.2, comparacion: 'vs. mes pasado', serie: serie(12, 560, 14, 7) },
  { id: 'contenidos', titulo: 'Contenidos', detalle: '252 propios de la universidad', valor: '1.507', variacion: 3.1, comparacion: '45 nuevos', serie: serie(12, 1390, 18, 10, 2) },
  { id: 'planes', titulo: 'Planes de formación', detalle: 'En 13 grupos de usuarios', valor: '86', variacion: -2.3, comparacion: '12 no vigentes', serie: serie(12, 92, 3, -0.5, 4) },
  { id: 'evaluaciones', titulo: 'Evaluaciones 360', detalle: 'Borrador, en curso y finalizadas', valor: '28', variacion: 7.7, comparacion: '2 este mes', serie: serie(12, 18, 2, 0.9, 1) },
]

// Licencias: 646 y 5.000 observados; el reparto por actividad es ilustrativo (suma 646).
export const LICENCIAS = { contratadas: 5000, enUso: 646, vigencia: 'julio de 2027' }

export const ESTADO_LICENCIAS = [
  { id: 'activas', etiqueta: 'Activas', detalle: 'Entraron en 30 días', valor: 482, color: 'var(--success)' },
  { id: 'poco', etiqueta: 'Poco activas', detalle: '1 o 2 ingresos', valor: 96, color: 'var(--warning)' },
  { id: 'inactivas', etiqueta: 'Inactivas', detalle: 'Sin entrar en 30 días', valor: 48, color: 'var(--destructive)' },
  { id: 'pendientes', etiqueta: 'Sin primer ingreso', detalle: 'Invitadas, sin activar', valor: 20, color: 'var(--info)' },
]

// Actividad diaria de los últimos 30 días (ilustrativa).
const DIAS = Array.from({ length: 30 }, (_, i) => {
  const fecha = new Date(Date.UTC(2026, 7, 13 + i))
  return fechaSinAnio(fecha.toISOString().slice(0, 10))
})
const INGRESOS = serie(30, 392, 26, 2.1)
const COMPLETARON = serie(30, 214, 18, 1.4, 3)
export const ACTIVIDAD = DIAS.map((dia, i) => ({ dia, ingresaron: INGRESOS[i], completaron: COMPLETARON[i] }))

export type Pendiente = {
  id: string
  titulo: string
  modulo: string
  detalle: string
  icono: IconSvgElement
  estado: { texto: string; variante: 'warning-light' | 'secondary' | 'destructive-outline' }
}

// Hallazgo observado ("crear no es activar", plan vencido, módulo apagado); casos ilustrativos.
export const PENDIENTES: Pendiente[] = [
  { id: 'p1', titulo: 'Bienvenida al ciclo 2026-S2', modulo: 'Comunicaciones', detalle: 'Llega por correo a 646 personas', icono: Megaphone02Icon, estado: { texto: 'Sin activar', variante: 'warning-light' } },
  { id: 'p2', titulo: 'Analista de nómina', modulo: 'Selección', detalle: 'Vacante creada, sin publicar', icono: Briefcase01Icon, estado: { texto: 'Borrador', variante: 'secondary' } },
  { id: 'p3', titulo: 'Seguridad de la información', modulo: 'Formación', detalle: 'Plan sin grupo asignado', icono: Mortarboard01Icon, estado: { texto: 'Sin asignar', variante: 'warning-light' } },
  { id: 'p4', titulo: '360 · Líderes comerciales', modulo: 'Desempeño', detalle: 'Faltan evaluadores en 2 equipos', icono: Target02Icon, estado: { texto: 'Incompleta', variante: 'warning-light' } },
  { id: 'p5', titulo: 'Plan Basic de Selección', modulo: 'Suscripción', detalle: 'No deja crear vacantes nuevas', icono: Briefcase01Icon, estado: { texto: 'Vencido', variante: 'destructive-outline' } },
  { id: 'p6', titulo: 'Diagnóstico', modulo: 'Módulo', detalle: 'Apagado para esta empresa', icono: AiBrain01Icon, estado: { texto: 'Inactivo', variante: 'secondary' } },
]

export type Tarea = {
  id: string
  titulo: string
  descripcion: string
  icono: IconSvgElement
  pantallas: number
  cambios: number
}

// Los recorridos del análisis: cuántas pantallas y cambios de navegación cuesta hoy cada tarea.
export const TAREAS: Tarea[] = [
  { id: 'alta', titulo: 'Dar de alta a gente nueva', descripcion: 'Usuario, rol y organigrama', icono: UserAdd01Icon, pantallas: 6, cambios: 2 },
  { id: 'plan', titulo: 'Armar un plan de formación', descripcion: 'Contenidos, grupo, plan y certificado', icono: Mortarboard01Icon, pantallas: 6, cambios: 2 },
  { id: 'ciclo', titulo: 'Abrir un ciclo de desempeño', descripcion: '360, objetivos y matriz de talento', icono: Target02Icon, pantallas: 6, cambios: 3 },
  { id: 'contratar', titulo: 'Contratar a alguien', descripcion: 'Vacante, candidatos y alta', icono: Briefcase01Icon, pantallas: 8, cambios: 3 },
  { id: 'encuesta', titulo: 'Lanzar una encuesta', descripcion: 'Clima, cultura o riesgo psicosocial', icono: Comment01Icon, pantallas: 3, cambios: 1 },
  { id: 'comunicar', titulo: 'Comunicar algo a la empresa', descripcion: 'Publicación con correo a todos', icono: Megaphone02Icon, pantallas: 2, cambios: 1 },
]

export type Modulo = {
  id: string
  nombre: string
  plan: string
  icono: IconSvgElement
  uso: number
  contenido: string
  renovacion: string
  estado: 'activo' | 'inactivo' | 'vencido'
}

// Estados observados; uso y fechas de renovación, ilustrativos.
export const MODULOS: Modulo[] = [
  { id: 'aprendizaje', nombre: 'Aprendizaje', plan: 'Premium', icono: Mortarboard01Icon, uso: 74, contenido: '1.507 contenidos · 86 planes', renovacion: 'jul 2027', estado: 'activo' },
  { id: 'desempeno', nombre: 'Desempeño', plan: 'Premium', icono: Target02Icon, uso: 61, contenido: '28 evaluaciones 360', renovacion: 'jul 2027', estado: 'activo' },
  { id: 'encuestas', nombre: 'Encuestas', plan: 'Premium', icono: Comment01Icon, uso: 58, contenido: '78 encuestas', renovacion: 'jul 2027', estado: 'activo' },
  { id: 'tareas', nombre: 'Tareas', plan: 'Incluido', icono: UserGroupIcon, uso: 32, contenido: '4 tareas en seguimiento', renovacion: 'jul 2027', estado: 'activo' },
  { id: 'diagnostico', nombre: 'Diagnóstico', plan: 'No contratado', icono: AiBrain01Icon, uso: 0, contenido: 'Apagado para la empresa', renovacion: '—', estado: 'inactivo' },
  { id: 'seleccion', nombre: 'Selección', plan: 'Basic', icono: Briefcase01Icon, uso: 12, contenido: '9 vacantes abiertas', renovacion: 'Venció 30 ago', estado: 'vencido' },
]

// ─────────────────────────── Operativo ───────────────────────────

export const KPIS_OPERATIVO = [
  { id: 'abiertos', titulo: 'Procesos abiertos', detalle: 'En 5 módulos', valor: '23', serie: serie(14, 16, 2, 0.5), color: 'var(--chart-2)' },
  { id: 'vencer', titulo: 'Por vencer esta semana', detalle: '1 tarea ya vencida', valor: '7', serie: serie(14, 4, 2, 0.2, 5), color: 'var(--warning)' },
  { id: 'atiempo', titulo: 'Cierre a tiempo', detalle: 'Últimos 90 días', valor: '68 %', serie: serie(14, 58, 4, 0.7, 2), color: 'var(--success)' },
]

export type Proceso = {
  id: string
  nombre: string
  codigo: string
  modulo: 'Desempeño' | 'Encuestas' | 'Formación' | 'Selección' | 'Comunicaciones' | 'Usuarios'
  responsable: string
  avance: number
  hechos: number
  total: number
  unidad: string
  inicio: string
  cierre: string
  diasRestantes: number
  estado: 'En curso' | 'Por vencer' | 'Borrador' | 'Vencido' | 'Finalizado'
}

// Tipos de proceso y estados observados; filas ilustrativas.
export const PROCESOS: Proceso[] = [
  { id: 'e1', nombre: 'Evaluación 360 · Ciclo 2026-S2', codigo: 'DES-118', modulo: 'Desempeño', responsable: 'Camila Bravo', avance: 64, hechos: 413, total: 646, unidad: 'respuestas', inicio: '1 sep', cierre: '30 sep', diasRestantes: 19, estado: 'En curso' },
  { id: 'e2', nombre: 'Clima organizacional 2026', codigo: 'ENC-307', modulo: 'Encuestas', responsable: 'Julia Moreno', avance: 58, hechos: 375, total: 646, unidad: 'respuestas', inicio: '25 ago', cierre: '22 sep', diasRestantes: 11, estado: 'En curso' },
  { id: 'e3', nombre: 'Riesgo psicosocial · NOM-035', codigo: 'ENC-224', modulo: 'Encuestas', responsable: 'Julia Moreno', avance: 81, hechos: 523, total: 646, unidad: 'respuestas', inicio: '18 ago', cierre: '14 sep', diasRestantes: 3, estado: 'Por vencer' },
  { id: 'e4', nombre: 'Onboarding 2026', codigo: 'FOR-088', modulo: 'Formación', responsable: 'Gabriela Nieto', avance: 72, hechos: 36, total: 50, unidad: 'personas', inicio: '1 jul', cierre: '15 dic', diasRestantes: 95, estado: 'En curso' },
  { id: 'e5', nombre: 'Liderazgo para mandos medios', codigo: 'FOR-142', modulo: 'Formación', responsable: 'Gabriela Nieto', avance: 45, hechos: 27, total: 60, unidad: 'personas', inicio: '15 jul', cierre: '30 nov', diasRestantes: 80, estado: 'En curso' },
  { id: 'e6', nombre: 'Analista de nómina', codigo: 'SEL-071', modulo: 'Selección', responsable: 'Andrés Rojas', avance: 20, hechos: 1, total: 5, unidad: 'etapas', inicio: '2 sep', cierre: '15 oct', diasRestantes: 34, estado: 'Borrador' },
  { id: 'e7', nombre: 'Ejecutivo comercial B2B', codigo: 'SEL-064', modulo: 'Selección', responsable: 'Andrés Rojas', avance: 60, hechos: 3, total: 5, unidad: 'etapas', inicio: '10 ago', cierre: '12 sep', diasRestantes: 1, estado: 'Por vencer' },
  { id: 'e8', nombre: '360 · Líderes comerciales', codigo: 'DES-121', modulo: 'Desempeño', responsable: 'Camila Bravo', avance: 0, hechos: 0, total: 48, unidad: 'evaluadores', inicio: '15 sep', cierre: '15 oct', diasRestantes: 34, estado: 'Borrador' },
  { id: 'e9', nombre: 'Carga masiva de 120 usuarios', codigo: 'USR-019', modulo: 'Usuarios', responsable: 'Camila Bravo', avance: 35, hechos: 42, total: 120, unidad: 'usuarios', inicio: '11 sep', cierre: '11 sep', diasRestantes: 0, estado: 'En curso' },
  { id: 'e10', nombre: 'Ventas consultivas', codigo: 'FOR-131', modulo: 'Formación', responsable: 'Gabriela Nieto', avance: 33, hechos: 14, total: 42, unidad: 'personas', inicio: '1 jun', cierre: '31 ago', diasRestantes: -11, estado: 'Vencido' },
  { id: 'e11', nombre: 'Cultura Ubits', codigo: 'ENC-190', modulo: 'Encuestas', responsable: 'Julia Moreno', avance: 100, hechos: 598, total: 646, unidad: 'respuestas', inicio: '1 ago', cierre: '30 ago', diasRestantes: -12, estado: 'Finalizado' },
  { id: 'e12', nombre: 'Aviso: nuevo reglamento interno', codigo: 'COM-044', modulo: 'Comunicaciones', responsable: 'Camila Bravo', avance: 88, hechos: 568, total: 646, unidad: 'lecturas', inicio: '5 sep', cierre: '19 sep', diasRestantes: 8, estado: 'En curso' },
]

// Las cinco etapas por defecto del flujo del candidato (observadas); vacantes ilustrativas.
export const ETAPAS = [
  { id: 'cv', titulo: 'Evaluación CV', color: 'var(--chart-1)' },
  { id: 'serena', titulo: 'Serena AI', color: 'var(--chart-2)' },
  { id: 'revision', titulo: 'Para revisión', color: 'var(--chart-3)' },
  { id: 'antecedentes', titulo: 'Antecedentes', color: 'var(--chart-4)' },
  { id: 'seleccionado', titulo: 'Seleccionado', color: 'var(--chart-5)' },
] as const

export type Vacante = {
  id: string
  titulo: string
  area: string
  candidatos: number
  cierre: string
  confianza: number
  riesgo: 'A tiempo' | 'En riesgo' | 'Bloqueada'
  reclutador: string
  rol: string
  diasRestantes: number
}

export const VACANTES_INICIALES: Record<string, Vacante[]> = {
  cv: [
    { id: 'v1', titulo: 'Analista de nómina', area: 'Finanzas', candidatos: 48, cierre: '15 oct', confianza: 32, riesgo: 'Bloqueada', reclutador: 'Andrés Rojas', rol: 'Selección', diasRestantes: 34 },
    { id: 'v2', titulo: 'Diseñador de producto', area: 'Tecnología', candidatos: 36, cierre: '8 oct', confianza: 58, riesgo: 'En riesgo', reclutador: 'Laura Pérez', rol: 'Selección', diasRestantes: 27 },
  ],
  serena: [
    { id: 'v3', titulo: 'Desarrollador backend', area: 'Tecnología', candidatos: 22, cierre: '30 sep', confianza: 66, riesgo: 'A tiempo', reclutador: 'Laura Pérez', rol: 'Selección', diasRestantes: 19 },
    { id: 'v4', titulo: 'Especialista en clima', area: 'Talento', candidatos: 18, cierre: '26 sep', confianza: 48, riesgo: 'En riesgo', reclutador: 'Andrés Rojas', rol: 'Selección', diasRestantes: 15 },
  ],
  revision: [
    { id: 'v5', titulo: 'Ejecutivo comercial B2B', area: 'Comercial', candidatos: 9, cierre: '12 sep', confianza: 42, riesgo: 'En riesgo', reclutador: 'Andrés Rojas', rol: 'Selección', diasRestantes: 1 },
    { id: 'v6', titulo: 'Coordinador de formación', area: 'Talento', candidatos: 7, cierre: '20 sep', confianza: 74, riesgo: 'A tiempo', reclutador: 'Gabriela Nieto', rol: 'Formación', diasRestantes: 9 },
  ],
  antecedentes: [
    { id: 'v7', titulo: 'Analista de datos', area: 'Tecnología', candidatos: 3, cierre: '18 sep', confianza: 71, riesgo: 'A tiempo', reclutador: 'Laura Pérez', rol: 'Selección', diasRestantes: 7 },
  ],
  seleccionado: [
    { id: 'v8', titulo: 'Asistente administrativo', area: 'Operaciones', candidatos: 1, cierre: '10 sep', confianza: 92, riesgo: 'A tiempo', reclutador: 'Andrés Rojas', rol: 'Selección', diasRestantes: 0 },
    { id: 'v9', titulo: 'Líder de mesa de ayuda', area: 'Operaciones', candidatos: 1, cierre: '14 sep', confianza: 88, riesgo: 'A tiempo', reclutador: 'Laura Pérez', rol: 'Selección', diasRestantes: 3 },
  ],
}

// ─────────────────────────── Métricas ───────────────────────────

export const SALUD = {
  indicadores: [
    { etiqueta: 'Participación', valor: '74 %', variacion: 7, sufijo: ' pts' },
    { etiqueta: 'eNPS', valor: '42', variacion: 5, sufijo: ' pts' },
    { etiqueta: 'Rotación', valor: '2,1 %', variacion: -0.3, sufijo: ' pts', menosEsMejor: true },
  ],
  cicloDesempeno: 68,
  actividad: [
    { id: 'a1', texto: 'NOM-035 superó el 80 % de respuestas.', hora: '09:40', tono: 'ok' as const },
    { id: 'a2', texto: '42 de 120 usuarios cargados en la carga masiva.', hora: '09:32', tono: 'ok' as const },
    { id: 'a3', texto: 'Ventas consultivas cerró con 33 % de avance.', hora: '08:15', tono: 'alerta' as const },
  ],
}

const MESES = ['oct', 'nov', 'dic', 'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep']
const PARTICIPACION_MES = serie(12, 56, 3, 1.6, 1)
export const TENDENCIA_PARTICIPACION = MESES.map((mes, i) => ({ mes, participacion: Math.min(PARTICIPACION_MES[i], 74) }))
TENDENCIA_PARTICIPACION[11].participacion = 74

// Embudo: las 5 etapas observadas; conteos semanales ilustrativos (se leen como capas).
export const EMBUDO_TOTALES = [
  { id: 'cv', etiqueta: 'Evaluación CV', valor: 240, variacion: 14 },
  { id: 'serena', etiqueta: 'Serena AI', valor: 132, variacion: 19 },
  { id: 'revision', etiqueta: 'Para revisión', valor: 58, variacion: 11 },
  { id: 'antecedentes', etiqueta: 'Antecedentes', valor: 21, variacion: -6 },
  { id: 'seleccionado', etiqueta: 'Seleccionado', valor: 9, variacion: 2 },
]

export const EMBUDO_SEMANAL = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'].map((semana, i) => ({
  semana,
  cv: [34, 38, 41, 37, 44, 46][i],
  serena: [18, 21, 23, 20, 24, 26][i],
  revision: [8, 9, 10, 9, 11, 11][i],
  antecedentes: [3, 3, 4, 3, 4, 4][i],
  seleccionado: [1, 1, 2, 1, 2, 2][i],
}))

export const RESPUESTAS_POR_AREA = [
  { area: 'Comercial', respuestas: 318, color: 'var(--chart-2)' },
  { area: 'Operaciones', respuestas: 246, color: 'var(--chart-1)' },
  { area: 'Tecnología', respuestas: 184, color: 'var(--chart-3)' },
  { area: 'Talento', respuestas: 152, color: 'var(--chart-4)' },
  { area: 'Finanzas', respuestas: 76, color: 'var(--chart-5)' },
]

export type ResultadoArea = {
  id: string
  area: string
  personas: number
  lider: string
  clima: number
  enps: number
  formacion: number
  riesgo: 'Saludable' | 'En observación' | 'Crítico'
  actualizado: string
}

export const RESULTADOS_POR_AREA: ResultadoArea[] = [
  { id: 'r1', area: 'Comercial', personas: 184, lider: 'Mateo Ruiz', clima: 78, enps: 46, formacion: 71, riesgo: 'Saludable', actualizado: 'Hace 8 min' },
  { id: 'r2', area: 'Operaciones', personas: 152, lider: 'Sara Gómez', clima: 69, enps: 31, formacion: 64, riesgo: 'En observación', actualizado: 'Hace 18 min' },
  { id: 'r3', area: 'Tecnología', personas: 118, lider: 'Diego Castro', clima: 82, enps: 52, formacion: 77, riesgo: 'Saludable', actualizado: 'Hace 24 min' },
  { id: 'r4', area: 'Talento', personas: 42, lider: 'Camila Bravo', clima: 85, enps: 58, formacion: 88, riesgo: 'Saludable', actualizado: 'Hace 1 h' },
  { id: 'r5', area: 'Finanzas', personas: 64, lider: 'Paula Ortiz', clima: 61, enps: 18, formacion: 49, riesgo: 'Crítico', actualizado: 'Hace 42 min' },
  { id: 'r6', area: 'Servicio al cliente', personas: 86, lider: 'Jorge León', clima: 66, enps: 24, formacion: 58, riesgo: 'En observación', actualizado: 'Hace 2 h' },
]
