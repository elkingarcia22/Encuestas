# HU: Detalle de tarea y subtarea

## Contexto

Desde Mi lista, Planes o Seguimiento se abre una tarea en vista inmersiva para editar atributos, subtareas y comentarios. Meta: poder finalizar o reabrir una tarea y sus subtareas sin volver a la lista.

## Historia de Usuario

**Como** colaborador de mi empresa,
**quiero** abrir el detalle de una tarea (y de una subtarea) en vista inmersiva,
**para** actualizar estado, prioridad, asignado, subtareas y comentarios.

## Alcance

**Incluye:**
- Detalle de tarea: título, descripción, estado, prioridad, plan, tipo (Estándar / Aprendizaje), “Finaliza el:”, asignado.
- Subtareas con progreso “X de Y completadas”, alta individual o en lote, navegación a subtarea.
- Historial: comentarios + actividades; filtros Todo / Solo comentarios / Solo historial de cambios.
- Acciones: finalizar/reabrir, recordatorio, copiar enlace, eliminar con confirmación.
- Detalle de subtarea: una columna; sin comentarios ni lista de subtareas; finalizar/reabrir/eliminar/recordatorio.

**Excluye:**
- Tabla de Mi lista (HU-TAR-001).
- Seguimiento HR denso (HU-TAR-003).
- Consumo del contenido asociado (HU-APR-004), salvo el vínculo/estado automático de aprendizaje.

## Reglas de Negocio

- **RN-01:** La tarea y la subtarea se abren en layout inmersivo.
- **RN-02:** Estados visibles: Por hacer / Activo / Finalizada (tarea) o Finalizado (subtarea/plan interno) / Vencida (nunca “Iniciada”).
- **RN-03:** Tipos de tarea: Estándar y Aprendizaje (con contenido ligado opcional).
- **RN-04:** En tipo Aprendizaje, no se fuerza el cierre manual: se informa que finalizará al completar el contenido (o que el curso ya está completado).
- **RN-05:** Si la tarea/subtarea está vencida, para reabrir/cambiar el cierre se indica que hay que cambiar la fecha.
- **RN-06:** Se pueden agregar subtareas de una en una o en lote; queda registro en la actividad.
- **RN-07:** El detalle de subtarea no tiene hilo de comentarios ni subtareas hijas.
- **RN-08:** Si el creador es el mismo asignado, no se muestran comentarios previos del creador; los enviados desde el compositor sí.
- **RN-09:** Eliminar tarea o subtarea exige confirmación en modal.

## Criterios de Aceptación

**Escenario: Camino feliz — finalizar tarea Estándar**

**Dado** que María abre una tarea Estándar en estado Activo con al menos una subtarea
**Cuando** elige “Finalizar tarea”
**Entonces** el estado visible pasa a Finalizada
**Y** ve el indicador de guardado en el header

**Escenario: Caso borde — subtarea sin comentarios**

**Dado** que la tarea tiene una subtarea “Revisar política de vacaciones”
**Cuando** María abre esa subtarea
**Entonces** entra al detalle inmersivo sin comentarios ni lista de subtareas
**Y** puede finalizar o reabrir esa subtarea

**Escenario: Camino negativo — aprendizaje no cierra a mano**

**Dado** que María abre una tarea de tipo Aprendizaje cuyo contenido no está completado
**Cuando** intenta finalizarla manualmente como una Estándar
**Entonces** se le indica que la tarea finalizará al completar el contenido
**Y** no queda Finalizada solo por esa acción manual
