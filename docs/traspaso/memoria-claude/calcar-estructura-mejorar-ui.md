---
name: calcar-estructura-mejorar-ui
description: Criterio de Cristian para maquetar contra el producto real — misma estructura y patrón de acciones, mejor UI
metadata:
  type: feedback
---

Al maquetar algo que ya existe en UBITS: **mantener la misma estructura y el mismo patrón de acciones del producto real, pero con mejor UI** (30-sep-2026, Planes de formación: «por ejemplo lo de ver plan y que sale un drawer y así»).

**Why:** Cristian notó que al comparar solo estructura se nos escaparon interacciones del real (validación en vivo, clic en la fila, pasos que aparecen, vista cuadrícula); el playground debe poder ponerse lado a lado con producción.

**How to apply:** recorrer el real probando cada control (no solo leer pantallas), listar interacción por interacción y replicarlas; donde el real y la HU se contradicen, gana el real; las mejoras son de interfaz (piezas del DS, textos, estados), no de flujo. Ver [[recorrido-admin-ubits]] y [[aprendizaje-planes-grupos]].
