#!/usr/bin/env node
// Genera ai-tools/flux-ui/catalogo.json cruzando dos fuentes:
//   1. la librería instalada (node_modules/@ubits/flux-ui): lo que de verdad se puede importar;
//   2. el índice del Storybook: dónde está la ficha de cada componente.
// Las piezas del proyecto y las reglas para la IA no se escriben aquí: salen de ai-tools/reglas/reglas.json, la fuente
// única (se edita ahí y se corre node ai-tools/reglas/generar-reglas.mjs, que llama a este script).
// Se regenera sola al abrir la sesión si cambió la versión instalada, reglas.json o este generador (hook SessionStart).
//
// Uso:
//   node ai-tools/flux-ui/generar-catalogo.mjs            # regenera siempre
//   node ai-tools/flux-ui/generar-catalogo.mjs --si-cambio # solo si cambió la versión, reglas.json o el generador

import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))
const RAIZ = resolve(AQUI, '../..')
const LIB = join(RAIZ, 'node_modules/@ubits/flux-ui')
const DIST = join(LIB, 'dist/components')
const SALIDA = join(AQUI, 'catalogo.json')
const SALIDA_PORTATIL = join(AQUI, 'flux-ui-para-ia.json')
const STORYBOOK = 'https://libraries-ui.dev.sandteck.com/flux-ui'

const RUTA_REGLAS = join(RAIZ, 'ai-tools/reglas/reglas.json')
const FUENTE = JSON.parse(readFileSync(RUTA_REGLAS, 'utf8'))

const soloSiCambio = process.argv.includes('--si-cambio')
const version = JSON.parse(readFileSync(join(LIB, 'package.json'), 'utf8')).version
const huellaReglas = createHash('sha1')
  .update(readFileSync(RUTA_REGLAS))
  .update(readFileSync(fileURLToPath(import.meta.url)))
  .digest('hex')

if (soloSiCambio && existsSync(SALIDA)) {
  try {
    const actual = JSON.parse(readFileSync(SALIDA, 'utf8'))
    if (actual.libreria?.version === version && actual.huellaReglas === huellaReglas) process.exit(0)
  } catch {}
}

// ── Descripciones en español y palabras para buscar. El manifest de la librería
//    solo trae "X component for Ubits…", que no ayuda a elegir; y el buscador del
//    MCP no entiende español ("tabla" no encuentra nada).
const GUIA = {
  accordion: ['Secciones que se abren y cierran una a una', 'acordeón, desplegable, faq, secciones'],
  'action-dropdown': ['Botón que abre una lista de acciones con icono; se alimenta con la prop data', 'acciones, botón con menú, más opciones'],
  'aspect-ratio': ['Mantiene una proporción fija (16:9, 1:1) para imágenes o videos', 'proporción, imagen, video, miniatura'],
  attachment: ['Archivo adjunto con estado de subida (idle, uploading, processing, error, done), miniatura y acciones', 'adjunto, archivo, subir, documento, carga de archivos'],
  bubble: ['Burbuja de mensaje de chat, alineada a un lado, con reacciones', 'burbuja, chat, mensaje, conversación'],
  carousel: ['Carrusel de elementos con flechas anterior y siguiente', 'carrusel, slider de imágenes, galería'],
  cascader: ['Selector jerárquico por niveles (país → ciudad → sede)', 'selector jerárquico, niveles, cascada, árbol de opciones'],
  'code-block': ['Bloque de código con botones para copiar, descargar y expandir', 'código, snippet, copiar código'],
  'context-menu': ['Menú que aparece con clic derecho', 'clic derecho, menú contextual'],
  direction: ['Proveedor de dirección de lectura (izquierda a derecha o RTL)', 'rtl, dirección'],
  'event-calendar': ['Calendario de eventos con vistas de día, semana y mes', 'agenda, eventos, calendario de citas, reuniones'],
  gantt: ['Diagrama de Gantt: tareas y dependencias sobre una línea de tiempo', 'gantt, cronograma, planificación, proyecto'],
  'hover-card': ['Tarjeta flotante al pasar el cursor, como una vista previa de perfil', 'vista previa, tarjeta flotante, hover'],
  'icon-stack': ['Varios iconos superpuestos en una pila', 'iconos superpuestos, pila de iconos'],
  marker: ['Marcador en línea con icono y texto (variantes default, border, separator)', 'marcador, separador con texto, etiqueta en línea'],
  menubar: ['Barra de menús tipo aplicación de escritorio (Archivo, Editar…)', 'barra de menús, menubar'],
  message: ['Mensaje de conversación con avatar, cabecera y pie', 'mensaje, chat, comentario, conversación'],
  'message-scroller': ['Contenedor de conversación con scroll que sigue al último mensaje', 'chat, scroll de mensajes, conversación'],
  'native-select': ['Selector nativo del navegador; útil en móvil', 'select nativo, desplegable simple'],
  'navigation-menu': ['Menú de navegación horizontal con submenús desplegables', 'menú superior, navegación, mega menú'],
  resizable: ['Paneles que se redimensionan arrastrando el borde', 'paneles, dividir pantalla, redimensionar'],
  'scroll-area': ['Área con barra de desplazamiento con el estilo del tema', 'scroll, desplazamiento, barra de scroll'],
  scrollspy: ['Resalta en un índice la sección visible mientras se hace scroll', 'índice, tabla de contenidos, scrollspy'],
  sortable: ['Lista que se reordena arrastrando sus elementos', 'arrastrar, reordenar, drag and drop, ordenar'],
  'theme-provider': ['Proveedor del tema de Ubits y del modo claro u oscuro; va en la raíz de la app', 'tema, modo oscuro, dark mode, claro'],
  'traffic-light': ['Semáforo de estados: punto de color con etiqueta y valor; se alimenta con la prop data', 'semáforo, estado, indicador de color'],
  alert: ['Aviso en línea dentro de una sección (6 tonos: default, info, success, warning, destructive, invert)', 'aviso, alerta, mensaje, banner, error, advertencia'],
  'alert-dialog': ['Diálogo que exige confirmar algo irreversible', 'confirmar, eliminar, borrar, modal de confirmación'],
  autocomplete: ['Campo de texto que sugiere opciones mientras escribes', 'autocompletar, sugerencias, buscador con opciones'],
  avatar: ['Foto o inicial de una persona', 'avatar, foto de perfil, usuario, iniciales'],
  badge: ['Etiqueta corta de estado o categoría', 'etiqueta, chip, estado, tag, insignia'],
  breadcrumb: ['Migas de pan: dónde estás dentro de la navegación', 'migas, ruta, navegación jerárquica'],
  button: ['Botón de acción (default, outline, secondary, ghost, destructive, link)', 'botón, acción, cta'],
  'button-group': ['Varios botones pegados como un solo control', 'grupo de botones, segmentado'],
  calendar: ['Calendario para elegir fechas', 'calendario, fecha, día'],
  card: ['Tarjeta contenedora con cabecera, contenido y pie', 'tarjeta, card, panel, caja, kpi'],
  chart: ['Marco de gráficos (ChartContainer, ChartTooltipContent, ChartLegendContent). OJO: trae su propia copia de recharts; ver trampasConocidas', 'gráfico, chart, estadística'],
  checkbox: ['Casilla de verificación', 'casilla, check, marcar, aceptar'],
  collapsible: ['Bloque que se muestra u oculta', 'plegable, mostrar más, expandir'],
  combobox: ['Selector con buscador', 'combobox, selector con búsqueda'],
  command: ['Paleta de comandos tipo ⌘K', 'buscador global, paleta de comandos'],
  'data-grid': ['Tabla de bajo nivel (TanStack). Preferir data-grid-list', 'tabla avanzada, grid'],
  'data-grid-list': ['LA tabla del sistema: orden, filtros, búsqueda, paginación, selección, acciones masivas, densidad y estados vacíos', 'tabla, lista, grid, listado, registros, filas, columnas'],
  'date-selector': ['Selector de fecha o rango de fechas', 'fecha, rango de fechas, date picker'],
  dialog: ['Ventana modal', 'modal, diálogo, ventana emergente'],
  drawer: ['Panel que sube desde abajo (móvil)', 'drawer, panel inferior'],
  'dropdown-menu': ['Menú desplegable de acciones', 'menú, opciones, tres puntos, más acciones'],
  empty: ['Estado vacío: sin datos, sin resultados, error o sin permiso', 'vacío, sin datos, sin resultados, empty state'],
  field: ['Estructura de un campo de formulario: etiqueta, ayuda y error', 'formulario, campo, label, error, validación'],
  filters: ['Barra de filtros con chips', 'filtros, filtrar, chips'],
  'floating-action-bar': ['Barra flotante de acciones sobre una selección', 'barra flotante, acciones masivas'],
  frame: ['Marco con cabecera y paneles', 'marco, frame, contenedor'],
  heading: ['Títulos (h1–h6) con la tipografía del tema', 'título, encabezado, heading'],
  'icon-tile': ['Icono dentro de una baldosa de color', 'icono con fondo, tile'],
  input: ['Campo de texto de una línea', 'input, campo de texto, caja de texto'],
  'input-group': ['Campo con icono, prefijo, sufijo o botón pegado', 'input con icono, buscador, prefijo'],
  'input-otp': ['Código de un solo uso por dígitos', 'otp, código, verificación'],
  item: ['Fila de lista con icono, título, descripción y acciones', 'fila, ítem, elemento de lista, lista'],
  kanban: ['Tablero de columnas con tarjetas arrastrables', 'kanban, tablero, columnas'],
  kbd: ['Atajo de teclado', 'tecla, atajo, shortcut'],
  label: ['Etiqueta de un campo', 'label, etiqueta'],
  'multi-select': ['Selector de varias opciones', 'selección múltiple, varias opciones'],
  'number-field': ['Campo numérico con botones − y +', 'número, cantidad, contador'],
  pagination: ['Paginación suelta (data-grid-list ya la trae)', 'paginación, páginas'],
  'phone-input': ['Campo de teléfono con prefijo de país', 'teléfono, celular'],
  popover: ['Globo flotante con contenido', 'popover, globo'],
  progress: ['Barra de avance (renderiza su propia pista: no añadir ProgressTrack)', 'progreso, avance, barra, porcentaje, carga'],
  'radio-group': ['Opción única entre varias', 'radio, opción única'],
  rating: ['Puntuación con estrellas', 'estrellas, valoración, calificación'],
  select: ['Selector de una opción', 'select, desplegable, lista de opciones'],
  separator: ['Línea divisoria', 'separador, divisor, línea'],
  sheet: ['Panel lateral deslizante', 'panel lateral, sheet, cajón'],
  sidebar: ['Barra lateral de navegación', 'sidebar, menú lateral, navegación'],
  skeleton: ['Esqueleto de carga con la silueta del contenido', 'skeleton, cargando, placeholder'],
  slider: ['Deslizador de valor', 'slider, rango'],
  sonner: ['Toasts estilo Sonner (el export se llama SonnerToaster)', 'toast, notificación'],
  spinner: ['Indicador de carga giratorio', 'spinner, cargando, loader'],
  stepper: ['Formulario o flujo por pasos', 'pasos, stepper, wizard, asistente'],
  switch: ['Interruptor encendido/apagado', 'switch, interruptor, toggle'],
  table: ['Tabla HTML simple sin lógica', 'tabla simple'],
  tabs: ['Pestañas (variants: default, line, view, page)', 'pestañas, tabs'],
  text: ['Texto con variantes del tema (muted, lead, small…)', 'texto, párrafo'],
  textarea: ['Campo de texto de varias líneas', 'textarea, comentario, descripción'],
  timeline: ['Línea de tiempo de eventos', 'timeline, actividad, historial'],
  toast: ['Avisos flotantes: toast.add({ type, title }) dentro de <ToastToaster>', 'toast, notificación, aviso flotante'],
  toggle: ['Botón que se queda presionado', 'toggle'],
  'toggle-group': ['Grupo de toggles', 'segmentado, toggle group'],
  tooltip: ['Texto de ayuda al pasar el cursor', 'tooltip, ayuda'],
  tree: ['Árbol jerárquico', 'árbol, jerarquía, carpetas'],
}

// Fichas del Storybook cuyo nombre no coincide con la carpeta del paquete.
const ALIAS_STORYBOOK = { toaster: 'toast', directionprovider: 'direction' }

const aKebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Z])([A-Z][a-z])/g, '$1-$2').toLowerCase()
const aPascal = (s) => s.split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('')

// ── 1. Lo que exporta de verdad la librería instalada
function nombresExportados(archivo, visitados = new Set()) {
  if (!existsSync(archivo) || visitados.has(archivo)) return []
  visitados.add(archivo)
  const texto = readFileSync(archivo, 'utf8')
  const nombres = []

  for (const m of texto.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const trozo of m[1].split(',')) {
      const t = trozo.trim()
      if (!t || t.startsWith('type ')) continue
      const nombre = t.split(/\s+as\s+/).pop().trim()
      if (nombre && !nombre.startsWith('Fx') && !/^fx[A-Z]/.test(nombre)) nombres.push(nombre)
    }
  }
  for (const m of texto.matchAll(/export\s+(?:declare\s+)?(?:function|const|class)\s+(\w+)/g)) {
    if (!m[1].startsWith('Fx') && !/^fx[A-Z]/.test(m[1])) nombres.push(m[1])
  }
  for (const m of texto.matchAll(/export\s+\*\s+from\s+['"]([^'"]+)['"]/g)) {
    const destino = resolve(dirname(archivo), m[1])
    const candidato = [`${destino}.d.ts`, join(destino, 'index.d.ts')].find(existsSync)
    if (candidato) nombres.push(...nombresExportados(candidato, visitados))
  }
  return nombres
}

const barril = readFileSync(join(DIST, 'index.d.ts'), 'utf8')
const slugs = [...new Set([...barril.matchAll(/from\s+['"]\.\/([a-z0-9-]+)['"]/g)].map((m) => m[1]))]

// Toast y Sonner se reexportan renombrados en el barril.
const RENOMBRADOS = { sonner: ['SonnerToaster'], toast: ['ToastToaster'] }

const porSlug = {}
for (const slug of slugs) {
  const tipos = (() => {
    const t = [...barril.matchAll(new RegExp(`export\\s*\\{([^}]*)\\}\\s*from\\s*['"]\\./${slug}['"]`, 'g'))]
    return t.flatMap((m) => m[1].split(',').map((x) => x.trim().split(/\s+as\s+/).pop().trim()))
  })()
  let exports = nombresExportados(join(DIST, slug, 'index.d.ts'))
  if (tipos.length) exports = tipos.filter((n) => !n.startsWith('Fx'))
  if (RENOMBRADOS[slug]) exports = [...new Set([...RENOMBRADOS[slug], ...exports.filter((n) => n !== 'Toaster')])]
  const origen = readFileSync(join(DIST, slug, 'index.d.ts'), 'utf8').includes('../reui/') ? 'reui' : 'flux-ui'
  porSlug[slug] = { slug, nombre: aPascal(slug), origen, exports: [...new Set(exports)].filter(Boolean).sort() }
}

// ── 1b. Variantes reales de cada componente (lo que más tiende a inventar una IA)
function textoDeTipos(slug) {
  const vistos = new Set()
  const dir = join(DIST, slug)
  const pila = readdirSync(dir).filter((f) => f.endsWith('.d.ts')).map((f) => join(dir, f))
  let texto = ''
  while (pila.length) {
    const archivo = pila.pop()
    if (!existsSync(archivo) || vistos.has(archivo)) continue
    vistos.add(archivo)
    const t = readFileSync(archivo, 'utf8')
    texto += '\n' + t
    for (const m of t.matchAll(/from\s+['"](\.\.?\/[^'"]+)['"]/g)) {
      const d = resolve(dirname(archivo), m[1])
      for (const c of [`${d}.d.ts`, join(d, 'index.d.ts')]) if (existsSync(c)) pila.push(c)
    }
  }
  return texto
}

function uniones(s) {
  const r = {}
  for (const m of s.matchAll(/(\w+)\?:\s*((?:"[^"]*"|\d+)(?:\s*\|\s*(?:"[^"]*"|\d+))+)/g)) {
    const vals = [...m[2].matchAll(/"([^"]*)"|(\d+)/g)].map((v) => v[1] ?? v[2]).filter(Boolean)
    r[m[1]] = [...new Set([...(r[m[1]] ?? []), ...vals])]
  }
  return r
}

const CLAVES_VISUALES = ['variant', 'size', 'radius', 'orientation', 'level', 'weight', 'spacing', 'align', 'side']

function variantesDe(slug, nombres) {
  const t = textoDeTipos(slug)
  const cva = {}
  for (const m of t.matchAll(/declare const (\w+Variants)\s*:\s*\(props\?:\s*\(\{([\s\S]*?)\}\s*&/g)) cva[m[1]] = uniones(m[2])
  const out = {}
  for (const nombre of nombres) {
    const decl = t.match(new RegExp(`declare (?:function|const) ${nombre}\\b[\\s\\S]*?(?=\\ndeclare |\\nexport |\\ninterface |\\ntype |$)`))?.[0] ?? ''
    const props = new RegExp(`interface ${nombre}Props[\\s\\S]*?\\n\\}`).exec(t)?.[0] ?? ''
    const zona = decl + props
    const v = {}
    for (const r of zona.matchAll(/typeof (\w+Variants)/g)) Object.assign(v, cva[r[1]] ?? {})
    for (const [k, vals] of Object.entries(uniones(zona))) if (CLAVES_VISUALES.includes(k)) v[k] = vals
    for (const k of Object.keys(v)) {
      v[k] = v[k].every((x) => /^\d+$/.test(x)) ? v[k].sort((a, b) => a - b) : v[k]
    }
    if (Object.keys(v).length) out[nombre] = v
  }
  return out
}

const UTILIDADES_USO = {
  cn: 'Une clases de Tailwind sin conflictos: cn("flex gap-2", condicion && "hidden"). Solo para layout.',
  useIsMobile: 'Devuelve true en pantallas pequeñas, para adaptar el layout.',
  useCopyToClipboard: 'Copia texto al portapapeles y avisa si se copió.',
  useFileUpload: 'Maneja la selección y subida de archivos (el componente FileUpload aún no está publicado).',
  useTheme: 'Lee y cambia el tema y el modo claro/oscuro.',
}
const utilidades = Object.entries(UTILIDADES_USO)
  .filter(([n]) => nombresExportados(join(LIB, 'dist/hooks/index.d.ts')).includes(n) || (n === 'cn' && /\bcn\b/.test(readFileSync(join(LIB, 'dist/lib/index.d.ts'), 'utf8') + readdirSync(join(LIB, 'dist/lib')).filter((f) => f.endsWith('.d.ts')).map((f) => readFileSync(join(LIB, 'dist/lib', f), 'utf8')).join('\n'))))
  .map(([nombre, uso]) => ({ nombre, uso, importar: `import { ${nombre} } from '@ubits/flux-ui'` }))

const esPublico = (n) => /^[A-Z](?=[A-Za-z0-9]*[a-z])[A-Za-z0-9]*$/.test(n) || /^use[A-Z]/.test(n) || n === 'toast'
for (const c of Object.values(porSlug)) {
  c.exportsPublicos = c.exports.filter(esPublico)
  c.variantes = variantesDe(c.slug, c.exportsPublicos)
}

// ── 2. El índice del Storybook (si no hay red, el catálogo se genera igual, sin enlaces)
let fichas = {}
let storybookDisponible = false
try {
  const r = await fetch(`${STORYBOOK}/index.json`, { signal: AbortSignal.timeout(8000) })
  if (r.ok) {
    const indice = await r.json()
    storybookDisponible = true
    for (const e of Object.values(indice.entries ?? {})) {
      const [seccion, ...resto] = e.title.split('/')
      const nombre = resto.join('/') || seccion
      const slug = ALIAS_STORYBOOK[nombre.toLowerCase()] ?? aKebab(nombre)
      const ficha = (fichas[slug] ??= { seccion, titulo: e.title, historias: [] })
      if (e.type === 'docs') ficha.docs = `${STORYBOOK}/index.html?path=/docs/${e.id}`
      else ficha.historias.push({ nombre: e.name, url: `${STORYBOOK}/index.html?path=/story/${e.id}` })
    }
  }
} catch {}

const componentes = Object.values(porSlug).map((c) => {
  const f = fichas[c.slug]
  const [usarPara, buscar] = GUIA[c.slug] ?? ['', '']
  return {
    ...c,
    importar: `import { ${c.exportsPublicos.slice(0, 4).join(', ')}${c.exportsPublicos.length > 4 ? ', …' : ''} } from '@ubits/flux-ui'`,
    usarPara,
    buscar: buscar ? buscar.split(',').map((s) => s.trim()) : [],
    storybook: f ? { seccion: f.seccion, docs: f.docs ?? null, historia: f.historias[0]?.url ?? null } : null,
  }
}).sort((a, b) => a.slug.localeCompare(b.slug))

const soloEnStorybook = Object.entries(fichas)
  .filter(([slug, f]) => !porSlug[slug] && !['Getting Started', 'Blocks'].includes(f.seccion))
  .map(([slug, f]) => ({ slug, titulo: f.titulo, docs: f.docs ?? null }))

// ── 3. Paquetes permitidos: la fuente de verdad es scripts/check.mjs (lo mantiene ingeniería)
const check = readFileSync(join(RAIZ, 'scripts/check.mjs'), 'utf8')
const permitidos = [...(check.match(/ALLOWED_PACKAGES\s*=\s*\[([\s\S]*?)\]/)?.[1] ?? '').matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1])

const catalogo = {
  $comentario: 'Generado por ai-tools/flux-ui/generar-catalogo.mjs. No editar a mano: se regenera.',
  generado: new Date().toISOString(),
  libreria: { paquete: '@ubits/flux-ui', version, importarDesde: '@ubits/flux-ui' },
  huellaReglas,
  storybook: { url: STORYBOOK, consultado: storybookDisponible },
  reglas: [
    'Primero las piezas que el proyecto ya resolvió (PageShell, BotonIcono, notify, DrawerShell, ActionDialog… en src/shared/components y src/modules/design-system), después este catálogo. Están hechas con flux-ui: usarlas es no construir la misma cosa dos veces.',
    'Toda pieza de interfaz sale de @ubits/flux-ui. Nada de otras librerías de UI, HTML copiado ni componentes hechos a mano si aquí existe uno.',
    'Solo se usan componentes con "disponible" en este catálogo. Los de "soloEnStorybook" todavía no están en la versión instalada: no importarlos.',
    'Iconos: solo Hugeicons desde @hugeicons/core-free-icons, siempre como dato dentro de <HugeiconsIcon icon={NombreIcon} />. Nunca importes iconos desde @ubits/flux-ui aunque aparezcan exportados.',
    'Colores: solo tokens del tema (bg-card, text-muted-foreground, var(--chart-2)…). Nunca literales ni paleta cruda de Tailwind.',
    'className solo para layout: ancho, márgenes, gap, truncado, visibilidad.',
    'Antes de decir que falta un componente, búscalo aquí por "buscar" y en node_modules. El MCP flux-ui lista solo 69 de los 89.',
    'Cerrar siempre con npm run check.',
  ],
  paquetesPermitidos: permitidos,
  importsProhibidos: [
    { patron: '^@reui/', motivo: 'ReUI se usa como plantilla de estructura; los componentes salen de @ubits/flux-ui, que ya lo trae dentro.' },
    { patron: '^@/components/ui(/|$)', motivo: 'Es la carpeta de shadcn; en el playground no existe. Importa desde @ubits/flux-ui.' },
    { patron: '^@/reui-reference(/|$)', motivo: 'Es código de referencia local, no se importa en las maquetas.' },
    { patron: '^lucide-react$', motivo: 'Los iconos son Hugeicons: <HugeiconsIcon icon={…} /> desde @hugeicons/react.' },
    { patron: '^@tanstack/react-table$', motivo: 'Para tablas usa DataGridList de @ubits/flux-ui.' },
  ],
  patronesVerificados: [
    { tema: 'Estados vacíos, carga y feedback', ruta: '/design-system/estados', codigo: 'src/modules/design-system/estados/main.tsx' },
    { tema: 'Data-grid con orden, filtros, paginación y selección', ruta: '/design-system/data-grid', codigo: 'src/modules/design-system/data-grid/main.tsx' },
    { tema: 'Formularios, validación y pasos', ruta: '/design-system/formularios', codigo: 'src/modules/design-system/formularios/main.tsx' },
    { tema: 'Dashboard completo: shell, tarjetas, pestañas, gráfico y línea de tiempo, sin piezas hechas a mano', ruta: '/design-system/templates/dashboard', codigo: 'src/modules/design-system/templates/dashboard/' },
  ],
  trampasConocidas: [
    'Gráficos: usa ChartContainer y ChartTooltipContent de flux-ui con recharts 3. La librería trae su propia copia de recharts, así que el gráfico recibe width y height en números (no ResponsiveContainer) y el Tooltip se importa de "recharts" con content={<ChartTooltipContent />}. Patrón: src/modules/admin/desempeno-cultura/encuestas/components/graficos.tsx.',
    'DataGridList: declara columns y columnFilters fuera del componente; si no, el filtro se cierra solo y el menú de columnas entra en bucle. No ordena ni filtra por sí mismo: resuélvelo tú y pásale data.',
    'Progress ya pinta su pista e indicador: dentro solo van ProgressLabel y ProgressValue.',
    'Toast: el proveedor se exporta como ToastToaster; los avisos se lanzan con toast.add({ type, title, description }).',
    'Badge "destructive-light" es ilegible en tema claro; usa "destructive-outline".',
    'Badge "focus-light" pinta el texto casi blanco en tema claro; usa "focus-outline".',
    '<Input type="file" className="sr-only" /> se estira a todo el ancho (el w-full del Input le gana al sr-only) y abre scroll horizontal: usa className="hidden".',
    'Sidebar: el ancho se fija con style={{ "--sidebar-width": "272px" }}, no con una clase.',
  ],
  totales: {
    disponibles: componentes.length,
    conFichaEnStorybook: componentes.filter((c) => c.storybook).length,
    soloEnStorybook: soloEnStorybook.length,
  },
  componentes: componentes.map((c) => ({ ...c, disponible: true })),
  soloEnStorybook,
}

writeFileSync(SALIDA, JSON.stringify(catalogo, null, 2) + '\n')
console.log(`catálogo: ${componentes.length} componentes disponibles, ${catalogo.totales.conFichaEnStorybook} con ficha en Storybook, ${soloEnStorybook.length} solo en Storybook`)

// ── 4. Versión portátil para enviar al equipo: autocontenida, sin rutas de este repo,
//      y pensada para pegarse en cualquier IA (Claude, ChatGPT, Cursor, Copilot, Gemini…).
const css = existsSync(join(RAIZ, 'src/index.css')) ? readFileSync(join(RAIZ, 'src/index.css'), 'utf8') : ''
const tokensColor = [...new Set([...css.matchAll(/--color-([a-z0-9-]+)\s*:/g)].map((m) => m[1]))]

const PROHIBIDAS = [
  '@mui/*', 'antd', '@chakra-ui/*', '@mantine/*', 'react-bootstrap', 'bootstrap', 'primereact',
  'semantic-ui-react', '@headlessui/react', '@radix-ui/* (usado directo)', 'styled-components',
  '@emotion/*', 'componentes copiados de shadcn/ui', '@reui/* (ReUI ya viene dentro de flux-ui)',
  'lucide-react', 'react-icons', '@heroicons/*', '@fortawesome/*', 'SVG pegados a mano',
]

const PIEZAS_DEL_PROYECTO = {
  $comentario:
    'Piezas que este proyecto ya resolvió envolviendo flux-ui con las decisiones del equipo. Se miran ANTES del catálogo: volver a armarlas con componentes sueltos crea una segunda versión que se desincroniza.',
  donde_buscar: [
    'src/shared/components/ — las piezas compartidas del marco.',
    'src/modules/design-system/ — las piezas del sistema de diseño, cada una documentada en su pantalla /design-system/*.',
    'Una pantalla parecida ya hecha, en src/modules/admin/ o src/modules/portal-colaborador/.',
  ],
  // Salen de ai-tools/reglas/reglas.json («piezas»): se cambian allí, no aquí.
  ya_resueltas: FUENTE.piezas.map(({ necesidad, usa, desde, en_vez_de, ver_tambien }) => ({
    necesidad,
    usa,
    desde,
    en_vez_de,
    ...(ver_tambien ? { ver_tambien } : {}),
  })),
  patrones_de_partida: {
    $comentario:
      'Pantallas del design system que ya resuelven un caso completo y se copian como punto de partida, en vez de montarlo desde cero.',
    casos: [
      'Tablas: /design-system/data-grid, y sus casos reutilizables data-grid/casos/seguimiento y data-grid/casos/sin-arrastre.',
      'Estados vacíos, de carga y de error: /design-system/estados.',
      'Formularios y fechas: /design-system/formularios; el campo de un día (CampoFecha; con `accion` se abre desde un botón como «Cambiar fecha», y Tareas lo envuelve como CambiarFecha y CalendarioFecha), el de un rango (RangoDeFechas) y el mes en español para cualquier Calendar (CALENDARIO_ES) están en src/modules/design-system/formularios/rango-de-fechas.tsx.',
      'Tableros: las cifras y gráficos de /design-system/metricas y el Inicio del admin (/admin). El Dashboard de /design-system/templates es del Archivo: sus piezas se mudaron a Métricas el 29-sep.',
    ],
  },
  utilidades: [
    { necesidad: 'El ancho del contenedor de página', usa: 'PAGE_WIDTH', desde: '@/shared/components/page-width', detalle: 'narrow 720 (formularios y pasos), default 1140 (el ancho de diseño), wide 1600 (tableros densos), full (paneles divididos). PageShell ya lo aplica: no pongas max-w a mano.' },
    { necesidad: 'Formatear fechas, iniciales, rangos y plurales', usa: 'iniciales, fechaCorta, fechaSinAnio, fechaHora, hora, HOY, diasDesde, isoHaceDias, formatoKM, plural, textoDeRango, generador', desde: '@/modules/design-system/patrones/formato', detalle: 'No escribas tus propios formateadores ni uses toLocaleDateString suelto.' },
    { necesidad: 'El estilo del botón de icono del header', usa: 'HEADER_ICON', desde: '@/shared/components/header-icon', detalle: 'Ya trae los estados abierto/activo en azul; no los repitas con className.' },
    { necesidad: 'Mostrar o cerrar el aviso global de arriba', usa: 'mostrarBanner, cerrarBanner, useBanner', desde: '@/shared/components/banner', detalle: 'El GlobalBanner ya está puesto en el marco: se controla con estas funciones, no poniendo un Alert en la pantalla.' },
    { necesidad: 'Abrir o cerrar el panel derecho', usa: 'setRightPanelOpen, useRightPanelOpen', desde: '@/shared/components/right-panel-store', detalle: 'No montes tu propio estado para el panel: se desincroniza con el marco.' },
  ],
  estado_interno_del_marco:
    'chat-status (markChatRead, useChatStatus), shell-data (datos de ejemplo del marco) y useCommandPalette son estado y datos internos: se usan desde el marco, no desde una pantalla.',
  las_monta_el_marco: {
    $comentario:
      'Estas ya están puestas por el RootLayout. No las metas dentro de una pantalla: se duplican.',
    piezas: [
      'Toaster — hay uno solo, en el RootLayout. Un ToastToaster en la pantalla duplica los avisos: usa notify.',
      'AppHeader, HeaderActions, AppFooter, SidebarRail, UbitsLogo, GlobalBanner.',
      'AccountPopover, ProfilePopover, NotificationsPopover, NovedadesButton — los menús del header.',
      'LayoutSlot, SlotArea, PageAmbience, PageFallback, PlaceholderPage, ThemeSwitch, ThemeToggle.',
      // Auditoría, 5-oct (decisión 21): las ventanas que abre la barra lateral también son del marco.
      'FeedbackDialog (la ventana de «Enviar feedback», sobre ActionDialog, con CapturaArea para recortar un área de la pantalla) y TourDialog (el tour «Nos renovamos para ti» de «Hacer el tour»). Las abre la barra lateral y el riel; se documentan en /design-system/modales.',
    ],
  },
  si_se_queda_corta:
    'Se amplía la pieza que ya existe. No se hace una paralela al lado: así aparecen los dos vocabularios que el proyecto ya arrastra.',
}

// Salen de ai-tools/reglas/reglas.json («reglas» con "catalogo" en «en»): se cambian allí, no aquí.
const REGLAS_IA = FUENTE.reglas.filter((r) => r.en?.includes('catalogo')).map((r) => r.texto)

const PROMPT_BASE = [
  `Construyes interfaces de frontend con la librería @ubits/flux-ui ${version} (basada en ReUI; cada componente tiene ficha en ${STORYBOOK}). El archivo flux-ui-para-ia.json adjunto es la lista completa y oficial de componentes: nombre, import, para qué sirve, variantes permitidas y enlace al Storybook.`,
  'Tu trabajo es ELEGIR y COMBINAR piezas que ya existen, nunca crear componentes visuales nuevos.',
  'Buscas en un orden: PRIMERO las piezas que el proyecto ya resolvió (clave "piezas_del_proyecto": PageShell, BotonIcono, notify, DrawerShell, DialogoConfirmar para preguntar, ActionDialog para toda otra ventana, TablaDatos…), DESPUÉS los componentes del catálogo. Las piezas del proyecto están hechas con esta misma librería: usarlas no es saltarse la regla, es no construir la misma cosa dos veces.',
  'Para cada pieza de la pantalla: 1) descríbela en una frase, 2) mira si el proyecto ya la resolvió, 3) si no, búscala en el archivo y úsala con sus variantes exactas, 4) si no existe, DETENTE y pregunta en vez de dibujarla a mano.',
  'Prohibido: otras librerías de UI, componentes copiados de shadcn/ReUI/MUI, componentes propios hechos con div/span y clases, variantes inventadas, colores literales o de la paleta de Tailwind, iconos que no sean Hugeicons, y className que cambie la apariencia de un componente (solo layout).',
  'Permitido: pantallas y bloques que combinan componentes de la librería, contenedores neutros (div, section, header, main) con clases de layout, y funciones locales que solo agrupan componentes de la librería para no repetir código.',
  'Antes de entregar, revisa que cada import de interfaz venga de @ubits/flux-ui, de @hugeicons/* o de una pieza del propio proyecto, y que no quede ninguna pieza visual hecha a mano ni rehecha pudiendo reusarla.',
].join('\n\n')

const portatil = {
  $archivo: 'flux-ui-para-ia.json',
  $para_que:
    'Reglas y catálogo para que cualquier IA construya el frontend del Playground UX sin inventar componentes: primero las piezas que el proyecto ya resolvió ("piezas_del_proyecto"), después @ubits/flux-ui. Se comparte tal cual con el equipo.',
  $version_formato: '1.0',
  generado: new Date().toISOString(),
  libreria: {
    paquete: '@ubits/flux-ui',
    version,
    basada_en: 'ReUI y shadcn sobre Base UI, con el tema de Ubits',
    storybook: STORYBOOK,
    iconos: '@hugeicons/react + @hugeicons/core-free-icons',
  },
  instrucciones_para_la_ia: {
    mision:
      'Construyes interfaces de frontend para Ubits sin dibujar nada a mano. Buscas en un orden: primero las piezas que el proyecto ya resolvió ("piezas_del_proyecto"), después los componentes de @ubits/flux-ui de este archivo. Tu trabajo es analizar qué resuelve cada necesidad y combinarlo. Nunca creas componentes visuales nuevos.',
    reglas_obligatorias: REGLAS_IA,
    protocolo_por_cada_pieza: [
      'Describe en una frase qué verá la persona (por ejemplo: "lista de colaboradores con filtros y paginación").',
      'Mira si el proyecto ya la resolvió: busca en "piezas_del_proyecto" y en las carpetas de "piezas_del_proyecto.donde_buscar". Si existe, úsala y no sigas buscando aquí.',
      'Busca candidatos en "componentes" comparando con "usar_para" y "buscar". Si hay varios, elige el más específico. Una tabla nunca sale de aquí: es TablaDatos, de "piezas_del_proyecto".',
      'Revisa sus "exports" (subcomponentes) y "variantes". Si necesitas ver cómo se compone, abre "storybook.docs".',
      'Escribe el código combinando esos componentes. El layout (grid, flex, gap, anchos) va en contenedores neutros.',
      'Si no hay ningún candidato, no sigas: aplica "si_no_existe".',
    ],
    si_esta_permitido: [
      'Usar las piezas de "piezas_del_proyecto": están hechas con esta misma librería y llevan las decisiones que ya tomó el equipo.',
      'Componer pantallas, secciones y bloques que combinan componentes de la librería.',
      'Usar contenedores neutros (div, section, header, main, nav, ul, li) con clases de layout.',
      'Crear funciones locales que SOLO agrupan componentes de la librería para no repetir JSX, sin estilos visuales propios.',
      'Pasar datos, estado y eventos a los componentes.',
    ],
    esta_prohibido: [
      'Crear un componente visual nuevo (botón, tarjeta, modal, tabla, badge, avatar, barra, pestañas, menú, input…) aunque sea "parecido".',
      'Usar <button>, <input>, <select>, <textarea>, <table>, <dialog> o <svg> sueltos cuando la librería tiene el componente.',
      'Inventar variantes, tamaños o props visuales que no estén en "variantes".',
      'Importar otras librerías de interfaz o copiar componentes de otros sistemas.',
      'Sobrescribir colores, bordes, sombras, radios, tipografía o estados (hover, focus) de un componente con className o CSS.',
      'Usar componentes de "en_storybook_pero_no_publicados".',
      'Armar con componentes sueltos una pieza que el proyecto ya tiene envuelta en "piezas_del_proyecto", o hacer una versión paralela al lado en vez de ampliar la que existe.',
    ],
    si_no_existe:
      'Detente y responde con este formato: "La librería no tiene un componente para <necesidad>. Lo más cercano es <componentes y por qué no alcanzan>. ¿Lo pedimos al equipo de flux-ui o lo resolvemos con <alternativa con componentes existentes>?". No lo dibujes a mano mientras tanto.',
    verificacion_antes_de_entregar: [
      'Cada import de interfaz viene de @ubits/flux-ui, de @hugeicons/* o de una pieza del propio proyecto ("piezas_del_proyecto").',
      'Ninguna pieza de "piezas_del_proyecto" quedó rehecha a mano con componentes sueltos.',
      'No queda ninguna pieza visual hecha a mano con div, span o elementos HTML nativos.',
      'Cada variante usada aparece en "variantes" de su componente.',
      'Los colores son tokens de "tokens_del_tema" y className solo tiene layout.',
      'Ningún componente usado está en "en_storybook_pero_no_publicados".',
    ],
  },
  piezas_del_proyecto: PIEZAS_DEL_PROYECTO,
  reglas_del_equipo: {
    $comentario: 'Las decisiones vigentes del equipo, con su fecha y su pantalla modelo. Salen de ai-tools/reglas/reglas.json.',
    vigentes: FUENTE.reglas.filter((r) => r.tema !== 'libreria').map(({ id, fecha, texto, ejemplo }) => ({ id, fecha, texto, ...(ejemplo ? { modelo: ejemplo } : {}) })),
    retiradas: FUENTE.retiradas.map(({ pieza, fecha, usa }) => ({ pieza, desde: fecha, usa })),
    por_decidir: FUENTE.por_decidir,
  },
  prompt_base: PROMPT_BASE,
  iconos: {
    libreria: 'Hugeicons',
    paquetes: ['@hugeicons/react', '@hugeicons/core-free-icons'],
    uso: "import { HugeiconsIcon } from '@hugeicons/react'\nimport { Delete02Icon } from '@hugeicons/core-free-icons'\n\n<HugeiconsIcon icon={Delete02Icon} size={20} />",
    regla: 'El icono es un dato, no un componente: nunca <Delete02Icon />. Comprueba que el nombre exista antes de usarlo.',
  },
  tokens_del_tema: {
    colores: tokensColor,
    uso: 'Con prefijo de Tailwind: bg-<token>, text-<token>, border-<token>, ring-<token> (por ejemplo bg-card, text-muted-foreground, border-border). En estilos en línea o SVG: var(--<token>), por ejemplo var(--chart-2).',
    prohibido: ['#3b82f6', 'rgb(…)', 'oklch(…)', 'bg-blue-500', 'text-slate-700', 'border-zinc-200', 'tamaños de fuente fijos'],
  },
  librerias_de_ui_prohibidas: PROHIBIDAS,
  diferencias_con_la_libreria:
    'Lo que el playground hace distinto de @ubits/flux-ui (y del Storybook), revalidado contra la versión instalada, está en ai-tools/flux-ui/diferencias.json y en la pestaña /design-system/componentes/dev. Antes de forzar un componente con «!», mira ahí si ya está resuelto o pedido.',
  trampas_conocidas: [
    'Checkbox con indeterminate pinta el mismo visto que marcado (la librería siempre dibuja Tick02Icon), así que "a medias" se lee como "todo". No lo uses para selecciones parciales: di la parte elegida en texto al lado (p. ej. "3 elegidas a mano").',
    'Field estira a lo ancho todos sus hijos directos (*:w-full) y esa regla le gana a una clase de ancho. Para un campo angosto (NumberField, Input corto) el ancho va en un segundo contenedor: <Field><div className="flex items-center gap-2"><div className="w-40">…</div></div></Field>.',
    'Slider devuelve un número cuando tiene un solo tirador y un arreglo cuando es un rango. Con un solo tirador, (v as number[])[0] deja el valor en NaN al moverlo con el teclado: resuelve el valor con Array.isArray(v) ? v[0] : v.',
    'CardHeader del tema es una rejilla: className="flex-row" no le gana. Para icono y texto en una fila, mete la fila en un div dentro del CardHeader (lo mismo que PopoverHeader).',
    'SortableItem reparte los atributos de arrastre sobre la fila entera (role="button", tabIndex), así que la fila sale como botón en el árbol de accesibilidad aunque uses SortableItemHandle. Es como viene de ReUI: no lo parches, y evita meter una etapa "fija" dentro de la lista (con disabled sale apagada, como si no sirviera): dibújala aparte.',
    'DataGridList no ordena, filtra ni pagina por su cuenta: avisa por callbacks (sort, search, onColumnFiltersChange, pagination) y espera recibir "data" ya resuelta.',
    'DataGridList: declara "columns" y "columnFilters" fuera del componente (o memorizados). Si se crean en cada render, el filtro se cierra al marcar la primera opción y el menú de columnas entra en bucle.',
    'DataGridList: el asidero para arrastrar columnas lo decide cada columna, no layout.reorderable. Para quitarlo (y ganar ancho) pon enableColumnOrdering: false en cada columna, además de layout: { reorderable: false }. El tipo de las columnas no declara esa opción: guárdala en una constante (const SIN_ARRASTRE = { enableColumnOrdering: false }) y espárcela con ...SIN_ARRASTRE, o la compilación falla.',
    'DataGridList con actions.item y sin selection deja una franja vacía encima de la tabla (la barra de acciones sobre filas seleccionadas). Con frame, usa frame.toolbar: "header" para que no aparezca.',
    'DataGridList con frame se ve más pesado que los bloques de ReUI si no se le dice: (1) cardVariant: "borderless", porque si no la tabla arma otra caja con borde dentro del panel y los dos bordes pegados se leen como un trazo grueso; (2) layout.resizable: false, porque al poder cambiar el ancho añade una columna de relleno al final, después de los «⋯», que queda como un hueco vacío (la columna de acciones no se puede fijar a la derecha); (3) layout.dense: true, que da la cabecera de 32 px y las celdas de ReUI. TablaDatos ya lo trae por defecto; el Storybook tiene los tres problemas en su ejemplo con Frame.',
    'KanbanBoard trae "sm:grid-cols-3" por defecto: para otro número de columnas pon también la clase con "sm:" (p. ej. "grid-cols-5 sm:grid-cols-5"), o se queda en 3.',
    'TabsList variant="line" estira cada pestaña (flex-1). Para pestañas alineadas a la izquierda sobre la línea completa, pon className="flex-none" en cada TabsTrigger.',
    'AvatarGroup está pensado para fotos: con iniciales, el solapamiento tapa la segunda letra. Sin fotos, no lo uses; muestra la lista o el número de personas.',
    'Gráfico de dona con recharts 2: LabelList con position="inside" no pinta nada en Pie. Pon el total con <Label position="center"> dentro de Pie y la leyenda aparte con TrafficLight.',
    'DataGridList: los textos de la paginación ("Rows per page", "1 - 8 of 11") salen en inglés y "labels" no los cubre. No le pases pagination: usa TablaDatos (src/modules/design-system/data-grid/tabla-datos.tsx), que es la misma tabla con el pie de paginación del proyecto en español dentro de su marco.',
    'Progress ya pinta su pista y su indicador: dentro solo van ProgressLabel y ProgressValue.',
    'Toast: el proveedor se exporta como ToastToaster y los avisos se lanzan con toast.add({ type, title, description }). Sonner se exporta como SonnerToaster. En una pantalla no se usa ninguno de los dos: el aviso es notify(título, detalle, tipo) y el Toaster ya está en el RootLayout.',
    'Chart (ChartContainer) trae su propia copia de recharts 3 dentro de dist: su ResponsiveContainer pasa la medida por un contexto que el gráfico del proyecto no ve y sale vacío sin error. Dale al gráfico width y height en números (mide el marco con un ResizeObserver si tiene que llenar) y usa Tooltip de "recharts" con content={<ChartTooltipContent />}; ChartTooltip de flux-ui no se abre.',
    'Sidebar: el ancho se fija con style={{ "--sidebar-width": "272px" }}; una clase no le gana al estilo en línea del componente.',
    'Select de Base UI: para mostrar la etiqueta elegida usa <SelectValue>{(v) => …}</SelectValue>.',
    'Badge "focus-light" sale con el texto casi blanco sobre su fondo translúcido en tema claro (text-focus-foreground): usa "focus-outline". Sobre una foto, ponle una base bg-card del tamaño del badge.',
    'Un <Input type="file"> escondido con className="sr-only" se estira: el w-full del Input le gana al ancho de 1 px de sr-only y, como queda en posición absoluta, abre scroll horizontal en toda la pantalla. Escóndelo con className="hidden" (el .click() desde un botón sigue abriendo el selector).',
    'TablaDatos no deja arrancar con columnas ocultas: DataGridList no expone su visibilidad inicial. Todas salen visibles y se ocultan desde «Personalizar columnas» (pedido a la librería en diferencias.json).',
    'DataGridList: actions.item es el mismo menú para todas las filas (disabled no depende de la fila). Si las acciones cambian según el estado de la fila, arma una columna propia con DropdownMenu y pásale los manejadores por contexto, para que "columns" siga fuera del componente. Ejemplo: /design-system/data-grid, pestaña «Evaluaciones 360°».',
    'DropdownMenuContent toma el ancho del botón que lo abre (w-(--anchor-width)). Con un botón de icono el menú queda angosto y min-w-* no le gana al tema: dale un ancho con w-52 o w-56.',
    'AlertDialogAction es un Button, no cierra el diálogo. Controla open/onOpenChange y ciérralo en su onClick; AlertDialogCancel sí cierra solo.',
    'Button con render={<Link to="…" />} necesita nativeButton={false}; si no, Base UI avisa en consola que esperaba un <button> nativo. SidebarMenuButton y BreadcrumbLink no lo necesitan.',
    'Los estilos del tema no están en capas, así que una clase de relleno o tamaño no les gana (Card con py-0 conserva su relleno, Avatar con size-20 no crece). Para una imagen a sangre en Card, la <img> tiene que ser el primer hijo del Card; si va dentro de otra caja, ponla dentro de CardContent con esquinas redondeadas.',
    'Calendar sale en inglés y no se puede importar el idioma de react-day-picker (no está permitido). Pasa formatters={CALENDARIO_ES} (de src/modules/design-system/formularios/rango-de-fechas.tsx) y weekStartsOn={1}; para un campo de un día usa CampoFecha del mismo archivo. Para un rango de fechas no hay DualDateRangePicker instalado: Calendar mode="range" dentro de Popover (ver src/modules/design-system/formularios/rango-de-fechas.tsx).',
    'DropdownMenuItem variant="destructive" pierde el rojo: el modo translúcido de los menús (.cn-menu-translucent) le fuerza text-accent-foreground y se ve como cualquier otra opción. Deja «Cerrar sesión» y similares con la variante por defecto. Está pedido a la librería (/design-system/componentes/dev).',
    'DropdownMenuRadioItem y DropdownMenuCheckboxItem no cierran el menú al elegir (closeOnClick es false por defecto en Base UI). Para un selector que se cierra al elegir (cambiar de empresa) pon closeOnClick.',
    'ItemDescription corta el texto a dos líneas. Para textos más largos dentro de un Item (novedades, sugerencias) usa <Text variant="muted" size="sm">.',
    'Heading solo acepta as="h1"…"h6". Para una cifra grande con la tipografía de Heading, hazla el título de su tarjeta (as="h3" level={2}) y agrega el nombre en un <span className="sr-only">.',
    'PopoverHeader es una columna del tema y className="flex-row" no le gana. Para título y acción en una fila usa un div con flex y PopoverTitle dentro.',
    'FrameFooter es una columna (flex-col): para texto y botones en una fila pon className="flex flex-row items-center justify-between"; sin flex-row todo queda centrado y apilado.',
    'Frame dense no quita el relleno del marco en esta versión (el panel queda 2 px adentro y con márgenes negativos). Usa Frame normal.',
    'AlertDescription es una grilla: cada hijo (texto, <strong>) va en su propia fila. Envuelve la frase en un <p>.',
    'Dentro de un contenedor con la clase "dark" (p. ej. una pantalla oscura dentro de la app clara), el panel de Frame sigue blanco porque usa --color-card de la raíz. Ahí usa Card.',
    'MessageAvatar va abajo del mensaje (self-end). Para la bolita junto a la primera línea, className="self-start".',
    'MessageScroller necesita MessageScrollerProvider. Con autoScroll y defaultScrollPosition="start" puede saltar al final al montar si el contenido crece; mejor sin autoScroll y llamar scrollToEnd de useMessageScroller() cuando llega un mensaje.',
    'DialogContent (y CommandDialog) toma el ancho máximo del tema (unos 512 px): sm:max-w-2xl no le gana.',
  ],
  componentes: componentes.map((c) => ({
    nombre: c.nombre,
    slug: c.slug,
    categoria: c.storybook?.seccion ?? null,
    usar_para: c.usarPara || null,
    buscar: c.buscar,
    importar_desde: '@ubits/flux-ui',
    exports: c.exportsPublicos,
    variantes: c.variantes,
    storybook: c.storybook ? { docs: c.storybook.docs, historia: c.storybook.historia } : null,
  })),
  utilidades,
  no_usar_aunque_se_exporten: [
    'Iconos con nombre de Hugeicons que la librería reexporta para uso interno (Cancel01Icon, ArrowLeft01Icon…): importa siempre los iconos desde @hugeicons/core-free-icons.',
    'ComponentCard, ComponentDocsPage e IconPlaceholder: son piezas internas de la documentación del Storybook.',
    'Los alias con prefijo Fx (FxButton, FxCard…): son el mismo componente; usa el nombre sin prefijo.',
  ],
  en_storybook_pero_no_publicados: soloEnStorybook.map((c) => ({ nombre: c.titulo.split('/').pop(), storybook: c.docs })),
  como_usar: {
    resumen: 'Adjunta este archivo como conocimiento o contexto del proyecto y pega "prompt_base" como instrucciones fijas.',
    claude_proyectos: 'claude.ai → Proyecto → Conocimiento: sube este archivo. Instrucciones del proyecto: pega "prompt_base".',
    claude_code: 'Guarda el archivo en el repo y añade al CLAUDE.md una línea: "Toda la UI sigue flux-ui-para-ia.json; léelo antes de escribir interfaz".',
    cursor: 'Guarda el archivo en el repo y crea .cursor/rules/flux-ui.mdc con "alwaysApply: true" y el texto de "prompt_base" apuntando a este archivo.',
    chatgpt: 'Proyecto o GPT personalizado → Archivos: sube este archivo. Instrucciones: pega "prompt_base".',
    github_copilot: 'Guarda el archivo en el repo y pega "prompt_base" en .github/copilot-instructions.md.',
    gemini: 'Guarda el archivo en el repo y referencia "prompt_base" desde GEMINI.md.',
    codex: 'Guarda el archivo en el repo y referencia "prompt_base" desde AGENTS.md.',
  },
  totales: {
    componentes: componentes.length,
    con_ficha_en_storybook: componentes.filter((c) => c.storybook).length,
    con_variantes: componentes.filter((c) => Object.keys(c.variantes).length).length,
    en_storybook_pero_no_publicados: soloEnStorybook.length,
  },
}

writeFileSync(SALIDA_PORTATIL, JSON.stringify(portatil, null, 2) + '\n')
console.log(`portátil: ${SALIDA_PORTATIL.split('/').pop()} (${(JSON.stringify(portatil).length / 1024).toFixed(0)} KB)`)
