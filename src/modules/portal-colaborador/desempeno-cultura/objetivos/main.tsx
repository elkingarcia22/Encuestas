import { crearProximamente } from '@/modules/design-system/estados/pantalla-proximamente'

// Sin maquetar todavía: sigue en el menú con «Próximamente» y abre la espera del sistema (regla «pantallas-pendientes», 13-oct).
export const { Component } = crearProximamente(
  'Objetivos',
  'Tus objetivos del ciclo.',
  'La lista de los objetivos de tu ciclo, con su ayuda.',
  'PortalColaboradorDesempenoCulturaObjetivosPage',
)
