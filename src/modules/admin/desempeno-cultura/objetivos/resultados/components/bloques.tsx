import type { ReactNode } from 'react'
import { Button, Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle, Progress, Text } from '@ubits/flux-ui'
import { DonaReparto, FilaTooltip } from '@/modules/design-system/graficos/piezas'
import type { FilaGrupo, Tramo } from '../../modelo/resultados/lecturas'

// Las piezas con que se arma el Resumen de resultados (9-oct): un bloque con título (Frame) y, dentro, paneles blancos con
// su propio título; las filas por grupo (nombre, barra y cifra) y el reparto (dona con su leyenda). Todo de la librería y
// del design system: Frame, Progress, la dona de reparto (tamaño fijo: la de Métricas se mide sola y en un hueco angosto
// quedaba sin tamaño) y la fila de leyenda de los gráficos (FilaTooltip).

/** `extra`: los controles de la caja («Ver por»), a la derecha del título, como las cajas de Resultados de Encuestas. */
export function Bloque({ titulo, descripcion, columnas = 2, extra, children }: { titulo: string; descripcion?: string; columnas?: 1 | 2 | 3; extra?: ReactNode; children: ReactNode }) {
  const rejilla = columnas === 3 ? 'lg:grid-cols-3' : columnas === 2 ? 'lg:grid-cols-2' : ''
  return (
    <Frame>
      {extra ? (
        // «!»: la misma cabecera en fila de las cajas de Resultados de Encuestas (diferencias.json › instalacion-estilos-sin-capa).
        <FrameHeader className="flex-row! flex-wrap! items-center! justify-between! gap-3! [--frame-panel-header-gap:--spacing(1)]">
          <div>
            <FrameTitle>{titulo}</FrameTitle>
            {descripcion ? <FrameDescription>{descripcion}</FrameDescription> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">{extra}</div>
        </FrameHeader>
      ) : (
        <FrameHeader>
          <FrameTitle>{titulo}</FrameTitle>
          {descripcion ? <FrameDescription>{descripcion}</FrameDescription> : null}
        </FrameHeader>
      )}
      <div className={`grid gap-(--frame-gap) ${rejilla}`}>{children}</div>
    </Frame>
  )
}

export function Panel({ titulo, detalle, extra, children }: { titulo: string; detalle?: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <FramePanel className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <Text as="span" size="sm" weight="semibold">
            {titulo}
          </Text>
          {detalle ? (
            <Text as="span" size="xs" variant="muted">
              {detalle}
            </Text>
          ) : null}
        </div>
        {extra}
      </div>
      {children}
    </FramePanel>
  )
}

/** Una fila por grupo: el nombre con su detalle, la barra y la cifra a la derecha. */
export function Barras({ filas, formato, vacio }: { filas: readonly FilaGrupo[]; formato: (valor: number) => string; vacio?: string }) {
  if (filas.length === 0) {
    return (
      <Text as="p" size="sm" variant="muted">
        {vacio ?? 'Sin datos todavía.'}
      </Text>
    )
  }
  return (
    <ul className="flex flex-col gap-3">
      {filas.map((fila) => (
        <li key={fila.id} className="grid grid-cols-[minmax(0,10rem)_1fr_auto] items-center gap-3">
          <div className="flex min-w-0 flex-col">
            <Text as="span" size="sm" className="truncate">
              {fila.etiqueta}
            </Text>
            {fila.detalle ? (
              <Text as="span" size="xs" variant="muted" className="truncate">
                {fila.detalle}
              </Text>
            ) : null}
          </div>
          <Progress value={Math.min(100, fila.valor)} aria-label={`${fila.etiqueta}: ${formato(fila.valor)}`} />
          <Text as="span" size="sm" weight="medium" className="min-w-14 text-right tabular-nums">
            {fila.texto ?? formato(fila.valor)}
          </Text>
        </li>
      ))}
    </ul>
  )
}

/** El reparto: la dona con el total en el centro y, al lado, cada tramo con su color, su cantidad y su parte. */
export function Reparto({ tramos, total, unidad, onTramo }: { tramos: readonly Tramo[]; total: string; unidad?: (cantidad: number) => string; onTramo?: (tramo: Tramo) => void }) {
  const suma = tramos.reduce((s, tramo) => s + tramo.cantidad, 0)
  return (
    <div className="grid items-center gap-5 sm:grid-cols-[auto_1fr]">
      <div className="flex flex-col items-center gap-1">
        <DonaReparto segmentos={tramos.map((tramo) => ({ id: tramo.id, etiqueta: tramo.etiqueta, valor: tramo.cantidad, color: tramo.color }))} etiqueta={`Reparto: ${total} en total`} tamano={112} />
        <Text as="span" size="lg" weight="semibold" className="tabular-nums">
          {total}
        </Text>
      </div>
      <div className="flex flex-col gap-2">
        {tramos.map((tramo) => {
          const fila = (
            <FilaTooltip
              color={tramo.color}
              etiqueta={tramo.etiqueta}
              valor={[unidad ? unidad(tramo.cantidad) : tramo.cantidad.toLocaleString('es-CO'), `${suma === 0 ? 0 : Math.round((tramo.cantidad / suma) * 100)} %`].filter(Boolean).join(' · ')}
            />
          )
          // Un tramo con algo adentro se toca para ver quiénes son (como en el prototipo); uno vacío no.
          return onTramo && tramo.cantidad > 0 ? (
            <Button key={tramo.id} variant="ghost" size="sm" className="h-auto w-full px-1.5 py-1" onClick={() => onTramo(tramo)} aria-label={`Ver quiénes están en ${tramo.etiqueta}`}>
              {fila}
            </Button>
          ) : (
            <div key={tramo.id} className="px-1.5 py-1">
              {fila}
            </div>
          )
        })}
      </div>
    </div>
  )
}
