---
name: datagridlist-columnas-estables
description: "DataGridList: columnas y filtros fuera del componente; asidero de arrastre por columna (enableColumnOrdering); franja vacía con actions.item sin selection; paginación en inglés."
metadata: 
  node_type: memory
  type: project
  originSessionId: 06ede155-c0a3-4442-8631-c8aae781786a
  modified: 2026-09-09T21:43:36.822Z
---

`DataGridList` de @ubits/flux-ui memoiza los encabezados con
`useMemo(() => withDataGridHeaders(config.columns, config.columnFilters), [config.columns, config.columnFilters])`.
Si `columns` o `columnFilters` se declaran dentro del componente de pantalla, cambian de
identidad en cada render y el memo se invalida siempre.

Síntomas medidos el 2026-09-09 en `/design-system/data-grid`:
- el desplegable de un filtro multi-selección se cierra al marcar la primera opción, así que es
  imposible elegir dos valores;
- el menú «Personalizar columnas» revienta con `Maximum update depth exceeded` dentro de
  `<MenuRoot>` de Base UI, y React Router muestra su pantalla de error.

**Cómo aplicarlo:** declarar las columnas y los filtros como constantes a nivel de módulo
(`const COLUMNAS: DataGridListConfig<T>['columns'] = [...]`) o memoizarlos con `useMemo` y
dependencias estables. El resto de `config` sí puede reconstruirse en cada render.

Otro detalle del mismo componente: usa `manualSorting`, `manualFiltering` y `manualPagination`,
así que **no ordena, filtra ni pagina por su cuenta** — avisa por callbacks y espera recibir
`data` ya resuelta. Ver también [[flux-ui-mcp-catalogo-incompleto]].

Más hallazgos del 2026-09-10 en `/design-system/templates/dashboard-rrhh` (pestaña Operativo):
- `layout: { reorderable: false }` **no** quita el asidero de arrastre de cada cabecera: lo
  decide `columnDef.enableColumnOrdering !== false` dentro de `DataGridListTable`. Hay que poner
  `enableColumnOrdering: false` en cada columna. Sin eso, los asideros empujaban la columna de
  acciones fuera de la vista. Ojo: el tipo de `ColumnDef` no declara esa opción, así que escrita tal cual
  rompe `tsc -b`; va en una constante que se esparce (`...SIN_ARRASTRE`).
- Con `actions.item` y sin `selection`, la barra de acciones masivas se pinta vacía (40 px) sobre
  la tabla. Con `frame`, `frame.toolbar: 'header'` la saca de ahí.
- La paginación (`DataGridPagination` sin props) muestra «Rows per page» y «1 - 8 of 11» en
  inglés; `labels` no la cubre. Es límite de la librería.
Las tres están ya en `trampas_conocidas` del generador del catálogo.
