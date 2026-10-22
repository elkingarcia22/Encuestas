import { useEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Coins01Icon } from '@hugeicons/core-free-icons'
import { cn, Text } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { Hint } from '@/shared/components/Hint'
import paleta from '@/shared/components/tarjeta-ia.module.css'
import { formatoTokens } from './borrador'
import styles from './tokens.module.css'

// Los tokens de IA: la insignia con el saldo (cabeceras de las superficies de IA) y el costo dentro de un botón.
// Borde en el degradado de la IA, como el badge IA «outlined» del prototipo; número y moneda en el color del texto.
// Es el badge IA de tokens de UBITS (React y vanilla) con su microinteracción al gastar: la insignia se aplasta y
// rebota, la moneda gira, el número baja contando y un «−N» en rojo sube y se desvanece. La librería no trae uno.

/** Lo que dura el aplastón y el «−N» (paridad con el prototipo). */
const GASTO_MS = 850

/** Saldo de tokens; al bajar, se anima el gasto. */
export function TokenBadge({ tokens }: { tokens: number }) {
  const [mostrado, setMostrado] = useState(tokens)
  const [gasto, setGasto] = useState<number | null>(null)
  // Cada gasto vuelve a montar la insignia para que la animación arranque de cero aunque se gaste dos veces seguidas.
  const [vuelta, setVuelta] = useState(0)
  const anterior = useRef(tokens)

  useEffect(() => {
    const desde = anterior.current
    anterior.current = tokens
    if (tokens >= desde) {
      setMostrado(tokens)
      setGasto(null)
      return
    }
    // La misma cuenta del prototipo: de uno en uno si son pocos; si no, en unos 18 pasos.
    const monto = desde - tokens
    const cada = monto <= 20 ? Math.max(45, Math.min(140, 320 / monto)) : Math.max(32, Math.min(80, 700 / monto))
    const paso = monto <= 20 ? 1 : Math.max(1, Math.ceil(monto / 18))
    let actual = desde
    setGasto(monto)
    setVuelta((v) => v + 1)
    const cuenta = window.setInterval(() => {
      actual = Math.max(tokens, actual - paso)
      setMostrado(actual)
      if (actual <= tokens) window.clearInterval(cuenta)
    }, cada)
    const fin = window.setTimeout(() => setGasto(null), GASTO_MS)
    return () => {
      window.clearInterval(cuenta)
      window.clearTimeout(fin)
      setMostrado(tokens)
    }
  }, [tokens])

  return (
    <Hint label="Número de tokens restantes.">
      <span className={styles.host}>
        <Badge
          key={vuelta}
          variant="outline"
          className={cn(paleta.vars, styles.insignia, 'gap-1 tabular-nums', gasto !== null && styles.gastando)}
          aria-label={`${formatoTokens(tokens)} tokens restantes`}
          tabIndex={0}
        >
          <HugeiconsIcon icon={Coins01Icon} size={12} aria-hidden="true" className={styles.moneda} />
          {formatoTokens(mostrado)}
        </Badge>
        {gasto !== null ? (
          <Text as="span" key={vuelta} size="xs" weight="semibold" className={cn(styles.menos, 'text-destructive')} aria-hidden="true">
            −{formatoTokens(gasto)}
          </Text>
        ) : null}
      </span>
    </Hint>
  )
}

/**
 * El costo dentro de un botón de IA: moneda y número, en el color del botón un poco más tenue. Va igual en el primario
 * (sobre el degradado) y en el secundario: «Generar portada 🪙 50».
 */
export function TokenCost({ cost }: { cost: number }) {
  return (
    <span className="inline-flex items-center gap-1 tabular-nums opacity-75" aria-label={`${formatoTokens(cost)} tokens`}>
      {formatoTokens(cost)}
      <HugeiconsIcon icon={Coins01Icon} size={14} aria-hidden="true" />
    </span>
  )
}
