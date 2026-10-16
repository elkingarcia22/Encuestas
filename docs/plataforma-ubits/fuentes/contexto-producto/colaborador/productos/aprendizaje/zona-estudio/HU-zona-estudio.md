# HU: Zona de estudio

## Contexto

El colaborador necesita un lugar para ver lo asignado (planes de contenidos/competencias, exclusivo e historial), separado del catálogo general. Meta: localizar un plan asignado a María sin pasar por el catálogo UBITS.

## Historia de Usuario

**Como** colaborador de mi empresa,
**quiero** ver mis planes asignados, lo exclusivo para mí y mi historial,
**para** priorizar lo obligatorio y retomar lo que ya empecé.

## Alcance

**Incluye:**
- Tabs: “Plan de contenidos”, “Plan de competencias”, “Exclusivo para mi”, “Eventos”, “Historial y certificados”.
- Toolbar “Lista de contenidos” con búsqueda.
- Deep link por plan (`planId`) y anclas de tab.
- Empty de búsqueda “No se encontraron resultados”.
- Tab Eventos (Mis eventos / Eventos públicos): detalle en [HU-APR-011](HU-tab-eventos.md).

**Excluye:**
- Vista Progreso (página aparte, HU-APR-006).
- Seguimiento HR (HU-TAR-003).
- Navegación desde las cards hacia Experiencia de estudio (hoy las cards no abren el consumo).
- Descarga de certificados del historial (toast “Esta acción aún no está disponible en el Playground.”).
- Modal Filtrar (botón visible sin acción).
- Detalle del tab Eventos (HU-APR-011).

## Reglas de Negocio

- **RN-01:** Zona de estudio muestra planes/asignaciones del colaborador (María Alejandra, E006), no toda la empresa.
- **RN-02:** Las tabs literales son: Plan de contenidos, Plan de competencias, Exclusivo para mi, Eventos, Historial y certificados.
- **RN-03:** La búsqueda filtra la lista visible; sin coincidencias muestra empty de sin resultados.
- **RN-04:** Abrir un contenido desde una card de Zona aún no inicia Experiencia de estudio.
- **RN-05:** El contador del toolbar nombra el tipo de ítem (`contenidos`), no “resultados”.
- **RN-06:** El tab Eventos sigue las reglas de [HU-APR-011](HU-tab-eventos.md).
- **Estados vacíos (primera vez):** las cinco pestañas usan el «Primera vez» del design system, cada una con lo suyo, y todas salen por **Explorar catálogo**, porque aquí el colaborador no crea nada:
  - Plan de contenidos: «Todavía no tienes un plan de contenidos».
  - Plan de competencias: «Todavía no tienes un plan de competencias».
  - Exclusivo para mí: «Todavía no tienes contenidos exclusivos».
  - Eventos: «Todavía no tienes eventos».
  - Historial y certificados: «Todavía no has terminado ningún contenido».
  No confundirlo con «Sin resultados», que es cuando sí hay datos y los dejó fuera la búsqueda. Se enseñan con `?demo=vacio` más la pestaña.

## Criterios de Aceptación

**Escenario: Camino feliz — ver plan de contenidos**

**Dado** que María tiene al menos un plan de contenidos asignado
**Cuando** abre Zona de estudio en la tab “Plan de contenidos”
**Entonces** ve ese plan en el listado
**Y** puede buscar dentro de la lista de contenidos

**Escenario: Caso borde — búsqueda sin resultados**

**Dado** que María está en Zona de estudio
**Cuando** busca un término sin coincidencias
**Entonces** ve “No se encontraron resultados”
**Y** puede limpiar la búsqueda

**Escenario: Camino negativo — card sin consumo**

**Dado** que María ve un contenido en Zona de estudio
**Cuando** intenta abrirlo desde la card
**Entonces** no entra a Experiencia de estudio
**Y** permanece en Zona de estudio

## Decisiones del prototipo

Resueltas al maquetar en el playground UX, a partir del playground React:

- **Persona de la sesión:** María Alejandra Sánchez Pardo (E006). Sus planes salen de la base de planes de formación del playground; se ven los vigentes y los no vigentes, nunca los que aún no empiezan.
- **Plan por pestaña:** Plan de contenidos y Plan de competencias recuerdan cada una el plan elegido mientras la persona siga en la página. `?planId=` preselecciona el plan (así llega desde Progreso).
- **Plan vencido:** si el plan elegido ya no está vigente, aparece «Recordatorio: Lo que completes después de la fecha límite no se suma al progreso del plan…».
- **Filtrar:** el botón está, pero los filtros de las listas todavía no se maquetan; al tocarlo, el playground lo avisa.
- **Abrir un contenido:** la experiencia de estudio aún no existe en el playground UX; al tocar una tarjeta sale un aviso.
- **Descargar certificado:** en el historial, solo en contenidos terminados que dan certificado; en el playground muestra «Esta acción aún no está disponible en el Playground.».

## Pantallas en el prototipo (playground UX)

Todo vive en `/portal-colaborador/aprendizaje/zona-de-estudio` (en local: `http://localhost:5173` + la dirección).

| Pantalla o estado | Dirección |
|---|---|
| Plan de contenidos (la de entrada) | `#contenidos` |
| Cualquier pestaña vacía (primera vez) | `?demo=vacio` + la pestaña: `?demo=vacio#contenidos`, `#competencias`, `#exclusivo`, `#eventos`, `#historial` |
| Plan de competencias | `#competencias` |
| Un plan concreto | `?planId=pf-c-gerencia-general-2026-q3#contenidos` · `?planId=pf-k-024-2026#competencias` |
| Exclusivo para mí | `#exclusivo` |
| Eventos | `#eventos` (ver HU-tab-eventos) |
| Historial y certificados | `#historial` |
| La vieja pestaña Progreso | `#progreso` → lleva a `/portal-colaborador/aprendizaje/progreso` |
