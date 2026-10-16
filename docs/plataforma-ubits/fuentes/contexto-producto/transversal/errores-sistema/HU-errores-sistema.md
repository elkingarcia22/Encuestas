# HU: Errores de sistema (404, sin acceso, offline, licencia, servidor)

## Contexto

Cuando la plataforma no puede mostrar el contenido esperado (URL inválida, contenido sin matrícula, sin red, licencia vencida o fallo del servidor), el usuario necesita un mensaje claro y una acción concreta — o ninguna, si no hay nada que hacer — sin el chrome habitual del Workspace. En particular, un contenido que **sí existe** pero al que el colaborador aún no tiene acceso no debe verse como «página no encontrada».

## Historia de Usuario

**Como** colaborador o admin de UBITS,
**quiero** ver pantallas de error comprensibles cuando algo falla o no tengo acceso,
**para** saber qué pasó y qué puedo hacer a continuación (volver, reintentar o cerrar sesión).

## Alcance

**Incluye:**
- Error 404: recurso o página que **no existe**; CTA **Volver al inicio**.
- Sin acceso al contenido: el contenido **existe** pero el colaborador aún no lo tiene disponible (p. ej. sin matrícula); CTA **Volver al inicio**.
- Sin conexión a internet: CTA **Volver a intentar**.
- Licencia / acceso terminado: CTA **Cerrar sesión**.
- Error 500 / 503 / 504: mensaje de error inesperado **sin** CTA.

**Excluye:**
- Empty states de listas/filtros (eso es Empty State).
- Toasts o alerts inline de formularios.
- Páginas de mantenimiento programado (si existieran aparte).
- Detalle técnico de códigos HTTP en la UI (el usuario no ve «403» ni «permisos»).

## Reglas de Negocio

- **RN-01:** Las pantallas de error de sistema son a pantalla completa: ilustración a la izquierda y copy + acción a la derecha. En móvil se apilan y el texto (título, descripción y CTA) va centrado.
- **RN-02:** El copy visible es el acordado en producto / Figma Errores (o el copy humano de «sin acceso»); no parafrasear títulos ni cuerpos en implementaciones.
- **RN-03:** En 404, la segunda frase del cuerpo va en énfasis (negrita/semibold).
- **RN-04:** El error de servidor (500/503/504) no ofrece botón; el usuario debe volver más tarde.
- **RN-05:** Licencia vencida invita a HR a contactar para renovar; el colaborador solo puede cerrar sesión.
- **RN-06:** Si el contenido existe pero el colaborador no tiene acceso, se muestra **sin acceso** (no 404). El mensaje no usa tecnicismos (ni códigos HTTP, ni «permisos», ni «matrícula» en jerga de sistemas).
- **RN-07:** La pantalla de sin acceso reutiliza la misma ilustración que licencia vencida (`acceso-bloqueado.svg`).

## Criterios de Aceptación

**Escenario: Página no encontrada**

**Dado** que el usuario abre una URL que no existe en la plataforma
**Cuando** se muestra el error 404
**Entonces** ve el título «No encontramos esta página»
**Y** el cuerpo con la indicación de verificar la URL (última frase en énfasis)
**Y** el botón «Volver al inicio»

**Escenario: Contenido existente sin acceso**

**Dado** que el colaborador abre un contenido que existe en la plataforma
**Y** aún no tiene ese contenido disponible en su aprendizaje
**Cuando** se muestra la pantalla de sin acceso
**Entonces** ve el título «Sin acceso a este contenido»
**Y** un mensaje claro de que el contenido existe pero no está disponible para la persona
**Y** la sugerencia de hablar con su líder o con recursos humanos si cree que debería verlo
**Y** el botón «Volver al inicio»
**Y** no ve códigos HTTP ni palabras como «permisos» o «error 403»

**Escenario: Sin conexión**

**Dado** que no hay conectividad de red
**Cuando** se muestra el estado offline
**Entonces** ve «Sin conexión a internet» y el mensaje de revisar la red
**Y** el botón «Volver a intentar»

**Escenario: Acceso / licencia terminada**

**Dado** que la licencia o el acceso de la empresa ya no está activo
**Cuando** se muestra la pantalla de acceso terminado
**Entonces** ve «Tu acceso a UBITS ha terminado» y el mensaje orientado a HR
**Y** el botón «Cerrar sesión»

**Escenario: Error inesperado del servidor**

**Dado** que el servidor responde con fallo 500, 503 o 504
**Cuando** se muestra la pantalla de error
**Entonces** ve «¡Ups!, ha ocurrido un error» y el mensaje de intentar más tarde
**Y** no hay botón de acción
