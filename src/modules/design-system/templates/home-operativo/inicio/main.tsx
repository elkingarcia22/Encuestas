import { destino } from '../../admin-compartido/rutas'
import { InicioOperativo } from '../components/inicio-operativo'

// Inicio del Home operativo: los pendientes y atajos de Encuestas, Gestión de usuarios y Planes
// llevan a sus templates; el resto, a la pantalla pendiente del Home.
export function Component() {
  return <InicioOperativo enlace={destino} />
}

Component.displayName = 'TemplateHomeOperativoInicio'
