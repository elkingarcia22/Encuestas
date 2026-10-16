---
name: icono-ia
description: Reglas de IA (22-28 sep): orbe (<IconoIA />), botón de IA siempre el último, y el que abre el agente contextual se llama «Agente IA».
metadata:
  type: feedback
---

Cristian, 22 sep: «lo que sea de IA lleva el icono de IA, eso también a las skills». Constante única en
`src/modules/design-system/ia/icono-ia.ts` (`ICONO_IA`); se marca al nivel más alto que sea todo de IA.

**Why:** que se distinga a simple vista qué produjo la IA; antes el producto mezclaba SparklesIcon, AiMagicIcon y MagicWand01Icon.

**How to apply:** al maquetar, cualquier evaluación, puntaje, lectura, etapa o nota de IA lleva
`<HugeiconsIcon icon={ICONO_IA} />`; el orbe no se toca. Quedó en flux-ui-storybook, revisar-contra-reui,
reglas-vigentes.md y /design-system/ia/superficies. Pendiente: barrido del resto del producto y que
Nicolás confirme chispa vs AiMagic. Relacionado: [[expediente-candidato]], [[auditoria-unificacion-2026-09-17]].

23 sep: «los botones de IA van a la derecha siempre, como el último botón» — orden terciario · secundario ·
primario · «⋯» · IA. Quedó en las mismas skills, reglas-vigentes.md y /design-system/ia/botones.
AGENTS.md es andamiaje protegido (el check lo rechaza): el texto propuesto está en el scratchpad de la sesión
del 23-sep y hay que pedírselo a ingeniería.
El expediente se rehízo el 23-sep con Frame (Marco en piezas.tsx) + columna «En el proceso» a la derecha: el usuario
rechazó las Card sueltas con tres columnas («no me gusta para nada el layout»).

23 sep, más tarde: «no uses esos iconos de estrellas». El icono de IA es el orbe: `<IconoIA />` en
`src/modules/design-system/ia/icono-ia.tsx` (Orb a 16 px). Prohibido marcar IA con SparklesIcon, AiMagicIcon,
MagicWand01Icon o StarsIcon. Los botones de IA usan BotonIaSecundario/AiButton/ReopenAgentButton (ya traen el orbe).

25 sep: «mejoremos lo que los demás usan como tag/chip de AI». Había 6 estilos (info-light, outline, secondary,
info-outline, primary-light con chispa) y el orbe de 16 px se desbordaba en insignias xs/sm. Ahora hay una sola:
`<EtiquetaIA size="xs|sm|…">` en `src/modules/design-system/ia/etiqueta-ia.tsx` = Badge secondary (gris) + radius full + orbe
ajustado al tamaño. Cristian eligió el gris tras comparar (contorno se confundía con las fuentes «LinkedIn»; azul claro
era mi recomendación; azul de marca no pasa AA en oscuro, 3,1). Toda insignia de IA usa esa pieza, nunca Badge + IconoIA a mano. Pendiente sin tocar: la
chispa en las sugerencias del chat de Suite AI (agent-message.tsx) y en Announcements.

28 sep: «todos los botones de IA que son medio contextuales deben decir Agente IA». El botón que abre el agente
contextual se llama «Agente IA» (antes «Modo IA», y en Planes/Grupos «Asistente IA para …»): se usa
`ReopenAgentButton` sin `label`. Las acciones puntuales («Resumir con IA», «Generar con IA») conservan su texto.
Renombrado en código, design system, skills y CLAUDE.md; los archivos de Unificación (otra sesión) no se tocaron.
