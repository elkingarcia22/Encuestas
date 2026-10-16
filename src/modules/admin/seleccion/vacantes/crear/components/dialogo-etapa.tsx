import { useEffect, useState } from 'react'
import { Field, FieldLabel, Input } from '@ubits/flux-ui'
import { VentanaDeAccion } from '@/modules/design-system/drawers/components/drawer-anidado'
import { CATEGORIAS, type EtapaCatalogo } from './etapas'
import { CampoSelect } from './piezas-ia'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Con una etapa, el diálogo edita su nombre y categoría; sin ella, crea una nueva.
  etapa?: EtapaCatalogo | null
  onGuardar: (nombre: string, categoria: string) => void
}

// Etapa que se inventa el equipo (una entrevista con alguien concreto, una revisión interna…).
// Siempre es manual: la lleva una persona, no la IA. El mismo diálogo sirve para crearla y, ya
// creada, para cambiarle el nombre o la categoría. Va en la ventana del design system (`ActionDialog`, 1 oct).
export function DialogoEtapa({ open, onOpenChange, etapa, onGuardar }: Props) {
  const [nombre, setNombre] = useState('')
  const [categoria, setCategoria] = useState('')
  const editando = etapa != null

  // Al abrir, arranca con lo que ya tenía la etapa (editar) o en blanco (crear).
  useEffect(() => {
    if (!open) return
    setNombre(etapa?.nombre ?? '')
    setCategoria(etapa?.categoria ?? '')
  }, [open, etapa])

  return (
    <VentanaDeAccion
      open={open}
      onOpenChange={onOpenChange}
      title={editando ? 'Editar etapa' : 'Crear etapa'}
      sub={
        editando
          ? 'Los cambios se ven en la biblioteca; si ya la agregaste a otra vacante, esa no cambia.'
          : 'Las etapas propias son pasos manuales del proceso: se agregan al flujo de una vez y quedan en la biblioteca para usarlas en otras vacantes.'
      }
      confirmLabel={editando ? 'Guardar cambios' : 'Crear etapa'}
      confirmDisabled={!nombre.trim() || !categoria}
      onConfirm={() => onGuardar(nombre.trim(), categoria)}
    >
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="etapa-nombre">Nombre de la etapa</FieldLabel>
            <Input
              id="etapa-nombre"
              autoFocus
              value={nombre}
              placeholder="Ej: Entrevista con el equipo de datos"
              onChange={(evento) => setNombre(evento.target.value)}
            />
          </Field>
          <CampoSelect id="etapa-categoria" etiqueta="Categoría" opciones={CATEGORIAS} valor={categoria} onCambio={setCategoria} />
        </div>
    </VentanaDeAccion>
  )
}
