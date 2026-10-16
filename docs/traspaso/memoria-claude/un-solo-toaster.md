---
name: un-solo-toaster
description: El único toaster del producto es src/shared/components/Toaster.tsx en RootLayout; montar ToastToaster en una pantalla duplica cada aviso.
metadata:
  type: project
---

Desde el 18-sep-2026 el único toaster es `src/shared/components/Toaster.tsx`, montado en RootLayout
(también cubre los templates, que viven debajo). Pinta el icono de cada tipo con su color del tema
(success verde, info azul, warning amarillo, error rojo) y va en z-60, por encima de
FullscreenTemplate (z-50).

**Por qué:** 8 pantallas montaban además `ToastToaster` de flux-ui; como comparten el gestor
`toast`, cada aviso salía dos veces, uno encima del otro (uno sin icono y otro con icono). Además,
ToastToaster solo pinta de color el icono de error. Carlos lo vio el 17-sep ([[reunion-follow-up-2026-09-17]]).

**Cómo aplicarlo:** lanzar avisos con `toast.add({ type, title })` o `notify()`; nunca envolver
una pantalla en `ToastToaster`. Documentado en Ajustes propios como pedido a la librería.
