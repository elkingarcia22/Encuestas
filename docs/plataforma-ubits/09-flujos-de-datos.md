# Flujos de datos

Qué le deja cada pantalla a la siguiente. Los datos fluyen de forma continua aunque la navegación los parta en marcos.

- Crear usuario · /admin-hr/users/creation → Ficha de la persona: El alta crea la ficha de la persona.
- Acciones masivas por archivo · /admin-hr/users/bulk-user-* → Ficha de la persona: Las acciones masivas crean y editan fichas.
- Ficha de la persona → Organigrama · /portal/org-chart: Área y líder arman el organigrama.
- Ficha de la persona → Grupos de usuarios · /creator/groups: Los grupos se arman solos por ciudad, país y usuario.
- Grupos de usuarios · /creator/groups → Planes de formación · /creator/training-plan/content-plan: Los planes se asignan a grupos.
- Planes de formación · /creator/training-plan/content-plan → Zona de estudio · plan de contenidos · /learn/study-zone/assigned-content: El plan asignado aparece en la zona de estudio.
- Planes de formación · /creator/training-plan/content-plan → Portal Colaborador · /portal: El plan aparece en «¿Qué quieres aprender hoy?».
- Reproductor · /learner/content/:id/page/:pagina → Progreso · /learn/progress: Estudiar suma progreso.
- Progreso · /learn/progress → Historial y certificados · /learn/study-zone/history: Lo terminado queda en el historial con su certificado.
- Certificados · /certificate-management/:empresa → Historial y certificados · /learn/study-zone/history: Las plantillas definen el diploma que se descarga.
- Progreso · /learn/progress → Métricas Ubits · tableros · reports.intranalytics.ubitslearning.com: El avance alimenta las métricas de aprendizaje. (deducido)
- Progreso · /learn/progress → Reporte mensual · /tracking-report-settings/:empresa/student-report: El avance del mes va al reporte mensual.
- Mapa de competencias → Zona de estudio · plan de competencias · /learn/study-zone/assigned-competences: El mapa de competencias da origen a los planes de competencias. (deducido)
- Evaluaciones 360 del administrador · /talent/360/admin → Evaluaciones 360 del colaborador · /talent/360: La evaluación se lanza y cada persona responde en su portal.
- Objetivos del administrador · /talent/goals/admin → Objetivos del colaborador · /talent/goals/own: El ciclo de objetivos llega al colaborador.
- Evaluaciones 360 del colaborador · /talent/360 → Matriz de talento · /talent-matrix: La matriz cruza los resultados de la 360…
- Objetivos del colaborador · /talent/goals/own → Matriz de talento · /talent-matrix: …con el cumplimiento de objetivos.
- Matriz de talento · /talent-matrix → Agente: Plan de desarrollo individual (PDI): Los resultados se convierten en un plan de desarrollo individual.
- Agente: Plan de desarrollo individual (PDI) → Tareas · planes · /tasks/group: El plan de desarrollo se vuelve plan de tareas. (deducido)
- Encuestas del administrador · /surveys/admin → Mis encuestas · /surveys: La encuesta se lanza y el colaborador responde.
- Comunicaciones · /admin-hr/comunications → Noticias y anuncios (bloque del portal) · /portal: Lo publicado aparece en noticias del portal.
- Vacantes · /recruitment/job/dashboard → Flujo del candidato: Cada vacante tiene su flujo de etapas.
- Flujo del candidato → Candidatos · /recruitment/job/candidate-pool: Los candidatos avanzan por las etapas. (deducido)
- Flujo del candidato → Dashboard de reclutamiento · /recruitment/dashboard: El dashboard mide la conversión por etapa.
- Etapa 5 · Seleccionado → Crear usuario · /admin-hr/users/creation: Quien se contrata tendría que darse de alta; no se comprobó si hay conexión. (sin comprobar)
- Crear publicación → correo a toda la empresa: al activarla, avisa a los 646 colaboradores.

## Las dos cadenas

- Aprendizaje: ficha → grupos → plan de formación → zona de estudio → reproductor → progreso → historial y certificado → métricas.
- Talento: evaluación 360 y objetivos → matriz de talento → plan de desarrollo → tareas.
