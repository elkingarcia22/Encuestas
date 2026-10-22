import { useSyncExternalStore } from 'react'
import { plural, fechaCorta } from '@/modules/design-system/patrones/formato'
import type { VacanteUI } from '../../../propuestas/datos'
import type { Grupo } from '@/modules/design-system/metricas/grupos-atencion'
import {
  DIAS_ATAJO,
  HOY,
  USOS_MINIMOS,
  consumoPorSemana,
  creditos,
  efecto,
  paraDosSemanas,
  porUrgencia,
  usosTexto,
  type AgenteId,
  type Bolsa,
  type EstadoAgente,
  type Movimiento,
} from '../../../propuestas/creditos'

// Lo que necesita tu atención en Créditos (5 oct, Nicolás: «lo de créditos también debería tener el mismo tipo de
// tablero que manejamos para vacantes»). Reemplaza el aviso amarillo «3 agentes necesitan créditos». Todo sale de la
// bolsa y del historial; nada inventado. De lo más grave a lo menos:
//
// Críticas — ya hay algo parado:
// - `sin-cupo:<agente>`: un agente sin créditos para trabajar una vez más, con vacantes publicadas que lo usan: está en
//   pausa en ellas.
//
// Necesitan atención — se va a parar pronto o algo cambió:
// - `pronto:<agente>`: se agota en menos de `DIAS_PRONTO` días a su ritmo; si se acaba, se pausa en sus vacantes.
// - `bolsa`: lo libre de la bolsa (sin asignar más lo libre en los agentes) alcanza para menos de DIAS_BOLSA días al
//   gasto de las últimas dos semanas. Hay que pedir la recarga antes.
// - `pico:<agente>`: un agente gastó esta semana PICO veces o más lo de la anterior (y al menos MINIMO_PICO créditos).
//
// Acción manual:
// - `sin-asignar`: hay créditos en la bolsa sin agente mientras algún agente los necesita. Repartirlos es un paso tuyo.
//
// Sugerencias de la IA:
// - `ia-cubrir`: repartir de lo sin asignar lo que le falta a cada agente para dos semanas (la regla del atajo del cajón
//   de reasignar). Solo si lo sin asignar alcanza.

export const DIAS_BOLSA = 30
const PICO = 2
const MINIMO_PICO = 500

export type AsuntoCredito = {
  id: string
  grupo: Grupo
  titulo: string
  resumen: string
  // «Qué está pasando»: los datos que lo explican.
  datos: { termino: string; valor: string }[]
  // «Cómo resolverlo».
  como: string
  // El agente del asunto y lo que se le da con un clic para que le alcancen dos semanas (si lo sin asignar alcanza).
  agente?: EstadoAgente
  darle?: number
  // Las vacantes que se pueden abrir desde el panel.
  vacantes?: VacanteUI[]
  // Lo que va en el pie del panel.
  pie: { reasignar?: boolean; pedir?: boolean; revisado?: boolean }
  // La sugerencia de la IA: el reparto que propone, el botón y por qué.
  reparto?: { cambios: Partial<Record<AgenteId, number>>; total: number; nombres: string }
  etiqueta?: string
  porque?: string
}

/* Cómo se dicen -------------------------------------------------------------------------------------------------- */

// «25 sept 2026» con la utilidad de fechas del sistema (13-oct: antes era «25 de septiembre»).
const fechaDe = (dia: Date) => fechaCorta(dia.toLocaleDateString('en-CA'))

// «Analista de datos» · «Analista de datos» y «Analista de nómina» · 4 vacantes
export function nombresDe(vacantes: readonly VacanteUI[]) {
  if (vacantes.length === 1) return `«${vacantes[0].titulo}»`
  if (vacantes.length === 2) return `«${vacantes[0].titulo}» y «${vacantes[1].titulo}»`
  return `${vacantes.length} ${plural(vacantes.length, 'vacante', 'vacantes')}`
}

// «Psicométrico» · «Psicométrico y Serena AI» · «Psicométrico, Prueba de idiomas y Serena AI»
export function enLista(nombres: string[]) {
  if (nombres.length <= 1) return nombres.join('')
  return `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`
}

const seAgota = (dias: number) => (dias === 0 ? 'se agota hoy' : dias === 1 ? 'se agota mañana' : `se agota en ${dias} días`)

const porSemana = (estado: EstadoAgente) =>
  estado.ritmo ? `Unas ${usosTexto(estado.agente, Math.max(1, Math.round(estado.ritmo * 7)))} por semana` : 'Nadie lo ha usado todavía'

// Lo que se le da a un agente para dos semanas, y para cuánto le alcanza con eso.
function paraElAgente(estado: EstadoAgente, sinAsignar: number) {
  const falta = Math.max(0, paraDosSemanas(estado) - estado.asignado)
  const despues = efecto(estado, estado.asignado + falta)
  const alcanza = `${usosTexto(estado.agente, despues.usos)}${estado.ritmo ? ', unas dos semanas a su ritmo' : ''}`
  return { falta, alcanza, cabe: falta > 0 && falta <= sinAsignar }
}

/* Los asuntos ---------------------------------------------------------------------------------------------------- */

export function asuntosCreditos({
  bolsa,
  historial,
  hechos,
  descartadas,
}: {
  bolsa: Bolsa
  historial: Movimiento[]
  hechos: ReadonlySet<string>
  descartadas: ReadonlySet<string>
}): AsuntoCredito[] {
  const asuntos: AsuntoCredito[] = []
  const conCosto = porUrgencia(bolsa.porAgente.filter((uno) => uno.agente.costo))
  const sinAsignar = bolsa.sinAsignar
  const dineroSuelto = `Dale créditos de los ${creditos(sinAsignar)} sin asignar`

  // Críticas: en pausa.
  const enPausa = conCosto.filter((uno) => uno.situacion === 'sin-cupo' && uno.vacantes.length)
  for (const estado of enPausa) {
    const { agente, asignado, usado, libre, vacantes } = estado
    const dar = paraElAgente(estado, sinAsignar)
    asuntos.push({
      id: `sin-cupo:${agente.id}`,
      grupo: 'critico',
      titulo: `${agente.nombre} se quedó sin créditos`,
      resumen: asignado
        ? `Le quedan ${creditos(libre)} y cada ${agente.uso[0]} cuesta ${creditos(agente.costo)}. Está en pausa en ${nombresDe(vacantes)}.`
        : `No tiene créditos asignados. Está en pausa en ${nombresDe(vacantes)}.`,
      datos: [
        { termino: 'Asignados', valor: creditos(asignado) },
        { termino: 'Usados', valor: creditos(usado) },
        { termino: 'Le quedan', valor: `${creditos(libre)} · cada ${agente.uso[0]} cuesta ${creditos(agente.costo)}` },
        { termino: 'A su ritmo', valor: porSemana(estado) },
        { termino: 'En pausa', valor: vacantes.map((vacante) => vacante.titulo).join(' · ') },
      ],
      como: dar.cabe
        ? `${dineroSuelto}: con ${creditos(dar.falta)} le alcanza para ${dar.alcanza}, y ${plural(vacantes.length, 'la vacante vuelve', 'las vacantes vuelven')} a andar.`
        : `Lo sin asignar (${creditos(sinAsignar)}) no alcanza: quítale créditos a otro agente o pide una recarga.`,
      agente: estado,
      darle: dar.cabe ? dar.falta : undefined,
      vacantes,
      pie: { reasignar: true },
    })
  }

  // Necesitan atención: se agota pronto.
  for (const estado of conCosto.filter((uno) => uno.situacion === 'pronto' && uno.diasRestantes !== null)) {
    const { agente, libre, usos, reservado, vacantes } = estado
    const dias = estado.diasRestantes ?? 0
    const dar = paraElAgente(estado, sinAsignar)
    asuntos.push({
      id: `pronto:${agente.id}`,
      grupo: 'atencion',
      titulo: `${agente.nombre} ${seAgota(dias)}`,
      resumen: `Le alcanza para ${usosTexto(agente, usos)} más. Si se acaba, se pausa en ${nombresDe(vacantes)}.`,
      datos: [
        { termino: 'Le quedan', valor: `${creditos(libre)} · ${usosTexto(agente, usos)}` },
        { termino: 'Reservados', valor: reservado ? `${creditos(reservado)} · ${usosTexto(agente, reservado / agente.costo)} en curso` : 'Ninguno' },
        { termino: 'A su ritmo', valor: porSemana(estado) },
        { termino: 'Lo usan', valor: plural(vacantes.length, '1 vacante', `${vacantes.length} vacantes`) },
      ],
      como: dar.cabe
        ? `${dineroSuelto}: con ${creditos(dar.falta)} le alcanza para ${dar.alcanza}.`
        : `Lo sin asignar (${creditos(sinAsignar)}) no alcanza: quítale créditos a otro agente o pide una recarga.`,
      agente: estado,
      darle: dar.cabe ? dar.falta : undefined,
      pie: { reasignar: true },
    })
  }

  // Necesitan atención: la bolsa se acaba.
  const libres = sinAsignar + conCosto.reduce((suma, uno) => suma + uno.libre, 0)
  const gastoDia = conCosto.reduce((suma, uno) => suma + uno.ritmo * uno.agente.costo, 0)
  const diasBolsa = gastoDia ? Math.floor(libres / gastoDia) : null
  if (diasBolsa !== null && diasBolsa < DIAS_BOLSA) {
    const fin = new Date(HOY)
    fin.setDate(fin.getDate() + diasBolsa)
    const gasto = Math.round(gastoDia / 10) * 10
    asuntos.push({
      id: 'bolsa',
      grupo: 'atencion',
      titulo: `La bolsa alcanza para unos ${diasBolsa} días`,
      resumen: `Se gastan unos ${creditos(gasto)} créditos al día: a ese ritmo se acaba hacia el ${fechaDe(fin)}.`,
      datos: [
        { termino: 'Libres', valor: `${creditos(libres)} · sin asignar y en los agentes` },
        { termino: 'Reservados', valor: `${creditos(bolsa.reservado)} · ya comprometidos` },
        { termino: 'Gasto por día', valor: `Unos ${creditos(gasto)} · últimas dos semanas` },
        { termino: 'Se acaba hacia', valor: `El ${fechaDe(fin)}` },
      ],
      como: 'Compra créditos antes de esa fecha (con tarjeta, entran al momento) o prende la recarga automática: si la bolsa se vacía, todos los agentes se pausan.',
      pie: { pedir: true, revisado: true },
    })
  }

  // Necesitan atención: un agente que se disparó esta semana.
  const semanas = consumoPorSemana(historial)
  const [anterior, actual] = semanas.slice(-2)
  if (anterior && actual) {
    for (const estado of conCosto) {
      const { agente } = estado
      // Cada semana trae su etiqueta («25 de sept») y lo cobrado por agente.
      const ahora = Number(actual[agente.id] ?? 0)
      const antes = Number(anterior[agente.id] ?? 0)
      if (!antes || ahora < MINIMO_PICO || ahora < antes * PICO) continue
      const veces = Math.floor(ahora / antes)
      asuntos.push({
        id: `pico:${agente.id}`,
        grupo: 'atencion',
        titulo: `${agente.nombre} gastó ${veces} veces más que la semana anterior`,
        resumen: `${creditos(ahora)} créditos esta semana frente a ${creditos(antes)} la anterior. Lo usan ${nombresDe(estado.vacantes)}.`,
        datos: [
          { termino: 'Esta semana', valor: creditos(ahora) },
          { termino: 'La anterior', valor: creditos(antes) },
          {
            termino: 'Le alcanza para',
            valor: `${usosTexto(agente, estado.usos)}${estado.diasRestantes !== null ? ` · unos ${estado.diasRestantes} días` : ''}`,
          },
          { termino: 'Lo usan', valor: plural(estado.vacantes.length, '1 vacante', `${estado.vacantes.length} vacantes`) },
        ],
        como: 'Mira en qué vacantes se está usando: si una etapa con este agente se abrió a mucha gente, conviene filtrar antes de que llegue a él.',
        vacantes: estado.vacantes,
        pie: { revisado: true },
      })
    }
  }

  // Acción manual: créditos quietos mientras alguien los necesita.
  const necesitan = conCosto.filter((uno) => (uno.situacion === 'sin-cupo' && uno.vacantes.length) || uno.situacion === 'pronto')
  if (sinAsignar > 0 && necesitan.length) {
    asuntos.push({
      id: 'sin-asignar',
      grupo: 'manual',
      titulo: `${creditos(sinAsignar)} créditos sin asignar`,
      resumen: `Están en la bolsa, pero ningún agente puede usarlos hasta que los repartas. ${plural(necesitan.length, '1 agente los necesita', `${necesitan.length} agentes los necesitan`)}.`,
      datos: [
        { termino: 'Sin asignar', valor: creditos(sinAsignar) },
        { termino: 'Comprados', valor: creditos(bolsa.comprado) },
        { termino: 'Los necesitan', valor: enLista(necesitan.map((uno) => uno.agente.nombre)) },
      ],
      como: 'Repártelos entre los agentes: el cajón te muestra para cuánto le alcanza a cada uno con el número nuevo.',
      pie: { reasignar: true, revisado: true },
    })
  }

  // Sugerencias de la IA: cubrir dos semanas a los que se quedan cortos.
  const cortos = conCosto.filter((uno) => uno.vacantes.length && (efecto(uno, uno.asignado).dias ?? 0) < DIAS_ATAJO)
  const cambios = Object.fromEntries(
    cortos.map((uno) => [uno.agente.id, Math.max(0, paraDosSemanas(uno) - uno.asignado)]).filter(([, falta]) => Number(falta) > 0),
  ) as Partial<Record<AgenteId, number>>
  const total = Object.values(cambios).reduce<number>((suma, falta) => suma + (falta ?? 0), 0)
  if (total > 0 && total <= sinAsignar) {
    const reciben = cortos.filter((uno) => cambios[uno.agente.id])
    const nombres = enLista(reciben.map((uno) => uno.agente.nombre))
    const sinRitmo = reciben.filter((uno) => !uno.ritmo)
    const enRiesgo = reciben.filter((uno) => uno.situacion === 'sin-cupo' || uno.situacion === 'pronto').length
    asuntos.push({
      id: 'ia-cubrir',
      grupo: 'ia',
      titulo: `Cubrir dos semanas a ${plural(reciben.length, '1 agente', `${reciben.length} agentes`)}`,
      resumen: `Repartir ${creditos(total)} de los ${creditos(sinAsignar)} sin asignar entre ${nombres}.`,
      // «Qué cambia»: cuánto recibe cada uno y para cuánto le alcanza con eso.
      datos: reciben.map((uno) => {
        const recibe = cambios[uno.agente.id] ?? 0
        return { termino: uno.agente.nombre, valor: `+${creditos(recibe)} · ${usosTexto(uno.agente, efecto(uno, uno.asignado + recibe).usos)}` }
      }),
      como: '',
      pie: {},
      reparto: { cambios, total, nombres },
      etiqueta: `Repartir ${creditos(total)}`,
      porque:
        `${plural(enRiesgo, 'Un agente está', `${enRiesgo} agentes están`)} en pausa o a punto de agotarse, y hay ${creditos(sinAsignar)} créditos quietos en la bolsa. ` +
        `Con ${creditos(total)} a ${nombres} les alcanzan dos semanas a su ritmo` +
        (sinRitmo.length ? ` (a ${enLista(sinRitmo.map((uno) => uno.agente.nombre))}, que nadie ha usado, ${USOS_MINIMOS} ${sinRitmo[0].agente.uso[1]})` : '') +
        `, y quedan ${creditos(sinAsignar - total)} sin asignar para lo que venga.`,
    })
  }

  return asuntos.filter((asunto) => !hechos.has(asunto.id) && !descartadas.has(asunto.id))
}

/* Lo resuelto en la sesión ---------------------------------------------------------------------------------------- */

// «Ya lo revisé», «Pedir más créditos» y las sugerencias descartadas. Lo que se resuelve repartiendo no hace falta
// marcarlo: el asunto sale solo porque la bolsa cambió. Vive fuera de la pantalla, como el del inicio de Vacantes: si se
// sale y se vuelve, lo resuelto sigue resuelto.
type EstadoAtencion = { hechos: ReadonlySet<string>; descartadas: ReadonlySet<string> }

let estado: EstadoAtencion = { hechos: new Set(), descartadas: new Set() }
const oyentes = new Set<() => void>()
const cambiar = (siguiente: Partial<EstadoAtencion>) => {
  estado = { ...estado, ...siguiente }
  oyentes.forEach((oyente) => oyente())
}

export const atencionCreditos = {
  leer: () => estado,
  suscribir: (oyente: () => void) => {
    oyentes.add(oyente)
    return () => {
      oyentes.delete(oyente)
    }
  },
  // Devuelven cómo deshacerlo: el aviso trae «Deshacer».
  marcar: (id: string) => {
    cambiar({ hechos: new Set([...estado.hechos, id]) })
    return () => cambiar({ hechos: new Set([...estado.hechos].filter((otro) => otro !== id)) })
  },
  descartar: (id: string) => {
    cambiar({ descartadas: new Set([...estado.descartadas, id]) })
    return () => cambiar({ descartadas: new Set([...estado.descartadas].filter((otra) => otra !== id)) })
  },
}

export const useAtencionCreditos = () => useSyncExternalStore(atencionCreditos.suscribir, atencionCreditos.leer)
