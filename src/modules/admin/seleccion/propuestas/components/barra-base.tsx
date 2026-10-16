import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon, Delete02Icon, Download04Icon, Mail01Icon, MoreHorizontalIcon, Tag01Icon, UserSharingIcon } from '@hugeicons/core-free-icons'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Separator,
  Text,
  cn,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { PageActionBar } from '@/shared/components/PageShell'
import type { PersonaViva } from '../base'
import type { Base } from './use-base'

// ── Lo que se hace con varias de la base ──
//
// La misma barra de la bandeja de la exploración 1 (`BarraEnLote`): la superficie de `PageActionBar`, con las caras de
// quienes van, las acciones con su nombre, lo ocasional en «⋯» y la acción principal —meterlas en una vacante— llena y
// al final, antes de la «x» que quita la selección. La usan la 2 (pegada abajo de la tabla) y la 1 (flotando sobre la
// bandeja): `className` solo cambia dónde se pone.
export function BarraBase({
  elegidas,
  base,
  onLimpiar,
  className,
  ocultas = 0,
  onQuitarOcultas,
}: {
  elegidas: PersonaViva[]
  base: Base
  onLimpiar: () => void
  className?: string
  // Elegidas que no se ven con la búsqueda puesta (MC-02): lo que se haga les llega también a ellas, y se dice.
  ocultas?: number
  onQuitarOcultas?: () => void
}) {
  const cuantas = elegidas.length
  return (
    <PageActionBar className={cn('z-20 mx-auto mt-0 w-max max-w-full gap-2 py-2 pr-2 pl-3 animate-in fade-in slide-in-from-bottom-4 duration-200', className)}>
      <div className="flex items-center gap-2.5 pr-1" role="status">
        <span className="flex flex-col">
          <Text as="span" size="sm" weight="medium" className="whitespace-nowrap tabular-nums">
            {cuantas.toLocaleString('es-CO')} {cuantas === 1 ? 'elegida' : 'elegidas'}
          </Text>
          {ocultas && onQuitarOcultas ? (
            <Button variant="link" size="xs" className="h-auto! justify-start! p-0!" onClick={onQuitarOcultas}>
              {ocultas === 1 ? '1 no se ve con esta búsqueda: quitarla' : `${ocultas.toLocaleString('es-CO')} no se ven con esta búsqueda: quitarlas`}
            </Button>
          ) : null}
        </span>
      </div>

      <Separator orientation="vertical" className="h-6!" />

      {/* «⋯» primero de las acciones, a la izquierda de todo: «⋯» · terciario · secundario · primario (25 sep). */}
      <DropdownMenu>
        <Hint label="Más acciones" side="top">
          <DropdownMenuTrigger render={<BotonIcono size="icon" aria-label="Más acciones con las elegidas" />}>
            <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
          </DropdownMenuTrigger>
        </Hint>
        <DropdownMenuContent side="top" align="start" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => base.exportar(elegidas)}>
              <HugeiconsIcon icon={Download04Icon} size={16} />
              Exportar a CSV
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem variant="destructive" onClick={() => base.eliminar(elegidas)}>
              <HugeiconsIcon icon={Delete02Icon} size={16} />
              Eliminar sus datos
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button variant="ghost" onClick={() => base.etiquetar(elegidas)}>
        <HugeiconsIcon icon={Tag01Icon} size={16} />
        Etiquetas
      </Button>
      <Button variant="ghost" onClick={() => base.escribir(elegidas)}>
        <HugeiconsIcon icon={Mail01Icon} size={16} />
        Escribirles
      </Button>

      <Separator orientation="vertical" className="h-6!" />

      <Button onClick={() => base.postular(elegidas)}>
        <HugeiconsIcon icon={UserSharingIcon} size={16} />
        Postular a…
      </Button>
      <Hint label="Quitar la selección" side="top">
        <BotonIcono size="icon" aria-label="Quitar la selección" onClick={onLimpiar}>
          <HugeiconsIcon icon={Cancel01Icon} size={16} />
        </BotonIcono>
      </Hint>
    </PageActionBar>
  )
}
