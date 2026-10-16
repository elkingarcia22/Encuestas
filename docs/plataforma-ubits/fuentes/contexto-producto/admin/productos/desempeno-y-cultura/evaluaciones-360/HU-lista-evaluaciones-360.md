# HU: Listado de evaluaciones 360°

## Contexto

HR necesita localizar evaluaciones, filtrarlas y ejecutar acciones de ciclo de vida (finalizar, eliminar) sin entrar de una en una. Un listado operable reduce tiempo de gestión del portafolio de 360°.

## Historia de Usuario

**Como** administrador de recursos humanos,
**quiero** listar, filtrar y gestionar evaluaciones 360° (entrar a crear, finalizar o eliminar),
**para** administrar el ciclo de vida de los procesos de feedback.

## Alcance

**Incluye:**
- Listado con filtros y búsqueda.
- Entrada a Crear.
- Acciones de eliminar y finalizar cuando el estado lo permita.

**Excluye:**
- Crear (detalle en HU-DES-001).
- Edición de una evaluación ya activa.

## Reglas de Negocio

- **RN-01:** Desde el listado se puede iniciar Crear evaluación 360°.
- **RN-02:** Las acciones destructivas (eliminar) requieren confirmación observable.
- **RN-03:** Finalizar aplica solo a evaluaciones activas o en curso; no a borradores incompletos que aún no están en lista.

## Criterios de Aceptación

**Escenario: Camino feliz — ir a crear**

**Dado** que el admin está en el listado de evaluaciones 360°
**Cuando** elige crear una nueva
**Entonces** entra al hub de creación

**Escenario: Caso borde — filtrar sin resultados**

**Dado** que aplica un filtro sin coincidencias
**Cuando** se actualiza la lista
**Entonces** ve empty state de sin resultados
**Y** puede limpiar filtros o búsqueda

**Escenario: Camino negativo — eliminar con confirmación**

**Dado** que existe una evaluación en el listado
**Cuando** el admin elige eliminarla y cancela la confirmación
**Entonces** la evaluación sigue en el listado
