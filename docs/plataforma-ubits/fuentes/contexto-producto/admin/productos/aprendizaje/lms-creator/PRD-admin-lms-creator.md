# PRD · Admin LMS Creator (contenidos, recursos, resultados, rutas)

| Campo | Valor |
| ----- | ----- |
| Producto | UBITS |
| Versión PRD | 0.1 |
| Estado | Lista |
| Dueño producto | TBD |
| Módulo (sidenav / flujo) | Admin → Productos → Aprendizaje → LMS Creator (Contenidos + flujos de creación/edición; excluye Planes y Certificados) |

## 1. Resumen

Este PRD cubre el ciclo de vida de **contenidos formativos** en LMS Creator: listar, crear (contenido, evento, ruta), armar páginas y recursos, publicar con visibilidad y tipo de navegación, editar publicados con política de impacto, y consultar resultados (progreso, evaluaciones, asistencias). En v1 el creador publica material listo para asignar en planes y el colaborador lo consume en Experiencia de estudio respetando Lineal / Libre. **Fuera de este PRD:** Planes de formación / Grupos y Certificados (PRDs aparte).

## 2. Problema y objetivo

Sin un asistente y listado claros, los creadores abandonan borradores, abren el flujo incorrecto (borrador vs publicado) o cambian estructura sin avisar el impacto en el progreso. Recursos como video con IA, evaluación, asistencia (solo Evento), SCORM y presentación interactiva necesitan reglas observables distintas.

Objetivos medibles:

- Aumentar el % de borradores que llegan a Recursos en la misma sesión de creación.
- Reducir tickets de “se me reinició el curso” mediante política explícita de impacto al editar.
- Que el creador localice un contenido (búsqueda/filtros) y abra el flujo correcto según visibilidad.

### Fuera de alcance (v1)

- Planes de formación, Grupos y Chat IA de grupos (PRD de planes).
- Certificados (descarga / configuración) — PRD aparte.
- Categorías, Universidad corporativa LMS y LMS AI del tercer nivel (carpetas `_pendiente`).
- Encuesta libre y Encuesta de satisfacción (visibles deshabilitadas).
- Experiencia de estudio del colaborador (HUs APR); solo se referencia el contrato Lineal/Libre.
- Persistencia real de progreso / timestamps fuera de lo observable en UI.

## 3. Personas y permisos

| Rol | Qué puede hacer (observable) | Qué no puede |
| --- | ---------------------------- | ------------ |
| Creador LMS (persona demo Ana) | Listar, crear, editar, publicar, consultar Resultados; usar recursos (video IA, SCORM, etc.) | Consumir como estudiante el progreso de otros; eliminar páginas en publicados (solo ocultar/mostrar) |
| Administrador HR (con permiso de creación) | Mismo ciclo de contenidos si tiene permiso | Definir aquí roles finos de tenant (PENDIENTE fuera del playground) |
| Colaborador | Consumir contenido publicado en Experiencia de estudio según navegación | Editar contenidos LMS |

## 4. Restricciones de producto

| Hallazgo | Implicación para la experiencia |
| -------- | ------------------------------- |
| Asistente fijo de 4 pasos | Portada → Recursos → Certificado → Ajustes; Ajustes concentra visibilidad, pesos y tipo de navegación |
| Página solo nace al confirmar el recurso | Abandonar modal / Volver no crea página |
| Asistencia solo en Evento | No aparece en Crear contenido; sí en Crear evento / Evento publicado |
| Evaluación: alta oficial inline | «Crear página» → editor en Recursos (puede ir vacía); inmersiva = legacy por URL |
| Editados publicados | Switch **Habilitar edición** abre modal de impacto; sin eso no muta Recursos |
| En publicados: ocultar/mostrar, no eliminar | Siempre ≥1 página visible; ocultar evaluación dispara recálculo de pesos |
| Tipo de navegación Lineal (default) / Libre | Contenido = entre páginas; ruta = entre contenidos hijos; cambio sin republicar |
| Empty de listado | Título «No se encontraron resultados»; acción «Limpiar búsqueda»; badge Filtrar = criterios, no filas |

## 5. Experiencia de usuario (flujos)

**Entrada:** Aprendizaje → LMS Creator → Contenidos (listado). CTA Crear contenido abre menú: Crear contenido, Crear ruta de aprendizaje, Crear evento.

**Camino feliz — crear contenido:** Portada → Recursos (Añadir página) → Certificado → Ajustes (visibilidad Pública/Privada/Oculta o Borrador; navegación Lineal/Libre) → publicar o dejar borrador.

**Añadir página:** modal fullscreen; título opcional; Video/PDF/Texto/Embebido/SCORM avanzan al clic; Evaluación pide Crear página; Asistencia solo en Evento. Volver reabre Añadir página sin crear.

**Video con IA:** setup (Idea, Contexto, Objetivo, Duración, Estilo visual obligatorio, Voz; avanzado colapsado) → borrador de escenas → editor → Generar video monta la página. Salir sin generar no crea página (borrador en Recursos IA). Subir video: MP4 hasta 500 MB.

**Editar publicado:** Recursos se visita sin modal; Habilitar edición → política de impacto; añadir/ocultar/reemplazar según reglas; Resultados para progreso, evaluaciones, intentos, descargas y asistencias (filtro página + sesión; CSV).

**Empty:** listado sin match → empty de producto. Ajustes → Pesos sin evaluaciones → empty de pesos. Chat/recursos deshabilitados no se ofrecen como alta.

**Error / borde:** contenido Archivado = solo lectura. Evaluación publicada vacía: el colaborador ve pantalla informativa y puede continuar. Sesiones de asistencia con fecha pasada en edición = solo lectura (no aplica el mismo lock en Crear evento).

## 6. Especificación UI

**Listado:** tabla y/o cuadrícula; búsqueda; Filtrar con conteo de criterios; contador «contenidos»; pin del ítem tras crear/editar; navegación por visibilidad (Borrador → asistente prellenado; Público/Privado/Oculto → editar; Archivado → solo lectura).

**Crear contenido / evento:** mismo asistente; evento sin tipo en ficha técnica y con Asistencia en Recursos.

**Crear ruta:** flujo de ruta con tipo de navegación entre contenidos (HU-LMS-008 / HU-LMS-014).

**Recursos (copy neutro clave):** Añadir página; Crear página (evaluación); Habilitar edición; Generar video; Ver página (alert de éxito en flujos generativos, sin toast extra).

**Resultados:** tabs de progreso (drawer solo lectura por estudiante/página, tag Oculta si aplica), evaluaciones, gestión de intentos, descargas; Asistencias con carga manual/grupos/CSV y fecha/hora de confirmación; fecha de publicación en cabecera.

**Ajustes:** hub de visibilidad; pesos; tipo de navegación; impacto en el progreso (solo editar).

## 7. Requisitos de calidad (producto)

- Accesibilidad: modales fullscreen con Volver / cerrar claros; no crear página al abandonar.
- Idioma UI: español neutro (Añadir página, Limpiar búsqueda, Vista previa donde aplique — nunca «Preview» en UI).
- Privacidad: Resultados muestran progreso de inscritos al creador/admin; drawer de progreso es solo lectura (no navega el curso por el estudiante).
- Empty / error: empty de listado canónico; créditos IA insuficientes → bloqueo observable de acciones generativas (detalle de costos en HUs de recurso); legacy de evaluación no debe presentarse como flujo oficial.

## 8. Criterios de aceptación

**Escenario: Camino feliz — crear y listar**

**Dado** que el creador está en el listado de contenidos
**Cuando** elige Crear contenido, completa el asistente hasta Ajustes y publica con visibilidad Pública
**Entonces** el contenido queda disponible según esa visibilidad
**Y** al volver al listado el ítem queda primero
**Y** puede buscarlo o filtrarlo por estado

**Escenario: Camino feliz — editar con impacto**

**Dado** que un contenido Público tiene inscritos
**Cuando** el creador activa Habilitar edición en Recursos y confirma la política de impacto
**Entonces** puede añadir u ocultar páginas según las reglas
**Y** siempre queda al menos una página visible
**Y** el tipo de navegación se puede cambiar sin republicar

**Escenario: Caso borde — Asistencia solo en Evento**

**Dado** que el creador está en Crear contenido (no evento)
**Cuando** abre Añadir página
**Entonces** no ve Asistencia entre los tipos habilitados
**Cuando** está en Crear evento o en un Evento publicado con edición habilitada
**Entonces** puede añadir Asistencia

**Escenario: Camino negativo — abandonar recurso**

**Dado** que el creador abrió Añadir página y avanzó a un modal de recurso
**Cuando** usa Volver o cierra sin confirmar
**Entonces** no se crea una página nueva en Recursos

**Escenario: Caso borde — empty de búsqueda**

**Dado** que el listado no tiene coincidencias con la búsqueda o filtros
**Cuando** el creador mira el empty state
**Entonces** ve el título No se encontraron resultados
**Y** puede usar Limpiar búsqueda

## 9. Fases de entrega

| Fase | Incluye | No incluye |
| ---- | ------- | ---------- |
| v1 (playground maduro) | Listado, crear/editar contenido, evento, ruta, recursos documentados, resultados, navegación contenido/ruta | Planes, certificados, categorías, U. corporativa LMS, LMS AI, encuestas habilitadas |
| Posterior | Reactivar evaluación inmersiva oficial; habilitar encuestas; madurar ítems `_pendiente` del tercer nivel | Mezclar Planes/Certificados en este PRD |

## 10. Decisiones abiertas

1. **PENDIENTE —** Cuándo la evaluación inmersiva deja de ser legacy y vuelve al flujo oficial.
2. **PENDIENTE —** Criterios de negocio para habilitar Encuesta libre / Encuesta de satisfacción.
3. **PENDIENTE —** Alcance de Categorías, Universidad corporativa (LMS) y LMS AI (hoy `_pendiente`).
4. **PENDIENTE —** Política de créditos IA por acción generativa en producción (umbrales y mensajes) más allá del mock del playground.
5. **PENDIENTE —** Permisos finos creador vs admin HR en tenants reales.

## 11. Trazabilidad a HUs

| ID tentativo | Título | Fase |
| ------------ | ------ | ---- |
| HU-LMS-001 | Crear contenido LMS (asistente de 4 pasos) | v1 |
| HU-LMS-002 | Editar contenido publicado e impacto en el progreso | v1 |
| HU-LMS-003 | Video con IA | v1 |
| HU-LMS-004 | Listado de contenidos LMS Creator | v1 |
| HU-LMS-008 | Crear ruta | v1 |
| HU-LMS-010 | Agregar evaluación | v1 |
| HU-LMS-011 | Tipo de navegación (contenido) | v1 |
| HU-LMS-012 | Progreso del estudiante en Resultados | v1 |
| HU-LMS-013 | Resultados del contenido | v1 |
| HU-LMS-014 | Tipo de navegación (ruta) | v1 |
| HU-LMS-025 | Recurso asistencia *(bajo Contenidos/recursos)* | v1 |
| HU-LMS-026 | Resultados de asistencias | v1 |
| HU-LMS-017 | SCORM | v1 |
| HU-LMS-018 | Presentación interactiva | v1 |
| HU-LMS-019 | Ocultar evaluación y pesos | v1 |
| HU-LMS-020 | Crear evento | v1 |

> Nota: **HU-LMS-015** y **HU-LMS-016** son de Planes (tab/reportes competencias). Las de asistencia de Contenidos son **HU-LMS-025** y **HU-LMS-026**: compartían ID con las de Planes y el sitemap solo podía resolver una de las dos, así que se reasignaron (23-sep-2026).

## 12. Referencias

- [fundamentos/00-mapa.md](../../../../fundamentos/00-mapa.md)
- [admin/productos/aprendizaje/lms-creator/_flujo.md](_flujo.md)
- [_indice-hus.md](../../../../_indice-hus.md) — Admin → LMS Creator → Contenidos / Recursos / Resultados / Navegación
- Guía copy diapositivas: [guia-copy-diapositivas.md](contenidos/recursos/guia-copy-diapositivas.md)
- PRDs hermanos (fuera de alcance): planes de formación; certificados
