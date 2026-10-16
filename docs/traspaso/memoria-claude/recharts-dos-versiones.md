---
name: recharts-dos-versiones
description: El playground instala recharts 2 y flux-ui trae su propio recharts 3; ChartContainer + gráficos del proyecto no dibuja nada.
metadata: 
  node_type: memory
  type: project
  originSessionId: 06ede155-c0a3-4442-8631-c8aae781786a
  modified: 2026-09-10T16:18:42.528Z
---

Medido el 2026-09-10 en `/design-system/templates/app-shell-3`.

- `package.json` del playground (protegido): `"recharts": "^2.15.4"`.
- `@ubits/flux-ui` 0.5.5 declara `recharts ^3.10.1` como **dependency**, no como peer, así que
  npm le instala una copia privada en `node_modules/@ubits/flux-ui/node_modules/recharts`.
- `ChartContainer`, `ChartTooltip`, `ChartTooltipContent` y `ChartLegendContent` de flux-ui
  están construidos sobre esa copia 3.x.

Resultado: el patrón documentado en la skill `reui-to-flux-ui` («recharts para AreaChart +
wrappers de flux-ui») **no funciona**. El `ResponsiveContainer` de la v3 pasa las medidas por
contexto; un `AreaChart` importado de la v2 del proyecto no lo lee, se queda sin ancho ni alto y
no pinta nada. No hay error en consola: el hueco sale vacío, sin más.

Diagnóstico rápido: `.recharts-responsive-container > div` mide 0×0 y no hay `.recharts-surface`.

**Workaround usado:** no usar `ChartContainer`; sacar todo de la copia del proyecto
(`ResponsiveContainer`, `AreaChart`, `Tooltip`, `Legend` de `recharts`) y colorear con
`var(--chart-N)`, `var(--border)`, `var(--popover)`, `var(--muted-foreground)`.

**Arreglo de fondo (lo decide ingeniería):** subir el playground a `recharts ^3.10.1` para que npm
deje una sola copia, o que flux-ui pase recharts a `peerDependencies`.

**Ojo al verificar:** el panel de navegador de Claude suele estar oculto (`document.hidden`),
ahí `ResizeObserver` no dispara y cualquier gráfico sale vacío aunque el código esté bien.
Para ver la verdad, capturar con Chrome headless controlado por CDP (script en el scratchpad de
la sesión del 2026-09-10). Relacionado: [[sidebar-flux-ui-trampas]], [[accent-igual-a-primary]].
