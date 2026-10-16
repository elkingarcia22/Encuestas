---
name: preview-autoport-vite
description: "Con otro servidor en 5173, preview_start asigna un puerto que Vite ignora; el panel abre un puerto muerto y sus capturas fallan. Navegar al puerto real y capturar por CDP."
metadata: 
  node_type: memory
  type: project
  originSessionId: 7cccada6-400a-4553-948c-fcd7e7c7b09e
  modified: 2026-09-11T18:37:07.308Z
---

Visto el 2026-09-11. `.claude/launch.json` tiene `autoPort: true`, pero `npm run dev` (Vite) no lee
el puerto que asigna el panel: si 5173 está ocupado por otra sesión, Vite sube en 5174/5175 y el
panel abre `localhost:<puerto asignado>` → "navigation denied". Además el panel a veces vuelve
solo a ese puerto muerto y sus capturas salen diminutas o viejas.

**How to apply:** leer el puerto real con `preview_logs` ("Local: http://localhost:5175/") y
navegar ahí. Para verificar interacciones y capturar, usar Chrome headless con
`--remote-debugging-port` y un script CDP (clic con `Input.dispatchMouseEvent` sobre el centro del
elemento, `Page.captureScreenshot` con `captureBeyondViewport`). Los `RadioGroupItem` de Base UI
ponen el `id` en un input oculto: para marcarlos hay que hacer clic en su etiqueta.
Relacionado: [[templates-overlay-verificacion]].
