# Atributos de tipos de diapositiva

Catálogo de propiedades del JSON de cada plantilla.

Tipos cubiertos: Portada, Texto e imagen, Dato clave, Cita, Una columna, Dos columnas, Lista ordenada, Agenda / Índice, Divisor de sección, Afirmación.

## Propiedades comunes

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `type` | `string` | Id interno del tipo (obligatorio) |
| `icon` | `string` | Clase Font Awesome |
| `tagLabel` | `string` | Etiqueta interna. Hoy el badge no se pinta en UI |
| `image` | `string` | URL o path de la foto (si el tipo lleva imagen) |
| `imagePosition` | `string` | `right` \| `left` \| `top` \| `bottom` \| `background` |
| `layout` | `object` | Posiciones de capas en el lienzo editable (opcional) |

---

## Portada — `intro`

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `title` | `string` | Título principal (H1) |
| `subtitle` | `string` | Eyebrow / línea superior |
| `body` | `string` | Lead / descripción |
| `badgeTitle` | `string` | Nombre en la placa |
| `badgeSubtitle` | `string` | Rol o idea en la placa |
| `image` | `string` | Foto de portada |
| `imagePosition` | `string` | Default: `right` |
| `layout` | `object` | Capas `copy`, `plate`, `photo`, `badge` |

```json
{
  "type": "intro",
  "icon": "fa-comments",
  "tagLabel": "Presentación",
  "title": "Conversaciones difíciles",
  "subtitle": "Modelo Thomas-Kilmann",
  "body": "Elige el modo de respuesta ante el conflicto",
  "badgeTitle": "Thomas-Kilmann",
  "badgeSubtitle": "Cinco modos de respuesta",
  "image": "https://images.unsplash.com/...",
  "imagePosition": "right"
}
```

---

## Texto e imagen — `split`

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `title` | `string` | Título de la tarjeta |
| `body` | `string` | Párrafo junto a la imagen |
| `image` | `string` | Foto |
| `imagePosition` | `string` | Default: `left` |

```json
{
  "type": "split",
  "icon": "fa-users",
  "tagLabel": "En contexto",
  "title": "Señales antes del choque",
  "body": "Correos fríos, silencio en reuniones, plazos que se resbalan. Nómbralo a tiempo.",
  "image": "https://images.unsplash.com/...",
  "imagePosition": "left"
}
```

---

## Dato clave — `keypoint`

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `stat` | `string` | Número grande (`85%`) |
| `title` | `string` | Título del dato |
| `statement` | `string` | Frase que explica el número |
| `desc` | `string` | Texto de apoyo |
| `image` | `string` | Foto |
| `imagePosition` | `string` | Default: `right` |

```json
{
  "type": "keypoint",
  "icon": "fa-chart-line",
  "tagLabel": "Dato clave",
  "title": "Por qué importa",
  "stat": "85%",
  "statement": "de los equipos agravó un conflicto al no hablar a tiempo",
  "desc": "Actuar pronto reduce desgaste y recupera ritmo.",
  "image": "/images/cards-learn/portadas-ia/01-personas-en-oficina.jpg",
  "imagePosition": "right"
}
```

---

## Cita — `quote`

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `body` | `string` | Texto de la cita (si falta, usa `title`) |
| `title` | `string` | Fallback de la cita |
| `author` | `string` | Autor (`— Nombre`) |
| `image` | `string` | Foto |
| `imagePosition` | `string` | Default: `bottom` |

```json
{
  "type": "quote",
  "tagLabel": "Reflexión",
  "title": "¿Por qué evitamos?",
  "body": "El silencio pospone el conflicto y lo agranda.",
  "author": "Hallazgo Thomas-Kilmann",
  "image": "/images/cards-learn/portadas-ia/01-personas-en-oficina.jpg",
  "imagePosition": "bottom"
}
```

---

## Una columna — `one_column`

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `title` | `string` | Título |
| `body` | `string` | Párrafo |
| `quoteHighlight` | `string` | Cita destacada (blockquote) |
| `image` | `string` | Foto |
| `imagePosition` | `string` | Default: `top` |

```json
{
  "type": "one_column",
  "icon": "fa-align-left",
  "tagLabel": "Profundización",
  "title": "La regla de las 24 horas",
  "body": "Abordar una conversación difícil en las primeras 24 horas previene que las emociones se distorsionen y que los desacuerdos escalen silenciosamente.",
  "quoteHighlight": "Nombrar los hechos en frío reduce el 70% del desgaste posterior en los equipos.",
  "image": "/images/cards-learn/portadas-ia/01-personas-en-oficina.jpg",
  "imagePosition": "top"
}
```

---

## Dos columnas — `two_columns`

Sin imagen.

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `title` | `string` | Título general |
| `body` | `string` | Lead opcional |
| `col1Title` | `string` | Título columna A |
| `col1Body` | `string` | Texto columna A |
| `col2Title` | `string` | Título columna B |
| `col2Body` | `string` | Texto columna B |

```json
{
  "type": "two_columns",
  "icon": "fa-table-columns",
  "tagLabel": "Comparativa de impacto",
  "title": "Efectos de la cooperación",
  "col1Title": "Alta Cooperación",
  "col1Body": "Construye confianza duradera, integra perspectivas diversas y fomenta soluciones innovadoras y sostenibles.",
  "col2Title": "Baja Cooperación",
  "col2Body": "Genera silos de trabajo, desmotivación silenciosa y desgaste innecesario en la retención del talento."
}
```

---

## Lista ordenada — `steps`

El número `01`, `02`… se calcula; no va en el JSON de cada paso.

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `title` | `string` | Título |
| `bullets` | `string[]` | Cada ítem es un paso |
| `image` | `string` | Foto |
| `imagePosition` | `string` | Default: `left` |

```json
{
  "type": "steps",
  "icon": "fa-clipboard-check",
  "tagLabel": "Preparación",
  "title": "Antes de conversar",
  "bullets": [
    "Define el resultado que necesitas",
    "Revisa tu modo natural",
    "Anticipa emociones del otro",
    "Elige momento y espacio"
  ],
  "image": "/images/cards-learn/portadas-ia/01-personas-en-oficina.jpg",
  "imagePosition": "left"
}
```

---

## Agenda / Índice — `agenda`

Sin imagen. Cada fila es clicable y salta a `targetSlide`.

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `title` | `string` | Título (`Agenda de la sesión`) |
| `body` | `string` | Lead |
| `items` | `object[]` | Bloques de la agenda |

Cada ítem de `items`:

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `num` | `string` | Número (`01`) |
| `title` | `string` | Nombre del bloque |
| `desc` | `string` | Descripción (`body` también sirve de fallback) |
| `targetSlide` | `number` | Índice de diapositiva al hacer clic |

```json
{
  "type": "agenda",
  "icon": "fa-list-check",
  "tagLabel": "Contenido",
  "title": "Agenda de la sesión",
  "body": "Explora los cuatro bloques temáticos del módulo:",
  "items": [
    {
      "num": "01",
      "title": "Diagnóstico inicial",
      "desc": "Identificar el estilo propio y del equipo",
      "targetSlide": 1
    },
    {
      "num": "02",
      "title": "Los 5 Modos TK",
      "desc": "Cuándo competir, colaborar o ceder",
      "targetSlide": 6
    }
  ]
}
```

---

## Divisor de sección — `section`

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `number` | `string` | Número de módulo (`01`) |
| `subtitle` | `string` | Tag de sección |
| `title` | `string` | Título del bloque |
| `body` | `string` | Texto de apoyo |
| `image` | `string` | Fondo |
| `imagePosition` | `string` | Default: `background` |

```json
{
  "type": "section",
  "icon": "fa-bookmark",
  "tagLabel": "Módulo 01",
  "number": "01",
  "title": "Fundamentos del Conflicto",
  "subtitle": "Entendiendo la cooperación y la asertividad",
  "body": "Las dimensiones clave para abordar desacuerdos en el equipo de forma constructiva.",
  "image": "/images/cards-learn/portadas-ia/01-personas-en-oficina.jpg",
  "imagePosition": "background"
}
```

---

## Afirmación — `title_only`

Sin imagen.

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `title` | `string` | Frase principal (afirmación) |
| `body` | `string` | Texto de apoyo |

```json
{
  "type": "title_only",
  "icon": "fa-heading",
  "tagLabel": "Principio central",
  "title": "El conflicto no es el problema: el silencio sí lo es.",
  "body": "Nombrar la tensión a tiempo transforma desacuerdos en acuerdos sólidos."
}
```

---

## Relacionado

- [Guía de copy corto](./guia-copy-diapositivas.md)
- [HU — Presentación interactiva](./HU-presentacion-interactiva.md)
- [HU — SCORM con IA](./HU-scorm-con-ia.md)
