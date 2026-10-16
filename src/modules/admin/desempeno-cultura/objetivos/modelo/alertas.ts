import { avanceEsperado, diasParaCierre, type Ciclo } from './ciclos'

// Lo que hay que atender en los ciclos en curso, como los riesgos de Encuestas: cada caso dice qué pasa, en qué ciclo,
// con qué prioridad y cuál es la acción que lo resuelve de una vez. Sale de los datos, así que un ciclo que se arregla
// deja de aparecer solo.

export type Prioridad = 'alta' | 'media'
export type TipoAlerta = 'avanceBajo' | 'sinReportar'

export interface AlertaCiclo {
  id: string
  tipo: TipoAlerta
  prioridad: Prioridad
  ciclo: Ciclo
  titulo: string
  resumen: string
  /** A cuántas personas les llega el recordatorio. */
  personas: number
}

/** Puntos por debajo del avance esperado a partir de los que un ciclo va atrasado. */
export const ATRASO_MEDIO = 15
export const ATRASO_ALTO = 25
/** Días al cierre en que un atraso pasa a prioridad alta. */
export const CIERRE_CERCANO = 14
/** Por debajo de esta parte de personas reportando, se avisa. */
export const META_REPORTE = 90

const ORDEN: Record<Prioridad, number> = { alta: 0, media: 1 }

export function alertasDe(ciclos: readonly Ciclo[], hoy?: Date): readonly AlertaCiclo[] {
  const alertas: AlertaCiclo[] = []
  for (const ciclo of ciclos) {
    if (ciclo.estado !== 'En curso') continue
    const esperado = avanceEsperado(ciclo, hoy)
    const atraso = esperado - ciclo.avance
    const dias = diasParaCierre(ciclo, hoy)
    const sinReportar = Math.round((ciclo.personas * (100 - ciclo.reportando)) / 100)

    if (atraso >= ATRASO_MEDIO) {
      const alta = atraso >= ATRASO_ALTO && dias <= CIERRE_CERCANO
      alertas.push({
        id: `${ciclo.id}-avance`,
        tipo: 'avanceBajo',
        prioridad: alta ? 'alta' : 'media',
        ciclo,
        titulo: alta ? 'Avance bajo a días del cierre' : 'Avance por debajo de lo esperado',
        resumen: `Va en ${Math.round(ciclo.avance)}% y a esta altura debería ir en ${esperado}%. Cierra en ${dias} ${dias === 1 ? 'día' : 'días'}.`,
        personas: ciclo.personas,
      })
    }
    if (ciclo.reportando < META_REPORTE && sinReportar > 0) {
      alertas.push({
        id: `${ciclo.id}-reporte`,
        tipo: 'sinReportar',
        prioridad: 'media',
        ciclo,
        titulo: `${sinReportar} ${sinReportar === 1 ? 'persona no ha' : 'personas no han'} reportado avance`,
        resumen: `Reporta el ${ciclo.reportando}% de las personas del ciclo; la meta es el ${META_REPORTE}%.`,
        personas: sinReportar,
      })
    }
  }
  // Alta primero y, dentro de cada prioridad, el que cierra antes.
  return alertas.sort((a, b) => ORDEN[a.prioridad] - ORDEN[b.prioridad] || diasParaCierre(a.ciclo, hoy) - diasParaCierre(b.ciclo, hoy))
}

/** Los ciclos distintos que tienen al menos un caso: lo que filtra «Ver en la lista». */
export const ciclosConAlerta = (alertas: readonly AlertaCiclo[]): ReadonlySet<string> => new Set(alertas.map((alerta) => alerta.ciclo.id))
