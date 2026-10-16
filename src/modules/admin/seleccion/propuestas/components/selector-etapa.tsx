import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDataTransferHorizontalIcon, ArrowDown01Icon } from '@hugeicons/core-free-icons'
import { Button, Text } from '@ubits/flux-ui'
import { tituloEtapa } from '../datos'

// Dónde está la persona, y el control para cambiarla de etapa. Abre la ventana de mover (`dialogo-mover.tsx`): ahí se
// elige la etapa, se ve qué pasa con eso (si se salta etapas, si vuelve, si deja una entrevista de IA a medias), se
// le puede escribir a la persona y dejar un comentario. Al lado, el botón azul avanza a la siguiente en un clic.
//
// Antes era un menú con la lista de etapas (25 sep): elegía rápido, pero no dejaba escribirle ni comentar, y un salto
// de tres etapas se hacía sin decir qué quedaba sin hacer. Antes aún, un botón partido que Nicolás no entendió (24 sep:
// «de verdad esto no se entiende»).
export function SelectorEtapa({
  actual,
  onElegir,
  comoAccion = false,
}: {
  actual: string
  onElegir: () => void
  // Donde la etapa ya se lee al lado (la tarjeta de proceso de la ficha), el botón dice la acción: «Mover a otra
  // etapa». Nicolás (24 sep): «¿y cómo avanzo de 1 a 4?» — tocar el recorrido no se descubría.
  comoAccion?: boolean
}) {
  return (
    <Button
      variant="outline"
      onClick={onElegir}
      aria-haspopup="dialog"
      aria-label={comoAccion ? 'Mover a otra etapa' : `Etapa: ${tituloEtapa(actual)}. Mover a otra etapa`}
    >
      {comoAccion ? (
        // En la barra angosta (el cajón de la exploración 2) solo «Mover», para que la barra no se parta en dos
        // renglones: la barra que lo contiene es el contenedor que se mide.
        <>
          <HugeiconsIcon icon={ArrowDataTransferHorizontalIcon} size={16} />
          <span>
            Mover<span className="hidden @xl:inline"> a otra etapa</span>
          </span>
        </>
      ) : (
        <>
          <Text as="span" variant="muted">
            Etapa:
          </Text>
          {tituloEtapa(actual)}
          <HugeiconsIcon icon={ArrowDown01Icon} size={16} />
        </>
      )}
    </Button>
  )
}
