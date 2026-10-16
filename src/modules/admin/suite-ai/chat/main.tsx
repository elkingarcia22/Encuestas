import { useParams } from 'react-router'
import { ChatView } from './components/chat-view'
import { isConvoId } from '../shared/data'

// /suite-ai → chat nuevo · /suite-ai/chat/:convo → una conversación del historial.
export function Component() {
  const { convo } = useParams()
  const id = isConvoId(convo) ? convo : 'new'

  return <ChatView convo={id} />
}

Component.displayName = 'SuiteAiChatPage'
