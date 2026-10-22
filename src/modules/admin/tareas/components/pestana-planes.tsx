import { createContext, useContext, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { Calendar03Icon, Delete02Icon, Download01Icon, Notification01Icon, TaskDone01Icon, UserSwitchIcon } from '@hugeicons/core-free-icons'
import {
  Button,
  Field,
  FieldLabel,
  Progress,
  ProgressValue,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
  toast,
  type DataGridListConfig,
} from '@ubits/flux-ui'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import { Badge } from '@/shared/components/Badge'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'

import { SIN_ARRASTRE } from '@/modules/design-system/data-grid/casos/sin-arrastre'
import { ConfirmarEliminar, Persona } from '@/modules/design-system/data-grid/casos/seguimiento'
import { DialogoConfirmar, RegistroConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { fechaCorta, fechaSinAnio, formatoKM, HOY, plural } from '@/modules/design-system/patrones/formato'
import { CampoFecha } from '@/modules/design-system/formularios/rango-de-fechas'
import { notify } from '@/shared/components/notify'
import {
  BADGE_PLAN,
  ESTADOS_PLAN,
  PERIODOS,
  PERSONAS,
  aFechaIso,
  dentroDelPeriodo,
  type EstadoPlan,
  type Plan,
  type Rango,
  type Tarea,
} from './datos'
import { DetallePlan, type AccionesPlan } from './detalle-plan'
import { Indicadores, MaestroDetalle, SelectorPeriodo } from './piezas'
import { copiarEnlace } from './utilidades'

// Pestaña Planes (RN-02): su propio periodo, búsqueda, filtros y selección. Sin prioridad (RN-04).

type Filtro = { id: string; value: unknown }
type CambioMasivo = 'reasignar' | 'estado' | 'fecha'
type PlanConAvance = Plan & { total: number; finalizadas: number; avance: number }

const FilaContexto = createContext<{ elegido?: string; abrir: (plan: Plan) => void }>({ abrir: () => undefined })

function CeldaPlan({ plan }: { plan: PlanConAvance }) {
  const { elegido, abrir } = useContext(FilaContexto)
  const abierto = elegido === plan.id
  return (
    <div className="flex min-w-0 flex-col items-start gap-1">
      <Button variant="link" size="sm" className="h-auto max-w-full p-0" aria-current={abierto} onClick={() => abrir(plan)}>
        <span className="truncate">{plan.nombre}</span>
      </Button>
      <div className="flex min-w-0 max-w-full items-center gap-1.5">
        {abierto ? (
          <Badge variant="primary-light" size="xs">
            En detalle
          </Badge>
        ) : null}
        <Text as="span" variant="muted" size="xs" className="truncate">
          {plan.total} {plural(plan.total, 'tarea', 'tareas')}
        </Text>
      </div>
    </div>
  )
}

const COLUMNAS: DataGridListConfig<PlanConAvance>['columns'] = [
  {
    accessorKey: 'nombre',
    header: 'Plan',
    size: 220,
    ...SIN_ARRASTRE,
    cell: ({ row }) => <CeldaPlan plan={row.original} />,
  },
  {
    accessorKey: 'responsable',
    header: 'Responsable',
    size: 170,
    ...SIN_ARRASTRE,
    cell: ({ row }) => <Persona nombre={row.original.responsable} detalle={row.original.area} />,
  },
  {
    accessorKey: 'avance',
    header: 'Avance',
    size: 110,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <Progress value={row.original.avance} className="w-full gap-1">
        <ProgressValue className="ms-auto" />
      </Progress>
    ),
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    size: 104,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <Badge variant={BADGE_PLAN[row.original.estado]} size="sm">
        {row.original.estado}
      </Badge>
    ),
  },
  {
    accessorKey: 'fin',
    header: 'Fechas',
    size: 116,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        <Text as="span" size="sm">
          {fechaCorta(row.original.fin)}
        </Text>
        <Text as="span" variant="muted" size="xs">
          Desde el {fechaSinAnio(row.original.inicio)}
        </Text>
      </div>
    ),
  },
]

const FILTROS: DataGridListConfig<PlanConAvance>['columnFilters'] = [
  { id: 'estado', label: 'Estado', type: 'select', multiple: true, options: ESTADOS_PLAN.map((e) => ({ label: e, value: e })) },
]

const icono = (i: IconSvgElement) => <HugeiconsIcon icon={i} aria-hidden="true" />

const TEXTO_CAMBIO: Record<CambioMasivo, { titulo: string; campo: string; accion: string }> = {
  reasignar: { titulo: 'Cambiar responsable', campo: 'Nueva persona responsable', accion: 'Cambiar responsable' },
  estado: { titulo: 'Cambiar estado', campo: 'Nuevo estado', accion: 'Cambiar estado' },
  fecha: { titulo: 'Cambiar fecha de fin', campo: 'Nueva fecha de fin', accion: 'Cambiar fecha' },
}

export function PestanaPlanes({
  planes,
  setPlanes,
  tareas,
  elegido,
  setElegido,
  limpiarSeleccion,
  onLimpiarSeleccion,
  onVerTarea,
}: {
  planes: Plan[]
  setPlanes: Dispatch<SetStateAction<Plan[]>>
  tareas: Tarea[]
  elegido: string | undefined
  setElegido: (id: string | undefined) => void
  limpiarSeleccion: Record<string, boolean>
  onLimpiarSeleccion: () => void
  onVerTarea: (tarea: Tarea) => void
}) {
  const [periodo, setPeriodo] = useState('7')
  const [rango, setRango] = useState<Rango>(undefined)
  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState<Filtro[]>([])
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(50)
  const [version, setVersion] = useState(0)
  const [enPanel, setEnPanel] = useState(false)
  const [porEliminar, setPorEliminar] = useState<Plan[]>([])
  const [eliminando, setEliminando] = useState(false)
  const [cambio, setCambio] = useState<{ tipo: CambioMasivo; filas: Plan[] } | null>(null)
  const [valorCambio, setValorCambio] = useState('')
  // El recordatorio llega a todas las personas con tareas abiertas del plan: se pregunta antes de enviarlo.
  const [porRecordar, setPorRecordar] = useState<{ plan: Plan; personas: number; tareas: number } | null>(null)

  // El avance sale de las tareas del plan: se actualiza al finalizar tareas en la otra pestaña.
  const conAvance = useMemo<PlanConAvance[]>(
    () =>
      planes.map((p) => {
        const propias = tareas.filter((t) => t.plan === p.nombre)
        const finalizadas = propias.filter((t) => t.estado === 'Finalizada').length
        return {
          ...p,
          total: propias.length,
          finalizadas,
          avance: p.estado === 'Finalizado' ? 100 : propias.length ? Math.round((finalizadas / propias.length) * 100) : 0,
        }
      }),
    [planes, tareas],
  )

  const resultado = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    let lista = conAvance.filter((p) => {
      if (!dentroDelPeriodo(p.creada, periodo, rango)) return false
      if (q && ![p.nombre, p.responsable].some((campo) => campo.toLowerCase().includes(q))) return false
      return filtros.every(
        ({ id, value }) => !Array.isArray(value) || value.length === 0 || value.map(String).includes(String(p[id as keyof Plan])),
      )
    })
    if (orden) {
      const desc = orden.startsWith('-')
      const campo = (desc ? orden.slice(1) : orden) as keyof PlanConAvance
      lista = [...lista].sort((a, b) => {
        const va = a[campo]
        const vb = b[campo]
        const r = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'es')
        return desc ? -r : r
      })
    }
    return lista
  }, [conAvance, periodo, rango, busqueda, filtros, orden])

  const visibles = useMemo(() => resultado.slice((pagina - 1) * porPagina, pagina * porPagina), [resultado, pagina, porPagina])
  const plan = planes.find((p) => p.id === elegido)
  const tareasDelPlan = plan ? tareas.filter((t) => t.plan === plan.nombre) : []
  const cuenta = (estado: EstadoPlan) => resultado.filter((p) => p.estado === estado).length
  const etiquetaPeriodo = periodo === 'personalizado' ? 'el rango elegido' : (PERIODOS.find((p) => p.valor === periodo)?.etiqueta ?? '')
  const sinBusqueda = !busqueda.trim() && filtros.every((f) => !Array.isArray(f.value) || f.value.length === 0)

  const abrir = (p: Plan) => {
    setElegido(p.id)
    setEnPanel(true)
  }

  const actualizar = (ids: string[], cambiar: (p: Plan) => Partial<Plan>) => {
    const conjunto = new Set(ids)
    setPlanes((todos) => todos.map((p) => (conjunto.has(p.id) ? { ...p, ...cambiar(p) } : p)))
  }

  const acciones: AccionesPlan = {
    onCambiarFecha: (p, fecha) => {
      const iso = aFechaIso(fecha)
      actualizar([p.id], () => ({ fin: iso, estado: 'Activo' }))
      notify('Plan reabierto', `Ahora termina el ${fechaCorta(iso)}.`, 'success')
    },
    onRecordatorio: (p) => {
      const pendientes = tareas.filter((t) => t.plan === p.nombre && t.estado !== 'Finalizada')
      const personas = new Set(pendientes.map((t) => t.asignado)).size
      if (!personas) return notify('No hay tareas pendientes', undefined, 'info')
      setPorRecordar({ plan: p, personas, tareas: pendientes.length })
    },
    onCopiarEnlace: (p) => {
      copiarEnlace(`/admin/tareas?plan=${p.id}`)
      notify('Enlace copiado', 'Quien lo abra verá el detalle del plan.', 'success')
    },
    onEliminar: (p) => {
      setPorEliminar([p])
      setEliminando(true)
    },
    onVerTarea,
  }

  const pedirCambio = (tipo: CambioMasivo) => (filas: Plan[]) => {
    setValorCambio('')
    setCambio({ tipo, filas })
  }

  const aplicarCambio = () => {
    if (!cambio || !valorCambio) return
    const ids = cambio.filas.map((p) => p.id)
    const cuantos = `${ids.length} ${plural(ids.length, 'plan', 'planes')}`
    if (cambio.tipo === 'reasignar') {
      const area = PERSONAS.find((p) => p.nombre === valorCambio)?.area ?? ''
      actualizar(ids, () => ({ responsable: valorCambio, area }))
      notify(`Nuevo responsable en ${cuantos}`, `Ahora los lleva ${valorCambio}.`, 'success')
    }
    if (cambio.tipo === 'estado') {
      actualizar(ids, () => ({ estado: valorCambio as EstadoPlan }))
      notify(`${cuantos} en ${valorCambio}`, undefined, 'success')
    }
    if (cambio.tipo === 'fecha') {
      actualizar(ids, (p) => ({ fin: valorCambio, estado: p.estado === 'Vencido' ? 'Activo' : p.estado }))
      notify(`Nueva fecha de fin en ${cuantos}`, `Terminan el ${fechaCorta(valorCambio)}.`, 'success')
    }
    setCambio(null)
    onLimpiarSeleccion()
  }

  const limpiar = () => {
    setBusqueda('')
    setFiltros([])
    setPagina(1)
    setVersion((v) => v + 1)
  }

  const config: DataGridListConfig<PlanConAvance> = {
    columns: COLUMNAS,
    columnFilters: FILTROS,
    onColumnFiltersChange: (nuevos) => {
      setFiltros(nuevos)
      setPagina(1)
    },
    sort: { onSortChange: setOrden },
    search: {
      placeholder: 'Buscar plan o responsable…',
      onSearch: (q) => {
        setBusqueda(q)
        setPagina(1)
      },
    },
    selection: { onSelectionChange: () => undefined },
    actions: {
      bulk: [
        { id: 'reasignar', label: 'Reasignar', icon: icono(UserSwitchIcon), onClick: pedirCambio('reasignar') },
        { id: 'estado', label: 'Estado', icon: icono(TaskDone01Icon), onClick: pedirCambio('estado') },
        { id: 'fecha', label: 'Fecha', icon: icono(Calendar03Icon), onClick: pedirCambio('fecha') },
        {
          id: 'descargar',
          label: 'Descargar',
          icon: icono(Download01Icon),
          onClick: (filas) =>
            toast.promise(new Promise((listo) => setTimeout(listo, 1500)), {
              loading: `Preparando el archivo de ${filas.length} ${plural(filas.length, 'plan', 'planes')}…`,
              success: 'Archivo listo: también te lo enviamos al correo',
              error: 'No pudimos preparar el archivo',
            }),
        },
        {
          id: 'eliminar',
          label: 'Eliminar',
          variant: 'destructive',
          icon: icono(Delete02Icon),
          onClick: (filas) => {
            setPorEliminar(filas)
            setEliminando(true)
          },
        },
      ],
    },
    emptyState: sinBusqueda
      ? {
          // Vacíos con su ilustración glass (13-oct): nada en el período, o sin resultados con «Limpiar».
          type: 'empty',
          customComponent: (
            <PrimeraVez
              icono="glass-calendar"
              titulo="Nada en este período"
              descripcion={`No hay planes en ${etiquetaPeriodo}. Cambia el período para ver más.`}
              accion={{ texto: 'Cambiar período', onClick: () => setPeriodo('365') }}
            />
          ),
        }
      : {
          type: 'no-results',
          customComponent: (
            <SinResultados
              busqueda={busqueda}
              filtrosActivos={filtros.filter((f) => Array.isArray(f.value) && f.value.length > 0).length}
              onLimpiar={limpiar}
            />
          ),
        },
    frame: { title: 'Planes', toolbar: 'header' },
    layout: { reorderable: false, dense: true },
    labels: {
      resultCount: (_v, total) => `${total.toLocaleString('es-CO')} ${plural(total, 'plan', 'planes')}`,
    },
  }

  const textoCambio = cambio ? TEXTO_CAMBIO[cambio.tipo] : null
  const opcionesCambio =
    cambio?.tipo === 'reasignar' ? PERSONAS.map((p) => p.nombre) : cambio?.tipo === 'estado' ? ESTADOS_PLAN.filter((e) => e !== 'Vencido') : []

  return (
    <div className="flex flex-col gap-4">
      <SelectorPeriodo
        periodo={periodo}
        onPeriodo={(p) => {
          setPeriodo(p)
          setPagina(1)
        }}
        rango={rango}
        onRango={setRango}
      />

      <Indicadores
        cifras={[
          { etiqueta: 'Total', valor: formatoKM(resultado.length), detalle: 'Con el periodo y los filtros de ahora' },
          { etiqueta: 'Finalizados', valor: formatoKM(cuenta('Finalizado')), detalle: 'Todas sus tareas cerradas' },
          { etiqueta: 'Por hacer', valor: formatoKM(cuenta('Por hacer') + cuenta('Activo')), detalle: 'Por hacer y activos' },
          { etiqueta: 'Vencidos', valor: formatoKM(cuenta('Vencido')), detalle: 'Pasaron su fecha de fin' },
        ]}
      />

      <MaestroDetalle
        tituloDetalle="Detalle del plan"
        abiertoEnPanel={enPanel && Boolean(plan)}
        onCerrarPanel={() => setEnPanel(false)}
        lista={
          <FilaContexto.Provider value={{ elegido, abrir }}>
            <TablaDatos key={version} config={config} data={visibles} initialRowSelection={limpiarSeleccion} paginacion={{ pagina: pagina, setPagina: setPagina, porPagina: porPagina, setPorPagina: setPorPagina, total: resultado.length }} nombre="planes" id="planes-tareas" />
          </FilaContexto.Provider>
        }
        detalle={
          <DetallePlan
            plan={plan}
            tareas={tareasDelPlan}
            acciones={{
              ...acciones,
              onVerTarea: (t) => {
                setEnPanel(false)
                acciones.onVerTarea(t)
              },
            }}
          />
        }
      />

      <DialogoConfirmar
        abierto={cambio !== null}
        onAbiertoChange={(abierto) => (abierto ? undefined : setCambio(null))}
        icono={cambio?.tipo === 'fecha' ? Calendar03Icon : cambio?.tipo === 'reasignar' ? UserSwitchIcon : TaskDone01Icon}
        titulo={textoCambio?.titulo ?? ''}
        descripcion={
          cambio ? `El cambio aplica a ${cambio.filas.length} ${plural(cambio.filas.length, 'plan seleccionado', 'planes seleccionados')}.` : ''
        }
        accion={textoCambio?.accion ?? ''}
        deshabilitada={!valorCambio}
        onConfirmar={aplicarCambio}
      >
        {cambio?.tipo === 'fecha' ? (
          <Field>
            <FieldLabel htmlFor="fecha-cambio-plan">{textoCambio?.campo}</FieldLabel>
            <CampoFecha
              id="fecha-cambio-plan"
              valor={valorCambio ? new Date(`${valorCambio}T00:00:00`) : undefined}
              desde={HOY}
              onCambio={(fecha) => setValorCambio(fecha ? aFechaIso(fecha) : '')}
            />
          </Field>
        ) : cambio ? (
          <Field>
            <FieldLabel htmlFor="valor-cambio-plan">{textoCambio?.campo}</FieldLabel>
            <Select value={valorCambio || null} onValueChange={(v) => setValorCambio(String(v ?? ''))}>
              <SelectTrigger id="valor-cambio-plan" className="w-full">
                <SelectValue placeholder="Elige una opción" />
              </SelectTrigger>
              <SelectContent>
                {opcionesCambio.map((opcion) => (
                  <SelectItem key={opcion} value={opcion}>
                    {opcion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        ) : null}
      </DialogoConfirmar>

      <DialogoConfirmar
        abierto={porRecordar !== null}
        onAbiertoChange={(abierto) => (abierto ? undefined : setPorRecordar(null))}
        icono={Notification01Icon}
        titulo="¿Enviar el recordatorio?"
        descripcion="Les llega por correo y en la plataforma a quienes tienen tareas abiertas en el plan, y no se puede deshacer."
        cancelar="Todavía no"
        accion={porRecordar ? `Enviar a ${porRecordar.personas} ${plural(porRecordar.personas, 'persona', 'personas')}` : 'Enviar'}
        onConfirmar={() => {
          if (porRecordar) {
            const { plan: p, personas } = porRecordar
            notify(
              `Recordatorio enviado a ${personas} ${plural(personas, 'persona', 'personas')}`,
              `Quienes tienen tareas abiertas en «${p.nombre}» reciben el aviso.`,
              'success',
            )
          }
          setPorRecordar(null)
        }}
      >
        {porRecordar ? (
          <RegistroConfirmar
            nombre={porRecordar.plan.nombre}
            detalle={`${porRecordar.tareas} ${plural(porRecordar.tareas, 'tarea abierta', 'tareas abiertas')} · ${porRecordar.personas} ${plural(porRecordar.personas, 'persona', 'personas')}`}
            estado={porRecordar.plan.estado}
            tono="neutro"
            icono={Notification01Icon}
          />
        ) : null}
      </DialogoConfirmar>

      <ConfirmarEliminar
        abierto={eliminando}
        onAbiertoChange={setEliminando}
        cantidad={porEliminar.length}
        sustantivo={['plan', 'planes']}
        descripcion={
          porEliminar.length === 1
            ? `Vas a eliminar «${porEliminar[0].nombre}». Sus tareas dejan de verse en el plan y no se puede recuperar.`
            : `Vas a eliminar ${porEliminar.length} planes de toda la empresa. Sus tareas dejan de verse en ellos y no se pueden recuperar.`
        }
        onConfirmar={() => {
          const ids = new Set(porEliminar.map((p) => p.id))
          setPlanes((todos) => todos.filter((p) => !ids.has(p.id)))
          if (elegido && ids.has(elegido)) {
            setElegido(resultado.find((p) => !ids.has(p.id))?.id)
            setEnPanel(false)
          }
          notify(`${porEliminar.length} ${plural(porEliminar.length, 'plan eliminado', 'planes eliminados')}`, undefined, 'success')
          setEliminando(false)
          onLimpiarSeleccion()
        }}
      />
    </div>
  )
}
