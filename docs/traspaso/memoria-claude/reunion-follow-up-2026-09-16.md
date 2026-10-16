---
name: reunion-follow-up-2026-09-16
description: "Follow up del 16-sep con Carlos y Nicolás — rama única, escaneo 100% ReUI y lista de forzados, textos del login, avatares de color, pantallas vacías, ancho 1140, rooms de diseño."
metadata: 
  node_type: memory
  type: project
  originSessionId: bec59ca1-6c42-4844-9b78-e4dd5b5e2d6a
  modified: 2026-09-16T15:57:42.516Z
---

Reunión del 2026-09-16 (Carlos Varela, Nicolás García, Cristian). Sigue a [[reunion-follow-up-2026-09-15]].

**Para Cristian (el usuario):**
- **Escaneo total 100% ReUI** (doliente: Cristian): bordes, colores, botones pastilla solo en IA, fuentes. Va de la mano
  de la **lista de forzados con el porqué** (doliente formal: Nicolás; Cristian ya lo tiene en DS › Marco › Medidas y el
  artifact). Ejemplo de Carlos: el botón «Novedades» no es ninguna variante (primario…relleno gris): si se fuerza, se
  documenta como variante o se decide dónde se usa. Motivo: en UBITS históricamente se forzaba todo y se rompió.
- **Una sola fuente de verdad:** Carlos no quiere confundirse entre la rama de Nico y la de Cristian. Cristian publica su
  rama fusionada (prueba-fusion, ya subida) y Nico se la trae; ambos trabajan en ramas propias pero integran ahí.
  Cristian quería pulir el DS y subir las skills antes de pasársela.
- **Login:** dejar el logo de Meta así «para la venta» (Cristian proponía cuadrito alrededor por logos variados; Carlos
  lo aceptó como idea pero no ahora). Texto: quitar el nombre de la empresa y «aprendizaje» (ya no se venden como
  plataforma de aprendizaje) → **«Ingresa a tu cuenta»**.
- **Grises del hover** (pendiente del 15-sep): Carlos lo ve como un force; Nico dice que es decisión, lo revisa.
- **Pantallas de productos sin diseño** (Selección › plantillas, Vacantes…): se salen del estilo. Cristian propuso un
  /loop que recorra la plataforma real y arme versiones preliminares con el DS; Carlos aceptó con reparos (vacío da
  claridad de lo pendiente) → hacerlo, sin romper lo construido, plazo lunes/martes. Regla: **no mostrar cosas que no
  pertenecen a la sección** (p. ej. agente contextual prendido en Contenidos): mejor en blanco.
- **Home:** Carlos vio las pestañas por producto, Formación/Programas y Actividad; Cristian aclaró que hay gráficas de
  más como extra para la reunión con el CEO. Carlos dijo «aquí no cambian los saludos por tales» (revisar el saludo).
- **Reunión puntual** con Carlos para explicar el JSON/skills/grafo vs. un CLAUDE.md con /init; decidir cuál usar.
- Carlos vio un «saltico raro» en alguna transición; revisar cuando se suba.

**Para Nicolás:** Inter Tight no gustó (muy «semibold/gritón») → volver a Inter y probar peso **medium**; ritmo
vertical (spacing), antialiasing de fuente, stroke de iconos más grueso como ReUI (hoy 1); quitar «3 cupos libres»
(solo Invitar); progress y color de créditos de IA; estandarizar border radius de cartas; **avatares de color** (azul
suave como badges, que no parezca CTA); badge «versión Pro» bajo la empresa (Alfa Logística) por Enterprise; modo IA
junto a los CTA de la sección (solo orbe si hay mucho contenido), no en la top bar; **ancho 1140 en toda la interfaz**.

**Otros:** Carlos pedirá URLs bajo dominio de UBITS para publicar (reemplaza Vercel). Clientes usan laptops de gama baja:
lienzo ~1140 × 600–768. Desde la otra semana, **rooms** de diseño de 2–3 h por funcionalidad con entregable al final.

**Why:** consistencia y una sola fuente; lo forzado sin documentar es lo que rompió UBITS antes.
**How to apply:** priorizar escaneo ReUI + lista de forzados, texto del login, loop de pantallas preliminares; al diseñar,
probar a 1140 × ~700.
