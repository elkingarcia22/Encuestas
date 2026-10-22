import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ChartColumnIcon, Search01Icon } from '@hugeicons/core-free-icons'
import { Frame, FramePanel, InputGroup, InputGroupAddon, InputGroupInput, Item, ItemActions, ItemContent, ItemDescription, ItemTitle, Text } from '@ubits/flux-ui'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import { TITULO_DIMENSION, detalleDe, type Dimension } from '../../modelo/resultados/lecturas'
import type { ResultadosCiclo } from '../../modelo/resultados/seguimiento'

// El detalle de un tramo del Resumen (9-oct, como el prototipo): al tocar «Riesgo alto», «Por aprobar» o «Dinero» se abre
// un panel con quiénes (o qué objetivos) están en él, con su buscador. Respeta los filtros del reporte.

export type PedidoDetalle = { dimension: Dimension; tramo: string; etiqueta: string }

export function DetalleTramo({ pedido, resultados, onCerrar }: { pedido: PedidoDetalle | null; resultados: ResultadosCiclo; onCerrar: () => void }) {
  const [busqueda, setBusqueda] = useState('')
  const filas = pedido ? detalleDe(resultados, pedido.dimension, pedido.tramo) : []
  const q = busqueda.trim().toLowerCase()
  const visibles = filas.filter((fila) => !q || `${fila.titulo} ${fila.detalle}`.toLowerCase().includes(q))

  return (
    <DrawerShell
      open={pedido !== null}
      onOpenChange={(abierto) => {
        if (abierto) return
        setBusqueda('')
        onCerrar()
      }}
      size="md"
      icon={ChartColumnIcon}
      kicker={pedido ? TITULO_DIMENSION[pedido.dimension] : undefined}
      title={pedido?.etiqueta ?? ''}
      description={`${filas.length.toLocaleString('es-CO')} ${filas.length === 1 ? 'resultado' : 'resultados'} en ${resultados.ciclo.nombre}`}
      headerExtra={
        <div className="border-b px-5 py-3">
          <InputGroup>
            <InputGroupAddon>
              <HugeiconsIcon icon={Search01Icon} aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder={`Buscar en «${pedido?.etiqueta ?? ''}»`} aria-label="Buscar en el detalle" />
          </InputGroup>
        </div>
      }
    >
      {/* Los vacíos con las piezas del sistema y su ilustración glass: tramo vacío (PrimeraVez) o búsqueda sin nada (SinResultados). */}
      {filas.length === 0 ? (
        <PrimeraVez icono="glass-profile" titulo={`Nadie quedó en «${pedido?.etiqueta ?? ''}»`} descripcion="Con los filtros del reporte, este tramo no tiene a nadie." className="py-10" />
      ) : visibles.length === 0 ? (
        <SinResultados busqueda={busqueda} onLimpiar={() => setBusqueda('')} />
      ) : (
        // Las líneas entre filas, como en la lista para elegir: el envoltorio de cada fila las pone (divide-y).
        <Frame>
          <FramePanel className="[--frame-panel-px:0px] [--frame-panel-py:0px]">
          <div className="divide-y">
            {visibles.map((fila) => (
              <div key={fila.id}>
                <Item size="sm">
                  <ItemContent className="min-w-0">
                    <ItemTitle className="truncate">{fila.titulo}</ItemTitle>
                    <ItemDescription>{fila.detalle}</ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Text as="span" size="sm" weight="medium" className="tabular-nums">
                      {fila.valor}
                    </Text>
                  </ItemActions>
                </Item>
              </div>
            ))}
          </div>
        </FramePanel>
          </Frame>
      )}
    </DrawerShell>
  )
}
