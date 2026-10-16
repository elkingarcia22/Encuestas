import { HugeiconsIcon } from '@hugeicons/react'
import { UserRemove01Icon } from '@hugeicons/core-free-icons'
import { Button, Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger, ScrollArea, Text } from '@ubits/flux-ui'
import { Persona } from '@/modules/design-system/data-grid/casos/seguimiento'
import type { Collaborator } from '../../../modelo/collaborators'

// Quién quedó fuera de un grupo elegido. El grupo sigue elegido como un todo («todos menos estas personas»);
// esta pieza lo hace visible en su fila: cuántas son, quiénes son y cómo devolverlas, una a una o todas.

export function PersonasExcluidas({
  grupo,
  personas,
  onIncluir,
}: {
  grupo: string
  personas: readonly Collaborator[]
  onIncluir: (ids: readonly string[]) => void
}) {
  const cuantas = personas.length
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="xs" aria-label={`Ver las ${cuantas} ${cuantas === 1 ? 'persona excluida' : 'personas excluidas'} de ${grupo}`}>
            <HugeiconsIcon icon={UserRemove01Icon} aria-hidden="true" />
            {cuantas} {cuantas === 1 ? 'excluida' : 'excluidas'}
          </Button>
        }
      />
      <PopoverContent align="end" className="w-80 gap-3">
        <PopoverHeader>
          <PopoverTitle>Excluidas de «{grupo}»</PopoverTitle>
          <PopoverDescription>El grupo sigue elegido, sin estas personas.</PopoverDescription>
        </PopoverHeader>
        <ScrollArea className="max-h-60">
          <ul className="flex flex-col gap-2 pe-3">
            {personas.map((persona) => (
              <li key={persona.id} className="flex items-center justify-between gap-2">
                <Persona nombre={persona.name} detalle={persona.email} />
                <Button variant="ghost" size="xs" className="shrink-0" onClick={() => onIncluir([persona.id])}>
                  Incluir
                </Button>
              </li>
            ))}
          </ul>
        </ScrollArea>
        {cuantas > 1 ? (
          <Button variant="outline" size="sm" onClick={() => onIncluir(personas.map((persona) => persona.id))}>
            Incluir a todas
          </Button>
        ) : null}
        <Text as="p" size="xs" variant="muted">
          También puedes volver a marcarlas en «Por persona».
        </Text>
      </PopoverContent>
    </Popover>
  )
}
