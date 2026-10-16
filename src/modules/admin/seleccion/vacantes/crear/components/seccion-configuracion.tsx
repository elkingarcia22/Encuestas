import { HugeiconsIcon } from '@hugeicons/react'
import { Mail01Icon, MinusSignIcon, PlusSignIcon, ViewIcon } from '@hugeicons/core-free-icons'
import {
  Field,
  FieldLabel,
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
  Switch,
  Text,
} from '@ubits/flux-ui'
import type { CamposSeccion } from './formulario'
import { TarjetaAjuste } from './piezas'

/* ------------------------------------------------------------ configuración */

export function Configuracion({ vacante, onCambio }: CamposSeccion) {
  return (
    <div className="flex flex-col gap-4">
      {/* Las habilidades clave pasaron a «Requisitos del puesto» (29 sep, reunión con Elkin). */}
      {/* Por ahora solo se publica en el portal de UBITS: basta con encender o apagar. */}
      <TarjetaAjuste
        icono={ViewIcon}
        titulo="Publicar en el portal de empleo de UBITS"
        descripcion="La vacante aparecerá en el portal de empleo de UBITS para que cualquiera pueda postularse."
        ayuda="Al apagarlo la vacante queda solo dentro de UBITS: no aparece en el portal público de empleo."
        control={
          <Switch
            aria-label="Publicar en el portal de empleo de UBITS"
            checked={vacante.publicarEnBolsas}
            onCheckedChange={(publicarEnBolsas) => onCambio({ publicarEnBolsas })}
          />
        }
      />

      <TarjetaAjuste
        icono={Mail01Icon}
        titulo="Correo automático de rechazo"
        descripcion="Envía feedback personalizado a candidatos que no avancen en el proceso"
        ayuda="El correo sale solo cuando el candidato lleva los días indicados sin avanzar de etapa."
        control={
          <Switch
            aria-label="Correo automático de rechazo"
            checked={vacante.correoRechazo}
            onCheckedChange={(correoRechazo) => onCambio({ correoRechazo })}
          />
        }
      >
        {vacante.correoRechazo ? (
          <Field className="max-w-xs">
            <FieldLabel htmlFor="vacante-dias-rechazo">Enviar correo de rechazo después de:</FieldLabel>
            <div className="flex items-center gap-2">
              <NumberField
                id="vacante-dias-rechazo"
                value={vacante.diasRechazo}
                min={1}
                max={60}
                onValueChange={(diasRechazo) => onCambio({ diasRechazo })}
              >
                <NumberFieldGroup>
                  <NumberFieldDecrement>
                    <HugeiconsIcon icon={MinusSignIcon} strokeWidth={2} aria-hidden="true" />
                  </NumberFieldDecrement>
                  <NumberFieldInput />
                  <NumberFieldIncrement>
                    <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />
                  </NumberFieldIncrement>
                </NumberFieldGroup>
              </NumberField>
              <Text as="span" variant="muted" size="sm">
                días
              </Text>
            </div>
          </Field>
        ) : null}
      </TarjetaAjuste>
    </div>
  )
}
