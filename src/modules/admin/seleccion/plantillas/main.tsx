import { PlaceholderPage } from '@/shared/components/PlaceholderPage'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'

// Sin maquetar todavía (no hay HU) y fuera del menú: se llega por dirección. Aun así va en el marco de toda pantalla
// —PageShell con su título y su descripción— y el espacio rayado ocupa el contenido (auditoría, 5-oct). La descripción
// es la de las plantillas de flujos de hoy.
export function Component() {
  return (
    <PageShell>
      <PageHeader
        breadcrumbs={[{ label: 'Inicio', path: '/admin' }, { label: 'Selección' }, { label: 'Plantillas' }]}
        title="Plantillas"
        description="Guarda un flujo del candidato para reutilizarlo en otras vacantes."
      />
      <PageContent>
        <PlaceholderPage title="Plantillas" path="/admin/seleccion/plantillas" />
      </PageContent>
    </PageShell>
  )
}

Component.displayName = 'AdminSeleccionPlantillasPage'
