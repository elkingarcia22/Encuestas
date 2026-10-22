import { Link } from 'react-router'
import { Button, Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle, Text } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { TextoCompleto } from '@/shared/components/TextoCompleto'
import { ASUNTOS_ATENCION, PRIORIDADES, type AsuntoAtencion } from './para-atender-datos'

// «Para atender» de la Super Home (13 oct, Carlos): el diseño de «Para atender» de Encuestas
// (desempeno-cultura/encuestas/components/riesgos/panel-riesgos.tsx) con los asuntos de toda la empresa: cada uno con su
// urgencia, qué pasa, por qué importa y la acción que lo resuelve. Reemplaza a la lista «Necesita tu atención».
// Sin contadores ni «Ver todos» (13 oct): solo los tres más urgentes, en una fila. Los datos ya vienen ordenados de lo
// más urgente a lo que puede esperar.

const EN_EL_HOME = 3

type Entrada = { clase: string; desde: number; paso: number }

const insignia = (asunto: AsuntoAtencion) => PRIORIDADES.find((opcion) => opcion.valor === asunto.prioridad) ?? PRIORIDADES[1]

export function ParaAtender({ enlace, entrada }: { enlace: (destino: string) => string; entrada?: Entrada }) {
  return (
    <section aria-labelledby="para-atender" className="min-w-0">
      <Frame>
        <FrameHeader>
          <FrameTitle id="para-atender">Para atender</FrameTitle>
          <FrameDescription>Lo más urgente, con la acción que lo resuelve.</FrameDescription>
        </FrameHeader>

        {/* Los tres más urgentes en fila, uno por columna con divisores, como en Encuestas. */}
        <FramePanel className="divide-border grid gap-5 lg:grid-cols-3 lg:gap-0 lg:divide-x">
          {ASUNTOS_ATENCION.slice(0, EN_EL_HOME).map((asunto, columna) => (
            <div
              key={asunto.id}
              className={`flex min-w-0 flex-col gap-3 lg:px-5 lg:first:ps-0 lg:last:pe-0 ${entrada?.clase ?? ''}`}
              style={entrada ? { animationDelay: `${entrada.desde + columna * entrada.paso}ms` } : undefined}
            >
              <div className="flex min-w-0 flex-col gap-1">
                <div className="flex min-w-0 items-center gap-2">
                  <Badge variant={insignia(asunto).insignia} size="sm" className="shrink-0">
                    {insignia(asunto).titulo}
                  </Badge>
                  <TextoCompleto texto={`${asunto.modulo} · ${asunto.cuando}`}>
                    <Text as="span" size="sm" variant="muted" className="truncate">
                      {asunto.modulo} · {asunto.cuando}
                    </Text>
                  </TextoCompleto>
                </div>
                <Text as="span" size="sm" weight="semibold" className="line-clamp-1">
                  {asunto.titulo}
                </Text>
                <Text as="p" size="xs" variant="muted" className="line-clamp-2">
                  {asunto.impacto}
                </Text>
              </div>
              <div className="mt-auto flex items-center">
                <Button variant="outline" size="sm" nativeButton={false} render={<Link to={enlace(asunto.destino)} />}>
                  {asunto.accion}
                </Button>
              </div>
            </div>
          ))}
        </FramePanel>
      </Frame>
    </section>
  )
}
