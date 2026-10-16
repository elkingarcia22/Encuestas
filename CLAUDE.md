# Claude en el Playground UX

Las **reglas de la maqueta** (qué librería, qué iconos, qué colores, qué no se toca, cómo se
entrega) están en **[AGENTS.md](AGENTS.md)** y son obligatorias. Léelas antes de escribir
interfaz; este archivo no las repite, solo cuenta cómo trabajar aquí.

## Qué es esto

Un playground de maquetación del equipo de UX de UBITS. Sirve para armar pantallas rápido con
la librería interna y enseñarlas, no para construir producto. Quien pide los cambios es
diseño: **responde en español y sin jerga técnica**, describiendo lo que se ve en pantalla y
en qué dirección, no cómo está implementado.

## El mapa

| Dónde | Qué hay |
| --- | --- |
| `src/modules/admin/` | Las pantallas del administrador (inicio, selección, aprendizaje, desempeño y cultura, tareas, avisos, configuración) y Suite AI |
| `src/modules/portal-colaborador/` | El lado del colaborador |
| `src/modules/design-system/` | El sistema de diseño: fundamentos, patrones, piezas de IA, el Marco y las Pantallas |
| `src/modules/design-system/templates/` | Pantallas completas y navegables, más el archivo de exploraciones viejas |
| `src/shared/` | El marco general: barra lateral, encabezado, menús, buscador, piezas compartidas. **Zona protegida** |
| `docs/plataforma-ubits/` | Cómo funciona UBITS hoy, las historias de usuario y los recorridos. De ahí salen los textos y las reglas de negocio reales |
| `docs/plataforma-ubits/graphify-out/` | El grafo de la plataforma (`graph.json`, `graph.html`): las pantallas del producto y cómo se enlazan |
| `ai-tools/reglas/` | **La fuente única de las reglas.** `reglas.json`: las reglas vigentes con fecha y pantalla modelo, las piezas del proyecto, las piezas retiradas con su sustituta y lo que falta decidir. `generar-reglas.mjs` lo lleva a `AGENTS.md` (bloques `generado:`), al catálogo para la IA y al grafo; el recordatorio de cada mensaje lo lee directo |
| `ai-tools/mcp/` | **`ds-ubits`, el design system como herramienta para la IA** (MCP del repo, registrado en `.cursor/mcp.json`): `buscar_pieza`, `pieza`, `reglas_para`, `revisar`, `usos`, `retiradas_en_uso`, `por_decidir`. Lee `reglas.json`, el catálogo y el grafo |
| `ai-tools/grafo/` | **El grafo de todo el proyecto: léelo primero.** `GRAFO.md` resume las piezas del equipo por uso, el flux más usado, cada pantalla con sus piezas e historias, los archivos por dueño, las retiradas que siguen en uso, los huérfanos y las citas rotas; `grafo.json` lo tiene completo (también el producto real, enlazado por HU) e `indice-archivos.json` da por archivo su dueño, rutas, imports, piezas y reglas. Lo genera `generar-grafo.mjs` al abrir la sesión; no se edita a mano. Se explora en `/design-system/grafo` |
| `ai-tools/` | El catálogo de la librería, los hooks, las skills y los prompts para el equipo (`prompts/revisar-design-system.md`: revisar tu trabajo contra el design system). `flux-ui/diferencias.json`: lo que hacemos distinto de la librería, para su dev |

Una pantalla nueva vive en `src/modules/<modulo>/<pantalla>/main.tsx`, exporta `Component`, se
registra en el `routes.ts` del módulo y, si va al menú, en `src/shared/layouts/nav-config.ts`
(la única excepción de la zona protegida).

## Antes de escribir interfaz

**Pregúntale al design system antes de escribir.** Con la herramienta `ds-ubits`: `buscar_pieza`
por cada cosa que vas a poner en pantalla («confirmar», «tabla», «salir», «aviso»…) y
`reglas_para` con el archivo que vas a tocar; al terminar, `revisar` sobre ese archivo. Te dan
la pieza con su import, una pantalla real que ya la usa y la regla con su fecha. Si la
herramienta no está, lee `ai-tools/reglas/reglas.json`. Las inconsistencias de la auditoría del
8-oct salieron de maquetar de memoria y de reglas que cambiaron sin que nadie barriera: esto es
para no repetirlo.

**Primero el proyecto, después la librería.** El orden es: pieza que ya existe aquí →
componente de flux-ui del catálogo → para y pregunta. Muchas cosas ya están resueltas y
envueltas con las decisiones del equipo, y volver a armarlas con flux-ui crea una segunda
versión que se desincroniza: el marco de página es `PageShell` (y él pone el ancho); un aviso,
`notify`; el botón terciario de solo icono, `BotonIcono`; el orbe del agente, `Orb`; un panel
lateral, `DrawerShell`; preguntar antes de hacer algo (eliminar, salir sin guardar, activar),
`DialogoConfirmar`, y cualquier otra ventana, `ActionDialog`; una tabla, `TablaDatos` (la
única); el agente contextual, el `agent-kit`. Son unas cuarenta, más las utilidades de formato y ancho
(auditoría del 5-oct: una sola versión de cada una). Se buscan en `src/shared/components/`, en
`src/modules/design-system/` (cada una documentada en su pantalla `/design-system/*`) y en una
pantalla parecida ya hecha. La tabla completa está en [AGENTS.md](AGENTS.md), regla 1.

**El catálogo manda cuando no existe:** `ai-tools/flux-ui/flux-ui-para-ia.json` tiene los 89 componentes de la
librería con sus variantes permitidas, para qué sirve cada uno en español y su ficha del
Storybook. El MCP de flux-ui lista solo 69 y no busca bien en español: **no decidas con el
MCP**, y antes de decir que algo no existe, compruébalo en `node_modules/@ubits/flux-ui`.

## Las skills

Viven en `ai-tools/skills/`. `.claude/skills` es un symlink a esa misma carpeta, así que se
editan en un solo lugar y sirven igual al resto del equipo.

Se cargan solas cuando el pedido encaja con su descripción, pero no siempre aciertan: si sabes
cuál toca, llámala por su nombre.

| Cuando pasa esto | Entra |
| --- | --- |
| Vas a escribir o cambiar cualquier pieza de interfaz | **flux-ui-storybook** — obligatoria, sin excepciones |
| El pedido trae un bloque de ReUI o un enlace de reui.io | **reui-to-flux-ui** |
| Terminaste una pantalla y aún no la has entregado | **revisar-contra-reui** |
| Cambiaste una pieza general (marco, header, barra lateral, menús, drawers, chat de Suite AI, botón «Orbit Flow») o una regla de diseño | **sincronizar-design-system** — también si la regla la decide Nicolás mirando el DS |
| Hay que enseñar cómo quedó sin que nadie abra el navegador | **capturar-pantallas** |
| Piden el enlace público | **publicar-en-vercel** — pregunta antes |

### El orden habitual

Maquetar una pantalla nueva es casi siempre la misma cadena:

**flux-ui-storybook** (elegir las piezas) → maquetar → `npm run check` →
**revisar-contra-reui** (qué se forzó) → **sincronizar-design-system** (solo si tocaste algo
general) → **capturar-pantallas** (enseñarlo) → **publicar-en-vercel** (solo si lo piden).

Las dos últimas no se hacen por iniciativa propia.

### Lo que conviene saber de ellas

- **flux-ui-storybook** es la única obligatoria, y no se salta ni por un botón suelto ni por un
  cambio «pequeño». La trampa es maquetar de memoria y dibujar a mano algo que la librería ya
  tiene resuelto.
- **reui-to-flux-ui** se apoya en el MCP de `reui`, que pide autorización y en esta sesión no
  está conectado. Sin él, el bloque se lee en reui.io y se traduce igual; lo que no cambia es
  que **nunca** se importa `@/components/ui/*` ni `@reui/*` en las maquetas.
- **sincronizar-design-system** trae además `prompt-completo.md`, `referencias/` y `scripts/`:
  es la más pesada y la que más se olvida. Un cambio a una pieza general no está terminado
  hasta que el design system dice y muestra lo mismo.

## Trampas conocidas

Cosas que ya nos costaron una tarde:

- **Las reglas no se escriben en ocho sitios.** Hasta el 8-oct cada regla vivía copiada a mano en
  AGENTS.md, el catálogo, el recordatorio, las skills y el check, y se contradecían («ActionDialog,
  la única», «toast.add con tipo», «DataGridList antes que Table»). Ahora la regla, la pieza o la
  retirada se escribe en `ai-tools/reglas/reglas.json` y se corre
  `node ai-tools/reglas/generar-reglas.mjs`. Los bloques `generado:` de AGENTS.md, el catálogo
  (`flux-ui-para-ia.json`, `catalogo.json`) y el grafo no se editan a mano: se pierde al regenerar.
  Lo que no es regla (las trampas de la librería, `PROMPT_BASE`) sigue en `generar-catalogo.mjs`.

- **Dos copias de recharts.** La librería trae la suya dentro de `dist` y el proyecto instala
  recharts 3. El `ChartContainer` sí se usa (con `ChartTooltipContent`), pero su contenedor pasa
  la medida por un contexto que la copia del proyecto no ve: el gráfico recibe `width` y `height`
  en números, y el `Tooltip` se importa de `recharts`. El patrón está en
  `src/modules/admin/desempeno-cultura/encuestas/components/graficos.tsx`.
- **Las clases no le ganan al tema de la librería.** Su README manda importarlo sin capa, así que `p-0`,
  `size-*` o `max-w-*` sobre un componente no hacen nada y hoy se fuerza con `!`. Antes de forzar, mira
  `/design-system/diferencias` (`ai-tools/flux-ui/diferencias.json`): lo que hacemos distinto de la librería,
  revalidado y listo para su dev.
- **Sidebar:** el ancho solo obedece por `style`, y el badge no se oculta al plegar.
- **Insignias que no se leen:** `focus-light` y los contornos verde y amarillo (`success-outline`,
  `warning-outline`) no llegan al contraste mínimo. `destructive-light` ya se lee gracias a `src/index.css`.
- **`Tooltip` solo abre con hover.** Para iconos de ayuda, contrólalo para que abra con clic.
- **`DataGridList`:** columnas estables, asidero por columna y la paginación viene en inglés. En su marco
  sale con borde doble: usa `TablaDatos`, la única tabla del sistema, que ya viene con un solo borde, la cabecera de
  Vacantes y el paginador en español.
- **`DropdownMenuLabel` va dentro de `DropdownMenuGroup`**, si no revienta Base UI.
- **El ancho lo pone `PageShell`**, con cuatro medidas (`narrow` 720, `default` 1.140, `wide`
  1.600, `full`); nada de `max-w` a mano. La tipografía sale del tema (`Heading`, `Text`),
  también dentro de piezas que trajo otra persona.

## Al cerrar

1. `npm run check` — reglas del playground, lint y tipos. Si falla, se arregla; no se desactiva.
2. `npm run build` si borraste archivos: el check no mira imágenes ni recursos importados, y un
   PNG borrado que alguien todavía importa solo falla al compilar.
3. Antes de subir o publicar, **pregunta**. Commit y push a la rama es una cosa; publicar en
   Vercel deja el trabajo a la vista de cualquiera con el enlace, y es otra.
4. **Todo commit se firma con `herramientasubits@ubits.co`.** Es la cuenta de Vercel de UBITS, y Vercel
   solo recibe los commits cuyo autor es de esa cuenta: con otro correo el push llega a Bitbucket,
   pero la publicación no sale. Se configura una vez por copia del repo con
   `git config user.email herramientasubits@ubits.co` (solo este repo; el nombre de cada quien se queda).
   Un gancho lo avisa al abrir la sesión y bloquea el commit si el correo es otro; nada de
   `--author` con otro correo.
5. Si tocaste algo de la zona protegida o un archivo de otra persona del equipo, dilo
   explícitamente en la respuesta.

## Trabajo de otras personas

Las reglas de convivencia están en [AGENTS.md](AGENTS.md), punto 7: nada de Prettier sobre
archivos ajenos, los estilos de otra persona se respetan, y lo que se fuerza se documenta en
Design system › Marco › Ajustes propios.

En la práctica eso significa editar a mano y en el sitio exacto: si el archivo es de alguien
más, busca la línea y cámbiala, no reescribas el bloque «ya que estás». Un diff de tres líneas
se revisa; uno de trescientos, no. Y si al terminar el archivo quedó reformateado, deshazlo
antes de entregar.
