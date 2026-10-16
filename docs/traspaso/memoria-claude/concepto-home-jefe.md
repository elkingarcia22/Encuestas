---
name: concepto-home-jefe
description: El concepto de dashboard del jefe (admin-ubits.netlify.app) es la maqueta visual de HU-INI-001/002/003; se armó como template «Home operativo».
metadata: 
  node_type: memory
  type: project
  originSessionId: 9b6ec876-7655-459c-8d46-b59dd878042e
  modified: 2026-09-16T03:22:15.375Z
---

El 2026-09-11 el usuario compartió el concepto de su jefe para el inicio del administrador:
https://admin-ubits.netlify.app/ («UBITS Admin HR — Home (propuesta)», HTML estático con JS).
Pidió «algo similar», como plantilla nueva (ya existían Dashboard y Dashboard RR.HH.), con flux-ui.

El concepto calza 1:1 con las historias de `docs/plataforma-ubits/fuentes/contexto-producto/admin/inicio/`:
HU-INI-001 (saludo, Top métricas 7/30 días, Necesita tu atención, «Quick actions» en inglés),
HU-INI-002 (menú de empresa en la fila del logo con Licencias/Créditos, Configuración y
Fiqsha/Alpha/Beta/Omega; Aprendizaje con tercer nivel LMS Creator → Contenidos…) y HU-INI-003
(pie legal, oculto en Agente IA). Estados escondidos del concepto: modo Agente IA con historial,
notificaciones, menú de cuenta con modo oscuro, Novedades y Feedback.

Quedó en `src/modules/design-system/templates/home-operativo/` (ruta
`/design-system/templates/home-operativo`, entradas sin template caen en `pendiente`).

**Estado al 2026-09-12:** ajustado con la revisión de Carlos ([[feedback-carlos-concepto]]):
Google (también en Colaborador y en el login, con UBITS abajo), pestaña «Suite AI» con ícono de IA
(cambio en `SidebarModeTabs`, afecta a todo el marco), 3 tarjetas con la gráfica `Tendencia` de
`dashboard/components/graficos.tsx` (copia del bloque dashboard-2 de ReUI; se quitó «Usuarios
logueados» por repetir Participación) y modales sin X. Publicado en Vercel el 2026-09-12, pero
se commiteó el 2026-09-14 en la rama `cristian` (commit 79b3957, sin push). «Crear un curso» sigue sin color de IA: flux-ui no
tiene tarjeta de color. **Resuelto el 2026-09-14:** la textura azul de Nicolás
no gustó («esos no son los colores de la IA»). Los colores de IA son los del prototipo (`.qa-hero`):
`linear-gradient(155deg, #0C5BEF, #8823EA 48%, #EA066F)` + brillo naranja arriba a la derecha + pestaña
morado-fucsia al 20 % que asoma 12 px detrás. Como el código no admite colores literales, son imágenes
en `home-operativo/assets/` (`degradado-ia.png`, `pestana-ia.png`, generadas con Chrome headless
`--screenshot --default-background-color=00000000`). La Card va `relative isolate` con la imagen de último
hijo `absolute inset-0 -z-10` (si es el primero, la Card le quita el relleno de arriba); el CardHeader
lleva `dark` y usa Heading/Text (fijan `text-foreground`, así salen blancos; CardTitle heredaría el color
oscuro); el botón `outline` queda blanco fuera del modo oscuro; la bolita es `suite-ai/assets/orbe.png`.
Relacionado: [[marco-unico-shellubits]], [[contexto-producto-hus]], [[login-ubits]].

**Rediseño del 2026-09-14 (a pedido del usuario, varias vueltas):** «Necesita tu atención» terminó así:
título afuera (Heading + Badge con el total, alineado con «Quick actions»), **una sola caja**
(`Frame dense stacked` con cada pendiente en un `FramePanel` + `Item`), las 6 filas siempre visibles y estiradas hasta
el alto de Quick actions (grilla sin `items-start`, Frame `grow`, paneles `flex items-center`),
icono Hugeicons en `IconTile variant="soft"` (fondo azul claro, icono azul) y **sin Badge de estado**.
Rechazó: la franja de título dentro del marco con panel adentro («caja dentro de caja»), imágenes Glass
(«más flat»), baldosas de colores por urgencia y neutras en gris, las etiquetas Urgente/Esta semana/
Pendiente y el «Ver los 6 pendientes». Trampas de flux-ui: `Frame dense` conserva 3 px de relleno (su
`p-0` no gana a `px-(--frame-px)`) → `[--frame-px:0px] [--frame-py:0px]`; `IconTile soft` pinta un
recuadro interno → `[--icon-tile-inset:0px]`; relleno de `FramePanel` → `[--frame-panel-px:0px]
[--frame-panel-py:0px]`; las clases `cn-item-*` del estilo vega ganan a `gap-0`/`my-0`/`px-0`.
Quick actions: probé meterlo en el mismo marco con 3 tarjetas de título corto y flecha ↗ (card-5 de
ReUI) y el usuario lo rechazó dos veces («me gustaba como estaba antes»): quedó la tarjeta «Crear un
curso» + tarjetas `Item` outline con Glass de 56 px, título y bajada, ahora solo **3** (Crear encuesta,
Gestionar usuarios, Métricas de aprendizaje). Pendientes y atajos de Encuestas, Gestión de usuarios y
Planes llevan a sus templates (`destino` de admin-compartido).

**Home en el marco de Suite AI (2026-09-14):** el contenido del Inicio vive en
`home-operativo/components/inicio-operativo.tsx` (`InicioOperativo({ enlace })`); el Home operativo lo usa
con `destino` y el template nuevo **Home Suite AI** (`/design-system/templates/home-suite-ai`, una sola
pantalla) lo monta dentro del menú y la barra del template Suite AI, reutilizando sus piezas de
`suite-ai/components` sin tocarlas. Menú, pestaña Suite AI, buscador y enlaces del Home llevan a las
pantallas de `suite-ai` (contenidos→editor, planes→planes-de-formacion, descarga-certificados→certificados).
Ese marco sigue con la marca Meta del concepto de Nicolás.

**Tras la reunión del 2026-09-14 ([[reunion-cierre-concept-2026-09-14]]):** Top métricas quedó **igual a los
indicadores del Inicio de Nicolás** (`suite-ai/inicio`, la versión elegida en la reunión): título «Top métricas»
+ pestañas 7/30 afuera; `Frame` > `FramePanel` con `divide-x` y 3 celdas (nombre en gris, cifra `Text xl
semibold` + `Tendencia` azul `var(--primary)` de 24×9, `Variacion` + «vs. semana pasada / mes pasado»).
Series con `subida()` (12 puntos en 7 días). El usuario rechazó antes: celdas con icono y gráfica a todo el
ancho, y el bloque chart-1 de ReUI con encabezado y pie («que se vea bien pero no tan complejo»). Quick actions: Glass + título, sin descripción. `PieWorkspace` (pie general, también en
admin-compartido) dice «Con la tecnología de» + logo UBITS en gris antes de Términos y Política.

**Borde doble en toda la Home (2026-09-14, pedido del usuario):** «Necesita tu atención» pasó a `Frame stacked`
(sin `dense`) y Quick actions a un `Frame` con «Crear un curso» como FramePanel (degradado de fondo, sin la
pestaña; se borró `pestana-ia.png`) y los 3 atajos como FramePanel `fit` con un `Item` enlace adentro. La
bolita de IA va dentro del botón «Crear ahora» (img de 18 px, `data-icon="inline-start"`). **Botón pastilla
(radio completo en IA):** Button de flux-ui no tiene `radius`; el usuario lo pidió igual (2026-09-14), así que
«Crear ahora» lleva `[--radius:calc(infinity*1px)]` (la clase `cn-button` usa `calc(var(--radius) - 2px)`;
redefinir `--radius-md` no sirve). Excepción anotada en el código; pedir `radius` en Button a la librería.
Quick actions tiene **4 atajos** (se sumó «Lanzar anuncio», glass-volume) en 2×2 con filas iguales
(`auto-rows-fr`); «Crear un curso» es FramePanel `fit` para no quedar alto. Encabezado como el de Nicolás:
«Hola, Carolina» + «{saludo}. Esto es lo que pasa hoy en tu empresa.» y un Select de periodo a la derecha;
se quitó la fecha, el título «Top métricas» y las pestañas (el periodo vive en `InicioOperativo`).
Fondo azul difuminado: brillos radiales que se desvanecen antes de los bordes (`assets/ambiente-azul.png`),
img `absolute -top-4 -z-10 h-96` dentro del Inicio. Probé uno desde la esquina superior derecha detrás de
todo el área (prop `fondo` en ShellUbits) y el usuario lo rechazó («no se ve muy bien»): se revirtió y el
marco quedó sin esa prop. El degradado de «Crear un curso» se agranda desde la esquina al pasar el cursor
(`group/ia`, `group-hover/ia:scale-150`, `motion-reduce:transition-none`).
Métricas finales (pedido del usuario con captura): «Usuarios con ingreso» (268 de 444 registrados),
«Usuarios activos en el periodo» (41 de 118 con ingreso) y «Tasa de terminación» (29,8 %, 94 contenidos
finalizados), cada una con icono de información (Tooltip con qué mide), variación junto a la cifra,
minigráfica azul y el detalle debajo. Títulos de los 4 atajos siempre en dos renglones (campo `lineas`).
**Una sola Home en /admin (2026-09-15, decisión del usuario):** `modules/admin/inicio/main.tsx` monta
`InicioOperativo` (con un mapa slug → ruta de /admin; gestión de usuarios apunta a la plantilla) y debajo los
bloques de Nicolás (TrainingCard, ProgramsCard, VacanciesCard, EvaluationsCard, ActivityCard), dentro de
`PageShell`. Se quitaron su KpiStrip y TodayCard por repetir métricas y pendientes. El saludo quedó como pidió
Carlos: «Buenas tardes, Carolina» + «Esto es lo que pasa hoy en tu empresa». Sus badges de variación a la baja
pasaron a `destructive-outline` ([[badge-destructive-light-ilegible]]).

**Prototipo corto** (https://admin-short-ubits.netlify.app/, 2026-09-14): de ahí salen las métricas, sus cifras
de 7 y 30 días (268/41/29,8 % y 321/54/32,5 %) y los textos del icono de información (el icono va a la
DERECHA del título). El periodo volvió a pestañas (el usuario prefirió tab a desplegable). Ese prototipo
además trae «Top competencias» (4 con horas de consumo) y «Accesos rápidos» (Crear un curso, Crear
encuesta, Ver vacantes, Crear plan de formación) y no tiene «Necesita tu atención»: pendiente de decidir.


**Cómo va cada producto (2026-09-16, reunión con el CEO):** en /admin, bajo el Inicio, pestañas Aprendizaje
(Formación, Programas de Nicolás), Selección (5 tarjetas del tablero actual + Vacantes) y Desempeño y cultura
(Assessment «Resumen» en 4 columnas con 2 medidores, Evaluaciones 360 con filtros, escalas y cajas grises, y el
avance del ciclo de Nicolás). Todo en Frame (`admin/inicio/components/productos.tsx` y `bloques.tsx`). El usuario
pidió **no agregar información de más**: solo lo que ya había + lo de sus capturas; nada de etiquetas de nivel ni
opciones inventadas. Un medio anillo con el arco cortado en seco «se ve cargando»: usar puntas redondeadas.
