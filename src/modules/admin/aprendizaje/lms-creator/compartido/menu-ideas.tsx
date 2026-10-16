import { HugeiconsIcon } from '@hugeicons/react'
import { Idea01Icon } from '@hugeicons/core-free-icons'
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger, Text } from '@ubits/flux-ui'

// «Ideas» — el menú que sugiere el primer prompt en Crear video con IA, Presentación interactiva y Roleplay.
//
// Antes las ideas eran chips encima de la caja de la IA. En la columna real (314px) se partían en cinco filas, 164px
// de alto, y la etiqueta del chip no dejaba ver qué prompt iba a escribir. Aquí van en un menú colgado de un botón
// pequeño al lado de la etiqueta: no ocupa alto, cada idea enseña su prompt, y el campo sigue siendo el texto libre
// —el menú solo inserta, no finge ser el valor del campo, que es lo que pasaba al probarlo con un desplegable
// (lab de ideas, 1-oct).
//
// Secundario, no fantasma: al lado de la etiqueta de un campo, un botón sin caja se leía como parte del texto y no
// como algo en lo que se puede entrar (Dave, 5-oct).

export type IdeaSugerida = { label: string; prompt: string }

export function MenuIdeas({ ideas, onElegir }: { ideas: IdeaSugerida[]; onElegir: (prompt: string) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="xs" />}>
        <HugeiconsIcon icon={Idea01Icon} size={14} />
        Ideas
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          {ideas.map((idea) => (
            <DropdownMenuItem key={idea.label} className="items-start gap-2 py-2" onClick={() => onElegir(idea.prompt)}>
              <span className="flex min-w-0 flex-col gap-0.5">
                <Text as="span" size="sm" weight="medium">
                  {idea.label}
                </Text>
                {/* `line-clamp-2`: el navegador corta al final del segundo renglón. Recortar por número de caracteres
                    dejaba los puntos suspensivos a mitad de la segunda línea. */}
                <Text as="span" size="xs" variant="muted" className="line-clamp-2 whitespace-normal">
                  {idea.prompt}
                </Text>
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
