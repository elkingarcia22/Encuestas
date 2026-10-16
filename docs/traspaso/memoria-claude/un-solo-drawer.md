---
name: un-solo-drawer
description: Desde el 18-sep el único panel lateral es DrawerShell (flotante de Nicolás); no usar Sheet ni Drawer de la librería directo.
metadata:
  type: project
---

Decisión de Cristian, 18-sep-2026: el panel lateral del producto es el flotante de Nicolás,
`DrawerShell` en `src/modules/design-system/drawers/components/drawer-shell.tsx` (flota a 12 px,
esquinas de 16 px, cabecera con título/bajada/estado/cerrar, cuerpo con scroll, pie gris). Las 9
pantallas que usaban `Sheet` se migraron; no queda ninguno.

**Por qué:** Carlos vio en el follow up del 17-sep dos drawers distintos (Sheet pegado al borde en
las pantallas, flotante en el design system). Ver [[reunion-follow-up-2026-09-17]].

**Cómo aplicarlo:** para crear, editar o ver detalle, `DrawerShell` con `title`, `description`,
`badge`, `media` y `footer` (con `DrawerClose` para cerrar). Trae su propia X y su padding: no
agregar `px-4` al cuerpo. Para convivir con otro panel: `modal={false}`,
`disablePointerDismissal` y `style={{ right }}`. Documentado en Ajustes propios.
