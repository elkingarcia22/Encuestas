---
name: pedido-pantallas-no-patrones
description: "Cuando el usuario pide \"pantallas\" o \"templates\", quiere pantallas completas y navegables del producto UBITS basadas en el grafo, no páginas de documentación de patrones."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 7cccada6-400a-4553-948c-fcd7e7c7b09e
  modified: 2026-09-11T19:34:31.826Z
---

El 2026-09-11 pidió «pestañas y casos de uso» de Estados, Data-grid y Formularios; se entendió
como ampliar las páginas de patrones del design system con casos de UBITS y lo corrigió:
«No, lo que quiero son pantallas, templates basados en las pantallas que ya se usan en el
producto original, revisa el grafo».

**Why:** su trabajo es rediseñar UBITS; le sirven maquetas de pantallas reales que se puedan
recorrer, no documentación de componentes.

**How to apply:** partir del grafo `docs/plataforma-ubits/graphify-out/` (GRAPH_REPORT.md y
graph.json: nodos con ruta «· /…», hiperaristas de recorridos) y de `10-recorridos.md`. Armar
templates en `src/modules/design-system/templates/<mundo>/` con rutas hijas y menú lateral que
navega de verdad, como `templates/colaborador` (recorrido «Estudiar un contenido asignado»). Las
entradas del menú sin maquetar muestran lo que el grafo sabe de la pantalla de hoy. Siguientes
recorridos pendientes: armar y asignar un plan de formación, dar de alta a la gente nueva,
contratar a alguien y cerrar un ciclo de desempeño. Relacionado: [[contexto-producto-hus]],
[[reui-solutions-referencia]].
