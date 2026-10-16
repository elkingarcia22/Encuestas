import { HugeiconsIcon } from '@hugeicons/react'
import { RotateLeft01Icon } from '@hugeicons/core-free-icons'
import { Button, Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@ubits/flux-ui'
import { ImagenGlass } from '@/shared/components/ImagenGlass'

// Una sola forma de decir que la IA falló en Encuestas (Elkin, 14-oct): el «Error de carga» del design system
// (Estados › Estados vacíos), con la ilustración glass, qué pasó en una línea y «Reintentar». En su lugar no queda
// nada hecho por la IA —ni la lectura anterior, ni un resumen, ni cifras suyas—: solo el vacío y la salida.
// Se usa en Análisis con IA (IA-031), en Insights IA del comparativo (IA-039) y al importar participantes (IA-026).

export function FallaIa({
  titulo,
  descripcion,
  onReintentar,
  otra,
  className,
}: {
  titulo: string
  descripcion: string
  onReintentar: () => void
  /** Una segunda salida, a la izquierda de «Reintentar» (p. ej. «Elegir otro archivo»). */
  otra?: { texto: string; onClick: () => void }
  className?: string
}) {
  return (
    <Empty className={className ?? 'py-12'}>
      <EmptyHeader>
        <EmptyMedia variant="default">
          <ImagenGlass nombre="glass-danger" />
        </EmptyMedia>
        <EmptyTitle>{titulo}</EmptyTitle>
        <EmptyDescription>{descripcion}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center gap-2">
        {otra ? (
          <Button variant="outline" onClick={otra.onClick}>
            {otra.texto}
          </Button>
        ) : null}
        <Button onClick={onReintentar}>
          <HugeiconsIcon icon={RotateLeft01Icon} aria-hidden="true" />
          Reintentar
        </Button>
      </EmptyContent>
    </Empty>
  )
}
