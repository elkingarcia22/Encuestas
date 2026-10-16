import { Link } from 'react-router'
import { Button } from '@ubits/flux-ui'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'

import { FullscreenTemplate } from '../fullscreen-template'
import { AppShell } from './components/app-shell'

// Página independiente: se monta por encima del layout de documentación
// (que trae su propio sidebar fijo) para que no compitan dos sidebars
// en pantalla. AppShell reproduce el shell completo por sí mismo.
export function Component() {
  return (
    <FullscreenTemplate>
      <Button
        variant="outline"
        size="sm"
        nativeButton={false}
        className="absolute top-3 right-3 z-10"
        render={<Link to="/design-system/templates" />}
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} aria-hidden="true" />
        Volver a Templates
      </Button>
      <AppShell />
    </FullscreenTemplate>
  )
}

Component.displayName = 'DesignSystemAppShell2Page'
