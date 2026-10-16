import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { FilterIcon,
  Add01Icon,
  ArrowRight01Icon,
} from '@hugeicons/core-free-icons'
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
  FrameHeader,
  FramePanel,
  FrameTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { catalogosDe } from '@/shared/bd/catalogos'
import { useEmpresaActiva } from '@/shared/components/empresa-activa'
import { ImagenGlass } from '@/shared/components/ImagenGlass'
import { MetricasDestacadas, type Metrica } from '@/shared/components/MetricasDestacadas'
import { PrimeraVez, demoVacia } from '@/shared/components/PrimeraVez'
import { CATEGORIAS, IDIOMAS, NIVELES, TIPOS_CONTENIDO, VISIBILIDADES } from '@/shared/bd'
import { empezarDeCero, leerRecienCreado, olvidarRecienCreado, retomarBorrador } from '../crear-contenido/components/publicar'
import { BASE_LMS, type ClaseCreacion } from '../crear-contenido/components/borrador'
import { aFilas, type Fila } from './components/vista'
import { CuadriculaView, ListaView } from './components/views'
import { CambioDeVista, ModalFiltros, type VistaLista } from './components/controles-lista'

// Los cuatro criterios del modal. Cadena vacía = sin filtrar.
type Filtros = { tipo: string; categoria: string; nivel: string; idioma: string; visibilidad: string }

const SIN_FILTROS: Filtros = { tipo: '', categoria: '', nivel: '', idioma: '', visibilidad: '' }

// La vista vive en la dirección: `#tabla` abre la tabla y se puede compartir; sin hash, la cuadrícula de siempre.
const HASH_TABLA = '#tabla'
const vistaDelHash = (): VistaLista => (window.location.hash === HASH_TABLA ? 'tabla' : 'cuadricula')

// RN-06: el primario abre un menú con las tres formas de crear. Contenido y evento abren el asistente en blanco.
//
// Cada opción dice qué es, no solo cómo se llama: un menú de tres palabras obliga a adivinar la diferencia entre un
// curso y una ruta. Las descripciones y las ilustraciones son las de la exploración 1.
const CREAR: { tipo: string; descripcion: string; glass: string; destino?: string; clase: ClaseCreacion }[] = [
  {
    tipo: 'Contenido',
    descripcion: 'Varias páginas con videos, lecturas y evaluación, a su ritmo.',
    glass: 'glass-play',
    destino: '/admin/aprendizaje/lms-creator/crear-contenido#portada',
    clase: 'contenido',
  },
  {
    tipo: 'Ruta de aprendizaje',
    descripcion: 'Varios contenidos en orden, para un recorrido más largo.',
    glass: 'glass-discovery',
    destino: '/admin/aprendizaje/lms-creator/crear-ruta#portada',
    clase: 'ruta',
  },
  {
    tipo: 'Evento',
    descripcion: 'Una formación en sitio o en vivo, con sesiones y asistencia.',
    glass: 'glass-calendar',
    destino: '/admin/aprendizaje/lms-creator/crear-evento#portada',
    clase: 'evento',
  },
]

const VISIBILIDAD_CREADO: Record<string, Fila['visibilidad']> = {
  borrador: 'Borrador',
  publico: 'Publicado',
  privado: 'Privado',
  oculto: 'Oculto',
}

// Cada criterio del modal: su etiqueta, sus opciones y el texto cuando está vacío.
/** El plan de almacenamiento de la empresa. Dato de maqueta: 10 GB contratados y un cuarto gastado. */
const ALMACENAMIENTO = { usado: 2.5, total: 10 }

const CRITERIOS = [
  { key: 'tipo' as const, label: 'Tipo de contenido', vacio: 'Todos los tipos', opciones: TIPOS_CONTENIDO.map((t) => t.nombre) },
  { key: 'categoria' as const, label: 'Categoría', vacio: 'Todas las categorías', opciones: CATEGORIAS.map((c) => c.nombre) },
  { key: 'nivel' as const, label: 'Nivel', vacio: 'Todos los niveles', opciones: NIVELES.map((n) => n.nombre) },
  { key: 'idioma' as const, label: 'Idioma', vacio: 'Todos los idiomas', opciones: IDIOMAS },
  { key: 'visibilidad' as const, label: 'Visibilidad', vacio: 'Todas las visibilidades', opciones: VISIBILIDADES },
]

// Ordena por la columna elegida; «-campo» es descendente.
function ordenarContenidos<T extends Record<string, unknown>>(lista: T[], orden: string | undefined) {
  if (!orden) return lista
  const desc = orden.startsWith('-')
  const campo = desc ? orden.slice(1) : orden
  return [...lista].sort((a, b) => {
    const cmp = String(a[campo] ?? '').localeCompare(String(b[campo] ?? ''), 'es', { numeric: true })
    return desc ? -cmp : cmp
  })
}

const numero = (valor: number) => valor.toLocaleString('es-CO')

const sinTildes = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// LMS Creator › Contenidos: la lista de todos los contenidos de la empresa, con búsqueda,
// filtros en modal y dos formas de verlos: lista y cuadrícula.
// Reglas de negocio: HU «Listado de contenidos LMS Creator» (RN-01 a RN-06).
export function Component() {
  const [vista, setVista] = useState<VistaLista>(vistaDelHash)
  // El orden lo pide el encabezado de la tabla («campo» o «-campo»); la cuadrícula no tiene.
  const [orden, setOrden] = useState<string | undefined>()
  // Catálogo recién estrenado: `?demo=vacio` enseña el estado de primera vez.
  const [consulta] = useSearchParams()
  const sinNada = demoVacia(consulta)
  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState<Filtros>(SIN_FILTROS)
  // Lo que el creador va marcando en el modal no filtra la lista hasta que pulsa Aplicar.
  const [pendientes, setPendientes] = useState<Filtros>(SIN_FILTROS)
  const [modalAbierto, setModalAbierto] = useState(false)
  // 10, 20 o 50: las medidas del paginador del sistema, el mismo en la tabla y en la cuadrícula.
  const [porPagina, setPorPagina] = useState(10)
  const [pagina, setPagina] = useState(1)
  // Al limpiar, la tabla vuelve a empezar (también su buscador, que la librería guarda por dentro).
  const [version, setVersion] = useState(0)
  const navigate = useNavigate()
  // El contenido que se acaba de crear en el asistente: aparece de primero, con su tarjeta, y un aviso de éxito.
  const [recienCreado] = useState(leerRecienCreado)
  const avisado = useRef(false)

  // El hash sigue a la vista, sin crear entradas de historial: así la dirección siempre dice lo que se está viendo.
  useEffect(() => {
    const quiere = vista === 'tabla' ? HASH_TABLA : ''
    if (window.location.hash === quiere) return
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${quiere}`)
  }, [vista])

  // Cada vista lleva su buscador y su orden por dentro (la tabla de la librería no deja pasarle el texto): al cambiar de
  // una a otra empiezan limpios, y no queda un filtro invisible sobre una lista cuyo campo está vacío. Lo de «Filtrar»
  // sí se conserva, que es de la pantalla.
  useEffect(() => {
    setBusqueda('')
    setOrden(undefined)
    setPagina(1)
  }, [vista])

  // Y al revés: pegar la dirección o usar atrás/adelante cambia la vista.
  useEffect(() => {
    const alCambiar = () => setVista(vistaDelHash())
    window.addEventListener('hashchange', alCambiar)
    return () => window.removeEventListener('hashchange', alCambiar)
  }, [])

  useEffect(() => {
    if (!recienCreado || avisado.current) return
    avisado.current = true
    olvidarRecienCreado()
    // Sin aviso: el que lo cuenta es el del asistente, que además dice cómo se llama y que queda en borrador. Aquí
    // solo se abre la cuadrícula para que el recién creado se vea de primero (Dave, 1-oct).
    setVista('cuadricula')
  }, [recienCreado])

  // Los catálogos de la empresa en la que estás. Casi todas tienen uno y entonces no hay nada que elegir; UBITS
  // tiene dos, y es de donde sale el selector de la cabecera (RN-12).
  const empresaId = useEmpresaActiva()
  const catalogos = useMemo(() => catalogosDe(empresaId), [empresaId])
  const [catalogoId, setCatalogoId] = useState(catalogos[0].id)
  const catalogo = catalogos.find((c) => c.id === catalogoId) ?? catalogos[0]
  // Al cambiar de empresa, el catálogo elegido ya no existe: se vuelve al primero suyo.
  useEffect(() => {
    setCatalogoId(catalogos[0].id)
    setPagina(1)
  }, [catalogos])
  const FILAS = useMemo(() => aFilas(catalogo.contenidos), [catalogo])

  const enAlcance = useMemo<Fila[]>(() => {
    if (sinNada) return []
    if (!recienCreado) return FILAS
    const base = FILAS.find((f) => f.id === 'f007') ?? FILAS[0]
    const nuevo: Fila = {
      ...base,
      id: recienCreado.id,
      titulo: recienCreado.titulo,
      imagen: recienCreado.imagen,
      minutos: recienCreado.minutos,
      tipo: recienCreado.evento ? 'Evento' : base.tipo,
      // Sin categoría queda sin categoría: no se hereda la de la fila de ejemplo.
      categoriaId: recienCreado.categoriaId,
      categoria: recienCreado.categoria,
      visibilidad: VISIBILIDAD_CREADO[recienCreado.visibilidad] ?? 'Borrador',
      creacion: new Date().toISOString().slice(0, 10),
    }
    return [nuevo, ...FILAS]
  }, [FILAS, recienCreado, sinNada])

  const contenidos = useMemo(() => {
    const q = sinTildes(busqueda.trim())
    return enAlcance.filter((contenido) => {
      if (filtros.tipo && contenido.tipo !== filtros.tipo) return false
      if (filtros.categoria && contenido.categoria !== filtros.categoria) return false
      if (filtros.nivel && contenido.nivel !== filtros.nivel) return false
      if (filtros.idioma && contenido.idioma !== filtros.idioma) return false
      if (filtros.visibilidad && contenido.visibilidad !== filtros.visibilidad) return false
      if (!q) return true
      return [contenido.titulo, contenido.tipo, contenido.nivel, contenido.visibilidad, contenido.categoria, contenido.idioma].some((campo) =>
        sinTildes(campo).includes(q),
      )
    })
  }, [enAlcance, filtros, busqueda])

  // Cuatro indicadores: cuánto espacio queda del plan y en qué estado está lo que hay —publicado, privado, en
  // borrador—. Hubo una «Finalización media»; se quitó el 6-oct porque habla de consumo, que es asunto de
  // Reportes, no de la pantalla donde se crea.
  const metricas: Metrica[] = useMemo(() => {
    // Tres estados y su parte del total: el anillo dice de un vistazo cuánto pesa cada uno sin tener que dividir.
    const reparto = (estado: string) => {
      const cuantos = enAlcance.filter((c) => c.visibilidad === estado).length
      return { cuantos, parte: enAlcance.length ? Math.round((cuantos / enAlcance.length) * 100) : 0 }
    }
    const publicado = reparto('Publicado')
    const privado = reparto('Privado')
    const borrador = reparto('Borrador')

    return [
      {
        // Dato de maqueta: el plan de la empresa y lo que lleva gastado. Cuando haya datos reales salen de ahí.
        id: 'almacenamiento',
        titulo: 'Almacenamiento',
        // La cifra grande es el porcentaje, que es lo que la donita está contando; los GB van debajo, que es el
        // dato con el que se actúa cuando toca ampliar el plan (Dave, 6-oct).
        valor: `${Math.round((ALMACENAMIENTO.usado / ALMACENAMIENTO.total) * 100)} %`,
        ayuda: 'Lo que ocupan los videos, los PDF y los SCORM que ha subido tu empresa, sobre el total de tu plan. No cuenta el catálogo de UBITS, que no vive en tu espacio.',
        detalle: `${ALMACENAMIENTO.usado.toLocaleString('es-CO')} GB de ${ALMACENAMIENTO.total} GB`,
        // El anillo de avance, el mismo de «Días abiertas en promedio» del home de Vacantes: el círculo entero es
        // el total contratado y el relleno, lo gastado.
        avance: Math.round((ALMACENAMIENTO.usado / ALMACENAMIENTO.total) * 100),
      },
      {
        id: 'publicados',
        titulo: 'Publicados',
        valor: numero(publicado.cuantos),
        ayuda: 'Contenidos que cualquier colaborador de la empresa encuentra en el catálogo.',
        detalle: `${publicado.parte} % del catálogo`,
        anillo: publicado.parte,
        color: 'var(--color-success)',
      },
      {
        id: 'privados',
        titulo: 'Privados',
        valor: numero(privado.cuantos),
        ayuda: 'Publicados solo para los colaboradores que elegiste. No salen en el catálogo general: quien los tiene los encuentra en Zona de estudio › Exclusivo para mí.',
        detalle: `${privado.parte} % del catálogo`,
        anillo: privado.parte,
        color: 'var(--color-info)',
      },
      {
        id: 'borradores',
        titulo: 'En borrador',
        valor: numero(borrador.cuantos),
        ayuda: 'Trabajo en construcción que todavía no ve nadie fuera del equipo que crea.',
        detalle: `${borrador.parte} % del catálogo`,
        anillo: borrador.parte,
        color: 'var(--color-warning)',
      },
    ]
  }, [enAlcance])

  // La página se recorta sobre lo ya filtrado; si el filtro deja menos páginas, se vuelve a la última.
  const paginas = Math.max(1, Math.ceil(contenidos.length / porPagina))
  const actual = Math.min(pagina, paginas)
  const ordenados = useMemo(() => ordenarContenidos(contenidos, orden), [contenidos, orden])
  const enPagina = ordenados.slice((actual - 1) * porPagina, actual * porPagina)

  // RN-04: el badge del botón Filtrar cuenta criterios activos, no filas.
  const criteriosActivos = CRITERIOS.filter((criterio) => filtros[criterio.key]).length

  // RN-01: cada visibilidad abre un destino distinto, y son dos trabajos distintos (Dave, 13-oct).
  // - **Borrador**: está a medias, así que abre el asistente de creación con lo que ya se había llenado.
  // - **Cualquier otro estado**: ya está publicado y lo que se quiere es mirar cómo va, así que abre **Resultados**.
  //   Para cambiarlo está el botón «Editar» de esa pantalla, que es una decisión consciente y no el efecto de un clic.
  const abrir = (contenido: Fila) => {
    if (contenido.visibilidad !== 'Borrador') return navigate(`${BASE_LMS}/contenidos/${contenido.id}/resultados`)
    retomarBorrador(contenido)
    navigate(`${BASE_LMS}/crear-contenido`)
  }

  // Empezar algo nuevo. Lo comparten el menú «Crear contenido» y las tarjetas de «Crea algo nuevo»: las tres abren el
  // mismo asistente, cada una con su clase.
  const crear = (opcion: (typeof CREAR)[number]) => {
    if (!opcion.destino) return notify(`Crear ${opcion.tipo.toLowerCase()}`, undefined, 'info')
    empezarDeCero(opcion.clase)
    navigate(opcion.destino)
  }

  const limpiarTodo = () => {
    setFiltros(SIN_FILTROS)
    setPendientes(SIN_FILTROS)
    setBusqueda('')
    setPagina(1)
    setVersion((v) => v + 1)
  }

  return (
    <PageShell width="default">
      <PageHeader
        title="Contenidos"
        description="Crea, edita y elimina los contenidos de capacitación de tu empresa."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* RN-12: solo si la empresa tiene más de un catálogo. Con uno —el caso de casi todos los clientes— no
                se muestra nada, porque no hay nada que elegir. */}
            {catalogos.length > 1 ? (
              <Select value={catalogoId} onValueChange={(v) => v && setCatalogoId(v)}>
                {/* 36 px, el alto del botón de la cabecera, y no los 40 de un campo. Nuestros campos van a 40 por la
                      regla global de `src/index.css`, pero el botón principal de un listado mide 36 **en todas** las
                      cabeceras del playground y eso no se toca por una pantalla. La regla global ya exceptúa a mano lo
                      que «vive en una fila de botones pequeños y no es un campo de formulario» —el buscador de las
                      tablas, a 32—: esto es lo mismo, un control de la fila de acciones (Dave, 6-oct). */}
                <SelectTrigger aria-label="Catálogo" className="h-9! w-56">
                  <SelectValue>{(v: string) => catalogos.find((c) => c.id === v)?.nombre}</SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false} className="w-72">
                  {catalogos.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="items-start py-2">
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="font-medium">{c.nombre}</span>
                        <Text as="span" size="xs" variant="muted" className="leading-snug">
                          {c.descripcion}
                        </Text>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button />}>
                <HugeiconsIcon icon={Add01Icon} size={16} />
                Crear contenido
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>¿Qué quieres crear?</DropdownMenuLabel>
                  {CREAR.map((opcion) => (
                    <DropdownMenuItem
                      key={opcion.tipo}
                      className="items-start gap-3 py-2"
                      onClick={() => crear(opcion)}
                    >
                      <ImagenGlass nombre={opcion.glass} tamano={36} className="-my-0.5" />
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="font-medium">{opcion.tipo}</span>
                        <span className="text-xs leading-snug text-muted-foreground">{opcion.descripcion}</span>
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <PageContent>
        {/* Qué se puede crear, a la vista: el mismo marco de «Empieza con una plantilla» de Vacantes, con las tarjetas
            de la exploración 2. Sin esto hay que abrir el menú para enterarse de que existen las rutas y los eventos. */}
        <Frame>
          <FrameHeader>
            <FrameTitle>Crea algo nuevo</FrameTitle>
          </FrameHeader>
          <FramePanel>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {CREAR.map((opcion) => (
                <Button
                  key={opcion.tipo}
                  variant="outline"
                  onClick={() => crear(opcion)}
                  // `cursor-pointer`: el navegador le pone la flecha a los `button`, y estas tarjetas se leen como las del
                  // catálogo, que sí cambian a manita al pasar por encima.
                  className="group h-auto! cursor-pointer items-start! justify-start! gap-3! rounded-xl! p-3! text-left! whitespace-normal!"
                >
                  <ImagenGlass nombre={opcion.glass} tamano={44} />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex items-center gap-1 text-sm font-medium">
                      {opcion.tipo}
                      <HugeiconsIcon icon={ArrowRight01Icon} size={14} className="opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                    </span>
                    <span className="text-xs leading-snug font-normal text-muted-foreground">{opcion.descripcion}</span>
                  </span>
                </Button>
              ))}
            </div>
          </FramePanel>
        </Frame>

        {sinNada ? null : <MetricasDestacadas metricas={metricas} etiqueta="Resumen del catálogo" />}
        {sinNada ? (
          <Frame>
            <FramePanel>
            <PrimeraVez
              icono="glass-add"
              titulo="Todavía no hay contenidos"
              descripcion="Cuando crees el primero aparecerá aquí, con su tipo, su nivel y quién puede verlo."
              accion={{ texto: 'Crear contenido', icono: Add01Icon, onClick: () => crear(CREAR[0]) }}
            />
            </FramePanel>
          </Frame>
        ) : (
          <div className="flex flex-col gap-3">
            {/* «Filtrar» y el cambio de vista van encima del marco y no dentro de su cabecera: la tabla de la librería no
                deja poner controles propios ahí. Así, además, no se mueven al pasar de una vista a otra. */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button
                variant={criteriosActivos ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => {
                  setPendientes(filtros)
                  setModalAbierto(true)
                }}
              >
                <HugeiconsIcon icon={FilterIcon} size={16} aria-hidden="true" />
                Filtrar
                {criteriosActivos ? (
                  <Badge variant="secondary" size="xs">
                    {criteriosActivos}
                  </Badge>
                ) : null}
              </Button>
              <CambioDeVista vista={vista} onCambio={setVista} />
            </div>

            {vista === 'tabla' ? (
              <ListaView
                contenidos={enPagina}
                onAbrir={abrir}
                onLimpiar={limpiarTodo}
                busqueda={busqueda}
                filtrosActivos={criteriosActivos}
                onBuscar={(valor) => {
                  setBusqueda(valor)
                  setPagina(1)
                }}
                paginacion={{ pagina: actual, setPagina, porPagina, setPorPagina, total: contenidos.length }}
                onOrdenar={(nuevo) => {
                  setOrden(nuevo)
                  setPagina(1)
                }}
                version={version}
              />
            ) : (
              <CuadriculaView
                contenidos={enPagina}
                onAbrir={abrir}
                onLimpiar={limpiarTodo}
                busqueda={busqueda}
                filtrosActivos={criteriosActivos}
                onBuscar={(valor) => {
                  setBusqueda(valor)
                  setPagina(1)
                }}
                paginacion={{ pagina: actual, setPagina, porPagina, setPorPagina, total: contenidos.length }}
              />
            )}
          </div>
        )}
      </PageContent>

      {/* Modal de filtros: los cuatro criterios juntos, se aplican de una vez. */}
      <ModalFiltros
        abierto={modalAbierto}
        onAbiertoChange={setModalAbierto}
        criterios={CRITERIOS}
        pendientes={pendientes}
        onCambiar={(key, valor) => setPendientes((previos) => ({ ...previos, [key]: valor }))}
        onBorrar={() => {
          setPendientes(SIN_FILTROS)
          setFiltros(SIN_FILTROS)
          setPagina(1)
          setModalAbierto(false)
        }}
        onAplicar={() => {
          setFiltros(pendientes)
          setPagina(1)
          setModalAbierto(false)
        }}
      />
    </PageShell>
  )
}

Component.displayName = 'AdminAprendizajeLmsCreatorContenidosPage'
