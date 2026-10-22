import { useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Queue02Icon, Search01Icon } from '@hugeicons/core-free-icons'
import { useLocation } from 'react-router'
import { Button, Kbd, KbdGroup, SidebarTrigger, TooltipProvider, cn, useSidebar } from '@ubits/flux-ui'
import { ChangelogDialog } from '@/shared/components/Announcements'
import { CommandPalette } from '@/shared/components/CommandPalette'
import { GlobalBanner } from '@/shared/components/GlobalBanner'
import { Hint } from '@/shared/components/Hint'
import { NovedadesButton } from '@/shared/components/NovedadesButton'
import { NotificationsPopover } from '@/shared/components/NotificationsPopover'
import { ProcessCenter } from '@/shared/components/ProcessCenter'
import { useLiveProcesses } from '@/shared/components/process-store'
import { ProfilePopover } from '@/shared/components/ProfilePopover'
import { HEADER_ICON } from '@/shared/components/header-icon'
import { useCommandPalette } from '@/shared/components/useCommandPalette'
import { PageBreadcrumbs } from '@/shared/components/PageShell'
import { usePageCrumbs } from '@/shared/components/page-crumbs'
import { getBreadcrumbs } from '@/shared/layouts/nav-config'

// Header de 60px: plegar + título a la izquierda, buscador al centro y a la derecha novedades, notificaciones, procesos
// y perfil (avatar circular aparte). Ayuda pasó al menú de perfil (1 oct); Procesos se ocultó el 1 oct y volvió el
// 13 oct. Todas las acciones menos el buscador llevan su nombre en un tooltip.
//
// El buscador queda siempre en el centro exacto: el header es una grilla de tres columnas con las dos de los lados
// del mismo ancho. Para que las acciones de la derecha nunca se salgan de su columna, el buscador mide como mucho
// el ancho del header menos dos veces lo que ocupan las acciones (251px con Novedades completo, 166px solo con
// iconos) y los dos espacios entre columnas (28px). Con el header angosto (menos de 55rem, p. ej. con un panel a toda
// la derecha) Novedades queda solo con su icono; por debajo de 39rem el buscador pasa a ser una lupa.
export function AppHeader() {
  const { pathname } = useLocation()
  const palette = useCommandPalette()
  const { open: sidebarOpen } = useSidebar()
  // Las de la pantalla si registró las suyas (puede estar más adentro de lo que el menú conoce); si no, las del menú.
  const propias = usePageCrumbs()
  const crumbs = propias ?? getBreadcrumbs(pathname)
  const title = crumbs.at(-1)?.label ?? 'Ubits'
  const sidebarLabel = sidebarOpen ? 'Cerrar menú' : 'Abrir menú'

  return (
    <TooltipProvider delay={200}>
      <CommandPalette open={palette.open} onOpenChange={palette.setOpen} returnFocus={palette.returnFocus} />
      {/* Angosto (menos de 33rem, p. ej. un teléfono) no cabían los tres bloques y los botones quedaban unos encima de otros
          (AA 1.4.10): la grilla pasa a fila con menos aire y, por debajo de 24rem, el título se oculta a la vista (lo sigue
          leyendo el lector de pantalla). */}
      <header className="@container grid h-15 shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3.5 border-b px-5 max-[33rem]:flex max-[33rem]:gap-2 max-[33rem]:px-3">
        <div className="flex min-w-0 items-center gap-2 max-[33rem]:flex-1">
          <Hint label={sidebarLabel}>
            <SidebarTrigger variant="outline" size="icon-sm" aria-label={sidebarLabel} className={cn('size-7.5!', HEADER_ICON)} />
          </Hint>
          {/* Miga de pan pegada al botón de la barra lateral. Con un solo nivel (el Inicio) va el nombre a secas. */}
          {crumbs.length > 1 ? (
            <PageBreadcrumbs items={crumbs} compact />
          ) : (
            <h1 className="truncate text-sm font-normal max-[24rem]:sr-only">{title}</h1>
          )}
        </div>

        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-[min(21.25rem,calc(100cqw_-_530px))] justify-start gap-2 px-3 font-normal text-muted-foreground @max-[55rem]:w-[min(21.25rem,calc(100cqw_-_360px))] @max-[39rem]:hidden"
            onClick={() => palette.setOpen(true)}
          >
            <HugeiconsIcon icon={Search01Icon} size={16} className="shrink-0" />
            <span className="min-w-0 flex-1 truncate text-left">Buscar o ir a…</span>
            <KbdGroup>
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            className="hidden @max-[39rem]:inline-flex"
            aria-label="Buscar o ir a"
            onClick={() => palette.setOpen(true)}
          >
            <HugeiconsIcon icon={Search01Icon} size={17} />
          </Button>
        </div>

        <HeaderActions />
      </header>
      {/* Banner global: debajo del header, fijo arriba del contenido (no se va con el scroll). */}
      <GlobalBanner />
    </TooltipProvider>
  )
}

// Acciones de la derecha de la barra superior (novedades, notificaciones, procesos y perfil) con los dos paneles
// que abren. Se exporta porque el editor de LMS dibuja su propia barra y debe llevar exactamente las mismas (18 sep).
export function HeaderActions() {
  const [processes, setProcesses] = useState(false)
  const processesRef = useRef<HTMLButtonElement>(null)
  const [changelog, setChangelog] = useState(false)
  // El Centro de procesos vuelve a la barra (Elkin, 14-oct): siempre a la vista para seguir una carga desde cualquier
  // página; sin nada en proceso abre su vacío del design system. El punto avisa que algo sigue corriendo.
  const vivos = useLiveProcesses()
  const enCurso = vivos.filter((proceso) => !proceso.done).length

  return (
    <>
      <ProcessCenter open={processes} onOpenChange={setProcesses} ancla={processesRef} />
      <ChangelogDialog open={changelog} onOpenChange={setChangelog} onOpenProcesses={() => setProcesses(true)} />
      <div className="flex items-center justify-end gap-2 max-[33rem]:gap-1.5">
          <NovedadesButton onClick={() => setChangelog(true)} />
          {/* Un solo botón de procesos (al unir los PR del 16-oct: Elkin lo devolvió el 14 y Carlos el 13): en azul
              mientras el centro está abierto, el panel se ancla a él y el punto avisa que algo sigue corriendo. */}
          <Hint label="Centro de procesos">
            <Button
              ref={processesRef}
              variant="outline"
              size="icon-sm"
              className={cn('relative', HEADER_ICON)}
              aria-label={enCurso ? `Centro de procesos, ${enCurso} en curso` : 'Centro de procesos'}
              aria-pressed={processes}
              onClick={() => setProcesses((v) => !v)}
            >
              <HugeiconsIcon icon={Queue02Icon} size={18} className="size-4.5" />
              {/* El punto avisa que algo sigue corriendo, como el de notificaciones sin leer. */}
              {enCurso ? <span aria-hidden="true" className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary" /> : null}
            </Button>
          </Hint>
          <NotificationsPopover onOpenProcesses={() => setProcesses(true)} onOpenChangelog={() => setChangelog(true)} />

          <ProfilePopover />
        </div>
    </>
  )
}
