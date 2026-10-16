# PRD · Avisos internos (admin)

| Campo | Valor |
| ----- | ----- |
| Producto | UBITS |
| Versión PRD | 0.1 |
| Estado | Borrador |
| Dueño producto | TBD |
| Módulo (sidenav / flujo) | Admin → Herramientas → Avisos internos |

## 1. Resumen

PRD delgado para **Avisos internos**: el ítem ya existe en Herramientas del Workspace admin, pero solo hay `_pendiente.md` sin HU. Este documento fija el placeholder de producto y las decisiones abiertas; no define aún creación, segmentación ni canales de aviso.

## 2. Problema y objetivo

HR necesita comunicar novedades internas a la empresa. El rail ya expone el destino, pero el producto no está especificado.

**Objetivos de este borrador:**

- Registrar el ítem en el mapa de PRDs.
- Evitar inventar flujos de aviso hasta discovery.
- Dejar ID tentativo para `writer-us-new` cuando toque.

### Fuera de alcance (v1 de este PRD)

- Redactar, programar o segmentar avisos.
- Plantillas, analítica de lectura o push.
- Escribir la HU completa.

## 3. Personas y permisos

| Rol | Qué puede hacer (observable) | Qué no puede |
| --- | ---------------------------- | ------------ |
| Administrador HR | Ver y abrir el ítem Avisos internos en el rail | Usar un flujo de avisos cerrado (aún no existe) |
| Colaborador | PENDIENTE cómo recibe avisos | Gestionar el módulo admin |

## 4. Restricciones de producto

| Hallazgo | Implicación para la experiencia |
| -------- | ------------------------------- |
| Solo `_pendiente.md` | No inventar campos, tonos ni reglas de audiencia |
| Vive en Herramientas junto a Tareas y Agente | Mantener el ítem en ese grupo del sidenav |

## 5. Experiencia de usuario (flujos)

**Entrada:** Admin → Herramientas → Avisos internos.

**Camino actual:** pantalla pendiente / placeholder.

**Empty, error, bordes:** PENDIENTE tras discovery.

## 6. Especificación UI

Sin pantallas de producto cerradas. Label del rail: **Avisos internos**. No inventar formularios ni listados como verdad de producto.

## 7. Requisitos de calidad (producto)

- Accesibilidad: ítem del sidenav etiquetado.
- Idioma UI: español neutro.
- Privacidad: PENDIENTE (quién ve qué aviso).
- Empty / error: PENDIENTE.

## 8. Criterios de aceptación

**Escenario: Camino feliz — llegada desde el rail**

**Dado** que el admin está en el Workspace
**Cuando** abre Herramientas → Avisos internos
**Entonces** llega a la pantalla de ese ítem
**Y** no se le redirige a Tareas ni a Agente de tu empresa

**Escenario: Caso borde — sin HU**

**Dado** que no hay HU publicada de avisos
**Cuando** el admin abre la pantalla
**Entonces** el producto no se presenta como flujo cerrado de producción

**Escenario: Error / camino negativo — alcance inventado**

**Dado** que no hay decisión de canales ni audiencias
**Cuando** se evalúa este PRD
**Entonces** no se aceptan requisitos inventados de envío o segmentación como v1

## 9. Fases de entrega

| Fase | Incluye | No incluye |
| ---- | ------- | ---------- |
| Ahora (borrador) | Ítem en rail; este PRD | HU, UI de avisos |
| Discovery / v1 | Alcance acordado con Dave | Lo no priorizado |

## 10. Decisiones abiertas

1. **PENDIENTE —** ¿Qué es un “aviso” (banner, correo, inbox in-app, modal)?
2. **PENDIENTE —** Audiencias (toda la empresa, grupos, roles).
3. **PENDIENTE —** Relación con comunicaciones / personalización de marca.
4. **PENDIENTE —** Prioridad vs Agente de tu empresa y Tareas.

## 11. Trazabilidad a HUs

| ID tentativo | Título | Fase |
| ------------ | ------ | ---- |
| HU-AVI-001 | Avisos internos (admin) | Posterior / discovery |

*No crear archivo HU hasta que Dave lo pida.*

## 12. Referencias

- [fundamentos/00-mapa.md](../../../fundamentos/00-mapa.md)
- [admin/herramientas/avisos-internos/HU-avisos-internos.md](HU-avisos-internos.md)
- [_indice-hus.md](../../../_indice-hus.md) (carpetas pendientes)
