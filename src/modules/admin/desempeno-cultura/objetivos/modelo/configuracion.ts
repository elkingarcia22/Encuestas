// La configuración de estados y niveles de un ciclo (portada del prototipo «configuración objetivos», 21-oct). En el
// prototipo era una sola para todo el módulo; aquí vive en cada ciclo (decisión de Elkin, 21-oct): cada uno guarda sus
// bandas de cumplimiento, si admite resultados negativos y sus niveles de desempeño. Los permisos siguen en la
// parametrización del ciclo.
//
// Los colores no se escriben a mano: cada banda y cada nivel elige uno de los tonos del tema (`TONOS`).

export type TonoId = 'destructive' | 'warning' | 'info' | 'success' | 'primary' | 'neutral'

export const TONOS: readonly { id: TonoId; etiqueta: string; color: string; badge: 'destructive-light' | 'warning-light' | 'info-light' | 'success-light' | 'secondary' | 'outline' }[] = [
  { id: 'destructive', etiqueta: 'Rojo', color: 'var(--destructive)', badge: 'destructive-light' },
  { id: 'warning', etiqueta: 'Ámbar', color: 'var(--warning)', badge: 'warning-light' },
  { id: 'info', etiqueta: 'Azul', color: 'var(--info)', badge: 'info-light' },
  { id: 'success', etiqueta: 'Verde', color: 'var(--success)', badge: 'success-light' },
  { id: 'primary', etiqueta: 'Azul de marca', color: 'var(--primary)', badge: 'secondary' },
  { id: 'neutral', etiqueta: 'Gris', color: 'var(--muted-foreground)', badge: 'outline' },
]
export const tonoDe = (id: TonoId) => TONOS.find((tono) => tono.id === id) ?? TONOS[TONOS.length - 1]

/** Cuándo puede aparecer una banda: apenas el objetivo llega al rango, o solo como veredicto al cerrar el ciclo. */
export type Aplica = 'curso' | 'cierre'
export const APLICA: Readonly<Record<Aplica, { etiqueta: string; ayuda: string }>> = {
  curso: { etiqueta: 'En curso', ayuda: 'Se muestra apenas el objetivo llega a este rango.' },
  cierre: { etiqueta: 'Al cierre', ayuda: 'Es un veredicto: solo aparece cuando el ciclo cierra.' },
}

export interface Banda {
  id: string
  nombre: string
  /** Porcentaje de cumplimiento, inclusivo en los dos extremos. */
  desde: number
  hasta: number
  tono: TonoId
  aplica: Aplica
}

export interface Nivel {
  id: string
  nombre: string
  desde: number
  hasta: number
  tono: TonoId
}

export interface ConfigCiclo {
  bandas: readonly Banda[]
  /** Si un objetivo puede quedar por debajo de 0 % y restar en el ciclo. */
  negativos: boolean
  niveles: readonly Nivel[]
  /** Los niveles copian las bandas en vez de tener una escala propia. */
  nivelesEspejo: boolean
}

export const LIMITES = { bandas: { min: 3, max: 5 }, niveles: { min: 1, max: 5 } } as const

/** La banda que aparece cuando un objetivo resta (solo con `negativos` encendido). */
export const BANDA_NEGATIVA: Banda = { id: 'negativo', nombre: 'Restó', desde: -100, hasta: -1, tono: 'destructive', aplica: 'curso' }

/** Los estados que pone el flujo: no se editan ni se eliminan. «En progreso» llega hasta la primera banda en curso. */
export const ESTADOS_FIJOS: readonly { id: string; nombre: string; tono: TonoId; cuando: string }[] = [
  { id: 'por-aprobar', nombre: 'Por aprobar', tono: 'primary', cuando: 'Antes de arrancar' },
  { id: 'denegado', nombre: 'Denegado', tono: 'warning', cuando: 'Antes de arrancar' },
  { id: 'por-iniciar', nombre: 'Por iniciar', tono: 'neutral', cuando: '0 %' },
  { id: 'en-progreso', nombre: 'En progreso', tono: 'info', cuando: 'Hasta la primera banda en curso' },
  { id: 'inactivo', nombre: 'Inactivo', tono: 'neutral', cuando: 'En cualquier momento' },
]

export const CONFIG_INICIAL: ConfigCiclo = {
  bandas: [
    { id: 'no-cumplio', nombre: 'No cumplió', desde: 0, hasta: 39, tono: 'destructive', aplica: 'cierre' },
    { id: 'no-cumplio-parcial', nombre: 'No cumplió parcialmente', desde: 40, hasta: 69, tono: 'warning', aplica: 'cierre' },
    { id: 'cumplio-parcial', nombre: 'Cumplió parcialmente', desde: 70, hasta: 99, tono: 'info', aplica: 'cierre' },
    { id: 'cumplido', nombre: 'Cumplido', desde: 100, hasta: 100, tono: 'success', aplica: 'curso' },
    { id: 'sobrecumplio', nombre: 'Sobrecumplió', desde: 101, hasta: 150, tono: 'primary', aplica: 'curso' },
  ],
  negativos: false,
  niveles: [
    { id: 'por-mejorar', nombre: 'Por mejorar', desde: 0, hasta: 33, tono: 'destructive' },
    { id: 'bueno', nombre: 'Bueno', desde: 34, hasta: 66, tono: 'warning' },
    { id: 'excelente', nombre: 'Excelente', desde: 67, hasta: 100, tono: 'success' },
  ],
  nivelesEspejo: false,
}

/** Los niveles que de verdad rigen: los propios o, en espejo, las bandas convertidas en niveles. */
export const nivelesEfectivos = (config: ConfigCiclo): readonly Nivel[] =>
  config.nivelesEspejo ? config.bandas.map((banda) => ({ id: banda.id, nombre: banda.nombre, desde: banda.desde, hasta: banda.hasta, tono: banda.tono })) : config.niveles

/** El nivel de un avance: el rango que lo contiene; por encima del último, el último; por debajo del primero, el primero. */
export function nivelPara(avance: number, niveles: readonly Nivel[]): Nivel {
  const ordenados = [...niveles].sort((a, b) => a.desde - b.desde)
  return ordenados.find((nivel) => avance >= nivel.desde && avance <= nivel.hasta) ?? (avance > ordenados[ordenados.length - 1].hasta ? ordenados[ordenados.length - 1] : ordenados[0])
}

/** La banda de un objetivo según su cumplimiento: con el ciclo abierto solo cuentan las «En curso». null si ninguna aplica. */
export function bandaPara(cumplimiento: number, config: ConfigCiclo, cerrado: boolean): Banda | null {
  const bandas = [...(config.negativos ? [BANDA_NEGATIVA] : []), ...config.bandas].filter((banda) => cerrado || banda.aplica === 'curso')
  return bandas.find((banda) => cumplimiento >= banda.desde && cumplimiento <= banda.hasta) ?? null
}

const plegar = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()

/** Qué impide guardar una lista de bandas o de niveles, en una línea; null si está bien. */
export function problemaDe(filas: readonly { nombre: string; desde: number; hasta: number; tono: TonoId }[], nombre: 'estado' | 'nivel'): string | null {
  const plural = nombre === 'estado' ? 'estados' : 'niveles'
  if (filas.some((fila) => fila.nombre.trim() === '')) return `Todos los ${plural} deben tener un nombre.`
  const nombres = filas.map((fila) => plegar(fila.nombre))
  const repetido = filas.find((_, indice) => nombres.indexOf(nombres[indice]) !== indice)
  if (repetido) return `El nombre «${repetido.nombre.trim()}» está repetido.`
  const tonos = filas.map((fila) => fila.tono)
  const mismoColor = filas.find((_, indice) => tonos.indexOf(tonos[indice]) !== indice)
  if (mismoColor) return `El color de «${mismoColor.nombre.trim()}» ya lo usa otro ${nombre}. Cada ${nombre} lleva un color propio.`
  const alReves = filas.find((fila) => fila.desde > fila.hasta)
  if (alReves) return `En «${alReves.nombre.trim()}», «Desde» (${alReves.desde} %) no puede ser mayor que «Hasta» (${alReves.hasta} %).`
  const ordenadas = [...filas].sort((a, b) => a.desde - b.desde)
  const cruzada = ordenadas.find((fila, indice) => indice > 0 && fila.desde <= ordenadas[indice - 1].hasta)
  if (cruzada) return `El rango de «${cruzada.nombre.trim()}» se cruza con el de otro ${nombre}.`
  return null
}

export function problemaDeConfig(config: ConfigCiclo): string | null {
  if (config.bandas.length < LIMITES.bandas.min) return `El ciclo necesita al menos ${LIMITES.bandas.min} estados configurables.`
  return problemaDe(config.bandas, 'estado') ?? (config.nivelesEspejo ? null : problemaDe(config.niveles, 'nivel'))
}

/** El primer tono que todavía no usa nadie de la lista (para una fila nueva). */
export const tonoLibre = (usados: readonly TonoId[]): TonoId => TONOS.find((tono) => !usados.includes(tono.id))?.id ?? 'neutral'

export const nuevoId = (prefijo: string) => `${prefijo}-${Math.random().toString(36).slice(2, 9)}`
