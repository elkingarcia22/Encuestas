---
name: sidebar-flux-ui-trampas
description: "Dos trampas del Sidebar de flux-ui: --sidebar-width solo obedece por style, y .cn-sidebar-menu-badge del tema impide que el badge se oculte al colapsar."
metadata: 
  node_type: memory
  type: project
  originSessionId: 06ede155-c0a3-4442-8631-c8aae781786a
  modified: 2026-09-09T22:14:06.924Z
---

Medido el 2026-09-09 montando `app-shell-3` en
`src/modules/design-system/templates/app-shell-3/`.

**1. El ancho del sidebar no se puede fijar con una clase.**
`SidebarProvider` escribe `--sidebar-width` y `--sidebar-width-icon` como **estilo en
línea** en el wrapper, así que `className="[--sidebar-width:272px]"` nunca gana. Hay que
pasarlo por `style={{ '--sidebar-width': '272px' } as CSSProperties}`, que el componente
mezcla después de sus valores por defecto. `app-shell-2` tiene el mismo problema latente:
su `[--sidebar-width:260px]` no aplica y se queda en los 16rem por defecto.

**2. El badge no se oculta al colapsar el sidebar.**
`SidebarMenuBadge` trae `group-data-[collapsible=icon]:hidden`, pero la clase
`.cn-sidebar-menu-badge` del tema le gana en la cascada y deja `display: flex`. Resultado:
en modo icono el badge se desborda del carril. Comprobado con dos elementos de prueba
idénticos salvo esa clase: sin ella `display: none`, con ella `display: flex`.
Workaround usado: leer `state` de `useSidebar()` y no montar el badge cuando vale
`'collapsed'`. Es un fallo de la librería, no del tema del proyecto.

**Además:** los tokens de gráfico se usan como `var(--chart-2)`, no `var(--color-chart-2)`
— el tema los declara dentro de `@theme inline`, que no publica las variables en `:root`.

Ver también [[accent-igual-a-primary]] y [[flux-ui-vendorea-reui]].
