import { useState } from 'react'
import { CheckmarkCircle02Icon, Delete02Icon } from '@hugeicons/core-free-icons'
import { Field, FieldDescription, FieldLabel, Input } from '@ubits/flux-ui'
import { DialogoConfirmar } from '@/modules/design-system/estados/confirmaciones'
import type { SurveyListItem } from '../modelo/types'

// Las dos confirmaciones del listado. Finalizar deja de admitir respuestas para siempre; eliminar
// borra la encuesta y sus respuestas. Para una sola encuesta, eliminar pide escribir su nombre: es
// la acción menos reversible del producto. Con varias no hay un nombre que escribir.

export function DialogoFinalizar({
  encuesta,
  onCerrar,
  onConfirmar,
}: {
  encuesta: SurveyListItem | null
  onCerrar: () => void
  onConfirmar: (encuesta: SurveyListItem) => void
}) {
  return (
    <DialogoConfirmar
      abierto={encuesta !== null}
      onAbiertoChange={(abierto) => (abierto ? undefined : onCerrar())}
      icono={CheckmarkCircle02Icon}
      titulo="¿Finalizar esta encuesta?"
      descripcion={`«${encuesta?.name ?? ''}» dejará de admitir respuestas de inmediato. Podrás consultar sus resultados, pero quienes aún no hayan respondido ya no podrán hacerlo.`}
      accion="Finalizar encuesta"
      onConfirmar={() => encuesta && onConfirmar(encuesta)}
    />
  )
}

export function DialogoEliminar({
  encuestas,
  onCerrar,
  onConfirmar,
}: {
  encuestas: readonly SurveyListItem[]
  onCerrar: () => void
  onConfirmar: (encuestas: readonly SurveyListItem[]) => void
}) {
  const [texto, setTexto] = useState('')
  const una = encuestas.length === 1 ? encuestas[0] : null
  const listo = una ? texto.trim() === una.name : encuestas.length > 1

  return (
    <DialogoConfirmar
      abierto={encuestas.length > 0}
      onAbiertoChange={(abierto) => {
        if (abierto) return
        setTexto('')
        onCerrar()
      }}
      icono={Delete02Icon}
      titulo={una ? '¿Eliminar esta encuesta?' : `¿Eliminar ${encuestas.length} encuestas?`}
      descripcion={
        una
          ? `«${una.name}» y sus respuestas se eliminarán definitivamente. Esta acción no se puede deshacer.`
          : 'Las encuestas seleccionadas y sus respuestas se eliminarán definitivamente. Esta acción no se puede deshacer.'
      }
      accion="Eliminar"
      destructiva
      deshabilitada={!listo}
      onConfirmar={() => {
        setTexto('')
        onConfirmar(encuestas)
      }}
    >
      {una ? (
        <Field>
          <FieldLabel htmlFor="confirmar-eliminar-encuesta">Escribe «{una.name}» para confirmar</FieldLabel>
          <Input id="confirmar-eliminar-encuesta" value={texto} autoComplete="off" onChange={(evento) => setTexto(evento.target.value)} />
          <FieldDescription>Así nadie borra una encuesta con respuestas por un clic de más.</FieldDescription>
        </Field>
      ) : null}
    </DialogoConfirmar>
  )
}
