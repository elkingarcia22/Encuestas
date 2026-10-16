# HU: Tab Eventos en Zona de estudio

## Contexto

El colaborador necesita ver en un solo lugar las **próximas sesiones** de contenidos tipo **Evento** que le afectan. Lo que lista no es el Evento padre como ficha de catálogo, sino las **páginas de tipo Sesión** de ese Evento (fecha/hora de la jornada). Hay dos orígenes:

1. **Mis eventos** — sesiones de contenidos tipo **Evento** con visibilidad **Privada**, en los que el estudiante en cuestión fue **matriculado**.
2. **Eventos públicos** — sesiones de contenidos tipo **Evento** visibles para **toda la empresa** (no dependen de matrícula privada a esa persona).

Hoy eso no vive en el catálogo general ni en U. Corporativa. Meta: que María encuentre sus próximas jornadas sin salir de Zona de estudio.

## Historia de Usuario

**Como** colaborador de mi empresa,
**quiero** un tab Eventos en Zona de estudio con Mis eventos y Eventos públicos,
**para** ver las sesiones (páginas tipo Sesión) de eventos en los que me matricularon o que la empresa publica, solo las que están en vivo o por ocurrir.

## Alcance

**Incluye:**
- Tab **Eventos** en Zona de estudio (junto a Plan de contenidos, Plan de competencias, Exclusivo para mi, Historial y certificados).
- Dos secciones apiladas, cada una en su caja: **Mis eventos** (icono calendar) y **Eventos públicos** (icono calendar-circle-user), con conteo y listado de **cards de sesión**.
- Cada card representa una **página de tipo Sesión** perteneciente a un contenido **tipo Evento** (no la card del Evento completo del catálogo).
- **Mis eventos:** sesiones de Eventos con visibilidad **Privada** donde el colaborador autenticado **fue matriculado**.
- **Eventos públicos:** sesiones de Eventos con visibilidad para toda la empresa.
- Solo sesiones **en vivo** o **futuras**. Las sesiones **pasadas** no aparecen (salen de la lista al terminar).
- En cada sección, las sesiones se ordenan de la **más próxima a la más lejana** (por fecha/hora de inicio).
- Si una sección tiene **una sola** sesión: se muestra la card suelta, **sin** controles de carrusel (sin flechas ni indicadores).
- Si una sección tiene **dos o más** sesiones: se muestra **carrusel** (flechas en desktop; indicadores en móvil), mismo patrón que otros carruseles de Zona de estudio.
- Si una de las dos listas está vacía, **esa sección no se muestra**.
- Si **ambas** están vacías: un único empty state con título “No tienes eventos” y descripción “Aún no tienes eventos asignados ni públicos.”
- Deep links de prototipo: vista con datos y vista empty (`?demo=sin-eventos`).

**Excluye:**
- Página aparte “Eventos” en el sidenav de Aprendizaje (demo de layout en `/lab/u-corporativa-layout`).
- Carrusel de próximas sesiones en U. Corporativa (retirado; ver [HU-APR-010](../universidad-corporativa/HU-proximas-sesiones.md)).
- Confirmar asistencia / cuenta regresiva en Experiencia de estudio ([HU-APR-009](../experiencia-estudio/HU-asistir-sesion.md)).
- Crear o editar eventos o sesiones en LMS Creator.
- Contenidos que no sean tipo Evento (cursos, rutas, etc.), aunque tengan visibilidad Privada.
- Historial de sesiones ya ocurridas (no viven en este tab).

## Reglas de Negocio

- **RN-01:** El tab Eventos es una quinta tab de Zona de estudio; el orden es Plan de contenidos → Plan de competencias → Exclusivo para mi → Eventos → Historial y certificados.
- **RN-02:** **Mis eventos** lista únicamente **páginas de tipo Sesión** de contenidos **tipo Evento** con visibilidad **Privada** en los que el colaborador **fue matriculado**. “Privado” es la visibilidad del contenido en LMS; el estudiante solo ve esas sesiones en Mis eventos si está en la lista de matriculados.
- **RN-03:** **Eventos públicos** lista **páginas de tipo Sesión** de contenidos **tipo Evento** con visibilidad para **toda la empresa**. No dependen de matrícula privada a ese colaborador.
- **RN-04:** La unidad de listado es la **sesión** (tipo de página), no el Evento padre. Cada card muestra datos de esa sesión (fecha/hora, estado en vivo si aplica, metadatos del Evento al que pertenece).
- **RN-04a:** La card de una sesión es **la misma tarjeta de contenido del catálogo**, no una pieza aparte: mismas
  medidas, mismo tamaño de título y mismo trato del logo del proveedor. Lo único propio de una sesión son **las dos
  esquinas de la portada**: arriba a la izquierda, el **día y el mes**; arriba a la derecha, la insignia **«En vivo»**
  —con su punto de estado— si la sesión está ocurriendo, y si todavía no empieza, el **botón de añadir al calendario**,
  que es lo único que de verdad se puede hacer con ella. Son los **dos estados** de esta card.
- **RN-04b:** Donde la tarjeta del catálogo pone la **competencia**, la de una sesión pone **el evento del que cuelga**,
  y lleva el **icono de calendario**, que es el del tipo de contenido Evento. **No lleva el icono de etiqueta**: ahí no
  hay una categoría, hay un contenido tipo Evento, y con la etiqueta se lee como si fuera una categoría del catálogo
  (Dave, 2-oct). Donde el catálogo pone la duración, la sesión pone su **horario**.
- **RN-05:** Solo se listan sesiones cuya ventana **aún no terminó**: estado **en vivo** (ahora dentro de inicio–fin) o **futuras** (aún no inician). Al cerrarse la ventana, la sesión **desaparece** de Mis eventos y de Eventos públicos.
- **RN-06:** Dentro de cada sección (Mis eventos y Eventos públicos), las sesiones se muestran de la **más próxima a la más lejana**, según fecha/hora de inicio. Si hay una en vivo, va **primera**.
- **RN-07:** Por sección: con **1** sesión válida → card única **sin** carrusel (sin flechas ni indicadores). Con **2 o más** → carrusel con flechas (desktop) e indicadores (móvil), mismo patrón de Zona de estudio.
- **RN-08:** Cada sección muestra icono, título y conteo (`N evento` / `N eventos` según la cantidad de sesiones listadas en esa sección).
- **RN-09:** Si una lista no tiene sesiones vigentes, la sección correspondiente no se renderiza.
- **RN-10:** Si no hay sesiones vigentes en Mis eventos **ni** en Eventos públicos, se muestra un único empty state: título “No tienes eventos”; descripción “Aún no tienes eventos asignados ni públicos.”
- **RN-11:** La tab de Eventos vive dentro de Zona de estudio; el empty state se puede forzar con el modo demo.

## Criterios de Aceptación

**Escenario: Camino feliz — ver ambas secciones con cards de sesión**

**Dado** que María está matriculada en un Evento de visibilidad Privada que tiene al menos una sesión en vivo o futura
**Y** hay al menos una sesión en vivo o futura de un Evento visible para toda la empresa
**Cuando** abre Zona de estudio en el tab Eventos
**Entonces** ve la sección Mis eventos con cards de **sesión** (página tipo Sesión) de los Eventos en los que fue matriculada
**Y** ve la sección Eventos públicos con cards de sesión de Eventos de empresa
**Y** no ve la ficha de catálogo del Evento padre en lugar de la sesión

**Escenario: Caso borde — una sola sesión (sin carrusel)**

**Dado** que en Mis eventos solo hay **una** sesión vigente
**Cuando** María abre el tab Eventos
**Entonces** ve esa card de sesión
**Y** no ve flechas de Anterior/Siguiente ni indicadores de paginación en esa sección

**Escenario: Caso borde — varias sesiones (con carrusel)**

**Dado** que en Eventos públicos hay **dos o más** sesiones vigentes
**Cuando** María abre el tab Eventos
**Entonces** ve el carrusel de esa sección con controles para desplazarse (flechas en desktop; indicadores en móvil)

**Escenario: Caso borde — orden de más próxima a más lejana**

**Dado** que en Mis eventos hay varias sesiones vigentes con distinta fecha/hora de inicio
**Cuando** María abre el tab Eventos
**Entonces** las cards aparecen de la más próxima a la más lejana
**Y** si una está en vivo, esa card es la primera

**Escenario: Caso borde — sesión pasada desaparece**

**Dado** que María tenía una sesión en Mis eventos cuya ventana ya terminó
**Y** no le quedan otras sesiones privadas vigentes
**Cuando** abre el tab Eventos
**Entonces** esa sesión pasada ya no aparece
**Y** si además no hay Eventos públicos vigentes, ve el empty state único

**Escenario: Caso borde — solo una lista con datos**

**Dado** que María no tiene sesiones privadas vigentes pero sí hay sesiones públicas vigentes
**Cuando** abre el tab Eventos
**Entonces** solo ve la sección Eventos públicos
**Y** no ve la sección Mis eventos ni un empty state

**Escenario: Camino negativo — sin sesiones vigentes**

**Dado** que María no tiene sesiones privadas ni públicas en vivo o futuras
**Cuando** abre el tab Eventos
**Entonces** ve un único empty state con “No tienes eventos”
**Y** la descripción “Aún no tienes eventos asignados ni públicos.”
**Y** no ve secciones vacías de Mis eventos ni Eventos públicos

## Decisiones del prototipo

- **Sesiones de ejemplo:** una en curso (hoy, o el siguiente día hábil) y las de los próximos días hábiles, todas del evento «Protocolos de Supervivencia y Seguridad ante Sismos». Las tres primeras van en «Mis eventos» y las siete siguientes en «Eventos públicos».
- **Carrusel:** flechas en la cabecera de cada sección solo si hay más de una sesión.
- **Añadir a mi calendario:** Google Calendar y Outlook abren su formulario en otra pestaña; Apple Calendar y «Otro calendario (.ics)» descargan el archivo con un recordatorio 30 minutos antes.
- **Abrir una sesión:** la experiencia de estudio aún no existe en el playground UX; al tocar la tarjeta sale un aviso.

## Pantallas en el prototipo (playground UX)

| Pantalla o estado | Dirección |
|---|---|
| Eventos con sesiones | `/portal-colaborador/aprendizaje/zona-de-estudio#eventos` |
| Sin eventos | `/portal-colaborador/aprendizaje/zona-de-estudio?demo=sin-eventos#eventos` |
