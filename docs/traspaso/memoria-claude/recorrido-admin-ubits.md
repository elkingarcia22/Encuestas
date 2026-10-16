---
name: recorrido-admin-ubits
description: "Lo que muestra hoy el administrador real de UBITS (recorrido del 2026-09-13): rutas, columnas, menús y textos literales de usuarios, planes, certificados, 360 y encuestas."
metadata: 
  node_type: memory
  type: reference
  originSessionId: 70882c8b-b6db-409f-b3cd-fda271f28d74
  modified: 2026-09-14T14:14:16.715Z
---

Recorrido de solo lectura con la sesión del usuario ([[login-ubits]]). Tras el login cae en
`www.lxp.ubitslearning.com/portal`; «Administrador» abre otra pestaña en `/admin-hr/home`.
La sesión caduca sola en unas horas. Tutoriales/modales de bienvenida se cierran con su X.

- **Gestión de usuarios** `/admin-hr/users`: 742 usuarios; columnas Nombres, Apellidos, Username,
  Estado, Fecha de creación, Rol, Estado del proceso; «Búsqueda por» Nombre/Apellido/Username;
  fila: Ver usuario, Editar usuario, Cambiar contraseña, Suspender; «Acciones»: Crear un usuario +
  masivas (Crear/Editar/Suspender/Activar varios, Recordatorios de inicio de sesión «Nuevo»).
  Vacío «Nada por aquí» / «No hay resultados para tu búsqueda. Revisa la ortografía, o prueba con
  una nueva consulta.» Recordatorios: «Enviaremos un correo electrónico a 413 personas que aún no
  han iniciado sesión, ten presente que solo puedes enviarlo una vez cada 24 horas.» (Cancelar /
  Sí, enviar). Crear usuario: 13 campos, error «Campo requerido», Nivel: Estratégico, Operativo,
  Táctico con/sin personal a cargo; Rol: RRHH, Estudiante. Masivas: planilla con Estado,
  Descripción de errores, «Usuarios correctos/con error», máx. 3000 filas; «Importar archivo CSV»
  en 4 pasos (Plantilla → «Carga tu plantilla», CSV máx. 1 MB → «Validar información»).
- **Planes de formación** `/creator/training-plan/content-plan`: 88 planes; Nombre, Fecha de
  inicio, Fecha de finalización, Progreso, Estado (Vigente/Planeado/No vigente/Procesando).
  Crear: Nombre, fechas («Igual o mayor a hoy», «Mayor o igual a la fecha de inicio»), vacío «Sin
  asignaciones». «Agregar asignación» (3 pasos): toda la empresa / por colaborador / por grupo /
  importar CSV → tabla de personas con filtros Área, Líder, Columna A/B, Nivel → contenidos
  (tabla o cuadrícula). Detalle: Último acceso, Última fecha de progreso, Contenidos x/y,
  Progreso; Acciones Editar/Duplicar/Descargar/Eliminar («¿Deseas eliminar realmente el plan…?»).
- **Certificados** `/certificate-management/:id/download-certificates`: descarga global / por
  contenido / por colaborador, fechas, correo dos veces, «Recibirás en tu correo un archivo .zip…».
- **Evaluaciones 360** `/talent/360/admin`: menú según estado; salir de crear: «Estás por salir del
  proceso» / «Los cambios que no se hayan guardado se perderán, asegúrate de respaldar tu
  proceso.» (Sí, salir / Continuar aquí).
- **Encuestas** `/surveys/admin`: 83; Nombre, Tipo, Origen, Estado, Inicio, Cierre,
  Participantes, Avance; selección: Vista previa, Editar, Duplicar, Eliminar; filtros Estado
  (Por Iniciar, En Progreso, Borrador, Finalizado), 8 tipos, % y fechas; «Crear en blanco /
  Crear con plantilla»; eliminar: «Esta acción no se puede deshacer. Se eliminará la encuesta…».
- **Tareas · seguimiento** `/tasks/tracking`: vacío «Nada en este período» / «No hay tareas en
  Últimos 7 días. Cambia el período para ver más.» + «Cambiar período».

**Recorrido del 2026-09-16** (misma sesión; admin en `www.lxp.ubitslearning.com/admin-hr/home`, cuenta «QA PLAN PREMIUM»).
Menú Empresa = Gestión de usuarios, Organigrama, Datos de empresa, Personalización, Roles y permisos, Nómina (Novasoft),
Comunicaciones.
- **Datos de empresa** `/admin-hr/companies/82`: pestañas Datos de la empresa | Suscripción, todo solo lectura (Estado,
  Nombre, Alias, Tiempo de estudio en minutos, Link Novasoft Colaborador/Admin, cursos propios 100, almacenamiento 10 GB,
  autenticación Manual, Integración Buk; suscripción Paga, plan MAX + LMS, 01-Jul-2026 → 02-Jul-2027, 5000 licencias,
  646 activas, 4354 inactivas).
- **Personalización** `/admin-hr/companies/customization/82` «Personaliza tu experiencia»: pestañas Inicio de sesión
  (logo horizontal ≥60 px alto ≤200 KB, imagen de fondo 960×1080 ≤500 KB, link de ingreso no editable + Copiar) y Logo
  principal (logo y logo para celular, vista previa del header con «Ver vista de celular»).
- **Comunicaciones** `/admin-hr/comunications` (= Avisos internos): tabla Contenido, Título, Fecha, Autor, Estado
  (Publicado/Archivado), Visualizaciones, Likes, Clicks; fila Editar / Ver historial / Archivar; «Crear publicación» en
  modal (título 0/50, descripción 0/400, link opcional, multimedia Imagen/Video, imagen ≤5 MB PNG/JPEG ≥350×196).
- **Tareas** `/tasks/individual|tracking` (otro marco, barra oscura con Administrador, Aprendizaje, Desempeño, Encuestas,
  Nómina, Selección, Tareas, Agentes): pestañas Tareas · Planes · Plantillas · Seguimiento; semana con días y «Agregar
  tarea» por día, «Sin tareas para este día», Filtros, «+ Crear».
- **Selección** abre `talentos.ubitslearning.com` (Reclutamiento, v1.4.0): sin vacantes («Todavía no tienes ninguna
  vacante creada» / «Añade tu primera vacante»); candidatos con cifras Total, En proceso, Descartados, Acción requerida.

Usado en [[templates-patrones-reales]].

**Recorrido del 2026-09-28** (Planes y Grupos, pedido de Cristian para alinear el playground; sesión en el navegador integrado).
- **Lista de planes** `/creator/training-plan/content-plan` y `/competence-plan` (pestañas = rutas): título «Planes de
  formación», botones «Asistente IA para planes» (contorno, abre Market AI `/market-ai/chat/<agente>` en otra pestaña) y
  «Crear plan de contenidos|competencias» (cambia con la pestaña). Tarjeta «Lista de planes: 100» + lupa; columnas Nombre,
  Fecha de inicio, Fecha de finalización (en competencias «Fecha de cierre»), Progreso (barra + %), Estado (filtro en el
  encabezado). Sin menú por fila: la fila abre el detalle. «100 planes · 10 por página».
- **Crear plan** `/form/new`: UNA página (no asistente). Cabecera ← «Plan de contenido» + [Agregar asignación] [Guardar].
  Tarjeta «Crea un nuevo plan de contenido»: alerta «Las fechas del plan se gestionan según la zona horaria de tu compañía:
  America/Bogota.», Nombre, Fecha de inicio («Igual o mayor a hoy») y Fecha de finalización («Mayor o igual a la fecha de
  inicio») por separado. Vacío ilustrado «Sin asignaciones». Competencias: «Nombre del plan», «Fecha de cierre», «Horas de
  estudio por competencia» (select 1–12 h, 1 por defecto).
- **Agregar asignación**: capa a pantalla completa con pasos en chips (Tipo de asignación → Participantes → Contenido).
  Paso 1: 4 tarjetas con radio en fila. Paso 2 (grupo): tabla Nombre/Usuarios + «Buscar grupos»; hay grupos automáticos
  «Ciudad - Bogotá», «País - X», «Usuarios con username …». Paso 3: tabla de contenidos con casillas (Nombre, Tipo, Estado,
  Nivel, Duración, Idioma, Habilidades, Competencias), lupa, filtro, «Seleccionados (0)», «Ver como: Tabla | Cuadrícula»;
  filtros en panel lateral (Contenido propio, Tipo, Competencia, Habilidad, Aliado, Nivel, Expertos, Idioma, Nivel de
  inglés; Limpiar/Aplicar). Pie Atrás / Siguiente / Agregar.
- **Detalle** `/content-plan/:id`: ← «Detalle del plan de contenidos» + «Acciones ⋮» (Editar, Duplicar, Descargar,
  Eliminar). Tarjeta: nombre + estado, alerta de zona horaria, fechas, «Progreso del plan» (barra). Tarjeta
  «Asignaciones: 9» + lupa: Nombre, Último acceso, Última fecha de progreso, Contenidos x/y, Progreso. Clic en persona →
  panel «Contenido asignado» (datos + tarjetas de contenido con portada, tipo, estado, nivel, duración, idioma). Sin pestañas.
- **Editar** `/form/:id`: la misma página de crear con «Editar plan de contenido» + estado; fecha de inicio bloqueada
  («La fecha de inicio no puede modificarse porque el plan ya inició.»); asignaciones POR PERSONA con ⋮ «Gestionar
  contenidos» / «Eliminar usuario del plan».
- **Grupos** `/creator/groups`: «Asistente IA para grupos» + «Añadir grupo»; «Lista de grupos» + lupa; Nombre (ordenable),
  Descripción, Integrantes, Acciones «Editar» (enlace). Sin selección ni borrado en la lista. «13 grupos · 16 por página».
- **Edición de grupo** `/groups/form/:id` (no hay detalle aparte): [Gestionar usuarios] [Guardar]; «Datos del grupo» Nombre*
  (obligatorio), Descripción; «Lista de usuarios · 106 resultados»: Nombre, Correo, Usuario, Área, Líder, Columna A/B, Nivel.
  «Seleccionar usuarios del grupo» a pantalla completa: tabla con casillas, lupa, filtros (Área, Líder, Columna A/B, Nivel),
  «Seleccionados (106)», Cancelar / Confirmar selección.
- **Asistentes IA**: Market AI; «Mis chats» a la izquierda con «Nuevo chat» (degradado) abajo, cabecera con el nombre del
  agente («Generacion de grupos de estudio»), «Hola <nombre>, bienvenido», caja «Responder» con + y enviar. Abrirlo CREA una
  «Nueva conversación» en Mis chats (efecto secundario).

## Planes de formación en el admin real (visto el 2026-09-29, lxp.ubitslearning.com/creator/training-plan)
- Agregar asignación = capa a pantalla completa. Pasos según tipo: empresa → Tipo·Contenido (2); colaborador y grupo → Tipo·Participantes·Contenido (3); CSV → Tipo·Cargar archivo (2, el CSV trae username y content_id).
- Colaboradores: tabla «Lista de usuarios · 661 resultados» (Nombre, Correo, Usuario, Área, Líder, Columna A/B, Nivel), filtros en panel, «Seleccionados (N)» para ver solo los elegidos.
- Grupo: se elige UNO (fila marcada), tabla Nombre | Usuarios con buscador.
- CSV: botones Descargar colaboradores / Descargar lista de contenidos / Descargar plantilla; «Debe ser un CSV separado por comas (no por punto y coma)… Máx. 1 archivos · Hasta 255 MB».
- Contenido: tabla (Tipo, Estado, Nivel, Duración, Idioma, Habilidades, Competencias), filtros, «Ver como: Tabla | Cuadrícula».
- Crear: tabla «Nuevas asignaciones — Asignaciones pendientes, selecciona la opción 'Guardar' para completar» con ⋮ Editar (reabre el asistente con todo marcado) / Eliminar.
- Editar: tabla Nombre, Último acceso, Última fecha de progreso, Contenidos x/y, ⋮ Gestionar contenidos / Eliminar usuario del plan → «¿Deseas eliminar a {nombre} del plan?» Cancelar/Confirmar.
- Detalle: «Detalle del plan de contenidos», Acciones (Editar, Duplicar, Descargar, Eliminar); tabla con Última fecha de progreso y barra %; competencias suma «Horas de estudio por competencia».

### Interacciones de Crear plan en el real (2026-09-30)
- Validación en vivo: al tocar cualquier campo marca en rojo los demás obligatorios. «El nombre es obligatorio.» (el nombre SÍ es obligatorio), «La fecha de finalización es obligatoria.». Guardar incompleto no avisa con toast: solo deja los errores.
- Fechas: campo de texto dd/mm/aaaa que se puede escribir + icono que abre calendario con selector de mes y de año; pasados apagados; fin no deja antes del inicio.
- Asistente: arranca con UN solo paso y botón «Agregar» apagado; al elegir tipo aparecen los demás pasos (pastillas: verde hecho, azul actual, gris apagado) y el botón pasa a «Siguiente». Los pasos son clicables (también hacia adelante si ya hay selección). Escape y la X cierran sin preguntar.
- Tablas del asistente: clic en cualquier parte de la fila marca; «Seleccionar todos los usuarios/contenidos visibles» en la cabecera; sin orden por columna; 12 por página; primera/anterior/siguiente/última.
- Contenido: «Ver como: Tabla | Cuadrícula» (3 tarjetas por fila con portada, tipo, insignia Público/Moodle, nivel, duración, idioma, casilla arriba a la derecha; borde azul al marcar).
- Nuevas asignaciones: fila «12 colaboradores | 1 contenidos | ⋮». Eliminar → «Eliminar asignación · ¿Deseas eliminar esta asignación? · Tipo de asignación: … · Contenidos asignados: …» Cancelar/Confirmar.
- Volver (flecha) sale sin confirmar. Lista: toda la fila es clicable, sin menú ⋮; cabeceras ordenables; filtro Estado (Vigente, Planeado, No vigente, Procesando).
- Vacío «Sin asignaciones» con ilustración animada; aviso de zona horaria en amarillo (advertencia), no azul.
- Prueba: a 700 px sale «Mejora tu experiencia… desde un computador»; usar viewport 1280x800 y leer por JS (las capturas se congelan).
