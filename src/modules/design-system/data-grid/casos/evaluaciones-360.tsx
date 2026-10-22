import { createContext, useContext, useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Analytics01Icon,
  CheckmarkBadge01Icon,
  Delete02Icon,
  Download01Icon,
  Edit02Icon,
  Mail01Icon,
  MoreHorizontalIcon,
  PlusSignIcon,
  ViewIcon,
} from '@hugeicons/core-free-icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Progress,
  ProgressLabel,
  ProgressValue,
  Text,
  type DataGridListConfig,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { notify } from '@/shared/components/notify'
import { DialogoConfirmar, RegistroConfirmar } from '@/modules/design-system/estados/confirmaciones'

import { CasoUbits } from '../../patrones/piezas'
import { diasDesde, fechaCorta, fechaSinAnio, plural } from '../../patrones/formato'

// Caso: listado de evaluaciones 360° del administrador (Desempeño y cultura).
// Fuente: HU lista de evaluaciones 360° y marco B del recorrido (28 evaluaciones creadas).

type Estado = 'Borrador' | 'En progreso' | 'Finalizada'
type Filtro = { id: string; value: unknown }

type Evaluacion = {
  id: string
  nombre: string
  creadaPor: string
  competencias: number
  inicio: string | null
  cierre: string | null
  evaluados: number
  respuestas: number
  esperadas: number
  avance: number
  estado: Estado
}

type Fila = [string, string, number, string | null, string | null, number, number, number, Estado]

const FILAS: Fila[] = [
  ['Evaluación de desempeño 2026-II', 'Lucía Ortega', 12, '2026-08-14', '2026-09-30', 184, 412, 736, 'En progreso'],
  ['Liderazgo · mandos medios', 'Daniela Soto', 8, '2026-09-01', '2026-09-25', 42, 98, 168, 'En progreso'],
  ['Onboarding 90 días · cohorte agosto', 'Sofía Duarte', 6, '2026-08-20', '2026-09-15', 18, 60, 72, 'En progreso'],
  ['Servicio al cliente · sucursal Beta', 'Julia Moreno', 7, '2026-08-25', '2026-09-11', 26, 91, 104, 'En progreso'],
  ['Liderazgo remoto', 'Camila Bravo', 9, '2026-09-08', '2026-10-10', 31, 12, 124, 'En progreso'],
  ['Cultura y valores 2026', 'Lucía Ortega', 10, null, null, 0, 0, 0, 'Borrador'],
  ['Feedback equipo de producto', 'Andrés Cabrera', 5, '2026-10-01', '2026-10-20', 0, 0, 0, 'Borrador'],
  ['Habilidades digitales', 'Gabriela Nieto', 6, null, null, 0, 0, 0, 'Borrador'],
  ['Evaluación de desempeño 2026-I', 'Lucía Ortega', 12, '2026-02-10', '2026-03-31', 176, 690, 704, 'Finalizada'],
  ['Competencias comerciales Q2', 'Óscar Delgado', 8, '2026-05-05', '2026-05-30', 38, 140, 152, 'Finalizada'],
  ['Periodo de prueba · primer semestre', 'Sofía Duarte', 6, '2026-06-02', '2026-06-20', 22, 81, 88, 'Finalizada'],
  ['360° directivos 2025', 'Daniela Soto', 14, '2025-11-03', '2025-11-28', 12, 46, 48, 'Finalizada'],
]

const EVALUACIONES_INICIALES: Evaluacion[] = FILAS.map(
  ([nombre, creadaPor, competencias, inicio, cierre, evaluados, respuestas, esperadas, estado], i) => ({
    id: `e360-${i + 1}`,
    nombre,
    creadaPor,
    competencias,
    inicio,
    cierre,
    evaluados,
    respuestas,
    esperadas,
    avance: esperadas ? Math.round((respuestas / esperadas) * 100) : 0,
    estado,
  }),
)

const ESTADOS: Estado[] = ['Borrador', 'En progreso', 'Finalizada']

const BADGE: Record<Estado, 'secondary' | 'info-light' | 'success-light'> = {
  Borrador: 'secondary',
  'En progreso': 'info-light',
  Finalizada: 'success-light',
}

function plazo(evaluacion: Evaluacion) {
  if (!evaluacion.cierre) return 'Sin fechas todavía'
  const dias = -diasDesde(evaluacion.cierre)
  if (evaluacion.estado === 'Finalizada') return `Cerró el ${fechaCorta(evaluacion.cierre)}`
  if (evaluacion.estado === 'Borrador') return 'Aún no se lanza'
  if (dias === 0) return 'Cierra hoy'
  if (dias === 1) return 'Cierra mañana'
  return `Cierra en ${dias} días`
}

// ── Acciones según el estado ──
// El menú de fila que trae la tabla (actions.item) es el mismo para todas las filas. Aquí cada
// estado permite cosas distintas (finalizar solo lo que está en progreso), así que el menú se
// arma en una columna propia con DropdownMenu. La columna lee las acciones de un contexto para
// que COLUMNAS pueda seguir declarada fuera del componente.

type Accion = 'continuar' | 'avance' | 'recordar' | 'finalizar' | 'resultados' | 'descargar' | 'eliminar'
const AccionContexto = createContext<(accion: Accion, evaluacion: Evaluacion) => void>(() => undefined)

const MENU: Record<Estado, { id: Accion; label: string; icon: typeof ViewIcon }[]> = {
  Borrador: [{ id: 'continuar', label: 'Continuar configuración', icon: Edit02Icon }],
  'En progreso': [
    { id: 'avance', label: 'Ver avance', icon: ViewIcon },
    { id: 'recordar', label: 'Enviar recordatorio', icon: Mail01Icon },
    { id: 'finalizar', label: 'Finalizar', icon: CheckmarkBadge01Icon },
  ],
  Finalizada: [
    { id: 'resultados', label: 'Ver resultados', icon: Analytics01Icon },
    { id: 'descargar', label: 'Descargar reporte', icon: Download01Icon },
  ],
}

function MenuDeFila({ evaluacion }: { evaluacion: Evaluacion }) {
  const ejecutar = useContext(AccionContexto)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<BotonIcono aria-label={`Acciones de ${evaluacion.nombre}`} />}
      >
        <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
      </DropdownMenuTrigger>
      {/* El menú toma el ancho del botón que lo abre; con un botón de icono hay que darle uno propio. */}
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          {MENU[evaluacion.estado].map((item) => (
            <DropdownMenuItem key={item.id} onClick={() => ejecutar(item.id, evaluacion)}>
              <HugeiconsIcon icon={item.icon} aria-hidden="true" />
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => ejecutar('eliminar', evaluacion)}>
          <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// El tipo de las columnas no declara enableColumnOrdering; va esparcido desde una constante.
const SIN_ARRASTRE = { enableColumnOrdering: false }

const COLUMNAS: DataGridListConfig<Evaluacion>['columns'] = [
  {
    accessorKey: 'nombre',
    header: 'Evaluación',
    size: 300,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <div className="flex min-w-0 flex-col gap-1">
        <Text as="span" size="sm" weight="medium" className="truncate">
          {row.original.nombre}
        </Text>
        <Text as="span" variant="muted" size="xs" className="truncate">
          {row.original.competencias} competencias · Creada por {row.original.creadaPor}
        </Text>
      </div>
    ),
  },
  {
    accessorKey: 'cierre',
    header: 'Periodo',
    size: 190,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <div className="flex min-w-0 flex-col gap-1">
        <Text as="span" size="sm">
          {row.original.inicio && row.original.cierre
            ? `${fechaSinAnio(row.original.inicio)} – ${fechaSinAnio(row.original.cierre)}`
            : '—'}
        </Text>
        <Text as="span" variant="muted" size="xs">
          {plazo(row.original)}
        </Text>
      </div>
    ),
  },
  {
    accessorKey: 'evaluados',
    header: 'Evaluados',
    size: 120,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <Text as="span" size="sm" className="tabular-nums">
        {row.original.evaluados ? `${row.original.evaluados} ${plural(row.original.evaluados, 'persona', 'personas')}` : '—'}
      </Text>
    ),
  },
  {
    accessorKey: 'avance',
    header: 'Respuestas',
    size: 190,
    ...SIN_ARRASTRE,
    cell: ({ row }) =>
      row.original.estado === 'Borrador' ? (
        <Text as="span" variant="muted" size="sm">
          Sin lanzar
        </Text>
      ) : (
        <Progress value={row.original.avance} className="w-full gap-1.5">
          <ProgressLabel>
            {row.original.respuestas} de {row.original.esperadas}
          </ProgressLabel>
          <ProgressValue className="ms-auto" />
        </Progress>
      ),
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    size: 130,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <Badge variant={BADGE[row.original.estado]} size="sm">
        {row.original.estado}
      </Badge>
    ),
  },
  {
    id: 'acciones',
    // 13-oct: lleva su encabezado «Acciones» (regla de la columna de acciones), con el ancho para que se lea.
    header: 'Acciones',
    size: 100,
    enableSorting: false,
    enableResizing: false,
    ...SIN_ARRASTRE,
    cell: ({ row }) => <MenuDeFila evaluacion={row.original} />,
  },
]

const FILTROS: DataGridListConfig<Evaluacion>['columnFilters'] = [
  {
    id: 'estado',
    label: 'Estado',
    type: 'select',
    multiple: true,
    options: ESTADOS.map((estado) => ({ label: estado, value: estado })),
  },
]

function resolver(filas: Evaluacion[], busqueda: string, filtros: Filtro[], orden?: string) {
  const q = busqueda.trim().toLowerCase()
  let resultado = filas.filter((fila) => {
    if (q && ![fila.nombre, fila.creadaPor].some((campo) => campo.toLowerCase().includes(q))) return false
    for (const { id, value } of filtros) {
      if (Array.isArray(value) && value.length > 0 && !value.map(String).includes(String(fila[id as keyof Evaluacion]))) {
        return false
      }
    }
    return true
  })

  if (orden) {
    const desc = orden.startsWith('-')
    const campo = (desc ? orden.slice(1) : orden) as keyof Evaluacion
    resultado = [...resultado].sort((a, b) => {
      const va = a[campo] ?? ''
      const vb = b[campo] ?? ''
      const r = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'es')
      return desc ? -r : r
    })
  }

  return resultado
}

type Pendiente = { tipo: 'eliminar' | 'finalizar' | 'recordar'; evaluacion: Evaluacion }

function textoEliminar(evaluacion: Evaluacion) {
  if (evaluacion.estado === 'Borrador') return 'Se pierde la configuración que llevas. No se puede deshacer.'
  if (evaluacion.estado === 'En progreso') {
    return `Se borran también las ${evaluacion.respuestas} respuestas recibidas y nadie más podrá responder. No se puede deshacer.`
  }
  return `Se borran los resultados y los reportes de ${evaluacion.evaluados} personas. No se puede deshacer.`
}

export function CasoEvaluaciones360() {
  const [evaluaciones, setEvaluaciones] = useState(EVALUACIONES_INICIALES)
  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState<Filtro[]>([])
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  // El diálogo guarda la última acción aunque se cierre: así el texto no cambia mientras se
  // desvanece.
  const [pendiente, setPendiente] = useState<Pendiente | null>(null)
  const [dialogoAbierto, setDialogoAbierto] = useState(false)

  const resultado = useMemo(() => resolver(evaluaciones, busqueda, filtros, orden), [evaluaciones, busqueda, filtros, orden])
  const visibles = useMemo(() => resultado.slice((pagina - 1) * porPagina, pagina * porPagina), [resultado, pagina, porPagina])
  const hayFiltros = busqueda.trim() !== '' || filtros.length > 0

  const ejecutar = (accion: Accion, evaluacion: Evaluacion) => {
    // Eliminar, finalizar y recordar afectan a otras personas o no se revierten: preguntan antes (13-oct, regla
    // «preguntar-antes»; el recordatorio se enviaba sin preguntar).
    if (accion === 'eliminar' || accion === 'finalizar' || accion === 'recordar') {
      setPendiente({ tipo: accion, evaluacion })
      setDialogoAbierto(true)
      return
    }
    const avisos: Record<Exclude<Accion, 'eliminar' | 'finalizar' | 'recordar'>, string> = {
      continuar: 'Se abre el hub de creación con lo que ya llenaste',
      avance: 'Se abre el avance de respuestas por evaluado',
      resultados: 'Se abren los resultados generales',
      descargar: 'Reporte descargado',
    }
    notify(avisos[accion], evaluacion.nombre, accion === 'descargar' ? 'success' : 'info')
  }

  const confirmar = () => {
    if (!pendiente) return
    const { tipo, evaluacion } = pendiente

    if (tipo === 'eliminar') {
      setEvaluaciones((actuales) => actuales.filter((e) => e.id !== evaluacion.id))
      notify('Evaluación eliminada', evaluacion.nombre, 'success')
    } else if (tipo === 'recordar') {
      notify('Recordatorio enviado', `Les llegó a las ${evaluacion.esperadas - evaluacion.respuestas} personas que no han respondido.`, 'success')
    } else {
      setEvaluaciones((actuales) =>
        actuales.map((e) => (e.id === evaluacion.id ? { ...e, estado: 'Finalizada', cierre: '2026-09-11' } : e)),
      )
      notify('Evaluación finalizada', 'Los resultados ya se pueden consultar.', 'success')
    }
    setDialogoAbierto(false)
  }

  const config: DataGridListConfig<Evaluacion> = {
    columns: COLUMNAS,
    columnFilters: FILTROS,
    onColumnFiltersChange: (nuevos) => {
      setFiltros(nuevos)
      setPagina(1)
    },
    sort: { onSortChange: setOrden },
    search: {
      placeholder: 'Buscar por nombre o por quién la creó…',
      onSearch: (q) => {
        setBusqueda(q)
        setPagina(1)
      },
    },
    actions: {
      primary: {
        id: 'crear',
        label: 'Crear evaluación 360°',
        icon: <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />,
        onClick: () => notify('Se abre el hub de creación', 'Míralo en Formularios › Secciones que se desbloquean.', 'info'),
      },
    },
    emptyState: hayFiltros
      ? {
          type: 'no-results',
          title: 'Ninguna evaluación coincide',
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
        }
      : {
          type: 'empty',
          title: 'Todavía no hay evaluaciones 360°',
          description: 'Crea la primera para empezar a recoger feedback de varias fuentes.',
          action: { id: 'crear', label: 'Crear evaluación 360°', onClick: () => setEvaluaciones(EVALUACIONES_INICIALES) },
        },
    frame: { toolbar: 'header' },
    labels: {
      resultCount: (visibles, total) =>
        `${total} ${plural(total, 'evaluación', 'evaluaciones')}${visibles < total ? ` · ${visibles} en esta página` : ''}`,
    },
  }

  const eliminando = pendiente?.tipo === 'eliminar'
  const recordando = pendiente?.tipo === 'recordar'

  return (
    <CasoUbits
      rol="Administrador"
      donde={['Desempeño y cultura', 'Evaluaciones 360']}
      titulo="Listado con acciones que dependen del estado"
      descripcion="Recursos Humanos gestiona el ciclo de vida de sus evaluaciones sin entrar a cada una. Abre el menú de una fila en progreso y compáralo con el de una finalizada: solo aparece lo que tiene sentido en ese momento."
      historia="la historia «Listado de evaluaciones 360°»"
      reglas={[
        { titulo: 'Crear sale del listado', detalle: 'El botón principal abre el hub de creación de la evaluación.' },
        { titulo: 'Finalizar solo lo que está en curso', detalle: 'La acción aparece únicamente en las evaluaciones en progreso.' },
        { titulo: 'Eliminar pide confirmación', detalle: 'El diálogo cuenta qué se pierde. Si se cancela, la evaluación sigue en la lista.' },
        { titulo: 'Filtro sin coincidencias', detalle: 'Se muestra el vacío de «sin resultados» con la salida de limpiar filtros.' },
      ]}
    >
      <AccionContexto.Provider value={ejecutar}>
        <TablaDatos config={config} data={visibles} paginacion={{ pagina: pagina, setPagina: setPagina, porPagina: porPagina, setPorPagina: setPorPagina, total: resultado.length }} nombre="evaluaciones" id="evaluaciones" />
      </AccionContexto.Provider>

      <DialogoConfirmar
        abierto={dialogoAbierto}
        onAbiertoChange={setDialogoAbierto}
        icono={eliminando ? Delete02Icon : recordando ? Mail01Icon : CheckmarkBadge01Icon}
        titulo={eliminando ? `¿Eliminar «${pendiente?.evaluacion.nombre}»?` : recordando ? '¿Enviar el recordatorio?' : '¿Finalizar la evaluación?'}
        descripcion={
          pendiente
            ? eliminando
              ? textoEliminar(pendiente.evaluacion)
              : recordando
                ? `Les llega por correo a las ${pendiente.evaluacion.esperadas - pendiente.evaluacion.respuestas} personas que no han respondido. Un correo enviado no se puede recoger.`
                : `Quienes no respondieron ya no podrán hacerlo. Faltan ${pendiente.evaluacion.esperadas - pendiente.evaluacion.respuestas} respuestas de ${pendiente.evaluacion.esperadas}.`
            : null
        }
        cancelar={recordando ? 'Todavía no' : undefined}
        accion={eliminando ? 'Eliminar evaluación' : recordando ? 'Enviar recordatorio' : 'Finalizar ahora'}
        destructiva={eliminando}
        onConfirmar={confirmar}
      >
        {recordando && pendiente ? (
          <RegistroConfirmar
            nombre={pendiente.evaluacion.nombre}
            detalle={`Evaluación 360° · ${pendiente.evaluacion.respuestas} de ${pendiente.evaluacion.esperadas} respuestas`}
            estado={`${pendiente.evaluacion.esperadas - pendiente.evaluacion.respuestas} personas`}
          />
        ) : null}
      </DialogoConfirmar>
    </CasoUbits>
  )
}
