# HU: Presentación interactiva (studio V2)

## Contexto

El studio de diapositivas (antes tab «SCORM con IA V2») es un tipo de recurso propio: **Presentación interactiva**. El modal SCORM es **solo Subir .zip** (sin IA).

## Historia de Usuario

**Como** creadora de contenidos LMS,
**quiero** añadir una Presentación interactiva con idea, contexto y un editor de diapositivas comparable al de video,
**para** armar el módulo antes de generarlo sin mezclarlo con la carga de paquetes SCORM.

## Pantallas en el prototipo

Cada pantalla del flujo tiene su dirección en el playground UX (en local, `http://localhost:5173` + la dirección). Si se abre directo con el borrador vacío, carga el curso de ejemplo «Resolución efectiva de conflictos en equipos de trabajo» para seguir el flujo desde ahí.

| Pantalla | Dirección | Qué se ve |
|---|---|---|
| Setup de la presentación | [`/admin/aprendizaje/lms-creator/agregar-presentacion-interactiva`](http://localhost:5173/admin/aprendizaje/lms-creator/agregar-presentacion-interactiva) | Idea, contexto, objetivo, estilo, color y logo |
| Editor de la presentación | [`/admin/aprendizaje/lms-creator/agregar-presentacion-interactiva/editor`](http://localhost:5173/admin/aprendizaje/lms-creator/agregar-presentacion-interactiva/editor) | Solo con una presentación estructurada; si no, vuelve al setup |

## Alcance

**Incluye:**
- Tipo de recurso **Presentación interactiva** (badge IA) en Resources card, Añadir página y ResourcesBlock.
- Pasos separados con paridad Video con IA: el **setup** va en modal a pantalla completa y el **editor sí es pantalla completa de verdad**, porque es un lienzo de edición (ver HU-LMS-001 · RN-04a).
- Flujo: setup (idea + contexto) → Preparar diapositivas → editor studio → Generar presentación.
- Título vacío por defecto: `Presentación interactiva`.
- Modal **Agregar SCORM**: solo **Subir .zip** (sin pestañas ni IA).

**Excluye:**
- Generación real por modelo (sigue mock / pool demo).

## Reglas de Negocio

> **Tokens (prototipo):** Los montos de tokens que aparecen en este flujo (p. ej. **300** al preparar diapositivas, **50** al regenerar una diapo, generar presentación gratis) son **valores provisionales del playground**. **No son oficiales ni definidos para producto.** Queda **pendiente de definición por la PM Mafe Ramírez**. Hasta entonces, el prototipo solo ilustra la UX de cobro / confirmación.

- **RN-01:** En Presentación interactiva no existe el campo «Título de la presentación» en el setup. Si Ana escribió un título en «Añadir página», ese texto se muestra en el header del editor. Si lo dejó vacío, el editor sugiere a partir de la idea; si no hay idea usable, la página se llama `Presentación interactiva`.
- **RN-02:** La Idea es obligatoria. El Contexto usa el mismo patrón que Video con IA.
- **RN-03:** «Preparar diapositivas» usa IA button y, en el prototipo, **descuenta tokens en el setup** (animación del badge) y **solo después** navega al editor (paridad Continuar del Video con IA; monto provisional — ver nota Tokens). «Generar presentación» es **gratis**: pide confirmación en un modal (paridad Generar video) y no descuenta tokens.
- **RN-04:** El modal SCORM es solo Subir .zip (sin IA). La generación con IA es Presentación interactiva.
- **RN-05:** La presentación renderizada usa la misma superficie SCORM en Recursos (variante scorm-ia-rendered).
- **RN-06:** El botón «Editar presentación» reabre el editor de diapositivas (`/agregar-presentacion-interactiva/editor`) con las diapositivas ya generadas. No abre el lightbox de edición SCORM.
- **RN-07:** Tras «Preparar diapositivas», el editor muestra el loader oficial de IA en cada miniatura y en la vista previa mientras se genera el contenido (cola secuencial de arriba hacia abajo). Ana puede quedarse en una diapositiva ya lista y usarla con normalidad (editar, regenerar, mover, etc.). Solo «Generar presentación» permanece deshabilitado hasta que todas estén listas. Al editar una presentación ya renderizada no se vuelve a mostrar esa generación.
- **RN-08:** En la vista previa del editor, «Regenerar» es un **IA button secondary** (junto al tipo de diapositiva) y abre el mismo modal IA de regenerar media del editor de video. En el prototipo descuenta tokens por diapositiva (monto provisional — ver nota Tokens).
- **RN-09:** En el inspector de tipo, Ana puede cambiar cualquier diapositiva (incluida la portada) a otro tipo. «Añadir diapositiva» no ofrece Portada como opción nueva (sigue disponible al cambiar tipo). Se puede eliminar cualquier diapositiva mientras quede al menos una.
- **RN-10:** En portada (`intro`) y sección (`section`), el texto sobre el fondo de marca va en blanco (o blanco translúcido). No se usa el gris de cuerpo (`--ts`) ni el acento de marca sobre ese mismo azul.
- **RN-11:** **Las tarjetas giran de verdad.** En el editor y en la vista del colaborador, una tarjeta se voltea sobre su eje —no se le cambia el contenido de golpe—, **mide lo mismo por las dos caras** (el alto lo manda la cuadrícula, no el largo del texto) y el **reverso lleva otro fondo**, el acento suave, para ver de un vistazo cuál ya se volteó. La perspectiva va en cada tarjeta, no en la cuadrícula: puesta en el contenedor, las de los lados se proyectan torcidas y cambian de tamaño al girar. El frente invita con «Toca para ver la respuesta». Editando, el clic sobre el texto es para escribir y no voltea la tarjeta (Dave, 7-oct).
- **RN-11a:** El relleno de la plantilla **nombra lo que va en cada cara** —delante «Concepto o término», detrás «Definición o respuesta de la tarjeta»—. Decía «Título de la diapositiva» en las seis caras: ni era un título de diapositiva ni ayudaba a saber qué escribir (Dave, 7-oct).
- **RN-12:** **El quiz no retiene a nadie.** No es una evaluación: no aprueba ni reprueba, no bloquea el avance y no condiciona nada del contenido. Se responde, se ve el resultado y se sigue con la navegación de la presentación —o se repite—. El cierre lo dice con todas sus letras: «Puedes repetir el quiz o seguir con la presentación: esto no te detiene».
- **RN-12a:** El cierre enseña la **puntuación en grande** (aciertos sobre total) con color según cómo fue —verde desde el 80 %, ámbar desde el 60 %, rojo por debajo—, el porcentaje y el botón «Repetir el quiz». Con 80 % o más sale **confeti**, el mismo del playground. Este cierre solo existe en la vista del colaborador: en el editor no hay recorrido que cerrar (RN-12b).
- **RN-12b:** **El creador no juega al quiz, lo escribe.** En el **editor** se ven **todas las preguntas a la vez**: cada una con «Pregunta N de M», su enunciado y sus opciones editables, y un punto que marca **cuál es la correcta**, visible sin abrir ningún panel. Cada pregunta se puede eliminar —mientras quede una— y al final está **«Nueva pregunta»**. Ahí no hay «Comprobar», ni veredicto, ni puntuación: eso es el recorrido del estudiante. La lista se desplaza dentro de la diapositiva, porque un quiz puede tener más preguntas de las que caben (Dave, 7-oct).
- **RN-12c:** En la **vista del colaborador** el quiz **usa todo el lienzo**: como solo se enseña una pregunta a la vez, va centrada y en grande, y las opciones son **tarjetas que se pueden tocar** con su letra (A, B, C), no un radio diminuto con la etiqueta al lado. Antes ocupaba media diapositiva con el texto pequeño arriba y un claro enorme debajo. El tamaño tiene tope: con una pregunta larga y sus opciones, nada puede pisar el título de la diapositiva ni el botón de comprobar; si no cabe, el bloque se desplaza por dentro (Dave, 7-oct).
- **RN-12d:** Al comprobar se marca **siempre la correcta** en verde y, en rojo, solo la que se eligió por error: así se aprende cuál era, no solo que se falló.
- **RN-13:** **Salir no pregunta.** La X en círculo de la cabecera del setup —como en las demás experiencias inmersivas (14-oct)— y «Salir de la edición» en el editor salen directo, sin ventana de confirmación: la única ventana de salida del LMS Creator es la de Crear contenido. En el setup lo escrito se pierde; en el editor no, porque se autoguarda y la presentación queda «Sin terminar» en Agregar presentación (jefe de Dave, 13-oct).

## Criterios de Aceptación

**Escenario: El quiz se escribe en el editor y se juega en la vista del colaborador**

**Dado** que Ana abre una diapositiva de tipo Quiz en el editor
**Cuando** mira la vista previa
**Entonces** ve todas las preguntas, con sus opciones y cuál es la correcta marcada
**Y** puede editar cualquier texto, cambiar la correcta, eliminar una pregunta y añadir otra
**Y** no aparecen «Comprobar», ni veredicto, ni puntuación
**Cuando** el colaborador llega a esa diapositiva en la vista del colaborador
**Entonces** ve una pregunta a la vez, la responde y al terminar ve su puntuación

**Escenario: Camino feliz — Presentación interactiva**

**Dado** que Ana elige Presentación interactiva en Añadir página
**Cuando** completa idea, prepara diapositivas y genera
**Entonces** nace la página con la presentación en Recursos
**Y** al preparar se descontaron tokens del prototipo (montos provisionales; definición pendiente PM)

**Escenario: Editar presentación ya renderizada**

**Dado** que Ana tiene una Presentación interactiva generada en Recursos
**Cuando** hace clic en «Editar presentación»
**Entonces** se abre el editor de diapositivas con el contenido actual
**Y** no se abre el lightbox legacy de SCORM

**Escenario: Loaders al preparar diapositivas**

**Dado** que Ana completa el setup y hace clic en «Preparar diapositivas»
**Cuando** entra al editor
**Entonces** ve el loader de IA en las miniaturas y en la vista previa mientras se generan
**Y** «Generar presentación» está deshabilitado hasta que todas estén listas

**Escenario: SCORM solo zip**

**Dado** que Ana abre Agregar SCORM
**Cuando** mira el modal
**Entonces** solo ve la carga de .zip (sin pestaña SCORM con IA)
