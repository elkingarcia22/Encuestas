import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Briefcase01Icon,
  ChartLineData01Icon,
  Factory01Icon,
  HandshakeIcon,
  Megaphone01Icon,
  PaintBoardIcon,
  PlusSignIcon,
  SourceCodeIcon,
  ViewOffSlashIcon,
} from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  IconTile,
  Progress,
  Text,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  type DataGridListConfig,
  type ListColumnFilter,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { notify } from '@/shared/components/notify'
import { PageContent, PageShell } from '@/shared/components/PageShell'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import { Persona } from '@/modules/design-system/data-grid/casos/seguimiento'
import { CeldaTitulo } from '@/modules/design-system/data-grid/celda-titulo'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { plural } from '@/modules/design-system/patrones/formato'
import {
  CANDIDATURAS,
  ESPERA_RESPUESTA,
  ESTADOS_PUBLICACION,
  ESTADO_BADGE,
  ETIQUETAS,
  VACANTES_UI,
  type EstadoPublicacion,
  type VacanteUI,
} from '../../propuestas/datos'
import { usePaginacion } from '../../propuestas/components/paginacion'
import { CabeceraVacantes, PulsoSeleccion } from '../../propuestas/components/cabecera-seleccion'
import { DialogoCompartirVacante } from '../../propuestas/components/acciones-vacante'
import { CatalogoPlantillas } from '../../vacantes/components/catalogo-plantillas'
import { esPropia } from '../../vacantes/components/plantillas-propias'
import type { PlantillaCatalogo } from '../../vacantes/components/datos'
import { useCarga } from '@/modules/design-system/estados/carga'

// Exploración 1 · «La bandeja» — pantalla 1 de 2: las vacantes.
//
// La lista es una lista, no una rejilla de tarjetas: con doce vacantes lo que se necesita es comparar de un vistazo
// cuál está atascada, y las filas se comparan mejor que las tarjetas. El hoy del producto pone «+ Asignar carpeta»
// arriba de cada tarjeta y un «0 Aplicaciones» gigante doce veces; aquí el nombre del puesto manda y el dato que
// pesa es cuánta gente espera una respuesta.
//
// Las carpetas se cambian por etiquetas (decisión de Nicolás, 21 sep): una vacante puede llevar varias y se filtra
// por ellas, sin nombres cortados.

const RUTA = '/admin/seleccion/exploraciones/uno'

// Un icono por área. No es adorno: con veinte filas iguales el ojo necesita un ancla antes del texto.
export const ICONO_AREA: Record<string, typeof Briefcase01Icon> = {
  'Analítica y BI': ChartLineData01Icon,
  Producto: PaintBoardIcon,
  Operaciones: Factory01Icon,
  Ventas: HandshakeIcon,
  Tecnología: SourceCodeIcon,
  Administración: Briefcase01Icon,
  Mercadeo: Megaphone01Icon,
}

// ── La tabla ──
//
// Es la tabla del sistema (TablaDatos, decisión 1 de la auditoría, 5-oct); hasta entonces era un `MarcoTabla` propio con
// los filtros arriba en lo gris. Ahora va como la de Vacantes: el conteo a la izquierda, el buscador y «Personalizar
// columnas» a la derecha, el estado y las etiquetas se filtran desde su columna, cada columna ordena y el pie de páginas
// va en español dentro del marco. Los atajos de las cifras de arriba siguen filtrando, y el conteo dice qué grupo se ve.

type Candidatura = (typeof CANDIDATURAS)[number]

type FilaVacante = {
  id: string
  titulo: string
  estado: EstadoPublicacion
  // Cuánta gente hay en el proceso y cuánta espera una respuesta: por eso se ordenan sus columnas.
  total: number
  esperando: number
  aplicaciones: number
  responsable: string
  vacante: VacanteUI
  esperan: Candidatura[]
  porEtapa: { etapa: VacanteUI['etapas'][number]; cuantos: number }[]
  mayorEtapa: number
  masViejo: number
}

type Atajo = 'publicadas' | 'esperando'

const CONTEO_ATAJO: Record<Atajo, (n: number) => string> = {
  publicadas: (n) => `${n} ${plural(n, 'vacante publicada', 'vacantes publicadas')}`,
  esperando: (n) => `${n} ${plural(n, 'vacante', 'vacantes')} con gente esperando`,
}

// Las etiquetas ya dicen el área y la ciudad: la línea gris bajo el puesto son ellas, más la modalidad si no es una.
const detalleVacante = (vacante: VacanteUI) =>
  [...vacante.etiquetas, ...(vacante.etiquetas.includes(vacante.modalidad) ? [] : [vacante.modalidad])].join(' · ')

// Fuera del componente: si los filtros o las columnas cambian en cada pintada, el filtro de la columna se cierra al marcar.
const FILTROS: ListColumnFilter[] = [
  { id: 'estado', label: 'Estado', type: 'select', multiple: true, options: ESTADOS_PUBLICACION.map((estado) => ({ label: estado, value: estado })) },
  // Las etiquetas no tienen columna propia (son la línea gris del puesto): se filtran desde «Vacante».
  { id: 'etiquetas', columnId: 'titulo', label: 'Etiqueta', type: 'select', multiple: true, searchable: true, options: ETIQUETAS.map((etiqueta) => ({ label: etiqueta, value: etiqueta })) },
]

const columnasVacantes = (ruta: string): DataGridListConfig<FilaVacante>['columns'] => [
  {
    accessorKey: 'titulo',
    header: 'Vacante',
    size: 300,
    // El icono del área le da cara a cada fila: con veinte vacantes el ojo salta al icono antes que al texto. Al lado, la
    // celda que nombra algo en la tabla del sistema: el puesto, que abre la vacante, y su línea gris.
    cell: ({ row }) => (
      <div className="flex min-w-0 items-center gap-3">
        <IconTile variant={row.original.estado === 'Publicada' ? 'soft' : 'outline'} size="sm" className="shrink-0">
          <HugeiconsIcon icon={ICONO_AREA[row.original.vacante.area] ?? Briefcase01Icon} size={16} />
        </IconTile>
        <CeldaTitulo titulo={row.original.titulo} detalle={detalleVacante(row.original.vacante)} to={`${ruta}/${row.original.id}`} />
      </div>
    ),
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    size: 130,
    cell: ({ row }) => (
      <span className="flex flex-wrap items-center gap-1.5">
        <Badge variant={ESTADO_BADGE[row.original.estado]}>
          {row.original.estado}
        </Badge>
        {/* Fuera del portal: un icono con su explicación, no un segundo renglón de insignia. */}
        {row.original.vacante.oculta ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <span role="img" aria-label="Fuera del portal de empleo: solo la ve el equipo" className="flex size-5 items-center justify-center text-muted-foreground">
                  <HugeiconsIcon icon={ViewOffSlashIcon} size={14} />
                </span>
              }
            />
            <TooltipContent>Publicada pero fuera del portal: solo la ve el equipo</TooltipContent>
          </Tooltip>
        ) : null}
      </span>
    ),
  },
  {
    // El embudo en miniatura: una barra por etapa, del tamaño de la gente que hay en ella. De un vistazo se ve si el
    // proceso avanza o si todo está amontonado al principio.
    accessorKey: 'total',
    header: 'El proceso',
    size: 180,
    cell: ({ row }) => {
      const fila = row.original
      if (!fila.total) {
        return (
          <Text as="span" variant="muted" size="sm">
            {fila.estado === 'Borrador' ? 'Sin publicar' : 'Nadie en proceso'}
          </Text>
        )
      }
      return (
        <Tooltip>
          <TooltipTrigger
            render={
              <span className="flex w-full flex-col gap-1.5">
                <span className="flex items-end gap-1">
                  {fila.porEtapa.map(({ etapa, cuantos }) => (
                    <Progress key={etapa.id} value={fila.mayorEtapa ? (cuantos / fila.mayorEtapa) * 100 : 0} aria-label={`${cuantos} en ${etapa.titulo}`} className="min-w-0 flex-1" />
                  ))}
                </span>
                <Text as="span" variant="muted" size="sm" className="tabular-nums">
                  {fila.total} en proceso
                </Text>
              </span>
            }
          />
          <TooltipContent>{fila.porEtapa.map(({ etapa, cuantos }) => `${cuantos} ${etapa.titulo}`).join(' · ')}</TooltipContent>
        </Tooltip>
      )
    },
  },
  {
    // Quién espera, con cara y nombre: «4 esperan» no mueve a nadie; cuatro personas con su foto y doce días encima, sí.
    accessorKey: 'esperando',
    header: 'Esperan respuesta',
    size: 170,
    cell: ({ row }) => {
      const fila = row.original
      if (!fila.esperando) {
        return (
          <Text as="span" variant="muted" size="sm">
            —
          </Text>
        )
      }
      return (
        <span className="flex flex-col gap-1.5">
          <AvatarGroup className="-space-x-1.5">
            {fila.esperan.slice(0, 2).map((candidatura) => (
              <Avatar key={candidatura.id}>
                <AvatarFallback>{candidatura.candidato.iniciales}</AvatarFallback>
              </Avatar>
            ))}
            {fila.esperando > 2 ? (
              <AvatarGroupCount className="size-8 rounded-full border bg-background text-xs font-medium text-muted-foreground">+{fila.esperando - 2}</AvatarGroupCount>
            ) : null}
          </AvatarGroup>
          <Badge variant="warning-light" className="w-fit tabular-nums">
            {fila.esperando === 1 ? 'espera' : 'esperan'} · {fila.masViejo} {plural(fila.masViejo, 'día', 'días')}
          </Badge>
        </span>
      )
    },
  },
  {
    accessorKey: 'aplicaciones',
    header: 'Aplicaciones',
    size: 140,
    cell: ({ row }) => (
      <div className="flex min-w-0 flex-col gap-0.5">
        <Text as="span" size="sm" className="tabular-nums">
          {row.original.aplicaciones}
        </Text>
        {row.original.vacante.ultimaSemana ? (
          <Text as="span" variant="muted" size="xs" className="truncate tabular-nums">
            +{row.original.vacante.ultimaSemana} esta semana
          </Text>
        ) : null}
      </div>
    ),
  },
  {
    accessorKey: 'responsable',
    header: 'Responsable',
    size: 180,
    cell: ({ row }) => <Persona nombre={row.original.responsable} />,
  },
]

// La lista de vacantes, con la ruta base de la exploración que la usa: la 1 y la 2 comparten esta pantalla de entrada
// (22 sep) y solo cambian lo que pasa al abrir una vacante.
export function ListaVacantes({ ruta: RUTA }: { ruta: string }) {
  const navigate = useNavigate()
  // Las dos cifras que son atajo también funcionan desde «Mis candidatos», donde no hay tabla de vacantes que
  // filtrar: allí el atajo es un enlace que vuelve aquí con el filtro puesto (`?ver=publicadas`, `?ver=esperando`).
  const [parametros] = useSearchParams()
  const ver = parametros.get('ver')
  const [atajo, setAtajo] = useState<Atajo | null>(ver === 'publicadas' || ver === 'esperando' ? ver : null)
  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState<{ id: string; value: unknown }[]>([])
  const [orden, setOrden] = useState<string | undefined>(undefined)
  // Al limpiar desde «Sin resultados», la tabla se vuelve a montar para que su buscador y sus filtros también se borren.
  const [version, setVersion] = useState(0)
  // Crear es la creación de Vacantes de Elkin (30 sep, Nicolás: «bajemos esto en nuestra exploración 1»): «Crear
  // vacante» lleva a sus tres pasos (`${RUTA}/crear`) y «Crear con plantilla» abre su catálogo. Al publicar se vuelve
  // aquí con la vacante nueva arriba y se abre «Compartir», como en Vacantes; al crear o editar una plantilla propia se
  // vuelve con el catálogo abierto.
  const location = useLocation()
  const llegada = location.state as { publicada?: string; abrirCatalogo?: boolean } | null
  const [catalogoAbierto, setCatalogoAbierto] = useState(Boolean(llegada?.abrirCatalogo))
  const [compartiendo, setCompartiendo] = useState<VacanteUI | null>(() => VACANTES_UI.find((vacante) => vacante.id === llegada?.publicada) ?? null)
  // Una vacante creada se suma a la lista de la sesión; esto solo pide volver a dibujar para que aparezca.
  const [, refrescarLista] = useReducer((veces: number) => veces + 1, 0)
  // El aviso de la publicada sale una vez, y la dirección se limpia para que «atrás» o recargar no lo repitan.
  const avisada = useRef(false)
  useEffect(() => {
    if (!llegada || avisada.current) return
    avisada.current = true
    if (llegada.publicada && compartiendo) notify(`Publicamos «${compartiendo.titulo}»`, 'Ya recibe candidatos. Comparte el enlace para empezar.', 'success')
    navigate(location.pathname, { replace: true, state: null })
  }, [llegada, compartiendo, navigate, location.pathname])
  const usarPlantilla = (plantilla: PlantillaCatalogo) => {
    // Una propia guarda la vacante completa: se abre la creación con todo lleno. Las del catálogo abren la creación con su
    // perfil y sus etapas (13-oct, nada-que-finja: antes solo avisaban lo que harían), como en el inicio de esta exploración.
    setCatalogoAbierto(false)
    navigate(`${RUTA}/crear`, { state: esPropia(plantilla) ? { desdePlantilla: plantilla.id } : { plantillaSistema: plantilla.id } })
  }

  // Lo que hay dentro de cada vacante. Sin useMemo: la lista tiene que reflejar la vacante que se acaba de crear.
  const resumen: FilaVacante[] = VACANTES_UI.map((vacante) => {
    const dentro = CANDIDATURAS.filter((c) => c.vacante.id === vacante.id)
    const esperan = dentro.filter(ESPERA_RESPUESTA)
    const porEtapa = vacante.etapas.map((etapa) => ({ etapa, cuantos: dentro.filter((c) => c.etapa === etapa.id).length }))
    return {
      id: vacante.id,
      titulo: vacante.titulo,
      estado: vacante.estado,
      total: dentro.length,
      esperando: esperan.length,
      aplicaciones: vacante.aplicaciones,
      responsable: vacante.reclutador.nombre,
      vacante,
      esperan,
      porEtapa,
      // La etapa más llena marca el alto de las barras: el embudo se compara dentro de su propia vacante.
      mayorEtapa: Math.max(0, ...porEtapa.map((e) => e.cuantos)),
      masViejo: Math.max(0, ...esperan.map((c) => c.dias)),
    }
  })

  const elegidos = (id: string) => (filtros.find((filtro) => filtro.id === id)?.value as string[] | undefined) ?? []
  const estados = elegidos('estado')
  // El filtro de etiquetas vive en la columna «Vacante»: la tabla lo devuelve con el nombre de esa columna.
  const etiquetas = [...elegidos('titulo'), ...elegidos('etiquetas')]
  const filtrosActivos = [atajo, estados.length, etiquetas.length].filter(Boolean).length

  const visibles = resumen.filter((fila) => {
    if (atajo === 'publicadas' && fila.estado !== 'Publicada') return false
    if (atajo === 'esperando' && !fila.esperando) return false
    if (estados.length && !estados.includes(fila.estado)) return false
    if (etiquetas.length && !fila.vacante.etiquetas.some((una) => etiquetas.includes(una))) return false
    if (busqueda) {
      const texto = `${fila.vacante.titulo} ${fila.vacante.area} ${fila.vacante.sede} ${fila.vacante.etiquetas.join(' ')}`.toLowerCase()
      if (!texto.includes(busqueda.toLowerCase())) return false
    }
    return true
  })
  if (orden) {
    const desc = orden.startsWith('-')
    const campo = (desc ? orden.slice(1) : orden) as keyof FilaVacante
    visibles.sort((a, b) => {
      const valA = a[campo]
      const valB = b[campo]
      const comp = typeof valA === 'number' && typeof valB === 'number' ? valA - valB : String(valA).localeCompare(String(valB), 'es')
      return desc ? -comp : comp
    })
  }

  const paginacion = usePaginacion(visibles, 10)
  // La tabla carga al entrar y cada vez que cambia lo que muestra: la búsqueda, un filtro, el orden o la página. La
  // cabecera de la tabla y las cifras se quedan quietas y se pueden seguir usando.
  const cargando = useCarga([busqueda, filtros, orden, atajo, paginacion.pagina, paginacion.porPagina])

  const limpiar = () => {
    setBusqueda('')
    setFiltros([])
    setAtajo(null)
    setVersion((antes) => antes + 1)
    paginacion.alFiltrar()
  }

  const columnas = useMemo(() => columnasVacantes(RUTA), [RUTA])
  const config: Omit<DataGridListConfig<FilaVacante>, 'pagination'> = {
    // Con un atajo de las cifras puesto, el conteo dice qué grupo se ve (como las alertas de Vacantes).
    frame: atajo ? { description: CONTEO_ATAJO[atajo](visibles.length) } : undefined,
    columns: columnas,
    columnFilters: FILTROS,
    onColumnFiltersChange: (nuevos) => {
      setFiltros(nuevos)
      paginacion.alFiltrar()
    },
    sort: {
      onSortChange: (nuevo) => {
        setOrden(nuevo)
        paginacion.alFiltrar()
      },
    },
    search: {
      placeholder: 'Buscar por puesto, área o sede',
      onSearch: (texto) => {
        setBusqueda(texto)
        paginacion.alFiltrar()
      },
    },
    // La librería trae en inglés el nombre del asa de cada columna para los lectores de pantalla.
    labels: { dragToReorder: 'Arrastrar para reordenar la columna' },
    emptyState: resumen.length
      ? { type: 'no-results', customComponent: <SinResultados busqueda={busqueda} filtrosActivos={filtrosActivos} onLimpiar={limpiar} /> }
      : {
          type: 'empty',
          customComponent: (
            <PrimeraVez
              icono="glass-add"
              titulo="Todavía no hay vacantes"
              descripcion="Crea la primera y aquí verás cuánta gente hay en cada proceso y quién espera una respuesta tuya."
              accion={{ texto: 'Crear vacante', icono: PlusSignIcon, onClick: () => navigate(`${RUTA}/crear`) }}
            />
          ),
        },
  }

  return (
    <PageShell>
      <CabeceraVacantes ruta={RUTA} onCrear={() => navigate(`${RUTA}/crear`)} onCrearConPlantilla={() => setCatalogoAbierto(true)} />

      <PageContent>
        <PulsoSeleccion
          ruta={RUTA}
          activo={atajo}
          alFiltrar={(que) => {
            // El mismo enlace pone el atajo y lo quita.
            setAtajo((antes) => (antes === que ? null : que))
            paginacion.alFiltrar()
          }}
        />

        {/* La tabla del sistema (TablaDatos): sin título, el de la página ya lo dice. */}
        <TablaDatos
          key={version}
          id="vacantes"
          nombre="vacantes"
          singular="vacante"
          config={config}
          data={paginacion.filas}
          isLoading={cargando}
          paginacion={paginacion}
        />

        <Text as="p" variant="muted" size="xs">
          Las vacantes se agrupan con etiquetas, no con carpetas: una vacante puede llevar varias y se filtra por
          cualquiera de ellas.
        </Text>
      </PageContent>

      <CatalogoPlantillas open={catalogoAbierto} onOpenChange={setCatalogoAbierto} onUsar={usarPlantilla} base={RUTA} />

      {/* Recién publicada: compartirla de una vez, como al publicar en Vacantes. */}
      {compartiendo ? (
        <DialogoCompartirVacante
          abierto
          onAbiertoChange={(abierto) => !abierto && setCompartiendo(null)}
          titulo={compartiendo.titulo}
          conEnlace={compartiendo.estado === 'Publicada'}
          oculta={compartiendo.oculta}
          equipo={compartiendo.equipo}
          onEquipo={(equipo) => {
            compartiendo.equipo = equipo
            setCompartiendo({ ...compartiendo, equipo })
            refrescarLista()
          }}
        />
      ) : null}
    </PageShell>
  )
}

export function Component() {
  return <ListaVacantes ruta={RUTA} />
}

Component.displayName = 'SeleccionExploracionUnoVacantesPage'
