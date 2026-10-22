import { HugeiconsIcon } from '@hugeicons/react'
import { Tick02Icon } from '@hugeicons/core-free-icons'
import { Stepper, StepperIndicator, StepperItem, StepperNav, StepperSeparator, StepperTitle, StepperTrigger, cn } from '@ubits/flux-ui'
import { STEP_INDICATOR, STEP_LINE } from '../drawers/components/drawer-styles'

// Los pasos de una creación en una fila arriba del trabajo: la misma de «Crear encuesta», «Crear ciclo» y «Crear
// vacante», pero con los pasos que le pase cada pantalla (la usan las asignaciones de Planes y de Objetivos, que ya no
// van en un panel). El actual y los hechos, en círculo primario (los hechos con su marca); el bloqueado, atenuado; el que
// falló, en rojo. Quien la usa decide a qué paso se puede saltar: aquí solo se avisa del clic.

export type PasoFila = { id: string; titulo: string }

const FALLIDO = 'bg-destructive! text-primary-foreground! shadow-none!'

export function PasosFila({
  pasos,
  paso,
  completos,
  bloqueados,
  fallidos,
  onPaso,
}: {
  pasos: readonly PasoFila[]
  paso: string
  completos: ReadonlySet<string>
  bloqueados?: ReadonlySet<string>
  fallidos?: ReadonlySet<string>
  onPaso: (paso: string) => void
}) {
  return (
    // Contenedor con su propio ancho: es ese ancho (y no el de la ventana) el que decide si los nombres caben.
    <div className="@container">
      <Stepper
        value={pasos.findIndex((item) => item.id === paso) + 1}
        onValueChange={(numero) => onPaso(pasos[numero - 1].id)}
        indicators={{ completed: <HugeiconsIcon icon={Tick02Icon} className="size-3.5" /> }}
      >
        <StepperNav aria-label="Pasos de creación" className="w-full">
          {pasos.map((item, indice) => {
            const bloqueado = bloqueados?.has(item.id) ?? false
            const fallido = fallidos?.has(item.id) ?? false
            const actual = item.id === paso
            return (
              <StepperItem key={item.id} step={indice + 1} completed={completos.has(item.id) && !actual && !fallido} className="flex-1 last:flex-none">
                {/* Un paso bloqueado no se deshabilita: así el clic llega a quien decide qué decir. */}
                <StepperTrigger aria-controls={undefined} aria-disabled={bloqueado || undefined} className={cn('gap-2', bloqueado && 'opacity-60')}>
                  <StepperIndicator className={cn(STEP_INDICATOR, fallido && FALLIDO)}>{indice + 1}</StepperIndicator>
                  {/* Si la fila es angosta, solo el paso actual lleva su nombre. */}
                  <StepperTitle className={cn('text-sm whitespace-nowrap', !actual && '@max-[46rem]:sr-only')}>
                    {item.titulo}
                    {bloqueado ? <span className="sr-only">, bloqueado</span> : fallido ? <span className="sr-only">, por completar</span> : null}
                  </StepperTitle>
                </StepperTrigger>
                {indice < pasos.length - 1 ? <StepperSeparator className={cn('mx-3 flex-1', STEP_LINE)} /> : null}
              </StepperItem>
            )
          })}
        </StepperNav>
      </Stepper>
    </div>
  )
}
