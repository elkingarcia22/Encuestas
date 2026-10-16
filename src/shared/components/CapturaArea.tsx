import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { Button, Kbd } from '@ubits/flux-ui'

export type Recorte = { ancho: number; alto: number }

type CapturaAreaProps = {
  onCapturar: (recorte: Recorte) => void
  onCancelar: () => void
}

type Punto = { x: number; y: number }

// Lo mínimo que cuenta como un área: menos que esto es un clic suelto, no un recorte.
const MINIMO = 16

// Capa para capturar cualquier parte de la interfaz (1 oct, «Enviar feedback»): cubre la pantalla con un velo, la
// persona arrastra un rectángulo y al soltar se entrega su tamaño. La imagen es simulada: no se pide permiso al navegador.
// Teclado (AA 2.1.1): «Toda la pantalla» captura sin arrastrar y Esc cancela. Se anuncia como diálogo con su
// instrucción, y el foco entra a la capa al abrirse.
export function CapturaArea({ onCapturar, onCancelar }: CapturaAreaProps) {
  const capa = useRef<HTMLDivElement>(null)
  const [inicio, setInicio] = useState<Punto | null>(null)
  const [fin, setFin] = useState<Punto | null>(null)

  useEffect(() => {
    capa.current?.focus()
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onCancelar()
      }
    }
    window.addEventListener('keydown', alTeclear, true)
    return () => window.removeEventListener('keydown', alTeclear, true)
  }, [onCancelar])

  const area =
    inicio && fin
      ? {
          left: Math.min(inicio.x, fin.x),
          top: Math.min(inicio.y, fin.y),
          width: Math.abs(fin.x - inicio.x),
          height: Math.abs(fin.y - inicio.y),
        }
      : null

  const empezar = (e: PointerEvent<HTMLDivElement>) => {
    // Los botones de la instrucción no empiezan un recorte.
    if ((e.target as HTMLElement).closest('[data-instruccion]')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setInicio({ x: e.clientX, y: e.clientY })
    setFin({ x: e.clientX, y: e.clientY })
  }

  const mover = (e: PointerEvent<HTMLDivElement>) => {
    if (inicio) setFin({ x: e.clientX, y: e.clientY })
  }

  const soltar = () => {
    if (area && area.width >= MINIMO && area.height >= MINIMO) {
      onCapturar({ ancho: Math.round(area.width), alto: Math.round(area.height) })
      return
    }
    setInicio(null)
    setFin(null)
  }

  return createPortal(
    <div
      ref={capa}
      role="dialog"
      aria-modal="true"
      aria-label="Elegir un área para capturar"
      aria-describedby="captura-instruccion"
      tabIndex={-1}
      onPointerDown={empezar}
      onPointerMove={mover}
      onPointerUp={soltar}
      className="fixed inset-0 z-[100] cursor-crosshair bg-foreground/25 outline-none select-none animate-in fade-in duration-200"
    >
      {/* Instrucción arriba al centro, como una pastilla flotante. */}
      <div
        data-instruccion=""
        className="absolute top-5 left-1/2 flex -translate-x-1/2 cursor-default items-center gap-3 rounded-full border bg-popover py-1.5 pr-1.5 pl-4 text-sm text-popover-foreground shadow-lg"
      >
        <span id="captura-instruccion" className="whitespace-nowrap">
          Arrastra para elegir el área · <Kbd>Esc</Kbd> para cancelar
        </span>
        <Button
          size="sm"
          variant="outline"
          className="rounded-full!"
          onClick={() => onCapturar({ ancho: window.innerWidth, alto: window.innerHeight })}
        >
          Toda la pantalla
        </Button>
      </div>

      {/* El área elegida: sin velo por dentro, con borde azul y su medida debajo. */}
      {area ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-sm border-2 border-primary bg-background/20 shadow-[0_0_0_9999px_color-mix(in_oklch,var(--foreground)_10%,transparent)]"
          style={area}
        >
          {area.width >= MINIMO && area.height >= MINIMO ? (
            <span className="absolute top-full left-0 mt-1.5 rounded-sm bg-primary px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap tabular-nums text-primary-foreground">
              {Math.round(area.width)} × {Math.round(area.height)}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>,
    document.body,
  )
}
