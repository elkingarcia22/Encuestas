import type { SurveyInsight } from '../../../encuestas/modelo/surveyInsights'
import { formatoAvance } from '../ciclos'
import { CORTES, type Corte } from './lecturas'
import { MEDIDAS } from './personas'
import type { Medida, PersonaSeguida, ResultadosCiclo } from './seguimiento'

// El análisis con IA de un ciclo (portado de «cicloInsights» del prototipo, 9-oct). No hay modelo detrás: cada lectura se
// arma con reglas sobre las cifras del ciclo, y viaja con la cifra que la sostiene para poder contradecirla en las demás
// pestañas. Tiene la forma de las lecturas de Encuestas (hallazgo, riesgo o qué hacer, con su evidencia y su
// confiabilidad) para usar las mismas piezas.

export type Lectura = SurveyInsight

/** Debajo de cinco personas un grupo no se compara: la brecha sería la de una o dos personas. */
export const MINIMO_CORTE = 5
const BRECHA_QUE_CONTAR = 5

const pct = (parte: number, total: number) => (total > 0 ? Math.round((parte / total) * 100) : 0)
const plural = (n: number, uno: string, varios: string) => `${n.toLocaleString('es-CO')} ${n === 1 ? uno : varios}`
/** Qué tan firme es una lectura según cuántas personas la sostienen. */
const confianza = (personas: number): Lectura['confidence'] => (personas >= 20 ? 'high' : personas >= 8 ? 'medium' : 'low')

const promedio = (personas: readonly PersonaSeguida[]) => {
  const con = personas.filter((persona) => persona.avance !== null)
  return con.length ? Math.round((con.reduce((s, p) => s + (p.avance ?? 0), 0) / con.length) * 10) / 10 : 0
}

export interface BrechaCorte {
  corte: Corte
  etiqueta: string
  bajo: { grupo: string; avance: number; personas: number }
  alto: { grupo: string; avance: number; personas: number }
  brecha: number
}

/** Por cada corte, el grupo más bajo y el más alto entre los que tienen al menos cinco personas. */
export function brechas(r: ResultadosCiclo): BrechaCorte[] {
  return CORTES.flatMap(({ value: corte, label }) => {
    const grupos = new Map<string, PersonaSeguida[]>()
    for (const persona of r.personas) {
      const clave = persona.colaborador[corte] ?? 'Sin líder'
      grupos.set(clave, [...(grupos.get(clave) ?? []), persona])
    }
    const comparables = [...grupos.entries()]
      .filter(([, personas]) => personas.length >= MINIMO_CORTE)
      .map(([grupo, personas]) => ({ grupo, avance: promedio(personas), personas: personas.length }))
      .sort((a, b) => a.avance - b.avance)
    if (comparables.length < 2) return []
    const bajo = comparables[0]
    const alto = comparables[comparables.length - 1]
    return [{ corte, etiqueta: label, bajo, alto, brecha: Math.round((alto.avance - bajo.avance) * 10) / 10 }]
  }).sort((a, b) => b.brecha - a.brecha)
}

export function analizar(r: ResultadosCiclo): { resumen: string; lecturas: Lectura[]; brechas: BrechaCorte[] } {
  const personas = r.personas.length
  const entradas = r.personas.flatMap((persona) => persona.objetivos.map((objetivo) => ({ persona, objetivo })))
  const conAvance = entradas.filter((e) => e.objetivo.cumplimiento !== null)
  const lecturas: Lectura[] = []
  const agregar = (lectura: Omit<Lectura, 'id'>) => lecturas.push({ ...lectura, id: `l-${lecturas.length}` })

  // Hallazgos: qué pasó.
  if (conAvance.length) {
    agregar({
      kind: 'finding',
      title: `${pct(r.enMeta, r.objetivos)} % de los objetivos ya llegó a su meta`,
      body: r.abierto ? 'Es lo que ya está asegurado. Lo demás depende del ritmo de aquí al cierre.' : 'Es la lectura final del ciclo: lo que llegó y lo que se quedó en el camino.',
      evidence: `${plural(r.enMeta, 'objetivo', 'objetivos')} con cumplimiento de 100 % o más, de ${plural(r.objetivos, 'objetivo', 'objetivos')} del ciclo.`,
      confidence: confianza(personas),
    })
  }
  if (r.abierto) {
    const diferencia = Math.round(r.avanceGeneral - r.calendario)
    agregar({
      kind: diferencia >= 0 ? 'finding' : 'risk',
      title: diferencia >= 0 ? `El avance va ${diferencia} puntos por delante del calendario` : `El avance va ${-diferencia} puntos por detrás del calendario`,
      body: diferencia >= 0 ? 'Al ritmo de hoy el ciclo llega a su meta antes del cierre.' : `Para cerrar en meta, lo que falta tiene que moverse más rápido en los ${plural(r.diasRestantes, 'día', 'días')} que quedan.`,
      evidence: `Avance general ${formatoAvance(r.avanceGeneral)} frente a ${r.calendario} % del calendario corrido.`,
      confidence: confianza(r.reportaron),
    })
  }
  const porMedida = new Map<Medida, number>()
  for (const { objetivo } of entradas) porMedida.set(objetivo.medida, (porMedida.get(objetivo.medida) ?? 0) + 1)
  const [medida, cuantos] = [...porMedida.entries()].sort((a, b) => b[1] - a[1])[0] ?? []
  if (medida && pct(cuantos ?? 0, entradas.length) >= 40) {
    agregar({
      kind: 'finding',
      title: `El ciclo se mide sobre todo con ${MEDIDAS[medida].toLowerCase()}`,
      body: 'Cuando casi todo se mide igual, el ciclo pierde lo que las otras medidas cuentan: un hito dice si algo se hizo, un número dice cuánto.',
      evidence: `${pct(cuantos ?? 0, entradas.length)} % de los objetivos se mide con ${MEDIDAS[medida].toLowerCase()}.`,
      confidence: 'high',
    })
  }
  const alineados = entradas.filter((e) => e.objetivo.empresa !== null).length
  agregar({
    kind: 'finding',
    title: `${pct(alineados, entradas.length)} % de los objetivos empuja un objetivo de empresa`,
    body: pct(alineados, entradas.length) >= 70 ? 'La mayor parte del esfuerzo del ciclo va hacia la estrategia.' : 'Una parte grande del esfuerzo no se sabe a qué objetivo de empresa ayuda.',
    evidence: `${plural(alineados, 'objetivo alineado', 'objetivos alineados')} de ${entradas.length.toLocaleString('es-CO')}.`,
    confidence: 'high',
  })

  // Riesgos: qué está en juego.
  const alto = r.personas.filter((persona) => persona.riesgo === 'alto').length
  if (r.abierto && alto > 0) {
    agregar({
      kind: 'risk',
      title: `${plural(alto, 'persona está', 'personas están')} en riesgo alto de no cumplir`,
      body: 'Van 25 puntos o más por detrás del calendario. Sin una conversación con su líder, es poco probable que lleguen.',
      evidence: `${pct(alto, personas)} % de las personas del ciclo con una brecha de 25 puntos o más frente al calendario.`,
      confidence: confianza(alto),
    })
  }
  const sinReporte = r.personas.filter((persona) => persona.avance === null).length
  if (sinReporte > 0) {
    agregar({
      kind: 'risk',
      title: `${plural(sinReporte, 'persona no ha', 'personas no han')} reportado ningún avance`,
      body: 'Sin reportes el avance del ciclo se calcula sobre menos gente de la que lo lleva, y la cifra se ve mejor de lo que es.',
      evidence: `${pct(sinReporte, personas)} % de las personas sin ningún objetivo con avance.`,
      confidence: confianza(personas),
    })
  }
  const pasados = conAvance.filter((e) => (e.objetivo.cumplimiento ?? 0) > 125).length
  if (pct(pasados, conAvance.length) >= 10) {
    agregar({
      kind: 'risk',
      title: `${pct(pasados, conAvance.length)} % de los objetivos pasó del 125 % de su meta`,
      body: 'Sobrecumplir tanto suele decir que la meta quedó corta. Conviene revisarla antes del próximo ciclo.',
      evidence: `${plural(pasados, 'objetivo', 'objetivos')} por encima de 125 % de cumplimiento.`,
      confidence: confianza(pasados),
    })
  }
  const lista = brechas(r)
  const mayor = lista[0]
  if (mayor && mayor.brecha >= BRECHA_QUE_CONTAR) {
    agregar({
      kind: 'risk',
      title: `${mayor.brecha.toLocaleString('es-CO')} puntos separan a ${mayor.bajo.grupo} de ${mayor.alto.grupo}`,
      body: `El promedio del ciclo esconde que, por ${mayor.etiqueta.toLowerCase()}, unos van mucho más atrás que otros.`,
      evidence: `${mayor.bajo.grupo} ${formatoAvance(mayor.bajo.avance)} (${mayor.bajo.personas} personas) frente a ${mayor.alto.grupo} ${formatoAvance(mayor.alto.avance)} (${mayor.alto.personas} personas).`,
      confidence: confianza(Math.min(mayor.bajo.personas, mayor.alto.personas) * 2),
    })
  }

  // Qué hacer: por dónde empezar.
  const bloqueados = entradas.filter((e) => e.objetivo.etapa !== 'aprobado').length
  if (bloqueados > 0) {
    agregar({
      kind: 'recommendation',
      title: `Desbloquear ${plural(bloqueados, 'objetivo', 'objetivos')} antes de mirar cualquier otra cifra`,
      body: 'Un objetivo por aprobar o devuelto no cuenta en el avance. Mientras sigan así, todas las cifras del ciclo se leen incompletas.',
      evidence: `${plural(entradas.filter((e) => e.objetivo.etapa === 'por-aprobar').length, 'por aprobar', 'por aprobar')} y ${plural(entradas.filter((e) => e.objetivo.etapa === 'por-ajustar').length, 'devuelto', 'devueltos')}.`,
      confidence: 'high',
    })
  }
  const mudos = conAvance.filter((e) => e.objetivo.comentarios === 0).length
  if (mudos > 0) {
    agregar({
      kind: 'recommendation',
      title: `Pedir una línea de contexto en los ${mudos.toLocaleString('es-CO')} objetivos que avanzan sin conversación`,
      body: 'Un avance sin comentario dice cuánto, pero no por qué. Una línea del colaborador o de su líder basta para leerlo.',
      evidence: `${pct(mudos, conAvance.length)} % de los objetivos con avance no tiene ningún comentario.`,
      confidence: confianza(mudos),
    })
  }
  if (mayor && mayor.brecha >= BRECHA_QUE_CONTAR) {
    agregar({
      kind: 'recommendation',
      title: `Abrir la conversación por ${mayor.etiqueta.toLowerCase()}, no por el promedio del ciclo`,
      body: `Empezar por ${mayor.bajo.grupo}: es donde el ciclo se está quedando, y una conversación ahí mueve más que un recordatorio general.`,
      evidence: `${mayor.bajo.grupo} va ${mayor.brecha.toLocaleString('es-CO')} puntos por detrás de ${mayor.alto.grupo}.`,
      confidence: confianza(mayor.bajo.personas * 2),
    })
  }
  if (r.abierto && alto > 0) {
    agregar({
      kind: 'recommendation',
      title: 'Recordar actualizar el avance a quienes van en riesgo alto',
      body: 'Antes de concluir que no van a llegar, conviene saber si es que no han reportado lo que ya hicieron.',
      evidence: `${plural(alto, 'persona', 'personas')} en riesgo alto. El recordatorio sale desde la pestaña Colaboradores.`,
      confidence: 'medium',
    })
  }

  const resumen = [
    `${r.ciclo.nombre} ${r.abierto ? 'va' : 'cerró'} en ${formatoAvance(r.avanceGeneral)} de avance general, con ${pct(r.enMeta, r.objetivos)} % de los objetivos en meta.`,
    r.abierto ? (r.avanceGeneral >= r.calendario ? 'El ritmo alcanza para llegar al cierre.' : `El ritmo va por detrás del calendario (${r.calendario} % corrido).`) : '',
    mayor && mayor.brecha >= BRECHA_QUE_CONTAR ? `La mayor diferencia está por ${mayor.etiqueta.toLowerCase()}: ${mayor.bajo.grupo} es el grupo más rezagado.` : 'No hay brechas grandes entre grupos.',
    bloqueados > 0 ? `Hay ${plural(bloqueados, 'objetivo', 'objetivos')} sin aprobar que todavía no cuentan.` : '',
  ]
    .filter(Boolean)
    .join(' ')

  return { resumen, lecturas, brechas: lista }
}
