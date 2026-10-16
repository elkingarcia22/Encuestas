# Iconos Glass para flux-ui

Entrega del equipo de UX (playground-ux) al equipo de librería. Mientras flux-ui no los publique,
el playground los usa desde esta carpeta como imágenes (excepción aprobada por UX a la regla de
«solo Hugeicons»; avisar a ingeniería). 50 iconos de estilo vidrio para
usar como **ilustraciones pequeñas** (tarjetas de atajos, indicadores, vacíos, promociones), no como
iconos de interfaz. Los iconos de interfaz siguen siendo Hugeicons.

## Qué hay

```
public/iconos-glass/
  catalogo.json          ← nombre, nombre en español, categoría, palabras de búsqueda y nodo de Figma
  <categoría>/glass-<nombre>@1x.png   144 × 144 px
  <categoría>/glass-<nombre>@2x.png   288 × 288 px
  <categoría>/glass-<nombre>@4x.png   576 × 576 px
```

El catálogo visual está en el playground: **Design system › Icons** (`/design-system/icons`), con
buscador, categorías, fondos de prueba, copiar nombre y descarga.

- **50 iconos, 11 categorías:** acciones (9), multimedia (6), navegación (5), comercio (5), cuenta y
  seguridad (5), comunicación (4), archivos (4), favoritos (4), datos (3), alertas (3), tiempo y
  agenda (2).
- **Fondo transparente.** Cada icono va centrado en un lienzo cuadrado por su área visible (con
  sombras y desenfoque) y a su tamaño original de Figma, sin estirarlo. Así todos se alinean igual
  en una rejilla.
- **Nombres en inglés, con el prefijo `glass-`**, en minúsculas y con guiones, siguiendo el nombre de
  Iconly. En `catalogo.json` va el nombre en español y palabras de búsqueda para el buscador.
- **Nombres repetidos en Figma**, resueltos con el nombre que usa el set de Iconly:
  Bag → `bag` y `bag-2`; Arrow → `arrow-right-circle` y `arrow-up-square`;
  Info → `info-circle` e `info-square`; Menu → `more-square` y `more-circle`;
  Star → `star` y `ticket-star`; Lock → `lock` y `password` (el candado con llave).

## Por qué PNG y no SVG

El efecto de vidrio es un desenfoque del fondo. Figma lo exporta en SVG con una técnica que los
navegadores no aplican cuando el SVG se usa como imagen: la forma de atrás queda nítida y el icono
pierde el vidrio. En PNG se conserva tal cual se ve en Figma. Si la librería necesita vectores, están
en el archivo de Figma (columna `nodoFigma` del catálogo).

## Cómo los propone UX para flux-ui

Un componente de ilustración (por ejemplo `GlassIcon`) que reciba el nombre y un tamaño, y sirva la
versión @1x, @2x o @4x según la densidad de la pantalla (`srcset`). Tamaños de uso esperados:
48 px (listas), 64 px (tarjetas de atajos) y 96 px (vacíos). Con `alt=""` cuando van junto a un texto
que ya dice lo mismo.

## Origen y licencia — por confirmar antes de publicar

- Archivo: «Iconly Pro (Glass Icons) (Community)» en Figma, página «Iconly Glass».
  https://www.figma.com/design/qXlkANBKUfPDJC7WZuna5M/Iconly-Pro--Glass-Icons--Community-?node-id=1-1046
- Exportados el 2026-09-14.
- **Iconly Pro es un producto de pago.** Antes de publicarlos en la librería hay que confirmar que la
  versión de la comunidad permite usarlos en un producto comercial como UBITS y si pide dar crédito
  al autor. Lo confirma diseño (Carlos Varela) con quien tenga la licencia.
