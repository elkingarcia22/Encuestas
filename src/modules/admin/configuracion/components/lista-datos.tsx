import { Fragment, type ReactNode } from 'react'
import { Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle, Separator, Text } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import type { Dato } from './datos'

// Sección de solo lectura: marco con título y una lista de pares etiqueta/valor (no campos deshabilitados).
export function SeccionDatos({ titulo, descripcion, datos, children }: { titulo: string; descripcion?: string; datos?: Dato[]; children?: ReactNode }) {
  return (
    <Frame className="min-w-0">
      <FrameHeader className="[--frame-panel-header-gap:--spacing(1)]">
        <FrameTitle>{titulo}</FrameTitle>
        {descripcion ? <FrameDescription>{descripcion}</FrameDescription> : null}
      </FrameHeader>
      <FramePanel className="flex flex-col gap-5">
        {datos ? <ListaDatos datos={datos} /> : null}
        {children}
      </FramePanel>
    </Frame>
  )
}

export function ListaDatos({ datos }: { datos: Dato[] }) {
  return (
    <dl className="flex flex-col">
      {datos.map((dato, index) => (
        <Fragment key={dato.etiqueta}>
          {index ? <Separator /> : null}
          <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-1 py-3 first:pt-0 last:pb-0">
            <dt className="flex min-w-0 flex-col gap-1">
              <Text as="span" variant="muted" size="sm">
                {dato.etiqueta}
              </Text>
              {dato.ayuda ? (
                <Text as="span" variant="muted" size="xs">
                  {dato.ayuda}
                </Text>
              ) : null}
            </dt>
            <dd className="min-w-0 text-right">
              {dato.valor ? (
                dato.insignia ? (
                  <Badge variant={dato.insignia === 'success' ? 'success-light' : 'outline'}>{dato.valor}</Badge>
                ) : (
                  <Text as="span" size="sm" weight="medium">
                    {dato.valor}
                  </Text>
                )
              ) : (
                <Text as="span" variant="muted" size="sm">
                  {dato.vacio ?? 'Sin dato'}
                </Text>
              )}
            </dd>
          </div>
        </Fragment>
      ))}
    </dl>
  )
}
