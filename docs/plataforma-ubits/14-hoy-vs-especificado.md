# Hoy frente a lo especificado

Cómo pasa cada parte de la plataforma actual al nuevo UBITS. Flechas «evoluciona a» en el grafo.

| Hoy | En el nuevo UBITS | Nota |
| --- | --- | --- |
| Barra lateral del colaborador (8 módulos) | Workspace colaborador: Inicio → Productos → Herramientas | de ocho módulos de producto a Inicio → Productos → Herramientas |
| Marco B · Administrador | Workspace admin: Inicio → Productos → Herramientas | la barra superior del administrador pasa a ser un menú lateral |
| Marco C · Creator | Aprendizaje · LMS Creator | el Creator deja de ser un marco aparte y entra al menú del admin |
| Marco D · Reclutamiento | Admin · Selección (badge Nuevo) | Reclutamiento pasa a llamarse Selección y entra a Productos del admin |
| Marco E · Métricas | Aprendizaje · Métricas (admin) | Métricas pasa a ser una hoja de Aprendizaje |
| Inicio del administrador · /admin-hr/home | Admin · Inicio (dashboard HR) |  |
| Portal Colaborador · /portal | Colaborador · Inicio | el portal de hoy no tiene historia en la especificación |
| Comunicaciones · /admin-hr/comunications | Herramientas · Avisos internos | Comunicaciones se renombra Avisos internos |
| Noticias y anuncios (bloque del portal) · /portal | Herramientas · Avisos internos |  |
| Gestión de usuarios · /admin-hr/users | Configuración · Gestión de usuarios |  |
| Crear usuario · /admin-hr/users/creation | Configuración · Gestión de usuarios |  |
| Acciones masivas por archivo · /admin-hr/users/bulk-user-* | Configuración · Gestión de usuarios |  |
| Roles y permisos · /access-control/home | Configuración · Roles y permisos |  |
| Organigrama · /portal/org-chart | Configuración · Organigrama |  |
| Detalle de empresa · /admin-hr/companies/:id | Configuración · Datos de empresa |  |
| LMS · gestión de contenidos · /creator/catalog/:empresa | LMS Creator · Contenidos |  |
| Ai Studio · /ai-studio/home/resources | LMS Creator · LMS AI | Ai Studio pasa a llamarse LMS AI |
| Personalizar la universidad · /university-customization/:empresa | LMS Creator · Universidad corporativa |  |
| Planes de formación · /creator/training-plan/content-plan | Planes de Formación · Planes |  |
| Grupos de usuarios · /creator/groups | Planes de Formación · Grupos |  |
| Certificados · /certificate-management/:empresa | Certificados · Descarga |  |
| Certificados · /certificate-management/:empresa | Certificados · Configuración |  |
| Evaluaciones 360 del administrador · /talent/360/admin | Desempeño · Evaluaciones 360 (admin) |  |
| Objetivos del administrador · /talent/goals/admin | Desempeño · Objetivos (admin) |  |
| Matriz de talento · /talent-matrix | Desempeño · Matriz de talento (admin) |  |
| Encuestas del administrador · /surveys/admin | Desempeño · Encuestas (admin) |  |
| Diagnóstico del administrador · /assessments/admin | Aprendizaje · Diagnóstico (admin) |  |
| Agente: Plan de desarrollo individual (PDI) | Desempeño · PDI (admin) | el PDI pasa de agente a ítem del menú |
| Agente: Plan de onboarding | Selección · Onboarding | el onboarding pasa de agente a ítem de Selección |
| Tareas · seguimiento · /tasks/tracking | Herramientas · Tareas → Seguimiento HR |  |
| Tareas · seguimiento · /tasks/tracking | Tareas · Seguimiento (vista líder) |  |
| Tareas · agenda · /tasks/individual | Tareas · Mi lista |  |
| Tareas · planes · /tasks/group | Tareas · Planes |  |
| Tareas · plantillas · /tasks/templates | Tareas · Plantillas |  |
| Aprendizaje · inicio · /home/learning | Aprendizaje · Catálogo |  |
| Catálogo · /catalog | Aprendizaje · Catálogo |  |
| Universidad corporativa · /university | Aprendizaje · Universidad corporativa |  |
| Zona de estudio · plan de contenidos · /learn/study-zone/assigned-content | Aprendizaje · Zona de estudio |  |
| Progreso · /learn/progress | Aprendizaje · Progreso (vista líder) |  |
| Modo estudio IA · /learn-ia | Aprendizaje · Modo estudio AI |  |
| Ficha de contenido · /learner/content/:id | Experiencia de estudio (fuera del menú) |  |
| Reproductor · /learner/content/:id/page/:pagina | Experiencia de estudio (fuera del menú) |  |
| Evaluaciones 360 del colaborador · /talent/360 | Desempeño · Evaluaciones 360 (colaborador) |  |
| Objetivos del colaborador · /talent/goals/own | Desempeño · Objetivos (colaborador) |  |
| Mis encuestas · /surveys | Desempeño · Encuestas (colaborador) |  |
| Mis assessments · /assessments | Aprendizaje · Diagnóstico (colaborador) |  |
| Agentes AI · portada · /market-ai/home | Agentes · IA para HR (fuera del menú) |  |
| Catálogo de agentes · /market-ai/home | Agentes · IA para HR (fuera del menú) |  |
| No encontrado del administrador · /admin-hr/404 | Errores de sistema (transversal) |  |
| No encontrado del Creator · /creator/no-match | Errores de sistema (transversal) |  |
| Moneda: créditos de Ai Studio | Menú de empresa (logo): Licencias, Créditos, Configuración y sucursales | los créditos se ven en un solo lugar |
| Moneda: cuota de entrevistas de Reclutamiento | Menú de empresa (logo): Licencias, Créditos, Configuración y sucursales |  |
| Vacantes · /recruitment/job/dashboard | Selección · Vacantes |  |
| Plantillas de flujos · /recruitment/workflows | Selección · Plantillas |  |
| Dashboard de reclutamiento · /recruitment/dashboard | Selección · Dashboard |  |
| Métricas Ubits · tableros · reports.intranalytics.ubitslearning.com | Aprendizaje · Métricas (admin) |  |
| UBITS Metrics · /admin-hr/metrics | Aprendizaje · Métricas (admin) |  |

## Lo que hoy existe y no aparece en la especificación

- **Nómina (Novasoft):** hoy está en la barra lateral; el nuevo UBITS no la menciona.
- **Candidatos:** hoy es un ítem de Reclutamiento; Selección especificada tiene Dashboard, Onboarding, Vacantes y Plantillas.
- **Bienvenida del Creator:** hoy un modal y un recorrido guiado; en la especificación el LMS Creator se abre directo.
- **Agentes en la barra lateral:** hoy es un módulo del menú; en la especificación se abre por URL.

## Diferencias y coincidencias concretas

- los borradores de 360 hoy se guardan; en la especificación se pierden al salir
- hoy la tarjeta de Zona de estudio abre el contenido; en el prototipo aún no
- Zona de estudio tiene 3 pestañas hoy y 4 especificadas (suma «Exclusivo para mí»)
- hoy 9 agentes en un módulo del menú; especificados 3 fuera del menú más el Agente de tu empresa
- Selección especificada suma Onboarding y no tiene Candidatos
- los planes hoy son Vigente / No vigente; se especifican además Planeado y Procesando
- «Cursos de mi empresa» y «Acceder al creador» hoy; «Contenidos de mi empresa» y «Acceder a LMS Creator» especificado
- la Nómina desaparece del menú en el nuevo UBITS
- el Creator deja de abrir con modal y recorrido guiado
- los costos de IA de hoy (video 320, guion 80) son los especificados

## Inconsistencias dentro de la especificación

- el flujo del Agente de tu empresa dice «rail Agentes», pero Agentes no está en el menú
- los tokens de Presentación interactiva son provisionales y siguen sin definir
- «Planes de formación del colaborador» describe planes de tareas, no de formación

## Ítems sin historia que el recorrido ya documenta (16 de 29)

Para estos ítems el recorrido de la plataforma actual describe pantallas con contenido real: son el punto de partida para escribir sus HUs.

- **Selección · Dashboard** ← Dashboard de reclutamiento · /recruitment/dashboard
- **Selección · Vacantes** ← Vacantes · /recruitment/job/dashboard, Crear vacante · 1 información básica · /recruitment/job/create/basic-info, Crear vacante · 2 configurar · /recruitment/job/create/configuration, Crear vacante · 3 visibilidad y equipo · /recruitment/job/create/add-members, Vacante creada · /recruitment/job/create/publish, Flujo del candidato
- **Selección · Plantillas** ← Plantillas de flujos · /recruitment/workflows
- **LMS Creator · Universidad corporativa** ← Personalizar la universidad · /university-customization/:empresa
- **LMS Creator · LMS AI** ← Ai Studio · /ai-studio/home/resources
- **Certificados · Configuración** ← Certificados · /certificate-management/:empresa
- **Aprendizaje · Métricas (admin)** ← UBITS Metrics · /admin-hr/metrics, Métricas Ubits · tableros · reports.intranalytics.ubitslearning.com, Métricas Ubits · colaboradores · /admin/manage
- **Desempeño · Encuestas (admin)** ← Encuestas del administrador · /surveys/admin
- **Herramientas · Avisos internos** ← Comunicaciones · /admin-hr/comunications, Crear publicación, Trazabilidad de publicación · /admin-hr/comunications/publication-trace/:id
- **Desempeño · PDI (admin)** ← Agente: Plan de desarrollo individual (PDI)
- **Configuración · Gestión de usuarios** ← Gestión de usuarios · /admin-hr/users, Crear usuario · /admin-hr/users/creation, Acciones masivas por archivo · /admin-hr/users/bulk-user-*
- **Configuración · Organigrama** ← Organigrama · /portal/org-chart
- **Configuración · Datos de empresa** ← Detalle de empresa · /admin-hr/companies/:id
- **Configuración · Roles y permisos** ← Roles y permisos · /access-control/home
- **Colaborador · Inicio** ← Portal Colaborador · /portal
- **Tareas · Plantillas** ← Tareas · plantillas · /tasks/templates

Existen hoy pero vacíos en la cuenta recorrida (7): Aprendizaje · Diagnóstico (admin), Desempeño · Matriz de talento (admin), Desempeño · Objetivos (admin), Desempeño · Evaluaciones 360 (colaborador), Aprendizaje · Diagnóstico (colaborador), Desempeño · Encuestas (colaborador), Desempeño · Objetivos (colaborador).

Sin nada equivalente hoy (6): Selección · Onboarding, LMS Creator · Categorías, Aprendizaje · Reportes (admin), Configuración · Personalización, Aprendizaje · Métricas (colaborador), Desempeño · Matriz de talento (colaborador).
