import { useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { InformationCircleIcon } from '@hugeicons/core-free-icons'
import { Tooltip, TooltipTrigger, cn } from '@ubits/flux-ui'
import { BotonIcono } from './BotonIcono'
import { HintContent } from './Hint'

// El botón de ayuda que va junto a un rótulo: el círculo de información y, al tocarlo, la explicación. Sirve para sacar
// del formulario las frases que solo hacen falta la primera vez —qué mide una métrica, qué hace un interruptor— sin
// perderlas.
//
// El globo se controla para que abra también con clic: el `Tooltip` de la librería solo abre al pasar por encima, y en
// un icono de ayuda eso deja fuera a quien navega con teclado o con pantalla táctil (una de las trampas conocidas del
// playground).

export function BotonAyuda({
  etiqueta,
  side = 'top',
  className,
  children,
}: {
  /** Qué explica, para quien no ve el globo: «Qué hace «Habilitar secciones»». */
  etiqueta: string
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
  /** La explicación. */
  children: ReactNode
}) {
  const [abierta, setAbierta] = useState(false)

  return (
    <Tooltip open={abierta} onOpenChange={setAbierta}>
      <TooltipTrigger
        closeOnClick={false}
        onClick={() => setAbierta(true)}
        render={<BotonIcono size="icon-xs" aria-label={etiqueta} className={cn('shrink-0', className)} />}
      >
        <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
      </TooltipTrigger>
      {/* El mismo globo oscuro de todas las ayudas del producto (Hint), no el de la librería tal cual (auditoría, 5-oct). */}
      <HintContent side={side}>
        <span className="block max-w-60">{children}</span>
      </HintContent>
    </Tooltip>
  )
}
