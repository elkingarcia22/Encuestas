import type { ReactElement, ReactNode } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@ubits/flux-ui'

type Side = 'top' | 'bottom' | 'left' | 'right'

// Globo del tooltip, como el del Storybook (18 sep): esquinas de 8px, 13px de letra y 8px de aire arriba y abajo.
// Se le pasan esas tres medidas porque el tema del playground tiene la escala de radios y de texto más grande que la
// del Storybook, y con las clases de la librería (`rounded-md`, `text-xs`, `py-1.5`) salía en 12px de esquina,
// 12px de letra y 6px de aire. Antes llevaba además un `text-sm` nuestro que lo subía a 14px.
export function HintContent({ side = 'bottom', children }: { side?: Side; children: ReactNode }) {
  // El tamaño va como propiedad y no como clase `text-…`: el `cn` de la librería junta todas las `text-*` en un grupo,
  // y al pasarle `text-[13px]` se comía su `text-background`, dejando el texto negro sobre negro.
  return (
    <TooltipContent side={side} className="rounded-[0.5rem]! px-3! py-2! [font-size:13px]!">
      {children}
    </TooltipContent>
  )
}

// Tooltip para un botón (o el disparador de un menú, que va tal cual como hijo): `children` es el propio botón.
// `open`/`onOpenChange` lo controlan desde afuera, para el globo que solo se abre a veces (TextoCompleto: solo si el
// texto está cortado). Sin ellos se abre solo, como siempre.
export function Hint({
  label,
  side,
  children,
  open,
  onOpenChange,
}: {
  label: ReactNode
  side?: Side
  children: ReactElement
  open?: boolean
  onOpenChange?: (abierto: boolean) => void
}) {
  return (
    <Tooltip open={open} onOpenChange={onOpenChange}>
      {/* 200 ms, como los del header y la barra lateral: con los 600 ms de la librería el tooltip se sentía lento (29-sep). */}
      <TooltipTrigger delay={200} render={children} />
      <HintContent side={side}>{label}</HintContent>
    </Tooltip>
  )
}
