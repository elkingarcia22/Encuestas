import type { ReactElement } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { InformationCircleIcon } from '@hugeicons/core-free-icons'
import { Alert, AlertDescription } from '@ubits/flux-ui'
import { Hint } from '@/shared/components/Hint'
import { useMotivoBloqueo } from './en-curso'

// Lo que se ve al editar una encuesta en curso en los pasos que ya no se pueden cambiar: un aviso arriba, una sola vez,
// y el mismo motivo en el tooltip de cada control apagado.

/** El aviso informativo de arriba del paso. `que` dice qué parte queda fija, p. ej. «Las secciones y preguntas». */
export function AvisoEnCurso({ que, normativa = false }: { que: string; normativa?: boolean }) {
  return (
    <Alert variant="info">
      <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
      <AlertDescription>
        {normativa
          ? `${que} son las oficiales de la NOM-035 y no se pueden cambiar: así la encuesta sigue cumpliendo la norma. Puedes abrir cada sección y revisar sus preguntas.`
          : `${que} no se pueden cambiar mientras la encuesta está en curso: afectaría sus resultados y las respuestas que ya tiene.`}
      </AlertDescription>
    </Alert>
  )
}

/**
 * El tooltip de un control apagado por estar en curso. Un control deshabilitado no recibe el cursor, así que el
 * disparador es un `span` que lo envuelve. Sin `bloqueado`, devuelve el control tal cual.
 */
export function EnCurso({ bloqueado, className, children }: { bloqueado: boolean; className?: string; children: ReactElement }) {
  const motivo = useMotivoBloqueo()
  if (!bloqueado) return children
  return (
    <Hint label={motivo}>
      <span className={className}>{children}</span>
    </Hint>
  )
}
