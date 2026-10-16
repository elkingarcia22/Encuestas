import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Mail01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import {
  Badge,
  Progress,
  Text,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  type BulkAction,
  type ListAction,
  type DataGridListConfig,
} from '@ubits/flux-ui'
import { DialogoConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { notify } from '@/shared/components/notify'
import { PageSection } from '@/shared/components/PageShell'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import { CeldaTitulo } from '@/modules/design-system/data-grid/celda-titulo'
import { Persona } from '@/modules/design-system/data-grid/casos/seguimiento'
import { SIN_ARRASTRE } from '@/modules/design-system/data-grid/casos/sin-arrastre'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { plural } from '@/modules/design-system/patrones/formato'
import { pagina } from '@/modules/design-system/templates/admin-compartido/lista'
import { COLLABORATORS } from '../../modelo/collaborators'
import { formatPercent } from '../../modelo/favorabilityScale'
import type { ParticipationRow, SegmentDefinition } from '../../modelo/surveyResults'
import { numero } from './escala'

// La tabla de «¿quién falta?». Por grupos (área, país, líder…) cuenta respondieron, en progreso y
// faltan; por colaborador, cada fila es una persona. Marcar filas cambia la acción de la cabecera:
// el recordatorio nunca cuenta a quien ya respondió, siempre a los que faltan.
//
// Es la tabla del sistema (TablaDatos, auditoría 5-oct, decisiones 1 y 2): buscador, orden y filtro en cada columna,
// «Acciones» con una sola acción, enviar recordatorio, y el pie en español de todo el admin. Sin la vista de lista ni el scroll infinito
// del menú «Configurar tabla», que eran de esta tabla sola.

export type Estado = 'Completado' | 'En progreso' | 'Falta'
const ESTADOS: readonly Estado[] = ['Completado', 'En progreso', 'Falta']
// Como los estados de Data grid del design system: hecho en verde, en curso en azul y lo vencido o pendiente en rojo.
const VARIANTE_ESTADO: Record<Estado, 'success-light' | 'info-light' | 'destructive-outline'> = {
  Completado: 'success-light',
  'En progreso': 'info-light',
  Falta: 'destructive-outline',
}

const faltan = (fila: ParticipationRow) => Math.max(0, fila.invited - fila.completed - fila.inProgress)

function estadoDe(fila: ParticipationRow, porPersona: boolean): Estado {
  const hecho = porPersona ? fila.completed > 0 : fila.completed === fila.invited
  const empezado = porPersona ? fila.inProgress > 0 : fila.completed > 0 || fila.inProgress > 0
  return hecho ? 'Completado' : empezado ? 'En progreso' : 'Falta'
}

type Fila = ParticipationRow & { estado: Estado; faltan: number; correo: string; lider: string; areaPersona: string }
type FiltroId = 'leader' | 'area' | 'grupo'

// El recordatorio siempre va a los que faltan.
const personasPorRecordar = (lista: readonly Fila[]) => lista.reduce((suma, fila) => suma + fila.faltan, 0)

// La columna «Acciones» lleva una sola acción, enviar recordatorio (pedido de Elkin, 13-oct): sin menú de «⋯».
// Se apaga cuando ya no falta nadie: a quien respondió no le llega.
function BotonRecordar({ fila, onRecordar }: { fila: Fila; onRecordar: (filas: Fila[]) => void }) {
  const sinFaltantes = fila.faltan === 0 || fila.estado === 'Completado'
  return (
    <Tooltip>
      <TooltipTrigger render={<BotonIcono aria-label={`Enviar recordatorio a ${fila.label}`} disabled={sinFaltantes} onClick={() => onRecordar([fila])} />}>
        <HugeiconsIcon icon={Mail01Icon} aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent>Enviar recordatorio</TooltipContent>
    </Tooltip>
  )
}

const cifra = (valor: string) => (
  <Text as="span" size="sm" className="tabular-nums">
    {valor}
  </Text>
)

// Las columnas cambian entre «por grupos» y «por persona»; la tabla se vuelve a montar al cambiar de vista.
// `sinDemograficos`: la encuesta no los recogió, así que la fila de cada persona no lleva su líder ni su área (ni sus
// filtros): sería filtrar por un grupo que la encuesta no tiene, justo lo que el aviso de la pestaña dice que no se puede.
function columnasDe(segmento: SegmentDefinition, sinDemograficos: boolean, onRecordar: (filas: Fila[]) => void): DataGridListConfig<Fila>['columns'] {
  const porPersona = segmento.perPerson
  const nombre: DataGridListConfig<Fila>['columns'][number] = {
    accessorKey: 'label',
    header: segmento.label,
    // Sin Líder ni Área, su ancho pasa a la persona y al correo: así la tabla llena su marco y «Acciones» no se queda con el sobrante.
    size: porPersona ? (sinDemograficos ? 380 : 240) : 220,
    cell: ({ row }) => (porPersona ? <Persona nombre={row.original.label} /> : <CeldaTitulo titulo={row.original.label} />),
  }
  const estado: DataGridListConfig<Fila>['columns'][number] = {
    accessorKey: 'estado',
    header: 'Estado',
    size: 140,
    cell: ({ row }) => (
      <Badge variant={VARIANTE_ESTADO[row.original.estado]} size="sm">
        {row.original.estado}
      </Badge>
    ),
  }
  const acciones: DataGridListConfig<Fila>['columns'][number] = {
    id: 'acciones',
    header: 'Acciones',
    size: 100,
    enableSorting: false,
    enableResizing: false,
    ...SIN_ARRASTRE,
    cell: ({ row }) => <BotonRecordar fila={row.original} onRecordar={onRecordar} />,
  }
  if (porPersona) {
    return [
      nombre,
      { accessorKey: 'correo', header: 'Correo', size: sinDemograficos ? 380 : 220, cell: ({ row }) => <Text as="span" size="sm" variant="muted">{row.original.correo}</Text> },
      ...(sinDemograficos
        ? []
        : [
            { accessorKey: 'lider', header: 'Líder', size: 170, cell: ({ row }) => <Text as="span" size="sm">{row.original.lider}</Text> },
            { accessorKey: 'areaPersona', header: 'Área', size: 160, cell: ({ row }) => <Text as="span" size="sm">{row.original.areaPersona}</Text> },
          ] satisfies DataGridListConfig<Fila>['columns']),
      estado,
      acciones,
    ]
  }
  return [
    nombre,
    estado,
    {
      accessorKey: 'completed',
      header: 'Respondieron',
      size: 130,
      cell: ({ row }) => (
        <Text as="span" size="sm" className="tabular-nums">
          {numero(row.original.completed)}
          <Text as="span" size="sm" variant="muted">
            {' '}
            / {numero(row.original.invited)}
          </Text>
        </Text>
      ),
    },
    { accessorKey: 'inProgress', header: 'En progreso', size: 120, cell: ({ row }) => cifra(row.original.inProgress === 0 ? '—' : numero(row.original.inProgress)) },
    { accessorKey: 'faltan', header: 'Faltan', size: 100, cell: ({ row }) => cifra(row.original.faltan === 0 ? '—' : numero(row.original.faltan)) },
    {
      accessorKey: 'rate',
      header: 'Participación',
      size: 190,
      cell: ({ row }) => (
        <div className="flex w-full items-center gap-2">
          <Progress value={row.original.rate} aria-label={`Participación de ${row.original.label}`} className="flex-1" />
          <Text as="span" size="sm" weight="semibold" className="w-12 text-right tabular-nums">
            {formatPercent(row.original.rate)}
          </Text>
        </div>
      ),
    },
    acciones,
  ]
}

function ordenar(filas: Fila[], orden?: string) {
  if (!orden) return filas
  const campo = (orden.startsWith('-') ? orden.slice(1) : orden) as keyof Fila
  const signo = orden.startsWith('-') ? -1 : 1
  return [...filas].sort((a, b) => {
    const x = a[campo]
    const y = b[campo]
    return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'es')) * signo
  })
}

const opcionesDe = (valores: readonly string[]) => valores.map((valor) => ({ label: valor, value: valor }))
const unicos = (valores: readonly string[]) => [...new Set(valores)].sort((a, b) => a.localeCompare(b, 'es'))
const SIN_FILTROS: Record<FiltroId, string[]> = { leader: [], area: [], grupo: [] }

type Props = {
  filas: readonly ParticipationRow[]
  segmentos: readonly SegmentDefinition[]
  segmento: SegmentDefinition
  onSegmento: (clave: string) => void
  seleccion: ReadonlySet<string>
  onSeleccion: (ids: ReadonlySet<string>) => void
  estados: readonly string[]
  onEstados: (estados: string[]) => void
}

export function TablaParticipacion({ filas, segmentos, segmento, onSegmento, seleccion, onSeleccion, estados, onEstados }: Props) {
  const porPersona = segmento.perPerson
  // Sin demográficos llega la lista de invitados por colaborador y ningún otro demográfico: no hay «Ver por».
  const sinDemograficos = segmentos.length === 0
  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState<string | undefined>('rate')
  const [actual, setActual] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [filtros, setFiltros] = useState<Record<FiltroId, string[]>>(SIN_FILTROS)
  // Cambia para montar la tabla de nuevo al limpiar: así se vacían también su buscador y sus filtros.
  const [version, setVersion] = useState(0)
  // Las filas a las que se les va a recordar: enviar pregunta antes (regla «preguntar-antes»).
  const [recordando, setRecordando] = useState<Fila[]>([])

  const completas = useMemo<Fila[]>(
    () =>
      filas.map((fila) => {
        const persona = porPersona ? COLLABORATORS.find((colaborador) => colaborador.name === fila.label) : undefined
        return {
          ...fila,
          estado: estadoDe(fila, porPersona),
          faltan: faltan(fila),
          correo: persona?.email ?? '—',
          lider: persona?.leader ?? '—',
          areaPersona: persona?.area ?? '—',
        }
      }),
    [filas, porPersona],
  )

  // Columnas y filtros se recalculan solo al cambiar de vista o de datos: si no, el filtro se cerraría al marcar.
  const columnas = useMemo(() => columnasDe(segmento, sinDemograficos, setRecordando), [segmento, sinDemograficos])
  const filtrosColumna = useMemo<DataGridListConfig<Fila>['columnFilters']>(
    () => [
      ...(porPersona ? [] : [{ id: 'label', label: segmento.label, type: 'select' as const, multiple: true, searchable: true, options: opcionesDe(completas.map((fila) => fila.label)) }]),
      { id: 'estado', label: 'Estado', type: 'select', multiple: true, options: opcionesDe(ESTADOS) },
      ...(porPersona && !sinDemograficos
        ? [
            { id: 'lider', label: 'Líder', type: 'select' as const, multiple: true, searchable: true, options: opcionesDe(unicos(completas.map((fila) => fila.lider))) },
            { id: 'areaPersona', label: 'Área', type: 'select' as const, multiple: true, searchable: true, options: opcionesDe(unicos(completas.map((fila) => fila.areaPersona))) },
          ]
        : []),
    ],
    [porPersona, sinDemograficos, segmento.label, completas],
  )

  const resultado = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const pasan = completas.filter(
      (fila) =>
        (!q || fila.label.toLowerCase().includes(q)) &&
        (estados.length === 0 || estados.includes(fila.estado)) &&
        (filtros.leader.length === 0 || filtros.leader.includes(fila.lider)) &&
        (filtros.area.length === 0 || filtros.area.includes(fila.areaPersona)) &&
        (filtros.grupo.length === 0 || filtros.grupo.includes(fila.label)),
    )
    return ordenar(pasan, orden)
  }, [completas, busqueda, estados, filtros, orden])
  const visibles = useMemo(() => pagina(resultado, actual, porPagina), [resultado, actual, porPagina])

  const marcadas = completas.filter((fila) => seleccion.has(fila.id))
  const nombreGrupos = segmento.label.toLowerCase()
  const faltantesMarcados = personasPorRecordar(marcadas)
  const porRecordar = personasPorRecordar(recordando)
  const filtrosActivos = Object.values(filtros).filter((valores) => valores.length > 0).length + (estados.length > 0 ? 1 : 0)

  // La selección vive en la pestaña (la suelta al cambiar de vista): la tabla avisa qué quedó marcado en la página.
  const alMarcar = (marcadasAhora: Fila[]) => {
    const ids = new Set(marcadasAhora.map((fila) => fila.id))
    if (ids.size === seleccion.size && [...ids].every((id) => seleccion.has(id))) return
    onSeleccion(ids)
  }

  // Con filas marcadas, su acción va en la cabecera junto al buscador, como en Data grid del design system.
  const accionesSeleccion: BulkAction<Fila>[] = [
    {
      id: 'recordar',
      label: faltantesMarcados === 0 ? 'Nadie por recordar: lo marcado ya respondió' : `Enviar recordatorio a ${numero(faltantesMarcados)} ${plural(faltantesMarcados, 'persona', 'personas')}`,
      icon: <HugeiconsIcon icon={Mail01Icon} aria-hidden="true" />,
      visibility: 'always',
      disabled: faltantesMarcados === 0,
      onClick: () => setRecordando(marcadas),
    },
  ]

  // «Ver por» va dentro de la tabla, a la derecha del buscador (pedido de Elkin, 14-oct): es el menú de la barra de la
  // tabla del sistema, con la vista activa marcada. Sin demográficos no hay otra vista que elegir.
  const cambiarVista = (clave: string) => {
    if (clave === segmento.key) return
    setBusqueda('')
    setFiltros(SIN_FILTROS)
    onEstados([])
    setActual(1)
    onSegmento(clave)
  }
  const verPor: ListAction<Fila>[] = sinDemograficos
    ? []
    : [
        {
          id: 'ver-por',
          label: `Por ${segmento.label.toLowerCase()}`,
          isDropdown: true,
          dropdownGroups: [{ header: 'Ver por', items: segmentos.map((opcion) => ({ id: opcion.key, label: opcion.label, icon: opcion.key === segmento.key ? <HugeiconsIcon icon={Tick02Icon} aria-hidden="true" /> : <span className="size-4 shrink-0" aria-hidden="true" />, onClick: () => cambiarVista(opcion.key) })) }],
          onDropdownItemClick: cambiarVista,
          onClick: () => undefined,
        },
      ]

  const limpiar = () => {
    setBusqueda('')
    setFiltros(SIN_FILTROS)
    onEstados([])
    setActual(1)
    setVersion((previa) => previa + 1)
  }

  const config: DataGridListConfig<Fila> = {
    columns: columnas,
    columnFilters: filtrosColumna,
    onColumnFiltersChange: (nuevos) => {
      const valores = (id: string) => {
        const valor = nuevos.find((filtro) => filtro.id === id)?.value
        return Array.isArray(valor) ? valor.map(String) : []
      }
      onEstados(valores('estado'))
      setFiltros({ leader: valores('lider'), area: valores('areaPersona'), grupo: valores('label') })
      setActual(1)
    },
    sort: {
      onSortChange: (nuevo) => {
        setOrden(nuevo)
        setActual(1)
      },
    },
    search: {
      placeholder: `Buscar por ${nombreGrupos}`,
      onSearch: (q) => {
        setBusqueda(q)
        setActual(1)
      },
    },
    selection: { onSelectionChange: alMarcar },
    bulkActions: accionesSeleccion,
    actions: { secondary: verPor },
    // Los vacíos del sistema, con ilustración (decisión 14): «Sin resultados» con lo buscado y el botón para limpiar.
    emptyState:
      busqueda.trim() || filtrosActivos > 0
        ? { type: 'no-results', customComponent: <SinResultados busqueda={busqueda} filtrosActivos={filtrosActivos} onLimpiar={limpiar} /> }
        : {
            type: 'empty',
            customComponent: <PrimeraVez icono="glass-profile" titulo="Todavía no hay invitados" descripcion="Cuando la encuesta tenga participantes, aquí verás quién respondió y quién falta." />,
          },
  }

  return (
    // El título y «Ver por» van sobre la tabla: la tabla del sistema no lleva título dentro de su marco.
    <PageSection
      title={`Detalle de la participación por ${nombreGrupos}`}
    >
      {/* Los globos de las acciones de lo marcado salen a los 200 ms, como los del resto del playground. */}
      {/* «Por colaborador» va entre el buscador y el botón de columnas (Elkin, 14-oct). La tabla de la librería pinta sus
          acciones después de ese botón y no deja reordenarlas: solo se le cambia el orden (layout) al de columnas. */}
      <div className="[&_button[aria-label='Personalizar_columnas']]:order-1">
        <TooltipProvider delay={200}>
          <TablaDatos
            // Cada vista tiene sus columnas: al cambiar de grupo a persona la tabla empieza de nuevo.
            key={`${segmento.key}-${version}`}
            config={config}
            data={visibles}
            paginacion={{ pagina: actual, setPagina: setActual, porPagina, setPorPagina, total: resultado.length }}
            nombre={porPersona ? 'personas' : 'grupos'}
            singular={porPersona ? 'persona' : 'grupo'}
            id="participacion"
          />
        </TooltipProvider>
      </div>

      {/* Le llega a otras personas: dice a cuántas antes de enviar. */}
      <DialogoConfirmar
        abierto={recordando.length > 0}
        onAbiertoChange={(abierto) => (abierto ? undefined : setRecordando([]))}
        icono={Mail01Icon}
        titulo="¿Enviar recordatorio?"
        // Como «¿Salir de la creación?» de Crear contenido (Elkin, 14-oct): sin tarjeta del registro, su nombre va en el texto.
        descripcion={
          recordando.length === 1 && porPersona
            ? `A «${recordando[0].label}» le llegará un correo y un aviso en su inicio de UBITS para que responda la encuesta.`
            : recordando.length === 1
              ? `Les llegará un correo y un aviso en su inicio de UBITS a ${numero(porRecordar)} ${plural(porRecordar, 'persona', 'personas')} de «${recordando[0].label}» que no han respondido. A quien ya respondió no le llega.`
              : `Les llegará un correo y un aviso en su inicio de UBITS a ${numero(porRecordar)} personas que no han respondido. A quien ya respondió no le llega.`
        }
        accion={porRecordar === 1 ? 'Enviar recordatorio' : `Enviar a ${numero(porRecordar)} personas`}
        onConfirmar={() => {
          notify('Recordatorio enviado', `Va en camino a ${numero(porRecordar)} ${plural(porRecordar, 'persona', 'personas')}.`, 'success')
          setRecordando([])
        }}
      />
    </PageSection>
  )
}
