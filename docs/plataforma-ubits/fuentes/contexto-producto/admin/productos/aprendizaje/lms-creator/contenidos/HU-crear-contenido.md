# HU: Crear contenido LMS (asistente de 4 pasos)

## Contexto

Los creadores de mi empresa tardan demasiado en armar un contenido nuevo con portada, páginas y ajustes de publicación. Un asistente guiado reduce abandonos de borrador y acelera el tiempo hasta la primera publicación, medible como % de borradores que llegan a Recursos en la misma sesión.

## Historia de Usuario

**Como** creador de contenidos LMS,
**quiero** crear un contenido nuevo en un asistente de Información general, Recursos, Certificado y Ajustes,
**para** publicar material formativo listo para asignar en planes sin saltarme pasos críticos.

## Pantallas en el prototipo

Cada pantalla del flujo tiene su dirección en el playground UX (en local, `http://localhost:5173` + la dirección). Si se abre directo con el borrador vacío, carga el curso de ejemplo «Resolución efectiva de conflictos en equipos de trabajo» para seguir el flujo desde ahí.

| Pantalla | Dirección | Qué se ve |
|---|---|---|
| Listado de contenidos | [`/admin/aprendizaje/lms-creator/contenidos`](http://localhost:5173/admin/aprendizaje/lms-creator/contenidos) | «Crear contenido» abre el asistente en blanco; al finalizar, la tarjeta nueva sale de primera |
| Paso Información general | [`/admin/aprendizaje/lms-creator/crear-contenido#portada`](http://localhost:5173/admin/aprendizaje/lms-creator/crear-contenido#portada) | Formulario vacío (no se siembra el ejemplo), en tres grupos: Título y descripción, Portada y Ficha técnica |
| Vista del colaborador | [`/admin/aprendizaje/lms-creator/vista-colaborador`](http://localhost:5173/admin/aprendizaje/lms-creator/vista-colaborador) | El contenido recorrido como lo recorrerá quien lo estudie |
| Paso Recursos | [`/admin/aprendizaje/lms-creator/crear-contenido#recursos`](http://localhost:5173/admin/aprendizaje/lms-creator/crear-contenido#recursos) | Dos columnas: Índice (2 secciones y 7 páginas de ejemplo) y Vista previa de la página activa |
| Recursos · página concreta | [`/admin/aprendizaje/lms-creator/crear-contenido#recursos/page/p5`](http://localhost:5173/admin/aprendizaje/lms-creator/crear-contenido#recursos/page/p5) | Abre directo esa página (p1 video, p2 presentación interactiva, p3 evaluación, p4 SCORM, p5 PDF, p6 evaluación) |
| Recursos · evaluación de 80 preguntas | [`/admin/aprendizaje/lms-creator/crear-contenido#recursos/eval-80`](http://localhost:5173/admin/aprendizaje/lms-creator/crear-contenido#recursos/eval-80) | Caso borde con paginador (25, 50 o 100 por página) |
| Agregar PDF | [`/admin/aprendizaje/lms-creator/agregar-recurso/pdf`](http://localhost:5173/admin/aprendizaje/lms-creator/agregar-recurso/pdf) | Modal del PDF sobre Recursos |
| Agregar texto | [`/admin/aprendizaje/lms-creator/agregar-recurso/texto`](http://localhost:5173/admin/aprendizaje/lms-creator/agregar-recurso/texto) | Modal del recurso Texto |
| Agregar embebido | [`/admin/aprendizaje/lms-creator/agregar-recurso/embebido`](http://localhost:5173/admin/aprendizaje/lms-creator/agregar-recurso/embebido) | Modal del recurso Embebido |
| Agregar SCORM | [`/admin/aprendizaje/lms-creator/agregar-recurso/scorm`](http://localhost:5173/admin/aprendizaje/lms-creator/agregar-recurso/scorm) | Modal de subida del paquete .zip |
| Agregar video (setup con IA) | [`/admin/aprendizaje/lms-creator/agregar-video`](http://localhost:5173/admin/aprendizaje/lms-creator/agregar-video) | Setup del video con IA y borrador de escenas |
| Editor de escenas | [`/admin/aprendizaje/lms-creator/agregar-video/editor`](http://localhost:5173/admin/aprendizaje/lms-creator/agregar-video/editor) | Proyecto de ejemplo listo para editar |
| Agregar presentación interactiva | [`/admin/aprendizaje/lms-creator/agregar-presentacion-interactiva`](http://localhost:5173/admin/aprendizaje/lms-creator/agregar-presentacion-interactiva) | Setup de la presentación |
| Agregar evaluador roleplay (MVP) | [`/admin/aprendizaje/lms-creator/agregar-roleplay-mvp`](http://localhost:5173/admin/aprendizaje/lms-creator/agregar-roleplay-mvp) | Configuración en cuatro pasos |
| Paso Certificado | [`/admin/aprendizaje/lms-creator/crear-contenido#certificado`](http://localhost:5173/admin/aprendizaje/lms-creator/crear-contenido#certificado) | Dos columnas del mismo ancho que Recursos: el formulario y la Vista previa del certificado con la plantilla de doble firma |
| Recursos · Agente de evaluaciones abierto | [`/admin/aprendizaje/lms-creator/crear-contenido?agente=abierto#recursos/page/p3`](http://localhost:5173/admin/aprendizaje/lms-creator/crear-contenido?agente=abierto#recursos/page/p3) | Paso 2 con el contenido de ejemplo, parado en la página de evaluación y con el agente ya abierto |
| Paso Ajustes | [`/admin/aprendizaje/lms-creator/crear-contenido#ajustes`](http://localhost:5173/admin/aprendizaje/lms-creator/crear-contenido#ajustes) | Tablero de Visibilidad, Pesos y Tipo de navegación |
| Ajustes · Visibilidad | [`/admin/aprendizaje/lms-creator/crear-contenido#ajustes-visibilidad`](http://localhost:5173/admin/aprendizaje/lms-creator/crear-contenido#ajustes-visibilidad) | Borrador, Público, Privado u Oculto |
| Ajustes · Seleccionar colaboradores | [`/admin/aprendizaje/lms-creator/crear-contenido#ajustes-colaboradores`](http://localhost:5173/admin/aprendizaje/lms-creator/crear-contenido#ajustes-colaboradores) | Contenido en Privado con la selección de colaboradores abierta |
| Ajustes · Pesos de evaluación | [`/admin/aprendizaje/lms-creator/crear-contenido#ajustes-pesos`](http://localhost:5173/admin/aprendizaje/lms-creator/crear-contenido#ajustes-pesos) | 50 % / 50 % entre las dos evaluaciones |
| Ajustes · Pesos sin evaluaciones | [`/admin/aprendizaje/lms-creator/crear-contenido#ajustes-pesos-empty`](http://localhost:5173/admin/aprendizaje/lms-creator/crear-contenido#ajustes-pesos-empty) | Estado vacío del panel de pesos |
| Ajustes · Tipo de navegación | [`/admin/aprendizaje/lms-creator/crear-contenido#ajustes-navegacion`](http://localhost:5173/admin/aprendizaje/lms-creator/crear-contenido#ajustes-navegacion) | Lineal (por defecto) o Libre |

## Alcance

**Incluye:**
- Asistente de 4 pasos fijos: Información general → Recursos → Certificado → Ajustes.
- Información general (datos + generación de imagen con IA si hay créditos), repartida en tres grupos.
- Recursos: índice de páginas y vista previa de la página activa; modal «Añadir página» y flujos de alta por tipo (modales a pantalla completa).
- Certificado.
- Ajustes: hub de visibilidad (Borrador / Público / Privado / Oculto), pesos de evaluación y tipo de navegación (Lineal / Libre; detalle en HU-LMS-011).
- Consumo de créditos IA por acciones generativas con costos fijos de sesión.

**Excluye:**
- Edición de contenidos ya publicados (ver HU-LMS-002).
- Creación de rutas o planes (HU-LMS-008).
- Crear evento (HU-LMS-020): mismo asistente, sin tipo en ficha técnica y con Asistencia en Recursos.
- Detalle completo de Video con IA (HU-LMS-003) y de Evaluación final (HU-LMS-010; alta oficial inline, inmersiva legacy).
- Recurso Asistencia (HU-LMS-025): no se ofrece en este flujo.
- Alta usable de Encuesta libre y Encuesta de satisfacción (aparecen en el selector pero están deshabilitados).

## Reglas de Negocio

- **RN-01:** El asistente tiene exactamente 4 pasos en orden: Información general → Recursos → Certificado → Ajustes (el paso Ajustes concentra visibilidad y pesos).
- **RN-01a:** Información general va en **dos** grupos con fondo gris: **Título, descripción y portada** y **Ficha técnica** (tipo, categoría, nivel, idioma, duración). Eran tres —título y descripción por un lado, portada por otro— y son la misma cosa: lo que se lleva la tarjeta del catálogo. Separarlas obligaba a leer dos cabeceras para llenar un formulario de tres campos (Dave, 15-oct). Ajustes se reparte igual en secciones. Los tres **nombran lo que llevan dentro**, y por eso ninguno cambia entre contenido, ruta y evento: el primero decía «El contenido» / «La ruta» / «El evento» y además repetía el título de la página (Dave, 6-oct).
- **RN-01a-marco:** **Los cuatro pasos usan el mismo marco.** Cada bloque va en un contenedor gris con su rótulo **fuera**, sobre el gris, y el contenido en un panel blanco dentro: los grupos y la vista previa del paso 1, el **índice y la vista previa del paso 2**, y los tres bloques del paso 3. Hasta el 6-oct los pasos 2 y 3 eran tarjetas blancas con el rótulo adentro y una línea debajo, así que se leían como otra pantalla aunque fueran el mismo asistente (Dave, 6-oct).
- **RN-01a-0:** El primer campo se llama **«Título del contenido»** —«de la ruta», «del evento»—, no «Nombre». La misma palabra se usa en el texto de ayuda, en la lista de datos que faltan y en la vista previa cuando aún está vacío («Sin título todavía»).
- **RN-01a-bis:** Un asistente paso a paso dentro de la página sale con un **botón secundario «Salir de la creación»** en las acciones de la cabecera, como Crear vacante. Cuando el flujo edita en vez de crear, dice «Salir de la edición». Los flujos inmersivos (video con IA, presentación interactiva, roleplay) no lo llevan: salen por la X de su propia cabecera.
- **RN-01a-bis-2:** La cabecera de un paso **no lleva flecha de volver a la izquierda del título**. En un paso a paso
  esa flecha se lee como «paso anterior» cuando en realidad sacaba del flujo entero; para atrás está el botón de la
  barra de abajo, y la salida es una sola, la de la derecha. Vale para los dos asistentes nuestros: Crear contenido /
  Crear evento y Crear assessment (Carlos, 1-oct).
- **RN-01a-bis-3:** La cabecera **no lleva antetítulo con la ubicación** («Aprendizaje · LMS Creator» y parecidos): lo primero del cuerpo es el **título**. La ruta, el módulo y el producto ya están arriba, en la miga de pan de la barra superior, y repetirlos debajo gastaba una línea entera de alto sin decir nada nuevo. Vale para todos nuestros flujos de creación (Dave, 6-oct).
- **RN-01a-bis-4:** **El botón para avanzar dice «Continuar», sin el destino** («Continuar a recursos», «Continuar a certificado»… quedaron atrás): el paso siguiente ya se lee en el indicador de pasos. Vale para todas las barras de abajo del LMS Creator y de Diagnóstico, incluidos Roleplay y el setup de Video con IA. El último paso sigue diciendo lo que hace («Crear contenido», «Guardar roleplay») (jefe de Dave, 13-oct).
- **RN-01a-ter:** El contenido **se guarda desde el primer paso**: en cuanto el creador escribe algo ya hay borrador, y
  el chip de guardado aparece en la barra inferior **desde el paso 1**, no desde el 2 (Carlos, 1-oct). Lo único que no
  existe es el contenido que nadie tocó: ahí no hay borrador, no hay chip y salir no pregunta nada.
- **RN-01a-quater:** Salir se comporta de **dos** formas, y ya no hay ninguna en la que se pierda trabajo:
  1. **Nada tocado** —se entró a mirar y no se llenó ningún campo—: se sale **de una**, sin preguntar nada.
  2. **Con algo escrito**, en cualquier paso: confirmación **no destructiva**, que no advierte sino que cuenta dónde
     quedó. «¿Salir de la creación?» · «El contenido queda guardado como borrador. Puedes retomarlo cuando quieras
     desde Contenidos.» · **Seguir aquí** / **Salir de la creación**.

  Es **la misma pregunta** salga por donde salga: el botón «Salir de la creación», la barra lateral, un enlace o el
  «atrás» del navegador. Antes esas salidas indirectas tenían su propio modal («¿Salir sin guardar?», «se pierden»),
  que dejó de ser cierto al guardar desde el paso 1. Ir a un flujo de recurso (video, presentación, roleplay) no es
  salir y no pregunta nada. En Crear evento el texto dice «el evento». La pieza es `DialogoConfirmar`, la misma que
  usa Crear plan de formación.
- **RN-01a-quinquies:** El guardado del prototipo es **simulado**: el borrador vive en la sesión del navegador y se
  retoma al volver a entrar, pero no aparece todavía como una fila en Contenidos ni sobrevive a cerrar la pestaña,
  porque el playground no tiene base de datos. Lo que importa es que el flujo cuente bien cuándo existe el contenido
  y cuándo no.
- **RN-01b:** Los campos que no son obligatorios se marcan con la insignia «Opcional» del design system (Formularios › Obligatorio y opcional), nunca con «(opcional)» dentro del texto de la etiqueta.
- **RN-01a-bis:** En los setups de IA —video, presentación interactiva y evaluador roleplay— **la idea se escribe en la caja del chat de Suite AI**, no en un campo de texto normal: lo que se le pide a la IA se escribe siempre en el mismo sitio, lo haga quien lo haga y esté donde esté. Generar sigue siendo cosa del botón del pie; enviar desde la caja hace lo mismo que ese botón.
- **RN-01b-bis:** En los **setups de IA** —video, presentación interactiva y evaluador roleplay— la idea sí lleva insignia **«Obligatorio», en ámbar** (`warning-light`). Es la excepción a la norma del design system, que manda marcar solo lo opcional: ahí es el único campo del que depende todo el flujo y conviven los dos tipos de insignia en la misma pantalla, así que en gris se leían igual. Ámbar porque es el color con el que el playground ya dice «obligatorio» —la insignia de un contenido obligatorio del plan, en la vista del colaborador—; nadie en el equipo marca campos obligatorios todavía, así que esto sienta el precedente (Dave, 5-oct).
- **RN-01c:** La portada **se resuelve en el propio paso 1, sin modal**. Sin portada, el estado vacío ofrece las dos vías: «Crearla con IA» (secundario de IA) y «Subir una imagen». Con «Crearla con IA» el generador se despliega **debajo del recuadro**, en una tarjeta con su cabecera y su cierre; mientras está abierto, la portada no se pinta arriba porque el propio lienzo del generador ya la enseña. Con portada, el recuadro 16:9 lleva el velo degradado arriba, la insignia «Generado con IA» si vino de IA, y «Cambiar imagen» y «Editar con IA» en la esquina.
- **RN-01c-bis:** El **tráiler vive en su propia tarjeta**, debajo de la portada y **apagado de entrada**, con un interruptor (Dave, 15-oct). No es una forma de hacer la portada: es algo que se reproduce sobre ella, y la mayoría de los contenidos no lo lleva, así que con el interruptor apagado ni siquiera se pide el enlace. Al encenderlo aparece el campo —con su validación: YouTube, Vimeo, Drive y OneDrive— y, en cuanto hay un enlace válido, **la miniatura del vídeo a la derecha de la tarjeta**. Apagarlo borra el enlace: dejarlo guardado y sin usar es lo que hace que después nadie sepa si el contenido tiene tráiler. La categoría lleva icono de carpeta fijo y el título del contenido no lleva icono.

  **De dónde puede venir el enlace se dice debajo del campo**, no en la cabecera de la tarjeta: ahí se leía antes de
  que hubiera nada donde escribirlo. «Puede ser un link de YouTube, Vimeo, Drive y OneDrive.»

  **El play de la miniatura reproduce**: es donde se comprueba que el enlace es el que se quería, sin salir del
  formulario ni abrir otra pestaña. Por lo mismo, **la portada del formulario no lleva play**: ahí la imagen es lo que
  se está eligiendo, y el tráiler se prueba en su tarjeta. La portada sí lleva **su etiqueta**, como los demás campos
  del marco: sin ella era el único bloque sin nombre.

  La miniatura es la real en **YouTube**, que la publica en una dirección fija; Vimeo, Drive y OneDrive piden una llamada con credenciales, así que ahí va un marco con el icono de vídeo.

- **RN-01z:** **Editar un contenido y duplicarlo todavía no existen en el playground, y se dice.** Las dos puertas llevaban al asistente de **creación** con la ficha cargada, y quien lo probaba no sabía si al guardar reemplazaba el contenido o creaba otro: confundía más que no hacer nada (Dave, 15-oct). Hasta que los flujos existan, los botones se quedan —el sitio donde van es parte del diseño— pero avisan en vez de abrir una pantalla que no es la suya.

  **Es temporal y se nota en el copy de la pantalla**, que sigue diciendo «Crea, edita y elimina los contenidos»: la edición entra esta misma semana y entonces estos avisos se cambian por el flujo de verdad. No se toca la bajada por algo que va a durar días (Dave, 15-oct).

  | Dónde | Qué pasa |
  | --- | --- |
  | Contenidos › opciones de un contenido **en borrador** › Editar | Abre el asistente. Ahí sí: está a medias y lo que toca es terminarlo |
  | Contenidos › opciones de **cualquier otro estado** › **Ver resultados** | Abre Resultados. Va **la primera** del menú: es lo que de verdad se viene a hacer con un contenido publicado. Un borrador no la lleva, porque todavía no le ha pasado nada a nadie (Dave, 15-oct) |
  | Contenidos › opciones de **cualquier otro estado** › Editar | «El flujo de edición aún no existe» |
  | Contenidos › opciones › **Duplicar** | «El flujo de duplicado aún no existe» |
  | Resultados › botón **Editar** de la cabecera | «El flujo de edición aún no existe» |
  | Resultados › franja de atención › «Editar recurso», «Editar roleplay», «Revisar la visibilidad» | Lo mismo |

- **RN-01z-bis:** **En LMS Creator un contenido no se elimina**, así que «Eliminar» sale del menú de opciones (y con él su ventana de confirmación). Lo que la gente ya avanzó cuelga del contenido: lo que se hace es **archivarlo u ocultarlo** (Dave, 15-oct).

- **RN-01c-ter:** **El tráiler se reproduce sobre la portada, en los tres sitios donde la portada se ve**: el recuadro del paso 1, la vista previa de la derecha y la vista del colaborador. Un botón de play **redondo** encima de la imagen —el cuadrado de la librería se leía como un botón más de la barra de acciones y no como «dale play»—; al pulsarlo el vídeo ocupa ese mismo hueco y **al terminar vuelve la portada**, que es lo que lo distingue de abrirlo en otra pestaña (Dave, 15-oct).

  Que el vídeo avisa de que acabó lo cuentan **YouTube y Vimeo**, cada uno a su manera y por `postMessage`. **Drive y OneDrive no avisan**: por eso el reproductor lleva siempre una X, para que el tráiler no se quede puesto para siempre.
- **RN-01d:** Recursos y Certificado comparten el mismo reparto de dos columnas: a la izquierda el índice o el formulario (medida fija) y a la derecha «Vista previa», con su título arriba.
- **RN-01d-bis:** **El alto de las dos columnas lo manda la vista previa, no la pantalla.** Al entrar sin páginas abraza su estado vacío y queda bajita; con una página dentro mide lo que mida el recurso con sus complementarios, sin scroll propio. El índice **copia ese alto**: no aporta altura por sí mismo, así que nunca es él quien estira la fila, y si su lista es más larga se desplaza por dentro. Quien hace scroll es la página. Con alto fijo, entrar sin páginas dejaba dos cajones enormes casi vacíos y, con un recurso, lo que no cabía se escondía tras un scroll interno: la experiencia se sentía cortada por los dos lados (Dave, 8-oct).
- **RN-01d-bis-2:** Ese alto tiene **tope: 1.000 px**. Una página con muchos recursos puede medir metros, y entonces el scroll de la página se vuelve interminable y el índice —que copia el alto— se va de la vista. Pasado el tope, la vista previa se queda ahí y lo que sobra **se desplaza por dentro** de ese panel; por debajo no hay scroll interno ninguno (Dave, 8-oct).
- **RN-01d-ter:** En el asistente la cabecera y los pasos van **más apretados** que en el resto del playground: cada rem de aire ahí arriba se lo quita a los paneles, que es donde se trabaja.
- **RN-01d-quater:** La vista previa **no lleva pie con «Eliminar página»**: esa acción vive en el menú de la propia página, dentro del índice, que es donde se gestiona la lista. Como franja fija se llevaba casi 60 px de los pocos que hay para ver el recurso (Dave, 8-oct).
- **RN-01e:** Recursos se para siempre en una página: al entrar, en la primera del índice. Solo cuando el contenido no tiene ninguna página se ve el estado vacío, y ahí la única acción es un botón secundario «Añadir página». El interruptor de secciones lleva su explicación en un botón de información al lado del título.
- **RN-01e-bis:** **El recurso y su cabecera son una sola tarjeta, y el recurso va a sangre.** La barra que dice qué es —«Recurso principal · Video»— y sus acciones viven arriba de la misma tarjeta, separadas por una línea, y debajo el recurso **sin relleno, sin borde y sin esquina redondeada propios**: la tarjeta ya recorta y ya tiene el suyo. Antes eran dos tarjetas apiladas con un hueco y dos bordes entre ellas, y el recurso parecía desconectado de la barra que lo nombra. Vale para video, presentación interactiva, PDF, SCORM y embebido, en el Creator y en la vista del colaborador. **El texto es la excepción**: conserva su caja blanca con relleno, que si no queda volando. Y **evaluación, asistencia y roleplay no se fusionan**: traen varias tarjetas dentro (una por pregunta, por ejemplo) y meterlas en una grande empeora lo mismo que se quería evitar (Dave, 6-oct).
- **RN-01e-ter:** **El visor de PDF se basta solo.** Paginar, el zoom y descargar viven en su propia barra, dentro del visor, pegados a la hoja: son del documento y se usan mientras se lee, así que la página no les pone un pie de acciones debajo. **«Pantalla completa» ya no es suyo**: ver algo sin el panel alrededor es lo mismo que piden un SCORM, una presentación y un contenido externo, así que sale de la barra y pasa al visor común (RN-01e-septies). Donde hay sitio, el botón **dice su nombre** al lado del icono; dentro del teléfono se queda en solo icono (Dave, 6-oct; revisado 9-oct).
- **RN-01e-quater:** **Un SCORM va a alto cómodo y con «Pantalla completa»**, no a la proporción 16:10 de los demás recursos: trae su propia pantalla dentro y a esa medida quedaba una rendija. Su alto real **no se le puede preguntar**: un paquete se estira al alto que le den, así que medirlo mientras ocupa la caja devuelve siempre un poco más que la caja, y con la caja colapsada devuelve casi nada; además, si se sirve desde otro dominio el navegador no deja ni mirarlo. Por eso la salida para verlo entero es el botón, que a partir del 9-oct vive en el visor común y no flotando encima del paquete (RN-01e-septies) (Dave, 6-oct).
- **RN-01e-sexies-bis:** **La asistencia lleva el título de la página en su marco**, como los recursos de pantalla, aunque no tenga «Pantalla completa»: en el teléfono es lo único que dice de qué página se trata. En el Creator no se pasa, porque allí la página ya se nombra en el campo de arriba (Dave, 9-oct).
- **RN-01e-septies:** **Un solo visor para los recursos que se consumen a pantalla completa.** Documento, presentación interactiva, SCORM y contenido externo están pensados para mirarse sin nada alrededor, y cada uno ofrecía esa salida por su cuenta: el PDF en su barra, el SCORM con un botón **encima** del paquete —tapándole la esquina—, y presentación y embebido sin ofrecerla. En la vista del colaborador los cuatro van ahora en el mismo marco gris: **el título de la página** a la izquierda —el mismo trato que ya tenía la evaluación— y **«Pantalla completa» a la derecha**, siempre en el mismo sitio. Lo que es del recurso no sube ahí: el paginador, el zoom y la descarga del PDF siguen pegados a la hoja. El **video no lleva el botón**, porque su reproductor ya trae el suyo y serían dos que hacen lo mismo. En **pantalla completa el botón vuelve dentro del recurso**: la cabecera queda fuera de lo que ocupa la pantalla, y si viviera allí el único camino de vuelta sería la tecla Escape. **En el teléfono la cabecera va igual**, con su título y el botón en solo icono: ahí el botón flotando le tapaba la esquina al recurso, que es justo lo que se quería quitar. Lo que se va del teléfono es el **título suelto** que iba encima del recurso, que con la cabecera estaría dos veces; queda «Página X de Y», que no se ve en ningún otro sitio. **El título nunca se recorta a una línea**: es el nombre de la página, y con puntos suspensivos se pierde lo que hace falta para saber dónde se está, así que si no cabe baja de renglón (Dave, 9-oct).
- **RN-01e-quinquies:** El resultado de una evaluación —aprobó o no— se encabeza con un **icono glass** del design system, no con uno de línea: el visto verde (`glass-tick`) para aprobada y la equis rosa (`glass-close-square`) para no aprobada. Va a 112 px, y **sin el recuadro** del componente de estado vacío: su borde es discontinuo y en una pantalla de resultado promete un «suelta algo aquí» que no existe. Es el mismo criterio de los estados vacíos: donde hay sitio para una ilustración, se lee más amable (Dave, 6-oct).
- **RN-01e-sexies:** **El contenido de ejemplo trae tres secciones.** Quien entra por `#recursos` con el borrador
  vacío ve «Resolución efectiva de conflictos en equipos de trabajo» con: **Fundamentos** (video, presentación
  interactiva, evaluación), **Herramientas para resolver conflictos** (SCORM, PDF, evaluación) y **Practica y
  cuéntanos** (evaluador roleplay, encuesta libre y encuesta de satisfacción). La tercera se añadió el 7-oct para que
  los tres recursos que más cuesta imaginarse sin ejemplo —el roleplay y las dos encuestas— estén a la vista desde el
  primer momento, y sirvan de muestra de cómo se ve cada uno ya montado (Dave, 7-oct).
- **RN-01f:** Cada tarjeta del índice se lee de izquierda a derecha así: asa de arrastre · icono del tipo de recurso · nombre de la página (hasta dos renglones) y su detalle debajo · marca de IA, si el recurso principal se generó con IA · menú de tres puntos. La marca de IA **no** va pegada al nombre: ahí se leía como parte del título y, con el nombre en dos renglones, el conjunto se percibía desalineado. Siempre está visible, porque es un dato de la página y no una acción, y al pasar por encima explica «El recurso principal de esta página se generó con IA» para que no se confunda con un error. El menú, en cambio, solo aparece al pasar por encima de la fila, y es el único sitio donde vive «Cambiar nombre» (junto a «Editar página» y «Eliminar página»); el doble clic sobre el nombre también lo renombra.
- **RN-01f-descripcion:** **La descripción de una sección no se pinta en el índice del colaborador: se abre en una
  ventana** (Dave, 13-oct). Hay clientes que escriben párrafos y párrafos ahí dentro, y ya los tienen así: al
  migrarlos a este formato, pintarla debajo del título estiraría el índice hasta dejar de servir para lo que sirve.
  Es como lo resuelve la plataforma de hoy.
  - En la cabecera de la sección, **a la izquierda del número de páginas, un icono de información** —solo si hay
    descripción—. A la altura de la primera línea del título, no con su alto propio, o se ve caído respecto a la
    insignia y al chevron. Su clic **no pliega la sección**.
  - La ventana es **mediana**, con la descripción en el cuerpo y **un solo botón, «Entendido»**: ahí no se decide
    nada, solo se lee. Si el texto es largo, el cuerpo saca su propio desplazamiento y la ventana no crece.
  - El **título es el de la ventana —«Sobre esta sección»—, no el de la sección**; el nombre de la sección abre el
    cuerpo. Es la regla del equipo para cualquier ventana: a desarrollo le sirve más una cabecera que no cambia con
    el contenido (Carlos, 1-oct).

- **RN-01f-cajas:** **En el índice, una sección es un título con sus páginas debajo, separado del siguiente por una
  línea — no una caja** (Carlos, 13-oct). Esa columna ya acumulaba cajas dentro de cajas: la gris del índice, la
  blanca que lo envuelve con el interruptor de secciones, la de cada sección y la de cada página. Una menos se nota.
  Es como está resuelto en el índice de la vista del colaborador, y **no es un acordeón**: el editor necesita ver
  todas las secciones abiertas a la vez.
  - Lo que marcaba el borde se reparte: la sección con problema lo dice **en su título, en rojo**, con el motivo
    debajo («Sección vacía: añade al menos una página»); y la sección **abierta** ya no se marca, porque la página
    que lo está lleva su barra azul, que dice dónde estás con más precisión que un borde alrededor de todo el bloque.

- **RN-01g:** El índice **se ordena arrastrando, y el arrastre cruza secciones**: una página se puede soltar sobre cualquier otra del contenido, esté en su sección o en otra, y queda donde se soltó. Hasta el 5-oct cada sección era una lista aparte y el arrastre moría en su borde, así que pasar una página de una sección a otra solo se podía por «Mover arriba» / «Mover abajo» del menú de la fila —que sí cruza—, y nadie lo adivinaba. El menú se queda: es la vía de teclado y la que mueve de a un paso.
- **RN-01g-bis:** Mover una página a otra sección **no intercambia nada**: sale de la suya y entra en la otra. Si una sección tenía 3 páginas y la otra 3, quedan 2 y 4.
- **RN-01h:** Mientras se arrastra, y como en el **Creator de producción**: la página **se colapsa** y deja de ocupar sitio en su sección, **un solo recuadro punteado** marca dónde va a caer, y la fila viaja en un **clon que flota** sobre todo —la tarjeta de la sección recorta lo que se sale, así que si no, la fila desaparecía al cruzar—. Las cuentas de cada sección son las de verdad antes de soltar, no después.
- **RN-01i:** Ninguna otra fila se mueve de sitio mientras arrastras, y **no aparecen franjas ni zonas de «suelta aquí»**. Apartar las filas de en medio es lo normal en una lista, pero con el índice repartido en tarjetas hacía que, al llevar la última página de una sección hacia la siguiente, la primera de esa otra sección se desplazara hacia arriba **cruzando a la tarjeta de la primera**: parecía que se iba a cambiar de sección cuando no se movía de ahí. Y marcar un hueco en cada sección molestaba más de lo que ayudaba: salía donde no vas a soltar y movía el contenido.
- **RN-01j:** Se puede soltar en cualquier punto de una sección, no solo sobre una fila: el destino es **la sección que está debajo del cursor** y, dentro de ella, la posición que marca el recuadro. Por eso el pie de la tarjeta —el botón «Añadir página», el borde— y una sección vacía también reciben la página.
- **RN-01k:** **Vista del colaborador.** Desde cualquier paso, un botón junto a «Salir de la creación» abre el contenido **recorrido como lo recorrerá quien lo estudie**. Es la vista que tuvo el asistente WYSIWYG hasta el 1-oct (`legacy-2`), con su mismo reparto en **dos columnas**: a la izquierda lo que el colaborador consume y a la derecha su ficha y **el índice del contenido**. Allá era un modo del editor; aquí es una pantalla aparte con su dirección, porque el editor de hoy tiene su propio cromo y conmutarlo entero obligaría a que cada pieza sepa pintarse de dos formas (Dave, 5-oct).
- **RN-01k-bis:** Va en una **pantalla inmersiva**, no en un modal, y mide lo mismo que los demás flujos del Creator: **1.140**, que es lo que mide la zona de estudio del colaborador con la barra lateral y el encabezado puestos. Más ancha, el contenido se vería más grande de lo que va a ser (Dave, 6-oct).
- **RN-01k-enlace:** **La vista previa se puede mandar por enlace** (Dave, 13-oct). Vive de un borrador en la memoria
  de la pestaña, así que al abrirla en frío —otra persona, otro computador, una ventana nueva— no había nada que
  enseñar: tocaba pasar antes por el asistente. Dos parámetros lo resuelven:
  - **`?ejemplo`** siembra el contenido de ejemplo si la pestaña no trae borrador; **`?ejemplo=forzar`** lo siembra
    siempre, que es lo que hace falta para compartir una pantalla concreta sin depender de en qué andaba quien abre.
    El ejemplo entra con **navegación libre**: un enlace a la última página no puede toparse con el candado de las
    que no se han visto.
  - **`?pagina=<id>`** abre esa página directamente, sin pasar por la portada, y da el contenido por **empezado**
    —que es lo que haría «Comenzar ahora»—, porque si no todas las páginas siguen con candado.
  - **`&estado=aprobado`** deja la página **ya resuelta y con buena nota**; **`&estado=reprobado`**, resuelta y sin
    alcanzarla. Son las pantallas que más cuestan de enseñar: en una evaluación hay que responderlo todo, y en un
    roleplay el primer intento está hecho para quedarse corto y el segundo para aprobar, así que harían falta una o
    dos llamadas seguidas.

  Es para **enseñar y compartir**, no un atajo del producto: no cambia nada de lo que ve quien estudia de verdad.

- **RN-01k-sedecies:** **Se enseña un aparato a la vez**, el que diga un conmutador **«Computador | Celular»** en la cabecera de la pantalla inmersiva, con la misma forma que el de «Editar | Vista del colaborador» del editor. Antes las dos vistas salían juntas, el teléfono pegado al lado: se veían de un vistazo, sí, pero la de escritorio se quedaba con el ancho que sobraba y acababa enseñando algo más estrecho de lo que el colaborador va a ver (Dave, 7-oct).
- **RN-01k-decies:** **El índice del estudiante se ve como el del Creator**: cada página es una ficha con borde, su icono en baldosa y el título hasta en **dos renglones** antes de recortar —cortar a «Comunic…» no distingue una página de otra—. Lo suyo propio son los estados a la derecha y el azul de la que se está viendo.
- **RN-01k-undecies:** **En azul solo la página en curso**: fondo claro y borde, que es como el tema dice «esta es la elegida». La baldosa del icono también: con todas azules el color dejaba de señalar nada. Vale igual para el índice del Creator.
- **RN-01k-duodecies:** Las **secciones son plegables** (acordeón de la librería), sin el rótulo «Sección 1» encima del nombre —ese era del Creator— y con el **número de páginas en una insignia, a la izquierda del chevron**. Nace abierta la sección donde está la página en curso, y si se avanza a otra, esa se abre sola. Sin secciones habilitadas no hay nada que plegar: la lista va seguida.
- **RN-01k-sexdecies:** **Con navegación libre, abrir una página la completa.** Es RN-06 de `HU-navegacion-libre` y es lo que distingue los dos modos: en lineal se avanza en orden y «Continuar» es el gesto que completa; en libre se salta por el índice, y si completar dependiera de «Continuar» no se finalizaría nunca nada —el índice se quedaba con todo en gris y el cierre, inalcanzable— (Dave, 15-oct). Dos excepciones: la **evaluación** solo se completa **al aprobarla** (RN-07), y la **asistencia**, al confirmarse. Saltar a la página 3 **no** completa la 1 ni la 2 (RN-05).

- **RN-01k-septdecies:** **«Fin del contenido» se puede abrir aunque falten páginas, y entonces dice qué falta.** La HU lo deja bloqueado (RN-04 y RN-08 de `HU-navegacion-libre`); aquí se abre a propósito y enseña el **estado vacío del design system** —icono glass, título y una línea con cuántas páginas quedan— en vez de la felicitación (Dave, 15-oct). Lo que la HU protege se respeta igual: **no marca el contenido como finalizado** ni entrega el certificado. Una fila con candado no explica nada; esta sí, y la barra de abajo remata con «Aún no has completado todas las páginas de este contenido» y «Ir a lo pendiente».

- **RN-01k-quindecies:** **Nada se abre antes de empezar.** Hasta que el colaborador pulsa «Comenzar ahora», todas las páginas van **con candado**, incluida la primera. Ese botón no es un atajo a la página 1: es lo que le dice al back que alguien **inició el contenido**, así que tiene que ser la única puerta de entrada. Vale también con navegación libre. En la vista previa del Creator no hay back que avisar, pero el candado se pinta igual porque es lo que verá el colaborador. La puerta **la abre el propio botón**, no las páginas ya vistas: una página solo queda vista al salir de ella, así que deducirlo de ahí dejaba el índice con todo bloqueado mientras se estaba viendo la primera (Dave, 6-oct).
- **RN-01k-terdecies:** Una página bloqueada lleva **candado**, no llave ni ojo de cerradura.
- **RN-01k-quaterdecies:** La columna de la derecha —título e índice— **se queda fija** al bajar; lo que se consume se va con el scroll. En el **móvil no hay botón de retroceder**: para atrás está el gesto del sistema y el índice, que lleva a cualquier página con un toque (Dave, 6-oct).
- **RN-01k-quater:** **El scroll es el de la página, no el de una columna.** Como en la experiencia de estudio de producción: lo que se consume fluye y se baja con la rueda. Lo único que se queda quieto es la columna de la derecha —ficha e índice—, que se pega arriba y se recorta al alto de la ventana; si el índice no cabe, scrollea **dentro de su tarjeta**. Hubo un intento de darle scroll propio a la columna del recurso y Dave lo corrigió: en la vida real esa columna no lo tiene (Dave, 6-oct).
- **RN-01k-vicies:** **Mirar la portada no es empezar el contenido.** El avance se registra cuando el colaborador pulsa **«Comenzar ahora»**, no al entrar: alguien puede abrir un contenido, leer de qué va y marcharse sin haberlo iniciado, y eso no puede quedar contado como progreso ni como contenido en curso (Dave, 8-oct). En la vista se nota en tres sitios:
  - **«Información general» no se da por vista** mientras no se haya empezado: va como la página en curso si se está en ella, o pendiente si no, nunca con la marca de completada.
  - **No se enseña avance** hasta entonces: una barra a cero ya sugiere que el recorrido arrancó.
  - El botón de la barra dice **«Comenzar ahora»** mientras el contenido no esté iniciado, aunque se haya pasado por la portada; después dice «Continuar». Volver a la portada no deshace el inicio.
- **RN-01k-undevicies:** **El avance vive en el índice**, como una barra fina debajo de «Información general» y **sin rótulo**: ahí es donde se mira cómo va el contenido. La barra de abajo se queda con lo que hace avanzar —atrás, continuar y el aviso de turno—, donde el progreso competía con los botones (Dave, 8-oct).
- **RN-01k-sexies:** **Quien estudia no ve las marcas del Creator.** En la vista del colaborador los recursos no llevan la insignia «Generado con IA»: al colaborador no le aporta cómo se fabricó el material, esa insignia es para quien lo crea (Dave, 6-oct).
- **RN-01k-septies:** Arriba de la columna de la derecha va **un título distinto en cada vista**: en **escritorio**, el del **contenido** —el nombre de la página ya está en el índice, al lado, y lo que se pierde de vista al avanzar es en qué contenido se está—; en **móvil**, el de la **página**, que ahí no se ve en ningún otro sitio. En **escritorio es solo el texto**: sin tarjeta alrededor y **sin «Página X de Y»**, porque el recuento ya lo da el índice que viene debajo y el cajón hacía competir el rótulo con el contenido. En móvil, desde el 9-oct **solo queda «Página X de Y»**: el título de la página pasó a la cabecera del propio recurso (RN-01e-septies). La excepción es el **roleplay**, que tiene pantalla propia y no lleva ese marco: ahí el título sigue arriba (Dave, 6-oct; revisado 9-oct).
- **RN-01k-octies:** **Cada aparato tiene su propia barra de navegación.** La de escritorio es la pastilla flotante; la de móvil va dentro del teléfono, y en ella el **índice vive detrás de un botón de solo icono** que lo sube en un panel desde abajo, sobre un velo que lo cierra al tocarlo. En móvil la barra lleva **solo esas dos cosas, el índice y la acción principal**: la barra de avance que iba en medio se quitó —el porcentaje ya está dentro del índice, que es donde se mira cuánto falta, y en 375 px se comía el ancho del único botón que hace avanzar—. Con ese sitio libre, los dos controles suben de tamaño y el principal ocupa lo que queda (Dave, 9-oct). En móvil el índice **no** va en el cuerpo: no cabe. El panel no repite el título «Contenido», que ya trae el índice; lleva el asa de arrastre y la X.
- **RN-01k-nonies-bis:** La maqueta del teléfono lleva **la barra del sistema**: la hora a la izquierda y cobertura, wifi y batería a la derecha, con la muesca en medio. No es decoración: sin ella la vista previa se leía como si la pantalla entera fuera del contenido, y en un teléfono de verdad esa franja siempre está quitando alto. La hora es **fija** («9:41», como en las maquetas de las tiendas de aplicaciones); una que corriera llamaría la atención sobre lo que no importa (Dave, 9-oct).
- **RN-01k-nonies:** Dentro del teléfono los recursos **no llevan el alto mínimo** pensado para escritorio: en una ventanita de 375 px dejaba cajas blancas altísimas alrededor de un video pequeño.
- **RN-01k-quinquies:** La barra de progreso va como **pastilla flotante dentro del scroll**, igual que en roleplay y en los setups, no apoyada en una banda al pie de la pantalla: así se veía un fondo blanco sucio debajo del contenido. Y el recurso tiene un **alto cómodo pero no se estira**: estirándolo absorbía el alto de la columna y, con el scroll de página, encogía en vez de empujar —nada desbordaba, no había nada que desplazar y las tarjetas se veían partidas—.
- **RN-01k-ter:** El **móvil** va dentro de una ventanita que simula un teléfono, con bisel, muesca y scroll por dentro. Se dibuja **siempre a 375 × 812** —un móvil corriente— y se **escala entero** para caber en el alto que haya, como las vistas de dispositivo de cualquier herramienta de diseño: por dentro sigue midiendo 375, que es lo que tiene que enseñar, y por fuera conserva la silueta. Estirarlo al alto disponible lo dejaba en 375 × 677 —proporción 0,55 contra el 0,46 de un móvil de verdad—, se veía achatado y engañaba sobre cuánto cabe en pantalla. Ahí **no hay dos columnas**: se consume arriba y el índice va debajo, que es el orden en el que se usa; y en la portada la ficha va **antes**, porque si no el título del contenido queda debajo de su propia descripción. Las dos vistas van siempre por la misma página: lo que se abre en una se abre en la otra. En el modo celular el teléfono va **solo y centrado**, ocupando el alto que haya, y **no se pinta la barra de escritorio**: la suya la lleva dentro, y dos barras a la vez no se entienden.
  - **No hay scroll de página**, como en la experiencia de estudio de producción: el recurso y el índice se reparten el alto y cada uno hace el suyo. Si el índice no cabe, scrollea él solo. Con una sola barra para todo, el pie de la columna del recurso quedaba vacío mientras el índice seguía más abajo.
  - **La barra de abajo** lleva «Tu progreso», su barra y el porcentaje seguidos a la izquierda, y a la derecha **«Atrás» pegado a «Continuar»**, como en los pasos de los asistentes. No repite el nombre de la página: ya está grande arriba y marcado en el índice.
  - **El índice** está siempre a la derecha, con **«Información general»** arriba —esa primera fila dice solo eso, sin el nombre del contenido debajo: ya está encima del índice y repetirlo era decir dos veces lo mismo (Dave, 6-oct)—, las secciones con sus páginas y «Fin del contenido» abajo, y el **estado de cada una**: en curso, completada, pendiente o bloqueada. Lleva una insignia que dice si la navegación es lineal o libre.
  - **Portada:** la imagen 16:9, «Categoría» y «Descripción» a la izquierda; a la derecha el tipo, el título y la fila de datos (nivel, duración, idioma y certificado).
  - **Página:** el recurso sin ninguna acción de edición y, a la derecha, el vínculo de vuelta a la portada, «Página N de M» y el título. Según el tipo aparecen los botones de consumo: descargar y ver en pantalla completa un PDF, confirmar la asistencia. El **roleplay tiene pantalla propia** —prueba de micrófono, llamada y resultado por objetivo—, descrita en [HU-APR-012](../../../../../colaborador/productos/aprendizaje/experiencia-estudio/HU-roleplay-estudiante.md).
  - **Lo que frena:** una evaluación se responde y se envía antes de seguir, y si no se aprueba se reintenta; una asistencia con autoasistencia pide confirmarla; un roleplay en modo evaluación pide aprobarlo. Con navegación lineal, lo que todavía no toca sale bloqueado.
  - **Cierre:** «¡Felicidades!» con el certificado si completó todo, o lo que le falta si no.
- **RN-01k-septdecies:** **El fin del contenido es un cierre, no un aviso.** Lleva, en este orden: el icono de logro en grande con **«¡Felicidades!»**, «Has culminado con éxito el contenido» y el **título**; el **certificado como algo que ya está listo** —tarjeta propia con su icono y el nombre del contenido, no una insignia suelta—; y **«Sigue aprendiendo»** con tres contenidos del catálogo, porque terminar es el mejor momento para empezar otra cosa. Al llegar cae **confeti sobre toda la pantalla**, una sola vez: ciento cincuenta piezas girando durante unos segundos, en los colores del tema. Una chispa desde un punto se quedaba corta para lo que se está celebrando. Con «reducir movimiento» no cae nada. Es la estructura del cierre de la experiencia de estudio de producción (Dave, 7-oct).
- **RN-01k-duodevicies:** **La descarga del certificado vive en su tarjeta**, no en la barra de navegación: por ahí se avanza en el contenido, y lo que se baja es la tarjeta. El botón dice **«Descargar»** a secas, que lo que se descarga ya está dicho al lado. Debajo de «Certificado disponible» va **el peso del archivo**, no el nombre del contenido: ese está dos líneas más arriba y en grande.
- **RN-01k-undevicies:** Los sugeridos van en la **caja con carrusel** de las competencias de la zona de estudio —su marco, el rótulo arriba y las flechas en la cabecera—, para que se vean aquí como en el resto del portal. Con páginas sin terminar no hay felicitación, ni confeti, ni sugeridos: ahí el cierre dice **qué falta**.
  - Se entra y se sale: **salir devuelve al mismo paso y a la misma página** de la que se entró, y no cuenta como «salir de la creación» (no pregunta nada).
  - **En una ruta no se ofrece**: una ruta no tiene páginas propias sino contenidos, y recorrerla es recorrer cada uno.
  - Las páginas **ocultas** no existen aquí, igual que para el colaborador.
- **RN-01k-vicies-semel:** **Una evaluación tiene un antes, un durante y un después**, como en la experiencia de estudio de producción: no es solo la lista de preguntas (Dave, 8-oct).
  - **Antes.** Una pantalla que dice lo que hay que saber mientras todavía se puede decidir — y **solo lo que no está ya en el encabezado**, que lleva el porcentaje para aprobar, el tiempo límite y cuántos intentos hay: repetirlo debajo es leer dos veces lo mismo (Dave, 8-oct). Queda lo que esa línea no puede decir: que **el reloj arranca al abrirla** y, a partir del segundo intento, **cuántos quedan** —«Te queda 1 intento, este»—, que es la pregunta que de verdad se hace quien va a reintentar. Cuando no hay nada de eso que avisar, no se pinta ninguna lista y la pantalla dice solo «Cuando estés listo, empieza».
  - **Entrar a mirar no cuesta un intento.** Ni el reloj ni el contador arrancan hasta que el colaborador pulsa **«Comenzar evaluación»** (o **«Comenzar intento N»** si ya falló una vez: decir «Comenzar evaluación» en el segundo sonaría a que empieza de cero).
  - **Durante.** En la cabecera, **«Intento N de M»** si se limitan los intentos y **el reloj** si hay tiempo límite —por debajo de un minuto se pone en rojo, que a esas alturas es la información urgente—. Si no se limita ninguna de las dos cosas, no aparece nada: una insignia que siempre dice lo mismo no informa.
  - **El reloj no es una condición más, y no se pierde de vista.** La insignia de tiempo dice **cuánto dura** la evaluación, siempre lo mismo («5 min»); la cuenta atrás va **aparte, a la derecha de esa misma fila**. Un número que cambia cada segundo dentro de una fila de datos fijos hace que la fila entera parezca moverse (Dave, 14-oct). Y mientras se responde, **la cabecera se queda arriba**: un reloj que hay que ir a buscar no sirve de nada, porque se responde abajo, lejos de él. De paso quedan a la vista en qué evaluación se está y con cuánto se aprueba. Solo durante el intento: antes de empezar y al ver el resultado no hay nada que seguir.
    La cabecera pegada **no cambia de aspecto**: mismo ancho que las preguntas, dentro del marco y con su mismo gris. El primer intento la sacaba fuera con márgenes negativos y acababa más ancha que el cuerpo y por fuera del borde, y parecía otra cosa pegada encima.
  - **Salir pausa el intento.** Al irse a otra página la evaluación deja de estar empezada: al volver se ve **«Continúa tu evaluación»** con lo respondido intacto y el aviso de que el tiempo vuelve a correr al continuar. Es más honesto que dejar corriendo un reloj que nadie está mirando.
  - **Se acabó el tiempo:** se califica **lo que alcanzó a responder** y el aviso va **encima** del resultado, porque explica por qué llegó solo. El resultado en sí es el de siempre.
  - **Después.** Tres finales, no dos: **«Aprobaste la evaluación»**, **«No aprobaste esta vez»** —con «Reintentar»— y **«Usaste todos tus intentos»**, que lleva candado, **no ofrece reintentar** —sería prometer algo que no va a pasar— y deja «Continuar» bloqueado con «Habla con tu administrador si necesitas otra oportunidad».
  - **Publicada sin preguntas:** ni bienvenida ni intento ni nota. Se continúa de largo y no gasta nada: no es culpa de quien estudia.
- **RN-02:** Una página del contenido solo se crea cuando el usuario confirma el flujo del recurso; si abandona sin confirmar, no se crea la página.
- **RN-03:** Tipos visibles en el selector de Crear contenido: Video, PDF, Texto, Embebido, SCORM, Evaluación final, Encuesta libre, Encuesta de satisfacción. Habilitados para alta: Video, PDF, Texto, Embebido, SCORM, Evaluación final. Deshabilitados: Encuesta libre, Encuesta de satisfacción. **Asistencia no aparece** (solo en Crear evento / Evento publicado; HU-LMS-025, HU-LMS-020).
- **RN-03a-bis:** En «Añadir página», el **evaluador roleplay** es el único tipo con **ilustración propia** en vez de un icono del set Glass: el orbe de UBITS con la onda de voz. Lo que lo distingue no es «una persona» —lo que decía `glass-profile`— sino que quien conversa y evalúa es **nuestro agente**, y eso el orbe sí lo dice (Dave, 9-oct).
- **RN-03a:** El modal «Añadir página» es de tamaño medio (no a pantalla completa). Incluye un campo «Título de la página» con la insignia «Opcional» y debajo la instrucción de seleccionar el tipo de recurso principal, seguida de la rejilla de cards.
- **RN-03a-bis:** Las tarjetas de recurso de «Añadir página» son **las mismas que las acciones rápidas del Inicio del admin**, en insignia y en comportamiento, porque son el mismo gesto —elegir con qué empezar— en dos sitios:
  - La **insignia de IA** es la oficial del design system (`EtiquetaIA`, gris con el orbe) y cuelga de la **tarjeta**, a **8 px de la esquina de arriba a la derecha**. Colgada del contenido, el relleno la empujaba a 24 px y se leía distinta de la del Inicio aunque fuera la misma pieza.
  - Al **pasar por encima**, la tarjeta sube 2 px, toma un borde azul suave y una sombra, y su ilustración crece al 105 %, en 200 ms. Una tarjeta **no disponible no reacciona** —ni se mueve ni se marca—, y con «reducir movimiento» solo cambian el borde y la sombra (Dave, 6-oct).
- **RN-03b:** En «Añadir página», Video / PDF / Texto / Embebido / SCORM avanzan de inmediato al flujo del recurso al hacer clic en la card. Evaluación también: al hacer clic en su card nace la página de evaluación y se abre para escribir o generar las preguntas (sin el paso de seleccionar y confirmar con «Crear página», que se quitó el 28-sep).
- **RN-03b-bis:** **Presentación interactiva abre su propia puerta**, igual que Video: un modal que invita a **crear una con IA** o a **retomar una de «Tus presentaciones recientes»**. Antes caía directo en el setup con la idea en blanco, y una presentación casi siempre se parte de una que ya se armó. Una sola vía —la IA—, así que el modal no lleva pestañas: la invitación arriba y las recientes debajo, en las mismas tarjetas del catálogo que usa «Tus videos recientes». El borrador en curso, si lo hay, va de primero. Retomar una abre el **editor** directo, sin pasar otra vez por el setup; crear una nueva abre el setup en blanco.
- **RN-03c:** Si el creador escribe el título opcional, esa etiqueta queda en la página al confirmar el recurso y, en Video con IA, también en el editor (no la sustituye la sugerencia de la IA). Si lo deja vacío, la página usa el nombre del recurso principal (`Video`, `Evaluación`, `PDF`, `Texto`, `Embebido`, `SCORM`, `Asistencia`). En Video con IA el editor puede mostrar una sugerencia de título; si Ana la borra y genera el video, la página se llama `Video`.
- **RN-03d:** Los flujos de PDF, Texto, Embebido y SCORM (y el selector de video del modal) son modales fullscreen. Desde ellos, «Volver» (flecha) reabre «Añadir página» sin crear página. Cerrar (X) o abandonar sin confirmar no crea página.
- **RN-03e:** PDF: sin footer de acciones; el alta ocurre al subir el archivo. Embebido: footer solo con «Cargar» (sin Cancelar). SCORM: footer sin Cancelar (sí «Cargar SCORM»).
- **RN-03f:** PDF y Embebido muestran una instrucción grande centrada encima del control (PDF: «Sube el archivo PDF que quieres añadir»; Embebido: «Pega el enlace o el código que quieres embeber»).
- **RN-03g:** Texto: modal fullscreen con editor de texto enriquecido e instrucción «Escribe el texto que quieres añadir»; al confirmar, la página muestra el contenido en modo lectura con acción «Editar» que reabre el mismo modal. El botón «Confirmar» exige contenido no vacío.
- **RN-04:** Patrones de alta: Video, PDF, Texto, Embebido y SCORM van por **modal a pantalla completa** (cabecera de modal, la insignia de créditos de IA en esa cabecera y las acciones en un pie flotante); Evaluación final nace **inline** en Recursos (puede iniciar sin preguntas; detalle HU-LMS-010). La inmersiva de evaluación queda fuera del flujo oficial (legacy por URL) hasta el siguiente Q.
- **RN-04a:** No van en modal, sino **a pantalla completa de verdad**, las que reparten el ancho en columnas y no caben en uno: el setup y el editor del video con IA, el editor de la presentación interactiva y el evaluador roleplay (MVP), que es un paso a paso con su vista previa al lado.
- **RN-04b:** En esas pantallas de varios pasos, la **vista previa va a la derecha, en una columna fija**, y enseña lo que verá el estudiante con lo que se lleva escrito. El reparto es el de Crear assessment: el formulario se lleva el ancho y la vista previa mide 20rem.
- **RN-04c:** En esas pantallas, **la acción principal va siempre al pie**, en una barra como la del setup —también en los editores de video y de presentación, donde vivía arriba en la cabecera—. Un botón principal que está abajo mientras preparas y arriba cuando editas se siente raro: es el mismo botón del mismo flujo (el jefe de Dave, 5-oct). Lo que falta para poder seguir se dice en esa misma barra **como en el bloque «Faltan N datos» de los resúmenes**: el icono en ámbar y el texto en medium, del color de siempre —el texto entero en ámbar no llega al contraste mínimo—. «Ajustes» lo acompaña en esa barra, y **el autoguardado también**: «Guardado» va a la izquierda de la barra, no en la cabecera, porque cuenta lo que acaba de pasar con lo que se está haciendo.
- **RN-04d:** **De un editor solo se sale cerrando.** Un editor (de video, de presentación) no lleva volver: una vez dentro, volver al setup después de haber armado las escenas o las diapositivas no significa nada, porque el setup es lo que las generó. Queda la X de cerrar.
- **RN-04e:** **Un setup sí lleva volver** —se eligió el tipo de recurso hace un paso—, y es la **flecha sola pegada al título**, la misma de los modales de los demás recursos. En ningún sitio hay un botón de volver con texto: el botón de la izquierda de la barra inferior dice «Cancelar», no «Volver». La flecha solo aparece si se llegó desde «Añadir página»; entrando por la dirección directa no hay a dónde volver. («Atrás» de un asistente de varios pasos es otra cosa: mueve de paso, no cierra la pantalla.)
- **RN-04f:** En pantalla angosta, un editor enseña **una zona a la vez** —Escenas o Diapositivas · Vista previa · Propiedades— y se elige **arriba**, con las pestañas de siempre (las mismas del modal «Agregar video»), sin caja alrededor, **centradas y con el icono de cada zona**. Estaban abajo, con forma de barra de navegación de app: repetían el sitio de las acciones y no se leían como lo que son.
- **RN-05:** El pool de créditos IA de sesión inicia en 500.000; sin saldo suficiente la acción generativa no se ejecuta y se muestra aviso.
- **RN-06:** Costos fijos de créditos IA: portada 50, guión de video 80, generación de video 320, evaluación 80; subidas y enlaces sin IA no consumen créditos.
- **RN-07:** Regenerar una generación IA vuelve a cobrar el costo de esa acción.
- **RN-08:** En Ajustes, la suma de los pesos de evaluación debe ser 100% para poder completar/publicar con evaluación ponderada.
- **RN-09:** Video Avatar IA, Video con IA y Presentación interactiva muestran un status panel («Generando recursos» / «Recursos generados»). Cuando uno de esos recursos termina de generar, aparece **solo** un alert de éxito con el botón **Ver página** (no un toast extra de «Página añadida.»), tanto si el panel sigue abierto como si Ana lo cerró. El botón activa esa página en Recursos. PDF, embebido, texto, asistencia, evaluación y video/SCORM sin IA no muestran toast al confirmar: la página se ve de inmediato en el índice.
- **RN-09a:** El modal «Agregar video» tiene cuatro pestañas (Video con IA · Video Avatar IA · Enlace de video · Subir video) y **ninguna abre una ventana encima**: dentro de un modal no se abre otro modal. Lo que haga falta elegir ahí se resuelve con un desplegable, que es un globo flotante y no una ventana. El modal mide **768 px de ancho** —el tamaño oficial de en medio— y como mucho **650 px de alto**: por debajo de eso se ajusta a lo que haya dentro, y al llegar ahí deja de crecer y el cuerpo hace scroll. A pantalla completa quedaba medio modal en blanco, y a 576 px se sentía chiquito (Carlos, 1-oct). **Las cuatro arrancan igual**: una línea que dice qué se hace ahí —mismo componente y mismo tamaño— y debajo lo suyo, con el mismo relleno y la misma separación. **Sin ilustración**: la imagen glass que llegaron a tener Enlace y Subir entró para tapar el vacío de la pantalla completa, y desde que el modal se ajusta a su contenido sobraba. Antes cada pestaña traía su propio ancho, su relleno y su encabezado (un título grande en Video con IA, nada en Video Avatar IA), y se leían como cuatro pantallas distintas. El ancho lo pone el modal; ninguna pestaña lo vuelve a fijar.
- **RN-09a-bis:** Las tarjetas de **Tus videos recientes** y de **Tus videos** son **la tarjeta de contenido del catálogo**, la misma de la cuadrícula de Contenidos, con solo tres de sus campos: la insignia (**Borrador** o **Video**) sobre la imagen, la imagen y el título en dos renglones. Proveedor, competencia, ficha técnica y avance se dejan vacíos. Al pasar por encima la miniatura se acerca un poco y el borde se marca, como en el catálogo. Van de a tres por fila; con cuatro, en este modal el título se cortaba a las dos primeras palabras.
- **RN-09b:** **Video Avatar IA** va en **dos columnas**: a la izquierda las cuatro cosas que hay que llenar —**el guion primero**, con su insignia «Obligatorio», y después presentador, voz del video y logo— **en secciones plegables, abriendo una a la vez** y empezando por el guion. El orden va de lo que falta a lo que ya está resuelto: presentador, voz y logo traen valor por defecto, y sin guion no hay video, y a la derecha una **vista previa** de 300 px. Así el modal no crece por mucho que crezca el formulario.
  - La vista previa enseña **la cara** del presentador elegido (no solo su nombre, que es lo único que de verdad se está decidiendo ahí), la voz, el guion —«Sin escribir» o los caracteres que lleva— y el logo. Debajo, el bloque **«Faltan N datos»** con su barra y la lista, igual que en los asistentes: con las secciones cerradas es la única forma de saber que todavía no se puede generar. Y al final, el aviso de que **los videos generados duran como mucho 2 minutos**, que antes era una franja encima del formulario.
  - Esos 300 px son una **excepción consciente**: la columna de resumen del proyecto mide 20rem (320 px), pero esas viven en páginas de 1.140 px, donde se llevan el 28 % del ancho; aquí, dentro de 768, se llevaban el 42 % (Dave, 2-oct).
  - En el acordeón, **el título que abre cada sección hace de etiqueta** y no se repite dentro.
  - **No tiene video de muestra.** Hubo un video de muestra del presentador, pero existía para que se pudiera oír una voz antes de generar, cuando Video con IA todavía no existía; hoy eso lo da el botón **Escuchar** del selector de voz. Lo que evita que cada sección ocupe un ancho desmedido no es una columna de apoyo, sino la medida del modal.
- **RN-09b-ter:** El formulario de Video Avatar IA va a la **densidad de un formulario corriente**: las etiquetas de sus campos son `FieldLabel` de 14 px —no cabeceras de 16 px en semibold—, **no hay líneas separando campos**, y la rejilla de presentadores usa **un número de columnas por ancho** (5 en la columna del modal, 10 cuando hay sitio), nunca miniaturas de medida fija ni cinco columnas estiradas: las fijas dejan un hueco a la derecha y las estiradas hacían las fotos de 125 px. Antes de esto la pestaña medía 1.122 px de contenido contra los 336 de «Subir video» (Dave, 2-oct).
- **RN-09c:** La **voz del video** se elige en un desplegable con el botón **Escuchar** al lado, y debajo «El acento con el que el avatar narra el video.». Es la misma forma que la **Voz de Serena** de Selección (Crear vacante › Entrevista con Serena AI), para que las dos pantallas se lean igual; se replica la forma, no se importa esa pieza. Las voces van agrupadas por país, cada una con su idioma, y las que no tienen muestra salen deshabilitadas con la insignia **Pronto**. **Escuchar** suena de verdad y pasa a **Detener** mientras suena; solo suena una muestra a la vez.
- **RN-10m:** **Todas las confirmaciones del asistente van en el diálogo grande** (512 px, icono y texto a la izquierda), nunca en el compacto centrado de 320 px: eliminar página, eliminar sección, deshabilitar secciones, eliminar escena, eliminar diapositiva, eliminar pregunta, eliminar sesión, salir de la creación, publicar y ocultar. Es el tamaño que ya usaban Selección, Encuestas y Tareas, y el único donde cabe la estructura de copy del design system. Esa estructura es: **el título pregunta y nombra la cosa** («¿Eliminar «Evaluación Sección 2»?»), **la descripción dice qué se pierde y qué se conserva**, y **el botón dice la acción** («Eliminar página»), nunca «Sí, eliminar» ni «Aceptar». Cada diálogo lleva su icono. Detalle y porqué: Design system › Estados y feedback › Confirmaciones (Dave, 5-oct).
- **RN-11:** Al crear, **no hay pantalla de resumen**: se aterriza en **Contenidos** con un aviso que dice cómo se llama el contenido y en qué estado quedó («Queda en borrador hasta que lo publiques»), y la lista se abre en cuadrícula con el recién creado de primero. Es el mismo final de **Crear assessment**, que aterriza en Diagnóstico. Hubo un resumen que repetía lo que se acababa de llenar y ofrecía publicar desde ahí; se quitó el 1-oct. El aviso lo da el asistente, no la lista: la lista daba uno propio («Contenido creado exitosamente») y salían dos apilados.
- **RN-10:** En Ajustes, mientras el contenido está en **Borrador**, elegir **Público**, **Privado** u **Oculto** abre en el momento un modal de confirmación: «¿Publicar este contenido?» (Público y Privado; botón «Publicar contenido») u «¿Ocultar este contenido?» (Oculto; botón «Ocultar contenido»). **Cancelar** deja la visibilidad que estaba. Al confirmar, se aplica la nueva visibilidad y la opción **Borrador queda deshabilitada**: ya no se vuelve a borrador. Cambiar después entre Público, Privado y Oculto vuelve a pedir confirmación. Al pulsar «Crear contenido», el contenido sale con la visibilidad confirmada; si siguió en Borrador, queda en borrador y se publica después desde Contenidos.
- **RN-10n:** Una página de **Evaluación** o de **Encuesta libre** sin preguntas no deja crear el contenido. Su fila del índice se marca en **rojo** con «Añade al menos una pregunta», **Continuar** queda bloqueado y, en la vista previa de esa página, una alerta amarilla dice por qué. En la evaluación la alerta ofrece escribirlas o generarlas con Orbit Flow; en la encuesta libre solo escribirlas, porque las encuestas todavía no tienen agente. La **Encuesta de satisfacción** no entra: sus preguntas son fijas de UBITS. **No hay** aviso amarillo arriba del índice: con la fila en rojo y la alerta de la página basta (Dave, 14-oct).

## Criterios de Aceptación

**Escenario: Ver el contenido como lo verá el colaborador**

**Dado** que Ana está armando un contenido en cualquier paso
**Cuando** pulsa «Vista del colaborador»
**Entonces** se abre a pantalla completa el recorrido: a la izquierda la portada con su imagen y descripción, y a la derecha su ficha y el índice del contenido
**Y** el índice marca la portada como completada y la página en curso, y deja ver cuáles están pendientes
**Y** avanzando llega a cada página con su recurso y, al final, al cierre con el certificado
**Y** al salir vuelve al mismo paso y a la misma página en la que estaba, sin que le pregunten si quiere salir de la creación

**Escenario: La puerta de la presentación interactiva**

**Dado** que Ana está en «Añadir página»
**Cuando** elige Presentación interactiva
**Entonces** se abre un modal que ofrece crear una con IA y enseña sus presentaciones recientes
**Y** al elegir una reciente entra al editor con esas diapositivas
**Y** al elegir «Crear presentación con IA» entra al setup con la idea en blanco

**Escenario: La acción principal no se mueve de sitio**

**Dado** que Ana prepara un video con IA y la acción principal está en la barra de abajo
**Cuando** entra al editor de escenas
**Entonces** «Generar video» sigue en la barra de abajo, no en la cabecera
**Y** lo mismo con «Generar presentación» en la presentación interactiva

**Escenario: De un editor solo se sale cerrando**

**Dado** que Ana está en el editor de escenas o en el de diapositivas
**Cuando** mira la cabecera
**Entonces** no hay ninguna forma de volver atrás
**Y** la única salida es la X de cerrar

**Escenario: Volver desde un setup**

**Dado** que Ana entró al setup del video desde «Añadir página»
**Cuando** mira la cabecera
**Entonces** ve una flecha sola pegada al título que la devuelve a «Añadir página»
**Y** el botón de la izquierda de la barra inferior dice «Cancelar»

**Escenario: Arrastrar una página a otra sección**

**Dado** que Ana está en el paso Recursos con dos secciones con páginas
**Cuando** arrastra una página de la Sección 1 y la suelta sobre una página de la Sección 2
**Entonces** la página sale de la Sección 1 y queda en la Sección 2, en el lugar donde la soltó
**Y** el resto del orden no cambia

**Escenario: Arrastrar a una sección vacía**

**Dado** que Ana acaba de crear una sección y todavía no tiene páginas
**Cuando** arrastra una página de otra sección y la suelta sobre esa tarjeta
**Entonces** la página pasa a ser la única de esa sección

**Escenario: Ninguna otra página se mueve mientras arrastras**

**Dado** que Ana arrastra la última página de la Sección 1 hacia la primera de la Sección 2
**Cuando** pasa por encima de la Sección 2
**Entonces** la primera página de la Sección 2 sigue exactamente donde está
**Y** lo único que cambia es el recuadro punteado que marca dónde va a caer

**Escenario: Camino feliz — llegar a Recursos con portada lista**

**Dado** que Ana es creadora LMS con 500.000 créditos de sesión
**Y** abre Crear contenido
**Cuando** completa Portada con título válido y avanza
**Entonces** llega al paso Recursos con 0 páginas
**Y** puede iniciar Agregar video u otro tipo de recurso habilitado

**Escenario: Crear la portada con IA sin salir del paso**

**Dado** que Ana está en Información general y el contenido todavía no tiene portada
**Cuando** pulsa «Crearla con IA» y describe la portada
**Entonces** el generador se abre **debajo del recuadro**, en la misma página, sin ningún modal
**Y** al generarla, la portada queda en el bloque con la insignia «Generado con IA»
**Y** el resumen de la derecha deja de contar «Portada» entre los datos que faltan

**Escenario: Caso borde — abandonar el flujo del recurso no crea página**

**Dado** que Ana está en Recursos de un contenido nuevo
**Cuando** abre Agregar video, inicia Crear video con IA y cierra sin Generar video
**Entonces** el listado de páginas del contenido no aumenta
**Y** no aparece una página huérfana ni un loader de proyecto sin terminar en Recursos
**Y** el borrador queda en Recursos IA y en Tus videos recientes para retomarlo

**Escenario: Error — tipo de recurso deshabilitado**

**Dado** que Ana está en Recursos e intenta agregar una página
**Cuando** ve el selector de tipos
**Entonces** Encuesta libre y Encuesta de satisfacción aparecen deshabilitados
**Y** no puede completar el alta de esos tipos

**Escenario: Camino feliz — título opcional y alta inmediata de PDF**

**Dado** que Ana está en Recursos y abre «Añadir página»
**Cuando** escribe un título opcional, elige PDF y completa la carga del archivo
**Entonces** nace la página con ese título y el PDF montado
**Y** si deja el título vacío, la página usa el nombre del recurso (p. ej. `PDF`)
**Y** al elegir Video, PDF, Texto, Embebido o SCORM avanza de inmediato sin «Crear página»

**Escenario: Camino feliz — elegir evaluación crea la página**

**Dado** que Ana está en Recursos y abre «Añadir página»
**Cuando** hace clic en la card Evaluación
**Entonces** nace la página de evaluación en Recursos y se abre con el editor de preguntas
**Y** no hay un paso intermedio de confirmar con «Crear página»
**Y** la página puede iniciar sin preguntas (deuda técnica temporal; HU-LMS-010)

**Escenario: Camino feliz — agregar texto y editarlo**

**Dado** que Ana está en Recursos y abre «Añadir página»
**Cuando** elige Texto, escribe contenido en el editor y confirma
**Entonces** nace la página con el texto en modo lectura
**Y** al pulsar «Editar» se reabre el mismo modal con el contenido para modificarlo

**Escenario: Camino feliz — reemplazar recurso principal del mismo tipo**

**Dado** que Ana tiene una página con video, PDF, SCORM/presentación o embebido ya montado
**Cuando** pulsa «Reemplazar» bajo el recurso
**Entonces** se abre el mismo flujo de alta de ese tipo (no el selector de tipos)
**Y** al confirmar, el recurso de la página se sustituye y el tipo no cambia
**Y** texto y asistencia siguen usando «Editar», no «Reemplazar»

**Escenario: Caso borde — Volver desde modal de recurso a Añadir página**

**Dado** que Ana abrió «Añadir página» y entró a Agregar PDF (o Texto, Embebido, SCORM o Video)
**Cuando** usa «Volver»
**Entonces** regresa al modal «Añadir página»
**Y** no se crea ninguna página nueva

**Escenario: Caso borde — cerrar modal de recurso sin confirmar**

**Dado** que Ana está en Agregar embebido (o SCORM) sin haber confirmado
**Cuando** cierra el modal con la X
**Entonces** no se crea la página
**Y** no queda un recurso huérfano en el índice

**Escenario: Camino feliz — alert al terminar un recurso generado**

**Dado** que Ana inició la generación de un Video Avatar IA, un Video con IA o una Presentación interactiva
**Y** el status panel está visible o ya lo cerró
**Cuando** ese recurso termina de generar
**Entonces** aparece un solo alert de éxito (variante con botón) aunque el panel esté abierto o cerrado
**Y** no aparece un toast de «Página añadida.»
**Y** el botón dice Ver página
**Y** al pulsarlo va a la página de ese recurso en Recursos

**Escenario: Recursos inmediatos — sin toast**

**Dado** que Ana confirma un PDF, embebido, texto, asistencia, evaluación o un video/SCORM sin IA
**Cuando** nace la página en Recursos
**Entonces** ve la página de inmediato en el índice
**Y** no aparece toast ni alert de «Ver página»

**Escenario: Confirmar la visibilidad al salir de Borrador**

**Dado** que Ana está en Ajustes con el contenido en Borrador
**Cuando** elige Público, Privado u Oculto
**Entonces** aparece el modal «Publicar contenido» (o «Ocultar contenido» si eligió Oculto)
**Y** si pulsa Cancelar, la visibilidad sigue en Borrador
**Y** si confirma, la visibilidad cambia a la elegida y la opción Borrador queda deshabilitada

---

## Enlaces fijos de la vista previa (14-oct-2026)

Cada pantalla de la vista del colaborador tiene su dirección, y **la dirección sigue a la vista**: al moverse por el
contenido se va reescribiendo sola. Es un playground, y enseñar algo aquí es mandar un enlace —«mírate solo la
portada», «mírate la evaluación reprobada»—; antes había que explicar por dónde pasar para llegar (Dave, 14-oct).

Sobre el curso de ejemplo (`?ejemplo=forzar` lo siembra aunque haya un borrador empezado):

| Qué se quiere enseñar | Dirección |
| --- | --- |
| La portada | `/admin/aprendizaje/lms-creator/vista-colaborador?ejemplo=forzar` |
| Una página concreta | `…/vista-colaborador?ejemplo=forzar&pagina=p1` |
| El final, con el certificado | `…/vista-colaborador?ejemplo=forzar&vista=cierre` |
| Una evaluación **aprobada** | `…/vista-colaborador?ejemplo=forzar&pagina=p3&estado=aprobado` |
| Una evaluación **reprobada** | `…/vista-colaborador?ejemplo=forzar&pagina=p3&estado=reprobado` |
| Un roleplay aprobado o no | `…/vista-colaborador?ejemplo=forzar&pagina=p7&estado=aprobado` |

`estado` fabrica el veredicto sin tener que recorrer el recurso entero: son las pantallas que más cuesta enseñar
—en una evaluación habría que responderlo todo y en un roleplay hacen falta dos llamadas—. Al navegar a otra página
el parámetro se cae, porque el veredicto era de la página que se pidió.

`volver` y `destino` siguen siendo de quien abrió la vista previa y no los toca la navegación: `destino` es el que
devuelve a Resultados al cerrar (RN-16 de HU-resultados-contenido).

### La vista previa abre donde estás editando

«Vista del colaborador» no abre la portada: abre **la página que se está editando**. Quien está en la séptima quiere
ver esa, y obligarle a recorrer las seis anteriores para comprobar un cambio no tiene sentido (Dave, 14-oct).

Y llega **como llegaría quien estudia**, según la navegación del contenido:

| Navegación | Cómo entra |
| --- | --- |
| **Lineal** | Con las páginas anteriores ya recorridas: progreso avanzado y lo que viene después, bloqueado. Si no, el índice las enseñaría bloqueadas y la pantalla mentiría sobre dónde está quien la mira |
| **Libre** | Directo a esa página, sin nada completado — que es justo lo que se puede hacer en libre |

El id sale del hash del asistente (`#recursos/page/p4`), que es donde guarda en qué página está, y viaja como
`&pagina=p4` junto al `volver` de siempre.
