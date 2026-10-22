import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Download01Icon, Mail01Icon, UserMultiple02Icon } from '@hugeicons/core-free-icons'
import { Button, Progress, Text, type DataGridListConfig } from '@ubits/flux-ui'
import { SinResultados } from '@/shared/components/SinResultados'
import { TextoCompleto } from '@/shared/components/TextoCompleto'
import { notify } from '@/shared/components/notify'
import { Persona } from '@/modules/design-system/data-grid/casos/seguimiento'
import { SIN_ARRASTRE } from '@/modules/design-system/data-grid/casos/sin-arrastre'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { DialogoConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { diasDesde, fechaCorta, plural } from '@/modules/design-system/patrones/formato'
import { descargarTerminaron, enOrdenDeLlegada } from './reportes'
import { nombreAsignacion, ordenarPor, porTiempoSinEntrar, type PersonaDelPlan, type Plan } from './planes-datos'

// Las personas detrás de una cifra del avance: se abre al tocar un caso de «Para atender» («22 personas no han
// empezado», «19 personas ya terminaron», «Nadie de "Analistas" ha terminado»). El mismo recorrido del panel de riesgos
// de Encuestas (Elkin, drawer-riesgo.tsx): qué pasa arriba, la lista para actuar en el cuerpo y la acción abajo.
// - Quien no ha terminado: se elige a quién recordarle (o a todos) y se confirma en el mismo panel.
// - Quien terminó: en orden de llegada (1.º, 2.º…), para descargar la lista.

export type ListaAvance = {
  /** «22 personas no han empezado»: la cifra que se tocó. */
  titulo: string
  personas: PersonaDelPlan[]
  terminaron?: boolean
}

type Fila = PersonaDelPlan & { asignacion: string; puesto: number }

const celdaPersona: NonNullable<DataGridListConfig<Fila>['columns']>[number] = {
  accessorKey: 'nombre',
  header: 'Persona',
  size: 250,
  ...SIN_ARRASTRE,
  cell: ({ row }) => <Persona nombre={row.original.nombre} detalle={row.original.area} />,
}
const celdaAsignacion: NonNullable<DataGridListConfig<Fila>['columns']>[number] = {
  accessorKey: 'asignacion',
  header: 'Asignación',
  size: 170,
  ...SIN_ARRASTRE,
  cell: ({ row }) => (
    <TextoCompleto texto={row.original.asignacion}>
      <Text as="span" size="sm" className="block truncate">
        {row.original.asignacion}
      </Text>
    </TextoCompleto>
  ),
}
const celdaAvance: NonNullable<DataGridListConfig<Fila>['columns']>[number] = {
  accessorKey: 'progreso',
  header: 'Avance',
  size: 170,
  ...SIN_ARRASTRE,
  cell: ({ row }) => (
    <span className="flex w-full items-center gap-3">
      <Progress value={row.original.progreso} className="flex-1" aria-label={`${row.original.progreso} %`} />
      <Text as="span" size="sm" className="w-12 shrink-0 text-right whitespace-nowrap tabular-nums">
        {row.original.progreso} %
      </Text>
    </span>
  ),
}
const celdaUltimo = (header: string): NonNullable<DataGridListConfig<Fila>['columns']>[number] => ({
  accessorKey: 'ultimoProgreso',
  header,
  size: 140,
  ...SIN_ARRASTRE,
  cell: ({ row }) => (
    <Text as="span" size="sm" variant={row.original.ultimoProgreso ? undefined : 'muted'}>
      {row.original.ultimoProgreso ?? (row.original.ultimoAcceso ? `Entró ${row.original.ultimoAcceso}` : 'Nunca ha entrado')}
    </Text>
  ),
})

// Fuera del componente, para que el orden y la búsqueda de la tabla no se reinicien al elegir filas.
const COLUMNAS_FALTAN: DataGridListConfig<Fila>['columns'] = [celdaPersona, celdaAsignacion, celdaAvance, celdaUltimo('Último avance')]
const COLUMNAS_TERMINARON: DataGridListConfig<Fila>['columns'] = [
  {
    accessorKey: 'puesto',
    header: 'Puesto',
    size: 80,
    ...SIN_ARRASTRE,
    cell: ({ row }) => (
      <Text as="span" size="sm" weight={row.original.puesto <= 3 ? 'semibold' : undefined} className="tabular-nums">
        {row.original.puesto}.º
      </Text>
    ),
  },
  celdaPersona,
  celdaAsignacion,
  celdaAvance,
  celdaUltimo('Terminó'),
]

export function PanelPersonasAvance({
  plan,
  lista,
  abierto,
  onAbiertoChange,
}: {
  plan: Plan
  lista: ListaAvance
  abierto: boolean
  onAbiertoChange: (abierto: boolean) => void
}) {
  const vigente = plan.estado === 'Vigente'
  const filas = useMemo<Fila[]>(() => {
    const ordenadas = lista.terminaron ? enOrdenDeLlegada(lista.personas) : porTiempoSinEntrar(lista.personas)
    return ordenadas.map((p, indice) => {
      const asignacion = plan.asignaciones.find((a) => a.id === p.asignacionId)
      const otras = p.asignaciones.length - 1
      const nombre = asignacion ? nombreAsignacion(asignacion) : 'Agregada aparte'
      return { ...p, puesto: indice + 1, asignacion: otras > 0 ? `${nombre} y ${otras} más` : nombre }
    })
  }, [lista, plan.asignaciones])

  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [version, setVersion] = useState(0)
  const [elegidas, setElegidas] = useState<Fila[]>([])
  const [confirmando, setConfirmando] = useState(false)

  const resultado = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return ordenarPor(
      filas.filter((f) => !q || `${f.nombre} ${f.area} ${f.asignacion}`.toLowerCase().includes(q)),
      orden,
    )
  }, [filas, busqueda, orden])
  const visibles = resultado.slice((pagina - 1) * porPagina, pagina * porPagina)

  // A quién se le recuerda: a las elegidas o, sin elegir, a todas las que no han terminado.
  const pendientes = filas.filter((f) => f.progreso < 100)
  const destino = (elegidas.length ? elegidas : pendientes).filter((f) => f.progreso < 100)
  const recordable = !lista.terminaron && vigente && pendientes.length > 0

  const faltan = -diasDesde(plan.fin)
  const contexto = plan.estado === 'No vigente' ? `cerró el ${fechaCorta(plan.fin)}` : faltan > 0 ? `quedan ${faltan.toLocaleString('es-CO')} ${plural(faltan, 'día', 'días')}` : 'cierra hoy'

  const config: DataGridListConfig<Fila> = {
    columns: lista.terminaron ? COLUMNAS_TERMINARON : COLUMNAS_FALTAN,
    sort: { onSortChange: setOrden },
    search: {
      placeholder: 'Buscar persona, área o asignación',
      onSearch: (q) => {
        setBusqueda(q)
        setPagina(1)
      },
    },
    ...(recordable ? { selection: { onSelectionChange: setElegidas } } : {}),
    // Compacta y quieta: en un panel no hay lugar para mover ni ensanchar columnas.
    layout: { dense: true, reorderable: false, resizable: false },
    emptyState: {
      type: 'no-results',
      customComponent: (
        <SinResultados
          busqueda={busqueda}
          filtrosActivos={0}
          onLimpiar={() => {
            setBusqueda('')
            setVersion((v) => v + 1)
          }}
        />
      ),
    },
  }

  const enviar = () => {
    const aQuien = destino.length === 1 ? destino[0].nombre : `${destino.length.toLocaleString('es-CO')} personas`
    notify('Recordatorio enviado', `Va en camino a ${aQuien}.`, 'success')
    setConfirmando(false)
  }
  const descargar = () => {
    descargarTerminaron(plan)
    const cuantas = `${filas.length.toLocaleString('es-CO')} ${plural(filas.length, 'persona', 'personas')}`
    notify('Lista descargada', `${cuantas}, de la primera a la última en terminar.`, 'success')
  }

  return (
    <DrawerShell
      open={abierto}
      onOpenChange={onAbiertoChange}
      size="xl"
      icon={UserMultiple02Icon}
      title={lista.titulo}
      description={`${plan.nombre} · ${contexto}`}
      footer={
        <>
          <Button variant="outline" onClick={() => onAbiertoChange(false)}>
            Cerrar
          </Button>
          {lista.terminaron ? (
            <Button onClick={descargar}>
              <HugeiconsIcon icon={Download01Icon} aria-hidden="true" />
              Descargar en orden
            </Button>
          ) : recordable ? (
            <Button onClick={() => setConfirmando(true)} disabled={!destino.length}>
              <HugeiconsIcon icon={Mail01Icon} aria-hidden="true" />
              Recordar a {destino.length.toLocaleString('es-CO')}
            </Button>
          ) : null}
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {recordable ? (
          <Text as="p" size="sm" variant="muted">
            {elegidas.length
              ? `Elegiste a ${elegidas.length.toLocaleString('es-CO')}: el recordatorio ${plural(elegidas.length, 'le llega solo a esa persona', 'les llega solo a ellas')}.`
              : 'Elige a quiénes recordarle, o envíalo a todas.'}
          </Text>
        ) : null}
        <TablaDatos key={version} config={config} data={visibles} paginacion={{ pagina, setPagina, porPagina, setPorPagina, total: resultado.length }} nombre="personas" singular="persona" id="personas-avance" />
      </div>

      {/* La misma confirmación del recordatorio de la página del plan; dentro del panel se abre en él (DrawerAnidado). */}
      <DialogoConfirmar
        abierto={confirmando}
        onAbiertoChange={setConfirmando}
        icono={Mail01Icon}
        titulo="Enviar recordatorio"
        descripcion={
          destino.length === 1
            ? `Le llegará un correo a ${destino[0].nombre} con lo que le falta de «${plan.nombre}» y la fecha de cierre (${fechaCorta(plan.fin)}).`
            : `Le llegará un correo a ${destino.length.toLocaleString('es-CO')} personas que no han terminado «${plan.nombre}», con lo que les falta y la fecha de cierre (${fechaCorta(plan.fin)}).`
        }
        accion={destino.length === 1 ? 'Enviar recordatorio' : `Enviar a ${destino.length.toLocaleString('es-CO')} personas`}
        onConfirmar={enviar}
      />
    </DrawerShell>
  )
}
