import { Alert, AlertDescription, Field, FieldDescription, FieldLabel } from '@ubits/flux-ui'
import { MEASURE_META, parseAmount, type MeasureType, type Objective, type ObjectiveDirection } from '../../../modelo/constructor/cicloBuilderTypes'
import { resolveStartLine, trackWarnings } from '../../../modelo/constructor/complianceRules'
import { BarraLimites } from './barra-limites'
import { CampoCifra } from './piezas'

// Paso 4 · «¿Quieres poner límites al objetivo?». Con un Switch para activar mínimos y máximos,
// y al lado los dos inputs. Abajo los avisos y la gráfica.

export function CampoRango({
  objetivo,
  medida,
  direccion,
  onCambio,
}: {
  objetivo: Objective
  medida: Exclude<MeasureType, 'boolean'>
  direccion: ObjectiveDirection
  onCambio: (cambio: Partial<Objective>) => void
}) {
  const id = `objetivo-${objetivo.id}`
  const simbolo = MEASURE_META[medida].symbol
  const aumento = direccion === 'increase'
  const inicial = parseAmount(objetivo.initialValue)
  const meta = parseAmount(objetivo.targetValue)
  const minimo = parseAmount(objetivo.minValue)
  const maximo = parseAmount(objetivo.maxValue)
  const salida = meta !== null && meta !== inicial ? resolveStartLine(direccion, meta, inicial) : null
  const avisos = salida !== null && meta !== null ? trackWarnings(direccion, salida.value, meta, minimo, maximo) : []

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2 items-start">
        <Field>
          <div className="flex h-6 items-center">
            <FieldLabel htmlFor={`${id}-minimo`}>Mínimo de avance</FieldLabel>
          </div>
          <CampoCifra id={`${id}-minimo`} simbolo={simbolo} valor={objetivo.minValue} placeholder="Opcional" onCambio={(valor) => onCambio({ minValue: valor })} />
          <FieldDescription>
            {aumento ? 'Si el resultado no llega hasta aquí, se registra como 0 %.' : 'Si el resultado no baja hasta aquí, se registra como 0 %.'}
          </FieldDescription>
        </Field>
        
        <Field>
          <div className="flex h-6 items-center">
            <FieldLabel htmlFor={`${id}-maximo`}>Máximo de avance</FieldLabel>
          </div>
          <CampoCifra id={`${id}-maximo`} simbolo={simbolo} valor={objetivo.maxValue} placeholder="Opcional" onCambio={(valor) => onCambio({ maxValue: valor })} />
          <FieldDescription>
            {aumento ? 'Si lo supera, el avance se topa en este valor.' : 'Si baja más allá, el avance se topa en este valor.'}
          </FieldDescription>
        </Field>
      </div>

      {objetivo.rangeEnabled && avisos.length > 0 ? (
        <Alert variant="warning">
          <AlertDescription>
            {avisos.map((aviso) => (
              <p key={aviso.field}>{aviso.message}</p>
            ))}
          </AlertDescription>
        </Alert>
      ) : null}

      {objetivo.rangeEnabled && salida !== null && meta !== null ? <BarraLimites medida={medida} inicio={salida.value} meta={meta} minimo={minimo} maximo={maximo} /> : null}
    </>
  )
}
