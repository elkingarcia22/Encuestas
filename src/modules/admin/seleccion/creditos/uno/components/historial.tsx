import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Coins01Icon, Exchange01Icon } from '@hugeicons/core-free-icons'
import { IconTile, Text, type DataGridListConfig } from '@ubits/flux-ui'
import { PageSection } from '@/shared/components/PageShell'
import { SinResultados } from '@/shared/components/SinResultados'
import { CeldaTitulo } from '@/modules/design-system/data-grid/celda-titulo'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { plural } from '@/modules/design-system/patrones/formato'
import { VACANTES_UI } from '../../../propuestas/datos'
import {
  AGENTES,
  agenteDe,
  conSigno,
  creditos,
  cuandoTexto,
  diasAtras,
  fraseDe,
  vacanteDe,
  type AgenteId,
  type Movimiento,
} from '../../../propuestas/creditos'
import { IconoAgente } from '../../../propuestas/components/creditos-ui'
import { useCarga } from '@/modules/design-system/estados/carga'
import { FiltroChip } from '@/modules/design-system/navegacion/filtro-chip'

// El historial (25 sep). Hoy es un muro de tarjetas iguales en 17 páginas, con los análisis gratis de Evaluación CV
// tapando lo que cuesta. Aquí es una tabla que se lee de un vistazo —cuándo, qué pasó y cuánto costó— y arranca con
// «Solo lo que cuesta» prendido: los análisis gratis siguen a un clic, y el conteo dice cuántos esconde.
//
// 5-oct, auditoría del sistema de diseño (decisiones 1 y 2): es la tabla del sistema, `TablaDatos`. Arriba, el conteo a
// la izquierda y el buscador a la derecha; el período, el agente, la vacante y el tipo se filtran en el encabezado de su
// columna, y cada columna se ordena; abajo, el paginador de siempre. El chip «Solo lo que cuesta» no es de una columna:
// queda junto al título de la sección.

type Filtro = { id: string; value: unknown }

// Lo marcado en el filtro de una columna: la lista de valores (o el valor suelto de una selección simple).
const marcados = (filtros: Filtro[], id: string) => {
  const valor = filtros.find((filtro) => filtro.id === id)?.value
  return Array.isArray(valor) ? valor.map(String) : valor ? [String(valor)] : []
}

const PERIODOS = [
  { value: '7', label: 'Últimos 7 días' },
  { value: '30', label: 'Últimos 30 días' },
]
const TIPOS = [
  { value: 'consumo', label: 'Lo cobrado' },
  { value: 'reserva', label: 'Reservas y devoluciones' },
  { value: 'entradas', label: 'Compras y repartos' },
]

const esGratis = (m: Movimiento) => m.tipo === 'consumo' && m.agente === 'cv'

// Lo que se ordena y se filtra de cada fila: la frase del movimiento y el nombre de su vacante.
type FilaHistorial = Movimiento & { frase: string; vacante: string }

// Las columnas van fuera del componente: si no, el filtro se cierra al marcar.
const COLUMNAS: DataGridListConfig<FilaHistorial>['columns'] = [
  {
    accessorKey: 'cuando',
    header: 'Cuándo',
    size: 150,
    cell: ({ row }) => (
      <Text as="span" variant="muted" size="sm" className="tabular-nums">
        {cuandoTexto(row.original.cuando)}
      </Text>
    ),
  },
  { accessorKey: 'frase', header: 'Movimiento', size: 420, cell: ({ row }) => <CeldaMovimiento movimiento={row.original} /> },
  {
    accessorKey: 'vacante',
    header: 'Vacante',
    size: 220,
    cell: ({ row }) => (
      <Text as="span" size="sm" variant={row.original.vacante ? undefined : 'muted'} className="truncate">
        {row.original.vacante || '—'}
      </Text>
    ),
  },
  {
    accessorKey: 'creditos',
    header: 'Créditos',
    size: 180,
    cell: ({ row }) => (
      <span className="flex w-full justify-end">
        <Creditos movimiento={row.original} />
      </span>
    ),
  },
]

export function Historial({ historial }: { historial: Movimiento[] }) {
  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState<Filtro[]>([])
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [soloConCosto, setSoloConCosto] = useState(true)
  // Limpiar la búsqueda y los filtros de las columnas vuelve a montar la tabla.
  const [version, setVersion] = useState(0)

  // Los filtros de las columnas: no cambian mientras no cambie el historial (si no, el filtro se cierra al marcar).
  const filtrosDeColumna = useMemo<DataGridListConfig<FilaHistorial>['columnFilters']>(() => {
    const conMovimientos = VACANTES_UI.filter((v) => historial.some((m) => m.vacanteId === v.id))
    return [
      { id: 'cuando', label: 'Período', type: 'select', options: PERIODOS },
      { id: 'frase', label: 'Agente', type: 'select', multiple: true, options: AGENTES.map((uno) => ({ value: uno.id, label: uno.nombre })) },
      { id: 'vacante', label: 'Vacante', type: 'select', multiple: true, options: conMovimientos.map((uno) => ({ value: uno.id, label: uno.titulo })) },
      { id: 'creditos', label: 'Tipo de movimiento', type: 'select', options: TIPOS },
    ]
  }, [historial])

  const texto = busqueda.trim().toLowerCase()
  const periodo = marcados(filtros, 'cuando')[0]
  const agentes = marcados(filtros, 'frase') as AgenteId[]
  const vacantes = marcados(filtros, 'vacante')
  const tipo = marcados(filtros, 'creditos')[0]
  const filas = useMemo(
    () =>
      historial.map<FilaHistorial>((m) => ({ ...m, frase: fraseDe(m), vacante: vacanteDe(m.vacanteId)?.titulo ?? '' })),
    [historial],
  )
  const sinChip = filas.filter((m) => {
    if (periodo && diasAtras(m.cuando) >= Number(periodo)) return false
    if (agentes.length && !agentes.some((agente) => m.agente === agente || (m.tipo === 'reparto' && m.cambios?.[agente]))) return false
    if (vacantes.length && !vacantes.includes(m.vacanteId ?? '')) return false
    if (tipo === 'consumo' && m.tipo !== 'consumo') return false
    if (tipo === 'reserva' && m.tipo !== 'reserva' && m.tipo !== 'devolucion') return false
    if (tipo === 'entradas' && m.tipo !== 'compra' && m.tipo !== 'reparto') return false
    if (texto && !`${m.persona?.nombre ?? ''} ${m.vacante} ${m.frase}`.toLowerCase().includes(texto)) return false
    return true
  })
  const escondidos = soloConCosto ? sinChip.filter(esGratis).length : 0
  const visibles = ordenar(soloConCosto ? sinChip.filter((m) => !esGratis(m)) : sinChip, orden)
  const deEstaPagina = visibles.slice((pagina - 1) * porPagina, pagina * porPagina)
  // La tabla carga al entrar y cada vez que cambia lo que se pide.
  const cargando = useCarga([busqueda, filtros, orden, soloConCosto, pagina, porPagina])

  const filtrosPuestos = filtros.filter((filtro) => marcados(filtros, filtro.id).length).length + (soloConCosto ? 1 : 0)
  const limpiar = () => {
    setBusqueda('')
    setFiltros([])
    setSoloConCosto(false)
    setPagina(1)
    setVersion((antes) => antes + 1)
  }

  const config: DataGridListConfig<FilaHistorial> = {
    columns: COLUMNAS,
    columnFilters: filtrosDeColumna,
    onColumnFiltersChange: (nuevos) => {
      setFiltros(nuevos)
      setPagina(1)
    },
    sort: { onSortChange: setOrden },
    search: {
      placeholder: 'Buscar persona o vacante',
      onSearch: (q) => {
        setBusqueda(q)
        setPagina(1)
      },
    },
    // Cuántos hay y cuántos se esconden; «Solo lo que cuesta», junto al título, los vuelve a mostrar.
    frame: {
      description: `${plural(visibles.length, '1 movimiento', `${creditos(visibles.length)} movimientos`)}${
        escondidos ? ` · se esconden ${creditos(escondidos)} análisis gratis de Evaluación CV` : ''
      }`,
    },
    emptyState: { type: 'no-results', customComponent: <SinResultados busqueda={busqueda} filtrosActivos={filtrosPuestos} onLimpiar={limpiar} /> },
  }

  return (
    <PageSection
      title="Historial"
      description="Todo lo que entró, se repartió, se reservó o se cobró."
      actions={
        <FiltroChip
          activo={soloConCosto}
          onCambiar={(activo) => {
            setSoloConCosto(activo)
            setPagina(1)
          }}
          icono={Coins01Icon}
          texto="Solo lo que cuesta"
          ayuda="Esconder los análisis gratis de Evaluación CV"
        />
      }
    >
      <TablaDatos
        key={version}
        config={config}
        data={deEstaPagina}
        isLoading={cargando}
        paginacion={{ pagina, setPagina, porPagina, setPorPagina, total: visibles.length }}
        nombre="movimientos"
        singular="movimiento"
        id="historial-creditos"
      />
    </PageSection>
  )
}

// El orden de la tabla: por la columna que se pidió («-» adelante, de mayor a menor); sin orden, el más reciente primero.
function ordenar(filas: FilaHistorial[], orden: string | undefined) {
  if (!orden) return filas
  const desc = orden.startsWith('-')
  const campo = (desc ? orden.slice(1) : orden) as keyof FilaHistorial
  return [...filas].sort((a, b) => {
    const va = a[campo]
    const vb = b[campo]
    const r = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va ?? '').localeCompare(String(vb ?? ''), 'es')
    return desc ? -r : r
  })
}

// Qué pasó, con la cara del agente: la frase y, debajo en gris, con quién o cómo se repartió.
function CeldaMovimiento({ movimiento: m }: { movimiento: FilaHistorial }) {
  const agente = m.agente ? agenteDe(m.agente) : null
  const detalle =
    m.tipo === 'reparto'
      ? Object.entries(m.cambios ?? {})
          .map(([id, delta]) => `${agenteDe(id as AgenteId).nombre} ${conSigno(delta ?? 0)}`)
          .join(' · ')
      : [m.persona?.nombre, m.detalle].filter(Boolean).join(' · ')
  return (
    <span className="flex min-w-0 items-center gap-3">
      {agente ? (
        <IconoAgente agente={agente} size="sm" />
      ) : (
        <IconTile variant="soft" size="sm" className="shrink-0">
          <HugeiconsIcon icon={m.tipo === 'compra' ? Coins01Icon : Exchange01Icon} aria-hidden="true" />
        </IconTile>
      )}
      <CeldaTitulo titulo={m.frase} detalle={detalle || undefined} />
    </span>
  )
}

// Cuánto, con una sola forma para todos (5 oct, Nicolás: «esos badges de reservados casi ni se ven, la tipografía está
// súper pequeña y no sé por qué contar eso en badge»): el número arriba, del mismo tamaño en todas las filas, y debajo,
// en gris, qué fue. El signo dice hacia dónde va: «−» lo que se cobró, «+» lo que entra o vuelve; lo reservado va sin
// signo porque todavía no se cobra. Lo que no mueve créditos (lo gratis, un reparto) va en gris.
function Creditos({ movimiento: m }: { movimiento: Movimiento }) {
  const costo = m.agente ? agenteDe(m.agente).costo : 0
  if (esGratis(m)) return <Cantidad valor="0" que="gratis" apagado />
  if (m.tipo === 'reserva') return <Cantidad valor={creditos(costo)} que="reservados" />
  if (m.tipo === 'devolucion') return <Cantidad valor={`+${creditos(costo)}`} que="volvieron al agente" />
  if (m.tipo === 'reparto') return <Cantidad valor="0" que="no cambia la bolsa" apagado />
  if (m.tipo === 'compra') return <Cantidad valor={conSigno(m.creditos)} que="entraron a la bolsa" entra />
  return <Cantidad valor={conSigno(m.creditos)} que="cobrados" />
}

function Cantidad({ valor, que, apagado = false, entra = false }: { valor: string; que: string; apagado?: boolean; entra?: boolean }) {
  return (
    <span className="flex flex-col items-end">
      <Text as="span" weight="semibold" variant={apagado ? 'muted' : undefined} className={entra ? 'text-success tabular-nums' : 'tabular-nums'}>
        {valor}
      </Text>
      <Text as="span" variant="muted" size="xs">
        {que}
      </Text>
    </span>
  )
}
