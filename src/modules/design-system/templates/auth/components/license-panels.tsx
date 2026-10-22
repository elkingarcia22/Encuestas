import { Button, Text } from '@ubits/flux-ui'
import { AuthHeader } from './auth-header'

// Licencia y vigencia: las decide el servidor al validar la cuenta, como el bloqueo. Textos de login.ubitslearning.com.

export function LicenseInactivePanel({ onBackToLogin }: { onBackToLogin: () => void }) {
  return (
    <>
      <AuthHeader
        media={{ glass: 'glass-close-square' }}
        title="¡Tu licencia se encuentra inactiva!"
        description={
          <div className="flex flex-col gap-3">
            <p>Actualmente, tu usuario no tiene licencia activa. Esto puede deberse a las siguientes razones:</p>
            <ol className="list-inside list-decimal">
              <li>Tu licencia fue desactivada en la plataforma.</li>
              <li>Tu organización ya no cuenta con nuestros servicios.</li>
            </ol>
            <p>
              <Text as="span" size="sm" weight="medium">
                ¿Qué puedes hacer?
              </Text>{' '}
              Contacta a tu administrador para que verifique el estado de tu licencia con la persona responsable de
              UBITS en tu organización.
            </p>
          </div>
        }
      />

      <Button size="lg" className="w-full cursor-pointer" onClick={onBackToLogin}>
        Regresar
      </Button>
    </>
  )
}

export function ValidityEndedPanel({ onBackToLogin }: { onBackToLogin: () => void }) {
  return (
    <>
      <AuthHeader
        media={{ glass: 'glass-close-square' }}
        title="¡Tu vigencia terminó!"
        description={
          <>
            Completaste tu vigencia con nosotros. Contacta al departamento de recursos humanos si deseas renovarla.{' '}
            <Text as="span" size="sm" weight="medium">
              ¡Esperamos verte pronto!
            </Text>
          </>
        }
      />

      <Button size="lg" className="w-full cursor-pointer" onClick={onBackToLogin}>
        Regresar
      </Button>
    </>
  )
}
