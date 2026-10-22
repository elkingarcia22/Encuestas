import { useEffect, useRef, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon, PlayIcon } from '@hugeicons/core-free-icons'
import { Button, cn } from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { trailerEmbebido } from '../crear-contenido/components/ficha'

// La portada con su tráiler encima: la imagen, el botón de play y, al pulsarlo, el vídeo en su lugar.
//
// Vive aquí porque la usan tres pantallas: el paso 1 del asistente, la vista previa de la derecha y la vista del
// colaborador. El tráiler **no es otra portada**: es algo que se reproduce sobre ella, así que al acabar vuelve la
// imagen y la pantalla queda como estaba (Dave, 15-oct).

/**
 * Avisa cuando el vídeo termina.
 *
 * Cada reproductor lo cuenta a su manera y por `postMessage`, que es la única vía desde fuera del iframe: YouTube
 * manda `onStateChange` con `info: 0` y Vimeo, un evento `finish`. A los dos hay que pedírselo primero, en cuanto el
 * iframe carga. Drive y OneDrive no avisan de nada: ahí el vídeo se cierra a mano con la X.
 */
function useFinDelVideo(proveedor: 'youtube' | 'vimeo' | 'otro', activo: boolean, onFin: () => void) {
  const marco = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!activo || proveedor === 'otro') return
    const ventana = marco.current?.contentWindow
    if (!ventana) return

    const suscribir = () => {
      if (proveedor === 'youtube') {
        ventana.postMessage(JSON.stringify({ event: 'listening' }), '*')
        ventana.postMessage(JSON.stringify({ event: 'command', func: 'addEventListener', args: ['onStateChange'] }), '*')
      } else {
        ventana.postMessage(JSON.stringify({ method: 'addEventListener', value: 'finish' }), '*')
      }
    }
    // Se pide al cargar y otra vez al segundo: el reproductor a veces no escucha en el primer intento.
    const alCargar = () => suscribir()
    marco.current?.addEventListener('load', alCargar)
    const reintento = window.setTimeout(suscribir, 1000)

    const alMensaje = (evento: MessageEvent) => {
      if (typeof evento.data !== 'string') return
      try {
        const dato = JSON.parse(evento.data)
        const termino = proveedor === 'youtube' ? dato?.event === 'onStateChange' && dato?.info === 0 : dato?.event === 'finish'
        if (termino) onFin()
      } catch {
        // Un mensaje que no es JSON no es del reproductor.
      }
    }
    window.addEventListener('message', alMensaje)
    return () => {
      marco.current?.removeEventListener('load', alCargar)
      window.clearTimeout(reintento)
      window.removeEventListener('message', alMensaje)
    }
  }, [activo, proveedor, onFin])

  return marco
}

/**
 * El tráiler **encima de lo que haya**: el botón de play y, al pulsarlo, el vídeo ocupando todo el hueco.
 *
 * Es una capa absoluta, así que quien la use tiene que ser `relative` y tener su propio alto. Así sirve igual dentro
 * del recuadro 16:9 del asistente que dentro de la portada de la tarjeta del catálogo, sin que la tarjeta tenga que
 * saber nada de vídeos.
 */
export function CapaTrailer({ trailer, tamano = 'lg' }: { trailer?: string; tamano?: 'lg' | 'sm' }) {
  const [reproduciendo, setReproduciendo] = useState(false)
  const video = trailer ? trailerEmbebido(trailer) : null
  const marco = useFinDelVideo(video?.proveedor ?? 'otro', reproduciendo, () => setReproduciendo(false))

  // Si se quita el tráiler o se cambia por otro mientras suena, se vuelve a la portada.
  useEffect(() => {
    if (!video) setReproduciendo(false)
  }, [video?.src])

  if (!video) return null

  if (!reproduciendo) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        {/* **El disco oscuro con el triángulo blanco**, el play de cualquier reproductor (Dave, 15-oct).
            La pastilla blanca de la librería tapaba el centro de la portada, y translúcida se perdía sobre una foto
            clara. El disco oscuro al 40 % deja ver la portada por debajo, y al pasar el cursor
            sube al 75 %, que es cuando sí hay que verlo bien.

            **El aro blanco no es adorno.** Con el relleno tan bajo, sobre una zona oscura de la foto —una chaqueta
            negra, una sombra— el disco se fundía y quedaba solo el triángulo flotando. El aro lo despega de
            cualquier fondo sin tener que subir la opacidad (Dave, 15-oct).

            Va en negro y blanco **a propósito, sin tokens de tema**: lo que hay detrás es una fotografía, que no
            cambia con el modo claro u oscuro, así que el play tampoco debe cambiar. Es el mismo criterio del velo
            degradado que lleva la portada en el asistente.

            **Y pequeño.** La portada está para que se vea, y el tráiler es opcional: el play avisa de que lo hay, no
            es el protagonista. A 32 px sobre una portada de 460 ocupa lo justo para pulsarlo sin comerse la imagen
            (Dave, 15-oct).

            Las clases van con el signo porque a secas no le ganan al tema de la librería: el botón se quedaba con
            sus 10 px de esquina y su fondo propio. Es la trampa conocida del proyecto. */}
        <Button
          variant="ghost"
          size={tamano === 'lg' ? 'icon-sm' : 'icon-xs'}
          className="rounded-full! border! border-white/70! bg-black/40! text-white! shadow-md backdrop-blur-sm hover:bg-black/75!"
          aria-label="Reproducir el tráiler"
          onClick={(evento) => {
            // La tarjeta del catálogo entera es pulsable: sin esto, darle al play abría el contenido.
            evento.stopPropagation()
            setReproduciendo(true)
          }}
        >
          <HugeiconsIcon icon={PlayIcon} size={tamano === 'lg' ? 15 : 12} />
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-background absolute inset-0" onClick={(evento) => evento.stopPropagation()}>
      <iframe
        ref={marco}
        src={video.src}
        title="Tráiler del contenido"
        className="size-full border-0"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
      {/* Siempre hay salida: Drive y OneDrive no avisan de que el vídeo acabó, así que sin esta X el tráiler se
          quedaría puesto para siempre. */}
      <BotonIcono className="absolute top-2 right-2" aria-label="Cerrar el tráiler" onClick={() => setReproduciendo(false)}>
        <HugeiconsIcon icon={Cancel01Icon} size={15} />
      </BotonIcono>
    </div>
  )
}

/** La portada 16:9 con su tráiler encima: el recuadro que usan el asistente y la vista del colaborador. */
export function PortadaConTrailer({
  imagen,
  trailer,
  alt = 'Portada del contenido',
  sinImagen,
  className,
  children,
}: {
  imagen?: string
  trailer?: string
  alt?: string
  /** Qué se pinta mientras no hay portada. */
  sinImagen?: ReactNode
  className?: string
  /** Lo que va encima de la imagen: insignias, botones de la portada. */
  children?: ReactNode
}) {
  return (
    <div className={cn('bg-muted relative aspect-video w-full overflow-hidden', className)}>
      {imagen ? <img src={imagen} alt={alt} className="size-full object-cover" /> : sinImagen}
      {children}
      <CapaTrailer trailer={trailer} />
    </div>
  )
}
