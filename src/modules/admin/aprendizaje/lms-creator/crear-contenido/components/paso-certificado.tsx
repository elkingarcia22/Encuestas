import { Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle, Label, Switch, Text, cn } from '@ubits/flux-ui'
import type { Borrador } from './borrador'
import { Columna, DOS_COLUMNAS, Rotulo } from './columna'
import { PLANTILLAS, VistaCertificado } from './certificado'
import { Selector } from './selector'

// Paso 3 · Certificado, con la forma de la exploración 1: a la izquierda la pregunta —¿entrega certificado al terminar?—
// y, si la respuesta es que sí, con qué diseño; a la derecha el certificado de verdad, con el nombre de este contenido y
// no una plantilla genérica. Apagado no desaparece: se ve en gris, para decidir mirando lo que se está decidiendo.
//
// La plantilla se elige en una lista (Selector) y no en tarjetas: una empresa puede tener decenas. La visibilidad, los
// pesos y la navegación viven en el paso 4 · Ajustes (paso-ajustes).

type Props = {
  borrador: Borrador
  onCambio: (cambio: Partial<Borrador> | ((b: Borrador) => Partial<Borrador>)) => void
}

/** Qué trae cada plantilla, en una línea: «Dos firmas · con la duración». */
function detallePlantilla(p: (typeof PLANTILLAS)[number]) {
  return [p.firmas.length > 1 ? 'Dos firmas' : 'Una firma', p.tiempo ? 'con la duración' : 'sin la duración', p.documento ? 'con documento' : '']
    .filter(Boolean)
    .join(' · ')
}

export function PasoCertificado({ borrador, onCambio }: Props) {
  const { certificado } = borrador
  const activo = certificado.habilitado
  const elegida = PLANTILLAS.find((p) => p.id === certificado.plantilla)
  const cosa = borrador.ruta ? 'la ruta' : borrador.evento ? 'el evento' : 'el contenido'

  return (
    <div className={cn('grid items-start gap-4', DOS_COLUMNAS)}>
      <div className="flex flex-col gap-4">
        <Frame>
          <FrameHeader>
            <FrameTitle>¿Entrega certificado al terminar?</FrameTitle>
            <FrameDescription>Tu equipo lo descarga desde su historial, y tú desde Aprendizaje › Certificados.</FrameDescription>
          </FrameHeader>
          <FramePanel>
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 flex-col gap-0.5">
                <Label htmlFor="cc-cert">Entregar certificado</Label>
                <Text as="span" variant="muted" size="sm">
                  {/* Una evaluación también es una página: nombrarla aparte sobra y hace creer que es otra condición. */}
                  {activo
                    ? borrador.ruta
                      ? 'Se entrega al completar todos los contenidos de la ruta.'
                      : 'Se entrega al completar todas las páginas.'
                    : `Quien termine ${cosa} no recibe certificado.`}
                </Text>
              </div>
              <Switch
                id="cc-cert"
                checked={activo}
                onCheckedChange={(habilitado) => onCambio((b) => ({ certificado: { ...b.certificado, habilitado } }))}
              />
            </div>
          </FramePanel>
        </Frame>

        {activo ? (
          <Frame>
            <FrameHeader>
              <FrameTitle>Diseño</FrameTitle>
              <FrameDescription>Las plantillas se crean en Aprendizaje › Certificados.</FrameDescription>
            </FrameHeader>
            <FramePanel>
              <Selector
                id="cc-plantilla"
                etiqueta="Plantilla"
                valor={certificado.plantilla}
                opciones={PLANTILLAS.map((p) => ({ value: p.id, label: p.nombre }))}
                onCambio={(plantilla) => onCambio((b) => ({ certificado: { ...b.certificado, plantilla } }))}
                descripcion={elegida ? detallePlantilla(elegida) : undefined}
              />
            </FramePanel>
          </Frame>
        ) : null}
      </div>

      {/* El mismo panel de «Vista previa» del paso 2: el rótulo arriba y, a su derecha, si se entrega o no. */}
      <Columna titulo="Vista previa" accion={<Rotulo>{activo ? 'Así lo recibe quien termina' : 'Así se vería, si lo entregas'}</Rotulo>}>
        <div className="min-w-0 p-4">
          <VistaCertificado borrador={borrador} className={cn('transition-opacity', !activo && 'opacity-40 grayscale')} />
        </div>
      </Columna>
    </div>
  )
}
