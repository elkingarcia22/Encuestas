# Catálogo de canvas — Presentación interactiva

Inventario de **todos los tipos de diapositiva (canvas)** disponibles en Presentación interactiva / SCORM, con **payload de campos** y los **4 estilos de presentación** curados.

Detalle ampliado de las 10 plantillas de presentación: [atributos-tipos-diapositiva.md](./atributos-tipos-diapositiva.md).

---

## Resumen rápido

| Grupo | Cantidad | Uso |
|-------|----------|-----|
| A1. Estructura y navegación | 6 | Portada, divisores, agenda, cierre |
| A2. Contenido textual | 7 | Listas, columnas, cita, dato, número |
| A3. Contenido mixto | 3 | Texto+imagen, leyenda, comparativa |
| B1. Exploración visual | 3 | Hotspots, antes/después, mapa |
| B2. Organización del contenido | 4 | Acordeón, pestañas, tarjetas, timeline |
| B3. Evaluación y gamificación | 8 | Quiz, V/F, matching, retos |
| C. Lienzo libre | 1 | Composición flexible |
| **Total** | **32** | Catálogo completo |

`intro` (Portada) siempre está habilitada; no se apaga en ningún estilo.

---

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

## Los 4 estilos de presentación

Sustituyen la selección manual tipo por tipo por **4 combinaciones curadas**. Id de producto: `ScormStylePresetId`.

| Id | Label | Descripción | Recomendado |
|----|-------|-------------|-------------|
| `equilibrado` | Equilibrado | Texto, visual e interacción a partes iguales | Sí |
| `muy-visual` | Muy visual | Prioriza imágenes, diagramas y datos clave | |
| `interactivo` | Interactivo | Acordeones, pestañas y elementos para explorar | |
| `evaluativo` | Evaluativo | Refuerza con quiz, emparejamiento y retos | |

En todos los presets, **`intro` se incluye siempre**. Lo que sigue son los tipos adicionales de cada estilo.

### Equilibrado — `equilibrado`

`content` · `steps` · `split` · `one_column` · `two_columns` · `section` · `main_point` · `keypoint` · `accordion` · `quiz_mc` · `summary`

### Muy visual — `muy-visual`

`split` · `caption` · `media` · `slider` · `map` · `keypoint` · `big_number` · `quote` · `timeline` · `compare` · `summary`

### Interactivo — `interactivo`

`accordion` · `tabs` · `flashcards` · `media` · `slider` · `map` · `timeline` · `agenda` · `branching` · `summary`

### Evaluativo — `evaluativo`

`quiz_mc` · `quiz_tf` · `quiz_fill` · `match` · `sort` · `dragdrop` · `game` · `compare` · `keypoint` · `summary`

Si Ana activa/desactiva tipos a mano y el set ya no coincide con ningún preset, el estado queda **custom**.

### Decks curados — Onboarding comercial

Cuando el estilo coincide con un preset, Presentación interactiva usa el deck narrativo de **Onboarding comercial · 30 días** (no el pool Thomas-Kilmann).

| Preset | Slides | Módulo |
|--------|--------|--------|
| Equilibrado | 12 | Onboarding comercial |
| Muy visual | 12 | idem |
| Interactivo | 11 | idem |
| Evaluativo | 11 | idem |

Fuente de autoría: `Desktop/onboarding_comercial/build_presentaciones.py` → JSON/MD hermanos. Imágenes: pack `fotografia/escena-NN.png`.

---

## Payload por tipo

### A1. Estructura y navegación

#### Portada — `intro`

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

#### Divisor de sección — `section`

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
  "body": "Las dimensiones clave para abordar desacuerdos en el equipo.",
  "image": "/images/cards-learn/portadas-ia/01-personas-en-oficina.jpg",
  "imagePosition": "background"
}
```

#### Afirmación — `title_only`

Sin imagen.

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `title` | `string` | Frase principal |
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

#### Punto principal — `main_point`

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `title` | `string` | Idea clave |
| `subtitle` | `string` | Línea secundaria |
| `body` | `string` | Desarrollo |
| `image` | `string` | Foto |
| `imagePosition` | `string` | Default: `left` |

```json
{
  "type": "main_point",
  "icon": "fa-bullseye",
  "tagLabel": "Idea clave",
  "title": "El contexto define el modo útil",
  "subtitle": "Flexibilidad estratégica",
  "body": "Un líder adaptable utiliza los cinco modos según el valor de la relación y la urgencia del resultado.",
  "image": "/images/cards-learn/portadas-ia/01-personas-en-oficina.jpg",
  "imagePosition": "left"
}
```

#### Agenda / Índice — `agenda`

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
    }
  ]
}
```

#### Cierre / Resumen — `summary`

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `title` | `string` | Título del cierre |
| `bullets` | `string[]` | Takeaways |
| `image` | `string` | Foto |
| `imagePosition` | `string` | Default: `right` |

```json
{
  "type": "summary",
  "tagLabel": "Cierre",
  "title": "Lo que aprendiste",
  "image": "/images/cards-learn/portadas-ia/01-personas-en-oficina.jpg",
  "imagePosition": "right",
  "bullets": [
    "Cinco modos de respuesta al conflicto",
    "El contexto elige el modo útil",
    "Prepararse cambia el resultado"
  ]
}
```

---

### A2. Contenido textual

#### Lista de viñetas — `content`

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `title` | `string` | Título |
| `body` | `string` | Lead opcional |
| `bullets` | `string[]` | Viñetas |
| `image` | `string` | Foto |
| `imagePosition` | `string` | Default: `right` |

```json
{
  "type": "content",
  "icon": "fa-compass",
  "tagLabel": "Fundamentos",
  "title": "Cinco modos de respuesta",
  "body": "Asertividad × cooperación. El contexto define cuál conviene.",
  "image": "/images/cards-learn/portadas-ia/01-personas-en-oficina.jpg",
  "imagePosition": "right",
  "bullets": [
    "Competir — ganar ya, límites claros",
    "Colaborar — resultado y relación",
    "Comprometer — ceder un poco cada uno"
  ]
}
```

#### Lista ordenada — `steps`

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
    "Anticipa emociones del otro"
  ],
  "image": "/images/cards-learn/portadas-ia/01-personas-en-oficina.jpg",
  "imagePosition": "left"
}
```

#### Una columna — `one_column`

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
  "body": "Abordar una conversación difícil en las primeras 24 horas previene que las emociones se distorsionen.",
  "quoteHighlight": "Nombrar los hechos en frío reduce el 70% del desgaste posterior en los equipos.",
  "image": "/images/cards-learn/portadas-ia/01-personas-en-oficina.jpg",
  "imagePosition": "top"
}
```

#### Dos columnas — `two_columns`

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
  "col1Body": "Construye confianza duradera e integra perspectivas diversas.",
  "col2Title": "Baja Cooperación",
  "col2Body": "Genera silos de trabajo y desgaste en la retención del talento."
}
```

#### Cita — `quote`

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

#### Dato clave — `keypoint`

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

#### Número grande — `big_number`

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `title` | `string` | Título |
| `number` | `string` | Cifra grande (`85%`) |
| `label` | `string` | Complemento bajo el número |
| `body` | `string` | Texto explicativo (`statement` también sirve de fallback) |
| `source` | `string` | Fuente del indicador |

```json
{
  "type": "big_number",
  "icon": "fa-arrow-trend-up",
  "tagLabel": "Métrica global",
  "title": "Impacto en productividad",
  "number": "85%",
  "label": "de los colaboradores",
  "body": "enfrentan desacuerdos en su entorno laboral. La clave está en cómo se gestionan.",
  "source": "Estudio Global de Gestión de Talento"
}
```

---

### A3. Contenido mixto

#### Texto e imagen — `split`

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

#### Imagen + leyenda — `caption`

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `title` | `string` | Título sobre la foto |
| `caption` | `string` | Leyenda (`body` sirve de fallback) |
| `image` | `string` | Foto |
| `imagePosition` | `string` | Default: `bottom` |

```json
{
  "type": "caption",
  "icon": "fa-image-portrait",
  "tagLabel": "Observación",
  "title": "Dinámica de reunión en tensión",
  "caption": "Identificar el lenguaje no verbal defensivo permite intervenir antes de que se bloqueen los acuerdos.",
  "image": "/images/cards-learn/portadas-ia/01-personas-en-oficina.jpg",
  "imagePosition": "bottom"
}
```

#### Comparativa — `compare`

Sin imagen.

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `title` | `string` | Título |
| `leftTag` | `string` | Badge columna A |
| `rightTag` | `string` | Badge columna B |
| `leftTitle` | `string` | Título pilar A |
| `leftBody` | `string` | Texto pilar A |
| `rightTitle` | `string` | Título pilar B |
| `rightBody` | `string` | Texto pilar B |
| `rows` | `object[]` | Filas de la matriz comparativa |

Cada fila de `rows`:

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `left` | `string` | Celda izquierda |
| `right` | `string` | Celda derecha |

```json
{
  "type": "compare",
  "tagLabel": "Dos enfoques",
  "title": "Relacional vs transaccional",
  "leftTag": "Relacional",
  "rightTag": "Transaccional",
  "leftTitle": "Relacional",
  "leftBody": "Confianza y escucha antes de negociar.",
  "rightTitle": "Transaccional",
  "rightBody": "Acuerdos y entregables primero.",
  "rows": [
    { "left": "Alineación emocional primero", "right": "Plazos y alcance ya" },
    { "left": "Conflictos sensibles o largos", "right": "Urgencia o poca historia" }
  ]
}
```

---

### B1. Exploración visual

#### Imagen interactiva — `media`

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `title` | `string` | Título |
| `body` | `string` | Lead (`caption` también sirve de fallback) |
| `image` | `string` | Foto base |
| `hotspots` | `object[]` | Puntos sobre la imagen |

Cada hotspot:

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `x` | `number` | Posición horizontal % (5–95) |
| `y` | `number` | Posición vertical % (5–95) |
| `title` | `string` | Título del panel |
| `body` | `string` | Texto del panel |

```json
{
  "type": "media",
  "tagLabel": "Mapa del equipo",
  "title": "Mapa del equipo",
  "body": "Explora los puntos sobre la imagen.",
  "image": "/images/cards-learn/portadas-ia/01-personas-en-oficina.jpg",
  "hotspots": [
    {
      "x": 26,
      "y": 44,
      "title": "Hablar del tema",
      "body": "Hechos y necesidades, no etiquetas."
    }
  ]
}
```

#### Antes / Después — `slider`

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `title` | `string` | Título |
| `body` | `string` | Lead |
| `imageBefore` | `string` | Imagen «antes» |
| `imageAfter` | `string` | Imagen «después» |
| `labelBefore` | `string` | Badge antes |
| `labelAfter` | `string` | Badge después |

```json
{
  "type": "slider",
  "icon": "fa-sliders",
  "tagLabel": "Evolución",
  "title": "Antes y después de intervenir",
  "body": "Desliza el control central para comparar la dinámica del equipo:",
  "imageBefore": "/images/cards-learn/portadas-ia/01-personas-en-oficina.jpg",
  "imageAfter": "https://images.unsplash.com/...",
  "labelBefore": "Antes: Tensión y silos",
  "labelAfter": "Después: Colaboración abierta"
}
```

#### Mapa interactivo — `map`

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `title` | `string` | Título |
| `body` | `string` | Lead |
| `regions` | `object[]` | Zonas clicables |

Cada región:

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `id` | `string` | Id de la región |
| `title` | `string` | Nombre |
| `x` | `number` | Posición horizontal % |
| `y` | `number` | Posición vertical % |
| `body` | `string` | Texto al hacer clic |

```json
{
  "type": "map",
  "icon": "fa-map-location-dot",
  "tagLabel": "Distribución",
  "title": "Mapa de impacto organizacional",
  "body": "Haz clic en cada área para conocer cómo influye el estilo de gestión:",
  "regions": [
    {
      "id": "liderazgo",
      "title": "Liderazgo",
      "x": 25,
      "y": 30,
      "body": "Establece la pauta cultural y los estándares de transparencia."
    }
  ]
}
```

---

### B2. Organización del contenido

#### Acordeón — `accordion`

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `title` | `string` | Título |
| `items` | `object[]` | Paneles expandibles |

Cada ítem:

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `title` | `string` | Encabezado del panel |
| `body` | `string` | Contenido al expandir |

```json
{
  "type": "accordion",
  "tagLabel": "Profundiza",
  "title": "Profundiza por temas",
  "items": [
    {
      "title": "Preparación",
      "body": "Anticipa objeciones y define el resultado que necesitas."
    },
    {
      "title": "Durante la conversación",
      "body": "Escucha activa: valida emoción y hechos antes de proponer."
    }
  ]
}
```

#### Pestañas — `tabs`

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `title` | `string` | Título |
| `tabs` | `object[]` | Pestañas |

Cada pestaña:

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `label` | `string` | Texto de la pestaña |
| `body` | `string` | Contenido del panel |

```json
{
  "type": "tabs",
  "tagLabel": "Tres lecturas",
  "title": "Tres lecturas",
  "tabs": [
    {
      "label": "Conflicto útil",
      "body": "El desacuerdo suele señalar prioridades desalineadas o expectativas poco claras."
    },
    {
      "label": "TK en la rutina",
      "body": "Los cinco modos no son tipos de persona: son opciones situacionales."
    }
  ]
}
```

#### Tarjetas — `flashcards`

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `title` | `string` | Título |
| `cards` | `object[]` | Tarjetas frente/dorso |

Cada tarjeta:

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `front` | `string` | Cara frontal |
| `back` | `string` | Cara trasera |

```json
{
  "type": "flashcards",
  "tagLabel": "Repaso",
  "title": "Repaso rápido",
  "cards": [
    { "front": "Competidor", "back": "Prioriza ganar ya: útil con urgencia y límites claros." },
    { "front": "Colaborador", "back": "Busca integrar relación y resultado cuando ambos importan." }
  ]
}
```

#### Línea de tiempo — `timeline`

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `title` | `string` | Título |
| `image` | `string` | Foto opcional |
| `items` | `object[]` | Hitos |

Cada hito:

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `label` | `string` | Etiqueta temporal (`Día 0`) |
| `title` | `string` | Nombre del hito |
| `body` | `string` | Descripción |

```json
{
  "type": "timeline",
  "tagLabel": "Ruta sugerida",
  "title": "Flujo sugerido",
  "image": "/images/cards-learn/portadas-ia/01-personas-en-oficina.jpg",
  "items": [
    {
      "label": "Día 0",
      "title": "Detectar la señal",
      "body": "Identifica el modo por defecto del equipo y el costo de no hablar."
    },
    {
      "label": "Día 1–2",
      "title": "Preparar la conversación",
      "body": "Agenda clara, objetivo medible y definición de éxito."
    }
  ]
}
```

---

### B3. Evaluación y gamificación

#### Quiz — `quiz_mc`

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `title` | `string` | Título del quiz |
| `questions` | `object[]` | Preguntas |

Cada pregunta:

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `question` | `string` | Enunciado |
| `options` | `string[]` | Opciones |
| `correctIndex` | `number` | Índice 0-based de la correcta |

```json
{
  "type": "quiz_mc",
  "tagLabel": "Autoevaluación",
  "title": "Quiz de Opción Múltiple",
  "questions": [
    {
      "question": "¿Cuándo priorizar colaborar?",
      "options": ["Siempre", "Cuando importan relación y resultado", "Solo si el otro cede"],
      "correctIndex": 1
    }
  ]
}
```

#### Verdadero / Falso — `quiz_tf`

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `title` | `string` | Título |
| `statement` | `string` | Afirmación a juzgar |
| `isTrue` | `boolean` | Respuesta correcta |
| `explanation` | `string` | Feedback tras responder |

```json
{
  "type": "quiz_tf",
  "icon": "fa-circle-check",
  "tagLabel": "Chequeo rápido",
  "title": "¿Verdadero o Falso?",
  "statement": "El modo \"Colaborar\" siempre es la mejor alternativa independientemente del tiempo disponible.",
  "isTrue": false,
  "explanation": "Falso. Si la situación requiere una decisión urgente, colaborar puede consumir tiempo excesivo."
}
```

#### Rellenar espacios — `quiz_fill`

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `title` | `string` | Título |
| `textBefore` | `string` | Texto antes del blank |
| `blankValue` | `string` | Respuesta correcta |
| `textAfter` | `string` | Texto después del blank |
| `options` | `string[]` | Chips sugeridos (también admite `{ text }`) |
| `explanation` | `string` | Feedback |

```json
{
  "type": "quiz_fill",
  "icon": "fa-pen-to-square",
  "tagLabel": "Completar",
  "title": "Completa la afirmación",
  "textBefore": "El modo Thomas-Kilmann que prioriza la relación cediendo en el contenido se denomina",
  "blankValue": "Acomodar",
  "textAfter": "y resulta útil cuando el asunto tiene mucho más peso para la otra parte.",
  "options": ["Acomodar", "Competir", "Evadir", "Negociar"],
  "explanation": "Acomodar antepone el bienestar de la relación al resultado particular inmediato."
}
```

#### Emparejamiento — `match`

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `title` | `string` | Título |
| `left` | `string[]` | Conceptos (columna izquierda) |
| `right` | `string[]` | Parejas (columna derecha) |
| `pairs` | `[number, number][]` | Índices correctos `[leftIdx, rightIdx]` |

```json
{
  "type": "match",
  "tagLabel": "Modos TK",
  "title": "Relaciona cada modo",
  "left": ["Competidor", "Colaborador", "Compromiso"],
  "right": ["Ganar con urgencia", "Integrar ambas partes", "Ceder un poco cada uno"],
  "pairs": [[0, 0], [1, 1], [2, 2]]
}
```

#### Ordenar secuencia — `sort`

El orden correcto es el orden del array `items` en el JSON.

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `title` | `string` | Título |
| `body` | `string` | Lead |
| `items` | `object[]` | Pasos en orden correcto |

Cada ítem:

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `id` | `number` \| `string` | Id del paso |
| `text` | `string` | Texto del paso |

```json
{
  "type": "sort",
  "icon": "fa-arrow-down-1-9",
  "tagLabel": "Secuencia",
  "title": "Ordena los pasos de la conversación",
  "body": "Organiza cronológicamente los pasos recomendados:",
  "items": [
    { "id": 1, "text": "Definir el objetivo y recopilar hechos objetivos" },
    { "id": 2, "text": "Validar la perspectiva y emociones del interlocutor" },
    { "id": 3, "text": "Explorar opciones conjuntas de beneficio mutuo" },
    { "id": 4, "text": "Formalizar acuerdos y agendar fecha de revisión" }
  ]
}
```

#### Clasificar — `dragdrop`

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `title` | `string` | Título |
| `body` | `string` | Lead |
| `categories` | `object[]` | Zonas / buckets |
| `items` | `object[]` | Elementos a clasificar |

Cada categoría:

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `id` | `string` | Id de la zona |
| `label` | `string` | Nombre visible |

Cada ítem:

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `text` | `string` | Texto del elemento |
| `category` | `string` | Id de la categoría correcta |

```json
{
  "type": "dragdrop",
  "icon": "fa-layer-group",
  "tagLabel": "Clasificación",
  "title": "Clasifica las conductas",
  "body": "Ubica cada comportamiento en su categoría correspondiente:",
  "categories": [
    { "id": "constructivo", "label": "Constructivo" },
    { "id": "destructivo", "label": "Destructivo" }
  ],
  "items": [
    { "text": "Hablar de hechos y necesidades", "category": "constructivo" },
    { "text": "Generalizar con \"siempre\" o \"nunca\"", "category": "destructivo" }
  ]
}
```

#### Escenario ramificado — `branching`

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `title` | `string` | Título del dilema |
| `body` | `string` | Escenario |
| `choices` | `object[]` | Opciones de decisión |

Cada choice:

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `text` | `string` | Texto de la opción |
| `outcomeTitle` | `string` | Título del resultado |
| `outcomeBody` | `string` | Descripción del resultado |
| `isOptimal` | `boolean` | Si es la decisión óptima |

```json
{
  "type": "branching",
  "icon": "fa-code-branch",
  "tagLabel": "Toma de decisiones",
  "title": "Dilema: Entrega en riesgo",
  "body": "Tu equipo no llegará a la fecha acordada con el cliente. ¿Qué decisión tomas?",
  "choices": [
    {
      "text": "A. Negociar una prórroga transparente y acordar entregables parciales.",
      "outcomeTitle": "Resultado: Confianza y Realismo",
      "outcomeBody": "El cliente valora la honestidad temprana.",
      "isOptimal": true
    },
    {
      "text": "B. Exigir horas extras obligatorias sin consultar al equipo.",
      "outcomeTitle": "Resultado: Desgaste y Errores",
      "outcomeBody": "Se cumple la fecha formalmente pero con fallas de calidad.",
      "isOptimal": false
    }
  ]
}
```

#### Reto gamificado — `game`

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `title` | `string` | Título del reto |
| `body` | `string` | Instrucción / lead |
| `challenge` | `string` | Pregunta del reto (`body` sirve de fallback en UI) |
| `timeSeconds` | `number` | Tiempo límite |
| `scorePoints` | `number` | Puntos al acertar |
| `options` | `object[]` | Respuestas |

Cada opción:

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `text` | `string` | Texto de la opción |
| `correct` | `boolean` | Si es la correcta |

```json
{
  "type": "game",
  "icon": "fa-gamepad",
  "tagLabel": "Desafío interactivo",
  "title": "Reto de Gestión de Conflictos",
  "body": "Responde antes de que se agote el tiempo:",
  "timeSeconds": 30,
  "challenge": "¿Cuál es la primera acción recomendada ante una reunión donde la tensión escala?",
  "options": [
    { "text": "Nombrar la tensión y proponer una pausa corta de 5 minutos", "correct": true },
    { "text": "Elevar el tono para imponer autoridad", "correct": false },
    { "text": "Dar por cancelado el proyecto sin consultar", "correct": false }
  ],
  "scorePoints": 100
}
```

---

### C. Lienzo libre

#### Lienzo libre — `blank`

| Propiedad | Tipo | Qué es |
|-----------|------|--------|
| `title` | `string` | Título |
| `subtitle` | `string` | Subtítulo |
| `body` | `string` | Texto libre |
| `image` | `string` | Foto opcional |
| `imagePosition` | `string` | Default: `right` |

```json
{
  "type": "blank",
  "icon": "fa-shapes",
  "tagLabel": "Lienzo libre",
  "title": "Espacio personalizado",
  "subtitle": "Composición flexible",
  "body": "Este lienzo te permite integrar bloques de texto, citas destacadas y elementos visuales con libertad de diseño.",
  "image": "/images/cards-learn/portadas-ia/01-personas-en-oficina.jpg",
  "imagePosition": "right"
}
```

---

## Subconjunto «presentación» (10 plantillas)

Las plantillas que el Video con IA usa como tipo de escena **Canvas** (`slides`) y el filtro `?filtro=presentacion` de la galería:

| Orden | Id | Label |
|-------|-----|-------|
| 1 | `intro` | Portada |
| 2 | `split` | Texto e imagen |
| 3 | `keypoint` | Dato clave |
| 4 | `quote` | Cita |
| 5 | `one_column` | Una columna |
| 6 | `two_columns` | Dos columnas |
| 7 | `steps` | Lista ordenada |
| 8 | `agenda` | Agenda / Índice |
| 9 | `section` | Divisor de sección |
| 10 | `title_only` | Afirmación |

Tipos SCORM interactivos (quiz, acordeón, etc.) **no** entran en ese subconjunto; si llegan legacy, se normalizan a una de estas 10.

Con imagen en el renderer de canvas: `intro`, `split`, `keypoint`, `quote`, `one_column`, `steps`, `section`.  
Sin imagen: `two_columns`, `agenda`, `title_only`.

---

## Matriz: tipo × estilos

✓ = incluido en el preset (además de `intro`).

| Tipo | Equilibrado | Muy visual | Interactivo | Evaluativo |
|------|:-----------:|:----------:|:-----------:|:----------:|
| `content` | ✓ | | | |
| `steps` | ✓ | | | |
| `split` | ✓ | ✓ | | |
| `one_column` | ✓ | | | |
| `two_columns` | ✓ | | | |
| `section` | ✓ | | | |
| `main_point` | ✓ | | | |
| `keypoint` | ✓ | ✓ | | ✓ |
| `accordion` | ✓ | | ✓ | |
| `quiz_mc` | ✓ | | | ✓ |
| `summary` | ✓ | ✓ | ✓ | ✓ |
| `caption` | | ✓ | | |
| `media` | | ✓ | ✓ | |
| `slider` | | ✓ | ✓ | |
| `map` | | ✓ | ✓ | |
| `big_number` | | ✓ | | |
| `quote` | | ✓ | | |
| `timeline` | | ✓ | ✓ | |
| `compare` | | ✓ | | ✓ |
| `tabs` | | | ✓ | |
| `flashcards` | | | ✓ | |
| `agenda` | | | ✓ | |
| `branching` | | | ✓ | |
| `quiz_tf` | | | | ✓ |
| `quiz_fill` | | | | ✓ |
| `match` | | | | ✓ |
| `sort` | | | | ✓ |
| `dragdrop` | | | | ✓ |
| `game` | | | | ✓ |
| `title_only` | | | | |
| `blank` | | | | |

Tipos fuera de todos los presets (`title_only`, `blank`, y otros no listados) siguen existiendo en el catálogo y se pueden activar en estado custom.

---

## Relacionado

- [Atributos de tipos de diapositiva](./atributos-tipos-diapositiva.md) — detalle de las 10 plantillas de presentación
- [Guía de copy corto](./guia-copy-diapositivas.md)
- [HU — Presentación interactiva](./HU-presentacion-interactiva.md)
- [HU — SCORM con IA](./HU-scorm-con-ia.md)
