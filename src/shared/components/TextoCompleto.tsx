import { cloneElement, useState, type ReactElement, type ReactNode, type SyntheticEvent } from 'react'
import { Hint } from '@/shared/components/Hint'

// Texto que se corta con puntos suspensivos (`truncate` o `line-clamp-*`) y dice su contenido completo en un tooltip, pero solo
// cuando de verdad está cortado: si cabe entero no hay nada que mostrar y el globo no aparece. `children` es el propio texto
// (un Text, un ItemTitle, un span…) ya con su clase de corte; `texto` es lo que dice el tooltip, normalmente el mismo texto.
// Se abre al pasar el cursor o con el teclado (foco), como el resto de los tooltips del producto.
// Es el globo del sistema (Hint, con sus 200 ms y su medida), controlado para que solo se abra si el texto está cortado
// (7-oct: pieza oficial; antes armaba el Tooltip de la librería por su cuenta).

const estaCortado = (nodo: HTMLElement) => nodo.scrollWidth > nodo.clientWidth + 1 || nodo.scrollHeight > nodo.clientHeight + 1

export function TextoCompleto({ texto, children, side = 'top' }: { texto: ReactNode; children: ReactElement<{ onMouseEnter?: (evento: SyntheticEvent<HTMLElement>) => void; onFocus?: (evento: SyntheticEvent<HTMLElement>) => void }>; side?: 'top' | 'bottom' | 'left' | 'right' }) {
  const [abierto, setAbierto] = useState(false)
  const revisar = (evento: SyntheticEvent<HTMLElement>) => setAbierto(estaCortado(evento.currentTarget))

  return (
    <Hint
      side={side}
      open={abierto}
      onOpenChange={(siguiente) => (siguiente ? undefined : setAbierto(false))}
      label={<span className="block max-w-80 break-words whitespace-normal">{texto}</span>}
    >
      {cloneElement(children, {
        onMouseEnter: (evento: SyntheticEvent<HTMLElement>) => {
          children.props.onMouseEnter?.(evento)
          revisar(evento)
        },
        onFocus: (evento: SyntheticEvent<HTMLElement>) => {
          children.props.onFocus?.(evento)
          revisar(evento)
        },
      })}
    </Hint>
  )
}
