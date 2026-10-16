# PRD · Tareas — Seguimiento HR (admin)

| Campo | Valor |
| ----- | ----- |
| Producto | UBITS |
| Versión PRD | 0.1 |
| Estado | Lista |
| Dueño producto | TBD |
| Módulo (sidenav / flujo) | Admin → Herramientas → Tareas (ítem único → Seguimiento HR) |

## 1. Resumen

Define la vista **Seguimiento HR** de tareas y planes a **alcance empresa-completa**. En el sidenav admin, Herramientas → **Tareas** es un ítem único que abre esta pantalla (no Mi lista del día ni la vista líder). Incluye pestañas Tareas y Planes, indicadores, periodo, búsqueda, columnas, selección múltiple y creación desde esta vista.

## 2. Problema y objetivo

HR necesita vigilar atrasos y actividad de formación de toda la empresa. La lista personal del colaborador y el Seguimiento del líder no cubren el scope empresa-completa.

**Objetivos medibles (v1):**

- Encontrar actividades vencidas o por hacer del periodo en menos de un minuto (camino típico con filtros).
- Periodo por defecto “Últimos 7 días”; opciones hasta “Último año” o personalizado.
- Indicadores coherentes con filtros activos (formato K/M de producto).
- Distinción clara vs Mi lista y vs Seguimiento líder.

### Fuera de alcance (v1)

- Mi lista del día (HU-TAR-001).
- Vista Planes del colaborador (HU-TAR-002).
- Vista líder de Seguimiento (HU-TAR-005).
- Drawer “Filtros” cableado a un botón Filtrar visible (UI del drawer puede existir sin abrirse).
- Tareas individuales en el scope de seguimiento (solo grupales / de seguimiento).

## 3. Personas y permisos

| Rol | Qué puede hacer (observable) | Qué no puede |
| --- | ---------------------------- | ------------ |
| Administrador de recursos humanos | Ver y filtrar seguimiento empresa-completa; acciones masivas; crear; abrir detalle | Ver esta misma UI como “Mi lista” personal |
| Líder (colaborador) | Usa Seguimiento líder en cara colaborador | No es este ítem del rail admin |
| Colaborador sin rol admin | — | Abrir Seguimiento HR empresa-completa |

## 4. Restricciones de producto

| Hallazgo | Implicación para la experiencia |
| -------- | ------------------------------- |
| Scope empresa-completa | La UI y copy no se presentan como lista del día de una persona |
| Pestañas Tareas / Planes | Cada pestaña conserva filtros, columnas y selección propios; al cambiar se limpia selección |
| Solo actividades grupales / seguimiento | Las individuales no aparecen en esta vista |
| Periodo por defecto 7 días | Filtra por fecha de creación; default literal “Últimos 7 días” |
| Eliminar | Confirmación escribiendo el texto del modal “Eliminar elementos” |
| Carga de tabla | De a 50 filas; puede cargar más al final |

## 5. Experiencia de usuario (flujos)

**Entrada:** Admin → Herramientas → Tareas → abre Seguimiento HR.

**Camino feliz:**

1. Abre pestaña Tareas, periodo “Últimos 7 días”.
2. Filtra por estado “Vencida” (u otro criterio).
3. Ve tabla filtrada e indicadores alineados.
4. Opcional: selección múltiple (reasignar, prioridad, estado, fecha, descargar, eliminar).
5. Click en fila → detalle de tarea o plan.

**Empty:** búsqueda/filtros sin coincidencias → “No se encontraron resultados” + limpiar.

**Borde:** cambiar a Planes → filtros/columnas de Planes; selección de Tareas limpia.

**Error / negativo:** eliminar sin confirmar texto → no elimina.

## 6. Especificación UI

**Pantalla Seguimiento:**

- Pestañas: Tareas | Planes.
- Indicadores: total, finalizadas/finalizados, por hacer, vencidas/vencidos (formato indicador producto).
- Periodo: “Últimos 7 días”, “Últimos 15 días”, “Últimos 30 días”, “Últimos 3 meses”, “Últimos 6 meses”, “Último año”, rango personalizado.
- Búsqueda, columnas, selección múltiple, botón Crear.
- Empty: “No se encontraron resultados”.

**Estados Tareas:** Por hacer, Activo, Finalizada, Vencida.  
**Estados Planes:** Por hacer, Activo, Finalizado, Vencido.  
**Prioridades (solo Tareas):** Alta, Media, Baja.

## 7. Requisitos de calidad (producto)

- Accesibilidad: pestañas, tabla y acciones masivas con foco y labels; modal eliminar con instrucción clara.
- Idioma UI: español neutro; literales de periodo exactos.
- Privacidad: datos de toda la empresa solo para rol admin de ese tenant.
- Empty / error: empty de sin resultados; eliminación solo tras confirmación escrita.

## 8. Criterios de aceptación

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

**Escenario: Caso borde — entrada desde sidenav**

**Dado** que el admin está en el Workspace
**Cuando** elige Herramientas → Tareas
**Entonces** abre Seguimiento HR empresa-completa
**Y** no abre Mi lista ni el Seguimiento líder

**Escenario: Error / camino negativo — sin resultados**

**Dado** que el admin aplica búsqueda o filtros que no coinciden con ninguna actividad
**Cuando** se actualiza la tabla
**Entonces** ve el empty state “No se encontraron resultados”
**Y** puede limpiar la búsqueda o los filtros para volver a ver datos

## 9. Fases de entrega

| Fase | Incluye | No incluye |
| ---- | ------- | ---------- |
| v1 | Seguimiento HR empresa-completa (HU-TAR-003) | Mi lista, Planes colaborador, Seguimiento líder, tareas individuales, drawer Filtrar cableado |
| Posterior | Cablear drawer de filtros; posibles mejoras de exportación o plantillas | Mezclar scopes líder / personal en este ítem |

## 10. Decisiones abiertas

1. **PENDIENTE —** Si el drawer Filtrar se cablea en una fase siguiente, qué criterios expone vs filtros ya visibles.
2. **PENDIENTE —** Detalle de permisos si hay admins con alcance parcial (área / sede).
3. **PENDIENTE —** Comportamiento exacto de “reasignar” en selección múltiple (quiénes aparecen como destino).

## 11. Trazabilidad a HUs

| ID tentativo | Título | Fase |
| ------------ | ------ | ---- |
| HU-TAR-003 | Seguimiento HR de tareas y planes | v1 |
| HU-TAR-001 | Mi lista (colaborador) | Fuera — otro PRD/flujo |
| HU-TAR-005 | Seguimiento líder | Fuera — otro PRD/flujo |

## 12. Referencias

- [fundamentos/00-mapa.md](../../../fundamentos/00-mapa.md)
- [fundamentos/02-personas-y-roles.md](../../../fundamentos/02-personas-y-roles.md)
- [admin/herramientas/tareas/HU-seguimiento-hr.md](HU-seguimiento-hr.md) (HU-TAR-003)
- [_indice-hus.md](../../../_indice-hus.md)
