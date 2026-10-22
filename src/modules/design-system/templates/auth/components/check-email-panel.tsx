import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft02Icon } from '@hugeicons/core-free-icons'
import { Button, Text } from '@ubits/flux-ui'
import { AuthHeader } from './auth-header'

export function CheckEmailPanel({
  destino,
  onBackToLogin,
  onChangeEmail,
}: {
  destino: string
  onBackToLogin: () => void
  onChangeEmail: () => void
}) {
  // Si escribió un usuario y no un correo, no hay dirección que mostrar.
  const correo = destino.includes('@') ? (
    <Text as="span" size="sm" weight="medium">
      {destino}
    </Text>
  ) : (
    'registrado en tu cuenta'
  )

  return (
    <>
      <AuthHeader
        media={{ glass: 'glass-tick' }}
        title="¡Revisa tu correo!"
        description={<>Enviamos al correo {correo} las instrucciones para restablecer tu contraseña.</>}
      />

      <div className="flex flex-col gap-2">
        {/* Vuelve al paso anterior con el correo ya escrito: puede corregirlo o reenviar con un clic. */}
        <Button size="lg" className="w-full cursor-pointer" onClick={onChangeEmail}>
          No recibí el correo
        </Button>
        <Button variant="ghost" size="lg" className="w-full cursor-pointer" onClick={onBackToLogin}>
          <HugeiconsIcon icon={ArrowLeft02Icon} size={16} aria-hidden="true" />
          Volver a iniciar sesión
        </Button>
      </div>
    </>
  )
}
