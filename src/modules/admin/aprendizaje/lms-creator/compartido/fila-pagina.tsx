import type { ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { CheckmarkCircle02Icon, CircleIcon, CircleLock02Icon, PlayCircleIcon } from '@hugeicons/core-free-icons'
import { cn, IconTile, Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@ubits/flux-ui'

// Una página del contenido dentro de un índice, con su estado.
//
// Vive aquí porque la usan dos pantallas que enseñan lo mismo desde lados distintos: el **índice del estudiante**, que
// es por dónde va quien estudia, y el **detalle del progreso** de Resultados, que es por dónde va otra persona. Tienen
// que verse iguales —es el mismo contenido— y antes cada una se dibujaba a su manera (Dave, 13-oct).
//
// La fila **no decide** el estado: se lo dan hecho. Cada pantalla sabe lo suyo (una, dónde está el lector; la otra,
// hasta dónde llegó alguien), y esa es justo la parte que no se puede compartir.

export type EstadoPaginaIndice = 'actual' | 'vista' | 'pendiente' | 'bloqueada'

const ICONO_ESTADO: Record<EstadoPaginaIndice, { icono: IconSvgElement; clase: string; etiqueta: string }> = {
  actual: { icono: PlayCircleIcon, clase: 'text-primary', etiqueta: 'En curso' },
  vista: { icono: CheckmarkCircle02Icon, clase: 'text-success', etiqueta: 'Completada' },
  pendiente: { icono: CircleIcon, clase: 'text-muted-foreground', etiqueta: 'Pendiente' },
  // Candado **dentro de un círculo**, no una llave ni un candado suelto: los otros tres estados ya son círculos
  // —play, check y círculo vacío—, así que la familia se lee de una (Dave, 6-oct).
  bloqueada: { icono: CircleLock02Icon, clase: 'text-muted-foreground', etiqueta: 'Bloqueada' },
}

export function EstadoPagina({ estado }: { estado: EstadoPaginaIndice }) {
  const marca = ICONO_ESTADO[estado]
  return <HugeiconsIcon icon={marca.icono} size={18} aria-label={marca.etiqueta} className={marca.clase} />
}

/**
 * La fila de una página en un índice.
 *
 * Con `onClick` se puede pulsar; sin él es solo lectura, que es como la lee quien mira el progreso de otra persona.
 * En `extra` van las marcas de la fila —«En vivo», «Oculta»—, antes del icono de estado.
 */
export function FilaPaginaIndice({
  titulo,
  descripcion,
  icono,
  estado,
  extra,
  onClick,
}: {
  titulo: string
  descripcion: ReactNode
  icono: IconSvgElement
  estado: EstadoPaginaIndice
  extra?: ReactNode
  onClick?: () => void
}) {
  const activa = estado === 'actual'
  const pulsable = onClick !== undefined && estado !== 'bloqueada'

  return (
    <Item
      size="xs"
      // **Todas con borde**, como las tarjetas de página del índice del Creator: así cada página se lee como una ficha
      // y no como una línea de lista. La que está en curso además va en **azul** —fondo claro y borde—, que es como el
      // tema dice «esta es la elegida» en las tarjetas de opción; en gris casi no se percibía (Dave, 6-oct).
      variant="outline"
      render={pulsable ? <button type="button" /> : undefined}
      className={cn('w-full text-left', activa && 'border-primary! bg-primary/5!')}
      onClick={pulsable ? onClick : undefined}
    >
      {/* Centrado como el icono de estado de la derecha: el tema lo alinea arriba y en una fila de dos renglones
          quedaba 9 px por encima del centro, desparejo con el otro (Dave, 6-oct). */}
      <ItemMedia className="self-center!">
        {/* El icono en su baldosa, como en el índice del Creator. **En azul solo la página en curso**: con todas
            azules el color dejaba de señalar nada (Dave, 6-oct). */}
        <IconTile variant="soft" size="sm" className={cn(!activa && 'bg-muted! text-muted-foreground!')}>
          <HugeiconsIcon icon={icono} aria-hidden="true" />
        </IconTile>
      </ItemMedia>
      <ItemContent className="min-w-0">
        <ItemTitle className="w-full">
          {/* Hasta dos renglones antes de recortar, como en el Creator: en una columna angosta, cortar a «Comunic…»
              no distingue una página de otra. */}
          <span className="line-clamp-2 min-w-0 whitespace-normal">{titulo.trim() || 'Sin título'}</span>
        </ItemTitle>
        <ItemDescription>{descripcion}</ItemDescription>
      </ItemContent>
      <ItemActions>
        {extra}
        <EstadoPagina estado={estado} />
      </ItemActions>
    </Item>
  )
}
