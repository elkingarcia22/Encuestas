import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Download04Icon, MoreHorizontalIcon, MoreVerticalIcon, Mortarboard01Icon } from '@hugeicons/core-free-icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Frame,
  FramePanel,
  Progress,
  Text,
  type DataGridListConfig,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { notify } from '@/shared/components/notify'
import { SinResultados } from '@/shared/components/SinResultados'
import { TarjetaContenido } from '@/shared/components/TarjetaContenido'
import { CeldaTitulo } from '@/modules/design-system/data-grid/celda-titulo'
import { SIN_ARRASTRE } from '@/modules/design-system/data-grid/casos/sin-arrastre'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { CambioDeVista, MarcoCuadricula, type VistaLista } from '@/modules/admin/aprendizaje/lms-creator/contenidos/components/controles-lista'
import { abrirContenido, filtrar, type Tarjeta } from './datos'

// La lista de contenidos de Plan de contenidos, Exclusivo para mí e Historial y certificados, con el mismo cambio
// «Tabla | Cuadrícula» de LMS Creator › Contenidos (decisión 2a de Cristian, 9-oct: «puedo verlo como tabla o como
// card»). Por defecto la cuadrícula de tarjetas; la tabla es `TablaDatos` (decisiones 1 y 2 de la auditoría, 5-oct), con
// la portada junto al nombre (`CeldaTitulo`) y el buscador, el orden y los filtros en la tabla y en cada columna. Las dos
// vistas van en el marco gris del sistema y con su paginador (`PiePaginacion`); ninguna es `MarcoTabla`. El historial
// suma el estado del certificado y la manera de descargarlo.

type Fila = Tarjeta & { minutos: number; certificado: string }
type Filtro = { id: string; value: unknown }
type Columnas = DataGridListConfig<Fila>['columns']

/** El estado del certificado de una fila, en las mismas palabras de la celda. */
const estadoCertificado = (t: Tarjeta) => (!t.conCertificado ? 'No aplica' : t.progreso >= 100 ? 'Disponible' : 'Pendiente')
const descargable = (t: Tarjeta) => t.conCertificado && t.progreso >= 100

const noDisponible = () => notify('Esta acción aún no está disponible en el Playground.', undefined, 'info')

const unicos = (valores: string[]) => [...new Set(valores.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'))
const opciones = (valores: string[]) => unicos(valores).map((v) => ({ label: v, value: v }))
const marcados = (filtros: Filtro[], id: string) => {
  const valor = filtros.find((f) => f.id === id)?.value
  return Array.isArray(valor) ? valor.map(String) : []
}

function ordenar(filas: Fila[], orden: string | undefined) {
  if (!orden) return filas
  const desc = orden.startsWith('-')
  const campo = (desc ? orden.slice(1) : orden) as keyof Fila
  return [...filas].sort((a, b) => {
    const va = a[campo]
    const vb = b[campo]
    const r = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va ?? '').localeCompare(String(vb ?? ''), 'es')
    return desc ? -r : r
  })
}

// ── Celdas ───────────────────────────────────────────────────────────────────────────────────────────────────────

const texto = (valor: string, gris = false) => (
  <Text as="span" size="sm" variant={gris ? 'muted' : undefined}>
    {valor}
  </Text>
)

function CeldaProgreso({ fila }: { fila: Fila }) {
  return (
    <span className="flex w-full items-center gap-2.5">
      <Progress value={fila.progreso} className="flex-1" aria-label={`Progreso de ${fila.titulo}`} />
      <Text as="span" size="sm" className="w-10 shrink-0 text-right tabular-nums">
        {fila.progreso} %
      </Text>
    </span>
  )
}

// El «⋯» de la fila (el primero, con su menú al inicio): por ahora solo descargar el certificado, y solo en los
// contenidos terminados que lo entregan.
function AccionesFila({ fila }: { fila: Fila }) {
  if (!descargable(fila)) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<BotonIcono aria-label={`Acciones de ${fila.titulo}`} />}>
        <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={noDisponible}>
            <HugeiconsIcon icon={Download04Icon} size={16} aria-hidden="true" />
            Descargar certificado
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// En la tarjeta, el terciario de solo icono: tres puntos, discreto y pequeño.
function OpcionesTarjeta({ t }: { t: Tarjeta }) {
  if (!descargable(t)) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<BotonIcono size="icon-xs" aria-label={`Opciones de ${t.titulo}`} />}>
        <HugeiconsIcon icon={MoreVerticalIcon} size={16} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={noDisponible}>
            <HugeiconsIcon icon={Download04Icon} size={16} />
            Descargar certificado
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ── Columnas (fuera del componente: si no, el filtro se cierra al marcar) ────────────────────────────────────────

const NOMBRE: Columnas[number] = {
  accessorKey: 'titulo',
  header: 'Nombre del contenido',
  size: 320,
  cell: ({ row }) => (
    <CeldaTitulo
      titulo={row.original.titulo}
      detalle={row.original.proveedor}
      imagen={row.original.imagen}
      sinImagen={<HugeiconsIcon icon={Mortarboard01Icon} size={16} aria-hidden="true" />}
      onClick={abrirContenido}
    />
  ),
}
const TIPO: Columnas[number] = { accessorKey: 'tipo', header: 'Tipo de contenido', size: 150, cell: ({ row }) => texto(row.original.tipo) }
const NIVEL: Columnas[number] = { accessorKey: 'nivel', header: 'Nivel', size: 120, cell: ({ row }) => texto(row.original.nivel) }
const PROGRESO: Columnas[number] = { accessorKey: 'progreso', header: 'Progreso', size: 160, cell: ({ row }) => <CeldaProgreso fila={row.original} /> }

const COLUMNAS: Columnas = [
  NOMBRE,
  TIPO,
  { accessorKey: 'competencia', header: 'Competencia', size: 170, cell: ({ row }) => texto(row.original.competencia) },
  NIVEL,
  { accessorKey: 'minutos', header: 'Duración', size: 110, cell: ({ row }) => texto(row.original.duracion) },
  { accessorKey: 'idioma', header: 'Idioma', size: 110, cell: ({ row }) => texto(row.original.idioma) },
  PROGRESO,
]

const COLUMNAS_HISTORIAL: Columnas = [
  NOMBRE,
  TIPO,
  NIVEL,
  PROGRESO,
  {
    accessorKey: 'certificado',
    header: 'Certificado',
    size: 140,
    cell: ({ row }) => texto(row.original.certificado, row.original.certificado !== 'Disponible'),
  },
  {
    id: 'acciones',
    header: 'Acciones',
    size: 90,
    enableSorting: false,
    enableResizing: false,
    ...SIN_ARRASTRE,
    cell: ({ row }) => <AccionesFila fila={row.original} />,
  },
]

// ── La cuadrícula ────────────────────────────────────────────────────────────────────────────────────────────────

function Cuadricula({ tarjetas, acciones }: { tarjetas: Tarjeta[]; acciones?: (t: Tarjeta) => ReactNode }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {tarjetas.map((t) => (
        <TarjetaContenido
          key={t.id}
          titulo={t.titulo}
          imagen={t.imagen}
          tipo={t.tipo}
          proveedor={t.proveedor}
          logoProveedor={t.logoProveedor}
          competencia={t.competencia}
          nivel={t.nivel}
          duracion={t.duracion}
          idioma={t.idioma}
          progreso={t.progreso}
          acciones={acciones?.(t)}
          onClick={abrirContenido}
        />
      ))}
    </div>
  )
}

export function ListaContenidos({
  tarjetas,
  vacio,
  historial = false,
  id,
  vistaInicial = 'cuadricula',
}: {
  tarjetas: Tarjeta[]
  /** Qué enseñar cuando la pestaña no tiene **nada** (no es que el filtro lo dejara fuera): su «Primera vez». */
  vacio?: ReactNode
  /** Historial y certificados: suma el certificado y la columna «Acciones». */
  historial?: boolean
  /** Enlaza «Filas por página» con su selector (una lista por pestaña). */
  id: string
  /** Con qué vista abre: la cuadrícula, salvo donde la pestaña pida otra. */
  vistaInicial?: VistaLista
}) {
  const [vista, setVista] = useState<VistaLista>(vistaInicial)
  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState<Filtro[]>([])
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  // Al limpiar, la tabla vuelve a empezar (también su buscador y sus filtros).
  const [version, setVersion] = useState(0)

  // Cada vista lleva su buscador, sus filtros y su orden por dentro (la tabla de la librería no deja pasarles el estado):
  // al cambiar de una a otra empiezan limpios, y no queda un filtro invisible sobre una lista cuyo campo está vacío.
  useEffect(() => {
    setBusqueda('')
    setFiltros([])
    setOrden(undefined)
    setPagina(1)
  }, [vista])

  const filas = useMemo<Fila[]>(
    () => tarjetas.map((t) => ({ ...t, minutos: Number.parseInt(t.duracion, 10) || 0, certificado: estadoCertificado(t) })),
    [tarjetas],
  )
  // Las opciones de cada filtro son las que hay en esta lista.
  const columnFilters = useMemo<DataGridListConfig<Fila>['columnFilters']>(
    () => [
      { id: 'tipo', label: 'Tipo de contenido', type: 'select', multiple: true, options: opciones(filas.map((f) => f.tipo)) },
      { id: 'nivel', label: 'Nivel', type: 'select', multiple: true, options: opciones(filas.map((f) => f.nivel)) },
      ...(historial
        ? [{ id: 'certificado', label: 'Certificado', type: 'select' as const, multiple: true, options: opciones(['Disponible', 'Pendiente', 'No aplica']) }]
        : []),
    ],
    [filas, historial],
  )
  const resultado = useMemo(() => {
    const tipos = marcados(filtros, 'tipo')
    const niveles = marcados(filtros, 'nivel')
    const certificados = marcados(filtros, 'certificado')
    return ordenar(
      filtrar(filas, busqueda).filter(
        (f) =>
          (!tipos.length || tipos.includes(f.tipo)) &&
          (!niveles.length || niveles.includes(f.nivel)) &&
          (!certificados.length || certificados.includes(f.certificado)),
      ),
      orden,
    )
  }, [filas, busqueda, filtros, orden])
  const paginas = Math.max(1, Math.ceil(resultado.length / porPagina))
  const actual = Math.min(pagina, paginas)
  const visibles = resultado.slice((actual - 1) * porPagina, actual * porPagina)
  const filtrosPuestos = filtros.filter((f) => Array.isArray(f.value) && f.value.length > 0).length
  const paginacion = { pagina: actual, setPagina, porPagina, setPorPagina, total: resultado.length }

  // Sin nada que listar no hay lista: buscar, filtrar y cambiar de vista no tienen sobre qué actuar.
  if (!tarjetas.length && vacio)
    return (
      <Frame>
        <FramePanel>{vacio}</FramePanel>
      </Frame>
    )

  const limpiar = () => {
    setBusqueda('')
    setFiltros([])
    setPagina(1)
    setVersion((v) => v + 1)
  }
  const alBuscar = (valor: string) => {
    setBusqueda(valor)
    setPagina(1)
  }

  const config: DataGridListConfig<Fila> = {
    columns: historial ? COLUMNAS_HISTORIAL : COLUMNAS,
    columnFilters,
    onColumnFiltersChange: (nuevos) => {
      setFiltros(nuevos)
      setPagina(1)
    },
    sort: {
      onSortChange: (nuevo) => {
        setOrden(nuevo)
        setPagina(1)
      },
    },
    search: { placeholder: 'Buscar contenidos', onSearch: alBuscar },
    emptyState: { type: 'no-results', customComponent: <SinResultados busqueda={busqueda} filtrosActivos={filtrosPuestos} onLimpiar={limpiar} /> },
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <CambioDeVista vista={vista} onCambio={setVista} />
      </div>
      {vista === 'tabla' ? (
        <TablaDatos key={version} config={config} data={visibles} paginacion={paginacion} nombre="contenidos" singular="contenido" id={id} />
      ) : (
        <MarcoCuadricula busqueda={busqueda} onBuscar={alBuscar} marcador="Buscar contenidos" paginacion={paginacion} nombre="contenidos" singular="contenido" id={id}>
          {visibles.length ? (
            <Cuadricula tarjetas={visibles} acciones={historial ? (t) => <OpcionesTarjeta t={t} /> : undefined} />
          ) : (
            <SinResultados busqueda={busqueda} onLimpiar={limpiar} />
          )}
        </MarcoCuadricula>
      )}
    </div>
  )
}
