import type { ReactNode } from 'react'
import { Heading, Text } from '@ubits/flux-ui'

// Una sección dentro de la tarjeta de un paso: un título discreto, su bajada y sus campos. Es el mismo recurso de
// «Crear vacante» (Exploración 4): una sola tarjeta por paso con secciones separadas, en vez de una caja por grupo.

export function SeccionPaso({
  titulo,
  bajada,
  acciones,
  id,
  children,
}: {
  titulo: string
  bajada?: ReactNode
  /** A la derecha del título (p. ej. «Repartir automáticamente»). */
  acciones?: ReactNode
  /** Ancla para llegar por dirección (#ajustes-pesos). */
  id?: string
  children: ReactNode
}) {
  return (
    <section id={id} aria-label={titulo} className="flex scroll-mt-6 flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <Heading as="h3" level={6}>
            {titulo}
          </Heading>
          {bajada ? (
            <Text variant="muted" size="sm">
              {bajada}
            </Text>
          ) : null}
        </div>
        {acciones}
      </div>
      {children}
    </section>
  )
}
