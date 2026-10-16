import { HugeiconsIcon } from '@hugeicons/react'
import { UserMultipleIcon } from '@hugeicons/core-free-icons'
import { Badge, Field, FieldContent, FieldDescription, FieldLabel, FieldTitle, Frame, FramePanel, Heading, IconTile, RadioGroup, RadioGroupItem, Separator, Text } from '@ubits/flux-ui'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { PARTICIPANT_MODES, PARTICIPANT_MODE_COPY, formatCount, participantCountForMode, totalParticipantCount } from '../../../modelo/participants'
import type { ParticipantMode, ParticipantsSelection } from '../../../modelo/surveyBuilderTypes'
import { ParticipantesColaboradores } from './colaboradores'
import { ParticipantesEmpresa } from './empresa'
import { ParticipantesGrupos } from './grupos'
import { ParticipantesImportar } from './importar'

// COPIA de la versión anterior del paso 2 (28 sep 2026), guardada antes del rediseño: las cuatro formas
// de elegir como tarjetas en dos filas y las personas en tablas de cinco columnas. No se usa en la
// pantalla; está para comparar o volver atrás.
//
// Paso 2 · Participantes: a quién se le pregunta. Va antes que el contenido a propósito: decidir a
// quién se le pregunta cambia qué vale la pena preguntar. Cuatro formas de responderlo, de la más
// amplia a la más específica; cada una guarda lo suyo aunque se cambie a otra, así que ir y volver
// no pierde trabajo.

export function PasoParticipantes({ seleccion, onCambio }: { seleccion: ParticipantsSelection; onCambio: (cambio: Partial<ParticipantsSelection>) => void }) {
  const total = totalParticipantCount(seleccion)

  return (
    <Frame>
      <FramePanel className="[--frame-panel-px:0px] [--frame-panel-py:0px]">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-3">
            <IconTile variant="soft" size="sm" className="text-primary">
              <HugeiconsIcon icon={UserMultipleIcon} aria-hidden="true" />
            </IconTile>
            <div className="flex flex-col gap-0.5">
              <Heading as="h2" level={5}>
                Participantes
              </Heading>
              <Text as="p" variant="muted" size="sm">
                Elige quién recibirá la encuesta.
              </Text>
            </div>
          </div>
          <Badge variant="secondary" size="lg" className="tabular-nums">
            {formatCount(total)} {total === 1 ? 'participante' : 'participantes'}
          </Badge>
        </div>
        <Separator />
        <div className="flex flex-col gap-6 px-5 py-5">
          <RadioGroup value={seleccion.mode} onValueChange={(valor) => onCambio({ mode: valor as ParticipantMode })} className="grid gap-3 sm:grid-cols-2">
            {PARTICIPANT_MODES.map((modo) => {
              const copia = PARTICIPANT_MODE_COPY[modo]
              const cuantos = participantCountForMode(modo, seleccion)
              return (
                <FieldLabel key={modo} htmlFor={`participantes-modo-${modo}`}>
                  <Field orientation="horizontal" className="items-start!">
                    <FieldContent>
                      <div className="flex items-center gap-2">
                        <IconTile variant="soft" size="xs" className="text-primary">
                          <HugeiconsIcon icon={copia.icon} aria-hidden="true" />
                        </IconTile>
                        <FieldTitle>
                          {modo === 'import' ? <IconoIA /> : null}
                          {copia.title}
                        </FieldTitle>
                      </div>
                      <FieldDescription>{copia.description}</FieldDescription>
                      <FieldDescription className="tabular-nums">{modo === 'company' || cuantos > 0 ? `${formatCount(cuantos)} ${cuantos === 1 ? 'persona' : 'personas'}` : 'Sin elegir'}</FieldDescription>
                    </FieldContent>
                    <RadioGroupItem value={modo} id={`participantes-modo-${modo}`} />
                  </Field>
                </FieldLabel>
              )
            })}
          </RadioGroup>

          <Separator />

          {seleccion.mode === 'company' ? <ParticipantesEmpresa seleccion={seleccion} onCambio={onCambio} /> : null}
          {seleccion.mode === 'groups' ? <ParticipantesGrupos seleccion={seleccion} onCambio={onCambio} /> : null}
          {seleccion.mode === 'individual' ? <ParticipantesColaboradores seleccion={seleccion} onCambio={onCambio} /> : null}
          {seleccion.mode === 'import' ? <ParticipantesImportar seleccion={seleccion} onCambio={onCambio} /> : null}
        </div>
      </FramePanel>
    </Frame>
  )
}
