# HU: Crear assessment

## Contexto

Diagnóstico mide cuánto aprendieron los colaboradores de un plan de formación con dos pruebas del banco de UBITS: una **inicial** (el punto de partida) y una de **seguimiento** (al terminar el plan). En producción el flujo tiene cuatro pasos sueltos, crea la prueba antes de pedir las fechas, deja crear assessments sin competencias y dice «Activaste el Assessment» aunque no se activó. El objetivo es que el admin cree las dos medidas con fechas válidas en un solo recorrido, sabiendo qué va a pasar, cuándo y a cuántas personas les llega.

Maqueta: `/admin/aprendizaje/diagnostico/crear` (botón «Crear assessment» de Diagnóstico). Reutiliza los servicios que ya existen: planes de formación, banco de pruebas por competencia y reglas de fechas.

## Historia de Usuario

**Como** administrador de aprendizaje de la empresa,
**quiero** crear el assessment de un plan de competencias y programar el inicial y el de seguimiento,
**para** medir cuánto mejoró cada competencia del plan entre el antes y el después.

## Alcance

**Incluye:**
- Asistente de tres pasos con la **Vista previa** a la derecha, como Crear contenido ([HU-LMS-001](../lms-creator/contenidos/HU-crear-contenido.md)) y Crear plan ([HU-LMS-005](../planes-de-formacion/planes/HU-planes-formacion.md)): **Plan**, **Qué se mide** y **Programación**.
- Al crear se vuelve al listado de Diagnóstico con un aviso que dice qué quedó y cuándo abre.
- Las pruebas creadas aparecen de primeras en la lista de Diagnóstico; las inactivas se activan desde «Activar».

**Excluye:**
- Crear o editar preguntas: vienen del banco de UBITS y no se editan.
- El detalle de un assessment (Ver detalle) y Editar fechas.

## Reglas de Negocio

- **RN-00-salida:** Mismo trato que Crear contenido, porque son el mismo asistente de pasos (Carlos, 1-oct):
  - El assessment **se guarda desde el primer paso**. En cuanto se elige un plan o se escribe un nombre ya hay
    borrador, y el chip de guardado sale en la barra inferior **desde el paso 1**.
  - La cabecera **no lleva flecha de volver a la izquierda del título**: para atrás está el botón de la barra de
    abajo, y la salida es «Salir de la creación», a la derecha.
  - La cabecera **tampoco lleva antetítulo con la ubicación**: lo primero del cuerpo es el título. La ruta y el
    módulo ya están en la miga de pan de la barra superior (Dave, 6-oct).
  - Salir tiene **dos** formas y en ninguna se pierde trabajo: si no se tocó nada, se sale de una; si se tocó algo,
    sale «¿Salir de la creación?» · «El assessment queda guardado como borrador. Puedes retomarlo cuando quieras
    desde Diagnóstico.» · **Seguir aquí** / **Salir de la creación**. No es destructiva.
  - El botón para avanzar dice **«Continuar»**, sin el nombre del paso siguiente; el último dice «Crear assessment» (jefe de Dave, 13-oct).
- **RN-00:** El paso 1 va en dos grupos con cabecera gris, como el asistente de Crear contenido: **primero el nombre** del assessment y después el plan. La lista de planes **no se despliega en la página**: se elige en un panel lateral con buscador (el patrón de Crear plan de formación) y en la página queda solo el plan elegido, con un botón «Cambiar plan». Con decenas de planes, listarlos todos hacía del paso un scroll larguísimo.
- **RN-00-ter:** El panel de planes **se confirma**: marcar un plan solo lo deja marcado, y el pie lleva un botón
  **Confirmar** —primario— que es el que lo aplica y cierra el panel. Está **apagado hasta que haya un plan marcado**,
  porque sin plan no hay nada que confirmar. Para salirse sin elegir, la X de la cabecera. Antes el plan cambiaba con
  el propio clic en el radio y el panel se cerraba solo: no había forma de comparar dos planes antes de decidir ni de
  arrepentirse, y el botón del pie decía «Cerrar», que no contaba lo que hacía (Dave, 1-oct).
- **RN-00-bis:** Los planes salen de la **base compartida** (`shared/bd/planes-formacion.ts`, la que se importó del
  playground anterior), no de los datos de demo de Planes de formación, que son de otra persona. De los 72 planes de la
  base se listan los **9 de competencias**: un plan de contenidos asigna cursos, no competencias, así que no hay nada
  que medir. Los estados que trae son Planeado, Vigente y No vigente —«Procesando» no existe ahí—.
- **RN-00-ter:** Las competencias de un plan se resuelven **por id** contra el catálogo de 35
  (`shared/bd/competencias.ts`). Al enlazarlas salió un dato malo en la base de planes: Negociación estaba guardada como
  `comp-015`, que en el catálogo es «Gestión de recursos tecnológicos». Se corrigió a `comp-027`, que es la Negociación
  de verdad.
- **RN-01:** Solo se listan **planes de competencias**: un plan de contenidos asigna cursos, no competencias, así que no hay nada que medir. Un plan cuyas competencias todavía no tienen prueba en el banco sale deshabilitado con el motivo.
- **RN-02:** Se listan los planes **planeado, vigente y no vigente** (acuerdo con producto, 30-sep-2026). «Procesando» es un estado de paso que dura segundos mientras se reparten las asignaciones; no está en la base que leemos y no se lista. Un plan que ya tiene assessment sí se lista, deshabilitado y con el motivo.
- **RN-03:** El nombre es obligatorio, de 5 a 80 caracteres, y no puede repetir el de otro assessment (sin distinguir mayúsculas ni tildes). Al elegir el plan se propone «Diagnóstico · {nombre del plan}».
- **RN-04:** Cada competencia trae su prueba del banco: **12 preguntas** tomadas de un banco de **74 por competencia**, y 15 minutos. El tiempo por persona es 15 minutos por competencia. El detalle de una competencia dice qué mide, para quién es y el aval de la prueba; **no hay vista previa de preguntas** —enseñaba una sola de las 12 y no ayudaba a decidir (30-sep-2026)—.
- **RN-05:** El admin decide si cada colaborador ve, al terminar, cuántas preguntas acertó y su nivel. Por defecto, sí.
- **RN-05-bis:** Los tres niveles salen del porcentaje de aciertos y son **iguales para todas las competencias**, no se configuran una por una: **Bajo** por debajo de 58 %, **Medio** entre 58 % y 92 %, **Alto** por encima de 92 %.
- **RN-06:** **El último paso no tiene restricciones de fecha** (30-sep-2026): ni fines de semana bloqueados, ni meses vetados, ni duración mínima o máxima, ni obligar a que el seguimiento vaya después del plan. Lo único que no se puede elegir es un día ya pasado. Se siguen **sugiriendo** fechas como valor de partida, pero el admin las mueve a donde quiera.
- **RN-06-bis:** Al programar se ven **las fechas de inicio y fin del plan**, que son la referencia para decidir cuándo medir. Así no hay que ir a buscarlas al plan.
- **RN-07:** Al elegir el plan se **sugiere** una fecha para cada assessment, como punto de partida. Si se corre el inicial, el de seguimiento se mueve con él y se avisa. Son sugerencias: nada impide dejarlas donde sea (RN-06).
- **RN-08:** El **assessment inicial** mide el punto de partida, así que solo llega encendido cuando el plan todavía no empieza. Si ya empezó o ya terminó, llega **apagado** y con un aviso que dice por qué —«se recomienda solo para planes que no han empezado»— pero **con las fechas puestas**, de modo que encenderlo es un clic. No se bloquea: informar sí, impedir no.
- **RN-09:** Cada uno se llama **Assessment inicial** y **Assessment de seguimiento**, y cada uno se habilita por separado con su interruptor. El que se deja sin habilitar nace **Inactivo** y nadie recibe aviso; se activa después desde Diagnóstico.
- **RN-09-bis:** En la **vista previa** esas dos filas se llaman solo **Inicial** y **Seguimiento**. Con el nombre
  completo la etiqueta se comía la columna de 20rem y el rango de fechas caía en dos renglones, partido por la mitad.
  Repetir «Assessment» ahí tampoco aporta: el panel entero es de este assessment (Dave, 1-oct).
- **RN-10-titulo:** El título del modal **Ver detalle** es **fijo**: «Detalle de la prueba de esta competencia».
  Dice «prueba» y no «assessment» a propósito: el assessment es el conjunto, y lo de cada competencia es su prueba,
  que es como lo nombra el resto de la pantalla («Pruebas validadas, no se editan»).
  No lleva el nombre de la competencia, porque a desarrollo le sirve más un título que no cambia con el contenido
  (Carlos, 1-oct). El nombre no se pierde: abre el cuerpo, con su línea de «tipo · preguntas · minutos» debajo —la
  misma jerarquía que tenía en la cabecera, una fila más abajo—.
- **RN-10:** El modal **Ver detalle** de una competencia es informativo y se lee en tres partes: **Qué mide**,
  **Qué encontrará el colaborador** y, abajo, **Para quién es** como **aviso informativo** (`Alert variant="info"`),
  no como una fila gris más: no es otro dato de la prueba, es a quién le va a llegar, y en gris se perdía entre los
  dos bloques de arriba. Su único botón dice **Entendido** y va en **primario**: no hay nada que decidir ni nada que
  deshacer, así que el botón que cierra es el que conviene que se vea (Dave, 1-oct).
- **RN-10:** Al crear, un assessment cuyo rango incluye hoy queda **Vigente**; uno para después, **Planeado**. El día que abre se les avisa a las personas asignadas al plan.
- **RN-11:** Al crear **no hay pantalla de confirmación**: se vuelve al listado de Diagnóstico y un aviso abajo a la izquierda dice qué quedó, cuándo abre y a cuánta gente se le avisa. La pantalla «Assessment creado» se eliminó el 30-sep-2026: repetía lo que el aviso ya contaba y dejaba al admin en un callejón.

## Criterios de Aceptación

**Escenario: Crear con los dos assessments habilitados**

**Dado** el plan planeado «Empresa Liderazgo 2027», que todavía no empieza, con 54 personas
**Cuando** el admin lo elige en el panel lateral, deja el nombre sugerido, revisa las competencias y acepta las
fechas sugeridas
**Y** presiona «Crear assessment»
**Entonces** vuelve al listado de Diagnóstico y abajo a la izquierda sale «Assessment "…" creado», con la fecha en
que abre y a cuánta gente se le avisa
**Y** en el listado aparecen de primeras el inicial y el de seguimiento, con 0/54

**Escenario: Plan que ya empezó o ya terminó**

**Dado** el plan vigente «Empresa Inglés 2026», que ya empezó
**Cuando** el admin llega a Programación
**Entonces** el **Assessment inicial** llega apagado, con el aviso de que se recomienda solo para planes que no han
empezado, y con sus fechas ya puestas
**Y** el admin lo puede habilitar igual si quiere: no está bloqueado

**Escenario: Crear sin habilitar ninguno**

**Dado** un plan elegido
**Cuando** el admin apaga «Habilitar» en los dos y crea
**Entonces** el assessment nace Inactivo, el aviso dice que nadie recibe convocatoria
**Y** desde Diagnóstico › Acciones aparece «Activar»

**Escenario: Nombre repetido o plan sin competencias**

**Dado** que ya existe un assessment llamado «Diagnóstico · Liderazgo para mandos medios»
**Cuando** el admin escribe ese nombre
**Entonces** ve «Ya hay un assessment con ese nombre. Elige otro.» y no puede avanzar
**Y** un plan cuyas competencias no tienen prueba en el banco sale deshabilitado con «Sus competencias todavía no tienen prueba en el banco.»

**Escenario: Salir a mitad**

**Dado** un plan elegido
**Cuando** el admin presiona «Salir de la creación»
**Entonces** ve «¿Salir de la creación?» con «Seguir aquí» y «Salir de la creación»
**Y** el texto le dice que el assessment queda guardado como borrador y lo puede retomar desde Diagnóstico

**Escenario: Entrar a mirar y salir**

**Dado** que el admin entró a Crear assessment y no eligió plan ni escribió nombre
**Cuando** presiona «Salir de la creación»
**Entonces** vuelve a Diagnóstico **sin ninguna confirmación**, porque no hay nada guardado
