import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, LockIcon, Tick02Icon } from '@hugeicons/core-free-icons'
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
  cn,
} from '@ubits/flux-ui'
import { STEP_INDICATOR, STEP_LINE } from '@/modules/design-system/drawers/components/drawer-styles'

// La fila de pasos de los flujos con pasos (hoy, el roleplay): el mismo stepper del patrón «Asistente por pasos» del
// design system (Design system › Navegación › Pasos, el que usan Crear contenido y Crear vacante): número, nombre y
// línea, sin pastilla ni textos debajo. El estado se ve por la forma (check, círculo lleno o anillo) y va en texto para
// lectores de pantalla. Dos agregados funcionales: un paso ya visitado con campos pendientes lleva el aviso en vez del
// número, y uno bloqueado lleva candado y no se puede pulsar.
//
// El Stepper de la librería pinta igual activos e inactivos porque en el tema --accent es igual a --primary: los
// estados salen de STEP_INDICATOR y STEP_LINE, los mismos del patrón.

export type PasoEditor = {
  numero: number
  nombre: string
  /** Resumen cuando está completo. */
  resumen: string
  completo: boolean
  bloqueado: boolean
  /** Ya se visitó y le faltan campos: aviso en vez del número y «Campos pendientes». */
  error?: boolean
}

type Props = {
  pasos: PasoEditor[]
  actual: number
  onPaso: (paso: number) => void
}

export function PasosEditor({ pasos, actual, onPaso }: Props) {
  return (
    <Stepper value={actual} onValueChange={onPaso} indicators={{ completed: <HugeiconsIcon icon={Tick02Icon} className="size-3.5" /> }}>
      <StepperNav className="w-full">
        {pasos.map((paso, i) => {
          const estado = paso.numero === actual ? '' : paso.bloqueado ? ', bloqueado' : paso.error ? ', tiene campos pendientes' : paso.completo ? ', hecho' : ', pendiente'
          return (
            <StepperItem
              key={paso.numero}
              step={paso.numero}
              // Completo es por datos, no por posición: un paso detrás del actual puede tener campos pendientes.
              completed={paso.completo && !paso.error}
              disabled={paso.bloqueado}
              className="flex-1 last:flex-none"
            >
              <StepperTrigger aria-controls={undefined} className="gap-2">
                <StepperIndicator className={STEP_INDICATOR}>
                  {paso.error ? <HugeiconsIcon icon={Alert02Icon} size={12} aria-hidden="true" className="text-destructive" /> : paso.numero}
                </StepperIndicator>
                <StepperTitle className="flex items-center gap-1.5 text-sm whitespace-nowrap">
                  {paso.nombre}
                  {paso.bloqueado ? <HugeiconsIcon icon={LockIcon} size={13} aria-hidden="true" className="text-muted-foreground" /> : null}
                  {estado ? <span className="sr-only">{estado}</span> : null}
                </StepperTitle>
              </StepperTrigger>
              {i < pasos.length - 1 ? <StepperSeparator className={cn('mx-3 flex-1', STEP_LINE)} /> : null}
            </StepperItem>
          )
        })}
      </StepperNav>
    </Stepper>
  )
}
