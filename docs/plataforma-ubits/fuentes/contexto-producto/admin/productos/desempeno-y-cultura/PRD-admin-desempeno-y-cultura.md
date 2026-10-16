# PRD · Desempeño y cultura — Evaluaciones 360° (admin)

| Campo | Valor |
| ----- | ----- |
| Producto | UBITS |
| Versión PRD | 0.1 |
| Estado | Lista |
| Dueño producto | TBD |
| Módulo (sidenav / flujo) | Admin → Productos → Desempeño y cultura → Evaluaciones 360° |

## 1. Resumen

PRD del módulo **Desempeño y cultura** en admin, con foco cerrado en **Evaluaciones 360°**: listar, filtrar, crear (hub de 4 secciones), activar, finalizar y eliminar. Objetivos, Matriz de talento, PDI y Encuestas quedan fuera de v1 (pendientes). Editar una 360° ya activa es placeholder y no forma parte del alcance lista.

## 2. Problema y objetivo

HR necesita montar feedback multi-fuente sin lanzar evaluaciones incompletas (pesos o enunciados incoherentes) y gestionar el portafolio sin entrar evaluación por evaluación.

**Objetivos medibles (v1 — 360°):**

- Activar solo cuando las 4 secciones del hub estén completas.
- Pesos de tipos activos = exactamente 100 %; cada tipo activo ≥ 1 enunciado.
- Desde el listado: crear, filtrar, finalizar (si aplica) y eliminar con confirmación.
- Reducir errores de lanzamiento por borradores inviables.

### Fuera de alcance (v1)

- Objetivos, Matriz de talento, PDI, Encuestas (carpetas `_pendiente`).
- Edición de una evaluación 360° ya activa (placeholder en prototipo; sin HU).
- Respuesta del colaborador evaluador.
- Cálculo de resultados en producción.
- Reportes avanzados de ciclo 360 post-activación.

## 3. Personas y permisos

| Rol | Qué puede hacer (observable) | Qué no puede |
| --- | ---------------------------- | ------------ |
| Administrador de recursos humanos | Listar, filtrar, crear, activar, finalizar, eliminar (con confirmación) | Editar 360 activa (no hay flujo); responder como evaluador en este PRD |
| Colaborador | — (respuesta evaluador fuera de alcance) | Gestionar el portafolio admin |
| Otros roles Desempeño | PENDIENTE si existen permisos granulares | — |

## 4. Restricciones de producto

| Hallazgo | Implicación para la experiencia |
| -------- | ------------------------------- |
| Desbloqueo progresivo del hub | Nombre + fechas → Tipo → resto; no se puede saltar el orden |
| Activar exige 4 secciones completas | Botón Activar inerte o bloqueado si falta alguna |
| Pesos = 100 % | No marcar Tipo completo / no activar si la suma ≠ 100 |
| Borrador de creación solo en sesión | Salir o recargar pierde el borrador de creación |
| Eliminar destructivo | Confirmación observable; cancelar deja la evaluación en lista |
| Finalizar solo activas / en curso | No finalizar borradores que aún no están en lista |

## 5. Experiencia de usuario (flujos)

**Entrada:** Admin → Productos → Desempeño y cultura → Evaluaciones 360°.

**Camino feliz — listado → crear → activar:**

1. Admin en listado; elige crear.
2. Hub inmersivo: confirma nombre y fechas → desbloquea Tipo.
3. Completa Tipo (pesos 100 %), Competencias (enunciados), Evaluados y Resultados.
4. Activa → vuelve al listado con confirmación.

**Empty:** filtros/búsqueda sin coincidencias → empty sin resultados + limpiar.

**Error / bordes:**

- Pesos ≠ 100 → no activa; mensaje de pesos.
- Secciones incompletas → Activar no ejecuta.
- Eliminar + cancelar confirmación → permanece en lista.
- Finalizar solo si el estado lo permite.

## 6. Especificación UI

**Listado:**

- Tabla o lista con búsqueda y filtros.
- CTA crear evaluación 360°.
- Acciones por fila: finalizar (si aplica), eliminar (con confirmación).

**Hub de creación (4 secciones):**

1. Nombre y fechas (gate de desbloqueo).
2. Tipo (pesos tipos activos = 100 %).
3. Competencias (≥ 1 enunciado por tipo activo).
4. Evaluados y Resultados.

**Estados:** secciones incompletas / completas; Activar habilitado solo con las 4 completas.

**Copy mínimo:** empty “No se encontraron resultados”; confirmación de creación al volver a lista; mensajes de pesos = 100; confirmación de eliminar.

## 7. Requisitos de calidad (producto)

- Accesibilidad: hub navegable por teclado; confirmaciones de eliminar anunciadas; secciones con estado completo observable.
- Idioma UI: español neutro.
- Privacidad: evaluados y resultados solo del alcance de la empresa; no exponer datos ajenos en listado.
- Empty / error: empty de filtros; bloqueo de activación con mensaje claro; cancelar eliminar sin efecto.

## 8. Criterios de aceptación

**Escenario: Camino feliz — ir a crear**

**Dado** que el admin está en el listado de evaluaciones 360°
**Cuando** elige crear una nueva
**Entonces** entra al hub de creación

**Escenario: Camino feliz — activar 360 completa**

**Dado** que el admin completó nombre, fechas, Tipo con pesos 100 %, competencias con enunciados, evaluados y resultados
**Cuando** pulsa Activar
**Entonces** la evaluación queda creada
**Y** regresa al listado con confirmación de creación

**Escenario: Caso borde — pesos distintos de 100**

**Dado** que el admin tiene tipos activos cuyos pesos suman 90
**Cuando** intenta marcar Tipo como completo o activar
**Entonces** no puede activar la evaluación
**Y** se le indica que los pesos deben sumar 100

**Escenario: Caso borde — filtrar sin resultados**

**Dado** que aplica un filtro sin coincidencias
**Cuando** se actualiza la lista
**Entonces** ve empty state de sin resultados
**Y** puede limpiar filtros o búsqueda

**Escenario: Camino negativo — activar con secciones incompletas**

**Dado** que faltan Evaluados por completar
**Cuando** el admin intenta Activar
**Entonces** la acción no se ejecuta
**Y** permanece en el hub sin crear la evaluación en el listado

**Escenario: Camino negativo — eliminar con confirmación cancelada**

**Dado** que existe una evaluación en el listado
**Cuando** el admin elige eliminarla y cancela la confirmación
**Entonces** la evaluación sigue en el listado

## 9. Fases de entrega

| Fase | Incluye | No incluye |
| ---- | ------- | ---------- |
| v1 | Listado + crear/activar 360 (HU-DES-001, HU-DES-002); finalizar/eliminar según reglas | Objetivos, Matriz, PDI, Encuestas; editar 360 activa; respuesta evaluador |
| Posterior | Edición de 360 activa; resto de Desempeño y cultura; resultados post-ciclo | — |

## 10. Decisiones abiertas

1. **PENDIENTE —** Alcance y reglas de **editar** una 360° ya activa (hoy placeholder).
2. **PENDIENTE —** Orden de priorización de Objetivos / Matriz / PDI / Encuestas.
3. **PENDIENTE —** Permisos granulares por rol dentro de Desempeño.
4. **PENDIENTE —** Qué ve el colaborador al ser evaluador (fuera de este PRD v1).

## 11. Trazabilidad a HUs

| ID tentativo | Título | Fase |
| ------------ | ------ | ---- |
| HU-DES-001 | Crear evaluación 360° | v1 |
| HU-DES-002 | Listado de evaluaciones 360° | v1 |
| — | Editar evaluación 360° activa | Posterior |
| — | Objetivos / Matriz / PDI / Encuestas admin | Posterior (`_pendiente`) |

## 12. Referencias

- [fundamentos/00-mapa.md](../../../fundamentos/00-mapa.md)
- [admin/productos/desempeno-y-cultura/evaluaciones-360/_flujo.md](evaluaciones-360/_flujo.md)
- [admin/productos/desempeno-y-cultura/evaluaciones-360/HU-crear-evaluacion-360.md](evaluaciones-360/HU-crear-evaluacion-360.md) (HU-DES-001)
- [admin/productos/desempeno-y-cultura/evaluaciones-360/HU-lista-evaluaciones-360.md](evaluaciones-360/HU-lista-evaluaciones-360.md) (HU-DES-002)
- [admin/productos/desempeno-y-cultura/objetivos/_pendiente.md](objetivos/_pendiente.md)
- [admin/productos/desempeno-y-cultura/matriz-de-talento/_pendiente.md](matriz-de-talento/_pendiente.md)
- [admin/productos/desempeno-y-cultura/pdi/_pendiente.md](pdi/_pendiente.md)
- [admin/productos/desempeno-y-cultura/encuestas/_pendiente.md](encuestas/_pendiente.md)
