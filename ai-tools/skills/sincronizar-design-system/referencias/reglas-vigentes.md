# Reglas vigentes de diseño

Decisiones que ya tomó Nicolás (diseño). Antes de un cambio se lee esta lista; si el cambio la contradice, se pregunta.
Después de un cambio que fija o reemplaza una regla, se actualiza aquí con fecha y se borra la versión vieja.
Cada regla dice **dónde se aplica** en la interfaz y **dónde se documenta** en el design system.

## Auditoría del 5 oct: una sola pieza por cosa
Cristian revisó, componente por componente, la auditoría del design system sobre staging (563ead0) y decidió. Estas
reglas **reemplazan** a las que se marcan como reemplazadas más abajo.
- **Una sola tabla: `TablaDatos`.** `MarcoTabla` (la de `src/shared/components/tabla-listado.tsx` y la de Selección) se
  retira. Cabecera como **Vacantes** (Cristian: «quiero cambiar el header de la tabla para hacerlo como en Vacantes»):
  conteo a la izquierda, buscador y «Personalizar columnas» a la derecha, sin título dentro del marco; encabezados de 40 px
  con asidero para mover y cambiar el ancho. La fila que nombra algo lleva título y línea gris (`CeldaTitulo`), y **es la
  misma cuando hay imagen** (miniatura 16:9 a la izquierda): una lista de contenidos con portada es una tabla.
- **Un solo paginador: `PiePaginacion`** («Filas por página» 10/20/50, «Viendo 1–10 de 84 …», «Anterior / Siguiente»
  dentro del marco). Encuestas deja su 5/10/25.
- **Dos ventanas, cada una con su trabajo (6 oct, reemplaza la «ventana única» del 5 oct).** Preguntar antes de hacer
  algo (eliminar, salir sin guardar, activar, descartar, enviar) va en `DialogoConfirmar`, también cuando muestra lo que
  se pierde; `ConfirmarEliminar` va por dentro en él. Todo lo que tiene contenido (formularios, listas para elegir,
  vistas previas, detalles, ajustes), y confirmar con la lista de a quiénes afecta, va en `ActionDialog`.
  `ConfiguredModal` se retiró. **Forma (6 oct, lienzo «Ventana de confirmar»):** en las dos ventanas el icono va
  arriba del título y todo alineado a la izquierda; en `DialogoConfirmar` lo que se toca va en `RegistroConfirmar`
  (tarjeta con nombre, detalle e insignia de estado; condensada en la chica).
  **Con tres salidas** (seguir editando · salir sin guardar · guardar y salir) `DialogoConfirmar` lleva `otra` y va en
  su tamaño normal (`size` sin poner), no en `sm`: en el chico los tres botones no caben en una fila.
- **Crear y editar en una página** con `PageActionBar` y el estado de guardado; nunca en ventana ni panel. El caso
  «Formulario por pasos» de Drawers queda solo como referencia de la pieza, marcado «no usar para crear».
- **Asistentes por pasos como `/admin/seleccion/exploraciones/uno/crear`**: un solo botón «Salir de la creación» a la
  derecha del título y **nada de flecha a la izquierda del título**.
  **Regla de creación (6 oct, al unir el PR de David):** en creación, una sola salida y **sin «Cancelar»** en la barra de
  los pasos; a la izquierda de esa barra va `ChipGuardado`, y a la derecha «Atrás» y seguir. En LMS Creator la salida es
  `BotonSalirCreacion` (contorno e icono de salir, sin flecha ni X), que dice a dónde lleva: «Salir de la creación»,
  «Volver a añadir página» o «Salir de la edición». `BarraEditor` solo pinta «Cancelar» si se le pasa `onCancelar` (no
  se le pasa en creación) y recibe el chip en `inicio`. `MarcoInmersivo` ganó `pie`: la barra fija al pie para los
  editores de tres columnas, para que la acción principal quede en el mismo sitio que en el setup.
  Aplicado en: los pasos y flujos hijos de LMS Creator (Crear contenido, video, presentación, asistencia, roleplay).
  Documentado en: `/design-system/navegacion` (partes «Volver» y «Barra de acciones»; el caso Asistente por pasos usa
  `BotonSalirCreacion` real y pregunta la salida con `DialogoConfirmar` de tres salidas) y Ajustes propios › «Marco de
  flujo a pantalla completa» (con la salida y la barra reales) e «Indicador de guardado».
- **Roleplay de LMS unificado (5–6 oct):** el MVP y el MLP son un solo «Evaluador roleplay» (`/agregar-roleplay`; la
  dirección `-mvp` solo redirige). Sus ventanas de entrada (elegir roleplay o presentación) van en `ActionDialog`.
- **Toda pantalla en `PageShell` + `PageHeader`**; las excepciones (modo voz de Suite AI a pantalla completa) se documentan.
- **IA en el menú:** toda entrada de IA del menú lleva el orbe con `ICONO_IA` de `nav-config.ts` («Modo estudio AI»,
  «Nuevo chat», «LMS AI», «Trabajar con la IA», «Botones de IA», «Orbit Flow»); lo pintan `AppSidebar`, `SidebarRail`,
  `CommandPalette`, la réplica de `/design-system/barra-lateral` y el selector de casos del DS. La ventana de Novedades
  también pasó de la estrella al orbe.
- **Ayuda que abre con clic:** `BotonAyuda` usa el mismo globo oscuro (`HintContent`) que las demás ayudas.
- **Pantallas sin maquetar:** `createPage` las monta en `PageShell` con `PageHeader`; `PlaceholderPage` ya no trae su
  propio ancho.
- **Configurador de `/design-system/navegacion`** (sincronizado el 5-oct): un solo paginador (se retiró la opción
  «Compacta»), filtros rápidos con `FiltroChip` (sin chip «Todas»), el pie del asistente con `ChipGuardado` en vez de
  «Guardar borrador», un solo «Salir de la creación» sin flecha junto al título, pestaña subrayada en vistas guardadas y
  la fila «⋯ · terciario · secundario · primario · IA/Orbit Flow». Los patrones con listas (básica, selección masiva,
  tablero) usan `TablaDatos`; las cifras, `Indicadores`/`FilaCifras`; los vacíos, `PrimeraVez`/`SinResultados`.
- **`/design-system/ia/botones`** muestra la fila «Orden en la fila»: ⋯ · Exportar · Vista previa · Publicar · Revisar
  con IA · Orbit Flow.
- **IA:** el orbe es la única marca (`IconoIA`, `EtiquetaIA`; también en el menú: «Modo estudio AI» lleva el orbe). Un
  solo primario de IA, **`BotonIa`** (el degradado; `AiButton` y `BotonIaPrimario` se borraron), junto a
  `BotonIaSecundario`. El botón del agente contextual es `ReopenAgentButton`, se llama **«Orbit Flow»** y va **el último**.
- **Cifras:** una sola fila partida (`Indicadores` / `FilaCifras`). ~~La variación desaparece~~ **Reemplazada el 6 oct**
  (Cristian: «dejemos lo de Nico»): la comparación frente al periodo anterior vuelve con la forma de Nicolás, la fila de
  Selección (`FilaIndicadores` + `ColumnaIndicador` con `Cambio`, `Ayuda` de clic, `Cifra` y `Pie`). Las cifras y
  gráficos propios de Encuestas y Vacantes se quedan (decisión 12).
  **`Cambio` es la única insignia de comparación (7 oct):** el comparativo de Encuestas dejó su `Variacion` y usa
  `Cambio` con cuatro opciones nuevas que no cambian lo de Selección: `decimales` (los pp con uno, «+2,3 pp»; lo que
  redondea a 0 es «igual»), `sinColor` (ni verde ni rojo), `enCelda` (en tabla, «0 pp» gris con guion en vez de «Igual
  que…») y `ayuda` (nota en el globo `Hint`). Documentado en `/design-system/metricas` («Las opciones de Cambio» y la
  regla «Una sola insignia de comparación»).
- **Lo que necesita tu atención (6 oct):** el tablero de Nicolás (`TableroAtencion`, en
  `design-system/metricas/tablero-atencion.tsx`) es la pieza para los asuntos por resolver: va arriba de la
  pantalla, una columna por grupo, recogido con lo más urgente y «Expandir». Lo usan Créditos de IA y el inicio de
  Vacantes. Documentado en `/design-system/metricas` con la pieza real.
- **Pestañas:** subrayadas y pegadas bajo el título. La pastilla gris solo en casos especiales, y puede ir debajo de otros
  componentes según el uso.
- **Vacíos:** `PrimeraVez` y `SinResultados`, **siempre con ilustración**; cargas con esqueleto.
- **«⋯»** = `BotonIcono`, el primero de la fila; cerrar = `CloseButton` (también en los paneles laterales).
- **Ayudas:** `Hint` al pasar el cursor; `BotonAyuda` para el icono que abre con clic; una leyenda con insignias va en
  `Popover`. `Hint` acepta `open`/`onOpenChange` para abrirse y cerrarse desde afuera (7 oct).
- **Texto cortado: `TextoCompleto` (7 oct, pieza oficial).** Un texto que se corta con «…» va dentro de
  `TextoCompleto` (`src/shared/components/TextoCompleto.tsx`): el texto entero sale en el globo del sistema (`Hint`
  controlado) al pasar el cursor o enfocar, y solo si de verdad está cortado. En una columna angosta, `CeldaTitulo`
  puede dejar el título en dos renglones con `dosLineas`. Registrado en `PIEZAS_DEL_PROYECTO`; falta sumarlo a la tabla de `AGENTS.md` (andamiaje: lo cambia ingeniería);
  documentado en `/design-system/data-grid` (regla «Lo cortado se puede leer entero» y sección «Textos que no caben»).
- **Rango de fechas:** con un rango ya puesto, un clic en otro día empieza un rango nuevo desde ese día (7 oct).
  Documentado en `/design-system/formularios` (Fechas).
- **Tarjeta de contenido:** la de David (Zona de estudio), `TarjetaContenido`, para cursos, rutas, eventos e ítems de plan.
- **Un solo cargador:** `AdjuntoCsv`. **Fechas:** `CampoFecha`, `RangoDeFechas`, `Field` + `FieldLabel` y `formato`.
- **Piezas propias:** una versión de cada una (`FiltroChip`, `SelectorMultiple`, `ChipGuardado`, `BloqueAtencion`,
  `Persona`, `ImagenGlass`), registradas en `AGENTS.md` y en `PIEZAS_DEL_PROYECTO`. Documentadas en: `FiltroChip` en
  `/design-system/navegacion` (Filtros rápidos); `SelectorMultiple` en `/formularios`; `ChipGuardado` en `/navegacion`
  (pie del asistente) y Ajustes propios; `BloqueAtencion` en Ajustes propios › Vacantes (la pieza real con datos de
  ejemplo); `Persona` en `/data-grid` (regla «Una persona en una fila»; Resultados ya usa la misma); `ImagenGlass` en
  `/icons` («Cómo usarlos en una pantalla»). `FeedbackDialog` es un caso de `/modales` y `TourDialog` va en su tarjeta
  aparte: es la única ventana que no es `ActionDialog` (falta decidir si pasa a pantalla completa).
- **Insignia:** se queda el envoltorio `Badge` del proyecto (letra de `xs` y `sm` a 10.5 px) hasta que ingeniería fije el
  tamaño mínimo con una regla global; entonces se borra. Registrado en `AGENTS.md`, `PIEZAS_DEL_PROYECTO`,
  `diferencias.json` (`badge-letra-minima`) y Ajustes propios › Insignias chicas a 10.5 px.
- **Estilos forzados con «!»:** se aceptan algunos, pero se documentan y no deben ser demasiados (decisión 23).
- Sin decidir: la vista «tabla + detalle» de Tareas como variante de Maestro-detalle.
- **Réplicas del marco medidas contra el producto** (decisión 24): botones del header de 32 px (foto 34, menú 30);
  el logo de la empresa en el riel **abre el menú de la cuenta** a su derecha, no la barra; 8 px entre los iconos del
  riel; historial con 8 px del punto al título, fecha sangrada 20 px y la abierta en azul pleno; botón de empresa de
  cerca de 50 px (logo 28). **La X de los paneles laterales es la X estándar** (`CloseButton`, decisión 15).
  Revisadas otra vez el 5-oct contra el real: la réplica de la barra abierta sigue ya la revisión ReUI del 16-sep (baldosa
  del icono en `IconTile` con esquina de 12 px, «Nuevo» en `Badge primary-light xs`, filas del historial con la esquina
  del tema, selector de sección en `IconTile`, «Nueva conversación» en `size="lg"`); el menú flotante del riel lleva la
  esquina de la librería (12 px) y filas de 6 px de relleno vertical; la cabecera enfocada del header, 20 px a los dos
  lados; el vacío del caso «Bandeja» de Drawers dice lo mismo que la campana («Todo leído»).

## Avisos (toasts)
- **Todo aviso lleva su tipo** (1 oct, Nicolás: «hay unos toast que tienen la x a la izquierda y otros que no…
  estandarízalos todos»). El tipo pone a la izquierda el icono en su color: hecho (`success`, verde), información
  (`info`, azul), advertencia (`warning`, amarillo) o error (`error`, rojo). La X de cerrar va siempre a la derecha. Se
  pasa como último dato de `notify(título, texto, tipo)` y `notifyAction(título, texto, acción, tipo)`; sin tipo sale sin
  icono, que es lo que falta pasar fuera de Vacantes.
  Aplicado en: todo lo que usa Vacantes (inicio, tablero, ficha, lotes, creación de Elkin, compartir) y el agente
  contextual (`agent-kit`). Documentado en: `/design-system/estados` › Feedback › Toasts.
- **Avisos cortos** (8 oct, Nicolás: «hay muchos toast en selección que tienen textos demasiado largos… que mantengan el
  objetivo pero que no sean tan largos»). El título dice qué pasó; el texto, si hace falta, es **una sola línea** con lo
  que cambia o lo que hay que hacer (el correo que sale, quién quedó fuera, «llámala»). Nada de «queda en su historial»,
  «si deshaces ahora no sale» ni explicaciones de la regla: el botón «Deshacer» ya lo dice. Varias consecuencias → la más
  importante (en mover: el correo que sale, después lo cancelado, lo que espera, lo saltado).
- **Todo lo que guarda tiene su error** (8 oct, «revisa que sí estemos teniendo en cuenta todos los casos de error»): si
  no se guarda, nada cambia, el aviso rojo dice «No pudimos …» + una línea («Sigue en …», «No salió ningún correo») y
  trae «Reintentar», que repite lo mismo y cierra ese aviso. Si la acción venía de una ventana con datos escritos (una
  hoja de cálculo, una persona a mano, un comentario editado, un documento, comprar créditos), la ventana se queda abierta
  con lo escrito. Piezas: `noSeGuardo` y `avisoDeError` (`seleccion/propuestas/simular.ts`); se prueba con
  `?simular=falla-guardar` (y `falla-mover` para mover y rechazar).
  Aplicado en: toda Selección (Vacantes, vacante, ficha, Mis candidatos, importaciones, creación, plantillas, Créditos,
  AI Insights y Orbit Flow).

## Nada visible de prueba (8 oct)
- Nicolás: «cuidado que esto se puede colar en producción… ya no estamos probando, lo que haya por ahí así elimínalo».
  Ninguna pantalla lleva atajos de demostración a la vista («Probar con archivos de ejemplo», «Usar uno de ejemplo»,
  «Probar con una hoja de ejemplo») ni textos de maqueta («en el playground…», «sonaría…»). Cada control se comporta como
  en el producto. Los estados raros se enseñan con los simuladores de la dirección (`?simular=`, `?como=`), que no se ven.
  Aplicado en: Selección (Importar CVs, hoja de cálculo de Mis candidatos, agregar documento, voz de Serena).

## Selección sin pie, tablero ampliable y «Compartir» secundario (8 oct)
- El pie «Con la tecnología de UBITS · Términos · Política» no va en Selección (Nicolás: «quitemos esto de todo lado en
  selección, solo va a estar en el home»). `AppFooter` (zona protegida, con permiso) no se muestra en `/admin/seleccion/*`.
- El tablero de una vacante se amplía a pantalla completa con **«Ampliar tablero», que flota en la esquina de abajo a la
  derecha del propio tablero** (8 oct tarde, Nicolás: en la barra de filtros «no se asocia mucho a la tabla del kanban»;
  como el control de pantalla completa de un mapa o de Figma). Con tarjetas marcadas se esconde (abajo va la barra en
  lote). **Ampliado no va encerrado** (8 oct, Nicolás: «ya ampliado no debería estar encerrado… un cerrar a la derecha
  arriba en vez del reducir»): encima del menú y del header, una sola franja arriba con el nombre de la vacante (y cuántas
  etapas y personas), los filtros, «Agregar candidatos» y la **X para cerrar a la derecha**; debajo, las columnas a todo lo
  ancho, sin caja ni borde. La X o Escape vuelven (Escape cierra primero la ficha si está abierta). En el teléfono la X
  se queda junto al nombre.
- **Al arrastrar una tarjeta, las columnas se juntan hasta caber todas a la vista** y al soltar vuelven a su ancho
  (Nicolás: «si quiero arrastrar una card de la primera a la última de la derecha no deja, es súper difícil»). La librería
  del kanban trae su propia copia del arrastre, así que no se pueden sumar zonas de soltar aparte.
- **«Secundario» es el botón blanco con borde del DS** (`variant="outline"`), no el gris (`secondary`). «Compartir» de la
  cabecera de la vacante va en `outline` (Nicolás: «que el botón sea el fondo blanco del DS»).

## Insignias del tamaño del DS (8 oct)
- Nicolás: «esos badges los veo súper pequeños, hay que usar los del DS o flux-ui». En Selección las insignias van en el
  tamaño por defecto de la librería (12 px, alto 20 px): sin `size="xs"` ni `size="sm"` (se quitaron 158 en 58 archivos).
  El `Badge` de `src/shared/components/Badge.tsx` sigue subiendo a 10.5 px los tamaños chicos que queden en otras pantallas.

## AI Insights son insights (8 oct)
- VP de producto: «no sería llamarlo dashboard, sino AI Insights». Nicolás (8 oct, después): «lo de arriba + algo más
  creativo que realmente se vea wow de AI Insights, recuerda son insights»; pedirle dashboards a la IA y guardarlos «es
  para el futuro» (Suite AI Pro). Sin «Lo que viene» (Nicolás: «quita esta sección»).
- **Una sola pieza, «Lo que ve la IA»** (8 oct tarde, Nicolás: la lectura del periodo «podría ser primero… el texto un poco
  más grande y más cosas, que se cambie de un insight a otro»; «Lo que ve la IA hoy» y «Lo que encontró la IA» «son como lo
  mismo»). Una tarjeta con el halo suave de la IA:
  - arriba, **una lectura a la vez en grande** (`TextoResaltado size="2xl"`, lo de la IA con el degradado): qué tema es, si
    es «Para resolver hoy», por qué lo dice, un botón a donde se resuelve y, al lado, el dato que la respalda (curva de
    llegadas o barras con `Progress`);
  - **pasa sola a la siguiente cada 9 segundos**, como historias; se detiene al pasar el cursor o el foco, con «Pausar», y
    arranca en pausa si el equipo pidió menos movimiento;
  - abajo, **el índice de las siete lecturas** con su cifra (periodo, respuestas, embudo, vacantes, ritmo, tiempo,
    reparto); la barra de cada una avanza mientras está a la vista. En el teléfono se desliza de lado.
  - Las siete van apiladas en el mismo sitio: la tarjeta toma el alto de la más larga y nada salta al cambiar.
- **Debajo, tres bloques de lo que encontró la IA** (8 oct tarde, Nicolás: «¿qué más podríamos agregar abajo? Está muy
  vacío»), cada uno con su frase y a dónde ir, sin repetir las lecturas de arriba: «Candidatos que la IA destaca» (cumplen
  casi todo y siguen al principio, sin que nadie los mueva), «Qué vacantes atraen a la gente indicada» (qué parte de los que
  llegan cumple todo) y «Dónde espera más la gente» (días por etapa, la más lenta señalada). `dashboard/hallazgos.tsx`.
- Las cifras salen del mismo resumen que Vacantes; ninguna lectura repite a otra.
  Aplicado en: `/admin/seleccion/ai-insights` (`seleccion/dashboard/main.tsx` y `lecturas.tsx`). `TextoResaltado` suma
  el tamaño `2xl` (Fundamentos › Tipografía › Texto resaltado › «Grande»).

## Carpetas = etiquetas, y viven en la tabla (8 oct)
- Nicolás: «carpetas es lo que yo te dije que era etiquetas, no una u otra»; la VP de producto: «las carpetas sí son
  tags… que tú lo puedas filtrar… de lo más general a lo más a detalle, todo metido en filtros». Es **una sola cosa** y se
  llama **«Etiquetas»**: una vacante lleva una o varias. Ningún texto las presenta como algo que reemplaza a las carpetas,
  y no repiten el área ni la ciudad (para eso están «Área» y «Sede»).
- **Viven en la tabla de Vacantes, no en la vacante** (8 oct, Nicolás: «eso de las etiquetas debe estar afuera de crear
  una vacante y más atada a la tabla»). Crear y editar una vacante no las pide, y «La vacante» no las muestra. En la
  tabla:
  - **se administran** en el panel «Etiquetas» (botón junto a «Exportar»; 8 oct, «¿ya tienes la experiencia de cómo
    crear una etiqueta, cómo asociar una vacante con una etiqueta?»): todas, con cuántas vacantes las llevan y un
    buscador; «Crear etiqueta» (nombre y, si se quiere, sus vacantes de una vez; si lo buscado no existe, «Crear «…»»);
    al abrir una, se renombra, se marcan o desmarcan sus vacantes, «Ver sus vacantes en la tabla» filtra la tabla, y se
    elimina con confirmación. Crear, abrir y eliminar son vistas del mismo panel con «←». Una etiqueta existe aunque
    ninguna vacante la lleve, como una carpeta vacía; un nombre repetido (sin importar mayúsculas ni tildes) no se acepta;
  - **se ven** en la fila, junto al área: la primera y «+N» con las demás al pasar el cursor (en el celular no caben);
  - **se ponen, se crean y se quitan** desde el «⋯» de la fila y desde la barra de las elegidas, en la ventana
    «Etiquetas de…»: «Poner», donde lo escrito que no existe sale como «Crear la etiqueta «…»» (Enter la crea), y
    «Quitar», con cuántas la tienen;
  - **se filtran** en «Filtros» › «Etiqueta», con todas las que existen.
  Lo escrito se escribe como la que ya existe («comercial» es «Comercial»). El aviso dice «La nueva ya sale en
  «Filtros»» y trae «Deshacer»; si no se guarda, «No pudimos guardar las etiquetas» con «Reintentar».
  Aplicado en: la tabla de Vacantes (`inicio/tabla-vacantes.tsx`, panel en `inicio/etiquetas-vacantes.tsx`), la creación (también la de Elkin, sin el campo
  «Carpeta») y Mis candidatos, que usa la misma ventana (`VentanaEtiquetas` en `dialogos-base.tsx`; en su ficha
  «Crear una etiqueta…» va primero en el menú).

## Ancho y marco
- **Contenido en 1140 como máximo, centrado, con 24px de aire a cada lado** (17 sep; `p-6` en `RootLayout`). Con la
  barra abierta en una ventana de 1440 mide 1104; con la barra plegada o desde 1488px de ventana llega a 1140. Toda
  pantalla real va dentro de ese contenedor (PageShell o `mx-auto w-full max-w-285`), incluidas Inicio, Vacantes y las
  de relleno. **Descartado:** márgenes de 6px para llegar a 1140 exactos con la barra abierta («quedó sin padding»).
  Documentado en: `/design-system/navegacion` (Contenedor · 1140px máx.).
- **La barra lateral se pliega sola** por debajo de 1200px de ventana y recupera lo elegido al volver.
- **Cabecera de pantalla:** si falta espacio, los botones bajan de línea (nunca se cortan, ni a 320px). En pantallas con
  paneles que se abren y cierran, adaptar al ancho de la columna (container queries), no al de la ventana.
- **Chat de Suite AI en su columna de lectura de 768** (16 sep, Nicolás: «el ancho del chat debe ser el de antes»):
  mensajes, tarjetas y composer en `max-w-3xl` centrados dentro del contenedor de 1140; texto del agente `max-w-2xl`.
  Las sugerencias de la conversación nueva van **alineadas a la izquierda** dentro de la bandeja del composer, no
  centradas. Se probó llevar tarjetas y composer a 1140 y se descartó.
- **Panel del agente contextual pegado al borde derecho, y la pantalla centrada en lo que queda** (18 sep, Nicolás:
  «ahí están muy a la derecha y debería estar en el medio, o sea que tenga el mismo padding a la izquierda y a la
  derecha, y el agente contextual a la derecha pegado siempre»). El panel nunca deja aire a su derecha; la pantalla toma
  **todo** el ancho que queda a su izquierda, con **24 px de aire a cada lado**. Reemplaza la regla del 17 sep, que
  dejaba la pantalla en 688 px pegada al panel y todo el hueco a la izquierda.
- **Orbit Flow responde como el agente del design system** (8 oct, casos OF de Nicolás: «construye todos los casos de
  uso»). En la vacante, el inicio de Vacantes y Mis candidatos: cada respuesta lleva fuentes, copiar, útil / no útil,
  responder de nuevo y, la última, preguntas para seguir (`AgentMessage` con `body`); el pedido se copia o se corrige
  (`AgentThread onEditar`); «Razonando…» trae «Detener»; el panel deja arriba el último pedido al responder; Esc lo
  cierra (sin atajo para abrirlo: nada escondido); la conversación sigue al cerrar el panel (`useAgentThread` con
  `clave`); el «+» hace lo de la pantalla (en la vacante, agregar hojas de vida) y «Voz» dicta en la caja; el botón
  «Orbit Flow» lleva un punto cuando hay algo urgente. Nada cambia sin aprobación, y lo aprobado queda en el historial
  como «Propuesta de Orbit Flow». No responde ni hace nada por edad, hijos, estado civil, origen o salud.
  En pantallas medianas el panel baja a 360 px y en el celular va a todo lo ancho: la fila de debajo del header es el
  contenedor que lo mide (`@container` en `RootLayout`, zona protegida).
- **Orbit Flow abre debajo del header; el header no se mueve** (8 oct, Nicolás: «cuando se abra el agente contextual,
  no quiero que desde el header se abra; el header debería mantenerse donde está, y el agente contextual abajo del
  header»). El header sigue a todo el ancho y con el mismo largo; el panel va pegado al borde derecho, desde el borde de
  abajo del header hasta el final de la ventana, y la pantalla se angosta a su izquierda. Va en el hueco
  `#agent-panel-slot` de `RootLayout` (debajo del header), no en `#right-panel-slot`, que queda solo para «Actividad
  del agente» del chat de Orbit (copiada del prototipo, a toda la altura y acortando el header).
  Aplicado en: vacante de Selección (`/admin/seleccion/exploraciones/uno/…`), vacante y expediente de
  `vacantes/detalle`, crear encuesta, planes de formación. El editor de LMS ya lo hacía (18 sep).
  Documentado en: `/design-system/agente-contextual/configurador` («Probar en pantalla» y texto de la parte «Panel») y
  nota de la parte «Panel» en `/design-system/header`.
- **La pantalla del editor lleva la misma barra superior del workspace** (18 sep, Nicolás: «arriba a la derecha por qué
  solo está el perfil… que no falte nada y que sí se sientan reales»): novedades, ayuda, notificaciones, procesos y
  perfil salen de `HeaderActions`, el mismo componente del header, no de una copia.
  Aplicado en: editor de LMS (`/admin/aprendizaje/lms-creator/contenidos`).
  Documentado en: `/design-system/agente-contextual/configurador` y casos (el panel ya va contra el borde del escenario).

## Espaciado (18 sep)

Nicolás: «hay muchos componentes que no están consistentes en esto y se ven horribles, y ni están alineados… estandariza
qué espacio hay entre títulos y bajadas». Medido en el navegador antes de empezar: **1.157 pares de título+bajada con 10
separaciones distintas** (0, 2, 4, 6, 8, 12, 14, 16 y 24 px) en 101 rutas.

El estándar no se inventó: es el que ya trae la librería por dentro (`style-vega.css`).

- **Un título y su bajada: 4 px** (`gap-1`). Es lo que usan `item-content`, `card-header`, `field-content` y
  `popover-header`. Vale para la cabecera de página, tarjetas, filas de lista, menús y campos.
  Si el bloque tiene más piezas (acciones, gráficas, etiquetas), el par va junto en su propia columna de 4 px en vez de
  cambiarle el aire a todo el bloque.
- **Un icono (hasta 20 px) y su texto: 8 px** (`gap-2`). Es lo de `dropdown-menu-item` y `sidebar-menu-button`. También
  para dos acciones vecinas (incluidos los botones del header, que estaban a 10 px).
- **Una baldosa o un avatar (de 24 px en adelante) y su texto: 12 px** (`gap-3`). Por eso las filas de la barra lateral,
  que llevan baldosa de 28 px, se quedan en 12 y no bajan a 8.
- **No se pisa el espaciado de un componente de la librería.** `className` es para el layout de afuera (ancho, márgenes,
  truncado). Si una pieza ya trae su aire, se respeta. Dentro de un **botón compacto** manda el botón (4 px el chico,
  6 px el normal y el grande); un botón que hace de **fila** (ancho completo, texto a la izquierda) sigue la regla de
  fila: 8 o 12 px según el tamaño de lo que lleve a la izquierda.
- La escala general sigue igual: 16 px dentro de una sección, 24 px entre bloques, 32 px entre secciones largas.
- **Excepciones de la propia librería, que se respetan:** el `Item` en tamaño `xs` junta las líneas a 0 px (es su fila
  más compacta), el `Alert` usa 2 px, la línea de tiempo 2 px, el `Empty` y las ventanas (`Dialog`) 8 px, y el `Field` 12 px entre la
  etiqueta y su campo. No se les fuerza nada.

Dos errores concretos que había y no hay que repetir:

1. **La bajada como hermana en vez de dentro del contenido.** En el Centro de procesos, `ItemDescription` colgaba del
   `Item` con `basis-full pl-6.5` en vez de ir dentro de `ItemContent`: eso la dejaba a 10 px del nombre y desalineaba
   el icono, porque la librería solo alinea el icono con la primera línea cuando la bajada está dentro.
2. **La acción metida en el bloque de texto.** Con el enlace («Ver», «Retomar») dentro del contenido, la explicación
   perdía ancho y se partía en dos líneas; y puesto junto al nombre tampoco sirve, porque el nombre puede ser largo
   (Nicolás, 18 sep: «no puede estar ahí porque el título puede ser muy largo»). La acción tiene **columna propia** a la
   derecha de la fila, centrada: el nombre se corta con «…» sin moverla y todas quedan alineadas en el mismo borde.

Documentado en: `/design-system/espacio` (sección «Ritmo dentro de un bloque», con el Item y la Card reales).

## Centro de procesos (21 sep)
- **Una lista, no tarjetas dentro de una tarjeta** (Nicolás: «seguimos sintiendo que esto puede ser más hermoso, que
  requiere un glow up, que no es tan top»). Cada proceso era una tarjeta con borde dentro del panel, que ya tiene borde:
  tres marcos compitiendo. Ahora son filas separadas por una línea fina (`ItemSeparator`), como el panel de
  Notificaciones.
- **El azul solo significa avance.** Las acciones pasaron de enlaces azules a botones `outline` en tamaño `xs`, y
  «Historial» del pie a botón `ghost`. Así el único azul del panel es la barra de progreso. De paso, el enlace azul a
  12px no llegaba al contraste mínimo en modo oscuro.
- **El porcentaje es un dato, no un adorno:** se muestra con las piezas de la librería (`ProgressLabel` a la izquierda
  con el detalle, `ProgressValue` a la derecha con el número, y la barra debajo), en color de texto y `tabular-nums`.
  Antes iba escondido dentro de la bajada («78% · 234 de 300 filas»).
- **La baldosa dice el estado:** azul tenue (`bg-primary/10`) mientras corre, gris cuando espera turno.
- **La barra de lo que está corriendo lleva un brillo** que la recorre cada 2,4 s, para que se note que avanza. Se apaga
  con «reducir movimiento». Es una concesión sobre la librería (se pinta encima del indicador de `Progress`).
- **Nada de insignias de color en la cabecera:** se probó «2 en curso» en azul claro y en oscuro no llegaba al contraste
  mínimo; el resumen va como texto.
  Documentado en: `/design-system/header` (panel de procesos abierto) y `/design-system/marco` (captura).
- **Procesos en vivo** (24 sep): una pantalla publica en el centro lo que está haciendo con `process-store.ts`
  (`publishProcess`, `updateProcess`, `removeProcess`). Van **arriba** de los de ejemplo, con **la misma fila**: baldosa
  azul y barra mientras corren; gris, sin barra, con qué quedó pendiente y su acción al detenerse o terminar. La acción es
  opcional y, al tocarla, cierra el panel. Lo que corre suma a «en curso», lo detenido a «en espera» y lo terminado no
  suma (el resumen se queda en una línea). **Un trabajo que sigue corriendo no se quita al salir de su pantalla** (25 sep,
  «Importación masiva de CVs» completa): el proceso vive fuera de la pantalla, sigue en el centro y su acción lleva de
  vuelta (navega a la pantalla con lo que hay que abrir). Solo se quita lo que se deshizo.
  Aplicado en: importar hojas de vida (`almacenDeLotes` en `propuestas/importacion.ts`, avisos en `importar-cvs.tsx`):
  solo los lotes de esta sesión, no los que ya había. Título = nombre del lote; «Leyendo 8 de 13 · vacante» y su %;
  «En cola: empieza al terminar la parte 1» (más de 200 se parten); detenido, «Se detuvo en 2 de 10» / «Se cortó en 5 de
  12» y «Seguir»; terminado, «5 por confirmar · 1 falló» y «Revisar» (abre la revisión) o «Ver» (la gente que entró).
  Documentado en: `/design-system/marco/header` (texto de la parte «Centro de procesos» y nota bajo su interruptor) y
  `/design-system/marco/capturas` (regla «Procesos en vivo» de la barra superior).
- **Sin botón en el header, vacío propio y ejemplos solo en el design system** (7 oct, al unir el PR de Elkin): el
  centro se abre desde Notificaciones (y desde las pantallas que publican procesos). Si nadie publicó nada, muestra el
  vacío `PrimeraVez` («No hay nada en proceso»); los tres procesos de ejemplo solo salen con `ejemplos`, que usa el
  design system. Lo terminado se queda como «procesado» (baldosa verde con el visto) y suma al resumen. «Historial» abre
  lo que registre la pantalla con `setProcessHistory` (p. ej., las descargas de una encuesta); sin eso, solo avisa.
  Documentado en: `/design-system/marco` (demos «Centro de procesos» y «Centro de procesos vacío», regla «Sin procesos,
  el vacío»), `/design-system/header` (nota de Notificaciones) y el caso «Proceso en curso» de `/design-system/drawers`.
- **La bajada de una fila detenida o en espera se corta con «…» en una línea** (24 sep): el texto iba en un `span`
  en línea y se cortaba a media letra sin «…»; ahora va en bloque. Con la acción ancha («Seguir leyendo») el nombre y la
  bajada de un lote quedan muy cortos en los 320 px del panel.

## Botones de IA: siempre los últimos (23 sep)
- **Todo botón de IA va el último de su fila, a la derecha de todo** (Cristian, 23 sep: «los botones de IA van a la
  derecha siempre, como el último botón»). Generaliza la regla de «Agente IA» del 18 sep a «Resumir con IA», «Redactar
  con IA» y cualquier otro: orden «⋯» · terciario · secundario · primario · IA (el «⋯» primero desde el 25 sep, ver
  abajo). Vale en cabeceras, tarjetas, paneles y pies.
  Aplicado en: expediente del candidato («Resumir con IA» pasó de estar antes del selector de etapa a ser el último).
  Ya cumplían: detalle de la vacante, editor de avisos, editor de LMS, ficha rápida del candidato, crear vacante.
  Documentado en: `/design-system/ia/botones` (reglas) y las skills `flux-ui-storybook` y
  `revisar-contra-reui`.

## El «⋯» va primero (25 sep)
- **El menú de más acciones es el primero de la fila, a la izquierda de todo** (Nicolás, 25 sep: «ese kebab menu debe
  quedar al lado del editar, siempre es el último en la izquierda»; elegido en pregunta: primero de todo, también antes
  de «Compartir»). Orden completo: «⋯» · terciario · secundario · primario · IA. Reemplaza el «primario · «⋯» · IA» del
  23 sep, que había dejado el «⋯» entre el primario y el botón del agente. Su menú abre alineado a la izquierda.
  Vale en cabeceras, pies de ficha y barras de acciones. No aplica a los menús al final de cada fila de una tabla ni a la
  fila de iconos debajo de un mensaje del chat (no son filas de botones).
  Aplicado en: cabecera de la vacante de las tres exploraciones (`AccionesVacante`: ⋯ · Compartir · Editar · Importar CVs
  · Agente IA), barra de acciones al elegir varias (`BarraEnLote`), barra de «Mis candidatos» (`BarraBase`) y pie de la
  ficha de la base (`AccionesFicha`). Ya cumplían: los casos de Navegación (Shell básico y Detalle: ⋯ · secundario ·
  primario) y el expediente del candidato (navegación de registros | ⋯ · Resumir con IA).
  Documentado en: `/design-system/botones` (regla «El «⋯» va primero»), la parte «Más acciones» de
  `/design-system/navegacion`, las reglas de `/design-system/ia` y las skills `flux-ui-storybook` y `revisar-contra-reui`.

## Nombres de los agentes: Orbit y Orbit Flow (1 oct)
- **El super agente se llama «Orbit»** y **el agente contextual, «Orbit Flow»** (1 oct, Charlie: «Orbit para el super
  agente y Orbit Flow para el agente contextual»). «Suite AI» deja de verse en la interfaz: pestaña del menú lateral
  (marco protegido, autorizado), grupo del design system, títulos, migas, casos y textos. El botón que abre el agente
  contextual, la cabecera de su panel y su riel dicen «Orbit Flow». Las direcciones no cambian (`/suite-ai/…`,
  `/design-system/agente-contextual/…`) ni los comentarios del código.
  **Reemplaza** el nombre «Agente IA» del 28 sep (abajo): las reglas de posición, forma y peso del botón siguen igual,
  solo cambia el nombre. Donde abajo dice «Agente IA», léase «Orbit Flow».
  Aplicado en: `ReopenAgentButton`, `AgentRail`, `AgentPanelHeader`, `AppSidebar`, página `/design-system/agente-contextual`
  (título «Orbit Flow»), Unificación (nombres de pantalla y su generador).

## Botón «Agente IA» (nombre reemplazado por «Orbit Flow» el 1 oct)
- **Se llama «Agente IA»** (28 sep, Cristian: «todos los botones de IA que son medio contextuales deben decir Agente
  IA»). Antes era «Modo IA»; también reemplaza los «Asistente IA para planes/grupos» de Aprendizaje. Vale para todo botón
  que **abre el agente contextual**: se usa `ReopenAgentButton` sin `label`, que ya trae el nombre. No aplica a las
  acciones puntuales de IA («Resumir con IA», «Generar con IA», «Redactar con IA»), que dicen lo que hacen.
  Aplicado en: Planes y Grupos de Aprendizaje (5 pantallas, antes con `BotonIaSecundario` y otro texto), detalle de la
  vacante, editor de LMS, exploraciones 2 y 3 de Selección, casos del agente contextual, navegación y header.
- **El panel también se llama «Agente IA»** (28 sep, war room: «el título del agente contextual dice agente contextual,
  que suena raro»). Cabecera del panel (`AgentPanelHeader`), su riel minimizado y el drawer de agente del design system.
  Los «Resumir con IA» que abrían el agente pasaron a `ReopenAgentButton` (expediente y ficha rápida del candidato).
  ~~Pendiente: la pestaña «Suite AI» del menú lateral debe decir «Agente IA»~~ — resuelto el 1 oct: dice «Orbit».
- **Siempre el último de la fila, a la derecha de todo** (18 sep, Nicolás, cuando aún se llamaba «Modo IA»: «modo ai siempre va a la derecha, luego a la
  izquierda de él el primary, luego secondary y luego third»). Orden de izquierda a derecha: Terciario · Secundario ·
  Primario · Agente IA. Reemplaza la regla del 16 sep, que lo ponía a la izquierda del primario.
  Documentado en: `/design-system/navegacion` (opción Agente IA), configurador del agente (estado cerrado), nota en
  `/design-system/header`.
- **Forma:** pastilla completa por defecto; **solo el orbe** cuando la pantalla ya viene muy cargada (cabecera larga o
  botones con mucho texto). El nombre «Agente IA» sale al pasar el cursor.
- **No va en el header.** Con el panel del agente abierto no aparece.
- **El peso del texto lo pone el botón: 500** (18 sep, Nicolás: «ese trae un weight de 500 y no de 400 como lo hiciste»).
  `ReopenAgentButton` forzaba `font-normal!` y lo bajaba a 400; se quitó. Y el editor de LMS volvía a tener su **propia
  copia** del botón en vez de usar el compartido: ya usa `ReopenAgentButton` y solo le pasa su animación de entrada.
  Es el mismo error que ya había pasado el 16 sep; si vuelve a aparecer un «Agente IA» escrito a mano, es una copia.

## Tour del nuevo UBITS (1 oct)
- **`TourDialog`** con la estructura del bloque «How it works 5» de ReUI: insignia «Tour de plataforma»,
  «Nos renovamos para ti» y bajada centrados; tarjeta con 4 pasos en pestañas verticales (número junto al título y
  descripción) y, a la derecha, la captura real del paso enmarcada sobre el halo azul. Pasos: Inicio, Buscar o ir a
  (⌘K), Orbit y Orbit Flow (capturas en `src/shared/assets/tour/`). Avanza solo cada 6 s y se detiene con el cursor o
  el foco encima; sin avance con «reducir movimiento». Pie: botón para pausar o reanudar, «Paso n de 4», «Saltar el
  tour» y «Siguiente»/«Empezar».
- **Indicador de avance (1 oct, Charlie):** un divisor entre pasos; el paso activo lleva al pie una línea de 2px que se
  llena en negro (`foreground`) durante sus 6 s, sin pista gris, encima del divisor (`Progress`). Sin barras en el pie.
- **Cuándo se abre:** desde «Hacer el tour» de la tarjeta de la barra lateral, y la primera vez que se entra al admin
  desde el login (el login navega con `{ tour: true }` si `ubits-tour-visto` no está; ver `tour-pendiente.ts`).
  Pendiente: documentarlo en `/design-system/modales` si Nicolás lo pide.

## Enviar feedback (1 oct)
- **«Enviar feedback» abre una ventana** (`FeedbackDialog`, sobre `ActionDialog`), en la barra lateral y en el riel.
  Tipo en tarjetas de opción (Mejora · Error · Idea, con icono, nombre y para qué sirve; la ayuda del comentario cambia
  según el tipo), comentario de hasta 500 caracteres y 144px de alto,
  pantallazo opcional en el vacío de la librería a todo el ancho (como «subir portada» de Crear contenido), «Incluir la página donde estás: …» (marcado, sale de las migas) y «Pueden contactarme». Enviar
  se habilita con comentario y sin subida en curso; dice «Enviando…», cierra y avisa «Gracias · tu feedback llegó…».
  Reemplaza el selector de módulo de la plantilla Home operativo: la página actual ya dice dónde fue.
  **Tipo** (1 oct, cuarta vuelta): botones secundarios sencillos (`ToggleGroup` con borde), icono y nombre, del ancho de su
  texto; el elegido con borde y texto azules sobre azul muy suave. Siempre hay uno.
  Comentario y pantallazo van juntos a 12px; el resto de bloques, a 24px.
  **Pantallazo**: dos vías, «Capturar un área» y «Subir una imagen». Capturar esconde la ventana y pone una capa
  (`CapturaArea`) para arrastrar un rectángulo sobre cualquier parte de la interfaz; al soltar vuelve la ventana con
  «Recorte de pantalla.png · ancho × alto px · página». La imagen es simulada (sin permiso del navegador). Teclado:
  «Toda la pantalla» y Esc para cancelar. El adjunto ocupa todo el ancho y deja volver a capturar o quitarlo.
  **Tercera vuelta** (1 oct): comentario de 100px; **varios pantallazos**, hasta 5 (recortes o imágenes), en lista a todo
  el ancho con «Capturar otra área», «Subir otra imagen» y «n de 5» debajo; cada recorte se puede volver a capturar.
  **Agradecimiento** en la misma ventana (título «Feedback enviado»): Glass «Hecho» (glass-tick), «¡Gracias, Carolina!», «Tu feedback
  es muy importante para nosotros.» y, si dejó contactarlo, el correo. Sin resumen de lo enviado. Fondo con el halo
  azul de la interfaz (la imagen de `PageAmbience`), desde arriba de la ventana, al 40 % en claro y 45 % en oscuro; el
  halo va también en el formulario. 32px bajo la descripción antes del pie. **Sin confeti** (1 oct, oculto por pedido de diseño; el componente queda). Antes: **Confeti** al aparecer (`Confeti`, CSS
  sin librería): explosión desde el centro del icono con gravedad (1 oct). Cada pieza se mueve en dos ejes: en
  horizontal sale y frena por el aire; en vertical la explosión la lanza (más hacia arriba) y luego cae acelerando y se
  desvanece desde la mitad, así el recorrido es una parábola. 40 piezas de 3–4px, 1–1,3 s, verde del tema al 75 % y
  45 % y gris claro al 35 %. Capa propia sobre la pantalla anclada al icono, que se oculta al terminar. Sin clics; con
  «reducir movimiento» no aparece. Pie: «Enviar
  otro» (formulario en limpio) y «Listo». Ya no hay aviso flotante al enviar: la pantalla misma confirma.
  Pendiente: documentarlo como caso en `/design-system/modales` si Nicolás lo pide.

## Paneles del header
- **Sin botones de Centro de ayuda ni de Centro de procesos** (1 oct, Charlie). A la derecha quedan Novedades,
  Notificaciones y Perfil. «Centro de ayuda» pasa al menú de perfil, justo debajo de «Portal colaborador». El Centro de
  procesos sigue existiendo y se abre desde Notificaciones (y desde las pantallas que publican procesos). Con el espacio
  libre, el buscador reserva 2 × 207 + 28 = 442px (272px con solo iconos).
  Documentado en: `/design-system/header` (sin esos interruptores, nota bajo «Acciones de la derecha», menú de perfil
  abierto con «Centro de ayuda»), `/design-system/marco` (texto de las acciones y demos).
- **Menú de perfil en bloques** (1 oct, Charlie, con una referencia de ElevenLabs): arriba dos tarjetas con borde suave
  y esquinas de 10px —quién eres (foto, nombre y correo a 2px, rol) y «Vista actual · Administrador · Meta Colombia»
  con el icono ⇄—; la segunda es una opción del menú que lleva al Portal colaborador (reemplaza la fila «Portal
  colaborador»). Debajo, en lista con icono: Centro de ayuda, Cambiar contraseña y Tema; luego Cerrar sesión. Sin la
  versión al pie ni la insignia del rol (1 oct): «Vista actual · Administrador» ya dice el rol.
- **Novedades: cada mejora lleva su flecha** (1 oct): `BotonIcono` con chevron al final de la fila que abre la
  funcionalidad; el botón se estira sobre la fila, que se tiñe al pasar el cursor (`bg-accent`, el resaltado de los menús) y la flecha avanza 2px. El pie dice «Ver historial» (antes «Ver changelog»).
  Documentado en: `/design-system/marco/header` (menú de perfil abierto).
- **Anillos de Licencias y Créditos con puntas redondas** (1 oct, Charlie): un punto de 3px del color de cada extremo al
  inicio y al final del trazo (`account-gauge.module.css`), porque el degradado cónico corta en seco.
- **Buscador ⌘K con la diagramación de la referencia** (1 oct, Charlie): campo sin caja de 56px pegado arriba («Buscar o
  ir a…», como el header) y una línea; grupos en frase normal y gris («Preguntar a Orbit», «Resultados», «Ir a»); filas
  con margen y esquinas, baldosa de icono de 40px (el orbe en la pregunta), título y bajada; la acción con ↵ solo en la
  fila marcada, y la baldosa de esa fila un punto más oscura. Sin pestañas, sin «esc» ni pie (Esc sigue cerrando).
  **Contenido** (1 oct, segunda referencia): sin escribir, 1. Acciones rápidas (crear vacante, contenido y encuesta),
  2. Preguntar a Orbit (una pregunta sugerida) y 3. Últimas búsquedas (lo último abierto desde el buscador, guardado en
  el navegador; icono de reloj). Al escribir: grupo «Orbit» con «Pregunta «…»…» y debajo «Resultados» con lo que
  coincide (páginas reales del menú del admin, vacantes, candidatos y contenidos; sin tildes ni mayúsculas, hasta 8).
  Queda marcado el primer resultado, no Orbit; sin coincidencias se dice y queda Orbit marcado.
  Encabezados de grupo a 13px en negrita y títulos de fila a 15px en medium; las últimas búsquedas son 5 (se completan con ejemplos si hay menos) y la
  lista llega a 76vh para que se vean sin desplazarse en 900px de alto.
  El conteo de resultados sigue para el lector de pantalla.
- **Notificaciones y Centro de procesos en 320px** (18 sep; antes 392 y 376). El menú de perfil se queda en 248px.
- **La barra oscura del Centro de procesos, del mismo ancho que el panel** (18 sep, Nicolás: «eso de abajo debería
  tener el mismo ancho que el menú contextual, mira cómo se sobresale»): la `FloatingActionBar` de la librería se
  ajusta a su contenido y quedaba en 389px, 69 más que el panel. Se le fija el ancho del panel (320px) y la acción
  principal pasó a decir **«Nuevo»** para que las cuatro herramientas y el botón quepan en esa medida. Si algún día
  vuelve un nombre largo ahí, la barra se desborda otra vez.
  **Su fondo va en el gris del tema** (18 sep, Nicolás: «ese color de background no me gusta, coloca un gris»): la
  librería lo trae en un azul oscuro fijo que no está en el tema. En claro va el gris más oscuro («Texto») y en oscuro
  el gris de superficie suave, que lo separa del panel y del fondo.
  Documentado en: `/design-system/componentes` (ficha «Barra del centro de procesos»).

- **La acción de cada tarjeta de proceso va al pie, no junto al nombre** (18 sep, Nicolás: «no puede estar ahí porque
  el título puede ser muy largo»): el enlace («Ver», «Retomar») vive en el `ItemFooter`, a la derecha de la barra de
  avance. Así el nombre usa todo el ancho de la tarjeta y se corta con «…» cuando es largo. El aviso del pie del panel
  («Siguen corriendo si cierras el chat») va en texto chico para caber en una sola línea junto a «Historial».
- **Cabecera del editor de LMS a todo el ancho** (18 sep, Nicolás: «la miga de pan debe quedar bien a la izquierda, no
  atada a lo que hay en el centro, y el perfil bien a la derecha como en el workspace»): la fila de 60px sale del
  contenedor de 1140 y va de borde a borde, con las migas pegadas a la izquierda y el perfil a la derecha. El panel del
  agente arranca debajo de esa cabecera. Se quitó la insignia «Borrador».

- **La baldosa de la empresa en el riel abre el menú de la cuenta** (18 sep, Nicolás: «al dar clic aquí por qué abre la
  sidebar? debe es de mostrar el menú de la cuenta»). Es el mismo `AccountPopover`, en su versión `compact`.

## Menús, hovers y estados
- **Hover de menús como REUI** (16 sep): `#f5f5f5` (`--accent`) sobre menú blanco sólido, el mismo gris de la barra
  lateral, el header y los botones. En oscuro, `#262626`. Anula el modo «translúcido» de flux-ui en `global.css`
  (concesión para reportar a librería).
- **Selección activa en azul** (fila activa de la barra, riel, botones del header con su panel abierto): `bg-primary/10`
  + texto azul. La revisión del 16 sep pide «grises en hovers»: los hovers ya son grises; si se quiere gris también en
  los seleccionados, es una decisión pendiente.
- **Todos los paneles que cuelgan del header con las mismas esquinas: 12px** (17 sep, Nicolás: «nos dijeron que deben
  de quedar todas iguales… como está en notificaciones»). Es el radio del `Popover` de la librería, el que ya tenían
  Notificaciones y Perfil. El Centro de procesos estaba en 25,2px (`rounded-2xl`) y bajó a 12; sus tarjetas internas
  pasaron de 19,6 a 10px para no verse más redondas que el panel que las contiene.
  Las ventanas centradas (Novedades, buscador ⌘K) son otra familia: 19,6px, el radio del `Dialog` de la librería.
  Documentado en: `/design-system/header` (panel de procesos abierto).
- **Tema con tres opciones: claro, oscuro y sistema** (1 oct, Charlie). El selector deja la pastilla: bandeja de 8px y
  opciones de 6px (concéntricas, menos redondas que el menú). La fila entera recorre claro → oscuro → sistema con Enter.
- **Hover de los botones sin borde: un velo, no un gris fijo** (1 oct, Nicolás: «los hover en estos dos componentes no
  se ven», sobre «⋯» y «Compartir» de la cabecera de la vacante). El `ghost` de la librería (y `BotonIcono`) usaba
  `--muted` opaco (#f5f5f5): sobre el brillo azul de la cabecera o el gris de un marco desaparecía. Ahora es el color
  del texto al 4 % (6 % en oscuro), también con el menú abierto: sobre blanco da el mismo #f5f5f5. Regla sin capa en
  `src/index.css`; quien fuerza su hover con `!` lo conserva. Documentado en `/design-system/componentes/reglas` («Hover de
  los botones sin borde»). Concesión para reportar a librería.
- **Casillas visibles en cualquier superficie** (1 oct, Nicolás: «ese checkbox tampoco se ve», en el pie gris de
  «Importar CVs»). La casilla sin marcar lleva el fondo de la página y el borde al 30 % del color del texto (la
  librería: transparente y borde #e5e5e5). Marcada, con error, con foco o teñida a mano con `!`: sin cambios. El radio
  sin elegir lleva lo mismo (el mismo día, en el menú de estado de la vacante). Regla sin capa en `src/index.css`.
  Documentado en `/design-system/componentes/reglas` («Casillas y radios visibles»).
- **Elegir un estado en un menú: radio a la izquierda** (1 oct, Nicolás: «mejor a la izquierda radio button para que
  se vea mejor la selección»). El `DropdownMenuRadioItem` de la librería marca la elegida con ✓ a la derecha, lejos
  del nombre. El menú de estado de la vacante (`acciones-vacante.tsx`) usa ítems normales con el `RadioGroupItem` de la
  librería solo como dibujo (`inert`) y «(estado actual)» para el lector de pantalla.
- **La fila «Tema» del menú de perfil no se ilumina** (17 sep, Nicolás: «esto no debe de tener hover, el hover debe
  tenerlo solo el switch»). La fila se queda sin fondo al pasar el cursor; lo que responde es el selector sol/luna: su
  carril se marca (`bg-foreground/10`) y el icono apagado se aviva. La fila sigue siendo una opción del menú por
  accesibilidad (con flechas se llega y con Enter cambia el tema), solo pierde el resaltado.
- **Nada dentro de un panel puede ser más redondo que el panel** (18 sep): en los menús de 12px, lo de dentro va a
  10px como máximo. Se corrigieron el bloque de medidores del menú de empresa y el logo de la empresa (19,6 y 14 → 10),
  la baldosa del Centro de procesos (19,6 → 10) y las de Notificaciones (14 → 10). Hay un script que lo verifica:
  busca hijos con más radio que su contenedor en las 9 pantallas principales.
- **Tooltip como el del Storybook** (18 sep): esquina 8px, letra 13px, 8px de aire arriba y abajo. Se le pasan esas
  medidas porque el tema del playground tiene la escala de radios y de texto más grande que la del Storybook
  (`--radius` 14px aquí, 8px allá), así que las clases de la librería dan otros valores.
- **Tooltips:** siempre `Hint` / `HintContent` (esquinas 6px, letra 14px). Todas las acciones del header llevan tooltip
  menos el buscador.
- **X de cerrar:** `CloseButton`, círculo de 32px claro; la de los drawers también es redonda.
- **Enlaces** como el Storybook (17 sep): texto azul **sin subrayado**, subrayado al pasar el cursor. Nada de `underline`
  fijo en `variant="link"`.
- **Deshabilitado: el que trae la librería** (21 sep, Nicolás: «debes ver cómo es el color del primary en disabled en el
  design system y ese es el que debemos usar acá»). El botón entero baja al 50% y deja de responder; el azul se aclara
  sobre el fondo. No se inventa otro apagado ni se deja el azul a tope bajando solo el icono. Se quitaron los dos
  parches que lo hacían: la caja de escribir de Suite AI (`shared/composer.tsx`) y el panel del agente contextual
  (`agent-kit.tsx`), que además no se deshabilitaba de verdad. Referencia visible: la ficha «Deshabilitado» de
  `/design-system/botones`.

## Estado «Razonando» (21 sep)
- **Una sola forma en todo el producto** (Nicolás, con una captura de la app de referencia: «en la app cuando está
  razonando la ai, muestra esto, deberíamos también hacerlo así en nuestro chat, antes de entregar la respuesta»):
  el **orbe respira**, el **texto brilla** de izquierda a derecha y **al lado corren los segundos** («Razonando… 3s»).
  Los segundos aparecen al cumplirse el primero, para no mostrar un «0s».
- Antes había tres formas distintas: tres puntos que rebotaban en el chat, texto con brillo en el agente contextual y
  otra copia del brillo para «Generando otra versión…». Ahora las tres salen de `src/shared/components/AiThinking.tsx`.
  Esto cierra el pendiente que estaba escrito en `/design-system/ia`: «cada pantalla lo resuelve distinto».
- **Qué dice el texto:** en el chat de Suite AI, «Razonando…», porque no se sabe qué hará. En el agente contextual,
  lo que está haciendo de verdad («Buscando en la ficha…», «Revisando a las finalistas…», «Reescribiendo el párrafo 2…»).
- **La espera se alargó a 2,8 segundos** en el chat y en el editor (antes 0,9) y a 2,4 en los casos del agente
  contextual: con menos de un segundo no se alcanzaba a ver nada de esto.
- Se muestra **en lugar de** la respuesta, nunca a la vez. Documentado en `/design-system/ia` (Estados),
  `/design-system/suite-ai-chat` y `/design-system/agente-contextual/configurador`.

## Icono de IA (22 sep)
- **Lo que es de IA lleva el icono de IA** (Cristian, 22 sep: «lo que sea de IA lleva el icono de IA»). Todo lo que la
  IA produce o hace dentro de una pantalla normal —una evaluación, un puntaje o ajuste que calcula, una lectura, una
  etapa con IA, una nota del agente— lleva el icono antes del texto: en la pestaña, el título, la insignia, el ítem o
  la etiqueta de la barra. Se marca al nivel más alto que sea todo de IA (tarjeta entera → su título; tarjeta mixta →
  solo el bloque de IA).
- **Cuál: el orbe** (23 sep, Cristian: «no uses esos iconos de estrellas»). `<IconoIA />` de
  `src/modules/design-system/ia/icono-ia.tsx` es el `Orb` a 16 px, la misma marca de los botones de IA y del agente.
  Reemplaza la chispa (`SparklesIcon`) que se usó el 22 sep. Nada de estrellas ni chispas para marcar IA
  (`SparklesIcon`, `AiMagicIcon`, `MagicWand01Icon`, `StarsIcon`); esto cierra el «SparklesIcon o AiMagicIcon» que
  la auditoría de unificación del 17 sep dejó abierto: ninguno de los dos.
- Los botones de IA no llevan `<IconoIA />` a mano: `BotonIaSecundario` y `ReopenAgentButton` ya traen el orbe, y el
  primario `BotonIa` es el degradado. En la ficha rápida del candidato, «Resumir con IA» pasó a `BotonIaSecundario`.
- **Excepción: Evaluación CV no lleva el orbe** (23 sep, Cristian). Es el filtro de la etapa, como en la biblioteca de
  etapas de crear vacante (tipo estándar). En el expediente su pestaña, su tarjeta y su línea usan un icono normal.
- Aplicado en: expediente del candidato (pestañas y tarjetas de evaluación, notas del agente), vista rápida y tablero
  de la vacante (ajuste, Serena, evaluaciones), flujo de la vacante («Con IA») y crear vacante (etapas con IA).
  Documentado en: `/design-system/ia/superficies` (El icono de IA) y en las skills `flux-ui-storybook` y
  `revisar-contra-reui`. **Falta el barrido** del resto del producto (Home, Suite AI, LMS, plantillas), que todavía
  marca IA con `SparklesIcon`, `AiMagicIcon` y `MagicWand01Icon`.

## Botón de IA («Nueva conversación»)
- **Se queda como estaba** (17 sep, Nicolás: «deja este botón como estaba»). Es el `Button` de flux-ui con el degradado
  de marca de la IA encima (`new-chat.module.css`): azul #285ee6 → morado #7e2be0 → rosa #d22d6a → naranja #eb6233, en
  horizontal, en una cinta del doble de ancho que se desliza al pasar el cursor. Alto 40px, letra medium, sin icono.
  En el riel, la versión redonda de 40px con el «+».
- **Probado y descartado:** cambiarlo por el `AiButton` del Storybook (tono arcoíris, degradado a 277° más saturado,
  estrella, chispa que gira y partículas). La copia (`AiButton.tsx` + `ai-button.css`) nunca se usó y **se borró el
  5 oct**: el único primario de IA es `BotonIa` (`src/shared/components/BotonIa.tsx`), este mismo degradado en pastilla.
- El rosa está un punto más oscuro que el entregado (#d6306e → #d22d6a) para que el texto blanco pase 4,5:1.

## Barra lateral
- **Filas en medium (500) y en el color de texto del tema, negro** (18 sep, Nicolás: «para los estados default
  utilicemos el negro del DS, tanto para el icono como para el texto», como «Enviar feedback»). Reemplaza la decisión
  del 16 sep, que las ponía en gris. Los títulos de sección («Productos», «Herramientas») siguen en gris. La fila
  activa sigue en azul con su fondo al 10%.
- Tarjeta de invitación sin «3 cupos libres».
- **La tarjeta del pie invita al tour** (1 oct, Charlie: «que hable sobre hacer el tour de la plataforma ya que
  transformamos la experiencia de usuario»): «Nos renovamos para ti», «Una experiencia más simple, rápida e intuitiva.
  Conócela en 2 minutos.» y botón «Hacer el tour». Ilustración propia del tour (`TourPreview`): la plataforma en
  miniatura con un bloque resaltado, el cursor, «Paso 1 de 3» y «2 min», con tokens del tema.
- **Menú de empresa con la organización del menú de perfil** (1 oct, Charlie): arriba dos tarjetas con borde suave y
  esquinas de 10px —la empresa (logo, nombre y colaboradores pegados, sin espacio entre líneas) con sus dos anillos tras
  una línea, y «Tus empresas · Cambiar de empresa · 4 empresas» con un chevron a la derecha, que abre el submenú (sin la flecha de
  la librería)—; debajo, una línea y la configuración en lista con su título «Configuración». En el submenú, nombre y plan también van pegados.
- **El botón de la empresa lleva el plan debajo del nombre** (1 oct, Charlie): «Plan» y una insignia xs de la insignia
  del proyecto (10.5px). **Esencial en azul** (`info-light`) y **Pro en violeta** (forma de `info-light` con el token
  nuevo `--premium`, 7,4:1 en claro y 5,4:1 en oscuro). Meta Colombia es Pro; las demás empresas, Esencial.
  `--premium` es el único violeta del tema y solo marca el plan Pro (no reabre la regla «Info en azul, no en violeta»).
  Concesión para el equipo de librería: Ajustes propios › «Insignia del plan Pro». Documentado también en `/design-system/color`.
- Empresas sin logo: baldosa azul muy suave con iniciales en gris oscuro, que no parezca insignia.
- Licencias con anillo azul; Créditos de IA con el degradado de la IA.
- El botón de abrir o cerrar la barra nunca va arriba del logo (en el editor va en su cabecera, junto a las migas).

## Tipografía y legibilidad
- **Sin letra monoespaciada** en la interfaz; números con `tabular-nums`.
- Nada por debajo de 13px en textos que se leen (chat y paneles).
- **Nada por debajo de 10.5px en ningún texto** (25 sep, Nicolás: «lo mínimo que deben ser es de 10.5 … debemos sí o
  sí priorizar accesibilidad»). Las insignias `xs` (9.6px) y `sm` (10px) de flux-ui se importan de
  `@/shared/components/Badge`, que las sube a 10.5px con el mismo alto. Falta la zona protegida: «Nuevo» de la barra
  lateral y la tarjeta de invitación (9–10px).
- Letra de la interfaz: **Inter** (`Inter Variable` en `global.css`). La prueba de Inter Tight se descartó en la reunión
  del 16 sep y volvió Inter en la rama `prueba-fusion`.

## Texto grande con resaltado (23 sep)
- **Lo normal en medium y lo resaltado en negrita** (Dave, 23 sep). Si el resaltado habla de la IA lleva el degradado
  de la IA de UBITS (azul #285ee6 → morado #7e2be0 → rosa #d6306e → naranja #eb6233, los de la clase `vars` de
  `src/shared/components/tarjeta-ia.module.css`); si no, el azul de UBITS (`primary`).
- Pieza: `TextoResaltado` + `Resaltado` (`ia` para el degradado) en `src/modules/design-system/tipografia/texto-resaltado.tsx`.
  Va con `Text` porque `Heading` no deja cambiar el peso. Documentada en `/design-system/tipografia` (Texto resaltado).
- Aplicado en: «Tú lo imaginas, nosotros lo generamos» (portada, imagen de escena del video, diapositiva de la
  presentación) y las instrucciones de los modales de recurso del LMS («Sube el archivo PDF…»).

## Modo oscuro
- **Grises neutros, nada de violeta** (17 sep, Nicolás: «tiene unos tonos violetas raros»). La librería trae su propio
  tema oscuro para «ubits» con `[data-theme="ubits"].dark`, que pesa más que un `.dark` suelto y teñía todo de violeta
  (fondo #0d0b1a, superficies #221e3a, primario lavanda #a08cff). Nuestro bloque de `src/index.css` repite esa misma
  forma de selector para que manden los tokens del playground: fondo #0a0a0a, tarjeta #171717, apagado #262626 y
  primario #6c96fe. **Concesión para el equipo de librería.**
- **«Info» en azul, no en violeta** (17 sep): la librería lo trae en violet-500 (#8e51ff) y en oscuro no llegaba a
  4,5:1. Ahora es #005aa6 en claro (texto del tinte #004f94) y #61b1f8 en oscuro. Se usa en insignias como «Nuevo»,
  «Activo» o «En detalle», y en bordes `border-info/15`.

## Accesibilidad (condición de cierre)
- **WCAG 2.2 AA en claro y oscuro** (16 sep): `verificar.mjs` con 0 fallos de axe y revisión a mano de lo que axe no
  ve (degradados, estados con el cursor encima, menús y ventanas abiertos, teclado, 320px).
- Tokens ajustados para AA (16 sep): `--primary` oscuro `#6c96fe` con **texto azul marino en los botones azules**
  (pendiente de aprobación de Nicolás); `--muted-foreground` claro `#6d6d6d`; `--destructive` claro `oklch(0.51 0.21 27.3)`
  y oscuro `oklch(0.78 0.15 22.2)`; `--destructive-foreground` claro rojo oscuro.
- Texto blanco sobre el degradado de la IA («Nueva conversación»); rosa del degradado `#d22d6a` (4.67:1).
- Saludo de Suite AI: **uno por día**, con animación solo de entrada (17 sep). Ya no rota, así que cumple 2.2.2.

## Cabecera de página (22 sep)
Nicolás: «necesito que me ayudes a estandarizar todo y generar consistencia… acá los botones están abajo y aquí están
arriba». Una sola cabecera, `PageHeader` (`src/shared/components/PageShell.tsx`), para producto y design system.
- **Los botones van en la fila del título, a la derecha.** Antes se alineaban con el final de la cabecera, así que en
  las 29 pantallas con descripción larga bajaban a la altura de la última línea, y en el editor de LMS iban arriba.
  ~~Si no caben, saltan debajo del título~~ (reemplazado el 13-oct). **Un título largo no baja los botones** (13 oct,
  Elkin, al ver «Casos · Límites» en Resultados de Encuestas): desde el ancho mediano la fila no salta, el título se
  encoge y, si la pantalla lo pasa con `truncate` + `TextoCompleto`, se corta con «…» y se lee entero en el globo. En
  celular siguen saltando debajo del título; nunca a la altura de la bajada. Pendiente de ver con Nicolás.
- **Todo lo de la fila del título comparte el mismo centro óptico** (22 sep, Nicolás: «los ctas de la derecha están un
  pelín más arriba»). Se centra con el cuerpo de las minúsculas del título, no con su caja: centrados con la caja, los
  botones quedaban a la altura de las mayúsculas, 3px por encima de donde el ojo pone el centro. Botones y etiqueta de
  estado van `translate-y-0.5`; la flecha de volver `mt-1` en título grande y mediano. Medido en 55 pantallas: botones,
  flecha y estado a menos de 1px del centro de las minúsculas (`cabeceras.mjs` de la sesión del 22 sep).
- **La etiqueta de estado siempre centrada.** Sin `flex`, una insignia suelta se apoyaba en la línea de texto y quedaba
  2px más abajo que una envuelta: cada pantalla la ponía a una altura distinta.
- **Pestañas «line»: la raya de la activa se apoya sobre la línea gris** (Nicolás: «mira esos tabs cómo están de mal»).
  La librería les pone 3px de relleno a todas las listas de pestañas y la raya quedaba 2px por encima de la línea. Se
  quita en `src/shared/styles/global.css` para la variante «line»: afecta a todas las pestañas de ese tipo.
- **Volver es siempre la flecha junto al título.** El enlace «‹ Volver a…» encima del título se retiró: se leía como
  una segunda miga de pan, y la miga vive arriba. `back.variant` se acepta pero ya no cambia nada. El configurador
  de Navegación dejó de ofrecer «Con texto arriba».
- **Las plantillas del design system usan la misma cabecera.** `EncabezadoPantalla` (Admin y Colaborador: 16
  pantallas) era una copia con el título un nivel más chico y la flecha con borde; ahora envuelve a `PageHeader`.
- **Archivo fuera del menú del design system.** Dashboard, Dashboard RR.HH., App shell 2 y 3 y Shell test tienen su
  header de entonces y se leían como vigentes. Siguen en «Todas las pantallas», como archivo (igual que se hizo con
  «Suite AI (concepto)»).
- **Nada de recursos retirados en el design system.** Color mostraba `degradado-ia.png`, reemplazado por la tarjeta
  «Halo» el 18 sep: ahora muestra la `AiCard` y el botón «Nueva conversación» reales. Piezas de IA usa `Orb` en vez de
  su copia de la imagen. El configurador del agente era la única página con un orbe grande junto al título: se quitó.
- **El editor de LMS pinta el ambiente azul.** Es una capa que tapa el marco general, así que monta `PageAmbience`
  dentro de su columna de contenido.
- **Resuelto (22 sep):** el panel del editor de LMS es el canónico; el del kit se rearmó con sus piezas.

## Un solo panel del agente contextual (22 sep)
Nicolás: «este agente contextual no tiene bien el chat como debe quedar, tiene un montón de acciones arriba que no son,
eso de minimizar y ampliar ¿para qué?».
- **El panel se abre y se cierra; nada más.** Sin ampliar (720px) ni minimizar (riel de 60px). Cabecera: orbe,
  «Agente contextual» y cerrar. Se vuelve a abrir con «Agente IA», al final de los botones de la pantalla.
- **Una sola implementación.** `ContextPanel` (kit del agente) era una versión paralela con esos botones y una caja de
  escribir hecha a mano. Ahora se arma con las piezas del editor de LMS (`AgentPanelFrame`, `AgentPanelHeader`,
  `AgentContextStrip` con el icono de lo que se mira, `AgentPanelBody`, `ComposerTray`) y la caja del chat de Suite AI
  (`Composer`, con «+» y voz). Lo usan Avisos internos, la vacante, los 8 casos del design system; el drawer del
  agente y el pie «caja de conversación» de los drawers usan el mismo `Composer`.
- **Los textos del agente vuelven a como estaban** (23 sep, Cristian: «modifiquemos de nuevo a como estaban los textos,
  de peso, excepto lo que se cambió en Suite AI»). `AgentNote` otra vez en 14px y gris, con el orbe de 22px, y los
  rótulos en mayúscula (`KICKER`) en 11px. Reemplaza lo del 22 sep (letra del texto a 16px y rótulos a 13px). El
  saludo del chat de Suite AI **sí** se queda en 600.
- El caso «Estados del panel» dejó de mostrar ampliado y minimizado; «Comparar opciones» ya no amplía el panel.
- **Entra y sale deslizándose, nunca de golpe** (25 sep, Nicolás: «quiero que lo cierre suavemente, no tan brusco como
  lo hace hoy»). Antes se quitaba en un cuadro y la pantalla saltaba 452px. Ahora `AgentDock` (kit del agente) encoge
  la columna de su ancho a cero y el panel se va por el borde derecho mientras se desvanece; al abrir, al revés. Abre
  en 350 ms con la curva de la barra lateral; cierra en 450 ms con una curva pareja (con la misma curva recorría el 80%
  en 100 ms y seguía viéndose brusco). Al cerrar, el foco pasa a «Agente IA». Con «reducir movimiento» cambia sin
  animación. Si la pantalla arranca con el panel abierto, no entra animado. Lo usan `AgentStage` (los casos y Avisos
  internos), el editor de LMS y las tres exploraciones de Selección. **Falta** el detalle de vacante de Cristian
  (`vacantes/detalle`, `vacante-view.tsx` y `expediente-view.tsx`): sigue quitándolo de golpe hasta que él lo pase a
  `AgentDock`. El configurador cambia de estado sin animación a propósito: su vista previa es de anatomía, y los
  nombres de las partes quedarían recortados dentro de la columna que se encoge.

## Saludo del chat de Suite AI (22 sep)
- **En 600 (seminegrita)**, no en 500 (Nicolás: «pon este texto en 600»). Vale para las tres frases del día. Está en
  `admin/suite-ai/chat/components/chat-view.tsx` y en su réplica `design-system/suite-ai-chat/components/chat-preview.tsx`.

## Miga de pan (18 y 21 sep)

- **Va arriba, en la barra superior, pegada al botón que abre y cierra la barra lateral** (Nicolás: «la miga de pan
  debe quedar es arriba»). Una sola implementación: `PageBreadcrumbs`. `PageHeader` ya no la pinta.
- **En la barra de arriba nunca se parte en dos líneas.** Medido el 18 sep: se partía en **18 pantallas** (la barra
  mide 60px y comparte fila con el buscador y las acciones). Reglas del modo `compact`, que es el que usa la barra:
  - **Dos niveles como mucho**: el de encima y dónde estás. La ruta completa se guarda para las migas que van dentro
    de una página (las plantillas), donde sí hay ancho.
  - **Sin envolver**, y el nombre de la pantalla se corta con «…» si aun así no cabe.
  - **Por debajo de 64rem de barra** (por ejemplo con el panel del agente abierto) queda **solo el nombre de la
    pantalla**: con tan poco ancho, media ruta cortada no dice nada.
  - Los tramos que no son una pantalla del menú **no se muestran**: en el chat salía «Nuevo chat › Chat › Política de
    vacaciones» y ese «Chat» no lleva a ninguna parte.
  Comprobado en las 105 rutas: ninguna se parte y ninguna corta el nombre entre 1024 y 1920 de ventana.
- **Ese es su único sitio** (21 sep, Nicolás: «la lógica quedó que el breadcrumb debe estar es arriba con el cierre y
  apertura de la sidebar y no arriba del título»). Quedaba una miga dentro de la página en las plantillas de admin
  (Encuestas, Gestión de usuarios, Planes…): se veía dos veces y empujaba el título hacia abajo. Se quitó.
- **Cómo se le dice a la barra dónde estás.** Por defecto la barra saca la ruta del menú. Si la pantalla está más
  adentro de lo que el menú conoce («Encuestas › Crear encuesta»), se le pasa `breadcrumbs` a `PageHeader` —que ya no
  la dibuja, solo la registra— o se llama a `useSetPageCrumbs` (`src/shared/components/page-crumbs.ts`). Las migas se
  guardan junto con la ruta, así que al cambiar de pantalla no se ve un instante la anterior.
- **En el design system:** el configurador de `/design-system/navegacion` ya no ofrece «migas arriba del título».
  Tiene una sección propia, «Miga de pan (en la barra de arriba)», con los tipos (simples, con «…», con hermanos o sin
  miga), y la vista previa dibuja la barra superior —en gris de slot, porque la pone el marco— con el botón del menú y
  la miga dentro. «Volver» sigue junto al título y convive con la miga.

## Piezas conectadas con la librería (18 sep)
- **El atajo `WS` ya no fuerza la esquina.** Ponía 8px «por el patrón reui» en 128 botones de 45 pantallas, pero el tema
  ya da los 12/10/8 que pide la página de Botones. Quedó vacío en `drawers/components/drawer-styles.ts`.
- **Migrados a componentes de la librería, con 0 píxeles de diferencia** (comparación contra el estado anterior):
  filas de los drawers de acciones y notificaciones y del menú del producto → `Item`; pastilla del tablero → `Badge`;
  ✕ del chip de filtro → `Button`; barra de licencias → `Progress`; caja de texto del agente → `Textarea`;
  caja de escribir del configurador del chat → el `Composer` real (estaba dibujada a mano por error mío).
- **Lo que se queda como `<button>` a propósito** (meterlo en un `Button` sería peor): el nombre clicable dentro de una
  fila de tabla (es texto que solo necesita foco), el índice lateral de un documento, la opción de un listbox con
  `role="option"`, y la barra de un gráfico. (El `AiButton` copiado se borró el 5 oct: no tenía usos.)

## Configuradores del design system
- **Panel de controles fijo** al lado de la vista previa, con el alto de la ventana y scroll propio (17 sep), para
  cambiar opciones sin perder de vista el resultado. El header no lo usa: su vista previa va arriba y los controles
  debajo en tres columnas.
- **«Probar en pantalla» muestra la pantalla real** (22 sep, Nicolás: «mira cómo queda de feo, y el chat no es así en
  realidad… que al dar clic en probar en pantalla sí muestre la realidad y cómo queda bien»). El componente configurado
  va dentro del **marco real del producto** —barra lateral, header, ambiente azul y pie de verdad— con `PantallaReal`
  (`design-system/components/anatomy/pantalla-real.tsx`), que les hace creer que están en una ruta del producto. Cada
  uno en su sitio real: el chat en Suite AI (columna de 768 centrada, composer abajo, actividad a toda la altura); el
  agente a la derecha de una pantalla del Workspace; la tarjeta de IA dentro del Inicio real, en Quick actions; la
  cabecera de página con su miga en la barra de arriba; drawers y modales abiertos sobre una pantalla del Workspace
  con el fondo oscurecido (van fuera de la capa: dentro, la librería no pinta el velo). Barra lateral y Header no
  tienen el botón porque son el marco mismo.
- **Todos llevan «Probar en pantalla»** (`TryButton` + `TryOnScreen` del kit de anatomía): el componente configurado a
  tamaño real, sin nombres, sin bordes punteados y **sin rayado en los slots** (en su lugar, bloques grises tenues, como
  contenido real). Se cierra con Escape y devuelve el foco al botón. La capa es una rejilla de dos filas
  (`grid-rows-[auto_minmax(0,1fr)]`): franja de 53px arriba y el resto para la maqueta. Ojo: el Dialog de flux-ui es
  `grid`, así que `flex flex-col` en su `className` no aplica.
- **En el menú lateral solo va el configurador** de cada componente (17 sep): las pantallas de ejemplo siguen existiendo
  y se abren desde los casos, pero no ensucian la lista.
- **Los selectores del panel van tal como los define la librería** (18 sep, decisión de Nicolás: «dejarlo así, ReUI
  puro»). Los 70 chips —los casos de uso y todas las opciones del panel— son `ToggleGroup` + `ToggleGroupItem`, sin una
  sola clase que cambie su aspecto. La opción elegida queda con el gris de la librería (`bg-muted`), **no** con el azul
  suave que se le forzaba antes.
  Costo medido y aceptado: en modo claro el chip elegido queda en #F5F5F5 contra el blanco de los demás, es decir se
  diferencian **1,09:1**; en oscuro se nota algo más. Si alguna vez se decide reforzarlo, la vía acordada era subir solo
  el borde del elegido con un token, nunca volver a pintar el fondo.
  Ojo: esto vale para los **selectores de opciones**. No cambia el azul del icono del header con su panel abierto
  (`header-icon.ts`) ni el del sol/luna del selector de tema: son estados de «abierto» y «modo activo», no chips.

## Ambiente azul (fondo de todas las pantallas)
- **Transversal desde el 18 sep** (pedido de Nicolás, dos veces): el brillo azul difuminado que coronaba solo el Inicio
  ahora lo pone el **marco de página** en **todas** las pantallas del Workspace, para que se sientan de la misma familia.
- **Menos en Suite AI**: ni el producto (`/suite-ai/**`) ni sus plantillas (`templates/suite-ai`, `templates/home-suite-ai`).
  Suite AI tiene su propio ambiente (el degradado de marca del orbe y de «Nueva conversación») y serían dos peleando.
- **Va por debajo de todo**, así que también se ve en las pantallas que todavía son un slot: el rayado del slot es
  semitransparente y el azul se transparenta. Esa era la condición que puso Nicolás.
- Vive en `src/shared/components/PageAmbience.tsx` (imagen `shared/assets/ambiente-azul.png`), montado en
  `RootLayout.tsx` **sobre el contenedor con scroll**, no dentro del que tiene 24px de aire: así arranca pegado al
  header y ocupa todo el ancho. El Inicio ya **no** lo pinta por su cuenta: se quitó para no duplicarlo.
- **La imagen está recortada para que arranque en su punto más brillante** (18 sep). La original tenía el brillo a
  media altura: al estirarla, el resplandor se iba al centro de la pantalla en vez de quedarse pegado al header.
  Se recortó de la mitad hacia abajo (`magick -crop 800x173+0+172`), así que ahora empieza en alfa 0,226 y se desvanece.
  Estirada sin `object-fit` porque es un degradado.
- **Intensidad vigente (21 sep): alto 22rem, 25 % en claro y 30 % en oscuro.** Nicolás: «mira cómo ataca la pantalla
  de feo, no deja ver nada literal, tiene que ser mucho más suave». Los valores anteriores (32rem, 70 % y 85 %) daban
  **31 puntos de separación contra el blanco y 75 contra el negro**, y el velo llegaba a media pantalla. Ahora son
  **11 en claro y 26 en oscuro**, y se apaga antes del primer bloque de contenido.
- **Si alguien la vuelve a cambiar:** medir el píxel, no mirar. En una captura de 1440, a la derecha del título:
  `magick captura.png -crop 1x1+900+120 -format "%[pixel:p{0,0}]" info:`, y comparar con el fondo de la misma
  pantalla abajo. Mirar además **dónde cae el brillo**, no solo si la imagen está: ese fue el error de la vez pasada.
  En oscuro hace falta más diferencia numérica que en claro para que se lea lo mismo (por eso 26 contra 11).

## Listas largas: switch, filtros, tabla y paginación en la misma pieza
> **Reemplazada en parte el 5 oct:** la pieza ya no es `MarcoTabla` sino `TablaDatos` (ver «Auditoría del 5 oct»).
> Quedan pendientes de migrar los usos del `MarcoTabla` de Selección que llegaron con el PR #23.

- **Una lista larga es una sola pieza** (21 sep, Nicolás: «tooodo debería estar asociado a una misma tabla, desde
  el switch tab hasta la información, y lo del contenido debería de tener paginación»). Nada de tres bloques sueltos
  flotando uno sobre otro.
- **Esa pieza es la tabla del design system** (28 sep, Nicolás: «¿por qué no agarraste la del DS? […] tiene fondo gris
  y luego ya la tabla en blanco y tiene el título arriba si es que es necesario y la paginación dentro de la zona
  gris»). Es la forma de `DataGridList` (`/design-system/data-grid`): un `Frame` gris; arriba, en lo gris, el título
  (solo si la pantalla no lo dice ya) con sus acciones o el switch de vistas, y debajo los filtros; la tabla en un
  panel blanco sin relleno; y abajo, en lo gris, la paginación. Se arma con
  `src/modules/admin/seleccion/propuestas/components/marco-tabla.tsx` (`MarcoTabla`: `titulo`, `descripcion`,
  `acciones`, `filtros`, `pie`) y no con `DataGridList` directo, porque su paginación viene en inglés. Reemplaza a la
  «tarjeta blanca con `Separator`» del 21 sep. Aplicado el 28 sep en Vacantes 1 y 3, Reclutamiento, Candidatos 2,
  Créditos 1 (agentes e historial) y las bibliotecas de LMS 1 y 2. Sin aplicar todavía: la tabla del pipeline dentro
  de la vacante de la 2 (vive en la tarjeta de pestañas de la vacante) y las listas de planes de formación (de David).
- **La pestaña maestra es la convencional, subrayada** (`TabsList variant="line"`), fuera de la tabla (28 sep, war room,
  Carlos: «la tab master es esta»). El switch (`variant="view"`) queda para casos especiales —un filtro dentro de un
  panel, como «Todos / Elegidos»— y sus reglas se irán escribiendo. Reemplaza la del 21 sep, que ponía el switch para
  dos vistas hermanas dentro de la tarjeta. Aplicado en: Planes de formación (contenidos / competencias).
- **El pie de paginación es uno solo** para todas las listas: `src/modules/admin/seleccion/propuestas/components/
  paginacion.tsx` (hook `usePaginacion` + `PiePaginacion`; dentro de `MarcoTabla` va con `enMarco`, porque el pie gris
  ya pone el relleno). Dice «Filas por página», «Viendo 1–10 de 19 vacantes» y
  «Anterior / Siguiente» **en español**: la paginación de `DataGridList` viene en inglés y no se puede traducir.
- La tabla lleva `table-fixed` con un ancho declarado por columna: sin eso las columnas saltan al cambiar de página.
- **Reemplazado el 28 sep (war room, Carlos):** todas las tablas son la del design system (Data grid: caja gris con
  título, conteo, buscador a la derecha, filtros y orden en cada columna; filtros de afuera solo si hacen falta) y la
  paginación va en español con «Anterior / Siguiente» y números. La pieza es `TablaDatos`
  (`src/modules/design-system/data-grid/tabla-datos.tsx`): DataGridList tal cual, con el pie de `PiePaginacion` dentro de
  su marco. Las listas de Selección con `Table` + `PiePaginacion` quedan pendientes de pasar a `TablaDatos` (son de
  Nico).
- Al filtrar hay que **volver a la página 1**, o se busca algo y la pantalla sale vacía porque quedó en la página 4.

## La barra de una lista larga: dos filas, no una
- **Arriba qué se está mirando, abajo con qué se filtra** (22 sep, Nicolás: «quizás arriba el switch tab y a un lado
  algo que diga filtros o abajo de eso, siento que en una sola línea no lo veo tan bien todo»). Primera fila: el
  switch de vistas y, a la derecha, cuántos registros hay y cuántos se están viendo. Segunda fila: el rótulo
  «Filtrar» con su icono, los filtros y, solo si hay alguno puesto, «Limpiar filtros». Separadas con `Separator`.
  En una sola línea el switch y los filtros pesaban igual, y no son lo mismo: uno cambia de pantalla, los otros
  recortan la lista.
- **Un control con fondo se alinea por su caja, no por su texto** (22 sep, reemplaza a la «alineación óptica» del
  día anterior). Se había tirado el switch 16px a la izquierda (`-ml-4`) para que su texto quedara a plomo con el de
  la tabla; como el switch **tiene relleno propio**, lo que se veía era la caja pegada al borde de la tarjeta:
  «el switch tab no está usando bien el padding en la izquierda, está super pegado al borde». El switch, los botones
  y los campos empiezan donde empieza el margen de la tarjeta (20px); solo se corrige ópticamente lo que no tiene
  fondo: un enlace, una pestaña subrayada, un icono suelto.
- **El switch cambia lo de dentro de la tarjeta, no la pantalla** (22 sep, «cuando se pasa a candidatos se quita
  esto y cambia hasta el título arriba, y eso no tiene sentido»). Las dos vistas hermanas comparten **todo** lo que
  está por encima de la tarjeta: la miga de pan, el título, la frase y el botón principal. Si cambian, no eran dos
  vistas: eran dos pantallas, y entonces el switch está mal puesto.
- **El botón principal es el de la pantalla, no el de la vista.** En Selección siempre es «Crear vacante», lleno y
  arriba a la derecha, porque se hace desde cualquiera de las dos vistas. La acción propia de una vista —«Importar
  candidatos»— baja **dentro de la tarjeta**, delineada, junto al contador: así no compite con el principal y se
  entiende que pertenece a lo que se está mirando. Desde el 27 sep esto vale para «Reclutamiento» (exploración 4), la
  única sección que conserva el switch; cuando «Mis candidatos» es su propia sección (exploraciones 1, 2 y 3), su botón
  lleno es «Importar candidatos» y va arriba, con «Importaciones» delineado a su izquierda.
- **Sin switch, la tarjeta arranca en los filtros** (27 sep, al separar «Vacantes» y «Mis candidatos» en el menú). Una
  primera fila con solo la cuenta queda vacía: la cuenta pasa al final de la fila de filtros, a la derecha de «Limpiar
  filtros». **Reemplazado en «Mis candidatos» el 2 oct** (Nicolás: «esto aquí parece un vómito»: cuatro filas, tres
  formas de control, un chip solo en su fila y cifras repetidas): título y cuenta; debajo, buscar · «Filtros» (globo
  con etiqueta, ciudad, experiencia, origen y los atajos «Esperan algo de ti» / «Entraron este mes», con el número de
  puestos en el botón) · «Búsquedas guardadas» · «Comparar con una vacante» (IA, al final); debajo, los grupos de la
  base en `FiltroChip`; y solo si hay algo puesto, una fila con cada filtro y su «x» («Etiqueta: …», «Ciudad: …»: hay
  etiquetas con nombre de ciudad) y «Limpiar filtros». **Todo alineado a la izquierda** (Nicolás: «¿cosas alineadas a
  la derecha y otras a la izquierda? eso se ve rarísimo»): nada con `ml-auto` en la cabecera de la tabla. Sin selector
  de orden: lo dan los encabezados. Si la sección tiene switch, la
  primera fila sigue siendo switch · cuenta, y el switch dice cuánto hay en cada mitad («Vacantes 19 · Mis candidatos
  533»).
- **Dos secciones hermanas del menú no comparten la cabecera** (27 sep, Nicolás: «candidatos debe quedar fuera toda su
  experiencia»). «Mis candidatos» como sección tiene su miga, su título, su frase, sus cifras (las de la base) y su
  botón lleno. Si una sección contiene a las dos (el switch), entonces sí: todo lo de arriba es uno, con cifras de las
  dos mitades, y cada atajo lleva a la mitad que cuenta.
- **Las cifras de arriba son de la pantalla, no de la tabla.** Se quedan al cambiar de vista. Sus atajos siguen
  funcionando desde la otra vista: si allí no hay nada que filtrar, el atajo es un enlace que vuelve a la lista ya
  filtrada (`?ver=publicadas`, `?ver=esperando`).
- **El relleno lateral de las tablas hay que forzarlo**: el padding de las celdas viene del CSS del tema
  (`.cn-table-cell`), así que `pl-3` de Tailwind pierde. Dentro de `MarcoTabla` va `pl-3!` en la primera columna y
  `pr-3!` en la última: 12px, lo mismo que la cabecera gris y que `DataGridList` (28 sep; antes, en la tarjeta blanca,
  eran 20px con `pl-5!`/`pr-5!`).

## Tarjeta de invitación a la IA («Crear un curso»)
- **Variante «Halo»** (18 sep, elegida por Nicolás entre tres): el color va **difuminado en las esquinas**, no rellenando
  la tarjeta, y el texto siempre queda sobre fondo liso. El botón lleva el degradado de marca de «Nueva conversación».
  Al pasar el cursor el halo crece desde su esquina: se mueve el fondo, no la tarjeta.
  Sustituye al degradado saturado de borde a borde que había antes (una imagen, `degradado-ia.png`).
- **Una por pantalla.** Es una invitación, no un banner. Si la pantalla ya tiene otra pieza de IA con color, esta va
  **sin halo** (interruptor «Halo» del configurador).
- Componente único: `src/shared/components/AiCard.tsx` + `tarjeta-ia.module.css`. Lo usan el Inicio real y el
  configurador, así que no pueden desincronizarse. Documentado en `/design-system/tarjeta-ia`.
- Texto: título en verbo y con el resultado («Crear un curso», no «Generador de cursos»); bajada con el cómo. Nada de
  «Potenciado por IA».

## Anatomía del design system
- Azul con nombre = parte del componente; gris rayado = slot (lo que pone cada pantalla).
- Los nombres de la anatomía no se enciman: `data-chip` (`top`, `inline`, `under`, `inside`).
- Cada caso de uso apunta a su pantalla real y se ve igual a ella.

## Referencias de medida (Storybook oficial de flux-ui, tema ubits + vega): todavía NO aplicadas
Esquinas: botones, campos y filas de la barra 6px; tarjetas 12px; etiquetas 4px; menús 6px con filas de 4px. Filas de
menú y barra de 32px con 8px entre icono y texto. Iconos de 16px, trazo 1.5, color del texto. La revisión del 16 sep pide
«border radius estándar», «iconos con más peso» y «ritmo vertical»: pendiente de decisión y aplicación. Cuando se
apliquen, pasan a reglas vigentes y se actualizan las réplicas.

## Campos de formulario
- **Los campos miden 40px de alto** (22 sep, pedido de UX: «los inputs un poco más altos»). Reemplaza los 36px que
  trae la librería. Vale para el campo de texto (`Input`), el selector (`Select`, tamaño normal), el selector con
  buscador (`Combobox`, como mínimo), el campo con icono o botón pegado (`InputGroup`) y el campo numérico
  (`NumberField`, tanto el tamaño normal como el grande). **No cambian:** el tamaño «sm» del selector, el chico del
  campo numérico, el área de texto (crece con sus líneas), el compositor del agente (alto automático), el buscador
  de comandos y los buscadores de las tablas, que ya llevan un alto puesto a mano y se respeta.
  Vive en: `src/index.css`, después de los imports, con el número en `--alto-campo`. Es la única regla del proyecto
  que le cambia la apariencia a un componente de flux-ui, así que `npm run check` marca `src/index.css` como
  «Scaffolding modificado» a propósito: necesita el visto bueno de ingeniería.
  El alto no se fuerza campo por campo en una pantalla; si un campo se ve distinto, es que alguien lo forzó.
  Documentado en: `/design-system/componentes/reglas` («Campos de 40 px»), marcado como pedido a la librería.

- **Ajustes numéricos sin deslizadores** (5 oct, Nicolás: «veo demasiada experiencia con barras y eso realmente no es
  escalable»). Un número que se configura (puntaje mínimo, días de plazo, cuántas preguntas, el margen salarial, el peso
  de un criterio) va en **una fila**, como los interruptores: el nombre y para qué sirve a la izquierda; a la derecha el
  `NumberField` con − y + y su unidad en gris («pts», «días», «%»), todos del mismo ancho para que los números de un
  panel queden en una columna. Unas pocas opciones fijas (la duración de una sesión) van en un `Select` en la misma
  fila. Un monto que ya se escribe en su campo no lleva además una barra (Compensación).
  Pieza: `CampoNumero` y `CampoOpcion` en `src/modules/admin/seleccion/vacantes/crear/components/piezas.tsx`;
  `FilaCriterio` (piezas-ia.tsx) usa la misma fila. Aplicado en: Evaluación de CV, Serena (formato y generador de
  preguntas), role play e idiomas (sesión y evaluación), pruebas psicotécnicas y Compensación de la creación de
  vacantes. Documentado en: `/design-system/componentes/reglas` › «Paneles de las etapas con IA».
  Queda un `Slider` en el ejemplo de drawer de filtros del design system (un rango de filtro, no un ajuste).

## Cifras en texto, no en insignias (5 oct)
- **Una cantidad no va en una insignia** (Nicolás, del historial de Créditos: «esos badges de reservados casi ni se ven,
  la tipografía está súper pequeña y no sé por qué contar eso en badge»). En una columna de cantidades, el número va
  arriba, del mismo tamaño en todas las filas, y debajo en gris qué fue («reservados», «cobrados»). Una cuenta que
  acompaña un título («7 etapas · 5 con IA») va en la frase de la cabecera, no en dos insignias diminutas a la derecha.
  Las insignias quedan para estados («Sin cupo», «En proceso») y para la cuenta de un filtro o una columna.
  Aplicado en: historial de Créditos (`creditos/uno/components/historial.tsx`) y «Flujo del candidato» de la creación
  de vacantes.

## Sin avatares de iniciales en las tablas (5 oct)
- **Una tabla no lleva círculos con iniciales** (Nicolás: «no deberíamos tener esos avatares en las tablas porque no las
  podemos sacar de ningún lado»): el producto no tiene fotos de los candidatos. La persona va con su nombre (y su correo
  o detalle debajo). Aplicado en: Mis candidatos (columna «Persona») y «Tus vacantes» («Esperan» y «Reclutador»).
  Sigue con avatar la pieza `Persona` del design system (`data-grid/casos/seguimiento.tsx`), que usan Encuestas y Planes
  de formación: pendiente de decisión de Nicolás antes de cambiarla para todos.

## Concesiones sobre flux-ui (para el equipo de librería)
**Se mudaron a una sola lista el 29 sep:** `ai-tools/flux-ui/diferencias.json`, que se ve en `/design-system/componentes/dev`
y se exporta para el dev que mantiene la librería (`node ai-tools/flux-ui/exportar-diferencias.mjs`). Ahí están todas,
revalidadas contra la 0.5.5, con qué hace hoy la librería, qué se pide y cómo reproducirlo en el Storybook. Una concesión
nueva se agrega ahí, no aquí. Las dos causas de fondo que explican la mayoría de los «!» del proyecto: el tema de la
librería se importa sin capa (como manda su README) y trae tailwind-merge 2 con Tailwind 4.

- Menús translúcidos anulados en `global.css` (hover #f5f5f5, fondo sólido).
- Pestañas «line» con el relleno de 3px de las demás variantes: la raya de la activa no pisa la línea. Anulado en
  `global.css` (22 sep).
- `FloatingActionBar`: la acción principal trae `text-white` fijo; se fuerza `text-primary-foreground` en selección masiva.
- Insignias sólidas `info` / `success` / `warning` / `destructive` con texto blanco sin contraste AA.
- Insignias `xs` y `sm` con letra de 9.6 y 10px, por debajo del mínimo de 10.5px: envoltorio `@/shared/components/Badge`
  (Ajustes propios › «Insignias chicas a 10.5 px»).
- Textos en inglés de la librería («Toggle Sidebar», «Close», región de toasts), rearmados donde se pudo (`Toaster.tsx`).
- Botones en pastilla y tamaños forzados con `!` en Suite AI (vienen del prototipo).
- Los menús de la librería insertan «guardias de foco» (spans invisibles con `tabindex=0` y `aria-hidden`): axe los
  marca como fallo cada vez que un menú está abierto. Es su implementación, no nuestra.
- `Progress` no tiene una variante «en marcha»: el brillo que recorre la barra del Centro de procesos se pinta encima
  de su indicador desde `process-center.module.css`. Si la librería lo trae algún día, se cambia por el suyo.
- La insignia `primary-light` en modo oscuro deja el azul a 2,8:1 sobre el panel; no se puede usar para texto pequeño.
- Los campos no traen un tamaño que se pueda elegir: el alto sale de `.cn-input` y familia, y subirlo a 40px obliga a
  una regla global nuestra. Pedirles un estilo UBITS con campos de 40px, o un `size` para el campo de texto.

## Cargas: esqueleto en el bloque, spinner en el botón (25 sep)
Nicolás: «de cada componente construyas su skeleton para que cada que haya una acción con este, siempre mostremos las
cargas bien». Eligió: primero toda Selección; carga al entrar y al filtrar. Aplica la tabla de `/design-system/estados`.
- **El bloque que cambia muestra su esqueleto** al entrar, filtrar, buscar, cambiar de pestaña o de página, o abrir a
  otra persona. Cabecera, filtros, pestañas y barras de acciones se quedan quietos y usables.
- **Rótulos reales, datos en gris**, con la silueta real: misma cantidad de filas o tarjetas y mismos altos (medido: el
  bloque mide lo mismo cargando y cargado, ±2 px). Los vacíos («nadie coincide») esperan a que termine la carga.
- **Las acciones van en su botón**: spinner + «Moviendo…», botón y «Cancelar» deshabilitados, la ventana no se cierra.
  `ActionDialog` trae `pendingLabel` (zona protegida, opcional) y `DialogoConfirmar` trae `enCurso`; para otros botones,
  `useAccion` de `design-system/estados/carga.tsx`.
- **Una sola espera simulada**: `useCarga(clave)` (0,8 s) y `useAccion` (0,7 s) en `carga.tsx`. El lector oye una vez
  «Cargando …» (`Esqueleto`); las piezas grises (`LineaEsqueleto`, `AvatarEsqueleto`) van ocultas para él.
- Documentado en: `/design-system/estados` (reglas «En la maqueta») y `/design-system/modales` (guía «Al confirmar»).

## Ventanas y confirmaciones sin forzar (23 sep)
Revisión del equipo sobre Selección. Reglas:
- Toda ventana con contenido va en `ActionDialog`. Si necesita más ancho, `size="wide"` (736 px); si necesita
  otros botones en el pie (pasos, varias salidas), `footer`. Nunca `Dialog` con el ancho puesto a mano.
- **Desde un drawer no se abre una ventana encima ni otro drawer** (8 oct, Nicolás: «si dentro de un drawer dispara un
  modal, dentro del drawer abras una nueva instancia y muestres ahí todo lo que estaba en el modal»; y al ver un segundo
  drawer apilado: «dentro del drawer… con el devolver pero en el drawer que tiene todo, nada de abrir un nuevo drawer»).
  Lo que se abre desde un drawer **cambia su contenido en el mismo drawer**: la vista tapa cabecera, cuerpo y pie con los
  de la ventana, y arriba queda «← título del panel» para volver. Escape, tocar fuera o «←» vuelven al contenido de
  antes; la X de la vista cierra el drawer entero. Lo hace `DrawerShell` solo cuando está dentro de otro (avisa con
  `panel-actual.ts`), y por eso también `VentanaDeAccion` (`drawer-anidado.tsx`, misma API que `ActionDialog`) y
  `DialogoConfirmar`. Las ventanas que una pantalla monta afuera (las del proceso de una vacante, las de la base) se
  dibujan dentro del panel cuando se pidieron desde él: `useVentanasEnPanel`. Las de dos columnas ensanchan el mismo
  panel mientras están abiertas (`anchoEnPanel`: revisar un CV, ver un documento).
  Aplicado en: ficha de la vacante y de Mis candidatos, panel de atención del inicio, historial de importaciones,
  detalle de un lote, catálogo de plantillas; fuera de Selección, el ejemplo de /design-system/drawers y «¿Descartar
  los cambios?» del panel de un plan de formación. Toda ventana de Selección usa `VentanaDeAccion` (fuera de un panel se
  ve igual que antes). Las listas de personas de una ventana van sin avatar. No aplica a Orbit Flow: es un panel que
  convive con la página. Documentado en: `/design-system/drawers` (guía y caso «Vista dentro del drawer») y
  `/design-system/modales` (guía).
- Toda confirmación va en `DialogoConfirmar` (con `children` para alertas o campos). Nunca `AlertDialog` suelto.
- Toda confirmación va en `DialogoConfirmar` (el 5 oct pasó a `ActionDialog`; **se volvió a esta regla el 6 oct**).
  Nunca `AlertDialog` suelto.
  Si hay dos formas de seguir (salir de una edición guardando o sin guardar), `otra` suma la tercera salida entre
  cancelar y la acción (1 oct: salir de la creación/edición de vacantes; documentado en `/design-system/estados`, caso 2).
  1 oct: la creación de vacantes quedó toda en piezas del DS (salir → `DialogoConfirmar`; «Crear/Editar etapa» y
  «Crear desde archivo» → `ActionDialog`, sin el ancho a mano).
- `AiCard` dentro de un marco que ya pone borde (el `Frame` del Inicio) usa `inFrame`, no `border-0!`.
- Nada de pintar componentes desde fuera: los enlaces son azules, las barras de avance llevan su letra, las filas
  de lista son `Item` con su variante (`outline`, y `muted` para la abierta) y el ámbar sale de `Badge warning-light`.
  **Excepción (24 sep, Nicolás):** la fila abierta de la bandeja de Exploración 1 va en azul suave (`bg-primary/7`) y
  tiñe con `!` la casilla, la cara y las etiquetas, para que no queden parches blancos sobre el azul. Documentado en:
  `/design-system/componentes/reglas` («Fila abierta de la bandeja»).
- La regla global de pestañas «line» sin relleno queda documentada en Ajustes propios como pedido a la librería.

## Auditoría de lo de Cristian (29 sep)
Revisión de los 298 archivos de Cristian contra el design system (prompt `ai-tools/prompts/revisar-design-system.md`).
Decisiones de Cristian:
- ~~**Avisos con tipo: `toast.add({ type, title })`, como excepción.**~~ **Reemplazada el 8-oct:** `notify(título,
  detalle, tipo)` ya recibe el tipo; `toast.add` suelto es una pieza retirada (`ai-tools/reglas/reglas.json`, regla
  `avisos-con-tipo`). Lo que sigue es la historia. La regla era «aviso → `notify`», pero `notify` solo
  recibe título y descripción: no deja elegir éxito, información, advertencia o error, y sin tipo se pierde el icono de
  color (ficha «Color de los avisos» de Ajustes propios). Sin tipo → `notify`; con tipo → `toast.add`. Pedido a
  ingeniería: que `notify` acepte el tipo y la espera («cargando… → listo»), en zona protegida; cuando exista, se pasan
  todos a `notify`. Documentado en: `/design-system/componentes/reglas` (Color de los avisos), catálogo y skill
  `flux-ui-storybook`.
- **Suite AI (concepto) y Home Suite AI son una copia congelada**, como el Archivo: no se auditan ni se arreglan. La
  versión viva es `/suite-ai`. Sus hallazgos (ventanas sueltas, barra y menús copiados, buscador propio, avisos sin tipo)
  quedaron anotados en `/design-system/unificacion`.
- **Métricas: una pieza, una página.** Las cifras y gráficos de los tableros vivían en el Inicio (`FilaCifras`), en Tareas
  (`Indicadores`), en el caso Seguimiento (cuatro tarjetas sueltas) y en el Dashboard del Archivo (gráficos y
  `Variacion`), del que dependían el Inicio real y Home operativo. Se mudaron a `src/modules/design-system/metricas/` y
  se documentan en `/design-system/metricas`. Las cifras van **en una sola tarjeta partida** (acuerdo del 14 sep): el
  caso Seguimiento dejó sus cuatro tarjetas. Los archivos viejos solo reenvían. Las piezas nuevas de Elkin que hacen lo
  mismo (`FilaIndicadores`, `Tendencia` de `design-system/graficos`) quedaron «Por decidir» en Unificación.

## Tablas como los bloques de ReUI (29 sep)
> **Reemplazada en parte el 5 oct:** `TablaDatos` ya no es compacta ni sin asideros: lleva la cabecera de Vacantes
> (encabezados de 40 px, asidero para mover y cambiar el ancho, conteo a la izquierda y sin título dentro del marco). Se
> mantienen el borde único (`borderless`), la barra de seleccionados en la cabecera y la columna sin «Fijar».

Revisión del capítulo Data grid contra ReUI (data-grid-base-2 y data-grid-base-5): «hay un stroke raro como más
grueso y las pintas con espacios vacíos otras veces; en general las de REUI son más limpias». Medido en el navegador:
no era algo que hiciéramos mal al llevarlas al design system, sino cómo DataGridList arma la tabla en su marco (el
ejemplo con Frame del Storybook tiene los mismos tres problemas). ReUI compone la tabla con un solo borde, compacta y
con la columna de acciones fija a la derecha.
- **Un solo borde:** `cardVariant: 'borderless'`. Sin eso la tabla ponía otra caja con borde dentro del panel del marco
  y los dos bordes pegados se veían como un trazo de 2 px.
- **Sin espacios vacíos:** `frame.toolbar: 'header'` (la barra de seleccionados dejaba una franja vacía encima de la
  tabla) y `layout.resizable: false` (al poder cambiar el ancho, la librería añade una columna de relleno después de
  los «⋯» y quedaba un hueco a la derecha). Las columnas siguen estables al cambiar de página (medido de la 1 a la 4).
- **Compacta y sin asideros:** `layout.dense: true` (cabecera de 32 px y celdas con 6 px arriba y abajo, las medidas de
  ReUI) y `layout.reorderable: false` con el asidero apagado en cada columna.
- Vive en `TablaDatos` como valores por defecto (cada tabla puede pedir lo contrario) y el configurador de
  `/design-system/data-grid` arranca así. Las tres tablas de «Resultados de un contenido» y la de Dashboard RR.HH. usan
  DataGridList directo y llevan lo mismo escrito.
- **Pedido a la librería:** que DataGridList con `frame` venga así por defecto, que deje fijar la columna de acciones
  a la derecha (el relleno iría antes, como en ReUI) y que su paginación acepte textos.
- Pendiente de otras personas: las tablas de Encuestas y Vacantes (DataGridList directo) siguen con el borde doble.

## Chip de filtro (25 sep, Nicolás: «no veo que hayas estandarizado los chips reales del DS en las 3 exploraciones»)
- Un filtro que se prende y se apaga es **un solo chip**, el mismo en todas las pantallas: `FiltroChip`
  (`src/modules/design-system/navegacion/filtro-chip.tsx`), hecho con `Toggle variant="outline"` de flux-ui.
  Apagado: icono + texto + cuántos hay (`Badge secondary`). Puesto: el número en `Badge invert` y la «x» al final; al
  pasar el cursor dice «Quitar el filtro» y todo el chip lo quita.
- Una fila de opciones que se excluyen (etapas, resultados de un lote) son chips iguales, sin chip «Todas»: sin ninguno
  puesto se ve todo; el puesto lleva su «x».
- Lo que elige entre muchos valores (estado, etiqueta, responsable) sigue siendo `Select`; no se vuelve chip.
- No usar `Toggle` suelto como filtro (sin número ni «x» no se lee como filtro ni se sabe cómo se quita).
- Dónde está hoy: bandeja (1), pipeline (2), tablero (2 y 3), lotes de CVs, y las listas de vacantes de las tres
  («Con gente esperando»; la 3 decía «Solo con pendientes» y ahora dice lo mismo que las otras).
