import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon } from '@hugeicons/core-free-icons'
import { Alert, AlertDescription, AlertTitle } from '@ubits/flux-ui'
import { inicioVencidoEnBorrador } from '../../modelo/inicio-vencido'
import type { SurveyDraft } from '../../modelo/surveyBuilderTypes'

// CRE-120 (Elkin, 14-oct): un borrador nunca pasó a «Por iniciar», así que al llegar su fecha de inicio no se envió.
// Arriba del constructor, en todos los pasos, mientras el inicio siga en el pasado; se va solo al elegir fechas nuevas.
export function AvisoInicioVencido({ borrador }: { borrador: SurveyDraft }) {
  if (!inicioVencidoEnBorrador(borrador)) return null
  return (
    <Alert variant="warning">
      <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />
      <AlertTitle>La fecha de inicio ya pasó</AlertTitle>
      <AlertDescription>
        Esta encuesta nunca se envió porque sigue en borrador. Elige fechas nuevas en «Datos generales» para programarla al finalizar.
      </AlertDescription>
    </Alert>
  )
}
