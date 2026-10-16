---
name: aprendizaje-planes-grupos
description: "Planes de formación y Grupos maquetados en /admin/aprendizaje/planes-de-formacion (24-sep); qué quedó, decisiones y pendientes (Categorías, Recursos IA sin HU)"
metadata:
  node_type: memory
  type: project
  originSessionId: 96fbffe0-44a5-4202-935f-065c956fe67e
  modified: 2026-09-24T16:28:27.164Z
---

El 2026-09-24 Cristian pasó el inventario de su bloque de Aprendizaje (planilla con ~45 filas: Categorías, Recursos IA, Planes, Grupos; referencia en ubits-react-playground.vercel.app, que pide Google @ubits.co y el usuario debe entrar él).

Hecho (sin commit todavía) en `src/modules/admin/aprendizaje/planes-de-formacion/`: lista de planes (switch contenidos/competencias), crear plan (asistente 3 pasos + resumen), editar (pestañas), detalle (progreso/asignaciones), paneles catálogo / participantes / editar asignación / colaborador, grupos (lista, crear/editar, detalle, panel de integrantes) y asistente IA de grupos (piezas de Suite AI). Datos en stores de sesión (planes-datos.ts, grupos-datos.ts) que reutilizan la plantilla del DS `templates/planes-formacion`.

Decisiones tomadas por mí, a validar: filtros del catálogo dentro del panel (no ventana encima); «modal según estado» del detalle como aviso en la pestaña; nombre de grupo obligatorio; asistente responde solo lo de la HU («Próximamente…»).

Realineado al UBITS real el 28-sep (sin commit aún): crear/editar en una sola página (formulario-plan.tsx) con «Agregar asignación» en 3 pasos en DrawerShell; detalle sin pestañas (dona se queda, lo pidió Cristian); grupos sin selección múltiple pero con «En planes»; «Edición de grupo» es la misma página que el detalle. Los asistentes IA son contextuales (panel acoplado a la derecha, agente-aprendizaje.tsx), nunca otra página: Cristian lo pidió explícito. Las tablas usan @container para caber con el panel abierto.

Pendiente: Categorías (su doc dice «no inventar producto») y Recursos IA (F3) esperan la referencia; 

**Why:** Es el trabajo asignado en [[reparto-war-room-2026-09-21]].
**How to apply:** seguir desde aquí; mismas reglas de listas de Nico ([[seleccion-candidatos-nico]]) y de IA ([[icono-ia]]).

28-sep (tarde): Cristian pidió que las tablas de Planes y Grupos sean «la del DS»: las 5 pasaron a DataGridList en su marco
(frame toolbar header, SIN_ARRASTRE, menú por estado vía contexto, ordenarPor/marcadosEn en planes-datos.ts), con
paginación en inglés aceptada. Choca con la regla de listas de Nicolás (Table + PiePaginacion): quedó anotada como
excepción a conciliar en reglas-vigentes.md.

29-sep (tarde): faltaban las HU v1 que David llamó «en curso». Hechas en la rama local `cristian`, sin commit:
- HU-LMS-016/022 reportes: «Reporte por estudiante» y «Reporte detallado» (CSV real + toast literal) en Acciones del
  detalle, solo Vigente/No vigente (components/reportes.ts).
- HU-LMS-015/021: tabs «Colaboradores | Contenidos/Competencias» en crear/editar (?tab=contenidos) con «Agregar
  asignación» único en la fila de tabs; tabla por ítem (components/tabla-items.tsx) con Agregar usuario (PanelIntegrantes
  con «Aplicar», preseleccionados), Reemplazar (1→1, excluye el actual) y Eliminar; tope 8 en competencias; el mismo
  tab de solo lectura en el detalle con «Lo terminaron». Editar se autoguarda (ChipGuardado de David traído idéntico
  de staging) y no tiene botón Guardar; crear sigue con Guardar. Personas agregadas una a una = `plan.extras`.
- «ProfileList» de la HU → número de personas + popover con nombres (no hay fotos; AvatarGroup con iniciales prohibido).

## Alineado al admin real (29-sep, sin commit)
- Agregar asignación: pasos según tipo (empresa y CSV 2, colaborador y grupo 3), drawer xl con TablaSeleccion (tabla-seleccion.tsx: TablaDatos + casillas + «Seleccionados (N)», junta la selección entre páginas).
- CSV trae personas y contenidos (username + content_id/competence_id) con 3 descargas (reportes.ts). Tope de 8 competencias = aviso + botón apagado.
- Crear: tabla «Nuevas asignaciones» con ⋮ Editar/Eliminar; Editar reabre el asistente en el paso 2 con todo marcado (también desde el lápiz de cada asignación al editar).
- Por grupo sigue permitiendo varios grupos (UBITS: uno solo); pendiente que Cristian decida.
- Trampa de prueba: en el panel del navegador los clics por coordenada caen fuera del drawer y lo cierran; probar con refs o JS.

## Interacciones calcadas del real (30-sep, sin commit)
Validación en vivo + nombre obligatorio (ya no «Plan sin nombre»), aviso de zona horaria en warning, asistente que arranca con un paso y deja saltar pasos resueltos, fila entera clicable (components/filas.ts: delega el clic a la casilla o al enlace de la fila), «Ver como: Tabla | Cuadrícula» (icono por tipo como portada), fila pendiente «N colaboradores», «Eliminar asignación» con resumen, vacío único con el botón dentro. CampoFecha (pieza del DS) ahora mide 40 px, se lee como campo y trae selector de mes/año: falta reflejarlo en el DS. Pendiente: escribir la fecha a mano, columnas extra (Columna A/B, Expertos, Aliados). Se conservó a propósito: confirmar al salir, Guardar en la barra de abajo (war room).
- 30-sep: Cristian rechazó el enlace «Ver progreso» en la tabla («terrible»). Patrón acordado: tocar la fila abre el plan en un drawer «Ver plan» (components/panel-plan.tsx) en cualquier estado, y editar / eliminar / «Ver plan completo» viven ahí; la lista ya no tiene menú ⋯ ni enlaces extra.
- 30-sep: tarjetas de contenido/competencia con banner (components/tarjeta-item.tsx; portadas reales de public/images/cards-learn e «imagenes competencias» mapeadas en catalogo.ts → portadaDe). Se usan en «Ver plan», panel de la persona y cuadrícula del catálogo. Cristian pidió «cards más bonitas» y «una ruta o curso puede tener banner».
- 30-sep (corrección): la tarjeta de contenido es la compartida `src/shared/components/TarjetaContenido` (de David, portal del colaborador y LMS Creator); tarjeta-item.tsx solo adapta los datos del plan a ella. No volver a armar una tarjeta de contenido propia. Cristian pide paneles densos: «mucho espacio blanco» = mal; cifras en fichas, fechas en el encabezado.
- 30-sep: panel «Ver plan» DECIDIDO tras probar 3 variantes: avance en grande arriba + pestañas «Contenidos» (SIEMPRE tarjetas) y «Personas» (SIEMPRE lista). Regla de Cristian: contenidos = tarjetas, personas = listas. («/design» no existe como skill en esta sesión.)
- 30-sep: Editar (y crear) plan rediseñado por pedido de Cristian («¿para qué colaboradores en editar?»): sin pestañas ni tabla de personas. Queda: encabezado con el nombre del plan + estado, datos en una fila, tabla de asignaciones (Editar/Eliminar + «Agregar asignación» en su cabecera, pie oculto si cabe: prop nueva `pieSoloSiHaceFalta` en TablaDatos) y contenidos en tarjetas con ⋯ (Agregar usuario, Reemplazar, Eliminar). PENDIENTE: «Gestionar contenidos de una persona» y «Eliminar usuario del plan» (que UBITS tiene en editar) quedaron sin sitio; propuesto llevarlas al panel de la persona en el detalle.
- 30-sep (decidido por Cristian): «Ver plan» = panel lateral; EDITAR = panel lateral (`PanelEditarPlan` en formulario-plan.tsx, ?editar=<id> en la lista, también desde el detalle; la ruta /planes/:id/editar redirige y editar/main.tsx se borró); CREAR = página por pasos (Datos del plan → Asignaciones → Revisar y guardar). El asistente «Agregar asignación» se abre encima del panel de editar. En UBITS no hay «agregar contenido» suelto: solo por asignación o «Gestionar contenidos» por persona; las acciones por contenido (Agregar usuario/Reemplazar/Eliminar) son de las HU, no de producción.
- 30-sep (corrección de Cristian: «la animación está horrible»): ver y editar son UN SOLO panel (panel-plan.tsx con modo 'ver'|'editar'; el cuerpo de editar es `CuerpoEdicionPlan` de formulario-plan.tsx). «Editar» cambia el contenido con fundido (animate-in fade-in), «Listo» vuelve a ver; el panel solo se desliza al abrir/cerrar. Nunca encadenar dos drawers que salen y entran. SALIDA_PANEL (480 ms) en planes-datos.ts para desmontar después de la animación de salida.
- 30-sep: editar YA NO se autoguarda (pedido de Cristian): pie «Cancelar · Guardar» con aviso «Tienes cambios sin guardar»; Cancelar o cerrar con cambios pregunta «¿Descartar los cambios?». Guardar valida y vuelve a «Ver plan». El pie es del panel; el formulario expone `control.guardar()` (ControlEdicion).
- 30-sep: SUBIDO a origin/staging (da10a94): commit a2130e5 (Planes) + 62a5586 (auditoría DS) + mezcla con PR #13 de David. En Avisos quedó la versión de David (MarcoTabla); AnilloSegmentado de David mudado a design-system/metricas/graficos.tsx. Pendiente con David: TablaDatos vs MarcoTabla.
