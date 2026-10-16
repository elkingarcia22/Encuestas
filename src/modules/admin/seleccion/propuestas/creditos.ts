import { useSyncExternalStore } from 'react'
import type { IconSvgElement } from '@hugeicons/react'
import { BubbleChatIcon, ClipboardIcon, FileValidationIcon, LanguageSkillIcon, SecurityCheckIcon, UserSearch01Icon } from '@hugeicons/core-free-icons'
import { generador } from '@/modules/design-system/patrones/formato'
import { CANDIDATURAS, VACANTES_UI } from './datos'
import { QUIEN_MUEVE } from './movimientos'
import { PERSONAS } from './personas'
import { simulado } from './simular'

// «Gestión de créditos de IA» de Selección (25 sep, Nicolás: tres exploraciones de «Créditos › Historial de créditos» y
// «Reasignar créditos por agente»). Reemplaza la decisión 10 del módulo («los créditos de IA, fuera del prototipo por
// ahora»). Aquí vive todo lo que las tres comparten: los agentes, la bolsa, el historial y el reparto, para que digan
// los mismos números y un reparto hecho en una se vea en las otras.
//
// Cómo se cuentan los créditos (lo que la pantalla de hoy no deja claro):
// - La empresa compra una bolsa. De ella, una parte se asigna a cada agente y el resto queda sin asignar.
// - De lo asignado a un agente, una parte ya se usó (se cobró), otra está reservada para procesos que ya empezaron
//   (se cobra al terminar; si el proceso se cae, vuelve) y lo que queda está libre.
// - Un agente cobra lo mismo cada vez que trabaja. Si lo libre no alcanza para una vez más, el agente se pausa y con él
//   el paso de todas las vacantes que lo usan.

// La maqueta vive el 25 de septiembre de 2026, a esta hora.
export const HOY = new Date('2026-09-25T20:45:00')

/* Los agentes ------------------------------------------------------------------------------------------------------ */

export type AgenteId = 'cv' | 'psicometrico' | 'serena' | 'antecedentes' | 'roleplay' | 'idiomas'

export type Agente = {
  id: AgenteId
  nombre: string
  // Qué hace, en una línea.
  descripcion: string
  // Lo que hizo, para las frases del historial: «Serena AI hizo una entrevista».
  hizo: string
  // Cómo se llama cada vez que trabaja: «1 entrevista», «4 entrevistas»; y una sola, con su artículo.
  uso: [singular: string, plural: string]
  unUso: string
  // Créditos por uso. Evaluación CV no cobra.
  costo: number
  // Serena AI es la entrevistadora con IA: su cara es el orbe. Los demás llevan el icono de lo que hacen.
  icono: IconSvgElement
  // Su tono en los gráficos: la escala de azules del tema (el tema no trae otros colores para gráficos).
  color: string
}

export const AGENTES: Agente[] = [
  {
    id: 'cv',
    nombre: 'Evaluación CV',
    descripcion: 'Lee cada CV que llega y lo compara con los requisitos de la vacante.',
    hizo: 'analizó un CV',
    uso: ['CV', 'CVs'],
    unUso: 'un análisis',
    costo: 0,
    icono: FileValidationIcon,
    color: 'var(--muted-foreground)',
  },
  {
    id: 'psicometrico',
    nombre: 'Psicométrico',
    descripcion: 'Aplica la prueba psicométrica y resume el perfil de la persona.',
    hizo: 'aplicó una prueba psicométrica',
    uso: ['prueba', 'pruebas'],
    unUso: 'una prueba',
    costo: 50,
    icono: ClipboardIcon,
    color: 'var(--chart-4)',
  },
  {
    id: 'serena',
    nombre: 'Serena AI',
    descripcion: 'Entrevista a cada persona por video y deja la evaluación con la evidencia.',
    hizo: 'hizo una entrevista',
    uso: ['entrevista', 'entrevistas'],
    unUso: 'una entrevista',
    costo: 130,
    icono: UserSearch01Icon,
    color: 'var(--chart-2)',
  },
  {
    id: 'antecedentes',
    nombre: 'Antecedentes judiciales',
    descripcion: 'Consulta los antecedentes en las fuentes oficiales.',
    hizo: 'consultó antecedentes',
    uso: ['consulta', 'consultas'],
    unUso: 'una consulta',
    costo: 50,
    icono: SecurityCheckIcon,
    color: 'var(--chart-5)',
  },
  {
    id: 'roleplay',
    nombre: 'Role Play',
    descripcion: 'Pone a la persona en una situación del cargo y evalúa cómo la resuelve.',
    hizo: 'hizo un roleplay',
    uso: ['roleplay', 'roleplays'],
    unUso: 'un roleplay',
    costo: 150,
    icono: BubbleChatIcon,
    color: 'var(--chart-3)',
  },
  {
    id: 'idiomas',
    nombre: 'Prueba de idiomas',
    descripcion: 'Evalúa el nivel del idioma que pide la vacante, hablado y escrito.',
    hizo: 'evaluó el idioma',
    uso: ['prueba', 'pruebas'],
    unUso: 'una prueba',
    costo: 150,
    icono: LanguageSkillIcon,
    color: 'var(--chart-1)',
  },
]

export const agenteDe = (id: AgenteId) => AGENTES.find((agente) => agente.id === id) ?? AGENTES[0]
// Los que cobran: los que se reparten.
export const AGENTES_CON_COSTO = AGENTES.filter((agente) => agente.costo > 0)

// Qué agente cobra en cada etapa. Una vacante usa un agente si tiene su etapa: se lee de las etapas reales de cada
// vacante (CI-01), así una vacante recién creada cuenta sola (CR-30). La prueba situacional la califica el mismo agente
// del role play.
const AGENTE_DE_ETAPA: Record<string, AgenteId> = {
  cv: 'cv',
  serena: 'serena',
  antecedentes: 'antecedentes',
  psicometrico: 'psicometrico',
  roleplay: 'roleplay',
  situacional: 'roleplay',
  idiomas: 'idiomas',
}
export const agenteDeEtapa = (etapaId: string): AgenteId | undefined => AGENTE_DE_ETAPA[etapaId]
const usa = (vacante: (typeof VACANTES_UI)[number], id: AgenteId) => vacante.etapas.some((etapa) => AGENTE_DE_ETAPA[etapa.id] === id)
// Las vacantes que se pausarían: las publicadas (un borrador o una cerrada no tienen proceso que parar).
export const vacantesQueUsan = (id: AgenteId) =>
  VACANTES_UI.filter((vacante) => usa(vacante, id) && vacante.estado === 'Publicada')

// Lo que cuesta pasar a N personas a una etapa con IA que cobra, y si lo libre de su agente alcanza (VA-09, IN-07,
// CR-11). `null` si la etapa no cobra. Con `?simular=sin-creditos`, no queda nada libre.
export function costoDeEtapa(etapaId: string, personas = 1) {
  const id = AGENTE_DE_ETAPA[etapaId]
  if (!id) return null
  const agente = agenteDe(id)
  if (!agente.costo) return null
  const estado = bolsaDe(historialCon(registroDeCreditos.leer())).porAgente.find((uno) => uno.agente.id === id)
  const libre = simulado('sin-creditos') ? 0 : (estado?.libre ?? 0)
  const total = agente.costo * personas
  return { agente, total, libre, alcanzaPara: Math.floor(libre / agente.costo), alcanza: libre >= total }
}

/* La bolsa y lo de cada agente ------------------------------------------------------------------------------------ */

// Lo comprado y lo repartido al empezar la sesión. Lo usado y lo reservado salen del historial, no se escriben a mano.
const COMPRAS = [
  { cuando: '2026-08-01T09:10:00', creditos: 20_000, detalle: 'Plan Empresa · bolsa inicial' },
  { cuando: '2026-09-10T11:32:00', creditos: 10_000, detalle: 'Recarga pedida por Laura Martínez' },
]
const REPARTOS_INICIALES: { cuando: string; cambios: Partial<Record<AgenteId, number>> }[] = [
  { cuando: '2026-08-01T09:25:00', cambios: { roleplay: 10_000, serena: 3_000, psicometrico: 970, antecedentes: 1_200 } },
  { cuando: '2026-09-10T11:40:00', cambios: { roleplay: 5_000, serena: 1_940, antecedentes: 400 } },
]

/* El historial ----------------------------------------------------------------------------------------------------- */

export type TipoMovimiento = 'consumo' | 'reserva' | 'devolucion' | 'compra' | 'reparto'

export type Movimiento = {
  id: string
  tipo: TipoMovimiento
  // ISO, hora local.
  cuando: string
  // Quién lo hizo: el agente (consumo, reserva, devolución), UBITS (compra) o la persona del equipo (reparto).
  quien: string
  // Consumo, reserva y devolución: de qué agente, en qué vacante y con quién.
  agente?: AgenteId
  vacanteId?: string
  persona?: { id: string; nombre: string }
  // Para la bolsa: + entra (compra), − sale (consumo). Una reserva no sale todavía y un reparto no cambia la bolsa.
  creditos: number
  // Reparto: cuánto ganó (+) o perdió (−) cada agente; lo que no se asignó queda en la bolsa.
  cambios?: Partial<Record<AgenteId, number>>
  // Una frase de por qué, cuando la hay: «La persona no llegó al roleplay», «Recarga del plan».
  detalle?: string
}

const iso = (fecha: Date) => {
  const dos = (n: number) => String(n).padStart(2, '0')
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}T${dos(fecha.getHours())}:${dos(fecha.getMinutes())}:00`
}

// Un momento entre `desde` y `hasta` días atrás, en horario de oficina, más seguido cerca de hoy si `reciente`.
function momento(azar: () => number, desde: number, hasta: number, reciente = false) {
  const t = reciente ? Math.pow(azar(), 1.8) : azar()
  const dias = hasta + (desde - hasta) * t
  const fecha = new Date(HOY)
  fecha.setDate(fecha.getDate() - Math.floor(dias))
  fecha.setHours(8 + Math.floor(azar() * 10), Math.floor(azar() * 60), 0, 0)
  // Hoy, nada después de ahora.
  if (fecha > HOY) fecha.setHours(HOY.getHours() - 1 - Math.floor(azar() * 8))
  return iso(fecha)
}

function construirHistorial(): Movimiento[] {
  const azar = generador(20260925)
  const lista: Movimiento[] = []
  let n = 0
  const id = (tipo: string) => `${tipo}-${++n}`
  // Personas de cerradas y de procesos que ya no están en la lista: nombres de la base global.
  const deLaBase = PERSONAS.filter((persona) => !CANDIDATURAS.some((c) => c.personaId === persona.id))
  const alguien = () => {
    const persona = deLaBase[Math.floor(azar() * deLaBase.length)]
    return { id: persona.id, nombre: persona.nombre }
  }
  const cerradas = VACANTES_UI.filter((vacante) => vacante.estado === 'Cerrada')
  const publicadasQueUsan = (agente: AgenteId) => vacantesQueUsan(agente)
  const deUna = <T>(lista: T[]) => lista[Math.floor(azar() * lista.length)]
  const consumo = (agente: AgenteId, vacanteId: string, persona: { id: string; nombre: string }, cuando: string, tipo: 'consumo' | 'reserva' = 'consumo') =>
    lista.push({
      id: id(tipo),
      tipo,
      cuando,
      quien: agenteDe(agente).nombre,
      agente,
      vacanteId,
      persona,
      creditos: tipo === 'reserva' ? 0 : -agenteDe(agente).costo,
    })

  COMPRAS.forEach((compra) => lista.push({ id: id('compra'), tipo: 'compra', cuando: compra.cuando, quien: 'UBITS', creditos: compra.creditos, detalle: compra.detalle }))
  REPARTOS_INICIALES.forEach((reparto) =>
    lista.push({ id: id('reparto'), tipo: 'reparto', cuando: reparto.cuando, quien: QUIEN_MUEVE, creditos: 0, cambios: reparto.cambios }),
  )

  // Evaluación CV: una por cada aplicación de cada vacante, gratis. Las de las cerradas, más atrás.
  for (const vacante of VACANTES_UI) {
    for (let i = 0; i < vacante.aplicaciones; i++) {
      const reciente = i < vacante.ultimaSemana
      consumo('cv', vacante.id, alguien(), vacante.estado === 'Cerrada' ? momento(azar, 55, 25) : reciente ? momento(azar, 7, 0, true) : momento(azar, 40, 7))
    }
  }

  // Serena AI: quienes ya pasaron su etapa, cobrados; quienes están en ella hoy, reservados. Más nueve de las cerradas.
  for (const c of CANDIDATURAS) {
    const persona = { id: c.personaId, nombre: c.candidato.nombre }
    if (c.etapa === 'serena') consumo('serena', c.vacante.id, persona, momento(azar, 5, 0, true), 'reserva')
    else if (c.etapa !== 'cv') consumo('serena', c.vacante.id, persona, momento(azar, 20, 2))
  }
  for (let i = 0; i < 9; i++) consumo('serena', deUna(cerradas).id, alguien(), momento(azar, 50, 25))

  // Antecedentes: quienes están en esa etapa hoy, reservados; dieciocho ya consultados, sobre todo de las cerradas.
  for (const c of CANDIDATURAS.filter((c) => c.etapa === 'antecedentes')) {
    consumo('antecedentes', c.vacante.id, { id: c.personaId, nombre: c.candidato.nombre }, momento(azar, 3, 0, true), 'reserva')
  }
  for (let i = 0; i < 18; i++) consumo('antecedentes', deUna(i < 13 ? cerradas : publicadasQueUsan('antecedentes')).id, alguien(), momento(azar, 50, 3))

  // Psicométrico: diecinueve pruebas, las últimas esta semana; se quedó sin cupo.
  for (let i = 0; i < 19; i++) consumo('psicometrico', deUna(publicadasQueUsan('psicometrico')).id, alguien(), momento(azar, 30, 0, i > 12))

  // Role Play: cincuenta y tres cobrados, cada vez más seguido, y diecinueve en curso. Dos se cayeron y volvieron.
  const deRolePlay = [...publicadasQueUsan('roleplay'), ...cerradas.filter((v) => usa(v, 'roleplay'))]
  // Los de las cerradas, de cuando estaban abiertas (hace más de 25 días).
  for (let i = 0; i < 53; i++) {
    const vacante = deUna(deRolePlay)
    consumo('roleplay', vacante.id, alguien(), vacante.estado === 'Cerrada' ? momento(azar, 55, 25) : momento(azar, 50, 0, true))
  }
  for (let i = 0; i < 19; i++) consumo('roleplay', deUna(publicadasQueUsan('roleplay')).id, alguien(), momento(azar, 6, 0, true), 'reserva')
  for (let i = 0; i < 2; i++) {
    lista.push({
      id: id('devolucion'),
      tipo: 'devolucion',
      cuando: momento(azar, 12, 1),
      quien: 'Role Play',
      agente: 'roleplay',
      vacanteId: deUna(publicadasQueUsan('roleplay')).id,
      persona: alguien(),
      creditos: 0,
      detalle: i ? 'Se canceló el proceso antes del roleplay' : 'La persona no llegó al roleplay',
    })
  }

  return lista.sort((a, b) => b.cuando.localeCompare(a.cuando))
}

const HISTORIAL_BASE = construirHistorial()

/* Lo que cambia en la sesión: los repartos ------------------------------------------------------------------------ */

let repartos: Movimiento[] = []
const oyentes = new Set<() => void>()
const avisar = () => oyentes.forEach((oyente) => oyente())

export const registroDeCreditos = {
  leer: () => repartos,
  suscribir: (oyente: () => void) => {
    oyentes.add(oyente)
    return () => {
      oyentes.delete(oyente)
    }
  },
  // Guarda un reparto (cuánto gana o pierde cada agente) y devuelve cómo deshacerlo.
  repartir(cambios: Partial<Record<AgenteId, number>>, detalle?: string) {
    const limpio = Object.fromEntries(Object.entries(cambios).filter(([, delta]) => delta)) as Partial<Record<AgenteId, number>>
    if (!Object.keys(limpio).length) return () => {}
    const movimiento: Movimiento = {
      id: `reparto-sesion-${Date.now()}`,
      tipo: 'reparto',
      cuando: iso(new Date(HOY.getTime() + (repartos.length + 1) * 60_000)),
      quien: QUIEN_MUEVE,
      creditos: 0,
      cambios: limpio,
      detalle,
    }
    repartos = [movimiento, ...repartos]
    avisar()
    return () => {
      repartos = repartos.filter((uno) => uno.id !== movimiento.id)
      avisar()
    }
  },
}

export const useRepartos = () => useSyncExternalStore(registroDeCreditos.suscribir, registroDeCreditos.leer)

/* Comprar sin pasar por el ejecutivo (8 oct, VP de producto) ------------------------------------------------------- */

// Con Stripe, la empresa compra créditos sueltos cuando los necesita, sin contrato ni anexo: salen más caros que en el
// paquete del plan, entran al momento y se pueden recargar solos. El paquete grande se sigue negociando con el
// ejecutivo de UBITS en la renovación (con los datos de cuánto se compró por fuera). Maqueta: no hay cobro de verdad.
export const PRECIO_SUELTO = 0.12
export const PRECIO_PLAN = 0.1
export const PAQUETES_SUELTOS = [1_000, 2_500, 5_000, 10_000]
// «US$1.200» y «US$0,12»: en dólares, pero con los separadores del español.
export const dolares = (valor: number) => {
  // A centavos primero: 10.000 × 0,12 da 1200.0000000000002 y saldría con decimales.
  const n = Math.round(valor * 100) / 100
  const decimales = Number.isInteger(n) ? 0 : 2
  return `US$${n.toLocaleString('es-CO', { minimumFractionDigits: decimales, maximumFractionDigits: decimales })}`
}

export const registroDeCompras = {
  // Entra una compra a la bolsa (queda sin asignar) y devuelve cómo deshacerla.
  comprar(cantidad: number, detalle: string) {
    const movimiento: Movimiento = {
      id: `compra-sesion-${Date.now()}`,
      tipo: 'compra',
      cuando: iso(new Date(HOY.getTime() + (repartos.length + 1) * 60_000)),
      quien: 'Stripe',
      creditos: cantidad,
      detalle,
    }
    repartos = [movimiento, ...repartos]
    avisar()
    return () => {
      repartos = repartos.filter((uno) => uno.id !== movimiento.id)
      avisar()
    }
  },
}

// La recarga automática: cuando la bolsa baja de `umbral` libres, compra `cantidad` con la misma tarjeta.
export type RecargaAutomatica = { umbral: number; cantidad: number } | null
let recarga: RecargaAutomatica = null
const oyentesRecarga = new Set<() => void>()
export const registroDeRecarga = {
  leer: () => recarga,
  poner(nueva: RecargaAutomatica) {
    recarga = nueva
    oyentesRecarga.forEach((oyente) => oyente())
  },
  suscribir: (oyente: () => void) => {
    oyentesRecarga.add(oyente)
    return () => {
      oyentesRecarga.delete(oyente)
    }
  },
}
export const useRecarga = () => useSyncExternalStore(registroDeRecarga.suscribir, registroDeRecarga.leer)

// Todo el historial, lo más reciente primero: el de siempre más los repartos de la sesión.
// Con `?simular=vacio` la empresa todavía no compra créditos: no hay historia, solo lo que se haga en la sesión.
export const historialCon = (sesion: Movimiento[]) => (simulado('vacio') ? sesion : [...sesion, ...HISTORIAL_BASE])
export const useHistorial = () => historialCon(useRepartos())

/* El estado: lo que se calcula del historial ---------------------------------------------------------------------- */

export type EstadoAgente = {
  agente: Agente
  asignado: number
  usado: number
  reservado: number
  // Lo que queda para trabajar: asignado − usado − reservado.
  libre: number
  // Cuántas veces más puede trabajar con lo libre.
  usos: number
  // Lo mínimo que se le puede dejar al repartir: lo usado y lo reservado no se pueden quitar.
  minimo: number
  // Usos por día en las últimas dos semanas (cobrados y reservados).
  ritmo: number
  // En cuántos días se le acaba lo libre a ese ritmo (null: no trabaja o es gratis).
  diasRestantes: number | null
  // Cuántas veces trabajó en total.
  vecesUsado: number
  // Cómo está, para la insignia y el orden de lo urgente.
  situacion: 'gratis' | 'sin-cupo' | 'pronto' | 'al-dia' | 'sin-uso'
  // Las vacantes publicadas que dependen de él (se pausan si queda sin cupo).
  vacantes: typeof VACANTES_UI
}

export type Bolsa = {
  comprado: number
  asignado: number
  sinAsignar: number
  usado: number
  reservado: number
  // Lo que queda de la bolsa: comprado − usado.
  disponible: number
  porAgente: EstadoAgente[]
}

const DIAS_RITMO = 14
// «Se agota pronto»: menos de una semana al ritmo de las últimas dos.
export const DIAS_PRONTO = 7

export function bolsaDe(historial: Movimiento[], asignacionExtra: Partial<Record<AgenteId, number>> = {}): Bolsa {
  const desdeRitmo = new Date(HOY)
  desdeRitmo.setDate(desdeRitmo.getDate() - DIAS_RITMO)
  const desde = iso(desdeRitmo)
  const comprado = historial.reduce((suma, m) => suma + (m.tipo === 'compra' ? m.creditos : 0), 0)
  const repartido = (id: AgenteId) =>
    historial.reduce((suma, m) => suma + (m.tipo === 'reparto' ? (m.cambios?.[id] ?? 0) : 0), 0) + (asignacionExtra[id] ?? 0)

  // Con `?simular=sin-creditos` se gastó el último crédito: lo que quedaba sin asignar se lo llevó Serena AI (el agente
  // que más se usa) y cada agente con costo gastó todo lo suyo, también lo que tenía reservado.
  const agotada = simulado('sin-creditos')
  const sobrante = agotada ? Math.max(0, comprado - AGENTES_CON_COSTO.reduce((suma, agente) => suma + repartido(agente.id), 0)) : 0

  const porAgente = AGENTES.map((agente): EstadoAgente => {
    const suyos = historial.filter((m) => m.agente === agente.id)
    const asignado = repartido(agente.id) + (agente.id === 'serena' ? sobrante : 0)
    const cobrados = suyos.filter((m) => m.tipo === 'consumo').length
    const reservas = suyos.filter((m) => m.tipo === 'reserva').length
    const usado = agotada && agente.costo ? asignado : cobrados * agente.costo
    const reservado = agotada ? 0 : reservas * agente.costo
    const libre = Math.max(0, asignado - usado - reservado)
    const recientes = suyos.filter((m) => (m.tipo === 'consumo' || m.tipo === 'reserva') && m.cuando >= desde).length
    const ritmo = recientes / DIAS_RITMO
    const usos = agente.costo ? Math.floor(libre / agente.costo) : Infinity
    const diasRestantes = !agente.costo || !ritmo ? null : Math.floor(usos / ritmo)
    const vacantes = vacantesQueUsan(agente.id)
    const situacion: EstadoAgente['situacion'] = !agente.costo
      ? 'gratis'
      : usos === 0
        ? 'sin-cupo'
        : diasRestantes !== null && diasRestantes < DIAS_PRONTO
          ? 'pronto'
          : ritmo
            ? 'al-dia'
            : 'sin-uso'
    return {
      agente,
      asignado,
      usado,
      reservado,
      libre,
      usos,
      minimo: usado + reservado,
      ritmo,
      diasRestantes,
      vecesUsado: cobrados,
      situacion,
      vacantes,
    }
  })

  const conCosto = porAgente.filter((uno) => uno.agente.costo)
  const asignado = conCosto.reduce((suma, uno) => suma + uno.asignado, 0)
  const usado = conCosto.reduce((suma, uno) => suma + uno.usado, 0)
  const reservado = conCosto.reduce((suma, uno) => suma + uno.reservado, 0)
  return { comprado, asignado, sinAsignar: comprado - asignado, usado, reservado, disponible: comprado - usado, porAgente }
}

export const useBolsa = () => bolsaDe(useHistorial())

// Lo que necesita atención primero: sin cupo, después lo que se agota pronto (lo más urgente arriba), luego el resto.
const ORDEN_SITUACION: Record<EstadoAgente['situacion'], number> = { 'sin-cupo': 0, pronto: 1, 'al-dia': 2, 'sin-uso': 3, gratis: 4 }
export const porUrgencia = (lista: EstadoAgente[]) =>
  [...lista].sort((a, b) => ORDEN_SITUACION[a.situacion] - ORDEN_SITUACION[b.situacion] || (a.diasRestantes ?? 999) - (b.diasRestantes ?? 999))

/* Cubrir dos semanas: lo que le falta a un agente --------------------------------------------------------------- */

// El atajo «Cubrir dos semanas» del cajón de reasignar y la sugerencia de la IA del tablero de atención (5 oct) reparten
// con la misma regla.

// Cuántos días cubre el atajo.
export const DIAS_ATAJO = 14
// Un agente sin ritmo (nadie lo ha usado) recibe al menos esto con el atajo: para que la vacante pausada arranque.
export const USOS_MINIMOS = 5

// Lo que le queda a un agente con un valor asignado: usos libres y días que le alcanzan a su ritmo.
export function efecto(estado: EstadoAgente, valor: number) {
  const usos = Math.max(0, Math.floor((valor - estado.minimo) / estado.agente.costo))
  const dias = estado.ritmo ? Math.floor(usos / estado.ritmo) : null
  return { usos, dias }
}

// «menos de un día», «un día», «unos 12 días»
export const duracion = (dias: number) => (dias === 0 ? 'menos de un día' : dias === 1 ? 'un día' : `unos ${dias} días`)

// Lo que necesita un agente para cubrir `DIAS_ATAJO` días (o `USOS_MINIMOS` usos si nadie lo usa todavía).
export function paraDosSemanas(estado: EstadoAgente) {
  const usos = Math.max(USOS_MINIMOS, Math.ceil(estado.ritmo * DIAS_ATAJO))
  return estado.minimo + usos * estado.agente.costo
}

/* Repartir: revisar un reparto antes de guardarlo ----------------------------------------------------------------- */

export type RevisionReparto = {
  // Lo que queda sin asignar con el reparto nuevo (negativo: se pasa de la bolsa).
  sinAsignar: number
  // Cuánto cambia cada agente (+ gana, − pierde).
  cambios: Partial<Record<AgenteId, number>>
  hayCambios: boolean
  // Lo que impide guardar.
  errores: { agente?: AgenteId; texto: string }[]
  // Lo que se puede guardar, pero conviene saber (quién queda sin cupo y qué se pausa).
  avisos: { agente: AgenteId; texto: string }[]
}

// `nuevo`: lo que quedaría asignado a cada agente que cobra.
export function revisarReparto(bolsa: Bolsa, nuevo: Partial<Record<AgenteId, number>>): RevisionReparto {
  const cambios: Partial<Record<AgenteId, number>> = {}
  const errores: RevisionReparto['errores'] = []
  const avisos: RevisionReparto['avisos'] = []
  let asignado = 0
  for (const estado of bolsa.porAgente.filter((uno) => uno.agente.costo)) {
    const { agente } = estado
    const valor = nuevo[agente.id] ?? estado.asignado
    asignado += valor
    if (valor !== estado.asignado) cambios[agente.id] = valor - estado.asignado
    if (valor < estado.minimo) {
      errores.push({
        agente: agente.id,
        texto: estado.reservado
          ? `No puede bajar de ${creditos(estado.minimo)}: ${creditos(estado.usado)} ya se usaron y ${creditos(estado.reservado)} están reservados para ${usosTexto(agente, estado.reservado / agente.costo)} en curso.`
          : `No puede bajar de ${creditos(estado.minimo)}: ya se usaron.`,
      })
      continue
    }
    const usos = Math.floor((valor - estado.minimo) / agente.costo)
    if (usos === 0 && estado.vacantes.length) {
      const donde = estado.vacantes.length === 1 ? `«${estado.vacantes[0].titulo}»` : `${estado.vacantes.length} vacantes`
      avisos.push({
        agente: agente.id,
        texto:
          valor === estado.asignado
            ? `Sigue sin cupo: está pausado en ${donde}.`
            : `Queda sin cupo: se pausa en ${donde} hasta que tenga créditos.`,
      })
    }
  }
  const sinAsignar = bolsa.comprado - asignado
  if (sinAsignar < 0) errores.push({ texto: `Te pasas de la bolsa por ${creditos(-sinAsignar)}. Quítale a otro agente o pide una recarga.` })
  return { sinAsignar, cambios, hayCambios: Object.keys(cambios).length > 0, errores, avisos }
}

/* Cómo se dicen ---------------------------------------------------------------------------------------------------- */

const NUMERO = new Intl.NumberFormat('es-CO')
// 18.450
export const creditos = (n: number) => NUMERO.format(n)
// «+1.200», «−130», «0»
export const conSigno = (n: number) => (n > 0 ? `+${NUMERO.format(n)}` : n < 0 ? `−${NUMERO.format(-n)}` : '0')
// «1 entrevista», «4 entrevistas»
export const usosTexto = (agente: Agente, n: number) => `${NUMERO.format(n)} ${n === 1 ? agente.uso[0] : agente.uso[1]}`

const HORA = new Intl.DateTimeFormat('es-CO', { hour: 'numeric', minute: '2-digit' })
const DIA = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
const DIA_CORTO = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' })
const aFecha = (texto: string) => new Date(texto)
const mismoDia = (a: Date, b: Date) => a.toDateString() === b.toDateString()
const ayerDe = (fecha: Date) => {
  const ayer = new Date(fecha)
  ayer.setDate(ayer.getDate() - 1)
  return ayer
}
export const horaDe = (texto: string) => HORA.format(aFecha(texto))
// «Hoy», «Ayer», «martes, 22 de septiembre»
export function diaDe(texto: string) {
  const fecha = aFecha(texto)
  if (mismoDia(fecha, HOY)) return 'Hoy'
  if (mismoDia(fecha, ayerDe(HOY))) return 'Ayer'
  const dia = DIA.format(fecha)
  return dia.charAt(0).toUpperCase() + dia.slice(1)
}
// «Hoy, 8:42 p. m.», «Ayer, 6:00 p. m.», «22 sept., 4:00 p. m.»
export function cuandoTexto(texto: string) {
  const fecha = aFecha(texto)
  const dia = mismoDia(fecha, HOY) ? 'Hoy' : mismoDia(fecha, ayerDe(HOY)) ? 'Ayer' : DIA_CORTO.format(fecha)
  return `${dia}, ${HORA.format(fecha)}`
}
// Días entre la fecha y hoy (0 = hoy).
export const diasAtras = (texto: string) => Math.floor((HOY.getTime() - aFecha(texto).getTime()) / 86_400_000)

// Lo que se ve en el historial: «Serena AI hizo una entrevista», «Laura Martínez repartió créditos».
export function fraseDe(movimiento: Movimiento) {
  const agente = movimiento.agente ? agenteDe(movimiento.agente) : null
  if (movimiento.tipo === 'compra') return movimiento.quien === 'Stripe' ? 'Compraste créditos con tarjeta' : 'Entraron créditos a la bolsa'
  if (movimiento.tipo === 'reparto') return `${movimiento.quien.split(' ')[0]} repartió créditos`
  if (movimiento.tipo === 'reserva') return `${agente?.nombre} reservó ${agente?.unUso}`
  if (movimiento.tipo === 'devolucion') return `Volvieron a ${agente?.nombre} los créditos de ${agente?.unUso}`
  return `${agente?.nombre} ${agente?.hizo}`
}

export const vacanteDe = (id?: string) => VACANTES_UI.find((vacante) => vacante.id === id)

// La serie semanal de lo cobrado por agente (las últimas `semanas`, de la más vieja a hoy), para los gráficos.
export function consumoPorSemana(historial: Movimiento[], semanas = 8) {
  return Array.from({ length: semanas }, (_, indice) => {
    const fin = new Date(HOY)
    fin.setDate(fin.getDate() - (semanas - 1 - indice) * 7)
    const inicio = new Date(fin)
    inicio.setDate(inicio.getDate() - 7)
    const [desde, hasta] = [iso(inicio), iso(fin)]
    const fila: Record<string, number | string> = { semana: DIA_CORTO.format(fin) }
    for (const agente of AGENTES_CON_COSTO) {
      fila[agente.id] = historial.filter((m) => m.agente === agente.id && m.tipo === 'consumo' && m.cuando > desde && m.cuando <= hasta).length * agente.costo
    }
    return fila
  })
}
