import { crearProximamente } from '@/modules/design-system/estados/pantalla-proximamente'

// Sin maquetar todavía: sigue en el menú con «Próximamente» y abre la espera del sistema (regla «pantallas-pendientes», 13-oct).
export const { Component } = crearProximamente(
  'Matriz de talento',
  'Cruza las evaluaciones 360 con los objetivos para analizar el talento de tus equipos.',
  'El cruce de las evaluaciones 360 con los objetivos, para ver el talento de cada equipo.',
  'AdminDesempenoCulturaMatrizDeTalentoPage',
)
