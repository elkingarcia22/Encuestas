import { PlaceholderPage } from '@/shared/components/PlaceholderPage'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'

// Todavía sin maquetar (aún no hay HU), pero con el marco de toda pantalla (decisión 7 de la auditoría, 5-oct): título
// del menú, la descripción de UBITS (docs/plataforma-ubits: el PDI sale de la matriz de talento) y el espacio libre.
export function Component() {
  return (
    <PageShell>
      <PageHeader title="PDI" description="Planes de desarrollo individual: los resultados de la matriz de talento, convertidos en un plan para cada persona." />
      <PageContent>
        <PlaceholderPage title="PDI" path="/admin/desempeno-cultura/pdi" />
      </PageContent>
    </PageShell>
  )
}

Component.displayName = 'AdminDesempenoCulturaPdiPage'
