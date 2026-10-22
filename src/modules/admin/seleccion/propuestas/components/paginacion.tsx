import { useState, type MouseEvent } from 'react'
import {
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
  Text,
  cn,
} from '@ubits/flux-ui'

// El pie de una lista larga: cuántas filas por página, cuántas se están viendo y las páginas.
//
// Vive aparte porque lo usan las dos mitades de Selección —las vacantes y la base de candidatos— y tienen que
// funcionar y leerse igual. La paginación de `DataGridList` viene en inglés y sin forma de traducirla, así que se
// arma con `Pagination` + `Select`, que sí se escriben en español.

const TAMANOS = [10, 20, 50]

// Con muchas páginas no caben todas: se muestran la primera, la última, la actual y sus vecinas.
function listaDePaginas(actual: number, total: number): (number | 'salto')[] {
  const paginas: (number | 'salto')[] = []
  for (let pagina = 1; pagina <= total; pagina += 1) {
    if (pagina === 1 || pagina === total || Math.abs(pagina - actual) <= 1) paginas.push(pagina)
    else if (paginas.at(-1) !== 'salto') paginas.push('salto')
  }
  return paginas
}

// Lo que necesita quien pagina una lista: en qué página va, cuántas filas caben y qué trozo mostrar.
export function usePaginacion<T>(items: T[], inicial = 10) {
  const [porPagina, setPorPagina] = useState(inicial)
  const [pagina, setPagina] = useState(1)

  const paginas = Math.max(1, Math.ceil(items.length / porPagina))
  const actual = Math.min(pagina, paginas)
  const filas = items.slice((actual - 1) * porPagina, actual * porPagina)
  const desde = items.length ? (actual - 1) * porPagina + 1 : 0
  const hasta = Math.min(actual * porPagina, items.length)

  return {
    filas,
    porPagina,
    setPorPagina,
    pagina: actual,
    setPagina,
    paginas,
    desde,
    hasta,
    total: items.length,
    // Al filtrar hay que volver a la primera página: si no, se busca algo y la pantalla sale vacía porque quedó
    // en la página 4 de un resultado que ahora tiene una.
    alFiltrar: () => setPagina(1),
  }
}

export type Paginacion = ReturnType<typeof usePaginacion<never>>

export function PiePaginacion({
  estado,
  nombre,
  id,
  enMarco = false,
}: {
  estado: Pick<Paginacion, 'porPagina' | 'setPorPagina' | 'pagina' | 'setPagina' | 'paginas' | 'desde' | 'hasta' | 'total'>
  // Cómo se llama lo que se está paginando, en plural: «vacantes», «personas».
  nombre: string
  // Para enlazar el rótulo «Filas por página» con su selector cuando hay dos listas en la misma pantalla.
  id: string
  // Dentro del pie de un marco (`FrameFooter`), que ya pone el relleno: ahí va `enMarco` y el pie no suma el suyo.
  // (MarcoTabla, para la que nació, se retiró el 5-oct; TablaDatos monta este pie por su cuenta.)
  enMarco?: boolean
}) {
  const irA = (destino: number) => (evento: MouseEvent) => {
    evento.preventDefault()
    if (destino < 1 || destino > estado.paginas) return
    estado.setPagina(destino)
  }

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3', enMarco ? 'py-0.5' : 'px-5 py-3')}>
      <div className="flex items-center gap-3">
        <Text as="span" id={`${id}-por-pagina`} variant="muted" size="sm">
          Filas por página
        </Text>
        <Select
          value={String(estado.porPagina)}
          onValueChange={(valor) => {
            estado.setPorPagina(Number(valor))
            estado.setPagina(1)
          }}
        >
          <SelectTrigger size="sm" className="w-20" aria-labelledby={`${id}-por-pagina`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TAMANOS.map((tamano) => (
              <SelectItem key={tamano} value={String(tamano)}>
                {tamano}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Se anuncia al pasar de página o al filtrar: si no, quien no ve la pantalla no sabe que cambió. */}
        <Text as="span" role="status" variant="muted" size="sm" className="tabular-nums">
          Viendo {estado.desde}–{estado.hasta} de {estado.total} {nombre}
        </Text>
      </div>

      {/* Con una sola página no hay a dónde ir: sin «Anterior» ni «Siguiente» (regla «paginador-una-pagina», 13-oct). */}
      <Pagination className="mx-0 w-auto">
        <PaginationContent>
          {estado.paginas > 1 ? (
            <PaginationItem>
              <PaginationPrevious
                href="#"
                text="Anterior"
                aria-label="Página anterior"
                aria-disabled={estado.pagina === 1}
                onClick={irA(estado.pagina - 1)}
              />
            </PaginationItem>
          ) : null}
          {listaDePaginas(estado.pagina, estado.paginas).map((item, indice) =>
            item === 'salto' ? (
              <PaginationItem key={`salto-${indice}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={item}>
                <PaginationLink href="#" isActive={item === estado.pagina} onClick={irA(item)}>
                  {item}
                </PaginationLink>
              </PaginationItem>
            ),
          )}
          {estado.paginas > 1 ? (
            <PaginationItem>
              <PaginationNext
                href="#"
                text="Siguiente"
                aria-label="Página siguiente"
                aria-disabled={estado.pagina === estado.paginas}
                onClick={irA(estado.pagina + 1)}
              />
            </PaginationItem>
          ) : null}
        </PaginationContent>
      </Pagination>
    </div>
  )
}
