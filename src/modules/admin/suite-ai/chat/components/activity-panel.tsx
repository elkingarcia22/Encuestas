import { Button, cn } from '@ubits/flux-ui'
import type { ActivityEntry } from '../../shared/data'
import { StateDot } from './approval-plan'
import { CloseButton } from '@/shared/components/CloseButton'

type ActivityPanelProps = {
  // Id del título: el panel (aside) lo usa como nombre de la región.
  titleId?: string
  activity: ActivityEntry[]
  onOpenProcesses: () => void
  onClose: () => void
}

// Panel de actividad del agente: ocupa toda la columna derecha del chat (de arriba abajo, con línea a la izquierda),
// como en el prototipo. Cabecera fija con cerrar, timeline con scroll propio y pie fijo abajo.
// Legibilidad: nada por debajo de 13px (la hora en mono va en 12px, que se lee como 13) y textos grises con contraste AA.
export function ActivityPanel({ titleId, activity, onOpenProcesses, onClose }: ActivityPanelProps) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      {/* 60px como el header de la app, para que las dos líneas inferiores queden a la misma altura. */}
      <div className="flex h-15 shrink-0 items-center gap-2 border-b px-5">
        <h2 id={titleId} className="flex-1 text-[15px] font-medium">
          Actividad del agente
        </h2>
        <CloseButton label="Cerrar actividad del agente" onClick={onClose} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <ol className="relative flex flex-col gap-6 before:absolute before:top-2 before:bottom-2 before:left-2 before:w-px before:bg-border">
          {activity.map((entry) => (
            <li key={entry.title + entry.state} className="relative flex gap-3">
              <StateDot state={entry.state} className="relative z-10 mt-0.5 ring-4 ring-background" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className={cn('text-[15px] leading-5', entry.state === 'now' ? 'font-medium' : entry.state === 'wait' && 'text-muted-foreground')}>
                  {entry.title}
                </span>
                <span className="text-[13px] leading-[1.45] text-muted-foreground">{entry.detail}</span>
                {entry.time ? <span className="tabular-nums text-xs text-muted-foreground">{entry.time}</span> : null}
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex shrink-0 flex-col items-start gap-1.5 border-t bg-muted/40 px-5 py-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Si cierras el chat</span>
          <span className="text-[13px] leading-[1.45] text-foreground/70">
            El plan queda guardado y los procesos siguen corriendo. Cerrar no cancela nada.
          </span>
        </div>
        <Button variant="outline" size="sm" className="mt-2 h-9! w-full" onClick={onOpenProcesses}>
          Ver todos los procesos
        </Button>
      </div>
    </div>
  )
}
