import { createContext, useContext } from 'react'

// El drawer dentro del que se dibuja algo. Lo pone `DrawerShell` alrededor de su contenido para que lo que se abre desde
// él no salga como otra cosa encima: ni una ventana ni otro drawer. Se abre **en el mismo drawer**, como una vista que
// tapa su contenido, con la fila «← título del panel» para volver (8 oct, Nicolás: «si dentro de un drawer dispara un
// modal, dentro del drawer abras una nueva instancia y muestres ahí todo lo que estaba en el modal»; y después: «dentro
// del drawer abrieras una nueva instancia con el devolver pero en el drawer que tiene todo, nada de abrir un nuevo
// drawer»).
export type Vista = {
  id: string
  // Volver al panel: lo que hace la fila «←», Escape o tocar fuera mientras la vista está abierta.
  cerrar: () => void
  // Necesita más ancho que el panel (dos columnas): el panel se ensancha mientras está abierta.
  ancha: boolean
}

export type PanelActual = {
  // A dónde vuelve la fila «←» de una vista abierta aquí.
  titulo: string
  size: 'sm' | 'md' | 'lg' | 'xl'
  // Dónde se dibujan las vistas: una capa del mismo drawer, encima de su contenido.
  capa: HTMLElement | null
  // Una vista se anota al abrirse (y se borra al cerrarse): así Escape y tocar fuera vuelven a la anterior en vez de
  // cerrar el drawer entero, y el contenido de abajo deja de recibir el foco.
  registrar: (vista: Vista) => () => void
  // La vista de más arriba, la única que se usa.
  arriba: string | undefined
  // La X de una vista cierra el drawer entero, no solo la vista.
  cerrarPanel: () => void
}

export const ContextoPanel = createContext<PanelActual | null>(null)

export const usePanelActual = () => useContext(ContextoPanel)
