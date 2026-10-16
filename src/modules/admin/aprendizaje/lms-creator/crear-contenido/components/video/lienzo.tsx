import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { cn } from '@ubits/flux-ui'
import { PLACEHOLDER_ESCENA, type CamposCanvas, type PlantillaCanvas } from './datos'
import { imagenDe, type Escena, type Proyecto } from './proyecto'
import { capasDe, fondoDe, type Capa, type FondoCanvas } from './capas'
import { LienzoCapas } from './lienzo-capas'

// El cuadro de una escena tal como sale en el video: la imagen (con su movimiento), el presentador, el clip o la
// diapositiva, los subtítulos abajo y el logo arriba a la derecha al 70 %. Se dibuja siempre a 960 × 540 y se escala
// al contenedor, así la miniatura del rail, la del borrador y la vista previa grande muestran exactamente lo mismo.

const ANCHO = 960
const ALTO = 540

/** Pinta `children` a 960 × 540 y lo escala al ancho del contenedor (16:9). */
export function Escalado({ children, className }: { children: ReactNode; className?: string }) {
  const caja = useRef<HTMLDivElement>(null)
  const [escala, setEscala] = useState(0)

  useLayoutEffect(() => {
    const nodo = caja.current
    if (!nodo) return
    const medir = () => setEscala(nodo.clientWidth / ANCHO)
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(nodo)
    return () => observador.disconnect()
  }, [])

  return (
    <div ref={caja} className={cn('relative aspect-video w-full overflow-hidden', className)}>
      <div className="absolute top-0 left-0 origin-top-left" style={{ width: ANCHO, height: ALTO, transform: `scale(${escala})` }}>
        {escala ? children : null}
      </div>
    </div>
  )
}

export type Rect = { left: number; top: number; width: number; height: number }

// ── Diapositiva de canvas ────────────────────────────────────────────────────────────────────────────────────────
//
// Desde el 14-oct se dibuja por capas (lienzo-capas.tsx), con las plantillas del editor de AI Studio: cada plantilla
// genera sus capas con las medidas de producción y el creador las mueve, escala, gira, reordena, agrega y borra. Lo
// que nadie ha tocado se sigue generando de los campos de la escena, así no se pierde nada de lo que ya estaba hecho.

type DiapositivaProps = {
  plantilla: PlantillaCanvas
  campos: CamposCanvas
  acentoId?: string
  imagen?: string
  fondo?: FondoCanvas
  /** Las capas que guardó el creador; sin ellas, las de la plantilla. */
  capasLibres?: Capa[]
  /** Editable en la vista previa: elegir, mover, escalar, borrar y escribir en el sitio. */
  editable?: boolean
  seleccion?: string | null
  onSeleccion?: (id: string | null) => void
  onCapasLibres?: (capas: Capa[]) => void
}

export function Diapositiva({ plantilla, campos, acentoId, imagen, fondo, capasLibres, editable = false, seleccion, onSeleccion, onCapasLibres }: DiapositivaProps) {
  const foto = imagen || '/images/cards-learn/portadas-ia/01-personas-en-oficina.jpg'
  const capas = capasDe({ plantilla, campos, capasLibres }, foto)
  return (
    <LienzoCapas
      capas={capas}
      fondo={fondoDe({ plantilla, fondo })}
      acentoId={acentoId}
      editable={editable}
      seleccion={seleccion}
      onSeleccion={onSeleccion}
      onCapas={onCapasLibres}
    />
  )
}

// ── Cuadro de una escena ─────────────────────────────────────────────────────────────────────────────────────────

type CuadroProps = {
  proyecto: Proyecto
  escena: Escena
  /** Segundos dentro de la escena (para el movimiento y el clip). */
  tiempo?: number
  reproduciendo?: boolean
  subtitulos?: boolean
  logo?: boolean
  editable?: boolean
  /** La capa elegida en el editor (la comparten la vista previa y Propiedades). */
  seleccion?: string | null
  onSeleccion?: (id: string | null) => void
  /** Las capas del canvas tras moverlas, escalarlas, borrarlas o escribir en ellas. */
  onCapasLibres?: (capas: Capa[]) => void
  /** Miniatura: sin textos de ayuda ni subtítulos. */
  miniatura?: boolean
}

/** Movimiento de la imagen: zoom in 1 → 1,1; zoom out 1,1 → 1; aparecer = opacidad 0 → 1 en el primer tercio. */
function movimiento(e: Escena, progreso: number): CSSProperties {
  const t = Math.min(1, Math.max(0, progreso))
  if (e.movimiento === 'zoom-in') return { transform: `scale(${1 + 0.1 * t})` }
  if (e.movimiento === 'zoom-out') return { transform: `scale(${1.1 - 0.1 * t})` }
  if (e.movimiento === 'fade-in') return { opacity: Math.min(1, t * 3) }
  return {}
}

export function CuadroEscena({ proyecto, escena, tiempo = 0, reproduciendo = false, subtitulos, logo = true, editable, seleccion, onSeleccion, onCapasLibres, miniatura }: CuadroProps) {
  const clip = useRef<HTMLVideoElement>(null)
  const progreso = escena.duracion ? tiempo / escena.duracion : 0
  // El canvas ya lleva su texto en pantalla: los subtítulos lo taparían.
  const conSubtitulos = !miniatura && (subtitulos ?? proyecto.subtitulos) && escena.guion.trim() && escena.tipo && escena.tipo !== 'canvas'

  // El clip sigue al cabezal cuando está quieto y corre solo mientras se reproduce.
  useEffect(() => {
    const v = clip.current
    if (!v) return
    if (reproduciendo) {
      void v.play().catch(() => undefined)
      return
    }
    v.pause()
    if (Number.isFinite(tiempo) && Math.abs(v.currentTime - tiempo) > 0.2) v.currentTime = Math.min(tiempo, v.duration || tiempo)
  }, [reproduciendo, tiempo])

  let fondo: ReactNode
  if (!escena.tipo) {
    fondo = <img src={PLACEHOLDER_ESCENA} alt="" className="size-full object-cover" />
  } else if (escena.tipo === 'video') {
    if (escena.clip) {
      fondo = (
        <video
          ref={clip}
          src={escena.clip.src}
          muted={!reproduciendo || (escena.videoSilenciado ?? escena.mezcla === 'voice-only')}
          playsInline
          preload="metadata"
          className="size-full bg-black object-cover"
        />
      )
    } else {
      fondo = <img src={PLACEHOLDER_ESCENA} alt="" className="size-full object-cover" />
    }
  } else if (escena.tipo === 'canvas' && escena.canvas) {
    fondo = (
      <Diapositiva
        plantilla={escena.canvas.plantilla}
        campos={escena.canvas.campos}
        acentoId={escena.canvas.acento}
        imagen={escena.imagen}
        fondo={escena.canvas.fondo}
        capasLibres={escena.canvas.capasLibres}
        editable={editable}
        seleccion={seleccion}
        onSeleccion={onSeleccion}
        onCapasLibres={onCapasLibres}
      />
    )
  } else {
    const src = imagenDe(escena, proyecto) || PLACEHOLDER_ESCENA
    fondo = <img src={src} alt="" className="size-full object-cover will-change-transform" style={movimiento(escena, progreso)} />
  }

  return (
    <div className="relative size-full overflow-hidden bg-muted">
      {fondo}
      {/* Lo que le falta a la escena (video sin cargar, avatar sin sincronizar…) lo dice la vista previa con su estado
          vacío, encima de este cuadro (ver vista-previa.tsx). */}
      {conSubtitulos ? (
        // Los subtítulos son parte del video, no de la interfaz: van como los quema el prototipo (drawSubtitles,
        // «centrado abajo»): letra blanca en negrita al 5 % del alto, contorno negro y tres capas de sombra, a 4 % de
        // los lados y 6 % del borde de abajo. Por eso no usan la tipografía del tema.
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center" style={{ padding: `${ALTO * 0.06}px ${ANCHO * 0.04}px` }}>
          <p style={SUBTITULO} className="m-0 max-w-[92%] text-center">
            {escena.guion}
          </p>
        </div>
      ) : null}
      {logo && proyecto.logo ? (
        <img src={proyecto.logo} alt="" className="pointer-events-none absolute top-[3.5%] right-[3.5%] h-[9%] w-auto object-contain opacity-70" />
      ) : null}
    </div>
  )
}

const SUBTITULO = {
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: ALTO * 0.05,
  fontWeight: 700,
  lineHeight: 1.35,
  color: 'white',
  WebkitTextStroke: `${ALTO * 0.003}px black`,
  paintOrder: 'stroke fill',
  // Las tres sombras del prototipo (negro al 100, 95 y 85 %); con `black` para no escribir colores a mano.
  textShadow: '0 1px 2px black, 0 2px 8px black, 0 4px 16px black',
} as const

/** Miniatura 16:9 de una escena (rail, borrador, inspector, transiciones). */
export function MiniaturaEscena({ proyecto, escena, className }: { proyecto: Proyecto; escena: Escena; className?: string }) {
  return (
    <Escalado className={cn('rounded-md bg-muted', className)}>
      <CuadroEscena proyecto={proyecto} escena={escena} miniatura />
    </Escalado>
  )
}
