---
name: revisar-contra-reui
description: >-
  Revisar una pantalla ya hecha del playground contra ReUI, que es la base de la librería:
  encontrar lo que se forzó a mano pudiendo salir de un componente, y documentar lo que sí
  hubo que forzar. Usar cuando pidan "revisa esta pantalla", "esto se puede hacer con la
  librería?", "haz la revisión ReUI", "documenta lo que está forzado", o antes de entregar
  una pantalla nueva.
---

# Revisar una pantalla contra ReUI

La librería `@ubits/flux-ui` copia ReUI por dentro, así que casi todo lo que se ve en
reui.io existe ya. Revisar es buscar dónde nos salimos de eso y decidir si vuelve a la
librería o se queda documentado.

## Qué se busca

1. **Dibujado a mano**: `div` o `span` con clases que imitan algo que ya existe. Un círculo
   con iniciales es `Avatar`; una barra de color, `Progress`; un recuadro vacío con mensaje,
   `Empty`; una etiqueta de estado, `Badge`.
2. **Apariencia sobrescrita**: clases en `className` que cambian color, borde, sombra o foco
   de un componente. `className` es solo para maquetación (ancho, márgenes, truncado).
3. **Colores y letra fuera del tema**: colores literales, paleta cruda de Tailwind, tamaños de
   letra a mano. Solo tokens.
4. **Iconos** que no sean Hugeicons dentro de `<HugeiconsIcon icon={...} />`.
5. **Lo de IA sin su icono**: evaluaciones, puntajes, lecturas, etapas o notas que produce la IA
   y no llevan `<IconoIA />` (el orbe) antes del texto, o que usan estrellas o chispas
   (`SparklesIcon`, `AiMagicIcon`, `MagicWand01Icon`, `StarsIcon`): se cambian por el orbe. La
   regla completa está en la skill `flux-ui-storybook`.
6. **Botón de IA fuera de su lugar**: el botón de IA va siempre el último de su fila, a la
   derecha de todo (después del primario). El «⋯» va al otro extremo, el primero de la fila. Si hay algo a la derecha
   del botón de IA o a la izquierda del «⋯», se mueve.

## Cómo consultar ReUI

- El código de un componente, gratis y sin sesión:
  `https://reui.io/r/styles/base-vega/<nombre>.json` (el código va en `files[].content`).
- La ficha de un componente: `https://reui.io/components/<nombre>`.
- Los **bloques** (`/blocks/...`) son de pago, pero su vista previa pública se ve en
  `https://reui.io/preview/base/<nombre>` y sirve de referencia de composición.
- Para elegir componente, el catálogo local `ai-tools/flux-ui/flux-ui-para-ia.json` manda: son
  los 89 con sus variantes permitidas, en español, y no necesita conexión.

## Qué hacer con cada hallazgo

- **Se puede con la librería** → se cambia, y se comprueba que no se rompió nada.
- **No se puede** → se documenta en «Ajustes propios» (`src/modules/design-system/ajustes/`),
  con: qué cambia, por qué, dónde vive, cuándo usarlo, **con qué componentes de ReUI está
  hecho** y un ejemplo vivo de cómo se ve en la librería al lado de cómo se ve en UBITS.
  Los dos ejemplos tienen que ser comparables: no vale una captura contra un componente vivo.
- **Falta en la librería** → queda como «Pedido a la librería» hasta que el equipo lo resuelva.

## Antes de tocar nada

Lo que hizo otra persona del equipo se respeta. En particular, **no pases Prettier sobre
archivos ajenos**: reformatea el archivo entero y el cambio real se pierde entre miles de
líneas. Aplica los cambios a mano.

Cierra siempre con `npm run check`.
