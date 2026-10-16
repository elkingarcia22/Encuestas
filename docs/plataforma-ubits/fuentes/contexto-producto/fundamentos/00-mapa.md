# Mapa de producto UBITS

UBITS es la plataforma LXP (Learning Experience Platform) de formación corporativa. Las empresas (ej. demo **mi empresa**) dan a sus colaboradores contenidos, planes, evaluaciones y herramientas de IA; los admins HR y creadores LMS gestionan catálogo, asignaciones y resultados.

## Dos caras del producto

| Cara | Quién | Para qué |
|------|--------|----------|
| **Colaborador (learner)** | Empleado de la empresa cliente | Aprender, completar planes/tareas, consumir contenidos, usar tutores IA |
| **Admin / Creator** | Admin HR, creador de contenidos LMS | Publicar contenidos, asignar planes, medir progreso, configurar evaluaciones |

LMS Creator vive dentro del mundo de administración.

## Módulos con especificación madura

```
UBITS
├── Colaborador
│   ├── Inicio
│   ├── Productos
│   │   ├── Aprendizaje      ← Modo estudio AI, Catálogo, Universidad corporativa, Zona de estudio, Progreso, Métricas, Diagnóstico
│   │   └── Desempeño y cultura ← Evaluaciones 360, Objetivos, Matriz de talento, Encuestas
│   └── Herramientas
│       └── Tareas (acordeón) ← Tareas, Planes, Plantillas, Seguimiento (vista líder)
├── Admin (Workspace: Inicio + Productos + Herramientas; Configuración en el menú del logo)
│   ├── Inicio               ← dashboard HR
│   ├── Productos
│   │   ├── Selección        ← Dashboard, Onboarding, Vacantes, Plantillas (badge Nuevo)
│   │   ├── Aprendizaje      ← LMS Creator (Contenidos, Categorías, Universidad corporativa, LMS AI), Planes de Formación, Certificados, Diagnóstico, Reportes, Métricas
│   │   └── Desempeño y cultura ← Evaluaciones 360, Objetivos, Matriz de talento, PDI, Encuestas
│   ├── Herramientas
│   │   ├── Tareas ← ítem único: Seguimiento HR (empresa-completa)
│   │   ├── Avisos internos
│   │   └── Agente de tu empresa
│   ├── Configuración        ← usuarios, personalización, organigrama, datos, roles (menú del logo; no sidenav ni header)
│   └── Agente IA            ← chat genérico (temprano; distinto del superagente con colecciones)
└── Transversal
    ├── Agente de tu empresa  ← un agente/empresa + colecciones; HU-TRA-001
    └── Errores de sistema      ← 404, sin acceso (contenido sin matrícula), sin conexión, licencia vencida, 500/503/504
```

**Agentes (IA para HR)** sigue existiendo como página del colaborador, pero **no** aparece en el sidenav: se abre por URL directa. **Reportes de desempeño** del colaborador se eliminó.

## Relaciones clave

| De | A | Relación |
|----|---|----------|
| LMS Creator → Contenido publicado | Experiencia de estudio | El colaborador consume el contenido estructurado (navegación Lineal o Libre según Ajustes) |
| LMS Creator → Ruta publicada | Home de ruta | El colaborador ve la portada de la ruta y desbloquea contenidos hijos (Lineal o Libre entre contenidos) |
| LMS Creator → Tipo de navegación (contenido) | Experiencia de estudio | Lineal/Libre entre **páginas** |
| LMS Creator → Tipo de navegación (ruta) | Home de ruta | Lineal/Libre entre **contenidos** hijos |
| LMS Creator → Plan de formación | Tareas / Zona de estudio | El plan asigna contenidos o competencias a personas/grupos |
| Modo estudio IA | Catálogo UBITS | Tutor libre; puede sugerir cursos/planes si el tema está en catálogo |
| Modo estudio IA | Experiencia de estudio | **No** son el mismo flujo; no redirigir uno al otro |
| Edición de contenido | Planes / rutas / certificados | Cambios estructurales disparan política de impacto en el progreso |
| Resultados → Progreso | Experiencia de estudio | El creador ve (solo lectura) qué páginas completó el estudiante; no navega el curso por él |
| Resultados → Evaluaciones / intentos / descargas | Recurso Evaluación o encuesta | Notas, desbloqueo de 1 intento extra y reportes por recurso; no es la descarga de certificados |
| Resultados → Asistencias | Recurso asistencia | Filtro de página y filtro de sesión; lista de asistentes; modo Manual o Autoconfirmación; fecha/hora de confirmación; Subir CSV; descargar CSV de la sesión activa |
| Video con IA | Página de recurso Video | Video por escenas; se monta como recurso de una página |
| Video Avatar IA | Página de recurso Video | Video sencillo de presentador (p. ej. intro); convive con Video con IA en Agregar video |
| Añadir página (modal) | Página + recurso | Título opcional; Video/PDF/Texto/Embebido/SCORM/Presentación interactiva de una; Asistencia solo en Evento; Evaluación + «Crear página» |
| Evaluación final | Página de recurso Evaluación | Alta oficial: «Crear página» → editor inline (puede ir vacía). Si se publica vacía, el colaborador ve una pantalla informativa (ícono info) y puede continuar. Inmersiva preservada como legacy por URL hasta el siguiente Q |
| Recurso asistencia | Página de recurso Asistencia (solo Evento) | Modal fullscreen: sesión precreada, descripción opcional, zona horaria de la compañía; el estudiante confirma en ventana y ve tooltip de fecha/hora en Confirmado |
| Presentación interactiva | Página de recurso Presentación interactiva | Studio V2 (idea + contexto → editor diapositivas → Generar); no vive dentro del modal SCORM |
| SCORM | Página de recurso SCORM | Modal SCORM: solo Subir .zip |
| Texto (modal) | Página de recurso Texto | Lectura + Editar reabre el modal |
| Chat IA grupos | Grupos | Guía crear/editar/consultar; CRUD manual sigue en Grupos |
| Barra plan admin (% al 100%) | Estado Finalizado colaborador (≥ 65%) | **Métricas distintas** — no equivalentes |
| Sidenav admin | Productos / Herramientas | Inicio suelto; Selección (Nuevo) incluye Onboarding; Aprendizaje tiene tercer nivel en LMS Creator, Planes de Formación y Certificados; Diagnóstico, Reportes y Métricas son hojas; Desempeño y cultura; Tareas (ítem único → Seguimiento HR); Avisos internos; Agente de tu empresa. Configuración en el menú del logo |
| Sidenav colaborador | Productos / Herramientas | Inicio → Productos (Aprendizaje, Desempeño y cultura) → Herramientas (Tareas en acordeón). Aprendizaje: Modo estudio AI, Catálogo, Universidad corporativa, Zona de estudio, Progreso, Métricas, Diagnóstico. Encuestas va bajo Desempeño y cultura. Sin Agentes en el rail. Sin Reportes de desempeño. Sin Reclutamiento |
| AppHeader móvil | Sidebar Workspace | ≤1023px: hamburguesa abre el sidebar a pantalla completa (encima del header). Cerrar con X o Escape. No hay TabBar. |

## Usuario demo colaborador

En todo el playground colaborador: **María Alejandra Sánchez Pardo** (`E006`), mi empresa.

## Qué falta (no escribir HUs de producto aún)

Sin HU de producto todavía: Configuración (datos, usuarios, organigrama, roles, personalización), Onboarding de Selección, matriz de talento, objetivos admin, encuestas, diagnóstico, **Selección** (ex reclutamiento), editar 360, plantillas de tareas, certificados configuración, Avisos internos, Métricas (admin y colaborador). **Agente de tu empresa** sí tiene su HU documentada (colecciones, cara del agente y Probar agente); HU-TRA-001.
