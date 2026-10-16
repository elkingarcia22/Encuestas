import { useState, type JSX } from 'react'
import { TOTAL_WEIGHT, totalWeight, type Objective } from '../../../modelo/constructor/cicloBuilderTypes'
import type { ObjectiveModelId, ObjectiveModelRules } from '../../../modelo/constructor/objectiveModel'
import type { ObjectiveScope } from '../../../modelo/constructor/objectiveBankTypes'
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
  alineables: (objetivo: Objective) => { empresa: readonly Objective[]; ciclo?: readonly Objective[] }
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
}: ListaObjetivosProps): JSX.Element {
  const [propia, setPropia] = useState<string | null>(null)
  const controlada = abierta !== undefined
  const actual = controlada ? abierta : propia
  const abrir = (id: string | null) => {
    if (!controlada) setPropia(id)
    onAbierta?.(id)
  }
  const total = totalWeight(objetivos)

  return (
    <div className="flex flex-col gap-3">
      {objetivos.map((objetivo, indice) => (
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
          conErrores={conErrores}
          alineables={alineables(objetivo)}
          alineacionRequerida={alineacionRequerida}
          cupo={cupo}
          pesoDeLosDemas={total - objetivo.weight}
          alcance={alcance}
          contextoIa={contextoIa}
          resaltada={resaltados?.has(objetivo.id) ?? false}
        />
      ))}
    </div>
  )
}
