# Reglas del Playground UX

Este repo es un **playground de maquetación** para el equipo de UX. Sirve para armar pantallas
rápido con la librería interna, no para construir producto real.

Quien pide los cambios es diseño, no ingeniería. Todo lo que sigue es obligatorio.

**Las reglas tienen una sola fuente: `ai-tools/reglas/reglas.json`.** De ahí salen los bloques
marcados `<!-- generado:… -->` de este archivo, las reglas y piezas del catálogo para la IA
(`ai-tools/flux-ui/flux-ui-para-ia.json`), el recordatorio de cada mensaje, el grafo y la
herramienta `ds-ubits`. Una regla se cambia ahí y se corre
`node ai-tools/reglas/generar-reglas.mjs`; los bloques generados no se editan a mano.

**Antes de maquetar, pregúntale al design system.** Si tu IA tiene la herramienta `ds-ubits`
(MCP del repo), úsala: `buscar_pieza` («confirmar», «tabla», «salir»…) te da la pieza, su
import y una pantalla que ya la usa; `reglas_para` te da las reglas que aplican al archivo que
vas a tocar; `revisar` te dice qué rompe un archivo.

---

## 1. La interfaz se arma con lo que ya existe

Ninguna pieza de interfaz (botón, input, tabla, modal, card, tabs, lo que sea) se dibuja a
mano. Tu trabajo es **combinar lo que ya está hecho**, nunca crear componentes visuales
nuevos: un círculo con una inicial es `Avatar`; una barra de color es `Progress`; un recuadro
vacío con mensaje es `Empty`; una etiqueta de estado es `Badge`.

Y se busca en un orden: **primero las piezas que este proyecto ya resolvió**, y solo si no
existen, el catálogo de `@ubits/flux-ui`.

### Primero, lo que el proyecto ya resolvió

**Antes de ir al catálogo, mira si la pieza ya existe aquí dentro.** El playground tiene su
propio sistema de diseño, y muchas piezas ya están resueltas y envueltas con las decisiones que
tomó el equipo. Volver a armarlas con flux-ui crea una segunda versión que se desincroniza a la
primera semana.

<!-- generado:piezas · sale de ai-tools/reglas/reglas.json; se cambia ahí y se corre node ai-tools/reglas/generar-reglas.mjs -->
| Si necesitas | Ya existe | No uses |
| --- | --- | --- |
| El marco de una página: ancho, título, migas, secciones, barra de acciones | `PageShell`, `PageHeader`, `PageBreadcrumbs`, `PageContent`, `PageSection`, `PageActionBar` | armarlo a mano |
| Un aviso | `notify(título, detalle, tipo)`, siempre con su tipo | `toast.add` suelto o `ToastToaster` en la pantalla: duplica los avisos |
| Un botón terciario de solo icono | `BotonIcono` (redondo) | `Button` con un icono dentro |
| El orbe del agente (16 a 180 px) | `Orb` | dibujarlo con `div` y degradados |
| Preguntar antes de hacer algo: eliminar, enviar, desactivar, mover, descartar, salir sin guardar | `DialogoConfirmar` con la tarjeta `RegistroConfirmar` (lo que se toca y a cuántos afecta); `otra` para la tercera salida («Guardar y salir») | `ActionDialog` para confirmar, un `notify` de «enviado» sin preguntar, `AlertDialog` suelto |
| Una ventana con contenido: formulario corto, lista para elegir, vista previa, detalle, escribir un correo | `ActionDialog`, la única (tamaños `sm`, `default`, `wide`, `full`) | `ConfiguredModal` (retirado), `Dialog` o `AlertDialog` sueltos |
| Crear o editar algo | una página con `PageShell`, `PageHeader` y `PageActionBar` (barra fija abajo con `ChipGuardado`) | una ventana o un panel (única excepción: «Agregar una persona a tu base», en ventana) |
| Salir de una creación o edición | `BotonSalirCreacion` («Salir de la creación» / «Salir de la edición») en las acciones de `PageHeader` | flecha junto al título, X, «Cancelar» en la barra de abajo |
| Una tabla o un listado | `TablaDatos`, la única: conteo a la izquierda, buscador a la derecha, orden y filtro por columna y su paginador `PiePaginacion`. La fila que nombra algo, con o sin imagen, es `CeldaTitulo`. Una lista de contenidos con portada suma el cambio Tabla/Cuadrícula (`CambioDeVista`) | `MarcoTabla` (retirada), `DataGridList` o `Table` sueltos, otro paginador |
| Un panel lateral | `DrawerShell` | `Sheet` directo |
| Cerrar una ventana o panel | `CloseButton` | una `X` a mano. En una creación no hay X: la salida es `BotonSalirCreacion` |
| El menú «⋯» de más acciones | `BotonIcono` con los tres puntos, el primero de la fila | un botón con la palabra «Acciones» |
| El estado «Razonando» | `AiThinking` | otro indicador de carga |
| Una ayuda contextual | al pasar el cursor, `Hint` y `HintContent`; un icono que explica al hacer clic, `BotonAyuda` | `Tooltip` suelto (solo abre con hover), el `title` del navegador |
| La marca de la IA | `IconoIA` (el orbe) y, como insignia, `EtiquetaIA` | estrellas, chispas o varitas |
| Invitar a que la IA haga el trabajo | `AiCard` | una `Card` con degradado a mano |
| Botones de IA | `BotonIa` (el primario, con el degradado) y `BotonIaSecundario` (la segunda acción de IA). Van al final de la fila | `AiButton` (retirado) |
| El botón que abre el agente contextual | `ReopenAgentButton`, que se llama «Orbit Flow» y va siempre el último de la fila | un botón armado a mano, «Agente IA» |
| El agente contextual (panel, hilo, propuestas) | el `agent-kit`: `AgentStage`, `AgentThread`, `ProposalCard`, `AgentCard`…; el cuadro de escribir es `Composer` (Suite AI) | rehacer el panel o sus tarjetas |
| Cifras de un tablero | `Indicadores` (con su marco) o `FilaCifras` (dentro de una tarjeta): una sola fila partida por líneas | tarjetas sueltas por cifra |
| Un estado vacío o de error | `PrimeraVez` (aún no hay nada; con `glass-danger` y «Reintentar» si algo no cargó) o `SinResultados` (la búsqueda o los filtros no encuentran nada), siempre con su ilustración glass | `Empty` armado a mano o con un icono de línea |
| La ficha de un curso, ruta, evento o sesión | `TarjetaContenido` (de pie o acostada) | otra tarjeta con portada |
| Subir un archivo | `AdjuntoCsv` | otra zona para soltar |
| Una fecha o un rango | `CampoFecha`, `RangoDeFechas` | un calendario armado aparte |
| El chip «Guardado», un filtro rápido, elegir varias opciones, «N cosas necesitan tu atención», una persona en una fila, una ilustración de vidrio | `ChipGuardado`, `FiltroChip`, `SelectorMultiple`, `BloqueAtencion`, `Persona`, `ImagenGlass` | copias de cada una |
| Una insignia | `Badge` de `@/shared/components/Badge`: la misma de la librería, con la letra de `xs` y `sm` subida a 10.5 px, el mínimo legible. Es temporal: se borra cuando ingeniería fije ese mínimo con una regla global (ver `/design-system/diferencias`) | el `Badge` de la librería en `xs` o `sm` (9.6 y 10 px) |
| El esqueleto mientras carga | `Skeleton`; en Selección, `useCarga` y `Esqueleto` | un spinner a pantalla completa |
| Diálogos de novedades y bienvenida | `FeatureDialog`, `ChangelogDialog`, `WelcomeDialog` | un `Dialog` desde cero |
| El buscador de comandos | `CommandPalette` (fuera del rediseño desde el 7-oct: no se suma a pantallas nuevas) | `Command` suelto |
| El centro de procesos | `ProcessCenter` | una lista de progreso a mano |
| El punto de estado de una conversación | `ChatStatusDot` | un `Badge` o un `div` redondo |
| La tarjeta de invitar a alguien | `InviteCard` | una `Card` con avatar a mano |
| Fechas, iniciales, rangos, plurales | `formato` (`fechaCorta`, `iniciales`, `plural`…) | `toLocaleDateString` suelto |
<!-- /generado:piezas -->

**Las que ya monta el marco**, y que no se repiten dentro de una pantalla: `Toaster` (hay uno
solo, en el `RootLayout`), `AppHeader`, `AppFooter`, `SidebarRail`, `UbitsLogo`, `GlobalBanner`,
los menús del header (`AccountPopover`, `ProfilePopover`, `NotificationsPopover`,
`NovedadesButton`), `LayoutSlot`, `SlotArea`, `PageAmbience`, `PageFallback`,
`PlaceholderPage`, `ThemeSwitch`, `ThemeToggle` y la ventana de feedback y el tour (`FeedbackDialog`,
`TourDialog`, `CapturaArea`), que se abren desde la barra lateral y se documentan en `/design-system/modales`.

Dónde mirar, en este orden:

1. **`src/shared/components/`** — las piezas compartidas del marco.
2. **`src/modules/design-system/`** — las piezas del sistema de diseño y sus patrones, cada una
   documentada en su pantalla (`/design-system/drawers`, `/modales`, `/data-grid`,
   `/formularios`, `/estados`…).
3. **Una pantalla parecida ya hecha**, en `src/modules/admin/` o `src/modules/portal-colaborador/`.

Estas piezas **están hechas con flux-ui**: usarlas no es saltarse la regla, es no construir la
misma cosa dos veces. Si una se queda corta, se amplía la pieza existente; no se hace una
paralela al lado.

### Si no existe: el catálogo

La fuente de verdad es **`ai-tools/flux-ui/flux-ui-para-ia.json`**: los 89 componentes de la
librería con sus subcomponentes, sus **variantes permitidas**, para qué sirve cada uno en
español y su ficha del Storybook interno
(<https://libraries-ui.dev.sandteck.com/flux-ui/index.html>). Es un archivo del repo: funciona
sin conexión y es el mismo que se comparte con el resto del equipo.

**No decidas con el MCP de `flux-ui`.** Lista 69 de los 89 componentes y su buscador no
entiende español, así que te dirá que algo no existe cuando sí existe. Sirve como apoyo para
ver props y ejemplos de un componente que ya elegiste (`get_component`,
`get_component_stories`), nada más.

Antes de decir que algo no está en la librería, compruébalo en `node_modules/@ubits/flux-ui`.

Estos aparecen en el Storybook pero **no están en la versión instalada** (0.5.5), así que no se
usan: `FileUpload`, `ActionRail`, `AnimatedIcon`, `DualDateRangePicker`, `Icon`.

Prohibido:

- Instalar otra librería de UI (MUI, Ant, Chakra, shadcn, Bootstrap, styled-components…).
- Copiar HTML/CSS de internet o de otro proyecto.
- Inventar un componente "parecido" a mano cuando flux-ui ya tiene uno.
- Dibujar con `div` o `span` algo que la librería ya resuelve.

**Si flux-ui no tiene lo que hace falta: para y avisa.** No improvises un reemplazo.
Escribe algo como: "flux-ui no tiene un componente de X; ¿lo pedimos al equipo de librería o
lo resolvemos con Y?" y espera respuesta.

### El orden, en una línea

**Pieza que ya existe en el proyecto → componente de flux-ui del catálogo → para y pregunta.**

Nunca al revés, y nunca saltándose el primer paso.

<!-- generado:reglas · sale de ai-tools/reglas/reglas.json; se cambia ahí y se corre node ai-tools/reglas/generar-reglas.mjs -->
### Las reglas que más se rompen

Cada una salió de una decisión del equipo o de una auditoría, y cada una tiene su pantalla modelo. Antes de
inventar una forma distinta, copia la del modelo.

- **Todo lo que envía (correo, recordatorio, invitación, pedido), borra, desactiva, archiva, mueve de etapa o descarta pregunta antes con DialogoConfirmar y la tarjeta RegistroConfirmar (qué se toca y a cuántos afecta).** Solo un cambio simple que se puede deshacer va directo, con notifyAction y «Deshacer». Nunca un aviso de «enviado» sin haber preguntado. Modelo: `src/modules/admin/aprendizaje/planes-de-formacion/components/detalle-plan.tsx`. _(8-oct)_
- **Dos ventanas, cada una con su trabajo:** preguntar va en DialogoConfirmar; todo lo que tiene contenido (formulario, lista para elegir, vista previa, escribir un correo, confirmar con la lista de a quiénes afecta) va en ActionDialog. El título de una ventana dice qué es la ventana y es fijo; el nombre del registro va en el cuerpo. _(6-oct)_
- **Crear y editar viven en una página (PageShell + PageHeader + PageActionBar), nunca en una ventana ni en un panel.** Hay una sola salida, BotonSalirCreacion («Salir de la creación» o «Salir de la edición») en las acciones de la cabecera: sin flecha junto al título, sin X y sin «Cancelar» en la barra. La barra lleva ChipGuardado a la izquierda y «Atrás» y seguir a la derecha. Excepción (Cristian, 9-oct): «Agregar una persona a tu base», en Mis candidatos, es una ventana (ActionDialog) con «Cancelar», como la diseñó Nicolás. Modelo: `src/modules/admin/aprendizaje/planes-de-formacion/components/formulario-plan.tsx`. _(6-oct)_
- **Salir con cambios pregunta con DialogoConfirmar en su tamaño normal:** tres salidas («Seguir editando» · «Salir sin guardar» · «Guardar y salir») si hay algo que guardar; dos («Seguir editando» · «Salir sin guardar», destructiva) si no hay borrador posible. Sin cambios, sale directo. Copia el título y los textos de la pantalla modelo; no inventes otros. Modelo: `src/modules/admin/aprendizaje/planes-de-formacion/components/formulario-plan.tsx`. _(8-oct)_
- **Un panel (DrawerShell) con algo escrito no se cierra al tocar fuera; cerrarlo con la X, Escape o «Cancelar» con cambios pregunta («Seguir editando» · «Descartar»).** Modelo: `src/modules/admin/desempeno-cultura/objetivos/crear/components/asignados/panel-asignacion.tsx`. _(8-oct)_
- **ChipGuardado dice la verdad:** «Cambios sin guardar» mientras no se haya guardado nada y «Guardado» solo cuando de verdad hay un borrador. Una ventana nunca dice «no has hecho cambios» si los hay, ni promete algo que la pantalla no deja hacer. _(8-oct)_
- **Toda tabla es TablaDatos y cabe en su marco (1.104 px con la barra lateral abierta):** reparte los anchos, apaga el cambio de ancho si no cabe y deja que la columna de texto se corte con «…» y TextoCompleto. El «⋯» de cada fila se ve siempre. _(8-oct)_
- **En toda lista para elegir (participantes, el comparativo, demográficos, asignaciones…), la casilla (Checkbox) o el círculo (RadioGroupItem) van siempre a la izquierda de la fila, antes del icono y del texto; a la derecha solo va lo de apoyo (cifras, insignias, acciones).** La fila entera elige. Homologado por Elkin el 9-oct. _(9-oct)_
- **Los avisos usan notify(título, detalle, tipo) con su tipo ('success', 'info', 'warning' o 'error').** Nada de toast.add suelto ni ToastToaster en la pantalla. _(8-oct)_
- **Lo que hizo la IA lleva el orbe (IconoIA; como insignia, EtiquetaIA), nunca estrellas ni chispas.** El primario de IA es BotonIa y la segunda acción BotonIaSecundario. El botón que abre el agente es ReopenAgentButton y se llama «Orbit Flow». Orden de una fila: «⋯» (BotonIcono) · terciario · secundario · primario · IA · Orbit Flow. _(1-oct)_
- **El ancho lo pone PageShell (nada de max-w a mano), la letra sale de Heading y Text, los colores de los tokens del tema y las insignias del Badge del proyecto (10,5 px mínimo).** className solo para layout. _(25-sep)_
- **Un «!» que fuerza a la librería solo se pone con su ficha en Design system › Marco › Ajustes propios o su entrada en ai-tools/flux-ui/diferencias.json, y un comentario que diga por qué.** Los «!» de otras personas se conservan. _(5-oct)_
- **Todo en español, también lo que solo oye el lector de pantalla.** Fechas, plurales, cifras y porcentajes salen de las utilidades de formato (formato.ts, formatoAvance), no de toLocaleString ni de funciones propias. _(8-oct)_
- **En un archivo de otra persona se cambia solo la línea exacta, sin Prettier ni reescribir bloques, y se dice en la respuesta.** La zona protegida (src/shared, src/app, src/index.css, scripts/, AGENTS.md) se toca solo con permiso. _(29-sep)_
- **El panel de lo que necesita atención (TableroAtencion, BloqueAtencion o la lista de la Super Home) vive solo en la Super Home (/admin), que reúne Selección, Aprendizaje y Cultura.** Los inicios de cada módulo (Vacantes, Créditos, Contenidos, Encuestas…) no lo llevan; lo urgente de un módulo llega a la Super Home o a las notificaciones. Modelo: `src/modules/admin/inicio/main.tsx`. _(5-oct)_
- **El pie de página (AppFooter) se muestra solo en las páginas de inicio (home) de la plataforma.** En las pantallas de creación, edición y subvistas no aparece, para no competir con la barra de acciones fija. Lo monta el marco (zona protegida): el cambio es de ingeniería. Desde el 9-oct (con permiso de Cristian) ya no sale en Selección ni en las pantallas de creación del LMS Creator; el resto sigue pendiente de ingeniería. _(5-oct)_
- **Todas las pestañas de la plataforma (TabsTrigger, incluidas las de los editores y paneles) llevan solo texto, sin ícono.** Se usa la pestaña maestra subrayada (TabsList variant="line"), sin pestañas anidadas. _(5-oct)_
- **Cuando una cabecera o una barra tiene más de dos llamados a la acción, contando al propio Orbit Flow y sin contar el «⋯» (que ya es un ícono), el botón del agente pasa a solo ícono (ReopenAgentButton con compact) para que el título y la descripción no se monten con los botones.** Sigue siendo el último de la fila. El caso que lo originó: Encuestas, con «Crear con plantilla», «Crear encuesta» y Orbit Flow. Modelo: `src/modules/admin/desempeno-cultura/encuestas/main.tsx`. _(5-oct)_
- **Cuando una cabecera o un bloque tiene dos llamados a la acción del mismo nivel, los dos van como secundarios (outline); el primario se reserva para cuando hay una sola acción principal.** Los botones de IA y Orbit Flow siguen sus propias reglas. _(1-oct)_
- **Los avisos (notify) llevan un título de una línea, de unos 60 caracteres como máximo, y un detalle opcional de una o dos líneas, de unos 120.** Lo que no cabe va a una ventana o al panel. Las cifras exactas las fija Nicolás (ver «por_decidir»). _(1-oct)_
- **El buscador global (CommandPalette, ⌘K) quedó fuera del alcance del rediseño por inviable.** No se suma a pantallas nuevas ni se amplía. Retirarlo del encabezado y del DS › Marco es un cambio de ingeniería (zona protegida). _(7-oct)_
- **En la plataforma no van secciones blancas sueltas:** cada una vive dentro de un marco gris (Frame + FramePanel), y su título y su bajada van en el gris, nunca repetidos dentro del panel blanco. Si el contenido se nombra solo (unas cifras con su etiqueta, un estado vacío, un campo con su label), el marco va sin encabezado. Modelo: `src/modules/admin/aprendizaje/certificados/descarga/main.tsx`. _(9-oct)_
- **Una lista de contenidos con portada (Contenidos del LMS Creator, Universidad corporativa, Zona de estudio) se puede ver como tabla o como tarjetas, con el cambio Tabla/Cuadrícula de los controles compartidos de Contenidos (CambioDeVista y MarcoCuadricula).** El modo tabla es siempre TablaDatos con CeldaTitulo; la cuadrícula va en el marco gris con PiePaginacion. En el portal del colaborador arranca en Cuadrícula. Las demás tablas (las de gestionar) siguen siendo solo TablaDatos. Modelo: `src/modules/admin/aprendizaje/lms-creator/contenidos/main.tsx`. _(9-oct)_
- **Lo que se pide dentro de un panel lateral (confirmar, escribir un correo, mover, abrir otro detalle) se abre en el mismo panel:** su contenido cambia por el de la ventana y arriba queda «← título del panel» para volver. Nada de otra ventana ni otro panel encima. DrawerShell, VentanaDeAccion y DialogoConfirmar lo hacen solos con DrawerAnidado; no hay que armarlo en cada pantalla. Modelo: `src/modules/design-system/drawers/components/drawer-anidado.tsx`. _(9-oct)_
- **Todo lo que carga o guarda tiene su error.** Si no se guarda, nada cambia: el aviso rojo dice «No pudimos …» y una línea con la consecuencia («Sigue en …», «No salió ningún correo»), y trae «Reintentar», que repite lo mismo y cierra ese aviso. Si la acción venía de una ventana con datos escritos, la ventana se queda abierta con lo escrito. Un bloque que no carga muestra su error en el sitio, con la ilustración glass-danger y «Reintentar». Se prueba con ?simular=error y ?simular=falla-guardar. Modelo: `src/modules/design-system/estados/carga.tsx`. _(9-oct)_
- **Ninguna pantalla lleva atajos de demostración a la vista («Probar con archivos de ejemplo», «Usar uno de ejemplo») ni textos de maqueta («en el playground…», «sonaría…»).** Cada control se comporta como en el producto. Los estados raros se enseñan con los simuladores de la dirección (?simular=, ?como=), que no se ven. Modelo: `src/modules/admin/seleccion/propuestas/simular.ts`. _(9-oct)_
- **Los estados vacíos y los de error van con los iconos glass del design system, no con un icono de línea de Hugeicons:** PrimeraVez cuando todavía no hay nada, SinResultados cuando la búsqueda o los filtros lo dejan todo fuera, y la ilustración glass-danger con «Reintentar» cuando algo no cargó. Nada de un Empty armado a mano. Modelo: `src/modules/admin/desempeno-cultura/objetivos/crear/components/asignados/lista-roster.tsx`. _(9-oct)_
- **Una regla nueva o cambiada se escribe primero en ai-tools/reglas/reglas.json (con fecha y, si reemplaza otra, cuál), se regenera con node ai-tools/reglas/generar-reglas.mjs y se barren todos sus usos con Grep en src/ y en los documentos el mismo día.** Lo que no se pueda barrer ese día va a «por_decidir» (o a la ficha del dueño) con quién lo resuelve. _(8-oct)_
<!-- /generado:reglas -->

<!-- generado:retiradas · sale de ai-tools/reglas/reglas.json; se cambia ahí y se corre node ai-tools/reglas/generar-reglas.mjs -->
### Piezas retiradas: no vuelven

Si unes una rama o copias de una pantalla vieja y aparece una de estas, se cambia por su sustituta antes del commit.

| Retirada | Desde | Usa en su lugar |
| --- | --- | --- |
| ConfiguredModal | 5-oct | DialogoConfirmar para preguntar; ActionDialog para todo lo demás |
| MarcoTabla | 5-oct | TablaDatos |
| AiButton | 5-oct | BotonIa |
| BotonIaPrimario | 5-oct | BotonIa |
| DataGridList directo en una pantalla | 5-oct | TablaDatos (con CeldaTitulo y PiePaginacion) |
| ToastToaster en una pantalla | 30-sep | notify (el Toaster ya está en el RootLayout) |
| toast.add suelto | 8-oct | notify(título, detalle, tipo): ya recibe el tipo |
| Sheet directo | 29-sep | DrawerShell |
| Estrellas, chispas o varitas para marcar IA | 23-sep | IconoIA (el orbe) o EtiquetaIA |
| Badge de la librería en xs o sm | 25-sep | Badge de @/shared/components/Badge (10,5 px mínimo) |
| «Agente IA» como nombre del botón del agente | 1-oct | ReopenAgentButton, que dice «Orbit Flow» |
| Flecha junto al título, X o «Cancelar» para salir de una creación | 6-oct | BotonSalirCreacion |
| vacantes/detalle/components/compartir-vacante | 8-oct | DialogoCompartirVacante |
<!-- /generado:retiradas -->

<!-- generado:por-decidir · sale de ai-tools/reglas/reglas.json; se cambia ahí y se corre node ai-tools/reglas/generar-reglas.mjs -->
### Por decidir: pregunta, no elijas

Estas preguntas siguen abiertas. Si tu pantalla depende de una, pregunta en vez de elegir por tu cuenta.

- **H-180:** La asignación de objetivos: ¿panel lateral (excepción documentada) o vista dentro del paso? Decide: Cristian con Elkin.
- **H-249:** Sacar a alguien de un proceso: ¿«Rechazar» o «Descartar», y una sola ventana? Decide: Nicolás.
- **titulo-salida:** El título de la ventana de salida: «¿Salir sin guardar los cambios?», «¿Salir de la creación?» o «¿Salir sin guardar?» (hoy conviven los tres) Decide: Cristian.
- **guardar-sin-borrador:** «Guardar y salir» y el chip «Guardado» en pantallas que no tienen borrador real (carga masiva, Crear usuario, Crear tarea, Agregar persona) Decide: Cristian.
- **vocabulario:** Añadir o Agregar, Crear o Nuevo, «40 %» o «40%», «sept» o «sep» Decide: diseño.
- **avisos-largo:** Los límites exactos de título y detalle de los avisos (la regla usa unos 60 y 120 caracteres como provisional). Decide: Nicolás.
- **atencion-modulos:** ¿Se quita ya el panel de atención de Vacantes, Créditos, Contenidos, Encuestas y el inicio de Selección, o se integra con las notificaciones? Decide: Carlos con Nicolás y Elkin.
- **paginador-cuadricula:** La cuadrícula de contenidos pagina de a 10, 20 o 50 (lo que deja PiePaginacion) y la última fila de tres puede quedar con una tarjeta suelta; antes iba de a 12, 24 o 48. ¿Se amplía PiePaginacion o se queda así? Decide: Cristian.
- **vacantes-asidero:** En la tabla de Vacantes no caben 8 columnas con asidero y cambio de ancho en 1.104 px: se apagaron para que el nombre no quede en 150 px. ¿Se acepta o se quita una columna? Decide: Cristian con Nicolás.
- **reintentar-con-id:** El aviso de error con «Reintentar» de Selección sigue usando toast.add porque notifyAction no devuelve el id del aviso para cerrarlo. Que notifyAction lo devuelva (src/shared/components/notify.ts, zona protegida). Decide: ingeniería.
<!-- /generado:por-decidir -->

### No sobrescribir la apariencia de los componentes

Los componentes de flux-ui deben verse **exactamente como los define la librería**: colores,
bordes, sombras y estados de foco, hover o disabled.

Prohibido:

- Reglas CSS globales que afecten `:focus`, `:hover`, `outline`, `ring` o la apariencia visual
  de inputs, botones, menús y demás piezas de flux-ui.
- Clases en `className` que cambien la apariencia base del componente (colores, bordes, anillos
  de foco…). Usa `className` solo para **layout**: ancho, márgenes, truncado, visibilidad.

Si algo se ve mal, **no lo parches con CSS**: revisa si hay un override en el proyecto o
repórtalo al equipo de librería.

## 2. Iconos: solo Hugeicons

El icono es **dato, no componente**: siempre va dentro de `<HugeiconsIcon icon={...} />`.
Nunca se escribe `<Delete02Icon />`.

```tsx
import { HugeiconsIcon } from '@hugeicons/react'
import { Delete02Icon } from '@hugeicons/core-free-icons'

<HugeiconsIcon icon={Delete02Icon} size={20} />
```

Los nombres salen de `@hugeicons/core-free-icons`. Si el MCP responde, `search_icons` acepta
conceptos en español ("borrar", "editar", "calendario") y `get_icon` devuelve el import exacto;
si no responde, el nombre se busca directo en el paquete.

Prohibido: `lucide-react` (ya no está instalado), `react-icons`, `@heroicons`, SVG pegados a
mano o iconos copiados de Figma. `npm run check` los rechaza.

**Única excepción, aprobada por UX:** los 50 **iconos Glass** de `public/iconos-glass/`, que se
usan como imágenes mientras la librería no los publique. Son **ilustraciones pequeñas**
(tarjetas de atajos, indicadores, estados vacíos, promociones), no iconos de interfaz: los de
interfaz siguen siendo Hugeicons. El catálogo está en `public/iconos-glass/catalogo.json` y se
ve en **Design system › Icons** (`/design-system/icons`); las instrucciones, en
`public/iconos-glass/LEEME.md`.

## 3. Colores y tipografía: solo tokens del tema

El tema vive en `src/index.css`. En las pantallas se usan **únicamente** las clases que apuntan
a esos tokens:

- Fondos: `bg-background`, `bg-card`, `bg-muted`, `bg-primary`, `bg-secondary`, `bg-accent`, `bg-destructive`
- Texto: `text-foreground`, `text-muted-foreground`, `text-primary`, `text-primary-foreground`
- Bordes: `border-border`, `border-input`, `ring-ring`
- Estado: `bg-success`, `bg-warning`, `bg-info`

Prohibido en `src/modules/**`:

- Colores literales: `#3b82f6`, `rgb(...)`, `oklch(...)`.
- Paleta cruda de Tailwind: `bg-blue-500`, `text-slate-700`, `border-zinc-200`…
- Fuentes o tamaños de fuente hardcodeados.

Así el modo claro/oscuro y los cambios de marca funcionan solos.

**La tipografía sale del tema, siempre**: los textos van en `Heading` y `Text` de la librería,
también dentro de piezas que trajo otra persona. Nada de `text-2xl font-bold` a mano.

**El ancho lo pone `PageShell`, no tú.** El de diseño es 1.140 px (`default`), y hay tres más
para casos concretos: `narrow` 720 px (formularios y pasos), `wide` 1.600 px (tableros densos)
y `full` (paneles divididos). Salen de `PAGE_WIDTH`: nunca pongas un `max-w` a mano.

## 4. Zona de trabajo: tu pantalla y nada más

**Puedes crear y editar libremente:**

```
src/modules/<modulo>/<pantalla>/
```

**No toques sin hablar con ingeniería:**

| Archivo | Qué es |
| --- | --- |
| `src/app/` | Router y registro de módulos |
| `src/shared/` | El marco general: barra lateral, encabezado, menús, buscador y piezas compartidas |
| `src/index.css` | Tema y tokens |
| `package.json`, `vite.config.ts`, `tsconfig*.json` | Configuración del proyecto |
| `scripts/` | Arranque y validaciones |
| `AGENTS.md` | Este archivo |

`src/shared/` entero es zona protegida, aunque `npm run check` solo vigile de ahí
`layouts/RootLayout.tsx`, `layouts/RootLayout.module.css`, `layouts/AppSidebar.tsx` y
`components/LayoutSlot.tsx`. Que el check no avise no quiere decir que se pueda tocar.

Única excepción: `src/shared/layouts/nav-config.ts`, que sí se edita para sumar una pantalla
al menú (ver paso 3 de la receta).

## 5. Receta para una pantalla nueva

**Paso 1 — crear el archivo.** La pantalla vive en `src/modules/<modulo>/<pantalla>/main.tsx`
y exporta un `Component`:

```tsx
// src/modules/talent/portal/main.tsx
export function Component() {
  return <div className="flex flex-col gap-4">{/* aquí la maqueta con flux-ui */}</div>
}

Component.displayName = 'TalentPortalPage'
```

Si todavía no vas a maquetar, deja el placeholder que ya usa el repo:

```tsx
import { createPage } from '@/shared/pages/createPage'

export const { Component } = createPage('Portal Colaborador', '/portal', 'TalentPortalPage')
```

**Paso 2 — registrar la ruta** en el `routes.ts` del módulo:

```ts
{
  path: 'portal',
  lazy: () => import('./portal/main'),
}
```

Si el módulo no existe todavía, se crea `src/modules/<modulo>/routes.ts` exportando un
`AppModule` y se suma al array de `src/app/register-modules.ts`.

**Paso 3 — sumarla al menú** (solo si debe aparecer en la barra lateral), en
`src/shared/layouts/nav-config.ts`, dentro de la sección que corresponda:

```ts
{ title: 'Portal Colaborador', path: '/portal' },
```

**Paso 4 — maquetar** eligiendo cada pieza en el catálogo (reglas 1, 2 y 3).

**Paso 5 — validar** con `npm run check`.

## 6. Cerrar siempre con `npm run check`

Antes de decir que algo está listo, corre:

```bash
npm run check
```

Valida librerías, colores, scaffolding, lint y tipos. **Si falla, arréglalo.** No entregues
trabajo con el check en rojo ni desactives validaciones para que pase.

**Si borraste archivos, cierra además con `npm run build`.** El check no mira las imágenes ni
los recursos importados: un PNG borrado que alguien todavía importa solo falla al compilar.

## 7. El repo es compartido

Aquí trabaja más gente, y casi nunca sobre archivos propios.

- **No pases Prettier ni formateadores sobre archivos ajenos.** Reformatean el archivo entero y
  el cambio real se pierde entre el ruido. Aplica los cambios a mano.
- **Los estilos que trajo otra persona se respetan** aunque no sean como los harías tú. Lo que
  se fuerza se documenta en el sistema de diseño, en **Marco › Ajustes propios**.
- **Si tocaste la zona protegida o un archivo de otra persona, dilo explícitamente** en tu
  respuesta, sin esperar a que pregunten.
- **Antes de subir o publicar, pregunta.** Commit y push a la rama es una cosa; publicar en
  Vercel deja el trabajo a la vista de cualquiera con el enlace, y es otra.

## 8. Cómo hablarle al equipo

Responde **en español y sin jerga técnica**. Quien lee es diseño: describe lo que se ve en
pantalla y en qué ruta, no la implementación. Si necesitas una decisión, pregunta con opciones
concretas en vez de asumir.

---

## Configurar tu IDE

| Herramienta | Reglas que lee | MCP de flux-ui |
| --- | --- | --- |
| Cursor | `AGENTS.md` (nativo) | `.cursor/mcp.json` |
| Claude Code | `CLAUDE.md` + este archivo | `.mcp.json` (symlink a `.cursor/mcp.json`) |
| Gemini CLI | `GEMINI.md` (symlink a este archivo) | `.gemini/settings.json` |
| Codex | `AGENTS.md` (nativo) | configuración global, ver abajo |

`GEMINI.md` es un symlink a este archivo, y `.mcp.json` y `.gemini/settings.json` apuntan a
`.cursor/mcp.json`. No hay que copiar nada.

`CLAUDE.md` **no** es un symlink: es un archivo propio con el mapa del repo, las skills y las
trampas conocidas. Las reglas obligatorias no las repite, las toma de aquí. Si cambias una
regla de este archivo, mira si `CLAUDE.md` la menciona.

Codex es el único que no lee configuración de MCP por proyecto. Una sola vez, agrega esto a
`~/.codex/config.toml`:

```toml
[mcp_servers.flux-ui]
command = "npx"
args = ["-y", "@ubits/flux-ui@latest", "flux-mcp"]
```

Si el MCP no responde, casi siempre es que caducó el acceso a la librería interna (dura ~12 h):
corre `npm run aws-login` y reinicia el IDE. Mientras tanto se puede seguir trabajando: para
elegir componentes manda `ai-tools/flux-ui/flux-ui-para-ia.json`, que no necesita conexión.

## Los procedimientos empaquetados

En `ai-tools/skills/` hay seis procedimientos que el asistente carga solo cuando hacen falta:
elegir componentes del Storybook, traer un bloque de ReUI y cambiarlo por piezas nuestras,
mantener el sistema de diseño al día, revisar una pantalla contra ReUI, capturar pantallas y
publicar en Vercel. `.claude/skills` es un symlink a esa misma carpeta, así que se editan en un
solo lugar. Cuándo entra cada uno está en `CLAUDE.md`.
