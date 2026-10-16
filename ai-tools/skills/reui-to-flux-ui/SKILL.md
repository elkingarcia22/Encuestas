---
name: reui-to-flux-ui
description: >-
  Maquetar pantallas del Playground UX tomando un bloque o ejemplo de ReUI como
  plantilla de estructura y reemplazando todos los componentes por @ubits/flux-ui.
  Usar cuando UX pida un bloque ReUI (p. ej. data-grid-base-1), un preview de
  reui.io, o "traer este componente pero con nuestra librería".
---

# ReUI → flux-ui (plantilla + componentes propios)

## Qué hace este flujo

ReUI define **cómo se organiza la pantalla** (archivos, layout, columnas, datos).
`@ubits/flux-ui` define **con qué se construye** (mismos nombres en muchos casos:
`DataGrid`, `Frame`, `AlertDialog`, `Badge`, etc.).

**No** importar `@/components/ui/*` ni `@reui/*` en las maquetas del playground.
Sí se puede **instalar el bloque como referencia** (código real en disco) y luego
traducirlo a flux-ui en `src/modules/`.

## Antes de escribir código

1. Leer `AGENTS.md` en la raíz del repo.
2. Consultar el bloque en el MCP **reui**: `search` → `get_block` (metadata y preview).
3. **Instalar el bloque como referencia** (ver sección siguiente) y leer el código
   generado en `src/reui-reference/` — ahí está la estructura real, no inferida.
4. Consultar componentes en el MCP **flux-ui**: `get_component`, `get_component_stories`.
5. Confirmar que `REUI_LICENSE_KEY` está en `.env.local` si el bloque es premium.

## Registry ReUI (referencia local)

El repo ya trae `components.json` con el registry `@reui` y aliases que apuntan a
`src/reui-reference/` (carpeta gitignored, **no se commitea**).

Instalar un bloque solo para leerlo:

```bash
npx shadcn@latest add @reui/<nombre-del-bloque> --yes
```

Ejemplo:

```bash
npx shadcn@latest add @reui/solution-ai-ops-1 --yes
```

Requisitos:

- `REUI_LICENSE_KEY` en `.env.local` (bloques premium).
- El CLI lee `components.json` y escribe en `src/reui-reference/`.
- **Ejemplos gratuitos** (`c-*`) instalan sin licencia; **bloques premium** requieren
  `REUI_LICENSE_KEY` válida con plan Pro o Ultimate.
- Si el install modifica `src/index.css` o `package.json`, revierte esos cambios:
  la referencia no forma parte del playground.

**Flujo obligatorio con referencia:**

1. `get_block` / `get_install_command` en MCP reui.
2. Instalar en `src/reui-reference/`.
3. Leer los archivos instalados (layout, props, anidación de `Frame`, `Timeline`, etc.).
4. Copiar la **estructura** a `src/modules/<modulo>/<pantalla>/`.
5. Sustituir **todos** los imports por `@ubits/flux-ui` + Hugeicons.
6. No commitear `src/reui-reference/` ni importar desde ahí en `src/modules/`.

## Estructura de archivos (plantilla)

Crear en `src/modules/<modulo>/<pantalla>/`:

```
main.tsx
components/
  data.tsx           # tipos + datos de ejemplo
  columns.tsx        # columnas, celdas, diálogos, menús por fila
  <nombre>-view.tsx  # estado, filtros, paginación, composición final
```

`main.tsx` exporta `Component` y `Component.displayName`.

Registrar ruta en `routes.ts` del módulo y, si aplica, pestaña o ítem en
`src/shared/layouts/nav-config.ts` o `PlaygroundLayout.tsx`.

## Regla de imports (obligatoria)

| En el bloque ReUI / shadcn | En el playground |
| --- | --- |
| `@/components/ui/*` | `@ubits/flux-ui` |
| `@reui/data-grid`, `@reui/frame`, `@reui/badge` | `@ubits/flux-ui` |
| `@reui/use-copy-to-clipboard` | `useCopyToClipboard` desde `@ubits/flux-ui` |
| `@/lib/utils` (`cn`) | `cn` desde `@ubits/flux-ui` |
| `lucide-react` u otros iconos | Hugeicons vía MCP `search_icons` + `get_icon` |
| `sonner` / `toast` sueltos | `notify(título, detalle, tipo)` de `@/shared/components/notify` (el `Toaster` ya está en el marco) |
| Gráficos (`recharts` + `ChartContainer`) | `recharts` para `AreaChart`, `BarChart`, etc. + wrappers de `@ubits/flux-ui` |
| Tablas (`data-grid-*`) | `TablaDatos`, la única tabla del sistema (ver abajo) |
| `AlertDialog` / `Dialog` | `DialogoConfirmar` para preguntar; `ActionDialog` para toda otra ventana |

Antes de traducir un bloque pieza por pieza, mira las piezas que el proyecto ya resolvió en
`ai-tools/reglas/reglas.json` (o pregúntale a la herramienta `ds-ubits`, `buscar_pieza`): muchas
partes de un bloque de ReUI ya existen envueltas con las decisiones del equipo.

**Prohibido** importar `@tanstack/react-table` directo: `npm run check` lo rechaza.
Las tablas van con `TablaDatos` (`src/modules/design-system/data-grid/tabla-datos.tsx`): es
`DataGridList` con la cabecera del equipo, un solo borde y el paginador en español. No uses
`DataGridList` ni `Table` sueltos en una pantalla.

## Mapeo rápido de bloques data-grid

Bloques ReUI tipo `data-grid-base-*` suelen incluir:

- Búsqueda y filtros → los de `TablaDatos` (buscador a la derecha, filtro por columna)
- Avatares en filas → `Persona`; la fila que nombra algo, `CeldaTitulo`
- Estados → `Badge` de `@/shared/components/Badge` con variantes del tema (`success-light`, `warning-light`, …)
- Balance / tendencia → `Cambio` y los gráficos de `/design-system/metricas`; ayuda con `Hint`
- Acciones por fila → columna «Acciones» con `BotonIcono` ⋯ y `DropdownMenu`; borrar pregunta con `DialogoConfirmar`
- Paginación → `PiePaginacion`, ya dentro de `TablaDatos`
- Marco visual → `TablaDatos` ya trae su marco; no dupliques `Frame` afuera
- Que quepa → la tabla cabe en su marco (1.104 px con la barra abierta) y el «⋯» siempre se ve

## Colores, iconos y UI

- Solo tokens del tema (`bg-background`, `text-muted-foreground`, `border-border`, …).
- Iconos: `<HugeiconsIcon icon={NombreIcon} size={N} />` — nunca el icono como componente.
- No sobrescribir estilos base de flux-ui; `className` solo para layout.

## Cierre

Siempre correr `npm run check` antes de dar por terminada la pantalla.

## Referencia en este repo

| Pantalla | Bloque ReUI | Ruta |
| --- | --- | --- |
| CRM data grid | `data-grid-base-1` | `/playground/data-grid-crm` |
| AI Operations | `solution-ai-ops-1` | `/playground/solution-ai-ops` |

Código de maqueta: `src/modules/playground/<pantalla>/`
Código ReUI de referencia (local, gitignored): `src/reui-reference/`

## Frases que activan este skill

- "Usa el bloque X de ReUI pero con flux-ui"
- "Trae data-grid-base-1 como plantilla"
- "Maqueta esto como en reui.io pero con nuestra librería"
- "Copia la estructura del bloque y reemplaza los componentes"
- "Monta el registry ReUI y rehaz la pantalla desde el bloque"
