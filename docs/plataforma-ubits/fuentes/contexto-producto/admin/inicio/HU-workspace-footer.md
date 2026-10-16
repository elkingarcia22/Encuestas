# HU: Pie del Workspace

## Contexto

El Workspace concentra listas, dashboards y chrome de producto. Hace falta un lugar estable para los legales (términos y privacidad) sin tapar métricas, tablas ni acciones. Un pie sticky o fijo cubre contenido y no ayuda a terminar la tarea; el pie oficial viaja al final del main, con el scroll.

## Historia de Usuario

**Como** administrador o colaborador en una pantalla Workspace,
**quiero** ver los términos y la política de privacidad al final del contenido,
**para** consultarlos si los necesito sin que un bloque fijo me tape lo que estoy haciendo.

## Alcance

**Incluye:**
- Componente oficial de design system **Workspace footer**.
- Presencia en **todas** las páginas con layout Workspace (admin, colaborador y design system).
- Copy: wordmark UBITS, **Términos y condiciones de uso de la plataforma**, **Política de privacidad**.
- Se oculta en el modo **Agente IA** (el main lo ocupa el chat).

**Excluye:**
- Layout Inmersivo (tiene su propio footer de flujo).
- Hacer el pie sticky o fixed.
- Páginas que no usan Workspace.
- Destino real de los enlaces legales (en el prototipo son `#`).

## Reglas de Negocio

- **RN-01:** El pie no es sticky ni fixed. Queda al final del main (flujo del documento) y se desplaza con el scroll.
- **RN-02:** No se muestra en modo Agente IA.
- **RN-03:** El copy de los enlaces es exactamente: `Términos y condiciones de uso de la plataforma` y `Política de privacidad`.
- **RN-04:** Justificación de no pegarlo al viewport: tapa contenido importante y no aporta valor a la tarea. Si más adelante se pide sticky, es un cambio de producto explícito, no el default.

## Criterios de Aceptación

**Escenario: Camino feliz — pie al final del Workspace**

**Dado** que el admin está en Inicio (u otra página Workspace)
**Cuando** llega al final del contenido
**Entonces** ve el wordmark UBITS y los dos enlaces legales
**Y** el pie no cubre métricas, tablas ni acciones mientras hace scroll

**Escenario: Caso borde — Agente IA**

**Dado** que el admin cambia el sidebar a Agente IA
**Cuando** mira el main del chat
**Entonces** el pie de Workspace no se muestra

**Escenario: Camino negativo — no pegar el pie**

**Dado** que hay poco o mucho contenido en la página
**Cuando** el admin hace scroll
**Entonces** el pie no permanece fijo sobre el contenido
**Y** no tapa botones ni cards
