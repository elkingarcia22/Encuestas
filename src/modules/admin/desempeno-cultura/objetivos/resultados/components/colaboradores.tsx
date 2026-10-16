import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { MoreHorizontalIcon, Notification01Icon, UserIcon } from '@hugeicons/core-free-icons'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger, Progress, Text, TooltipProvider, type BulkAction, type DataGridListConfig } from '@ubits/flux-ui'
import { CeldaTitulo } from '@/modules/design-system/data-grid/celda-titulo'
import { SIN_ARRASTRE } from '@/modules/design-system/data-grid/casos/sin-arrastre'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { Badge } from '@/shared/components/Badge'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { SinResultados } from '@/shared/components/SinResultados'
import { formatoAvance } from '../../modelo/ciclos'
import { NIVELES, type PersonaSeguida, type ResultadosCiclo } from '../../modelo/resultados/seguimiento'
import { RIESGOS, TONO_NIVEL, TRAMOS_ACTUALIZACION, etiquetaNivel, filaDe, haceCuanto, ordenar, riesgoDePersona, tramoActualizacion, ultimaDe, type FilaPersona } from '../../modelo/resultados/personas'

// «Detalle por colaborador» (9-oct, como el prototipo): una fila por persona del ciclo con su avance, su estado, su
// líder, su riesgo (solo con el ciclo abierto) y cuándo reportó por última vez. Se filtra por columna, se ordena, y el
// nombre abre la ficha de la persona. Respeta los filtros del reporte de arriba. Marcar personas deja recordarles que
// actualicen su avance (pregunta antes). Sin la columna «Objetivos» del prototipo: con ella la tabla no cabe en 1.104 px
// y el «⋯» se esconde; cuántos tiene cada persona y cuántos van en meta se ve en su ficha.

type Columna = 'estado' | 'riesgo' | 'actualizacion'
type FiltrosColumna = Record<Columna, string[]>
const SIN_FILTROS: FiltrosColumna = { estado: [], riesgo: [], actualizacion: [] }

function cumple(fila: FilaPersona, filtros: FiltrosColumna) {
  const { persona } = fila
  if (filtros.estado.length && !filtros.estado.includes(etiquetaNivel(persona.nivel))) return false
  if (filtros.riesgo.length && !filtros.riesgo.includes(riesgoDePersona(persona.riesgo).etiqueta)) return false
  if (filtros.actualizacion.length && !filtros.actualizacion.includes(tramoActualizacion(ultimaDe(persona)))) return false
  return true
}

export function Colaboradores({ resultados, onAbrir, onRecordar }: { resultados: ResultadosCiclo; onAbrir: (persona: PersonaSeguida) => void; onRecordar: (personas: readonly PersonaSeguida[], soltar?: () => void) => void }) {
  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState<FiltrosColumna>(SIN_FILTROS)
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const [actual, setActual] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [version, setVersion] = useState(0)
  const soltar = () => setVersion((v) => v + 1)
  const { abierto } = resultados

  const filas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const todas = resultados.personas.map(filaDe).filter((fila) => cumple(fila, filtros))
    const buscadas = q ? todas.filter((fila) => `${fila.nombre} ${fila.persona.colaborador.role} ${fila.persona.colaborador.area} ${fila.lider}`.toLowerCase().includes(q)) : todas
    return ordenar(buscadas, orden)
  }, [resultados.personas, filtros, busqueda, orden])
  const pagina = filas.slice((actual - 1) * porPagina, actual * porPagina)

  const activos = Object.values(filtros).filter((valores) => valores.length > 0).length
  const limpiar = () => {
    setBusqueda('')
    setFiltros(SIN_FILTROS)
    setActual(1)
    soltar()
  }

  const recordar: BulkAction<FilaPersona> = {
    id: 'recordar',
    label: 'Recordar actualizar avance',
    icon: <HugeiconsIcon icon={Notification01Icon} aria-hidden="true" />,
    visibility: 'always',
    onClick: (marcadas) => onRecordar(marcadas.map((fila) => fila.persona), soltar),
  }

  const config: DataGridListConfig<FilaPersona> = {
    columns: [
      {
        accessorKey: 'nombre',
        header: 'Colaborador',
        size: 220,
        cell: ({ row }) => (
          <div className="w-0 min-w-full">
            <CeldaTitulo titulo={row.original.nombre} detalle={`${row.original.persona.colaborador.role} · ${row.original.persona.colaborador.area}`} onClick={() => onAbrir(row.original.persona)} />
          </div>
        ),
      },
      {
        accessorKey: 'avance',
        header: 'Avance',
        size: 130,
        cell: ({ row }) => {
          const { avance } = row.original.persona
          if (avance === null) {
            return (
              <Text as="span" size="xs" variant="muted">
                Sin avance
              </Text>
            )
          }
          return (
            <div className="flex items-center gap-2">
              <Progress value={Math.min(100, avance)} className="w-12" aria-label={`Avance ${formatoAvance(avance)}`} />
              <Text as="span" size="xs" variant="muted" className="w-11 text-right tabular-nums">
                {formatoAvance(avance)}
              </Text>
            </div>
          )
        },
      },
      { accessorKey: 'estado', header: 'Estado', size: 110, cell: ({ row }) => <Badge variant={TONO_NIVEL[row.original.persona.nivel]}>{row.original.estado}</Badge> },
      {
        accessorKey: 'lider',
        header: 'Líder',
        size: 130,
        cell: ({ row }) => (
          <Text as="span" size="sm" variant="muted" className="block w-0 min-w-full truncate">
            {row.original.lider}
          </Text>
        ),
      },
      // El riesgo es frente al calendario: con el ciclo cerrado ya no hay calendario por delante y la columna no dice nada.
      ...(abierto
        ? [
            {
              accessorKey: 'riesgo' as const,
              header: 'Riesgo',
              size: 100,
              cell: ({ row }: { row: { original: FilaPersona } }) => {
                const riesgo = riesgoDePersona(row.original.persona.riesgo)
                return <Badge variant={riesgo.tono}>{riesgo.etiqueta}</Badge>
              },
            },
          ]
        : []),
      {
        accessorKey: 'actualizacion',
        header: 'Último reporte',
        size: 110,
        cell: ({ row }) => (
          <Text as="span" size="sm" variant="muted">
            {haceCuanto(ultimaDe(row.original.persona))}
          </Text>
        ),
      },
      {
        id: 'acciones',
        header: 'Acciones',
        size: 64,
        enableSorting: false,
        enableResizing: false,
        ...SIN_ARRASTRE,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger render={<BotonIcono aria-label={`Acciones de ${row.original.nombre}`} />}>
              <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => onAbrir(row.original.persona)}>
                  <HugeiconsIcon icon={UserIcon} aria-hidden="true" />
                  Ver objetivos
                </DropdownMenuItem>
                {abierto ? (
                  <DropdownMenuItem onClick={() => onRecordar([row.original.persona])}>
                    <HugeiconsIcon icon={Notification01Icon} aria-hidden="true" />
                    Recordar actualizar avance
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    columnFilters: [
      { id: 'estado', label: 'Estado', type: 'select', options: NIVELES.map((nivel) => ({ label: nivel.etiqueta, value: nivel.etiqueta })), multiple: true },
      ...(abierto ? [{ id: 'riesgo', label: 'Riesgo', type: 'select' as const, options: RIESGOS.map((riesgo) => ({ label: riesgo.etiqueta, value: riesgo.etiqueta })), multiple: true }] : []),
      { id: 'actualizacion', label: 'Último reporte', type: 'select', options: TRAMOS_ACTUALIZACION.map((valor) => ({ label: valor, value: valor })), multiple: true },
    ],
    onColumnFiltersChange: (nuevos) => {
      const valor = (id: Columna) => (nuevos.find((filtro) => filtro.id === id)?.value as string[] | undefined) ?? []
      setFiltros({ estado: valor('estado'), riesgo: valor('riesgo'), actualizacion: valor('actualizacion') })
      setActual(1)
    },
    sort: {
      onSortChange: (nuevo) => {
        setOrden(nuevo)
        setActual(1)
      },
    },
    search: {
      placeholder: 'Buscar colaborador, rol o líder',
      onSearch: (query) => {
        setBusqueda(query)
        setActual(1)
      },
    },
    // Solo con el ciclo abierto hay a quién recordarle algo.
    ...(abierto ? { selection: { onSelectionChange: () => undefined }, bulkActions: [recordar] } : {}),
    labels: { dragToReorder: 'Arrastrar para reordenar la columna' },
    emptyState: { type: 'no-results', customComponent: <SinResultados busqueda={busqueda} filtrosActivos={activos} onLimpiar={limpiar} /> },
    layout: { reorderable: true, resizable: false },
  }

  return (
    <TooltipProvider delay={200}>
      <TablaDatos
        key={`${version}-${abierto}`}
        config={config}
        data={pagina}
        paginacion={{ pagina: actual, setPagina: setActual, porPagina, setPorPagina, total: filas.length }}
        nombre="colaboradores"
        singular="colaborador"
        id="colaboradores-ciclo"
      />
    </TooltipProvider>
  )
}
