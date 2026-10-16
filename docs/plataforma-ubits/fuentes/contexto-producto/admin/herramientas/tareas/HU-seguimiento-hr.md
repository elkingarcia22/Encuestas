# HU: Seguimiento HR de tareas y planes

## Contexto

HR necesita una vista empresa-completa para vigilar tareas y planes (no la lista del día de María). Meta: encontrar en menos de un minuto las actividades vencidas o por hacer del periodo elegido.

## Historia de Usuario

**Como** administrador de recursos humanos,
**quiero** ver y filtrar el seguimiento de tareas y planes de toda la empresa,
**para** detectar atrasos, reabrir planes y actuar sobre lo que necesita atención.

## Alcance

**Incluye:**
- Pantalla Seguimiento con pestañas Tareas y Planes.
- Indicadores (total, finalizadas/finalizados, por hacer, vencidas/vencidos) con formato K/M.
- Periodo por defecto “Últimos 7 días” y opciones hasta “Último año” o personalizado.
- Búsqueda, columnas, selección múltiple (reasignar, prioridad, estado, fecha, descargar, eliminar).
- Creación desde el botón Crear de esta vista.
- Click en fila → detalle de tarea o de plan.
- Empty “No se encontraron resultados”.
- Entrada desde el sidenav admin: Herramientas → Tareas (ítem único; abre esta pantalla).

**Excluye:**
- Mi lista del día ([HU-TAR-001](../../../colaborador/herramientas/tareas/tareas/HU-mi-lista.md)).
- Vista Planes del colaborador ([HU-TAR-002](../../../colaborador/herramientas/tareas/planes/HU-planes-colaborador.md)).
- Vista líder de Seguimiento ([HU-TAR-005](../../../colaborador/herramientas/tareas/seguimiento/HU-seguimiento-lider.md)).
- Drawer “Filtros” cableado a un botón Filtrar (la UI del drawer existe pero no se abre desde un control visible).
- Tareas individuales en el scope de seguimiento (solo entran actividades grupales / de seguimiento).

## Reglas de Negocio

- **RN-01:** Scope empresa-completa de seguimiento; no es la vista personal del día de María ni la vista líder ([HU-TAR-005](../../../colaborador/herramientas/tareas/seguimiento/HU-seguimiento-lider.md)).
- **RN-02:** Pestañas Tareas y Planes; cada una conserva filtros, columnas y selección propios.
- **RN-03:** Estados de tareas: Por hacer, Activo, Finalizada, Vencida. Estados de planes: Por hacer, Activo, Finalizado, Vencido.
- **RN-04:** Prioridades (solo Tareas): Alta, Media, Baja.
- **RN-05:** Periodos literales: “Últimos 7 días”, “Últimos 15 días”, “Últimos 30 días”, “Últimos 3 meses”, “Últimos 6 meses”, “Último año”, más rango personalizado.
- **RN-06:** Periodo por defecto: “Últimos 7 días” (filtra por fecha de creación).
- **RN-07:** La tabla carga de a 50 filas y puede cargar más al llegar al final.
- **RN-08:** Los indicadores usan formato de producto y reflejan los filtros activos.
- **RN-09:** Eliminar exige confirmación escribiendo el texto del modal “Eliminar elementos”.
- **RN-10:** Las tareas individuales no entran a esta vista; las grupales / de seguimiento sí.

## Criterios de Aceptación

**Escenario: Camino feliz — filtrar vencidas del periodo**

**Dado** que el admin abre Seguimiento en la pestaña Tareas con periodo “Últimos 7 días”
**Cuando** filtra por estado “Vencida”
**Entonces** la tabla solo muestra tareas vencidas del periodo
**Y** los indicadores coinciden con esa lista filtrada

**Escenario: Caso borde — cambiar a Planes**

**Dado** que en Tareas el admin tiene filtros activos distintos a los de Planes
**Cuando** cambia a la pestaña Planes
**Entonces** ve los filtros y columnas de Planes (no los de Tareas)
**Y** la selección de filas de Tareas se limpia

**Escenario: Camino negativo — sin resultados**

**Dado** que el admin aplica búsqueda o filtros que no coinciden con ninguna actividad
**Cuando** se actualiza la tabla
**Entonces** ve el empty state “No se encontraron resultados”
**Y** puede limpiar la búsqueda o los filtros para volver a ver datos
