---
name: pantallas-casos-uso-admin
description: "Ver en acción" en cada página del DS (en-accion.ts) y 4 pantallas nuevas del admin armadas desde la plataforma real el 2026-09-16.
metadata:
  type: project
---

El 2026-09-16 el usuario pidió más pantallas con casos de uso y un botón en cada página del DS («ver en acción»).

- **Botón:** `VerEnAccion({ pagina, pantallas? })` en `design-system/patrones/piezas.tsx` (reemplazó a
  VerEnPantallasReales); los destinos viven en `design-system/patrones/en-accion.ts` por página. Está en 18 páginas
  (fundamentos, componentes, patrones, IA, agente contextual y su configurador). Las subpáginas de navegacion/* y
  agente-contextual/* (CaseFrame) no lo llevan: son casos en sí.
- **Pantallas nuevas** (commit 3dc68ff en prueba-fusion), hechas con 4 subagentes en paralelo a partir del recorrido real
  ([[recorrido-admin-ubits]]) y las HU:
  - `/admin/tareas`: seguimiento HR (HU-TAR-003) + maestro-detalle (detalle a la derecha desde 1.280 px, Sheet si no).
  - `/admin/avisos-internos` (+ `/nuevo`, `/:id/editar`; `av-107` es el borrador con errores para la revisión):
    lista tipo «Comunicaciones» y editor con agente (reescribir + revisar antes de publicar).
  - `/admin/seleccion/vacantes/:id` (`analista-de-datos`, `disenadora-de-producto`, `coordinador-de-turno`): Kanban de
    5 etapas, ficha en Sheet, agente en el `right-panel-slot` del marco (resumir y comparar finalistas). Las filas de
    Vacantes con detalle navegan ahí.
  - `/admin/configuracion/datos-empresa` y `/personalizacion`, enlazadas desde el menú de empresa en /admin
    (`CONFIGURACION_ADMIN` en nav-config).
- **En el DS** (commit cefbecd): Pantallas › «En el producto» (página y menú) con las 5 pantallas.
- **Barra lateral** (94d347e): `CON_SUBPAGINAS` en nav-config hace que Tareas, Avisos internos y Vacantes sigan
  marcadas en sus subpáginas (sin tocar AppSidebar); la plantilla admin lleva a esas pantallas y a Configuración real.
- Migas: fallback con mayúscula solo inicial y `NOMBRES_SIN_MENU` en nav-config.

**Why:** Carlos aprobó armar pantallas preliminares desde la plataforma real sin romper lo construido y sin mostrar lo
que no pertenece a la sección ([[reunion-follow-up-2026-09-16]]).
**How to apply:** al sumar una pantalla, agregar su destino en en-accion.ts. Prettier sobre archivos de Nicolás
reformatea todo: editar sus archivos a mano, sin prettier.
