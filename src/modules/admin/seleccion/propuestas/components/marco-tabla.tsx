import type { ReactNode } from 'react'
import { Frame, FrameDescription, FrameFooter, FrameHeader, FramePanel, FrameTitle, cn } from '@ubits/flux-ui'

// La tabla como la del design system (`/design-system/data-grid`, que es `DataGridList`): un marco gris; arriba, en lo
// gris, el título si hace falta, sus acciones y los filtros; la tabla en un panel blanco; y abajo, otra vez en lo gris,
// la paginación (28 sep, Nicolás: «¿por qué no agarraste la del DS?»).
//
// No se usa `DataGridList` directo porque su paginación viene en inglés y sin forma de traducirla, y porque las
// tablas de aquí tienen celdas, cargas y estados vacíos propios. Se arma con el mismo `Frame` y las mismas medidas
// (`spacing="sm"`, el panel sin relleno), y el pie es el `PiePaginacion` de siempre, en español.
//
// La cabecera tiene dos filas: arriba qué se está mirando (el título y a su derecha las acciones, o el switch de vistas
// si no hay título) y abajo con qué se filtra. El título va solo si la pantalla no lo dice ya: en una lista que es toda
// la página, el de la página basta.
export function MarcoTabla({
  titulo,
  descripcion,
  acciones,
  filtros,
  pie,
  children,
  className,
}: {
  titulo?: ReactNode
  descripcion?: ReactNode
  // Primera fila: a la derecha del título o, sin título, la fila entera (el switch y la cuenta, por ejemplo).
  acciones?: ReactNode
  // Segunda fila: los filtros, a todo el ancho.
  filtros?: ReactNode
  // La paginación; se omite si no hay nada que paginar.
  pie?: ReactNode
  children: ReactNode
  className?: string
}) {
  const primera = titulo || acciones
  return (
    <Frame spacing="sm" className={cn('min-w-0', className)}>
      {primera || filtros ? (
        <FrameHeader className="[--frame-panel-header-gap:--spacing(2.5)]">
          {primera ? (
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              {titulo ? (
                <div className="flex min-w-0 flex-col">
                  <FrameTitle>{titulo}</FrameTitle>
                  {descripcion ? <FrameDescription>{descripcion}</FrameDescription> : null}
                </div>
              ) : null}
              {acciones ? <div className={cn('flex min-w-0 flex-wrap items-center gap-2', titulo ? 'ml-auto' : 'flex-1')}>{acciones}</div> : null}
            </div>
          ) : null}
          {filtros ? <div className="flex flex-wrap items-center gap-2">{filtros}</div> : null}
        </FrameHeader>
      ) : null}
      {/* Sin relleno, como el de `DataGridList`: la tabla llega hasta el borde del panel blanco. */}
      <FramePanel className="overflow-hidden [--frame-panel-px:0px] [--frame-panel-py:0px]">{children}</FramePanel>
      {pie ? <FrameFooter>{pie}</FrameFooter> : null}
    </Frame>
  )
}
