import type { KeyboardEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon, Cancel01Icon } from '@hugeicons/core-free-icons'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Separator,
  cn,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Orb } from '@/shared/components/Orb'
import { PILL_XS } from '../../components/agent-styles'
import styles from '../../components/agent.module.css'
import { TONES, type RewriteKind } from './data'

type RewriteToolbarProps = {
  // Número del párrafo seleccionado, para el nombre de la barra.
  paragraph: number
  onRun: (kind: RewriteKind) => void
  onAsk: () => void
  onClear: () => void
}

// Flechas izquierda y derecha para moverse entre los botones, como en toda barra de herramientas (Tab también sirve).
const moveWithArrows = (event: KeyboardEvent<HTMLDivElement>) => {
  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
  const buttons = [...event.currentTarget.querySelectorAll<HTMLElement>('button')]
  const index = buttons.indexOf(document.activeElement as HTMLElement)
  if (index < 0) return
  event.preventDefault()
  buttons[(index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length].focus()
}

// Barra flotante sobre el párrafo seleccionado: mejorar, acortar, tono y preguntar.
export function RewriteToolbar({ paragraph, onRun, onAsk, onClear }: RewriteToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label={`Acciones del agente sobre el párrafo ${paragraph}`}
      onKeyDown={moveWithArrows}
      className={cn('absolute -top-11 left-0 z-10 flex items-center gap-0.5 rounded-full border bg-background p-1 shadow-lg', styles.msgIn)}
    >
      {/* El orbe marca toda la barra como de IA; «Mejorar» ya no lleva la varita (auditoría 5-oct: nada de estrellas ni varitas). */}
      <Orb className="mx-1 size-5.5" />
      <Button variant="ghost" className={PILL_XS} onClick={() => onRun('mejorar')}>
        Mejorar
      </Button>
      <Button variant="ghost" className={PILL_XS} onClick={() => onRun('acortar')}>
        Acortar
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" className={PILL_XS} />}>
          Tono
          <HugeiconsIcon icon={ArrowDown01Icon} size={14} aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          {TONES.map((tone) => (
            <DropdownMenuItem key={tone.kind} onClick={() => onRun(tone.kind)}>
              {tone.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button variant="ghost" className={PILL_XS} onClick={onAsk}>
        Preguntar
      </Button>
      <Separator orientation="vertical" className="mx-1 h-4!" />
      <BotonIcono size="icon-xs" aria-label="Quitar selección" className="mr-0.5" onClick={onClear}>
        <HugeiconsIcon icon={Cancel01Icon} size={14} />
      </BotonIcono>
    </div>
  )
}
