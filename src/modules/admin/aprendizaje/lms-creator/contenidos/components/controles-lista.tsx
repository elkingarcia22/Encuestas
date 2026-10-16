import type { MouseEvent, ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon, FilterIcon, Search01Icon } from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  Field,
  FieldLabel,
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
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
  Tabs,
  TabsList,
  TabsTrigger,
} from '@ubits/flux-ui'
import { ActionDialog } from '@/shared/components/ActionDialog'
import type { PaginacionTabla } from '@/modules/design-system/data-grid/tabla-datos'
import { PiePaginacion } from '@/modules/admin/seleccion/propuestas/components/paginacion'
import { POR_PAGINA, listaPaginas } from './vista'

// Los controles de la lista de contenidos de LMS Creator › Contenidos: la barra (buscador, Filtrar con el número de
// criterios y contador), los chips de filtros aplicados, el modal de filtros y el pie de paginación. Salieron de esa
// pantalla para que Universidad corporativa, que es su reflejo del lado del colaborador, use exactamente los mismos.

export type Criterio<K extends string> = { key: K; label: string; vacio: string; opciones: string[] }

export function BarraLista({
  busqueda,
  onBusqueda,
  placeholder = 'Buscar...',
  etiquetaBuscar = 'Buscar contenidos',
  criteriosActivos,
  onFiltrar,
  mostrados,
  total,
  children,
}: {
  busqueda: string
  onBusqueda: (valor: string) => void
  placeholder?: string
  etiquetaBuscar?: string
  criteriosActivos: number
  onFiltrar: () => void
  mostrados: number
  total: number
  /** Lo que va después del contador, como el cambio de vista. */
  children?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <InputGroup className="w-full sm:w-72">
        <InputGroupAddon>
          <HugeiconsIcon icon={Search01Icon} aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          id="buscar-contenido"
          placeholder={placeholder}
          aria-label={etiquetaBuscar}
          value={busqueda}
          onChange={(e) => onBusqueda(e.target.value)}
        />
      </InputGroup>

      <Button
        variant={criteriosActivos ? 'secondary' : 'outline'}
        onClick={onFiltrar}
        aria-label={criteriosActivos ? `Filtrar, ${criteriosActivos} criterios aplicados` : 'Filtrar'}
      >
        <HugeiconsIcon icon={FilterIcon} size={16} />
        Filtrar
        {criteriosActivos ? (
          <Badge variant="default" size="xs" className="tabular-nums">
            {criteriosActivos}
          </Badge>
        ) : null}
      </Button>

      {/* RN-05: el contador nombra el tipo de ítem, no «resultados». */}
      <span role="status" className="ml-auto text-sm text-muted-foreground tabular-nums">
        {mostrados}/{total} contenidos
      </span>

      {children}
    </div>
  )
}

/** Los criterios aplicados quedan a la vista y se quitan uno a uno. */

/**
 * La ventana de filtros usa `ActionDialog`, la única del sistema desde la auditoría del 5-oct. Antes era
 * `ConfiguredModal`, que se retiró; al traer esta pantalla de vuelta se migró en vez de resucitarla (Dave, 9-oct).
 *
 * Los dos botones van por su `footer`, que es como el equipo pone acciones propias en esa ventana (Cristian lo usa
 * así en el directorio de participantes de Encuestas). Así «Borrar filtros» queda donde estaba, en el pie, sin
 * inventarse un botón suelto dentro del cuerpo.
 */
/** Modal de filtros: los criterios juntos, se aplican de una vez (modal del equipo, Design system › Modales). */
export function ModalFiltros<K extends string>({
  abierto,
  onAbiertoChange,
  criterios,
  pendientes,
  onCambiar,
  onBorrar,
  onAplicar,
}: {
  abierto: boolean
  onAbiertoChange: (abierto: boolean) => void
  criterios: Criterio<K>[]
  pendientes: Record<K, string>
  onCambiar: (key: K, valor: string) => void
  onBorrar: () => void
  onAplicar: () => void
}) {
  return (
    <ActionDialog
      open={abierto}
      onOpenChange={onAbiertoChange}
      title="Filtros"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onBorrar}>
            Borrar filtros
          </Button>
          <Button onClick={onAplicar}>Aplicar</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {criterios.map((criterio) => (
          <Field key={criterio.key}>
            <FieldLabel htmlFor={`filtro-${criterio.key}`}>{criterio.label}</FieldLabel>
            <Select
              value={pendientes[criterio.key] || '__todos'}
              onValueChange={(value) => onCambiar(criterio.key, value === '__todos' ? '' : String(value))}
            >
              <SelectTrigger id={`filtro-${criterio.key}`} className="w-full">
                <SelectValue>{pendientes[criterio.key] || criterio.vacio}</SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectItem value="__todos">{criterio.vacio}</SelectItem>
                {criterio.opciones.map((opcion) => (
                  <SelectItem key={opcion} value={opcion}>
                    {opcion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        ))}
      </div>
    </ActionDialog>
  )
}

// ── El cambio de vista y el marco de la cuadrícula ───────────────────────────────────────────────────────────────────
//
// Las listas de contenidos —LMS Creator › Contenidos, Universidad corporativa y Zona de estudio— se ven como tabla o
// como cuadrícula de tarjetas (decisiones 1b y 2a de Cristian, 9-oct). Aquí vive lo que comparten, para que las tres se
// lean igual: el conmutador y el marco de la cuadrícula. La tabla es `TablaDatos`, que trae su propio marco; el de la
// cuadrícula es el mismo marco gris con el mismo encabezado (conteo a la izquierda, buscador a la derecha) y el mismo
// pie de paginación, para que al cambiar de vista no salte nada.

export type VistaLista = 'tabla' | 'cuadricula'

const VISTAS: { value: VistaLista; label: string }[] = [
  { value: 'tabla', label: 'Tabla' },
  { value: 'cuadricula', label: 'Cuadrícula' },
]

/**
 * El cambio «Tabla | Cuadrícula», con las pestañas de la plataforma: subrayadas y solo con texto (regla del 5-oct).
 * Antes era un grupo de botones con icono (el jefe de Dave, 13-oct). Solo cambia la vista: el contenido lo pinta quien
 * la usa, así que no lleva `TabsContent`.
 */
export function CambioDeVista({ vista, onCambio }: { vista: VistaLista; onCambio: (vista: VistaLista) => void }) {
  return (
    <Tabs data-region="Cambio de vista" value={vista} onValueChange={(valor) => onCambio(valor as VistaLista)}>
      <TabsList variant="line" aria-label="Cambio de vista">
        {VISTAS.map((item) => (
          <TabsTrigger key={item.value} value={item.value}>
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

/**
 * El marco gris de la cuadrícula: el conteo y el buscador arriba, las tarjetas en el panel blanco y el paginador del
 * sistema (`PiePaginacion`) abajo, como los trae `TablaDatos`. El buscador es de aquí y no de la tabla: la de la librería
 * lo guarda por dentro y no se le puede pasar el texto, así que cada vista lleva el suyo y quien las usa vacía la
 * búsqueda al cambiar de una a otra.
 */
export function MarcoCuadricula({
  busqueda,
  onBuscar,
  marcador,
  paginacion,
  nombre,
  singular,
  id,
  children,
}: {
  busqueda: string
  onBuscar: (valor: string) => void
  /** El texto del buscador y su etiqueta: «Buscar contenidos». */
  marcador: string
  paginacion: PaginacionTabla
  /** Lo que se pagina, en plural: «contenidos». Con el total sale en la cabecera («12 contenidos»). */
  nombre: string
  /** Y en singular, para cuando hay uno solo: «1 contenido», no «1 contenidos». */
  singular?: string
  /** Enlaza «Filas por página» con su selector cuando hay dos listas en la misma pantalla. */
  id: string
  children: ReactNode
}) {
  const conteo = `${paginacion.total.toLocaleString('es-CO')} ${paginacion.total === 1 && singular ? singular : nombre}`
  const paginas = Math.max(1, Math.ceil(paginacion.total / paginacion.porPagina))
  const pagina = Math.min(paginacion.pagina, paginas)
  const estado = {
    ...paginacion,
    pagina,
    paginas,
    desde: paginacion.total ? (pagina - 1) * paginacion.porPagina + 1 : 0,
    hasta: Math.min(pagina * paginacion.porPagina, paginacion.total),
  }

  return (
    // `--frame-gap:0px`: el mismo armado de `TablaDatos`, sin aire entre el panel y el pie.
    <Frame spacing="sm" className="[--frame-gap:0px]">
      <FrameHeader>
        <div className="flex flex-row flex-wrap items-center justify-between gap-3">
          <FrameDescription>{conteo}</FrameDescription>
          {/* `bg-background`: el InputGroup de la librería es transparente y sobre la cabecera gris se perdía. Mide 32 px,
              como el buscador de las tablas: es un control de la fila de acciones, no un campo de formulario (excepción
              de la regla global de `src/index.css`). */}
          <InputGroup className="h-8! w-56 bg-background">
            <InputGroupAddon>
              <HugeiconsIcon icon={Search01Icon} aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              // Los mismos 32 px del marco: sin el «!» el campo global de 40 px lo desborda.
              className="h-8! text-sm!"
              value={busqueda}
              onChange={(evento) => onBuscar(evento.target.value)}
              placeholder={marcador}
              aria-label={marcador}
            />
            {busqueda ? (
              <InputGroupAddon align="inline-end">
                <InputGroupButton size="icon-xs" aria-label="Borrar la búsqueda" onClick={() => onBuscar('')}>
                  <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" />
                </InputGroupButton>
              </InputGroupAddon>
            ) : null}
          </InputGroup>
        </div>
      </FrameHeader>
      <FramePanel>{children}</FramePanel>
      {paginacion.total ? (
        <FrameFooter className="px-0">
          <PiePaginacion estado={estado} nombre={nombre} id={id} />
        </FrameFooter>
      ) : null}
    </Frame>
  )
}

/** El pie de la lista: cuántos contenidos por página, cuáles se ven y las páginas. */
export function PieContenidos({
  total,
  porPagina,
  onPorPagina,
  pagina,
  onPagina,
}: {
  total: number
  porPagina: number
  onPorPagina: (n: number) => void
  pagina: number
  onPagina: (n: number) => void
}) {
  const paginas = Math.max(1, Math.ceil(total / porPagina))
  const actual = Math.min(pagina, paginas)
  const desde = total ? (actual - 1) * porPagina + 1 : 0
  const hasta = Math.min(actual * porPagina, total)
  const irA = (destino: number) => (event: MouseEvent) => {
    event.preventDefault()
    if (destino >= 1 && destino <= paginas) onPagina(destino)
  }
  if (!total) return null
  return (
    <div data-region="Paginación" className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span id="contenidos-por-pagina">Contenidos por página</span>
        <Select
          value={String(porPagina)}
          onValueChange={(value) => {
            onPorPagina(Number(value))
            onPagina(1)
          }}
        >
          <SelectTrigger className="w-20" aria-labelledby="contenidos-por-pagina">
            <SelectValue>{porPagina}</SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {POR_PAGINA.map((opcion) => (
              <SelectItem key={opcion.value} value={opcion.value}>
                {opcion.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="tabular-nums">
          {desde}–{hasta} de {total}
        </span>
      </div>

      <Pagination className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" text="Anterior" aria-label="Página anterior" aria-disabled={actual === 1} onClick={irA(actual - 1)} />
          </PaginationItem>
          {listaPaginas(actual, paginas).map((item, i) =>
            item === 'salto' ? (
              <PaginationItem key={`salto-${i}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={item}>
                <PaginationLink href="#" isActive={item === actual} onClick={irA(item)}>
                  {item}
                </PaginationLink>
              </PaginationItem>
            ),
          )}
          <PaginationItem>
            <PaginationNext href="#" text="Siguiente" aria-label="Página siguiente" aria-disabled={actual === paginas} onClick={irA(actual + 1)} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
