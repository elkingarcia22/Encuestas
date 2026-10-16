import { plural } from '@/modules/design-system/patrones/formato'
import { DIAS_ESTANCADA } from '../../../vacantes/components/datos'
import {
  CANDIDATURAS,
  ESPERA_RESPUESTA,
  PLAZO_ENTREVISTA,
  cumplidosDe,
  esUltimaEtapa,
  etapaDe,
  siguienteEtapaDe,
  tituloEtapa,
  type Candidatura,
  type VacanteUI,
} from '../../../propuestas/datos'
import type { Movimiento } from '../../../propuestas/movimientos'
import type { Grupo } from '../../../propuestas/grupos-atencion'
import { bolsaDe, creditos, historialCon, registroDeCreditos } from '../../../propuestas/creditos'
import { almacenDeLotes, cuentasDe } from '../../../propuestas/importacion'
import { claveAsi, claveDe } from './estado'
import { vacantesDeLaSesion } from './acciones'

// El tablero de atención del inicio de Vacantes (29 sep, reunión con Elkin: «si le estamos diciendo que cuatro cosas
// necesitan tu atención, ¿qué va a hacer él? Resolver eso», y que no fuera una lista sino un tablero por categorías,
// para que cada rol se enfoque en lo suyo). Tiene los mismos tres grupos que el «Panel de riesgos» que Elkin armó en
// Encuestas (su rama, 30 sep) —Críticas, Necesitan atención y Acción manual— más un cuarto con lo que propone la IA.
// Cuando su rama llegue, las dos versiones se unifican en una sola pieza.
//
// Todo sale de los datos de la exploración (las vacantes, la gente en proceso y lo que se movió en la sesión): nada
// inventado. Las reglas, de la más grave a la menos:
//
// Críticas — lo que se pierde si nadie actúa hoy:
// - `sin-creditos`: un agente de IA se quedó sin créditos y sus vacantes están en pausa (IN-07).
// - `entrevista-vencida`: la invitación a Serena AI ya venció (pasaron PLAZO_ENTREVISTA días) y nadie la renovó (IN-11).
// - `entrevista-vence`: la invitación vence en AVISO_ENTREVISTA días o menos.
// - `se-pierden`: gente que espera una respuesta del equipo hace DIAS_SE_PIERDE días o más. Se va con otra oferta.
//
// Necesitan atención — señales que conviene leer antes de que se vuelvan críticas:
// - `cv-sin-revisar`: hojas de vida que llevan DIAS_SIN_REVISAR días o más sin que nadie las mire.
// - `estancadas`: las vacantes publicadas que pasaron DIAS_ESTANCADA días abiertas, juntas en un solo asunto (IN-25).
// - `sin-candidatos`: publicadas hace DIAS_SIN_CANDIDATOS días o más sin una sola aplicación (el aviso de Elkin, IN-29).
// - `fuera-del-portal`: vacantes publicadas pero escondidas del portal de empleo: nadie nuevo puede aplicar.
// - `cerradas-con-gente`: gente que sigue en proceso en vacantes ya cerradas y nunca supo en qué quedó (IN-30).
//
// Acción manual — pasos que la plataforma no da sola:
// - `borradores`: vacantes que nadie ha publicado.
// - `assessment`: pruebas terminadas que esperan que alguien las revise.
// - `antecedentes`: verificaciones de antecedentes o certificados pendientes.
// - `hojas-dudosas`: lotes de hojas de vida importadas con datos que la IA no pudo leer con seguridad.
//
// Sugerencias de la IA — lo que el agente propone hacer, una por asunto; cada una se aplica o se descarta:
// - `ia-escribir:<persona>`: escribirle a quien cumple todo y lleva días sin respuesta (es de las mejores y se puede perder).
// - `ia-mover:<persona>`: pasar a la siguiente etapa a quien cumple todo y no tiene nada pendiente.
// - `ia-lectura:<vacante>`: que la IA haga la primera lectura de una etapa con VOLUMEN_ETAPA hojas de vida o más.
// Nunca a quien ya está en otro asunto: resolver una cosa no debe dejar la otra a medias (IN-12).

export const DIAS_SE_PIERDE = 10
export { PLAZO_ENTREVISTA }
export const AVISO_ENTREVISTA = 2
export const DIAS_SIN_REVISAR = 5
export const VOLUMEN_ETAPA = 15
export const DIAS_SIN_CANDIDATOS = 10
// Escribirle a quien espera no lo resuelve para siempre: si en estos días nadie la revisa, vuelve (IN-45).
export const DIAS_POSPONE = 3
export { DIAS_ESTANCADA }

// Los grupos los comparte con el tablero de Créditos (5 oct).
export { GRUPOS, grupoDe, type Grupo, type InfoGrupo } from '../../../propuestas/grupos-atencion'

// Lo que se puede hacer con cada persona o vacante de un asunto. Las de contexto se resuelven en el panel (escribir,
// reenviar, devolver al portal, rechazar y avisar, marcar como revisada o dejarla así); las directas llevan a su sección
// (abrir a la persona en su vacante, abrir la vacante, terminar un borrador en la creación, revisar un lote).
export type Accion = 'escribir' | 'reenviar' | 'devolver' | 'abrir' | 'abrir-vacante' | 'terminar' | 'revisar-lote' | 'revisado' | 'rechazar' | 'dejar'

// La plantilla del correo que tiene sentido para cada asunto (IN-02): no la de la base para buscar candidatos.
export type PlantillaAsunto = 'documentos' | 'actualizacion' | 'cierre' | 'sigue'

export type Elemento = {
  id: string
  titulo: string
  detalle: string
  vacante: VacanteUI
  persona?: Candidatura
}

export type Sugerencia =
  | { tipo: 'escribir'; persona: Candidatura }
  | { tipo: 'mover'; persona: Candidatura; hacia: string }
  | { tipo: 'lectura'; vacante: VacanteUI; etapa: string; cuantos: number }

export type Asunto = {
  id: string
  grupo: Grupo
  titulo: string
  resumen: string
  // «Qué está pasando»: los datos que lo explican.
  datos: { termino: string; valor: string }[]
  // «Cómo resolverlo».
  como: string
  elementos: Elemento[]
  // Cuántos quedan sin resolver. En cero el asunto sale del tablero (el panel lo deja ver hasta que se vuelve a la lista).
  pendientes: number
  // La acción de cada fila, lo que dice la fila cuando ya se hizo y, si existe, la misma para todas a la vez.
  fila?: { accion: Accion; etiqueta: string; hecho: string; todas?: (n: number) => string }
  // Una segunda acción por fila: abrir a la persona o la vacante, o dejarla así a propósito (IN-28).
  otra?: { accion: 'abrir' | 'abrir-vacante' | 'dejar'; etiqueta: string; hecho?: string }
  // El correo que sale al escribir desde este asunto.
  plantilla?: PlantillaAsunto
  // Un asunto de una sola vacante: cuál es, y sus acciones van en el pie del panel.
  vacante?: VacanteUI
  pie?: { abrir?: boolean; editar?: boolean; revisado?: boolean }
  // Un asunto que se resuelve en otra pantalla (Créditos): el botón del pie que lleva allá.
  enlace?: { texto: string; ruta: string }
  sugerencia?: Sugerencia
  // Por qué lo propone la IA, en una frase.
  porque?: string
}

// Lo que dice el botón de una sugerencia: qué va a pasar si se aplica.
export function etiquetaSugerencia(asunto: Asunto) {
  const sugerencia = asunto.sugerencia
  if (!sugerencia) return 'Aplicar'
  if (sugerencia.tipo === 'escribir') return 'Escribirle'
  if (sugerencia.tipo === 'mover') return 'Pasarla'
  return 'Leerlas'
}

const dias = (n: number) => `${n} ${plural(n, 'día', 'días')}`
const personas = (n: number) => `${n} ${plural(n, 'persona', 'personas')}`
const lista = (nombres: string[]) => (nombres.length <= 1 ? nombres.join('') : `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}`)
// «A, B y 3 más»: nunca una lista de cuarenta nombres en una frase.
export const algunos = (nombres: string[], cuantos = 2) => (nombres.length <= cuantos ? lista(nombres) : `${nombres.slice(0, cuantos).join(', ')} y ${nombres.length - cuantos} más`)

// Las vacantes que más se repiten en una lista de personas, para decir dónde está el asunto: «Desarrollador backend (7) y
// Coordinador de turno (1)».
function dondeEstan(elementos: Elemento[]) {
  const cuenta = new Map<string, number>()
  elementos.forEach((elemento) => cuenta.set(elemento.vacante.titulo, (cuenta.get(elemento.vacante.titulo) ?? 0) + 1))
  return [...cuenta.entries()].sort((a, b) => b[1] - a[1]).map(([titulo, n]) => `${titulo} (${n})`)
}

// Lo pendiente de la persona, sin repetir los días si ya los dice («Sin revisar hace 12 días»), IN-47.
const pendienteDe = (c: Candidatura) => {
  const accion = c.candidato.accion
  if (!accion) return `${dias(c.dias)} esperando`
  return /\bhace\b/.test(accion) ? accion : `${dias(c.dias)} · ${accion.toLowerCase()}`
}

const elementoPersona = (c: Candidatura, extra?: string): Elemento => ({
  id: c.id,
  titulo: c.candidato.nombre,
  detalle: [c.vacante.titulo, tituloEtapa(c.etapa), extra ?? `${dias(c.dias)} esperando`].join(' · '),
  vacante: c.vacante,
  persona: c,
})

const cumpleTodo = (c: Candidatura) => c.criterios.length > 0 && cumplidosDe(c.criterios) === c.criterios.length
// Lo pendiente es de la candidatura: solo cuenta la invitación de la vacante donde la persona está en Serena (IN-01).
const esDeSerena = (c: Candidatura) => c.etapa === 'serena' && Boolean(c.candidato.accion?.includes('Serena'))

export function asuntosDe({
  registro,
  hechos,
  descartadas,
}: {
  registro: readonly Movimiento[]
  hechos: ReadonlySet<string>
  descartadas: ReadonlySet<string>
}): Asunto[] {
  const vacantes = vacantesDeLaSesion()
  const ids = new Set(vacantes.map((vacante) => vacante.id))
  const movidas = new Set(registro.map((movimiento) => movimiento.candidaturaId))
  const fuera = new Set(
    registro.filter((movimiento) => movimiento.tipo === 'rechazo' || movimiento.tipo === 'retiro').map((movimiento) => movimiento.candidaturaId),
  )
  const vivas = CANDIDATURAS.filter((c) => ids.has(c.vacante.id) && !fuera.has(c.id))
  // La gente en proceso de las vacantes que siguen abiertas. Mover a alguien (o escribirle) apaga su «Espera», como en
  // la vacante.
  const enProceso = vivas.filter((c) => c.vacante.estado !== 'Cerrada')
  const esperan = enProceso.filter((c) => ESPERA_RESPUESTA(c) && !movidas.has(c.id))

  const asuntos: Asunto[] = []
  const cerrar = (asunto: Omit<Asunto, 'pendientes'>) => {
    const pendientes = asunto.elementos.length
      ? asunto.elementos.filter((elemento) => !hechos.has(claveDe(asunto.id, elemento.id))).length
      : hechos.has(asunto.id)
        ? 0
        : 1
    asuntos.push({ ...asunto, pendientes })
  }
  const pendientesDe = (asunto: string, elementos: Elemento[]) => elementos.filter((elemento) => !hechos.has(claveDe(asunto, elemento.id)))

  /* Críticas ----------------------------------------------------------------------------------------------------- */

  // Un agente sin créditos deja en pausa sus vacantes: lo mismo que el tablero de Créditos, aquí también (IN-07).
  const bolsa = bolsaDe(historialCon(registroDeCreditos.leer()))
  bolsa.porAgente
    .filter((estado) => estado.agente.costo && estado.situacion === 'sin-cupo' && estado.vacantes.some((vacante) => ids.has(vacante.id)))
    .forEach(({ agente, libre, vacantes: enPausa }) => {
      const suyas = enPausa.filter((vacante) => ids.has(vacante.id))
      cerrar({
        id: `sin-creditos:${agente.id}`,
        grupo: 'critico',
        titulo: `${agente.nombre} se quedó sin créditos: ${suyas.length} ${plural(suyas.length, 'vacante en pausa', 'vacantes en pausa')}`,
        resumen: `Nadie avanza en «${agente.nombre}» en ${algunos(suyas.map((vacante) => vacante.titulo))} hasta que tenga créditos.`,
        datos: [
          { termino: 'Le quedan', valor: `${creditos(libre)} · cada ${agente.uso[0]} cuesta ${creditos(agente.costo)}` },
          { termino: 'En pausa', valor: suyas.map((vacante) => vacante.titulo).join(' · ') },
        ],
        como: 'Dale créditos de los que tienes sin asignar o pide una recarga en Créditos. Mientras tanto, quien llegue a esa etapa espera ahí.',
        elementos: [],
        enlace: { texto: 'Ir a Créditos', ruta: '/admin/seleccion/creditos/uno' },
      })
    })

  // Una invitación vencida ya no «vence hoy»: la persona sale sola por «Entrevista expirada» si nadie la invita de nuevo.
  const vencidas = esperan.filter((c) => esDeSerena(c) && c.dias >= PLAZO_ENTREVISTA).sort((a, b) => b.dias - a.dias)
  if (vencidas.length) {
    const elementos = vencidas.map((c) => elementoPersona(c, c.dias === PLAZO_ENTREVISTA ? 'venció hoy' : `venció hace ${dias(c.dias - PLAZO_ENTREVISTA)}`))
    const quedan = pendientesDe('entrevista-vencida', elementos)
    cerrar({
      id: 'entrevista-vencida',
      grupo: 'critico',
      titulo: `Se venció la invitación a Serena AI de ${personas(quedan.length || vencidas.length)}`,
      resumen: 'Si no las invitas de nuevo, salen del proceso con el motivo «Entrevista expirada».',
      datos: [
        { termino: 'Personas', valor: String(quedan.length || vencidas.length) },
        { termino: 'Plazo para presentarla', valor: `${dias(PLAZO_ENTREVISTA)} desde la invitación` },
        { termino: 'Dónde', valor: dondeEstan(elementos).join(' · ') },
      ],
      como: 'Invítalas de nuevo: les llega un correo con siete días más. Si ya no te interesan, ábrelas y recházalas con su correo.',
      elementos,
      fila: { accion: 'reenviar', etiqueta: 'Invitar de nuevo', hecho: 'Invitada de nuevo', todas: (n) => `Invitar de nuevo a ${plural(n, 'la persona', `las ${n}`)}` },
      otra: { accion: 'abrir', etiqueta: 'Abrir' },
    })
  }

  const vence = esperan
    .filter((c) => esDeSerena(c) && c.dias >= PLAZO_ENTREVISTA - AVISO_ENTREVISTA && c.dias < PLAZO_ENTREVISTA)
    .sort((a, b) => b.dias - a.dias)
  const venceEn = (c: Candidatura) => PLAZO_ENTREVISTA - c.dias
  const textoVence = (c: Candidatura) => (venceEn(c) <= 0 ? 'vence hoy' : venceEn(c) === 1 ? 'vence mañana' : `vence en ${dias(venceEn(c))}`)
  if (vence.length) {
    const elementos = vence.map((c) => elementoPersona(c, `la invitación ${textoVence(c)}`))
    const quedan = pendientesDe('entrevista-vence', elementos)
    const pronto = vence.filter((c) => venceEn(c) <= 1 && quedan.some((elemento) => elemento.id === c.id))
    cerrar({
      id: 'entrevista-vence',
      grupo: 'critico',
      // La cifra primero: en dos o tres líneas se tiene que leer (IN-10).
      titulo: `${personas(quedan.length || vence.length)}: la invitación a Serena AI vence pronto`,
      resumen: pronto.length ? `${lista(pronto.map((c) => c.candidato.nombre))} la ${plural(pronto.length, 'pierde', 'pierden')} si no la agendan.` : 'Todavía están a tiempo de agendarla.',
      datos: [
        { termino: 'Personas', valor: String(quedan.length || vence.length) },
        { termino: 'Plazo para presentarla', valor: `${dias(PLAZO_ENTREVISTA)} desde la invitación` },
        { termino: 'Vence mañana o antes', valor: String(pronto.length) },
        { termino: 'Dónde', valor: dondeEstan(elementos).join(' · ') },
      ],
      como: 'Reenvíales la invitación: les llega un correo nuevo con siete días más para presentarla, y el plazo vuelve a empezar en su ficha. Si se vence, la persona sale del proceso sola, con el motivo «Entrevista expirada».',
      elementos,
      fila: { accion: 'reenviar', etiqueta: 'Reenviar', hecho: 'Reenviada', todas: (n) => `Reenviar a ${plural(n, 'la persona', `las ${n}`)}` },
      otra: { accion: 'abrir', etiqueta: 'Abrir' },
    })
  }

  const sePierden = esperan
    .filter((c) => c.dias >= DIAS_SE_PIERDE && !esDeSerena(c))
    .sort((a, b) => b.dias - a.dias)
  if (sePierden.length) {
    const elementos = sePierden.map((c) => elementoPersona(c, pendienteDe(c)))
    const quedan = pendientesDe('se-pierden', elementos)
    const primera = sePierden.find((c) => quedan.some((elemento) => elemento.id === c.id)) ?? sePierden[0]
    cerrar({
      id: 'se-pierden',
      grupo: 'critico',
      titulo: `${personas(quedan.length || sePierden.length)} ${plural(quedan.length || sePierden.length, 'espera', 'esperan')} tu respuesta hace ${DIAS_SE_PIERDE} días o más`,
      resumen: `Las puedes perder: ${primera.candidato.nombre} lleva ${dias(primera.dias)}.`,
      datos: [
        { termino: 'Personas', valor: String(quedan.length || sePierden.length) },
        { termino: 'La que más espera', valor: `${primera.candidato.nombre}, ${dias(primera.dias)}` },
        { termino: 'Dónde', valor: dondeEstan(elementos).join(' · ') },
      ],
      como: `Escríbeles hoy para que sepan en qué va su proceso, o ábrelas y decide si siguen o no. Escribirles no decide nada: salen de aquí ${DIAS_POSPONE} días y, si para entonces nadie las revisó, vuelven.`,
      elementos,
      fila: { accion: 'escribir', etiqueta: 'Escribirle', hecho: 'Le escribiste', todas: (n) => `Escribirles a ${plural(n, 'la persona', `las ${n}`)}` },
      otra: { accion: 'abrir', etiqueta: 'Abrir' },
      plantilla: 'sigue',
    })
  }

  /* Necesitan atención ------------------------------------------------------------------------------------------- */

  const sinRevisar = esperan
    .filter((c) => c.etapa === 'cv' && c.dias >= DIAS_SIN_REVISAR && c.dias < DIAS_SE_PIERDE)
    .sort((a, b) => b.dias - a.dias)
  if (sinRevisar.length) {
    const elementos = sinRevisar.map((c) => elementoPersona(c, `${dias(c.dias)} sin revisar · cumple ${cumplidosDe(c.criterios)} de ${c.criterios.length}`))
    const quedan = pendientesDe('cv-sin-revisar', elementos)
    const mejores = sinRevisar.filter(cumpleTodo)
    cerrar({
      id: 'cv-sin-revisar',
      grupo: 'atencion',
      titulo: `${quedan.length || sinRevisar.length} ${plural(quedan.length || sinRevisar.length, 'CV lleva', 'CVs llevan')} ${DIAS_SIN_REVISAR} días o más sin revisar`,
      resumen: `En ${lista(dondeEstan(elementos).map((donde) => donde.replace(/ \(\d+\)$/, '')))}.`,
      datos: [
        { termino: 'CVs', valor: String(quedan.length || sinRevisar.length) },
        { termino: 'El más antiguo', valor: dias(sinRevisar[0].dias) },
        { termino: 'Cumplen todos los requisitos', valor: mejores.length ? lista(mejores.map((c) => c.candidato.nombre)) : 'Ninguna' },
      ],
      como: 'Ábrelos desde aquí: cada uno se abre en su vacante, con la persona al lado para decidir si sigue. Al abrirlo desde aquí queda como revisado aunque la persona siga en la misma etapa. Empieza por los que cumplen todo.',
      elementos,
      fila: { accion: 'abrir', etiqueta: 'Revisar', hecho: 'Revisado' },
    })
  }

  // Todas las estancadas en un solo asunto, como «fuera del portal»: con cuarenta no son cuarenta tarjetas (IN-25). Las
  // que no tienen ni una aplicación van en «sin candidatos», que dice algo más preciso: no sale la misma vacante dos veces.
  const estancadas = vacantes
    .filter((vacante) => vacante.estado === 'Publicada' && vacante.diasAbierta >= DIAS_ESTANCADA && !(vacante.diasAbierta >= DIAS_SIN_CANDIDATOS && vacante.aplicaciones === 0))
    .sort((a, b) => b.diasAbierta - a.diasAbierta)
  if (estancadas.length) {
    const elementos = estancadas.map<Elemento>((vacante) => ({
      id: vacante.id,
      titulo: vacante.titulo,
      detalle: `${dias(vacante.diasAbierta)} abierta · ${vacante.aplicaciones} ${plural(vacante.aplicaciones, 'aplicación', 'aplicaciones')} · ${personas(enProceso.filter((c) => c.vacante.id === vacante.id).length)} en proceso`,
      vacante,
    }))
    const quedan = pendientesDe('estancadas', elementos)
    const una = (quedan.length || estancadas.length) === 1 ? (estancadas.find((vacante) => quedan.some((elemento) => elemento.id === vacante.id)) ?? estancadas[0]) : null
    cerrar({
      id: 'estancadas',
      grupo: 'atencion',
      titulo: una ? `${una.titulo} lleva ${dias(una.diasAbierta)} abierta` : `${quedan.length || estancadas.length} vacantes llevan más de ${DIAS_ESTANCADA} días abiertas`,
      resumen: `Pasaron el límite de ${DIAS_ESTANCADA} días: algo en el proceso no está funcionando. La que más: ${estancadas[0].titulo} (${dias(estancadas[0].diasAbierta)}).`,
      datos: [
        { termino: 'Vacantes', valor: String(quedan.length || estancadas.length) },
        { termino: 'Límite', valor: dias(DIAS_ESTANCADA) },
        { termino: 'La que más', valor: `${estancadas[0].titulo}, ${dias(estancadas[0].diasAbierta)}` },
      ],
      como: 'Revisa si el perfil pide más de la cuenta, si el rango salarial está por debajo del mercado o si conviene publicarla en otro portal. Si ya lo revisaste, márcalo y sale de aquí.',
      elementos,
      fila: { accion: 'revisado', etiqueta: 'Ya lo revisé', hecho: 'Revisada' },
      otra: { accion: 'abrir-vacante', etiqueta: 'Abrir' },
    })
  }

  // Publicada hace días y sin una sola aplicación: el aviso del inicio de Elkin (IN-29).
  const sinNadie = vacantes.filter((vacante) => vacante.estado === 'Publicada' && vacante.diasAbierta >= DIAS_SIN_CANDIDATOS && vacante.aplicaciones === 0)
  if (sinNadie.length) {
    const elementos = sinNadie.map<Elemento>((vacante) => ({
      id: vacante.id,
      titulo: vacante.titulo,
      detalle: `${dias(vacante.diasAbierta)} publicada · ${vacante.oculta ? 'oculta del portal' : 'visible en el portal'}`,
      vacante,
    }))
    const quedan = pendientesDe('sin-candidatos', elementos)
    const unaSin = (quedan.length || sinNadie.length) === 1 ? (sinNadie.find((vacante) => quedan.some((elemento) => elemento.id === vacante.id)) ?? sinNadie[0]) : null
    cerrar({
      id: 'sin-candidatos',
      grupo: 'atencion',
      titulo: unaSin ? `${unaSin.titulo} lleva ${dias(unaSin.diasAbierta)} sin un solo candidato` : `${quedan.length || sinNadie.length} vacantes publicadas no tienen ni un candidato`,
      resumen: `Llevan ${DIAS_SIN_CANDIDATOS} días o más sin una sola aplicación: ${algunos(sinNadie.map((vacante) => vacante.titulo))}.`,
      datos: [{ termino: 'Vacantes', valor: String(quedan.length || sinNadie.length) }],
      como: 'Revisa que esté en el portal, que el título se entienda y que el salario esté a la vista. Si ya lo revisaste, márcalo y sale de aquí.',
      elementos,
      fila: { accion: 'revisado', etiqueta: 'Ya lo revisé', hecho: 'Revisada' },
      otra: { accion: 'abrir-vacante', etiqueta: 'Abrir' },
    })
  }

  const escondidas = vacantes.filter((vacante) => vacante.estado === 'Publicada' && vacante.oculta)
  if (escondidas.length) {
    const elementos = escondidas.map<Elemento>((vacante) => ({
      id: vacante.id,
      titulo: vacante.titulo,
      detalle: `${dias(vacante.diasAbierta)} abierta · ${vacante.ultimaSemana} ${plural(vacante.ultimaSemana, 'aplicación', 'aplicaciones')} esta semana`,
      vacante,
    }))
    const quedan = pendientesDe('fuera-del-portal', elementos)
    cerrar({
      id: 'fuera-del-portal',
      grupo: 'atencion',
      titulo: `${quedan.length || escondidas.length} ${plural(quedan.length || escondidas.length, 'vacante está oculta', 'vacantes están ocultas')} del portal`,
      resumen: `Nadie nuevo puede aplicar a ${algunos(escondidas.map((vacante) => vacante.titulo))}.`,
      datos: [
        { termino: 'Vacantes', valor: String(quedan.length || escondidas.length) },
        { termino: 'Siguen publicadas', valor: 'Sí: solo las ve el equipo' },
      ],
      como: 'Si fue a propósito, déjalas así y salen de aquí. Si no, vuelve a mostrarlas en el portal para que reciban CVs.',
      elementos,
      fila: { accion: 'devolver', etiqueta: 'Mostrar en el portal', hecho: 'Visible en el portal', todas: (n) => `Mostrar ${plural(n, 'la vacante', `las ${n}`)}` },
      otra: { accion: 'dejar', etiqueta: 'Dejarla así', hecho: 'Se queda así' },
    })
  }

  // Cerrar una vacante no le responde a nadie: quien seguía en proceso se queda esperando (IN-30).
  const enCerradas = vivas.filter((c) => c.vacante.estado === 'Cerrada' && !movidas.has(c.id)).sort((a, b) => b.dias - a.dias)
  if (enCerradas.length) {
    const elementos = enCerradas.map((c) => elementoPersona(c, `${dias(c.dias)} en la etapa`))
    const quedan = pendientesDe('cerradas-con-gente', elementos)
    cerrar({
      id: 'cerradas-con-gente',
      grupo: 'atencion',
      titulo: `${personas(quedan.length || enCerradas.length)} ${plural(quedan.length || enCerradas.length, 'sigue', 'siguen')} en proceso en vacantes cerradas`,
      resumen: `Nunca supieron en qué quedó: ${algunos(dondeEstan(elementos).map((donde) => donde.replace(/ \(\d+\)$/, '')))}.`,
      datos: [
        { termino: 'Personas', valor: String(quedan.length || enCerradas.length) },
        { termino: 'Dónde', valor: dondeEstan(elementos).join(' · ') },
      ],
      como: 'Recházalas con el motivo «Se cerró la vacante»: a cada una le llega el correo de cierre, y en Mis candidatos quedan libres para otros procesos.',
      elementos,
      fila: { accion: 'rechazar', etiqueta: 'Rechazar y avisar', hecho: 'Rechazada', todas: (n) => `Rechazar y avisar a ${plural(n, 'la persona', `las ${n}`)}` },
      otra: { accion: 'abrir', etiqueta: 'Abrir' },
    })
  }

  /* Acción manual ------------------------------------------------------------------------------------------------ */

  const borradores = vacantes.filter((vacante) => vacante.estado === 'Borrador')
  if (borradores.length) {
    const elementos = borradores.map<Elemento>((vacante) => ({
      id: vacante.id,
      titulo: vacante.titulo,
      detalle: `${vacante.area} · ${vacante.reclutador.nombre || 'Sin asignar'}`,
      vacante,
    }))
    const quedan = pendientesDe('borradores', elementos)
    const porQuien = new Map<string, number>()
    borradores.forEach((vacante) => porQuien.set(vacante.reclutador.nombre || 'Sin asignar', (porQuien.get(vacante.reclutador.nombre || 'Sin asignar') ?? 0) + 1))
    cerrar({
      id: 'borradores',
      grupo: 'manual',
      titulo: `${quedan.length || borradores.length} ${plural(quedan.length || borradores.length, 'borrador sin publicar', 'borradores sin publicar')}`,
      resumen: `Nadie los ve fuera del equipo: ${algunos(borradores.map((vacante) => vacante.titulo))}.`,
      datos: [
        { termino: 'Borradores', valor: String(quedan.length || borradores.length) },
        { termino: 'De quién', valor: [...porQuien.entries()].map(([nombre, n]) => `${nombre} (${n})`).join(' · ') },
      ],
      como: 'Termínalos en la creación: se abre en el paso que falta y al final se publica. Si uno quedó en pausa a propósito, déjalo así y sale de aquí.',
      elementos,
      fila: { accion: 'terminar', etiqueta: 'Terminar', hecho: 'Abierto' },
      otra: { accion: 'dejar', etiqueta: 'Dejarlo así', hecho: 'Se queda así' },
    })
  }

  const porRevisarPrueba = esperan.filter((c) => c.candidato.accion?.toLowerCase().includes('assessment'))
  if (porRevisarPrueba.length) {
    // Los días que lleva la prueba esperando en esa etapa (no desde que la terminó: eso no se guarda), IN-47.
    const elementos = porRevisarPrueba.map((c) => elementoPersona(c, `prueba terminada · ${dias(c.dias)} en la etapa`))
    const quedan = pendientesDe('assessment', elementos)
    cerrar({
      id: 'assessment',
      grupo: 'manual',
      titulo: `${quedan.length || porRevisarPrueba.length} ${plural(quedan.length || porRevisarPrueba.length, 'prueba por revisar', 'pruebas por revisar')}`,
      resumen: `${lista(porRevisarPrueba.map((c) => c.candidato.nombre))} ya ${plural(porRevisarPrueba.length, 'terminó', 'terminaron')}.`,
      datos: [{ termino: 'Pruebas', valor: String(quedan.length || porRevisarPrueba.length) }],
      como: 'Ábrelas en su vacante: el resultado está en su etapa, en el «Resumen» de cada persona. Al abrirla desde aquí queda como revisada.',
      elementos,
      fila: { accion: 'abrir', etiqueta: 'Revisar', hecho: 'Revisada' },
    })
  }

  const antecedentes = esperan.filter((c) => c.etapa === 'antecedentes' || c.candidato.accion?.toLowerCase().includes('antecedentes'))
  if (antecedentes.length) {
    const elementos = antecedentes.map((c) => elementoPersona(c, c.candidato.accion ?? `${dias(c.dias)} esperando`))
    const quedan = pendientesDe('antecedentes', elementos)
    cerrar({
      id: 'antecedentes',
      grupo: 'manual',
      titulo: `${quedan.length || antecedentes.length} ${plural(quedan.length || antecedentes.length, 'verificación de antecedentes pendiente', 'verificaciones de antecedentes pendientes')}`,
      resumen: antecedentes.map((c) => `${c.candidato.nombre}: ${c.candidato.accion?.toLowerCase() ?? 'pendiente'}`).join(' · '),
      datos: [{ termino: 'Personas', valor: String(quedan.length || antecedentes.length) }],
      como: 'Pídeles los documentos que faltan con el correo de «Solicitud de documentos», o ábrelas para registrar lo que ya llegó.',
      elementos,
      fila: { accion: 'escribir', etiqueta: 'Pedir documentos', hecho: 'Le escribiste', todas: (n) => `Pedírselos a ${plural(n, 'la persona', `las ${n}`)}` },
      otra: { accion: 'abrir', etiqueta: 'Abrir' },
      plantilla: 'documentos',
    })
  }

  // Los lotes con hojas por confirmar, del mismo registro que lee la vacante: confirmar baja la cifra y un lote subido en
  // la sesión aparece (IN-13).
  const lotes = vacantes.flatMap((vacante) =>
    almacenDeLotes
      .de(vacante)
      .map((lote) => ({ lote, dudosos: cuentasDe(lote).dudosos }))
      .filter(({ lote, dudosos }) => dudosos > 0 && lote.estado !== 'leyendo')
      .map<Elemento & { dudosos: number }>(({ lote, dudosos }) => ({
        id: lote.id,
        titulo: lote.nombre,
        detalle: `${vacante.titulo} · ${dudosos} por confirmar · ${lote.fecha}`,
        vacante,
        dudosos,
      })),
  )
  if (lotes.length) {
    const quedan = pendientesDe('hojas-dudosas', lotes)
    // Solo lo que sigue sin abrir: lo abierto ya no suma (IN-13).
    const total = (quedan.length ? quedan : lotes).reduce((suma, elemento) => suma + ((elemento as (typeof lotes)[number]).dudosos ?? 0), 0)
    cerrar({
      id: 'hojas-dudosas',
      grupo: 'manual',
      titulo: `${total} ${plural(total, 'CV importado por confirmar', 'CVs importados por confirmar')}`,
      resumen: `La IA no estuvo segura de algunos datos en ${quedan.length || lotes.length} ${plural(quedan.length || lotes.length, 'lote', 'lotes')}.`,
      datos: [
        { termino: 'Por confirmar', valor: String(total) },
        { termino: 'Lotes', valor: String(quedan.length || lotes.length) },
      ],
      como: 'Cada lote se abre directo en «CVs importados» de su vacante, con el CV al lado: solo lo dudoso. Al confirmarlas, la cifra baja.',
      elementos: lotes,
      fila: { accion: 'revisar-lote', etiqueta: 'Revisar', hecho: 'Abierto' },
    })
  }

  /* Sugerencias de la IA ----------------------------------------------------------------------------------------- */

  // Quien ya está en otro asunto no entra en una sugerencia (IN-12).
  const yaEnAsunto = new Set(asuntos.flatMap((asunto) => asunto.elementos.flatMap((elemento) => (elemento.persona ? [elemento.persona.id] : []))))
  const sugerir = (asunto: Omit<Asunto, 'pendientes' | 'grupo' | 'elementos' | 'datos' | 'como'> & { elemento: Elemento }) => {
    const { elemento, ...resto } = asunto
    cerrar({ ...resto, grupo: 'ia', elementos: [elemento], datos: [], como: '' })
  }

  // A quien cumple todo y espera: de las mejores de su vacante, y se puede ir. Una sola, la que más lleva; si se
  // descarta, entra la siguiente (IN-52), como pasa al aplicar «Pasarla».
  const escribir = esperan
    .filter((c) => cumpleTodo(c) && !esDeSerena(c) && c.dias >= DIAS_SIN_REVISAR && c.dias < DIAS_SE_PIERDE && !yaEnAsunto.has(c.id))
    .filter((c) => !descartadas.has(`ia-escribir:${c.id}`))
    .sort((a, b) => b.dias - a.dias)[0]
  if (escribir) {
    sugerir({
      id: `ia-escribir:${escribir.id}`,
      titulo: `Escríbele a ${escribir.candidato.nombre}`,
      resumen: `Cumple los ${escribir.criterios.length} requisitos de ${escribir.vacante.titulo} y lleva ${dias(escribir.dias)} sin respuesta.`,
      porque: `Es de las que mejor encajan en ${escribir.vacante.titulo} y nadie le ha respondido: si sigue esperando, la puedes perder con otra oferta.`,
      sugerencia: { tipo: 'escribir', persona: escribir },
      elemento: elementoPersona(escribir),
      plantilla: 'sigue',
    })
  }

  // A quien cumple todo y no tiene nada pendiente, a la siguiente etapa (nunca a la oferta: esa decisión es del equipo).
  enProceso
    .filter((c) => cumpleTodo(c) && !ESPERA_RESPUESTA(c) && !movidas.has(c.id) && !yaEnAsunto.has(c.id) && !descartadas.has(`ia-mover:${c.id}`))
    .map((c) => ({ c, hacia: siguienteEtapaDe(c.vacante.etapas, c.etapa) }))
    .filter((par): par is { c: Candidatura; hacia: string } => Boolean(par.hacia) && !esUltimaEtapa(par.c.vacante.etapas, par.hacia ?? ''))
    .sort((a, b) => b.c.dias - a.c.dias)
    .slice(0, 2)
    .forEach(({ c, hacia }) => {
      const ia = etapaDe(c.vacante.etapas, hacia)?.ia
      sugerir({
        id: `ia-mover:${c.id}`,
        titulo: `Pasa a ${c.candidato.nombre} a «${tituloEtapa(hacia)}»`,
        resumen: `Cumple los ${c.criterios.length} requisitos de ${c.vacante.titulo} y no tiene nada pendiente.`,
        porque: `Cumple todo lo que pide ${c.vacante.titulo}, no tiene nada pendiente y lleva ${dias(c.dias)} en «${tituloEtapa(c.etapa)}». La siguiente etapa es «${tituloEtapa(hacia)}»${ia ? ', con IA: al pasarla le llega la invitación y se reservan sus créditos' : ''}.`,
        sugerencia: { tipo: 'mover', persona: c, hacia },
        elemento: elementoPersona(c, `${dias(c.dias)} en la etapa`),
      })
    })

  // Una etapa que se llena: la IA lee primero y dice a quién mirar.
  vacantes.forEach((vacante) => {
    const enCv = enProceso.filter((c) => c.vacante.id === vacante.id && c.etapa === 'cv' && !movidas.has(c.id))
    if (enCv.length < VOLUMEN_ETAPA || descartadas.has(`ia-lectura:${vacante.id}`)) return
    sugerir({
      id: `ia-lectura:${vacante.id}`,
      titulo: `Deja que la IA lea los ${enCv.length} CVs de ${vacante.titulo}`,
      resumen: `Se acumulan en «${tituloEtapa('cv')}»; te digo a quién mirar primero.`,
      porque: `${vacante.titulo} recibió ${vacante.ultimaSemana} aplicaciones esta semana y ${enCv.length} siguen en «${tituloEtapa('cv')}». Las leo, las comparo con los requisitos y te dejo arriba a las que cumplen.`,
      sugerencia: { tipo: 'lectura', vacante, etapa: 'cv', cuantos: enCv.length },
      elemento: { id: vacante.id, titulo: vacante.titulo, detalle: `${enCv.length} en «${tituloEtapa('cv')}»`, vacante },
    })
  })

  return asuntos
}

// Las que cumplen todo de una etapa: lo que la lectura de la IA deja arriba.
export const cumplenEn = (vacante: VacanteUI, etapa: string) => CANDIDATURAS.filter((c) => c.vacante.id === vacante.id && c.etapa === etapa && cumpleTodo(c)).length

// Para el panel: la etiqueta de «hecho» de una fila (la de «Dejarla así» si se dejó a propósito).
export const hechoDe = (asunto: Asunto, clave: string, hechos: ReadonlySet<string>) =>
  hechos.has(claveAsi(clave)) ? (asunto.otra?.hecho ?? 'Se queda así') : (asunto.fila?.hecho ?? 'Hecho')
