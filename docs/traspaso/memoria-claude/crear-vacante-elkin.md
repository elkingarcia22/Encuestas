---
name: crear-vacante-elkin
description: Pedido de Elkin (Selección): los 7 puntos del asistente de crear vacante están entregados; falta publicar y decidir entradas.
metadata:
  type: project
---

El 2026-09-22 llegó un pedido en tabla (columna «Selección», responsable Elkin Garcia) con
siete puntos del **Asistente de creación de vacantes**. **Los siete están entregados** en
`/admin/seleccion/vacantes/crear` (`src/modules/admin/seleccion/vacantes/crear/`), más la
pantalla de cierre «Vacante creada», que no estaba en la tabla pero sale del recorrido real
(`docs/plataforma-ubits/06-marco-d-reclutamiento.md`).

**Decisiones de diseño que tomamos y conviene no deshacer:**
- Las cuatro configuraciones de etapa abren en **panel lateral** (`DrawerShell`), no en modal.
- Los tres pasos comparten rejilla: trabajo a la izquierda y **resumen de la vacante en vivo**
  a la derecha (pegajoso), que dice además qué falta para continuar.
- Lo accesorio va plegado en «Más opciones»; en el paso 2 **no hay columna de biblioteca**:
  agregar etapa es un menú al final de la lista del flujo.
- Cada etapa configurable muestra su configuración real en una línea («3 preguntas · por
  teléfono · aprueba con 70»), no una descripción genérica.

**Pendiente:** nada del pedido. Sin commit, sin publicar en Vercel. La lista de Vacantes sigue
siendo la pantalla de relleno de Nicolás, así que al asistente **solo se entra por dirección**
(ver [[home-admin-dos-versiones]]).

**Limitación conocida:** el `Combobox` de la librería no deja crear opciones nuevas, así que en
Habilidades solo se puede elegir del catálogo de 50, no escribir una que no esté.

**Cómo aplicarlo:** los datos y las validaciones viven en `components/vacante-data.ts`
(`Borrador`, `pasoValido`, `faltaEnPaso1/3`, `resumenDeEtapa`). Los textos salen de las HU
(ver [[contexto-producto-hus]]). El alto de campos que se cambió en el camino está en
[[campos-40px]].
