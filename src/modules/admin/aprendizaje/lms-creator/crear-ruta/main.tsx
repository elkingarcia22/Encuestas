import { AsistenteContenido } from '../crear-contenido/components/asistente-contenido'

// LMS Creator › Crear ruta de aprendizaje: el mismo asistente, con contenidos del catálogo en el paso 2 en vez de
// páginas, sin tipo ni tiempo en la ficha y sin pesos en Ajustes (HU-LMS-013, HU-LMS-014).
export function Component() {
  return <AsistenteContenido clase="ruta" />
}

Component.displayName = 'AdminLmsCrearRutaPage'
