import { createContext, useContext, useMemo, useRef, useState, type MouseEvent } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDataTransferHorizontalIcon, FileImportIcon, UserRemove01Icon } from '@hugeicons/core-free-icons'
import { Button, Text, type DataGridListConfig, type ListColumnFilter } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { Hint } from '@/shared/components/Hint'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { SIN_ARRASTRE } from '@/modules/design-system/data-grid/casos/sin-arrastre'
import { ESPERANDO_ACCION, tituloEtapa, type Candidatura, type VacanteUI } from '../datos'
import { movimientosDe } from '../movimientos'
import { resumenDeEvaluaciones } from '../perfil-candidato'
import { useCarga } from '@/modules/design-system/estados/carga'
import { useFilasQueEntran } from './animacion'
import { MenuTarjeta, type Tablero } from './tablero-candidatos'
import type { Proceso } from './use-proceso'

// La vista «Lista» de los candidatos de una vacante (16 oct, Nicolás: sí al cambio Lista/Tablero del patrón «Tablero con
// vistas» de Cristian). La misma gente que el tablero —las mismas vistas de arriba (todos, esperando acción, en proceso)—
// en la tabla del sistema, para cuando hay mucha y se quiere comparar u ordenar: por nombre, etapa, puntaje o días en la
// etapa. La etapa se filtra desde su columna, el «⋯» de cada fila es el de la tarjeta y con varias elegidas se mueven de
// etapa o se rechazan desde la cabecera de la tabla. Toda la fila abre la ficha, como la tarjeta.

const puntajeDe = (c: Candidatura) => resumenDeEvaluaciones(c, movimientosDe(c.id)).promedio

type Contexto = { vacante: VacanteUI | null; proceso: Proceso | null; abiertaId: string | null; onAbrir: (c: Candidatura) => void; soloLectura: boolean }
const ContextoLista = createContext<Contexto>({ vacante: null, proceso: null, abiertaId: null, onAbrir: () => undefined, soloLectura: true })

// El nombre, que abre la ficha, y debajo lo que pide atención y de dónde viene.
function CeldaCandidato({ candidatura }: { candidatura: Candidatura }) {
  const { abiertaId, onAbrir } = useContext(ContextoLista)
  const { candidato } = candidatura
  return (
    <span className="flex w-0 min-w-full flex-col gap-0.5" data-abierta={abiertaId === candidatura.id || undefined}>
      {/* El nombre como enlace dentro de la celda, sin el alto ni el relleno de botón (diferencias.json › button-enlace-en-linea). */}
      <Button variant="link" size="sm" className="h-auto! min-w-0 shrink justify-start! p-0!" onClick={() => onAbrir(candidatura)}>
        <span className="truncate">{candidato.nombre}</span>
      </Button>
      <span className="flex min-w-0 items-center gap-1.5">
        {ESPERANDO_ACCION(candidatura) ? (
          <Hint label={candidato.accion} side="top">
            <Badge variant="warning-light" className="shrink-0">
              Esperando acción
            </Badge>
          </Hint>
        ) : null}
        <Text as="span" variant="muted" size="xs" className="truncate">
          {candidato.cargo} · {candidato.empresa}
        </Text>
      </span>
    </span>
  )
}

function CeldaPuntaje({ candidatura }: { candidatura: Candidatura }) {
  const puntaje = puntajeDe(candidatura)
  return puntaje === null || puntaje === undefined ? (
    <Text as="span" variant="muted" size="sm">
      Sin puntaje
    </Text>
  ) : (
    <Text as="span" size="sm" className="tabular-nums">
      {puntaje}
    </Text>
  )
}

function MenuFila({ candidatura }: { candidatura: Candidatura }) {
  const { vacante, proceso, onAbrir, soloLectura } = useContext(ContextoLista)
  if (!vacante || !proceso) return null
  return <MenuTarjeta vacante={vacante} proceso={proceso} candidatura={candidatura} arrastrable={!soloLectura} onAbrir={() => onAbrir(candidatura)} />
}

// Fuera del componente: si cambian en cada pintada, el globo del filtro se cierra al marcar.
const COLUMNAS: DataGridListConfig<Candidatura>['columns'] = [
  { id: 'nombre', accessorFn: (c) => c.candidato.nombre, header: 'Candidato', size: 320, cell: ({ row }) => <CeldaCandidato candidatura={row.original} /> },
  {
    accessorKey: 'etapa',
    header: 'Etapa',
    size: 230,
    cell: ({ row }) => (
      <Text as="span" size="sm" className="block w-0 min-w-full truncate">
        {tituloEtapa(row.original.etapa)}
      </Text>
    ),
  },
  { id: 'puntaje', accessorFn: (c) => puntajeDe(c) ?? -1, header: 'Puntaje', size: 130, cell: ({ row }) => <CeldaPuntaje candidatura={row.original} /> },
  {
    accessorKey: 'dias',
    header: 'En la etapa',
    size: 150,
    cell: ({ row }) => {
      const c = row.original
      return (
        <Text as="span" variant="muted" size="sm">
          {c.importada || c.postulada ? 'Entró hoy' : c.dias === 0 ? 'Llegó hoy' : `${c.dias} ${c.dias === 1 ? 'día' : 'días'}`}
        </Text>
      )
    },
  },
  { id: 'acciones', header: 'Acciones', size: 96, enableSorting: false, enableResizing: false, ...SIN_ARRASTRE, cell: ({ row }) => <MenuFila candidatura={row.original} /> },
]

type Filtro = { id: string; value: unknown }

// La tabla no avisa del clic en una fila: el contenedor se lo pasa al nombre, que abre la ficha.
const abrirFila = (evento: MouseEvent<HTMLElement>) => {
  const tocado = evento.target as HTMLElement
  if (tocado.closest('a, button, input, label, [role="checkbox"], [role="menuitem"], [aria-haspopup]')) return
  if (window.getSelection()?.toString()) return
  tocado.closest('tbody tr')?.querySelector<HTMLElement>('td button:not([role="checkbox"])')?.click()
}

export function ListaCandidatos({
  vacante,
  proceso,
  tablero,
  abiertaId,
  onAbrir,
  onImportar,
}: {
  vacante: VacanteUI
  proceso: Proceso
  tablero: Tablero
  abiertaId: string | null
  onAbrir: (candidatura: Candidatura) => void
  onImportar: () => void
}) {
  const [filtros, setFiltros] = useState<Filtro[]>([])
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [version, setVersion] = useState(0)
  const [sinSeleccion, setSinSeleccion] = useState<Record<string, boolean>>({})
  const [elegidas, setElegidas] = useState<Candidatura[]>([])
  // Cerrada o sin permiso para mover, la lista es de consulta: sin casillas ni acciones con varias.
  const soloLectura = vacante.estado === 'Cerrada' || proceso.bloqueo !== null

  // La misma gente que el tablero con lo puesto arriba (la vista, la búsqueda, el lote), en el orden de sus etapas.
  const etapas = vacante.etapas
  const lugar = useMemo(() => new Map(etapas.map((etapa, indice) => [etapa.id, indice])), [etapas])
  const resultado = useMemo(() => {
    const marcadas = (filtros.find((filtro) => filtro.id === 'etapa')?.value as string[] | undefined) ?? []
    const gente = tablero.enOrden.filter((c) => !marcadas.length || marcadas.includes(c.etapa))
    if (!orden) return gente
    const alReves = orden.startsWith('-')
    const campo = alReves ? orden.slice(1) : orden
    const valor = (c: Candidatura): number | string =>
      campo === 'nombre' ? c.candidato.nombre : campo === 'etapa' ? (lugar.get(c.etapa) ?? 0) : campo === 'puntaje' ? (puntajeDe(c) ?? -1) : c.dias
    return [...gente].sort((a, b) => {
      const va = valor(a)
      const vb = valor(b)
      const r = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'es')
      return alReves ? -r : r
    })
  }, [tablero.enOrden, filtros, orden, lugar])
  const paginas = Math.max(1, Math.ceil(resultado.length / porPagina))
  const actual = Math.min(pagina, paginas)
  const enPagina = useMemo(() => resultado.slice((actual - 1) * porPagina, actual * porPagina), [resultado, actual, porPagina])
  const cargando = useCarga({ vista: tablero.filtros.vista, busqueda: tablero.filtros.busqueda, filtros, orden, actual, porPagina })
  const caja = useRef<HTMLDivElement>(null)
  useFilasQueEntran(caja, { vista: tablero.filtros.vista, busqueda: tablero.filtros.busqueda, filtros, orden, actual, porPagina }, !cargando)

  const columnFilters = useMemo<ListColumnFilter[]>(
    () => [{ id: 'etapa', label: 'Etapa', type: 'select', multiple: true, options: etapas.map((etapa) => ({ label: etapa.titulo, value: etapa.id })) }],
    [etapas],
  )

  const limpiar = () => {
    tablero.limpiar()
    setFiltros([])
    setPagina(1)
    setVersion((antes) => antes + 1)
  }
  const soltar = () => setSinSeleccion({})
  const icono = (forma: typeof FileImportIcon) => <HugeiconsIcon icon={forma} aria-hidden="true" />
  const filtrosPuestos = filtros.length + (tablero.filtros.vista !== 'todos' ? 1 : 0) + (tablero.filtros.lote ? 1 : 0)

  const config: DataGridListConfig<Candidatura> = {
    columns: COLUMNAS,
    columnFilters,
    onColumnFiltersChange: (nuevos) => {
      setFiltros(nuevos)
      setPagina(1)
    },
    sort: { onSortChange: setOrden },
    search: {
      placeholder: 'Buscar candidatos',
      onSearch: (texto) => {
        tablero.cambiar({ busqueda: texto })
        setPagina(1)
      },
    },
    labels: { dragToReorder: 'Arrastrar para reordenar la columna' },
    ...(soloLectura
      ? {}
      : {
          selection: { onSelectionChange: setElegidas },
          // Con varias: lo mismo que la barra del tablero, moverlas de etapa (eligiendo cuál) o rechazarlas.
          bulkActions: [
            {
              id: 'mover',
              label: 'Mover a otra etapa',
              icon: icono(ArrowDataTransferHorizontalIcon),
              visibility: 'always' as const,
              onClick: (filas: Candidatura[]) => proceso.elegirEtapa(filas, { alMover: soltar }),
            },
            {
              id: 'rechazar',
              label: elegidas.length === 1 ? 'Rechazar' : 'Rechazar a las elegidas',
              variant: 'destructive' as const,
              icon: icono(UserRemove01Icon),
              visibility: 'always' as const,
              onClick: (filas: Candidatura[]) => proceso.pedirRechazo(filas, soltar),
            },
          ],
        }),
    // Los dos vacíos del design system: nadie en el proceso (importar CVs) o nadie con lo puesto (limpiar).
    emptyState: proceso.dentro.length
      ? { type: 'no-results', customComponent: <SinResultados busqueda={tablero.filtros.busqueda} filtrosActivos={filtrosPuestos} onLimpiar={limpiar} /> }
      : {
          type: 'empty',
          customComponent: (
            <PrimeraVez
              icono="glass-profile"
              titulo="Todavía no hay candidatos"
              descripcion="Importa CVs y la IA les da un puntaje con lo que pide la vacante."
              accion={vacante.estado === 'Cerrada' ? undefined : { texto: 'Importar CVs', icono: FileImportIcon, onClick: onImportar }}
            />
          ),
        },
  }

  return (
    <ContextoLista.Provider value={{ vacante, proceso, abiertaId, onAbrir, soloLectura }}>
      {/* La persona abierta en la ficha, en azul suave: nada de gris para marcar. */}
      <div ref={caja} onClick={abrirFila} className="[&_tbody_tr]:cursor-pointer [&_tbody_tr:has([data-abierta])]:bg-primary/7">
        <TablaDatos
          key={version}
          config={config}
          data={enPagina}
          isLoading={cargando}
          initialRowSelection={sinSeleccion}
          paginacion={{ pagina: actual, setPagina, porPagina, setPorPagina, total: resultado.length }}
          nombre="personas"
          singular="persona"
          id="lista-candidatos"
        />
      </div>
    </ContextoLista.Provider>
  )
}
