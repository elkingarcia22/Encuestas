# Sincronizar el design system con la interfaz — prompt completo

Este es el texto de la skill `sincronizar-design-system` del playground UX, en un solo archivo para pasárselo a
cualquier asistente (Cursor, Codex, Gemini, ChatGPT) o para que otra persona lo lea.

**Cómo usarlo**
- En **Claude Code** no hace falta: la skill ya vive en `ai-tools/skills/sincronizar-design-system/` (enlazada en
  `.claude/skills/`) y se activa sola cuando el pedido toca un componente general o una regla de diseño.
- En **otra herramienta**: pega todo este archivo al inicio de la conversación, o guárdalo como regla del proyecto.
- Los dos scripts de apoyo (`impacto.mjs` y `verificar.mjs`) solo existen en este repo. Si el asistente no puede
  correrlos, la sección «Si no puedes correr los scripts» dice cómo hacer lo mismo a mano.

---

# Sincronizar el design system con la interfaz

## La idea

El design system del playground es la **documentación viva** de los componentes generales: cada página
(`/design-system/navegacion`, `/header`, `/barra-lateral`, `/modales`, `/drawers`, `/agente-contextual`) tiene una vista
previa con anatomía (lo azul con nombre es parte del componente; lo gris rayado es slot), casos de uso con su pantalla
real, interruptores, la lista «Partes de este caso» y notas de guía.

**Un cambio a un componente general no está terminado hasta que el design system dice y muestra lo mismo.** Funciona en
las dos direcciones:

- Si cambias el componente real → actualizas su página del design system.
- Si Nicolás define o cambia una regla mirando el design system → la aplicas también en **todas** las pantallas reales
  que usan ese componente o repiten ese patrón (incluidas las copias hechas a mano).

Ejemplo real (16 sep 2026): «el orbe siempre a la izquierda del primario». Tocó la vista previa de Navegación, los 8
casos del agente contextual, el configurador del agente, el editor de LMS (que tenía su propio botón «Agente IA» copiado)
y el configurador del header, que todavía mostraba «Agente IA» en el header y contradecía la regla.

## Archivos de apoyo

(En este archivo van al final, como anexos A, B y C; los dos scripts solo existen en el repo.)

| Archivo | Para qué |
| --- | --- |
| `referencias/mapa.md` | Qué componente real documenta cada página, si la página lo **reutiliza** o es una **réplica**, y qué revisar |
| `referencias/reglas-vigentes.md` | Las decisiones de diseño que ya tomó Nicolás. Se lee antes y se actualiza después |
| `referencias/anatomia.md` | Cómo está armado un configurador y el kit de anatomía (partes, slots, nombres) |
| `scripts/mapa.json` | El mismo mapa en datos, lo usa `impacto.mjs` |
| `scripts/impacto.mjs` | Dice qué páginas, archivos, pantallas reales y textos revisar según lo que cambió, y detecta copias de clases desfasadas |
| `scripts/verificar.mjs` | Capturas en claro y oscuro, ancho del contenido y escaneo AA de las rutas que le pases |

## Flujo

### 0. Antes de tocar nada
1. Lee `CLAUDE.md` del repo (solo flux-ui, iconos Hugeicons, tokens, zona de trabajo, archivos protegidos).
2. Lee `referencias/reglas-vigentes.md`: si el cambio contradice una regla vigente, **pregunta** a Nicolás antes de
   seguir, con las dos opciones concretas.
3. Si el pedido es ambiguo («que se vea mejor»), aclara qué cambia exactamente antes de propagarlo a todas partes.

### 1. Medir el alcance
```bash
node .claude/skills/sincronizar-design-system/scripts/impacto.mjs              # lo que cambió según git
node .claude/skills/sincronizar-design-system/scripts/impacto.mjs <archivo>…   # archivos concretos
node .claude/skills/sincronizar-design-system/scripts/impacto.mjs --todo       # auditoría completa
```
Por cada componente tocado muestra:
- las páginas del design system que lo documentan y sus archivos, marcando las **réplicas** que hay que cambiar a mano;
- las pantallas reales que lo usan, para el barrido de consistencia;
- dónde aparecen sus nombres y reglas en los textos;
- las copias de clases que ya no coinciden con el componente real.

El script **no encuentra todo**. Una regla puede estar escrita con otras palabras o repetida a mano en otra pantalla.
Completa con `grep -rn` sobre `src/modules` y `src/shared` usando los nombres visibles («Orbit Flow», «Novedades»…), las
clases o las medidas que cambiaron.

Si sale «Compartido sin mapear», decide si es un componente general. Si lo es, súmalo a `scripts/mapa.json` y a
`referencias/mapa.md` en el mismo cambio.

### 2. Clasificar el cambio
| Tipo | Ejemplos | Qué se actualiza en el design system |
| --- | --- | --- |
| **Visual** (color, tamaño, radio, peso, sombra) | filas de la barra en medium y gris | Si la página reutiliza el componente, se ve solo: revisa los textos que citen la medida. Si es réplica o copia de clases, cópialas. |
| **Estructura** (parte nueva, quitada o renombrada) | el composer suma «Voz» | Tipo de configuración, casos, control del panel, vista previa (`data-region`), `PART`, texto de la parte y lista de partes. |
| **Posición u orden** | «Orbit Flow» al final de la fila | Vista previa de todos los configuradores que lo muestran, textos de la regla, casos, **y todas las pantallas reales** |
| **Comportamiento o estados** | el panel se minimiza a un riel de 60px | Estados en la configuración, controles, textos, casos que lo muestran. Si es una interacción, que funcione en la vista previa. |
| **Regla de uso** («solo el orbe si la pantalla está cargada») | — | Notas de guía (`GUIDE` / notas bajo los controles), textos de parte, `reglas-vigentes.md` |
| **Tema o global** (`src/index.css`, `global.css`) | hover de menús como REUI | Réplicas con clases copiadas, textos con colores o medidas, `reglas-vigentes.md`. Escaneo AA completo en claro y oscuro. |
| **Componente nuevo sin página** | avisos flotantes | Pregúntale a Nicolás si se documenta como caso en una página existente o como página nueva (ver `referencias/anatomia.md`). |

### 3. Barrido de consistencia en la interfaz real
Antes de documentar, deja la interfaz coherente:
- Recorre **todas** las pantallas de «Usado en pantallas reales» y las que encontraste con grep.
- Busca **copias**: botones o estilos que imitan al componente sin importarlo. Por ejemplo, el editor de LMS arma su
  propio botón «Orbit Flow». Aplícales la misma regla, o reemplázalas por el componente compartido si se puede sin cambiar
  cómo se ve.
- Si una pantalla no puede seguir la regla (por ejemplo, no tiene botón primario), aplica el criterio más cercano,
  escríbelo en `reglas-vigentes.md` y díselo a Nicolás.

### 4. Actualizar el design system
Por cada página afectada (detalle en `referencias/anatomia.md`):
1. **Configuración** (`*-config.ts`): opciones nuevas en el tipo, valores de cada caso, `PART` con el nombre exacto que
   dibuja la vista previa, texto de cada parte y la función que lista las partes visibles.
2. **Vista previa** (`*-preview.tsx` o réplica): mismo orden, medidas y clases que el real. Marca las partes nuevas con
   `data-region` y los slots con `data-slot-region`. Si los nombres se enciman, usa `data-chip` (`top`, `inline`,
   `under`, `inside`).
3. **Panel de controles** (`main.tsx`): el interruptor o selector de la parte y la nota con la regla.
4. **Guía** (`GUIDE`, notas y resúmenes de casos): que digan la regla nueva con las mismas palabras en todas las páginas.
5. **Casos**: cada caso apunta a una pantalla real (`example` / `route`); si el cambio altera esa pantalla, el caso debe
   quedar igual a ella.
6. **Copias de clases** (`sidebar-styles.ts`, `drawer-styles.ts`, medidas de `header-preview.tsx`): cópialas del real.
   `impacto.mjs` vuelve a avisar si quedan desfasadas.
7. **Otras páginas que lo mencionan**: por ejemplo, el header dice dónde NO va «Orbit Flow». Revisa los textos que el script
   listó.

### 5. Registrar la regla
Si el cambio fija o cambia una decisión de diseño, actualiza `referencias/reglas-vigentes.md` con fecha, la regla con las
palabras de Nicolás y dónde se aplica. Si una regla vieja queda reemplazada, bórrala o márcala como reemplazada: no dejes
dos versiones.

### 6. Verificar (obligatorio)
1. Con el local en `http://localhost:5173` (si no responde, ver «Local caído» abajo):
   ```bash
   node .claude/skills/sincronizar-design-system/scripts/verificar.mjs <rutas reales> <páginas del design system>
   ```
   Por defecto revisa claro y oscuro, a 1440 y a 1920.
   - Contenido: 1140 como máximo (1104 en 1440 con la barra abierta, 1140 a 1920), sin scroll horizontal. El chat de
     Suite AI mide 768 a propósito y la plantilla de acceso ocupa toda la pantalla.
   - Axe-core: **0 fallos AA**.
   - Consola: sin errores.
2. **Mira las capturas.** Axe no ve nombres de anatomía encimados, cortes, réplicas que ya no se parecen al real ni
   una regla mal aplicada. Compara lado a lado la pantalla real y su caso en el design system.
3. Si la regla es de posición u orden, mide el orden en el navegador en cada pantalla afectada (por ejemplo, la lista de
   botones de izquierda a derecha).
4. Prueba con teclado lo que se abre o cambia de estado: Tab, Enter, Escape y la vuelta del foco.
5. `npm run check`. Si solo marca archivos protegidos que Nicolás autorizó tocar, está bien: dilo en el informe. Si
   marca lint o typecheck, arréglalo.
6. Vuelve a correr `impacto.mjs`: no deben quedar copias desfasadas.

### 7. Cerrar
- Actualiza la memoria del proyecto (estado y decisiones) si el cambio es relevante para otra sesión.
- No publiques en Vercel ni hagas commit sin que Nicolás lo pida.
- Informe para Nicolás en español, sin jerga, con rutas que pueda abrir:

```
Listo: <la regla o el cambio en una frase>.

En la interfaz: <pantallas donde cambió, con ruta>.
En el design system: <páginas actualizadas, con ruta, y qué se ve distinto: control nuevo, parte nueva, texto de la guía>.
Lo que no pudo seguir la regla: <caso y qué criterio se usó>, si aplica.
Verificado: <claro y oscuro, 1440 y 1920, AA 0 fallos, orden medido>.
Pendiente de tu decisión: <si hay algo>.
```

## Errores que ya pasaron (no repetir)
- **Réplicas que se quedan atrás.** La barra lateral del design system siguió con las filas en gris claro y peso normal
  después de pasar las reales a medium y gris. Las réplicas no se actualizan solas.
- **Una regla aplicada en la mitad de los lugares.** «Agente IA» quedó junto al primario en los casos, pero el header
  seguía mostrándolo en otro lado. Busca también en las páginas que solo **mencionan** el componente.
- **Copias escondidas del componente.** El editor de LMS tenía su propio botón «Agente IA» en vez de `ReopenAgentButton`.
- **Nombres de anatomía encimados** al mover una parte. Después de cambiar un orden, revisa la captura con los nombres
  visibles y usa `data-chip`.
- **Tokens que se pisan.** `global.css` tenía un alias viejo `--accent: var(--primary)` que dejaba azul el hover en modo
  claro. Después de tocar el tema, mide el color real en el navegador, no el que dice el código.
- **Cambios de tema que rompen contraste en otro lado.** El azul claro en oscuro dejó texto blanco a 2.8:1 en la barra
  de selección de la librería. Tras tocar tokens, escaneo AA de todas las páginas y revisión de lo que axe no ve
  (degradados, estados con cursor).
- **Decisiones de composición elegidas por texto.** La «rejilla 1140» del chat se eligió en una pregunta con dibujos
  ASCII, se aplicó y a Nicolás no le gustó al verla. Para cambios de ancho o composición, muéstrale primero una captura
  de una pantalla y después propágalo.
- **Local caído.** No lo levantes dentro de Terminal ni como tarea en segundo plano de la sesión, porque se cae. Levántalo
  suelto: `(nohup npm start -- --port 5173 --strictPort > ~/Library/Logs/playground-ux-local.log 2>&1 &)`.

## Límites
- Solo flux-ui, iconos Hugeicons y tokens del tema (ver `CLAUDE.md`). Si mantener la paridad obliga a forzar la librería
  con `!` o CSS global, hazlo solo si Nicolás lo pidió. Anótalo como concesión para el equipo de librería en
  `reglas-vigentes.md`.
- Archivos protegidos (`src/index.css`, `src/shared/layouts/`, `src/app/`…): tocarlos requiere permiso de Nicolás y
  aviso a ingeniería.
- Si el cambio lo hacen varios agentes en paralelo, asigna archivos sin solaparse. Un solo agente se encarga del design
  system al final, para que los textos queden con las mismas palabras.

---

## Si no puedes correr los scripts

`impacto.mjs` y `verificar.mjs` son atajos, no magia. Sin ellos:

**En lugar de `impacto.mjs`** — usa el «Mapa» del anexo A: busca el componente que tocaste, mira si su página lo
**reutiliza** (lo visual se actualiza solo) o es una **réplica** (hay que copiar los cambios a mano), y recorre las
pantallas reales que lo usan. Completa con búsquedas de texto sobre `src/modules` y `src/shared` usando los nombres
visibles («Orbit Flow», «Novedades»…), las clases o las medidas que cambiaron.

**En lugar de `verificar.mjs`** — abre el local en el navegador y revisa, en claro y en oscuro, a 1440 y a 1920:
- el contenido no pasa de 1140 y no hay scroll horizontal;
- ningún error en la consola;
- contraste AA (4.5:1 en texto normal, 3:1 en texto grande, iconos y bordes de campos);
- que la pantalla real y su caso en el design system se vean iguales, lado a lado;
- teclado: Tab, Enter, Escape y que el foco vuelva a donde estaba.

---

## Anexo A — Mapa: componente real → dónde se documenta

**Reutiliza**: la página importa el componente real, así que lo visual se actualiza solo; los nombres, opciones, casos y
textos se actualizan a mano.
**Réplica**: la página dibuja su propia versión y hay que cambiarla a mano.
La versión en datos está en `../scripts/mapa.json`. Si agregas o cambias algo aquí, cámbialo también allá.

| Componente real | Archivos | Página del design system | Relación | Qué revisar |
| --- | --- | --- | --- | --- |
| **Marco de página** (cabecera de pantalla, contenedor de 1140, pie) | `src/shared/components/PageShell.tsx`, `page-width.ts`, `AppFooter.tsx`, `src/shared/layouts/RootLayout.tsx` (márgenes `px-1.5`) | `/design-system/navegacion` y sus 11 patrones | Reutiliza | `page-config.ts`: opciones, `CONTAINER_LABEL`, nombres iguales a los `data-region` de PageShell, textos, casos. `main.tsx`: controles y guía. `case-frame.tsx` mide lo mismo que el contenido. |
| **Header** y sus paneles (notificaciones, procesos, perfil, ⌘K, Novedades) | `src/shared/components/AppHeader.tsx`, `header-icon.ts`, `CommandPalette.tsx`, `NotificationsPopover.tsx`, `ProcessCenter.tsx`, `ProfilePopover.tsx`, `Hint.tsx`; cabecera del editor en `lms-creator/components/editor-view.tsx` | `/design-system/header` | **Réplica** | `header-preview.tsx` copia medidas (botones de 32px y foto de 34px, Novedades 119px, 8px entre acciones, umbrales 920/664px) y dibuja resumidos los paneles abiertos. Solo ⌘K y Novedades abren los reales. `header-config.ts`: `PART`, textos, casos. |
| **Barra lateral**, riel plegado, menú de empresa, tarjeta de invitación, historial de Suite AI | `src/shared/layouts/AppSidebar.tsx`, `nav-config.ts`, `new-chat.module.css`; `src/shared/components/SidebarRail.tsx`, `AccountPopover.tsx`, `InviteCard.tsx`, `ChatStatusDot.tsx` | `/design-system/barra-lateral` | **Réplica** + copia de clases | `sidebar-styles.ts` COPIA clases (el script avisa si se desfasan). `open-sidebar.tsx` y `rail-sidebar.tsx` son réplicas fijas. Reutiliza de verdad nav-config, InviteCard, AccountPopover, ChatStatusDot y el degradado de «Nueva conversación». |
| **Menús desplegables** (perfil, empresa, «+» del composer, riel) | `src/shared/styles/global.css` (hover como REUI), `ProfilePopover.tsx`, `AccountPopover.tsx`, `SidebarRail.tsx`, `suite-ai/shared/composer.tsx` | `/design-system/header` (perfil abierto), `/design-system/barra-lateral` (menú del riel) | **Réplica** | Filas, orden, iconos, textos, hover y esquinas iguales al real. |
| **Ventanas** (Novedades, Bienvenida, «Ver qué cambió», ActionDialog, X estándar) | `src/shared/components/Announcements.tsx`, `ActionDialog.tsx`, `CloseButton.tsx`, `CommandPalette.tsx` | `/design-system/modales` | Reutiliza (casos Novedades, Lanzamiento y Buscador) + piezas propias | `modal-config.ts` (casos, tamaños, partes), `modal-parts.tsx`, `example-modals.tsx`. La X de los drawers (`drawer-shell.tsx`) debe ser la misma X estándar. |
| **Paneles laterales** (Actividad del agente, centro de procesos, panel del agente) | `suite-ai/chat/components/activity-panel.tsx`, `approval-plan.tsx`, `src/shared/components/ProcessCenter.tsx` | `/design-system/drawers` | **Réplica** | `drawer-config.ts`, `drawer-shell.tsx`, `drawer-styles.ts` (pasos, líneas, kickers), `agent-drawer.tsx`, `process-drawer.tsx`, `notifications-drawer.tsx`. |
| **Chat de Suite AI** (composer, mensajes, «escribiendo», propuesta editable, plan, métricas, saludo, voz) | `src/modules/admin/suite-ai/shared/composer.tsx`, `reply-details.ts`; `suite-ai/chat/components/*` (`agent-message`, `user-message`, `typing-indicator`, `proposal-card`, `approval-plan`, `metrics-card`, `chat-view`, `message-*`); `suite-ai/voz/main.tsx` | `/design-system/agente-contextual/configurador` | Reutiliza | Interruptores de `AgentConfig` (request, answer, typing, sources, actions, followups, news, chip, attach, voice), `regions`, `PART`, textos. Una pieza nueva del chat necesita interruptor, `regions` y texto. |
| | | `/design-system/navegacion/suite-ai` | **Réplica** | `proposal.tsx`, `sources-history.tsx`: la propuesta y las fuentes se ven como en el chat. |
| | | `/design-system/drawers` (caso Agente) | **Réplica** | `agent-drawer.tsx`. |
| **Agente contextual** (panel 452 / ampliado 720 / riel 60 / cerrado, propuesta «Actual / Propuesta», deshacer, foco) | `design-system/agente-contextual/components/agent-kit.tsx`, `agent-styles.ts`, `agent.module.css`, `use-agent-thread.ts`, `agent-sketch.tsx`; `lms-creator/components/agent-panel.tsx`, `agent-replies.ts`, `agent-focus.ts`, `editor-view.tsx` | `/design-system/agente-contextual/configurador` (caso base = editor de LMS), galería y 8 casos | Reutiliza | `agent-config.ts` (BASE, casos, estados, `PART`, textos), `agent-preview.tsx`, guía de `configurador/main.tsx`, lista de partes de la galería (`agente-contextual/main.tsx`). |
| **Botón «Orbit Flow»** (antes «Agente IA») y orbe | `ReopenAgentButton` en `agent-kit.tsx`; `src/shared/components/Orb.tsx`; **copia** en `editor-view.tsx` (botón propio con `data-agent-reopen`) | `/design-system/navegacion` (opción Orbit Flow), `/design-system/agente-contextual/configurador` (estado cerrado), `/design-system/header` (nota: no va en el header) | Reutiliza + textos | Posición en la fila de acciones, forma (completo / solo el orbe), nombre en la anatomía (`chip="top"` si se encima), texto de la regla en las tres páginas y en los 8 casos. |
| **Tema y reglas globales** | `src/index.css` (tokens), `src/shared/styles/global.css` (letra, suavizado, menús), `index.html` (fuentes) | Todas | Reutiliza | Réplicas con clases copiadas (`sidebar-styles.ts`, `drawer-styles.ts`, `header-preview.tsx`), `anatomy.module.css`, textos con colores o medidas, `reglas-vigentes.md`. Escaneo AA completo. |
| **Avisos flotantes** (toasts) | `src/shared/components/Toaster.tsx`, `notify.ts` | Sin página | — | Si el cambio es de diseño, proponer documentarlo. |

## Páginas del design system y sus rutas reales de ejemplo
- `/design-system/navegacion`: patrones en `/design-system/navegacion/{basica,detalle,tablero,seleccion-masiva,primer-uso,configuracion,menu-horizontal,documento,maestro-detalle,pasos,suite-ai}`.
- `/design-system/header`: casos con ejemplo en `/admin/seleccion/vacantes`, `/suite-ai`, `/suite-ai/chat/vacaciones`, `/admin/aprendizaje/lms-creator/contenidos` y `/portal-colaborador/aprendizaje`.
- `/design-system/barra-lateral`: casos en `/admin/tareas`, `/admin/aprendizaje/lms-creator/contenidos` (tercer nivel), `/suite-ai/chat/evaluaciones` y `/portal-colaborador/aprendizaje/catalogo`.
- `/design-system/modales` y `/design-system/drawers`: ejemplos que se abren en la misma página («Probar en pantalla», «Ver ejemplo con contenido»).
- `/design-system/agente-contextual`: galería; configurador en `/configurador`; casos en `/{resumen-registro,explicar-dato,comparar,completar-formulario,reescribir-seleccion,revision,accion-masiva,estados}`; caso base en `/admin/aprendizaje/lms-creator/contenidos`.


---

## Anexo B — Reglas vigentes de diseño

Decisiones que ya tomó Nicolás (diseño). Antes de un cambio se lee esta lista; si el cambio la contradice, se pregunta.
Después de un cambio que fija o reemplaza una regla, se actualiza aquí con fecha y se borra la versión vieja.
Cada regla dice **dónde se aplica** en la interfaz y **dónde se documenta** en el design system.

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
- **Panel del agente contextual dentro de los 1140** también en pantallas reales (16 sep): pantalla 688 + panel 452. Con
  el panel cerrado la pantalla ocupa los 1140.
  Documentado en: `/design-system/agente-contextual/configurador` y casos.

## Botón «Orbit Flow» (antes «Agente IA»)
- **Siempre el último de la fila** (auditoría del 5-oct; reemplaza la regla del 16 sep, que lo ponía a la izquierda
  del primario). Orden: Más acciones · Terciario · Secundario · Primario · Orbit Flow. Es `ReopenAgentButton`.
  Documentado en: `/design-system/navegacion` (opción Orbit Flow), configurador del agente (estado cerrado), nota en
  `/design-system/header`.
- **Forma:** pastilla completa por defecto; **solo el orbe** cuando la pantalla ya viene muy cargada (cabecera larga o
  botones con mucho texto). El nombre «Orbit Flow» sale al pasar el cursor.
- **No va en el header.** Con el panel del agente abierto no aparece.

## Menús, hovers y estados
- **Hover de menús como REUI** (16 sep): `#f5f5f5` (`--accent`) sobre menú blanco sólido, el mismo gris de la barra
  lateral, el header y los botones. En oscuro, `#262626`. Anula el modo «translúcido» de flux-ui en `global.css`
  (concesión para reportar a librería).
- **Selección activa en azul** (fila activa de la barra, riel, botones del header con su panel abierto): `bg-primary/10`
  + texto azul. La revisión del 16 sep pide «grises en hovers»: los hovers ya son grises; si se quiere gris también en
  los seleccionados, es una decisión pendiente.
- **Tooltips:** siempre `Hint` / `HintContent` (esquinas 6px, letra 14px). Todas las acciones del header llevan tooltip
  menos el buscador.
- **X de cerrar:** `CloseButton`, círculo de 32px claro; la de los drawers también es redonda.
- **Enlaces** como el Storybook (17 sep): texto azul **sin subrayado**, subrayado al pasar el cursor. Nada de `underline`
  fijo en `variant="link"`.

## Barra lateral
- **Productos en medium (500) y gris** (`text-muted-foreground`); la fila activa en azul (16 sep).
- Tarjeta de invitación sin «3 cupos libres».
- Empresas sin logo: baldosa azul muy suave con iniciales en gris oscuro, que no parezca insignia.
- Licencias con anillo azul; Créditos de IA con el degradado de la IA.
- El botón de abrir o cerrar la barra nunca va arriba del logo (en el editor va en su cabecera, junto a las migas).

## Tipografía y legibilidad
- **Sin letra monoespaciada** en la interfaz; números con `tabular-nums`.
- Nada por debajo de 13px en textos que se leen (chat y paneles).
- Letra de la interfaz: hoy **Inter Tight** (prueba del 16 sep, cargada desde Google Fonts). La revisión del 16 sep pide
  «dejar Inter normal»: **pendiente de aplicar**. Si se cambia, se cambia en `global.css` e `index.html` y se borra
  esta nota.

## Accesibilidad (condición de cierre)
- **WCAG 2.2 AA en claro y oscuro** (16 sep): `verificar.mjs` con 0 fallos de axe y revisión a mano de lo que axe no
  ve (degradados, estados con el cursor encima, menús y ventanas abiertos, teclado, 320px).
- Tokens ajustados para AA (16 sep): `--primary` oscuro `#6c96fe` con **texto azul marino en los botones azules**
  (pendiente de aprobación de Nicolás); `--muted-foreground` claro `#6d6d6d`; `--destructive` claro `oklch(0.51 0.21 27.3)`
  y oscuro `oklch(0.78 0.15 22.2)`; `--destructive-foreground` claro rojo oscuro.
- Texto blanco sobre el degradado de la IA («Nueva conversación»); rosa del degradado `#d22d6a` (4.67:1).
- Saludo de Suite AI: **uno por día**, con animación solo de entrada (17 sep). Ya no rota, así que cumple 2.2.2.

## Configuradores del design system
- **Panel de controles fijo** al lado de la vista previa, con el alto de la ventana y scroll propio (17 sep), para
  cambiar opciones sin perder de vista el resultado. El header no lo usa: su vista previa va arriba y los controles
  debajo en tres columnas.
- **Todos llevan «Probar en pantalla»** (`TryButton` + `TryOnScreen` del kit de anatomía): el componente configurado a
  tamaño real, sin nombres, sin bordes punteados y **sin rayado en los slots** (en su lugar, bloques grises tenues, como
  contenido real). Se cierra con Escape y devuelve el foco al botón. La capa es una rejilla de dos filas
  (`grid-rows-[auto_minmax(0,1fr)]`): franja de 53px arriba y el resto para la maqueta. Ojo: el Dialog de flux-ui es
  `grid`, así que `flex flex-col` en su `className` no aplica.
- **En el menú lateral solo va el configurador** de cada componente (17 sep): las pantallas de ejemplo siguen existiendo
  y se abren desde los casos, pero no ensucian la lista.

## Anatomía del design system
- Azul con nombre = parte del componente; gris rayado = slot (lo que pone cada pantalla).
- Los nombres de la anatomía no se enciman: `data-chip` (`top`, `inline`, `under`, `inside`).
- Cada caso de uso apunta a su pantalla real y se ve igual a ella.

## Referencias de medida (Storybook oficial de flux-ui, tema ubits + vega): todavía NO aplicadas
Esquinas: botones, campos y filas de la barra 6px; tarjetas 12px; etiquetas 4px; menús 6px con filas de 4px. Filas de
menú y barra de 32px con 8px entre icono y texto. Iconos de 16px, trazo 1.5, color del texto. La revisión del 16 sep pide
«border radius estándar», «iconos con más peso» y «ritmo vertical»: pendiente de decisión y aplicación. Cuando se
apliquen, pasan a reglas vigentes y se actualizan las réplicas.

## Concesiones sobre flux-ui (para el equipo de librería)
- Menús translúcidos anulados en `global.css` (hover #f5f5f5, fondo sólido).
- `FloatingActionBar`: la acción principal trae `text-white` fijo; se fuerza `text-primary-foreground` en selección masiva.
- Insignias sólidas `info` / `success` / `warning` / `destructive` con texto blanco sin contraste AA.
- Textos en inglés de la librería («Toggle Sidebar», «Close», región de toasts), rearmados donde se pudo (`Toaster.tsx`).
- Botones en pastilla y tamaños forzados con `!` en Suite AI (vienen del prototipo).


---

## Anexo C — Cómo está armado un configurador

Todas las páginas de componentes (`navegacion`, `header`, `barra-lateral`, `modales`, `drawers`,
`agente-contextual/configurador`) siguen el mismo esquema. Si respetas el esquema, la página se mantiene coherente.

## Archivos de una página

```
src/modules/design-system/<pagina>/
  main.tsx                         # página: casos, panel de controles, vista previa, partes y guía
  components/<x>-config.ts         # datos: qué se puede prender/apagar, casos, nombres y textos de las partes
  components/<x>-preview.tsx       # vista previa (usa el componente real o es una réplica) con las partes marcadas
  components/<x>-styles.ts         # (si hay réplica) clases copiadas del componente real
```

| Página | Configuración | Casos | Partes visibles | Vista previa |
| --- | --- | --- | --- | --- |
| Navegación | `PageConfig` | `PAGE_CASES` | `pageParts()` | `page-preview.tsx` (PageShell real) |
| Header | `HeaderConfig` | `HEADER_CASES` | `headerParts()` + `headerView()` | `header-preview.tsx` (réplica) |
| Barra lateral | `SidebarConfig` | `SIDEBAR_CASES` | `sidebarParts()` | `open-sidebar.tsx`, `rail-sidebar.tsx` (réplicas) |
| Modales | `ModalConfig` | `MODAL_CASES` | `modalParts()` | `modal-parts.tsx` (Dialog de flux-ui; «Probar en pantalla» usa las mismas piezas) |
| Drawers | `DrawerConfig` | `DRAWER_CASES` | `drawerParts()` | `drawer-shell.tsx` + `*-drawer.tsx` (réplicas) |
| Agente contextual | `AgentConfig` | `AGENT_CASES` | `agentParts()` | `agent-preview.tsx` (componentes reales del chat y del editor) |

## `*-config.ts`
- **Tipo de configuración:** una propiedad por cada cosa que se prende, se apaga o se elige. Si el componente real suma
  una parte opcional, suma su propiedad aquí.
- **Muestra (`*Sample`):** textos de ejemplo para que la vista previa se lea como una pantalla de verdad.
- **Casos (`*_CASES`):** `id`, `title`, `summary` (una o dos frases que explican el caso con la regla), `icon` de
  Hugeicons, `example` o `route` (la pantalla real donde se ve) y la configuración y muestra del caso. Cada caso tiene
  que parecerse a su pantalla real.
- **`PART`:** el nombre visible de cada parte («Botón primario», «Orbit Flow», «Header · 60px de alto»). **Tiene que ser
  idéntico** al `data-region` que pone la vista previa: la lista de partes y el resaltado se enlazan por ese texto.
- **Textos de parte:** qué es cada parte y su regla, en una frase, en español llano. Si cambia la regla, cambia este
  texto y el de la guía con las mismas palabras.
- **Función de partes visibles:** devuelve `PartInfo[]` (`{ name, text, slot? }`) en el orden en que se ven, de
  arriba abajo y de afuera hacia adentro. Parte nueva → agrégala donde corresponde según la configuración.

## `main.tsx`
- `AnatomyLegend`: explica azul (parte) y rayado (slot) y tiene el interruptor «Mostrar nombres».
- `CasePicker` y `CaseSummary`: elegir un caso, ver su resumen, abrir la pantalla real y «Restablecer» si se tocó algo.
- `ControlSection`, `Choice` (grupo de opciones, una sola) y `SwitchRow` (prender o apagar): el panel de controles. Una
  opción nueva en la configuración necesita su control aquí, con una nota breve (`NOTE`) si tiene una regla de uso.
- `AnatomyStage` (`names`, `hot`): envuelve la vista previa. Dibuja los nombres y resalta la parte que se señala en la
  lista.
- `PartsList`: «Partes de este caso», con las mismas pastillas que la vista previa.
- `GUIDE` o notas: las reglas generales de la página. Aquí va la redacción oficial de las reglas.

## Marcar partes en la vista previa
| Marca | Significa | Se dibuja |
| --- | --- | --- |
| `data-region="Nombre"` | Parte del componente | Borde azul punteado y pastilla azul con el nombre |
| `data-slot-region="Nombre"` | Slot: espacio libre para el contenido de cada pantalla | Borde gris y rayado |
| `data-chip="top"` | Botones chicos pegados a otros: el nombre va arriba | — |
| `data-chip="inline"` | Pieza dentro de una fila (los «…» de las migas, la flecha de volver): no se empuja, el nombre va arriba | — |
| `data-chip="under"` | Pieza dentro de otra parte que ya tiene su nombre arriba: el nombre cuelga abajo | — |
| `data-chip="inside"` | Pieza pegada al borde de arriba de su contenedor (ilustración de un modal): el nombre va adentro | — |

Por defecto, el nombre de un botón va debajo, alineado a su borde derecho. «Contenedor…» y «Acciones» van a la derecha.
Los componentes compartidos que aparecen en vistas previas aceptan props para marcarse sin cambiar cómo se ven:
- `regions` en `Composer` y `AgentMessage`;
- `region` en `UserMessage` y `TypingIndicator`;
- `region` y `chip` en `ReopenAgentButton`.

Si un componente compartido necesita una marca nueva, agrégale una prop opcional que solo ponga el atributo.

Las marcas son decorativas para lectores de pantalla (la pastilla va en `::after` con texto alternativo vacío). Los
nombres también están en texto en «Partes de este caso».

## Patrones de pantalla completa (`navegacion/<patron>`, `agente-contextual/<caso>`)
Van dentro de `CaseFrame` (franja «volver a la galería · qué resuelve · Mostrar anatomía») y usan `PageShell` real. Si
cambia el marco de página, revisa que la franja y la pantalla midan lo mismo (1140 en 1440).

## Página nueva para un componente que no tiene
1. Carpeta `src/modules/design-system/<pagina>/` con el esquema de arriba. Copia la estructura de la página más
   parecida: `header/` para una barra, `modales/` para algo que se abre y `navegacion/` para un marco.
2. Ruta en `src/modules/design-system/routes.ts`.
3. Entrada en `src/shared/layouts/nav-config.ts` (sección `design-system`, grupo de componentes). Es el único archivo de
   `src/shared/layouts/` que se puede editar sin permiso.
4. Súmala a `scripts/mapa.json` y a `referencias/mapa.md`.
5. Verifica con `verificar.mjs`: claro y oscuro, AA y anatomía sin nombres encimados.
