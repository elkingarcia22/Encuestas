# HU: Chat IA para crear y gestionar grupos

## Contexto

Crear grupos por área, cargo o criterios personalizados desde tablas es lento. Un chat con IA guía al admin en crear, editar o consultar grupos con opciones guiadas. Meta: iniciar una intención de grupo (crear / editar / consultar) en un solo clic desde el welcome.

## Historia de Usuario

**Como** administrador de recursos humanos,
**quiero** conversar con un asistente de IA sobre grupos,
**para** crear, editar o consultar grupos sin armar todo a mano desde cero.

## Alcance

**Incluye:**
- Pantalla de chat con panel “Mis chats” (historial de la sesión).
- Welcome “Hola, {nombre}” con sugerencias Crear grupos / Editar grupos / Consultar grupos.
- Subopciones por intención (personalizados, por área, por cargo; agregar/eliminar usuarios; consultar detalles, etc.).
- Nuevo chat, buscar conversaciones, eliminar chat del historial.
- Volver al listado de grupos.

**Excluye:**
- Ejecución completa de creación/edición real de grupos desde cada subopción (hoy responde “Próximamente…” tras elegir subopción).
- CRUD manual de grupos (HU-LMS-006).

## Reglas de Negocio

- **RN-01:** Intenciones principales literales: “Crear grupos”, “Editar grupos”, “Consultar grupos”.
- **RN-02:** Tras elegir una intención, la IA responde “¡Sí, encantado! Dentro de esta opción te puedo ayudar a:” y muestra las subopciones de esa intención.
- **RN-03:** Subopciones de Crear: “Crear grupos personalizados”, “Crear grupos por área”, “Crear grupos por cargo”.
- **RN-04:** Subopciones de Editar: “Agregar usuarios a un grupo”, “Eliminar usuarios de un grupo”, “Recomendar optimización estratégica”.
- **RN-05:** Subopciones de Consultar: “Ver detalles de un grupo existente”, “Consultar si alguien no está en un grupo”, “Listar todos los grupos existentes”.
- **RN-06:** Al elegir una subopción, las chips de esa respuesta se marcan como usadas y la IA responde “Próximamente te daré la información detallada para esta opción.”
- **RN-07:** Si el historial de la sesión está vacío, el panel muestra “No hay conversaciones” / “Aún no hay chats en esta sesión. Inicia uno nuevo desde el chat.”
- **RN-08:** Al iniciar un chat nuevo con mensajes previos, el chat actual se guarda en “Mis chats” con su título (o “Nuevo chat”).

## Criterios de Aceptación

**Escenario: Camino feliz — empezar por Crear grupos**

**Dado** que el admin abre el Chat IA de grupos y ve el welcome
**Cuando** elige la sugerencia “Crear grupos”
**Entonces** su mensaje “Crear grupos” aparece en el hilo
**Y** la IA muestra las tres subopciones de creación (personalizados, por área, por cargo)

**Escenario: Caso borde — historial vacío**

**Dado** que el admin no ha iniciado ningún chat en la sesión
**Cuando** abre el panel “Mis chats”
**Entonces** ve el empty state “No hay conversaciones”
**Y** la descripción indica que aún no hay chats en esta sesión

**Escenario: Camino negativo — subopción aún no implementada**

**Dado** que el admin ya eligió “Crear grupos” y ve las subopciones
**Cuando** elige “Crear grupos por área”
**Entonces** las subopciones de esa respuesta quedan usadas (no se pueden reutilizar)
**Y** la IA responde que próximamente dará la información detallada para esa opción
