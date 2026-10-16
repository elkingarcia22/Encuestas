# HU: Progreso del colaborador (vista de líder)

## Contexto

Además de Zona de estudio, el producto tiene una página Progreso con KPIs, planes vigentes, rankings y acciones de líder (recordatorios, generar plan con IA). No es solo un tab de Zona. Meta: que un líder vea el avance de su equipo y sus planes vigentes en un solo lugar.

## Historia de Usuario

**Como** colaborador líder de mi empresa,
**quiero** ver el progreso con métricas, planes vigentes y rankings de estudio,
**para** priorizar acompañamiento y detectar atraso en el equipo.

## Alcance

**Incluye:**
- Página Progreso (entrada propia del menú de Aprendizaje).
- Hero de persona (default María Alejandra / E006) y lista de equipo.
- KPIs y carrusel de planes vigentes.
- Rankings “Ranking de estudio del mes” y “Ranking entre áreas este mes”.
- CTA “Generar Plan con IA” y modal de recordatorios.
- Empty “Sin planes vigentes” con “Explorar catálogo”.

**Excluye:**
- Zona de estudio (HU-APR-003).
- Seguimiento HR de tareas (HU-TAR-003).
- Detalle de páginas del estudiante en Resultados del LMS Creator (HU-LMS-012).
- Exactitud de rankings de producción.

## Reglas de Negocio

- **RN-01:** Progreso es una página distinta de Zona de estudio.
- **RN-02:** Por defecto muestra a María Alejandra (E006) y puede cambiar el foco a miembros del equipo.
- **RN-03:** Incluye métricas de equipo / área / empresa en rankings, no solo avance personal aislado.
- **RN-04:** Si no hay planes vigentes, muestra “Sin planes vigentes” y ofrece “Explorar catálogo”.
- **RN-05:** “Generar Plan con IA” abre el panel de IA de esta vista (no Modo estudio IA).
- **Estado vacío (primera vez):** sin planes asignados se usa el «Primera vez» del design system: «Todavía no tienes planes vigentes», qué va a aparecer ahí y el botón **Explorar catálogo**. Se enseña con `?demo=vacio` (`?demo=sin-planes` sigue valiendo).

## Criterios de Aceptación

**Escenario: Camino feliz — ver progreso con planes**

**Dado** que María tiene planes vigentes
**Cuando** abre Progreso
**Entonces** ve KPIs, su hero y el carrusel de planes
**Y** puede consultar un ranking de estudio del mes

**Escenario: Caso borde — sin planes vigentes**

**Dado** que no hay planes vigentes para el foco actual
**Cuando** carga Progreso
**Entonces** ve “Sin planes vigentes”
**Y** puede ir a “Explorar catálogo”

**Escenario: Camino negativo — no confundir con Zona de estudio**

**Dado** que María está en Progreso
**Cuando** compara con Zona de estudio
**Entonces** ve rankings y acciones de líder que no son el listado por tabs de Zona
**Y** no sustituye la tab “Historial y certificados” de Zona

## Decisiones del prototipo

- **Acciones en la cabecera:** «Enviar recordatorio» y «Generar Plan con IA» van en la fila del título de la página, a la derecha (solo en el playground UX; el playground React los deja dentro de la página, en la tarjeta de la persona y en el bloque «Recordatorio de estudio»).
- **Equipo:** la líder primero y luego sus reportes directos. Al tocar un avatar se ve el progreso de esa persona; los rankings resaltan su fila.
- **Clic en un plan:** si es de la líder, abre su Zona de estudio con ese plan elegido; si es de otra persona, un panel con el avance de cada contenido o competencia.
- **Recordatorio de estudio:** se confirma en un modal. Si nadie tiene planes sin terminar, el modal lo dice y solo ofrece «Entendido».
- **El correo del recordatorio es solo del prototipo:** al confirmar sale el aviso «Recordatorios enviados» y, cuando ese aviso se cierra, el playground abre la vista previa del correo (con «Vista del prototipo» arriba). En el producto no se abre nada: el correo le llega a cada persona. Es la misma regla del correo de certificados.
- **Agente de planes:** conversación guiada sin IA real (tipo de plan → título → personas → fechas → contenidos, o competencias y horas → resumen). También entiende todo en un solo mensaje. «Generar plan» gasta 80 tokens, guarda el plan y cierra el panel; si el plan ya está vigente, aparece en la página de la primera persona.
- **Ranking entre áreas:** no suma el tiempo total, porque así el área con más gente siempre ganaría. Se ordena por **cursos finalizados en promedio por persona**: cursos terminados del área dividido entre todas sus personas (hayan estudiado o no). Cada fila muestra el área y el promedio («11,4 cursos»). Por ahora solo en el playground UX.
- **Planes vigentes:** en cuadrícula de tres columnas; en pantallas angostas quedan uno debajo del otro.

## Pantallas en el prototipo (playground UX)

Todo vive en `/portal-colaborador/aprendizaje/progreso` (en local: `http://localhost:5173` + la dirección).

| Pantalla o estado | Dirección |
|---|---|
| Progreso (equipo de 7) | `/portal-colaborador/aprendizaje/progreso` |
| Equipo grande (25, con «+15») | `?demo=equipo-grande` |
| Sin planes vigentes (primera vez) | `?demo=vacio` · también `?demo=sin-planes` |
| Correo del recordatorio (vista del prototipo, no existe en el producto) | `/portal-colaborador/aprendizaje/progreso/correo-recordatorio` |
