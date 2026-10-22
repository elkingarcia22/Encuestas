import { Badge, Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@ubits/flux-ui'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { ImagenGlass } from '@/shared/components/ImagenGlass'

// Una pantalla que todavía no está maquetada (regla «pantallas-pendientes», decisión de Cristian del 13-oct): sigue en
// el menú con la etiqueta «Próximamente» y abre esta espera, igual en todo el producto. Lleva el marco de página con su
// título y su descripción de UBITS, y en el cuerpo una sola ilustración glass con una línea de qué tendrá. Nada de rutas,
// «Slot» ni «se arma en…»: reemplaza al recuadro rayado de PlaceholderPage en las pantallas del producto.
export function PantallaProximamente({
  titulo,
  descripcion,
  queTendra,
}: {
  titulo: string
  // La bajada de la cabecera, la misma que tendrá la pantalla (sale de docs/plataforma-ubits).
  descripcion?: string
  // Una línea con lo que se podrá hacer aquí. Sin ella, una genérica.
  queTendra?: string
}) {
  return (
    <PageShell>
      <PageHeader title={titulo} description={descripcion} />
      <PageContent>
        <Empty className="rounded-2xl border bg-muted/40 py-20">
          <EmptyHeader>
            <EmptyMedia variant="default">
              <ImagenGlass nombre="glass-clock" tamano={96} />
            </EmptyMedia>
            <Badge variant="secondary">Próximamente</Badge>
            <EmptyTitle>{titulo} está en camino</EmptyTitle>
            <EmptyDescription>{queTendra ?? 'Estamos diseñando esta pantalla. Mientras tanto, sigue con el resto de la plataforma.'}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </PageContent>
    </PageShell>
  )
}

// Para el main.tsx de una pantalla pendiente: `export const { Component } = crearProximamente('PDI', '…', '…', 'AdminPdiPage')`.
export function crearProximamente(titulo: string, descripcion: string | undefined, queTendra: string | undefined, displayName: string) {
  function Component() {
    return <PantallaProximamente titulo={titulo} descripcion={descripcion} queTendra={queTendra} />
  }
  Component.displayName = displayName
  return { Component }
}
