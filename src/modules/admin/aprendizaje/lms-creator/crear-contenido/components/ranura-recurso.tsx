import { createContext, useContext, useEffect, useState, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowShrink01Icon, FullScreenIcon } from '@hugeicons/core-free-icons'
import { Button } from '@ubits/flux-ui'
import { Hint } from '@/shared/components/Hint'
import { notify } from '@/shared/components/notify'

/**
 * **Pantalla completa, una sola vez para todos los recursos.**
 *
 * Un documento, una presentación, un SCORM y un contenido externo se consumen igual: ocupando la pantalla. Pero cada
 * uno traía su botón en un sitio —el del PDF en su barra, el del SCORM flotando **encima** del paquete— y presentación
 * y embebido directamente no lo tenían (Dave, 9-oct).
 *
 * La salida no fue rehacer cada visor, sino **mover el botón sin mover su mecánica**: quien pide la pantalla completa
 * sigue siendo el recurso, que es el único que sabe qué caja estirar; lo único que cambia es **dónde aparece el
 * botón**. Si el contenedor ofrece una ranura —la cabecera gris de la vista del colaborador, al lado del título de la
 * página—, el botón viaja ahí. Si no la ofrece —el editor, donde el recurso ya vive en un bloque con su propia
 * cabecera—, se queda flotando donde estaba.
 *
 * Por eso es un portal y no una prop: el botón nace dentro del visor, con su estado y su `ref`, y solo se dibuja en
 * otro sitio.
 */
const ContextoRanura = createContext<HTMLElement | null>(null)

export function RanuraDeRecurso({ ranura, children }: { ranura: HTMLElement | null; children: ReactNode }) {
  return <ContextoRanura.Provider value={ranura}>{children}</ContextoRanura.Provider>
}

/** ¿El contenedor ofrece ranura? Lo usa quien coloca algo **distinto** según la respuesta. */
export function useRanuraDeRecurso() {
  return useContext(ContextoRanura)
}

/** Lo que envuelve se pinta en la ranura del contenedor; sin ranura, se queda donde está escrito. */
export function AccionDelRecurso({ children }: { children: ReactNode }) {
  const ranura = useContext(ContextoRanura)
  return ranura ? createPortal(children, ranura) : <>{children}</>
}

/**
 * La pantalla completa de una caja. El navegador también saca de ella con Escape, así que el estado se lee del
 * documento y no de quien pulsó.
 *
 * Solo la concede con un gesto de verdad y puede negarla (un iframe sin permiso, un móvil que no la admite). Si la
 * niega, se dice, en vez de dejar un botón que no hace nada.
 */
export function usePantallaCompleta(caja: RefObject<HTMLElement | null>) {
  const [activa, setActiva] = useState(false)
  useEffect(() => {
    const mirar = () => setActiva(document.fullscreenElement === caja.current)
    document.addEventListener('fullscreenchange', mirar)
    return () => document.removeEventListener('fullscreenchange', mirar)
  }, [caja])
  const alternar = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await caja.current?.requestFullscreen()
    } catch {
      notify('Tu navegador no permitió abrir la pantalla completa')
    }
  }
  return { activa, alternar }
}

/**
 * El botón, igual en todos los recursos. Con ranura va en la cabecera gris; sin ella, flotando en la esquina del
 * recurso, que es donde vivía. En el teléfono se queda en solo icono: ahí cada píxel de la barra cuenta.
 */
export function BotonPantallaCompleta({
  activa,
  onAlternar,
  compacto = false,
  posicionSuelta = 'absolute top-3 right-3',
}: {
  activa: boolean
  onAlternar: () => void
  compacto?: boolean
  /** Dónde se coloca cuando **no** hay ranura (el editor). */
  posicionSuelta?: string
}) {
  const ranura = useRanuraDeRecurso()
  // **En pantalla completa el botón vuelve a casa.** La cabecera gris se queda fuera de la caja que ocupa la
  // pantalla, así que un botón que viviera allí desaparecería justo cuando hace falta para salir, y el único camino
  // de vuelta sería la tecla Escape. Dentro de la caja sigue a la vista (Dave, 9-oct).
  const enRanura = ranura && !activa
  const boton = (
    <div className={enRanura ? undefined : posicionSuelta}>
        <Hint label={activa ? 'Salir de pantalla completa' : 'Pantalla completa'}>
          <Button
            variant="outline"
            size={compacto ? 'icon-sm' : 'sm'}
            className="rounded-full!"
            aria-label={activa ? 'Salir de pantalla completa' : 'Ver en pantalla completa'}
            onClick={onAlternar}
          >
            <HugeiconsIcon icon={activa ? ArrowShrink01Icon : FullScreenIcon} size={16} />
            {compacto ? null : activa ? 'Salir' : 'Pantalla completa'}
          </Button>
        </Hint>
    </div>
  )
  return enRanura ? createPortal(boton, ranura) : boton
}
