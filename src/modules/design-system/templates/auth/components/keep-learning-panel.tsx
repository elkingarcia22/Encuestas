import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft02Icon } from '@hugeicons/core-free-icons'
import { Button, Text } from '@ubits/flux-ui'
import { AuthHeader } from './auth-header'

// Se muestra cuando la cuenta solo entra por organización y la persona intentó con usuario y contraseña.
export function KeepLearningPanel({
  correo,
  onBackToLogin,
  onOrganizationLogin,
}: {
  correo: string
  onBackToLogin: () => void
  onOrganizationLogin: () => void
}) {
  // El correo es el que escribió en el login; si llegó sin escribir uno (o escribió un usuario), se habla de «tu correo».
  const cuyo = correo.includes('@') ? (
    <>
      El correo{' '}
      <Text as="span" size="sm" weight="medium">
        {correo}
      </Text>
    </>
  ) : (
    'Tu correo'
  )

  return (
    <>
      <AuthHeader
        media={{ glass: 'glass-info-circle' }}
        title="¡Sigue aprendiendo!"
        description={
          <>
            {cuyo} no necesita contraseña. Para usar la plataforma selecciona «Ingresa con tu organización» y listo.
          </>
        }
      />

      <div className="flex flex-col gap-2">
        {/* Lleva directo al paso de organización, no al login: es justo lo que se le está pidiendo hacer. */}
        <Button size="lg" className="w-full cursor-pointer" onClick={onOrganizationLogin}>
          Ingresar
        </Button>
        <Button type="button" variant="ghost" size="lg" className="w-full cursor-pointer" onClick={onBackToLogin}>
          <HugeiconsIcon icon={ArrowLeft02Icon} size={16} aria-hidden="true" />
          Volver a iniciar sesión
        </Button>
      </div>
    </>
  )
}
