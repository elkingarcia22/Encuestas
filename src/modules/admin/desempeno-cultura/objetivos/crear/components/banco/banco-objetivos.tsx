import { useState, type JSX } from 'react'
import { LibraryIcon } from '@hugeicons/core-free-icons'
import { Button, Text } from '@ubits/flux-ui'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { usePanelActual } from '@/modules/design-system/drawers/components/panel-actual'
import type { Objective } from '../../../modelo/constructor/cicloBuilderTypes'
import { useObjectiveBank, type ObjectiveBankController } from '../../../modelo/constructor/objectiveBankBrowse'
import type { ObjectiveScope } from '../../../modelo/constructor/objectiveBankTypes'
import { FiltrosBanco, ListaBanco } from './piezas-banco'

// El banco de objetivos de UBITS, calcado del banco de preguntas de encuestas: drawer ancho, filtros bajo la cabecera,
// acordeón de marcos por tema con una casilla por objetivo y, al pie, cuántos van y «Agregar (n)». El alcance
// (empresa, grupo o individual) lo decide el paso donde se abre, sin preguntar. Al agregar, lo marcado se convierte en
// objetivos con el peso libre repartido entre ellos (`buildObjectives`). Cada apertura empieza de cero.
//
// `PanelBanco` es el mismo contenido sin el drawer, para meterlo dentro del drawer de asignación: quien lo monta crea
// el controlador con `useObjectiveBank(alcance)` (así puede leer lo marcado desde su propio pie) y, si quiere el pie
// del banco dentro del panel, le pasa `onAgregar`.

const contar = (n: number) => `${n} ${n === 1 ? 'elegido' : 'elegidos'}`

export interface BancoObjetivosProps {
  abierto: boolean
  onAbiertoChange: (abierto: boolean) => void
  alcance: ObjectiveScope
  /** El peso que queda libre en el set (0 en los objetivos de la empresa, que no llevan peso). */
  pesoLibre: number
  onAgregar: (objetivos: Objective[]) => void
  titulo?: string
  /** Dónde van a quedar, para decirlo en el pie («irán a Marketing»). */
  destino?: string
}

function Pie({ banco, pesoLibre, destino, onAgregar, onCancelar, cierraElPanel = false }: { banco: ObjectiveBankController; pesoLibre: number; destino?: string; onAgregar: (objetivos: Objective[]) => void; onCancelar: () => void; cierraElPanel?: boolean }) {
  const n = banco.selectedCount
  // Dentro del panel del banco, «Cancelar» hace lo mismo que la X: con objetivos marcados pregunta antes (I-251, 13-oct).
  const panel = usePanelActual()
  return (
    <>
      <Text as="span" size="sm" variant="muted" className="mr-auto">
        {n === 0 ? (destino ? `Se agregarán a ${destino}` : 'Marca los objetivos que quieras agregar') : `${contar(n)}${destino ? ` · irán a ${destino}` : ''}`}
      </Text>
      <Button variant="outline" onClick={cierraElPanel && panel ? panel.cerrarPanel : onCancelar}>
        Cancelar
      </Button>
      <Button disabled={n === 0} onClick={() => onAgregar(banco.buildObjectives(pesoLibre))}>
        Agregar {n > 0 ? `(${n})` : ''}
      </Button>
    </>
  )
}

function DrawerBanco({ abierto, onAbiertoChange, alcance, pesoLibre, onAgregar, titulo = 'Banco de objetivos', destino }: BancoObjetivosProps) {
  const banco = useObjectiveBank(alcance)
  return (
    <DrawerShell
      open={abierto}
      onOpenChange={onAbiertoChange}
      conCambios={banco.selectedCount > 0}
      size="lg"
      icon={LibraryIcon}
      title={titulo}
      description="Explora los objetivos de UBITS por área y tema, y elige los que quieras agregar."
      headerExtra={
        <div className="border-b px-5 py-3">
          <FiltrosBanco banco={banco} />
        </div>
      }
      footer={
        <Pie
          banco={banco}
          pesoLibre={pesoLibre}
          destino={destino}
          cierraElPanel
          onCancelar={() => onAbiertoChange(false)}
          onAgregar={(objetivos) => {
            if (objetivos.length === 0) return
            onAgregar(objetivos)
            onAbiertoChange(false)
          }}
        />
      }
    >
      <ListaBanco banco={banco} />
    </DrawerShell>
  )
}

export function BancoObjetivos(props: BancoObjetivosProps): JSX.Element {
  // Una sesión por apertura: al volver a abrir, filtros, búsqueda y marcas empiezan de cero.
  const [sesion, setSesion] = useState({ abierto: props.abierto, cuenta: 0 })
  if (sesion.abierto !== props.abierto) setSesion({ abierto: props.abierto, cuenta: props.abierto ? sesion.cuenta + 1 : sesion.cuenta })
  return <DrawerBanco key={sesion.cuenta} {...props} />
}

export interface PanelBancoProps {
  /** El controlador del banco: `useObjectiveBank(alcance)` en quien monta el panel. */
  banco: ObjectiveBankController
  /** Con `onAgregar`, el panel trae su propio pie (conteo, «Cancelar» y «Agregar (n)»). */
  pesoLibre?: number
  onAgregar?: (objetivos: Objective[]) => void
  onCancelar?: () => void
  destino?: string
}

export function PanelBanco({ banco, pesoLibre = 0, onAgregar, onCancelar, destino }: PanelBancoProps): JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <FiltrosBanco banco={banco} />
      <ListaBanco banco={banco} />
      {onAgregar ? (
        <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-3">
          <Pie banco={banco} pesoLibre={pesoLibre} destino={destino} onCancelar={onCancelar ?? banco.clearSelection} onAgregar={onAgregar} />
        </div>
      ) : null}
    </div>
  )
}
