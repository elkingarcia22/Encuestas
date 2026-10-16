import { HugeiconsIcon } from '@hugeicons/react'
import { EyeIcon, Tick02Icon } from '@hugeicons/core-free-icons'
import { Button, cn } from '@ubits/flux-ui'
import { ProposalCard } from '../../components/agent-kit'
import { AGENT_CARD, PILL_XS } from '../../components/agent-styles'
import styles from '../../components/agent.module.css'
import type { Issue } from './data'

export type IssueState = 'open' | 'fixing' | 'fixed' | 'ignored'

// Número del hallazgo: anillo de advertencia si es importante, gris si es sugerencia.
// El número va en color de texto (el texto sobre `bg-warning` no se lee en modo oscuro).
// La gravedad se ve solo por el color: para el lector va en texto («Hallazgo 1, importante»).
export function IssueMarker({ issue }: { issue: Issue }) {
  const tone =
    issue.severity === 'importante' ? 'bg-warning/20 text-foreground ring-1 ring-warning' : 'bg-muted text-muted-foreground ring-1 ring-border'
  return (
    <span className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums ${tone}`}>
      <span aria-hidden="true">{issue.n}</span>
      <span className="sr-only">
        Hallazgo {issue.n}, {issue.severity}
      </span>
    </span>
  )
}

type IssueCardProps = {
  issue: Issue
  state: IssueState
  onView: () => void
  onFix: () => void
  onApply: () => void
  onCancel: () => void
  onIgnore: () => void
}

export function IssueCard({ issue, state, onView, onFix, onApply, onCancel, onIgnore }: IssueCardProps) {
  return (
    <div id={`hallazgo-${issue.id}`} className={cn(AGENT_CARD, 'px-3.5! py-3!', styles.msgIn)}>
      <div className="flex items-start gap-2.5">
        <IssueMarker issue={issue} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">{issue.title}</div>
          <div className="mt-1 text-[13px] leading-snug text-muted-foreground">{issue.reason}</div>
        </div>
      </div>
      {state === 'fixing' ? (
        <ProposalCard className="mt-3" current={issue.before} proposal={issue.after} proposalLabel="Corrección" anim="in" />
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-1.5 pl-7.5">
        {state === 'fixing' ? (
          <>
            <Button className={PILL_XS} onClick={onApply}>
              Aplicar
            </Button>
            <Button variant="ghost" className={PILL_XS} onClick={onCancel}>
              Cancelar
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" className={PILL_XS} onClick={onView}>
              <HugeiconsIcon icon={EyeIcon} size={14} aria-hidden="true" />
              Ver
            </Button>
            <Button variant="outline" className={PILL_XS} onClick={onFix}>
              Corregir
            </Button>
            <Button variant="ghost" className={`${PILL_XS} text-muted-foreground!`} onClick={onIgnore}>
              Ignorar
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

// Hallazgo ya resuelto: una fila compacta con la opción de volver atrás.
export function ResolvedRow({ issue, state, onRevert }: { issue: Issue; state: IssueState; onRevert: () => void }) {
  const fixed = state === 'fixed'
  return (
    <div id={`hallazgo-${issue.id}`} className={cn('flex items-center gap-2.5 rounded-[12px] border py-1.5 pr-1.5 pl-3.5', styles.msgIn)}>
      <HugeiconsIcon icon={Tick02Icon} size={16} aria-hidden="true" className="shrink-0" />
      <span className="min-w-0 flex-1 truncate text-[13px] text-foreground/80">{issue.title}</span>
      <span className="text-xs text-muted-foreground">{fixed ? 'Corregido' : 'Ignorado'}</span>
      <Button variant="ghost" className={PILL_XS} onClick={onRevert}>
        {fixed ? 'Deshacer' : 'Reabrir'}
      </Button>
    </div>
  )
}
