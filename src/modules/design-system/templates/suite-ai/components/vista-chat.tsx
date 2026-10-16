import { useEffect, useRef, type ReactNode } from 'react'
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  Text,
  useMessageScroller,
} from '@ubits/flux-ui'
import { UserBubble } from '@/modules/design-system/agente-contextual/components/agent-kit'
import { AiThinking } from '@/shared/components/AiThinking'

import type { Mensaje } from './data'
import { MensajeAgente } from './piezas'

// Una conversación a la altura de la pantalla: los mensajes se desplazan y el campo queda fijo
// abajo, como en el concepto. La altura descuenta el encabezado y el margen inferior de ShellUbits.
// Arranca arriba y baja al final solo cuando llega algo nuevo: «seguir» cambia con cada mensaje y
// con cada «pensando» (p. ej. mensajes × 2 + pensando, para que la respuesta también cuente).

export function SeguirAlFinal({ senal }: { senal: number }) {
  const { scrollToEnd } = useMessageScroller()
  const inicial = useRef(senal)
  useEffect(() => {
    if (senal !== inicial.current) scrollToEnd({ behavior: 'smooth' })
  }, [senal, scrollToEnd])
  return null
}

export function VistaChat({ children, compositor, seguir }: { children: ReactNode; compositor: ReactNode; seguir: number }) {
  return (
    <div className="mx-auto flex h-[calc(100svh-8rem)] min-h-[28rem] w-full max-w-3xl flex-col gap-4">
      <MessageScrollerProvider defaultScrollPosition="start">
        <SeguirAlFinal senal={seguir} />
        <MessageScroller className="min-h-0 flex-1">
          <MessageScrollerViewport aria-label="Conversación con el agente">
            <MessageScrollerContent className="gap-6 pt-2 pb-4">{children}</MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton aria-label="Ir al último mensaje" />
        </MessageScroller>
      </MessageScrollerProvider>
      {compositor}
    </div>
  )
}

// Cada mensaje va en su propio MessageScrollerItem para que el desplazamiento lo siga; los
// bloques fijos de cada caso (indicadores, propuesta, plan) también van en uno.
export function MensajesHilo({ mensajes, pensando }: { mensajes: Mensaje[]; pensando: boolean }) {
  return (
    <>
      {mensajes.map((mensaje) => (
        <MessageScrollerItem key={mensaje.id} messageId={mensaje.id}>
          {mensaje.autor === 'persona' ? (
            <UserBubble>{mensaje.texto}</UserBubble>
          ) : (
            <MensajeAgente>
              <Text>{mensaje.texto}</Text>
            </MensajeAgente>
          )}
        </MessageScrollerItem>
      ))}
      {pensando ? (
        <MessageScrollerItem>
          <AiThinking size="md" label="Revisando los datos de tu empresa…" />
        </MessageScrollerItem>
      ) : null}
    </>
  )
}
