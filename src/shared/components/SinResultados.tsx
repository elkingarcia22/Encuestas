import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon } from '@hugeicons/core-free-icons'
import { Button, Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@ubits/flux-ui'
import { plural } from '@/modules/design-system/patrones/formato'
import { ImagenGlass } from '@/shared/components/ImagenGlass'

// «Sin resultados»: la lista sí tiene datos, pero la búsqueda o los filtros los dejaron fuera. Es uno de los cuatro
// estados vacíos del design system (Estados › Estados vacíos) y la salida es siempre aflojar el filtro, nunca crear.
//
// El texto **dice qué dejó fuera lo que se buscaba**: el término entre comillas y cuántos filtros están puestos. Un
// «No se encontraron resultados» a secas obliga a mirar la barra para entender por qué la lista está vacía.

export function SinResultados({
  busqueda,
  filtrosActivos = 0,
  onLimpiar,
}: {
  /** Lo que se escribió en el buscador, si se escribió algo. */
  busqueda?: string
  /** Cuántos criterios de filtro están puestos. */
  filtrosActivos?: number
  /** Quita la búsqueda y los filtros de una vez. */
  onLimpiar: () => void
}) {
  const termino = busqueda?.trim()
  const filtros = filtrosActivos > 0
  // Con uno solo no se dice «alguno de los 1 filtro activo».
  const quitar = filtrosActivos === 1 ? 'el filtro activo' : `alguno de los ${filtrosActivos} filtros activos`

  const titulo = termino ? `Sin resultados para «${termino}»` : `Sin resultados con ${plural(filtrosActivos, 'este filtro', 'estos filtros')}`
  const descripcion = termino
    ? filtros
      ? `Revisa la ortografía o quita ${quitar}.`
      : 'Revisa la ortografía o prueba con otras palabras.'
    : `Prueba quitando ${quitar}.`

  // La acción nombra lo que de verdad va a quitar.
  const accion = termino && filtros ? 'Limpiar búsqueda y filtros' : termino ? 'Limpiar búsqueda' : 'Limpiar filtros'

  return (
    <Empty className="py-14">
      <EmptyHeader>
        {/* El icono glass en vez de la lupa de línea: en un estado vacío hay sitio para una ilustración y se lee
            más amable que un símbolo pequeño. */}
        <EmptyMedia variant="default">
          <ImagenGlass nombre="glass-search" />
        </EmptyMedia>
        <EmptyTitle>{titulo}</EmptyTitle>
        <EmptyDescription>{descripcion}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" size="sm" onClick={onLimpiar}>
          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} aria-hidden="true" />
          {accion}
        </Button>
      </EmptyContent>
    </Empty>
  )
}
