# HU: Seguimiento de tareas y planes (vista líder)

## Contexto

El líder necesita vigilar el avance de su gente con la misma tabla densa que usa HR, pero sin ver al resto de la empresa. Si el alcance es global, pierde el foco del equipo y se mezcla con la operación de administración. Meta: encontrar en menos de un minuto las actividades vencidas o por hacer de él y de sus reportes directos.

## Historia de Usuario

**Como** líder de equipo en mi empresa,
**quiero** ver y filtrar el seguimiento de tareas y planes míos y de mi equipo,
**para** detectar atrasos de las personas que reportan a mí, sin acceder a lo del resto de la empresa.

## Alcance

**Incluye:**
- Pantalla Seguimiento con la misma interfaz que el Seguimiento de HR (pestañas Tareas y Planes, indicadores, periodo, búsqueda, columnas, empty).
- Alcance limitado al líder y a sus reportes directos.
- Entrada desde el sidenav colaborador: Herramientas → Tareas → Seguimiento.

**Excluye:**
- Seguimiento empresa-completa de HR (HU-TAR-003).
- Mi lista del día (HU-TAR-001).
- Vista Planes del colaborador (HU-TAR-002).
- Detalle de tarea o plan (HU-TAR-004).

## Reglas de Negocio

- **RN-01:** El líder ve solo actividades asignadas a él o a sus reportes directos. No ve las de otras áreas ni del resto de la empresa.
- **RN-02:** La interfaz, pestañas, periodos, estados, prioridades, empty y formato de indicadores son los mismos que en HU-TAR-003.
- **RN-03:** Periodo por defecto: “Últimos 7 días” (filtra por fecha de creación).
- **RN-04:** Las tareas individuales no entran a esta vista; las grupales / de seguimiento sí, siempre que el asignado esté en el alcance del líder.
- **RN-05:** Esta vista vive en el Workspace colaborador. El Seguimiento de HR vive en el Workspace admin.

## Criterios de Aceptación

**Escenario: Camino feliz — ver solo el equipo**

**Dado** que María es líder con reportes directos
**Y** abre Seguimiento desde Tareas en el Workspace colaborador
**Cuando** carga la pestaña Tareas con periodo “Últimos 7 días”
**Entonces** ve actividades asignadas a ella o a su equipo
**Y** no ve actividades de personas que no reportan a ella

**Escenario: Caso borde — líder sin reportes directos**

**Dado** que el colaborador no tiene reportes directos
**Cuando** abre Seguimiento
**Entonces** solo ve actividades asignadas a él, si las hay
**Y** no ve el seguimiento empresa-completa

**Escenario: Camino negativo — no ver otra área**

**Dado** que hay actividades de seguimiento en otra área de mi empresa
**Cuando** María abre Seguimiento como líder
**Entonces** esas actividades no aparecen en la tabla
**Y** los indicadores coinciden solo con el alcance de ella y su equipo
