# Flujo — Tareas (colaborador) y Seguimiento HR (admin)

## Objetivo

En colaborador: gestionar el día a día (mi lista), ver planes, plantillas y el seguimiento **líder**. En admin: un solo acceso a Tareas que abre el seguimiento **empresa-completa**. No mezclar scopes.

## Actores

- Colaborador líder (María Alejandra Sánchez Pardo) — mi lista del día (propia + equipo), planes, detalle de tarea, **Seguimiento vista líder**
- HR (admin) — **Seguimiento empresa-completa** (Herramientas → Tareas)

## Capas (no mezclar)

1. **Mi lista** — día a día del líder (propia + reportes + jefa); filtros de asignación. Solo sidenav colaborador: Herramientas → Tareas → Tareas.
2. **Planes** — planes en curso / finalizados del colaborador.
3. **Plantillas** — plantillas de plan/tarea (colaborador).
4. **Detalle tarea / subtarea** — vista inmersiva (estados, subtareas, comentarios).
5. **Seguimiento HR** — denso, empresa-completa (tareas grupales / de seguimiento; no individuales). Vive en admin: Herramientas → **Tareas** (ítem único).
6. **Seguimiento líder** — misma UI que HR; solo María Alejandra y su equipo. Vive en colaborador: Herramientas → Tareas → Seguimiento.

## Sidenav

- **Admin:** Tareas es un **ítem único**. El clic abre directamente Seguimiento. No hay acordeón con lista, planes ni plantillas.
- **Colaborador:** Tareas sí es **acordeón**: Tareas, Planes, Plantillas, Seguimiento (vista líder).

## Estados

| Entidad | Estados UI |
|---------|------------|
| Tarea | Por hacer / Activo / Finalizada / Vencida (nunca “Iniciada”) |
| Plan (vista colaborador) | En curso / Finalizado; vencidos viven en En curso; nunca Finalizado con avance menor a 65% |
| Plan (vista admin LMS) | Planeado / Procesando / Vigente / No vigente — barra = % personas al 100% (métrica distinta al Finalizado ≥ 65% del colaborador) |

## HUs

`HU-TAR-001`, `HU-TAR-002`, `HU-TAR-003`, `HU-TAR-004`, `HU-TAR-005` en el índice.
