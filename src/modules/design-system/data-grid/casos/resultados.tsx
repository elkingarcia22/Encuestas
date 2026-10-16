import { createContext, useContext, useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Csv01Icon,
  Download01Icon,
  File01Icon,
  InformationCircleIcon,
  Pdf01Icon,
  Quiz01Icon,
  SquareUnlock02Icon,
  Comment01Icon,
  TextIcon,
  Video01Icon,
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
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  IconTile,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Label,
  Progress,
  ProgressValue,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  toast,
  Tooltip,
  TooltipTrigger,
  type DataGridListConfig,
} from '@ubits/flux-ui'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { DialogoConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { HintContent } from '@/shared/components/Hint'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { usePaginacion } from '@/modules/admin/seleccion/propuestas/components/paginacion'

import { CasoUbits } from '../../patrones/piezas'
import { fechaCorta, fechaSinAnio, isoHaceDias } from '../../patrones/formato'
import { Persona } from './seguimiento'

// Caso: Resultados de un contenido publicado (LMS Creator › Editar contenido › Resultados).
// Fuente: HU «Consultar resultados del contenido» (RN-01 a RN-15) y HU «Progreso del colaborador».

// ── Datos ──

type Evaluacion = {
  id: 'eval1' | 'eval2'
  nombre: string
  peso: number
  aprobar: number
  intentos: number
  tiempo: string
  preguntas: number
}

const EVALUACIONES: Evaluacion[] = [
  { id: 'eval1', nombre: 'Evaluación Sección 1', peso: 50, aprobar: 70, intentos: 3, tiempo: '20 minutos', preguntas: 10 },
  { id: 'eval2', nombre: 'Evaluación Sección 2', peso: 50, aprobar: 70, intentos: 3, tiempo: 'No aplica', preguntas: 12 },
]

type Nota = { correctas: number } | null

type Colaborador = {
  id: string
  nombre: string
  usuario: string
  inicio: string
  fin: string | null
  avance: number
  eval1: Nota
  eval2: Nota
}

type FilaColaborador = [string, string, string, string | null, number, number | null, number | null]

// [nombre, usuario, inicio, fin, avance, correctas en Sección 1 (de 10), correctas en Sección 2 (de 12)]
const FILAS: FilaColaborador[] = [
  ['Carlos Pérez', 'cperez', '2026-08-28', null, 62, 8, null],
  ['Laura Gómez', 'lgomez', '2026-08-20', null, 50, 5, null],
  ['Ana Restrepo', 'arestrepo', '2026-08-15', '2026-09-02', 100, 9, 10],
  ['Nicolás Peña', 'npena', '2026-08-25', null, 50, 3, null],
  ['Diego Ferrer', 'dferrer', '2026-09-01', null, 25, null, null],
  ['Sofía Duarte', 'sduarte', '2026-08-18', '2026-08-30', 100, 10, 11],
  ['Sebastián Rojas', 'srojas', '2026-09-03', null, 12, null, null],
  ['Carolina Ríos', 'crios', '2026-09-05', null, 0, null, null],
  ['Mateo Aguirre', 'maguirre', '2026-07-10', '2026-07-29', 100, 7, 9],
  ['Marta Salas', 'msalas', '2026-06-22', null, 75, 8, 7],
  ['Javier Núñez', 'jnunez', '2026-06-05', null, 50, 6, null],
  ['Paula Iglesias', 'piglesias', '2026-05-12', '2026-05-30', 100, 9, 12],
  ['Óscar Delgado', 'odelgado', '2026-04-20', '2026-05-06', 100, 8, 10],
  ['Ignacio Rueda', 'irueda', '2026-04-02', null, 37, null, null],
  ['Julia Moreno', 'jmoreno', '2026-03-15', '2026-04-01', 100, 10, 11],
  ['Felipe Cárdenas', 'fcardenas', '2026-03-09', null, 50, 4, null],
  ['Emilio Castro', 'ecastro', '2025-12-01', '2025-12-19', 100, 8, 9],
  ['Renata Lozano', 'rlozano', '2025-11-10', null, 62, 7, null],
]

const ESTUDIANTES: Colaborador[] = FILAS.map(([nombre, usuario, inicio, fin, avance, c1, c2], i) => ({
  id: `est-${i + 1}`,
  nombre,
  usuario,
  inicio,
  fin,
  avance,
  eval1: c1 === null ? null : { correctas: c1 },
  eval2: c2 === null ? null : { correctas: c2 },
}))

type Bloqueado = { id: string; nombre: string; usuario: string; evaluacion: string; bloqueo: string }

const BLOQUEADOS_INICIALES: Bloqueado[] = [
  { id: 'blq-1', nombre: 'Nicolás Peña', usuario: 'npena', evaluacion: 'Evaluación Sección 1', bloqueo: '2026-09-09' },
  { id: 'blq-2', nombre: 'Laura Gómez', usuario: 'lgomez', evaluacion: 'Evaluación Sección 1', bloqueo: '2026-09-04' },
  { id: 'blq-3', nombre: 'Marta Salas', usuario: 'msalas', evaluacion: 'Evaluación Sección 2', bloqueo: '2026-08-29' },
  { id: 'blq-4', nombre: 'Javier Núñez', usuario: 'jnunez', evaluacion: 'Evaluación Sección 1', bloqueo: '2026-07-02' },
  { id: 'blq-5', nombre: 'Felipe Cárdenas', usuario: 'fcardenas', evaluacion: 'Evaluación Sección 1', bloqueo: '2026-03-20' },
]

// RN-03: opciones exactas del periodo. «Año actual» cuenta desde el 1 de enero.
const PERIODOS = [
  { valor: '30', etiqueta: 'Últimos 30 días', desde: isoHaceDias(30) },
  { valor: '90', etiqueta: 'Últimos 3 meses', desde: isoHaceDias(90) },
  { valor: '180', etiqueta: 'Últimos 6 meses', desde: isoHaceDias(180) },
  { valor: '365', etiqueta: 'Último año', desde: isoHaceDias(365) },
  { valor: 'anio', etiqueta: 'Año actual', desde: '2026-01-01' },
]

const PAGINAS = [
  { titulo: 'Bienvenida', tipo: 'Video', icono: Video01Icon },
  { titulo: 'Nuestro portafolio', tipo: 'PDF', icono: Pdf01Icon },
  { titulo: 'Proceso comercial', tipo: 'SCORM', icono: File01Icon },
  { titulo: 'Evaluación Sección 1', tipo: 'Evaluación', icono: Quiz01Icon },
  { titulo: 'Casos de éxito', tipo: 'Texto', icono: TextIcon, oculta: '2026-08-01' },
  { titulo: 'Objeciones frecuentes', tipo: 'Video', icono: Video01Icon },
  { titulo: 'Evaluación Sección 2', tipo: 'Evaluación', icono: Quiz01Icon },
  { titulo: 'Cierre y siguientes pasos', tipo: 'Texto', icono: TextIcon },
]

// ── Cálculos ──

const porcentaje = (nota: Nota, evaluacion: Evaluacion) =>
  nota ? Math.round((nota.correctas / evaluacion.preguntas) * 100) : null

// RN-08: solo evaluaciones presentadas, ponderadas por su peso y renormalizadas.
function finalPonderada(colaborador: Colaborador) {
  const presentadas = EVALUACIONES.flatMap((evaluacion) => {
    const valor = porcentaje(colaborador[evaluacion.id], evaluacion)
    return valor === null ? [] : [{ valor, peso: evaluacion.peso }]
  })
  if (presentadas.length === 0) return null
  const pesos = presentadas.reduce((suma, p) => suma + p.peso, 0)
  return Math.round(presentadas.reduce((suma, p) => suma + p.valor * p.peso, 0) / pesos)
}

// ── Piezas compartidas por las columnas ──

const SIN_ARRASTRE = { enableColumnOrdering: false }

// La persona de cada fila es la pieza Persona del sistema, con el usuario en la línea gris (decisión 21 de la
// auditoría, 5-oct: aquí había una copia propia con el nombre en peso medio).

// Las columnas viven fuera del componente; lo que necesitan del caso (abrir un diálogo,
// desbloquear) les llega por contexto.
type Acciones = {
  verDetalles: (evaluacion: Evaluacion) => void
  desbloquear: (filas: Bloqueado[]) => void
}
const AccionesContexto = createContext<Acciones>({ verDetalles: () => undefined, desbloquear: () => undefined })

function EncabezadoEvaluacion({ evaluacion }: { evaluacion: Evaluacion }) {
  const { verDetalles } = useContext(AccionesContexto)
  return (
    <div className="flex items-center gap-1">
      <Text as="span" size="sm" weight="medium" className="truncate">
        {evaluacion.nombre} · {evaluacion.peso} %
      </Text>
      <BotonIcono
        size="icon-xs"
        aria-label={`Ver detalles de ${evaluacion.nombre}`}
        onClick={() => verDetalles(evaluacion)}
      >
        <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
      </BotonIcono>
    </div>
  )
}

// RN-07: «Pendiente», o «{estado} con {porcentaje}% ({correctas} de {total} preguntas)».
function CeldaNota({ nota, evaluacion }: { nota: Nota; evaluacion: Evaluacion }) {
  const valor = porcentaje(nota, evaluacion)
  if (!nota || valor === null) {
    return (
      <Badge variant="secondary" size="sm">
        Pendiente
      </Badge>
    )
  }
  const aprobado = valor >= evaluacion.aprobar
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <Badge variant={aprobado ? 'success-light' : 'destructive-outline'} size="sm">
        {aprobado ? 'Aprobado' : 'Reprobado'}
      </Badge>
      <Text as="span" variant="muted" size="xs" className="truncate">
        con {valor} % ({nota.correctas} de {evaluacion.preguntas} preguntas)
      </Text>
    </div>
  )
}

function BotonDesbloquear({ fila }: { fila: Bloqueado }) {
  const { desbloquear } = useContext(AccionesContexto)
  return (
    <Button variant="outline" size="xs" onClick={() => desbloquear([fila])}>
      <HugeiconsIcon icon={SquareUnlock02Icon} aria-hidden="true" />
      Desbloquear
    </Button>
  )
}

// ── Columnas ──

const COLUMNAS_PROGRESO: DataGridListConfig<Colaborador>['columns'] = [
  {
    accessorKey: 'nombre',
    header: 'Colaborador',
    size: 240,
    ...SIN_ARRASTRE,
    cell: ({ row }) => <Persona nombre={row.original.nombre} detalle={row.original.usuario} />,
  },
  {
    accessorKey: 'avance',
    header: 'Avance',
    size: 180,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <Progress value={row.original.avance} className="w-full gap-1.5">
        <ProgressValue className="ms-auto" />
      </Progress>
    ),
  },
  {
    accessorKey: 'inicio',
    header: 'Inicio',
    size: 140,
    ...SIN_ARRASTRE,
    cell: ({ row }) => <Text as="span" size="sm">{fechaCorta(row.original.inicio)}</Text>,
  },
  {
    accessorKey: 'fin',
    header: 'Finalización',
    size: 150,
    ...SIN_ARRASTRE,
    cell: ({ row }) =>
      row.original.fin ? (
        <Text as="span" size="sm">{fechaCorta(row.original.fin)}</Text>
      ) : (
        <Text as="span" variant="muted" size="sm">
          —
        </Text>
      ),
  },
]

// RN-07: una columna por evaluación, con su nombre y su peso en la cabecera.
const columnaDeEvaluacion = (evaluacion: Evaluacion): DataGridListConfig<Colaborador>['columns'][number] => ({
  id: evaluacion.id,
  header: () => <EncabezadoEvaluacion evaluacion={evaluacion} />,
  size: 300,
  enableSorting: false,
  ...SIN_ARRASTRE,
  cell: ({ row }) => <CeldaNota nota={row.original[evaluacion.id]} evaluacion={evaluacion} />,
})

const COLUMNAS_EVALUACIONES: DataGridListConfig<Colaborador>['columns'] = [
  {
    accessorKey: 'nombre',
    header: 'Colaborador',
    size: 220,
    ...SIN_ARRASTRE,
    cell: ({ row }) => <Persona nombre={row.original.nombre} detalle={row.original.usuario} />,
  },
  ...EVALUACIONES.map(columnaDeEvaluacion),
  {
    id: 'final',
    header: 'Final ponderada',
    size: 150,
    enableSorting: false,
    ...SIN_ARRASTRE,
    cell: ({ row }) => {
      const final = finalPonderada(row.original)
      return (
        <Text as="span" size="sm" weight={final === null ? 'normal' : 'semibold'} className="tabular-nums">
          {final === null ? '—' : `${final} %`}
        </Text>
      )
    },
  },
]

const COLUMNAS_BLOQUEADOS: DataGridListConfig<Bloqueado>['columns'] = [
  {
    accessorKey: 'nombre',
    header: 'Colaborador',
    size: 240,
    ...SIN_ARRASTRE,
    cell: ({ row }) => <Persona nombre={row.original.nombre} detalle={row.original.usuario} />,
  },
  {
    accessorKey: 'evaluacion',
    header: 'Evaluación',
    size: 200,
    ...SIN_ARRASTRE,
  },
  {
    id: 'intentos',
    header: 'Intentos',
    size: 110,
    enableSorting: false,
    ...SIN_ARRASTRE,
    cell: () => (
      <Text as="span" size="sm" className="tabular-nums">
        3 de 3
      </Text>
    ),
  },
  {
    accessorKey: 'bloqueo',
    header: 'Bloqueado el',
    size: 140,
    ...SIN_ARRASTRE,
    cell: ({ row }) => <Text as="span" size="sm">{fechaCorta(row.original.bloqueo)}</Text>,
  },
  {
    id: 'desbloquear',
    header: '',
    size: 140,
    enableSorting: false,
    enableResizing: false,
    ...SIN_ARRASTRE,
    cell: ({ row }) => <BotonDesbloquear fila={row.original} />,
  },
]

// ── Pestañas ──

const csv = (pestana: string) => ({
  id: 'csv',
  label: 'Descargar CSV',
  variant: 'outline' as const,
  icon: <HugeiconsIcon icon={Csv01Icon} aria-hidden="true" />,
  onClick: () =>
    toast.promise(new Promise((resolver) => setTimeout(resolver, 1200)), {
      loading: `Preparando el CSV de ${pestana}…`,
      success: 'CSV descargado con el periodo actual',
      error: 'No pudimos generar el CSV',
    }),
})

const VACIO_RESULTADOS = {
  type: 'no-results' as const,
  title: 'No se encontraron resultados',
  description: 'Nadie empezó el contenido en este periodo. Prueba con uno más largo.',
}

// Las tres tablas son TablaDatos, la única del sistema (5-oct): la cabecera de Vacantes y el pie en español solo si
// hay más de una página.
function PestanaProgreso({ colaboradores, onVer }: { colaboradores: Colaborador[]; onVer: (e: Colaborador) => void }) {
  const paginacion = usePaginacion(colaboradores)
  const config: DataGridListConfig<Colaborador> = {
    columns: COLUMNAS_PROGRESO,
    actions: {
      secondary: [csv('Progreso')],
      item: [
        {
          id: 'ver',
          label: 'Ver progreso',
          icon: <HugeiconsIcon icon={ViewIcon} aria-hidden="true" />,
          onClick: ([fila]) => fila && onVer(fila),
        },
      ],
    },
    emptyState: VACIO_RESULTADOS,
    frame: { toolbar: 'header' },
  }
  return <TablaDatos config={config} data={paginacion.filas} paginacion={paginacion} nombre="colaboradores" singular="colaborador" id="resultados-progreso" pieSoloSiHaceFalta />
}

function PestanaEvaluaciones({ colaboradores }: { colaboradores: Colaborador[] }) {
  const paginacion = usePaginacion(colaboradores)
  const config: DataGridListConfig<Colaborador> = {
    columns: COLUMNAS_EVALUACIONES,
    actions: { secondary: [csv('Evaluaciones')] },
    emptyState: VACIO_RESULTADOS,
    frame: { toolbar: 'header' },
  }
  return <TablaDatos config={config} data={paginacion.filas} paginacion={paginacion} nombre="colaboradores" singular="colaborador" id="resultados-evaluaciones" pieSoloSiHaceFalta />
}

function PestanaIntentos({ bloqueados, limpiarSeleccion }: { bloqueados: Bloqueado[]; limpiarSeleccion: Record<string, boolean> }) {
  const { desbloquear } = useContext(AccionesContexto)
  const paginacion = usePaginacion(bloqueados)
  const config: DataGridListConfig<Bloqueado> = {
    columns: COLUMNAS_BLOQUEADOS,
    selection: { onSelectionChange: () => undefined },
    actions: { secondary: [csv('Gestión de intentos')] },
    // RN-11: desbloquear varios exige al menos 2 filas seleccionadas (visibility «bulk-only»).
    bulkActions: [
      {
        id: 'desbloquear',
        label: 'Desbloquear seleccionados',
        visibility: 'bulk-only',
        icon: <HugeiconsIcon icon={SquareUnlock02Icon} aria-hidden="true" />,
        onClick: (filas) => desbloquear(filas),
      },
    ],
    emptyState: {
      type: 'empty',
      title: 'No hay colaboradores bloqueados',
      description: 'Aquí aparece quien agote los intentos de una evaluación en el periodo.',
    },
    frame: { description: 'Desbloquear otorga 1 intento más a cada usuario.', toolbar: 'header' },
  }
  return (
    <TablaDatos
      config={config}
      data={paginacion.filas}
      initialRowSelection={limpiarSeleccion}
      paginacion={paginacion}
      nombre="colaboradores bloqueados"
      singular="colaborador bloqueado"
      id="resultados-intentos"
      pieSoloSiHaceFalta
    />
  )
}

type Reporte = { id: string; nombre: string; tipo: string; detalle: string; participantes: number; icono: typeof Quiz01Icon }

function PestanaDescargas({ reportes }: { reportes: Reporte[] }) {
  if (reportes.length === 0) {
    return (
      <Card>
        <CardContent>
          {/* RN-14: copy fijo del vacío de Descargas. Todavía no hay nada que descargar: es la pieza de primera vez, con
              su ilustración (decisión 14 de la auditoría, 5-oct). */}
          <PrimeraVez
            icono="glass-document"
            titulo="No hay reportes disponibles"
            descripcion="Cuando el contenido tenga evaluaciones o encuestas, podrás descargar sus reportes aquí."
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <ItemGroup className="flex flex-col gap-2">
      {reportes.map((reporte) => (
        <Item key={reporte.id} variant="outline">
          <ItemMedia>
            <IconTile variant="soft" size="sm">
              <HugeiconsIcon icon={reporte.icono} aria-hidden="true" />
            </IconTile>
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{reporte.nombre}</ItemTitle>
            <ItemDescription>
              {reporte.tipo} · {reporte.detalle} · {reporte.participantes} participantes
            </ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast.promise(new Promise((resolver) => setTimeout(resolver, 1400)), {
                  loading: `Generando el reporte de ${reporte.nombre}…`,
                  success: 'Reporte descargado',
                  error: 'No pudimos generar el reporte',
                })
              }
            >
              <HugeiconsIcon icon={Download01Icon} aria-hidden="true" />
              Descargar
            </Button>
          </ItemActions>
        </Item>
      ))}
    </ItemGroup>
  )
}

// ── Detalle de solo lectura: progreso por página (HU-LMS-012) ──

function ProgresoDelColaborador({ colaborador }: { colaborador: Colaborador | null }) {
  if (!colaborador) return null
  const vistas = Math.round((colaborador.avance / 100) * PAGINAS.length)

  return (
    <>
      <ItemGroup className="flex flex-col gap-1">
        {PAGINAS.map((pagina, indice) => {
          const estado = indice < vistas ? 'Visto' : indice === vistas ? 'Pendiente' : 'Bloqueado'
          return (
            <Item key={pagina.titulo} size="sm">
              <ItemMedia variant="icon">
                <HugeiconsIcon icon={pagina.icono} aria-hidden="true" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>
                  {indice + 1}. {pagina.titulo}
                </ItemTitle>
                <ItemDescription>
                  {pagina.tipo}
                  {estado === 'Visto' ? ` · completada el ${fechaSinAnio(isoHaceDias(PAGINAS.length - indice + 2))}` : ''}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                {pagina.oculta ? (
                  <Badge variant="outline" size="sm">
                    Oculta · {fechaSinAnio(pagina.oculta)}
                  </Badge>
                ) : null}
                <Badge
                  variant={estado === 'Visto' ? 'success-light' : estado === 'Pendiente' ? 'warning-light' : 'secondary'}
                  size="sm"
                >
                  {estado}
                </Badge>
              </ItemActions>
            </Item>
          )
        })}
      </ItemGroup>
    </>
  )
}

// ── Caso completo ──

export function CasoResultados() {
  const [periodo, setPeriodo] = useState('30')
  const [pestana, setPestana] = useState('progreso')
  const [bloqueados, setBloqueados] = useState(BLOQUEADOS_INICIALES)
  const [sinEvaluaciones, setSinEvaluaciones] = useState(false)
  const [sinInscritos, setSinInscritos] = useState(false)
  const [limpiarSeleccion, setLimpiarSeleccion] = useState<Record<string, boolean>>({})

  const [detalle, setDetalle] = useState<Evaluacion | null>(null)
  const [detalleAbierto, setDetalleAbierto] = useState(false)
  const [porDesbloquear, setPorDesbloquear] = useState<Bloqueado[]>([])
  const [confirmando, setConfirmando] = useState(false)
  const [colaborador, setColaborador] = useState<Colaborador | null>(null)
  const [panelAbierto, setPanelAbierto] = useState(false)
  const [ayudaFinalizacion, setAyudaFinalizacion] = useState(false)

  // RN-04: el periodo filtra colaboradores por fecha de inicio y bloqueados por fecha de bloqueo.
  const desde = PERIODOS.find((p) => p.valor === periodo)?.desde ?? isoHaceDias(30)
  const colaboradores = useMemo(
    () => (sinInscritos ? [] : ESTUDIANTES.filter((e) => e.inicio >= desde)),
    [desde, sinInscritos],
  )
  const bloqueadosDelPeriodo = useMemo(() => bloqueados.filter((b) => b.bloqueo >= desde), [bloqueados, desde])

  // RN-05: Finalización = % de inscritos del periodo que ya tienen fecha de finalización.
  const finalizados = colaboradores.filter((e) => e.fin).length
  const finalizacion = colaboradores.length ? Math.round((finalizados / colaboradores.length) * 100) : 0

  // RN-13: una fila por evaluación o encuesta; no depende del periodo.
  const reportes: Reporte[] = sinEvaluaciones
    ? []
    : [
        ...EVALUACIONES.map((evaluacion) => ({
          id: evaluacion.id,
          nombre: evaluacion.nombre,
          tipo: 'Evaluación',
          detalle: `${evaluacion.preguntas} preguntas`,
          participantes: ESTUDIANTES.filter((e) => e[evaluacion.id]).length,
          icono: Quiz01Icon,
        })),
        { id: 'encuesta', nombre: 'Encuesta de satisfacción', tipo: 'Encuesta', detalle: '6 preguntas', participantes: 9, icono: Comment01Icon },
      ]

  const acciones: Acciones = {
    verDetalles: (evaluacion) => {
      setDetalle(evaluacion)
      setDetalleAbierto(true)
    },
    desbloquear: (filas) => {
      setPorDesbloquear(filas)
      setConfirmando(true)
    },
  }

  const confirmarDesbloqueo = () => {
    const ids = new Set(porDesbloquear.map((b) => b.id))
    setBloqueados((actuales) => actuales.filter((b) => !ids.has(b.id)))
    setLimpiarSeleccion({})
    // RN-12: copy exacto del aviso.
    toast.add({
      type: 'success',
      title: porDesbloquear.length === 1 ? 'Usuario desbloqueado exitosamente' : 'Usuarios desbloqueados exitosamente',
    })
    setConfirmando(false)
  }

  const varios = porDesbloquear.length > 1

  return (
    <CasoUbits
      rol="Creador"
      donde={['Aprendizaje', 'LMS Creator', 'Onboarding comercial Q3', 'Resultados']}
      titulo="Varias tablas bajo un mismo periodo"
      descripcion="Ana mide quién terminó un contenido publicado, cómo le fue en las evaluaciones y desbloquea a quien agotó sus intentos. El periodo de arriba manda sobre las tres primeras pestañas; Descargas no depende de él."
      historia="la historia «Consultar resultados del contenido»"
      reglas={[
        { titulo: 'Periodo por defecto: últimos 30 días', detalle: 'Cinco opciones exactas, de «Últimos 30 días» a «Año actual».' },
        { titulo: 'Finalización explicada', detalle: 'El indicador cuenta a los inscritos del periodo que ya terminaron todo; el icono lo aclara.' },
        { titulo: 'Nota completa o «Pendiente»', detalle: '«Aprobado con 80 % (8 de 10 preguntas)». La final ponderada usa solo lo presentado.' },
        { titulo: 'Detalles de cada evaluación', detalle: 'El icono de la cabecera abre peso, nota para aprobar, intentos, tiempo y preguntas.' },
        { titulo: 'Desbloquear uno o varios', detalle: 'Uno desde su fila; varios, seleccionando dos o más. Siempre con confirmación.' },
        { titulo: 'Reportes por recurso', detalle: 'Descargas es una lista corta: no necesita tabla. Sin evaluaciones, muestra su vacío.' },
      ]}
    >
      <AccionesContexto.Provider value={acciones}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-1">
              <Text weight="semibold">Resultados</Text>
              <Text variant="muted" size="sm">
                La información se actualiza cada 3 horas.
              </Text>
            </div>
            <Select value={periodo} onValueChange={(valor) => setPeriodo(String(valor))}>
              <SelectTrigger size="sm" className="w-44" aria-label="Periodo">
                <SelectValue>{(valor) => PERIODOS.find((p) => p.valor === valor)?.etiqueta}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PERIODOS.map((p) => (
                  <SelectItem key={p.valor} value={p.valor}>
                    {p.etiqueta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Card size="sm">
              <CardHeader>
                <CardTitle>Colaboradors inscritos</CardTitle>
                <CardDescription>Empezaron en el periodo</CardDescription>
              </CardHeader>
              <CardContent>
                <Text as="span" size="xl" weight="semibold" className="tabular-nums">
                  {colaboradores.length}
                </Text>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardHeader>
                <div className="flex items-center gap-1">
                  <CardTitle>Finalización</CardTitle>
                  {/* Icono de ayuda: el tooltip se controla para que también abra con clic (solo abre con el cursor). */}
                  <Tooltip open={ayudaFinalizacion} onOpenChange={setAyudaFinalizacion}>
                    <TooltipTrigger
                      render={
                        <BotonIcono
                          size="icon-xs"
                          aria-label="Qué mide Finalización"
                          onClick={() => setAyudaFinalizacion((v) => !v)}
                        />
                      }
                    >
                      <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
                    </TooltipTrigger>
                    <HintContent>Porcentaje de los inscritos del periodo que ya completaron todo el contenido.</HintContent>
                  </Tooltip>
                </div>
                <CardDescription>
                  {finalizados} de {colaboradores.length} ya terminaron
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Text as="span" size="xl" weight="semibold" className="tabular-nums">
                  {finalizacion} %
                </Text>
                <Progress value={finalizacion} aria-label="Finalización" />
              </CardContent>
            </Card>
            <Card size="sm">
              <CardHeader>
                <CardTitle>Publicado</CardTitle>
                <CardDescription>Visibilidad pública</CardDescription>
              </CardHeader>
              <CardContent>
                <Text as="span" size="xl" weight="semibold">
                  {fechaCorta('2026-03-02')}
                </Text>
              </CardContent>
            </Card>
          </div>

          <Tabs
            value={pestana}
            onValueChange={(valor) => {
              setPestana(String(valor))
              setLimpiarSeleccion({})
            }}
          >
            <TabsList variant="line">
              <TabsTrigger value="progreso" className="flex-none">Progreso</TabsTrigger>
              <TabsTrigger value="evaluaciones" className="flex-none">Evaluaciones</TabsTrigger>
              <TabsTrigger value="intentos" className="flex-none">
                Gestión de intentos
                {bloqueadosDelPeriodo.length ? (
                  <Badge variant="warning-light" size="xs">
                    {bloqueadosDelPeriodo.length}
                  </Badge>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="descargas" className="flex-none">Descargas</TabsTrigger>
            </TabsList>
            <TabsContent value="progreso" className="pt-4">
              <PestanaProgreso
                colaboradores={colaboradores}
                onVer={(fila) => {
                  setColaborador(fila)
                  setPanelAbierto(true)
                }}
              />
            </TabsContent>
            <TabsContent value="evaluaciones" className="pt-4">
              <PestanaEvaluaciones colaboradores={colaboradores} />
            </TabsContent>
            <TabsContent value="intentos" className="pt-4">
              <PestanaIntentos bloqueados={bloqueadosDelPeriodo} limpiarSeleccion={limpiarSeleccion} />
            </TabsContent>
            <TabsContent value="descargas" className="flex flex-col gap-3 pt-4">
              <div className="flex items-center gap-2.5">
                <Switch id="sin-evaluaciones" checked={sinEvaluaciones} onCheckedChange={setSinEvaluaciones} />
                <Label htmlFor="sin-evaluaciones">Simular un contenido sin evaluaciones ni encuestas</Label>
              </div>
              <PestanaDescargas reportes={reportes} />
            </TabsContent>
          </Tabs>

          <Alert>
            <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
            <AlertTitle>Caso borde: un periodo sin inscritos</AlertTitle>
            <AlertDescription>
              Los indicadores quedan en 0 y 0 %, y Progreso y Evaluaciones muestran «No se encontraron
              resultados». Gestión de intentos sigue su propia fecha y Descargas no cambia.
            </AlertDescription>
            <AlertAction>
              <Button variant="outline" size="sm" onClick={() => setSinInscritos((actual) => !actual)}>
                {sinInscritos ? 'Volver a los datos' : 'Verlo'}
              </Button>
            </AlertAction>
          </Alert>
        </div>
      </AccionesContexto.Provider>

      {/* RN-09: modal «Detalles de evaluación»; lo que no aplica dice «No aplica». */}
      <ActionDialog
        open={detalleAbierto}
        onOpenChange={setDetalleAbierto}
        title="Detalles de evaluación"
        sub={detalle?.nombre}
        footer={<Button onClick={() => setDetalleAbierto(false)}>Entendido</Button>}
      >
        <ItemGroup className="flex flex-col gap-1">
          {detalle
            ? [
                ['Peso', `${detalle.peso} %`],
                ['Porcentaje para aprobar', `${detalle.aprobar} %`],
                ['Límite de intentos', `${detalle.intentos}`],
                ['Tiempo límite', detalle.tiempo],
                ['Total de preguntas', `${detalle.preguntas}`],
              ].map(([etiqueta, valor]) => (
                <Item key={etiqueta} size="xs">
                  <ItemContent>
                    <ItemDescription>{etiqueta}</ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Text as="span" size="sm" weight="medium">
                      {valor}
                    </Text>
                  </ItemActions>
                </Item>
              ))
            : null}
        </ItemGroup>
      </ActionDialog>

      {/* RN-11: confirmación antes de desbloquear; cancelar no cambia la lista. */}
      <DialogoConfirmar
        abierto={confirmando}
        onAbiertoChange={setConfirmando}
        size="sm"
        icono={SquareUnlock02Icon}
        titulo={varios ? '¿Desbloquear usuarios?' : '¿Desbloquear usuario?'}
        descripcion={
          varios
            ? `Las ${porDesbloquear.length} personas seleccionadas recibirán 1 intento más cada una.`
            : `${porDesbloquear[0]?.nombre ?? 'La persona'} recibirá 1 intento más en ${porDesbloquear[0]?.evaluacion ?? 'la evaluación'}.`
        }
        accion="Desbloquear"
        onConfirmar={confirmarDesbloqueo}
      />

      <DrawerShell
        open={panelAbierto}
        onOpenChange={setPanelAbierto}
        title={colaborador ? `Progreso de ${colaborador.nombre}` : ''}
        description={colaborador ? `${colaborador.avance} % del contenido · inició el ${fechaCorta(colaborador.inicio)}` : undefined}
      >
        <ProgresoDelColaborador colaborador={colaborador} />
      </DrawerShell>
    </CasoUbits>
  )
}
