import { useRef, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Tick02Icon, Undo02Icon } from '@hugeicons/core-free-icons'
import { FieldLabel, cn } from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Orb } from '@/shared/components/Orb'
import { SUGGESTED } from '../../components/agent-styles'
import styles from '../../components/agent.module.css'
import type { FieldKey, FieldStatus } from './form-data'

type SuggestFieldProps = {
  id: FieldKey
  label: string
  htmlFor?: string
  status: FieldStatus
  flash: boolean
  onAccept: () => void
  onUndo: () => void
  className?: string
  children: ReactNode
}

// Campo del formulario que el agente puede llenar: mientras está sugerido lleva el recuadro de marca,
// la etiqueta «Sugerido por el agente» y los botones Aceptar / Deshacer.
export function SuggestField({ id, label, htmlFor, status, flash, onAccept, onUndo, className, children }: SuggestFieldProps) {
  const suggested = status === 'suggested'
  const ref = useRef<HTMLDivElement>(null)

  // Aceptar y Deshacer desaparecen al usarlos: el foco pasa al campo, que es lo siguiente que se revisa.
  const thenFocusField = (action: () => void) => () => {
    action()
    window.requestAnimationFrame(() => ref.current?.querySelector<HTMLElement>('[data-field-control] :is(input, textarea, button)')?.focus())
  }

  return (
    <div
      ref={ref}
      id={`campo-${id}`}
      className={cn('-m-2.5 flex flex-col gap-2 rounded-xl p-2.5 transition-shadow duration-300', suggested && SUGGESTED, flash && styles.flash, className)}
    >
      <div className="flex min-h-6 items-center gap-2">
        {/* Con id: los campos que no son de texto (Modalidad) se nombran con esta etiqueta por aria-labelledby. */}
        <FieldLabel id={`etiqueta-${id}`} htmlFor={htmlFor} className="flex-1">
          {label}
        </FieldLabel>
        {suggested ? (
          <>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Orb className="size-4" />
              Sugerido por el agente
            </span>
            <BotonIcono size="icon-xs" aria-label={`Aceptar ${label}`} onClick={thenFocusField(onAccept)}>
              <HugeiconsIcon icon={Tick02Icon} size={14} />
            </BotonIcono>
            <BotonIcono size="icon-xs" aria-label={`Deshacer ${label}`} onClick={thenFocusField(onUndo)}>
              <HugeiconsIcon icon={Undo02Icon} size={14} />
            </BotonIcono>
          </>
        ) : status === 'accepted' ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <HugeiconsIcon icon={Tick02Icon} size={14} />
            Aceptado
          </span>
        ) : null}
      </div>
      <div data-field-control="" className="contents">
        {children}
      </div>
    </div>
  )
}
