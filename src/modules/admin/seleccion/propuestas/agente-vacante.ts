import { pesos } from '../vacantes/detalle/components/data'
import { SERENA_POR_DEFECTO } from '../vacantes/crear/components/vacante-data'
import {
  ESPERA_RESPUESTA,
  ajusteDe,
  cumplidosDe,
  fueEmpleado,
  siguienteEtapaDe,
  tituloEtapa,
  type Candidatura,
  type Rechazada,
  type VacanteUI,
  type Veredicto,
} from './datos'
import { diasDesdeQueAplico } from './perfil-candidato'
import { PATRON_CORREO, type CampoEditable } from './correcciones'
import type { Persona } from './personas'

// Lo que entiende y calcula el agente de la vacante («Copiloto IA › Gestionar vacante con IA», 25 sep). Hoy el
// producto ofrece dos cosas —comparar candidatos y actualizar el correo, el teléfono o la expectativa salarial de
// alguien— y para las dos pide que se le escriban los nombres a mano. Aquí el agente:
// 1. Entiende lo que se le escribe: a quién nombra (con o sin tildes, solo el nombre o nombre y apellido), qué quiere
//    hacer y, si es un cambio de datos, qué dato y cuál es el nuevo. Si falta algo o un nombre es de dos personas,
//    pregunta en vez de adivinar.
// 2. Compara de 2 a 4 personas requisito por requisito, con la experiencia, lo que piden y cómo van en el proceso, y
//    recomienda con quién seguiría y por qué, diciendo también lo que no sabe.
// 3. Responde preguntas sobre la vacante con los datos de la vacante (quién espera, quién cumple, dónde se atasca…).
// No decide: lo que cambia algo lo aplica el equipo (decisión 12). El texto sale de los datos, nunca inventado.

// `enFoco`: la persona cuya ficha está abierta (CA-50): «¿y ella cómo va?» habla de ella.
// `marcadas`: las que se marcaron en el tablero (OF-36). `filtradas`: lo que se ve con los filtros puestos y cómo se
// describen (OF-37). `pestana`: dónde está la persona (OF-38). `puede`: si puede cambiar algo o solo ver (OF-40).
// `recientes`: de quiénes se acaba de hablar, para entender «compáralas» o «la segunda» (OF-10).
export type ContextoVacante = {
  vacante: VacanteUI
  dentro: Candidatura[]
  rechazadas: Rechazada[]
  enFoco?: Candidatura
  marcadas?: Candidatura[]
  filtradas?: { ids: string[]; texto: string } | null
  pestana?: 'candidatos' | 'vacante' | 'cvs' | 'actividad'
  puede?: { cambiar: boolean; porque: string; pedirA: string; salarios: boolean }
  recientes?: string[]
}

export const MAX_COMPARAR = 4

export const normalizar = (texto: string) =>
  texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

const palabras = (texto: string) => normalizar(texto).split(/[^a-zñ0-9@.+]+/).filter(Boolean)

export const primerNombre = (c: Candidatura) => c.candidato.nombre.split(' ')[0]

// Todas las personas de la vacante, en proceso y fuera de él (a quien se rechazó también se le puede nombrar).
export const todasDe = (ctx: ContextoVacante) => [...ctx.dentro, ...ctx.rechazadas.map((r) => r.candidatura)]

export const rechazoDe = (ctx: ContextoVacante, id: string) => ctx.rechazadas.find((r) => r.candidatura.id === id) ?? null

/* A quién nombra ------------------------------------------------------------------------------------------------ */

export type Duda = { escrito: string; opciones: Candidatura[] }
export type Nombradas = { personas: Candidatura[]; dudas: Duda[]; sinEncontrar: string[] }

// Palabras que no son nombres de persona aunque vayan con mayúscula o después de «a», «y», «con» o «de»: no se
// reportan como «no encontré a…».
const NO_SON_NOMBRES = new Set(
  [
    'compara', 'comparame', 'cambia', 'actualiza', 'corrige', 'pon', 'quien', 'que', 'como', 'cual', 'cuales', 'dime',
    'muestrame', 'y', 'entre', 'serena', 'ai', 'ia', 'cv', 'hola', 'gracias', 'por', 'favor', 'el', 'la', 'los', 'las',
    'lo', 'su', 'sus', 'un', 'una', 'mi', 'correo', 'celular', 'telefono', 'numero', 'expectativa', 'salarial', 'salario',
    'sueldo', 'datos', 'dato', 'informacion', 'contacto', 'todos', 'todas', 'mejor', 'mejores', 'vacante', 'candidato',
    'candidatos', 'candidata', 'candidatas', 'persona', 'personas', 'alguien', 'nadie', 'otra', 'otro', 'otras', 'otros',
    'ellas', 'ellos', 'esta', 'este', 'estas', 'estos', 'hoy', 'nuevo', 'nueva', 'quienes', 'cumplen', 'mas', 'menos',
  ].map(normalizar),
)

// Después de estas palabras suele venir un nombre: «compara a Laura y a Pedro», «el correo de Mateo».
const ANTES_DE_UN_NOMBRE = new Set(['a', 'y', 'e', 'con', 'de', 'entre'])

export function buscarNombres(texto: string, ctx: ContextoVacante): Nombradas {
  const todas = todasDe(ctx)
  const escrito = palabras(texto)
  const hay = new Set(escrito)
  const completo = ` ${escrito.join(' ')} `
  const elegidas = new Map<string, Candidatura>()
  const dudas: Duda[] = []

  // 1. Nombre y apellido escritos: sin duda.
  for (const c of todas) if (completo.includes(` ${palabras(c.candidato.nombre).join(' ')} `)) elegidas.set(c.personaId, c)

  // 2. Solo el nombre (o solo el apellido): si es de una persona, es ella; si es de varias, se pregunta.
  const porPalabra = new Map<string, Candidatura[]>()
  for (const c of todas) {
    if (elegidas.has(c.personaId)) continue
    for (const parte of palabras(c.candidato.nombre)) {
      if (!hay.has(parte) || parte.length < 3) continue
      porPalabra.set(parte, [...(porPalabra.get(parte) ?? []), c])
    }
  }
  const usadas = new Set([...elegidas.values()].flatMap((c) => palabras(c.candidato.nombre)))
  for (const [palabra, opciones] of porPalabra) {
    if (usadas.has(palabra)) continue
    const unicas = [...new Map(opciones.map((c) => [c.personaId, c])).values()].filter((c) => !elegidas.has(c.personaId))
    // Si de las que se llaman así solo una sigue en el proceso, es ella: las que ya salieron casi nunca son a quien se
    // refiere quien escribe.
    const enProceso = unicas.filter((c) => ctx.dentro.some((otra) => otra.id === c.id))
    const una = unicas.length === 1 ? unicas[0] : enProceso.length === 1 ? enProceso[0] : null
    if (una) {
      elegidas.set(una.personaId, una)
      palabras(una.candidato.nombre).forEach((p) => usadas.add(p))
    } else if (unicas.length > 1) {
      dudas.push({ escrito: palabra, opciones: unicas })
      usadas.add(palabra)
    }
  }

  // 3. Lo que parece un nombre y no es de nadie de la vacante: con mayúscula (fuera del comienzo), o en minúscula justo
  //    después de «a», «y», «con», «de» o «entre».
  const conocidas = new Set([
    ...todas.flatMap((c) => palabras(c.candidato.nombre)),
    ...palabras(ctx.vacante.titulo),
    ...ctx.vacante.etapas.flatMap((etapa) => palabras(etapa.titulo)),
  ])
  // Cada palabra sin la puntuación de alrededor; un correo o una cifra no quedan como palabra (no son solo letras).
  const sueltas = texto.split(/\s+/).map((p) => p.replace(/^[«"'¿¡(]+|[»"'?!.,;:)]+$/g, ''))
  const pareceNombre = (p: string, i: number) =>
    p.length >= 3 &&
    /^\p{L}+$/u.test(p) &&
    ((i > 0 && /^\p{Lu}\p{Ll}+$/u.test(p)) || ANTES_DE_UN_NOMBRE.has(normalizar(sueltas[i - 1] ?? ''))) &&
    !conocidas.has(normalizar(p)) &&
    !NO_SON_NOMBRES.has(normalizar(p))
  const sinEncontrar = sueltas.filter(pareceNombre).map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())

  return { personas: [...elegidas.values()], dudas, sinEncontrar: [...new Set(sinEncontrar)] }
}

/* Qué quiere --------------------------------------------------------------------------------------------------- */

// Un grupo de personas sobre el que se pide algo a la vez (OF-03).
export type Grupo =
  | { tipo: 'no-cumplen' | 'cumplen-todo' | 'esperan' | 'piden-mas' | 'sin-entrevista' | 'marcadas' | 'filtradas' | 'recientes' }
  | { tipo: 'etapa'; etapa: string }

export type Intencion =
  | ({ tipo: 'comparar' } & Nombradas)
  | ({ tipo: 'actualizar'; campo?: CampoEditable; valor?: string } & Nombradas)
  | {
      tipo:
        | 'esperan'
        | 'cumplen'
        | 'embudo'
        | 'salario'
        | 'rechazos'
        | 'entrevistas'
        | 'propuestas'
        | 'resumen'
        | 'saludo'
        | 'gracias'
        | 'no-se'
        | 'requisitos-vacante'
        | 'descripcion'
        | 'etapas-vacante'
        | 'equipo'
        | 'enlace'
        | 'exempleados'
        | 'lotes'
        | 'desenlace'
        | 'base'
        | 'idioma'
        | 'nueva-conversacion'
        | 'anteriores'
        | 'acerca'
      texto?: string
    }
  | ({ tipo: 'persona' } & Nombradas)
  // Una orden sobre personas con nombre: rechazar, pasar de etapa, volver a considerar, abrir su ficha, escribirle o
  // anotar algo (OF-01, OF-02, OF-15, OF-16, OF-24).
  | ({ tipo: 'rechazar' | 'reconsiderar' | 'abrir' | 'redactar' } & Nombradas)
  | ({ tipo: 'mover'; destino?: string } & Nombradas)
  | ({ tipo: 'nota'; texto?: string } & Nombradas)
  // Preguntar un dato de contacto (OF-04).
  | ({ tipo: 'dato'; campo: CampoEditable } & Nombradas)
  // Un dato del perfil que el agente no cambia (OF-08).
  | ({ tipo: 'otro-dato'; campo: string } & Nombradas)
  // Lo mismo para un grupo (OF-03).
  | { tipo: 'lote'; accion: 'rechazar' | 'mover' | 'recordar'; grupo: Grupo; destino?: string }
  | { tipo: 'etapa'; etapa: string }
  | { tipo: 'actividad'; dias: number; cuando: string }
  | { tipo: 'origen'; origen?: string }
  // Agregar a alguien de la base por su nombre (OF-23).
  | { tipo: 'agregar-base'; nombre: string }
  // Algo que no se debe preguntar ni pedir (OF-51, OF-52).
  | { tipo: 'sensible'; que: string; pide: boolean }
  // Algo que el agente no hace: lo dice y dice dónde se hace (CA-30).
  | { tipo: 'no-hago'; que: string; donde: string }

// Lo que se le puede pedir y no hace, con dónde se hace. Va antes que todo lo demás: «borra los datos de Mateo» no es
// una pregunta sobre Mateo, ni «agenda una entrevista con Laura» una pregunta por las entrevistas. Escribir un correo
// ya no está aquí: lo redacta y lo deja listo para enviarlo desde la ficha (OF-15).
const NO_HAGO: { patron: RegExp; que: string; donde: string }[] = [
  {
    patron: /\b(borra|borrar|elimina|eliminar|suprime|suprimir)\b.*\b(datos?|informacion|perfil|registro|ficha)\b|habeas/,
    que: 'eliminar los datos de una persona',
    donde: 'su ficha en Mis candidatos, en «⋯» › «Eliminar sus datos». Desde su ficha aquí, el mismo «⋯» te lleva allá.',
  },
  {
    patron: /\b(agenda|agendar|programa|programar|cita|citar|coordina|coordinar)\b.*\b(entrevista|reunion|llamada|cita)\b/,
    que: 'agendar entrevistas',
    donde: 'tu calendario. La entrevista con Serena AI la agenda la persona desde su invitación; si no lo ha hecho, pídeme «recuérdales la entrevista».',
  },
  {
    patron: /\b(publica|publicar|cierra|cerrar|pausa|pausar|despublica)\b.*\bvacante\b/,
    que: 'publicar, pausar ni cerrar la vacante',
    donde: 'la insignia de estado junto al título de la vacante, arriba.',
  },
  {
    patron: /\b(contrata|contratar|haz(le)? una oferta|hacer una oferta|envia(r|le)? la oferta)\b/,
    que: 'hacer ofertas ni contratar',
    donde: 'su ficha: moverla a «Seleccionado» cierra su proceso con la oferta.',
  },
]

// Lo que no puede pesar en una contratación (OF-51). Se reconoce antes que nada: «¿qué edad tiene Mateo?» no es una
// pregunta por Mateo. «Años de experiencia» no cuenta: es un requisito.
const SENSIBLE: { patron: RegExp; que: string }[] = [
  { patron: /\b(que edad|cuantos anos tiene|cuantos anos tienen|edad de|anos de edad|mayores de|menores de|muy viej|muy joven|jovenes|viejos)\b/, que: 'la edad' },
  { patron: /\b(hijos?|hijas?|embaraz|tiene familia|maternidad|paternidad)\b/, que: 'los hijos o un embarazo' },
  { patron: /\b(casad[oa]s?|solter[oa]s?|estado civil|divorciad[oa]s?|novi[oa]|pareja)\b/, que: 'el estado civil' },
  { patron: /\b(religion|religios[oa]s?|catolic[oa]s?|cristian[oa]s?|evangelic[oa]s?|judi[oa]s?|musulman)/, que: 'la religión' },
  { patron: /\b(enferm|discapacidad|salud mental|embarazada|incapacidad medica|diagnostico)/, que: 'la salud' },
  { patron: /\b(gay|lesbiana|orientacion sexual|trans\b|homosexual)/, que: 'la orientación sexual o la identidad de género' },
  { patron: /\b(raza|etnia|negr[oa]s|indigena|afro|color de piel)/, que: 'el origen étnico' },
  { patron: /\b(mujeres|hombres|genero|sexo)\b/, que: 'el género' },
  { patron: /\b(extranjer[oa]s?|venezolan[oa]s?|nacionalidad|de que pais)/, que: 'la nacionalidad' },
  { patron: /\b(politic[oa]s?|partido|vot[oa])\b/, que: 'la opinión política' },
]

const tiene = (texto: string, patron: RegExp) => patron.test(normalizar(texto))

export function campoDe(texto: string): CampoEditable | undefined {
  if (tiene(texto, /correo|e-?mail|\bmail\b/)) return 'correo'
  if (tiene(texto, /celular|telefono|\btel\b|numero|whats|movil/)) return 'celular'
  if (tiene(texto, /salari|expectativa|pretension|aspiracion|sueldo|\bpide\b/)) return 'pretension'
  return undefined
}

// Datos del perfil que el agente no cambia: se cambian en la pestaña «Datos» de la ficha (OF-08, OF-21).
const OTROS_DATOS: [RegExp, string][] = [
  [/\bciudad\b/, 'la ciudad'],
  [/\bnombre\b/, 'el nombre'],
  [/\blinkedin\b/, 'el LinkedIn'],
  [/disponibilidad|cuando puede empezar|fecha de ingreso/, 'cuándo puede empezar'],
  [/anos de experiencia|experiencia/, 'los años de experiencia'],
  [/\bcargo\b/, 'el cargo'],
  [/\bempresa\b/, 'la empresa'],
]

// Ciudades que se escriben como dato, no como persona («cambia la ciudad de Laura a Medellín»).
const CIUDADES = ['bogota', 'medellin', 'cali', 'barranquilla', 'cartagena', 'bucaramanga', 'pereira', 'manizales', 'cucuta', 'santa', 'marta', 'ibague', 'funza', 'cota', 'chia', 'remoto']

// El dato nuevo, si viene escrito: el correo donde esté; el celular o la cifra, lo que va después de «a», «por» o «:».
function valorEscrito(texto: string, campo: CampoEditable | undefined): string | undefined {
  if (campo === 'correo') return texto.match(PATRON_CORREO)?.[0]
  const despues = texto.match(/(?:\sa|\spor|:|\ses)\s+([$+\d][\d\s.,$+]*(?:\s?(?:m|millones?|mil))?)\s*[.!?»"]*\s*$/i)?.[1]
  return despues?.trim()
}

// La etapa que se nombra («a Antecedentes», «en Serena AI»), o la siguiente si se dice «siguiente».
function etapaNombrada(texto: string, ctx: ContextoVacante) {
  const escrito = ` ${palabras(texto).join(' ')} `
  // La más larga primero: «Entrevista con Serena AI» antes que «Serena AI».
  const etapas = [...ctx.vacante.etapas].sort((a, b) => b.titulo.length - a.titulo.length)
  for (const etapa of etapas) {
    const nombre = palabras(etapa.titulo)
    if (escrito.includes(` ${nombre.join(' ')} `)) return etapa.id
    // Con la primera palabra que distingue («antecedentes», «revisión», «seleccionado»).
    const propia = nombre.find((palabra) => palabra.length >= 6 && !['entrevista', 'evaluacion', 'prueba', 'pruebas'].includes(palabra))
    if (propia && escrito.includes(` ${propia} `)) return etapa.id
  }
  return undefined
}

// Pedir lo mismo para un grupo: «todos los que no cumplen», «las que marqué», «las que estoy viendo» (OF-03, OF-36, OF-37).
function grupoDe(texto: string, ctx: ContextoVacante): Grupo | null {
  if (tiene(texto, /(marcad|que marque|seleccionad|que elegi)/)) return { tipo: 'marcadas' }
  if (tiene(texto, /(las que veo|los que veo|lo que estoy viendo|con mis filtros|filtrad)/)) return { tipo: 'filtradas' }
  if (!tiene(texto, /\b(todos|todas|los que|las que|quienes|a los|a las)\b/)) return null
  if (tiene(texto, /(no cumplen|no cumple|ningun requisito|nada de lo que pide)/)) return { tipo: 'no-cumplen' }
  if (tiene(texto, /(cumplen todo|cumplen todos|todo lo que pide|todos los requisitos)/)) return { tipo: 'cumplen-todo' }
  if (tiene(texto, /(esperan|estan esperando|sin respuesta)/)) return { tipo: 'esperan' }
  if (tiene(texto, /(piden mas|por encima del tope|mas del tope|muy caros)/)) return { tipo: 'piden-mas' }
  if (tiene(texto, /(no (la )?han hecho|no han presentado|sin entrevista|no han agendado|no la presentaron)/)) return { tipo: 'sin-entrevista' }
  const etapa = etapaNombrada(texto, ctx)
  if (etapa && tiene(texto, /\b(en|de)\b/)) return { tipo: 'etapa', etapa }
  return null
}

// Quiénes quedan en un grupo, en el proceso de ahora.
export function personasDelGrupo(grupo: Grupo, ctx: ContextoVacante): Candidatura[] {
  const { dentro } = ctx
  switch (grupo.tipo) {
    // No cumple ninguno según su hoja de vida. Quien solo tiene requisitos «por validar» no entra: es falta de datos (CA-11).
    case 'no-cumplen':
      return dentro.filter((c) => c.criterios.length && cumplidosDe(c.criterios) === 0 && c.criterios.some((criterio) => criterio.veredicto !== 'por-validar'))
    case 'cumplen-todo':
      return dentro.filter((c) => c.criterios.length && cumplidosDe(c.criterios) === c.criterios.length)
    case 'esperan':
      return dentro.filter(ESPERA_RESPUESTA)
    case 'piden-mas':
      return dentro.filter((c) => !c.candidato.sinDeclarar?.includes('pretension') && c.candidato.pretension > ctx.vacante.rango[1])
    case 'sin-entrevista': {
      const etapaIA = ctx.vacante.etapas.find((etapa) => etapa.ia)
      return etapaIA ? dentro.filter((c) => c.etapa === etapaIA.id && c.candidato.serena === undefined) : []
    }
    case 'marcadas':
      return (ctx.marcadas ?? []).filter((c) => dentro.some((otra) => otra.id === c.id))
    case 'filtradas':
      return ctx.filtradas ? dentro.filter((c) => ctx.filtradas?.ids.includes(c.id)) : dentro
    case 'recientes':
      return (ctx.recientes ?? []).map((id) => dentro.find((c) => c.id === id)).filter((c) => c !== undefined)
    case 'etapa':
      return dentro.filter((c) => c.etapa === grupo.etapa)
  }
}

export function nombreDelGrupo(grupo: Grupo, ctx: ContextoVacante) {
  switch (grupo.tipo) {
    case 'no-cumplen':
      return 'quienes no cumplen ningún requisito'
    case 'cumplen-todo':
      return 'quienes cumplen todos los requisitos'
    case 'esperan':
      return 'quienes esperan una respuesta tuya'
    case 'piden-mas':
      return 'quienes piden más del tope'
    case 'sin-entrevista':
      return 'quienes no han hecho la entrevista con Serena AI'
    case 'marcadas':
      return 'las que marcaste en el tablero'
    case 'filtradas':
      return ctx.filtradas ? `las que ves con tus filtros (${ctx.filtradas.texto})` : 'todas las del tablero'
    case 'recientes':
      return 'las que acabo de nombrar'
    case 'etapa':
      return `quienes están en ${tituloEtapa(grupo.etapa)}`
  }
}

// «compáralas», «la segunda», «ábrela»: de quiénes se acaba de hablar (OF-10). Sin nombres en el pedido.
function referidas(texto: string, ctx: ContextoVacante): Candidatura[] {
  const recientes = (ctx.recientes ?? []).map((id) => todasDe(ctx).find((c) => c.id === id)).filter((c) => c !== undefined)
  const ordinal = [/\b(la|el) primer[oa]?\b/, /\b(la|el) segund[oa]\b/, /\b(la|el) tercer[oa]?\b/, /\b(la|el) cuart[oa]\b/].findIndex((patron) => tiene(texto, patron))
  if (ordinal >= 0 && recientes[ordinal]) return [recientes[ordinal]]
  if (tiene(texto, /\b(la|el) ultim[oa]\b/) && recientes.length) return [recientes[recientes.length - 1]]
  // Solo pronombres y verbos con el pronombre pegado («compáralas», «pásala»): «hola» o «tabla» no hablan de nadie.
  if (tiene(texto, /\b(ellas|ellos|esas|esos|todas ellas)\b|\b(compar|pas|muev|rechaz|abr|avanz|llev|descart|agreg|sac|recuerd)\w*(las|los)\b/) && recientes.length > 1)
    return recientes
  if (tiene(texto, /\b(ella|esa persona|esta persona|esta candidata|este candidato|la de la ficha)\b|\b(compar|pas|muev|rechaz|abr|avanz|llev|descart|agreg|sac|recuerd)\w*(la|lo)\b/)) {
    if (ctx.enFoco) return [ctx.enFoco]
    if (recientes.length === 1) return recientes
  }
  return []
}

// Lo que parece inglés (OF-17): palabras que en español no se usan.
const INGLES = /\b(the|who|what|which|is|are|best|candidate|candidates|compare|show|please|how|many|waiting|hire|job)\b/

const VERBO = {
  rechazar: /\b(rechaza|rechazar|rechazala|rechazalo|rechazalas|rechazalos|descarta|descartar|descartala|descartalo|saca|sacala|sacalo)\b/,
  mover: /\b(pasa|pasar|pasala|pasalo|pasalas|pasalos|mueve|mover|muevela|muevelo|muevelas|avanza|avanzar|avanzala|avanzalo|avanzalas|lleva|llevala|llevalo)\b/,
  recordar: /\b(recuerda|recuerdale|recuerdales|recordar|recordarles)\b/,
  reconsiderar: /(volver a considerar|vuelve a considerar|reconsidera|reconsiderar|trae de vuelta|traer de vuelta|recupera(la|lo)?\b)/,
  abrir: /\b(abre|abrir|abrela|abrelo|muestrame la ficha|ver la ficha|ver su ficha)\b/,
  redactar: /\b(escribe|escribir|escribele|escribeles|redacta|redactar|prepara|envia|enviale|enviales|manda|mandale|mandales)\b.*\b(correo|mensaje|mail|whatsapp|carta)\b/,
  nota: /\b(anota|anotar|deja una nota|dejale una nota|agrega una nota|deja un comentario|agrega un comentario|comenta en)\b/,
  agregar: /\b(agrega|agregar|agregala|agregalo|suma|sumar|trae|traer|invita|invitar|anade|anadir)\b/,
  cambiar: /\b(cambia|cambiar|actualiza|actualizar|corrige|corregir|modifica|modificar|pon|poner|edita|editar|reemplaza)\b/,
}

export function entender(texto: string, ctx: ContextoVacante): Intencion {
  // Primero lo que no se responde ni se hace, aunque nombre a alguien (OF-51, OF-52).
  const sensible = SENSIBLE.find((uno) => tiene(texto, uno.patron))
  if (sensible) return { tipo: 'sensible', que: sensible.que, pide: tiene(texto, VERBO.rechazar) || tiene(texto, VERBO.mover) || tiene(texto, /\b(prefiero|solo|no quiero|filtra|quita)\b/) }
  if (tiene(texto, /(nueva conversacion|empezar de cero|empieza de cero|borra (la|esta) conversacion|limpia (la|el) (conversacion|chat)|otra conversacion)/))
    return { tipo: 'nueva-conversacion' }
  if (tiene(texto, /(conversaciones anteriores|lo que hablamos|historial de (la )?conversacion|conversacion de antes)/)) return { tipo: 'anteriores' }
  if (tiene(texto, /(que datos (usas|ves|lees)|quien ve (esta|la) conversacion|cuanto (tiempo )?se guarda|gastas creditos|gasta creditos|cuesta preguntarte|acerca de orbit|que eres|que sabes hacer|que puedes hacer|en que me (ayudas|puedes ayudar))/))
    return { tipo: 'acerca' }
  const noHago = NO_HAGO.find((uno) => tiene(texto, uno.patron))
  if (noHago) return { tipo: 'no-hago', que: noHago.que, donde: noHago.donde }
  if (tiene(texto, INGLES) && !tiene(texto, /\b(que|quien|como|cual|cuanto|los|las|del|para)\b/)) return { tipo: 'idioma', texto }

  const encontradas = buscarNombres(texto, ctx)
  // Una ciudad escrita como dato no es una persona que falta (OF-08).
  encontradas.sinEncontrar = encontradas.sinEncontrar.filter((nombre) => !CIUDADES.includes(normalizar(nombre)))
  // Sin nombre: «compáralas», «la segunda», «ella» (con la ficha abierta) hablan de quien se acaba de nombrar.
  const deAntes = !encontradas.personas.length && !encontradas.dudas.length ? referidas(texto, ctx) : []
  const nombradas: Nombradas = deAntes.length ? { ...encontradas, personas: deAntes } : encontradas
  const conNombre = nombradas.personas.length > 0 || nombradas.dudas.length > 0
  const campo = campoDe(texto)
  const grupo = grupoDe(texto, ctx)

  // Órdenes: rechazar, pasar de etapa, recordar, volver a considerar, abrir, escribir, anotar, agregar.
  if (tiene(texto, VERBO.reconsiderar) && conNombre) return { tipo: 'reconsiderar', ...nombradas }
  if (tiene(texto, VERBO.rechazar) && !tiene(texto, /\b(por que|motivo|cuantos|cuantas|quien(es)? (se )?rechaz)/)) {
    if (grupo && !conNombre) return { tipo: 'lote', accion: 'rechazar', grupo }
    if (conNombre || nombradas.sinEncontrar.length) return { tipo: 'rechazar', ...nombradas }
  }
  if (tiene(texto, VERBO.mover) && !tiene(texto, /\b(que pasa|que paso|que le pasa|como paso)\b/)) {
    const destino = etapaNombrada(texto, ctx)
    if (grupo && !conNombre) return { tipo: 'lote', accion: 'mover', grupo, destino }
    if (conNombre || nombradas.sinEncontrar.length) return { tipo: 'mover', destino, ...nombradas }
  }
  if (tiene(texto, VERBO.recordar) && tiene(texto, /(entrevista|serena|invitacion)/)) {
    if (conNombre) return { tipo: 'lote', accion: 'recordar', grupo: { tipo: 'recientes' } }
    return { tipo: 'lote', accion: 'recordar', grupo: grupo ?? { tipo: 'sin-entrevista' } }
  }
  if (tiene(texto, VERBO.abrir) && conNombre) return { tipo: 'abrir', ...nombradas }
  if (tiene(texto, VERBO.redactar)) return { tipo: 'redactar', ...nombradas }
  if (tiene(texto, VERBO.nota)) {
    const dicho = texto.match(/(?:[:«"]|\bque\b)\s*(.+?)[»"]?\s*$/)?.[1]
    return { tipo: 'nota', texto: dicho && !buscarNombres(dicho, ctx).personas.length ? dicho : undefined, ...nombradas }
  }
  if (tiene(texto, VERBO.agregar) && !tiene(texto, /\b(dato|nota|comentario)\b/)) {
    if (tiene(texto, /(mi base|mis candidatos|de la base|desde la base)/) && !conNombre) {
      const nombre = texto.match(/\b(?:a|trae a|agrega a|suma a)\s+([A-ZÁÉÍÓÚÑ][\wáéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][\wáéíóúñ]+)?)/)?.[1]
      return nombre ? { tipo: 'agregar-base', nombre } : { tipo: 'base' }
    }
    if (!conNombre && nombradas.sinEncontrar.length) return { tipo: 'agregar-base', nombre: nombradas.sinEncontrar.join(' ') }
  }

  // Cambiar un dato: los tres que el agente cambia, o decir dónde se cambia el resto (OF-08).
  const otro = OTROS_DATOS.find(([patron]) => tiene(texto, patron))
  if (tiene(texto, VERBO.cambiar) && !campo && otro) return { tipo: 'otro-dato', campo: otro[1], ...nombradas }
  if (tiene(texto, VERBO.cambiar) && (campo || conNombre || tiene(texto, /dato|informacion|contacto/)))
    return { tipo: 'actualizar', campo, valor: valorEscrito(texto, campo), ...nombradas }
  // Preguntar un dato de contacto (OF-04).
  if (conNombre && (campo === 'correo' || campo === 'celular' || tiene(texto, /contacto|como (la|lo) contacto/)))
    return { tipo: 'dato', campo: campo ?? 'correo', ...nombradas }

  if (tiene(texto, /compar|versus|\bvs\b|quien (es|esta) mejor|mejor entre|diferencia entre|lado a lado/)) {
    if (!conNombre && grupo) return { tipo: 'comparar', ...nombradas, personas: personasDelGrupo(grupo, ctx) }
    return { tipo: 'comparar', ...nombradas }
  }
  if (tiene(texto, /propon|que hago|que harias|siguiente paso|que sigue|recomienda|por donde empiezo/)) return { tipo: 'propuestas' }
  // «¿Cómo va Valentina?»: con un nombre, la pregunta es por esa persona y no por la vacante.
  if (conNombre && tiene(texto, /como (va|esta|le fue|vamos con)|que tal (va|esta)|cuentame|hablame|info(rmacion)? de|que sabes de|quien es/))
    return { tipo: 'persona', ...nombradas }

  // Preguntas sobre la vacante misma (OF-05, OF-06, OF-38, OF-41).
  if (tiene(texto, /(a quien contrat|como termin|quien quedo|se contrato|desenlace|por que se cerro)/)) return { tipo: 'desenlace' }
  if (tiene(texto, /(cuales son los requisitos|que requisitos|requisitos de la vacante|que pide la vacante|que se pide|que piden para)/)) return { tipo: 'requisitos-vacante' }
  if (tiene(texto, /(descripcion|que le falta a la vacante|que le falta para publicar|lista para publicar|que le falta a la descripcion)/)) return { tipo: 'descripcion' }
  if (tiene(texto, /(que etapas|cuales son las etapas|como es el proceso|pasos del proceso)/)) return { tipo: 'etapas-vacante' }
  if (tiene(texto, /(quien(es)? (esta|estan|trabaja|trabajan) en (el|la) (equipo|vacante)|equipo de la vacante|quien lleva la vacante|quien mas trabaja)/))
    return { tipo: 'equipo' }
  if (tiene(texto, /\b(enlace|link|url|direccion de la vacante)\b/)) return { tipo: 'enlace' }
  if (tiene(texto, /(cuanto paga|cuanto ofrece|rango|salario de la vacante|sueldo de la vacante|cuanto se paga|que salario)/)) return { tipo: 'salario' }

  // Preguntas por una etapa, por fechas, por origen o por lotes (OF-11 a OF-14).
  const etapa = etapaNombrada(texto, ctx)
  if (etapa && tiene(texto, /\b(quien|quienes|cuantos|cuantas|que personas|hay)\b/) && !tiene(texto, /(como van las entrevistas|puntaje)/)) return { tipo: 'etapa', etapa }
  if (tiene(texto, /(importa|lote|carga|subi|hojas de vida que|cvs que)/)) return { tipo: 'lotes' }
  const dias = tiene(texto, /\bhoy\b/) ? 0 : tiene(texto, /\bayer\b/) ? 1 : tiene(texto, /(esta semana|ultima semana|los ultimos 7)/) ? 7 : tiene(texto, /(este mes|ultimo mes|ultimos 30)/) ? 30 : Number(normalizar(texto).match(/ultimos (\d+) dias/)?.[1] ?? -1)
  if (dias >= 0 && tiene(texto, /(entr|lleg|aplic|movi|paso|pasaron|sali|rechaz|nuev|que paso|novedad)/))
    return { tipo: 'actividad', dias, cuando: dias === 0 ? 'hoy' : dias === 1 ? 'desde ayer' : dias === 7 ? 'esta semana' : `en los últimos ${dias} días` }
  if (tiene(texto, /(ex ?emplead|trabajo aqui|trabajaron aqui|ya trabajo con nosotros|ya trabajaron)/)) return { tipo: 'exempleados' }
  const origen = ['linkedin', 'computrabajo', 'referido', 'feria', 'magneto'].find((uno) => tiene(texto, new RegExp(uno)))
  if (origen || tiene(texto, /(origen|de donde (vienen|llegan|llego|vino)|por donde llegaron|fuente)/)) return { tipo: 'origen', origen }
  if (tiene(texto, /(mi base|mis candidatos|otras personas|alguien mas|quien mas (encaja|sirve)|de la base|en la base)/)) return { tipo: 'base' }

  if (tiene(texto, /espera|pendiente|sin respuesta|responder|contestar/)) return { tipo: 'esperan' }
  // «¿Por qué salió la gente?» pregunta por los motivos, no por quién salió en unos días (eso es `actividad`, con fecha).
  if (tiene(texto, /rechaz|descart|motivo|por ?que (se )?(salio|salieron|fue|fueron)/)) return { tipo: 'rechazos' }
  if (tiene(texto, /entrevista|serena|puntaje/)) return { tipo: 'entrevistas' }
  if ((!tiene(texto, VERBO.cambiar) && campo === 'pretension') || tiene(texto, /\btope\b|rango salarial|caro|mas de lo que/)) return { tipo: 'salario' }
  if (tiene(texto, /cumple|requisito|mejor(es)? perfil|encaja|sirve|los mejores|quien va mejor/)) return { tipo: 'cumplen' }
  if (tiene(texto, /atasc|cuello|embudo|etapa|cuantos hay|cuantas hay|se acumula|donde (esta|hay)/)) return { tipo: 'embudo' }
  if (tiene(texto, /resum|como va|como vamos|panorama|estado de la vacante|en que va/)) return { tipo: 'resumen' }
  if (conNombre) return { tipo: 'persona', ...nombradas }
  if (tiene(texto, /^(hola|buen[oa]s|hey)\b/) || (tiene(texto, /^que tal\b/) && palabras(texto).length <= 3)) return { tipo: 'saludo' }
  if (tiene(texto, /gracias|perfecto|listo|genial|chevere/)) return { tipo: 'gracias' }
  return { tipo: 'no-se', texto }
}

// Dos pedidos en un mensaje (OF-09): «compara a Laura y Andrés y dime quién espera». Se parte donde empieza otro pedido.
export function partirPedido(texto: string): string[] {
  const partes = texto
    .split(/\s*(?:[;?]\s+|\s(?:y|e|luego|despues|tambien)\s+(?=(?:dime|muestrame|cuentame|dame|compara|cambia|actualiza|rechaza|pasa|mueve|recuerdales|quien|quienes|cuantos|cuantas|que|como)\b))/i)
    .map((parte) => parte.trim())
    .filter((parte) => parte.length > 2)
  return partes.length > 1 ? partes : [texto]
}

/* Nombres parecidos (OF-07) ------------------------------------------------------------------------------------ */

function distancia(a: string, b: string) {
  const fila = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let antes = fila[0]
    fila[0] = i
    for (let j = 1; j <= b.length; j++) {
      const guardado = fila[j]
      fila[j] = Math.min(fila[j] + 1, fila[j - 1] + 1, antes + (a[i - 1] === b[j - 1] ? 0 : 1))
      antes = guardado
    }
  }
  return fila[b.length]
}

// La persona de la vacante cuyo nombre o apellido se parece a lo escrito (una o dos letras de diferencia).
export function parecidaA(escrito: string, ctx: ContextoVacante): Candidatura | null {
  const buscado = normalizar(escrito)
  let mejor: { c: Candidatura; d: number } | null = null
  for (const c of todasDe(ctx)) {
    for (const parte of palabras(c.candidato.nombre)) {
      if (parte.length < 3) continue
      const d = distancia(buscado, parte)
      if (d <= (buscado.length > 5 ? 2 : 1) && (!mejor || d < mejor.d)) mejor = { c, d }
    }
  }
  return mejor?.c ?? null
}

/* Comparar ----------------------------------------------------------------------------------------------------- */

export type Enfoque = 'requisitos' | 'experiencia' | 'salario' | 'proceso'

export const ENFOQUES: { id: Enfoque; nombre: string }[] = [
  { id: 'requisitos', nombre: 'Requisitos' },
  { id: 'experiencia', nombre: 'Experiencia' },
  { id: 'salario', nombre: 'Salario' },
  { id: 'proceso', nombre: 'Proceso' },
]

export type Tono = 'bien' | 'medio' | 'mal' | 'neutro'
export type Celda = { texto: string; detalle?: string; tono?: Tono; mejor?: boolean }
export type FilaComparacion = { id: string; enfoque: Enfoque; nombre: string; celdas: Celda[] }

export const VEREDICTO_TEXTO: Record<Veredicto, { texto: string; tono: Tono }> = {
  cumple: { texto: 'Cumple', tono: 'bien' },
  parcial: { texto: 'A medias', tono: 'medio' },
  'no-cumple': { texto: 'No cumple', tono: 'mal' },
  'por-validar': { texto: 'Por validar', tono: 'neutro' },
}

// «Mejor» solo cuando alguien se distingue: si todas empatan, nadie lo lleva.
function marcarMejor(celdas: Celda[], valores: (number | null)[], mayorEsMejor = true): Celda[] {
  const validos = valores.filter((v): v is number => v !== null)
  if (validos.length < 2) return celdas
  const mejor = mayorEsMejor ? Math.max(...validos) : Math.min(...validos)
  if (validos.every((v) => v === mejor)) return celdas
  return celdas.map((celda, i) => (valores[i] === mejor ? { ...celda, mejor: true } : celda))
}

const indiceEtapa = (vacante: VacanteUI, c: Candidatura) => vacante.etapas.findIndex((etapa) => etapa.id === c.etapa)

export function filasDeComparacion(personas: Candidatura[], ctx: ContextoVacante, enfoques: Enfoque[]): FilaComparacion[] {
  const { vacante } = ctx
  const filas: FilaComparacion[] = []
  const tope = vacante.rango[1]

  if (enfoques.includes('requisitos')) {
    const cumple = personas.map((c) => cumplidosDe(c.criterios))
    filas.push({
      id: 'cumple',
      enfoque: 'requisitos',
      nombre: 'Requisitos que cumple',
      celdas: marcarMejor(
        personas.map((c, i) => ({ texto: `${cumple[i]} de ${c.criterios.length}` })),
        cumple,
      ),
    })
    const requisitos = [...new Set(personas.flatMap((c) => c.criterios.map((criterio) => criterio.requisito)))]
    for (const requisito of requisitos)
      filas.push({
        id: `req:${requisito}`,
        enfoque: 'requisitos',
        nombre: requisito,
        celdas: personas.map((c) => {
          const criterio = c.criterios.find((uno) => uno.requisito === requisito)
          return criterio ? { ...VEREDICTO_TEXTO[criterio.veredicto], detalle: criterio.evidencia } : { texto: 'Sin dato', tono: 'neutro' as const }
        }),
      })
  }
  if (enfoques.includes('experiencia')) {
    const anios = personas.map((c) => c.candidato.anios)
    filas.push({
      id: 'anios',
      enfoque: 'experiencia',
      nombre: 'Experiencia',
      celdas: marcarMejor(
        personas.map((c) => ({ texto: `${c.candidato.anios} ${c.candidato.anios === 1 ? 'año' : 'años'}`, detalle: `${c.candidato.cargo} en ${c.candidato.empresa}` })),
        anios,
      ),
    })
  }
  if (enfoques.includes('salario')) {
    // Pedir menos no es «mejor» (CA-31): la fila dice dónde queda cada una frente al rango, con las palabras de la ficha.
    filas.push({
      id: 'pide',
      enfoque: 'salario',
      nombre: 'Lo que pide',
      celdas: personas.map((c) =>
        c.candidato.sinDeclarar?.includes('pretension')
          ? { texto: 'No lo ha dicho' }
          : {
              texto: pesos(c.candidato.pretension),
              detalle:
                c.candidato.pretension > tope
                  ? `Por encima del tope (${pesos(tope)})`
                  : c.candidato.pretension < ctx.vacante.rango[0]
                    ? 'Por debajo del rango'
                    : 'Dentro del rango',
              tono: c.candidato.pretension > tope ? ('medio' as const) : undefined,
            },
      ),
    })
    const empieza = personas.map((c) => (c.candidato.sinDeclarar?.includes('disponibilidad') ? null : c.candidato.disponibilidad))
    filas.push({
      id: 'empieza',
      enfoque: 'salario',
      nombre: 'Puede empezar',
      celdas: marcarMejor(
        personas.map((c) => ({
          texto: c.candidato.sinDeclarar?.includes('disponibilidad')
            ? 'No lo ha dicho'
            : c.candidato.disponibilidad === 0
              ? 'De inmediato'
              : `En ${c.candidato.disponibilidad} días`,
        })),
        empieza,
        false,
      ),
    })
  }
  if (enfoques.includes('proceso')) {
    const avance = personas.map((c) => (rechazoDe(ctx, c.id) ? null : indiceEtapa(vacante, c)))
    filas.push({
      id: 'etapa',
      enfoque: 'proceso',
      nombre: 'Dónde va',
      celdas: marcarMejor(
        personas.map((c) => {
          const rechazo = rechazoDe(ctx, c.id)
          return rechazo
            ? { texto: 'Fuera del proceso', detalle: rechazo.motivo, tono: 'mal' as const }
            : { texto: tituloEtapa(c.etapa), detalle: c.dias ? `Hace ${c.dias} ${c.dias === 1 ? 'día' : 'días'}` : 'Llegó hoy' }
        }),
        avance,
      ),
    })
    const serena = personas.map((c) => c.candidato.serena ?? null)
    filas.push({
      id: 'serena',
      enfoque: 'proceso',
      nombre: 'Entrevista con Serena AI',
      celdas: marcarMejor(
        personas.map((c) =>
          c.candidato.serena === undefined
            ? { texto: 'Aún no la hace', tono: 'neutro' as const }
            : { texto: `${c.candidato.serena}/100`, tono: c.candidato.serena < 70 ? ('mal' as const) : undefined },
        ),
        serena,
      ),
    })
  }
  return filas
}

// Cómo se ordena para recomendar (OF-31): por defecto pesan más los requisitos, después la entrevista, el salario y el
// avance. Se puede pedir sin contar el salario o por experiencia.
export type Criterio = 'equilibrado' | 'sin-salario' | 'experiencia'

export const CRITERIOS: { id: Criterio; nombre: string }[] = [
  { id: 'equilibrado', nombre: 'Requisitos primero' },
  { id: 'sin-salario', nombre: 'Sin contar el salario' },
  { id: 'experiencia', nombre: 'Por experiencia' },
]

// Lo que suma cada cosa, para decirlo en «Cómo lo decidí». Un puntaje para ordenar, no para mostrar como nota.
export type Desglose = { requisitos: number; entrevista: number; salario: number; avance: number; experiencia: number; fuera: number; total: number }

export function desgloseDe(c: Candidatura, ctx: ContextoVacante, criterio: Criterio = 'equilibrado'): Desglose {
  const tope = ctx.vacante.rango[1]
  const total = c.criterios.length || 1
  const requisitos = Math.round((cumplidosDe(c.criterios) / total) * 50)
  // Pedir menos no suma: solo resta pedir más que el tope (CA-31). Lo que no ha dicho, no cuenta.
  const salario =
    criterio === 'sin-salario' || c.candidato.sinDeclarar?.includes('pretension') || c.candidato.pretension <= tope
      ? 0
      : -Math.round(Math.min(15, (c.candidato.pretension / tope - 1) * 100))
  // Una entrevista que no se ha hecho no suma: no puede valer más que una hecha (CA-31). Hecha, suma o resta según el
  // mínimo de la etapa.
  const entrevista = c.candidato.serena === undefined ? 0 : Math.round((c.candidato.serena - SERENA_POR_DEFECTO.minimo) * 0.5)
  const avance = Math.max(0, indiceEtapa(ctx.vacante, c)) * 2
  const experiencia = criterio === 'experiencia' ? c.candidato.anios * 10 : 0
  const fuera = rechazoDe(ctx, c.id) ? -40 : 0
  return { requisitos, entrevista, salario, avance, experiencia, fuera, total: requisitos + entrevista + salario + avance + experiencia + fuera }
}

const puntaje = (c: Candidatura, ctx: ContextoVacante, criterio: Criterio = 'equilibrado') => desgloseDe(c, ctx, criterio).total

export type Recomendacion = { elegida: Candidatura; razones: string[]; noSe: string[]; pareja?: Candidatura; orden: Candidatura[] }

export function recomendar(personas: Candidatura[], ctx: ContextoVacante, criterio: Criterio = 'equilibrado'): Recomendacion {
  const orden = [...personas].sort((a, b) => puntaje(b, ctx, criterio) - puntaje(a, ctx, criterio))
  const [elegida, segunda] = orden
  const otras = personas.filter((c) => c.id !== elegida.id)
  const tope = ctx.vacante.rango[1]
  const razones: string[] = []
  const cumple = cumplidosDe(elegida.criterios)
  const masCumple = otras.every((c) => cumplidosDe(c.criterios) < cumple)
  if (criterio === 'experiencia')
    razones.push(`Tiene ${elegida.candidato.anios} ${elegida.candidato.anios === 1 ? 'año' : 'años'} de experiencia${otras.every((c) => c.candidato.anios < elegida.candidato.anios) ? ', más que las demás' : ''}.`)
  razones.push(`Cumple ${cumple} de ${elegida.criterios.length} requisitos${masCumple ? ', más que las demás' : ''}.`)
  if (elegida.candidato.serena !== undefined)
    razones.push(
      `Serena AI le dio ${elegida.candidato.serena}/100 en la entrevista${
        elegida.candidato.serena >= SERENA_POR_DEFECTO.minimo ? '' : `, por debajo del mínimo de ${SERENA_POR_DEFECTO.minimo}`
      }.`,
    )
  if (criterio !== 'sin-salario') razones.push(loQuePide(elegida, ctx.vacante))

  const noSe: string[] = []
  const porValidar = elegida.criterios.filter((c) => c.veredicto === 'por-validar').map((c) => `«${c.requisito}»`)
  if (porValidar.length) noSe.push(`Falta validar ${porValidar.join(' y ')}: su CV no lo dice.`)
  if (elegida.candidato.serena === undefined) noSe.push('Todavía no hace la entrevista con Serena AI.')
  const mejorEnSalario = otras.find((c) => c.candidato.pretension < elegida.candidato.pretension && c.candidato.pretension <= tope)
  if (mejorEnSalario && elegida.candidato.pretension > tope) noSe.push(`${primerNombre(mejorEnSalario)} pide menos y está dentro del rango.`)

  // Si la segunda queda muy cerca, se dice: no es una decisión clara.
  const pareja = segunda && puntaje(elegida, ctx, criterio) - puntaje(segunda, ctx, criterio) < 4 ? segunda : undefined
  return { elegida, razones, noSe, pareja, orden }
}

// De entrada se proponen las que más cumplen entre quienes siguen en el proceso.
export const sugeridasParaComparar = (ctx: ContextoVacante, cuantas = 3) =>
  [...ctx.dentro].sort((a, b) => puntaje(b, ctx) - puntaje(a, ctx)).slice(0, cuantas)

/* Lo que propone hacer ------------------------------------------------------------------------------------------ */

// Lo que pide frente al rango de la vacante, con las mismas palabras que su ficha (CA-55): por debajo, dentro o por
// encima del tope; y si no lo ha dicho, que no lo ha dicho.
export function loQuePide(c: Candidatura, vacante: VacanteUI) {
  const { pretension, sinDeclarar } = c.candidato
  if (sinDeclarar?.includes('pretension')) return 'No ha dicho cuánto pide.'
  if (pretension < vacante.rango[0]) return `Pide ${pesos(pretension)}, por debajo del rango (desde ${pesos(vacante.rango[0])}).`
  if (pretension <= vacante.rango[1]) return `Pide ${pesos(pretension)}, dentro del rango.`
  return `Pide ${pesos(pretension)}, por encima del tope de ${pesos(vacante.rango[1])}: habría que negociar.`
}

// Avanzar a quien ya cumple y lleva días quieto, y rechazar a quien no cumple nada. Solo propone.
// - No propone avanzar a quien tiene algo pendiente (un certificado vencido, una evaluación sin revisar): primero eso
//   (CA-12).
// - Rechazar solo a quien la IA marcó «No cumple» en todo. «Por validar» es falta de datos, no un no (CA-11).
export type Propuesta = { candidatura: Candidatura; destino: string | 'rechazo'; porque: string }

export function propuestasDe(vacante: VacanteUI, dentro: Candidatura[]): Propuesta[] {
  const avanzar = dentro
    .filter((c) => ajusteDe(c.criterios) >= 70 && c.dias >= 3 && !c.candidato.accion && siguienteEtapaDe(vacante.etapas, c.etapa))
    .slice(0, 3)
    .map((c) => ({
      candidatura: c,
      destino: siguienteEtapaDe(vacante.etapas, c.etapa) as string,
      porque: `Cumple ${cumplidosDe(c.criterios)} de ${c.criterios.length} y lleva ${c.dias} días en ${tituloEtapa(c.etapa)}.`,
    }))
  const rechazar = dentro
    .filter((c) => c.criterios.length && c.criterios.every((criterio) => criterio.veredicto === 'no-cumple'))
    .slice(0, 1)
    .map((c) => ({
      candidatura: c,
      destino: 'rechazo' as const,
      porque: `No cumple ninguno de los ${c.criterios.length} requisitos: su CV dice lo contrario en todos, no es que falten datos.`,
    }))
  return [...avanzar, ...rechazar]
}

/* Preguntas sobre la vacante ------------------------------------------------------------------------------------ */

export const esperanDe = (ctx: ContextoVacante) => [...ctx.dentro.filter(ESPERA_RESPUESTA)].sort((a, b) => b.dias - a.dias)

export const cumplenTodo = (ctx: ContextoVacante) =>
  ctx.dentro.filter((c) => c.criterios.length && cumplidosDe(c.criterios) === c.criterios.length)

export const cumplenMitad = (ctx: ContextoVacante) =>
  ctx.dentro.filter((c) => c.criterios.length && cumplidosDe(c.criterios) < c.criterios.length && cumplidosDe(c.criterios) * 2 >= c.criterios.length)

export const pidenMas = (ctx: ContextoVacante) =>
  [...ctx.dentro.filter((c) => c.candidato.pretension > ctx.vacante.rango[1])].sort((a, b) => b.candidato.pretension - a.candidato.pretension)

export function embudoDe(ctx: ContextoVacante) {
  const porEtapa = ctx.vacante.etapas.map((etapa) => ({ etapa, cuantos: ctx.dentro.filter((c) => c.etapa === etapa.id).length }))
  const mayor = Math.max(0, ...porEtapa.map((una) => una.cuantos))
  // «Aquí se acumula» solo si una etapa tiene más que todas las demás; si varias empatan arriba, se dicen todas.
  const donde = porEtapa.filter((una) => una.cuantos === mayor)
  return { porEtapa, mayor, acumula: mayor > 0 && donde.length === 1 ? donde[0] : null, empatadas: mayor > 0 && donde.length > 1 ? donde : [] }
}

export function motivosDeRechazo(ctx: ContextoVacante) {
  const cuenta = new Map<string, number>()
  for (const r of ctx.rechazadas) cuenta.set(r.motivo, (cuenta.get(r.motivo) ?? 0) + 1)
  return [...cuenta].sort((a, b) => b[1] - a[1])
}

export function entrevistasDe(ctx: ContextoVacante) {
  const etapaIA = ctx.vacante.etapas.find((etapa) => etapa.ia)
  const hechas = ctx.dentro.filter((c) => c.candidato.serena !== undefined)
  const bajas = hechas.filter((c) => (c.candidato.serena ?? 100) < 70)
  const sinAgendar = etapaIA ? ctx.dentro.filter((c) => c.etapa === etapaIA.id && c.candidato.serena === undefined) : []
  const promedio = hechas.length ? Math.round(hechas.reduce((suma, c) => suma + (c.candidato.serena ?? 0), 0) / hechas.length) : null
  return { etapaIA, hechas, bajas, sinAgendar, promedio }
}

/* Por fechas (OF-11) ------------------------------------------------------------------------------------------- */

// Quién llegó, quién cambió de etapa y quién salió en los últimos días. Lo de la visita cuenta como de hoy.
export function actividadDe(ctx: ContextoVacante, dias: number, movimientos: { candidaturaId: string; tipo?: string; hacia: string; cuando: number }[]) {
  const llegaron = ctx.dentro.filter((c) => diasDesdeQueAplico(c) <= dias)
  const hoy = new Set(movimientos.filter((m) => !m.tipo || m.tipo === 'vuelve').map((m) => m.candidaturaId))
  const primera = ctx.vacante.etapas[0]?.id
  const avanzaron = ctx.dentro.filter((c) => !llegaron.includes(c) && (hoy.has(c.id) || (c.etapa !== primera && c.dias <= dias)))
  const salieron = ctx.rechazadas.filter((r) => r.cuando !== undefined && Date.now() - r.cuando <= (dias + 1) * 86_400_000)
  return { llegaron, avanzaron, salieron }
}

export const exEmpleadosDe = (ctx: ContextoVacante) => ctx.dentro.filter(fueEmpleado)

// Cómo entró cada persona: es lo único que se sabe. Por qué canal vio la vacante (LinkedIn, Computrabajo, un referido)
// no se sabe ni se va a saber: todas aplican por el portal de empleo (8 oct, VP de producto).
export const ENTRADAS = ['Aplicaron por el portal de empleo', 'Llegaron en un lote de CVs', 'Las agregó el equipo a mano'] as const
const entradaDe = (c: Candidatura) => (c.importada ? ENTRADAS[1] : c.candidato.origen === 'Agregado a mano' ? ENTRADAS[2] : ENTRADAS[0])
export function porEntrada(ctx: ContextoVacante) {
  return ENTRADAS.map((nombre) => [nombre, ctx.dentro.filter((c) => entradaDe(c) === nombre)] as const).filter(([, gente]) => gente.length)
}

/* La vacante misma (OF-05, OF-38, OF-42) ----------------------------------------------------------------------- */

// Lo que le falta a la vacante para publicarse bien: una lista de revisión con lo que sí tiene y lo que no.
export function revisionDeLaVacante(vacante: VacanteUI) {
  const texto = vacante.descripcion.join(' ')
  return [
    { ok: vacante.descripcion.length > 0 && texto.length >= 120, texto: texto.length >= 120 ? 'La descripción cuenta qué hará la persona.' : 'La descripción es muy corta: cuenta qué hará la persona en su día a día.' },
    { ok: vacante.requisitos.length >= 3 && vacante.requisitos.length <= 6, texto: vacante.requisitos.length < 3 ? `Tiene ${vacante.requisitos.length} requisitos: con menos de 3 la IA no distingue bien.` : vacante.requisitos.length > 6 ? `Tiene ${vacante.requisitos.length} requisitos: con más de 6 casi nadie los cumple todos.` : `Tiene ${vacante.requisitos.length} requisitos, una cantidad que la IA puede comparar bien.` },
    { ok: vacante.rango[1] > vacante.rango[0] && !/rango salarial/i.test(texto), texto: /rango salarial/i.test(texto) ? 'La descripción dice que falta cerrar el rango salarial.' : `El rango salarial está definido (${pesos(vacante.rango[0])} – ${pesos(vacante.rango[1])}).` },
    { ok: vacante.etapas.length >= 2, texto: `El proceso tiene ${vacante.etapas.length} etapas${vacante.etapas.some((etapa) => etapa.ia) ? ', con al menos una de IA' : ''}.` },
    { ok: vacante.equipo.length > 1, texto: vacante.equipo.length > 1 ? `Trabajan en ella ${vacante.equipo.length} personas.` : 'Solo la trabaja una persona: suma a quien entrevista o decide.' },
  ]
}

/* Buscar en la base (OF-22) ------------------------------------------------------------------------------------ */

// Quién de la base encaja con la vacante y todavía no está en ella: comparte palabras del cargo, sus requisitos o sus
// etiquetas con lo que la persona hace y sabe hacer.
export function afinesEnLaBase(ctx: ContextoVacante, base: Persona[], cuantas = 5) {
  const ya = new Set(todasDe(ctx).map((c) => c.personaId))
  const RELLENO = new Set(['de', 'del', 'la', 'el', 'y', 'en', 'para', 'con', 'los', 'las', 'a', 'o', 'anos', 'mas', 'por'])
  const claves = new Set(
    [ctx.vacante.titulo, ...ctx.vacante.requisitos, ...ctx.vacante.etiquetas]
      .flatMap((texto) => palabras(texto))
      .filter((palabra) => palabra.length > 2 && !RELLENO.has(palabra)),
  )
  return base
    .filter((persona) => !ya.has(persona.id) && !persona.noContactar)
    .map((persona) => {
      const suyas = new Set([persona.cargo, ...persona.habilidades, ...persona.etiquetas].flatMap((texto) => palabras(texto)))
      const comunes = [...claves].filter((clave) => suyas.has(clave))
      return { persona, comunes }
    })
    .filter((una) => una.comunes.length >= 2)
    .sort((a, b) => b.comunes.length - a.comunes.length || b.persona.anios - a.persona.anios)
    .slice(0, cuantas)
}

export function personaDeLaBase(nombre: string, base: Persona[]) {
  const buscado = palabras(nombre)
  return base.filter((persona) => buscado.every((parte) => palabras(persona.nombre).includes(parte)))
}

/* Escribirle a alguien (OF-15) --------------------------------------------------------------------------------- */

// Un borrador con lo que se sabe de la persona: en qué va y qué falta. No sale de aquí: se envía desde su ficha.
export function borradorDeCorreo(c: Candidatura, vacante: VacanteUI) {
  const nombre = primerNombre(c)
  const etapa = tituloEtapa(c.etapa)
  const etapaIA = vacante.etapas.find((una) => una.id === c.etapa && una.ia)
  if (etapaIA && c.candidato.serena === undefined)
    return {
      asunto: `Tu entrevista para ${vacante.titulo}`,
      cuerpo: `Hola, ${nombre}:\n\nTe escribimos porque sigues en el proceso de ${vacante.titulo} y todavía no has hecho la entrevista con Serena AI. Toma unos 20 minutos y la puedes hacer cuando quieras con el enlace de tu invitación.\n\nSi tienes alguna duda, responde a este correo.`,
    }
  return {
    asunto: `Tu proceso para ${vacante.titulo}`,
    cuerpo: `Hola, ${nombre}:\n\nQueremos contarte cómo va tu proceso para ${vacante.titulo}: estás en la etapa de ${etapa}. Te escribiremos en los próximos días con el siguiente paso.\n\nGracias por tu paciencia.`,
  }
}
