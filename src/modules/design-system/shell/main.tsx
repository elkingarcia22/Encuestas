import { Outlet } from 'react-router'

import { PageShell } from '@/shared/components/PageShell'

// Páginas de documentación del design system: van en el marco general del playground (barra lateral,
// cabecera y pie de Nicolás) con el contenedor de página a 1.140 px, igual que Navegación, Drawers y
// Agente contextual. ShellUbits queda solo para los templates que todavía traen su propio marco.

export function Component() {
  return (
    <PageShell>
      <Outlet />
    </PageShell>
  )
}

Component.displayName = 'DesignSystemShell'
