import type { ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Tick02Icon } from '@hugeicons/core-free-icons'
import { Heading, Stepper, StepperIndicator, StepperItem, StepperNav, StepperSeparator, StepperTitle, StepperTrigger, Text } from '@ubits/flux-ui'
import { STEP_INDICATOR, STEP_LINE } from '@/modules/design-system/drawers/components/drawer-styles'

// Los asistentes por pasos del módulo (comparar y cargar encuestas) en la franja bajo la cabecera del drawer, como el
// «Formulario por pasos» del design system. Solo se vuelve atrás: los pasos siguientes se ganan con «Siguiente».

export function PasosDrawer({ pasos, actual, onVolver }: { pasos: readonly string[]; actual: number; onVolver: (paso: number) => void }) {
  return (
    <div className="border-b px-5 py-3">
      <Stepper value={actual} onValueChange={(valor) => valor < actual && onVolver(valor)} indicators={{ completed: <HugeiconsIcon icon={Tick02Icon} className="size-3.5" /> }}>
        <StepperNav className="w-full">
          {pasos.map((etiqueta, indice) => (
            <StepperItem key={etiqueta} step={indice + 1} completed={actual > indice + 1} className="flex-1 last:flex-none">
              <StepperTrigger className="gap-2" aria-controls={undefined}>
                <StepperIndicator className={STEP_INDICATOR}>{indice + 1}</StepperIndicator>
                <StepperTitle className="text-sm whitespace-nowrap">{etiqueta}</StepperTitle>
              </StepperTrigger>
              {indice < pasos.length - 1 ? <StepperSeparator className={`mx-3 flex-1 ${STEP_LINE}`} /> : null}
            </StepperItem>
          ))}
        </StepperNav>
      </Stepper>
    </div>
  )
}

// El título de cada paso dentro del cuerpo: la pregunta del paso y una línea que la explica.
export function EncabezadoPaso({ titulo, descripcion, extra }: { titulo: string; descripcion: string; extra?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-col gap-1">
        <Heading as="h3" level={6}>
          {titulo}
        </Heading>
        <Text size="sm" variant="muted">
          {descripcion}
        </Text>
      </div>
      {extra}
    </div>
  )
}
