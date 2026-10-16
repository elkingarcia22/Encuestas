# HU: Asistir a sesión (recurso asistencia)

## Contexto

El colaborador llega a un **Evento** cuyo recurso incluye una o más páginas de asistencia (p. ej. vía QR a la URL del contenido). Demo playground: `f021` «Protocolos de Supervivencia y Seguridad ante Sismos» con tres asistencias (**Fundamentos — actividad práctica**, **Simulacro de evacuación**, **Taller de primeros auxilios**). En el playground cada página de asistencia incluye siempre sesión expirada, en vivo y a futuro para poder probar el flujo. Confirmar asistencia no es “visitar la página”: solo cuenta dentro de la ventana de la sesión pactada, y sin confirmar no puede completar el contenido.

## Historia de Usuario

**Como** colaborador estudiante,
**quiero** confirmar mi asistencia a una sesión presencial en el momento en que está habilitada, ver cuando está ocurriendo y guardar las sesiones futuras en mi calendario,
**para** dejar evidencia en Ubits, no perder el horario y poder continuar el resto del contenido.

## Alcance

**Incluye:**
- Página de asistencia en experiencia de estudio: instrucciones + lista de sesiones (cada una con el nombre que puso el creador).
- Botón Confirmar solo habilitado en el periodo de la sesión.
- Sesión en curso: la card se destaca como «Está ocurriendo» y muestra cuenta regresiva hasta el fin de la ventana.
- Sesión futura: acción «Añadir a mi calendario» (elige Google Calendar, Outlook, Apple Calendar u otro archivo de calendario).
- Toast al confirmar con éxito; el botón pasa a StatusTag «Confirmado»; hover muestra fecha y hora de confirmación.
- Gating: sin al menos una asistencia confirmada, la página no cuenta como completada.
- Navegación lineal: Continuar se habilita tras confirmar; libre: se puede saltar entre páginas solo tras cumplir el gating de asistencia; Fin del contenido no se activa si no confirmó.
- Índice sin secciones cuando el contenido no tiene secciones habilitadas.
- En el índice (portada o recursos), la fila de una página tipo asistencia muestra badge «En vivo» cuando alguna sesión tiene la ventana abierta y la página aún no está completada (sin línea lateral: esa marca es solo para la página actual).

**Excluye:**
- Setup del recurso en Creator (HU-recurso-asistencia).
- Carga CSV manual por el creador (HU-LMS-025).
- Validación Etapa 3 (evidencia vs declaración).

## Decisión de UX — añadir al calendario

Las experiencias de referencia (invitaciones de Calendly, Eventbrite y Luma) no mandan el evento a un solo calendario: la persona elige. En empresas de la región los más usados son Google Calendar y Outlook; Apple Calendar cubre iPhone y Mac; «Otro calendario» entrega un archivo compatible con cualquier app. Ubits no pide iniciar sesión contra el calendario. El evento lleva título del contenido + sesión, horario e instrucciones, y un recordatorio 30 minutos antes.

## Reglas de Negocio

- **RN-01:** Abrir o visitar la página de asistencia **no** completa el recurso.
- **RN-02:** El botón Confirmar de una sesión solo está habilitado dentro de su ventana de fecha/hora, **y solo si el recurso tiene Autoasistencia activa** (ver RN-05b).
- **RN-03:** Al confirmar con éxito se muestra un toast de confirmación y el control pasa a StatusTag «Confirmado». Al hacer hover sobre ese tag se muestra un tooltip con la fecha y hora de la confirmación.
- **RN-04:** Tras confirmar al menos una sesión requerida, se habilita Continuar (nav lineal) o el salto libre entre páginas; la página Fin no se activa hasta completar todas las páginas consumibles, incluida la asistencia.
- **RN-05:** Con Autoasistencia activa, el modo de confirmación es **autoconfirmación**: Luis llegó por URL/QR y marca en plataforma.
- **RN-05b:** Con **Autoasistencia desactivada**, Luis **no puede marcar** que asistió: en lugar del botón Confirmar ve un aviso de que su administrador confirma esa asistencia. Es una decisión del creador para que nadie se marque presente sin haber ido ([HU-LMS-025 · RN-02d](../../../../admin/productos/aprendizaje/lms-creator/contenidos/recursos/HU-recurso-asistencia.md)).
- **RN-05c:** En ese caso la página de asistencia **sigue bloqueando** el avance: queda sin completar hasta que un creador cargue la asistencia desde Resultados → Asistencias ([HU-LMS-026](../../../../admin/productos/aprendizaje/lms-creator/contenidos/resultados/HU-resultados-asistencias.md)). Cuando lo haga, Luis encuentra esa página **ya finalizada** la próxima vez que entre al contenido, y el gating se libera. Luis no tiene forma de desbloquearla por su cuenta.
- **RN-06:** Si el contenido no tiene secciones habilitadas, el índice muestra la variante plana (solo páginas, sin cabeceras de sección).
- **RN-07:** Si la sesión está en curso (ahora está entre el inicio y el fin de su ventana) y Luis aún no confirmó, la card se destaca, muestra «Está ocurriendo» y una cuenta regresiva hasta el fin de la ventana. El botón Confirmar sigue visible **si hay Autoasistencia**.
- **RN-08:** Si la sesión aún no inicia, no se muestra el StatusTag «Pendiente». En su lugar aparece la acción **Añadir a mi calendario**. Al pulsarla, Luis elige Google Calendar, Outlook, Apple Calendar u otro calendario (archivo).
- **RN-09:** Si la ventana ya cerró y no confirmó, se muestra StatusTag «Expirado». No puede confirmar ni añadir esa sesión al calendario.
- **RN-10:** Si alguna sesión de la página de asistencia está en curso y la página **aún no está completada**, el índice muestra badge **En vivo** en esa fila (también en portada). Tras confirmar (página completada), el badge desaparece. No usa la línea lateral de página actual.

## Criterios de Aceptación

**Escenario: Camino feliz — confirmar en ventana**

**Escenario: Sin autoasistencia — la desbloquea el creador**

**Dado** que el recurso de asistencia tiene Autoasistencia desactivada
**Cuando** Luis abre esa página dentro de la ventana de la sesión
**Entonces** no ve el botón «Confirmar», sino el aviso de que su administrador confirma la asistencia
**Y** la página sigue sin completarse, así que no puede avanzar ni terminar el contenido
**Cuando** el creador carga su asistencia desde Resultados → Asistencias y Luis vuelve al contenido
**Entonces** esa página aparece finalizada y el avance queda liberado

**Dado** que Luis está en la página de asistencia durante el horario de una sesión
**Cuando** pulsa Confirmar
**Entonces** ve un toast de éxito
**Y** el control de esa sesión muestra StatusTag «Confirmado»
**Y** al hacer hover sobre Confirmado ve un tooltip con la fecha y hora a la que confirmó
**Y** puede Continuar o navegar según el tipo de navegación del contenido

**Escenario: Camino feliz — sesión en curso**

**Dado** que Luis abre la página de asistencia y una sesión está dentro de su ventana
**Y** aún no ha confirmado esa sesión
**Cuando** mira la card de esa sesión
**Entonces** la card se destaca como «Está ocurriendo»
**Y** ve una cuenta regresiva hasta el fin de la ventana
**Y** el botón Confirmar está habilitado

**Escenario: Camino feliz — añadir sesión futura al calendario**

**Dado** que Luis ve una sesión cuya ventana aún no inicia
**Cuando** pulsa «Añadir a mi calendario» y elige un calendario
**Entonces** se abre o descarga el evento con el título, horario e instrucciones de la sesión
**Y** no se marca la asistencia como confirmada

**Escenario: Caso borde — ventana ya cerrada**

**Dado** que Luis ve una sesión cuya ventana ya expiró
**Cuando** mira la fila de esa sesión
**Entonces** ve el StatusTag «Expirado»
**Y** no tiene Confirmar ni «Añadir a mi calendario»

**Escenario: Camino feliz — índice con sesión en vivo**

**Dado** que Luis está en la portada o en recursos de un Evento con página de asistencia
**Y** al menos una sesión tiene la ventana abierta
**Cuando** mira el índice
**Entonces** la fila de asistencia muestra el badge «En vivo»
**Y** el badge desaparece cuando esa página queda completada (confirmó asistencia)
**Y** no aparece la línea lateral de página actual solo por estar en vivo

**Escenario: Camino negativo — intentar ir a Fin sin confirmar**

**Dado** que Luis no ha confirmado ninguna asistencia
**Cuando** intenta avanzar a Fin del contenido (lineal o libre)
**Entonces** no se activa el cierre
**Y** se le indica que aún no completó las páginas requeridas
