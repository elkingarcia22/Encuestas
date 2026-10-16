---
name: campos-40px
description: Los campos del playground miden 40px, no los 36 de la librería; la regla vive en src/index.css y deja el check en rojo a propósito.
metadata:
  type: project
---

Desde el 2026-09-22, por pedido de UX, **todos los campos del playground miden 40 px de alto**
en vez de los 36 que trae flux-ui: campo de texto, selector, selector con buscador, campo con
icono y campo numérico. No cambian el área de texto, el compositor del agente, el buscador de
comandos ni los buscadores de las tablas (esos ya llevaban un alto propio y se respeta).

**Por qué importa recordarlo:** es la **única regla del proyecto que le cambia la apariencia a
un componente de la librería**, y vive en `src/index.css`, que es zona protegida. Por eso
`npm run check` marca «Scaffolding modificado — src/index.css» **a propósito**: no es un fallo
que haya que arreglar ni desactivar, está **esperando el visto bueno de ingeniería**.

**Cómo aplicarlo:** el número está una sola vez, en `--alto-campo`. Está documentado en
Design system › Marco › Ajustes propios («Campos de 40 px»), marcado como pedido a la
librería: cuando ellos publiquen un alto propio, esta regla se borra. No forzar el alto campo
por campo en una pantalla. Ver también [[estilos-nicolas-se-conservan]] y
[[ancho-y-tipografia]].
