// El QR de una encuesta, sin librerías: el proyecto no trae ninguna y sumar una toca el andamiaje. Codifica el enlace en
// modo byte con corrección media (M, aguanta ~15 % de daño: sirve impreso) y versiones 1 a 10 (hasta 213 caracteres, de
// sobra para un enlace). Sigue el estándar ISO/IEC 18004 en la forma de la implementación de referencia de Nayuki.

const ECC_POR_BLOQUE = [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26]
const BLOQUES = [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5]
const VERSION_MAXIMA = 10
const CORRECCION_M = 0

const modulosDeDatos = (version: number): number => {
  let total = (16 * version + 128) * version + 64
  if (version >= 2) {
    const alineaciones = Math.floor(version / 7) + 2
    total -= (25 * alineaciones - 10) * alineaciones - 55
    if (version >= 7) total -= 36
  }
  return total
}

const palabrasDeDatos = (version: number): number => Math.floor(modulosDeDatos(version) / 8) - ECC_POR_BLOQUE[version] * BLOQUES[version]

// Aritmética del campo de Galois GF(256) con el polinomio 0x11D, la del estándar.
const multiplicar = (x: number, y: number): number => {
  let z = 0
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d)
    z ^= ((y >>> i) & 1) * x
  }
  return z & 0xff
}

const divisor = (grado: number): number[] => {
  const resultado: number[] = Array.from({ length: grado }, (_, i) => (i === grado - 1 ? 1 : 0))
  let raiz = 1
  for (let i = 0; i < grado; i++) {
    for (let j = 0; j < resultado.length; j++) {
      resultado[j] = multiplicar(resultado[j], raiz)
      if (j + 1 < resultado.length) resultado[j] ^= resultado[j + 1]
    }
    raiz = multiplicar(raiz, 0x02)
  }
  return resultado
}

const residuo = (datos: readonly number[], div: readonly number[]): number[] => {
  const resultado = div.map(() => 0)
  for (const byte of datos) {
    const factor = byte ^ (resultado.shift() as number)
    resultado.push(0)
    div.forEach((coef, i) => (resultado[i] ^= multiplicar(coef, factor)))
  }
  return resultado
}

/** Los bytes del enlace con su encabezado, el relleno y la corrección intercalada por bloques. */
function palabras(texto: string): { version: number; palabras: number[] } {
  const bytes = Array.from(new TextEncoder().encode(texto))
  let version = 1
  for (; version <= VERSION_MAXIMA; version++) {
    const bitsLargo = version < 10 ? 8 : 16
    if (4 + bitsLargo + bytes.length * 8 <= palabrasDeDatos(version) * 8) break
  }
  if (version > VERSION_MAXIMA) throw new Error('El enlace es demasiado largo para el QR.')

  const capacidad = palabrasDeDatos(version) * 8
  const bits: number[] = []
  const poner = (valor: number, largo: number) => {
    for (let i = largo - 1; i >= 0; i--) bits.push((valor >>> i) & 1)
  }
  poner(0b0100, 4)
  poner(bytes.length, version < 10 ? 8 : 16)
  bytes.forEach((byte) => poner(byte, 8))
  poner(0, Math.min(4, capacidad - bits.length))
  poner(0, (8 - (bits.length % 8)) % 8)
  for (let relleno = 0xec; bits.length < capacidad; relleno ^= 0xec ^ 0x11) poner(relleno, 8)

  const datos: number[] = []
  for (let i = 0; i < bits.length; i += 8) datos.push(bits.slice(i, i + 8).reduce((acc, bit) => (acc << 1) | bit, 0))

  const bloques = BLOQUES[version]
  const ecc = ECC_POR_BLOQUE[version]
  const totalPalabras = Math.floor(modulosDeDatos(version) / 8)
  const cortos = bloques - (totalPalabras % bloques)
  const largoCorto = Math.floor(totalPalabras / bloques)
  const div = divisor(ecc)
  const partes: number[][] = []
  for (let i = 0, k = 0; i < bloques; i++) {
    const dato = datos.slice(k, k + largoCorto - ecc + (i < cortos ? 0 : 1))
    k += dato.length
    const conEcc = [...dato, ...residuo(dato, div)]
    // Los bloques cortos llevan un hueco para intercalar parejo con los largos.
    if (i < cortos) conEcc.splice(dato.length, 0, -1)
    partes.push(conEcc)
  }
  const salida: number[] = []
  for (let i = 0; i < partes[0].length; i++) partes.forEach((parte) => (parte[i] !== -1 ? salida.push(parte[i]) : undefined))
  return { version, palabras: salida.filter((_, i) => i < totalPalabras) }
}

const posicionesAlineacion = (version: number, lado: number): number[] => {
  if (version === 1) return []
  const cuantas = Math.floor(version / 7) + 2
  const paso = Math.ceil((version * 4 + 4) / (cuantas * 2 - 2)) * 2
  const resultado = [6]
  for (let pos = lado - 7; resultado.length < cuantas; pos -= paso) resultado.splice(1, 0, pos)
  return resultado
}

const MASCARAS: ((x: number, y: number) => boolean)[] = [
  (x, y) => (x + y) % 2 === 0,
  (_x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
]

/** La matriz del QR: `true` es un módulo oscuro. Elige la máscara con menos penalización, como pide el estándar. */
export function matrizQr(texto: string): boolean[][] {
  const { version, palabras: codigo } = palabras(texto)
  const lado = version * 4 + 17
  const nueva = () => Array.from({ length: lado }, () => Array<boolean>(lado).fill(false))
  const base = nueva()
  const fija = nueva()
  const poner = (x: number, y: number, oscuro: boolean) => {
    base[y][x] = oscuro
    fija[y][x] = true
  }

  for (let i = 0; i < lado; i++) {
    poner(6, i, i % 2 === 0)
    poner(i, 6, i % 2 === 0)
  }
  for (const [cx, cy] of [[3, 3], [lado - 4, 3], [3, lado - 4]]) {
    for (let dy = -4; dy <= 4; dy++)
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx
        const y = cy + dy
        if (x < 0 || y < 0 || x >= lado || y >= lado) continue
        const d = Math.max(Math.abs(dx), Math.abs(dy))
        poner(x, y, d !== 2 && d !== 4)
      }
  }
  const alineacion = posicionesAlineacion(version, lado)
  alineacion.forEach((ax, i) =>
    alineacion.forEach((ay, j) => {
      const esquina = (i === 0 && j === 0) || (i === 0 && j === alineacion.length - 1) || (i === alineacion.length - 1 && j === 0)
      if (esquina) return
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) poner(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1)
    }),
  )

  const formato = (matriz: boolean[][], mascara: number) => {
    const dato = (CORRECCION_M << 3) | mascara
    let rem = dato
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537)
    const bits = ((dato << 10) | rem) ^ 0x5412
    const bit = (i: number) => ((bits >>> i) & 1) !== 0
    for (let i = 0; i <= 5; i++) matriz[i][8] = bit(i)
    matriz[7][8] = bit(6)
    matriz[8][8] = bit(7)
    matriz[8][7] = bit(8)
    for (let i = 9; i < 15; i++) matriz[8][14 - i] = bit(i)
    for (let i = 0; i < 8; i++) matriz[8][lado - 1 - i] = bit(i)
    for (let i = 8; i < 15; i++) matriz[lado - 15 + i][8] = bit(i)
    matriz[lado - 8][8] = true
  }
  // Se reserva el formato (y la versión desde la 7) antes de colocar los datos.
  formato(base, 0)
  for (let i = 0; i <= 8; i++) {
    fija[i][8] = true
    fija[8][i] = true
    fija[8][lado - 1 - Math.min(i, 7)] = true
    fija[lado - 1 - Math.min(i, 7)][8] = true
  }
  if (version >= 7) {
    let rem = version
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25)
    const bits = (version << 12) | rem
    for (let i = 0; i < 18; i++) {
      const oscuro = ((bits >>> i) & 1) !== 0
      const a = lado - 11 + (i % 3)
      const b = Math.floor(i / 3)
      poner(a, b, oscuro)
      poner(b, a, oscuro)
    }
  }

  // Los datos en zigzag, de dos columnas en dos, de abajo hacia arriba y vuelta.
  let i = 0
  for (let derecha = lado - 1; derecha >= 1; derecha -= 2) {
    if (derecha === 6) derecha = 5
    for (let v = 0; v < lado; v++)
      for (let j = 0; j < 2; j++) {
        const x = derecha - j
        const subiendo = ((derecha + 1) & 2) === 0
        const y = subiendo ? lado - 1 - v : v
        if (fija[y][x] || i >= codigo.length * 8) continue
        base[y][x] = ((codigo[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0
        i++
      }
  }

  let mejor: boolean[][] = base
  let menor = Infinity
  MASCARAS.forEach((mascara, m) => {
    const matriz = base.map((fila, y) => fila.map((oscuro, x) => (fija[y][x] ? oscuro : oscuro !== mascara(x, y))))
    formato(matriz, m)
    const puntos = penalizacion(matriz)
    if (puntos < menor) {
      menor = puntos
      mejor = matriz
    }
  })
  return mejor
}

function penalizacion(matriz: readonly boolean[][]): number {
  const lado = matriz.length
  let puntos = 0
  const lineas = [...matriz, ...matriz.map((_, x) => matriz.map((fila) => fila[x]))]
  for (const linea of lineas) {
    let racha = 1
    for (let i = 1; i <= lado; i++) {
      if (i < lado && linea[i] === linea[i - 1]) racha++
      else {
        if (racha >= 5) puntos += racha - 2
        racha = 1
      }
    }
    const texto = linea.map((oscuro) => (oscuro ? '1' : '0')).join('')
    puntos += 40 * (texto.split('10111010000').length - 1 + texto.split('00001011101').length - 1)
  }
  for (let y = 0; y < lado - 1; y++)
    for (let x = 0; x < lado - 1; x++) {
      const c = matriz[y][x]
      if (c === matriz[y][x + 1] && c === matriz[y + 1][x] && c === matriz[y + 1][x + 1]) puntos += 3
    }
  const oscuros = matriz.reduce((acc, fila) => acc + fila.filter(Boolean).length, 0)
  puntos += Math.floor(Math.abs(oscuros * 20 - lado * lado * 10) / (lado * lado)) * 10
  return puntos
}

/** Dibuja el QR en PNG, con su margen blanco de cuatro módulos, y lo descarga. */
export async function descargarQrPng(texto: string, nombreArchivo: string): Promise<void> {
  const matriz = matrizQr(texto)
  const margen = 4
  const escala = 12
  const lienzo = document.createElement('canvas')
  lienzo.width = lienzo.height = (matriz.length + margen * 2) * escala
  const ctx = lienzo.getContext('2d')
  if (!ctx) throw new Error('El navegador no pudo dibujar el QR.')
  // Es la imagen que se imprime, no la interfaz: blanco y negro puros (sin tokens del tema, que cambian con el modo oscuro)
  // para que cualquier lector la lea.
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, lienzo.width, lienzo.height)
  ctx.fillStyle = 'black'
  matriz.forEach((fila, y) => fila.forEach((oscuro, x) => (oscuro ? ctx.fillRect((x + margen) * escala, (y + margen) * escala, escala, escala) : undefined)))
  const blob = await new Promise<Blob | null>((resolver) => lienzo.toBlob(resolver, 'image/png'))
  if (!blob) throw new Error('El navegador no pudo crear la imagen del QR.')
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreArchivo
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  URL.revokeObjectURL(url)
}
