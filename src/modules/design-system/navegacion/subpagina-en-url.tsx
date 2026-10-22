import { useRef } from 'react'
import { useBlocker, useLocation, useNavigate, useSearchParams } from 'react-router'
import { VentanaSalir } from './boton-salir-creacion'

// Una página dentro de otra creación (13-oct, regla «crear-en-pagina»: los asistentes por pasos ya no van en un panel).
// Es la MISMA ruta con un parámetro (`?asignacion=nueva`, `?asignacion=<id>`): la pantalla de fondo (el plan, el ciclo)
// no se desmonta, solo cede su lugar, así que nada de lo que se llevaba se pierde al ir y volver, y «Atrás» del
// navegador funciona.

const MARCA = '__subpagina'

// Quién abre y cierra la página anidada. `valor` es lo que dice el parámetro (null = no está abierta).
// Al cerrar, si la página se abrió desde aquí se retrocede una entrada del historial (así «Atrás» no se queda dando
// vueltas); si alguien llegó directo por el enlace, solo se quita el parámetro.
export function useSubpaginaEnUrl(param: string) {
  const [parametros] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const valor = parametros.get(param)

  const abrir = (nuevo: string) => {
    const siguiente = new URLSearchParams(parametros)
    siguiente.set(param, nuevo)
    // El estado de la entrada (dónde volver, el borrador del agente…) viaja con ella.
    navigate({ search: siguiente.toString() }, { state: { ...(location.state ?? {}), [MARCA]: true } })
  }

  const cerrar = () => {
    if (location.state?.[MARCA]) return navigate(-1)
    const siguiente = new URLSearchParams(parametros)
    siguiente.delete(param)
    navigate({ search: siguiente.toString() }, { replace: true, state: location.state })
  }

  return { valor, abrir, cerrar }
}

// «Atrás» del navegador estando en la página anidada con cosas escritas: pregunta antes de tirarlas. Lo usa la propia
// página anidada. Sus salidas por la pantalla (guardar, el botón de la cabecera) llaman antes a `liberar()` para que
// no pregunten dos veces. Sin borrador real donde guardar: la ventana del sistema avisa que se pierde lo que se lleva.
export function useFrenoAtras({ param, activo, texto }: { param: string; activo: boolean; texto?: string }) {
  const libre = useRef(false)
  const bloqueo = useBlocker(
    ({ currentLocation, nextLocation }) =>
      activo &&
      !libre.current &&
      currentLocation.pathname === nextLocation.pathname &&
      new URLSearchParams(currentLocation.search).has(param) &&
      !new URLSearchParams(nextLocation.search).has(param),
  )

  const dialogo = (
    <VentanaSalir
      abierto={bloqueo.state === 'blocked'}
      onAbiertoChange={(abierto) => (abierto ? undefined : bloqueo.reset?.())}
      texto={texto}
      borrador={false}
      onSalir={() => bloqueo.proceed?.()}
    />
  )

  return {
    liberar: () => {
      libre.current = true
    },
    dialogo,
  }
}
