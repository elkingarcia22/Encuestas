# Grafo del Playground UX

> Generado el 2026-10-15 por `ai-tools/grafo/generar-grafo.mjs` (no se edita a mano). El grafo completo está en `ai-tools/grafo/grafo.json` y se explora en `/design-system/grafo`.

## Cómo leerlo

- **Antes de armar algo**, busca la pieza del equipo (tabla de abajo): se usa antes que el componente de flux suelto. Si tiene ficha, la ficha dice qué cambió y cuándo usarla.
- **Para copiar cómo se resolvió algo**, busca una pantalla que use la misma pieza.
- **Para el contexto del producto**, sigue `implementa` desde una pantalla hasta su historia de usuario y de ahí al resto del producto real.
- En el JSON: `nodos` (`id`, `tipo`, `nombre`, `descripcion`, `ruta`, `archivo`) y `aristas` (`de`, `a`, `relacion`).
- **Por archivo** (dueño, quién lo importa, piezas y reglas que le tocan, retiradas que usa): `ai-tools/grafo/indice-archivos.json`, una entrada por ruta de `src/`.

## Totales (2617 nodos, 12803 aristas)

| Tipo | Qué es | Cuántos |
| --- | --- | ---: |
| `componente-flux` | Componente de la librería (@ubits/flux-ui), tal cual | 89 |
| `pieza` | Pieza del equipo hecha con flux: se usa antes que el componente suelto | 47 |
| `ficha` | Lo que se customizó de una pieza frente a la librería, con el porqué | 70 |
| `regla-global` | Ajuste que cambia toda la librería (no una pieza) | 7 |
| `pantalla` | Pantalla del producto maquetada en el playground (/admin, /portal-colaborador) | 78 |
| `plantilla` | Pantalla completa de referencia en el design system (/design-system/templates) | 39 |
| `pagina-ds` | Página de documentación del design system | 49 |
| `trampa` | Trampa conocida de un componente de flux (cómo no romperlo) | 41 |
| `diferencia` | Lo que el playground hace distinto de flux y se le pide a la librería | 145 |
| `historia` | Historia de usuario del producto real (HU-XXX-000) | 42 |
| `producto` | Concepto, pantalla o regla del producto real (docs/plataforma-ubits) | 302 |
| `producto-documento` | Documento de docs/plataforma-ubits | 18 |
| `archivo` | Archivo de código de src/ (con su dueño, y huerfano: true si nadie lo importa ni lo muestra una ruta) | 1220 |
| `ruta` | Dirección de la aplicación (router) y el archivo que carga | 216 |
| `regla` | Regla del equipo (ai-tools/reglas/reglas.json), enlazada a las piezas que rige | 40 |
| `retirada` | Pieza o patrón retirado: los archivos que todavía lo usan cuelgan de aquí con usa_retirada | 13 |
| `skill` | Skill de ai-tools/skills (SKILL.md) | 6 |
| `hook` | Hook de ai-tools/hooks | 6 |
| `script` | Script de scripts/ | 1 |
| `documento` | Documento: AGENTS.md, CLAUDE.md o un .md de docs/ (sus citas rotas se marcan) | 184 |
| `archivo-perdido` | Archivo que un documento nombra y ya no existe | 4 |

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
| Marco de página | `PageShell` | El marco de una página: ancho, título, migas, cabecera, secciones y barra de acciones | 43 | `ficha:pieza-pageshell` |
| Aviso | `notify` | Un aviso | 31 | `ficha:avisos` |
| Botón de solo icono | `BotonIcono` | Botón terciario de solo icono | 28 | `ficha:boton-icono` |
| Ventana de confirmar | `DialogoConfirmar` | Preguntar antes de hacer algo: eliminar, salir sin guardar, activar, descartar, enviar (también cuando muestra lo que se pierde) | 21 | `ficha:confirmar` |
| Tabla de datos | `TablaDatos` | Una tabla o un listado, con o sin paginación | 20 | `ficha:pieza-tabla-datos` |
| Panel lateral | `DrawerShell` | Un panel lateral | 20 | `ficha:drawer` |
| Centro de procesos | `ProcessCenter` | El centro de procesos | 20 | `ficha:pieza-process-center` |
| Ayuda en globo | `Hint` | Una ayuda contextual | 19 | `ficha:vacantes-ayuda` |
| Marca de IA (orbe e insignia) | `IconoIA` | Marcar lo que hizo la IA (pestaña, título, ítem, etiqueta) | 19 | `ficha:pieza-icono-ia` |
| Cifras de un tablero | `Indicadores` | Las cifras de un tablero | 18 | `ficha:pieza-indicadores` |
| Estados vacíos | `PrimeraVez` | Un estado vacío o de error | 17 | `ficha:pieza-primera-vez` |
| Ventana con contenido | `ActionDialog` | Una ventana con contenido: formulario corto, lista para elegir, vista previa, detalle, ajustes, o confirmar mostrando la lista de a quiénes afecta | 16 | `ficha:dialogos` |
| Insignia del proyecto | `Badge` | Una insignia de estado | 14 | `ficha:insignias` |
| Botones de IA | `BotonIa` | Botones de IA | 13 | `ficha:ia` |
| Agente contextual (Orbit Flow) | `AgentStage` | El agente contextual: panel, hilo, burbujas, propuestas y sugerencias | 13 | `ficha:rotulos-agente` |
| Estado «Razonando» | `AiThinking` | El estado «Razonando» | 12 | `ficha:pieza-ai-thinking` |
| Chip de guardado | `ChipGuardado` | El chip «Guardado / Guardando» de un formulario o asistente | 11 | `ficha:save-indicator` |
| Ilustración Glass | `ImagenGlass` | Una ilustración de vidrio (Glass) en una tarjeta, un vacío o un atajo | 11 | `ficha:pieza-imagen-glass` |
| Persona en una celda | `Persona` | Una persona en una celda de tabla (avatar con iniciales, nombre y detalle) | 9 | `ficha:pieza-persona` |
| Orbe del agente | `Orb` | El orbe del agente (de 16 a 180 px) | 8 | `ficha:pieza-orb` |
| Texto que se corta | `TextoCompleto` | Un texto que se corta y debe poder leerse entero | 7 | `ficha:pieza-texto-completo` |
| Cargador de archivos | `AdjuntoCsv` | Subir un archivo (CSV, PDF, imagen, video) con su avance y su error | 7 | `ficha:file-upload` |
| RegistroConfirmar | `RegistroConfirmar` | La tarjeta de lo que se toca dentro de una confirmación (nombre, detalle e insignia de estado) | 7 | — |
| Tarjeta de contenido | `TarjetaContenido` | La tarjeta de un contenido de aprendizaje | 6 | `ficha:tarjeta-contenido` |
| Gráficos de tablero | `GraficoArea` | Un gráfico de tablero | 6 | `ficha:encuestas-graficos` |
| BotonSalirCreacion | `BotonSalirCreacion` | La única salida de una creación o edición (asistente, editor, formulario de alta) | 6 | — |
| Chip de filtro rápido | `FiltroChip` | Un chip de filtro rápido con su «x» para quitarlo | 4 | `ficha:pieza-filtro-chip` |
| Esqueletos y espera | `useCarga` | Esqueletos y espera simulada en Selección | 4 | `ficha:pieza-carga` |
| Botón de cerrar | `CloseButton` | Cerrar una ventana o panel | 3 | `ficha:cerrar` |
| Bloque con título | `Marco` | Un bloque con título dentro de una ficha o un detalle: título, bajada, una acción arriba a la derecha y sus paneles blancos adentro | 3 | `ficha:pieza-marco` |
| Lista de dato y valor | `Filas` | Una lista de dato y valor en el resumen de una ficha | 3 | `ficha:pieza-filas` |
| Pantalla de error | `PantallaDeError` | Una pantalla de error del sistema (sin conexión, licencia, servidor) | 3 | `ficha:pieza-pantalla-error` |
| DialogoEscribir | `DialogoEscribir` | Escribirle un correo a una o varias personas de un proceso (plantilla y mensaje) | 3 | — |
| DialogoCompartirVacante | `DialogoCompartirVacante` | Compartir una vacante (enlace para candidatos y acceso del equipo) | 3 | — |
| Lista para elegir | `ListaElegible` | Una lista para elegir dentro de un contenedor (acordeón, panel lateral, sección con marco) | 2 | `ficha:pieza-lista-elegible` |
| Novedades y bienvenida | `FeatureDialog` | Diálogos de novedades, cambios y bienvenida | 2 | `ficha:dialogos` |
| Edición en línea | `EdicionEnLinea` | Renombrar algo en el sitio, sin abrir un modal | 2 | `ficha:edicion-en-linea` |
| Tablero «Lo que necesita tu atención» | `TableroAtencion` | Lo que necesita tu atención (asuntos por resolver, arriba de una pantalla) | 2 | `ficha:pieza-tablero-atencion` |
| Eliminar escribiendo la palabra | `ConfirmarEliminar` | Confirmar un borrado escribiendo la palabra | 2 | `ficha:confirmar` |
| Franja «N cosas necesitan tu atención» | `BloqueAtencion` | La franja plegable «N cosas necesitan tu atención» encima de una lista | 1 | `ficha:vacantes-alertas` |
| Selector múltiple | `SelectorMultiple` | Elegir varias opciones con buscador (fichas) | 1 | `ficha:pieza-selector-multiple` |
| pedirMover | `pedirMover` | Mover a una persona de etapa en un proceso de selección | 1 | — |
| Tarjeta de IA | `AiCard` | Invitar a que la IA haga el trabajo, dentro de una pantalla normal | 0 | `ficha:pieza-ai-card` |
| Tarjeta de incidencia del agente | `issue-card` | Una tarjeta de incidencia en una revisión del agente | 0 | `ficha:pieza-issue-card` |
| CommandPalette. | `CommandPalette.` | El buscador de comandos | 0 | — |
| Punto de estado del chat | `ChatStatusDot` | El punto de estado de una conversación de Suite AI | 0 | `ficha:pensando` |
| Tarjeta de invitar | `InviteCard` | La tarjeta de invitar a otra persona | 0 | `ficha:invitacion` |

## Componentes de flux más usados en pantallas

| Componente | Pantallas | Trampas |
| --- | ---: | ---: |
| Button | 44 | 2 |
| Text | 41 | 1 |
| Frame | 33 | 4 |
| Badge | 32 | 1 |
| Item | 32 | 1 |
| Field | 25 | 1 |
| Heading | 25 | 1 |
| Progress | 25 | 1 |
| Alert | 24 | 1 |
| Tabs | 24 | 1 |
| Select | 23 | 1 |
| DropdownMenu | 22 | 4 |
| IconTile | 20 | 0 |
| Separator | 20 | 0 |
| Input | 19 | 2 |
| Empty | 18 | 0 |
| Textarea | 17 | 0 |
| Avatar | 16 | 2 |
| Card | 16 | 3 |
| InputGroup | 16 | 0 |
| RadioGroup | 15 | 0 |
| Tooltip | 14 | 1 |
| Checkbox | 13 | 1 |
| Switch | 13 | 0 |
| Toast | 11 | 1 |
| ToggleGroup | 11 | 0 |
| Accordion | 9 | 0 |
| Popover | 9 | 3 |
| Table | 9 | 0 |
| Spinner | 8 | 0 |

Sin usar en ninguna pantalla: ActionDropdown, AlertDialog, Autocomplete, Cascader, CodeBlock, ContextMenu, DataGrid, DateSelector, Direction, EventCalendar, Filters, Gantt, IconStack, InputOtp, Menubar, MultiSelect, NativeSelect, NavigationMenu, PhoneInput, Scrollspy, Sheet, Sonner, ThemeProvider, Tree.

## Pantallas del producto

| Ruta | Nombre | Piezas del equipo | Historias |
| --- | --- | --- | --- |
| `/admin/aprendizaje` | Aprendizaje | notify, AgentStage, DrawerShell, Indicadores, Persona, PrimeraVez, BotonIcono, PageShell, TablaDatos, ConfirmarEliminar, DialogoConfirmar, PantallaDeError, ChipGuardado, RegistroConfirmar, TarjetaContenido, ProcessCenter, AdjuntoCsv, Badge | HU-LMS-005, HU-LMS-006, HU-LMS-009, HU-LMS-015, HU-LMS-016, HU-LMS-021, HU-LMS-022 |
| `/admin/aprendizaje/certificados/configuracion` | Configuración | — | — |
| `/admin/aprendizaje/certificados/correo` | Correo | notify, PageShell | HU-LMS-007 |
| `/admin/aprendizaje/certificados/descarga` | Descarga | ActionDialog, Badge, PageShell | HU-LMS-007 |
| `/admin/aprendizaje/diagnostico` | Diagnóstico | DialogoConfirmar, notify, PageShell, ChipGuardado, ActionDialog, DrawerShell, PrimeraVez, BotonIcono, TablaDatos, ProcessCenter | — |
| `/admin/aprendizaje/diagnostico/crear` | Crear assessment | — | — |
| `/admin/aprendizaje/lms-creator` | LMS Creator | Hint, Badge, IconoIA, ImagenGlass, AgentStage, Orb, notify, CloseButton, BotonIcono, ActionDialog | HU-LMS-001, HU-LMS-002, HU-LMS-004, HU-LMS-011, HU-LMS-019 |
| `/admin/aprendizaje/lms-creator/agregar-asistencia` | Agregar asistencia | PageShell, BotonSalirCreacion | — |
| `/admin/aprendizaje/lms-creator/agregar-presentacion-interactiva` | Agregar presentacion interactiva | AdjuntoCsv, BotonIa, AgentStage, ActionDialog, AiThinking, ImagenGlass | — |
| `/admin/aprendizaje/lms-creator/agregar-presentacion-interactiva/editor` | Editor | BotonIa, AiThinking, ChipGuardado, BotonIcono, Hint, notify, DialogoConfirmar, RegistroConfirmar, BotonSalirCreacion, EdicionEnLinea, PageShell | — |
| `/admin/aprendizaje/lms-creator/agregar-roleplay` | Agregar roleplay | ChipGuardado, BotonSalirCreacion | — |
| `/admin/aprendizaje/lms-creator/agregar-roleplay-mvp` | Agregar roleplay mvp | BotonIcono, Hint | — |
| `/admin/aprendizaje/lms-creator/agregar-video` | Agregar video | — | HU-LMS-001 |
| `/admin/aprendizaje/lms-creator/agregar-video/editor` | Editor | — | HU-LMS-001 |
| `/admin/aprendizaje/lms-creator/categorias` | Categorías | — | — |
| `/admin/aprendizaje/lms-creator/contenidos` | Contenidos | ActionDialog, TablaDatos, BotonIcono, notify, TarjetaContenido, PrimeraVez, DialogoConfirmar, RegistroConfirmar, PageShell, ImagenGlass, ProcessCenter | — |
| `/admin/aprendizaje/lms-creator/crear-contenido` | Crear contenido | DialogoConfirmar, ActionDialog, Hint, ImagenGlass, IconoIA, BotonIcono, RegistroConfirmar, ChipGuardado, notify, PageShell, BotonIa, AiThinking, DrawerShell, CloseButton, AgentStage, ProcessCenter, AdjuntoCsv, Marco, TarjetaContenido, TablaDatos, Orb, PrimeraVez, EdicionEnLinea, BotonSalirCreacion | HU-LMS-001, HU-LMS-010, HU-LMS-013, HU-LMS-014, HU-LMS-019, HU-LMS-020 |
| `/admin/aprendizaje/lms-creator/crear-evento` | Crear evento | — | HU-LMS-020 |
| `/admin/aprendizaje/lms-creator/crear-ruta` | Crear ruta | — | HU-LMS-013, HU-LMS-014 |
| `/admin/aprendizaje/lms-creator/lab-modal-video` | Lab modal video | PageShell | — |
| `/admin/aprendizaje/lms-creator/lms-ai` | LMS AI | — | — |
| `/admin/aprendizaje/lms-creator/resultados` | Resultados | Badge, TablaDatos, notify, PageShell, ProcessCenter, PrimeraVez, DrawerShell, Indicadores, ActionDialog, Hint, IconoIA, BotonIa, TextoCompleto, BotonIcono | — |
| `/admin/aprendizaje/lms-creator/universidad-corporativa` | Universidad corporativa | — | — |
| `/admin/aprendizaje/lms-creator/vista-colaborador` | Vista colaborador | Badge, Hint, notify, ActionDialog, BotonIcono, ImagenGlass, TarjetaContenido | HU-APR-009, HU-LMS-025 |
| `/admin/aprendizaje/metricas` | Métricas | — | — |
| `/admin/aprendizaje/planes-de-formacion/grupos` | Grupos | — | — |
| `/admin/aprendizaje/planes-de-formacion/grupos/formulario` | Formulario | — | — |
| `/admin/aprendizaje/planes-de-formacion/planes` | Planes | — | — |
| `/admin/aprendizaje/planes-de-formacion/planes/crear` | Crear | — | — |
| `/admin/aprendizaje/planes-de-formacion/planes/detalle` | Detalle | — | — |
| `/admin/aprendizaje/reportes` | Reportes | — | — |
| `/admin/avisos-internos` | Avisos internos | Indicadores, DrawerShell, ActionDialog, BotonIcono, TablaDatos, DialogoConfirmar, Persona, PageShell, ProcessCenter, PrimeraVez | — |
| `/admin/avisos-internos/crear` | Crear | PageShell, ChipGuardado, AdjuntoCsv, DialogoConfirmar | — |
| `/admin/configuracion/datos-empresa` | Datos de empresa | Indicadores, PageShell | — |
| `/admin/configuracion/personalizacion` | Personalización | notify, PageShell | — |
| `/admin/desempeno-cultura` | Desempeño y cultura | — | — |
| `/admin/desempeno-cultura/encuestas` | Encuestas | AgentStage, DialogoConfirmar, AiThinking, DrawerShell, BotonIcono, Indicadores, TextoCompleto, notify, AdjuntoCsv, ImagenGlass, ProcessCenter, PrimeraVez, Hint, TablaDatos, GraficoArea, BotonIa, Persona, PageShell, Filas | — |
| `/admin/desempeno-cultura/encuestas/comparativo` | Comparativo | DrawerShell, IconoIA, GraficoArea, Indicadores, ImagenGlass, ProcessCenter, BotonIcono, Hint, AiThinking, TablaDatos, notify, PageShell | — |
| `/admin/desempeno-cultura/encuestas/crear` | Crear | DialogoConfirmar, AgentStage, notify, Hint, DrawerShell, BotonIcono, TextoCompleto, Badge, PrimeraVez, ListaElegible, Persona, AiThinking, AdjuntoCsv, ActionDialog, IconoIA, BotonIa, ProcessCenter, ImagenGlass, PageShell, ChipGuardado | — |
| `/admin/desempeno-cultura/encuestas/resultados` | Resultados | DrawerShell, IconoIA, TextoCompleto, Hint, BotonIcono, ProcessCenter, PrimeraVez, TablaDatos, ListaElegible, notify, DialogoConfirmar, Persona, FiltroChip, AiThinking, BotonIa, ActionDialog, ImagenGlass, PageShell, Indicadores | — |
| `/admin/desempeno-cultura/evaluaciones-360` | Evaluaciones 360 | PageShell | HU-DES-002 |
| `/admin/desempeno-cultura/matriz-de-talento` | Matriz de talento | PageShell | — |
| `/admin/desempeno-cultura/objetivos` | Objetivos | AgentStage, AdjuntoCsv, DialogoConfirmar, DrawerShell, AiThinking, notify, Badge, BotonIcono, Hint, TextoCompleto, PrimeraVez, Indicadores, GraficoArea, TablaDatos, ProcessCenter, PageShell | — |
| `/admin/desempeno-cultura/objetivos/crear` | Crear ciclo | BotonIcono, Hint, notify, ProcessCenter, ActionDialog, DrawerShell, Persona, PrimeraVez, TextoCompleto, BotonIa, IconoIA, DialogoConfirmar, TablaDatos, AgentStage, AiThinking, ChipGuardado, PageShell | — |
| `/admin/desempeno-cultura/objetivos/resultados` | Resultados | IconoIA, AiThinking, BotonIa, TablaDatos, Badge, BotonIcono, PrimeraVez, ProcessCenter, DrawerShell, Indicadores, Hint, DialogoConfirmar, notify, PageShell | — |
| `/admin/desempeno-cultura/pdi` | PDI | PageShell | — |
| `/admin/inicio` | Inicio | Hint, ImagenGlass, IconoIA, Indicadores, notify, PageShell | — |
| `/admin/seleccion` | Selección | AgentStage, Badge, Hint, PageShell, DrawerShell, TablaDatos, IconoIA, useCarga, BotonIcono, notify, DialogoEscribir, Indicadores, DialogoConfirmar, ImagenGlass, BotonIa, TableroAtencion, ProcessCenter, PrimeraVez, FiltroChip, DialogoCompartirVacante, GraficoArea, Persona, Filas, Marco, Orb, pedirMover | — |
| `/admin/seleccion/creditos/uno` | Créditos | notify, DrawerShell, useCarga, PageShell, PrimeraVez, TablaDatos, FiltroChip, Badge, Hint, GraficoArea, BotonIa, IconoIA, TableroAtencion, ProcessCenter | — |
| `/admin/seleccion/dashboard` | Dashboard | Badge, IconoIA, Indicadores, useCarga, BotonIcono, GraficoArea, PageShell, TablaDatos | — |
| `/admin/seleccion/plantillas` | Plantillas | PageShell | — |
| `/admin/seleccion/propuestas/bandeja` | Bandeja | Badge, notify, PageShell, ProcessCenter, PrimeraVez, useCarga, FiltroChip | — |
| `/admin/seleccion/propuestas/copiloto` | Copiloto | Badge, Orb, notify, PageShell, IconoIA | — |
| `/admin/seleccion/propuestas/tablero` | Tablero | Badge, notify, PageShell, IconoIA | — |
| `/admin/seleccion/vacantes` | Vacantes | BotonIcono, notify, DialogoConfirmar, DrawerShell, IconoIA, Indicadores, ActionDialog, FeatureDialog, Persona, TablaDatos, PageShell, DialogoCompartirVacante, BloqueAtencion | — |
| `/admin/seleccion/vacantes/crear` | Crear | IconoIA, BotonIcono, BotonIa, notify, DrawerShell, AiThinking, DialogoConfirmar, TextoCompleto, Orb, ActionDialog, PageShell, ChipGuardado | — |
| `/admin/seleccion/vacantes/detalle` | Detalle | notify, AgentStage, IconoIA, DrawerShell, BotonIcono, PageShell, Indicadores, DialogoConfirmar, DialogoEscribir, DialogoCompartirVacante, PantallaDeError | — |
| `/admin/seleccion/vacantes/detalle/candidato` | Candidato | IconoIA, Filas, Marco, AgentStage, BotonIcono, notify, PageShell, DialogoConfirmar, PantallaDeError, DialogoEscribir, DrawerShell, Orb, Indicadores, TablaDatos | — |
| `/admin/suite-ai/chat` | Chat | CloseButton, BotonIcono, AiThinking, Orb, notify, IconoIA, ActionDialog, FeatureDialog, ProcessCenter, AgentStage, Hint, Indicadores | — |
| `/admin/suite-ai/voz` | Voz | Orb, notify | — |
| `/admin/tareas` | Tareas | BotonIcono, Persona, TablaDatos, ConfirmarEliminar, DialogoConfirmar, RegistroConfirmar, notify, Indicadores, DrawerShell, PageShell | — |
| `/admin/tareas/crear-plan` | Crear plan | BotonIcono, ChipGuardado, PageShell, BotonSalirCreacion, DialogoConfirmar, RegistroConfirmar | HU-TAR-002, HU-TAR-003 |
| `/admin/tareas/crear-tarea` | Crear tarea | ChipGuardado, PageShell, BotonSalirCreacion, DialogoConfirmar, RegistroConfirmar, SelectorMultiple | HU-TAR-003, HU-TAR-004 |
| `/portal-colaborador/aprendizaje` | Aprendizaje | — | — |
| `/portal-colaborador/aprendizaje/catalogo` | Catálogo | — | — |
| `/portal-colaborador/aprendizaje/diagnostico` | Diagnóstico | — | — |
| `/portal-colaborador/aprendizaje/metricas` | Métricas | — | — |
| `/portal-colaborador/aprendizaje/modo-estudio-ai` | Modo estudio AI | — | — |
| `/portal-colaborador/aprendizaje/progreso` | Progreso | BotonIa, AgentStage, ActionDialog, Hint, ProcessCenter, Indicadores, DrawerShell, PageShell | — |
| `/portal-colaborador/aprendizaje/progreso/correo-recordatorio` | Correo recordatorio | PageShell | — |
| `/portal-colaborador/aprendizaje/universidad-corporativa` | Universidad corporativa | BotonIcono, PageShell, ProcessCenter, TarjetaContenido, TablaDatos, PrimeraVez | HU-APR-005, HU-APR-010 |
| `/portal-colaborador/aprendizaje/zona-de-estudio` | Zona de estudio | notify, BotonIcono, PrimeraVez, TarjetaContenido, TablaDatos, ProcessCenter, Hint, PageShell | HU-APR-003, HU-APR-009, HU-APR-011 |
| `/portal-colaborador/desempeno-cultura` | Desempeño y cultura | — | — |
| `/portal-colaborador/desempeno-cultura/encuestas` | Encuestas | — | — |
| `/portal-colaborador/desempeno-cultura/evaluaciones-360` | Evaluaciones 360 | — | — |
| `/portal-colaborador/desempeno-cultura/matriz-de-talento` | Matriz de talento | — | — |
| `/portal-colaborador/desempeno-cultura/objetivos` | Objetivos | — | — |
| `/portal-colaborador/tareas` | Tareas | — | — |

## Archivos por dueño (1220 archivos de código en src/)

El dueño es quien más commits tiene en el archivo.

| Dueño | Archivos |
| --- | ---: |
| Cristian | 388 |
| Elkin | 226 |
| Nicolás | 207 |
| David | 183 |
| cuenta compartida | 104 |
| sin commits | 60 |
| Carlos | 45 |
| Christian Burbano | 7 |

## Retiradas que todavía se usan

Cada fila es algo que el equipo retiró (ai-tools/reglas/reglas.json) y todavía aparece en el código, sin contar comentarios, carpetas congeladas ni históricas. Las líneas por archivo están en las aristas `usa_retirada`.

| Retirada | Se usa en su lugar | Archivos | Ejemplos |
| --- | --- | ---: | --- |
| toast.add suelto | notify(título, detalle, tipo): ya recibe el tipo | 44 | `src/modules/admin/aprendizaje/certificados/descarga/main.tsx`, `src/modules/admin/aprendizaje/lms-creator/crear-contenido/components/video/piezas.tsx`, `src/modules/admin/avisos-internos/crear/main.tsx` |
| MarcoTabla | TablaDatos | 2 | `src/modules/design-system/data-grid/main.tsx`, `src/shared/components/tabla-listado.tsx` |
| ConfiguredModal | DialogoConfirmar para preguntar; ActionDialog para todo lo demás | 1 | `src/modules/design-system/modales/components/modal-parts.tsx` |
| DataGridList directo en una pantalla | TablaDatos (con CeldaTitulo y PiePaginacion) | 1 | `src/modules/admin/seleccion/vacantes/components/vacantes-view.tsx` |

Sin patrón para buscar (se revisan a mano): Badge de la librería en xs o sm; Flecha junto al título, X o «Cancelar» para salir de una creación.

## Archivos huérfanos (36)

Archivos de `src/modules` y `src/shared` que ninguna ruta carga y nadie importa (sin contar `routes.ts` ni `.d.ts`). Candidatos a borrar o a conectar.

- `src/modules/admin/aprendizaje/lms-creator/compartido/piezas.tsx` (Cristian)
- `src/modules/admin/aprendizaje/lms-creator/crear-contenido/components/seccion-paso.tsx` (David)
- `src/modules/admin/desempeno-cultura/encuestas/crear/components/participantes-v1/paso-participantes.tsx` (cuenta compartida)
- `src/modules/admin/desempeno-cultura/encuestas/crear/components/participantes-v2/paso-participantes.tsx` (Elkin)
- `src/modules/admin/desempeno-cultura/encuestas/crear/components/participantes-v3/paso-participantes.tsx` (cuenta compartida)
- `src/modules/admin/desempeno-cultura/encuestas/crear/components/participantes-v4/paso-participantes.tsx` (cuenta compartida)
- `src/modules/admin/desempeno-cultura/encuestas/crear/components/participantes-v5/paso-participantes.tsx` (cuenta compartida)
- `src/modules/admin/desempeno-cultura/encuestas/crear/components/participantes-v6/paso-participantes.tsx` (cuenta compartida)
- `src/modules/admin/desempeno-cultura/encuestas/modelo/comparativo/comparativeTree.ts` (cuenta compartida)
- `src/modules/admin/desempeno-cultura/encuestas/modelo/deriveTrend.ts` (cuenta compartida)
- `src/modules/admin/desempeno-cultura/objetivos/crear/components/asignados/vista-agrupaciones.tsx` (Cristian)
- `src/modules/admin/desempeno-cultura/objetivos/crear/components/asignados/vista-lista.tsx` (Cristian)
- `src/modules/admin/desempeno-cultura/objetivos/crear/components/parametrizacion/permisos.tsx` (Cristian)
- `src/modules/admin/desempeno-cultura/objetivos/modelo/constructor/assignmentSelection.ts` (Cristian)
- `src/modules/admin/inicio/components/charts.tsx` (Nicolás)
- `src/modules/admin/inicio/components/kpi-strip.tsx` (Nicolás)
- `src/modules/admin/inicio/components/lists.tsx` (Nicolás)
- `src/modules/admin/inicio/components/productos.tsx` (Cristian)
- `src/modules/admin/inicio/components/today-card.tsx` (Nicolás)
- `src/modules/admin/seleccion/dashboard/bloques.tsx`
- `src/modules/admin/seleccion/dashboard/insights.ts`
- `src/modules/admin/seleccion/dashboard/llegadas.tsx`
- `src/modules/admin/seleccion/dashboard/tabla.tsx`
- `src/modules/admin/seleccion/exploraciones/uno/vacantes.tsx` (Nicolás)
- `src/modules/admin/seleccion/propuestas/bandeja/main.tsx` (Nicolás)
- `src/modules/admin/seleccion/propuestas/components/marco-tabla.tsx` (Nicolás)
- `src/modules/admin/seleccion/propuestas/copiloto/main.tsx` (Nicolás)
- `src/modules/admin/seleccion/propuestas/tablero/main.tsx` (Nicolás)
- `src/modules/admin/seleccion/vacantes/components/columnas-fijas.ts` (Elkin)
- `src/modules/admin/seleccion/vacantes/components/vacantes-view.tsx` (Nicolás)
- `src/modules/admin/seleccion/vacantes/detalle/candidato/main.tsx` (Cristian)
- `src/modules/design-system/modales/components/modal-parts.tsx` (Nicolás)
- `src/shared/bd/consumo-contenidos.ts` (David)
- `src/shared/components/LayoutSlot.tsx` (Christian Burbano)
- `src/shared/components/PageFallback.tsx` (Christian Burbano)
- `src/shared/components/tabla-listado.tsx` (David)

## Citas rotas en documentos (5)

Documentos que nombran una ruta de `src/` que ya no existe: están desfasados. Las aristas `cita` con `rota: true` lo dicen.

- `scripts/check.mjs` (1): `src/modules/talent/routes.ts`
- `AGENTS.md` (1): `src/modules/talent/portal/main.tsx`
- `docs/traspaso/cristian-2026-10-01.md` (1): `src/shared/components/AiButton.tsx`
- `docs/traspaso/memoria-claude/duplicados-ds-analisis-2026-10-01.md` (1): `src/shared/components/AiButton.tsx`
- `docs/traspaso/memoria-claude/icono-ia.md` (1): `src/modules/design-system/ia/icono-ia.ts`
