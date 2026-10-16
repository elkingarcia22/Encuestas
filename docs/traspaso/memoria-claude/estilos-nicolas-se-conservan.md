---
name: estilos-nicolas-se-conservan
description: "Decisión del usuario (2026-09-15): los estilos forzados del marco de Nicolás se conservan y se documentan en el DS como especificación, no se quitan."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: bec59ca1-6c42-4844-9b78-e4dd5b5e2d6a
  modified: 2026-09-15T16:47:02.951Z
---

La auditoría del 2026-09-15 encontró ~840 clases con «!» en el marco, Suite AI y patrones de Nicolás (48 % tamaño y
espacio, 21 % color con tokens, 11 % esquinas, 9 % letra; 775 cambian aspecto, 77 son de acomodo). Todo usa flux-ui.
El usuario dijo: «quiero mantener el diseño que está, es lindo, no quiero eliminar los estilos que Nicolás creó» y
eligió **documentarlo en el DS**.

**Why:** el diseño calibrado al prototipo le gusta a él y a Carlos; quitarlo lo haría ver como la librería por defecto.

**How to apply:** no proponer quitar esos estilos. Están documentados en `/design-system/marco`, pestaña **Medidas**
(commit f221b5a en prueba-fusion, tabla librería vega vs. marco UBITS, receta del estado activo, esquinas en uso). Salida
de fondo: pedir a la librería un estilo «UBITS» (hoy trae 8: vega, maia, nova, luma, lyra, mira, rhea, sera; el
proyecto usa vega y ninguno calza). Sí se pueden arreglar sin tocar el look: los 9 controles hechos a mano y el doble
h1. La página para Nicolás (artifact https://claude.ai/artifact/54nakcTJTzfEFJA3ULXq4W) todavía le pide quitar las
clases: hay que actualizarla antes de compartirla. Carlos había pedido esquinas por defecto: confirmar con él.
Relacionado: [[fusion-rama-nico]], [[ancho-y-tipografia]].

**Revisión ReUI del 2026-09-16** (pedido de Carlos: escaneo 100% ReUI + lista de forzados con el porqué): el artifact
https://claude.ai/artifact/54nakcTJTzfEFJA3ULXq4W («Ajustes ReUI del marco», versión 2) ya no dice «quitar estilos»: lista
cada forzado con su porqué y una propuesta (volver a la librería / documentar como variante / pedir a la librería), con
casillas para decidir. Cifras: 276 clases con «!», ~370 ajustes sobre piezas de flux-ui, 635 textos con letra a mano, 28
pastillas (18 IA). Escáner reutilizable: `scratchpad/escaneo-reui.mjs <raíz> <salida.json>`. El enlace compartido tiene
la vista fijada en la versión 1: hay que mover el pin desde el menú de compartir.

**2026-09-16, decisión nueva del usuario:** «aplica las filas de volver a la librería» (commit 3bbd6ff en
prueba-fusion): sin pastilla fuera de la IA (modales, ⌘K, barra de procesos), altos de botón por tamaños de la
librería (sm 32, default 36, lg 40), radios a la escala del tema, Badge «Nuevo» = primary-light xs, Progress sin color
de texto, ⌘K con CommandInput, títulos de diálogo con `render={<Heading/>}`. Se dejaron las filas «documentar» y
«pedir» (X circular, grises de hover, selector de espacio, aire de la barra, menús opacos, botón IA). La letra a mano
(635) sigue pendiente. Toca AppSidebar (el check lo marca hasta commitear): avisar a Nicolás.

**Documentación de lo forzado (2026-09-17, «documenta mejor los componentes que están forzados»):** página
`/design-system/ajustes` (Componentes › Ajustes propios, `design-system/ajustes/main.tsx`): 19 fichas con estado
(Variante UBITS 11 / Pedido a la librería 5 / Por decidir 3), ejemplo en vivo de la librería frente a UBITS (capturas en
`ajustes/assets`, hechas con `scratchpad/capturar-ajustes.mjs`), qué cambia, por qué, dónde vive y cuándo usarlo, más
reglas «antes de forzar». Marco › Medidas quedó al día y enlaza ahí. Si se fuerza algo nuevo, sumar una ficha.
