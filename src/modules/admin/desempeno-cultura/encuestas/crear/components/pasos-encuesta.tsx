import { HugeiconsIcon } from '@hugeicons/react'
import { Tick02Icon } from '@hugeicons/core-free-icons'
import { Stepper, StepperIndicator, StepperItem, StepperNav, StepperSeparator, StepperTitle, StepperTrigger, cn } from '@ubits/flux-ui'
import { STEP_INDICATOR, STEP_LINE } from '@/modules/design-system/drawers/components/drawer-styles'
import { PASOS, indiceDe, type PasoId } from './pasos'

// Los pasos del constructor en una fila, arriba del formulario y del panel «Así va la encuesta»: los
// mismos de «Crear vacante». El actual y los hechos, en círculo primario (los hechos con su marca); el
// bloqueado, atenuado; el que falló al finalizar, en rojo.

// El que falló al finalizar se pinta en rojo, gane a cualquier otro estado.
const FALLIDO = 'bg-destructive! text-primary-foreground! shadow-none!'

export function PasosEncuesta({
  paso,
  completos,
  bloqueados,
  fallidos,
  onPaso,
}: {
  paso: PasoId
  completos: ReadonlySet<PasoId>
  bloqueados: ReadonlySet<PasoId>
  fallidos: ReadonlySet<PasoId>
  onPaso: (paso: PasoId) => void
}) {
  // Contenedor con su propio ancho: con el agente de IA acoplado la columna se angosta aunque la ventana
  // siga siendo ancha, y es ese ancho el que decide si los nombres caben.
  return (
    <div className="@container">
    <Stepper
      value={indiceDe(paso) + 1}
      onValueChange={(numero) => onPaso(PASOS[numero - 1].id)}
      indicators={{ completed: <HugeiconsIcon icon={Tick02Icon} className="size-3.5" /> }}
    >
      <StepperNav aria-label="Pasos de creación" className="w-full">
        {PASOS.map((item, indice) => {
          const bloqueado = bloqueados.has(item.id)
          const fallido = fallidos.has(item.id)
          const actual = item.id === paso
          return (
            <StepperItem
              key={item.id}
              step={indice + 1}
              completed={completos.has(item.id) && !actual && !fallido}
              className="flex-1 last:flex-none"
            >
              {/* Un paso bloqueado no se deshabilita: al pulsarlo, la pantalla dice qué falta para abrirlo. */}
              <StepperTrigger
                aria-controls={undefined}
                aria-disabled={bloqueado || undefined}
                className={cn('gap-2', bloqueado && 'opacity-60')}
              >
                <StepperIndicator className={cn(STEP_INDICATOR, fallido && FALLIDO)}>{indice + 1}</StepperIndicator>
                {/* Si la fila es angosta, solo el paso actual lleva su nombre: los cinco no caben. */}
                <StepperTitle className={cn('text-sm whitespace-nowrap', !actual && '@max-[46rem]:sr-only')}>
                  {item.titulo}
                  {bloqueado ? <span className="sr-only">, bloqueado</span> : fallido ? <span className="sr-only">, por completar</span> : null}
                </StepperTitle>
              </StepperTrigger>
              {indice < PASOS.length - 1 ? <StepperSeparator className={cn('mx-3 flex-1', STEP_LINE)} /> : null}
            </StepperItem>
          )
        })}
      </StepperNav>
    </Stepper>
    </div>
  )
}
