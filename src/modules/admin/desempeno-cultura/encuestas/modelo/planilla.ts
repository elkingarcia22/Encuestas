/**
 * Lectura de planillas (.csv y .xlsx) sin librerías externas.
 *
 * El prototipo usaba SheetJS; el playground no admite dependencias nuevas, así que esto lee los dos
 * formatos con lo que ya trae el navegador. Un .xlsx es un zip con XML adentro: se recorre el
 * directorio del zip, se descomprime con `DecompressionStream` y se leen las celdas con `DOMParser`.
 * `leerPlanilla` lee solo la primera hoja, que es lo que usan los importadores del módulo;
 * `leerLibro` devuelve todas las hojas con su nombre real, para la carga histórica de encuestas.
 *
 * Devuelve la planilla como filas de texto, la primera con los encabezados. Un archivo que no se
 * puede leer lanza un error: el importador lo distingue de uno válido pero vacío.
 */

export type Filas = string[][]

/** Lee un .csv o un .xlsx. Lanza si el archivo no es una planilla legible. */
export async function leerPlanilla(archivo: File): Promise<Filas> {
  const nombre = archivo.name.toLowerCase()
  if (nombre.endsWith('.xlsx')) return leerXlsx(await archivo.arrayBuffer())
  const texto = await archivo.text()
  // Un binario con extensión .csv (p. ej. una imagen renombrada) trae caracteres de control.
  if (tieneCaracteresDeControl(texto.slice(0, 2000))) throw new Error('Archivo no válido')
  return leerCsv(texto)
}

// Caracteres de control que no aparecen en un texto (se permiten tabulador y saltos de línea).
function tieneCaracteresDeControl(texto: string): boolean {
  for (let i = 0; i < texto.length; i++) {
    const codigo = texto.charCodeAt(i)
    if (codigo < 32 && codigo !== 9 && codigo !== 10 && codigo !== 13) return true
  }
  return false
}

/** Una hoja del libro con su nombre tal como aparece en Excel. */
export type Hoja = { nombre: string; filas: Filas }

/**
 * Lee un .csv o un .xlsx con todas sus hojas. Un .csv es una sola hoja que se llama como el
 * archivo sin la extensión. A diferencia de `leerPlanilla`, las filas vacías se conservan: cada
 * fila queda en su posición real (índice 0 = fila 1), porque los reportes exportados ubican sus
 * datos por posición. Lanza si el archivo no es una planilla legible.
 */
export async function leerLibro(archivo: File): Promise<Hoja[]> {
  const nombre = archivo.name.toLowerCase()
  if (nombre.endsWith('.xlsx')) return leerHojasXlsx(await archivo.arrayBuffer())
  const texto = await archivo.text()
  if (tieneCaracteresDeControl(texto.slice(0, 2000))) throw new Error('Archivo no válido')
  return [{ nombre: archivo.name.replace(/\.[^.]+$/, ''), filas: leerCsv(texto, true) }]
}

/**
 * CSV con comas o punto y coma, comillas dobles y saltos de línea dentro de comillas. Con
 * `conservarVacias`, las líneas vacías quedan como filas vacías en vez de descartarse.
 */
export function leerCsv(texto: string, conservarVacias = false): Filas {
  const limpio = texto.replace(/^﻿/, '')
  const primeraLinea = limpio.split(/\r?\n/, 1)[0] ?? ''
  const separador = (primeraLinea.match(/;/g)?.length ?? 0) > (primeraLinea.match(/,/g)?.length ?? 0) ? ';' : ','
  const filas: Filas = []
  let fila: string[] = []
  let celda = ''
  let entreComillas = false
  for (let i = 0; i < limpio.length; i++) {
    const caracter = limpio[i]
    if (entreComillas) {
      if (caracter === '"' && limpio[i + 1] === '"') {
        celda += '"'
        i++
      } else if (caracter === '"') entreComillas = false
      else celda += caracter
      continue
    }
    if (caracter === '"') entreComillas = true
    else if (caracter === separador) {
      fila.push(celda)
      celda = ''
    } else if (caracter === '\n' || caracter === '\r') {
      if (caracter === '\r' && limpio[i + 1] === '\n') i++
      fila.push(celda)
      filas.push(fila)
      fila = []
      celda = ''
    } else celda += caracter
  }
  if (celda !== '' || fila.length > 0) {
    fila.push(celda)
    filas.push(fila)
  }
  const recortadas = filas.map((actual) => actual.map((valor) => valor.trim()))
  return conservarVacias ? recortadas : recortadas.filter((actual) => actual.some((valor) => valor !== ''))
}

// ── .xlsx ──

type Entrada = { nombre: string; metodo: number; tamanoComprimido: number; desplazamiento: number }

function entradasZip(datos: DataView): Entrada[] {
  // El registro final del directorio central está al final del archivo (firma 0x06054b50).
  let fin = -1
  for (let i = datos.byteLength - 22; i >= Math.max(0, datos.byteLength - 65557); i--) {
    if (datos.getUint32(i, true) === 0x06054b50) {
      fin = i
      break
    }
  }
  if (fin < 0) throw new Error('Archivo no válido')
  const total = datos.getUint16(fin + 10, true)
  let posicion = datos.getUint32(fin + 16, true)
  const entradas: Entrada[] = []
  const decodificador = new TextDecoder()
  for (let n = 0; n < total; n++) {
    if (datos.getUint32(posicion, true) !== 0x02014b50) throw new Error('Archivo no válido')
    const metodo = datos.getUint16(posicion + 10, true)
    const tamanoComprimido = datos.getUint32(posicion + 20, true)
    const largoNombre = datos.getUint16(posicion + 28, true)
    const largoExtra = datos.getUint16(posicion + 30, true)
    const largoComentario = datos.getUint16(posicion + 32, true)
    const desplazamiento = datos.getUint32(posicion + 42, true)
    const nombre = decodificador.decode(new Uint8Array(datos.buffer, posicion + 46, largoNombre))
    entradas.push({ nombre, metodo, tamanoComprimido, desplazamiento })
    posicion += 46 + largoNombre + largoExtra + largoComentario
  }
  return entradas
}

async function contenido(buffer: ArrayBuffer, entrada: Entrada): Promise<string> {
  const datos = new DataView(buffer)
  const inicio = entrada.desplazamiento
  const largoNombre = datos.getUint16(inicio + 26, true)
  const largoExtra = datos.getUint16(inicio + 28, true)
  const bytes = new Uint8Array(buffer, inicio + 30 + largoNombre + largoExtra, entrada.tamanoComprimido)
  if (entrada.metodo === 0) return new TextDecoder().decode(bytes)
  const flujo = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  return new Response(flujo).text()
}

// «B12» → columna 1 (0 = A).
function columnaDe(referencia: string): number {
  const letras = referencia.replace(/\d+/g, '')
  let columna = 0
  for (const letra of letras) columna = columna * 26 + (letra.charCodeAt(0) - 64)
  return columna - 1
}

async function leerXlsx(buffer: ArrayBuffer): Promise<Filas> {
  const entradas = entradasZip(new DataView(buffer))
  const buscar = (nombre: string) => entradas.find((entrada) => entrada.nombre === nombre)
  const hoja = buscar('xl/worksheets/sheet1.xml') ?? entradas.find((entrada) => /^xl\/worksheets\/sheet\d+\.xml$/.test(entrada.nombre))
  if (!hoja) throw new Error('Archivo no válido')
  const compartidas = await textosCompartidos(buffer, entradas)
  return filasDeHoja(await contenido(buffer, hoja), compartidas)
}

// Los textos de las celdas viven aparte, en xl/sharedStrings.xml, y las hojas los citan por índice.
async function textosCompartidos(buffer: ArrayBuffer, entradas: Entrada[]): Promise<string[]> {
  const entrada = entradas.find((actual) => actual.nombre === 'xl/sharedStrings.xml')
  if (!entrada) return []
  const xml = new DOMParser().parseFromString(await contenido(buffer, entrada), 'application/xml')
  return Array.from(xml.getElementsByTagName('si')).map((si) =>
    Array.from(si.getElementsByTagName('t'))
      .map((t) => t.textContent ?? '')
      .join(''),
  )
}

function filasDeHoja(texto: string, compartidas: string[], conservarVacias = false): Filas {
  const xml = new DOMParser().parseFromString(texto, 'application/xml')
  if (xml.getElementsByTagName('parsererror').length > 0) throw new Error('Archivo no válido')
  const filas: Filas = []
  for (const fila of Array.from(xml.getElementsByTagName('row'))) {
    const valores: string[] = []
    for (const c of Array.from(fila.getElementsByTagName('c'))) {
      const tipo = c.getAttribute('t')
      const v = c.getElementsByTagName('v')[0]?.textContent ?? ''
      const texto =
        tipo === 's'
          ? (compartidas[Number(v)] ?? '')
          : tipo === 'inlineStr'
            ? Array.from(c.getElementsByTagName('t'))
                .map((t) => t.textContent ?? '')
                .join('')
            : v
      valores[columnaDe(c.getAttribute('r') ?? 'A1')] = texto.trim()
    }
    const completa = Array.from(valores, (valor) => valor ?? '')
    if (!conservarVacias) {
      filas.push(completa)
      continue
    }
    // El atributo r de la fila dice su número real (1 = primera); sin él, va a continuación.
    const numero = Number(fila.getAttribute('r'))
    filas[Number.isInteger(numero) && numero > filas.length ? numero - 1 : filas.length] = completa
  }
  return conservarVacias ? Array.from(filas, (fila) => fila ?? []) : filas.filter((fila) => fila.some((valor) => valor !== ''))
}

// Atributo por su nombre local, para no depender del prefijo del espacio de nombres (r:id).
function atributoLocal(elemento: Element, nombre: string): string | null {
  return Array.from(elemento.attributes).find((atributo) => atributo.localName === nombre)?.value ?? null
}

/**
 * Nombre y archivo de cada hoja, en el orden del libro. El nombre sale de xl/workbook.xml y el
 * archivo, de xl/_rels/workbook.xml.rels. Si faltan, se toman las hojas del zip como «Hoja N».
 */
async function hojasDelLibro(buffer: ArrayBuffer, entradas: Entrada[]): Promise<{ nombre: string; entrada: Entrada }[]> {
  const buscar = (nombre: string) => entradas.find((entrada) => entrada.nombre === nombre)
  const libro = buscar('xl/workbook.xml')
  const relaciones = buscar('xl/_rels/workbook.xml.rels')
  if (libro && relaciones) {
    const lector = new DOMParser()
    const destinos = new Map<string, string>()
    const xmlRelaciones = lector.parseFromString(await contenido(buffer, relaciones), 'application/xml')
    for (const relacion of Array.from(xmlRelaciones.getElementsByTagName('Relationship'))) {
      const destino = relacion.getAttribute('Target') ?? ''
      // El destino puede venir relativo a xl/ («worksheets/sheet1.xml») o absoluto («/xl/worksheets/sheet1.xml»).
      destinos.set(relacion.getAttribute('Id') ?? '', destino.startsWith('/') ? destino.slice(1) : `xl/${destino}`)
    }
    const xmlLibro = lector.parseFromString(await contenido(buffer, libro), 'application/xml')
    const hojas = Array.from(xmlLibro.getElementsByTagName('sheet')).flatMap((hoja) => {
      const entrada = buscar(destinos.get(atributoLocal(hoja, 'id') ?? '') ?? '')
      return entrada ? [{ nombre: hoja.getAttribute('name') ?? '', entrada }] : []
    })
    if (hojas.length > 0) return hojas
  }
  const numero = (entrada: Entrada) => Number(entrada.nombre.match(/sheet(\d+)\.xml$/)?.[1] ?? 0)
  return entradas
    .filter((entrada) => /^xl\/worksheets\/sheet\d+\.xml$/.test(entrada.nombre))
    .sort((a, b) => numero(a) - numero(b))
    .map((entrada) => ({ nombre: `Hoja ${numero(entrada)}`, entrada }))
}

async function leerHojasXlsx(buffer: ArrayBuffer): Promise<Hoja[]> {
  const entradas = entradasZip(new DataView(buffer))
  const hojas = await hojasDelLibro(buffer, entradas)
  if (hojas.length === 0) throw new Error('Archivo no válido')
  const compartidas = await textosCompartidos(buffer, entradas)
  return Promise.all(hojas.map(async ({ nombre, entrada }) => ({ nombre, filas: filasDeHoja(await contenido(buffer, entrada), compartidas, true) })))
}
