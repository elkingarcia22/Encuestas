import { FullscreenTemplate } from '../fullscreen-template'
import { AppShell } from './components/app-shell'

// Página independiente: se monta por encima del layout de documentación
// (que trae su propio sidebar fijo) para que no compitan dos sidebars
// en pantalla. AppShell reproduce el shell completo por sí mismo.
export function Component() {
  return (
    <FullscreenTemplate>
      <AppShell />
    </FullscreenTemplate>
  )
}

Component.displayName = 'DesignSystemShellTestPage'
