import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { PencilEdit02Icon } from '@hugeicons/core-free-icons'
import { Button, Field, FieldDescription, FieldLabel, Input, Popover, PopoverContent, PopoverTrigger, Text } from '@ubits/flux-ui'
import { estimatedMinutesOf, suggestedMinutes } from '../../modelo/previewModel'
import type { SurveyDraft } from '../../modelo/surveyBuilderTypes'

// «Tiempo estimado» de «Así va la encuesta» con la cifra editable: la sugerencia sale de las preguntas (medio minuto cada una),
// pero quien arma la encuesta conoce mejor cuánto toma y puede fijar la suya. Esa cifra es la que ve el participante en la
// bienvenida y el cierre; «Usar el sugerido» vuelve al cálculo. Misma fila de término y valor que el resto del panel.

const MIN = 1
const MAX = 180

export function TiempoEstimado({ borrador, onCambio }: { borrador: SurveyDraft; onCambio: (cambio: Partial<SurveyDraft>) => void }) {
  const sugerido = suggestedMinutes(borrador)
  const actual = estimatedMinutesOf(borrador)
  const ajustado = Boolean(borrador.minutesOverride && borrador.minutesOverride > 0 && borrador.minutesOverride !== sugerido)
  const [texto, setTexto] = useState(String(actual))

  const escribir = (valor: string) => {
    setTexto(valor)
    const minutos = Number(valor)
    if (!Number.isInteger(minutos) || minutos < MIN || minutos > MAX) return
    onCambio({ minutesOverride: minutos === sugerido ? null : minutos })
  }
  const invalido = texto !== '' && (!Number.isInteger(Number(texto)) || Number(texto) < MIN || Number(texto) > MAX)

  return (
    <dl>
      <div className="flex items-center justify-between gap-3">
        <dt className="shrink-0">
          <Text as="span" variant="muted" size="sm">
            Tiempo estimado
          </Text>
        </dt>
        <dd className="min-w-0">
          {sugerido === 0 ? (
            <Text as="span" size="sm">
              —
            </Text>
          ) : (
            <Popover onOpenChange={(abierto) => abierto && setTexto(String(actual))}>
              <PopoverTrigger render={<Button variant="ghost" size="xs" className="-mr-2 gap-1.5 font-normal" aria-label={`Tiempo estimado: ${actual} min. Editar`} />}>
                <span className="tabular-nums">{actual} min</span>
                {ajustado ? (
                  <Text as="span" size="xs" variant="muted">
                    · ajustado
                  </Text>
                ) : null}
                <HugeiconsIcon icon={PencilEdit02Icon} size={14} aria-hidden="true" />
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64">
                <div className="flex flex-col gap-3">
                  <Field data-invalid={invalido || undefined}>
                    <FieldLabel htmlFor="tiempo-estimado">Minutos para responder</FieldLabel>
                    <Input id="tiempo-estimado" type="number" inputMode="numeric" min={MIN} max={MAX} value={texto} aria-invalid={invalido || undefined} onChange={(evento) => escribir(evento.target.value)} />
                    <FieldDescription>
                      {invalido ? `Escribe un número entre ${MIN} y ${MAX}.` : `Sugerido: ${sugerido} min, a medio minuto por pregunta. Es lo que lee el participante.`}
                    </FieldDescription>
                  </Field>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="self-end"
                    disabled={!ajustado}
                    onClick={() => {
                      setTexto(String(sugerido))
                      onCambio({ minutesOverride: null })
                    }}
                  >
                    Usar el sugerido
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </dd>
      </div>
    </dl>
  )
}
