---
name: contexto-producto-hus
description: Los casos de uso de las maquetas salen de docs/plataforma-ubits (historias de usuario con reglas RN numeradas y copy exacto); el usuario pide pantallas ancladas al producto UBITS.
metadata: 
  node_type: memory
  type: project
  originSessionId: 7cccada6-400a-4553-948c-fcd7e7c7b09e
  modified: 2026-09-11T18:36:59.064Z
---

`docs/plataforma-ubits/` (sin commitear al 2026-09-11) es el contexto del producto que se rediseña:
recorrido de la plataforma actual (01–15) y en `fuentes/contexto-producto/` la especificación con
historias de usuario por rol (admin, colaborador, transversal). Cada HU trae reglas de negocio
numeradas (RN-01…), criterios con copy literal ("No se encontraron resultados", "Usuario
desbloqueado exitosamente") y personas demo (Ana = creadora, María Alejandra = colaboradora,
empresa Fiqsha, 646 licencias). El vocabulario obligatorio está en `fundamentos/01-vocabulario.md`
(p. ej. «Selección», nunca «Reclutamiento»).

**Why:** el 2026-09-11 el usuario pidió pestañas y casos de uso "usando el contexto de las
pantallas y el producto que estamos rediseñando". Los ejemplos genéricos no le sirven.

**How to apply:** antes de maquetar un caso, leer la HU correspondiente y citar sus RN en la
pantalla. Las pantallas de patrones (`/design-system/estados`, `/data-grid`, `/formularios`) ya lo
hacen con `CasoUbits` de `src/modules/design-system/patrones/piezas.tsx`, que muestra rol, ruta
del producto y un bloque «Reglas del producto que cumple». Relacionado: [[reui-solutions-referencia]].
