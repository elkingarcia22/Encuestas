import { useEffect, useMemo, useRef, useState } from 'react'
import { notify, notifyAction } from '@/shared/components/notify'
import { CANDIDATURAS, RECHAZADAS, esUltimaEtapa, tituloEtapa, type Candidatura, type Rechazada, type VacanteUI } from '../datos'
import {
  QUIEN_MUEVE,
  accionSinInvitacion,
  consecuenciasDe,
  entradasA,
  entrevistaDe,
  fallaAlMover,
  marcaDeTiempo,
  movimientosDe,
  nombreDeLista,
  personasTexto,
  pideDecision,
  registroDeMovimientos,
  sinInvitacionEn,
  type Consecuencias,
  type Movimiento,
} from '../movimientos'
import { creditosDeCambios, cupoDeInvitaciones, enviarInvitacion, textoReserva } from '../invitaciones'
import { DialogoInvitar } from './invitar-a-etapa'
import { fallaAlGuardar, otraLaMovioAntes } from '../simular'
import { DialogoMover, type Cambio, type DecisionMover, type PedidoMover } from './dialogo-mover'
import { PLANTILLAS_RECHAZO, fallaAlRechazar, plantillaDeRechazo, quienDe } from '../rechazos'
import { conCorrecciones, conRequisitosCorregidos, useCorrecciones, useRequisitosCorregidos } from '../correcciones'
import { registroDeImportadas, type EventoImportadas } from '../importacion'
import { anotarProcesos, marcarContratadas, registroDePostuladas, type EventoPostuladas } from '../base'
import { permisoEn } from '../permisos'
import { diasDesdeQueAplico } from '../perfil-candidato'
import { DialogoReconsiderar, type DecisionReconsiderar } from './dialogo-reconsiderar'
import { DialogoConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { DialogoRechazo, type DecisionRechazo, type PedidoRechazo } from './dialogo-rechazo'
import { avisoDeError } from '../simular'

// El proceso de una vacante, con todo lo que le pasa a la gente dentro: moverla de etapa, rechazarla, devolverla y
// sumar a alguien. Lo comparten las tres exploraciones (la lista de la 1, la tabla de la 2, la revisión de la 3 y el
// tablero de las tres), para que mover a alguien se vea y se deshaga igual en todas.
//
// - **Mover** se ve pasar (24 sep, Nicolás: «que se sepa que sí pasó de etapa»): un momento «Pasando a…», después
//   «Pasó a …» unos segundos, y el aviso con «Deshacer». Los correos (la invitación de la IA o el que se le escribe
//   a la persona) salen cuando se va el aviso, así que «Deshacer» los frena.
// - **Mover o cambiar de etapa, completo** (25 sep, Nicolás: «hazlos todos en las 3 exploraciones»): lo simple se mueve
//   en el acto (avanzar un paso, arrastrar a la columna de al lado). Lo que trae algo que decidir abre la ventana de
//   `dialogo-mover.tsx`: saltarse etapas, volver atrás, dejar una entrevista de IA sin terminar, volver a una que ya
//   hizo, entrar a una etapa con IA y llegar a la última. «Mover a otra etapa…» la abre siempre, para elegir, escribirle
//   y comentar. Las reglas están en `movimientos.ts`, y cada cambio queda en la pestaña «Etapas» de la ficha.
// - **Créditos** (13 oct, PM): entrar a una etapa con IA pregunta si la IA le escribe o solo se mueve. Cada invitación
//   aparta sus créditos y una entrevista cancelada los devuelve (`invitaciones.ts`); quien entra sin invitación queda
//   «Esperando acción» y la recibe después con «Enviar la invitación».
// - **Vacante cerrada**: nadie cambia de etapa (ni se rechaza) hasta reabrirla; el aviso trae el botón.
// - **Cuando no se guarda**: la persona se queda donde estaba, la fila lo dice y el aviso trae «Reintentar».
// - **Rechazar** lleva motivo y el correo no se retira (decisión 4). Quien se rechaza no desaparece: queda al pie de
//   la etapa donde estaba, como en el producto de hoy, y se puede **volver a considerar**.

export type { Cambio } from './dialogo-mover'

// `atras`: volvió a una etapa anterior; la fila dice «Volvió a…» en vez de «Pasó a…».
// `por`: la movió otra persona del equipo, no tú (VA-23).
export type Transito = { tipo: 'moviendo' | 'movida' | 'fallo'; destino: string; desde: string; atras: boolean; por?: string }

export type Opciones = {
  // En cuanto se decide mover (antes del «Pasando a…»): la revisión de la 3 saca a la persona de la cola.
  alConfirmar?: () => void
  // Se llama cuando el cambio ya se hizo (limpiar la selección…), con quiénes sí se movieron.
  alMover?: (movidas: string[]) => void
  alDeshacer?: () => void
  // El cambio no se guardó: la persona sigue donde estaba.
  alFallar?: () => void
  // Cuántas personas de la selección no se movieron porque ya estaban en la última etapa: el aviso lo dice.
  quedaron?: number
  // Se aprobó a propuesta de Orbit Flow, con su razón: queda en el historial de cada persona (OF-55).
  porAgente?: string
}

// Por qué no se puede mover a nadie ahora, y cómo salir de ahí. Lo leen la ficha, la barra de varias y el tablero.
// Por qué no se puede mover a nadie: la vacante está cerrada o quien mira solo la puede ver (VA-11). `corto` va en los
// pies y en los globos; `onReabrir` solo existe si quien mira puede reabrirla.
export type Bloqueo = { titulo: string; texto: string; corto: string; onReabrir?: () => void }

// Cuánto dura cada momento. El «Pasando a…» es corto: lo justo para verlo, no para esperarlo.
const PASANDO_MS = 900
const PASO_MS = 4000
const FALLO_MS = 8000

const SIN_DECISION: Omit<DecisionMover, 'cambios'> = { comentario: '', ia: 'conservar', invitar: true, aviso: null, cerrarVacante: false }

export type ConLoQuePasa = Cambio & { pasa: Consecuencias }

// Lo que dice el aviso de un cambio ya hecho, en una línea: lo más importante que pasó (8 oct, Nicolás: avisos más
// cortos). Primero el correo que sale (que «Deshacer» todavía frena), después lo que se canceló o quedó esperando, lo que
// se saltó y, si no pasa nada de eso, que nadie recibe correo. En varias, cuántas ya estaban en la última etapa.
// Se exporta: Mis candidatos lo usa al mover desde la base (use-base).
export function detalleDe(nuevos: Movimiento[], quedaron?: number) {
  const una = nuevos.length === 1
  const de = (filtro: (m: Movimiento) => boolean) => nuevos.filter(filtro)
  const invitadas = de((m) => m.ia === 'invitada' || m.ia === 'reinvitada')
  const escritas = de((m) => Boolean(m.aviso))
  const canceladas = de((m) => Boolean(m.cancelada))
  const enEspera = de((m) => m.ia === 'en-espera')
  const sinInvitar = de((m) => m.ia === 'sin-invitar')
  const saltan = de((m) => m.saltadas.length > 0)
  const conservan = de((m) => m.ia === 'conservada')
  const principal = invitadas.length
    ? `${
        una
          ? `Le llega la invitación a «${tituloEtapa(invitadas[0].hacia)}».`
          : `${personasTexto(invitadas.length)} reciben la invitación a «${tituloEtapa(invitadas[0].hacia)}».`
      }${sinInvitar.length ? ` ${personasTexto(sinInvitar.length)} sin invitación: no alcanzaron los créditos.` : ` ${textoReserva(invitadas)}`}`.trim()
    : escritas.length
      ? una
        ? `Le llega tu correo «${escritas[0].aviso}».`
        : `${personasTexto(escritas.length)} reciben tu correo.`
      : canceladas.length
        ? una
          ? `Se canceló su entrevista con «${tituloEtapa(canceladas[0].cancelada?.etapa ?? '')}».`
          : `Se cancelaron ${canceladas.length} entrevistas sin terminar.`
        : enEspera.length
          ? 'La invitación sale cuando publiques la vacante.'
          : sinInvitar.length
            ? una
              ? 'Entró sin invitación: no usó créditos.'
              : `${personasTexto(sinInvitar.length)} entraron sin invitación: no se usaron créditos.`
          : saltan.length
            ? una
              ? `Se saltó ${nombreDeLista(saltan[0].saltadas.map(tituloEtapa))}.`
              : `${personasTexto(saltan.length)} se saltaron etapas.`
            : conservan.length
              ? una
                ? 'Conserva su entrevista.'
                : `${personasTexto(conservan.length)} conservan su entrevista.`
              : 'Nadie recibe correo.'
  // Si lo principal fue otra cosa (un correo, una entrevista cancelada), también se dice que entró sin invitación.
  const sinInvitarTambien =
    sinInvitar.length && !invitadas.length && (escritas.length || canceladas.length)
      ? una
        ? ' Entró sin invitación.'
        : ` ${personasTexto(sinInvitar.length)} sin invitación.`
      : ''
  const linea = `${principal}${sinInvitarTambien}`
  return quedaron ? `${linea} ${personasTexto(quedaron)} ya ${quedaron === 1 ? 'estaba' : 'estaban'} en la última etapa.` : linea
}

export function useProceso(vacante: VacanteUI, onCambioVacante: (cambio: Partial<VacanteUI>) => void) {
  // Con quien entró por un lote en esta visita, aunque la lectura haya terminado mientras se estaba en otra pantalla.
  // Arranca de la lista compartida de la sesión, que ya trae lo que se movió en una visita anterior; los que entraron por
  // un lote o desde la base y aún no están en ella se suman sin repetirse.
  const [lista, setLista] = useState<Candidatura[]>(() => {
    const ya = new Set(CANDIDATURAS.map((c) => c.id))
    const llegadas = [...registroDeImportadas.todas(), ...registroDePostuladas.todas()].filter((c) => !ya.has(c.id))
    const rechazadasIds = new Set(RECHAZADAS.map((r) => r.candidatura.id))
    return [...llegadas.filter((c) => !rechazadasIds.has(c.id)), ...CANDIDATURAS]
  })
  const [rechazadas, setRechazadas] = useState<Rechazada[]>(() => [...RECHAZADAS])
  // Lo que pasa aquí se escribe en las listas compartidas: al ir a la lista de Vacantes, a «Editar» o a Mis candidatos y
  // volver, cada persona sigue donde se dejó (VA-01). Las demás pantallas leen las mismas listas.
  useEffect(() => {
    CANDIDATURAS.splice(0, CANDIDATURAS.length, ...lista)
  }, [lista])
  useEffect(() => {
    RECHAZADAS.splice(0, RECHAZADAS.length, ...rechazadas)
  }, [rechazadas])
  const [enTransito, setEnTransito] = useState<Map<string, { destino: string; desde: string }>>(new Map())
  const [recien, setRecien] = useState<Map<string, { destino: string; dias: number; desde: string; por?: string }>>(new Map())
  // Quien no se pudo mover: la fila lo dice unos segundos, y el aviso trae «Reintentar».
  const [fallos, setFallos] = useState<Map<string, { destino: string; desde: string }>>(new Map())
  // Quien entró en esta visita (importado, agregado desde la base o devuelto al proceso): el tablero lo marca.
  const [nuevas, setNuevas] = useState<Map<string, 'nueva' | 'volvio'>>(
    () => new Map([...registroDeImportadas.todas(), ...registroDePostuladas.todas()].map((c) => [c.id, 'nueva'])),
  )
  // La ventana de mover: el último pedido se guarda aunque se cierre, para que no se vacíe mientras sale.
  const [pedido, setPedido] = useState<(PedidoMover & { opciones: Opciones }) | null>(null)
  const [pidiendo, setPidiendo] = useState(false)
  // La ventana de rechazo y la de volver a considerar: como la de mover, el último pedido se guarda aunque se cierre.
  const [rechazo, setRechazo] = useState<(PedidoRechazo & { alRechazar?: () => void; alDeshacer?: () => void; porAgente?: string }) | null>(null)
  const [rechazando, setRechazando] = useState(false)
  const [reconsiderando, setReconsiderando] = useState<{ id: number; rechazada: Rechazada } | null>(null)
  const [reconsiderandoAbierto, setReconsiderandoAbierto] = useState(false)

  // Si cambian las etapas de la vacante (desde «Editar» o desde el tablero) y se quita una con gente, esa gente pasa a la
  // etapa anterior, que es lo que promete el editor al quitarla. Se ajusta durante el render, no con un efecto.
  const [etapasAntes, setEtapasAntes] = useState({ vacante: vacante.id, etapas: vacante.etapas })
  if (etapasAntes.etapas !== vacante.etapas) {
    setEtapasAntes({ vacante: vacante.id, etapas: vacante.etapas })
    const ahora = new Set(vacante.etapas.map((etapa) => etapa.id))
    if (etapasAntes.vacante === vacante.id && etapasAntes.etapas.some((etapa) => !ahora.has(etapa.id))) {
      const viejas = etapasAntes.etapas.map((etapa) => etapa.id)
      const destinoDe = (etapa: string) => {
        for (let i = viejas.indexOf(etapa) - 1; i >= 0; i -= 1) if (ahora.has(viejas[i])) return viejas[i]
        return vacante.etapas[0]?.id ?? etapa
      }
      const reubicar = (c: Candidatura) =>
        c.vacante.id === vacante.id && !ahora.has(c.etapa) ? { ...c, etapa: destinoDe(c.etapa) } : c
      setLista((actual) => actual.map(reubicar))
      setRechazadas((actual) => actual.map((r) => ({ ...r, candidatura: reubicar(r.candidatura) })))
    }
  }

  const relojes = useRef<number[]>([])
  useEffect(() => () => relojes.current.forEach((reloj) => window.clearTimeout(reloj)), [])
  const despues = (hacer: () => void, ms: number) => {
    relojes.current.push(window.setTimeout(hacer, ms))
  }
  const contador = useRef(0)

  // Con los datos que se corrigieron desde el agente (correo, celular, expectativa): la bandeja, la ficha y la
  // comparación dicen lo mismo.
  const correcciones = useCorrecciones()
  // Y con los requisitos que corrigió el equipo (CA-03): la tarjeta, la ficha, el puntaje y el agente dicen lo mismo.
  const requisitosCorregidos = useRequisitosCorregidos()
  const dentro = useMemo(
    () =>
      lista
        .filter((c) => c.vacante.id === vacante.id)
        .map((c) => conRequisitosCorregidos(conCorrecciones(c, correcciones), requisitosCorregidos)),
    [lista, vacante.id, correcciones, requisitosCorregidos],
  )
  const rechazadasAqui = useMemo(
    () =>
      rechazadas
        .filter((r) => r.candidatura.vacante.id === vacante.id)
        .map((r) => {
          const candidatura = conRequisitosCorregidos(conCorrecciones(r.candidatura, correcciones), requisitosCorregidos)
          return candidatura === r.candidatura ? r : { ...r, candidatura }
        }),
    [rechazadas, vacante.id, correcciones, requisitosCorregidos],
  )

  const orden = (etapa: string) => vacante.etapas.findIndex((una) => una.id === etapa)
  const transitoDe = (id: string): Transito | undefined => {
    const moviendo = enTransito.get(id)
    if (moviendo) return { tipo: 'moviendo', ...moviendo, atras: orden(moviendo.destino) < orden(moviendo.desde) }
    const fallo = fallos.get(id)
    if (fallo) return { tipo: 'fallo', ...fallo, atras: orden(fallo.destino) < orden(fallo.desde) }
    const movida = recien.get(id)
    return movida
      ? { tipo: 'movida', destino: movida.destino, desde: movida.desde, atras: orden(movida.destino) < orden(movida.desde), por: movida.por }
      : undefined
  }

  // Lo que entra (o sale) por un lote de hojas de vida llega del almacén de lotes: la lectura corre fuera de la pantalla.
  // El aviso lo da el lote al terminar; aquí solo se suman a la lista, arriba de su etapa y marcadas como nuevas.
  // Lo mismo con quien se postula desde la base global («Mis candidatos»), y con quien se elimina de ella.
  useEffect(() => {
    const recibir = (evento: EventoImportadas | EventoPostuladas) => {
      // Se le actualizaron los datos con su hoja nueva (VA-47): la misma tarjeta, en la etapa donde esté.
      if (evento.tipo === 'datos') {
        setLista((actual) => actual.map((c) => (c.id === evento.candidaturaId ? { ...c, candidato: evento.candidato } : c)))
        return
      }
      if (evento.tipo === 'entraron') {
        const ids = new Set(evento.candidaturas.map((c) => c.id))
        setLista((actual) => [...evento.candidaturas, ...actual.filter((c) => !ids.has(c.id))])
        setNuevas((actual) => {
          const siguiente = new Map(actual)
          evento.candidaturas.forEach((c) => siguiente.set(c.id, 'nueva'))
          return siguiente
        })
      } else {
        const ids = new Set(evento.ids)
        setLista((actual) => actual.filter((c) => !ids.has(c.id)))
        setRechazadas((actual) => actual.filter((r) => !ids.has(r.candidatura.id)))
        setNuevas((actual) => new Map([...actual].filter(([id]) => !ids.has(id))))
      }
    }
    const dejarLotes = registroDeImportadas.escuchar(recibir)
    const dejarBase = registroDePostuladas.escuchar(recibir)
    return () => {
      dejarLotes()
      dejarBase()
    }
  }, [])

  /* La vacante cerrada ------------------------------------------------------------------------------------------ */

  // Reabrir la vuelve a publicar en el portal: se confirma como cualquier publicación y el aviso trae «Deshacer», que
  // la deja cerrada con su resultado de antes (VA-18).
  const [reabriendo, setReabriendo] = useState(false)
  // Enviar la invitación a quien entró sin ella: a quién, y si la ventana está abierta.
  const [invitando, setInvitando] = useState<Candidatura | null>(null)
  const [invitandoAbierta, setInvitandoAbierta] = useState(false)
  const reabrir = () => setReabriendo(true)
  const confirmarReabrir = () => {
    setReabriendo(false)
    const previo: Partial<VacanteUI> = { estado: vacante.estado, desenlace: vacante.desenlace, oculta: vacante.oculta }
    onCambioVacante({ estado: 'Publicada', desenlace: undefined, oculta: false })
    notifyAction('La vacante volvió a abrir', 'Ya recibe aplicaciones otra vez.', {
      label: 'Deshacer',
      onClick: () => onCambioVacante(previo),
    }, 'success')
  }
  const permiso = permisoEn(vacante)
  const pedirA = permiso.duena ? `Pídele a ${permiso.duena.nombre}` : 'Pídele a la dueña del proceso'
  const bloqueo: Bloqueo | null =
    vacante.estado === 'Cerrada'
      ? permiso.administra
        ? {
            titulo: 'La vacante está cerrada',
            texto: 'Nadie cambia de etapa mientras esté cerrada. Reábrela para seguir con el proceso.',
            corto: 'La vacante está cerrada: nadie cambia de etapa',
            onReabrir: reabrir,
          }
        : {
            titulo: 'La vacante está cerrada',
            texto: `Nadie cambia de etapa mientras esté cerrada. ${pedirA} que la reabra.`,
            corto: 'La vacante está cerrada: nadie cambia de etapa',
          }
      : !permiso.trabaja
        ? {
            titulo: 'Solo puedes ver esta vacante',
            texto: `${permiso.porque} ${pedirA} acceso para mover o rechazar a alguien.`,
            corto: 'Solo puedes ver esta vacante',
          }
        : null
  // Cualquier camino que intente mover o rechazar con la vacante cerrada o sin permiso (una tecla, un menú viejo, el
  // agente) termina aquí.
  const bloqueada = () => {
    if (!bloqueo) return false
    // El texto largo vive en el aviso del tablero; aquí, solo la salida. Con notify, como todo aviso (regla
    // «avisos-con-tipo»): antes era un toast.add suelto.
    if (bloqueo.onReabrir) notifyAction(bloqueo.titulo, undefined, { label: 'Reabrir la vacante', onClick: bloqueo.onReabrir }, 'warning')
    else notify(bloqueo.titulo, `${pedirA} ${vacante.estado === 'Cerrada' ? 'que la reabra' : 'acceso'}.`, 'warning')
    return true
  }

  // Un «Deshacer» viejo no revierte nada si después ya pasó otra cosa con esa persona (VA-36): devolvería a alguien a
  // una etapa a la que «nunca llegó». Lo dice y no hace nada.
  const yaPasoAlgoDespues = (suyos: Movimiento[]) => {
    const otra = suyos.find((movimiento) => movimientosDe(movimiento.candidaturaId).at(-1)?.id !== movimiento.id)
    if (!otra) return false
    const nombre = lista.find((c) => c.id === otra.candidaturaId)?.candidato.nombre ?? rechazadas.find((r) => r.candidatura.id === otra.candidaturaId)?.candidatura.candidato.nombre
    notify('Ya no se puede deshacer ese cambio', `Primero deshaz lo último que pasó con ${nombre ?? 'esa persona'}.`, 'warning')
    return true
  }

  /* Mover ------------------------------------------------------------------------------------------------------ */

  const quitarDe =
    (ids: string[]) =>
    <T,>(mapa: Map<string, T>) => {
      const siguiente = new Map(mapa)
      ids.forEach((id) => siguiente.delete(id))
      return siguiente
    }

  const mover = (cambios: Cambio[], opciones: Opciones = {}, decision: Omit<DecisionMover, 'cambios'> = SIN_DECISION) => {
    opciones.alConfirmar?.()
    // Lo que le pasa a cada una se calcula antes de moverla: después ya no se sabe de dónde venía.
    const conLoQuePasa: ConLoQuePasa[] = cambios.map((cambio) => ({
      ...cambio,
      pasa: consecuenciasDe(cambio.candidatura, cambio.destino, vacante.etapas, movimientosDe(cambio.candidatura.id)),
    }))
    const fallan = new Set(conLoQuePasa.filter(({ candidatura }) => fallaAlMover(candidatura.id)).map(({ candidatura }) => candidatura.id))
    const todas = conLoQuePasa.map(({ candidatura }) => candidatura.id)
    setFallos(quitarDe(todas))
    setEnTransito((actual) => {
      const siguiente = new Map(actual)
      cambios.forEach(({ candidatura, destino }) => siguiente.set(candidatura.id, { destino, desde: candidatura.etapa }))
      return siguiente
    })

    despues(() => {
      // Otra persona del equipo la movió un momento antes (VA-23): su cambio gana, no se pisa sin preguntar.
      const ganada = otraLaMovioAntes() ? conLoQuePasa.find(({ candidatura }) => !fallan.has(candidatura.id)) : undefined
      if (ganada) ganoOtra(ganada, opciones, decision)
      const hechos = conLoQuePasa.filter(({ candidatura }) => !fallan.has(candidatura.id) && candidatura.id !== ganada?.candidatura.id)
      const fallidos = conLoQuePasa.filter(({ candidatura }) => fallan.has(candidatura.id))
      if (!hechos.length && !fallidos.length) return

      // No se guardó: se queda donde estaba, la fila lo dice y se reintenta con lo mismo que se había decidido.
      if (fallidos.length) {
        const ids = fallidos.map(({ candidatura }) => candidatura.id)
        setEnTransito(quitarDe(ids))
        setFallos((actual) => {
          const siguiente = new Map(actual)
          fallidos.forEach(({ candidatura, destino }) => siguiente.set(candidatura.id, { destino, desde: candidatura.etapa }))
          return siguiente
        })
        despues(() => setFallos(quitarDe(ids)), FALLO_MS)
        const [primero] = fallidos
        avisoDeError(
          fallidos.length === 1 ? `No pudimos mover a ${primero.candidatura.candidato.nombre}` : `No pudimos mover a ${personasTexto(fallidos.length)}`,
          `${fallidos.length === 1 ? `Sigue en ${tituloEtapa(primero.candidatura.etapa)}` : 'Siguen donde estaban'}: no se guardó el cambio.`,
          // Si mientras tanto se cerró la vacante, reintentar no mueve a nadie: lo dice el aviso de la vacante cerrada (VA-17).
          () => {
            if (bloqueada()) return
            mover(fallidos.map(({ candidatura, destino }) => ({ candidatura, destino })), opciones, decision)
          },
        )
        if (!hechos.length) {
          opciones.alFallar?.()
          return
        }
      }

      const ids = hechos.map(({ candidatura }) => candidatura.id)
      // Lo que se devuelve al deshacer: la etapa, los días que llevaba y lo que estaba esperando.
      const antes = new Map(
        hechos.map(({ candidatura }) => [candidatura.id, { etapa: candidatura.etapa, dias: candidatura.dias, candidato: candidatura.candidato }]),
      )
      const destinos = new Map(hechos.map(({ candidatura, destino }) => [candidatura.id, destino]))
      const cuando = Date.now()
      // Las invitaciones que alcanzan con lo libre de cada agente; quien no alcance entra sin invitación (VA-09).
      const alcanza = cupoDeInvitaciones()
      // El rastro: cada cambio queda en la pestaña «Etapas» de la ficha.
      const nuevos: Movimiento[] = hechos.map(({ candidatura, destino, pasa }) => {
        // En borrador la IA espera a la publicación: no le llega nada a nadie de una vacante que no existe afuera (VA-45).
        // Con «Solo moverla» entra sin invitación y no gasta (13 oct, PM).
        const ia = pasa.entra
          ? pasa.entra.hecha === undefined && !decision.invitar
            ? 'sin-invitar'
            : vacante.estado === 'Borrador'
              ? 'en-espera'
              : pasa.entra.hecha === undefined
                ? alcanza(destino)
                  ? 'invitada'
                  : 'sin-invitar'
                : decision.ia === 'repetir'
                  ? alcanza(destino)
                    ? 'reinvitada'
                    : 'sin-invitar'
                  : 'conservada'
          : undefined
        const entrevista = pasa.deja?.entrevista
        return {
          id: `${candidatura.id}>${destino}@${cuando}-${(contador.current += 1)}`,
          candidaturaId: candidatura.id,
          desde: candidatura.etapa,
          hacia: destino,
          cuando,
          dias: candidatura.dias,
          quien: QUIEN_MUEVE,
          comentario: decision.comentario.trim() || undefined,
          saltadas: pasa.saltadas.map((etapa) => etapa.id),
          ia,
          cancelada: pasa.deja
            ? {
                etapa: pasa.deja.etapa.id,
                ...(entrevista?.tipo === 'a-medias' ? { respondidas: entrevista.respondidas, total: entrevista.total } : {}),
              }
            : undefined,
          // A quien le escribe la IA no se le manda además el correo a mano.
          aviso: decision.aviso && ia !== 'invitada' && ia !== 'reinvitada' ? decision.aviso.plantilla : undefined,
          porAgente: opciones.porAgente,
        }
      })
      registroDeMovimientos.agregar(nuevos)
      // Lo que apartan las invitaciones y lo que vuelve de las entrevistas canceladas, en Créditos.
      const deshacerCreditos = creditosDeCambios(nuevos, new Map(hechos.map(({ candidatura }) => [candidatura.id, candidatura.candidato.nombre])))
      // Quien entró sin invitación espera que alguien del equipo se la envíe: «Esperando acción».
      const sinInvitar = new Set(nuevos.filter((m) => m.ia === 'sin-invitar').map((m) => m.candidaturaId))

      // Moverla es responderle: lo que esperaba del equipo en la etapa anterior deja de estar pendiente.
      setLista((actual) =>
        actual.map((c) =>
          destinos.has(c.id)
            ? {
                ...c,
                etapa: destinos.get(c.id)!,
                dias: 0,
                aplico: diasDesdeQueAplico(c),
                candidato: { ...c.candidato, accion: sinInvitar.has(c.id) ? accionSinInvitacion(tituloEtapa(destinos.get(c.id)!)) : undefined },
              }
            : c,
        ),
      )
      setEnTransito(quitarDe(ids))
      setRecien((actual) => {
        const siguiente = new Map(actual)
        antes.forEach((previo, id) => siguiente.set(id, { destino: destinos.get(id)!, dias: previo.dias, desde: previo.etapa }))
        return siguiente
      })
      opciones.alMover?.(ids)

      const [primero] = hechos
      const unica = new Set(destinos.values()).size === 1 ? primero.destino : null
      const titulo =
        hechos.length === 1
          ? `${primero.candidatura.candidato.nombre} ${primero.pasa.atras ? 'volvió' : 'pasó'} a ${tituloEtapa(primero.destino)}`
          : `${hechos.length} personas pasaron ${unica ? `a ${tituloEtapa(unica)}` : 'a su siguiente etapa'}`

      notifyAction(titulo, detalleDe(nuevos, opciones.quedaron), {
        label: 'Deshacer',
        onClick: () => {
          if (yaPasoAlgoDespues(nuevos)) return
          setLista((actual) => actual.map((c) => (antes.has(c.id) ? { ...c, ...antes.get(c.id)! } : c)))
          setRecien(quitarDe(ids))
          registroDeMovimientos.quitar(nuevos.map((m) => m.id))
          deshacerCreditos()
          opciones.alDeshacer?.()
        },
      }, 'success')
      despues(() => setRecien(quitarDe(ids)), PASO_MS)
    }, PASANDO_MS)
  }

  // Cuando otra persona del equipo movió a alguien justo antes (VA-23): queda donde ella la dejó, su tarjeta lo dice, el
  // historial lo anota con su nombre y el aviso ofrece moverla igual adonde querías.
  const ganoOtra = ({ candidatura, destino }: ConLoQuePasa, opciones: Opciones, decision: Omit<DecisionMover, 'cambios'>) => {
    const otra = vacante.equipo.find((miembro) => miembro.nombre !== QUIEN_MUEVE)?.nombre ?? 'Sara Gómez'
    const libres = vacante.etapas.filter((etapa) => etapa.id !== candidatura.etapa && etapa.id !== destino && !etapa.ia && !esUltimaEtapa(vacante.etapas, etapa.id))
    const suya = (libres.find((etapa) => orden(etapa.id) > orden(candidatura.etapa)) ?? libres[0])?.id
    setEnTransito(quitarDe([candidatura.id]))
    if (!suya) return
    const movimiento: Movimiento = {
      id: `${candidatura.id}>${suya}@otra-${(contador.current += 1)}`,
      candidaturaId: candidatura.id,
      desde: candidatura.etapa,
      hacia: suya,
      cuando: Date.now() - 40_000,
      dias: candidatura.dias,
      quien: otra,
      saltadas: [],
    }
    registroDeMovimientos.agregar([movimiento])
    const ahora = { ...candidatura, etapa: suya, dias: 0 }
    setLista((actual) => actual.map((c) => (c.id === candidatura.id ? { ...c, etapa: suya, dias: 0 } : c)))
    setRecien((actual) => new Map(actual).set(candidatura.id, { destino: suya, dias: candidatura.dias, desde: candidatura.etapa, por: otra }))
    despues(() => setRecien(quitarDe([candidatura.id])), PASO_MS * 2)
    notifyAction(
      `${otra} ya movió a ${candidatura.candidato.nombre}`,
      `La pasó a ${tituloEtapa(suya)} antes que tú.`,
      { label: `Moverla a ${tituloEtapa(destino)}`, onClick: () => !bloqueada() && mover([{ candidatura: ahora, destino }], opciones, decision) },
      'warning',
    )
  }

  const abrirVentana = (candidaturas: Candidatura[], destinos: Record<string, string> | null, opciones: Opciones) => {
    contador.current += 1
    setPedido({ id: contador.current, candidaturas, destinos, opciones })
    setPidiendo(true)
  }

  // La puerta de entrada para mover desde un gesto que ya dice a dónde (avanzar, arrastrar, el recorrido de la ficha,
  // «Avanzar de etapa» con varias): descarta lo que no cambia y, si hay algo que decidir, abre la ventana.
  const pedirMover = (cambios: Cambio[], opciones: Opciones = {}) => {
    if (bloqueada()) return
    const utiles = cambios.filter(({ candidatura, destino }) => destino !== candidatura.etapa && !enTransito.has(candidatura.id))
    if (!utiles.length) return
    const hayQueDecidir = utiles.some(({ candidatura, destino }) =>
      pideDecision(consecuenciasDe(candidatura, destino, vacante.etapas, movimientosDe(candidatura.id))),
    )
    if (hayQueDecidir) {
      abrirVentana(
        utiles.map(({ candidatura }) => candidatura),
        Object.fromEntries(utiles.map(({ candidatura, destino }) => [candidatura.id, destino])),
        opciones,
      )
      return
    }
    mover(utiles, opciones)
  }

  // «Mover a otra etapa…»: la ventana completa, para elegir la etapa, escribirle y dejar un comentario.
  // Con `destino`, la ventana abre con esa etapa ya elegida: tocar una etapa en el recorrido de la ficha no mueve sin
  // confirmar (CA-28).
  const elegirEtapa = (candidaturas: Candidatura[], opciones: Opciones = {}, destino?: string) => {
    if (bloqueada()) return
    const libres = candidaturas.filter((c) => !enTransito.has(c.id))
    if (libres.length) abrirVentana(libres, destino ? Object.fromEntries(libres.map((c) => [c.id, destino])) : null, opciones)
  }

  // «Mover y cerrar la vacante»: se cierra solo cuando el movimiento quedó guardado, con quienes de verdad llegaron a la
  // última etapa (VA-05). Si el movimiento falla, la vacante sigue abierta. «Deshacer» devuelve a la persona y también
  // reabre la vacante, con el resultado de antes (VA-06). Quien quedó seleccionada pasa a «Contratada» en Mis
  // candidatos (MC-26).
  const confirmarMover = (decision: DecisionMover) => {
    if (!pedido) return
    const { cambios, ...resto } = decision
    const opciones = pedido.opciones
    if (!decision.cerrarVacante) {
      if (cambios.length) mover(cambios, opciones, resto)
      return
    }
    const ultima = vacante.etapas[vacante.etapas.length - 1]?.id
    const previo: Partial<VacanteUI> = { estado: vacante.estado, desenlace: vacante.desenlace }
    let deshacerContratadas = () => {}
    const cerrar = (movidas: string[]) => {
      const llegan = cambios.filter(({ candidatura, destino }) => destino === ultima && movidas.includes(candidatura.id))
      onCambioVacante({
        estado: 'Cerrada',
        desenlace: `Cerrada hoy · ${
          llegan.length === 1
            ? `se seleccionó a ${llegan[0].candidatura.candidato.nombre}`
            : llegan.length
              ? `se seleccionaron ${llegan.length} personas`
              : 'sin seleccionar a nadie'
        }`,
      })
      deshacerContratadas = marcarContratadas(llegan.map(({ candidatura }) => candidatura.id))
      notify('La vacante quedó cerrada', 'Ya no recibe aplicaciones.', 'success')
    }
    if (!cambios.length) {
      cerrar([])
      return
    }
    mover(cambios, {
      ...opciones,
      alMover: (movidas) => {
        opciones.alMover?.(movidas)
        cerrar(movidas)
      },
      alDeshacer: () => {
        opciones.alDeshacer?.()
        deshacerContratadas()
        onCambioVacante(previo)
      },
    }, resto)
  }

  // A quien se rechazó sin correo se le puede escribir después, con la plantilla que corresponde a donde se quedó
  // (VA-25). Queda en su ficha («Le llegó …») y en su historial.
  const escribirRechazo = (rechazada: Rechazada) => {
    const { candidatura } = rechazada
    const plantilla = PLANTILLAS_RECHAZO.find((una) => una.id === plantillaDeRechazo(quienDe(rechazada), [candidatura], vacante.etapas))
    const cambiar = (avisada: boolean) =>
      setRechazadas((actual) =>
        actual.map((r) => (r.candidatura.id === candidatura.id ? { ...r, avisada, plantilla: avisada ? plantilla?.titulo : r.plantilla } : r)),
      )
    cambiar(true)
    notifyAction(
      `Le escribiste a ${candidatura.candidato.nombre}`,
      `Le llega «${plantilla?.titulo ?? 'el correo de rechazo'}».`,
      { label: 'Deshacer', onClick: () => cambiar(false) },
      'success',
    )
  }

  /* Rechazar, reconsiderar y sumar ---------------------------------------------------------------------------- */

  // Rechazar a una o a varias: abre la ventana. `alRechazar` y `alDeshacer` los usa la revisión de la 3 para sacar a la
  // persona de la cola y devolverla.
  const pedirRechazo = (candidaturas: Candidatura[], alRechazar?: () => void, alDeshacer?: () => void, porAgente?: string) => {
    // Con la vacante cerrada sí se puede rechazar: es como se cierra el proceso de quien seguía (VA-10). Solo «Solo ver»
    // lo impide.
    if (!permiso.trabaja) {
      bloqueada()
      return
    }
    const libres = candidaturas.filter((c) => !enTransito.has(c.id))
    if (!libres.length) return
    contador.current += 1
    setRechazo({ id: contador.current, candidaturas: libres, alRechazar, alDeshacer, porAgente })
    setRechazando(true)
  }

  const hacerRechazo = (candidaturas: Candidatura[], decision: DecisionRechazo, alRechazar?: () => void, alDeshacer?: () => void, porAgente?: string) => {
    const retiro = decision.quien === 'candidato'
    // No se guardó: nadie sale y el correo no sale. Se reintenta con lo mismo que se había elegido.
    const fallan = candidaturas.filter((c) => fallaAlRechazar(c.id))
    const salen = candidaturas.filter((c) => !fallan.includes(c))
    if (fallan.length) {
      avisoDeError(
        fallan.length === 1 ? `No pudimos ${retiro ? 'registrar el retiro de' : 'rechazar a'} ${fallan[0].candidato.nombre}` : `No pudimos rechazar a ${personasTexto(fallan.length)}`,
        `${fallan.length === 1 ? 'Sigue' : 'Siguen'} en el proceso y no salió ningún correo.`,
        () => hacerRechazo(fallan, decision, alRechazar, alDeshacer, porAgente),
      )
      if (!salen.length) return
    }

    const cuando = marcaDeTiempo()
    const ids = new Set(salen.map((c) => c.id))
    const nuevasRechazadas: Rechazada[] = salen.map((candidatura) => ({
      candidatura,
      motivo: decision.motivo,
      avisada: Boolean(decision.correo),
      quien: decision.quien,
      por: QUIEN_MUEVE,
      cuando,
      nota: decision.nota || undefined,
      plantilla: decision.correo?.plantilla,
    }))
    // El rastro: cada rechazo queda en la pestaña «Etapas», con su motivo, el correo y la entrevista que se canceló.
    const registros: Movimiento[] = salen.map((candidatura) => {
      const etapas = candidatura.vacante.id === vacante.id ? vacante.etapas : candidatura.vacante.etapas
      const etapa = etapas.find((una) => una.id === candidatura.etapa)
      const entrevista = etapa ? entrevistaDe(candidatura, etapa, etapas, movimientosDe(candidatura.id)) : null
      return {
        id: `${candidatura.id}x${cuando}-${(contador.current += 1)}`,
        tipo: retiro ? 'retiro' : 'rechazo',
        motivo: decision.motivo,
        candidaturaId: candidatura.id,
        desde: candidatura.etapa,
        hacia: candidatura.etapa,
        cuando,
        dias: candidatura.dias,
        quien: QUIEN_MUEVE,
        comentario: decision.nota || undefined,
        saltadas: [],
        cancelada:
          etapa && entrevista && entrevista.tipo !== 'hecha'
            ? { etapa: etapa.id, ...(entrevista.tipo === 'a-medias' ? { respondidas: entrevista.respondidas, total: entrevista.total } : {}) }
            : undefined,
        aviso: decision.correo?.plantilla,
        porAgente,
      }
    })
    registroDeMovimientos.agregar(registros)
    setLista((actual) => actual.filter((c) => !ids.has(c.id)))
    setRechazadas((actual) => [...nuevasRechazadas, ...actual])
    alRechazar?.()

    const aqui = salen.filter((c) => c.vacante.id === vacante.id)
    const [primera] = aqui.length ? aqui : salen
    const otras = [...new Set(salen.filter((c) => c.vacante.id !== vacante.id).map((c) => c.vacante.titulo))]
    const canceladas = registros.filter((m) => m.cancelada).length
    // Una línea: el motivo y si salió correo; lo demás (la entrevista cancelada, la otra vacante) queda en su historial.
    const detalle = `${decision.motivo} · ${decision.correo ? (retiro ? 'le llegó la confirmación' : 'le llegó el correo') : 'sin correo'}${
      otras.length ? ` · también en ${nombreDeLista(otras)}` : canceladas ? ' · se canceló su entrevista' : ''
    }`
    notifyAction(
      aqui.length > 1 || (!aqui.length && salen.length > 1)
        ? `${retiro ? 'Registraste el retiro de' : 'Rechazaste a'} ${personasTexto(aqui.length || salen.length)}`
        : `${retiro ? 'Registraste el retiro de' : 'Rechazaste a'} ${primera.candidato.nombre}`,
      detalle,
      {
        // Deshacer devuelve a la persona a su etapa (ningún ATS lo tiene). El correo, si salió, ya llegó: se dice.
        label: 'Deshacer',
        onClick: () => {
          if (yaPasoAlgoDespues(registros)) return
          setRechazadas((actual) => actual.filter((r) => !ids.has(r.candidatura.id)))
          setLista((actual) => [...salen, ...actual])
          registroDeMovimientos.quitar(registros.map((m) => m.id))
          alDeshacer?.()
          if (decision.correo && !retiro) {
            // Una persona rechazada en dos vacantes sigue siendo una persona.
            const personas = new Set(salen.map((c) => c.personaId)).size
            notify(
              personas > 1
                ? `${personasTexto(personas)} vuelven a su etapa`
                : salen.length > 1
                  ? `${primera.candidato.nombre} vuelve a sus ${salen.length} vacantes`
                  : `${primera.candidato.nombre} vuelve a ${tituloEtapa(primera.etapa)}`,
              personas > 1 ? 'Ya les llegó el rechazo: escríbeles que siguen.' : 'Ya le llegó el rechazo: escríbele que sigue.', 'success',
            )
          }
        },
      }, 'success',
    )
  }

  const confirmarRechazo = (decision: DecisionRechazo) => {
    if (!rechazo) return
    hacerRechazo([...rechazo.candidaturas, ...decision.tambienEn], decision, rechazo.alRechazar, rechazo.alDeshacer, rechazo.porAgente)
  }

  // Volver a considerar: la ventana decide a qué etapa y si se le escribe.
  const reconsiderar = (rechazada: Rechazada) => {
    if (bloqueada()) return
    contador.current += 1
    setReconsiderando({ id: contador.current, rechazada })
    setReconsiderandoAbierto(true)
  }

  const confirmarReconsiderar = (decision: DecisionReconsiderar, cual = reconsiderando) => {
    if (!cual) return
    const { rechazada } = cual
    // Si no se guarda (VA-50), sigue en rechazadas y el aviso deja reintentar con lo mismo que se eligió.
    if (fallaAlGuardar(`reconsiderar:${rechazada.candidatura.id}`)) {
      avisoDeError(
        `No pudimos volver a considerar a ${rechazada.candidatura.candidato.nombre}`,
        'Sigue en rechazadas y no salió ningún correo.',
        () => confirmarReconsiderar(decision, cual),
      )
      return
    }
    const { candidatura } = rechazada
    const cuando = Date.now()
    const etapa = vacante.etapas.find((una) => una.id === decision.destino)
    // Vuelve a una etapa de IA: si es otra, o si es la misma pero su entrevista no quedó hecha (el rechazo canceló la
    // invitación), le llega una invitación nueva (VA-07).
    const hecha = etapa ? entrevistaDe(candidatura, etapa, vacante.etapas, movimientosDe(candidatura.id))?.tipo === 'hecha' : false
    const invitada = Boolean(etapa?.ia) && (decision.destino !== candidatura.etapa || !hecha)
    const movimiento: Movimiento = {
      id: `${candidatura.id}<${cuando}-${(contador.current += 1)}`,
      tipo: 'vuelve',
      candidaturaId: candidatura.id,
      desde: candidatura.etapa,
      hacia: decision.destino,
      cuando,
      dias: candidatura.dias,
      quien: QUIEN_MUEVE,
      comentario: decision.comentario || undefined,
      saltadas: [],
      ia: invitada ? 'invitada' : undefined,
      aviso: decision.correo ? 'Retomamos tu proceso' : undefined,
    }
    registroDeMovimientos.agregar([movimiento])
    setRechazadas((actual) => actual.filter((r) => r.candidatura.id !== candidatura.id))
    setLista((actual) => [{ ...candidatura, etapa: decision.destino, dias: 0, aplico: diasDesdeQueAplico(candidatura) }, ...actual])
    setNuevas((actual) => new Map(actual).set(candidatura.id, 'volvio'))
    notifyAction(
      `${candidatura.candidato.nombre} vuelve a ${tituloEtapa(decision.destino)}`,
      invitada
        ? `Le llega la invitación a «${etapa?.titulo}».`
        : decision.correo
          ? 'Le llega tu correo.'
          : rechazada.avisada
            ? 'Ya le llegó el rechazo y no le escribiste: no sabe que sigue.'
            : 'No recibe correo.',
      {
        label: 'Deshacer',
        onClick: () => {
          setLista((actual) => actual.filter((c) => c.id !== candidatura.id))
          setRechazadas((actual) => [rechazada, ...actual])
          registroDeMovimientos.quitar([movimiento.id])
        },
      }, 'success',
    )
  }

  // El rechazo de una candidatura de esta vacante, si está fuera del proceso (las fichas lo muestran).
  const rechazadaDe = (id: string) => rechazadasAqui.find((r) => r.candidatura.id === id) ?? null

  // Sumar gente a la vacante desde la base («Agregar candidatos»). Entra sin correo. (Lo de un lote llega solo, arriba.)
  const agregar = (nuevasCandidaturas: Candidatura[], detalle: string) => {
    if (bloqueada()) return
    if (!nuevasCandidaturas.length) return
    // Si no se guarda (VA-50), nadie entra y el aviso deja reintentar con las mismas personas.
    if (fallaAlGuardar(`agregar:${nuevasCandidaturas.map((c) => c.id).join(',')}`)) {
      avisoDeError(
        nuevasCandidaturas.length === 1 ? `No pudimos agregar a ${nuevasCandidaturas[0].candidato.nombre}` : `No pudimos agregar a las ${nuevasCandidaturas.length} personas`,
        'No entró nadie a la vacante.',
        () => agregar(nuevasCandidaturas, detalle),
      )
      return
    }
    // Una persona es un solo registro: en la base queda anotado que ahora está en esta vacante.
    anotarProcesos(nuevasCandidaturas)
    // Si entra directo a una etapa de IA, le llega la invitación y su historial lo dice (VA-08).
    // En un borrador la invitación espera a que se publique (VA-45).
    const entradas = entradasA(nuevasCandidaturas, vacante.etapas, QUIEN_MUEVE, vacante.estado === 'Borrador')
    if (entradas.length) registroDeMovimientos.agregar(entradas)
    // Cada invitación aparta sus créditos en Créditos, como al moverla.
    creditosDeCambios(entradas, new Map(nuevasCandidaturas.map((c) => [c.id, c.candidato.nombre])))
    const invitadas = entradas.filter((movimiento) => movimiento.ia === 'invitada')
    if (invitadas.length)
      detalle = `${invitadas.length === nuevasCandidaturas.length ? (invitadas.length === 1 ? 'Le' : 'Les') : `A ${personasTexto(invitadas.length)} les`} llega la invitación a «${tituloEtapa(invitadas[0].hacia)}». ${textoReserva(invitadas)}`.trim()
    const enEspera = entradas.filter((movimiento) => movimiento.ia === 'en-espera')
    if (enEspera.length) detalle = 'La invitación sale cuando publiques la vacante.'
    setLista((actual) => [...nuevasCandidaturas, ...actual])
    setNuevas((actual) => {
      const siguiente = new Map(actual)
      nuevasCandidaturas.forEach((c) => siguiente.set(c.id, 'nueva'))
      return siguiente
    })
    const etapas = new Set(nuevasCandidaturas.map((c) => c.etapa))
    notify(
      `${nuevasCandidaturas.length === 1 ? `${nuevasCandidaturas[0].candidato.nombre} entró` : `${personasTexto(nuevasCandidaturas.length)} entraron`} a ${
        etapas.size === 1 ? tituloEtapa(nuevasCandidaturas[0].etapa) : 'la vacante'
      }`,
      detalle, 'success',
    )
  }

  // «Enviar la invitación…» (tarjeta o ficha): a quien entró a una etapa con IA sin ella. La ventana dice lo que cuesta.
  const pedirInvitacion = (candidatura: Candidatura) => {
    if (bloqueada()) return
    if (!sinInvitacionEn(candidatura, vacante.etapas, movimientosDe(candidatura.id))) return
    setInvitando(candidatura)
    setInvitandoAbierta(true)
  }
  const confirmarInvitacion = () => {
    const candidatura = invitando && lista.find((c) => c.id === invitando.id)
    const etapa = candidatura ? sinInvitacionEn(candidatura, vacante.etapas, movimientosDe(candidatura.id)) : null
    if (!candidatura || !etapa) return
    const antes = candidatura.candidato
    enviarInvitacion(candidatura, etapa, {
      borrador: vacante.estado === 'Borrador',
      // Ya no espera al equipo: ahora espera a la persona («En proceso»).
      alEnviar: () => setLista((actual) => actual.map((c) => (c.id === candidatura.id ? { ...c, candidato: { ...c.candidato, accion: undefined } } : c))),
      alDeshacer: () => setLista((actual) => actual.map((c) => (c.id === candidatura.id ? { ...c, candidato: antes } : c))),
    })
  }

  const dialogos = (
    <>
      {invitando ? (
        <DialogoInvitar
          key={invitando.id}
          abierto={invitandoAbierta}
          onOpenChange={setInvitandoAbierta}
          candidatura={invitando}
          borrador={vacante.estado === 'Borrador'}
          onConfirmar={confirmarInvitacion}
        />
      ) : null}
      <DialogoConfirmar
        abierto={reabriendo}
        onAbiertoChange={setReabriendo}
        titulo={`¿Reabrir «${vacante.titulo}»?`}
        descripcion={`Vuelve a publicarse en el portal de empleo y a recibir aplicaciones.${vacante.desenlace ? ` Deja de contar como «${vacante.desenlace.replace(/^Cerrada hoy · /, '')}».` : ''}`}
        accion="Reabrir la vacante"
        enCurso="Reabriendo…"
        onConfirmar={confirmarReabrir}
      />
      {rechazo ? (
        <DialogoRechazo
          key={rechazo.id}
          abierto={rechazando}
          onOpenChange={setRechazando}
          pedido={rechazo}
          vacante={vacante}
          lista={lista}
          onConfirmar={confirmarRechazo}
        />
      ) : null}
      {reconsiderando ? (
        <DialogoReconsiderar
          key={reconsiderando.id}
          abierto={reconsiderandoAbierto}
          onOpenChange={setReconsiderandoAbierto}
          rechazada={reconsiderando.rechazada}
          vacante={vacante}
          onConfirmar={confirmarReconsiderar}
        />
      ) : null}
      {pedido ? (
        <DialogoMover
          key={pedido.id}
          abierto={pidiendo}
          onOpenChange={setPidiendo}
          pedido={pedido}
          vacante={vacante}
          dentro={dentro}
          onConfirmar={confirmarMover}
        />
      ) : null}
    </>
  )

  // Eliminarla de la vacante (13 oct, PM: «eliminar de la vacante; eliminar candidato es de la base, desde Mis
  // candidatos»): sale de este proceso sin correo y sigue en la base y en sus otras vacantes.
  const quitar = (candidatura: Candidatura) => {
    setLista((actual) => actual.filter((c) => c.id !== candidatura.id))
    notify(`Sacaste a ${candidatura.candidato.nombre} de ${vacante.titulo}`, 'Sigue en tu base y en sus otras vacantes. No le llega ningún correo.', 'success')
  }

  return {
    lista,
    setLista,
    quitar,
    dentro,
    rechazadas: rechazadasAqui,
    nuevas,
    enTransito,
    recien,
    transitoDe,
    pedirMover,
    pedirInvitacion,
    elegirEtapa,
    pedirRechazo,
    reconsiderar,
    rechazadaDe,
    agregar,
    bloqueo,
    dialogos,
    escribirRechazo,
    // Hay una ventana del proceso abierta (rechazar, volver a considerar, mover o reabrir): los atajos de la pantalla
    // esperan, y la pantalla sabe si dibujarla dentro de la ficha (8 oct: desde un panel no se abre una ventana encima).
    ocupado: rechazando || reconsiderandoAbierto || pidiendo || reabriendo || invitandoAbierta,
    // Se cerró la ficha desde la que se pidió: la ventana se va con ella.
    cerrarVentanas: () => {
      setRechazando(false)
      setReconsiderandoAbierto(false)
      setPidiendo(false)
      setReabriendo(false)
      setInvitandoAbierta(false)
    },
  }
}

export type Proceso = ReturnType<typeof useProceso>
