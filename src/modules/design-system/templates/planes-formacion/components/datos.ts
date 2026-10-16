import { CONTENIDOS, COMPETENCIAS, GRUPOS } from '../../../formularios/asignacion-datos'
import { generador, HOY } from '../../../patrones/formato'
import { PLANES_FORMACION } from '../../admin-compartido/rutas'
import { USUARIOS_INICIALES, nombreCompleto } from '../../gestion-usuarios/components/datos'

// Template «Planes de formación»: calca /creator/training-plan/content-plan de la plataforma de hoy
// (recorrido del 2026-09-13: lista, crear plan, «Agregar asignación» en tres pasos y detalle) con
// las reglas de HU-LMS-005 «Planes de formación (contenidos y competencias)», RN-01 a RN-11.

export const BASE = PLANES_FORMACION
export const ruta = (pantalla = '') => (pantalla ? `${BASE}/${pantalla}` : BASE)

export type TipoPlan = 'contenidos' | 'competencias'
// RN-05: estados visibles. Procesando muestra su porcentaje.
export type EstadoPlan = 'Planeado' | 'Procesando' | 'Vigente' | 'No vigente'
export type Alcance = 'empresa' | 'colaboradores' | 'grupos' | 'archivo'

export type Asignacion = {
  id: string
  alcance: Alcance
  // Personas, grupos o el nombre del archivo, según el alcance.
  destinatarios: string[]
  personas: number
  items: string[]
}

export type Plan = {
  id: string
  nombre: string
  tipo: TipoPlan
  estado: EstadoPlan
  procesando?: number
  inicio: string
  fin: string
  // RN-02: horas por competencia, un solo valor para todo el plan.
  horas?: number
  asignaciones: Asignacion[]
  // Para fijar arriba lo último que se tocó.
  tocado: number
}

export const TIPOS: Record<TipoPlan, { singular: string; plural: string; item: string; items: string }> = {
  contenidos: { singular: 'Plan de contenidos', plural: 'Planes de contenidos', item: 'contenido', items: 'contenidos' },
  competencias: { singular: 'Plan de competencias', plural: 'Planes de competencias', item: 'competencia', items: 'competencias' },
}

// El catálogo de contenidos del patrón de Formularios, con algunos más del LMS de la empresa.
export const CATALOGO = [...CONTENIDOS, 'Excel intermedio', 'Normativa SST 2026', 'Negociación para compras', 'IA generativa para el trabajo', 'Liderazgo ágil', 'Comunicación efectiva', 'Presentaciones de alto impacto']
export { COMPETENCIAS }
export const MAXIMO_COMPETENCIAS = 8

// Los grupos del patrón de Formularios, con su tamaño.
export const TAMANO_GRUPO: Record<string, number> = { 'Líderes nuevos 2026': 38, 'Cohorte agosto': 46, 'Sucursal Beta': 312, 'Equipo comercial Q3': 84, 'Mandos medios': 71 }
export { GRUPOS }

export const PERSONAS_EMPRESA = USUARIOS_INICIALES.filter((u) => u.estado === 'Activo').length
// Para elegir colaboradores uno a uno: nombre y username, porque hay nombres repetidos.
export const PERSONAS = USUARIOS_INICIALES.filter((u) => u.estado === 'Activo').map((u) => `${nombreCompleto(u)} (${u.username})`)

export const ALCANCES: { id: Alcance; titulo: string; detalle: string }[] = [
  { id: 'empresa', titulo: 'Agregar a toda la empresa', detalle: 'Asigna el plan a todos los colaboradores de la empresa de una sola vez.' },
  { id: 'colaboradores', titulo: 'Agregar por colaborador', detalle: 'Selecciona uno a uno los colaboradores que participarán en este plan.' },
  { id: 'grupos', titulo: 'Agregar por grupo', detalle: 'Asigna el plan a un grupo específico de colaboradores.' },
  { id: 'archivo', titulo: 'Importar participantes', detalle: 'Importa una lista de participantes desde un archivo CSV.' },
]

const asig = (id: string, alcance: Alcance, destinatarios: string[], items: string[]): Asignacion => ({
  id,
  alcance,
  destinatarios,
  items,
  personas:
    alcance === 'empresa'
      ? PERSONAS_EMPRESA
      : alcance === 'grupos'
        ? destinatarios.reduce((n, g) => n + (TAMANO_GRUPO[g] ?? 0), 0)
        : alcance === 'archivo'
          ? 42
          : destinatarios.length,
})

const personasDe = (n: number, desde = 0) => PERSONAS.slice(desde, desde + n)

// Planes de Google. Fechas alrededor del «hoy» del playground (11 de septiembre de 2026).
export const PLANES_INICIALES: Plan[] = [
  { id: 'p-01', nombre: 'Onboarding comercial Q3', tipo: 'contenidos', estado: 'Vigente', inicio: '2026-08-01', fin: '2026-09-30', asignaciones: [asig('a-1', 'grupos', ['Equipo comercial Q3'], ['Onboarding comercial Q3', 'Ventas consultivas', 'Atención al cliente omnicanal', 'Negociación para compras'])], tocado: 0 },
  { id: 'p-02', nombre: 'Inducción cohorte septiembre', tipo: 'contenidos', estado: 'Planeado', inicio: '2026-09-15', fin: '2026-10-15', asignaciones: [asig('a-2', 'colaboradores', personasDe(46, 20), ['Inducción corporativa', 'Seguridad de la información 2026', 'Bienestar y pausas activas'])], tocado: 0 },
  { id: 'p-03', nombre: 'Cumplimiento normativo 2026', tipo: 'contenidos', estado: 'Procesando', procesando: 35, inicio: '2026-09-11', fin: '2026-12-15', asignaciones: [asig('a-3', 'empresa', [], ['Normativa SST 2026', 'Seguridad de la información 2026'])], tocado: 0 },
  { id: 'p-04', nombre: 'Seguridad de la información 2026', tipo: 'contenidos', estado: 'Vigente', inicio: '2026-07-01', fin: '2026-12-15', asignaciones: [asig('a-4', 'empresa', [], ['Seguridad de la información 2026'])], tocado: 0 },
  { id: 'p-05', nombre: 'Ruta para nuevos líderes', tipo: 'contenidos', estado: 'Vigente', inicio: '2026-08-18', fin: '2026-11-30', asignaciones: [asig('a-5', 'grupos', ['Líderes nuevos 2026'], ['Ruta para nuevos líderes', 'Liderazgo ágil', 'Comunicación efectiva'])], tocado: 0 },
  { id: 'p-06', nombre: 'Protocolos en sitio · planta Medellín', tipo: 'contenidos', estado: 'Vigente', inicio: '2026-09-01', fin: '2026-09-26', asignaciones: [asig('a-6', 'archivo', ['operarios-planta-medellin.csv'], ['Protocolos en sitio', 'Normativa SST 2026'])], tocado: 0 },
  { id: 'p-07', nombre: 'IA generativa para el día a día', tipo: 'contenidos', estado: 'Vigente', inicio: '2026-08-25', fin: '2026-10-31', asignaciones: [asig('a-7', 'grupos', ['Mandos medios', 'Sucursal Beta'], ['IA generativa para el trabajo'])], tocado: 0 },
  { id: 'p-08', nombre: 'Bienestar segundo semestre', tipo: 'contenidos', estado: 'Planeado', inicio: '2026-10-01', fin: '2026-12-18', asignaciones: [asig('a-8', 'empresa', [], ['Bienestar y pausas activas'])], tocado: 0 },
  { id: 'p-09', nombre: 'Presentaciones de alto impacto', tipo: 'contenidos', estado: 'Planeado', inicio: '2026-10-05', fin: '2026-11-06', asignaciones: [asig('a-9', 'colaboradores', personasDe(18, 200), ['Presentaciones de alto impacto', 'Comunicación efectiva'])], tocado: 0 },
  { id: 'p-10', nombre: 'Atención al cliente omnicanal', tipo: 'contenidos', estado: 'Vigente', inicio: '2026-06-02', fin: '2026-09-19', asignaciones: [asig('a-10', 'grupos', ['Sucursal Beta'], ['Atención al cliente omnicanal'])], tocado: 0 },
  { id: 'p-11', nombre: 'Inducción cohorte agosto', tipo: 'contenidos', estado: 'No vigente', inicio: '2026-08-04', fin: '2026-09-05', asignaciones: [asig('a-11', 'grupos', ['Cohorte agosto'], ['Inducción corporativa', 'Seguridad de la información 2026', 'Bienestar y pausas activas'])], tocado: 0 },
  { id: 'p-12', nombre: 'Excel para analistas', tipo: 'contenidos', estado: 'No vigente', inicio: '2026-05-04', fin: '2026-06-30', asignaciones: [asig('a-12', 'colaboradores', personasDe(64, 300), ['Excel intermedio'])], tocado: 0 },
  { id: 'p-13', nombre: 'Ventas consultivas', tipo: 'contenidos', estado: 'No vigente', inicio: '2026-03-02', fin: '2026-05-29', asignaciones: [asig('a-13', 'grupos', ['Equipo comercial Q3'], ['Ventas consultivas', 'Negociación para compras'])], tocado: 0 },
  { id: 'p-14', nombre: 'Onboarding comercial Q2', tipo: 'contenidos', estado: 'No vigente', inicio: '2026-04-01', fin: '2026-06-30', asignaciones: [asig('a-14', 'colaboradores', personasDe(52, 400), ['Onboarding comercial Q3', 'Ventas consultivas'])], tocado: 0 },
  { id: 'p-15', nombre: 'Liderazgo ágil', tipo: 'contenidos', estado: 'No vigente', inicio: '2026-02-09', fin: '2026-04-30', asignaciones: [asig('a-15', 'grupos', ['Mandos medios'], ['Liderazgo ágil'])], tocado: 0 },
  { id: 'p-16', nombre: 'Negociación para compras', tipo: 'contenidos', estado: 'No vigente', inicio: '2026-01-19', fin: '2026-03-13', asignaciones: [asig('a-16', 'colaboradores', personasDe(22, 500), ['Negociación para compras'])], tocado: 0 },
  { id: 'p-17', nombre: 'Inducción cohorte julio', tipo: 'contenidos', estado: 'No vigente', inicio: '2026-07-06', fin: '2026-08-07', asignaciones: [asig('a-17', 'archivo', ['cohorte-julio.csv'], ['Inducción corporativa', 'Seguridad de la información 2026'])], tocado: 0 },
  { id: 'p-18', nombre: 'Seguridad de la información 2025', tipo: 'contenidos', estado: 'No vigente', inicio: '2025-07-01', fin: '2025-12-15', asignaciones: [asig('a-18', 'empresa', [], ['Seguridad de la información 2026'])], tocado: 0 },
]

export const esEditable = (plan: Plan) => plan.estado !== 'No vigente'
// RN-06: clic en la fila → edición en Planeado y Procesando, detalle en Vigente y No vigente.
export const destinoDeFila = (plan: Plan) => (plan.estado === 'Planeado' || plan.estado === 'Procesando' ? ruta(`${plan.id}/editar`) : ruta(plan.id))

export const totalPersonas = (plan: Pick<Plan, 'asignaciones'>) => plan.asignaciones.reduce((n, a) => n + a.personas, 0)

// ── Avance de las personas (detalle del plan) ──

export type Participante = {
  id: string
  nombre: string
  area: string
  hechos: number
  total: number
  progreso: number
  ultimoAcceso: string | null
  ultimoProgreso: string | null
}

const dias = (iso: string) => Math.round((HOY.getTime() - new Date(`${iso}T00:00:00`).getTime()) / 86_400_000)

const cache = new Map<string, Participante[]>()

// Cada persona tiene los ítems de las asignaciones que le tocan. Qué tan avanzada va depende de
// cuánto lleva el plan: los no vigentes están casi cerrados; los que empezaron hace poco, apenas
// arrancan. Determinista para que no cambie entre recargas.
export function participantesDe(plan: Plan): Participante[] {
  const clave = `${plan.id}-${plan.asignaciones.map((a) => `${a.id}:${a.personas}:${a.items.length}`).join('|')}`
  const guardado = cache.get(clave)
  if (guardado) return guardado

  const azar = generador(plan.id.split('').reduce((n, c) => n * 31 + c.charCodeAt(0), 7) % 100_000)
  const activos = USUARIOS_INICIALES.filter((u) => u.estado === 'Activo')
  const empezo = plan.estado === 'Vigente' || plan.estado === 'No vigente'
  const duracion = Math.max(1, dias(plan.inicio) - dias(plan.fin))
  // Un plan que ya cerró no queda al 100 %: siempre hay quien no terminó.
  const avanceDelPlan = plan.estado === 'No vigente' ? 0.8 : empezo ? Math.min(1, dias(plan.inicio) / duracion) : 0

  const filas: Participante[] = []
  let desde = Math.floor(azar() * 400)
  for (const asignacion of plan.asignaciones) {
    for (let i = 0; i < asignacion.personas; i++) {
      const u = activos[(desde + i) % activos.length]
      const total = asignacion.items.length
      const tirada = azar()
      // Siempre hay quien no ha empezado (tirada alta) y quien va a mitad de camino.
      const hechos = !empezo || tirada > 0.9 ? 0 : tirada < avanceDelPlan * 0.85 ? total : Math.min(total, Math.floor(tirada * avanceDelPlan * (total + 1)))
      const acceso = empezo && (hechos > 0 || tirada > 0.4) ? Math.floor(azar() * Math.min(20, dias(plan.inicio) + 1)) : null
      filas.push({
        id: `${asignacion.id}-${u.id}`,
        nombre: nombreCompleto(u),
        area: u.area,
        hechos,
        total,
        progreso: Math.round((hechos / total) * 100),
        ultimoAcceso: acceso === null ? null : `hace ${acceso === 0 ? 'unas horas' : `${acceso} ${acceso === 1 ? 'día' : 'días'}`}`,
        ultimoProgreso: hechos > 0 && acceso !== null ? `hace ${acceso + 1} ${acceso === 0 ? 'día' : 'días'}` : null,
      })
    }
    desde += asignacion.personas
  }
  cache.set(clave, filas)
  return filas
}

// RN-08: la barra del plan es el % de personas al 100 % de su asignación, no el promedio.
export function progresoDe(plan: Plan) {
  const filas = participantesDe(plan)
  if (!filas.length) return 0
  return Math.round((filas.filter((f) => f.progreso === 100).length / filas.length) * 1000) / 10
}

export function migasDe(pathname: string, planes: Plan[]) {
  const resto = pathname.replace(BASE, '').replace(/^\//, '')
  const base = [
    { etiqueta: 'Inicio', ruta: '/design-system/templates/home-operativo' },
    { etiqueta: 'Aprendizaje' },
    { etiqueta: 'Planes de Formación' },
  ]
  if (!resto) return [...base, { etiqueta: 'Planes' }]
  const [id, accion] = resto.split('/')
  const plan = planes.find((p) => p.id === id)
  const titulo = id === 'nuevo' ? 'Crear plan' : !plan ? 'Pantalla no encontrada' : accion === 'editar' ? `Editar «${plan.nombre}»` : plan.nombre
  return [...base, { etiqueta: 'Planes', ruta: BASE }, { etiqueta: titulo }]
}
