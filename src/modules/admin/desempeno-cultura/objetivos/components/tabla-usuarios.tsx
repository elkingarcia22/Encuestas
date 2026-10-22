import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { PlusSignIcon } from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  Button,
  Text,
  TooltipProvider,
  type DataGridListConfig,
} from '@ubits/flux-ui'
import { iniciales } from '@/modules/design-system/patrones/formato'
import { SIN_ARRASTRE } from '@/modules/design-system/data-grid/casos/sin-arrastre'
import { TablaDatos } from '@/modules/design-system/data-grid/tabla-datos'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import { TextoCompleto } from '@/shared/components/TextoCompleto'
import { Hint } from '@/shared/components/Hint'
import type { UsuarioSinObjetivos } from '../modelo/usuarios'

// «Usuarios sin objetivos»: las personas a las que falta asignarles algo. Mismo armado que la lista de ciclos (y que la
// de Encuestas): la tabla del sistema (TablaDatos) con el paginador en español. La persona va en una sola celda, con su
// avatar y su correo debajo, en vez de repetir el correo como usuario y como columna aparte. Sin cambio de ancho de
// columna (`resizable: false`), las columnas se reparten el ancho del marco, sea de 1.140 o de 1.104 con la barra abierta;
// con él, la tabla medía la suma de sus anchos y la columna de acciones quedaba cortada.
// Cada fila tiene una sola acción, «Crear objetivo», como botón al final de la fila y no escondida en un menú. Hoy va
// apagada con un globo que dice por qué: crear un objetivo suelto para una persona todavía no existe, y un botón que solo
// avisa «próximamente» finge (regla «nada-que-finja», 13-oct). Por eso tampoco hay selección ni acción en bloque.

const SIN_CREAR_SUELTO = 'Por ahora los objetivos se crean dentro de un ciclo: agrega a esta persona desde Participantes del ciclo.'

export function TablaUsuarios({ usuarios }: { usuarios: readonly UsuarioSinObjetivos[] }) {
  const [busqueda, setBusqueda] = useState('')
  const [areas, setAreas] = useState<string[]>([])
  const [actual, setActual] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  // Cambia para montar la tabla de nuevo vacía (buscador y filtros) al limpiar desde «Sin resultados».
  const [versionTabla, setVersionTabla] = useState(0)

  const opcionesArea = useMemo(() => [...new Set(usuarios.map((usuario) => usuario.area))].sort((a, b) => a.localeCompare(b, 'es')), [usuarios])
  const resultado = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return usuarios.filter((usuario) => (areas.length === 0 || areas.includes(usuario.area)) && (!q || `${usuario.nombre} ${usuario.correo} ${usuario.cargo} ${usuario.area}`.toLowerCase().includes(q)))
  }, [usuarios, busqueda, areas])
  const paginaActual = useMemo(() => resultado.slice((actual - 1) * porPagina, actual * porPagina), [resultado, actual, porPagina])

  const limpiar = () => {
    setBusqueda('')
    setAreas([])
    setActual(1)
    setVersionTabla((version) => version + 1)
  }

  const config: DataGridListConfig<UsuarioSinObjetivos> = {
    // El marco, el título y el recuento («24 personas») los pone TablaDatos (con título, como en Encuestas: 20-oct).
    columns: [
      {
        accessorKey: 'nombre',
        header: 'Persona',
        size: 330,
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-3">
            <Avatar size="sm">
              <AvatarFallback>{iniciales(row.original.nombre)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <TextoCompleto texto={row.original.nombre}>
                <Text as="span" size="sm" weight="medium" className="truncate">
                  {row.original.nombre}
                </Text>
              </TextoCompleto>
              <TextoCompleto texto={row.original.correo}>
                <Text as="span" size="xs" variant="muted" className="truncate">
                  {row.original.correo}
                </Text>
              </TextoCompleto>
            </div>
          </div>
        ),
      },
      { accessorKey: 'cargo', header: 'Cargo', size: 220, cell: ({ row }) => <Text as="span" size="sm">{row.original.cargo}</Text> },
      { accessorKey: 'area', header: 'Área', size: 170, cell: ({ row }) => <Text as="span" size="sm" variant="muted">{row.original.area}</Text> },
      {
        accessorKey: 'lider',
        header: 'Líder',
        size: 200,
        cell: ({ row }) => (
          <Text as="span" size="sm" variant={row.original.lider ? 'default' : 'muted'}>
            {row.original.lider ?? 'Sin líder'}
          </Text>
        ),
      },
      {
        id: 'acciones',
        header: 'Acciones',
        size: 166,
        enableSorting: false,
        enableResizing: false,
        ...SIN_ARRASTRE,
        cell: ({ row }) => (
          <div className="flex justify-end">
            {/* Un botón apagado no recibe el cursor: el globo va en un envoltorio que sí lo recibe (y el foco del teclado). */}
            <Hint label={SIN_CREAR_SUELTO} side="left">
              <span tabIndex={0} className="inline-flex">
                <Button variant="outline" size="sm" disabled aria-label={`Crear objetivo para ${row.original.nombre}`}>
                  <HugeiconsIcon icon={PlusSignIcon} aria-hidden="true" />
                  Crear objetivo
                </Button>
              </span>
            </Hint>
          </div>
        ),
      },
    ],
    columnFilters: [{ id: 'area', label: 'Área', type: 'select', options: opcionesArea.map((valor) => ({ label: valor, value: valor })), multiple: true }],
    onColumnFiltersChange: (nuevos) => {
      setAreas((nuevos.find((filtro) => filtro.id === 'area')?.value as string[] | undefined) ?? [])
      setActual(1)
    },
    search: {
      placeholder: 'Buscar por nombre o cargo',
      onSearch: (query) => {
        setBusqueda(query)
        setActual(1)
      },
    },
    labels: { dragToReorder: 'Arrastrar para reordenar la columna' },
    emptyState:
      busqueda.trim() || areas.length > 0
        ? { type: 'no-results', customComponent: <SinResultados busqueda={busqueda} filtrosActivos={areas.length > 0 ? 1 : 0} onLimpiar={limpiar} /> }
        : { type: 'empty', customComponent: <PrimeraVez icono="glass-tick" titulo="Todos tienen objetivos" descripcion="Cada persona activa está en al menos un ciclo en curso." /> },
    layout: { reorderable: true, resizable: false },
  }

  return (
    <TooltipProvider delay={200}>
      <TablaDatos
        key={versionTabla}
        config={config}
        data={paginaActual}
        paginacion={{ pagina: actual, setPagina: setActual, porPagina, setPorPagina, total: resultado.length }}
        titulo="Usuarios sin objetivos"
        nombre="personas"
        singular="persona"
        id="usuarios-sin-objetivos"
      />
    </TooltipProvider>
  )
}
