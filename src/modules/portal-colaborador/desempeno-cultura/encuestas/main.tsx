import { crearProximamente } from '@/modules/design-system/estados/pantalla-proximamente'

// Sin maquetar todavía: sigue en el menú con «Próximamente» y abre la espera del sistema (regla «pantallas-pendientes», 13-oct).
export const { Component } = crearProximamente(
  'Encuestas',
  'Encuestas asignadas por responder.',
  'Las encuestas que te asignen, para responderlas desde aquí.',
  'PortalColaboradorDesempenoCulturaEncuestasPage',
)
