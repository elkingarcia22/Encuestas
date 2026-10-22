import { useEffect, useRef, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { FileImportIcon, Xls01Icon } from '@hugeicons/core-free-icons'
import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Spinner,
} from '@ubits/flux-ui'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { cuentasDe, type LoteCvs } from '../importacion'
import { QUIEN_MUEVE } from '../movimientos'
import { EstadoLote, useImportaciones } from './importar-cvs'
import { ImagenGlass } from '@/shared/components/ImagenGlass'

// Importar candidatos a la base global («Mis candidatos»): CVs y el historial de importaciones de la base. Las reglas
// están en `importacion-base.ts`.
//
// 13 oct (reunión con la PM y el TL): a la base solo entran CVs (PDF, Word o ZIP): «la IA, para analizar si un candidato
// es bueno, necesita su experiencia». Se fueron la hoja de cálculo con su mapeo de columnas («llévatela para gestión de
// usuarios»: queda en el historial del repositorio, en `DialogoHoja` antes de este cambio) y agregar a una persona a
// mano. «Importar candidatos» abre directo la carga de CVs.
//
// - Los CVs siguen el recorrido de las vacantes (`useImportaciones` sin vacante): leer en segundo plano, revisar lo dudoso
//   y el detalle de cada lote.
// - El historial junta los lotes; cada uno abre su detalle.

export type ImportarABase = {
  // Abre la carga de CVs.
  abrir: () => void
  // Abre el historial de importaciones de la base.
  verHistorial: () => void
  // Los lotes de la base (hojas de vida y hojas de cálculo), el más nuevo primero.
  lotes: LoteCvs[]
  // Las ventanas y paneles; se pintan una vez en la página.
  dialogos: ReactNode
  // Hay una ventana abierta: los atajos de la página esperan.
  ocupado: boolean
}

export function useImportarABase(opciones: {
  ruta: string
  // Abrir la ficha de alguien de la base (desde el detalle de un lote o al terminar de agregar a mano).
  onVerFicha: (personaId: string) => void
  // Ver a quienes entraron con un lote: la página filtra la base por ese lote.
  onVerLote: (loteId: string) => void
}): ImportarABase {
  // El historial va aparte: lo que se abre desde él (importar, el detalle de un lote) se apila dentro, como drawer
  // anidado, y al cerrarlo se vuelve a él (8 oct, Nicolás: desde un panel no se abre una ventana encima).
  const [historial, setHistorial] = useState(false)

  // Lo último que pasó la página, para los avisos que se tocan después.
  const alDia = useRef(opciones)
  useEffect(() => {
    alDia.current = opciones
  })
  // Ir a una ficha o a la gente de un lote cierra lo que esté abierto encima de la página.
  const verFicha = (personaId: string) => {
    setHistorial(false)
    alDia.current.onVerFicha(personaId)
  }
  const verLote = (loteId: string) => {
    setHistorial(false)
    alDia.current.onVerLote(loteId)
  }

  // Las hojas de vida van por el recorrido de siempre, sin vacante: entran a la base.
  const importaciones = useImportaciones({ onVerEntraron: verLote, onAbrirFicha: verFicha })

  // Lo que se abre desde el historial va dentro de él, como drawer anidado; si no, sobre la página.
  const ventanas = importaciones.dialogos

  const dialogos = (
    <>
      <Historial
        abierto={historial}
        lotes={importaciones.lotes}
        onOpenChange={setHistorial}
        onVer={importaciones.ver}
        onRevisar={importaciones.revisar}
        onImportar={() => importaciones.abrir()}
        ventanas={historial ? ventanas : null}
      />
      {historial ? null : ventanas}
    </>
  )

  return {
    // Sin argumentos: `abrir` recibe los archivos ya soltados, y un clic no lo es.
    abrir: () => importaciones.abrir(),
    verHistorial: () => setHistorial(true),
    lotes: importaciones.lotes,
    dialogos,
    ocupado: historial || importaciones.ocupado,
  }
}

/* El historial de importaciones -------------------------------------------------------------------------------- */

function Historial({
  abierto,
  lotes,
  onOpenChange,
  onVer,
  onRevisar,
  onImportar,
  ventanas,
}: {
  abierto: boolean
  lotes: LoteCvs[]
  onOpenChange: (abierto: boolean) => void
  onVer: (loteId: string) => void
  onRevisar: (loteId: string) => void
  onImportar: () => void
  // Lo que se abre desde aquí (importar, el detalle de un lote): dentro, como drawer anidado.
  ventanas?: ReactNode
}) {
  const pendientes = lotes.reduce((suma, lote) => suma + cuentasDe(lote).dudosos, 0)
  return (
    <DrawerShell
      open={abierto}
      onOpenChange={onOpenChange}
      size="lg"
      kicker="Mis candidatos"
      title="Importaciones"
      description={
        lotes.length
          ? `${lotes.length === 1 ? '1 importación' : `${lotes.length} importaciones`} a tu base. ${pendientes ? `${pendientes === 1 ? '1 CV espera' : `${pendientes} CVs esperan`} que confirmes un dato.` : 'No hay nada pendiente.'}`
          : 'Los CVs que importaste a tu base.'
      }
      icon={FileImportIcon}
      footer={
        lotes.length ? (
          <Button onClick={onImportar}>
            <HugeiconsIcon icon={FileImportIcon} size={16} />
            Importar candidatos
          </Button>
        ) : undefined
      }
    >
      {lotes.length ? (
        <ItemGroup className="gap-2!">
          {lotes.map((lote) => {
            const cuentas = cuentasDe(lote)
            const esHoja = lote.tipo === 'hoja-de-calculo'
            return (
              <Item key={lote.id} variant="outline" className="cursor-pointer items-start!" onClick={() => onVer(lote.id)}>
                <ItemMedia variant="icon">
                  {lote.estado === 'leyendo' ? <Spinner /> : <HugeiconsIcon icon={esHoja ? Xls01Icon : FileImportIcon} size={18} />}
                </ItemMedia>
                <ItemContent className="min-w-0 gap-2!">
                  <span className="flex min-w-0 flex-col">
                    <ItemTitle className="w-full! truncate">{lote.nombre}</ItemTitle>
                    <ItemDescription className="truncate">
                      {[lote.id, esHoja ? 'Hoja de cálculo' : 'CVs', `${lote.quien === QUIEN_MUEVE ? 'Tú' : lote.quien}, ${lote.fecha.toLowerCase()}`].join(' · ')}
                    </ItemDescription>
                  </span>
                  <EstadoLote lote={lote} />
                </ItemContent>
                {/* La acción no abre dos veces el detalle: el clic se queda en el botón. */}
                <ItemActions onClick={(evento) => evento.stopPropagation()}>
                  {cuentas.dudosos && lote.estado === 'terminado' ? (
                    <Button size="sm" onClick={() => onRevisar(lote.id)}>
                      Revisar {cuentas.dudosos} {cuentas.dudosos === 1 ? 'dudosa' : 'dudosas'}
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => onVer(lote.id)}>
                      Ver
                    </Button>
                  )}
                </ItemActions>
              </Item>
            )
          })}
        </ItemGroup>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="default">
              <ImagenGlass nombre="glass-arrow-up-square" />
            </EmptyMedia>
            <EmptyTitle>Todavía no has importado a nadie</EmptyTitle>
            <EmptyDescription>Trae CVs en PDF, Word o un ZIP: la IA los lee y entran a tu base sin ir a ninguna vacante.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={onImportar}>
              <HugeiconsIcon icon={FileImportIcon} size={16} />
              Importar candidatos
            </Button>
          </EmptyContent>
        </Empty>
      )}
      {ventanas}
    </DrawerShell>
  )
}
