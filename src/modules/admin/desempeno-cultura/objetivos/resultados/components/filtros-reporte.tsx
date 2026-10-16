import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon } from '@hugeicons/core-free-icons'
import { Button, Frame, FramePanel, Text } from '@ubits/flux-ui'
import { BotonFiltros } from '../../../encuestas/crear/components/participantes/filtros-personas'
import { MenuVerPor } from '../../../encuestas/resultados/components/controles'
import type { Collaborator } from '../../../encuestas/modelo/collaborators'
import { camposDePersona, conFiltro, type FiltrosPersona } from '../../../encuestas/modelo/filtrosPersona'
import { CORTES, type Corte } from '../../modelo/resultados/lecturas'

// «Filtros del reporte» (9-oct, como el prototipo): «Ver por» elige cómo se agrupa todo el reporte (área, líder, país…)
// y «Filtros» acota a quién se mira (líder, rol, área, país, ciudad) con el mismo botón de Participantes. Lo que se filtra
// sale como fichas con su «x»; las cifras de todas las pestañas se recalculan solo con esas personas.

const CAMPO: Record<string, string> = { leader: 'Líder', role: 'Rol', area: 'Área', country: 'País', city: 'Ciudad' }

export function FiltrosReporte({
  corte,
  onCorte,
  filtros,
  onFiltros,
  personas,
  total,
  colaboradores,
}: {
  corte: Corte
  onCorte: (corte: Corte) => void
  filtros: FiltrosPersona
  onFiltros: (filtros: FiltrosPersona) => void
  /** Cuántas personas quedan con los filtros, de cuántas tiene el ciclo. */
  personas: number
  total: number
  /** Las personas del ciclo completo: las opciones de cada filtro salen de ellas, no de lo ya filtrado. */
  colaboradores: readonly Collaborator[]
}) {
  const puestos = Object.entries(filtros).filter((entrada): entrada is [string, string] => Boolean(entrada[1]))
  return (
    <Frame>
      <FramePanel className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Text as="span" size="sm" variant="muted">
            {puestos.length ? `Viendo ${personas.toLocaleString('es-CO')} de ${total.toLocaleString('es-CO')} personas` : `Todas las personas del ciclo (${total.toLocaleString('es-CO')})`}
          </Text>
          <div className="flex flex-wrap items-center gap-2">
            <MenuVerPor valor={corte} opciones={CORTES} onCambio={onCorte} />
            <BotonFiltros campos={camposDePersona(colaboradores, filtros)} descripcion="Mira el reporte solo de un líder, un rol, un área, un país o una ciudad." onCambio={(id, valor) => onFiltros(conFiltro(filtros, id, valor))} />
          </div>
        </div>
        {puestos.length ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {puestos.map(([id, valor]) => (
              <Button key={id} variant="secondary" size="xs" onClick={() => onFiltros(conFiltro(filtros, id, ''))} aria-label={`Quitar el filtro ${CAMPO[id] ?? id}: ${valor}`}>
                {CAMPO[id] ?? id}: {valor}
                <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" />
              </Button>
            ))}
            <Button variant="ghost" size="xs" onClick={() => onFiltros({})}>
              Quitar filtros
            </Button>
          </div>
        ) : null}
      </FramePanel>
    </Frame>
  )
}
