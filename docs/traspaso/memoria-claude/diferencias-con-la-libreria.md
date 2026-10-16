---
name: diferencias-con-la-libreria
description: Lista única de lo que el playground hace distinto de flux-ui, para el dev del Storybook: diferencias.json, página /design-system/diferencias y exportador .md (29-sep).
metadata:
  type: project
---

Desde el 2026-09-29 lo que difiere de @ubits/flux-ui vive en UN solo lugar: `ai-tools/flux-ui/diferencias.json` (se edita
a mano; formato en `src/modules/design-system/diferencias/tipos.ts`). La página `/design-system/diferencias` (menú
Componentes) lo muestra con filtros y «Descargar/Copiar documento»; `node ai-tools/flux-ui/exportar-diferencias.mjs` genera
`ai-tools/flux-ui/diferencias-para-libreria.md` (mismo texto, vía `diferencias/markdown.ts`, que Node carga como .ts).
Primera versión: 131 entradas en 67 piezas, revalidadas por 6 familias contra la 0.5.5 y el Storybook.

Causas de fondo halladas: el README manda importar `style-vega.css` sin `@layer` (src/index.css:4) y así las clases no
le ganan al tema —1.728 «!» en 238 archivos—, mientras el Storybook lo carga en `@layer base` y no se ve; y `cn` usa
tailwind-merge 2 con Tailwind 4. El Storybook abre con tema default/nova (no ubits/vega) y tapa la insignia roja con un
`:root` propio.

**Why:** Cristian pidió organizar el design system «mucho más organizado que antes, para mandárselo al dev que modifica
storybook». Ajustes propios queda como vista lado a lado para diseño; las «Concesiones» de reglas-vigentes y el catálogo
apuntan a la lista.
**How to apply:** una diferencia nueva se agrega al JSON (no a notas sueltas) y se regenera el .md. Al subir la versión
de flux-ui, revalidar y quitar lo resuelto. Relacionado: [[badge-destructive-light-ilegible]], [[datagridlist-columnas-estables]].
