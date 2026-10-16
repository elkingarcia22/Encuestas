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
import { CeldaCifra } from '@/modules/admin/inicio/components/bloques'
import { notify, notifyAction } from '@/shared/components/notify'
import { VentanaDeAccion } from '@/modules/design-system/drawers/components/drawer-anidado'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { useNavigate } from 'react-router'
import { fechaSinAnio, isoHaceDias } from '@/modules/design-system/patrones/formato'
import { anotarCorreo, baseDeCandidatos } from '../base'
import { VistaPreviaCorreo } from './vista-previa-correo'
import { ASUNTO_TERMINAR, InvitarATerminar } from './invitar-a-terminar'
import { Marco } from '../../vacantes/detalle/candidato/components/piezas'
import { disponible, pesos, type Nota } from '../../vacantes/detalle/components/data'
import { horaDe, perfilDeCandidatura } from '../perfil-candidato'
import { expedienteDeSesion, useExpedienteDeSesion } from '../expediente-sesion'
import { QUIEN_MUEVE, registroDeMovimientos, sigueEnProceso, useMovimientos, type Movimiento } from '../movimientos'
import { quienDe } from '../rechazos'
import { BloqueImportada } from './bloque-importada'
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
}: {
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

  // Lo que no ha dicho no se inventa (CA-25).
  const pideSinDecir = candidato.sinDeclarar?.includes('pretension')
  const empiezaSinDecir = candidato.sinDeclarar?.includes('disponibilidad')
  const dentroDelRango = pideSinDecir || candidato.pretension <= vacante.rango[1]
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
      cabecera={
        // Quién es, en una sola pieza y sin cajas (25 sep, Nicolás: «unas cosas como sí y otras no»): el nombre manda,
        // debajo lo que hace y, en una línea tenue, de dónde es, cuánta experiencia trae y cómo llegó. El contacto va
        // justo debajo, como botones que copian o abren.
        // En el celular sin la foto y sin cortar nada: el cargo y los años se leen completos (CA-33).
        <div className="flex items-start gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            {/* Fuera del proceso, la etiqueta va junto al nombre: se ve en todas las pestañas, no solo en «Resumen» (1 oct). */}
            <div className="flex min-w-0 items-center gap-2">
              <Text as="div" size="xl" weight="semibold" className="min-w-0 break-words">
                {candidato.nombre}
              </Text>
              {rechazada ? (
                <Badge variant="destructive-outline" className="shrink-0">
                  {quienDe(rechazada) === 'candidato' ? 'Se retiró' : 'Rechazada'}
                </Badge>
              ) : null}
            </div>
            <Text as="div" size="sm">
              {candidato.cargo} en {candidato.empresa}
            </Text>
            <Text as="div" variant="muted" size="sm">
              {candidato.ciudad} · {candidato.anios === 1 ? '1 año' : `${candidato.anios} años`} de experiencia ·{' '}
              {candidatura.importada
                ? `Entró con un lote (${candidatura.importada.origen.toLowerCase()})`
                : candidato.origen === 'Agregado a mano'
                  ? 'Agregado a mano por el equipo'
                  : 'Aplicó por el portal de empleo'}
            </Text>
          </div>
        </div>
      }
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
              <MasDeLaFicha candidatura={candidatura} />
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
        {rechazada ? null : <AlertaPendiente candidatura={candidatura} />}
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
                {rechazada ? `Etapa ${paso} de ${proceso.length} · aquí se quedó` : `Etapa ${paso} de ${proceso.length} · lleva ${diasAqui} aquí`}
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
        {/* ── Lo que pide ── Tres cifras, como las del resto del producto. */}
        <Marco
          titulo="Lo que pide"
          descripcion="Frente a lo que ofrece la vacante."
          accion={
            dentroDelRango ? null : (
              <Badge variant="warning-light" className="shrink-0">
                Pide más que el tope
              </Badge>
            )
          }
        >
          <FramePanel className="@container">
            <div className="grid gap-4 @md:grid-cols-3">
              <CeldaCifra
                cifra={{
                  etiqueta: 'Salario',
                  valor: pideSinDecir ? 'No lo ha dicho' : pesos(candidato.pretension),
                  // Corto, para que quepa en una línea en el panel: si pide más, el aviso ámbar ya lo dice arriba.
                  detalle: pideSinDecir
                    ? `Pregúntaselo. Rango: ${pesos(vacante.rango[0])} – ${pesos(vacante.rango[1])}`
                    : dentroDelRango
                      ? `Rango: ${pesos(vacante.rango[0])} – ${pesos(vacante.rango[1])}`
                      : `Tope: ${pesos(vacante.rango[1])}`,
                }}
              />
              <CeldaCifra
                cifra={{
                  etiqueta: 'Puede empezar',
                  valor: empiezaSinDecir ? 'No lo ha dicho' : disponible(candidato.disponibilidad),
                  detalle: empiezaSinDecir ? 'Pregúntaselo' : 'desde que acepte',
                }}
              />
              <CeldaCifra
                cifra={{
                  etiqueta: 'Experiencia',
                  valor: candidato.anios === 1 ? '1 año' : `${candidato.anios} años`,
                  detalle: `hoy: ${candidato.cargo.toLowerCase()}`,
                }}
              />
            </div>
          </FramePanel>
        </Marco>

        {/* ── Cómo llegó ── Solo si entró por un lote de hojas de vida. */}
        <BloqueImportada candidatura={candidatura} />

        {/* ── Lo último del equipo ── Una nota, la más reciente: las demás están en su etapa, en «Etapas». */}
        <UltimaNota candidatura={candidatura} personaId={perfil.id} postulacionId={postulacion?.id} />
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

function AlertaPendiente({ candidatura }: { candidatura: Candidatura }) {
  const navegar = useNavegarFicha()
  const movimientos = useMovimientos(candidatura.id)
  useExpedienteDeSesion()
  const [escribiendo, setEscribiendo] = useState<Escrito | null>(null)
  const { candidato, etapa, dias, vacante } = candidatura
  const accion = candidato.accion
  const noContactar = Boolean(baseDeCandidatos.deId(candidatura.personaId)?.noContactar)
  const correos = movimientos.filter((movimiento) => movimiento.tipo === 'correo' && movimiento.aviso)
  const ultimo = correos[correos.length - 1]
  // Reenviar la invitación hace empezar el plazo otra vez.
  const reenvio = [...correos].reverse().find((movimiento) => /reenviamos la invitación/i.test(movimiento.aviso ?? ''))
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
      ? `Espera una respuesta tuya. Está en ${tituloEtapa(etapa)}.`
      : `Espera una respuesta tuya. Lleva ${cuanto} en ${tituloEtapa(etapa)}.`

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

// «⋯» de la ficha, el primero de la fila: lo que se usa poco. Borrar los datos de alguien (habeas data) se hace en su
// ficha de «Mis candidatos», porque la saca de todas las vacantes y de la base: desde aquí se dice y se lleva allá (CA-18).
function MasDeLaFicha({ candidatura }: { candidatura: Candidatura }) {
  const navigate = useNavigate()
  const [borrando, setBorrando] = useState(false)
  const nombre = candidatura.candidato.nombre
  const otras = OTRAS_DE(candidatura.personaId, candidatura.id).filter((otra) => sigueEnProceso(otra.id))
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
          <DropdownMenuItem variant="destructive" onClick={() => setBorrando(true)}>
            <HugeiconsIcon icon={Delete02Icon} size={16} />
            Eliminar sus datos…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <VentanaDeAccion
        open={borrando}
        onOpenChange={setBorrando}
        title={`Eliminar los datos de ${nombre}`}
        sub="Cuando la persona lo pide (habeas data), sus datos se borran de toda la plataforma, no solo de esta vacante."
        note="Se hace desde su ficha en Mis candidatos."
        confirmLabel="Ir a su ficha en Mis candidatos"
        onConfirm={() => navigate(`/admin/seleccion/candidatos/dos?persona=${encodeURIComponent(candidatura.personaId)}`)}
      >
        <Text as="p" size="sm">
          Sale de «{candidatura.vacante.titulo}»{otras.length ? ` y de ${otras.length === 1 ? 'su otra vacante' : `sus otras ${otras.length} vacantes`}` : ''}, y de tu base.
          Allá ves todo lo que se borra antes de confirmar.
        </Text>
      </VentanaDeAccion>
    </>
  )
}

// La nota más reciente del equipo, con quién y cuándo; las demás se leen en «Etapas», en la etapa donde se escribieron.
function UltimaNota({ candidatura, personaId, postulacionId }: { candidatura: Candidatura; personaId: string; postulacionId?: string }) {
  const navegar = useNavegarFicha()
  // Con lo que comentó el equipo en la sesión, en cualquier etapa de esta vacante (CA-22).
  useExpedienteDeSesion()
  const deLaSesion = postulacionId
    ? expedienteDeSesion.comentariosDePostulacion(personaId, postulacionId).map(({ nota, etapa }) => ({ ...nota, etapa: etapa as Nota['etapa'] }))
    : []
  const notas = [...candidatura.candidato.notas, ...deLaSesion]
  if (!notas.length) return null
  const nota = notas.reduce((ultima, una) => (una.id > ultima.id ? una : ultima))
  return (
    <Marco
      titulo="Lo último del equipo"
      descripcion={notas.length === 1 ? '1 nota' : `La más reciente de ${notas.length} notas`}
      accion={
        <Button variant="ghost" size="sm" className="shrink-0" onClick={() => navegar('etapas', nota.etapa ?? candidatura.etapa)}>
          Ver en su etapa
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
        </Button>
      }
    >
      <FramePanel className="flex flex-col gap-1">
        <Text as="span" size="sm" weight="medium">
          {nota.autor}{' '}
          <Text as="span" variant="muted" size="xs" weight="normal">
            · {nota.fecha}
          </Text>
        </Text>
        <Text as="p" variant="muted" size="sm">
          {nota.texto}
        </Text>
      </FramePanel>
    </Marco>
  )
}
