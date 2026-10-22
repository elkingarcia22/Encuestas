import { Text, cn } from '@ubits/flux-ui'

// El aviso que va siempre debajo del campo donde se le escribe a Orbit (regla «aviso-de-orbit», war room del 13-oct,
// pedido de David): en el panel de cada pantalla (lo pone ComposerTray), en Suite AI y en los agentes propios.
export const TEXTO_AVISO_ORBIT = 'Orbit puede cometer errores. Verifica la respuesta.'

export function AvisoOrbit({ className }: { className?: string }) {
  return (
    <Text as="p" size="xs" variant="muted" className={cn('text-center text-balance', className)}>
      {TEXTO_AVISO_ORBIT}
    </Text>
  )
}
