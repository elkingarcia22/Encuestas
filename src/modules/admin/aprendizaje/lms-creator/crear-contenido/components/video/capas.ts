import type { CamposCanvas, PlantillaCanvas } from './datos'

// Las capas de un canvas del video: cada pieza de la diapositiva (un texto, la foto, una forma, un badge, una lista, un
// dato, una cita, la agenda) con su caja en % del lienzo y su rotación. Es el modelo del editor de AI Studio en
// producción (el jefe de Dave, 14-oct): la plantilla **genera** las capas con sus medidas, y desde ahí el creador las
// mueve, las escala, las gira, las reordena, agrega otras y borra las que sobran.
//
// Mientras nadie toque una capa, la escena se dibuja desde la plantilla y sus campos (así no se pierde nada de lo que
// ya estaba hecho); en cuanto se toca, la lista queda guardada en la escena y manda ella. Cambiar de plantilla la vuelve
// a generar con el contenido que sirva.

export type FondoCanvas = 'degradado' | 'claro' | 'oscuro' | 'acento'
export type TipoCapa = 'texto' | 'imagen' | 'forma' | 'badge' | 'lista' | 'dato' | 'cita' | 'agenda'
export type EstiloTexto = 'antetitulo' | 'titulo' | 'subtitulo' | 'cuerpo' | 'afirmacion'
export type RellenoForma = 'acento' | 'blanco' | 'oscuro' | 'tinte'

/** Posición y tamaño en % del lienzo; rotación en grados. */
export type Caja = { x: number; y: number; w: number; h: number; rot: number }

export type Capa = {
  id: string
  tipo: TipoCapa
  caja: Caja
  /** Color propio (hex) del texto o de la forma; sin él, el que le toca por el fondo y el acento. */
  color?: string
  texto?: string
  estilo?: EstiloTexto
  src?: string
  relleno?: RellenoForma
  titulo?: string
  subtitulo?: string
  items?: string[]
  valor?: string
  etiqueta?: string
  cita?: string
  autor?: string
  agenda?: { titulo: string; desc: string }[]
  /** El campo de la plantilla del que salió: sirve para no perder el texto al cambiar de plantilla. */
  campo?: keyof CamposCanvas
  /** Alineación del texto; sin ella, la de su estilo (la afirmación, centrada; lo demás, a la izquierda). */
  alinear?: 'izquierda' | 'centro'
  /** La puso la plantilla (no se agregó a mano): al cambiar de plantilla se vuelve a generar en vez de viajar. */
  dePlantilla?: boolean
}

export const FONDOS: { id: FondoCanvas; label: string }[] = [
  { id: 'degradado', label: 'Degradado' },
  { id: 'claro', label: 'Claro' },
  { id: 'oscuro', label: 'Oscuro' },
  { id: 'acento', label: 'Color de acento' },
]

export const ESTILOS_TEXTO: { id: EstiloTexto; label: string }[] = [
  { id: 'antetitulo', label: 'Antetítulo' },
  { id: 'titulo', label: 'Título' },
  { id: 'subtitulo', label: 'Subtítulo' },
  { id: 'cuerpo', label: 'Cuerpo' },
  { id: 'afirmacion', label: 'Afirmación' },
]

export const RELLENOS: { id: RellenoForma; label: string }[] = [
  { id: 'acento', label: 'Color de acento' },
  { id: 'blanco', label: 'Blanco' },
  { id: 'oscuro', label: 'Oscuro' },
  { id: 'tinte', label: 'Acento suave' },
]

export const NOMBRE_CAPA: Record<TipoCapa, string> = {
  texto: 'Texto',
  imagen: 'Imagen',
  forma: 'Forma',
  badge: 'Badge',
  lista: 'Lista',
  dato: 'Dato clave',
  cita: 'Cita',
  agenda: 'Agenda',
}

/** Las que se agregan a mano (la agenda solo la trae su plantilla), en el orden del editor de AI Studio. */
export const CAPAS_PARA_AGREGAR: TipoCapa[] = ['texto', 'imagen', 'forma', 'badge', 'lista', 'dato', 'cita']

/** El fondo que trae cada plantilla (el de producción). */
export const FONDO_DE_PLANTILLA: Record<PlantillaCanvas, FondoCanvas> = {
  intro: 'degradado',
  split: 'claro',
  keypoint: 'claro',
  quote: 'oscuro',
  one_column: 'claro',
  two_columns: 'claro',
  steps: 'claro',
  agenda: 'oscuro',
  section: 'oscuro',
  title_only: 'oscuro',
}

/** ¿Va texto claro encima? Todos menos el claro. */
export const fondoOscuro = (fondo: FondoCanvas) => fondo !== 'claro'

let siguiente = 0
const nuevoId = (tipo: TipoCapa) => `capa-${tipo}-${Date.now().toString(36)}-${(siguiente++).toString(36)}`
const caja = (x: number, y: number, w: number, h: number, rot = 0): Caja => ({ x, y, w, h, rot })

type Generada = Omit<Capa, 'id'>

const texto = (campo: keyof CamposCanvas, estilo: EstiloTexto, c: Caja, campos: CamposCanvas): Generada | null => {
  const valor = campos[campo]
  return typeof valor === 'string' && valor.trim() ? { tipo: 'texto', estilo, texto: valor, campo, caja: c } : null
}
const imagen = (c: Caja, src: string): Generada => ({ tipo: 'imagen', src, caja: c })

/**
 * Las capas de una plantilla con sus campos, de atrás hacia adelante (la última se pinta encima). Las cajas son las
 * del editor de AI Studio (ver docs-temporales/editor-video-canvas-referente.md); un texto vacío no genera capa.
 */
export function generarCapas(plantilla: PlantillaCanvas, campos: CamposCanvas, foto: string): Capa[] {
  const capas: (Generada | null)[] = (() => {
    switch (plantilla) {
      case 'intro':
        return [
          texto('subtitulo', 'antetitulo', caja(6, 32, 40, 6), campos),
          texto('titulo', 'titulo', caja(6, 40, 40, 18), campos),
          texto('cuerpo', 'cuerpo', caja(6, 60, 38, 12), campos),
          { tipo: 'forma', relleno: 'blanco', caja: caja(50, 12, 42, 72, -11) },
          imagen(caja(52, 12, 40, 76), foto),
          // El badge va siempre, como en producción: con la credencial si la hay o, si no, con un texto de muestra
          // (repetir el antetítulo o la etiqueta interna, «Portada», no decía nada).
          {
            tipo: 'badge',
            titulo: campos.credencialTitulo?.trim() || 'Punto de partida',
            subtitulo: campos.credencialSubtitulo?.trim() || 'Lo esencial en pocos minutos',
            campo: 'credencialTitulo',
            caja: caja(60, 70, 32, 14),
          },
        ]
      case 'split':
        return [imagen(caja(6, 14, 42, 72), foto), texto('titulo', 'titulo', caja(52, 34, 40, 16), campos), texto('cuerpo', 'cuerpo', caja(52, 52, 40, 16), campos)]
      case 'keypoint':
        return [
          texto('titulo', 'titulo', caja(8, 14, 50, 12), campos),
          campos.dato?.trim() ? { tipo: 'dato', valor: campos.dato, etiqueta: '', campo: 'dato', caja: caja(8, 30, 50, 34) } : null,
          texto('afirmacion', 'subtitulo', caja(8, 66, 50, 12), campos),
          texto('cuerpo', 'cuerpo', caja(8, 78, 50, 10), campos),
          imagen(caja(62, 14, 32, 72), foto),
        ]
      case 'quote':
        return [
          campos.cuerpo?.trim() ? { tipo: 'cita', cita: campos.cuerpo, autor: campos.autor ?? '', campo: 'cuerpo', caja: caja(8, 14, 84, 50) } : null,
          imagen(caja(8, 68, 84, 22), foto),
        ]
      case 'one_column':
        return [
          imagen(caja(8, 8, 84, 24), foto),
          texto('titulo', 'titulo', caja(8, 36, 84, 12), campos),
          texto('cuerpo', 'cuerpo', caja(8, 50, 84, 22), campos),
          texto('destacado', 'subtitulo', caja(8, 74, 84, 12), campos),
        ]
      case 'two_columns':
        return [
          texto('titulo', 'titulo', caja(8, 12, 84, 12), campos),
          texto('cuerpo', 'cuerpo', caja(8, 24, 84, 8), campos),
          texto('col1Titulo', 'subtitulo', caja(8, 38, 38, 8), campos),
          texto('col1Cuerpo', 'cuerpo', caja(8, 48, 38, 34), campos),
          texto('col2Titulo', 'subtitulo', caja(54, 38, 38, 8), campos),
          texto('col2Cuerpo', 'cuerpo', caja(54, 48, 38, 34), campos),
        ]
      case 'steps':
        return [
          imagen(caja(6, 14, 34, 72), foto),
          texto('titulo', 'titulo', caja(46, 16, 48, 12), campos),
          campos.vinetas?.length ? { tipo: 'lista', items: [...campos.vinetas], campo: 'vinetas', caja: caja(46, 32, 48, 52) } : null,
        ]
      case 'agenda':
        return [
          texto('titulo', 'titulo', caja(8, 12, 70, 12), campos),
          texto('cuerpo', 'cuerpo', caja(8, 24, 84, 8), campos),
          campos.items?.length ? { tipo: 'agenda', agenda: campos.items.map((i) => ({ ...i })), campo: 'items', caja: caja(8, 36, 84, 52) } : null,
        ]
      case 'section':
        return [
          imagen(caja(0, 0, 100, 58), foto),
          { tipo: 'forma', relleno: 'oscuro', caja: caja(0, 54, 100, 46) },
          texto('numero', 'titulo', caja(8, 60, 12, 14), campos),
          texto('subtitulo', 'antetitulo', caja(22, 62, 40, 6), campos),
          texto('titulo', 'titulo', caja(22, 68, 70, 14), campos),
          texto('cuerpo', 'cuerpo', caja(22, 84, 70, 10), campos),
        ]
      case 'title_only':
        return [
          texto('titulo', 'afirmacion', caja(12, 30, 76, 28), campos),
          // El cuerpo, centrado como la afirmación que acompaña.
          ...[texto('cuerpo', 'cuerpo', caja(12, 62, 76, 12), campos)].map((c) => (c ? { ...c, alinear: 'centro' as const } : c)),
        ]
    }
  })()
  // Identificadores fijos (plantilla y lugar): las capas generadas se vuelven a calcular en cada cuadro y tienen que
  // poder elegirse antes de que el creador las guarde.
  return capas.filter((c): c is Generada => c !== null).map((c, i) => ({ ...c, dePlantilla: true, id: `${plantilla}-${i}-${c.tipo}` }))
}

/**
 * Lo que se lleva una plantilla nueva de las capas que el creador ya tenía: cada texto vuelve a su campo, así el título
 * sigue siendo el título aunque cambie de sitio. Lo agregado a mano no tiene campo: viaja aparte (ver enOtraPlantilla).
 */
export function camposDeCapas(capas: Capa[], base: CamposCanvas): CamposCanvas {
  const campos: CamposCanvas = { ...base }
  for (const c of capas) {
    if (!c.campo) continue
    if (c.tipo === 'texto' && c.texto != null) (campos as Record<string, unknown>)[c.campo] = c.texto
    if (c.tipo === 'dato' && c.valor != null) campos.dato = c.valor
    if (c.tipo === 'cita') {
      campos.cuerpo = c.cita ?? campos.cuerpo
      campos.autor = c.autor ?? campos.autor
    }
    if (c.tipo === 'badge') {
      campos.credencialTitulo = c.titulo ?? campos.credencialTitulo
      campos.credencialSubtitulo = c.subtitulo ?? campos.credencialSubtitulo
    }
    if (c.tipo === 'lista' && c.items) campos.vinetas = c.items
    if (c.tipo === 'agenda' && c.agenda) campos.items = c.agenda
  }
  return campos
}

/**
 * Una capa nueva, agregada a mano, con su contenido de ejemplo. `n` es cuántas hay ya: cada una entra un poco más abajo
 * y a la derecha que la anterior, así varias seguidas no quedan apiladas en el mismo punto.
 */
export function capaNueva(tipo: TipoCapa, foto: string, n = 0): Capa {
  const capa = capaBase(tipo, foto)
  const corrido = (n % 5) * 7
  return { ...capa, caja: ajustarCaja({ ...capa.caja, x: capa.caja.x - 14 + corrido, y: capa.caja.y - 14 + corrido }) }
}

function capaBase(tipo: TipoCapa, foto: string): Capa {
  const id = nuevoId(tipo)
  switch (tipo) {
    case 'texto':
      return { id, tipo, estilo: 'cuerpo', texto: 'Nuevo texto', caja: caja(30, 44, 40, 12) }
    case 'imagen':
      return { id, tipo, src: foto, caja: caja(35, 25, 30, 50) }
    case 'forma':
      return { id, tipo, relleno: 'acento', caja: caja(40, 35, 20, 30) }
    case 'badge':
      return { id, tipo, titulo: 'Título del badge', subtitulo: 'Una línea de apoyo', caja: caja(34, 42, 32, 14) }
    case 'lista':
      return { id, tipo, items: ['Primer punto', 'Segundo punto', 'Tercer punto'], caja: caja(30, 30, 40, 40) }
    case 'dato':
      return { id, tipo, valor: '85%', etiqueta: 'Etiqueta del dato', caja: caja(35, 30, 30, 34) }
    case 'cita':
      return { id, tipo, cita: 'Una frase que resume la idea.', autor: 'Autor', caja: caja(20, 30, 60, 36) }
    case 'agenda':
      return { id, tipo, agenda: [{ titulo: 'Tema', desc: 'Descripción del bloque' }], caja: caja(20, 30, 60, 40) }
  }
}

const redondear = (n: number) => Math.round(n * 10) / 10

/** Cuánto de una capa tiene que quedar siempre dentro del lienzo, en %: se puede sacar a sangre, no perder. */
const A_LA_VISTA = 5

/**
 * La caja con los números a una décima y una sola regla para el panel, las flechas y el arrastre: la capa puede salirse
 * del lienzo, pero siempre deja un 5 % a la vista (si no, desaparecía y solo quedaban sus asas en el borde).
 */
export const ajustarCaja = (c: Caja): Caja => {
  const w = Math.min(150, Math.max(2, c.w))
  const h = Math.min(150, Math.max(2, c.h))
  return {
    x: redondear(Math.min(100 - A_LA_VISTA, Math.max(A_LA_VISTA - w, c.x))),
    y: redondear(Math.min(100 - A_LA_VISTA, Math.max(A_LA_VISTA - h, c.y))),
    w: redondear(w),
    h: redondear(h),
    rot: Math.round(((((c.rot + 180) % 360) + 360) % 360) - 180),
  }
}

/** Mueve la capa a la posición `hacia` dentro de la lista (0 = al fondo). */
export function moverCapa(capas: Capa[], id: string, hacia: number): Capa[] {
  const desde = capas.findIndex((c) => c.id === id)
  if (desde < 0) return capas
  const lista = [...capas]
  const [capa] = lista.splice(desde, 1)
  lista.splice(Math.max(0, Math.min(lista.length, hacia)), 0, capa)
  return lista
}

/** Lo que se lee de una capa en la lista: su texto, su título o el nombre del archivo. */
export function resumenCapa(c: Capa): string | null {
  switch (c.tipo) {
    case 'texto':
      return c.texto?.trim() || null
    case 'badge':
      return c.titulo?.trim() || null
    case 'lista':
      return c.items?.[0]?.trim() || null
    case 'dato':
      return c.valor?.trim() || null
    case 'cita':
      return c.cita?.trim() || null
    case 'agenda':
      return c.agenda?.[0]?.titulo?.trim() || null
    case 'imagen':
      return c.src ? (c.src.startsWith('data:') ? 'archivo subido' : (c.src.split('/').pop() ?? null)) : null
    default:
      return null
  }
}

/** Las capas que se ven en una escena: las que guardó el creador o, si no tocó ninguna, las de su plantilla. */
export const capasDe = (canvas: { plantilla: PlantillaCanvas; campos: CamposCanvas; capasLibres?: Capa[] }, foto: string): Capa[] =>
  canvas.capasLibres ?? generarCapas(canvas.plantilla, canvas.campos, foto)

/** El fondo vigente: el elegido o el de la plantilla. */
export const fondoDe = (canvas: { plantilla: PlantillaCanvas; fondo?: FondoCanvas }): FondoCanvas => canvas.fondo ?? FONDO_DE_PLANTILLA[canvas.plantilla]

/** Mezcla dos colores hex (sin `#`): `t` = cuánto del segundo. Es como se arman el oscuro y el suave del acento. */
export function mezclar(a: string, b: string, t: number): string {
  const canal = (hex: string, i: number) => parseInt(hex.replace('#', '').slice(i, i + 2), 16)
  return [0, 2, 4].map((i) => Math.round(canal(a, i) * (1 - t) + canal(b, i) * t).toString(16).padStart(2, '0')).join('')
}

/**
 * El color que tiene de verdad una capa sin color propio, para mostrarlo en su selector: el de su relleno (forma) o el
 * que le toca por su estilo y el fondo (texto). Hex sin `#`.
 */
export function colorVigente(capa: Capa, fondo: FondoCanvas, acentoHex: string): string {
  const blanco = 'ffffff'
  const negro = '000000'
  if (capa.tipo === 'forma') {
    const relleno = capa.relleno ?? 'acento'
    if (relleno === 'blanco') return blanco
    if (relleno === 'oscuro') return mezclar(acentoHex, negro, 0.8)
    if (relleno === 'tinte') return mezclar(blanco, acentoHex, 0.2)
    return acentoHex.replace('#', '')
  }
  const oscuro = fondoOscuro(fondo)
  if (capa.estilo === 'antetitulo' && !oscuro) return acentoHex.replace('#', '')
  return oscuro ? blanco : mezclar(blanco, negro, 0.9)
}

/**
 * El canvas en otra plantilla: conserva el contenido compatible y vuelve a generar las capas, como en el editor de AI
 * Studio. Los textos de las capas vuelven a sus campos (el título sigue siendo el título) y la plantilla nueva los
 * acomoda con sus medidas; lo agregado a mano y lo que se movió no viaja, y el fondo vuelve al de la plantilla. Lo usan
 * elegir plantilla y sus miniaturas, para que la miniatura muestre exactamente lo que va a pasar.
 */
export function enOtraPlantilla<T extends { plantilla: PlantillaCanvas; campos: CamposCanvas; capasLibres?: Capa[]; fondo?: FondoCanvas; idea: string | null }>(
  canvas: T,
  plantilla: PlantillaCanvas,
  base: CamposCanvas,
  foto: string,
): T {
  const conocidos = { ...base, ...canvas.campos }
  const campos = canvas.capasLibres ? camposDeCapas(canvas.capasLibres, conocidos) : conocidos
  // Lo agregado a mano viaja tal cual, encima de lo que genera la plantilla nueva: borrarlo sin avisar era perder trabajo.
  const aMano = (canvas.capasLibres ?? []).filter((c) => !c.dePlantilla)
  const capasLibres = aMano.length ? [...generarCapas(plantilla, campos, foto), ...aMano] : undefined
  return { ...canvas, plantilla, campos, capasLibres, fondo: undefined, posicionImagen: undefined, capas: undefined }
}
