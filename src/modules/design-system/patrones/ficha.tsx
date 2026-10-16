import type { ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  cn,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Frame,
  FrameDescription,
  FrameHeader,
  FrameTitle,
  Text,
} from '@ubits/flux-ui'
import styles from '@/modules/design-system/agente-contextual/components/agent.module.css'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'

// Piezas que repiten todas las pestañas del expediente. La composición sale de los bloques de ReUI «Agent Run
// Detail» (trabajo a la izquierda, datos a la derecha) y «Evaluation Report» (un Frame por bloque, con título
// y acción arriba y sus paneles adentro), con los mismos Frame que ya usan el detalle de la vacante y el Inicio.

// Bloque que el agente acaba de citar: late con el resaltado (la clave nueva reinicia la animación).
export type Destacado = { id: string; tick: number } | null

export function Marco({
  id,
  destacado = null,
  titulo,
  descripcion,
  ia = false,
  accion,
  className,
  children,
}: {
  id?: string
  destacado?: Destacado
  titulo: string
  descripcion?: ReactNode
  // Lo produjo la IA: el título lleva su icono.
  ia?: boolean
  accion?: ReactNode
  className?: string
  // Uno o más FramePanel.
  children: ReactNode
}) {
  const activo = id !== undefined && destacado?.id === id
  return (
    <Frame key={activo ? destacado.tick : id} id={id} className={cn('scroll-mt-4', activo && styles.flash, className)}>
      <FrameHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <FrameTitle className={ia ? 'flex items-center gap-2' : undefined}>
            {ia ? <IconoIA /> : null}
            {titulo}
          </FrameTitle>
          {descripcion ? <FrameDescription>{descripcion}</FrameDescription> : null}
        </div>
        {accion}
      </FrameHeader>
      {children}
    </Frame>
  )
}

// Rótulo pequeño dentro de un panel («A favor», «Por mejorar»).
export function Rotulo({ children }: { children: ReactNode }) {
  return (
    <Text as="div" variant="muted" size="xs" weight="medium">
      {children}
    </Text>
  )
}

// Lista de término y valor (la de la columna de resumen de crear vacante): es texto, no una tabla.
export function Filas({ filas }: { filas: { termino: string; valor: ReactNode }[] }) {
  return (
    <dl className="flex flex-col gap-2.5">
      {filas.map((fila) => (
        <div key={fila.termino} className="flex items-baseline justify-between gap-3">
          <Text as="span" variant="muted" size="sm" className="shrink-0">
            {fila.termino}
          </Text>
          <Text as="span" size="sm" className="min-w-0 text-right">
            {fila.valor}
          </Text>
        </div>
      ))}
    </dl>
  )
}

// Una evaluación que el candidato todavía no presenta.
export function SinResultado({ icono, titulo, texto }: { icono: IconSvgElement; titulo: string; texto: string }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HugeiconsIcon icon={icono} />
        </EmptyMedia>
        <EmptyTitle>{titulo}</EmptyTitle>
        <EmptyDescription>{texto}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
