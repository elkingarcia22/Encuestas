# Encargo para Elkin: «Cargar encuestas» pasa a página propia

De: Cristian · Fecha: 13-oct · Pantalla: Desempeño y cultura › Encuestas › «Cargar encuestas»

## Qué hay que cambiar

Hoy «Cargar encuestas» abre un panel lateral con tres pasos (Archivos, Datos generales, Estructura), una pestaña «Cargas» y un «Cancelar». Tiene que pasar a **una página propia**, con el marco de página de las demás creaciones (título, la fila de pasos, una barra de abajo con «Atrás» y seguir, y una sola salida arriba).

Lo que se ve al terminar:

- Al pulsar «Cargar encuestas» en el menú de la lista, la pantalla de Encuestas cede su lugar a la página de la carga. La dirección sigue siendo la misma, con `?cargar=nueva` (o `?cargar=cargas` para el historial), así el «Atrás» del navegador devuelve a la lista.
- La lista de encuestas **no se pierde**: sigue por debajo con sus filtros, su selección y sus pestañas, y vuelve tal cual al salir.
- Arriba, a la derecha del título, **una sola salida**: «Volver a encuestas». Si hay algo sin cargar, pregunta «¿Salir sin guardar?» con «Seguir editando» y «Salir sin guardar».
- Abajo, la barra: a la izquierda el estado y «Ver cargas»; a la derecha «Atrás» y el botón de seguir («Analizar archivo», «Continuar con esta encuesta», «Continuar», «Cargar encuesta»). Sin «Cancelar» ni «Cerrar».
- La carga **sigue en segundo plano** aunque se vuelva a la lista, igual que hoy: la fila de la tabla muestra el avance y el Centro de procesos lo lleva.

## Por qué

Decisión de Cristian del 13-oct, regla **crear-en-pagina**: crear y editar viven en una página, nunca en un panel, y tampoco hay asistentes por pasos dentro de un panel. «Agregar asignación» (Planes) y la asignación de Objetivos ya se pasaron; «Cargar encuestas» es el tercero y es tuyo, por eso te lo dejo aquí. La auditoría de staging lo marcó como pendiente (`cargar-encuestas-pagina` en las decisiones por tomar).

## Cómo quedó «Agregar asignación», para que lo uses de ejemplo

Mismo patrón, ya hecho (los cambios están en la copia del commit **T7a/T7b**; cuando se junten verás los archivos así):

- **Planes de formación › Crear plan › Agregar asignación**
  - Página: `src/modules/admin/aprendizaje/planes-de-formacion/components/agregar-asignacion.tsx`
  - Quien la muestra (cede su lugar sin desmontarse): `src/modules/admin/aprendizaje/planes-de-formacion/components/formulario-plan.tsx` (busca `subAsignacion`; la página va en un `return` anticipado, justo antes del `return` principal).
  - Dirección: la del plan con `?asignacion=nueva` o `?asignacion=<id>`.
- **Objetivos › Crear ciclo › Objetivos asignados**
  - Página: `src/modules/admin/desempeno-cultura/objetivos/crear/components/asignados/pagina-asignacion.tsx`
  - Quien la muestra: `src/modules/admin/desempeno-cultura/objetivos/crear/main.tsx` (busca `subAsignacion`). Aquí la pantalla de fondo queda **oculta pero montada** (`<div className={… 'hidden' : 'contents'}>`), porque su ventana de «salir» tiene que seguir viva. **Para Encuestas usa este segundo modo**: la lista tiene su estado y la carga corre en segundo plano.

## Las piezas que tiene que usar

Todas ya existen; no armes otras:

| Para qué | Pieza | Dónde |
| --- | --- | --- |
| Marco de la página | `PageShell`, `PageHeader`, `PageContent`, `PageActionBar` | `@/shared/components/PageShell` |
| Abrir y cerrar la página con la dirección | `useSubpaginaEnUrl('cargar')` → `{ valor, abrir, cerrar }` | `@/modules/design-system/navegacion/subpagina-en-url` |
| «Atrás» del navegador con algo sin cargar | `useFrenoAtras({ param: 'cargar', activo, registro })` (pinta `dialogo` y da `liberar()`) | el mismo archivo |
| La fila de pasos | `PasosFila` | `@/modules/design-system/navegacion/pasos-fila` |
| La única salida con su ventana | `BotonSalirCreacion texto="Volver a encuestas" salida={{ conCambios, registro }}` | `@/modules/design-system/navegacion/boton-salir-creacion` |
| El estado a la izquierda de la barra | `ChipGuardado` | `@/shared/components/ChipGuardado` |

Además:

- Los pasos y sus cuerpos (`PasoArchivos`, `PasoElegir`, `PasoGenerales`, `PasoEstructura`, `PasoSiguiente`, `PestanaCargas`, `SinSalida`) se quedan como están: solo cambia el marco. «Ver cargas» y «Nueva carga» son dos vistas de la misma página, no otra pantalla.
- **Sin borrador real**: la carga no guarda nada hasta «Cargar encuesta». El chip dice «Cambios sin guardar» mientras haya algo a medias (`STEPS_WITH_PENDING_WORK`) y la ventana de salir tiene **dos** salidas, sin «Guardar y salir». Esa ventana la trae `BotonSalirCreacion`: se borra la propia (`ActionDialog` «¿Salir sin cargar la encuesta?»), con su `confirmarSalida`, `cancelarSalida` y `cerrarDelTodo` del estado de la carga.
- El título de la ventana de salir es siempre «¿Salir sin guardar?».
- Es una pantalla de IA: el orbe (`IconoIA`), nunca estrellas, y el botón que abre el agente se llama «Agente IA». Antes de cambiar los botones en pastilla (`PILL`), mira `reglas_para` del archivo: la regla de botones dice una sola esquina.
- «Siguiente» pasa a «Continuar», como en Crear encuesta y Crear ciclo.

## Ojo con estas tres trampas

1. **El estado de la carga vive en la lista, no en el panel** (`useCargaHistorica` en `encuestas/main.tsx`). Déjalo ahí: así cerrar la página no detiene la carga. La dirección solo dice si la página está abierta (`abierto` del estado puede salir y reemplazarse por `valor !== null` de `useSubpaginaEnUrl`).
2. **El aviso al Centro de procesos** (`useCargasEnProcesos`) hoy corre dentro de `PanelCarga`, que siempre está montado. Si la página lo lleva dentro y se desmonta al volver, las cargas dejan de reportar su avance. Súbelo a un componente que siempre esté montado (la lista) o déjalo en un componente aparte que se renderice siempre.
3. **Las dos entradas**: el menú «Cargar encuestas» (`carga.abrir()`) y la fila «Cargando» o «Con error» (`carga.abrir('cargas')`) tienen que terminar en la misma página, con `?cargar=nueva` y `?cargar=cargas`.

## Lista de comprobación

- [ ] «Cargar encuestas» abre una página, no un panel; el panel (`DrawerShell`) ya no existe en esa carpeta.
- [ ] La dirección lleva `?cargar=nueva` (o `cargas`) y el «Atrás» del navegador vuelve a la lista.
- [ ] La lista de Encuestas vuelve con sus filtros, selección y pestaña como estaban.
- [ ] Una sola salida, «Volver a encuestas», arriba; con algo a medias pregunta «¿Salir sin guardar?» con dos salidas.
- [ ] «Atrás» del navegador con algo a medias también pregunta.
- [ ] No hay «Cancelar» ni «Cerrar» en la barra de abajo.
- [ ] La fila de pasos (Archivos, Datos generales, Estructura) sale con la pieza `PasosFila`; solo se puede volver a un paso anterior.
- [ ] «Atrás» y seguir están en la barra de abajo; «Ver cargas» a la izquierda con el número de cargas en curso.
- [ ] El chip a la izquierda dice «Cambios sin guardar» solo mientras hay algo a medias.
- [ ] Lanzar una carga, volver a la lista y ver que la fila sigue avanzando y que el Centro de procesos la muestra.
- [ ] Desde la fila «Cargando» o «Con error» se llega a «Cargas» en la página.
- [ ] Orbe de IA y botón «Agente IA» donde corresponda; «Agregar» y no «Añadir» en los textos que toques.
- [ ] `npm run check` sin errores y, como borras archivos o ventanas, `npm run build`.
- [ ] En el reporte, di que tocaste `encuestas/main.tsx` y la carpeta `cargar/` (son tuyos).

## Prompt para pegarle a Claude

```
Tengo que pasar «Cargar encuestas» de panel lateral a página propia. Es una decisión de Cristian (regla
crear-en-pagina, 13-oct): crear y editar viven en una página y los asistentes por pasos ya no van en un panel.
Responde en español y sin jerga; descríbeme lo que se ve en pantalla.

Antes de escribir nada:
1. Lee CLAUDE.md y AGENTS.md, y corre reglas_para y buscar_pieza de ds-ubits sobre
   src/modules/admin/desempeno-cultura/encuestas/components/cargar/panel-carga.tsx y encuestas/main.tsx.
2. Lee el encargo completo en este archivo: encargo-elkin-cargar-encuestas.md.
3. Lee los dos ejemplos ya hechos: formulario-plan.tsx + agregar-asignacion.tsx (Planes) y
   objetivos/crear/main.tsx + asignados/pagina-asignacion.tsx (Objetivos). Para Encuestas usa el modo de Objetivos:
   la lista queda montada y oculta mientras se ve la página.

Qué hacer:
- Cambia el panel (DrawerShell) de components/cargar/panel-carga.tsx por una página con PageShell, PageHeader,
  PageContent y PageActionBar. Título «Cargar encuestas» con el orbe de IA.
- La página se abre con useSubpaginaEnUrl('cargar') (?cargar=nueva o ?cargar=cargas) desde las dos entradas: el menú
  «Cargar encuestas» y la fila «Cargando» o «Con error». La lista de Encuestas sigue montada por debajo con su estado
  (no la desmontes), y useCargaHistorica se queda en la lista para que la carga siga en segundo plano.
- Los pasos con PasosFila (Archivos, Datos generales, Estructura); solo se puede volver a un paso anterior.
- Una sola salida en la cabecera: BotonSalirCreacion texto="Volver a encuestas" con salida={{ conCambios, registro }},
  donde conCambios es STEPS_WITH_PENDING_WORK.includes(paso). Sin «Guardar y salir» (no hay borrador real). Borra
  el ActionDialog «¿Salir sin cargar la encuesta?» y lo que solo servía para él (confirmarSalida, cancelarSalida,
  cerrarDelTodo si ya no se usan).
- useFrenoAtras({ param: 'cargar', activo: conCambios, registro }) para el «Atrás» del navegador; llama a
  liberar() antes de las salidas por la pantalla.
- Barra de abajo: ChipGuardado «Cambios sin guardar» a la izquierda solo mientras haya algo a medias, y «Ver cargas»
  con el número en curso; a la derecha «Atrás» y seguir («Analizar archivo», «Continuar con esta encuesta»,
  «Continuar», «Cargar encuesta»). Sin «Cancelar» ni «Cerrar».
- «Cargas» y «Nueva carga» son dos vistas de la misma página.
- Ojo: useCargasEnProcesos hoy vive en PanelCarga; que siga montado siempre para que las cargas en curso sigan
  avisando al Centro de procesos aunque se vuelva a la lista.
- No cambies los cuerpos de los pasos (paso-estructura.tsx, pasos-carga.tsx) más de lo que haga falta para el marco.

Al terminar: npm run check y npm run build, ds-ubits revisar sobre cada archivo que toques, y dime qué archivos
cambiaste. No hagas push ni publiques; eso lo decide Cristian.
```
