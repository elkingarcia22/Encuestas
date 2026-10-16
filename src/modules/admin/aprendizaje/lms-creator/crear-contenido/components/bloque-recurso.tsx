import { createContext, useContext, useRef, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Edit02Icon, RefreshIcon } from '@hugeicons/core-free-icons'
import { AspectRatio, Button, Field, FieldLabel, Frame, FramePanel, Switch, cn } from '@ubits/flux-ui'
import { AiThinking } from '@/shared/components/AiThinking'
import type { Pagina, Recurso } from './borrador'
import { TextoEnriquecido } from './editor-texto'
import { InsigniaIA } from './marco-inmersivo'
import { embedDeVideo } from './ficha'
import { VisorPdf } from './visor-pdf'
import { BotonPantallaCompleta, usePantallaCompleta } from './ranura-recurso'

// El recurso principal ya montado en la página, en modo lectura, con sus acciones debajo: «Reemplazar» abre el mismo
// flujo del tipo (no el selector) y «Editar» reabre el editor (texto, asistencia, video con IA, presentación, roleplay).

export type AccionesBloque = {
  onEditar?: () => void
  etiquetaEditar?: string
  onReemplazar?: () => void
}

/** ¿Es un archivo de video que el navegador reproduce solo? (si no, es un enlace para iframe). */
const esArchivoVideo = (src: string) => /^(blob:|data:video)|\.(mp4|webm|ogg)(\?|$)|^\/videos\//i.test(src)

export function Superficie({ children, acciones, extra }: { children: ReactNode; acciones?: AccionesBloque; extra?: ReactNode }) {
  const botones = acciones && (acciones.onEditar || acciones.onReemplazar)
  return (
    <Frame className="overflow-hidden">
      <FramePanel className="overflow-hidden p-0!">
      <div className="p-4 sm:p-6">{children}</div>
      {extra}
      {botones ? (
        <div className="flex flex-wrap justify-end gap-2 border-t px-4 py-3 sm:px-6">
          {acciones.onEditar ? (
            <Button variant="outline" size="sm" onClick={acciones.onEditar}>
              <HugeiconsIcon icon={Edit02Icon} size={14} />
              {acciones.etiquetaEditar ?? 'Editar'}
            </Button>
          ) : null}
          {acciones.onReemplazar ? (
            <Button variant="outline" size="sm" onClick={acciones.onReemplazar}>
              <HugeiconsIcon icon={RefreshIcon} size={14} />
              Reemplazar
            </Button>
          ) : null}
        </div>
      ) : null}
      </FramePanel>
    </Frame>
  )
}

/**
 * Cómo se está pintando el recurso.
 *
 * - `colaborador`: lo está viendo quien estudia, no quien crea. **No lleva la marca «Generado con IA»**: al
 *   colaborador no le importa —ni le aporta— cómo se fabricó el material; esa insignia es para el Creator
 *   (Dave, 6-oct).
 * - `compacto`: va dentro de la ventanita del móvil, donde los altos mínimos pensados para una pantalla de
 *   escritorio dejan cajas enormes.
 */
export type ModoVista = { colaborador?: boolean; compacto?: boolean }

const ContextoVista = createContext<ModoVista>({})

export function VistaDeRecurso({ modo, children }: { modo: ModoVista; children: ReactNode }) {
  return <ContextoVista.Provider value={modo}>{children}</ContextoVista.Provider>
}

export function useModoVista() {
  return useContext(ContextoVista)
}

/**
 * Marco 16:10 con la marca de IA, para SCORM, presentación y embebido. Sobre un video la marca va encima, en la esquina;
 * con `insigniaFuera` (un HTML que trae su propia cabecera, como un SCORM) va arriba del marco para no tapar su título.
 */
function Marco({
  recurso,
  children,
  proporcion = 16 / 10,
  insigniaFuera = false,
  altoComodo = false,
  conPantallaCompleta = false,
}: {
  recurso: Recurso
  children: ReactNode
  proporcion?: number
  insigniaFuera?: boolean
  /** Alto generoso en vez de la proporción fija: para lo que trae su propia pantalla dentro, como un SCORM. */
  altoComodo?: boolean
  /** Añade el botón que lleva el recurso a pantalla completa, flotando sobre su esquina. */
  conPantallaCompleta?: boolean
}) {
  // Para quien estudia, el recurso no lleva marca de IA: ver `ModoVista`.
  const { colaborador, compacto } = useModoVista()
  const conMarca = recurso.generadoConIA && !colaborador
  const caja = useRef<HTMLDivElement>(null)
  const { activa: enPantallaCompleta, alternar: alternarPantallaCompleta } = usePantallaCompleta(caja)
  // Dentro del teléfono no hay sitio para el alto cómodo: ahí vuelve a mandar la proporción.
  const aAlto = altoComodo && !compacto
  // **El alto no se le puede preguntar al recurso.** Un paquete se estira al alto que le den (`min-height: 100%`,
  // `100vh`), así que medirlo mientras ocupa la caja devuelve siempre «un poco más que la caja», y medirlo con la caja
  // colapsada devuelve casi nada; y si viene de otro dominio el navegador ni siquiera deja mirarlo. Por eso: alto
  // cómodo fijo, y para verlo de verdad, el botón de pantalla completa (Dave, 6-oct).
  // Sin esquina ni borde propios: el recurso va a sangre dentro de su tarjeta, que ya recorta y ya tiene su borde.
  // Con los suyos quedaba una caja redondeada dentro de otra y se veía raro (Dave, 6-oct).
  const marco = (
    <div ref={caja} className="relative overflow-hidden bg-muted">
      {aAlto ? (
        <div className={cn('w-full', enPantallaCompleta ? 'h-screen' : 'h-[min(72vh,760px)]')}>{children}</div>
      ) : (
        <AspectRatio ratio={proporcion}>{children}</AspectRatio>
      )}
      {conMarca && !insigniaFuera ? <InsigniaIA className="absolute top-3 left-3" /> : null}
      {conPantallaCompleta ? (
        /* Lo que de verdad se pide en un recurso que trae su propia pantalla dentro es verlo sin el panel alrededor. El
           alto real del paquete no se puede leer —corre en un iframe de otro dominio y el navegador no deja medirlo—,
           así que la salida es esta (Dave, 6-oct). Dónde aparece el botón lo decide el contenedor: ver
           `ranura-recurso`. */
        <BotonPantallaCompleta activa={enPantallaCompleta} onAlternar={alternarPantallaCompleta} compacto={compacto} />
      ) : null}
    </div>
  )
  if (!conMarca || !insigniaFuera) return marco
  return (
    <div className="flex flex-col items-start gap-2">
      <InsigniaIA />
      <div className="w-full">{marco}</div>
    </div>
  )
}

export function VistaVideo({ recurso }: { recurso: Recurso }) {
  const src = recurso.src ?? ''
  return (
    <Marco recurso={recurso} proporcion={16 / 9}>
      {esArchivoVideo(src) ? (
        <video src={src} controls playsInline className="size-full bg-foreground object-contain" aria-label="Video de la página" />
      ) : (
        <iframe
          src={embedDeVideo(src)?.replace('?autoplay=1', '') ?? src}
          title="Video de la página"
          className="size-full border-0"
          allow="encrypted-media; picture-in-picture"
          allowFullScreen
        />
      )}
    </Marco>
  )
}

/** Sin `onDescarga` no se muestra el interruptor (el editor lo pone en la barra del recurso). */
export function VistaPdf({ recurso, onDescarga }: { recurso: Recurso; onDescarga?: (permitir: boolean) => void }) {
  const { compacto } = useModoVista()
  return (
    <div className="flex flex-col gap-4">
      {/* Sin esquina ni borde propios: la tarjeta que lo contiene ya recorta y ya tiene su borde (Dave, 6-oct). */}
      <VisorPdf
        src={recurso.src ?? ''}
        archivo={recurso.archivo}
        permitirDescarga={recurso.permitirDescarga !== false}
        compacto={compacto}
        className="h-[min(72vh,760px)] rounded-none! border-0"
      />
      {onDescarga ? (
        <Field orientation="horizontal" className="justify-between px-4 pb-4">
          <FieldLabel htmlFor="cc-pdf-descarga">Permitir descarga del PDF a los colaboradores</FieldLabel>
          <Switch id="cc-pdf-descarga" checked={recurso.permitirDescarga !== false} onCheckedChange={onDescarga} />
        </Field>
      ) : null}
    </div>
  )
}

export function VistaScorm({ recurso }: { recurso: Recurso }) {
  return (
    <Marco recurso={recurso} insigniaFuera altoComodo conPantallaCompleta>
      <iframe src={recurso.src} title="Presentación" className="size-full border-0 bg-background" allowFullScreen />
    </Marco>
  )
}

export function VistaEmbebido({ recurso }: { recurso: Recurso }) {
  return (
    // Con pantalla completa y alto cómodo, como el SCORM: lo de dentro es una página entera de otro sitio y en una
    // caja 16:10 se lee apretada. Antes era el único recurso de pantalla que no la ofrecía (Dave, 9-oct).
    <Marco recurso={recurso} insigniaFuera altoComodo conPantallaCompleta>
      <iframe src={recurso.src} title="Contenido embebido" className="size-full border-0 bg-background" allowFullScreen />
    </Marco>
  )
}

export function VistaTexto({ recurso }: { recurso: Recurso }) {
  return <TextoEnriquecido html={recurso.html ?? ''} />
}

/** Mientras la IA genera la presentación: el loader en el lugar del recurso. */
export function CargandoPresentacion({ progreso }: { progreso?: number }) {
  return (
    <div className="flex aspect-[16/10] w-full items-center justify-center bg-muted" aria-busy="true">
      <AiThinking label="Generando presentación" size="md" progreso={progreso} />
    </div>
  )
}

export const tituloPagina = (p: Pagina) => p.titulo
