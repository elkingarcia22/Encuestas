# HU: Recurso asistencia en eventos

## Contexto

RRHH dicta capacitaciones en sitio cuya evidencia vive fuera de Ubits (hojas, Drive, Excel). El tipo de contenido Evento concentra esas jornadas: Ana arma sesiones con horario y descripción opcional para que esa evidencia quede en el LMS.

El problema que resuelve **Autoasistencia** es de confianza: si cualquiera puede marcar que asistió, la evidencia deja de valer. Ana necesita decidir, por contenido, si **además de ella** el participante puede marcarse presente. Ana carga la lista a mano siempre; la autoasistencia solo abre —o cierra— la segunda vía.

> **Sustituye a «Sesión libre» (22-sep-2026).** Aquel switch no resolvía esto y además hacía daño: al activarlo **inhabilitaba las sesiones**, así que Ana perdía el horario. Autoasistencia **no toca las sesiones** — se siguen creando igual — y solo cambia quién confirma.

## Historia de Usuario

**Como** creadora de contenidos LMS,
**quiero** agregar un recurso de asistencia solo en un Evento, con una sesión precreada, descripción opcional y zona horaria de la compañía,
**para** que las capacitaciones en sitio existan en Ubits con trazabilidad.

## Pantallas en el prototipo

Cada pantalla del flujo tiene su dirección en el playground UX (en local, `http://localhost:5173` + la dirección). Si se abre directo con el borrador vacío, carga el curso de ejemplo «Resolución efectiva de conflictos en equipos de trabajo» para seguir el flujo desde ahí.

| Pantalla | Dirección | Qué se ve |
|---|---|---|
| Agregar asistencia (evento) | [`/admin/aprendizaje/lms-creator/agregar-asistencia`](http://localhost:5173/admin/aprendizaje/lms-creator/agregar-asistencia) | Instrucciones, autoasistencia y sesiones. **Es una pantalla, no un modal** |
| Crear evento · Recursos | [`/admin/aprendizaje/lms-creator/crear-evento#recursos`](http://localhost:5173/admin/aprendizaje/lms-creator/crear-evento#recursos) | Donde nace la página de asistencia. El evento de ejemplo abre **con tres asistencias ya montadas** (RN-12) |

## Alcance

**Incluye:**
- Card de tipo «Asistencia» en Añadir página / ResourcesBlock **solo** en Crear evento y en Editar de un contenido tipo Evento.
- **Pantalla** de setup: instrucciones, autoasistencia y sesiones (nombre + fecha/hora + descripción opcional).
- Al abrirla: una sesión ya creada; el botón eliminar de esa única sesión se ve, deshabilitado.
- Alert de zona horaria de la compañía.
- Confirmar antes de eliminar una sesión, siempre (en Editar contenido, además, se borran sus asistencias).
- Página renderizada en Recursos del Creator tras confirmar.

**Excluye:**
- Calificación / umbral aprobatorio sobre la asistencia (fuera del alcance v1).
- Validación anti-fraude de Etapa 3 (QR geolocalizado, etc.).
- Recurrencia avanzada de series fuera de sesiones explícitas.
- Experiencia del colaborador al confirmar (HU-APR-009).
- Tab de Resultados / carga de asistencias (HU-LMS-026).
- Ofrecer Asistencia en Crear contenido genérico (HU-LMS-001).

## Reglas de Negocio

- **RN-01:** El recurso asistencia solo se puede **añadir** en un contenido tipo Evento (Crear evento o Editar de un Evento). Las páginas de asistencia ya existentes siguen editables.
- **RN-01a:** En «Añadir página» de un **evento**, Asistencia es la **primera** card de la lista. Es el recurso que le da sentido al tipo de contenido, y escondida entre las últimas parecía un extra más. En Crear contenido el orden no cambia —ahí Asistencia ni se ofrece (RN-01)—.
- **RN-02:** Debe existir **al menos una sesión** con fecha y horario. No hay forma de guardar una asistencia sin sesiones.
- **RN-02a:** Al abrir Agregar asistencia hay **una sesión precreada** (`Sesión 1`, horario 09:00–10:00). Su botón eliminar **se ve deshabilitado** mientras sea la única, no oculto.
- **RN-02b:** Cada sesión tiene un cuarto campo **Descripción**, opcional, debajo de Fecha / Hora inicio / Hora fin.
- **RN-02c:** Un alert warning informa que las sesiones se guardan según la zona horaria de la compañía y muestra esa zona (en el playground: Bogotá, UTC-05:00).
- **RN-02d:** **Autoasistencia** decide **quién puede marcar la asistencia**, y nada más. **No afecta a las sesiones:** con el switch activo o inactivo, Ana sigue creando y editando sesiones igual.
  - **Lo que nunca cambia:** Ana **siempre** puede cargar la asistencia a mano desde **Editar contenido → Resultados → Asistencias**, esté el switch activo o no. La autoasistencia **suma** una vía, no la sustituye: decir «si está desactivada, el administrador es quien confirma» es engañoso, porque hace pensar que al activarla Ana deja de poder hacerlo.
  - **Activa:** el participante confirma **además** su propia asistencia desde la experiencia de estudio, durante el horario de la sesión.
  - **Desactivada:** el participante **no puede marcar** que asistió — no ve el botón de confirmar. La única vía es que un creador cargue la lista a mano desde **Editar contenido → Resultados → Asistencias** ([HU-LMS-026](../resultados/HU-resultados-asistencias.md)). Ana la desactiva cuando no quiere que alguien se marque presente sin haber ido.
- **RN-03:** Las sesiones son el día y el horario en que los estudiantes pueden confirmar que asistieron; fuera de ese periodo no pueden hacerlo.
- **RN-03b:** Cada sesión tiene un **nombre** en un campo con label «Nombre de la sesión». Al añadirla nace como `Sesión 1`, `Sesión 2`, etc.; Ana puede cambiarlo. Si deja el campo vacío, al salir se restaura el nombre por defecto.
- **RN-04:** Las instrucciones son opcionales. El label lo dice con una **insignia «Opcional»**, nunca entre paréntesis.
- **RN-05:** El título de página es el opcional de «Añadir página» o, vacío, el nombre del recurso (`Asistencia`).
- **RN-06:** Un Evento puede tener una o más páginas de asistencia junto a otros tipos de recurso.
- **RN-07:** En edición publicada, la acción del recurso es **Editar** (abre la pantalla), no «Reemplazar».

### La pantalla de setup

- **RN-09:** Agregar y editar asistencia es una **pantalla a pantalla completa**, no un modal: su propia dirección, `/agregar-asistencia`, como los demás flujos de alta de recurso (video, presentación, roleplay). Era un modal y, al pedir confirmación para eliminar una sesión, quedaba **un diálogo encima de otro**, que no se hace.
- **RN-09a:** **Eliminar una sesión siempre pregunta antes**, también al crear el evento: se lleva su fecha, su horario y su descripción, y no hay cómo deshacerlo. El nombre de la sesión va en el cuerpo del diálogo, no en su título.
- **RN-09b:** Al **salir sin guardar** desde la X o desde «Cancelar», se vuelve **a la página que se estaba editando**, no a la raíz del asistente: sin eso, el asistente reabría en el paso 1 y parecía haberse perdido el contenido. En alta se vuelve al paso de recursos.
- **RN-09c:** **Agregando, se sale por la X en círculo de la cabecera**, como en las demás experiencias inmersivas, y vuelve a «Añadir página»; editando, la salida es «Salir de la edición» y lleva a la página que se estaba editando (jefe de Dave, 14-oct).
- **RN-09c:** Los campos de una sesión miden **lo mismo**: Fecha es un disparador de calendario y no un campo de texto, así que se iguala al alto de Hora inicio y Hora fin.
- **RN-09d:** La flecha de volver va **sola, pegada al título**, como el «volver» de los modales de recurso; no como botón con etiqueta.

### La página renderizada

- **RN-10:** Cada sesión se pinta como una **tarjeta con su fecha en bloque** —día y mes a la izquierda—, con el nombre, el horario y la descripción al lado: el mismo trato que la tarjeta de evento de la zona de estudio.
- **RN-10a:** La página dice **quién puede marcar la asistencia**, en una fila de ficha: «Tú y los participantes» con autoasistencia activa, «Solo tú, desde Resultados» sin ella. Nunca un texto que dé a entender que Ana pierde su vía.
- **RN-08:** Solo en **Editar contenido**: si el día de una sesión ya pasó, esa sesión queda en solo lectura. Ana puede añadir sesiones nuevas. **No aplica** a Crear evento.
- **RN-08a:** En Editar contenido, al pulsar eliminar sesión (si hay más de una) se muestra un modal de advertencia: si hay asistencias registradas, también se eliminarán. Cancelar no borra. Los botones de eliminar sesión son terciarios de error (rojos).

### El ejemplo del prototipo

- **RN-12:** El evento de ejemplo del prototipo —«Protocolos de supervivencia y seguridad ante sismos»— llega a Recursos **vertebrado por asistencias**: tres de sus cinco páginas lo son, intercaladas con un video y una evaluación. Un evento sin ninguna asistencia enseñaba justo lo contrario de lo que es un evento, y obligaba a montar una a mano para ver la pantalla de la que habla esta historia. Es el **mismo contenido** que el playground React trae en `crear-evento` (f021), copiado de su semilla: los mismos títulos, las mismas sesiones, las mismas instrucciones, el mismo video y las mismas preguntas, para que los dos prototipos cuenten lo mismo.
- **RN-12a:** Las tres asistencias llegan con **autoasistencia desactivada**, como en React: en una jornada presencial, un simulacro y un taller, el valor del dato está en que lo confirme quien dirige la actividad.
- **RN-12b:** El video del ejemplo es un **enlace de YouTube**, no un video generado con IA. Es lo que trae React, y marcarlo como de IA cambiaba lo que enseña la página: salía la insignia «Generado con IA» y el botón «Editar video», que no existen en un enlace —ahí la única acción es «Reemplazar»—.
- **RN-12d:** La evaluación del ejemplo lleva las **cinco preguntas de sismos** de React —qué hacer dentro de un edificio, el marco de la puerta, el coche, el «triángulo de la vida» y el tsunami—, no preguntas del banco genérico: con las del banco, la evaluación hablaba de otro tema que el resto del evento. Lo único que no se trae es el **minuto del video** que React muestra en cada pregunta: este editor no tiene ese campo —`Instrucción` aquí es un tipo de pregunta, no un dato de todas—, y guardarlo habría dejado algo que ninguna pantalla enseña.
- **RN-12c:** Lo único que no se copia literal de React son las **fechas** de las sesiones: allá son pasadas porque el contenido ya está publicado, y aquí el evento se está **creando**, donde unas sesiones que ya ocurrieron no se entienden.

## Criterios de Aceptación

**Escenario: Camino feliz — montar asistencia en un evento**

**Dado** que Ana está en Crear evento en el modal «Añadir página»
**Cuando** selecciona Asistencia, revisa la sesión precreada (puede añadir más o escribir descripción) y confirma
**Entonces** se cierra el modal y nace una página de asistencia en Recursos
**Y** ve la vista renderizada con instrucciones y listado de sesiones

**Escenario: Camino feliz — sesión precreada y eliminar deshabilitado**

**Dado** que Ana abre Agregar asistencia por primera vez
**Cuando** mira las sesiones
**Entonces** ya existe «Sesión 1»
**Y** el botón eliminar de esa sesión se ve, deshabilitado
**Y** activar Autoasistencia no cambia las sesiones

**Escenario: Autoasistencia desactivada — el participante no puede marcarse**

**Dado** que Ana deja Autoasistencia desactivada y guarda el recurso
**Cuando** el colaborador abre la asistencia en su experiencia de estudio
**Entonces** ve las sesiones con su horario
**Y** no ve el botón «Confirmar», sino un aviso de que su administrador confirma esa asistencia
**Y** la única forma de registrarlo es que un creador lo cargue desde Resultados → Asistencias

**Escenario: Autoasistencia no inhabilita las sesiones**

**Dado** que Ana tiene dos sesiones creadas
**Cuando** activa y vuelve a desactivar Autoasistencia
**Entonces** las dos sesiones siguen ahí, con sus horarios intactos
**Y** puede seguir agregando sesiones nuevas en cualquiera de los dos estados

**Escenario: Camino feliz — zona horaria**

**Dado** que Ana ve el bloque de sesiones
**Cuando** lee el alert
**Entonces** ve un warning que indica que las sesiones se guardan en la zona horaria de su compañía
**Y** el texto incluye esa zona (Bogotá, UTC-05:00 en el playground)

**Escenario: Camino feliz — descripción opcional**

**Dado** que Ana edita una sesión
**Cuando** escribe una descripción y confirma
**Entonces** esa descripción queda guardada en la sesión
**Y** si la deja vacía, igual puede confirmar

**Escenario: Un evento abre con sus asistencias puestas**

**Dado** que Ana abre el evento de ejemplo en Crear evento
**Cuando** llega al paso Recursos
**Entonces** la primera página es una asistencia
**Y** hay tres páginas de asistencia entre las cinco del evento
**Y** al abrir «Añadir página» la primera card es Asistencia

**Escenario: Camino negativo — Crear contenido no ofrece Asistencia**

**Dado** que Ana está en Crear contenido
**Cuando** abre Añadir página
**Entonces** no ve la card Asistencia

**Escenario: Editar contenido — confirmar eliminar sesión**

**Dado** que Ana está en Editar contenido, edición de recursos habilitada, y abre Editar en una página de asistencia con dos sesiones
**Cuando** pulsa el botón rojo de eliminar en una sesión que no es la única
**Entonces** ve un modal de advertencia de que si hay asistencias registradas también se eliminarán
**Y** si cancela, la sesión sigue
**Y** si confirma Eliminar, la sesión desaparece

**Escenario: Editar contenido — sesión cuya fecha ya pasó**

**Dado** que Ana está en Editar contenido y abre Editar en una página de asistencia
**Y** una sesión tiene fecha anterior a hoy
**Cuando** ve esa sesión en el modal
**Entonces** nombre, fecha, horarios y descripción están en solo lectura
**Y** no puede eliminar esa sesión
**Y** puede añadir sesiones futuras y confirmar
