import { useState, type RefObject } from 'react'
import { Field, FieldDescription, FieldError, FieldLabel, InputGroup, InputGroupAddon, InputGroupInput, Switch, Textarea } from '@ubits/flux-ui'
import { AiThinking } from '@/shared/components/AiThinking'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'
import type { Objective } from '../../../modelo/constructor/cicloBuilderTypes'
import type { IaTarjeta } from './usar-ia-tarjeta'
import { MARGEN_BARRA, useMostrarAlAbrir } from '../mostrar-al-abrir'

// Paso 1 · «¿Qué quieres lograr?»: el título, el botón de IA al final de su fila y la descripción opcional detrás de
// un interruptor. Mientras la IA pide contexto, el mismo campo cambia de etiqueta y de ejemplo (como el enunciado de
// una pregunta en encuestas); mientras trabaja, el campo se apaga y debajo respira «Redactando el objetivo…».

export const MAX_TITULO = 150

export function CampoTitulo({
  objetivo,
  onCambio,
  ia,
  campo,
  invalido,
}: {
  objetivo: Objective
  onCambio: (cambio: Partial<Objective>) => void
  ia: IaTarjeta
  campo: RefObject<HTMLInputElement | null>
  invalido: boolean
}) {
  const id = `objetivo-${objetivo.id}`
  const pidiendo = ia.fase === 'contexto'
  const vacio = objetivo.title.trim() === ''
  const [quiereDescripcion, setQuiereDescripcion] = useState(objetivo.description !== '')
  const conDescripcion = quiereDescripcion || objetivo.description !== ''
  const marcarRojo = invalido && vacio && !pidiendo

  const [campoDescripcion, mostrarDescripcion] = useMostrarAlAbrir()
  const cambiarDescripcion = (activa: boolean) => {
    if (!activa && objetivo.description) onCambio({ description: '' })
    setQuiereDescripcion(activa)
    if (activa) mostrarDescripcion()
  }

  return (
    <>
      <Field data-invalid={marcarRojo || undefined}>
        <FieldLabel htmlFor={`${id}-titulo`}>{pidiendo ? 'De qué va el objetivo' : 'Objetivo'}</FieldLabel>
        {/* El botón de IA va dentro del campo como su complemento final: el texto termina antes de él y no se monta. */}
        {/* Fondo blanco: el campo es transparente y se pierde sobre el gris (diferencias.json › input-group-fondo-solido). */}
        <InputGroup className="bg-background!">
          <InputGroupInput
            ref={campo}
            id={`${id}-titulo`}
            // Si aun así no cabe (panel angosto), el ejemplo termina en «…» antes del botón de IA.
            className="text-ellipsis"
            value={objetivo.title}
            maxLength={MAX_TITULO}
            disabled={ia.ocupada}
            aria-invalid={marcarRojo || undefined}
            placeholder={pidiendo ? 'Ej.: la satisfacción de los clientes de soporte' : 'Ej.: Aumentar las ventas digitales'}
            onChange={(evento) => onCambio({ title: evento.target.value.slice(0, MAX_TITULO) })}
            onKeyDown={(evento) => {
              if (!pidiendo) return
              // Enter redacta sin ir al botón; Escape deja el campo como estaba.
              if (evento.key === 'Enter') {
                evento.preventDefault()
                ia.disparar()
              } else if (evento.key === 'Escape') {
                evento.stopPropagation()
                ia.cancelarContexto()
              }
            }}
          />
          <InputGroupAddon align="inline-end">
            <BotonIaSecundario size="sm" onClick={ia.disparar} disabled={ia.ocupada || (pidiendo && vacio) || (vacio && ia.fase === 'quieta')} aria-label={ia.descripcion} aria-busy={ia.ocupada || undefined}>
              {ia.etiqueta}
            </BotonIaSecundario>
          </InputGroupAddon>
        </InputGroup>
        <div className="flex justify-between gap-4">
          <div className="flex-1">
            {pidiendo ? <FieldDescription>Escribe en una frase de qué quieres que vaya este objetivo y lo redactamos por ti, con su medida y su meta.</FieldDescription> : null}
            {ia.fase === 'trabajando' ? <AiThinking label="Redactando el objetivo…" /> : null}
            {marcarRojo ? <FieldError>Este campo es obligatorio</FieldError> : null}
          </div>
        </div>
      </Field>

      {ia.fase === 'quieta' ? (
        <>
          {/* Campo en fila que ocupa solo lo suyo: el tema le da ancho completo y la clase sola no le gana (diferencias.json › instalacion-estilos-sin-capa). */}
          <Field orientation="horizontal" className="w-auto!">
            <Switch id={`${id}-con-descripcion`} checked={conDescripcion} onCheckedChange={cambiarDescripcion} />
            <FieldLabel htmlFor={`${id}-con-descripcion`}>Agregar descripción</FieldLabel>
          </Field>
          {conDescripcion ? (
            <Field ref={campoDescripcion} className={MARGEN_BARRA}>
              <FieldLabel htmlFor={`${id}-descripcion`} className="sr-only">
                Descripción del objetivo
              </FieldLabel>
              <Textarea
                id={`${id}-descripcion`}
                rows={2}
                // Fondo blanco: el campo es transparente y se pierde sobre el gris (diferencias.json › input-group-fondo-solido).
                className="bg-background!"
                value={objetivo.description}
                placeholder="Descripción: contexto, cómo se va a medir, de dónde sale el dato."
                onChange={(evento) => onCambio({ description: evento.target.value })}
              />
            </Field>
          ) : null}
        </>
      ) : null}
    </>
  )
}
