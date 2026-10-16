// Botón de icono del header (outline de flux-ui): el icono en el mismo gris de la barra lateral y, con su menú o panel
// abierto, en azul con fondo suave, como la opción activa de la barra. Los menús avisan con `aria-expanded` y los
// botones que abren un panel propio (procesos) con `aria-pressed`. Abierto, el azul se mantiene al pasar el cursor.
export const HEADER_ICON = [
  'text-muted-foreground! hover:text-foreground!',
  'aria-expanded:border-primary/25! aria-expanded:bg-primary/10! aria-expanded:text-primary! aria-expanded:hover:bg-primary/15! aria-expanded:hover:text-primary!',
  'aria-pressed:border-primary/25! aria-pressed:bg-primary/10! aria-pressed:text-primary! aria-pressed:hover:bg-primary/15! aria-pressed:hover:text-primary!',
].join(' ')
