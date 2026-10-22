import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert02Icon,
  ArrowRight01Icon,
  Building03Icon,
  Cancel01Icon,
  Delete02Icon,
  Link01Icon,
  MoreHorizontalIcon,
  MailBlock01Icon,
  SquareLock02Icon,
  UserAdd01Icon,
} from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  FramePanel,
  Text,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { notify, notifyAction } from '@/shared/components/notify'
import { VentanaDeAccion } from '@/modules/design-system/drawers/components/drawer-anidado'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { fechaSinAnio, isoHaceDias } from '@/modules/design-system/patrones/formato'
import { anotarCorreo, baseDeCandidatos } from '../base'
import { VistaPreviaCorreo } from './vista-previa-correo'
import { ASUNTO_TERMINAR, InvitarATerminar } from './invitar-a-terminar'
import { Marco } from '@/modules/design-system/patrones/ficha'
import type { Nota } from '../../vacantes/detalle/components/data'
import { horaDe, perfilDeCandidatura } from '../perfil-candidato'
import { expedienteDeSesion, useExpedienteDeSesion } from '../expediente-sesion'
import { QUIEN_MUEVE, registroDeMovimientos, sigueEnProceso, useMovimientos, useSinInvitacion, type Movimiento } from '../movimientos'
import { AvisoSinInvitacion } from './invitar-a-etapa'
import { BloqueImportada } from './bloque-importada'
import { ListaNotas } from '../../vacantes/detalle/candidato/components/notas'
import { BloqueRechazo, PieRechazada } from './bloque-rechazo'
import { LineasMovimiento } from './lineas-movimiento'
import { LineaDeEtapas, PerfilCandidato, useNavegarFicha, type PestanaInicial } from './perfil-candidato'
import { SelectorEtapa } from './selector-etapa'
import type { Bloqueo } from './use-proceso'
import { OTRAS_DE, PLAZO_ENTREVISTA, pasoPorLaEmpresa, type Candidatura, type EtapaVacante, type Rechazada, siguienteEtapaDe, tituloEtapa } from '../datos'
import { noSeGuardo } from '../simular'

// Ficha de la persona: la misma en las tres propuestas. Desde el 8 oct (VP de producto) lo que concluyó la IA ya no se
// corrige requisito por requisito: la lectura de la hoja de vida es la de Serena, en texto, dentro de su etapa.
//
// Desde el 24 sep vive dentro del perfil completo (perfil-candidato.tsx): quién es arriba y, debajo, las pestañas del
// cajón del producto. Lo de siempre —el proceso con Rechazar / Mover / Avanzar, los requisitos, lo que pide y los
// puntajes de la IA— es la pestaña «Resumen», que abre por defecto (o donde diga `pestanaInicial`).

export type { PestanaInicial } from './perfil-candidato'

const sinTildes = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// Con qué pestaña abre la ficha según la etapa donde está la persona (29 sep, reunión con Elkin: «tiene que abrir en la
// etapa que está… lo que le interesa a la gente ver acá es qué pasó en esa etapa»; y «en la evaluación de CV, si no es
// una etapa de IA, le gustaría ver la información del candidato para evaluarlo»). Sirve igual para las etapas de
// siempre (`cv`, `serena`, `revision`…) y para las de la creación de Elkin, que traen el id de su catálogo
// (`hoja-de-vida-…`, `entrevista-lider-…`, `oferta-…`).
// - La califica la IA (la hoja de vida contra los requisitos, Serena, pruebas, roleplay): «Resumen»; la etapa se abre
//   desde su línea de etapas (8 oct: «Etapas» dejó de ser pestaña).
// - Revisar la hoja de vida a mano: la hoja de vida abierta en «Documentos», para leerla y decidir.
// - Verificar papeles (antecedentes, examen médico, referencias, firma del contrato): «Documentos», donde está lo que
//   hay que revisar.
// - La revisión del equipo y la oferta: «Resumen». Se decide con cómo cumple, cuánto pide y cuándo puede empezar.
// - Entrevistas, retos y pruebas con el equipo (y cualquier etapa propia): «Resumen»; los comentarios de quien la hizo
//   están dentro de la etapa.
export function pestanaParaEtapa(etapa: EtapaVacante): PestanaInicial {
  // Las etapas con IA y las entrevistas abren en «Resumen» (8 oct, VP de producto: primero el resumen y después, con un
  // clic en la etapa, el detalle); antes abrían en «Etapas», que ya no es pestaña.
  const texto = sinTildes(`${etapa.id} ${etapa.titulo}`)
  if (etapa.ia || etapa.id === 'cv' || etapa.id.startsWith('evaluacion-cv')) return 'vacante'
  if (/hoja.de.vida/.test(texto)) return 'hoja-de-vida'
  if (/antecedentes|medico|referencias|contrato/.test(texto)) return 'documentos'
  return 'vacante'
}

export function FichaPersona({
  candidatura,
  onAvanzar,
  onRechazar,
  onIrA,
  etapas,
  onElegirEtapa,
  bloqueo,
  onEscribirRechazo,
  rechazada,
  onReconsiderar,
  pestanaInicial,
  onQuitar,
  onInvitar,
}: {
  // Eliminarla de esta vacante, desde el «⋯» (solo dentro de la vacante).
  onQuitar?: () => void
  // Enviarle la invitación de su etapa con IA si entró sin ella («Solo moverla» o sin créditos).
  onInvitar?: () => void
  // Con qué pestaña abre; sin ella, «Resumen». Desde el tablero se pasa `pestanaParaEtapa(etapa)`.
  pestanaInicial?: PestanaInicial
  candidatura: Candidatura
  onAvanzar: () => void
  onRechazar: () => void
  // Abrir la otra candidatura de la misma persona.
  onIrA?: (id: string) => void
  // Con las etapas de la vacante, el botón deja elegir a cuál mover: el proceso no siempre es lineal
  // (se salta una prueba, se devuelve a alguien a entrevista). Sin ellas, avanza a la siguiente y ya.
  etapas?: EtapaVacante[]
  // «Mover a otra etapa…»: la ventana completa (elegir, escribirle, comentar).
  onElegirEtapa?: () => void
  // Con la vacante cerrada nadie cambia de etapa: el pie lo dice y trae el botón para reabrirla.
  bloqueo?: Bloqueo | null
  // Escribirle el correo de rechazo a quien se rechazó sin correo (VA-25).
  onEscribirRechazo?: () => void
  // Si está fuera del proceso (rechazada o se retiró): arriba el porqué y abajo «Volver a considerar». `null` dice que
  // sigue en proceso aunque haya un rechazo sembrado de antes (se la volvió a considerar).
  rechazada?: Rechazada | null
  onReconsiderar?: () => void
}) {
  const { candidato, vacante, etapa } = candidatura
  // El perfil completo (datos, trayectoria, documentos, historial y etapas) se arma con la candidatura tal como está
  // ahora: si se mueve de etapa, las pestañas lo reflejan.
  // Con lo que se movió en la sesión: las etapas saltadas o canceladas y el rastro de cambios salen de ahí.
  const movimientos = useMovimientos(candidatura.id)
  const perfil = useMemo(() => perfilDeCandidatura(candidatura, movimientos, rechazada), [candidatura, movimientos, rechazada])


  // Las otras vacantes donde sigue (si allá se la rechazó en la sesión, ya no cuenta).
  const otras = OTRAS_DE(candidatura.personaId, candidatura.id).filter((otra) => sigueEnProceso(otra.id))

  const proceso = etapas ?? vacante.etapas
  const paso = proceso.findIndex((una) => una.id === etapa) + 1
  // A dónde lleva «Avanzar»: el botón lo dice con su nombre. Antes decía «Mover de etapa» y había que abrirlo para
  // saber a dónde.
  const siguiente = siguienteEtapaDe(proceso, etapa)

  const diasAqui = candidatura.dias === 1 ? '1 día' : `${candidatura.dias} días`
  const etapaActual = proceso[paso - 1]
  const postulacion = perfil.historial.find((una) => una.actual)

  return (
    <PerfilCandidato
      perfil={perfil}
      candidatura={candidatura}
      pestanaInicial={pestanaInicial}
      // En el historial de vacantes, la otra candidatura viva de la misma persona se abre desde su fila, donde la
      // pantalla sabe abrirla.
      accionesPostulacion={
        onIrA
          ? (postulacion) =>
              postulacion.candidaturaId && !postulacion.actual ? (
                <Button variant="outline" size="sm" onClick={() => onIrA(postulacion.candidaturaId as string)}>
                  Abrir esa candidatura
                </Button>
              ) : null
          : undefined
      }
      // Quién es (la cara, el nombre y dónde vive) va en la cabecera del panel, no aquí (13 oct, reunión con la PM y el TL:
      // sin «Candidatura» ni el nombre de la vacante, que ya se sabe, y sin cargo, empresa ni años de experiencia, que no
      // dicen en qué). Debajo, el contacto: correo y celular, lo que más se usa.
      // Las decisiones, fijas abajo en todas las pestañas, como la barra de la exploración 3.
      pie={
        <div className="@container flex shrink-0 flex-wrap items-center gap-2 border-t bg-card px-5 py-3 in-data-[slot=drawer-popup]:bg-popover">
          {rechazada && !bloqueo ? (
            <PieRechazada rechazada={rechazada} onReconsiderar={onReconsiderar} onEscribir={onEscribirRechazo} />
          ) : bloqueo ? (
            // Vacante cerrada: en lugar de las decisiones, por qué no hay y la salida.
            <>
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <HugeiconsIcon icon={SquareLock02Icon} size={16} className="shrink-0 text-muted-foreground" aria-hidden />
                <Text as="span" size="sm" variant="muted">
                  {bloqueo.corto}.
                </Text>
              </span>
              {bloqueo.onReabrir ? (
                <Button variant="outline" onClick={bloqueo.onReabrir}>
                  Reabrir la vacante
                </Button>
              ) : null}
            </>
          ) : (
            <>
              <MasDeLaFicha candidatura={candidatura} onQuitar={onQuitar} />
              {/* En el celular el pie cabe en una fila: «Rechazar» queda en su icono y «Avanzar» sin el nombre de la etapa,
                  que sí dice al lector de pantalla (CA-33). */}
              <Button variant="outline" onClick={onRechazar} aria-label="Rechazar">
                <HugeiconsIcon icon={Cancel01Icon} size={16} />
                <span className="@max-sm:sr-only">Rechazar</span>
              </Button>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                {onElegirEtapa ? <SelectorEtapa actual={etapa} onElegir={onElegirEtapa} comoAccion /> : null}
                <Button onClick={onAvanzar} disabled={!siguiente} aria-label={siguiente ? `Avanzar a ${tituloEtapa(siguiente)}` : undefined}>
                  {siguiente ? (
                    <span>
                      Avanzar<span className="@max-sm:hidden"> a {tituloEtapa(siguiente)}</span>
                    </span>
                  ) : (
                    'Está en la última etapa'
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      }
    >
      {/* «Resumen»: los mismos bloques que las demás pestañas de la ficha (Información, Etapas, Vacantes), cada uno con
          su título, su dato a la derecha y su contenido en blanco (25 sep, Nicolás: «lo que se muestra debajo de la tab
          de resumen… se ve horrible»).
          29 sep, reunión con Elkin: «está muy saturado… no toda la información la van a leer». Queda lo que hace falta
          para decidir, en ese orden: lo que espera de ti (arriba, como alerta), dónde va y de qué trata esa etapa, cómo
          le fue con la IA, si cumple, lo que pide, cómo llegó y lo último que anotó el equipo. Salieron la trayectoria
          y la entrevista de Serena completa: viven en «Experiencia» y en «Etapas», y aquí se repetían. */}
      <div className="flex flex-col gap-4">
        {/* ── Lo que espera de ti ── */}
        {/* Lo que dice su ficha de la base llega también aquí (CA-05): no se le escribe desde la vacante. */}
        {baseDeCandidatos.deId(candidatura.personaId)?.noContactar ? (
          <Alert>
            <HugeiconsIcon icon={MailBlock01Icon} size={16} />
            <AlertTitle>Pidió no recibir correos</AlertTitle>
            <AlertDescription>
              No se le escribe desde aquí: ni recordatorios ni el correo al moverla o rechazarla. Si hace falta, llámala.
            </AlertDescription>
          </Alert>
        ) : null}
        {rechazada ? null : <AlertaPendiente candidatura={candidatura} onInvitar={onInvitar} />}
        {/* Su paso por la empresa, dicho igual que en la tarjeta (CA-09). */}
        {pasoPorLaEmpresa(candidatura.personaId, candidato.cargo) ? (
          <Alert variant="info">
            <HugeiconsIcon icon={Building03Icon} size={16} />
            <AlertTitle>{pasoPorLaEmpresa(candidatura.personaId, candidato.cargo)?.titulo}</AlertTitle>
            <AlertDescription>{pasoPorLaEmpresa(candidatura.personaId, candidato.cargo)?.detalle}</AlertDescription>
          </Alert>
        ) : null}
        {/* ── Fuera del proceso ── Por qué, quién, cuándo y si le llegó el correo. */}
        {rechazada ? <BloqueRechazo rechazada={rechazada} movimientos={movimientos} /> : null}
        {/* ── Dónde va ── Con lo que se hace en esa etapa: quien llega desde el tablero no siempre recuerda de qué
            trata (29 sep, Nicolás en la reunión). */}
        {paso > 0 ? (
          <Marco
            titulo={tituloEtapa(etapa)}
            descripcion={
              <>
                {/* Los días van en la alerta de arriba cuando espera algo de ti: aquí no se repiten (13 oct). */}
                {rechazada
                  ? `Etapa ${paso} de ${proceso.length} · aquí se quedó`
                  : candidato.accion
                    ? `Etapa ${paso} de ${proceso.length}`
                    : `Etapa ${paso} de ${proceso.length} · lleva ${diasAqui} aquí`}
                {etapaActual?.descripcion ? `. ${etapaActual.descripcion.replace(/\.$/, '')}.` : null}
              </>
            }
          >
            {/* La línea de etapas (8 oct, VP de producto: «los timelines son bien importantes»). Tocar una abre lo que pasó
                en ella, en la misma ficha y con «Volver»; cambiar de etapa se hace con los botones de abajo. */}
            {postulacion ? (
              <FramePanel className="flex flex-col gap-3">
                <LineaDeEtapas postulacion={postulacion} abrir />
                {/* Dicho, no escondido: que cada etapa se abre no se adivina mirando la línea. */}
                <Text as="span" variant="muted" size="xs" className="text-center">
                  Toca una etapa para ver lo que pasó en ella: su evaluación y los comentarios del equipo.
                </Text>
              </FramePanel>
            ) : null}
            {/* El último cambio de etapa y cómo va su entrevista con la IA (el rastro completo está en «Etapas»). */}
            {rechazada ? null : <LineasMovimiento candidatura={candidatura} etapas={proceso} movimientos={movimientos} />}
            {/* Dónde más está la persona: una línea por vacante, en su propio renglón del bloque. */}
            {otras.map((otra) => (
              <FramePanel key={otra.id} className="flex items-center gap-2.5 py-3!">
                <HugeiconsIcon icon={UserAdd01Icon} size={16} className="shrink-0 text-muted-foreground" aria-hidden />
                <Text as="span" size="sm">
                  También está en{' '}
                  <Button variant="link" size="sm" className="h-auto! p-0!" onClick={() => (onIrA ? onIrA(otra.id) : notify(otra.vacante.titulo, undefined, 'info'))}>
                    {otra.vacante.titulo} · {tituloEtapa(otra.etapa)}
                  </Button>
                </Text>
              </FramePanel>
            ))}
          </Marco>
        ) : null}

        {/* Sin «Puntajes de la IA» ni el «cumple / no cumple» que se corregía a mano (8 oct, VP de producto): el puntaje
            de cada etapa está dentro de ella, y la lectura del CV es la de Serena, en texto. */}
        {/* «Lo que pide» (salario, cuándo puede empezar, si se reubica) pasó a «Datos» (13 oct, PM: «eso no lo dejaría en
            el resumen; lo metería en los datos, porque acá ya está asociado a una vacante específica»). */}

        {/* ── Cómo llegó ── Solo si entró por un lote de hojas de vida. */}
        <BloqueImportada candidatura={candidatura} />

        {/* ── Notas del equipo ── Las de la persona y la más reciente de sus etapas, en un solo bloque. */}
        <NotasDelEquipo candidatura={candidatura} personaId={perfil.id} postulacionId={postulacion?.id} />
      </div>
    </PerfilCandidato>
  )
}

// Lo que la persona espera de ti, arriba de todo en «Resumen» (29 sep, reunión con Elkin: «si tiene alguna acción manual
// pendiente, sería bacano tenerla ahí presente inicialmente como tipo alerta»). Cuando la acción se hace desde la ficha,
// trae su botón: revisar la hoja de vida, ver la evaluación, o escribirle (recordarle la entrevista, reenviar la
// invitación, pedirle un papel).
// - La entrevista con Serena dice cuándo salió la invitación, cuándo vence y qué pasa al vencer (CA-15); vencida, se
//   reenvía con siete días más, como en el inicio.
// - Antes de escribirle se ve el correo tal como le llega (CA-47). Lo enviado queda en su historial: «Le escribiste» no
//   se borra al cerrar la ficha ni deja mandarlo dos veces sin saberlo.
// - Si pidió no recibir correos, no se le escribe desde aquí y se dice (CA-05).
type Escrito = { titulo: string; asunto: string; texto: string; reenvio?: boolean }

function AlertaPendiente({ candidatura, onInvitar }: { candidatura: Candidatura; onInvitar?: () => void }) {
  const navegar = useNavegarFicha()
  const movimientos = useMovimientos(candidatura.id)
  // Entró a una etapa con IA sin invitación: lo que espera es que se la envíen (13 oct, PM).
  const sinInvitacion = useSinInvitacion(candidatura)
  useExpedienteDeSesion()
  const [escribiendo, setEscribiendo] = useState<Escrito | null>(null)
  const { candidato, etapa, dias, vacante } = candidatura
  const accion = candidato.accion
  const noContactar = Boolean(baseDeCandidatos.deId(candidatura.personaId)?.noContactar)
  const correos = movimientos.filter((movimiento) => movimiento.tipo === 'correo' && movimiento.aviso)
  const ultimo = correos[correos.length - 1]
  // Reenviar la invitación hace empezar el plazo otra vez.
  const reenvio = [...correos].reverse().find((movimiento) => /reenviamos la invitación/i.test(movimiento.aviso ?? ''))
  if (sinInvitacion) return <AvisoSinInvitacion candidatura={candidatura} onInvitar={onInvitar} />
  if (!accion) return null
  const nombre = candidato.nombre.split(' ')[0]
  const cuanto = dias === 1 ? '1 día' : `${dias} días`
  const deSerena = /serena/i.test(accion)
  // La entrevista que se cortó a la mitad (CA-37): se la invita a terminarla, desde donde iba.
  const cortada = /sin terminar/i.test(accion) ? candidato.entrevistaSinTerminar : undefined
  const desdeInvitacion = reenvio ? Math.floor((Date.now() - reenvio.cuando) / 86_400_000) : dias
  const venceEn = PLAZO_ENTREVISTA - desdeInvitacion
  // Como en el inicio: al cumplir el plazo, la invitación ya venció («venció hoy»).
  const vencida = deSerena && venceEn <= 0
  const invitadaATerminar = cortada && correos.some((movimiento) => movimiento.aviso === ASUNTO_TERMINAR)
  const titulo = vencida
    ? 'Se venció su invitación a Serena AI'
    : reenvio && deSerena
      ? 'Le reenviaste la invitación a Serena AI'
      : invitadaATerminar
        ? 'Le enviaste la invitación para terminar la entrevista'
        : cortada
          ? 'Su entrevista con Serena AI quedó sin terminar'
          : accion
  // «Sin revisar hace 6 días» ya dice el tiempo: no se repite.
  const detalle = cortada
    ? `Respondió ${cortada.respondidas} de ${cortada.de} preguntas: ${cortada.motivo.toLowerCase()}. Sin terminar no tiene puntaje. ${
        invitadaATerminar ? 'Retoma' : 'Invítala a terminarla: retoma'
      } en la pregunta ${cortada.respondidas + 1}, con ${PLAZO_ENTREVISTA} días para presentarla.`
    : deSerena
    ? vencida
      ? `La invitación salió el ${fechaSinAnio(isoHaceDias(desdeInvitacion))} y venció ${
          venceEn === 0 ? 'hoy' : `el ${fechaSinAnio(isoHaceDias(-venceEn))}`
        }. Reenvíala con ${PLAZO_ENTREVISTA} días más, o recházala por «Entrevista expirada».`
      : `La invitación salió el ${fechaSinAnio(isoHaceDias(desdeInvitacion))} y vence el ${fechaSinAnio(isoHaceDias(-venceEn))} (${
          venceEn === 1 ? 'mañana' : `en ${venceEn} días`
        }). Si se vence, sale del proceso con el motivo «Entrevista expirada».`
    : /hace \d+ d[ií]as/.test(accion)
      ? 'Espera una respuesta tuya.'
      : `Espera una respuesta tuya desde hace ${cuanto}.`

  const correo: Escrito | null = deSerena
    ? vencida
      ? {
          titulo: 'Reenviar la invitación',
          asunto: 'Te reenviamos la invitación a la entrevista con Serena AI',
          texto: `Hola, {nombre}:\n\nTe reenviamos el enlace para presentar la entrevista con Serena AI para «{vacante}». Tienes ${PLAZO_ENTREVISTA} días a partir de hoy; dura unos 15 minutos y la haces cuando quieras.`,
          reenvio: true,
        }
      : {
          titulo: 'Recordarle la entrevista',
          asunto: 'Te recordamos tu entrevista con Serena AI',
          texto: `Hola, {nombre}:\n\nTe recordamos que tienes pendiente la entrevista con Serena AI para «{vacante}». Puedes presentarla hasta el ${fechaSinAnio(
            isoHaceDias(-venceEn),
          )}; dura unos 15 minutos y la haces cuando quieras desde el enlace de la invitación.`,
        }
    : /antecedentes/i.test(accion)
      ? {
          titulo: 'Pedirle el certificado',
          asunto: 'Necesitamos tu certificado de antecedentes',
          texto: 'Hola, {nombre}:\n\nPara seguir con tu proceso en «{vacante}» necesitamos tu certificado de antecedentes judiciales vigente. Puedes subirlo desde el enlace de tu postulación.',
        }
      : null
  const boton: { texto: string; hacer: () => void } | null = /sin CV|no se pudo leer/i.test(accion)
    ? { texto: /no se pudo/i.test(accion) ? 'Subir otra versión' : 'Subir su CV', hacer: () => navegar('documentos') }
    : /sin revisar/i.test(accion)
    ? { texto: 'Revisar su CV', hacer: () => navegar('hoja-de-vida') }
    : /assessment|evaluaci/i.test(accion)
      ? { texto: 'Ver su evaluación', hacer: () => navegar('etapas', etapa) }
      : correo
        ? { texto: correo.titulo, hacer: () => setEscribiendo(correo) }
        : null
  const escribioHoy = ultimo && Date.now() - ultimo.cuando < 86_400_000

  const enviar = (escrito: Escrito) => {
    if (noSeGuardo(`ficha-correo:${candidatura.id}:${escrito.asunto}`, `No pudimos escribirle a ${nombre}`, () => enviar(escrito), 'No salió ningún correo.')) {
      setEscribiendo(null)
      return
    }
    const movimiento: Movimiento = {
      id: `ficha-correo-${candidatura.id}-${Date.now()}`,
      tipo: 'correo',
      candidaturaId: candidatura.id,
      desde: etapa,
      hacia: etapa,
      cuando: Date.now(),
      dias,
      quien: QUIEN_MUEVE,
      saltadas: [],
      aviso: escrito.asunto,
    }
    registroDeMovimientos.agregar([movimiento])
    const deshacerCorreo = anotarCorreo([candidatura.personaId], escrito.asunto)
    setEscribiendo(null)
    notifyAction(
      escrito.reenvio ? `Le reenviamos la invitación a ${nombre}` : `Le escribimos a ${nombre}`,
      escrito.reenvio ? `Tiene ${PLAZO_ENTREVISTA} días para presentarla.` : 'Le llega en unos segundos.',
      {
        label: 'Deshacer',
        onClick: () => {
          registroDeMovimientos.quitar([movimiento.id])
          deshacerCorreo()
        },
      },
      'success',
    )
  }

  return (
    <>
      <Alert variant="warning">
        <HugeiconsIcon icon={Alert02Icon} size={16} />
        <AlertTitle>{titulo}</AlertTitle>
        <AlertDescription>
          {detalle}
          {noContactar ? ' Pidió no recibir correos: no se le escribe desde aquí.' : ''}
          {ultimo ? ` Le escribiste ${escribioHoy ? `hoy a las ${horaDe(ultimo.cuando)}` : 'antes'}: «${ultimo.aviso}»${correos.length > 1 ? ` (${correos.length} correos en total)` : ''}.` : ''}
        </AlertDescription>
        {cortada ? (
          <AlertAction>
            <InvitarATerminar candidaturaId={candidatura.id} desde={cortada.respondidas + 1} />
          </AlertAction>
        ) : boton ? (
          <AlertAction>
            {correo && boton.texto === correo.titulo && noContactar ? (
              <Badge variant="secondary">
                <HugeiconsIcon icon={MailBlock01Icon} size={12} aria-hidden />
                No recibe correos
              </Badge>
            ) : (
              <Button variant="outline" size="sm" onClick={boton.hacer}>
                {correo && boton.texto === correo.titulo && escribioHoy && !correo.reenvio ? `${boton.texto} otra vez` : boton.texto}
              </Button>
            )}
          </AlertAction>
        ) : null}
      </Alert>
      {escribiendo ? (
        <VentanaDeAccion
          open
          onOpenChange={(abierto) => !abierto && setEscribiendo(null)}
          title={`${escribiendo.titulo} a ${nombre}`}
          sub={escribioHoy ? `Ya le escribiste hoy a las ${horaDe(ultimo.cuando)}: «${ultimo.aviso}».` : `Le llega a ${candidato.correo}.`}
          note="Queda en su historial, con tu nombre."
          confirmLabel={escribiendo.reenvio ? 'Reenviar la invitación' : 'Enviar el correo'}
          pendingLabel="Enviando…"
          onConfirm={() => enviar(escribiendo)}
        >
          <VistaPreviaCorreo texto={escribiendo.texto} asunto={escribiendo.asunto} datos={{ nombre, vacante: vacante.titulo, etapa: tituloEtapa(etapa) }} />
        </VentanaDeAccion>
      ) : null}
    </>
  )
}

// «⋯» de la ficha, el primero de la fila: lo que se usa poco. Copiar el enlace a su ficha (para compartirla con alguien
// del equipo) y eliminarla de esta vacante (13 oct, PM: «eliminar de la vacante; eliminar candidato ya sería de la base,
// desde Mis candidatos»). Eliminar a la persona de toda la plataforma se hace en Mis candidatos.
function MasDeLaFicha({ candidatura, onQuitar }: { candidatura: Candidatura; onQuitar?: () => void }) {
  const [quitando, setQuitando] = useState(false)
  const nombre = candidatura.candidato.nombre
  return (
    <>
      <DropdownMenu>
        <Hint label="Más acciones">
          <DropdownMenuTrigger render={<BotonIcono size="icon" aria-label={`Más acciones con ${nombre}`} />}>
            <HugeiconsIcon icon={MoreHorizontalIcon} size={18} aria-hidden="true" />
          </DropdownMenuTrigger>
        </Hint>
        <DropdownMenuContent align="start">
          <DropdownMenuItem
            onClick={() => {
              void navigator.clipboard?.writeText(`${window.location.origin}${window.location.pathname}?persona=${encodeURIComponent(candidatura.id)}`)
              notify('Copiamos el enlace a su ficha', undefined, 'success')
            }}
          >
            <HugeiconsIcon icon={Link01Icon} size={16} />
            Copiar el enlace a su ficha
          </DropdownMenuItem>
          {onQuitar ? (
            <DropdownMenuItem variant="destructive" onClick={() => setQuitando(true)}>
              <HugeiconsIcon icon={Delete02Icon} size={16} />
              Eliminar de la vacante
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      {onQuitar ? (
        <VentanaDeAccion
          open={quitando}
          onOpenChange={setQuitando}
          size="sm"
          title="Eliminar de la vacante"
          lead={nombre}
          sub={`Sale de «${candidatura.vacante.titulo}» sin que le llegue ningún correo. Sigue en tu base y en sus otras vacantes.`}
          footer={
            <>
              <Button variant="outline" onClick={() => setQuitando(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setQuitando(false)
                  onQuitar()
                }}
              >
                <HugeiconsIcon icon={Delete02Icon} size={16} />
                Eliminar de la vacante
              </Button>
            </>
          }
        />
      ) : null}
    </>
  )
}

// Las notas del equipo, en un solo bloque (13 oct, información repetida: la nota sobre la persona salía dos veces, en «Lo
// último del equipo» y en «Notas generales»). Arriba las que son sobre la persona, que no viven en ninguna etapa y no se
// mudan al moverla; debajo, la más reciente de sus etapas, con el atajo para leerla donde se escribió (las demás están ahí).
function NotasDelEquipo({ candidatura, personaId, postulacionId }: { candidatura: Candidatura; personaId: string; postulacionId?: string }) {
  const navegar = useNavegarFicha()
  // Con lo que comentó el equipo en la sesión, en cualquier etapa de esta vacante (CA-22).
  useExpedienteDeSesion()
  const deLaSesion = postulacionId
    ? expedienteDeSesion.comentariosDePostulacion(personaId, postulacionId).map(({ nota, etapa }) => ({ ...nota, etapa: etapa as Nota['etapa'] }))
    : []
  const notas = [...candidatura.candidato.notas, ...deLaSesion]
  if (!notas.length) return null
  const generales = notas.filter((nota) => !nota.etapa)
  const deEtapas = notas.filter((nota) => nota.etapa)
  const ultima = deEtapas.length ? deEtapas.reduce((mas, una) => (una.id > mas.id ? una : mas)) : null
  const descripcion = [
    generales.length ? `${generales.length} sobre la persona` : null,
    deEtapas.length === 1 ? '1 en sus etapas' : deEtapas.length ? `la más reciente de ${deEtapas.length} en sus etapas` : null,
  ]
    .filter(Boolean)
    .join(' · ')
  return (
    <Marco
      titulo="Notas del equipo"
      descripcion={descripcion.charAt(0).toUpperCase() + descripcion.slice(1)}
      accion={
        ultima ? (
          <Button variant="ghost" size="sm" className="shrink-0" onClick={() => navegar('etapas', ultima.etapa ?? candidatura.etapa)}>
            Ver en su etapa
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
          </Button>
        ) : undefined
      }
    >
      {generales.length ? (
        <FramePanel>
          <ListaNotas notas={generales} vacia="" />
        </FramePanel>
      ) : null}
      {ultima ? (
        <FramePanel className="flex flex-col gap-1">
          <Text as="span" variant="muted" size="xs">
            En {tituloEtapa(ultima.etapa ?? candidatura.etapa)}
          </Text>
          <Text as="span" size="sm" weight="medium">
            {ultima.autor}{' '}
            <Text as="span" variant="muted" size="xs" weight="normal">
              · {ultima.fecha}
            </Text>
          </Text>
          <Text as="p" variant="muted" size="sm">
            {ultima.texto}
          </Text>
        </FramePanel>
      ) : null}
    </Marco>
  )
}
