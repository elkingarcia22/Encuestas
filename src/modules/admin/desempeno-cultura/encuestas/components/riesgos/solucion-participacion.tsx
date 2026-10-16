import { Button, Field, FieldDescription, FieldLabel, Progress, Text } from '@ubits/flux-ui'
import { CampoFecha } from '@/modules/design-system/formularios/rango-de-fechas'
import type { SurveyRisk } from '../../modelo/riesgos'
import { formatSurveyDate, parseSurveyDate } from '../../modelo/surveyListDates'
import { PARTICIPATION_TARGET } from '../../modelo/surveyListFilters'

// Lo de tiempo en los casos de participación: la barra contra la meta, arriba del detalle, y más días de cierre,
// debajo de la lista de quienes faltan, con el campo de fecha de Formularios. Extender se aplica con su propio botón: es una
// decisión distinta a recordar.

/** La participación de hoy contra la meta, en una barra. */
export function AvanceMeta({ riesgo }: { riesgo: SurveyRisk }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <Text as="span" size="sm" variant="muted">
          Participación hoy
        </Text>
        <Text as="span" size="sm" weight="semibold" className="tabular-nums">
          {riesgo.survey.progress}% de {PARTICIPATION_TARGET}%
        </Text>
      </div>
      <Progress value={Math.min(100, (riesgo.survey.progress / PARTICIPATION_TARGET) * 100)} aria-label="Avance hacia la meta de participación" />
    </div>
  )
}

export function ExtenderCierre({ riesgo, fecha, onFecha, onExtender }: { riesgo: SurveyRisk; fecha: Date | undefined; onFecha: (valor: Date | undefined) => void; onExtender: (nuevoCierre: string) => void }) {
  // El campo de fecha de Formularios (CampoFecha), desde el día siguiente al cierre de hoy: extender es correr el cierre hacia adelante.
  const cierre = parseSurveyDate(riesgo.survey.endDate)
  const desde = cierre ? new Date(cierre.getFullYear(), cierre.getMonth(), cierre.getDate() + 1) : undefined
  return (
    <Field>
      <FieldLabel htmlFor="riesgo-extension">Extender el cierre</FieldLabel>
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <CampoFecha id="riesgo-extension" valor={fecha} onCambio={onFecha} desde={desde} placeholder="Elige el nuevo cierre" />
        </div>
        <Button variant="outline" size="lg" disabled={!fecha} onClick={() => fecha && onExtender(formatSurveyDate(fecha))}>
          Extender
        </Button>
      </div>
      <FieldDescription>Hoy cierra el {riesgo.survey.endDate}. Los resultados se siguen actualizando hasta el nuevo cierre.</FieldDescription>
    </Field>
  )
}
