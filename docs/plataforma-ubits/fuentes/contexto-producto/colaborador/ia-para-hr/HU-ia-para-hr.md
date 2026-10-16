# HU: Landing de Agentes (IA para HR)

## Contexto

HR y colaboradores con foco en RH necesitan un punto de entrada a agentes de IA (soporte, estudio, planes). Meta: que desde Agentes se entienda qué hay disponible y se pueda entrar al tutor. El **Agente de tu empresa** no se documenta aquí: vive en HU-TRA-001.

## Historia de Usuario

**Como** colaborador de mi empresa con interés en herramientas de RH,
**quiero** ver el catálogo de agentes de IA para recursos humanos,
**para** elegir el agente disponible y empezar a usarlo.

## Alcance

**Incluye:**
- Pantalla “Agentes para recursos humanos” con subtítulo de producto.
- Cards de catálogo: Soporte técnico, Modo estudio AI, Plan de formación.
- Navegación desde Modo estudio AI hacia el tutor de Modo estudio IA.

**Excluye:**
- Flujos completos de Soporte técnico y Plan de formación (cards aún sin destino operativo).
- Agente de tu empresa: cara, colecciones, visibilidad, Probar agente y chat (HU-TRA-001).
- Detalle del tutor (HU-APR-001).
- Presencia en el sidenav: esta landing **no** se lista en el rail colaborador.

## Reglas de Negocio

- **RN-01:** El título de la pantalla es “Agentes para recursos humanos”.
- **RN-02:** Cards fijas: “Soporte técnico”, “Modo estudio AI”, “Plan de formación”.
- **RN-03:** Solo “Modo estudio AI” navega a un flujo maduro de tutor (Modo estudio IA).
- **RN-04:** “Soporte técnico” y “Plan de formación” se muestran como cards informativas sin flujo completo detrás.
- **RN-05:** Si el colaborador tiene colecciones visibles del Agente de tu empresa, esa card aparece **además** y **primera**, según HU-TRA-001. Esta HU no define su chat ni su visibilidad.
- **RN-06:** Agentes no aparece en el sidenav colaborador. Se abre por URL directa o desde un acceso que no sea el rail.

## Criterios de Aceptación

**Escenario: Camino feliz — entrar a Modo estudio AI**

**Dado** que María abre Agentes
**Cuando** elige la card “Modo estudio AI”
**Entonces** llega al Modo estudio IA
**Y** puede iniciar una sesión de tutor

**Escenario: Caso borde — ver las cards de catálogo**

**Dado** que María abre Agentes y no tiene colecciones visibles del Agente de tu empresa
**Cuando** carga la landing
**Entonces** ve las tres cards con sus títulos literales (Soporte técnico, Modo estudio AI, Plan de formación)
**Y** el subtítulo habla de transformar el área de RH

**Escenario: Camino negativo — no está en el sidenav**

**Dado** que María está en Workspace colaborador
**Cuando** recorre el menú lateral
**Entonces** no ve un ítem llamado Agentes
**Y** puede abrir la landing si llega por URL directa

**Escenario: Camino negativo — card sin flujo**

**Dado** que María está en Agentes
**Cuando** elige “Soporte técnico” o “Plan de formación”
**Entonces** no entra a un flujo de producto completo equivalente a Modo estudio IA
**Y** permanece en el contexto de descubrimiento de agentes
