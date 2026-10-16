# PRD · Aprendizaje insights — Diagnóstico, Reportes y Métricas (admin)

| Campo | Valor |
| ----- | ----- |
| Producto | UBITS |
| Versión PRD | 0.1 |
| Estado | Borrador |
| Dueño producto | TBD |
| Módulo (sidenav / flujo) | Admin → Productos → Aprendizaje → Diagnóstico / Reportes / Métricas |

## 1. Resumen

PRD delgado para tres ítems del rail de Aprendizaje admin que **ya existen en navegación** pero no tienen historias de usuario ni producto cerrado: **Diagnóstico**, **Reportes** y **Métricas**. v1 de este documento solo fija el placeholder de producto, abre decisiones y deja IDs tentativos para cuando se priorice el discovery.

## 2. Problema y objetivo

HR necesita medir y diagnosticar el aprendizaje a nivel empresa. El sidenav ya promete Diagnóstico, Reportes y Métricas bajo Aprendizaje, pero las pantallas están pendientes: no hay alcance, métricas canónicas ni flujos.

**Objetivos de este PRD (borrador):**

- Documentar que los tres ítems son hojas del rail admin.
- Evitar inventar KPIs o pantallas hasta decisión de producto.
- Preparar trazabilidad a HUs tentativas (HU-APR-ADM-*).

### Fuera de alcance (v1 de este PRD)

- Definir KPIs, gráficos, filtros o exportaciones.
- Escribir HUs completas.
- Paridad con Métricas / Diagnóstico del colaborador.
- Reportes de un plan concreto (ya cubiertos en otras HUs de Planes).

## 3. Personas y permisos

| Rol | Qué puede hacer (observable) | Qué no puede |
| --- | ---------------------------- | ------------ |
| Administrador HR | Ver los ítems en el sidenav y abrir el placeholder | Usar un producto de insights cerrado (aún no existe) |
| Colaborador | — | No usa estos ítems del rail admin |
| Creador LMS | PENDIENTE si comparte acceso a Reportes/Métricas | — |

## 4. Restricciones de producto

| Hallazgo | Implicación para la experiencia |
| -------- | ------------------------------- |
| Solo existe `_pendiente.md` por ítem | No inventar copy de KPIs ni tablas “de ejemplo” como verdad de producto |
| El mapa ya los lista como hojas bajo Aprendizaje | El rail no debe ocultarlos; el vacío es intencional hasta discovery |
| Hay reportes de plan en otras HUs | Este PRD no duplica reportes de contenidos/competencias de un plan |

## 5. Experiencia de usuario (flujos)

**Entrada:** Admin → Productos → Aprendizaje → Diagnóstico | Reportes | Métricas.

**Camino actual (placeholder):** el admin abre el ítem y ve pantalla pendiente / vacía de producto (según prototipo).

**Empty / error / bordes:** PENDIENTE — se definirán cuando haya alcance de insights.

## 6. Especificación UI

- Tres destinos distintos en el rail (no un único hub obligatorio hasta decidirlo).
- Sin campos de negocio cerrados en este borrador.
- Copy de placeholder: no inventar títulos de métricas; mantener mensaje de “en construcción” o vacío del prototipo hasta discovery.

## 7. Requisitos de calidad (producto)

- Accesibilidad: ítems del sidenav con labels claros (Diagnóstico, Reportes, Métricas).
- Idioma UI: español neutro.
- Privacidad: cuando existan datos, solo alcance de la empresa del admin (PENDIENTE detalle).
- Empty / error: PENDIENTE.

## 8. Criterios de aceptación

**Escenario: Camino feliz — llegada desde el rail**

**Dado** que el admin está en el Workspace admin
**Cuando** abre Productos → Aprendizaje → Diagnóstico (o Reportes, o Métricas)
**Entonces** llega a la pantalla correspondiente de ese ítem
**Y** no se le redirige a otro módulo de Aprendizaje

**Escenario: Caso borde — sin HU de producto**

**Dado** que aún no hay HU publicada para el ítem
**Cuando** el admin abre la pantalla
**Entonces** no se presenta un flujo de insights como si estuviera cerrado en producción
**Y** el estado permanece como placeholder de producto

**Escenario: Error / camino negativo — alcance inventado**

**Dado** que no hay decisión de KPIs ni exports
**Cuando** se evalúa este PRD
**Entonces** no se aceptan requisitos inventados de tablas, gráficos o descargas como v1

## 9. Fases de entrega

| Fase | Incluye | No incluye |
| ---- | ------- | ---------- |
| Ahora (borrador) | Ítems en rail; este PRD; IDs tentativos | HUs, UI de insights, exports |
| Discovery | Definir problema, KPIs y separación Diagnóstico vs Reportes vs Métricas | Implementación completa |
| v1 producto | Primera entrega acordada tras discovery | Todo lo no priorizado |

## 10. Decisiones abiertas

1. **PENDIENTE —** ¿Diagnóstico, Reportes y Métricas son tres productos o un hub con pestañas?
2. **PENDIENTE —** ¿Qué preguntas de negocio responde cada ítem (sin solaparse con reportes de Planes / Resultados LMS)?
3. **PENDIENTE —** ¿Quién tiene permiso además del admin HR?
4. **PENDIENTE —** Relación con Métricas y Diagnóstico del colaborador.
5. **PENDIENTE —** Primera métrica o reporte mínimo viable.

## 11. Trazabilidad a HUs

| ID tentativo | Título | Fase |
| ------------ | ------ | ---- |
| HU-APR-ADM-001 | Diagnóstico (admin Aprendizaje) | Posterior / discovery |
| HU-APR-ADM-002 | Reportes (admin Aprendizaje) | Posterior / discovery |
| HU-APR-ADM-003 | Métricas (admin Aprendizaje) | Posterior / discovery |

*No crear archivos HU hasta que Dave lo pida.*

## 12. Referencias

- [fundamentos/00-mapa.md](../../../fundamentos/00-mapa.md)
- [admin/productos/aprendizaje/diagnostico/HU-diagnostico-listado.md](diagnostico/HU-diagnostico-listado.md)
- [admin/productos/aprendizaje/reportes/_pendiente.md](reportes/_pendiente.md)
- [admin/productos/aprendizaje/metricas/_pendiente.md](metricas/_pendiente.md)
- [_indice-hus.md](../../../_indice-hus.md) (sección carpetas pendientes)
