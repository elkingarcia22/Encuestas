import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { MoreHorizontalIcon, ChartIncreaseIcon, Copy01Icon, Edit02Icon, MoreVerticalIcon } from '@hugeicons/core-free-icons'
import {
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Text,
  type DataGridListConfig,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { TarjetaContenido } from '@/shared/components/TarjetaContenido'
import { SinResultados } from '@/shared/components/SinResultados'
import { CeldaTitulo } from '@/modules/design-system/data-grid/celda-titulo'
import { SIN_ARRASTRE } from '@/modules/design-system/data-grid/casos/sin-arrastre'
import { TablaDatos, type PaginacionTabla } from '@/modules/design-system/data-grid/tabla-datos'
import { MarcoCuadricula } from './controles-lista'
import { BADGE, duracion, fechaCorta, iconoTipo, type Fila } from './vista'
import { avisarFlujoPendiente } from '../../compartido/avisos'

type Props = {
  /** Solo las de esta página: el recorte ya viene hecho. */
  contenidos: Fila[]
  onAbrir: (contenido: Fila) => void
  onLimpiar: () => void
  /** Lo que se escribió en el buscador y los criterios de «Filtrar» puestos, para el vacío «sin resultados». */
  busqueda?: string
  filtrosActivos?: number
  onBuscar: (busqueda: string) => void
  paginacion: PaginacionTabla
}

/**
 * Las opciones de un contenido: editar y duplicar. El disparador lo pone cada vista, porque en la tabla cabe el botón
 * de los tres puntos horizontales y en la tarjeta el de los verticales, más chico.
 *
 * **Sin «Eliminar».** En LMS Creator un contenido no se borra: se archiva o se oculta, porque lo que la gente ya
 * avanzó cuelga de él (Dave, 15-oct).
 *
 * **«Editar» solo abre algo en un borrador.** Ahí el asistente de creación es el sitio correcto: está a medias y lo
 * que toca es terminarlo. En cualquier otro estado la edición todavía no existe en el playground y se dice, en vez
 * de abrir el asistente de creación con la ficha cargada, que es lo que venía confundiendo a todo el mundo.
 *
 * **«Ver resultados» abre el menú de todo lo que no es un borrador, y es lo primero.** Es lo que de verdad se viene
 * a hacer con un contenido que ya está publicado: mirar cómo le va. Un borrador no lo lleva porque todavía no le ha
 * pasado nada a nadie (Dave, 15-oct).
 */
function Acciones({ contenido, onAbrir, children }: { contenido: Fila; onAbrir: (c: Fila) => void; children: ReactNode }) {
  const borrador = contenido.visibilidad === 'Borrador'
  return (
    // El clic no debe abrir también la fila o la tarjeta que hay debajo.
    <div onClick={(event) => event.stopPropagation()}>
      <DropdownMenu>
        {children}
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuGroup>
            {borrador ? null : (
              <DropdownMenuItem onClick={() => onAbrir(contenido)}>
                <HugeiconsIcon icon={ChartIncreaseIcon} size={16} />
                Ver resultados
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => (borrador ? onAbrir(contenido) : avisarFlujoPendiente('edición'))}>
              <HugeiconsIcon icon={Edit02Icon} size={16} />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => avisarFlujoPendiente('duplicado')}>
              <HugeiconsIcon icon={Copy01Icon} size={16} />
              Duplicar
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// En la tabla, el botón terciario de solo icono con los tres puntos: el mismo de todas las listas del admin.
function AccionesFila({ contenido, onAbrir }: { contenido: Fila; onAbrir: (c: Fila) => void }) {
  return (
    <Acciones contenido={contenido} onAbrir={onAbrir}>
      <DropdownMenuTrigger render={<BotonIcono aria-label={`Acciones de ${contenido.titulo}`} />}>
        <HugeiconsIcon icon={MoreHorizontalIcon} aria-hidden="true" />
      </DropdownMenuTrigger>
    </Acciones>
  )
}

// En la tarjeta, el terciario de solo icono: tres puntos, discreto y pequeño.
function AccionesTarjeta({ contenido, onAbrir }: { contenido: Fila; onAbrir: (c: Fila) => void }) {
  return (
    <Acciones contenido={contenido} onAbrir={onAbrir}>
      <DropdownMenuTrigger render={<BotonIcono size="icon-xs" aria-label={`Opciones de ${contenido.titulo}`} />}>
        <HugeiconsIcon icon={MoreVerticalIcon} size={16} />
      </DropdownMenuTrigger>
    </Acciones>
  )
}

const texto = (valor: string) => (
  <Text as="span" size="sm">
    {valor}
  </Text>
)

// Columnas del listado: nombre (con su portada), tipo, creación, nivel, visibilidad y acciones. La tabla es `TablaDatos`
// (decisión 1b de Cristian, 9-oct: la lista de David se queda, pero su tabla es la del sistema). **Solo se ordena por
// Creación**, para poder ver primero los más viejos: ordenar por nombre, tipo o nivel no responde a ninguna pregunta que
// alguien se haga aquí; y **sin embudos por columna**, porque Filtrar ya reúne todos los criterios en una ventana, y
// repetirlos columna por columna era ofrecer dos veces lo mismo (Dave, 7-oct). Se arma desde una función para que las
// columnas se creen una sola vez: si cambiaran en cada pintada, la tabla perdería el orden y el ancho que se le dio.
function crearColumnas(abrir: (contenido: Fila) => void): DataGridListConfig<Fila>['columns'] {
  return [
    {
      accessorKey: 'titulo',
      header: 'Nombre del contenido',
      size: 340,
      enableSorting: false,
      cell: ({ row }) => (
        <CeldaTitulo
          titulo={row.original.titulo}
          detalle={duracion(row.original.minutos)}
          imagen={row.original.imagen}
          // Sin portada, el icono del tipo de contenido.
          sinImagen={<HugeiconsIcon icon={iconoTipo(row.original.tipo)} size={16} aria-hidden="true" />}
          // **En azul lo que lleva a algún lado**, que desde el 13-oct son todos: el borrador abre el asistente para
          // seguir creándolo y el resto abre Resultados. Es el mismo criterio de Vacantes (Dave, 6-oct).
          onClick={() => abrir(row.original)}
        />
      ),
    },
    { accessorKey: 'tipo', header: 'Tipo', size: 150, enableSorting: false, cell: ({ row }) => texto(row.original.tipo) },
    {
      accessorKey: 'creacion',
      header: 'Creación',
      size: 130,
      cell: ({ row }) => (
        <Text as="span" size="sm" className="tabular-nums">
          {fechaCorta(row.original.creacion)}
        </Text>
      ),
    },
    { accessorKey: 'nivel', header: 'Nivel', size: 120, enableSorting: false, cell: ({ row }) => texto(row.original.nivel) },
    {
      accessorKey: 'visibilidad',
      header: 'Visibilidad',
      size: 130,
      enableSorting: false,
      cell: ({ row }) => (
        <Badge variant={BADGE[row.original.visibilidad]} className="font-normal">
          {row.original.visibilidad}
        </Badge>
      ),
    },
    {
      id: 'acciones',
      header: 'Acciones',
      size: 96,
      enableSorting: false,
      enableResizing: false,
      ...SIN_ARRASTRE,
      cell: ({ row }) => <AccionesFila contenido={row.original} onAbrir={abrir} />,
    },
  ]
}

export function ListaView({
  contenidos,
  onAbrir,
  onLimpiar,
  busqueda,
  filtrosActivos,
  onBuscar,
  paginacion,
  onOrdenar,
  version,
}: Props & {
  /** Lo que pide el encabezado de la tabla: «campo», «-campo» o nada. */
  onOrdenar: (orden: string | undefined) => void
  /** Al limpiar, la tabla vuelve a empezar (también su buscador): se cambia y se vuelve a montar. */
  version: number
}) {
  // Las columnas se crean una vez y llaman siempre al `onAbrir` de la última pintada.
  const abrir = useRef(onAbrir)
  useEffect(() => {
    abrir.current = onAbrir
  })
  const columnas = useMemo(() => crearColumnas((contenido) => abrir.current(contenido)), [])

  const config: DataGridListConfig<Fila> = {
    columns: columnas,
    sort: { onSortChange: onOrdenar },
    search: { placeholder: 'Buscar contenidos', onSearch: onBuscar },
    // RN-03: sin resultados, el estado del design system con el término buscado y el botón para limpiar.
    emptyState: { type: 'no-results', customComponent: <SinResultados busqueda={busqueda} filtrosActivos={filtrosActivos} onLimpiar={onLimpiar} /> },
  }

  return <TablaDatos key={version} config={config} data={contenidos} paginacion={paginacion} nombre="contenidos" singular="contenido" id="contenidos" />
}

export function CuadriculaView({ contenidos, onAbrir, onLimpiar, busqueda, filtrosActivos, onBuscar, paginacion }: Props) {
  return (
    <MarcoCuadricula busqueda={busqueda ?? ''} onBuscar={onBuscar} marcador="Buscar contenidos" paginacion={paginacion} nombre="contenidos" singular="contenido" id="contenidos">
      {contenidos.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {contenidos.map((contenido) => (
            <TarjetaContenido
              key={contenido.id}
              titulo={contenido.titulo}
              imagen={contenido.imagen}
              tipo={contenido.tipo}
              visibilidad={contenido.visibilidad}
              origen={contenido.antiguoLms ? 'Antiguo LMS' : undefined}
              visibilidadColor={BADGE[contenido.visibilidad]}
              competencia={contenido.categoria}
              nivel={contenido.nivel}
              duracion={duracion(contenido.minutos)}
              idioma={contenido.idioma}
              acciones={<AccionesTarjeta contenido={contenido} onAbrir={onAbrir} />}
              onClick={() => onAbrir(contenido)}
            />
          ))}
        </div>
      ) : (
        // RN-03: sin resultados, el estado del design system, igual en las dos vistas.
        <SinResultados busqueda={busqueda} filtrosActivos={filtrosActivos} onLimpiar={onLimpiar} />
      )}
    </MarcoCuadricula>
  )
}
