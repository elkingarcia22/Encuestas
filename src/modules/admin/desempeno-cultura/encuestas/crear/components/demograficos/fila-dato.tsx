import { HugeiconsIcon } from '@hugeicons/react'
import { BookmarkAdd02Icon, Delete02Icon, LockIcon, PencilEdit02Icon } from '@hugeicons/core-free-icons'
import type { ReactElement, ReactNode } from 'react'
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle, Switch, Toggle } from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import type { DemographicField } from '../../../modelo/surveyBuilderTypes'
import { TextoCompleto } from '@/shared/components/TextoCompleto'
import { EnCurso } from '../aviso-en-curso'

// Una fila de dato demográfico: se activa con su interruptor, dice de dónde sale y, activo, deja
// elegir si permite edición al participante o no. «Editar» abre el panel lateral con
// su formulario: el enunciado, el tipo y las opciones.

export function Visibilidad({ visible, onCambio, id, bloqueado = false }: { visible: boolean; onCambio: (visible: boolean) => void; id: string; bloqueado?: boolean }) {
  const toggle = (
    <Toggle id={id} variant="outline" size="sm" pressed={visible} disabled={bloqueado} onPressedChange={onCambio} aria-label="Permitir edición al participante" className="shrink-0 justify-start">
      <HugeiconsIcon icon={visible ? PencilEdit02Icon : LockIcon} aria-hidden="true" />
      {visible ? 'Permitir edición' : 'No permite edición'}
    </Toggle>
  )
  if (bloqueado) return <EnCurso bloqueado>{toggle}</EnCurso>
  return (
    <Hint label={visible ? 'El participante ve este dato y puede editarlo al responder. Pulsa para no permitir edición.' : 'Se toma directo del sistema sin que el participante pueda editarlo. Pulsa para permitir edición.'}>
      {toggle}
    </Hint>
  )
}

export function FilaDato({
  titulo,
  detalle,
  campo,
  activable = true,
  onActivar,
  onEditar,
  onCambio,
  onQuitar,
  onGuardar,
  editable = true,
  conVisibilidad = true,
  control,
  bloqueado = false,
}: {
  titulo: string
  detalle: string
  /** El campo en la encuesta, o null si este dato no está activo. */
  campo: DemographicField | null
  /** Si lleva el interruptor para activarlo o desactivarlo en la encuesta. */
  activable?: boolean
  onActivar?: (activo: boolean) => void
  onEditar: () => void
  onCambio: (campo: DemographicField) => void
  onQuitar?: () => void
  /** Guardar la pregunta para reutilizarla en futuras encuestas; solo si aplica. */
  onGuardar?: () => void
  /** Los precargados del sistema no se editan: son los valores que la plataforma guarda. */
  editable?: boolean
  /** Permitir o no edición al participante solo aplica a los precargados del sistema. */
  conVisibilidad?: boolean
  /** Lo que va antes del nombre, cuando aplica. */
  control?: ReactNode
  /** La encuesta está en curso: la fila se ve, pero no se activa, edita, guarda ni quita. Cada control dice por qué. */
  bloqueado?: boolean
}) {
  const id = campo?.id ?? titulo
  const conAyuda = (etiqueta: string, boton: ReactElement) => (bloqueado ? <EnCurso bloqueado>{boton}</EnCurso> : <Hint label={etiqueta}>{boton}</Hint>)
  return (
    // «!»: la fila en columna estirada y sin su relleno (lo pone la franja de dentro); la clase sola no le gana a la
    // librería (diferencias.json › instalacion-estilos-sin-capa).
    <Item variant="outline" className="flex-col items-stretch! gap-0 p-0!">
      <div className="flex flex-wrap items-center gap-3 p-3">
        {control}
        {activable ? (
          <EnCurso bloqueado={bloqueado} className="flex">
            <Switch checked={campo !== null} disabled={bloqueado} onCheckedChange={(activo) => onActivar?.(activo)} aria-label={`Usar ${titulo}`} />
          </EnCurso>
        ) : null}
        <ItemContent className="min-w-0">
          <TextoCompleto texto={campo?.label.trim() || titulo || 'Dato sin nombre'}><ItemTitle className="truncate">{campo?.label.trim() || titulo || 'Dato sin nombre'}</ItemTitle></TextoCompleto>
          <ItemDescription>{detalle}</ItemDescription>
        </ItemContent>
        <ItemActions className="ms-auto flex-wrap">
          {(campo || onQuitar) && editable ? (
            conAyuda(
              'Editar',
              <BotonIcono aria-label={`Editar ${titulo || 'el dato'}`} disabled={bloqueado} onClick={onEditar}>
                <HugeiconsIcon icon={PencilEdit02Icon} aria-hidden="true" />
              </BotonIcono>,
            )
          ) : null}
          {onGuardar ? (
            conAyuda(
              'Guardar pregunta para reutilizarla en futuras encuestas',
              <BotonIcono aria-label={`Guardar ${titulo || 'la pregunta'} para reutilizarla en futuras encuestas`} disabled={bloqueado} onClick={onGuardar}>
                <HugeiconsIcon icon={BookmarkAdd02Icon} aria-hidden="true" />
              </BotonIcono>,
            )
          ) : null}
          {onQuitar ? (
            conAyuda(
              'Quitar',
              // «!»: el icono de quitar en rojo; el ghost de la librería no trae tono rojo (diferencias.json › button-ghost-tonos).
              <BotonIcono aria-label={`Quitar ${titulo || 'el dato'}`} className="text-destructive!" disabled={bloqueado} onClick={onQuitar}>
                <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
              </BotonIcono>,
            )
          ) : null}
          {campo && conVisibilidad ? <Visibilidad id={`visibilidad-${id}`} visible={campo.visible} bloqueado={bloqueado} onCambio={(visible) => onCambio({ ...campo, visible })} /> : null}
        </ItemActions>
      </div>
    </Item>
  )
}
