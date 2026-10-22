import { useSyncExternalStore } from 'react'
import { VACANTES_UI } from '../propuestas/datos'
import type { Periodo } from './datos'

// Orbit Data (16 oct, VP de producto: «más que los AI Insights… es el mismo suite de AI que vamos a tener, pero
// que tú puedas hablar con tu data… en selección es donde queremos probar… que sea muy conversacional. Y ahí es donde
// entra lo de la UI generativa, que genera sus propios dashboards»). Ya lo había pedido el 8 oct: «"Genérame un reporte,
// un dashboard sobre…", me genera un preview que es como un artifact, y luego lo puedo opinar o guardar».
//
// Cada empresa necesita un tablero distinto: en vez de uno fijo, se pide con palabras. Orbit lo arma con los bloques que
// ya existen (las cifras, el embudo, cuántos aplican, las vacantes con más gente, a quién mirar, dónde espera la gente y
// qué vacantes atraen a la gente indicada), sobre las vacantes y el periodo que se nombren, y se ajusta conversando
// («agrégale el embudo», «solo este mes»). Lo guardado se actualiza solo todos los días a las 7:00 a. m. Maqueta: el
// pedido se lee con palabras clave; en el producto lo arma el modelo con la base de datos de Selección.

export type BloqueId = 'cifras' | 'embudo' | 'aplican' | 'vacantes' | 'destacados' | 'espera' | 'calidad'

export const BLOQUES: Record<BloqueId, { nombre: string; corto: string }> = {
  cifras: { nombre: 'Cómo va la contratación', corto: 'las cifras de contratación' },
  embudo: { nombre: 'Dónde se quedan los candidatos', corto: 'el embudo por etapa' },
  aplican: { nombre: 'Cuántos aplican', corto: 'cuánta gente aplica' },
  vacantes: { nombre: 'Las vacantes con más candidatos', corto: 'las vacantes con más gente' },
  destacados: { nombre: 'Candidatos que la IA destaca', corto: 'los candidatos que destaca la IA' },
  espera: { nombre: 'Dónde espera más la gente', corto: 'cuánto espera la gente en cada etapa' },
  calidad: { nombre: 'Qué vacantes atraen a la gente indicada', corto: 'qué vacantes atraen a la gente indicada' },
}

export type Tablero = {
  id: string
  titulo: string
  // Lo que pidió la persona, con sus palabras.
  pedido: string
  bloques: BloqueId[]
  periodo: Periodo
  // Una vacante, si se nombró; si no, todas.
  vacante?: string
  // Cuándo se guardó, dicho para leer («7 oct», «hoy»).
  guardado: string
  // Cada ajuste conversando es una versión nueva del mismo tablero (mismo id): guardarla reemplaza la anterior.
  version: number
}

// El que ya existía, guardado como el primero: lo de siempre no se pierde, ahora es uno más de tus tableros.
const DE_SIEMPRE: Tablero = {
  id: 'contratacion',
  titulo: 'Cómo va la contratación',
  pedido: 'Las cifras de contratación, dónde se quedan los candidatos, cuántos aplican y las vacantes con más gente',
  bloques: ['cifras', 'embudo', 'aplican', 'vacantes'],
  periodo: '90',
  guardado: '7 oct',
  version: 1,
}

let guardados: Tablero[] = [DE_SIEMPRE]
const oyentes = new Set<() => void>()
const avisar = () => oyentes.forEach((oyente) => oyente())

export const registroDeTableros = {
  leer: () => guardados,
  suscribir: (oyente: () => void) => {
    oyentes.add(oyente)
    return () => {
      oyentes.delete(oyente)
    }
  },
  guardar(tablero: Tablero) {
    guardados = [tablero, ...guardados.filter((uno) => uno.id !== tablero.id)]
    avisar()
    return () => {
      guardados = guardados.filter((uno) => uno.id !== tablero.id)
      avisar()
    }
  },
  quitar(id: string) {
    const antes = guardados
    guardados = guardados.filter((uno) => uno.id !== id)
    avisar()
    return () => {
      guardados = antes
      avisar()
    }
  },
}

export const useTableros = () => useSyncExternalStore(registroDeTableros.suscribir, registroDeTableros.leer)

/* Leer el pedido -------------------------------------------------------------------------------------------------- */

export const normal = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// En orden de prioridad: cuando una pregunta suelta toca varios temas, responde con el primero.
export const PALABRAS: [BloqueId, RegExp][] = [
  ['destacados', /destac|sobresal|mejores candidatos|mejor perfil|a quien (mir|deberia)|cumplen casi todo|talento/],
  ['espera', /donde espera|espera la gente|esperando mas|mas lent|cuanto (llevan|tardan|esperan) en|tiempo en cada etapa|se demora/],
  ['calidad', /gente indicada|afin|calidad de|atraen|cumplen todo lo que pide|buenos candidatos/],
  ['embudo', /embudo|se quedan|se caen|conversion|pasan de|avanza|filtro/],
  ['aplican', /aplic|postul|llegan|llego|llegaron|entraron|candidatos nuevos|por semana|por dia|tendencia/],
  ['vacantes', /vacantes? con mas|mas candidatos|ranking|top|cada vacante|por vacante|todas las vacantes/],
  ['cifras', /contrat|cifras|como va|como vamos|resumen|tiempo|tarda|dias para|exito|indicador|kpi/],
]

export const bloquesDe = (texto: string) => PALABRAS.filter(([, patron]) => patron.test(normal(texto))).map(([id]) => id)

export const periodoDel = (texto: string): Periodo | undefined => {
  const limpio = normal(texto)
  if (/\b7\b|semana/.test(limpio)) return '7'
  if (/\b30\b|\bmes\b|ultimo mes/.test(limpio)) return '30'
  if (/\b90\b|trimestre|tres meses/.test(limpio)) return '90'
  return undefined
}

export const vacanteDel = (texto: string) => {
  const limpio = normal(texto)
  // «Diseñador(a) de producto» también se encuentra escrito sin el «(a)».
  return VACANTES_UI.find((una) => limpio.includes(normal(una.titulo)) || limpio.includes(normal(una.titulo).replace('(a)', '')))
}

// De dónde llega cada persona no se sabe (8 oct, VP de producto): todas aplican por el portal de empleo.
export const PREGUNTA_CANAL = /linkedin|computrabajo|referid|canal|origen|fuente|de donde (llegan|vienen)/
export const SIN_CANAL =
  'No sé por qué canal llega cada persona (LinkedIn, Computrabajo, un referido): todas aplican por el portal de empleo. Lo que sí sé es cuántos aplican y cómo avanzan.'

export const tituloDe = (bloques: BloqueId[], vacante?: string) => {
  // «Cómo va la contratación y cuántos aplican»: el segundo nombre sigue la frase, en minúscula.
  const [primero, segundo] = bloques.map((id) => BLOQUES[id].nombre)
  const nombre = segundo ? `${primero} y ${segundo.charAt(0).toLowerCase()}${segundo.slice(1)}` : primero
  const suya = VACANTES_UI.find((una) => una.id === vacante)
  return suya ? `${nombre} · ${suya.titulo}` : nombre
}

export type Armado = {
  tablero: Tablero
  // Lo que Orbit aclara antes del tablero: un dato que no tiene, una vacante que no encontró.
  aclaracion?: string
}

let siguiente = 1

export function armarTablero(pedido: string): Armado {
  const texto = normal(pedido)
  let bloques = bloquesDe(pedido)
  const canal = PREGUNTA_CANAL.test(texto)
  if (canal) bloques = [...new Set<BloqueId>([...bloques, 'aplican', 'embudo'])]
  // Sin tema dicho, lo que más se pide: cómo va la contratación y cuánta gente llega.
  if (!bloques.length) bloques = ['cifras', 'aplican', 'embudo']

  const vacante = vacanteDel(pedido)
  return {
    tablero: {
      id: `pedido-${Date.now()}-${siguiente++}`,
      titulo: tituloDe(bloques, vacante?.id),
      pedido: pedido.trim(),
      bloques,
      periodo: periodoDel(pedido) ?? '90',
      vacante: vacante?.id,
      guardado: 'hoy',
      version: 1,
    },
    aclaracion: canal ? SIN_CANAL : undefined,
  }
}

/* Ajustar el último tablero conversando («agrégale el embudo», «quita las cifras», «solo este mes») -------------- */

export const PIDE_AJUSTE = /^(y )?(agreg|anad|suma|pon|mete|incluy|quit|saca|elimin|borra|sin |solo|cambia|ahora|mejor|y si|tambien)/

export type Ajuste = {
  tablero: Tablero
  // Lo que cambió, para decirlo en una línea («le agregué el embudo por etapa»). Vacío si no se entendió nada.
  cambios: string[]
}

const QUITAR = /quit|saca|elimin|borra|sin /

export function ajustarTablero(antes: Tablero, pedido: string): Ajuste {
  const texto = normal(pedido)
  const nombrados = bloquesDe(pedido)
  const cambios: string[] = []
  let bloques = [...antes.bloques]

  if (nombrados.length && QUITAR.test(texto)) {
    const fuera = nombrados.filter((id) => bloques.includes(id))
    // Un tablero no se queda vacío: siempre le queda al menos un bloque.
    const quedan = bloques.filter((id) => !fuera.includes(id))
    if (fuera.length && quedan.length) {
      bloques = quedan
      cambios.push(`le quité ${fuera.map((id) => BLOQUES[id].corto).join(' y ')}`)
    }
  } else if (nombrados.length) {
    const nuevos = nombrados.filter((id) => !bloques.includes(id))
    if (nuevos.length) {
      bloques = [...bloques, ...nuevos]
      cambios.push(`le agregué ${nuevos.map((id) => BLOQUES[id].corto).join(' y ')}`)
    }
  }

  const periodo = periodoDel(pedido)
  if (periodo && periodo !== antes.periodo) cambios.push(`ahora cuenta los últimos ${periodo} días`)

  const vacante = vacanteDel(pedido)
  const todas = /todas las vacantes|todas\b|sin filtro|general/.test(texto) && !nombrados.includes('vacantes')
  const vacanteNueva = vacante ? vacante.id : todas ? undefined : antes.vacante
  if (vacanteNueva !== antes.vacante) cambios.push(vacante ? `ahora es solo de ${vacante.titulo}` : 'ahora cuenta todas tus vacantes')

  return {
    tablero: {
      ...antes,
      titulo: tituloDe(bloques, vacanteNueva),
      bloques,
      periodo: periodo ?? antes.periodo,
      vacante: vacanteNueva,
      guardado: 'hoy',
      version: antes.version + 1,
    },
    cambios,
  }
}

// Lo que se le puede pedir, para no empezar de cero.
export const SUGERENCIAS = [
  '¿Cómo va la contratación?',
  'Arma un tablero de Analista de datos este mes',
  '¿A quién debería mirar primero?',
  '¿Dónde espera más la gente?',
]
