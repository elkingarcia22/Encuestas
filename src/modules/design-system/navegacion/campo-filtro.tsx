import { Field, FieldLabel, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ubits/flux-ui'

type Opcion = { value: string; label: string }

// Un campo del globo: el nombre a la izquierda y la lista a la derecha, que abre con «Todas…» (el patrón de «Filtros» de
// los resultados de Encuestas). Lo usa también el historial de Créditos (5 oct).
export function CampoFiltro({ id, nombre, valor, opciones, onCambiar }: { id: string; nombre: string; valor: string; opciones: Opcion[]; onCambiar: (valor: string) => void }) {
  // «flex-none!» y «flex-1!»: el nombre con su ancho fijo y la lista con el resto; el Field horizontal reparte el ancho a
  // su manera y una clase sola no le gana al tema (Ajustes propios › Tabla).
  return (
    <Field orientation="horizontal">
      <FieldLabel htmlFor={id} className="w-24 flex-none!">
        {nombre}
      </FieldLabel>
      <Select value={valor} onValueChange={(nuevo) => onCambiar(String(nuevo))} items={opciones}>
        {/* La lista ocupa el resto de la fila. */}
        <SelectTrigger id={id} size="sm" className="min-w-0 flex-1!">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {opciones.map((opcion) => (
            <SelectItem key={opcion.value} value={opcion.value}>
              {opcion.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}
