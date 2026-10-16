import { Button } from '@ubits/flux-ui'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, Download01Icon } from '@hugeicons/core-free-icons'

export function PageHeader() {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-foreground text-xl leading-none font-semibold">Overview</h1>
        <p className="text-muted-foreground text-sm">La vista general de tu workspace.</p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <HugeiconsIcon icon={Download01Icon} size={16} aria-hidden="true" />
          Exportar
        </Button>
        <Button size="sm">
          <HugeiconsIcon icon={Add01Icon} size={16} aria-hidden="true" />
          Nuevo reporte
        </Button>
      </div>
    </div>
  )
}
