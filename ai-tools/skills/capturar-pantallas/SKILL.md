---
name: capturar-pantallas
description: >-
  Capturar pantallas del playground para mostrárselas a alguien, comparar antes y después,
  o revisar cómo quedó algo sin pedirle al equipo que lo mire. Usar cuando pidan "muéstrame
  cómo quedó", "pásame un pantallazo", "compara antes y después", o al terminar un cambio
  visible. Explica cómo levantar la vista previa, recortar solo la parte que importa y
  capturar estados que hay que abrir con un clic (menús, diálogos, pestañas).
---

# Capturar pantallas del playground

Nadie del equipo debería tener que abrir el navegador para ver cómo quedó algo. Se captura y
se le entrega la imagen.

## 1. La vista previa

Con `preview_start` y el nombre `playground-ux` (está en `.claude/launch.json`). El puerto que
devuelve el panel **no siempre es el que sirve**: si la página sale en blanco, mira el puerto
real en `preview_logs` y usa ese.

Si trabajas en un worktree fuera del proyecto, `preview_start` no lo acepta (`cwd must be a
relative path within the project root`). Levanta ahí el servidor en segundo plano con
`npm run dev -- --port 5199 --strictPort` y trabaja contra ese puerto.

## 2. La captura

Para una pantalla entera basta el `screenshot` del navegador. Para todo lo demás —recortar una
sección, abrir un menú, capturar por encima del pliegue— usa Chrome sin ventana por CDP. El
guion base está en cualquier `capturar-*.mjs` del directorio de trabajo temporal de la sesión;
copia uno y cambia la lista de tomas:

```js
const TOMAS = [
  { nombre: 'aprendizaje', url: '/admin', recorte: { sels: ['section[aria-labelledby="por-producto"]'] } },
  { nombre: 'menu', url: '/admin', clics: ['[data-slot="dropdown-menu-trigger"]'], recorte: { sels: ['[data-slot="dropdown-menu-content"]'] } },
]
```

Las piezas del guion:

- **`Emulation.setDeviceMetricsOverride`** con `deviceScaleFactor: 1.5`, para que el texto se
  lea al ampliar.
- **`Input.dispatchMouseEvent`** (mouseMoved + mousePressed + mouseReleased) para los estados
  que hay que abrir: menús, diálogos, pestañas, hover.
- **Una unión de rectángulos** de varios selectores + `Page.captureScreenshot` con `clip`, para
  recortar solo lo que importa.
- **`scrollIntoView({ block: 'center' })` antes de medir**: lo que está bajo el pliegue se
  recorta a la altura de la ventana y la imagen sale cortada (o con altura negativa).

## Trampas

- **Pantallas a pantalla completa** (plantillas, login): el marco general sigue debajo. Acota
  el DOM al contenedor de la plantilla antes de medir.
- **El servidor se cae seguido.** Si `curl` devuelve 000 o la captura sale en blanco,
  reinícialo antes de volver a intentar.
- **Interpolar en el guion**: lo que va dentro de `Runtime.evaluate` se ejecuta en el
  navegador, donde no existen las variables de Node. Usa `${...}` del lado de Node.
- **Comparar antes y después**: captura primero, con el mismo recorte y el mismo ancho, y
  guarda las dos series en carpetas distintas (`antes/`, `despues/`).

## Entregar

Manda las imágenes con `SendUserFile`, con un pie corto que diga qué se está mirando. Si son
varias de lo mismo (las tres pestañas de una sección, por ejemplo), van juntas en un envío.
