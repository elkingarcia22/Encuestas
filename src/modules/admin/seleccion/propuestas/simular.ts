import { toast } from '@ubits/flux-ui'
import { duracionAviso } from '@/shared/components/notify'

// Simuladores para QA y para enseñar los estados raros sin tocar el código: se piden en la dirección.
//
// - `?simular=error`: la primera carga de cada bloque falla y muestra su error con «Reintentar» (el reintento sí carga).
// - `?simular=vacio`: la empresa recién empieza: sin vacantes, sin candidatos y sin historia. Hoy lo leen el Dashboard
//   (sin vacantes) y Créditos (sin compras ni movimientos).
// - `?simular=lento`: cada bloque tarda ~4 s en cargar.
// - `?simular=falla-mover`: mover o rechazar a alguien no se guarda la primera vez.
// - `?simular=falla-guardar`: cualquier cosa que se guarda falla la primera vez y su aviso trae «Reintentar» (VA-50; 8 oct
//   se extendió a todo Selección: la base, las vacantes, la ficha, Créditos, AI Insights y las importaciones).
// - `?simular=sin-creditos`: la bolsa de créditos de IA está en cero (en Créditos, en mover a una etapa con IA y en crear).
// - `?simular=otra-reclutadora`: otra persona del equipo trabaja la vacante a la vez; la primera persona que muevas ya la
//   había movido ella un momento antes (VA-23).
// - `?simular=agente-error`: Orbit Flow no puede responder la primera vez que se le pide algo; el reintento sí (OF-35).
// - `?simular=agente-lento`: Orbit Flow tarda ~9 s en cada respuesta y a los 4 s dice que está tardando (OF-35).
// Se combinan con comas: `?simular=lento,error`.
// - `?como=duena|puede-editar|solo-ver`: ver una vacante con ese permiso, aunque la persona que mira tenga otro.
//
// Se lee de la dirección en el momento: vale para la pantalla que se abra con ella.

export type Simulacion = 'error' | 'vacio' | 'lento' | 'falla-mover' | 'falla-guardar' | 'sin-creditos' | 'otra-reclutadora' | 'agente-error' | 'agente-lento'
export type Como = 'duena' | 'puede-editar' | 'solo-ver'

const parametros = () => (typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.search))

export const simulado = (que: Simulacion) =>
  (parametros().get('simular') ?? '')
    .split(',')
    .map((uno) => uno.trim())
    .includes(que)

// Con `?simular=falla-guardar`, la primera vez que se guarda cada cosa falla; el reintento sí guarda.
const yaFallo = new Set<string>()
export function fallaAlGuardar(clave: string) {
  if (!simulado('falla-guardar') || yaFallo.has(clave)) return false
  yaFallo.add(clave)
  return true
}

// El caso de error de cualquier acción que guarda (8 oct, Nicolás: «revisa que sí estemos teniendo en cuenta todos los
// casos de error»): si no se guardó, nada cambia, el aviso lo dice en una línea y «Reintentar» vuelve a hacer lo mismo.
// Devuelve `true` cuando falló, para cortar ahí: `if (noSeGuardo('etiquetas:…', 'No pudimos etiquetar a Laura', otraVez)) return`.
export function noSeGuardo(clave: string, titulo: string, reintentar: () => void, detalle = 'No se guardó ningún cambio.') {
  if (!fallaAlGuardar(clave)) return false
  avisoDeError(titulo, detalle, reintentar)
  return true
}

// El aviso de un error con su salida: rojo, una línea de detalle y el botón que lo vuelve a intentar. Al tocarlo, el aviso
// se va (si el reintento también falla, sale uno nuevo); antes se quedaba encima del que decía que sí se pudo.
// Va con el gestor de avisos directo y no con `notifyAction`: para cerrarlo al tocar «Reintentar» hace falta el id del aviso,
// y `notifyAction` (zona protegida) no lo devuelve; sin id, cerrar cierra todos los avisos.
export function avisoDeError(titulo: string, detalle: string | undefined, reintentar: () => void, etiqueta = 'Reintentar') {
  const id = toast.add({
    type: 'error',
    title: titulo,
    description: detalle,
    timeout: duracionAviso(`${titulo} ${detalle ?? ''} ${etiqueta}`, 'error'),
    actionProps: {
      children: etiqueta,
      onClick: () => {
        toast.close(id)
        reintentar()
      },
    },
  })
}

// Con `?simular=otra-reclutadora`, la otra persona del equipo gana una sola vez: a la primera que muevas (VA-23).
let otraYaMovio = false
export function otraLaMovioAntes() {
  if (!simulado('otra-reclutadora') || otraYaMovio) return false
  otraYaMovio = true
  return true
}

export function comoSimulado(): Como | null {
  const como = parametros().get('como')
  return como === 'duena' || como === 'puede-editar' || como === 'solo-ver' ? como : null
}
