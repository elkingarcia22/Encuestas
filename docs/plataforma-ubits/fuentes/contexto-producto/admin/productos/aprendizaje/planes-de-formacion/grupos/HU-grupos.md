# HU: Grupos para planes de formación

## Contexto

Asignar persona por persona no escala. Los grupos permiten reutilizar conjuntos de colaboradores (ej. Logística de mi empresa) en varios planes. Meta: reducir el tiempo de armar una asignación grupal frente a selección individual repetida.

## Historia de Usuario

**Como** administrador de recursos humanos,
**quiero** crear y gestionar grupos de colaboradores,
**para** asignarlos a planes de formación sin seleccionar a cada persona cada vez.

## Alcance

**Incluye:**
- Listado de grupos (Nombre, Descripción, Integrantes).
- Crear grupo (nombre máx. 250, descripción, drawer de integrantes del catálogo de mi empresa).
- Detalle / edición de grupo.
- Entrada “Asistente IA para grupos” hacia Chat IA (HU-LMS-009).
- Uso de grupos seed (Ventas, Logística, Líderes, etc.) como destinatarios en planes.

**Excluye:**
- Persistencia durable de un grupo recién creado hacia el catálogo de planes en la misma sesión (hoy el guardado confirma con toast y vuelve al listado sin alimentar el seed).
- Validación de nombre vacío (el Guardar siempre confirma).
- Bloqueo de planes al elegir un grupo con 0 integrantes.
- Organigrama de empresa y permisos finos de roles.

## Reglas de Negocio

- **RN-01:** Un grupo tiene nombre, descripción opcional e integrantes del catálogo de mi empresa.
- **RN-02:** Se puede guardar un grupo con 0 integrantes; el empty state muestra “Aún no hay integrantes”.
- **RN-03:** Al guardar un grupo nuevo se muestra “Grupo creado correctamente.” y se vuelve al listado.
- **RN-04:** Los grupos del catálogo seed son reutilizables en planes de contenidos y de competencias.
- **RN-05:** Eliminar grupos exige confirmar escribiendo “eliminar”.

## Criterios de Aceptación

**Escenario: Camino feliz — crear grupo con integrantes**

**Dado** que el admin crea el grupo “Logística Q3” con al menos 2 colaboradores del catálogo de mi empresa
**Cuando** guarda el grupo
**Entonces** ve el toast “Grupo creado correctamente.”
**Y** vuelve al listado de grupos

**Escenario: Caso borde — grupo sin integrantes**

**Dado** que el admin está creando un grupo
**Cuando** guarda sin haber agregado integrantes
**Entonces** el flujo confirma la creación igual
**Y** en la UI de integrantes ve “Aún no hay integrantes”

**Escenario: Camino negativo — cancelar eliminación**

**Dado** que existe un grupo en el listado
**Cuando** el admin inicia Eliminar y cancela la confirmación
**Entonces** el grupo sigue en el listado
