import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { MoreHorizontalIcon,
  Add01Icon,
  Calendar03Icon,
  Delete02Icon,
  PlayIcon,
} from '@hugeicons/core-free-icons'
import {
  Button,
  Frame,
  FramePanel,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Heading,
  Progress,
  Text,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { CalendarioFecha } from '@/modules/admin/tareas/components/piezas'
import { ActionDialog } from '@/shared/components/ActionDialog'
import type { DataGridListConfig } from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { SIN_ARRASTRE } from '@/modules/design-system/data-grid/casos/sin-arrastre'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { DialogoConfirmar, RegistroConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { plural } from '@/modules/design-system/patrones/formato'
import { TextoCompleto } from '@/shared/components/TextoCompleto'
import { MetricasDestacadas, type Metrica } from '@/shared/components/MetricasDestacadas'
import { PrimeraVez, demoVacia } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import { notify } from '@/shared/components/notify'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import {
  BADGE,
  ESTADOS,
  TIPOS,
  fechaCorta,
  hoyIso,
  porcentaje,
  type Assessment,
  type Estado,
  type Tipo,
} from './components/datos'
import { cambiarAssessments, useAssessments } from './components/sesion'

// Cantidades de la UI: miles con punto; desde 10.000, en K; desde un millón, en M.
function formatoCantidad(n: number): string {
  if (n >= 1_000_000) return (Math.round((n / 1_000_000) * 10) / 10).toLocaleString('es-CO') + ' M'
  if (n >= 10_000) return (Math.round((n / 1_000) * 10) / 10).toLocaleString('es-CO') + ' K'
  return n.toLocaleString('es-CO')
}

// Cuántas pruebas se ven por página, igual que en el producto.
const INICIAL = 10


// Las columnas que se pueden mostrar u ocultar desde el botón de configuración.
// La tabla es `TablaDatos`, la del `DataGridList` de la librería: la única del sistema desde el 5-oct (MarcoTabla se
// retiró). Aquí se pasó el 2-oct (Dave).
const COLUMNAS: DataGridListConfig<Assessment>['columns'] = [
  {
    accessorKey: 'nombre',
    header: 'Assessment',
    // 13-oct (I-070): las columnas suman 1.086 px y caben en los 1.104 del marco; el nombre se corta con «…» y se lee
    // entero en el globo.
    size: 300,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <TextoCompleto texto={row.original.nombre}>
        <Text as="span" size="sm" weight="medium" tabIndex={0} className="block truncate">
          {row.original.nombre}
        </Text>
      </TextoCompleto>
    ),
  },
  {
    accessorKey: 'tipo',
    header: 'Tipo',
    size: 130,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <Text as="span" size="sm" className="block truncate">
        {row.original.tipo}
      </Text>
    ),
  },
  {
    accessorKey: 'inicio',
    header: 'Inicio',
    size: 120,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <Text as="span" size="sm" className="block tabular-nums">
        {fechaCorta(row.original.inicio)}
      </Text>
    ),
  },
  {
    accessorKey: 'fin',
    header: 'Fin',
    size: 120,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <Text as="span" size="sm" className="block tabular-nums">
        {fechaCorta(row.original.fin)}
      </Text>
    ),
  },
  {
    accessorKey: 'participacion',
    header: 'Participación',
    size: 170,
    ...SIN_ARRASTRE,
    // Cuánta gente respondió, sobre la convocada.
    cell: ({ row }) => (
      <div className="flex items-center gap-2.5">
        <Progress value={porcentaje(row.original)} aria-label={`Participación en ${row.original.nombre}`} className="w-16 **:data-[slot=progress-track]:h-1.5" />
        <span className="text-sm text-muted-foreground tabular-nums">
          {row.original.respondieron}/{row.original.convocados}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    size: 150,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <Badge variant={BADGE[row.original.estado]} className="font-normal">
        {row.original.estado}
      </Badge>
    ),
  },
]

// Ordena por la columna elegida; «-campo» es descendente. Los textos comparan en español.
function ordenarPor(lista: Assessment[], orden: string | undefined) {
  if (!orden) return lista
  const desc = orden.startsWith('-')
  const campo = desc ? orden.slice(1) : orden
  const valor = (a: Assessment) =>
    campo === 'participacion' ? porcentaje(a) : (a[campo as keyof Assessment] as string | number)
  return [...lista].sort((a, b) => {
    const x = valor(a)
    const y = valor(b)
    const cmp = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'es')
    return desc ? -cmp : cmp
  })
}

const sinTildes = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// El menú de cada prueba. Una programada puede adelantarse para que abra hoy, y una inactiva (creada sin fechas) se
// activa desde aquí; el resto del tiempo el estado lo manda el calendario, no el menú.
// 13-oct (I-006, I-007): «Ver detalle» se quitó mientras no exista esa pantalla; «Editar fechas» abre su ventana con el
// calendario y «Eliminar» pregunta y quita la fila.
function Acciones({
  assessment,
  onActivar,
  onEditarFechas,
  onEliminar,
}: {
  assessment: Assessment
  onActivar: (a: Assessment) => void
  onEditarFechas: (a: Assessment) => void
  onEliminar: (a: Assessment) => void
}) {
  const puedeActivarse = assessment.estado === 'Planeado' || assessment.estado === 'Inactivo'
  // Las fechas se mueven mientras la prueba no cierre; una cerrada ya no cambia.
  const puedeEditarFechas = assessment.estado === 'Planeado' || assessment.estado === 'Vigente'

  return (
    <div onClick={(event) => event.stopPropagation()}>
      <DropdownMenu>
        {/* Botón terciario de solo icono con los tres puntos: el mismo de todas las listas del admin. */}
        <DropdownMenuTrigger render={<BotonIcono aria-label={`Acciones de ${assessment.nombre}`} />}>
          <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuGroup>
            {puedeActivarse ? (
              <DropdownMenuItem onClick={() => onActivar(assessment)}>
                <HugeiconsIcon icon={PlayIcon} size={16} />
                Activar
              </DropdownMenuItem>
            ) : null}
            {puedeEditarFechas ? (
              <DropdownMenuItem onClick={() => onEditarFechas(assessment)}>
                <HugeiconsIcon icon={Calendar03Icon} size={16} />
                Editar fechas
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuGroup>
          {puedeActivarse || puedeEditarFechas ? <DropdownMenuSeparator /> : null}
          <DropdownMenuItem variant="destructive" onClick={() => onEliminar(assessment)}>
            <HugeiconsIcon icon={Delete02Icon} size={16} />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// Diagnóstico › Assessments: las pruebas con que se mide cuánto aprendieron los colaboradores de un plan.
// Cada plan tiene una inicial (antes de empezar) y una de seguimiento (al terminar).
export function Component() {
  const navigate = useNavigate()
  // La lista es la de la sesión: activar una prueba le mueve las fechas y lo creado en «Crear assessment» sale de primero.
  const todos = useAssessments()
  // Empresa que estrena el módulo: `?demo=vacio` enseña el estado de primera vez.
  const [consulta] = useSearchParams()
  const sinNada = demoVacia(consulta)
  const assessments = sinNada ? [] : todos
  const setAssessments = cambiarAssessments
  const [porActivar, setPorActivar] = useState<Assessment | null>(null)
  const [nuevoFin, setNuevoFin] = useState<Date | undefined>(undefined)
  const [porEditar, setPorEditar] = useState<Assessment | null>(null)
  const [finEditado, setFinEditado] = useState<Date | undefined>(undefined)
  const [porEliminar, setPorEliminar] = useState<Assessment | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [tipo, setTipo] = useState<Tipo | ''>('')
  const [estado, setEstado] = useState<Estado | ''>('')
  const [porPagina, setPorPagina] = useState(INICIAL)
  const [pagina, setPagina] = useState(1)
  const [orden, setOrden] = useState<string | undefined>()

  const filtrados = useMemo(() => {
    const q = sinTildes(busqueda.trim())
    return assessments.filter((a) => {
      if (tipo && a.tipo !== tipo) return false
      if (estado && a.estado !== estado) return false
      return !q || sinTildes(a.nombre).includes(q)
    })
  }, [assessments, busqueda, tipo, estado])
  // Las métricas miran solo los assessments **vigentes**: lo que todavía se puede mover. Los no vigentes
  // ya no cambian y los que no han abierto no tienen respuestas, así que en un promedio solo lo diluirían.
  const metricas: Metrica[] = useMemo(() => {
    const vigentes = assessments.filter((a) => a.estado === 'Vigente' && a.convocados > 0)
    const convocados = vigentes.reduce((suma, a) => suma + a.convocados, 0)
    const respondieron = vigentes.reduce((suma, a) => suma + a.respondieron, 0)
    // Personas, no respuestas: quien responde dos pruebas vigentes cuenta una vez.
    const evaluados = new Set(vigentes.flatMap((a) => a.respondieronIds)).size
    const pruebas = `${vigentes.length.toLocaleString('es-CO')} ${vigentes.length === 1 ? 'assessment vigente' : 'assessments vigentes'}`
    const planeados = assessments.filter((a) => a.estado === 'Planeado').length
    const participacion = convocados ? Math.round((respondieron / convocados) * 100) : 0

    return [
      {
        id: 'participacion',
        titulo: 'Participación',
        // Respuestas sobre convocados de todo lo vigente junto: así una prueba de tres personas no pesa lo mismo que una de cien.
        valor: `${participacion} %`,
        ayuda: 'De la gente convocada a los assessments vigentes, cuánta ya respondió. Con poca respuesta, los resultados no representan al equipo: todavía hay tiempo de recordarles.',
        detalle: `${formatoCantidad(respondieron)} de ${formatoCantidad(convocados)} respuestas · ${pruebas}`,
        // El anillo de avance, el mismo de «Finalización media» en Contenidos: la cifra ya es un porcentaje, así que
        // se lee mejor contra su techo —el círculo entero es el 100 %— que en una línea.
        avance: participacion,
      },
      {
        id: 'vigentes',
        titulo: 'Assessments vigentes',
        valor: formatoCantidad(vigentes.length),
        ayuda: 'Assessments abiertos ahora mismo: su rango de fechas incluye hoy y la gente ya los puede responder.',
        detalle: planeados ? `${formatoCantidad(planeados)} ${planeados === 1 ? 'planeado' : 'planeados'} por abrir` : 'ninguno planeado por abrir',
      },
      {
        id: 'evaluados',
        titulo: 'Colaboradores evaluados',
        valor: formatoCantidad(evaluados),
        ayuda: 'Personas distintas que ya respondieron al menos un assessment vigente. Quien responde varios cuenta una sola vez.',
        detalle: `en ${pruebas}`,
      },
    ]
  }, [assessments])

  const paginas = Math.max(1, Math.ceil(filtrados.length / porPagina))
  const actual = Math.min(pagina, paginas)
  const ordenados = useMemo(() => ordenarPor(filtrados, orden), [filtrados, orden])
  const enPagina = ordenados.slice((actual - 1) * porPagina, actual * porPagina)

  const cerrarActivar = () => {
    setPorActivar(null)
    setNuevoFin(undefined)
  }

  // Al confirmar, la prueba pasa a abrirse hoy y corre hasta la fecha elegida.
  const confirmarActivar = () => {
    if (!porActivar || !nuevoFin) return
    const fin = nuevoFin.toISOString().slice(0, 10)
    setAssessments((lista) =>
      lista.map((a) =>
        a.id === porActivar.id ? { ...a, estado: 'Vigente' as Estado, inicio: hoyIso(), fin } : a,
      ),
    )
    notify(`${porActivar.nombre} · ${porActivar.tipo} quedó vigente hasta el ${fechaCorta(fin)}`, undefined, 'success')
    cerrarActivar()
  }

  const cerrarEditar = () => {
    setPorEditar(null)
    setFinEditado(undefined)
  }

  // Editar fechas mueve el cierre; el inicio queda como estaba. Antes de que abra, el cierre no puede quedar antes del inicio.
  const finIso = finEditado ? finEditado.toISOString().slice(0, 10) : null
  const finAntesDelInicio = Boolean(finIso && porEditar?.inicio && finIso < porEditar.inicio)

  const confirmarEditar = () => {
    if (!porEditar || !finIso || finAntesDelInicio) return
    setAssessments((lista) => lista.map((a) => (a.id === porEditar.id ? { ...a, fin: finIso } : a)))
    notify('Fechas actualizadas', `${porEditar.nombre} · ${porEditar.tipo} cierra el ${fechaCorta(finIso)}.`, 'success')
    cerrarEditar()
  }

  // Eliminar quita la prueba de la lista, y con ella lo que las personas ya respondieron.
  const confirmarEliminar = () => {
    if (!porEliminar) return
    const quitada = porEliminar
    setAssessments((lista) => lista.filter((a) => a.id !== quitada.id))
    setPorEliminar(null)
    notify('Assessment eliminado', `${quitada.nombre} · ${quitada.tipo} ya no está en la lista.`, 'success')
  }

  const limpiar = () => {
    setBusqueda('')
    setTipo('')
    setEstado('')
    setPagina(1)
  }

  return (
    <PageShell width="default">
      <PageHeader
        title="Diagnóstico"
        description="Mide el nivel de tus colaboradores antes y después de cada plan de formación."
        actions={
          // 13-oct (I-008): el botón «Métricas» se quitó; las del assessment no están maquetadas y no hay a dónde llevarlo.
          <Button onClick={() => navigate('/admin/aprendizaje/diagnostico/crear')}>
            <HugeiconsIcon icon={Add01Icon} size={16} />
            Crear assessment
          </Button>
        }
      />

      <PageContent>
        {sinNada ? null : <MetricasDestacadas metricas={metricas} etiqueta="Resumen de diagnósticos" />}
        {sinNada ? (
          <Frame>
            <FramePanel>
            <PrimeraVez
              icono="glass-add"
              titulo="Todavía no hay assessments"
              descripcion="Cuando crees el primero aparecerá aquí, con sus fechas y cuántas personas ya respondieron."
              accion={{ texto: 'Crear assessment', icono: Add01Icon, onClick: () => navigate('/admin/aprendizaje/diagnostico/crear') }}
            />
            </FramePanel>
          </Frame>
        ) : (
        <TablaDatos
          id="assessments"
          nombre="assessments"
          singular="assessment"
          data={enPagina}
          paginacion={{ pagina: actual, setPagina, porPagina, setPorPagina, total: filtrados.length }}
          config={{
            columns: [
              ...COLUMNAS,
              {
                id: 'acciones',
                header: 'Acciones',
                size: 96,
                enableResizing: false,
                ...SIN_ARRASTRE,
                cell: ({ row }) => (
                  <Acciones
                    assessment={row.original}
                    onActivar={(sel) => {
                      setPorActivar(sel)
                      setNuevoFin(sel.fin ? new Date(`${sel.fin}T00:00:00`) : undefined)
                    }}
                    onEditarFechas={(sel) => {
                      setPorEditar(sel)
                      setFinEditado(sel.fin ? new Date(`${sel.fin}T00:00:00`) : undefined)
                    }}
                    onEliminar={setPorEliminar}
                  />
                ),
              },
            ],
            columnFilters: [
              { id: 'tipo', label: 'Tipo', type: 'select', multiple: true, options: TIPOS.map((t) => ({ label: t, value: t })) },
              { id: 'estado', label: 'Estado', type: 'select', multiple: true, options: ESTADOS.map((e) => ({ label: e, value: e })) },
            ],
            onColumnFiltersChange: (nuevos) => {
              const valor = (id: string) => {
                const v = nuevos.find((f) => f.id === id)?.value
                return Array.isArray(v) ? ((v as string[]).at(-1) ?? '') : ''
              }
              setTipo(valor('tipo') as Tipo | '')
              setEstado(valor('estado') as Estado | '')
              setPagina(1)
            },
            sort: { onSortChange: setOrden },
            search: {
              placeholder: 'Buscar assessments',
              onSearch: (texto) => {
                setBusqueda(texto)
                setPagina(1)
              },
            },
            emptyState: {
              type: 'no-results',
              customComponent: <SinResultados busqueda={busqueda} filtrosActivos={[tipo, estado].filter(Boolean).length} onLimpiar={limpiar} />,
            },
            // Cabecera como la de Vacantes (decisión 1, 5-oct): sin título dentro del marco, el conteo lo pone TablaDatos.
            labels: {
              resultCount: () => `${filtrados.length.toLocaleString('es-CO')} de ${assessments.length.toLocaleString('es-CO')} assessments`,
            },
            globalTotal: filtrados.length,
            // Las columnas ya suman lo que mide el marco: sin cambio de ancho para que no se salgan de él.
            layout: { resizable: false },
          }}
        />
        )}
      </PageContent>

      {/* Activar adelanta la prueba para que abra hoy. De paso se puede mover el cierre,
          porque la ventana la decide quien la programa. Va en la ventana única del sistema (ActionDialog, decisión 4):
          título fijo y la prueba en la primera línea del cuerpo. */}
      <ActionDialog
        open={Boolean(porActivar)}
        onOpenChange={(abierto) => !abierto && cerrarActivar()}
        size="sm"
        title="Activar assessment"
        sub={porActivar ? `Se abrirá hoy y ${porActivar.convocados} personas podrán responderlo.` : undefined}
        lead={
          porActivar ? (
            <>
              <Heading as="h3" level={6}>
                {porActivar.nombre}
              </Heading>
              <Text as="span" variant="muted" size="sm">
                {porActivar.tipo}
              </Text>
            </>
          ) : null
        }
        confirmLabel="Activar"
        confirmDisabled={!nuevoFin}
        onConfirm={confirmarActivar}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3">
            <Text as="span" size="sm" className="text-muted-foreground">
              Nueva fecha de inicio
            </Text>
            <Text as="span" size="sm" weight="medium" className="tabular-nums">
              Hoy, {fechaCorta(hoyIso())}
            </Text>
          </div>

          <div className="flex flex-col gap-2">
            <Text as="span" size="sm" className="text-muted-foreground">
              Fecha de finalización
            </Text>
            <CalendarioFecha elegida={nuevoFin} onElegir={setNuevoFin} />
            <Text as="span" size="xs" className="text-muted-foreground">
              Se puede dejar la que ya tenía o moverla.
            </Text>
          </div>
        </div>
      </ActionDialog>

      {/* Editar fechas: la misma ventana con calendario de «Activar», pero solo mueve el cierre (13-oct, I-007). */}
      <ActionDialog
        open={Boolean(porEditar)}
        onOpenChange={(abierto) => !abierto && cerrarEditar()}
        size="sm"
        title="Editar fechas"
        sub={porEditar ? `Las ${porEditar.convocados} personas convocadas verán la nueva fecha de cierre.` : undefined}
        lead={
          porEditar ? (
            <>
              <Heading as="h3" level={6}>
                {porEditar.nombre}
              </Heading>
              <Text as="span" variant="muted" size="sm">
                {porEditar.tipo}
              </Text>
            </>
          ) : null
        }
        confirmLabel="Guardar cambios"
        confirmDisabled={!finEditado || finAntesDelInicio}
        onConfirm={confirmarEditar}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3">
            <Text as="span" size="sm" className="text-muted-foreground">
              Fecha de inicio
            </Text>
            <Text as="span" size="sm" weight="medium" className="tabular-nums">
              {porEditar ? fechaCorta(porEditar.inicio) : ''}
            </Text>
          </div>

          <div className="flex flex-col gap-2">
            <Text as="span" size="sm" className="text-muted-foreground">
              Fecha de finalización
            </Text>
            <CalendarioFecha elegida={finEditado} onElegir={setFinEditado} />
            <Text as="span" size="xs" className={finAntesDelInicio ? 'text-destructive' : 'text-muted-foreground'}>
              {finAntesDelInicio ? 'El cierre no puede ser antes del inicio.' : 'Puedes alargar o acortar el plazo de respuesta.'}
            </Text>
          </div>
        </div>
      </ActionDialog>

      {/* Eliminar pregunta antes y de verdad quita la fila (13-oct, I-006): como «Eliminar» en Contenidos del LMS. */}
      <DialogoConfirmar
        abierto={Boolean(porEliminar)}
        onAbiertoChange={(abierto) => !abierto && setPorEliminar(null)}
        size="sm"
        icono={Delete02Icon}
        titulo="¿Eliminar el assessment?"
        descripcion={
          porEliminar
            ? porEliminar.convocados
              ? `Afecta a ${porEliminar.convocados.toLocaleString('es-CO')} ${plural(porEliminar.convocados, 'persona convocada', 'personas convocadas')}${porEliminar.respondieron ? ` y ${plural(porEliminar.respondieron, 'se pierde', 'se pierden')} ${porEliminar.respondieron.toLocaleString('es-CO')} ${plural(porEliminar.respondieron, 'respuesta', 'respuestas')}` : ''}. No se puede recuperar.`
              : 'Todavía no tiene personas convocadas. No se puede recuperar.'
            : ''
        }
        accion="Eliminar assessment"
        destructiva
        onConfirmar={confirmarEliminar}
      >
        {porEliminar ? (
          <RegistroConfirmar
            nombre={porEliminar.nombre}
            detalle={`${porEliminar.tipo} · ${porEliminar.respondieron.toLocaleString('es-CO')}/${porEliminar.convocados.toLocaleString('es-CO')} respondieron`}
            estado={porEliminar.estado}
            tono="neutro"
            icono={Calendar03Icon}
          />
        ) : null}
      </DialogoConfirmar>
    </PageShell>
  )
}

Component.displayName = 'AdminAprendizajeDiagnosticoPage'
