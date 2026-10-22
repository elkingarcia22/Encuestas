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
} from '@/modules/design-system/templates/planes-formacion/components/datos'
import { USUARIOS_INICIALES, nombreCompleto } from '@/modules/design-system/templates/gestion-usuarios/components/datos'
import { diasDesde, generador, plural } from '@/modules/design-system/patrones/formato'
import { grupoPorNombre, gruposActuales } from './grupos-datos'

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
} from '@/modules/design-system/templates/planes-formacion/components/datos'
export type { Alcance, EstadoPlan, Participante, TipoPlan }

// Una asignación es «quién ve qué»: a quiénes les llega (toda la empresa, unos grupos, unas personas o un archivo) y con
// qué contenidos o competencias. Además del tipo de la plantilla:
// - `habilidades`: el enfoque de un plan de competencias, por competencia. Sin entrada, todas (revisión de David, 30 sep).
// - `sumadas`: personas agregadas una a una (ids de usuario), encima de sus grupos o sus colaboradores.
// - `fuera`: personas que quedan fuera de esta asignación aunque su grupo esté (ids). Así se pasa a alguien a otra.
// - `nombre`: opcional, lo pone quien arma el plan («Derechos humanos»). Hoy la asignación no existe después de guardar
//   (se vuelve una fila por persona y contenido); Cristian Niño propuso guardarla en una tabla aparte para poder editarla
//   en bloque y nombrarla (war room del 14-oct). La maqueta asume esa tabla.
export type Asignacion = AsignacionBase & { habilidades?: Record<string, string[]>; sumadas?: string[]; fuera?: string[]; nombre?: string }

// Un plan, más lo que se toca persona por persona: a quién se quitó del plan (`quitados`) y a quién se le ajustaron sus
// contenidos (`itemsPersona`). Ambos por id de usuario. La asignación de grupo sigue igual; esto son las excepciones.
export type Plan = Omit<PlanBase, 'asignaciones'> & {
  asignaciones: Asignacion[]
  quitados?: string[]
  itemsPersona?: Record<string, string[]>
  // De la primera versión de «Agregar usuario» (HU-LMS-015/021). Hoy quien entra así llega en una asignación propia.
  extras?: { usuario: string; items: string[] }[]
}

const USUARIO_POR_ID = new Map(USUARIOS_INICIALES.map((u) => [u.id, u]))
const ACTIVOS = USUARIOS_INICIALES.filter((u) => u.estado === 'Activo')
export const usuarioDelPlan = (id: string) => USUARIO_POR_ID.get(id)
// Quién es la persona de una fila. Hoy el id de la fila ya es el del usuario; las filas viejas eran «<asignación>-<usuario>».
export const usuarioIdDe = (personaId: string) => personaId.match(/(u-\d+)$/)?.[1] ?? personaId

// Los colaboradores elegidos por nombre en los planes de ejemplo (sin repetir: hay nombres iguales).
const ID_POR_NOMBRE = new Map<string, string>()
for (const u of ACTIVOS) if (!ID_POR_NOMBRE.has(nombreCompleto(u))) ID_POR_NOMBRE.set(nombreCompleto(u), u.id)

const semillaDe = (texto: string) => texto.split('').reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 1_000_003, 7)

// Las personas de un archivo de ejemplo, o de un grupo que ya no existe: siempre las mismas para la misma semilla.
function deEjemplo(semilla: string, cuantas: number) {
  const desde = semillaDe(semilla) % ACTIVOS.length
  return Array.from({ length: Math.min(cuantas, ACTIVOS.length) }, (_, i) => ACTIVOS[(desde + i) % ACTIVOS.length].id)
}

// Quiénes están en una asignación, por id de usuario. Los grupos se leen como están ahora: si alguien entra a un grupo,
// le llega el plan.
const MIEMBROS = new WeakMap<Asignacion, { grupos: unknown; ids: string[] }>()
export function miembrosDe(asignacion: Asignacion): string[] {
  const grupos = gruposActuales()
  const guardado = MIEMBROS.get(asignacion)
  if (guardado && guardado.grupos === grupos) return guardado.ids
  const base =
    asignacion.alcance === 'empresa'
      ? ACTIVOS.map((u) => u.id)
      : asignacion.alcance === 'grupos'
        ? asignacion.destinatarios.flatMap((nombre) => grupoPorNombre(nombre)?.integrantes ?? deEjemplo(nombre, TAMANO_GRUPO[nombre] ?? 0))
        : asignacion.alcance === 'archivo'
          ? deEjemplo(asignacion.id, asignacion.personas || 42)
          : asignacion.destinatarios.flatMap((nombre) => ID_POR_NOMBRE.get(nombre) ?? [])
  const fuera = new Set(asignacion.fuera)
  const ids = [...new Set([...base, ...(asignacion.sumadas ?? [])])].filter((id) => !fuera.has(id))
  MIEMBROS.set(asignacion, { grupos, ids })
  return ids
}

export type PersonaDelPlan = Participante & {
  usuario: string
  // La primera asignación por la que le llega el plan, y todas (alguien puede estar en dos).
  asignacionId: string
  asignaciones: string[]
  // Tiene contenidos propios, distintos a los de su asignación.
  ajustada: boolean
}

// Cuánto lleva cada persona: depende de cuánto lleva el plan (los no vigentes, casi cerrados; los que empezaron hace
// poco, apenas arrancan). Determinista por plan y persona, para que no cambie al editar a otros.
function avanceDe(plan: Plan, usuario: string, total: number) {
  const azar = generador(semillaDe(`${plan.id}-${usuario}`))
  const empezo = plan.estado === 'Vigente' || plan.estado === 'No vigente'
  const duracion = Math.max(1, diasDesde(plan.inicio) - diasDesde(plan.fin))
  const avanceDelPlan = plan.estado === 'No vigente' ? 0.8 : empezo ? Math.min(1, diasDesde(plan.inicio) / duracion) : 0
  const tirada = azar()
  // Siempre hay quien no ha empezado (tirada alta), quien ya terminó (tantos como lleva el plan) y, el resto, a mitad de
  // camino con al menos un contenido hecho.
  const aMitad = total > 1 ? 1 + Math.floor(azar() * (total - 1)) : 0
  const hechos = !empezo || !total || tirada > 0.85 ? 0 : tirada < avanceDelPlan * 0.85 ? total : aMitad
  const acceso = empezo && (hechos > 0 || tirada > 0.4) ? Math.floor(azar() * Math.min(20, diasDesde(plan.inicio) + 1)) : null
  return {
    hechos,
    progreso: total ? Math.round((hechos / total) * 100) : 0,
    ultimoAcceso: acceso === null ? null : `hace ${acceso === 0 ? 'unas horas' : `${acceso} ${plural(acceso, 'día', 'días')}`}`,
    ultimoProgreso: hechos > 0 && acceso !== null ? `hace ${acceso + 1} ${plural(acceso + 1, 'día', 'días')}` : null,
  }
}

// Por persona, las asignaciones por las que le llega el plan (sin quienes se quitaron del plan).
function membresia(plan: Plan) {
  const quitados = new Set((plan.quitados ?? []).map(usuarioIdDe))
  const porUsuario = new Map<string, string[]>()
  for (const asignacion of plan.asignaciones) {
    for (const usuario of miembrosDe(asignacion)) {
      if (quitados.has(usuario)) continue
      porUsuario.set(usuario, [...(porUsuario.get(usuario) ?? []), asignacion.id])
    }
  }
  for (const extra of plan.extras ?? []) if (!quitados.has(extra.usuario) && !porUsuario.has(extra.usuario)) porUsuario.set(extra.usuario, ['extra'])
  return porUsuario
}

// Los contenidos de una persona: los suyos si se le ajustaron; si no, los de sus asignaciones, sin repetir.
function itemsDeUsuario(plan: Plan, usuario: string, asignaciones: string[]) {
  const propios = plan.itemsPersona?.[usuario]
  if (propios) return propios
  if (asignaciones[0] === 'extra') return plan.extras?.find((e) => e.usuario === usuario)?.items ?? []
  return [...new Set(plan.asignaciones.filter((a) => asignaciones.includes(a.id)).flatMap((a) => a.items))]
}

// Las personas del plan, una fila por persona, ya con sus excepciones. Es lo que muestran el plan, su avance y sus paneles.
const PERSONAS_DE = new WeakMap<Plan, { grupos: unknown; filas: PersonaDelPlan[] }>()
export function personasDelPlan(plan: Plan): PersonaDelPlan[] {
  const grupos = gruposActuales()
  const guardado = PERSONAS_DE.get(plan)
  if (guardado && guardado.grupos === grupos) return guardado.filas
  const filas = [...membresia(plan)].flatMap(([usuario, asignaciones]) => {
    const u = USUARIO_POR_ID.get(usuario)
    if (!u) return []
    const items = itemsDeUsuario(plan, usuario, asignaciones)
    // El avance sale de lo que le da su asignación; con contenidos ajustados, lo nuevo empieza sin hacer y lo que se le
    // quitó deja de contar.
    const base = plan.itemsPersona?.[usuario] ? itemsDeUsuario({ ...plan, itemsPersona: undefined }, usuario, asignaciones) : items
    const avance = avanceDe(plan, usuario, base.length)
    const terminados = new Set(base.slice(0, avance.hechos))
    const hechos = items.filter((t) => terminados.has(t)).length
    const progreso = items.length ? Math.round((hechos / items.length) * 100) : 0
    return [{ id: usuario, usuario, asignacionId: asignaciones[0], asignaciones, ajustada: Boolean(plan.itemsPersona?.[usuario]), nombre: nombreCompleto(u), area: u.area, total: items.length, ...avance, hechos, progreso }]
  })
  PERSONAS_DE.set(plan, { grupos, filas })
  return filas
}

// Cuántas personas tiene el plan, sin contar dos veces a quien está en dos asignaciones (la lista sumaba asignaciones).
export function totalPersonas(plan: Pick<Plan, 'asignaciones' | 'quitados'>) {
  const quitados = new Set((plan.quitados ?? []).map(usuarioIdDe))
  return new Set(plan.asignaciones.flatMap(miembrosDe).filter((id) => !quitados.has(id))).size
}

// Los contenidos de cada persona del plan, de una vez (para comparar dos versiones del plan sin buscar persona por persona).
export const itemsPorPersona = (plan: Plan) => new Map(personasDelPlan(plan).map((p) => [p.usuario, itemsDeUsuario(plan, p.usuario, p.asignaciones)]))

// Los contenidos de una persona del plan.
export function itemsDe(plan: Plan, personaId: string) {
  const usuario = usuarioIdDe(personaId)
  return itemsDeUsuario(plan, usuario, personasDelPlan(plan).find((p) => p.usuario === usuario)?.asignaciones ?? [])
}

// ── El plan visto por contenido o competencia (tabs de HU-LMS-015/021) ──
// Cada ítem distinto del plan, con quiénes lo tienen y cuántos ya lo terminaron. Una persona avanza en orden: sus
// primeros `hechos` ítems están terminados.
export type ItemDelPlan = { titulo: string; personas: { id: string; nombre: string; area: string }[]; terminaron: number }

export function itemsDelPlan(plan: Plan): ItemDelPlan[] {
  const porItem = new Map<string, ItemDelPlan>()
  for (const persona of personasDelPlan(plan)) {
    itemsDeUsuario(plan, persona.usuario, persona.asignaciones).forEach((titulo, indice) => {
      const item = porItem.get(titulo) ?? { titulo, personas: [], terminaron: 0 }
      item.personas.push({ id: persona.id, nombre: persona.nombre, area: persona.area })
      if (indice < persona.hechos) item.terminaron += 1
      porItem.set(titulo, item)
    })
  }
  return [...porItem.values()]
}

type Cambios = Pick<Plan, 'asignaciones' | 'itemsPersona' | 'extras'>

// «Agregar personas» de un ítem: los marcados lo tienen; los desmarcados, no (queda como ajuste de cada uno). Quien no
// estaba en el plan entra en una asignación nueva con ese ítem (RN-04). Con `maximo` (competencias, RN-03) no se le suma
// a quien ya tiene el tope: vuelve en `bloqueados`.
export function aplicarUsuarios(plan: Plan, titulo: string, usuarios: string[], maximo?: number): Cambios & { bloqueados: string[] } {
  const itemsPersona = { ...plan.itemsPersona }
  const bloqueados: string[] = []
  const enElPlan = personasDelPlan(plan)
  for (const persona of enElPlan) {
    const actuales = itemsDeUsuario(plan, persona.usuario, persona.asignaciones)
    const tiene = actuales.includes(titulo)
    const marcado = usuarios.includes(persona.usuario)
    if (tiene === marcado) continue
    if (marcado && maximo && actuales.length >= maximo) {
      bloqueados.push(persona.nombre)
      continue
    }
    itemsPersona[persona.usuario] = marcado ? [...actuales, titulo] : actuales.filter((t) => t !== titulo)
  }
  const yaEstan = new Set(enElPlan.map((p) => p.usuario))
  const nuevos = usuarios.filter((usuario) => !yaEstan.has(usuario))
  const asignaciones = nuevos.length
    ? [...plan.asignaciones, { id: `a-${Date.now()}`, alcance: 'colaboradores' as const, destinatarios: [], sumadas: nuevos, personas: nuevos.length, items: [titulo] }]
    : plan.asignaciones
  return { asignaciones, itemsPersona, extras: plan.extras, bloqueados }
}

// ── Editar quién está en cada asignación ──

// Lo que trae una asignación, en piezas que se pueden quitar una a una: toda la empresa, cada grupo, cada colaborador
// elegido por nombre (los planes de ejemplo), cada persona sumada y el archivo.
export type Pieza = { clave: string; tipo: 'empresa' | 'grupo' | 'nombre' | 'persona' | 'archivo'; texto: string; personas: number }

export function piezasDe(asignacion: Asignacion): Pieza[] {
  const sumadas = (asignacion.sumadas ?? []).flatMap((id) => {
    const u = USUARIO_POR_ID.get(id)
    return u ? [{ clave: `persona:${id}`, tipo: 'persona' as const, texto: nombreCompleto(u), personas: 1 }] : []
  })
  if (asignacion.alcance === 'empresa') return [{ clave: 'empresa', tipo: 'empresa', texto: 'Toda la empresa', personas: PERSONAS_EMPRESA }]
  if (asignacion.alcance === 'archivo') return [{ clave: 'archivo', tipo: 'archivo', texto: asignacion.destinatarios[0] ?? 'Archivo', personas: asignacion.personas }, ...sumadas]
  if (asignacion.alcance === 'grupos') {
    return [
      ...asignacion.destinatarios.map((nombre) => ({ clave: `grupo:${nombre}`, tipo: 'grupo' as const, texto: nombre, personas: grupoPorNombre(nombre)?.integrantes.length ?? TAMANO_GRUPO[nombre] ?? 0 })),
      ...sumadas,
    ]
  }
  return [...asignacion.destinatarios.map((nombre) => ({ clave: `nombre:${nombre}`, tipo: 'nombre' as const, texto: nombre, personas: 1 })), ...sumadas]
}

// Con el conteo al día: lo leen la lista de planes y el panel «Ver plan».
const contada = (asignacion: Asignacion): Asignacion => ({ ...asignacion, personas: miembrosDe(asignacion).length })

// Sumar grupos a una asignación. Si era de colaboradores, pasa a ser de grupos y quienes estaban por nombre quedan como
// personas sumadas. Toda la empresa o un archivo no se mezclan con grupos: los grupos los reemplazan.
export function sumarGrupos(asignacion: Asignacion, grupos: string[]): Asignacion {
  if (!grupos.length) return asignacion
  const porNombre = asignacion.alcance === 'colaboradores' ? asignacion.destinatarios.flatMap((n) => ID_POR_NOMBRE.get(n) ?? []) : []
  const previos = asignacion.alcance === 'grupos' ? asignacion.destinatarios : []
  const sumadas = asignacion.alcance === 'empresa' ? [] : [...new Set([...porNombre, ...(asignacion.sumadas ?? [])])]
  return contada({ ...asignacion, alcance: 'grupos', destinatarios: [...new Set([...previos, ...grupos])], sumadas })
}

// Los grupos de una asignación, tal como quedaron marcados en «Agregar grupos» (los desmarcados salen).
export function conGrupos(asignacion: Asignacion, grupos: string[]): Asignacion {
  if (asignacion.alcance !== 'grupos') return sumarGrupos(asignacion, grupos)
  return contada({ ...asignacion, alcance: grupos.length ? 'grupos' : 'colaboradores', destinatarios: grupos })
}

// Sumar personas una a una. A toda la empresa no hace falta sumarle a nadie. Si alguien estaba fuera, vuelve.
export function sumarPersonas(asignacion: Asignacion, usuarios: string[]): Asignacion {
  if (asignacion.alcance === 'empresa' || !usuarios.length) return asignacion
  return contada({
    ...asignacion,
    sumadas: [...new Set([...(asignacion.sumadas ?? []), ...usuarios])],
    fuera: (asignacion.fuera ?? []).filter((id) => !usuarios.includes(id)),
  })
}

// Toda la empresa reemplaza lo que hubiera: ya están todos.
export const aTodaLaEmpresa = (asignacion: Asignacion): Asignacion => contada({ ...asignacion, alcance: 'empresa', destinatarios: [], sumadas: [], fuera: [] })

export function conArchivo(asignacion: Asignacion, archivo: string, personas: number): Asignacion {
  return contada({ ...asignacion, alcance: 'archivo', destinatarios: [archivo], sumadas: [], fuera: [], personas })
}

// Quitar una pieza. Al quitar el último grupo, o toda la empresa, lo que queda son las personas sumadas.
export function quitarPieza(asignacion: Asignacion, pieza: Pieza): Asignacion {
  const resto = (lista: string[], valor: string) => lista.filter((x) => x !== valor)
  if (pieza.tipo === 'persona') return contada({ ...asignacion, sumadas: resto(asignacion.sumadas ?? [], pieza.clave.slice('persona:'.length)) })
  if (pieza.tipo === 'grupo') {
    const destinatarios = resto(asignacion.destinatarios, pieza.texto)
    return contada({ ...asignacion, alcance: destinatarios.length ? 'grupos' : 'colaboradores', destinatarios })
  }
  if (pieza.tipo === 'nombre') return contada({ ...asignacion, destinatarios: resto(asignacion.destinatarios, pieza.texto) })
  return contada({ ...asignacion, alcance: 'colaboradores', destinatarios: [], fuera: [] })
}

// Devolver a su asignación a quien había quedado fuera.
export const devolver = (asignacion: Asignacion, usuario: string): Asignacion => contada({ ...asignacion, fuera: (asignacion.fuera ?? []).filter((id) => id !== usuario) })

// Sacar a unas personas de las asignaciones donde están: las sumadas se van de la lista; las que vienen por un grupo, por
// nombre, por archivo o por toda la empresa quedan «fuera» de esa asignación.
function sacarDe(asignacion: Asignacion, usuarios: string[]): Asignacion {
  const estan = usuarios.filter((id) => miembrosDe(asignacion).includes(id))
  if (!estan.length) return asignacion
  const sumadas = (asignacion.sumadas ?? []).filter((id) => !estan.includes(id))
  const porLaBase = estan.filter((id) => !(asignacion.sumadas ?? []).includes(id))
  return contada({ ...asignacion, sumadas, fuera: [...new Set([...(asignacion.fuera ?? []), ...porLaBase])] })
}

// «Pasar a otra asignación»: salen de donde estaban y entran a la elegida con sus contenidos (se les quita el ajuste: ahora
// ven los de su nueva asignación).
export function moverPersonas(plan: Plan, usuarios: string[], destino: string): Plan {
  const itemsPersona = Object.fromEntries(Object.entries(plan.itemsPersona ?? {}).filter(([id]) => !usuarios.includes(id)))
  return {
    ...plan,
    itemsPersona,
    asignaciones: plan.asignaciones.map((a) => (a.id === destino ? sumarPersonas(a, usuarios) : sacarDe(a, usuarios))),
  }
}

// «Quitar del plan»: dejan de verlo. Lo que ya avanzaron se conserva en su historial.
export function quitarPersonas(plan: Plan, usuarios: string[]): Plan {
  return { ...plan, quitados: [...new Set([...(plan.quitados ?? []).map(usuarioIdDe), ...usuarios])] }
}

// Volver a sumar a quien se quitó del plan (al agregarla de nuevo a una asignación).
export const sinQuitados = (plan: Plan, usuarios: string[]): Plan => ({ ...plan, quitados: (plan.quitados ?? []).map(usuarioIdDe).filter((id) => !usuarios.includes(id)) })

// «Ajustar sus contenidos»: los de esta persona dejan de seguir a su asignación. Con null, vuelve a los de su asignación.
export function ajustarItems(plan: Plan, usuario: string, items: string[] | null): Plan {
  const itemsPersona = { ...plan.itemsPersona }
  if (items === null) delete itemsPersona[usuario]
  else itemsPersona[usuario] = items
  return { ...plan, itemsPersona }
}

// Cómo se llama una asignación en una línea: lo que la define, no un número.
export function nombreAsignacion(asignacion: Asignacion) {
  return asignacion.nombre?.trim() || quienesDe(asignacion)
}

// A quiénes les llega, en una línea: «Equipo comercial Q3, Ana Restrepo y 3 más».
export function quienesDe(asignacion: Asignacion) {
  const piezas = piezasDe(asignacion)
  if (!piezas.length) return 'Sin personas todavía'
  const primeras = piezas.slice(0, 2).map((p) => p.texto)
  return `${primeras.join(', ')}${piezas.length > 2 ? ` y ${piezas.length - 2} más` : ''}`
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

// Cómo se lee cada estado en pantalla. Los estados salen de la ventana de tiempo del plan: antes de empezar, dentro de
// las fechas y después. «No vigente» confundía (war room del 14-oct, Cristian Niño); la propuesta es «Finalizado». El
// valor por dentro no cambia (lo usan las HU y las evaluaciones de David): solo el nombre, y aquí, en un solo lugar.
export const NOMBRE_ESTADO: Record<EstadoPlan, string> = {
  Vigente: 'Vigente',
  Planeado: 'Planeado',
  'No vigente': 'Finalizado',
  Procesando: 'Procesando',
}

// Qué significa cada estado, para la ayuda junto a la insignia: lo que se estudia fuera de las fechas no cuenta.
export const AYUDA_ESTADO: Record<EstadoPlan, string> = {
  Planeado: 'Todavía no empieza. Las personas lo ven desde la fecha de inicio.',
  Procesando: 'Se está asignando a las personas. Toma unos minutos.',
  Vigente: 'Está dentro de sus fechas: lo que las personas estudian cuenta para el plan.',
  'No vigente': 'Ya pasó su fecha de fin. Pueden seguir estudiando, pero ya no cuenta para el plan.',
}

export const NOMBRE_ALCANCE: Record<Alcance, string> = {
  empresa: 'Toda la empresa',
  colaboradores: 'Por colaborador',
  grupos: 'Por grupo',
  archivo: 'Desde archivo',
}

// A quién, en una línea: «Toda la empresa», «Equipo comercial Q3, Mandos medios», «Ana Restrepo, Diego Soto y 44 más».
export function aQuien(asignacion: Pick<Asignacion, 'alcance' | 'destinatarios' | 'sumadas'>) {
  if (asignacion.alcance === 'empresa') return 'Toda la empresa'
  const sumadas = asignacion.sumadas?.length ?? 0
  if (asignacion.alcance !== 'colaboradores') {
    return `${asignacion.destinatarios.join(', ')}${sumadas ? ` y ${sumadas} ${plural(sumadas, 'persona más', 'personas más')}` : ''}`
  }
  const nombres = [...asignacion.destinatarios, ...(asignacion.sumadas ?? []).flatMap((id) => (USUARIO_POR_ID.get(id) ? [nombreCompleto(USUARIO_POR_ID.get(id)!)] : []))]
  const resto = nombres.length - 2
  return `${nombres.slice(0, 2).join(', ')}${resto > 0 ? ` y ${resto} más` : ''}`
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

// El plan de muestra del 14-oct: el caso que pidió diseño, varias asignaciones en un mismo plan, cada una con su gente y
// sus contenidos. Comerciales con lo de ventas; mandos medios (más dos personas sumadas) con lo de liderazgo; seis
// analistas sueltos con lo suyo. Una comercial tiene un contenido de más (ajustada) y otro comercial se pasó a analistas.
function planDeMuestra(): Plan {
  const comerciales = grupoPorNombre('Equipo comercial Q3')?.integrantes ?? []
  const [ajustada, movido] = [comerciales[2], comerciales[5]]
  const sueltos = ACTIVOS.slice(500, 506).map((u) => u.id)
  const asignaciones: Asignacion[] = [
    { id: 'm-1', nombre: 'Comerciales', alcance: 'grupos', destinatarios: ['Equipo comercial Q3'], sumadas: [], fuera: movido ? [movido] : [], personas: 0, items: ['Onboarding comercial Q3', 'Ventas consultivas', 'Negociación para compras'] },
    { id: 'm-2', nombre: 'Líderes', alcance: 'grupos', destinatarios: ['Mandos medios'], sumadas: ACTIVOS.slice(300, 302).map((u) => u.id), personas: 0, items: ['Ruta para nuevos líderes', 'Liderazgo ágil', 'Comunicación efectiva'] },
    { id: 'm-3', nombre: 'Analistas', alcance: 'colaboradores', destinatarios: [], sumadas: movido ? [...sueltos, movido] : sueltos, personas: 0, items: ['Excel intermedio', 'Presentaciones de alto impacto'] },
  ]
  return {
    id: 'p-00',
    nombre: 'Arranque del cuarto trimestre',
    tipo: 'contenidos',
    estado: 'Vigente',
    inicio: '2026-09-01',
    fin: '2026-11-27',
    asignaciones: asignaciones.map((a) => ({ ...a, personas: miembrosDe(a).length })),
    itemsPersona: ajustada ? { [ajustada]: ['Onboarding comercial Q3', 'Ventas consultivas', 'Negociación para compras', 'Excel intermedio'] } : {},
    tocado: 1,
  }
}

let planes: Plan[] = [planDeMuestra(), ...PLANES_INICIALES.map(sinUsuario), ...PLANES_COMPETENCIAS.map(sinUsuario)]
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
