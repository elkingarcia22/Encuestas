import type { ReactNode } from 'react'
import { cn } from '@ubits/flux-ui'

export type AgentSketchId = 'resumen' | 'dato' | 'comparar' | 'formulario' | 'reescribir' | 'editor' | 'revision' | 'accion' | 'estados'

const Line = ({ className }: { className?: string }) => <div className={cn('h-1.5 shrink-0 rounded-full bg-foreground/12', className)} />
const Box = ({ className, children }: { className?: string; children?: ReactNode }) => (
  <div className={cn('rounded-[4px] border bg-background', className)}>{children}</div>
)
const Mark = 'bg-primary/10 ring-1 ring-primary/40'

// Lado izquierdo: la pantalla de trabajo con lo que el agente está mirando resaltado.
const PAGES: Record<AgentSketchId, ReactNode> = {
  resumen: (
    <>
      <div className="flex items-center gap-1.5">
        <div className="size-5 rounded-full bg-foreground/15" />
        <Line className="h-2 w-16" />
      </div>
      <Box className="flex flex-col gap-1 p-1.5">
        <Line className="w-4/5" />
        <Line className="w-3/5" />
      </Box>
      <Box className={cn('flex flex-col gap-1 p-1.5', Mark)}>
        <Line className="w-full" />
        <Line className="w-2/3" />
      </Box>
      <Box className="flex-1" />
    </>
  ),
  dato: (
    <>
      <div className="grid grid-cols-3 gap-1">
        <Box className="h-6" />
        <Box className={cn('h-6', Mark)} />
        <Box className="h-6" />
      </div>
      <Box className="flex flex-1 items-end gap-1 p-1.5">
        {[35, 55, 45, 70, 95, 60].map((h, i) => (
          <div key={h} className={cn('flex-1 rounded-t-[2px]', i === 4 ? 'bg-primary/80' : 'bg-foreground/15')} style={{ height: `${h}%` }} />
        ))}
      </Box>
    </>
  ),
  comparar: (
    <div className="grid flex-1 grid-cols-3 gap-1">
      {[0, 1, 2].map((i) => (
        <Box key={i} className="flex flex-col items-center gap-1 p-1.5">
          <div className="size-4 rounded-full bg-foreground/15" />
          <Line className="w-8" />
          <Line className="w-6" />
        </Box>
      ))}
    </div>
  ),
  formulario: (
    <>
      <Line className="h-2 w-16" />
      {[false, true, true, false].map((suggested, i) => (
        <div key={i} className={cn('flex flex-col gap-1 rounded-[4px] p-1', suggested && Mark)}>
          <Line className="h-1 w-8" />
          <div className="h-3 rounded-[3px] border bg-background" />
        </div>
      ))}
    </>
  ),
  reescribir: (
    <>
      <Line className="h-2 w-20" />
      <Line />
      <Line className="w-11/12" />
      <div className="relative mt-2">
        <div className="absolute -top-3.5 left-4 flex gap-1 rounded-full bg-foreground/85 px-1.5 py-1">
          <div className="h-1.5 w-4 rounded-full bg-background/70" />
          <div className="h-1.5 w-4 rounded-full bg-background/40" />
        </div>
        <div className="rounded-[2px] bg-primary/20 py-0.5">
          <Line className="w-full bg-primary/40" />
        </div>
      </div>
      <Line className="w-4/5" />
      <Line className="w-3/5" />
    </>
  ),
  editor: (
    <>
      <Line className="h-3 w-24" />
      <div className="flex gap-2 border-b pb-1">
        <Line className="w-8 bg-primary/60" />
        <Line className="w-8" />
      </div>
      <div className="h-3 rounded-[3px] border bg-background" />
      <div className={cn('h-8 rounded-[3px] border bg-background', Mark)} />
      <Box className="flex-1" />
    </>
  ),
  revision: (
    <>
      <Line className="h-2 w-20" />
      {[true, false, true, false, false, true].map((flag, i) => (
        <div key={i} className="flex items-center gap-1">
          <div className={cn('size-2 shrink-0 rounded-full', flag ? 'bg-warning' : 'bg-transparent')} />
          <Line className={i % 2 ? 'w-4/5' : 'w-full'} />
        </div>
      ))}
    </>
  ),
  accion: (
    <Box className="flex flex-1 flex-col">
      {[true, true, true, false, true].map((checked, i) => (
        <div key={i} className="flex items-center gap-1 border-b px-1.5 py-1 last:border-b-0">
          <div className={cn('size-2 rounded-[2px] border', checked && 'border-primary bg-primary/80')} />
          <Line className="w-14" />
        </div>
      ))}
    </Box>
  ),
  estados: (
    <div className="flex flex-1 flex-col gap-1.5 opacity-50">
      <Line className="h-2 w-20" />
      <Box className="h-8" />
      <Box className="flex-1" />
    </div>
  ),
}

// Lado derecho: el panel del agente con su contenido típico.
const PANELS: Partial<Record<AgentSketchId, ReactNode>> = {
  comparar: (
    <div className="grid grid-cols-3 gap-px overflow-hidden rounded-[4px] border bg-border">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="h-3 bg-background" />
      ))}
    </div>
  ),
  accion: (
    <Box className="flex flex-col gap-1 p-1.5">
      <Line className="w-10" />
      <Line className="w-14" />
      <div className="mt-0.5 h-2.5 w-10 rounded-full bg-primary/80" />
    </Box>
  ),
  revision: (
    <div className="flex flex-col gap-1">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-1 rounded-[3px] border bg-background p-1">
          <div className="size-2 rounded-full bg-warning" />
          <Line className="w-10" />
        </div>
      ))}
    </div>
  ),
  estados: (
    <div className="flex flex-col gap-1.5">
      <div className="h-1.5 w-16 rounded-full bg-linear-to-r from-foreground/10 via-foreground/30 to-foreground/10" />
      <div className="flex flex-wrap gap-1">
        <div className="h-2.5 w-8 rounded-full border" />
        <div className="h-2.5 w-10 rounded-full border" />
      </div>
    </div>
  ),
}

export function AgentSketch({ id }: { id: AgentSketchId }) {
  const wide = id === 'comparar'
  return (
    // Dibujo esquemático: el título y la descripción de la tarjeta ya dicen de qué se trata.
    <div aria-hidden="true" className="flex h-40 overflow-hidden rounded-lg border bg-muted/50">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3">{PAGES[id]}</div>
      <div className={cn('flex shrink-0 flex-col gap-1.5 border-l bg-background p-2', wide ? 'w-3/5' : 'w-2/5')}>
        <div className="flex items-center gap-1 border-b pb-1.5">
          <div className="size-2.5 rounded-full bg-linear-to-br from-primary/80 to-primary/30" />
          <Line className="w-10" />
        </div>
        <div className="ml-auto h-2.5 w-3/4 rounded-[5px_5px_2px_5px] bg-muted" />
        {PANELS[id] ?? (
          <Box className="flex flex-col gap-1 p-1.5">
            <Line className="h-1 w-6" />
            <Line />
            <Line className="w-3/4" />
          </Box>
        )}
        <div className="mt-auto h-3 rounded-full border" />
      </div>
    </div>
  )
}
