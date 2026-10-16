import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon, ArrowRight01Icon, Logout01Icon } from '@hugeicons/core-free-icons'
import { useBlocker, useLocation, useNavigate, useParams } from 'react-router'
import { Button, Text } from '@ubits/flux-ui'
import { Aviso } from '@/modules/admin/seleccion/vacantes/crear/components/piezas-resumen'
import { DialogoConfirmar } from '@/modules/design-system/estados/confirmaciones'
import { notify } from '@/shared/components/notify'
import { setRightPanelOpen } from '@/shared/components/right-panel-store'
import { useRecorteBajoEncabezado, contenedorDeScroll } from '@/shared/components/encabezado-fijo'
import { ChipGuardado, type EstadoGuardado } from '@/shared/components/ChipGuardado'
import { useHuecoDerecho, usePantallaGrande } from '@/modules/admin/seleccion/vacantes/detalle/components/agente-acoplado'
import { PageActionBar, PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { EncabezadoPaso } from '../../encuestas/components/pasos-drawer'
import { PasoParticipantes } from '../../encuestas/crear/components/paso-participantes'
import { cicloPorId, guardarCiclo } from '../components/almacen'
import { borradorDeCiclo, borradorDesdePlantilla, cicloDeBorrador, createBlankCicloDraft, plantillaPorId } from '../modelo/borrador'
import { CICLO_PARTICIPANTS_DESCRIPTIONS, assignedObjectiveCount, type CicloBuilderAssignmentSeed, type CicloDraft, type ObjectiveSetKind } from '../modelo/constructor/cicloBuilderTypes'
import { resumeCicloStep, visitedStepsUpTo } from '../modelo/constructor/cicloStepper'
import { PasoParametrizacion } from './components/parametrizacion/paso-parametrizacion'
import { PasoEmpresa } from './components/empresa/paso-empresa'
import { PasoAsignados } from './components/asignados/paso-asignados'
import { PasoAlineacion } from './components/alineacion/paso-alineacion'
import { PanelObjetivosIa } from './components/ia/panel-objetivos-ia'
import type { PedidoIa } from './components/ia/pedido'
import { estadoDelBorrador, etiquetaFinal, faltaEn, indiceDe, pasoAlcanzable, pasoCompleto, pasoDe, primerPendiente, resumenFinalizar, type PasoId } from './components/pasos'
import { PasosCiclo } from './components/pasos-ciclo'
import { ResumenCiclo } from './components/resumen-ciclo'
import { nivelPorParticipantes, segmentoDeGrupos } from '../modelo/constructor/participantesCiclo'
import { levelsForAssignment } from '../modelo/constructor/cicloSetup'

// El constructor de ciclos de objetivos, armado igual que «Crear encuesta» y «Crear vacante»: los pasos en una fila
// arriba, el trabajo a la izquierda, el panel «Así va el ciclo» a la derecha y la barra de acciones fija abajo, con el
// autoguardado, el freno de salida y los mismos avisos. Lo que cambia es el recorrido: lo decide la parametrización
// (paso 1). RRHH escribe y reparte los objetivos hasta la alineación y termina con «Finalizar»; con líderes,
// colaboradores u otros, el administrador elige a la gente, escribe el norte y termina con «Lanzar ciclo».
//
// Se abre en blanco, desde una plantilla (los objetivos de empresa entran puestos y los de grupo e individuales esperan
// destinatario en el paso de objetivos asignados), para editar un ciclo de la lista (retoma donde se dejó) o directo en
// un paso (participantes, u objetivos con su pestaña).

const RUTA_OBJETIVOS = '/admin/desempeno-cultura/objetivos'
const SEGUNDOS_AUTOGUARDADO = 3
const MS_GUARDANDO = 700

type Pedido = { plantilla?: string; paso?: PasoId; pestana?: 'groups' | 'individual' } | null

interface Inicio {
  borrador: CicloDraft
  semillas: readonly CicloBuilderAssignmentSeed[]
}

function inicioDe(id: string | undefined, plantilla: string | undefined): Inicio {
  if (id) {
    const ciclo = cicloPorId(id)
    if (ciclo) return { borrador: borradorDeCiclo(ciclo), semillas: [] }
  }
  const base = plantilla ? plantillaPorId(plantilla) : undefined
  return base ? borradorDesdePlantilla(base) : { borrador: createBlankCicloDraft(), semillas: [] }
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

export function Component() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const pedido = location.state as Pedido

  const [inicio] = useState(() => inicioDe(id, pedido?.plantilla))
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
  const [tocado, setTocado] = useState(Boolean(id))
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
  // Un ciclo nuevo sin nombre no entra a la lista (sería una fila vacía): mientras no esté en ella no hay nada guardado,
  // así que el chip no puede decir «Guardado» y el autoguardado no arranca (no hay a dónde guardar).
  const enLista = cicloPorId(idEnLista.current) !== undefined
  const sePuedeGuardar = enLista || borrador.name.trim() !== ''
  const estadoChip: EstadoGuardado = estadoGuardado === 'guardado' && !enLista ? 'editando' : estadoGuardado
  const saliendo = useRef(false)
  // Toda salida del constructor pregunta, aunque ya se haya autoguardado; solo Finalizar o Lanzar salen directo.
  const bloqueoSalida = useBlocker(({ currentLocation, nextLocation }) => !saliendo.current && currentLocation.pathname !== nextLocation.pathname)
  const salidaBloqueada = bloqueoSalida.state === 'blocked' ? bloqueoSalida : null

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
    setEstadoGuardado('editando')
  }

  useEffect(() => {
    if (estadoGuardado !== 'editando' || !sePuedeGuardar) return
    const temporizador = window.setTimeout(() => setEstadoGuardado('guardando'), SEGUNDOS_AUTOGUARDADO * 1000)
    return () => window.clearTimeout(temporizador)
  }, [borrador, estadoGuardado, sePuedeGuardar])

  // Al terminar de guardar, el ciclo queda en la lista como borrador: salir por cualquier lado no lo pierde.
  useEffect(() => {
    if (estadoGuardado !== 'guardando') return
    const temporizador = window.setTimeout(() => {
      guardarEnLista(idEnLista.current, conPosicion(borrador))
      setEstadoGuardado('guardado')
    }, MS_GUARDANDO)
    return () => window.clearTimeout(temporizador)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estadoGuardado, borrador])

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
    notify(pendiente?.mensaje ?? 'Completa los pasos anteriores para desbloquear este paso.')
  }

  const siguiente = orden[indiceDe(paso, estado) + 1]
  const ultimo = siguiente === undefined

  const continuar = () => {
    const falta = faltaEn(paso, estado)
    if (falta) {
      setConErrores(true)
      return notify(`${falta}.`)
    }
    if (siguiente) irA(siguiente)
  }

  // «Finalizar» o «Lanzar ciclo» revisa todos los pasos del recorrido a la vez: los que fallan quedan en rojo, deja en
  // el primero y sale un solo mensaje que resume.
  const finalizar = () => {
    const todos = estadoDelBorrador(borrador, new Set(orden), semillas)
    const { fallidos: pendientes, mensaje } = resumenFinalizar(todos)
    if (pendientes.length > 0) {
      setFallidos(new Set(pendientes))
      setConErrores(true)
      irA(pendientes[0])
      return notify(mensaje)
    }
    saliendo.current = true
    guardarEnLista(idEnLista.current, conPosicion(borrador), true)
    notify(...avisoFinal(borrador, editando))
    navigate(RUTA_OBJETIVOS)
  }

  const marca = useRecorteBajoEncabezado()
  useEffect(() => {
    contenedorDeScroll(marca.current)?.scrollTo({ top: 0 })
  }, [paso, marca])

  // El estado de la propuesta para empresa ya no se usa porque se quitó el botón de IA.

  const abrirAgente = (pedidoIa: PedidoIa) => {
    if (!grande) return notify('El agente se abre en pantallas más anchas', 'Amplía la ventana para crear objetivos con IA.')
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

  return (
    <PageShell>
      <span ref={marca} aria-hidden="true" />
      <PageHeader
        className="pb-4"
        // El título no cambia con el nombre (ese se escribe en la parametrización); la bajada dice qué se decide en el paso.
        title={id ? 'Editar ciclo' : 'Crear ciclo de objetivos'}
        description={`Paso ${indiceDe(paso, estado) + 1} de ${orden.length} · ${actual.descripcion}`}
        actions={
          // Pasa por el mismo freno que cualquier otra salida: siempre pregunta antes de salir.
          <Button variant="outline" onClick={() => navigate(RUTA_OBJETIVOS)}>
            <HugeiconsIcon icon={Logout01Icon} aria-hidden="true" />
            {id ? 'Salir de la edición' : 'Salir de la creación'}
          </Button>
        }
      />

      <PageContent>
        {/* Anuncia el paso al avanzar o retroceder: el foco se queda en el botón y el cambio no se oiría. */}
        <span role="status" className="sr-only">
          Paso {indiceDe(paso, estado) + 1} de {orden.length}: {actual.titulo}
        </span>

        <div className="flex flex-col gap-6">
          <PasosCiclo orden={orden} paso={paso} completos={completos} bloqueados={bloqueados} fallidos={fallidosVivos} onPaso={pedirPaso} />

          {/* El trabajo a la izquierda y «Así va el ciclo» a la derecha, que se queda a la vista al bajar. Con el agente
              de IA acoplado el panel se oculta: el agente ya ocupa ese lado. */}
          <div className={acoplado ? 'min-w-0' : 'grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]'}>
            <div className="min-w-0">
              {paso === 'general' ? (
                <PasoParametrizacion
                  borrador={borrador}
                  onCambio={cambiar}
                  conErrores={conErrores}
                  descripcionActiva={descripcionActiva}
                  onDescripcionActiva={setDescripcionActiva}
                />
              ) : paso === 'participants' ? (
                <section className="flex flex-col gap-4" aria-label="Participantes">
                  <EncabezadoPaso titulo="Participantes" descripcion={creador && creador !== 'hr' ? CICLO_PARTICIPANTS_DESCRIPTIONS[creador] : 'Elige quiénes entran al ciclo.'} />
                  <PasoParticipantes 
                    seleccion={borrador.participants} 
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
                    <Aviso tono="warning">Selecciona al menos un participante para poder continuar.</Aviso>
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
        <PageActionBar className="mt-auto!">
          <div className="flex min-w-0 items-center gap-3">
            {tocado ? <ChipGuardado estado={estadoChip} /> : null}
            {!tocado || sePuedeGuardar ? null : (
              <Text as="span" size="sm" variant="muted">
                Ponle un nombre al ciclo para que se guarde.
              </Text>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            {/* Como en Crear contenido: «Volver» siempre a la vista, apagado en el primer paso. */}
            <Button variant="outline" disabled={indiceDe(paso, estado) === 0} onClick={() => irA(orden[indiceDe(paso, estado) - 1])}>
              <HugeiconsIcon icon={ArrowLeft01Icon} aria-hidden="true" />
              Volver
            </Button>
            {ultimo ? (
              <Button onClick={finalizar}>{etiquetaFinal(borrador)}</Button>
            ) : (
              <Button onClick={continuar}>
                Continuar
                <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />
              </Button>
            )}
          </div>
        </PageActionBar>
      </PageContent>

      {hueco && acoplado && agente
        ? createPortal(
            <div className="flex h-svh shrink-0">
              <PanelObjetivosIa key={agente.clave} borrador={borrador} pedido={agente.pedido} onCambio={cambiar} onClose={() => setAgente({ ...agente, abierto: false })} />
            </div>,
            hueco,
          )
        : null}

      {/* La ventana de confirmar del design system, con los mismos textos que en Encuestas: título fijo y el ciclo en la
          tarjeta del registro. La X (o Escape) cierra y se queda en el constructor. Con cambios sin guardar, las dos
          salidas guardan; si ya se autoguardó, es una salida normal; y si el ciclo aún no tiene nombre (no se guarda), avisa
          que se pierde lo que lleva. */}
      <DialogoConfirmar
        abierto={salidaBloqueada !== null}
        onAbiertoChange={(abierto) => (abierto ? undefined : salidaBloqueada?.reset())}
        icono={Logout01Icon}
        titulo={id ? '¿Salir de la edición?' : '¿Salir de la creación?'}
        descripcion={
          sePuedeGuardar || estadoChip === 'guardado'
            ? `«${borrador.name.trim() || 'Ciclo sin título'}» queda guardado como borrador. Puedes retomarlo cuando quieras desde Objetivos.`
            : 'Este ciclo todavía no tiene nombre, así que no se guarda y se pierde lo que llevas. Ponle un nombre para conservarlo.'
        }
        cancelar="Seguir aquí"
        accion={id ? 'Salir de la edición' : 'Salir de la creación'}
        destructiva={estadoChip !== 'guardado' && !sePuedeGuardar}
        onConfirmar={() => {
          // Como en Crear contenido: salir guarda lo que faltaba por guardar, sin un botón aparte.
          if (estadoChip !== 'guardado' && sePuedeGuardar) guardarEnLista(idEnLista.current, conPosicion(borrador))
          salidaBloqueada?.proceed()
        }}
      />
    </PageShell>
  )
}

Component.displayName = 'AdminDesempenoCulturaObjetivosCrearPage'
