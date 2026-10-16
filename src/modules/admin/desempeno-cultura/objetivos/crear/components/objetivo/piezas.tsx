import type { ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Badge,
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
  Heading,
  IconTile,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  RadioGroupItem,
  Text,
  cn,
} from '@ubits/flux-ui'
import type { Tone } from '../../../../encuestas/modelo/tone'
import { TEXTO_FIJO_POR_TONO, soloCifra } from './formato'

// Las piezas que repiten los pasos de la tarjeta de objetivo: el encabezado numerado de cada paso, la tarjeta de
// opción (medida, dirección, sí/no) y el campo de cifra con su símbolo delante. Todas de flux-ui, con la misma
// gramática que «Datos generales» de encuestas (RadioGroup de tarjetas con IconTile).

/** Un paso de la tarjeta: número, la pregunta y su ayuda siempre a la vista; lo que se contesta, debajo y con sangría. */
export function PasoTarjeta({ numero, pregunta, ayuda, extra, children }: { numero: number; pregunta: ReactNode; ayuda?: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <section data-paso-objetivo className="flex scroll-mt-24 scroll-mb-6 flex-col gap-3 py-4">
      <header className="flex items-start gap-3">
        <Badge variant="secondary" radius="full" size="sm" className="mt-0.5 shrink-0 tabular-nums">
          {numero}
        </Badge>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <Heading as="h4" level={6}>
            {pregunta}
          </Heading>
          {ayuda ? (
            <Text as="p" size="sm" variant="muted">
              {ayuda}
            </Text>
          ) : null}
        </div>
        {extra ? <div className="flex shrink-0 items-center gap-2">{extra}</div> : null}
      </header>
      <div className="flex min-w-0 flex-col gap-4 sm:ps-9">{children}</div>
    </section>
  )
}

/** Una opción de un RadioGroup dibujada como tarjeta: icono, nombre, una línea y el círculo de la librería. */
export function TarjetaOpcion({
  id,
  valor,
  icono,
  tono,
  titulo,
  descripcion,
  invalida,
}: {
  id: string
  valor: string
  icono?: IconSvgElement
  /** Sin tono, el icono va en el azul de marca: es una elección llana, no una categoría con color propio. */
  tono?: Tone
  titulo: string
  descripcion?: string
  invalida?: boolean
}) {
  return (
    <FieldLabel htmlFor={id} className="bg-card">
      <Field orientation="horizontal" data-invalid={invalida || undefined} className="items-center!">
        <RadioGroupItem value={valor} id={id} aria-invalid={invalida || undefined} />
        {icono ? (
          <IconTile variant="soft" size="sm" className={cn('shrink-0 **:text-inherit!', tono ? TEXTO_FIJO_POR_TONO[tono] : 'text-primary!')}>
            <HugeiconsIcon icon={icono} aria-hidden="true" />
          </IconTile>
        ) : null}
        <FieldContent className="min-w-0 gap-0.5">
          <FieldTitle>{titulo}</FieldTitle>
          {descripcion ? <FieldDescription>{descripcion}</FieldDescription> : null}
        </FieldContent>
      </Field>
    </FieldLabel>
  )
}

/** Un campo de cifra con el símbolo de la medida delante ($, %, #). */
export function CampoCifra({
  id,
  simbolo,
  valor,
  onCambio,
  placeholder,
  invalido,
  disabled,
  autoFocus,
  etiqueta,
  className,
}: {
  id: string
  simbolo: string
  valor: string
  onCambio: (valor: string) => void
  placeholder?: string
  invalido?: boolean
  disabled?: boolean
  autoFocus?: boolean
  /** Solo si el campo no tiene FieldLabel propio. */
  etiqueta?: string
  /** Solo layout: el ancho cuando el campo va suelto en una fila. */
  className?: string
}) {
  return (
    <InputGroup className={cn('bg-background!', className)}>
      <InputGroupAddon>
        <InputGroupText className="tabular-nums">{simbolo}</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput
        id={id}
        inputMode="decimal"
        className="tabular-nums"
        value={valor}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={etiqueta}
        aria-invalid={invalido || undefined}
        autoFocus={autoFocus}
        onChange={(evento) => onCambio(soloCifra(evento.target.value))}
      />
    </InputGroup>
  )
}
