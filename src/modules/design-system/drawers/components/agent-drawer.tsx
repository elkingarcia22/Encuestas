import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { File01Icon } from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  Button,
} from '@ubits/flux-ui'
import { Composer } from '@/modules/admin/suite-ai/shared/composer'
import { AgentNote, UserBubble } from '../../agente-contextual/components/agent-kit'
import { notify } from '@/shared/components/notify'
import { DrawerShell } from './drawer-shell'
import { KICKER, PILL } from './drawer-styles'

type Props = { open: boolean; onOpenChange: (open: boolean) => void }

const PICKS = [
  { initials: 'LM', name: 'Laura Méndez', match: 86, why: 'Mejor prueba técnica y experiencia en analítica comercial.' },
  { initials: 'AM', name: 'Andrés Malo', match: 81, why: 'Lideró un tablero de rotación en su empresa actual.' },
  { initials: 'JR', name: 'Julián Rojas', match: 77, why: 'Buen ajuste cultural; SQL por reforzar.' },
]

// Caso de Suite AI: el agente trabaja sobre el registro abierto sin sacar a la persona de la lista.
export function AgentDrawer({ open, onOpenChange }: Props) {
  const [applied, setApplied] = useState(false)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<{ role: 'user' | 'agent'; text: string }[]>([])

  const send = () => {
    const text = draft.trim()
    if (!text) return
    setDraft('')
    setMessages((all) => [...all, { role: 'user', text }])
    window.setTimeout(() => {
      setMessages((all) => [
        ...all,
        { role: 'agent', text: 'Lo revisé con los 12 candidatos de la vacante. La prioridad se mantiene; te aviso si cambia algo después de las entrevistas.' },
      ])
    }, 800)
  }

  return (
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      size="md"
      ai
      title="Orbit Flow"
      description="Trabaja sobre la vacante abierta"
      headerExtra={
        <div className="flex items-center gap-2 border-b bg-muted px-5 py-2.5 text-[13px] text-muted-foreground">
          <HugeiconsIcon icon={File01Icon} className="size-4 shrink-0" />
          Contexto: <span className="text-foreground">Analista de datos</span> · 12 candidatos
        </div>
      }
      footerClassName="bg-background! px-4!"
      footer={
        // La caja de escribir del chat de Suite AI, la misma del panel del agente contextual (22 sep).
        <Composer
          value={draft}
          onChange={setDraft}
          onSend={send}
          placeholder="Pregunta algo sobre esta vacante"
          onVoice={() => notify('El modo voz se abre desde el chat de Orbit')}
          contextNote=""
        />
      }
    >
      <UserBubble>¿A qué candidatos debería priorizar esta semana?</UserBubble>

      <div aria-live="polite" className="mt-4">
        <AgentNote>{applied ? 'Listo. Los moví a Entrevista final y avisé a Juan Rincón.' : 'Revisé 12 candidatos. Priorizaría estos 3:'}</AgentNote>
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl border">
        {PICKS.map((pick) => (
          <div key={pick.name} className="flex items-start gap-3 border-b px-4 py-3 last:border-b-0">
            <Avatar size="sm">
              <AvatarFallback>{pick.initials}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="font-medium">{pick.name}</span>
                <span className="text-muted-foreground tabular-nums">{pick.match}%</span>
              </div>
              <span className="text-xs leading-relaxed text-muted-foreground">{pick.why}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {applied ? (
          <Button
            variant="outline"
            className={PILL}
            onClick={() => {
              setApplied(false)
              notify('Cambio deshecho')
            }}
          >
            Deshacer
          </Button>
        ) : (
          <Button
            className={PILL}
            onClick={() => {
              setApplied(true)
              notify('3 candidatos movidos a Entrevista final')
            }}
          >
            Mover los 3 a Entrevista final
          </Button>
        )}
        <Button variant="outline" className={PILL} onClick={() => notify('Preparando otra propuesta')}>
          Otra propuesta
        </Button>
      </div>

      {/* Conversación en vivo: la respuesta del agente se anuncia al llegar. */}
      <div role="log">
        {messages.map((message, index) =>
          message.role === 'user' ? (
            <UserBubble key={index} className="mt-4">
              {message.text}
            </UserBubble>
          ) : (
            <AgentNote key={index} className="mt-3">
              {message.text}
            </AgentNote>
          ),
        )}
      </div>

      <div role="heading" aria-level={3} className={`${KICKER} mt-7`}>Sobre esta vacante</div>
      <div className="mt-2.5 flex flex-col items-start gap-2">
        {['Resumir el embudo de la semana', 'Redactar correo para los no seleccionados'].map((label) => (
          <Button key={label} variant="outline" size="sm" className={`${PILL} font-normal`} onClick={() => notify(label)}>
            {label}
          </Button>
        ))}
      </div>
    </DrawerShell>
  )
}
