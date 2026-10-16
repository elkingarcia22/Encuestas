import { Tabs, TabsList, TabsTrigger } from '@ubits/flux-ui'
import type { Ajuste } from './main'
import {
  AcordeonLibreria,
  AjusteLibreria,
  AjusteUbits,
  AtencionUbits,
  AyudaLibreria,
  AyudaUbits,
  BibliotecaUbits,
  CatalogoUbits,
  FlujoUbits,
  NotaLibreria,
  PuntosUbits,
  ResumenUbits,
  SeccionUbits,
  StepperLibreria,
  StepperUbits,
  TimelineLibreria,
  VerEnPantalla,
} from './vacantes-demos'

// Ajustes propios de Selección › Vacantes (rama elkin, 24-sep): lo que se armó nuevo en las pantallas del listado y
// del asistente «Crear vacante», y lo que usa una pieza de la librería o del proyecto pero le cambia algo. Salió de
// revisar clase por clase lo que se pinta a mano (colores, radios, altos, rellenos con «!») y lo que no viene de
// src/shared. El detalle de la vacante y el expediente del candidato son de otras personas y no están aquí.

const LISTADO = '/admin/seleccion/vacantes'
const CREAR = '/admin/seleccion/vacantes/crear'

export const AJUSTES_VACANTES: Ajuste[] = [
  {
    id: 'vacantes-stepper',
    titulo: 'Stepper del asistente',
    estado: 'pedido',
    resumen: 'Los pasos 1, 2 y 3 de «Crear vacante», dentro de una tarjeta sobre el formulario y el panel «Así va la vacante»: número (o ✓), nombre y una línea con cómo va cada uno. Es el asistente de referencia del sistema (5-oct).',
    piezas: [{ nombre: 'Stepper', slug: 'stepper' }],
    libreria: <StepperLibreria />,
    ubits: <StepperUbits />,
    cambia: [
      'Círculo con borde gris en los pasos por hacer y azul lleno en el actual y en los hechos (estos con marca)',
      'Línea entre pasos gris, azul cuando el paso ya se hizo',
      'Los pasos que todavía no se desbloquean no se pueden elegir',
    ],
    porque:
      'Con el --accent igual al primario el Stepper pinta igual el paso activo y los inactivos. La columna vertical se quitó: con el panel «Así va la vacante» a la derecha no quedaba ancho para una tercera columna.',
    donde: [
      'PasosEnTarjeta (vacantes/crear/components/pasos-en-tarjeta.tsx) en Crear vacante y en la Exploración 1; STEP_INDICATOR y STEP_LINE (drawers/components/drawer-styles.ts) y PasosEncuesta (encuestas/crear/components/pasos-encuesta.tsx) en Crear encuesta',
      'Arriba del formulario. En Encuestas el paso que falló al finalizar va en rojo y, si la fila se angosta (agente de IA abierto), solo el actual lleva su nombre',
    ],
    usar: 'Asistentes de pocos pasos con un panel de apoyo al lado.',
    evitar: 'Copiar las clases a mano en otra pantalla: se importan de drawer-styles.ts.',
  },
  {
    id: 'vacantes-flujo',
    titulo: 'Flujo del candidato',
    estado: 'decidir',
    resumen: 'Paso 3: las etapas que recorre el candidato, numeradas, unidas por una línea y ordenables arrastrando.',
    piezas: [
      { nombre: 'Timeline', slug: 'timeline' },
      { nombre: 'Sortable', slug: 'sortable' },
      { nombre: 'Item', slug: 'item' },
      { nombre: 'Collapsible', slug: 'collapsible' },
      { nombre: 'Badge', slug: 'badge' },
    ],
    libreria: <TimelineLibreria />,
    ubits: <FlujoUbits />,
    cambia: [
      'La línea de tiempo se usa solo para numerar: ninguna etapa se pinta como cumplida',
      'La línea se corre 26 px hacia abajo y se acorta para que arranque bajo el círculo',
      'Círculo de 24 px con el número dentro, sobre el fondo de la tarjeta',
      'Cada fila es una tarjeta que se arrastra, o se mueve con las flechas desde el asidero',
      'La etapa de CV se abre hacia abajo con sus ajustes (sin panel lateral); las de IA muestran «Falta configurar» si les falta algo',
      'Al final, un pie como el de «Datos demográficos» en Encuestas: a la izquierda por cuántas etapas pasa el candidato y a la derecha «Agregar etapa», que abre la biblioteca',
      'Las que creó el equipo llevan además un lápiz para editarlas ahí mismo, sin ir hasta la biblioteca',
    ],
    porque:
      'El orden de las etapas es lo que se decide en este paso y tenía que leerse como un recorrido. La librería no trae una línea de tiempo que se pueda reordenar.',
    donde: ['FlujoCandidato (vacantes/crear/components/flujo-candidato.tsx)', 'Crear vacante › paso 3'],
    usar: 'Listas donde el orden es el dato: etapas, pasos de un proceso.',
    evitar: 'Historiales o actividad: eso va con el Timeline de la librería tal cual.',
  },
  {
    id: 'vacantes-biblioteca',
    titulo: 'Biblioteca de etapas',
    estado: 'variante',
    resumen: 'Paso 3: «Agregar etapa» al final del flujo abre la biblioteca en un globo, con buscador, filtro por categoría y las etapas propias.',
    piezas: [
      { nombre: 'Popover', slug: 'popover' },
      { nombre: 'InputGroup', slug: 'input-group' },
      { nombre: 'Select', slug: 'select' },
      { nombre: 'Item', slug: 'item' },
      { nombre: 'Badge', slug: 'badge' },
      { nombre: 'Empty', slug: 'empty' },
    ],
    libreria: <NotaLibreria>No hay un bloque de biblioteca: se arma con Popover, InputGroup, Select e Item.</NotaLibreria>,
    ubits: <BibliotecaUbits />,
    cambia: [
      'Globo de 448 px que sale del botón «Agregar etapa» (a la derecha del pie del flujo); buscador y filtro quietos, solo la lista hace scroll (hasta 320 px)',
      'Se queda abierto al agregar, para sumar varias etapas seguidas; crear o editar una etapa propia lo cierra y abre su diálogo',
      'Cada categoría tiene su icono y su color (azul, verde, amarillo o celeste), los mismos que luego se ven en el flujo',
      'Filtro especial «Con IA» además de las categorías',
      'Las etapas que creó el equipo van primero, con «Creada por ti» y los botones de editar y eliminar',
    ],
    porque:
      'Mezcla de las dos versiones del asistente: la de Cristian agrega etapas desde un botón al final del flujo, sin columna fija; la nuestra tenía buscador, filtro y control sobre las etapas propias. Se quedan ambas cosas y el flujo gana el ancho.',
    donde: ['AgregarEtapa y iconos-etapas.ts (vacantes/crear/components/biblioteca-etapas.tsx)', 'Crear vacante › paso 3, al final del flujo'],
    usar: 'Elegir piezas de un catálogo largo para sumarlas a una lista.',
    evitar: 'Inventar colores de categoría nuevos en otra pantalla: se reusa iconos-etapas.ts.',
  },
  {
    id: 'vacantes-plantillas',
    titulo: 'Plantillas de vacante',
    estado: 'variante',
    resumen: 'Las tarjetas «Empieza con una plantilla» del listado y el catálogo completo en un drawer.',
    piezas: [
      { nombre: 'Item', slug: 'item' },
      { nombre: 'Card', slug: 'card' },
      { nombre: 'ToggleGroup', slug: 'toggle-group' },
      { nombre: 'Accordion', slug: 'accordion' },
      { nombre: 'Breadcrumb', slug: 'breadcrumb' },
      { nombre: 'Badge', slug: 'badge' },
    ],
    libreria: <NotaLibreria>Se arma con Item y Card dentro del DrawerShell del proyecto; no hay un catálogo en la librería.</NotaLibreria>,
    ubits: <CatalogoUbits />,
    cambia: [
      'Tarjetas de plantilla en rejilla de 2 y 4 columnas, con el icono teñido del color de su categoría',
      'Drawer grande con buscador fijo arriba y cambio entre tarjetas y lista',
      'Tarjetas de al menos 240 px que llenan el ancho; la lista va en un solo recuadro con filas grises al pasar el cursor',
      'Detalle de plantilla con las etapas numeradas en círculo azul y los ajustes en dos columnas',
    ],
    porque: 'Las plantillas se eligen antes de entrar al asistente: el listado muestra las destacadas y el drawer, todas.',
    donde: ['vacantes/components/catalogo-plantillas.tsx y detalle-plantilla.tsx', 'Plantillas (vacantes/main.tsx)', 'Selección › Vacantes'],
    usar: 'Elegir un punto de partida antes de crear algo.',
    evitar: 'Repetir el selector de plantilla dentro del asistente.',
  },
  {
    id: 'vacantes-alertas',
    titulo: 'Alertas plegables del listado',
    estado: 'variante',
    resumen: '«N cosas necesitan tu atención»: vacantes estancadas, sin candidatos o en borrador olvidado.',
    piezas: [
      { nombre: 'Collapsible', slug: 'collapsible' },
      { nombre: 'Frame', slug: 'frame' },
      { nombre: 'Item', slug: 'item' },
    ],
    libreria: <NotaLibreria>Alert de la librería es un aviso fijo: no se pliega ni filtra nada.</NotaLibreria>,
    // La pieza real con datos de ejemplo y, debajo, el enlace a la pantalla (decisión 21 de la auditoría, 5-oct).
    ubits: (
      <div className="flex w-full flex-col items-center gap-4">
        <AtencionUbits />
        <VerEnPantalla ruta={LISTADO} etiqueta="Abrir Vacantes" nota="En la pantalla va arriba de la tabla y «Ver» la filtra a ese grupo." />
      </div>
    ),
    cambia: [
      'Tarjeta sin relleno propio para que las filas lleguen de borde a borde',
      'Icono de cada alerta teñido a mano: rojo, amarillo o celeste según la gravedad',
      'Cada alerta filtra la tabla a ese grupo de vacantes',
    ],
    porque: 'Lo urgente tenía que verse sin ocupar media pantalla, y llevar directo a las vacantes afectadas.',
    donde: ['BloqueAtencion (src/shared/components/BloqueAtencion.tsx), la misma de Contenidos', 'Selección › Vacantes'],
    usar: 'Resúmenes de «esto necesita atención» que filtran lo de abajo.',
    evitar: 'Mensajes del sistema o errores: ahí va Alert o notify.',
  },
  {
    id: 'vacantes-seccion',
    titulo: 'Sección del formulario',
    estado: 'decidir',
    resumen: 'Paso 1: las cuatro tarjetas de «Información», siempre abiertas, con la marca de completa junto al título.',
    piezas: [
      { nombre: 'Frame', slug: 'frame' },
      { nombre: 'Badge', slug: 'badge' },
    ],
    libreria: <AcordeonLibreria />,
    ubits: <SeccionUbits />,
    cambia: [
      'Frame con la cabecera de la librería (FrameHeader y FrameTitle, 5-oct), igual que el Flujo del candidato del paso 3, sin acordeón: las cuatro secciones se ven a la vez',
      '«Completa» en verde junto al título cuando la sección tiene lo obligatorio',
    ],
    porque:
      'Antes se abrían y cerraban de a una. Se quitó el acordeón (como en la versión de Cristian) para recorrer el paso de corrido; qué falta lo dice el panel «Así va la vacante».',
    donde: ['SeccionFormulario (vacantes/crear/components/piezas.tsx)', 'Crear vacante › paso 1'],
    usar: 'Formularios largos partidos en bloques con título.',
    evitar: 'Preguntas frecuentes o contenido de lectura: ahí va Accordion.',
  },
  {
    id: 'vacantes-resumen',
    titulo: 'Así va la vacante',
    estado: 'decidir',
    resumen: 'Panel a la derecha de los tres pasos de «Crear vacante»: la vacante como va quedando y lo que falta.',
    piezas: [
      { nombre: 'Card', slug: 'card' },
      { nombre: 'Progress', slug: 'progress' },
      { nombre: 'Badge', slug: 'badge' },
      { nombre: 'Separator', slug: 'separator' },
    ],
    libreria: <NotaLibreria>No hay un panel de resumen: se arma con Card, Progress, Badge y una lista de término y valor.</NotaLibreria>,
    ubits: <ResumenUbits />,
    cambia: [
      'Columna de 320 px que se queda a la vista al bajar (sticky)',
      'El nombre, la modalidad y —del paso 2 en adelante— el área y la ubicación se quedan fijos arriba como contexto',
      'El cuerpo cambia de un paso a otro y se enfoca solo en lo que se está llenando ahí: no repite entre pasos lo que ya quedó decidido en uno anterior',
      'Paso 1: la barra de avance con los datos obligatorios que faltan y, debajo, los campos y habilidades ya elegidos',
      'Paso 2: cada sección de la descripción con «Completa» o «Sin escribir» —no el texto que se escribió ahí—',
      'Paso 3: cada etapa del flujo, con la misma categoría y resumen que se lee en su tarjeta',
    ],
    porque:
      'Viene de la versión de Cristian. La primera versión sumaba todo lo decidido en cada paso siguiente y el panel se volvía una repetición larga del formulario; ahora cada paso muestra solo lo suyo y el contexto alcanza para no perderse.',
    donde: [
      'Piezas en vacantes/crear/components/piezas-resumen.tsx; ResumenVacante (resumen-vacante.tsx) y ResumenEncuesta (encuestas/crear/components/resumen-encuesta.tsx)',
      'Crear vacante (tres pasos) y Crear encuesta (cinco pasos; se oculta mientras el agente de IA está acoplado)',
    ],
    usar: 'Asistentes largos donde lo que se llena se tiene que leer junto.',
    evitar: 'Repetir campo por campo el formulario: el panel resume, no duplica.',
  },
  {
    id: 'vacantes-ayuda',
    titulo: 'Ayuda de un campo',
    estado: 'pedido',
    resumen: 'El (i) junto a una etiqueta: abre con clic, con el teclado o con el cursor.',
    piezas: [
      { nombre: 'Tooltip', slug: 'tooltip' },
      { nombre: 'Button', slug: 'button' },
    ],
    libreria: <AyudaLibreria />,
    ubits: <AyudaUbits />,
    cambia: [
      'Controlado para que también abra con clic y en táctil',
      'Esquina de 8 px, relleno de 12 × 8 px y letra de 13 px en el globo',
      'Icono en gris',
    ],
    porque: 'El Tooltip de la librería solo abre al pasar el cursor: en táctil o con teclado la ayuda no se veía.',
    donde: ['AyudaCampo (vacantes/crear/components/piezas.tsx)', 'Crear vacante › pasos 1 y 3'],
    usar: 'Pedir a la librería un Tooltip que abra con clic. Mientras, cualquier (i) de ayuda usa este.',
    evitar: 'Explicaciones largas: si no caben en dos líneas, van en la descripción del campo.',
  },
  {
    id: 'vacantes-tarjeta-ajuste',
    titulo: 'Tarjeta de ajuste con interruptor',
    estado: 'decidir',
    resumen: 'Un ajuste que se enciende y, encendido, muestra sus opciones debajo.',
    piezas: [
      { nombre: 'Field', slug: 'field' },
      { nombre: 'Switch', slug: 'switch' },
      { nombre: 'Separator', slug: 'separator' },
    ],
    hechoAMano: 'El recuadro es un div con borde y esquina de 12 px, no una Card ni un Item.',
    libreria: <AjusteLibreria />,
    ubits: <AjusteUbits />,
    cambia: ['Recuadro con borde, esquina de 12 px y 16 px de relleno', 'Icono en baldosa suave a la izquierda', 'Las opciones aparecen debajo, separadas por una línea'],
    porque: 'Sin el recuadro, «Publicar en bolsas» y «Correo de rechazo» se confundían con los campos de alrededor.',
    donde: ['TarjetaAjuste (vacantes/crear/components/piezas.tsx)', 'Crear vacante › paso 1'],
    usar: 'Decidir si pasa a Item con contorno de la librería, que da el mismo recuadro sin dibujarlo a mano.',
    evitar: 'Usarlo para un interruptor suelto sin opciones: ahí basta Field horizontal.',
  },
  {
    id: 'vacantes-paneles-ia',
    titulo: 'Paneles de las etapas con IA',
    estado: 'variante',
    resumen: 'Los drawers que configuran la evaluación de CV, Serena, los agentes de idioma y role play, y las pruebas.',
    piezas: [
      { nombre: 'Tabs', slug: 'tabs' },
      { nombre: 'RadioGroup', slug: 'radio-group' },
      { nombre: 'Progress', slug: 'progress' },
      { nombre: 'Select', slug: 'select' },
      { nombre: 'NumberField', slug: 'number-field' },
      { nombre: 'Sortable', slug: 'sortable' },
    ],
    libreria: (
      <Tabs defaultValue="general" className="w-full max-w-sm">
        <TabsList variant="line">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="criterios">Criterios</TabsTrigger>
        </TabsList>
      </Tabs>
    ),
    ubits: <PuntosUbits />,
    cambia: [
      'Barra de reparto de 100 puntos: la cifra en verde mientras cuadra y en rojo con aviso cuando se pasa; queda fija arriba al hacer scroll',
      'Pestañas «line» a todo el ancho con las pestañas alineadas a la izquierda',
      'Opciones como tarjetas de radio en 2 o 3 columnas (2 solo si son pares)',
      'Selector de voz con avatar o bandera y un botón «Escuchar» del alto del campo',
      'Cada número en una fila, como los interruptores: el nombre y para qué sirve a la izquierda, y el número con − y + y su unidad (pts, días, %) a la derecha, en una columna alineada. Sin deslizadores (5 oct)',
    ],
    porque: 'Cada etapa con IA se configura con muchos números; la barra de puntos evita que el reparto se descuadre sin darse cuenta.',
    donde: [
      'panel-agente.tsx, panel-entrevista.tsx, panel-pruebas.tsx sobre DrawerShell',
      'piezas-ia.tsx (DistribucionPuntos, SelectorVoz, FilaCriterio, GeneradorIa) y CampoNumero / CampoOpcion (piezas.tsx)',
      'Crear vacante › paso 3 › Configurar',
    ],
    usar: 'Configurar una etapa con IA: siempre en DrawerShell grande con el modo IA.',
    evitar: 'Abrir estos ajustes en un diálogo o dentro de la tarjeta del flujo (la de CV es la única que se abre en la tarjeta).',
  },
  {
    id: 'vacantes-encabezado',
    titulo: 'Encabezado fijo del asistente',
    estado: 'decidir',
    resumen: 'El título y el chip de guardado de «Crear vacante» se quedan arriba y el contenido pasa por debajo sin verse.',
    piezas: [
      { nombre: 'Badge', slug: 'badge' },
      { nombre: 'Spinner', slug: 'spinner' },
    ],
    hechoAMano: 'El recorte del contenido se calcula al hacer scroll y se aplica en línea (clip-path) desde el código.',
    libreria: <NotaLibreria>PageHeader de la librería se desplaza con la página.</NotaLibreria>,
    ubits: <VerEnPantalla ruta={CREAR} etiqueta="Abrir Crear vacante" nota="Baja por el formulario: el título se queda y el contenido no se ve detrás." />,
    cambia: [
      'Encabezado pegado arriba, con el título en una línea',
      'Chip de guardado compartido: «Guardando…» con spinner, «Cambios sin guardar» o «Guardado» en verde con contorno',
      'Mensaje de la barra inferior en rojo si se intentó publicar con algo pendiente',
    ],
    porque: 'En un asistente largo hay que saber siempre qué vacante se está creando y si ya se guardó.',
    donde: ['vacantes/crear/main.tsx; el chip es ChipGuardado (src/shared/components/ChipGuardado.tsx)', 'Crear vacante'],
    usar: 'Decidir si pasa a PageShell como opción (encabezado fijo) para no repetir el cálculo en otras pantallas.',
    evitar: 'Copiar el recorte en otra pantalla.',
  },
  {
    id: 'vacantes-colores-icono',
    titulo: 'Botones de icono con color a mano',
    estado: 'pedido',
    resumen: 'Borrar en rojo y asideros, volver o plegar en gris: el color se fuerza sobre BotonIcono y Button.',
    piezas: [{ nombre: 'Button', slug: 'button' }],
    libreria: <NotaLibreria>El ghost de la librería no tiene un tono destructivo ni uno atenuado.</NotaLibreria>,
    ubits: <VerEnPantalla ruta={CREAR} etiqueta="Abrir Crear vacante" nota="En el paso 3: la papelera de cada etapa en rojo y el asidero en gris." />,
    cambia: ['text-destructive! en quitar y eliminar', 'text-muted-foreground! en asideros, ayuda y plegar («Atrás» ya va con contorno, sin color forzado)', 'Repetido en varios lugares de Vacantes'],
    porque: 'La papelera en negro competía con las acciones principales, y el asidero tenía que pasar a segundo plano.',
    donde: ['flujo-candidato, biblioteca-etapas, panel-entrevista, panel-pruebas, paso-descripcion y piezas'],
    usar: 'Pedir un tono «destructive» y otro «muted» para el Button ghost, o sumarlos a BotonIcono como opción para no repetir la clase.',
    evitar: 'Pintar botones de otros colores a mano.',
  },
]
