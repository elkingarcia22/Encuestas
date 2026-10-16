# HU: Reportes del plan de contenidos

## Contexto

HR y el creador necesitan exportar el avance del plan vigente o cerrado sin armar hojas a mano. Hoy “Descargar” no deja claro si el CSV es por estudiante o por relación contenido–estudiante. Meta: que en menos de 30 segundos descarguen el reporte correcto desde Acciones del detalle.

## Historia de Usuario

**Como** creador de contenidos / administrador de recursos humanos,
**quiero** descargar desde Acciones un **Reporte por estudiante** y un **Reporte detallado** (una fila por usuario–contenido),
**para** analizar progreso por persona y por contenido sin exportar datos ambiguos.

## Alcance

**Incluye:**
- En Acciones del detalle del plan de contenidos (Vigente y No vigente):
  - Renombrar la descarga existente a **Reporte por estudiante** (1 fila por estudiante del plan).
  - Nueva opción **Reporte detallado** (1 fila por cada par usuario–contenido).
- CSV mock descargable en el playground.
- Prototipo: mismo detalle `…/detalle-plan?id={planId}` (Acciones en cabecera).

**Excluye:**
- Tab Contenidos y mutaciones masivas (HU-LMS-021).
- Descarga de certificados (sigue como opción aparte en No vigente cuando aplique).
- Reportes de planes de competencias (HU-LMS-016).
- Envío por correo del CSV.

## Reglas de Negocio

- **RN-01:** La etiqueta **Reporte por estudiante** reemplaza el copy **Descargar** / **Descarga** del detalle de plan de contenidos.
- **RN-02:** **Reporte por estudiante**: una fila por colaborador asignado; incluye al menos nombre, último acceso, última fecha de progreso, resumen de contenidos y progreso total del estudiante en el plan.
- **RN-03:** **Reporte detallado**: una fila por cada contenido asignado a un colaborador. Si Cristian tiene 3 contenidos, el CSV tiene 3 líneas de Cristian (una por contenido y su progreso).
- **RN-04:** Un colaborador sin contenidos no genera filas en el **Reporte detallado** (sí puede aparecer en el reporte por estudiante con contenidos vacíos / 0%).
- **RN-05:** Ambos reportes están en el menú **Acciones** del detalle cuando el plan está **Vigente** o **No vigente**.
- **RN-06:** En **Planeado** / **Procesando** no aparecen estas opciones de reporte (aún no hay progreso operativo que exportar).
- **RN-07:** Al disparar cada reporte se inicia la descarga del CSV y un toast de éxito (“Reporte por estudiante descargado.” / “Reporte detallado descargado.”).
- **RN-08:** El nombre de archivo usa sentence case neutro, p. ej. `reporte-por-estudiante-{nombre-plan}.csv` y `reporte-detallado-{nombre-plan}.csv`.

## Criterios de Aceptación

**Escenario: Camino feliz — reporte detallado con varios contenidos**

**Dado** que Cristian está en un plan Vigente con 3 contenidos (40%, 70% y 100%)
**Cuando** el admin elige **Reporte detallado** en Acciones
**Entonces** el CSV contiene exactamente 3 filas de Cristian
**Y** cada fila muestra el contenido correspondiente y su progreso
**Y** ve el toast “Reporte detallado descargado.”

**Escenario: Caso borde — estudiante sin contenidos en reporte detallado**

**Dado** que Sofía está asignada al plan pero aún no tiene contenidos
**Cuando** el admin descarga el **Reporte detallado**
**Entonces** Sofía no aporta filas al CSV
**Y** el resto de estudiantes con contenidos sí aparecen

**Escenario: Camino negativo — plan planeado sin reportes**

**Dado** que el plan está en estado Planeado
**Cuando** el admin abre Acciones en el detalle
**Entonces** no ve **Reporte por estudiante** ni **Reporte detallado**
