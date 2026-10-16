---
name: iconos-glass
description: 50 iconos Iconly Glass exportados de Figma (2026-09-14) en public/iconos-glass, catálogo en Design system › Icons; excepción a «solo Hugeicons» como ilustración; cómo exportarlos transparentes.
metadata:
  type: project
---

El 2026-09-14 el usuario pidió los iconos «Iconly Pro (Glass Icons) (Community)» de Figma
(archivo qXlkANBKUfPDJC7WZuna5M, página 1:1046, 50 componentes `Iconly/Glass/*`) «listos en la
librería y organizados», y luego: «eso debe quedar en el sistema de diseño» (rechazó publicarlo
como artifact aparte).

**Dónde quedó:** `public/iconos-glass/<categoría>/glass-<nombre>@{1x,2x,4x}.png` (lienzo cuadrado
144/288/576 px, transparente), `catalogo.json` y `LEEME.md` para el equipo de flux-ui; datos en
`src/modules/design-system/icons/glass.ts` (`ICONOS_GLASS`, `rutaGlass`); página
`/design-system/icons` con pestañas Glass y Hugeicons (buscador, categorías, fondos de prueba,
copiar nombre, descargar @4x). 11 categorías. Nombres repetidos resueltos como en Iconly (bag-2,
arrow-right-circle/arrow-up-square, info-circle/square, more-square/circle, ticket-star, password).

**Regla:** el usuario eligió usarlos ya como imagen (`<img srcSet>`), solo como ilustración
(atajos, indicadores, vacíos); la interfaz sigue con Hugeicons. CLAUDE.md/AGENTS.md aún dice
«solo Hugeicons» y es zona de ingeniería: el cambio de regla lo aprueba Cris Burbano. Licencia de
Iconly Pro por confirmar (Carlos). Primer uso: Quick actions del Home operativo en tarjetas 2 col.

**Cómo exportar fiel:** el SVG de Figma pierde el desenfoque (backdrop-filter en foreignObject no
se aplica como imagen); `download_assets` en PNG trae el fondo blanco del tablero; `get_screenshot`
con `contentsOnly` sale transparente pero sin agrandar. Solución usada: página temporal con cada
componente en un frame sin relleno de 144 px, `rescale(4)`, captura `contentsOnly` a 576, luego se
borra la página. Relacionado: [[marco-unico-shellubits]].
