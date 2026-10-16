import { Field, FieldDescription, FieldError, FieldLabel, Input, Switch, Textarea } from '@ubits/flux-ui'
import { RangoDeFechas, type Rango } from '@/modules/design-system/formularios/rango-de-fechas'
import { CICLO_PERIOD_LABELS, CICLO_PERIOD_MONTHS, MAX_CICLO_DESCRIPTION_LENGTH, type CicloDraft, type CicloPeriod } from '../../../modelo/constructor/cicloBuilderTypes'
import { addMonths, parseISODate, toISODate } from '../../../modelo/constructor/cicloDates'
import { setupPeriodOptions } from '../../../modelo/constructor/cicloSetup'
import { Pregunta, TarjetasOpcion } from './opciones'

// Bloque 1 · Identidad y tiempos: nombre, descripción opcional, duración y fechas. Elegir una duración calcula el
// cierre desde el inicio; mover a mano el cierre a otra fecha vuelve la duración «Personalizado», y cambiar el inicio
// bajo una duración fija arrastra el cierre con él. Mismas reglas que el prototipo.

const COMPLETA = 'Completa este campo'

const DIAS: Readonly<Record<CicloPeriod, string>> = { mes: '30 días', bimestre: '60 días', trimestre: '90 días', semestre: '180 días', anio: '365 días', personalizado: 'A medida' }

export function BloqueIdentidad({
  borrador,
  onCambio,
  conErrores,
  descripcionActiva,
  onDescripcionActiva,
}: {
  borrador: CicloDraft
  onCambio: (cambio: Partial<CicloDraft>) => void
  conErrores: boolean
  descripcionActiva: boolean
  onDescripcionActiva: (activa: boolean) => void
}) {
  const faltaNombre = conErrores && borrador.name.trim() === ''
  const faltaDuracion = conErrores && borrador.period === null
  const faltanFechas = conErrores && (!borrador.startDate || !borrador.endDate)
  const alReves = conErrores && borrador.startDate && borrador.endDate && borrador.endDate < borrador.startDate

  const rango: Rango = borrador.startDate ? { from: parseISODate(borrador.startDate) ?? undefined, to: parseISODate(borrador.endDate) ?? undefined } : undefined

  const elegirDuracion = (nuevo: CicloPeriod) => {
    const cambio: Partial<CicloDraft> = { period: nuevo }
    const meses = CICLO_PERIOD_MONTHS[nuevo]
    if (meses !== null && borrador.startDate) {
      cambio.endDate = toISODate(addMonths(parseISODate(borrador.startDate)!, meses))
    }
    onCambio(cambio)
  }

  const elegirFechas = (nuevo: Rango | undefined) => {
    const meses = borrador.period ? CICLO_PERIOD_MONTHS[borrador.period] : null
    const inicio = nuevo?.from
    const cierre = nuevo?.to
    // Un inicio nuevo bajo una duración fija arrastra el cierre con él.
    if (meses !== null && inicio && toISODate(inicio) !== borrador.startDate) {
      return onCambio({ startDate: toISODate(inicio), endDate: toISODate(addMonths(inicio, meses)) })
    }
    // Mover el cierre a mano bajo una duración fija la vuelve personalizada.
    if (meses !== null && inicio && cierre && toISODate(cierre) !== toISODate(addMonths(inicio, meses))) {
      return onCambio({ startDate: toISODate(inicio), endDate: toISODate(cierre), period: 'personalizado' })
    }
    onCambio({ startDate: toISODate(inicio), endDate: toISODate(cierre) })
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        <Field data-invalid={faltaNombre || undefined}>
          <FieldLabel htmlFor="ciclo-nombre">Nombre del ciclo</FieldLabel>
          <Input id="ciclo-nombre" value={borrador.name} onChange={(evento) => onCambio({ name: evento.target.value })} placeholder="Por ejemplo: Objetivos comerciales Q1" aria-invalid={faltaNombre || undefined} />
          {faltaNombre ? <FieldError>{COMPLETA}</FieldError> : null}
        </Field>
        <Field orientation="horizontal" className="w-auto!">
          <Switch
            id="ciclo-con-descripcion"
            checked={descripcionActiva}
            onCheckedChange={(activa) => {
              onDescripcionActiva(activa)
              if (!activa) onCambio({ description: '' })
            }}
          />
          <FieldLabel htmlFor="ciclo-con-descripcion">Añadir descripción</FieldLabel>
        </Field>
      </div>

      {descripcionActiva ? (
        <Field>
          <FieldLabel htmlFor="ciclo-descripcion">Descripción</FieldLabel>
          <Textarea
            id="ciclo-descripcion"
            rows={3}
            value={borrador.description}
            maxLength={MAX_CICLO_DESCRIPTION_LENGTH}
            onChange={(evento) => onCambio({ description: evento.target.value.slice(0, MAX_CICLO_DESCRIPTION_LENGTH) })}
            placeholder="Explica en una o dos frases para qué existe este ciclo."
          />
          <FieldDescription>
            {borrador.description.length} de {MAX_CICLO_DESCRIPTION_LENGTH} caracteres
          </FieldDescription>
        </Field>
      ) : null}

      <Pregunta titulo="Duración" ayuda="Al elegir una, calculamos la fecha de cierre por ti." error={faltaDuracion ? 'Elige una duración' : null}>
        <TarjetasOpcion
          nombre="ciclo-duracion"
          columnas={5}
          valor={borrador.period}
          onValor={elegirDuracion}
          invalido={faltaDuracion || undefined}
          opciones={setupPeriodOptions(borrador.period).map((periodo) => ({ valor: periodo, titulo: CICLO_PERIOD_LABELS[periodo], ayuda: DIAS[periodo], tono: 'brand' as const }))}
        />
      </Pregunta>

      <Field data-invalid={faltanFechas || alReves || undefined} className="md:w-1/2">
        <FieldLabel htmlFor="ciclo-fechas">Fechas del ciclo</FieldLabel>
        <RangoDeFechas id="ciclo-fechas" valor={rango} invalido={faltanFechas || alReves || undefined} placeholder="Elige el inicio y el cierre" onCambio={elegirFechas} />
        {alReves ? <FieldError>El cierre no puede ser antes del inicio</FieldError> : faltanFechas ? <FieldError>{COMPLETA}</FieldError> : null}
      </Field>
    </>
  )
}
