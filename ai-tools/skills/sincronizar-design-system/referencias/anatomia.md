# Cómo está armado un configurador del design system

Todas las páginas de componentes (`navegacion`, `header`, `barra-lateral`, `modales`, `drawers`,
`agente-contextual/configurador`) siguen el mismo esquema. Si respetas el esquema, la página se mantiene coherente.

## Archivos de una página

```
src/modules/design-system/<pagina>/
  main.tsx                         # página: casos, panel de controles, vista previa, partes y guía
  components/<x>-config.ts         # datos: qué se puede prender/apagar, casos, nombres y textos de las partes
  components/<x>-preview.tsx       # vista previa (usa el componente real o es una réplica) con las partes marcadas
  components/<x>-styles.ts         # (si hay réplica) clases copiadas del componente real
```

| Página | Configuración | Casos | Partes visibles | Vista previa |
| --- | --- | --- | --- | --- |
| Navegación | `PageConfig` | `PAGE_CASES` | `pageParts()` | `page-preview.tsx` (PageShell real) |
| Header | `HeaderConfig` | `HEADER_CASES` | `headerParts()` + `headerView()` | `header-preview.tsx` (réplica) |
| Barra lateral | `SidebarConfig` | `SIDEBAR_CASES` | `sidebarParts()` | `open-sidebar.tsx`, `rail-sidebar.tsx` (réplicas) |
| Modales | `ModalConfig` | `MODAL_CASES` | `modalParts()` | `modal-parts.tsx` (Dialog de flux-ui; «Probar en pantalla» usa las mismas piezas) |
| Drawers | `DrawerConfig` | `DRAWER_CASES` | `drawerParts()` | `drawer-shell.tsx` + `*-drawer.tsx` (réplicas) |
| Agente contextual | `AgentConfig` | `AGENT_CASES` | `agentParts()` | `agent-preview.tsx` (componentes reales del chat y del editor) |

## `*-config.ts`
- **Tipo de configuración:** una propiedad por cada cosa que se prende, se apaga o se elige. Si el componente real suma
  una parte opcional, suma su propiedad aquí.
- **Muestra (`*Sample`):** textos de ejemplo para que la vista previa se lea como una pantalla de verdad.
- **Casos (`*_CASES`):** `id`, `title`, `summary` (una o dos frases que explican el caso con la regla), `icon` de
  Hugeicons, `example` o `route` (la pantalla real donde se ve) y la configuración y muestra del caso. Cada caso tiene
  que parecerse a su pantalla real.
- **`PART`:** el nombre visible de cada parte («Botón primario», «Orbit Flow», «Header · 60px de alto»). **Tiene que ser
  idéntico** al `data-region` que pone la vista previa: la lista de partes y el resaltado se enlazan por ese texto.
- **Textos de parte:** qué es cada parte y su regla, en una frase, en español llano. Si cambia la regla, cambia este
  texto y el de la guía con las mismas palabras.
- **Función de partes visibles:** devuelve `PartInfo[]` (`{ name, text, slot? }`) en el orden en que se ven, de
  arriba abajo y de afuera hacia adentro. Parte nueva → agrégala donde corresponde según la configuración.

## `main.tsx`
- `AnatomyLegend`: explica azul (parte) y rayado (slot) y tiene el interruptor «Mostrar nombres».
- `CasePicker` y `CaseSummary`: elegir un caso, ver su resumen, abrir la pantalla real y «Restablecer» si se tocó algo.
- `ControlSection`, `Choice` (grupo de opciones, una sola) y `SwitchRow` (prender o apagar): el panel de controles. Una
  opción nueva en la configuración necesita su control aquí, con una nota breve (`NOTE`) si tiene una regla de uso.
- `AnatomyStage` (`names`, `hot`): envuelve la vista previa. Dibuja los nombres y resalta la parte que se señala en la
  lista.
- `PartsList`: «Partes de este caso», con las mismas pastillas que la vista previa.
- `GUIDE` o notas: las reglas generales de la página. Aquí va la redacción oficial de las reglas.

## Marcar partes en la vista previa
| Marca | Significa | Se dibuja |
| --- | --- | --- |
| `data-region="Nombre"` | Parte del componente | Borde azul punteado y pastilla azul con el nombre |
| `data-slot-region="Nombre"` | Slot: espacio libre para el contenido de cada pantalla | Borde gris y rayado |
| `data-chip="top"` | Botones chicos pegados a otros: el nombre va arriba | — |
| `data-chip="inline"` | Pieza dentro de una fila (los «…» de las migas, la flecha de volver): no se empuja, el nombre va arriba | — |
| `data-chip="under"` | Pieza dentro de otra parte que ya tiene su nombre arriba: el nombre cuelga abajo | — |
| `data-chip="inside"` | Pieza pegada al borde de arriba de su contenedor (ilustración de un modal): el nombre va adentro | — |

Por defecto, el nombre de un botón va debajo, alineado a su borde derecho. «Contenedor…» y «Acciones» van a la derecha.
Los componentes compartidos que aparecen en vistas previas aceptan props para marcarse sin cambiar cómo se ven:
- `regions` en `Composer` y `AgentMessage`;
- `region` en `UserMessage` y `TypingIndicator`;
- `region` y `chip` en `ReopenAgentButton`.

Si un componente compartido necesita una marca nueva, agrégale una prop opcional que solo ponga el atributo.

Las marcas son decorativas para lectores de pantalla (la pastilla va en `::after` con texto alternativo vacío). Los
nombres también están en texto en «Partes de este caso».

## Patrones de pantalla completa (`navegacion/<patron>`, `agente-contextual/<caso>`)
Van dentro de `CaseFrame` (franja «volver a la galería · qué resuelve · Mostrar anatomía») y usan `PageShell` real. Si
cambia el marco de página, revisa que la franja y la pantalla midan lo mismo (1140 en 1440).

## Página nueva para un componente que no tiene
1. Carpeta `src/modules/design-system/<pagina>/` con el esquema de arriba. Copia la estructura de la página más
   parecida: `header/` para una barra, `modales/` para algo que se abre y `navegacion/` para un marco.
2. Ruta en `src/modules/design-system/routes.ts`.
3. Entrada en `src/shared/layouts/nav-config.ts` (sección `design-system`, grupo de componentes). Es el único archivo de
   `src/shared/layouts/` que se puede editar sin permiso.
4. Súmala a `scripts/mapa.json` y a `referencias/mapa.md`.
5. Verifica con `verificar.mjs`: claro y oscuro, AA y anatomía sin nombres encimados.
