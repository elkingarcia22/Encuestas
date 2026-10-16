# HU: Tab Contenidos en edición del plan

## Contexto

Cuando un plan de contenidos ya está en marcha, el creador necesita ajustar contenidos de forma masiva sin abrir estudiante por estudiante. Esas mutaciones son edición del plan, no consulta de progreso: viven en **Editar plan**, no en el detalle. Meta: corregir un contenido a nivel plan en menos de 2 minutos desde edición.

## Historia de Usuario

**Como** creador de contenidos / administrador de recursos humanos,
**quiero** en la edición del plan un tab de Contenidos con personas asignadas (ProfileList) y acciones masivas (agregar / quitar usuarios, reemplazar o eliminar el contenido),
**para** mantener el plan al día sin editar asignación por asignación ni mezclar mutaciones con la vista de progreso.

## Alcance

**Incluye:**
- Tab **Contenidos** en **Editar plan de contenidos** (junto al tab Colaboradores).
- Lista de contenidos del plan con: nombre + imagen del catálogo, personas asignadas (ProfileList) y acciones por fila.
- Acción **Agregar usuario**: lista colaboradores de la empresa; quienes ya tienen el contenido salen **preseleccionados** (se pueden desmarcar para quitárselo). Botón **Aplicar**. Altas nuevas entran al plan si no estaban.
- Acción **Reemplazar**: selector de contenidos; sustituye el contenido actual por otro en todas las personas que lo tenían (imagen correcta del catálogo destino).
- Acción **Eliminar**: quita el contenido de todos los estudiantes del plan (con confirmación).
- **Sin** tope máximo de contenidos por asignación (a diferencia del plan de competencias).
- **Autoguardado** con **SaveIndicator** en el header de producto (sin botón Guardar), mismo patrón que Crear contenido / plan de competencias.
- Cabecera del plan en edición: nombre editable + status tag + **Acciones** (mismo patrón visual que el detalle).
- Toolbar homologada en ambos tabs de edición: título + conteo en texto (`N contenidos` / `N colaboradores`, no `N/N`) y buscador. El botón **Agregar asignación** vive una sola vez en la fila de tabs (acción de plan).
- Tab **Contenidos** de **solo lectura** en el **detalle** del plan (mismas columnas sin acciones ni Agregar asignación).

**Excluye:**
- Mutaciones masivas desde el **detalle**.
- Crear plan desde cero (HU-LMS-005).
- Planes de competencias (HU-LMS-015).
- Campo “Horas por competencia” (solo aplica a competencias).
- Reportes CSV (HU-LMS-022; viven en Acciones del detalle).

## Reglas de Negocio

- **RN-01:** La edición del plan de contenidos tiene dos tabs: **Colaboradores** (default) y **Contenidos**.
- **RN-01b:** En edición, ambos tabs comparten título + conteo legible (`N contenidos` / `N colaboradores`) y buscador. **Agregar asignación** es único: está en la fila de tabs (no duplicado en cada toolbar) y abre el wizard participantes → contenidos.
- **RN-02:** El tab Contenidos (edición y detalle) lista cada contenido distinto presente en al menos una asignación, con su imagen del catálogo de cursos.
- **RN-02b:** En **Personas asignadas** se muestra un **ProfileList** (avatares; si hay más de 3, chip `+N` con popover de avatar + nombre anclado al chip). Mismo patrón que Seguimiento / `UbitsProfileList`.
- **RN-03:** No hay tope máximo de contenidos por asignación en esta historia.
- **RN-04:** **Agregar usuario** lista colaboradores de la empresa. Quienes ya tienen ese contenido aparecen **preseleccionados**; desmarcarlos lo quita. Al **Aplicar**, quienes se marcan y no estaban en el plan se agregan como asignación nueva con ese contenido.
- **RN-05:** Si el usuario ya tiene el contenido y sigue marcado, no se duplica.
- **RN-06:** **Reemplazar** es 1→1; si el destino ya estaba en esa persona, no se duplica.
- **RN-07:** El selector de reemplazo excluye el contenido actual.
- **RN-08:** **Eliminar** pide confirmación explícita (modal).
- **RN-09:** Las acciones masivas están disponibles cuando el plan **permite edición** (Planeado, Procesando, Vigente). En **No vigente** la edición no aplica (acciones deshabilitadas).
- **RN-10:** Tras Agregar / Reemplazar / Eliminar (y tras cambios de nombre, fechas o asignaciones) el plan se **autoguarda** (~500 ms de debounce). El **SaveIndicator** del header muestra el ciclo Guardando → Cambios guardados → idle. No hay botón Guardar.
- **RN-11:** URL canónica edición: `…/editar-plan-contenidos?id={planId}&tab=contenidos`. Sin `tab` o `tab=asignaciones` muestra Colaboradores. El título de pantalla es **Editar plan de contenidos**.
- **RN-12:** El **detalle** del plan tiene tabs **Colaboradores** | **Contenidos** (solo lectura: sin Agregar usuario / Reemplazar / Eliminar). URL: `…/detalle-plan?id={planId}&tab=contenidos`.
- **RN-13:** En edición, el status tag y el botón **Acciones** viven junto al nombre del plan (no en el HeaderProduct). El SaveIndicator vive en el HeaderProduct junto al título de la pantalla.

## Criterios de Aceptación

**Escenario: Camino feliz — agregar usuarios desde edición en plan vigente**

**Dado** que el admin abre Editar plan de un plan Vigente en el tab Contenidos
**Y** el contenido “Administración del tiempo” tiene 5 personas
**Cuando** usa **Agregar usuario**
**Entonces** esas 5 personas aparecen preseleccionadas en la tabla
**Cuando** selecciona a alguien fuera del plan y confirma con **Aplicar**
**Entonces** el conteo de “Administración del tiempo” aumenta
**Y** esa persona aparece también en el tab Colaboradores
**Y** el SaveIndicator muestra el ciclo de autoguardado

**Escenario: Caso borde — desmarcar usuario que ya tenía el contenido**

**Dado** que “Administración del tiempo” tiene a Ana preseleccionada en Agregar usuario
**Cuando** el admin la desmarca y confirma con **Aplicar**
**Entonces** Ana deja de tener “Administración del tiempo”
**Y** el conteo de personas de ese contenido baja en 1

**Escenario: Caso borde — reemplazar contenido sin duplicar**

**Dado** que Cristian tiene “Curso A” y “Curso B” en edición
**Y** el admin reemplaza “Curso A” por “Curso B”
**Cuando** confirma el reemplazo
**Entonces** Cristian queda solo con “Curso B”
**Y** “Curso A” desaparece del tab si nadie más lo tiene
**Y** la imagen de la fila coincide con el contenido destino del catálogo

**Escenario: Camino negativo — detalle no ofrece edición masiva**

**Dado** que el admin abre el detalle (progreso) del plan en el tab Contenidos
**Cuando** revisa la tabla
**Entonces** ve Contenido y Personas asignadas (ProfileList) en solo lectura
**Y** no ve Agregar usuario / Reemplazar / Eliminar
**Y** esas acciones solo están en Editar plan

**Escenario: Shell de edición — sin botón Guardar**

**Dado** que el admin está en Editar plan de contenidos
**Cuando** mira el header y la card del plan
**Entonces** el header muestra **Editar plan de contenidos** y el SaveIndicator
**Y** no hay botón Guardar
**Y** junto al nombre del plan ve el status tag y Acciones

**Escenario: Toolbar homologada entre tabs**

**Dado** que el admin está en Editar plan de contenidos
**Cuando** revisa el tab Colaboradores y el tab Contenidos
**Entonces** en ambos ve buscador y conteo en formato “N colaboradores” / “N contenidos” (no “N/N”)
**Y** ve un solo botón **Agregar asignación** en la fila de tabs (no dentro de cada tabla)
**Cuando** lo pulsa desde cualquiera de los dos tabs
**Entonces** se abre el mismo wizard de alta
