import { PlaceholderPage } from '@/shared/components/PlaceholderPage'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'

// Todavía sin maquetar, pero con el marco de toda pantalla (decisión 7 de la auditoría, 5-oct): título y descripción
// de UBITS (HU-DES-002, docs/plataforma-ubits) y el espacio libre dentro del contenido, con el ancho de PageShell.
export function Component() {
  return (
    <PageShell>
      <PageHeader
        title="Evaluaciones 360"
        description="Crea evaluaciones 360° y administra su ciclo: borrador, en progreso y finalizada, con sus resultados generales."
      />
      <PageContent>
        <PlaceholderPage title="Evaluaciones 360" path="/admin/desempeno-cultura/evaluaciones-360" />
      </PageContent>
    </PageShell>
  )
}

Component.displayName = 'AdminDesempenoCulturaEvaluaciones360Page'
