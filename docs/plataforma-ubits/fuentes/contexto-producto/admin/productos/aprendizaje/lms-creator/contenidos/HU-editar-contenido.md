# HU: Editar contenido publicado e impacto en el progreso

## Contexto

Cuando un contenido ya está en planes o rutas, un cambio estructural (ocultar páginas, reordenar, añadir recursos) puede romper el progreso de cientos de colaboradores. El creador necesita editar con control y una política explícita de impacto, para reducir tickets de “se me reinició el curso” y proteger la integridad del avance.

## Historia de Usuario

**Como** creador de contenidos LMS,
**quiero** editar un contenido según su visibilidad y definir cómo impactan los cambios estructurales en el progreso,
**para** mantener el catálogo actualizado sin invalidar indebidamente el avance de los colaboradores.

## Alcance

**Incluye:**
- Enrutamiento por visibilidad LMS (Borrador → crear prellenado; Público/Privado/Oculto → editar; Archivado → solo lectura).
- Secciones de edición: resultados, información, recursos, certificado, visibilidad, ajustes (incluye Tipo de navegación; HU-LMS-011). Resultados (tabs, KPI, evaluaciones, intentos, descargas) está en HU-LMS-013; el drawer de páginas del estudiante en HU-LMS-012.
- En publicados: ocultar/mostrar páginas (no eliminar); siempre al menos 1 página visible. Antes hay que activar **Habilitar edición** en Recursos (abre el modal de impacto).
- Añadir página con el mismo flujo que en creación, **después** de habilitar edición. Asistencia solo si el contenido es Evento (HU-LMS-025 / HU-LMS-020).
- Si el contenido es Evento, Portada no muestra «Tipo de contenido» (igual que Crear evento).
- Modal y panel de Ajustes **Impacto en el progreso** con la política elegida (preselección persistente).

**Excluye:**
- Creación desde cero (HU-LMS-001).
- Asignación de planes (HU-LMS-005).
- Detalle de páginas recorridas por estudiante en Resultados (HU-LMS-012).
- Cálculo interno / persistencia de timestamps de progreso (fuera de la UI).

## Reglas de Negocio

- **RN-01:** Si el contenido está en Borrador, al abrirlo desde el listado se entra al asistente de creación prellenado, no al editor de publicado.
- **RN-02:** Si está Público, Privado u Oculto, se abre el editor de contenido publicado.
- **RN-03:** Si está Archivado, el editor es de solo lectura.
- **RN-04:** En edición publicada no existe Eliminar página; solo Ocultar/Mostrar, y siempre debe quedar al menos 1 página visible. Si la página es una **evaluación**, antes de ocultarla se muestra el modal de recálculo de pesos (HU-LMS-019).
- **RN-05:** Añadir una página sigue el mismo flujo de «Añadir página» y alta de recurso que en creación (HU-LMS-001 / HU-LMS-010), incluidos título opcional, tipos habilitados y Evaluación naciendo inline (puede iniciar sin preguntas). Asistencia solo si el contenido es tipo Evento (HU-LMS-020).
- **RN-05a:** Visitar Recursos **no** abre el modal «Antes de editar los recursos». Entre el título Recursos y el índice hay un switch **Habilitar edición**. Al activarlo se abre ese modal; confirmar deja la edición desbloqueada; cancelar deja el switch apagado y Ana sigue en Recursos. Sin habilitar, no puede añadir, ocultar, reemplazar ni editar recursos. Al salir de Recursos el desbloqueo se pierde.
- **RN-06:** Los cambios estructurales relevantes muestran el modal de impacto; la política elegida se recuerda (sesión) y preselecciona el modal la próxima vez.
- **RN-07:** La misma política se puede consultar y cambiar desde Ajustes → Impacto en el progreso (card del hub, solo en **editar**; no aparece en Crear contenido), sin los botones CTA del modal.
- **RN-08:** Roles Admin/Creador pueden editar; el colaborador estudiante no edita contenidos LMS.
- **RN-09:** Al volver al listado tras crear o editar, el ítem queda fijado primero en la lista.
- **RN-10:** Las únicas políticas son **Proteger a quienes ya finalizaron** (quienes completaron al 100 % conservan progreso y certificados) y **Recalcular el progreso de todos** (el avance se vuelve a calcular; pueden perder el 100 % y el certificado, y verse afectados planes/rutas).
- **RN-11:** El resumen de la card en el hub de Ajustes muestra la política activa («Proteger a quienes finalizaron» o «Recalcular el progreso de todos»).
- **RN-12:** Al editar un recurso de asistencia, las sesiones con fecha ya pasada quedan en solo lectura (HU-LMS-025). No aplica al alta en Crear contenido.
- **RN-13:** Si el contenido es tipo Evento, la ficha técnica de Portada no muestra «Tipo de contenido» (el tipo ya es Evento y no se cambia). Demo playground: `f021` «Protocolos de Supervivencia y Seguridad ante Sismos».

## Criterios de Aceptación

**Escenario: Camino feliz — ocultar una página con política ya elegida**

**Dado** que el contenido “Onboarding comercial Q3” está Público con 3 páginas visibles
**Y** Ana ya eligió una política de Impacto en el progreso en Ajustes
**Cuando** oculta la página 2
**Entonces** el sistema muestra el modal de impacto con esa política preseleccionada
**Y** tras confirmar, quedan exactamente 2 páginas visibles
**Y** la página 2 queda oculta (no eliminada)

**Escenario: Caso borde — no puede ocultar la última página visible**

**Dado** que el contenido tiene exactamente 1 página visible
**Cuando** Ana intenta ocultarla
**Entonces** la acción no se completa
**Y** sigue habiendo al menos 1 página visible

**Escenario: Camino negativo — contenido archivado es solo lectura**

**Dado** que el contenido “Seguridad 2024” está Archivado
**Cuando** Ana lo abre desde el listado
**Entonces** ve el editor en solo lectura
**Y** no puede cambiar recursos ni la política de impacto

**Escenario: Camino feliz — añadir página con texto en publicado**

**Dado** que el contenido está Público y Ana puede editar Recursos
**Cuando** activa Habilitar edición, confirma el modal de impacto, usa «Añadir página», elige Texto, confirma contenido y vuelve al editor
**Entonces** aparece la nueva página con el texto en modo lectura
**Y** puede editarlo con «Editar» o «Reemplazar» según el modo de edición publicado

**Escenario: Camino feliz — Habilitar edición abre el modal de impacto**

**Dado** que Ana entra a Editar contenido → Recursos sin haber habilitado edición
**Cuando** llega a Recursos
**Entonces** no se abre el modal «Antes de editar los recursos»
**Y** ve el switch Habilitar edición apagado
**Cuando** lo activa
**Entonces** se abre ese modal
**Y** si cancela, el switch queda apagado y sigue en Recursos
**Y** si confirma, el switch queda encendido y puede mutar recursos

**Escenario: Camino negativo — sin habilitar edición no muta recursos**

**Dado** que Ana está en Recursos con Habilitar edición apagado
**Cuando** mira el índice y el recurso de la página
**Entonces** no puede añadir página, ocultar, reemplazar ni editar el recurso

**Escenario: Camino feliz — Evento no pide tipo en Portada**

**Dado** que Ana abre Editar contenido de un Evento (p. ej. `f021`)
**Cuando** mira la ficha técnica de Portada
**Entonces** no ve el campo Tipo de contenido
**Y** sí ve Nivel, Idioma, Tiempo, Unidad y Categoría
