import { useRef, useState, type FocusEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { Alert, AlertDescription, Badge, Field, FieldDescription, FieldError, FieldLabel, FieldTitle, Item, ItemContent, Text } from '@ubits/flux-ui'
import { MEASURE_META, formatMeasureValue, parseAmount, type MeasureType, type Objective, type ObjectiveDirection } from '../../../modelo/constructor/cicloBuilderTypes'
import { resolveStartLine, trackBlockingIssue } from '../../../modelo/constructor/complianceRules'
import { CampoCifra } from './piezas'

// Paso 3 · «¿De dónde partes y a dónde quieres llegar?». Valor inicial (opcional) y meta, y al lado el resumen en una
// línea. Las reglas de la pista (meta igual al inicio, meta del lado equivocado…) se muestran al salir del par de
// campos, no tecla a tecla, o con la validación encendida. Sin valor inicial se dice qué punto de partida se tomó.

export function CampoValores({
  objetivo,
  medida,
  direccion,
  onCambio,
  conErrores,
}: {
  objetivo: Objective
  medida: Exclude<MeasureType, 'boolean'>
  direccion: ObjectiveDirection
  onCambio: (cambio: Partial<Objective>) => void
  conErrores: boolean
}) {
  const id = `objetivo-${objetivo.id}`
  const simbolo = MEASURE_META[medida].symbol
  const inicial = parseAmount(objetivo.initialValue)
  const meta = parseAmount(objetivo.targetValue)

  // Los dos campos comparten un solo «salí de aquí»: pasar de uno al otro no cuenta como salir.
  const par = useRef<HTMLDivElement>(null)
  const [salio, setSalio] = useState(false)
  const alSalir = (evento: FocusEvent<HTMLDivElement>) => {
    if (par.current?.contains(evento.relatedTarget as Node | null)) return
    setSalio(true)
  }

  const bloqueo = trackBlockingIssue(direccion, meta, inicial)
  const errorMeta = (salio || conErrores) && bloqueo ? bloqueo : conErrores && meta === null ? 'Completa este campo' : null
  const salida = meta !== null && bloqueo === null ? resolveStartLine(direccion, meta, inicial) : null
  const deducida = salida !== null && salida.source !== 'declared'

  const desde = salida?.value ?? inicial ?? 0
  const hasta = meta ?? 0
  const tramo = Math.abs(hasta - desde)
  const tramoPorcentual = desde !== 0 ? Math.round((tramo / Math.abs(desde)) * 1000) / 10 : null

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-3 items-start">
        <div ref={par} onBlur={alSalir} className="contents">
          <Field>
            <div className="flex h-6 items-center gap-2">
              <FieldLabel htmlFor={`${id}-inicial`}>Valor inicial</FieldLabel>
              <Badge variant="secondary" size="xs">
                Opcional
              </Badge>
            </div>
            <CampoCifra id={`${id}-inicial`} simbolo={simbolo} valor={objetivo.initialValue} placeholder="Sin definir" autoFocus onCambio={(valor) => onCambio({ initialValue: valor })} />
            <FieldDescription>Dónde estás hoy (opcional).</FieldDescription>
          </Field>
          <Field data-invalid={errorMeta ? true : undefined}>
            <div className="flex h-6 items-center">
              <FieldLabel htmlFor={`${id}-meta`}>Meta</FieldLabel>
            </div>
            <CampoCifra id={`${id}-meta`} simbolo={simbolo} valor={objetivo.targetValue} placeholder="0" invalido={Boolean(errorMeta)} onCambio={(valor) => onCambio({ targetValue: valor })} />
            {errorMeta ? <FieldError>{errorMeta}</FieldError> : <FieldDescription>El resultado a lograr.</FieldDescription>}
          </Field>
        </div>
        <Field>
          <div className="flex h-6 items-center">
            <FieldTitle>Resumen</FieldTitle>
          </div>
          <Item variant="muted" size="sm" className="h-[var(--alto-campo)] py-2!">
            <ItemContent className="flex-row! flex-wrap items-center gap-x-2 gap-y-0.5">
              <Text as="span" size="sm" weight="semibold" className="tabular-nums">
                {formatMeasureValue(desde, medida)}
              </Text>
              <HugeiconsIcon icon={ArrowRight01Icon} size={14} aria-hidden="true" className="text-primary" />
              <Text as="span" size="sm" weight="semibold" className="tabular-nums">
                {formatMeasureValue(hasta, medida)}
              </Text>
            </ItemContent>
          </Item>
          <FieldDescription>
            Vas a {direccion === 'increase' ? 'aumentar' : 'reducir'} {formatMeasureValue(tramo, medida)}
            {tramoPorcentual !== null ? ` (${tramoPorcentual} %)` : ''}
          </FieldDescription>
        </Field>
      </div>

      {deducida && salida ? (
        <Alert variant="info">
          <AlertDescription>
            <p>
              Como no escribiste un valor inicial, tomamos <strong>{formatMeasureValue(salida.value, medida)}</strong> como punto de partida
              {salida.source === 'zero' ? '.' : ', porque el cero quedaría del lado equivocado de la meta.'}
            </p>
          </AlertDescription>
        </Alert>
      ) : null}
    </>
  )
}
