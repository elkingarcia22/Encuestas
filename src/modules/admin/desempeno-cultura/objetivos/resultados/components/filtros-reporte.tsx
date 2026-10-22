import { Button, FramePanel, Text } from '@ubits/flux-ui'
import { FiltroChip } from '@/modules/design-system/navegacion/filtro-chip'
import { BotonFiltros } from '../../../encuestas/crear/components/participantes/filtros-personas'
import { MenuVerPor } from '../../../encuestas/resultados/components/controles'
import type { Collaborator } from '../../../encuestas/modelo/collaborators'
import { camposDePersona, conFiltro, type FiltrosPersona } from '../../../encuestas/modelo/filtrosPersona'
import { CORTES, type Corte } from '../../modelo/resultados/lecturas'

// Los controles del reporte (21-oct, como Resultados de Encuestas): no van en una barra aparte sobre la pestaña, sino en
// la cabecera de cada caja que compara grupos, a la derecha del título. «Ver por» elige cómo se agrupa (área, líder,
// país…) y es de toda la pantalla, como el demográfico de Encuestas; «Filtros» acota a quién se mira en esa caja
// (líder, rol, área, país, ciudad). Lo filtrado sale debajo de la cabecera, con el chip de filtro del sistema.

const CAMPO: Record<string, string> = { leader: 'Líder', role: 'Rol', area: 'Área', country: 'País', city: 'Ciudad' }

/** «Por área ▾»: el mismo botón con menú de las cajas de Encuestas. */
export function VerPorReporte({ corte, onCorte }: { corte: Corte; onCorte: (corte: Corte) => void }) {
  return <MenuVerPor valor={corte} opciones={CORTES} onCambio={onCorte} />
}

/** «Filtros»: a quién se mira en la caja. Las opciones salen de las personas del ciclo entero, no de lo ya filtrado. */
export function FiltrosCaja({ filtros, onFiltros, colaboradores }: { filtros: FiltrosPersona; onFiltros: (filtros: FiltrosPersona) => void; colaboradores: readonly Collaborator[] }) {
  return <BotonFiltros campos={camposDePersona(colaboradores, filtros)} descripcion="Mira esta caja solo de un líder, un rol, un área, un país o una ciudad." onCambio={(id, valor) => onFiltros(conFiltro(filtros, id, valor))} />
}

/** Los filtros puestos, debajo de la cabecera de la caja: cuántas personas quedan y un chip por filtro (como ChipsFiltro). */
export function ChipsReporte({ filtros, onFiltros, personas, total }: { filtros: FiltrosPersona; onFiltros: (filtros: FiltrosPersona) => void; personas: number; total: number }) {
  const puestos = Object.entries(filtros).filter((entrada): entrada is [string, string] => Boolean(entrada[1]))
  if (puestos.length === 0) return null
  return (
    <FramePanel className="flex flex-wrap items-center gap-2">
      <Text as="span" size="sm" variant="muted">
        {`Viendo ${personas.toLocaleString('es-CO')} de ${total.toLocaleString('es-CO')} personas`}
      </Text>
      {puestos.map(([id, valor]) => (
        <FiltroChip
          key={id}
          size="sm"
          activo
          texto={`${CAMPO[id] ?? id}: ${valor}`}
          ayuda={`Filtrar por ${(CAMPO[id] ?? 'este dato').toLowerCase()}`}
          onCambiar={(sigue) => (sigue ? undefined : onFiltros(conFiltro(filtros, id, '')))}
        />
      ))}
      <Button variant="ghost" size="xs" onClick={() => onFiltros({})}>
        Quitar todo
      </Button>
    </FramePanel>
  )
}
