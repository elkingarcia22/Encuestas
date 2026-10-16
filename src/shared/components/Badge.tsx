import type { ComponentProps } from 'react'
import { Badge as BadgeDeFlux, cn } from '@ubits/flux-ui'

// La insignia de flux-ui con la letra en 10.5px como mínimo (25 sep, Nicolás: «lo mínimo que deben ser es de 10.5 …
// debemos sí o sí priorizar accesibilidad»). La librería trae «xs» en 9.6px y «sm» en 10px: aquí conservan su alto y
// su relleno, y solo sube la letra. Las pantallas la importan de aquí y no de flux-ui (hoy, todo Selección). Concesión
// para el equipo de librería («Ajustes propios › Insignias chicas a 10.5 px»): el día que sus tamaños chicos lleguen a
// 10.5px, se vuelve a importar la suya.
export function Badge({ size, className, ...props }: ComponentProps<typeof BadgeDeFlux>) {
  return <BadgeDeFlux size={size} className={cn((size === 'xs' || size === 'sm') && 'text-[0.65625rem]', className)} {...props} />
}
