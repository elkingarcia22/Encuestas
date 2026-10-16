# HU: Tab Competencias en edición del plan

## Contexto

Cuando un plan de competencias ya está en marcha, el creador necesita ajustar competencias de forma masiva sin abrir estudiante por estudiante. Esas mutaciones son edición del plan, no consulta de progreso: viven en **Editar plan**, no en el detalle. Meta: corregir una competencia a nivel plan en menos de 2 minutos desde edición.

## Historia de Usuario

**Como** creador de contenidos / administrador de recursos humanos,
**quiero** en la edición del plan un tab de Competencias con personas asignadas (ProfileList) y acciones masivas (agregar / quitar usuarios, reemplazar o eliminar la competencia),
**para** mantener el plan al día sin editar asignación por asignación ni mezclar mutaciones con la vista de progreso.

## Alcance

**Incluye:**
- Tab **Competencias** en **Editar plan de competencias** (junto al tab Colaboradores).
- Lista de competencias del plan con: nombre + imagen del catálogo, personas asignadas (ProfileList) y acciones por fila.
- Acción **Agregar usuario**: lista colaboradores de la empresa; quienes ya tienen la competencia salen **preseleccionados** (se pueden desmarcar para quitársela). Botón **Aplicar**. Altas nuevas entran al plan si no estaban.
- Acción **Reemplazar**: selector de competencias; sustituye la competencia actual por otra en todas las personas que la tenían (imagen correcta del catálogo destino).
- Acción **Eliminar**: quita la competencia de todos los estudiantes del plan (con confirmación).
- Tope de **8 competencias por asignación**.
- **Autoguardado** con **SaveIndicator** en el header de producto (sin botón Guardar), mismo patrón que Crear contenido.
- Cabecera del plan en edición: nombre editable + status tag + **Acciones** (mismo patrón visual que el detalle).
- Toolbar homologada en ambos tabs de edición: título + conteo en texto (`N competencias` / `N colaboradores`, no `N/N`) y buscador. El botón **Agregar asignación** vive una sola vez en la fila de tabs (acción de plan).
- Tab **Competencias** de **solo lectura** en el **detalle** del plan (mismas columnas sin acciones ni Agregar asignación).

**Excluye:**
- Mutaciones masivas desde el **detalle**.
- Crear plan desde cero (HU-LMS-005).
- Planes de contenidos.
- Reportes CSV (HU-LMS-016; viven en Acciones del detalle).

## Reglas de Negocio

- **RN-01:** La edición del plan de competencias tiene dos tabs: **Colaboradores** (default) y **Competencias**.
- **RN-01b:** En edición, ambos tabs comparten título + conteo legible (`N competencias` / `N colaboradores`) y buscador. **Agregar asignación** es único: está en la fila de tabs (no duplicado en cada toolbar) y abre el wizard participantes → competencias.
- **RN-02:** El tab Competencias (edición y detalle) lista cada competencia distinta presente en al menos una asignación, con su imagen del maestro de competencias.
- **RN-02b:** En **Personas asignadas** se muestra un **ProfileList** (avatares; si hay más de 3, chip `+N` con popover de avatar + nombre anclado al chip). Mismo patrón que Seguimiento / `UbitsProfileList`.
- **RN-03:** Máximo **8** competencias por asignación. Si al aplicar Agregar usuario alguien ya tiene 8 y no incluye esa competencia, no se le agrega y se muestra “Máximo 8 competencias por asignación.”
- **RN-04:** **Agregar usuario** lista colaboradores de la empresa. Quienes ya tienen esa competencia aparecen **preseleccionados**; desmarcarlos la quita. Al **Aplicar**, quienes se marcan y no estaban en el plan se agregan como asignación nueva con esa competencia.
- **RN-05:** Si el usuario ya tiene la competencia y sigue marcado, no se duplica.
- **RN-06:** **Reemplazar** es 1→1; si el destino ya estaba en esa persona, no se duplica.
- **RN-07:** El selector de reemplazo excluye la competencia actual.
- **RN-08:** **Eliminar** pide confirmación explícita (modal).
- **RN-09:** Las acciones masivas están disponibles cuando el plan **permite edición** (Planeado, Procesando, Vigente). En **No vigente** la edición no aplica (acciones deshabilitadas).
- **RN-10:** Tras Agregar / Reemplazar / Eliminar (y tras cambios de nombre, fechas, horas o asignaciones) el plan se **autoguarda** (~500 ms de debounce). El **SaveIndicator** del header muestra el ciclo Guardando → Cambios guardados → idle. No hay botón Guardar.
- **RN-11:** URL canónica edición: `…/editar-plan-competencias?id={planId}&tab=competencias`. Sin `tab` o `tab=asignaciones` muestra Colaboradores. El título de pantalla es **Editar plan de competencias**.
- **RN-12:** El **detalle** del plan tiene tabs **Colaboradores** | **Competencias** (solo lectura: sin Agregar usuario / Reemplazar / Eliminar). URL: `…/detalle-plan-competencias?id={planId}&tab=competencias`.
- **RN-13:** En edición, el status tag y el botón **Acciones** viven junto al nombre del plan (no en el HeaderProduct). El SaveIndicator vive en el HeaderProduct junto al título de la pantalla.

## Criterios de Aceptación

**Escenario: Camino feliz — agregar usuarios desde edición en plan vigente**

**Dado** que el admin abre Editar plan de un plan Vigente en el tab Competencias
**Y** la competencia “Liderazgo” tiene 5 personas
**Cuando** usa **Agregar usuario**
**Entonces** esas 5 personas aparecen preseleccionadas en la tabla
**Cuando** selecciona a alguien fuera del plan y confirma con **Aplicar**
**Entonces** el conteo de “Liderazgo” aumenta
**Y** esa persona aparece también en el tab Colaboradores
**Y** el SaveIndicator muestra el ciclo de autoguardado

**Escenario: Caso borde — desmarcar usuario que ya tenía la competencia**

**Dado** que “Liderazgo” tiene a Ana preseleccionada en Agregar usuario
**Cuando** el admin la desmarca y confirma con **Aplicar**
**Entonces** Ana deja de tener “Liderazgo”
**Y** el conteo de personas de “Liderazgo” baja en 1

**Escenario: Caso borde — reemplazar competencia sin duplicar**

**Dado** que Cristian tiene “Negociación” y “Comunicación” en edición
**Y** el admin reemplaza “Negociación” por “Comunicación”
**Cuando** confirma el reemplazo
**Entonces** Cristian queda solo con “Comunicación”
**Y** “Negociación” desaparece del tab si nadie más la tiene
**Y** la imagen de la fila coincide con la competencia destino del catálogo

**Escenario: Camino negativo — tope de 8 competencias**

**Dado** que Ana ya tiene 8 competencias en el plan en edición
**Y** ninguna es “Pensamiento crítico”
**Cuando** el admin intenta agregarla a “Pensamiento crítico”
**Entonces** Ana no recibe la novena competencia
**Y** se muestra “Máximo 8 competencias por asignación.”

**Escenario: Camino negativo — detalle no ofrece edición masiva**

**Dado** que el admin abre el detalle (progreso) del plan en el tab Competencias
**Cuando** revisa la tabla
**Entonces** ve Competencia y Personas asignadas (ProfileList) en solo lectura
**Y** no ve Agregar usuario / Reemplazar / Eliminar
**Y** esas acciones solo están en Editar plan

**Escenario: Shell de edición — sin botón Guardar**

**Dado** que el admin está en Editar plan de competencias
**Cuando** mira el header y la card del plan
**Entonces** el header muestra **Editar plan de competencias** y el SaveIndicator
**Y** no hay botón Guardar
**Y** junto al nombre del plan ve el status tag y Acciones

**Escenario: Toolbar homologada entre tabs**

**Dado** que el admin está en Editar plan de competencias
**Cuando** revisa el tab Colaboradores y el tab Competencias
**Entonces** en ambos ve buscador y conteo en formato “N colaboradores” / “N competencias” (no “N/N”)
**Y** ve un solo botón **Agregar asignación** en la fila de tabs (no dentro de cada tabla)
**Cuando** lo pulsa desde cualquiera de los dos tabs
**Entonces** se abre el mismo wizard de alta
