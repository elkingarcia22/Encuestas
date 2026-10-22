import { createContext, useContext, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'
import { Frame, FramePanel, Text, cn } from '@ubits/flux-ui'

// La fila de indicadores del playground, la del bloque chart-2 de ReUI: un marco partido en tres
// columnas con divisores, y en cada una el nombre de la lectura, la cifra con su gráfico pequeño
// en la esquina y el detalle debajo. La usan el home de Encuestas, el home de Vacantes y el
// resumen de arriba de cada pestaña de Resultados, así las tres se leen igual.

// Las clases se escriben enteras a propósito: Tailwind lee el código como texto, así que una clase armada por pedazos
// (`lg:grid-cols-${n}`) no se genera nunca y la fila se queda en una sola columna.
const COLUMNAS_LG: Record<number, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
  6: 'lg:grid-cols-6',
}

// Las columnas saben si la fila se mide contra su contenedor, para poner su relleno al mismo ancho que los divisores.
const SegunContenedor = createContext(false)

// Lo mismo, medido contra el contenedor más cercano (`@container`) en vez de la ventana: para cuando la fila va en un
// espacio angosto dentro de una pantalla ancha, como una respuesta de Orbit en el chat (16 oct). Hasta 896 px de
// contenedor las lecturas van de a dos, con su espacio; desde ahí, en fila con divisores.
const COLUMNAS_CONTENEDOR: Record<number, string> = {
  1: '@4xl:grid-cols-1',
  2: '@4xl:grid-cols-2',
  3: '@4xl:grid-cols-3',
  4: '@4xl:grid-cols-4',
  5: '@4xl:grid-cols-5',
  6: '@4xl:grid-cols-6',
}

/**
 * `columnas` es cuántas lecturas van en fila en escritorio. Por defecto **tres**, que es como nació y como la usan
 * Encuestas y Vacantes: con tres o menos el comportamiento es el de siempre —una debajo de otra hasta `lg`, y en fila
 * con divisores desde ahí—. Con **cuatro o más** aparece un paso intermedio de dos columnas en tableta, porque cuatro
 * lecturas apiladas dejan la sección larguísima.
 */
// Con `enMarco` sale solo el panel blanco, para ir dentro de un marco que ya existe: por ejemplo uno con su título arriba
// en lo gris, como las cifras del inicio de Vacantes («Cómo van los procesos», 1 oct). Va como hijo directo del `Frame`,
// que así lo apila bajo la cabecera o con los demás paneles. Con `segunContenedor`, las columnas se acomodan al ancho del
// contenedor más cercano y no al de la ventana (ver COLUMNAS_CONTENEDOR).
export function FilaIndicadores({
  etiqueta,
  columnas = 3,
  enMarco = false,
  segunContenedor = false,
  children,
}: {
  etiqueta: string
  columnas?: number
  enMarco?: boolean
  segunContenedor?: boolean
  children: ReactNode
}) {
  const enEscritorio = segunContenedor ? `${COLUMNAS_CONTENEDOR[columnas] ?? '@4xl:grid-cols-3'} @4xl:gap-0 @4xl:divide-x` : `${COLUMNAS_LG[columnas] ?? 'lg:grid-cols-3'} lg:gap-0 lg:divide-x`
  const enTableta = segunContenedor ? '@md:grid-cols-2' : columnas >= 4 ? 'sm:grid-cols-2' : ''
  // El panel de la librería recorta lo que se sale; aquí se deja ver, porque el tooltip de un gráfico pequeño casi
  // siempre se sale de su esquina, y se pone encima de la columna vecina en vez de quedar tapado por ella.
  const panel = (
    <FramePanel
      role={enMarco ? 'region' : undefined}
      aria-label={enMarco ? etiqueta : undefined}
      className={`divide-border grid grid-cols-1 gap-5 overflow-visible! ${enTableta} ${enEscritorio} [&_.recharts-tooltip-wrapper]:z-50`}
    >
      {children}
    </FramePanel>
  )
  if (enMarco) return <SegunContenedor.Provider value={segunContenedor}>{panel}</SegunContenedor.Provider>
  return (
    <SegunContenedor.Provider value={segunContenedor}>
      <section aria-label={etiqueta}>
        <Frame>{panel}</Frame>
      </section>
    </SegunContenedor.Provider>
  )
}

/**
 * Una columna de la fila. `cifra` es la lectura grande (un texto se pinta con la tipografía de
 * cifra; cualquier otra cosa, como una lista o unos filtros, va tal cual). `grafico` va en la
 * esquina, a la derecha de la cifra. `variacion` es la insignia del cambio, pegada a la cifra como en
 * las top métricas del Inicio operativo. `pie` es la línea de abajo: el detalle.
 * `ayuda` va junto al título y `extra`, a la derecha del título (un total, por ejemplo).
 * Con `onVer` toda la columna se puede tocar para ver el detalle de la cifra (las personas detrás de «22 sin
 * iniciar», 15-oct, Planes): un botón cubre la columna por debajo del texto, se marca al pasar el cursor y lleva una
 * flecha junto al título. La ayuda queda por encima y sigue abriendo su globo. Sin `onVer`, la columna es la de siempre.
 */
export function ColumnaIndicador({
  titulo,
  ayuda,
  extra,
  cifra,
  variacion,
  grafico,
  pie,
  onVer,
  etiquetaVer,
}: {
  titulo: string
  ayuda?: ReactNode
  extra?: string
  cifra: ReactNode
  variacion?: ReactNode
  grafico?: ReactNode
  pie?: ReactNode
  onVer?: () => void
  /** Lo que lee el lector de pantalla en el botón. Por defecto, «Ver el detalle de «título»». */
  etiquetaVer?: string
}) {
  const segunContenedor = useContext(SegunContenedor)
  return (
    <div
      className={cn(
        segunContenedor ? 'flex min-w-0 flex-col gap-1 @4xl:px-5 @4xl:first:ps-0 @4xl:last:pe-0' : 'flex min-w-0 flex-col gap-1 lg:px-5 lg:first:ps-0 lg:last:pe-0',
        onVer && 'group/ver relative',
      )}
    >
      {onVer ? (
        <button
          type="button"
          onClick={onVer}
          aria-label={etiquetaVer ?? `Ver el detalle de «${titulo}»`}
          className={cn(
            'hover:bg-muted/60 focus-visible:ring-ring absolute -inset-2 cursor-pointer rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none',
            segunContenedor ? '@4xl:-inset-x-3' : 'lg:-inset-x-3',
          )}
        />
      ) : null}
      <div className={cn('flex min-w-0 items-center justify-between gap-2', onVer && 'pointer-events-none relative')}>
        <div className="flex min-w-0 items-center gap-1">
          <Text as="span" variant="muted" size="sm" className="truncate">
            {titulo}
          </Text>
          {onVer && ayuda ? <span className="pointer-events-auto flex">{ayuda}</span> : ayuda}
        </div>
        {onVer ? (
          <HugeiconsIcon icon={ArrowRight01Icon} className="text-muted-foreground group-hover/ver:text-foreground size-4 shrink-0 transition-colors" aria-hidden="true" />
        ) : null}
        {extra ? (
          <Text as="span" variant="muted" size="xs" className="shrink-0 tabular-nums">
            {extra}
          </Text>
        ) : null}
      </div>
      <div className={cn('flex flex-1 flex-col justify-end gap-2', onVer && 'pointer-events-none relative')}>
        <div className="flex items-end justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {typeof cifra === 'string' ? (
              <Text as="span" size="xl" weight="semibold" className="tabular-nums">
                {cifra}
              </Text>
            ) : (
              cifra
            )}
            {variacion}
          </div>
          {grafico ? (
            <div className="flex shrink-0 items-end" aria-hidden="true">
              {grafico}
            </div>
          ) : null}
        </div>
        {pie ? <div className="flex min-w-0 flex-wrap items-center gap-2">{pie}</div> : null}
      </div>
    </div>
  )
}

/** El detalle gris de la línea de abajo, en una sola línea. */
export function DetalleIndicador({ children }: { children: ReactNode }) {
  return (
    <Text as="span" variant="muted" size="xs" className="truncate">
      {children}
    </Text>
  )
}
