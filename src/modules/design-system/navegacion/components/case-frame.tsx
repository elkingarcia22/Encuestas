import { useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import { useNavigate } from 'react-router'
import { Button, Label, Separator, Switch, cn } from '@ubits/flux-ui'
import { PAGE_WIDTH, type PageWidth } from '@/shared/components/page-width'
import styles from './case-frame.module.css'

type CaseFrameProps = {
  title: string
  hint: string
  width?: PageWidth
  // Galería a la que vuelve (por defecto, patrones de navegación).
  back?: { label: string; to: string }
  // Interruptor de anatomía; se apaga en casos que no usan el marco de página.
  anatomy?: boolean
  children: ReactNode
}

// Franja de demostración sobre cada caso: volver a la galería, qué resuelve el patrón y un interruptor
// que dibuja la anatomía (cada parte del marco con su nombre).
export function CaseFrame({
  title,
  hint,
  width = 'default',
  back = { label: 'Patrones de navegación', to: '/design-system/navegacion' },
  anatomy: withAnatomy = true,
  children,
}: CaseFrameProps) {
  const navigate = useNavigate()
  const [anatomy, setAnatomy] = useState(false)

  return (
    <div className={cn('flex flex-1 flex-col', anatomy && styles.anatomy)}>
      <div className={cn('mx-auto mb-6 flex w-full flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-dashed px-2 py-1.5', PAGE_WIDTH[width === 'narrow' ? 'default' : width])}>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground!"
          onClick={() => navigate(back.to)}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
          {back.label}
        </Button>
        <Separator orientation="vertical" className="h-5! max-sm:hidden" />
        {/* En pantallas angostas el texto va en su propio renglón y baja de línea en vez de cortarse (reflujo a 320px);
            desde sm queda en una sola línea, como siempre. */}
        <div className="min-w-0 flex-1 basis-full px-2 text-sm sm:basis-0 sm:truncate sm:px-0">
          <span className="font-medium">{title}</span>
          <span className="text-muted-foreground"> · {hint}</span>
        </div>
        {withAnatomy ? (
          <Label className="flex items-center gap-2 pr-2 text-sm font-normal max-sm:pl-2">
            Mostrar anatomía
            <Switch checked={anatomy} onCheckedChange={setAnatomy} />
          </Label>
        ) : null}
      </div>
      {/* El caso vive dentro del mismo ancho de la franja: así el ejemplo escala igual que una pantalla real. */}
      <div className={cn('mx-auto flex w-full flex-1 flex-col', PAGE_WIDTH[width === 'narrow' ? 'default' : width])}>{children}</div>
    </div>
  )
}
