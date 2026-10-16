import { Item, ItemContent, Text } from '@ubits/flux-ui'
import { QUIEN_MUEVE } from '../movimientos'

// Cómo le llega el correo a la persona (VA-33): con su nombre, la vacante y la etapa ya puestos, y quién lo firma. Con
// varias, se ve el de la primera; a cada una le llega con sus datos.
export function VistaPreviaCorreo({
  texto,
  asunto,
  datos,
  varias = 0,
}: {
  texto: string
  asunto?: string
  datos: { nombre: string; vacante: string; etapa?: string }
  // Cuántas más reciben el mismo correo, además de la que se muestra.
  varias?: number
}) {
  const poner = (valor: string) =>
    valor
      .replaceAll('{nombre}', datos.nombre)
      .replaceAll('{vacante}', datos.vacante)
      .replaceAll('{etapa}', datos.etapa ?? '')
      .replaceAll('{cargo}', datos.vacante)
  return (
    <Item variant="muted" size="sm">
      <ItemContent className="gap-2">
      <Text as="span" size="xs" variant="muted">
        Así le llega a {datos.nombre}
        {varias ? ` (y a ${varias === 1 ? 'otra persona' : `${varias} personas más`}, con sus datos)` : ''}
      </Text>
      {asunto ? (
        <Text as="p" size="sm" weight="medium">
          {poner(asunto)}
        </Text>
      ) : null}
      <Text as="p" size="sm" className="whitespace-pre-line">
        {poner(texto)}
      </Text>
      <Text as="p" size="sm" variant="muted">
        {QUIEN_MUEVE} · Equipo de selección
      </Text>
      </ItemContent>
    </Item>
  )
}
