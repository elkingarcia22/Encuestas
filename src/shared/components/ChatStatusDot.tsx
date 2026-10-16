import { useChatStatus } from '@/shared/components/chat-status'
import styles from '@/shared/components/chat-status.module.css'
import type { ChatStatus } from '@/shared/layouts/nav-config'

const LABEL: Record<ChatStatus, string> = {
  read: 'Leída',
  unread: 'Respuesta sin leer',
  thinking: 'El agente está trabajando',
}

// Punto de estado de una conversación de Suite AI, junto a su título (historial abierto y menú del riel).
// `active`: es la conversación abierta; si tenía respuesta sin leer, al abrirla queda leída.
export function ChatStatusDot({ path, status = 'read', active = false }: { path: string; status?: ChatStatus; active?: boolean }) {
  const shown = useChatStatus(path, status, active)

  return (
    <span className={styles.dot}>
      {shown === 'thinking' ? (
        <span aria-hidden="true" className={styles.thinking}>
          <span className={styles.core} />
        </span>
      ) : (
        <span aria-hidden="true" className={shown === 'unread' ? styles.unread : styles.read} />
      )}
      <span className="sr-only">{LABEL[shown]}</span>
    </span>
  )
}
