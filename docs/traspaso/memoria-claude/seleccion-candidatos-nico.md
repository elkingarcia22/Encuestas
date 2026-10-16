---
name: seleccion-candidatos-nico
description: En Selección, candidatos (ficha, Mis candidatos, exploraciones) es de Nicolás y su versión prevalece sobre la de Cristian (23-sep).
metadata:
  type: project
---

Cristian, 23 sep, al revisar el PR #8 de Nicolás (feature/suite-ai-nico → staging, exploraciones de Selección):
«que prevalezca lo de Nico en Candidatos y eso, eso le tocaba a él».

**Why:** el reparto del trabajo: candidatos (ficha de la persona, «Mis candidatos», exploraciones uno/dos/tres en
`seleccion/propuestas` y `seleccion/exploraciones`) era de Nicolás. El expediente de Cristian
(`vacantes/detalle/candidato/`) se hizo sin saberlo.

**How to apply:** ante un choque en candidatos, gana lo de Nicolás; no proponer la versión de Cristian como
alternativa. El expediente queda a decidir (posible retiro o fusión). Relacionado: [[expediente-candidato]],
[[crear-vacante-elkin]].

23 sep: el PR #8 ya está unido a la rama cristian (commit de unión 78b8232, local, sin subir). Para no cambiar sus
pantallas, `data.ts` separa ETAPAS (las 5 por defecto, que leen sus pantallas) de ETAPAS_TODAS, y VACANTES (3) de
VACANTES_CON_DETALLE (con la comercial). Los textos del agente volvieron a 14px gris y rótulos a 11px; el saludo de
Suite AI se quedó en 600.

23 sep, después de unir el PR: Cristian dijo «deja lo que hizo Nico» también para los choques: dos «Crear vacante»
(su ventana y el asistente de Cristian), dos listas de vacantes, su regla de listas largas frente a la lista de
Cristian y sus 13 marcas de IA con estrellas. No tocar ni proponer cambiarlos por iniciativa propia.

23 sep: cristian (056e5a7) subida a Bitbucket y staging avanzada directo a ese mismo commit (sin PR). El PR #8
quedó con sus commits ya dentro de staging.

Aclaración de Cristian (23 sep): los cambios de texto de Nico que devolvimos (notas del agente 14px gris, rótulos
11px) solo aplican a lo de IA. Verificado: `AgentNote` y el `KICKER` de agent-styles solo se usan en contextos de
agente; drawers/modales/navegación usan el `KICKER` de drawer-styles (11px, nunca cambió) y el panel de LMS tiene
el suyo en 13px desde antes del PR.

23 sep, tarde: PR #9 de Nicolás (5488846, «Selección sin estilos forzados») unido directo a cristian y staging.
Corrigió diálogos (todo ActionDialog/DialogoConfirmar; ActionDialog suma size="wide" y footer) y casi todos los
estilos forzados; AiCard suma inFrame. Quedan: 4 fantasmas en gris, las 6 piezas fuera del DS y documentar en el DS
las opciones nuevas de ActionDialog y AiCard.
