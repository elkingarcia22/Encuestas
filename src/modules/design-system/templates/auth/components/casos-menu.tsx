import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon } from '@hugeicons/core-free-icons'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@ubits/flux-ui'
import { AUTH18_CASOS, useCasoAuth, type AuthCaso } from './casos'

// Control del playground, no del producto: salta a cualquier pantalla del acceso sin recorrer el flujo.
export function CasosMenu() {
  const [caso, irA] = useCasoAuth()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="cursor-pointer" />}>
        Casos de uso
        <HugeiconsIcon icon={ArrowDown01Icon} data-icon="inline-end" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Ver una pantalla del acceso</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={caso} onValueChange={(valor) => irA(valor as AuthCaso)}>
            {AUTH18_CASOS.map((item) => (
              <DropdownMenuRadioItem key={item.value} value={item.value} closeOnClick>
                {item.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
