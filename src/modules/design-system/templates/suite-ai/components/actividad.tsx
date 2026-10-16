import {
  Badge,
  Button,
  Heading,
  ScrollArea,
  Separator,
  Text,
  Timeline,
  TimelineContent,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from '@ubits/flux-ui'

import { useSuite } from './estado'

// Panel acoplado del caso 05: lo que el agente va haciendo, paso a paso y en vivo.

export function ActividadAgente() {
  const suite = useSuite()
  const hechos = suite.actividad.filter((a) => a.estado === 'hecho').length

  return (
    <>
      <div className="flex items-center justify-between gap-2 px-5 py-5">
        <Heading as="h2" level={6}>
          Actividad del agente
        </Heading>
        <Badge variant="warning-light" size="sm">
          En vivo
        </Badge>
      </div>
      <Separator />
      <ScrollArea className="min-h-0 flex-1">
        <div className="p-5" aria-live="polite">
          <Timeline orientation="vertical" value={hechos}>
            {suite.actividad.map((entrada, indice) => (
              <TimelineItem key={`${entrada.titulo}-${indice}`} step={indice + 1}>
                <TimelineHeader>
                  <TimelineSeparator />
                  <TimelineTitle>{entrada.titulo}</TimelineTitle>
                  <TimelineIndicator />
                </TimelineHeader>
                <TimelineContent className="flex flex-col gap-1">
                  <Text as="span" variant="muted" size="sm">
                    {entrada.detalle}
                  </Text>
                  {entrada.hora ? (
                    <Text as="span" variant="muted" size="xs">
                      {entrada.hora}
                    </Text>
                  ) : null}
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </div>
      </ScrollArea>
      <Separator />
      <div className="flex flex-col items-start gap-2 p-5">
        <div className="flex flex-col gap-1">
          <Text as="span" variant="muted" size="xs" weight="medium">
            Si cierras el chat
          </Text>
          <Text variant="muted" size="sm">
            El plan queda guardado y los procesos siguen corriendo. Cerrar no cancela nada.
          </Text>
        </div>
        <Button variant="outline" size="sm" className="mt-1" onClick={suite.verProcesos}>
          Ver todos los procesos
        </Button>
      </div>
    </>
  )
}
