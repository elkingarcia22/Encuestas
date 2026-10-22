import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Copy01Icon, Delete02Icon, Download01Icon, Edit02Icon, Mail01Icon, MoreHorizontalIcon } from '@hugeicons/core-free-icons'
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  toast,
  type DataGridListConfig,
} from '@ubits/flux-ui'
import { notify, notifyAction } from '@/shared/components/notify'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { PageSection } from '@/shared/components/PageShell'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'

import { ConfirmarEliminar, Indicadores, Persona } from '../../../data-grid/casos/seguimiento'
import { SIN_ARRASTRE } from '../../../data-grid/casos/sin-arrastre'
import { DialogoConfirmar } from '../../../estados/confirmaciones'
import { PantallaDeError } from '../../../estados/errores-sistema'
import { registroQueNoExiste } from '../../../estados/errores-sistema-datos'
import { ActualizadoHace } from '../../../estados/procesos'
import { fechaCorta, plural } from '../../../patrones/formato'
import { pagina, resolver, useCargaInicial, type Filtro } from '../../admin-compartido/lista'
import { EncabezadoPantalla } from '../../admin-compartido/piezas'
import { TIPOS, participantesDe, progresoDe, ruta, totalPersonas, type EstadoPlan, type Participante } from '../components/datos'
import { usePlanes } from '../components/estado'

// «Detalle del plan de contenidos» (/creator/training-plan/content-plan/:id): el plan con sus
// fechas y su progreso, y la tabla de asignaciones con Último acceso, Última fecha de progreso,
// Contenidos (x / y) y Progreso. El progreso del plan cuenta personas al 100 % (RN-08) y no está
// en vivo (RN-09), como en el patrón «Datos que no están en vivo».

type Fila = Participante & { avance: 'Sin iniciar' | 'En curso' | 'Completado' }

const BADGE: Record<EstadoPlan, 'success-light' | 'secondary' | 'outline' | 'info-light'> = { Vigente: 'success-light', Planeado: 'secondary', 'No vigente': 'outline', Procesando: 'info-light' }

const COLUMNAS: DataGridListConfig<Fila>['columns'] = [
  { accessorKey: 'nombre', header: 'Nombre', size: 280, ...SIN_ARRASTRE, cell: ({ row }) => <Persona nombre={row.original.nombre} detalle={row.original.area} /> },
  {
    accessorKey: 'ultimoAcceso',
    header: 'Último acceso',
    size: 150,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <Text as="span" size="sm" variant={row.original.ultimoAcceso ? undefined : 'muted'}>
        {row.original.ultimoAcceso ?? 'Sin acceso'}
      </Text>
    ),
  },
  {
    accessorKey: 'ultimoProgreso',
    header: 'Última fecha de progreso',
    size: 190,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <Text as="span" size="sm" variant={row.original.ultimoProgreso ? undefined : 'muted'}>
        {row.original.ultimoProgreso ?? '—'}
      </Text>
    ),
  },
  {
    accessorKey: 'hechos',
    header: 'Contenidos',
    size: 120,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <Text as="span" size="sm" className="tabular-nums">
        {row.original.hechos} / {row.original.total}
      </Text>
    ),
  },
  {
    accessorKey: 'progreso',
    header: 'Progreso',
    size: 200,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <Progress value={row.original.progreso} className="w-full gap-1.5">
        <ProgressValue className="ms-auto" />
      </Progress>
    ),
  },
]

const FILTROS: DataGridListConfig<Fila>['columnFilters'] = [
  {
    id: 'avance',
    label: 'Avance',
    type: 'select',
    multiple: true,
    options: ['Sin iniciar', 'En curso', 'Completado'].map((v) => ({ label: v, value: v })),
  },
]

export function Component() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { planes, setPlanes } = usePlanes()
  const plan = planes.find((p) => p.id === id)
  const [cargando] = useCargaInicial()
  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState<Filtro[]>([])
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const [actual, setActual] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [eliminando, setEliminando] = useState(false)
  const [recordando, setRecordando] = useState<Fila[]>([])
  const [limpiarSeleccion, setLimpiarSeleccion] = useState<Record<string, boolean>>({})

  const filas = useMemo<Fila[]>(
    () =>
      plan
        ? participantesDe(plan).map((p) => ({ ...p, avance: p.progreso === 100 ? 'Completado' : p.progreso > 0 ? 'En curso' : 'Sin iniciar' }))
        : [],
    [plan],
  )
  const resultado = useMemo(() => resolver(filas, busqueda, ['nombre', 'area'], filtros, orden), [filas, busqueda, filtros, orden])
  const visibles = useMemo(() => pagina(resultado, actual, porPagina), [resultado, actual, porPagina])

  if (!plan) {
    return (
      <div className="flex flex-1 flex-col pt-2">
        <PantallaDeError error={registroQueNoExiste('este plan', 'Planes')} onAccion={() => navigate(ruta())} />
      </div>
    )
  }

  const textos = TIPOS[plan.tipo]
  const empezo = plan.estado === 'Vigente' || plan.estado === 'No vigente'
  const progreso = progresoDe(plan)
  const cuenta = (avance: Fila['avance']) => filas.filter((f) => f.avance === avance).length

  const duplicar = () => {
    const copia = { ...plan, id: `p-${Date.now()}`, nombre: `Copia de ${plan.nombre}`, estado: 'Planeado' as const, procesando: undefined, tocado: Date.now() }
    setPlanes((todos) => [copia, ...todos])
    // Se deshace con un clic: se duplica sin preguntar y el aviso trae «Deshacer».
    notifyAction(
      'Plan duplicado',
      `«${copia.nombre}» quedó en Planeado para que le cambies las fechas.`,
      { label: 'Deshacer', onClick: () => setPlanes((todos) => todos.filter((p) => p.id !== copia.id)) },
      'success',
    )
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
      placeholder: 'Buscar persona o área…',
      onSearch: (q) => {
        setBusqueda(q)
        setActual(1)
      },
    },
    selection: { onSelectionChange: () => undefined },
    actions: {
      bulk: [
        {
          id: 'recordar',
          label: 'Enviar recordatorio',
          icon: <HugeiconsIcon icon={Mail01Icon} aria-hidden="true" />,
          onClick: (seleccion) => {
            const pendientes = seleccion.filter((f) => f.progreso < 100)
            if (pendientes.length) setRecordando(pendientes)
            else notify('No hay a quién recordarle', 'Las personas elegidas ya terminaron el plan.', 'info')
          },
        },
      ],
    },
    // Sin resultados con la ilustración glass del sistema y «Limpiar» (13-oct, I-182).
    emptyState: {
      type: 'no-results',
      customComponent: (
        <SinResultados
          busqueda={busqueda}
          filtrosActivos={filtros.filter((f) => Array.isArray(f.value) && f.value.length > 0).length}
          onLimpiar={() => {
            setBusqueda('')
            setFiltros([])
          }}
        />
      ),
    },
    // Sin `layout`: la tabla sale como todas (5-oct), con encabezados de 40 px y el asidero de cada columna.
    frame: { toolbar: 'header' },
    labels: { resultCount: (_v, total) => `${total.toLocaleString('es-CO')} ${plural(total, 'persona', 'personas')}` },
  }

  return (
    <div className="flex flex-1 flex-col gap-6 pt-2">
      <EncabezadoPantalla
        titulo={`Detalle del ${textos.singular.toLowerCase()}`}
        volver={{ ruta: ruta(), etiqueta: 'Planes de formación' }}
        acciones={
          // Más acciones en el «⋯» del sistema (BotonIcono), el primero de la fila, con su menú alineado al inicio
          // (decisión 15 de la auditoría).
          <DropdownMenu>
            <DropdownMenuTrigger render={<BotonIcono aria-label="Más acciones del plan" />}>
              <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuGroup>
                {plan.estado !== 'No vigente' ? (
                  <DropdownMenuItem onClick={() => navigate(ruta(`${plan.id}/editar`))}>
                    <HugeiconsIcon icon={Edit02Icon} aria-hidden="true" />
                    Editar
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem onClick={duplicar}>
                  <HugeiconsIcon icon={Copy01Icon} aria-hidden="true" />
                  Duplicar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    toast.promise(new Promise((listo) => setTimeout(listo, 1800)), {
                      loading: 'Preparando el reporte del plan…',
                      success: 'Reporte listo: también lo enviamos a tu correo',
                      error: 'No pudimos preparar el reporte',
                    })
                  }
                >
                  <HugeiconsIcon icon={Download01Icon} aria-hidden="true" />
                  Descargar
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setEliminando(true)}>
                <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>{plan.nombre}</CardTitle>
            <Badge variant={BADGE[plan.estado]}>{plan.estado === 'Procesando' ? `Procesando ${plan.procesando ?? 0} %` : plan.estado}</Badge>
          </div>
          <CardDescription>
            Fecha de inicio: {fechaCorta(plan.inicio)} · Fecha de cierre: {fechaCorta(plan.fin)} · {plan.asignaciones.length}{' '}
            {plural(plan.asignaciones.length, 'asignación', 'asignaciones')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Progress value={progreso}>
            <ProgressLabel>Progreso del plan · personas que terminaron el 100 %</ProgressLabel>
            <ProgressValue className="ms-auto">{() => `${progreso.toLocaleString('es-CO')} %`}</ProgressValue>
          </Progress>
          <ActualizadoHace
            texto="Actualizado hace 12 minutos"
            ayuda="El progreso del plan se actualiza cada 30 minutos, no en tiempo real. Cuenta a quienes terminaron todo lo asignado, no el promedio de avances."
          />
        </CardContent>
      </Card>

      {empezo ? (
        <>
          <Indicadores
            items={[
              { titulo: 'Asignados', valor: filas.length, detalle: `${totalPersonas(plan).toLocaleString('es-CO')} en ${plan.asignaciones.length} ${plural(plan.asignaciones.length, 'asignación', 'asignaciones')}` },
              { titulo: 'Completaron', valor: cuenta('Completado'), detalle: `Todos sus ${textos.items}` },
              { titulo: 'En curso', valor: cuenta('En curso'), detalle: 'Van a mitad de camino' },
              { titulo: 'Sin iniciar', valor: cuenta('Sin iniciar'), detalle: plan.estado === 'No vigente' ? 'El plan ya cerró' : 'Aún no empiezan', atencion: plan.estado === 'Vigente' },
            ]}
          />
          {/* La tabla del sistema no lleva título dentro de su marco (5-oct): el de la lista va en su sección. */}
          <PageSection title="Asignaciones">
            <TablaDatos config={config} data={visibles} isLoading={cargando} initialRowSelection={limpiarSeleccion} paginacion={{ pagina: actual, setPagina: setActual, porPagina: porPagina, setPorPagina: setPorPagina, total: resultado.length }} nombre="personas" singular="persona" id="personas" />
          </PageSection>
        </>
      ) : (
        // Un plan que todavía no empieza no tiene avance que mostrar (estado vacío «todavía no»), con la ilustración del
        // sistema en vez del icono de línea (decisión 14 de la auditoría).
        <Card>
          <CardContent>
            <PrimeraVez
              icono="glass-calendar"
              titulo={`Este plan empieza el ${fechaCorta(plan.inicio)}`}
              descripcion={`Cuando arranque verás aquí quién avanza y quién no. ${totalPersonas(plan).toLocaleString('es-CO')} personas ya lo tienen asignado.`}
            />
          </CardContent>
        </Card>
      )}

      <ConfirmarEliminar
        abierto={eliminando}
        onAbiertoChange={setEliminando}
        cantidad={1}
        sustantivo={['plan', 'planes']}
        titulo="Eliminar plan de formación"
        descripcion={`¿Deseas eliminar realmente el plan «${plan.nombre}»? ${totalPersonas(plan).toLocaleString('es-CO')} personas lo pierden de su Zona de estudio. Su avance en los contenidos se conserva, pero el plan no se puede recuperar.`}
        accion="Eliminar plan"
        onConfirmar={() => {
          setEliminando(false)
          setPlanes((todos) => todos.filter((p) => p.id !== plan.id))
          notify('Plan eliminado', `«${plan.nombre}» ya no aparece en la Zona de estudio de nadie.`, 'success')
          navigate(ruta())
        }}
      />

      {/* Le llega a otras personas: dice a cuántas antes de enviar (escalón 3 de Confirmaciones). */}
      <DialogoConfirmar
        abierto={recordando.length > 0}
        onAbiertoChange={(abierto) => (abierto ? undefined : setRecordando([]))}
        icono={Mail01Icon}
        titulo="Enviar recordatorio"
        descripcion={`Le llegará un correo a ${recordando.length} ${plural(recordando.length, 'persona', 'personas')} que ${plural(recordando.length, 'no ha', 'no han')} terminado «${plan.nombre}», con lo que le falta y la fecha de cierre (${fechaCorta(plan.fin)}).`}
        accion={`Enviar a ${recordando.length} ${plural(recordando.length, 'persona', 'personas')}`}
        onConfirmar={() => {
          notify('Recordatorio enviado', `Va en camino a ${recordando.length} ${plural(recordando.length, 'persona', 'personas')}.`, 'success')
          setRecordando([])
          setLimpiarSeleccion({})
        }}
      />

    </div>
  )
}

Component.displayName = 'PlanesFormacionDetalle'
