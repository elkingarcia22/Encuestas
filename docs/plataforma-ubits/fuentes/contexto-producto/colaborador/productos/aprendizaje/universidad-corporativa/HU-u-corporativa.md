# HU: Universidad corporativa (catálogo de empresa)

## Contexto

Además del catálogo UBITS, cada empresa publica contenidos propios. El colaborador necesita un espacio claro para el catálogo de mi empresa. Meta: filtrar contenidos internos por tipo/categoría/nivel/idioma y poder abrir el consumo desde la card.

## Historia de Usuario

**Como** colaborador de mi empresa,
**quiero** explorar el catálogo de contenidos de mi empresa (U. Corporativa) y abrir un contenido,
**para** encontrar formación interna y empezar a estudiarla.

## Alcance

**Incluye:**
- Banner y título “Contenidos de mi empresa”.
- Lista de contenidos de mi empresa con filtros Tipo / Categoría / Nivel / Idioma y paginador.
- Botón “Acceder a LMS Creator”.
- Empty de búsqueda/filtros sin resultados.
- Deep link por categoría.
- Clic en card de curso/contenido → Experiencia de estudio con el `id` del contenido (salvo rutas de aprendizaje).

**Excluye:**
- Catálogo global UBITS del home (HU-APR-002).
- Carrusel de próximas sesiones presenciales (retirado de U. Corporativa; ver HU-APR-010 obsoleta / demo lab).
- Navegación desde cards de Zona de estudio (sigue sin abrir consumo).
- Filtro fino de visibilidad por colaborador (lista los contenidos publicados de mi empresa en el catálogo).
- Páginas pedagógicas distintas por cada contenido de mi empresa (el playground reutiliza el recorrido demo de experiencia de estudio con la portada/metadatos del contenido elegido).

## Reglas de Negocio

- **RN-01:** U. Corporativa muestra contenidos de mi empresa, no el catálogo UBITS completo.
- **RN-02:** La navegación identifica U. Corporativa como vista distinta del home de Aprendizaje.
- **RN-03:** Al hacer clic en una card de contenido (no «Ruta de aprendizaje»), se abre Experiencia de estudio con el id de ese contenido.
- **RN-04:** Si filtros o búsqueda no tienen coincidencias, se muestra empty de sin resultados (no se rellenan tarjetas UBITS).
- **RN-05:** El contenido «Prevención del acoso laboral» (`f002`) es el demo de navegación libre en el playground (ver HU-APR-007).
- **RN-06:** El contador del toolbar nombra el tipo de ítem (`contenidos`), no “resultados”.
- **Estado vacío (primera vez):** si la empresa todavía no publicó nada suyo, se usa el «Primera vez» del design system con «Tu empresa todavía no publicó contenidos» y el botón **Explorar catálogo**, que lleva al catálogo de UBITS. El colaborador no crea contenidos: su única salida es ir a buscar. Se enseña con `?demo=vacio`.

## Criterios de Aceptación

**Escenario: Camino feliz — explorar U. Corporativa**

**Dado** que mi empresa tiene contenidos corporativos publicados
**Cuando** María abre U. Corporativa
**Entonces** ve “Contenidos de mi empresa” con la lista de contenidos de mi empresa
**Y** puede filtrar por Tipo, Categoría, Nivel o Idioma

**Escenario: Caso borde — filtros sin resultados**

**Dado** que María aplica filtros sin coincidencias
**Cuando** se actualiza la lista
**Entonces** ve un empty state claro
**Y** no se rellenan tarjetas del catálogo UBITS global

**Escenario: Camino feliz — abrir consumo desde la card**

**Dado** que María ve «Prevención del acoso laboral» en U. Corporativa
**Cuando** hace clic en la card
**Entonces** entra a Experiencia de estudio de ese contenido
**Y** puede iniciar el recorrido de estudio

## Decisiones del prototipo

Resueltas al maquetar en el playground UX, a partir del playground React:

- **Qué se lista:** los mismos contenidos de LMS Creator › Contenidos, solo los que están **Publicados** (21 en los datos de ejemplo). Los borradores, privados, ocultos y archivados no se ven aquí.
- **Sesiones (HU-APR-010, RN-08):** no aparecen de entrada. Salen primero en la lista al buscarlas (título, evento, fecha u hora) o al filtrar por tipo «Sesión», con la misma tarjeta de sesión de Zona de estudio › Eventos.
- **Mismos controles que LMS Creator › Contenidos:** el buscador, el botón Filtrar con el número de criterios, el contador «N/M contenidos», los chips de filtros aplicados, el modal de filtros (Tipo de contenido, Categoría, Nivel e Idioma; el tipo suma «Evento» y «Sesión»), el vacío sin resultados y la paginación (12, 24 o 48 por página). Es una sola pieza que usan las dos pantallas.
- **Abrir un contenido:** la experiencia de estudio aún no existe en el playground UX; al tocar una tarjeta sale un aviso.
- **Acceder a LMS Creator:** lleva a LMS Creator › Contenidos del administrador.

## Pantallas en el prototipo (playground UX)

| Pantalla o estado | Dirección |
|---|---|
| Universidad corporativa | `/portal-colaborador/aprendizaje/universidad-corporativa` |
| Sin contenidos de la empresa (primera vez) | `?demo=vacio` |
| Con una categoría ya filtrada | `?categoria=cfq-003` (cualquier `cfq-XXX`; también `?categoriaId=`) |
