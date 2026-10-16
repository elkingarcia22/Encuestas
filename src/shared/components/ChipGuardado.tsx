import { useCallback, useEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Tick02Icon } from '@hugeicons/core-free-icons'
import { Badge, Spinner } from '@ubits/flux-ui'

// Estado del guardado automático, junto al título: informa, no se pulsa. Nació en «Crear vacante» y lo comparten los
// flujos que guardan solos mientras se edita (Crear contenido, editor de video, presentación interactiva).

export type EstadoGuardado = 'editando' | 'guardando' | 'guardado'

export function ChipGuardado({ estado }: { estado: EstadoGuardado }) {
  if (estado === 'guardando') {
    return (
      <Badge variant="secondary" radius="full" size="lg" aria-live="polite">
        <Spinner className="size-3" />
        Guardando…
      </Badge>
    )
  }
  if (estado === 'editando') {
    return (
      <Badge variant="outline" radius="full" size="lg" aria-live="polite">
        Cambios sin guardar
      </Badge>
    )
  }
  return (
    <Badge variant="success-outline" radius="full" size="lg" aria-live="polite">
      <HugeiconsIcon icon={Tick02Icon} aria-hidden="true" />
      Guardado
    </Badge>
  )
}

/**
 * Guardado simulado para las maquetas. Cada aviso de cambio reinicia el ciclo completo:
 * «Cambios sin guardar» → «Guardando…» → «Guardado».
 *
 * Mientras se escribe se queda en el primero, porque cada tecla vuelve a empezar; el guardado arranca al parar. Es el
 * mismo comportamiento de Crear vacante, y es lo que hace que el chip se sienta vivo en vez de decir siempre lo mismo.
 */
export function useGuardadoSimulado() {
  const [estado, setEstado] = useState<EstadoGuardado>('guardado')
  const tiempos = useRef<number[]>([])
  useEffect(() => () => tiempos.current.forEach((t) => window.clearTimeout(t)), [])

  const disparar = useCallback(() => {
    tiempos.current.forEach((t) => window.clearTimeout(t))
    setEstado('editando')
    tiempos.current = [
      window.setTimeout(() => setEstado('guardando'), MS_ANTES_DE_GUARDAR),
      window.setTimeout(() => setEstado('guardado'), MS_ANTES_DE_GUARDAR + MS_GUARDANDO),
    ]
  }, [])

  return [estado, disparar] as const
}

// Lo que se espera sin escribir antes de guardar, y lo que dura el «Guardando…».
const MS_ANTES_DE_GUARDAR = 900
const MS_GUARDANDO = 700
