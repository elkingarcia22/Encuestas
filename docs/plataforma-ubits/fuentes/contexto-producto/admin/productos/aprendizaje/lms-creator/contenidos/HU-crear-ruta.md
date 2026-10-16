# HU: Crear ruta de aprendizaje

## Contexto

Además de contenidos sueltos, las empresas arman rutas (secuencias de contenidos) para recorridos formativos. Un flujo de creación propio reduce el tiempo para publicar una ruta usable en catálogo y planes. Meta: publicar una ruta con al menos 1 contenido ordenado sin salir de LMS Creator.

## Historia de Usuario

**Como** creador de contenidos LMS,
**quiero** crear una ruta de aprendizaje con contenidos ordenados,
**para** ofrecer un recorrido formativo coherente a los colaboradores.

## Alcance

**Incluye:**
- Experiencia de creación de ruta: **el mismo asistente de cuatro pasos que Crear contenido** (HU-LMS-001), con la clase «ruta».
- Selección y ordenamiento de contenidos (paso 2).
- Guardado de la ruta con el orden definido.

**Excluye:**
- Experiencia / home de la ruta del colaborador (ver HU-APR-008).
- Tipo de navegación de la ruta (ver HU-LMS-014).
- Edición avanzada de rutas ya publicadas fuera de este flujo.

## Reglas de Negocio

- **RN-01:** Una ruta contiene uno o más contenidos en un orden definido.
- **RN-02:** No se puede guardar como ruta válida sin al menos 1 contenido.
- **RN-03:** El orden de los contenidos es el orden de recorrido esperado.

### El asistente (los cuatro pasos)

- **RN-04:** Crear ruta usa **el mismo asistente de cuatro pasos** que Crear contenido y Crear evento —Información básica, Contenidos, Certificado y Ajustes—, con el mismo marco, el mismo autoguardado desde el paso 1 y la misma salida. No es un flujo aparte: es una clase más del mismo asistente.
- **RN-05:** El paso 2 se llama **Contenidos** (no Recursos): una ruta no arma páginas, elige contenidos que ya existen en el catálogo.
- **RN-06:** El paso 4 · Ajustes muestra **solo Visibilidad y Tipo de navegación**, sin pesos de evaluación: una ruta no tiene evaluaciones propias que pesar (HU-LMS-014 · RN-03).

### La ficha de la ruta (paso 1)

- **RN-07:** La ruta **no elige tipo de contenido**: va implícito, igual que en un evento (HU-LMS-020).
- **RN-08:** La ruta **no escribe su duración**: es la **suma de los contenidos** que lleva dentro, y se muestra calculada en el paso 1. Pedirla a mano sería pedir un dato que el sistema ya sabe y que se desactualiza al cambiar la lista.
- **RN-09:** La **categoría es opcional**, como en contenido y en evento.

### De dónde salen los contenidos

- **RN-10:** Una ruta se arma con **las dos fuentes**: los contenidos que creó la empresa y los del **catálogo de UBITS**. En el LMS de hoy el catálogo de UBITS es la mayor parte de lo disponible, así que una ruta que solo pudiera usar contenido propio sería casi inservible.
- **RN-10a:** El **origen** —«De mi empresa» o «UBITS»— es un **filtro de primera clase** y va **etiquetado en cada contenido**, en insignia en las dos columnas para que se lean parejas,, en el selector y en la lista de la ruta. Es lo primero que pregunta quien arma una ruta.
- **RN-10b:** El panel para elegir es un **drawer mediano** —no uno a casi toda la pantalla— y es **solo tabla**, con buscador, selección por casillas, «Seleccionados (N)» para repasar solo lo elegido, y paginación. Los filtros —**origen**, tipo, competencia o categoría, habilidad, aliado, nivel, idioma y nivel de inglés— van **por columna**, en el embudo de cada encabezado: dentro de un panel no se abre un modal de filtros, porque modal sobre drawer es mala práctica.
- **RN-10g:** La tabla tiene **once columnas**, en este orden, y **solo las tres primeras empiezan encendidas** —las otras ocho se encienden desde el menú de columnas—. «Contenido» no se puede ocultar. Hasta el 6-oct arrancaban cinco y la tabla pedía todo el ancho de la pantalla; lo que se busca aquí casi siempre se reconoce por la portada y el nombre.

  | # | Columna | De entrada |
  |---|---------|------------|
  | 1 | Contenido (con su estado debajo del título) | Visible · fija |
  | 2 | Origen | Visible |
  | 3 | Tipo de contenido | Visible |
  | 4 | Competencia / Categoría | Oculta |
  | 5 | Habilidad | Oculta |
  | 6 | Aliado | Oculta |
  | 7 | Nivel | Oculta |
  | 8 | Duración | Oculta |
  | 9 | Idioma | Oculta |
  | 10 | Expertos | Oculta |
  | 11 | Nivel de inglés | Oculta |

- **RN-10g-bis:** En ese ancho el **título va a dos líneas** y se corta ahí si no cabe, con la portada al lado. La tabla no lleva scroll horizontal con las tres columnas de entrada; si se encienden más, aparece, y eso es decisión de quien las encendió (Dave, 6-oct).
- **RN-10h:** Lo que **no corresponde** a una fila dice **«No aplica»** en texto apagado, no se deja en blanco: habilidad, aliado, expertos y nivel de inglés no existen en un contenido que creó la empresa, y el nivel de inglés tampoco en uno que no esté en inglés.
- **RN-10i:** En la lista de la ruta, cada contenido es **una sola pieza**: el asidero de arrastre, el **número del escalón** y el menú de tres puntos van **dentro** de la tarjeta, no sueltos a los lados. Hasta el 5-oct el asidero y el menú iban fuera haciendo pareja; metidos dentro, la fila se lee como una tarjeta y no como una tarjeta con controles pegados.
- **RN-10j:** El menú de tres puntos de cada contenido ofrece **«Mover arriba»**, **«Mover abajo»** y «Quitar de la ruta», igual que el menú de una página en el índice de Crear contenido. Las dos primeras solo aparecen cuando hay a dónde moverse. Mover de a un paso es la vía de teclado y la que no depende del pulso: arrastrar sigue estando para el resto.
- **RN-10k:** **Quitar un contenido de la ruta pregunta antes.** Al elegir «Quitar de la ruta» se abre un diálogo de confirmación que nombra el contenido y aclara que **sigue en el catálogo** y se puede volver a agregar: lo que se deshace es su lugar en el recorrido, no el contenido. El título nombra el contenido —«¿Quitar «X» de la ruta?»— y la acción se confirma con **«Quitar de la ruta»**, pintada como destructiva.
- **RN-10l:** El **número del escalón** va **centrado** en su hueco, no alineado a la derecha. Con un solo dígito, alineado a la derecha quedaba pegado a la portada y dejaba un claro junto al asidero; con dos dígitos se veía equilibrado. Centrado, el hueco se reparte igual tenga uno o dos (Dave, 5-oct).
- **RN-10f:** El panel para elegir tiene **su propia dirección**, `#contenidos/agregar`, para poder enlazar o compartir esa pantalla. Abrirlo y cerrarlo la escribe, y entrar por ella lo abre.
- **RN-10c:** Los contenidos de UBITS **no tienen visibilidad**: ya vienen publicados, así que esa etiqueta solo la llevan los de la empresa.
- **RN-10e:** La **categoría** del catálogo de la empresa y la **competencia** del de UBITS son lo mismo a la hora de buscar: **van en la misma columna**, bajo el título del contenido, y bajo un mismo filtro («Categoría o competencia»). La categoría la crea cada empresa; la competencia viene del catálogo de UBITS. Dejar ese dato vacío para los de UBITS escondía lo único que dice de qué trata cada contenido.

### Qué contenidos de la empresa se pueden agregar

- **RN-11b:** Solo se pueden agregar contenidos de la empresa **publicados** o **privados**.
- **RN-11:** Un contenido en **borrador** no se puede agregar: todavía no existe para nadie y dejaría un escalón vacío en el recorrido.
- **RN-12:** Un contenido **oculto** no se puede agregar: estar oculto significa que no se encuentra solo y se asigna a dedo, y meterlo en una ruta sería publicarlo por la puerta de atrás. *(Pendiente de confirmar con Dave; su lectura inicial fue «creo que son solo público y privado».)*
- **RN-13:** Un contenido **privado** dentro de una ruta conserva su etiqueta en la lista y en el selector, para que quien arma la ruta vea que ese escalón **no le llega a todo el mundo**. *(Sin definir: qué ve exactamente un colaborador que no está en la lista de ese contenido privado cuando la ruta sí es pública.)*
- **RN-14:** Un contenido que ya está en la ruta se ve marcado y apagado en el selector: no se puede agregar dos veces.

## Criterios de Aceptación

**Escenario: Camino feliz — ruta con dos contenidos**

**Dado** que Ana abre Crear ruta
**Cuando** agrega “Onboarding comercial Q3” y luego “Feedback efectivo”, en ese orden, y guarda
**Entonces** la ruta queda creada con esos dos contenidos en ese orden

**Escenario: Caso borde — reordenar**

**Dado** que la ruta tiene “Onboarding comercial Q3” y luego “Feedback efectivo”
**Cuando** Ana mueve “Feedback efectivo” antes de “Onboarding comercial Q3” y guarda
**Entonces** el orden persistido es “Feedback efectivo” y luego “Onboarding comercial Q3”

**Escenario: Camino negativo — ruta vacía**

**Dado** que Ana está en Crear ruta sin contenidos
**Cuando** intenta guardar
**Entonces** la acción no se completa
**Y** se indica que falta al menos un contenido

**Escenario: La duración se calcula sola**

**Dado** que Ana está en el paso 1 y la ruta no tiene contenidos
**Cuando** mira la ficha técnica
**Entonces** donde iría el tiempo dice que se calcula con los contenidos del paso 2
**Y** al agregar un contenido de 30 minutos y otro de 1 hora, la ficha dice «1,5 horas»

**Escenario: Un borrador no se puede agregar**

**Dado** que Ana abre «Agregar contenidos»
**Cuando** busca un contenido que está en borrador
**Entonces** no aparece en la lista
**Y** sí aparecen los publicados y los privados

**Escenario: Ajustes sin pesos**

**Dado** que Ana llega al paso 4 de una ruta
**Cuando** ve el paso
**Entonces** ve Visibilidad y Tipo de navegación
**Y** no ve Pesos de evaluación
