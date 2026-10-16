# Playground UX

App de **React 19** con **Vite** y **router por módulos**. Cada dominio declara sus rutas, se registra en un catálogo y React Router las ensambla con lazy loading.

Usa la librería interna `@ubits/flux-ui` (AWS CodeArtifact). El acceso se configura **al instalar dependencias** (`npm install`); no hace falta configurar npm a mano.

## Arrancar (equipo UX)

No hace falta saber de terminal. Abre este repo en Cursor o Claudey, en el chat, escribe una de estas frases:

**Primera vez (Mac nueva o clon recién bajado)**

> Prepara el playground

o

> Configura mi entorno

La IA instala lo que falte (Node, AWS CLI, dependencias), pide el login de AWS cuando toque instalar, y abre la app. Si es la primera vez en esa Mac, te va a decir que **ingeniería configure tu acceso AWS una sola vez**.

**Si la librería interna o el MCP no responden** (pasa cada ~12 horas)

> Vuelve a conectar la librería interna

Después **reinicia Cursor**.

**Día a día** no hace falta pedir la preparación: dile “abre el playground” o corre `npm start`.

### Comandos (si no usas la IA)

```bash
bash scripts/setup.sh   # primera vez
npm start               # abrir la app
npm run aws-login       # si caducó el acceso (~12 h)
```

## Scripts

```bash
bash scripts/setup.sh      # instala herramientas si faltan + npm install (con login)
npm install                # login AWS (preinstall) + dependencias
npm run aws-login          # solo autenticar (si el token de ~12 h caducó)
bash scripts/aws-login.sh  # lo mismo, sin necesitar node_modules
npm start                  # abre la app (sin login ni install)
npm run dev                # lo mismo que start
npm run check              # valida las reglas del playground + lint + typecheck
npm run build              # typecheck + build
npm run preview            # preview de producción
npm run lint               # oxlint
```

## Trabajar con asistentes de IA

Las reglas del playground viven en [AGENTS.md](AGENTS.md): toda la UI sale de `@ubits/flux-ui`,
los colores son tokens del tema y las maquetas van en `src/modules/<módulo>/<pantalla>/`.

Funciona igual en Cursor, Claude Code, Codex y Gemini CLI. `GEMINI.md` es un symlink a
`AGENTS.md` y el MCP se comparte por symlink desde `.cursor/mcp.json`. Claude Code tiene además
su propio [CLAUDE.md](CLAUDE.md), con el mapa del repo, las skills y las trampas conocidas, y
usa `.claude/settings.json` para los servidores MCP y los hooks.

Al terminar una maqueta, corre `npm run check`.

### Qué mirar primero

| Para | Abre |
| --- | --- |
| Elegir componentes | `ai-tools/flux-ui/flux-ui-para-ia.json` — los 89 de la librería, con variantes y para qué sirven, en español |
| Entender el producto | `docs/plataforma-ubits/` — cómo funciona UBITS hoy, historias de usuario y recorridos |
| Ver las pantallas y cómo se enlazan | `docs/plataforma-ubits/graphify-out/graph.html` — el grafo de la plataforma |
| Saber qué se forzó y por qué | La pantalla Design system › Marco › Ajustes propios |

### Lo que ya está empaquetado

En `ai-tools/skills/` hay seis procedimientos que el asistente usa solo cuando hacen falta:
elegir componentes del Storybook, traer un bloque de ReUI y cambiarlo por piezas nuestras,
mantener el sistema de diseño al día, revisar una pantalla contra ReUI, capturar pantallas del
playground y publicar en Vercel.
`.claude/skills` es un symlink a esa misma carpeta, así que se edita en un solo lugar.

En `ai-tools/hooks/` están los avisos automáticos: se comprueba el catálogo de la librería y el
acceso a ella al abrir sesión, se revisa que la UI salga de `@ubits/flux-ui` antes de escribir
un archivo, y se repasan los cambios de `src/` al cerrar.

### Si algo no responde

El acceso a la librería interna dura unas 12 horas. Cuando caduca, el MCP de flux-ui deja de
responder y `npm install` falla; el asistente lo avisa al abrir la sesión. Se arregla con
`npm run aws-login` y reiniciando el editor.

## Cómo agregar un módulo

1. Crea `src/modules/<nombre>/routes.ts` exportando un `AppModule`.
2. Pon las páginas en `src/modules/<nombre>/pages` y expórtalas como `Component` para `lazy()`.
3. Súmalo al array de `src/app/register-modules.ts`.

Si el módulo tiene `nav: true`, aparece solo en el header.
