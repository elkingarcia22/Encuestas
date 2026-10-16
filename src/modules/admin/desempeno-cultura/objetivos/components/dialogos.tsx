import { CheckmarkCircle02Icon, Delete02Icon } from '@hugeicons/core-free-icons'
import { DialogoConfirmar } from '@/modules/design-system/estados/confirmaciones'
import type { Ciclo } from '../modelo/ciclos'

// Las dos confirmaciones de la lista de ciclos, con la misma pieza que las de Encuestas. Finalizar cierra el reporte de
// avance; eliminar borra el ciclo con sus objetivos y su historial de avance.

export function DialogoFinalizar({ ciclo, onCerrar, onConfirmar }: { ciclo: Ciclo | null; onCerrar: () => void; onConfirmar: (ciclo: Ciclo) => void }) {
  return (
    <DialogoConfirmar
      abierto={ciclo !== null}
      onAbiertoChange={(abierto) => (abierto ? undefined : onCerrar())}
      icono={CheckmarkCircle02Icon}
      titulo="¿Finalizar este ciclo?"
      descripcion={`${ciclo?.nombre ?? ''} dejará de recibir reportes de avance desde hoy. El avance queda como está y podrás consultarlo.`}
      accion="Finalizar ciclo"
      onConfirmar={() => ciclo && onConfirmar(ciclo)}
    />
  )
}

export function DialogoEliminar({ ciclos, onCerrar, onConfirmar }: { ciclos: readonly Ciclo[]; onCerrar: () => void; onConfirmar: (ciclos: readonly Ciclo[]) => void }) {
  const uno = ciclos.length === 1 ? ciclos[0] : null
  return (
    <DialogoConfirmar
      abierto={ciclos.length > 0}
      onAbiertoChange={(abierto) => (abierto ? undefined : onCerrar())}
      icono={Delete02Icon}
      titulo={uno ? '¿Eliminar este ciclo?' : `¿Eliminar ${ciclos.length} ciclos?`}
      descripcion={
        uno
          ? `${uno.nombre}, sus objetivos y su historial de avance se eliminarán definitivamente. Esta acción no se puede deshacer.`
          : 'Los ciclos seleccionados, sus objetivos y su historial de avance se eliminarán definitivamente. Esta acción no se puede deshacer.'
      }
      accion="Eliminar"
      destructiva
      onConfirmar={() => onConfirmar(ciclos)}
    />
  )
}
