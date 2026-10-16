import type { ReactNode } from 'react'
import { PageHeader } from '@/shared/components/PageShell'

// Piezas de pantalla que comparten los templates del administrador. Solo combinan flux-ui.

// Encabezado de pantalla: es la cabecera de página del marco (`PageHeader`) con los nombres de los templates.
// Antes era una copia propia —título un nivel más chico, «volver» con borde y botones alineados por su cuenta— y las
// pantallas del design system no se veían como las del producto (Nicolás, 22 sep: «estandarizar todo»).
export function EncabezadoPantalla({
  titulo,
  descripcion,
  volver,
  etiqueta,
  acciones,
  pestanas,
}: {
  titulo: string
  descripcion?: ReactNode
  volver?: { ruta: string; etiqueta: string }
  etiqueta?: ReactNode
  acciones?: ReactNode
  // Las pestañas de la pantalla (`TabsList variant="line"`): van dentro de la cabecera, como en el admin.
  pestanas?: ReactNode
}) {
  return (
    <PageHeader
      title={titulo}
      description={descripcion}
      badge={etiqueta}
      actions={acciones}
      back={volver ? { label: volver.etiqueta, to: volver.ruta } : undefined}
      tabs={pestanas}
    />
  )
}
