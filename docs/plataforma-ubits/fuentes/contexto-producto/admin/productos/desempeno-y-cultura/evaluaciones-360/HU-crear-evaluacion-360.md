# HU: Crear evaluación 360°

## Contexto

Montar una 360° incompleta (sin pesos coherentes o sin enunciados) genera evaluaciones inviables y ruido en la operación. Un hub con secciones bloqueadas y activación solo al completar las 4 reduce errores de lanzamiento.

## Historia de Usuario

**Como** administrador de recursos humanos,
**quiero** crear una evaluación 360° con nombre, fechas, tipos, competencias, evaluados y resultados, y activarla solo cuando esté completa,
**para** lanzar procesos de feedback multi-fuente listos para ejecutarse.

## Alcance

**Incluye:**
- Hub inmersivo de creación con 4 secciones.
- Desbloqueo progresivo (nombre+fechas → Tipo → resto).
- Validación de pesos = 100% y enunciados por tipo activo.
- Activar → vuelve a lista con confirmación.

**Excluye:**
- Edición de una 360° ya activa.
- Respuesta del colaborador evaluador.
- Cálculo de resultados en producción.

## Reglas de Negocio

- **RN-01:** Primero se confirman nombre y fechas; solo entonces se desbloquea la sección Tipo.
- **RN-02:** El resto de secciones se habilita tras guardar Tipo.
- **RN-03:** Activar solo es posible cuando las 4 secciones están marcadas completas.
- **RN-04:** Los pesos de los tipos activos deben sumar exactamente 100.
- **RN-05:** Cada tipo activo debe tener al menos 1 enunciado en Competencias para completar esa sección.
- **RN-06:** El borrador de creación se conserva solo mientras dura la sesión de creación; al salir o recargar se pierde.

## Criterios de Aceptación

**Escenario: Camino feliz — activar 360 completa**

**Dado** que el admin completó nombre, fechas, Tipo con pesos 100%, competencias con enunciados, evaluados y resultados
**Cuando** pulsa Activar
**Entonces** la evaluación queda creada
**Y** regresa al listado con confirmación de creación

**Escenario: Caso borde — pesos distintos de 100**

**Dado** que el admin tiene tipos activos cuyos pesos suman 90
**Cuando** intenta marcar Tipo como completo o activar
**Entonces** no puede activar la evaluación
**Y** se le indica que los pesos deben sumar 100

**Escenario: Camino negativo — activar con secciones incompletas**

**Dado** que faltan Evaluados por completar
**Cuando** el admin intenta Activar
**Entonces** la acción no se ejecuta
**Y** permanece en el hub sin crear la evaluación en el listado
