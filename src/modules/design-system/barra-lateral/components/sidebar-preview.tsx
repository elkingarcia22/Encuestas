import { HugeiconsIcon } from '@hugeicons/react'
import { SidebarLeftIcon } from '@hugeicons/core-free-icons'
import { Button, cn } from '@ubits/flux-ui'
import { HEADER_ICON } from '@/shared/components/header-icon'
import { getBreadcrumbs } from '@/shared/layouts/nav-config'
import { OpenSidebar } from './open-sidebar'
import { RailSidebar } from './rail-sidebar'
import { rowRoles, type SidebarPartProps } from './sidebar-config'
import styles from './sidebar-preview.module.css'

// La pantalla que queda al lado de la barra: bloques tenues, sin nombres (no es parte de la barra).
function PageBehind({ bare }: { bare?: boolean }) {
  return (
    <div aria-hidden="true" className="relative flex flex-1 flex-col gap-3 p-8">
      <div className="h-7 w-56 max-w-full rounded-md bg-foreground/10" />
      <div className="h-2.5 w-80 max-w-full rounded-full bg-foreground/7" />
      <div className="mt-4 flex flex-1 flex-col gap-2.5 rounded-xl border bg-background/70 p-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="h-7 rounded-md bg-foreground/5" />
        ))}
      </div>
      {bare ? null : <span className="text-xs text-muted-foreground">Pantalla</span>}
    </div>
  )
}

// Vista previa: la barra (abierta o en riel) y, a su lado, el header con el botón de menú y la pantalla de fondo.
// `full` es para «Probar en pantalla»: la maqueta ocupa todo el alto disponible en vez de su alto fijo.
export function SidebarPreview({ c, names, onChange, full }: SidebarPartProps & { full?: boolean }) {
  const open = c.state === 'open'
  const title = getBreadcrumbs(rowRoles(c).focus).at(-1)?.label ?? 'Inicio'

  return (
    <div
      className={cn(
        styles.preview,
        'relative flex rounded-2xl border bg-background text-foreground shadow-xs',
        full ? 'min-w-0 flex-1' : 'min-h-[46rem]',
      )}
    >
      {open ? <OpenSidebar c={c} names={names} onChange={onChange} /> : <RailSidebar c={c} names={names} onChange={onChange} />}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-15 shrink-0 items-center gap-2.5 border-b px-5">
          <Button
            data-region="Botón de menú"
            data-name-left=""
            variant="outline"
            size="icon-sm"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            className={cn('size-7.5!', HEADER_ICON)}
            onClick={() => onChange({ state: open ? 'rail' : 'open' })}
          >
            <HugeiconsIcon icon={SidebarLeftIcon} size={16} />
          </Button>
          <span className="truncate text-sm">{title}</span>
        </header>
        <PageBehind bare={full} />
      </div>
    </div>
  )
}
