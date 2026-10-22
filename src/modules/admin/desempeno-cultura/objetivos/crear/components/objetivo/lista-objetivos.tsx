import { useState, type JSX } from 'react'
import { TOTAL_WEIGHT, distributeWeights, totalWeight, type Objective } from '../../../modelo/constructor/cicloBuilderTypes'
import { rescaleObjectives } from '../../../modelo/constructor/objectiveSets'
import type { ArreglosPeso } from './campo-peso'
import type { ObjectiveModelId, ObjectiveModelRules } from '../../../modelo/constructor/objectiveModel'
import type { ObjectiveScope } from '../../../modelo/constructor/objectiveBankTypes'
import type { ObjetivoDelCiclo } from './campo-alineacion'
import { TarjetaObjetivo } from './tarjeta-objetivo'

// Una lista de tarjetas de objetivo con una sola abierta a la vez (como las preguntas en edición de encuestas). La
// abierta se controla desde fuera con `abierta` + `onAbierta` (p. ej. para abrir la recién creada) o, si no se pasa,
// la lleva la lista. La numeración sale de la posición. Lo que pesa «el resto del set» se calcula aquí para cada
// tarjeta, así el pie del peso dice cuánto queda por repartir.

export interface ListaObjetivosProps {
  objetivos: readonly Objective[]
  variante: 'empresa' | 'asignado'
  modelo: ObjectiveModelId | null
  reglas: ObjectiveModelRules
  conErrores: boolean
  /** A qué se puede alinear cada objetivo: los de la empresa y, en individuales, los demás del mismo set. */
  alineables: (objetivo: Objective) => { empresa: readonly Objective[]; ciclo?: readonly ObjetivoDelCiclo[] }
  alineacionRequerida: boolean
  /** Solo asignados: el cupo del set (100 o su weightShare). */
  cupo?: number
  alcance: ObjectiveScope
  onCambio: (id: string, cambio: Partial<Objective>) => void
  onEliminar: (id: string) => void
  /** La tarjeta abierta (id), controlada. Sin esto, la lista la lleva sola. */
  abierta?: string | null
  onAbierta?: (id: string | null) => void
  contextoIa?: { nombreCiclo: string }
  /** Propuestas de la IA todavía sin conservar: se marcan con anillo y «Propuesta de IA». */
  resaltados?: ReadonlySet<string>
  /** Solo la tarjeta abierta, fija y sin plegar: el detalle de la ventana de la asignación, con la lista de objetivos a su
   *  izquierda (21-oct). Los que ya se visitaron y quedaron incompletos (`revisados`) muestran sus errores al volver. */
  detalle?: { revisados: ReadonlySet<string> }
}

export function ListaObjetivos({
  objetivos,
  variante,
  modelo,
  reglas,
  conErrores,
  alineables,
  alineacionRequerida,
  cupo = TOTAL_WEIGHT,
  alcance,
  onCambio,
  onEliminar,
  abierta,
  onAbierta,
  contextoIa,
  resaltados,
  detalle,
}: ListaObjetivosProps): JSX.Element {
  const [propia, setPropia] = useState<string | null>(null)
  const controlada = abierta !== undefined
  const actual = controlada ? abierta : propia
  const abrir = (id: string | null) => {
    if (!controlada) setPropia(id)
    onAbierta?.(id)
  }
  const total = totalWeight(objetivos)
  // Los arreglos del peso que tocan a los demás (21-oct): cada objetivo se escribe por su cuenta con `onCambio`, que ya
  // aplica sobre lo más reciente, así que varios cambios seguidos no se pisan.
  const arreglosDe = (objetivo: Objective): ArreglosPeso => {
    const otros = objetivos.filter((otro) => otro.id !== objetivo.id)
    return {
      otros: otros.length,
      onAjustarDemas: () => rescaleObjectives(otros, cupo - objetivo.weight).forEach((otro) => onCambio(otro.id, { weight: otro.weight })),
      onIguales: () => {
        const partes = distributeWeights(objetivos.length, cupo)
        objetivos.forEach((uno, indice) => onCambio(uno.id, { weight: partes[indice] }))
      },
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {objetivos.map((objetivo, indice) => (detalle && actual !== objetivo.id ? null : (
        <TarjetaObjetivo
          key={objetivo.id}
          objetivo={objetivo}
          numero={indice + 1}
          variante={variante}
          modelo={modelo}
          reglas={reglas}
          abierta={actual === objetivo.id}
          onAbiertaChange={(abrirla) => abrir(abrirla ? objetivo.id : null)}
          onCambio={(cambio) => onCambio(objetivo.id, cambio)}
          onEliminar={() => {
            if (actual === objetivo.id) abrir(null)
            onEliminar(objetivo.id)
          }}
          conErrores={conErrores || (detalle?.revisados.has(objetivo.id) ?? false)}
          fija={detalle !== undefined}
          alineables={alineables(objetivo)}
          alineacionRequerida={alineacionRequerida}
          cupo={cupo}
          pesoDeLosDemas={total - objetivo.weight}
          arreglosPeso={arreglosDe(objetivo)}
          alcance={alcance}
          contextoIa={contextoIa}
          resaltada={resaltados?.has(objetivo.id) ?? false}
        />
      )))}
    </div>
  )
}
