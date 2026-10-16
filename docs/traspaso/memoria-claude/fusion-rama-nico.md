---
name: fusion-rama-nico
description: "Estado de la fusión de feature/suite-ai-nico con cristian (2026-09-15) — rama local prueba-fusion, choques resueltos, dos marcos conviviendo, qué falta."
metadata: 
  node_type: memory
  type: project
  originSessionId: bec59ca1-6c42-4844-9b78-e4dd5b5e2d6a
  modified: 2026-09-16T03:10:49.134Z
---

El 2026-09-15 el usuario pasó la rama de Nicolás (`feature/suite-ai-nico`, Bitbucket techubits/playground-ux).
Ambas salen de `develop` (7441d63). Se fusionó en la rama **local** `prueba-fusion` (commit 91f5d78), en un
worktree del scratchpad; **no se subió nada** y `cristian` no se tocó. `origin/cristian` tampoco tiene aún
el commit 79b3957 (sin push).

Solo chocaron `design-system/routes.ts` (se conservó ShellUbits para las páginas de Cristian; Drawers,
Navegación y Agente contextual de Nicolás van fuera, en el marco global) y `nav-config.ts` (base de Nicolás
+ templates de Cristian con icono + grupo Patrones). Compila (`tsc -b`, `vite build`) y las pantallas cargan.

Nicolás cambió archivos protegidos: `src/index.css` (--accent neutro: arregla [[accent-igual-a-primary]]),
`AppSidebar.tsx`, `RootLayout.tsx`. El check los marca mientras no están commiteados; una vez commiteados pasa
solo porque `check.mjs` compara contra `origin/main`/`master`, que no existen (cae a HEAD). Aprobación real:
Cris Burbano / ingeniería.

**Paso 1 hecho (2026-09-15, commit 9920426 en prueba-fusion):** las páginas de documentación dejaron ShellUbits:
`design-system/shell/main.tsx` ahora es solo `PageShell` (1.140 px) dentro del marco de Nicolás; `EncabezadoPatron`
envuelve su `PageHeader` (antetítulo «Design system · Patrones/Fundamentos/Pantallas»); menú del design system en
4 grupos (Empezar, Fundamentos, Patrones, Pantallas) y la portada se arma desde ese menú. Check en verde. Las
páginas de Nicolás van fuera de shell/main porque ponen su propio ancho. Capturas por Chrome headless: lanzar
en segundo plano con perfil propio y matar después (con `--virtual-time-budget` no termina solo).

**Fundamentos › Marco (2026-09-15, commit 15e0a2b):** página `/design-system/marco` con capturas reales de la
barra lateral (Workspace, Suite AI, tercer nivel, riel, menú de empresa), barra superior (completa, ⌘K,
Novedades, notificaciones, procesos, perfil) y pie, más reglas y pendientes. Imágenes en
`design-system/marco/assets/`, generadas con `scratchpad/capturar-marco.mjs` (CDP, DPR 2; repetirlo si Nicolás
cambia el marco). `ItemDescription` corta a 2 renglones: listas de reglas en una columna. Hallazgo: «Gestión de
usuarios» ya está en el menú de empresa de Nicolás (ahí va esa pantalla en la mudanza).

**Botones «Ver en pantallas reales» (2026-09-15, commit 3bb5673):** pieza compartida `VerEnPantallasReales`
en `patrones/piezas.tsx`, usada por Formularios, Estados (p-08 vacío «todavía no», Encuestas › Datos
demográficos, carga de Encuestas, aviso en Crear usuario, eliminar encuesta, carga masiva, p-99 no existe) y
Data-grid (usuarios, planes, encuestas, participantes de p-01). Rutas desde `admin-compartido/rutas.ts`:
al mudar los templates, cambiar solo ahí. Verificado por CDP que cada destino muestra su estado.

**DS reorganizado (2026-09-15, commit 58c3d96, decisión del usuario con opciones):** menú en 5 grupos —
Empezar (Cómo usar el sistema, Flujo de trabajo), Fundamentos (Color, Tipografía, Espacio y esquinas, Iconos,
Marco), Componentes (Catálogo, Botones, Bloques), Patrones (Navegación, Estados, Data grid, Formularios, Drawers,
Agente contextual), Pantallas (Todas, Admin›4, Colaborador, Inicio de sesión, Archivo›7 exploraciones y copias).
Nombres en español (rutas viejas se mantienen: /get-started, /icons, /componentes). Catálogo importa
`ai-tools/flux-ui/flux-ui-para-ia.json` directo (89 piezas, agrupadas por uso). Color calcula el hex en vivo con
canvas. `Reglas` es pieza compartida en `patrones/piezas.tsx`. La validación rechaza «bg-blue-500» aunque sea
texto de ejemplo. Bloques sigue vacía.

**Plantillas en el marco del DS (2026-09-15, commit en prueba-fusion tras 58c3d96):** el usuario pidió que SUS
plantillas (no el /admin de Nicolás) usen sidebar, top bar y pie del DS, sin cambiar de URL. Hecho con secciones
`plantilla-admin` / `plantilla-colaborador` en nav-config (copian el menú de admin/portal y remapean rutas:
propias → plantilla, resto → `home-operativo/<slug>` pendiente; renombres dashboard→dashboard-seleccion,
descarga/configuracion→…-certificados; la sección con 3.er nivel de Planes apunta a la plantilla), `base` para
migas y `getSectionId` que mira prefijos de plantilla primero. `admin-compartido/marco-plantilla.tsx` = PageShell +
migas + ToastToaster; MarcoAdmin conserva el contexto (abrirSuiteAI → navega a /suite-ai). Se quitó `PieWorkspace` de
10 pantallas. Archivo sigue con ShellUbits. Efectos: marca Meta Colombia en vez de Google; pestañas Workspace/Suite
AI salen a /admin y /suite-ai; tarjeta de invitación de RH también en colaborador.

**Segunda fusión (2026-09-15 tarde, commits 3fd05f2…52ad47b de Nicolás):** trae configuradores con anatomía —
Barra lateral, Header, Modales, agente-contextual/Configurador— y ajustes de Drawers y Navegación. Choques:
nav-config (sus 3 páginas nuevas se metieron en el grupo Patrones) y `PageShell` (él sumó `titleSize`, `nav`,
`titleAction`, back en icono y `tabsRegion`; se conservó todo pero `TITLE_SIZE` con clases forzadas pasó a
`TITLE_LEVEL` = niveles 2/3/4 de Heading del tema). Sus configuradores muestran ya la marca «Bolt plus».

**DS con lo nuevo + Suite AI (2026-09-15 noche):** menú del DS = Empezar, Fundamentos, Componentes, Patrones
(Navegación, Barra lateral, Header, Drawers, Modales, Estados, Data grid, Formularios), **Suite AI** (Piezas de IA
`/design-system/ia` + Agente contextual con su Configurador) y Pantallas. `ia/main.tsx` documenta la jerarquía de
botones de IA (primario y secundario con capturas reales; terciario y solo icono como propuesta con Button + orbe),
superficies (tarjeta, selector Workspace/Suite AI, composer), estados y vocabulario tipo Shape of AI. **Resuelto el 2026-09-16 (commit 3f3139e, pedido del usuario):** estando en el
design system, la pestaña Suite AI abre la sección `design-system-ai` (menú propio: Inicio /design-system/ia,
Piezas = una entrada por pestaña /design-system/ia/<pestaña>, Interacciones = Agente contextual, Pantallas = Suite AI
concepto y Home Suite AI; `base: '/design-system'` para las migas). Toca AppSidebar y SidebarRail (`chat` = solo
/suite-ai): el check lo marca como andamiaje hasta commitear; avisar a Nicolás/ingeniería. La marca del DS es
**«Bold+»** (no «Bolt plus»).

**Why:** reunión [[reunion-cierre-concept-2026-09-14]]: una sola fuente de verdad, marco de Nicolás, rama común.
**How to apply:** el 2026-09-16 el usuario pidió subirla tal cual: `prueba-fusion` ya está en Bitbucket
(https://bitbucket.org/techubits/playground-ux/branch/prueba-fusion, 42 commits sobre develop, sin PR); siguen **dos marcos** (ShellUbits con
Google/UBITS en docs y templates de Cristian, marco global de Nicolás con Meta Colombia en /admin, /suite-ai y
sus páginas de docs). Unificarlos es el paso siguiente ([[marco-unico-shellubits]]). Para previsualizar un
worktree con node_modules enlazado, la fuente Inter da 403 (fuera de server.fs.allow): no es un fallo real.

**Tercera fusión (2026-09-16 tarde):** trae 3aad4eb, 66e11b5 y 3118801 (Inter Tight en global.css, barra en medium y
gris, sin «3 cupos libres», anillos de consumo con `account-gauge.module.css`, 1140 en DS y chat, barra plegada bajo 1200
px en RootLayout, Modo IA a la izquierda de los CTA, configurador del agente rehecho). Único choque: imports de
AccountPopover (se juntaron). El usuario pidió «todo excepto Inter Tight»: b888028 restaura index.html y global.css a Inter. Si Nicolás vuelve a fusionar, no traer Inter Tight.

**Cuarta fusión (2026-09-17, commit 4a36ed1):** trae d926f7b de Nicolás (accesibilidad WCAG 2.2 AA con tokens nuevos en
index.css —destructive-foreground rojo oscuro—, 1140 centrado, agente pegado al borde, «Modo IA» a la izquierda del primario,
configuradores con «Probar en pantalla», menú del DS con solo el configurador de Navegación/Agente, skill
«sincronizar-design-system»). 14 choques: se conservó la revisión ReUI (sin pastillas ni radios/altos forzados, CommandInput) y
la Home unificada, sumando sus atributos de accesibilidad; en los configuradores quedan «Ver en acción» + «Probar en pantalla».
