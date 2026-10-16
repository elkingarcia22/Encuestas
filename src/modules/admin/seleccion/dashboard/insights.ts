import { useSyncExternalStore } from 'react'
import { VACANTES_UI } from '../propuestas/datos'
import type { Periodo } from './datos'

// AI Insights (8 oct, VP de producto: «no sería llamarlo dashboard, sino AI Insights… en donde tú puedas hablar con tu
// data y puedas generar dashboards. "Genérame un reporte, un dashboard sobre…", me genera un preview que es como un
// artifact, y luego lo puedo opinar o guardar. Y voy a empezar a tener mis propios dashboards personalizados»).
//
// Cada empresa necesita un dashboard distinto: en vez de uno fijo, se pide con palabras. La IA lo arma con los bloques
// que ya existen (las cifras, el embudo, cuántos aplican y las vacantes con más gente), sobre las vacantes y el periodo
// que se nombren. Lo guardado se actualiza solo todos los días a las 7:00 a. m. Maqueta: el pedido se lee con palabras
// clave; en el producto lo arma el modelo con la base de datos de Selección (lo mismo que hará Suite AI Pro en enero).

export type BloqueId = 'cifras' | 'embudo' | 'aplican' | 'vacantes'

export const BLOQUES: Record<BloqueId, { nombre: string; corto: string }> = {
  cifras: { nombre: 'Cómo va la contratación', corto: 'las cifras de contratación' },
  embudo: { nombre: 'Dónde se quedan los candidatos', corto: 'el embudo por etapa' },
  aplican: { nombre: 'Cuántos aplican', corto: 'cuántos aplican en el tiempo' },
  vacantes: { nombre: 'Las vacantes con más candidatos', corto: 'las vacantes con más gente' },
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
}

// El que ya existía, guardado como el primero: lo de siempre no se pierde, ahora es uno más de tus dashboards.
const DE_SIEMPRE: Tablero = {
  id: 'contratacion',
  titulo: 'Cómo va la contratación',
  pedido: 'Las cifras de contratación, dónde se quedan los candidatos, cuántos aplican y las vacantes con más gente',
  bloques: ['cifras', 'embudo', 'aplican', 'vacantes'],
  periodo: '90',
  guardado: '7 oct',
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

const normal = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const PALABRAS: [BloqueId, RegExp][] = [
  ['cifras', /contrat|cifras|como va|como vamos|resumen|tiempo|tarda|dias para|exito|indicador|kpi/],
  ['embudo', /embudo|etapa|se quedan|se caen|atasc|conversion|pasan de|avanza/],
  ['aplican', /aplic|postul|llegan|llego|llegaron|entraron|candidatos nuevos|por semana|por dia|tendencia/],
  ['vacantes', /vacantes? con mas|mas candidatos|ranking|top|cada vacante|por vacante|todas las vacantes/],
]

export type Armado = {
  tablero: Tablero
  // Lo que la IA aclara antes del dashboard: un dato que no tiene, una vacante que no encontró.
  aclaracion?: string
}

let siguiente = 1

export function armarTablero(pedido: string): Armado {
  const texto = normal(pedido)
  let bloques = PALABRAS.filter(([, patron]) => patron.test(texto)).map(([id]) => id)
  // De dónde llega cada persona no se sabe (8 oct, VP de producto): todas aplican por el portal de empleo.
  const canal = /linkedin|computrabajo|referid|canal|origen|fuente|de donde (llegan|vienen)/.test(texto)
  if (canal) bloques = [...new Set<BloqueId>([...bloques, 'aplican', 'embudo'])]
  if (!bloques.length) bloques = ['cifras', 'aplican']

  const periodo: Periodo = /\b7\b|semana/.test(texto) ? '7' : /\b30\b|mes\b|ultimo mes/.test(texto) ? '30' : '90'
  const vacante = VACANTES_UI.find((una) => texto.includes(normal(una.titulo)))
  const nombre = bloques.length === 1 ? BLOQUES[bloques[0]].nombre : bloques.map((id) => BLOQUES[id].nombre).slice(0, 2).join(' y ')
  return {
    tablero: {
      id: `pedido-${Date.now()}-${siguiente++}`,
      titulo: vacante ? `${nombre} · ${vacante.titulo}` : nombre,
      pedido: pedido.trim(),
      bloques,
      periodo,
      vacante: vacante?.id,
      guardado: 'hoy',
    },
    aclaracion: canal
      ? 'No sé por qué canal llega cada persona (LinkedIn, Computrabajo, un referido): todas aplican por el portal de empleo. Lo que sí sé es cuántos aplican y cómo avanzan.'
      : undefined,
  }
}

// Lo que se le puede pedir, para no empezar de cero.
export const SUGERENCIAS = [
  'Genérame un dashboard de cuánto tardamos en contratar',
  'El embudo de Analista de datos este mes',
  '¿Cuántos aplicaron esta semana?',
  'Las vacantes con más candidatos en los últimos 90 días',
]
