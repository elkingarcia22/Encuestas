import { crearProximamente } from '@/modules/design-system/estados/pantalla-proximamente'

// Sin maquetar todavía: sigue en el menú con «Próximamente» y abre la espera del sistema (regla «pantallas-pendientes», 13-oct).
export const { Component } = crearProximamente(
  'Catálogo',
  'Explora los contenidos de UBITS.',
  'Un buscador con filtros, lo más buscado, aliados destacados y los 13 tipos de contenido de UBITS.',
  'PortalColaboradorAprendizajeCatalogoPage',
)
