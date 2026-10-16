import { HugeiconsIcon } from '@hugeicons/react'
import { useNavigate } from 'react-router'
import { Badge, Button, Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle, IconTile } from '@ubits/flux-ui'
import { DAY_TASKS, type DayTask } from './data'
import { notify } from '@/shared/components/notify'

// «Tu día»: hoy en grande a la izquierda, esta semana compacto a la derecha.
export function TodayCard() {
  const navigate = useNavigate()
  const today = DAY_TASKS.filter((t) => t.today)
  const week = DAY_TASKS.filter((t) => !t.today)

  const act = (task: DayTask) => {
    notify(task.toast)
    if (task.to) navigate(task.to)
  }

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="border-b py-4">
        <CardTitle role="heading" aria-level={2}>Tu día</CardTitle>
        <CardDescription>
          {DAY_TASKS.length} pendientes · {today.length} para hoy
        </CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" aria-label="Ver todo en Tareas" onClick={() => navigate('/admin/tareas')}>
            Ver todo
          </Button>
        </CardAction>
      </CardHeader>
      {/* grid-cols-1 (y no la columna automática): sin él, a 320px el contenido se salía de la tarjeta. */}
      <CardContent className="grid grid-cols-1 gap-0 p-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:divide-x lg:divide-border">
        <div className="flex flex-col gap-4 p-5">
          <span role="heading" aria-level={3} className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Hoy</span>
          {today.map((task) => (
            <div key={task.title} className="flex items-start gap-3">
              <IconTile variant="solid" className="size-9! rounded-lg! bg-primary/10! text-primary! [--icon-tile-icon-size:18px]">
                <HugeiconsIcon icon={task.icon} size={18} aria-hidden="true" />
              </IconTile>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                {/* Los títulos pasan a otra línea en vez de cortarse con «…» (a 320px se perdía la tarea) y la insignia baja si no cabe. */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="min-w-0 text-sm font-medium break-words">{task.title}</span>
                  <Badge size="xs">Hoy</Badge>
                </div>
                <span className="text-sm text-muted-foreground">{task.text}</span>
              </div>
              {/* «Calibrar», «Enviar»… no bastan fuera de contexto: el nombre accesible suma la tarea. */}
              <Button size="sm" aria-label={`${task.cta}: ${task.title}`} onClick={() => act(task)}>
                {task.cta}
              </Button>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3 border-t p-5 lg:border-t-0">
          <span role="heading" aria-level={3} className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Esta semana</span>
          {week.map((task) => (
            <div key={task.title} className="flex min-h-7 items-center gap-3">
              <HugeiconsIcon icon={task.icon} size={16} className="shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="min-w-0 flex-1 text-sm break-words">{task.title}</span>
              <Button variant="link" size="sm" className="h-auto p-0" aria-label={`${task.cta}: ${task.title}`} onClick={() => act(task)}>
                {task.cta}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
