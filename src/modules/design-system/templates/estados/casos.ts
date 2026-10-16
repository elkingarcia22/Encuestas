import {
  ERRORES,
  registroQueNoExiste,
  registroSinEdicion,
  type ErrorDeSistema,
} from '../../estados/errores-sistema-datos'

// Los estados que ocupan la pantalla entera, para verlos sin tener que provocarlos (follow up del
// 17-sep: en el design system se ven dentro de una tarjeta, y «Ver en acción» obliga a filtrar hasta
// que no quede nada o a escribir una dirección inválida).
//
// `marco` decide qué se ve alrededor, y es la diferencia que importa:
//   'admin'  → con barra lateral y encabezado: pasa estando dentro del producto.
//   'sola'   → sin nada alrededor: la sesión, la conexión o el servidor te dejaron fuera, así que
//              ese menú no respondería.

export type TipoDeCaso = 'error' | 'carga'
export type MarcoDelCaso = 'admin' | 'sola'

export type CasoDeEstado = {
  id: string
  nombre: string
  cuando: string
  tipo: TipoDeCaso
  marco: MarcoDelCaso
  error?: ErrorDeSistema
}

const porId = (id: string) => ERRORES.find((e) => e.id === id) as ErrorDeSistema

export const CASOS: CasoDeEstado[] = [
  // ── Dentro del producto ──
  {
    id: '404',
    nombre: 'No encontramos esta página',
    cuando: 'La dirección no lleva a ninguna página.',
    tipo: 'error',
    marco: 'admin',
    error: porId('404'),
  },
  {
    id: 'sin-acceso',
    nombre: 'Sin acceso a este contenido',
    cuando: 'El contenido existe, pero aún no está disponible para esa persona.',
    tipo: 'error',
    marco: 'admin',
    error: porId('sin-acceso'),
  },
  {
    id: 'registro',
    nombre: 'Un registro que ya no existe',
    cuando: 'Se abre un plan, un usuario o una encuesta que alguien borró.',
    tipo: 'error',
    marco: 'admin',
    error: registroQueNoExiste('este plan', 'Planes'),
  },
  {
    id: 'sin-edicion',
    nombre: 'Ya no se puede editar',
    cuando: 'El registro sigue ahí, pero su estado ya no admite cambios.',
    tipo: 'error',
    marco: 'admin',
    error: registroSinEdicion(
      'Esta encuesta ya no se puede editar',
      'Ya está en curso: solo se puede cambiar su fecha de cierre.',
      'Encuestas',
    ),
  },
  {
    id: 'carga-pantalla',
    nombre: 'Una pantalla que llega por primera vez',
    cuando: 'La primera carga de una lista o un tablero.',
    tipo: 'carga',
    marco: 'admin',
  },

  // ── Fuera: la sesión, la conexión o el servidor ──
  {
    id: 'offline',
    nombre: 'Sin conexión a internet',
    cuando: 'Se cayó la conexión con el dispositivo.',
    tipo: 'error',
    marco: 'sola',
    error: porId('offline'),
  },
  {
    id: 'licencia',
    nombre: 'El acceso ha terminado',
    cuando: 'La licencia de la persona venció o la empresa la retiró.',
    tipo: 'error',
    marco: 'sola',
    error: porId('licencia'),
  },
  {
    id: 'servidor',
    nombre: 'Error de servidor',
    cuando: 'Algo falló del lado de UBITS y la pantalla no puede pintarse.',
    tipo: 'error',
    marco: 'sola',
    error: porId('servidor'),
  },
]

export const BASE = '/design-system/templates/estados'
export const rutaCaso = (id: string) => `${BASE}/${id}`
export const buscarCaso = (id?: string) => CASOS.find((c) => c.id === id)

export const DENTRO = CASOS.filter((c) => c.marco === 'admin')
export const FUERA = CASOS.filter((c) => c.marco === 'sola')
