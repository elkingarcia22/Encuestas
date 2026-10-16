# HU: Evaluador roleplay

## Contexto

Hoy Ana puede medir conocimiento (evaluaciones) pero no **desempeño conversacional**: dar retroalimentación difícil, atender a un cliente molesto o sostener una negociación solo se practican en vivo, con un jefe o un par disponible. El Evaluador roleplay permite que el colaborador converse con un personaje de voz y sea calificado contra objetivos definidos por Ana.

> **Fusionada el 5-oct-2026.** Hubo dos roleplays: este, un paso a paso a mano, y el de IA ([HU-LMS-024](HU-roleplay-mlp.md)), que proponía todo a partir de una frase. Ahora es **uno solo**, con lo que gustó de cada uno: **el setup con IA del MLP**, que pasa a ser un modal previo, y **el paso a paso de aquí**, donde se termina de armar. Lo que sigue describe el recurso ya fusionado.

Esta HU cubrió primero la **versión inicial**: sin agente de IA que redacte la configuración. Se libera primero porque no depende del agente generador, y porque permite validar con clientes reales si el roleplay resuelve el problema antes de invertir en la asistencia automática ([HU-LMS-024](HU-roleplay-mlp.md)).

> **El otro lado.** Lo que ve el colaborador cuando llega a esa página —probar el micrófono, la llamada por voz o por escrito, y el resultado objetivo por objetivo— está en [HU-APR-012](../../../../../../colaborador/productos/aprendizaje/experiencia-estudio/HU-roleplay-estudiante.md).

## Historia de Usuario

**Como** creadora de contenidos LMS,
**quiero** añadir a un contenido una llamada de práctica con un personaje que evalúe al colaborador contra objetivos que yo defina,
**para** medir habilidades conversacionales sin depender de que un líder esté disponible para simular la situación.

## Pantallas en el prototipo

Cada pantalla del flujo tiene su dirección en el playground UX (en local, `http://localhost:5173` + la dirección). Si se abre directo con el borrador vacío, carga el curso de ejemplo «Resolución efectiva de conflictos en equipos de trabajo» para seguir el flujo desde ahí.

| Pantalla | Dirección | Qué se ve |
|---|---|---|
| Agregar evaluador roleplay | [`/admin/aprendizaje/lms-creator/agregar-roleplay`](http://localhost:5173/admin/aprendizaje/lms-creator/agregar-roleplay) | El paso a paso: Planificación, Personaje, Estudiante y Configuración |
| La puerta | Se abre al elegir **Evaluador roleplay** en «Añadir página» | La idea para la IA y «Tus roleplays» (borradores y listos) |

La dirección vieja del MVP (`/agregar-roleplay-mvp`) redirige a la nueva, para que un enlace compartido no muera.

## La fusión del 7-oct-2026

Al roleplay fusionado le llegaron tres quejas, y las tres son de la **forma**, no del fondo: lo que se le pide al creador
está bien, cómo se le pide no.

1. **La experiencia se sentía rara.** Un modal de configuración que no configura nada decisivo, y detrás una pantalla
   distinta donde empieza lo bueno.
2. **No se podía retomar ni reusar.** Video con IA y presentación interactiva tienen su biblioteca; el roleplay era el
   único recurso de IA donde cada vez se empieza de cero, aunque el creador ya hubiera armado uno casi igual.
3. **Pasos dentro de pasos.** Crear contenido ya es un paso a paso de cuatro; meterle otro de cuatro para armar la
   llamada deja a cualquiera sin saber en qué parte del mundo está.

**Cómo quedó, el 7-oct: fusionadas.** Después de verlas al lado se tomó lo mejor de cada una y eso es ya **el flujo
oficial** del evaluador roleplay:

- **La puerta es la de la v2**: la idea para la IA y «Tus roleplays» —borradores para retomar, listos para reusar—.
- **El formulario es el de la v1**: el **paso a paso con su resumen** al lado, que es lo que hace la experiencia
  amigable; se descartó la pantalla única de la v2, que ponía los cuatro bloques seguidos.
- **La IA propone en la puerta** y el paso a paso abre **lleno**, con la insignia «Propuesto por IA» junto al título.
- **«Guardar borrador» vive en la barra del paso a paso**: es lo que le da sentido a la biblioteca de la puerta.

**La v2 ya no existe como pantalla aparte**: su tarjeta, su ruta y su pantalla única se borraron el 7-oct, una vez
tomado de ella lo que valía. Hay un solo evaluador roleplay.

- **RN-V2-01 · La puerta no configura, elige por dónde empezar.** Dos caminos: escribir la idea y que la IA arme todo,
  o tomar algo de **«Tus roleplays»**. Modo, duración y voz ya no se preguntan aquí —se preguntaban dos veces, y eso
  hacía que el modal se leyera como un paso más—: viven donde se ajustan, en la pantalla.
- **RN-V2-02 · Hay biblioteca, como en video y presentación.** Un **borrador** se retoma donde quedó; uno **listo** se
  reusa y **se copia** en esta página, así que ajustarlo aquí no toca el de la otra. Cada uno es **una fila** —orbe o
  foto del personaje, título, con quién se habla y la insignia—, no la tarjeta con portada de «Tus videos»: un roleplay
  no tiene miniatura que enseñar, así que esa portada gastaba 170 px de alto para pintar un icono. «Ver todos» abre la
  lista completa.
- **RN-V2-02-bis · La puerta cabe entera sin desplazarse.** La medida que manda es **1366 × 610**, que es lo que le
  queda de alto a nuestra gente después del navegador y la barra de su sistema. Con la portada y el encabezado de tres
  renglones el modal se pasaba 153 px y había que hacer scroll dentro de la ventana para llegar a lo que importa. La
  explicación de qué hace la IA va en **un renglón** bajo el campo, no en un encabezado: la bajada del modal no se ve
  —es solo para lectores de pantalla—, así que lo que hay que decir se dice dentro del cuerpo (Dave, 7-oct).
- **RN-V2-03-bis · El resumen de la derecha es corto.** Enseña el personaje, el modo, la duración, los intentos,
  **cuántos objetivos** hay y con cuántos se aprueba. **No repite el escenario** —está entero en el campo de al lado— ni
  lista los objetivos uno a uno: con eso la columna crecía tanto que lo demás quedaba fuera de pantalla. La ficha del
  roleplay ya montado en la página sí los enseña enteros, que ahí es lo único que hay de la llamada (Dave, 7-oct).
- **RN-V2-03 · El formulario es el paso a paso con su resumen.** Planificación → Personaje → Estudiante →
  Configuración, con el resumen de la llamada en la columna de la derecha. Se probó la pantalla única —los cuatro
  bloques seguidos— y se descartó: el paso a paso guía mejor y el resumen al lado deja ver qué se está armando.
- **RN-V2-04 · La IA propone en la puerta.** Se escribe la idea, la IA arma escenario, personaje y objetivos, y el
  paso a paso **abre lleno**, con la insignia «Propuesto por IA» junto al título. Dentro del formulario **no hay nada
  más de IA**: lo que no guste se edita en su campo. Se probaron dos formas de dejarla presente ahí dentro y se
  quitaron las dos —el panel contextual acoplado a la derecha (segunda X bajo la de la pantalla, cabecera repetida y
  452 px menos de formulario) y una sección «Pídele un cambio a la IA» arriba—; el panel contextual sigue siendo lo
  correcto donde hay algo que consultar, y esta pantalla no es ese caso (Dave, 7-oct).
- **RN-V2-05 · Lo que escribe la IA no se «acepta», se edita.** Nada de insignia «Propuesto por la IA» en cada bloque
  ni de botón «Aceptar», ni del contador de bloques sin revisar: el creador **acaba de pedir** que la IA lo escribiera,
  ya sabe de dónde salió, y lo que no le guste lo cambia en el campo, ahí mismo. Declarar «acepto» bloque por bloque era
  un trámite que no decidía nada (Dave, 7-oct). La página sí queda marcada como generada con IA, que eso sí importa
  después —en el índice y en el listado—, pero eso no es algo que el creador tenga que confirmar.
- **RN-V2-06 · Nada en rojo antes de tiempo.** Un campo marca error cuando se escribió en él o cuando se intentó
  guardar, nunca al abrir la pantalla en blanco. Abajo, a la izquierda, siempre se dice qué falta: con tres o menos se
  nombran, con más se dice cuántos.
- **RN-V2-07 · Se guarda solo.** El paso a paso **autoguarda en «Tus roleplays»** mientras se arma, con el mismo chip
  de Crear contenido —«Cambios sin guardar» → «Guardando…» → «Guardado»—: se espera a que el creador pare de escribir y
  se guarda. El chip va **a la izquierda de la barra de abajo, nunca en la cabecera**, como en todos nuestros flujos
  (RN-04c). Por eso **no hay botón «Guardar borrador»**: lo que hacía, ahora pasa solo. Cada
  autoguardado **pisa el mismo borrador**, no deja una copia por cambio, y arranca en cuanto hay título, escenario o
  personaje —antes no hay nada que guardar—. «Guardar roleplay» crea la página, vuelve al asistente y convierte ese
  mismo borrador en **listo**, para reusarlo en otra página sin volver a armarlo. **Editando** una página que ya
  existe no autoguarda ni aparece el chip: ahí el roleplay vive en su página, no suelto en la biblioteca (Dave, 7-oct).


## Alcance

**Incluye:**
- Un solo tipo de recurso, **Evaluador roleplay**, en Resources card, Añadir página y ResourcesBlock.
- Modal fullscreen con ruta propia: la pantalla correspondiente.
- Configuración repartida en **cuatro pasos**: Planificación · Personaje · Estudiante · Configuración.
- Edición de un roleplay ya creado, reabriendo el mismo flujo con los datos cargados.
- Ficha del roleplay renderizada en Recursos, con resumen de una línea.

**Excluye:**
- **Generación de la configuración con IA.** Eso es [HU-LMS-024](HU-roleplay-mlp.md).
- Experiencia del colaborador: la llamada, la transcripción y la calificación. Se define aparte.
- Reutilización de personajes entre roleplays: cada roleplay define el suyo.
- Adjuntar archivos de contexto para el personaje.

## Reglas de Negocio

> **Decisiones de sesión sobre Jira:** las reglas RN-05, RN-06, RN-08 y RN-09 salen de la sesión «Roleplay — Definición y alcance» (21-sep-2026) y **prevalecen sobre la redacción actual del épico PL-6286**. Están pendientes de que el PM las refleje en Jira.

- **RN-00:** **El recurso empieza en un modal**, igual que Video y Presentación interactiva: ahí va el setup —la idea para la IA, el modo, la duración y la voz— y se decide por dónde seguir. Dos salidas, y las dos llevan al mismo paso a paso: **«Generar con IA»**, que lo abre con la propuesta ya puesta, y **«Prefiero llenarlo yo»**, que lo abre vacío con lo poco que ya se eligió (modo, duración y voz). La primera propuesta no cuesta créditos; el modal no enseña el saldo porque ahí no se gasta.
- **RN-00a:** Cuando la configuración la propuso la IA, el paso a paso lo dice con una insignia **«Propuesto por IA»** junto al título. No es un modo distinto: todo queda editable igual que si se hubiera escrito a mano.
- **RN-00a-bis:** En el setup, **la idea no se marca como obligatoria**, al revés que en los setups de video y de presentación: aquí solo hace falta si se quiere la propuesta de la IA, y quien elige «Prefiero llenarlo yo» no la necesita. Lo que sí: sin idea, «Generar con IA» está deshabilitado. Y **la voz se elige exactamente como en «Video Avatar IA»**: un desplegable agrupado por país y, al lado, el botón «Escuchar» / «Detener» con su texto y del alto del desplegable. No un selector que abra otra ventana —dentro de un modal no se abre un modal— ni el botón de solo icono que se usa en las listas de voces: aquí la voz es el campo de la fila y el icono suelto no se lee como «escuchar».
- **RN-00b:** Ya no hay dos roleplays ni dos tarjetas en «Añadir página». **Editar** un roleplay, venga de donde venga, abre siempre el mismo paso a paso con sus datos.
- **RN-01:** El roleplay se guarda solo si están completos: título, escenario, nombre e identidad del personaje, personalidad, mensaje de bienvenida, papel del estudiante y al menos 3 objetivos.
- **RN-02:** Los objetivos de aprendizaje son **entre 3 y 5**. No se puede bajar de 3: al llegar al mínimo, el botón de eliminar sigue visible pero deshabilitado, explicando por qué.
- **RN-03:** Topes de caracteres: título 80 · escenario 2.000 · personalidad 400 · papel del estudiante 400 · mensaje de bienvenida 300 · objetivo 120 · nombre del personaje 80 · identidad del personaje 80. Alineados con el roleplay que Selección ya tiene en producción (TAL-974), que usa los mismos campos contra el mismo tipo de agente de voz.
- **RN-04:** El modo por defecto es **Evaluación** (el colaborador debe alcanzar el umbral de objetivos para avanzar), por ser el uso esperado. El modo Práctica permite avanzar siempre. El umbral de objetivos para aprobar solo aplica en modo Evaluación.
- **RN-05:** El **mensaje de bienvenida es una propiedad general del roleplay**, no del personaje *(sesión 02:18:18 → 02:19:20; Jira lo ubica dentro de «Rol evaluador»)*.
- **RN-06:** **No hay archivos adjuntos** de contexto para el personaje *(sesión 00:38:24)*.
- **RN-07:** La imagen del personaje es opcional. Si Ana no sube ninguna, se muestra **el orbe de voz**, el mismo que lleva la tarjeta del Evaluador roleplay en «Añadir página» (Dave, 13-oct). No el orbe del agente: el de la chispa dice «esto lo hace la IA», que vale para cualquier recurso, mientras que el de la onda dice **que aquí se habla**, que es de lo que va este. Así el recurso se reconoce igual desde que se elige hasta que se contesta.
- **RN-08:** El personaje **no es una entidad reutilizable**: sus datos viven dentro de cada roleplay y no se comparten entre recursos *(sesión 01:34:49)*.
- **RN-09:** Cada intento **exitoso** consume 150 créditos. Los intentos que fallan por problemas técnicos no se cobran *(sesión 01:05:31)*.
- **RN-10:** El modo texto viene habilitado. Si el colaborador no tiene micrófono, puede responder por escrito; si Ana lo deshabilita y falla el audio o se acaban los créditos, el colaborador no podrá continuar.
- **RN-11:** Ana no puede avanzar al siguiente paso si el actual tiene campos pendientes. Puede volver a cualquier paso anterior sin perder lo escrito. Un paso que dejó incompleto queda marcado en el indicador de pasos.
- **RN-11a:** **Salir no pregunta.** «Salir de la edición» vuelve directo a la página que se estaba editando, sin ventana de confirmación, aunque haya cambios sin guardar: la única ventana de salida del LMS Creator es la de Crear contenido (jefe de Dave, 13-oct).
- **RN-11b:** **Creando, se sale por la X en círculo de la cabecera**, como en las demás experiencias inmersivas, y vuelve al selector de «Añadir página»; editando, la salida es «Salir de la edición» (jefe de Dave, 14-oct).
- **RN-12:** Editar un roleplay **no es retroactivo**: los colaboradores que ya lo completaron conservan su resultado con la configuración vigente al momento de su intento *(sesión 00:15:52)*.

## Criterios de Aceptación

**Escenario: El setup con IA**

**Dado** que Ana elige Evaluador roleplay en «Añadir página»
**Cuando** describe en una frase qué quiere que practiquen y pulsa «Generar con IA»
**Entonces** se abre el paso a paso con el escenario, el personaje y los objetivos ya redactados
**Y** el título lleva la insignia «Propuesto por IA»
**Y** puede cambiar cualquier campo antes de guardar

**Escenario: Llenarlo a mano**

**Dado** que Ana elige Evaluador roleplay en «Añadir página»
**Cuando** pulsa «Prefiero llenarlo yo»
**Entonces** se abre el mismo paso a paso, vacío
**Y** conserva el modo, la duración y la voz que eligió en el setup

**Escenario: Camino feliz — crear un roleplay paso a paso**

**Dado** que Ana está creando un contenido y abre «Añadir página»
**Cuando** elige «Evaluador roleplay (MVP)», completa los cuatro pasos y guarda
**Entonces** nace la página con la ficha del roleplay en Recursos
**Y** la ficha muestra el personaje, el escenario, los objetivos y el resumen de modo, duración e intentos

**Escenario: Caso borde — intentar bajar de 3 objetivos**

**Dado** que Ana está en el paso Estudiante con exactamente 3 objetivos
**Cuando** mira los botones de eliminar de cada objetivo
**Entonces** los ve deshabilitados, no ocultos
**Y** al pasar el cursor se le explica que se necesitan al menos 3 objetivos

**Escenario: Caso borde — volver a un paso anterior**

**Dado** que Ana llenó Planificación y avanzó a Personaje
**Cuando** vuelve al paso anterior
**Entonces** encuentra el título y el escenario tal como los dejó
**Y** puede avanzar de nuevo sin volver a escribirlos

**Escenario: Error — avanzar con campos pendientes**

**Dado** que Ana está en el paso Planificación sin escribir el escenario
**Cuando** hace clic en «Siguiente»
**Entonces** permanece en el paso
**Y** ve marcados los campos que faltan y un aviso que le pide completarlos

**Escenario: Error — salir del flujo sin querer**

**Dado** que Ana abrió el roleplay por error desde «Añadir página»
**Cuando** usa la X en círculo del encabezado
**Entonces** regresa al selector de tipo de recurso
**Y** no se crea ninguna página

**Escenario: Editar un roleplay ya creado**

**Dado** que Ana tiene un Evaluador roleplay guardado en Recursos
**Cuando** hace clic en «Editar roleplay»
**Entonces** se reabre el flujo por pasos con la configuración actual cargada
**Y** al guardar se actualiza la página existente en vez de crearse una nueva
