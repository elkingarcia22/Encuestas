import { Outlet, useLocation } from 'react-router'

import { MarcoPlantilla } from '../admin-compartido/marco-plantilla'
import { migasDe } from './components/data'

// Template Colaborador: el Workspace del colaborador del nuevo UBITS con las pantallas del
// recorrido «Estudiar un contenido asignado» (grafo de docs/plataforma-ubits). Usa la barra lateral, la
// barra superior y el pie del design system con el menú del colaborador (sección «plantilla-colaborador»
// de nav-config); cada pantalla es una ruta hija y el menú navega de verdad.

export function Component() {
  const { pathname } = useLocation()

  return (
    <MarcoPlantilla migas={migasDe(pathname)}>
      <Outlet />
    </MarcoPlantilla>
  )
}

Component.displayName = 'DesignSystemTemplateColaborador'
