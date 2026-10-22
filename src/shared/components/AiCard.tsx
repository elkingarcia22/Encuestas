import type { ReactElement } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { Badge, Button, Heading, Text, cn } from '@ubits/flux-ui'
import { Orb } from '@/shared/components/Orb'
import styles from './tarjeta-ia.module.css'

// Tarjeta de invitación a la IA: aparece dentro de una pantalla normal para ofrecer que la IA haga el trabajo.
// En el Inicio es «Crear un curso». El color va como luz en el borde de arriba (halo), no rellenando la tarjeta,
// y el botón lleva el degradado de marca. Se documenta en /design-system/tarjeta-ia.
export type AiCardProps = {
  title: string
  description?: string
  /** Texto del botón. Sin él, la tarjeta solo anuncia. */
  action?: string
  /** Qué hace el botón: navegar (`render`) o ejecutar algo. */
  render?: ReactElement
  onAction?: () => void
  /** El orbe grande arriba. Es lo que dice «esto lo hace la IA». */
  orb?: boolean
  /** Insignia junto al orbe, para marcar que es nuevo. */
  badge?: string
  /** El resplandor de color. Se apaga cuando la pantalla ya tiene otra pieza de IA y serían dos focos. */
  halo?: boolean
  /** Compacta: sin bajada y con menos aire, para columnas estrechas. */
  compact?: boolean
  /** Sin borde propio, cuando la tarjeta va dentro de un marco que ya lo pone (el `Frame` del Inicio). */
  inFrame?: boolean
  className?: string
  /** Nombres de la anatomía del design system. En el producto va vacío y no pinta nada. */
  regions?: Partial<Record<'card' | 'halo' | 'orb' | 'badge' | 'title' | 'description' | 'action', string>>
}

export function AiCard({
  title,
  description,
  action,
  render,
  onAction,
  orb = true,
  badge,
  halo = true,
  compact = false,
  inFrame = false,
  className,
  regions,
}: AiCardProps) {
  return (
    <div
      data-slot="ai-card"
      data-region={regions?.card}
      className={cn(
        styles.vars,
        styles.halo,
        !halo && styles.sinHalo,
        'relative isolate flex flex-col items-start overflow-hidden rounded-md bg-card',
        !inFrame && 'border',
        compact ? 'gap-3 p-4' : 'gap-4 p-5',
        className,
      )}
    >
      {/* Todo el contenido va por encima del halo. */}
      <div className={cn('relative flex flex-col items-start', compact ? 'gap-3' : 'gap-4')}>
        {orb || badge ? (
          <div className="flex items-center gap-2">
            {orb ? (
              <span data-region={regions?.orb} data-chip="top" className="flex">
                <Orb className={compact ? 'size-9' : 'size-11'} />
              </span>
            ) : null}
            {badge ? (
              <Badge data-region={regions?.badge} data-chip="top" variant="info" size="sm">
                {badge}
              </Badge>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col gap-1">
          <Heading as="h3" level={6} data-region={regions?.title} data-chip="inline">
            {title}
          </Heading>
          {description && !compact ? (
            <Text variant="muted" size="sm" data-region={regions?.description}>
              {description}
            </Text>
          ) : null}
        </div>

        {action ? (
          // El botón de IA va en pastilla (la pastilla es solo para IA) y el Button de flux-ui todavía no trae la
          // propiedad de radio, así que se le redefine la variable, como en el resto del marco.
          <Button
            size={compact ? 'sm' : 'default'}
            nativeButton={render ? false : undefined}
            render={render}
            onClick={onAction}
            data-region={regions?.action}
            className={cn('[--radius:calc(infinity*1px)]', styles.botonMarca, 'border-0! hover:text-white!')}
          >
            {action}
            <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" data-icon="inline-end" />
          </Button>
        ) : null}
      </div>
    </div>
  )
}
