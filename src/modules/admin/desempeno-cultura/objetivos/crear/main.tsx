import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, Rocket01Icon } from '@hugeicons/core-free-icons'
import { useBlocker, useLocation, useNavigate, useParams } from 'react-router'
import { Alert, AlertDescription, AlertTitle, Button, Text } from '@ubits/flux-ui'
import { BotonSalirCreacion, VentanaSalir } from '@/modules/design-system/navegacion/boton-salir-creacion'
import { DialogoConfirmar, RegistroConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { notify, notifyAction } from '@/shared/components/notify'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { nombreRepetido } from '../../encuestas/components/demograficos/nombre-repetido'
import { inicioVencidoEnBorrador } from '../../encuestas/modelo/inicio-vencido'
import { OPENING_SOON_DAYS as DIAS_AVISO_SIN_PARTICIPANTES } from '../../encuestas/modelo/riesgos'
import { startOfToday } from '../../encuestas/modelo/surveyListDates'
import { setRightPanelOpen } from '@/shared/components/right-panel-store'
import { useRecorteBajoEncabezado, contenedorDeScroll } from '@/shared/components/encabezado-fijo'
import { ChipGuardado, type EstadoGuardado } from '@/shared/components/ChipGuardado'
import { useHuecoDerecho, usePantallaGrande } from '@/modules/admin/seleccion/vacantes/detalle/components/agente-acoplado'
import { AgentDock } from '@/modules/design-system/agente-contextual/components/agent-kit'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { PasoParticipantes } from '../../encuestas/crear/components/paso-participantes'
import { formatCount, totalParticipantCount } from '../../encuestas/modelo/participants'
import { COLLABORATORS } from '../../encuestas/modelo/collaborators'
import { cicloPorId, guardarCiclo, useCiclos } from '../components/almacen'
import { borradorDeCiclo, borradorDesdeCarga, cicloDeBorrador, createBlankCicloDraft } from '../modelo/borrador'
import type { DatosCargaCiclo } from '../modelo/carga/carga-objetivos'
import { CICLO_PARTICIPANTS_DESCRIPTIONS, assignedObjectiveCount, type CicloBuilderAssignmentSeed, type CicloDraft, type ObjectiveSetKind } from '../modelo/constructor/cicloBuilderTypes'
import { resumeCicloStep, visitedStepsUpTo } from '../modelo/constructor/cicloStepper'
import { PasoParametrizacion } from './components/parametrizacion/paso-parametrizacion'
import { PasoEmpresa } from './components/empresa/paso-empresa'
import { PasoAsignados } from './components/asignados/paso-asignados'
import { PasoAlineacion } from './components/alineacion/paso-alineacion'
import { PanelObjetivosIa } from './components/ia/panel-objetivos-ia'
import type { PedidoIa } from './components/ia/pedido'
import { estadoDelBorrador, etiquetaFinal, faltaEn, indiceDe, pasoAlcanzable, pasoCompleto, pasoDe, primerPendiente, resumenFinalizar, type PasoId } from './components/pasos'
import { ResumenCiclo } from './components/resumen-ciclo'
import { nivelPorParticipantes, segmentoDeGrupos } from '../modelo/constructor/participantesCiclo'
import { levelsForAssignment } from '../modelo/constructor/cicloSetup'
import { BarraPasos } from '@/modules/design-system/navegacion/barra-pasos'
import { PasosFila } from '@/modules/design-system/navegacion/pasos-fila'

// El constructor de ciclos de objetivos, armado igual que «Crear encuesta» y «Crear vacante»: los pasos en una fila
// arriba, el trabajo a la izquierda, el panel «Así va el ciclo» a la derecha y la barra de acciones fija abajo, con el
// autoguardado, el freno de salida y los mismos avisos. Lo que cambia es el recorrido: lo decide la parametrización
// (paso 1). RRHH escribe y reparte los objetivos hasta la alineación y termina con «Crear ciclo»; con líderes,
// colaboradores u otros, el administrador elige a la gente, escribe el norte y termina con «Lanzar ciclo».
//
// Se abre en blanco, desde una plantilla (los objetivos de empresa entran puestos y los de grupo e individuales esperan
// destinatario en el paso de objetivos asignados), para editar un ciclo de la lista (retoma donde se dejó) o directo en
// un paso (participantes, u objetivos con su pestaña).

const RUTA_OBJETIVOS = '/admin/desempeno-cultura/objetivos'
const SEGUNDOS_AUTOGUARDADO = 3
const MS_GUARDANDO = 700

type Pedido = { paso?: PasoId; pestana?: 'groups' | 'individual'; datosCarga?: DatosCargaCiclo } | null

interface Inicio {
  borrador: CicloDraft
  semillas: readonly CicloBuilderAssignmentSeed[]
}

function inicioDe(id: string | undefined, datosCarga?: DatosCargaCiclo): Inicio {
  if (id) {
    const ciclo = cicloPorId(id)
    if (ciclo) return { borrador: borradorDeCiclo(ciclo), semillas: [] }
  }
  if (datosCarga) {
    return borradorDesdeCarga(datosCarga)
  }
  return { borrador: createBlankCicloDraft(), semillas: [] }
}

// Guarda el ciclo en la lista (lo crea o reemplaza el que se editaba): como borrador mientras se autoguarda y, con
// `publicar` (al finalizar o lanzar), como «Por iniciar». Uno que ya está en marcha conserva su estado al editarlo. Uno
// nuevo sin nombre todavía no entra: sería una fila vacía en la lista.
function guardarEnLista(idLista: string, actual: CicloDraft, publicar = false) {
  const existente = cicloPorId(idLista)
  if (!existente && actual.name.trim() === '') return
  const sigueBorrador = !existente || existente.estado === 'Borrador'
  const status = publicar && sigueBorrador ? 'scheduled' : sigueBorrador ? 'draft' : actual.status
  guardarCiclo(cicloDeBorrador(idLista, { ...actual, status }, existente))
}

/** El aviso al terminar: RRHH crea el ciclo con lo que repartió; los demás lo lanzan y cada quien escribe lo suyo. */
function avisoFinal(borrador: CicloDraft, editando: boolean): [string, string] {
  const nombre = borrador.name.trim()
  if (editando) return ['Ciclo guardado', `Los cambios de «${nombre}» quedaron guardados.`]
  const creador = borrador.objectiveCreator
  if (creador && creador !== 'hr') {
    const quien = {
      leader: 'Los líderes recibirán una notificación para crear los objetivos de sus equipos.',
      collaborator: 'Cada colaborador recibirá una notificación para registrar sus propios objetivos.',
      custom: 'Cada persona elegida recibirá una notificación para registrar sus propios objetivos.',
    }[creador]
    return ['Ciclo lanzado', quien]
  }
  const objetivos = assignedObjectiveCount(borrador.objectiveSets)
  const asignaciones = borrador.objectiveSets.length
  return ['Ciclo creado', `${objetivos} ${objetivos === 1 ? 'objetivo repartido' : 'objetivos repartidos'} en ${asignaciones} ${asignaciones === 1 ? 'asignación' : 'asignaciones'}.`]
}

// Un enlace de edición de un ciclo que ya no está: no se abre en blanco (al guardar crearía
// otro ciclo). Se dice que no se encontró y se vuelve a la lista, como en Crear encuesta (CRE-008).
function NoEncontrado() {
  const navigate = useNavigate()
  return (
    <PageShell>
      <PageHeader back={{ label: 'Objetivos', to: RUTA_OBJETIVOS }} title="Editar ciclo" />
      <PageContent>
        <PrimeraVez
          className="py-16"
          icono="glass-search"
          titulo="No encontramos este ciclo"
          descripcion="Puede que se haya eliminado. Vuelve a la lista para elegir otro."
          accion={{ texto: 'Volver a objetivos', onClick: () => navigate(RUTA_OBJETIVOS) }}
        />
      </PageContent>
    </PageShell>
  )
}

// Un ciclo finalizado no se edita por ningún camino, como una encuesta finalizada: ya cerró y sus resultados no pueden
// cambiar. La lista no ofrece «Editar»; si se llega por la dirección, este vacío lo explica y lleva a sus resultados.
function Finalizado({ id }: { id: string }) {
  const navigate = useNavigate()
  return (
    <PageShell>
      <PageHeader back={{ label: 'Objetivos', to: RUTA_OBJETIVOS }} title="Editar ciclo" />
      <PageContent>
        <PrimeraVez
          className="py-16"
          icono="glass-lock"
          titulo="Este ciclo ya finalizó"
          descripcion="No se puede editar porque ya cerró y sus resultados no pueden cambiar. Puedes ver sus resultados o duplicarlo desde la lista para hacer uno nuevo."
          accion={{ texto: 'Ver resultados', onClick: () => navigate(`${RUTA_OBJETIVOS}/${id}/resultados`) }}
        />
      </PageContent>
    </PageShell>
  )
}

export function Component() {
  const { id } = useParams()
  if (id && !cicloPorId(id)) return <NoEncontrado />
  if (id && cicloPorId(id)?.estado === 'Finalizado') return <Finalizado id={id} />
  return <Constructor />
}

function Constructor() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const pedido = location.state as Pedido

  const [inicio] = useState(() => inicioDe(id, pedido?.datosCarga))
  const [borrador, setBorrador] = useState<CicloDraft>(inicio.borrador)
  const [semillas, setSemillas] = useState<readonly CicloBuilderAssignmentSeed[]>(inicio.semillas)
  // Dónde arranca: el paso pedido si está en el recorrido; si no, donde se dejó el borrador (o el primero que falta).
  const [paso, setPaso] = useState<PasoId>(() => {
    const entrada = estadoDelBorrador(inicio.borrador, new Set(), inicio.semillas)
    if (pedido?.paso && entrada.orden.includes(pedido.paso)) return pedido.paso
    return id ? resumeCicloStep(inicio.borrador._lastStep, entrada) : 'general'
  })
  const [visitados, setVisitados] = useState<ReadonlySet<PasoId>>(() => visitedStepsUpTo(paso, estadoDelBorrador(inicio.borrador, new Set(), inicio.semillas)))
  const [estadoGuardado, setEstadoGuardado] = useState<EstadoGuardado>('guardado')
  // Como en Crear contenido: el chip del guardado aparece cuando ya hay algo escrito; antes no hay nada que guardar.
  const [tocado, setTocado] = useState(Boolean(id) || Boolean(pedido?.datosCarga))
  // El guardado que falló, como en Crear encuesta (CRE-061): el chip se queda en «Cambios sin guardar», nunca dice
  // «Guardado», y no vuelve a intentar solo: espera a «Reintentar», junto al chip o en el aviso. Se ve con
  // `?simular=falla-guardar`: el primer guardado falla y el reintento sí guarda.
  const [falloGuardado, setFalloGuardado] = useState(false)
  const simulaFalla = new URLSearchParams(location.search).get('simular')?.split(',').includes('falla-guardar') ?? false
  const yaFallo = useRef(false)
  const [conErrores, setConErrores] = useState(false)
  const [fallidos, setFallidos] = useState<ReadonlySet<PasoId>>(() => new Set())
  const [descripcionActiva, setDescripcionActiva] = useState(() => borrador.description.trim() !== '')

  // El agente de IA acoplado a la derecha, para crear objetivos de la empresa o de una asignación.
  const [agente, setAgente] = useState<{ abierto: boolean; clave: number; pedido: PedidoIa } | null>(null)
  const grande = usePantallaGrande()
  const hueco = useHuecoDerecho()
  const acoplado = grande && agente?.abierto === true
  useEffect(() => {
    setRightPanelOpen(acoplado)
    return () => setRightPanelOpen(false)
  }, [acoplado])

  const [idNuevo] = useState(() => `ciclo-${Date.now()}`)
  const idEnLista = useRef(id ?? idNuevo)
  const [editando] = useState(() => (id ? cicloPorId(id)?.estado !== 'Borrador' : false))
  // En un ciclo en curso todos sus participantes ya llevan avance: quitar a alguien pregunta antes (como en Encuestas,
  // 21-oct), porque deja de contar en el progreso del ciclo y pierde el avance de sus objetivos.
  const [conAvance] = useState<ReadonlySet<string> | null>(() => (id && cicloPorId(id)?.estado === 'En curso' ? new Set(COLLABORATORS.map((persona) => persona.id)) : null))
  // Un ciclo nuevo sin nombre no entra a la lista (sería una fila vacía): mientras no esté en ella no hay nada guardado,
  // así que el chip no puede decir «Guardado» y el autoguardado no arranca (no hay a dónde guardar).
  const enLista = cicloPorId(idEnLista.current) !== undefined
  const sePuedeGuardar = enLista || borrador.name.trim() !== ''
  const estadoChip: EstadoGuardado = estadoGuardado === 'guardado' && !enLista ? 'editando' : estadoGuardado
  const saliendo = useRef(false)
  // Como en Crear encuesta (regla «salir-con-cambios»): sin cambios en esta visita se sale directo; con cambios, toda
  // salida (el botón, la barra lateral, «atrás») pasa por la ventana del sistema. «Crear ciclo» o «Lanzar ciclo» sale directo.
  const [cambiado, setCambiado] = useState(false)
  const bloqueoSalida = useBlocker(({ currentLocation, nextLocation }) => cambiado && !saliendo.current && currentLocation.pathname !== nextLocation.pathname)
  const salidaBloqueada = bloqueoSalida.state === 'blocked' ? bloqueoSalida : null
  // Otro ciclo ya se llama así: no se continúa ni se termina hasta cambiarlo, como en Crear encuesta.
  const ciclos = useCiclos()
  const nombreDuplicado = nombreRepetido(borrador.name, ciclos.filter((ciclo) => ciclo.id !== idEnLista.current).map((ciclo) => ciclo.nombre))

  const estado = useMemo(() => estadoDelBorrador(borrador, visitados, semillas), [borrador, visitados, semillas])
  const orden = estado.orden
  const completos = new Set(orden.filter((item) => visitados.has(item) && pasoCompleto(item, estado)))
  const bloqueados = new Set(orden.filter((item) => !pasoAlcanzable(item, estado)))
  const fallidosVivos = new Set([...fallidos].filter((item) => !pasoCompleto(item, estado)))

  // Lo que se guarda lleva dónde se quedó el autor, para retomar ahí al volver.
  const conPosicion = (actual: CicloDraft): CicloDraft => ({ ...actual, _lastStep: paso, _lastSetupBlock: null })

  // Acepta el cambio hecho o una función sobre el borrador más reciente: la IA de una tarjeta rellena sus pasos en
  // cascada y cada etapa tiene que caer sobre la anterior, no sobre el borrador de cuando empezó.
  const cambiar = (cambio: Partial<CicloDraft> | ((actual: CicloDraft) => Partial<CicloDraft>)) => {
    setBorrador((actual) => ({ ...actual, ...(typeof cambio === 'function' ? cambio(actual) : cambio) }))
    setTocado(true)
    setCambiado(true)
    setEstadoGuardado('editando')
  }

  useEffect(() => {
    if (estadoGuardado !== 'editando' || !sePuedeGuardar || falloGuardado) return
    const temporizador = window.setTimeout(() => setEstadoGuardado('guardando'), SEGUNDOS_AUTOGUARDADO * 1000)
    return () => window.clearTimeout(temporizador)
  }, [borrador, estadoGuardado, sePuedeGuardar, falloGuardado])

  // Con `?simular=falla-guardar`, el primer guardado falla; el reintento sí guarda.
  const fallaAhora = () => {
    if (!simulaFalla || yaFallo.current) return false
    yaFallo.current = true
    return true
  }

  // Al terminar de guardar, el ciclo queda en la lista como borrador: salir por cualquier lado no lo pierde.
  useEffect(() => {
    if (estadoGuardado !== 'guardando') return
    const temporizador = window.setTimeout(() => {
      if (fallaAhora()) return avisarFalloGuardado()
      guardarEnLista(idEnLista.current, conPosicion(borrador))
      setEstadoGuardado('guardado')
    }, MS_GUARDANDO)
    return () => window.clearTimeout(temporizador)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estadoGuardado, borrador])

  function avisarFalloGuardado() {
    setEstadoGuardado('editando')
    setFalloGuardado(true)
    notifyAction('No se pudo guardar', 'Tus cambios siguen aquí, pero todavía no quedaron guardados.', { label: 'Reintentar', onClick: reintentarGuardado }, 'error')
  }

  function reintentarGuardado() {
    setFalloGuardado(false)
    setEstadoGuardado('guardando')
  }

  const avisarNombreRepetido = () => {
    setConErrores(true)
    notify('Ya existe un ciclo con este nombre', 'Cámbialo para distinguirlos en la lista y en los resultados.', 'error')
  }

  // Si el recorrido cambia (otro gobierno, sin norte…) y el paso actual ya no existe, se vuelve a la parametrización.
  useEffect(() => {
    if (!orden.includes(paso)) setPaso('general')
  }, [orden, paso])

  const irA = (destino: PasoId) => {
    setPaso(destino)
    setVisitados((previos) => new Set([...previos, destino]))
    // Un paso que se deja guarda dónde quedó el autor sin esperar al siguiente cambio.
    setEstadoGuardado((actual) => (actual === 'guardado' ? 'editando' : actual))
  }

  // Da igual cómo se intente saltar un paso: se busca el primero incompleto y se dice qué falta.
  const pedirPaso = (destino: PasoId) => {
    if (indiceDe(destino, estado) <= indiceDe(paso, estado) || pasoAlcanzable(destino, estado)) return irA(destino)
    const pendiente = primerPendiente(estado, destino)
    setConErrores(true)
    if (pendiente) setFallidos((previos) => new Set([...previos, pendiente.paso]))
    notify(pendiente?.mensaje ?? 'Completa los pasos anteriores para desbloquear este paso.', undefined, 'warning')
  }

  const siguiente = orden[indiceDe(paso, estado) + 1]
  const ultimo = siguiente === undefined

  const continuar = () => {
    if (paso === 'general' && nombreDuplicado) return avisarNombreRepetido()
    const falta = faltaEn(paso, estado)
    if (falta) {
      setConErrores(true)
      return notify(`${falta}.`, undefined, 'warning')
    }
    if (siguiente) irA(siguiente)
  }

  // «Lanzar ciclo» (líderes, colaboradores u otros redactan) avisa a mucha gente y deja el ciclo en marcha: pregunta
  // antes con la tarjeta del ciclo y a cuántas personas llega (regla «preguntar-antes», 8-oct). Editar no avisa a nadie.
  const [lanzando, setLanzando] = useState(false)
  const pideConfirmar = !editando && borrador.objectiveCreator !== null && borrador.objectiveCreator !== 'hr'
  const terminar = () => {
    setLanzando(false)
    if (fallaAhora()) return avisarFalloGuardado()
    saliendo.current = true
    guardarEnLista(idEnLista.current, conPosicion(borrador), true)
    notify(...avisoFinal(borrador, editando), 'success')
    navigate(RUTA_OBJETIVOS)
  }

  // «Finalizar» o «Lanzar ciclo» revisa todos los pasos del recorrido a la vez: los que fallan quedan en rojo, deja en
  // el primero y sale un solo mensaje que resume.
  const finalizar = () => {
    if (nombreDuplicado) {
      irA('general')
      return avisarNombreRepetido()
    }
    const todos = estadoDelBorrador(borrador, new Set(orden), semillas)
    const { fallidos: pendientes, mensaje } = resumenFinalizar(todos)
    if (pendientes.length > 0) {
      setFallidos(new Set(pendientes))
      setConErrores(true)
      irA(pendientes[0])
      return notify(mensaje, undefined, 'warning')
    }
    if (pideConfirmar) return setLanzando(true)
    terminar()
  }

  const marca = useRecorteBajoEncabezado()
  useEffect(() => {
    contenedorDeScroll(marca.current)?.scrollTo({ top: 0 })
  }, [paso, marca])

  // El estado de la propuesta para empresa ya no se usa porque se quitó el botón de IA.

  const abrirAgente = (pedidoIa: PedidoIa) => {
    if (!grande) return notify('El agente se abre en pantallas más anchas', 'Amplía la ventana para crear objetivos con IA.', 'info')
    // Conservar una propuesta cierra el agente, venga de la empresa o del panel de una asignación (que puede cerrarse solo al guardarse).
    const pedido: PedidoIa = {
      ...pedidoIa,
      onConservar: () => {
        pedidoIa.onConservar()
        setAgente((actual) => (actual ? { ...actual, abierto: false } : actual))
      },
    }
    setAgente((actual) => ({ abierto: true, clave: (actual?.clave ?? 0) + 1, pedido }))
  }

  const resolverSemilla = (tipo: ObjectiveSetKind) => setSemillas((previas) => previas.filter((semilla) => semilla.kind !== tipo))

  const actual = pasoDe(paso)
  const creador = borrador.objectiveCreator
  // Como en Crear encuesta, la bajada de la cabecera dice qué se decide en el paso; en Participantes, con quién redacta.
  const descripcionPaso = paso === 'participants' && creador && creador !== 'hr' ? CICLO_PARTICIPANTS_DESCRIPTIONS[creador] : actual.descripcion
  // Días que faltan para iniciar si el borrador no tiene a nadie y la fecha está a una semana o menos (o ya pasó); si no,
  // null. Como en Crear encuesta: se dice en Participantes, donde se resuelve.
  const sinParticipantesCerca = (() => {
    if (!borrador.startDate || totalParticipantCount(borrador.participants) > 0) return null
    const dias = Math.round((new Date(`${borrador.startDate}T00:00:00`).getTime() - startOfToday().getTime()) / 86_400_000)
    return Number.isNaN(dias) || dias > DIAS_AVISO_SIN_PARTICIPANTES ? null : dias
  })()

  return (
    <PageShell>
      <span ref={marca} aria-hidden="true" />
      <PageHeader
        className="pb-4"
        // El título no cambia con el nombre (ese se escribe en la parametrización); la bajada dice qué se decide en el paso.
        title={id ? 'Editar ciclo' : 'Crear ciclo de objetivos'}
        description={`Paso ${indiceDe(paso, estado) + 1} de ${orden.length} · ${descripcionPaso}`}
        actions={
          // La salida del sistema, sin `salida`: pasa por el mismo freno que cualquier otra (barra lateral, «atrás» del
          // navegador), que pregunta con VentanaSalir más abajo.
          <BotonSalirCreacion texto={id ? 'Salir de la edición' : 'Salir de la creación'} onClick={() => navigate(RUTA_OBJETIVOS)} />
        }
      />

      <PageContent>
        {/* Anuncia el paso al avanzar o retroceder: el foco se queda en el botón y el cambio no se oiría. */}
        <span role="status" className="sr-only">
          Paso {indiceDe(paso, estado) + 1} de {orden.length}: {actual.titulo}
        </span>

        <div className="flex flex-col gap-6">
          {/* Como «La fecha de inicio ya pasó» de Crear encuesta (CRE-120): un borrador nunca pasó a «Por iniciar», así
              que al llegar su inicio no arrancó. Arriba, en todos los pasos, hasta que se elijan fechas nuevas. */}
          {inicioVencidoEnBorrador(borrador) ? (
            <Alert variant="warning">
              <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />
              <AlertTitle>La fecha de inicio ya pasó</AlertTitle>
              <AlertDescription>Este ciclo nunca arrancó porque sigue en borrador. Elige fechas nuevas en «Parametrización» para programarlo al terminar.</AlertDescription>
            </Alert>
          ) : null}
          {/* La fila de pasos del sistema (PasosFila), con el recorrido que decide la parametrización. */}
          <PasosFila
            pasos={orden.map((item) => ({ id: item, titulo: pasoDe(item).titulo }))}
            paso={paso}
            completos={completos}
            bloqueados={bloqueados}
            fallidos={fallidosVivos}
            onPaso={(destino) => pedirPaso(destino as PasoId)}
          />

          {/* El trabajo a la izquierda y «Así va el ciclo» a la derecha, que se queda a la vista al bajar. Con el agente
              de IA acoplado el panel se oculta: el agente ya ocupa ese lado. */}
          <div className={acoplado ? 'min-w-0' : 'grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]'}>
            <div className="min-w-0">
              {paso === 'general' ? (
                <PasoParametrizacion
                  borrador={borrador}
                  onCambio={cambiar}
                  conErrores={conErrores}
                  nombreDuplicado={nombreDuplicado}
                  descripcionActiva={descripcionActiva}
                  onDescripcionActiva={setDescripcionActiva}
                />
              ) : paso === 'participants' ? (
                // Como en Crear encuesta: sin título aparte (las cajas del paso traen el suyo; con quién redacta va en la bajada
                // de la cabecera) y, si el inicio está cerca y no hay nadie, el aviso arriba.
                <section className="flex flex-col gap-4" aria-label="Participantes">
                  {sinParticipantesCerca !== null ? (
                    <Alert variant="warning">
                      <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />
                      <AlertDescription>
                        {sinParticipantesCerca < 0 ? 'La fecha de inicio ya pasó' : sinParticipantesCerca === 0 ? 'Este ciclo inicia hoy' : `Este ciclo inicia en ${sinParticipantesCerca} ${sinParticipantesCerca === 1 ? 'día' : 'días'}`} y todavía no tiene participantes. Sin ellos no puede pasar a «Por iniciar» ni arrancar.
                      </AlertDescription>
                    </Alert>
                  ) : null}
                  <PasoParticipantes
                    seleccion={borrador.participants}
                    respondieron={conAvance}
                    contexto="ciclo"
                    onCambio={(cambio) => {
                      // Los grupos de «Objetivos asignados» son los de aquí: la asignación toma su misma categoría.
                      // Y el nivel de reparto sigue a lo que se marca: grupos y personas sueltas → mixto, solo grupos → por
                      // grupos, solo personas → individual. Colaboradores y Otros tienen el individual fijo y no se tocan.
                      const participants = { ...borrador.participants, ...cambio }
                      const nivel = creador === 'collaborator' || creador === 'custom' ? null : nivelPorParticipantes(participants)
                      cambiar({
                        participants,
                        assignment: { ...borrador.assignment, groupSegmentBy: segmentoDeGrupos({ participants, assignment: borrador.assignment }) },
                        ...(nivel ? levelsForAssignment(nivel) : {}),
                      })
                    }}
                    sugeridos={new Set([
                      ...(borrador.useGroupObjectives ? (['grupos'] as const) : []),
                      ...(borrador.useIndividualObjectives ? (['personas'] as const) : [])
                    ])}
                  />
                  {conErrores && faltaEn('participants', estado) ? (
                    <Alert variant="warning">
                      <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" />
                      <AlertDescription>Selecciona al menos un participante para poder continuar.</AlertDescription>
                    </Alert>
                  ) : null}
                </section>
              ) : paso === 'company' ? (
                <PasoEmpresa borrador={borrador} onCambio={cambiar} conErrores={conErrores}  propuesta={new Set()} agenteAbierto={acoplado && agente?.pedido.alcance === 'empresa'} />
              ) : paso === 'objectives' ? (
                <PasoAsignados
                  borrador={borrador}
                  onCambio={cambiar}
                  conErrores={conErrores}
                  semillas={semillas}
                  onSemillaResuelta={resolverSemilla}
                  onCambiarNivel={() => irA('general')}
                  onCrearConIa={abrirAgente}
                  agenteAbierto={acoplado}
                />
              ) : (
                <PasoAlineacion borrador={borrador} onSets={(objectiveSets) => cambiar({ objectiveSets })} onIrAEmpresa={() => irA('company')} onCrearAsignacion={() => irA('objectives')} conErrores={conErrores} />
              )}
            </div>
            {acoplado ? null : (
              <aside aria-label="Así va el ciclo" className="lg:sticky lg:top-4">
                <ResumenCiclo borrador={borrador} paso={paso} estado={estado} />
              </aside>
            )}
          </div>
        </div>

        {/* La barra de acciones de Encuestas: el estado del guardado a la izquierda —es automático, solo se informa— y Atrás
            y Continuar, Finalizar o Lanzar ciclo a la derecha. */}
        {/* La barra de los pasos del sistema (BarraPasos, 13-oct): «Atrás» desde el paso 2 y «Continuar». */}
        <BarraPasos
          className="mt-auto!"
          inicio={
            <>
              {tocado ? <ChipGuardado estado={estadoChip} /> : null}
              {falloGuardado ? (
                <>
                  <Text as="span" size="sm" variant="destructive" role="alert">
                    No se pudo guardar
                  </Text>
                  <Button variant="outline" size="sm" onClick={reintentarGuardado}>
                    Reintentar
                  </Button>
                </>
              ) : null}
              {!tocado || sePuedeGuardar ? null : (
                <Text as="span" size="sm" variant="muted">
                  Ponle un nombre al ciclo para que se guarde.
                </Text>
              )}
            </>
          }
          paso={indiceDe(paso, estado) + 1}
          onAtras={() => irA(orden[indiceDe(paso, estado) - 1])}
          // Guardar a mano: lo mismo que hace el autoguardado, sin esperar los 3 segundos. Sin nombre no hay a dónde guardar
          // (el aviso de la izquierda lo explica). Al editar un ciclo ya publicado no sale: su botón es «Guardar ciclo» (22-oct).
          onGuardar={editando ? undefined : reintentarGuardado}
          guardarDeshabilitado={estadoGuardado === 'guardando' || !sePuedeGuardar}
          // El verbo del flujo, como «Crear encuesta» o «Guardar encuesta»: al editar un ciclo que ya existe, «Guardar ciclo».
          principal={{ texto: ultimo ? (editando ? 'Guardar ciclo' : etiquetaFinal(borrador)) : undefined, onClick: ultimo ? finalizar : continuar }}
        />
      </PageContent>

      {/* El hueco de Orbit del sistema (AgentDock, regla «orbit-un-solo-panel», 13-oct): entra y sale igual que en las
          demás pantallas. */}
      {hueco && agente
        ? createPortal(
            <AgentDock open={acoplado}>
              <PanelObjetivosIa key={agente.clave} borrador={borrador} pedido={agente.pedido} onCambio={cambiar} onClose={() => setAgente({ ...agente, abierto: false })} />
            </AgentDock>,
            hueco,
          )
        : null}

      {/* La ventana de confirmar del design system, con los mismos textos que en Encuestas: título fijo y el ciclo en la
          tarjeta del registro. La X (o Escape) cierra y se queda en el constructor. Con cambios sin guardar, las dos
          salidas guardan; si ya se autoguardó, es una salida normal; y si el ciclo aún no tiene nombre (no se guarda), avisa
          que se pierde lo que lleva. */}
      <DialogoConfirmar
        abierto={lanzando}
        onAbiertoChange={setLanzando}
        icono={Rocket01Icon}
        titulo="¿Publicar el ciclo?"
        descripcion={avisoFinal(borrador, editando)[1]}
        accion="Publicar"
        onConfirmar={terminar}
      >
        <RegistroConfirmar
          icono={Rocket01Icon}
          nombre={borrador.name.trim() || 'Ciclo sin título'}
          detalle={`${formatCount(totalParticipantCount(borrador.participants))} ${totalParticipantCount(borrador.participants) === 1 ? 'participante' : 'participantes'} · ${
            borrador.objectiveCreator === 'leader' ? 'el aviso les llega a sus líderes' : 'el aviso les llega a cada uno'
          }`}
          tono="neutro"
        />
      </DialogoConfirmar>

      <VentanaSalir
        abierto={salidaBloqueada !== null}
        onAbiertoChange={(abierto) => (abierto ? undefined : salidaBloqueada?.reset())}
        texto={id ? 'Salir de la edición' : 'Salir de la creación'}
        borrador={estadoChip === 'guardado' || sePuedeGuardar}
        mensaje={
          sePuedeGuardar || estadoChip === 'guardado'
            ? `«${borrador.name.trim() || 'Ciclo sin título'}» queda guardado como borrador. Puedes retomarlo cuando quieras desde Objetivos.`
            : 'Este ciclo todavía no tiene nombre, así que no se guarda y se pierde lo que llevas. Ponle un nombre para conservarlo.'
        }
        onSalir={() => {
          // Como en Crear contenido: salir guarda lo que faltaba por guardar, sin un botón aparte. Si no se puede guardar,
          // no sale: se queda con el aviso y «Reintentar», como en Crear encuesta.
          if (estadoChip !== 'guardado' && sePuedeGuardar) {
            if (fallaAhora()) {
              salidaBloqueada?.reset()
              return avisarFalloGuardado()
            }
            guardarEnLista(idEnLista.current, conPosicion(borrador))
          }
          salidaBloqueada?.proceed()
        }}
      />
    </PageShell>
  )
}

Component.displayName = 'AdminDesempenoCulturaObjetivosCrearPage'
