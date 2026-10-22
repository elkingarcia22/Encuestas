import { crearProximamente } from '@/modules/design-system/estados/pantalla-proximamente'

// Sin maquetar todavía: sigue en el menú con «Próximamente» y abre la espera del sistema (regla «pantallas-pendientes», 13-oct).
export const { Component } = crearProximamente(
  'Diagnóstico',
  'Tus assessments.',
  'Los assessments que tu empresa te asigne, para que los respondas desde aquí.',
  'PortalColaboradorAprendizajeDiagnosticoPage',
)
