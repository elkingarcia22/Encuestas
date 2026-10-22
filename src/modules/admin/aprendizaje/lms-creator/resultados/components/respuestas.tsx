import { HugeiconsIcon } from '@hugeicons/react'
import { CheckmarkCircle02Icon, CircleIcon, RecordIcon, UnavailableIcon } from '@hugeicons/core-free-icons'
import { Frame, FrameHeader, FramePanel, FrameTitle, Text } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import type { Respuesta } from './datos'

// Pregunta por pregunta: lo que se ve al abrir a una persona, en Evaluaciones y en Encuestas.
//
// Es la misma lista en los dos sitios porque la pregunta es la misma —«¿qué contestó?»— y lo único que cambia es si
// hay respuesta correcta. En una encuesta no la hay, y entonces no se marca nada en verde ni en rojo: ponerle color a
// una opinión la convierte en un examen.

/** Una opción: qué marcó y, si se califica, qué era lo correcto. */
function Opcion({ texto, elegida, correcta, califica }: { texto: string; elegida: boolean; correcta: boolean; califica: boolean }) {
  const acierto = califica && elegida && correcta
  const fallo = califica && elegida && !correcta
  const perdida = califica && !elegida && correcta

  const icono = elegida ? (acierto ? CheckmarkCircle02Icon : fallo ? UnavailableIcon : RecordIcon) : perdida ? CheckmarkCircle02Icon : CircleIcon
  const color = acierto || perdida ? 'text-success' : fallo ? 'text-destructive' : 'text-muted-foreground'

  return (
    <span className="flex items-start gap-2">
      <HugeiconsIcon icon={icono} size={16} className={`mt-0.5 shrink-0 ${color}`} aria-hidden="true" />
      <Text as="span" size="sm" weight={elegida ? 'semibold' : 'normal'} variant={elegida || perdida ? undefined : 'muted'} className="min-w-0 flex-1">
        {texto}
      </Text>
      {/* Solo se nombra lo que no se ve con el icono: que esa era la buena y no la marcó. En una línea, para que no
          se parta en dos al lado de una opción larga. */}
      {perdida ? (
        <Text as="span" size="xs" variant="muted" className="mt-0.5 shrink-0 whitespace-nowrap">
          Era la correcta
        </Text>
      ) : null}
    </span>
  )
}

export function ListaRespuestas({ respuestas }: { respuestas: readonly Respuesta[] }) {
  return (
    <div className="flex flex-col gap-3">
      {respuestas.map((respuesta) => {
        const califica = respuesta.acertada !== null
        return (
          <Frame key={respuesta.numero}>
            <FrameHeader>
              {/* El número, la pregunta y el veredicto en la misma línea. `FrameHeader` apila sus hijos, así que la
                  insignia se ponía debajo de un enunciado de tres líneas y costaba saber de qué pregunta hablaba. */}
              <FrameTitle>
                <span className="flex items-start gap-2">
                  <Text as="span" size="sm" weight="semibold" variant="muted" className="tabular-nums">
                    {respuesta.numero}
                  </Text>
                  <span className="min-w-0 flex-1">{respuesta.enunciado}</span>
                  {califica ? (
                    <Badge variant={respuesta.acertada ? 'success-light' : 'destructive-light'} size="sm" className="shrink-0">
                      {respuesta.acertada ? 'Correcta' : 'Incorrecta'}
                    </Badge>
                  ) : null}
                </span>
              </FrameTitle>
            </FrameHeader>
            <FramePanel className="flex flex-col gap-2">
              {respuesta.texto != null ? (
                <Text as="p" size="sm">
                  {respuesta.texto}
                </Text>
              ) : respuesta.opciones.length === 0 ? (
                <Text as="p" size="sm" variant="muted">
                  No contestó esta pregunta.
                </Text>
              ) : (
                respuesta.opciones.map((opcion, indice) => (
                  <Opcion key={opcion} texto={opcion} elegida={respuesta.elegidas.includes(indice)} correcta={respuesta.correctas.includes(indice)} califica={califica} />
                ))
              )}
            </FramePanel>
          </Frame>
        )
      })}
    </div>
  )
}
