---
name: templates-overlay-verificacion
description: Los templates a pantalla completa se montan encima del RootLayout; al verificar hay que acotar el DOM al overlay y capturar con Chrome headless por CDP.
metadata: 
  node_type: memory
  type: project
  originSessionId: 06ede155-c0a3-4442-8631-c8aae781786a
  modified: 2026-09-10T17:03:38.993Z
---

Los templates de `src/modules/design-system/templates/` que traen su propio shell
(shell-test, app-shell-2, app-shell-3, dashboard) se montan como
`<div className="fixed inset-0 z-50">` **encima** del RootLayout del playground, que sigue en
el DOM debajo con su propio sidebar, su `SidebarTrigger` y sus pestañas "Workspace / Agente IA".

**Por qué importa:** un `document.querySelector('[data-slot=sidebar-trigger]')` o buscar la
pestaña "Agente IA" encuentra primero la del playground, no la del template. Pasó dos veces
(2026-09-09 y 2026-09-10) y dio falsas conclusiones.

**Cómo aplicarlo:** acotar siempre las consultas con
`document.querySelector('.fixed.inset-0.z-50')` como raíz. Para capturas fiables usar Chrome
headless por CDP (el panel del navegador de Claude suele estar oculto y ahí ResizeObserver no
dispara). Relacionado: [[recharts-dos-versiones]], [[sidebar-flux-ui-trampas]].

Además, auditado el 2026-09-10: los componentes de `shell-test` sobrescriben la apariencia de
flux-ui (clases en SidebarProvider, avatares con radio/borde propios, punto de notificación
hecho a mano, `<h1>` con tamaño fijo). Solo `nav-list.tsx` y `sidebar-mode-tabs.tsx` están
limpios; el template `dashboard` reutiliza esos dos y rehace el resto.
