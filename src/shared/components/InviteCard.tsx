import type { CSSProperties } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Clock01Icon, Cursor01Icon } from '@hugeicons/core-free-icons'
import { Button } from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { CloseButton } from '@/shared/components/CloseButton'

type InviteCardProps = {
  onClose: () => void
  // «Hacer el tour»: abre el tour del nuevo UBITS (TourDialog). En las copias del design system, que no montan el
  // tour, avisa.
  onTour?: () => void
}

// Ubica una pieza a partir del centro de la ilustración (x, y en px), centrada sobre ese punto.
function at(x: number, y: number): CSSProperties {
  return { left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }
}

const PIECE = 'absolute -translate-x-1/2 -translate-y-1/2'

// Ilustración del tour (1 oct): la plataforma renovada en miniatura con un recorrido guiado encima. Sobre la baldosa
// con degradado azul suave va una ventana del producto (barra lateral, una fila de título y dos bloques); uno de los
// bloques está resaltado como en un tour, con el cursor encima y la pastilla «Paso 1 de 3» al lado. Abajo a la
// izquierda, «2 min», lo que dura el recorrido. La esquina de arriba a la derecha queda libre para la X. Todo con tokens
// del tema (se adapta al oscuro) y decorativo: el texto de la tarjeta ya dice lo mismo.
function TourPreview() {
  return (
    <div
      aria-hidden="true"
      className="relative m-1.5 mb-0 h-26 overflow-hidden rounded-lg border bg-linear-to-b from-primary/12 via-primary/6 to-primary/2"
    >
      {/* Resplandor detrás de la ventana. */}
      <span className={`${PIECE} h-20 w-40 rounded-full bg-primary/12 blur-xl`} style={at(-6, 4)} />

      {/* La ventana del producto renovado. */}
      <span
        className={`${PIECE} flex h-18 w-36 flex-col overflow-hidden rounded-md border bg-card shadow-sm`}
        style={at(-10, 4)}
      >
        <span className="flex items-center gap-1 border-b px-2 py-1.5">
          <span className="size-1.5 rounded-full bg-border" />
          <span className="size-1.5 rounded-full bg-border" />
          <span className="size-1.5 rounded-full bg-border" />
        </span>
        <span className="flex min-h-0 flex-1">
          <span className="flex w-7 flex-col gap-1.5 border-r bg-muted/60 px-1.5 py-2">
            <span className="h-1 rounded-full bg-primary/50" />
            <span className="h-1 rounded-full bg-foreground/15" />
            <span className="h-1 rounded-full bg-foreground/15" />
          </span>
          <span className="flex flex-1 flex-col gap-1.5 p-2">
            <span className="h-1.5 w-12 rounded-full bg-foreground/20" />
            <span className="flex flex-1 gap-1.5">
              {/* El bloque que el tour está mostrando. */}
              <span className="flex-1 rounded-sm bg-primary/10 ring-2 ring-primary" />
              <span className="flex-1 rounded-sm bg-muted" />
            </span>
          </span>
        </span>
      </span>

      {/* Cursor sobre el bloque resaltado. */}
      <span className={`${PIECE} text-foreground drop-shadow-sm`} style={at(-2, 22)}>
        <HugeiconsIcon icon={Cursor01Icon} size={16} strokeWidth={2} />
      </span>

      {/* Indicación del recorrido, al lado de la ventana. */}
      <span
        className={`${PIECE} rounded-full bg-primary px-2 py-0.5 text-[10.5px] font-semibold whitespace-nowrap text-primary-foreground shadow-xs`}
        style={at(66, 10)}
      >
        Paso 1 de 3
      </span>

      {/* Lo que dura el tour. */}
      <span
        className={`${PIECE} flex items-center gap-1 rounded-full border bg-card py-0.5 pr-2 pl-1 shadow-xs`}
        style={at(-70, 34)}
      >
        <HugeiconsIcon icon={Clock01Icon} size={12} strokeWidth={2} className="text-primary" />
        <span className="text-[10.5px] font-semibold whitespace-nowrap">2 min</span>
      </span>
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
