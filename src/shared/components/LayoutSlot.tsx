import type { ReactNode } from 'react'

const tones = {
  sidebar: 'bg-sky-200 text-sky-950',
  header: 'bg-amber-200 text-amber-950',
  'card-1': 'bg-rose-200 text-rose-950',
  'card-2': 'bg-emerald-200 text-emerald-950',
  'card-3': 'bg-violet-200 text-violet-950',
  main: 'bg-cyan-200 text-cyan-950',
} as const

export type LayoutSlotTone = keyof typeof tones

type LayoutSlotProps = {
  label: string
  tone: LayoutSlotTone
  className?: string
  children?: ReactNode
}

export function LayoutSlot({
  label,
  tone,
  className = '',
  children,
}: LayoutSlotProps) {
  return (
    <section
      className={`relative flex min-h-0 flex-col overflow-hidden rounded-2xl ${tones[tone]} ${className}`}
    >
      <span className="pointer-events-none absolute left-3 top-3 text-[11px] font-semibold uppercase tracking-[0.14em] opacity-70">
        {label}
      </span>
      {children ? (
        <div className="relative flex min-h-0 flex-1 flex-col p-6 pt-10">
          {children}
        </div>
      ) : null}
    </section>
  )
}
