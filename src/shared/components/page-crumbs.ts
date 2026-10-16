import { useEffect, useSyncExternalStore } from 'react'
import { useLocation } from 'react-router'
import type { Crumb } from '@/shared/layouts/nav-config'

// La miga de pan vive **arriba, en la barra superior**, pegada al botón que abre y cierra el menú. Nunca encima del
// título de la página (decisión de Nicolás, 21 sep).
//
// La mayoría de las pantallas no tienen que hacer nada: la barra saca la ruta del menú (`getBreadcrumbs`). Pero una
// pantalla puede estar más adentro de lo que el menú conoce («Encuestas › Crear encuesta»): entonces registra aquí
// sus tramos y la barra los muestra en vez de los del menú.
//
// Se guarda junto con la ruta donde se registró: al cambiar de pantalla, la barra no muestra por un instante la miga
// de la pantalla anterior.

type Registro = { path: string; items: Crumb[] } | null

let actual: Registro = null
const oyentes = new Set<() => void>()

const avisar = () => oyentes.forEach((oyente) => oyente())
const suscribir = (oyente: () => void) => {
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
  }
}
const leer = () => actual

// Lo usa la pantalla (o su marco): «mi ruta completa es esta».
export function useSetPageCrumbs(items?: Crumb[]) {
  const { pathname } = useLocation()
  // La lista se arma en cada render, así que se compara por contenido y no por identidad.
  const firma = JSON.stringify(items ?? null)

  useEffect(() => {
    if (!items?.length) return
    actual = { path: pathname, items }
    avisar()
    return () => {
      if (actual?.path === pathname) {
        actual = null
        avisar()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firma, pathname])
}

// Lo usa la barra superior: las de la pantalla si las registró, si no las del menú.
export function usePageCrumbs(): Crumb[] | null {
  const { pathname } = useLocation()
  const registro = useSyncExternalStore(suscribir, leer, leer)
  return registro && registro.path === pathname ? registro.items : null
}
