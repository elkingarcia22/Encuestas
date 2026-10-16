import type { ReactNode } from 'react'
import { Frame, FramePanel, Text } from '@ubits/flux-ui'

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

/**
 * `columnas` es cuántas lecturas van en fila en escritorio. Por defecto **tres**, que es como nació y como la usan
 * Encuestas y Vacantes: con tres o menos el comportamiento es el de siempre —una debajo de otra hasta `lg`, y en fila
 * con divisores desde ahí—. Con **cuatro o más** aparece un paso intermedio de dos columnas en tableta, porque cuatro
 * lecturas apiladas dejan la sección larguísima.
 */
// Con `enMarco` sale solo el panel blanco, para ir dentro de un marco que ya existe: por ejemplo uno con su título arriba
// en lo gris, como las cifras del inicio de Vacantes («Cómo van los procesos», 1 oct). Va como hijo directo del `Frame`,
// que así lo apila bajo la cabecera o con los demás paneles.
export function FilaIndicadores({
  etiqueta,
  columnas = 3,
  enMarco = false,
  children,
}: {
  etiqueta: string
  columnas?: number
  enMarco?: boolean
  children: ReactNode
}) {
  const enEscritorio = COLUMNAS_LG[columnas] ?? 'lg:grid-cols-3'
  const enTableta = columnas >= 4 ? 'sm:grid-cols-2' : ''
  // El panel de la librería recorta lo que se sale; aquí se deja ver, porque el tooltip de un gráfico pequeño casi
  // siempre se sale de su esquina, y se pone encima de la columna vecina en vez de quedar tapado por ella.
  const panel = (
    <FramePanel
      role={enMarco ? 'region' : undefined}
      aria-label={enMarco ? etiqueta : undefined}
      className={`divide-border grid grid-cols-1 gap-5 overflow-visible! ${enTableta} ${enEscritorio} lg:gap-0 lg:divide-x [&_.recharts-tooltip-wrapper]:z-50`}
    >
      {children}
    </FramePanel>
  )
  if (enMarco) return panel
  return (
    <section aria-label={etiqueta}>
      <Frame>{panel}</Frame>
    </section>
  )
}

/**
 * Una columna de la fila. `cifra` es la lectura grande (un texto se pinta con la tipografía de
 * cifra; cualquier otra cosa, como una lista o unos filtros, va tal cual). `grafico` va en la
 * esquina, a la derecha de la cifra. `variacion` es la insignia del cambio, pegada a la cifra como en
 * las top métricas del Inicio operativo. `pie` es la línea de abajo: el detalle.
 * `ayuda` va junto al título y `extra`, a la derecha del título (un total, por ejemplo).
 */
export function ColumnaIndicador({
  titulo,
  ayuda,
  extra,
  cifra,
  variacion,
  grafico,
  pie,
}: {
  titulo: string
  ayuda?: ReactNode
  extra?: string
  cifra: ReactNode
  variacion?: ReactNode
  grafico?: ReactNode
  pie?: ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 lg:px-5 lg:first:ps-0 lg:last:pe-0">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1">
          <Text as="span" variant="muted" size="sm" className="truncate">
            {titulo}
          </Text>
          {ayuda}
        </div>
        {extra ? (
          <Text as="span" variant="muted" size="xs" className="shrink-0 tabular-nums">
            {extra}
          </Text>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col justify-end gap-2">
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
