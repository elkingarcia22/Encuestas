---
name: check-typecheck-no-op
description: "npm run check ya revisa los tipos de verdad (arreglado el 2026-09-17); lo que sigue sin mirar son imágenes y recursos importados, así que cierra con npm run build cuando borres archivos."
metadata: 
  node_type: memory
  type: project
  originSessionId: bec59ca1-6c42-4844-9b78-e4dd5b5e2d6a
  modified: 2026-09-17T22:40:52.979Z
---

Hasta el 2026-09-17, `scripts/check.mjs` corría `npm exec tsc -b` y npm se quedaba con el `-b`
(`Unknown cli config "--b"`), así que decía "Typecheck sin errores" siempre. Arreglado en el
commit `60bd720` de `prueba-fusion`: ahora es `npm exec -- tsc -b --force` y falla de verdad
(probado con un error de tipo a propósito).

Lo que `npm run check` sigue sin mirar: **imágenes y recursos importados**. Borrar un PNG que
alguien todavía importa solo falla al compilar — pasó al quitar la pestaña «Botón de IA» de
Botones, que dejó rotas dos importaciones de la página de IA (arreglado en `c87948c`).

**Cómo aplicarlo:** `npm run check` alcanza para tipos y reglas; corre además `npm run build`
cuando el cambio borre o mueva archivos. `scripts/` es zona protegida: el check avisa cuando se
toca, y hay que decírselo al equipo en la respuesta.
