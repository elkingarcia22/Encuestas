---
name: tooltip-solo-hover
description: El Tooltip de flux-ui (Base UI) solo abre con cursor o foco y se cierra al hacer clic; para iconos de información hay que controlarlo para que abra con clic/toque.
metadata:
  type: feedback
---

El 2026-09-14 el usuario reportó «los tooltips aún no funcionan» en las métricas del Inicio: al pasar el
cursor sí abrían, pero él hacía clic (y en celular solo hay toque), y el Tooltip de flux-ui no abre con
clic: además `closeOnClick` viene activo en el trigger.

**Why:** los iconos «i» del prototipo muestran la ayuda con clic o foco; si solo abre con hover, en
táctiles no funciona nunca.

**How to apply:** para ayudas que el usuario va a tocar, usar Tooltip controlado: `open`/`onOpenChange`,
`TooltipTrigger closeOnClick={false} onClick={() => setAbierta(true)}` (ejemplo `AyudaMetrica` en
`home-operativo/components/inicio-operativo.tsx`). Se cierra solo al tocar afuera. Al probar por CDP,
verificar hover **y** clic.
