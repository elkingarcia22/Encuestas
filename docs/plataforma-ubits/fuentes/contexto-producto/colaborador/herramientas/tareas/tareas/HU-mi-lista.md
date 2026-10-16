# HU: Mi lista de tareas del día

## Contexto

María, como líder, necesita ver el día a día de su equipo y el propio (vencidas, sin fecha, hoy/mañana), no solo sus tareas personales. Eso reduce olvidos del equipo y aclara el trabajo diario frente a los planes largos. Meta: poder filtrar “Solo lo asignado a mí” vs “Solo lo que asigné a otros” sin mezclar con Seguimiento HR empresa-completa.

## Historia de Usuario

**Como** colaborador líder de mi empresa,
**quiero** gestionar la lista del día con mis tareas y las de mi equipo, con estados Por hacer, Finalizada y Vencida,
**para** completar lo urgente y dar seguimiento cercano a quienes reportan a mí.

## Alcance

**Incluye:**
- Vista Mi lista con calendario horizontal por días (Hoy / Mañana / fechas).
- Secciones Vencidas, Sin fecha de vencimiento y días.
- Filtros de Estado, Prioridad y Asignación (“Todas” / “Solo lo que asigné a otros” / “Solo lo asignado a mí”).
- Finalizar / reabrir, editar inline, crear tarea, eliminar, recordatorio.
- Entrada al detalle inmersivo (HU-TAR-004).

**Excluye:**
- Seguimiento HR empresa-completa (HU-TAR-003).
- Creación admin de planes LMS (HU-LMS-005).

## Reglas de Negocio

- **RN-01:** Estados visibles en la tirilla: Por hacer, Finalizada, Vencida; nunca “Iniciada”.
- **RN-02:** En modo líder, la lista del día incluye tareas propias, de reportes directos y de la jefa (Patricia), no solo las personales de María.
- **RN-03:** El filtro de Asignación permite acotar a “Solo lo que asigné a otros” o “Solo lo asignado a mí”.
- **RN-04:** Las tareas vencidas siguen visibles en la sección Vencidas hasta resolverse.
- **RN-05:** El filtro de Estado ofrece “Por hacer” y “Finalizado”; las vencidas se gestionan desde su sección, no como valor de ese filtro.

## Criterios de Aceptación

**Escenario: Camino feliz — finalizar tarea propia**

**Dado** que María tiene una tarea “Por hacer” hoy asignada a ella
**Cuando** la marca como finalizada
**Entonces** el estado pasa a Finalizada
**Y** deja de contarse como pendiente del día

**Escenario: Caso borde — ver tareas del equipo como líder**

**Dado** que María es líder con reportes directos
**Cuando** abre Mi lista en un día laborable
**Entonces** ve al menos una tarea de un reporte directo además de la propia
**Y** puede filtrar con “Solo lo asignado a mí” para acotar su scope

**Escenario: Camino negativo — no mezclar con Seguimiento HR**

**Dado** que existen actividades de seguimiento de toda mi empresa
**Cuando** María abre Mi lista (sin ir a Seguimiento)
**Entonces** no ve la tabla densa empresa-completa de Seguimiento
**Y** solo gestiona el día a día de su vista de líder / asignación
