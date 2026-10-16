# PRD · Admin Planes de formación, Grupos y Chat IA

| Campo | Valor |
| ----- | ----- |
| Producto | UBITS |
| Versión PRD | 0.1 |
| Estado | Lista |
| Dueño producto | TBD |
| Módulo (sidenav / flujo) | Admin → Productos → Aprendizaje → Planes de Formación (Planes, Grupos) + Chat IA de grupos |

## 1. Resumen

Este PRD cubre la **asignación y seguimiento** de formación: planes de **contenidos** y de **competencias**, gestión de **grupos**, asistente de **Chat IA** para grupos, tabs masivos en edición, y reportes CSV desde el detalle. En v1 HR crea planes con estados claros, asigna a empresa / personas / grupos / archivo, ve progreso como **% de personas al 100 %** de su asignación, y exporta reportes por estudiante o detallados. Quedan fuera Certificados y el ciclo de creación de contenidos LMS (PRD de LMS Creator).

## 2. Problema y objetivo

Asignar persona a persona no escala; un promedio de avances parciales engaña sobre “quién terminó”. Hace falta distinguir tipos de plan, estados (Planeado → Procesando → Vigente / No vigente) y una barra que solo cuente completitud total. Los grupos reutilizables y el chat IA reducen tiempo de armado; los tabs de Competencias/Contenidos permiten mutaciones masivas sin mezclarlas con la vista de progreso.

Objetivos medibles:

- Que la barra del plan admin represente solo estudiantes al **100 %** de su asignación (no el promedio parcial).
- Reducir el tiempo de armar una asignación grupal frente a selección individual repetida.
- Descargar el reporte correcto (por estudiante vs detallado) en menos de ~30 segundos desde Acciones del detalle.

### Fuera de alcance (v1)

- Vista personal del colaborador en Tareas / planes (HU-TAR-002) — se referencia solo la **distinción de métrica**.
- Descarga masiva de certificados (HU-LMS-007).
- Crear / editar contenidos LMS (PRD LMS Creator).
- Botón «Crear con IA» de la lista de planes (visible sin comportamiento).
- Ejecución completa de creación/edición de grupos desde cada subopción del Chat IA (hoy responde «Próximamente…»).
- Persistencia durable de un grupo recién creado hacia el catálogo seed de planes en la misma sesión (limitación documentada en HU).
- Organigrama y permisos finos de roles.

## 3. Personas y permisos

| Rol | Qué puede hacer (observable) | Qué no puede |
| --- | ---------------------------- | ------------ |
| Administrador HR | Crear/gestionar planes y grupos; ver detalle/progreso; descargar reportes; usar Chat IA de grupos | Confundir la barra admin (100 %) con el Finalizado del colaborador (≥ 65 %); mutar desde el detalle (solo lectura en tabs de competencias/contenidos) |
| Creador LMS / admin con permiso | Mismas acciones de planes cuando opera el módulo | Ejecutar aún las subopciones profundas del Chat IA como CRUD real |
| Colaborador | Ver su progreso en su cara (otra HU); estado Finalizado con umbral propio | Editar planes admin ni ver la misma barra de % al 100 % como definición de Finalizado |

## 4. Restricciones de producto

| Hallazgo | Implicación para la experiencia |
| -------- | ------------------------------- |
| **Dos métricas distintas** | Barra plan admin = % de estudiantes al **100 %** de su asignación. Estado **Finalizado** colaborador = avance **≥ 65 %**. No son equivalentes; no copiar un número al otro |
| Tipos de plan | Contenidos vs competencias; competencias: «Horas por competencia» global (mín. 1, default 8); máx. **8 competencias por asignación** |
| Estados | Planeado, Procesando (con %), Vigente, No vigente. Nuevo plan nace **Planeado**, no Vigente |
| Clic en fila | Planeado/Procesando → editar; Vigente/No vigente → detalle de progreso. Menú ⋮: Ver progreso / Editar / Eliminar (confirmar escribiendo «eliminar») |
| Mutaciones masivas | Viven en **Editar plan** (tabs Competencias o Contenidos), no en el detalle. Autoguardado + indicador de guardado; sin botón Guardar |
| Reportes | Solo en detalle Vigente / No vigente: **Reporte por estudiante** y **Reporte detallado**. No en Planeado/Procesando |
| Chat IA | Intenciones Crear / Editar / Consultar grupos; subopciones; tras elegir subopción → «Próximamente…» en el alcance actual |
| Tooltip de progreso | Indica actualización cada 30 minutos, no tiempo real |

## 5. Experiencia de usuario (flujos)

**Entrada:** Aprendizaje → Planes de Formación → Planes o Grupos. Desde Grupos: entrada a Asistente IA / Chat IA.

**Camino feliz — plan de contenidos:** lista (pestaña contenidos) → crear con fechas + ≥1 asignación con ≥1 contenido → Guardar → estado Planeado → toast de éxito. Al pasar a Vigente, el detalle muestra progreso; Acciones ofrece reportes.

**Camino feliz — plan de competencias:** igual con horas ≥ 1 y ≥1 competencia por asignación; tope 8; mensaje «Máximo 8 competencias por asignación.» al exceder.

**Edición masiva:** en Editar plan (Planeado/Procesando/Vigente), tab Competencias o Contenidos → Agregar usuario (preseleccionados) / Reemplazar / Eliminar → autoguardado. Detalle: mismo tab en solo lectura.

**Grupos:** listar → crear (nombre, descripción, integrantes) → toast «Grupo creado correctamente.» → listado. Se puede guardar con 0 integrantes («Aún no hay integrantes»). Eliminar confirma escribiendo «eliminar».

**Chat IA:** welcome «Hola, {nombre}» → Crear / Editar / Consultar grupos → subopciones → respuesta Próximamente. Historial vacío: «No hay conversaciones».

**Empty / borde:** No vigente no agrega contenidos nuevos; sin CTA masiva Asignar en Vigente/No vigente. Nombre vacío de plan se guarda como «Plan sin nombre».

**Error / negativo:** competencias con horas 0/vacío no guardan; cancelar eliminación de grupo mantiene el ítem; Chat IA no ejecuta CRUD real en subopciones.

## 6. Especificación UI

**Listas de planes:** pestañas contenidos / competencias; estados visibles; menú ⋮ según estado.

**Crear / editar plan:** fechas; asignaciones (empresa, colaborador, grupos, archivo); en competencias campo global Horas por competencia; en edición tabs Colaboradores | Competencias (o Contenidos) con conteo legible (`N competencias` / `N contenidos` / `N colaboradores`), buscador, Agregar asignación una sola vez en la fila de tabs; ProfileList de personas; Acciones junto al nombre; indicador Guardando → Cambios guardados.

**Detalle:** progreso con barra % al 100 %; tabs solo lectura; Acciones: Reporte por estudiante, Reporte detallado (toasts «…descargado.»); nombres de archivo sentence case neutro.

**Grupos:** columnas Nombre, Descripción, Integrantes; drawer de catálogo de mi empresa.

**Chat IA:** panel Mis chats; sugerencias literales Crear grupos / Editar grupos / Consultar grupos; subopciones documentadas en HU-LMS-009.

**Copy neutro clave:** Plan de contenidos guardado correctamente.; Máximo 8 competencias por asignación.; Grupo creado correctamente.; Reporte por estudiante / Reporte detallado; Aún no hay integrantes; No hay conversaciones.

## 7. Requisitos de calidad (producto)

- Accesibilidad: confirmaciones destructivas requieren escribir «eliminar»; tabs y menús Acciones alcanzables por teclado.
- Idioma UI: español neutro en toasts, tabs y reportes.
- Privacidad: reportes CSV incluyen datos de progreso de colaboradores asignados; solo desde detalle Vigente/No vigente para quien opera el plan.
- Empty / error: empty de integrantes; empty de historial de chats; no mostrar reportes en Planeado/Procesando; no equiparar visualmente la barra admin con el Finalizado colaborador sin aclarar (tooltip / copy de producto).

## 8. Criterios de aceptación

**Escenario: Camino feliz — crear plan de contenidos en Planeado**

**Dado** que el admin completa fechas, al menos 1 asignación y 1 contenido
**Cuando** guarda el plan
**Entonces** el plan queda en estado Planeado
**Y** ve el toast Plan de contenidos guardado correctamente.

**Escenario: Camino feliz — métrica de barra distinta al colaborador**

**Dado** que varios estudiantes tienen avances parciales y solo algunos llegaron al 100 % de su asignación
**Cuando** el admin mira la barra del plan en detalle
**Entonces** el porcentaje refleja solo quienes completaron el 100 %
**Y** ese valor no se presenta como equivalente al estado Finalizado del colaborador (≥ 65 %)

**Escenario: Camino feliz — reporte detallado**

**Dado** que Cristian está en un plan Vigente con 3 contenidos o 3 competencias
**Cuando** el admin elige Reporte detallado en Acciones
**Entonces** el CSV contiene exactamente 3 filas de Cristian
**Y** ve el toast Reporte detallado descargado.

**Escenario: Caso borde — tab masivo en edición**

**Dado** que el admin abre Editar plan Vigente en el tab Competencias (o Contenidos)
**Cuando** usa Agregar usuario, confirma con Aplicar y alguien nuevo entra al plan
**Entonces** el conteo de esa fila aumenta
**Y** la persona aparece en Colaboradores
**Y** el indicador de guardado muestra el ciclo de autoguardado

**Escenario: Camino negativo — chat IA aún no ejecuta**

**Dado** que el admin eligió Crear grupos y ve las subopciones
**Cuando** elige Crear grupos por área
**Entonces** las subopciones de esa respuesta quedan usadas
**Y** la IA responde que próximamente dará la información detallada

**Escenario: Camino negativo — plan Planeado sin reportes**

**Dado** que el plan está en estado Planeado
**Cuando** el admin abre Acciones en el detalle
**Entonces** no ve Reporte por estudiante ni Reporte detallado

## 9. Fases de entrega

| Fase | Incluye | No incluye |
| ---- | ------- | ---------- |
| v1 | Planes contenidos/competencias (HU-LMS-005); grupos (006); chat IA guiado (009); tabs masivos (015 tab competencias, 021 tab contenidos); reportes (016, 022) | CRUD real desde todas las subopciones del chat; Crear con IA en lista; certificados |
| Posterior | Ejecución completa del Chat IA; persistencia grupo→planes en sesión; botón Crear con IA | Unificar métrica 100 % admin con Finalizado ≥ 65 % colaborador |

## 10. Decisiones abiertas

1. **PENDIENTE —** Si en algún release se alinea o se explica mejor en UI la dualidad 100 % (admin) vs ≥ 65 % (colaborador) con copy educativo fijo.
2. **PENDIENTE —** Cuándo el Chat IA deja de responder «Próximamente…» y ejecuta crear/editar/consultar de verdad.
3. **PENDIENTE —** Comportamiento del botón «Crear con IA» en la lista de planes.
4. **PENDIENTE —** Persistencia de grupos nuevos hacia el catálogo usable en planes en la misma sesión.
5. **PENDIENTE —** Si un grupo con 0 integrantes debe bloquearse al asignarlo a un plan (hoy no).

## 11. Trazabilidad a HUs

| ID tentativo | Título | Fase |
| ------------ | ------ | ---- |
| HU-LMS-005 | Planes de formación (contenidos y competencias) | v1 |
| HU-LMS-006 | Grupos para planes de formación | v1 |
| HU-LMS-009 | Chat IA para crear y gestionar grupos | v1 |
| HU-LMS-015 | Tab Competencias en edición del plan *(bajo Planes)* | v1 |
| HU-LMS-016 | Reportes del plan de competencias | v1 |
| HU-LMS-021 | Tab Contenidos en edición del plan | v1 |
| HU-LMS-022 | Reportes del plan de contenidos | v1 |

> Nota: **HU-LMS-015** / **HU-LMS-016** en Contenidos/recursos son archivos distintos (asistencia / resultados asistencias). Este PRD usa los IDs del índice bajo **Planes de Formación**.

## 12. Referencias

- [fundamentos/00-mapa.md](../../../../fundamentos/00-mapa.md) — relación plan ↔ tareas; métricas distintas
- [_indice-hus.md](../../../../_indice-hus.md) — Admin → Planes de Formación
- [planes/HU-planes-formacion.md](planes/HU-planes-formacion.md)
- [planes/HU-tab-competencias-plan.md](planes/HU-tab-competencias-plan.md)
- [planes/HU-reportes-plan-competencias.md](planes/HU-reportes-plan-competencias.md)
- [planes/HU-tab-contenidos-plan.md](planes/HU-tab-contenidos-plan.md)
- [planes/HU-reportes-plan-contenidos.md](planes/HU-reportes-plan-contenidos.md)
- [grupos/HU-grupos.md](grupos/HU-grupos.md)
- [grupos/HU-chat-ia-grupos.md](grupos/HU-chat-ia-grupos.md)
- Flujo hermano: [lms-creator/_flujo.md](../lms-creator/_flujo.md) (pasos 8–9 asignación / grupos)
