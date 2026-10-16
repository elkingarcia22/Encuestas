import {
  BD_MASTER_ALIADOS,
  BD_MASTER_COLABORADORES,
  BD_MASTER_COMPETENCIAS,
  BD_PLANES_FORMACION,
  BDS_CONTENIDOS_UBITS,
  CONTENIDOS,
  nombreNivel,
} from '@/shared/bd'
import { notify } from '@/shared/components/notify'
import metaLogo from '@/shared/assets/meta.png'

// Datos de la Zona de estudio del colaborador (HU-APR-003, HU-APR-011) y de Progreso (HU-progreso). Todo sale de las
// bases del playground: los planes de formación (en sessionStorage, como en el prototipo), el catálogo de UBITS y los
// contenidos de la empresa. La persona con la sesión abierta es María Alejandra (E006), líder de Logística.

export const USUARIO_ID = 'E006'

// ── Tipos ────────────────────────────────────────────────────────────────────────────────────────────────────────

export type TipoPlan = 'contenidos' | 'competencias'
export type EstadoPlan = 'Vigente' | 'No vigente' | 'Planeado' | string

type ItemPlan = {
  id: string
  title?: string
  nombre?: string
  duration?: string
  progress?: number
  status?: string
}

export type Plan = {
  id: string
  nombre: string
  estado: EstadoPlan
  tipo: TipoPlan
  fechaInicioIso: string
  fechaFinIso: string
  area?: string
  competenciaId?: string
  horasEstudioMeta?: number
  contenidoPorUsuario?: Record<string, ItemPlan[]>
  competenciaPorUsuario?: Record<string, ItemPlan[]>
  consumoPorUsuario?: Record<string, { horas?: number; items?: { contenidoId: string }[] }>
  asignaciones?: { colaboradorId?: string; id?: string }[]
}

/** Lo que pinta la TarjetaContenido del equipo. */
export type Tarjeta = {
  id: string
  titulo: string
  imagen?: string
  tipo: string
  proveedor: string
  logoProveedor?: string
  competencia: string
  nivel: string
  duracion: string
  idioma: string
  progreso: number
  conCertificado: boolean
}

type ItemUbits = {
  id: string
  titulo: string
  imagen?: string
  tipoContenido?: string
  tiempoValor?: number
  idioma?: string
  competenciaPrincipalId?: string
  nivelId?: string
  aliadoId?: string
  providersAliadosIds?: string[]
  conCertificacion?: boolean
}

type Aliado = { id: string; nombre: string; logo: string }
type Competencia = { id: string; nombre: string; archivoImagen: string }

export type Registro = {
  id: string
  nombre: string
  cargo: string
  area: string
  avatar?: string
  username: string
  jefe?: string
  esGerenteGeneral?: boolean
}

// ── Maestros ─────────────────────────────────────────────────────────────────────────────────────────────────────

const ALIADOS = (BD_MASTER_ALIADOS as { aliados: Aliado[] }).aliados
export const COMPETENCIAS = (BD_MASTER_COMPETENCIAS as { competencias: Competencia[] }).competencias
export const CATALOGO = (BDS_CONTENIDOS_UBITS as { contents: ItemUbits[] }).contents
export const REGISTROS = (BD_MASTER_COLABORADORES as { colaboradores: Registro[] }).colaboradores

/** Las rutas de las bases vienen sin «/» inicial (o con «../../»): aquí se dejan desde la raíz del sitio. */
export const ruta = (valor?: string | null) => {
  if (!valor) return undefined
  if (/^https?:\/\//.test(valor)) return valor
  return `/${valor.replace(/^(\.\.\/)+/, '').replace(/^\//, '')}`
}

const aliado = (id?: string) => ALIADOS.find((a) => a.id === id)
// El nombre sale del catálogo de aliados, pero **el logo es el mismo archivo que usa la barra lateral** para la
// empresa (`shared/assets/meta.png`), no el que trae el aliado: en la tarjeta del contenido y en el menú de cuenta
// se ve la misma marca, que es lo que espera quien mira (Dave, 2-oct).
export const EMPRESA = {
  ...(aliado('aly-018') ?? { id: 'aly-018', nombre: 'Tu empresa' }),
  logo: metaLogo,
}

export const competenciaPorId = (id?: string) => COMPETENCIAS.find((c) => c.id === id)
export const imagenCompetencia = (id?: string) => `/images/imagenes competencias/${competenciaPorId(id)?.archivoImagen ?? 'Liderazgo.jpg'}`

export const persona = (id: string) => REGISTROS.find((r) => r.id === id)
export const avatarDe = (r?: Registro) => ruta(r?.avatar)

// ── Tarjetas ─────────────────────────────────────────────────────────────────────────────────────────────────────

// El proveedor que se muestra es el aliado principal: el primero que no es UBITS.
function proveedorUbits(c: ItemUbits) {
  const ids = c.providersAliadosIds ?? []
  const id = ids.find((x) => x !== 'aly-001') ?? ids[0] ?? c.aliadoId ?? 'aly-001'
  return aliado(id) ?? aliado('aly-001')
}

export function tarjetaUbits(c: ItemUbits, progreso = 0): Tarjeta {
  const p = proveedorUbits(c)
  return {
    id: c.id,
    titulo: c.titulo,
    imagen: ruta(c.imagen),
    tipo: c.tipoContenido ?? 'Curso',
    proveedor: p?.nombre ?? 'UBITS',
    logoProveedor: ruta(p?.logo),
    competencia: competenciaPorId(c.competenciaPrincipalId)?.nombre ?? 'Competencia',
    nivel: nombreNivel(c.nivelId ?? 'niv-002'),
    duracion: `${c.tiempoValor ?? 60} min`,
    idioma: c.idioma ?? 'Español',
    progreso,
    conCertificado: c.conCertificacion !== false,
  }
}

// Las categorías de la universidad corporativa se muestran como la competencia que trabajan (mismo mapa del prototipo).
const COMPETENCIA_POR_CATEGORIA: Record<string, string> = {
  'cfq-001': 'Liderazgo',
  'cfq-002': 'Comunicación',
  'cfq-003': 'Trabajo en equipo',
  'cfq-004': 'Gestión de proyectos',
  'cfq-005': 'Innovación',
  'cfq-006': 'Marketing digital',
  'cfq-007': 'Experiencia del cliente',
  'cfq-008': 'Gestión financiera',
  'cfq-009': 'People management',
  'cfq-010': 'Inteligencia emocional',
  'cfq-011': 'Resolución de problemas',
  'cfq-012': 'Productividad',
  'cfq-013': 'Negociación',
  'cfq-014': 'Ventas',
  'cfq-015': 'Marketing',
  'cfq-016': 'Gestión del cambio',
  'cfq-017': 'Desarrollo de software',
  'cfq-018': 'Data skills',
  'cfq-019': 'Wellness',
}

type ContenidoEmpresa = (typeof CONTENIDOS)[number]

export function tarjetaEmpresa(c: ContenidoEmpresa, progreso = 0): Tarjeta {
  return {
    id: c.id,
    titulo: c.titulo,
    imagen: c.imagen,
    tipo: c.tipo,
    proveedor: EMPRESA.nombre,
    logoProveedor: ruta(EMPRESA.logo),
    competencia: COMPETENCIA_POR_CATEGORIA[c.categoriaId] ?? 'Liderazgo',
    nivel: nombreNivel(c.nivelId),
    duracion: `${c.minutos} min`,
    idioma: c.idioma,
    progreso,
    conCertificado: c.conCertificacion,
  }
}

/** La experiencia de estudio todavía no existe en este playground. */
export const abrirContenido = () =>
  notify('Experiencia de estudio', 'Aquí se abre el contenido para estudiarlo. Esa pantalla aún no está en el playground.')

/** Búsqueda de las listas: título, competencia, tipo y nivel (como en el prototipo). */
export function filtrar<T extends Tarjeta>(lista: T[], busqueda: string): T[] {
  const q = busqueda.trim().toLowerCase()
  if (!q) return lista
  return lista.filter((t) => [t.titulo, t.competencia, t.tipo, t.nivel].some((campo) => campo.toLowerCase().includes(q)))
}

// ── Planes ───────────────────────────────────────────────────────────────────────────────────────────────────────

type BdPlanes = {
  PLAYGROUND_TODAY: string
  reseedIfCorrupt: () => void
  getPlanesParaColaborador: (id: string, opts?: { tipo?: TipoPlan; estados?: string[] }) => Plan[]
  getProgresoColaboradorEnPlan: (plan: Plan, id: string) => number
  getPlanById: (id: string) => Plan | null
  getPlanesVisiblesCreator: () => Plan[]
  getDetalleContenidoPorUsuario: (plan: Plan) => Record<string, ItemPlan[]>
  addPlan: (plan: Record<string, unknown>) => Plan | null
}

export const PLANES = BD_PLANES_FORMACION as unknown as BdPlanes
export const HOY = PLANES.PLAYGROUND_TODAY

/** Los planes de una persona que se ven en la Zona de estudio: sin los que todavía no empiezan ni los que se procesan. */
export function planesZona(tipo: TipoPlan, id = USUARIO_ID) {
  PLANES.reseedIfCorrupt()
  return PLANES.getPlanesParaColaborador(id, { tipo }).filter((p) => p.estado !== 'Planeado' && !String(p.estado).startsWith('Procesando'))
}

export const avancePlan = (plan: Plan, id = USUARIO_ID) => PLANES.getProgresoColaboradorEnPlan(plan, id)

export function conteoContenidos(plan: Plan, id = USUARIO_ID) {
  const items = plan.contenidoPorUsuario?.[id] ?? []
  return {
    hechos: items.filter((i) => (i.progress ?? 0) >= 100).length,
    total: items.length,
    pct: avancePlan(plan, id),
  }
}

export function minutosCompetencia(plan: Plan, id = USUARIO_ID) {
  return {
    hechos: Math.round((plan.consumoPorUsuario?.[id]?.horas ?? 0) * 60),
    total: Math.round((plan.horasEstudioMeta ?? 2) * 60),
    pct: avancePlan(plan, id),
  }
}

/** «1 de 3 contenidos» o «45% de avance», lo que acompaña a cada plan en el selector. */
export const metaPlan = (plan: Plan) => {
  if (plan.tipo === 'competencias') return `${minutosCompetencia(plan).pct}% de avance`
  const { hechos, total } = conteoContenidos(plan)
  return `${hechos} de ${total} contenidos`
}

export function tarjetasDelPlan(plan: Plan): Tarjeta[] {
  return (plan.contenidoPorUsuario?.[USUARIO_ID] ?? []).flatMap((item) => {
    const c = CATALOGO.find((x) => x.id === item.id)
    return c ? [tarjetaUbits(c, item.progress ?? 0)] : []
  })
}

/** El carrusel de una competencia: primero lo que ya consumió, luego sugerencias de esa competencia; máximo 12. */
export function tarjetasDeCompetencia(plan: Plan): Tarjeta[] {
  const pct = minutosCompetencia(plan).pct
  const vistos = [...new Set((plan.consumoPorUsuario?.[USUARIO_ID]?.items ?? []).map((i) => i.contenidoId))]
  const primeros = vistos.flatMap((id, i) => {
    const c = CATALOGO.find((x) => x.id === id)
    return c ? [tarjetaUbits(c, i === 0 ? Math.min(100, pct) : 0)] : []
  })
  const resto = CATALOGO.filter((c) => c.competenciaPrincipalId === plan.competenciaId && !vistos.includes(c.id)).map((c) => tarjetaUbits(c))
  return [...primeros, ...resto].slice(0, 12)
}

// ── Fechas ───────────────────────────────────────────────────────────────────────────────────────────────────────

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const DIA = 24 * 60 * 60 * 1000
const fecha = (iso: string) => new Date(`${iso}T00:00:00`)
export const fechaCorta = (iso?: string) => {
  if (!iso) return '—'
  const f = fecha(iso)
  return `${f.getDate()} ${MESES[f.getMonth()]} ${f.getFullYear()}`
}

export const vigencia = (plan: Plan) =>
  `Del ${fechaCorta(plan.fechaInicioIso)}, 12:00 a. m. al ${fechaCorta(plan.fechaFinIso)}, 11:59 p. m. · Hora local (CDMX, UTC−6)`

export const diasParaTerminar = (plan: Plan) => Math.max(0, Math.ceil((fecha(plan.fechaFinIso).getTime() - fecha(HOY).getTime()) / DIA))

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`

/** «3 meses», «2 semanas»: cuánto hace que venció. */
export function vencidoHace(plan: Plan) {
  const dias = Math.max(0, Math.ceil((fecha(HOY).getTime() - fecha(plan.fechaFinIso).getTime()) / DIA))
  if (dias <= 0) return '0 días'
  if (dias < 7) return plural(dias, 'día', 'días')
  const semanas = Math.floor(dias / 7)
  if (semanas <= 6) return plural(semanas, 'semana', 'semanas')
  const fin = fecha(plan.fechaFinIso)
  const hoy = fecha(HOY)
  const meses = Math.max(1, (hoy.getFullYear() - fin.getFullYear()) * 12 + hoy.getMonth() - fin.getMonth())
  return plural(meses, 'mes', 'meses')
}

/** «4 hrs. 30 min.», el formato de los rankings y del avance por competencias. */
export const horasMinutos = (minutos: number) => {
  const m = Math.max(0, Math.round(minutos))
  return `${Math.floor(m / 60)} hrs. ${m % 60} min.`
}

export function formatIndicatorNumber(n: number): string {
  if (!Number.isFinite(n)) return '0'
  if (n >= 1_000_000) return (Math.round((n / 1_000_000) * 10) / 10).toLocaleString('es-CO') + ' M'
  if (n >= 10_000) return (Math.round((n / 1_000) * 10) / 10).toLocaleString('es-CO') + ' K'
  return n.toLocaleString('es-CO')
}

// ── Exclusivo para mí ────────────────────────────────────────────────────────────────────────────────────────────

const EXCLUSIVO: [string, number][] = [
  ['f001', 100],
  ['f002', 100],
  ['f003', 65],
  ['f004', 0],
]

export const TARJETAS_EXCLUSIVO: Tarjeta[] = EXCLUSIVO.flatMap(([id, progreso]) => {
  const c = CONTENIDOS.find((x) => x.id === id)
  return c ? [tarjetaEmpresa(c, progreso)] : []
})

// ── Historial y certificados ─────────────────────────────────────────────────────────────────────────────────────

// Un número estable por texto: el historial sale siempre igual, sin guardar nada.
function semilla(texto: string) {
  let h = 2166136261
  for (let i = 0; i < texto.length; i++) h = Math.imul(h ^ texto.charCodeAt(i), 16777619)
  return h >>> 0
}

const EN_CURSO = [75, 25, 42, 88, 53, 31, 67, 18, 92, 48, 61, 36]

/** 40 contenidos, mitad UBITS y mitad de la empresa; cuatro siguen en curso y van primero. */
export const TARJETAS_HISTORIAL: Tarjeta[] = (() => {
  const ubits = [...CATALOGO].sort((a, b) => semilla(`hist-u-${a.id}`) - semilla(`hist-u-${b.id}`))
  const empresa = CONTENIDOS.filter((c) => c.visibilidad === 'Publicado').sort((a, b) => semilla(`hist-f-${a.id}`) - semilla(`hist-f-${b.id}`))
  const pool: Tarjeta[] = []
  for (let i = 0; pool.length < 40 && (i < ubits.length || i < empresa.length); i++) {
    if (ubits[i]) pool.push(tarjetaUbits(ubits[i], 100))
    if (pool.length < 40 && empresa[i]) pool.push(tarjetaEmpresa(empresa[i], 100))
  }
  const enCurso = pool
    .map((t, i) => ({ i, s: semilla(`ip-${t.id}-${i}`) }))
    .sort((a, b) => a.s - b.s)
    .slice(0, Math.round(pool.length * 0.1))
  enCurso.forEach(({ i }) => {
    pool[i] = {
      ...pool[i],
      progreso: EN_CURSO[semilla(`pct-${pool[i].id}-${i}`) % EN_CURSO.length],
    }
  })
  return [...pool.filter((t) => t.progreso < 100), ...pool.filter((t) => t.progreso >= 100)]
})()

// ── Eventos ──────────────────────────────────────────────────────────────────────────────────────────────────────

export type Sesion = {
  clave: string
  titulo: string
  evento: string
  imagen: string
  inicio: Date
  fin: Date
  enVivo: boolean
}

const EVENTO = CONTENIDOS.find((c) => c.id === 'f021')

const SESIONES: [string, number, number, number][] = [
  // título, días hábiles desde hoy, hora de inicio, horas
  ['Sesión 3 — Repaso final', 1, 9, 2],
  ['Sesión 4 — Simulacro sedes Bogotá', 2, 14, 2],
  ['Sesión 5 — Operarios turno noche', 3, 10, 2],
  ['Sesión 6 — Cierre anual SST', 4, 8, 4],
  ['Sesión 7 — Instructores regionales', 5, 10, 2],
  ['Sesión 8 — Brigada de emergencia', 6, 11, 2],
  ['Sesión 9 — Primeros auxilios', 7, 15, 2],
  ['Sesión 10 — Evacuación vertical', 8, 9, 2],
  ['Sesión 11 — Comité de convivencia', 9, 14, 2],
]

const esHabil = (f: Date) => f.getDay() !== 0 && f.getDay() !== 6

function diaHabil(desde: Date, saltos: number) {
  const f = new Date(desde)
  f.setHours(0, 0, 0, 0)
  while (!esHabil(f)) f.setDate(f.getDate() + 1)
  for (let n = 0; n < saltos;) {
    f.setDate(f.getDate() + 1)
    if (esHabil(f)) n++
  }
  return f
}

const aLas = (dia: Date, hora: number) => {
  const f = new Date(dia)
  f.setHours(hora, 0, 0, 0)
  return f
}

/** Las sesiones que vienen (HU-APR-011): una en curso y las de los próximos días hábiles, de la más cercana a la más lejana. */
export function proximasSesiones(ahora = new Date()) {
  const base = {
    evento: EVENTO?.titulo ?? 'Evento',
    imagen: EVENTO?.imagen ?? '',
  }
  // La sesión en vivo: hoy si es hábil, alrededor de esta hora y dentro de la jornada (8:00 a 19:00).
  let vivo: Sesion
  if (esHabil(ahora)) {
    const hora = ahora.getHours()
    const inicio = Math.min(Math.max(hora - 1, 8), 19)
    let fin = Math.min(Math.max(hora + 2, 8), 19)
    if (fin <= inicio) fin = inicio + 2
    vivo = {
      ...base,
      clave: 'vivo',
      titulo: 'Sesión en curso — Operarios planta',
      inicio: aLas(ahora, inicio),
      fin: aLas(ahora, fin),
      enVivo: true,
    }
  } else {
    const lunes = diaHabil(ahora, 0)
    vivo = {
      ...base,
      clave: 'vivo',
      titulo: 'Sesión en curso — Operarios planta',
      inicio: aLas(lunes, 9),
      fin: aLas(lunes, 12),
      enVivo: true,
    }
  }
  const siguientes = SESIONES.map(([titulo, saltos, hora, horas]) => {
    const dia = diaHabil(ahora, saltos)
    return {
      ...base,
      clave: titulo,
      titulo,
      inicio: aLas(dia, hora),
      fin: aLas(dia, hora + horas),
      enVivo: false,
    }
  })
  const todas = [vivo, ...siguientes].filter((s) => s.fin.getTime() > ahora.getTime()).sort((a, b) => a.inicio.getTime() - b.inicio.getTime())
  return { mis: todas.slice(0, 3), publicos: todas.slice(3, 10) }
}

export const PROVEEDOR_EVENTO = {
  nombre: EMPRESA.nombre,
  logo: ruta(EMPRESA.logo),
}

const HORA = new Intl.DateTimeFormat('es-CO', {
  hour: 'numeric',
  minute: '2-digit',
})
export const horario = (s: Sesion) => `${HORA.format(s.inicio)} - ${HORA.format(s.fin)}`
export const mesCorto = (f: Date) => new Intl.DateTimeFormat('es-CO', { month: 'short' }).format(f).replace('.', '').toUpperCase()

// Añadir a mi calendario: Google y Outlook abren su formulario; Apple y «otro» descargan un .ics.
const utc = (f: Date) =>
  f
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')

export function enlaceCalendario(s: Sesion, destino: 'google' | 'outlook') {
  const titulo = `${s.evento} — ${s.titulo}`
  if (destino === 'google') {
    const q = new URLSearchParams({
      action: 'TEMPLATE',
      text: titulo,
      dates: `${utc(s.inicio)}/${utc(s.fin)}`,
      details: s.evento,
    })
    return `https://calendar.google.com/calendar/render?${q.toString()}`
  }
  const q = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: titulo,
    startdt: s.inicio.toISOString(),
    enddt: s.fin.toISOString(),
    body: s.evento,
  })
  return `https://outlook.office.com/calendar/0/deeplink/compose?${q.toString()}`
}

export function descargarIcs(s: Sesion) {
  const titulo = `${s.evento} — ${s.titulo}`
  const slug =
    s.titulo
      .toLowerCase()
      .replace(/[^a-z0-9áéíóúñü]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'sesion'
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//UBITS//Asistencia//ES',
    'BEGIN:VEVENT',
    `UID:${s.inicio.toISOString()}@ubits.playground`,
    `DTSTAMP:${utc(new Date())}`,
    `DTSTART:${utc(s.inicio)}`,
    `DTEND:${utc(s.fin)}`,
    `SUMMARY:${titulo}`,
    `DESCRIPTION:${s.evento.slice(0, 1500)}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Recordatorio',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `asistencia-${slug}.ics`
  a.click()
  URL.revokeObjectURL(url)
}
