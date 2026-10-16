# Vocabulario fijo (UI — español neutro)

Usar estos nombres en copy de producto y en HUs. No inventar sinónimos en pantalla.

## Roles y personas

| Término UI | Notas |
|------------|--------|
| Colaborador | Learner / empleado de la empresa cliente (demo: María Alejandra Sánchez Pardo, E006) |
| Administrador | Admin HR / admin de plataforma en empresa |
| Creador | Quien arma contenidos en LMS Creator (persona demo en HUs: Ana) |
| Agentes | Landing de IA para HR (Soporte técnico, Modo estudio AI, Plan de formación). **No** aparece en el sidenav colaborador; se abre por URL directa. **v1:** si el colaborador tiene colecciones visibles, el superagente es el primer agente de esta landing (decisión revisable). |

## Aprendizaje

| Término UI | Notas |
|------------|--------|
| Aprendizaje | Módulo del colaborador |
| Zona de estudio | Planes asignados + exclusivo + historial (tabs) |
| Progreso | Página aparte con KPIs, equipo y rankings (vista líder) |
| Experiencia de estudio | Consumo estructurado de un contenido (páginas, certificado) |
| Home de ruta / Experiencia de ruta | Portada de una ruta de aprendizaje: lista de contenidos hijos, progreso por contenidos finalizados |
| Ruta de aprendizaje | Contenido que agrupa otros contenidos en un orden; no tiene páginas propias |
| Modo estudio IA | Tutor en chat (quiz, flashcards, plan de estudio); **≠** experiencia de estudio. En el rail colaborador el ítem se llama **Modo estudio AI**. |
| Universidad corporativa | Catálogo de contenidos de la empresa. En el rail colaborador el ítem se llama **Universidad corporativa**. |
| Próximas sesiones presenciales | (Retirado) Antes: carrusel destacado en Universidad corporativa. Hoy: no se muestra ahí; búsqueda/filtro Sesión en la lista sí. Demo alternativa: lab Eventos |
| Contenido | Unidad publicable (curso, podcast, ruta, evento, etc.) |
| Evento | Tipo de contenido para formaciones en sitio; el recurso Asistencia solo existe aquí |
| Crear evento | Flujo gemelo de Crear contenido; la ficha técnica no pide tipo porque ya es Evento |
| Página | Unidad dentro de Recursos de un contenido |
| Recurso | Video, PDF, texto, SCORM, evaluación, encuesta, asistencia… dentro de una página |
| Recurso asistencia | Página para registrar asistencia a capacitaciones en sitio (sesiones + confirmación). Solo se añade en contenidos tipo Evento |
| Evaluador roleplay | Recurso de llamada con un personaje de voz que evalúa al colaborador contra objetivos de aprendizaje definidos por el creador |
| MVP / MLP | Dos versiones del Evaluador roleplay que conviven en el selector: **MVP** sin IA y por pasos (se construye primero); **MLP** con agente de IA y formulario a dos columnas (aprobado, en fase posterior) |
| Objetivo de aprendizaje | Lo que el colaborador debe lograr en la conversación del roleplay. Entre 3 y 5 por roleplay |
| Modo práctica / evaluación | En un roleplay: **práctica** deja avanzar siempre; **evaluación** exige alcanzar el umbral de objetivos. Por defecto, evaluación |
| Sesión | Ventana de fecha/hora en la que el estudiante puede confirmar asistencia. El creador le pone **nombre** (inline edit; por defecto `Sesión 1`, `Sesión 2`…). Al abrir Agregar asistencia nace una sesión; es obligatorio tener al menos una, salvo sesión libre |
| Descripción de la sesión | Campo opcional de texto en cada sesión |
| Nombre de la sesión | Título visible de cada sesión (p. ej. «Protocolos en sitio»). Lo edita Ana en el modal Agregar asistencia; el estudiante lo ve en experiencia de estudio y en Resultados |
| Está ocurriendo | Estado de una sesión cuya ventana está activa ahora (cuenta regresiva hasta el fin) |
| Añadir a mi calendario | Acción en una sesión futura para guardar el horario en Google, Outlook, Apple u otro calendario |
| Autoconfirmación | El estudiante marcó asistencia en la plataforma (p. ej. vía QR/URL) |
| Confirmación manual | El creador registró asistencia vía CSV en Resultados |
| Idea del video | Texto obligatorio del setup de Crear video con IA |
| Personalizada | Chip por defecto bajo Idea del video: escribir la idea libre |
| Ideas de ejemplo | Chips opcionales bajo Idea del video que pegan un texto reutilizable |
| Contexto | En Crear video con IA: cómo complementar la idea (información de internet, archivos adjuntos, o ambos). Obligatorio. |
| Duración | Rango de duración del video en el setup. Obligatorio. |
| Voz del video | Voz de narración del setup. Obligatoria. Por defecto: femenina colombiana. En el modal, Colombia aparece antes que México. |
| Avatar del video | Presentador opcional del setup. Solo se muestra en Configuración avanzada con estilo Corporativo o Fotografía Real. Al prenderlo se sugiere el primer avatar del Sector elegido que coincida con el sexo de la voz; Ana puede cambiar de industria en el modal. Si no estaba prendido al preparar el borrador, el selector de tipo de escena no ofrece Avatar. |
| Estilo visual | Campo obligatorio y siempre visible: look de imágenes/canvas del video. En el setup: card + modal; por defecto Corporativo. |
| Configuración avanzada | Sección desplegable, separada por una línea y cerrada por defecto, que agrupa Audiencia, Tono, Sector, Qué evitar y Avatar del video cuando el estilo es compatible. |
| Preparar escenas | Acción gratis del setup que crea el borrador de escenas en la columna derecha. |
| Regenerar borrador | Acción gratis del alert cuando el borrador queda desactualizado tras editar el setup. No vive en el footer. |
| Continuar (video con IA) | Acción que cobra tokens y abre el editor multimedia con el borrador. |
| Borrador de escenas | Guion, tipo y orden de escenas en la columna derecha del setup (antes «Revisar escenas»). |
| Objetivo / Audiencia / Tono | Brief del setup de Crear video con IA: Objetivo obligatorio y siempre visible; Audiencia y Tono opcionales en Configuración avanzada, con valor por defecto. Selectores con opciones comunes y «Otro» (texto libre). |
| Sector | Selector opcional en Configuración avanzada (debajo de Tono): mismas industrias del catálogo de avatares, en orden alfabético. Por defecto Staff & Oficina. Sugiere el avatar al prenderlo; no obliga a que coincidan. |
| Qué evitar | Textarea opcional del setup de Crear video con IA: temas, ejemplos o palabras a dejar por fuera |
| Ajustes del video | Modal del editor de Video con IA: subtítulos, logo de la empresa y música de fondo |
| Música de fondo | Loop bajo la locución. Se elige en Ajustes del video. Por defecto Groove continuo; se puede quitar con Sin música. Fade out en la última escena. Volumen: Alto, Estándar (por defecto), Discreto o Mínimo |

## LMS Creator

| Término UI | Notas |
|------------|--------|
| LMS Creator | Nombre del ítem en el rail admin (módulo LMS Creator) |
| LMS AI | Tercer nivel bajo LMS Creator (página de Recursos IA). En el rail el ítem se llama **LMS AI**. |
| Universidad corporativa | Tercer nivel bajo LMS Creator (personalización de U. Corporativa). En el rail el ítem se llama **Universidad corporativa**. |
| Portada | Paso 1 del asistente de contenido |
| Recursos | Paso 2: páginas y bloques |
| Certificado | Paso 3: configuración de certificación |
| Visibilidad | Estado LMS del contenido: Borrador, Público, Privado, Oculto, Archivado |
| Ajustes | 4.º paso del asistente Crear contenido / Crear evento (hub: visibilidad, pesos, tipo de navegación; en editar también impacto) |
| Habilitar edición | Switch en Recursos de Editar contenido: al activarlo abre el modal «Antes de editar los recursos»; sin él no se mutan páginas ni recursos |
| Tipo de navegación | Ajuste del contenido o de la ruta: Lineal (orden obligatorio) o Libre |
| Navegación lineal | En contenido: avanza páginas en orden. En ruta: desbloquea contenidos hijos en orden |
| Navegación libre | En contenido: puede abrir páginas de recurso fuera de orden (fin bloqueado). En ruta: tras comenzar, puede abrir cualquier contenido hijo |
| Crear video con IA | Flujo inmersivo de video por escenas: setup + borrador → editor multimedia |
| Video Avatar IA | Vía de Agregar video para un video sencillo de presentador (p. ej. una intro). Convive con Video con IA; no la reemplaza ni es legado. |
| Impacto en el progreso | Política al cambiar estructura de un contenido ya en uso. Dos opciones: «Proteger a quienes ya finalizaron» o «Recalcular el progreso de todos». Card solo en Ajustes de **editar** (no en crear). |
| Resultados | Sección de Editar contenido: inscritos, finalización y tabs Progreso / Evaluaciones / Gestión de intentos / Descargas / Asistencias |
| Asistencias | Tab de Resultados: filtro de página de asistencia y, al lado, filtro de sesión; quién asistió, modo (Manual o Autoconfirmación) y fecha/hora de confirmación; Subir CSV de username a la sesión activa; descargar el CSV de esa sesión; eliminar de esa sesión |
| Finalización | KPI de Resultados: % de inscritos (del periodo) que ya tienen fecha de finalización |
| Final ponderada | Nota del tab Evaluaciones: solo evaluaciones presentadas, ponderadas por su peso |
| Gestión de intentos | Tab de Resultados: estudiantes bloqueados por límite de intentos; desbloquear otorga 1 intento más |
| Descargas | Tab de Resultados: reporte por evaluación o encuesta del contenido (no es la descarga masiva de certificados) |
| Progreso del estudiante | Drawer de solo lectura desde Resultados → Progreso: por página, estado (Visto / Pendiente / Bloqueado), tag Oculta · fecha solo si está oculta, fecha completada si aplica. La publicación del contenido va en la cabecera de Resultados |
| Plan de formación | Asignación de contenidos o competencias a personas/grupos |
| Plan de contenidos | Tipo de plan basado en contenidos |
| Plan de competencias | Tipo de plan con horas por competencia |
| Tab Competencias (edición del plan) | En **Editar** plan de competencias: listado masivo de competencias (ProfileList de personas + Agregar usuario / Reemplazar / Eliminar) con autoguardado. HU-LMS-015 |
| Tab Competencias (detalle del plan) | En **Detalle** plan de competencias: misma lista en **solo lectura** (sin mutaciones). HU-LMS-015 |
| Tab Contenidos (edición del plan) | En **Editar** plan de contenidos: listado masivo de contenidos (ProfileList de personas + Agregar usuario / Reemplazar / Eliminar) con autoguardado. HU-LMS-021 |
| Tab Contenidos (detalle del plan) | En **Detalle** plan de contenidos: misma lista en **solo lectura** (sin mutaciones). HU-LMS-021 |
| Reporte por estudiante | CSV del detalle del plan: 1 fila por colaborador asignado. Antes “Descargar”. HU-LMS-016 (competencias) / HU-LMS-022 (contenidos) |
| Reporte detallado | CSV del detalle del plan: 1 fila por par usuario–competencia o usuario–contenido. HU-LMS-016 / HU-LMS-022 |
| Grupo | Conjunto de colaboradores para asignaciones |
| Chat IA grupos | Asistente guiado para crear / editar / consultar grupos |
| Agregar evaluación | Flujo inmersivo de evaluación final como recurso |

## Admin — navegación Workspace

| Término UI | Notas |
|------------|--------|
| Productos | Grupo del sidenav (admin y colaborador): en admin Selección, Aprendizaje, Desempeño y cultura; en colaborador Aprendizaje, Desempeño y cultura |
| Diagnóstico | En admin: ítem de Aprendizaje, entre Certificados y Reportes. En colaborador: ítem de Aprendizaje, debajo de Métricas. |
| Métricas | En admin: hoja de Aprendizaje, debajo de Reportes. En colaborador: hoja de Aprendizaje, entre Progreso y Diagnóstico. |
| Herramientas | Grupo del sidenav. Admin: **Tareas** (ítem único → Seguimiento HR), Avisos internos, **Agente de tu empresa**. Colaborador: Tareas (acordeón: Tareas, Planes, Plantillas, Seguimiento líder). Producto del agente: HU-TRA-001. |
| Selección | Producto de vacantes (antes Reclutamiento). Badge **Nuevo**. Ítems: Dashboard, Onboarding, Vacantes, Plantillas. No usar «Reclutamiento» en UI |
| Onboarding | Ítem de Selección (admin). Pantalla placeholder en este playground. |
| Universidad corporativa | En admin: tercer nivel bajo LMS Creator (personalización). En colaborador: ítem de Aprendizaje. |
| LMS AI | Tercer nivel bajo LMS Creator (página de Recursos IA) |
| Avisos internos | Herramienta del sidenav admin (antes Comunicaciones en Empresa; en UI anterior «Avisos») |
| Configuración | Grupo del menú de empresa (sidebar admin). Antes vivía en el AppHeader. No va en el sidenav |
| Menú de empresa | Logo del tenant + tres puntos en el sidebar admin. Incluye Licencias, Créditos, Configuración y sucursales (mi empresa, Alpha, Beta, Omega) |
| Workspace footer | Pie legal al final del main en pantallas Workspace. No es sticky |

## Tareas

| Término UI | Notas |
|------------|--------|
| Mi lista | Tareas personales del día |
| Por hacer / Activo / Finalizada / Vencida | Estados de tarea (nunca “Iniciada”) |
| En curso / Finalizado | Ámbitos de planes en la vista del colaborador |
| Seguimiento | Vista densa de tareas y planes. **HR (admin):** empresa-completa. **Líder (colaborador):** solo él y su equipo. |
| Detalle de tarea / subtarea | Vista inmersiva con atributos, subtareas y comentarios |
| Finalizado (colaborador) | Plan con avance ≥ 65% — **no** es la misma métrica que la barra admin (% personas al 100%) |

## Agente de tu empresa

| Término UI | Notas |
|------------|--------|
| Agente de tu empresa | **Un** agente por empresa. Producto distinto del chat genérico **Agente IA**. Nombre v1; “Agente [nombre de la empresa]” queda por validar con PM. |
| Cara del agente | Imagen, nombre y tono. Hay una imagen por defecto; el admin puede sustituirla subiendo un archivo o generando con IA (capa del mismo drawer, igual que generar portada). Se edita en un **drawer**. No es una colección. |
| Colección | Unidad de la **home** del agente. Agrupa **carpetas** y documentos + visibilidad. Ícono de libros. |
| Tono | En **Editar agente**, debajo de Nombre (la imagen va primero). Cómo debe sonar el agente. Mismas opciones que Agregar video. Default: **Cercano y conversacional**. |
| Carpeta | Unidad **dentro** de una colección (o de otra carpeta). Agrupa carpetas y documentos. Ícono de carpeta. |
| Colecciones | Home admin tipo explorador (lista y cards, breadcrumb). Prototipo **sin techo** de cantidad, peso ni niveles. |
| Documentos / archivos | Contenido de una colección o carpeta. v1: **`.txt` y `.md`**. En cards: título, tipo y peso. |
| Fuentes | Citas numeradas en la respuesta. Chip = archivo + meta de colección. Clic en el número → panel derecho. |
| Probar agente | Chat de prueba del admin en **IA panel**: **visión dios** (todas las colecciones del tenant). Sin «Ver como». Solo en la **home del agente**, no al entrar a una colección. Visible cuando hay **≥1 colección con ≥1 documento**. |

## Desempeño

| Término UI | Notas |
|------------|--------|
| Evaluación 360° | Evaluación multi-fuente |
| Evaluado | Persona sobre quien se evalúa |
| Competencias | Dimensiones / enunciados de la evaluación |
| PDI | Plan de desarrollo individual (Desempeño admin, sidenav). En UI se muestra la sigla **PDI**. |

## La ficha de un contenido: qué lleva cada catálogo

Hay **dos creadores de contenido** y no llenan la misma ficha. Conviene no confundirlos: el de una empresa es el LMS
Creator que se ve en el prototipo; el de UBITS es **interno** y tiene campos que el otro ni ve.

| Campo | Lo crea la empresa | Lo crea UBITS | Notas |
|-------|--------------------|---------------|-------|
| Nombre, portada, descripción | ✅ | ✅ | |
| Tipo de contenido, nivel, idioma, duración | ✅ | ✅ | |
| **Categoría** | ✅ | — | Las crea cada empresa, a su gusto |
| **Competencia** | — | ✅ | El equivalente de la categoría en el catálogo de UBITS |
| **Habilidad** | — | ✅ | La habilidad concreta dentro de esa competencia |
| **Aliado** | — | ✅ | Quién produce el contenido |
| **Expertos** | — | ✅ | Quién lo dicta, con su cargo |
| **Nivel de inglés** | — | ✅ | Solo en contenidos **en inglés** |
| Visibilidad | ✅ | — | Lo de UBITS es público para todas las empresas |

- **Categoría y competencia son lo mismo a la hora de buscar**: cuando los dos catálogos se mezclan en una pantalla
  —como al elegir contenidos para una ruta— van en la misma columna y bajo el mismo filtro.
- **Habilidad, Expertos y Nivel de inglés son campos del Creator interno de UBITS.** No existen en el creador de las
  empresas y **no se pintan** en sus pantallas de creación. Sí se ven cuando la empresa está *consumiendo* el catálogo
  de UBITS, porque ahí son el dato que ayuda a elegir.
- **Cuando un campo no corresponde**, la celda dice **«No aplica»** en texto apagado, no se deja vacía. En el
  playground conviven dos tratamientos y no son lo mismo: la **raya em (—)** es para un dato que *podría* estar y
  falta (el último progreso de alguien, su líder); **«No aplica»**, para lo que *no corresponde* —el certificado de un
  curso que no entrega, la fecha de un diagnóstico que no se programa, la habilidad de un contenido que creó la
  empresa—. En flux-ui no hay nada para este caso: la convención sale de lo que ya hacen Cristian y Nicolás.
- **Nivel de inglés** usa el Marco Común Europeo con los medios de UBITS: `<A1, A1, A2, A2+, B1, B1+, B2, B2+, C1, C2`
  (en el playground, `src/shared/bd/niveles-ingles.ts`).

## Prohibido en UI (producto)

- Jerga técnica: RAG, vector store, Notebook (como nombre de producto). No llamar “base de conocimiento” al producto.
- Voseo y regionalismos (ver reglas de idioma en `CLAUDE.md`).
- Llamar “Modo estudio IA” a la experiencia de estudio de un curso, o viceversa.
- Llamar «Reclutamiento» al producto **Selección**, o poner **Empresa** / **Comunicaciones** como ítems del sidenav admin.
- Poner **Reclutamiento** en el sidenav del colaborador (ese producto vive solo en admin como **Selección**).
