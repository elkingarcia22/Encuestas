import { toast } from '@ubits/flux-ui'

// Avisos cortos ("toasts"). flux-ui expone el gestor como `toast` (Base UI); el contenedor va en Toaster.tsx (con los
// nombres ocultos en español) y aquí queda con un nombre corto para las maquetas.
export { Toaster } from '@/shared/components/Toaster'

// Cuánto dura un aviso antes de cerrarse solo: la regla del referente (playground-react y vanilla, `toastDurationMs`).
// Lo más largo entre la base de su tipo (éxito e información 3,5 s; advertencia 5 s; error 6,5 s) y ~50 ms por
// carácter del texto, con un mínimo de 2 s y un máximo de 7 s. Base UI pausa el tiempo mientras el cursor está encima.
export type TipoAviso = 'success' | 'info' | 'warning' | 'error'
const BASE_AVISO: Record<TipoAviso, number> = { success: 3500, info: 3500, warning: 5000, error: 6500 }

export function duracionAviso(texto: string, tipo: TipoAviso = 'success') {
  const porLongitud = Math.min(7000, Math.max(2000, texto.length * 50))
  return Math.max(BASE_AVISO[tipo], porLongitud)
}

// El tipo, además, pone a la izquierda el icono en su color (Toaster.tsx): hecho en verde, información en azul,
// advertencia en amarillo y error en rojo. Todo aviso lo lleva (1 oct, Nicolás: en Vacantes unos traían el icono rojo y
// otros nada, «estandarízalos todos»). Sin tipo sale sin icono, como antes: es lo que queda por pasar en el resto.
export function notify(title: string, description?: string, tipo?: TipoAviso) {
  toast.add({ title, description, type: tipo, timeout: duracionAviso(`${title} ${description ?? ''}`.trim(), tipo) })
}

// Aviso con un botón: se usa para «Deshacer» justo después de una acción que se puede revertir. El botón lo pinta
// `ToastAction` en Toaster.tsx.
export function notifyAction(
  title: string,
  description: string | undefined,
  action: { label: string; onClick: () => void },
  tipo?: TipoAviso,
) {
  toast.add({
    title,
    description,
    type: tipo,
    timeout: duracionAviso(`${title} ${description ?? ''} ${action.label}`.trim(), tipo),
    actionProps: { children: action.label, onClick: action.onClick },
  })
}
