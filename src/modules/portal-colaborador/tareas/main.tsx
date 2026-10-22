import { crearProximamente } from '@/modules/design-system/estados/pantalla-proximamente'

// Sin maquetar todavía: sigue en el menú con «Próximamente» y abre la espera del sistema (regla «pantallas-pendientes», 13-oct).
export const { Component } = crearProximamente(
  'Tareas',
  'Organiza tu día y el de tus planes.',
  'Una agenda por día donde agregar tareas, tus planes y el seguimiento de lo pendiente y lo vencido.',
  'PortalColaboradorTareasPage',
)
