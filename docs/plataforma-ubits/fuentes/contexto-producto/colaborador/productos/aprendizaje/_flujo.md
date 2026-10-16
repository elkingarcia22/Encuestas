# Flujo — Aprendizaje (colaborador)

## Objetivo

Que el colaborador descubra contenidos, estudie lo asignado, consuma cursos estructurados, vea progreso (vista líder) y use un tutor IA sin confundir esos caminos.

## Actores

- Colaborador (demo: María Alejandra Sánchez Pardo, E006, mi empresa) — también actúa como líder en Progreso y Mi lista
- Persona demo en Agente IA colaborador: Carolina Vargas

## Separación crítica

| Flujo | Qué es | Qué no es |
|-------|--------|-----------|
| Modo estudio IA | Chat tutor (quiz, flashcards; plan interactivo aún no) | Curso LMS con páginas/certificado |
| Experiencia de estudio | Consumo de un contenido del Creator (navegación Lineal o Libre según Ajustes) | Chat libre de tutor |
| Zona de estudio | Planes asignados + exclusivo + historial (tabs) | Catálogo completo ni Progreso |
| Progreso | KPIs, equipo, rankings, recordatorios (vista líder) | Tabs de Zona |
| Home / catálogo | Descubrimiento UBITS | Solo contenidos de la empresa |
| U. Corporativa | Catálogo de la empresa | Catálogo UBITS global |
| Agentes (IA para HR) | Landing de entrada a agentes | Tutor completo (salvo Modo estudio AI) |

## Limitaciones actuales del prototipo (no inventar lo contrario)

- Cards de Zona de estudio **no** navegan a Experiencia de estudio.
- Cards de U. Corporativa **sí** abren Experiencia de estudio (`?id=` del contenido).
- Carrusel **Próximas sesiones presenciales** retirado de U. Corporativa (HU-APR-010 obsoleta). Propuesta página Eventos solo en demo `/lab/u-corporativa-layout`.
- Plan de estudio interactivo en Modo estudio IA: mensaje que invita a Quiz / Flashcards / Podcast.
- “Más preguntas” del quiz reinicia in-place (no nuevo mensaje en chat).
- Toast de certificado en historial de Zona: “Esta acción aún no está disponible en el Playground.”

## Tipo de navegación (experiencia de estudio)

| Tipo | Comportamiento en el índice |
|------|-----------------------------|
| **Lineal** (default) | No se puede saltar a páginas posteriores no completadas |
| **Libre** | Se puede abrir cualquier página de recurso; **Fin del contenido** solo al completar el resto |

Configuración en LMS Creator → Ajustes → Tipo de navegación (`HU-LMS-011`). Consumo: `HU-APR-007`.

**Demo libre en playground:** contenido `f002` «Prevención del acoso laboral» (U. Corporativa) abre con navegación libre; override con `?nav=lineal` o `?nav=libre`.

**Demo recurso asistencia:** Evento `f021` «Protocolos de Supervivencia y Seguridad ante Sismos» (mi empresa, sin secciones): **Fundamentos — actividad práctica** → video → **Simulacro de evacuación** → evaluación → **Taller de primeros auxilios** → fin. Tipo visible: **Evento**. Links: `?id=f021&nav=lineal` y `?id=f021&nav=libre` (HU-APR-009). En **cada** página de asistencia el playground siempre muestra sesión expirada, sesión en curso (cuenta regresiva + Confirmar) y ≥1 futura (Añadir a mi calendario). Confirmar en ventana desbloquea Continuar; Fin no se activa sin confirmar las asistencias requeridas.

**Demo evaluación sin preguntas:** contenido `f007` — card informativa (ícono info) cuando la evaluación se publicó vacía; Continuar avanza a la siguiente página (HU-APR-004).

## Home de ruta (navegación entre contenidos)

| Tipo | Comportamiento en la lista de contenidos |
|------|------------------------------------------|
| **Lineal** (default) | Tras comenzar, solo el primer contenido (y los ya finalizados + el siguiente) están habilitados |
| **Libre** | Tras comenzar, todos los contenidos de la ruta están habilitados |

Antes de **Comenzar ahora**, todos los cards están deshabilitados. **Comenzar ahora** solo desbloquea (Lineal: el primero; Libre: todos) y deja el CTA en **Continuar**; **Continuar** (o clic en un card habilitado) abre el contenido. Progreso = contenidos finalizados / total. Configuración: `HU-LMS-014`. Consumo: `HU-APR-008`. Demo: ruta `u007` con `?nav=lineal|libre` y hashes `#portada-sin-iniciar`, `#portada-en-progreso`, `#portada-completado`.

## HUs

Ver `HU-APR-*`, `HU-IA-001`, `HU-TRA-001` en [`_indice-hus.md`](../../../_indice-hus.md).
