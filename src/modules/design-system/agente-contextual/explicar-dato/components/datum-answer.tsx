import { HugeiconsIcon } from '@hugeicons/react'
import { Analytics01Icon } from '@hugeicons/core-free-icons'
import { Button, cn } from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { AgentCard, SourcePills, UndoRow } from '../../components/agent-kit'
import { KICKER, PILL } from '../../components/agent-styles'
import styles from '../../components/agent.module.css'
import { AREAS, formatPct, type Topic } from './data'

type DatumAnswerProps = {
  topic: Topic
  alertOn: boolean
  onAlert: () => void
  onUndoAlert: () => void
}

// Respuesta sobre un dato: qué lo mueve, contra el sector, lo que no sabe, fuentes y acciones.
export function DatumAnswer({ topic, alertOn, onAlert, onUndoAlert }: DatumAnswerProps) {
  return (
    <div className={cn('flex flex-col gap-3', styles.msgIn)}>
      <div className="text-sm leading-[1.55] text-foreground/80">{topic.lead}</div>

      <AgentCard title="Qué lo mueve">
        <div className="flex flex-col gap-3">
          {topic.drivers.map((driver, index) => (
            <div key={driver.label} className={styles.lineIn} style={{ animationDelay: `${index * 60}ms` }}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-foreground/80">{driver.label}</span>
                <span className="font-medium tabular-nums">{driver.share}%</span>
              </div>
              <div aria-hidden="true" className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${driver.share}%` }} />
              </div>
            </div>
          ))}
        </div>
      </AgentCard>

      <div className="flex items-start gap-2.5 text-sm leading-normal text-foreground/80">
        <HugeiconsIcon icon={Analytics01Icon} size={18} strokeWidth={1.5} aria-hidden="true" className="mt-px shrink-0 text-muted-foreground" />
        {topic.sector}
      </div>

      <div className="rounded-[16px] bg-muted px-4 py-3.5">
        <div className={`${KICKER} text-muted-foreground`}>Lo que no sé</div>
        <div className="mt-2 text-sm leading-normal text-muted-foreground">{topic.unknown}</div>
      </div>

      <SourcePills sources={topic.sources.map((label) => ({ label }))} />

      <div className="mt-1 flex flex-wrap items-center gap-2.5">
        {alertOn ? null : (
          <Button data-undo-focus="" className={PILL} onClick={onAlert}>
            {topic.alertAction}
          </Button>
        )}
        <Button variant="outline" className={PILL} onClick={() => notify(topic.peopleAction)}>
          {topic.peopleAction}
        </Button>
      </div>
      {alertOn ? <UndoRow onUndo={onUndoAlert}>{topic.alertDone}</UndoRow> : null}
    </div>
  )
}

// Respuesta al atajo «¿Qué área preocupa más?».
export function AreaAnswer() {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm leading-[1.55] text-foreground/80">
        Operaciones en la planta Funza: 5,8% en agosto, más del doble que el resto de la empresa.
      </div>
      <AgentCard title="Rotación por área · agosto">
        <div className="flex flex-col gap-2">
          {AREAS.map((area, index) => (
            <div key={area.name} className={cn('flex items-baseline justify-between gap-3 text-sm', styles.lineIn)} style={{ animationDelay: `${index * 50}ms` }}>
              <span className="text-foreground/80">{area.name}</span>
              <span className="font-medium tabular-nums">{formatPct(area.value)}%</span>
            </div>
          ))}
        </div>
      </AgentCard>
      <SourcePills sources={[{ label: 'Retiros · nómina' }]} />
    </div>
  )
}
