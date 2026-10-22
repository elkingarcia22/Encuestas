import { useState } from 'react'
import { Button, Field, FieldDescription, FieldLabel, Textarea } from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { DrawerShell } from './drawer-shell'
import { usePanelActual } from './panel-actual'
import { WS } from './drawer-styles'

type Props = { open: boolean; onOpenChange: (open: boolean) => void }

// «Cancelar» llama a lo mismo que la X: `cerrarPanel` es el cierre del panel, que pregunta si hay cambios
// (13-oct: un «Cancelar» que cerrara directo se saltaba la pregunta).
function BotonCancelar() {
  const panel = usePanelActual()
  return (
    <Button variant="outline" className={WS} onClick={() => panel?.cerrarPanel()}>
      Cancelar
    </Button>
  )
}

// Caso: un panel con algo escrito (conCambios, regla «panel-con-datos»). Una nota corta, no un formulario de creación:
// escribe algo y prueba cerrar con la X, con «Cancelar», con Escape o tocando fuera. Sin texto cierra directo; con texto
// no se cierra al tocar fuera y pregunta «Seguir editando · Descartar» dentro del mismo panel.
export function NotesDrawer({ open, onOpenChange }: Props) {
  const [nota, setNota] = useState('')

  const cambiar = (abrir: boolean) => {
    if (!abrir) setNota('')
    onOpenChange(abrir)
  }

  return (
    <DrawerShell
      open={open}
      onOpenChange={cambiar}
      size="md"
      conCambios={nota.trim().length > 0}
      title="Nota para el candidato"
      description="Se guarda en su ficha y la ve todo el equipo de la vacante."
      footer={
        <>
          <BotonCancelar />
          <Button
            className={WS}
            disabled={!nota.trim()}
            onClick={() => {
              cambiar(false)
              notify('Nota guardada', 'Ya está en la ficha de Laura Méndez.', 'success')
            }}
          >
            Guardar nota
          </Button>
        </>
      }
    >
      <Field>
        <FieldLabel htmlFor="nota-candidato">Nota</FieldLabel>
        <Textarea
          id="nota-candidato"
          rows={6}
          value={nota}
          onChange={(evento) => setNota(evento.target.value)}
          placeholder="Qué viste en la entrevista, qué falta confirmar…"
        />
        <FieldDescription>Escribe algo y cierra el panel para ver la pregunta de descartar.</FieldDescription>
      </Field>
    </DrawerShell>
  )
}
