---
name: flux-ui-mcp-catalogo-incompleto
description: El MCP de flux-ui lista solo 69 de los 89 componentes reales; hay que verificar contra node_modules antes de decir que algo no existe.
metadata: 
  node_type: memory
  type: project
  originSessionId: 06ede155-c0a3-4442-8631-c8aae781786a
  modified: 2026-09-10T16:36:46.810Z
---

En @ubits/flux-ui 0.5.5 (verificado el 2026-09-09), el MCP `flux-ui` sirve un catálogo
incompleto: `list_components` devuelve 69 componentes, pero el barril real
(`node_modules/@ubits/flux-ui/dist/components/index.d.ts`) exporta 89. `get_component`,
`get_exports` y `search_components` beben del mismo `dist/manifest.json`, así que los 20
faltantes son invisibles para todas las herramientas del MCP.

Faltan: alert, cascader, code-block, data-grid, filters, frame, gantt, icon-stack, icon-tile,
kanban, number-field, phone-input, rating, scrollspy, sortable, spinner, stepper, timeline,
toast, tree.

Causa: `scripts/generate-manifest.js` (líneas 176-184) descarta toda carpeta cuyo único archivo
sea `index.ts`. Esos 20 son justo los barriles que solo re-exportan desde `reui/` o `ui/`. El
mapa de categorías del propio generador ya los nombra, así que es un descuido, no una decisión.
Solo el equipo de librería puede arreglarlo (`npm run build:manifest` con su código fuente).

**Por qué importa:** la regla 1 de AGENTS.md dice parar y avisar si el MCP no tiene el
componente. Siguiéndola al pie de la letra se pediría a librería cosas que ya existen (Alert,
Spinner, Toast, Stepper, Filters, DataGrid).

**Cómo aplicarlo:** desde el 2026-09-10 la fuente fiable es `ai-tools/flux-ui/catalogo.json`
(89 componentes cruzados con el índice del Storybook, búsqueda en español). Lo genera
`ai-tools/flux-ui/generar-catalogo.mjs` y lo hacen cumplir los hooks de `.claude/settings.json`.
Ojo: el Storybook documenta 5 componentes que la versión instalada no trae (FileUpload,
ActionRail, AnimatedIcon, DualDateRangePicker, Icon) — están en `soloEnStorybook`.
Además `search_components` del MCP solo entiende inglés: "tabla" devuelve vacío.
Ver también [[flux-ui-vendorea-reui]].
