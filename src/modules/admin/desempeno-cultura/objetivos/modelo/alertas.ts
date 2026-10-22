import { avanceEsperado, diasParaCierre, diasParaInicio, formatoAvance, type Ciclo } from './ciclos'

// Lo que hay que atender en los ciclos en curso, como los riesgos de Encuestas: cada caso dice qué pasa, en qué ciclo,
// con qué prioridad y cuál es la acción que lo resuelve de una vez. Sale de los datos, así que un ciclo que se arregla
// deja de aparecer solo.

export type Prioridad = 'alta' | 'media' | 'baja'
export type TipoAlerta = 'avanceBajo' | 'sinReportar' | 'borrador' | 'cierraPronto'

/** Lo que resuelve el caso de una vez: recordar a las personas, terminar el borrador o abrir los resultados. */
export type AccionAlerta = 'recordar' | 'editar' | 'resultados'

export interface AlertaCiclo {
  id: string
  tipo: TipoAlerta
  prioridad: Prioridad
  ciclo: Ciclo
  titulo: string
  resumen: string
  /** A cuántas personas les llega el recordatorio (0 si el caso no se resuelve recordando). */
  personas: number
  accion: AccionAlerta
  /** Los datos que explican el caso, para el detalle. */
  datos: readonly { etiqueta: string; valor: string }[]
  /** Cómo se resuelve, en una frase, para el detalle. */
  comoResolver: string
}

/** Puntos por debajo del avance esperado a partir de los que un ciclo va atrasado. */
export const ATRASO_MEDIO = 15
export const ATRASO_ALTO = 25
/** Días al cierre en que un atraso pasa a prioridad alta. */
export const CIERRE_CERCANO = 14
/** Por debajo de esta parte de personas reportando, se avisa. */
export const META_REPORTE = 90
/** Días al cierre en que un ciclo que va bien pasa a ser algo por cerrar. */
export const CIERRE_PRONTO = 7

const ORDEN: Record<Prioridad, number> = { alta: 0, media: 1, baja: 2 }

const dias = (n: number) => `${n} ${n === 1 ? 'día' : 'días'}`

export function alertasDe(ciclos: readonly Ciclo[], hoy?: Date): readonly AlertaCiclo[] {
  const alertas: AlertaCiclo[] = []
  for (const ciclo of ciclos) {
    if (ciclo.estado === 'Borrador') {
      const inicia = diasParaInicio(ciclo, hoy)
      alertas.push({
        id: `${ciclo.id}-borrador`,
        tipo: 'borrador',
        prioridad: 'baja',
        ciclo,
        titulo: 'Borrador por terminar',
        resumen: `Faltan las personas del ciclo. Debería iniciar en ${dias(inicia)}.`,
        personas: 0,
        accion: 'editar',
        datos: [
          { etiqueta: 'Estado', valor: 'Borrador' },
          { etiqueta: 'Inicia', valor: `${ciclo.inicio} (en ${dias(inicia)})` },
          { etiqueta: 'Objetivos definidos', valor: String(ciclo.objetivos) },
          { etiqueta: 'Personas en el ciclo', valor: ciclo.personas > 0 ? String(ciclo.personas) : 'Sin definir' },
        ],
        comoResolver: 'Termina el borrador: define quién participa y publícalo antes de la fecha de inicio.',
      })
      continue
    }
    if (ciclo.estado !== 'En curso') continue
    const esperado = avanceEsperado(ciclo, hoy)
    const atraso = esperado - ciclo.avance
    const faltan = diasParaCierre(ciclo, hoy)
    const sinReportar = Math.round((ciclo.personas * (100 - ciclo.reportando)) / 100)
    const conAtraso = atraso >= ATRASO_MEDIO
    const conSilencio = ciclo.reportando < META_REPORTE && sinReportar > 0

    if (conAtraso) {
      const alta = atraso >= ATRASO_ALTO && faltan <= CIERRE_CERCANO
      alertas.push({
        id: `${ciclo.id}-avance`,
        tipo: 'avanceBajo',
        prioridad: alta ? 'alta' : 'media',
        ciclo,
        titulo: alta ? 'Avance bajo a días del cierre' : 'Avance por debajo de lo esperado',
        resumen: `Va en ${formatoAvance(ciclo.avance)} y a esta altura debería ir en ${esperado}%. Cierra en ${dias(faltan)}.`,
        personas: ciclo.personas,
        accion: 'recordar',
        datos: [
          { etiqueta: 'Avance actual', valor: formatoAvance(ciclo.avance) },
          { etiqueta: 'Avance esperado hoy', valor: `${esperado}%` },
          { etiqueta: 'Cierra', valor: `${ciclo.cierre} (en ${dias(faltan)})` },
          { etiqueta: 'Personas en el ciclo', valor: String(ciclo.personas) },
        ],
        comoResolver: 'Recuérdales a las personas del ciclo que reporten su avance; si el atraso es real, mira los resultados para ver dónde está.',
      })
    }
    if (conSilencio) {
      alertas.push({
        id: `${ciclo.id}-reporte`,
        tipo: 'sinReportar',
        prioridad: 'media',
        ciclo,
        titulo: `${sinReportar} ${sinReportar === 1 ? 'persona no ha' : 'personas no han'} reportado avance`,
        resumen: `Reporta el ${ciclo.reportando} % de las personas del ciclo; la meta es el ${META_REPORTE} %.`,
        personas: sinReportar,
        accion: 'recordar',
        datos: [
          { etiqueta: 'Reportando', valor: `${ciclo.reportando}%` },
          { etiqueta: 'Meta', valor: `${META_REPORTE}%` },
          { etiqueta: 'Sin reportar', valor: String(sinReportar) },
          { etiqueta: 'Cierra', valor: `${ciclo.cierre} (en ${dias(faltan)})` },
        ],
        comoResolver: 'Un recordatorio llega solo a quienes todavía no han reportado.',
      })
    }
    // Un ciclo que va bien y cierra pronto no es urgente, pero alguien tiene que cerrarlo.
    if (!conAtraso && !conSilencio && faltan <= CIERRE_PRONTO) {
      alertas.push({
        id: `${ciclo.id}-cierre`,
        tipo: 'cierraPronto',
        prioridad: 'baja',
        ciclo,
        titulo: `Cierra en ${dias(faltan)}`,
        resumen: `Va en ${formatoAvance(ciclo.avance)} y ${ciclo.cumplidos}% de los objetivos ya llegó a su meta. Revisa los resultados antes de finalizarlo.`,
        personas: 0,
        accion: 'resultados',
        datos: [
          { etiqueta: 'Cierra', valor: `${ciclo.cierre} (en ${dias(faltan)})` },
          { etiqueta: 'Avance', valor: formatoAvance(ciclo.avance) },
          { etiqueta: 'Objetivos cumplidos', valor: `${ciclo.cumplidos}%` },
          { etiqueta: 'Reportando', valor: `${ciclo.reportando}%` },
        ],
        comoResolver: 'Revisa los resultados y finaliza el ciclo cuando estés conforme.',
      })
    }
  }
  // Alta primero y, dentro de cada prioridad, el que cierra antes (el borrador, el que inicia antes).
  const plazo = (alerta: AlertaCiclo) => (alerta.tipo === 'borrador' ? diasParaInicio(alerta.ciclo, hoy) : diasParaCierre(alerta.ciclo, hoy))
  return alertas.sort((a, b) => ORDEN[a.prioridad] - ORDEN[b.prioridad] || plazo(a) - plazo(b))
}

/** El texto del botón que resuelve el caso de una vez. */
export const etiquetaAccion = (alerta: Pick<AlertaCiclo, 'accion' | 'personas'>): string =>
  alerta.accion === 'recordar' ? `Recordar a ${alerta.personas}` : alerta.accion === 'editar' ? 'Terminar borrador' : 'Ver resultados'
