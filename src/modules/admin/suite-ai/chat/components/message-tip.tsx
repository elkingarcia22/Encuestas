import type { ReactElement, ReactNode } from 'react'
import { Tooltip, TooltipTrigger } from '@ubits/flux-ui'
import { HintContent } from '@/shared/components/Hint'

// Botón de acción de un mensaje con su nombre en un tooltip (los botones son solo icono).
export function MessageTip({ label, render, children }: { label: string; render: ReactElement; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger render={render}>{children}</TooltipTrigger>
      <HintContent side="bottom">{label}</HintContent>
    </Tooltip>
  )
}
