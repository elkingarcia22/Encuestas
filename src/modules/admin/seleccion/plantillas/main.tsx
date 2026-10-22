import { crearProximamente } from '@/modules/design-system/estados/pantalla-proximamente'

// Sin maquetar todavía: sigue en el menú con «Próximamente» y abre la espera del sistema (regla «pantallas-pendientes», 13-oct).
export const { Component } = crearProximamente(
  'Plantillas',
  'Guarda un flujo del candidato para reutilizarlo en otras vacantes.',
  'Guardar un flujo del candidato como plantilla y reutilizarlo en otras vacantes.',
  'AdminSeleccionPlantillasPage',
)
