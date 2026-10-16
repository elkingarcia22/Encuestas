# PRD · Admin Selección (placeholder de rail)

| Campo | Valor |
| ----- | ----- |
| Producto | UBITS |
| Versión PRD | 0.1 |
| Estado | Borrador |
| Dueño producto | TBD |
| Módulo (sidenav / flujo) | Admin → Productos → Selección (Dashboard, Onboarding, Vacantes, Plantillas) |

## 1. Resumen

Este PRD documenta el producto **Selección** en el Workspace admin como presencia de mapa y rail (badge **Nuevo**), no como módulo funcional maduro. En v1 el alcance es placeholder: las cuatro hojas del sidenav existen como carpetas y pantallas vacías o mínimas; **no hay Historias de Usuario escritas**. El PRD fija el naming, la posición en el mapa y las decisiones abiertas que deben cerrarse antes de escribir HUs con `writer-us-new`.

## 2. Problema y objetivo

HR necesita un lugar visible para el ciclo de atracción / vacantes / onboarding dentro de Productos, separado de Aprendizaje y Desempeño. Hoy el rail ya anuncia Selección (ex Reclutamiento) para no perder el mapa mental, pero el comportamiento de producto aún no está definido.

Objetivos medibles de esta fase (solo mapa):

- Que el admin encuentre **Selección** con badge **Nuevo** bajo Productos, sin ver «Reclutamiento».
- Que las cuatro hojas (Dashboard, Onboarding, Vacantes, Plantillas) sean navegables desde el rail aunque el contenido sea placeholder.
- Que no se inventen reglas de negocio cerradas hasta discovery.

### Fuera de alcance (v1)

- Flujos de publicación de vacantes, pipeline de candidatos, entrevistas o ofertas.
- Onboarding de nuevos ingresos con tareas reales.
- Plantillas reutilizables operativas.
- Créditos u otros cupos dentro de Selección (explícitamente fuera del submenú).
- Cara colaborador: Selección / Reclutamiento **no** aparece en el rail del learner.
- HUs completas (`HU-SEL-*` solo tentativos en la tabla de trazabilidad).

## 3. Personas y permisos

| Rol | Qué puede hacer (observable) | Qué no puede |
| --- | ---------------------------- | ------------ |
| Administrador HR | Ver Selección (Nuevo) en Productos; abrir Dashboard, Onboarding, Vacantes y Plantillas desde el rail | Usar un flujo de selección cerrado (aún no definido); ver Créditos dentro de Selección |
| Creador LMS | Navegar el Workspace como admin si tiene ese rol | No se define permiso fino de Selección en v1 (PENDIENTE) |
| Colaborador | — | Ver Selección o Reclutamiento en el sidenav |

## 4. Restricciones de producto

| Hallazgo | Implicación para la experiencia |
| -------- | ------------------------------- |
| Naming cerrado en chrome: **Selección**, no Reclutamiento | Copy del rail y del mapa deben usar Selección; badge Nuevo |
| Subítems fijos en HU-INI-002: Dashboard, Onboarding, Vacantes, Plantillas | No añadir Créditos ni otros ítems sin decisión de producto |
| Carpetas solo con `_pendiente.md` | No inventar pantallas, estados ni Gherkin de negocio cerrado |
| Enlaces desde dashboard / Quick actions pueden apuntar a reclutamiento/selección inmaduro | El destino puede estar vacío; no implica madurez |
| Selección es solo admin | El colaborador no ve este producto en el rail |

## 5. Experiencia de usuario (flujos)

**Entrada:** desde Workspace admin → Productos → Selección → una de las cuatro hojas.

**Camino feliz (v1 placeholder):** el admin abre cualquiera de las cuatro entradas y llega a una pantalla placeholder (sin flujo de negocio completo). El rail mantiene el contexto de Selección y el badge Nuevo en el padre.

**Empty:** la pantalla puede mostrar estado vacío o mensaje de módulo en construcción (copy exacto **PENDIENTE**). No hay empty de búsqueda de vacantes hasta que exista listado.

**Error / borde:** buscar «Reclutamiento» en el rail no encuentra ítem; Créditos no aparecen bajo Selección (viven en el menú de empresa como cupos globales, fuera de este producto).

**Posterior (fuera de v1):** flujos de Dashboard operativo, Onboarding, Vacantes y Plantillas — a definir cuando se escriban las HUs.

## 6. Especificación UI

**Rail (cerrado por chrome HU-INI-002)**

- Etiqueta del producto: **Selección**.
- Badge: **Nuevo**.
- Hojas, en este orden: **Dashboard**, **Onboarding**, **Vacantes**, **Plantillas**.
- Sin ítem **Créditos** bajo Selección.

**Pantallas v1**

- Contenido: placeholder. No se especifican tablas, filtros, CTAs primarios ni formularios de negocio.
- Campos visibles vs sistema: no aplica hasta discovery.
- Validaciones: no aplica.
- Copy mínimo neutro sugerido solo si hace falta un empty genérico: **PENDIENTE** (no inventar microcopy de producto).

## 7. Requisitos de calidad (producto)

- Accesibilidad: las cuatro hojas deben ser alcanzables por teclado desde el sidenav como el resto del Workspace.
- Idioma UI: español neutro cuando exista copy; naming del producto es **Selección**.
- Privacidad (desde el usuario): no mostrar datos de candidatos en v1 (no hay datos).
- Empty / error: no aparentar un ATS maduro; no mezclar mensajes de error de otros módulos.

## 8. Criterios de aceptación

**Escenario: Camino feliz — presencia en el rail**

**Dado** que el admin está en el Workspace
**Cuando** abre el grupo Productos
**Entonces** ve Selección con badge Nuevo
**Y** al expandir ve Dashboard, Onboarding, Vacantes y Plantillas en ese orden
**Y** no ve un ítem llamado Reclutamiento
**Y** no ve Créditos dentro de Selección

**Escenario: Caso borde — navegación a placeholder**

**Dado** que el admin está en Productos → Selección
**Cuando** entra a Dashboard (u Onboarding, Vacantes o Plantillas)
**Entonces** llega a una pantalla del módulo
**Y** no se le promete un flujo completo de selección (sin HUs de negocio en v1)

**Escenario: Camino negativo — colaborador sin Selección**

**Dado** que la persona está en Workspace colaborador
**Cuando** recorre el menú lateral
**Entonces** no ve Selección ni Reclutamiento

## 9. Fases de entrega

| Fase | Incluye | No incluye |
| ---- | ------- | ---------- |
| v1 | Presencia en mapa y rail; cuatro hojas placeholder; naming Selección + Nuevo | Reglas de vacantes, onboarding, plantillas; HUs escritas; métricas de ATS |
| Posterior | Discovery + HUs HU-SEL-001…004; pantallas y criterios de negocio | Mezclar Créditos de tenant dentro de Selección sin decisión explícita |

## 10. Decisiones abiertas

1. **PENDIENTE —** Alcance de negocio de v1 real: ¿Dashboard solo resumen, o también KPIs de funnel? ¿Onboarding es preboarding, day-1 o ambos?
2. **PENDIENTE —** Relación entre Vacantes y Plantillas (¿plantilla genera vacante? ¿son independientes?).
3. **PENDIENTE —** Permisos por rol (solo Admin HR vs. reclutadores dedicados) y qué ve cada uno.
4. **PENDIENTE —** Integración con Configuración (usuarios, organigrama) y con Aprendizaje (asignar formación al contratar).
5. **PENDIENTE —** Cuándo retirar el badge **Nuevo**.
6. **PENDIENTE —** Copy y empty state oficiales de las pantallas placeholder.
7. **PENDIENTE —** Si Quick actions / Necesita tu atención del Inicio deben seguir enlazando a Selección mientras esté vacía.

## 11. Trazabilidad a HUs

| ID tentativo | Título | Fase |
| ------------ | ------ | ---- |
| HU-SEL-001 | Dashboard de Selección | Posterior |
| HU-SEL-002 | Onboarding (Selección) | Posterior |
| HU-SEL-003 | Vacantes | Posterior |
| HU-SEL-004 | Plantillas de Selección | Posterior |

> No existen archivos `HU-*.md` aún. Las carpetas solo tienen `_pendiente.md`. Escribir HUs con `writer-us-new` cuando Dave cierre el discovery.

## 12. Referencias

- [fundamentos/00-mapa.md](../../../fundamentos/00-mapa.md) — Productos → Selección; «Qué falta»
- [admin/inicio/HU-navegacion-workspace.md](../../inicio/HU-navegacion-workspace.md) — RN-03 naming y subítems
- [admin/productos/seleccion/dashboard/_pendiente.md](dashboard/_pendiente.md)
- [admin/productos/seleccion/onboarding/_pendiente.md](onboarding/_pendiente.md)
- [admin/productos/seleccion/vacantes/_pendiente.md](vacantes/_pendiente.md)
- [admin/productos/seleccion/plantillas/_pendiente.md](plantillas/_pendiente.md)
- [_indice-hus.md](../../../_indice-hus.md) — Carpetas pendientes → Admin — Productos → Selección
