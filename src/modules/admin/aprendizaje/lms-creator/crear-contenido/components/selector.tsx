import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { Badge, Field, FieldDescription, FieldLabel, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ubits/flux-ui'

// Un campo de selección con su etiqueta: la ficha técnica, la plantilla de certificado y los selectores sueltos del editor.
// La lista se abre debajo del campo (o arriba si abajo no cabe), nunca encima de él. Si las opciones traen ícono —solo
// las que son del sistema, como el tipo o el nivel; nunca las que crea el usuario, como las categorías—, el campo
// muestra el de la opción elegida y la lista repite cada uno, como el «Select with icons» de flux-ui. Con `icono` se
// pone uno solo para toda la lista —la carpeta de las categorías—: entonces el icono dice de qué es el campo.

export type OpcionSelector = { value: string; label: string; icono?: IconSvgElement }

export function Selector({
  id,
  etiqueta,
  valor,
  opciones,
  onCambio,
  descripcion,
  opcional,
  icono,
}: {
  id: string
  etiqueta: string
  valor: string
  opciones: OpcionSelector[]
  onCambio: (valor: string) => void
  /** Línea de ayuda bajo el campo (p. ej. qué trae la plantilla elegida). */
  descripcion?: string
  /** Se puede dejar sin elegir. Se marca con la insignia «Opcional» del design system, no con un «(opcional)» en el texto. */
  opcional?: boolean
  /** El mismo icono para todas las opciones, elija lo que elija: el campo dice de qué es la lista, no cuál se escogió. */
  icono?: IconSvgElement
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>
        {etiqueta}
        {opcional ? (
          <Badge variant="secondary" size="xs">
            Opcional
          </Badge>
        ) : null}
      </FieldLabel>
      <Select value={valor} onValueChange={(v) => v && onCambio(String(v))}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue>
            {(v: string) => {
              const opcion = opciones.find((o) => o.value === v)
              const suyo = opcion?.icono ?? icono
              return (
                <span className="flex items-center gap-2">
                  {suyo ? <HugeiconsIcon icon={suyo} size={16} aria-hidden="true" className="text-muted-foreground" /> : null}
                  <span>{opcion?.label ?? ''}</span>
                </span>
              )
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          {opciones.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.icono ?? icono ? <HugeiconsIcon icon={(o.icono ?? icono)!} size={16} aria-hidden="true" className="text-muted-foreground" /> : null}
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {descripcion ? <FieldDescription>{descripcion}</FieldDescription> : null}
    </Field>
  )
}
