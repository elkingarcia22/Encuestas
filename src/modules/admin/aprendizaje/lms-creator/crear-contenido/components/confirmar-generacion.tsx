import type { ReactNode } from 'react'
import { Button } from '@ubits/flux-ui'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { BotonIa } from '@/shared/components/BotonIa'

// Confirmar una generación con IA («Generar video», «Generar presentación»): la única ventana del sistema, ActionDialog
// en su tamaño corto (decisión 4 de la auditoría, 5-oct; antes era un AlertDialog armado aparte), con la acción en el
// primario de IA (BotonIa) en lugar del azul, porque lo que lanza es una generación con IA. Va al final del pie.

type Props = {
  abierto: boolean
  onAbiertoChange: (abierto: boolean) => void
  titulo: string
  descripcion: string
  /** El texto del botón; puede llevar el costo (TokenCost). */
  accion: ReactNode
  onConfirmar: () => void
}

export function ConfirmarGeneracion({ abierto, onAbiertoChange, titulo, descripcion, accion, onConfirmar }: Props) {
  return (
    <ActionDialog
      open={abierto}
      onOpenChange={onAbiertoChange}
      size="sm"
      title={titulo}
      sub={descripcion}
      // Como la alerta de antes: un clic afuera no la cierra, hay que elegir.
      dismissible={false}
      footer={
        <>
          <Button variant="outline" onClick={() => onAbiertoChange(false)}>
            Cancelar
          </Button>
          <BotonIa
            onClick={() => {
              onAbiertoChange(false)
              onConfirmar()
            }}
          >
            {accion}
          </BotonIa>
        </>
      }
    />
  )
}
