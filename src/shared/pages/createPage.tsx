import { PlaceholderPage } from '@/shared/components/PlaceholderPage'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'

// Una pantalla que todavía no está maquetada también va en el marco de página, con su título (decisión 7 de la
// auditoría, 5-oct: toda pantalla en PageShell con PageHeader). El ancho lo pone PageShell, no el recuadro rayado.
export function createPage(title: string, path: string, displayName: string) {
  function Component() {
    return (
      <PageShell>
        <PageHeader title={title} />
        <PageContent>
          <PlaceholderPage title={title} path={path} />
        </PageContent>
      </PageShell>
    )
  }

  Component.displayName = displayName

  return { Component }
}
