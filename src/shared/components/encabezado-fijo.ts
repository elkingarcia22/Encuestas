import { useEffect, useRef } from 'react'

// Encabezado fijo sin fondo: el título se queda arriba al hacer scroll y el contenido pasa por debajo sin verse.
//
// No lleva fondo a propósito —una barra opaca partiría la página en dos— así que en su lugar se recorta el contenido
// justo en el borde inferior del encabezado. Sin eso, el formulario se lee por detrás del título y quedan textos
// encimados. Lo usan los flujos de creación por pasos: Crear vacante y Crear contenido.

/** El primer ancestro que hace scroll: estas pantallas no se desplazan en `window` sino en un contenedor del marco. */
export function contenedorDeScroll(nodo: Element | null) {
  let actual = nodo?.parentElement ?? null
  while (actual && !/(auto|scroll)/.test(getComputedStyle(actual).overflowY)) actual = actual.parentElement
  return actual
}

/**
 * Devuelve la referencia de una marca vacía que se pone **justo antes** del encabezado. A partir de ella se
 * encuentran el encabezado (el hermano siguiente) y el contenido (el de después), que es al que se le recorta
 * la parte que quedaría debajo del título.
 *
 * Si la pantalla no pinta nada hasta tener datos (`if (!listo) return null`), hay que pasarle `listo`: el efecto
 * corre una sola vez y, sin la marca en el DOM, se quedaría sin enganchar.
 *
 * ```tsx
 * const marca = useRecorteBajoEncabezado()
 * <span ref={marca} aria-hidden="true" />
 * <PageHeader className="sticky top-0 …" />
 * <PageContent>…</PageContent>
 * ```
 */
export function useRecorteBajoEncabezado(activo = true) {
  const marca = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!activo) return
    const encabezado = marca.current?.nextElementSibling as HTMLElement | null
    const contenido = encabezado?.nextElementSibling as HTMLElement | null
    if (!encabezado || !contenido) return

    // Se escribe directo en el estilo (sin estado) para no redibujar la pantalla en cada movimiento.
    const recortar = () => {
      const corte = encabezado.getBoundingClientRect().bottom - contenido.getBoundingClientRect().top
      // Solo el borde de arriba: a los lados y abajo se deja margen para las sombras de las tarjetas y la barra.
      if (corte > 0) contenido.style.setProperty('clip-path', `inset(${corte}px -100vmax -100vmax -100vmax)`)
      else contenido.style.removeProperty('clip-path')
    }

    recortar()
    // En captura y desde window: estas pantallas no se desplazan en `window` sino en un contenedor del marco, y cuál
    // es exactamente depende de la pantalla. Escuchar en captura atrapa el scroll venga del elemento que venga; buscar
    // el contenedor al montar fallaba cuando el marco todavía no tenía sus estilos.
    window.addEventListener('scroll', recortar, { passive: true, capture: true })
    window.addEventListener('resize', recortar)
    return () => {
      window.removeEventListener('scroll', recortar, { capture: true })
      window.removeEventListener('resize', recortar)
    }
  }, [activo])

  return marca
}
