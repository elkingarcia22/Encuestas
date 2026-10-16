import { useCallback, useEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowHorizontalIcon,
  Download04Icon,
  RefreshIcon,
} from '@hugeicons/core-free-icons'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Text,
  cn,
} from '@ubits/flux-ui'
import { Hint } from '@/shared/components/Hint'
import { BotonPantallaCompleta, usePantallaCompleta } from './ranura-recurso'

// El visor de PDF del LXP, tal como está en producción (revisado el 28-sep-2026 en lxp.ubitslearning.com): PDF.js de
// Mozilla —`pdfjs-dist`, la misma versión 6.1.200— pintando cada hoja en su propio `<canvas>`, con scroll continuo y una
// barra arriba: paginador, zoom, ajustar al ancho, recargar, descargar e imprimir.
//
// **Por qué este visor y no un `<iframe>`:** lo pidieron los clientes. En Creator se elige si los colaboradores pueden
// descargar el contenido o no, y este fue el único visor que dejó esconder el botón de descarga según esa decisión —el
// visor propio del navegador siempre trae el suyo. De ahí que `permitirDescarga` mande sobre la barra y no sobre el
// archivo.
//
// Lo que producción todavía no monta es la capa de texto de PDF.js: el PDF se ve como imagen, no se puede seleccionar,
// copiar ni buscar, y un lector de pantalla no lee nada. Se replica igual para que la maqueta diga la verdad; es lo
// primero que se puede mejorar (`textLayer` es una opción de la propia librería).

// PDF.js se trae de unpkg, igual que producción y en la misma versión, en vez de instalarlo como dependencia:
// `package.json` es andamiaje del proyecto y el check pide hablar con ingeniería antes de tocarlo. El día que se quiera
// empaquetado, son estas dos líneas: `npm i pdfjs-dist@6.1.200` y apuntar el import y el worker al paquete.
const VERSION_PDFJS = '6.1.200'
const LIBRERIA = `https://unpkg.com/pdfjs-dist@${VERSION_PDFJS}/build/pdf.min.mjs`
const WORKER = `https://unpkg.com/pdfjs-dist@${VERSION_PDFJS}/build/pdf.worker.min.mjs`

const ZOOM_MIN = 0.5
const ZOOM_MAX = 3
/** Se pinta al doble para que no se vea borroso en pantallas Retina, como en producción. */
const DENSIDAD = 2

type Hoja = { numero: number; ancho: number; alto: number }

export function VisorPdf({
  src,
  archivo,
  permitirDescarga = true,
  compacto = false,
  className,
}: {
  src: string
  /** El nombre con el que se descarga. */
  archivo?: string
  /** Lo que se eligió en Creator. En falso, la barra no ofrece descargar ni imprimir. */
  permitirDescarga?: boolean
  /** Dentro de la ventanita del móvil: la barra va a solo iconos. */
  compacto?: boolean
  className?: string
}) {
  const marco = useRef<HTMLDivElement>(null)
  const contenedor = useRef<HTMLDivElement>(null)
  const lienzos = useRef(new Map<number, HTMLCanvasElement>())
  // Lo que se está pintando ahora mismo, por hoja. PDF.js no deja dos `render()` sobre el mismo lienzo: si se
  // solapan, la hoja sale corrupta —se vio volteada al cambiar de ancho, porque el reajuste automático dispara
  // varios repintados seguidos—. Antes de repintar una hoja se cancela el suyo (Dave, 2-oct).
  const pintando = useRef(new Map<number, TareaPdf>())
  const documento = useRef<PdfDoc | null>(null)
  const [hojas, setHojas] = useState<Hoja[]>([])
  const [actual, setActual] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando')
  const [intento, setIntento] = useState(0)
  const { activa: pantallaCompleta, alternar: alternarPantallaCompleta } = usePantallaCompleta(marco)
  // Si quien lo está leyendo ya eligió un zoom. Hasta que lo haga, el visor se mantiene ajustado al ancho; después
  // manda lo suyo y no se le vuelve a mover.
  const zoomElegido = useRef(false)

  // ── Cargar el documento ───────────────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let vivo = true
    setEstado('cargando')
    setHojas([])
    documento.current = null
    zoomElegido.current = false

    const abrir = async () => {
      try {
        const pdfjs = (await import(/* @vite-ignore */ LIBRERIA)) as unknown as PdfJs
        pdfjs.GlobalWorkerOptions.workerSrc = WORKER
        const doc = await pdfjs.getDocument({ url: src }).promise
        if (!vivo) return
        documento.current = doc
        const medidas: Hoja[] = []
        for (let n = 1; n <= doc.numPages; n += 1) {
          const hoja = await doc.getPage(n)
          const vista = hoja.getViewport({ scale: 1 })
          medidas.push({ numero: n, ancho: vista.width, alto: vista.height })
        }
        if (!vivo) return
        setHojas(medidas)
        setActual(1)
        setEstado('listo')
      } catch {
        if (vivo) setEstado('error')
      }
    }
    void abrir()
    return () => {
      vivo = false
    }
  }, [src, intento])

  // ── Pintar cada hoja en su lienzo ─────────────────────────────────────────────────────────────────────────────
  const pintar = useCallback(async () => {
    const doc = documento.current
    if (!doc) return
    for (const { numero } of hojas) {
      const lienzo = lienzos.current.get(numero)
      if (!lienzo) continue
      // Si esta hoja se estaba pintando con el zoom anterior, se corta: lo que vale es el de ahora.
      pintando.current.get(numero)?.cancel()
      const hoja = await doc.getPage(numero)
      const vista = hoja.getViewport({ scale: zoom * DENSIDAD })
      lienzo.width = vista.width
      lienzo.height = vista.height
      lienzo.style.width = `${vista.width / DENSIDAD}px`
      lienzo.style.height = `${vista.height / DENSIDAD}px`
      const contexto = lienzo.getContext('2d')
      if (!contexto) continue
      const tarea = hoja.render({ canvas: lienzo, canvasContext: contexto, viewport: vista })
      pintando.current.set(numero, tarea)
      try {
        await tarea.promise
      } catch {
        // Cancelada porque llegó un zoom nuevo: la pinta la vuelta siguiente.
      }
      if (pintando.current.get(numero) === tarea) pintando.current.delete(numero)
    }
  }, [hojas, zoom])

  useEffect(() => {
    void pintar()
  }, [pintar])

  // ── Qué hoja se está viendo ───────────────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const caja = contenedor.current
    if (!caja || !hojas.length) return
    const mirar = () => {
      const centro = caja.scrollTop + caja.clientHeight / 2
      let vista = 1
      for (const { numero } of hojas) {
        const lienzo = lienzos.current.get(numero)
        if (lienzo && lienzo.offsetTop <= centro) vista = numero
      }
      setActual(vista)
    }
    caja.addEventListener('scroll', mirar, { passive: true })
    return () => caja.removeEventListener('scroll', mirar)
  }, [hojas])

  const irA = (numero: number) => {
    const destino = Math.min(Math.max(numero, 1), hojas.length)
    lienzos.current.get(destino)?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }

  /** Ajustar al ancho: el zoom con el que la hoja más ancha llena el contenedor. */
  const ajustarAlAncho = useCallback(() => {
    const caja = contenedor.current
    const primera = hojas[0]
    if (!caja || !primera) return
    // 48 px de aire a los lados, los mismos del `padding` del escenario.
    setZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, (caja.clientWidth - 48) / primera.ancho)))
  }, [hojas])

  /** Lo que hacen los controles: además de mover el zoom, dejan de ajustar solo. */
  const elegirZoom = useCallback((valor: number | ((z: number) => number)) => {
    zoomElegido.current = true
    setZoom(valor)
  }, [])

  // Al abrir, el documento entra **ajustado al ancho**, no al 100 %: en un panel estrecho el 100 % dejaba la hoja
  // cortada y lo primero que había que hacer era alejarla a mano (Dave, 2-oct).
  //
  // Va con un observador y no con un solo cálculo al cargar porque el visor vive en un panel que todavía se está
  // acomodando: medido demasiado pronto, el contenedor daba 230 px y el ajuste salía al mínimo. Mientras nadie toque
  // el zoom, se recalcula con cada cambio de ancho; al primer clic en los controles, deja de hacerlo.
  useEffect(() => {
    const caja = contenedor.current
    if (!caja || !hojas.length) return
    ajustarAlAncho()
    const observador = new ResizeObserver(() => {
      if (!zoomElegido.current) ajustarAlAncho()
    })
    observador.observe(caja)
    return () => observador.disconnect()
  }, [hojas, ajustarAlAncho])

  const descargar = () => {
    const enlace = document.createElement('a')
    enlace.href = src
    enlace.download = archivo ?? 'documento.pdf'
    enlace.click()
  }

  /**
   * Pantalla completa sobre el visor entero: los controles y el documento se van juntos.
   *
   * El navegador solo la concede con un gesto de verdad y puede negarla (un iframe sin permiso, un móvil que no la
   * admite). Si la niega, se dice en vez de dejar un botón que no hace nada.
   */
  /** Los saltos del desplegable de zoom, en el orden en que se leen. */
  const PASOS = [0.5, 0.75, 1, 1.5, 2]

  return (
    <div ref={marco} className={cn('relative flex flex-col overflow-hidden rounded-lg border bg-card', pantallaCompleta && 'rounded-none!', className)}>
      {/* Los controles **flotan sobre el documento**, sin barra ni fondo: la franja blanca de antes le robaba alto al
          PDF y partía el visor en dos. El contenedor no intercepta el cursor —así se puede hacer scroll por los huecos
          entre pastillas— y cada grupo sí (Dave, 2-oct).
          Cada control va en su **pastilla**, y los que tienen más de un valor —la página y el zoom— se abren en un
          menú en vez de obligar a pulsar muchas veces: de 100 % a 200 % eran cuatro clics (Dave, 2-oct).
          La pastilla con superficie es la del botón del agente: `outline` redondeado, no una pieza nueva. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-wrap items-center justify-between gap-2 p-3">
        <div className="pointer-events-auto flex items-center gap-1">
          <Hint label="Página anterior">
            <Button variant="outline" size="icon-sm" className="rounded-full!" aria-label="Página anterior" disabled={actual <= 1} onClick={() => irA(actual - 1)}>
              <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
            </Button>
          </Hint>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="outline" size="sm" className="rounded-full! px-3!" aria-label={`Página ${actual} de ${hojas.length || 1}. Ir a otra página`} />}
            >
              <span className="tabular-nums">
                {actual} / {hojas.length || 1}
              </span>
              <HugeiconsIcon icon={ArrowDown01Icon} size={14} aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-72 overflow-auto">
              <DropdownMenuRadioGroup value={String(actual)} onValueChange={(valor) => irA(Number(valor))}>
                {(hojas.length ? hojas : [{ numero: 1 }]).map(({ numero }) => (
                  <DropdownMenuRadioItem key={numero} value={String(numero)}>
                    Página {numero}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Hint label="Página siguiente">
            <Button
              variant="outline"
              size="icon-sm"
              className="rounded-full!"
              aria-label="Página siguiente"
              disabled={actual >= hojas.length}
              onClick={() => irA(actual + 1)}
            >
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            </Button>
          </Hint>
        </div>

        {/* El zoom se elige en el desplegable y ya: los botones de − y + sumaban dos pastillas a una fila que en
            móvil no cabía, y con el menú se llega a cualquier valor en un gesto (Dave, 2-oct). */}
        <div className="pointer-events-auto flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="rounded-full! px-3!" aria-label={`Zoom al ${Math.round(zoom * 100)} %. Cambiar`} />}>
              <span className="tabular-nums">{Math.round(zoom * 100)} %</span>
              <HugeiconsIcon icon={ArrowDown01Icon} size={14} aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuRadioGroup value={String(zoom)} onValueChange={(valor) => elegirZoom(Number(valor))}>
                {PASOS.map((paso) => (
                  <DropdownMenuRadioItem key={paso} value={String(paso)}>
                    {Math.round(paso * 100)} %
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              {/* No es «ajustar a la pantalla»: solo toca el ancho, porque el alto lo resuelve el scroll. */}
              <DropdownMenuItem onClick={ajustarAlAncho}>
                <HugeiconsIcon icon={ArrowHorizontalIcon} size={16} aria-hidden="true" />
                Ajustar al ancho
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="pointer-events-auto flex items-center gap-1">
          {/* Lo que se eligió en Creator: sin permiso de descarga, la barra no ofrece ni descargar ni imprimir
              —imprimir es descargar por otra puerta. */}
          {permitirDescarga ? (
            <>
              <Hint label="Descargar">
                <Button variant="outline" size="icon-sm" className="rounded-full!" aria-label="Descargar el documento" onClick={descargar}>
                  <HugeiconsIcon icon={Download04Icon} size={16} />
                </Button>
              </Hint>
            </>
          ) : null}
          {/* Pantalla completa, que es lo que de verdad se pide en un PDF largo: leerlo sin el panel alrededor. Va
              siempre, con o sin permiso de descarga, porque no saca el archivo de la plataforma (Dave, 2-oct).
              Es el único control que **no** es del documento: paginar, el zoom y descargar se usan mientras se lee y
              se quedan pegados a la hoja, pero «ver esto sin el panel alrededor» es lo mismo que pide un SCORM o una
              presentación. Por eso usa la pieza común y sube a la cabecera gris cuando el contenedor la ofrece
              (Dave, 9-oct). */}
          <BotonPantallaCompleta activa={pantallaCompleta} onAlternar={alternarPantallaCompleta} compacto={compacto} posicionSuelta="" />
        </div>
      </div>

      {/* El escenario: las hojas una debajo de otra, con scroll propio. Arriba lleva el alto de los controles para que
          la primera hoja no arranque debajo de ellos. */}
      <div ref={contenedor} className="min-h-0 flex-1 overflow-auto bg-muted p-6 pt-16" aria-busy={estado === 'cargando'}>
        {estado === 'error' ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <Text as="p" variant="muted" size="sm">
              No se pudo abrir el documento.
            </Text>
            {/* El botón de volver a cargar vive aquí y no en los controles: es lo único que se puede hacer cuando
                falla, y arriba ocupaba sitio en las veces —casi todas— en que no hace falta. */}
            <Button variant="outline" size="sm" onClick={() => setIntento((i) => i + 1)}>
              <HugeiconsIcon icon={RefreshIcon} size={16} aria-hidden="true" />
              Volver a cargar
            </Button>
          </div>
        ) : (
          // `min-w-max` para que al acercar, las hojas crezcan de verdad y el escenario haga scroll horizontal. Con un
          // ancho tope se estiraban solo de alto y el PDF salía deformado.
          <div className="mx-auto flex min-w-max flex-col items-center gap-4">
            {(hojas.length ? hojas : [{ numero: 1, ancho: 0, alto: 0 }]).map(({ numero }) => (
              <canvas
                key={numero}
                ref={(nodo) => {
                  if (nodo) lienzos.current.set(numero, nodo)
                  else lienzos.current.delete(numero)
                }}
                aria-label={`Página ${numero}`}
                className="rounded-sm bg-card shadow-sm"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* Lo mínimo que usamos de PDF.js. Como llega por la red no trae sus tipos, así que se declara lo que se toca. */
type PdfJs = {
  GlobalWorkerOptions: { workerSrc: string }
  getDocument: (opciones: { url: string }) => { promise: Promise<PdfDoc> }
}

type TareaPdf = { promise: Promise<void>; cancel: () => void }

type PdfDoc = {
  numPages: number
  getPage: (numero: number) => Promise<{
    getViewport: (opciones: { scale: number }) => { width: number; height: number }
    render: (opciones: { canvas: HTMLCanvasElement; canvasContext: CanvasRenderingContext2D; viewport: unknown }) => TareaPdf
  }>
}
