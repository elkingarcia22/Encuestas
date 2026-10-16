# HU: Crear evento LMS (asistente gemelo de crear contenido)

## Contexto

Las formaciones en sitio (inducción presencial, simulacros, talleres ILT) no caben bien como un «curso» genérico: el tipo Evento deja claro que hay asistencia que registrar. Ana necesita el mismo asistente de publicación, sin elegir tipo a mano, y con el recurso Asistencia disponible solo aquí.

## Historia de Usuario

**Como** creadora de contenidos LMS,
**quiero** crear un Evento con el mismo asistente de Información básica, Recursos, Certificado y Ajustes, sin elegir tipo de contenido,
**para** publicar formaciones en sitio con recurso de asistencia y el resto de páginas que necesite.

## Pantallas en el prototipo

Cada pantalla del flujo tiene su dirección en el playground UX (en local, `http://localhost:5173` + la dirección). Si se abre directo con el borrador vacío, carga el curso de ejemplo «Resolución efectiva de conflictos en equipos de trabajo» para seguir el flujo desde ahí.

| Pantalla | Dirección | Qué se ve |
|---|---|---|
| Paso Portada (sin tipo) | [`/admin/aprendizaje/lms-creator/crear-evento#portada`](http://localhost:5173/admin/aprendizaje/lms-creator/crear-evento#portada) | Ficha técnica sin «Tipo de contenido» |
| Paso Recursos (con Asistencia) | [`/admin/aprendizaje/lms-creator/crear-evento#recursos`](http://localhost:5173/admin/aprendizaje/lms-creator/crear-evento#recursos) | «Añadir página» ofrece Asistencia |
| Agregar asistencia | [`/admin/aprendizaje/lms-creator/agregar-recurso/asistencia`](http://localhost:5173/admin/aprendizaje/lms-creator/agregar-recurso/asistencia) | Modal de instrucciones y sesiones |
| Paso Ajustes | [`/admin/aprendizaje/lms-creator/crear-evento#ajustes`](http://localhost:5173/admin/aprendizaje/lms-creator/crear-evento#ajustes) | Mismo tablero que en Crear contenido |

## Alcance

**Incluye:**
- Entrada «Crear evento» en el menú del botón Crear contenido del listado.
- Asistente de 4 pasos idéntico a Crear contenido (HU-LMS-001), con título «Crear evento».
- Portada: ficha técnica **sin** el campo Tipo de contenido (el tipo es Evento).
- Recursos: card Asistencia habilitada (HU-LMS-025). El resto de tipos igual que Crear contenido.

**Excluye:**
- Crear contenido genérico (HU-LMS-001): ahí Asistencia no aparece.
- Edición publicada (HU-LMS-002), salvo que el contenido ya sea tipo Evento.
- Detalle del setup de asistencia (HU-LMS-025).

## Reglas de Negocio

- **RN-01:** Desde el listado, el menú del botón primario incluye tres opciones: Crear contenido, Crear ruta de aprendizaje y Crear evento.
- **RN-02:** Crear evento replica el asistente de Crear contenido (mismos 4 pasos, mismos campos salvo tipo).
- **RN-03:** En Portada no se muestra «Tipo de contenido». El contenido nace como Evento. Completar Portada no exige elegir tipo.
- **RN-04:** En Recursos de Crear evento (Añadir página y página vacía) aparece la card Asistencia. En Crear contenido no aparece.
- **RN-05:** Al publicar o volver al listado, el ítem se trata como cualquier contenido LMS (pin, visibilidad, edición posterior). En edición publicada de un Evento, Portada sigue sin el campo Tipo (HU-LMS-002 RN-13).
- **RN-06:** Demo playground: `f021` «Protocolos de Supervivencia y Seguridad ante Sismos» es un Evento (tiene recursos de asistencia: fundamentos, simulacro y taller). En el listado, U. corporativa y experiencia de estudio el tipo visible es **Evento**, no Curso.

## Criterios de Aceptación

**Escenario: Camino feliz — entrar a Crear evento**

**Dado** que Ana está en el listado de contenidos
**Cuando** abre el menú del botón Crear contenido y elige Crear evento
**Entonces** entra al asistente con título «Crear evento»
**Y** el paso Información básica muestra ficha técnica sin el selector de tipo de contenido

**Escenario: Camino feliz — avanzar a Recursos con Asistencia**

**Dado** que Ana completa Portada en Crear evento
**Cuando** llega a Recursos y abre Añadir página
**Entonces** ve la card Asistencia junto a los demás tipos habilitados
**Y** puede montar una página de asistencia

**Escenario: Caso borde — Crear contenido no ofrece Asistencia**

**Dado** que Ana abre Crear contenido (no Crear evento)
**Cuando** ve Añadir página o el selector de una página vacía
**Entonces** no aparece la card Asistencia

**Escenario: Camino negativo — Portada incompleta sigue bloqueando el avance**

**Dado** que Ana está en Portada de Crear evento sin título
**Cuando** intenta avanzar a Recursos
**Entonces** no avanza
**Y** no se le pide tipo de contenido porque ese campo no existe en este flujo
