---
name: botones-una-esquina
description: Desde el 18-sep los botones usan la esquina de la librería (sin 8 px forzados) y el terciario de solo icono es BotonIcono, redondo.
metadata:
  type: project
---

Decisión de Cristian, 18-sep-2026:
- **Esquina de la librería en todos los botones** (12 px normal y grande, 10 px chico, 8 px mini).
  El `WS` de `design-system/drawers/components/drawer-styles.ts` quedó vacío (antes forzaba
  8 px en 76 botones de los patrones de Nicolás). La pastilla (`PILL`) sigue solo para IA.
- **Terciario de solo icono = `BotonIcono`** (`src/shared/components/BotonIcono.tsx`): ghost en
  círculo, `aria-label` obligatorio, `size` icon-* (icon-sm por defecto). Reemplazó 89 botones.
  **Excepción:** el riel de la barra lateral (`SidebarRail`, `rail-sidebar`) conserva su forma.

**Por qué:** Carlos vio en el follow up del 17-sep un «tutifruti» de esquinas y pidió el
terciario de solo icono 100 % redondo. Ver [[reunion-follow-up-2026-09-17]].

**Cómo aplicarlo:** botón de solo icono sin borde → `<BotonIcono aria-label="…">`. Nunca
`rounded-*` en un `<Button>`. Documentado en Botones › Todas las variantes y en Ajustes propios.
