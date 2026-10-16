# Resultados de un contenido — lo que hay hoy (recorrido del 13-oct-2026)

Notas de campo para diseñar la pantalla de Resultados de `playground-ux`. Recorridas las cuatro
referencias, pantalla por pantalla y clic por clic.

## 1. Producción · contenido normal (`208217/stats`)

**Marco:** riel izquierdo con Resultados · Información · Recursos · Certificado · Configuración, y
«Volver al inicio» abajo.

**Cabecera:** título del contenido · selector **«Rango de fechas»** con calendario (13/09–13/10) ·
bajada «Consulta los resultados, el progreso, las evaluaciones y encuestas de este contenido. La
información se actualiza cada 3 horas.»

**Fila de datos:** Estudiantes inscritos 7 · Publicado el 4 de febrero de 2026 · Visibilidad actual
[Publicado] · barra **Finalización 7/7 | 100%** con su (i).

**Pestañas:** Progreso · Evaluaciones · Gestión de intentos · Descargas.

| Pestaña | Qué trae |
|---|---|
| Progreso | «Progreso 7/7», lupa y «Descargar». Tabla: Nombre · Email · Fecha de inicio · Fecha de finalización · Progreso (barra + %) · Nota final |
| Evaluaciones | «Evaluaciones 7/7». Tabla: Nombre del usuario · Usuario · **Evaluación (i) 100%** (una columna por evaluación, con su peso) · Nota final. Celda: «**Aprobado** con 100%» |
| Gestión de intentos | Vacío: «Sin bloqueos por intentos — Ningún estudiante ha alcanzado el límite de intentos en este contenido» |
| Descargas | Buscador «Busca un estudiante». Tabla: Título · Tipo · Participantes · **Reporte [✉ Solicitar]** |

## 2. Producción · contenido con roleplay (`222112/stats`)

**Las pestañas cambian con lo que trae el contenido:** aquí son Progreso · **Roleplay** · Descargas.
Sin Evaluaciones ni Gestión de intentos, porque no tiene evaluación.

| Pestaña | Qué trae |
|---|---|
| Roleplay | **Selector «Roleplay: [Llamada con Lucía Herrera ▾]»** para elegir cuál. «Resultados de roleplay 4 de 4», lupa y «Descargar». Tabla: Estudiante · Estado (badge Aprobado / No aprobado) · Objetivos (0/4) · Fecha con hora |
| Descargas | Solo **encuestas y evaluaciones** —aquí «Encuesta de cierre»—. El roleplay no aparece: tiene su propio «Descargar» en su pestaña |

**Drawer «Detalle del intento»** (clic en una fila):
- Nombre y correo del estudiante.
- **Selector de intento**: «Intento 2 - 9 de octubre a las 2:48 p. m.».
- **Dos pestañas: Resultados | Conversación.**
- Resultados: «0 de 4 objetivos alcanzados» + badge + barra; por objetivo, título, badge
  (Alcanzado / No alcanzado), **PUNTOS POSITIVOS** y **ÁREAS DE MEJORA**.
- Conversación: la transcripción en burbujas con hora y copiar por mensaje; arriba, botón de
  descarga que **solo** sale en esta pestaña.

## 3. Playground React · contenido completo (`f007`)

Pantalla inmersiva (X para cerrar) con riel: Resultados · Portada · Recursos · Certificado ·
Ajustes. Cabecera: título · badge «Público» · «Resultados» · **«Últimos 30 días ▾»** (un rango con
presets, no un calendario). Caja gris con Estudiantes inscritos · Publicado el · barra de
Finalización.

**Pestañas (las seis):** Progreso · Evaluaciones · Gestión de intentos · Descargas · Asistencias ·
Roleplay. **No hay pestaña de Encuestas**: las encuestas viven en Descargas.

| Pestaña | Qué trae de más que producción |
|---|---|
| Progreso | **Avatar** por fila y **orden por columna** (↕). «No ha finalizado» en vez de fecha vacía. Barra **verde al 100 %**, azul si va a medias |
| Evaluaciones | La celda dice **cuántas preguntas acertó**: «Aprobado con 80% (4 de 5 preguntas)». Estados **Aprobado / Fallido / Pendiente**. Columna «Final ponderada» |
| Gestión de intentos | Nota «Desbloquear otorga 1 intento más a cada usuario». Tabla **con casillas**: Nombre · Email · Nombre de la evaluación · Fecha de bloqueo · Acciones [Desbloquear] |
| Descargas | «Descarga los reportes por cada uno de los siguientes recursos». Tabla: Título del recurso · Participantes · Reporte **[Descargar]** (aquí descarga, no «Solicitar») |
| Roleplay | **Una fila por intento**, no por estudiante: Usuario · Fecha del intento · Intento · Resultado de la interacción («4 de 4 objetivos alcanzados») · Resultado del intento (badge) |

**Drawer «Detalle del intento»:** nombre, correo y «20 de septiembre, 4:45 PM · Intento 2»; botón
**«Descargar transcripción»**; «4 de 4 objetivos alcanzados» con barra; y la tarjeta de cada
objetivo con sus puntos positivos y áreas de mejora. **Sin pestañas y sin conversación**: la fila ya
es un intento concreto.

## 4. Playground React · evento (`f021`)

Igual, más la pestaña **Asistencias** y sin Roleplay.

| Pestaña | Qué trae |
|---|---|
| Asistencias | **Dos selectores**: la página de asistencia y la sesión. Contador, lupa, «Descargar» y el primario **«+ Cargar asistencias»**. Tabla con casillas: Usuario · Username · Modo de confirmación («Autoconfirmación») · Fecha y hora de confirmación |

## Lo que decide qué pestañas se ven — corregido (2.ª pasada)

**En producción sí depende de lo que trae el contenido** (`222112` no tiene Evaluaciones ni Gestión
de intentos porque no tiene evaluación).

**En el playground React, no.** `f007` muestra **Asistencias** aunque no tenga ninguna, y esa
pestaña abre su propio vacío: «No hay páginas de asistencia — Añade una página de asistencia en
Recursos para consultar o cargar asistentes.» Lo único que de verdad cambia es **Roleplay**, que sale
en `f007` y no en `f021`.

Para nuestro diseño: **la pestaña se muestra si el contenido puede tenerlo, y si está vacía se
explica con un vacío que diga qué hacer.** Es mejor que esconderla, porque una pestaña que aparece y
desaparece entre contenidos hace que nadie sepa dónde buscar.

### Lo que no cuadra entre los dos playgrounds React

| | `f007` (curso) | `f021` (evento) |
|---|---|---|
| Pestañas | 6 (con Roleplay) | 5 (sin Roleplay) |
| Progreso | con **avatar** por fila | con avatar; **sin «Nota final»** |
| Evaluaciones | Nombre · Email · col. por evaluación · Final ponderada | **sin Email**: Nombre · Evaluación · Final ponderada |
| Gestión de intentos | con casillas y «Desbloquear» | igual, con «Descargar» en la cabecera |

Producción sí tiene **«Nota final»** en Progreso; el playground React la quitó.

## Drawer «Detalle del progreso» (clic en una fila de Progreso, `f007`)

Lo que falta para cerrar el recorrido. Se abre al pulsar **cualquier fila** de la tabla de Progreso.

- **Cabecera:** título fijo «Detalle del progreso» y la X.
- **Cuerpo, primera línea:** nombre de la persona, su correo debajo y una **barra de avance con el
  porcentaje a la derecha** (45 %).
- **El temario entero, por secciones**, cada una en un acordeón abierto («Sección 1: Fundamentos»,
  «Sección 2: Herramientas para resolver conflictos»). Dentro, una fila por recurso con:
  - el **icono del tipo** de recurso a la izquierda,
  - el nombre y, debajo, «Completada: 11 oct 2026 · 10:27»,
  - la insignia **«Ocultа · 12 oct 2026»** si el recurso está oculto,
  - a la derecha, el **estado**: ✓ verde completado · candado bloqueado · el recurso **en curso**
    resaltado (texto azul, barra azul a la izquierda de la fila y su icono en azul).

Es el mismo temario del contenido, pero leído desde la persona: sirve para ver **dónde se quedó**.

---

# 5. La propuesta de Elkin · Resultados de una encuesta (leída en el código)

`src/modules/admin/desempeno-cultura/encuestas/resultados/` — 8.913 líneas, 31 archivos.
Recorrida a mano la primera vez y **releída en el código** la segunda, porque a ojo se me
escaparon tres pestañas enteras.

## Las pestañas: ocho, en cuatro juegos

No es una lista fija: el juego cambia con el tipo de encuesta.

| Tipo | Pestañas |
|---|---|
| Clima (normal) | Participación · **Favorabilidad** · Preguntas · eNPS · Análisis con IA · Accionables |
| eNPS | Participación · eNPS · Preguntas · IA · Accionables |
| NOM 035 · riesgo | Participación · **Riesgo psicosocial** · Preguntas · IA · Accionables |
| NOM 035 · acontecimientos | Participación · **Canalización** · Preguntas |

Y si la pestaña que pide la URL no existe en esa encuesta, se abre la primera. Buen detalle para
copiar: un enlace viejo nunca deja la pantalla en blanco.

## El marco de la pantalla

`PageShell` con `PageHeader`, y **las pestañas van en la ranura `tabs` de la cabecera**, pegadas
al título, no sueltas sobre el contenido. La cabecera lleva:

- **`back`** «Encuestas» · **título** · **insignia de estado**
- **`meta`**: una fila de icono+texto bajo el título — tipo · fechas · invitados · Anónima/Pública
- **`actions`**: `[Vista previa]` (outline) + `[Descargar]` (primario)

El botón de Descargar **cambia solo cuando hay algo preparándose**: pasa a `Spinner` +
«Preparando reporte». No hay barra flotante: todo vive en la cabecera y en la tabla.

## La anatomía que se repite en cada pestaña

Esto es lo que hace que las seis se lean igual, y es lo más reutilizable de toda su propuesta:

1. **`TarjetaResumen`** arriba — `FilaIndicadores` de **tres columnas** con divisores:
   - *La cifra de la pestaña* + su anillo o medidor + línea gris de detalle («Buena · 7 de 15 · meta 70%»)
   - *El reparto* + dona + el detalle tramo por tramo
   - *El top 3* (en singular, «Área más desfavorable») + barras mini + el detalle
   Cada columna lleva su **(i) «Qué mide»** con la fórmula escrita.
2. **Un `SelectorVista`** cuando la pestaña tiene varias lecturas (pestañas subrayadas sobre la caja).
3. **La tabla o la grilla** dentro de `PageSection` con su título y, a la derecha, **«Ver por»**.

El **«Ver por»** (el demográfico: área, sede, líder, colaborador) **se comparte entre pestañas**:
pasar de participación por área al mapa de calor por área es un solo pensamiento.

## Pestaña por pestaña

| Pestaña | Qué responde | Qué trae |
|---|---|---|
| **Participación** | ¿quién respondió y quién falta? | Resumen + **anillos que filtran la tabla al tocarlos**. Tabla por grupos (Respondieron x/y · En progreso · Faltan · barra de Participación) o **por persona** (Correo · Líder · Área · Estado). Menú por fila: Enviar recordatorio · Copiar correo · Descargar quiénes faltan. Con filas marcadas, la cabecera ofrece **«Enviar recordatorio a N personas»**, y el recordatorio **nunca cuenta a quien ya respondió** |
| **Favorabilidad** | ¿qué tan bien salió y dónde? | Resumen (Favorables · Neutrales · Desfavorables · **NS/NR**) + dos vistas: **Secciones** y **Mapa de calor** por demográfico. Tocar un anillo resalta ese grupo en Secciones |
| **Preguntas** | ¿qué respondió la gente, una por una? | **Tres vistas conectadas**: *Detalle por secciones* (recuentos) · *Respuestas por persona* · *Comentarios*. Desde el recuento de una opción se salta a **quién la eligió**; desde una abierta, a sus comentarios. Arriba, el **sentimiento promedio**, que se mueve si corriges la lectura de la IA |
| **eNPS** | ¿recomiendan? | Puntaje con **medidor** (no anillo), mezcla promotores/pasivos/detractores y desglose |
| **Análisis con IA** | ¿qué significa? | Primero lo que **afirma** la IA (hallazgos, riesgos, qué hacer) y después **la evidencia**: prioridades, fortalezas, brechas entre grupos y la voz de la gente. Cada hallazgo con su **nivel de confianza**. Enlaces que **llevan a la pestaña** que lo explica |
| **Accionables** | ¿y ahora qué hago? | Catálogo de acciones con impacto, estanterías por tema y activación; detalle en panel |
| **Riesgo psicosocial** | (NOM 035 Guía III) | Niveles de riesgo en vez de favorabilidad |
| **Canalización** | (NOM 035 Guía I) | Lista de personas a canalizar |

## El drawer de descargas — «Reportes de resultados»

`DrawerShell` con **dos pestañas a propósito**:

> «**Reportes** es configuración (el próximo archivo) y **Descargas** es estado (lo ya pedido y
> cuánto le falta).»

**Cinco tipos de reporte**, cada uno con icono de formato, título, descripción y su tiempo de
preparación:

| Reporte | Qué trae |
|---|---|
| Reporte general (**PDF**) | Visual: favorabilidad, heatmaps, eNPS, brechas y análisis IA |
| Resultados generales (**XLSX**) | La data completa, por hojas |
| Comentarios (**XLSX**) | Las abiertas con su pregunta, tema, sentimiento y segmento |
| Preguntas (**XLSX**) | Una hoja por pregunta con todas sus respuestas |
| Respuestas (**XLSX**) | **Una fila por participante** con todo lo que respondió |

Al elegir el PDF se abren sus **8 secciones**, cada una con interruptor y su propio selector:
Verificación de la medición · Participación · Favorabilidad por secciones · Heatmap por
demográficos · Detalle de preguntas · eNPS · Brechas · Análisis IA. Cada bloque **elige sus
propios cortes** (no hay un selector global), y cuando un bloque se queda sin selección el panel
**dice qué va a pasar**: «Sin demográficos solo se imprime la cobertura general» o «Elige al menos
un demográfico o este bloque no se imprime».

Dos reglas suyas que valen para cualquier descarga nuestra:

- **El anonimato manda sobre el formato.** El PDF viaja por correo sin control de acceso, así que
  **no ofrece cortes por líder** (serían personas con nombre).
- **Las descargas viven en la pantalla, no en el panel**: cerrar el panel **no detiene** un reporte
  a medio preparar, y el reporte terminado aparece en el **Centro de procesos** de las
  notificaciones, cuyo «Ver» reabre el panel directo en la pestaña «Descargas».

## Lo que vale la pena robarle para Resultados de un contenido

1. **La anatomía de pestaña** (resumen de 3 columnas → selector de vista → tabla en `PageSection`
   con «Ver por»): es lo que hace que seis pestañas distintas se lean como una sola pantalla.
2. **`TarjetaResumen` tal cual**, con nuestras cifras.
3. **Las pestañas en la cabecera** (`PageHeader tabs`), con el botón de descargar que se vuelve
   «Preparando reporte».
4. **El drawer de dos pestañas** Reportes | Descargas, en vez del «✉ Solicitar» de producción que
   no te dice nunca en qué quedó.
5. **El (i) con la fórmula** en cada cifra.
6. **Los anillos que filtran la tabla** al tocarlos.
7. **Que una pestaña vacía explique qué hacer**, en vez de desaparecer.
