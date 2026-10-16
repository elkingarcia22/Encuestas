import { useEffect, useState } from 'react'
import { cn } from '@ubits/flux-ui'
import { Orb } from './Orb'
import styles from './ai-thinking.module.css'

type AiThinkingProps = {
  /** Lo que está haciendo. Por defecto «Razonando…». */
  label?: string
  /** `md` para el chat (orbe de 24px y texto de cuerpo); `sm` para paneles laterales. */
  size?: 'sm' | 'md'
  /** Sin orbe cuando el bloque que lo contiene ya tiene uno (una respuesta que se está rehaciendo). */
  orb?: boolean
  /** Con un avance conocido (0–100, p. ej. generar un video), muestra el porcentaje en lugar de los segundos. */
  progreso?: number
  className?: string
}

// La única forma de decir «la IA está trabajando»: el orbe respira, el texto brilla de izquierda a derecha y al lado
// corren los segundos que lleva. Se usa en el chat de Suite AI, en el panel del agente contextual y en el editor.
export function AiThinking({ label = 'Razonando…', size = 'sm', orb = true, progreso, className }: AiThinkingProps) {
  const [seconds, setSeconds] = useState(0)
  // El aviso para el lector de pantalla se escribe un instante después de montar: si el texto llega junto con la
  // región, varios lectores no lo anuncian.
  const [status, setStatus] = useState('')

  useEffect(() => {
    const tick = window.setInterval(() => setSeconds((value) => value + 1), 1000)
    const id = window.setTimeout(() => setStatus('La IA está preparando la respuesta'), 100)
    return () => {
      window.clearInterval(tick)
      window.clearTimeout(id)
    }
  }, [])

  return (
    <div className={cn('flex items-center', size === 'md' ? 'gap-3' : 'gap-2.5', className)}>
      {orb ? <Orb className={cn(size === 'md' ? 'size-6' : 'size-5.5', styles.breathe)} /> : null}
      <span aria-hidden="true" className={cn(size === 'md' ? 'text-base' : 'text-sm', styles.shimmer)}>
        {label}
      </span>
      {/* Con avance conocido, el porcentaje; si no, los segundos, que aparecen al cumplirse el primero (sin «0s»). */}
      {progreso != null ? (
        <span aria-hidden="true" className="text-xs text-muted-foreground tabular-nums">
          {Math.round(progreso).toLocaleString('es-CO')} %
        </span>
      ) : seconds > 0 ? (
        <span aria-hidden="true" className="text-xs text-muted-foreground tabular-nums">
          {seconds}s
        </span>
      ) : null}
      <span role="status" className="sr-only">
        {status}
      </span>
    </div>
  )
}
