---
name: concepto-nicolas
description: "El concepto visual de Nicolás (Claude Design, artifact público), en qué choca con Carlos y cómo quedó en código como template suite-ai (2026-09-13)."
metadata:
  node_type: memory
  type: reference
  originSessionId: 9b6ec876-7655-459c-8d46-b59dd878042e
  modified: 2026-09-14T04:16:52.076Z
---

Nicolás García (el otro diseñador) compartió su concepto como artifact de Claude Design:
https://claude.ai/code/artifact/71f44abe-8746-492c-b3f1-3f4f293a7dd4

**Cómo leerlo:** la acción `read` del Artifact falla («public reader» no habilitado) y Chrome
headless recibe «Page not found». Funciona en el panel de navegador de la app (los clics en sus
pestañas sí responden). El HTML completo (~12 MB, plantilla con `sc-if`/`sc-for` y el estado en
JS) se baja con curl desde el `src` del iframe `*.frame.claudeusercontent.com`.

**Qué trae:** 7 casos de uso en pestañas: 00 Inicio, 01 Agente IA (chat nuevo de Suite AI), 02
Propuesta editable, 03 Editor + agente (editor de contenido con agente contextual), 04 Modo voz,
05 Aprobación, 06 Buscador (⌘K). El «Inicio» es el antiguo Dashboard del playground
(`templates/dashboard/data.ts`: 4 KPIs, Tu día, Formación, Programas, Vacantes, Evaluaciones 360,
Actividad) con su estilo.

**Choques con [[feedback-carlos-concepto]] al 2026-09-13:** marca Meta (no Google), grises cálidos
(#f5f3f1, #ebe8e4, #5f5a54), tipografía Geist con cifras en peso 300, Home con demasiada
información y 4 KPIs, LMS Creator lleva al editor en vez de abrir el submenú, perfil con Mi perfil,
Preferencias, Notificaciones y Atajos. Ya aplica: Suite AI con bolita, historial en el menú, «+»
con Agregar archivos y Conectores, promo con imagen, botones de 8 px y pastilla solo en IA.

**En código (2026-09-13):** el usuario dijo «lo que hizo Nicolás está perfecto, tráelo a código
sin afectar lo mío». Quedó en `src/modules/design-system/templates/suite-ai/` (ruta
`/design-system/templates/suite-ai`, tarjeta en Templates y entrada en nav-config). Los 7 casos
son rutas (`chat`, `chat/evaluaciones`, `editor`, `voz`, `chat/vacaciones`, `vacantes` + ⌘K) y un
menú «Casos de uso» al pie del menú lateral salta entre ellos. Estado compartido en
`components/estado.ts` (contexto del layout); imágenes del concepto (logo Meta, bolita, textura)
en `assets/`. Se dejó **Meta** como en el concepto (falta decidir si pasa a Google). No se pudo
calcar con flux-ui: grises cálidos, Geist y cifras finas, botones pastilla, enviar con degradado,
Novedades azul claro y buscador ancho (el tema fija los modales en ~512 px). Sin commit ni
publicación en Vercel a esa fecha. Relacionado: [[concepto-home-jefe]], [[marco-unico-shellubits]].
