# Los hallazgos frente a la especificación

Qué pasa con cada hallazgo del análisis de la plataforma actual cuando se lo compara con el nuevo UBITS.

| Hallazgo | Estado | Dónde |
| --- | --- | --- |
| Quien opera la plataforma paga el precio | Resuelto en la especificación: un solo menú lateral por mundo; Creator, Selección y Métricas entran al menú del admin. | Workspace admin: Inicio → Productos → Herramientas, Workspace colaborador: Inicio → Productos → Herramientas |
| Navegación ordenada por producto, no por trabajo | En parte: el menú sigue agrupado por producto (Selección, Aprendizaje, Desempeño y cultura), pero ahora es uno solo. | Workspace admin: Inicio → Productos → Herramientas |
| «Plan» significa cuatro cosas | Sigue abierto: la especificación documenta que las métricas de plan son distintas y suma acepciones (plan de estudio, generar plan con IA). | Regla: la barra del plan admin (% al 100 %) no es el «Finalizado» del colaborador (≥ 65 %), Inconsistencia: «Planes de formación del colaborador» describe planes de tareas, no de formación |
| Crear no es activar | En parte: contenidos y colecciones comparten Borrador · Público · Privado · Oculto; la 360 «se activa» y los planes nacen «Planeado». Selección y Avisos siguen sin especificar. | Estado: Borrador · Público · Privado · Oculto · Archivado, Regla: una 360 solo se activa con las 4 secciones completas y pesos = 100, Regla: planes admin Planeado → Procesando → Vigente → No vigente |
| La IA entra por siete puertas y dos monedas | En parte: los créditos se juntan en el menú de empresa, pero la IA abre aún más puertas (video, avatar, presentación, SCORM, evaluación, chat de grupos, generar plan, Agente IA, Agente de tu empresa). | Menú de empresa (logo): Licencias, Créditos, Configuración y sucursales, Entidad: Créditos IA (pool de sesión de 500.000) |
| Estados vacíos sin salida | Resuelto donde hay HU: cada vacío tiene copy y acción. Los 29 ítems sin HU siguen sin definir su vacío. | HU-LMS-004 · Listado de contenidos, HU-APR-006 · Progreso del colaborador (vista de líder), HU-TRA-001 · Agente de tu empresa |
| Dos páginas de «no encontrado» con diseños distintos | Resuelto: un solo sistema de errores con 404, sin acceso, sin conexión, licencia y servidor. | HU-TRA-002 · Errores de sistema |
| Recorridos guiados que bloquean la pantalla | Resuelto para el Creator: se abre directo, sin modal de entrada. | Diferencia: el Creator deja de abrir con modal y recorrido guiado |
| Permisos gestionados en dos sitios | Resuelto en estructura: una sola Configuración de roles en el menú de empresa (aún sin HU). | Configuración · Roles y permisos |
| Módulos apagados visibles en el menú | Se mantiene a propósito: la especificación enlaza destinos aunque estén vacíos. | Regla: el menú y el dashboard enlazan a destinos aunque aún estén vacíos |
| Modo estudio IA no carga | Especificado: tutor en chat con quiz, flashcards y podcast. | HU-APR-001 · Modo estudio IA (tutor en chat) |
| No existe una pantalla de perfil propia | Sigue abierto: el Inicio del colaborador no tiene HU. | Colaborador · Inicio |
| Vistas de líder | Lo que no pudimos ver (vistas de líder) sí está especificado. | HU-TAR-005 · Seguimiento de tareas (vista líder), HU-APR-006 · Progreso del colaborador (vista de líder) |
| Responder una evaluación 360 | Responder una 360 tampoco tiene HU. | Desempeño · Evaluaciones 360 (colaborador) |
| Responder una encuesta | Responder una encuesta tampoco tiene HU. | Desempeño · Encuestas (colaborador) |
| Configuración de Serena AI | Serena AI no aparece en la especificación: Selección no tiene HU. | Selección · Vacantes |
| Matriz de talento con datos | La matriz de talento tampoco tiene HU. | Desempeño · Matriz de talento (admin) |

## Hallazgos nuevos sobre la especificación

### deja sin historia justo lo que hoy más se usa

29 ítems del menú nuevo no tienen HU. Entre ellos, Selección entera, Avisos internos, Encuestas, Métricas, toda la Configuración y el Inicio del colaborador.

### el recorrido de hoy puede alimentar las HUs que faltan

16 de los 29 ítems pendientes tienen hoy pantallas con contenido documentadas en esta base.

### junta los créditos pero abre más puertas de IA

Una sola moneda en el menú de empresa, pero once lugares distintos donde se genera o se conversa con IA.

### tres inconsistencias internas

El flujo del agente contradice al menú, los tokens de presentación no están definidos y una HU de tareas se titula como formación.
