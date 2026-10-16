---
name: badge-destructive-light-ilegible
description: Insignias que no pasan contraste (29-sep): focus-light y los contornos success/warning; destructive-light ya se lee en el playground.
metadata:
  type: project
---

Revalidado el 2026-09-29 contra flux-ui 0.5.5 (ver [[diferencias-con-la-libreria]]):
- `destructive-light`: en el tema ubits de la librería sale blanco sobre rosa (1,14:1), pero en el playground ya se lee
  (6,9:1) porque `src/index.css` corrige `--destructive-foreground`. El Storybook lo tapa con un `:root` propio.
- `focus-light`: sigue casi invisible (texto casi blanco sobre su tinte).
- Contornos `success-outline` y `warning-outline`: 2,47:1 y 1,91:1; la librería se apartó de ReUI (que los pinta
  oscuros). Se usan en 18 sitios y en los estados de Encuestas › Resultados.

**How to apply:** para estados legibles usar las variantes `-light` que sí pasan o `destructive-outline`; no confiar en
los contornos verde y amarillo hasta que la librería los corrija.
