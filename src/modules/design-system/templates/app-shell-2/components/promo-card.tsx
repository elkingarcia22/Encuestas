import { useState } from 'react'

import { Button, Card } from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon } from '@hugeicons/core-free-icons'

import { PROMO_CARD } from './data'

// La preferencia de cierre no persiste entre sesiones (coincide con el
// comportamiento real de AppSidebar.tsx: solo estado local en memoria).
export function PromoCard() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) {
    return null
  }

  return (
    <Card className="relative gap-2 p-3 group-data-[collapsible=icon]:hidden">
      <BotonIcono
        size="icon-xs"
        className="absolute top-2 right-2"
        onClick={() => setDismissed(true)}
        aria-label="Cerrar"
      >
        <HugeiconsIcon icon={Cancel01Icon} size={14} aria-hidden="true" />
      </BotonIcono>
      <div className="bg-gradient-to-br from-primary to-chart-4 text-primary-foreground flex size-9 items-center justify-center rounded-full">
        <HugeiconsIcon icon={PROMO_CARD.icon} size={18} aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold">{PROMO_CARD.title}</p>
        <p className="text-muted-foreground text-xs">{PROMO_CARD.description}</p>
      </div>
      <Button size="sm" className="mt-1 w-full">
        {PROMO_CARD.actionLabel}
      </Button>
    </Card>
  )
}
