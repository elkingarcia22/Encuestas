import { HugeiconsIcon } from '@hugeicons/react'
import { Moon02Icon, Sun03Icon } from '@hugeicons/core-free-icons'
import { Button, useTheme } from '@ubits/flux-ui'

export function ThemeToggle() {
  const { mode, setMode } = useTheme()
  const isDark = mode === 'dark'

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-sm"
      onClick={() => setMode(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Activar tema claro' : 'Activar tema oscuro'}
    >
      <HugeiconsIcon icon={isDark ? Sun03Icon : Moon02Icon} size={16} />
    </Button>
  )
}
