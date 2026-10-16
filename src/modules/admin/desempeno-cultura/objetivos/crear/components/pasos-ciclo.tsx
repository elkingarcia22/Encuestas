import { HugeiconsIcon } from '@hugeicons/react'
import { Tick02Icon } from '@hugeicons/core-free-icons'
import { Stepper, StepperIndicator, StepperItem, StepperNav, StepperSeparator, StepperTitle, StepperTrigger, cn } from '@ubits/flux-ui'
import { STEP_INDICATOR, STEP_LINE } from '@/modules/design-system/drawers/components/drawer-styles'
import { pasoDe, type PasoId } from './pasos'

// Los pasos del constructor en una fila, arriba del formulario y del panel «Así va el ciclo»: la misma fila de «Crear
// encuesta» y «Crear vacante». Cambia solo que aquí los pasos los decide la parametrización, así que la fila recibe el
// recorrido en vez de tenerlo fijo. El actual y los hechos, en círculo primario (los hechos con su marca); el
// bloqueado, atenuado; el que falló al finalizar, en rojo.

const FALLIDO = 'bg-destructive! text-primary-foreground! shadow-none!'

export function PasosCiclo({
  orden,
  paso,
  completos,
  bloqueados,
  fallidos,
  onPaso,
}: {
  orden: readonly PasoId[]
  paso: PasoId
  completos: ReadonlySet<PasoId>
  bloqueados: ReadonlySet<PasoId>
  fallidos: ReadonlySet<PasoId>
  onPaso: (paso: PasoId) => void
}) {
  return (
    <div className="@container">
      <Stepper value={orden.indexOf(paso) + 1} onValueChange={(numero) => onPaso(orden[numero - 1])} indicators={{ completed: <HugeiconsIcon icon={Tick02Icon} className="size-3.5" /> }}>
        <StepperNav aria-label="Pasos de creación" className="w-full">
          {orden.map((id, indice) => {
            const bloqueado = bloqueados.has(id)
            const fallido = fallidos.has(id)
            const actual = id === paso
            return (
              <StepperItem key={id} step={indice + 1} completed={completos.has(id) && !actual && !fallido} className="flex-1 last:flex-none">
                {/* Un paso bloqueado no se deshabilita: al pulsarlo, la pantalla dice qué falta para abrirlo. */}
                <StepperTrigger aria-controls={undefined} aria-disabled={bloqueado || undefined} className={cn('gap-2', bloqueado && 'opacity-60')}>
                  <StepperIndicator className={cn(STEP_INDICATOR, fallido && FALLIDO)}>{indice + 1}</StepperIndicator>
                  {/* Si la fila es angosta, solo el paso actual lleva su nombre: los cinco no caben. */}
                  <StepperTitle className={cn('text-sm whitespace-nowrap', !actual && '@max-[46rem]:sr-only')}>
                    {pasoDe(id).titulo}
                    {bloqueado ? <span className="sr-only">, bloqueado</span> : fallido ? <span className="sr-only">, por completar</span> : null}
                  </StepperTitle>
                </StepperTrigger>
                {indice < orden.length - 1 ? <StepperSeparator className={cn('mx-3 flex-1', STEP_LINE)} /> : null}
              </StepperItem>
            )
          })}
        </StepperNav>
      </Stepper>
    </div>
  )
}
