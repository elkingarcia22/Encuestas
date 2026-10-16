import { useEffect, useState, type CSSProperties } from 'react'
import { Outlet, useLocation } from 'react-router'
import { SidebarInset, SidebarProvider } from '@ubits/flux-ui'
import { AppFooter } from '@/shared/components/AppFooter'
import { AppHeader } from '@/shared/components/AppHeader'
import { PageAmbience } from '@/shared/components/PageAmbience'
import { Toaster } from '@/shared/components/notify'
import { CollapsedSidebarRail } from '@/shared/components/SidebarRail'
import { AppSidebar } from '@/shared/layouts/AppSidebar'
import { getBreadcrumbs } from '@/shared/layouts/nav-config'

// Marco general: barra lateral de 288px + header de 60px + contenido a todo el
// ancho (sin tarjeta flotante). Los avisos («toasts») se montan una sola vez aquí.
const sidebarWidth = { '--sidebar-width': '18rem' } as CSSProperties

// La barra lateral recuerda si el usuario la dejó abierta o cerrada: no cambia al navegar ni al recargar,
// solo con el botón de abrir/cerrar. La librería escribe una cookie pero no la lee, por eso se guarda aquí.
const SIDEBAR_KEY = 'playground:sidebar-open'

function readSidebarOpen() {
  try {
    return window.localStorage.getItem(SIDEBAR_KEY) !== 'false'
  } catch {
    return true
  }
}

// Bajo este ancho de ventana la barra se pliega sola al riel: así el contenido conserva el ancho de diseño
// (1140px) en portátiles chicos y tablets. Al volver a una ventana grande recupera lo que la persona eligió.
const NARROW_WINDOW = 1200

export function Component() {
  const [sidebarOpen, setSidebarOpen] = useState(readSidebarOpen)
  const { pathname } = useLocation()

  // Título de la pestaña con el nombre de la pantalla (AA 2.4.2): antes todas se llamaban «Playground UX».
  useEffect(() => {
    const crumbs = getBreadcrumbs(pathname)
    const page = crumbs.at(-1)?.label
    document.title = page ? `${page} · Playground UX` : 'Playground UX'
  }, [pathname])

  useEffect(() => {
    const narrow = window.matchMedia(`(max-width: ${NARROW_WINDOW - 1}px)`)
    const apply = () => setSidebarOpen(narrow.matches ? false : readSidebarOpen())
    apply()
    narrow.addEventListener('change', apply)
    return () => narrow.removeEventListener('change', apply)
  }, [])

  const changeSidebar = (open: boolean) => {
    setSidebarOpen(open)
    try {
      window.localStorage.setItem(SIDEBAR_KEY, String(open))
    } catch {
      // Sin almacenamiento disponible solo se pierde el recuerdo entre recargas.
    }
  }

  return (
    // Animación de abrir/cerrar desde el riel: cerrada, la barra reserva los 72px del riel (no 0) y queda escondida justo
    // detrás de él (su borde derecho en 72px). Al abrir sale desde el borde del riel y se estira hasta 288px mientras el
    // contenido se corre sin brincos. Solo toca ancho, posición y duración (layout), no la apariencia.
    <SidebarProvider
      style={sidebarWidth}
      open={sidebarOpen}
      onOpenChange={changeSidebar}
      className="[&_[data-collapsible=offcanvas]_[data-slot=sidebar-container]]:left-[calc(4.5rem-var(--sidebar-width))]! [&_[data-collapsible=offcanvas]_[data-slot=sidebar-gap]]:w-18! [&_[data-slot=sidebar-container]]:duration-300! [&_[data-slot=sidebar-container]]:ease-[cubic-bezier(0.32,0.72,0,1)]! [&_[data-slot=sidebar-gap]]:duration-300! [&_[data-slot=sidebar-gap]]:ease-[cubic-bezier(0.32,0.72,0,1)]!"
    >
      <AppSidebar />
      {/* Con la barra lateral cerrada queda el riel de iconos (mismas opciones del menú) en lugar de nada. */}
      <CollapsedSidebarRail />
      <SidebarInset className="h-svh max-h-svh min-w-0 flex-row! overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader />
          {/* `@container`: el panel de Orbit Flow se mide contra esta fila (no contra la ventana) y se angosta a 360px o pasa
              a todo lo ancho en el celular (OF-48). `relative`: en el celular va encima del contenido, dentro de la fila. */}
          <div className="@container relative flex min-h-0 flex-1">
            {/* `div` y no `main`: el contenedor de la librería (SidebarInset) ya es el `main` de la página y quedaban dos
                regiones principales, una dentro de la otra. */}
            <div className="relative isolate flex min-h-0 min-w-0 flex-1 flex-col overflow-auto">
              {/* Ambiente azul de la marca: arranca pegado al header y a todo el ancho, por debajo de todo. */}
              <PageAmbience />
              {/* 24px de aire alrededor del contenido; cada pantalla se centra en 1140 como máximo (PageShell). Con 6px el
                  contenido quedaba pegado a los bordes (probado y descartado el 16 sep). */}
              <div className="flex h-full min-h-0 flex-1 flex-col p-6">
                <Outlet />
                {/* Pie común al final de cada pantalla (tecnología UBITS y legales). */}
                <AppFooter />
              </div>
            </div>
            {/* Hueco de Orbit Flow (el agente contextual): debajo del header, a la derecha del contenido. El header no se
                mueve ni se acorta al abrirlo (8 oct, Nicolás: «el header debería mantenerse donde está, y el agente
                contextual abajo del header»). Las pantallas lo llenan con un portal; vacío no ocupa espacio. */}
            <div id="agent-panel-slot" className="contents" />
          </div>
        </div>
        {/* Hueco para paneles que ocupan toda la derecha de arriba abajo, al lado del header (como «Actividad del
            agente» del chat de Orbit, copiada del prototipo). Las pantallas lo llenan con un portal; vacío no ocupa
            espacio. Orbit Flow no va aquí: va en `#agent-panel-slot`, debajo del header. */}
        <div id="right-panel-slot" className="contents" />
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  )
}

Component.displayName = 'RootLayout'
