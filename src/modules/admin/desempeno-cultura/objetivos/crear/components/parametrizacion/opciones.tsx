import type { ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { Badge, Field, FieldContent, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet, FieldTitle, IconTile, RadioGroup, RadioGroupItem, cn } from '@ubits/flux-ui'
import { TEXTO_POR_TONO } from '../../../../encuestas/components/tonos'
import type { Tone } from '../../../../encuestas/modelo/tone'

// Las piezas de las preguntas de la parametrización. Cada pregunta es un FieldSet con su leyenda, su ayuda y, si hace
// falta, su error; cada opción, una tarjeta de radio como las de «Tipo de visibilidad» en el paso 1 de Encuestas:
// icono en su color, nombre, una línea de ayuda y el radio a la derecha.

export type Opcion<T extends string> = {
  valor: T
  titulo: string
  ayuda?: string
  icono?: IconSvgElement
  tono?: Tone
  /** Una insignia junto al nombre: «Sugerido», «30 días»… */
  insignia?: string
}

const COLUMNAS: Record<number, string> = { 1: 'grid-cols-1', 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-2 xl:grid-cols-4', 5: 'md:grid-cols-3 xl:grid-cols-5', 6: 'md:grid-cols-3 xl:grid-cols-6' }

export function Pregunta({ titulo, ayuda, error, children, id }: { titulo?: ReactNode; ayuda?: ReactNode; error?: string | null; children: ReactNode; id?: string }) {
  return (
    <FieldSet id={id} data-invalid={error ? true : undefined} className="scroll-mt-24">
      {titulo ? <FieldLegend variant="label">{titulo}</FieldLegend> : null}
      {ayuda ? <FieldDescription>{ayuda}</FieldDescription> : null}
      {children}
      {error ? <FieldError>{error}</FieldError> : null}
    </FieldSet>
  )
}

export function TarjetasOpcion<T extends string>({
  nombre,
  opciones,
  valor,
  onValor,
  columnas = 2,
  invalido,
  onEnfocar,
}: {
  nombre: string
  opciones: readonly Opcion<T>[]
  valor: T | null
  onValor: (valor: T) => void
  columnas?: number
  invalido?: boolean
  /** Al pasar el cursor o el foco por una opción (la vista previa del modelo lo usa); null al salir. */
  onEnfocar?: (valor: T | null) => void
}) {
  return (
    <RadioGroup value={valor ?? ''} onValueChange={(nuevo) => onValor(nuevo as T)} className={cn('grid gap-3', COLUMNAS[columnas] ?? COLUMNAS[2])} aria-invalid={invalido || undefined}>
      {opciones.map((opcion) => {
        const id = `${nombre}-${opcion.valor}`
        return (
          <FieldLabel
            key={opcion.valor}
            htmlFor={id}
            onPointerEnter={onEnfocar ? () => onEnfocar(opcion.valor) : undefined}
            onPointerLeave={onEnfocar ? () => onEnfocar(null) : undefined}
            onFocus={onEnfocar ? () => onEnfocar(opcion.valor) : undefined}
            onBlur={onEnfocar ? () => onEnfocar(null) : undefined}
          >
            <Field orientation="horizontal" className="items-start!">
              <RadioGroupItem value={opcion.valor} id={id} />
              {opcion.icono ? (
                <IconTile variant="soft" size="sm" className={cn('shrink-0', TEXTO_POR_TONO[opcion.tono ?? 'brand'])}>
                  <HugeiconsIcon icon={opcion.icono} aria-hidden="true" />
                </IconTile>
              ) : null}
              <FieldContent>
                <FieldTitle>
                  {opcion.titulo}
                  {opcion.insignia ? (
                    <Badge variant="secondary" size="xs">
                      {opcion.insignia}
                    </Badge>
                  ) : null}
                </FieldTitle>
                {opcion.ayuda ? <FieldDescription>{opcion.ayuda}</FieldDescription> : null}
              </FieldContent>
            </Field>
          </FieldLabel>
        )
      })}
    </RadioGroup>
  )
}
