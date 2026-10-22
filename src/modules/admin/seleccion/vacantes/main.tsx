import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert02Icon,
  Copy01Icon,
  Delete02Icon,
  Edit02Icon,
  EyeIcon,
  FileEditIcon,
  GridViewIcon,
  MoreHorizontalIcon,
  PauseIcon,
  PlusSignIcon,
  SearchRemoveIcon,
  Share08Icon,
  UserQuestion01Icon,
} from '@hugeicons/core-free-icons'
import {
  Button,
  Field,
  FieldDescription,
  FieldLabel,
  Heading,
  IconTile,
  Input,
  Text,
  toast,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  TooltipProvider,
  type DataGridListConfig,
} from '@ubits/flux-ui'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import { Badge } from '@/shared/components/Badge'
import type { IconSvgElement } from '@hugeicons/react'
import { Persona } from '@/modules/design-system/data-grid/casos/seguimiento'
import { CeldaTitulo } from '@/modules/design-system/data-grid/celda-titulo'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { iniciales, plural } from '@/modules/design-system/patrones/formato'
import { useCargaInicial } from '@/modules/design-system/templates/admin-compartido/lista'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { CatalogoPlantillas } from './components/catalogo-plantillas'
import { esPropia } from './components/plantillas-propias'
import { IndicadoresVacantes } from './components/indicadores'
import { DialogoCompartirVacante } from '../propuestas/components/acciones-vacante'
import { buscarVacanteUI, type Miembro } from '../propuestas/datos'
import {
  DIAS_BORRADOR_OLVIDADO,
  DIAS_ESTANCADA,
  DIAS_SIN_CANDIDATOS,
  ESTADOS,
  ESTADO_BADGE,
  VACANTES,
  filaPublicada,
  type PlantillaCatalogo,
  type VacanteLista,
  type VacantePublicada,
} from './components/datos'
import { notify } from '@/shared/components/notify'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { BloqueAtencion } from '@/shared/components/BloqueAtencion'
import { BotonIcono } from '@/shared/components/BotonIcono'

// Selección › Vacantes. De arriba abajo: los tres indicadores del
// proceso, la alerta de las vacantes estancadas y el listado completo.
//
// El listado es la tabla del sistema (TablaDatos, decisión 1 de la auditoría, 5-oct): conteo, buscador y
// «Personalizar columnas» arriba, filtros por columna y el pie de páginas en español dentro del mismo marco.

const numero = (valor: number) => valor.toLocaleString('es-CO')

const rutaVacante = (id: string) => `/admin/seleccion/vacantes/${id}`

const AREAS = [...new Set(VACANTES.map((vacante) => vacante.area))].sort((a, b) => a.localeCompare(b, 'es'))

// ── Alertas: cada una filtra la tabla de abajo a ese mismo grupo ──

type TipoAlerta = 'accionRequerida' | 'estancadas' | 'sinCandidatos' | 'borradores'

type Alerta = {
  tipo: TipoAlerta
  icono: IconSvgElement
  tono: 'text-destructive' | 'text-warning' | 'text-info'
  titulo: string
  detalle: string
}

// La tabla ya no lleva título (la de TablaDatos no lo pone): con una alerta elegida, el conteo de arriba dice qué grupo se ve.
const CONTEO_ALERTA: Record<TipoAlerta, (n: number) => string> = {
  accionRequerida: (n) => `${numero(n)} ${plural(n, 'vacante', 'vacantes')} con candidatos por atender`,
  estancadas: (n) => `${numero(n)} ${plural(n, 'vacante estancada', 'vacantes estancadas')}`,
  sinCandidatos: (n) => `${numero(n)} ${plural(n, 'vacante', 'vacantes')} sin candidatos`,
  borradores: (n) => `${numero(n)} ${plural(n, 'borrador', 'borradores')} sin publicar`,
}

// Etiqueta corta para la franja resumen (colapsada): más breve que el título de la tabla.
const RESUMEN_ALERTA: Record<TipoAlerta, string> = {
  accionRequerida: 'Candidatos por atender',
  estancadas: 'Vacantes estancadas',
  sinCandidatos: 'Sin candidatos',
  borradores: 'Borradores sin publicar',
}

// ── Menú de cada fila ──
// Propio y no el `actions.item` de DataGridList: el de la librería no pinta «Eliminar» en rojo, no usa el botón
// redondo de solo icono y deja el menú tan angosto que parte cada acción en dos líneas.

type AccionFila = 'abrir' | 'editar' | 'duplicar' | 'compartir' | 'pausar' | 'eliminar'

function MenuDeFila({ vacante, onAccion }: { vacante: VacanteLista; onAccion: (accion: AccionFila, vacante: VacanteLista) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<BotonIcono aria-label={`Acciones de ${vacante.titulo}`} />}>
        <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => onAccion('abrir', vacante)} disabled={!vacante.conDetalle}>
            <HugeiconsIcon icon={EyeIcon} aria-hidden="true" />
            Ver candidatos
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAccion('editar', vacante)}>
            <HugeiconsIcon icon={Edit02Icon} aria-hidden="true" />
            Editar vacante
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAccion('duplicar', vacante)}>
            <HugeiconsIcon icon={Copy01Icon} aria-hidden="true" />
            Duplicar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAccion('compartir', vacante)}>
            <HugeiconsIcon icon={Share08Icon} aria-hidden="true" />
            Compartir
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onAccion('pausar', vacante)} disabled={vacante.estado !== 'Publicada'}>
          <HugeiconsIcon icon={PauseIcon} aria-hidden="true" />
          Pausar publicación
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => onAccion('eliminar', vacante)}>
          <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
          Eliminar vacante
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ── Bloques de la pantalla ──

export function Component() {
  const navigate = useNavigate()
  const [cargando] = useCargaInicial()
  const location = useLocation()
  // Al guardar o eliminar una plantilla propia se vuelve aquí con el catálogo abierto, para verla en su lista.
  const [catalogoAbierto, setCatalogoAbierto] = useState(() => Boolean((location.state as { abrirCatalogo?: boolean } | null)?.abrirCatalogo))
  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState<{ id: string; value: unknown }[]>([])
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const [actual, setActual] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [filtroAlerta, setFiltroAlerta] = useState<TipoAlerta | null>(null)

  const [recienPublicada] = useState(() => {
    const publicada = (location.state as { publicada?: VacantePublicada } | null)?.publicada
    return publicada ? filaPublicada(publicada) : null
  })
  const [filas, setFilas] = useState<VacanteLista[]>(() => (recienPublicada ? [recienPublicada, ...VACANTES] : VACANTES))
  const [compartir, setCompartir] = useState<VacanteLista | null>(recienPublicada)
  // Quién tiene acceso a cada vacante que se compartió: arranca con el equipo que ya tiene (o, si no tiene ficha, con quien la
  // lleva como dueño del proceso), igual que en la cabecera de la vacante.
  const [equipos, setEquipos] = useState<Record<string, Miembro[]>>({})
  const equipoDe = (vacante: VacanteLista): Miembro[] =>
    equipos[vacante.id] ??
    buscarVacanteUI(vacante.id)?.equipo ?? [
      { nombre: vacante.reclutador, iniciales: iniciales(vacante.reclutador), correo: `${vacante.reclutador.split(' ')[0].toLowerCase()}@ubits.com`, permiso: 'Dueña del proceso' },
    ]
  // Una o varias (desde la selección). Con una se escribe su nombre para confirmar; con varias, «eliminar».
  const [porEliminar, setPorEliminar] = useState<VacanteLista[] | null>(null)
  // Cambia para montar la tabla de nuevo y soltar la selección después de una acción masiva.
  const [versionTabla, setVersionTabla] = useState(0)
  const [seleccion, setSeleccion] = useState<VacanteLista[]>([])
  const [textoEliminar, setTextoEliminar] = useState('')

  const avisoPublicada = useRef(false)
  useEffect(() => {
    if (!recienPublicada || avisoPublicada.current) return
    avisoPublicada.current = true
    notify(`Publicamos «${recienPublicada.titulo}»`, 'Ya recibe candidatos. Comparte el enlace para empezar.', 'success')
    navigate(location.pathname, { replace: true, state: null })
  }, [recienPublicada, navigate, location.pathname])

  const unaPorEliminar = porEliminar?.length === 1 ? porEliminar[0] : null
  const palabraEliminar = unaPorEliminar ? unaPorEliminar.titulo : 'eliminar'
  const listoParaEliminar = porEliminar !== null && textoEliminar.trim().toLowerCase() === palabraEliminar.toLowerCase()

  const conAccionRequerida = useMemo(() => filas.filter((vacante) => vacante.porRevisar > 0), [filas])
  const estancadas = useMemo(() => filas.filter((vacante) => vacante.estado === 'Publicada' && vacante.diasAbierta >= DIAS_ESTANCADA), [filas])
  const sinCandidatos = useMemo(() => filas.filter((vacante) => vacante.estado === 'Publicada' && vacante.aplicaciones === 0 && vacante.diasAbierta >= DIAS_SIN_CANDIDATOS), [filas])
  const borradoresOlvidados = useMemo(() => filas.filter((vacante) => vacante.estado === 'Borrador' && vacante.diasDesdeCreacion >= DIAS_BORRADOR_OLVIDADO), [filas])

  const grupos: Record<TipoAlerta, VacanteLista[]> = {
    accionRequerida: conAccionRequerida,
    estancadas,
    sinCandidatos,
    borradores: borradoresOlvidados,
  }

  const alertas: Alerta[] = useMemo(() => {
    const totalPorRevisar = conAccionRequerida.reduce((total, vacante) => total + vacante.porRevisar, 0)
    const lista: (Alerta | false)[] = [
      conAccionRequerida.length > 0 && {
        tipo: 'accionRequerida',
        icono: UserQuestion01Icon,
        tono: 'text-destructive',
        titulo: `${numero(totalPorRevisar)} ${plural(totalPorRevisar, 'candidato espera', 'candidatos esperan')} una acción tuya`,
        detalle: `En ${conAccionRequerida.length} ${plural(conAccionRequerida.length, 'vacante', 'vacantes')}: revisar su hoja de vida, agendar entrevista o enviar oferta.`,
      },
      estancadas.length > 0 && {
        tipo: 'estancadas',
        icono: Alert02Icon,
        tono: 'text-warning',
        titulo: `${estancadas.length} ${plural(estancadas.length, 'vacante lleva', 'vacantes llevan')} más de ${DIAS_ESTANCADA} días sin cerrarse`,
        detalle: 'Revisa si hay que ajustar el perfil, el rango salarial o los canales de publicación.',
      },
      sinCandidatos.length > 0 && {
        tipo: 'sinCandidatos',
        icono: SearchRemoveIcon,
        tono: 'text-info',
        titulo: `${sinCandidatos.length} ${plural(sinCandidatos.length, 'vacante', 'vacantes')} sin ningún candidato en más de ${DIAS_SIN_CANDIDATOS} días`,
        detalle: 'El canal de publicación o los requisitos podrían estar limitando quién aplica.',
      },
      borradoresOlvidados.length > 0 && {
        tipo: 'borradores',
        icono: FileEditIcon,
        tono: 'text-info',
        titulo: `${borradoresOlvidados.length} ${plural(borradoresOlvidados.length, 'borrador lleva', 'borradores llevan')} más de ${DIAS_BORRADOR_OLVIDADO} días sin publicarse`,
        detalle: 'Termínalos o archívalos para que no se pierdan en la lista.',
      },
    ]
    return lista.filter((alerta): alerta is Alerta => alerta !== false)
  }, [conAccionRequerida, estancadas, sinCandidatos, borradoresOlvidados])

  const alternarFiltro = (tipo: TipoAlerta) => {
    setFiltroAlerta((previo) => (previo === tipo ? null : tipo))
    setActual(1)
  }

  const usarPlantilla = (plantilla: PlantillaCatalogo) => {
    // Una propia guarda la vacante completa: se abre el flujo de crear con todo lleno.
    if (esPropia(plantilla)) {
      navigate('/admin/seleccion/vacantes/crear', { state: { desdePlantilla: plantilla.id } })
      return
    }
    notify(`Usarías «${plantilla.nombre}»`, `Punto de partida con el perfil y las ${plantilla.etapas} etapas del proceso ya armadas.`, 'info')
    setCatalogoAbierto(false)
  }

  const base = filtroAlerta ? grupos[filtroAlerta] : filas
  const resultado = useMemo(() => {
    let filtrado = [...base]
    if (busqueda) {
      const q = busqueda.toLowerCase()
      filtrado = filtrado.filter(v => v.titulo.toLowerCase().includes(q) || v.area.toLowerCase().includes(q) || v.sede.toLowerCase().includes(q))
    }
    for (const f of filtros) {
      if (!f.value) continue
      if (f.id === 'estado' && Array.isArray(f.value) && f.value.length > 0) {
        filtrado = filtrado.filter(v => (f.value as string[]).includes(v.estado))
      }
      if (f.id === 'area' && Array.isArray(f.value) && f.value.length > 0) {
        filtrado = filtrado.filter(v => (f.value as string[]).includes(v.area))
      }
    }
    if (orden) {
      const desc = orden.startsWith('-')
      const campo = (desc ? orden.slice(1) : orden) as keyof VacanteLista
      filtrado.sort((a, b) => {
        const valA = a[campo]
        const valB = b[campo]
        const comp = typeof valA === 'number' && typeof valB === 'number' ? valA - valB : String(valA).localeCompare(String(valB), 'es')
        return desc ? -comp : comp
      })
    }
    return filtrado
  }, [base, busqueda, filtros, orden])

  const paginaActual = useMemo(() => resultado.slice((actual - 1) * porPagina, actual * porPagina), [resultado, actual, porPagina])

  const ejecutar = (accion: AccionFila, vacante: VacanteLista) => {
    if (accion === 'abrir') navigate(rutaVacante(vacante.id))
    if (accion === 'editar') toast.add({ type: 'info', title: 'Editar vacante', description: `Aquí se abriría el formulario de «${vacante.titulo}».` })
    if (accion === 'duplicar') notify('Vacante duplicada', `Creamos un borrador a partir de «${vacante.titulo}».`, 'success')
    if (accion === 'compartir') setCompartir(vacante)
    if (accion === 'pausar') notify('Publicación pausada', `«${vacante.titulo}» deja de recibir candidatos.`, 'success')
    if (accion === 'eliminar') {
      setTextoEliminar('')
      setPorEliminar([vacante])
    }
  }

  const soltarSeleccion = () => setVersionTabla((version) => version + 1)
  const cuantas = (n: number) => `${numero(n)} ${plural(n, 'vacante', 'vacantes')}`

  const duplicarVarias = (vacantes: VacanteLista[]) => {
    notify(`Duplicamos ${cuantas(vacantes.length)}`, 'Quedaron como borradores para que las ajustes antes de publicar.', 'success')
    soltarSeleccion()
  }

  const pausarVarias = (vacantes: VacanteLista[]) => {
    const publicadas = vacantes.filter((vacante) => vacante.estado === 'Publicada')
    if (publicadas.length === 0) {
      notify('Ninguna está publicada', 'Solo se pausan las vacantes que están recibiendo candidatos.', 'info')
      return
    }
    setFilas((actuales) => actuales.map((vacante) => (publicadas.some((p) => p.id === vacante.id) ? { ...vacante, estado: 'Pausada' } : vacante)))
    notify(
      `Pausamos ${cuantas(publicadas.length)}`,
      publicadas.length < vacantes.length ? `Las otras ${numero(vacantes.length - publicadas.length)} no estaban publicadas.` : 'Dejan de recibir candidatos.',
      'success',
    )
    soltarSeleccion()
  }

  const eliminarVarias = (vacantes: VacanteLista[]) => {
    setTextoEliminar('')
    setPorEliminar(vacantes)
  }

  const eliminarVacante = () => {
    if (!porEliminar) return
    const ids = new Set(porEliminar.map((vacante) => vacante.id))
    setFilas((actuales) => actuales.filter((v) => !ids.has(v.id)))
    if (unaPorEliminar) notify('Vacante eliminada', `«${unaPorEliminar.titulo}» y su historial ya no están disponibles.`, 'success')
    else notify(`Eliminamos ${cuantas(porEliminar.length)}`, 'Sus aplicaciones y su historial ya no están disponibles.', 'success')
    setPorEliminar(null)
    soltarSeleccion()
  }

  // Configuración de DataGridList
  const config = useMemo<DataGridListConfig<VacanteLista>>(() => ({
    frame: {
      description: filtroAlerta ? CONTEO_ALERTA[filtroAlerta](resultado.length) : undefined,
      // Como en el design system (Data grid): las acciones de la selección van en la cabecera de la tabla, junto al
      // buscador, y no en una barra flotante.
      toolbar: 'header',
    },
    columns: [
      {
        accessorKey: 'titulo',
        header: 'Vacante',
        size: 230,
        // La celda que nombra algo en la tabla del sistema: título (enlace al detalle si lo tiene) y el área debajo.
        cell: ({ row }) => (
          <CeldaTitulo
            titulo={row.original.titulo}
            detalle={row.original.area}
            to={row.original.conDetalle ? rutaVacante(row.original.id) : undefined}
          />
        ),
      },
      {
        accessorKey: 'estado',
        header: 'Estado',
        size: 130,
        cell: ({ row }) => <Badge variant={ESTADO_BADGE[row.original.estado]}>{row.original.estado}</Badge>,
      },
      {
        accessorKey: 'sede',
        header: 'Sede',
        size: 160,
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-0.5">
            <Text as="span" size="sm" className="truncate">{row.original.sede}</Text>
            <Text as="span" variant="muted" size="xs" className="truncate">{row.original.modalidad}</Text>
          </div>
        ),
      },
      {
        accessorKey: 'aplicaciones',
        header: 'Aplicaciones',
        size: 140,
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-0.5">
            <Text as="span" size="sm" className="tabular-nums">{numero(row.original.aplicaciones)}</Text>
            <Text as="span" variant="muted" size="xs" className="truncate">
              {row.original.nuevos > 0 ? `${numero(row.original.nuevos)} en la última semana` : 'Sin movimiento'}
            </Text>
          </div>
        ),
      },
      {
        accessorKey: 'diasAbierta',
        header: 'Días abierta',
        size: 120,
        cell: ({ row }) =>
          row.original.estado === 'Borrador' ? (
            <Text as="span" variant="muted" size="sm">Sin publicar</Text>
          ) : (
            <Text as="span" size="sm" className="tabular-nums">{numero(row.original.diasAbierta)}</Text>
          ),
      },
      {
        accessorKey: 'reclutador',
        header: 'Reclutador',
        size: 160,
        cell: ({ row }) => <Persona nombre={row.original.reclutador} />,
      },
      {
        id: 'acciones',
        header: 'Acciones',
        size: 96,
        enableSorting: false,
        enableResizing: false,
        enableColumnOrdering: false,
        cell: ({ row }) => <MenuDeFila vacante={row.original} onAccion={ejecutar} />,
      },
    ],
    columnFilters: [
      {
        id: 'estado',
        label: 'Estado',
        type: 'select',
        options: ESTADOS.map((e) => ({ label: e, value: e })),
        multiple: true,
      },
      {
        id: 'area',
        label: 'Área',
        type: 'select',
        options: AREAS.map((e) => ({ label: e, value: e })),
        multiple: true,
      },
    ],
    onColumnFiltersChange: (nuevosFiltros) => {
      setFiltros(nuevosFiltros)
      setActual(1)
    },
    sort: {
      onSortChange: (nuevoOrden) => {
        setOrden(nuevoOrden)
        setActual(1)
      },
    },
    search: {
      placeholder: 'Buscar por cargo, área o sede',
      onSearch: (query) => {
        setBusqueda(query)
        setActual(1)
      },
    },
    // Sin `pagination`: la de la librería viene en inglés. El pie en español lo pone TablaDatos.
    selection: { onSelectionChange: setSeleccion },
    // La librería trae en inglés el nombre del asa de cada columna para los lectores de pantalla.
    labels: { dragToReorder: 'Arrastrar para reordenar la columna' },
    // Con una vacante marcada salen las mismas acciones que en su menú de tres puntos; con varias, solo las que se
    // pueden hacer a la vez. Van en `bulkActions` para decidir cuál se ve con una y cuál con varias.
    bulkActions: [
      { id: 'abrir', label: 'Ver candidatos', icon: <HugeiconsIcon icon={EyeIcon} aria-hidden="true" />, visibility: 'single-only', disabled: !seleccion[0]?.conDetalle, onClick: ([vacante]) => ejecutar('abrir', vacante) },
      { id: 'editar', label: 'Editar vacante', icon: <HugeiconsIcon icon={Edit02Icon} aria-hidden="true" />, visibility: 'single-only', onClick: ([vacante]) => ejecutar('editar', vacante) },
      { id: 'duplicar', label: 'Duplicar', icon: <HugeiconsIcon icon={Copy01Icon} aria-hidden="true" />, visibility: 'always', onClick: (vacantes) => (vacantes.length === 1 ? ejecutar('duplicar', vacantes[0]) : duplicarVarias(vacantes)) },
      { id: 'compartir', label: 'Compartir', icon: <HugeiconsIcon icon={Share08Icon} aria-hidden="true" />, visibility: 'single-only', onClick: ([vacante]) => ejecutar('compartir', vacante) },
      {
        id: 'pausar',
        label: 'Pausar publicación',
        icon: <HugeiconsIcon icon={PauseIcon} aria-hidden="true" />,
        visibility: 'always',
        disabled: !seleccion.some((vacante) => vacante.estado === 'Publicada'),
        onClick: pausarVarias,
      },
      { id: 'eliminar', label: seleccion.length > 1 ? 'Eliminar vacantes' : 'Eliminar vacante', variant: 'destructive', icon: <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />, visibility: 'always', onClick: eliminarVarias },
    ],
    emptyState: (busqueda || filtros.length > 0)
      ? {
          // Vacíos con su ilustración glass (13-oct): sin resultados con «Limpiar», o todavía nada.
          type: 'no-results',
          customComponent: (
            <SinResultados
              busqueda={busqueda}
              filtrosActivos={filtros.length}
              onLimpiar={() => {
                setBusqueda('')
                setFiltros([])
                setActual(1)
              }}
            />
          ),
        }
      : {
          type: 'empty',
          customComponent: <PrimeraVez icono="glass-bag" titulo="Todavía no hay vacantes" descripcion="Crea la primera vacante para empezar." />,
        },
    layout: {
      reorderable: true,
      resizable: true,
    },
  }), [filtroAlerta, resultado.length, busqueda, filtros, actual, porPagina, ejecutar, seleccion])

  return (
    <PageShell>
      <PageHeader
        title="Vacantes"
        description="Aquí publicas los cargos abiertos y sigues a los candidatos de cada proceso."
        actions={
          <>
            <Button variant="outline" onClick={() => setCatalogoAbierto(true)}>
              <HugeiconsIcon icon={GridViewIcon} aria-hidden="true" />
              Crear con plantilla
            </Button>
            <Button onClick={() => navigate('/admin/seleccion/vacantes/crear')}>
              <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />
              Crear vacante
            </Button>
          </>
        }
      />

      <PageContent>
        <IndicadoresVacantes filas={filas} />

        {/* La franja plegable es la pieza compartida BloqueAtencion (nació aquí): cada aviso filtra la tabla a su grupo. */}
        <BloqueAtencion
          etiqueta="Lo que necesita tu atención"
          alertas={alertas.map((alerta) => ({
            id: alerta.tipo,
            icono: alerta.icono,
            tono: alerta.tono,
            titulo: alerta.titulo,
            detalle: alerta.detalle,
            resumen: RESUMEN_ALERTA[alerta.tipo],
            onVer: () => alternarFiltro(alerta.tipo),
            etiquetaAccion: filtroAlerta === alerta.tipo ? 'Ver todas' : 'Ver',
          }))}
        />

        {/* Los tooltips de la tabla (acciones masivas) salen a los 200 ms, como los del resto del playground. */}
        <TooltipProvider delay={200}>
          <TablaDatos
            key={versionTabla}
            id="vacantes"
            nombre="vacantes"
            singular="vacante"
            config={config}
            data={paginaActual}
            isLoading={cargando}
            paginacion={{ pagina: actual, setPagina: setActual, porPagina, setPorPagina, total: resultado.length }}
          />
        </TooltipProvider>

      </PageContent>

      <CatalogoPlantillas open={catalogoAbierto} onOpenChange={setCatalogoAbierto} onUsar={usarPlantilla} />

      {/* La misma ventana de Compartir de la cabecera de la vacante (H-220, H-248). */}
      {compartir ? (
        <DialogoCompartirVacante
          abierto
          onAbiertoChange={(abierto) => !abierto && setCompartir(null)}
          titulo={compartir.titulo}
          conEnlace={compartir.estado === 'Publicada'}
          equipo={equipoDe(compartir)}
          onEquipo={(equipo) => setEquipos((previos) => ({ ...previos, [compartir.id]: equipo }))}
        />
      ) : null}

      {/* En la ventana única del sistema (ActionDialog, decisión 4 de la auditoría): título fijo y lo que se elimina en
          la primera línea del cuerpo, con el campo para escribir su nombre debajo. */}
      <ActionDialog
        open={porEliminar !== null}
        onOpenChange={(abierto) => (abierto ? undefined : setPorEliminar(null))}
        size="sm"
        media={
          <IconTile variant="soft" size="sm">
            <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
          </IconTile>
        }
        title={unaPorEliminar ? 'Eliminar vacante' : 'Eliminar vacantes'}
        sub={`Se borran sus ${numero((porEliminar ?? []).reduce((suma, vacante) => suma + vacante.aplicaciones, 0))} aplicaciones y todo su historial. No se puede recuperar.`}
        lead={
          <Heading as="h3" level={6}>
            {unaPorEliminar ? unaPorEliminar.titulo : cuantas(porEliminar?.length ?? 0)}
          </Heading>
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setPorEliminar(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" disabled={!listoParaEliminar} onClick={eliminarVacante}>
              {unaPorEliminar ? 'Eliminar vacante' : 'Eliminar vacantes'}
            </Button>
          </>
        }
      >
        <Field>
          <FieldLabel htmlFor="confirmar-eliminar-fila">Escribe «{palabraEliminar}» para confirmar</FieldLabel>
          <Input
            id="confirmar-eliminar-fila"
            value={textoEliminar}
            autoComplete="off"
            onChange={(evento) => setTextoEliminar(evento.target.value)}
          />
          <FieldDescription>Así nadie borra una vacante con candidatos activos por un clic de más.</FieldDescription>
        </Field>
      </ActionDialog>
    </PageShell>
  )
}

Component.displayName = 'AdminSeleccionVacantesPage'
