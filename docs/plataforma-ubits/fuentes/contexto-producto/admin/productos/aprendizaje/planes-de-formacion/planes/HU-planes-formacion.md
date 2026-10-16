# HU: Planes de formación (contenidos y competencias)

## Contexto

HR necesita asignar formación a grupos o personas y ver si realmente terminaron, no un promedio engañoso de avances parciales. Distinguir planes de contenidos vs competencias y estados claros reduce confusión operativa. Meta: que el % de barra del plan represente solo personas al 100% de su asignación.

## Historia de Usuario

**Como** administrador de recursos humanos,
**quiero** crear y gestionar planes de formación de contenidos o de competencias con estados claros y progreso por completitud total,
**para** saber qué porcentaje de personas terminó el 100% de su asignación.

## Alcance

**Incluye:**
- Listas de planes de contenidos y de competencias (pestañas).
- Crear / editar / detalle según estado y menú de acciones.
- Asignación: toda la empresa, por colaborador, por grupos o desde archivo.
- Barra de progreso del plan = % de estudiantes que completaron el 100% de su asignación.
- Plan de competencias con campo global “Horas por competencia” y máximo 8 competencias por asignación.

**Excluye:**
- Vista personal del colaborador en Tareas (HU-TAR-002).
- Chat IA de grupos (HU-LMS-009).
- Tab Competencias masivo en **edición** del plan + tab solo lectura en detalle (HU-LMS-015).
- Reportes CSV del detalle de competencias (HU-LMS-016).
- Tab Contenidos masivo en **edición** del plan + tab solo lectura en detalle (HU-LMS-021).
- Reportes CSV del detalle de contenidos (HU-LMS-022).
- Botón “Crear con IA” de la lista (visible pero sin comportamiento).

## Reglas de Negocio

- **RN-01:** Existen dos tipos: plan de contenidos y plan de competencias.
- **RN-02:** En plan de competencias, “Horas por competencia” es un campo global del plan (mínimo 1; default 8), no un valor distinto por cada competencia del catálogo.
- **RN-03:** Un plan de competencias admite como máximo 8 competencias por asignación; al superar el límite se muestra “Máximo 8 competencias por asignación.”
- **RN-04:** Al guardar un plan nuevo, el estado inicial es Planeado (no nace Vigente).
- **RN-05:** Estados visibles: Planeado, Procesando (con %), Vigente, No vigente.
- **RN-06:** Clic en fila: Planeado o Procesando → editar; Vigente o No vigente → detalle de progreso.
- **RN-07:** En el menú (⋮), “Ver progreso” en Vigente y No vigente; “Editar” en Planeado, Vigente y Procesando; “Eliminar” siempre (confirma escribiendo “eliminar”).
- **RN-08:** La barra del plan es el % de estudiantes al 100% de su asignación, no el promedio de avances parciales. Distinta del Finalizado del colaborador (≥ 65%).
- **RN-09:** El tooltip indica que el progreso se actualiza cada 30 minutos, no en tiempo real.
- **RN-10:** En Vigente o No vigente no aparece la CTA masiva “Asignar contenidos” / “Asignar competencias”; en No vigente no se agregan contenidos nuevos al plan.
- **RN-11:** Guardar plan de contenidos exige fechas + ≥1 asignación con ≥1 contenido; competencias exige fechas + horas ≥ 1 + ≥1 asignación con ≥1 competencia. Nombre vacío se guarda como “Plan sin nombre”.

## Criterios de Aceptación

**Escenario: Camino feliz — crear plan de contenidos en Planeado**

**Dado** que el admin completa fechas, al menos 1 asignación y 1 contenido
**Cuando** guarda el plan
**Entonces** el plan queda en estado Planeado
**Y** ve el toast “Plan de contenidos guardado correctamente.”

**Escenario: Caso borde — editar un plan vigente desde el menú**

**Dado** que un plan está Vigente
**Cuando** el admin usa “Editar” en el menú de acciones (⋮)
**Entonces** puede entrar a edición aunque el clic en la fila abra el detalle de progreso

**Escenario: Camino negativo — competencias sin horas válidas**

**Dado** que el admin intenta crear un plan de competencias
**Cuando** deja “Horas por competencia” en 0 o vacío e intenta guardar
**Entonces** no puede guardar el plan como válido
**Y** debe corregir el campo global de horas (mínimo 1)
