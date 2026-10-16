# Graph Report - /Users/tianmunooz/Developer/playground-ux/docs/plataforma-ubits  (2026-09-11)

## Corpus Check
- 100 files · ~53,512 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 362 nodes · 928 edges · 12 communities
- Extraction: 97% EXTRACTED · 2% INFERRED · 1% AMBIGUOUS · INFERRED: 22 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Especificación: LMS Creator e IA
- Persona, portal y RR. HH.
- Estructura: marcos y nuevo UBITS
- Aprendizaje: hoy y especificado
- Tareas, avisos y seguimiento
- Contratar: Reclutamiento → Selección
- Evaluar y desarrollar
- IA y créditos
- Creator y certificados
- Planes de formación y grupos
- Agentes y soporte
- Workspace admin y dashboard

## God Nodes (most connected - your core abstractions)
1. `Índice de historias de usuario (42 HUs, 29 ítems pendientes)` - 44 edges
2. `Capacidad: Contratar` - 24 edges
3. `Capacidad: Formar` - 24 edges
4. `Plataforma UBITS` - 20 edges
5. `Actor: Recursos Humanos` - 20 edges
6. `Portal Colaborador · /portal` - 20 edges
7. `Capa de IA` - 20 edges
8. `LMS Creator · Contenidos` - 19 edges
9. `Marco A · Colaborador` - 18 edges
10. `Inicio del administrador · /admin-hr/home` - 18 edges

## Surprising Connections (you probably didn't know these)
- `Etapa 5 · Seleccionado` --alimenta--> `Crear usuario · /admin-hr/users/creation`  [AMBIGUOUS]
  06-marco-d-reclutamiento.md → 04-marco-b-administrador.md
- `No visto: Responder una evaluación 360` --falta ver en--> `Evaluaciones 360 del colaborador · /talent/360`  [AMBIGUOUS]
  11-hallazgos.md → 03-marco-a-colaborador.md
- `No visto: Responder una encuesta` --falta ver en--> `Mis encuestas · /surveys`  [AMBIGUOUS]
  11-hallazgos.md → 03-marco-a-colaborador.md
- `No visto: Configuración de Serena AI` --falta ver en--> `Etapa 2 · Serena AI (entrevistadora de IA)`  [AMBIGUOUS]
  11-hallazgos.md → 06-marco-d-reclutamiento.md
- `No visto: Matriz de talento con datos` --falta ver en--> `Matriz de talento · /talent-matrix`  [AMBIGUOUS]
  11-hallazgos.md → 04-marco-b-administrador.md

## Hyperedges (group relationships)
- **Cadena de aprendizaje** — 01_que_es_ubits_persona, 05_marco_c_creator_grupos, 05_marco_c_creator_planes_formacion, 03_marco_a_colaborador_zona_contenidos, 03_marco_a_colaborador_reproductor, 03_marco_a_colaborador_progreso, 03_marco_a_colaborador_historial, 07_marco_e_metricas_y_nomina_intranalytics [EXTRACTED 1.00]
- **Cadena de talento** — 04_marco_b_administrador_eval360_admin, 03_marco_a_colaborador_eval360_colab, 03_marco_a_colaborador_objetivos_colab, 04_marco_b_administrador_matriz, 08_inteligencia_artificial_ag_pdi, 03_marco_a_colaborador_tareas_planes [EXTRACTED 1.00]
- **Estudiar un contenido asignado** — 02_navegacion_y_marcos_login, 03_marco_a_colaborador_portal, 03_marco_a_colaborador_progreso, 03_marco_a_colaborador_zona_contenidos, 03_marco_a_colaborador_ficha, 03_marco_a_colaborador_reproductor, 03_marco_a_colaborador_historial [EXTRACTED 1.00]
- **Dar de alta a la gente nueva** — 03_marco_a_colaborador_portal, 04_marco_b_administrador_admin_inicio, 04_marco_b_administrador_usuarios, 04_marco_b_administrador_crear_usuario, 04_marco_b_administrador_masivas, 04_marco_b_administrador_roles, 03_marco_a_colaborador_organigrama [EXTRACTED 1.00]
- **Armar y asignar un plan de formación** — 04_marco_b_administrador_admin_inicio, 05_marco_c_creator_lms, 05_marco_c_creator_grupos, 05_marco_c_creator_planes_formacion, 05_marco_c_creator_certificados, 05_marco_c_creator_reporte_mensual, 03_marco_a_colaborador_portal [EXTRACTED 1.00]
- **Contratar a alguien** — 06_marco_d_reclutamiento_vacantes, 06_marco_d_reclutamiento_paso1, 06_marco_d_reclutamiento_paso2, 06_marco_d_reclutamiento_paso3, 06_marco_d_reclutamiento_creada, 06_marco_d_reclutamiento_detalle_vacante, 06_marco_d_reclutamiento_etapa2, 06_marco_d_reclutamiento_candidatos, 04_marco_b_administrador_crear_usuario, 08_inteligencia_artificial_ag_onboarding [EXTRACTED 1.00]
- **Cerrar un ciclo de desempeño** — 04_marco_b_administrador_eval360_admin, 03_marco_a_colaborador_eval360_colab, 03_marco_a_colaborador_objetivos_colab, 04_marco_b_administrador_matriz, 08_inteligencia_artificial_ag_pdi, 03_marco_a_colaborador_tareas_seguimiento [EXTRACTED 1.00]
- **HUs de fase 1** — spec_admin_productos_aprendizaje_lms_creator_contenidos_hu_crear_contenido_hu_lms_001, spec_admin_productos_aprendizaje_lms_creator_contenidos_hu_editar_contenido_hu_lms_002, spec_admin_productos_aprendizaje_lms_creator_contenidos_recursos_hu_video_con_ia_hu_lms_003, spec_colaborador_productos_aprendizaje_modo_estudio_ia_hu_modo_estudio_ia_hu_apr_001 [EXTRACTED 1.00]
- **Aprendizaje: hoy → especificado** — 03_marco_a_colaborador_catalogo, 03_marco_a_colaborador_universidad, 03_marco_a_colaborador_zona_contenidos, 03_marco_a_colaborador_ficha, 03_marco_a_colaborador_reproductor, spec_colaborador_productos_aprendizaje_catalogo_hu_home_catalogo_s_col_catalogo, spec_colaborador_productos_aprendizaje_universidad_corporativa_hu_u_corporativa_s_col_uc, spec_colaborador_productos_aprendizaje_zona_estudio_hu_zona_estudio_s_col_zona, spec_colaborador_productos_aprendizaje_experiencia_estudio_hu_experiencia_estudio_s_col_exp, spec_colaborador_productos_aprendizaje_experiencia_estudio_hu_experiencia_estudio_hu_apr_004 [EXTRACTED 1.00]
- **Administración: de cinco marcos a un Workspace** — 02_navegacion_y_marcos_marco_b, 02_navegacion_y_marcos_marco_c, 02_navegacion_y_marcos_marco_d, 02_navegacion_y_marcos_marco_e, spec_admin_inicio_hu_navegacion_workspace_s_ws_admin, spec_admin_inicio_hu_navegacion_workspace_s_menu_empresa, spec_admin_inicio_hu_navegacion_workspace_s_adm_seleccion, spec_admin_productos_aprendizaje_lms_creator__flujo_s_lms [EXTRACTED 1.00]

## Communities (12 total, 0 thin omitted)

### Community 0 - "Especificación: LMS Creator e IA"
Cohesion: 0.10
Nodes (49): Detalle: Modo estudio IA no carga, Resumen: las historias de usuario y cómo se conectan, Diferencia: hoy 9 agentes en un módulo del menú; especificados 3 fuera del menú más el Agente de tu empresa, Inconsistencia: los tokens de Presentación interactiva son provisionales y siguen sin definir, Hallazgo de la especificación: junta los créditos pero abre más puertas de IA, Índice de historias de usuario (42 HUs, 29 ítems pendientes), HU-TRA-001 · Agente de tu empresa, Regla: un agente por empresa, alimentado por colecciones con visibilidad heredada (+41 more)

### Community 1 - "Persona, portal y RR. HH."
Cohesion: 0.08
Nodes (46): Actor: Recursos Humanos, Capacidad: Escuchar, Capacidad: Incorporar, Capacidad: Medir, Ficha de la persona, Trabajo de RR. HH.: Sostener la operación, Trabajo de RR. HH.: Traer gente, Login · login.ubitslearning.com (+38 more)

### Community 2 - "Estructura: marcos y nuevo UBITS"
Cohesion: 0.08
Nodes (43): Actor: Equipo interno de UBITS, Cuenta recorrida: QA PLAN PREMIUM, Plataforma UBITS, Marco A · Colaborador, Marco B · Administrador, Marco C · Creator, Marco D · Reclutamiento, Marco E · Métricas (+35 more)

### Community 3 - "Aprendizaje: hoy y especificado"
Cohesion: 0.11
Nodes (42): Actor: Colaborador, Capacidad: Formar, Aprendizaje · inicio · /home/learning, Resultados de búsqueda · /search?q=, Catálogo · /catalog, Ficha de contenido · /learner/content/:id, Historial y certificados · /learn/study-zone/history, Módulo: Aprendizaje (+34 more)

### Community 4 - "Tareas, avisos y seguimiento"
Cohesion: 0.09
Nodes (42): Actor: Líder, Capacidad: Operar, Crear una tarea, Módulo: Tareas, Noticias y anuncios (bloque del portal) · /portal, Tareas · agenda · /tasks/individual, Menú Crear, Tareas · planes · /tasks/group (+34 more)

### Community 5 - "Contratar: Reclutamiento → Selección"
Cohesion: 0.12
Nodes (40): Actor: Candidato, Capacidad: Contratar, Biblioteca de etapas, Candidatos · /recruitment/job/candidate-pool, Carpetas de vacantes · /recruitment/job/dashboard/folders, Vacante creada · /recruitment/job/create/publish, Historial de créditos · /recruitment/job/credits-history, Detalle de la vacante · /recruitment/job/detail (+32 more)

### Community 6 - "Evaluar y desarrollar"
Cohesion: 0.09
Nodes (33): Capacidad: Desarrollar, Capacidad: Evaluar, Trabajo de RR. HH.: Hacer crecer, Mis assessments · /assessments, Evaluaciones 360 del colaborador · /talent/360, Módulo: Desempeño, Módulo: Diagnóstico, Objetivos del colaborador · /talent/goals/own (+25 more)

### Community 7 - "IA y créditos"
Cohesion: 0.16
Nodes (17): Ai Studio · /ai-studio/home/resources, Grupos de usuarios · /creator/groups, Módulo: Planes de formación, Agente: Grupos de usuarios, Capa de IA, «Crear con IA» en la descripción de la vacante, Asistente IA para grupos, Generador de guion (Ai Studio) (+9 more)

### Community 8 - "Creator y certificados"
Cohesion: 0.15
Nodes (15): Bienvenida al Creator, Detalle: Recorridos guiados que bloquean la pantalla, Diferencia: el Creator deja de abrir con modal y recorrido guiado, Admin · Aprendizaje, Aprendizaje · Certificados, Certificados · Configuración, HU-LMS-007 · Descarga masiva de certificados, Regla: sin solicitudes de certificados idénticas en 48 h; enlace válido 2 días (+7 more)

### Community 9 - "Planes de formación y grupos"
Cohesion: 0.19
Nodes (14): Hallazgo: Crear no es activar, Propuesta: Un solo patrón de borrador a publicado, Diferencia: los planes hoy son Vigente / No vigente; se especifican además Planeado y Procesando, Aprendizaje · Planes de Formación, HU-LMS-009 · Chat IA para grupos, HU-LMS-006 · Grupos para planes de formación, Planes de Formación · Grupos, HU-LMS-005 · Planes de formación (contenidos y competencias) (+6 more)

### Community 10 - "Agentes y soporte"
Cohesion: 0.26
Nodes (12): Barra lateral del colaborador (8 módulos), Conversación con un agente · /market-ai/chat/:id, Catálogo de agentes · /market-ai/home, Agentes AI · portada · /market-ai/home, Módulo: Agentes, Módulo: Soporte, Soporte técnico · /chatbot-cs, Agente: Soporte técnico (+4 more)

### Community 11 - "Workspace admin y dashboard"
Cohesion: 0.25
Nodes (9): Inconsistencia: el flujo del Agente de tu empresa dice «rail Agentes», pero Agentes no está en el menú, Hallazgo de la especificación: tres inconsistencias internas, Flujo: Agente de tu empresa, Admin · Inicio (dashboard HR), Flujo: Inicio y chrome admin, HU-INI-001 · Dashboard de inicio del administrador, Regla: el menú y el dashboard enlazan a destinos aunque aún estén vacíos, HU-INI-002 · Navegación del Workspace (+1 more)

## Ambiguous Edges - Review These
- `Etapa 5 · Seleccionado` → `Crear usuario · /admin-hr/users/creation`  [AMBIGUOUS]
  09-flujos-de-datos.md · relation: alimenta
- `Etapa 5 · Seleccionado` → `Selección · Onboarding`  [AMBIGUOUS]
  14-hoy-vs-especificado.md · relation: podría continuar en
- `No visto: Responder una evaluación 360` → `Evaluaciones 360 del colaborador · /talent/360`  [AMBIGUOUS]
  11-hallazgos.md · relation: falta ver en
- `No visto: Responder una encuesta` → `Mis encuestas · /surveys`  [AMBIGUOUS]
  11-hallazgos.md · relation: falta ver en
- `No visto: Tablero de una vacante con candidatos` → `Detalle de la vacante · /recruitment/job/detail`  [AMBIGUOUS]
  11-hallazgos.md · relation: falta ver en
- `No visto: Configuración de Serena AI` → `Etapa 2 · Serena AI (entrevistadora de IA)`  [AMBIGUOUS]
  11-hallazgos.md · relation: falta ver en
- `No visto: Matriz de talento con datos` → `Matriz de talento · /talent-matrix`  [AMBIGUOUS]
  11-hallazgos.md · relation: falta ver en
- `No visto: Vistas de líder` → `Actor: Líder`  [AMBIGUOUS]
  11-hallazgos.md · relation: falta ver en
- `No visto: Dentro de Novasoft` → `Novasoft · nómina`  [AMBIGUOUS]
  11-hallazgos.md · relation: falta ver en

## Knowledge Gaps
- **22 isolated node(s):** `Correo a toda la empresa`, `Base de conocimiento de la plataforma UBITS`, `Plantilla de historia de usuario (Como / quiero / para, reglas y escenarios)`, `Vocabulario fijo de la interfaz`, `Personas y roles del nuevo UBITS` (+17 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Etapa 5 · Seleccionado` and `Crear usuario · /admin-hr/users/creation`?**
  _Edge tagged AMBIGUOUS (relation: alimenta) - confidence is low._
- **What is the exact relationship between `Etapa 5 · Seleccionado` and `Selección · Onboarding`?**
  _Edge tagged AMBIGUOUS (relation: podría continuar en) - confidence is low._
- **What is the exact relationship between `No visto: Responder una evaluación 360` and `Evaluaciones 360 del colaborador · /talent/360`?**
  _Edge tagged AMBIGUOUS (relation: falta ver en) - confidence is low._
- **What is the exact relationship between `No visto: Responder una encuesta` and `Mis encuestas · /surveys`?**
  _Edge tagged AMBIGUOUS (relation: falta ver en) - confidence is low._
- **What is the exact relationship between `No visto: Tablero de una vacante con candidatos` and `Detalle de la vacante · /recruitment/job/detail`?**
  _Edge tagged AMBIGUOUS (relation: falta ver en) - confidence is low._
- **What is the exact relationship between `No visto: Configuración de Serena AI` and `Etapa 2 · Serena AI (entrevistadora de IA)`?**
  _Edge tagged AMBIGUOUS (relation: falta ver en) - confidence is low._
- **What is the exact relationship between `No visto: Matriz de talento con datos` and `Matriz de talento · /talent-matrix`?**
  _Edge tagged AMBIGUOUS (relation: falta ver en) - confidence is low._