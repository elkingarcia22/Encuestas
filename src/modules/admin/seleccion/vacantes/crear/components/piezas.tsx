import { useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { InformationCircleIcon, MinusSignIcon, PlusSignIcon, Tick02Icon } from '@hugeicons/core-free-icons'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
  Frame,
  FramePanel,
  Heading,
  IconTile,
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Text,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { BotonIcono } from '@/shared/components/BotonIcono'

// Sección del formulario: tarjeta con su título y sus campos siempre a la vista. Antes se abría y
// cerraba como un acordeón; con todo abierto se recorre el paso de corrido y el panel «Así va la
// vacante» dice qué falta. Completa, muestra la marca junto al título.
export function SeccionFormulario({
  id,
  titulo,
  completa = false,
  children,
}: {
  id?: string
  titulo: string
  completa?: boolean
  children: ReactNode
}) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-titulo` : undefined} className="scroll-mt-6">
      <Frame>
        {/* El panel va sin relleno propio: lo ponen la cabecera y el cuerpo, para que la línea que
            los separa llegue de borde a borde de la tarjeta. */}
        <FramePanel className="[--frame-panel-px:0px] [--frame-panel-py:0px]">
          <div className="flex min-h-9 items-center justify-between gap-3 px-5 py-4">
            <Heading as="h2" level={5} id={id ? `${id}-titulo` : undefined}>
              {titulo}
            </Heading>
            {completa ? (
              <Badge variant="success-light">
                <HugeiconsIcon icon={Tick02Icon} aria-hidden="true" />
                Completa
              </Badge>
            ) : null}
          </div>
          <Separator />
          <div className="px-5 py-5">{children}</div>
        </FramePanel>
      </Frame>
    </section>
  )
}

// Icono de ayuda junto a una etiqueta. El tooltip de la librería solo abre al pasar el cursor;
// aquí se controla para que también abra con clic o con el teclado (en táctil no hay cursor).
export function AyudaCampo({ children }: { children: ReactNode }) {
  const [abierto, setAbierto] = useState(false)

  return (
    <Tooltip open={abierto} onOpenChange={setAbierto}>
      <TooltipTrigger
        render={
          <BotonIcono
            aria-label="Qué significa este campo"
            size="icon-xs"
            className="text-muted-foreground!"
            onClick={() => setAbierto((previo) => !previo)}
          />
        }
      >
        <HugeiconsIcon icon={InformationCircleIcon} size={16} />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs rounded-[0.5rem]! px-3! py-2! [font-size:13px]!">
        {children}
      </TooltipContent>
    </Tooltip>
  )
}

// Ajuste con interruptor dentro de su propio recuadro. Cuando se enciende, `children` aparece debajo
// separado por una línea: es el patrón de «Publicar en bolsas de empleo» y «Correo automático de rechazo».
export function TarjetaAjuste({
  icono,
  titulo,
  descripcion,
  ayuda,
  control,
  children,
}: {
  icono: IconSvgElement
  titulo: string
  descripcion?: string
  ayuda?: ReactNode
  // Hay tarjetas sin interruptor (las habilidades clave): ahí el control se omite.
  control?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="rounded-xl border p-4">
      <Field orientation="horizontal">
        <IconTile variant="soft" size="sm" className="shrink-0">
          <HugeiconsIcon icon={icono} aria-hidden="true" />
        </IconTile>
        <FieldContent>
          <div className="flex items-center gap-1">
            <FieldTitle>{titulo}</FieldTitle>
            {ayuda ? <AyudaCampo>{ayuda}</AyudaCampo> : null}
          </div>
          {descripcion ? <FieldDescription>{descripcion}</FieldDescription> : null}
        </FieldContent>
        {control ?? null}
      </Field>
      {children ? (
        <>
          <Separator className="my-4" />
          {children}
        </>
      ) : null}
    </div>
  )
}

// Un ajuste con número (5 oct, Nicolás: «veo demasiada experiencia con barras y eso realmente no es escalable»). Antes
// era un deslizador por número —puntajes mínimos, días de plazo, cuántas preguntas, el margen salarial— y cada uno se
// comía tres renglones y había que adivinar el valor por la posición del tirador. Ahora es una fila, como los
// interruptores de las etapas: a la izquierda el nombre y para qué sirve; a la derecha el número con − y + y su unidad.
// Se lee de un vistazo, se escribe el valor exacto y los ajustes de un panel quedan alineados en una columna.
export function CampoNumero({
  id,
  etiqueta,
  descripcion,
  valor,
  onCambio,
  min,
  max,
  step = 1,
  unidad,
  disabled,
}: {
  id: string
  etiqueta: string
  // Para qué sirve el número, en una línea.
  descripcion?: string
  valor: number
  onCambio: (valor: number) => void
  min: number
  max: number
  step?: number
  // «pts», «días», «%»: va pegada al campo, en gris.
  unidad: string
  disabled?: boolean
}) {
  return (
    <Field orientation="horizontal" data-disabled={disabled || undefined}>
      <FieldContent>
        <FieldLabel htmlFor={id}>{etiqueta}</FieldLabel>
        {descripcion ? <FieldDescription>{descripcion}</FieldDescription> : null}
      </FieldContent>
      <div className="flex shrink-0 items-center gap-2">
        <NumberField
          id={id}
          value={valor}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          locale="es-CO"
          // Al borrar el número se queda en el mínimo: un ajuste nunca queda vacío.
          onValueChange={(nuevo) => onCambio(nuevo ?? min)}
          className="w-32"
        >
          <NumberFieldGroup>
            <NumberFieldDecrement aria-label={`Bajar «${etiqueta}»`}>
              <HugeiconsIcon icon={MinusSignIcon} strokeWidth={2} aria-hidden="true" />
            </NumberFieldDecrement>
            <NumberFieldInput className="tabular-nums" />
            <NumberFieldIncrement aria-label={`Subir «${etiqueta}»`}>
              <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />
            </NumberFieldIncrement>
          </NumberFieldGroup>
        </NumberField>
        {/* Del mismo ancho en todas las filas: así los campos de un panel quedan en una columna. */}
        <Text as="span" variant="muted" size="sm" className="w-16">
          {unidad}
        </Text>
      </div>
    </Field>
  )
}

// Un ajuste con pocas opciones fijas (la duración de una sesión): la misma fila, con un selector a la derecha.
export function CampoOpcion({
  id,
  etiqueta,
  descripcion,
  valor,
  opciones,
  onCambio,
}: {
  id: string
  etiqueta: string
  descripcion?: string
  valor: string
  opciones: readonly string[]
  onCambio: (valor: string) => void
}) {
  return (
    <Field orientation="horizontal">
      <FieldContent>
        <FieldLabel htmlFor={id}>{etiqueta}</FieldLabel>
        {descripcion ? <FieldDescription>{descripcion}</FieldDescription> : null}
      </FieldContent>
      {/* El ancho del campo de número más su unidad: los selectores y los números de un panel cierran en la misma línea. */}
      <Select value={valor} onValueChange={(nuevo) => nuevo && onCambio(nuevo)}>
        <SelectTrigger id={id} className="w-50 shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {opciones.map((opcion) => (
            <SelectItem key={opcion} value={opcion}>
              {opcion}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}
