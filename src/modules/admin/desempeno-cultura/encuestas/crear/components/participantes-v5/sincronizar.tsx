import { Field, FieldContent, FieldDescription, FieldLabel, FieldLegend, FieldSet, FieldTitle, Item, ItemContent, RadioGroup, RadioGroupItem, Switch } from '@ubits/flux-ui'

// «Sincronizar con la empresa / con la agrupación»: agrega a la encuesta a quien se una mientras
// corre y desactiva a quien salga. Al encenderlo aparece la segunda decisión: si quien sale sigue
// contando en los resultados. Es independiente de si sus respuestas se ven, que decide la visibilidad.

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
    <Item variant="outline" className="flex-col items-stretch! gap-4 md:flex-row md:items-start!">
      <ItemContent className="min-w-0 flex-1">
        <Field orientation="horizontal">
          <FieldContent>
            <FieldLabel htmlFor={`${id}-sincronizar`}>Sincronizar con {alcance}</FieldLabel>
            <FieldDescription>Agrega a quien se una a {alcance} mientras la encuesta está abierta y desactiva a quien salga.</FieldDescription>
          </FieldContent>
          <Switch id={`${id}-sincronizar`} checked={activo} onCheckedChange={onActivo} />
        </Field>
      </ItemContent>
      {activo ? (
        <ItemContent className="min-w-0 flex-1">
          <FieldSet>
            <FieldLegend variant="label">Si sale, ¿cuenta en los resultados?</FieldLegend>
            <RadioGroup value={cuentaQuienSale ? 'si' : 'no'} onValueChange={(valor) => onCuentaQuienSale(valor === 'si')} className="grid gap-2 sm:grid-cols-2">
              <FieldLabel htmlFor={`${id}-cuenta-si`}>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>Sí</FieldTitle>
                    <FieldDescription>Sus respuestas siguen en los resultados.</FieldDescription>
                  </FieldContent>
                  <RadioGroupItem value="si" id={`${id}-cuenta-si`} />
                </Field>
              </FieldLabel>
              <FieldLabel htmlFor={`${id}-cuenta-no`}>
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle>No</FieldTitle>
                    <FieldDescription>Se quitan al salir.</FieldDescription>
                  </FieldContent>
                  <RadioGroupItem value="no" id={`${id}-cuenta-no`} />
                </Field>
              </FieldLabel>
            </RadioGroup>
          </FieldSet>
        </ItemContent>
      ) : null}
    </Item>
  )
}
