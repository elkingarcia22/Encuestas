# PRD · Configuración (menú del logo)

| Campo | Valor |
| ----- | ----- |
| Producto | UBITS |
| Versión PRD | 0.1 |
| Estado | Borrador |
| Dueño producto | TBD |
| Módulo (sidenav / flujo) | Admin → menú del logo de empresa → Configuración (no sidenav ni AppHeader) |

## 1. Resumen

PRD delgado del bloque **Configuración** del Workspace admin: entrada por el **menú de tres puntos junto al logo de empresa** (no es ítem del sidenav ni del AppHeader). Agrupa cinco destinos todos `_pendiente`: gestión de usuarios, personalización, organigrama, datos de empresa y roles y permisos. Sin HUs ni flujos cerrados.

## 2. Problema y objetivo

La empresa necesita configurar identidad, personas, estructura y permisos. El menú del logo ya enlaza a esos destinos, pero las pantallas son placeholders.

**Objetivos de este borrador:**

- Dejar clara la **entrada de navegación** (menú logo).
- Listar los cinco submódulos sin inventar reglas.
- Preparar IDs tentativos para cuando se priorice.

### Fuera de alcance (v1 de este PRD)

- CRUD de usuarios, roles, organigrama o datos.
- Branding / personalización visual cerrada.
- Escribir HUs completas.

## 3. Personas y permisos

| Rol | Qué puede hacer (observable) | Qué no puede |
| --- | ---------------------------- | ------------ |
| Administrador HR / implementación | Abrir el menú del logo y los destinos de Configuración | Usar pantallas de configuración como producto cerrado |
| Colaborador | Ve logo de empresa **sin** menú de tres puntos | Entrar a Configuración admin |

## 4. Restricciones de producto

| Hallazgo | Implicación para la experiencia |
| -------- | ------------------------------- |
| Configuración no vive en el sidenav | No mover estos ítems al rail de Productos/Herramientas sin decisión |
| Cinco carpetas `_pendiente` | No inventar formularios ni matrices de permisos |
| Colaborador sin menú en el logo | La cara colaborador no expone Configuración |

## 5. Experiencia de usuario (flujos)

**Entrada:** clic en menú del logo (admin) → elegir: Gestión de usuarios | Personalización | Organigrama | Datos de empresa | Roles y permisos.

**Camino actual:** cada destino abre placeholder.

**Empty / error / bordes:** PENDIENTE por submódulo.

## 6. Especificación UI

- Contenedor de navegación: menú del logo (no sidenav).
- Cinco destinos con labels neutros: Gestión de usuarios, Personalización, Organigrama, Datos de empresa, Roles y permisos.
- Sin campos de negocio cerrados en este borrador.

## 7. Requisitos de calidad (producto)

- Accesibilidad: menú del logo operable; ítems con nombres claros.
- Idioma UI: español neutro.
- Privacidad: cuando existan datos, solo admins autorizados del tenant (PENDIENTE detalle de roles).
- Empty / error: PENDIENTE.

## 8. Criterios de aceptación

**Escenario: Camino feliz — entrada por el logo**

**Dado** que el admin está en el Workspace
**Cuando** abre el menú del logo de empresa y elige un destino de Configuración
**Entonces** llega a la pantalla de ese destino
**Y** el destino no aparece como ítem del sidenav de Productos o Herramientas

**Escenario: Caso borde — colaborador**

**Dado** que un colaborador ve el logo de empresa
**Cuando** mira el chrome del Workspace colaborador
**Entonces** no ve el menú de Configuración del logo admin

**Escenario: Error / camino negativo — alcance inventado**

**Dado** que no hay HU de usuarios, roles u organigrama
**Cuando** se evalúa este PRD
**Entonces** no se aceptan requisitos inventados de CRUD o matriz de permisos como v1

## 9. Fases de entrega

| Fase | Incluye | No incluye |
| ---- | ------- | ---------- |
| Ahora (borrador) | Entrada por menú logo; cinco destinos; este PRD | HUs y pantallas de producto |
| Discovery / v1 | Priorizar el primer submódulo (PENDIENTE cuál) | El resto hasta priorización |

## 10. Decisiones abiertas

1. **PENDIENTE —** Orden de priorización entre usuarios, personalización, organigrama, datos y roles.
2. **PENDIENTE —** Quién además del admin HR puede entrar (implementación, superadmin).
3. **PENDIENTE —** Relación de Roles y permisos con lo que ya asume el playground (admin vs creador LMS).
4. **PENDIENTE —** Alcance de Personalización (marca, colores, login, correos).

## 11. Trazabilidad a HUs

| ID tentativo | Título | Fase |
| ------------ | ------ | ---- |
| HU-CFG-001 | Gestión de usuarios | Posterior / discovery |
| HU-CFG-002 | Personalización | Posterior / discovery |
| HU-CFG-003 | Organigrama | Posterior / discovery |
| HU-CFG-004 | Datos de empresa | Posterior / discovery |
| HU-CFG-005 | Roles y permisos | Posterior / discovery |

*No crear archivos HU hasta que Dave lo pida.*

## 12. Referencias

- [fundamentos/00-mapa.md](../../fundamentos/00-mapa.md)
- [fundamentos/02-personas-y-roles.md](../../fundamentos/02-personas-y-roles.md)
- [admin/configuracion/gestion-usuarios/_pendiente.md](gestion-usuarios/_pendiente.md)
- [admin/configuracion/personalizacion/_pendiente.md](personalizacion/_pendiente.md)
- [admin/configuracion/organigrama/_pendiente.md](organigrama/_pendiente.md)
- [admin/configuracion/datos-empresa/_pendiente.md](datos-empresa/_pendiente.md)
- [admin/configuracion/roles-y-permisos/_pendiente.md](roles-y-permisos/_pendiente.md)
- [_indice-hus.md](../../_indice-hus.md) (Configuración — menú del logo)
