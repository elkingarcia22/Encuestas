import { Message } from '@ubits/flux-ui'
import { AiThinking } from '@/shared/components/AiThinking'

// «Razonando…» mientras el agente prepara la respuesta (chat de Suite AI, panel del agente y editor de LMS).
// `region`: nombre en la anatomía de los configuradores; solo agrega el atributo.
export function TypingIndicator({ region, label }: { region?: string; label?: string }) {
  return (
    <Message data-region={region} className="items-center">
      <AiThinking size="md" label={label} />
    </Message>
  )
}
