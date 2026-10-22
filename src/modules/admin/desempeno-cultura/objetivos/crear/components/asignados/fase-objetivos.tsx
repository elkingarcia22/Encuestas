import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { InformationCircleIcon, PlusSignIcon } from '@hugeicons/core-free-icons'
import { Alert, AlertAction, AlertDescription, Button } from '@ubits/flux-ui'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { TOTAL_WEIGHT, type ObjectiveSet } from '../../../modelo/constructor/cicloBuilderTypes'

// Fase 2 de la asignación, la columna derecha de la ventana: el objetivo elegido en la lista de la izquierda, abierto con
// su formulario de siempre (21-oct, Elkin). Agregar y el peso viven en esa lista (indice-objetivos);
// aquí quedan los avisos del cupo (recortado o con carga previa), el vacío y la tarjeta.

export function FaseObjetivos({
  set,
  cupo,
  onRecuperar,
  aviso,
  iaAbierta,
  onAgregar,
  children,
}: {
  set: ObjectiveSet
  cupo: number
  /** El cupo se recortó por otra asignación que ya no se cruza: se puede devolver. */
  onRecuperar?: () => void
  aviso: ReactNode
  iaAbierta: boolean
  onAgregar: () => void
  children: ReactNode
}) {
  const vacio = set.objectives.length === 0

  return (
    <section className="flex flex-col gap-4" aria-label="Objetivo elegido">
      {onRecuperar && !iaAbierta ? (
        <Alert variant="info">
          <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
          <AlertDescription>
            <p>
              Esta asignación reparte solo <strong>{cupo} %</strong>, pero ya nadie más se cruza con ella.
            </p>
          </AlertDescription>
          <AlertAction>
            <Button variant="outline" size="sm" onClick={onRecuperar}>
              Recuperar el {TOTAL_WEIGHT} %
            </Button>
          </AlertAction>
        </Alert>
      ) : null}
      {iaAbierta ? null : aviso}

      {vacio && iaAbierta ? (
        // Mismo vacío que el paso «Objetivos de la empresa»: la pieza del sistema con su ilustración glass.
        <PrimeraVez
          icono="glass-message"
          titulo="Creando objetivos con IA"
          descripcion="Dile a Orbit, en el panel derecho, qué necesitas medir. Los objetivos que genere aparecerán en la lista para que los revises."
          className="py-8 border"
        />
      ) : vacio ? (
        <PrimeraVez
          icono="glass-add"
          titulo="Todavía no hay objetivos"
          descripcion="Escribe el primero."
          accion={{ texto: 'Agregar objetivo', icono: PlusSignIcon, onClick: onAgregar }}
          className="py-8 border-dashed"
        />
      ) : (
        children
      )}
    </section>
  )
}
