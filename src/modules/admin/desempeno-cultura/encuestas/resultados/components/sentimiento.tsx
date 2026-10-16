import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { MinusSignIcon, ThumbsDownIcon, ThumbsUpIcon } from '@hugeicons/core-free-icons'
import { Badge, ToggleGroup, ToggleGroupItem } from '@ubits/flux-ui'
import type { Sentiment } from '../../modelo/questionResponses'
import { SENTIMENT_LABELS, SENTIMENT_ORDER } from '../../modelo/sentimiento'

// El sentimiento de un comentario, en piezas de la librería: su insignia, el selector para
// corregir a mano lo que leyó la IA.

export const ICONO_SENTIMIENTO: Record<Sentiment, IconSvgElement> = {
  positive: ThumbsUpIcon,
  neutral: MinusSignIcon,
  negative: ThumbsDownIcon,
}

export const VARIANTE_SENTIMIENTO: Record<Sentiment, 'success-light' | 'warning-light' | 'destructive-outline'> = {
  positive: 'success-light',
  neutral: 'warning-light',
  negative: 'destructive-outline',
}

export const LECTURA_SENTIMIENTO: Record<Sentiment, 'positive' | 'warning' | 'negative'> = {
  positive: 'positive',
  neutral: 'warning',
  negative: 'negative',
}

export function InsigniaSentimiento({ sentimiento, size = 'sm' }: { sentimiento: Sentiment; size?: 'sm' | 'default' }) {
  return (
    <Badge variant={VARIANTE_SENTIMIENTO[sentimiento]} size={size}>
      <HugeiconsIcon icon={ICONO_SENTIMIENTO[sentimiento]} aria-hidden="true" />
      {SENTIMENT_LABELS[sentimiento].label}
    </Badge>
  )
}

/** Corregir el sentimiento a mano. La corrección mueve el promedio de arriba. */
export function SelectorSentimiento({ valor, onCambio, etiqueta }: { valor: Sentiment; onCambio: (sentimiento: Sentiment) => void; etiqueta: string }) {
  return (
    <ToggleGroup variant="outline" size="sm" value={[valor]} onValueChange={(valores) => valores[0] && onCambio(valores[0] as Sentiment)} aria-label={etiqueta}>
      {SENTIMENT_ORDER.map((sentimiento) => (
        <ToggleGroupItem key={sentimiento} value={sentimiento} aria-label={SENTIMENT_LABELS[sentimiento].label}>
          <HugeiconsIcon icon={ICONO_SENTIMIENTO[sentimiento]} aria-hidden="true" />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
