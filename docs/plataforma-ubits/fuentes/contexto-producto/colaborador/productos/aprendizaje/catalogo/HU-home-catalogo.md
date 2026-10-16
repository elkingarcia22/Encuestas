# HU: Home y catálogo de Aprendizaje

## Contexto

El colaborador necesita descubrir qué estudiar en UBITS sin depender solo de lo asignado. Un home con catálogo y búsqueda aumenta la exploración de contenidos y el inicio autónomo de aprendizaje. Meta: que María pueda encontrar e iniciar un contenido del catálogo UBITS desde el home.

## Historia de Usuario

**Como** colaborador de mi empresa,
**quiero** explorar y buscar contenidos del catálogo UBITS desde Aprendizaje,
**para** encontrar material relevante más allá de mis planes asignados.

## Alcance

**Incluye:**
- Home de aprendizaje con secciones de descubrimiento (carruseles / listados).
- Búsqueda y exploración de contenidos del catálogo UBITS.
- Entrada hacia experiencia de estudio desde una card de contenido.

**Excluye:**
- U. Corporativa (catálogo solo empresa) — HU-APR-005.
- Modo estudio IA — HU-APR-001.
- Administración del catálogo (LMS Creator).

## Reglas de Negocio

- **RN-01:** El usuario demo es María Alejandra Sánchez Pardo (E006) en todo Aprendizaje.
- **RN-02:** El home de Aprendizaje muestra contenidos del catálogo UBITS (no solo U. Corporativa).
- **RN-03:** La experiencia de estudio no es una entrada del menú principal; se abre desde cards u otros puntos con un contenido concreto.
- **RN-04:** Si la búsqueda no tiene coincidencias, se muestra el empty state “No se encontraron resultados” con acción para limpiar la búsqueda.

## Criterios de Aceptación

**Escenario: Camino feliz — explorar home e iniciar contenido**

**Dado** que María Alejandra entra a Aprendizaje
**Cuando** explora una sección del catálogo y abre un contenido
**Entonces** inicia la experiencia de estudio de ese contenido
**Y** no entra al chat del tutor de Modo estudio IA

**Escenario: Caso borde — búsqueda sin resultados**

**Dado** que María busca un término sin coincidencias (por ejemplo “xyzsinresultados999”)
**Cuando** se muestran resultados
**Entonces** ve el empty state “No se encontraron resultados”
**Y** puede limpiar la búsqueda

**Escenario: Camino negativo — acceso sin sesión de colaborador**

**Dado** que no hay un colaborador autenticado en el espacio de Aprendizaje
**Cuando** se intenta usar el home de catálogo como si fuera de María
**Entonces** no se presenta el catálogo personalizado de María Alejandra (E006)
**Y** el sistema exige entrar como colaborador antes de explorar
