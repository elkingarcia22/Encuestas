import { HugeiconsIcon } from '@hugeicons/react'
import { Activity01Icon } from '@hugeicons/core-free-icons'
import { Button, MessageGroup, cn } from '@ubits/flux-ui'
import { Orb } from '@/shared/components/Orb'
import { ActivityPanel } from '@/modules/admin/suite-ai/chat/components/activity-panel'
import { AgentMessage } from '@/modules/admin/suite-ai/chat/components/agent-message'
import { ApprovalPlan } from '@/modules/admin/suite-ai/chat/components/approval-plan'
import { MetricsCard } from '@/modules/admin/suite-ai/chat/components/metrics-card'
import { ProposalCard } from '@/modules/admin/suite-ai/chat/components/proposal-card'
import { TypingIndicator } from '@/modules/admin/suite-ai/chat/components/typing-indicator'
import { UserMessage } from '@/modules/admin/suite-ai/chat/components/user-message'
import { useApprovalFlow } from '@/modules/admin/suite-ai/chat/components/use-approval-flow'
import { Composer } from '@/modules/admin/suite-ai/shared/composer'
import { SlotArea } from '../../components/anatomy/anatomy-kit'
import { PantallaReal } from '../../components/anatomy/pantalla-real'
import { PART, type ChatConfig, type ChatSample } from './chat-config'

// Vista previa del chat de Suite AI. No es una réplica: usa los mismos componentes de la pantalla real
// (mensajes, plan, métricas, propuesta y panel de actividad) y solo les pone el nombre de cada parte con `data-region`.
// `real`: para «Probar en pantalla». Va dentro del marco real de Suite AI y con la composición de la pantalla real:
// conversación en la columna de lectura de 768 centrada, caja de escribir abajo con su aviso y el panel de actividad
// a toda la altura a la derecha. Sin `real`, la vista previa compacta del configurador, con sus nombres.
export function ChatPreview({ config, sample, real = false }: { config: ChatConfig; sample: ChatSample; real?: boolean }) {
  const approval = useApprovalFlow()
  const sinRuido = () => undefined

  const reabrir =
    config.activity === 'closed' ? (
          <Button
            data-region={PART.reopen}
            data-chip="inline"
            variant="outline"
            size="sm"
            className="absolute top-4 right-4 z-10 gap-2 bg-background shadow-xs"
          >
            <HugeiconsIcon icon={Activity01Icon} size={16} />
            Actividad del agente
          </Button>
        ) : null

  const conversacion = (
        <>
          {config.greeting ? (
            <div data-region={PART.greeting} className="flex flex-col items-center gap-4 py-6 text-center">
              <Orb className="size-14" />
              <span className="text-3xl font-semibold tracking-tight text-balance">{sample.greeting}</span>
            </div>
          ) : null}

          <MessageGroup className="gap-6">
            {config.request ? <UserMessage text={sample.request} region={PART.request} /> : null}

            {config.typing ? (
              <TypingIndicator region={PART.typing} />
            ) : config.answer ? (
              <AgentMessage
                text={sample.answer}
                actions={config.actions}
                regions={{
                  message: PART.answer,
                  sources: config.sources ? PART.sources : undefined,
                  actions: config.actions ? PART.actions : undefined,
                  followups: config.followups ? PART.followups : undefined,
                }}
              />
            ) : null}
          </MessageGroup>

          {/* Resultado con el que se puede trabajar: los mismos componentes del chat real. */}
          {config.result === 'plan' ? (
            <div data-region="Plan con impacto">
              <ApprovalPlan {...approval} />
            </div>
          ) : null}
          {config.result === 'metrics' ? (
            <div data-region="Métricas">
              <MetricsCard reminderSent={false} onSendReminder={sinRuido} />
            </div>
          ) : null}
          {config.result === 'proposal' ? (
            <div data-region="Propuesta editable">
              <ProposalCard onOpenProcesses={sinRuido} onAssigned={sinRuido} />
            </div>
          ) : null}
          {config.result === 'slot' ? <SlotArea name="Contenido" hint={sample.slot} className="min-h-40" /> : null}

          {config.chips ? (
            <div data-region={PART.chips} className="flex flex-wrap gap-2">
              {sample.chips.map((chip) => (
                <Button key={chip} variant="outline" size="sm">
                  {chip}
                </Button>
              ))}
            </div>
          ) : null}
        </>
  )

  // Caja de escribir: el Composer real del chat, no una copia. Ya trae sus propios nombres de anatomía.
  const caja = (
        <Composer
          value=""
          onChange={sinRuido}
          onSend={sinRuido}
          onVoice={sinRuido}
          placeholder={sample.placeholder}
          contextChip={config.composerChip ? sample.composerChip : undefined}
          onRemoveContext={sinRuido}
          attach={config.attach}
          voice={config.voice}
          regions={{
            input: PART.composer,
            context: config.composerChip ? PART.composerChip : undefined,
            attach: config.attach ? PART.attach : undefined,
            voice: config.voice ? PART.voice : undefined,
            send: PART.send,
          }}
        />
  )

  if (real) {
    return (
      <PantallaReal
        ruta="/suite-ai/chat/vacaciones"
        panel={
          config.activity === 'open' ? (
            <aside aria-label="Actividad del agente" className="hidden h-full w-90 shrink-0 border-l bg-background lg:flex">
              <ActivityPanel activity={approval.activity} onOpenProcesses={sinRuido} onClose={sinRuido} />
            </aside>
          ) : null
        }
      >
        {/* Las mismas medidas que chat-view.tsx: la conversación ocupa todo el alto (sin el aire del marco) y el
            composer queda abajo, en la columna de 768. */}
        <div className="-m-6 flex h-[calc(100%+3rem)] min-h-0 flex-1 [&_button]:rounded-full!">
          <div className="relative mx-auto flex min-h-0 w-full max-w-285 min-w-0 flex-1 flex-col">
            {reabrir}
            <div className="min-h-0 flex-1 overflow-auto">
              <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-end gap-6 px-8 py-8">{conversacion}</div>
            </div>
            <div className="flex flex-col items-center gap-3 px-8 pb-4">
              <div className="w-full max-w-3xl">{caja}</div>
              <p className="w-full max-w-3xl text-center text-sm text-muted-foreground">
                El agente puede cometer errores. Antes de ejecutar verás el impacto.
              </p>
            </div>
          </div>
        </div>
      </PantallaReal>
    )
  }

  return (
    <div className="flex min-h-125 w-full">
      {/* Columna de la conversación: el ancho de lectura del chat real. */}
      <div className="relative flex min-w-0 flex-1 flex-col gap-6 p-6">
        {reabrir}
        <div className="flex min-h-0 flex-1 flex-col justify-end gap-6">{conversacion}</div>
        {caja}
      </div>

      {/* Panel de actividad: ocupa la derecha de arriba abajo, como en la pantalla real. */}
      {config.activity === 'open' ? (
        <div data-region={PART.activity} className={cn('hidden w-80 shrink-0 border-l lg:flex')}>
          <ActivityPanel activity={approval.activity} onOpenProcesses={sinRuido} onClose={sinRuido} />
        </div>
      ) : null}
    </div>
  )
}
