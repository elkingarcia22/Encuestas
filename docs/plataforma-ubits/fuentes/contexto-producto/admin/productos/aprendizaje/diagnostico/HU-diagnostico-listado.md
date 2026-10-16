# HU: Listado de assessments de Diagnóstico

## Contexto

Diagnóstico mide competencias de la empresa con pruebas que se abren y se cierran en fechas
concretas. Quien administra necesita ver, de un vistazo, cuáles están corriendo, cuántas personas
ya respondieron y cuáles todavía no arrancan — hoy eso obliga a entrar prueba por prueba. El
listado reúne todo en una tabla y es el punto de entrada del módulo.

## Historia de Usuario

**Como** administradora de Aprendizaje,
**quiero** ver todos los assessments de mi empresa con su estado, sus fechas y su participación,
**para** saber cuáles necesitan un empujón antes de que cierren.

## Pantallas en el prototipo

Cada pantalla del flujo tiene su dirección en el playground UX (en local, `http://localhost:5173` + la dirección).

| Pantalla | Dirección | Qué se ve |
|---|---|---|
| Listado de assessments | [`/admin/aprendizaje/diagnostico`](http://localhost:5173/admin/aprendizaje/diagnostico) | La tabla con todos los assessments y las cifras de arriba |
| Primera vez (sin assessments) | [`?demo=vacio`](http://localhost:5173/admin/aprendizaje/diagnostico?demo=vacio) | Empresa que estrena el módulo: el estado vacío con «Crear assessment» |
| Crear assessment | [`/admin/aprendizaje/diagnostico/crear`](http://localhost:5173/admin/aprendizaje/diagnostico/crear) | El asistente — detalle en [HU-crear-assessment](HU-crear-assessment.md) |

## Alcance

**Incluye:**

- La tabla con búsqueda por nombre, filtros de Tipo y Estado, orden por columna y configuración de columnas visibles.
- Las cifras del módulo arriba de la tabla.
- El menú por fila, con las acciones que dependen del estado.
- Los dos estados vacíos: primera vez y sin resultados de búsqueda.

**Excluye:**

- La creación de un assessment: [HU-crear-assessment](HU-crear-assessment.md).
- Los resultados y las métricas de un assessment, que todavía no están maquetados.

## Reglas de Negocio

- **RN-01:** Las columnas son **Assessment, Tipo, Inicio, Fin, Participación y Estado**. Todas se pueden ocultar desde el botón de configuración; la de acciones va siempre.
- **RN-02:** El estado lo manda **el calendario**, no la persona: una prueba pasa sola de «Planeado» a «Vigente» y a «No vigente» según sus fechas. Son los cuatro estados del producto real —Planeado, Vigente, No vigente e **Inactivo**, la medida que se creó sin programar— y **no son los mismos que los de un plan de competencias**, aunque compartan tres palabras: el plan además tiene «Procesando». Los estados que coinciden llevan el mismo color que en Planes de formación (renombrados el 30-sep-2026; antes eran Por iniciar, En progreso y Finalizado).
- **RN-03:** La única excepción a RN-02 es **activar**: un assessment «Planeado» o «Inactivo» se puede adelantar desde el menú de su fila para que abra hoy. El resto de estados no ofrecen esa acción.
- **RN-04:** Un assessment creado **sin fechas** nace «Inactivo» y no cuenta como corriendo hasta que se active.
- **RN-05:** La participación se muestra como porcentaje sobre las personas convocadas. Las cantidades siguen el formato del producto: por debajo de 10.000 el número con separador de miles; de ahí en adelante, en K o M con un decimal.
- **RN-06:** Sin ningún assessment se muestra el estado **«Primera vez»** del design system, con «Crear assessment» como única salida y **sin la barra de la tabla**: buscar y filtrar no tienen sentido cuando no hay nada.
- **RN-07:** Con assessments pero sin coincidencias, se muestra **«Sin resultados»**, con «Limpiar búsqueda» y la lista intacta detrás.

## Criterios de Aceptación

**Escenario: ver qué está corriendo**

**Dado** que la empresa tiene assessments en varios estados
**Cuando** la administradora entra al listado
**Entonces** ve cada uno con su tipo, sus fechas, su participación y su estado
**Y** las cifras de arriba resumen cuántos hay en cada situación

**Escenario: adelantar una prueba programada**

**Dado** un assessment en «Planeado»
**Cuando** la administradora elige **Activar** en el menú de su fila
**Entonces** el assessment pasa a «Vigente» con fecha de inicio hoy
**Y** sus fechas se recalculan conservando la duración que tenía

**Escenario: empresa que estrena el módulo**

**Dado** que no hay ningún assessment creado
**Cuando** la administradora entra al listado
**Entonces** ve el estado de primera vez con «Todavía no hay assessments»
**Y** no ve la barra de búsqueda ni los filtros
**Y** el botón «Crear assessment» la lleva al asistente

**Escenario: una búsqueda sin coincidencias**

**Dado** un listado con assessments
**Cuando** la administradora busca un nombre que no existe
**Entonces** ve «No se encontraron resultados» con el botón «Limpiar búsqueda»
**Y** al limpiarla vuelve a ver la lista completa
