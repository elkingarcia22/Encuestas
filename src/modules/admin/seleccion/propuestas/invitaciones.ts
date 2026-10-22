import { notifyAction } from '@/shared/components/notify'
import { baseDeCandidatos } from './base'
import { costoDeEtapa, creditos, registroDeCreditos, type Invitada } from './creditos'
import { tituloEtapa, type Candidatura, type EtapaVacante } from './datos'
import { QUIEN_MUEVE, registroDeMovimientos, type Movimiento } from './movimientos'
import { noSeGuardo } from './simular'

// Las invitaciones de las etapas con IA y sus créditos (13 oct, PM: «esto tiene implicaciones directas en el consumo de
// créditos… en este producto tiene que haber una traza»). Lo leen el tablero y la ficha de la vacante (`use-proceso`),
// Mis candidatos (`use-base`), los lotes de CVs y la publicación de un borrador, para que todos aparten y devuelvan
// igual:
// - cada invitación que sale aparta lo de una vez en su agente (en Créditos, «Serena AI reservó una entrevista»);
// - si la entrevista se cancela sin terminar, lo apartado en esta visita vuelve;
// - si no alcanza lo libre del agente, quien no alcance entra sin invitación y queda «Esperando acción»;
// - quien entró sin invitación la recibe después, con lo que cuesta a la vista.
// Sin componentes aquí, para que el recargado en caliente siga funcionando.

// `persona@vacante`: de ahí salen la persona y la vacante de una candidatura.
const partes = (candidaturaId: string) => {
  const [personaId, vacanteId] = candidaturaId.split('@')
  return { personaId, vacanteId }
}

const invitadaDe = (movimiento: Movimiento, nombre?: string): Invitada => {
  const { personaId, vacanteId } = partes(movimiento.candidaturaId)
  return {
    candidaturaId: movimiento.candidaturaId,
    etapaId: movimiento.hacia,
    vacanteId,
    persona: { id: personaId, nombre: nombre ?? baseDeCandidatos.deId(personaId)?.nombre ?? personaId },
  }
}

// Las invitaciones que salen de verdad (no las que esperan a que se publique un borrador).
const saleInvitacion = (movimiento: Movimiento) => movimiento.ia === 'invitada' || movimiento.ia === 'reinvitada'

// Lo que mueve en créditos un grupo de cambios ya registrados: aparta lo de cada invitación que sale y devuelve lo de
// cada entrevista con IA que se canceló. Devuelve cómo deshacerlo, para el «Deshacer» del aviso.
export function creditosDeCambios(nuevos: Movimiento[], nombres: Map<string, string> = new Map()) {
  const deshacerReserva = registroDeCreditos.reservar(
    nuevos.filter(saleInvitacion).map((movimiento) => invitadaDe(movimiento, nombres.get(movimiento.candidaturaId))),
  )
  const deshacerDevoluciones = nuevos
    .filter((movimiento) => movimiento.cancelada)
    .map((movimiento) =>
      registroDeCreditos.devolver(
        movimiento.candidaturaId,
        movimiento.cancelada!.etapa,
        movimiento.cancelada!.respondidas !== undefined ? 'Se canceló la entrevista sin terminar' : 'Se canceló la invitación sin abrirse',
      ),
    )
  return () => {
    deshacerReserva()
    deshacerDevoluciones.forEach((deshacer) => deshacer())
  }
}

// Cuántas invitaciones alcanzan con lo libre de cada agente, contando una a una: las primeras entran con invitación y
// las demás sin ella (VA-09: «quien no alcance queda en la etapa esperando, sin invitación, hasta que haya créditos»).
export function cupoDeInvitaciones() {
  const cupo = new Map<string, number>()
  return (etapaId: string) => {
    if (!cupo.has(etapaId)) cupo.set(etapaId, costoDeEtapa(etapaId)?.alcanzaPara ?? Number.POSITIVE_INFINITY)
    const queda = cupo.get(etapaId)!
    if (queda <= 0) return false
    cupo.set(etapaId, queda - 1)
    return true
  }
}

// La línea de créditos del aviso: «130 créditos reservados de Serena AI».
export function textoReserva(nuevos: Movimiento[]) {
  const salen = nuevos.filter(saleInvitacion)
  const costo = salen.length ? costoDeEtapa(salen[0].hacia, salen.length) : null
  return costo ? `${creditos(costo.total)} créditos reservados de ${costo.agente.nombre}.` : ''
}

// Enviar la invitación a quien entró sin ella («Solo moverla» o porque no alcanzaban los créditos). Queda en su historial
// («Se le envió la invitación a Serena AI»), aparta los créditos y el aviso trae «Deshacer», que lo devuelve todo.
// En un borrador la invitación espera a que se publique, como al moverla (VA-45).
export function enviarInvitacion(
  candidatura: Candidatura,
  etapa: EtapaVacante,
  { borrador, alEnviar, alDeshacer }: { borrador: boolean; alEnviar?: () => void; alDeshacer?: () => void },
) {
  const nombre = candidatura.candidato.nombre.split(' ')[0]
  if (noSeGuardo(`invitar:${candidatura.id}`, `No pudimos invitar a ${nombre}`, () => enviarInvitacion(candidatura, etapa, { borrador, alEnviar, alDeshacer }), 'No salió ninguna invitación.'))
    return
  const movimiento: Movimiento = {
    id: `${candidatura.id}+invita@${Date.now()}`,
    tipo: 'invita',
    candidaturaId: candidatura.id,
    desde: etapa.id,
    hacia: etapa.id,
    cuando: Date.now(),
    dias: candidatura.dias,
    quien: QUIEN_MUEVE,
    saltadas: [],
    ia: borrador ? 'en-espera' : 'invitada',
  }
  registroDeMovimientos.agregar([movimiento])
  const deshacerCreditos = creditosDeCambios([movimiento], new Map([[candidatura.id, candidatura.candidato.nombre]]))
  alEnviar?.()
  notifyAction(
    `Invitaste a ${nombre} a ${tituloEtapa(etapa.id)}`,
    borrador ? 'La invitación sale cuando publiques la vacante.' : `Le llega en unos segundos. ${textoReserva([movimiento])}`.trim(),
    {
      label: 'Deshacer',
      onClick: () => {
        registroDeMovimientos.quitar([movimiento.id])
        deshacerCreditos()
        alDeshacer?.()
      },
    },
    'success',
  )
}
