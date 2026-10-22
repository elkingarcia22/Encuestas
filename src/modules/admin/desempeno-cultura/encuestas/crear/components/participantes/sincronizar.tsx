import { Checkbox, Field, FieldLabel, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Text } from '@ubits/flux-ui'
import { TextoCompleto } from '@/shared/components/TextoCompleto'

// «Sincronizar con la empresa / con la agrupación»: agrega a la encuesta a quien se una mientras corre y
// desactiva a quien salga; al marcarlo aparece la segunda decisión, si quien sale sigue contando en los
// resultados (independiente de si sus respuestas se ven, que decide la visibilidad).
//
// Una sola línea y con casilla, no interruptor: vive justo debajo del interruptor de su contenedor, y dos
// interruptores seguidos se leían como la misma decisión repetida. Siempre en una sola línea: el selector
// queda al lado de la casilla y, si falta ancho, tanto el texto de la casilla como el del selector se
// recortan con puntos suspensivos en lugar de bajar a otra línea.

const OPCIONES = [
  { value: 'si', label: 'Si alguien sale, sus respuestas cuentan' },
  { value: 'no', label: 'Si alguien sale, sus respuestas se quitan' },
]

export function Sincronizar({
  id,
  alcance,
  activo,
  cuentaQuienSale,
  onActivo,
  onCuentaQuienSale,
}: {
  id: string
  alcance: 'la empresa' | 'la agrupación'
  activo: boolean
  cuentaQuienSale: boolean
  onActivo: (activo: boolean) => void
  onCuentaQuienSale: (cuenta: boolean) => void
}) {
  return (
    <div className="flex min-h-9 items-center justify-between gap-x-6">
      {/* «!» en esta fila: el ancho de cada campo (w-auto!, w-60!) y el valor del selector en bloque para que se corte con
          «…» (block!); la clase sola no le gana a la librería (diferencias.json › instalacion-estilos-sin-capa). */}
      <Field orientation="horizontal" className="w-auto! min-w-44 flex-1">
        <Checkbox id={`${id}-sincronizar`} checked={activo} onCheckedChange={(valor) => onActivo(valor === true)} />
        <FieldLabel htmlFor={`${id}-sincronizar`} className="min-w-0 font-normal cursor-pointer">
          <span className="flex min-w-0 items-baseline gap-1">
            <Text as="span" size="sm" weight="medium" className="shrink-0">
              Actualizar participantes automáticamente:
            </Text>
            <TextoCompleto texto={alcance === 'la empresa' ? 'incluye nuevos ingresos y retira a quienes salgan de la empresa' : 'incluye nuevos ingresos y retira a quienes salgan del grupo'}>
              <Text as="span" size="sm" variant="muted" className="min-w-0 truncate">
                {alcance === 'la empresa'
                  ? 'incluye nuevos ingresos y retira a quienes salgan de la empresa'
                  : 'incluye nuevos ingresos y retira a quienes salgan del grupo'}
              </Text>
            </TextoCompleto>
          </span>
        </FieldLabel>
      </Field>
      {activo ? (
        // «!»: ancho fijo del selector; la clase sola no le gana a la librería (diferencias.json › instalacion-estilos-sin-capa).
        <Field orientation="horizontal" className="w-60! min-w-36 shrink">
          <Select value={cuentaQuienSale ? 'si' : 'no'} onValueChange={(valor) => onCuentaQuienSale(valor === 'si')} items={OPCIONES}>
            <SelectTrigger id={`${id}-cuenta`} size="sm" className="w-full" aria-label="Qué pasa con las respuestas de quien sale">
              {/* «!»: el valor en bloque para que se corte con «…»; la clase sola no le gana a la librería (diferencias.json › instalacion-estilos-sin-capa). */}
              <SelectValue className="block! truncate" />
            </SelectTrigger>
            <SelectContent className="w-max min-w-(--anchor-width)">
              {OPCIONES.map((opcion) => (
                <SelectItem key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      ) : null}
    </div>
  )
}
