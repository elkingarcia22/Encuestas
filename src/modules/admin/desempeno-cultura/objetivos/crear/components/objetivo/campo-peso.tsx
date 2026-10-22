import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon } from '@hugeicons/core-free-icons'
import { Alert, AlertDescription, AlertTitle, Button, Field, FieldDescription, FieldError, FieldLabel, InputGroup, InputGroupAddon, InputGroupInput, InputGroupText, Slider } from '@ubits/flux-ui'
import { MIN_OBJECTIVE_WEIGHT, TOTAL_WEIGHT } from '../../../modelo/constructor/cicloBuilderTypes'

// Paso 5 · «¿Cuánto pesa este objetivo?» (solo asignados). Deslizador de 0 al cupo del set y el número al lado: el
// número se escribe libre (solo dígitos) y se ajusta al cupo al salir del campo. Debajo, cuánto queda por repartir
// entre todos los objetivos del set, que tienen que sumar justo el cupo.

/** Los arreglos que tocan a los demás objetivos del set: los pone la lista, que es la que los conoce. */
export interface ArreglosPeso {
  /** Cuántos otros objetivos hay en el set. */
  otros: number
  /** Deja este peso como está y reparte lo que sobra entre los demás, conservando sus proporciones. */
  onAjustarDemas: () => void
  /** Parte el cupo en partes iguales entre todos. */
  onIguales: () => void
}

export function CampoPeso({
  id,
  peso,
  onCambio,
  pesoDeLosDemas,
  cupo = TOTAL_WEIGHT,
  conErrores,
  arreglos,
}: {
  id: string
  peso: number
  onCambio: (peso: number) => void
  pesoDeLosDemas: number
  cupo?: number
  conErrores: boolean
  arreglos?: ArreglosPeso
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
  // Pasarse del cupo se avisa al momento (21-oct, Elkin: «más visual y que se pueda arreglar ahí mismo»): el campo en rojo
  // y debajo la caja con cuánto suman, cuánto sobra y los arreglos. Lo que falta por repartir solo se marca tras intentar
  // avanzar o al cerrar la tarjeta incompleta (`conErrores`), con los mismos arreglos.
  const pasado = queda < 0
  const falta = conErrores && queda > 0
  const disponible = cupo - pesoDeLosDemas
  const elegir = (siguiente: number) => {
    setBorrador({ texto: String(siguiente), de: siguiente })
    onCambio(siguiente)
  }

  return (
    <Field data-invalid={bajo || pasado || undefined}>
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
          {/* Fondo blanco: el campo es transparente y se pierde sobre el gris (diferencias.json › input-group-fondo-solido). */}
          <InputGroup className="bg-background!">
            <InputGroupInput
              id={`${id}-peso`}
              inputMode="numeric"
              className="text-end tabular-nums"
              value={texto}
              aria-invalid={bajo || pasado || undefined}
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
      {pasado || falta ? (
        <Alert variant={pasado ? 'destructive' : 'warning'}>
          <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />
          <AlertTitle>{pasado ? `Los pesos suman ${cupo - queda} %: te pasaste ${-queda} %` : `Faltan ${queda} % por repartir`}</AlertTitle>
          <AlertDescription>
            <p>
              {`Este objetivo pesa ${peso} % y los demás suman ${pesoDeLosDemas} %. Entre todos tienen que sumar ${cupo} %.`}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {disponible >= MIN_OBJECTIVE_WEIGHT ? (
                <Button size="sm" variant="outline" onClick={() => elegir(disponible)}>
                  Dejarlo en {disponible} %
                </Button>
              ) : null}
              {arreglos && arreglos.otros > 0 && cupo - peso >= MIN_OBJECTIVE_WEIGHT * arreglos.otros ? (
                <Button size="sm" variant="outline" onClick={arreglos.onAjustarDemas}>
                  {pasado ? 'Bajar los demás' : 'Subir los demás'}
                </Button>
              ) : null}
              {arreglos && arreglos.otros > 0 ? (
                <Button size="sm" variant="outline" onClick={arreglos.onIguales}>
                  Repartir en partes iguales
                </Button>
              ) : null}
            </div>
          </AlertDescription>
        </Alert>
      ) : bajo ? (
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
