---
name: arranque-repo-claude
description: "El repo tiene CLAUDE.md propio (ya no es enlace a AGENTS.md), seis skills en ai-tools/skills y hooks que avisan al abrir sesión; qué hay en cada sitio."
metadata: 
  node_type: memory
  type: project
  originSessionId: bec59ca1-6c42-4844-9b78-e4dd5b5e2d6a
  modified: 2026-09-17T22:41:04.068Z
---

Desde el 2026-09-17 (commit `60bd720` en `prueba-fusion`):

- **`CLAUDE.md`** dejó de ser un symlink a `AGENTS.md`. Tiene el mapa del repo, dónde están el
  catálogo y el grafo, la lista de skills, las trampas conocidas y cómo cerrar. Las reglas de
  diseño siguen en `AGENTS.md`, que no se tocó (Cursor, Codex y Gemini siguen igual, con
  `GEMINI.md` como enlace).
- **`ai-tools/skills/`** (y `.claude/skills` como symlink): flux-ui-storybook, reui-to-flux-ui,
  sincronizar-design-system, revisar-contra-reui, capturar-pantallas, publicar-en-vercel.
- **`ai-tools/hooks/revisar-acceso.mjs`**: al abrir sesión avisa si caducó el acceso a la
  librería interna (`npm view @ubits/flux-ui version` devuelve E401). El token dura ~12 h y se
  renueva con `npm run aws-login` + reiniciar el editor. Cuando está caído, el MCP de flux-ui
  falla con CONNECTION_CLOSED y hay que decidir con [[flux-ui-mcp-catalogo-incompleto]].

**Cómo aplicarlo:** si algo cambia en cómo se trabaja aquí (una trampa nueva, un procedimiento
que se repite a mano), va al repo —CLAUDE.md o una skill— y no solo a esta memoria, para que le
sirva a todo el equipo.
