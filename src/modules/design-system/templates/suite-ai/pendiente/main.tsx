import { Link, useParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { DashboardSquare02Icon } from '@hugeicons/core-free-icons'
import { Button, Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@ubits/flux-ui'

import { ruta, ubicacionDe } from '../components/data'

// Entradas del menú que no son parte del concepto de Suite AI: navegan, pero muestran este aviso.

export function Component() {
  const { pantalla = '' } = useParams()
  const ubicacion = ubicacionDe(pantalla)

  return (
    <div className="flex flex-1 items-center justify-center py-16">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={DashboardSquare02Icon} aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>{ubicacion?.titulo ?? 'Pantalla no encontrada'}</EmptyTitle>
          <EmptyDescription>
            Esta pantalla no es parte del concepto de Orbit. Los siete casos están en «Casos de uso», al pie del menú lateral.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button nativeButton={false} render={<Link to={ruta()} />}>
            Volver al inicio
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}

Component.displayName = 'DesignSystemTemplateSuiteAiPendiente'
