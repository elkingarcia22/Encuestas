import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon } from '@hugeicons/core-free-icons'
import { Badge, Frame, FrameHeader, FramePanel, Text } from '@ubits/flux-ui'
import { TextoCompleto } from '@/shared/components/TextoCompleto'

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
      <FrameHeader>
        <div className="flex min-w-0 flex-1 items-center gap-3 pe-2 text-left">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <Text as="span" weight="semibold" size="sm">
              {titulo}
            </Text>
            <TextoCompleto texto={ayuda}>
              <Text as="span" variant="muted" size="xs" weight="normal" className="line-clamp-1">
                {ayuda}
              </Text>
            </TextoCompleto>
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
