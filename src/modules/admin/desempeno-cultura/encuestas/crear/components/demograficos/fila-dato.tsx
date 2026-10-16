import { HugeiconsIcon } from '@hugeicons/react'
import { BookmarkAdd02Icon, Delete02Icon, PencilEdit02Icon, ViewIcon, ViewOffIcon } from '@hugeicons/core-free-icons'
import type { ReactElement, ReactNode } from 'react'
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle, Switch, Toggle } from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import type { DemographicField } from '../../../modelo/surveyBuilderTypes'
import { TextoCompleto } from '@/shared/components/TextoCompleto'
import { EnCurso } from '../aviso-en-curso'

// Una fila de dato demográfico: se activa con su interruptor, dice de dónde sale y, activo, deja
// elegir si el participante lo ve o si solo sirve para filtrar. «Editar» abre el panel lateral con
// su formulario: el enunciado, el tipo y las opciones.

export function Visibilidad({ visible, onCambio, id, bloqueado = false }: { visible: boolean; onCambio: (visible: boolean) => void; id: string; bloqueado?: boolean }) {
  const toggle = (
    <Toggle id={id} variant="outline" size="sm" pressed={visible} disabled={bloqueado} onPressedChange={onCambio} aria-label="Mostrar al participante" className="w-24 justify-start">
      <HugeiconsIcon icon={visible ? ViewIcon : ViewOffIcon} aria-hidden="true" />
      {visible ? 'Visible' : 'Oculto'}
    </Toggle>
  )
  if (bloqueado) return <EnCurso bloqueado>{toggle}</EnCurso>
  return (
    <Hint label={visible ? 'El participante lo ve y puede corregirlo. Pulsa para ocultarlo (solo filtra).' : 'Solo sirve para filtrar los resultados. Pulsa para mostrarlo al participante.'}>
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
  /** Los creados solo para esta encuesta no se activan: existen o se quitan. */
  activable?: boolean
  onActivar?: (activo: boolean) => void
  onEditar: () => void
  onCambio: (campo: DemographicField) => void
  onQuitar?: () => void
  /** Guardarlo en el módulo para reutilizarlo; solo si aplica. */
  onGuardar?: () => void
  /** Los precargados del sistema no se editan: son los valores que la plataforma guarda. */
  editable?: boolean
  /** Mostrar u ocultar al participante solo aplica a los precargados del sistema. */
  conVisibilidad?: boolean
  /** Lo que va antes del nombre: la casilla para marcar la fila, cuando la lista se puede seleccionar. */
  control?: ReactNode
  /** La encuesta está en curso: la fila se ve, pero no se activa, edita, guarda ni quita. Cada control dice por qué. */
  bloqueado?: boolean
}) {
  const id = campo?.id ?? titulo
  const conAyuda = (etiqueta: string, boton: ReactElement) => (bloqueado ? <EnCurso bloqueado>{boton}</EnCurso> : <Hint label={etiqueta}>{boton}</Hint>)
  return (
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
          {campo && editable ? (
            conAyuda(
              'Editar',
              <BotonIcono aria-label={`Editar ${titulo || 'el dato'}`} disabled={bloqueado} onClick={onEditar}>
                <HugeiconsIcon icon={PencilEdit02Icon} aria-hidden="true" />
              </BotonIcono>,
            )
          ) : null}
          {onGuardar ? (
            conAyuda(
              'Guardar en el módulo para reutilizarlo',
              <BotonIcono aria-label={`Guardar ${titulo || 'el dato'} en el módulo`} disabled={bloqueado} onClick={onGuardar}>
                <HugeiconsIcon icon={BookmarkAdd02Icon} aria-hidden="true" />
              </BotonIcono>,
            )
          ) : null}
          {onQuitar ? (
            conAyuda(
              'Quitar',
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
