import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Chatting01Icon } from '@hugeicons/core-free-icons'
import { Button, Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@ubits/flux-ui'

import { Compositor } from '../components/compositor'
import { ruta } from '../components/data'
import { useSuite } from '../components/estado'
import { MensajesHilo, VistaChat } from '../components/vista-chat'

// Chats del historial sin caso propio (rotación, clima…) y el chat nuevo que nace del campo, del
// modo voz o del buscador.

export function Component() {
  const { id = '' } = useParams()
  const suite = useSuite()
  const [borrador, setBorrador] = useState('')
  const mensajes = suite.chats[id]

  if (!mensajes) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={Chatting01Icon} aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>Esta conversación ya no está</EmptyTitle>
            <EmptyDescription>Los chats nuevos del prototipo se borran al recargar la página.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button nativeButton={false} render={<Link to={ruta('chat')} />}>
              Nuevo chat
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  return (
    <VistaChat
      seguir={mensajes.length * 2 + (suite.pensando === id ? 1 : 0)}
      compositor={<Compositor valor={borrador} onValor={setBorrador} onEnviar={(texto) => suite.preguntar(id, texto)} />}
    >
      <MensajesHilo mensajes={mensajes} pensando={suite.pensando === id} />
    </VistaChat>
  )
}

Component.displayName = 'DesignSystemTemplateSuiteAiConversacion'
