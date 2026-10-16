---
name: sincronizar-design-system
description: >-
  Mantener el design system del playground (/design-system/*) igual a la interfaz real. Usar SIEMPRE que se cambie
  un componente general o una regla de diseño: marco de página y ancho de 1140, header, barra lateral y riel, menús
  (perfil, empresa, «+»), ventanas, drawers y paneles, chat de Suite AI (composer, mensajes, tarjetas), agente
  contextual y su panel, botón «Orbit Flow», tokens del tema o reglas globales de estilo. También cuando pidan
  «actualiza el design system», «que quede documentado», «sincroniza el configurador», «revisa que el design system
  esté al día», o cuando Nicolás decida una regla nueva (orden, tamaño, color, posición) aunque no lo diga.
---

# Sincronizar el design system con la interfaz

## La idea

El design system del playground es la **documentación viva** de los componentes generales: cada página
(`/design-system/navegacion`, `/header`, `/barra-lateral`, `/modales`, `/drawers`, `/agente-contextual`) tiene una vista
previa con anatomía (lo azul con nombre es parte del componente; lo gris rayado es slot), casos de uso con su pantalla
real, interruptores, la lista «Partes de este caso» y notas de guía.

**Un cambio a un componente general no está terminado hasta que el design system dice y muestra lo mismo.** Funciona en
las dos direcciones:

- Si cambias el componente real → actualizas su página del design system.
- Si Nicolás define o cambia una regla mirando el design system → la aplicas también en **todas** las pantallas reales
  que usan ese componente o repiten ese patrón (incluidas las copias hechas a mano).

Ejemplo real (16 sep 2026): «el orbe siempre a la izquierda del primario». Tocó la vista previa de Navegación, los 8
casos del agente contextual, el configurador del agente, el editor de LMS (que tenía su propio botón «Agente IA» copiado)
y el configurador del header, que todavía mostraba «Agente IA» en el header y contradecía la regla.

## Archivos de apoyo

| Archivo | Para qué |
| --- | --- |
| `referencias/mapa.md` | Qué componente real documenta cada página, si la página lo **reutiliza** o es una **réplica**, y qué revisar |
| `referencias/reglas-vigentes.md` | Las decisiones de diseño que ya tomó Nicolás. Se lee antes y se actualiza después |
| `referencias/anatomia.md` | Cómo está armado un configurador y el kit de anatomía (partes, slots, nombres) |
| `scripts/mapa.json` | El mismo mapa en datos, lo usa `impacto.mjs` |
| `scripts/impacto.mjs` | Dice qué páginas, archivos, pantallas reales y textos revisar según lo que cambió, y detecta copias de clases desfasadas |
| `scripts/verificar.mjs` | Capturas en claro y oscuro, ancho del contenido y escaneo AA de las rutas que le pases |

## Flujo

### 0. Antes de tocar nada
1. Lee `CLAUDE.md` del repo (solo flux-ui, iconos Hugeicons, tokens, zona de trabajo, archivos protegidos).
2. Lee `referencias/reglas-vigentes.md`: si el cambio contradice una regla vigente, **pregunta** a Nicolás antes de
   seguir, con las dos opciones concretas.
3. Si el pedido es ambiguo («que se vea mejor»), aclara qué cambia exactamente antes de propagarlo a todas partes.

### 1. Medir el alcance
```bash
node .claude/skills/sincronizar-design-system/scripts/impacto.mjs              # lo que cambió según git
node .claude/skills/sincronizar-design-system/scripts/impacto.mjs <archivo>…   # archivos concretos
node .claude/skills/sincronizar-design-system/scripts/impacto.mjs --todo       # auditoría completa
```
Por cada componente tocado muestra:
- las páginas del design system que lo documentan y sus archivos, marcando las **réplicas** que hay que cambiar a mano;
- las pantallas reales que lo usan, para el barrido de consistencia;
- dónde aparecen sus nombres y reglas en los textos;
- las copias de clases que ya no coinciden con el componente real.

El script **no encuentra todo**. Una regla puede estar escrita con otras palabras o repetida a mano en otra pantalla.
Completa con `grep -rn` sobre `src/modules` y `src/shared` usando los nombres visibles («Orbit Flow», «Novedades»…), las
clases o las medidas que cambiaron.

Si sale «Compartido sin mapear», decide si es un componente general. Si lo es, súmalo a `scripts/mapa.json` y a
`referencias/mapa.md` en el mismo cambio.

### 2. Clasificar el cambio
| Tipo | Ejemplos | Qué se actualiza en el design system |
| --- | --- | --- |
| **Visual** (color, tamaño, radio, peso, sombra) | filas de la barra en medium y gris | Si la página reutiliza el componente, se ve solo: revisa los textos que citen la medida. Si es réplica o copia de clases, cópialas. |
| **Estructura** (parte nueva, quitada o renombrada) | el composer suma «Voz» | Tipo de configuración, casos, control del panel, vista previa (`data-region`), `PART`, texto de la parte y lista de partes. |
| **Posición u orden** | «Orbit Flow» al final de la fila | Vista previa de todos los configuradores que lo muestran, textos de la regla, casos, **y todas las pantallas reales** |
| **Comportamiento o estados** | el panel se minimiza a un riel de 60px | Estados en la configuración, controles, textos, casos que lo muestran. Si es una interacción, que funcione en la vista previa. |
| **Regla de uso** («solo el orbe si la pantalla está cargada») | — | Notas de guía (`GUIDE` / notas bajo los controles), textos de parte, `reglas-vigentes.md` |
| **Tema o global** (`src/index.css`, `global.css`) | hover de menús como REUI | Réplicas con clases copiadas, textos con colores o medidas, `reglas-vigentes.md`. Escaneo AA completo en claro y oscuro. |
| **Componente nuevo sin página** | avisos flotantes | Pregúntale a Nicolás si se documenta como caso en una página existente o como página nueva (ver `referencias/anatomia.md`). |

### 3. Barrido de consistencia en la interfaz real
Antes de documentar, deja la interfaz coherente. Es el paso que más se salta, y la causa más grande de la auditoría
del 8-oct (185 hallazgos: «la regla cambió y nadie barrió lo anterior»). No se cierra una decisión sin él:
- Lista **todos** los usos de lo que cambia: con la herramienta `ds-ubits` (`usos` de la pieza, o `retiradas_en_uso`
  si algo se retiró) o con Grep en `src/` **y** en los documentos (`AGENTS.md`, `CLAUDE.md`, skills, fichas de
  `ajustes/*.tsx`, `ai-tools/flux-ui/diferencias.json`). Las carpetas de `carpetas_congeladas` de `reglas.json` no se barren.
- Recorre **todas** las pantallas de «Usado en pantallas reales» y las que encontraste con grep.
- Busca **copias**: botones o estilos que imitan al componente sin importarlo. Por ejemplo, el editor de LMS arma su
  propio botón «Orbit Flow». Aplícales la misma regla, o reemplázalas por el componente compartido si se puede sin cambiar
  cómo se ve.
- Si una pantalla no puede seguir la regla (por ejemplo, no tiene botón primario), aplica el criterio más cercano,
  escríbelo en `reglas-vigentes.md` y díselo a Nicolás.

### 4. Actualizar el design system
Por cada página afectada (detalle en `referencias/anatomia.md`):
1. **Configuración** (`*-config.ts`): opciones nuevas en el tipo, valores de cada caso, `PART` con el nombre exacto que
   dibuja la vista previa, texto de cada parte y la función que lista las partes visibles.
2. **Vista previa** (`*-preview.tsx` o réplica): mismo orden, medidas y clases que el real. Marca las partes nuevas con
   `data-region` y los slots con `data-slot-region`. Si los nombres se enciman, usa `data-chip` (`top`, `inline`,
   `under`, `inside`).
3. **Panel de controles** (`main.tsx`): el interruptor o selector de la parte y la nota con la regla.
4. **Guía** (`GUIDE`, notas y resúmenes de casos): que digan la regla nueva con las mismas palabras en todas las páginas.
5. **Casos**: cada caso apunta a una pantalla real (`example` / `route`); si el cambio altera esa pantalla, el caso debe
   quedar igual a ella.
6. **Copias de clases** (`sidebar-styles.ts`, `drawer-styles.ts`, medidas de `header-preview.tsx`): cópialas del real.
   `impacto.mjs` vuelve a avisar si quedan desfasadas.
7. **Otras páginas que lo mencionan**: por ejemplo, el header dice dónde NO va «Orbit Flow». Revisa los textos que el script
   listó.

### 5. Registrar la regla
Si el cambio fija o cambia una decisión de diseño:
1. **Primero en `ai-tools/reglas/reglas.json`**, la fuente única: una entrada en `reglas` (id, fecha, `corto` de una
   línea si va en el recordatorio, `texto`, `piezas`, `ejemplo` con la pantalla modelo, y `reemplaza` si sustituye a
   otra). Si una pieza se retira, va a `retiradas` con su fecha, su sustituta y un `patron` para encontrarla. Si la
   pieza es nueva, va a `piezas`. Si la decisión queda abierta, va a `por_decidir` con quién decide.
2. Corre `node ai-tools/reglas/generar-reglas.mjs`: regenera los bloques de `AGENTS.md`, el catálogo para la IA y el
   grafo, y el recordatorio de cada mensaje la toma solo. No edites a mano esos bloques.
3. Después, la historia larga en `referencias/reglas-vigentes.md`: fecha, la regla con las palabras de Nicolás y dónde se
   aplica. Si una regla vieja queda reemplazada, márcala como reemplazada (con la fecha y por cuál): no dejes dos
   versiones vivas.

### 6. Verificar (obligatorio)
1. Con el local en `http://localhost:5173` (si no responde, ver «Local caído» abajo):
   ```bash
   node .claude/skills/sincronizar-design-system/scripts/verificar.mjs <rutas reales> <páginas del design system>
   ```
   Por defecto revisa claro y oscuro, a 1440 y a 1920.
   - Contenido: 1140 como máximo (1104 en 1440 con la barra abierta, 1140 a 1920), sin scroll horizontal. El chat de
     Suite AI mide 768 a propósito y la plantilla de acceso ocupa toda la pantalla.
   - Axe-core: **0 fallos AA**.
   - Consola: sin errores.
2. **Mira las capturas.** Axe no ve nombres de anatomía encimados, cortes, réplicas que ya no se parecen al real ni
   una regla mal aplicada. Compara lado a lado la pantalla real y su caso en el design system.
3. Si la regla es de posición u orden, mide el orden en el navegador en cada pantalla afectada (por ejemplo, la lista de
   botones de izquierda a derecha).
4. Prueba con teclado lo que se abre o cambia de estado: Tab, Enter, Escape y la vuelta del foco.
5. `npm run check`. Si solo marca archivos protegidos que Nicolás autorizó tocar, está bien: dilo en el informe. Si
   marca lint o typecheck, arréglalo.
6. Vuelve a correr `impacto.mjs`: no deben quedar copias desfasadas.

### 7. Cerrar
- Actualiza la memoria del proyecto (estado y decisiones) si el cambio es relevante para otra sesión.
- No publiques en Vercel ni hagas commit sin que Nicolás lo pida.
- Informe para Nicolás en español, sin jerga, con rutas que pueda abrir:

```
Listo: <la regla o el cambio en una frase>.

En la interfaz: <pantallas donde cambió, con ruta>.
En el design system: <páginas actualizadas, con ruta, y qué se ve distinto: control nuevo, parte nueva, texto de la guía>.
Lo que no pudo seguir la regla: <caso y qué criterio se usó>, si aplica.
Verificado: <claro y oscuro, 1440 y 1920, AA 0 fallos, orden medido>.
Pendiente de tu decisión: <si hay algo>.
```

## Errores que ya pasaron (no repetir)
- **Réplicas que se quedan atrás.** La barra lateral del design system siguió con las filas en gris claro y peso normal
  después de pasar las reales a medium y gris. Las réplicas no se actualizan solas.
- **Una regla aplicada en la mitad de los lugares.** «Agente IA» quedó junto al primario en los casos, pero el header
  seguía mostrándolo en otro lado. Busca también en las páginas que solo **mencionan** el componente.
- **Copias escondidas del componente.** El editor de LMS tenía su propio botón «Agente IA» en vez de `ReopenAgentButton`.
- **Nombres de anatomía encimados** al mover una parte. Después de cambiar un orden, revisa la captura con los nombres
  visibles y usa `data-chip`.
- **Tokens que se pisan.** `global.css` tenía un alias viejo `--accent: var(--primary)` que dejaba azul el hover en modo
  claro. Después de tocar el tema, mide el color real en el navegador, no el que dice el código.
- **Cambios de tema que rompen contraste en otro lado.** El azul claro en oscuro dejó texto blanco a 2.8:1 en la barra
  de selección de la librería. Tras tocar tokens, escaneo AA de todas las páginas y revisión de lo que axe no ve
  (degradados, estados con cursor).
- **Decisiones de composición elegidas por texto.** La «rejilla 1140» del chat se eligió en una pregunta con dibujos
  ASCII, se aplicó y a Nicolás no le gustó al verla. Para cambios de ancho o composición, muéstrale primero una captura
  de una pantalla y después propágalo.
- **Local caído.** No lo levantes dentro de Terminal ni como tarea en segundo plano de la sesión, porque se cae. Levántalo
  suelto: `(nohup npm start -- --port 5173 --strictPort > ~/Library/Logs/playground-ux-local.log 2>&1 &)`.

## Límites
- Solo flux-ui, iconos Hugeicons y tokens del tema (ver `CLAUDE.md`). Si mantener la paridad obliga a forzar la librería
  con `!` o CSS global, hazlo solo si Nicolás lo pidió. Anótalo como concesión para el equipo de librería en
  `reglas-vigentes.md`.
- Archivos protegidos (`src/index.css`, `src/shared/layouts/`, `src/app/`…): tocarlos requiere permiso de Nicolás y
  aviso a ingeniería.
- Si el cambio lo hacen varios agentes en paralelo, asigna archivos sin solaparse. Un solo agente se encarga del design
  system al final, para que los textos queden con las mismas palabras.
