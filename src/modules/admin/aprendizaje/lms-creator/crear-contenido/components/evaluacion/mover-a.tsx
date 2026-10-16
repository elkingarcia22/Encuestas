import { HugeiconsIcon } from '@hugeicons/react'
import { FolderExportIcon } from '@hugeicons/core-free-icons'
import {
  Badge,
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
import type { EntradaSeccion } from './secciones'

/**
 * **Mover a otra sección.**
 *
 * Arrastrar solo reordena **entre hermanas**: sirve para subir una pregunta dentro de su sección, no para sacarla y
 * llevarla a otra. Para eso está este menú, igual que en el creador de encuestas de Desempeño y cultura, de donde
 * salen también las funciones que calculan los destinos (ver `secciones.ts`). Sin él, cambiar una pregunta de sección
 * obligaba a arrastrarla por media pantalla —o no se podía (Dave, 9-oct).
 */
const NIVEL = ['', 'Sección', 'Subsección']

export function MoverA({
  que,
  destinos,
  sinDestinos,
  onMover,
  destinosDentro = [],
  onMoverDentro,
}: {
  /** Qué se mueve, para el nombre del botón: «la pregunta 2», «la subsección 1.1». */
  que: string
  destinos: readonly EntradaSeccion[]
  /** Qué decir cuando no hay a dónde moverlo. */
  sinDestinos: string
  onMover: (destino: EntradaSeccion) => void
  /** Solo las subsecciones: pasar a ser la última hija de otra sección. Cambiar de sección es esto. */
  destinosDentro?: readonly EntradaSeccion[]
  onMoverDentro?: (destino: EntradaSeccion) => void
}) {
  const hayDentro = destinosDentro.length > 0 && onMoverDentro !== undefined
  const sinNada = destinos.length === 0 && !hayDentro
  const boton = (
    <BotonIcono aria-label={`Mover ${que} a otra sección`} disabled={sinNada}>
      <HugeiconsIcon icon={FolderExportIcon} aria-hidden="true" />
    </BotonIcono>
  )

  // Un botón apagado no dispara el globo de ayuda, así que el motivo se cuelga de un envoltorio.
  if (sinNada)
    return (
      <Hint label={sinDestinos}>
        <span>{boton}</span>
      </Hint>
    )

  const fila = (destino: EntradaSeccion, alElegir: (destino: EntradaSeccion) => void) => (
    <DropdownMenuItem key={destino.section.id} onClick={() => alElegir(destino)}>
      <Text as="span" size="sm" variant="muted" className="tabular-nums">
        {destino.numbering}
      </Text>
      <Text as="span" size="sm" className="min-w-0 flex-1 truncate">
        {destino.section.title.trim() || 'Sin título'}
      </Text>
      <Badge variant="outline" size="xs">
        {NIVEL[destino.depth] ?? 'Sección'}
      </Badge>
    </DropdownMenuItem>
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={boton} />
      {/* `DropdownMenuLabel` va dentro de su grupo o Base UI revienta (trampa conocida del catálogo). */}
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
