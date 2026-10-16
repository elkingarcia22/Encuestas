import { type ReactNode } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from '@ubits/flux-ui'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'

import { CampoFecha, RangoDeFechas } from '@/modules/design-system/formularios/rango-de-fechas'
import { HOY } from '@/modules/design-system/patrones/formato'
import { PERIODOS, type Rango } from './datos'
import { useEsAncha } from './utilidades'

// Piezas compartidas por las pestañas Tareas y Planes.

// Maestro-detalle: lista a la izquierda y detalle de la fila elegida a la derecha. En pantallas
// angostas el detalle se abre en el drawer al elegir una fila.
export function MaestroDetalle({
  lista,
  detalle,
  tituloDetalle,
  abiertoEnPanel,
  onCerrarPanel,
}: {
  lista: ReactNode
  detalle: ReactNode
  tituloDetalle: string
  abiertoEnPanel: boolean
  onCerrarPanel: () => void
}) {
  const ancha = useEsAncha()

  if (ancha) {
    return (
      <div className="grid grid-cols-[minmax(0,1fr)_24rem] items-start gap-4">
        <div data-region="Lista" className="min-w-0">
          {lista}
        </div>
        <div data-region="Detalle" className="sticky top-4 min-w-0">
          {detalle}
        </div>
      </div>
    )
  }

  return (
    <>
      <div data-region="Lista" className="min-w-0">
        {lista}
      </div>
      {/* En pantallas angostas el detalle abre en el drawer del producto. La tarjeta del detalle va adentro tal cual y ya
          trae el nombre, así que la cabecera dice qué es («Detalle de la tarea») y no lo repite. */}
      <DrawerShell
        open={abiertoEnPanel}
        onOpenChange={(abierto) => (abierto ? undefined : onCerrarPanel())}
        title={tituloDetalle}
      >
        {detalle}
      </DrawerShell>
    </>
  )
}

// ── Indicadores (RN-08): cuentan lo que queda en la lista con el periodo y los filtros de ahora ──

// La fila de cifras en su marco es la de Design system › Métricas (29-sep).
export { Indicadores } from '@/modules/design-system/metricas/cifras'

// ── Periodo (RN-05 y RN-06) ──

export function SelectorPeriodo({
  periodo,
  onPeriodo,
  rango,
  onRango,
}: {
  periodo: string
  onPeriodo: (periodo: string) => void
  rango: Rango
  onRango: (rango: Rango) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={periodo} onValueChange={(valor) => onPeriodo(String(valor))}>
        <SelectTrigger className="w-48" aria-label="Periodo">
          <SelectValue>{(valor) => PERIODOS.find((p) => p.valor === valor)?.etiqueta}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {PERIODOS.map((p) => (
            <SelectItem key={p.valor} value={p.valor}>
              {p.etiqueta}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {periodo === 'personalizado' ? (
        <div className="w-72">
          <RangoDeFechas valor={rango} onCambio={onRango} placeholder="Elige desde y hasta" />
        </div>
      ) : null}
      <Text as="span" variant="muted" size="sm">
        Según la fecha de creación
      </Text>
    </div>
  )
}

// ── Cambiar la fecha de finalización (reabre lo vencido, RN-05 del detalle) ──

// El campo de fecha del design system (CampoFecha) desde hoy; se queda con esta firma porque lo usa Diagnóstico.
export function CalendarioFecha({ onElegir, elegida }: { onElegir: (fecha: Date) => void; elegida?: Date }) {
  return <CampoFecha valor={elegida} desde={HOY} onCambio={(fecha) => (fecha ? onElegir(fecha) : undefined)} />
}

export function CambiarFecha({
  onElegir,
  etiqueta = 'Cambiar fecha',
  variante = 'outline',
}: {
  onElegir: (fecha: Date) => void
  etiqueta?: string
  variante?: 'outline' | 'default'
}) {
  return (
    <CampoFecha
      valor={undefined}
      desde={HOY}
      accion={{ etiqueta, variante }}
      onCambio={(fecha) => (fecha ? onElegir(fecha) : undefined)}
    />
  )
}
