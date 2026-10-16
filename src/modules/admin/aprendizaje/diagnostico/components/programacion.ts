// Las reglas de fechas de un assessment, las mismas del servicio en producción:
//
// **El admin elige las fechas que quiera.** En la reunión del 30-sep-2026 con Mafe (producto) se quitaron todas las
// restricciones del último paso: ni fines de semana bloqueados, ni meses vetados, ni una duración mínima o máxima, ni
// obligar a que el seguimiento vaya después del plan. Lo único que se le da es contexto —las fechas del plan a la
// vista— y él decide. La única regla que queda es que una medida no puede abrir antes de hoy, que no es una política
// sino el hecho de que no se puede convocar a alguien al pasado.
//
// La diferencia con producción es que aquí se sugieren fechas que ya cumplen todo (el admin solo las confirma o las
// mueve), y que la regla se ve en el calendario —lo que no se puede elegir sale deshabilitado— en vez de descubrirla
// al equivocarse.

/** Lo que se sugiere por defecto; el admin la mueve a donde quiera. */
const DIAS_SUGERIDOS = 14

const DIA = 86_400_000

/** Medianoche local: las fechas se comparan por día, sin la hora. */
export const soloDia = (fecha: Date) => new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
export const hoy = () => soloDia(new Date())
export const sumarDias = (fecha: Date, dias: number) => new Date(fecha.getTime() + dias * DIA)
export const desdeIso = (iso: string) => new Date(`${iso}T00:00:00`)
export const aIso = (fecha: Date) =>
  `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
export const diasEntre = (desde: Date, hasta: Date) => Math.round((soloDia(hasta).getTime() - soloDia(desde).getTime()) / DIA)

/** Se conserva para nombrar días laborales donde haga falta; ya no bloquea la elección de fechas. */
export const esHabil = (fecha: Date) => fecha.getDay() !== 0 && fecha.getDay() !== 6

/** El primer día hábil desde `fecha` (ella misma si ya lo es). */
export function primerHabil(fecha: Date) {
  let dia = soloDia(fecha)
  while (!esHabil(dia)) dia = sumarDias(dia, 1)
  return dia
}

/** El último día hábil hasta `fecha` (ella misma si ya lo es). */
function ultimoHabil(fecha: Date) {
  let dia = soloDia(fecha)
  while (!esHabil(dia)) dia = sumarDias(dia, -1)
  return dia
}

export type Ventana = { from: Date | undefined; to?: Date | undefined } | undefined

/** Desde cuándo puede abrir la inicial: hoy, o el siguiente día hábil. */
export const inicioMinimoInicial = () => primerHabil(hoy())

/** Desde cuándo puede abrir el seguimiento: el día hábil siguiente al fin del plan y al cierre de la inicial. */
export function inicioMinimoSeguimiento(finPlan: string, inicial: Ventana) {
  const candidatos = [hoy(), sumarDias(desdeIso(finPlan), 1)]
  if (inicial?.to) candidatos.push(sumarDias(inicial.to, 1))
  return primerHabil(new Date(Math.max(...candidatos.map((d) => d.getTime()))))
}

/** Las fechas que se proponen: abrir en el primer día posible y cerrar dos semanas después. */
export function sugerir(desde: Date): Ventana {
  return { from: desde, to: ultimoHabil(sumarDias(desde, DIAS_SUGERIDOS)) }
}

/** Lo único que no se puede elegir: un día ya pasado. Todo lo demás está abierto (30-sep-2026). */
export function diaBloqueado(minimo: Date) {
  return (fecha: Date) => fecha < minimo
}

/** Qué está mal en una ventana, en palabras; `null` si cumple todo. */
export function problemaDe(ventana: Ventana, minimo: Date): string | null {
  if (!ventana?.from) return 'Elige cuándo abre y cuándo cierra.'
  if (!ventana.to) return 'Elige cuándo cierra.'
  if (ventana.from < minimo) return 'Ya pasó: elige una fecha de hoy en adelante.'
  return null
}

/** «2 semanas», «1 semana y 3 días». */
export function duracion(ventana: Ventana) {
  if (!ventana?.from || !ventana.to) return ''
  const dias = diasEntre(ventana.from, ventana.to)
  const semanas = Math.floor(dias / 7)
  const resto = dias % 7
  const s = semanas ? `${semanas} ${semanas === 1 ? 'semana' : 'semanas'}` : ''
  const d = resto ? `${resto} ${resto === 1 ? 'día' : 'días'}` : ''
  return [s, d].filter(Boolean).join(' y ')
}

export type Medida = { programar: boolean; ventana: Ventana }

/**
 * «1 ene 2026»: el formato de fecha de todo el playground —humanizado y abreviado, en tablas y fuera de ellas—.
 * Las dos constantes apuntan al mismo sitio y se conservan porque las usan pantallas distintas.
 */
export const FECHA_LARGA = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' })
export const FECHA_COMPLETA = FECHA_LARGA

/** «lun, 29 sept – vie, 10 oct», «Sin programar» o «No aplica». */
export function textoMedida(medida: Medida, noAplica = false) {
  if (noAplica) return 'No aplica'
  if (!medida.programar) return 'Sin programar'
  const { from, to } = medida.ventana ?? {}
  if (!from || !to) return 'Sin fechas todavía'
  return `${FECHA_LARGA.format(from)} – ${FECHA_LARGA.format(to)}`
}
