import { HOY } from '../propuestas/creditos'
import { CANDIDATURAS, ESPERA_RESPUESTA, RECHAZADAS, VACANTES_UI, tituloEtapa, type VacanteUI } from '../propuestas/datos'
import { simulado } from '../propuestas/simular'
import { ETAPAS } from '../vacantes/detalle/components/data'

// Las cuentas del Dashboard de Selección (7 oct, Nicolás: «hoy es así… eso está horrible, hagamos algo bien top»). Todo
// sale de las mismas vacantes que muestran Vacantes y Mis candidatos, para que las cifras cuadren entre pantallas: las
// 101 personas de los últimos 7 días son las 101 de «Candidatos nuevos» del inicio de Vacantes.
//
// La maqueta no tiene el día a día de cada vacante, así que se reconstruye con lo que sí tiene:
// - cuántas aplicaciones recibió, cuántas en los últimos 7 días y cuántos días lleva (o llevó) abierta;
// - cuándo cerró y a cuántas personas contrató, leído de su desenlace («Cerrada el 3 de septiembre · se contrató a…»).
// Las aplicaciones se reparten en los días que estuvo abierta, con menos los fines de semana. En el producto sale del
// histórico de cada candidatura.

export type Periodo = '7' | '30' | '90'

export const PERIODOS: {
  valor: Periodo
  texto: string
  dias: number
  anterior: string
}[] = [
  {
    valor: '7',
    texto: 'Últimos 7 días',
    dias: 7,
    anterior: 'los 7 días anteriores',
  },
  {
    valor: '30',
    texto: 'Últimos 30 días',
    dias: 30,
    anterior: 'los 30 días anteriores',
  },
  {
    valor: '90',
    texto: 'Últimos 90 días',
    dias: 90,
    anterior: 'los 90 días anteriores',
  },
]

export const periodoDe = (valor: Periodo) => PERIODOS.find((uno) => uno.valor === valor) ?? PERIODOS[2]

// ── Filtros: los del dashboard de hoy (vacante, estado, país, seniority, reclutador), con la sede en vez del país:
// todas las vacantes de la maqueta son de Colombia. ──

export type FiltrosDashboard = {
  vacante: string
  estado: string
  sede: string
  seniority: string
  reclutador: string
}

export const SIN_FILTROS: FiltrosDashboard = {
  vacante: 'todas',
  estado: 'todos',
  sede: 'todas',
  seniority: 'todos',
  reclutador: 'todos',
}

export const ciudadDe = (vacante: VacanteUI) => vacante.sede.split(' · ')[0]

const unicos = (valores: string[]) => [...new Set(valores)].sort((a, b) => a.localeCompare(b, 'es'))

export const OPCIONES_FILTRO = {
  vacantes: [...VACANTES_UI].sort((a, b) => a.titulo.localeCompare(b.titulo, 'es')),
  estados: ['Publicada', 'Borrador', 'Cerrada'],
  sedes: unicos(VACANTES_UI.map(ciudadDe)),
  seniorities: unicos(VACANTES_UI.map((vacante) => vacante.seniority)),
  reclutadores: unicos(VACANTES_UI.map((vacante) => vacante.reclutador.nombre)),
}

export function filtrarVacantes(filtros: FiltrosDashboard) {
  // Con `?simular=vacio` la empresa recién empieza: todavía no tiene vacantes.
  if (simulado('vacio')) return []
  return VACANTES_UI.filter(
    (vacante) =>
      (filtros.vacante === 'todas' || vacante.id === filtros.vacante) &&
      (filtros.estado === 'todos' || vacante.estado === filtros.estado) &&
      (filtros.sede === 'todas' || ciudadDe(vacante) === filtros.sede) &&
      (filtros.seniority === 'todos' || vacante.seniority === filtros.seniority) &&
      (filtros.reclutador === 'todos' || vacante.reclutador.nombre === filtros.reclutador),
  )
}

export const cuantosFiltros = (filtros: FiltrosDashboard) =>
  (Object.keys(SIN_FILTROS) as (keyof FiltrosDashboard)[]).filter((clave) => filtros[clave] !== SIN_FILTROS[clave]).length

// ── Cuándo cerró y a quién contrató cada vacante cerrada ──

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const DIA = 24 * 60 * 60 * 1000

export type Cierre = { haceDias: number; contratados: number; como: string }

function cierreDe(vacante: VacanteUI): Cierre | null {
  if (vacante.estado !== 'Cerrada' || !vacante.desenlace) return null
  const [fecha, como = ''] = vacante.desenlace.split(' · ')
  const partes = /(\d+) de (\w+)/.exec(fecha)
  const mes = partes ? MESES.indexOf(partes[2]) : -1
  const cuando = partes && mes >= 0 ? new Date(HOY.getFullYear(), mes, Number(partes[1])) : HOY
  const varias = /se contrataron (\d+)/.exec(como)
  const contratados = varias ? Number(varias[1]) : /se contrató/.test(como) ? 1 : 0
  return {
    haceDias: Math.max(0, Math.round((HOY.getTime() - cuando.getTime()) / DIA)),
    contratados,
    como,
  }
}

export const CIERRES = new Map(VACANTES_UI.map((vacante) => [vacante.id, cierreDe(vacante)]))

// ── Las aplicaciones de cada vacante, día por día (el índice es cuántos días atrás: 0 es hoy) ──

const HORIZONTE = 120
// Domingo a sábado: entre semana llega más gente que el fin de semana.
const PESO_DIA = [0.45, 1.25, 1.2, 1.1, 1.05, 0.95, 0.55]
const pesoDe = (diasAtras: number) => PESO_DIA[new Date(HOY.getTime() - diasAtras * DIA).getDay()]

function repartir(dias: number[], desde: number, hasta: number, cuantas: number) {
  if (cuantas <= 0 || hasta < desde) return
  let total = 0
  for (let dia = desde; dia <= hasta; dia += 1) total += pesoDe(dia)
  for (let dia = desde; dia <= Math.min(hasta, HORIZONTE - 1); dia += 1) dias[dia] += (cuantas * pesoDe(dia)) / total
}

function aplicacionesPorDia(vacante: VacanteUI) {
  const dias = Array.from({ length: HORIZONTE }, () => 0)
  if (vacante.estado === 'Borrador') return dias
  const cierre = CIERRES.get(vacante.id)
  if (cierre) {
    repartir(dias, cierre.haceDias, cierre.haceDias + Math.max(1, vacante.diasAbierta) - 1, vacante.aplicaciones)
    return dias
  }
  // Abierta: los últimos 7 días llevan lo que dice «esta semana» (lo mismo que cuenta el inicio de Vacantes) y el resto
  // va antes. Varias vacantes de la maqueta tienen más gente de la que cabe en sus días abiertas (el backend lleva 6 días
  // y 88 aplicaciones, 31 de esta semana): ese resto se reparte en las tres semanas anteriores como mínimo, para que la
  // serie no muestre un pico que no existe.
  const semana = Math.min(vacante.ultimaSemana, vacante.aplicaciones)
  repartir(dias, 0, Math.min(6, Math.max(0, vacante.diasAbierta - 1)), semana)
  repartir(dias, 7, Math.max(27, vacante.diasAbierta - 1), vacante.aplicaciones - semana)
  return dias
}

const POR_DIA = new Map(VACANTES_UI.map((vacante) => [vacante.id, aplicacionesPorDia(vacante)]))
const suma = (valores: number[]) => valores.reduce((total, valor) => total + valor, 0)
const enVentana = (vacante: VacanteUI, desde: number, hasta: number) => suma((POR_DIA.get(vacante.id) ?? []).slice(desde, hasta))

// ── El embudo: cuántos llegan a cada una de las cinco etapas que comparten todas las vacantes ──

export const ETAPAS_EMBUDO = ETAPAS

// Dónde va una etapa en el flujo de la vacante. Una etapa propia (un reto, un examen médico) queda entre dos comunes:
// quien está en ella ya pasó la común de antes y todavía no llega a la de después.
const posicion = (vacante: VacanteUI, etapa: string) => vacante.etapas.findIndex((una) => una.id === etapa)

// Qué parte de los que aplicaron llegó a cada etapa, con la gente de verdad de las vacantes que la tienen: los que
// siguen (llegaron a su etapa) y los rechazados (llegaron a la etapa donde se quedaron).
function proporcionesDe(vacante: VacanteUI): number[] | null {
  const paso = [
    ...CANDIDATURAS.filter((c) => c.vacante.id === vacante.id).map((c) => c.etapa),
    ...RECHAZADAS.filter((r) => r.candidatura.vacante.id === vacante.id).map((r) => r.candidatura.etapa),
  ]
  if (paso.length < 5) return null
  const llegaron = ETAPAS_EMBUDO.map((etapa, indice) => {
    if (indice === 0) return paso.length
    const limite = posicion(vacante, etapa.id)
    return limite < 0 ? 0 : paso.filter((id) => posicion(vacante, id) >= limite).length
  })
  return llegaron.map((cuantos) => cuantos / paso.length)
}

const CON_DETALLE = VACANTES_UI.map((vacante) => proporcionesDe(vacante)).filter((uno): uno is number[] => Boolean(uno))
// Las vacantes sin gente cargada en la maqueta avanzan al paso promedio de las que sí la tienen.
const PROPORCION_PROMEDIO = ETAPAS_EMBUDO.map((_, indice) => suma(CON_DETALLE.map((uno) => uno[indice])) / Math.max(1, CON_DETALLE.length))
const PROPORCIONES = new Map(VACANTES_UI.map((vacante) => [vacante.id, proporcionesDe(vacante) ?? PROPORCION_PROMEDIO]))

// Sin canales (8 oct, VP de producto): de dónde vio cada persona la vacante no se sabe; todos aplican por el portal.

// ── El resumen que pinta la pantalla ──

export type FilaVacante = {
  vacante: VacanteUI
  candidatos: number
  // Cuántos llegaron a cada etapa del embudo en el periodo.
  llegaron: number[]
  cierre: Cierre | null
}

export type Resumen = ReturnType<typeof resumir>

const redondearRepartido = (valores: number[], total: number) => {
  // Reparte `total` en enteros proporcionales a `valores` sin que la suma se desvíe (mayor residuo).
  const base = suma(valores) || 1
  const exactos = valores.map((valor) => (valor / base) * total)
  const enteros = exactos.map(Math.floor)
  let falta = total - suma(enteros)
  const orden = exactos.map((valor, indice) => ({ indice, resto: valor - Math.floor(valor) })).sort((a, b) => b.resto - a.resto)
  for (const { indice } of orden) {
    if (falta <= 0) break
    enteros[indice] += 1
    falta -= 1
  }
  return enteros
}

// «12 sep» y «vie 25», sin el «de» ni el punto que pone el formato del navegador.
const MES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const DIA_CORTO = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
const fechaHace = (dias: number) => new Date(HOY.getTime() - dias * DIA)
const fechaCorta = (fecha: Date) => `${fecha.getDate()} ${MES_CORTO[fecha.getMonth()]}`
const diaCorto = (fecha: Date) => `${DIA_CORTO[fecha.getDay()]} ${fecha.getDate()}`

export function resumir(vacantes: VacanteUI[], periodo: Periodo) {
  const { dias } = periodoDe(periodo)

  // Cada vacante en el periodo: su gente, hasta dónde llegó y si cerró en él.
  const filas: FilaVacante[] = vacantes.map((vacante) => {
    const candidatos = Math.round(enVentana(vacante, 0, dias))
    const cierre = CIERRES.get(vacante.id) ?? null
    const cerroAqui = cierre && cierre.haceDias < dias ? cierre : null
    const proporcion = PROPORCIONES.get(vacante.id) ?? PROPORCION_PROMEDIO
    const llegaron = proporcion.map((parte) => Math.round(candidatos * parte))
    llegaron[0] = candidatos
    // La última etapa es la oferta: en una vacante que cerró en el periodo, los que llegaron son los contratados.
    const ultima = llegaron.length - 1
    if (cerroAqui) {
      llegaron[ultima] = cerroAqui.contratados
      for (let indice = ultima - 1; indice > 0; indice -= 1) llegaron[indice] = Math.max(llegaron[indice], llegaron[indice + 1])
    }
    return { vacante, candidatos, llegaron, cierre: cerroAqui }
  })

  const candidatos = suma(filas.map((fila) => fila.candidatos))
  const conGente = filas.filter((fila) => fila.candidatos > 0).sort((a, b) => b.candidatos - a.candidatos)

  const publicadas = vacantes.filter((vacante) => vacante.estado === 'Publicada')
  // Las que estaban publicadas al empezar el periodo: las de hoy que ya llevaban esos días y las que cerraron en él
  // después de haber abierto antes.
  const publicadasAntes = vacantes.filter((vacante) => {
    const cierre = CIERRES.get(vacante.id)
    if (cierre) return cierre.haceDias < dias && cierre.haceDias + vacante.diasAbierta >= dias
    return vacante.estado === 'Publicada' && vacante.diasAbierta >= dias
  }).length
  const cerradas = filas.filter((fila) => fila.cierre)
  const conContratacion = cerradas.filter((fila) => (fila.cierre?.contratados ?? 0) > 0)
  const contratados = suma(conContratacion.map((fila) => fila.cierre?.contratados ?? 0))
  const diasContratar = conContratacion.length
    ? Math.round(suma(conContratacion.map((fila) => fila.vacante.diasAbierta)) / conContratacion.length)
    : null

  const embudo = ETAPAS_EMBUDO.map((etapa, indice) => ({
    etapa,
    llegaron: suma(filas.map((fila) => fila.llegaron[indice])),
  }))

  // La serie: por día con 7 y 30 días, por semana con 90.
  const porSemana = dias > 30
  const tramos = porSemana ? Math.ceil(dias / 7) : dias
  // Cada tramo en enteros que suman exactamente lo de las cifras y el embudo: el total de la leyenda es el de arriba.
  const tramosCrudos = Array.from({ length: tramos }, (_, indice) => {
    const atras = tramos - 1 - indice
    const [desde, hasta] = porSemana ? [atras * 7, atras * 7 + 7] : [atras, atras + 1]
    return {
      fecha: fechaHace(desde),
      aplicaron: suma(vacantes.map((vacante) => enVentana(vacante, desde, hasta))),
      pasaron: suma(vacantes.map((vacante) => enVentana(vacante, desde, hasta) * (PROPORCIONES.get(vacante.id) ?? PROPORCION_PROMEDIO)[1])),
    }
  })
  const aplicaronEnteros = redondearRepartido(
    tramosCrudos.map((tramo) => tramo.aplicaron),
    candidatos,
  )
  const pasaronEnteros = redondearRepartido(
    tramosCrudos.map((tramo) => tramo.pasaron),
    embudo[1]?.llegaron ?? 0,
  )
  const serie = tramosCrudos.map((tramo, indice) => ({
    tramo: dias === 7 ? diaCorto(tramo.fecha) : fechaCorta(tramo.fecha),
    aplicaron: aplicaronEnteros[indice],
    pasaron: pasaronEnteros[indice],
  }))

  return {
    dias,
    filas,
    candidatos,
    conGente,
    publicadas,
    publicadasAntes,
    fuera: publicadas.filter((vacante) => vacante.oculta).length,
    borradores: vacantes.filter((vacante) => vacante.estado === 'Borrador').length,
    cerradas,
    conContratacion,
    contratados,
    diasContratar,
    embudo,
    serie,
    porSemana,
  }
}

// ── Lo que lee la IA: el paso donde más gente se queda, quién espera una respuesta y la vacante que se está quedando ──

export type Lectura = { id: string; tema: string; titulo: string; detalle: string; accion: { texto: string; ruta: string } }

export const DIAS_EN_RIESGO = 30

export function leer(resumen: Resumen): Lectura[] {
  const lecturas: Lectura[] = []
  const { embudo } = resumen

  // 1. El paso con menos conversión, de los que tienen gente. Sin el último: de los que llegan a la oferta se contrata a
  // uno por vacante y los demás siguen en proceso, así que ahí «se queda» casi todo el mundo y no dice nada.
  const pasos = embudo
    .slice(1, -1)
    .map((paso, indice) => ({ desde: embudo[indice], hasta: paso, tasa: embudo[indice].llegaron ? paso.llegaron / embudo[indice].llegaron : 1 }))
    .filter((paso) => paso.desde.llegaron >= 5)
  const peor = [...pasos].sort((a, b) => a.tasa - b.tasa)[0]
  if (peor) {
    lecturas.push({
      id: 'embudo',
      tema: 'En el proceso',
      titulo: `Solo el ${Math.round(peor.tasa * 100)} % pasa de ${peor.desde.etapa.titulo} a ${peor.hasta.etapa.titulo}`,
      detalle: `Es el paso donde más gente se queda: siguen ${peor.hasta.llegaron} de ${peor.desde.llegaron}. Revisa a quién tienes en ${peor.desde.etapa.titulo} antes de buscar más candidatos.`,
      accion: { texto: 'Ver en Vacantes', ruta: '/admin/seleccion/exploraciones/uno' },
    })
  }

  // 2. Quién espera una respuesta del equipo, y desde hace cuánto: lo que más se demora es lo que hace perder gente.
  const enEstas = new Set(resumen.filas.map((fila) => fila.vacante.id))
  const esperan = CANDIDATURAS.filter((c) => enEstas.has(c.vacante.id) && ESPERA_RESPUESTA(c)).sort((a, b) => b.dias - a.dias)
  const primera = esperan[0]
  if (primera) {
    lecturas.push({
      id: 'esperan',
      tema: 'En las respuestas',
      titulo: `${esperan.length === 1 ? 'Una persona espera' : `${esperan.length} personas esperan`} una respuesta del equipo`,
      detalle: `Quien más lleva es ${primera.candidato.nombre}: ${primera.dias === 1 ? '1 día' : `${primera.dias} días`} en ${tituloEtapa(primera.etapa)} de ${primera.vacante.titulo}. Quien espera mucho acepta otra oferta.`,
      accion: { texto: 'Ver quién espera', ruta: `/admin/seleccion/exploraciones/uno/${primera.vacante.id}` },
    })
  }

  // 3. La vacante abierta que más lleva y menos recibe.
  const quieta = resumen.publicadas
    .filter((vacante) => vacante.diasAbierta >= DIAS_EN_RIESGO)
    .sort((a, b) => b.diasAbierta - a.diasAbierta || a.ultimaSemana - b.ultimaSemana)[0]
  if (quieta) {
    lecturas.push({
      id: 'vacante',
      tema: 'En las vacantes',
      titulo: `${quieta.titulo} lleva ${quieta.diasAbierta} días abierta`,
      detalle: `Es la que más lleva y ${
        quieta.aplicaciones === 0
          ? 'todavía no le llega nadie'
          : quieta.ultimaSemana === 0
            ? 'esta semana no le llegó nadie'
            : quieta.ultimaSemana === 1
              ? 'esta semana solo le llegó 1 persona'
              : `esta semana solo le llegaron ${quieta.ultimaSemana} personas`
      }. Revisa la publicación o compártela con tu red.`,
      accion: { texto: 'Abrir la vacante', ruta: `/admin/seleccion/exploraciones/uno/${quieta.id}` },
    })
  }

  return lecturas
}

// «Laura M.»: el nombre corto, como en la tabla de Vacantes.
export const nombreCorto = (nombre: string) => {
  const [primero, apellido] = nombre.split(' ')
  return apellido ? `${primero} ${apellido[0]}.` : primero
}
