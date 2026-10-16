# HU: Reportes del plan de competencias

## Contexto

HR y el creador necesitan exportar el avance del plan vigente o cerrado sin armar hojas a mano. Hoy “Descargar” no deja claro si el CSV es por estudiante o por relación competencia–estudiante. Meta: que en menos de 30 segundos descarguen el reporte correcto desde Acciones del detalle.

## Historia de Usuario

**Como** creador de contenidos / administrador de recursos humanos,
**quiero** descargar desde Acciones un **Reporte por estudiante** y un **Reporte detallado** (una fila por usuario–competencia),
**para** analizar progreso por persona y por competencia sin exportar datos ambiguos.

## Alcance

**Incluye:**
- En Acciones del detalle del plan de competencias (Vigente y No vigente):
  - Renombrar la descarga existente a **Reporte por estudiante** (1 fila por estudiante del plan).
  - Nueva opción **Reporte detallado** (1 fila por cada par usuario–competencia).
- CSV mock descargable en el playground.
- Prototipo: mismo detalle `…/detalle-plan-competencias?id={planId}` (Acciones en cabecera).

**Excluye:**
- Tab Competencias y mutaciones masivas (HU-LMS-015).
- Descarga de certificados (sigue como opción aparte en No vigente cuando aplique).
- Reportes de planes de contenidos.
- Envío por correo del CSV.

## Reglas de Negocio

- **RN-01:** La etiqueta **Reporte por estudiante** reemplaza el copy **Descargar** / **Descarga** del detalle de plan de competencias.
- **RN-02:** **Reporte por estudiante**: una fila por colaborador asignado; incluye al menos nombre, último acceso, última fecha de progreso, resumen de competencias y progreso total del estudiante en el plan.
- **RN-03:** **Reporte detallado**: una fila por cada competencia asignada a un colaborador. Si Cristian tiene 3 competencias, el CSV tiene 3 líneas de Cristian (una por competencia y su progreso).
- **RN-04:** Un colaborador sin competencias no genera filas en el **Reporte detallado** (sí puede aparecer en el reporte por estudiante con competencias vacías / 0%).
- **RN-05:** Ambos reportes están en el menú **Acciones** del detalle cuando el plan está **Vigente** o **No vigente**.
- **RN-06:** En **Planeado** / **Procesando** no aparecen estas opciones de reporte (aún no hay progreso operativo que exportar).
- **RN-07:** Al disparar cada reporte se inicia la descarga del CSV y un toast de éxito (“Reporte por estudiante descargado.” / “Reporte detallado descargado.”).
- **RN-08:** El nombre de archivo usa sentence case neutro, p. ej. `reporte-por-estudiante-{nombre-plan}.csv` y `reporte-detallado-{nombre-plan}.csv`.

## Criterios de Aceptación

**Escenario: Camino feliz — reporte detallado con varias competencias**

**Dado** que Cristian está en un plan Vigente con 3 competencias (40%, 70% y 100%)
**Cuando** el admin elige **Reporte detallado** en Acciones
**Entonces** el CSV contiene exactamente 3 filas de Cristian
**Y** cada fila muestra la competencia correspondiente y su progreso
**Y** ve el toast “Reporte detallado descargado.”

**Escenario: Caso borde — estudiante sin competencias en reporte detallado**

**Dado** que Sofía está asignada al plan pero aún no tiene competencias
**Cuando** el admin descarga el **Reporte detallado**
**Entonces** Sofía no aporta filas al CSV
**Y** el resto de estudiantes con competencias sí aparecen

**Escenario: Camino negativo — plan planeado sin reportes**

**Dado** que el plan está en estado Planeado
**Cuando** el admin abre Acciones en el detalle
**Entonces** no ve **Reporte por estudiante** ni **Reporte detallado**
