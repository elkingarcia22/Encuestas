import type { ReactNode } from 'react'
import { Field, FieldDescription, FieldError, FieldLabel, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ubits/flux-ui'
import { CampoFecha, RangoDeFechas } from '@/modules/design-system/formularios/rango-de-fechas'
import { HOY, plural } from '@/modules/design-system/patrones/formato'
import type { TipoPlan } from './planes-datos'

// Nombre, fechas y (en competencias) horas de estudio: el paso 1 de Crear plan y la ventana «Datos del plan» de la página
// del plan. Un plan que ya empezó no cambia su fecha de inicio (como en UBITS): entonces las fechas van en dos campos, con
// la de inicio bloqueada, en vez del rango de Crear.

export type DatosPlan = { nombre: string; inicio?: Date; fin?: Date; horas: number }

const HORAS = Array.from({ length: 12 }, (_, i) => i + 1)
export const aFecha = (iso: string) => new Date(`${iso}T00:00:00`)
export const aIso = (fecha: Date) => `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`

export function erroresDe(datos: DatosPlan) {
  return {
    nombre: datos.nombre.trim() ? undefined : 'El nombre es obligatorio.',
    inicio: datos.inicio ? undefined : 'La fecha de inicio es obligatoria.',
    fin: !datos.fin ? 'La fecha de finalización es obligatoria.' : datos.inicio && datos.fin < datos.inicio ? 'Tiene que ser igual o posterior a la fecha de inicio.' : undefined,
  }
}

export function CamposPlan({
  tipo,
  datos,
  onCambio,
  conErrores,
  inicioBloqueado = false,
  despuesDelNombre,
  notaFechas,
}: {
  tipo: TipoPlan
  datos: DatosPlan
  onCambio: (cambio: Partial<DatosPlan>) => void
  conErrores: boolean
  inicioBloqueado?: boolean
  /** Crear plan: la descripción y el tipo, entre el nombre y las fechas. */
  despuesDelNombre?: ReactNode
  /** Crear plan: lo que se lee bajo las fechas, en vez de la zona horaria. */
  notaFechas?: string
}) {
  const errores = erroresDe(datos)
  const competencias = tipo === 'competencias'
  return (
    <div className={inicioBloqueado || competencias ? 'grid items-start gap-5 @2xl:grid-cols-2 [&>*:first-child]:@2xl:col-span-2' : 'grid items-start gap-5'}>
      <Field data-invalid={conErrores && errores.nombre ? 'true' : undefined}>
        <FieldLabel htmlFor="plan-nombre">Nombre del plan</FieldLabel>
        <Input
          id="plan-nombre"
          value={datos.nombre}
          maxLength={120}
          aria-invalid={conErrores && errores.nombre ? true : undefined}
          placeholder={competencias ? 'Ej.: Liderazgo para mandos medios' : 'Ej.: Inducción cohorte octubre'}
          onChange={(evento) => onCambio({ nombre: evento.target.value })}
        />
        {conErrores && errores.nombre ? <FieldError>{errores.nombre}</FieldError> : <FieldDescription>Así lo ven las personas en su Zona de estudio.</FieldDescription>}
      </Field>
      {despuesDelNombre ? <div className="@2xl:col-span-2">{despuesDelNombre}</div> : null}
      {inicioBloqueado ? (
        <>
          <Field>
            <FieldLabel htmlFor="plan-inicio">Fecha de inicio</FieldLabel>
            <CampoFecha id="plan-inicio" valor={datos.inicio} desde={HOY} deshabilitado onCambio={() => undefined} />
            <FieldDescription>No cambia: el plan ya inició.</FieldDescription>
          </Field>
          <Field data-invalid={conErrores && errores.fin ? 'true' : undefined}>
            <FieldLabel htmlFor="plan-fin">{competencias ? 'Fecha de cierre' : 'Fecha de finalización'}</FieldLabel>
            <CampoFecha id="plan-fin" valor={datos.fin} desde={datos.inicio ?? HOY} invalido={conErrores && Boolean(errores.fin)} onCambio={(fin) => onCambio({ fin })} />
            {conErrores && errores.fin ? <FieldError>{errores.fin}</FieldError> : <FieldDescription>Igual o posterior a la de inicio.</FieldDescription>}
          </Field>
        </>
      ) : (
        <Field data-invalid={conErrores && (errores.inicio || errores.fin) ? 'true' : undefined}>
          <FieldLabel htmlFor="plan-fechas">Fechas del plan</FieldLabel>
          <RangoDeFechas
            id="plan-fechas"
            valor={datos.inicio ? { from: datos.inicio, to: datos.fin } : undefined}
            desde={HOY}
            placeholder="Elige inicio y fin"
            invalido={conErrores && Boolean(errores.inicio || errores.fin)}
            onCambio={(rango) => onCambio({ inicio: rango?.from, fin: rango?.to })}
          />
          {conErrores && (errores.inicio || errores.fin) ? (
            <FieldError>{errores.inicio ? 'Elige las fechas de inicio y fin.' : errores.fin}</FieldError>
          ) : (
            <FieldDescription>{notaFechas ?? 'Según la zona horaria de tu compañía: America/Bogota.'}</FieldDescription>
          )}
        </Field>
      )}
      {competencias ? (
        <Field>
          <FieldLabel htmlFor="plan-horas">Horas de estudio por competencia</FieldLabel>
          {/* RN-02: un solo valor para todo el plan. En UBITS se elige de 1 a 12 horas. */}
          <Select value={String(datos.horas)} onValueChange={(valor) => onCambio({ horas: Number(valor) })}>
            <SelectTrigger id="plan-horas" className="w-full">
              <SelectValue>{(valor: string) => `${valor} ${plural(Number(valor), 'hora', 'horas')}`}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {HORAS.map((h) => (
                <SelectItem key={h} value={String(h)}>
                  {h} {plural(h, 'hora', 'horas')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldDescription>Vale para todas las competencias del plan.</FieldDescription>
        </Field>
      ) : null}
    </div>
  )
}
