---
name: auditoria-ds-cristian-2026-09-29
description: "Auditoría del DS sobre lo de Cristian (29-sep) — rama auditoria-design-system, decisiones (concepto congelado, avisos con tipo, Métricas) y pendientes de otros en Unificación."
metadata:
  node_type: memory
  type: project
  originSessionId: faa056d2-aa26-4490-bc3d-384c1ce7e508
  modified: 2026-09-29T16:37:02.026Z
---

El 29-sep se corrió `ai-tools/prompts/revisar-design-system.md` sobre los 298 archivos de Cristian (firmas Cristian Muñoz ×3 correos + tiangrupify). 82 hallazgos; se arreglaron los suyos en la rama **`auditoria-design-system`** (sale de staging con la fusión de Elkin, SIN commit; queda un `git stash` de respaldo del pull que ya se puede soltar).

Decisiones de Cristian:
- **Suite AI (concepto) y Home Suite AI = copia congelada**, como el Archivo: no se auditan ni arreglan (anotado en reglas-vigentes y en el prompt).
- **Avisos con tipo → `toast.add({ type })` como excepción**; sin tipo → `notify`. Pedido a ingeniería: que notify acepte tipo y espera (zona protegida).
- **Métricas**: FilaCifras/Indicadores/Variacion/TarjetaIndicador y gráficos se mudaron a `src/modules/design-system/metricas/` con página nueva `/design-system/metricas` (menú Patrones). Los archivos viejos (dashboard/components, inicio/bloques) solo reenvían. Las piezas repetidas de Elkin (FilaIndicadores, Tendencia de design-system/graficos) quedaron «Por decidir».

**Why:** lo de otras personas no se toca; se documentó en la pestaña nueva `/design-system/unificacion/pendientes` (autor + archivo:línea, pedidos a ingeniería, #9 ComparisonTable de Nicolás, #15 «Preguntar al agente», #66 promo-card de la cuenta compartida).
**How to apply:** en una próxima auditoría, empezar por esa pestaña y por las dudas D5–D23 sin decidir (pestañas pastilla del Inicio, tablas cortas con Table, riel del agente, etc.). Relacionado: [[auditoria-unificacion-2026-09-17]], [[reunion-war-room-2026-09-28]], [[marco-unico-shellubits]].
