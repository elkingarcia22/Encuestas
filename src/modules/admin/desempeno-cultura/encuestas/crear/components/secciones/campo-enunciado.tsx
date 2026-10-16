import { useEffect, useRef, useState } from 'react'
import { Field, FieldDescription, FieldError, FieldLabel, Textarea } from '@ubits/flux-ui'
import { AiThinking } from '@/shared/components/AiThinking'
import { generateQuestionFromContext } from '../../../modelo/aiQuestionWording'
import { changeQuestionType } from '../../../modelo/questionCatalog'
import type { SurveyQuestion } from '../../../modelo/surveyBuilderTypes'
import { LIMITE_ENUNCIADO, contador, largoDe, mensajeMinimo } from '../../../modelo/limites-texto'

// El enunciado de una pregunta. Escribirla a mano es lo principal: sin botón de IA ni atajos de redacción en el campo.
// «Redactar con IA» (desde Añadir)
// abre el campo pidiendo una frase de contexto, y con Enter sale la pregunta entera, con su tipo de respuesta.

type Fase = 'escribiendo' | 'contexto' | 'trabajando'

type Props = {
  pregunta: SurveyQuestion
  onCambio: (pregunta: SurveyQuestion) => void
  invalido: boolean
  /** «Redactar con IA»: el campo abre ya pidiendo el contexto. */
  pedirContexto?: boolean
}

export function CampoEnunciado({ pregunta, onCambio, invalido, pedirContexto = false }: Props) {
  const id = `pregunta-${pregunta.id}-enunciado`
  const [fase, setFase] = useState<Fase>(pedirContexto && pregunta.statement.trim() === '' ? 'contexto' : 'escribiendo')
  const [contexto, setContexto] = useState('')
  const [trabajo, setTrabajo] = useState('Redactando la pregunta…')

  // La IA tarda un momento y se puede seguir editando mientras: al terminar se usa la pregunta de ese momento.
  const actual = useRef({ pregunta, onCambio })
  useEffect(() => {
    actual.current = { pregunta, onCambio }
  })
  const vivo = useRef(true)
  useEffect(() => {
    vivo.current = true
    return () => {
      vivo.current = false
    }
  }, [])

  const generar = async () => {
    const frase = contexto.trim()
    if (frase === '') return
    setTrabajo('Redactando la pregunta…')
    setFase('trabajando')
    const generada = await generateQuestionFromContext(frase)
    if (!vivo.current) return
    const base = actual.current.pregunta
    actual.current.onCambio({ ...changeQuestionType({ ...base, statement: generada.statement }, generada.type), isAiGenerated: true, typePending: false })
    setContexto('')
    setFase('escribiendo')
  }

  const enContexto = fase === 'contexto'
  // `invalido` llega cuando falta el enunciado o no llega al mínimo: el mensaje depende de cuál de las dos.
  const mensajeError = largoDe(pregunta.statement) === 0 ? 'Este campo es obligatorio' : mensajeMinimo(LIMITE_ENUNCIADO.min)
  // El del banco llega con marcado: cuenta solo su texto.
  const largo = pregunta.statement.replace(/<[^>]*>/g, '').length

  return (
    <Field data-invalid={(invalido && !enContexto) || undefined}>
      <FieldLabel htmlFor={id}>{enContexto ? 'De qué va la pregunta' : 'Enunciado'}</FieldLabel>
      <Textarea
        id={id}
        rows={2}
        className="bg-background!"
        autoFocus={pregunta.statement === ''}
        disabled={fase === 'trabajando'}
        value={enContexto ? contexto : pregunta.statement}
        placeholder={enContexto ? 'Cuéntanos de qué va: por ejemplo, la carga de trabajo del equipo' : 'Escribe aquí la pregunta o enunciado'}
        aria-invalid={invalido && !enContexto}
        maxLength={enContexto ? undefined : LIMITE_ENUNCIADO.max}
        onChange={(evento) => (enContexto ? setContexto(evento.target.value) : onCambio({ ...pregunta, statement: evento.target.value.slice(0, LIMITE_ENUNCIADO.max) }))}
        onKeyDown={(evento) => {
          if (!enContexto) return
          // Enter redacta sin ir al botón; Escape deja el campo como estaba, otra vez el enunciado.
          if (evento.key === 'Enter' && !evento.shiftKey) {
            evento.preventDefault()
            void generar()
          } else if (evento.key === 'Escape') {
            evento.stopPropagation()
            setFase('escribiendo')
          }
        }}
      />
      {enContexto ? (
        <FieldDescription>Escribe en una frase de qué quieres que vaya la pregunta y pulsa Enter: la redactamos por ti, con su tipo de respuesta. Escape vuelve al enunciado.</FieldDescription>
      ) : null}
      {enContexto ? null : <FieldDescription>{contador(largo, LIMITE_ENUNCIADO.max)}</FieldDescription>}
      {fase === 'trabajando' ? <AiThinking label={trabajo} /> : null}
      {invalido && !enContexto ? <FieldError>{mensajeError}</FieldError> : null}
    </Field>
  )
}
