import { BDS_CONTENIDOS_UBITS, CONTENIDOS } from '@/shared/bd'
import { COMPETENCIAS, HOY, PLANES, USUARIO_ID as LIDER_ID, type Registro } from '../../zona-de-estudio/components/datos'
import { plural } from '@/modules/design-system/patrones/formato'

// La lógica del «Agente de planes» (HU-progreso, RN-05): sin IA de verdad, como en el prototipo. Lee las respuestas con
// reglas (nombres del equipo, fechas dichas con naturalidad, títulos del catálogo, competencias y horas) y guarda el
// plan en la base de planes de formación.

export type TipoPlanIA = 'contenidos' | 'competencias'
export type Contenido = { id: string; title: string; duration: string }
export type CompetenciaIA = { id: string; nombre: string }

export type Borrador = {
  tipo: TipoPlanIA | null
  titulo: string
  personas: Registro[]
  todos: boolean
  inicio: string
  fin: string
  contenidos: Contenido[]
  competencias: CompetenciaIA[]
  horas: Record<string, number>
}

export const borradorVacio = (): Borrador => ({
  tipo: null,
  titulo: '',
  personas: [],
  todos: false,
  inicio: '',
  fin: '',
  contenidos: [],
  competencias: [],
  horas: {},
})

export const normalizar = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const palabras = (s: string) => normalizar(s).split(' ').filter(Boolean)

/** «A, B y C» */
export const enLista = (xs: string[]) => (xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`)

// ── Fechas ───────────────────────────────────────────────────────────────────────────────────────────────────────

const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const MES: Record<string, number> = {
  ...Object.fromEntries(MESES_LARGOS.map((m, i) => [m, i + 1])),
  setiembre: 9,
  ene: 1,
  feb: 2,
  mar: 3,
  abr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  ago: 8,
  sep: 9,
  sept: 9,
  oct: 10,
  nov: 11,
  dic: 12,
}

const iso = (y: number, m: number, d: number) => {
  const f = new Date(y, m - 1, d)
  if (f.getFullYear() !== y || f.getMonth() !== m - 1 || f.getDate() !== d) return null
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

const sumarDias = (base: string, n: number) => {
  const f = new Date(`${base}T00:00:00`)
  f.setDate(f.getDate() + n)
  return iso(f.getFullYear(), f.getMonth() + 1, f.getDate())
}

const mesDe = (palabra: string) => {
  if (MES[palabra]) return MES[palabra]
  if (palabra.length < 3) return null
  const clave = Object.keys(MES)
    .filter((k) => k.startsWith(palabra.slice(0, 3)) && (k.startsWith(palabra) || palabra.startsWith(k)))
    .sort((a, b) => b.length - a.length)[0]
  return clave ? MES[clave] : null
}

/** «hoy», «mañana», «20 de junio de 2026», «20/06/2026» o «2026-06-20». */
export function leerFecha(texto: string): string | null {
  const t = normalizar(texto.replace(/[/-]/g, ' / '))
  const crudo = texto.trim()
  if (!/\d/.test(texto)) {
    if (/\bpasado manana\b/.test(t)) return sumarDias(HOY, 2)
    if (/\bmanana\b/.test(t)) return sumarDias(HOY, 1)
    if (/\b(hoy|today)\b/.test(t)) return HOY
  }
  let m = crudo.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (m) return iso(+m[1], +m[2], +m[3])
  m = crudo.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (m) return iso(+m[3], +m[2], +m[1])
  const n = normalizar(texto)
  m = n.match(/(\d{1,2})\s*(?:de\s+)?([a-z]+)\s*(?:del?\s+)?(?:ano\s+)?(\d{4})/)
  if (m) {
    const mes = mesDe(m[2])
    if (mes) return iso(+m[3], mes, +m[1])
  }
  m = crudo.match(/(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (m) return iso(+m[1], +m[2], +m[3])
  m = crudo.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/)
  if (m) return iso(+m[3], +m[2], +m[1])
  if (/\bhoy\b/.test(n) && !/\d{4}/.test(n)) return HOY
  return null
}

export const fechaLarga = (valor: string) => {
  const [y, m, d] = valor.split('-').map(Number)
  return `${d} de ${MESES_LARGOS[m - 1]} de ${y}`
}

// ── Personas ─────────────────────────────────────────────────────────────────────────────────────────────────────

const TODOS = ['todo', 'todos', 'todo el equipo', 'a todo el equipo', 'mi equipo', 'el equipo completo', 'todo mi equipo']
const YO = ['mi', 'yo', 'para mi', 'para mimismo', 'a mi', 'mi misma', 'a mi misma', 'mi mismo', 'a mi mismo']

export function leerPersonas(texto: string, equipo: Registro[]) {
  const n = normalizar(texto)
  if (TODOS.includes(n) || (/\btodos\b/.test(n) && !texto.includes(',') && palabras(texto).length <= 4))
    return { personas: equipo, todos: true, desconocidos: [] as string[] }
  const partes = texto
    .split(/\n|;|,|\sy\s/i)
    .map((p) => p.trim().replace(/^(para|a)\s+/i, ''))
    .filter(Boolean)
  const encontradas: Registro[] = []
  const desconocidos: string[] = []
  for (const parte of partes) {
    const seg = normalizar(parte)
    if (!seg) continue
    if (YO.includes(seg) || YO.includes(`a ${seg}`)) {
      const lider = equipo.find((p) => p.id === LIDER_ID)
      if (lider) encontradas.push(lider)
      continue
    }
    const tokens = palabras(parte)
    const coincide = equipo.filter((p) => {
      const nombre = normalizar(p.nombre)
      if (nombre === seg || (seg.length >= 4 && nombre.includes(seg))) return true
      const propias = nombre.split(' ')
      return tokens.every((t) => propias.includes(t) || (t.length >= 4 && propias.some((x) => x.startsWith(t))))
    })
    if (coincide.length === 1) encontradas.push(coincide[0])
    else if (coincide.length > 1) {
      const exacta = coincide.find((p) => normalizar(p.nombre) === seg)
      encontradas.push(...(exacta ? [exacta] : coincide))
    } else desconocidos.push(parte)
  }
  const unicas = [...new Map(encontradas.map((p) => [p.id, p])).values()]
  return { personas: unicas, todos: false, desconocidos }
}

export const quienes = (b: Pick<Borrador, 'personas' | 'todos'>) =>
  b.todos
    ? 'todo el equipo'
    : b.personas.length === 1
      ? b.personas[0].nombre
      : b.personas.length <= 3
        ? enLista(b.personas.map((p) => p.nombre))
        : `${b.personas.length} ${plural(b.personas.length, 'persona', 'personas')} de tu equipo`

// ── Contenidos y competencias ────────────────────────────────────────────────────────────────────────────────────

type ItemCatalogo = { id: string; titulo: string; tiempoValor?: number; unidadTiempo?: string }
const CATALOGO_AGENTE: Contenido[] = (() => {
  const ubits = (BDS_CONTENIDOS_UBITS as { contents: ItemCatalogo[] }).contents.map((c) => ({
    id: c.id,
    title: c.titulo,
    duration: /hora/.test(c.unidadTiempo ?? '') ? `${c.tiempoValor ?? 60} h` : `${c.tiempoValor ?? 60} min`,
  }))
  const empresa = CONTENIDOS.map((c) => ({ id: c.id, title: c.titulo, duration: `${c.minutos} min` }))
  return [...new Map([...ubits, ...empresa].map((c) => [c.id, c])).values()]
})()

const segmentos = (texto: string) => {
  const lineas = texto
    .split(/\n|;/)
    .map((l) => l.replace(/^\s*[-•*]\s*/, '').trim())
    .filter(Boolean)
  return lineas.length === 1 && lineas[0].includes(',')
    ? lineas[0]
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : lineas
}

function puntaje(titulo: string, consulta: string) {
  const a = normalizar(titulo)
  const q = normalizar(consulta)
  if (!q) return 0
  if (a === q) return 1000
  if (a.includes(q) || q.includes(a)) return 800 + Math.min(a.length, q.length)
  const ta = a.split(' ')
  const tq = q.split(' ')
  const aciertos = tq.filter((t) => ta.some((x) => x === t || x.startsWith(t) || t.startsWith(x))).length
  return aciertos * 50 + (aciertos === tq.length ? 200 : 0)
}

export function leerContenidos(texto: string) {
  const encontrados: Contenido[] = []
  const faltan: string[] = []
  for (const seg of segmentos(texto)) {
    let mejor: Contenido | null = null
    let alto = 0
    for (const c of CATALOGO_AGENTE) {
      const p = puntaje(c.title, seg)
      if (p > alto) {
        alto = p
        mejor = c
      }
    }
    if (mejor && alto >= 100) {
      if (!encontrados.some((c) => c.id === mejor.id)) encontrados.push(mejor)
    } else faltan.push(seg)
  }
  return { encontrados, faltan }
}

function mejorCompetencia(seg: string) {
  const q = normalizar(seg)
  let mejor: CompetenciaIA | null = null
  let alto = 0
  for (const c of COMPETENCIAS) {
    const n = normalizar(c.nombre)
    const p = n === q ? 1000 : n.includes(q) || q.includes(n) ? 700 : q.split(' ').filter((t) => n.split(' ').includes(t)).length * 80
    if (p > alto) {
      alto = p
      mejor = { id: c.id, nombre: c.nombre }
    }
  }
  return alto >= 80 ? mejor : null
}

export function leerCompetencias(texto: string) {
  const encontradas: CompetenciaIA[] = []
  const faltan: string[] = []
  texto
    .split(/\n|;|,/)
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((seg) => {
      const c = mejorCompetencia(seg)
      if (c) {
        if (!encontradas.some((x) => x.id === c.id)) encontradas.push(c)
      } else faltan.push(seg)
    })
  return { encontradas, faltan }
}

export function leerHoras(texto: string, competencias: CompetenciaIA[]): { horas: Record<string, number> } | { error: string } {
  const t = texto.trim()
  if (!t) return { error: 'Indica las horas de estudio (por ejemplo: 2, o «Comunicación: 3, Agilidad: 2»).' }
  const uno = t.match(/^(\d+(?:[.,]\d+)?)\s*(h|hr|hrs|hora|horas)?$/i)
  if (uno) {
    const n = parseFloat(uno[1].replace(',', '.'))
    if (!(n > 0)) return { error: 'Las horas deben ser un número mayor que 0.' }
    return { horas: Object.fromEntries(competencias.map((c) => [c.id, n])) }
  }
  const horas: Record<string, number> = {}
  for (const parte of t.split(/,|\n|;/)) {
    const m = parte.trim().match(/^(.+?)\s*[:=-]\s*(\d+(?:[.,]\d+)?)\s*[a-z]*$/i)
    if (!m) continue
    const c = mejorCompetencia(m[1])
    const n = parseFloat(m[2].replace(',', '.'))
    if (!(n > 0)) return { error: 'Las horas deben ser un número mayor que 0.' }
    if (c && competencias.some((x) => x.id === c.id)) horas[c.id] = n
  }
  const faltan = competencias.filter((c) => !horas[c.id])
  if (faltan.length) return { error: `Faltan horas para: ${faltan.map((c) => c.nombre).join(', ')}. Usa un número para todas o «Nombre: horas».` }
  return { horas }
}

// ── Brief de un solo mensaje ─────────────────────────────────────────────────────────────────────────────────────

export const pareceBrief = (texto: string) => {
  const n = normalizar(texto)
  return (/titulado/.test(n) && /(periodo|vigencia|del .+ al )/.test(n) && /(incluye|contenidos|competencias)/.test(n)) || texto.length > 120
}

export function leerBrief(texto: string, equipo: Registro[]) {
  const parcial: Partial<Borrador> & { desconocidos?: string[] } = {}
  const tipo = texto.match(/plan de (contenidos|competencias)/i)?.[1]?.toLowerCase()
  if (tipo) parcial.tipo = tipo as TipoPlanIA
  else if (/incluye (?:la|las)? ?(?:siguientes? )?competencias/i.test(texto)) parcial.tipo = 'competencias'
  else if (/incluye los siguientes contenidos/i.test(texto)) parcial.tipo = 'contenidos'

  const titulo = texto
    .match(/titulado\s+(.+?)(?:,\s*para|\s+para\s|\s+per[ií]odo|\n|$)/i)?.[1]
    ?.replace(/[.,;]+$/, '')
    .trim()
  if (titulo) parcial.titulo = titulo.replace(/^["«]|["»]$/g, '')

  const para = texto
    .match(/\bpara\s+(.+?)(?:\n|per[ií]odo|incluye|$)/i)?.[1]
    ?.replace(/[.,;]+\s*$/, '')
    .trim()
  if (para) {
    const r = leerPersonas(para, equipo)
    parcial.personas = r.personas
    parcial.todos = r.todos
    parcial.desconocidos = r.desconocidos
  }

  const rango =
    texto.match(/per[ií]odo(?: de vigencia)?:?\s*del\s+(.+?)\s+al\s+(.+?)(?:\.\s|\.$|\n|$)/i) ??
    texto.match(/del\s+(\d{1,2}\s+de\s+\w+\s+de\s+\d{4})\s+al\s+(\d{1,2}\s+de\s+\w+\s+de\s+\d{4})/i)
  if (rango) {
    const a = leerFecha(rango[1])
    const b = leerFecha(rango[2])
    if (a) parcial.inicio = a
    if (b) parcial.fin = b
  }

  const listaContenidos = texto.match(/incluye los siguientes contenidos:?\s*([\s\S]+)/i)?.[1]
  if (listaContenidos) parcial.contenidos = leerContenidos(listaContenidos).encontrados

  const listaCompetencias = texto.match(/incluye (?:la|las)? ?(?:siguientes? )?competencias:?\s*([\s\S]+?)(?:horas|$)/i)?.[1]
  if (listaCompetencias) parcial.competencias = leerCompetencias(listaCompetencias).encontradas

  const horas = texto.match(/horas(?: de estudio)?(?: por competencia)?:?\s*([\s\S]+)/i)?.[1]
  if (horas && parcial.competencias?.length) {
    const r = leerHoras(horas, parcial.competencias)
    if ('horas' in r) parcial.horas = r.horas
  }
  return parcial
}

// ── Confirmación y guardado ──────────────────────────────────────────────────────────────────────────────────────

export function listo(b: Borrador) {
  if (!b.tipo || !b.titulo.trim() || !b.personas.length || !b.inicio || !b.fin || b.fin < b.inicio) return false
  if (b.tipo === 'contenidos') return b.contenidos.length > 0
  return b.competencias.length > 0 && b.competencias.every((c) => (b.horas[c.id] ?? 0) > 0)
}

export const vigenteHoy = (b: Borrador) => b.inicio <= HOY && (!b.fin || b.fin >= HOY)

export function resumen(b: Borrador) {
  const lineas = [
    `Crearé un plan de ${b.tipo} titulado ${b.titulo} para ${quienes(b)}.`,
    `Período de vigencia: del ${fechaLarga(b.inicio)} al ${fechaLarga(b.fin)}.`,
  ]
  const incluye = `Incluye los siguientes ${b.tipo}:`
  const items = b.tipo === 'contenidos' ? b.contenidos.map((c) => c.title) : b.competencias.map((c) => `${c.nombre} (${b.horas[c.id]} h)`)
  const nota = vigenteHoy(b)
    ? null
    : b.inicio > HOY
      ? `Nota: el «hoy» del playground es ${fechaLarga(HOY)}. Como el inicio es posterior, el plan quedará programado y no aparecerá aún en planes vigentes.`
      : null
  return { lineas, incluye, items, nota }
}

const aDmy = (valor: string) => valor.split('-').reverse().join('/')

export function guardar(b: Borrador) {
  const asignaciones = b.personas.map((p) => ({
    id: `fila-usuario-${p.id}`,
    colaboradorId: p.id,
    nombreUsuario: p.nombre,
    avatar: p.avatar,
    contenidos:
      b.tipo === 'contenidos' ? b.contenidos : b.competencias.map((c) => ({ id: c.id, title: c.nombre, nombre: c.nombre, habilidades: [] })),
    contenidosCount: b.tipo === 'contenidos' ? b.contenidos.length : b.competencias.length,
  }))
  const base = {
    tipo: b.tipo,
    nombre: b.titulo.trim(),
    fechaInicioIso: b.inicio,
    fechaFinIso: b.fin,
    fechaInicio: aDmy(b.inicio),
    fechaFin: aDmy(b.fin),
    area: equipoArea(b.personas),
    creadorId: LIDER_ID,
    progresoAgregado: 0,
    asignaciones,
  }
  if (b.tipo === 'contenidos')
    return PLANES.addPlan({
      ...base,
      contenidoPorUsuario: Object.fromEntries(b.personas.map((p) => [p.id, b.contenidos.map((c) => ({ ...c, progress: 0, status: 'default' }))])),
    })
  const max = Math.max(...b.competencias.map((c) => b.horas[c.id] ?? 0))
  return PLANES.addPlan({
    ...base,
    competenciaPorUsuario: Object.fromEntries(
      b.personas.map((p) => [
        p.id,
        b.competencias.map((c) => ({
          id: c.id,
          title: c.nombre,
          nombre: c.nombre,
          habilidades: [],
          progress: 0,
          status: 'default',
          horasMeta: b.horas[c.id],
        })),
      ]),
    ),
    consumoPorUsuario: Object.fromEntries(b.personas.map((p) => [p.id, { horas: 0, items: [] }])),
    horasEstudioMeta: max,
    horasEstudioPorCompetencia: max,
    horasPorCompetencia: b.horas,
  })
}

const equipoArea = (personas: Registro[]) => personas.find((p) => p.id === LIDER_ID)?.area ?? personas[0]?.area ?? 'Logística'

export function avisoGenerado(b: Borrador) {
  if (vigenteHoy(b)) return 'Plan generado exitosamente. Ya está vigente: lo verás en los planes de las personas asignadas.'
  if (b.inicio > HOY)
    return `Plan generado exitosamente. Entrará en vigencia el ${fechaLarga(b.inicio)}; lo verás en esta página a partir de ese día.`
  return 'Plan generado exitosamente. Lo verás en esta página cuando entre en vigencia.'
}
