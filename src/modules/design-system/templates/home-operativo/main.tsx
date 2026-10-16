import { Outlet, useLocation } from 'react-router'

import { MarcoPlantilla } from '../admin-compartido/marco-plantilla'
import { migasDe } from './components/data'

// Template «Home operativo»: el inicio del administrador según el concepto de producto
// (admin-ubits.netlify.app). Usa la barra lateral, la barra superior y el pie del design system con el menú
// del admin (sección «plantilla-admin» de nav-config): cada entrada del menú navega a su pantalla o, si
// todavía no existe, a la página «pendiente» del Home. Feedback, Suite AI y novedades son los del marco.

export function Component() {
  const { pathname } = useLocation()

  return (
    <MarcoPlantilla migas={migasDe(pathname)}>
      <Outlet />
    </MarcoPlantilla>
  )
}

Component.displayName = 'DesignSystemTemplateHomeOperativo'
