import {
  ArrowLeft01Icon,
  CloudServerIcon,
  FileNotFoundIcon,
  Home01Icon,
  Logout01Icon,
  RefreshIcon,
  SquareLock02Icon,
  WifiDisconnected01Icon,
} from '@hugeicons/core-free-icons'
import type { IconoGlass } from '../icons/glass'

// Los errores de sistema de HU-TRA-002. Aparte del componente para que los templates muestren el
// mismo error (p. ej. un plan que no existe).

export type Accion = { etiqueta: string; icono: typeof Home01Icon; efecto: string }

export type ErrorDeSistema = {
  id: string
  etiqueta: string
  cuando: string
  titulo: string
  cuerpo: string
  enfasis?: string
  accion: Accion | null
  icono: typeof Home01Icon
  // Ilustración Glass (public/iconos-glass): ocupa el lugar de la ilustración de Figma Errores (RN-01), que no ha
  // llegado. Antes había un recuadro de relleno a la vista (follow up del 17-sep).
  ilustracion: Pick<IconoGlass, 'nombre' | 'categoria'>
}

const GLASS = {
  buscar: { nombre: 'glass-search', categoria: 'acciones' },
  documento: { nombre: 'glass-document', categoria: 'archivos' },
  editar: { nombre: 'glass-edit', categoria: 'acciones' },
  candado: { nombre: 'glass-lock', categoria: 'cuenta-y-seguridad' },
  peligro: { nombre: 'glass-danger', categoria: 'alertas' },
  info: { nombre: 'glass-info-circle', categoria: 'alertas' },
} satisfies Record<string, Pick<IconoGlass, 'nombre' | 'categoria'>>

const VOLVER: Accion = { etiqueta: 'Volver al inicio', icono: Home01Icon, efecto: 'Te llevaría al inicio de tu Workspace' }

export const ERRORES: ErrorDeSistema[] = [
  {
    id: '404',
    etiqueta: 'No existe',
    cuando: 'La dirección no lleva a ninguna página.',
    titulo: 'No encontramos esta página',
    cuerpo: 'Puede que la dirección haya cambiado o que la página ya no exista.',
    // RN-03: la segunda frase del cuerpo va en énfasis.
    enfasis: 'Revisa que la URL esté bien escrita.',
    accion: VOLVER,
    icono: FileNotFoundIcon,
    ilustracion: GLASS.buscar,
  },
  {
    id: 'sin-acceso',
    etiqueta: 'Sin acceso',
    cuando: 'El contenido existe, pero la persona aún no lo tiene disponible.',
    titulo: 'Sin acceso a este contenido',
    cuerpo:
      'Este contenido existe, pero todavía no está disponible para ti. Si crees que deberías verlo, habla con tu líder o con Recursos Humanos.',
    accion: VOLVER,
    // RN-07: la misma ilustración que el acceso terminado.
    icono: SquareLock02Icon,
    ilustracion: GLASS.candado,
  },
  {
    id: 'offline',
    etiqueta: 'Sin conexión',
    cuando: 'El equipo perdió la conexión a internet.',
    titulo: 'Sin conexión a internet',
    cuerpo: 'Revisa tu conexión a la red y vuelve a intentarlo.',
    accion: { etiqueta: 'Volver a intentar', icono: RefreshIcon, efecto: 'Volvería a cargar la página' },
    icono: WifiDisconnected01Icon,
    ilustracion: GLASS.info,
  },
  {
    id: 'licencia',
    etiqueta: 'Acceso terminado',
    cuando: 'La licencia o el acceso de la empresa ya no está activo.',
    titulo: 'Tu acceso a UBITS ha terminado',
    cuerpo: 'La licencia de tu empresa ya no está activa. Si trabajas en Recursos Humanos, escríbenos para renovarla.',
    accion: { etiqueta: 'Cerrar sesión', icono: Logout01Icon, efecto: 'Cerraría la sesión' },
    icono: SquareLock02Icon,
    ilustracion: GLASS.candado,
  },
  {
    id: 'servidor',
    etiqueta: 'Falla del servidor',
    cuando: 'El servidor respondió con un error inesperado.',
    titulo: '¡Ups!, ha ocurrido un error',
    cuerpo: 'Estamos trabajando para solucionarlo. Inténtalo de nuevo más tarde.',
    // RN-04: sin botón; no hay nada que la persona pueda hacer ahora.
    accion: null,
    icono: CloudServerIcon,
    ilustracion: GLASS.peligro,
  },
]

// Un registro que no existe (un plan, una encuesta, un usuario): no es una dirección mal escrita, así que no se habla de
// la URL, y el botón vuelve a la lista de donde venía en vez de al inicio.
export function registroQueNoExiste(objeto: string, lista: string): ErrorDeSistema {
  return {
    id: 'registro',
    etiqueta: 'Registro que no existe',
    cuando: 'Se abre un plan, una encuesta o un usuario que ya no está.',
    titulo: `No encontramos ${objeto}`,
    // Sin género: el objeto puede ser masculino («este plan») o femenino («esta encuesta», «esta vacante»).
    cuerpo: 'Puede que ya no exista o que el enlace esté incompleto.',
    accion: { etiqueta: `Volver a ${lista}`, icono: ArrowLeft01Icon, efecto: `Te llevaría a ${lista}` },
    icono: FileNotFoundIcon,
    ilustracion: GLASS.documento,
  }
}

// Un registro que existe pero ya no se edita (una encuesta en curso, un plan no vigente): se dice por qué.
export function registroSinEdicion(titulo: string, motivo: string, lista: string): ErrorDeSistema {
  return {
    id: 'sin-edicion',
    etiqueta: 'Ya no se edita',
    cuando: 'El registro existe, pero su estado ya no deja editarlo.',
    titulo,
    cuerpo: motivo,
    accion: { etiqueta: `Volver a ${lista}`, icono: ArrowLeft01Icon, efecto: `Te llevaría a ${lista}` },
    icono: FileNotFoundIcon,
    ilustracion: GLASS.editar,
  }
}

// Los ejemplos que muestra el design system (Estados › Errores de sistema): los cinco de la HU y los dos de registro.
export const EJEMPLOS_ERROR: ErrorDeSistema[] = [
  ...ERRORES,
  registroQueNoExiste('este plan', 'Planes'),
  registroSinEdicion(
    'Esta encuesta ya no se puede editar',
    'Ya está en curso: solo se puede cambiar su fecha de cierre.',
    'Encuestas',
  ),
]
