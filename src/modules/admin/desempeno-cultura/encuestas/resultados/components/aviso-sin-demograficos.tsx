import { HugeiconsIcon } from '@hugeicons/react'
import { InformationCircleIcon } from '@hugeicons/core-free-icons'
import { Alert, AlertDescription } from '@ubits/flux-ui'

// Una encuesta sin datos demográficos se lee igual, en total: lo único que se pierde es filtrar o comparar por grupos.
// Este aviso va donde estarían «Ver por» y los filtros, con el mismo texto en todas las pestañas, para que se entienda
// por qué faltan sin pensar que la pantalla está rota. Es el aviso en línea de la librería (Alert), tono informativo.

export function AvisoSinDemograficos() {
  return (
    <Alert variant="info">
      <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
      <AlertDescription>Esta encuesta no recogió datos demográficos: ves los totales, sin filtrar por área, sede u otros grupos.</AlertDescription>
    </Alert>
  )
}
