import { Children, Fragment, type ReactNode } from 'react'
import { Frame, FrameDescription, FrameHeader, FrameTitle, ItemGroup, ItemSeparator } from '@ubits/flux-ui'

// El bloque de los drawers del módulo (cargar, comparar e importar encuestas, riesgos, banco de preguntas): un marco
// con su título y su recuento, y dentro los paneles. Las listas van sin borde propio (lo pone el marco) y con una
// línea entre fila y fila, no una tarjeta por fila.

export function MarcoLista({ titulo, descripcion, children }: { titulo: ReactNode; descripcion?: ReactNode; children: ReactNode }) {
  return (
    <Frame>
      <FrameHeader>
        <FrameTitle>{titulo}</FrameTitle>
        {descripcion ? <FrameDescription>{descripcion}</FrameDescription> : null}
      </FrameHeader>
      {children}
    </Frame>
  )
}

/** Una fila de la lista que se puede tocar (abre un caso, un detalle…): gris tenue al pasar el cursor y anillo al
 *  enfocarla con el teclado. Se extiende un poco hacia los lados para que el gris no quede pegado al borde del marco;
 *  la línea entre filas no se mueve. */
export const FILA_CLICABLE = 'w-[calc(100%+1rem)] max-w-none cursor-pointer rounded-md px-2! -mx-2 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none'

/** Las filas de una lista con una línea entre cada una. */
export function FilasSeparadas({ children, className }: { children: ReactNode; className?: string }) {
  const filas = Children.toArray(children)
  return (
    <ItemGroup className={`gap-0! ${className ?? ''}`}>
      {filas.map((fila, indice) => (
        <Fragment key={indice}>
          {indice > 0 ? <ItemSeparator /> : null}
          {fila}
        </Fragment>
      ))}
    </ItemGroup>
  )
}
