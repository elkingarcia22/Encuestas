import type { ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import { Cancel01Icon } from '@hugeicons/core-free-icons'
import { Toggle } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { Hint } from '@/shared/components/Hint'

// Un filtro que se prende y se apaga, con cara de chip (25 sep, Nicolás: «esto no parece una chip de filtro y no se
// sabe cómo se quita; si uno selecciona una chip aparece la x para quitar el filtro»). Apagado dice qué filtra y
// cuántos hay; prendido lleva la «x» al final y, al pasar el cursor, «Quitar el filtro». Todo el chip prende y quita.
// El globo va siempre (con otro texto) para que el chip no se vuelva a montar al cambiar y no pierda el foco.
//
// Sirve igual para una fila de opciones que se excluyen (las etapas del pipeline, los resultados de un lote): sin
// ninguna puesta se ve todo, así que no hace falta un chip «Todas»; se toca una para filtrar y su «x» vuelve a todo.
export function FiltroChip({
  activo,
  onCambiar,
  icono,
  texto,
  cuenta,
  ayuda,
  antes,
  size = 'default',
}: {
  activo: boolean
  onCambiar: (activo: boolean) => void
  icono?: IconSvgElement
  // Lo que va antes del texto en lugar del icono (el número de la etapa).
  antes?: ReactNode
  texto: string
  cuenta?: number
  // Qué hace al prenderlo («Ver solo a quien espera una respuesta»).
  ayuda: string
  size?: 'default' | 'sm'
}) {
  return (
    <Hint label={activo ? 'Quitar el filtro' : ayuda}>
      <Toggle variant="outline" size={size} pressed={activo} onPressedChange={onCambiar} aria-label={activo ? `Quitar el filtro «${texto}»` : ayuda}>
        {icono ? <HugeiconsIcon icon={icono} size={16} /> : null}
        {antes}
        {texto}
        {cuenta !== undefined ? (
          <Badge variant={activo ? 'invert' : 'secondary'} className="tabular-nums">
            {cuenta}
          </Badge>
        ) : null}
        {activo ? <HugeiconsIcon icon={Cancel01Icon} size={14} aria-hidden /> : null}
      </Toggle>
    </Hint>
  )
}
