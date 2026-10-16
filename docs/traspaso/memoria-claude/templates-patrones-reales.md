---
name: templates-patrones-reales
description: "Templates Gestión de usuarios, Planes de formación y Encuestas (2026-09-14) que llevan los patrones a pantallas reales; marco admin-compartido y piezas exportadas de los patrones."
metadata: 
  node_type: memory
  type: project
  originSessionId: 70882c8b-b6db-409f-b3cd-fda271f28d74
  modified: 2026-09-14T14:13:59.433Z
---

Pedido de Carlos ([[feedback-carlos-concepto]]): ver Estados, Data-grid y Formularios en pantallas
reales. El 2026-09-14 quedaron tres templates, sin commit ni publicar:

- `/design-system/templates/gestion-usuarios` (lista, `crear`, `editar/:id`, `carga-masiva/:accion`
  con crear/editar/suspender/activar). Sin HU: copy de la pantalla real ([[recorrido-admin-ubits]]).
- `/design-system/templates/planes-formacion` (lista, `nuevo?tipo=`, `:id/editar`, `:id`), HU-LMS-005.
- `/design-system/templates/encuestas` (lista con pestaña Datos demográficos). Sin HU. Desde el 2026-09-14
  «Crear encuesta» lleva a `nueva` (`?modo=plantilla`) y «Editar» (borradores y por iniciar) a `:id/editar`:
  formulario por pasos (datos, preguntas, participantes, revisión) con activar confirmado; se quitó el
  diálogo `DialogoNuevaEncuesta`. Design system › Formularios tiene «Ver en pantallas reales» (menú con
  Crear encuesta, Crear usuario y Nuevo plan); `EncabezadoPatron` acepta `acciones`.

**Marco:** `templates/admin-compartido/` (marco-admin, contexto, rutas, piezas, lista,
no-encontrada) reutiliza el Home operativo sin tocarlo: su menú, PromoLms, encabezado y Suite AI;
`destino(slug)` manda las entradas con template propio a estos templates y el resto al pendiente
del Home. `useMarcoAdmin().abrirSuiteAI(borrador)` abre Suite AI con el pedido escrito.
ShellUbits no se modificó. Los procesos masivos viven en el layout del template para seguir al
navegar.

**Piezas que ahora exportan los patrones (sin cambiar lo que se ve, verificado):**
`DialogoConfirmar` (confirmaciones), `AdjuntoCsv`, `ProcesoEnCurso`, `ActualizadoHace` (procesos),
`temporizadores.ts`, `PantallaDeError` con `onAccion` + `errores-sistema-datos.ts`, `SelectorMultiple`
+ `asignacion-datos.ts`, `Indicadores`, `Persona`, `ConfirmarEliminar` con título/texto/botón
opcionales (seguimiento) y `sin-arrastre.ts`. Datos en archivos .ts aparte para no romper la
recarga en caliente (el lint avisa si un .tsx exporta constantes).

**Trampas vistas:** Escape dentro de `SelectorMultiple` (Combobox múltiple) borra lo elegido; en CDP el
primer clic tras cerrar su lista se pierde (usar clic por JS). StepperTitle `max-sm:sr-only` para que el
Stepper de 4 pasos quepa en celular. SheetContent no crece con `sm:max-w-*` (queda ~384 px); Esc dentro de un
Combobox en un Sheet cierra el Sheet; en Combobox Enter no elige sin resaltar antes (en CDP hacer
clic en `[role=option]`); validar al salir del campo puede correr el botón «Guardar» bajo el
cursor y perder el clic (se usó `onMouseDown={e => e.preventDefault()}` en los botones); la tabla
debe sumar ≤ 1.080 px de columnas para caber en el cuerpo de 1.140 px; en celular las migas
largas se montan con «Novedades» (marco compartido, sin tocar).

**Pendiente de decidir con el usuario:** Suite AI con marca Meta → ¿Google?. Commit hecho el 2026-09-14
(79b3957 en `cristian`, sin push; el merge a develop lo aprueba Cris Burbano).
