// Auditoría de unificación. Primera pasada el 17-sep sobre develop (Cristian y Nicolás); segunda el 28-sep sobre
// staging, ya con el trabajo de David y Elkin. Las cifras son archivos de src/ salvo que se diga otra cosa; las que
// tienen `clave` se calculan de enlaces.ts (que también dice de quién es cada archivo). Cuando se decida algo, se
// cambia el estado del hallazgo aquí; cuando se aplique, pasa a RESUELTOS.

export type Estado = 'arreglar' | 'decidir' | 'limpiar'

export const ESTADO: Record<
  Estado,
  { etiqueta: string; badge: 'destructive-outline' | 'warning-light' | 'info-light'; ayuda: string }
> = {
  arreglar: { etiqueta: 'Arreglar', badge: 'destructive-outline', ayuda: 'Se ve mal hoy, rompe una regla o se puede caer sin avisar.' },
  decidir: { etiqueta: 'Por decidir', badge: 'warning-light', ayuda: 'Dos o más formas de hacer lo mismo: el equipo elige una.' },
  limpiar: { etiqueta: 'Limpieza', badge: 'info-light', ayuda: 'No cambia lo que se ve; ordena el proyecto.' },
}

// clave: la lista de archivos de enlaces.ts. Si la tiene, la cifra se calcula de ahí y abre las pantallas.
export type Variante = { forma: string; cifra?: string; detalle?: string; clave?: string }

export type Hallazgo = {
  id: string
  titulo: string
  estado: Estado
  resumen: string
  hoy: Variante[]
  propuesta: string
  donde?: string[]
}

export type Pestana = 'resumen' | 'fundamentos' | 'componentes' | 'iconos' | 'marcos' | 'check' | 'pendientes'

export const PESTANAS: { valor: Pestana; etiqueta: string; ruta: string; bajada: string }[] = [
  { valor: 'resumen', etiqueta: 'Resumen', ruta: '/design-system/unificacion', bajada: 'Qué está bien, quién usa qué y en qué orden.' },
  {
    valor: 'fundamentos',
    etiqueta: 'Fundamentos por revisar',
    ruta: '/design-system/unificacion/fundamentos',
    bajada: 'Deuda del tema: afecta a todas las pantallas por igual.',
  },
  {
    valor: 'componentes',
    etiqueta: 'Componentes',
    ruta: '/design-system/unificacion/componentes',
    bajada: 'La misma pieza resuelta con componentes distintos.',
  },
  { valor: 'iconos', etiqueta: 'Iconos', ruta: '/design-system/unificacion/iconos', bajada: 'Un concepto, varios iconos y quince tamaños.' },
  {
    valor: 'marcos',
    etiqueta: 'Marcos y espaciado',
    ruta: '/design-system/unificacion/marcos',
    bajada: 'Contenedores de página, encabezados, anchos, escala de espacios y convenciones.',
  },
  {
    valor: 'check',
    etiqueta: 'Qué no revisa el check',
    ruta: '/design-system/unificacion/check',
    bajada: 'Por qué todo lo anterior pasa en verde, y lo que se puede borrar.',
  },
  {
    valor: 'pendientes',
    etiqueta: 'Pendientes de otras personas',
    ruta: '/design-system/unificacion/pendientes',
    bajada: 'Auditoría del 29-sep sobre lo de Cristian: lo que apareció de otras personas (no se tocó) y los pedidos a ingeniería.',
  },
]

// Quién hizo cada archivo: la persona con más líneas en él según git. Ingeniería es el andamiaje original.
export const PERSONAS = ['Cristian', 'Nicolás', 'David', 'Elkin'] as const

export const REVISION = {
  fecha: '28 de septiembre',
  rama: 'staging',
  pantallas: '163',
  archivos: '492',
}

export const BIEN: { titulo: string; detalle: string }[] = [
  { titulo: 'Cero librerías de interfaz ajenas', detalle: 'Todo sale de flux-ui. Ni MUI, ni ReUI importado, ni lucide. Igual que el 17-sep.' },
  { titulo: '1.561 iconos, todos Hugeicons', detalle: 'Siempre dentro de HugeiconsIcon. Ningún SVG pegado ni icono de Figma.' },
  { titulo: 'Cero colores a mano en las pantallas', detalle: 'Ningún #hex ni paleta cruda de Tailwind fuera del tema, tampoco en lo de David y Elkin.' },
  { titulo: 'Un solo panel lateral y un solo aviso', detalle: 'Nadie usa Sheet directo (todo es DrawerShell) y el Toaster vive solo en el marco.' },
  { titulo: 'Un solo marco en el producto', detalle: 'Las pantallas de admin y colaborador van en RootLayout + PageShell, con el mismo PageHeader.' },
]

export const RESUELTOS: { titulo: string; detalle: string }[] = [
  { titulo: 'Crear y editar: un solo panel lateral', detalle: 'Sheet directo pasó de 8 archivos a 0. Los cuatro usan el drawer flotante (DrawerShell).' },
  { titulo: 'Encabezado de página', detalle: 'Las pantallas del producto usan el PageHeader del marco (66 archivos). Las copias propias quedan solo en templates.' },
  { titulo: 'Marco de página', detalle: 'PageShell en 37 pantallas del producto; el resto son borradores o van a pantalla completa (chat y voz de Orbit).' },
  { titulo: '--info definido y --accent en gris', detalle: 'El azul de información ya está en el tema, en claro y oscuro. --accent dejó de pintar de azul los menús.' },
  { titulo: 'Etiquetas de estado', detalle: 'Casi todas en la familia suave: 62 archivos con -light u -outline, 4 con la versión sólida.' },
  { titulo: 'Insignia de IA', detalle: 'Una sola, EtiquetaIA, gris y en pastilla. Las de Elkin y David ya pasaron a ella.' },
  { titulo: 'Métricas: una pieza y su página (29-sep)', detalle: 'Cifras y gráficos salieron del Dashboard del Archivo y del Inicio a Design system › Métricas; las cifras van en una sola tarjeta.' },
]

export const ORDEN: { titulo: string; detalle: string }[] = [
  { titulo: '1. Quitar las estrellas de IA', detalle: 'Regla del 23-sep: lo que hace la IA lleva el orbe. Hoy hay estrellas en 22 pantallas.' },
  { titulo: '2. Arreglar el tema', detalle: '--success y --warning, colores de gráfica y las dos reglas globales que pisan a la librería.' },
  { titulo: '3. Decidir el vocabulario', detalle: 'Tarjeta, lista, confirmación, iconos y medidas. La tabla «Quién usa qué» dice dónde está cada uno.' },
  { titulo: '4. Decidir los estilos forzados', detalle: 'Documentarlos en Ajustes propios o pedirlos a la librería; hoy son 59 pantallas.' },
  { titulo: '5. Arreglar el check', detalle: 'Para que lo acordado no se vuelva a separar sin que nadie lo vea.' },
  { titulo: '6. Congelar y borrar', detalle: 'Marcos de prueba a Archivo y archivos sin uso fuera.' },
]

// Tabla «Quién usa qué»: cada fila es una forma de resolver la misma pieza; las columnas cuentan archivos por persona.
export const VOCABULARIO: { tema: string; variantes: { forma: string; clave: string }[] }[] = [
  {
    tema: 'Tarjeta o panel',
    variantes: [
      { forma: 'Card', clave: 'card' },
      { forma: 'Item', clave: 'item' },
      { forma: 'Frame', clave: 'frame' },
    ],
  },
  {
    tema: 'Lista de registros',
    variantes: [
      { forma: 'Table', clave: 'table' },
      { forma: 'DataGridList', clave: 'datagrid' },
    ],
  },
  {
    tema: 'Ventana o panel',
    variantes: [
      { forma: 'Dialog', clave: 'dialog' },
      { forma: 'DrawerShell', clave: 'sheet' },
    ],
  },
  {
    tema: 'Confirmación',
    variantes: [
      { forma: 'ActionDialog', clave: 'action-dialog' },
      { forma: 'AlertDialog suelto', clave: 'alert-dialog' },
    ],
  },
  {
    tema: 'Botón de solo icono',
    variantes: [
      { forma: 'BotonIcono', clave: 'boton-icono' },
      { forma: 'Button size="icon"', clave: 'boton-icono-mano' },
    ],
  },
  {
    tema: 'Marca de IA',
    variantes: [
      { forma: 'Orbe (IconoIA o botón de IA)', clave: 'icono-ia' },
      { forma: 'Estrellas o varita', clave: 'ia-estrellas' },
    ],
  },
  {
    tema: 'Campo de formulario',
    variantes: [
      { forma: 'Field', clave: 'field' },
      { forma: 'Label suelto', clave: 'label' },
    ],
  },
  {
    tema: 'Estilo del componente',
    variantes: [
      { forma: 'Clases con «!»', clave: 'forzado' },
      { forma: 'Texto sin Heading ni Text', clave: 'texto-crudo' },
    ],
  },
  {
    tema: 'Añadir',
    variantes: [
      { forma: 'PlusSign', clave: 'icono:PlusSignIcon' },
      { forma: 'Add01', clave: 'icono:Add01Icon' },
    ],
  },
  {
    tema: 'Listo',
    variantes: [
      { forma: 'Tick02', clave: 'icono:Tick02Icon' },
      { forma: 'CheckmarkCircle02', clave: 'icono:CheckmarkCircle02Icon' },
    ],
  },
  {
    tema: 'Editar',
    variantes: [
      { forma: 'Edit02', clave: 'icono:Edit02Icon' },
      { forma: 'PencilEdit02', clave: 'icono:PencilEdit02Icon' },
    ],
  },
  {
    tema: 'Más opciones',
    variantes: [
      { forma: 'MoreHorizontal', clave: 'icono:MoreHorizontalIcon' },
      { forma: 'MoreVertical', clave: 'icono:MoreVerticalIcon' },
    ],
  },
]

export const FUNDAMENTOS: Hallazgo[] = [
  {
    id: 'estado',
    titulo: 'Éxito y aviso siguen sin definir',
    estado: 'arreglar',
    resumen: 'Información ya está en el tema; éxito y aviso no, pero las pantallas los usan.',
    hoy: [
      { forma: '--info en el tema', cifra: 'Definido', detalle: 'claro y oscuro, desde el 17-sep' },
      { forma: '--success y --warning en el tema', cifra: '0', detalle: 'ni en claro ni en oscuro' },
      { forma: 'bg-success, text-warning… en pantallas', clave: 'color-estado' },
    ],
    propuesta: 'Definirlos en el tema, en claro y oscuro, como se hizo con --info. Hoy funcionan de prestado de la hoja de la librería y se caen si cambia.',
    donde: ['src/index.css'],
  },
  {
    id: 'grafica',
    titulo: 'Cinco colores de gráfica, un solo azul',
    estado: 'arreglar',
    resumen: 'Los cinco colores de gráfica siguen siendo tonos del mismo azul.',
    hoy: [{ forma: '--chart-1 a --chart-5', cifra: '1 tono', detalle: 'todos en el mismo matiz' }],
    propuesta: 'Cinco matices distinguibles, validados en claro y oscuro. Cualquier gráfica de más de dos series hoy es ilegible.',
    donde: ['src/index.css'],
  },
  {
    id: 'font-inherit',
    titulo: 'Botones e inputs heredan la letra de la página',
    estado: 'arreglar',
    resumen: 'Una regla global pisa familia, tamaño, peso e interlineado de todo botón e input de la librería.',
    hoy: [{ forma: 'button, input, textarea, select { font: inherit }', cifra: '1 regla', detalle: 'afecta a todo' }],
    propuesta: 'Quitarla. Es el ajuste global que más cambia cómo se ven los componentes.',
    donde: ['src/shared/styles/global.css'],
  },
  {
    id: 'foco',
    titulo: 'Anillo de foco para todo',
    estado: 'arreglar',
    resumen: 'Un selector universal pone borde y anillo de foco a todos los elementos, también a los de la librería.',
    hoy: [{ forma: '* { border-border outline-ring/50 }', cifra: '1 regla' }],
    propuesta: 'Quitarla o acotarla. Las reglas del repo prohíben tocar el foco de forma global.',
    donde: ['src/index.css'],
  },
  {
    id: 'temas',
    titulo: 'Tres temas importados a la vez',
    estado: 'decidir',
    resumen: 'El tema de flux-ui, el estilo Vega y el de shadcn se cargan juntos. Gana el último.',
    hoy: [
      { forma: '@ubits/flux-ui/styles', cifra: '1' },
      { forma: 'style-vega.css', cifra: '1' },
      { forma: 'shadcn/tailwind.css', cifra: '1', detalle: 'ninguna pantalla importa shadcn' },
    ],
    propuesta: 'Dejar uno y documentar cuál manda.',
    donde: ['src/index.css', 'package.json'],
  },
  {
    id: 'important',
    titulo: 'Diez «!important» en hojas de estilo',
    estado: 'decidir',
    resumen: 'Eran siete. Tres pisan fondo y color de filas del menú, tres el botón de IA y cuatro son de vistas previas del design system.',
    hoy: [
      { forma: 'En global.css (filas)', cifra: '3', detalle: 'comentados como pedido de diseño' },
      { forma: 'En ai-button.css', cifra: '3', detalle: 'nuevo desde el 17-sep' },
      { forma: 'En páginas del design system', cifra: '4' },
    ],
    propuesta: 'Los de filas y del botón de IA pasan a Ajustes propios si se quedan; los de vistas previas no afectan a producto.',
    donde: ['src/shared/styles/global.css', 'src/shared/components/ai-button.css'],
  },
]

export const COMPONENTES: Hallazgo[] = [
  {
    id: 'ia',
    titulo: 'IA marcada con estrellas',
    estado: 'arreglar',
    resumen:
      'Desde el 23-sep lo que hace la IA lleva el orbe; las estrellas se descartaron. Siguen en chat, composer, copiloto, templates de Orbit y avisos de novedades.',
    hoy: [
      { forma: 'Orbe: IconoIA o botón de IA', clave: 'icono-ia' },
      { forma: 'Sparkles, AiMagic o MagicWand', clave: 'ia-estrellas', detalle: 'incluye dos páginas que las enseñan como lo que no se usa' },
      { forma: 'Insignia EtiquetaIA', clave: 'etiqueta-ia' },
    ],
    propuesta: 'Cambiar cada estrella por IconoIA, o por el botón de IA que ya trae el orbe. Solo las páginas de Iconos y de IA pueden mostrarlas, como ejemplo de lo que no.',
  },
  {
    id: 'tarjeta',
    titulo: 'La misma tarjeta, tres componentes',
    estado: 'decidir',
    resumen: 'Card, Item y Frame pintan un bloque con borde. Frame lo usa casi solo Cristian; Nicolás y David arman sus paneles con Card e Item.',
    hoy: [
      { forma: 'Card', clave: 'card' },
      { forma: 'Item', clave: 'item' },
      { forma: 'Frame', clave: 'frame' },
    ],
    propuesta: 'Frame = panel de página. Card = tarjeta suelta en una rejilla. Item = fila de una lista.',
  },
  {
    id: 'listas',
    titulo: 'Listas de registros: dos tablas',
    estado: 'decidir',
    resumen: 'DataGridList solo aparece en pantallas de Cristian. Nicolás, David y Elkin arman todas sus listas con Table.',
    hoy: [
      { forma: 'Table', clave: 'table' },
      { forma: 'DataGridList', clave: 'datagrid' },
    ],
    propuesta: 'DataGridList si la lista tiene filtros, orden, selección o acciones por fila. Table solo para tablas estáticas dentro de una ficha.',
  },
  {
    id: 'confirmacion',
    titulo: 'Confirmaciones: pieza del proyecto o AlertDialog suelto',
    estado: 'arreglar',
    resumen: 'El proyecto tiene ActionDialog para confirmar; Nicolás lo usa, pero en 12 pantallas se arma de nuevo con AlertDialog.',
    hoy: [
      { forma: 'ActionDialog', clave: 'action-dialog' },
      { forma: 'AlertDialog armado en la pantalla', clave: 'alert-dialog' },
    ],
    propuesta: 'Toda confirmación con ActionDialog. Si se queda corto, se amplía; no se arma otro al lado.',
  },
  {
    id: 'formularios',
    titulo: 'Crear y editar: ventana o panel lateral',
    estado: 'decidir',
    resumen: 'El panel lateral ya es uno solo (DrawerShell). Queda decidir cuándo va ventana: David y Elkin abren sus formularios en Dialog.',
    hoy: [
      { forma: 'Dialog', clave: 'dialog' },
      { forma: 'Drawer flotante (DrawerShell)', clave: 'sheet', detalle: 'el único panel lateral desde el 18-sep' },
    ],
    propuesta: 'DrawerShell para crear, editar y ver detalle. Dialog para decisiones cortas. ActionDialog para confirmar.',
  },
  {
    id: 'boton-icono',
    titulo: 'Botón de solo icono, de dos formas',
    estado: 'arreglar',
    resumen: 'El terciario de solo icono es BotonIcono (redondo), pero en 21 pantallas sigue siendo un Button con size="icon".',
    hoy: [
      { forma: 'BotonIcono', clave: 'boton-icono' },
      { forma: 'Button size="icon"', clave: 'boton-icono-mano' },
    ],
    propuesta: 'BotonIcono siempre que el botón sea solo un icono.',
  },
  {
    id: 'forzados',
    titulo: 'Estilos forzados con «!»',
    estado: 'decidir',
    resumen:
      'Clases con «!» que pisan el estilo del componente. La mayoría son ajustes de Nicolás al marco, que se conservan; el resto aparecieron en pantallas de los cuatro.',
    hoy: [{ forma: 'Archivos con clases «!»', clave: 'forzado' }],
    propuesta: 'Cada ajuste que se quede va a Design system › Marco › Ajustes propios; lo que se repite se pide a la librería como variante.',
  },
  {
    id: 'texto',
    titulo: 'Texto escrito sin Heading ni Text',
    estado: 'arreglar',
    resumen: 'Títulos y párrafos en HTML con tamaño a mano. Casi todo en el design system y el marco.',
    hoy: [{ forma: 'h1–h4 o p con clase', clave: 'texto-crudo' }],
    propuesta: 'Siempre Heading y Text del tema.',
  },
  {
    id: 'controles',
    titulo: 'Controles HTML sueltos',
    estado: 'arreglar',
    resumen: 'button, input, select o table escritos en HTML. Algunos son la entrada de archivo oculta, que es válida; el resto tiene pieza en la librería.',
    hoy: [{ forma: 'button · input · select · textarea · table', clave: 'control-crudo' }],
    propuesta: 'Revisar uno por uno: Button, Input, Select, Textarea y Table. La entrada de archivo oculta se queda.',
  },
  {
    id: 'campos',
    titulo: 'Campos con y sin Field',
    estado: 'decidir',
    resumen: 'Unos formularios agrupan etiqueta, campo y ayuda con Field; otros ponen Label suelto.',
    hoy: [
      { forma: 'Field', clave: 'field' },
      { forma: 'Label suelto', clave: 'label' },
    ],
    propuesta: 'Siempre Field.',
  },
  {
    id: 'selectores',
    titulo: 'Select o Combobox',
    estado: 'decidir',
    resumen: 'No hay regla para cuándo el selector permite buscar.',
    hoy: [
      { forma: 'Select', clave: 'select' },
      { forma: 'Combobox', clave: 'combobox' },
    ],
    propuesta: 'Combobox a partir de ~8 opciones; Select por debajo.',
  },
  {
    id: 'a-mano',
    titulo: 'Piezas dibujadas a mano',
    estado: 'limpiar',
    resumen: 'Los mismos cuatro sitios del 17-sep; tres están en marcos de Archivo.',
    hoy: [
      { forma: 'Botón crudo', detalle: 'selector de empresa (app-shell-2)', clave: 'a-mano-boton' },
      { forma: 'Barra de progreso', detalle: 'tarjeta de consumo (app-shell-3)', clave: 'a-mano-progreso' },
      { forma: 'Avatar', detalle: 'tarjeta promo y barra lateral', clave: 'a-mano-avatar' },
    ],
    propuesta: 'SidebarMenuButton, Progress y Avatar.',
  },
]

export type ConceptoIcono = { concepto: string; iconos: { nombre: string }[] }

// Los conceptos donde se ve la mezcla: empates entre vocabularios. Con David y Elkin se suman Editar y Más opciones.
export const CONCEPTOS: ConceptoIcono[] = [
  { concepto: 'Añadir', iconos: [{ nombre: 'PlusSignIcon' }, { nombre: 'Add01Icon' }] },
  {
    concepto: 'Listo / éxito',
    iconos: [
      { nombre: 'Tick02Icon' },
      { nombre: 'CheckmarkCircle02Icon' },
      { nombre: 'TaskDone01Icon' },
      { nombre: 'CheckmarkBadge01Icon' },
    ],
  },
  {
    concepto: 'Personas',
    iconos: [{ nombre: 'UserGroupIcon' }, { nombre: 'UserMultiple02Icon' }, { nombre: 'UserMultipleIcon' }],
  },
  {
    concepto: 'Editar',
    iconos: [{ nombre: 'Edit02Icon' }, { nombre: 'PencilEdit02Icon' }, { nombre: 'PencilEdit01Icon' }],
  },
  { concepto: 'Más opciones', iconos: [{ nombre: 'MoreHorizontalIcon' }, { nombre: 'MoreVerticalIcon' }] },
  {
    concepto: 'Alerta / información',
    iconos: [
      { nombre: 'Alert02Icon' },
      { nombre: 'InformationCircleIcon' },
      { nombre: 'AlertCircleIcon' },
      { nombre: 'Alert01Icon' },
    ],
  },
  {
    concepto: 'Formación',
    iconos: [{ nombre: 'Mortarboard01Icon' }, { nombre: 'MortarboardIcon' }, { nombre: 'Mortarboard02Icon' }],
  },
  {
    concepto: 'IA (ninguno: va el orbe)',
    iconos: [{ nombre: 'SparklesIcon' }, { nombre: 'AiMagicIcon' }, { nombre: 'MagicWand01Icon' }],
  },
  { concepto: 'Tablero', iconos: [{ nombre: 'DashboardSquare02Icon' }, { nombre: 'DashboardSquare01Icon' }] },
]

// Usos de size={N} en HugeiconsIcon, en todo src/ (28-sep).
export const TAMANOS: { medida: string; usos: number }[] = [
  { medida: '16', usos: 391 },
  { medida: '18', usos: 92 },
  { medida: '14', usos: 91 },
  { medida: '20', usos: 36 },
  { medida: '12', usos: 27 },
  { medida: '15', usos: 24 },
  { medida: '17', usos: 10 },
  { medida: '13', usos: 7 },
  { medida: '24', usos: 6 },
  { medida: '9, 10, 11, 22, 28, 32, 40', usos: 13 },
]

export const ICONOS: Hallazgo[] = [
  {
    id: 'vocabulario',
    titulo: 'El mismo concepto, varios iconos',
    estado: 'decidir',
    resumen:
      'Los empates del 17-sep siguen, y con David y Elkin se suman dos: Editar (Edit02 o PencilEdit02) y Más opciones (David usa el vertical, el resto el horizontal).',
    hoy: [
      { forma: 'Conceptos de la tabla con 2 o más iconos', cifra: '9 de 9' },
      { forma: 'Conceptos con un solo icono', cifra: 'borrar, buscar, cerrar, calendario, flecha' },
    ],
    propuesta: 'Una tabla concepto → icono en la página de Iconos, y que el check la haga cumplir.',
  },
  {
    id: 'tamanos',
    titulo: 'Quince tamaños de icono',
    estado: 'decidir',
    resumen: 'Eran doce. Y 16 px se sigue escribiendo de dos formas: size={16} y la clase size-4.',
    hoy: [
      { forma: 'Tamaño fijado con size', clave: 'icono-size' },
      { forma: 'Tamaño fijado con la clase size-N', clave: 'icono-size-clase' },
      { forma: 'Fuera de 14, 16 y 20', clave: 'icono-fuera-escala' },
    ],
    propuesta: 'Por defecto, heredar. Si hace falta fijarlo: 14, 16 o 20, siempre con size.',
  },
  {
    id: 'trazo',
    titulo: 'Dos grosores de trazo',
    estado: 'decidir',
    resumen: 'Los pasos del stepper y algunos iconos de estado engrosan el trazo; el resto usa el de la librería.',
    hoy: [
      { forma: 'Trazo por defecto', cifra: '~1.500' },
      { forma: 'Trazo fijado a mano', clave: 'icono-trazo' },
    ],
    propuesta: 'Trazo de la librería siempre, o documentar el del stepper en Ajustes propios.',
  },
]

export const MARCOS: Hallazgo[] = [
  {
    id: 'marcos',
    titulo: 'Un marco en el producto, varios en los templates',
    estado: 'limpiar',
    resumen:
      'Las pantallas del producto ya comparten RootLayout + PageShell. Los templates del design system siguen con tres familias y tres marcos de prueba.',
    hoy: [
      { forma: 'RootLayout + PageShell', detalle: 'todas las pantallas del producto', clave: 'marco-producto' },
      { forma: 'MarcoPlantilla · MarcoAdmin', detalle: 'templates de admin y colaborador', clave: 'marco-vivo' },
      { forma: 'ShellUbits', detalle: 'documentación, dashboard y Orbit', clave: 'marco-shellubits' },
      { forma: 'suite-ai/marco', detalle: 'propio del concepto congelado (el de home-operativo se borró el 29-sep)', clave: 'marco-propio' },
      { forma: 'app-shell-2 · app-shell-3 · shell-test', detalle: 'en Archivo', clave: 'marco-archivo' },
    ],
    propuesta: 'Que los templates usen el mismo marco que el producto. Los tres de prueba se congelan en Archivo y dejan de recibir cambios.',
  },
  {
    id: 'encabezado',
    titulo: 'Encabezados propios en los templates',
    estado: 'limpiar',
    resumen: 'En el producto ya hay uno solo (PageHeader). Los templates viejos conservan su encabezado escrito a mano.',
    hoy: [
      { forma: 'PageHeader del marco', cifra: '66 archivos', detalle: 'todas las pantallas del producto' },
      { forma: 'Encabezado propio de un template', clave: 'encabezados' },
    ],
    propuesta: 'Pasar los templates a PageHeader, título en nivel 2.',
  },
  {
    id: 'ancho',
    titulo: 'Anchos escritos a mano',
    estado: 'arreglar',
    resumen: 'El ancho lo pone PageShell (720, 1.140, 1.600 o completo), pero hay contenedores con max-w propio en pantallas de los cuatro.',
    hoy: [
      { forma: 'max-w de 2xl a 7xl o en píxeles', clave: 'ancho-mano' },
      { forma: 'Kanban a 1.400 px y anchos de lectura de 672 y 768 px', clave: 'ancho-fuera' },
    ],
    propuesta: 'Quitar los max-w de página y elegir el ancho de PageShell. Los de lectura dentro de una tarjeta, uno solo.',
  },
  {
    id: 'espacio',
    titulo: 'Escala de espacios inflada',
    estado: 'decidir',
    resumen: 'La escala principal convive con una paralela (1.5, 2.5, 5) que ya aparece en 67 pantallas.',
    hoy: [
      { forma: 'gap-1 · 2 · 3 · 4 · 6', clave: 'gap-escala' },
      { forma: 'gap-1.5 · 2.5 · 5', clave: 'gap-paralela' },
    ],
    propuesta: 'Seis pasos: 1 título y bajada · 2 icono y texto · 3 dentro de tarjeta · 4 rejilla · 6 bloques · 10 secciones. Cajas p-4 o p-6.',
  },
  {
    id: 'codigo',
    titulo: 'Cómo se organiza cada pantalla',
    estado: 'decidir',
    resumen: 'Ya no hay un lado y otro: los cuatro mezclan imports con alias y relativos, y el archivo de datos se llama de dos formas.',
    hoy: [
      { forma: 'Imports con alias @/ / relativos', cifra: '884 / 1.314' },
      { forma: 'Archivo de datos', cifra: 'data.ts 20 · datos.ts 16', detalle: 'Nicolás data.ts; David y Elkin datos.ts; Cristian los dos' },
      { forma: 'Crear', cifra: 'crear (4)', detalle: 'ya nadie usa nuevo' },
    ],
    propuesta: 'Documentar la carpeta components/ con datos.ts + estado.ts + piezas.tsx, nombres en español y slug «crear».',
  },
]

export const CHECK: Hallazgo[] = [
  {
    id: 'nuevo',
    titulo: 'Lo nuevo que tampoco ve',
    estado: 'arreglar',
    resumen: 'Las reglas que se sumaron después del 17-sep no están en el check: pasan en verde aunque se rompan.',
    hoy: [
      { forma: 'Estrellas de IA', clave: 'ia-estrellas' },
      { forma: 'Anchos a mano', clave: 'ancho-mano' },
      { forma: 'Button size="icon" en vez de BotonIcono', clave: 'boton-icono-mano' },
    ],
    propuesta: 'Sumar las tres al check, con el mismo mensaje que da el hook al escribir.',
    donde: ['scripts/check.mjs'],
  },
  {
    id: 'protegidos',
    titulo: 'La regla de archivos protegidos no funciona',
    estado: 'arreglar',
    resumen: 'Sigue buscando la rama main, pero aquí las principales son develop y staging. Sin punto de comparación solo mira cambios sin guardar.',
    hoy: [{ forma: 'Cambios de andamiaje ya guardados', cifra: 'pasan en verde' }],
    propuesta: 'Comparar contra develop.',
    donde: ['scripts/check.mjs'],
  },
  {
    id: 'colores',
    titulo: 'Colores: ve uno por archivo',
    estado: 'arreglar',
    resumen: 'Si un archivo tiene cinco colores a mano, el check reporta el primero, y no mira los CSS de las pantallas.',
    hoy: [{ forma: 'Hallazgos por archivo', cifra: '1' }],
    propuesta: 'Reportarlos todos, y mirar también los CSS de las pantallas.',
    donde: ['scripts/check.mjs'],
  },
  {
    id: 'iconos-check',
    titulo: 'No valida iconos',
    estado: 'arreglar',
    resumen: 'Las reglas dicen que sí, pero solo bloquea el paquete lucide-react.',
    hoy: [{ forma: 'SVG pegado o icono sin HugeiconsIcon', cifra: 'pasa' }],
    propuesta: 'Validar la forma de uso y, cuando exista, la tabla concepto → icono.',
    donde: ['scripts/check.mjs'],
  },
  {
    id: 'pantallas',
    titulo: 'No valida la receta de pantalla',
    estado: 'arreglar',
    resumen: 'Ni el nombre main.tsx, ni que exporte Component, ni el displayName, ni la ruta registrada. Y nombra carpetas que ya no existen.',
    hoy: [
      { forma: 'Pasos 1 a 3 de la receta', cifra: 'sin revisar' },
      { forma: 'Carpetas que nombra y no existen', cifra: '2', detalle: 'archive y talent' },
    ],
    propuesta: 'Sumarlos al check y quitar las carpetas viejas.',
    donde: ['scripts/check.mjs'],
  },
  {
    id: 'muerto',
    titulo: 'Lo que se puede borrar',
    estado: 'limpiar',
    resumen: 'Lo mismo del 17-sep: nadie lo ha usado ni borrado.',
    hoy: [
      { forma: 'PageFallback.tsx y pages.module.css', cifra: '2 archivos' },
      { forma: 'hero.png e icons.svg', cifra: '2 imágenes' },
      { forma: 'Dependencias sin uso directo', cifra: '3', detalle: 'cva y cn; @base-ui/react ya la trae flux-ui' },
    ],
    propuesta: 'Borrar y cerrar con npm run build.',
  },
]

// Auditoría del 29-sep (prompt ai-tools/prompts/revisar-design-system.md, sobre lo de Cristian). Cristian arregló lo
// suyo; lo de otras personas no se toca y queda aquí, con autor y archivo:línea, para que cada quien lo decida.
// Los pedidos a ingeniería son cambios en zona protegida (src/shared, src/index.css) que solo se proponen.
export const PENDIENTES: Hallazgo[] = [
  {
    id: 'vacantes-ingles',
    titulo: 'El listado de Vacantes sigue con la paginación en inglés',
    estado: 'arreglar',
    resumen: 'La lista principal de Selección dice «Rows per page» al pie. Acuerdo del 28-sep: todas las tablas son la del design system, con la paginación en español.',
    hoy: [
      { forma: 'DataGridList con paginación', detalle: 'admin/seleccion/vacantes/main.tsx:441, 555', cifra: 'Elkin' },
      { forma: 'VacantesView, sin uso: también en inglés y crea la vacante en una ventana', detalle: 'admin/seleccion/vacantes/components/vacantes-view.tsx:248, 325', cifra: 'Elkin y Nicolás' },
    ],
    propuesta: 'TablaDatos o MarcoTabla (el equipo está eligiendo). Si VacantesView sigue sin uso, borrarla.',
    donde: ['/admin/seleccion/vacantes'],
  },
  {
    id: 'vacantes-piezas',
    titulo: 'Vacantes: confirmación, avisos, ventana y botón de IA',
    estado: 'arreglar',
    resumen: 'Llegaron con la fusión de Elkin (29-sep). Cada uno tiene ya su pieza del proyecto.',
    hoy: [
      { forma: '«Eliminar vacante» con una alerta suelta', detalle: 'admin/seleccion/vacantes/main.tsx:575-605', cifra: 'Elkin' },
      { forma: 'Avisos lanzados sin notify', detalle: 'admin/seleccion/vacantes/main.tsx:265, 307-310, 320', cifra: 'Elkin' },
      { forma: '«Crear con IA» atenuado con «!»', detalle: 'vacantes/crear/components/paso-informacion.tsx:79, 91', cifra: 'Elkin' },
    ],
    propuesta: 'DialogoConfirmar con el campo como contenido; notify (o toast.add si lleva tipo); el botón de IA sin forzar o documentado.',
    donde: ['/admin/seleccion/vacantes', '/admin/seleccion/vacantes/crear'],
  },
  {
    id: 'tablas-como-reui',
    titulo: 'Tablas con borde doble y huecos',
    estado: 'arreglar',
    resumen: 'Dentro del marco, DataGridList pone otra caja con borde (trazo grueso), deja una franja vacía sobre la tabla y un hueco después de los «⋯». Desde el 29-sep TablaDatos lo corrige por defecto; las que usan DataGridList directo tienen que pedirlo.',
    hoy: [
      { forma: 'Encuestas: lista y resultados', detalle: 'admin/desempeno-cultura/encuestas/components/tabla-encuestas.tsx', cifra: 'Elkin' },
      { forma: 'Vacantes (y VacantesView, sin uso)', detalle: 'admin/seleccion/vacantes/main.tsx · components/vacantes-view.tsx', cifra: 'Elkin y Nicolás' },
      { forma: 'El ejemplo con Frame del Storybook tiene lo mismo', detalle: 'Data/DataGridList › «Frame con Header, Búsqueda y Acciones»', cifra: 'Librería' },
    ],
    propuesta: 'Usar TablaDatos, o pasarle a DataGridList cardVariant: "borderless" y layout { dense: true, resizable: false, reorderable: false }. Pedido a la librería: que el modo con marco venga así y que deje fijar la columna de acciones a la derecha.',
    donde: ['/admin/desempeno-cultura/encuestas', '/admin/seleccion/vacantes', '/design-system/data-grid'],
  },
  {
    id: 'metricas-repetidas',
    titulo: 'Cifras y gráficos: dos juegos',
    estado: 'decidir',
    resumen: 'Cristian mudó sus cifras y gráficos a Design system › Métricas y los documentó (29-sep). La fusión de Elkin trajo el mismo día otra fila de cifras y otra Tendencia para Encuestas.',
    hoy: [
      { forma: 'FilaCifras, Indicadores y gráficos de Métricas', detalle: 'design-system/metricas/ · documentados en /design-system/metricas', cifra: 'Cristian' },
      { forma: 'FilaIndicadores', detalle: 'design-system/graficos/fila-indicadores.tsx', cifra: 'Elkin' },
      { forma: 'Tendencia (con ChartContainer)', detalle: 'design-system/graficos/piezas.tsx:69', cifra: 'Elkin' },
    ],
    propuesta: 'Una pieza por cosa. Decisión de Cristian: se quedan las de Métricas. Falta que Elkin decida si Encuestas pasa a ellas o si se juntan en una sola.',
    donde: ['/design-system/metricas', '/admin/desempeno-cultura/encuestas'],
  },
  {
    id: 'comparar-finalistas',
    titulo: 'Comparar finalistas: dos tablas',
    estado: 'decidir',
    resumen: 'La tabla de comparar finalistas del agente de la vacante está hecha aparte de ComparisonTable (Orbit Flow › Comparar), que solo lee sus datos de ejemplo.',
    hoy: [
      { forma: 'Tabla propia en el panel del agente', detalle: 'vacantes/detalle/components/agente-vacante.tsx:387-445', cifra: 'Cristian' },
      { forma: 'ComparisonTable', detalle: 'agente-contextual/comparar/components/comparison-table.tsx', cifra: 'Nicolás' },
    ],
    propuesta: 'Nicolás abre ComparisonTable para que reciba criterios y candidatos; después la vacante la usa y se borra la suya.',
    donde: ['/admin/seleccion/vacantes/analista-de-datos'],
  },
  {
    id: 'preguntar-al-agente',
    titulo: 'Piezas de IA: «Preguntar al agente» armado a mano',
    estado: 'decidir',
    resumen: 'El terciario de IA y el de solo icono se llaman «Preguntar al agente» y están armados con un botón y el orbe. Desde el 28-sep, todo botón que abre el agente dice «Orbit Flow» y es ReopenAgentButton.',
    hoy: [
      { forma: 'Botón gris y botón de solo icono con el orbe dentro', detalle: 'design-system/ia/main.tsx:98, 107 (el orbe) · 97, 99, 106 (texto, de Cristian)', cifra: 'Nicolás y Cristian' },
      { forma: '«Por resolver» de Botones cita el mismo nombre', detalle: 'design-system/botones/main.tsx:87', cifra: 'Cristian' },
    ],
    propuesta: 'Si abren el agente: ReopenAgentButton (compacto para el de solo icono). Si son una acción puntual, que digan lo que hacen. Se cambia junto con Nicolás porque el orbe es suyo.',
    donde: ['/design-system/ia/botones', '/design-system/botones'],
  },
  {
    id: 'grises-forzados',
    titulo: 'Terciarios en gris forzado',
    estado: 'decidir',
    resumen: 'Botones terciarios y flechas de volver pintados de gris desde afuera. El gris es una decisión de Nicolás (sus estilos se conservan) que no está documentada.',
    hoy: [
      { forma: 'Vista previa del header («‹ Volver»)', detalle: 'header/components/header-preview.tsx:400', cifra: 'Nicolás' },
      { forma: 'Franja de los casos de navegación', detalle: 'navegacion/components/case-frame.tsx:39', cifra: 'Nicolás' },
      { forma: 'Configurador de navegación (volver y lápiz)', detalle: 'navegacion/components/nav-parts.tsx:163 · page-preview.tsx:131', cifra: 'Nicolás' },
      { forma: 'Documento y tablero', detalle: 'navegacion/documento/main.tsx:125 · navegacion/tablero/main.tsx:122, 165, 190', cifra: 'Nicolás' },
    ],
    propuesta: 'Documentar el terciario gris en Marco › Ajustes propios (y pedirlo como variante de BotonIcono) o quitar el forzado. La flecha «Volver» del marco está en la lista de ingeniería.',
    donde: ['/design-system/header', '/design-system/navegacion'],
  },
  {
    id: 'estrellas-otros',
    titulo: 'IA marcada con varitas y chispas',
    estado: 'arreglar',
    resumen: 'Regla del 23-sep: lo que es de IA lleva el orbe.',
    hoy: [
      { forma: 'Orbit: franja «Nuevo» y sugerencias del chat', detalle: 'admin/suite-ai/shared/composer.tsx:244 · suite-ai/chat/components/agent-message.tsx:451', cifra: 'Nicolás' },
      { forma: '«Mejorar» sobre el párrafo', detalle: 'agente-contextual/reescribir-seleccion/components/rewrite-toolbar.tsx:48', cifra: 'Nicolás' },
      { forma: 'Casos de IA de los configuradores', detalle: 'drawer-config.ts:191 · header-config.ts:111 · page-config.ts:493', cifra: 'Nicolás' },
      { forma: 'Tarjeta de promoción de App shell 2 (Archivo)', detalle: 'templates/app-shell-2/components/promo-card.tsx:29-38', cifra: 'Cuenta compartida' },
    ],
    propuesta: 'IconoIA, o el botón de IA que ya trae el orbe. La barra lateral del design system también tiene varitas, pero es del marco: está en la lista de ingeniería.',
  },
  {
    id: 'lms-editor',
    titulo: 'Editor de LMS: cabecera con estilos forzados',
    estado: 'arreglar',
    resumen: 'La cabecera a todo el ancho es regla vigente (18-sep), pero sus migas, título y pestañas llevan letra y «!» puestos a mano.',
    hoy: [
      { forma: 'Botones con alto, relleno y peso forzados (WS_BUTTON, DASHED)', detalle: 'lms-creator/components/editor-view.tsx:62-63', cifra: 'Nicolás' },
      { forma: 'Migas, ancho y pestañas a mano', detalle: 'lms-creator/components/editor-view.tsx:165-210, 240', cifra: 'Nicolás' },
      { forma: 'Título del panel del agente con letra a mano', detalle: 'lms-creator/components/agent-panel.tsx:83', cifra: 'Nicolás' },
    ],
    propuesta: 'Heading y Text del tema, sin «!»; se conserva la cabecera de borde a borde.',
    donde: ['/admin/aprendizaje/lms-creator/contenidos'],
  },
  {
    id: 'orden-navegacion',
    titulo: 'El «⋯» antes del primario en Navegación',
    estado: 'arreglar',
    resumen: 'Orden vigente: terciario · secundario · primario · «⋯» · IA. Tres casos ponen el «⋯» primero y la explicación del configurador lo dice al revés.',
    hoy: [
      { forma: 'Casos Básica, Detalle y vista previa', detalle: 'navegacion/basica/main.tsx:90-108 · detalle/main.tsx:104-125 · components/page-preview.tsx:147-169', cifra: 'Nicolás' },
      { forma: 'Texto del configurador', detalle: 'navegacion/components/page-config.ts:595, 625-630', cifra: 'Nicolás' },
    ],
    propuesta: 'Mover el «⋯» después del primario y corregir el texto.',
    donde: ['/design-system/navegacion'],
  },
  {
    id: 'letra-configuradores',
    titulo: 'Letra a mano en configuradores y drawers',
    estado: 'arreglar',
    resumen: 'Notas, tarjetas de guía y títulos con tamaños escritos a mano en vez de Text y Heading.',
    hoy: [
      { forma: 'Notas grises de los paneles de control (NOTE)', detalle: 'configuradores de Orbit Flow, header, barra lateral, drawers, modales y navegación', cifra: 'Nicolás' },
      { forma: 'Tarjetas de guía pintadas con div', detalle: 'agente-contextual, header, barra-lateral, drawers y modales (main.tsx)', cifra: 'Nicolás' },
      { forma: 'Título de todos los drawers y franja del drawer del agente', detalle: 'drawers/components/drawer-shell.tsx:136 · agent-drawer.tsx:51-53', cifra: 'Nicolás' },
      { forma: 'Kit de anatomía y capa de «Probar en pantalla»', detalle: 'components/anatomy/anatomy-kit.tsx (letra, una etiqueta con span y «!»)', cifra: 'Nicolás' },
      { forma: 'Cifras del tablero y barra «Leído»', detalle: 'navegacion/tablero/main.tsx:141-143 · navegacion/documento/main.tsx:116-120', cifra: 'Nicolás' },
    ],
    propuesta: 'Text y Heading del tema; Card o Item para las tarjetas de guía; la capa de «Probar en pantalla», documentada en Ajustes propios; las cifras, con la fila de Métricas.',
  },
  {
    id: 'riel-agente',
    titulo: 'El riel minimizado del agente sigue en uso',
    estado: 'decidir',
    resumen: 'El kit dice que ningún panel se minimiza desde el 22-sep, pero el detalle de la vacante lo usa. Su botón se anuncia como «Abrir Orbit Flow».',
    hoy: [
      { forma: 'Riel con botón de orbe y rótulo de 13 px', detalle: 'agente-contextual/components/agent-kit.tsx:74-94', cifra: 'Nicolás' },
      { forma: 'Lo usa el detalle de la vacante', detalle: 'vacantes/detalle/components/vacante-view.tsx:443', cifra: 'Cristian' },
    ],
    propuesta: 'Retirar el riel y dejar ReopenAgentButton al final de la fila, o documentarlo como estado «minimizado» con el nombre «Orbit Flow».',
    donde: ['/admin/seleccion/vacantes/analista-de-datos'],
  },
  {
    id: 'avisos-internos-david',
    titulo: 'Avisos internos: crear en una ventana y filtros aparte',
    estado: 'arreglar',
    resumen: 'Acuerdo del 28-sep: crear es una página y los filtros van en cada columna de la tabla.',
    hoy: [
      { forma: '«Crear publicación» y «Editar» en una ventana', detalle: 'admin/avisos-internos/main.tsx:202, 328, 383-389', cifra: 'David' },
      { forma: 'Filtros en una ventana aparte', detalle: 'admin/avisos-internos/main.tsx:193-194, 314-327, 371-381', cifra: 'David' },
      { forma: 'Dos avisos sin notify', detalle: 'admin/avisos-internos/main.tsx:255-259, 266', cifra: 'David' },
    ],
    propuesta: 'Crear y editar como página con el mismo patrón; filtros por columna en la tabla del design system.',
    donde: ['/admin/avisos-internos'],
  },
  {
    id: 'ajustes-david',
    titulo: 'Ajustes propios: dos fichas que se contradicen',
    estado: 'decidir',
    resumen: 'Una ficha dice que confirmar una acción va con notify y la de «Color de los avisos» documenta toast.add con tipo (excepción del 29-sep).',
    hoy: [
      { forma: 'Ficha que dice «aviso con notify»', detalle: 'design-system/ajustes/main.tsx:658', cifra: 'David' },
      { forma: 'Lado librería de «Tarjeta de contenido» con «!»', detalle: 'design-system/ajustes/demos.tsx:527, 533', cifra: 'David' },
    ],
    propuesta: 'Alinear la ficha con la excepción de los avisos con tipo.',
    donde: ['/design-system/marco/ajustes'],
  },
  {
    id: 'propuestas-nicolas',
    titulo: 'Selección › propuestas: letra a mano y enlace forzado',
    estado: 'arreglar',
    resumen: 'Textos en span con tamaño y color a mano, y un enlace con «!».',
    hoy: [
      { forma: 'Enlace con h-auto! p-0!', detalle: 'seleccion/propuestas/components/base-candidatos.tsx:317', cifra: 'Nicolás' },
      { forma: 'span con letra a mano', detalle: 'propuestas/components/editar-vacante.tsx:875, 935 · propuestas/tablero/main.tsx:209-213', cifra: 'Nicolás' },
    ],
    propuesta: 'Text del tema y Button variant="link" sin forzar.',
  },
  {
    id: 'cuenta-compartida',
    titulo: 'Shell test, App shell 2 e inicio de sesión: estilos forzados',
    estado: 'arreglar',
    resumen: 'Vienen del PR #2 del 8-sep, firmado con la cuenta compartida: no se sabe quién lo hizo. Shell test y App shell 2 son del Archivo.',
    hoy: [
      { forma: 'Shell test: ayudas con el globo suelto, opacidades cambiadas, «Novedades» gris, avatar y marca forzados', detalle: 'templates/shell-test/components/app-header.tsx:28-76 · sidebar-brand.tsx:36-49', cifra: 'Cuenta compartida' },
      { forma: 'Inicio de sesión: saludo con letra a mano y botones con color cambiado', detalle: 'templates/auth/components/sign-in-panel.tsx:45, 87, 105', cifra: 'Cuenta compartida' },
      { forma: 'App shell 2: la «x» de la tarjeta de promoción no es CloseButton', detalle: 'templates/app-shell-2/components/promo-card.tsx:22-27 (Cristian solo tiene la 21 y la 28)', cifra: 'Cuenta compartida' },
      { forma: 'App shell 3: título «Licencias», su frase y el contenedor del nombre con letra a mano', detalle: 'templates/app-shell-3/components/usage-card.tsx:12-15 · app-sidebar.tsx:71', cifra: 'Nicolás' },
    ],
    propuesta: 'Hint, NovedadesButton, Avatar tal cual, Heading y Text. En el Archivo puede quedarse si se congela.',
    donde: ['/design-system/templates/auth', '/design-system/templates/shell-test'],
  },
  {
    id: 'inicio-sin-uso',
    titulo: 'Inicio: dos archivos sin uso',
    estado: 'limpiar',
    resumen: 'Ninguna pantalla los importa desde que el Inicio usa bloques.tsx; traen letra a mano.',
    hoy: [{ forma: 'charts.tsx y kpi-strip.tsx', detalle: 'admin/inicio/components/', cifra: 'Nicolás' }],
    propuesta: 'Borrarlos.',
  },
  {
    id: 'concepto-congelado',
    titulo: 'Orbit (concepto) y Home Orbit: copia congelada',
    estado: 'limpiar',
    resumen: 'Decisión de Cristian (29-sep): se quedan como el Archivo, sin arreglar. La versión viva es /suite-ai. Lo que se encontró, por si vuelven a usarse:',
    hoy: [
      { forma: 'Ventanas sueltas (feedback, confirmaciones, listas) y un anuncio que copia FeatureDialog', detalle: 'templates/home-operativo/components/dialogo-feedback.tsx · templates/suite-ai/components/dialogos.tsx', cifra: 'Cristian' },
      { forma: 'Barra de arriba, menús y buscador ⌘K copiados', detalle: 'templates/suite-ai/components/marco.tsx · buscador.tsx', cifra: 'Cristian' },
      { forma: '«Crear vacante» en una ventana y lista armada a mano', detalle: 'templates/suite-ai/vacantes/main.tsx', cifra: 'Cristian' },
      { forma: 'Botones de IA fuera de orden o sin «Orbit Flow», cabeceras a mano, 44 avisos sin notify', detalle: 'templates/suite-ai/**', cifra: 'Cristian' },
    ],
    propuesta: 'No se arregla. Si el concepto vuelve a mantenerse, empezar por el marco (HeaderActions, AccountPopover, InviteCard y CommandPalette) y las ventanas.',
    donde: ['/design-system/templates/suite-ai', '/design-system/templates/home-suite-ai'],
  },
  {
    id: 'ingenieria',
    titulo: 'Pedidos a ingeniería (zona protegida)',
    estado: 'decidir',
    resumen: 'Arreglos que tocan src/shared: se proponen y los hace quien cuida el marco.',
    hoy: [
      { forma: 'notify no deja elegir el tipo ni el aviso «cargando… → listo»', detalle: 'src/shared/components/notify.ts · por eso 105 avisos van con toast.add', cifra: 'Ingeniería' },
      { forma: '«Nueva conversación» no es una pieza: el marco la arma en el sitio y se copia', detalle: 'src/shared/layouts/AppSidebar.tsx:383', cifra: 'Ingeniería' },
      { forma: 'Flecha «Volver» del marco en gris forzado, sin documentar', detalle: 'src/shared/components/PageShell.tsx:159', cifra: 'Ingeniería' },
      { forma: 'Tarjeta BOLD+ con la baldosa del logo a mano', detalle: 'src/shared/components/AccountPopover.tsx:171-174 (usar CompanyLogo)', cifra: 'Ingeniería' },
      { forma: '«Invita a tu equipo» es un div pintado como tarjeta', detalle: 'src/shared/components/InviteCard.tsx:85', cifra: 'Ingeniería' },
      { forma: 'La barra del design system solo acepta iconos de Hugeicons: varitas en «Trabajar con la IA», «Orbit Flow» y «Botones de IA»', detalle: 'src/shared/layouts/nav-config.ts:3, 36, 265, 436, 455 (hay que ampliar AppSidebar y SidebarRail para el orbe)', cifra: 'Ingeniería' },
      { forma: 'Historial de chats, «Nueva conversación» y «Buscar ⌘K» no están exportados', detalle: 'src/shared/layouts/AppSidebar.tsx · src/shared/components/AppHeader.tsx', cifra: 'Ingeniería' },
      { forma: 'La pestaña «Orbit» del menú debe decir «Orbit Flow» (28-sep)', detalle: 'marco general', cifra: 'Ingeniería' },
    ],
    propuesta: 'Cristian los propone; los aprueba y hace quien cuida src/shared. Cuando notify acepte el tipo, se pasan los avisos a notify.',
  },
]

export const POR_PESTANA: Record<Exclude<Pestana, 'resumen'>, Hallazgo[]> = {
  fundamentos: FUNDAMENTOS,
  componentes: COMPONENTES,
  iconos: ICONOS,
  marcos: MARCOS,
  check: CHECK,
  pendientes: PENDIENTES,
}
