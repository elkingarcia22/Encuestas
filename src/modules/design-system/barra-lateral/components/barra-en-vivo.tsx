import { ScrollArea } from '@ubits/flux-ui'
import { OpenSidebar } from './open-sidebar'
import { RailSidebar } from './rail-sidebar'
import { SIDEBAR_CASES, type SidebarConfig } from './sidebar-config'

// La barra lateral en vivo dentro de una tarjeta del design system (Marco, Ajustes propios): la misma vista previa de
// Patrones › Barra lateral, que lee el menú de nav-config. Reemplaza las capturas: cambia sola con el tema y el modo
// oscuro. «alto» recorta la barra con scroll para mostrar solo la parte que interesa (p. ej. el selector de espacio).
// Sin el menú flotante del riel: en la vista previa quedaba abierto encima de la tarjeta.
const caso = (id: string): SidebarConfig => ({
  ...(SIDEBAR_CASES.find((item) => item.id === id) ?? SIDEBAR_CASES[0]).config,
  hover: 'none',
})
const sinCambios = () => undefined

export function BarraEnVivo({ id, alto = 'h-120' }: { id: string; alto?: string }) {
  const config = caso(id)
  return (
    <ScrollArea className={`mx-auto w-fit max-w-full rounded-xl border ${alto}`}>
      {config.state === 'open' ? (
        <OpenSidebar c={config} names={false} onChange={sinCambios} />
      ) : (
        <RailSidebar c={config} names={false} onChange={sinCambios} />
      )}
    </ScrollArea>
  )
}
