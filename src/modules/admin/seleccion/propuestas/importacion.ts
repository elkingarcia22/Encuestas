import type { Candidato } from '../vacantes/detalle/components/data'
import { notify } from '@/shared/components/notify'
import {
  CANDIDATURAS,
  LOTES_DE,
  RECHAZADAS,
  ajusteDe,
  cumplidosDe,
  primeraEtapaDe,
  tituloEtapa,
  type Candidatura,
  type Criterio,
  type Rechazada,
  type VacanteUI,
  type Veredicto,
  buscarVacanteUI,
} from './datos'
import { PERSONAS, type Persona } from './personas'
import { anotarProcesos, baseDeCandidatos } from './base'
import { QUIEN_MUEVE, entradasA, registroDeMovimientos } from './movimientos'
import { creditosDeCambios } from './invitaciones'
import { familiaDe } from './familias'
import { fechaCorta } from '@/modules/design-system/patrones/formato'

// Importar hojas de vida: las reglas, los datos y la lectura simulada.
//
// En el producto hoy es un botón que abre los términos, después el selector de archivos del sistema y al final una
// tabla «ID del Batch · Nombre · Estado». Aquí el recorrido completo (24 sep; completado el 25 sep, Nicolás: «ahora hay
// que hacer lo mismo con "Candidatos › Importación masiva de CVs" para las 3 exploraciones»):
//
// 1. **Elegir**: se sueltan o se eligen PDF y ZIP. Antes de leer se ve qué entra: un ZIP dice cuántos PDF trae y qué
//    ignora, y lo que no sirve (otro formato, muy pesado, elegido dos veces) queda fuera con su motivo.
// 2. **Más de 200**: no se obliga a quitar archivos; se leen en varios lotes de 200, uno detrás de otro.
// 3. **De dónde vienen**: referidos (y de quién), una feria, el correo, una bolsa de empleo. Queda en cada persona
//    («Origen» en la tabla y en el filtro del tablero) y en la ficha, en «Cómo llegó».
// 4. **A qué etapa entran**: la primera por defecto (decisión 6). Si es otra, se dice qué se saltan; si es una etapa de
//    IA, la IA les escribe la invitación al entrar.
// 5. **Avisarles**, si se quiere: un correo con plantilla cuando entran. Apagado por defecto: nadie recibe correo por
//    entrar.
// 6. **Autorización de datos**: se acepta una vez, al lado del botón, y queda anotado quién y cuándo.
// 7. **Leer en segundo plano**, aunque se cambie de pestaña o se salga de la vacante: el lote sigue en el Centro de
//    procesos y el aviso final lleva de vuelta. Se puede detener y seguir.
// 8. **Se corta la conexión**: lo leído queda a salvo y se sigue desde donde quedó.
// 9. **La IA compara cada hoja con los requisitos** al leerla: entran con su «Cumple N de M», como quien aplicó. Quien
//    cumple menos de la mitad no se rechaza solo (decisión 12): el lote lo propone y el equipo decide.
// 10. **Repetidos, cada caso**: ya está en la vacante (se puede actualizar su hoja de vida), se había rechazado (se
//     puede volver a considerar), ya está en la base (entra con su ficha: una persona es un solo registro) o viene dos
//     veces en el mismo lote (entra una).
// 11. **Lo dudoso** espera una confirmación con la hoja de vida al lado; si el correo que se escribe es de alguien que
//     ya está, se dice.
// 12. **Lo que no se pudo leer** dice por qué y se puede volver a subir.
// 13. **Sacar a los que entraron**: un lote equivocado se deshace. Sale quien sigue donde entró; quien ya se movió o
//     se rechazó se queda, y se dice.
// 14. **Vacante cerrada**: no entran hojas de vida nuevas hasta reabrirla; los lotes se siguen consultando.
// 15. **Ver a los que entraron**: cada exploración los muestra a su manera (la bandeja, el pipeline o la cola de
//     revisión, filtrados por el lote).

export const LIMITE_POR_LOTE = 200
export const PESO_MAXIMO_PDF = 10 * 1024 * 1024
export const PESO_MAXIMO_ZIP = 100 * 1024 * 1024

export const pesoEnTexto = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toLocaleString('es-CO', { maximumFractionDigits: 1 })} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`

const hojas = (n: number) => (n === 1 ? '1 CV' : `${n} CVs`)
const personas = (n: number) => (n === 1 ? '1 persona' : `${n} personas`)

/* La autorización de datos ------------------------------------------------------------------------------------- */

// El texto que hoy se acepta en una ventana antes de poder elegir archivos. Los dos primeros párrafos son los del
// producto; el cierre hay que confirmarlo con legal.
export const TEXTO_AUTORIZACION = [
  'Al cargar, adjuntar o ingresar información en el módulo de reclutamiento del software UBITS Learning, el Cliente declara y garantiza que cuenta con la autorización previa, expresa e informada de los titulares de los datos personales (incluyendo candidatos, aspirantes o colaboradores) para el tratamiento de su información, CVs, así como para la captura, procesamiento y análisis de su imagen y/o voz mediante herramientas tecnológicas y de Inteligencia Artificial (IA).',
  'El Cliente actúa en todo momento como Responsable del Tratamiento de la información ingresada. Por su parte, UBITS LEARNING SOLUTIONS S.A.S. (sociedad colombiana titular y desarrolladora del software UBITS Learning) actúa como Encargado del Tratamiento y usa la información únicamente para prestar el servicio contratado, conforme a la Ley 1581 de 2012 y sus normas reglamentarias.',
]

export type Autorizacion = { quien: string; fecha: string }

// Se acepta una vez por persona y vale para todas las vacantes: en el producto hay que aceptarla cada vez que se
// importa. Vive fuera de las pantallas para que siga aceptada al pasar de una exploración a otra.
let autorizacion: Autorizacion | null = null
const oyentesAutorizacion = new Set<() => void>()

export const autorizacionDeDatos = {
  leer: () => autorizacion,
  aceptar: (quien: string) => {
    autorizacion = { quien, fecha: fechaCorta(new Date().toLocaleDateString('en-CA')) }
    oyentesAutorizacion.forEach((oyente) => oyente())
  },
  suscribir: (oyente: () => void) => {
    oyentesAutorizacion.add(oyente)
    return () => {
      oyentesAutorizacion.delete(oyente)
    }
  },
}

/* De dónde vienen ---------------------------------------------------------------------------------------------- */

// Lo que se elige al importar y lo que queda en cada persona como su origen.
export const ORIGENES_LOTE = [
  { id: 'referido', texto: 'Referidos', persona: 'Referido' },
  { id: 'feria', texto: 'Una feria de empleo', persona: 'Feria de empleo' },
  { id: 'correo', texto: 'Llegaron por correo', persona: 'Correo' },
  { id: 'bolsa', texto: 'Otra bolsa de empleo', persona: 'Bolsa de empleo' },
  { id: 'otro', texto: 'Otro lugar', persona: 'Importación' },
] as const

export type OrigenLote = (typeof ORIGENES_LOTE)[number]['id']

export const origenDeLote = (id: string) => ORIGENES_LOTE.find((origen) => origen.id === id) ?? ORIGENES_LOTE[4]

// «Referidos equipo comercial.zip» ya dice de dónde vienen.
export function origenSugerido(nombres: string[]): OrigenLote {
  const texto = sinTildes(nombres.join(' ')).toLowerCase()
  if (/referid/.test(texto)) return 'referido'
  if (/feria/.test(texto)) return 'feria'
  if (/correo|mail|bandeja/.test(texto)) return 'correo'
  if (/computrabajo|elempleo|bolsa|portal/.test(texto)) return 'bolsa'
  return 'correo'
}

// El correo opcional para quien entra: que sepa que su hoja de vida llegó al proceso.
export const TEXTO_AVISO_ENTRADA =
  'Hola {nombre}, recibimos tu CV para la vacante de {vacante}. Lo vamos a revisar y te contaremos por este medio los siguientes pasos.'

/* Lo que se eligió, antes de leer ------------------------------------------------------------------------------ */

export type Elegido = {
  id: string
  nombre: string
  peso: number
  tipo: 'pdf' | 'zip' | 'otro'
  // Lo que trae un ZIP: solo cuentan los PDF.
  contenido?: { pdfs: { nombre: string; peso: number }[]; ignorados: string[] }
  // Por qué no entra al lote.
  problema?: string
  // El archivo de verdad, cuando se eligió uno del equipo (para abrirlo al revisar).
  archivo?: File
  // Para probar el caso en que se corta la conexión a mitad del lote (solo el ejemplo lo trae).
  cortarEn?: number
}

// Una secuencia fija a partir del nombre: el mismo archivo da siempre el mismo resultado. (Mulberry32 sobre el hash
// del nombre: la mezcla de antes daba números bajos al principio y casi nadie cumplía los requisitos.)
function semilla(texto: string) {
  let h = 2166136261
  for (const letra of texto) h = Math.imul(h ^ letra.charCodeAt(0), 16777619)
  let t = h >>> 0
  return () => {
    t = (t + 0x6d2b79f5) | 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

const NOMBRES = ['Mariana', 'Felipe', 'Daniela', 'Santiago', 'Valentina', 'Camilo', 'Laura', 'Andrés', 'Paula', 'Julián', 'Natalia', 'Sebastián', 'Carolina', 'Mateo', 'Isabela', 'Tomás', 'Juliana', 'Alejandro', 'Sara', 'Nicolás']
const APELLIDOS = ['Duque', 'Uribe', 'Restrepo', 'Gómez', 'Ospina', 'Cárdenas', 'Rojas', 'Mejía', 'Salazar', 'Vélez', 'Arango', 'Castaño', 'Londoño', 'Zapata', 'Henao', 'Quintero', 'Moreno', 'Patiño']
const CARGOS = ['Analista de datos', 'Analista BI', 'Ingeniero de datos', 'Analista financiero', 'Científica de datos', 'Analista de reportería', 'Analista de producto', 'Analista de riesgo']
const EMPRESAS = ['Sura', 'Nutresa', 'Bancolombia', 'Rappi', 'Claro', 'Éxito', 'Davivienda', 'Globant', 'Platzi', 'Alpina', 'EPM', 'Avianca']
const CIUDADES = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Bucaramanga', 'Pereira']

const sinTildes = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '')
const mismoNombre = (a: string, b: string) => sinTildes(a).toLowerCase().trim() === sinTildes(b).toLowerCase().trim()
// «Juan Carlos Pérez» y «Juan Pérez», o «Laura Méndez Gómez» y «Laura Méndez»: el mismo nombre de pila y las partes del
// nombre corto dentro del largo.
function nombreParecido(a: string, b: string) {
  const partes = (nombre: string) => sinTildes(nombre).toLowerCase().trim().split(/\s+/)
  const [corto, largo] = [partes(a), partes(b)].sort((x, y) => x.length - y.length)
  return corto.length >= 2 && corto.length < largo.length && corto[0] === largo[0] && corto.every((parte) => largo.includes(parte))
}
// Una persona se reconoce por su correo o por su celular: el nombre solo no basta, hay dos Laura Méndez (VA-28).
const diezDigitos = (celular?: string) => (celular ?? '').replace(/\D/g, '').slice(-10)
function reconocidaPor(a: { correo?: string; celular?: string }, b: { correo?: string; celular?: string }): 'correo' | 'celular' | null {
  if (a.correo && b.correo && a.correo.trim().toLowerCase() === b.correo.trim().toLowerCase()) return 'correo'
  const celular = diezDigitos(a.celular)
  return celular.length === 10 && celular === diezDigitos(b.celular) ? 'celular' : null
}
// En qué idioma viene la hoja. En la maqueta sale del nombre del archivo («Resume_…_EN.pdf», «Curriculo_…_PT.pdf»); en
// el producto, del texto que lee la IA (VA-46).
function idiomaDe(nombre: string): Idioma | undefined {
  const limpio = sinTildes(nombre).toLowerCase()
  if (/^resume|(^|[\s_-])(en|eng|english|ingles)(\.|[\s_-]|$)/.test(limpio)) return 'Inglés'
  if (/^curriculo|(^|[\s_-])(pt|portugues)(\.|[\s_-]|$)/.test(limpio)) return 'Portugués'
  return undefined
}
// Una ciudad al final del nombre del archivo («CV_Laura_Mendez_Cali.pdf»): en la maqueta es otra persona con el mismo
// nombre que alguien que ya está, con su propio correo y celular (VA-28).
function ciudadDelArchivo(nombre: string) {
  const limpio = sinTildes(nombre).toLowerCase().replace(/\.[a-z]+$/, '')
  return CIUDADES.find((ciudad) => new RegExp(`[\\s_-]${sinTildes(ciudad).toLowerCase()}$`).test(limpio))
}
// Una hoja de vida también llega en Word o como foto del celular (VA-29): la IA la lee igual (las fotos, con lectura
// de texto). Se tratan como una hoja de vida más; el resto sigue sin leerse.
const tipoDe = (nombre: string): Elegido['tipo'] =>
  /\.(pdf|docx?|jpe?g|png|heic|webp)$/i.test(nombre) ? 'pdf' : /\.zip$/i.test(nombre) ? 'zip' : 'otro'

// Lo que hay dentro de un ZIP. Sin abrirlo de verdad: tantos PDF como da su peso, con nombres de hojas de vida.
function contenidoDeZip(nombre: string, peso: number): Elegido['contenido'] {
  if (/vac[ií]o/i.test(nombre)) return { pdfs: [], ignorados: ['leeme.txt'] }
  const azar = semilla(nombre)
  const cuantos = Math.min(40, Math.max(3, Math.round(peso / 230_000)))
  const pdfs = Array.from({ length: cuantos }, (_, indice) => {
    const nombrePersona = `${NOMBRES[Math.floor(azar() * NOMBRES.length)]}_${APELLIDOS[Math.floor(azar() * APELLIDOS.length)]}`
    const forma = azar()
    return {
      nombre: forma < 0.6 ? `CV_${sinTildes(nombrePersona)}.pdf` : forma < 0.85 ? `CV ${nombrePersona.replace('_', ' ')}.pdf` : `documento_${indice + 1}.pdf`,
      peso: Math.round(120_000 + azar() * 600_000),
    }
  })
  const ignorados = azar() < 0.5 ? ['foto_equipo.jpg'] : []
  return { pdfs, ignorados }
}

export function elegidoDe(nombre: string, peso: number, yaElegidos: Elegido[], archivo?: File): Elegido {
  const tipo = tipoDe(nombre)
  const base: Elegido = { id: `${nombre}-${peso}-${yaElegidos.length}-${Math.round(Math.random() * 1e6)}`, nombre, peso, tipo, archivo }
  if (yaElegidos.some((otro) => otro.nombre === nombre && otro.peso === peso)) return { ...base, problema: 'Ya lo elegiste' }
  if (tipo === 'otro') return { ...base, problema: 'Solo se leen PDF, Word, fotos o ZIP' }
  if (tipo === 'pdf' && peso > PESO_MAXIMO_PDF) return { ...base, problema: 'Pesa más de 10 MB' }
  if (tipo === 'zip' && peso > PESO_MAXIMO_ZIP) return { ...base, problema: 'El ZIP pesa más de 100 MB' }
  if (tipo === 'zip') {
    const contenido = contenidoDeZip(nombre, peso)
    return { ...base, contenido, problema: contenido?.pdfs.length ? undefined : 'No trae ningún PDF adentro' }
  }
  return base
}

// Cuántas hojas de vida van a leerse de verdad: los PDF sueltos más los que traen los ZIP.
export const hojasDe = (elegidos: Elegido[]) =>
  elegidos.filter((elegido) => !elegido.problema).reduce((suma, elegido) => suma + (elegido.tipo === 'zip' ? (elegido.contenido?.pdfs.length ?? 0) : 1), 0)

// Quién hay hoy en la vacante: con eso se reconoce a quien ya está o se rechazó al leer un lote.
export type Conocidas = { activas: Candidatura[]; rechazadas: Rechazada[] }

/* El lote y la lectura ----------------------------------------------------------------------------------------- */

export type EstadoArchivo = 'espera' | 'leyendo' | 'listo' | 'dudoso' | 'repetido' | 'error' | 'descartado' | 'sin-leer'

// La IA lee igual hojas de vida en español, inglés y portugués (VA-46).
export type Idioma = 'Inglés' | 'Portugués'

export type DatosLeidos = {
  nombre: string
  correo: string
  celular: string
  cargo: string
  empresa: string
  ciudad: string
  anios: number
}

export type Duda = {
  // Qué dato quedó en duda. «documento»: puede que no sea una hoja de vida. «persona»: se llama igual que alguien que
  // ya está, pero su correo y su celular son otros (VA-28).
  campo: 'correo' | 'nombre' | 'documento' | 'persona'
  motivo: string
  // El otro valor que apareció, cuando hay dos.
  alternativa?: string
  // Con «persona»: la candidatura que se llama igual.
  candidaturaId?: string
}

// Por qué no se duplicó.
export type Repetido = {
  // Sigue en la vacante · se rechazó en esta vacante · venía dos veces en el lote · ya estaba en la base (al importar
  // a la base).
  donde: 'vacante' | 'rechazada' | 'lote' | 'base'
  nombre: string
  candidaturaId?: string
  etapa?: string
  motivo?: string
  // El otro archivo del lote con la misma persona.
  archivo?: string
  // Se cambió su hoja de vida por esta versión.
  actualizada?: boolean
  // Cómo se la reconoció (VA-28): por su correo o por su celular, aunque el nombre venga escrito distinto.
  por?: 'correo' | 'celular'
  // El nombre como venía en la hoja, si no es el de su ficha («Juan Carlos Pérez» por «Juan Pérez»).
  comoVenia?: string
  // Venía también en otro lote de la vacante que se estaba leyendo al mismo tiempo (VA-28).
  otroLote?: string
}

export type ArchivoLote = {
  id: string
  nombre: string
  peso: number
  deZip?: string
  estado: EstadoArchivo
  datos?: DatosLeidos
  duda?: Duda
  repetido?: Repetido
  // Estaba en la base y entró a la vacante con su ficha de siempre.
  personaId?: string
  // Lo que dice la hoja nueva de quien entró con su ficha, si es distinto: se ofrece actualizar sus datos (VA-47).
  novedad?: { cargo: string; empresa: string; ciudad: string; anios: number; aplicada?: boolean }
  // En qué idioma está la hoja, si no es español (VA-46).
  idioma?: Idioma
  // Lo que concluyó la IA de cada requisito de la vacante.
  criterios?: Criterio[]
  // Por qué no se pudo leer.
  fallo?: string
  // Lo confirmó alguien al revisar lo dudoso.
  confirmado?: boolean
  // Ya pasó a la vacante (o a la base): al volver a leer el lote no se entrega dos veces.
  entregado?: boolean
  // La candidatura que salió de este archivo.
  candidaturaId?: string
  // Se sacó de la vacante al deshacer el lote.
  sacado?: boolean
  // La persona que salió de este archivo o fila, al importar a la base.
  personaBaseId?: string
  archivo?: File
}

export type LoteCvs = {
  id: string
  nombre: string
  fecha: string
  quien: string
  // La etapa a la que entran (dentro de una vacante).
  etapa?: string
  origen: string
  referidoPor?: string
  // El correo que les llega al entrar, si se quiso avisarles.
  aviso?: string
  // «en-cola»: la parte 2 de un envío grande espera a que termine la 1.
  estado: 'leyendo' | 'detenido' | 'terminado' | 'en-cola'
  // Se detuvo solo: se cortó la conexión.
  interrumpido?: boolean
  // En qué archivo se corta (una sola vez); solo lo trae el ejemplo.
  cortarEn?: number
  // Se sacó de la vacante a quien entró: cuántas salieron y cuántas se quedaron.
  retirado?: { salieron: number; quedaron: number }
  // La vacante se cerró mientras se leía: nadie entró aunque las hojas se leyeran bien (VA-17).
  cerradoAlLeer?: boolean
  // Parte de un envío de más de 200.
  parte?: { n: number; de: number }
  // Se importó en esta visita: se ve en el Centro de procesos y el aviso final sabe volver aquí.
  deLaSesion?: boolean
  // Qué se importó: hojas de vida (lo de siempre) o una hoja de cálculo con una persona por fila.
  tipo?: 'hojas' | 'hoja-de-calculo'
  // Las etiquetas que se le ponen a todo el lote al importar a la base (reemplazan a las carpetas).
  etiquetas?: string[]
  ruta?: string
  archivos: ArchivoLote[]
}

export function cuentasDe(lote: LoteCvs) {
  const de = (estado: EstadoArchivo) => lote.archivos.filter((archivo) => archivo.estado === estado).length
  // Con la vacante cerrada a mitad de la lectura, nadie entró: no se cuentan como entrados (VA-17).
  const listos = lote.cerradoAlLeer ? 0 : de('listo')
  const evaluados = lote.archivos.filter((archivo) => archivo.estado === 'listo' && !archivo.sacado && archivo.criterios?.length)
  const cumpleDe = (archivo: ArchivoLote) => cumplidosDe(archivo.criterios ?? [])
  const totalDe = (archivo: ArchivoLote) => archivo.criterios?.length ?? 0
  return {
    total: lote.archivos.length,
    leidos: lote.archivos.filter((archivo) => !['espera', 'leyendo', 'sin-leer'].includes(archivo.estado)).length,
    listos,
    confirmados: lote.archivos.filter((archivo) => archivo.estado === 'listo' && archivo.confirmado).length,
    deLaBase: lote.archivos.filter((archivo) => archivo.estado === 'listo' && archivo.personaId).length,
    dudosos: de('dudoso'),
    repetidos: de('repetido'),
    fallidos: de('error'),
    descartados: de('descartado'),
    sinLeer: de('sin-leer') + de('espera') + de('leyendo'),
    // Cómo les fue con los requisitos de la vacante a quienes entraron.
    cumplenTodo: evaluados.filter((archivo) => cumpleDe(archivo) === totalDe(archivo)).length,
    aMedias: evaluados.filter((archivo) => cumpleDe(archivo) < totalDe(archivo) && cumpleDe(archivo) * 2 >= totalDe(archivo)).length,
    pocos: evaluados.filter((archivo) => cumpleDe(archivo) * 2 < totalDe(archivo)).length,
  }
}

const datosAlAzar = (azar: () => number, nombre?: string): DatosLeidos => {
  const persona = nombre ?? `${NOMBRES[Math.floor(azar() * NOMBRES.length)]} ${APELLIDOS[Math.floor(azar() * APELLIDOS.length)]}`
  const usuario = sinTildes(persona).toLowerCase().replace(/\s+/g, '.')
  return {
    nombre: persona,
    correo: `${usuario}@correo.com`,
    celular: `+57 3${Math.floor(10 + azar() * 89)} ${Math.floor(100 + azar() * 899)} ${Math.floor(1000 + azar() * 8999)}`,
    cargo: CARGOS[Math.floor(azar() * CARGOS.length)],
    empresa: EMPRESAS[Math.floor(azar() * EMPRESAS.length)],
    ciudad: CIUDADES[Math.floor(azar() * CIUDADES.length)],
    anios: 1 + Math.floor(azar() * 9),
  }
}

// El nombre de la persona cuando el archivo lo trae («CV_Mariana_Duque.pdf», «Hoja de vida Daniela Ospina.pdf»).
function nombreDelArchivo(nombre: string) {
  // Sin «Resume»/«Curriculo» delante, ni el idioma (EN, PT) o la ciudad detrás (VA-28, VA-46).
  const ciudad = ciudadDelArchivo(nombre)
  const sinCiudad = (texto: string) => (ciudad ? texto.replace(new RegExp(`\\s+(${ciudad}|${sinTildes(ciudad)})$`, 'i'), '') : texto)
  const limpio = sinCiudad(
    nombre
      .replace(/\.pdf$/i, '')
      .replace(/^(cv|CV|hv|resume|curriculo|curriculum)[\s_-]*/i, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+\d+$/, '')
      .replace(/\s+(en|pt|es)$/i, '')
      .trim(),
  ).trim()
  const partes = limpio.split(/\s+/).filter((parte) => /^[\p{L}]+$/u.test(parte))
  if (partes.length < 2 || /documento|escaneado|carta|portafolio/i.test(limpio)) return undefined
  return partes
    .slice(0, partes.length > 3 ? 3 : partes.length)
    .map((parte) => parte[0].toUpperCase() + parte.slice(1).toLowerCase())
    .join(' ')
}

// Lo que concluye la IA de cada requisito al leer la hoja. Fijo por archivo; a unas pocas personas del ejemplo les va
// mal a propósito, para que el lote tenga a quién proponer rechazar.
export function evaluarHoja(datos: DatosLeidos, vacante: VacanteUI, clave: string, idioma?: Idioma): Criterio[] {
  const azar = semilla(`${clave}|requisitos`)
  const floja = /arango|velez|quintero|patino/i.test(sinTildes(datos.nombre))
  // Cada hoja de vida tiene su nivel: la mayoría cumple casi todo, como quien pasa el filtro del portal.
  const nivel = 0.5 + azar() * 0.5
  const trabajo = `${datos.cargo} en ${datos.empresa}`
  return vacante.requisitos.map((requisito, indice) => {
    const r = azar()
    // Una hoja escrita en inglés cuenta para un requisito de inglés: es una señal, el nivel se confirma después (VA-46).
    if (idioma && sinTildes(requisito).toLowerCase().includes(sinTildes(idioma).toLowerCase()))
      return { requisito, veredicto: 'cumple' as Veredicto, evidencia: `El CV está escrito en ${idioma.toLowerCase()}; el nivel se confirma en la entrevista` }
    const veredicto: Veredicto = floja ? (indice === 0 ? 'parcial' : 'no-cumple') : r < nivel ? 'cumple' : r < nivel + 0.3 ? 'parcial' : 'no-cumple'
    const evidencia =
      veredicto === 'cumple'
        ? `CV · ${trabajo}, ${datos.anios} ${datos.anios === 1 ? 'año' : 'años'} de experiencia`
        : veredicto === 'parcial'
          ? `Lo menciona sin detalle · ${trabajo}`
          : 'No aparece en el CV que se importó'
    return { requisito, veredicto, evidencia }
  })
}

export type Contexto = Conocidas & {
  vacante?: VacanteUI
  // Lo que ya se leyó del mismo lote: si la misma persona viene dos veces, entra una.
  previos: ArchivoLote[]
  // Lo leído en otros lotes de la misma vacante que todavía no terminan: dos lotes a la vez con la misma persona (VA-28).
  enOtrosLotes?: { lote: string; archivo: ArchivoLote }[]
}

// Lo que pasa al leer un archivo. Fijo por nombre: el mismo archivo da siempre lo mismo. Lo que se pudo leer dice en qué
// idioma venía, si no es español (VA-46).
export function leerArchivo(archivo: ArchivoLote, contexto: Contexto): ArchivoLote {
  const leido = leer(archivo, contexto)
  const idioma = idiomaDe(archivo.nombre)
  return idioma && leido.estado !== 'error' ? { ...leido, idioma } : leido
}

function leer(archivo: ArchivoLote, contexto: Contexto): ArchivoLote {
  const azar = semilla(archivo.nombre + (archivo.deZip ?? ''))
  const nombre = nombreDelArchivo(archivo.nombre)
  const clave = sinTildes(archivo.nombre).toLowerCase()
  const { vacante } = contexto

  if (/escaneado|scan/.test(clave) || archivo.peso > 2_500_000)
    return { ...archivo, estado: 'error', fallo: 'Es una imagen escaneada: no trae texto que la IA pueda leer' }
  if (/protegido|contrasena/.test(clave)) return { ...archivo, estado: 'error', fallo: 'Tiene contraseña' }
  if (/carta/.test(clave))
    return {
      ...archivo,
      estado: 'dudoso',
      datos: datosAlAzar(azar),
      duda: { campo: 'documento', motivo: 'Parece una carta de presentación, no un CV' },
    }

  const leidos = datosAlAzar(azar, nombre)
  const idioma = idiomaDe(archivo.nombre)
  const evaluar = (conDatos: DatosLeidos) => (vacante ? evaluarHoja(conDatos, vacante, archivo.nombre, idioma) : undefined)
  // La hoja de alguien que ya está en la vacante trae su correo y su celular de siempre, aunque el nombre venga escrito
  // distinto. Con una ciudad al final del archivo es otra persona con el mismo nombre: su propio correo (VA-28).
  const otraCiudad = ciudadDelArchivo(archivo.nombre)
  const conocida = otraCiudad
    ? undefined
    : [...contexto.activas.map((c) => c.candidato), ...contexto.rechazadas.map((r) => r.candidatura.candidato)].find(
        (candidato) => mismoNombre(candidato.nombre, leidos.nombre) || nombreParecido(candidato.nombre, leidos.nombre),
      )
  const datos: DatosLeidos = otraCiudad
    ? { ...leidos, correo: leidos.correo.replace('@', `.${sinTildes(otraCiudad).toLowerCase()}@`), ciudad: otraCiudad }
    : conocida
      ? { ...leidos, correo: conocida.correo, celular: conocida.celular ?? leidos.celular }
      : leidos

  // ¿Ya está en la vacante, o estuvo y se rechazó? Por su correo o su celular; el nombre escrito distinto se anota.
  if (vacante) {
    const comoVenia = (suyo: string) => (mismoNombre(suyo, datos.nombre) ? undefined : datos.nombre)
    const enLaVacante = contexto.activas.find((c) => reconocidaPor(c.candidato, datos))
    if (enLaVacante)
      return {
        ...archivo,
        estado: 'repetido',
        datos: { ...datos, nombre: enLaVacante.candidato.nombre, correo: enLaVacante.candidato.correo },
        repetido: {
          donde: 'vacante',
          nombre: enLaVacante.candidato.nombre,
          candidaturaId: enLaVacante.id,
          etapa: enLaVacante.etapa,
          por: reconocidaPor(enLaVacante.candidato, datos) ?? undefined,
          comoVenia: comoVenia(enLaVacante.candidato.nombre),
        },
      }
    const rechazada = contexto.rechazadas.find((r) => reconocidaPor(r.candidatura.candidato, datos))
    if (rechazada)
      return {
        ...archivo,
        estado: 'repetido',
        datos: { ...datos, nombre: rechazada.candidatura.candidato.nombre, correo: rechazada.candidatura.candidato.correo },
        repetido: {
          donde: 'rechazada',
          nombre: rechazada.candidatura.candidato.nombre,
          candidaturaId: rechazada.candidatura.id,
          etapa: rechazada.candidatura.etapa,
          motivo: rechazada.motivo,
          por: reconocidaPor(rechazada.candidatura.candidato, datos) ?? undefined,
          comoVenia: comoVenia(rechazada.candidatura.candidato.nombre),
        },
      }
    // Se llama igual que alguien que ya está, pero su correo y su celular son otros: puede ser otra persona. No se
    // decide solo: queda para revisar con las dos al lado.
    const homonima = contexto.activas.find((c) => mismoNombre(c.candidato.nombre, datos.nombre))
    if (homonima)
      return {
        ...archivo,
        estado: 'dudoso',
        datos,
        duda: {
          campo: 'persona',
          motivo: `Se llama igual que ${homonima.candidato.nombre}, que ya está en ${tituloEtapa(homonima.etapa)}, pero su correo y su celular son otros`,
          candidaturaId: homonima.id,
        },
      }
  }

  // ¿Venía ya en este mismo lote? Se reconoce por el correo o el celular. (Si ya estaba en la vacante, eso se dijo arriba.)
  const doble = contexto.previos.find(
    (previo) => previo.id !== archivo.id && previo.datos && previo.estado !== 'error' && previo.repetido?.donde !== 'lote' && reconocidaPor(previo.datos, datos),
  )
  if (doble) return { ...archivo, estado: 'repetido', datos, repetido: { donde: 'lote', nombre: datos.nombre, archivo: doble.nombre } }
  // ¿La trae otro lote de esta vacante que se está leyendo al mismo tiempo? Entra una vez, con el que la leyó primero.
  const enOtro = contexto.enOtrosLotes?.find(
    ({ archivo: otro }) => otro.datos && (otro.estado === 'listo' || otro.estado === 'dudoso') && !otro.entregado && reconocidaPor(otro.datos, datos),
  )
  if (enOtro)
    return { ...archivo, estado: 'repetido', datos, repetido: { donde: 'lote', nombre: datos.nombre, archivo: enOtro.archivo.nombre, otroLote: enOtro.lote } }

  if (/hoja_de_vida|\(1\)/.test(clave))
    return {
      ...archivo,
      estado: 'dudoso',
      datos: { ...datos, nombre: 'María José Rodríguez', correo: 'mjrodriguez@correo.com' },
      duda: { campo: 'correo', motivo: 'Hay dos correos en el CV', alternativa: 'maria.rodriguez@otrocorreo.com' },
    }
  if (/rios/.test(clave))
    return { ...archivo, estado: 'dudoso', datos: { ...datos, correo: '' }, duda: { campo: 'correo', motivo: 'No encontré el correo' } }
  if (/^documento_/.test(clave))
    return { ...archivo, estado: 'dudoso', datos, duda: { campo: 'nombre', motivo: 'El nombre no está claro: el archivo no lo trae y en la hoja aparece en una imagen' } }

  // Ya estaba en la base: entra a la vacante con su ficha (una persona es un solo registro). Si se importa a la base,
  // es un repetido. En la maqueta, la hoja de alguien de la base trae su nombre (o, de vez en cuando, solo su correo).
  const suerte = azar()
  const ocupadas = new Set([...contexto.activas, ...contexto.rechazadas.map((r) => r.candidatura)].map((c) => c.personaId))
  const deLaBase =
    (otraCiudad ? undefined : PERSONAS.find((persona) => mismoNombre(persona.nombre, datos.nombre))) ??
    (suerte < 0.1 ? PERSONAS[40 + Math.floor(azar() * 400)] : undefined)
  if (deLaBase && !ocupadas.has(deLaBase.id)) {
    const suyos: DatosLeidos = { ...datos, nombre: deLaBase.nombre, correo: deLaBase.correo, cargo: deLaBase.cargo, empresa: deLaBase.empresa, ciudad: deLaBase.ciudad, anios: deLaBase.anios }
    // La hoja nueva dice otro cargo u otra empresa: entra con su ficha de siempre y se ofrece actualizarla (VA-47).
    const novedad =
      datos.cargo !== deLaBase.cargo || datos.empresa !== deLaBase.empresa ? { cargo: datos.cargo, empresa: datos.empresa, ciudad: datos.ciudad, anios: datos.anios } : undefined
    return vacante
      ? { ...archivo, estado: 'listo', datos: suyos, personaId: deLaBase.id, criterios: evaluar(suyos), novedad }
      : { ...archivo, estado: 'repetido', datos: suyos, repetido: { donde: 'base', nombre: deLaBase.nombre } }
  }
  if (suerte > 0.93) return { ...archivo, estado: 'error', fallo: 'El archivo está dañado y no se pudo abrir' }
  if (suerte > 0.84)
    return { ...archivo, estado: 'dudoso', datos: { ...datos, correo: '' }, duda: { campo: 'correo', motivo: 'No encontré el correo' } }
  return { ...archivo, estado: 'listo', datos, criterios: evaluar(datos) }
}

// Los archivos del lote a partir de lo elegido: cada PDF suelto y cada PDF de cada ZIP.
export function archivosDe(elegidos: Elegido[]): ArchivoLote[] {
  return elegidos
    .filter((elegido) => !elegido.problema)
    .flatMap((elegido): ArchivoLote[] =>
      elegido.tipo === 'zip'
        ? (elegido.contenido?.pdfs ?? []).map((pdf, indice) => ({ id: `${elegido.id}-${indice}`, nombre: pdf.nombre, peso: pdf.peso, deZip: elegido.nombre, estado: 'espera' as const }))
        : [{ id: elegido.id, nombre: elegido.nombre, peso: elegido.peso, estado: 'espera' as const, archivo: elegido.archivo }],
    )
}

let siguienteLote = 4822
const nuevoIdDeLote = () => `L-${siguienteLote++}`

const ahoraEnTexto = () => `Hoy, ${new Date().toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })}`

// Los lotes que ya había, con cada archivo y en qué terminó, para poder abrirlos y revisar lo dudoso.
function lotesIniciales(vacante: VacanteUI | undefined): LoteCvs[] {
  if (!vacante) return []
  const etapa = primeraEtapaDe(vacante.etapas)
  return (LOTES_DE[vacante.id] ?? []).map((lote) => {
    const azar = semilla(lote.id)
    const archivo = (indice: number, estado: EstadoArchivo, extra: Partial<ArchivoLote> = {}): ArchivoLote => {
      const datos = datosAlAzar(azar)
      return {
        id: `${lote.id}-${indice}`,
        nombre: `CV_${sinTildes(datos.nombre).replace(' ', '_')}.pdf`,
        peso: Math.round(150_000 + azar() * 500_000),
        deZip: lote.nombre,
        estado,
        datos,
        ...extra,
      }
    }
    const DUDAS: Duda[] = [
      { campo: 'correo', motivo: 'Hay dos correos en el CV', alternativa: 'contacto.personal@otrocorreo.com' },
      { campo: 'correo', motivo: 'No encontré el correo' },
      { campo: 'nombre', motivo: 'El nombre no está claro: en la hoja aparece en una imagen' },
      { campo: 'documento', motivo: 'Parece una carta de presentación, no un CV' },
    ]
    let indice = 0
    const archivos: ArchivoLote[] = [
      ...Array.from({ length: lote.listos }, () => {
        const hecho = archivo(indice++, 'listo', { entregado: true })
        return hecho.datos ? { ...hecho, criterios: evaluarHoja(hecho.datos, vacante, hecho.nombre) } : hecho
      }),
      ...Array.from({ length: lote.dudosos }, (_, n) => {
        const duda = DUDAS[n % DUDAS.length]
        const hecho = archivo(indice++, 'dudoso', { duda })
        return duda.motivo === 'No encontré el correo' && hecho.datos ? { ...hecho, datos: { ...hecho.datos, correo: '' } } : hecho
      }),
      ...Array.from({ length: lote.repetidos }, () => {
        const hecho = archivo(indice++, 'repetido')
        return { ...hecho, repetido: { donde: 'vacante' as const, nombre: hecho.datos?.nombre ?? '' } }
      }),
      ...Array.from({ length: lote.fallidos }, () => archivo(indice++, 'error', { datos: undefined, fallo: 'Es una imagen escaneada: no trae texto que la IA pueda leer' })),
    ]
    return { id: lote.id, nombre: lote.nombre, fecha: lote.fecha, quien: lote.quien, etapa, origen: lote.origen, estado: 'terminado', archivos }
  })
}

/* De la hoja de vida a la vacante o a la base ------------------------------------------------------------------ */

const inicialesDe = (nombre: string) =>
  nombre
    .split(' ')
    .map((parte) => parte[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

function candidatoDe(archivo: ArchivoLote, criterios: Criterio[] = []): Candidato {
  const datos = archivo.datos!
  // Quien ya estaba en la base es la misma persona: se reusa su ficha.
  const suya = archivo.personaId ? CANDIDATURAS.find((c) => c.personaId === archivo.personaId)?.candidato : undefined
  if (suya) return suya
  const flojos = criterios.filter((criterio) => criterio.veredicto === 'no-cumple')
  return {
    id: archivo.personaId ?? `importado-${archivo.id}`,
    nombre: datos.nombre,
    iniciales: inicialesDe(datos.nombre),
    correo: datos.correo,
    celular: datos.celular,
    origen: 'Agregado a mano',
    etapa: 'cv',
    dias: 0,
    ajuste: 0,
    cargo: datos.cargo,
    empresa: datos.empresa,
    ciudad: datos.ciudad,
    anios: datos.anios,
    pretension: 6,
    disponibilidad: 15,
    resumen: `${datos.cargo} en ${datos.empresa}, con ${datos.anios} ${datos.anios === 1 ? 'año' : 'años'} de experiencia. Entró por importación de CVs.${
      archivo.idioma ? ` Su CV vino en ${archivo.idioma.toLowerCase()}; la IA lo leyó igual.` : ''
    }`,
    trayectoria: [{ cargo: datos.cargo, empresa: datos.empresa, periodo: `${2026 - Math.min(datos.anios, 4)} – hoy` }],
    habilidades: [],
    respuestas: [],
    idiomaHoja: archivo.idioma,
    // Lo que concluyó la IA, dicho como lo guarda el expediente: así «Evaluación CV» muestra su análisis.
    requisitos: criterios.map((criterio) =>
      criterio.veredicto === 'cumple' ? 'Cumple' : criterio.veredicto === 'parcial' ? 'Parcial' : criterio.veredicto === 'no-cumple' ? 'No cumple' : 'Por validar',
    ),
    fortalezas: [
      {
        texto: `${datos.anios} ${datos.anios === 1 ? 'año' : 'años'} de experiencia; hoy es ${datos.cargo} en ${datos.empresa}.`,
        fuentes: [{ etiqueta: `CV · ${archivo.nombre}`, seccion: 'cv' }],
      },
    ],
    riesgos: flojos.length
      ? [
          {
            texto: `El CV no muestra ${flojos.length === 1 ? 'un requisito' : `${flojos.length} requisitos`}: ${flojos.map((criterio) => criterio.requisito.toLowerCase()).join(', ')}.`,
            fuentes: [{ etiqueta: `CV · ${archivo.nombre}`, seccion: 'cv' }],
          },
        ]
      : [],
    notas: [],
  }
}

export function candidaturaDeArchivo(archivo: ArchivoLote, vacante: VacanteUI, lote: LoteCvs): Candidatura {
  const criterios = archivo.criterios ?? (archivo.datos ? evaluarHoja(archivo.datos, vacante, archivo.nombre) : [])
  const candidato = candidatoDe(archivo, criterios)
  const personaId = archivo.personaId ?? candidato.id
  return {
    id: `${personaId}@${vacante.id}`,
    personaId,
    candidato,
    vacante,
    etapa: lote.etapa ?? primeraEtapaDe(vacante.etapas),
    dias: 0,
    ajuste: ajusteDe(criterios),
    criterios,
    importada: {
      loteId: lote.id,
      lote: lote.nombre,
      quien: lote.quien,
      cuando: Date.now(),
      origen: origenDeLote(lote.origen).persona,
      referidoPor: lote.referidoPor,
      archivo: archivo.nombre,
      peso: archivo.peso,
      deZip: archivo.deZip,
      confirmado: archivo.confirmado,
      file: archivo.archivo,
    },
  }
}

export function personaDeArchivo(archivo: ArchivoLote, lote?: LoteCvs): Persona {
  const candidato = candidatoDe(archivo)
  return {
    id: candidato.id,
    nombre: candidato.nombre,
    iniciales: candidato.iniciales,
    correo: candidato.correo,
    cargo: candidato.cargo,
    empresa: candidato.empresa,
    ciudad: candidato.ciudad,
    anios: candidato.anios,
    origen: lote ? origenDeLote(lote.origen).persona : candidato.origen,
    entrada: 'Importada en un lote',
    dias: 0,
    etiquetas: lote?.etiquetas ?? [],
    procesos: [],
    celular: candidato.celular,
    habilidades: familiaDe(candidato.cargo).habilidades.slice(0, 4),
    loteId: lote?.id,
  }
}

// La hoja de vida tal como la leyó la IA, para tenerla al lado al revisar lo dudoso.
export function textoDeLaHoja(archivo: ArchivoLote): string {
  const datos = archivo.datos
  if (!datos) return 'No se pudo sacar texto de este archivo.'
  if (archivo.duda?.campo === 'documento')
    return `Bogotá, septiembre de 2026

Señores
Equipo de selección

Me permito presentar mi interés en la vacante publicada. Durante los últimos ${datos.anios} años he trabajado como ${datos.cargo.toLowerCase()} en ${datos.empresa}, donde…

Adjunto mi CV en un archivo aparte.

Cordialmente,
${datos.nombre}`
  const nombre = archivo.duda?.campo === 'nombre' ? '[imagen: logotipo con el nombre]' : datos.nombre.toUpperCase()
  const contacto = [datos.correo || null, datos.celular].filter(Boolean).join(' · ')
  return `${nombre}
${datos.cargo} · ${datos.empresa}
${contacto}${archivo.duda?.alternativa ? `\nContacto alterno: ${archivo.duda.alternativa}` : ''}
${datos.ciudad}, Colombia

EXPERIENCIA
${datos.cargo} · ${datos.empresa} · ${2026 - Math.min(datos.anios, 4)} – hoy
  Tableros de seguimiento y reportes para el equipo directivo.
${datos.anios > 4 ? `Analista junior · ${EMPRESAS[(datos.nombre.length + 3) % EMPRESAS.length]} · ${2026 - datos.anios} – ${2026 - 4}\n` : ''}
EDUCACIÓN
Ingeniería industrial · Universidad Nacional de Colombia`
}

/* Las hojas de vida que se subieron -------------------------------------------------------------------------- */

// La hoja de vida con la que entró cada persona (o la versión nueva de alguien que ya estaba): la pestaña «Documentos»
// de su ficha la muestra con quién la subió y en qué lote.
export type HojaSubida = { personaId: string; nombre: string; peso: number; fecha: string; subidoPor: string; lote: string; archivo?: File }

const hojasSubidas: HojaSubida[] = []
export const hojasSubidasDe = (personaId: string) => hojasSubidas.filter((hoja) => hoja.personaId === personaId)

const subirHoja = (personaId: string, archivo: ArchivoLote, lote: LoteCvs) =>
  hojasSubidas.unshift({
    personaId,
    nombre: archivo.nombre,
    peso: archivo.peso,
    fecha: new Date().toISOString().slice(0, 10),
    subidoPor: lote.quien,
    lote: lote.nombre,
    archivo: archivo.archivo,
  })

// La hoja de vida de alguien que se agregó a mano (o de una fila de hoja de cálculo): la misma pestaña «Documentos».
export const guardarHojaDeVida = (personaId: string, archivo: File, quien: string, de: string) =>
  hojasSubidas.unshift({
    personaId,
    nombre: archivo.name,
    peso: archivo.size,
    fecha: new Date().toISOString().slice(0, 10),
    subidoPor: quien,
    lote: de,
    archivo,
  })

/* Quien entró por un lote ------------------------------------------------------------------------------------ */

// Las candidaturas que entraron por importación en esta visita. Viven aquí y no en la pantalla porque la lectura
// sigue aunque se salga de la vacante: al volver (o en otra exploración), el proceso las suma a su lista.
export type EventoImportadas =
  | { tipo: 'entraron'; candidaturas: Candidatura[] }
  | { tipo: 'salieron'; ids: string[] }
  // Se le actualizaron los datos con la hoja nueva (VA-47): cambia la ficha, no la etapa.
  | { tipo: 'datos'; candidaturaId: string; candidato: Candidato }

let importadas: Candidatura[] = []
const oyentesImportadas = new Set<(evento: EventoImportadas) => void>()

export const registroDeImportadas = {
  todas: () => importadas,
  escuchar: (oyente: (evento: EventoImportadas) => void) => {
    oyentesImportadas.add(oyente)
    return () => {
      oyentesImportadas.delete(oyente)
    }
  },
}

const avisarImportadas = (evento: EventoImportadas) => oyentesImportadas.forEach((oyente) => oyente(evento))

/* El almacén de lotes ---------------------------------------------------------------------------------------- */

// Los lotes de cada vacante (o de la base), con el reloj que los lee. Fuera de las pantallas por lo mismo: la lectura
// sigue al salir de la vacante, el Centro de procesos la muestra y el aviso final trae de vuelta.
const BASE = 'base'
export const claveDe = (vacante?: VacanteUI) => vacante?.id ?? BASE

// Lo que la pantalla abierta le presta al almacén: quién está hoy en la vacante (para los repetidos) y cómo abrir un
// lote, su revisión o la gente que entró sin salir de ahí.
export type Enlace = {
  contexto: () => Conocidas
  ver: (loteId: string) => void
  revisar: (loteId: string) => void
  verEntraron?: (loteId: string) => void
  entrarEnLaBase?: (nuevas: Persona[]) => void
}

type Avisos = {
  // El proceso del Centro de procesos, con los textos y la acción que tocan.
  publicar: (clave: string, lote: LoteCvs) => void
  terminado: (clave: string, lote: LoteCvs) => void
  cortado: (clave: string, lote: LoteCvs) => void
}

const lotes = new Map<string, LoteCvs[]>()
const vacantes = new Map<string, VacanteUI | undefined>()
const enlaces = new Map<string, Enlace>()
const oyentesLotes = new Set<() => void>()
let avisos: Avisos | null = null
let reloj: number | null = null

const leerLotes = (clave: string) => lotes.get(clave) ?? []

function cambiarLotes(clave: string, cambio: (lista: LoteCvs[]) => LoteCvs[]) {
  const antes = leerLotes(clave)
  const despues = cambio(antes)
  lotes.set(clave, despues)
  despues.forEach((lote) => {
    if (lote.deLaSesion && antes.find((uno) => uno.id === lote.id) !== lote) avisos?.publicar(clave, lote)
  })
  oyentesLotes.forEach((oyente) => oyente())
  asegurarReloj()
}

const conLote = (clave: string, id: string, cambio: (lote: LoteCvs) => LoteCvs) =>
  cambiarLotes(clave, (lista) => lista.map((lote) => (lote.id === id ? cambio(lote) : lote)))

// Quién está hoy en la vacante: lo que diga la pantalla abierta o, si no hay ninguna, lo sembrado más lo importado.
function conocidasDe(clave: string): Conocidas {
  const enlace = enlaces.get(clave)
  if (enlace) return enlace.contexto()
  return {
    activas: [...importadas, ...CANDIDATURAS].filter((c) => c.vacante.id === clave),
    rechazadas: RECHAZADAS.filter((r) => r.candidatura.vacante.id === clave),
  }
}

function asegurarReloj() {
  const hay = [...lotes.values()].some((lista) => lista.some((lote) => lote.estado === 'leyendo'))
  if (hay && reloj === null) reloj = window.setInterval(tic, 240)
  if (!hay && reloj !== null) {
    window.clearInterval(reloj)
    reloj = null
  }
}

// Al terminar un lote, lo que entró y aún no se había entregado queda marcado; lo que queda en cola, en pausa.
function cerrarLote(lote: LoteCvs) {
  const nuevos = lote.archivos.filter((archivo) => archivo.estado === 'listo' && !archivo.entregado && archivo.datos)
  const terminado: LoteCvs = {
    ...lote,
    estado: 'terminado',
    interrumpido: false,
    archivos: lote.archivos.map((archivo) =>
      archivo.estado === 'listo' ? { ...archivo, entregado: true } : archivo.estado === 'espera' ? { ...archivo, estado: 'sin-leer' } : archivo,
    ),
  }
  return { lote: terminado, nuevos }
}

// Lo nuevo pasa a la vacante (o a la base). Cada archivo guarda la candidatura que salió de él.
function entregar(clave: string, lote: LoteCvs, nuevos: ArchivoLote[]): LoteCvs {
  const vacante = vacantes.get(clave)
  if (!nuevos.length) return lote
  // Si la vacante se cerró mientras se leía el lote, nadie entra: las hojas quedan leídas y sin entregar, y el aviso lo
  // dice (VA-17). Al reabrirla y volver a importar, entran.
  if (vacante && (buscarVacanteUI(vacante.id)?.estado ?? vacante.estado) === 'Cerrada') {
    notify(
      `Nadie del lote «${lote.nombre}» entró`,
      'La vacante se cerró mientras se leía.',
      'warning',
    )
    return { ...lote, cerradoAlLeer: true, archivos: lote.archivos.map((archivo) => (nuevos.includes(archivo) ? { ...archivo, entregado: true } : archivo)) }
  }
  if (vacante) {
    const candidaturas = nuevos.map((archivo) => candidaturaDeArchivo(archivo, vacante, lote))
    candidaturas.forEach((c, indice) => subirHoja(c.personaId, nuevos[indice], lote))
    importadas = [...candidaturas, ...importadas.filter((c) => !candidaturas.some((nueva) => nueva.id === c.id))]
    // Quien entra a una vacante entra también a la base («Mis candidatos»), con ese proceso anotado: una persona, un
    // registro. Quien ya estaba en la base solo suma el proceso (VA-02).
    const conocidas = new Set(baseDeCandidatos.leer().map((persona) => persona.id))
    const nuevasEnLaBase = nuevos
      .map((archivo, indice) => ({ ...personaDeArchivo(archivo, lote), id: candidaturas[indice].personaId }))
      .filter((persona) => !conocidas.has(persona.id))
    if (nuevasEnLaBase.length) baseDeCandidatos.agregar(nuevasEnLaBase)
    anotarProcesos(candidaturas)
    // Si el lote entra a una etapa que no es la primera (p. ej. Serena AI), la entrada y la invitación quedan en su
    // historial (VA-08).
    const entradas = entradasA(candidaturas, vacante.etapas, lote.quien ?? QUIEN_MUEVE, (buscarVacanteUI(vacante.id)?.estado ?? vacante.estado) === 'Borrador')
    if (entradas.length) registroDeMovimientos.agregar(entradas)
    // Cada invitación aparta sus créditos en Créditos, como al mover (13 oct, PM).
    creditosDeCambios(entradas, new Map(candidaturas.map((c) => [c.id, c.candidato.nombre])))
    avisarImportadas({ tipo: 'entraron', candidaturas })
    const ids = new Map(nuevos.map((archivo, indice) => [archivo.id, candidaturas[indice].id]))
    return { ...lote, archivos: lote.archivos.map((archivo) => (ids.has(archivo.id) ? { ...archivo, candidaturaId: ids.get(archivo.id) } : archivo)) }
  }
  const nuevas = nuevos.map((archivo) => personaDeArchivo(archivo, lote))
  baseDeCandidatos.agregar(nuevas)
  enlaces.get(clave)?.entrarEnLaBase?.(nuevas)
  const ids = new Map(nuevos.map((archivo, indice) => [archivo.id, nuevas[indice].id]))
  return { ...lote, archivos: lote.archivos.map((archivo) => (ids.has(archivo.id) ? { ...archivo, personaBaseId: ids.get(archivo.id) } : archivo)) }
}

function tic() {
  const terminados: { clave: string; lote: LoteCvs }[] = []
  const cortados: { clave: string; lote: LoteCvs }[] = []
  lotes.forEach((lista, clave) => {
    if (!lista.some((lote) => lote.estado === 'leyendo')) return
    const vacante = vacantes.get(clave)
    cambiarLotes(clave, (todos) =>
      todos.map((lote) => {
        if (lote.estado !== 'leyendo') return lote
        let archivos = lote.archivos
        const enCurso = archivos.findIndex((archivo) => archivo.estado === 'leyendo')
        if (enCurso >= 0) {
          // Lo que van leyendo los otros lotes de la vacante que todavía no terminan: dos lotes a la vez con la misma
          // persona la entregarían dos veces (VA-28).
          const enOtrosLotes = todos
            .filter((otro) => otro.id !== lote.id && otro.estado !== 'terminado')
            .flatMap((otro) => otro.archivos.map((uno) => ({ lote: `«${otro.nombre}», ${otro.fecha.toLowerCase()}`, archivo: uno })))
          const leido = leerArchivo(archivos[enCurso], { vacante, ...conocidasDe(clave), previos: archivos, enOtrosLotes })
          archivos = archivos.map((archivo, n) => (n === enCurso ? leido : archivo))
        }
        const leidos = archivos.filter((archivo) => !['espera', 'leyendo', 'sin-leer'].includes(archivo.estado)).length
        // Se corta la conexión: se detiene solo, con lo leído a salvo.
        if (lote.cortarEn !== undefined && leidos >= lote.cortarEn) {
          const cortado: LoteCvs = { ...lote, estado: 'detenido', interrumpido: true, cortarEn: undefined, archivos }
          cortados.push({ clave, lote: cortado })
          return cortado
        }
        const siguiente = archivos.findIndex((archivo) => archivo.estado === 'espera')
        if (siguiente >= 0) return { ...lote, archivos: archivos.map((archivo, n) => (n === siguiente ? { ...archivo, estado: 'leyendo' as const } : archivo)) }
        const { lote: cerrado, nuevos } = cerrarLote({ ...lote, archivos })
        const entregado = entregar(clave, cerrado, nuevos)
        terminados.push({ clave, lote: entregado })
        return entregado
      }),
    )
  })
  cortados.forEach(({ clave, lote }) => avisos?.cortado(clave, lote))
  terminados.forEach(({ clave, lote }) => {
    avisos?.terminado(clave, lote)
    empezarLaSiguienteParte(clave, lote)
  })
}

// Un envío de más de 200: al terminar una parte empieza la que sigue.
function empezarLaSiguienteParte(clave: string, lote: LoteCvs) {
  const siguiente = leerLotes(clave).find((otro) => otro.estado === 'en-cola' && otro.parte && lote.parte && otro.parte.n === lote.parte.n + 1)
  if (!siguiente) return
  conLote(clave, siguiente.id, (uno) => ({
    ...uno,
    estado: 'leyendo',
    archivos: uno.archivos.map((archivo, indice) => (indice === 0 ? { ...archivo, estado: 'leyendo' } : archivo)),
  }))
}

export const almacenDeLotes = {
  // Los lotes de una vacante (o de la base). La primera vez se siembran los que ya había.
  de(vacante?: VacanteUI) {
    const clave = claveDe(vacante)
    if (!lotes.has(clave)) lotes.set(clave, lotesIniciales(vacante))
    vacantes.set(clave, vacante)
    return leerLotes(clave)
  },
  suscribir(oyente: () => void) {
    oyentesLotes.add(oyente)
    return () => {
      oyentesLotes.delete(oyente)
    }
  },
  // La pantalla abierta se presenta; al irse, se quita (si nadie más ocupó su lugar).
  enlazar(clave: string, enlace: Enlace) {
    enlaces.set(clave, enlace)
    return () => {
      if (enlaces.get(clave) === enlace) enlaces.delete(clave)
    }
  },
  enlaceDe: (clave: string) => enlaces.get(clave),
  vacanteDe: (clave: string) => vacantes.get(clave),
  configurarAvisos(nuevos: Avisos) {
    avisos = nuevos
  },
  conocidasDe,

  // Un envío nuevo. Con más de 200 hojas de vida se parte en lotes de 200 que se leen uno detrás de otro.
  importar(
    vacante: VacanteUI | undefined,
    elegidos: Elegido[],
    opciones: { nombre: string; etapa?: string; origen: string; referidoPor?: string; aviso?: string; etiquetas?: string[]; quien: string; ruta: string },
  ): LoteCvs[] {
    const archivos = archivosDe(elegidos)
    if (!archivos.length) return []
    const clave = claveDe(vacante)
    const partes = Math.ceil(archivos.length / LIMITE_POR_LOTE)
    const cortarEn = elegidos.find((elegido) => elegido.cortarEn !== undefined)?.cortarEn
    const nuevos: LoteCvs[] = Array.from({ length: partes }, (_, n) => {
      const suyos = archivos.slice(n * LIMITE_POR_LOTE, (n + 1) * LIMITE_POR_LOTE)
      return {
        id: nuevoIdDeLote(),
        nombre: partes > 1 ? `${opciones.nombre} (${n + 1} de ${partes})` : opciones.nombre,
        fecha: ahoraEnTexto(),
        quien: opciones.quien,
        etapa: vacante ? (opciones.etapa ?? primeraEtapaDe(vacante.etapas)) : undefined,
        origen: opciones.origen,
        referidoPor: opciones.referidoPor,
        aviso: opciones.aviso,
        etiquetas: opciones.etiquetas,
        tipo: 'hojas',
        // Uno detrás de otro: el primero lee y los demás esperan su turno.
        estado: n === 0 ? 'leyendo' : 'en-cola',
        cortarEn: n === 0 ? cortarEn : undefined,
        parte: partes > 1 ? { n: n + 1, de: partes } : undefined,
        deLaSesion: true,
        ruta: opciones.ruta,
        archivos: suyos.map((archivo, indice) => (indice === 0 && n === 0 ? { ...archivo, estado: 'leyendo' } : archivo)),
      }
    })
    vacantes.set(clave, vacante)
    if (!lotes.has(clave)) lotes.set(clave, lotesIniciales(vacante))
    cambiarLotes(clave, (lista) => [...nuevos, ...lista])
    return nuevos
  },

  // Un lote que no se lee (una hoja de cálculo: los datos ya vienen en columnas). Entra terminado y queda en el
  // historial; lo que entra a la base lo entrega quien lo arma.
  registrar(vacante: VacanteUI | undefined, lote: Omit<LoteCvs, 'id' | 'fecha'>): LoteCvs {
    const clave = claveDe(vacante)
    if (!lotes.has(clave)) lotes.set(clave, lotesIniciales(vacante))
    vacantes.set(clave, vacante)
    const nuevo: LoteCvs = { ...lote, id: nuevoIdDeLote(), fecha: ahoraEnTexto() }
    cambiarLotes(clave, (lista) => [nuevo, ...lista])
    return nuevo
  },

  // Deshacer un lote de la base: sale de la base quien entró con él y no ha entrado a ningún proceso. Devuelve quiénes
  // salieron y cómo devolverlas.
  sacarDeLaBase(loteId: string) {
    const lote = leerLotes(BASE).find((uno) => uno.id === loteId)
    if (!lote) return { salen: [] as Persona[], quedan: [] as Persona[], deshacer: () => {} }
    // Solo quien entró con el lote: en una hoja de cálculo, las filas que actualizaron a alguien que ya estaba también
    // guardan su ficha, y esa persona no sale.
    const suyas = lote.archivos
      .filter((archivo) => archivo.estado === 'listo' && !archivo.sacado)
      .map((archivo) => archivo.personaBaseId)
      .filter((id): id is string => Boolean(id))
    const enLaBase = baseDeCandidatos.leer().filter((persona) => suyas.includes(persona.id))
    const salen = enLaBase.filter((persona) => !persona.procesos.length)
    const quedan = enLaBase.filter((persona) => persona.procesos.length)
    const ids = salen.map((persona) => persona.id)
    baseDeCandidatos.quitar(ids)
    conLote(BASE, loteId, (uno) => ({
      ...uno,
      retirado: { salieron: salen.length, quedaron: quedan.length },
      archivos: uno.archivos.map((archivo) => (archivo.personaBaseId && ids.includes(archivo.personaBaseId) ? { ...archivo, sacado: true } : archivo)),
    }))
    return {
      salen,
      quedan,
      deshacer: () => {
        baseDeCandidatos.agregar(salen)
        conLote(BASE, loteId, (uno) => ({
          ...uno,
          retirado: undefined,
          archivos: uno.archivos.map((archivo) => (archivo.personaBaseId && ids.includes(archivo.personaBaseId) ? { ...archivo, sacado: false } : archivo)),
        }))
      },
    }
  },

  detener: (clave: string, id: string) =>
    conLote(clave, id, (lote) => ({
      ...lote,
      estado: 'detenido',
      interrumpido: false,
      archivos: lote.archivos.map((archivo) => (archivo.estado === 'leyendo' ? { ...archivo, estado: 'espera' } : archivo)),
    })),

  seguir: (clave: string, id: string) =>
    conLote(clave, id, (lote) => {
      const siguiente = lote.archivos.findIndex((archivo) => archivo.estado === 'espera' || archivo.estado === 'sin-leer')
      return {
        ...lote,
        estado: siguiente >= 0 ? 'leyendo' : 'terminado',
        interrumpido: false,
        archivos: lote.archivos.map((archivo, n) =>
          n === siguiente ? { ...archivo, estado: 'leyendo' } : archivo.estado === 'sin-leer' ? { ...archivo, estado: 'espera' } : archivo,
        ),
      }
    }),

  // Detenido: se queda con lo leído y entrega eso; lo demás queda «sin leer» y se puede retomar.
  terminarAsi(clave: string, id: string) {
    const lote = leerLotes(clave).find((uno) => uno.id === id)
    if (!lote) return
    const { lote: cerrado, nuevos } = cerrarLote(lote)
    const entregado = entregar(clave, cerrado, nuevos)
    conLote(clave, id, () => entregado)
    avisos?.terminado(clave, entregado)
    empezarLaSiguienteParte(clave, entregado)
  },

  // Revisar lo dudoso: se confirma un dato (entra al cerrar la revisión, junto con las demás) o se descarta.
  confirmar: (clave: string, loteId: string, archivoId: string, datos: DatosLeidos) =>
    conLote(clave, loteId, (lote) => {
      const vacante = vacantes.get(clave)
      return {
        ...lote,
        archivos: lote.archivos.map((archivo) =>
          archivo.id === archivoId
            ? { ...archivo, estado: 'listo', confirmado: true, datos, duda: undefined, criterios: vacante ? evaluarHoja(datos, vacante, archivo.nombre) : undefined }
            : archivo,
        ),
      }
    }),
  descartar: (clave: string, loteId: string, archivoId: string) =>
    conLote(clave, loteId, (lote) => ({
      ...lote,
      archivos: lote.archivos.map((archivo) => (archivo.id === archivoId ? { ...archivo, estado: 'descartado' } : archivo)),
    })),
  // Al revisar, el correo que se escribió es de alguien que ya está en la vacante: no se duplica.
  esLaMisma: (clave: string, loteId: string, archivoId: string, candidatura: Candidatura) =>
    conLote(clave, loteId, (lote) => ({
      ...lote,
      archivos: lote.archivos.map((archivo) =>
        archivo.id === archivoId
          ? {
              ...archivo,
              estado: 'repetido',
              duda: undefined,
              repetido: { donde: 'vacante', nombre: candidatura.candidato.nombre, candidaturaId: candidatura.id, etapa: candidatura.etapa },
            }
          : archivo,
      ),
    })),
  entregarConfirmados(clave: string, loteId: string, ids: string[]) {
    const lote = leerLotes(clave).find((uno) => uno.id === loteId)
    if (!lote) return 0
    const confirmados = lote.archivos.filter((archivo) => ids.includes(archivo.id) && archivo.estado === 'listo' && archivo.datos && !archivo.entregado)
    if (!confirmados.length) return 0
    const marcado = { ...lote, archivos: lote.archivos.map((archivo) => (confirmados.includes(archivo) ? { ...archivo, entregado: true } : archivo)) }
    const entregado = entregar(clave, marcado, confirmados)
    conLote(clave, loteId, () => entregado)
    return confirmados.length
  },

  // Volver a subir un archivo que no se pudo leer: entra al mismo lote y se lee de nuevo.
  reemplazar: (clave: string, loteId: string, archivoId: string, archivo: File) =>
    conLote(clave, loteId, (lote) => ({
      ...lote,
      estado: 'leyendo',
      archivos: lote.archivos.map((uno) =>
        uno.id === archivoId ? { id: `${uno.id}-v2`, nombre: archivo.name, peso: archivo.size, estado: 'leyendo', archivo, deZip: undefined } : uno,
      ),
    })),

  // Quien ya estaba en la vacante: su hoja de vida se cambia por la de este lote (queda en «Documentos»).
  actualizarHoja(clave: string, loteId: string, archivoId: string) {
    const lote = leerLotes(clave).find((uno) => uno.id === loteId)
    const archivo = lote?.archivos.find((uno) => uno.id === archivoId)
    const candidatura = archivo?.repetido?.candidaturaId ? conocidasDe(clave).activas.find((c) => c.id === archivo.repetido?.candidaturaId) : undefined
    if (!lote || !archivo?.repetido || !candidatura) return
    subirHoja(candidatura.personaId, archivo, lote)
    conLote(clave, loteId, (uno) => ({
      ...uno,
      archivos: uno.archivos.map((otro) => (otro.id === archivoId && otro.repetido ? { ...otro, repetido: { ...otro.repetido, actualizada: true } } : otro)),
    }))
  },

  // Quien entró con su ficha de siempre y trae una hoja nueva con otro cargo o empresa: sus datos se cambian por los de la
  // hoja, en la vacante y en la base (VA-47). Devuelve cómo deshacerlo.
  actualizarDatos(clave: string, loteId: string, archivoId: string): (() => void) | null {
    const archivo = leerLotes(clave).find((uno) => uno.id === loteId)?.archivos.find((uno) => uno.id === archivoId)
    const novedad = archivo?.novedad
    const candidatura = archivo?.candidaturaId ? conocidasDe(clave).activas.find((c) => c.id === archivo.candidaturaId) : undefined
    if (!archivo?.personaId || !novedad || novedad.aplicada || !candidatura) return null
    const personaId = archivo.personaId
    const antes = candidatura.candidato
    const persona = baseDeCandidatos.deId(personaId)
    const { cargo, empresa, ciudad, anios } = novedad
    const ahora: Candidato = {
      ...antes,
      cargo,
      empresa,
      ciudad,
      anios,
      // El trabajo nuevo va primero; el de antes queda cerrado en su trayectoria.
      trayectoria: [
        { cargo, empresa, periodo: '2026 – hoy' },
        ...antes.trayectoria.map((trabajo, indice) => (indice === 0 ? { ...trabajo, periodo: trabajo.periodo.replace('hoy', '2026') } : trabajo)),
      ],
    }
    const aplicar = (candidato: Candidato, datos: Pick<Persona, 'cargo' | 'empresa' | 'ciudad' | 'anios'> | undefined, aplicada: boolean) => {
      importadas = importadas.map((c) => (c.id === candidatura.id ? { ...c, candidato } : c))
      if (datos) baseDeCandidatos.cambiar((todas) => todas.map((una) => (una.id === personaId ? { ...una, ...datos } : una)))
      avisarImportadas({ tipo: 'datos', candidaturaId: candidatura.id, candidato })
      conLote(clave, loteId, (lote) => ({
        ...lote,
        archivos: lote.archivos.map((uno) => (uno.id === archivoId && uno.novedad ? { ...uno, novedad: { ...uno.novedad, aplicada } } : uno)),
      }))
    }
    aplicar(ahora, { cargo, empresa, ciudad, anios }, true)
    return () => aplicar(antes, persona && { cargo: persona.cargo, empresa: persona.empresa, ciudad: persona.ciudad, anios: persona.anios }, false)
  },

  // Sacar de la vacante a quien entró con el lote y sigue donde entró. Devuelve lo necesario para deshacerlo.
  sacar(clave: string, loteId: string, ids: string[], quedaron: number) {
    const salen = importadas.filter((c) => ids.includes(c.id))
    importadas = importadas.filter((c) => !ids.includes(c.id))
    avisarImportadas({ tipo: 'salieron', ids })
    conLote(clave, loteId, (lote) => ({
      ...lote,
      retirado: { salieron: ids.length, quedaron },
      archivos: lote.archivos.map((archivo) => (archivo.candidaturaId && ids.includes(archivo.candidaturaId) ? { ...archivo, sacado: true } : archivo)),
    }))
    return salen
  },
  devolver(clave: string, loteId: string, candidaturas: Candidatura[]) {
    importadas = [...candidaturas, ...importadas]
    avisarImportadas({ tipo: 'entraron', candidaturas })
    const ids = candidaturas.map((c) => c.id)
    conLote(clave, loteId, (lote) => ({
      ...lote,
      retirado: undefined,
      archivos: lote.archivos.map((archivo) => (archivo.candidaturaId && ids.includes(archivo.candidaturaId) ? { ...archivo, sacado: false } : archivo)),
    }))
  },
}

// Los que entraron con un lote y siguen en la vacante: para filtrar la bandeja, el pipeline o la cola por lote.
export const delLote = (loteId: string | null) => (c: Candidatura) => Boolean(loteId) && c.importada?.loteId === loteId

/* Lo que se dice de un lote ---------------------------------------------------------------------------------- */

// «9 entraron a Evaluación CV · 3 necesitan tu confirmación · 1 no se pudo leer.»
export function resumenDeLote(lote: LoteCvs) {
  const cuentas = cuentasDe(lote)
  const donde = lote.etapa ? tituloEtapa(lote.etapa) : 'tu base'
  const partes = [
    cuentas.listos
      ? `${cuentas.listos} ${cuentas.listos === 1 ? 'entró' : 'entraron'} a ${donde}`
      : lote.cerradoAlLeer
        ? 'No entró nadie: la vacante se cerró mientras se leía'
        : 'No entró nadie todavía',
    cuentas.dudosos ? `${cuentas.dudosos} ${cuentas.dudosos === 1 ? 'necesita' : 'necesitan'} tu confirmación` : null,
    cuentas.repetidos ? `${cuentas.repetidos} ya ${cuentas.repetidos === 1 ? 'estaba' : 'estaban'}` : null,
    cuentas.fallidos ? `${cuentas.fallidos} no se ${cuentas.fallidos === 1 ? 'pudo' : 'pudieron'} leer` : null,
    cuentas.sinLeer ? `${cuentas.sinLeer} en pausa` : null,
  ].filter(Boolean)
  const aviso = lote.aviso && cuentas.listos ? ` A ${personas(cuentas.listos)} les llegó tu correo «Recibimos tu CV».` : ''
  return `${partes.join(' · ')}.${aviso}`
}

// El mismo resumen para un aviso, en corto: cuántas entraron y lo que espera algo de ti (confirmar o volver a subir).
export function resumenCortoDeLote(lote: LoteCvs) {
  const cuentas = cuentasDe(lote)
  const pendiente = cuentas.dudosos
    ? `${cuentas.dudosos} por confirmar`
    : cuentas.fallidos
      ? `${cuentas.fallidos} sin leer`
      : cuentas.repetidos
        ? `${cuentas.repetidos} ya ${cuentas.repetidos === 1 ? 'estaba' : 'estaban'}`
        : null
  return [cuentas.listos ? `${cuentas.listos} ${cuentas.listos === 1 ? 'entró' : 'entraron'}` : 'No entró nadie', pendiente].filter(Boolean).join(' · ') + '.'
}

export const textoHojas = hojas
export const textoPersonas = personas
