import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { Button, Frame, FrameHeader, FramePanel, FrameTitle, Text } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { EtiquetaIA } from '@/modules/design-system/ia/etiqueta-ia'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'
import { BotonAyuda } from '@/shared/components/BotonAyuda'
import { PageSection } from '@/shared/components/PageShell'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { notify } from '@/shared/components/notify'
import { CONFIANZA, numero, type Hallazgo, type PestanaId, type Resultados } from './datos'

// Análisis con IA: qué significa todo lo demás.
//
// Las otras pestañas dicen qué pasó; esta dice **dónde mirar y por qué**. Dos reglas que se trajeron de Resultados de
// encuestas y que son lo que la hace confiable:
//
// 1. Cada afirmación lleva su **nivel de confianza**: con quince personas no se concluye igual que con quinientas, y
//    callarlo convierte una señal en una verdad.
// 2. Cada afirmación **lleva a su evidencia**: el enlace abre la pestaña donde están los números que la sostienen. Un
//    hallazgo que no se puede comprobar no sirve para defender una decisión.

function TarjetaHallazgo({ hallazgo, onIr }: { hallazgo: Hallazgo; onIr: (destino: PestanaId) => void }) {
  const confianza = CONFIANZA[hallazgo.confianza]
  return (
    <Frame>
      <FrameHeader>
        <FrameTitle>
          {/* El orbe marca que lo escribió la IA: va en el título porque la tarjeta entera es suya. */}
          <span className="flex min-w-0 items-center gap-2">
            <IconoIA />
            {hallazgo.titulo}
          </span>
        </FrameTitle>
      </FrameHeader>
      <FramePanel className="flex flex-col gap-3">
        <Text as="p" size="sm">
          {hallazgo.detalle}
        </Text>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-1">
            <Badge variant="secondary" size="sm">
              {confianza.etiqueta}
            </Badge>
            <BotonAyuda etiqueta={`Qué significa ${confianza.etiqueta.toLowerCase()}`}>{confianza.descripcion}</BotonAyuda>
          </span>
          {hallazgo.ir ? (
            // El enlace a la evidencia: sin él, el hallazgo es una opinión.
            <Button variant="ghost" size="sm" onClick={() => onIr(hallazgo.ir as PestanaId)}>
              Ver los datos
              <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      </FramePanel>
    </Frame>
  )
}

export function AnalisisIa({ resultados, onIr }: { resultados: Resultados; onIr: (destino: PestanaId) => void }) {
  const { hallazgos, inscritos } = resultados

  if (hallazgos.length === 0) {
    return (
      <PageSection title="Análisis con IA" description="Lo que la IA lee de los resultados de este contenido.">
        <PrimeraVez icono="glass-search" titulo="Todavía no hay suficiente para analizar" descripcion="Cuando más personas recorran el contenido, aquí aparecerá qué está funcionando y dónde se traba la gente." />
      </PageSection>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageSection
        title={
          <span className="flex items-center gap-2">
            <IconoIA />
            Lo que vemos en este contenido
          </span>
        }
        description={`Leído sobre ${inscritos === 1 ? 'la única persona inscrita' : `las ${numero(inscritos)} personas inscritas`}. Cada punto enlaza a los datos que lo sostienen, para que puedas comprobarlo antes de decidir.`}
        actions={
          <div className="flex items-center gap-2">
            <EtiquetaIA>Generado con IA</EtiquetaIA>
            {/* Los botones de IA van al final de la fila, a la derecha de todo. */}
            <BotonIaSecundario onClick={() => notify('Analizando de nuevo', 'La IA está releyendo los resultados con los datos de hoy.', 'info')}>Volver a analizar</BotonIaSecundario>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          {hallazgos.map((hallazgo) => (
            <TarjetaHallazgo key={hallazgo.id} hallazgo={hallazgo} onIr={onIr} />
          ))}
        </div>
      </PageSection>

    </div>
  )
}
