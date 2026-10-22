import { HugeiconsIcon } from '@hugeicons/react'
import { LinkSquare02Icon } from '@hugeicons/core-free-icons'
import { Button, FramePanel } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { Filas, Marco } from '@/modules/design-system/patrones/ficha'
import { cumplidosDe, type Candidatura } from '../datos'
import { pesoEnTexto } from '../importacion'
import { QUIEN_MUEVE } from '../movimientos'

// «Cómo llegó»: en el «Resumen» de quien entró por un lote de hojas de vida, igual en las tres exploraciones. De qué
// lote, de dónde venía (y quién la refirió), quién la subió y cuándo, la hoja de vida tal cual y si la IA dudó de algo.
// Quien aplicó por el portal no lo necesita: su origen ya está en la cabecera.
export function BloqueImportada({ candidatura }: { candidatura: Candidatura }) {
  const { importada, criterios } = candidatura
  if (!importada) return null
  const hora = new Date(importada.cuando).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })
  const por = importada.quien === QUIEN_MUEVE ? 'Tú' : importada.quien
  const cumple = cumplidosDe(criterios)
  const file = importada.file

  return (
    <Marco
      titulo="Cómo llegó"
      descripcion={`Entró con el lote «${importada.lote}», no por el portal.`}
      accion={
        <Badge variant="info-light" className="shrink-0">
          Importada
        </Badge>
      }
    >
      <FramePanel>
        <Filas
          filas={[
            { termino: 'De dónde viene', valor: `${importada.origen}${importada.referidoPor ? ` · la refirió ${importada.referidoPor}` : ''}` },
            { termino: 'La subió', valor: `${por} · hoy a las ${hora}` },
            {
              termino: 'CV',
              valor: file ? (
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto! p-0!"
                  onClick={() => window.open(URL.createObjectURL(file), '_blank', 'noopener')}
                >
                  <HugeiconsIcon icon={LinkSquare02Icon} size={14} />
                  {importada.archivo}
                </Button>
              ) : (
                `${importada.archivo} · ${pesoEnTexto(importada.peso)}${importada.deZip ? ` · venía en ${importada.deZip}` : ''}`
              ),
            },
            {
              termino: 'Lo que leyó la IA',
              valor: importada.confirmado ? 'Dudó de un dato y lo confirmaste' : 'Todo con seguridad',
            },
            ...(criterios.length
              ? [{ termino: 'Con los requisitos', valor: `Cumple ${cumple} de ${criterios.length}, según su CV` }]
              : []),
          ]}
        />
      </FramePanel>
    </Marco>
  )
}
