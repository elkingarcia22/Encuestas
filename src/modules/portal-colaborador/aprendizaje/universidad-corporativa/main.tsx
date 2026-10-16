import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { FilterIcon, FlashIcon, MoreHorizontalIcon, Mortarboard01Icon, Search01Icon } from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  Frame,
  FramePanel,
  Heading,
  Text,
  type DataGridListConfig,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { PageContent, PageShell } from '@/shared/components/PageShell'
import { PrimeraVez, demoVacia } from '@/shared/components/PrimeraVez'
import { TarjetaContenido } from '@/shared/components/TarjetaContenido'
import { CeldaTitulo } from '@/modules/design-system/data-grid/celda-titulo'
import { SIN_ARRASTRE } from '@/modules/design-system/data-grid/casos/sin-arrastre'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { fechaCorta } from '@/modules/design-system/patrones/formato'
import { CambioDeVista, MarcoCuadricula, ModalFiltros, type VistaLista } from '@/modules/admin/aprendizaje/lms-creator/contenidos/components/controles-lista'
import { nombreCategoria } from '@/shared/bd'
import { SinResultados } from '@/shared/components/SinResultados'
import { abrirContenido, type Sesion } from '../zona-de-estudio/components/datos'
import { opcionesCalendario, TarjetaSesion } from '../zona-de-estudio/components/pestana-eventos'
import { categoriaDeEnlace, CRITERIOS, listaVisible, sesionesCatalogo, SIN_FILTROS, type Filtros, type Item } from './components/datos'

// Aprendizaje › Universidad corporativa del colaborador (HU-APR-005): el reflejo, del lado del colaborador, de LMS
// Creator › Contenidos. Usa los mismos controles de esa lista (buscador, Filtrar, modal de filtros, cambio de vista y
// paginación) sobre los contenidos publicados. ?categoria=cfq-XXX llega con esa categoría filtrada; buscar o filtrar
// por «Sesión» trae también las sesiones de los eventos.
//
// **Tabla o cuadrícula** (decisión 2a de Cristian, 9-oct: «puedo verlo como tabla o como card»). Por defecto la cuadrícula
// de tarjetas; la tabla es `TablaDatos`, con la portada junto al nombre (`CeldaTitulo`). Las dos van en el marco gris del
// sistema y con su paginador (`PiePaginacion`); ninguna es `MarcoTabla`.

const RUTA_LMS = '/admin/aprendizaje/lms-creator/contenidos'

/** Lo que la tabla pinta de cada contenido o sesión: lo que traía su tarjeta y la categoría. */
type FilaTabla = {
  clave: string
  titulo: string
  imagen?: string
  /** La línea gris bajo el nombre: la competencia, o la fecha y el evento de una sesión. */
  detalle: string
  tipo: string
  categoria: string
  nivel: string
  /** Para ordenar por duración. */
  minutos: number
  duracion: string
  idioma: string
  sesion?: Sesion
}

const aFila = (item: Item): FilaTabla => ({
  clave: item.clave,
  titulo: item.tarjeta.titulo,
  imagen: item.tarjeta.imagen,
  detalle: item.sesion ? `${fechaCorta(item.sesion.inicio.toISOString())} · ${item.sesion.evento}` : item.tarjeta.competencia,
  tipo: item.tarjeta.tipo,
  categoria: nombreCategoria(item.categoriaId),
  nivel: item.tarjeta.nivel,
  minutos: item.sesion
    ? Math.round((item.sesion.fin.getTime() - item.sesion.inicio.getTime()) / 60000)
    : Number.parseInt(item.tarjeta.duracion, 10) || 0,
  duracion: item.tarjeta.duracion,
  idioma: item.tarjeta.idioma,
  sesion: item.sesion,
})

/** El orden que pide el encabezado de la tabla: «campo» o «-campo». */
function ordenarFilas(filas: FilaTabla[], orden: string | undefined) {
  if (!orden) return filas
  const desc = orden.startsWith('-')
  const campo = (desc ? orden.slice(1) : orden) as keyof FilaTabla
  return [...filas].sort((a, b) => {
    const va = a[campo]
    const vb = b[campo]
    const r = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va ?? '').localeCompare(String(vb ?? ''), 'es')
    return desc ? -r : r
  })
}

const texto = (valor: string) => (
  <Text as="span" size="sm">
    {valor}
  </Text>
)

// Una sesión que todavía no empieza se añade al calendario desde su «⋯», como en Zona de estudio › Eventos.
function AccionesFila({ fila }: { fila: FilaTabla }) {
  if (!fila.sesion || fila.sesion.enVivo) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<BotonIcono aria-label={`Acciones de ${fila.titulo}`} />}>
        <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Añadir a mi calendario</DropdownMenuLabel>
          {opcionesCalendario(fila.sesion).map((o) => (
            <DropdownMenuItem key={o.etiqueta} onClick={o.accion}>
              <HugeiconsIcon icon={o.icono} size={16} aria-hidden="true" />
              {o.etiqueta}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Las columnas van fuera del componente: si cambiaran en cada pintada, la tabla perdería el orden y el ancho que se le dio.
// Sin embudos por columna: los criterios se ponen desde «Filtrar», que es la misma ventana de la cuadrícula.
const COLUMNAS: DataGridListConfig<FilaTabla>['columns'] = [
  {
    accessorKey: 'titulo',
    header: 'Nombre del contenido',
    size: 320,
    cell: ({ row }) => (
      <CeldaTitulo
        titulo={row.original.titulo}
        detalle={row.original.detalle}
        imagen={row.original.imagen}
        sinImagen={<HugeiconsIcon icon={Mortarboard01Icon} size={16} aria-hidden="true" />}
        onClick={abrirContenido}
      />
    ),
  },
  {
    accessorKey: 'tipo',
    header: 'Tipo de contenido',
    size: 160,
    cell: ({ row }) => (
      <span className="flex items-center gap-2">
        {texto(row.original.tipo)}
        {row.original.sesion?.enVivo ? (
          <Badge variant="success-light" size="xs">
            En vivo
          </Badge>
        ) : null}
      </span>
    ),
  },
  { accessorKey: 'categoria', header: 'Categoría', size: 180, cell: ({ row }) => texto(row.original.categoria) },
  { accessorKey: 'nivel', header: 'Nivel', size: 120, cell: ({ row }) => texto(row.original.nivel) },
  { accessorKey: 'minutos', header: 'Duración', size: 150, cell: ({ row }) => texto(row.original.duracion) },
  { accessorKey: 'idioma', header: 'Idioma', size: 110, cell: ({ row }) => texto(row.original.idioma) },
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

export function Component() {
  const navigate = useNavigate()
  const [consulta] = useSearchParams()

  const [vista, setVista] = useState<VistaLista>('cuadricula')
  // El orden lo pide el encabezado de la tabla («campo» o «-campo»); la cuadrícula no tiene.
  const [orden, setOrden] = useState<string | undefined>()
  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState<Filtros>(() => ({
    ...SIN_FILTROS,
    categoria: categoriaDeEnlace(consulta.get('categoria') ?? consulta.get('categoriaId')),
  }))
  // Lo que se marca en el modal no filtra hasta pulsar Aplicar.
  const [pendientes, setPendientes] = useState<Filtros>(filtros)
  const [modal, setModal] = useState(false)
  // 10, 20 o 50: las medidas del paginador del sistema, el mismo en la tabla y en la cuadrícula.
  const [porPagina, setPorPagina] = useState(10)
  const [pagina, setPagina] = useState(1)
  // Al limpiar, la tabla vuelve a empezar (también su buscador, que la librería guarda por dentro).
  const [version, setVersion] = useState(0)

  // Cada vista lleva su buscador y su orden por dentro (la tabla de la librería no deja pasarle el texto): al cambiar de
  // una a otra empiezan limpios. Lo de «Filtrar» sí se conserva, que es de la pantalla.
  useEffect(() => {
    setBusqueda('')
    setOrden(undefined)
    setPagina(1)
  }, [vista])

  // Las sesiones se calculan con la hora de entrada, como en Zona de estudio › Eventos.
  const sesiones = useMemo(() => sesionesCatalogo(), [])
  // Empresa que todavía no publica nada suyo: `?demo=vacio` enseña el estado de primera vez.
  const sinNada = demoVacia(consulta)
  const lista = useMemo(() => (sinNada ? [] : listaVisible(busqueda, filtros, sesiones)), [sinNada, busqueda, filtros, sesiones])
  const filas = useMemo(() => ordenarFilas(lista.map(aFila), orden), [lista, orden])

  const paginas = Math.max(1, Math.ceil(lista.length / porPagina))
  const actual = Math.min(pagina, paginas)
  const enPagina = lista.slice((actual - 1) * porPagina, actual * porPagina)
  const filasEnPagina = filas.slice((actual - 1) * porPagina, actual * porPagina)
  const paginacion = { pagina: actual, setPagina, porPagina, setPorPagina, total: lista.length }

  const chips = CRITERIOS.filter((c) => filtros[c.key]).map((c) => ({ key: c.key, label: `${c.label}: ${filtros[c.key]}` }))

  const aplicar = (siguientes: Filtros) => {
    setFiltros(siguientes)
    setPendientes(siguientes)
    setPagina(1)
  }
  const limpiarTodo = () => {
    aplicar(SIN_FILTROS)
    setBusqueda('')
    setVersion((v) => v + 1)
  }
  const alBuscar = (valor: string) => {
    setBusqueda(valor)
    setPagina(1)
  }

  const config: DataGridListConfig<FilaTabla> = {
    columns: COLUMNAS,
    sort: {
      onSortChange: (nuevo) => {
        setOrden(nuevo)
        setPagina(1)
      },
    },
    search: { placeholder: 'Buscar contenidos o sesiones', onSearch: alBuscar },
    emptyState: { type: 'no-results', customComponent: <SinResultados busqueda={busqueda} filtrosActivos={chips.length} onLimpiar={limpiarTodo} /> },
  }

  return (
    <PageShell>
      <PageContent>
        {/* Encabezado como en el referente: el texto a la izquierda y la foto de la universidad a la derecha (arriba en
            pantallas angostas). */}
        <Frame className="overflow-hidden">
          <FramePanel className="flex overflow-hidden p-0! lg:flex-row">
          <img
            src="/images/banner-u-corporativa.jpg"
            alt=""
            className="h-44 w-full object-cover object-[center_30%] lg:order-last lg:h-auto lg:w-1/2 lg:object-center"
          />
          <div className="flex flex-col items-start justify-center gap-3 px-6 py-6 lg:w-1/2 lg:py-8">
            <Heading as="h1" level={2}>
              Contenidos de mi empresa
            </Heading>
            <Text variant="muted">Encuentra los contenidos formativos creados por la empresa, pensados para todos nuestros colaboradores.</Text>
            <Button variant="outline" className="mt-2" onClick={() => navigate(RUTA_LMS)}>
              <HugeiconsIcon icon={FlashIcon} data-icon="inline-start" aria-hidden="true" />
              Acceder a LMS Creator
            </Button>
          </div>
          </FramePanel>
        </Frame>

        {/* La lista va en el mismo marco que LMS Creator › Contenidos: conteo y buscador arriba; las tarjetas (o la tabla)
            en el panel y la paginación en el pie. */}
        {sinNada ? (
          <Frame>
            <FramePanel>
            <PrimeraVez
              icono="glass-discovery"
              titulo="Tu empresa todavía no publicó contenidos"
              descripcion="Aquí vas a ver lo que tu empresa cree para su universidad corporativa. Mientras tanto, explora el catálogo de UBITS."
              accion={{ texto: 'Explorar catálogo', icono: Search01Icon, onClick: () => navigate('/portal-colaborador/aprendizaje/catalogo') }}
            />
            </FramePanel>
          </Frame>
        ) : (
          <div className="flex flex-col gap-3">
            {/* «Filtrar» y el cambio de vista van encima del marco y no dentro de su cabecera: la tabla de la librería no
                deja poner controles propios ahí. Así, además, no se mueven al pasar de una vista a otra. */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button
                variant={chips.length ? 'secondary' : 'outline'}
                size="sm"
                aria-label={chips.length ? `Filtrar, ${chips.length} criterios aplicados` : 'Filtrar'}
                onClick={() => {
                  setPendientes(filtros)
                  setModal(true)
                }}
              >
                <HugeiconsIcon icon={FilterIcon} size={16} aria-hidden="true" />
                Filtrar
                {chips.length ? (
                  <Badge variant="secondary" size="xs">
                    {chips.length}
                  </Badge>
                ) : null}
              </Button>
              <CambioDeVista vista={vista} onCambio={setVista} />
            </div>

            {vista === 'tabla' ? (
              <TablaDatos
                key={version}
                config={config}
                data={filasEnPagina}
                paginacion={paginacion}
                nombre="contenidos"
                singular="contenido"
                id="universidad-contenidos"
              />
            ) : (
              <MarcoCuadricula
                busqueda={busqueda}
                onBuscar={alBuscar}
                marcador="Buscar contenidos o sesiones"
                paginacion={paginacion}
                nombre="contenidos"
                singular="contenido"
                id="universidad-contenidos"
              >
                {lista.length ? (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {enPagina.map((item) =>
                      item.sesion ? (
                        <TarjetaSesion key={item.clave} sesion={item.sesion} />
                      ) : (
                        <TarjetaContenido
                          key={item.clave}
                          titulo={item.tarjeta.titulo}
                          imagen={item.tarjeta.imagen}
                          tipo={item.tarjeta.tipo}
                          proveedor={item.tarjeta.proveedor}
                          logoProveedor={item.tarjeta.logoProveedor}
                          competencia={item.tarjeta.competencia}
                          nivel={item.tarjeta.nivel}
                          duracion={item.tarjeta.duracion}
                          idioma={item.tarjeta.idioma}
                          onClick={abrirContenido}
                        />
                      ),
                    )}
                  </div>
                ) : (
                  <SinResultados busqueda={busqueda} filtrosActivos={chips.length} onLimpiar={limpiarTodo} />
                )}
              </MarcoCuadricula>
            )}
          </div>
        )}
      </PageContent>

      <ModalFiltros
        abierto={modal}
        onAbiertoChange={setModal}
        criterios={CRITERIOS}
        pendientes={pendientes}
        onCambiar={(key, valor) => setPendientes((p) => ({ ...p, [key]: valor }))}
        onBorrar={() => {
          limpiarTodo()
          setModal(false)
        }}
        onAplicar={() => {
          aplicar(pendientes)
          setModal(false)
        }}
      />
    </PageShell>
  )
}

Component.displayName = 'PortalColaboradorAprendizajeUniversidadCorporativaPage'
