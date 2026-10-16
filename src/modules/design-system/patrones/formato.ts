// Utilidades de texto compartidas por las pantallas de patrones. Solo formatean datos de
// ejemplo; no pintan nada.

export const iniciales = (nombre: string) =>
  nombre
    .split(' ')
    .filter(Boolean)
    .map((parte) => parte[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

// Las fechas del playground se escriben siempre igual: **«1 ene 2026»**, humanizadas y abreviadas, en tablas y en
// cualquier otro sitio (regla de Dave, 30-sep-2026). El día va sin cero delante y el locale es `es` y no `es-CO`,
// porque el colombiano mete «de» por medio: «1 de ene de 2026».
const FECHA_CORTA = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' })
const FECHA_SIN_ANIO = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' })
const FECHA_HORA = new Intl.DateTimeFormat('es', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

const aFecha = (iso: string) => new Date(iso.length === 10 ? `${iso}T00:00:00` : iso)

export const fechaCorta = (iso: string) => FECHA_CORTA.format(aFecha(iso))
export const fechaSinAnio = (iso: string) => FECHA_SIN_ANIO.format(aFecha(iso))
export const fechaHora = (iso: string) => FECHA_HORA.format(aFecha(iso))
// Solo la hora («3:40 p. m.»), para las notas que se crean en el momento («Hoy, 3:40 p. m.»).
const HORA = new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit' })
export const hora = (fecha: Date = new Date()) => HORA.format(fecha)

// "Hoy" fijo para que los datos de ejemplo no envejezcan: el recorrido de referencia es de
// septiembre de 2026.
export const HOY = new Date('2026-09-11T09:00:00')

export function diasDesde(iso: string, desde = HOY) {
  const inicio = new Date(desde)
  inicio.setHours(0, 0, 0, 0)
  return Math.round((inicio.getTime() - aFecha(iso).getTime()) / 86_400_000)
}

export function isoHaceDias(dias: number, desde = HOY) {
  const fecha = new Date(desde)
  fecha.setDate(fecha.getDate() - dias)
  return fecha.toISOString().slice(0, 10)
}

// Formato de indicadores del producto: 1.284 → 1,3K; 2.400.000 → 2,4M.
export function formatoKM(valor: number) {
  const corto = (n: number) => n.toLocaleString('es-CO', { maximumFractionDigits: 1 })
  if (valor >= 1_000_000) return `${corto(valor / 1_000_000)}M`
  if (valor >= 1_000) return `${corto(valor / 1_000)}K`
  return valor.toLocaleString('es-CO')
}

export const plural = (n: number, uno: string, varios: string) => (n === 1 ? uno : varios)

// Rango de fechas elegido en un calendario: «1 ago 2026 – 31 ago 2026».
const FECHA_RANGO = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' })

export function textoDeRango(rango: { from: Date | undefined; to?: Date | undefined } | undefined) {
  if (!rango?.from) return null
  if (!rango.to) return `Desde el ${FECHA_RANGO.format(rango.from)}`
  return `${FECHA_RANGO.format(rango.from)} – ${FECHA_RANGO.format(rango.to)}`
}

// Generador determinista (siempre la misma secuencia): datos "aleatorios" que no cambian
// entre recargas.
export function generador(semilla: number) {
  let estado = semilla
  return () => {
    estado = (estado * 1_103_515_245 + 12_345) % 2_147_483_648
    return estado / 2_147_483_648
  }
}

// Enumera en español con «y» al final: «el título, la imagen y el nivel». Lo usan las barras de acciones de los
// flujos por pasos para decir qué falta.
const LISTA = new Intl.ListFormat('es', { type: 'conjunction' })

export function enLista(partes: string[]) {
  return LISTA.format(partes)
}

// Cuántos elementos caen en cada uno de los últimos meses, para la línea de tendencia de una métrica. Las fechas
// llegan en ISO («2026-08-12»); lo que no se pueda leer se ignora en vez de romper la serie.
export function serieMensual(fechas: string[], meses = 6, hoy = new Date()) {
  const clave = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  const ventana = Array.from({ length: meses }, (_, i) => {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - (meses - 1 - i), 1)
    return clave(d)
  })
  const cuenta = new Map(ventana.map((mes) => [mes, 0]))
  for (const fecha of fechas) {
    const mes = fecha?.slice(0, 7)
    if (mes && cuenta.has(mes)) cuenta.set(mes, (cuenta.get(mes) ?? 0) + 1)
  }
  return ventana.map((mes) => cuenta.get(mes) ?? 0)
}

/** Cuánto cambió respecto al periodo anterior, en porcentaje. Sin base anterior no hay comparación posible. */
export function variacionPorcentual(actual: number, anterior: number) {
  if (!anterior) return undefined
  return Math.round(((actual - anterior) / anterior) * 100)
}
