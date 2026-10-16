# HU: Resultados de asistencias por sesión y carga manual

## Contexto

El creador necesita ver quién asistió a cada sesión (o a cada página de asistencia sin sesiones) y completar a mano a quienes no se autoconfirmaron.

> **Cuando el recurso tiene Autoasistencia desactivada, esta pantalla es la ÚNICA vía de registro:** el participante no puede marcarse a sí mismo, así que la carga manual de aquí deja de ser un complemento y pasa a ser el único camino. Ver [HU-LMS-015 · RN-02d](../recursos/HU-recurso-asistencia.md). El listado debe reflejar las páginas de asistencia reales del contenido, no un catálogo fijo. La carga manual usa el mismo patrón de drawer con stepper que «Agregar asignación» en planes de formación.

## Historia de Usuario

**Como** creador de contenidos LMS,
**quiero** elegir la página de asistencia y la sesión en Resultados, ver solo esos asistentes, cargarlos a mano (por colaborador, por grupos o desde archivo) a esa sesión y descargar el CSV de esa misma sesión,
**para** completar la evidencia sin mezclar sesiones y sin reescribir datos de otras jornadas.

## Alcance

**Incluye:**
- Tab «Asistencias» en Resultados de Editar contenido.
- Filtro de **asistencia** (página) y, a su lado, filtro de **sesión**.
- Tabla de la sesión activa: usuario, username, modo de confirmación y fecha/hora de confirmación.
- Checkboxes para seleccionar y eliminar usuarios de esa sesión.
- Drawer **Cargar asistencias** (tamaño lg, stepper horizontal): tipo de carga con cards → participantes o archivo.
- Tres tipos: **Por colaborador**, **Por grupos**, **Desde archivo** (CSV con columna username).
- Descargar el CSV de la sesión (o página) que está seleccionada.

**Excluye:**
- Setup del recurso (HU-recurso-asistencia).
- Confirmación del estudiante (HU-asistir-sesion).
- Edición celda a celda.
- Tipo «Toda la empresa» (no aplica a una sesión de asistencia).

## Reglas de Negocio

- **RN-01:** El filtro de asistencia lista las páginas de asistencia actuales del contenido. Si Ana añade una en Recursos y vuelve a Resultados, esa página aparece de inmediato.
- **RN-02:** El filtro de sesión lista las sesiones de la página elegida. Si la página es sesión libre, el filtro de sesión muestra «Sesión libre». Si el contenido tiene secciones con título, el filtro de asistencia antepone el nombre de la sección.
- **RN-03:** La tabla muestra únicamente a los asistentes de la sesión seleccionada. No hay columna Sesión. La última columna es **Fecha y hora de confirmación**.
- **RN-03a:** Autoconfirmación usa la fecha/hora en que el estudiante confirmó. Manual usa la fecha/hora de la carga. Si no hay dato, se muestra un guion.
- **RN-04:** Una página recién creada sin confirmaciones muestra empty state hasta que los estudiantes confirmen o Ana cargue asistentes.
- **RN-05:** Modo **Autoconfirmación** = el estudiante marcó en plataforma. Modo **Manual** = el creador lo cargó por colaborador, por grupos o desde archivo.
- **RN-06:** La carga aplica a la sesión (o página sin sesiones) que se está viendo. Un username ya presente en esa sesión no se duplica.
- **RN-07:** **Por colaborador** usa la tabla de colaboradores (misma que en planes). **Por grupos** agrega a los integrantes de los grupos elegidos, sin duplicar username. **Desde archivo** espera un CSV con la columna username (plantilla descargable).
- **RN-08:** El drawer tiene stepper: 1) Tipo de carga 2) Participantes (colaborador/grupos) o Archivo. Elegir una card avanza al paso 2. Confirmar agrega con modo Manual y cierra el drawer. La URL del drawer es `#resultados-asistencias/cargar`; al cerrar vuelve a `#resultados-asistencias`.
- **RN-09:** Descargar genera un CSV solo de la sesión/página que está seleccionada en el selector.
- **RN-10:** Con al menos un usuario seleccionado, Ana puede eliminarlo de esa sesión (no se quita del contenido ni de otras sesiones).

## Criterios de Aceptación

**Escenario: Camino feliz — ver asistentes de una sesión**

**Dado** que Ana abre Editar contenido → Resultados → Asistencias
**Y** el contenido tiene una página de asistencia con dos sesiones y confirmaciones previas
**Cuando** elige la página en el filtro de asistencia y una sesión en el filtro de sesión
**Entonces** ve solo a los asistentes de esa sesión, con usuario, username, modo y fecha/hora de confirmación
**Y** no ve una columna Sesión

**Escenario: Camino feliz — dos filtros separados**

**Dado** que el contenido tiene dos páginas de asistencia
**Cuando** Ana cambia el filtro de asistencia
**Entonces** el filtro de sesión pasa a mostrar las sesiones de esa página
**Y** la tabla se actualiza a la primera sesión de esa página

**Escenario: Camino feliz — selector vivo desde Recursos**

**Dado** que Ana añade una página de asistencia nueva en Recursos
**Cuando** vuelve a Resultados → Asistencias
**Entonces** esa página (y sus sesiones, si las configuró) aparece en el selector
**Y** al elegirla ve empty state porque aún no hay asistentes

**Escenario: Camino feliz — etiqueta sin sesiones**

**Dado** que una página de asistencia está en modo sesión libre
**Cuando** Ana abre el selector
**Entonces** esa opción muestra solo el título de la página

**Escenario: Camino feliz — etiqueta con sesiones y secciones**

**Dado** que el contenido tiene secciones con título
**Y** una página de asistencia con sesiones vive dentro de una sección
**Cuando** Ana abre el selector
**Entonces** cada opción muestra sección + título de la página + sesión

**Escenario: Camino feliz — drawer de carga con stepper**

**Dado** que Ana está viendo una sesión concreta
**Cuando** pulsa Cargar asistencias
**Entonces** abre un drawer con stepper horizontal y tres cards: Por colaborador, Por grupos y Desde archivo
**Y** la URL queda en `#resultados-asistencias/cargar`

**Escenario: Camino feliz — deep link al drawer**

**Dado** que Ana abre la pantalla correspondiente
**Cuando** carga la página
**Entonces** ve Resultados → Asistencias con el drawer Cargar asistencias abierto

**Escenario: Camino feliz — carga por colaborador**

**Dado** que Ana elige Por colaborador
**Cuando** selecciona uno o más colaboradores y confirma
**Entonces** esos usuarios se agregan a esa sesión con modo Manual
**Y** no se duplican si ya estaban
**Y** recibe feedback de éxito

**Escenario: Camino feliz — carga por grupos**

**Dado** que Ana elige Por grupos
**Cuando** selecciona uno o más grupos y confirma
**Entonces** se agregan los integrantes de esos grupos a esa sesión con modo Manual
**Y** no se duplican usernames ya presentes
**Y** recibe feedback de éxito

**Escenario: Camino feliz — carga desde archivo**

**Dado** que Ana elige Desde archivo
**Cuando** sube un CSV válido con la columna username y confirma
**Entonces** esos usuarios se agregan a esa sesión con modo Manual
**Y** no se duplican si ya estaban
**Y** recibe feedback de éxito

**Escenario: Camino negativo — CSV inválido**

**Dado** que Ana sube un archivo sin usernames válidos
**Cuando** el sistema lo valida
**Entonces** ve un error en el upload y no se modifican las asistencias

**Escenario: Camino feliz — descargar la sesión activa**

**Dado** que Ana está viendo una sesión concreta en el selector
**Cuando** pulsa Descargar
**Entonces** obtiene un CSV con los asistentes de esa sesión
**Y** no incluye a los de otras sesiones

**Escenario: Camino feliz — eliminar de una sesión**

**Dado** que Ana selecciona uno o más usuarios de la tabla
**Cuando** confirma Eliminar
**Entonces** dejan de aparecer en esa sesión
**Y** siguen inscritos en el contenido
