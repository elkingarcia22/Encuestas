import { PlaceholderPage } from '@/shared/components/PlaceholderPage'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'

// Todavía sin maquetar (aún no hay HU), pero con el marco de toda pantalla (decisión 7 de la auditoría, 5-oct): título
// del menú, la descripción de UBITS hoy (docs/plataforma-ubits, «Matriz de talento») y el espacio libre.
export function Component() {
  return (
    <PageShell>
      <PageHeader title="Matriz de talento" description="Cruza las evaluaciones 360 con los objetivos para analizar el talento de tus equipos." />
      <PageContent>
        <PlaceholderPage title="Matriz de talento" path="/admin/desempeno-cultura/matriz-de-talento" />
      </PageContent>
    </PageShell>
  )
}

Component.displayName = 'AdminDesempenoCulturaMatrizDeTalentoPage'
