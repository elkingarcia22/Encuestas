import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDataTransferHorizontalIcon, BookOpen01Icon, Delete02Icon, Target02Icon, UserAdd01Icon } from '@hugeicons/core-free-icons'
import {
  Button,
  IconTile,
  Item,
  ItemContent,
  ItemGroup,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Progress,
  Text,
  type DataGridListConfig,
} from '@ubits/flux-ui'
import { Persona } from '@/modules/design-system/data-grid/casos/seguimiento'
import { SIN_ARRASTRE } from '@/modules/design-system/data-grid/casos/sin-arrastre'
import { SinResultados } from '@/shared/components/SinResultados'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { plural } from '@/modules/design-system/patrones/formato'
import { contenidoDe, duracionTexto } from './catalogo'
import { TIPOS, itemsDelPlan, ordenarPor, type ItemDelPlan, type Plan, type TipoPlan } from './planes-datos'

// El tab «Contenidos» / «Competencias» del plan (HU-LMS-021 y HU-LMS-015): cada ítem distinto del plan con quiénes lo
// tienen. En Editar plan trae las acciones masivas por fila (Agregar usuario, Reemplazar, Eliminar); en el detalle es
// de solo lectura (RN-12) y suma cuántos lo terminaron.
//
// «Personas asignadas» en UBITS es un ProfileList (avatares apilados con «+N»). Aquí no hay fotos, y con iniciales el
// apilado tapa la segunda letra (regla del catálogo): va el número de personas, y al tocarlo, la lista con nombres.

type Fila = ItemDelPlan & { cuantas: number; avance: number }

function PersonasAsignadas({ fila }: { fila: Fila }) {
  if (!fila.cuantas) {
    return (
      <Text as="span" variant="muted" size="sm">
        Nadie todavía
      </Text>
    )
  }
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" size="sm" className="tabular-nums" />}>
        {fila.cuantas.toLocaleString('es-CO')} {plural(fila.cuantas, 'persona', 'personas')}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-2">
        <ItemGroup className="max-h-72 gap-0.5 overflow-y-auto">
          {fila.personas.map((persona) => (
            <Item key={persona.id} size="xs">
              {/* La fila de persona del sistema (decisión 21 de la auditoría, 5-oct). */}
              <ItemContent className="min-w-0">
                <Persona nombre={persona.nombre} detalle={persona.area} />
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
      </PopoverContent>
    </Popover>
  )
}

const columnas = (tipo: TipoPlan, horas: number | undefined, conAvance: boolean): DataGridListConfig<Fila>['columns'] => [
  {
    accessorKey: 'titulo',
    header: TIPOS[tipo].item.charAt(0).toUpperCase() + TIPOS[tipo].item.slice(1),
    size: conAvance ? 420 : 560,
    ...SIN_ARRASTRE,
    cell: ({ row }) => {
      const contenido = contenidoDe(row.original.titulo)
      return (
        <div className="flex min-w-0 items-center gap-3">
          <IconTile variant="soft" size="sm">
            <HugeiconsIcon icon={tipo === 'competencias' ? Target02Icon : BookOpen01Icon} aria-hidden="true" />
          </IconTile>
          <div className="flex min-w-0 flex-col gap-1">
            <Text as="span" size="sm" weight="medium" className="truncate">
              {row.original.titulo}
            </Text>
            <Text as="span" variant="muted" size="xs" className="truncate">
              {contenido ? `${contenido.tipo} · ${duracionTexto(contenido.minutos)}` : horas ? `Competencia · ${horas} h de estudio` : 'Competencia'}
            </Text>
          </div>
        </div>
      )
    },
  },
  { accessorKey: 'cuantas', header: 'Personas asignadas', size: 200, ...SIN_ARRASTRE, cell: ({ row }) => <PersonasAsignadas fila={row.original} /> },
  ...(conAvance
    ? [
        {
          accessorKey: 'avance',
          header: 'Lo terminaron',
          size: 240,
          ...SIN_ARRASTRE,
          cell: ({ row }: { row: { original: Fila } }) => (
            <span className="flex w-full items-center gap-3">
              <Progress value={row.original.avance} className="flex-1" aria-label={`${row.original.avance} % lo terminó`} />
              <Text as="span" size="sm" className="w-20 shrink-0 text-right tabular-nums">
                {row.original.terminaron} de {row.original.cuantas}
              </Text>
            </span>
          ),
        } satisfies DataGridListConfig<Fila>['columns'][number],
      ]
    : []),
]

// Una tabla por combinación (tipo, avance): las columnas se arman una vez y no en cada render (trampa de DataGridList).
const COLUMNAS = new Map<string, DataGridListConfig<Fila>['columns']>()
const columnasDe = (tipo: TipoPlan, horas: number | undefined, conAvance: boolean) => {
  const clave = `${tipo}-${horas ?? 0}-${conAvance}`
  if (!COLUMNAS.has(clave)) COLUMNAS.set(clave, columnas(tipo, horas, conAvance))
  return COLUMNAS.get(clave)!
}

export function TablaItems({
  plan,
  conAvance = false,
  acciones,
}: {
  plan: Plan
  // En el detalle: cuántos terminaron cada ítem.
  conAvance?: boolean
  // Solo en Editar plan. Sin acciones, la tabla es de solo lectura (RN-12).
  acciones?: {
    deshabilitadas?: boolean
    onAgregarUsuario: (titulo: string) => void
    onReemplazar: (titulo: string) => void
    onEliminar: (titulo: string) => void
  }
}) {
  const textos = TIPOS[plan.tipo]
  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState<string | undefined>(undefined)
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  const [version, setVersion] = useState(0)

  const filas = useMemo<Fila[]>(
    () =>
      itemsDelPlan(plan).map((item) => ({
        ...item,
        cuantas: item.personas.length,
        avance: item.personas.length ? Math.round((item.terminaron / item.personas.length) * 100) : 0,
      })),
    [plan],
  )
  const q = busqueda.trim().toLowerCase()
  const resultado = ordenarPor(
    filas.filter((f) => !q || f.titulo.toLowerCase().includes(q)),
    orden,
  )
  const visibles = resultado.slice((pagina - 1) * porPagina, pagina * porPagina)
  const icono = (i: typeof UserAdd01Icon) => <HugeiconsIcon icon={i} aria-hidden="true" />

  const config: DataGridListConfig<Fila> = {
    columns: columnasDe(plan.tipo, plan.horas, conAvance),
    sort: { onSortChange: setOrden },
    search: {
      placeholder: `Buscar ${textos.item}`,
      onSearch: (texto) => {
        setBusqueda(texto)
        setPagina(1)
      },
    },
    ...(acciones
      ? {
          actions: {
            item: [
              { id: 'agregar', label: 'Agregar usuario', icon: icono(UserAdd01Icon), disabled: acciones.deshabilitadas, onClick: (f: Fila[]) => f[0] && acciones.onAgregarUsuario(f[0].titulo) },
              { id: 'reemplazar', label: 'Reemplazar', icon: icono(ArrowDataTransferHorizontalIcon), disabled: acciones.deshabilitadas, onClick: (f: Fila[]) => f[0] && acciones.onReemplazar(f[0].titulo) },
              { id: 'eliminar', label: 'Eliminar', variant: 'destructive' as const, icon: icono(Delete02Icon), disabled: acciones.deshabilitadas, onClick: (f: Fila[]) => f[0] && acciones.onEliminar(f[0].titulo) },
            ],
          },
        }
      : {}),
    emptyState: q
      ? {
          type: 'no-results',
          customComponent: (
            <SinResultados
              busqueda={busqueda}
              onLimpiar={() => {
                setBusqueda('')
                setVersion((v) => v + 1)
              }}
            />
          ),
        }
      : { type: 'empty', title: `Sin ${textos.items} todavía`, description: `Agrega una asignación para sumar ${textos.items} al plan.` },
    // RN-01b: título y conteo legible («N contenidos»), no «N/N».
    frame: { title: textos.items.charAt(0).toUpperCase() + textos.items.slice(1), toolbar: 'header' },
    labels: { resultCount: (_visibles, total) => `${total} ${plural(total, textos.item, textos.items)}` },
  }

  return <TablaDatos key={version} config={config} data={visibles} paginacion={{ pagina, setPagina, porPagina, setPorPagina, total: resultado.length }} nombre={textos.items} id={`items-${plan.id}`} />
}
