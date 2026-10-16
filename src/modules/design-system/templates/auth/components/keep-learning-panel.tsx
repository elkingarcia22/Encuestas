import { HugeiconsIcon } from '@hugeicons/react'
import { Building06Icon } from '@hugeicons/core-free-icons'
import { Button } from '@ubits/flux-ui'
import { AuthHeader } from './auth-header'

// Se muestra cuando la cuenta solo entra por organización y la persona intentó con usuario y contraseña.
export function KeepLearningPanel({
  onBackToLogin,
  onOrganizationLogin,
}: {
  onBackToLogin: () => void
  onOrganizationLogin: () => void
}) {
  return (
    <>
      <AuthHeader
        media={{ glass: 'glass-play' }}
        title="¡Sigue aprendiendo!"
        description="Tu cuenta entra con el correo de tu empresa, sin contraseña. Elige «Ingresa con tu organización» ¡y listo!"
      />

      <div className="flex flex-col gap-2">
        {/* Lleva directo al paso de organización, no al login: es justo lo que se le está pidiendo hacer. */}
        <Button size="lg" className="w-full cursor-pointer" onClick={onOrganizationLogin}>
          <HugeiconsIcon icon={Building06Icon} size={16} aria-hidden="true" />
          Ingresa con tu organización
        </Button>
        <Button type="button" variant="ghost" size="lg" className="w-full cursor-pointer" onClick={onBackToLogin}>
          Volver al inicio de sesión
        </Button>
      </div>
    </>
  )
}
