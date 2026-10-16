import { BASE as HOME, ruta as rutaHome } from '../home-operativo/components/data'

// Rutas de los templates del administrador que muestran los patrones en pantallas reales
// (Gestión de usuarios, Planes de formación y Encuestas). Comparten el menú del Home operativo:
// las entradas que ya tienen template llevan a él; las demás, a la pantalla «pendiente» del Home.

export const HOME_OPERATIVO = HOME
export const GESTION_USUARIOS = '/design-system/templates/gestion-usuarios'
export const PLANES_FORMACION = '/design-system/templates/planes-formacion'
export const ENCUESTAS = '/design-system/templates/encuestas'

// slug del menú del Home operativo → template propio.
const PROPIOS: Record<string, string> = {
  'gestion-de-usuarios': GESTION_USUARIOS,
  planes: PLANES_FORMACION,
  encuestas: ENCUESTAS,
}

export const destino = (slug: string) => PROPIOS[slug] ?? rutaHome(slug)

// Una entrada propia sigue activa en sus pantallas hijas (crear, detalle…).
export const esActivaAdmin = (ruta: string, pathname: string) =>
  Object.values(PROPIOS).includes(ruta) ? pathname === ruta || pathname.startsWith(`${ruta}/`) : pathname === ruta
