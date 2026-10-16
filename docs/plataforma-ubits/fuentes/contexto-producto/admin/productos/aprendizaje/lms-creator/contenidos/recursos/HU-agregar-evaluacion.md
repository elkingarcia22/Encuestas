# HU: Agregar evaluación final como recurso

## Contexto

Al armar Recursos de un contenido, el creador necesita una evaluación final con preguntas revisables. Por una limitación técnica temporal del stack, el alta oficial **no** abre la experiencia inmersiva: nace la página con el editor de preguntas **dentro** de Crear/Editar contenido, aunque aún no haya preguntas. La inmersiva se preserva fuera del flujo (legacy por URL) para revivirla en un Q siguiente.

## Historia de Usuario

**Como** creador de contenidos LMS,
**quiero** agregar una evaluación final como página de recurso (con preguntas generadas con IA o armadas a mano),
**para** montarla en el contenido sin bloquear el armado de Recursos.

## Pantallas en el prototipo

Cada pantalla del flujo tiene su dirección en el playground UX (en local, `http://localhost:5173` + la dirección). Si se abre directo con el borrador vacío, carga el curso de ejemplo «Resolución efectiva de conflictos en equipos de trabajo» para seguir el flujo desde ahí.

| Pantalla | Dirección | Qué se ve |
|---|---|---|
| Recursos · evaluación | [`/admin/aprendizaje/lms-creator/crear-contenido#recursos/page/p3`](http://localhost:5173/admin/aprendizaje/lms-creator/crear-contenido#recursos/page/p3) | Editor de la evaluación en la misma pantalla |
| Recursos · evaluación de 80 preguntas | [`/admin/aprendizaje/lms-creator/crear-contenido#recursos/eval-80`](http://localhost:5173/admin/aprendizaje/lms-creator/crear-contenido#recursos/eval-80) | Paginador para evaluaciones largas |

## Secciones y subsecciones (8-oct-2026)

**Las preguntas se agrupan por tema.** Una evaluación o una encuesta larga no es una lista corrida: se parte en
secciones. **Un solo nivel: no hay subsecciones** (Dave, 9-oct).

Las de tres niveles son las del creador de encuestas de Desempeño y cultura, que es donde viven las encuestas de verdad
—clima, pulso— con sus dimensiones. Una evaluación o una encuesta **dentro de un contenido** es otra cosa: cinco, diez
o veinte preguntas sobre un tema. Anidarlas cargaba a quien crea con numeración 2.1.1, migas y dos formas distintas de
mover, a cambio de una estructura que casi nadie iba a usar. Quien necesite agrupar de verdad puede **partirlo en varias
páginas de evaluación**, que además le da un respiro a quien responde. Lo que ya estuviera anidado **se aplana al
abrirlo**: las preguntas de una subsección suben al final de su sección, en orden, y nadie pierde nada.

A cambio, **la sección gana peso**: su descripción se lee en la portada de la parte, así que puede explicar de qué va
el bloque en vez de ser un rótulo.
La estructura y el comportamiento son los del **creador de encuestas de Desempeño y cultura** (Elkin) —comparados
contra su pantalla, no solo contra su código—, para que el equipo no aprenda dos formas de armar lo mismo.

- **Nada obliga a usarlas.** Una página recién creada es la lista de siempre, sin marco ni título ni plegado. Las
  secciones aparecen el día que se pulsa **«Añadir sección de preguntas»** —se llama así, y no «Añadir sección» a
  secas, porque el índice de la izquierda ya tiene las suyas, las del contenido, y dos botones con el mismo nombre en
  la misma pantalla hacen pulsar el que no era—.
- **La primera sección parte en dos lo que había**: lo ya escrito pasa a ser «Sección 1» y la nueva entra detrás.
  Nunca quedan preguntas dentro y fuera de secciones a la vez.
- **Una pregunta que no se está editando es una fila**: su número, el enunciado en una línea y el tipo. Tocarla la
  abre **en su sitio** con el formulario completo de siempre —el primer campo sigue siendo el tipo de pregunta— y
  cerrarla la devuelve a fila. Las acciones (mover, editar, eliminar) salen al pasar el cursor.
- **El número de la fila dice dónde está**: dentro de secciones es jerárquico —1.2 en la sección 1, 2.1.3 en la
  subsección 2.1—; sin secciones, el de siempre. Para **quien responde** la numeración es continua en toda la página.
- **Una sección tiene título y descripción**, como en el creador de encuestas de Desempeño y cultura: el lápiz abre
  los dos campos, uno debajo del otro. La descripción dice de qué va la parte o qué se espera en ella, y **la lee
  quien responde**, debajo del título de la parte y encima del conteo de preguntas. Fuera de edición va en gris, con
  el conteo detrás y separados por un punto medio; **a dos líneas, no a una**, porque con una sola una descripción
  larga se comía el renglón y el conteo desaparecía (Dave, 9-oct).
- **Una pregunta se escribe en foco, y no nace a medias.** Al crear o editar una, se abre **en su mismo sitio** y
  **todo lo demás del paso queda apagado**: no se puede tocar otra cosa hasta terminar. Al pie van **«Cancelar»** y
  **«Agregar»** —«Guardar» si la pregunta ya existía—. «Agregar» **valida**: si falta algo, el formulario **no se
  cierra**, marca en rojo lo que falta, lleva el cursor al enunciado y lo dice en una frase **dentro del propio
  formulario**. Sin aviso flotante arriba: decía lo mismo que el formulario y encima lejos del problema (Dave, 9-oct).
- **Un solo aviso, que cambia de cara.** Mientras se escribe, un aviso **azul** dice qué hay que hacer, y es
  **generalista a propósito**: «Completa todos los campos y marca la respuesta correcta» —«las respuestas correctas»
  cuando admite varias—. **En una encuesta no hay respuesta correcta**, así que ahí solo dice «Completa todos los
  campos». La excepción es la de completar la palabra, que explica **cómo se escribe** el marcador `{{2}}`, cosa que
  no se deduce. Al intentar guardar con algo incompleto, **ese mismo aviso se vuelve rojo** y ya sí dice, con
  nombres, qué quedó suelto. Un aviso de entrada que solo nombraba una parte —«escribe al menos dos opciones y marca
  la correcta»— llevaba a hacer justo eso, pulsar «Agregar» y descubrir que faltaba el enunciado. Sustituye a la
  línea de texto pequeño que había antes, que además solo aparecía cuando ya faltaba marcar la correcta (Dave, 9-oct). «Cancelar» descarta la nueva o devuelve la existente a como estaba
  al abrirla. Qué hace completa a una pregunta depende de su tipo: enunciado siempre; dos opciones escritas y una
  correcta en las de opción —en encuesta no hay correcta—; verdadero o falso elegido; la respuesta en la corta; dos
  parejas completas en el emparejamiento; el hueco `___` y su palabra en la de completar; las etiquetas de los
  extremos en la escala (Dave, 9-oct).
- **La anatomía es la del creador de encuestas, fila por fila** (comparado contra su pantalla, 9-oct). Una **sección
  es un contenedor**: cabecera con asa, número y título; una línea; sus preguntas; otra línea; y un **pie** que dice
  qué tiene —«Esta sección tiene 2 preguntas.»— con «Añadir pregunta» a la derecha. El título es un `Heading` de
  nivel 6 y la descripción, un texto de 14 px. Una sección vacía ofrece «Crear pregunta».
- **Editar, mover y eliminar salen al pasar el cursor**, en secciones, subsecciones y preguntas; **el asa y el
  chevron se ven siempre**. En pantalla táctil, donde no hay cursor, las acciones se quedan a la vista.
- **La pregunta abierta tiene cabecera**: el asa, el **icono de su tipo**, «Pregunta 1.1» y un menú de tres puntos con
  «Eliminar». El icono dice de un vistazo qué clase de pregunta es sin tener que leer el desplegable, y el menú deja
  borrarla sin cerrarla antes. Es más de lo que muestra el creador de encuestas —allá la pregunta abierta solo lleva su
  número— y es a propósito (Dave, 9-oct). La cabecera vive en **la fila**, no en el formulario: es la fila la que sabe
  dónde está la pregunta y cómo se reordena.
- **«Mover a…» además de arrastrar.** Arrastrar solo reordena **dentro** de una sección; para sacar una pregunta y
  llevarla a otra está ese menú, con la lista de secciones.
- **El título de la sección se lee; se edita con el lápiz.** Un campo de texto siempre abierto en cada sección llena la
  columna de cajas y hace parecer que todo está a medio escribir. Una sección recién creada sí entra con el título
  abierto: lo primero que se hace con ella es ponerle nombre.
- **Cada sección cierra con un solo «Añadir»** y su menú (pregunta o subsección), no con una fila de botones que
  compite con el contenido.
- **No hay pie de «Guardar y cancelar»**: aquí todo se guarda solo. Tampoco están «no sabe / no responde» ni
  «obligatorio», que el back de este flujo no soporta.
- **El orden se cambia arrastrando** por el asa de la fila, dentro de su sección.
- **La última sección no se puede borrar**: la página se quedaría sin dónde poner preguntas. Al borrar la única con
  título, la página vuelve a ser una lista suelta.
- **El paginador solo existe mientras es una lista suelta.** En cuanto hay secciones, lo que parte la lista son ellas.
- **Para quien responde**, cada sección abre con una **cabecera**, no con un título suelto: una caja con su propio
  fondo que lleva la insignia «Sección 2» / «Subsección 2.1», el título en grande y cuántas preguntas trae. Un título
  a secas entre preguntas se lee como una pregunta más y no dice «aquí empieza otra cosa» (Dave, 8-oct). Es lo mismo
  que muestra la cabecera de sección del creador de encuestas; lo que **no** se copia de allá es darle **una pantalla
  a cada sección**: aquí la evaluación es una sola página del contenido, y partirla metería una segunda navegación
  dentro de la que ya tiene el recorrido.
- Una sección que reparte todo en subsecciones **cuenta las preguntas de abajo**: a quien responde le importa cuánto
  le falta, no de qué nivel cuelga cada una. Y la **numeración es continua en toda la página**, no por sección —quien
  responde cuenta «voy por la 7 de 12»—. Una sección sin ninguna pregunta debajo en ese intento no se pinta.
- **Con secciones, el orden aleatorio se queda dentro de cada una.** Mezclarlas entre sí desharía la agrupación, que es
  justo lo que le da sentido.
- **Una sección que solo reparte subsecciones sí lleva su rótulo** para quien responde: si no, sus subsecciones
  aparecerían sueltas y se perdería de qué trata el bloque. Lo que no se pinta es la que no tiene ninguna pregunta
  debajo en ese intento.
- **En la demo**, la **Evaluación Sección 2** viene ya con secciones, para que la función se vea sin tener que armarla.
  El reparto sigue el orden en que ocurre un conflicto: «Detectar el conflicto a tiempo» (reconocer que existe y ver
  cuándo escala) y «Conducir la conversación», que se abre en dos subsecciones —«Elegir cómo responder» y «Escuchar y
  retroalimentar»— para enseñar también ese nivel. Las demás evaluaciones de la demo siguen siendo listas sueltas, que
  es el otro caso que hay que poder ver.

## Los tipos de pregunta (revisado contra producción, 7-oct-2026)

Revisado abriendo el **Creator real** (`lxp.ubitslearning.com`), creando una pregunta de cada tipo y mirando cómo
queda cada una **mientras se edita** y **cuando se deja de estar parado en ella**. Lo que sigue es lo que hay allá, y
es lo que el playground ya reproduce.

### Cuáles son, y dónde

La **evaluación ofrece ocho** —y ahí se quedan: no se enriquecen—; la **encuesta libre, esos ocho más cinco** que no
se podrían calificar. Dos ya estaban (escala numérica y escala de calificación) y tres llegaron el 8-oct desde el
creador de encuestas de Desempeño y cultura, con sus mismos nombres y sus mismos pasos para que una escala signifique
lo mismo en los dos sitios y sus respuestas se puedan comparar: **recomendabilidad (NPS)** de 0 a 10 con los extremos
escritos, **escala de emociones** (cinco caras, de peor a mejor, cada una con su color al elegirse) y **lista
desplegable**. Y el mismo tipo cambia de nombre según dónde esté.

**La escala de preferencias (Likert) se retiró el 9-oct.** Llegó en el mismo lote, pero una escala de cinco pasos
escritos es una herramienta de medición de clima, no de un contenido de aprendizaje: para preguntar por un contenido
ya están el NPS, las caras y las estrellas. Donde sí tiene sentido es en el creador de encuestas de Desempeño y
cultura, que es de donde vino y donde se queda (Dave, 9-oct).

| Tipo | Evaluación | Encuesta | Qué pide al crearla |
|---|---|---|---|
| Opción múltiple, múltiple respuesta | ✅ | ✅ | Enunciado · opciones con casilla para marcar las correctas · «Añadir opción» |
| Opción múltiple, única respuesta | ✅ | ✅ | Igual, pero la marca es un botón de radio |
| Verdadero / Falso | ✅ | ✅ | Enunciado · dos opciones fijas, se marca la correcta |
| Instrucción | ✅ | ✅ | Solo texto con formato. No se responde: es un cartel en medio |
| Pregunta corta → **Texto abierto** en encuesta | ✅ | ✅ | En evaluación: respuesta correcta + **exactitud** (exacta · ignorar acentos · cualquier respuesta). En encuesta solo el enunciado |
| Ensayo | ✅ | ✅ | Enunciado · **número mínimo de palabras** (opcional, de 1 a 100) |
| Emparejamiento | ✅ | ✅ | Enunciado · parejas «opción ↔ su par» · «Añadir pareja» |
| Palabra faltante | ✅ | ✅ | **Oración con marcadores `{{1}}`, `{{2}}`** · una opción por marcador |
| **Escala numérica** | ❌ | ✅ | Enunciado · **De** (1 a 9) y **Hasta** (2 a 10) · etiquetas de los extremos (opcionales) |
| **Escala de calificación** | ❌ | ✅ | Enunciado · **número de estrellas** (2 a 10) · etiquetas de los extremos (opcionales) |

Los extremos de una escala y el número de estrellas **se eligen de una lista, no se escriben**, y el tope es **10**:
así nadie arma una escala de 1 a 300.

**Las cuatro escalas se configuran en el mismo orden** (9-oct, igualado al creador de encuestas): primero lo que las
define —sus valores, cuántas estrellas—, después las **etiquetas de los extremos**, y al final la muestra **«Así lo
verá el estudiante»**. La muestra va la última porque es la consecuencia de lo de arriba: con el ejemplo encima, se
cambiaba una etiqueta y había que subir la vista para ver el efecto. Esa muestra **se puede tocar**: marcar un paso
enseña cómo queda, y lo que se marque ahí no se guarda en la pregunta.

**Un paso de escala es un botón, no un punto con su número debajo.** Todos del mismo ancho, repartiéndose la fila, así
la escala se lee como una regla; los extremos escritos van debajo en letra pequeña. Las caras llevan además **su
color**: del rojo del enfado al verde de la risa. Las estrellas **se reparten todo el ancho**, igual que el resto, para
que con diez no quede media escala pegada a la izquierda (Dave, 9-oct).

**El tipo elegido lleva su icono en el selector**, no solo dentro de la lista: si el icono se ve únicamente al abrir el
menú, no sirve para reconocer de un vistazo qué clase de pregunta es.

Las preguntas se añaden con un **botón flotante con un `+`** abajo a la derecha, y nacen como «Instrucción».

**Se reordenan arrastrando**, por el asa que lleva cada una a la izquierda de su icono, con la misma receta del índice
de páginas y del Creator de producción: la que viaja **se colapsa** y deja de ocupar sitio, y **un solo** recuadro
punteado marca dónde va a caer. «Mover arriba» y «Mover abajo» siguen en el menú de la pregunta: son la vía de teclado
y la que mueve de a un paso. En la encuesta de satisfacción no se arrastra nada, que no se edita.

### En una encuesta no hay respuesta correcta

Es la diferencia de fondo, no de pintura: una evaluación califica y una encuesta recoge opiniones. En el Creator real
(7-oct) eso se ve así, y es lo que el playground hace:

- En las de **opción múltiple** y en **Verdadero / Falso**, la marca de «correcta» está **apagada**: las casillas y los
  radios se ven —para entender la forma de la pregunta— pero no se pueden pulsar, y no hay ninguna marcada.
- **No aparece el aviso** «Debes tener al menos dos opciones y una marcada como correcta»: en una encuesta no falta nada
  por marcar.
- **«Texto abierto»** (la «Pregunta corta» de la evaluación) pide **solo el enunciado**: ni respuesta correcta ni nivel
  de exactitud.
- El mismo tipo **se llama distinto** según dónde esté, y así se lee en el selector: «Pregunta corta» en una evaluación,
  «Texto abierto» en una encuesta.
- Y en **lectura** tampoco se enseña ninguna opción como correcta.

### Los dos estados de una pregunta

Esto es lo que más se había quedado corto: **una pregunta en la que no estás parado no es solo su título**, también
enseña sus respuestas, con la correcta marcada. Así se lee la evaluación entera bajando por la lista, sin abrir una por
una. Importa más aquí que en el creador de encuestas de Elkin: allí cada quien escribe sus preguntas y las conoce; aquí
buena parte las genera la IA, y quien crea tiene que poder repasar qué preguntas y opciones hizo (jefe de Dave, 14-oct).

- **En edición** (una sola a la vez): el selector de tipo y los campos que pida ese tipo. Se abre al hacer clic en la
  pregunta y **se cierra al hacer clic fuera**, que es lo que hace producción: entonces vuelve a lectura y **ninguna**
  queda abierta. Al entrar a la página tampoco hay ninguna en edición: se ven todas montadas. No cuenta como «fuera»
  lo que vive en un portal —el menú de la pregunta, el desplegable de tipo, un diálogo—: está fuera de la tarjeta pero
  es parte de ella (Dave, 7-oct).
- **En lectura**: el enunciado y, debajo, **las respuestas en letra pequeña** — no como las verá el estudiante, para que
  veinte preguntas no ocupen media pantalla cada una: una línea por opción, sin radios ni casillas, y la correcta con un
  visto verde en círculo y en negrita (el visto suelto casi no se leía). Verdadero/Falso igual; la respuesta de la pregunta corta, las palabras de cada hueco, las
  parejas en una fila con su flecha (sin el hueco del visto, que ahí no aplica), el mínimo de palabras del ensayo y, en las escalas, de qué a qué van con sus
  extremos. En una encuesta no se marca ninguna como correcta (14-oct).
  El enunciado va **completo**, con su número en la misma primera línea. Arriba de él, el tipo de pregunta y, a su
  derecha, mover, editar y eliminar, que salen al pasar el cursor y mientras no se ven **no ocupan lugar** (como en el
  creador de encuestas de Elkin). Así el enunciado y las respuestas usan todo el ancho y nada se mueve al pasar el
  cursor. Cortar el enunciado con «…» se probó y se descartó: obligaba a pasar el cursor por cada pregunta para leerla
  (jefe de Dave, 14-oct).
- **Eliminar pregunta o sección pregunta antes**, con la ventana de siempre (la de eliminar página o sección del
  índice): «¿Eliminar la pregunta?» con el enunciado en la tarjeta, o «¿Eliminar la sección?», que avisa que se van
  también todas sus preguntas. Antes borraba directo y no se podía deshacer (jefe de Dave, 14-oct).
- **Incompleta**: al dejarla, se colapsa igual pero **en rojo**, y abajo avisa «Campos sin diligenciar».

### Cómo se ve al responder

Es la estructura de la vista previa del creador de encuestas (comparada contra su pantalla, 9-oct): **el marco gris es
el lienzo y cada pregunta es una caja blanca encima**. De arriba abajo:

1. **Los datos de la evaluación**, en lo gris: su nombre y, debajo, **sus condiciones en insignias** —cuántas
   preguntas trae, con cuánto se aprueba, qué intento va y el tiempo—. Esto **no cambia** al avanzar: son el
   recordatorio de arriba mientras se responde. Antes eran una línea de texto apagado, que se leía como letra
   pequeña justo donde está lo que más hay que tener claro antes de empezar (Dave, 13-oct).
   - Van en **`invert-light`**, la misma insignia que la de navegación del índice: sobre el gris, una de color
     pasaría por un estado o por algo que se pulsa.
   - **Dos sí cambian de color, porque avisan**: el **último intento** se pone en rojo —no es lo mismo fallar el
     primero que el último, y hay que saberlo antes de responder, no después— y el **último minuto** del reloj.
   - La insignia del tiempo **es la misma antes y durante**: antes de empezar dice cuánto va a durar («5 min») y, en
     cuanto arranca, ese mismo sitio lleva la cuenta regresiva.
   - En una encuesta, en lugar de las de calificación va «Tus respuestas son anónimas».
2. **Una línea**, que es lo que separa lo que no cambia de lo que sí.
3. **La portada de la parte**, en este orden: la insignia **azul** «Parte X de Y», el **título** de la sección, su
   **descripción** y cuántas preguntas trae, en letra pequeña con su icono. Una evaluación **sin secciones** no
   muestra este bloque: va directo a sus preguntas.
4. **Cada pregunta, en su caja blanca**, con el número en un círculo a la izquierda del enunciado. La numeración
   vuelve a empezar en cada parte: con una sola sección a la vista, «la 7 de 12» no dice nada.
5. **El texto de cada opción de respuesta, en peso normal**, no en el mismo peso del enunciado. Cuatro opciones
   seguidas todas en semitono oscuro se leen como un muro y le compiten al enunciado; en peso normal el enunciado
   manda y las opciones se leen de corrido (Dave, 9-oct).

El panel blanco se reserva para lo que es **una sola pieza**: la bienvenida, el resultado y el vacío. Antes todo vivía
dentro de ese mismo panel, así que las cajas de pregunta quedaban blancas sobre blanco y la pantalla se leía como un
documento corrido.

### Cómo se responde cada una

En la vista del colaborador cada tipo se responde a su manera, no todas con un cuadro de texto: opciones con radio o
casillas, **pregunta corta en una línea**, **ensayo en varias con el contador de palabras**, **emparejamiento eligiendo
el par de una lista** (los pares van ordenados, si no se resolvería solo), **palabra faltante con un campo dentro de la
oración, en el hueco que le toca**, y las escalas con sus números o sus estrellas.

**Cada tipo dice cómo se responde, debajo del enunciado.** Una línea pequeña con un icono de información: «Selecciona
una opción», «Selecciona una o varias opciones», «Completa los pares», «Escribe tu respuesta»… Son distintas de verdad
—no es lo mismo una de opción única que una de varias—, y sin ellas quien responde lo descubre probando. **Se van
cuando se cumplen**: en cuanto hay respuesta válida la línea desaparece, así que no estorban al releer lo contestado
(Dave, 8-oct).

**Quitar una opción se ve igual que en los objetivos del roleplay**: papelera en rojo suave al final de la fila, con su
aviso al pasar por encima explicando el mínimo que hay que dejar. Era lo mismo en dos sitios y se veía de dos formas.

### Ajustes

| Evaluación | Encuesta |
|---|---|
| Porcentaje para aprobar · preguntas en orden aleatorio · opciones en orden aleatorio · limitar intentos · tiempo límite · cuántas preguntas por intento | Preguntas en orden aleatorio · opciones en orden aleatorio |

**El orden aleatorio es para quien responde, no para el editor.** En el Creator las preguntas se quedan donde el creador
las dejó; lo que cambia es el orden en el que **las recibe el estudiante**: las preguntas entre sí y las opciones dentro
de cada una, para que dos personas sentadas juntas no vean lo mismo en el mismo sitio. Se baraja **una vez por intento**
—y de nuevo al reintentar—, y con esa misma lista se pinta y se califica: las respuestas se guardan por la posición de
la opción, así que barajar al pintar y calificar con el orden original pondría las notas mal. Cuando además se limita
cuántas preguntas se muestran por intento, **el recorte va después de barajar**; si no, saldrían siempre las mismas.

### Las dos encuestas

- **Encuesta libre**: la arma el creador entera, con los diez tipos.
- **Encuesta de satisfacción**: la escribió UBITS y **no se edita** —«Esta encuesta no se puede editar. Todas las
  preguntas son obligatorias»—. Son siempre las mismas dos: la de estrellas «¿Cómo calificarías el contenido que acabas
  de ver?» y la de factores «Si tu experiencia con este contenido no fue satisfactoria, ¿cuáles fueron los principales
  factores que la afectaron?» con sus ocho opciones. Son fijas justamente para poder comparar sus respuestas entre
  contenidos y empresas en los reportes.
- Ninguna de las dos se califica: al responderlas no hay nota ni porcentaje, y se le dice a quien responde que **sus
  respuestas son anónimas**.


## Alcance

**Incluye:**
- Entrada desde el modal fullscreen «Añadir página» (selección de Evaluación + «Crear página»).
- Alta oficial: página nueva en Recursos con editor de evaluación **inline** (puede iniciar con 0 preguntas).
- Editor de preguntas, modal de configuración y (en crear contenido) panel IA para generar preguntas.
- Deshacer la última generación de preguntas cuando aplica.
- Experiencia inmersiva **legacy** visitables por URL (fuera del flujo oficial); ver nota de switch.

**Excluye:**
- Usar la inmersiva como paso obligatorio del flujo oficial (apagada hasta el siguiente Q).
- Recursos PDF / Texto / Embebido / SCORM / Video (otros flujos; HU-LMS-001 / HU-LMS-003).
- Experiencia de estudio del colaborador al responder la evaluación (pantalla informativa si se publicó vacía: HU-APR-004).
- Consulta de notas, bloqueos y reportes en Resultados (HU-LMS-013).

## Reglas de Negocio

- **RN-01:** En el flujo oficial, «Crear página» con Evaluación **crea de inmediato** la página en el índice de Recursos y muestra el editor inline; **no** navega al layout inmersivo.
- **RN-02:** La página de evaluación **puede existir con 0 preguntas** (deuda técnica temporal aceptada). No se bloquea el alta por falta de preguntas.
- **RN-03:** Generar preguntas con IA consume créditos del pool del creador (80 créditos por corrida de generación) cuando el agente está disponible en la pantalla. Al pulsar Generar evaluación, el badge de tokens del header del panel anima el descuento; un segundo después de terminar esa animación se cierra el panel y arranca la generación de preguntas.
- **RN-04:** Tras generar con IA, se muestra el toast “Preguntas generadas. Revisa el editor y ajusta lo que necesites.”
- **RN-05:** Se puede deshacer la última generación y recuperar el conjunto de preguntas anterior cuando el UI de undo está activo.
- **RN-06:** El título de la página es el opcional capturado en «Añadir página» o, si venía vacío, el nombre del recurso (`Evaluación`).
- **RN-06a:** **Configuración** y **Agente IA** son de la evaluación entera, no de una pregunta, así que viven en la barra del recurso principal de la página —junto a «Reemplazar»—, no dentro del editor. Mientras la IA escribe las preguntas, el botón del agente se apaga.
- **RN-07 (legacy):** La experiencia inmersiva sigue disponible solo por URL documentada (no desde Añadir página). Ahí, «Confirmar evaluación» exige ≥1 pregunta; «Volver» reabre «Añadir página»; Cancelar/X abandona sin montar.

## Criterios de Aceptación

**Escenario: Camino feliz — Crear página con evaluación vacía**

**Dado** que Ana está en Crear o Editar contenido en el modal «Añadir página»
**Cuando** selecciona Evaluación y pulsa «Crear página»
**Entonces** se cierra el modal y nace una página de evaluación en Recursos
**Y** ve el editor de evaluación en la misma pantalla (sin ir a un layout inmersivo)
**Y** la evaluación puede mostrar 0 preguntas al inicio

**Escenario: Camino feliz — armar preguntas en la página**

**Dado** que Ana ya tiene una página de evaluación en Recursos
**Cuando** genera o edita preguntas en el editor inline
**Entonces** las preguntas quedan asociadas a esa página
**Y** puede seguir editando el resto del contenido sin confirmar un segundo paso inmersivo

**Escenario: Camino feliz — ver el gasto de tokens antes de cerrar el panel**

**Dado** que Ana está en el agente de evaluaciones listo para generar
**Cuando** pulsa Generar evaluación con saldo suficiente
**Entonces** el badge de tokens del header del panel anima el descuento de 80 créditos
**Y** un segundo después de terminar esa animación se cierra el panel
**Y** aparecen las preguntas en la página (tras la generación)

**Escenario: Caso borde — legacy inmersivo por URL**

**Dado** que Ana abre la URL legacy de Agregar evaluación (fuera del flujo oficial)
**Cuando** genera al menos 1 pregunta y confirma
**Entonces** vuelve a crear/editar con la evaluación pendiente de montar (comportamiento legacy preservado)

**Escenario: Camino negativo — no abrir inmersivo desde Añadir página**

**Dado** que Ana usa el modal oficial «Añadir página»
**Cuando** confirma Evaluación con «Crear página»
**Entonces** no se navega a la experiencia inmersiva
