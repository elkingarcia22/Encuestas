import type { CSSProperties, ReactNode } from 'react'
import { NavigationType, UNSAFE_LocationContext } from 'react-router'
import { SidebarInset, SidebarProvider, cn } from '@ubits/flux-ui'
import { AppFooter } from '@/shared/components/AppFooter'
import { AppHeader } from '@/shared/components/AppHeader'
import { PageAmbience } from '@/shared/components/PageAmbience'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { AppSidebar } from '@/shared/layouts/AppSidebar'

// «Probar en pantalla» con el marco de verdad: la barra lateral, la barra de arriba, el ambiente azul y el pie son los
// componentes reales del producto, no réplicas. Se les hace creer que están en una ruta del producto (`ruta`), así la
// barra muestra el menú del Workspace o el historial de Suite AI —y no el del design system— y la miga dice lo mismo
// que en la pantalla real (Nicolás, 22 sep: «que al dar clic en probar en pantalla sí muestre la realidad»).
//
// La ruta se simula dándole a esta parte su propia ubicación: `<Routes location>` no sirve porque React Router exige
// que cuelgue de la página actual (/design-system/…). Solo cambia lo que leen la barra, la miga y el ambiente; los
// enlaces siguen navegando de verdad.
//
// Es el mismo armado que RootLayout. Dos diferencias, solo de posición: la barra lateral se ancla a este marco y no a
// la ventana (vive dentro de la capa de «Probar», debajo de su franja), y los paneles de la derecha llegan por `panel`
// y `agente` en vez de los huecos `#right-panel-slot` y `#agent-panel-slot`, que ya existen en la página de fondo.
const sidebarWidth = { '--sidebar-width': '18rem' } as CSSProperties

export function PantallaReal({
  ruta,
  panel,
  agente,
  children,
}: {
  // Ruta del producto que se simula: decide el menú, la miga y si lleva el ambiente azul.
  ruta: string
  // Panel a toda la altura a la derecha, junto al header (actividad del agente en el chat de Orbit).
  panel?: ReactNode
  // Orbit: a la derecha, debajo del header. El header no se mueve al abrirlo (8 oct).
  agente?: ReactNode
  children: ReactNode
}) {
  const ubicacion = { pathname: ruta, search: '', hash: '', state: null, key: 'probar-en-pantalla' }
  return (
    <UNSAFE_LocationContext.Provider value={{ location: ubicacion, navigationType: NavigationType.Pop }}>
      <SidebarProvider
        style={sidebarWidth}
        className="relative h-full min-h-0! [&_[data-slot=sidebar-container]]:absolute! [&_[data-slot=sidebar-container]]:h-full!"
      >
        <AppSidebar />
        <SidebarInset className="h-full min-h-0 min-w-0 flex-row! overflow-hidden">
          <div className="flex min-w-0 flex-1 flex-col">
            <AppHeader />
            <div className="@container relative flex min-h-0 flex-1">
              <div className="relative isolate flex min-h-0 min-w-0 flex-1 flex-col overflow-auto">
                <PageAmbience />
                <div className="flex h-full min-h-0 flex-1 flex-col p-6">
                  {children}
                  <AppFooter siempre />
                </div>
              </div>
              {agente}
            </div>
          </div>
          {panel}
        </SidebarInset>
      </SidebarProvider>
    </UNSAFE_LocationContext.Provider>
  )
}

// Contenido tenue: lo que va en lugar del slot rayado cuando se prueba en pantalla. Bloques grises muy suaves que se
// leen como contenido real sin distraer del componente que se está probando.
export function ContenidoTenue({ filas = 6, className }: { filas?: number; className?: string }) {
  return (
    <div aria-hidden="true" className={cn('flex min-h-0 flex-1 flex-col gap-3', className)}>
      <div className="h-9 w-64 max-w-full shrink-0 rounded-lg bg-foreground/6" />
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 rounded-xl border bg-muted/30 p-4">
        {Array.from({ length: filas }, (_, index) => (
          <div key={index} className="h-7 shrink-0 rounded-md bg-foreground/5" />
        ))}
      </div>
    </div>
  )
}

// Una pantalla del Workspace de fondo, con su cabecera real, para probar encima lo que se abre sobre ella: un drawer o
// una ventana. Eso que se abre va fuera de esta capa, al lado: dentro, la librería no pinta el velo que oscurece el fondo.
export function PantallaDeFondo({ ruta, titulo, descripcion }: { ruta: string; titulo: string; descripcion?: string }) {
  return (
    <PantallaReal ruta={ruta}>
      <PageShell>
        <PageHeader title={titulo} description={descripcion} />
        <PageContent>
          <ContenidoTenue />
        </PageContent>
      </PageShell>
    </PantallaReal>
  )
}
