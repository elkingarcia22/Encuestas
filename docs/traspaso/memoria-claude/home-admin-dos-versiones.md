---
name: home-admin-dos-versiones
description: La Home del admin (src/modules/admin/inicio/components/productos.tsx) tiene dos versiones; queda la de Cristian hasta decidir con Nico y Carlos.
metadata:
  type: project
---

Al unir el PR de Nicolás (18-sep-2026, commit d192ce5 en prueba-fusion) chocó
`src/modules/admin/inicio/components/productos.tsx`. Cristian eligió «lo decido después»: quedó
**su** versión (tres pestañas iguales: cifras + gráfica y lista con avance; 360 en telaraña,
Assessment como lista, embudo con cifras). La de Nicolás (Assessment con medidores de aguja, 360
con filtros, semáforos y cajas grises por tipo, tarjetas de indicador) está en
`origin/feature/suite-ai-nico` (commit 88cab56) y **todos** sus cambios de ese archivo quedaron
fuera, no solo los dos rediseños.

**Cómo aplicarlo:** si deciden la de Nico, traer el archivo de 88cab56 y reaplicar encima lo de
Cristian que siga valiendo. Ver [[reunion-follow-up-2026-09-17]].
