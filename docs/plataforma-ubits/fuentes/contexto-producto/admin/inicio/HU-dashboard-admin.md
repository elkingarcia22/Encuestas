# HU: Dashboard de inicio del administrador

## Contexto

El admin HR necesita un punto de entrada con métricas y accesos para priorizar el día (atención, formación, desempeño). Un home con indicadores y bloques de atención reduce el tiempo para llegar al módulo correcto. Métrica a definir en discovery: tiempo medio desde login hasta primera acción en un módulo maduro.

## Historia de Usuario

**Como** administrador de recursos humanos,
**quiero** ver un dashboard de inicio con métricas, periodo, ítems de atención y acciones rápidas,
**para** entrar rápido a los flujos que requieren atención.

## Alcance

**Incluye:**
- Saludo contextual (Buenos días / Buenas tardes / Buenas noches) con nombre del admin.
- Sección “Top métricas” con periodo “Últimos 7 días” / “Últimos 30 días”.
- Bloque “Necesita tu atención” con conteo y CTAs.
- Sección “Quick actions” con filas de acción (crear encuesta, métricas, usuarios, etc.).

**Excluye:**
- Exactitud de métricas de producción (valores ilustrativos ya formateados).
- Que todos los destinos de Quick actions / atención estén maduros (varios llevan a pantallas aún vacías: encuestas, empresa, reclutamiento, etc.).
- Home del colaborador (aprendizaje).
- Orden e IA del sidenav / Configuración en el header (HU-INI-002).

## Reglas de Negocio

- **RN-01:** El dashboard es la entrada del espacio administrador, no del colaborador.
- **RN-02:** Los valores de métricas se muestran ya formateados (porcentajes, ratios, miles con separador local); en este home no hay un indicador ≥ 10.000 mostrado en K.
- **RN-03:** El periodo de métricas solo admite “Últimos 7 días” y “Últimos 30 días”.
- **RN-04:** “Necesita tu atención” y “Quick actions” incluyen destinos maduros (p. ej. evaluaciones 360°, certificados, planes) y también destinos aún no maduros (encuestas, gestión de usuarios, reclutamiento, métricas); el enlace existe aunque la pantalla destino esté vacía.
- **RN-05:** El título de la sección de acciones rápidas en pantalla es “Quick actions” (en inglés).

## Criterios de Aceptación

**Escenario: Camino feliz — entrar al home admin**

**Dado** que el admin abre Inicio
**Cuando** carga el dashboard
**Entonces** ve el saludo con su nombre, “Top métricas” y “Necesita tu atención”
**Y** puede cambiar el periodo entre “Últimos 7 días” y “Últimos 30 días”
**Y** ve la sección “Quick actions” con filas de acción

**Escenario: Caso borde — métricas del periodo 30 días**

**Dado** que el admin está en Inicio
**Cuando** selecciona “Últimos 30 días”
**Entonces** los valores de “Top métricas” cambian a los del periodo de 30 días
**Y** sigue viendo el bloque “Necesita tu atención”

**Escenario: Camino negativo — acceso a módulo aún no maduro**

**Dado** que el admin ve Quick actions con “Crear encuesta” o “Gestionar usuarios”
**Cuando** entra a esa acción
**Entonces** llega a una pantalla que aún no tiene el flujo completo del módulo
**Y** no debe asumir que ese destino está listo como LMS Creator o evaluaciones 360°
