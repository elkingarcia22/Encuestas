import { useSyncExternalStore } from 'react'
import {
  PERSONAS,
  PERSONAS_EMPRESA,
  PLANES_INICIALES,
  TAMANO_GRUPO,
  type Alcance,
  type Asignacion as AsignacionBase,
  type EstadoPlan,
  type Participante,
  type Plan as PlanBase,
  type TipoPlan,
  participantesDe,
} from '@/modules/design-system/templates/planes-formacion/components/datos'
import { USUARIOS_INICIALES, nombreCompleto } from '@/modules/design-system/templates/gestion-usuarios/components/datos'
import { diasDesde, plural } from '@/modules/design-system/patrones/formato'

// Aprendizaje › Planes de formación › Planes, en el marco del admin. Los planes de contenidos y el cálculo del avance
// vienen de la plantilla del design system (calcada de /creator/training-plan/content-plan con HU-LMS-005); aquí se
// suman los planes de competencias, que la plantilla no tenía, y las rutas del admin.

export {
  ALCANCES,
  CATALOGO,
  GRUPOS,
  MAXIMO_COMPETENCIAS,
  PERSONAS,
  PERSONAS_EMPRESA,
  TAMANO_GRUPO,
  TIPOS,
  totalPersonas,
} from '@/modules/design-system/templates/planes-formacion/components/datos'
export type { Alcance, EstadoPlan, Participante, TipoPlan }

// Una asignación, más el enfoque de un plan de competencias: por competencia, las habilidades elegidas. Sin entrada
// para una competencia, se estudian todas sus habilidades (revisión de David, 30 sep).
export type Asignacion = AsignacionBase & { habilidades?: Record<string, string[]> }

// Un plan, más lo que en UBITS se toca persona por persona al editarlo (el menú ⋮ de cada fila): a quién se quitó del
// plan y a quién se le cambiaron los contenidos. La asignación de grupo sigue igual; esto son las excepciones.
export type Plan = Omit<PlanBase, 'asignaciones'> & {
  asignaciones: Asignacion[]
  quitados?: string[]
  itemsPersona?: Record<string, string[]>
  // Quienes entraron al plan uno a uno desde «Agregar usuario» del tab Contenidos o Competencias (HU-LMS-015/021):
  // no llegan por una asignación, sino con los ítems que se les dieron.
  extras?: { usuario: string; items: string[] }[]
}

const USUARIO_POR_ID = new Map(USUARIOS_INICIALES.map((u) => [u.id, u]))
// Quién es la persona de una fila: el id es «<asignación>-<usuario>» o «extra-<usuario>».
export const usuarioIdDe = (personaId: string) => personaId.match(/(u-\d+)$/)?.[1] ?? ''

// Las personas del plan, una fila por persona, ya con sus excepciones. Es lo que muestran editar y el detalle.
export function personasDelPlan(plan: Plan): (Participante & { asignacionId: string })[] {
  const extras = (plan.extras ?? [])
    .filter((e) => !plan.quitados?.includes(`extra-${e.usuario}`))
    .flatMap((e) => {
      const u = USUARIO_POR_ID.get(e.usuario)
      if (!u) return []
      // Acaba de entrar: todavía no ha empezado nada.
      return [{ id: `extra-${e.usuario}`, asignacionId: 'extra', nombre: nombreCompleto(u), area: u.area, hechos: 0, total: e.items.length, progreso: 0, ultimoAcceso: null, ultimoProgreso: null }]
    })
  return [...deAsignaciones(plan), ...extras]
}

function deAsignaciones(plan: Plan): (Participante & { asignacionId: string })[] {
  return participantesDe(plan)
    .filter((p) => !plan.quitados?.includes(p.id))
    .map((p) => {
      const asignacionId = plan.asignaciones.find((a) => p.id.startsWith(`${a.id}-`))?.id ?? ''
      const propios = plan.itemsPersona?.[p.id]
      if (!propios) return { ...p, asignacionId }
      const hechos = Math.min(p.hechos, propios.length)
      return { ...p, asignacionId, total: propios.length, hechos, progreso: propios.length ? Math.round((hechos / propios.length) * 100) : 0 }
    })
}

// Los contenidos de una persona: los suyos si se le cambiaron, si no los de su asignación.
export const itemsDe = (plan: Plan, personaId: string) =>
  plan.itemsPersona?.[personaId] ??
  (personaId.startsWith('extra-') ? plan.extras?.find((e) => `extra-${e.usuario}` === personaId)?.items : undefined) ??
  plan.asignaciones.find((a) => personaId.startsWith(`${a.id}-`))?.items ??
  []

// ── El plan visto por contenido o competencia (tabs de HU-LMS-015/021) ──
// Cada ítem distinto del plan, con quiénes lo tienen y cuántos ya lo terminaron. Una persona avanza en orden: sus
// primeros `hechos` ítems están terminados.
export type ItemDelPlan = { titulo: string; personas: { id: string; nombre: string; area: string }[]; terminaron: number }

export function itemsDelPlan(plan: Plan): ItemDelPlan[] {
  const porItem = new Map<string, ItemDelPlan>()
  for (const persona of personasDelPlan(plan)) {
    itemsDe(plan, persona.id).forEach((titulo, indice) => {
      const item = porItem.get(titulo) ?? { titulo, personas: [], terminaron: 0 }
      item.personas.push({ id: persona.id, nombre: persona.nombre, area: persona.area })
      if (indice < persona.hechos) item.terminaron += 1
      porItem.set(titulo, item)
    })
  }
  return [...porItem.values()]
}

type Cambios = Pick<Plan, 'asignaciones' | 'itemsPersona' | 'extras'>

// «Agregar usuario» de un ítem: los marcados lo tienen; los desmarcados, no. Quien no estaba en el plan entra con ese
// ítem (RN-04). Con `maximo` (competencias, RN-03) no se le suma a quien ya tiene el tope: vuelve en `bloqueados`.
export function aplicarUsuarios(plan: Plan, titulo: string, usuarios: string[], maximo?: number): Cambios & { bloqueados: string[] } {
  const itemsPersona = { ...plan.itemsPersona }
  const extras = [...(plan.extras ?? [])]
  const bloqueados: string[] = []
  const enElPlan = personasDelPlan(plan)
  for (const persona of enElPlan) {
    const actuales = itemsDe(plan, persona.id)
    const tiene = actuales.includes(titulo)
    const marcado = usuarios.includes(usuarioIdDe(persona.id))
    if (tiene === marcado) continue
    if (marcado && maximo && actuales.length >= maximo) {
      bloqueados.push(persona.nombre)
      continue
    }
    const nuevos = marcado ? [...actuales, titulo] : actuales.filter((t) => t !== titulo)
    if (persona.id.startsWith('extra-')) {
      const i = extras.findIndex((e) => `extra-${e.usuario}` === persona.id)
      if (i >= 0) extras[i] = { ...extras[i], items: nuevos }
    } else itemsPersona[persona.id] = nuevos
  }
  const yaEstan = new Set(enElPlan.map((p) => usuarioIdDe(p.id)))
  for (const usuario of usuarios) if (!yaEstan.has(usuario)) extras.push({ usuario, items: [titulo] })
  return { asignaciones: plan.asignaciones, itemsPersona, extras, bloqueados }
}

// Cambiar un ítem por otro en todo el plan (RN-06: 1→1, sin duplicar si ya lo tenía).
export function reemplazarItem(plan: Plan, de: string, a: string): Cambios {
  const cambiar = (lista: string[]) => [...new Set(lista.map((t) => (t === de ? a : t)))]
  return {
    asignaciones: plan.asignaciones.map((x) => ({ ...x, items: cambiar(x.items) })),
    itemsPersona: Object.fromEntries(Object.entries(plan.itemsPersona ?? {}).map(([k, v]) => [k, cambiar(v)])),
    extras: (plan.extras ?? []).map((e) => ({ ...e, items: cambiar(e.items) })),
  }
}

// Quitar un ítem a todas las personas del plan (RN-08, se confirma antes).
export function eliminarItem(plan: Plan, titulo: string): Cambios {
  const quitar = (lista: string[]) => lista.filter((t) => t !== titulo)
  return {
    asignaciones: plan.asignaciones.map((x) => ({ ...x, items: quitar(x.items) })),
    itemsPersona: Object.fromEntries(Object.entries(plan.itemsPersona ?? {}).map(([k, v]) => [k, quitar(v)])),
    extras: (plan.extras ?? []).map((e) => ({ ...e, items: quitar(e.items) })),
  }
}

// En qué habilidades se enfoca una competencia del plan. undefined = todas (alguna asignación no la acota).
export function enfoqueDe(plan: Pick<Plan, 'asignaciones'>, titulo: string): string[] | undefined {
  const conElla = plan.asignaciones.filter((a) => a.items.includes(titulo))
  if (!conElla.length || conElla.some((a) => !a.habilidades?.[titulo])) return undefined
  return [...new Set(conElla.flatMap((a) => a.habilidades?.[titulo] ?? []))]
}

// RN-08: la barra del plan es el % de personas al 100 % de lo suyo, no el promedio.
export function progresoDe(plan: Plan) {
  const filas = personasDelPlan(plan)
  if (!filas.length) return 0
  return Math.round((filas.filter((f) => f.progreso === 100).length / filas.length) * 1000) / 10
}

// Orden de las tablas (DataGridList avisa «campo» o «-campo» y espera la lista ya ordenada): números por valor, lo
// demás por texto en español.
export function ordenarPor<T extends object>(filas: T[], orden: string | undefined) {
  if (!orden) return filas
  const desc = orden.startsWith('-')
  const campo = (desc ? orden.slice(1) : orden) as keyof T
  return [...filas].sort((a, b) => {
    const va = a[campo]
    const vb = b[campo]
    const r = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va ?? '').localeCompare(String(vb ?? ''), 'es')
    return desc ? -r : r
  })
}

// Lo marcado en un filtro de selección múltiple de DataGridList.
export const marcadosEn = (filtros: { id: string; value: unknown }[], id: string) => {
  const valor = filtros.find((f) => f.id === id)?.value
  return Array.isArray(valor) ? valor.map(String) : []
}

// Quien lleva más tiempo sin entrar va primero; quien nunca entró, antes que todos.
const diasSinEntrar = (acceso: string | null) => (acceso === null ? Infinity : Number(acceso.match(/(\d+)/)?.[1] ?? 0))
export const porTiempoSinEntrar = <T extends { ultimoAcceso: string | null }>(personas: T[]) =>
  [...personas].sort((a, b) => diasSinEntrar(b.ultimoAcceso) - diasSinEntrar(a.ultimoAcceso))

// Lo que tarda un panel lateral en salir de la pantalla (la animación del Drawer de flux-ui: 450 ms, con un margen).
// Se espera esto antes de desmontarlo o de abrir el siguiente, para que la salida se vea completa.
export const SALIDA_PANEL = 480

export const BASE_PLANES = '/admin/aprendizaje/planes-de-formacion/planes'
export const rutaPlan = (resto = '') => (resto ? `${BASE_PLANES}/${resto}` : BASE_PLANES)


export const ESTADOS: EstadoPlan[] = ['Vigente', 'Planeado', 'Procesando', 'No vigente']

export const BADGE_ESTADO: Record<EstadoPlan, 'success-light' | 'secondary' | 'outline' | 'info-light'> = {
  Vigente: 'success-light',
  Planeado: 'secondary',
  'No vigente': 'outline',
  Procesando: 'info-light',
}

export const NOMBRE_ALCANCE: Record<Alcance, string> = {
  empresa: 'Toda la empresa',
  colaboradores: 'Por colaborador',
  grupos: 'Por grupo',
  archivo: 'Desde archivo',
}

// A quién, en una línea: «Toda la empresa», «Equipo comercial Q3, Mandos medios», «Ana Restrepo, Diego Soto y 44 más».
export function aQuien(asignacion: Pick<Asignacion, 'alcance' | 'destinatarios'>) {
  if (asignacion.alcance === 'empresa') return 'Toda la empresa'
  if (asignacion.alcance !== 'colaboradores') return asignacion.destinatarios.join(', ')
  const resto = asignacion.destinatarios.length - 2
  return `${asignacion.destinatarios.slice(0, 2).join(', ')}${resto > 0 ? ` y ${resto} más` : ''}`
}

// Cuánto falta o cuánto pasó, en palabras: se lee más rápido que dos fechas.
export function momentoDe(plan: Plan) {
  const paraEmpezar = -diasDesde(plan.inicio)
  const paraTerminar = -diasDesde(plan.fin)
  const dias = (n: number) => `${n} ${plural(n, 'día', 'días')}`
  if (paraEmpezar > 0) return `Empieza en ${dias(paraEmpezar)}`
  if (paraEmpezar === 0) return 'Empieza hoy'
  if (paraTerminar > 0) return `Termina en ${dias(paraTerminar)}`
  if (paraTerminar === 0) return 'Termina hoy'
  return `Terminó hace ${dias(-paraTerminar)}`
}

// ── Planes de competencias (la plantilla solo traía los de contenidos) ──
// RN-02: horas por competencia, un valor para todo el plan. RN-03: máximo 8 competencias por asignación.

const asignacion = (id: string, alcance: Alcance, destinatarios: string[], items: string[]): Asignacion => ({
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

// Con nombres del catálogo real de competencias (src/shared/bd). El de Liderazgo para mandos medios viene enfocado en
// algunas habilidades, para ver cómo se lee un plan con enfoque.
const PLANES_COMPETENCIAS: Plan[] = [
  { id: 'c-01', nombre: 'Liderazgo para mandos medios', tipo: 'competencias', estado: 'Vigente', inicio: '2026-08-04', fin: '2026-11-28', horas: 8, asignaciones: [{ ...asignacion('ac-1', 'grupos', ['Mandos medios'], ['Liderazgo', 'Comunicación', 'Resolución de problemas', 'Productividad']), habilidades: { Liderazgo: ['Coaching de equipos', 'Pensamiento estratégico'] } }], tocado: 0 },
  { id: 'c-02', nombre: 'Competencias comerciales Q4', tipo: 'competencias', estado: 'Planeado', inicio: '2026-10-01', fin: '2026-12-18', horas: 6, asignaciones: [asignacion('ac-2', 'grupos', ['Equipo comercial Q3'], ['Negociación', 'Experiencia del cliente', 'Comunicación'])], tocado: 0 },
  { id: 'c-03', nombre: 'Analítica para el día a día', tipo: 'competencias', estado: 'Vigente', inicio: '2026-07-14', fin: '2026-10-09', horas: 10, asignaciones: [asignacion('ac-3', 'colaboradores', PERSONAS.slice(60, 88), ['Data skills', 'Herramientas tecnológicas'])], tocado: 0 },
  { id: 'c-04', nombre: 'Líderes nuevos 2026', tipo: 'competencias', estado: 'Procesando', procesando: 60, inicio: '2026-09-11', fin: '2026-12-11', horas: 8, asignaciones: [asignacion('ac-4', 'grupos', ['Líderes nuevos 2026'], ['Liderazgo', 'Trabajo en equipo', 'Gestión del cambio', 'Resolución de problemas', 'Comunicación'])], tocado: 0 },
  { id: 'c-05', nombre: 'Cultura de seguridad', tipo: 'competencias', estado: 'Vigente', inicio: '2026-06-01', fin: '2026-09-30', horas: 4, asignaciones: [asignacion('ac-5', 'empresa', [], ['Gestión del riesgo'])], tocado: 0 },
  { id: 'c-06', nombre: 'Innovación en sucursales', tipo: 'competencias', estado: 'No vigente', inicio: '2026-03-02', fin: '2026-06-26', horas: 6, asignaciones: [asignacion('ac-6', 'grupos', ['Sucursal Beta'], ['Innovación', 'Gestión del cambio', 'Trabajo en equipo'])], tocado: 0 },
  { id: 'c-07', nombre: 'Gestión del tiempo · cohorte agosto', tipo: 'competencias', estado: 'No vigente', inicio: '2026-08-04', fin: '2026-09-04', horas: 3, asignaciones: [asignacion('ac-7', 'grupos', ['Cohorte agosto'], ['Productividad'])], tocado: 0 },
]

// ── Los planes de la sesión ──
// Viven fuera de las pantallas para que lo que se crea, edita o elimina se vea al volver a la lista. Duran mientras
// no se recargue la página, como el resto de la maqueta.

// Los planes de la plantilla guardan a cada colaborador como «Nombre (username)»; aquí basta el nombre, como en el
// resto del admin.
const sinUsuario = (plan: Plan): Plan => ({
  ...plan,
  asignaciones: plan.asignaciones.map((a) => (a.alcance === 'colaboradores' ? { ...a, destinatarios: a.destinatarios.map((d) => d.replace(/ \(.*\)$/, '')) } : a)),
})

let planes: Plan[] = [...PLANES_INICIALES.map(sinUsuario), ...PLANES_COMPETENCIAS.map(sinUsuario)]
const oyentes = new Set<() => void>()
let reloj: number | undefined

function avisar() {
  oyentes.forEach((oyente) => oyente())
}

// Un plan en «Procesando» avanza solo mientras la plataforma asigna a las personas; al llegar al 100 % queda en el
// estado que le toca por fechas (RN-05).
function avanzarProcesando() {
  if (reloj !== undefined || !planes.some((p) => p.estado === 'Procesando')) return
  reloj = window.setInterval(() => {
    planes = planes.map((p) => {
      if (p.estado !== 'Procesando') return p
      const siguiente = Math.min(100, (p.procesando ?? 0) + 5)
      if (siguiente < 100) return { ...p, procesando: siguiente }
      return { ...p, procesando: undefined, estado: diasDesde(p.inicio) < 0 ? 'Planeado' : 'Vigente' }
    })
    if (!planes.some((p) => p.estado === 'Procesando')) {
      window.clearInterval(reloj)
      reloj = undefined
    }
    avisar()
  }, 2500)
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente)
  avanzarProcesando()
  return () => {
    oyentes.delete(oyente)
  }
}

export function usePlanes() {
  return useSyncExternalStore(suscribir, () => planes)
}

export function cambiarPlanes(cambio: (todos: Plan[]) => Plan[]) {
  planes = cambio(planes)
  avisar()
  avanzarProcesando()
}

export const buscarPlan = (id: string | undefined) => planes.find((p) => p.id === id)
