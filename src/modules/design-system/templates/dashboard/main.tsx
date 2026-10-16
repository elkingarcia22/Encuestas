import { DashboardShell } from './components/dashboard-shell'

// Página independiente con el marco único del playground (ShellUbits), que ya se monta a
// pantalla completa. La vuelta a Templates está en el pie del menú lateral.
export function Component() {
  return <DashboardShell />
}

Component.displayName = 'DesignSystemDashboardPage'
