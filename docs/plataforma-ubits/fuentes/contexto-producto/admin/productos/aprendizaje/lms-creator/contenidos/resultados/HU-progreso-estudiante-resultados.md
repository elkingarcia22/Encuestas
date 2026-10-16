# HU: Ver páginas recorridas del estudiante en Resultados

## Contexto

Tras editar un contenido, el progreso de un estudiante puede verse afectado. El creador necesita evidencia de qué páginas vio la persona, cuándo las vio y si hoy están visibles, para entender un hueco de avance sin entrar a la experiencia de estudio del colaborador.

## Historia de Usuario

**Como** creador de contenidos LMS,
**quiero** abrir el progreso de un estudiante inscrito y ver, por cada página, su estado, visibilidad y fechas,
**para** acompañar reclamos de progreso y relacionar páginas faltantes con una edición del contenido.

## Alcance

**Incluye:**
- Sección Resultados de Editar contenido (contenido publicado), tab **Progreso**.
- Tabla de estudiantes inscritos (nombre, email, fechas de inicio/fin, % de progreso).
- Clic en una fila → drawer **Progreso del estudiante** (solo lectura) con el índice del contenido.
- Por página: nombre; estado (ícono check / spinner / candado con tooltip **Visto** / **Pendiente** / **Bloqueado**); si está oculta, tag **Oculta · fecha** (mismo ícono que Ocultar en Páginas Creator); **Completada:** si aplica.
- Las páginas ocultas del contenido **sí aparecen** en el drawer. Una página visible **no** muestra tag de visibilidad.
- La fecha de publicación del contenido no va en la fila: vive en la cabecera de Resultados (HU-LMS-013).

**Excluye:**
- Página Progreso del colaborador / vista líder (HU-APR-006).
- Consumo o navegación del estudiante en Experiencia de estudio (HU-APR-004, HU-APR-007).
- Cabecera de Resultados, KPI, periodo y tabs Evaluaciones / Gestión de intentos / Descargas (HU-LMS-013).
- Recálculo de progreso por cambios estructurales (HU-LMS-002, Impacto en el progreso).
- Cómo se persisten o sincronizan los timestamps en backend (en el playground son datos de demostración).

## Reglas de Negocio

- **RN-01:** El tab Progreso de Resultados lista a los estudiantes inscritos en el contenido para el periodo seleccionado; la información de Resultados se actualiza cada 3 horas (copy de la sección).
- **RN-02:** Al hacer clic en una fila de la tabla Progreso se abre el drawer «Progreso del estudiante» con el nombre del estudiante como subtítulo.
- **RN-03:** El drawer es de solo lectura: no permite navegar, marcar ni desmarcar páginas como si fuera el colaborador.
- **RN-04:** El índice del drawer muestra **todas** las páginas del contenido, incluidas las ocultas. Solo las ocultas llevan tag de visibilidad: **Oculta · DD mmm AAAA** (p. ej. `Oculta · 12 ago 2026`), con el mismo ícono de ojo tachado que Ocultar en Páginas Creator. Las páginas visibles no muestran tag (como en el índice Creator).
- **RN-05:** El número de páginas Visto corresponde al % de progreso de la fila (redondeo al entero más cercano de páginas del índice del drawer). Al 100% todas quedan Visto; al 0% ninguna.
- **RN-06:** Si el progreso está entre 1% y 99%, la siguiente página después de las Visto se muestra como Pendiente (spinner); las posteriores, Bloqueado. Una página **Oculta** que el estudiante no completó se muestra Bloqueado (no Pendiente).
- **RN-07:** Cada página Visto muestra **Completada:** con fecha y hora (formato humanizado, p. ej. `21 jun 2026 · 10:24`). Pendiente y Bloqueado no muestran esa meta.
- **RN-08:** Si el estudiante tiene fecha de finalización del contenido y está al 100%, la última página Visto se alinea con esa fecha de fin.
- **RN-09:** Este índice no es la Experiencia de estudio ni el índice de Recursos al crear: no hay clic para abrir recursos, no se aplica Tipo de navegación (Lineal/Libre) y **no** hay botón de descripción de sección. Esa info es para el colaborador en estudio y para el creador al editar Recursos.
- **RN-10:** El ícono de estado a la derecha (check, spinner o candado) muestra tooltip al hover: **Visto**, **Pendiente** o **Bloqueado**, en ese orden.
- **RN-11:** La fila **no** muestra fecha de publicación ni “disponible desde”. Esa fecha del contenido ya está en la cabecera de Resultados.
- **RN-12:** Una página Visto que luego se oculta permanece Visto. Debajo del título va primero **Completada:** y debajo el tag **Oculta · fecha**. La fecha de **Completada** es siempre **anterior** a la de **Oculta** (el estudiante la vio mientras estaba visible; el creador la ocultó después).

## Criterios de Aceptación

**Escenario: Tooltip de estado en el índice**

**Dado** que Ana tiene abierto el drawer Progreso del estudiante
**Cuando** pasa el cursor sobre el ícono de estado de una página
**Entonces** ve el tooltip **Visto**, **Pendiente** o **Bloqueado** según el ícono (check, spinner o candado)

**Escenario: Camino feliz — ver páginas de un estudiante en curso**

**Dado** que Ana edita un contenido publicado con varias páginas
**Y** el estudiante “Carlos Pérez” aparece en Resultados → Progreso con 50% y sin fecha de finalización
**Cuando** hace clic en la fila de Carlos
**Entonces** se abre el drawer «Progreso del estudiante» con el nombre de Carlos
**Y** las páginas visibles no muestran tag de visibilidad
**Y** las páginas Visto muestran Completada con fecha y hora
**Y** ve una página Pendiente y el resto Bloqueado
**Y** no puede abrir ni marcar páginas desde el drawer

**Escenario: Caso borde — página oculta que ya había visto**

**Dado** que Carlos ya había completado una página
**Y** Ana ocultó esa página después
**Cuando** Ana abre el progreso de Carlos
**Entonces** esa página aparece como Visto
**Y** muestra Completada y, debajo, el tag **Oculta ·** la fecha en que Ana la ocultó

**Escenario: Caso borde — estudiante al 100%**

**Dado** que “Laura Gómez” tiene 100% y fecha de finalización en la tabla
**Cuando** Ana abre su progreso
**Entonces** las páginas visibles aparecen como Visto
**Y** cada Visto muestra Completada
**Y** la última página Visto coincide con la fecha de fin del contenido

**Escenario: Camino negativo — estudiante al 0% o sin avance**

**Dado** que un estudiante inscrito tiene 0% de progreso
**Cuando** Ana abre su fila
**Entonces** ninguna página aparece como Visto
**Y** no se muestran fechas Completada por página
**Y** una página Oculta sin Visto muestra solo el tag Oculta · fecha
