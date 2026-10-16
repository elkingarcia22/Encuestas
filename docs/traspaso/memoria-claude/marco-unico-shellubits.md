---
name: marco-unico-shellubits
description: Design system y templates de producto comparten un solo marco (ShellUbits) con cuerpo de 1.140 px; decisión del usuario del 2026-09-11.
metadata: 
  node_type: memory
  type: project
  originSessionId: 7cccada6-400a-4553-948c-fcd7e7c7b09e
  modified: 2026-09-14T04:16:57.842Z
---

El 2026-09-11 el usuario pidió que el design system y los templates tuvieran «el mismo shell y el
mismo límite de ancho». Eligió el marco de los templates (menú flotante con marca, pestañas
Workspace / Agente IA, usuario abajo, encabezado con migas) y el cuerpo centrado a **1.140 px**.

Cómo quedó: `src/modules/design-system/shell/shell-ubits.tsx` es el marco único; `shell/main.tsx`
lo aplica a todas las páginas de documentación con una ruta de layout sin path en
`design-system/routes.ts`. Dashboard, Dashboard RR.HH. y Colaborador lo usan con su propio menú.
Se monta como overlay `fixed inset-0 z-50` encima del RootLayout porque `src/shared/layouts/`
es zona de ingeniería y el check falla si se toca. Auth, Shell test y App shell 2/3 conservan
su marco propio (son base y exploraciones). Las secciones /portal-colaborador y /admin siguen
con el marco viejo del playground.

**How to apply:** toda pantalla o template nuevo va dentro de `ShellUbits`; no crear otro marco
ni otro ancho de cuerpo. Si un template necesita algo que el marco no trae, se le suma una opción
que por defecto no cambia nada. Desde el 2026-09-11 (Home operativo) tiene: `marca.fila` (menú de
empresa en toda la fila del logo), `promo` (tarjeta al pie del menú), `cuenta` (reemplaza campana
y tema del encabezado), `agente` (menú y vista de la pestaña Agente IA), `accion` en entradas del
pie y tercer nivel del menú (`hijos` dentro de un hijo abre una vista con fila «volver»).
Desde el 2026-09-13 (template Suite AI, [[concepto-nicolas]]) suma, todo opcional: `modo` /
`onModoChange` (la pestaña la decide el template según la ruta), `iconosModo`, `variante`
('floating' por defecto o 'sidebar' pegado al borde), `abierto` / `onAbiertoChange` (plegar a
íconos), `lateral` (panel acoplado a la derecha a toda la altura) y `agente.vista` opcional. Se
comprobó que Home operativo y las páginas del design system se ven igual. Relacionado: [[pedido-pantallas-no-patrones]],
[[templates-overlay-verificacion]].
