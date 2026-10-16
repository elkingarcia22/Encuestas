# Editor de video · escenas canvas — lo que tiene el front de AI Studio (test, 14-oct-2026)

Relevado en `lxp.test.sandteck.com/ai-studio/video-projects/137/editor` (flag
`localStorage['lms-creator-ai-video-project'] = 'true'`) y en su bundle
`microfronts/ai-studio-mf/323.ai-studio.429.js`. **Es referencia conceptual**: nada de su código se copia; se
reimplementa con `@ubits/flux-ui` y las piezas del playground.

## Panel «Propiedades de la escena» (canvas), de arriba abajo

1. Tipo de escena · Media («Generar canvas») · Duración (igual que el nuestro).
2. **Plantilla**: selector con buscador, agrupado, con miniatura esquemática de cada una. Aviso al pie:
   «Cambiar de plantilla conserva el contenido compatible y vuelve a generar las capas.»
3. **Color de acento**: color picker propio (no es de una librería). Ver abajo.
4. **Fondo**: Degradado · Claro · Oscuro · Color de acento.
5. **Capas (N)** «arrastra para reordenar»: una fila por capa con asa, icono del tipo, «Tipo · contenido» y un «⋯»
   con Traer al frente · Subir una · Bajar una · Enviar al fondo · Eliminar. La capa elegida va resaltada.
6. **Agregar capa**: fila de botones `+icono` con tooltip «Agregar X»: Texto · Imagen · Forma · Badge · Lista ·
   Dato clave · Cita. (Agenda existe como tipo pero no se agrega a mano.)
7. **Capa · {tipo}** (solo con una capa elegida): sus campos + X (%) · Y (%) · W (%) · H (%) · Rotación (slider, °).

### Campos por tipo de capa

| Tipo | Campos |
| --- | --- |
| Texto | Estilo (eyebrow · title · subtitle · body · statement) · Contenido · Color del texto |
| Imagen | Imagen (subir / cambiar) |
| Forma | Relleno (accent · white · dark · tint) · Color de la forma |
| Badge | Título · Subtítulo |
| Lista | Items (uno por línea) |
| Dato clave | Valor · Etiqueta |
| Cita | Cita · Autor |

Los colores tienen «restablecer» al valor que pone la plantilla.

### Estilos de texto (a 1920×1080)

eyebrow 24/600 con espaciado 2 · title 72/700 · subtitle 36/600 · statement 64/700 centrado · body 28/400.
**Ojo:** su eyebrow va en mayúsculas sostenidas → en el playground **no** (regla de Dave).

### Paleta de marca por defecto

primary `#1a6bff` · dark `#04101f` · light `#f8faff` · tint `#cadeff` · neutral `#2a303f` · muted `#6b7280`.
Fuentes: Inter / Open Sans / Roboto Mono.

### Color picker

Popover con: área de saturación/luz con su punto · barra de tono · barra de transparencia · gotero · formato (HEX…)
· campo del código. **Ni flux-ui ni ReUI lo traen** (ReUI usa `<input type="color">`, igual que nuestro
`CampoColorLibre`). Decidir con Dave antes de armarlo.

## Vista previa (canvas)

«Arrastra para mover · esquinas para escalar en proporción · lados para un solo eje · Supr para borrar».
La capa elegida lleva marco con 8 asas y su nombre («Forma») en una etiqueta. Lo que se cambia en el panel se ve al
instante. Dave prefiere **nuestro tamaño** de vista previa.

## Las 10 plantillas (mismos códigos y nombres que las nuestras)

Grupos: **Apertura y transición** (Portada, Divisor de sección) · **Contenido** (Texto e imagen, Una columna, Dos
columnas, Lista ordenada, Agenda / Índice) · **Énfasis** (Dato clave, Cita, Afirmación).

Cajas en % del lienzo (x, y, w, h):

- **intro** · fondo degradado — eyebrow(subtitle) 6,32,40,6 · title 6,40,40,18 · body 6,60,38,12 · forma blanca
  50,12,42,72 rot −11° · imagen 52,12,40,76 · badge(badgeTitle/badgeSubtitle) 60,70,32,14
- **split** · claro — imagen 6,14,42,72 · title 52,34,40,16 · body 52,52,40,16
- **keypoint** · claro — title 8,14,50,12 · stat 8,30,50,34 · statement(subtitle) 8,66,50,12 · desc(body)
  8,78,50,10 · imagen 62,14,32,72
- **quote** · oscuro — cita(body, autor) 8,14,84,50 · imagen 8,68,84,22
- **one_column** · claro — imagen 8,8,84,24 · title 8,36,84,12 · body 8,50,84,22 · highlight(subtitle, opcional)
  8,74,84,12
- **two_columns** · claro — title 8,12,84,12 · lead(body, opc.) 8,24,84,8 · col1Title 8,38,38,8 · col1Body
  8,48,38,34 · col2Title 54,38,38,8 · col2Body 54,48,38,34
- **steps** · claro — imagen 6,14,34,72 · title 46,16,48,12 · lista 46,32,48,52
- **agenda** · oscuro — title 8,12,70,12 · lead(body, opc.) 8,24,84,8 · agenda(items título+desc) 8,36,84,52
- **section** · oscuro — imagen 0,0,100,58 · forma oscura 0,54,100,46 · número(title) 8,60,12,14 ·
  subtitle(eyebrow) 22,62,40,6 · title 22,68,70,14 · body(opc.) 22,84,70,10
- **title_only** · oscuro — statement 12,30,76,28 · body(opc.) 12,62,76,12

Topes de caracteres por campo: ver el bundle (`maxChars` de cada hueco).

## Selector de plantilla: grupo, ayuda y palabras de búsqueda

| Código | Grupo | Ayuda | Busca por |
| --- | --- | --- | --- |
| intro | Apertura y transición | Abre el video con título e imagen | inicio intro cover apertura |
| section | Apertura y transición | Marca el cambio de capítulo | separador capitulo transicion |
| split | Contenido | Texto a un lado, imagen al otro | split foto media |
| one_column | Contenido | Bloque de texto centrado | texto parrafo simple |
| two_columns | Contenido | Compara dos ideas lado a lado | comparar antes despues |
| steps | Contenido | Pasos numerados | pasos numerada proceso |
| agenda | Contenido | Temario de lo que viene | temario contenido indice |
| keypoint | Énfasis | Una cifra grande con su etiqueta | numero metrica stat kpi |
| quote | Énfasis | Testimonio con autor | testimonio frase autor |
| title_only | Énfasis | Una frase que ocupa la pantalla | statement impacto frase |
