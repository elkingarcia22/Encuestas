import { Frame, FrameHeader, FramePanel, FrameTitle, Heading, Separator } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { AvanceObligatorios, ListaDatos } from '@/modules/admin/seleccion/vacantes/crear/components/piezas-resumen'

// «Vista previa» al crear un plan: el mismo panel de apoyo de Crear contenido y Diagnóstico (staging, David), con su
// misma anatomía —marco gris con la cabecera, arriba cómo va quedando, después los datos y al final lo que falta con su
// barra—, para que los asistentes de Aprendizaje se lean igual.

type Fila = { termino: string; valor: string }

export function ResumenPlan({ nombre, tipo, filas, falta, total }: { nombre: string; tipo: string; filas: Fila[]; falta: string[]; total: number }) {
  return (
    <Frame>
      <FrameHeader>
        <FrameTitle>Vista previa</FrameTitle>
      </FrameHeader>

      <FramePanel className="flex flex-col gap-4">
        {/* Arriba, cómo va quedando. Sin nombre todavía, el título va apagado para que no parezca un plan que ya se
            llama así. */}
        <div className="flex flex-col gap-2">
          <Heading as="h3" level={5} className={nombre ? 'break-words' : 'text-muted-foreground'}>
            {nombre || 'Sin nombre todavía'}
          </Heading>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" size="xs">
              {tipo}
            </Badge>
          </div>
        </div>

        <ListaDatos filas={filas} />

        {/* Lo que falta cierra el panel, siempre: igual que en Crear contenido. */}
        {filas.length ? <Separator /> : null}

        <AvanceObligatorios falta={falta} total={total} listo="Todo lo obligatorio está listo." />
      </FramePanel>
    </Frame>
  )
}
