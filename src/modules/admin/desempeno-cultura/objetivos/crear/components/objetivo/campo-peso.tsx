import { useState } from 'react'
import { Field, FieldDescription, FieldError, FieldLabel, InputGroup, InputGroupAddon, InputGroupInput, InputGroupText, Slider } from '@ubits/flux-ui'
import { MIN_OBJECTIVE_WEIGHT, TOTAL_WEIGHT } from '../../../modelo/constructor/cicloBuilderTypes'

// Paso 5 · «¿Cuánto pesa este objetivo?» (solo asignados). Deslizador de 0 al cupo del set y el número al lado: el
// número se escribe libre (solo dígitos) y se ajusta al cupo al salir del campo. Debajo, cuánto queda por repartir
// entre todos los objetivos del set, que tienen que sumar justo el cupo.

export function CampoPeso({
  id,
  peso,
  onCambio,
  pesoDeLosDemas,
  cupo = TOTAL_WEIGHT,
  conErrores,
}: {
  id: string
  peso: number
  onCambio: (peso: number) => void
  pesoDeLosDemas: number
  cupo?: number
  conErrores: boolean
}) {
  // El texto a medio escribir vive aparte; se reemplaza por el peso real cada vez que el peso cambia por fuera.
  const [borrador, setBorrador] = useState({ texto: String(peso), de: peso })
  const texto = borrador.de === peso ? borrador.texto : String(peso)

  const confirmar = () => {
    const leido = Number.parseInt(texto, 10)
    const siguiente = Number.isNaN(leido) ? 0 : Math.max(0, Math.min(cupo, leido))
    setBorrador({ texto: String(siguiente), de: siguiente })
    onCambio(siguiente)
  }

  const queda = cupo - pesoDeLosDemas - peso
  const bajo = conErrores && peso < MIN_OBJECTIVE_WEIGHT

  return (
    <Field data-invalid={bajo || undefined}>
      <FieldLabel htmlFor={`${id}-peso`}>Peso dentro del ciclo</FieldLabel>
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <Slider
            aria-label="Peso del objetivo"
            value={[peso]}
            min={0}
            max={cupo}
            step={1}
            onValueChange={(valor) => {
              const siguiente = Array.isArray(valor) ? valor[0] : valor
              setBorrador({ texto: String(siguiente), de: siguiente })
              onCambio(siguiente)
            }}
          />
        </div>
        <div className="w-24 shrink-0">
          <InputGroup className="bg-background!">
            <InputGroupInput
              id={`${id}-peso`}
              inputMode="numeric"
              className="text-end tabular-nums"
              value={texto}
              aria-invalid={bajo || undefined}
              onChange={(evento) => setBorrador({ texto: evento.target.value.replace(/[^0-9]/g, ''), de: peso })}
              onBlur={confirmar}
              onKeyDown={(evento) => {
                if (evento.key === 'Enter') evento.currentTarget.blur()
              }}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupText>%</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>
      {bajo ? (
        <FieldError>El peso no puede ser inferior al {MIN_OBJECTIVE_WEIGHT} %</FieldError>
      ) : (
        <FieldDescription>
          Los pesos de todos los objetivos deben sumar {cupo} %.{' '}
          {queda === 0 ? 'Ya está repartido.' : queda > 0 ? `Aún quedan ${queda} % por repartir.` : `Te pasaste ${Math.abs(queda)} %.`}
        </FieldDescription>
      )}
    </Field>
  )
}
