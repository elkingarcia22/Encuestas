import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon, FolderExportIcon } from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  Text,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import type { SectionTreeEntry } from '../../../modelo/sectionTree'
import { NIVEL } from './contexto'
import { TextoCompleto } from '@/shared/components/TextoCompleto'

// Piezas que comparten las secciones, las subsecciones y las preguntas del paso 4.

/** «Mover a…»: la lista solo trae destinos posibles, así que no hay forma de romper el árbol. */
export function MoverA({
  que,
  destinos,
  sinDestinos,
  onMover,
  destinosDentro = [],
  onMoverDentro,
}: {
  que: string
  destinos: readonly SectionTreeEntry[]
  sinDestinos: string
  onMover: (destino: SectionTreeEntry) => void
  /** Solo las subsecciones: pasar a ser la última hija de otra sección. Cambiar de sección es esto; «debajo de» solo reordena entre hermanas. */
  destinosDentro?: readonly SectionTreeEntry[]
  onMoverDentro?: (destino: SectionTreeEntry) => void
}) {
  const hayDentro = destinosDentro.length > 0 && onMoverDentro !== undefined
  const sinNada = destinos.length === 0 && !hayDentro
  const boton = (
    <BotonIcono aria-label={`Mover ${que} a otra sección`} disabled={sinNada}>
      <HugeiconsIcon icon={FolderExportIcon} aria-hidden="true" />
    </BotonIcono>
  )
  if (sinNada) {
    return (
      <Hint label={sinDestinos}>
        <span>{boton}</span>
      </Hint>
    )
  }
  const fila = (destino: SectionTreeEntry, alElegir: (destino: SectionTreeEntry) => void) => (
    <DropdownMenuItem key={destino.section.id} onClick={() => alElegir(destino)}>
      <Text as="span" size="sm" className="tabular-nums">
        {destino.numbering}
      </Text>
      <TextoCompleto texto={destino.section.title.trim() || "Sin título"}><Text as="span" size="sm" className="min-w-0 flex-1 truncate">
        {destino.section.title.trim() || 'Sin título'}
      </Text></TextoCompleto>
      <Badge variant="outline" size="xs">
        {NIVEL[destino.depth]}
      </Badge>
    </DropdownMenuItem>
  )
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={boton} />
      <DropdownMenuContent align="end" className="max-h-80 w-72">
        {hayDentro ? (
          <DropdownMenuGroup>
            <DropdownMenuLabel>Mover dentro de…</DropdownMenuLabel>
            {destinosDentro.map((destino) => fila(destino, onMoverDentro))}
          </DropdownMenuGroup>
        ) : null}
        {destinos.length > 0 ? (
          <DropdownMenuGroup>
            <DropdownMenuLabel>{hayDentro ? 'Mover debajo de…' : 'Mover a…'}</DropdownMenuLabel>
            {destinos.map((destino) => fila(destino, onMover))}
          </DropdownMenuGroup>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Borrar: siempre se confirma en la ventana corta del sistema (ActionDialog), que abre el paso; ya no dentro de la fila. */
// `secundario`: con borde y del alto de un campo, para ir junto al título que se está editando (el secundario del DS).
export function BotonBorrar({ que, bloqueo, onBorrar, secundario = false }: { que: string; bloqueo: string | null; onBorrar: () => void; secundario?: boolean }) {
  const boton = secundario ? (
    <Button variant="outline" size="icon" aria-label={`Eliminar ${que}`} className="text-destructive!" disabled={bloqueo !== null} onClick={onBorrar}>
      <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
    </Button>
  ) : (
    <BotonIcono aria-label={`Eliminar ${que}`} className="text-destructive!" disabled={bloqueo !== null} onClick={onBorrar}>
      <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
    </BotonIcono>
  )
  return bloqueo ? (
    <Hint label={bloqueo}>
      <span>{boton}</span>
    </Hint>
  ) : (
    boton
  )
}
