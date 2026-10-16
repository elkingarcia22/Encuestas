import type { ReactElement } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { LibraryIcon, PlusSignIcon } from '@hugeicons/core-free-icons'
import { Badge, DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger, Progress, Text, cn } from '@ubits/flux-ui'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { Hint } from '@/shared/components/Hint'
import { TOTAL_WEIGHT } from '../../../modelo/constructor/cicloBuilderTypes'
import type { AssignmentSetSummary } from '../../../modelo/constructor/assignmentRows'

// Las marcas que comparten las dos vistas del paso (agrupaciones y lista) y el panel de asignación: el peso repartido
// de una agrupación, si está lista, de qué agrupación viene una fila y el menú con las tres formas de traer objetivos.
// Van juntas para que las dos vistas digan lo mismo con las mismas piezas.

/** De dónde salen los objetivos de una asignación nueva: a mano, del banco, con IA o ya escritos por una plantilla. */
export type IntencionAsignacion = 'manual' | 'banco' | 'ia' | 'plantilla'

/** El color del número del peso: verde al cerrar el cupo, rojo al pasarse (o al intentar avanzar sin cerrarlo). */
function tonoPeso(peso: number, cupo: number, conErrores = false) {
  if (peso === cupo) return 'text-success'
  if (peso > cupo || conErrores) return 'text-destructive'
  return 'text-muted-foreground'
}

/** Cuánto lleva repartido una agrupación de su cupo: la barra y «{peso} / {cupo} %». */
export function MedidorPeso({ peso, cupo, conErrores = false, etiqueta, className }: { peso: number; cupo: number; conErrores?: boolean; etiqueta?: string; className?: string }) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      {etiqueta ? (
        <Text as="span" size="xs" variant="muted">
          {etiqueta}
        </Text>
      ) : null}
      <Progress value={Math.min(100, (peso / Math.max(1, cupo)) * 100)} className="w-20" aria-label={`Peso repartido: ${peso} de ${cupo} %`} />
      <Text as="span" size="xs" weight="semibold" className={cn('whitespace-nowrap tabular-nums', tonoPeso(peso, cupo, conErrores))}>
        {peso} / {cupo} %
      </Text>
    </span>
  )
}

/** «Lista», o la primera razón por la que todavía no lo está (en rojo solo después de intentar avanzar). */
export function EstadoAgrupacion({ problema, conErrores, className }: { problema: string | null; conErrores: boolean; className?: string }) {
  const insignia = (
    <Badge variant={problema === null ? 'success-light' : conErrores ? 'destructive-light' : 'outline'} size="sm" className={cn('max-w-48 truncate', className)} tabIndex={problema === null ? undefined : 0}>
      {problema ?? 'Lista'}
    </Badge>
  )
  // La razón completa en la ayuda: en la insignia puede quedar cortada.
  return problema === null ? insignia : <Hint label={problema}>{insignia}</Hint>
}

/** De qué agrupación viene una fila de la lista, y con cuántos la comparte. */
export function OrigenAgrupacion({ resumen }: { resumen: AssignmentSetSummary }) {
  const detalle = resumen.isShared
    ? `Compartida con ${resumen.set.targetIds.length - 1} más`
    : resumen.set.kind === 'grupal'
      ? 'Solo para este grupo'
      : 'Solo para esta persona'
  return (
    <span className="flex min-w-0 flex-col">
      <Text as="span" size="sm" weight="medium">
        Agrupación {resumen.position}
      </Text>
      <Text as="span" size="xs" variant="muted" className="truncate">
        {detalle}
        {resumen.budget !== TOTAL_WEIGHT ? ` · cupo de ${resumen.budget} %` : ''}
      </Text>
    </span>
  )
}

function Opcion({ titulo, descripcion }: { titulo: string; descripcion: string }) {
  return (
    <span className="flex min-w-0 flex-col">
      <Text as="span" size="sm" weight="medium">
        {titulo}
      </Text>
      <Text as="span" size="xs" variant="muted">
        {descripcion}
      </Text>
    </span>
  )
}

/**
 * Las tres formas de traer objetivos, en un menú con su renglón de explicación: el de «Crear asignación» en el paso y
 * el de «Añadir objetivo» dentro del panel. La de IA va al final, como los botones de IA en una fila.
 */
export function MenuCrear({ disparador, onElegir, sinIa = false }: { disparador: ReactElement; onElegir: (intencion: Exclude<IntencionAsignacion, 'plantilla'>) => void; sinIa?: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={disparador} />
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => onElegir('manual')}>
            <HugeiconsIcon icon={PlusSignIcon} aria-hidden="true" />
            <Opcion titulo="Crear manualmente" descripcion="Redacta un objetivo desde cero." />
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onElegir('banco')}>
            <HugeiconsIcon icon={LibraryIcon} aria-hidden="true" />
            <Opcion titulo="Elegir del banco" descripcion="Objetivos ya escritos por área y tema." />
          </DropdownMenuItem>
          {/* Con el agente ya acoplado no se ofrece abrir otro: el que está abierto es la única conversación. */}
          <DropdownMenuItem disabled={sinIa} onClick={() => onElegir('ia')}>
            <IconoIA />
            <Opcion titulo="Proponer con IA" descripcion="Genera una propuesta base." />
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
