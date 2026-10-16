import { Badge } from '@ubits/flux-ui'

// Las unidades de la diferencia frente a la base: los porcentajes se leen en puntos porcentuales (pp) y el eNPS en
// puntos (pts): un 70% que pasa a 72% no «sube 2%», sube 2 puntos. La insignia de la comparación ya no vive aquí: desde
// el 7-oct es `Cambio` (Selección › cifras), la comparación oficial; aquí queda el texto que pinta el mapa de calor, los
// decimales de cada unidad y la marca de la columna base.

// Por debajo de esto la diferencia se lee como «sin variación».
const SIN_VARIACION = 0.1

export type Unidad = 'pp' | 'pts'

/** Con cuántos decimales se lee cada unidad en `Cambio`: «+2,3 pp», «+4 pts». */
export const decimalesDe = (unidad: Unidad) => (unidad === 'pts' ? 0 : 1)

export const textoVariacion = (delta: number, unidad: Unidad) => {
  const valor = unidad === 'pts' ? Math.round(delta).toString() : (Math.round(Math.abs(delta) * 10) / 10).toString().replace('.', ',')
  if (Math.abs(delta) < SIN_VARIACION) return `0 ${unidad}`
  return `${delta > 0 ? '+' : '−'}${unidad === 'pts' ? Math.abs(Math.round(delta)) : valor} ${unidad}`
}

/** La etiqueta que marca la columna de referencia. */
export function MarcaBase() {
  return (
    <Badge variant="primary-light" size="sm">
      Base
    </Badge>
  )
}
