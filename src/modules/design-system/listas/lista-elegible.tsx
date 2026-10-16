import { Children, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Search01Icon } from '@hugeicons/core-free-icons'
import {
  Checkbox,
  FramePanel,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
  Text,
} from '@ubits/flux-ui'
import { PiePaginacion } from '@/modules/admin/seleccion/propuestas/components/paginacion'

// «Lista elegible»: una lista para marcar personas, grupos o cosas DENTRO de un contenedor (un acordeón, un panel, una
// sección con marco). Existe para no meter una tabla dentro de otro marco: TablaDatos trae su propio marco con cabecera,
// y dentro de un acordeón se leía como contenedor dentro de contenedor dentro de contenedor.
//
// Aquí son dos niveles y nada más: el contenedor que ya existe y, dentro, UN solo panel blanco con las filas. El buscador
// y las herramientas (filtros, «agrupar por», «ver elegidos») van sueltos encima, sobre el fondo del contenedor, y el
// pie de paginación sale dentro del panel solo cuando hay más filas que las de una página.
//
// Qué NO es: una tabla. Sin cabecera de columnas, sin orden ni cambio de ancho. Si la gente necesita ordenar, comparar
// columnas o actuar sobre filas (un «⋯» por fila), es TablaDatos, en su propia página. Esta es para ELEGIR.
//
// Se arma con piezas de la librería (Frame, Item, Checkbox, InputGroup) y el pie del sistema (PiePaginacion): nada de
// estilos propios. Su ficha está en Design system › Ajustes propios › Piezas del sistema («Lista para elegir»).

export type PaginacionLista = {
  pagina: number
  setPagina: Dispatch<SetStateAction<number>>
  porPagina: number
  setPorPagina: Dispatch<SetStateAction<number>>
  /** Filas que hay en total (con la búsqueda y los filtros ya aplicados), no solo las de esta página. */
  total: number
}

const FILAS_MINIMAS = 10

export function ListaElegible({
  id,
  nombre,
  buscador,
  herramientas,
  resumen,
  casillaPagina,
  opcionesSeleccion,
  paginacion,
  vacio,
  herramientasEnCabecera = false,
  titulo,
  children,
}: {
  /** Para enlazar etiquetas cuando hay dos listas en la misma pantalla. */
  id: string
  /** Lo que se lista, en plural: «grupos», «personas». */
  nombre: string
  buscador: { valor: string; onValor: (valor: string) => void; placeholder: string }
  /** Lo que va al lado del buscador: filtros, «Agrupar por», «Ver elegidos»… */
  herramientas?: ReactNode
  /** El texto de la fila de arriba. Sin él dice «N grupos». */
  resumen?: ReactNode
  /** La casilla que marca o desmarca todas las filas de la página. */
  casillaPagina: { marcada: boolean; parcial: boolean; onCambio: () => void; etiqueta: string }
  /** Junto a esa casilla: un menú para marcar más de una página («Seleccionar todo», «Desmarcar los resultados»). */
  opcionesSeleccion?: ReactNode
  paginacion: PaginacionLista
  /** Lo que se ve cuando no hay filas (búsqueda sin resultados, nada elegido). */
  vacio?: ReactNode
  /** Buscador y herramientas DENTRO del panel, en su fila de arriba (blanca), junto a la casilla y el conteo, en vez de
   *  sueltos encima sobre el gris del contenedor (variante del 9-oct, para comparar). */
  herramientasEnCabecera?: boolean
  /** Con `herramientasEnCabecera`: el título de la lista en la misma fila, entre la casilla y el buscador («Áreas»). Para
   *  cuando el contenedor nombra la forma de elegir («Por grupos») y la lista nombra lo que hay en ella. */
  titulo?: { texto: string }
  /** Las filas de esta página: una `FilaElegible` por cada una. */
  children: ReactNode
}) {
  const filas = Children.toArray(children)
  const paginas = Math.max(1, Math.ceil(paginacion.total / paginacion.porPagina))
  const desde = paginacion.total === 0 ? 0 : (paginacion.pagina - 1) * paginacion.porPagina + 1
  const hasta = Math.min(paginacion.pagina * paginacion.porPagina, paginacion.total)

  const campoBusqueda = (
    // Sobre el gris del contenedor el campo lleva el fondo de página: el del tema se pierde contra él (misma forzada que
    // los filtros del banco). Dentro del panel blanco ya contrasta y no hace falta.
    <InputGroup className={herramientasEnCabecera ? 'w-56 shrink' : 'min-w-56 flex-1 bg-background!'}>
      <InputGroupAddon>
        <HugeiconsIcon icon={Search01Icon} aria-hidden="true" />
      </InputGroupAddon>
      <InputGroupInput
        id={`${id}-buscar`}
        value={buscador.valor}
        onChange={(evento) => buscador.onValor(evento.target.value)}
        placeholder={buscador.placeholder}
        aria-label={buscador.placeholder}
      />
    </InputGroup>
  )
  const conteo = (
    <Text as="span" size="sm" variant="muted" role="status" className="shrink-0 tabular-nums">
      {resumen ?? `${paginacion.total} ${nombre}`}
    </Text>
  )

  return (
    <div className="flex flex-col gap-3">
      {herramientasEnCabecera ? null : (
        <div className="flex flex-wrap items-center gap-2">
          {campoBusqueda}
          {herramientas}
        </div>
      )}

      {/* Las paddings del panel van en cero (la técnica de la propia librería): las filas traen el suyo y llegan de borde a borde. */}
      {/* Las líneas entre filas las pone el envoltorio de cada una (divide-y) y no ItemGroup + ItemSeparator: esos dos traen
          separación de tarjetas sueltas (gap-4 y my-2 en el tema) y la lista quedaba con filas de casi 100 px. */}
      <FramePanel className="overflow-hidden [--frame-panel-px:0px] [--frame-panel-py:0px]">
        <div className="divide-y">
          {/* La fila de arriba: gris con solo la casilla y el conteo, o blanca con todo dentro (herramientasEnCabecera). */}
          {/* En un envoltorio: la línea de divide-y va en él, porque el tema le pone borde transparente al Item. */}
          <div>
            <Item variant={herramientasEnCabecera ? 'default' : 'muted'} size="sm">
              <div className="flex items-center gap-0.5">
                <Checkbox checked={casillaPagina.marcada} indeterminate={casillaPagina.parcial} onCheckedChange={casillaPagina.onCambio} aria-label={casillaPagina.etiqueta} />
                {opcionesSeleccion}
              </div>
              {herramientasEnCabecera ? (
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  {/* Con título, una sola línea: casilla, título, buscador y herramientas. El título nombra lo que se lista. */}
                  {/* El título (o el conteo) se estira y empuja buscador y herramientas a la derecha: el buscador va corto. */}
                {titulo ? <ItemTitle className="min-w-0 flex-1">{titulo.texto}</ItemTitle> : <div className="min-w-0 flex-1">{conteo}</div>}
                  {campoBusqueda}
                  {herramientas}
                </div>
              ) : (
                <ItemContent>{conteo}</ItemContent>
              )}
            </Item>
          </div>
          {filas.length === 0 ? (
            vacio
          ) : (
            <div role="list" className="divide-y">
              {filas.map((fila, indice) => (
                <div key={indice} role="listitem">
                  {fila}
                </div>
              ))}
            </div>
          )}
        </div>
        {paginacion.total > FILAS_MINIMAS ? (
          <div className="border-t">
            <PiePaginacion
              id={id}
              nombre={nombre}
              estado={{ ...paginacion, paginas, desde, hasta }}
            />
          </div>
        ) : null}
      </FramePanel>
    </div>
  )
}

/** Una fila de la lista: su casilla, lo principal (título y detalle, o un contenido propio) y, a la derecha, lo de apoyo. */
export function FilaElegible({
  marcada,
  onCambio,
  etiqueta,
  titulo,
  detalle,
  contenido,
  lateral,
  tamano = 'sm',
  resaltada = false,
}: {
  marcada: boolean
  onCambio: () => void
  /** Lo que lee un lector de pantalla al llegar a la casilla: «Marcar el grupo Comercial». */
  etiqueta: string
  titulo?: string
  detalle?: ReactNode
  /** En lugar de título y detalle: por ejemplo la persona con su avatar. */
  contenido?: ReactNode
  /** A la derecha: el porcentaje, las exclusiones, una insignia. */
  lateral?: ReactNode
  /** «xs»: filas de una línea, para listas largas que se recorren rápido. */
  tamano?: 'sm' | 'xs'
  /** Con fondo gris suave mientras está marcada, para que lo elegido se distinga en la lista. */
  resaltada?: boolean
}) {
  return (
    <Item size={tamano} variant={resaltada && marcada ? 'muted' : 'default'}>
      <Checkbox checked={marcada} onCheckedChange={onCambio} aria-label={etiqueta} />
      <ItemContent>
        {contenido ?? (
          <>
            <ItemTitle>{titulo}</ItemTitle>
            {detalle ? <ItemDescription>{detalle}</ItemDescription> : null}
          </>
        )}
      </ItemContent>
      {lateral ? <ItemActions>{lateral}</ItemActions> : null}
    </Item>
  )
}
