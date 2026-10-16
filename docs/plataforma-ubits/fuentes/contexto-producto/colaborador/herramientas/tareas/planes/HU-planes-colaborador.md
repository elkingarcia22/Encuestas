# HU: Planes de formación del colaborador

## Contexto

Además del día a día, el colaborador necesita ver planes en curso y finalizados con reglas claras de estado (avance y fechas). Meta: cero planes mostrados como Finalizado con avance menor a 65%.

## Historia de Usuario

**Como** colaborador de mi empresa,
**quiero** ver mis planes en curso y finalizados, y entrar al detalle de un plan,
**para** saber qué me falta y marcar progreso en las tareas del plan.

## Alcance

**Incluye:**
- Lista de planes con secciones En curso / Finalizado.
- Tabs Grupales / Individuales.
- Cards con fecha de finalización, tag de estado, “Tareas: X/Y” y %.
- Detalle de plan: editar nombre/desc/fecha, finalizar/reabrir (cascada a tareas), lista de tareas, agregar tarea.
- Navegación al detalle de una tarea (HU-TAR-004).

**Excluye:**
- Lista admin de todos los planes LMS (HU-LMS-005).
- Seguimiento HR empresa-completa (HU-TAR-003).
- Botón “Ver filtros” (visible sin acción).
- “Configurar miembros” en detalle (toast “próximamente”).

## Reglas de Negocio

- **RN-01:** La vista solo incluye planes asignados a María (individuales + grupales que le aplican, p. ej. Logística), no toda mi empresa.
- **RN-02:** Un plan nunca se muestra como Finalizado si el avance es menor a 65%.
- **RN-03:** Los planes vencidos por fecha viven en la sección “En curso”, no en “Finalizado”.
- **RN-04:** El estado del plan se deriva de avance + fecha.
- **RN-05:** Los tags de card usan Por hacer / Vencido / Finalizado (la sección se llama En curso, no el tag).
- **RN-06:** La barra de progreso del plan en admin (% personas al 100%) es distinta del Finalizado del colaborador (≥ 65%).
- **RN-07:** Finalizar un plan desde el detalle marca sus tareas; reabrir revierte el cierre del plan.

## Criterios de Aceptación

**Escenario: Camino feliz — abrir plan en curso**

**Dado** que María tiene un plan en curso con avance 40%
**Cuando** abre Planes y entra al detalle
**Entonces** ve las tareas del plan
**Y** el plan sigue en la sección En curso

**Escenario: Caso borde — no finalizado bajo 65%**

**Dado** que un plan de María tiene avance 50% y la fecha ya pasó
**Cuando** consulta la lista de planes
**Entonces** no aparece bajo Finalizado
**Y** permanece en En curso (con tag Vencido)

**Escenario: Camino negativo — no ver planes ajenos**

**Dado** que existen planes solo de otros colaboradores de mi empresa
**Cuando** María abre su vista Planes
**Entonces** esos planes no aparecen en su lista
