import { type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  ArrowUpDownIcon,
  Cancel01Icon,
  FilterIcon,
  PinIcon,
  Search01Icon,
  SlidersHorizontalIcon,
} from '@hugeicons/core-free-icons'
import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  cn,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'

// Listado de producto: el patrón de la tabla de Selección › Vacantes, para que todas las listas del admin se vean y se
// usen igual. De arriba abajo: título con el conteo, buscador y configuración de columnas a la derecha, la tabla con
// orden y filtro en cada encabezado, y el paginador en español.
//
// Se arma con Table y no con DataGridList porque este trae su propio «Personalizar columnas», que no se puede quitar
// ni ampliar: quedarían dos botones de configuración haciendo lo mismo.

// ── Marco: el envolvente gris con el encabezado ──────────────────────────────────────────────────────────────────

export type ColumnaConfigurable = { id: string; etiqueta: string }

/**
 * Lo que iguala esta tabla con `TablaDatos` (la del `DataGridList` de la librería, que usan Cristian y Nicolás).
 * Medido con las dos abiertas: la suya tiene la fila en 53 px y la nuestra en 57, porque su celda va a `6px 8px` y
 * la nuestra a `8px`; y ella no pinta raya entre filas y nosotros sí. Mismo tipo, mismo color, misma estructura: lo
 * único que delataba cuál era cuál eran esos cuatro píxeles y la raya (Dave, 2-oct).
 */
const DENSIDAD = '[&_tbody_td]:py-1.5! [&_tbody_tr]:border-0!'

type MarcoProps = {
  titulo: ReactNode
  /** Bajo el título: «12 de 48 contenidos». */
  conteo?: ReactNode
  busqueda: string
  onBuscar: (valor: string) => void
  marcadorBusqueda: string
  etiquetaBusqueda: string
  /** Sin columnas configurables no se pinta el botón de configuración. */
  columnas?: ColumnaConfigurable[]
  visibles?: Record<string, boolean>
  onVisibles?: (visibles: Record<string, boolean>) => void
  fijas?: Record<string, boolean>
  onFijas?: (fijas: Record<string, boolean>) => void
  /** Antes del buscador: filtros propios de la pantalla, botón de crear, cambio de vista. */
  acciones?: ReactNode
  /** El paginador: va en el pie del marco, fuera de la superficie de la tabla. */
  pie?: ReactNode
  /**
   * El panel va sin relleno porque las celdas de la tabla ya traen el suyo. Con `relleno` recupera el del tema, para
   * lo que no lo trae: una cuadrícula de tarjetas, por ejemplo, que si no queda pegada al filo.
   */
  relleno?: boolean
  children: ReactNode
}

export function MarcoTabla({
  titulo,
  conteo,
  busqueda,
  onBuscar,
  marcadorBusqueda,
  etiquetaBusqueda,
  columnas,
  visibles,
  onVisibles,
  fijas,
  onFijas,
  acciones,
  pie,
  relleno = false,
  children,
}: MarcoProps) {
  const configurable = columnas && columnas.length > 0 && visibles && onVisibles

  return (
    // `--frame-gap:0px`: el mismo armado de DataGridList, sin aire entre el panel y el pie.
    <Frame spacing="sm" className="[--frame-gap:0px]">
      <FrameHeader className="flex-row! flex-wrap! items-center! justify-between! gap-3! [--frame-panel-header-gap:--spacing(1)]">
        <div>
          <FrameTitle>{titulo}</FrameTitle>
          {conteo ? <FrameDescription>{conteo}</FrameDescription> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {acciones}
          {/* `bg-background`: el InputGroup de la librería es transparente, así que sobre la cabecera gris de la
              tabla el buscador se perdía. El fondo blanco se copia del listado de Encuestas; el alto, el ancho y la
              X de limpiar son los nuestros. */}
          <InputGroup className="h-8! w-56 bg-background">
            <InputGroupAddon>
              <HugeiconsIcon icon={Search01Icon} aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              className="h-8! text-sm!"
              value={busqueda}
              onChange={(evento) => onBuscar(evento.target.value)}
              placeholder={marcadorBusqueda}
              aria-label={etiquetaBusqueda}
            />
            {/* La X para vaciar el buscador, como ya la usa Selección: solo aparece cuando hay algo escrito. */}
            {busqueda ? (
              <InputGroupAddon align="inline-end">
                <InputGroupButton size="icon-xs" aria-label="Borrar la búsqueda" onClick={() => onBuscar('')}>
                  <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" />
                </InputGroupButton>
              </InputGroupAddon>
            ) : null}
          </InputGroup>

          {configurable ? (
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" size="icon-sm" aria-label="Configurar columnas" />}>
                <HugeiconsIcon icon={SlidersHorizontalIcon} aria-hidden="true" />
              </DropdownMenuTrigger>
              {/* Ancho según lo que lleva dentro: la casilla de la columna más el botón de fijar. */}
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Columnas</DropdownMenuLabel>
                  {columnas.map((columna) => {
                    const fija = fijas?.[columna.id] === true
                    return (
                      <div key={columna.id} className="flex items-center gap-1">
                        <DropdownMenuCheckboxItem
                          className="flex-1"
                          checked={visibles[columna.id]}
                          onCheckedChange={(activo) => onVisibles({ ...visibles, [columna.id]: activo })}
                        >
                          {columna.etiqueta}
                        </DropdownMenuCheckboxItem>
                        {onFijas ? (
                          <BotonIcono
                            size="icon-xs"
                            aria-label={fija ? `Soltar la columna ${columna.etiqueta}` : `Fijar la columna ${columna.etiqueta}`}
                            aria-pressed={fija}
                            title={fija ? 'Soltar columna' : 'Fijar columna'}
                            disabled={!visibles[columna.id]}
                            className={fija ? 'text-primary' : 'text-muted-foreground'}
                            onClick={() => onFijas({ ...fijas, [columna.id]: !fija })}
                          >
                            <HugeiconsIcon icon={PinIcon} aria-hidden="true" />
                          </BotonIcono>
                        ) : null}
                      </div>
                    )
                  })}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </FrameHeader>
      {/* La tabla va dentro del panel: es lo que le da la superficie blanca con borde.
          Las dos clases de `DENSIDAD` la igualan a `TablaDatos`, la otra tabla del playground: la misma altura de fila
          y sin raya entre ellas. Hasta que el equipo decida con cuál se queda, al menos que no se note cuál es cuál
          (Dave, 2-oct). */}
      <FramePanel className={cn(relleno ? undefined : 'p-0!', DENSIDAD)}>{children}</FramePanel>
      {pie ? <FrameFooter>{pie}</FrameFooter> : null}
    </Frame>
  )
}

// ── Encabezados: ordenar y filtrar desde la propia columna ───────────────────────────────────────────────────────

/** El orden se guarda como `campo` (ascendente) o `-campo` (descendente). */
export function EncabezadoOrdenable({
  etiqueta,
  campo,
  ordenActual,
  onOrdenar,
}: {
  etiqueta: string
  campo: string
  ordenActual?: string
  onOrdenar: (campo: string) => void
}) {
  const activo = ordenActual === campo || ordenActual === `-${campo}`
  const descendente = ordenActual === `-${campo}`

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onOrdenar(campo)}
      className={cn('-ms-2 h-8 gap-1.5 px-2 font-medium', !activo && 'text-muted-foreground')}
    >
      {etiqueta}
      <HugeiconsIcon
        icon={activo ? (descendente ? ArrowDown01Icon : ArrowUp01Icon) : ArrowUpDownIcon}
        size={14}
        aria-hidden="true"
        className={activo ? undefined : 'opacity-40'}
      />
    </Button>
  )
}

/** El embudo va junto al orden, dentro del encabezado; no suelto en la barra de arriba. */
export function FiltroColumna({
  etiqueta,
  opciones,
  seleccion,
  onCambiar,
}: {
  etiqueta: string
  opciones: string[]
  seleccion: string[]
  onCambiar: (valores: string[]) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<BotonIcono size="icon-xs" aria-label={`Filtrar por ${etiqueta}`} />}>
        <HugeiconsIcon
          icon={FilterIcon}
          size={14}
          aria-hidden="true"
          className={seleccion.length > 0 ? 'text-primary' : 'text-muted-foreground'}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuGroup>
          {opciones.map((opcion) => (
            <DropdownMenuCheckboxItem
              key={opcion}
              checked={seleccion.includes(opcion)}
              onCheckedChange={(activo) =>
                onCambiar(activo ? [...seleccion, opcion] : seleccion.filter((valor) => valor !== opcion))
              }
            >
              {opcion}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Encabezado con las dos cosas: ordenar por la columna y filtrar sus valores. */
export function EncabezadoTabla({
  etiqueta,
  campo,
  ordenActual,
  onOrdenar,
  filtro,
}: {
  etiqueta: string
  campo?: string
  ordenActual?: string
  onOrdenar?: (campo: string) => void
  filtro?: { opciones: string[]; seleccion: string[]; onCambiar: (valores: string[]) => void }
}) {
  return (
    <span className="flex items-center gap-0.5">
      {campo && onOrdenar ? (
        <EncabezadoOrdenable etiqueta={etiqueta} campo={campo} ordenActual={ordenActual} onOrdenar={onOrdenar} />
      ) : (
        <span className="font-medium text-muted-foreground">{etiqueta}</span>
      )}
      {filtro ? <FiltroColumna etiqueta={etiqueta} {...filtro} /> : null}
    </span>
  )
}

// ── Paginador en español ─────────────────────────────────────────────────────────────────────────────────────────

const TAMANOS_PAGINA = [10, 20, 30, 50].map((n) => ({ value: String(n), label: String(n) }))

/** Los saltos de la barra: se ven la primera, la última y las vecinas de la actual. */
function paginasVisibles(actual: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const cerca = [actual - 1, actual, actual + 1].filter((n) => n > 1 && n < total)
  const lista: (number | '…')[] = [1]
  if (cerca[0] > 2) lista.push('…')
  lista.push(...cerca)
  if (cerca[cerca.length - 1] < total - 1) lista.push('…')
  lista.push(total)
  return lista
}

export function PaginacionTabla({
  actual,
  total,
  porPagina,
  onCambiarPagina,
  onCambiarPorPagina,
}: {
  actual: number
  total: number
  porPagina: number
  onCambiarPagina: (pagina: number) => void
  onCambiarPorPagina: (porPagina: number) => void
}) {
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina))
  const desde = total ? (actual - 1) * porPagina + 1 : 0
  const hasta = Math.min(actual * porPagina, total)
  const ir = (siguiente: number) => (evento: { preventDefault: () => void }) => {
    evento.preventDefault()
    if (siguiente >= 1 && siguiente <= totalPaginas) onCambiarPagina(siguiente)
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span id="filas-por-pagina">Filas por página</span>
        <Select value={String(porPagina)} onValueChange={(valor) => onCambiarPorPagina(Number(valor))} items={TAMANOS_PAGINA}>
          <SelectTrigger className="w-20" aria-labelledby="filas-por-pagina">
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {TAMANOS_PAGINA.map((tamano) => (
              <SelectItem key={tamano.value} value={tamano.value}>
                {tamano.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="tabular-nums">
          {desde}–{hasta} de {total.toLocaleString('es-CO')}
        </span>
      </div>
      <Pagination className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              text="Anterior"
              aria-label="Página anterior"
              aria-disabled={actual === 1}
              onClick={ir(actual - 1)}
            />
          </PaginationItem>
          {paginasVisibles(actual, totalPaginas).map((item, indice) =>
            item === '…' ? (
              <PaginationItem key={`salto-${indice}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={item}>
                <PaginationLink href="#" isActive={item === actual} onClick={ir(item)}>
                  {item}
                </PaginationLink>
              </PaginationItem>
            ),
          )}
          <PaginationItem>
            <PaginationNext
              href="#"
              text="Siguiente"
              aria-label="Página siguiente"
              aria-disabled={actual === totalPaginas}
              onClick={ir(actual + 1)}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
