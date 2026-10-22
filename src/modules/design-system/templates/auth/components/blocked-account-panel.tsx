import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft02Icon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons'
import { Alert, AlertDescription, AlertTitle, Button } from '@ubits/flux-ui'
import { AuthHeader } from './auth-header'
import { CursorDeshabilitado } from './cursor-deshabilitado'

export function BlockedAccountPanel({ onBackToLogin }: { onBackToLogin: () => void }) {
  const [ayudaSolicitada, setAyudaSolicitada] = useState(false)

  return (
    <>
      <AuthHeader
        media={{ glass: 'glass-lock' }}
        title="Ingreso bloqueado temporalmente"
        description="Hemos detectado actividad inusual en tu cuenta y, como medida de seguridad, hemos bloqueado temporalmente el acceso. Solicita ayuda, estamos para resolver tu inconveniente."
      />

      {ayudaSolicitada ? (
        <Alert variant="success">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden="true" />
          <AlertTitle>Recibimos tu solicitud</AlertTitle>
          <AlertDescription>Te escribiremos al correo de tu cuenta para ayudarte a recuperar el acceso.</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <CursorDeshabilitado disabled={ayudaSolicitada}>
          <Button
            size="lg"
            className="w-full cursor-pointer"
            disabled={ayudaSolicitada}
            onClick={() => setAyudaSolicitada(true)}
          >
            {ayudaSolicitada ? 'Solicitud enviada' : 'Solicitar ayuda'}
          </Button>
        </CursorDeshabilitado>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="w-full cursor-pointer"
          onClick={onBackToLogin}
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} size={16} aria-hidden="true" />
          Volver a iniciar sesión
        </Button>
      </div>
    </>
  )
}
