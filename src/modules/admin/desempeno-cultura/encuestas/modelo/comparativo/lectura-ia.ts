import { FAVORABILITY_TARGET, formatPercent } from '../favorabilityScale'
import type { ComparativeColumn } from './comparativeHelpers'
import type { Comparativo } from './lectura'

// La lectura de la IA sobre un comparativo, escrita a partir de las mismas cifras que muestran el
// resumen y la tabla. En el prototipo era un texto fijo que no coincidía con sus propios números
// («5 períodos», otra base); aquí cada afirmación sale del cruce que se eligió y cita su evidencia.

export type TipoHallazgo = 'mejora' | 'riesgo' | 'oportunidad' | 'recomendacion'
export type Confianza = 'alta' | 'media' | 'baja'
export type Hallazgo = { id: string; tipo: TipoHallazgo; titulo: string; cuerpo: string; evidencia: string; impacto: string; confianza: Confianza }
export type Proyeccion = { etiqueta: string; valor: number; real: boolean }
/** La cifra que sigue la lectura: la favorabilidad, o el eNPS en un comparativo de eNPS (que no tiene favorabilidad). */
export type MetricaLectura = { nombre: string; formato: (valor: number) => string; diferencia: (valor: number) => string; meta: number; minimo: number; maximo: number }
export type LecturaIa = { resumen: string; hallazgos: readonly Hallazgo[]; proyeccion: readonly Proyeccion[]; pendiente: number; metrica: MetricaLectura }

const signo = (valor: number) => (valor > 0 ? '+' : valor < 0 ? '−' : '')
const pp = (valor: number) => `${signo(valor)}${Math.abs(valor).toFixed(1).replace('.', ',')} pp`
const pts = (valor: number) => `${signo(Math.round(valor))}${Math.abs(Math.round(valor))} pts`
// Una diferencia por debajo de esto es ruido de muestra, no un cambio que valga un hallazgo.
const UMBRAL_CAMBIO = 1.5
// Cuántas mediciones hacia adelante se proyecta la tendencia.
const MEDICIONES_PROYECTADAS = 2

/** Pendiente de una recta ajustada por mínimos cuadrados a los puntos, en unidades por medición. */
function pendienteDe(valores: readonly number[]): number {
  const n = valores.length
  if (n < 2) return 0
  const promedioX = (n - 1) / 2
  const promedioY = valores.reduce((suma, valor) => suma + valor, 0) / n
  let arriba = 0
  let abajo = 0
  valores.forEach((valor, x) => {
    arriba += (x - promedioX) * (valor - promedioY)
    abajo += (x - promedioX) ** 2
  })
  return abajo === 0 ? 0 : arriba / abajo
}

const conSigno = (valor: number) => `${valor > 0 ? '+' : ''}${Math.round(valor)}`
const FAVORABILIDAD: MetricaLectura = { nombre: 'favorabilidad', formato: formatPercent, diferencia: pp, meta: FAVORABILITY_TARGET, minimo: 0, maximo: 100 }
const ENPS: MetricaLectura = { nombre: 'eNPS', formato: conSigno, diferencia: pts, meta: 20, minimo: -100, maximo: 100 }

type Cambio = { etiqueta: string; base: number; otra: number; delta: number }

/** Cuánto cambió cada sección raíz entre la base y la medición comparada más reciente. */
function cambiosPorSeccion(comparativo: Comparativo, contra: ComparativeColumn): Cambio[] {
  const base = comparativo.olas[0]
  return comparativo.arbol
    .map((nodo) => {
      const enBase = nodo.measures[base.id]?.favorability
      const enOtra = nodo.measures[contra.id]?.favorability
      if (enBase == null || enOtra == null) return null
      return { etiqueta: nodo.label, base: enBase, otra: enOtra, delta: Math.round((enBase - enOtra) * 10) / 10 }
    })
    .filter((cambio): cambio is Cambio => cambio !== null)
}

export function lecturaIa(comparativo: Comparativo): LecturaIa {
  const { olas, titulares, columnas } = comparativo
  const base = olas[0]
  const previa = olas[1]
  const primera = olas[olas.length - 1]
  const tBase = titulares[base.id]
  const tPrevia = titulares[previa.id]
  const tPrimera = titulares[primera.id]

  const esEnps = comparativo.tipo === 'NPS'
  const metrica = esEnps ? ENPS : FAVORABILIDAD
  const valorDe = (titular: (typeof titulares)[string] | undefined) => (esEnps ? (titular?.nps ?? 0) : (titular?.favorabilidad ?? 0))
  const El = esEnps ? 'El eNPS' : 'La favorabilidad'
  // La serie de la más antigua a la más reciente, para la tendencia.
  const cronologia = [...columnas].reverse()
  const serie = cronologia.map((columna) => valorDe(titulares[columna.id]))
  const pendiente = pendienteDe(serie)
  const ultima = serie[serie.length - 1] ?? 0
  const proyeccion: Proyeccion[] = [
    ...cronologia.map((columna, indice) => ({ etiqueta: columna.shortLabel, valor: serie[indice], real: true })),
    ...Array.from({ length: MEDICIONES_PROYECTADAS }, (_, paso) => ({
      etiqueta: `Próxima medición${MEDICIONES_PROYECTADAS > 1 ? ` ${paso + 1}` : ''}`,
      valor: Math.max(metrica.minimo, Math.min(metrica.maximo, Math.round((ultima + pendiente * (paso + 1)) * 10) / 10)),
      real: false,
    })),
  ]

  const deltaFav = valorDe(tBase) - valorDe(tPrevia)
  const deltaTotal = valorDe(tBase) - valorDe(tPrimera)
  const deltaPart = tBase.participacion - tPrevia.participacion
  // Las secciones se leen por favorabilidad: un comparativo de eNPS no tiene secciones de escala que comparar.
  const cambios = esEnps ? [] : cambiosPorSeccion(comparativo, previa).sort((a, b) => b.delta - a.delta)
  const mejor = cambios[0]
  const peor = cambios[cambios.length - 1]
  const masBaja = [...cambios].sort((a, b) => a.base - b.base)[0]

  const direccion = Math.abs(deltaFav) < UMBRAL_CAMBIO ? 'se mantiene' : deltaFav > 0 ? 'mejora' : 'cae'
  const resumen =
    `El comparativo cruza ${columnas.length} mediciones de ${esEnps ? 'eNPS' : comparativo.tipo.toLowerCase()} con base en ${base.shortLabel}. ` +
    `${El} ${direccion} frente a ${previa.shortLabel} (${metrica.formato(valorDe(tBase))}, ${metrica.diferencia(deltaFav)})` +
    (olas.length > 2 ? ` y acumula ${metrica.diferencia(deltaTotal)} desde ${primera.shortLabel}.` : '.') +
    (mejor && mejor.delta > 0 ? ` El mayor avance está en «${mejor.etiqueta}»` : '') +
    (peor && peor.delta < 0 ? `${mejor && mejor.delta > 0 ? ' y el' : ' El'} mayor retroceso, en «${peor.etiqueta}».` : mejor && mejor.delta > 0 ? '; ninguna sección retrocede.' : '')

  const hallazgos: Hallazgo[] = []
  hallazgos.push({
    id: 'tendencia',
    tipo: deltaTotal >= 0 ? 'mejora' : 'riesgo',
    titulo: `${El} viene ${deltaTotal >= 0 ? 'subiendo' : 'bajando'}`,
    cuerpo: `Entre ${primera.shortLabel} y ${base.shortLabel} ${esEnps ? 'el eNPS' : 'la favorabilidad general'} se movió ${metrica.diferencia(deltaTotal)}, a un ritmo de ${metrica.diferencia(pendiente)} por medición.`,
    evidencia: `${esEnps ? 'eNPS' : 'Favorabilidad'}: ${metrica.formato(valorDe(tPrimera))} en ${primera.shortLabel} → ${metrica.formato(valorDe(tBase))} en ${base.shortLabel}`,
    impacto: pendiente >= 0 ? 'Si el ritmo se sostiene, la próxima medición debería quedar por encima de la actual.' : 'Si nada cambia, la próxima medición quedaría por debajo de la actual.',
    confianza: olas.length >= 3 ? 'alta' : 'media',
  })
  if (peor && peor.delta <= -UMBRAL_CAMBIO) {
    hallazgos.push({
      id: 'retroceso',
      tipo: 'riesgo',
      titulo: `«${peor.etiqueta}» retrocede frente a ${previa.shortLabel}`,
      cuerpo: `Es la sección que más cae entre las dos mediciones más recientes. Una caída concentrada en un solo bloque suele tener una causa concreta que se puede atender.`,
      evidencia: `${peor.etiqueta}: ${formatPercent(peor.otra)} → ${formatPercent(peor.base)} (${pp(peor.delta)})`,
      impacto: 'Revisar sus preguntas en la tabla y los comentarios de la sección antes de la próxima medición.',
      confianza: Math.abs(peor.delta) >= 4 ? 'alta' : 'media',
    })
  }
  if (mejor && mejor.delta >= UMBRAL_CAMBIO) {
    hallazgos.push({
      id: 'avance',
      tipo: 'oportunidad',
      titulo: `«${mejor.etiqueta}» es la que más avanza`,
      cuerpo: 'Lo que cambió en este bloque entre mediciones es lo que la organización ya sabe hacer: sirve de modelo para las secciones que retroceden.',
      evidencia: `${mejor.etiqueta}: ${formatPercent(mejor.otra)} → ${formatPercent(mejor.base)} (${pp(mejor.delta)})`,
      impacto: 'Documentar qué acciones hubo en ese frente y replicarlas.',
      confianza: Math.abs(mejor.delta) >= 4 ? 'alta' : 'media',
    })
  }
  if (masBaja) {
    hallazgos.push({
      id: 'piso',
      tipo: 'recomendacion',
      titulo: `«${masBaja.etiqueta}» sigue siendo el piso`,
      cuerpo: `Aunque se mueva entre mediciones, sigue siendo la sección con menor favorabilidad en ${base.shortLabel}. Es donde una acción rinde más.`,
      evidencia: `${masBaja.etiqueta}: ${formatPercent(masBaja.base)} en ${base.shortLabel}`,
      impacto: 'Priorizarla en el plan de acción: es la que más tira del resultado general hacia abajo.',
      confianza: 'alta',
    })
  }
  if (Math.abs(deltaPart) >= UMBRAL_CAMBIO) {
    hallazgos.push({
      id: 'participacion',
      tipo: deltaPart > 0 ? 'mejora' : 'riesgo',
      titulo: deltaPart > 0 ? 'Sube la participación' : 'Baja la participación',
      cuerpo:
        deltaPart > 0
          ? 'Más personas respondieron que en la medición anterior: las cifras de esta base son más representativas.'
          : 'Respondieron menos personas que en la medición anterior: parte del cambio puede deberse a quién dejó de responder.',
      evidencia: `Participación: ${formatPercent(tPrevia.participacion)} en ${previa.shortLabel} → ${formatPercent(tBase.participacion)} en ${base.shortLabel}`,
      impacto: deltaPart > 0 ? 'Mayor confianza en las lecturas por grupo.' : 'Leer los cambios por sección con cautela.',
      confianza: 'alta',
    })
  }
  if (!esEnps && tBase.nps !== null && tPrevia.nps !== null && Math.abs(tBase.nps - tPrevia.nps) >= 5) {
    const deltaNps = tBase.nps - tPrevia.nps
    hallazgos.push({
      id: 'enps',
      tipo: deltaNps > 0 ? 'mejora' : 'riesgo',
      titulo: deltaNps > 0 ? 'Mejora la recomendación' : 'Cae la recomendación',
      cuerpo: 'El eNPS se mueve más rápido que la favorabilidad: suele anticipar hacia dónde irá el clima en la siguiente medición.',
      evidencia: `eNPS: ${pts(tPrevia.nps)} en ${previa.shortLabel} → ${pts(tBase.nps)} en ${base.shortLabel} (${pts(deltaNps)})`,
      impacto: deltaNps > 0 ? 'Buen momento para pedir referidos internos.' : 'Revisar la pregunta de profundidad del eNPS para entender a los detractores.',
      confianza: 'media',
    })
  }
  return { resumen, hallazgos, proyeccion, pendiente, metrica }
}
