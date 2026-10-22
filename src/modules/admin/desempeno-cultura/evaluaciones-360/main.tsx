import { crearProximamente } from '@/modules/design-system/estados/pantalla-proximamente'

// Sin maquetar todavía: sigue en el menú con «Próximamente» y abre la espera del sistema (regla «pantallas-pendientes», 13-oct).
export const { Component } = crearProximamente(
  'Evaluaciones 360',
  'Crea evaluaciones 360° y administra su ciclo: borrador, en progreso y finalizada, con sus resultados generales.',
  'Crear una evaluación 360° y ver la lista de tus evaluaciones según su estado: borrador, en progreso o finalizada.',
  'AdminDesempenoCulturaEvaluaciones360Page',
)
