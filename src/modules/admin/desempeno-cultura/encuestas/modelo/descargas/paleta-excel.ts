/**
 * Los colores de los libros de Excel, leídos del tema.
 *
 * SpreadsheetML solo entiende colores hexadecimales, pero el playground no admite
 * colores escritos en el código: todo color sale de los tokens del tema. Así que
 * la paleta se resuelve en el navegador, en el momento de generar el archivo —
 * cada token se pinta sobre un elemento temporal, se lee su color calculado y se
 * pasa por un canvas de 1×1 para obtener el rojo, el verde y el azul.
 *
 * El archivo siempre sale con los valores del tema claro: un Excel se abre sobre
 * fondo blanco, y unas bandas pensadas para el modo oscuro se leerían mal. Por
 * eso, mientras se resuelve, se quita el modo oscuro de la raíz y se devuelve en
 * el mismo instante, sin que el navegador llegue a repintar.
 */

export type ColorExcel =
  | 'tinta'
  | 'marca'
  | 'marcaOscura'
  | 'sobreMarca'
  | 'pista'
  | 'borde'
  | 'cebra'
  | 'b1Texto'
  | 'b1Fondo'
  | 'b2Texto'
  | 'b2Fondo'
  | 'b3Texto'
  | 'b3Fondo'
  | 'b4Texto'
  | 'b4Fondo'
  | 'b5Texto'
  | 'b5Fondo'
  | 'nsnrTexto'
  | 'nsnrFondo'
  | 'positivoTexto'
  | 'positivoFondo'
  | 'neutroTexto'
  | 'neutroFondo'
  | 'negativoTexto'
  | 'negativoFondo'

export type PaletaExcel = Readonly<Record<ColorExcel, string>>

type Rgb = readonly [number, number, number]

/**
 * La expresión CSS de cada color. Las bandas 1 a 5 van del rojo fuerte al verde
 * fuerte, igual que la escala de favorabilidad de la pantalla; los fondos son el
 * mismo token mezclado con blanco, para que el texto encima siga leyéndose.
 */
const EXPRESIONES: Readonly<Record<ColorExcel, string>> = {
  tinta: 'var(--foreground)',
  marca: 'var(--primary)',
  marcaOscura: 'color-mix(in srgb, var(--primary) 78%, black)',
  sobreMarca: 'var(--primary-foreground)',
  pista: 'var(--muted-foreground)',
  borde: 'var(--border)',
  cebra: 'var(--muted)',
  b1Texto: 'color-mix(in srgb, var(--destructive) 80%, black)',
  b1Fondo: 'color-mix(in srgb, var(--destructive) 28%, white)',
  b2Texto: 'var(--destructive)',
  b2Fondo: 'color-mix(in srgb, var(--destructive) 12%, white)',
  b3Texto: 'color-mix(in srgb, var(--warning) 55%, black)',
  b3Fondo: 'color-mix(in srgb, var(--warning) 22%, white)',
  b4Texto: 'color-mix(in srgb, var(--success) 80%, black)',
  b4Fondo: 'color-mix(in srgb, var(--success) 16%, white)',
  b5Texto: 'color-mix(in srgb, var(--success) 55%, black)',
  b5Fondo: 'color-mix(in srgb, var(--success) 34%, white)',
  nsnrTexto: 'var(--muted-foreground)',
  nsnrFondo: 'color-mix(in srgb, var(--muted-foreground) 16%, white)',
  positivoTexto: 'color-mix(in srgb, var(--success) 70%, black)',
  positivoFondo: 'color-mix(in srgb, var(--success) 18%, white)',
  neutroTexto: 'color-mix(in srgb, var(--warning) 60%, black)',
  neutroFondo: 'color-mix(in srgb, var(--warning) 20%, white)',
  negativoTexto: 'color-mix(in srgb, var(--destructive) 85%, black)',
  negativoFondo: 'color-mix(in srgb, var(--destructive) 12%, white)',
}

/**
 * Lo que sale si no hay navegador donde resolver el tema (un script de prueba,
 * un entorno sin canvas). Son los valores del prototipo en rojo, verde y azul,
 * para que el archivo conserve su lectura aunque no siga al tema.
 */
const RESPALDO: Readonly<Record<ColorExcel, Rgb>> = {
  tinta: [26, 31, 46],
  marca: [12, 91, 239],
  marcaOscura: [10, 71, 184],
  sobreMarca: [255, 255, 255],
  pista: [107, 114, 128],
  borde: [237, 240, 244],
  cebra: [244, 247, 251],
  b1Texto: [176, 42, 55],
  b1Fondo: [246, 198, 203],
  b2Texto: [217, 83, 95],
  b2Fondo: [251, 227, 229],
  b3Texto: [143, 100, 0],
  b3Fondo: [251, 242, 196],
  b4Texto: [62, 142, 65],
  b4Fondo: [225, 242, 221],
  b5Texto: [44, 107, 47],
  b5Fondo: [191, 230, 195],
  nsnrTexto: [90, 100, 114],
  nsnrFondo: [233, 236, 239],
  positivoTexto: [21, 128, 61],
  positivoFondo: [220, 252, 231],
  neutroTexto: [161, 98, 7],
  neutroFondo: [254, 249, 195],
  negativoTexto: [185, 28, 28],
  negativoFondo: [254, 226, 226],
}

const MAX_CANAL = 255

const aHex = ([r, g, b]: Rgb): string =>
  '#' +
  [r, g, b]
    .map((canal) => Math.round(canal).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()

/** Un color con transparencia se compone sobre blanco, que es el fondo del Excel. */
const sobreBlanco = (canal: number, alfa: number): number => canal * alfa + MAX_CANAL * (1 - alfa)

/** Lee el rojo, el verde y el azul de un color CSS ya calculado, o null si el canvas no lo entiende. */
function rgbDe(contexto: CanvasRenderingContext2D, color: string): Rgb | null {
  contexto.clearRect(0, 0, 1, 1)
  contexto.fillStyle = 'transparent'
  contexto.fillStyle = color
  contexto.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = contexto.getImageData(0, 0, 1, 1).data
  if (a === 0) return null
  const alfa = a / MAX_CANAL
  return [sobreBlanco(r, alfa), sobreBlanco(g, alfa), sobreBlanco(b, alfa)]
}

const ATRIBUTO_MODO = 'data-mode'

/**
 * Corre `resolver` con el tema claro puesto en la raíz y en el body, y deja
 * ambos como estaban. flux-ui marca el oscuro con la clase `dark` y con
 * `data-mode="dark"` en los dos elementos, así que se apagan las dos cosas.
 */
function conTemaClaro<T>(resolver: () => T): T {
  const elementos = [document.documentElement, document.body].filter((el): el is HTMLElement => Boolean(el))
  const previos = elementos.map((el) => ({
    el,
    oscuro: el.classList.contains('dark'),
    modo: el.getAttribute(ATRIBUTO_MODO),
  }))
  for (const { el } of previos) {
    el.classList.remove('dark')
    if (el.hasAttribute(ATRIBUTO_MODO)) el.setAttribute(ATRIBUTO_MODO, 'light')
  }
  try {
    return resolver()
  } finally {
    for (const { el, oscuro, modo } of previos) {
      if (oscuro) el.classList.add('dark')
      if (modo !== null) el.setAttribute(ATRIBUTO_MODO, modo)
    }
  }
}

const paletaDeRespaldo = (): PaletaExcel => Object.fromEntries((Object.keys(RESPALDO) as ColorExcel[]).map((clave) => [clave, aHex(RESPALDO[clave])])) as PaletaExcel

/**
 * La paleta del libro, resuelta contra el tema claro de la página.
 *
 * Se calcula en cada llamada — un libro la pide una sola vez al armar sus
 * estilos — y cae en los valores de respaldo, color por color, cuando el
 * navegador no puede resolver alguno.
 */
export function paletaExcel(): PaletaExcel {
  if (typeof document === 'undefined' || !document.body) return paletaDeRespaldo()

  const lienzo = document.createElement('canvas')
  lienzo.width = 1
  lienzo.height = 1
  const contexto = lienzo.getContext('2d', { willReadFrequently: true })
  if (!contexto) return paletaDeRespaldo()

  return conTemaClaro(() => {
    const muestra = document.createElement('span')
    muestra.style.display = 'none'
    document.body.appendChild(muestra)
    try {
      const entradas = (Object.keys(EXPRESIONES) as ColorExcel[]).map((clave) => {
        muestra.style.color = ''
        muestra.style.color = EXPRESIONES[clave]
        const calculado = muestra.style.color ? getComputedStyle(muestra).color : ''
        const rgb = calculado ? rgbDe(contexto, calculado) : null
        return [clave, aHex(rgb ?? RESPALDO[clave])] as const
      })
      return Object.fromEntries(entradas) as PaletaExcel
    } finally {
      muestra.remove()
    }
  })
}
