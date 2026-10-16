import { HugeiconsIcon } from '@hugeicons/react'
import { Moon02Icon, Sun03Icon } from '@hugeicons/core-free-icons'
import { ToggleGroup, ToggleGroupItem, useTheme } from '@ubits/flux-ui'

// Elegido: elevado como un botón outline (fondo, filo y sombra), igual que antes de pasar a ToggleGroup.
const ITEM =
  'h-7! w-9! min-w-0! rounded-full! border! border-transparent! p-0! [&_svg]:size-4! aria-pressed:border-border! aria-pressed:bg-background! aria-pressed:shadow-xs! dark:aria-pressed:border-input! dark:aria-pressed:bg-input/30!'

// Switch de tema sol/luna. Medidas del prototipo: bandeja de 80×34 con padding
// de 3px y dos pastillas de 36×28; la activa va elevada y con el icono en azul.
export function ThemeSwitch() {
  const { mode, setMode } = useTheme()
  const isDark = mode === 'dark'

  return (
    <ToggleGroup
      value={[isDark ? 'dark' : 'light']}
      onValueChange={(value) => {
        if (value[0]) setMode(value[0] as 'light' | 'dark')
      }}
      spacing={0.5}
      aria-label="Tema"
      className="w-fit shrink-0 rounded-full! bg-muted p-[3px]"
    >
      <ToggleGroupItem value="light" aria-label="Tema claro" className={ITEM}>
        <HugeiconsIcon icon={Sun03Icon} size={16} className={isDark ? 'text-muted-foreground' : 'text-primary'} />
      </ToggleGroupItem>
      <ToggleGroupItem value="dark" aria-label="Tema oscuro" className={ITEM}>
        <HugeiconsIcon icon={Moon02Icon} size={16} className={isDark ? 'text-primary' : 'text-muted-foreground'} />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
