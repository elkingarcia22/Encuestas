import { fechaSinAnio, generador, isoHaceDias, plural } from '@/modules/design-system/patrones/formato'
import {
  evaluacionCV,
  perfilDe,
  postulacionesDe,
  psicometricaDe,
  puntajePonderado,
  roleplayDe,
  serenaDe,
  type EvaluacionCV,
  type Psicometrica,
  type Roleplay,
  type Serena,
} from '../vacantes/detalle/candidato/components/expediente-data'
import type { Candidato, EstadoRequisito, Nota, Vacante } from '../vacantes/detalle/components/data'
import {
  CANDIDATURAS,
  OTRAS_DE,
  RECHAZADAS,
  VACANTES_UI,
  etapasDe,
  tituloEtapa,
  type Candidatura,
  type EtapaVacante,
  type Rechazada,
  type VacanteUI,
} from './datos'
import { cambiosDeEtapa, marcasDe, type CambioEtapa, type Movimiento } from './movimientos'
import { quienDe } from './rechazos'
import { hojasSubidasDe, pesoEnTexto } from './importacion'
import { familiaDe } from './familias'
// La lectura de cada respuesta de Serena y la respuesta citada dependen del mismo puntaje: hablan de lo mismo (CA-21).
import { lecturaDe, puntajesPorPregunta } from './respuestas-serena'
import { origenDeFicha, type Persona } from './personas'

// El perfil completo de una persona: todo lo que el producto de hoy muestra en el cajón del candidato (datos
// personales, ubicación y condiciones, experiencia, educación, documentos e historial de vacantes con sus etapas),
// armado para las tres exploraciones y para «Mis candidatos».
//
// 24 sep, Nicolás, comparando con el producto: «mira toda la información que se puede ver de un candidato, y eso no
// lo tienes ni un 2 %». Lo que ya existía se reutiliza tal cual: la persona sale de `data.ts`, y las evaluaciones
// (CV, Serena, psicométricas, roleplay), la formación, los logros, los documentos y las postulaciones pasadas salen
// de `expediente-data.ts`, que es del expediente de Cristian y aquí solo se lee.
//
// Lo que ninguno de los dos trae (celular de quien está en la base, nacionalidad, identificación, fecha de
// nacimiento, preaviso, LinkedIn, más puestos y estudios) se completa con una secuencia fija sacada del id de la
// persona: la misma persona sale con los mismos datos en cada recarga, y a unas pocas les falta un dato a propósito,
// porque «No registrado» es un caso que la pantalla tiene que resolver.

/* Tipos ---------------------------------------------------------------------------------------------- */

export type Experiencia = {
  cargo: string
  empresa: string
  // «Diciembre 2024» o «2023»; «Actualidad» si sigue ahí.
  desde: string
  hasta: string
  duracion?: string
  descripcion?: string
  actual: boolean
}

export type Estudio = { titulo: string; institucion: string; periodo: string }

export type DocumentoCandidato = {
  id: string
  nombre: string
  // Qué es: hoja de vida, certificado laboral, diploma…
  clase: string
  // El formato del archivo: PDF, DOCX…
  tipo: string
  peso: string
  // Fecha de carga, en ISO.
  fecha: string
  subidoPor: string
  // El archivo real, solo en lo que se sube durante la sesión: se descarga tal cual.
  archivo?: File
  // La hoja de vida no se borra, se reemplaza (29 sep, reunión con Elkin): la nueva dice a cuál reemplazó.
  reemplazaA?: string
}

// La hoja de vida es el único documento que no se elimina: se reemplaza.
// «CV» desde el 8 oct (VP de producto: en México no entienden «hoja de vida»); se reconoce también el nombre viejo.
export const esHojaDeVida = (documento: DocumentoCandidato) => /hoja de vida|\bcv\b/i.test(documento.clase)

export type EstadoPostulacion = 'En curso' | 'Rechazado' | 'Contratado' | 'Retiró su postulación'

// Cómo quedó cada etapa dentro de una postulación. «Retiro» es la etapa donde la persona se bajó del proceso;
// «saltada», una que se pasó de largo al moverla; «sin-terminar», una entrevista de IA que se canceló al moverla.
export type EstadoEtapa = 'completada' | 'actual' | 'pendiente' | 'rechazada' | 'retiro' | 'saltada' | 'sin-terminar'

// Una pregunta de Serena con su puntaje y la lectura de la respuesta: la cita del producto.
export type PreguntaSerena = { numero: number; pregunta: string; respuesta: string; puntaje: number; lectura: string }

// Una vez anterior de la entrevista con Serena, si la repitió (CA-38): no cuenta para la decisión.
export type IntentoSerena = { numero: number; puntaje: number; fecha: string; motivo: string }

export type EvaluacionEtapa =
  | { tipo: 'cv'; cv: EvaluacionCV }
  // `intentos`: las veces de antes, si la repitió; la de `serena` es la última completa y la que cuenta (CA-38).
  | { tipo: 'serena'; serena: Serena; preguntas: PreguntaSerena[]; intentos?: IntentoSerena[] }
  // Una entrevista que se cortó antes de terminar (CA-37): lo que alcanzó a responder, sin puntaje.
  | {
      tipo: 'serena-sin-terminar'
      respondidas: number
      de: number
      minuto: number
      motivo: string
      fecha: string
      preguntas: PreguntaSerena[]
    }
  | { tipo: 'psicometricas'; psicometrica: Psicometrica }
  | { tipo: 'roleplay'; roleplay: Roleplay; puntaje: number }

export type EtapaPostulacion = {
  id: string
  titulo: string
  descripcion: string
  ia: boolean
  estado: EstadoEtapa
  evaluacion?: EvaluacionEtapa
  // Qué se muestra cuando la etapa no tiene resultado: por qué no lo tiene, dicho en una frase.
  sinResultado?: string
  // Sin lectura de la hoja de vida: no la trae (CA-44) o la IA no la pudo leer (CA-14). La etapa ofrece la salida.
  salida?: 'sin-hoja' | 'ilegible'
  // El motivo, en la etapa donde se rechazó a la persona o donde se retiró.
  motivo?: string
  // Lo que pasó con la etapa al mover a la persona: se saltó, se canceló su entrevista, volvió a ella…
  nota?: string
  comentarios: Nota[]
}

export type Postulacion = {
  id: string
  // Notas sobre la persona, no sobre una etapa (CA-24).
  generales?: Nota[]
  vacante: string
  vacanteId?: string
  // La candidatura viva, si la hay: desde «Mis candidatos» se abre su ficha.
  candidaturaId?: string
  // Fecha de postulación, en ISO.
  fecha: string
  estado: EstadoPostulacion
  // La etapa hasta donde llegó (o donde está).
  etapa: string
  motivo?: string
  // Es la vacante de la ficha que se está mirando.
  actual: boolean
  etapas: EtapaPostulacion[]
  // Los cambios de etapa, del más nuevo al más viejo (solo en la vacante de la ficha).
  cambios?: CambioEtapa[]
}

export type PerfilCompleto = {
  id: string
  nombreCompleto: string
  nombre: string
  apellido: string
  iniciales: string
  cargo: string
  empresa: string
  correo: string
  celular?: string
  linkedin?: string
  nacionalidad?: string
  identificacion?: string
  // Fecha de nacimiento, en ISO.
  nacimiento?: string
  edad?: number
  ciudad: string
  // Departamento o distrito: «Bogotá, D.C.», «Antioquia».
  region: string
  pais: string
  reubicacion?: boolean
  anios: number
  disponibilidad?: string
  preaviso?: string
  // Salario esperado en millones de pesos al mes (la `pretension` de siempre).
  salario?: number
  moneda: string
  // Cómo llegó: «LinkedIn», «Importada en un lote · hace 3 meses».
  origen: string
  habilidades: string[]
  resumen: string
  experiencia: Experiencia[]
  educacion: Estudio[]
  documentos: DocumentoCandidato[]
  historial: Postulacion[]
}

/* Puntajes de la IA ---------------------------------------------------------------------------------- */

// Lo que calificó la IA en cada etapa y su promedio, como el expediente original (29 sep, reunión con Elkin: el
// promedio y los puntajes de cada etapa). Salen todas las etapas que califica la IA, también las que la persona aún no
// presenta, para que se vea qué falta. Las psicométricas no dan un puntaje de 0 a 100 ni tienen mínimo: se dicen con su
// percentil y no entran al promedio.
export type PuntajeEtapa = {
  etapaId: string
  titulo: string
  // Su lugar en el proceso, desde 1.
  numero: number
  puntaje?: number
  minimo?: number
  pasa?: boolean
  // Lo que se dice sin puntaje de 0 a 100: el percentil de las psicométricas o por qué todavía no hay.
  detalle?: string
}

// Las que califica la IA: las marcadas como de IA y la evaluación de la hoja de vida, que en las vacantes de siempre no
// lleva la marca pero la lee la IA contra los requisitos.
const calificaLaIA = (etapa: EtapaPostulacion) => etapa.ia || etapa.id === 'cv' || etapa.evaluacion !== undefined

const SIN_PUNTAJE: Partial<Record<EstadoEtapa, string>> = {
  pendiente: 'Aún no llega a esta etapa',
  saltada: 'Se saltó esta etapa',
  'sin-terminar': 'Su entrevista quedó sin terminar',
  rechazada: 'Se quedó aquí antes de presentarla',
  retiro: 'Se retiró antes de presentarla',
  completada: 'Sin puntaje guardado',
}

export function puntajesIA(postulacion: Postulacion): { etapas: PuntajeEtapa[]; promedio?: number } {
  const etapas = postulacion.etapas.flatMap((etapa, indice): PuntajeEtapa[] => {
    if (!calificaLaIA(etapa)) return []
    const base = { etapaId: etapa.id, titulo: etapa.titulo, numero: indice + 1 }
    const evaluacion = etapa.evaluacion
    if (evaluacion?.tipo === 'cv') return [{ ...base, puntaje: evaluacion.cv.match, minimo: evaluacion.cv.umbral, pasa: evaluacion.cv.pasa }]
    if (evaluacion?.tipo === 'serena') {
      const { puntaje, minimo } = evaluacion.serena
      return [{ ...base, puntaje, minimo, pasa: puntaje >= minimo }]
    }
    if (evaluacion?.tipo === 'roleplay') return [{ ...base, puntaje: evaluacion.puntaje, minimo: evaluacion.roleplay.minimo, pasa: evaluacion.puntaje >= evaluacion.roleplay.minimo }]
    // Una entrevista a medias no tiene puntaje: no entra al promedio (CA-37).
    if (evaluacion?.tipo === 'serena-sin-terminar') return [{ ...base, detalle: `Sin terminar · respondió ${evaluacion.respondidas} de ${evaluacion.de} preguntas` }]
    if (evaluacion?.tipo === 'psicometricas') {
      const { pruebas } = evaluacion.psicometrica
      const percentil = Math.round(pruebas.reduce((suma, prueba) => suma + prueba.percentil, 0) / Math.max(1, pruebas.length))
      return [{ ...base, detalle: `${plural(pruebas.length, '1 prueba', `${pruebas.length} pruebas`)} · percentil ${percentil} en promedio` }]
    }
    return [{ ...base, detalle: etapa.estado === 'actual' ? (etapa.sinResultado ?? 'Todavía no la presenta') : SIN_PUNTAJE[etapa.estado] }]
  })
  const conPuntaje = etapas.filter((etapa) => etapa.puntaje !== undefined)
  const promedio = conPuntaje.length ? Math.round(conPuntaje.reduce((suma, etapa) => suma + (etapa.puntaje ?? 0), 0) / conPuntaje.length) : undefined
  return { etapas, promedio }
}

/* Utilidades ----------------------------------------------------------------------------------------- */

// La secuencia de cada persona sale de su id: siempre la misma, sin azar entre recargas.
const semillaDe = (texto: string) => [...texto].reduce((h, letra) => (h * 31 + letra.charCodeAt(0)) % 2_147_483_647, 7) || 1
const azarDe = (texto: string) => generador(semillaDe(texto))

const tomar = <T,>(azar: () => number, lista: T[]) => lista[Math.floor(azar() * lista.length)]

const sinTildes = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '')
const slug = (texto: string) =>
  sinTildes(texto)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

// Las funciones del expediente de Cristian piden su `Vacante`. La de las exploraciones es igual salvo el estado de
// publicación, que aquí tiene «Cerrada»: para el cálculo de evaluaciones el estado no cuenta.
export const aVacante = (vacante: VacanteUI): Vacante => ({ ...vacante, estado: vacante.estado === 'Borrador' ? 'Borrador' : 'Publicada' })

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const ABREVIADOS: Record<string, number> = { ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, sept: 8, oct: 9, nov: 10, dic: 11 }

// Hoy, en el calendario de los datos de ejemplo (septiembre de 2026).
const HOY_MES = { mes: 8, anio: 2026 }

type Mes = { mes?: number; anio: number } | 'hoy'

function leerMes(texto: string): Mes {
  const limpio = texto.trim().toLowerCase()
  if (limpio === 'hoy' || limpio === 'actualidad') return 'hoy'
  const [primero, segundo] = limpio.split(/\s+/)
  if (segundo) return { mes: ABREVIADOS[primero.slice(0, 4)] ?? ABREVIADOS[primero.slice(0, 3)], anio: Number(segundo) }
  return { anio: Number(primero) }
}

const escribirMes = (mes: Mes) => (mes === 'hoy' ? 'Actualidad' : mes.mes === undefined ? String(mes.anio) : `${MESES[mes.mes]} ${mes.anio}`)

function duracionEntre(desde: Mes, hasta: Mes): string | undefined {
  if (desde === 'hoy') return undefined
  const fin = hasta === 'hoy' ? HOY_MES : { mes: hasta.mes ?? 11, anio: hasta.anio }
  // Con solo el año («2025 – hoy») no se sabe el mes: se cuentan años enteros, sin inventar meses.
  if (desde.mes === undefined) {
    const anios = fin.anio - desde.anio
    return anios < 1 ? 'Menos de un año' : plural(anios, '1 año', `${anios} años`)
  }
  const meses = (fin.anio - desde.anio) * 12 + (fin.mes - (desde.mes ?? 0)) + 1
  if (meses <= 0) return undefined
  const anios = Math.floor(meses / 12)
  const resto = meses % 12
  if (!anios) return plural(resto, '1 mes', `${resto} meses`)
  return resto ? `${plural(anios, '1 año', `${anios} años`)} y ${plural(resto, '1 mes', `${resto} meses`)}` : plural(anios, '1 año', `${anios} años`)
}

// «Mar 2023 – hoy» → desde «Marzo 2023», hasta «Actualidad» y cuánto lleva.
function partirPeriodo(periodo: string) {
  const [inicio, fin = 'hoy'] = periodo.split(/\s+[–-]\s+/)
  const desde = leerMes(inicio)
  const hasta = leerMes(fin)
  return { desde: escribirMes(desde), hasta: escribirMes(hasta), duracion: duracionEntre(desde, hasta), actual: hasta === 'hoy' }
}

/* Familias de cargo: en `familias.ts` (las comparte la base global) ------------------------------------ */


const UNIVERSIDADES = [
  'Universidad Nacional de Colombia',
  'Universidad de los Andes',
  'Pontificia Universidad Javeriana',
  'Universidad EAFIT',
  'Universidad del Valle',
  'Universidad Industrial de Santander',
  'Universidad del Norte',
  'Universidad de Antioquia',
  'Politécnico Grancolombiano',
]

const EMPRESAS_ANTES = ['Bancolombia', 'Grupo Éxito', 'Sura', 'Nutresa', 'Alpina', 'Davivienda', 'Claro', 'Avianca', 'Falabella', 'Terpel', 'Corona', 'Postobón']

const REGIONES: Record<string, string> = {
  Bogotá: 'Bogotá, D.C.',
  Medellín: 'Antioquia',
  Cali: 'Valle del Cauca',
  Barranquilla: 'Atlántico',
  Bucaramanga: 'Santander',
  Pereira: 'Risaralda',
  Cartagena: 'Bolívar',
  Manizales: 'Caldas',
  Envigado: 'Antioquia',
  Chía: 'Cundinamarca',
  Funza: 'Cundinamarca',
  Mosquera: 'Cundinamarca',
  Soacha: 'Cundinamarca',
}

/* Datos personales ----------------------------------------------------------------------------------- */

const miles = (n: number) => n.toLocaleString('es-CO')

function identificacionDe(azar: () => number, nacionalidad: string) {
  if (nacionalidad === 'Venezolana') return `PPT ${miles(4_000_000 + Math.floor(azar() * 5_000_000))}`
  if (nacionalidad === 'Ecuatoriana') return `C.E. ${miles(300_000 + Math.floor(azar() * 600_000))}`
  return `C.C. ${miles(1_000_000_000 + Math.floor(azar() * 99_000_000))}`
}

function nacimientoDe(azar: () => number, anios: number) {
  const edadBuscada = 21 + anios + Math.floor(azar() * 5)
  const mes = Math.floor(azar() * 12)
  const dia = 1 + Math.floor(azar() * 28)
  const anio = 2026 - edadBuscada
  const iso = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
  // Si todavía no cumple años este año (el «hoy» de los datos es el 11 de septiembre), tiene uno menos.
  const cumplio = mes < 8 || (mes === 8 && dia <= 11)
  return { iso, edad: cumplio ? edadBuscada : edadBuscada - 1 }
}

// Si sus estudios empezaron antes de lo que da la edad, la edad sube: entró a estudiar a los 17 como pronto.
function conEstudios(nacimiento: { iso: string; edad: number }, educacion: Estudio[]) {
  const inicios = educacion.map((estudio) => Number(estudio.periodo.match(/\d{4}/)?.[0])).filter((anio) => anio > 1950)
  if (!inicios.length) return nacimiento
  const minima = 2026 - Math.min(...inicios) + 17
  if (nacimiento.edad >= minima) return nacimiento
  const anio = Number(nacimiento.iso.slice(0, 4)) - (minima - nacimiento.edad)
  return { iso: `${anio}${nacimiento.iso.slice(4)}`, edad: minima }
}

const disponibilidadTexto = (dias: number) => (dias === 0 ? 'Inmediata' : `En ${dias} días`)

/* Trayectoria y estudios ----------------------------------------------------------------------------- */

function experienciaDe(c: Candidato, logros: (string | undefined)[], azar: () => number): Experiencia[] {
  const familia = familiaDe(c.cargo)
  const conocidos: Experiencia[] = c.trayectoria.map((paso, indice) => {
    const periodo = partirPeriodo(paso.periodo)
    // Las escritas a mano traen su logro; a las demás se les da uno del oficio, y a una de cada tres ninguno: el
    // producto dice «No se encontró descripción para esta experiencia», y ese caso tiene que verse.
    const descripcion = logros[indice] ?? (azar() < 0.3 ? undefined : familia.descripciones[(indice + Math.floor(azar() * 3)) % familia.descripciones.length])
    return { cargo: paso.cargo, empresa: paso.empresa, ...periodo, descripcion }
  })

  // Con un solo puesto y muchos años, falta la historia de antes: se completa con cargos más junior en otras
  // empresas hasta cubrir los años de experiencia que dice la persona.
  const primero = c.trayectoria[c.trayectoria.length - 1]
  const inicio = primero ? leerMes(primero.periodo.split(/\s+[–-]\s+/)[0]) : 'hoy'
  let anio = inicio === 'hoy' ? 2026 : inicio.anio
  let faltan = c.anios - (2026 - anio)
  const previos: Experiencia[] = []
  while (faltan >= 2 && previos.length < 2) {
    const dura = Math.min(faltan, 2 + Math.floor(azar() * 3))
    const mesFin = Math.floor(azar() * 12)
    const desde: Mes = { mes: Math.floor(azar() * 12), anio: anio - dura }
    const hasta: Mes = { mes: mesFin, anio: anio - (mesFin > 6 ? 1 : 0) }
    const empresa = EMPRESAS_ANTES.filter((una) => una !== c.empresa)[Math.floor(azar() * (EMPRESAS_ANTES.length - 1))]
    previos.push({
      cargo: familia.anterior[previos.length % familia.anterior.length],
      empresa,
      desde: escribirMes(desde),
      hasta: escribirMes(hasta),
      duracion: duracionEntre(desde, hasta),
      descripcion: azar() < 0.4 ? undefined : familia.descripciones[(previos.length + 1) % familia.descripciones.length],
      actual: false,
    })
    anio -= dura
    faltan -= dura
  }
  return [...conocidos, ...previos]
}

function educacionDe(c: Candidato, formacion: Estudio[], azar: () => number): Estudio[] {
  if (formacion.length) return formacion
  const familia = familiaDe(c.cargo)
  const tirada = azar()
  // Una de cada siete no registró estudios: el caso vacío también existe.
  if (tirada < 0.14) return []
  const titulo = tomar(azar, familia.titulos)
  const corto = /^(Tecnolog|Técnico)/.test(titulo)
  const fin = Math.max(2000, 2026 - c.anios - Math.floor(azar() * 2))
  const pregrado = { titulo, institucion: corto ? 'SENA' : tomar(azar, UNIVERSIDADES), periodo: `${fin - (corto ? 2 : 5)} – ${fin}` }
  if (tirada > 0.72 && !corto) {
    const especializacion = { titulo: familia.especializacion, institucion: tomar(azar, UNIVERSIDADES), periodo: `${fin + 2} – ${fin + 3}` }
    return [especializacion, pregrado]
  }
  return [pregrado]
}

/* Documentos ----------------------------------------------------------------------------------------- */

const FECHA_DOC: Record<string, number> = { ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6, jul: 7, ago: 8, sep: 9, oct: 10, nov: 11, dic: 12 }

// El expediente de Cristian guarda cada documento con un detalle en texto («2 páginas · 196 KB · subida el 9 sep»):
// de ahí salen el peso y la fecha de carga.
function documentosDe(
  c: Candidato,
  base: { nombre: string; tipo: string; detalle: string }[],
  postulacion: { fecha: string; laSubioElla: boolean; reclutador: string },
  azar: () => number,
): DocumentoCandidato[] {
  const { reclutador } = postulacion
  const leidos = base.map((doc, indice) => {
    const peso = doc.detalle.match(/(\d+(?:[.,]\d+)?\s?(?:KB|MB))/)?.[1] ?? '180 KB'
    const fecha = doc.detalle.match(/subida el (\d{1,2}) (\w{3})/)
    const alPostularse = /al postularse/.test(doc.detalle)
    return {
      id: `${c.id}-doc-${indice}`,
      nombre: doc.nombre,
      clase: doc.tipo,
      tipo: doc.nombre.split('.').pop()?.toUpperCase() ?? 'PDF',
      peso,
      fecha: fecha ? `2026-${String(FECHA_DOC[fecha[2]] ?? 9).padStart(2, '0')}-${fecha[1].padStart(2, '0')}` : postulacion.fecha,
      // Si llegó en un lote o la agregó el equipo, la hoja de vida la subió quien la trajo, no la persona.
      subidoPor: alPostularse && postulacion.laSubioElla ? c.nombre : reclutador,
    }
  })
  // Si solo tiene la hoja de vida, a algunas personas se les suma el certificado laboral que pidió el equipo.
  if (leidos.length === 1 && azar() > 0.6) {
    leidos.push({
      id: `${c.id}-doc-certificado`,
      nombre: `Certificado laboral - ${c.empresa}.pdf`,
      clase: 'Certificado laboral',
      tipo: 'PDF',
      peso: `${90 + Math.floor(azar() * 200)} KB`,
      fecha: isoHaceDias(Math.max(0, c.dias - 1)),
      subidoPor: reclutador,
    })
  }
  return leidos
}

// Lo que se lee en la vista previa de cada documento. La hoja de vida se arma con el propio perfil, así la vista
// previa y las pestañas dicen lo mismo.
export function contenidoDe(perfil: PerfilCompleto, documento: DocumentoCandidato): string[] {
  if (esHojaDeVida(documento)) {
    return [
      perfil.nombreCompleto.toUpperCase(),
      `${perfil.cargo} · ${perfil.ciudad}, ${perfil.pais}`,
      [perfil.correo, perfil.celular].filter(Boolean).join(' · '),
      '',
      'PERFIL',
      perfil.resumen,
      '',
      'EXPERIENCIA',
      ...perfil.experiencia.flatMap((paso) => [
        `${paso.cargo} — ${paso.empresa} (${paso.desde} – ${paso.hasta})`,
        ...(paso.descripcion ? [paso.descripcion] : []),
      ]),
      '',
      'EDUCACIÓN',
      ...(perfil.educacion.length
        ? perfil.educacion.map((estudio) => `${estudio.titulo} — ${estudio.institucion} (${estudio.periodo})`)
        : ['Sin estudios registrados.']),
      '',
      'HABILIDADES',
      perfil.habilidades.join(' · '),
    ]
  }
  if (/certificado laboral/i.test(documento.clase)) {
    const actual = perfil.experiencia.find((paso) => paso.actual) ?? perfil.experiencia[0]
    return [
      'CERTIFICADO LABORAL',
      '',
      `${actual?.empresa ?? perfil.empresa} certifica que ${perfil.nombreCompleto}${perfil.identificacion ? `, identificado(a) con ${perfil.identificacion},` : ''} trabaja con la compañía desde ${actual?.desde.toLowerCase() ?? 'hace varios años'} en el cargo de ${actual?.cargo ?? perfil.cargo}, con contrato a término indefinido.`,
      '',
      'Se expide a solicitud del interesado.',
      '',
      'Gerencia de Gestión Humana',
    ]
  }
  if (/diploma|acta|certificado/i.test(`${documento.clase} ${documento.nombre}`) && perfil.educacion.length) {
    const estudio = perfil.educacion[0]
    return [
      estudio.institucion.toUpperCase(),
      '',
      `Otorga a ${perfil.nombreCompleto}${perfil.identificacion ? `, ${perfil.identificacion},` : ''} el título de`,
      estudio.titulo,
      '',
      `Periodo de estudios: ${estudio.periodo}.`,
      'Registrado en el libro de grados de la institución.',
    ]
  }
  if (/recomendaci/i.test(documento.clase)) {
    const anterior = perfil.experiencia[1] ?? perfil.experiencia[0]
    return [
      'CARTA DE RECOMENDACIÓN',
      '',
      `Recomiendo a ${perfil.nombreCompleto}, con quien trabajé en ${anterior?.empresa ?? perfil.empresa} cuando era ${anterior?.cargo.toLowerCase() ?? perfil.cargo.toLowerCase()}.`,
      'Es una persona cumplida, que pregunta lo necesario y entrega lo que promete.',
      '',
      'Quedo atenta a cualquier consulta.',
    ]
  }
  return [documento.nombre.toUpperCase(), '', `${documento.clase} de ${perfil.nombreCompleto}.`, `Subido por ${documento.subidoPor}.`]
}

/* Evaluaciones y etapas ------------------------------------------------------------------------------ */

const PUNTAJE_ESTADO: Record<EstadoRequisito, number> = { Cumple: 90, Parcial: 58, 'Por validar': 35, 'No cumple': 0 }

// El match de la hoja de vida. Las personas escritas a mano lo traen; las del relleno se calculan con sus requisitos.
const matchDe = (c: Candidato) =>
  c.ajuste || (c.requisitos.length ? Math.round(c.requisitos.reduce((total, estado) => total + PUNTAJE_ESTADO[estado], 0) / c.requisitos.length) : 0)

function evaluacionSerena(c: Candidato, v: Vacante): EvaluacionEtapa | undefined {
  const cortada = c.entrevistaSinTerminar
  if (cortada) {
    // Lo que alcanzó a responder se lee igual que una entrevista completa, pero sin puntaje total (CA-37).
    const puntajes = puntajesPorPregunta(74, cortada.de)
    const preguntas = c.respuestas.slice(0, cortada.respondidas).map((respuesta, indice) => ({
      numero: indice + 1,
      pregunta: respuesta.pregunta,
      respuesta: respuesta.respuesta,
      puntaje: puntajes[indice],
      lectura: lecturaDe(puntajes[indice], indice),
    }))
    return {
      tipo: 'serena-sin-terminar',
      respondidas: cortada.respondidas,
      de: cortada.de,
      minuto: cortada.minuto,
      motivo: cortada.motivo,
      fecha: isoHaceDias(Math.max(0, c.dias - 1)),
      preguntas,
    }
  }
  const serena = serenaDe(c, v)
  if (!serena) return undefined
  return {
    tipo: 'serena',
    serena,
    preguntas: c.respuestas.map((respuesta, indice) => {
      const puntaje = serena.criterios[indice]?.puntaje ?? serena.puntaje
      return { numero: indice + 1, pregunta: respuesta.pregunta, respuesta: respuesta.respuesta, puntaje, lectura: lecturaDe(puntaje, indice) }
    }),
    // Las veces de antes, si la repitió (CA-38): con su fecha y por qué se repitió.
    intentos: c.intentosSerena?.map((intento, indice) => ({ numero: indice + 1, puntaje: intento.puntaje, fecha: isoHaceDias(intento.hace), motivo: intento.motivo })),
  }
}

// Qué se dice cuando la etapa todavía no tiene resultado.
function sinResultadoDe(etapa: EtapaVacante, estado: EstadoEtapa, nombre: string, c?: Candidato): string | undefined {
  if (estado === 'pendiente') return `${nombre} aún no llega a esta etapa.`
  if (etapa.id === 'cv' && c?.sinHojaDeVida) return `${nombre} no tiene CV: la IA no tiene qué leer contra los requisitos.`
  if (etapa.id === 'cv' && c?.hojaIlegible) return `La IA no pudo leer su CV: ${c.hojaIlegible}.`
  if (etapa.id === 'serena') return `${nombre} todavía no presenta la entrevista con Serena AI.`
  if (etapa.id === 'psicometricas' || etapa.id === 'psicometrico') return `${nombre} todavía no responde las pruebas.`
  if (etapa.id === 'roleplay') return `${nombre} todavía no hace la simulación.`
  if (etapa.id === 'cv') return 'La IA todavía está leyendo el CV contra los requisitos.'
  return undefined
}

type Fuente = {
  id: string
  vacante: string
  vacanteId?: string
  candidaturaId?: string
  etapas: EtapaVacante[]
  // Hasta dónde llegó.
  etapa: string
  estado: EstadoPostulacion
  fecha: string
  motivo?: string
  actual: boolean
  // Las candidaturas vivas traen todas sus evaluaciones; de un proceso que ya cerró solo queda la del CV.
  viva: boolean
  vacanteCalculo: Vacante
  // Cómo le fue en el CV en un proceso cerrado, para que el resultado cuadre con dónde se quedó.
  pasoCV?: boolean
  // La candidatura de la ficha y lo que se movió en la sesión: con eso se marcan las etapas saltadas o canceladas y
  // se arma el rastro de cambios.
  candidatura?: Candidatura
  movimientos?: Movimiento[]
  // Si se la rechazó antes de la sesión: su historial lo dice aunque no esté en el registro.
  rechazo?: Rechazada & { deAntes: boolean }
}

export const horaDe = (ms: number) => new Date(ms).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })

// Lo que los cambios de etapa de la sesión le hacen a cada etapa: la que se saltó no tiene resultado y lo dice; la
// entrevista que se canceló queda «Sin terminar»; donde volvió dice desde dónde y si conserva o repite la entrevista; y
// donde ya estuvo antes de volver atrás lo recuerda.
function conMovimientos(etapas: EtapaPostulacion[], movimientos: Movimiento[], nombre: string): EtapaPostulacion[] {
  return etapas.map((etapa) => {
    // Lo último que pasó con esta etapa manda: si se saltó y después se entró a ella, ya no está saltada.
    const tocan = movimientos.filter(
      (m) => m.hacia === etapa.id || m.desde === etapa.id || m.saltadas.includes(etapa.id) || m.cancelada?.etapa === etapa.id,
    )
    const ultimo = tocan[tocan.length - 1]
    if (!ultimo) return etapa
    const alas = `hoy a las ${horaDe(ultimo.cuando)}`
    // Donde se la rechazó o se retiró: el motivo ya lo dice la etapa; aquí, cuándo y si se canceló su entrevista.
    if ((ultimo.tipo === 'rechazo' || ultimo.tipo === 'retiro') && ultimo.desde === etapa.id) {
      const cancelada = ultimo.cancelada
        ? ` Su entrevista se canceló${ultimo.cancelada.respondidas !== undefined ? ` (había respondido ${ultimo.cancelada.respondidas} de ${ultimo.cancelada.total} preguntas)` : ' sin abrir'}.`
        : ''
      return {
        ...etapa,
        sinResultado: undefined,
        nota: `${ultimo.tipo === 'retiro' ? 'Se registró su retiro' : 'Se la rechazó'} ${alas}. ${ultimo.aviso ? `Se le envió «${ultimo.aviso}».` : 'No se le escribió.'}${cancelada}`,
      }
    }
    // Volvió a considerarse: dónde estaba y desde cuándo está otra vez.
    if (ultimo.tipo === 'vuelve' && ultimo.hacia === etapa.id && etapa.estado === 'actual') {
      return { ...etapa, nota: `Volvió al proceso ${alas}, después de haberse rechazado en ${tituloEtapa(ultimo.desde)}.` }
    }
    if (etapa.estado === 'actual' && ultimo.hacia === etapa.id) {
      const marcas = marcasDe(ultimo).map((marca) => marca.texto)
      const nota =
        ultimo.ia === 'reinvitada'
          ? `Repite la entrevista: ${alas} salió la invitación nueva. Mientras la presenta, abajo está la anterior; cuando la termine, cuenta la nueva y la anterior queda en «Intentos».`
          : ultimo.ia === 'conservada'
            ? `Volvió ${alas} desde ${tituloEtapa(ultimo.desde)}, con la entrevista que ya había hecho; no se le escribió.`
            : `${ultimo.tipo === 'entra' ? `Entró ${alas} directo a esta etapa` : `Llegó ${alas} desde ${tituloEtapa(ultimo.desde)}`}${marcas.length ? `. ${marcas.join('. ')}` : ''}.`
      // En un borrador la entrevista todavía no existe: la invitación sale cuando se publique la vacante (VA-45).
      if (ultimo.ia === 'en-espera') return { ...etapa, nota, sinResultado: `${nombre} recibe la invitación a ${etapa.titulo} cuando se publique la vacante.` }
      return { ...etapa, nota }
    }
    if (ultimo.cancelada?.etapa === etapa.id && etapa.estado !== 'actual') {
      const { respondidas, total } = ultimo.cancelada
      return {
        ...etapa,
        estado: etapa.estado === 'pendiente' ? 'pendiente' : 'sin-terminar',
        sinResultado: undefined,
        nota:
          respondidas !== undefined
            ? `La entrevista se canceló ${alas}, al moverla a ${tituloEtapa(ultimo.hacia)}: ${nombre} había respondido ${respondidas} de ${total} preguntas.`
            : `La invitación se canceló ${alas}, al moverla a ${tituloEtapa(ultimo.hacia)}: ${nombre} no la había abierto.`,
      }
    }
    if (ultimo.saltadas.includes(etapa.id) && etapa.estado === 'completada') {
      return {
        ...etapa,
        estado: 'saltada',
        evaluacion: undefined,
        sinResultado: undefined,
        nota: `Se saltó ${alas}: pasó de ${tituloEtapa(ultimo.desde)} a ${tituloEtapa(ultimo.hacia)} sin pasar por aquí. No tiene resultado de esta etapa.`,
      }
    }
    if (ultimo.desde === etapa.id && etapa.estado === 'pendiente') {
      return { ...etapa, nota: `Ya estuvo aquí: ${alas} volvió a ${tituloEtapa(ultimo.hacia)}. Pasa otra vez cuando avance.` }
    }
    return etapa
  })
}

// Quien entró por un lote de hojas de vida no pasó por las etapas de antes de la que se eligió al importar: quedan
// saltadas, sin resultado, y la de entrada dice cómo llegó.
function conImportacion(etapas: EtapaPostulacion[], candidatura: Candidatura, movimientos: Movimiento[]): EtapaPostulacion[] {
  const importada = candidatura.importada!
  const entrada = movimientos[0]?.desde ?? candidatura.etapa
  const hasta = etapas.findIndex((etapa) => etapa.id === entrada)
  const alas = `hoy a las ${horaDe(importada.cuando)}`
  return etapas.map((etapa, indice) => {
    if (indice < hasta && etapa.estado === 'completada')
      return {
        ...etapa,
        estado: 'saltada',
        evaluacion: undefined,
        sinResultado: undefined,
        comentarios: [],
        nota: `Entró directo a ${tituloEtapa(entrada)} con el lote «${importada.lote}»: no pasó por aquí.`,
      }
    if (indice === hasta && !etapa.nota)
      return { ...etapa, nota: `Entró ${alas} con el lote «${importada.lote}» (${importada.origen.toLowerCase()}).` }
    return etapa
  })
}

function armarPostulacion(fuente: Fuente, c: Candidato): Postulacion {
  const indice = fuente.etapas.findIndex((etapa) => etapa.id === fuente.etapa)
  const nombre = c.nombre.split(' ')[0]
  const azar = azarDe(`${c.id}|${fuente.id}`)

  const etapasBase = fuente.etapas.map((etapa, i): EtapaPostulacion => {
    const estado: EstadoEtapa =
      fuente.estado === 'Contratado'
        ? 'completada'
        : i < indice
          ? 'completada'
          : i > indice || indice < 0
            ? 'pendiente'
            : fuente.estado === 'Rechazado'
              ? 'rechazada'
              : fuente.estado === 'Retiró su postulación'
                ? 'retiro'
                : 'actual'
    const llego = estado !== 'pendiente'

    let evaluacion: EvaluacionEtapa | undefined
    if (llego && etapa.id === 'cv') {
      if (fuente.viva && c.requisitos.length && !c.sinHojaDeVida && !c.hojaIlegible) {
        evaluacion = { tipo: 'cv', cv: evaluacionCV({ ...c, ajuste: matchDe(c) }, fuente.vacanteCalculo) }
      } else if (!fuente.viva) {
        // En un proceso cerrado el CV quedó por encima o por debajo del mínimo según hasta dónde llegó la persona.
        const requisitos = fuente.vacanteCalculo.requisitos.map((_, n): EstadoRequisito => {
          const tiro = azar()
          if (fuente.pasoCV === false) return tiro > 0.7 ? 'Cumple' : tiro > 0.35 ? 'Parcial' : 'Por validar'
          return tiro > 0.25 || n === 0 ? 'Cumple' : 'Parcial'
        })
        const conRequisitos = { ...c, requisitos }
        evaluacion = { tipo: 'cv', cv: evaluacionCV({ ...conRequisitos, ajuste: matchDe({ ...conRequisitos, ajuste: 0 }) }, fuente.vacanteCalculo) }
      }
    }
    if (llego && fuente.viva && etapa.id === 'serena') evaluacion = evaluacionSerena(c, fuente.vacanteCalculo)
    // La biblioteca de etapas la llama «psicometrico»; el expediente de antes, «psicometricas» (CA-41).
    if (llego && fuente.viva && (etapa.id === 'psicometricas' || etapa.id === 'psicometrico')) {
      const psicometrica = psicometricaDe(c)
      if (psicometrica) evaluacion = { tipo: 'psicometricas', psicometrica }
    }
    if (llego && fuente.viva && etapa.id === 'roleplay') {
      const roleplay = roleplayDe(c)
      if (roleplay) evaluacion = { tipo: 'roleplay', roleplay, puntaje: puntajePonderado(roleplay.criterios) }
    }

    // Los comentarios del equipo, en la etapa donde se escribieron. Las notas sin etapa son generales: no se mudan de
    // etapa cuando la persona se mueve (CA-24); van aparte, arriba de las etapas.
    const comentarios = fuente.actual ? c.notas.filter((nota) => nota.etapa === etapa.id) : []
    // A quien pasó el filtro de CV en el relleno, a veces el equipo le dejó una línea: así las etapas no salen todas
    // vacías y se ve cómo queda una con comentarios.
    if (fuente.viva && etapa.id === 'cv' && estado === 'completada' && !comentarios.length && azar() > 0.55) {
      comentarios.push({
        id: 900 + i,
        autor: fuente.vacanteCalculo.reclutador.nombre,
        fecha: `${fechaSinAnio(isoHaceDias(c.dias + 3))}, 10:20 a. m.`,
        texto: `Pasa el filtro: ${c.cargo.toLowerCase()} en ${c.empresa}, con ${plural(c.anios, '1 año', `${c.anios} años`)} de experiencia.`,
      })
    }

    return {
      id: etapa.id,
      titulo: etapa.titulo,
      descripcion: etapa.descripcion,
      ia: Boolean(etapa.ia),
      estado,
      evaluacion,
      // Solo se explica la falta de resultado donde la persona está o aún no llega: en una etapa rechazada manda el
      // motivo, y de un proceso cerrado no se guarda más que el CV.
      sinResultado: evaluacion || (estado !== 'actual' && estado !== 'pendiente') ? undefined : sinResultadoDe(etapa, estado, nombre, c),
      salida: etapa.id === 'cv' && !evaluacion ? (c.sinHojaDeVida ? 'sin-hoja' : c.hojaIlegible ? 'ilegible' : undefined) : undefined,
      motivo: estado === 'rechazada' || estado === 'retiro' ? fuente.motivo : undefined,
      comentarios,
    }
  })
  const conCambios = fuente.movimientos?.length ? conMovimientos(etapasBase, fuente.movimientos, nombre) : etapasBase
  const etapas = fuente.candidatura?.importada ? conImportacion(conCambios, fuente.candidatura, fuente.movimientos ?? []) : conCambios

  return {
    id: fuente.id,
    vacante: fuente.vacante,
    vacanteId: fuente.vacanteId,
    candidaturaId: fuente.candidaturaId,
    fecha: fuente.fecha,
    estado: fuente.estado,
    generales: fuente.actual ? c.notas.filter((nota) => !nota.etapa) : undefined,
    cambios: fuente.candidatura ? cambiosDeEtapa(fuente.candidatura, fuente.etapas, fuente.movimientos ?? [], fuente.rechazo) : undefined,
    etapa:
      fuente.estado === 'Contratado'
        ? (fuente.etapas[fuente.etapas.length - 1]?.titulo ?? 'Seleccionado')
        : indice >= 0
          ? fuente.etapas[indice].titulo
          : tituloEtapa(fuente.etapa),
    motivo: fuente.motivo,
    actual: fuente.actual,
    etapas,
  }
}

// Cuándo aplicó: quien entró por un lote o desde la base, hoy; el resto, una semana antes de llegar a su etapa.
export const diasDesdeQueAplico = (candidatura: Candidatura) =>
  candidatura.aplico ?? (candidatura.importada || candidatura.postulada ? 0 : candidatura.dias + 6)

// Una candidatura viva (esta vacante u otra en la que también está).
function fuenteViva(candidatura: Candidatura, actual: boolean, rechazo?: Rechazada, movimientos?: Movimiento[]): Fuente {
  const retiro = rechazo && quienDe(rechazo) === 'candidato'
  // Un rechazo que no pasó en la sesión es de antes: el historial lo reconstruye.
  const deAntes = Boolean(rechazo) && !(movimientos ?? []).some((m) => m.tipo === 'rechazo' || m.tipo === 'retiro')
  return {
    id: candidatura.id,
    vacante: candidatura.vacante.titulo,
    vacanteId: candidatura.vacante.id,
    candidaturaId: candidatura.id,
    etapas: candidatura.vacante.etapas,
    etapa: candidatura.etapa,
    estado: retiro ? 'Retiró su postulación' : rechazo ? 'Rechazado' : 'En curso',
    fecha: isoHaceDias(diasDesdeQueAplico(candidatura)),
    motivo: rechazo?.motivo,
    actual,
    viva: true,
    vacanteCalculo: aVacante(candidatura.vacante),
    ...(actual ? { candidatura, movimientos, rechazo: rechazo ? { ...rechazo, quien: quienDe(rechazo), deAntes } : undefined } : {}),
  }
}

const ESTADO_HISTORIAL: Record<string, EstadoPostulacion> = {
  'En proceso': 'En curso',
  Descartado: 'Rechazado',
  Contratado: 'Contratado',
  'Retiró su postulación': 'Retiró su postulación',
}

// Las vacantes que ya cerraron: el historial de antes de alguien sale de ellas.
const CERRADAS = VACANTES_UI.filter((vacante) => vacante.estado === 'Cerrada')

// El motivo cuadra con la etapa donde se quedó: en el filtro de CV no se rechaza a nadie por la entrevista.
const MOTIVOS_POR_ETAPA: Record<string, string[]> = {
  cv: ['No cumple requisitos', 'Rechazo de CV'],
  serena: ['Bajo puntaje AI', 'Entrevista expirada'],
  revision: ['Soft skills débiles', 'No encaja con cultura'],
  antecedentes: ['Falta de documentación'],
}
const motivoPara = (etapa: string, tiro: number) => {
  const lista = MOTIVOS_POR_ETAPA[etapa] ?? ['No cumple requisitos']
  return lista[Math.floor(tiro * lista.length)]
}

// La etapa de la plantilla que corresponde a un nombre («Para revisión» → revision).
const etapaPorTitulo = (etapas: EtapaVacante[], titulo: string) => etapas.find((etapa) => etapa.titulo === titulo)?.id

// Lo de antes: las postulaciones del historial de Cristian y, si no tiene, una de cada tres personas estuvo en una
// vacante que ya cerró.
function pasadas(c: Candidato, vacanteBase: Vacante, azar: () => number): Fuente[] {
  const deCristian = postulacionesDe(c, vacanteBase, '').filter((una) => !una.actual)
  if (deCristian.length) {
    return deCristian.map((una, indice) => {
      const etapas = etapasDe('plantilla')
      const estado = ESTADO_HISTORIAL[una.estado] ?? 'Rechazado'
      const etapa = etapaPorTitulo(etapas, una.etapa) ?? etapas[0].id
      return {
        id: `${c.id}@historial-${indice}`,
        vacante: una.vacante,
        etapas,
        etapa,
        estado,
        fecha: una.fecha,
        motivo: una.motivo,
        actual: false,
        viva: false,
        // La vacante de antes era del mismo oficio: se evalúa contra los mismos requisitos, con su propio nombre.
        vacanteCalculo: { ...vacanteBase, id: `historial-${slug(una.vacante)}`, titulo: una.vacante },
        pasoCV: etapa !== 'cv' || estado !== 'Rechazado',
      }
    })
  }
  if (azar() > 0.34) return []
  const vacante = tomar(azar, CERRADAS)
  const etapas = vacante.etapas
  const hasta = Math.floor(azar() * (etapas.length - 1))
  const retiro = azar() < 0.2
  return [
    {
      id: `${c.id}@${vacante.id}`,
      vacante: vacante.titulo,
      vacanteId: vacante.id,
      etapas,
      etapa: etapas[hasta].id,
      estado: retiro ? 'Retiró su postulación' : 'Rechazado',
      fecha: isoHaceDias(vacante.diasAbierta + 20 + Math.floor(azar() * 200)),
      motivo: retiro ? 'Aceptó otra oferta' : motivoPara(etapas[hasta].id, azar()),
      actual: false,
      viva: false,
      vacanteCalculo: aVacante(vacante),
      pasoCV: hasta > 0 || retiro,
    },
  ]
}

/* El perfil ------------------------------------------------------------------------------------------ */

function armarPerfil(
  c: Candidato,
  vacante: VacanteUI,
  historial: Fuente[],
  extra: { origen: string; fechaPostulacion: string; reclutador: string; subioLaHojaDeVida: boolean },
): PerfilCompleto {
  const azar = azarDe(c.id)
  const base = perfilDe(c, aVacante(vacante))
  const [nombre, ...apellidos] = c.nombre.split(' ')

  // Las personas escritas a mano (las que se usan para enseñar la pantalla) traen su nacionalidad; en el relleno a
  // unas pocas les falta, para que «No registrado» se vea en algún lado.
  const deRelleno = /\d$/.test(c.id)
  const nacionalidad = (() => {
    const tiro = azar()
    if (tiro < 0.05 && deRelleno) return undefined
    return tiro < 0.9 ? 'Colombiana' : tiro < 0.96 ? 'Venezolana' : 'Ecuatoriana'
  })()
  const identificacion = nacionalidad && azar() > 0.2 ? identificacionDe(azar, nacionalidad) : undefined
  const nacimiento = azar() > 0.12 || !deRelleno ? nacimientoDe(azar, c.anios) : undefined
  // Solo el enlace que dejó la persona (CA-26): armarlo con su nombre abría el perfil de un desconocido. El de la maqueta
  // lleva el código que LinkedIn agrega a cada perfil, así no coincide con el de nadie.
  const codigo = Math.floor(azarDe(`${c.id}|linkedin`)() * 0xffffff).toString(16).padStart(6, '0')
  const linkedin = c.origen === 'LinkedIn' || azar() > 0.4 ? `https://www.linkedin.com/in/${slug(c.nombre)}-${codigo}` : undefined

  // Solo las que trae su perfil (CA-25): sumarle las de su oficio le ponía habilidades que nunca dijo. El tiro se
  // conserva para que el resto de los datos de ejemplo no cambie.
  azar()
  const habilidades = c.habilidades

  const reubicacion = base.reubicacion || azar() < 0.35
  const empiezaSinDecir = c.sinDeclarar?.includes('disponibilidad')
  const preaviso = azar() < 0.1 && deRelleno ? undefined : empiezaSinDecir ? undefined : c.disponibilidad === 0 ? 'No tiene' : `${c.disponibilidad} días`

  const experiencia = experienciaDe(c, base.logros, azar)
  const educacion = educacionDe(c, base.formacion, azar)
  // La edad cuadra con sus estudios (CA-25): nadie empezó la universidad a los 13.
  const nacio = nacimiento ? conEstudios(nacimiento, educacion) : undefined
  const propios = documentosDe(
    c,
    base.documentos,
    { fecha: extra.fechaPostulacion, laSubioElla: extra.subioLaHojaDeVida, reclutador: extra.reclutador },
    azar,
  )
  // La hoja de vida que llegó en un lote va primero, con quién la subió. Quien entró solo por el lote no tiene más
  // documentos que ese (lo que inventa el expediente serían archivos que nadie subió); a quien ya estaba, se le suma
  // como versión nueva y lo anterior se queda.
  const subidas: DocumentoCandidato[] = hojasSubidasDe(c.id).map((hoja, indice) => ({
    id: `${c.id}-subida-${indice}`,
    nombre: hoja.nombre,
    clase: 'CV',
    tipo: 'PDF',
    peso: pesoEnTexto(hoja.peso),
    fecha: hoja.fecha,
    subidoPor: `${hoja.subidoPor} (lote «${hoja.lote}»)`,
    archivo: hoja.archivo,
  }))
  const soloDelLote = subidas.length > 0 && c.id.startsWith('importado-')
  // Sin hoja de vida no se inventa una (CA-44).
  const documentos = (soloDelLote ? subidas : [...subidas, ...propios]).filter((documento) => !c.sinHojaDeVida || !esHojaDeVida(documento))

  return {
    id: c.id,
    nombreCompleto: c.nombre,
    nombre,
    apellido: apellidos.join(' '),
    iniciales: c.iniciales,
    cargo: c.cargo,
    empresa: c.empresa,
    correo: c.correo,
    celular: c.celular || undefined,
    linkedin,
    nacionalidad,
    identificacion,
    nacimiento: nacio?.iso,
    edad: nacio?.edad,
    ciudad: c.ciudad,
    region: REGIONES[c.ciudad] ?? c.ciudad,
    pais: base.pais,
    reubicacion,
    anios: c.anios,
    disponibilidad: empiezaSinDecir ? undefined : disponibilidadTexto(c.disponibilidad),
    preaviso,
    salario: c.sinDeclarar?.includes('pretension') ? undefined : c.pretension,
    moneda: 'COP · peso colombiano',
    origen: extra.origen,
    habilidades,
    resumen: c.resumen,
    experiencia,
    educacion,
    documentos,
    historial: historial.map((fuente) => armarPostulacion(fuente, c)),
  }
}

// El perfil desde una candidatura: la vacante de la ficha va primero, después las otras en las que está hoy, los
// rechazos en vacantes vivas y lo de antes.
export function perfilDeCandidatura(candidatura: Candidatura, movimientos: Movimiento[] = [], rechazada?: Rechazada | null): PerfilCompleto {
  const c = candidatura.candidato
  const azar = azarDe(`${c.id}|historial`)
  const otras = OTRAS_DE(candidatura.personaId, candidatura.id).map((otra) => fuenteViva(otra, false))
  const rechazos = RECHAZADAS.filter((r) => r.candidatura.personaId === candidatura.personaId && r.candidatura.id !== candidatura.id).map((r) =>
    fuenteViva(r.candidatura, false, r),
  )
  // El rechazo de esta candidatura: el que dice la pantalla (`null` si sigue en proceso, aunque se la haya vuelto a
  // considerar) o, si la pantalla no lo sabe, el sembrado.
  const propioRechazo = rechazada !== undefined ? (rechazada ?? undefined) : RECHAZADAS.find((r) => r.candidatura.id === candidatura.id)
  return armarPerfil(
    c,
    candidatura.vacante,
    [fuenteViva(candidatura, true, propioRechazo, movimientos), ...otras, ...rechazos, ...pasadas(c, aVacante(candidatura.vacante), azar)],
    candidatura.importada
      ? {
          // Entró por un lote de hojas de vida: lo dice el origen y la hoja de vida la subió quien la importó.
          origen: `Entró con el lote «${candidatura.importada.lote}» · ${candidatura.importada.origen}`,
          fechaPostulacion: isoHaceDias(0),
          reclutador: candidatura.importada.quien,
          subioLaHojaDeVida: false,
        }
      : {
          // Por qué canal vio la vacante no se sabe (8 oct, VP de producto): todos aplican por el portal de empleo.
          origen: c.origen === 'Agregado a mano' ? 'Agregado a mano por el equipo' : 'Aplicó por el portal de empleo',
          fechaPostulacion: isoHaceDias(diasDesdeQueAplico(candidatura)),
          reclutador: candidatura.vacante.reclutador.nombre,
          subioLaHojaDeVida: c.origen !== 'Agregado a mano',
        },
  )
}

// Quien está en la base y nunca tuvo candidatura en estas vacantes: se arma su persona con lo que guarda la base.
function candidatoDePersona(persona: Persona): Candidato {
  const azar = azarDe(persona.id)
  const familia = familiaDe(persona.cargo)
  // El celular es el que guarda la base, o ninguno (MC-03): antes se inventaba otro. Los tres sorteos que lo armaban se
  // hacen igual, para que lo demás de su ficha no cambie.
  azar()
  azar()
  azar()
  return {
    id: persona.id,
    nombre: persona.nombre,
    iniciales: persona.iniciales,
    correo: persona.correo,
    celular: persona.celular,
    origen: origenDeFicha(persona.origen),
    etapa: 'cv',
    dias: persona.dias,
    ajuste: 0,
    cargo: persona.cargo,
    empresa: persona.empresa,
    ciudad: persona.ciudad,
    anios: persona.anios,
    pretension: Math.round((2.5 + persona.anios * 0.55 + azar() * 2) * 10) / 10,
    disponibilidad: tomar(azar, [0, 15, 15, 30, 30, 45]),
    resumen: `${persona.cargo} en ${persona.empresa}, con ${plural(persona.anios, '1 año', `${persona.anios} años`)} de experiencia. Vive en ${persona.ciudad}.`,
    trayectoria: [{ cargo: persona.cargo, empresa: persona.empresa, periodo: `${2026 - Math.min(persona.anios, 4)} – hoy` }],
    habilidades: familia.habilidades.slice(0, 2),
    respuestas: [],
    requisitos: [],
    fortalezas: [],
    riesgos: [],
    notas: [],
  }
}

// El perfil desde «Mis candidatos». Los procesos de la persona son estado de la pantalla (postular y mover los
// cambian), así que el historial sale de ellos y no de las candidaturas guardadas.
export function perfilDePersona(persona: Persona): PerfilCompleto {
  const suya = CANDIDATURAS.find((candidatura) => candidatura.personaId === persona.id)
  const c = suya?.candidato ?? candidatoDePersona(persona)
  const vacanteBase = suya?.vacante ?? VACANTES_UI.find((vacante) => vacante.id === persona.procesos[0]?.vacanteId) ?? VACANTES_UI[0]

  const deLaBase = persona.procesos.map((proceso, indice): Fuente => {
    const viva = CANDIDATURAS.find((candidatura) => candidatura.personaId === persona.id && candidatura.vacante.id === proceso.vacanteId)
    const vacante = VACANTES_UI.find((una) => una.id === proceso.vacanteId)
    const etapas = vacante?.etapas ?? etapasDe(proceso.vacanteId)
    const estado = ESTADO_HISTORIAL[proceso.estado] ?? 'En curso'
    const tiro = azarDe(`${persona.id}|${proceso.vacanteId}|${indice}`)()
    // «Proceso terminado» no dice en qué etapa se quedó: se elige una, fija para esta persona.
    const etapa =
      etapaPorTitulo(etapas, proceso.etapa) ??
      (estado === 'Contratado' ? etapas[etapas.length - 1].id : (etapas[Math.floor(tiro * (etapas.length - 1))]?.id ?? etapas[0].id))
    const fuente: Fuente = {
      id: viva?.id ?? `${persona.id}@${proceso.vacanteId}-${indice}`,
      vacante: proceso.vacante,
      vacanteId: proceso.vacanteId,
      candidaturaId: viva && estado === 'En curso' ? viva.id : undefined,
      etapas,
      etapa,
      estado,
      fecha: viva ? isoHaceDias(viva.dias + 6) : isoHaceDias(persona.dias + 10 + indice * 30),
      motivo: estado === 'Rechazado' ? motivoPara(etapa, tiro) : undefined,
      actual: false,
      viva: Boolean(viva),
      vacanteCalculo: vacante ? aVacante(vacante) : { ...aVacante(vacanteBase), id: proceso.vacanteId, titulo: proceso.vacante },
      pasoCV: etapa !== 'cv' || estado !== 'Rechazado',
    }
    return fuente
  })

  const entrada = persona.entrada === 'Aplicó a una vacante' ? 'Aplicó por el portal de empleo' : persona.entrada
  // Solo sus procesos de verdad (MC-18): antes se le sumaban procesos cerrados inventados y una persona «Libre» salía
  // «Rechazada» en su historial.
  return armarPerfil(c, vacanteBase, deLaBase, {
    origen: `${entrada} · ${persona.dias <= 1 ? 'hoy' : `hace ${persona.dias} días`}`,
    fechaPostulacion: isoHaceDias(persona.dias),
    reclutador: vacanteBase.reclutador.nombre,
    subioLaHojaDeVida: persona.entrada === 'Aplicó a una vacante',
  })
}

/* Descargar: un PDF de verdad ----------------------------------------------------------------------- */

// Lo que se descarga desde «Documentos» se tiene que poder abrir: se escribe un PDF sencillo (Helvetica, una página
// por cada 50 líneas) con el mismo texto de la vista previa. Los títulos en mayúsculas van en negrita.

// Helvetica de los PDF usa la codificación de Windows: las tildes y la eñe ya coinciden; estos pocos signos no.
const WIN_ANSI: Record<string, number> = { '–': 0x96, '—': 0x97, '…': 0x85, '“': 0x93, '”': 0x94, '‘': 0x91, '’': 0x92, '€': 0x80, '•': 0x95 }

const aWinAnsi = (texto: string) =>
  [...texto]
    .map((letra) => (letra.charCodeAt(0) < 256 ? letra : WIN_ANSI[letra] ? String.fromCharCode(WIN_ANSI[letra]) : '?'))
    .join('')

const escaparPdf = (texto: string) => texto.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')

function envolver(linea: string, ancho: number): string[] {
  if (linea.length <= ancho) return [linea]
  const partes: string[] = []
  let actual = ''
  for (const palabra of linea.split(' ')) {
    if ((actual ? `${actual} ${palabra}` : palabra).length > ancho && actual) {
      partes.push(actual)
      actual = palabra
    } else {
      actual = actual ? `${actual} ${palabra}` : palabra
    }
  }
  if (actual) partes.push(actual)
  return partes
}

const esTitulo = (linea: string) => /[A-ZÁÉÍÓÚÑ]/.test(linea) && linea === linea.toUpperCase()

export function pdfDe(lineas: string[]): Blob {
  const envueltas = lineas.flatMap((linea) => (esTitulo(linea) ? [linea] : envolver(linea, 92)))
  const paginas: string[][] = []
  for (let i = 0; i < envueltas.length; i += 50) paginas.push(envueltas.slice(i, i + 50))
  if (!paginas.length) paginas.push([''])

  // 1: catálogo · 2: árbol de páginas · 3 y 4: fuentes · desde 5, cada página seguida de su contenido.
  const objetos = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${paginas.map((_, i) => `${5 + i * 2} 0 R`).join(' ')}] /Count ${paginas.length} >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
  ]
  paginas.forEach((pagina, i) => {
    const flujo = [
      'BT',
      '/F1 10 Tf',
      '15 TL',
      '56 800 Td',
      ...pagina.map((linea) => {
        const texto = `(${escaparPdf(aWinAnsi(linea))}) '`
        return esTitulo(linea) ? `/F2 11 Tf ${texto} /F1 10 Tf` : texto
      }),
      'ET',
    ].join('\n')
    objetos.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${6 + i * 2} 0 R >>`)
    objetos.push(`<< /Length ${flujo.length} >>\nstream\n${flujo}\nendstream`)
  })

  // Todo el texto quedó en un byte por letra: la posición de cada objeto en caracteres es su posición en bytes.
  let pdf = '%PDF-1.4\n'
  const posiciones = objetos.map((objeto, i) => {
    const posicion = pdf.length
    pdf += `${i + 1} 0 obj\n${objeto}\nendobj\n`
    return posicion
  })
  const xref = pdf.length
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n${posiciones.map((p) => `${String(p).padStart(10, '0')} 00000 n \n`).join('')}`
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return new Blob([Uint8Array.from(pdf, (letra) => letra.charCodeAt(0))], { type: 'application/pdf' })
}

/* Lo que ven la tarjeta del tablero y el rechazo ----------------------------------------------------- */

// Las mismas evaluaciones que muestra la ficha en «Etapas» (hoja de vida, entrevista con la IA, pruebas, roleplay):
// así la tarjeta y la ficha dicen las mismas cifras.
function evaluacionesDe(candidatura: Candidatura, movimientos: Movimiento[]) {
  return armarPostulacion(fuenteViva(candidatura, true, undefined, movimientos), candidatura.candidato).etapas.filter((etapa) => etapa.evaluacion)
}

export type ResumenEvaluaciones = {
  // Cuántas evaluaciones tiene ya en esta vacante.
  cuantas: number
  // El promedio de las que tienen puntaje sobre 100 (hoja de vida, entrevista, roleplay); `null` si ninguna lo tiene.
  promedio: number | null
  puntajes: { etapa: string; puntaje: number }[]
}

export function resumenDeEvaluaciones(candidatura: Candidatura, movimientos: Movimiento[] = []): ResumenEvaluaciones {
  const etapas = evaluacionesDe(candidatura, movimientos)
  const puntajes = etapas.flatMap((etapa) => {
    const evaluacion = etapa.evaluacion
    if (evaluacion?.tipo === 'cv') return [{ etapa: etapa.titulo, puntaje: evaluacion.cv.match }]
    if (evaluacion?.tipo === 'serena') return [{ etapa: etapa.titulo, puntaje: evaluacion.serena.puntaje }]
    if (evaluacion?.tipo === 'roleplay') return [{ etapa: etapa.titulo, puntaje: evaluacion.puntaje }]
    return []
  })
  const promedio = puntajes.length ? Math.round(puntajes.reduce((suma, uno) => suma + uno.puntaje, 0) / puntajes.length) : null
  return { cuantas: etapas.length, promedio, puntajes }
}

// El informe de la IA con lo que la persona tiene por mejorar para este cargo, para leerlo al rechazarla: lo que dijo
// la entrevista con la IA, los requisitos que no cumple o cumple a medias (con lo que dice su hoja de vida) y los
// riesgos que marcó al leerla. Solo lo que ya dicen los datos; si no hay nada, la lista viene vacía.
export function areasDeMejora(candidatura: Candidatura, movimientos: Movimiento[] = []): { puntos: string[]; fuentes: string[] } {
  const puntos: string[] = []
  const fuentes: string[] = []
  for (const etapa of evaluacionesDe(candidatura, movimientos)) {
    if (etapa.evaluacion?.tipo === 'serena' && etapa.evaluacion.serena.feedback.mejorar.length) {
      puntos.push(...etapa.evaluacion.serena.feedback.mejorar)
      fuentes.push(`Entrevista con ${etapa.titulo}`)
    }
  }
  const flojos = candidatura.criterios.filter((criterio) => criterio.veredicto === 'no-cumple' || criterio.veredicto === 'parcial')
  for (const criterio of flojos) {
    // Lo que dice su hoja de vida, sin la cola de dónde se leyó («· Analista en Éxito (2024 – hoy)»).
    const evidencia = criterio.evidencia.split(' · ')[0].replace(/\.$/, '')
    puntos.push(`«${criterio.requisito}»: ${evidencia.charAt(0).toLowerCase()}${evidencia.slice(1)}.`)
  }
  // Los riesgos que marcó la IA, salvo los que repiten un requisito que ya está en la lista.
  const yaDichos = flojos.map((criterio) => criterio.requisito.toLowerCase())
  puntos.push(
    ...candidatura.candidato.riesgos
      .map((riesgo) => riesgo.texto)
      .filter((texto) => !yaDichos.some((requisito) => texto.toLowerCase().includes(requisito))),
  )
  // Lo que su hoja de vida no dice (habría que validarlo) y si pide más de lo que paga la vacante.
  const sinDato = candidatura.criterios.filter((criterio) => criterio.veredicto === 'por-validar')
  for (const criterio of sinDato) puntos.push(`«${criterio.requisito}»: su CV no lo dice; habría que validarlo.`)
  const tope = candidatura.vacante.rango[1]
  if (candidatura.candidato.pretension > tope)
    puntos.push(`Pide $${candidatura.candidato.pretension.toLocaleString('es-CO')} M, por encima del tope de $${tope.toLocaleString('es-CO')} M.`)
  if (flojos.length || sinDato.length || candidatura.candidato.riesgos.length || candidatura.candidato.pretension > tope)
    fuentes.push('Lectura de su CV')
  return { puntos: [...new Set(puntos)].slice(0, 5), fuentes }
}
