import { HugeiconsIcon } from '@hugeicons/react'
import { PauseIcon, PlayIcon } from '@hugeicons/core-free-icons'
import { Button } from '@ubits/flux-ui'
import { Hint } from '@/shared/components/Hint'

// Escuchar la muestra de una voz: el mismo botón en la tarjeta de voz del setup de video, en la lista del modal de
// voces y en el roleplay. Antes estaba de tres formas —gris relleno, azul primario y contorno redondo—, para la misma
// acción y a veces en la misma pantalla. Queda en **el secundario de solo icono**, que en Design system › Botones es
// la variante `outline`; `secondary` es el «relleno gris», que ahí está marcado como «no lo uses hasta que el equipo
// lo decida». Sin redondear: en esa misma página no hay botones redondos (Dave, 1-oct).

export function BotonMuestra({
  disponible,
  sonando,
  onAlternar,
  etiqueta,
}: {
  disponible: boolean
  sonando: boolean
  onAlternar: () => void
  etiqueta: string
}) {
  const texto = !disponible ? 'Muestra disponible próximamente' : sonando ? 'Detener muestra' : etiqueta
  return (
    <Hint label={texto}>
      {/* El `span` recibe el globo aunque el botón esté deshabilitado: un botón apagado no dispara el hover. */}
      <span className="inline-flex">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label={texto}
          disabled={!disponible}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onAlternar()
          }}
        >
          <HugeiconsIcon icon={sonando ? PauseIcon : PlayIcon} size={14} aria-hidden="true" />
        </Button>
      </span>
    </Hint>
  )
}
