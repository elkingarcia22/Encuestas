import { HugeiconsIcon } from '@hugeicons/react'
import { FilterIcon } from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  Field,
  FieldLabel,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ubits/flux-ui'
import type { CampoFiltro } from '../../../modelo/filtrosPersona'

// El botón «Filtros» que va al lado de un buscador de personas o grupos, con el mismo armado que «Filtros» de
// Resultados: un popover con un selector por campo y la cuenta de lo activo en el botón. `BotonFiltros` es la pieza
// genérica (cualquier lista de campos); los de una persona —líder, rol, área, país y ciudad— los arma
// `camposDePersona` en modelo/filtrosPersona.ts.

const TODOS = '__todos__'

export function BotonFiltros({
  campos,
  onCambio,
  descripcion,
}: {
  campos: readonly CampoFiltro[]
  /** `''` quita el filtro de ese campo. */
  onCambio: (id: string, valor: string) => void
  descripcion: string
}) {
  const activos = campos.filter((campo) => campo.valor !== '').length
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" />}>
        <HugeiconsIcon icon={FilterIcon} aria-hidden="true" />
        Filtros
        {activos > 0 ? (
          <Badge size="xs" className="tabular-nums">
            {activos}
          </Badge>
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96!">
        <PopoverHeader>
          <PopoverTitle>Filtrar</PopoverTitle>
          <PopoverDescription>{descripcion}</PopoverDescription>
        </PopoverHeader>
        <div className="flex flex-col gap-3">
          {campos.map((campo) => {
            const items = [{ value: TODOS, label: campo.todos }, ...campo.opciones.map((opcion) => ({ value: opcion, label: opcion }))]
            return (
              <Field key={campo.id} orientation="horizontal">
                <FieldLabel htmlFor={`filtro-${campo.id}`} className="w-24 flex-none!">
                  {campo.etiqueta}
                </FieldLabel>
                <Select value={campo.valor || TODOS} onValueChange={(nuevo) => onCambio(campo.id, nuevo === TODOS ? '' : (nuevo as string))} items={items}>
                  <SelectTrigger id={`filtro-${campo.id}`} size="sm" className="min-w-0 w-full! flex-1 bg-background!">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )
          })}
          {activos > 0 ? (
            <Button variant="ghost" size="sm" className="self-start" onClick={() => campos.forEach((campo) => onCambio(campo.id, ''))}>
              Quitar filtros
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}
