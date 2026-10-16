import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Calendar03Icon } from '@hugeicons/core-free-icons'
import { Button, Calendar, Popover, PopoverContent, PopoverTrigger, Text } from '@ubits/flux-ui'

import { textoDeRango } from '../patrones/formato'

// Campos de fecha: un rango (RangoDeFechas) o un solo día (CampoFecha). La versión instalada de flux-ui no trae DualDateRangePicker (solo está
// en el Storybook), así que se combina Calendar dentro de Popover, igual que hace el filtro de
// fechas del data-grid. El calendario viene en inglés: los nombres de mes y de día se pasan en
// español con Intl.

export type Rango = { from: Date | undefined; to?: Date | undefined } | undefined

const MES = new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' })
const DIA = new Intl.DateTimeFormat('es', { weekday: 'narrow' })
const MES_CORTO = new Intl.DateTimeFormat('es', { month: 'long' })

const mayuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1)

// Mes y días en español para cualquier Calendar del proyecto (también el que va suelto, sin campo).
export const CALENDARIO_ES = {
  formatCaption: (mes: Date) => mayuscula(MES.format(mes)),
  formatWeekdayName: (dia: Date) => DIA.format(dia).toUpperCase(),
  formatMonthDropdown: (mes: Date) => mayuscula(MES_CORTO.format(mes)),
}

const HOY_ANIO = new Date().getFullYear()
const TEXTO_DIA = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' })

export function RangoDeFechas({
  id,
  valor,
  onCambio,
  invalido,
  placeholder = 'Elige inicio y cierre',
  desde,
  deshabilitar,
}: {
  id?: string
  valor: Rango
  onCambio: (rango: Rango) => void
  invalido?: boolean
  placeholder?: string
  desde?: Date
  /** Días que no se pueden elegir, además de los anteriores a `desde` (p. ej. fines de semana). */
  deshabilitar?: (fecha: Date) => boolean
}) {
  const [abierto, setAbierto] = useState(false)
  const texto = textoDeRango(valor)

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            variant="outline"
            // Como campo: al alto de los demás campos (40 px) y con el texto de campo, igual que CampoFecha.
            size="lg"
            className="w-full justify-start"
            aria-invalid={invalido ? true : undefined}
          />
        }
      >
        <HugeiconsIcon icon={Calendar03Icon} aria-hidden="true" />
        <Text as="span" size="sm" weight="normal" variant={texto ? undefined : 'muted'}>
          {texto ?? placeholder}
        </Text>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="range"
          numberOfMonths={2}
          // Con dos meses a la vista, los días «de fuera» salen repetidos: el 30 de septiembre se dibuja en su mes y
          // otra vez en la rejilla de octubre, y los dos reciben el estilo de seleccionado. Parecían tres fechas
          // sueltas en vez de un rango. Cada día se ve igual en su propio mes, así que no se pierde nada.
          showOutsideDays={false}
          weekStartsOn={1}
          selected={valor}
          defaultMonth={valor?.from ?? desde}
          disabled={deshabilitar ? (desde ? [{ before: desde }, deshabilitar] : deshabilitar) : desde ? { before: desde } : undefined}
          onSelect={(rango: Rango, diaClicado: Date) => {
            // UX: Si el rango actual ya está completo y el usuario hace clic en un día nuevo,
            // react-day-picker por defecto encoge el rango (asume que cambiaste el cierre).
            // Pero si la fecha viene precargada, el usuario casi siempre quiere empezar un rango
            // nuevo desde el día que clicó. Si hace clic en el mismo inicio o cierre, dejamos
            // que react-day-picker lo deseleccione normalmente.
            // Un rango de un solo día (inicio = cierre) es el primer clic a medias, no un rango completo: el segundo clic lo completa.
            if (valor?.from && valor?.to && valor.from.getTime() !== valor.to.getTime()) {
              const esMismoInicio = diaClicado.getTime() === valor.from.getTime()
              const esMismoCierre = diaClicado.getTime() === valor.to.getTime()
              if (!esMismoInicio && !esMismoCierre) {
                onCambio({ from: diaClicado, to: undefined })
                return
              }
            }
            onCambio(rango)
            if (rango?.from && rango.to && rango.from.getTime() !== rango.to.getTime()) setAbierto(false)
          }}
          formatters={CALENDARIO_ES}
        />
      </PopoverContent>
    </Popover>
  )
}

// Un solo día: el mismo campo que el rango, con un mes a la vista. Se cierra al elegir.
// Con `accion` se abre desde un botón chico con esa etiqueta («Cambiar fecha») en vez del campo con la fecha.
export function CampoFecha({
  id,
  valor,
  onCambio,
  desde,
  invalido,
  deshabilitado,
  placeholder = 'Seleccionar fecha',
  accion,
}: {
  id?: string
  valor: Date | undefined
  onCambio: (fecha: Date | undefined) => void
  // No se puede elegir nada antes de esta fecha.
  desde?: Date
  invalido?: boolean
  deshabilitado?: boolean
  placeholder?: string
  accion?: { etiqueta: string; variante?: 'outline' | 'default' }
}) {
  const [abierto, setAbierto] = useState(false)

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            variant={accion?.variante ?? 'outline'}
            // Como campo va al alto de los demás campos (40 px); el botón normal mide 36 y descuadra la fila.
            size={accion ? 'sm' : 'lg'}
            className={accion ? undefined : 'w-full justify-start'}
            disabled={deshabilitado}
            aria-invalid={invalido ? true : undefined}
          />
        }
      >
        <HugeiconsIcon icon={Calendar03Icon} aria-hidden="true" />
        {accion ? (
          accion.etiqueta
        ) : (
          // Se lee como un campo: texto normal, y el marcador de posición en gris como en los demás campos.
          <Text as="span" size="sm" weight="normal" variant={valor ? undefined : 'muted'}>
            {valor ? TEXTO_DIA.format(valor) : placeholder}
          </Text>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          weekStartsOn={1}
          selected={valor}
          defaultMonth={valor ?? desde}
          // Mes y año con su selector, para saltar a una fecha lejana sin avanzar mes a mes (así lo hace UBITS).
          captionLayout="dropdown"
          startMonth={desde ?? new Date(HOY_ANIO - 5, 0)}
          endMonth={new Date(HOY_ANIO + 5, 11)}
          disabled={desde ? { before: desde } : undefined}
          onSelect={(fecha: Date | undefined) => {
            onCambio(fecha)
            setAbierto(false)
          }}
          formatters={CALENDARIO_ES}
        />
      </PopoverContent>
    </Popover>
  )
}
