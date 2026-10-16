import type { PantallaReal } from './piezas'
import { ENCUESTAS, GESTION_USUARIOS, PLANES_FORMACION } from '../templates/admin-compartido/rutas'

// «Ver en acción»: para cada página del design system, las pantallas navegables donde esa pieza se usa de verdad.
// Una sola lista para que el botón de cada página no se desordene. Solo pantallas con contenido (nada de
// «pendiente»); el detalle dice qué mirar o qué tocar para verlo. Si una pantalla cambia de ruta, se cambia aquí.

const COLABORADOR = '/design-system/templates/colaborador'
const SUITE_AI = '/suite-ai'
const LMS = '/admin/aprendizaje/lms-creator/contenidos/onboarding-operativo'
const TAREAS = '/admin/tareas'
const AVISOS = '/admin/avisos-internos'
const AVISO_BORRADOR = '/admin/avisos-internos/av-107/editar'
const VACANTE = '/admin/seleccion/vacantes/analista-de-datos'
// «Vacantes» del menú todavía es un slot: la lista maquetada es la de la exploración 1 de Selección.
const VACANTES = '/admin/seleccion/exploraciones/uno'
const EXPEDIENTE = '/admin/seleccion/vacantes/ejecutivo-comercial/candidatos/sebastian-vargas'
const DATOS_EMPRESA = '/admin/configuracion/datos-empresa'
const PERSONALIZACION = '/admin/configuracion/personalizacion'

// Solo pantallas vivas: el producto (/admin, /suite-ai) o plantillas que siguen en el menú. Nada del archivo (Suite AI
// concepto, dashboards, app shells): tienen su marco de entonces y se ven rotas dentro del design system (22 sep).
export const EN_ACCION: Record<string, PantallaReal[]> = {
  color: [
    { titulo: 'Inicio del admin', detalle: 'Métricas, tarjetas y gráficas con los colores del tema.', ruta: '/admin' },
    { titulo: 'Gestión de usuarios', detalle: 'Etiquetas de estado en la tabla.', ruta: GESTION_USUARIOS },
    { titulo: 'Orbit', detalle: 'Los colores de la IA: degradado y orbe.', ruta: SUITE_AI },
  ],
  tipografia: [
    { titulo: 'Inicio del admin', detalle: 'Saludo, títulos de sección y cifras.', ruta: '/admin' },
    { titulo: 'Detalle de un plan', detalle: 'Título de página, secciones y textos de apoyo.', ruta: `${PLANES_FORMACION}/p-01` },
    { titulo: 'Contenido del colaborador', detalle: 'Lectura larga con títulos y acordeón.', ruta: `${COLABORADOR}/contenido/liderazgo-situacional` },
  ],
  espacio: [
    { titulo: 'Inicio del admin', detalle: 'Cuerpo de 1.140 px y aire entre bloques.', ruta: '/admin' },
    { titulo: 'Gestión de usuarios', detalle: 'Cuerpo de 1.140 px con migas y tabla.', ruta: GESTION_USUARIOS },
  ],
  icons: [
    { titulo: 'Accesos rápidos', detalle: 'Iconos Glass en «Quick actions» del Inicio.', ruta: '/admin' },
    { titulo: 'Gestión de usuarios', detalle: 'Hugeicons en el menú de cada fila y en «Acciones masivas».', ruta: GESTION_USUARIOS },
    { titulo: 'Editor de contenidos', detalle: 'Hugeicons en la barra del editor.', ruta: LMS },
  ],
  marco: [
    { titulo: 'Inicio del admin', detalle: 'Barra lateral, barra superior y pie completos.', ruta: '/admin' },
    { titulo: 'Orbit', detalle: 'El mismo marco en modo Orbit, con historial.', ruta: SUITE_AI },
    { titulo: 'Gestión de usuarios', detalle: 'Marco con migas de pan.', ruta: GESTION_USUARIOS },
    { titulo: 'Portal del colaborador', detalle: 'El marco con el menú del colaborador.', ruta: COLABORADOR },
    { titulo: 'Menús del encabezado', detalle: 'Notificaciones, perfil y buscador ⌘K.', ruta: TAREAS },
    { titulo: 'Ventana de edición', detalle: 'Selección › «Crear vacante»: el editor por pasos en ventana.', ruta: VACANTES },
  ],
  botones: [
    { titulo: 'Gestión de usuarios', detalle: 'Primario, secundario y «Acciones masivas» en la cabecera.', ruta: GESTION_USUARIOS },
    { titulo: 'Crear usuario', detalle: 'Guardar y cancelar al pie del formulario.', ruta: `${GESTION_USUARIOS}/crear` },
    { titulo: 'Crear un curso', detalle: 'Botón de IA con orbe en el Inicio.', ruta: '/admin' },
    { titulo: 'Editor de contenidos', detalle: 'Cierra el agente y aparece «Orbit Flow».', ruta: LMS },
    { titulo: 'Aprobar un plan', detalle: 'Aprobar y publicar en una conversación de Orbit.', ruta: `${SUITE_AI}/chat/vacaciones` },
  ],
  storybook: [
    { titulo: 'Gestión de usuarios', detalle: 'DataGridList, Badge, Avatar, DropdownMenu y el panel lateral DrawerShell.', ruta: GESTION_USUARIOS },
    { titulo: 'Crear usuario', detalle: 'Field, Combobox, Select, Checkbox y Alert.', ruta: `${GESTION_USUARIOS}/crear` },
    { titulo: 'Inicio del colaborador', detalle: 'Carousel, Card, Progress e Item.', ruta: COLABORADOR },
    { titulo: 'Contenido del colaborador', detalle: 'Accordion y lectura larga.', ruta: `${COLABORADOR}/contenido/liderazgo-situacional` },
    { titulo: 'Conversación de Orbit', detalle: 'Message, Bubble, HoverCard y Toggle.', ruta: `${SUITE_AI}/chat/evaluaciones` },
  ],
  navegacion: [
    { titulo: 'Lista con pestañas', detalle: 'Planes de formación: migas, pestañas y tabla.', ruta: PLANES_FORMACION },
    { titulo: 'Detalle de un registro', detalle: 'Un plan abierto con sus secciones.', ruta: `${PLANES_FORMACION}/p-01` },
    { titulo: 'Asistente por pasos', detalle: 'Crear una encuesta paso a paso.', ruta: `${ENCUESTAS}/nueva` },
    { titulo: 'Selección masiva', detalle: 'Marca filas y aparece la barra de acciones.', ruta: GESTION_USUARIOS },
    { titulo: 'Resultado de Orbit', detalle: 'Una conversación con su propuesta.', ruta: `${SUITE_AI}/chat/evaluaciones` },
    { titulo: 'Maestro-detalle', detalle: 'Tareas: la lista a la izquierda y la tarea elegida a la derecha.', ruta: TAREAS },
    { titulo: 'Configuración', detalle: 'Datos de empresa con pestañas de solo lectura.', ruta: DATOS_EMPRESA },
  ],
  'barra-lateral': [
    { titulo: 'Workspace', detalle: 'La barra con el selector Workspace | Orbit.', ruta: '/admin' },
    { titulo: 'Orbit', detalle: 'La barra en modo historial de conversaciones.', ruta: SUITE_AI },
    { titulo: 'Menú de plantilla admin', detalle: 'Con Configuración en el menú de empresa.', ruta: '/design-system/templates/home-operativo' },
    { titulo: 'Menú del colaborador', detalle: 'Las secciones del portal del colaborador.', ruta: COLABORADOR },
  ],
  header: [
    { titulo: 'Header del Workspace', detalle: '⌘K, novedades, notificaciones y perfil (ayuda va en el menú de perfil).', ruta: '/admin' },
    { titulo: 'Header de un editor', detalle: 'Nombre, estado del borrador y «Orbit Flow».', ruta: LMS },
    { titulo: 'Header en Orbit', detalle: 'El mismo header; el centro de procesos se abre desde notificaciones.', ruta: SUITE_AI },
  ],
  drawers: [
    { titulo: 'Ficha de usuario', detalle: 'Menú de una fila › «Ver».', ruta: GESTION_USUARIOS },
    { titulo: 'Vista previa de encuesta', detalle: 'Acción «Vista previa de la encuesta» en una fila.', ruta: ENCUESTAS },
    { titulo: 'Agregar asignación', detalle: 'Botón «Agregar asignación»: drawer por pasos.', ruta: `${PLANES_FORMACION}/nuevo?tipo=contenidos` },
    { titulo: 'Plan con IA', detalle: 'Botón «Generar plan con IA».', ruta: `${COLABORADOR}/progreso` },
    { titulo: 'Ficha de candidato', detalle: 'Toca un candidato en el tablero de la vacante.', ruta: VACANTE },
    { titulo: 'Historial de un aviso', detalle: 'Menú de una fila › «Ver historial».', ruta: AVISOS },
  ],
  modales: [
    { titulo: 'Confirmar eliminar', detalle: 'Acción «Eliminar» en una encuesta.', ruta: ENCUESTAS },
    { titulo: 'Comparar encuestas', detalle: 'Botón «Comparar encuestas».', ruta: ENCUESTAS },
    { titulo: 'Crear vacante', detalle: 'Ventana por pasos desde la lista de vacantes.', ruta: VACANTES },
    { titulo: 'Publicar contenido', detalle: 'Botón «Publicar» del editor.', ruta: LMS },
    { titulo: 'Enviar recordatorio', detalle: 'Botón «Enviar recordatorio» del progreso.', ruta: `${COLABORADOR}/progreso` },
    { titulo: 'Archivar un aviso', detalle: 'Menú de una fila › «Archivar».', ruta: AVISOS },
    { titulo: 'Eliminar tareas', detalle: 'Marca tareas › «Eliminar»: pide escribir la palabra.', ruta: TAREAS },
  ],
  estados: [
    { titulo: 'Todos a pantalla completa', detalle: 'Los errores de sistema y la carga, cada uno en su dirección.', ruta: '/design-system/templates/estados' },
    { titulo: 'Vacío de primera vez', detalle: 'Encuestas › pestaña Datos demográficos.', ruta: ENCUESTAS },
    { titulo: 'Vacío «todavía no»', detalle: 'Un plan de formación que aún no empieza.', ruta: `${PLANES_FORMACION}/p-08` },
    { titulo: 'Sin resultados al buscar', detalle: 'Tareas: busca algo que no exista.', ruta: TAREAS },
    { titulo: 'Carga de una tabla', detalle: 'Encuestas: la lista mientras llegan los datos.', ruta: ENCUESTAS },
    { titulo: 'Proceso largo', detalle: 'Crear varios usuarios: al confirmar, el avance sigue en la lista.', ruta: `${GESTION_USUARIOS}/carga-masiva/crear` },
    { titulo: 'Aviso al guardar', detalle: 'Crear usuario: confirma que quedó guardado.', ruta: `${GESTION_USUARIOS}/crear` },
    { titulo: 'Confirmar antes de borrar', detalle: 'Eliminar una encuesta desde su menú.', ruta: ENCUESTAS },
    { titulo: 'Un registro que no existe', detalle: 'Un plan de formación que no se encuentra.', ruta: `${PLANES_FORMACION}/p-99` },
  ],
  'data-grid': [
    { titulo: 'Gestión de usuarios', detalle: 'Filtros por columna, selección y acciones masivas.', ruta: GESTION_USUARIOS },
    { titulo: 'Seguimiento de tareas', detalle: 'Filtros, selección múltiple y acciones masivas.', ruta: TAREAS },
    { titulo: 'Planes de formación', detalle: 'Estados por plan, orden y paginación.', ruta: PLANES_FORMACION },
    { titulo: 'Encuestas', detalle: 'Carga al abrir y eliminar varias a la vez.', ruta: ENCUESTAS },
    { titulo: 'Participantes de un plan', detalle: 'Tabla dentro del detalle de un registro.', ruta: `${PLANES_FORMACION}/p-01` },
    { titulo: 'Avisos internos', detalle: 'Miniatura, estado y métricas por aviso.', ruta: AVISOS },
    { titulo: 'Tabla de vacantes', detalle: 'Estado, embudo en miniatura y quién espera respuesta.', ruta: VACANTES },
  ],
  metricas: [
    { titulo: 'Inicio del admin', detalle: 'Fila de cifras con variación y gráficos de área y dona.', ruta: '/admin' },
    { titulo: 'Tareas', detalle: 'Cifras que cuentan lo filtrado, en una tarjeta partida.', ruta: TAREAS },
    { titulo: 'Avisos internos', detalle: 'Cifras de las comunicaciones sobre la tabla.', ruta: AVISOS },
    { titulo: 'Detalle de una vacante', detalle: 'Cifras del proceso arriba del tablero.', ruta: VACANTE },
  ],
  formularios: [
    { titulo: 'Crear usuario', detalle: 'Validación al salir del campo y al guardar.', ruta: `${GESTION_USUARIOS}/crear` },
    { titulo: 'Crear encuesta', detalle: 'Por pasos, con revisión antes de activar.', ruta: `${ENCUESTAS}/nueva` },
    { titulo: 'Crear plan de formación', detalle: 'Fechas y campos que dependen de otros.', ruta: `${PLANES_FORMACION}/nuevo?tipo=contenidos` },
    { titulo: 'Carga masiva por pasos', detalle: 'Stepper con archivo, revisión y confirmación.', ruta: `${GESTION_USUARIOS}/carga-masiva/crear` },
    { titulo: 'Inicio de sesión', detalle: 'Campos con icono y pestañas.', ruta: '/design-system/templates/auth' },
    { titulo: 'Editor de un aviso', detalle: 'Contadores, link y carga de imagen con validación.', ruta: '/admin/avisos-internos/nuevo' },
    { titulo: 'Personalización', detalle: 'Carga de logos con vista previa y guardar cambios.', ruta: PERSONALIZACION },
  ],
  ia: [
    { titulo: 'Chat nuevo', detalle: 'Degradado, orbe, cuadro de escritura y sugerencias.', ruta: SUITE_AI },
    { titulo: 'Aprobación encadenada', detalle: 'Plan por aprobar y panel de actividad.', ruta: `${SUITE_AI}/chat/vacaciones` },
    { titulo: 'Propuesta con métricas', detalle: 'Tarjeta de propuesta e indicador de escritura.', ruta: `${SUITE_AI}/chat/evaluaciones` },
    { titulo: 'Modo voz', detalle: 'El orbe a pantalla completa.', ruta: `${SUITE_AI}/voz` },
    { titulo: 'Crear un curso', detalle: 'Tarjeta con degradado de IA en el Inicio.', ruta: '/admin' },
    { titulo: 'Agente en una vacante', detalle: 'Resumen con fuentes y comparación de finalistas.', ruta: VACANTE },
    { titulo: 'Expediente del candidato', detalle: 'El icono de IA en las pestañas y tarjetas de evaluación; Roleplay con alerta de trampa.', ruta: `${EXPEDIENTE}?pestana=roleplay` },
  ],
  'agente-contextual': [
    { titulo: 'Editor de contenidos', detalle: 'El agente abierto a la derecha; se cierra y vuelve con «Orbit Flow».', ruta: LMS },
    { titulo: 'Actividad del agente', detalle: 'Panel de actividad en una conversación.', ruta: `${SUITE_AI}/chat/vacaciones` },
    { titulo: 'Plan con IA', detalle: 'El agente completa un plan del colaborador.', ruta: `${COLABORADOR}/progreso` },
    { titulo: 'Resumir y comparar candidatos', detalle: 'Vacante › «Orbit Flow»; marca 2 candidatos y compara.', ruta: VACANTE },
    { titulo: 'Resumir en el expediente', detalle: '«Orbit Flow» › Resumir y toca una fuente: cambia de pestaña y la resalta.', ruta: '/admin/seleccion/vacantes/analista-de-datos/candidatos/laura-mendez' },
    { titulo: 'Reescribir y revisar un aviso', detalle: 'Borrador de aviso › «Publicar» o «Hazlo más corto».', ruta: AVISO_BORRADOR },
  ],
}
