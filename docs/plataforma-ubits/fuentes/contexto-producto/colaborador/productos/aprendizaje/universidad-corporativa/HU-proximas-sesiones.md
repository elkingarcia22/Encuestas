# HU: Próximas sesiones presenciales en Universidad corporativa

> **Estado: obsoleta (sep-2026).** El carrusel se **eliminó** de Universidad corporativa. El producto de **Mis eventos / Eventos públicos** vive en Zona de estudio · tab Eventos ([HU-APR-011](../zona-estudio/HU-tab-eventos.md)). Sigue existiendo demo de layout en `/lab/u-corporativa-layout`. Lo que **sigue** en U. Corporativa: buscar o filtrar por tipo **Sesión** en la lista de contenidos (ver alcance residual abajo y HU-APR-005).

## Contexto

Las formaciones en sitio se publican como Evento, pero el colaborador necesita ver **cuándo** ocurre cada sesión, no solo el contenido padre en el catálogo. Destacar las próximas sesiones reducía que se pierdan jornadas. Esa entrada ya no es el carrusel de U. Corporativa.

## Historia de Usuario

**Como** colaborador de mi empresa,
**quiero** ver un carrusel de próximas sesiones presenciales al entrar a Universidad corporativa,
**para** enterarme de las jornadas en sitio y abrir el Evento correspondiente para confirmar asistencia.

## Alcance

**Incluye (histórico — ya no aplica en producto):**
- Sección **Próximas sesiones presenciales** encima de la lista de contenidos (después del banner).
- Carrusel de cards tipo **Sesión**.

**Incluye (residual — sigue en U. Corporativa):**
- El buscador y el filtro por tipo **Sesión** de la lista pueden devolver cards de sesión (mismo tamaño que el resto del catálogo).

**Excluye:**
- Confirmar asistencia o cuenta regresiva (HU-APR-009).
- Crear o editar sesiones en LMS Creator.
- Página Eventos del sidenav (solo demo en lab hasta decisión de producto).

## Reglas de Negocio

- **RN-01 a RN-07, RN-09:** Aplicaban al carrusel en U. Corporativa — **retiradas** del producto.
- **RN-08:** Si María busca en el catálogo (título de sesión, Evento o «sesión») o filtra por tipo **Sesión**, las sesiones coincidentes aparecen en la lista con el mismo alto que las cards de contenido. Clic abre el Evento padre. **Sigue vigente.**

## Criterios de Aceptación

**Escenario: Carrusel retirado de U. Corporativa**

**Dado** que mi empresa tiene Eventos con sesiones
**Cuando** María abre Universidad corporativa
**Entonces** no ve la sección **Próximas sesiones presenciales** debajo del banner
**Y** ve el banner y la lista de contenidos

**Escenario: Residual — buscar o filtrar sesiones en la lista**

**Dado** que María está en Universidad corporativa
**Cuando** busca un título de sesión o filtra por tipo **Sesión**
**Entonces** las sesiones coincidentes aparecen en la lista
**Y** al hacer clic abre el Evento padre
