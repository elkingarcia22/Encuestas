# Flujo — LMS Creator

## Objetivo

Permitir a creadores y admins publicar contenidos formativos (páginas + recursos), rutas, planes y certificados, consultar el progreso de los inscritos y medir el impacto de cambios estructurales sobre ese avance.

## Actores

- Creador de contenidos LMS (persona demo: Ana)
- Administrador HR (con permiso de creación)

## Pasos mentales del dominio

1. **Listar** contenidos → filtrar / buscar / abrir.
2. **Crear** contenido (asistente: Portada → Recursos → Certificado → Ajustes), **crear evento** (mismo asistente, sin tipo en ficha técnica, con Asistencia en Recursos) o **continuar borrador**.
3. En Recursos: armar **páginas** vía modal fullscreen **Añadir página** (título opcional + selector). Alta habilitada: Video, PDF, Texto, Embebido, SCORM, Evaluación final; **Asistencia solo en Evento**. Encuesta libre y Encuesta de satisfacción aparecen deshabilitadas. Video/PDF/Texto/Embebido/SCORM/Asistencia avanzan al clic (asistencia → modal de setup); Evaluación pide **Crear página** y nace **inline** en Recursos (puede ir vacía de preguntas; inmersiva legacy por URL).
4. **Publicar** desde Ajustes (visibilidad Pública/Privada/Oculta) o dejar en Borrador / Archivar; en Ajustes también define **Tipo de navegación** (Lineal por defecto o Libre).
5. **Editar** publicados: Recursos se visita sin modal; **Habilitar edición** abre el de impacto. Cambios de estructura pasan por esa política; el tipo de navegación se puede cambiar sin republicar. Añadir página = mismo flujo que en creación (HU-LMS-001), Asistencia solo si es Evento.
6. En **Resultados** consulta finalización, evaluaciones, desbloquea intentos, descarga reportes y ve **Asistencias** (HU-LMS-013, HU-LMS-026). En el tab **Progreso** abre una fila y ve, por página, estado, fecha completada y, si aplica, tag Oculta (drawer de solo lectura; HU-LMS-012). En **Asistencias** elige primero la página y a su lado la sesión, carga asistentes a esa sesión (por colaborador, por grupos o desde archivo CSV), descarga el CSV de la sesión activa y puede eliminar asistentes. La tabla incluye fecha/hora de confirmación. La fecha de publicación del contenido está en la cabecera de Resultados.
7. El colaborador consume el contenido en Experiencia de estudio respetando Lineal vs Libre (HU-APR-007).
8. **Asignar** vía planes de formación (contenidos o competencias) a personas/grupos.
9. **Grupos**: CRUD manual o **Chat IA de grupos** (crear/editar/consultar con sugerencias).
10. **Certificados**: descargar en masa (global / contenido / colaborador) con anti-duplicado 48 h.

## Añadir página (subflujo)

1. Recursos → **Añadir página** (modal fullscreen).
2. Título de página opcional; si vacío → nombre del recurso principal (`Video`, `Evaluación`, `PDF`, etc.).
3. Elegir tipo:
   - Video / PDF / Texto / Embebido / SCORM / Asistencia (esta última solo en Evento) → modal (o picker/inmersivo de video) de una. Asistencia: instrucciones opcionales + sesión precreada (o sesión libre) + descripción opcional + alert de zona horaria.
   - Evaluación → seleccionar card + **Crear página** → página con editor inline (0 preguntas permitidas; HU-LMS-010). Inmersiva = legacy por URL.
4. En modales de recurso: **Volver** reabre Añadir página; cerrar sin confirmar no crea página.

## Video con IA (subflujo)

1. Desde Recursos → Agregar video → modal. Las pestañas **Video con IA** y **Video Avatar IA** conviven (más Enlace y Subir). Video con IA es el video por escenas. Video Avatar IA es un video sencillo de presentador (p. ej. una intro). En **Subir video** solo se admite MP4 de hasta 500 MB.
2. **Crear video con IA**: setup unificado con Idea, Contexto, Objetivo, Duración, Estilo visual obligatorio y Voz siempre visibles; Audiencia, Tono, Sector, Qué evitar y Avatar (solo en estilos compatibles) viven en Configuración avanzada, separada por una línea y cerrada por defecto. El borrador de escenas aparece en la columna derecha → Editor. El tipo Avatar en el selector del borrador solo aparece si el avatar estaba prendido al preparar/regenerar.
   - Preparar escenas es gratis; si el setup cambia, Regenerar borrador aparece en el alert (gratis); Continuar cobra tokens. El badge del setup anima el descuento y, un segundo después de terminar, lleva al editor.
   - La URL legacy `/agregar-video/revisar-escenas` redirige al setup.
3. En editor: escenas, subtítulos, logo (70% opacidad), música de fondo (Groove continuo por defecto; se puede quitar). Salir sin **Generar video** no crea página: el borrador vive en Recursos IA y en Tus videos recientes. Solo al confirmar **Generar video** se monta la página (loader de render y luego el video). Lipsync Avatar: al entrar al editor va en la cola de generación; si Ana cambia a Avatar, cambia el avatar o regenera audio ya dentro, debe pulsar **Sincronizar avatar** (manual, 100 tokens; sin toast de éxito). Canvas: MEDIA con Generar/Regenerar desde idea. En Recursos, video ya renderizado → **Editar video**. En el prototipo el preview de Avatar sigue como imagen fija.
4. Escenas tipo **video** (clip): en el primer alcance solo carga/reemplazo manual; placeholder «Carga tu video» si no hay clip. Sin archivo no se puede salir de esa escena ni Generar video (aviso, igual que Avatar sin locución). Al cargar el archivo, la escena toma la duración de ese video (tope 10 min); si Ana la cambia en el inspector, el preview y Generar video usan esa duración. Generación IA de media solo en escenas **imagen**.

## Modales de recurso (PDF, Texto, Embebido, SCORM, Presentación interactiva)

1. Desde Añadir página (avance inmediato al modal del recurso, con URL propia bajo `/agregar-recurso/[tipo]`).
2. **Texto:** editor enriquecido → Confirmar → página en lectura (**Editar** reabre el modal).
3. **PDF:** instrucción grande + subir archivo → al completar la carga se monta la página (sin footer Cancelar/Confirmar).
4. **Embebido:** instrucción grande + enlace/código → **Cargar** (sin Cancelar en footer).
5. **SCORM:** Subir .zip → Cargar SCORM (sin Cancelar en footer, sin pestañas ni IA). Ver HU-LMS-017.
6. **Presentación interactiva:** modal fullscreen sin tabs — idea + contexto → Preparar → editor studio → Generar presentación (ex V2 de SCORM). Ver HU-LMS-018. Copy e imagen lateral: [guia-copy-diapositivas.md](./contenidos/recursos/guia-copy-diapositivas.md).
7. **Evaluador roleplay:** llamada de práctica con un personaje de voz que califica contra objetivos. Dos recursos distintos en el selector:
   - **(MVP)** — sin IA, configuración en cuatro pasos (Planificación · Personaje · Estudiante · Configuración). Ver [HU-LMS-023](./contenidos/recursos/HU-roleplay-mvp.md).
   - **(MLP)** — el creador describe la idea en una frase y la IA propone todo; formulario único a dos columnas. Aprobado; desde el 28 sep ya se puede crear en el playground (`/agregar-roleplay`, como en playground-react). Ver [HU-LMS-024](./contenidos/recursos/HU-roleplay-mlp.md).
7. **Asistencia:** instrucciones `(opcional)` + una sesión precreada (nombre con inline edit + día, horario y descripción opcional) o sesión libre. Alert de zona horaria de la compañía. En **Editar contenido**, eliminar sesión pide confirmación (las asistencias de esa sesión también se van); las sesiones con fecha anterior a hoy quedan en solo lectura. No aplica en Crear evento para el lock de fechas pasadas.
8. **Volver** en todos → reabre Añadir página sin crear página.

Al generar Video Avatar IA, Video con IA o Presentación interactiva, el status panel muestra el progreso; al terminar, **solo** el alert de éxito con **Ver página** (no un toast extra). PDF, texto y el resto de recursos inmediatos no muestran toast al confirmar. Las diapositivas de Presentación interactiva y los canvas de video comparten plantillas: copy corto e imagen a un lado en los tipos que lo llevan (ver guía).

## Evaluación final (subflujo)

1. Desde Añadir página → Evaluación → **Crear página** → nace la página en Recursos con el editor **inline** (puede iniciar con 0 preguntas; deuda técnica temporal).
2. El creador arma o genera preguntas en Crear/Editar contenido (sin paso inmersivo obligatorio). Generar evaluación anima el badge del panel y, un segundo después, cierra el drawer y genera las preguntas.
3. La experiencia inmersiva «Agregar evaluación» queda **fuera del flujo oficial** (legacy por URL) hasta el Q en que se reactive.

## Pantallas en el prototipo (playground UX)

Todo el flujo de crear vive bajo `/admin/aprendizaje/lms-creator/` y cada paso o recurso tiene su dirección, para compartirla desde una HU y seguir el flujo desde ahí (en local: `http://localhost:5173` + la dirección). Abierto directo con el borrador vacío, carga el curso de ejemplo.

| Paso o recurso | Dirección |
|---|---|
| Listado | `/contenidos` |
| Crear contenido · Portada / Recursos / Certificado / Ajustes | `/crear-contenido#portada` · `#recursos` · `#recursos/page/{id}` · `#certificado` · `#ajustes` (`-visibilidad`, `-pesos`, `-pesos-empty`, `-navegacion`) |
| Evaluación de 80 preguntas (caso borde) | `/crear-contenido#recursos/eval-80` |
| Crear evento | `/crear-evento#portada` (mismos pasos) |
| PDF · Texto · Embebido · SCORM · Asistencia | `/agregar-recurso/pdf` · `/texto` · `/embebido` · `/scorm` · `/asistencia` |
| Video con IA · editor de escenas | `/agregar-video` · `/agregar-video/editor` (`/revisar-escenas` redirige al setup) |
| Presentación interactiva · editor | `/agregar-presentacion-interactiva` · `/agregar-presentacion-interactiva/editor` |
| Evaluador roleplay (MVP) | `/agregar-roleplay-mvp` |

## HUs de este módulo

Ver [`_indice-hus.md`](../../../../_indice-hus.md) IDs `HU-LMS-*`.
