// Clases de la barra lateral real (src/shared/layouts/AppSidebar.tsx y src/shared/components/SidebarRail.tsx),
// copiadas para que la réplica se vea igual. Si cambian allá, hay que cambiarlas aquí.

// Fila del menú: peso medio y gris (decidido el 16 sep). Activa: azul al 10% con texto azul.
export const ROW =
  'h-9! gap-3! rounded-lg! px-1.5! font-medium! text-sidebar-foreground! transition-colors data-active:bg-primary/10! data-active:text-primary!'

// Marca azul de la fila activa, pegada al borde de la barra.
export const ROW_MARK = 'before:absolute before:top-2 before:-left-3.5 before:h-5 before:w-0.75 before:rounded-r-full before:bg-primary'

// Producto con un hijo activo: solo se tiñe su icono; el fondo y la marca los lleva el hijo.
export const PARENT_ROW = 'data-active:bg-transparent! data-active:text-sidebar-foreground/75! data-active:hover:bg-sidebar-accent!'

export const GROUP_LABEL = 'h-7! px-1.5! text-xs! font-medium text-muted-foreground!'

export const SUITE_TAB =
  'flex-1 gap-2 text-muted-foreground! not-data-active:hover:text-foreground! data-active:font-medium! data-active:text-foreground! [&>div]:rounded-[10px]! [&>div]:bg-background! [&>div]:shadow-xs! [&>div]:ring-1 [&>div]:ring-border dark:[&>div]:bg-input/50! dark:[&>div]:ring-input'

export const SUB_BUTTON =
  'h-8! min-w-0 rounded-lg! px-2.5! text-muted-foreground! transition-colors hover:text-sidebar-foreground! data-active:bg-primary/10! data-active:font-medium! data-active:text-primary!'

// Marca del hijo activo, centrada sobre la línea guía del submenú.
export const GUIDE_MARK =
  'before:absolute before:top-1/2 before:-left-[13.5px] before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-primary'

// Botones del riel.
export const RAIL_BUTTON = 'relative size-10! transition-colors'
export const RAIL_ACTIVE = 'bg-primary/10! text-primary! hover:bg-primary/15!'
export const RAIL_IDLE = 'text-muted-foreground hover:bg-sidebar-accent! hover:text-foreground'
// Con su menú flotante abierto.
export const RAIL_OPEN = 'bg-sidebar-accent! text-foreground'

// Menú flotante del riel (réplica fija del menú desplegable de flux-ui). Esquina de la librería (rounded-md, 12 px):
// el real ya no la fuerza a 14 px desde la revisión ReUI (auditoría, 5 oct).
export const FLOAT_MENU = 'rounded-md bg-popover p-1.5 text-popover-foreground shadow-md ring-1 ring-foreground/10'

// Aire arriba de una fila que lleva un nombre pequeño adentro (insignia, punto de estado). Solo con los nombres visibles.
export const AIR = 'mt-[22px]'
