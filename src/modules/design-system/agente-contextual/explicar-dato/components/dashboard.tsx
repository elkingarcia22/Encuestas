import type { CSSProperties } from 'react'
import { Button, Card, Frame, FramePanel, cn } from '@ubits/flux-ui'
import { Orb } from '@/shared/components/Orb'
import { CeldaCifra } from '../../../metricas/cifras'
import { AREAS, CHART_MAX, KPIS, MONTHS, TARGET, formatPct } from './data'

type AskProps = { selected: string | null; onAsk: (id: string) => void }

// Pastilla «Preguntar» que aparece al pasar el cursor o al llegar con el teclado.
function AskPill({ label, onAsk, className, style }: { label: string; onAsk: () => void; className?: string; style?: CSSProperties }) {
  return (
    <Button
      variant="outline"
      aria-label={label}
      style={style}
      className={cn(
        'h-7! gap-1.5! rounded-full! pr-2.5! pl-1! text-[13px]! font-normal! opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus-visible:opacity-100',
        className,
      )}
      onClick={(event) => {
        event.stopPropagation()
        onAsk()
      }}
    >
      <Orb className="size-5" />
      Preguntar
    </Button>
  )
}

// Las cifras del tablero en una sola fila partida por líneas, como Indicadores, y sin variación (auditoría 5-oct,
// decisión 11). Antes eran cuatro tarjetas sueltas con el número armado a mano. Indicadores no deja tocar una cifra y
// aquí cada una se toca para preguntarle al agente: se arma con su mismo marco y su misma celda (CeldaCifra), más la
// pastilla «Preguntar». La que está en el panel queda marcada con el anillo azul.
export function KpiGrid({ selected, onAsk }: AskProps) {
  return (
    <Frame>
      <FramePanel>
        <div className="grid grid-cols-2 gap-2 divide-border @4xl:grid-cols-4 @4xl:gap-0 @4xl:divide-x">
          {KPIS.map((kpi) => (
            // La línea va en la celda de afuera (recta); el anillo y el fondo al pasar el cursor, en la de adentro.
            <div key={kpi.id} className="min-w-0 @4xl:px-2 @4xl:first:ps-0 @4xl:last:pe-0">
              <div
                onClick={() => onAsk(kpi.id)}
                className={cn(
                  'group relative cursor-pointer rounded-lg p-3 pr-24 transition-colors hover:bg-muted/50',
                  selected === kpi.id && 'ring-2 ring-primary ring-inset',
                )}
              >
                <CeldaCifra cifra={{ etiqueta: kpi.title, valor: kpi.value, detalle: kpi.note, atencion: kpi.bad }} />
                <AskPill
                  label={`Preguntar al agente por ${kpi.title}`}
                  onAsk={() => onAsk(kpi.id)}
                  className={cn('absolute top-3 right-3', selected === kpi.id && 'hidden!')}
                />
              </div>
            </div>
          ))}
        </div>
      </FramePanel>
    </Frame>
  )
}

export function RotationChart({ selected, onAsk }: AskProps) {
  return (
    <Card className="gap-0! py-0!">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b px-5 py-4">
        <div>
          <div className="text-base font-semibold">Rotación voluntaria por mes</div>
          <div className="text-sm text-muted-foreground">Marzo a septiembre 2026 · septiembre va hasta el 13</div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span aria-hidden="true" className="w-4 border-t border-dashed border-muted-foreground" />
          Meta 2,5%
        </div>
      </div>
      {/* Alternativa en texto del gráfico: cada barra es un botón con el mes y su valor, y el grupo dice qué se mide. Los
          números sobre las barras y los meses de abajo se repetirían al leerlo: van ocultos para el lector. */}
      <div role="group" aria-label="Rotación voluntaria por mes, marzo a septiembre 2026. Meta: 2,5%" className="px-5 pt-12 pb-4">
        <div className="relative flex h-52 items-end gap-3">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 border-t border-dashed border-muted-foreground/50"
            style={{ bottom: `${(TARGET / CHART_MAX) * 100}%` }}
          />
          {MONTHS.map((month) => {
            const active = selected === month.id
            const height = (month.value / CHART_MAX) * 100
            return (
              <div key={month.id} className="group relative flex h-full flex-1 flex-col items-center justify-end">
                <AskPill
                  label={`Preguntar al agente por ${month.name}`}
                  onAsk={() => onAsk(month.id)}
                  className={cn('absolute left-1/2 z-10 -translate-x-1/2', active && 'hidden!')}
                  style={{ bottom: `calc(${height}% + 1.75rem)` }}
                />
                <span aria-hidden="true" className={cn('mb-1.5 text-xs tabular-nums', active ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                  {formatPct(month.value)}%
                </span>
                <button
                  type="button"
                  aria-label={`Rotación de ${month.name}: ${formatPct(month.value)}%. Preguntar al agente`}
                  aria-current={active ? true : undefined}
                  onClick={() => onAsk(month.id)}
                  className={cn(
                    'w-full max-w-14 cursor-pointer rounded-t-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    active
                      ? 'bg-primary ring-2 ring-primary ring-offset-2 ring-offset-background'
                      : month.value > 3
                        ? 'bg-primary/60 hover:bg-primary/75'
                        : 'bg-primary/25 hover:bg-primary/40',
                  )}
                  style={{ height: `${height}%` }}
                />
              </div>
            )
          })}
        </div>
        <div aria-hidden="true" className="mt-2 flex gap-3">
          {MONTHS.map((month) => (
            <div key={month.id} className={cn('flex-1 text-center text-xs', selected === month.id ? 'font-medium text-foreground' : 'text-muted-foreground')}>
              {month.short}
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

export function AreaCard() {
  const max = Math.max(...AREAS.map((area) => area.value))
  return (
    <Card className="gap-0! py-0!">
      <div className="border-b px-5 py-4">
        <div className="text-base font-semibold">Rotación por área</div>
        <div className="text-sm text-muted-foreground">Agosto 2026</div>
      </div>
      <div className="flex flex-col gap-4 px-5 py-5">
        {AREAS.map((area) => (
          <div key={area.name}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate">{area.name}</span>
              <span className="font-medium tabular-nums">{formatPct(area.value)}%</span>
            </div>
            {/* La barra repite el porcentaje de arriba: solo visual. */}
            <div aria-hidden="true" className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className={cn('h-full rounded-full', area.value > 3 ? 'bg-primary' : 'bg-primary/40')} style={{ width: `${(area.value / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
