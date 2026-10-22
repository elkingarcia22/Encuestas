import { useMemo, useSyncExternalStore } from 'react'
import { fechaSinAnio, isoHaceDias, plural } from '@/modules/design-system/patrones/formato'
import { CANDIDATURAS, esUltimaEtapa, tituloEtapa, type Candidatura, type EtapaVacante, type Rechazada } from './datos'
import { simulado } from './simular'

// Mover o cambiar de etapa: las reglas de lo que pasa alrededor (25 sep, Nicolás: «hazlos todos en las 3
// exploraciones, esfuérzate»). La ventana (`dialogo-mover.tsx`) y el proceso (`use-proceso.tsx`) las leen de aquí para
// decir lo mismo en la bandeja de la 1, el pipeline de la 2, la revisión de la 3 y el tablero de las tres.
//
// 1. **Saltarse etapas**: ir de Evaluación CV a Para revisión sin la entrevista de IA. Se avisa qué queda sin hacer, y
//    en el historial esas etapas dicen «Se saltó».
// 2. **Volver a una etapa anterior**: conserva lo que ya hizo. Si vuelve a una etapa de IA que ya presentó, se decide si
//    conserva el resultado o la repite (y solo entonces le llega una invitación nueva).
// 3. **Salir de una entrevista de IA sin terminar** (sin abrir o a medias): se cancela y el enlace deja de servir.
// 4. **El rastro**: cada cambio queda en la pestaña «Etapas» de la ficha, con quién, cuándo, desde dónde y qué pasó.
// 5. **Por qué**: un comentario opcional para el equipo, que queda en ese rastro.
// 6. **Avisarle a la persona**: una plantilla que se puede ajustar. Sale con el aviso, así que «Deshacer» la frena.
// 7. **Vacante cerrada**: nadie cambia de etapa hasta reabrirla (en `use-proceso.tsx`).
// 8. **Varias con casos mezclados**: la ventana dice qué le pasa a cada una antes de confirmar.
// 9. **Cuando no se guarda**: una persona por vacante falla la primera vez, para ver el error y «Reintentar».
// 10. **Entrar a una etapa con IA** (13 oct, PM: «si yo muevo una persona a Serena, de una vez la estoy agendando… y no
//    hay vuelta atrás»): arrastrar sigue funcionando, pero antes se pregunta. Se elige entre que la IA le escriba (con lo
//    que cuesta en créditos) o solo moverla: queda ahí sin invitación, sin gastar, «Esperando acción», y la invitación
//    se le envía después desde su tarjeta o su ficha.

// Quien tiene la sesión abierta: la reclutadora de las vacantes de ejemplo.
export const QUIEN_MUEVE = 'Laura Martínez'

/* El registro de cambios ------------------------------------------------------------------------------------- */

export type Movimiento = {
  id: string
  // Sin tipo, un cambio de etapa. «rechazo» y «retiro» sacan a la persona del proceso (desde y hacia son la etapa donde
  // se quedó); «vuelve», volver a considerarla (desde la etapa donde se quedó hacia la que vuelve).
  // «entra», que entró directo a una etapa (desde la base o por un lote): desde y hacia son esa etapa (VA-08).
  // «correo», que se le escribió sin moverla (desde la barra de varias o la ficha): desde y hacia son su etapa (VA-34).
  // «invita», que se le envió la invitación de su etapa con IA después de entrar sin ella: desde y hacia son esa etapa.
  tipo?: 'rechazo' | 'retiro' | 'vuelve' | 'entra' | 'correo' | 'invita'
  motivo?: string
  candidaturaId: string
  desde: string
  hacia: string
  // Cuándo (milisegundos) y cuántos días llevaba en la etapa de la que salió.
  cuando: number
  dias: number
  quien: string
  comentario?: string
  // Las etapas que se saltó al avanzar.
  saltadas: string[]
  // Al entrar a una etapa de IA: le llegó la invitación, se le pidió repetirla o conservó la que ya tenía.
  // `en-espera`: entró a una etapa con IA con la vacante en borrador; la invitación sale al publicar (VA-45).
  // `sin-invitar`: se eligió «Solo moverla»; está en la etapa sin invitación y no gastó créditos.
  ia?: 'invitada' | 'reinvitada' | 'conservada' | 'en-espera' | 'sin-invitar'
  // La invitación esperó al borrador y salió cuando se publicó la vacante (VA-45).
  alPublicar?: boolean
  // Al salir de una etapa de IA sin terminar la entrevista: se canceló.
  cancelada?: { etapa: string; respondidas?: number; total?: number }
  // La plantilla del correo que se le escribió, si se le escribió.
  aviso?: string
  // Se aprobó a propuesta de Orbit, con la razón que dio (OF-55): queda en su historial.
  porAgente?: string
}

// Lo que se movió en la sesión, fuera de las pantallas: la ficha lo lee aunque la haya abierto otra exploración, y
// «Deshacer» lo borra.
let registro: Movimiento[] = []
const oyentes = new Set<() => void>()
const avisar = () => oyentes.forEach((oyente) => oyente())

export const registroDeMovimientos = {
  leer: () => registro,
  suscribir: (oyente: () => void) => {
    oyentes.add(oyente)
    return () => {
      oyentes.delete(oyente)
    }
  },
  agregar: (nuevos: Movimiento[]) => {
    registro = [...registro, ...nuevos]
    avisar()
  },
  quitar: (ids: string[]) => {
    registro = registro.filter((movimiento) => !ids.includes(movimiento.id))
    avisar()
  },
}

// Quien entra directo a una etapa que no es la primera (desde la base o por un lote) queda con su entrada en el
// historial: qué etapas se saltó y, si la etapa es de IA, que se le envió la invitación (VA-08). En un borrador la
// invitación espera a que se publique la vacante (VA-45).
export function entradasA(candidaturas: Candidatura[], etapas: EtapaVacante[], quien = QUIEN_MUEVE, enBorrador = false): Movimiento[] {
  const cuando = Date.now()
  return candidaturas.flatMap((c) => {
    const indice = indiceDe(etapas, c.etapa)
    if (indice <= 0) return []
    const etapa = etapas[indice]
    return [
      {
        id: `${c.id}=entra@${cuando}`,
        tipo: 'entra' as const,
        candidaturaId: c.id,
        desde: c.etapa,
        hacia: c.etapa,
        cuando,
        dias: 0,
        quien,
        saltadas: etapas.slice(0, indice).map((una) => una.id),
        ia: etapa.ia ? (enBorrador ? ('en-espera' as const) : ('invitada' as const)) : undefined,
      },
    ]
  })
}

// Quien espera la invitación de una etapa con IA porque la vacante está en borrador (VA-45).
const esperanEn = (vacanteId: string) =>
  registro.filter((movimiento) => movimiento.ia === 'en-espera' && movimiento.candidaturaId.endsWith(`@${vacanteId}`))

// Cuántas invitaciones salen al publicar el borrador y a qué etapa: la ventana de publicar lo dice antes de confirmar.
export function esperasDe(vacanteId: string): { personas: number; etapa: string } | null {
  const esperan = esperanEn(vacanteId)
  return esperan.length ? { personas: new Set(esperan.map((movimiento) => movimiento.candidaturaId)).size, etapa: tituloEtapa(esperan[0].hacia) } : null
}

// Al publicar un borrador salen las invitaciones que esperaban (VA-45): quien está en una etapa con IA la recibe ahora y
// su historial lo dice. Deshacer la publicación las vuelve a dejar esperando. `soltadas` son esas invitaciones, ya
// salidas: quien publica aparta con ellas los créditos (`invitaciones.ts`).
export function soltarEsperas(vacanteId: string): { personas: number; etapa: string; soltadas: Movimiento[]; deshacer: () => void } | null {
  const cuantas = esperasDe(vacanteId)
  if (!cuantas) return null
  const ids = new Set(esperanEn(vacanteId).map((movimiento) => movimiento.id))
  registro = registro.map((movimiento) => (ids.has(movimiento.id) ? { ...movimiento, ia: 'invitada' as const, alPublicar: true } : movimiento))
  avisar()
  return {
    ...cuantas,
    soltadas: registro.filter((movimiento) => ids.has(movimiento.id)),
    deshacer: () => {
      registro = registro.map((movimiento) => (ids.has(movimiento.id) ? { ...movimiento, ia: 'en-espera' as const, alPublicar: undefined } : movimiento))
      avisar()
    },
  }
}

// La hora de un cambio. Solo se llama desde lo que hace la persona (confirmar una ventana, reintentar), nunca al pintar.
export const marcaDeTiempo = () => Date.now()

export const movimientosDe = (candidaturaId: string) => registro.filter((movimiento) => movimiento.candidaturaId === candidaturaId)

// Si una candidatura sigue en proceso según lo que pasó en la sesión (la ficha no dice «También está en…» de una
// vacante donde ya se la rechazó).
export function sigueEnProceso(candidaturaId: string) {
  const suyos = movimientosDe(candidaturaId)
  const ultimo = suyos[suyos.length - 1]
  return !ultimo || (ultimo.tipo !== 'rechazo' && ultimo.tipo !== 'retiro')
}

// Todos los movimientos de la visita (el agente los lee para responder por fechas: OF-11).
export const useTodosLosMovimientos = () => useSyncExternalStore(registroDeMovimientos.suscribir, registroDeMovimientos.leer)

export function useMovimientos(candidaturaId: string) {
  const todos = useSyncExternalStore(registroDeMovimientos.suscribir, registroDeMovimientos.leer)
  return useMemo(() => todos.filter((movimiento) => movimiento.candidaturaId === candidaturaId), [todos, candidaturaId])
}

/* La entrevista con la IA ------------------------------------------------------------------------------------ */

export type EstadoEntrevista =
  | { tipo: 'hecha'; puntaje: number }
  | { tipo: 'a-medias'; respondidas: number; total: number }
  | { tipo: 'sin-abrir'; dias: number }

const semilla = (texto: string) => [...texto].reduce((h, letra) => (h * 31 + letra.charCodeAt(0)) % 2_147_483_647, 7)

// Cuántas preguntas tiene la entrevista de la vacante: las que respondió quien ya la presentó.
const preguntasDe = (vacanteId: string) =>
  Math.max(3, ...CANDIDATURAS.filter((c) => c.vacante.id === vacanteId).map((c) => c.candidato.respuestas.length))

const indiceDe = (etapas: EtapaVacante[], id: string) => etapas.findIndex((etapa) => etapa.id === id)

// Dónde estaba la persona antes de que se moviera en esta sesión.
const etapaInicial = (candidatura: Candidatura, movimientos: Movimiento[]) => movimientos[0]?.desde ?? candidatura.etapa

// Cómo va la entrevista de IA de una etapa. `null` si la etapa no es de IA o si la persona no tiene nada ahí.
// - Con puntaje, está **hecha** (salvo que se le haya pedido repetirla).
// - Donde está hoy y sin puntaje: si espera que la agende, la invitación está **sin abrir**; si no, va **a medias**.
export function entrevistaDe(
  candidatura: Candidatura,
  etapa: EtapaVacante,
  etapas: EtapaVacante[],
  movimientos: Movimiento[],
): EstadoEntrevista | null {
  if (!etapa.ia) return null
  // Lo último que pasó con la IA al entrar (o la invitación enviada después): un correo a mano no lo cambia.
  const entradas = movimientos.filter((movimiento) => movimiento.hacia === etapa.id && movimiento.ia)
  const ultimaEntrada = entradas[entradas.length - 1]
  const estaAqui = candidatura.etapa === etapa.id
  // En un borrador la invitación todavía no sale, y con «Solo moverla» no salió: no hay entrevista que mostrar ni que
  // cancelar (VA-45).
  if (ultimaEntrada?.ia === 'en-espera' || ultimaEntrada?.ia === 'sin-invitar') return null
  // Entró en la sesión con invitación: la tiene sin abrir.
  if (ultimaEntrada && (ultimaEntrada.ia === 'invitada' || ultimaEntrada.ia === 'reinvitada')) return estaAqui ? { tipo: 'sin-abrir', dias: 0 } : null
  // Si se canceló al moverla, no hay entrevista que conservar.
  if (movimientos.some((movimiento) => movimiento.cancelada?.etapa === etapa.id)) return null

  // Quien entró por un lote no hizo las entrevistas de antes de su etapa de entrada.
  // Quien entró por un lote o desde la base tampoco: no se inventan resultados de etapas que se saltó (VA-08).
  const pasoAntes =
    !candidatura.importada && !candidatura.postulada && indiceDe(etapas, etapa.id) < indiceDe(etapas, etapaInicial(candidatura, movimientos))
  const puntaje =
    etapa.id === 'serena' ? candidatura.candidato.serena : pasoAntes ? 60 + (semilla(`${candidatura.id}|${etapa.id}`) % 35) : undefined
  if (puntaje !== undefined) return { tipo: 'hecha', puntaje }
  if (!estaAqui) return null
  if (candidatura.candidato.accion) return { tipo: 'sin-abrir', dias: candidatura.dias }
  const total = preguntasDe(candidatura.vacante.id)
  return { tipo: 'a-medias', respondidas: 1 + (semilla(candidatura.id) % (total - 1)), total }
}

/* Lo que pasa al mover -------------------------------------------------------------------------------------- */

export type Consecuencias = {
  atras: boolean
  // Las etapas que se salta, sin haberlas hecho.
  saltadas: EtapaVacante[]
  // La etapa de IA que deja sin terminar la entrevista: se cancela.
  deja?: { etapa: EtapaVacante; entrevista: Exclude<EstadoEntrevista, { tipo: 'hecha' }> }
  // La etapa de IA a la que entra; si ya la hizo, con su puntaje (y hay que decidir si la repite).
  entra?: { etapa: EtapaVacante; hecha?: number }
  // Lo que conserva al volver.
  conserva: string[]
  ultima: boolean
}

// Si ya pasó por una etapa: las de IA, si tienen resultado; las demás, si estuvo en ellas.
function pasoPor(candidatura: Candidatura, etapa: EtapaVacante, etapas: EtapaVacante[], movimientos: Movimiento[]) {
  if (etapa.ia) return entrevistaDe(candidatura, etapa, etapas, movimientos)?.tipo === 'hecha'
  if (movimientos.some((movimiento) => movimiento.desde === etapa.id)) return true
  if (movimientos.some((movimiento) => movimiento.saltadas.includes(etapa.id))) return false
  // Quien entró por un lote empezó donde se eligió al importar: lo de antes no lo hizo.
  if (candidatura.importada) return false
  return indiceDe(etapas, etapa.id) < indiceDe(etapas, etapaInicial(candidatura, movimientos))
}

// Lo que ya tiene de una etapa, dicho como se conserva.
function resultadoDe(candidatura: Candidatura, etapa: EtapaVacante, etapas: EtapaVacante[], movimientos: Movimiento[]): string[] {
  if (etapa.id === 'cv') return ['su evaluación del CV']
  const entrevista = entrevistaDe(candidatura, etapa, etapas, movimientos)
  if (entrevista?.tipo === 'hecha') return [`su entrevista con ${etapa.titulo} (${entrevista.puntaje}/100)`]
  return []
}

export function consecuenciasDe(candidatura: Candidatura, destino: string, etapas: EtapaVacante[], movimientos: Movimiento[]): Consecuencias {
  const desde = indiceDe(etapas, candidatura.etapa)
  const hasta = indiceDe(etapas, destino)
  const atras = hasta < desde
  const actual = etapas[desde]
  const suya = actual ? entrevistaDe(candidatura, actual, etapas, movimientos) : null
  const llegada = etapas[hasta]
  const previa = llegada?.ia ? entrevistaDe(candidatura, llegada, etapas, movimientos) : null
  return {
    atras,
    saltadas: atras || desde < 0 ? [] : etapas.slice(desde + 1, hasta).filter((etapa) => !pasoPor(candidatura, etapa, etapas, movimientos)),
    deja: actual && suya && suya.tipo !== 'hecha' ? { etapa: actual, entrevista: suya } : undefined,
    entra: llegada?.ia ? { etapa: llegada, hecha: previa?.tipo === 'hecha' ? previa.puntaje : undefined } : undefined,
    conserva: atras ? etapas.slice(hasta, desde).flatMap((etapa) => resultadoDe(candidatura, etapa, etapas, movimientos)) : [],
    ultima: esUltimaEtapa(etapas, destino),
  }
}

// Si hay algo que decir o decidir antes de mover. Entrar a una etapa con IA siempre pregunta: le escribe a la persona y
// puede costar créditos (13 oct, PM: «todas las validaciones de movimiento estén presentes»). Lo demás (avanzar un paso
// a una etapa sin IA, arrastrar a la columna de al lado) se mueve en el acto y se deshace desde el aviso.
export const pideDecision = (pasa: Consecuencias) =>
  pasa.atras || pasa.saltadas.length > 0 || Boolean(pasa.deja) || pasa.ultima || Boolean(pasa.entra)

// La etapa con IA donde está sin invitación porque se eligió «Solo moverla»; `null` si no es el caso. Deja de estarlo
// cuando se le envía la invitación (`tipo: 'invita'`) o cuando sale de esa etapa.
export function sinInvitacionEn(candidatura: Candidatura, etapas: EtapaVacante[], movimientos: Movimiento[]) {
  const etapa = etapas.find((una) => una.id === candidatura.etapa)
  if (!etapa?.ia) return null
  const conIa = movimientos.filter((movimiento) => movimiento.hacia === etapa.id && movimiento.ia)
  return conIa[conIa.length - 1]?.ia === 'sin-invitar' ? etapa : null
}

export function useSinInvitacion(candidatura: Candidatura) {
  const suyos = useMovimientos(candidatura.id)
  return sinInvitacionEn(candidatura, candidatura.vacante.etapas, suyos)
}

// Lo que espera del equipo quien entró sin invitación: va en `accion`, así cuenta como «Esperando acción» en el
// tablero, sus pestañas y su ficha.
export const accionSinInvitacion = (etapa: string) => `Enviarle la invitación a ${etapa}`

/* Cuando no se guarda ---------------------------------------------------------------------------------------- */

// Una persona por vacante (la primera de su lista) no se deja mover la primera vez: el cambio «no se guarda», se dice
// por qué y se reintenta. La segunda vez pasa.
const FALLAN = new Set([
  'mateo-salazar@analista-de-datos',
  'tomas-restrepo@disenadora-de-producto',
  'oscar-guerrero@coordinador-de-turno',
  'alejandro-alvarez-desarrollador-backend-1@desarrollador-backend',
])
const yaFallaron = new Set<string>()

// Con `?simular=falla-mover`, a cualquiera le falla el primer intento (para QA).
export function fallaAlMover(candidaturaId: string) {
  if ((!FALLAN.has(candidaturaId) && !simulado('falla-mover')) || yaFallaron.has(candidaturaId)) return false
  yaFallaron.add(candidaturaId)
  return true
}

/* Avisarle a la persona --------------------------------------------------------------------------------------- */

export type PlantillaMover = { id: string; titulo: string; texto: string }

export const PLANTILLAS_MOVER: PlantillaMover[] = [
  {
    id: 'sigue',
    titulo: 'Sigue en el proceso',
    texto: 'Hola {nombre}, gracias por tu tiempo. Tu proceso en {vacante} sigue: pasaste a la etapa «{etapa}». Pronto te escribimos con los siguientes pasos.',
  },
  {
    id: 'entrevista',
    titulo: 'Citación a entrevista',
    texto: 'Hola {nombre}, queremos conocerte para la vacante de {vacante}. Responde este correo con dos horarios que te queden bien esta semana.',
  },
  {
    id: 'documentos',
    titulo: 'Solicitud de documentos',
    texto: 'Hola {nombre}, para seguir con tu proceso en {vacante} necesitamos tu certificado laboral y tu documento de identidad. Puedes responder este correo con los archivos.',
  },
  {
    id: 'retoma',
    titulo: 'Retomamos una etapa',
    texto: 'Hola {nombre}, en tu proceso en {vacante} vamos a retomar la etapa «{etapa}». Pronto te contamos qué necesitamos de ti.',
  },
  {
    id: 'oferta',
    titulo: 'Oferta',
    texto: 'Hola {nombre}, ¡buenas noticias! Queremos hacerte una oferta para la vacante de {vacante}. Hoy te escribimos con los detalles.',
  },
]

// La plantilla que tiene sentido según a dónde va.
export function plantillaSugerida(destino: string, etapas: EtapaVacante[], atras: boolean) {
  if (atras) return 'retoma'
  if (esUltimaEtapa(etapas, destino)) return 'oferta'
  if (['antecedentes', 'medico', 'referencias'].includes(destino)) return 'documentos'
  if (['revision', 'equipo', 'tecnica', 'reto'].includes(destino)) return 'entrevista'
  return 'sigue'
}

/* El rastro: la pestaña «Etapas» ------------------------------------------------------------------------------ */

export type MarcaCambio = { texto: string; tono: 'aviso' | 'info' | 'neutro' }

export type CambioEtapa = {
  id: string
  titulo: string
  quien: string
  cuando: string
  marcas: MarcaCambio[]
  comentario?: string
  // Pasó en esta sesión (lo demás se reconstruye de dónde está la persona).
  ahora: boolean
  // Cuándo, para ordenarlo con el resto de lo que pasó con la persona (CA-49).
  ms?: number
}

const hora = (ms: number) => `Hoy, ${new Date(ms).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })}`

const listaY = (partes: string[]) => (partes.length > 1 ? `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}` : (partes[0] ?? ''))

export const nombreDeLista = listaY

// Lo que dice el historial de un movimiento de la sesión.
export function marcasDe(movimiento: Movimiento): MarcaCambio[] {
  const marcas: MarcaCambio[] = []
  if (movimiento.motivo) marcas.push({ texto: `Motivo: ${movimiento.motivo}`, tono: 'neutro' })
  if ((movimiento.tipo === 'rechazo' || movimiento.tipo === 'retiro') && !movimiento.aviso) marcas.push({ texto: 'Sin correo', tono: 'neutro' })
  if (movimiento.saltadas.length) marcas.push({ texto: `Se saltó ${listaY(movimiento.saltadas.map(tituloEtapa))}`, tono: 'aviso' })
  if (movimiento.cancelada)
    marcas.push({
      texto:
        movimiento.cancelada.respondidas !== undefined
          ? `Entrevista cancelada: respondió ${movimiento.cancelada.respondidas} de ${movimiento.cancelada.total}`
          : 'Invitación cancelada sin abrir',
      tono: 'aviso',
    })
  if (movimiento.ia === 'invitada' && movimiento.tipo !== 'invita')
    marcas.push({ texto: movimiento.alPublicar ? 'La invitación salió al publicar la vacante' : 'Se le envió la invitación', tono: 'info' })
  if (movimiento.ia === 'sin-invitar') marcas.push({ texto: 'Entró sin invitación: no usó créditos', tono: 'neutro' })
  if (movimiento.ia === 'en-espera') marcas.push({ texto: 'La invitación sale al publicar la vacante', tono: 'info' })
  if (movimiento.ia === 'reinvitada') marcas.push({ texto: 'Repite la entrevista', tono: 'info' })
  if (movimiento.ia === 'conservada') marcas.push({ texto: 'Conservó su entrevista', tono: 'neutro' })
  if (movimiento.aviso) marcas.push({ texto: `Se le escribió: ${movimiento.aviso}`, tono: 'info' })
  if (movimiento.porAgente) marcas.push({ texto: `Propuesta de Orbit: ${movimiento.porAgente}`, tono: 'info' })
  return marcas
}

// Todos los cambios de etapa de una persona en esta vacante, del más nuevo al más viejo: los de la sesión, y antes los
// que la trajeron hasta donde estaba (reconstruidos: la IA pasa el CV, Serena pasa a quien termina la entrevista y lo
// demás lo movió quien lleva la vacante).
// Cómo se dice cada cambio en el historial.
function tituloDe(movimiento: Movimiento, etapas: EtapaVacante[]) {
  if (movimiento.tipo === 'rechazo') return `Rechazada en ${tituloEtapa(movimiento.desde)}`
  if (movimiento.tipo === 'retiro') return `Se retiró en ${tituloEtapa(movimiento.desde)}`
  if (movimiento.tipo === 'vuelve') return `Volvió a considerarse: a ${tituloEtapa(movimiento.hacia)}`
  if (movimiento.tipo === 'entra') return `Entró a ${tituloEtapa(movimiento.hacia)}`
  if (movimiento.tipo === 'correo') return `Se le escribió en ${tituloEtapa(movimiento.hacia)}`
  if (movimiento.tipo === 'invita') return `Se le envió la invitación a ${tituloEtapa(movimiento.hacia)}`
  const volvio = indiceDe(etapas, movimiento.hacia) < indiceDe(etapas, movimiento.desde)
  return `${volvio ? 'Volvió' : 'Pasó'} de ${tituloEtapa(movimiento.desde)} a ${tituloEtapa(movimiento.hacia)}`
}

export function cambiosDeEtapa(
  candidatura: Candidatura,
  etapas: EtapaVacante[],
  movimientos: Movimiento[],
  // Un rechazo de antes de la sesión (sembrado): va en el historial aunque no esté en el registro.
  rechazo?: Rechazada & { deAntes: boolean },
): CambioEtapa[] {
  const deLaSesion = [...movimientos].reverse().map(
    (movimiento): CambioEtapa => ({
      id: movimiento.id,
      titulo: tituloDe(movimiento, etapas),
      quien: movimiento.quien === QUIEN_MUEVE ? 'Tú' : movimiento.quien,
      cuando: hora(movimiento.cuando),
      marcas: marcasDe(movimiento),
      comentario: movimiento.comentario,
      ahora: true,
      ms: movimiento.cuando,
    }),
  )

  // Entró por un lote de hojas de vida: no hay nada antes, y la entrada la hizo quien lo importó.
  if (candidatura.importada) {
    const { importada } = candidatura
    const entrada = etapaInicial(candidatura, movimientos)
    const saltadas = etapas.slice(0, Math.max(indiceDe(etapas, entrada), 0))
    const marcas: MarcaCambio[] = [
      { texto: `${importada.origen}${importada.referidoPor ? `: la refirió ${importada.referidoPor}` : ''}`, tono: 'neutro' },
      ...(saltadas.length ? [{ texto: `Se saltó ${listaY(saltadas.map((etapa) => etapa.titulo))}`, tono: 'aviso' as const }] : []),
      { texto: importada.confirmado ? 'Confirmaste un dato que la IA dudó' : 'La IA leyó su CV', tono: 'info' },
    ]
    return [
      ...deLaSesion,
      {
        id: 'entrada',
        titulo: `Entró a ${tituloEtapa(entrada)} con el lote «${importada.lote}»`,
        quien: importada.quien === QUIEN_MUEVE ? 'Tú' : importada.quien,
        cuando: hora(importada.cuando),
        marcas,
        ahora: true,
      },
    ]
  }

  const inicial = Math.max(0, indiceDe(etapas, etapaInicial(candidatura, movimientos)))
  const llego = movimientos[0]?.dias ?? candidatura.dias
  const azar = semilla(candidatura.id)
  // Hace cuántos días llegó a cada etapa, hacia atrás desde donde estaba.
  const haceDias = (indice: number) => llego + (inicial - indice) * 3 + ((azar >> indice) % 3)
  const antes: CambioEtapa[] = []
  for (let i = inicial; i >= 1; i -= 1) {
    const previa = etapas[i - 1]
    const etapa = etapas[i]
    const entrevista = previa.ia ? entrevistaDe(candidatura, previa, etapas, movimientos) : null
    const marcas: MarcaCambio[] = []
    if (previa.id === 'cv') marcas.push({ texto: 'Pasó el mínimo del CV', tono: 'neutro' })
    if (entrevista?.tipo === 'hecha') marcas.push({ texto: `Terminó la entrevista: ${entrevista.puntaje}/100`, tono: 'neutro' })
    if (etapa.ia) marcas.push({ texto: 'Se le envió la invitación', tono: 'info' })
    antes.push({
      id: `antes-${etapa.id}`,
      titulo: `Pasó de ${previa.titulo} a ${etapa.titulo}`,
      quien: previa.id === 'cv' ? 'La IA' : previa.ia ? `${previa.titulo}, al terminar` : candidatura.vacante.reclutador.nombre,
      cuando: fechaSinAnio(isoHaceDias(haceDias(i))),
      marcas,
      ahora: false,
    })
  }
  if (rechazo?.deAntes) {
    const retiro = rechazo.quien === 'candidato'
    antes.unshift({
      id: 'rechazo-antes',
      titulo: `${retiro ? 'Se retiró' : 'Rechazada'} en ${tituloEtapa(rechazo.candidatura.etapa)}`,
      quien: retiro ? 'Lo registró ' + candidatura.vacante.reclutador.nombre : candidatura.vacante.reclutador.nombre,
      cuando: fechaSinAnio(isoHaceDias(Math.max(0, candidatura.dias - 1))),
      marcas: [
        { texto: `Motivo: ${rechazo.motivo}`, tono: 'neutro' },
        rechazo.avisada ? { texto: 'Se le envió el correo de rechazo', tono: 'info' } : { texto: 'Sin correo', tono: 'neutro' },
      ],
      ahora: false,
    })
  }
  const { origen } = candidatura.candidato
  antes.push({
    id: 'entrada',
    titulo: `Entró a ${etapas[0]?.titulo ?? 'la vacante'}`,
    quien: origen === 'Agregado a mano' ? candidatura.vacante.reclutador.nombre : 'Aplicó por el portal de empleo',
    cuando: fechaSinAnio(isoHaceDias(haceDias(0))),
    marcas: [],
    ahora: false,
  })
  return [...deLaSesion, ...antes]
}

// El último cambio de la sesión, dicho en una línea para la ficha: «Llegó hoy a las 8:12 a. m. desde Evaluación CV ·
// la moviste tú».
export function ultimoCambio(movimientos: Movimiento[], etapas: EtapaVacante[]) {
  // Un correo o una invitación enviada después no son un cambio de etapa: la línea sigue diciendo cómo llegó.
  const cambios = movimientos.filter((movimiento) => movimiento.tipo !== 'correo' && movimiento.tipo !== 'invita')
  const ultimo = cambios[cambios.length - 1]
  if (!ultimo) return null
  const volvio = indiceDe(etapas, ultimo.hacia) < indiceDe(etapas, ultimo.desde)
  const alas = new Date(ultimo.cuando).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })
  const tu = ultimo.quien === QUIEN_MUEVE
  return {
    texto:
      ultimo.tipo === 'vuelve'
        ? `Volvió al proceso hoy a las ${alas}, a ${tituloEtapa(ultimo.hacia)} · ${tu ? 'la devolviste tú' : `la devolvió ${ultimo.quien}`}`
        : ultimo.tipo === 'rechazo' || ultimo.tipo === 'retiro'
          ? `${ultimo.tipo === 'retiro' ? 'Se retiró' : 'Rechazada'} hoy a las ${alas} en ${tituloEtapa(ultimo.desde)} · ${tu ? 'lo registraste tú' : `lo registró ${ultimo.quien}`}`
          : `${volvio ? 'Volvió' : 'Llegó'} hoy a las ${alas} desde ${tituloEtapa(ultimo.desde)} · ${tu ? 'la moviste tú' : `la movió ${ultimo.quien}`}`,
    marcas: marcasDe(ultimo),
    comentario: ultimo.comentario,
  }
}

export const personasTexto = (n: number) => plural(n, '1 persona', `${n} personas`)
