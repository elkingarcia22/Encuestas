import type { ReactNode } from 'react'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, useCarousel, Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle } from '@ubits/flux-ui'

// Una caja con cabecera y un carrusel de tarjetas: el bloque de cada competencia y las dos secciones de Eventos. Las
// flechas del carrusel de la librería van en la cabecera, como en el carrusel de recomendados del inicio del
// colaborador; si todo cabe, no hay flechas. Muestra 4 tarjetas en pantallas anchas, 3, 2 y 1 al angostar.

/**
 * Las flechas del carrusel, **solo si hay algo que desplazar**.
 *
 * Contar elementos no sirve: la caja enseña cuatro tarjetas en pantallas anchas y una en el teléfono, así que con tres
 * elementos las flechas salían muertas en el escritorio y faltaban donde sí hacían falta. Lo que decide es si el
 * contenido desborda **en ese ancho**, que es lo que dice el propio carrusel y se recalcula al cambiar la ventana
 * (Dave, 7-oct).
 */
export function FlechasCarrusel() {
  const { canScrollPrev, canScrollNext } = useCarousel()
  if (!canScrollPrev && !canScrollNext) return null
  return (
    <div className="flex shrink-0 gap-2">
      <CarouselPrevious aria-label="Anterior" className="static my-0 translate-y-0" />
      <CarouselNext aria-label="Siguiente" className="static my-0 translate-y-0" />
    </div>
  )
}

export function CajaCarrusel({
  etiqueta,
  titulo,
  descripcion,
  progreso,
  icono,
  cabecera,
  items,
}: {
  etiqueta: string
  /** El título de la sección, en el marco gris. Con él, las flechas suben al gris y el panel queda solo con las tarjetas. */
  titulo?: string
  /** Lo que el título no dice (cuántos son, de qué va). Sin título no se usa. */
  descripcion?: string
  /** Debajo del título, dentro del gris: el avance de la competencia (sus minutos, el porcentaje y la barra). */
  progreso?: ReactNode
  icono?: ReactNode
  /** Una cabecera que no es texto —imagen, barra de progreso— y por eso vive dentro del panel blanco. */
  cabecera?: ReactNode
  items: { clave: string; nodo: ReactNode }[]
}) {
  return (
    <section aria-label={etiqueta}>
      {/* El carrusel envuelve el marco para que sus flechas puedan vivir en la cabecera gris, fuera del panel. */}
      <Carousel opts={{ align: 'start' }} className="[&_[data-slot=carousel-content]]:-mx-2 [&_[data-slot=carousel-content]]:px-2">
        <Frame spacing="sm">
          {titulo ? (
            <FrameHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
              {/* La columna crece hasta las flechas: así la barra de progreso de una competencia ocupa todo el ancho
                  que hay, en vez de quedarse a media caja (Dave, 7-oct). */}
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {icono}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <FrameTitle>{titulo}</FrameTitle>
                  {descripcion ? <FrameDescription>{descripcion}</FrameDescription> : null}
                  {progreso}
                </div>
              </div>
              <FlechasCarrusel />
            </FrameHeader>
          ) : null}
          {/* El carrusel recorta en el borde de su ventana, y las tarjetas empiezan justo ahí: la sombra de la
              primera y la última se cortaba en seco a los lados. Con relleno en la ventana —y el margen negativo que
              lo devuelve a su sitio— la sombra cae dentro de lo que se ve. El `py-px` de cada tarjeta hace lo mismo
              arriba y abajo (Dave, 7-oct). */}
          <FramePanel className="flex flex-col gap-4">
            {cabecera ? (
              <div className="flex items-end justify-between gap-4">
                <div className="min-w-0 flex-1">{cabecera}</div>
                {titulo ? null : <FlechasCarrusel />}
              </div>
            ) : null}
            <CarouselContent>
              {items.map((item) => (
                <CarouselItem key={item.clave} className="basis-full py-px min-[481px]:basis-1/2 md:basis-1/3 min-[1366px]:basis-1/4">
                  {item.nodo}
                </CarouselItem>
              ))}
            </CarouselContent>
          </FramePanel>
        </Frame>
      </Carousel>
    </section>
  )
}
