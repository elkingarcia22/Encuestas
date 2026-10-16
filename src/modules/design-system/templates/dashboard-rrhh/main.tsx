import { DashboardShell } from '../dashboard/components/dashboard-shell'
import { RrhhView } from './components/rrhh-view'

// Mismo shell que el template Dashboard (el marco único del playground); cambia el contenido.
export function Component() {
  return (
    <DashboardShell pagina="Recursos Humanos">
      <RrhhView />
    </DashboardShell>
  )
}

Component.displayName = 'DesignSystemDashboardRrhhPage'
