# HU: Consultar resultados del contenido (evaluaciones, intentos y descargas)

## Contexto

Publicar un contenido no basta: el creador necesita ver quién ya lo terminó, cómo le fue en las evaluaciones, desbloquear a quien agotó intentos y bajar reportes de evaluaciones o encuestas. Sin esa sección, el seguimiento se va a hojas sueltas y a tickets de “me quedé sin intentos”. Resultados concentra esa lectura (con datos que se refrescan cada 3 horas) sin mezclarla con la Experiencia de estudio ni con la página Progreso del colaborador.

## Historia de Usuario

**Como** creador de contenidos LMS,
**quiero** consultar en Editar contenido los resultados de inscritos, evaluaciones, bloqueos por intentos y reportes descargables,
**para** medir finalización, acompañar a quien falló o se bloqueó y exportar evidencia del periodo.

## Alcance

**Incluye:**
- Sección **Resultados** de Editar contenido (contenido publicado): título, descripción, filtro de periodo, inscritos, fecha de publicación y KPI de **Finalización**.
- Cuatro tabs: **Progreso**, **Evaluaciones**, **Gestión de intentos**, **Descargas**.
- Tab Evaluaciones: nota por evaluación, estado (Aprobado / Reprobado / Pendiente), final ponderada, modal **Detalles de evaluación** y descarga CSV.
- Tab Gestión de intentos: lista de bloqueados, desbloqueo de 1 o varios (confirma e otorga 1 intento más) y descarga CSV.
- Tab Descargas: un reporte por evaluación o encuesta del contenido, con número de participantes.

**Excluye:**
- Detalle de páginas recorridas al clic en una fila de Progreso (HU-LMS-012).
- Armado de la evaluación como recurso (HU-LMS-010).
- Experiencia de estudio al responder (HU-APR-004).
- Página Progreso del colaborador / vista líder (HU-APR-006).
- Descarga masiva de certificados (HU-LMS-007).
- Formato interno del archivo de reporte o del CSV (fuera de la UI).

## Reglas de Negocio

- **RN-01:** La sección Resultados solo aplica a contenidos en edición publicada (no es un paso del asistente de creación).
- **RN-02:** El copy de la sección indica que la información se actualiza cada 3 horas.
- **RN-03:** El periodo por defecto es «Últimos 30 días». Las opciones son exactamente: Últimos 30 días, Últimos 3 meses, Últimos 6 meses, Último año, Año actual.
- **RN-04:** El periodo filtra estudiantes por fecha de inicio e inscritos bloqueados por fecha de bloqueo. El tab Descargas (lista de recursos) no cambia con el periodo.
- **RN-05:** «Estudiantes inscritos» cuenta las filas visibles tras el filtro de periodo. «Finalización» es el % de esos inscritos que ya tienen fecha de finalización (completaron todo el contenido). El tooltip del KPI lo dice así.
- **RN-06:** Los tabs son Progreso, Evaluaciones, Gestión de intentos y Descargas. El detalle de páginas del estudiante vive solo en Progreso (HU-LMS-012).
- **RN-07:** En Evaluaciones, cada evaluación del contenido es una columna con su nombre y peso. Si el estudiante no la ha presentado, la celda muestra **Pendiente**. Si ya la presentó: «{estado} con {porcentaje}% ({correctas} de {total} preguntas)».
- **RN-08:** **Final ponderada** usa solo las evaluaciones ya presentadas (no Pendiente), ponderadas por el peso de cada una y renormalizadas sobre la suma de esos pesos. Si no hay ninguna presentada, se muestra «—».
- **RN-09:** El ícono de información del encabezado de una evaluación abre el modal «Detalles de evaluación» (Entendido para cerrar) con: peso, porcentaje requerido para aprobar, límite de intentos, tiempo límite y total de preguntas. Si un criterio no aplica, el valor es «No aplica».
- **RN-10:** En Gestión de intentos aparecen solo estudiantes que alcanzaron el límite de intentos de una evaluación. El texto de ayuda: «Desbloquear otorga 1 intento más a cada usuario.»
- **RN-11:** Desbloquear uno se hace con el botón de la fila. Desbloquear varios exige seleccionar al menos 2 filas y usar la barra de acciones. En ambos casos hay modal de confirmación; al confirmar, salen de la lista y se otorga 1 intento adicional. Cancelar no cambia la lista.
- **RN-12:** Tras desbloquear, el toast es «Usuario desbloqueado exitosamente» (uno) o «Usuarios desbloqueados exitosamente» (varios).
- **RN-13:** En Descargas hay una fila por evaluación o encuesta del contenido, con participantes y botón Descargar del reporte de ese recurso.
- **RN-14:** Empties (copy fijo): Progreso/Evaluaciones «No se encontraron resultados»; Gestión «No hay estudiantes bloqueados»; Descargas «No hay reportes disponibles». La descripción de Descargas: «Cuando el contenido tenga evaluaciones o encuestas, podrás descargar sus reportes aquí.»
- **RN-15:** Progreso, Evaluaciones y Gestión de intentos permiten descargar un CSV del tab con el periodo actual. Descargas no tiene CSV global: el reporte va por recurso.

## Criterios de Aceptación

**Escenario: Camino feliz — ver evaluaciones y final ponderada**

**Dado** que Ana edita un contenido publicado con dos evaluaciones (50% y 50%)
**Y** «Carlos Pérez» tiene Evaluación Sección 1 Aprobado con 80% y Evaluación Sección 2 Pendiente
**Cuando** abre Resultados → Evaluaciones
**Entonces** ve la fila de Carlos con Aprobado en la primera evaluación y Pendiente en la segunda
**Y** la Final ponderada refleja solo la evaluación ya presentada
**Cuando** abre «Ver detalles» de Evaluación Sección 1
**Entonces** ve el modal «Detalles de evaluación» con peso, aprobar, intentos, tiempo y total de preguntas

**Escenario: Camino feliz — desbloquear a un estudiante**

**Dado** que «Laura Gómez» aparece en Gestión de intentos por haber agotado los intentos de una evaluación
**Cuando** Ana pulsa Desbloquear en su fila y confirma en el modal «¿Desbloquear usuario?»
**Entonces** Laura deja de aparecer en la lista
**Y** se le otorga 1 intento adicional
**Y** Ana ve el toast «Usuario desbloqueado exitosamente»

**Escenario: Caso borde — periodo sin inscritos y desbloqueo en lote**

**Dado** que el periodo «Últimos 30 días» no deja ningún estudiante con fecha de inicio en ese rango
**Cuando** Ana revisa Resultados
**Entonces** Estudiantes inscritos es 0 y Finalización es 0%
**Y** Progreso y Evaluaciones muestran «No se encontraron resultados»
**Dado** que en «Último año» hay al menos 2 estudiantes bloqueados
**Cuando** Ana selecciona 2 o más y confirma «¿Desbloquear usuarios?»
**Entonces** todos los seleccionados salen de la lista
**Y** cada uno recibe 1 intento adicional
**Y** ve el toast «Usuarios desbloqueados exitosamente»

**Escenario: Camino negativo — cancelar desbloqueo o contenido sin reportes**

**Dado** que Ana abrió el modal de desbloqueo de un usuario
**Cuando** pulsa Cancelar
**Entonces** el usuario sigue en Gestión de intentos
**Y** no se otorga el intento extra
**Dado** que el contenido no tiene evaluaciones ni encuestas
**Cuando** Ana abre el tab Descargas
**Entonces** ve «No hay reportes disponibles»
**Y** la descripción indica que podrá descargarlos cuando existan evaluaciones o encuestas

---

## Lo que cambia en el rediseño (13-oct-2026)

Todo lo de arriba describe **la plataforma de hoy**. Estas son las decisiones del rediseño, que se
apartan de ella a propósito. Pantalla: `/admin/aprendizaje/lms-creator/contenidos/:id/resultados`.

### RN-16: Resultados sale del flujo de edición

Hoy Resultados es **un paso más del editor**: para ver cómo va un contenido hay que entrar a
«editarlo». Mirar y cambiar son dos trabajos distintos, en dos momentos distintos y casi siempre de
dos personas distintas, y juntarlos deja en modo edición a quien solo quería mirar.

En el rediseño son dos destinos y lo decide el estado del contenido:

| Estado | Qué abre | Por qué |
| --- | --- | --- |
| **Borrador** | El asistente de creación, con lo que ya se había llenado | Está a medias: lo que toca es terminarlo |
| **Cualquier otro** | La pantalla de **Resultados** | Ya está publicado: lo que toca es ver cómo va |

Para cambiar un contenido publicado está el botón **«Editar»** de la cabecera, que es una decisión
consciente y no el efecto de un clic en la lista. Eso también deja **todos los títulos de la lista en
azul**: antes solo el borrador llevaba a algún lado.

### RN-17: cada pestaña se lee igual

Todas las pestañas tienen la misma anatomía, que es lo que las vuelve una sola pantalla y no seis:

1. **El resumen**, una fila de tres lecturas con divisores: la cifra de la pestaña con su anillo, el
   reparto con su dona, y el top 3 con sus barras. Cada cifra lleva un **(i) con su fórmula escrita**.
2. **La tabla**, bajo su título y su bajada, con buscador, orden y filtro por columna.

Gestión de intentos es la excepción: no lleva resumen porque no hay nada que medir, solo una lista
de personas trabadas y una sola cosa que hacer con ellas.

### RN-18: la cifra de cada pestaña

| Pestaña | Cifra | Reparto | Top 3 |
| --- | --- | --- | --- |
| Progreso | **Finalización** | Completaron · En progreso · Sin empezar | Más cerca de terminar |
| Evaluaciones | **Aprobación** (sobre las presentadas) | Aprobadas · Reprobadas · Sin presentar | Evaluación con más reprobados |
| Roleplay | **Intentos aprobados** | A la primera · Repitieron | Objetivo que más cuesta |
| Asistencias | **Asistencia** | La persona · Carga manual | Sesión más concurrida |

La aprobación se lee **sobre las presentadas, no sobre las inscritas**: contar como reprobado a
quien no la ha hecho mezcla «no pudo» con «no quiso», y son dos problemas distintos.

### RN-19: «Descargas» deja de ser pestaña y pasa a ser un panel

Hoy conviven una pestaña Descargas y un botón «✉ Solicitar» que manda un correo, y a partir de ahí
nadie sabe si el archivo salió, falló o ya llegó. En el rediseño es **un solo panel**, que abre el
botón «Descargar» de la cabecera, con dos pestañas:

- **Reportes** — configuración: qué archivo quieres. Un informe en PDF para compartir (con
  interruptor por cada parte que lleva) y los archivos de datos en XLSX. Solo se ofrece lo que el
  contenido tiene: sin roleplay no aparece el reporte de roleplay.
- **Descargas** — estado: lo ya pedido, con su barra de preparación y su botón de descarga.

Al pedir un archivo el panel salta solo a «Descargas», para que se vea que el pedido se registró. Y
**cerrar el panel no cancela nada**: lo que se está preparando sigue, y avisa al terminar. El botón
de la cabecera cambia a «Preparando archivo» mientras haya algo en curso, así el estado se ve sin
abrir el panel.

### RN-20: una pestaña nueva, «Análisis con IA»

Las demás pestañas dicen **qué pasó**; esta dice **dónde mirar y por qué**: dónde se cae la gente,
qué evaluación traba, qué objetivo del roleplay no se está enseñando. Dos reglas la hacen utilizable
para defender una decisión:

- Cada afirmación lleva su **nivel de confianza** (alta, media o baja) con su explicación. Con quince
  personas no se concluye igual que con quinientas, y callarlo convierte una señal en una verdad.
- Cada afirmación **lleva a su evidencia**: «Ver los datos» abre la pestaña con los números que la
  sostienen.

### RN-21: qué pestañas se ven

Las que el contenido **puede** tener, aunque estén vacías, y entonces el vacío dice qué hacer para
llenarlas. Una pestaña que aparece y desaparece entre contenidos hace que nadie sepa dónde buscar.

- Con evaluaciones: **Evaluaciones** y **Gestión de intentos**.
- Si es un evento: **Asistencias**.
- Si tiene roleplay: **Roleplay**.
- Siempre: **Progreso** y **Análisis con IA**.

### RN-22: el detalle del intento de roleplay trae la conversación

El panel de un intento tiene **dos pestañas**: *Resultado* (los objetivos, con lo que hizo bien y lo
que puede mejorar) y *Conversación* (la transcripción, con copiar y descargar). La transcripción es
la evidencia de por qué la IA calificó así; sin ella no hay forma de comprobar la nota. Está en
producción y el prototipo anterior la había perdido.

### RN-23: una sola forma de leer una evaluación

Si alguien aprobó se decide **en un solo sitio** (`leerEvaluacion`), y de ahí beben la tabla y el análisis con IA.
Cuando cada una lo calculaba por su lado, las dos daban cifras distintas del mismo dato a un clic de distancia —«3
reprobados» en una pestaña y «5» en la otra—. En una pantalla cuyo argumento es que puedes comprobar lo que te dice,
esa es la contradicción más cara que puede haber.

Por la misma razón, **el avance de una persona se cuenta en recursos**, no en un porcentaje suelto: con ocho recursos
el avance solo puede ir de 12,5 en 12,5, y la tabla y el panel enseñan siempre el mismo número.

### RN-24: la asistencia se mide en personas, no en filas

Una fila de Asistencias es **una persona en una sesión**: quien fue a dos sesiones tiene dos filas. La cobertura cuenta
personas distintas, y el detalle dice las dos cosas: «9 de 10 inscritos · 10 asistencias». Contando filas, un evento al
que una persona fue dos veces y otra ninguna salía al 100 %.

### RN-25: el panel de progreso se deriva de la persona

El temario es del contenido, pero **el estado de cada recurso es de quien lo recorre**: lo completado va primero, luego
el recurso en el que se quedó y después lo bloqueado. Con los estados escritos en el temario, el panel le enseñaba a
alguien al 100 % recursos bloqueados y uno «en curso», contradiciéndose consigo mismo.

### RN-26: las descargas se ven desde fuera de la pantalla

Lo que se está preparando se publica en el **Centro de procesos** (el de las notificaciones), con su «Ver» de vuelta al
panel. Si solo se viera con el panel abierto, habría que quedarse esperando con él abierto. Al salir de Resultados, lo
que estaba en curso se retira: no puede quedar algo anunciándose para siempre contra una pantalla que ya no existe.

### RN-27: lo que se ofrece es lo que el contenido tiene

Vale para los reportes **y para las partes del informe en PDF**: un evento no ofrece el bloque de Roleplay, y un curso
sin sesiones no ofrece el de Asistencias.

### RN-28: la satisfacción, cuando el contenido pregunta

La tercera lectura de Progreso es la **satisfacción**: la nota media de 1 a 5 de la encuesta de satisfacción del
contenido, con cuántas personas la respondieron. Sale de un recurso que se añade al contenido como cualquier otro, así
que **un contenido sin esa encuesta no la tiene** y el resumen se queda en dos lecturas. No es lo mismo «nadie ha
respondido todavía» que «aquí no se preguntó nada».

### RN-29: todo lo que se ve cabe en un enlace

La pestaña abierta, el panel y de quién es el detalle viven en la dirección: `?tab=roleplay&intento=…`,
`?tab=progreso&persona=…`, `?panel=descargas`. Es un playground de diseño y enseñar algo aquí es **mandar una
dirección**, así que cualquier estado de la pantalla tiene que poder pasarse por un enlace.

Si la dirección pide una pestaña que ese contenido no tiene, se abre la primera: un enlace a `?tab=roleplay` de un
contenido sin roleplay no puede dejar la pantalla en blanco.

### RN-30: el recordatorio también en lote

Progreso tiene casillas y la acción de la cabecera manda el recordatorio a lo marcado, igual que Gestión de intentos
desbloquea en lote. El recordatorio **nunca cuenta a quien ya terminó**: con todo lo marcado completado, la acción se
apaga y dice por qué. Se puede deshacer mientras el aviso está en pantalla, que para algo de un clic es mejor que
preguntar antes.

### RN-31: los archivos se generan de verdad

El panel no simula la descarga: al terminar la preparación **sale el archivo**. Los XLSX se arman con el mismo
constructor de libros que usa Resultados de encuestas, para que un libro de esta pantalla y uno de aquella se abran
igual.

**Solo XLSX.** Se probó un informe en PDF —impreso, como el de encuestas— y se descartó el 13-oct: un contenido no da
para un documento de lectura, y lo que de verdad se pide de aquí son los datos para trabajarlos aparte.

Pedir el reporte ya es pedir la descarga: el archivo sale solo al terminar y la fila queda de recibo para volver a
bajarlo. Si el navegador lo bloquea, la fila lo dice y deja reintentar.

### RN-32: historial de cambios

El menú de la cabecera abre el **historial**: qué se ha cambiado en el contenido desde que se publicó, de lo más
reciente a lo más antiguo, agrupado por día y diciendo **quién, qué, cuándo y a qué hora**.

Cada línea es **una frase**: quién, qué hizo y, debajo, cuándo. Sin bajada ni explicación — con treinta cambios, una
descripción por línea lo vuelve ilegible. Es la forma del historial de una tarea.

Se registra lo que afecta a quien ya está estudiando: renombrar páginas o secciones, ocultarlas, moverlas de sitio,
reemplazar un recurso (solo por otro del mismo tipo), cambiar el nombre, la descripción o la ficha, activar o quitar el
certificado, cambiar la visibilidad, el peso o las condiciones de una evaluación, el tipo de navegación y el impacto en
el progreso. **Un borrador no tiene historial**, porque mientras se crea nada de eso afecta a nadie.

Cuando a alguien se le descuadra el progreso o desaparece un certificado, la primera pregunta es siempre «¿quién cambió
esto?»; sin registro, la respuesta vive en la memoria de quien estuviera ese día.

### RN-33: al entrar, la pantalla empieza arriba

El marco conserva el desplazamiento entre pantallas, así que abrir el último contenido de una lista larga dejaba
Resultados empezada por la mitad, sin título ni pestañas a la vista. Al entrar, la pantalla sube sola.


### RN-34: quién lleva roleplay

Los **cursos**, salvo los que vienen del LMS anterior: lo heredado se migró tal cual y el roleplay no existía entonces.
Los eventos tampoco lo llevan — ahí lo que hay son sesiones.

### RN-35: la satisfacción se enseña como reparto

El gráfico de la satisfacción es **una barra por nota, de 1 a 5**, no un anillo. Un anillo contaría qué parte de «cinco
sobre cinco» se alcanzó, que no significa nada; de una encuesta lo que se quiere ver es si las notas se amontonan
arriba o están repartidas. La cifra va con su escala («4,3 de 5»), porque un «4,3» suelto se lee como un porcentaje a
medias.

### RN-36: sin pie, pero con su aire

Resultados no lleva el pie del marco. Aun así deja el mismo aire al final: sin él, lo último de la tabla queda pegado
al borde de abajo, porque el margen del contenedor se pierde al desplazarse.

### RN-37: con varios roleplay, una columna más

Un contenido puede practicar la misma habilidad en **dos situaciones distintas**, y entonces cada roleplay tiene sus
propios intentos.

La columna **«Roleplay»** va siempre que el contenido tenga roleplay, tenga uno o cinco: una columna que aparece y
desaparece entre contenidos hace que nadie sepa dónde buscar, igual que pasaba con las pestañas (RN-21). Lo que sí
depende de cuántos hay es el **filtro** de su encabezado (RN-41): con uno solo no hay nada que acotar. Al filtrar, **el
resumen de arriba se recalcula** sobre lo filtrado.

**Dónde verlo.** «Creatividad e innovación» (`f009`) es el único contenido con dos, a propósito, para tener el caso a
mano sin tocar el contenido de ejemplo. Sus roleplay son «Presenta una idea nueva a tu equipo» y «Defiende la idea ante
el comité».

| Qué | Dirección |
| --- | --- |
| Los dos roleplay, sin filtrar | `/admin/aprendizaje/lms-creator/contenidos/f009/resultados?tab=roleplay` |
| Filtrado por uno | `/admin/aprendizaje/lms-creator/contenidos/f009/resultados?tab=roleplay&roleplay=rp-idea-al-comite` |
| Un intento concreto abierto | `/admin/aprendizaje/lms-creator/contenidos/f009/resultados?tab=roleplay&intento=rp-idea-al-comite-0-1` |

Un contenido con **un solo** roleplay, para comparar: `/admin/aprendizaje/lms-creator/contenidos/f007/resultados?tab=roleplay`

### RN-38: la satisfacción la responde todo el que termina

La encuesta de satisfacción es **una página más** del contenido, así que no se puede finalizar sin pasar por ella: las
respuestas son tantas como personas lo completaron. Si fueran menos, la cifra no cuadraría con la de finalización y la
pestaña se contradiría consigo misma.

Su gráfico es **la misma dona** que «Estado de los inscritos», con un tramo por nota de 1 a 5 y el color según lo que
значит la nota. Así las tres lecturas de la fila se leen igual.

### RN-39: las cifras no se califican

Ninguna cifra de Resultados lleva «Baja», «Regular» ni «Buena». Poner nota a la finalización, a la aprobación o a la
asistencia es **juzgar el contenido con un corte que nadie acordó**, y eso se nos devuelve en cuanto alguien pregunta
de dónde sale el corte. El anillo se llena en azul y la cifra habla sola (Dave, 14-oct).

Por lo mismo, los repartos usan **la escala de azules del tema** (`--chart-1` a `--chart-5`) y no un semáforo: un color
por tramo, todos distintos entre sí, sin decir cuál es bueno. Con dos verdes y dos rojos, dos tramos del círculo se
leían como uno solo.

### RN-40: lo que mide cada lectura

| Pestaña | Cifra | Reparto | Tercera |
| --- | --- | --- | --- |
| Progreso | Finalización | Estado de los inscritos | **Satisfacción** |
| Evaluaciones | Aprobación | Resultado de las evaluaciones | **Intentos por persona** |
| Roleplay | **Personas que aprobaron** | Resultado de los intentos | **Intentos por persona** |
| Asistencias | Asistencia | Cómo se confirmó | Sesión más concurrida |

En Roleplay la cifra se cuenta **por persona y no por intento**: lo que se quiere saber es si acabaron lográndolo, no
cuántas veces fallaron por el camino. Quien aprueba al tercer intento aprobó.

**«Intentos por persona»** es la lectura que dice si lo que se pide está bien calibrado: si casi todo el mundo lo saca
a la primera, sobra; si la mayoría necesita tres, el problema está en lo que se pide o en lo que lo precede, no en las
personas.

### RN-41: filtrar es cosa de la columna

Lo que antes elegía un selector encima de la tabla —el roleplay, la sesión— se filtra desde **el encabezado de su
columna**, como cualquier otro filtro. Así se empieza viéndolo todo, se filtra donde está el dato y no hay dos sitios
distintos para hacer lo mismo (Dave, 14-oct).

- Roleplay: la columna «Roleplay» solo aparece cuando el contenido tiene más de uno.
- Asistencias: la columna «Sesión» filtra por varias a la vez.

El filtro sigue viviendo en la dirección, así que se puede enlazar ya filtrado.


### RN-42: el historial es una línea de tiempo

Los cambios se enseñan como un **hilo vertical** —la pieza `Timeline` de la librería— con el icono del tipo de cambio
enganchado, el nombre de quien lo hizo, lo que hizo y cuándo. Se eligió entre diez formas distintas (lab del 14-oct)
porque es la que deja claro de un vistazo que **una cosa pasó después de otra**, que es lo único que un historial tiene
que contar.

Lleva **buscador** por persona y por cambio: el historial de un contenido vivo pasa de treinta líneas en nada, y
entonces la pregunta deja de ser «¿qué ha pasado?» para ser «¿quién tocó las evaluaciones?».
