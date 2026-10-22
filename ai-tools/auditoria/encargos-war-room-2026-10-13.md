# Encargos del war room del 13-oct (16-oct)

Lo que salió de la revisión de Carlos sobre el tablero de Figma y es de cada dueño. Decisiones tarea por tarea: https://claude.ai/artifact/4HzUuCmahttuJdtpG7m5Eu. Las piezas y reglas que se citan ya están en la rama `reparar-auditoria-13oct` y en `ai-tools/reglas/reglas.json` (`node ai-tools/mcp/ds-ubits.mjs reglas_para <archivo>` las trae). Cada encargo apunta a la pieza del design system, no a la ventana de otra pantalla.

Lo transversal lo hizo Cristian en la rama, también en archivos de cada uno (está abajo, en «Ya hecho en tus archivos»): la ventana de salir, la barra de los pasos, el volver de los paneles, la pantalla completa, el texto y el panel de Orbit, el paginador, las barras de avance, los avisos y el pie.

## Nicolás

| Qué | Dónde | Cómo debe quedar | Pieza o regla | Cómo comprobarlo |
| --- | --- | --- | --- | --- |
| Stepper como el de Crear contenido (min 32:02) | Crear vacante | La misma fila de pasos que Crear contenido | PasosFila | Crear vacante y Crear contenido lado a lado: mismos pasos |
| Paneles con dos cajas (min 38:59) | Paneles de Selección (Créditos de IA y los demás) | Marco gris y panel blanco, como los demás; abajo como mucho dos botones (Créditos de IA tiene «Cerrar» y dos más) | DrawerShell, regla panel-volver-arriba | Abrir cada panel: dos cajas, el volver arriba, dos botones abajo |
| Indicador de Créditos de IA (min 43:31) | Créditos de IA | El indicador de avance de la librería, como el de créditos y licencias del menú de empresa, en vez del anillo | Progress | Créditos de IA y el menú de Meta Colombia con el mismo indicador |
| Tus vacantes (min 48:53) | Selección › Vacantes | Buscador y filtros dentro de la tabla, a la derecha, sin salto de línea; el buscador opaco | TablaDatos | Tus vacantes a 1440 y 1140 px |
| Mis candidatos (min 24:40) | Selección › Mis candidatos | Ya está: Orbit de solo icono y la descripción no choca | regla encabezado-sin-choque | Comprobado el 16-oct a 1140 y 1440 px |

**Ya hecho en tus archivos (16-oct):** Crear vacante y el editor de vacantes usan la ventana de salir del sistema (VentanaSalir) y la barra de pasos (BarraPasos: «Continuar con descripción / con etapas» pasa a «Continuar»); el tablero ampliado toma el marco de pantalla completa, la X en círculo y «Ampliar tablero» arriba a la derecha; DrawerShell suma `onVolver` y las vistas anidadas dicen «← Volver»; el agent-kit trae el asidero de ancho de Orbit.

Mensaje para el chat:
> Nico, del war room del 13: te quedan el stepper de Crear vacante como el de Crear contenido, tus paneles con las dos cajas y como mucho dos botones abajo (Créditos de IA tiene tres), el indicador de Créditos de IA con el de la librería y, en Tus vacantes, buscador y filtros dentro de la tabla. Mis candidatos ya quedó. En la rama reparar-auditoria-13oct toqué Crear vacante (ventana de salir y barra de pasos), el tablero ampliado y DrawerShell (volver arriba): el detalle está en ai-tools/auditoria/encargos-war-room-2026-10-13.md.

## David

| Qué | Dónde | Cómo debe quedar | Pieza o regla | Cómo comprobarlo |
| --- | --- | --- | --- | --- |
| Imagen por defecto (min 33:17) | Crear aviso | Sin imagen subida, el aviso usa una por defecto (o un fondo con el texto encima) también en el detalle, no solo en la miniatura | — (decisión tuya) | Un aviso sin imagen, en miniatura y en detalle |
| Tu pantalla completa en el tablero (min 29:05) | Figma «UX-Team» | Pegar el visor de curso (PDF o presentación) en la sección «Pantallas fullscreen» | regla pantalla-completa | Está en el tablero |
| «Editar con IA» con borde redondo (min 46:41) | Portada de Crear contenido | El botón de IA del design system | BotonIa | Portada junto al design system |
| Tabla / Cuadrícula (min 47:52) | Contenidos | El mismo selector de vista que Encuestas, el del design system; ponerse de acuerdo con Elkin | regla contenidos-tabla-o-tarjetas | Contenidos y Encuestas con el mismo selector |
| Gráfica de Diagnóstico (min 51:57) | Diagnóstico | Todas las métricas con su gráfica, o ninguna | — | Las tres métricas iguales |
| Columna fija de acciones (min 54:29) | Avisos | La columna de acciones deja de ser fija | TablaDatos | Desplazar la tabla: la columna se mueve con las demás |

**Ya hecho en tus archivos (16-oct):** Crear contenido y Crear assessment usan la ventana de salir (VentanaSalir) y la barra de pasos (BarraPasos); BarraEditor usa BarraPasos por dentro (su «Atrás» deja de ser gris fantasma); el editor de video dice dónde se retoma el borrador; los editores inmersivos (MarcoInmersivo) tienen el margen de 16 px de la pantalla completa; ComposerTray pone «Orbit puede cometer errores. Verifica la respuesta.» debajo del campo, también en el agente de Crear evaluación; la cuadrícula de Contenidos no muestra «Anterior» ni «Siguiente» con una sola página.

Mensaje para el chat:
> Dave, del war room del 13: te quedan la imagen por defecto de Crear aviso (también en el detalle), pegar tu visor de curso en el tablero de Figma, «Editar con IA» con el botón de IA del design system, el selector Tabla / Cuadrícula igual que Encuestas (hablarlo con Elkin), las gráficas de Diagnóstico parejas y quitar la columna fija de Avisos. En la rama reparar-auditoria-13oct toqué Crear contenido, Crear assessment, BarraEditor, MarcoInmersivo y el ComposerTray: el detalle está en ai-tools/auditoria/encargos-war-room-2026-10-13.md.

## Elkin

| Qué | Dónde | Cómo debe quedar | Pieza o regla | Cómo comprobarlo |
| --- | --- | --- | --- | --- |
| Selector de vista (min 48:53) | Encuestas | El mismo selector Tabla / Cuadrícula que Contenidos, el del design system; ponerse de acuerdo con David | regla contenidos-tabla-o-tarjetas | Encuestas y Contenidos con el mismo selector |
| Crear ciclo sin cajas sobre cajas (min 52:44) | Objetivos › Crear ciclo | Ya está con tu lista; comprobar en staging | ListaElegible | Paso de participantes sin caja dentro de caja |

**Ya hecho en tus archivos (16-oct):** Crear encuesta y Crear ciclo usan la ventana de salir (VentanaSalir, la que ya habías calcado) y la barra de pasos (BarraPasos: «Volver» pasa a «Atrás» y desde el paso 2); Cargar encuestas, Comparar encuestas, Cargar objetivos y el panel de asignación llevan el volver arriba (`onVolver`); Accionables de Resultados va en píldora (pestaña dentro de pestaña); tu BotonPantallaCompleta usa la pieza del sistema PantallaCompleta (se mudó al design system) y la vista previa de la encuesta tiene la X en círculo; la lista de destinatarios de Crear ciclo usa tu ListaElegible; el agente de Crear encuesta entra con la animación del sistema y sigue montado al cerrarlo.

Mensaje para el chat:
> Elkin, del war room del 13: te queda unificar el selector Tabla / Cuadrícula de Encuestas con el de Contenidos (hablarlo con Dave). Tu lista quedó como pieza del sistema y ahora la usa también la lista de destinatarios de Crear ciclo. En la rama reparar-auditoria-13oct toqué Crear encuesta, Crear ciclo, los paneles de carga y de asignación, Accionables y tu pantalla completa: el detalle está en ai-tools/auditoria/encargos-war-room-2026-10-13.md.

## Del war room del 15-oct

Cambios que corrigen lo de arriba:

- **La ventana de salir va siempre en azul** (Carlos, con David de acuerdo: el rojo es solo para eliminar; salir de un flujo no destruye nada). Ya está en la ventana del sistema (VentanaSalir), en su regla y en el design system. También en «¿Salir sin cargar?» del panel de carga de Objetivos (Elkin): solo se quitó el rojo, una línea.
- **La pantalla completa es solo para lo que pide foco total** (flujos de aprendizaje y la tabla de Gestión de usuarios). La regla ya lo dice. Quedan para sus dueños:
  - **Nicolás:** decidir si el tablero de candidatos de la vacante se queda con «Ampliar tablero».
  - **Elkin:** decidir si los mapas de calor de Resultados se quedan con su pantalla completa.
- **El mensaje a Johan ya no hace falta:** Cristian habló con él; todos pueden unir a develop con la aprobación de otra persona.