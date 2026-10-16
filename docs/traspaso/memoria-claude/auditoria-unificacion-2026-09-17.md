---
name: auditoria-unificacion-2026-09-17
description: "Auditoría de consistencia (quién usa qué componente); vive en la página Design system › Unificación, actualizada el 28-sep sobre staging."
metadata:
  node_type: memory
  type: project
  originSessionId: f9cead4b-7c4b-4edb-9e86-b3c6eaa4e325
  modified: 2026-09-28T20:17:59.151Z
---

Cuando el usuario pide «el artifact/documento de las incongruencias» se refiere a esto. **No es un artifact
publicado**: el informe original (`00-unificacion.md`, 17-sep) se envió como archivo y se perdió del
scratchpad; su versión viva es la página **/design-system/unificacion** (`src/modules/design-system/unificacion/`).

- `datos.ts`: hallazgos, estados, RESUELTOS, tabla VOCABULARIO («Quién usa qué») y REVISION (fecha/rama).
- `generar-enlaces.mjs` → `enlaces.ts` (no editar a mano): cuenta cada variante por archivo y, desde el 28-sep,
  le pone `autor` (persona con más líneas según git: tiangrupify/Cristian Muñoz → Cristian, Nicolas Garcia,
  DavidVegaM91, Elkin Garcia; el resto «Ingeniería»). Correr `node src/modules/design-system/unificacion/generar-enlaces.mjs`.

Estado al 28-sep (staging, 163 pantallas): resuelto Sheet→DrawerShell, PageShell/PageHeader en producto,
--info, badges suaves, EtiquetaIA. Pendiente: estrellas de IA en 22 pantallas, --success/--warning sin
definir, gráficas en un azul, `font: inherit` y `outline-ring` globales, DataGridList solo en lo de Cristian,
AlertDialog suelto vs ActionDialog, Button size="icon" vs BotonIcono, clases «!» (sobre todo del marco de
Nicolás, que se conservan — ver [[estilos-nicolas-se-conservan]]), check que sigue mirando origin/main.

**Cómo aplicarlo:** las decisiones de vocabulario las toma el equipo; no elegir por ellos. Al re-auditar,
actualizar la página (datos + regenerar enlaces), no un documento aparte. Ver [[develop-es-el-tronco]].

28-sep: auditoría de «lo de Cristian» (150 archivos) contra las piezas del proyecto y arreglo, sin commit. Suite AI pasó al
agent-kit/Orb/Composer/ChangelogDialog; Home operativo, Colaborador y la plantilla de Planes a Hint, CloseButton,
PageHeader, orbe y BotonIaSecundario; DS Estados/Data-grid y el detalle de vacante a DialogoConfirmar. Fecha de un día
unificada: CampoFecha y CALENDARIO_ES en design-system/formularios/rango-de-fechas.tsx. Ojo: las listas largas van con
Table + PiePaginacion (regla de Nicolás del 21-sep); Tareas con DataGridList es la que se sale, pendiente de decidir.
Quedan de otros: AlertDialog de Crear vacante (Elkin), varita en Composer y FeatureDialog.
