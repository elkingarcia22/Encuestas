import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert02Icon,
  ArrowDown01Icon,
  ChartColumnIcon,
  CheckmarkCircle02Icon,
  Copy01Icon,
  Delete02Icon,
  Edit02Icon,
  File01Icon,
  LayoutTemplateIcon,
  Mail01Icon,
  Upload01Icon,
  UserGroupIcon,
  ViewIcon,
} from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Progress,
  ProgressValue,
  Tabs,
  TabsContent,
  Text,
  toast,
  type DataGridListConfig,
} from '@ubits/flux-ui'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { PrimeraVez } from '@/shared/components/PrimeraVez'

import { SIN_ARRASTRE } from '../../../data-grid/casos/sin-arrastre'
import { DialogoConfirmar } from '../../../estados/confirmaciones'
import { fechaCorta, fechaSinAnio, plural } from '../../../patrones/formato'
import { PestanasDePatron } from '../../../patrones/piezas'
import { pagina, resolver, useCargaInicial, type Filtro } from '../../admin-compartido/lista'
import { EncabezadoPantalla } from '../../admin-compartido/piezas'
import { DialogoComparar, DialogoDemograficos, DialogoFechaCierre, VistaPrevia } from '../components/dialogos'
import { DEMOGRAFICOS, ESTADOS, TIPOS, avanceDe, ruta, type Encuesta, type EstadoEncuesta, type Origen } from '../components/datos'
import { useEncuestas } from '../components/estado'

// Lista de encuestas (/surveys/admin). La tabla de la plataforma, con su búsqueda, recarga,
// filtros y acciones sobre la selección (Vista previa y Editar con una sola; Duplicar y Eliminar
// con una o varias). Encima, el aviso de las encuestas que cierran pronto con poca respuesta.

type Fila = Encuesta & { avance: number }

const BADGE_ESTADO: Record<EstadoEncuesta, 'info-light' | 'warning-light' | 'secondary' | 'success-light'> = {
  'Por iniciar': 'info-light',
  'En progreso': 'warning-light',
  Borrador: 'secondary',
  Finalizado: 'success-light',
}
const BADGE_ORIGEN: Record<Origen, 'primary-outline' | 'outline'> = { UBITS: 'primary-outline', Propia: 'outline' }

// Hoy en el playground es el 11 de septiembre: «cierran en 48 horas» es hasta el 13.
const CIERRE_PRONTO = '2026-09-13'

// ── Columnas y filtros (fuera del componente: si no, el filtro se cierra al marcar) ──
// Inicio y Cierre van juntos en Fechas para que la tabla quepa en el cuerpo de 1.140 px.

const COLUMNAS: DataGridListConfig<Fila>['columns'] = [
  {
    accessorKey: 'nombre',
    header: 'Nombre',
    size: 260,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <Text as="span" size="sm" weight="medium" className="line-clamp-2 whitespace-normal">
        {row.original.nombre}
      </Text>
    ),
  },
  {
    accessorKey: 'tipo',
    header: 'Tipo',
    size: 140,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <Text as="span" size="sm" className="line-clamp-2 whitespace-normal">
        {row.original.tipo}
      </Text>
    ),
  },
  {
    accessorKey: 'origen',
    header: 'Origen',
    size: 100,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <Badge variant={BADGE_ORIGEN[row.original.origen]} size="sm">
        {row.original.origen}
      </Badge>
    ),
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    size: 120,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <Badge variant={BADGE_ESTADO[row.original.estado]} size="sm">
        {row.original.estado}
      </Badge>
    ),
  },
  {
    accessorKey: 'cierre',
    header: 'Fechas',
    size: 150,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        <Text as="span" size="sm">
          {fechaSinAnio(row.original.inicio)} – {fechaCorta(row.original.cierre)}
        </Text>
        {row.original.estado === 'En progreso' && row.original.cierre <= CIERRE_PRONTO ? (
          <Text as="span" variant="muted" size="xs">
            Cierra en menos de 48 horas
          </Text>
        ) : null}
      </div>
    ),
  },
  {
    accessorKey: 'participantes',
    header: 'Participantes',
    size: 120,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <Text as="span" size="sm" variant={row.original.participantes ? undefined : 'muted'} className="tabular-nums">
        {row.original.participantes ? row.original.participantes.toLocaleString('es-CO') : '--'}
      </Text>
    ),
  },
  {
    accessorKey: 'avance',
    header: 'Avance',
    size: 140,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <Progress value={row.original.avance} className="w-full gap-1.5">
        <ProgressValue className="ms-auto" />
      </Progress>
    ),
  },
]

const FILTROS: DataGridListConfig<Fila>['columnFilters'] = [
  { id: 'estado', label: 'Estado', type: 'select', multiple: true, options: ESTADOS.map((v) => ({ label: v, value: v })) },
  { id: 'tipo', label: 'Tipo', type: 'select', multiple: true, options: TIPOS.map((v) => ({ label: v, value: v })) },
  { id: 'origen', label: 'Origen', type: 'select', multiple: true, options: (['UBITS', 'Propia'] as Origen[]).map((v) => ({ label: v, value: v })) },
]

const icono = (i: typeof ViewIcon) => <HugeiconsIcon icon={i} aria-hidden="true" />

// ── Pestaña Encuestas ──

function TablaEncuestas() {
  const { encuestas, setEncuestas } = useEncuestas()
  const navigate = useNavigate()
  const [cargando, setCargando] = useCargaInicial(900)
  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState<Filtro[]>([])
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const [actual, setActual] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [limpiarSeleccion, setLimpiarSeleccion] = useState<Record<string, boolean>>({})
  const [eliminando, setEliminando] = useState<Encuesta[]>([])
  const [viendo, setViendo] = useState<Encuesta | null>(null)
  const [cambiandoCierre, setCambiandoCierre] = useState<Encuesta | null>(null)
  const [recordando, setRecordando] = useState(false)
  const [recordadas, setRecordadas] = useState<number | null>(null)

  const filas = useMemo<Fila[]>(
    () => encuestas.map((e) => ({ ...e, avance: avanceDe(e) })).sort((a, b) => b.tocado - a.tocado || b.inicio.localeCompare(a.inicio)),
    [encuestas],
  )
  const resultado = useMemo(() => resolver(filas, busqueda, ['nombre', 'tipo'], filtros, orden), [filas, busqueda, filtros, orden])
  const visibles = useMemo(() => pagina(resultado, actual, porPagina), [resultado, actual, porPagina])

  // Las que el Home operativo marca en «Necesita tu atención».
  const pronto = encuestas.filter((e) => e.estado === 'En progreso' && e.cierre <= CIERRE_PRONTO && avanceDe(e) < 50)
  const sinResponder = pronto.reduce((n, e) => n + (e.participantes ?? 0) - e.respuestas, 0)

  const duplicar = (elegidas: Encuesta[]) => {
    const ahora = Date.now()
    const copias = elegidas.map((e, i) => ({
      ...e,
      id: `s-copia-${ahora}-${i}`,
      nombre: `${e.nombre} (copia)`,
      estado: 'Borrador' as const,
      participantes: null,
      respuestas: 0,
      tocado: ahora,
    }))
    setEncuestas((todas) => [...copias, ...todas])
    setLimpiarSeleccion({})
    // Se deshace con un clic: se duplica sin preguntar y el aviso trae «Deshacer».
    toast.add({
      type: 'success',
      title: copias.length === 1 ? 'Encuesta duplicada' : `${copias.length} encuestas duplicadas`,
      description: 'Las copias quedan en borrador y sin participantes.',
      actionProps: { children: 'Deshacer', onClick: () => setEncuestas((todas) => todas.filter((e) => !copias.some((c) => c.id === e.id))) },
    })
  }

  const config: DataGridListConfig<Fila> = {
    columns: COLUMNAS,
    columnFilters: FILTROS,
    onColumnFiltersChange: (nuevos) => {
      setFiltros(nuevos)
      setActual(1)
    },
    sort: { onSortChange: setOrden },
    search: {
      placeholder: 'Buscar encuesta…',
      onSearch: (q) => {
        setBusqueda(q)
        setActual(1)
      },
    },
    // Recargar trae los datos de nuevo: la tabla muestra su esqueleto mientras tanto.
    refresh: {
      isLoading: cargando,
      onRefresh: () => {
        setCargando(true)
        window.setTimeout(() => setCargando(false), 900)
      },
    },
    selection: { onSelectionChange: () => undefined },
    bulkActions: [
      { id: 'vista', label: 'Vista previa de la encuesta', icon: icono(ViewIcon), visibility: 'single-only', onClick: ([fila]) => setViendo(fila ?? null) },
      {
        id: 'editar',
        label: 'Editar',
        icon: icono(Edit02Icon),
        visibility: 'single-only',
        // Borradores y por iniciar abren el formulario; en progreso solo deja cambiar la fecha de cierre (una ventana
        // corta); las finalizadas no se editan.
        onClick: ([fila]) => {
          if (!fila) return
          if (fila.estado === 'Borrador' || fila.estado === 'Por iniciar') {
            navigate(ruta(`${fila.id}/editar`))
            return
          }
          if (fila.estado === 'En progreso') {
            setCambiandoCierre(fila)
            return
          }
          toast.add({
            type: 'info',
            title: 'Esta encuesta ya terminó',
            description: 'Duplícala para usarla como base de una nueva.',
          })
        },
      },
      { id: 'duplicar', label: 'Duplicar', icon: icono(Copy01Icon), visibility: 'always', onClick: duplicar },
      { id: 'eliminar', label: 'Eliminar', icon: icono(Delete02Icon), variant: 'destructive', visibility: 'always', onClick: setEliminando },
    ],
    emptyState: {
      type: 'no-results',
      title: 'No se encontraron resultados',
      description: 'Prueba con otro nombre o quita alguno de los filtros.',
      action: {
        id: 'limpiar',
        label: 'Limpiar filtros',
        variant: 'outline',
        onClick: () => {
          setBusqueda('')
          setFiltros([])
        },
      },
    },
    // Cabecera como Vacantes (5-oct): sin título dentro del marco y sin `layout`, para que salga como todas las tablas,
    // con encabezados de 40 px y el asidero de cada columna.
    frame: { toolbar: 'header' },
    labels: {
      resultCount: (visibles, total) => `${visibles}/${total} resultados`,
      selectionCount: (n) => `${n} ${plural(n, 'seleccionada', 'seleccionadas')}`,
    },
  }

  const unaEnProgreso = eliminando.filter((e) => e.estado === 'En progreso')

  return (
    <div className="flex flex-col gap-4">
      {recordadas !== null ? (
        <Alert variant="success">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} aria-hidden="true" />
          <AlertTitle>Recordatorio enviado a {recordadas.toLocaleString('es-CO')} personas</AlertTitle>
          <AlertDescription>
            <p>Les llegó a quienes aún no responden las encuestas que cierran en 48 horas.</p>
          </AlertDescription>
        </Alert>
      ) : pronto.length ? (
        <Alert variant="warning">
          <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />
          <AlertTitle>
            {pronto.length} {plural(pronto.length, 'encuesta cierra', 'encuestas cierran')} en 48 horas
          </AlertTitle>
          <AlertDescription>
            <p>
              {pronto.map((e) => e.nombre).join(', ')}: menos del 50 % de respuesta. Faltan {sinResponder.toLocaleString('es-CO')} personas por responder.
            </p>
          </AlertDescription>
          <AlertAction>
            <Button variant="outline" size="sm" onClick={() => setRecordando(true)}>
              Enviar recordatorio
            </Button>
          </AlertAction>
        </Alert>
      ) : null}

      <TablaDatos config={config} data={visibles} isLoading={cargando} initialRowSelection={limpiarSeleccion} paginacion={{ pagina: actual, setPagina: setActual, porPagina: porPagina, setPorPagina: setPorPagina, total: resultado.length }} nombre="encuestas" singular="encuesta" id="encuestas" />

      <VistaPrevia encuesta={viendo} onCerrar={() => setViendo(null)} />

      <DialogoFechaCierre
        encuesta={cambiandoCierre}
        onCerrar={() => setCambiandoCierre(null)}
        onGuardar={(encuesta, cierre) => {
          const iso = `${cierre.getFullYear()}-${String(cierre.getMonth() + 1).padStart(2, '0')}-${String(cierre.getDate()).padStart(2, '0')}`
          setEncuestas((todas) => todas.map((e) => (e.id === encuesta.id ? { ...e, cierre: iso, tocado: Date.now() } : e)))
          toast.add({ type: 'success', title: 'Fecha de cierre actualizada', description: `«${encuesta.nombre}» cierra el ${fechaCorta(iso)}.` })
        }}
      />

      {/* Borra respuestas y no se revierte: el diálogo lo dice y el botón dice qué va a pasar. */}
      <DialogoConfirmar
        abierto={eliminando.length > 0}
        onAbiertoChange={(abierto) => (abierto ? undefined : setEliminando([]))}
        icono={Delete02Icon}
        titulo={eliminando.length === 1 ? 'Eliminar encuesta' : `Eliminar ${eliminando.length} encuestas`}
        descripcion={
          eliminando.length === 1
            ? `Esta acción no se puede deshacer. Se eliminará la encuesta «${eliminando[0]?.nombre}»${eliminando[0]?.respuestas ? ` con sus ${eliminando[0].respuestas.toLocaleString('es-CO')} respuestas` : ''}.`
            : `Esta acción no se puede deshacer. Se eliminarán ${eliminando.length} encuestas${unaEnProgreso.length ? `; ${unaEnProgreso.length} ${plural(unaEnProgreso.length, 'está', 'están')} en progreso y ${plural(unaEnProgreso.length, 'pierde sus respuestas', 'pierden sus respuestas')}` : ''}.`
        }
        cancelar="No, cancelar"
        accion={eliminando.length === 1 ? 'Sí, eliminar encuesta' : `Sí, eliminar ${eliminando.length} encuestas`}
        destructiva
        onConfirmar={() => {
          const ids = new Set(eliminando.map((e) => e.id))
          setEncuestas((todas) => todas.filter((e) => !ids.has(e.id)))
          toast.add({ type: 'success', title: ids.size === 1 ? 'Encuesta eliminada' : `${ids.size} encuestas eliminadas` })
          setEliminando([])
          setLimpiarSeleccion({})
        }}
      />

      {/* Le llega a otras personas: dice a cuántas antes de enviar (escalón 3). */}
      <DialogoConfirmar
        abierto={recordando}
        onAbiertoChange={setRecordando}
        icono={Mail01Icon}
        titulo="Enviar recordatorio"
        descripcion={`Le llegará un correo a las ${sinResponder.toLocaleString('es-CO')} personas que aún no responden ${pronto.length} ${plural(pronto.length, 'encuesta', 'encuestas')} que cierran en 48 horas. Quienes ya respondieron no reciben nada.`}
        accion={`Enviar a ${sinResponder.toLocaleString('es-CO')} personas`}
        onConfirmar={() => {
          setRecordadas(sinResponder)
          setRecordando(false)
          toast.add({ type: 'success', title: 'Recordatorio enviado', description: `Va en camino a ${sinResponder.toLocaleString('es-CO')} personas.` })
        }}
      />
    </div>
  )
}

// ── Pestaña Datos demográficos ──

function Demograficos() {
  const { demograficos, setDemograficos } = useEncuestas()
  const [cargando, setCargando] = useState(false)

  return (
    <>
      {demograficos ? (
        <Card>
          <CardHeader>
            <CardTitle>Datos demográficos</CardTitle>
            <CardDescription>888 personas · actualizados hoy. Se usan para segmentar los resultados de todas las encuestas.</CardDescription>
            <CardAction>
              <Button variant="outline" size="sm" onClick={() => setCargando(true)}>
                <HugeiconsIcon icon={Upload01Icon} aria-hidden="true" />
                Actualizar datos
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ItemGroup className="grid gap-2 md:grid-cols-2">
              {DEMOGRAFICOS.map((variable) => (
                <Item key={variable.nombre} variant="outline" size="sm">
                  <ItemMedia variant="icon">
                    <HugeiconsIcon icon={UserGroupIcon} aria-hidden="true" />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{variable.nombre}</ItemTitle>
                    <ItemDescription>{variable.detalle}</ItemDescription>
                  </ItemContent>
                </Item>
              ))}
            </ItemGroup>
          </CardContent>
        </Card>
      ) : (
        // Primera vez: el vacío explica para qué sirve y trae la acción para empezar. Es la pieza del sistema
        // (PrimeraVez, con ilustración glass), no un Empty armado a mano (decisión 14 de la auditoría).
        <Card>
          <CardContent>
            <PrimeraVez
              icono="glass-chart"
              titulo="Todavía no hay datos demográficos"
              descripcion="Súbelos una vez (edad, antigüedad, sede, tipo de contrato y nivel) y úsalos para segmentar los resultados de todas tus encuestas."
              accion={{ texto: 'Cargar datos demográficos', icono: Upload01Icon, onClick: () => setCargando(true) }}
            />
          </CardContent>
        </Card>
      )}
      <DialogoDemograficos
        abierto={cargando}
        onAbiertoChange={setCargando}
        onListo={() => {
          setDemograficos(true)
          toast.add({ type: 'success', title: 'Datos demográficos guardados', description: 'Ya puedes segmentar los resultados por edad, antigüedad y sede.' })
        }}
      />
    </>
  )
}

// ── Pantalla ──

export function Component() {
  const { encuestas } = useEncuestas()
  const [pestana, setPestana] = useState('encuestas')
  const navigate = useNavigate()
  const [comparando, setComparando] = useState({ abierto: false, vez: 0 })

  return (
    // Las pestañas van dentro de la cabecera (`pestanas`), como en las demás pantallas: el Tabs envuelve la pantalla.
    <Tabs value={pestana} onValueChange={(valor) => setPestana(String(valor))} className="flex flex-1 flex-col gap-6 pt-2">
      <EncabezadoPantalla
        titulo="Encuestas"
        descripcion="Mide el clima, la cultura y el riesgo psicosocial de tu empresa, y compara los resultados en el tiempo."
        acciones={
          <>
            <Button variant="outline" onClick={() => setComparando((c) => ({ abierto: true, vez: c.vez + 1 }))}>
              <HugeiconsIcon icon={ChartColumnIcon} aria-hidden="true" />
              Comparar encuestas
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button />}>
                Crear encuesta
                <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => navigate(ruta('nueva'))}>
                    <HugeiconsIcon icon={File01Icon} aria-hidden="true" />
                    <div className="flex flex-col gap-1">
                      <Text as="span" size="sm">
                        Crear en blanco
                      </Text>
                      <Text as="span" variant="muted" size="xs">
                        Empieza desde cero
                      </Text>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(ruta('nueva?modo=plantilla'))}>
                    <HugeiconsIcon icon={LayoutTemplateIcon} aria-hidden="true" />
                    <div className="flex flex-col gap-1">
                      <Text as="span" size="sm">
                        Crear con plantilla
                      </Text>
                      <Text as="span" variant="muted" size="xs">
                        Usa un diseño predefinido
                      </Text>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
        pestanas={
          <PestanasDePatron
            items={[
              { valor: 'encuestas', etiqueta: 'Encuestas' },
              { valor: 'demograficos', etiqueta: 'Datos demográficos' },
            ]}
          />
        }
      />

      <TabsContent value="encuestas" keepMounted>
        <TablaEncuestas />
      </TabsContent>
      <TabsContent value="demograficos">
        <Demograficos />
      </TabsContent>

      <DialogoComparar
        key={`comparar-${comparando.vez}`}
        abierto={comparando.abierto}
        onAbiertoChange={(abierto) => setComparando((c) => ({ ...c, abierto }))}
        encuestas={encuestas}
      />

    </Tabs>
  )
}

Component.displayName = 'EncuestasLista'
