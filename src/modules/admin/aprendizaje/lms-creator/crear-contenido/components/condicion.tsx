import type { ComponentProps, ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { Badge } from '@/shared/components/Badge'

/**
 * **Una condición de la actividad**: lo que hay que saber antes de empezar y tener a mano mientras se hace.
 *
 * La usan por igual la **evaluación** —cuántas preguntas, con cuánto se aprueba, qué intento va, el reloj— y el
 * **roleplay** —cuánto dura la llamada, qué intento va—. Las dos pantallas evalúan y las dos tienen intentos, así
 * que sus condiciones se leen iguales: una sola pieza, no una por recurso (Dave, 13-oct).
 *
 * Viven en el marco gris, debajo del título de la página, y se quedan ahí mientras se responde. Por eso van en
 * `invert-light` —la misma insignia que la de navegación del índice—: sobre el gris, una de color pasaría por un
 * estado o por algo que se pulsa. `alerta` es la excepción, para las que de verdad avisan: el último intento y el
 * último minuto.
 */
export function Condicion({
  icono,
  alerta = false,
  children,
  ...resto
}: { icono: IconSvgElement; alerta?: boolean; children: ReactNode } & ComponentProps<typeof Badge>) {
  return (
    <Badge variant={alerta ? 'destructive-light' : 'invert-light'} size="lg" className="tabular-nums" {...resto}>
      <HugeiconsIcon icon={icono} aria-hidden="true" />
      {children}
    </Badge>
  )
}

/** La fila donde van, siempre debajo del título y con el mismo reparto en los dos recursos. */
export function Condiciones({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>
}
