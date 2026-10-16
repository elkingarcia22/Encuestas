import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, InformationCircleIcon } from '@hugeicons/core-free-icons'
import { Alert, AlertAction, AlertDescription, AlertTitle, Button } from '@ubits/flux-ui'
import { cerrarBanner, useBanner, type Banner } from '@/shared/components/banner'

// Banner global: el aviso que habla de toda la plataforma (mantenimiento, fin de la prueba, un incidente). Va debajo del
// header, fijo arriba del contenido y a todo su ancho: no tapa el header, no se va con el scroll y empuja la pantalla hacia
// abajo en vez de taparla. Uno a la vez: si llega otro, reemplaza al anterior. Es la Alert de la librería tal cual; solo
// lleva el aire alrededor. Pedido de Carlos en el follow up del 17-sep: «no tiene ningún ejemplo de cómo se ven las de
// arriba». Se lanza con mostrarBanner() (banner.ts) desde cualquier pantalla (el design system lo hace en Estados › Feedback).

const ICONO: Record<Banner['tipo'], ReactNode> = {
  warning: <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />,
  destructive: <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />,
  info: <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />,
  invert: <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />,
}

export function GlobalBanner() {
  const banner = useBanner()
  if (!banner) return null
  return (
    <div role="region" aria-label="Aviso de la plataforma" className="shrink-0 px-6 pt-4">
      <Alert variant={banner.tipo}>
        {ICONO[banner.tipo]}
        <AlertTitle>{banner.titulo}</AlertTitle>
        {banner.descripcion ? (
          <AlertDescription>
            <p>{banner.descripcion}</p>
          </AlertDescription>
        ) : null}
        <AlertAction>
          <Button
            variant={banner.tipo === 'invert' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => {
              banner.accion?.onClick?.()
              cerrarBanner()
            }}
          >
            {banner.accion?.texto ?? 'Entendido'}
          </Button>
        </AlertAction>
      </Alert>
    </div>
  )
}
