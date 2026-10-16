---
name: reunion-follow-up-2026-09-15
description: "Acuerdos del follow-up del 2026-09-15 con Carlos (y Nicolás al final): métricas de los 3 productos para la reunión con el CEO, iconos Glass solo en pantallas completas, Bold+ (el usuario corrigió: no «Bolt plus»), y ajustes al marco y al DS."
metadata: 
  node_type: memory
  type: project
  originSessionId: bec59ca1-6c42-4844-9b78-e4dd5b5e2d6a
  modified: 2026-09-16T02:41:14.653Z
---

Reunión «Follow up» del 2026-09-15. Carlos revisó la rama fusionada publicada y el DS reorganizado.

**Why:** el 16-sep Carlos presenta a Julián (CEO) y a los VP; quiere la Home con métricas de los tres productos
y el marco definitivo.

**Prioridad para el 16-sep (Home):** sumar métricas de los tres productos —Aprendizaje (usuarios con ingreso,
activos, tasa de terminación), Selección (funnel del dashboard de vacantes) y Desempeño y cultura (assessment y
evaluaciones 360)—. Los datos son reales y los mandó Carlos por Slack/Figma; hay que **transformarlos
visualmente** (no puros números): referencia TalentLMS, con jerarquía dinámica (atajos icono+texto corto,
una gráfica grande, una torta, top arriba), tarjetas **fijas**, no líquidas.

**Reglas nuevas:**
- **Iconos Glass solo en pantallas completas** (vacíos, errores, sin conexión, sheets), nunca en tarjetas
  sueltas: en los atajos de la Home van iconos normales de Hugeicons. Carlos comparte su Figma con iconos que
  customizó (wifi, error, calendario) para completar la familia. Corrige [[iconos-glass]].
- **Hovers grises demasiado oscuros** en menús y desplegables: deben ser claros como en ReUI (bloques › favoritos).
- **Bordes/esquinas siguen sin respetar la librería** (lo de Nicolás): Carlos insiste en consistencia.
- **Tipografía del menú**: Carlos ve el menú menos prolijo que ReUI; hipótesis de Cristian: demasiado espacio
  entre icono y texto, entre ítems y en blanco. Tarea: probar **Inter Tight** en una versión de la Home y
  ajustar espaciados. Ver [[ancho-y-tipografia]].
- **Carga progresiva**: la plataforma real tarda ~30 s y mezcla spinners, skeletons y blancos; unificar estados
  y pedir carga progresiva a backend (red flag).

**Ajustes pedidos al marco y a las plantillas (Cristian):**
- En la Home operativa, **Configuración va en el menú de empresa**, no en la barra lateral, y el grupo
  «Playground / Volver a Pantallas» se apaga: la Home debe verse como la real.
- Faltan conectar los enlaces del menú de las plantillas (planes, certificados).
- Cada template debe poder **abrirse en pestaña aparte** (como ReUI), no solo embebido.
- **Marca del DS**: el marco del design system no dice «Meta Colombia» sino **Bolt plus** (el DS se llama Bolt),
  con la B de su tipografía. Meta solo dentro del producto.
- **«Catálogo» confunde**: renombrarlo (p. ej. Storybook), porque lleva al Storybook y no a las fichas locales.
- La pestaña **Suite AI dentro del DS** debe llevar a los componentes de IA del DS (botón de IA primario,
  secundario, terciario y de solo icono; orbe/bubble con WebGL), no al admin. Terminología: **Shape of AI**
  (nudges, suggestions, autofill, chain actions), que Carlos comparte.
- El **login del playground** debería ser un inicio de sesión real para entrar al DS, y a futuro separar el DS.
- Login: incongruencia de los testimonios (Falabella, Sodimac…) con la marca del cliente; buscar algo general.
- Templates: decidir qué se mata; Cristian los tiene en «Archivo» y los borra al terminar.

**Hecho el mismo 15-sep (prueba-fusion):** Configuración fuera de la barra y dentro del menú de empresa
(`CONFIGURACION_EMPRESA` en nav-config + AccountPopover, que ahora enlaza en `plantilla-admin` y avisa en el
resto); sin grupo «Volver a Pantallas»; marca «Bolt plus» con B en las páginas del DS (AccountPopover devuelve
otra tarjeta cuando la sección es design-system); «Catálogo» → **Storybook** en `/design-system/storybook`.

**De Nicolás:** X de cerrar circular en modales, color de la forma en Suite AI, caso de cliente con un solo
producto (menú desplegado, sin colapsar), y su base/`template base` pendiente. Sus módulos (navegación,
drawers, modales, headers, barra lateral) se integran como módulos dentro de DS › Marco: lo hace Cristian.

Relacionado: [[reunion-cierre-concept-2026-09-14]], [[fusion-rama-nico]], [[estilos-nicolas-se-conservan]],
[[concepto-home-jefe]].
