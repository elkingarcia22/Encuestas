import { useState } from 'react'
import { Calendar, type FxCustomFilterProps } from '@ubits/flux-ui'
import { CALENDARIO_ES } from '@/modules/design-system/formularios/rango-de-fechas'

// El filtro de la columna Cierre: un rango de fechas (Elkin, 21-oct). Va como filtro propio de la tabla y no como su
// filtro de fecha porque ese cambia el embudo del encabezado por un calendario, y el encabezado se queda con el embudo
// como los demás. Por dentro es el mismo calendario en rango: el filtro se aplica al marcar la segunda fecha.

export type RangoCierre = [Date | undefined, Date | undefined]

type Rango = { from: Date | undefined; to?: Date | undefined }

const ANIO = new Date().getFullYear()

export function FiltroRangoCierre({ value, onChange }: FxCustomFilterProps<RangoCierre>) {
  const [desde, hasta] = value ?? [undefined, undefined]
  const [elegido, setElegido] = useState<Rango | undefined>(desde || hasta ? { from: desde, to: hasta } : undefined)
  // La primera fecha marcada aún no filtra: espera a la segunda, como el calendario de la tabla.
  const [aMedias, setAMedias] = useState(false)

  return (
    <Calendar
      mode="range"
      selected={elegido}
      weekStartsOn={1}
      defaultMonth={elegido?.from ?? new Date()}
      onSelect={(rango: Rango | undefined) => {
        setElegido(rango)
        if (!rango?.from && !rango?.to) {
          setAMedias(false)
          onChange(undefined)
          return
        }
        if (!aMedias) {
          setAMedias(true)
          return
        }
        setAMedias(false)
        onChange([rango.from, rango.to])
      }}
      captionLayout="dropdown"
      startMonth={new Date(ANIO - 5, 0)}
      endMonth={new Date(ANIO + 5, 11)}
      formatters={CALENDARIO_ES}
    />
  )
}
