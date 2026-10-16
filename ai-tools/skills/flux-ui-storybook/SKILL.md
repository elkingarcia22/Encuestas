---
name: flux-ui-storybook
description: Obligatoria antes de escribir o cambiar cualquier interfaz del Playground UX. Toda pieza (botón, tabla, formulario, modal, tarjeta, pestañas, menú, aviso, gráfico, sidebar…) sale de @ubits/flux-ui, la librería basada en ReUI que documenta el Storybook interno; nunca de otra librería ni hecha a mano. Tu trabajo es combinar componentes existentes, nunca crear componentes visuales propios. Da el procedimiento para elegir cada pieza en ai-tools/flux-ui/flux-ui-para-ia.json (con sus variantes permitidas), abrir su ficha del Storybook y evitar las trampas conocidas. Úsala al maquetar, "haz una pantalla", "agrega un botón/tabla/filtro", "usa el Storybook", "con componentes de ReUI", o al revisar si una pantalla cumple las reglas — en español o inglés.
---

# Componentes del Storybook, siempre

La UI del playground se arma **solo** con `@ubits/flux-ui`. Esa librería copia ReUI por
dentro, y cada componente tiene su ficha en el Storybook interno:
<https://libraries-ui.dev.sandteck.com/flux-ui/index.html>.

La fuente de verdad para elegir es **`ai-tools/flux-ui/flux-ui-para-ia.json`**: los 89
componentes con sus subcomponentes, sus **variantes permitidas**, para qué sirven en español
y su ficha del Storybook. Es el mismo archivo que se comparte con el resto del equipo.
No uses el MCP de flux-ui para decidir: lista 69 de los 89 y su buscador no entiende español.

**Tu trabajo es combinar componentes que ya existen, nunca crear componentes visuales
nuevos.** Un círculo con una inicial es `Avatar`; una barra de color es `Progress`; un
recuadro vacío con mensaje es `Empty`; una etiqueta de estado es `Badge`.

## El procedimiento

**Atajo:** si tienes la herramienta `ds-ubits` (MCP del repo), empieza por ella. `reglas_para` con el archivo que vas a
tocar, `buscar_pieza` por cada cosa que vas a poner en pantalla, y al terminar `revisar` sobre el archivo. Sin MCP, lo
mismo desde la terminal: `node ai-tools/mcp/ds-ubits.mjs buscar_pieza "confirmar antes de eliminar"`. Responde con las
decisiones vigentes de `ai-tools/reglas/reglas.json`; si contradicen lo que recuerdas, manda la herramienta.

0. **Mira primero si el proyecto ya la resolvió.** Antes del catálogo, busca la pieza en
   `src/shared/components/` y en `src/modules/design-system/`. El marco de página es
   `PageShell` (y él pone el ancho: nada de `max-w` a mano); un aviso, `notify(título, detalle,
   tipo)` siempre con su tipo (nunca `toast.add` suelto ni `ToastToaster` en la pantalla: duplica
   los avisos); el botón terciario de solo icono,
   `BotonIcono` (redondo); el orbe del agente, `Orb`; un panel lateral, `DrawerShell` (nunca
   `Sheet` directo); preguntar antes de hacer algo (eliminar, salir sin guardar, activar, descartar,
   enviar), `DialogoConfirmar`, aunque muestre lo que se pierde; cualquier otra ventana —formulario, lista
   para elegir, vista previa, detalle, ajustes, o confirmar con la lista de a quiénes afecta—, `ActionDialog`
   (acuerdo del 6-oct; `ConfiguredModal` se retiró el 5-oct); cualquier tabla, `TablaDatos` (la única: `MarcoTabla` se retiró), con `CeldaTitulo` para la
   fila que nombra algo; un vacío, `PrimeraVez` o `SinResultados`; las cifras, `Indicadores`; el agente
   contextual, el `agent-kit`; los diálogos de novedades, `Announcements`; el buscador de comandos,
   `CommandPalette`; el estado «Razonando», `AiThinking`; una ayuda contextual, `Hint` (y `BotonAyuda`
   si abre con clic). Hay una sola versión de cada una, y `Toaster`, `AppHeader` o `SidebarRail` ya las monta el marco: no las repitas
   dentro de una pantalla. Están hechas con flux-ui, así que usarlas no es saltarse nada: es no
   construir la misma cosa dos veces. Si una se queda corta, se amplía; no se hace una
   paralela al lado. La tabla completa está en `AGENTS.md`, regla 1.

   ```bash
   ls src/shared/components/
   grep -rl "export function" src/modules/design-system --include='*.tsx' | head -20
   ```

1. **Nombra las piezas** que pide la pantalla (tabla, filtro, estado vacío, aviso…).
2. **Búscalas en el catálogo** por concepto en español:

   ```bash
   node -e 'const c=require("./ai-tools/flux-ui/flux-ui-para-ia.json");const q=process.argv[1];for(const x of c.componentes.filter(k=>k.slug.includes(q)||k.buscar.some(b=>b.includes(q))))console.log(x.nombre,"—",x.usar_para,"\n  exports:",x.exports.join(", "),"\n  variantes:",JSON.stringify(x.variantes),"\n ",x.storybook?.docs)' tabla
   ```

   Cambia `tabla` por lo que busques: `aviso`, `fecha`, `pasos`, `vacío`, `menú`…
3. **Solo vale lo que está en `componentes`, con los valores de `variantes`.** Lo de
   `en_storybook_pero_no_publicados` no existe en la versión instalada: importarlo rompe la
   pantalla. Tampoco inventes variantes (`variant="primary"` no existe en `Button`).
4. **Mira la ficha del Storybook** (`storybook.docs`) para ver cómo se ve y sus variantes,
   y confirma las props en el tipo real:
   `node_modules/@ubits/flux-ui/dist/components/<slug>/index.d.ts`.
5. **Parte de un patrón que ya funciona**: `/design-system/estados`, `/data-grid`,
   `/formularios` y `/metricas` (cifras y gráficos de tablero; antes vivían en el Dashboard, que
   ahora es del Archivo). Están probados en claro y oscuro.
6. **Lee `trampas_conocidas`** antes de tocar gráficos, DataGridList, Progress, Toast,
   Badge, Stepper o Sidebar. Cada una costó un fallo real.
7. **Si de verdad no existe**, para y pregunta con opciones concretas: «flux-ui no tiene
   X; ¿lo pedimos al equipo de librería o lo resolvemos con Y?». No improvises.
8. Cierra con `npm run check`.

## Lo que es de IA: el orbe y su botón al final

Todo lo que **produce o hace la IA** dentro de una pantalla normal lleva el icono de IA antes del
texto: una evaluación, un puntaje o un ajuste que calcula la IA, una lectura o un resumen, una
etapa con IA, una nota que dejó el agente. Va en la pestaña, el título de la tarjeta o sección, la
insignia, el ítem o la etiqueta de la barra, según dónde se muestre.

- **El icono de IA es el orbe**, el mismo de los botones de IA y del agente. Se pone con
  **`<IconoIA />`** (`src/modules/design-system/ia/icono-ia.tsx`), que es el `Orb` a 16 px.
  **Nada de estrellas ni chispas**: ni `SparklesIcon`, ni `AiMagicIcon`, ni `MagicWand01Icon`, ni
  `StarsIcon` para marcar IA (se probó la chispa y se descartó el 23 sep: «no uses esos iconos de
  estrellas»). Si diseño cambia la marca, se cambia en ese archivo y cambia en todas partes.
- Se marca **al nivel más alto que sea todo de IA**: si la tarjeta entera es de IA, el icono va en
  su título y no en cada bloque; si la tarjeta mezcla, va solo en el bloque de IA.
- Un botón de IA no lleva `<IconoIA />` a mano: el primario es `BotonIa` (el degradado, uno solo por vista), la
  segunda acción de IA `BotonIaSecundario` y el que abre el agente contextual `ReopenAgentButton` («Orbit Flow»).
- Una insignia de IA («Con IA», «Resumen del agente», «Serena AI 88/100») es siempre
  **`<EtiquetaIA />`** (`src/modules/design-system/ia/etiqueta-ia.tsx`): gris, en pastilla y
  con el orbe ajustado a su tamaño. Nunca un `Badge` de color con `<IconoIA />` dentro: en `xs` y `sm`
  el orbe se sale de la insignia.
- Es decorativo (`aria-hidden="true"`): cuando importe, el texto también dice que es IA.

**Los botones de IA van siempre al final de su fila, a la derecha de todo**, después del
primario: «Orbit Flow» (el botón del agente contextual, siempre el último), «Resumir con IA», «Redactar con IA» o
cualquier otro. **El menú «⋯» va al
otro extremo, el primero de la fila** (25 sep, Nicolás: «siempre es el último en la izquierda»).
En una cabecera el orden es «⋯» · terciario · secundario · primario · IA. Vale igual en
tarjetas, paneles, pies de página y barras de acciones.

Ejemplo vivo: el expediente del candidato (`/admin/seleccion/vacantes/analista-de-datos/candidatos/laura-mendez`).

## Los títulos de modales y paneles son fijos

El **título** y la **bajada** de un modal, un diálogo o un drawer dicen **qué es esa ventana**, no
de qué registro habla. Lo particular —el nombre del contenido, de la persona, del aviso, de la
competencia— va en el **cuerpo**, en su primera línea: a desarrollo le sirve más una cabecera que
no cambia con el contenido, y la ventana se lee igual de bien (Carlos, 1-oct).

```tsx
// ❌  title={contenido.nombre}            ❌  descripcion={`«${aviso.titulo}» se archivará…`}
// ✅  title="Vista previa del contenido"  ✅  descripcion="Dejará de verse en el inicio…"
//     …y el nombre abre el cuerpo, con su línea de detalle debajo.
```

No cuenta como título dinámico el que alterna entre **textos fijos** según el modo
(`editando ? 'Editar selección' : 'Seleccionar colaboradores'`) ni el que cambia una palabra del
flujo (`Publicar ${cosa}`, con «contenido» o «evento»): eso son variantes del copy, no el registro.
`ActionDialog` tiene la ranura `lead` para esa primera línea del cuerpo; `DialogoConfirmar` y
`DrawerShell` reciben el bloque como hijos.

Para buscarlos en una pantalla: un `title=`, `titulo=`, `description=`, `descripcion=` o `sub=`
cuyo valor no sea un literal.

**Y esa línea del cuerpo va por debajo del título de la ventana**, nunca igual de grande ni más
(Dave, 1-oct). Cada marco mide distinto, así que se mira el suyo antes de elegir:

| Ventana | Su título | La línea del registro |
| --- | --- | --- |
| `ActionDialog` (la ventana con contenido; `ConfiguredModal` se retiró) | 20px / 500 | `Heading level={6}` (16px), en la ranura `lead` |
| `DrawerShell` | 16px / 500 | `Text size="sm" weight="semibold"` (14px) |

Ojo con el peso: `Heading level={5}` mide 18px pero en 600, así que **pesa más** que un título de
20px en 500 aunque sea más pequeño. Se comparan los dos, tamaño y peso, no solo el tamaño.

**La excepción son los modales de alta de recurso** (PDF, embebido, SCORM, video…), donde
`InstruccionGrande` va en grande a propósito: son formularios de dos campos y ese texto es la
invitación a hacer lo único que hay que hacer ahí. Esos no se tocan.

## Qué cuenta como incumplir

- Crear un componente visual propio (botón, tarjeta, avatar, barra, badge, modal…) o
  usar `<button>`, `<input>`, `<select>`, `<textarea>`, `<table>`, `<dialog>` o `<svg>` sueltos.
- Importar cualquier paquete que no esté permitido en `scripts/check.mjs`.
- Importar desde `@reui/*`, `@/components/ui/*` o `@/reui-reference/*`: ReUI da la
  **estructura** (usa la skill `reui-to-flux-ui` para eso), flux-ui da los **componentes**.
- Dibujar a mano un botón, una tarjeta, un modal o una tabla que el catálogo ya tiene.
- Armar con flux-ui una pieza que el proyecto ya tiene envuelta (`PageShell`, `BotonIcono`,
  `notify`, `DrawerShell`, `ActionDialog`…), o hacer una versión paralela al lado.
- Iconos que no sean Hugeicons (`<HugeiconsIcon icon={NombreIcon} />`), colores literales
  o paleta cruda de Tailwind, o `className` que cambie la apariencia de un componente.
- Algo que hizo la IA sin `<IconoIA />`, o marcado con estrellas o chispas (`SparklesIcon`,
  `AiMagicIcon`, `MagicWand01Icon`, `StarsIcon`).
- Un botón de IA que no es el último de su fila.

## Qué vigila la herramienta sola

En Claude Code hay hooks (`.claude/settings.json` → `ai-tools/hooks/`) que no dependen de
que la IA se acuerde:

| Momento | Qué hace |
| --- | --- |
| Al abrir la sesión | Regenera el catálogo si cambió la versión de flux-ui. |
| En cada mensaje | Recuerda estas reglas y dónde está el catálogo. |
| Antes de escribir en `src/` | Bloquea el cambio si trae una librería no permitida, un componente que solo está en el Storybook o un `<button>`, `<table>`, `<svg>`… hecho a mano en una pantalla. |
| Al terminar | Revisa todos los archivos cambiados en `src/` (también los escritos por terminal) y no deja cerrar hasta corregirlos. |
| Al abrir la sesión y antes de un commit | Revisa que el commit se firme con `herramientasubits@ubits.co` (la cuenta de Vercel): avisa al abrir y bloquea el commit si el correo es otro. |

## Mantener el catálogo

El generador produce dos archivos: `flux-ui-para-ia.json` (el que se comparte con el equipo
y se pega en cualquier IA) y `catalogo.json` (interno, lo leen los hooks). Se regeneran
solos al subir la versión de flux-ui. Para forzarlo:

```bash
node ai-tools/flux-ui/generar-catalogo.mjs
```

Las descripciones en español viven en la tabla `GUIA` de ese script; las reglas para la IA,
en `REGLAS_IA` y `PROMPT_BASE`; las trampas, en `trampas_conocidas`. Si encuentras una
nueva, súmala ahí y vuelve a generar.
