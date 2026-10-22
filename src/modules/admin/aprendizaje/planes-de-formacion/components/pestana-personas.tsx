import { createContext, useContext, useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDataTransferHorizontalIcon, Delete02Icon, Edit02Icon, MoreHorizontalIcon, Undo02Icon, UserRemove01Icon } from '@hugeicons/core-free-icons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Field,
  FieldDescription,
  FieldLabel,
  Progress,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
  type DataGridListConfig,
} from '@ubits/flux-ui'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { Badge } from '@/shared/components/Badge'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { SinResultados } from '@/shared/components/SinResultados'
import { notify } from '@/shared/components/notify'
import { Persona } from '@/modules/design-system/data-grid/casos/seguimiento'
import { SIN_ARRASTRE } from '@/modules/design-system/data-grid/casos/sin-arrastre'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { DialogoConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { plural } from '@/modules/design-system/patrones/formato'
import { PanelCatalogo } from './panel-catalogo'
import {
  TIPOS,
  ajustarItems,
  itemsDe,
  marcadosEn,
  moverPersonas,
  nombreAsignacion,
  ordenarPor,
  personasDelPlan,
  quienesDe,
  quitarPersonas,
  type PersonaDelPlan,
  type Plan,
} from './planes-datos'

// «Personas»: el plan visto persona por persona, para los cambios de una o de unas pocas. Cada fila dice por qué
// asignación le llega, cuántos contenidos ve (con «Ajustada» si tiene los suyos) y, si el plan ya empezó, cuánto lleva.
// El «⋯» de la fila hace lo de UBITS en Editar plan («Gestionar contenidos», «Eliminar usuario del plan») y suma
// «Pasar a otra asignación»; con varias marcadas, pasar o quitar a todas juntas.

// `nueva`: entró con los cambios que todavía no se guardan (aún no tiene avance que mostrar).
type Fila = PersonaDelPlan & { asignacionTexto: string; asignacionDetalle: string; ajuste: 'Ajustada' | 'De su asignación'; nueva: boolean }
type Filtro = { id: string; value: unknown }

type Acciones = {
  soloLectura: boolean
  conAvance: boolean
  item: string
  items: string
  onAjustar: (fila: Fila) => void
  onRestablecer: (fila: Fila) => void
  onMover: (filas: Fila[]) => void
  onQuitar: (filas: Fila[]) => void
}
const AccionesPersona = createContext<Acciones | null>(null)

function MenuPersona({ fila }: { fila: Fila }) {
  const acciones = useContext(AccionesPersona)
  if (!acciones || acciones.soloLectura) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<BotonIcono aria-label={`Acciones de ${fila.nombre}`} />}>
        <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => acciones.onAjustar(fila)}>
            <HugeiconsIcon icon={Edit02Icon} aria-hidden="true" />
            Ajustar sus {acciones.items}
          </DropdownMenuItem>
          {fila.ajustada ? (
            <DropdownMenuItem onClick={() => acciones.onRestablecer(fila)}>
              <HugeiconsIcon icon={Undo02Icon} aria-hidden="true" />
              Volver a los de su asignación
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem onClick={() => acciones.onMover([fila])}>
            <HugeiconsIcon icon={ArrowDataTransferHorizontalIcon} aria-hidden="true" />
            Pasar a otra asignación
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => acciones.onQuitar([fila])}>
          <HugeiconsIcon icon={UserRemove01Icon} aria-hidden="true" />
          Quitar del plan
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function CeldaItems({ fila }: { fila: Fila }) {
  const acciones = useContext(AccionesPersona)
  return (
    <span className="flex items-center gap-2">
      <Text as="span" size="sm" className="tabular-nums">
        {fila.total} {plural(fila.total, acciones?.item ?? 'contenido', acciones?.items ?? 'contenidos')}
      </Text>
      {fila.ajustada ? (
        <Badge variant="info-light" size="sm">
          Ajustada
        </Badge>
      ) : null}
    </span>
  )
}

function CeldaAvance({ fila }: { fila: Fila }) {
  const acciones = useContext(AccionesPersona)
  if (fila.nueva) {
    return (
      <Badge variant="secondary" size="sm">
        Nueva · sin guardar
      </Badge>
    )
  }
  if (!acciones?.conAvance) {
    return (
      <Text as="span" size="sm" variant="muted">
        Aún no empieza
      </Text>
    )
  }
  return (
    <span className="flex w-full items-center gap-3">
      <Progress value={fila.progreso} className="flex-1" aria-label={`${fila.progreso} %`} />
      <Text as="span" size="sm" className="w-12 shrink-0 text-right tabular-nums">
        {fila.hechos} de {fila.total}
      </Text>
    </span>
  )
}

const COLUMNAS: DataGridListConfig<Fila>['columns'] = [
  { accessorKey: 'nombre', header: 'Persona', size: 260, ...SIN_ARRASTRE, cell: ({ row }) => <Persona nombre={row.original.nombre} detalle={row.original.area} /> },
  {
    accessorKey: 'asignacionTexto',
    header: 'Le llega por',
    size: 240,
    ...SIN_ARRASTRE,
    // Cuál asignación y, debajo en gris, qué la define: la fila que nombra algo, como las del resto de tablas.
    cell: ({ row }) => (
      <span className="flex min-w-0 flex-col">
        <Text as="span" size="sm" className="truncate">
          {row.original.asignacionTexto}
        </Text>
        <Text as="span" size="xs" variant="muted" className="truncate" title={row.original.asignacionDetalle}>
          {row.original.asignacionDetalle}
        </Text>
      </span>
    ),
  },
  { accessorKey: 'total', header: 'Ve', size: 190, ...SIN_ARRASTRE, cell: ({ row }) => <CeldaItems fila={row.original} /> },
  { accessorKey: 'progreso', header: 'Avance', size: 180, ...SIN_ARRASTRE, cell: ({ row }) => <CeldaAvance fila={row.original} /> },
  { id: 'acciones', header: 'Acciones', size: 96, enableSorting: false, enableResizing: false, ...SIN_ARRASTRE, cell: ({ row }) => <MenuPersona fila={row.original} /> },
]

export function PestanaPersonas({
  plan,
  guardado,
  onCambio,
  soloLectura = false,
}: {
  plan: Plan
  // El plan como está guardado: quien no está ahí entró con los cambios de ahora.
  guardado?: Plan
  onCambio: (plan: Plan) => void
  soloLectura?: boolean
}) {
  const textos = TIPOS[plan.tipo]
  const conAvance = plan.estado === 'Vigente' || plan.estado === 'No vigente'

  const filas = useMemo<Fila[]>(() => {
    const yaEstaban = guardado ? new Set(personasDelPlan(guardado).map((p) => p.usuario)) : null
    const numero = new Map(plan.asignaciones.map((a, i) => [a.id, i + 1]))
    return personasDelPlan(plan).map((p) => {
      const suyas = p.asignaciones.flatMap((id) => plan.asignaciones.filter((a) => a.id === id))
      return {
        ...p,
        // La asignación por su nombre, si lo tiene; si no, por su número. Debajo, a quiénes les llega.
        asignacionTexto: suyas.length ? suyas.map((a) => a.nombre?.trim() || `Asignación ${numero.get(a.id)}`).join(' y ') : 'Sin asignación',
        asignacionDetalle: suyas.map(quienesDe).join(' · '),
        ajuste: p.ajustada ? 'Ajustada' : 'De su asignación',
        nueva: yaEstaban !== null && !yaEstaban.has(p.usuario),
      }
    })
  }, [plan, guardado])

  const [busqueda, setBusqueda] = useState('')
  const [filtros, setFiltros] = useState<Filtro[]>([])
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [version, setVersion] = useState(0)

  const [ajustando, setAjustando] = useState<{ fila: Fila; vez: number } | null>(null)
  const [moviendo, setMoviendo] = useState<{ filas: Fila[]; destino: string } | null>(null)
  const [quitando, setQuitando] = useState<Fila[]>([])

  const resultado = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const asignaciones = marcadosEn(filtros, 'asignacionTexto')
    const ajustes = marcadosEn(filtros, 'ajuste')
    return ordenarPor(
      filas.filter(
        (f) =>
          (!asignaciones.length || f.asignaciones.some((id) => asignaciones.includes(id))) &&
          (!ajustes.length || ajustes.includes(f.ajuste)) &&
          (!q || `${f.nombre} ${f.area}`.toLowerCase().includes(q)),
      ),
      orden,
    )
  }, [filas, busqueda, filtros, orden])
  const visibles = resultado.slice((pagina - 1) * porPagina, pagina * porPagina)
  const filtrando = Boolean(busqueda.trim()) || filtros.some((f) => Array.isArray(f.value) && f.value.length > 0)

  const nombres = (lista: Fila[]) => (lista.length === 1 ? lista[0].nombre : `${lista.length.toLocaleString('es-CO')} personas`)

  const config: DataGridListConfig<Fila> = {
    columns: COLUMNAS,
    columnFilters: [
      { id: 'asignacionTexto', label: 'Asignación', type: 'select', multiple: true, options: plan.asignaciones.map((a, i) => ({ label: `${i + 1}. ${nombreAsignacion(a)}`, value: a.id })) },
      { id: 'ajuste', label: 'Contenidos', type: 'select', multiple: true, options: ['Ajustada', 'De su asignación'].map((v) => ({ label: v, value: v })) },
    ],
    onColumnFiltersChange: (nuevos) => {
      setFiltros(nuevos)
      setPagina(1)
    },
    sort: { onSortChange: setOrden },
    search: {
      placeholder: 'Buscar persona o área',
      onSearch: (q) => {
        setBusqueda(q)
        setPagina(1)
      },
    },
    ...(soloLectura
      ? {}
      : {
          selection: { onSelectionChange: () => undefined },
          actions: {
            bulk: [
              {
                id: 'mover',
                label: 'Pasar a otra asignación',
                icon: <HugeiconsIcon icon={ArrowDataTransferHorizontalIcon} aria-hidden="true" />,
                onClick: (elegidas: Fila[]) => setMoviendo({ filas: elegidas, destino: '' }),
              },
              {
                id: 'quitar',
                label: 'Quitar del plan',
                variant: 'destructive' as const,
                icon: <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />,
                onClick: (elegidas: Fila[]) => setQuitando(elegidas),
              },
            ],
          },
        }),
    emptyState: filtrando
      ? {
          type: 'no-results',
          customComponent: (
            <SinResultados
              busqueda={busqueda}
              filtrosActivos={filtros.filter((f) => Array.isArray(f.value) && f.value.length > 0).length}
              onLimpiar={() => {
                setBusqueda('')
                setFiltros([])
                setVersion((v) => v + 1)
              }}
            />
          ),
        }
      : { type: 'empty', title: 'Todavía no le llega a nadie', description: 'Agrega personas o grupos en «Quién ve qué».' },
    frame: { title: 'Personas', toolbar: 'header' },
    labels: { resultCount: (_visibles, total) => `${total.toLocaleString('es-CO')} ${plural(total, 'persona', 'personas')}` },
  }

  // Las asignaciones a las que se puede pasar: todas menos aquella de la que vienen (si vienen todas de la misma).
  const origenes = new Set(moviendo?.filas.flatMap((f) => f.asignaciones) ?? [])
  const destinos = plan.asignaciones.filter((a) => !(origenes.size === 1 && origenes.has(a.id)))

  return (
    <AccionesPersona.Provider
      value={{
        soloLectura,
        conAvance,
        item: textos.item,
        items: textos.items,
        onAjustar: (fila) => setAjustando({ fila, vez: Date.now() }),
        onRestablecer: (fila) => {
          onCambio(ajustarItems(plan, fila.usuario, null))
          notify(`${fila.nombre} vuelve a ver los de su asignación`, 'Se aplica al guardar.', 'info')
        },
        onMover: (lista) => setMoviendo({ filas: lista, destino: '' }),
        onQuitar: setQuitando,
      }}
    >
      <TablaDatos key={version} config={config} data={visibles} paginacion={{ pagina, setPagina, porPagina, setPorPagina, total: resultado.length }} nombre="personas" singular="persona" id="personas-del-plan" />

      {/* «Ajustar sus contenidos»: el «Gestionar contenidos» de UBITS. Solo para esta persona; su asignación no cambia. */}
      {ajustando ? (
        <PanelCatalogo
          key={ajustando.vez}
          abierto
          onAbiertoChange={(abierto) => (abierto ? undefined : setAjustando(null))}
          tipo={plan.tipo}
          para={`Solo para ${ajustando.fila.nombre}. Las demás personas de su asignación no cambian.`}
          elegidos={itemsDe(plan, ajustando.fila.usuario)}
          onGuardar={(items) => {
            onCambio(ajustarItems(plan, ajustando.fila.usuario, items))
            const cuantos = `${items.length} ${plural(items.length, textos.item, textos.items)}`
            notify(`${ajustando.fila.nombre} tiene sus propios ${textos.items}`, `${cuantos}. Se aplica al guardar.`, 'info')
            setAjustando(null)
          }}
        />
      ) : null}

      {/* Pasar a otra asignación: una ventana con contenido (ActionDialog), porque hay que elegir a cuál. */}
      <ActionDialog
        open={moviendo !== null}
        onOpenChange={(abierto) => (abierto ? undefined : setMoviendo(null))}
        title="Pasar a otra asignación"
        sub={`Ven los ${textos.items} de la asignación que elijas. Lo que ya avanzaron se conserva.`}
        lead={moviendo ? <Text as="p" size="sm" weight="semibold">{nombres(moviendo.filas)}</Text> : undefined}
        confirmLabel="Pasar"
        confirmDisabled={!moviendo?.destino}
        onConfirm={() => {
          if (!moviendo?.destino) return
          onCambio(moverPersonas(plan, moviendo.filas.map((f) => f.usuario), moviendo.destino))
          const destino = plan.asignaciones.find((a) => a.id === moviendo.destino)
          const uno = moviendo.filas.length === 1
          const titulo = `${nombres(moviendo.filas)} ${uno ? 'pasa' : 'pasan'} a otra asignación`
          const detalle = `Ahora ${uno ? 've' : 'ven'} lo de «${destino ? nombreAsignacion(destino) : ''}». Se aplica al guardar.`
          notify(titulo, detalle, 'info')
        }}
      >
        <Field>
          <FieldLabel htmlFor="mover-a">Asignación</FieldLabel>
          <Select value={moviendo?.destino || null} onValueChange={(valor) => moviendo && setMoviendo({ ...moviendo, destino: String(valor ?? '') })}>
            <SelectTrigger id="mover-a" className="w-full">
              <SelectValue placeholder="Elige la asignación">
                {(valor: string) => {
                  const a = plan.asignaciones.find((x) => x.id === valor)
                  return a ? `${plan.asignaciones.indexOf(a) + 1}. ${nombreAsignacion(a)}` : 'Elige la asignación'
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {destinos.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {plan.asignaciones.indexOf(a) + 1}. {nombreAsignacion(a)} · {a.items.length} {plural(a.items.length, textos.item, textos.items)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldDescription>Si tenían {textos.items} ajustados, pasan a ver los de la nueva asignación.</FieldDescription>
        </Field>
      </ActionDialog>

      <DialogoConfirmar
        abierto={quitando.length > 0}
        onAbiertoChange={(abierto) => (abierto ? undefined : setQuitando([]))}
        size="sm"
        icono={UserRemove01Icon}
        titulo={quitando.length === 1 ? '¿Quitar a esta persona del plan?' : '¿Quitar a estas personas del plan?'}
        descripcion={`${nombres(quitando)} ${quitando.length === 1 ? 'deja' : 'dejan'} de ver el plan en su Zona de estudio. Lo que ya ${quitando.length === 1 ? 'avanzó' : 'avanzaron'} se conserva. Se aplica al guardar.`}
        accion="Quitar del plan"
        destructiva
        onConfirmar={() => {
          onCambio(quitarPersonas(plan, quitando.map((f) => f.usuario)))
          setQuitando([])
        }}
      />
    </AccionesPersona.Provider>
  )
}
