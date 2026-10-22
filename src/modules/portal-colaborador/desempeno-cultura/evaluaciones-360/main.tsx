import { crearProximamente } from '@/modules/design-system/estados/pantalla-proximamente'

// Sin maquetar todavía: sigue en el menú con «Próximamente» y abre la espera del sistema (regla «pantallas-pendientes», 13-oct).
export const { Component } = crearProximamente(
  'Evaluaciones 360',
  'Responde tus evaluaciones 360 y consulta tus resultados.',
  'Las evaluaciones 360 por responder y sus resultados.',
  'PortalColaboradorDesempenoCulturaEvaluaciones360Page',
)
