import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent as EventoTecla, type PointerEvent as EventoPuntero, type ReactNode } from 'react'
import { Text, cn } from '@ubits/flux-ui'
import { notifyAction } from '@/shared/components/notify'
import { esColorLibre } from '../color-libre'
import { NOMBRE_CAPA, ajustarCaja, mezclar, type Caja, type Capa, type EstiloTexto, type FondoCanvas, type RellenoForma } from './capas'

// El canvas dibujado por capas, como en el editor de AI Studio (el jefe de Dave, 14-oct): un fondo y, encima, cada capa
// en su caja (% del lienzo) con su rotación. Editable, la vista previa deja **elegir** una capa con un clic,
// **moverla** arrastrándola, **escalarla** desde las esquinas (en proporción) o los lados (un solo eje), **moverla con
// las flechas** (Mayús para pasos largos) y **borrarla** con Supr (con «Deshacer»). Doble clic en un texto lo escribe en
// el sitio: Intro o clic afuera lo guardan, Escape lo descarta.
//
// Todo se mide en `cqw` (porcentaje del ancho del lienzo) para que se vea igual en la miniatura, la vista previa y el
// video. Los tamaños son los de producción sobre su lienzo de 1920 px, y los textos **se achican solos** si no caben en
// su caja (hasta el 55 %): una línea de más ya no se monta sobre la pieza de abajo.
//
// Los colores salen del acento de la escena —un token del tema o el hex que eligió el creador— por una variable CSS
// (`--acento`), mezclado con blanco y negro. Así un canvas oscuro es el acento muy oscurecido y no un azul fijo.

const ESTILO_TEXTO: Record<EstiloTexto, { tam: number } & CSSProperties> = {
  // Producción lo pone en mayúsculas sostenidas; aquí no (regla de Dave): se marca con peso y un poco de aire.
  antetitulo: { tam: 1.4, fontWeight: 700, letterSpacing: '0.04em', lineHeight: 1.3 },
  titulo: { tam: 3.75, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.05 },
  subtitulo: { tam: 1.9, fontWeight: 600, lineHeight: 1.25 },
  cuerpo: { tam: 1.5, fontWeight: 400, lineHeight: 1.5 },
  afirmacion: { tam: 3.35, fontWeight: 700, lineHeight: 1.2 },
}

/** El acento como valor CSS: el hex elegido o la variable del token del tema. */
const valorAcento = (acentoId: string | undefined) => (acentoId && esColorLibre(acentoId) ? acentoId : `var(--color-${acentoId || 'primary'})`)

/**
 * Las variables de color de la escena: el acento, el acento **como texto sobre blanco** (un acento claro, como el amarillo,
 * se oscurece hasta leerse; antes los títulos de columna o el antetítulo quedaban amarillos sobre blanco) y el texto que
 * va **encima** del acento (negro sobre un acento claro, blanco sobre uno oscuro). Los tokens de la marca son oscuros.
 */
function variablesAcento(acentoId: string | undefined) {
  const acento = valorAcento(acentoId)
  if (!acentoId || !esColorLibre(acentoId) || claridad(acentoId) < 0.62) return { '--acento': acento, '--acento-texto': acento, '--acento-frente': 'white' }
  return { '--acento': acento, '--acento-texto': `${'#'}${mezclar(acentoId, '000000', 0.55)}`, '--acento-frente': 'black' }
}

/** Claridad percibida de un hex (0 oscuro, 1 claro). */
function claridad(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  return 0.299 * r + 0.587 * g + 0.114 * b
}

/**
 * ¿Va texto claro encima? En el fondo claro, no; en el oscuro y el degradado, sí. Sobre el color de acento depende del
 * acento: con un amarillo, el texto blanco no se leía. Los tokens de la marca son todos oscuros.
 */
function textoClaro(fondo: FondoCanvas, acentoId: string | undefined) {
  if (fondo === 'claro') return false
  if (fondo === 'acento' && acentoId && esColorLibre(acentoId)) return claridad(acentoId) < 0.62
  return true
}

/** El color de un texto según su estilo y el fondo: el acento en antetítulos y subtítulos sobre claro; blanco o casi negro en lo demás. */
function claseTexto(estilo: EstiloTexto, oscuro: boolean) {
  if (estilo === 'antetitulo') return oscuro ? 'text-white/75' : 'text-(--acento-texto)'
  // El subtítulo lleva el acento sobre claro: así los títulos de columna se distinguen del cuerpo.
  if (estilo === 'subtitulo') return oscuro ? 'text-white/90' : 'text-(--acento-texto)'
  if (estilo === 'cuerpo') return oscuro ? 'text-white/80' : 'text-black/70'
  return oscuro ? 'text-white' : 'text-black/90'
}

/** Un tamaño en cqw por el factor de ajuste. */
const tam = (cqw: number, f: number) => `${(cqw * f).toFixed(3)}cqw`

/**
 * Achica el contenido hasta que quepa en su caja: prueba de a 5 % hasta el 55 %. Vuelve a medir cuando cambia el
 * contenido o la caja. Devuelve el factor (1 = su tamaño) y la referencia del contenedor que se mide.
 */
function useAjuste(clave: string) {
  const ref = useRef<HTMLDivElement>(null)
  const [factor, setFactor] = useState(1)
  useLayoutEffect(() => setFactor(1), [clave])
  useLayoutEffect(() => {
    const nodo = ref.current
    if (!nodo) return
    if (nodo.scrollHeight > nodo.clientHeight + 1 && factor > 0.55) setFactor((f) => Math.max(0.55, Math.round((f - 0.05) * 100) / 100))
  })
  return { ref, factor }
}

/** Un relleno: una o dos capas de color (el acento con blanco o negro encima). */
function Relleno({ relleno, color, sobreClaro, className }: { relleno: RellenoForma; color?: string; sobreClaro: boolean; className?: string }) {
  // Una forma blanca sobre el fondo claro desaparecía: ahí lleva un filo.
  const filo = sobreClaro && (relleno === 'blanco' || relleno === 'tinte') && !color ? 'ring-1 ring-black/10' : null
  if (color) return <span aria-hidden="true" className={cn('absolute inset-0', className)} style={{ backgroundColor: color }} />
  return (
    <span aria-hidden="true" className={cn('absolute inset-0 overflow-hidden', className, filo, relleno === 'blanco' || relleno === 'tinte' ? 'bg-white' : 'bg-(--acento)')}>
      {relleno === 'oscuro' ? <span className="absolute inset-0 bg-black/80" /> : null}
      {relleno === 'tinte' ? <span className="absolute inset-0 bg-(--acento)/20" /> : null}
    </span>
  )
}

function Fondo({ fondo }: { fondo: FondoCanvas }) {
  if (fondo === 'claro') return <span aria-hidden="true" className="absolute inset-0 bg-white" />
  return (
    <span aria-hidden="true" className="absolute inset-0 bg-(--acento)">
      {fondo === 'oscuro' ? <span className="absolute inset-0 bg-black/85" /> : null}
      {fondo === 'degradado' ? <span className="absolute inset-0 bg-linear-to-br from-black/10 via-black/30 to-black/70" /> : null}
    </span>
  )
}

/** El texto escrito en el sitio: se guarda al salir o con Intro; Escape lo descarta. */
function TextoEditable({ capa, estiloBase, clase, onTexto, onTerminar }: { capa: Capa; estiloBase: CSSProperties; clase: string; onTexto: (t: string) => void; onTerminar: () => void }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const cancelado = useRef(false)
  useEffect(() => {
    const nodo = ref.current
    if (!nodo) return
    nodo.focus()
    // El cursor al final del texto.
    const rango = document.createRange()
    rango.selectNodeContents(nodo)
    rango.collapse(false)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(rango)
  }, [])
  return (
    <p
      ref={ref}
      data-escribiendo
      className={cn('m-0 size-full cursor-text whitespace-pre-line outline-none', clase)}
      style={estiloBase}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          cancelado.current = true
          e.currentTarget.blur()
        }
        // Intro guarda; Mayús + Intro hace un salto de línea.
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          e.currentTarget.blur()
        }
      }}
      onBlur={(e) => {
        if (!cancelado.current) onTexto(e.currentTarget.innerText.trim())
        onTerminar()
      }}
    >
      {capa.texto}
    </p>
  )
}

/** Lo de dentro de una capa, según su tipo. */
function ContenidoCapa({
  capa,
  oscuro,
  sobreClaro,
  escribiendo,
  onTexto,
  onTerminar,
}: {
  capa: Capa
  oscuro: boolean
  sobreClaro: boolean
  escribiendo: boolean
  onTexto: (texto: string) => void
  onTerminar: () => void
}) {
  const clave = JSON.stringify([capa.texto, capa.items, capa.cita, capa.autor, capa.agenda, capa.valor, capa.etiqueta, capa.estilo, capa.caja.w, capa.caja.h])
  const { ref, factor } = useAjuste(clave)
  const colorPropio = capa.color ? { color: capa.color } : undefined
  const caja = (hijos: ReactNode) => (
    <div ref={ref} className="size-full overflow-hidden">
      {hijos}
    </div>
  )

  switch (capa.tipo) {
    case 'texto': {
      const estilo = capa.estilo ?? 'cuerpo'
      const { tam: t, ...resto } = ESTILO_TEXTO[estilo]
      const alinear = capa.alinear ?? (estilo === 'afirmacion' ? 'centro' : 'izquierda')
      const estiloBase: CSSProperties = { ...resto, fontSize: tam(t, factor), textAlign: alinear === 'centro' ? 'center' : 'left', ...colorPropio }
      if (escribiendo) return <TextoEditable capa={capa} estiloBase={estiloBase} clase={claseTexto(estilo, oscuro)} onTexto={onTexto} onTerminar={onTerminar} />
      return caja(
        <p className={cn('m-0 whitespace-pre-line', claseTexto(estilo, oscuro))} style={estiloBase}>
          {capa.texto}
        </p>,
      )
    }
    case 'imagen':
      // Encuadre un poco arriba del centro: en las franjas bajas de la cita o la columna, el centro cortaba las cabezas.
      return capa.src ? (
        <img src={capa.src} alt="" draggable={false} className="size-full rounded-[1.6cqw] object-cover object-[center_30%] shadow-xl" />
      ) : (
        <span className="block size-full rounded-[1.6cqw] bg-black/10" />
      )
    case 'forma':
      return <Relleno relleno={capa.relleno ?? 'acento'} color={capa.color} sobreClaro={sobreClaro} className="rounded-[2.5cqw] shadow-lg" />
    case 'badge':
      return caja(
        // Oscuro y translúcido sobre la foto, como en producción (Dave, 14-oct): antes era una tarjeta blanca.
        <span className="flex h-full flex-col justify-center rounded-[0.8cqw] bg-black/65 backdrop-blur-sm" style={{ padding: '1.2cqw 1.6cqw', gap: '0.3cqw' }}>
          <span className="text-white" style={{ fontSize: tam(1.6, factor), fontWeight: 700, lineHeight: 1.2, ...colorPropio }}>
            {capa.titulo}
          </span>
          <span className="text-white/75" style={{ fontSize: tam(1.15, factor), lineHeight: 1.35 }}>
            {capa.subtitulo}
          </span>
        </span>,
      )
    case 'lista':
      return caja(
        <ol className="m-0 flex list-none flex-col p-0" style={{ gap: tam(1.4, factor) }}>
          {(capa.items ?? []).map((item, i) => (
            <li key={i} className="flex items-center" style={{ gap: tam(1.2, factor) }}>
              <span className="flex shrink-0 items-center justify-center rounded-full bg-(--acento) text-(--acento-frente)" style={{ width: tam(3, factor), height: tam(3, factor), fontSize: tam(1.4, factor), fontWeight: 700 }}>
                {i + 1}
              </span>
              <span className={oscuro ? 'text-white/90' : 'text-black/80'} style={{ fontSize: tam(1.7, factor), fontWeight: 500, lineHeight: 1.3, ...colorPropio }}>
                {item}
              </span>
            </li>
          ))}
        </ol>,
      )
    case 'dato':
      return caja(
        <span className="flex h-full flex-col justify-center" style={{ gap: '0.6cqw' }}>
          <span className={oscuro ? 'text-white' : 'text-(--acento-texto)'} style={{ fontSize: tam(9, factor), fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, ...colorPropio }}>
            {capa.valor}
          </span>
          {capa.etiqueta ? (
            <span className={oscuro ? 'text-white/80' : 'text-black/70'} style={{ fontSize: tam(1.6, factor), fontWeight: 600 }}>
              {capa.etiqueta}
            </span>
          ) : null}
        </span>,
      )
    case 'cita': {
      // Con sus comillas, si no las trae escritas.
      const texto = capa.cita?.trim() ?? ''
      const conComillas = /^[«"“]/.test(texto) ? texto : `«${texto}»`
      return caja(
        <span className="flex h-full flex-col justify-center" style={{ gap: tam(1.6, factor) }}>
          <span className={oscuro ? 'text-white' : 'text-black/90'} style={{ fontSize: tam(3, factor), fontWeight: 600, lineHeight: 1.25, ...colorPropio }}>
            {conComillas}
          </span>
          {capa.autor ? (
            <span className={oscuro ? 'text-white/70' : 'text-(--acento-texto)'} style={{ fontSize: tam(1.5, factor), fontWeight: 600 }}>
              {capa.autor}
            </span>
          ) : null}
        </span>,
      )
    }
    case 'agenda': {
      const n = Math.min(3, Math.max(1, capa.agenda?.length ?? 1))
      return caja(
        // Las tarjetas llenan el alto de su caja (antes quedaban arriba y la mitad de abajo, vacía).
        <ol className="m-0 grid h-full list-none p-0" style={{ gap: tam(1.4, factor), gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, gridAutoRows: '1fr' }}>
          {(capa.agenda ?? []).map((item, i) => (
            <li key={i} className={cn('flex flex-col rounded-[1.4cqw]', oscuro ? 'bg-white/10' : 'bg-(--acento)/10')} style={{ padding: tam(1.6, factor), gap: tam(0.6, factor) }}>
              {/* El número en blanco sobre oscuro: en el azul del acento sobre la tarjeta oscura no se leía. */}
              <span className={oscuro ? 'text-white' : 'text-(--acento-texto)'} style={{ fontSize: tam(2.4, factor), fontWeight: 800 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className={oscuro ? 'text-white' : 'text-black/90'} style={{ fontSize: tam(1.7, factor), fontWeight: 700, lineHeight: 1.2 }}>
                {item.titulo}
              </span>
              <span className={oscuro ? 'text-white/70' : 'text-black/65'} style={{ fontSize: tam(1.3, factor), lineHeight: 1.4 }}>
                {item.desc}
              </span>
            </li>
          ))}
        </ol>,
      )
    }
  }
}

type Asa = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'
const ASAS: { asa: Asa; x: number; y: number; cursor: string }[] = [
  { asa: 'nw', x: 0, y: 0, cursor: 'nwse-resize' },
  { asa: 'n', x: 50, y: 0, cursor: 'ns-resize' },
  { asa: 'ne', x: 100, y: 0, cursor: 'nesw-resize' },
  { asa: 'e', x: 100, y: 50, cursor: 'ew-resize' },
  { asa: 'se', x: 100, y: 100, cursor: 'nwse-resize' },
  { asa: 's', x: 50, y: 100, cursor: 'ns-resize' },
  { asa: 'sw', x: 0, y: 100, cursor: 'nesw-resize' },
  { asa: 'w', x: 0, y: 50, cursor: 'ew-resize' },
]

/** La caja tras arrastrar `asa` (o mover, sin asa) `dx`·`dy` en % del lienzo. */
function arrastrar(c: Caja, asa: Asa | null, dx: number, dy: number): Caja {
  if (!asa) return { ...c, x: c.x + dx, y: c.y + dy }
  const izq = asa.includes('w')
  const arr = asa.includes('n')
  // Esquinas: en proporción, desde la esquina opuesta. Manda el eje que más se movió.
  if (asa.length === 2) {
    const sx = (izq ? -dx : dx) / c.w
    const sy = (arr ? -dy : dy) / c.h
    const s = Math.max(0.05, 1 + (Math.abs(sx) > Math.abs(sy) ? sx : sy))
    const w = c.w * s
    const h = c.h * s
    return { ...c, w, h, x: izq ? c.x + c.w - w : c.x, y: arr ? c.y + c.h - h : c.y }
  }
  // Lados: un solo eje.
  if (asa === 'e') return { ...c, w: c.w + dx }
  if (asa === 'w') return { ...c, x: c.x + dx, w: c.w - dx }
  if (asa === 's') return { ...c, h: c.h + dy }
  return { ...c, y: c.y + dy, h: c.h - dy }
}

type Props = {
  capas: Capa[]
  fondo: FondoCanvas
  acentoId?: string
  /** Editable: elegir, mover, escalar, borrar y escribir en el sitio. */
  editable?: boolean
  seleccion?: string | null
  onSeleccion?: (id: string | null) => void
  /** La lista entera con el cambio (mover, escalar, borrar, escribir). */
  onCapas?: (capas: Capa[]) => void
}

export function LienzoCapas({ capas, fondo, acentoId, editable = false, seleccion = null, onSeleccion, onCapas }: Props) {
  const raiz = useRef<HTMLDivElement>(null)
  const oscuro = textoClaro(fondo, acentoId)
  // Mientras se arrastra, la caja va en borrador y se guarda al soltar: así no se escribe la escena en cada píxel.
  const [borrador, setBorrador] = useState<{ id: string; caja: Caja } | null>(null)
  const [escribiendo, setEscribiendo] = useState<string | null>(null)
  // Cuánto se achica el lienzo en pantalla: el marco y las asas se compensan para medir siempre lo mismo (si no, en la
  // vista previa quedaban de 4 px y la etiqueta no se leía).
  const [escala, setEscala] = useState(1)
  useEffect(() => {
    const nodo = raiz.current
    if (!nodo || !editable) return
    const medir = () => nodo.offsetWidth && setEscala(nodo.getBoundingClientRect().width / nodo.offsetWidth || 1)
    medir()
    const observador = new ResizeObserver(medir)
    observador.observe(nodo)
    return () => observador.disconnect()
  }, [editable])
  const elegida = editable ? capas.find((c) => c.id === seleccion) : undefined

  const cambiarCapa = (id: string, cambio: Partial<Capa>) => onCapas?.(capas.map((c) => (c.id === id ? { ...c, ...cambio } : c)))

  const borrar = (capa: Capa) => {
    const antes = capas
    onCapas?.(capas.filter((c) => c.id !== capa.id))
    onSeleccion?.(null)
    notifyAction(`Se quitó la capa ${NOMBRE_CAPA[capa.tipo].toLowerCase()}`, 'Puedes recuperarla con «Deshacer».', { label: 'Deshacer', onClick: () => onCapas?.(antes) }, 'info')
  }

  // Supr y las flechas actúan solo con el foco en el lienzo: en el panel (un campo, la rotación) movían la capa por
  // detrás. El lienzo toma el foco al elegir una capa con el puntero.
  const teclas = (e: EventoTecla<HTMLDivElement>) => {
    if (!editable || !elegida || escribiendo) return
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      borrar(elegida)
      return
    }
    if (e.key === 'Escape') {
      onSeleccion?.(null)
      return
    }
    const paso = e.shiftKey ? 2 : 0.5
    const mover: Record<string, [number, number]> = { ArrowLeft: [-paso, 0], ArrowRight: [paso, 0], ArrowUp: [0, -paso], ArrowDown: [0, paso] }
    const d = mover[e.key]
    if (!d) return
    e.preventDefault()
    cambiarCapa(elegida.id, { caja: ajustarCaja({ ...elegida.caja, x: elegida.caja.x + d[0], y: elegida.caja.y + d[1] }) })
  }

  const empezar = (e: EventoPuntero, capa: Capa, asa: Asa | null) => {
    if (!editable || escribiendo === capa.id) return
    e.preventDefault()
    e.stopPropagation()
    raiz.current?.focus({ preventScroll: true })
    onSeleccion?.(capa.id)
    const caja = raiz.current?.getBoundingClientRect()
    if (!caja) return
    const inicio = { x: e.clientX, y: e.clientY }
    let ultima = capa.caja
    let movio = false
    const mover = (ev: PointerEvent) => {
      const dx = ((ev.clientX - inicio.x) / caja.width) * 100
      const dy = ((ev.clientY - inicio.y) / caja.height) * 100
      if (!movio && Math.abs(dx) + Math.abs(dy) < 0.3) return
      movio = true
      ultima = ajustarCaja(arrastrar(capa.caja, asa, dx, dy))
      setBorrador({ id: capa.id, caja: ultima })
    }
    const soltar = () => {
      window.removeEventListener('pointermove', mover)
      window.removeEventListener('pointerup', soltar)
      setBorrador(null)
      if (movio) cambiarCapa(capa.id, { caja: ultima })
    }
    window.addEventListener('pointermove', mover)
    window.addEventListener('pointerup', soltar)
  }

  const estiloCaja = (c: Caja): CSSProperties => ({ left: `${c.x}%`, top: `${c.y}%`, width: `${c.w}%`, height: `${c.h}%`, transform: c.rot ? `rotate(${c.rot}deg)` : undefined })

  return (
    <div
      ref={raiz}
      tabIndex={editable ? -1 : undefined}
      aria-label={editable ? 'Lienzo de la escena' : undefined}
      className="@container relative size-full overflow-hidden outline-none select-none"
      style={{ ...(variablesAcento(acentoId) as CSSProperties), ['--borde' as string]: `${2 / escala}px` }}
      onKeyDown={teclas}
      onPointerDown={() => {
        if (!editable) return
        // Si se estaba escribiendo, el clic en el fondo guarda lo escrito (el texto pierde el foco) y suelta la capa.
        const activo = document.activeElement as HTMLElement | null
        if (activo?.hasAttribute('data-escribiendo')) activo.blur()
        onSeleccion?.(null)
      }}
    >
      <Fondo fondo={fondo} />
      {capas.map((capa) => {
        const caja = borrador?.id === capa.id ? borrador.caja : capa.caja
        const esElegida = elegida?.id === capa.id
        return (
          <div
            key={capa.id}
            data-capa={capa.id}
            className={cn('absolute', editable && 'cursor-move', editable && !esElegida && 'hover:outline-(length:--borde) hover:outline-(--color-primary)/40 hover:outline-solid')}
            style={estiloCaja(caja)}
            onPointerDown={(e) => empezar(e, capa, null)}
            onDoubleClick={() => editable && capa.tipo === 'texto' && setEscribiendo(capa.id)}
          >
            <ContenidoCapa
              capa={capa}
              oscuro={oscuro}
              sobreClaro={fondo === 'claro'}
              escribiendo={escribiendo === capa.id}
              onTexto={(texto) => texto !== capa.texto && cambiarCapa(capa.id, { texto })}
              onTerminar={() => {
                setEscribiendo(null)
                raiz.current?.focus({ preventScroll: true })
              }}
            />
          </div>
        )
      })}
      {/* El marco de la capa elegida va aparte y encima de todas, para que sus asas no queden tapadas. */}
      {elegida && escribiendo !== elegida.id ? (
        <MarcoSeleccion caja={borrador?.id === elegida.id ? borrador.caja : elegida.caja} nombre={NOMBRE_CAPA[elegida.tipo]} escala={escala} onAsa={(e, asa) => empezar(e, elegida, asa)} />
      ) : null}
    </div>
  )
}

function MarcoSeleccion({ caja, nombre, escala, onAsa }: { caja: Caja; nombre: string; escala: number; onAsa: (e: EventoPuntero, asa: Asa) => void }): ReactNode {
  // Todo lo del marco se divide por la escala: 2 px de borde, asas de 12 px y la etiqueta a su tamaño, en cualquier vista.
  const px = (n: number) => `${n / escala}px`
  // La etiqueta va arriba de la capa; si la capa está pegada al borde de arriba, abajo, para no quedar fuera.
  const abajo = caja.y < 8
  return (
    <div
      className="pointer-events-none absolute outline-(--color-primary)"
      style={{
        left: `${caja.x}%`,
        top: `${caja.y}%`,
        width: `${caja.w}%`,
        height: `${caja.h}%`,
        transform: caja.rot ? `rotate(${caja.rot}deg)` : undefined,
        outlineStyle: 'solid',
        outlineWidth: px(2),
      }}
    >
      <span
        className={cn('absolute left-0', abajo ? 'origin-top-left' : 'origin-bottom-left')}
        style={abajo ? { top: '100%', marginTop: px(8), transform: `scale(${1 / escala})` } : { bottom: '100%', marginBottom: px(8), transform: `scale(${1 / escala})` }}
      >
        <Text as="span" size="xs" weight="medium" className="block rounded-md bg-primary/90 px-1.5 py-px whitespace-nowrap text-primary-foreground!">
          {nombre}
        </Text>
      </span>
      {ASAS.map(({ asa, x, y, cursor }) => (
        <span
          key={asa}
          role="presentation"
          className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-primary bg-white shadow-sm"
          style={{ left: `${x}%`, top: `${y}%`, cursor, width: px(12), height: px(12), borderWidth: px(2), borderStyle: 'solid' }}
          onPointerDown={(e) => onAsa(e, asa)}
        />
      ))}
    </div>
  )
}
