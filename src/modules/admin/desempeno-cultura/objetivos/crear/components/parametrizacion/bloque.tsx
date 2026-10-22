import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon } from '@hugeicons/core-free-icons'
import { Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'

export function Bloque({
  id,
  titulo,
  ayuda,
  conError,
  children,
}: {
  id: string
  titulo: string
  ayuda: string
  conError: boolean
  children: ReactNode
}) {
  return (
    <Frame id={`bloque-${id}`} className="scroll-mt-24">
      {/* El título y la bajada del marco del sistema (FrameTitle, FrameDescription), como «Datos generales» de Crear encuesta. */}
      <FrameHeader>
        <div className="flex min-w-0 flex-1 items-center gap-3 pe-2 text-left">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <FrameTitle>{titulo}</FrameTitle>
            <FrameDescription>{ayuda}</FrameDescription>
          </div>
          {conError ? (
            <Badge variant="destructive-outline" size="sm" className="shrink-0">
              <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />
              Falta
            </Badge>
          ) : null}
        </div>
      </FrameHeader>
      <FramePanel className="flex flex-col gap-6">{children}</FramePanel>
    </Frame>
  )
}
