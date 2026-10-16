# HU: Crear video con IA (escenas editables)

## Contexto

Los clientes rechazan videos “cabeza parlante” de punta a punta. Necesitan un video con variedad de escenas (imagen, presentador, diapositivas) generado desde una idea, revisable y exportable, para subir la adopción de video en contenidos LMS sin bajar la calidad percibida.

## Historia de Usuario

**Como** creador de contenidos LMS,
**quiero** generar un video editable por escenas a partir de una idea, con contexto (internet y/o archivos), objetivo, audiencia, tono, sector, voz, estilo, avatar opcional, logo y música de fondo,
**para** montarlo como recurso de una página sin producir el video fuera de UBITS.

## Pantallas en el prototipo

Cada pantalla del flujo tiene su dirección en el playground UX (en local, `http://localhost:5173` + la dirección). Si se abre directo con el borrador vacío, carga el curso de ejemplo «Resolución efectiva de conflictos en equipos de trabajo» para seguir el flujo desde ahí.

| Pantalla | Dirección | Qué se ve |
|---|---|---|
| Recursos · página de video | [`/admin/aprendizaje/lms-creator/crear-contenido#recursos/page/p1`](http://localhost:5173/admin/aprendizaje/lms-creator/crear-contenido#recursos/page/p1) | Video generado con IA, con «Editar video» y «Reemplazar» |
| Agregar video (setup + borrador) | [`/admin/aprendizaje/lms-creator/agregar-video`](http://localhost:5173/admin/aprendizaje/lms-creator/agregar-video) | Idea, contexto, objetivo, duración, estilo, voz y configuración avanzada |
| Editor de escenas | [`/admin/aprendizaje/lms-creator/agregar-video/editor`](http://localhost:5173/admin/aprendizaje/lms-creator/agregar-video/editor) | Proyecto de ejemplo (sin sesión previa) |
| Revisar escenas (legado) | [`/admin/aprendizaje/lms-creator/agregar-video/revisar-escenas`](http://localhost:5173/admin/aprendizaje/lms-creator/agregar-video/revisar-escenas) | Redirige al setup |

## Alcance

**Incluye:**
- Modal Agregar video: pestañas Video con IA, Video Avatar IA, Enlace, Subir. Video con IA y Video Avatar IA conviven: la primera es el video editable por escenas; la segunda es un video sencillo de presentador (p. ej. una intro).
- Biblioteca de videos recientes (4) y vista Ver todos (≥40, carga de 20 en 20 al hacer scroll) con volver.
- Crear video con IA en una sola pantalla, toda **a pantalla completa de verdad** (no modal): el setup con el borrador de escenas y, después, el editor de escenas. Las dos reparten el ancho en columnas y por eso no caben en un modal (ver HU-LMS-001 · RN-04a).
- Setup compacto: siempre visibles Idea del video → Contexto (internet / archivos / ambos; PDF, TXT o MD si hay archivos) → Objetivo → Duración → Estilo visual (obligatorio; card + modal; default Corporativo) → Voz del video.
- Configuración avanzada desplegable, separada por una línea y cerrada por defecto: Audiencia / Tono → Sector (opcional) → Avatar del video (opcional y solo si el estilo es compatible) → Qué evitar (textarea opcional).
- Columna derecha del setup: empty state hasta Preparar escenas; luego borrador editable (guion, tipo y orden mediante drag and drop o acciones del menú). Si el setup cambia, un alert ofrece Regenerar borrador (gratis). Continuar cobra tokens.
- Editor: escenas, preview, subtítulos, logo de empresa (PNG ≤ 2 MB, ~70% opacidad), música de fondo opcional (loops bajo la locución, fade out en la última escena, volumen Alto / Estándar / Discreto / Mínimo), voz editable por escena en Voz en off / guion. Lipsync de Avatar: al entrar al editor va incluido en la cola de generación (30 s); si Ana cambia a Avatar, cambia el avatar o regenera el audio ya dentro, debe pulsar **Sincronizar avatar** (manual, 100 tokens). En el prototipo el preview de Avatar sigue como imagen fija; en producto, al terminar la sync el presentador queda parlante y alineado con la locución. Canvas: MEDIA con Generar/Regenerar desde una idea (tema corto + imagen del pack). En Recursos, un video ya renderizado ofrece **Editar video**.
- Exportación que monta el video en la página del contenido.

**Excluye:**
- Motor de generación de video de producción (render final real en cloud).
- Generación con IA del clip de una escena tipo video (solo carga/reemplazo manual en el primer alcance).
- Edición avanzada de audio profesional.
- Gestión de biblioteca persistente en servidor.
- Pantalla dedicada «Revisar escenas» (el borrador vive en el setup; la URL legacy redirige al setup).

- **RN-00:** Video con IA y Video Avatar IA conviven en Agregar video y no se fusionan. Ana elige Video Avatar IA cuando quiere un video corto de un presentador (por ejemplo una intro). Elige Video con IA cuando quiere un video con varias escenas a partir de una idea.
- **RN-01:** Para generar el borrador la idea debe tener texto no vacío. Contexto, Objetivo, Duración, Voz del video y Estilo visual son obligatorios. Campos opcionales del setup: Audiencia, Tono, Sector, Qué evitar y Avatar del video. Contexto viene preseleccionado en Información de internet; Objetivo, Audiencia, Tono, Duración y Sector traen valor por defecto. Voz del video viene preseleccionada en femenina colombiana. Estilo visual viene preseleccionado en Corporativo. Idea del video abre en Personalizada con el campo vacío.
- **RN-01d:** Bajo el label de Idea del video hay chips siempre visibles: Personalizada (preseleccionada) y ejemplos (Onboarding 30 días, Política de compliance, Capacitación de producto, Feedback difícil, Cambio organizacional). Elegir un ejemplo pega su texto en Idea; elegir Personalizada con un ejemplo exacto vacía el campo. Editar el texto de un ejemplo deja el chip en Personalizada. Los chips no disparan Preparar escenas.
- **RN-01b:** Contexto admite tres valores: Información de internet, Archivos adjuntos, o Archivos e información de internet. Si la opción incluye archivos, hace falta al menos 1 adjunto (PDF, TXT o MD; sin tope de cantidad) para generar.
- **RN-01c:** Objetivo, Audiencia y Tono son selectores con opciones comunes y «Otro». Objetivo siempre está visible en el formulario principal y es obligatorio. Audiencia y Tono viven dentro de Configuración avanzada, son opcionales y vienen preseleccionados (Toda la empresa y Cercano y conversacional). Si en Objetivo eligen Otro, aparece un textarea que debe llenarse para preparar las escenas. Sector es un selector opcional (marcado como opcional) con las mismas industrias del catálogo de avatares, en orden alfabético y preseleccionado en Staff & Oficina; va debajo de Tono y encima de Avatar del video. Qué evitar es un textarea opcional marcado como (opcional), va al final de Configuración avanzada y no bloquea Preparar escenas. No existe Mensajes clave.
- **RN-01e:** Estilo visual es obligatorio, siempre está visible y se elige con un card en el formulario que abre un modal con las opciones. No vive en una columna fija de estilos.
- **RN-01f:** Configuración avanzada está cerrada por defecto, se separa del formulario principal con una línea y agrupa Audiencia, Tono, Sector, Avatar del video (cuando aplica) y Qué evitar. Audiencia y Tono son opcionales con valor por defecto, por lo que el acordeón cerrado no bloquea Preparar escenas.
- **RN-01g:** Al prender Avatar del video se preselecciona el primer avatar de la industria del campo Sector que coincida con el sexo de la voz (inferido del nombre del archivo: `f` femenino, `m` masculino). Con Staff & Oficina y voz femenina se preselecciona Antonia; con voz masculina, Benjamin. El modal de avatares abre filtrado en esa industria. Sector no obliga: Ana puede cambiar de industria en el modal y elegir un avatar de otro sector; el campo Sector no se actualiza por esa elección. Cambiar Sector con el avatar ya prendido no cambia el avatar seleccionado.
- **RN-02:** El avatar del video se usa en las escenas con presentador, no implica que todo el video sea una cabeza hablando. En el setup el campo solo se muestra si el estilo visual es Corporativo o Fotografía Real; con cualquier otro estilo se oculta y, si estaba activo, se apaga.
- **RN-03:** Si hay avatar seleccionado, el sexo del avatar coincide con el de la voz; al cambiar la voz se ajusta al primer avatar del mismo sexo en la industria del avatar actual.
- **RN-04:** El borrador de escenas se muestra en la columna derecha del setup (no hay pantalla dedicada). El selector de tipo de escena del borrador no ofrece Video: ese tipo solo se elige en el editor. En el borrador, el tipo Avatar solo aparece si, al preparar o regenerar, el avatar del video estaba prendido (estilo Corporativo o Fotografía Real); sin avatar prendido el borrador no genera ni ofrece escenas Avatar. **En el editor**, el tipo Avatar completo siempre está disponible: si Ana lo elige y el proyecto no tenía avatar, se preselecciona el avatar por defecto que hace match con el género de la voz del setup (o de la escena). Aplica RN-12 y RN-12b: no puede **cambiar de escena** ni **Generar video** sin haber generado el audio y, si aplica, sin haber sincronizado el avatar con ese audio. **Añadir escena** sí permanece disponible (no se bloquea por falta de audio ni de sync).
- **RN-04-bis:** Cada escena del borrador es una tarjeta **sin miniatura**: el asidero para arrastrar y soltar, centrado en el alto de la tarjeta, y al lado el número, el tipo, el menú «⋯» y la voz en off. En el borrador se trabaja el guion; la imagen de cada escena llega en el editor (jefe de Dave, 14-oct).
- **RN-04c:** Cada card del borrador tiene un handle para arrastrar y reordenar. Durante el arrastre, el fantasma representa la card completa y la card de origen baja su opacidad. El nuevo orden y los tiempos se guardan inmediatamente. El menú conserva Mover arriba / Mover abajo como alternativa.
- **RN-04b:** Preparar escenas no consume tokens. Continuar consume `VIDEO_GEN_TOKEN_COST` (320). El descuento se anima en el badge de tokens del setup; un segundo después de terminar esa animación se navega al editor (el editor ya muestra el saldo cobrado, sin repetir la animación). Si el creador cambia el setup con un borrador ya listo, el borrador se marca desactualizado, Continuar queda deshabilitado y aparece un alert en la columna derecha con la acción Regenerar borrador (gratis). Ese alert permanece visible en la parte superior de la columna aunque el borrador tenga scroll. Regenerar solo está disponible desde ese alert, no en el footer.
- **RN-04d:** Crear video con IA siempre abre el setup con la columna derecha en estado vacío («Aquí verás el borrador de tus escenas»), aunque la página de contenido tenga borradores sin terminar. Un borrador anterior solo vuelve a abrirse desde Continuar edición en Tus videos recientes o desde un enlace con el identificador del borrador. Preparar escenas y Regenerar borrador siguen actualizando el mismo registro de Recursos IA mientras no se salga del setup; salir sin continuar al editor deja ese borrador disponible en Continuar edición.
- **RN-04d-bis:** El setup sale por **la X en círculo de la cabecera**, como las demás experiencias inmersivas, y no con un botón «Volver a añadir página» / «Salir de la creación»: si se llegó desde «Añadir página» vuelve a ese selector; si no, sale sin crear página (jefe de Dave, 14-oct).
- **RN-05:** En el modal de biblioteca, Ver todos muestra primero los 4 recientes y luego el resto; carga tandas de 20 al hacer scroll; el botón Volver regresa al modal Agregar video.
- **RN-06:** El logo es opcional, solo PNG hasta 2 MB; aparece en la esquina superior derecha de todas las escenas en preview y en el video final, con opacidad del 70%.
- **RN-06c:** En el editor de video, el botón **Ajustes** del header es secundario en variante **pill** (mismo patrón que el editor SCORM V2).
- **RN-07:** En escenas tipo Avatar no hay aviso de que el avatar se sincronizará al generar el video final: la sincronización con la locución no se difiere al exportar. Al **continuar al editor**, la cola de generación de escenas Avatar (30 s en el prototipo) incluye el lipsync con el audio. Si Ana **cambia el tipo a Avatar ya dentro del editor**, o cambia el avatar / regenera el audio de una escena Avatar, el lipsync **no** arranca solo: en el bloque AVATAR, debajo del card, aparece el botón IA **Sincronizar avatar** (100 tokens) y ella debe pulsarlo. Las escenas Canvas / diapositivas no usan avatar: usan imagen de escena. En el prototipo el preview de Avatar sigue mostrando una imagen fija. En producto, al terminar esa sincronización, el presentador ya aparece parlante y alineado con la locución.
- **RN-08:** Objetivo siempre está disponible en el formulario principal; Audiencia y Tono siempre están disponibles dentro de Configuración avanzada. Al preparar las escenas se envía el label de la opción elegida o, si es Otro, el texto del textarea (si hay).
- **RN-09:** Cards de biblioteca: estado “Borrador” (en edición) o “Video” (listo); Borrador continúa edición, Video monta el recurso listo.
- **RN-09c:** Cuando un Video con IA ya está renderizado en Recursos, debajo del reproductor aparece el botón **Editar video** (igual patrón que Editar SCORM). Al pulsarlo se reabre el editor con el borrador de ese video.
- **RN-09b:** En Recursos IA, un video generado con IA muestra en Estado **Borrador** mientras no esté Completado o Falló. La etapa va en Herramienta usada según la vía: **Video con IA · Escenas / Editor / Render** si nació en Video con IA; **Video Avatar IA** (y etapa si aplica) si nació en Video Avatar IA. Completado y Falló no llevan etapa en la herramienta.
- **RN-10:** En el editor, una escena tipo video sin clip de video real muestra el placeholder con el copy «Carga tu video» (incluye escenas nuevas y escenas que antes eran imagen/avatar/canvas al cambiar el tipo a video). El media se carga o reemplaza solo con archivo; no hay Generar/Regenerar IA ni modal de generación de clip de video. La generación IA de media sigue disponible solo en escenas tipo imagen. Una escena tipo video no puede dejarse sin un video cargado: al intentar ir a otra escena se muestra un aviso y no se avanza. Generar video permanece deshabilitado mientras exista al menos una escena video sin archivo; el aviso explica que esas escenas no pueden dejarse sin un video cargado. Si Generar video encuentra una escena video vacía, se selecciona esa escena y no se exporta.
- **RN-10c:** En escenas tipo video suenan por defecto la voz y el video juntos. Desde el 14-oct cada uno se silencia por su lado en **Propiedades de la escena › Sonido** (RN-editor-04); ya no hay selector «Audio de la escena». El video final (Generar video) usa el mismo clip, la misma duración de la escena en el editor y la misma mezcla que el preview: no se exporta como imagen estática, no se pisa la duración con la del archivo y no suena lo que Ana silenció.
- **RN-11:** Generar o regenerar locución de una escena no consume tokens. **Sincronizar avatar** consume `AVATAR_SYNC_TOKEN_COST` (100) y se cobra al pulsar el botón en el bloque AVATAR. Al terminar Generar/Regenerar audio o **Sincronizar avatar** **no** se muestra toast de éxito: el feedback es el loader del preview / thumb y el desbloqueo de las acciones. Los toasts del editor se reservan para avisos (p. ej. no dejar Avatar sin audio/sync, clip de video faltante, escena aún generando).
- **RN-12:** Una escena tipo Avatar no puede dejarse sin audio generado: al intentar ir a otra escena o pulsar Generar video se muestra un aviso y no se avanza. **Añadir escena** sí permanece disponible (también mientras otras escenas se generan o se sincroniza un avatar). Si Generar video encuentra una escena Avatar sin locución, se selecciona esa escena y no se exporta. Si no hay bloqueos, Generar video abre primero un modal de confirmación que informa que la acción es gratis (no consume tokens); solo al confirmar se inicia la generación. El botón **Generar video** del header (y el de confirmar) es un botón IA primario **sin tokens**: el render no tiene costo.
- **RN-12b:** Una escena tipo Avatar con audio generado tampoco puede dejarse sin sincronizar el avatar con ese audio al cambiar de escena o Generar video. Si Ana cambió el tipo a Avatar en el editor, cambió de avatar o regeneró el audio, en el bloque AVATAR (debajo del card) el botón IA **Sincronizar avatar** se habilita con costo de 100 tokens; **no** es automático y **no** vive en el input del guion ni en MEDIA. Al sincronizar, el preview y el thumb de la card de escena muestran IA Loader (como al generar) durante **10 segundos** en el prototipo y el play queda en estado de carga (como al regenerar audio); al terminar **no** hay toast de éxito (RN-11). **Añadir escena** no se bloquea por falta de sync ni mientras corre la sincronización. Regenerar el guion o la voz invalida la sync y vuelve a exigir **Sincronizar avatar** después del nuevo audio.
- **RN-12c:** **Generar video** tampoco deja pasar una escena **Imagen sin imagen** ni una escena **sin tipo**: muestra el aviso («Las escenas tipo imagen no pueden dejarse sin una imagen cargada.» o «Todas las escenas necesitan un tipo: elige si es imagen, video, avatar o canvas.»), selecciona esa escena y no exporta. A diferencia de RN-10 y RN-12, estas dos no impiden cambiar de escena: solo bloquean el render. En una escena Imagen sin imagen, el botón de Media dice **Cargar** (no «Reemplazar») (Dave, 14-oct).
- **RN-13:** En el bloque Voz en off / guion de esta escena, la voz es editable por escena desde el modal «Voz de esta escena». Elegir una card solo deja esa voz como selección pendiente: no cambia la voz efectiva ni el audio existente. El footer del modal muestra Generar audio o Regenerar audio (botón IA primario, sin tokens) en vez de Listo. En el textarea el mismo CTA es un botón IA **secundario** (sin tokens), siempre visible: Regenerar audio si ya hay locución, Generar audio si no. Permanece deshabilitado hasta que hay un guion y, si ya había locución, hasta que el texto difiere de la última locución generada. Al pulsarlo (en el textarea o en el modal), el modal se cierra si estaba abierto, el control de preview muestra estado de generación y permanece deshabilitado durante 3 segundos; solo cuando termina, la escena adopta la voz seleccionada, la nueva locución y su duración ajustada. Si el cambio es a otro sexo y la escena es tipo Avatar, el avatar pasa al predeterminado de ese sexo al terminar la regeneración. El lipsync de Avatar no se dispara desde este input: vive en el bloque AVATAR como **Sincronizar avatar** (RN-12b).
- **RN-13b:** La locución que se escucha en el preview y en el video final corresponde a la voz elegida: la del setup para todo el proyecto y la de cada escena cuando tiene voz propia. Nunca suena una voz distinta a la seleccionada.
- **RN-14:** Al cambiar el tipo de escena, la imagen generada de la escena se preserva. Volver a Imagen restaura esa imagen (nunca el thumb del avatar). Al pasar a Canvas se usa esa imagen (o el pack del estilo visual); Canvas / diapositivas no insertan la foto del avatar. El tipo elegido se conserva aunque otras escenas sigan generando: terminar un job no restaura el tipo original.
- **RN-14b:** En el inspector, el apartado Media no aparece en escenas tipo Avatar (Avatar se edita en el bloque AVATAR). Media sí aparece en Imagen, Video y Canvas. En Canvas: thumb de la diapositiva + botón IA **Generar** / **Regenerar** que abre un modal para describir la idea; al confirmar, la plantilla del tipo de canvas se rellena con copy de ejemplo (título-tema corto derivado de la idea; **no** se pega el texto largo del input) y una **imagen al azar del pack de escenas del estilo visual** del video (mock de imagen IA). Una escena nueva pasada a Canvas arranca con el mismo placeholder visual que Imagen/Video. Canvas no muestra campo de avatar.
- **RN-14c:** Las plantillas Canvas / Diapositivas comparten layout y reglas de copy con SCORM (imagen a un lado donde aplica; texto corto). Ver [guia-copy-diapositivas.md](./guia-copy-diapositivas.md).
- **RN-14d:** Hay **diez** plantillas de canvas: Portada, Texto e imagen, Dato clave, Cita, Una columna, Dos columnas, Lista ordenada, Agenda / Índice, Divisor de sección y Afirmación. Siete llevan foto (todas menos Dos columnas, Agenda y Afirmación). Se eligen en tarjetas compactas, con la misma forma que las de «Tipo de escena».
- **RN-14e:** Las medidas de dentro de la diapositiva van en porcentaje de su ancho, no en píxeles: la misma diapositiva tiene que verse igual en la miniatura de la lista, en la vista previa, en el editor y en el video exportado.
- **RN-14f:** En cuatro plantillas —Dato clave, Cita, Una columna y Lista ordenada— el creador elige **de qué lado va la foto** (izquierda, derecha, arriba o abajo). La foto conserva la medida de su plantilla al cambiar de lado, y al cambiar de plantilla la posición se suelta: cada una arranca con el lado que trae. En las demás no se ofrece: Portada y Texto e imagen se componen arrastrando las capas, el Divisor de sección siempre lleva la foto al fondo y el resto no lleva foto.
- **RN-14g:** En Portada y Texto e imagen el creador **mueve las capas** (la foto, la placa, la credencial, el texto) arrastrándolas por un asa en la esquina; dónde queda cada una se guarda con la escena.
- **RN-14h:** En el inspector, el apartado Media pone la miniatura a la izquierda, con medida fija, y las acciones apiladas a su derecha. El «Audio de la escena» de las escenas tipo video va debajo y a lo ancho del panel, porque es un campo con su ayuda y no una acción de la miniatura.
- **RN-15:** El fondo con orbes IA del modal Agregar video solo aplica en las pestañas con IA (Video con IA y Video Avatar IA). En Enlace de video y Subir video el modal usa fondo plano, sin gradación IA.
- **RN-16:** Al continuar al editor, este muestra de inmediato el cascarón completo de todas las escenas definidas (lista, guion, tipo, duración y configuración). La multimedia y la locución de cada escena se generan juntas durante el mismo IA Loader: ambas quedan listas exactamente cuando termina el tiempo de generación de esa escena, usando la voz elegida en el setup. El loader aparece en el thumbnail de la lista y en el preview central cuando la escena está seleccionada; en tipos con Media (Imagen, Video y Canvas) también en el thumbnail de Media del inspector; en Avatar el avance se ve en la lista y el preview (no hay MEDIA). En los thumbnails ultrapequeños muestra únicamente el ícono centrado, sin textura de puntos ni texto. Hay un agente especializado por tipo: Imagen, Avatar y Canvas arrancan sus colas en paralelo, pero cada agente genera sus escenas una por una y en el orden definido. Cada Imagen —incluida su locución— tarda 3 segundos, cada Avatar 30 segundos y cada Canvas 10 segundos. El avance se conserva por escena: si el editor se vuelve a montar o se retoma el proyecto, solo continúan en la cola las escenas pendientes; las ya generadas conservan su multimedia y locución y no se repiten. La transición entre dos escenas queda disponible apenas ambas terminan de generar sus recursos, sin esperar a que finalicen las demás escenas. Mientras las escenas se generan, Generar video permanece deshabilitado; Salir del editor y **Añadir escena** siguen habilitados (no hay que esperar a que termine toda la cola para crear otra escena). Salir **no** crea una página en Recursos: el borrador queda en Recursos IA y en Tus videos recientes (Continuar edición) para retomarlo. La generación de escenas continúa en segundo plano y se retoma al volver al editor. Ana puede eliminar una escena ya lista o todavía en generación (si hay más de una): al confirmar, esa escena sale de la cola de inmediato y no hay que esperar a que termine todo el proyecto. No se puede eliminar la última escena. El render final del video (Generar video) sí bloquea eliminar y **sí** crea la página (con el loader de render mientras termina).
- **RN-16b:** Mientras el proyecto sigue generando multimedia, Ana puede previsualizar cualquier escena que ya esté lista sin esperar al resto. La vista previa arranca en la escena seleccionada y avanza mientras las escenas siguientes estén generadas; al llegar a la primera escena todavía en generación se detiene y se avisa que las siguientes siguen en proceso. Una escena que todavía se está generando no se puede reproducir.
- **RN-16c:** Pausar la vista previa corta de inmediato el audio del clip, la locución y la música (no se superponen al volver a reproducir). La bolita de la línea de tiempo se puede arrastrar (o usar flechas) para saltar a un punto de la escena: el visor, la locución, el audio del clip y la música de fondo saltan juntos. Al dar play de nuevo, continúa desde ese punto. Al pasar el cursor o al arrastrar, un tooltip muestra el tiempo de ese punto de la escena.
- **RN-17:** En pantallas de escritorio angostas (entre 801 px y 1100 px), el editor conserva simultáneamente las tres columnas: escenas, preview e inspector. Las columnas laterales reducen su ancho y el preview central absorbe la compresión; las acciones de Tipo de escena, Media, Personalización y Duración no desaparecen.
- **RN-18:** En pantallas móviles (hasta 800 px), el editor ofrece tres vistas mediante una navegación inferior fija: Escenas, Preview y Propiedades. Solo una vista ocupa el área disponible a la vez. Al elegir una escena desde Escenas, el editor abre automáticamente la vista Preview; Propiedades conserva todas las acciones del inspector. Preview y Propiedades muestran un header del mismo tamaño que el de Escenas, también en móvil. En Preview, el play y la línea de tiempo van en la misma fila; el selector de Animación queda debajo.
- **RN-19:** Si Ana escribió un título en «Añadir página», ese mismo texto se muestra en el editor de video y no lo reemplaza la sugerencia de la IA. Si dejó el campo vacío, el editor puede sugerir un título. Si borra el título en el editor y genera o monta la página, la página se llama `Video`.
- **RN-20:** En Subir video (Crear y Editar contenido) solo se admite un archivo MP4 de hasta 500 MB. WEBM, MOV y otros formatos se rechazan. El file uploader muestra `MP4 · Hasta 500 MB`.
- **RN-canvas-01:** En una escena **Canvas**, la **Plantilla** se elige en un campo con su miniatura y su ayuda que abre un buscador con las diez plantillas en tres grupos (Apertura y transición · Contenido · Énfasis); cada opción enseña **la propia escena** dibujada en esa plantilla. El **Color de acento** se elige con el selector de color del sistema (área de color, tono, gotero y código en HEX, RGB o HSL), que también usa la presentación interactiva. Tomado del editor de AI Studio en producción (jefe de Dave, 14-oct).
- **RN-canvas-02:** **El canvas se arma por capas.** Cada plantilla genera sus capas (texto, imagen, forma, badge, lista, dato clave, cita, agenda) con las medidas del editor de producción y el contenido de la escena; mientras nadie toque una capa, la escena se sigue dibujando desde su plantilla. El **Fondo** es Degradado, Claro, Oscuro o Color de acento; el oscuro y el degradado salen del propio acento, no de un azul fijo.
- **RN-canvas-03:** **Capas en Propiedades:** la lista (de la de adelante a la del fondo), que se reordena arrastrando o con su «⋯» (Traer al frente · Subir una · Bajar una · Enviar al fondo · Eliminar); los botones para agregar Texto, Imagen, Forma, Badge, Lista, Dato clave o Cita; y, con una capa elegida, sus campos (estilo y contenido del texto, relleno y color de la forma, título y subtítulo del badge, puntos de la lista, valor y etiqueta del dato, cita y autor, cambiar imagen) más X, Y, ancho, alto y rotación. Quitar una capa no pregunta: el aviso trae «Deshacer».
- **RN-canvas-04:** **En la vista previa:** clic para elegir una capa (con su marco, sus ocho asas y su nombre), arrastrar para moverla, esquinas para escalar en proporción, lados para un solo eje, flechas para moverla de a poco (Mayús para pasos largos), doble clic para escribir un texto en el sitio y Supr para borrarla. La vista previa y Propiedades comparten la capa elegida. El tamaño de la vista previa es el nuestro, no el de producción.
- **RN-canvas-05:** **Cambiar de plantilla** conserva el contenido compatible (los textos vuelven a su campo) y vuelve a generar las capas; lo agregado a mano o movido no viaja y el fondo vuelve al de la plantilla. Las miniaturas del selector muestran exactamente lo que va a quedar. El antetítulo **no** va en mayúsculas sostenidas, a diferencia de producción.
- **RN-editor-01:** En el editor, **Propiedades de la escena** (así se llama la columna) arranca con el **Tipo de escena en un selector con icono**, no en tarjetas. Los títulos de sección van un escalón por encima de las etiquetas de los campos. Los colores (acento, texto, forma) son un campo con la muestra en un cuadrado grande, el código y, dentro, el botón para volver al color por defecto cuando cambió. Las capas no tienen X, Y, ancho ni alto en números: se mueven y escalan en la vista previa; queda la rotación. La tarjeta del guion se llama **Locución de la escena**. La voz lleva la **bandera del país en un círculo** (las mismas imágenes del editor de producción), pequeña en el editor y grande en el setup. La **música de fondo** está disponible en Ajustes: Sin música o una de cinco pistas, con su muestra y cuatro volúmenes (jefe de Dave, 14-oct).
- **RN-editor-02:** Cuando el tipo de la escena pide una acción que falta, la vista previa lo dice con el **estado vacío oficial** (icono glass) en vez de enseñar una foto cualquiera, como en el editor de producción: «Sube un video para esta escena» (video sin cargar), «Sube una imagen para esta escena», «Genera la locución del avatar» (con «Generar locución») o «Sincroniza el avatar con la locución», y «Elige el tipo de escena» si no tiene tipo (jefe de Dave, 14-oct). Al entrar directo al editor, sin un video en curso, abre un proyecto de demostración Corporativo, que trae escenas canvas.
- **RN-editor-03:** **Añadir escena** es un solo botón secundario al pie de la lista de escenas (ya no hay un «+» en el encabezado que hiciera lo mismo). Abre un menú por tipo (Imagen, Video, Avatar completo, Canvas) y, en cada uno, dónde entra: **Al inicio**, **Arriba de la seleccionada**, **Debajo de la seleccionada** o **Al final**; la escena nueva nace de ese tipo y queda elegida. El menú «⋯» de cada escena lleva icono en todas sus opciones (Mover arriba, Mover abajo, Duplicar, Eliminar) (jefe de Dave, 14-oct).
- **RN-editor-04:** El menú de **Añadir escena** es anidado, como el de producción: primero el tipo y, en su submenú, dónde entra. En una escena canvas, **Media** solo trae el botón **Generar canvas** (o **Regenerar canvas** si ya tiene), sin miniatura; su ventana dice, con un texto fijo, que la idea rellena **la plantilla seleccionada** (sin el nombre de la plantilla: un texto genérico es más fácil para desarrollo). El sonido se controla en **Propiedades de la escena › Sonido**, cada cosa por su lado: **Silenciar la locución**, cuando la escena ya tiene voz generada (se conserva y no se vuelve a cobrar), y **Silenciar el audio del video**, en las escenas de video con clip cargado; ya no existe el selector «Audio de la escena». Al reproducir, la vista previa **se salta las escenas vacías** (video sin cargar, imagen sin subir, avatar sin sincronizar, sin tipo); si se le da reproducir a una vacía, arranca en la siguiente que se puede ver (jefe de Dave, 14-oct).

## Criterios de Aceptación

**Escenario: Video con IA y Video Avatar IA conviven**

**Dado** que Ana abre Agregar video en Recursos
**Entonces** ve las pestañas Video con IA y Video Avatar IA
**Cuando** quiere un video corto de un presentador (por ejemplo una intro)
**Entonces** elige Video Avatar IA
**Cuando** quiere un video con varias escenas a partir de una idea
**Entonces** elige Video con IA

**Escenario: Camino feliz — de idea a borrador en la misma pantalla**

**Dado** que Ana abre Agregar video en Recursos y elige Video con IA
**Y** escribe una idea no vacía o elige un chip de ejemplo, deja Contexto en Información de internet y Objetivo / Audiencia / Tono en sus valores por defecto, deja estilo Corporativo
**Cuando** pulsa Preparar escenas
**Entonces** el borrador de escenas aparece en la columna derecha con al menos 1 escena
**Y** el footer muestra Continuar
**Y** no navega a otra pantalla de revisión

**Escenario: Regenerar borrador sin costo**

**Dado** que Ana ya tiene un borrador en la columna derecha
**Cuando** cambia la idea o el estilo visual
**Entonces** el borrador se marca desactualizado
**Y** Continuar queda deshabilitado
**Y** ve un alert en la parte superior de la columna derecha con la acción Regenerar borrador
**Y** el alert permanece visible si el borrador estaba desplazado
**Y** el footer no muestra Regenerar borrador
**Cuando** pulsa Regenerar borrador en el alert
**Entonces** se actualiza el borrador sin descontar tokens
**Y** Continuar vuelve a habilitarse
**Y** el alert desaparece

**Escenario: Crear video con IA arranca sin borrador**

**Dado** que Ana preparó un borrador para una página y salió del setup sin continuar al editor
**Cuando** vuelve a Agregar video en esa misma página y elige Crear video con IA
**Entonces** la columna derecha muestra el estado vacío del borrador de escenas
**Y** el footer muestra Preparar escenas
**Y** el borrador anterior sigue disponible en Tus videos recientes como Continuar edición
**Cuando** pulsa Continuar edición en ese borrador
**Entonces** entra al editor con las escenas que ya tenía

**Escenario: Estado del video en Recursos IA**

**Dado** que Ana preparó un borrador de Video con IA y salió del setup sin continuar al editor
**Cuando** abre Recursos IA
**Entonces** el recurso muestra el tag Borrador
**Y** en Herramienta usada muestra Video con IA · Escenas
**Dado** que Ana continuó al editor
**Cuando** abre Recursos IA
**Entonces** el recurso muestra el tag Borrador
**Y** en Herramienta usada muestra Video con IA · Editor
**Dado** que Ana pulsó Generar video y el render sigue en curso
**Cuando** abre Recursos IA
**Entonces** el recurso muestra el tag Borrador
**Y** en Herramienta usada muestra Video con IA · Render

**Escenario: Contexto con archivos — adjunto obligatorio**

**Dado** que Ana está en el setup de Crear video con IA
**Y** escribió una idea no vacía
**Y** elige Archivos adjuntos o Archivos e información de internet
**Y** no ha cargado ningún archivo
**Cuando** consulta la acción Preparar escenas
**Entonces** el botón permanece deshabilitado
**Hasta** que adjunta al menos 1 archivo válido (PDF, TXT o MD)

**Escenario: Objetivo Otro — textarea obligatorio**

**Dado** que Ana está en el setup de Crear video con IA
**Y** en Objetivo elige Otro
**Y** el textarea está vacío
**Cuando** consulta la acción Preparar escenas
**Entonces** el botón permanece deshabilitado
**Hasta** que escribe el objetivo personalizado

**Escenario: Reordenar escenas del borrador**

**Dado** que Ana preparó un borrador con varias escenas
**Cuando** arrastra una escena desde su handle y la suelta en otra posición
**Entonces** ve como fantasma la card completa durante el arrastre
**Y** las escenas quedan numeradas y ordenadas según la nueva posición
**Y** el nuevo orden queda guardado para continuar al editor

**Escenario: Caso borde — Ver todos con scroll**

**Dado** que Ana está en el tab Video con IA del modal Agregar video
**Cuando** pulsa Ver todos y hace scroll hasta el final de la primera tanda
**Entonces** ve al menos 20 cards primero
**Y** tras el scroll se cargan hasta 20 adicionales sin cerrar el modal
**Y** la flecha Volver del header regresa al modal Agregar video con los 4 recientes

**Escenario: Generación multimedia sin bloquear el cascarón del editor**

**Dado** que Ana definió escenas de tipo Imagen, Avatar y Canvas en el borrador del setup
**Cuando** pulsa Continuar
**Entonces** el badge de tokens del setup muestra cómo se descuentan 320 tokens
**Y** un segundo después de terminar esa animación llega al editor y ve el cascarón completo de todas las escenas
**Y** cada escena en generación muestra IA Loader en su thumbnail de la lista y en el preview central cuando está seleccionada
**Y** en tipos con Media (Imagen y Video) también muestra el loader en el thumbnail de Media del inspector
**Y** en Avatar el loader se ve en la lista y el preview (sin apartado MEDIA)
**Y** en escenas tipo Canvas el inspector muestra MEDIA con Generar canvas
**Y** en los thumbnails ultrapequeños el loader muestra solo el ícono centrado, sin textura de puntos ni texto
**Y** los agentes de Imagen, Avatar y Canvas comienzan en paralelo
**Y** cada agente procesa sus propias escenas una por una y en el orden definido
**Y** cada Imagen tarda 3 segundos, cada Canvas 10 segundos y cada Avatar 30 segundos
**Y** la locución de cada escena se genera con la voz del setup durante ese mismo tiempo
**Y** cuando desaparece el IA Loader de una escena, su multimedia y su locución quedan listas al mismo tiempo
**Y** si el editor se vuelve a montar durante el proceso, conserva las escenas terminadas y retoma únicamente las pendientes
**Y** cuando dos escenas contiguas terminan, Ana puede abrir y editar su transición aunque otras escenas sigan generando
**Y** Generar video permanece deshabilitado hasta que terminen todas las escenas
**Y** puede pulsar Salir del editor para volver a Crear contenido
**Y** no nace una página en Recursos
**Y** el borrador queda en Recursos IA y en Tus videos recientes para Continuar edición

**Escenario: Eliminar una escena mientras se generan las demás**

**Dado** que Ana está en el editor y hay más de una escena
**Y** algunas ya terminaron y otras siguen generando
**Cuando** elige Eliminar en una escena (lista o todavía en generación) y confirma
**Entonces** esa escena desaparece de inmediato
**Y** no espera a que termine toda la generación del proyecto
**Y** las demás escenas siguen su cola
**Dado** que solo queda una escena
**Cuando** consulta Eliminar
**Entonces** no puede dejar el video sin escenas

**Escenario: Conservar el título de Añadir página en el editor**

**Dado** que Ana escribió un título en el modal «Añadir página» y eligió Video
**Cuando** continúa al editor de video
**Entonces** el título del editor es el que escribió en «Añadir página»
**Dado** que dejó el título vacío en «Añadir página»
**Cuando** continúa al editor
**Entonces** el editor puede mostrar un título sugerido
**Y** si lo borra y genera el video, la página en Recursos se llama Video

**Escenario: Previsualizar escenas listas mientras el resto se genera**

**Dado** que Ana está en el editor y algunas escenas ya terminaron de generarse y otras siguen en proceso
**Cuando** selecciona una escena ya generada y pulsa Vista previa desde esta escena
**Entonces** la vista previa se reproduce desde esa escena sin esperar a que termine todo el video
**Y** continúa con las escenas siguientes que ya estén generadas
**Y** se detiene al llegar a la primera escena que todavía se está generando
**Y** ve un aviso de que las escenas siguientes siguen en proceso
**Cuando** selecciona una escena que todavía se está generando
**Entonces** no puede reproducirla y ve un aviso de que debe esperar a que termine

**Escenario: Pausar no deja audio colgado**

**Dado** que Ana reproduce una escena tipo video con «Solo el audio del video»
**Cuando** pausa y vuelve a reproducir
**Entonces** no se oyen dos audios a la vez
**Y** el clip anterior queda en silencio

**Escenario: Saltar en la línea de tiempo de la escena**

**Dado** que Ana tiene una escena de varios minutos con un clip cargado
**Cuando** arrastra la bolita de la línea de tiempo al minuto 3
**Entonces** ve un tooltip con el tiempo de ese punto
**Y** el visor muestra ese punto del video
**Y** el audio (clip, locución o música) también queda en ese punto
**Cuando** pulsa Reproducir
**Entonces** la vista previa continúa desde ese punto

**Escenario: La locución suena con la voz seleccionada**

**Dado** que Ana eligió una voz en el setup del video
**Cuando** reproduce la vista previa o genera el video
**Entonces** la locución suena con esa voz
**Cuando** abre Voz de esta escena y selecciona otra voz
**Entonces** la voz efectiva y la locución existente no cambian todavía
**Cuando** pulsa Regenerar audio en el footer del modal
**Entonces** el modal se cierra y el control de preview muestra estado de generación, deshabilitado durante 3 segundos
**Y** al terminar esa escena queda con la nueva voz y suena con ella en la vista previa
**Y** la duración de la escena se ajusta a la nueva locución
**Y** las demás escenas conservan su voz

**Escenario: Editar el guion — regenerar locución desde el textarea**

**Dado** que Ana está en el editor en una escena con locución generada
**Entonces** ve Regenerar audio en el textarea (botón IA secundario, sin tokens) deshabilitado
**Cuando** edita el texto de Voz en off / guion de esta escena
**Entonces** Regenerar audio se habilita
**Cuando** pulsa Regenerar audio
**Entonces** el control de preview muestra estado de generación, deshabilitado durante 3 segundos
**Y** al terminar la locución coincide con el guion editado
**Y** la duración de la escena se ajusta a la nueva locución
**Cuando** el guion vuelve a coincidir con la locución
**Entonces** Regenerar audio permanece visible y vuelve a deshabilitarse

**Escenario: Escena video sin clip — solo carga manual**

**Dado** que Ana está en el editor con una escena tipo video sin archivo cargado
**Cuando** mira el preview central
**Entonces** ve el placeholder «Carga tu video»
**Y** en MEDIA solo puede Cargar o Reemplazar con un archivo de video
**Y** no ve Generar ni Regenerar con IA para ese clip

**Escenario: Caso borde — cambiar una escena con imagen a tipo video**

**Dado** que Ana está en el editor con una escena que ya tiene imagen
**Cuando** cambia el tipo de escena a video
**Entonces** el preview muestra el placeholder «Carga tu video»
**Y** no se usa la imagen anterior como clip de video
**Hasta** que carga un archivo de video
**Y** el audio de la escena queda en Voz y video juntos
**Y** puede cambiarlo a Solo la voz en off o Solo el audio del video

**Escenario: Camino feliz — duración de escena = duración del clip**

**Dado** que Ana está en el editor con una escena tipo video
**Cuando** carga o reemplaza un archivo de video
**Entonces** la duración de esa escena queda igual a la del archivo (hasta 10 min)
**Y** el total del video y el campo Duración del inspector se actualizan a ese valor

**Escenario: Caso borde — borrar el guion no recorta un clip cargado**

**Dado** que Ana cargó un video en una escena tipo video
**Y** esa escena todavía tenía texto de voz en off
**Cuando** borra o edita ese guion
**Entonces** la duración de la escena sigue siendo la del clip
**Y** no vuelve a la duración anterior de imagen o locución

**Escenario: Idea Personalizada por defecto**

**Dado** que Ana abre el setup de Crear video con IA
**Entonces** el chip Personalizada está activo
**Y** Idea del video está vacía
**Y** Preparar escenas permanece deshabilitado hasta que escribe o elige un ejemplo

**Escenario: Idea con ejemplo — chip pega texto**

**Dado** que Ana está en el setup de Crear video con IA
**Y** Personalizada está activa y Idea está vacía
**Cuando** elige el chip Onboarding 30 días
**Entonces** Idea se llena con el texto del ejemplo
**Y** los demás chips siguen visibles
**Y** puede elegir otro ejemplo para reemplazar el texto

**Escenario: Camino negativo — generar sin idea**

**Dado** que Ana está en el setup de Crear video con IA
**Y** el campo Idea del video está vacío
**Cuando** consulta la acción Preparar escenas
**Entonces** el botón Preparar escenas permanece deshabilitado
**Y** no se genera el borrador de escenas

**Escenario: Avatar sin locución — no cambiar de escena**

**Dado** que Ana está en el editor en una escena tipo Avatar sin locución generada
**Cuando** intenta seleccionar otra escena
**Entonces** permanece en la escena actual
**Y** ve un aviso de que las escenas tipo Avatar no pueden dejarse sin un audio generado
**Cuando** pulsa Añadir escena
**Entonces** se crea una escena nueva (Añadir escena no se bloquea por RN-12)

**Escenario: Avatar sin locución — no generar video**

**Dado** que Ana está en el editor
**Y** hay al menos una escena tipo Avatar sin locución generada
**Cuando** pulsa Generar video
**Entonces** no se exporta el video
**Y** no se abre el modal de confirmación
**Y** ve el mismo aviso de que las escenas tipo Avatar no pueden dejarse sin un audio generado
**Y** queda seleccionada la escena Avatar que falta por locución

**Escenario: Cambiar a Avatar en el editor — sincronizar con clic**

**Dado** que Ana está en el editor en una escena con audio ya generado
**Cuando** cambia el tipo de escena a Avatar
**Entonces** en el bloque AVATAR, debajo del card, ve el botón Sincronizar avatar con costo de 100 tokens
**Y** no ve el apartado MEDIA en esa escena
**Y** el input del guion sigue mostrando solo Generar o Regenerar audio
**Y** no se inicia la sincronización sola
**Cuando** intenta seleccionar otra escena sin haber sincronizado
**Entonces** permanece en la escena actual
**Y** ve un aviso de que las escenas tipo Avatar no pueden dejarse sin sincronizar el avatar
**Y** Añadir escena sigue disponible
**Cuando** pulsa Sincronizar avatar
**Entonces** el preview y el thumb de la card muestran IA Loader
**Y** el play queda en estado de carga
**Cuando** termina la sincronización
**Entonces** se descuentan 100 tokens
**Y** no aparece un toast de éxito
**Y** puede cambiar de escena y Generar video

**Escenario: Regenerar audio invalida la sync del avatar**

**Dado** que Ana está en el editor en una escena tipo Avatar ya sincronizada
**Cuando** regenera el audio (o cambia el guion y genera de nuevo)
**Entonces** vuelve a verse Sincronizar avatar habilitado con costo de 100 tokens
**Y** no puede cambiar de escena ni Generar video hasta sincronizar de nuevo
**Y** al terminar la regeneración de audio no aparece un toast de éxito

**Escenario: Avatar en el prototipo — imagen fija, sin aviso diferido**

**Dado** que Ana está en el editor en una escena tipo Avatar
**Cuando** termina de generar esa escena al entrar al editor, o termina Sincronizar avatar
**Entonces** el preview muestra una imagen del avatar
**Y** el inspector no muestra el aviso de que el avatar se sincronizará al generar el video
**Y** no aparece un toast de éxito por esa sincronización

**Escenario: Canvas sin campo avatar**

**Dado** que Ana está en el editor en una escena tipo Canvas
**Entonces** no ve el bloque AVATAR en el inspector
**Y** ve MEDIA con el thumb del canvas y el botón Generar
**Y** el canvas usa la imagen de la escena (no la foto del avatar)

**Escenario: Escena nueva a Canvas — placeholder hasta Generar**

**Dado** que Ana añade una escena o cambia una escena nueva a tipo Canvas
**Entonces** el preview y MEDIA muestran el mismo placeholder visual que Imagen/Video sin media
**Cuando** pulsa Generar en MEDIA, escribe una idea y confirma
**Entonces** la plantilla se rellena y aparece una imagen al azar del pack del estilo visual

**Escenario: Generar contenido de Canvas desde idea**

**Dado** que Ana está en el editor en una escena tipo Canvas
**Cuando** pulsa Generar en MEDIA
**Entonces** abre un modal para escribir la idea de la diapositiva
**Cuando** escribe una idea y confirma Generar canvas
**Entonces** la plantilla del tipo de canvas seleccionado se rellena con texto de ejemplo (tema corto; sin pegar el prompt completo)
**Y** el preview muestra el canvas actualizado con una imagen del pack del estilo visual del video
**Y** no se pega el texto largo del input como copy de la diapositiva

**Escenario: Video sin archivo — no cambiar de escena**

**Dado** que Ana está en el editor en una escena tipo video sin un video cargado
**Cuando** intenta seleccionar otra escena
**Entonces** permanece en la escena actual
**Y** ve un aviso de que las escenas tipo video no pueden dejarse sin un video cargado

**Escenario: Video sin archivo — no generar video**

**Dado** que Ana está en el editor
**Y** hay al menos una escena tipo video sin un video cargado
**Cuando** consulta la acción Generar video
**Entonces** el botón Generar video permanece deshabilitado
**Y** no se exporta el video
**Y** no se abre el modal de confirmación

**Escenario: Confirmar generación de video — gratis**

**Dado** que Ana está en el editor con todas las escenas listas
**Cuando** pulsa Generar video
**Entonces** ve un modal que pregunta si está segura de generar el video
**Y** el mensaje indica que la acción es gratis y no consume tokens
**Cuando** pulsa Cancelar
**Entonces** permanece en el editor sin generar
**Cuando** vuelve a pulsar Generar video y confirma
**Entonces** inicia la generación del video

**Escenario: Caso borde — ajustar la duración de una escena video**

**Dado** que Ana cargó un clip en una escena tipo video
**Y** el inspector muestra la duración del archivo
**Cuando** cambia el campo Duración a un valor distinto
**Entonces** el preview usa esa duración
**Cuando** genera el video
**Entonces** esa escena en el video final dura lo que indicó en el inspector
**Y** no vuelve a la duración original del archivo

**Escenario: Render de escena video — mismo clip, duración y mezcla que el preview**

**Dado** que Ana cambió una escena a tipo video, cargó un clip, eligió Solo el audio del video y tiene música de fondo
**Y** el preview se ve y se oye como espera
**Cuando** genera el video final
**Entonces** el video de la página muestra el clip (no un fotograma negro ni la imagen anterior)
**Y** dura lo mismo que esa escena en el editor (si no la ajustó, es la del clip, con tope de 10 minutos)
**Y** se oye el audio del clip, no la locución
**Y** se oye la música de fondo

**Escenario: Salir del editor sin Generar video no crea página**

**Dado** que Ana está en el editor de Video con IA
**Cuando** pulsa Salir o cierra el flujo sin confirmar Generar video
**Entonces** el listado de páginas de Recursos no aumenta
**Y** no aparece un loader de proyecto sin terminar en una página
**Y** el proyecto queda guardado en Recursos IA
**Y** en Agregar video, en Tus videos recientes, puede Continuar edición

**Escenario: Generar video en Editar contenido — nace la página**

**Dado** que Ana está en Editar contenido y añadió un video con IA
**Cuando** pulsa Generar video y confirma
**Entonces** vuelve a Recursos
**Y** aparece la página del video en generación (con el loader)
**Cuando** termina el render
**Entonces** esa página muestra el video listo
**Y** no hace falta esperar a volver a Crear contenido para verla

**Escenario: Editar video desde Recursos**

**Dado** que Ana ya tiene un Video con IA renderizado en una página de Recursos
**Cuando** ve el recurso debajo del reproductor
**Entonces** aparece el botón Editar video (mismo patrón que Editar SCORM)
**Cuando** pulsa Editar video
**Entonces** se reabre el editor con el borrador de ese video

**Escenario: Editor en escritorio angosto — conservar tres columnas**

**Dado** que Ana está en el editor de video
**Y** el ancho disponible está entre 801 px y 1100 px
**Cuando** usa el editor
**Entonces** ve simultáneamente la lista de escenas, el preview y el inspector
**Y** puede cambiar el tipo, media, personalización y duración de la escena
**Y** el preview central se adapta al espacio restante

**Escenario: Editor móvil — navegar sin perder acciones**

**Dado** que Ana abre el editor en una pantalla de hasta 800 px
**Entonces** ve una navegación inferior con Escenas, Preview y Propiedades
**Cuando** abre Escenas y elige una escena
**Entonces** pasa a Preview con esa escena seleccionada
**Y** el play y la línea de tiempo están en la misma fila
**Y** el selector de Animación queda debajo
**Cuando** abre Propiedades
**Entonces** puede cambiar el tipo, media, personalización y duración de la escena
**Y** ninguna de esas acciones desaparece por el tamaño de pantalla

**Escenario: Headers de Preview y Propiedades**

**Dado** que Ana abre el editor en escritorio o en móvil
**Entonces** Preview y Propiedades muestran un header del mismo tamaño que el de Escenas

**Escenario: Cambiar voz de la escena — regenerar y avatar**

**Dado** que Ana está en el editor en una escena tipo Avatar con locución generada
**Cuando** abre Voz de esta escena y elige una voz de otro sexo
**Entonces** la voz y el avatar existentes no cambian solo por seleccionar la card
**Cuando** pulsa Regenerar audio
**Entonces** el control de preview queda deshabilitado durante 3 segundos
**Y** al terminar la voz cambia y el avatar de esa escena pasa al predeterminado del nuevo sexo
**Y** Generar o Regenerar audio no muestra ni descuenta tokens
**Y** no aparece un toast de éxito
**Y** debe volver a pulsar Sincronizar avatar antes de cambiar de escena o Generar video

**Escenario: Cambiar tipo imagen → avatar → imagen**

**Dado** que Ana está en el editor en una escena tipo Imagen con una imagen generada
**Cuando** cambia el tipo a Avatar y luego vuelve a Imagen
**Entonces** vuelve a verse la imagen generada original
**Y** no permanece el thumb del avatar

**Escenario: Cambiar tipo mientras otras escenas se generan**

**Dado** que Ana está en el editor y todavía hay escenas generando multimedia
**Cuando** cambia el tipo de una escena ya visible
**Entonces** el tipo nuevo se mantiene
**Y** no vuelve al tipo original cuando termina la generación de otra escena

**Escenario: Tabs sin IA — sin fondo gradado**

**Dado** que Ana está en el modal Agregar video
**Cuando** cambia a Enlace de video o Subir video
**Entonces** el modal no muestra el fondo gradado de IA
**Y** si vuelve a Video con IA o Video Avatar IA, el fondo IA regresa

**Escenario: Subir video — solo MP4 hasta 500 MB**

**Dado** que Ana está en el modal Agregar video
**Cuando** elige Subir video
**Entonces** el file uploader indica MP4 y hasta 500 MB
**Y** un archivo que no sea MP4 o que supere 500 MB no se acepta

**Escenario: Avatar en setup — solo Corporativo o Fotografía Real**

**Dado** que Ana está en el setup de Crear video con IA
**Y** el estilo visual es Origami 3D (u otro distinto de Corporativo / Fotografía Real)
**Cuando** abre Configuración avanzada
**Entonces** el campo Avatar del video no se muestra en Configuración avanzada
**Y** el campo Sector sí se muestra
**Y** si tenía el avatar encendido y cambia a ese estilo, el avatar se apaga

**Escenario: Sector sugiere el avatar al prenderlo**

**Dado** que Ana está en el setup de Crear video con IA con estilo Corporativo
**Y** Sector está en Staff & Oficina
**Y** la voz del video es femenina
**Cuando** prende Avatar del video
**Entonces** se preselecciona Antonia
**Y** el modal de avatares abre filtrado en Staff & Oficina
**Dado** que apaga el avatar, cambia Sector a Agroindustria y vuelve a prenderlo
**Entonces** se preselecciona el primer avatar femenino de Agroindustria
**Y** puede cambiar la industria del modal y elegir un avatar de otro sector sin que el campo Sector cambie

**Escenario: Borrador — tipo Avatar solo si el avatar estaba prendido**

**Dado** que Ana preparó un borrador en el setup sin prender el avatar del video
**Cuando** abre el selector de tipo de escena
**Entonces** ve Imagen y Canvas
**Y** no ve Avatar
**Dado** que regenera el borrador con el avatar del video prendido
**Cuando** abre el selector de tipo de escena
**Entonces** sí ve Avatar en el selector

**Escenario: Cambiar a Canvas en estilo no corporativo**

**Dado** que Ana está en un video con estilo Origami (u otro distinto de Corporativo / Fotografía real)
**Y** una escena tipo Imagen con imagen generada
**Cuando** cambia el tipo a Canvas
**Entonces** el canvas usa la imagen generada de esa escena (o el pack del estilo)
**Y** no usa la foto del avatar

**Escenario: Música de fondo en Ajustes del video**

**Dado** que Ana está en el editor de Video con IA
**Entonces** la música de fondo viene en Groove continuo
**Cuando** abre Ajustes del video y cambia el loop
**Entonces** el video queda con esa música en loop bajo la locución
**Y** el volumen por defecto es Estándar
**Y** puede cambiarlo a Alto, Discreto o Mínimo
**Y** en la última escena la música baja hasta silencio
**Y** si elige Sin música, el video no lleva fondo musical
**Y** la vista previa y el video final usan la misma configuración
