# HU: Avisos internos

## Contexto

Comunicación interna manda avisos a toda la empresa —un cambio de política, una convocatoria, una
celebración— y hoy no tiene forma de saber si alguien los leyó. Avisos internos reúne en una sola
pantalla los que se publicaron, los que están programados y los borradores, con cuánta gente los
vio y cuánta interactuó, para dejar de escribir a ciegas.

## Historia de Usuario

**Como** responsable de comunicación interna,
**quiero** publicar avisos y ver cuántas personas los vieron y reaccionaron,
**para** saber qué mensajes llegan y ajustar los que no.

## Pantallas en el prototipo

Cada pantalla del flujo tiene su dirección en el playground UX (en local, `http://localhost:5173` + la dirección).

| Pantalla | Dirección | Qué se ve |
|---|---|---|
| Avisos internos | [`/admin/avisos-internos`](http://localhost:5173/admin/avisos-internos) | La tabla de avisos y las cifras del mes |
| Primera vez (sin avisos) | [`?demo=vacio`](http://localhost:5173/admin/avisos-internos?demo=vacio) | Empresa que estrena la herramienta: el estado vacío con «Crear aviso» |

## Alcance

**Incluye:**

- La tabla con búsqueda por título, filtro por estado, orden por columna y configuración de columnas visibles.
- Las cifras del mes arriba de la tabla.
- Crear, editar, archivar y ver el historial de un aviso.
- Los dos estados vacíos: primera vez y sin resultados de búsqueda.

**Excluye:**

- La segmentación por área o cargo: hoy un aviso va a toda la empresa.
- El detalle de quién vio cada aviso; solo se muestra el conteo.

## Reglas de Negocio

- **RN-01:** Un aviso está en uno de cuatro estados: **Publicado, Borrador, Programado o Archivado**.
- **RN-02:** Las columnas son **Título del aviso, Fecha de publicación, Autor, Estado, Visualizaciones, Likes y Clicks**. Todas se pueden ocultar; la miniatura del contenido y el menú de la fila van siempre.
- **RN-03:** Solo se puede **archivar** un aviso **Publicado** o **Programado**. Un borrador no se archiva: se descarta o se publica.
- **RN-04:** Un aviso **Archivado** no se edita. Deja de mostrarse a los colaboradores pero conserva sus cifras.
- **RN-05:** Las cantidades siguen el formato del producto: por debajo de 10.000 el número con separador de miles; de ahí en adelante, en K o M con un decimal.
- **RN-06:** Sin ningún aviso se muestra el estado **«Primera vez»** del design system, con «Crear aviso» como única salida y **sin la barra de la tabla**.
- **RN-08:** La cabecera de **Crear aviso** no lleva antetítulo con la ubicación («Herramientas · Avisos internos»): lo primero del cuerpo es el título. La ruta ya está en la miga de pan de la barra superior, y repetirla gastaba una línea de alto (Dave, 6-oct).
- **RN-09:** **Crear aviso** se guarda solo como **borrador** desde lo primero que se escribe, como los demás flujos de creación. La barra inferior es la de todos ellos: el **indicador de guardado automático** a la izquierda y **«Publicar aviso»** a la derecha, nada más (sin «Cancelar» ni «Guardar como borrador»). Salir no advierte pérdida: dice que el aviso queda como borrador. Al **editar un aviso ya publicado** no hay autoguardado: el botón es «Guardar cambios» y salir sí avisa que los cambios se pierden (Dave, 7-oct).
- **RN-07:** Con avisos pero sin coincidencias, se muestra **«Sin resultados»**, con «Limpiar búsqueda» y la lista intacta detrás.

## Criterios de Aceptación

**Escenario: ver el desempeño de lo publicado**

**Dado** que la empresa tiene avisos publicados este mes
**Cuando** la responsable entra a Avisos internos
**Entonces** ve cada aviso con su estado, su autor y sus visualizaciones, likes y clics
**Y** las cifras de arriba resumen el mes

**Escenario: archivar un aviso que ya no aplica**

**Dado** un aviso en estado «Publicado»
**Cuando** la responsable elige **Archivar** en el menú de su fila y confirma
**Entonces** el aviso pasa a «Archivado»
**Y** deja de ofrecer la opción de editar
**Y** conserva las cifras que había acumulado

**Escenario: empresa que estrena la herramienta**

**Dado** que no hay ningún aviso creado
**Cuando** la responsable entra a Avisos internos
**Entonces** ve el estado de primera vez con «Todavía no hay avisos»
**Y** no ve la barra de búsqueda ni los filtros
**Y** el botón «Crear aviso» abre el formulario

**Escenario: una búsqueda sin coincidencias**

**Dado** un listado con avisos
**Cuando** la responsable busca un título que no existe
**Entonces** ve «No se encontraron resultados» con el botón «Limpiar búsqueda»
**Y** al limpiarla vuelve a ver la lista completa
