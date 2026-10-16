# HU: Experiencia de estudio (consumo de contenido)

## Contexto

Una vez publicado un contenido en LMS Creator, el colaborador debe recorrerlo página a página hasta el cierre (y certificado si aplica). Meta: completar el recorrido sin confundirlo con el tutor de Modo estudio IA.

## Historia de Usuario

**Como** colaborador de mi empresa,
**quiero** consumir un contenido estructurado con portada, páginas y cierre,
**para** completar mi formación asignada y obtener certificado cuando el contenido lo tenga.

## Alcance

**Incluye:**
- Entrada con id de contenido (desde home/búsqueda u otros puntos que sí navegan).
- Recorrido portada → recursos (video, SCORM, PDF, evaluaciones, asistencia si es Evento) → cierre.
- Badge de tipo en portada según el catálogo (`Curso`, `Evento`, etc.).
- Navegación Lineal (default) o Libre según Ajustes del contenido (`?nav=libre` en el playground); detalle en HU-APR-007.
- Estados de evaluación (“Vas a iniciar una evaluación”, “Continúa tu evaluación”, “¡Aprobaste!”, “¡No aprobaste!”, “Se ha agotado el tiempo límite”, “No hay preguntas en esta evaluación”).
- Certificado cuando el contenido lo habilita.

**Excluye:**
- Modo estudio IA (tutor chat).
- Edición del contenido (creador).
- Entrada desde cards de Zona de estudio (hoy no navegan aquí). U. Corporativa sí navega a esta experiencia.

## Reglas de Negocio

- **RN-01:** Experiencia de estudio ≠ Modo estudio IA; no se presentan como el mismo flujo.
- **RN-02:** No es una entrada del menú principal de Aprendizaje; se abre con un contenido concreto.
- **RN-03:** Si no viene id de contenido, se carga el contenido demo por defecto (f007) con recorrido completo — no una pantalla vacía.
- **RN-04:** Si el id no existe (distinto del demo), se muestra “No se encontró el contenido «…».”
- **RN-05:** El certificado se ofrece salvo que el contenido lo deshabilite explícitamente (`conCertificacion = false`).
- **RN-06:** En el índice, el ícono de estado de cada página (check, spinner o candado) muestra tooltip al hover: **Visto**, **Pendiente** o **Bloqueado**.
- **RN-07:** Si una página tipo asistencia tiene alguna sesión presencial con ventana abierta y **aún no está completada**, el índice muestra badge **En vivo** en esa fila (sin línea lateral de página actual).
- **RN-08:** Si el creador publicó una página de evaluación **sin preguntas**, el colaborador no ve bienvenida ni intento: ve la misma card informativa de evaluación (ícono info, “No hay preguntas en esta evaluación” / “Puedes continuar a la siguiente página.”) y **Continuar** avanza a la siguiente página, marcando esta como completada. No consume intentos ni pide nota. (HU-LMS-010).
- **RN-09:** El badge de tipo en la portada replica `tipoContenido` del catálogo. Un Evento (p. ej. `f021`) muestra **Evento**, no Curso.

## Criterios de Aceptación

**Escenario: Tooltip de estado en el índice**

**Dado** que María está recorriendo un contenido y ve el índice
**Cuando** pasa el cursor sobre el ícono de estado de una página
**Entonces** ve el tooltip **Visto**, **Pendiente** o **Bloqueado** según el ícono (check, spinner o candado)

**Escenario: Camino feliz — recorrer contenido con certificado**

**Dado** que María abre un contenido publicado con certificación habilitada
**Cuando** completa las páginas requeridas hasta el cierre
**Entonces** puede acceder al certificado del contenido
**Y** su progreso refleja la completitud

**Escenario: Caso borde — sin id (demo por defecto)**

**Dado** que se abre Experiencia de estudio sin id de contenido
**Cuando** carga la vista
**Entonces** muestra el recorrido del contenido demo por defecto
**Y** no deja una pantalla vacía sin explicar

**Escenario: Caso borde — evaluación publicada sin preguntas**

**Dado** que el creador publicó un contenido con una página de evaluación sin ninguna pregunta
**Cuando** María abre esa página en Experiencia de estudio
**Entonces** ve el mensaje “No hay preguntas en esta evaluación”
**Y** el texto le indica que puede continuar a la siguiente página
**Y** al pulsar Continuar avanza a la siguiente página
**Y** no se le pide responder ni se descuenta un intento

**Escenario: Camino negativo — id desconocido**

**Dado** que se abre Experiencia de estudio con un id que no existe
**Cuando** carga la vista
**Entonces** ve el mensaje de que no se encontró el contenido
**Y** no se inventan páginas de un curso inexistente

**Escenario: Camino feliz — Evento muestra tipo Evento**

**Dado** que Luis abre `f021` «Protocolos de Supervivencia y Seguridad ante Sismos»
**Cuando** ve la portada de experiencia de estudio
**Entonces** el badge de tipo dice **Evento**
**Y** no dice Curso
