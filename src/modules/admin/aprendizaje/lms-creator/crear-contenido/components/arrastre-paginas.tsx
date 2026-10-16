import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { Seccion } from './borrador'

/**
 * Arrastre de las páginas del índice del Creator, **por encima de las secciones**: una página se suelta en cualquier
 * sección, no solo en la suya.
 *
 * Es la receta del Creator de producción (`sortable-list-provider--cross-container` en el LXP), que es lo que Dave
 * pidió mirar el 5-oct:
 * 1. la página que se arrastra **se colapsa** —en producción, `height: 0; opacity: 0`— y deja de ocupar sitio;
 * 2. **un solo** recuadro punteado marca dónde va a caer;
 * 3. la fila viaja en un **clon que flota** sobre todo.
 *
 * Lo que se descartó, y por qué, para que nadie lo vuelva a intentar:
 * - El `Sortable` de flux-ui aparta las filas de en medio con `transform`. En una sola lista se ve bien, pero con el
 *   índice repartido en tarjetas, al arrastrar la última página de una sección hacia la siguiente, la primera página
 *   de esa otra sección **se desplazaba hacia arriba cruzando a la tarjeta de la primera**: parecía que se iba a
 *   cambiar de sección, cuando no se movía de ahí. Esa es la ilusión de intercambio (Dave, 5-oct).
 * - Franjas de «suelta aquí» en todas las secciones: aparecen donde no vas a soltar, mueven el contenido y dejan
 *   soltar sobre un recuadro vacío. Solo hay un sitio donde va a caer, así que solo se marca uno.
 *
 * Mover una página a otra sección **no intercambia nada**: sale de la suya y entra en la otra. De 3 y 3 quedan 2 y 4.
 */

/** Dónde caería la página si se soltara ahora. */
export type DestinoPagina = { seccionId: string; indice: number }

type Estado = {
  paginaId: string
  /** Alto de la fila, para que el recuadro punteado mida lo mismo. */
  alto: number
  destino: DestinoPagina | null
  /** Copia de la fila, para pintarla flotando: la tarjeta de la sección recorta lo que se sale. */
  clon: { html: string; left: number; top: number; width: number; dy: number }
}

type Controlador = {
  estado: Estado | null
  empezar: (e: React.PointerEvent, paginaId: string) => void
  /** Si el recuadro punteado va en esta posición de esta sección. */
  marcaEn: (seccionId: string, indice: number) => boolean
  alto: number
}

const Ctx = createContext<Controlador | null>(null)

export function useArrastrePaginas() {
  const c = useContext(Ctx)
  if (!c) throw new Error('Las filas del índice van dentro de <ArrastrePaginas>')
  return c
}

/** Una fila medida al empezar: su sitio real, que ya no cambia aunque el índice se recoloque. */
type FilaMedida = { paginaId: string; seccionId: string; centro: number }

export function ArrastrePaginas({
  secciones,
  onSoltar,
  children,
}: {
  secciones: Seccion[]
  onSoltar: (paginaId: string, destino: DestinoPagina) => void
  children: React.ReactNode
}) {
  const [estado, setEstado] = useState<Estado | null>(null)
  const raiz = useRef<HTMLDivElement>(null)
  const medidas = useRef<{ filas: FilaMedida[]; secciones: { id: string; top: number; bottom: number }[] }>({
    filas: [],
    secciones: [],
  })
  // En un ref además del estado: los listeners de `window` se montan una vez y tienen que leer lo último.
  const vivo = useRef<{ paginaId: string; y0: number; alto: number; destino: DestinoPagina | null; clon: Estado['clon'] } | null>(null)
  const seccionesRef = useRef(secciones)
  seccionesRef.current = secciones

  const medir = useCallback(() => {
    const nodo = raiz.current
    if (!nodo) return
    const filas: FilaMedida[] = []
    for (const s of seccionesRef.current) {
      for (const p of s.paginas) {
        const el = nodo.querySelector<HTMLElement>(`[data-pagina="${CSS.escape(p.id)}"]`)
        if (!el) continue
        const r = el.getBoundingClientRect()
        filas.push({ paginaId: p.id, seccionId: s.id, centro: r.top + r.height / 2 })
      }
    }
    const cajas = seccionesRef.current.map((s) => {
      const r = nodo.querySelector<HTMLElement>(`[data-seccion="${CSS.escape(s.id)}"]`)?.getBoundingClientRect()
      return { id: s.id, top: r?.top ?? 0, bottom: r?.bottom ?? 0 }
    })
    medidas.current = { filas, secciones: cajas }
  }, [])

  /**
   * Dónde caería con el cursor en esa altura: **la sección que hay debajo del cursor** y, dentro de ella, cuántas de
   * sus páginas quedan por encima. Mirar la sección primero es lo que hace que el pie de la tarjeta y una sección
   * vacía también reciban la página, sin tener que dibujar zonas donde soltar.
   */
  const destinoEn = useCallback((y: number, paginaId: string): DestinoPagina | null => {
    const { filas, secciones: cajas } = medidas.current
    if (!cajas.length) return null
    const dentro = cajas.find((s) => y >= s.top && y <= s.bottom)
    const caja =
      dentro ??
      cajas.reduce((mejor, s) => {
        const d = y < s.top ? s.top - y : y - s.bottom
        const dMejor = y < mejor.top ? mejor.top - y : y - mejor.bottom
        return d < dMejor ? s : mejor
      }, cajas[0])
    const suyas = filas.filter((f) => f.seccionId === caja.id && f.paginaId !== paginaId)
    return { seccionId: caja.id, indice: suyas.filter((f) => f.centro < y).length }
  }, [])

  const empezar = useCallback(
    (e: React.PointerEvent, paginaId: string) => {
      if (e.button !== 0) return
      e.preventDefault()
      const fila = (e.currentTarget as HTMLElement).closest<HTMLElement>('[data-pagina]')
      if (!fila) return
      const r = fila.getBoundingClientRect()
      const clon = { html: fila.innerHTML, left: r.left, top: r.top, width: r.width, dy: 0 }
      medir()
      vivo.current = { paginaId, y0: e.clientY, alto: r.height, destino: null, clon }
      setEstado({ paginaId, alto: r.height, destino: null, clon })
      document.body.style.cursor = 'grabbing'
      document.body.style.userSelect = 'none'
    },
    [medir],
  )

  useEffect(() => {
    const mover = (e: PointerEvent) => {
      const v = vivo.current
      if (!v) return
      v.destino = destinoEn(e.clientY, v.paginaId)
      setEstado({ paginaId: v.paginaId, alto: v.alto, destino: v.destino, clon: { ...v.clon, dy: e.clientY - v.y0 } })
    }

    const soltar = () => {
      const v = vivo.current
      vivo.current = null
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      setEstado(null)
      if (v?.destino) onSoltar(v.paginaId, v.destino)
    }

    window.addEventListener('pointermove', mover)
    window.addEventListener('pointerup', soltar)
    window.addEventListener('pointercancel', soltar)
    return () => {
      window.removeEventListener('pointermove', mover)
      window.removeEventListener('pointerup', soltar)
      window.removeEventListener('pointercancel', soltar)
    }
  }, [destinoEn, onSoltar])

  /** El recuadro va en la posición de destino, contando las páginas de esa sección **sin** la que se arrastra. */
  const marcaEn = useCallback(
    (seccionId: string, indice: number) => {
      const d = estado?.destino
      if (!d || d.seccionId !== seccionId) return false
      return d.indice === indice
    },
    [estado],
  )

  return (
    <Ctx.Provider value={{ estado, empezar, marcaEn, alto: estado?.alto ?? 0 }}>
      <div ref={raiz} className="flex flex-col gap-2">
        {children}
      </div>
      {estado ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-50 rounded-lg border bg-card shadow-lg"
          style={{
            left: estado.clon.left,
            top: estado.clon.top,
            width: estado.clon.width,
            transform: `translate3d(0, ${estado.clon.dy}px, 0)`,
            cursor: 'grabbing',
          }}
          dangerouslySetInnerHTML={{ __html: estado.clon.html }}
        />
      ) : null}
    </Ctx.Provider>
  )
}

/**
 * Dónde va a caer la página: el hueco que va a ocupar, con su medida y su forma. Habla el idioma del índice —el
 * mismo radio y el mismo borde que una fila, solo que punteado y en hueco—; de producción se copió la mecánica, no
 * su recuadro azul de 2 px, que aquí sería lo único chillón de la pantalla (Dave, 5-oct).
 */
export function MarcaDeSoltar({ alto }: { alto: number }) {
  return <div aria-hidden="true" className="rounded-lg border border-dashed bg-muted/60" style={{ height: alto }} />
}
