import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { StopCircleIcon, Tick02Icon } from '@hugeicons/core-free-icons'
import {
  Button,
  IconTile,
  Progress,
  Spinner,
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from '@ubits/flux-ui'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { notify } from '@/shared/components/notify'
import { DrawerShell } from './drawer-shell'
import { KICKER, PILL, STEP_INDICATOR, STEP_LINE } from './drawer-styles'

type Props = { open: boolean; onOpenChange: (open: boolean) => void }

const STEPS = [
  { title: 'Preparar audiencia', text: '312 colaboradores de la sede Bogotá', time: '9:42' },
  { title: 'Publicar aviso', text: 'Visible en el portal del colaborador', time: '9:44' },
  { title: 'Enviar correo', text: '309 con correo válido · 3 omitidos', time: '9:47' },
  { title: 'Asignar curso de la política', text: 'Fecha límite 30 de septiembre', time: '9:51' },
]

// Caso de Suite AI: seguir un proceso largo del agente en vivo, con pasos por estado y cancelación.
export function ProcessDrawer({ open, onOpenChange }: Props) {
  const [step, setStep] = useState(3)
  const [cancelled, setCancelled] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const done = step > STEPS.length
  const progress = Math.round(((Math.min(step, STEPS.length + 1) - 1) / STEPS.length) * 100)

  // Mientras el drawer está abierto, el proceso avanza un paso cada 2,4 s.
  useEffect(() => {
    if (!open || done || cancelled) return
    const id = window.setTimeout(() => setStep((s) => s + 1), 2400)
    return () => window.clearTimeout(id)
  }, [open, step, done, cancelled])

  const restart = () => {
    setStep(3)
    setCancelled(false)
  }

  return (
    <>
      <DrawerShell
        open={open}
        onOpenChange={onOpenChange}
        size="sm"
        ai
        title="Publicar política de vacaciones"
        description={cancelled ? 'Proceso cancelado' : done ? 'Terminado a las 9:51' : 'Corre en segundo plano · iniciado 9:42'}
        headerExtra={
          <div className="border-b px-5 py-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              {/* El proceso avanza solo: el paso en curso se anuncia sin mover el foco. */}
              <span role="status">{cancelled ? 'Detenido' : done ? 'Completado' : `Paso ${step} de ${STEPS.length}`}</span>
              <span className="tabular-nums">{progress}%</span>
            </div>
            <Progress value={progress} aria-label="Avance del proceso" className="mt-2 **:data-[slot=progress-track]:h-1!" />
          </div>
        }
        footer={
          done || cancelled ? (
            <>
              <Button variant="ghost" className={`mr-auto ${PILL}`} onClick={restart}>
                Repetir demo
              </Button>
              <Button className={PILL} onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" className={`mr-auto text-destructive ${PILL}`} onClick={() => setConfirm(true)}>
                Cancelar proceso
              </Button>
              <Button
                className={PILL}
                onClick={() => {
                  notify('Sigue corriendo · te avisamos al terminar')
                  onOpenChange(false)
                }}
              >
                Seguir en segundo plano
              </Button>
            </>
          )
        }
      >
        <Stepper
          value={Math.min(step, STEPS.length)}
          orientation="vertical"
          indicators={{
            completed: <HugeiconsIcon icon={Tick02Icon} className="size-3.5" />,
            loading: <Spinner className="size-3.5" />,
          }}
        >
          <StepperNav>
            {STEPS.map((item, index) => {
              const number = index + 1
              return (
                <StepperItem
                  key={item.title}
                  step={number}
                  completed={number < step}
                  loading={!cancelled && number === step}
                  className="relative items-start not-last:flex-1"
                >
                  {/* Solo muestra el avance: sin panel asociado, así que sin aria-controls. */}
                  <StepperTrigger className="items-start gap-3 pb-6 last:pb-0" tabIndex={-1} aria-controls={undefined}>
                    <StepperIndicator className={STEP_INDICATOR}>{number}</StepperIndicator>
                    <div className="flex flex-col gap-1 text-left">
                      <StepperTitle>{item.title}</StepperTitle>
                      <StepperDescription>
                        {item.text}
                        {number < step ? ` · ${item.time}` : ''}
                      </StepperDescription>
                    </div>
                  </StepperTrigger>
                  {number < STEPS.length ? (
                    <StepperSeparator className={`absolute! top-7 left-3 m-0! h-[calc(100%-2rem)]! w-px! -translate-x-1/2 ${STEP_LINE}`} />
                  ) : null}
                </StepperItem>
              )
            })}
          </StepperNav>
        </Stepper>

        <div role="heading" aria-level={3} className={`${KICKER} mt-6`}>Qué pasa si cierras</div>
        <div className="mt-2 text-sm leading-relaxed text-muted-foreground">
          El proceso sigue corriendo aunque cierres este panel o la conversación. Lo encuentras en el centro de procesos, que se abre desde Notificaciones.
        </div>
      </DrawerShell>

      {/* La confirmación va en la ventana única del sistema (decisión 4 de la auditoría, 5-oct), con su icono y el
          spinner en el botón mientras se cancela. */}
      <ActionDialog
        open={confirm}
        onOpenChange={setConfirm}
        size="sm"
        media={
          <IconTile variant="soft" size="sm">
            <HugeiconsIcon icon={StopCircleIcon} aria-hidden="true" />
          </IconTile>
        }
        title="¿Cancelar el proceso?"
        sub="Lo que ya se publicó se queda. Los correos pendientes no se envían y el curso no se asigna."
        cancelLabel="Seguir corriendo"
        confirmLabel="Cancelar proceso"
        pendingLabel="Cancelando…"
        onConfirm={() => {
          setCancelled(true)
          notify('Proceso cancelado')
        }}
      />
    </>
  )
}
