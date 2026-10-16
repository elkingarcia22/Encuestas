import { Card, Progress, Text } from '@ubits/flux-ui'

import { LICENCIAS } from './data'

// Réplica de la tarjeta de consumo del bloque: título en tono de advertencia,
// una línea de contexto y la barra partida entre usado y libre.
export function UsageCard() {
  const libres = 100 - LICENCIAS.usadas

  return (
    <Card className="gap-2.5 p-3 group-data-[collapsible=icon]:hidden">
      <div className="flex flex-col gap-1">
        <p className="text-warning text-sm font-semibold">{LICENCIAS.titulo}</p>
        <p className="text-muted-foreground text-xs leading-normal">{LICENCIAS.descripcion}</p>
      </div>
      <Progress value={LICENCIAS.usadas} aria-label={`${LICENCIAS.usadas}% de las licencias en uso`} />
      <div className="flex items-center justify-between">
        <Text as="span" variant="muted" size="xs">
          <Text as="span" size="xs" weight="semibold">
            {LICENCIAS.usadas}%
          </Text>{' '}
          en uso
        </Text>
        <Text as="span" variant="muted" size="xs">
          <Text as="span" size="xs" weight="semibold">
            {libres}%
          </Text>{' '}
          libres
        </Text>
      </div>
    </Card>
  )
}
