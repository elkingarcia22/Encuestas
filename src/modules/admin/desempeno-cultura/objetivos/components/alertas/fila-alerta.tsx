import { Badge, Button, Item, ItemActions, ItemContent, ItemDescription, ItemTitle, Text } from '@ubits/flux-ui'
import { TextoCompleto } from '@/shared/components/TextoCompleto'
import { etiquetaAccion, type AlertaCiclo } from '../../modelo/alertas'
import { grupoDe } from './columnas'

// Un caso en dos formas, como los de Encuestas: en columna para la fila del inicio y en fila entera cuando es el único.
// Los dos traen solo la acción que lo resuelve de una vez: desde el 20-oct no hay detalle.

type Props = { alerta: AlertaCiclo; onResolver: (alerta: AlertaCiclo) => void }

function Acciones({ alerta, onResolver }: Props) {
  return (
    <Button variant="outline" size="sm" onClick={() => onResolver(alerta)}>
      {etiquetaAccion(alerta)}
    </Button>
  )
}

/** Prioridad y qué pasa en una línea, el ciclo debajo y la acción de una vez. Sin el resumen. */
export function ColumnaAlerta(props: Props) {
  const { alerta } = props
  const prioridad = grupoDe(alerta.prioridad)
  return (
    <div className="flex min-w-0 flex-col gap-3 lg:px-5 lg:first:ps-0 lg:last:pe-0">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex min-w-0 items-center gap-2">
          <Badge variant={prioridad.insignia} size="sm" className="shrink-0">
            {prioridad.titulo}
          </Badge>
          <TextoCompleto texto={alerta.titulo}>
            <Text as="span" size="sm" weight="semibold" className="truncate">
              {alerta.titulo}
            </Text>
          </TextoCompleto>
        </div>
        <TextoCompleto texto={alerta.ciclo.nombre}>
          <Text as="span" size="xs" variant="muted" className="truncate">
            {alerta.ciclo.nombre}
          </Text>
        </TextoCompleto>
      </div>
      <div className="mt-auto flex items-center gap-1">
        <Acciones {...props} />
      </div>
    </div>
  )
}

/** El mismo caso en una fila entera, cuando es el único: con su resumen. */
export function FilaAlerta(props: Props) {
  const { alerta } = props
  const prioridad = grupoDe(alerta.prioridad)
  return (
    <Item size="sm" className="gap-3 px-0!">
      <ItemContent className="min-w-0">
        <ItemTitle className="w-full min-w-0">
          <Badge variant={prioridad.insignia} size="sm" className="shrink-0">
            {prioridad.titulo}
          </Badge>
          <TextoCompleto texto={alerta.titulo}>
            <span className="truncate">{alerta.titulo}</span>
          </TextoCompleto>
        </ItemTitle>
        <TextoCompleto texto={`${alerta.ciclo.nombre} · ${alerta.resumen}`}>
          <ItemDescription className="line-clamp-1!">
            {alerta.ciclo.nombre} · {alerta.resumen}
          </ItemDescription>
        </TextoCompleto>
      </ItemContent>
      <ItemActions>
        <Acciones {...props} />
      </ItemActions>
    </Item>
  )
}
