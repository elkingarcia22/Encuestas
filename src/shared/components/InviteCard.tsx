import { Button } from '@ubits/flux-ui'
import tourPortada from '@/shared/assets/tour-portada.webp'
import { notify } from '@/shared/components/notify'
import { CloseButton } from '@/shared/components/CloseButton'

type InviteCardProps = {
  onClose: () => void
  // «Hacer el tour»: abre el tour del nuevo UBITS (TourDialog). En las copias del design system, que no montan el
  // tour, avisa.
  onTour?: () => void
}

// Portada del tour (13 oct, Carlos): una imagen abstracta de pastillas de vidrio en azules, morados y naranjas, en vez
// de la ventana del producto en miniatura que se dibujaba con código (1 oct). Es vertical y la baldosa es apaisada:
// se recorta centrada en la zona de las pastillas, que es la más rica. Decorativa: el texto de la tarjeta ya lo dice.
// La esquina de arriba a la derecha queda para la X, que va encima.
function TourPreview() {
  return (
    <div aria-hidden="true" className="relative m-1.5 mb-0 h-26 overflow-hidden rounded-lg border">
      <img src={tourPortada} alt="" className="size-full object-cover object-[50%_45%]" draggable={false} />
    </div>
  )
}

// Tarjeta del tour del pie de la barra lateral (antes «Invita a tu equipo de RH»): la ilustración arriba con la X para cerrar, cuerpo
// con título y bajada, y un pie separado por una línea con la acción a la izquierda y el estado a la derecha.
export function InviteCard({ onClose, onTour }: InviteCardProps) {
  return (
    // Una sola tarjeta (sin el marco gris de afuera): filo fino, sombra suave y esquinas de 16px, concéntricas con la
    // baldosa de la ilustración (6px de aire y 10px de esquina).
    <div className="rounded-xl border bg-card text-card-foreground shadow-xs">
        <div className="relative">
          <TourPreview />
          <CloseButton label="Cerrar tarjeta del tour" className="absolute top-3 right-3" onClick={onClose} />
        </div>

        <div className="flex flex-col gap-1 px-4 pt-3.5 pb-4">
          {/* Textos del tour (1 oct): la experiencia cambió y la tarjeta invita a recorrerla. */}
          <span className="text-[15px] leading-5 font-semibold">Nos renovamos para ti</span>
          <span className="text-[13px] leading-[1.45] text-muted-foreground">
            Una experiencia más simple, rápida e intuitiva. Conócela en 2 minutos.
          </span>
        </div>

        {/* Solo el botón: el conteo de cupos se quitó (pedido de diseño). */}
        {/* El botón ocupa todo el ancho de la tarjeta (18 sep). */}
        <div className="flex border-t px-3 py-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onTour ?? (() => notify('Aquí se abre el tour del nuevo UBITS'))}
          >
            Hacer el tour
          </Button>
        </div>
    </div>
  )
}
