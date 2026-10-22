import { crearProximamente } from '@/modules/design-system/estados/pantalla-proximamente'

// Sin maquetar todavía: sigue en el menú con «Próximamente» y abre la espera del sistema (regla «pantallas-pendientes», 13-oct).
export const { Component } = crearProximamente(
  'PDI',
  'Planes de desarrollo individual: los resultados de la matriz de talento, convertidos en un plan para cada persona.',
  'Un plan de desarrollo para cada persona, armado con los resultados de la matriz de talento.',
  'AdminDesempenoCulturaPdiPage',
)
