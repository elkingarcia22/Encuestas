import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { ArrowDataTransferHorizontalIcon, ChartUpIcon, Target02Icon } from '@hugeicons/core-free-icons'
import {
  Field,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@ubits/flux-ui'
import { MONEDAS, etiquetaMoneda } from './datos'
import type { CamposSeccion, TipoSalario } from './formulario'
import { TarjetaAjuste } from './piezas'
import { REJILLA } from './rejilla'

const dinero = (valor: number) => `$${valor.toLocaleString('es-CO')}`


const ordenarRango = (vacante: CamposSeccion['vacante'], onCambio: CamposSeccion['onCambio']) => {
  const desde = Number(vacante.salarioDesde) || 0
  const hasta = Number(vacante.salarioHasta) || 0
  if (desde > hasta) onCambio({ salarioDesde: String(hasta), salarioHasta: String(desde) })
}

// Un monto escrito a mano, con los puntos de miles mientras se escribe y la moneda al lado.
function CampoMonto({
  id,
  etiqueta,
  valor,
  moneda,
  onCambio,
  onTerminar,
}: {
  id: string
  etiqueta: string
  valor: string
  moneda: string
  onCambio: (valor: string) => void
  onTerminar?: () => void
}) {
  const numero = Number(valor) || 0
  return (
    <Field>
      <FieldLabel htmlFor={id}>{etiqueta}</FieldLabel>
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>$</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          id={id}
          inputMode="numeric"
          value={numero ? numero.toLocaleString('es-CO') : ''}
          placeholder="0"
          onChange={(evento) => onCambio(evento.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '') || '0')}
          onBlur={onTerminar}
        />
        {moneda ? (
          <InputGroupAddon align="inline-end">
            <InputGroupText>{moneda}</InputGroupText>
          </InputGroupAddon>
        ) : null}
      </InputGroup>
    </Field>
  )
}

/* ------------------------------------------------------------ compensación y condiciones */

// Igual que en Requisitos: dos bloques con título. En el del salario, tipo y moneda van lado a lado
// como desplegables del mismo alto (con la explicación del elegido debajo) y el deslizador ocupa la
// fila entera. Los beneficios quedan aparte, debajo de la línea.
const TIPOS_SALARIO: {
  valor: TipoSalario
  titulo: string
  detalle: string
  icono: IconSvgElement
}[] = [
  {
    valor: 'fijo',
    titulo: 'Fijo',
    detalle: 'Un monto exacto al mes.',
    icono: Target02Icon,
  },
  {
    valor: 'rango',
    titulo: 'Rango',
    detalle: 'Un mínimo y un máximo al mes.',
    icono: ArrowDataTransferHorizontalIcon,
  },
]

export function Compensacion({ vacante, onCambio }: CamposSeccion) {
  const rango = vacante.tipoSalario === 'rango'
  const moneda = MONEDAS.find((opcion) => opcion.valor === vacante.moneda)?.valor ?? ''

  return (
    <div className="flex flex-col gap-6">
      <FieldSet>
        <FieldLegend>Salario</FieldLegend>
        <div className={REJILLA}>
          <Field>
            <FieldLabel htmlFor="vacante-tipo-salario">Tipo de salario</FieldLabel>
            <Select
              value={vacante.tipoSalario}
              onValueChange={(tipoSalario) => tipoSalario && onCambio({ tipoSalario: tipoSalario as TipoSalario })}
            >
              <SelectTrigger id="vacante-tipo-salario">
                {/* Sin esto el campo muestra el valor interno («rango») en vez del nombre con su icono. */}
                <SelectValue>
                  {(valor: string | null) => {
                    const opcion = TIPOS_SALARIO.find((tipo) => tipo.valor === valor)
                    return opcion ? (
                      <>
                        <HugeiconsIcon icon={opcion.icono} aria-hidden="true" />
                        {opcion.titulo}
                      </>
                    ) : null
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {TIPOS_SALARIO.map((opcion) => (
                  <SelectItem key={opcion.valor} value={opcion.valor}>
                    <HugeiconsIcon icon={opcion.icono} aria-hidden="true" />
                    {opcion.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription aria-live="polite">
              {TIPOS_SALARIO.find((tipo) => tipo.valor === vacante.tipoSalario)?.detalle}
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="vacante-moneda">Moneda</FieldLabel>
            <Select value={vacante.moneda || null} onValueChange={(valor) => onCambio({ moneda: valor ?? '' })}>
              <SelectTrigger id="vacante-moneda">
                {/* Completa al elegirla, «COP · Peso colombiano», y no solo el código (29 sep, reunión con Elkin). */}
                <SelectValue placeholder="Elige la moneda">
                  {(valor: string | null) => (valor ? etiquetaMoneda(valor) : 'Elige la moneda')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {MONEDAS.map((opcion) => (
                  <SelectItem key={opcion.valor} value={opcion.valor}>
                    {etiquetaMoneda(opcion.valor)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription aria-live="polite">
              {moneda ? 'Los montos de abajo se muestran en esta moneda.' : 'Elígela para fijar los montos.'}
            </FieldDescription>
          </Field>
        </div>

        {/* El monto se escribe (29 sep, reunión con Elkin: «6 millones 305 mil 458 pesos») y la frase de abajo dice cómo
            queda. Hasta el 5 oct llevaba además una barra con los mismos montos: repetía los campos de arriba y solo
            cubría hasta $60.000.000 (Nicolás: «demasiada experiencia con barras»). */}
        {rango ? (
          <Field>
            <FieldLabel id="vacante-rango-etiqueta">Rango salarial (mensual)</FieldLabel>
            <div className={REJILLA}>
              <CampoMonto
                id="vacante-salario-desde"
                etiqueta="Mínimo"
                valor={vacante.salarioDesde}
                moneda={moneda}
                onCambio={(salarioDesde) => onCambio({ salarioDesde })}
                // Si el mínimo quedó por encima del máximo, se cruzan: así nunca queda un rango al revés.
                onTerminar={() => ordenarRango(vacante, onCambio)}
              />
              <CampoMonto
                id="vacante-salario-hasta"
                etiqueta="Máximo"
                valor={vacante.salarioHasta}
                moneda={moneda}
                onCambio={(salarioHasta) => onCambio({ salarioHasta })}
                onTerminar={() => ordenarRango(vacante, onCambio)}
              />
            </div>
            <FieldDescription aria-live="polite">
              Va de {dinero(Number(vacante.salarioDesde))} a {dinero(Number(vacante.salarioHasta))} {moneda} al mes.
            </FieldDescription>
          </Field>
        ) : (
          <Field>
            <FieldLabel id="vacante-fijo-etiqueta">Salario fijo (mensual)</FieldLabel>
            <div className={REJILLA}>
              <CampoMonto
                id="vacante-salario-fijo"
                etiqueta="Monto"
                valor={vacante.salarioFijo}
                moneda={moneda}
                onCambio={(salarioFijo) => onCambio({ salarioFijo })}
              />
            </div>
            <FieldDescription aria-live="polite">
              Son {dinero(Number(vacante.salarioFijo))} {moneda} al mes.
            </FieldDescription>
          </Field>
        )}
      </FieldSet>

      <FieldSeparator />

      <FieldSet>
        <FieldLegend>Beneficios</FieldLegend>
        <TarjetaAjuste
          icono={ChartUpIcon}
          titulo="Acciones de la empresa (Equity)"
          descripcion="¿Se otorgan acciones como parte del paquete de compensación?"
          ayuda="Indica si este rol incluye acciones de la empresa como parte del paquete de compensación total."
          control={
            <Switch
              aria-label="Acciones de la empresa"
              checked={vacante.equity}
              onCheckedChange={(equity) => onCambio({ equity })}
            />
          }
        />
      </FieldSet>
    </div>
  )
}
