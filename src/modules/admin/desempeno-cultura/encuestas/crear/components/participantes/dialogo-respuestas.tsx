import { Fragment, useState } from 'react'
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle, RadioGroup, RadioGroupItem } from '@ubits/flux-ui'
import { UserRemove01Icon } from '@hugeicons/core-free-icons'
import { DialogoConfirmar } from '@/modules/design-system/estados/confirmaciones'
import type { Collaborator } from '../../../modelo/collaborators'
import { formatCount } from '../../../modelo/participants'

// Editar una encuesta que ya corre y quitar a alguien que ya respondió: se pregunta antes de sacarlo. Con la estructura de
// «¿Salir de la creación?» (Elkin, 14-oct): icono, título, descripción y dos botones. Quien sale de la lista se lleva sus
// respuestas (Elkin, 21-oct): dejan de contar en los resultados y en la participación. Los nombres van en negrita.

export type DestinoRespuestas = 'conservar' | 'descartar'

const MUESTRA = 3

// Desde un ciclo de objetivos en curso (21-oct) se elige qué pasa con el avance de quien sale: seguir contando en el
// progreso del ciclo (lo que se propone) o dejar de contar. En Encuestas no se elige: sus respuestas dejan de contar.
export type ContextoQuitar = 'encuesta' | 'ciclo'

export function DialogoRespuestas({ afectados, onConfirmar, onCancelar, contexto = 'encuesta' }: { afectados: readonly Collaborator[] | null; onConfirmar: (destino: DestinoRespuestas) => void; onCancelar: () => void; contexto?: ContextoQuitar }) {
  const lista = afectados ?? []
  const una = lista.length === 1
  const nombres = lista.slice(0, MUESTRA).map((persona, posicion) => (
    <Fragment key={persona.id}>
      {posicion > 0 ? ', ' : null}
      <strong className="font-semibold">{persona.name}</strong>
    </Fragment>
  ))
  const resto = lista.length - Math.min(lista.length, MUESTRA)
  const ciclo = contexto === 'ciclo'
  const [destino, setDestino] = useState<DestinoRespuestas>('conservar')

  return (
    <DialogoConfirmar
      abierto={afectados !== null}
      onAbiertoChange={(abierto) => (abierto ? undefined : onCancelar())}
      icono={UserRemove01Icon}
      titulo={contexto === 'ciclo' ? (una ? '¿Quitar a esta persona del ciclo?' : '¿Quitar a estas personas del ciclo?') : una ? '¿Quitar a quien ya respondió?' : '¿Quitar a quienes ya respondieron?'}
      descripcion={
        <>
          {nombres}
          {resto > 0 ? ` y ${formatCount(resto)} más` : ''} {ciclo ? (una ? 'sale del ciclo y ya no reportará avance. Elige qué pasa con lo que ya avanzó.' : 'salen del ciclo y ya no reportarán avance. Elige qué pasa con lo que ya avanzaron.') : una ? 'sale de la lista de participantes. Sus respuestas dejarán de contar en los resultados y en la participación de la encuesta.' : 'salen de la lista de participantes. Sus respuestas dejarán de contar en los resultados y en la participación de la encuesta.'}
        </>
      }
      cancelar="Volver"
      accion={una ? 'Quitar participante' : 'Quitar participantes'}
      onConfirmar={() => onConfirmar(ciclo ? destino : 'descartar')}
    >
      {ciclo ? (
        <RadioGroup value={destino} onValueChange={(valor) => setDestino(valor as DestinoRespuestas)} className="gap-3">
          <FieldLabel htmlFor="avance-conservar">
            <Field orientation="horizontal">
              <RadioGroupItem value="conservar" id="avance-conservar" />
              <FieldContent>
                <FieldTitle>Seguir contando su avance</FieldTitle>
                <FieldDescription>Lo que ya avanzó{una ? '' : 'ron'} sigue sumando en el progreso del ciclo.</FieldDescription>
              </FieldContent>
            </Field>
          </FieldLabel>
          <FieldLabel htmlFor="avance-descartar">
            <Field orientation="horizontal">
              <RadioGroupItem value="descartar" id="avance-descartar" />
              <FieldContent>
                <FieldTitle>Dejar de contar su avance</FieldTitle>
                <FieldDescription>Sale{una ? '' : 'n'} del progreso del ciclo y se pierde el avance de sus objetivos.</FieldDescription>
              </FieldContent>
            </Field>
          </FieldLabel>
        </RadioGroup>
      ) : null}
    </DialogoConfirmar>
  )
}
