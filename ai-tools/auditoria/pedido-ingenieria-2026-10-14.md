# Pedido para ingeniería: zona protegida (auditoría del 13-oct)

La auditoría de staging del 13-oct y su reparación del 14-oct (rama `reparar-auditoria-13oct`) dejaron sin tocar la zona protegida (`src/shared/`, `src/app/`, `src/index.css`, `scripts/`), como pide AGENTS.md. Esto es lo que necesita un cambio ahí, ordenado por cuánto se nota. Los ids I-xxx están en `ai-tools/auditoria/hallazgos-2026-10-13.json`, con archivo, línea y captura de referencia en el informe: https://claude.ai/artifact/AbH8FfDuki6eZVNWBymrXF

## Rompe

| Qué pasa | Dónde | Cambio propuesto |
| --- | --- | --- |
| «Enviar feedback» cierra y borra el comentario y los pantallazos sin preguntar (X, Cancelar, Escape, clic afuera). I-015 | `src/shared/components/FeedbackDialog.tsx:141-212` | `dismissible={false}` y, con comentario o pantallazos, preguntar con `DialogoConfirmar` «Seguir editando · Descartar» antes de cerrar. |

## Se nota

| Qué pasa | Dónde | Cambio propuesto |
| --- | --- | --- |
| Una dirección equivocada muestra el recuadro rayado «Slot · Página no encontrada… se arma en *». I-137 | `src/shared/pages/NotFoundPage.tsx`, `createPage.tsx`, `PlaceholderPage.tsx` | Que la ruta `*` use el error 404 de Pantallas › Estados. Después, `createPage` y `PlaceholderPage` quedan sin uso (las pantallas pendientes ya usan `PantallaProximamente`). |
| El pie de página sale en creaciones, Tareas y Configuración. I-132, regla footer-solo-home | `src/shared/components/AppFooter.tsx` y el marco | Invertir la lista: pie solo en `/admin`, `/portal-colaborador` y el inicio del design system. El 8-oct Carlos se lo asignó a Cristian como cambio global: puede hacerlo él con ese visto bueno. |
| El buscador global ⌘K sigue en el encabezado y en el paso 2 del tour. I-133, regla sin-buscador-global | `AppHeader.tsx`, `CommandPalette.tsx`, el tour | Quitarlo del encabezado y del tour. |
| `notify` deja el tipo opcional; los avisos del marco salen sin icono. I-134 | `src/shared/components/notify.ts:18-33` | Tipo obligatorio (tercer parámetro), `onRemove` opcional en `notify` y `notifyAction`, que `notifyAction` devuelva el id del aviso (cierra «reintentar-con-id») y una versión para esperas (`toast.promise`). |
| «Cerrar sesión», «Centro de ayuda», «Cambiar contraseña» y varios botones del marco solo muestran un aviso. I-129, I-131 | `ProfilePopover.tsx:184`, `NotificationsPopover.tsx:247` | Regla nueva «nada-que-finja»: hacerlo de verdad (cerrar sesión lleva al acceso), quitarlo o apagarlo con un globo. |
| El menú de perfil del portal dice «Vista actual: Administrador» y no hay camino de vuelta. I-130 | `ProfilePopover.tsx:128` | Mostrar la vista real y la forma de volver al admin. |
| El colaborador ve Configuración y cambio de empresa; la HU dice que solo ve el logo. I-128 | `AccountPopover.tsx:171` | Ocultarlos en el portal. |
| «Organigrama» y «Roles y permisos» no llevan a ninguna pantalla. I-127 | `AccountPopover.tsx:348` | Llevarlos a `PantallaProximamente` o quitarlos. |
| «Acciones en vacantes» de Novedades lleva a la lista vieja de Vacantes. I-136 | `Announcements.tsx:127` | Llevarlo a `/admin/seleccion/exploraciones/uno` (la del menú). |
| El tour de bienvenida todavía presenta «Orbit Flow, contigo en cada pantalla»; desde el 8-oct el agente se llama «Orbit» (Julián: en ventas confunde tener los dos nombres). Fuera de la zona protegida ya se cambió. | `src/shared/components/TourDialog.tsx:44, 74, 77` y comentarios de `RootLayout.tsx:76, 92, 100` | Cambiar «Orbit Flow» por «Orbit» (y la captura del paso si lo nombra). |
| Con texto largo, el aviso se ve angosto y alto (war room del 8-oct). | `src/shared/components/Toaster.tsx` | Un ancho mayor cuando el texto pasa de una o dos líneas. La duración ya depende de los caracteres (`duracionAviso`). |
| «Enviar feedback» trae su propia ilustración glass y su propio cargador. I-135 | `FeedbackDialog.tsx:84` | Usar `ImagenGlass` y `AdjuntoCsv`. |
| La etiqueta «Próximamente» del menú solo se ve en las entradas de primer nivel; el riel plegado la lee como «nuevo». | `AppSidebar.tsx:159-168` (NavLeafItem), `:313` (DrillPanel); `SidebarRail.tsx:130-142, 339` | Pintar `leaf.badge` en NavLeafItem y pasar `badge` en DrillPanel; en el riel, el punto solo si la etiqueta es «Nuevo» (o leer su texto). |

## Del war room del 13-oct (16-oct)

| Qué pasa | Dónde | Cambio propuesto |
| --- | --- | --- |
| El buscador de la cabecera no busca en el design system: Carlos buscó «salir» o «modal» y no llegó a la ventana de salir. | `src/shared/components/CommandPalette.tsx` (`paginasDelMenu` solo lee el menú del administrador) | En el design system, indexar sus páginas y las piezas de «Todos los componentes» (`componentes/inventario-datos.ts`). Mientras, la ventana se encuentra con el buscador de esa página. |
| Hechos en la rama con permiso de Cristian (Carlos se los asignó): avisos (`Toaster.tsx`), pie solo en los inicios (`AppFooter.tsx`), azules del modo oscuro y barras de avance redondeadas (`src/index.css`). | — | Revisarlos al unir: están en commits propios con «(zona protegida)» en el título. |

## Detalle

| Qué pasa | Dónde | Cambio propuesto |
| --- | --- | --- |
| Porcentajes pegados («78%»). | `shell-data.ts:46-47`, `AccountPopover.tsx:142`, `Announcements.tsx:231` | «78 %» (decisión de vocabulario del 13-oct). |
| Fecha «11 SEP 2026» en mayúsculas y a mano. I-410 | `Announcements.tsx:145` | `fechaCorta` («11 sept 2026»). |
| «Borrar la búsqueda». | `tabla-listado.tsx:138` | «Limpiar la búsqueda». |
| «sep» a mano en la base de ejemplo. | `src/shared/bd/tareas-y-planes.ts:142, 522, 1110` | «sept» (en :1110, agregar «sept» sin quitar «sep»). |
| «Todo leído» de Notificaciones con un icono de línea. I-404 | `NotificationsPopover.tsx:222` | `PrimeraVez` con `glass-tick`. |
| `PrimeraVez` solo admite un botón primario: hay vacíos con botón de IA, dos acciones o barra de avance que no caben. | `src/shared/components/PrimeraVez.tsx` | Aceptar `accion.variante`, `acciones` o `children`, y el error de un bloque con «Reintentar» (glass-danger). |
| Archivos que nadie importa: MarcoTabla (retirada el 5-oct), `PageFallback`, `LayoutSlot`, `consumo-contenidos`. I-412, I-505, I-515 | `src/shared/components/tabla-listado.tsx` y vecinos | Borrarlos y quitar la excepción de MarcoTabla en `reglas.json`. |
| Insignias chicas del marco con la letra de la librería. I-405 | `AppSidebar.tsx:81` | Badge del proyecto, o el mínimo de 10,5 px fijado en el tema (así se puede borrar el envoltorio). |
| «Nueva conversación» / «Nuevo chat» (la regla dice «Crear»). | `SidebarRail.tsx:294, 303`, `AppSidebar.tsx:400` | Decidir con Nicolás. |

## Para el check (`scripts/check.mjs`)

Las vigilancias nuevas ya están en `node ai-tools/mcp/ds-ubits.mjs revisar` (no es zona protegida). Para que el check las haga obligatorias:

- Enlaces a rutas que no existen (`navigate()`, `to=` y la lista de «Ver en acción»).
- Textos de maqueta en avisos («Aquí se abriría», «Lo construimos en la siguiente fase», «no está en el playground»).
- Piezas prohibidas en pantallas: `toast.add`, `Badge` de la librería en xs o sm, `Table` y `Empty` de la librería sin ilustración glass.
- `notify` sin tipo, también cuando el tipo va en la línea siguiente.
- Envíos masivos («Recordar a», «Enviar recordatorio») sin `DialogoConfirmar` en el archivo.
- Archivos que nadie importa, listados en cada PR.
- Un detalle: hoy el check marca `AGENTS.md` como andamiaje modificado cuando solo cambian sus bloques «generado» (los escribe `generar-reglas.mjs`). Conviene ignorar esos bloques.
