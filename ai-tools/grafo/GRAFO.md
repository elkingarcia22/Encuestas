# Grafo del Playground UX

> Generado el 2026-10-22 por `ai-tools/grafo/generar-grafo.mjs` (no se edita a mano). El grafo completo está en `ai-tools/grafo/grafo.json` y se explora en `/design-system/grafo`.

## Cómo leerlo

- **Antes de armar algo**, busca la pieza del equipo (tabla de abajo): se usa antes que el componente de flux suelto. Si tiene ficha, la ficha dice qué cambió y cuándo usarla.
- **Para copiar cómo se resolvió algo**, busca una pantalla que use la misma pieza.
- **Para el contexto del producto**, sigue `implementa` desde una pantalla hasta su historia de usuario y de ahí al resto del producto real.
- En el JSON: `nodos` (`id`, `tipo`, `nombre`, `descripcion`, `ruta`, `archivo`) y `aristas` (`de`, `a`, `relacion`).
- **Por archivo** (dueño, quién lo importa, piezas y reglas que le tocan, retiradas que usa): `ai-tools/grafo/indice-archivos.json`, una entrada por ruta de `src/`.

## Totales (2656 nodos, 13614 aristas)

| Tipo | Qué es | Cuántos |
| --- | --- | ---: |
| `componente-flux` | Componente de la librería (@ubits/flux-ui), tal cual | 89 |
| `pieza` | Pieza del equipo hecha con flux: se usa antes que el componente suelto | 56 |
| `ficha` | Lo que se customizó de una pieza frente a la librería, con el porqué | 71 |
| `regla-global` | Ajuste que cambia toda la librería (no una pieza) | 9 |
| `pantalla` | Pantalla del producto maquetada en el playground (/admin, /portal-colaborador) | 74 |
| `plantilla` | Pantalla completa de referencia en el design system (/design-system/templates) | 39 |
| `pagina-ds` | Página de documentación del design system | 48 |
| `trampa` | Trampa conocida de un componente de flux (cómo no romperlo) | 41 |
| `diferencia` | Lo que el playground hace distinto de flux y se le pide a la librería | 145 |
| `historia` | Historia de usuario del producto real (HU-XXX-000) | 42 |
| `producto` | Concepto, pantalla o regla del producto real (docs/plataforma-ubits) | 302 |
| `producto-documento` | Documento de docs/plataforma-ubits | 18 |
| `archivo` | Archivo de código de src/ (con su dueño, y huerfano: true si nadie lo importa ni lo muestra una ruta) | 1221 |
| `ruta` | Dirección de la aplicación (router) y el archivo que carga | 218 |
| `regla` | Regla del equipo (ai-tools/reglas/reglas.json), enlazada a las piezas que rige | 62 |
| `retirada` | Pieza o patrón retirado: los archivos que todavía lo usan cuelgan de aquí con usa_retirada | 19 |
| `skill` | Skill de ai-tools/skills (SKILL.md) | 6 |
| `hook` | Hook de ai-tools/hooks | 6 |
| `script` | Script de scripts/ | 1 |
| `documento` | Documento: AGENTS.md, CLAUDE.md o un .md de docs/ (sus citas rotas se marcan) | 184 |
| `archivo-perdido` | Archivo que un documento nombra y ya no existe | 5 |

## Relaciones

- `usa`: una pantalla (o pieza) importa ese componente o pieza.
- `hecha con`: una pieza o ficha está construida con ese componente de flux.
- `tiene ficha`: la pieza tiene documentado qué se customizó.
- `parte de`: una pantalla cuelga de otra.
- `implementa`: la pantalla cita esa historia de usuario.
- `sobre`: una trampa o diferencia afecta a ese componente de flux.
- `importa`: un archivo de `src/` importa a otro. `define`: la pantalla o pieza vive en ese archivo. `exporta`: el archivo exporta esa pieza.
- `muestra`: una ruta de la aplicación carga esa pantalla o archivo. `rige`: una regla del equipo afecta a esa pieza. `reemplazada por`: una retirada se sustituye por esa pieza.
- `usa_retirada`: el archivo todavía usa algo retirado (con las líneas). `cita`: un documento nombra una ruta de `src/` o una pieza (`rota: true` si la ruta ya no existe).
- El resto (`navega a`, `especifica`, `regula`…) viene del grafo del producto real.

## Piezas del equipo, de más a menos usada

| Pieza | Código | Para qué | Pantallas que la usan | Ficha |
| --- | --- | --- | ---: | --- |
| Marco de página | `PageShell` | El marco de una página: ancho, título, migas, cabecera, secciones y barra de acciones | 35 | `ficha:pieza-pageshell` |
| Insignia del proyecto | `Badge` | Una insignia de estado | 34 | `ficha:insignias` |
| Aviso | `notify` | Un aviso | 31 | `ficha:avisos` |
| Botón de solo icono | `BotonIcono` | Botón terciario de solo icono | 28 | `ficha:boton-icono` |
| Centro de procesos | `ProcessCenter` | El centro de procesos | 22 | `ficha:pieza-process-center` |
| Tabla de datos | `TablaDatos` | Una tabla o un listado, con o sin paginación | 20 | `ficha:pieza-tabla-datos` |
| Ayuda en globo | `Hint` | Una ayuda contextual | 20 | `ficha:vacantes-ayuda` |
| DrawerShell. | `DrawerShell.` | Un panel lateral | 19 | — |
| Ventana de confirmar | `DialogoConfirmar` | Preguntar antes de hacer algo: eliminar, salir sin guardar, activar, descartar, enviar (también cuando afecta a muchas personas o muestra lo que se pierde) | 18 | `ficha:confirmar` |
| Cifras de un tablero | `Indicadores` | Las cifras de un tablero | 17 | `ficha:pieza-indicadores` |
| Ventana con contenido | `ActionDialog` | Una ventana con contenido para trabajar: formulario corto, lista para elegir o editar, vista previa, detalle, ajustes | 15 | `ficha:dialogos` |
| Marca de IA (orbe e insignia) | `IconoIA` | Marcar lo que hizo la IA (pestaña, título, ítem, etiqueta) | 15 | `ficha:pieza-icono-ia` |
| Estado «Razonando» | `AiThinking` | El estado «Razonando» | 13 | `ficha:pieza-ai-thinking` |
| Agente contextual (Orbit) | `AgentStage` | El agente contextual: panel, hilo, burbujas, propuestas y sugerencias | 13 | `ficha:rotulos-agente` |
| Ilustración Glass | `ImagenGlass` | Una ilustración de vidrio (Glass) en una tarjeta, un vacío o un atajo | 13 | `ficha:pieza-imagen-glass` |
| Texto que se corta | `TextoCompleto` | Un texto que se corta y debe poder leerse entero | 12 | `ficha:pieza-texto-completo` |
| Botones de IA | `BotonIa` | Botones de IA | 12 | `ficha:ia` |
| Ventana de salir de una creación | `BotonSalirCreacion` | La única salida de una creación o edición y su ventana (modal) «¿Salir de la creación?»: la ventana de salir de una creación (asistente, editor, formulario de alta) | 12 | — |
| Chip de guardado | `ChipGuardado` | El chip «Guardado / Guardando» de un formulario o asistente | 11 | `ficha:save-indicator` |
| Tarjeta de lo que se toca | `RegistroConfirmar` | La tarjeta de lo que se toca dentro de una confirmación (nombre, detalle e insignia de estado) | 10 | — |
| BotonCancelarPanel | `BotonCancelarPanel` | El «Cancelar» de un panel lateral con datos | 9 | — |
| Orbe del agente | `Orb` | El orbe del agente (de 16 a 180 px) | 8 | `ficha:pieza-orb` |
| Persona en una celda | `Persona` | Una persona en una celda de tabla (avatar con iniciales, nombre y detalle) | 8 | `ficha:pieza-persona` |
| Cargador de archivos | `AdjuntoCsv` | Subir un archivo (CSV, PDF, imagen, video) con su avance y su error | 7 | `ficha:file-upload` |
| PantallaCompleta | `PantallaCompleta` | Ver algo a pantalla completa (un tablero, un mapa de calor, una vista previa) y el botón que la abre | 6 | — |
| Tarjeta de contenido | `TarjetaContenido` | La tarjeta de un contenido de aprendizaje | 6 | `ficha:tarjeta-contenido` |
| Gráficos de tablero | `GraficoArea` | Un gráfico de tablero | 6 | `ficha:encuestas-graficos` |
| BarraPasos | `BarraPasos` | La barra fija de un asistente por pasos: guardado, «Atrás» desde el paso 2 y «Continuar» | 5 | — |
| Lista para elegir | `ListaElegible` | Elegir personas o grupos de una lista larga dentro de un contenedor (participantes, destinatarios) | 4 | `ficha:pieza-lista-elegible` |
| Chip de filtro rápido | `FiltroChip` | Un chip de filtro rápido con su «x» para quitarlo | 4 | `ficha:pieza-filtro-chip` |
| EncabezadoOrdenable | `EncabezadoOrdenable` | Las partes de una tabla que TablaDatos no trae: ordenar desde el encabezado de una tabla de resultados, las carpetas de la fila, anterior y siguiente en el panel, que toda la fila abra | 4 | — |
| Botón de cerrar | `CloseButton` | Cerrar una ventana o panel | 3 | `ficha:cerrar` |
| Edición en línea | `EdicionEnLinea` | Renombrar algo en el sitio, sin abrir un modal | 3 | `ficha:edicion-en-linea` |
| Franja «N cosas necesitan tu atención» | `BloqueAtencion` | La franja plegable «N cosas necesitan tu atención» encima de una lista | 3 | `ficha:vacantes-alertas` |
| Esqueletos y espera | `useCarga` | Esqueletos y espera simulada en Selección | 3 | `ficha:pieza-carga` |
| Bloque con título | `Marco` | Un bloque con título dentro de una ficha o un detalle: título, bajada, una acción arriba a la derecha y sus paneles blancos adentro | 3 | `ficha:pieza-marco` |
| Lista de dato y valor | `Filas` | Una lista de dato y valor en el resumen de una ficha | 3 | `ficha:pieza-filas` |
| Selector múltiple | `SelectorMultiple` | Elegir varias opciones con buscador (fichas) | 3 | `ficha:pieza-selector-multiple` |
| Ventana para compartir una vacante | `DialogoCompartirVacante` | Compartir una vacante (enlace para candidatos y acceso del equipo) | 3 | — |
| Novedades y bienvenida | `FeatureDialog` | Diálogos de novedades, cambios y bienvenida | 2 | `ficha:dialogos` |
| Tablero «Lo que necesita tu atención» | `TableroAtencion` | Lo que necesita tu atención (asuntos por resolver, arriba de una pantalla) | 2 | `ficha:pieza-tablero-atencion` |
| Eliminar escribiendo la palabra | `ConfirmarEliminar` | Confirmar un borrado escribiendo la palabra | 2 | `ficha:confirmar` |
| Pantalla de error | `PantallaDeError` | Una pantalla de error del sistema (sin conexión, licencia, servidor) | 2 | `ficha:pieza-pantalla-error` |
| Ventana para escribir un correo | `DialogoEscribir` | Escribirle un correo a una o varias personas de un proceso (plantilla y mensaje) | 2 | — |
| PasosFila | `PasosFila` | La fila de pasos de un asistente (Paso 1 de 5 con los nombres) | 2 | — |
| Mover de etapa | `pedirMover` | Mover a una persona de etapa en un proceso de selección | 1 | — |
| useSubpaginaEnUrl | `useSubpaginaEnUrl` | Un asistente que se abre desde otra creación como página propia (Agregar asignación, asignación de Objetivos) | 1 | — |
| Tarjeta de IA | `AiCard` | Invitar a que la IA haga el trabajo, dentro de una pantalla normal | 0 | `ficha:pieza-ai-card` |
| las | `las` | Poner el color de la IA de fondo en una pieza (tarjeta, panel, caja de escribir) | 0 | — |
| Tarjeta de incidencia del agente | `issue-card` | Una tarjeta de incidencia en una revisión del agente | 0 | `ficha:pieza-issue-card` |
| CommandPalette. | `CommandPalette.` | El buscador de comandos | 0 | — |
| Punto de estado del chat | `ChatStatusDot` | El punto de estado de una conversación de Suite AI | 0 | `ficha:pensando` |
| Tarjeta de invitar | `InviteCard` | La tarjeta de invitar a otra persona | 0 | `ficha:invitacion` |
| Estados vacíos | `PrimeraVez` | Un estado vacío o de error | 0 | `ficha:pieza-primera-vez` |
| Pantalla que viene en camino | `PantallaProximamente` | Una pantalla que todavía no está maquetada (sale en el menú con «Próximamente») | 0 | — |
| DialogoSalir | `DialogoSalir` | Preguntar al salir de una creación, una edición o un panel con cambios | 0 | — |

## Componentes de flux más usados en pantallas

| Componente | Pantallas | Trampas |
| --- | ---: | ---: |
| Button | 40 | 2 |
| Text | 38 | 1 |
| Frame | 32 | 4 |
| Item | 29 | 1 |
| Heading | 27 | 1 |
| Field | 26 | 1 |
| Alert | 24 | 1 |
| Progress | 24 | 1 |
| DropdownMenu | 23 | 4 |
| Tabs | 23 | 1 |
| Select | 21 | 1 |
| IconTile | 20 | 0 |
| Input | 19 | 2 |
| Separator | 19 | 0 |
| Badge | 16 | 1 |
| RadioGroup | 16 | 0 |
| Textarea | 16 | 0 |
| Switch | 15 | 0 |
| Card | 14 | 3 |
| InputGroup | 14 | 0 |
| Tooltip | 14 | 1 |
| Avatar | 12 | 2 |
| Checkbox | 12 | 1 |
| Empty | 11 | 0 |
| ToggleGroup | 11 | 0 |
| Accordion | 10 | 0 |
| Popover | 9 | 3 |
| Table | 8 | 0 |
| Spinner | 7 | 0 |
| Stepper | 7 | 0 |

Sin usar en ninguna pantalla: ActionDropdown, AlertDialog, Autocomplete, Cascader, CodeBlock, ContextMenu, DataGrid, DateSelector, Dialog, Direction, EventCalendar, Filters, Gantt, IconStack, InputOtp, Kbd, Menubar, MultiSelect, NativeSelect, NavigationMenu, PhoneInput, Resizable, Scrollspy, Sheet, Sonner, ThemeProvider, Tree.

## Pantallas del producto

| Ruta | Nombre | Piezas del equipo | Historias |
| --- | --- | --- | --- |
| `/admin/aprendizaje` | Aprendizaje | notify, AgentStage, ActionDialog, ChipGuardado, PageShell, BotonSalirCreacion, PasosFila, useSubpaginaEnUrl, BarraPasos, Badge, BotonIcono, ProcessCenter, Persona, DrawerShell., DialogoConfirmar, Marco, DialogoEscribir, RegistroConfirmar, TablaDatos, BloqueAtencion, TextoCompleto, ConfirmarEliminar, PantallaDeError, ImagenGlass, TarjetaContenido, BotonCancelarPanel, AdjuntoCsv, EdicionEnLinea, ListaElegible, Filas, Hint | HU-LMS-005, HU-LMS-006, HU-LMS-009, HU-LMS-015, HU-LMS-016, HU-LMS-021, HU-LMS-022 |
| `/admin/aprendizaje/certificados/configuracion` | Configuración | — | — |
| `/admin/aprendizaje/certificados/correo` | Correo | Badge, PageShell, PantallaCompleta | HU-LMS-007 |
| `/admin/aprendizaje/certificados/descarga` | Descarga | ActionDialog, Badge, PageShell | HU-LMS-007 |
| `/admin/aprendizaje/diagnostico` | Diagnóstico | BotonSalirCreacion, notify, PageShell, ChipGuardado, BarraPasos, ActionDialog, Badge, DrawerShell., TablaDatos, BotonIcono, DialogoConfirmar, RegistroConfirmar, TextoCompleto, ProcessCenter | — |
| `/admin/aprendizaje/diagnostico/crear` | Crear assessment | — | — |
| `/admin/aprendizaje/lms-creator` | LMS Creator | notify, Hint, Badge, IconoIA, ImagenGlass, BotonIcono, AgentStage, Orb, CloseButton, ActionDialog | HU-LMS-001, HU-LMS-002, HU-LMS-004, HU-LMS-011, HU-LMS-019 |
| `/admin/aprendizaje/lms-creator/agregar-asistencia` | Agregar asistencia | PageShell, BotonSalirCreacion | — |
| `/admin/aprendizaje/lms-creator/agregar-presentacion-interactiva` | Agregar presentacion interactiva | AdjuntoCsv, Badge, BotonIa, AgentStage, ActionDialog, AiThinking, ImagenGlass | — |
| `/admin/aprendizaje/lms-creator/agregar-presentacion-interactiva/editor` | Editor | BotonIa, AiThinking, ChipGuardado, BotonIcono, Hint, notify, DialogoConfirmar, RegistroConfirmar, BotonSalirCreacion, EdicionEnLinea, PageShell | — |
| `/admin/aprendizaje/lms-creator/agregar-roleplay` | Agregar roleplay | ChipGuardado, BotonSalirCreacion | — |
| `/admin/aprendizaje/lms-creator/agregar-roleplay-mvp` | Agregar roleplay mvp | Badge, BotonIcono, Hint | — |
| `/admin/aprendizaje/lms-creator/agregar-video` | Agregar video | — | HU-LMS-001 |
| `/admin/aprendizaje/lms-creator/agregar-video/editor` | Editor | — | HU-LMS-001 |
| `/admin/aprendizaje/lms-creator/categorias` | Categorías | — | — |
| `/admin/aprendizaje/lms-creator/contenidos` | Contenidos | Badge, ActionDialog, TablaDatos, BotonIcono, TarjetaContenido, notify, PageShell, ImagenGlass, ProcessCenter | — |
| `/admin/aprendizaje/lms-creator/crear-contenido` | Crear contenido | ProcessCenter, Badge, DialogoConfirmar, ActionDialog, Hint, ImagenGlass, IconoIA, BotonIcono, RegistroConfirmar, ChipGuardado, notify, PageShell, BotonSalirCreacion, BarraPasos, BotonIa, AiThinking, BotonCancelarPanel, DrawerShell., CloseButton, AgentStage, AdjuntoCsv, PantallaCompleta, Marco, TarjetaContenido, TablaDatos, Orb, EdicionEnLinea | HU-LMS-001, HU-LMS-010, HU-LMS-013, HU-LMS-014, HU-LMS-019, HU-LMS-020 |
| `/admin/aprendizaje/lms-creator/crear-evento` | Crear evento | — | HU-LMS-020 |
| `/admin/aprendizaje/lms-creator/crear-ruta` | Crear ruta | — | HU-LMS-013, HU-LMS-014 |
| `/admin/aprendizaje/lms-creator/lab-modal-video` | Lab modal video | Badge, PageShell | — |
| `/admin/aprendizaje/lms-creator/lms-ai` | LMS AI | — | — |
| `/admin/aprendizaje/lms-creator/resultados` | Resultados | Badge, Indicadores, TablaDatos, notify, PageShell, ProcessCenter, DrawerShell., ActionDialog, Hint, TextoCompleto, BotonIcono, AiThinking, BloqueAtencion | — |
| `/admin/aprendizaje/lms-creator/universidad-corporativa` | Universidad corporativa | — | — |
| `/admin/aprendizaje/lms-creator/vista-colaborador` | Vista colaborador | Badge, Hint, notify, ActionDialog, BotonIcono, ImagenGlass, ProcessCenter, TarjetaContenido | HU-APR-009, HU-LMS-025 |
| `/admin/aprendizaje/metricas` | Métricas | — | — |
| `/admin/aprendizaje/planes-de-formacion/grupos` | Grupos | — | — |
| `/admin/aprendizaje/planes-de-formacion/grupos/formulario` | Formulario | — | — |
| `/admin/aprendizaje/planes-de-formacion/planes` | Planes | — | — |
| `/admin/aprendizaje/planes-de-formacion/planes/crear` | Crear | — | — |
| `/admin/aprendizaje/planes-de-formacion/planes/detalle` | Detalle | — | — |
| `/admin/aprendizaje/reportes` | Reportes | — | — |
| `/admin/avisos-internos` | Avisos internos | Indicadores, Badge, DrawerShell., ActionDialog, BotonIcono, notify, TablaDatos, DialogoConfirmar, Persona, TextoCompleto, PageShell, ProcessCenter | — |
| `/admin/avisos-internos/crear` | Nuevo aviso | Badge, notify, PageShell, ChipGuardado, AdjuntoCsv, BotonSalirCreacion | — |
| `/admin/configuracion/datos-empresa` | Datos de empresa | Badge, Indicadores, PageShell | — |
| `/admin/configuracion/personalizacion` | Personalización | notify, PageShell, DialogoConfirmar, RegistroConfirmar, BotonSalirCreacion | — |
| `/admin/desempeno-cultura` | Desempeño y cultura | — | — |
| `/admin/desempeno-cultura/encuestas` | Encuestas | AgentStage, Badge, DialogoConfirmar, AiThinking, DrawerShell., BotonIcono, Indicadores, TextoCompleto, notify, AdjuntoCsv, ProcessCenter, TablaDatos, Hint, BotonCancelarPanel, ImagenGlass, GraficoArea, BotonIa, PantallaCompleta, PageShell, Filas | — |
| `/admin/desempeno-cultura/encuestas/comparativo` | Comparativo | Badge, ProcessCenter, DrawerShell., IconoIA, GraficoArea, Indicadores, BotonIcono, Hint, AiThinking, TablaDatos, notify, PageShell | — |
| `/admin/desempeno-cultura/encuestas/crear` | Crear | DialogoConfirmar, AgentStage, notify, Hint, DrawerShell., BotonCancelarPanel, BotonIcono, TextoCompleto, Badge, TablaDatos, ListaElegible, Persona, EncabezadoOrdenable, AiThinking, AdjuntoCsv, BotonIa, ProcessCenter, IconoIA, ImagenGlass, BotonSalirCreacion, PageShell, ChipGuardado, BarraPasos | — |
| `/admin/desempeno-cultura/encuestas/resultados` | Resultados | Badge, BotonCancelarPanel, DrawerShell., IconoIA, TextoCompleto, Hint, BotonIcono, ProcessCenter, TablaDatos, ListaElegible, notify, DialogoConfirmar, Persona, FiltroChip, EncabezadoOrdenable, Indicadores, AiThinking, BotonIa, PantallaCompleta, SelectorMultiple, PageShell | — |
| `/admin/desempeno-cultura/evaluaciones-360` | Evaluaciones 360 | — | — |
| `/admin/desempeno-cultura/matriz-de-talento` | Matriz de talento | — | — |
| `/admin/desempeno-cultura/objetivos` | Objetivos | AgentStage, TextoCompleto, AdjuntoCsv, DialogoConfirmar, RegistroConfirmar, DrawerShell., AiThinking, notify, Badge, BotonIcono, Hint, ProcessCenter, BotonCancelarPanel, Indicadores, GraficoArea, TablaDatos, PageShell | — |
| `/admin/desempeno-cultura/objetivos/crear` | Crear ciclo | Badge, BotonIcono, Hint, notify, ProcessCenter, PantallaCompleta, TextoCompleto, BotonCancelarPanel, BotonSalirCreacion, PageShell, ActionDialog, DrawerShell., Persona, ListaElegible, TablaDatos, DialogoConfirmar, RegistroConfirmar, IconoIA, AgentStage, SelectorMultiple, AiThinking, BotonIa, ChipGuardado, BarraPasos, PasosFila | — |
| `/admin/desempeno-cultura/objetivos/resultados` | Resultados | IconoIA, Indicadores, AiThinking, Badge, BotonIa, TablaDatos, BotonIcono, ProcessCenter, DrawerShell., DialogoConfirmar, RegistroConfirmar, notify, FiltroChip, Hint, PageShell, TextoCompleto | — |
| `/admin/desempeno-cultura/pdi` | PDI | — | — |
| `/admin/inicio` | Inicio | Hint, ImagenGlass, IconoIA, Indicadores, notify, Badge, TextoCompleto, PageShell | — |
| `/admin/seleccion` | Selección | AgentStage, Badge, BotonIcono, Hint, PageShell, ProcessCenter, TablaDatos, DrawerShell., EncabezadoOrdenable, useCarga, notify, Indicadores, DialogoConfirmar, ImagenGlass, BotonIa, IconoIA, TableroAtencion, DialogoCompartirVacante, Persona, ActionDialog, Filas, Marco, Orb, FiltroChip, GraficoArea, pedirMover | — |
| `/admin/seleccion/creditos/uno` | Créditos | notify, BotonCancelarPanel, DrawerShell., useCarga, PageShell, TablaDatos, FiltroChip, Badge, Hint, GraficoArea, BotonIa, IconoIA, TableroAtencion, BotonIcono, Indicadores, ProcessCenter, EncabezadoOrdenable | — |
| `/admin/seleccion/dashboard` | Dashboard | Badge, IconoIA, Indicadores, useCarga, BotonIcono, notify, DialogoConfirmar, RegistroConfirmar, GraficoArea, PageShell, Orb, AgentStage, TablaDatos | — |
| `/admin/seleccion/plantillas` | Plantillas | — | — |
| `/admin/seleccion/vacantes` | Vacantes | BotonIcono, notify, DialogoConfirmar, DrawerShell., ImagenGlass, Badge, IconoIA, Indicadores, ProcessCenter, TablaDatos, ActionDialog, FeatureDialog, Persona, PageShell, DialogoCompartirVacante, BloqueAtencion | — |
| `/admin/seleccion/vacantes/crear` | Crear | IconoIA, BotonIcono, ImagenGlass, BotonIa, notify, BotonCancelarPanel, DrawerShell., AiThinking, Badge, DialogoConfirmar, TextoCompleto, Orb, PageShell, ChipGuardado | — |
| `/admin/seleccion/vacantes/detalle` | Detalle | DrawerShell., IconoIA, Orb, ImagenGlass, Badge, notify, AgentStage, BotonIcono, PageShell, Indicadores, DialogoConfirmar, DialogoEscribir, DialogoCompartirVacante, PantallaDeError | — |
| `/admin/suite-ai/chat` | Chat | CloseButton, BotonIcono, AiThinking, Orb, notify, IconoIA, ActionDialog, FeatureDialog, ProcessCenter, Hint, AgentStage, Indicadores | — |
| `/admin/suite-ai/voz` | Voz | Badge, Orb, notify | — |
| `/admin/tareas` | Tareas | ProcessCenter, Badge, BotonIcono, Persona, TablaDatos, ConfirmarEliminar, DialogoConfirmar, RegistroConfirmar, notify, Indicadores, DrawerShell., PageShell | — |
| `/admin/tareas/crear-plan` | Crear plan | BotonIcono, ChipGuardado, notify, PageShell, BotonSalirCreacion | HU-TAR-002, HU-TAR-003 |
| `/admin/tareas/crear-tarea` | Crear tarea | ChipGuardado, notify, PageShell, BotonSalirCreacion, SelectorMultiple | HU-TAR-003, HU-TAR-004 |
| `/portal-colaborador/aprendizaje` | Aprendizaje | — | — |
| `/portal-colaborador/aprendizaje/catalogo` | Catálogo | — | — |
| `/portal-colaborador/aprendizaje/diagnostico` | Diagnóstico | — | — |
| `/portal-colaborador/aprendizaje/metricas` | Métricas | — | — |
| `/portal-colaborador/aprendizaje/modo-estudio-ai` | Modo estudio AI | — | — |
| `/portal-colaborador/aprendizaje/progreso` | Progreso | notify, BotonIa, AgentStage, ActionDialog, Hint, ProcessCenter, Indicadores, DrawerShell., PageShell | — |
| `/portal-colaborador/aprendizaje/progreso/correo-recordatorio` | Correo recordatorio | Badge, PageShell, PantallaCompleta | — |
| `/portal-colaborador/aprendizaje/universidad-corporativa` | Universidad corporativa | Badge, BotonIcono, PageShell, ProcessCenter, TarjetaContenido, TablaDatos | HU-APR-005, HU-APR-010 |
| `/portal-colaborador/aprendizaje/zona-de-estudio` | Zona de estudio | BotonIcono, TablaDatos, TarjetaContenido, Badge, ProcessCenter, Hint, PageShell | HU-APR-003, HU-APR-009, HU-APR-011 |
| `/portal-colaborador/desempeno-cultura` | Desempeño y cultura | — | — |
| `/portal-colaborador/desempeno-cultura/encuestas` | Encuestas | — | — |
| `/portal-colaborador/desempeno-cultura/evaluaciones-360` | Evaluaciones 360 | — | — |
| `/portal-colaborador/desempeno-cultura/matriz-de-talento` | Matriz de talento | — | — |
| `/portal-colaborador/desempeno-cultura/objetivos` | Objetivos | — | — |
| `/portal-colaborador/tareas` | Tareas | — | — |

## Archivos por dueño (1221 archivos de código en src/)

El dueño es quien más commits tiene en el archivo.

| Dueño | Archivos |
| --- | ---: |
| Cristian | 469 |
| Elkin | 243 |
| Nicolás | 216 |
| David | 191 |
| cuenta compartida | 64 |
| Carlos | 31 |
| Christian Burbano | 7 |

## Retiradas que todavía se usan

Cada fila es algo que el equipo retiró (ai-tools/reglas/reglas.json) y todavía aparece en el código, sin contar comentarios, carpetas congeladas ni históricas. Las líneas por archivo están en las aristas `usa_retirada`.

| Retirada | Se usa en su lugar | Archivos | Ejemplos |
| --- | --- | ---: | --- |
| toast.add suelto | notify(título, detalle, tipo): ya recibe el tipo | 4 | `src/modules/admin/aprendizaje/certificados/descarga/main.tsx`, `src/modules/admin/seleccion/propuestas/simular.ts`, `src/modules/admin/seleccion/vacantes/main.tsx` |
| Ventana de salida con tres botones o «¿Salir sin guardar?» | DialogoSalir | 4 | `src/modules/admin/aprendizaje/planes-de-formacion/components/crear-plan.tsx`, `src/modules/admin/aprendizaje/planes-de-formacion/components/formulario-grupo.tsx`, `src/modules/admin/aprendizaje/planes-de-formacion/components/plan.tsx` |
| «Orbit Flow» como nombre del agente | «Orbit» (ReopenAgentButton ya dice «Orbit») | 3 | `src/modules/admin/aprendizaje/lms-creator/crear-contenido/components/vista-pagina.tsx`, `src/modules/admin/seleccion/creditos/uno/main.tsx`, `src/modules/design-system/botones/main.tsx` |
| MarcoTabla | TablaDatos | 2 | `src/modules/design-system/data-grid/main.tsx`, `src/shared/components/tabla-listado.tsx` |
| DataGridList directo en una pantalla | TablaDatos (con CeldaTitulo y PiePaginacion) | 1 | `src/modules/admin/seleccion/vacantes/components/vacantes-view.tsx` |

Sin patrón para buscar (se revisan a mano): Badge de la librería en xs o sm; Flecha junto al título, X o «Cancelar» para salir de una creación.

## Archivos huérfanos (20)

Archivos de `src/modules` y `src/shared` que ninguna ruta carga y nadie importa (sin contar `routes.ts` ni `.d.ts`). Candidatos a borrar o a conectar.

- `src/modules/admin/aprendizaje/lms-creator/compartido/piezas.tsx` (Cristian)
- `src/modules/admin/desempeno-cultura/encuestas/modelo/comparativo/comparativeTableSort.ts` (cuenta compartida)
- `src/modules/admin/desempeno-cultura/objetivos/crear/components/asignados/vista-agrupaciones.tsx` (Cristian)
- `src/modules/admin/desempeno-cultura/objetivos/crear/components/asignados/vista-lista.tsx` (Elkin)
- `src/modules/admin/desempeno-cultura/objetivos/crear/components/banco/banco-objetivos.tsx` (Cristian)
- `src/modules/admin/desempeno-cultura/objetivos/crear/components/banco/guardar-en-banco.tsx` (Cristian)
- `src/modules/admin/desempeno-cultura/objetivos/crear/components/parametrizacion/permisos.tsx` (Cristian)
- `src/modules/admin/desempeno-cultura/objetivos/modelo/constructor/assignmentSelection.ts` (Cristian)
- `src/modules/admin/inicio/components/productos.tsx` (Cristian)
- `src/modules/admin/seleccion/exploraciones/uno/vacantes.tsx` (Nicolás)
- `src/modules/admin/seleccion/propuestas/components/agregar-candidatos.tsx` (Nicolás)
- `src/modules/admin/seleccion/propuestas/importacion-base.ts` (Nicolás)
- `src/modules/admin/seleccion/vacantes/components/columnas-fijas.ts` (Elkin)
- `src/modules/admin/seleccion/vacantes/components/vacantes-view.tsx` (Nicolás)
- `src/modules/design-system/data-grid/abrir-al-tocar.ts` (Nicolás)
- `src/modules/design-system/drawers/components/vacancy-drawer.tsx` (Nicolás)
- `src/shared/bd/consumo-contenidos.ts` (David)
- `src/shared/components/LayoutSlot.tsx` (Christian Burbano)
- `src/shared/components/PageFallback.tsx` (Christian Burbano)
- `src/shared/components/tabla-listado.tsx` (David)

## Citas rotas en documentos (6)

Documentos que nombran una ruta de `src/` que ya no existe: están desfasados. Las aristas `cita` con `rota: true` lo dicen.

- `AGENTS.md` (2): `src/modules/admin/aprendizaje/planes-de-formacion/components/formulario-plan.tsx`, `src/modules/talent/portal/main.tsx`
- `scripts/check.mjs` (1): `src/modules/talent/routes.ts`
- `docs/traspaso/cristian-2026-10-01.md` (1): `src/shared/components/AiButton.tsx`
- `docs/traspaso/memoria-claude/duplicados-ds-analisis-2026-10-01.md` (1): `src/shared/components/AiButton.tsx`
- `docs/traspaso/memoria-claude/icono-ia.md` (1): `src/modules/design-system/ia/icono-ia.ts`
