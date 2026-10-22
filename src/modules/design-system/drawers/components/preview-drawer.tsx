import { SmartPhone01Icon } from '@hugeicons/core-free-icons'
import { Button, Progress, cn } from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { DrawerShell } from './drawer-shell'
import { KICKER, WS } from './drawer-styles'

type Props = { open: boolean; onOpenChange: (open: boolean) => void }

type State = 'hecho' | 'actual' | 'pendiente'

const LESSONS: { title: string; meta: string; state: State }[] = [
  { title: 'Bienvenida y reglas del turno', meta: 'Video · 6 min', state: 'hecho' },
  { title: 'Riesgos de tu línea', meta: 'Video · 9 min', state: 'hecho' },
  { title: 'Protocolo de seguridad', meta: 'Lectura · 12 min', state: 'actual' },
  { title: 'Uso de equipos', meta: 'Video · 11 min', state: 'pendiente' },
  { title: 'Reporte de incidentes', meta: 'Lectura · 8 min', state: 'pendiente' },
  { title: 'Práctica final', meta: 'Tarea · evidencia', state: 'pendiente' },
]

// Estado por forma, no por color (regla del handoff): lleno = hecho, anillo = actual, anillo apagado = pendiente.
// El nombre del estado va en texto oculto: un aria-label en un span sin rol no lo lee ningún lector de pantalla.
function StateMark({ state }: { state: State }) {
  return (
    <span
      className={cn(
        'size-3 shrink-0 rounded-full',
        state === 'hecho' && 'bg-foreground',
        state === 'actual' && 'border-2 border-foreground',
        state === 'pendiente' && 'border-2 border-border',
      )}
    >
      <span className="sr-only">{state === 'actual' ? 'En curso' : state === 'hecho' ? 'Hecha' : 'Pendiente'}</span>
    </span>
  )
}

// Caso: hoja inferior con alturas intermedias: abre a media pantalla y se arrastra para verla completa.
export function PreviewDrawer({ open, onOpenChange }: Props) {
  return (
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      direction="bottom"
      snapPoints={[0.55, 1]}
      icon={SmartPhone01Icon}
      title="Vista previa · Onboarding operativo"
      description="Así lo ve un operario en el celular. Arrastra hacia arriba para verlo completo."
      footer={
        <Button
          className={`w-full ${WS}`}
          onClick={() => {
            notify('Abriendo la lección 3 como colaborador', undefined, 'info')
            onOpenChange(false)
          }}
        >
          Continuar con la lección 3
        </Button>
      }
    >
      <div className="rounded-xl bg-muted px-4 py-3.5">
        <div className="flex items-center justify-between text-sm">
          <span id="preview-drawer-progress" className="font-medium">
            Tu avance
          </span>
          <span className="text-muted-foreground tabular-nums">2 de 6 lecciones</span>
        </div>
        <Progress value={33} aria-labelledby="preview-drawer-progress" className="mt-2.5 **:data-[slot=progress-track]:h-1.5!" />
      </div>
      <div role="heading" aria-level={3} className={`${KICKER} mt-6`}>Lecciones</div>
      <div className="mt-2 flex flex-col">
        {LESSONS.map((lesson, index) => (
          <div key={lesson.title} className="flex items-center gap-3.5 border-b py-3 last:border-b-0">
            <StateMark state={lesson.state} />
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className={cn('truncate text-sm', lesson.state === 'actual' && 'font-medium')}>
                {index + 1}. {lesson.title}
              </span>
              <span className="text-xs text-muted-foreground">{lesson.meta}</span>
            </span>
            {lesson.state === 'actual' ? <span className="text-xs text-primary">En curso</span> : null}
          </div>
        ))}
      </div>
    </DrawerShell>
  )
}
