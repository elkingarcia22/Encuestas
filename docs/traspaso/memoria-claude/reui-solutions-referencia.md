---
name: reui-solutions-referencia
description: Cómo estudiar los bloques Solutions de ReUI sin licencia y el nivel visual que el usuario espera en los dashboards.
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 9b6ec876-7655-459c-8d46-b59dd878042e
  modified: 2026-09-13T04:06:15.125Z
---

El 2026-09-11 el usuario rechazó el primer dashboard de RR.HH. ("se ve muy básico, demasiado
poco") y pidió el nivel de https://reui.io/blocks/solutions/analytics, /crm e /inventory:
"necesito que quede excelente, porque tenemos la librería de REUI".

**Why:** flux-ui vendoriza ReUI, así que el usuario espera pantallas a la altura de esos
bloques, no tarjetas sueltas con un número.

**How to apply:**
- Sin `REUI_LICENSE_KEY` no se instalan los bloques premium, pero la vista previa real está en
  `https://reui.io/preview/base/<bloque>` (p. ej. `solution-analytics-1`, `solution-crm-2`,
  `solution-inventory-1`): se captura con Chrome headless y se lee la estructura.
- El código de ejemplo de cada componente sale del Storybook interno pulsando "View code"
  (`iframe.html?viewMode=docs&id=reui-frame--docs`, `data-kanban--docs`…).
- Patrón que funcionó: `Frame` + `FrameHeader`/`FramePanel`/`FrameFooter` para cada bloque,
  tarjetas con minigráfico y `Variacion` (Badge con flecha), `TrafficLight` como leyenda,
  `IconTile` en listas, `DataGridList` con celdas de dos líneas y anillo de avance, `Kanban`
  dentro de `ScrollArea` con `ScrollBar` horizontal.
- Piezas compartidas en `src/modules/design-system/templates/dashboard/components/`
  (`graficos.tsx`, `piezas.tsx`); los dashboards por rol las importan de ahí.
- Bloques que Carlos señaló en la revisión del 2026-09-11 (reui.io/blocks/application/…):
  **dashboard-2** para las tres tarjetas de top métricas (título, cifra, línea ondulada de color
  con relleno degradado y animación; preview en /preview/base/dashboard-2), el bloque
  «Integrations» para «Necesita tu atención» y las cards tipo Resend/Stripe/Supabase con flecha
  para los shortcuts. Sus colores (emerald, blue, violet) son justo `--success`, `--primary` e
  `--info` del tema.
Catálogos por categoría (sin licencia): el HTML de `reui.io/blocks/application/<categoría>` (card, stats,
chart, dashboard…) trae `name`/`title`/`description` de cada bloque; se filtran con regex y se capturan en
`/preview/base/<name>`. Útiles para la Home: chart-1 (métricas en una tarjeta con periodo), stats-7 (3 celdas
divididas), card-5/card-17 (atajos), dashboard-4 «Integrations» (listas con acción).
Relacionado: [[recharts-dos-versiones]], [[datagridlist-columnas-estables]], [[flux-ui-vendorea-reui]].
Código de los ejemplos de componentes (gratis): `https://reui.io/r/styles/base-vega/<nombre>.json` (campo files[].content),
p. ej. c-dropdown-menu-14 (menú de perfil con tema en Tabs), -9 y -15. Lista en `reui.io/components/<componente>`.
El menú de perfil del header se calcó del 14 (2026-09-16) tras rechazar una versión propia; el usuario prefirió conservar
su selector de tema original (fila «Tema» con interruptor sol/luna) en vez de las pestañas de ReUI, y el menú a 248 px (w-62).
