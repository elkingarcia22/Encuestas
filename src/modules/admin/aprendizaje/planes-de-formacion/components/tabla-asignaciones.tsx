import { createContext, useContext, useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Edit02Icon, PlusSignIcon } from '@hugeicons/core-free-icons'
import { Button, Progress, Text, type DataGridListConfig } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { PageSection } from '@/shared/components/PageShell'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { CeldaTitulo } from '@/modules/design-system/data-grid/celda-titulo'
import { SIN_ARRASTRE } from '@/modules/design-system/data-grid/casos/sin-arrastre'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { plural } from '@/modules/design-system/patrones/formato'
import { marcaDe } from './asignaciones'
import { FILAS_CLICABLES, abrirAlTocarFila } from './filas'
import { PanelAsignacion } from './panel-asignacion'
import { SALIDA_PANEL, TIPOS, miembrosDe, personasDelPlan, piezasDe, type Asignacion, type Plan } from './planes-datos'

// La pestaña «Asignaciones» de la página del plan: primero se lee, después se edita (pedido del 15-oct). Una fila por
// asignación con a quiénes les llega, qué ven y cuántos ya terminaron todo; «Editar» (o tocar la fila) abre el panel
// «Editar asignación», que cambia una sola asignación y la devuelve al borrador del plan. Nada le llega a nadie hasta
// «Guardar», en la barra de abajo de la página. Un plan Finalizado se lee, pero no se cambia.

const n = (cuantas: number) => cuantas.toLocaleString('es-CO')
const MAS = 3

type Fila = {
  id: string
  nombre: string
  personas: number
  marca?: 'Nueva' | 'Con cambios'
  // Lo que le falta para poder guardarse, solo después de intentar guardar.
  falta?: string
  quienes: string[]
  items: string[]
  // % de sus personas que terminaron todo; null si el plan no ha empezado o la asignación todavía no se guarda.
  terminaron: number | null
}

// A quiénes, en frases cortas: «Grupo: Mandos medios», «+ 2 personas sueltas», «Toda la empresa», el archivo.
function quienesDe(asignacion: Asignacion) {
  const piezas = piezasDe(asignacion)
  const sueltas = piezas.filter((p) => p.tipo === 'persona' || p.tipo === 'nombre').length
  const resto = piezas.flatMap((p) => (p.tipo === 'grupo' ? [`Grupo: ${p.texto}`] : p.tipo === 'empresa' || p.tipo === 'archivo' ? [p.texto] : []))
  if (sueltas) resto.push(`${resto.length ? '+ ' : ''}${n(sueltas)} ${plural(sueltas, 'persona suelta', 'personas sueltas')}`)
  return resto
}

// Las celdas abren el panel por aquí: las columnas se arman una vez, fuera del componente (trampa de DataGridList).
const AccionesAsignacion = createContext<{ onEditar: (id: string) => void } | null>(null)

function Lista({ lineas, vacio }: { lineas: string[]; vacio: string }) {
  if (!lineas.length) {
    return (
      <Text as="span" size="sm" variant="muted">
        {vacio}
      </Text>
    )
  }
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      {lineas.slice(0, MAS).map((linea) => (
        <Text key={linea} as="span" size="sm" className="truncate">
          {linea}
        </Text>
      ))}
      {lineas.length > MAS ? (
        <Text as="span" size="sm" variant="muted">
          y {n(lineas.length - MAS)} más
        </Text>
      ) : null}
    </div>
  )
}

function CeldaAsignacion({ fila }: { fila: Fila }) {
  const acciones = useContext(AccionesAsignacion)
  return (
    <CeldaTitulo
      titulo={fila.nombre}
      onClick={acciones ? () => acciones.onEditar(fila.id) : undefined}
      detalle={
        <span className="flex flex-wrap items-center gap-1.5 tabular-nums">
          {n(fila.personas)} {plural(fila.personas, 'persona', 'personas')}
          {fila.falta ? (
            <Badge variant="destructive-light" size="sm">
              {fila.falta}
            </Badge>
          ) : fila.marca ? (
            <Badge variant={fila.marca === 'Nueva' ? 'info-light' : 'warning-light'} size="sm">
              {fila.marca}
            </Badge>
          ) : null}
        </span>
      }
    />
  )
}

function CeldaEditar({ fila }: { fila: Fila }) {
  const acciones = useContext(AccionesAsignacion)
  if (!acciones) return null
  return (
    <Button variant="outline" size="sm" onClick={() => acciones.onEditar(fila.id)} aria-label={`Editar ${fila.nombre}`}>
      <HugeiconsIcon icon={Edit02Icon} aria-hidden="true" />
      Editar
    </Button>
  )
}

const columnas = (conEditar: boolean, items: string): DataGridListConfig<Fila>['columns'] => [
  { accessorKey: 'nombre', header: 'Asignación', size: 250, ...SIN_ARRASTRE, cell: ({ row }) => <CeldaAsignacion fila={row.original} /> },
  { id: 'quienes', header: 'Personas', size: 250, enableSorting: false, ...SIN_ARRASTRE, cell: ({ row }) => <Lista lineas={row.original.quienes} vacio="Nadie todavía" /> },
  {
    id: 'items',
    header: `${items.charAt(0).toUpperCase() + items.slice(1)} que ven`,
    size: conEditar ? 300 : 410,
    enableSorting: false,
    ...SIN_ARRASTRE,
    cell: ({ row }) => <Lista lineas={row.original.items} vacio="Ninguno todavía" />,
  },
  {
    accessorKey: 'terminaron',
    header: 'Terminaron todo',
    size: 190,
    ...SIN_ARRASTRE,
    cell: ({ row }) =>
      row.original.terminaron === null ? (
        <Text as="span" size="sm" variant="muted">
          —
        </Text>
      ) : (
        <span className="flex w-full items-center gap-3">
          <Progress value={row.original.terminaron} className="flex-1" aria-label={`${row.original.terminaron} % terminó todo`} />
          <Text as="span" size="sm" className="w-11 shrink-0 text-right tabular-nums">
            {row.original.terminaron} %
          </Text>
        </span>
      ),
  },
  ...(conEditar
    ? [{ id: 'editar', header: '', size: 110, enableSorting: false, enableResizing: false, ...SIN_ARRASTRE, cell: ({ row }: { row: { original: Fila } }) => <CeldaEditar fila={row.original} /> }]
    : []),
]

// Una por combinación: las columnas no se rearman en cada render.
const COLUMNAS = new Map<string, DataGridListConfig<Fila>['columns']>()
const columnasDe = (conEditar: boolean, items: string) => {
  const clave = `${conEditar}-${items}`
  if (!COLUMNAS.has(clave)) COLUMNAS.set(clave, columnas(conEditar, items))
  return COLUMNAS.get(clave)!
}

type Editando = { asignacion: Asignacion; nueva: boolean; vez: number }

export function TablaAsignaciones({
  plan,
  guardado,
  onCambio,
  soloLectura = false,
  conErrores = false,
  onIrA,
}: {
  // El borrador de la página y el plan como está guardado (para marcar lo nuevo y lo cambiado, y leer el avance).
  plan: Plan
  guardado: Plan
  onCambio: (plan: Plan) => void
  soloLectura?: boolean
  // Después de intentar guardar: lo que le falta a cada asignación se marca en su fila.
  conErrores?: boolean
  onIrA: (pestana: 'personas') => void
}) {
  const textos = TIPOS[plan.tipo]
  const empezo = guardado.estado === 'Vigente' || guardado.estado === 'No vigente'
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [editando, setEditando] = useState<Editando | null>(null)
  const [cerrando, setCerrando] = useState(false)

  const filas = useMemo<Fila[]>(() => {
    // El avance es el del plan guardado: lo que todavía no se guarda no le ha llegado a nadie.
    const avance = empezo ? personasDelPlan(guardado) : []
    return plan.asignaciones.map((asignacion, indice) => {
      const suyas = avance.filter((p) => p.asignaciones.includes(asignacion.id))
      const personas = miembrosDe(asignacion).length
      const falta = !conErrores ? undefined : !personas ? 'Sin personas' : !asignacion.items.length ? `Sin ${textos.items}` : undefined
      return {
        id: asignacion.id,
        nombre: asignacion.nombre?.trim() || `Asignación ${indice + 1}`,
        personas,
        marca: marcaDe(asignacion, guardado),
        falta,
        quienes: quienesDe(asignacion),
        items: asignacion.items,
        terminaron: suyas.length ? Math.round((suyas.filter((p) => p.progreso === 100).length / suyas.length) * 100) : null,
      }
    })
  }, [plan, guardado, empezo, conErrores, textos.items])
  const visibles = filas.slice((pagina - 1) * porPagina, pagina * porPagina)

  // «Nueva asignación» abre el panel con una vacía; entra al borrador del plan solo al «Aplicar».
  const nueva = () => setEditando({ asignacion: { id: `a-${Date.now()}`, alcance: 'colaboradores', destinatarios: [], sumadas: [], personas: 0, items: [] }, nueva: true, vez: Date.now() })
  const cerrar = () => {
    setCerrando(true)
    window.setTimeout(() => {
      setEditando(null)
      setCerrando(false)
    }, SALIDA_PANEL)
  }
  const acciones = useMemo(() => {
    if (soloLectura) return null
    const onEditar = (id: string) => {
      const asignacion = plan.asignaciones.find((a) => a.id === id)
      if (asignacion) setEditando({ asignacion, nueva: false, vez: Date.now() })
    }
    return { onEditar }
  }, [soloLectura, plan.asignaciones])

  const config: DataGridListConfig<Fila> = {
    columns: columnasDe(!soloLectura, textos.items),
    layout: { reorderable: false, resizable: false },
    emptyState: {
      type: 'empty',
      customComponent: (
        <PrimeraVez
          icono="glass-add"
          titulo="Todavía no le llega a nadie"
          descripcion={`Una asignación dice a quiénes les llega el plan y qué ${textos.items} ven. Puedes tener varias: por ejemplo, ventas con unos ${textos.items} y líderes con otros.`}
          accion={soloLectura ? undefined : { texto: 'Nueva asignación', icono: PlusSignIcon, onClick: nueva }}
        />
      ),
    },
  }

  return (
    <PageSection
      title="Quién ve qué en este plan"
      description="Cada asignación es un grupo de personas con sus contenidos."
      actions={
        soloLectura ? null : (
          <Button variant="outline" onClick={nueva}>
            <HugeiconsIcon icon={PlusSignIcon} aria-hidden="true" />
            Nueva asignación
          </Button>
        )
      }
    >
      {conErrores && filas.some((f) => f.falta) ? (
        <Text as="p" size="sm" variant="destructive" role="alert">
          Cada asignación necesita personas y {textos.items}. Completa o elimina las marcadas para guardar.
        </Text>
      ) : null}

      <AccionesAsignacion.Provider value={acciones}>
        {/* Como en la lista de planes, toda la fila abre su panel. */}
        <div onClick={soloLectura ? undefined : abrirAlTocarFila} className={soloLectura ? undefined : FILAS_CLICABLES}>
          <TablaDatos
            config={config}
            data={visibles}
            paginacion={{ pagina, setPagina, porPagina, setPorPagina, total: filas.length }}
            nombre="asignaciones"
            singular="asignación"
            id={`asignaciones-${plan.id}`}
            pieSoloSiHaceFalta
          />
        </div>
      </AccionesAsignacion.Provider>

      <div className="flex flex-col gap-1">
        <Text as="p" size="sm" variant="muted">
          Si alguien está en dos asignaciones, ve los contenidos de las dos.
        </Text>
        <Text as="p" size="sm" variant="muted">
          Quien entre después a un grupo recibe el plan solo.
        </Text>
        <Text as="p" size="sm" variant="muted">
          Para cambiar los contenidos de una sola persona,{' '}
          {/* Enlace en línea: sin la caja del botón (diferencias.json › button-enlace-en-linea). */}
          <Button variant="link" size="sm" className="h-auto! p-0!" onClick={() => onIrA('personas')}>
            ve a Personas
          </Button>
          .
        </Text>
      </div>

      {editando ? (
        <PanelAsignacion
          key={editando.vez}
          plan={plan}
          asignacion={editando.asignacion}
          nueva={editando.nueva}
          abierto={!cerrando}
          onCerrar={cerrar}
          onCambio={onCambio}
        />
      ) : null}
    </PageSection>
  )
}
