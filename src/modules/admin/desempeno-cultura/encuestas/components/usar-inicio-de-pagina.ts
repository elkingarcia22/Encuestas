import { useLayoutEffect, useRef } from 'react'

// Al entrar a una pantalla desde la lista, la página arranca arriba y no donde se había quedado el scroll de la lista
// (Elkin, 21-oct: «entro a resultados y no carga desde el comienzo»). El contenedor que se desplaza es el del marco
// general (zona protegida) y se reutiliza entre rutas, así que la pantalla sube sola todo lo que la rodea al montarse.
// `clave` vuelve a subirla si la misma pantalla pasa a otro registro.

export function useInicioDePagina<T extends HTMLElement = HTMLSpanElement>(clave?: string) {
  const ref = useRef<T>(null)
  useLayoutEffect(() => {
    for (let nodo = ref.current?.parentElement ?? null; nodo; nodo = nodo.parentElement) {
      if (nodo.scrollTop > 0) nodo.scrollTop = 0
    }
  }, [clave])
  return ref
}
