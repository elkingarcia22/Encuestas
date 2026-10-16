import { MEASURE_META, type MeasureType } from '../constructor/cicloBuilderTypes'
import { OBJETIVOS_EMPRESA, type Etapa, type Medida, type ObjetivoSeguido, type PersonaSeguida, type ResultadosCiclo, type Riesgo } from './seguimiento'

// Las cuentas de cada bloque del Resumen de resultados (9-oct, como el prototipo «configuración objetivos»): pendientes,
// riesgo, aprobación, estado de los objetivos, avance y peso por área, alineación, tipo de medida y ritmo de actividad.
// Todo sale de las personas y objetivos sembrados del ciclo; la pantalla solo dibuja.

export type Tramo = { id: string; etiqueta: string; cantidad: number; color: string }
/** Una fila por grupo: `valor` mide la barra; `texto`, si viene, reemplaza la cifra de la derecha (un conteo, por ejemplo). */
export type FilaGrupo = { id: string; etiqueta: string; valor: number; detalle: string; texto?: string }

/** «Ver por»: el dato de la persona por el que se agrupa el reporte. */
export type Corte = 'area' | 'leader' | 'country' | 'role' | 'city' | 'age' | 'gender'
export const CORTES: readonly { value: Corte; label: string }[] = [
  { value: 'area', label: 'Área' },
  { value: 'leader', label: 'Líder' },
  { value: 'country', label: 'País' },
  { value: 'role', label: 'Rol' },
  { value: 'city', label: 'Ciudad' },
  { value: 'age', label: 'Edad' },
  { value: 'gender', label: 'Género' },
]
export const nombreCorte = (corte: Corte) => CORTES.find((opcion) => opcion.value === corte)?.label ?? 'Grupo'
const grupoDe = (persona: PersonaSeguida, corte: Corte) => persona.colaborador[corte] ?? 'Sin líder'

const pct = (valor: number, total: number) => (total === 0 ? 0 : Math.round((valor / total) * 1000) / 10)
const promedio = (valores: readonly number[]) => (valores.length === 0 ? 0 : Math.round((valores.reduce((a, b) => a + b, 0) / valores.length) * 10) / 10)
const objetivosDe = (personas: readonly PersonaSeguida[]) => personas.flatMap((persona) => persona.objetivos.map((objetivo) => ({ persona, objetivo })))

/** Lo que espera a alguien: objetivos por aprobar o devueltos y personas en riesgo alto (solo con el ciclo abierto). */
export function pendientes(r: ResultadosCiclo) {
  const todos = objetivosDe(r.personas)
  return {
    porAprobar: todos.filter(({ objetivo }) => objetivo.etapa === 'por-aprobar'),
    devueltos: todos.filter(({ objetivo }) => objetivo.etapa === 'por-ajustar'),
    riesgoAlto: r.abierto ? r.personas.filter((persona) => persona.riesgo === 'alto') : [],
  }
}

export const TRAMOS_RIESGO: readonly { id: Riesgo; etiqueta: string; color: string }[] = [
  { id: 'alto', etiqueta: 'Riesgo alto', color: 'var(--destructive)' },
  { id: 'medio', etiqueta: 'Riesgo medio', color: 'var(--warning)' },
  { id: 'bajo', etiqueta: 'Riesgo bajo', color: 'var(--chart-2)' },
  { id: 'sin', etiqueta: 'Sin riesgo', color: 'var(--success)' },
]
export const riesgo = (r: ResultadosCiclo): Tramo[] => TRAMOS_RIESGO.map((tramo) => ({ ...tramo, cantidad: r.personas.filter((persona) => persona.riesgo === tramo.id).length }))

const TRAMOS_APROBACION: readonly { id: Etapa; etiqueta: string; color: string }[] = [
  { id: 'aprobado', etiqueta: 'Aprobados', color: 'var(--success)' },
  { id: 'por-aprobar', etiqueta: 'Por aprobar', color: 'var(--warning)' },
  { id: 'por-ajustar', etiqueta: 'Devueltos', color: 'var(--destructive)' },
]
export const aprobacion = (r: ResultadosCiclo): Tramo[] => {
  const todos = objetivosDe(r.personas)
  return TRAMOS_APROBACION.map((tramo) => ({ ...tramo, cantidad: todos.filter(({ objetivo }) => objetivo.etapa === tramo.id).length }))
}

/** Pendientes de aprobación o devueltos, por líder: de mayor a menor, hasta seis. */
export function porLider(r: ResultadosCiclo, etapa: Etapa): FilaGrupo[] {
  const lideres = new Map<string, { objetivos: number; personas: Set<string> }>()
  for (const { persona, objetivo } of objetivosDe(r.personas)) {
    if (objetivo.etapa !== etapa) continue
    const lider = persona.colaborador.leader ?? 'Sin líder'
    const fila = lideres.get(lider) ?? { objetivos: 0, personas: new Set<string>() }
    fila.objetivos += 1
    fila.personas.add(persona.id)
    lideres.set(lider, fila)
  }
  const total = [...lideres.values()].reduce((s, fila) => s + fila.objetivos, 0)
  return [...lideres.entries()]
    .map(([lider, fila]) => ({ id: lider, etiqueta: lider, valor: pct(fila.objetivos, total), detalle: `${fila.objetivos} ${fila.objetivos === 1 ? 'objetivo' : 'objetivos'} · ${fila.personas.size} ${fila.personas.size === 1 ? 'persona' : 'personas'}` }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 6)
}

/** Estado de los objetivos aprobados. Abierto, se lee en curso; cerrado, por su resultado (como los estados configurables). */
export function estados(r: ResultadosCiclo): Tramo[] {
  const aprobados = objetivosDe(r.personas).filter(({ objetivo }) => objetivo.etapa === 'aprobado').map(({ objetivo }) => objetivo.cumplimiento)
  const cuenta = (prueba: (valor: number | null) => boolean) => aprobados.filter(prueba).length
  if (r.abierto) {
    return [
      { id: 'por-iniciar', etiqueta: 'Por iniciar', cantidad: cuenta((v) => v === null || v === 0), color: 'var(--muted-foreground)' },
      { id: 'en-progreso', etiqueta: 'En progreso', cantidad: cuenta((v) => v !== null && v > 0 && v < 100), color: 'var(--chart-2)' },
      { id: 'cumplido', etiqueta: 'Cumplido', cantidad: cuenta((v) => v === 100), color: 'var(--success)' },
      { id: 'sobrecumplio', etiqueta: 'Sobrecumplió', cantidad: cuenta((v) => v !== null && v > 100), color: 'var(--primary)' },
    ]
  }
  return [
    { id: 'no-cumplio', etiqueta: 'No cumplió', cantidad: cuenta((v) => (v ?? 0) < 40), color: 'var(--destructive)' },
    { id: 'no-cumplio-parcialmente', etiqueta: 'No cumplió parcialmente', cantidad: cuenta((v) => v !== null && v >= 40 && v < 70), color: 'var(--warning)' },
    { id: 'cumplio-parcialmente', etiqueta: 'Cumplió parcialmente', cantidad: cuenta((v) => v !== null && v >= 70 && v < 100), color: 'var(--chart-2)' },
    { id: 'cumplido', etiqueta: 'Cumplido', cantidad: cuenta((v) => v === 100), color: 'var(--success)' },
    { id: 'sobrecumplio', etiqueta: 'Sobrecumplió', cantidad: cuenta((v) => v !== null && v > 100), color: 'var(--primary)' },
  ]
}

/** Avance promedio de cada grupo del corte (de las personas que reportaron), del más bajo al más alto. */
export function porGrupo(r: ResultadosCiclo, corte: Corte): { grupo: string; avance: number; personas: number }[] {
  const grupos = new Map<string, number[]>()
  for (const persona of r.personas) if (persona.avance !== null) grupos.set(grupoDe(persona, corte), [...(grupos.get(grupoDe(persona, corte)) ?? []), persona.avance])
  return [...grupos.entries()].map(([grupo, valores]) => ({ grupo, personas: valores.length, avance: promedio(valores) })).sort((a, b) => a.avance - b.avance)
}

/** Avance promedio por grupo, en el orden pedido, hasta seis. */
export const avancePorGrupo = (r: ResultadosCiclo, corte: Corte, orden: 'menor' | 'mayor'): FilaGrupo[] =>
  porGrupo(r, corte)
    .sort((a, b) => (orden === 'menor' ? a.avance - b.avance : b.avance - a.avance))
    .slice(0, 6)
    .map((fila) => ({ id: fila.grupo, etiqueta: fila.grupo, valor: fila.avance, detalle: `${fila.personas} ${fila.personas === 1 ? 'persona' : 'personas'}` }))

/** Reparto del peso por grupo: Σ pesos de los objetivos del grupo ÷ Σ de todo el ciclo. */
export function pesoPorGrupo(r: ResultadosCiclo, corte: Corte): FilaGrupo[] {
  const areas = new Map<string, number>()
  for (const { persona, objetivo } of objetivosDe(r.personas)) areas.set(grupoDe(persona, corte), (areas.get(grupoDe(persona, corte)) ?? 0) + objetivo.peso)
  const total = [...areas.values()].reduce((a, b) => a + b, 0)
  return [...areas.entries()]
    .map(([area, peso]) => ({ id: area, etiqueta: area, valor: pct(peso, total), detalle: '' }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 6)
}

// Colores que se distinguen entre sí (los --chart-* del tema son tonos de un mismo azul).
const COLORES_EMPRESA = ['var(--primary)', 'var(--success)', 'var(--warning)']
/** Peso por objetivo de empresa, con el tramo «Sin alinear». */
export function pesoPorEmpresa(r: ResultadosCiclo): Tramo[] {
  const todos = objetivosDe(r.personas).map(({ objetivo }) => objetivo)
  const pesoDe = (prueba: (objetivo: ObjetivoSeguido) => boolean) => todos.filter(prueba).reduce((s, o) => s + o.peso, 0)
  return [
    ...OBJETIVOS_EMPRESA.map((empresa, n) => ({ id: empresa.id, etiqueta: empresa.titulo, cantidad: pesoDe((o) => o.empresa === empresa.id), color: COLORES_EMPRESA[n] })),
    { id: 'sin', etiqueta: 'Sin alinear', cantidad: pesoDe((o) => o.empresa === null), color: 'var(--muted-foreground)' },
  ]
}

/** Personas según cuántos de sus objetivos cuelgan de uno de empresa. */
export function alineacionPersonas(r: ResultadosCiclo): Tramo[] {
  const alineados = (persona: PersonaSeguida) => persona.objetivos.filter((objetivo) => objetivo.empresa !== null).length
  return [
    { id: 'todos', etiqueta: 'Todos sus objetivos alineados', cantidad: r.personas.filter((p) => alineados(p) === p.objetivos.length).length, color: 'var(--success)' },
    { id: 'algunos', etiqueta: 'Solo algunos alineados', cantidad: r.personas.filter((p) => alineados(p) > 0 && alineados(p) < p.objetivos.length).length, color: 'var(--warning)' },
    { id: 'ninguno', etiqueta: 'Ninguno alineado', cantidad: r.personas.filter((p) => alineados(p) === 0).length, color: 'var(--destructive)' },
  ]
}

/** Alineación por grupo: peso alineado ÷ peso total del grupo. */
export function alineacionPorGrupo(r: ResultadosCiclo, corte: Corte): { filas: FilaGrupo[]; promedio: number } {
  const areas = new Map<string, { alineado: number; total: number }>()
  for (const { persona, objetivo } of objetivosDe(r.personas)) {
    const fila = areas.get(grupoDe(persona, corte)) ?? { alineado: 0, total: 0 }
    fila.total += objetivo.peso
    if (objetivo.empresa) fila.alineado += objetivo.peso
    areas.set(grupoDe(persona, corte), fila)
  }
  const filas = [...areas.entries()].map(([area, fila]) => ({ id: area, etiqueta: area, valor: pct(fila.alineado, fila.total), detalle: '' })).sort((a, b) => a.valor - b.valor)
  return { filas: filas.slice(0, 6), promedio: promedio(filas.map((fila) => fila.valor)) }
}

const MEDIDA_A_TIPO: Record<Medida, MeasureType> = { porcentaje: 'percentage', numero: 'numeric', dinero: 'money', hito: 'boolean' }
/** Cuántos objetivos se miden con cada tipo de medida, con las cuatro aunque alguna esté en cero. */
export function tiposDeMedida(r: ResultadosCiclo): Tramo[] {
  const todos = objetivosDe(r.personas).map(({ objetivo }) => objetivo)
  const colores: Record<Medida, string> = { porcentaje: 'var(--primary)', numero: 'var(--success)', dinero: 'var(--warning)', hito: 'var(--muted-foreground)' }
  return (Object.keys(MEDIDA_A_TIPO) as Medida[]).map((medida) => ({ id: medida, etiqueta: MEASURE_META[MEDIDA_A_TIPO[medida]].label, cantidad: todos.filter((o) => o.medida === medida).length, color: colores[medida] }))
}

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
/** En qué día de la semana se reporta avance. */
export function ritmoSemanal(r: ResultadosCiclo): FilaGrupo[] {
  const cuenta = Array.from({ length: 7 }, () => 0)
  for (const { objetivo } of objetivosDe(r.personas)) for (const fecha of objetivo.avances) cuenta[(fecha.getDay() + 6) % 7] += 1
  const mayor = Math.max(...cuenta, 1)
  return DIAS.map((dia, n) => ({ id: dia, etiqueta: dia, valor: pct(cuenta[n], mayor), detalle: '', texto: `${cuenta[n]} ${cuenta[n] === 1 ? 'avance' : 'avances'}` }))
}

// --- Detalle de un tramo (lo que se abre al tocarlo) ---------------------------------------------------------------

export type Dimension = 'riesgo' | 'aprobacion' | 'estado' | 'alineacion' | 'medida'
export type FilaDetalle = { id: string; titulo: string; detalle: string; valor: string }
export const TITULO_DIMENSION: Record<Dimension, string> = {
  riesgo: 'Riesgo',
  aprobacion: 'Aprobación de objetivos',
  estado: 'Estado de los objetivos',
  alineacion: 'Alineación con la estrategia',
  medida: 'Tipo de medida',
}

const formato = (valor: number | null) => (valor === null ? 'Sin avance' : `${valor.toLocaleString('es-CO', { maximumFractionDigits: 1 })}%`)
const ESTADO_DE: Record<string, (v: number | null) => boolean> = {
  'por-iniciar': (v) => v === null || v === 0,
  'en-progreso': (v) => v !== null && v > 0 && v < 100,
  cumplido: (v) => v === 100,
  sobrecumplio: (v) => v !== null && v > 100,
  'no-cumplio': (v) => (v ?? 0) < 40,
  'no-cumplio-parcialmente': (v) => v !== null && v >= 40 && v < 70,
  'cumplio-parcialmente': (v) => v !== null && v >= 70 && v < 100,
}

/** Quiénes (o qué objetivos) caen en un tramo de una dimensión del Resumen. */
export function detalleDe(r: ResultadosCiclo, dimension: Dimension, tramo: string): FilaDetalle[] {
  const persona = (p: PersonaSeguida): FilaDetalle => ({ id: p.id, titulo: p.colaborador.name, detalle: `${p.colaborador.area} · ${p.colaborador.leader ?? 'Sin líder'}`, valor: formato(p.avance) })
  const objetivo = (p: PersonaSeguida, o: ObjetivoSeguido): FilaDetalle => ({ id: o.id, titulo: o.titulo, detalle: p.colaborador.name, valor: formato(o.cumplimiento) })
  const alineados = (p: PersonaSeguida) => p.objetivos.filter((o) => o.empresa !== null).length
  if (dimension === 'riesgo') return r.personas.filter((p) => p.riesgo === tramo).map(persona)
  if (dimension === 'alineacion') {
    const prueba = tramo === 'todos' ? (p: PersonaSeguida) => alineados(p) === p.objetivos.length : tramo === 'algunos' ? (p: PersonaSeguida) => alineados(p) > 0 && alineados(p) < p.objetivos.length : (p: PersonaSeguida) => alineados(p) === 0
    return r.personas.filter(prueba).map(persona)
  }
  const todos = objetivosDe(r.personas)
  if (dimension === 'aprobacion') return todos.filter(({ objetivo: o }) => o.etapa === tramo).map(({ persona: p, objetivo: o }) => objetivo(p, o))
  if (dimension === 'medida') return todos.filter(({ objetivo: o }) => o.medida === tramo).map(({ persona: p, objetivo: o }) => objetivo(p, o))
  const prueba = ESTADO_DE[tramo] ?? (() => false)
  return todos.filter(({ objetivo: o }) => o.etapa === 'aprobado' && prueba(o.cumplimiento)).map(({ persona: p, objetivo: o }) => objetivo(p, o))
}
