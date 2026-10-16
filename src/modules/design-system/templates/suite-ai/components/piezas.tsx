import type { ReactNode } from 'react'
import { cn, Message, MessageAvatar, MessageContent } from '@ubits/flux-ui'
import { Orb } from '@/shared/components/Orb'

import logoMeta from '../assets/meta.png'

// Piezas pequeñas del template: el logo de la empresa (imagen del concepto de Nicolás) y la respuesta del agente en
// el chat. El orbe es el oficial (Orb), la burbuja de la persona es UserBubble del agent-kit y el «Razonando» es
// AiThinking: aquí ya no se rehacen.

export function LogoEmpresa({ className }: { className?: string }) {
  return <img src={logoMeta} alt="Meta" className={cn('h-5 w-auto shrink-0', className)} />
}

// Respuesta del agente en el chat completo: orbe de 24 px arriba, junto a la primera línea, y el contenido al lado
// (texto, tarjetas, planes). Es la misma disposición que AgentMessage del chat de Suite AI, que no se usa aquí porque
// solo recibe texto y le suma sus acciones (copiar, útil, regenerar).
export function MensajeAgente({ children }: { children: ReactNode }) {
  return (
    <Message className="gap-3">
      <MessageAvatar className="self-start">
        <Orb className="size-6" />
      </MessageAvatar>
      <MessageContent className="min-w-0 flex-1 gap-3">{children}</MessageContent>
    </Message>
  )
}
