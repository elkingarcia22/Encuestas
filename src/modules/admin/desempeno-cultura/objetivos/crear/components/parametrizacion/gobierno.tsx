import { HugeiconsIcon } from '@hugeicons/react'
import { Badge, Field, FieldError, FieldLabel, IconTile, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch, Text } from '@ubits/flux-ui'
import { PARTICIPANT_MODES_BY_CREATOR, type CicloDraft, type CicloObjectiveCreator, REMINDER_FREQUENCY_LABELS, REMINDER_FREQUENCY_ORDER, type ReminderFrequency } from '../../../modelo/constructor/cicloBuilderTypes'
import { ASSIGNMENT_LEVEL_META, ASSIGNMENT_LEVEL_ORDER, GOVERNANCE_META, GOVERNANCE_ORDER, assignmentLevelOf, creatorAssignsObjectives, levelsForAssignment, levelsForCreator, shouldResetLevels, type AssignmentLevel } from '../../../modelo/constructor/cicloSetup'
import { OBJECTIVE_MODEL_META } from '../../../modelo/constructor/objectiveModel'
import { type Contestadas } from './preguntas'
import { Pregunta } from './opciones'

// Bloque 3 · Gobierno: quién redacta los objetivos (el quién), que decide dónde termina el trabajo de quien crea el
// ciclo. RRHH escribe y reparte todo, y por eso es el único con una pregunta más: a qué nivel se reparten. Con líderes,
// colaboradores u otros, el ciclo se lanza y cada quien escribe lo suyo. Debajo, «Tu recorrido» enseña los pasos que
// quedan con esa elección y cómo termina.

export function BloqueGobierno({
  borrador,
  onCambio,
  conErrores,
  nivelContestado,
  onNivelContestado,
  contestadas,
  onContestar,
}: {
  borrador: CicloDraft
  onCambio: (cambio: Partial<CicloDraft>) => void
  conErrores: boolean
  nivelContestado: boolean
  onNivelContestado: (contestado: boolean) => void
  contestadas: Contestadas
  onContestar: (cambio: Partial<Contestadas>) => void
}) {
  const creador = borrador.objectiveCreator
  const modelo = borrador.objectiveModel ? OBJECTIVE_MODEL_META[borrador.objectiveModel] : null
  const sugerido = modelo?.creator ?? null

  const elegirCreador = (nuevo: CicloObjectiveCreator) => {
    const cambio: Partial<CicloDraft> = { objectiveCreator: nuevo }
    // Cambiar de gobierno lleva el paso de participantes al método que le corresponde.
    if (nuevo !== 'hr') {
      cambio.participants = { ...borrador.participants, mode: PARTICIPANT_MODES_BY_CREATOR[nuevo][0], groupSegmentBy: nuevo === 'leader' ? 'leader' : borrador.participants.groupSegmentBy }
    }
    // El nivel se vuelve a preguntar la primera vez y cada vez que colaboradores u otros entra o sale.
    if (creador === null || shouldResetLevels(creador, nuevo)) Object.assign(cambio, levelsForCreator(nuevo))
    onNivelContestado(!creatorAssignsObjectives(nuevo))
    onCambio(cambio)
  }

  const nivel = nivelContestado ? assignmentLevelOf(borrador) : null
  const gobierno = creador ? GOVERNANCE_META[creador] : null

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Field data-invalid={conErrores && creador === null ? 'true' : undefined}>
          <FieldLabel htmlFor="ciclo-gobierno">Quién redacta los objetivos</FieldLabel>
          <Select value={creador ?? ''} onValueChange={(v) => elegirCreador(v as CicloObjectiveCreator)}>
            <SelectTrigger id="ciclo-gobierno" aria-invalid={conErrores && creador === null ? 'true' : undefined}>
              <SelectValue placeholder="Elige quién redacta los objetivos">
                {(v: string) =>
                  v ? (
                    <span className="flex min-w-0 items-center gap-2">
                      <HugeiconsIcon icon={GOVERNANCE_META[v as CicloObjectiveCreator].icon} aria-hidden="true" className="shrink-0 text-muted-foreground" />
                      <span className="truncate">{GOVERNANCE_META[v as CicloObjectiveCreator].label}</span>
                    </span>
                  ) : (
                    'Elige quién redacta los objetivos'
                  )
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {GOVERNANCE_ORDER.map((id) => (
                <SelectItem key={id} value={id}>
                  <div className="flex items-start gap-3 py-1 max-w-[280px] sm:max-w-sm">
                    <IconTile variant="soft" size="sm" className="shrink-0 text-primary! **:text-primary!">
                      <HugeiconsIcon icon={GOVERNANCE_META[id].icon} aria-hidden="true" />
                    </IconTile>
                    <div className="flex flex-col whitespace-normal">
                      <span className="font-medium">
                        {GOVERNANCE_META[id].label}
                        {id === sugerido ? (
                          <Badge variant="secondary" size="xs" className="ml-2">
                            Sugerido
                          </Badge>
                        ) : null}
                      </span>
                      <Text as="span" size="xs" variant="muted">
                        {GOVERNANCE_META[id].description}
                      </Text>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {conErrores && creador === null ? <FieldError>Elige quién redacta los objetivos</FieldError> : null}
        </Field>

        
          <Field data-invalid={conErrores && creador === 'hr' && nivel === null ? 'true' : undefined}>
            <FieldLabel htmlFor="ciclo-nivel">Cómo se reparten los objetivos</FieldLabel>
            <Select
              disabled={creador !== 'hr'}
              value={nivel ?? ''}
              onValueChange={(v) => {
                onNivelContestado(true)
                const level = v as AssignmentLevel
                onCambio({
                  ...levelsForAssignment(level),
                  participants: {
                    ...borrador.participants,
                    mode: 'groups'
                  }
                })
              }}
            >
              <SelectTrigger id="ciclo-nivel" aria-invalid={conErrores && creador === 'hr' && nivel === null ? 'true' : undefined} disabled={creador !== 'hr'}>
                <SelectValue placeholder="Elige cómo se reparten">
                  {(v: string) =>
                    v ? (
                      <span className="flex min-w-0 items-center gap-2">
                        <HugeiconsIcon icon={ASSIGNMENT_LEVEL_META[v as AssignmentLevel].icon} aria-hidden="true" className="shrink-0 text-muted-foreground" />
                        <span className="truncate">{ASSIGNMENT_LEVEL_META[v as AssignmentLevel].label}</span>
                      </span>
                    ) : (
                      'Elige cómo se reparten'
                    )
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ASSIGNMENT_LEVEL_ORDER.map((id) => (
                  <SelectItem key={id} value={id}>
                    <div className="flex items-start gap-3 py-1 max-w-[280px] sm:max-w-sm">
                      <IconTile variant="soft" size="sm" className="shrink-0 text-primary! **:text-primary!">
                        <HugeiconsIcon icon={ASSIGNMENT_LEVEL_META[id].icon} aria-hidden="true" />
                      </IconTile>
                      <div className="flex flex-col whitespace-normal">
                        <span className="font-medium">{ASSIGNMENT_LEVEL_META[id].label}</span>
                        <Text as="span" size="xs" variant="muted">
                          {ASSIGNMENT_LEVEL_META[id].tagline}
                        </Text>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {conErrores && creador === 'hr' && nivel === null ? <FieldError>Elige cómo se reparten</FieldError> : null}
          </Field>
      </div>

      {gobierno ? (
        <Pregunta 
          titulo={
            <div className="flex items-center gap-3">
              <span>Recordatorios automáticos</span>
              <Switch
                id="ciclo-recordatorios"
                checked={contestadas.recordatorios ? borrador.remindersEnabled : false}
                onCheckedChange={(activo) => {
                  onContestar({ recordatorios: true })
                  onCambio({ remindersEnabled: activo })
                  if (!activo) onContestar({ frecuencia: false })
                }}
                aria-label="Activar recordatorios automáticos"
              />
            </div>
          }
          ayuda="Avisaremos a los participantes para que actualicen su progreso."
        >
          {borrador.remindersEnabled ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <Field>
                <FieldLabel htmlFor="ciclo-frecuencia">Frecuencia</FieldLabel>
                <Select
                  value={contestadas.frecuencia ? borrador.reminderFrequency : ''}
                  onValueChange={(valor) => {
                    onContestar({ frecuencia: true })
                    onCambio({ reminderFrequency: valor as ReminderFrequency })
                  }}
                >
                  <SelectTrigger className="w-full bg-background" id="ciclo-frecuencia">
                    <SelectValue placeholder="Elige la frecuencia">{(v: string) => v ? REMINDER_FREQUENCY_LABELS[v as ReminderFrequency] : 'Elige la frecuencia'}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {REMINDER_FREQUENCY_ORDER.map((frecuencia) => (
                      <SelectItem key={frecuencia} value={frecuencia}>
                        {REMINDER_FREQUENCY_LABELS[frecuencia]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          ) : null}
        </Pregunta>
      ) : null}
    </>
  )
}
