import { CONTENIDOS, type Contenido } from './contenidos'

// Cuánta gente empezó cada contenido, cuánta lo terminó y a cuánta la frenó una evaluación.
//
// ⚠️ Datos de maqueta. La base del playground solo trae resultados de tres contenidos (f002, f007 y f021), y con
// tres filas una media no dice nada. Aquí se derivan del propio contenido para que la pantalla se pueda leer y
// enseñar. Cuando haya datos reales, esto se borra y se leen de ahí.
//
// Se derivan y no se sortean: el mismo contenido da siempre los mismos números, así la pantalla no cambia entre
// recargas y se puede comparar un antes y un después.

export type ConsumoContenido = {
  /** Quienes abrieron el contenido al menos una vez. */
  iniciaron: number
  /** De los que iniciaron, quienes llegaron al final. */
  terminaron: number
  /** Frenados por agotar los intentos de una evaluación. Solo puede pasar si el contenido tiene evaluación. */
  bloqueados: number
  /** Solo las evaluaciones bloquean: un video o un PDF no frenan a nadie (HU de Resultados, RN-10). */
  tieneEvaluacion: boolean
}

/** Número estable a partir del identificador: el mismo contenido da siempre el mismo valor. */
function semilla(id: string) {
  let valor = 0
  for (const letra of id) valor = (valor * 31 + letra.charCodeAt(0)) % 100000
  return valor
}

// Supuesto: los contenidos que entregan certificado tienen evaluación, porque el certificado se gana aprobándola.
// Si el producto acaba diciendo otra cosa, se cambia aquí y las métricas se recalculan solas.
const tieneEvaluacion = (contenido: Contenido) => contenido.conCertificacion === true

export function consumoDe(contenido: Contenido, hasta = new Date()): ConsumoContenido {
  // Los borradores y lo archivado no los consume nadie.
  if (contenido.visibilidad !== 'Publicado') {
    return { iniciaron: 0, terminaron: 0, bloqueados: 0, tieneEvaluacion: tieneEvaluacion(contenido) }
  }

  const base = semilla(contenido.id)

  // Meses que lleva publicado hasta la fecha que se consulta. Sin publicar aún, no hay nada que contar.
  const publicado = new Date(`${contenido.creacion}T00:00:00`)
  const meses = (hasta.getFullYear() - publicado.getFullYear()) * 12 + (hasta.getMonth() - publicado.getMonth())
  if (meses < 0) return { iniciaron: 0, terminaron: 0, bloqueados: 0, tieneEvaluacion: tieneEvaluacion(contenido) }

  // La gente va entrando con el tiempo: un contenido de hace seis meses acumula más que uno de la semana pasada.
  const iniciaron = Math.round((40 + (base % 260)) * Math.min(1, (meses + 1) / 6))

  // La finalización baja con la duración —lo largo se abandona más— y sube con el tiempo que lleva publicado:
  // quien empezó hace medio año ya tuvo ocasión de terminarlo; quien empezó ayer, no. Por eso un catálogo con
  // muchas publicaciones recientes baja su media sin que nada esté mal.
  const penalizacionPorDuracion = Math.min(35, Math.round((contenido.minutos ?? 30) / 6))
  const madurez = Math.min(18, meses * 3)
  const finalizacion = Math.max(18, Math.min(88, 58 - penalizacionPorDuracion + madurez + (base % 13) - 6))
  const terminaron = Math.round((iniciaron * finalizacion) / 100)

  // Solo bloquea la evaluación, y solo a una minoría: entre el 1 % y el 6 % de quienes empezaron.
  const conEvaluacion = tieneEvaluacion(contenido)
  const bloqueados = conEvaluacion ? Math.round((iniciaron * (1 + (base % 6))) / 100) : 0

  return { iniciaron, terminaron, bloqueados, tieneEvaluacion: conEvaluacion }
}

/** El consumo de todo el catálogo, sumado. */
export function consumoDelCatalogo(contenidos: Contenido[] = CONTENIDOS, hasta = new Date()) {
  return contenidos.reduce(
    (total, contenido) => {
      const consumo = consumoDe(contenido, hasta)
      return {
        iniciaron: total.iniciaron + consumo.iniciaron,
        terminaron: total.terminaron + consumo.terminaron,
        bloqueados: total.bloqueados + consumo.bloqueados,
        conEvaluacion: total.conEvaluacion + (consumo.tieneEvaluacion && contenido.visibilidad === 'Publicado' ? 1 : 0),
      }
    },
    { iniciaron: 0, terminaron: 0, bloqueados: 0, conEvaluacion: 0 },
  )
}
