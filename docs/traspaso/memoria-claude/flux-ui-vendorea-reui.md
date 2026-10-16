---
name: flux-ui-vendorea-reui
description: "flux-ui copia ReUI literalmente por dentro, así que los ejemplos de reui.io sirven como plantilla 1:1."
metadata: 
  node_type: memory
  type: project
  originSessionId: 06ede155-c0a3-4442-8631-c8aae781786a
  modified: 2026-09-09T20:59:59.528Z
---

Buena parte de @ubits/flux-ui está vendorizada VERBATIM desde ReUI bajo
`dist/components/reui/*` (alert, filters, data-grid, frame, stepper, timeline, icon-tile,
gantt, kanban…). Los barriles de `dist/components/<nombre>/index.d.ts` lo dicen en sus
comentarios y son la única capa que aplica el prefijo `Fx`, publicando también los nombres sin
prefijo.

**Por qué importa:** un bloque o ejemplo de reui.io se puede usar como plantilla de estructura
casi sin traducir, que es justo lo que hace la skill `reui-to-flux-ui` del repo.

**Cómo aplicarlo:** al maquetar desde un ejemplo de ReUI, importar los nombres sin prefijo
desde `@ubits/flux-ui` y contrastar props con el `.d.ts` correspondiente. Ojo con
[[flux-ui-mcp-catalogo-incompleto]]: varios de estos componentes no aparecen en el MCP.
