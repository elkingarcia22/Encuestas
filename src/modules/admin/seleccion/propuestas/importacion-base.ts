import { primeraEtapaDe, type VacanteUI } from './datos'
import { baseDeCandidatos, etiquetasDeLaBase, normalizarCiudad, normalizarEtiqueta, postular } from './base'
import { familiaDe } from './familias'
import { almacenDeLotes, guardarHojaDeVida, origenDeLote, type ArchivoLote, type LoteCvs } from './importacion'
import type { Persona } from './personas'

// Importar candidatos a la base global («Mis candidatos › Importar candidatos a la base global», 25 sep). Tres maneras,
// según lo que se tenga a mano:
//
// 1. **Hojas de vida** (PDF o ZIP): el mismo recorrido de las vacantes (`importacion.ts`), sin vacante, con etiquetas
//    para todo el lote.
// 2. **Una hoja de cálculo** (Excel o CSV), una persona por fila: lo que llega de una feria o de otro sistema.
//    - Las columnas se emparejan solas por su título («Correo electrónico» → Correo) y se corrigen a mano.
//    - Hacen falta el nombre y una forma de contacto (correo o celular); sin eso la fila no entra.
//    - Cada fila se revisa antes de entrar: entra, ya está en tu base (por su correo: **actualizar sus datos** o
//      dejarla como está), repetida en el mismo archivo (entra la primera), correo mal escrito (se corrige ahí mismo) o
//      sin nombre.
//    - Etiquetas y origen para todo el lote, y **postularlas también a una vacante** si se quiere.
//    - Queda en el historial de importaciones y **se deshace**: salen de la base quienes entraron y no están en ningún
//      proceso; los datos que se actualizaron vuelven a como estaban.
// 3. **Una persona a mano**: nombre, contacto, su hoja de vida si la hay. Si su correo ya está en la base, se dice
//    quién es y se abre su ficha en vez de duplicarla.
//
// La autorización de datos es la misma de las hojas de vida: se acepta una vez.

export const PESO_MAXIMO_HOJA = 5 * 1024 * 1024
export const LIMITE_FILAS = 2000

export type CampoHoja = 'nombre' | 'apellidos' | 'correo' | 'celular' | 'cargo' | 'empresa' | 'ciudad' | 'anios' | 'etiquetas' | 'ignorar'

export const CAMPOS_HOJA: { campo: CampoHoja; texto: string }[] = [
  { campo: 'nombre', texto: 'Nombre' },
  // Los apellidos en su propia columna (o en dos: primer y segundo apellido) se juntan con el nombre (MC-09).
  { campo: 'apellidos', texto: 'Apellidos' },
  { campo: 'correo', texto: 'Correo' },
  { campo: 'celular', texto: 'Celular' },
  { campo: 'cargo', texto: 'Cargo actual' },
  { campo: 'empresa', texto: 'Empresa' },
  { campo: 'ciudad', texto: 'Ciudad' },
  { campo: 'anios', texto: 'Años de experiencia' },
  { campo: 'etiquetas', texto: 'Etiquetas' },
  { campo: 'ignorar', texto: 'No importar' },
]

export type Hoja = { archivo: string; columnas: string[]; filas: string[][]; aviso?: string; file?: File }

const sinTildes = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/* Leer el archivo ------------------------------------------------------------------------------------------------ */

// Un CSV de verdad: separado por comas, punto y coma o tabulador (Excel en español guarda con punto y coma), con
// comillas para los textos que traen el separador adentro.
export function leerCsv(texto: string): string[][] {
  const limpio = texto.replace(/^﻿/, '')
  const primera = limpio.split(/\r?\n/)[0] ?? ''
  const separador = [';', '\t', ','].sort((a, b) => primera.split(b).length - primera.split(a).length)[0]
  const filas: string[][] = []
  let fila: string[] = []
  let celda = ''
  let comillas = false
  for (let i = 0; i < limpio.length; i += 1) {
    const letra = limpio[i]
    if (comillas) {
      if (letra === '"' && limpio[i + 1] === '"') {
        celda += '"'
        i += 1
      } else if (letra === '"') comillas = false
      else celda += letra
    } else if (letra === '"') comillas = true
    else if (letra === separador) {
      fila.push(celda.trim())
      celda = ''
    } else if (letra === '\n' || letra === '\r') {
      if (letra === '\r' && limpio[i + 1] === '\n') i += 1
      fila.push(celda.trim())
      if (fila.some(Boolean)) filas.push(fila)
      fila = []
      celda = ''
    } else celda += letra
  }
  fila.push(celda.trim())
  if (fila.some(Boolean)) filas.push(fila)
  return filas
}

// Qué se puede leer. Un Excel (.xlsx) no se abre en el navegador sin una librería que el prototipo no trae: se muestra
// la hoja de ejemplo con el nombre del archivo, como si se hubiera leído su primera hoja.
export async function leerHoja(file: File): Promise<Hoja | { problema: string }> {
  if (file.size > PESO_MAXIMO_HOJA) return { problema: 'Pesa más de 5 MB' }
  if (/\.(csv|txt)$/i.test(file.name)) {
    // Un CSV guardado en Excel de Windows no viene en UTF-8: si al leerlo salen signos rotos, se lee con su codificación
    // y «María» sale bien (MC-25).
    const bytes = await file.arrayBuffer()
    const utf8 = new TextDecoder('utf-8').decode(bytes)
    const deWindows = utf8.includes('\uFFFD')
    const filas = leerCsv(deWindows ? new TextDecoder('windows-1252').decode(bytes) : utf8)
    if (filas.length < 2) return { problema: 'No trae filas: solo los títulos o nada' }
    const [columnas, ...resto] = filas
    const avisos = [
      deWindows ? 'Venía guardado con la codificación de Excel en Windows: se leyó con ella para que las tildes salgan bien.' : '',
      resto.length > LIMITE_FILAS ? `Trae ${resto.length} filas: se leen las primeras ${LIMITE_FILAS}.` : '',
    ].filter(Boolean)
    return { archivo: file.name, columnas, filas: resto.slice(0, LIMITE_FILAS), file, aviso: avisos.length ? avisos.join(' ') : undefined }
  }
  if (/\.(xlsx|xls)$/i.test(file.name)) return { ...hojaDeEjemplo(file.name), file, aviso: 'Se leyó la primera hoja del libro.' }
  return { problema: 'Solo se leen Excel (.xlsx) o CSV' }
}

// Una hoja con cada caso: filas que entran, una que ya está en la base, una repetida en el mismo archivo, un correo mal
// escrito, una sin nombre, una sin forma de contacto y otra solo con celular.
export function hojaDeEjemplo(archivo = 'Candidatos feria Uniandes.xlsx'): Hoja {
  const base = baseDeCandidatos.leer()
  const conocida = base.find((persona) => persona.id === 'persona-12') ?? base[40]
  return {
    archivo,
    columnas: ['Nombre completo', 'Correo electrónico', 'Celular', 'Cargo actual', 'Empresa', 'Ciudad', 'Años de experiencia', 'Etiquetas'],
    filas: [
      ['Mariana Ríos Cárdenas', 'mariana.rios@correo.com', '+57 311 204 5566', 'Analista de datos', 'Rappi', 'Bogotá', '4', 'Analítica'],
      ['Felipe Arango Duque', 'felipe.arango@correo.com', '+57 320 118 9043', 'Ingeniero de datos', 'Globant', 'Medellín', '6', 'Analítica; Senior'],
      ['Daniela Henao', 'daniela.henao@correo.com', '+57 315 870 2210', 'Diseñador UX', 'Platzi', 'Bogotá', '3', 'Producto'],
      ['Santiago Vélez Mejía', 'santiago.velez@correo.com', '+57 300 555 1289', 'Ejecutivo comercial', 'Claro', 'Cali', '5', 'Comercial'],
      ['Paula Quintero', 'paula.quintero@correo.com', '', 'Analista financiero', 'Bancolombia', 'Bogotá', '2', 'Administración'],
      ['Camilo Londoño Rojas', 'camilo.londono@correo.com', '+57 312 443 7781', 'Desarrollador backend', 'EPM', 'Medellín', '7', 'Tecnología'],
      ['Isabela Zapata', 'isabela.zapata@correo.com', '+57 318 229 6604', 'Coordinador de turno', 'Nutresa', 'Pereira', '8', 'Operaciones; Ex empleado'],
      ['Tomás Castaño', 'tomas.castano@correo.com', '+57 301 776 3312', 'Analista de BI', 'Sura', 'Medellín', '3', 'Analítica'],
      ['Juliana Patiño Gómez', 'juliana.patino@correo.com', '+57 316 902 4450', 'Key account manager', 'Alpina', 'Bogotá', '9', 'Comercial; Senior'],
      [conocida.nombre, conocida.correo, conocida.celular, 'Líder de analítica', 'Davivienda', conocida.ciudad, String(conocida.anios + 1), ''],
      ['Andrés Moreno', 'andres.moreno@correo', '+57 310 667 0098', 'Analista de datos', 'Éxito', 'Barranquilla', '2', 'Analítica'],
      ['', 'sin.nombre@correo.com', '+57 314 000 1122', 'Auxiliar logístico', 'Avianca', 'Bogotá', '1', ''],
      ['Felipe Arango Duque', 'felipe.arango@correo.com', '+57 320 118 9043', 'Ingeniero de datos', 'Globant', 'Medellín', '6', 'Analítica'],
      ['Sara Ospina', '', '', 'Diseñador de producto', 'Rappi', 'Bogotá', '4', 'Producto'],
      ['Nicolás Mejía', '', '+57 305 889 1200', 'Auxiliar contable', 'Corona', 'Manizales', '3', 'Administración'],
      ['Valeria Gómez Restrepo', 'valeria.gomez@correo.com', '+57 319 330 5567', 'QA automatizador', 'Globant', 'Bogotá', '4', 'Tecnología'],
    ],
  }
}

// El CSV que se descarga para llenarlo: las columnas que se esperan y una fila de muestra.
export function descargarPlantilla() {
  const csv = [
    'Nombre completo;Correo electrónico;Celular;Cargo actual;Empresa;Ciudad;Años de experiencia;Etiquetas',
    // Las etiquetas van entre comillas y separadas por coma: con punto y coma se partían en dos columnas (MC-24).
    'María Pérez Gómez;maria.perez@correo.com;+57 300 000 0000;Analista de datos;Empresa S.A.;Bogotá;4;"Analítica, Referidos"',
  ].join('\n')
  const enlace = document.createElement('a')
  enlace.href = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }))
  enlace.download = 'plantilla-candidatos.csv'
  enlace.click()
  URL.revokeObjectURL(enlace.href)
}

// Qué campo es cada columna, por su título. Lo que no se reconoce no se importa (y se puede cambiar).
export function mapeoSugerido(columnas: string[]): CampoHoja[] {
  const usados = new Set<CampoHoja>()
  return columnas.map((columna) => {
    const texto = sinTildes(columna)
    // La empresa antes que el nombre («Nombre de la empresa») y «rol» como palabra («Área de desarrollo» no es el cargo) (MC-09).
    const campo: CampoHoja = /correo|e-?mail/.test(texto)
      ? 'correo'
      : /celular|telefono|movil|whats/.test(texto)
        ? 'celular'
        : /empresa|compan/.test(texto)
          ? 'empresa'
          : /apellido/.test(texto)
            ? 'apellidos'
            : /nombre/.test(texto)
              ? 'nombre'
              : /cargo|puesto|\brol\b/.test(texto)
                ? 'cargo'
              : /ciudad|ubicacion|municipio/.test(texto)
                ? 'ciudad'
                : /anos|experiencia/.test(texto)
                  ? 'anios'
                  : /etiqueta|tags?/.test(texto)
                    ? 'etiquetas'
                    : 'ignorar'
    if (campo !== 'ignorar' && campo !== 'apellidos' && usados.has(campo)) return 'ignorar'
    usados.add(campo)
    return campo
  })
}

/* Revisar cada fila ----------------------------------------------------------------------------------------- */

export type DatosFila = {
  nombre: string
  correo: string
  celular: string
  cargo: string
  empresa: string
  ciudad: string
  anios: number | null
  etiquetas: string[]
}

export type EstadoFila = 'entra' | 'actualiza' | 'omitida' | 'repetida-archivo' | 'correo-invalido' | 'sin-nombre' | 'sin-contacto'

export const ESTADO_FILA: Record<EstadoFila, { texto: string; variante: 'success-light' | 'info-light' | 'outline' | 'destructive-outline'; problema?: boolean }> = {
  entra: { texto: 'Entra', variante: 'success-light' },
  actualiza: { texto: 'Actualiza sus datos', variante: 'info-light' },
  omitida: { texto: 'Ya está: se deja igual', variante: 'outline' },
  'repetida-archivo': { texto: 'Repetida en el archivo', variante: 'outline' },
  'correo-invalido': { texto: 'Correo mal escrito', variante: 'destructive-outline', problema: true },
  'sin-nombre': { texto: 'Sin nombre', variante: 'destructive-outline', problema: true },
  'sin-contacto': { texto: 'Sin correo ni celular', variante: 'destructive-outline', problema: true },
}

export type FilaRevisada = { indice: number; datos: DatosFila; estado: EstadoFila; existente?: Persona; repiteA?: number }

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function datosDeFila(fila: string[], mapeo: CampoHoja[]): DatosFila {
  const de = (campo: CampoHoja) => {
    const indice = mapeo.indexOf(campo)
    return indice >= 0 ? (fila[indice] ?? '').trim() : ''
  }
  const anios = Number.parseInt(de('anios'), 10)
  const apellidos = mapeo.flatMap((campo, indice) => (campo === 'apellidos' ? [(fila[indice] ?? '').trim()] : [])).filter(Boolean)
  return {
    nombre: [de('nombre'), ...apellidos].filter(Boolean).join(' '),
    correo: de('correo'),
    celular: de('celular'),
    cargo: de('cargo'),
    empresa: de('empresa'),
    ciudad: de('ciudad'),
    anios: Number.isFinite(anios) ? anios : null,
    etiquetas: de('etiquetas')
      .split(/[;,|]/)
      .map((una) => una.trim())
      .filter(Boolean),
  }
}

// `correcciones`: lo que se arregló a mano en la vista previa. `decisiones`: qué hacer con cada persona que ya está en la
// base (por defecto, actualizar sus datos).
export function revisarFilas(
  hoja: Hoja,
  mapeo: CampoHoja[],
  correcciones: Record<number, Partial<DatosFila>>,
  decisiones: Record<number, 'actualizar' | 'omitir'>,
): FilaRevisada[] {
  const vistos = new Map<string, number>()
  return hoja.filas.map((fila, indice) => {
    const datos = { ...datosDeFila(fila, mapeo), ...correcciones[indice] }
    const clave = datos.correo.toLowerCase() || datos.celular.replace(/\D/g, '')
    if (!datos.nombre) return { indice, datos, estado: 'sin-nombre' }
    if (datos.correo && !CORREO_VALIDO.test(datos.correo)) return { indice, datos, estado: 'correo-invalido' }
    if (!datos.correo && !datos.celular) return { indice, datos, estado: 'sin-contacto' }
    if (clave && vistos.has(clave)) return { indice, datos, estado: 'repetida-archivo', repiteA: vistos.get(clave) }
    if (clave) vistos.set(clave, indice)
    const existente = datos.correo ? baseDeCandidatos.deCorreo(datos.correo) : undefined
    if (existente) return { indice, datos, estado: decisiones[indice] === 'omitir' ? 'omitida' : 'actualiza', existente }
    return { indice, datos, estado: 'entra' }
  })
}

/* Entrar a la base -------------------------------------------------------------------------------------------- */

const inicialesDe = (nombre: string) =>
  nombre
    .split(' ')
    .map((parte) => parte[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

let siguiente = 1

function personaNueva(datos: DatosFila, id: string, opciones: { etiquetas: string[]; origen: string; loteId?: string; entrada: Persona['entrada'] }): Persona {
  // Lo que no vino queda vacío y la pantalla dice «No registrado» (MC-15). La ciudad y las etiquetas se escriben como ya
  // están en la base: «Bogota D.C.» es «Bogotá» (MC-57), «analitica» es «Analítica» (MC-48).
  const base = baseDeCandidatos.leer()
  const ciudades = [...new Set(base.map((persona) => persona.ciudad).filter(Boolean))]
  const etiquetas = etiquetasDeLaBase(base)
  const cargo = datos.cargo
  return {
    id,
    nombre: datos.nombre,
    iniciales: inicialesDe(datos.nombre),
    correo: datos.correo,
    celular: datos.celular,
    cargo,
    empresa: datos.empresa,
    ciudad: normalizarCiudad(datos.ciudad, ciudades),
    anios: datos.anios ?? 0,
    aniosDesconocidos: datos.anios === null || undefined,
    origen: opciones.origen,
    entrada: opciones.entrada,
    dias: 0,
    etiquetas: [...new Set([...datos.etiquetas, ...opciones.etiquetas].map((etiqueta) => normalizarEtiqueta(etiqueta, etiquetas)))],
    procesos: [],
    habilidades: datos.cargo ? familiaDe(datos.cargo).habilidades.slice(0, 3) : [],
    loteId: opciones.loteId,
  }
}

export type ResultadoImportacion = { lote: LoteCvs; entraron: Persona[]; actualizadas: number; postuladas: number; fuera: number; deshacer: () => void }

export function importarHoja(
  hoja: Hoja,
  filas: FilaRevisada[],
  opciones: { nombre: string; etiquetas: string[]; origen: string; postularA: VacanteUI | null; quien: string; ruta: string },
): ResultadoImportacion {
  const origen = origenDeLote(opciones.origen).persona
  const numero = siguiente++
  const ids = new Map(filas.filter((fila) => fila.estado === 'entra').map((fila) => [fila.indice, `hoja-${numero}-${fila.indice}`]))

  const archivos: ArchivoLote[] = filas.map((fila) => {
    const datos = {
      nombre: fila.datos.nombre || `Fila ${fila.indice + 2}`,
      correo: fila.datos.correo,
      celular: fila.datos.celular,
      cargo: fila.datos.cargo,
      empresa: fila.datos.empresa,
      ciudad: fila.datos.ciudad,
      anios: fila.datos.anios ?? 0,
    }
    const base = { id: `fila-${numero}-${fila.indice}`, nombre: `Fila ${fila.indice + 2}`, peso: 0, datos }
    switch (fila.estado) {
      case 'entra':
        return { ...base, estado: 'listo', entregado: true, personaBaseId: ids.get(fila.indice) }
      case 'actualiza':
        return { ...base, estado: 'repetido', repetido: { donde: 'base', nombre: fila.existente!.nombre, actualizada: true }, personaBaseId: fila.existente!.id }
      case 'omitida':
        return { ...base, estado: 'repetido', repetido: { donde: 'base', nombre: fila.existente!.nombre } }
      case 'repetida-archivo':
        return { ...base, estado: 'repetido', repetido: { donde: 'lote', nombre: fila.datos.nombre, archivo: `la fila ${(fila.repiteA ?? 0) + 2}` } }
      default:
        return { ...base, estado: 'error', fallo: ESTADO_FILA[fila.estado].texto }
    }
  })

  const lote = almacenDeLotes.registrar(undefined, {
    nombre: opciones.nombre || hoja.archivo,
    quien: opciones.quien,
    origen: opciones.origen,
    etiquetas: opciones.etiquetas,
    estado: 'terminado',
    tipo: 'hoja-de-calculo',
    deLaSesion: true,
    ruta: opciones.ruta,
    archivos,
  })

  const entraron = filas
    .filter((fila) => fila.estado === 'entra')
    .map((fila) => personaNueva(fila.datos, ids.get(fila.indice)!, { etiquetas: opciones.etiquetas, origen, loteId: lote.id, entrada: 'Importada en un lote' }))
  baseDeCandidatos.agregar(entraron)

  // Quien ya estaba: se completan sus datos con lo del archivo (lo que venga lleno) y se le suman las etiquetas.
  const actualizar = filas.filter((fila) => fila.estado === 'actualiza' && fila.existente)
  const antes = new Map(actualizar.map((fila) => [fila.existente!.id, fila.existente!]))
  baseDeCandidatos.cambiar((todas) =>
    todas.map((persona) => {
      const fila = actualizar.find((una) => una.existente!.id === persona.id)
      if (!fila) return persona
      return {
        ...persona,
        celular: fila.datos.celular || persona.celular,
        cargo: fila.datos.cargo || persona.cargo,
        empresa: fila.datos.empresa || persona.empresa,
        ciudad: fila.datos.ciudad || persona.ciudad,
        anios: fila.datos.anios ?? persona.anios,
        etiquetas: [...new Set([...persona.etiquetas, ...fila.datos.etiquetas, ...opciones.etiquetas])],
      }
    }),
  )

  // Postularlas también a una vacante: las nuevas y las que ya estaban (se actualicen sus datos o no, MC-47) y no están en
  // esa vacante.
  const yaEstaban = new Set(filas.filter((fila) => (fila.estado === 'actualiza' || fila.estado === 'omitida') && fila.existente).map((fila) => fila.existente!.id))
  const aPostular = opciones.postularA
    ? [...entraron, ...baseDeCandidatos.leer().filter((persona) => yaEstaban.has(persona.id))].filter(
        (persona) => !persona.procesos.some((proceso) => proceso.vacanteId === opciones.postularA!.id),
      )
    : []
  const deshacerPostular = opciones.postularA && aPostular.length ? postular(aPostular, opciones.postularA, primeraEtapaDe(opciones.postularA.etapas)) : null

  return {
    lote,
    entraron,
    actualizadas: actualizar.length,
    postuladas: aPostular.length,
    fuera: filas.filter((fila) => ESTADO_FILA[fila.estado].problema).length,
    deshacer: () => {
      deshacerPostular?.()
      almacenDeLotes.sacarDeLaBase(lote.id)
      baseDeCandidatos.cambiar((todas) => todas.map((persona) => antes.get(persona.id) ?? persona))
    },
  }
}

// Una persona a mano. Devuelve la persona y cómo deshacerlo.
export function agregarAMano(
  datos: DatosFila,
  opciones: { etiquetas: string[]; origen: string; hojaDeVida?: File; postularA: VacanteUI | null; quien: string },
) {
  const persona = personaNueva(datos, `mano-${siguiente++}`, { etiquetas: opciones.etiquetas, origen: opciones.origen, entrada: 'Agregada a mano' })
  baseDeCandidatos.agregar([persona])
  if (opciones.hojaDeVida) guardarHojaDeVida(persona.id, opciones.hojaDeVida, opciones.quien, 'agregada a mano')
  const deshacerPostular = opciones.postularA ? postular([persona], opciones.postularA) : null
  return {
    persona,
    deshacer: () => {
      deshacerPostular?.()
      baseDeCandidatos.quitar([persona.id])
    },
  }
}
