import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, Cancel01Icon, InformationCircleIcon, Tick02Icon } from '@hugeicons/core-free-icons'
import {
  Field,
  FieldError,
  FieldLabel,
  FieldSet,
  IconTile,
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
  FieldLegend,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { DIRECTION_META, MEASURE_META, MEASURE_ORDER, type MeasureType, type Objective, type ObjectiveDirection } from '../../../modelo/constructor/cicloBuilderTypes'
import { DIRECTION_VISUAL, MEASURE_VISUAL } from '../../../modelo/constructor/measureVisual'
import { TEXTO_FIJO_POR_TONO } from './formato'

// Paso 2 · «¿Cómo se mide y hacia dónde tiene que moverse?». Dos listas en una sola fila, como en parametrización:
// a la izquierda el tipo de medida (icono, nombre y descripción en cada opción) y a la derecha la dirección. «Se
// cumple / No se cumple» no tiene dirección: la lista de dirección se apaga y debajo se ven los dos resultados posibles
// al cierre. Cambiar a esa medida borra la dirección.

const DIRECCIONES: readonly ObjectiveDirection[] = ['increase', 'decrease']

function AyudaDireccion() {
  return (
    <Popover>
      <PopoverTrigger render={<BotonIcono size="icon-xs" aria-label="Por qué importa la dirección" />}>
        <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72">
        <PopoverDescription>No siempre “más” es mejor: en costos o rotación, lo bueno es que el número baje.</PopoverDescription>
      </PopoverContent>
    </Popover>
  )
}

function Resultado({ cumple }: { cumple: boolean }) {
  return (
    <Item variant="outline" size="sm" className="flex-1 bg-card">
      <ItemMedia>
        <IconTile variant="soft" size="sm" className={cumple ? 'text-success! **:text-inherit!' : 'text-muted-foreground! **:text-inherit!'}>
          <HugeiconsIcon icon={cumple ? Tick02Icon : Cancel01Icon} aria-hidden="true" />
        </IconTile>
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{cumple ? 'Se cumple' : 'No se cumple'}</ItemTitle>
        <ItemDescription className="tabular-nums">{cumple ? '100 %' : '0 %'}</ItemDescription>
      </ItemContent>
    </Item>
  )
}

export function CampoMedida({ objetivo, onCambio, conErrores }: { objetivo: Objective; onCambio: (cambio: Partial<Objective>) => void; conErrores: boolean }) {
  const id = `objetivo-${objetivo.id}`
  const { measure, direction } = objetivo
  const booleano = measure === 'boolean'
  const sinMedida = conErrores && measure === null
  const sinDireccion = conErrores && measure !== null && !booleano && direction === null

  const elegirMedida = (siguiente: MeasureType) =>
    onCambio(siguiente === measure ? { measure: siguiente } : { measure: siguiente, direction: siguiente === 'boolean' ? null : direction })

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field data-invalid={sinMedida || undefined}>
          <div className="flex h-6 items-center">
            <FieldLabel htmlFor={`${id}-medida`}>Tipo de medida</FieldLabel>
          </div>
          <Select value={measure ?? ''} onValueChange={(valor) => elegirMedida(valor as MeasureType)}>
            <SelectTrigger id={`${id}-medida`} aria-invalid={sinMedida || undefined}>
              <SelectValue placeholder="Elige cómo se mide">
                {(valor: string) =>
                  valor ? (
                    <span className="flex min-w-0 items-center gap-2">
                      <HugeiconsIcon icon={MEASURE_VISUAL[valor as MeasureType].icon} aria-hidden="true" className="shrink-0 text-muted-foreground" />
                      <span className="truncate">{MEASURE_META[valor as MeasureType].label}</span>
                    </span>
                  ) : (
                    'Elige cómo se mide'
                  )
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {MEASURE_ORDER.map((medida) => (
                <SelectItem key={medida} value={medida}>
                  <div className="flex items-center gap-3 py-0.5">
                    <IconTile variant="soft" size="sm" className={`shrink-0 ${TEXTO_FIJO_POR_TONO[MEASURE_VISUAL[medida].tone ?? 'neutral']} **:text-inherit!`}>
                      <HugeiconsIcon icon={MEASURE_VISUAL[medida].icon} aria-hidden="true" />
                    </IconTile>
                    <div className="flex flex-col whitespace-normal">
                      <span className="font-medium">{MEASURE_META[medida].label}</span>
                      <Text as="span" size="xs" variant="muted">
                        {MEASURE_META[medida].tagline}
                      </Text>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {sinMedida ? <FieldError>Elige cómo se mide</FieldError> : null}
        </Field>

        <Field data-invalid={sinDireccion || undefined}>
          <div className="flex h-6 items-center gap-1">
            <FieldLabel htmlFor={`${id}-direccion`}>Dirección</FieldLabel>
            <AyudaDireccion />
          </div>
          <Select disabled={measure === null || booleano} value={direction ?? ''} onValueChange={(valor) => onCambio({ direction: valor as ObjectiveDirection })}>
            <SelectTrigger id={`${id}-direccion`} aria-invalid={sinDireccion || undefined}>
              <SelectValue placeholder={booleano ? 'No aplica' : 'Elige hacia dónde se mueve'}>
                {(valor: string) =>
                  valor ? (
                    <span className="flex min-w-0 items-center gap-2">
                      <HugeiconsIcon icon={DIRECTION_VISUAL[valor as ObjectiveDirection].icon} aria-hidden="true" className="shrink-0 text-muted-foreground" />
                      <span className="truncate">{DIRECTION_META[valor as ObjectiveDirection].label}</span>
                    </span>
                  ) : booleano ? (
                    'No aplica'
                  ) : (
                    'Elige hacia dónde se mueve'
                  )
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {DIRECCIONES.map((sentido) => (
                <SelectItem key={sentido} value={sentido}>
                  <div className="flex items-center gap-3 py-0.5">
                    <IconTile variant="soft" size="sm" className="shrink-0 text-primary! **:text-inherit!">
                      <HugeiconsIcon icon={DIRECTION_VISUAL[sentido].icon} aria-hidden="true" />
                    </IconTile>
                    <div className="flex flex-col whitespace-normal">
                      <span className="font-medium">{DIRECTION_META[sentido].label}</span>
                      <Text as="span" size="xs" variant="muted">
                        {DIRECTION_META[sentido].headline}
                      </Text>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {sinDireccion ? <FieldError>Elige hacia dónde se mueve</FieldError> : null}
        </Field>
      </div>

      {booleano ? (
        <FieldSet>
          <FieldLegend variant="label">Resultado al cierre</FieldLegend>
          <div className="flex items-center gap-2">
            <Resultado cumple={false} />
            <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" className="shrink-0 text-muted-foreground" />
            <Resultado cumple />
          </div>
          <Text as="p" size="sm" variant="muted">
            Sin valor inicial ni meta: al cerrar el ciclo, quien haga el seguimiento marca una de las dos opciones y el avance queda en 0 % o en 100 %.
          </Text>
        </FieldSet>
      ) : null}
    </>
  )
}
