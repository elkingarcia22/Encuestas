# HU: Listado de contenidos LMS Creator

## Contexto

Los creadores necesitan encontrar rápido un contenido entre decenas del catálogo de mi empresa/UBITS para editarlo o crear uno nuevo. Un listado con búsqueda, filtros y estados de visibilidad reduce el tiempo de localización y los errores de abrir el flujo incorrecto (borrador vs publicado).

## Historia de Usuario

**Como** creador de contenidos LMS,
**quiero** buscar, filtrar y abrir contenidos desde un listado con estados de visibilidad,
**para** continuar borradores o editar publicados sin perder tiempo.

## Pantallas en el prototipo

Cada pantalla del flujo tiene su dirección en el playground UX (en local, `http://localhost:5173` + la dirección). Si se abre directo con el borrador vacío, carga el curso de ejemplo «Resolución efectiva de conflictos en equipos de trabajo» para seguir el flujo desde ahí.

| Pantalla | Dirección | Qué se ve |
|---|---|---|
| Listado de contenidos | [`/admin/aprendizaje/lms-creator/contenidos`](http://localhost:5173/admin/aprendizaje/lms-creator/contenidos) | Lista y cuadrícula; tras crear un contenido, su tarjeta sale de primera |
| Listado en vista de tabla | [`/admin/aprendizaje/lms-creator/contenidos#tabla`](http://localhost:5173/admin/aprendizaje/lms-creator/contenidos#tabla) | La misma lista con la tabla en vez de la cuadrícula; la dirección se puede compartir |
| Catálogo vacío (primera vez) | [`?demo=vacio`](http://localhost:5173/admin/aprendizaje/lms-creator/contenidos?demo=vacio) | Empresa que estrena el módulo: solo «Crea algo nuevo» y el estado vacío |

## Alcance

**Incluye:**
- Listado en tabla y/o cuadrícula, con las columnas y los filtros que se detallan abajo.
- Búsqueda en la barra y filtros en modal (botón Filtrar con conteo de criterios).
- Empty state sin resultados con limpiar búsqueda.
- Navegación según visibilidad (crear prellenado vs editar vs solo lectura).
- Entrada a Crear contenido, Crear ruta de aprendizaje y Crear evento, tanto por el botón primario como por la sección «Crea algo nuevo» de arriba.
- Cifras del catálogo y franja de «cosas que necesitan tu atención».

**Excluye:**
- El asistente completo de creación (HU-LMS-001).
- Lógica interna de planes.

## Reglas de Negocio

- **RN-01:** Borrador abre el asistente de creación prellenado; Público/Privado/Oculto abre el editor; Archivado abre editor en solo lectura.
- **RN-01a:** En la vista de tabla, el **título va en azul y subrayado al pasar por encima solo cuando la fila lleva a algún lado**; el resto se queda en texto normal. Es el criterio de Vacantes, donde el título es enlace únicamente si la fila tiene detalle: un enlace azul que no abre nada es una promesa falsa. Hoy eso significa que **solo los borradores van en azul**, porque el editor del contenido —a donde irían publicados, privados, ocultos y archivados— todavía no está maquetado. Cuando exista, pasan a azul también (Dave, 6-oct).
- **RN-01b:** Abrir un **borrador** lleva al asistente **con la ficha ya puesta**: título, portada, descripción, tipo, nivel, idioma y duración. Es lo que hace el playground React, que manda los borradores a `crear-contenido` con el id y los demás a un editor aparte. Las páginas no se recuperan: en la lista no viajan.
- **RN-02:** Tras crear o editar y volver, el ítem afectado queda primero (pin) en el listado.
- **RN-03:** Sin resultados de búsqueda/filtros se usa el estado **«Sin resultados»** del design system (Estados › Estados vacíos): icono de lupa tachada, y un texto que **dice qué dejó fuera la lista** en vez de un aviso genérico.
  - Con búsqueda: «Sin resultados para «<lo buscado>»». Con solo filtros: «Sin resultados con estos filtros».
  - La descripción invita a revisar la ortografía y, si hay filtros puestos, dice cuántos son.
  - La acción nombra lo que va a quitar: **Limpiar búsqueda**, **Limpiar filtros** o **Limpiar búsqueda y filtros**.
- **RN-04:** El badge del botón Filtrar cuenta criterios activos, no filas.
- **RN-05:** El contador del toolbar nombra el tipo de ítem (`contenidos`), no “resultados”.
- **RN-05a:** El cambio entre **Tabla** y **Cuadrícula** va en **pestañas subrayadas, solo con texto**, las mismas de toda la plataforma; ya no es un grupo de botones con icono. Es el mismo control en Universidad corporativa y Zona de estudio (jefe de Dave, 13-oct).
- **RN-06:** El botón primario «Crear contenido» abre un menú con **Contenido**, **Ruta de aprendizaje** y **Evento** (HU-LMS-001, HU-LMS-008, HU-LMS-020). Se llama «Contenido», no «Curso»: curso es uno de los tipos que se eligen dentro del asistente, no lo que se crea aquí.
- **RN-06a:** Lo primero de la pantalla es la sección **«Crea algo nuevo»**, con las mismas tres opciones en tarjetas (ilustración, nombre y una línea de qué es cada una). Es el mismo marco que «Empieza con una plantilla» de Vacantes. Las tarjetas y el menú salen de la misma lista, así que dicen siempre lo mismo.
- **RN-06b:** Ruta de aprendizaje todavía no tiene asistente: al elegirla —en la tarjeta o en el menú— sale un aviso y la pantalla se queda donde está.
- **RN-06c:** Debajo van las cifras del catálogo: **Almacenamiento**, **Publicados**, **Privados** y **En borrador**. Almacenamiento va **de primero** y dice cuánto del plan contratado lleva gastado la empresa con lo que ha subido —videos, PDF, SCORM—; el catálogo de UBITS no cuenta, que no vive en su espacio. Hubo una **Finalización media** y, un rato, un contador de **Rutas de aprendizaje**; las dos se quitaron el 6-oct: la primera habla de consumo, que es asunto de Reportes, y la segunda no era lo que hacía falta ver aquí (Dave, 6-oct).
- **RN-06c-i:** Cada cifra lleva **una sola figura**, nunca dos. **Almacenamiento** usa el **anillo de avance** —el mismo de «Días abiertas en promedio» del home de Vacantes: el círculo entero es el total contratado y el relleno, lo gastado—, porque lo que importa es cuánto queda para el techo. **Publicados**, **Privados** y **En borrador** llevan su **anillo segmentado**, que es el que habla de partes de un total. La figura va **siempre en la esquina derecha**, como en el home de Vacantes y el pulso de Encuestas.
- **RN-06c-ii:** La fila de cifras se reacomoda por ancho: **una por línea en el celular**, **dos en tableta** y todas en fila con divisores en escritorio. En el celular nunca se reparten el ancho entre todas: los nombres y las cifras se cortaban.
- **RN-06d:** Después, la franja de **cosas que necesitan tu atención**, plegada por defecto: estudiantes bloqueados por agotar intentos y contenidos que llevan más de 7 días en borrador.
- **RN-06e:** El listado abre en **cuadrícula**; lista y cuadrícula comparten búsqueda y filtros.
- **RN-07:** La vista de lista muestra seis columnas, en este orden: **Nombre del contenido**, **Tipo**, **Creación**, **Nivel**, **Visibilidad** y **Acciones**. Ver «Columnas de la vista de lista».
- **RN-08:** Los filtros viven en un **modal**, no en un menú desplegable, con cinco criterios de selección única: **Tipo de contenido**, **Categoría**, **Nivel**, **Idioma** y **Visibilidad**. Ver «Campos del modal de filtros».
- **RN-08a:** **Se filtra solo desde «Filtrar».** La tabla **no lleva embudos por columna**: todos los criterios ya están
  juntos en ese botón, y repetirlos columna por columna era ofrecer dos veces lo mismo. Hasta el 7-oct, Tipo, Nivel y
  Visibilidad tenían su propio embudo.
- **RN-08b:** **Lo único que se ordena es «Creación».** Un clic deja primero los más viejos, otro los más nuevos y el
  tercero lo quita. Nombre, Tipo, Nivel y Visibilidad no se ordenan: no responden a ninguna pregunta que alguien se haga
  en esta pantalla. Otras tablas del admin —Planes de formación, por ejemplo— sí ordenan por todas sus columnas; aquí no
  hace falta (Dave, 7-oct).
- **RN-09:** Lo que se marca en el modal no filtra hasta pulsar **Aplicar**; cerrar sin aplicar deja el listado como estaba. **Borrar filtros** limpia los cuatro criterios de una vez.
- **RN-10:** Lo aplicado se lee **en el propio botón Filtrar**, con el conteo de criterios (RN-04); no hay franja de «Filtros aplicados» bajo la barra. Se quitan desde el modal, con **Borrar filtros**. Es el patrón de Vacantes: el estado del filtro se ve donde se activa, no en una sección aparte.
- **RN-11:** Con el catálogo **vacío de verdad** (la empresa todavía no creó nada) se usa el estado **«Primera vez»** del design system (Estados › Estados vacíos), no el de «Sin resultados»: icono, «Todavía no hay contenidos», una línea de qué va a aparecer y el botón **Crear contenido**. Se esconde todo lo que no tiene sobre qué actuar: las cifras, la franja de atención y **la barra de la lista entera** (buscar, filtrar, cambiar de vista y el contador «0 de 0»). Queda «Crea algo nuevo», que es la invitación. Se enseña con `?demo=vacio`.

## Columnas de la vista de lista

| # | Columna | Contenido | Alineación |
|---|---------|-----------|------------|
| 1 | Nombre del contenido | Título, con un icono según el tipo y la duración debajo | Izquierda |
| 2 | Tipo | Curso, Ruta de aprendizaje, Evento, Podcast… (el tipo del contenido, no lo que se crea) | Centro |
| 3 | Creación | Fecha en que se creó el contenido | Centro |
| 4 | Nivel | Básico, Intermedio o Avanzado | Centro |
| 5 | Visibilidad | Estado en el LMS, como etiqueta de color | Centro |
| 6 | Acciones | Menú con **Editar**, **Duplicar** y **Eliminar** (destructiva, separada del resto) | Centro |

La fila entera abre el contenido según RN-01. El menú de acciones no abre la fila.

## Campos del modal de filtros

Los cuatro son de **selección única** y traen una opción inicial que equivale a no filtrar.

| Campo | Opción sin filtrar | Opciones |
|-------|--------------------|----------|
| Tipo de contenido | Todos los tipos | Los del maestro de tipos: Curso, Short, Charla, Artículo, Podcast, Libro, Ideas de libro, Caso de estudio, Documento técnico, Ejercicios de práctica, Ruta de aprendizaje, Programa |
| Categoría | Todas las categorías | Las categorías con que la empresa organiza su universidad corporativa |
| Nivel | Todos los niveles | Básico, Intermedio, Avanzado |
| Idioma | Todos los idiomas | Español, Inglés, Portugués |
| Visibilidad | Todas las visibilidades | Publicado, Privado, Borrador, Oculto, Archivado |

Al pie del modal: **Borrar filtros** a la izquierda y **Aplicar** a la derecha.

La búsqueda es aparte del modal y va en la barra de la lista; busca por nombre, tipo, nivel, visibilidad, categoría e idioma, sin distinguir tildes.

## Criterios de Aceptación

**Escenario: Camino feliz — abrir contenido público**

**Dado** que el listado muestra “Onboarding comercial Q3” con visibilidad Pública
**Cuando** Ana lo abre
**Entonces** entra al editor de contenido publicado

**Escenario: Caso borde — empty state**

**Dado** que Ana busca un término que no coincide con ningún contenido
**Cuando** se aplican los resultados
**Entonces** ve “No se encontraron resultados”
**Y** puede pulsar Limpiar búsqueda para restablecer el listado

**Escenario: Camino feliz — abrir Crear evento**

**Dado** que Ana está en el listado de contenidos
**Cuando** abre el menú del botón Crear contenido y elige Crear evento
**Entonces** entra al asistente Crear evento (HU-LMS-020)
**Y** no entra a Crear contenido ni a Crear ruta

**Escenario: Camino negativo — borrador no abre editor de publicado**

**Dado** que existe un contenido en Borrador
**Cuando** Ana lo abre desde el listado
**Entonces** entra al asistente de creación prellenado
**Y** no al editor de Impacto / Resultados de publicado

## Varios catálogos (RN-12)

- **RN-12:** Una empresa puede tener **más de un catálogo de contenido**. Cuando los tiene, a la **izquierda del
  botón «Crear contenido»** sale un selector, y todo el listado —las tarjetas, la tabla, el buscador, los filtros y
  las cifras de arriba— pasa a ser **el del catálogo elegido**. Con **un solo catálogo no se muestra nada**, que es
  lo que ve hoy prácticamente todo cliente: no hay nada que elegir.
- **RN-12a:** El catálogo elegido **nace en el primero** de la empresa. Al cambiar de empresa se vuelve al primero
  suyo y el listado se va a la página 1, porque el que estaba elegido ya no existe.
- **RN-12b:** El caso que existe hoy es el de **UBITS**, que usa su propio producto y maneja dos LMS:
  - **Catálogo UBITS** — los contenidos que UBITS le vende a sus clientes: los mismos del catálogo comercial que
    ya se pueden meter en una ruta. No llevan visibilidad —vienen publicados, no los creó la empresa— y se
    clasifican por **competencia** en vez de por categoría.
  - **Ubits College** — la formación interna de su propio equipo (onboarding, cómo se vende, seguridad de la
    información, código de conducta), que no sale para afuera. Es el contenido que **creó la propia empresa**.

  Mañana otra empresa puede partir el suyo como quiera —por país, por marca, por filial—; el selector no asume
  ningún criterio, solo lista los que haya.
- **RN-12c:** **No confundirlo con la Universidad corporativa**, que es otra cosa: el espacio donde la empresa
  personaliza cómo se le presenta la formación a sus colaboradores. El catálogo es **de dónde sale** el contenido;
  la universidad corporativa es **el escaparate**.
- **RN-12d:** En el prototipo, UBITS es **una empresa más del menú de la cuenta**, al lado de Meta Colombia. Se
  entra a ella para ver el caso; Meta Colombia sigue siendo la de por defecto y no muestra selector. El Catálogo
  UBITS son los 85 del catálogo comercial; Ubits College son 34: ocho escritos para el caso —onboarding, cómo
  vendemos, rituales de equipo— delante del contenido corporativo que ya tenía el playground. Las portadas se
  reusan del banco de imágenes (Dave, 6-oct).
- **RN-12e:** El catálogo comercial **no guarda la fecha de publicación** de cada contenido, y la pantalla sí la
  usa —en la columna «Creación» y para estimar el consumo, que cuenta los meses que lleva publicado—. En el
  prototipo se deriva del identificador, repartida entre 2023 y hoy: el mismo contenido da siempre la misma fecha,
  así las cifras no bailan entre recargas.
