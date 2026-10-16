---
name: feedback-carlos-concepto
description: "Reglas que dio Carlos (líder de diseño) en la revisión del 2026-09-11: calcar el prototipo vendido, Google como marca, Suite AI, 3 tarjetas con gráfica, entregas por URL."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 9b6ec876-7655-459c-8d46-b59dd878042e
  modified: 2026-09-15T19:09:57.795Z
---

Revisión «Entrega shells (design concept)» del 2026-09-11 con Carlos Varela (líder) y Nicolás
García (el otro diseñador). El prototipo es https://admin-ubits.netlify.app/ ([[concepto-home-jefe]]).

**Why:** el prototipo ya se probó con usuarios y con él se vendió el proyecto; Carlos lo presenta al
SLT y no puede sostener cambios sin pruebas. Le preocupó que el equipo se fuera a profundidad
(grafo, interacciones) en vez de cerrar el concepto visual semanal.

**How to apply:**
- Transformar, no inventar: mismas opciones y bloques que el prototipo, «con esteroides» visuales.
- Marca: ~~Google~~ → **Meta Colombia desde el 2026-09-15** (el usuario: «esto debe ser el logo de Meta», al ver el
  login; es la marca del marco de Nicolás, `src/shared/assets/meta.png`). UBITS solo en el pie. El login abre con
  el logo del cliente. Aún quedan textos con Google en datos de plantillas (correos @google.com, «Universidad
  Google», encuestas, Home/colaborador EMPRESA): cambiarlos si el usuario lo pide.
- Pestañas Workspace / **Suite AI** (ya no «Agente IA»), con la bolita de IA en la pestaña; el
  historial de chats va en el menú lateral.
- Top métricas: **3 tarjetas** (no 4) con gráfica de color animada al cargar (las del dashboard de
  ReUI); se mantiene 7 / 30 días. Necesita tu atención ancha a la izquierda, shortcuts cortos a la
  derecha; «Crear un curso» en color de IA.
- Pirotecnia visual: imágenes, degradado azul del ambiente, no solo ícono + texto. Menos es más en
  cantidad de información. Regla de 8 px, más aire. Sin doble borde por todo lado.
- Botones con radio normal; radio completo solo en el ambiente de IA. Modales: quitar la X.
- Grises neutros, azul UBITS como primario, pesos semibold/bold como marketing.
- Patrones (vacíos, data grid, formularios, toasts) mostrados en **pantallas reales** del Figma, no
  como página de sistema de diseño.
- Entregas siempre como URL (Vercel), no compartir pantalla; no prometer lo que no se entrega.
  Cambios al repo los aprueba Cris Burbano. Nicolás lidera el concepto del marco; Cristian se
  adapta a él para tener una sola fuente de verdad. Relacionado: [[pedido-pantallas-no-patrones]].
