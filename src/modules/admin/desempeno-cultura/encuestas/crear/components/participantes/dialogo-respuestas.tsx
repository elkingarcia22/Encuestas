import { UserRemove01Icon } from '@hugeicons/core-free-icons'
import { DialogoConfirmar } from '@/modules/design-system/estados/confirmaciones'
import type { Collaborator } from '../../../modelo/collaborators'
import { formatCount } from '../../../modelo/participants'

// Editar una encuesta que ya corre y quitar a alguien que ya respondió: se pregunta antes de sacarlo. Con la estructura de
// «¿Salir de la creación?» (Elkin, 14-oct): icono, título, descripción y dos botones. Se queda la salida segura: sale de la
// lista, pero lo que contestó sigue contando; ya no se ofrece quitar también sus respuestas.

export type DestinoRespuestas = 'conservar' | 'descartar'

const MUESTRA = 3

export function DialogoRespuestas({ afectados, onConfirmar, onCancelar }: { afectados: readonly Collaborator[] | null; onConfirmar: (destino: DestinoRespuestas) => void; onCancelar: () => void }) {
  const lista = afectados ?? []
  const una = lista.length === 1
  const nombres = lista.slice(0, MUESTRA).map((persona) => `«${persona.name}»`).join(', ')
  const resto = lista.length - Math.min(lista.length, MUESTRA)

  return (
    <DialogoConfirmar
      abierto={afectados !== null}
      onAbiertoChange={(abierto) => (abierto ? undefined : onCancelar())}
      icono={UserRemove01Icon}
      titulo={una ? '¿Quitar a quien ya respondió?' : '¿Quitar a quienes ya respondieron?'}
      descripcion={
        una
          ? `${nombres} sale de la lista de participantes. Lo que ya contestó se conserva y sigue contando en los resultados y en la participación.`
          : `${nombres}${resto > 0 ? ` y ${formatCount(resto)} más` : ''} salen de la lista de participantes. Lo que ya contestaron se conserva y sigue contando en los resultados y en la participación.`
      }
      cancelar="Volver"
      accion={una ? 'Quitar participante' : 'Quitar participantes'}
      onConfirmar={() => onConfirmar('conservar')}
    />
  )
}
