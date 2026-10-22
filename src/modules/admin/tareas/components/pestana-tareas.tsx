import { createContext, useContext, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Calendar03Icon,
  Delete02Icon,
  Download01Icon,
  Flag02Icon,
  Notification01Icon,
  TaskDone01Icon,
  UserSwitchIcon,
} from '@hugeicons/core-free-icons'
import {
  Button,
  Field,
  FieldLabel,
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
import { fechaCorta, formatoKM, HOY, plural } from '@/modules/design-system/patrones/formato'
import { CampoFecha } from '@/modules/design-system/formularios/rango-de-fechas'
import { notify } from '@/shared/components/notify'
import {
  BADGE_PRIORIDAD,
  BADGE_TAREA,
  ESTADOS_TAREA,
  PERIODOS,
  PERSONAS,
  PRIORIDADES,
  aFechaIso,
  dentroDelPeriodo,
  textoVencimiento,
  type EstadoTarea,
  type Evento,
  type Prioridad,
  type Rango,
  type Tarea,
} from './datos'
import { DetalleTarea, type AccionesTarea } from './detalle-tarea'
import { Indicadores, MaestroDetalle, SelectorPeriodo } from './piezas'
import { copiarEnlace } from './utilidades'

type Filtro = { id: string; value: unknown }
type CambioMasivo = 'reasignar' | 'prioridad' | 'estado' | 'fecha'

// ── La fila elegida y el «abrir» llegan por contexto: las columnas quedan fuera del componente ──

const FilaContexto = createContext<{ elegida?: string; abrir: (tarea: Tarea) => void }>({ abrir: () => undefined })

function CeldaTarea({ tarea }: { tarea: Tarea }) {
  const { elegida, abrir } = useContext(FilaContexto)
  const abierta = elegida === tarea.id
  return (
    <div className="flex min-w-0 flex-col items-start gap-1">
      <Button variant="link" size="sm" className="h-auto max-w-full p-0" aria-current={abierta} onClick={() => abrir(tarea)}>
        <span className="truncate">{tarea.titulo}</span>
      </Button>
      <div className="flex min-w-0 max-w-full items-center gap-1.5">
        {abierta ? (
          <Badge variant="primary-light" size="xs">
            En detalle
          </Badge>
        ) : null}
        <Text as="span" variant="muted" size="xs" className="truncate">
          {tarea.plan}
        </Text>
      </div>
    </div>
  )
}

const COLUMNAS: DataGridListConfig<Tarea>['columns'] = [
  {
    accessorKey: 'titulo',
    header: 'Tarea',
    size: 230,
    ...SIN_ARRASTRE,
    cell: ({ row }) => <CeldaTarea tarea={row.original} />,
  },
  {
    accessorKey: 'asignado',
    header: 'Asignado',
    size: 170,
    ...SIN_ARRASTRE,
    cell: ({ row }) => <Persona nombre={row.original.asignado} detalle={row.original.area} />,
  },
  {
    accessorKey: 'prioridad',
    header: 'Prioridad',
    size: 96,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <Badge variant={BADGE_PRIORIDAD[row.original.prioridad]} size="sm">
        {row.original.prioridad}
      </Badge>
    ),
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    size: 104,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <Badge variant={BADGE_TAREA[row.original.estado]} size="sm">
        {row.original.estado}
      </Badge>
    ),
  },
  {
    accessorKey: 'finaliza',
    header: 'Finaliza el',
    size: 116,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        <Text as="span" size="sm">
          {fechaCorta(row.original.finaliza)}
        </Text>
        <Text as="span" variant={row.original.estado === 'Vencida' ? 'destructive' : 'muted'} size="xs">
          {textoVencimiento(row.original.estado, row.original.finaliza)}
        </Text>
      </div>
    ),
  },
]

const FILTROS: DataGridListConfig<Tarea>['columnFilters'] = [
  { id: 'estado', label: 'Estado', type: 'select', multiple: true, options: ESTADOS_TAREA.map((e) => ({ label: e, value: e })) },
  { id: 'prioridad', label: 'Prioridad', type: 'select', multiple: true, options: PRIORIDADES.map((p) => ({ label: p, value: p })) },
]

function resolver(tareas: Tarea[], periodo: string, rango: Rango, busqueda: string, filtros: Filtro[], orden?: string) {
  const q = busqueda.trim().toLowerCase()
  let resultado = tareas.filter((t) => {
    if (!dentroDelPeriodo(t.creada, periodo, rango)) return false
    if (q && ![t.titulo, t.plan, t.asignado].some((campo) => campo.toLowerCase().includes(q))) return false
    return filtros.every(
      ({ id, value }) => !Array.isArray(value) || value.length === 0 || value.map(String).includes(String(t[id as keyof Tarea])),
    )
  })
  if (orden) {
    const desc = orden.startsWith('-')
    const campo = (desc ? orden.slice(1) : orden) as keyof Tarea
    resultado = [...resultado].sort((a, b) => {
      const r = String(a[campo]).localeCompare(String(b[campo]), 'es')
      return desc ? -r : r
    })
  }
  return resultado
}

const icono = (i: IconSvgElement) => <HugeiconsIcon icon={i} aria-hidden="true" />

let consecutivo = 0
const evento = (tipo: Evento['tipo'], texto: string, autor = 'Tú'): Evento => ({
  id: `n${++consecutivo}`,
  tipo,
  autor,
  texto,
  cuando: new Date().toISOString(),
})

const TEXTO_CAMBIO: Record<CambioMasivo, { titulo: string; campo: string; accion: string }> = {
  reasignar: { titulo: 'Reasignar tareas', campo: 'Nueva persona asignada', accion: 'Reasignar' },
  prioridad: { titulo: 'Cambiar prioridad', campo: 'Nueva prioridad', accion: 'Cambiar prioridad' },
  estado: { titulo: 'Cambiar estado', campo: 'Nuevo estado', accion: 'Cambiar estado' },
  fecha: { titulo: 'Cambiar fecha de finalización', campo: 'Nueva fecha', accion: 'Cambiar fecha' },
}

export function PestanaTareas({
  tareas,
  setTareas,
  elegida,
  setElegida,
  enPanel,
  setEnPanel,
  limpiarSeleccion,
  onLimpiarSeleccion,
}: {
  tareas: Tarea[]
  setTareas: Dispatch<SetStateAction<Tarea[]>>
  elegida: string | undefined
  setElegida: (id: string | undefined) => void
  enPanel: boolean
  setEnPanel: (abierto: boolean) => void
  limpiarSeleccion: Record<string, boolean>
  onLimpiarSeleccion: () => void
}) {
  const [periodo, setPeriodo] = useState('7')
  const [rango, setRango] = useState<Rango>(undefined)
  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState<Filtro[]>([])
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(50)
  // Limpiar la búsqueda vuelve a montar la tabla: su buscador no se puede vaciar desde afuera.
  const [version, setVersion] = useState(0)
  const [porEliminar, setPorEliminar] = useState<Tarea[]>([])
  const [eliminando, setEliminando] = useState(false)
  const [cambio, setCambio] = useState<{ tipo: CambioMasivo; filas: Tarea[] } | null>(null)
  const [valorCambio, setValorCambio] = useState('')
  // El recordatorio le llega a otra persona: se pregunta antes de enviarlo.
  const [porRecordar, setPorRecordar] = useState<Tarea | null>(null)

  const resultado = useMemo(() => resolver(tareas, periodo, rango, busqueda, filtros, orden), [tareas, periodo, rango, busqueda, filtros, orden])
  const visibles = useMemo(() => resultado.slice((pagina - 1) * porPagina, pagina * porPagina), [resultado, pagina, porPagina])
  const tarea = tareas.find((t) => t.id === elegida)
  const cuenta = (estado: EstadoTarea) => resultado.filter((t) => t.estado === estado).length
  const etiquetaPeriodo = periodo === 'personalizado' ? 'el rango elegido' : (PERIODOS.find((p) => p.valor === periodo)?.etiqueta ?? '')
  const sinBusqueda = !busqueda.trim() && filtros.every((f) => !Array.isArray(f.value) || f.value.length === 0)

  const abrir = (t: Tarea) => {
    setElegida(t.id)
    setEnPanel(true)
  }

  // ── Cambios sobre una o varias tareas ──

  const actualizar = (ids: string[], cambiar: (t: Tarea) => Partial<Tarea>, registro: (t: Tarea) => string) => {
    const conjunto = new Set(ids)
    setTareas((todas) =>
      todas.map((t) => (conjunto.has(t.id) ? { ...t, ...cambiar(t), historial: [...t.historial, evento('cambio', registro(t))] } : t)),
    )
  }

  const acciones: AccionesTarea = {
    onFinalizar: (t) => {
      actualizar([t.id], () => ({ estado: 'Finalizada' }), (x) => `cambió el estado de ${x.estado} a Finalizada`)
      notify('Tarea finalizada', t.titulo, 'success')
    },
    onReabrir: (t) => {
      actualizar([t.id], () => ({ estado: 'Activo' }), () => 'reabrió la tarea: cambió el estado de Finalizada a Activo')
      notify('Tarea reabierta', t.titulo, 'success')
    },
    onCambiarFecha: (t, fecha) => {
      const iso = aFechaIso(fecha)
      actualizar([t.id], () => ({ finaliza: iso, estado: 'Activo' }), () => `cambió la fecha de finalización al ${fechaCorta(iso)} y reabrió la tarea`)
      notify('Tarea reabierta', `Ahora finaliza el ${fechaCorta(iso)}.`, 'success')
    },
    onSubtarea: (t, subId, hecha) => {
      const sub = t.subtareas.find((s) => s.id === subId)
      setTareas((todas) =>
        todas.map((x) =>
          x.id === t.id
            ? {
                ...x,
                estado: x.estado === 'Por hacer' && hecha ? 'Activo' : x.estado,
                subtareas: x.subtareas.map((s) => (s.id === subId ? { ...s, hecha } : s)),
                historial: [...x.historial, evento('cambio', `${hecha ? 'completó' : 'reabrió'} la subtarea «${sub?.titulo}»`)],
              }
            : x,
        ),
      )
    },
    onComentar: (t, texto) => {
      setTareas((todas) => todas.map((x) => (x.id === t.id ? { ...x, historial: [...x.historial, evento('comentario', texto)] } : x)))
    },
    onRecordatorio: (t) => setPorRecordar(t),
    onCopiarEnlace: (t) => {
      copiarEnlace(`/admin/tareas?tarea=${t.id}`)
      notify('Enlace copiado', 'Quien lo abra verá el detalle de la tarea.', 'success')
    },
    onEliminar: (t) => {
      setPorEliminar([t])
      setEliminando(true)
    },
  }

  const pedirCambio = (tipo: CambioMasivo) => (filas: Tarea[]) => {
    setValorCambio('')
    setCambio({ tipo, filas })
  }

  const aplicarCambio = () => {
    if (!cambio || !valorCambio) return
    const ids = cambio.filas.map((t) => t.id)
    const n = ids.length
    const cuantas = `${n} ${plural(n, 'tarea', 'tareas')}`
    if (cambio.tipo === 'reasignar') {
      const area = PERSONAS.find((p) => p.nombre === valorCambio)?.area ?? ''
      actualizar(ids, () => ({ asignado: valorCambio, area }), () => `reasignó la tarea a ${valorCambio}`)
      notify(`${cuantas} ${plural(n, 'reasignada', 'reasignadas')}`, `Ahora las tiene ${valorCambio}.`, 'success')
    }
    if (cambio.tipo === 'prioridad') {
      actualizar(ids, () => ({ prioridad: valorCambio as Prioridad }), (t) => `cambió la prioridad de ${t.prioridad} a ${valorCambio}`)
      notify(`Prioridad ${valorCambio.toLowerCase()} en ${cuantas}`, undefined, 'success')
    }
    if (cambio.tipo === 'estado') {
      // Las de Aprendizaje no se finalizan a mano (RN-04 del detalle).
      const validas = cambio.filas.filter((t) => !(valorCambio === 'Finalizada' && t.tipo === 'Aprendizaje')).map((t) => t.id)
      actualizar(validas, () => ({ estado: valorCambio as EstadoTarea }), (t) => `cambió el estado de ${t.estado} a ${valorCambio}`)
      const omitidas = n - validas.length
      notify(
        `${validas.length} ${plural(validas.length, 'tarea', 'tareas')} en ${valorCambio}`,
        omitidas
          ? `${omitidas} de aprendizaje no ${plural(omitidas, 'cambió', 'cambiaron')}: se finalizan al completar el contenido.`
          : undefined,
        'success',
      )
    }
    if (cambio.tipo === 'fecha') {
      actualizar(
        ids,
        (t) => ({ finaliza: valorCambio, estado: t.estado === 'Vencida' ? 'Activo' : t.estado }),
        () => `cambió la fecha de finalización al ${fechaCorta(valorCambio)}`,
      )
      notify(`Nueva fecha en ${cuantas}`, `Finalizan el ${fechaCorta(valorCambio)}.`, 'success')
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

  const config: DataGridListConfig<Tarea> = {
    columns: COLUMNAS,
    columnFilters: FILTROS,
    onColumnFiltersChange: (nuevos) => {
      setFiltros(nuevos)
      setPagina(1)
    },
    sort: { onSortChange: setOrden },
    search: {
      placeholder: 'Buscar tarea, plan o persona…',
      onSearch: (q) => {
        setBusqueda(q)
        setPagina(1)
      },
    },
    selection: { onSelectionChange: () => undefined },
    actions: {
      bulk: [
        { id: 'reasignar', label: 'Reasignar', icon: icono(UserSwitchIcon), onClick: pedirCambio('reasignar') },
        { id: 'prioridad', label: 'Prioridad', icon: icono(Flag02Icon), onClick: pedirCambio('prioridad') },
        { id: 'estado', label: 'Estado', icon: icono(TaskDone01Icon), onClick: pedirCambio('estado') },
        { id: 'fecha', label: 'Fecha', icon: icono(Calendar03Icon), onClick: pedirCambio('fecha') },
        {
          id: 'descargar',
          label: 'Descargar',
          icon: icono(Download01Icon),
          onClick: (filas) =>
            toast.promise(new Promise((listo) => setTimeout(listo, 1500)), {
              loading: `Preparando el archivo de ${filas.length} ${plural(filas.length, 'tarea', 'tareas')}…`,
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
              descripcion={`No hay tareas en ${etiquetaPeriodo}. Cambia el período para ver más.`}
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
    frame: { title: 'Tareas', toolbar: 'header' },
    layout: { reorderable: false, dense: true },
    labels: {
      resultCount: (_v, total) => `${total.toLocaleString('es-CO')} ${plural(total, 'tarea', 'tareas')}`,
    },
  }

  const textoCambio = cambio ? TEXTO_CAMBIO[cambio.tipo] : null
  const opcionesCambio =
    cambio?.tipo === 'reasignar'
      ? PERSONAS.map((p) => p.nombre)
      : cambio?.tipo === 'prioridad'
        ? PRIORIDADES
        : cambio?.tipo === 'estado'
          ? ESTADOS_TAREA.filter((e) => e !== 'Vencida')
          : []

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
          { etiqueta: 'Finalizadas', valor: formatoKM(cuenta('Finalizada')), detalle: 'Cerradas en el periodo' },
          { etiqueta: 'Por hacer', valor: formatoKM(cuenta('Por hacer') + cuenta('Activo')), detalle: 'Por hacer y activas' },
          { etiqueta: 'Vencidas', valor: formatoKM(cuenta('Vencida')), detalle: 'Pasaron su fecha de finalización' },
        ]}
      />

      <MaestroDetalle
        tituloDetalle="Detalle de la tarea"
        abiertoEnPanel={enPanel && Boolean(tarea)}
        onCerrarPanel={() => setEnPanel(false)}
        lista={
          <FilaContexto.Provider value={{ elegida, abrir }}>
            <TablaDatos key={version} config={config} data={visibles} initialRowSelection={limpiarSeleccion} paginacion={{ pagina: pagina, setPagina: setPagina, porPagina: porPagina, setPorPagina: setPorPagina, total: resultado.length }} nombre="tareas" id="tareas" />
          </FilaContexto.Provider>
        }
        detalle={<DetalleTarea key={tarea?.id ?? 'ninguna'} tarea={tarea} acciones={acciones} />}
      />

      <DialogoConfirmar
        abierto={cambio !== null}
        onAbiertoChange={(abierto) => (abierto ? undefined : setCambio(null))}
        icono={cambio?.tipo === 'fecha' ? Calendar03Icon : cambio?.tipo === 'reasignar' ? UserSwitchIcon : cambio?.tipo === 'prioridad' ? Flag02Icon : TaskDone01Icon}
        titulo={textoCambio?.titulo ?? ''}
        descripcion={
          cambio
            ? `El cambio aplica a ${cambio.filas.length} ${plural(cambio.filas.length, 'tarea seleccionada', 'tareas seleccionadas')} y queda en su historial.`
            : ''
        }
        accion={textoCambio?.accion ?? ''}
        deshabilitada={!valorCambio}
        onConfirmar={aplicarCambio}
      >
        {cambio?.tipo === 'fecha' ? (
          <Field>
            <FieldLabel htmlFor="fecha-cambio">{textoCambio?.campo}</FieldLabel>
            <CampoFecha
              id="fecha-cambio"
              valor={valorCambio ? new Date(`${valorCambio}T00:00:00`) : undefined}
              desde={HOY}
              onCambio={(fecha) => setValorCambio(fecha ? aFechaIso(fecha) : '')}
            />
          </Field>
        ) : cambio ? (
          <Field>
            <FieldLabel htmlFor="valor-cambio">{textoCambio?.campo}</FieldLabel>
            <Select value={valorCambio || null} onValueChange={(v) => setValorCambio(String(v ?? ''))}>
              <SelectTrigger id="valor-cambio" className="w-full">
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
        descripcion="Le llega por correo y en la plataforma, y no se puede deshacer."
        cancelar="Todavía no"
        accion="Enviar a 1 persona"
        onConfirmar={() => {
          if (porRecordar) {
            notify(`Recordatorio enviado a ${porRecordar.asignado}`, `Le avisamos por correo y en la plataforma sobre «${porRecordar.titulo}».`, 'success')
          }
          setPorRecordar(null)
        }}
      >
        {porRecordar ? (
          <RegistroConfirmar nombre={porRecordar.titulo} detalle={`Asignada a ${porRecordar.asignado}`} estado={porRecordar.estado} tono="neutro" icono={Notification01Icon} />
        ) : null}
      </DialogoConfirmar>

      <ConfirmarEliminar
        abierto={eliminando}
        onAbiertoChange={setEliminando}
        cantidad={porEliminar.length}
        sustantivo={['tarea', 'tareas']}
        descripcion={
          porEliminar.length === 1
            ? `Vas a eliminar «${porEliminar[0].titulo}». ${porEliminar[0].asignado} deja de verla y no se puede recuperar.`
            : undefined
        }
        onConfirmar={() => {
          const ids = new Set(porEliminar.map((t) => t.id))
          setTareas((todas) => todas.filter((t) => !ids.has(t.id)))
          if (elegida && ids.has(elegida)) {
            setElegida(resultado.find((t) => !ids.has(t.id))?.id)
            setEnPanel(false)
          }
          notify(`${porEliminar.length} ${plural(porEliminar.length, 'tarea eliminada', 'tareas eliminadas')}`, undefined, 'success')
          setEliminando(false)
          onLimpiarSeleccion()
        }}
      />
    </div>
  )
}
