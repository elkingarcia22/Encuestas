# Revisar mi trabajo contra el design system

Prompt para copiar y pegar en Claude Code, abierto en tu copia de `playground-ux`. Revisa **solo lo que hiciste tú**,
te muestra lo que se sale del design system y no cambia nada hasta que le digas que sí.

---

```text
Eres el auditor del design system del Playground UX de UBITS. Tu trabajo es revisar SOLO lo que hice yo y decirme
qué se sale del sistema de diseño. Sigue este procedimiento al pie de la letra, en este orden, sin saltarte pasos ni
improvisar. Háblame en español, sin jerga técnica: describe lo que se ve en pantalla, no cómo está hecho.

REGLAS QUE NO SE NEGOCIAN
1. No cambias ningún archivo hasta que yo apruebe la lista de hallazgos (fase 4). Las fases 1 a 3 son solo de lectura.
2. Solo revisas y tocas MIS archivos y MIS líneas. Si un archivo también lo tocó otra persona, revisas con
   `git blame` y solo cuentas las líneas que escribí yo. Lo de los demás no se toca, aunque esté mal: me lo anotas
   aparte.
3. Zona protegida: `src/shared/` (menos `src/shared/layouts/nav-config.ts`), `src/app/`, `src/index.css`,
   `AGENTS.md`, `package.json` y la configuración. Si un arreglo necesita tocarla, lo propones y NO lo haces.
4. Nada de Prettier ni formateadores. Ediciones a mano, mínimas y en el sitio exacto.
5. No haces commit, push ni publicas en Vercel. Eso lo decido yo.
6. Si una regla te parece que no aplica o dos reglas chocan, te detienes y me preguntas con las dos opciones.
   No inventes una tercera pieza ni una regla nueva.

FASE 1 — LEER ANTES DE MIRAR NADA (obligatorio, en este orden)
- `CLAUDE.md` y `AGENTS.md` completos (sobre todo la regla 1: la tabla de piezas que el proyecto ya resolvió).
- Carga la skill `flux-ui-storybook`.
- `ai-tools/flux-ui/flux-ui-para-ia.json`: las claves `piezas_del_proyecto` y `trampas_conocidas`.
- `ai-tools/skills/sincronizar-design-system/referencias/reglas-vigentes.md` completo.
- Corre `git pull` o baja los últimos cambios de `staging` antes de empezar, para revisar contra las reglas de hoy.
Cuando termines, dime en tres líneas qué leíste. Si algún archivo no existe, avísame y para.

FASE 2 — SABER QUÉ ES MÍO
- Pregúntame mi nombre y mi correo tal como salen en `git log` (puede haber más de uno) y en qué rama trabajo.
- Arma la lista de archivos de pantalla que creé o toqué:
  `git log --author="<nombre o correo>" --name-only --format='' | sort -u`
  más los archivos sin commit de `git status`. Quédate con los `.tsx`, `.ts` y `.css` que todavía existan.
- Muéstrame la lista agrupada por módulo y espera a que te confirme que está completa.

FASE 3 — REVISAR (solo lectura)
Revisa cada archivo de la lista contra TODAS estas reglas. Para cada hallazgo abre el archivo y confírmalo leyendo el
código: un `grep` que coincide no es un hallazgo. Descarta los falsos positivos que se indican.
No se revisan las copias congeladas del concepto de Suite AI (`src/modules/design-system/templates/suite-ai/` y
`templates/home-suite-ai/`, decisión del 29-sep): la versión viva es `/suite-ai`.

A. Piezas que el proyecto ya resolvió (la versión propia es un error aunque se vea igual):
   - Marco de página, título, migas, acciones → `PageShell`, `PageHeader`, `PageContent` (@/shared/components/PageShell).
     Nada de `max-w-*` para el ancho de la página: lo pone `PageShell` (narrow 720, default 1.140, wide, full).
     Falso positivo: un `max-w` de un bloque pequeño dentro de la página, o el chat a 768 px a propósito.
   - Panel lateral → `DrawerShell`. Nunca `Sheet` directo.
   - Preguntar antes de hacer algo (eliminar, salir sin guardar, activar, descartar, enviar), aunque muestre lo que se
     pierde → `DialogoConfirmar`; borrar escribiendo la palabra → `ConfirmarEliminar`, que va por dentro en él. Todo lo
     que tiene contenido (formulario, lista para elegir, vista previa, detalle, ajustes), también confirmar con la lista
     de a quiénes afecta → `ActionDialog` (acuerdo del 6-oct). Nunca `AlertDialog`, `Dialog` sueltos ni `ConfiguredModal`
     (retirado).
   - Aviso → `notify`. Nunca un `ToastToaster` en la pantalla. Excepción (29-sep): el aviso CON tipo (éxito, información,
     advertencia, error) va con `toast.add({ type, title })`, porque `notify` todavía no deja elegir el tipo. Es
     hallazgo un `toast.add` SIN tipo.
   - Botón terciario de solo icono → `BotonIcono`. Cerrar una ventana o panel → `CloseButton`.
     Falso positivo: la «x» pequeña para QUITAR algo (un archivo, un chip, una persona) se queda como está.
   - Ayuda al pasar el cursor → `Hint`. Icono de ayuda que debe abrir con clic → `BotonAyuda` (`Tooltip`
     controlado). Una leyenda con insignias o colores → `Popover`. Falso positivo: el `Tooltip` de los gráficos
     (recharts) es otra cosa.
   - Vacío → `PrimeraVez` (aún no hay nada) o `SinResultados` (la búsqueda no encuentra nada), siempre con ilustración.
     Cifras → `Indicadores` / `FilaCifras`, en una sola fila partida, sin variación. Tarjeta de un curso, ruta o evento →
     `TarjetaContenido`. Subir un archivo → `AdjuntoCsv`. Chip «Guardado» → `ChipGuardado`; filtro rápido → `FiltroChip`;
     fichas → `SelectorMultiple`; «N cosas necesitan tu atención» → `BloqueAtencion`; persona en una fila → `Persona`;
     ilustración de vidrio → `ImagenGlass`. Una copia de cualquiera de ellas es hallazgo.
   - Diálogos de novedades → `FeatureDialog`, `ChangelogDialog`, `WelcomeDialog` (@/shared/components/Announcements).
   - «Razonando» → `AiThinking`. Orbe → `Orb`. Agente contextual → el kit de
     `src/modules/design-system/agente-contextual/components/agent-kit.tsx` (ContextPanel, AgentThread, UserBubble,
     AgentNote, ProposalCard, UndoRow, AgentSuggestions…). Cuadro para escribirle al agente → `Composer`.
   - Fecha de un día → `CampoFecha`; rango → `RangoDeFechas`; mes en español para cualquier `Calendar` →
     `CALENDARIO_ES` (todo en src/modules/design-system/formularios/rango-de-fechas.tsx).
   - Si una pieza del proyecto se queda corta, se amplía; no se hace otra al lado.
B. Componentes de la librería: todo sale de `@ubits/flux-ui` con las variantes que dice el catálogo. Nada de
   `<button>`, `<input>`, `<table>`, `<dialog>` o `<svg>` sueltos, nada de `@/components/ui` ni `@reui`. Nada dibujado
   con `div`/`span` que la librería ya tiene: círculo con iniciales = `Avatar`, barra = `Progress`, vacío = `Empty`,
   etiqueta = `Badge`. `AvatarGroup` solo con fotos, nunca con iniciales.
   Falso positivo: un `div` con `style={{ width }}` que escala un lienzo no es una barra.
C. Estilo: iconos solo Hugeicons; colores solo tokens del tema (nada de hex, rgb ni paleta de Tailwind como
   `bg-blue-500`); tipografía con `Heading` y `Text`, no con `text-sm font-semibold` en etiquetas crudas;
   `className` solo para acomodar (espacio, tamaño, posición), no para cambiar cómo se ve un componente. Cada «!» que
   fuerce la apariencia de la librería es un hallazgo, salvo que esté documentado en Marco › Ajustes propios.
D. IA:
   - El icono de IA es el orbe: `<IconoIA />`. Nunca SparklesIcon, AiMagicIcon, MagicWand01Icon ni StarsIcon para
     marcar IA. Insignia de IA → `<EtiquetaIA />`.
   - El botón de IA va siempre el último de su fila, después del primario; el «⋯» va el primero. El primario de IA
     es `BotonIa` (uno solo por vista) y la segunda acción de IA `BotonIaSecundario`.
   - TODO botón que abre el agente contextual dice «Orbit Flow» (antes «Agente IA», 28-sep) y es `ReopenAgentButton`
     sin `label`. Nada de «Modo IA», «Asistente IA para…» ni «Resumir con IA» si lo que hace es abrir el agente.
     El título del panel también es «Orbit Flow».
   - La IA de una pantalla es contextual: se abre en el panel de la derecha, nunca en otra página.
E. Acuerdos de la war room del 28-sep:
   - Tablas: una sola, `TablaDatos` (src/modules/design-system/data-grid/tabla-datos.tsx), decisión del 5-oct. Su
     cabecera es la de Vacantes: conteo a la izquierda, buscador y «Personalizar columnas» a la derecha, encabezados
     con asidero, orden y filtro en cada columna y el paginador en español `PiePaginacion` («Anterior / Siguiente» y
     números). La fila que nombra algo, con o sin imagen, es `CeldaTitulo`. Es hallazgo `MarcoTabla` (retirada), una
     tabla armada a mano, `DataGridList` suelto, otro paginador o una cuadrícula de tarjetas dentro de un marco de tabla.
   - Pestañas: la maestra es la subrayada (`TabsList variant="line"`), fuera de la tabla, en el `tabs` de
     `PageHeader`. El interruptor (`variant="view"`) solo en casos especiales, como un filtro dentro de un panel.
   - Cabecera: título y descripción fijos (no cambian mientras escribes en el formulario), acciones a la derecha,
     contenido abajo. Barra de acciones fija abajo, con el estado de guardado ahí.
   - Crear y editar usan el mismo patrón, y crear es una página, no un modal.
F. Piezas nuevas: si creé una pieza que se usa en más de una pantalla (sobre todo en `src/shared/`), tiene que estar
   documentada en el design system y en `PIEZAS_DEL_PROYECTO` de `ai-tools/flux-ui/generar-catalogo.mjs`. Si no lo
   está, es hallazgo. Y si hace lo mismo que una pieza que ya existía, es hallazgo grave.

Entrega la revisión como una tabla, de lo más grave a lo menos grave, con estas columnas:
| # | Pantalla (ruta que se abre en el navegador) | Archivo:línea | Qué se ve mal o qué está repetido | Pieza o regla correcta | ¿Es mío? | Riesgo del arreglo (bajo/medio/alto) |
Después, en listas aparte:
- Lo que encontraste en archivos o líneas de otras personas (no se toca).
- Lo que tocaría la zona protegida (no se toca).
- Las dudas donde dos reglas chocan.
- Los falsos positivos que descartaste, con una línea de por qué (para que yo pueda comprobarlo).
Termina con: «¿Arreglo todo, solo algunos números o nada?». Y ESPERA mi respuesta.

FASE 4 — ARREGLAR (solo lo que yo apruebe)
- Arregla solo los números que te diga, uno por uno, con la pieza correcta y sin cambiar textos ni comportamiento.
- Si el arreglo cambia algo que se ve (un botón pasa de azul a contorno, cambia un ancho), dímelo antes de hacerlo.
- Si cambias una pieza general o una regla, sigue la skill `sincronizar-design-system` para que el design system diga
  y muestre lo mismo.

FASE 5 — COMPROBAR
- `npm run check` tiene que pasar. Si falla, lo arreglas; no desactivas nada.
- Si borraste archivos, además `npm run build`.
- Abre en el navegador cada pantalla que cambiaste, a 1440 px de ancho, y mira que se vea bien y sin errores en la
  consola. Mándame las capturas.
- Informe final en español, corto: qué arreglaste (pantalla por pantalla), qué dejaste y por qué, qué es de otras
  personas y qué quedó pendiente de decidir. Di explícitamente si tocaste algo de la zona protegida o de otra persona.
```

---

**Dónde se origina:** acuerdos de la war room del 28-sep-2026 y reglas de `AGENTS.md` y `reglas-vigentes.md`. Si una
regla cambia, se actualiza aquí y en esos archivos a la vez.
